// Renaming an academic term (its academic year or semester) everywhere it is written down.
//
// Most term details (dates, status, enrollment/pre-enlistment/add-drop windows, capacity, grade deadlines) are read
// live from academicPeriods, so they are always in sync. The term's *name* (academic year + semester) is copied
// into other records, though: Term Subjects offerings, class schedules, grade sheets, students' current semester and
// academic history, enrollment / pre-enlistment / add-drop requests, admission registrations and payments. When the
// Registrar renames a term, those records are updated to the new name so every section keeps showing them together.

import { Firestore, collection, doc, getDocs, query, where, writeBatch } from 'firebase/firestore';
import { normAY, sameTerm, semesterKind, termKeyOf, termLabel } from './reenrollment';

export interface TermName {
  academicYear: string;
  semester: string;
}

export interface TermRenameCounts {
  termSubjects: number;
  classSchedules: number;
  gradeSheets: number;
  students: number;
  enrollments: number;
  preEnlistments: number;
  addDrop: number;
  applications: number;
  payments: number;
}

interface PlannedUpdate {
  path: [string, ...string[]];
  data: Record<string, unknown>;
}

const squash = (s?: string) => String(s || '').toLowerCase().replace(/[^a-z0-9]/g, '');

/** Same academic year and semester (spelling variants such as "2026-2027" / "1st Sem" match). */
function isTerm(academicYear: unknown, semester: unknown, t: TermName): boolean {
  if (!academicYear || normAY(String(academicYear)) !== normAY(t.academicYear)) return false;
  const a = semesterKind(String(semester || ''));
  const b = semesterKind(t.semester);
  return a || b ? a === b : squash(String(semester || '')) === squash(t.semester);
}

export function termNameChanged(from: TermName, to: Partial<TermName>): boolean {
  return (
    (to.academicYear !== undefined && normAY(to.academicYear) !== normAY(from.academicYear)) ||
    (to.semester !== undefined && squash(to.semester) !== squash(from.semester))
  );
}

/** Everything that names the old term, and the change that gives it the new name. */
export async function planTermRename(db: Firestore, from: TermName, to: TermName): Promise<{ updates: PlannedUpdate[]; counts: TermRenameCounts }> {
  const ay = normAY(to.academicYear);
  const sem = to.semester.trim();
  const oldLabel = termLabel(from.semester, from.academicYear);
  const newLabel = termLabel(sem, ay);
  const oldKey = termKeyOf(from.semester, from.academicYear);
  const newKey = termKeyOf(sem, ay);
  const updates: PlannedUpdate[] = [];
  const counts: TermRenameCounts = { termSubjects: 0, classSchedules: 0, gradeSheets: 0, students: 0, enrollments: 0, preEnlistments: 0, addDrop: 0, applications: 0, payments: 0 };
  const all = async (name: string): Promise<Record<string, any>[]> => (await getDocs(collection(db, name))).docs.map((d) => ({ ...d.data(), id: d.id }));

  for (const o of await all('academicSubjects')) {
    if (!isTerm(o.academicYear, o.semester, from)) continue;
    updates.push({ path: ['academicSubjects', o.id], data: { academicYear: ay, semester: sem } });
    counts.termSubjects++;
  }
  for (const c of await all('classSections')) {
    if (!isTerm(c.academicYear, c.semester, from)) continue;
    updates.push({ path: ['classSections', c.id], data: { academicYear: ay, semester: sem } });
    counts.classSchedules++;
  }
  for (const name of ['gradeSheets', 'gradeAmendments']) {
    const snap = await getDocs(query(collection(db, name), where('termKey', '==', oldKey)));
    for (const d of snap.docs) {
      updates.push({ path: [name, d.id], data: name === 'gradeSheets' ? { termKey: newKey, academicYear: ay, semester: sem } : { termKey: newKey } });
      if (name === 'gradeSheets') counts.gradeSheets++;
    }
  }
  for (const s of await all('studentProfiles')) {
    const data: Record<string, unknown> = {};
    if (sameTerm(s.currentSemester, oldLabel)) data.currentSemester = newLabel;
    if (isTerm(s.academicYear, s.semester, from)) Object.assign(data, { academicYear: ay, semester: sem });
    const history = Array.isArray(s.subjectHistory) ? s.subjectHistory : [];
    if (history.some((h: any) => isTerm(h?.academicYear, h?.semester, from))) {
      data.subjectHistory = history.map((h: any) => (isTerm(h?.academicYear, h?.semester, from) ? { ...h, academicYear: ay, semester: sem } : h));
    }
    const terms = Array.isArray(s.termHistory) ? s.termHistory : [];
    if (terms.some((t: any) => isTerm(t?.academicYear, t?.semester, from))) {
      data.termHistory = terms.map((t: any) => (isTerm(t?.academicYear, t?.semester, from) ? { ...t, academicYear: ay, semester: sem, term: newLabel } : t));
    }
    if (!Object.keys(data).length) continue;
    updates.push({ path: ['studentProfiles', s.id], data });
    counts.students++;
  }
  for (const e of await all('enrollments')) {
    if (!(isTerm(e.schoolYear, e.semester, from) || e.termKey === oldKey)) continue;
    updates.push({ path: ['enrollments', e.id], data: { schoolYear: ay, semester: sem, ...(e.termKey ? { termKey: newKey } : {}) } });
    counts.enrollments++;
  }
  for (const [name, key] of [['preEnlistments', 'preEnlistments'], ['addDropRequests', 'addDrop']] as const) {
    for (const r of await all(name)) {
      if (!isTerm(r.academicYear, r.semester, from)) continue;
      updates.push({ path: [name, r.id], data: { academicYear: ay, semester: sem } });
      counts[key]++;
    }
  }
  for (const a of await all('applications')) {
    const reg = a.registration;
    if (!reg || !isTerm(reg.academicYear, reg.semester, from)) continue;
    updates.push({ path: ['applications', a.id], data: { registration: { ...reg, academicYear: ay, semester: sem } } });
    counts.applications++;
  }
  for (const p of await all('studentPayments')) {
    if (!sameTerm(p.term, oldLabel)) continue;
    updates.push({ path: ['studentPayments', p.id], data: { term: newLabel } });
    counts.payments++;
  }
  return { updates, counts };
}

/** Writes the planned changes (in batches) and returns how many records were updated. */
export async function applyTermRename(db: Firestore, updates: PlannedUpdate[]): Promise<number> {
  const now = new Date().toISOString();
  for (let i = 0; i < updates.length; i += 400) {
    const batch = writeBatch(db);
    for (const u of updates.slice(i, i + 400)) {
      const [col, ...rest] = u.path;
      batch.set(doc(db, col, ...rest), { ...u.data, updatedAt: now }, { merge: true });
    }
    await batch.commit();
  }
  return updates.length;
}

export function describeRenameCounts(c: TermRenameCounts): string {
  const parts: [number, string][] = [
    [c.termSubjects, 'Term Subjects'],
    [c.classSchedules, 'class schedules'],
    [c.gradeSheets, 'grade sheets'],
    [c.students, 'student records'],
    [c.enrollments, 'enrollment requests'],
    [c.preEnlistments, 'pre-enlistments'],
    [c.addDrop, 'add/drop requests'],
    [c.applications, 'admission registrations'],
    [c.payments, 'payments'],
  ];
  return parts.filter(([n]) => n > 0).map(([n, l]) => `${n} ${l}`).join(', ') || 'no other records';
}
