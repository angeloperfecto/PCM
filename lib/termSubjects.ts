// Subjects offered in an academic term, per program and year level ("Term Subjects").
//
// A term's subjects are the course-catalog offerings (`academicSubjects`) assigned to that term
// (semester + academic year), each optionally for one program and year level. The Registrar sets them
// up in Enrollment & Records → Term Subjects whenever a term is created. Every student-facing screen
// (applicant registration, re-enrollment, pre-enlistment, adding & dropping) uses
// `studentTermSubjects`, so they all list the same subjects for the same student and term.
//
// Older catalog entries that were never assigned to a term (no academic year) are still used for a
// term that has no subjects set up yet, so enrollment keeps working until the Registrar sets it up.

import { doc, getDoc, writeBatch } from 'firebase/firestore';
import { db } from './firebase';
import { YEAR_LEVELS, normalizeYearLevel, subjectsForProgram } from './curriculum';
import { completedSubjects, normAY, normCode, offeredSubjects, prerequisiteCodes, sameTerm, semesterKind, termKeyOf, termLabel, type CompletedSubject, type OfferedSubject } from './reenrollment';
import type { AcademicProgram, AcademicSubject, CurriculumSubject, StudentProfile } from './types';

export type TermRef = { semester?: string; academicYear?: string };

const squash = (s?: string) => String(s || '').toLowerCase().replace(/[^a-z0-9]/g, '');
const yearIdx = (y?: string) => YEAR_LEVELS.indexOf(normalizeYearLevel(y) || String(y || ''));

/** True when the offering is assigned to this term (same academic year and semester). */
export function isTermOffering(o: Partial<AcademicSubject>, term: TermRef | null | undefined): boolean {
  if (!term || !o.academicYear || normAY(o.academicYear) !== normAY(term.academicYear)) return false;
  const a = semesterKind(o.semester);
  const b = semesterKind(term.semester);
  return a || b ? a === b : squash(o.semester) === squash(term.semester);
}

/** The term's offerings (not removed), all programs and year levels. */
export function termOfferings(catalog: AcademicSubject[], term: TermRef | null | undefined): AcademicSubject[] {
  return (catalog || []).filter((o) => o && !o.isArchived && isTermOffering(o, term));
}

/** Older catalog entries never assigned to a term. */
export function unassignedOfferings(catalog: AcademicSubject[]): AcademicSubject[] {
  return (catalog || []).filter((o) => o && !o.isArchived && !o.academicYear);
}

/**
 * Offerings with no program are open to every program. Otherwise the same program by id, or by name
 * (as the curriculum is matched), so two program records with the same name share their subjects.
 */
export function offeringForProgram(o: Partial<AcademicSubject> & { programId?: string }, program: Partial<AcademicProgram> | null | undefined): boolean {
  if (!o.programId && !o.program) return true;
  if (!program) return true;
  if (o.programId && program.id && o.programId === program.id) return true;
  const names = [program.name, (program as any).title, program.code].map(squash).filter(Boolean);
  return names.includes(squash(o.program));
}

export interface StudentTermSubject extends OfferedSubject {
  id: string;
  /** Catalog offering id ('' when the term has no subjects set up and none matches). */
  offeringId: string;
  section: string;
  capacity: number;
  enrolledCount: number;
  full: boolean;
  closed: boolean;
  category?: string;
  description?: string;
  /** The student is already enrolled in this subject in this term (can't be taken twice). */
  alreadyEnrolled?: boolean;
}

export interface StudentTermSubjects {
  /** The Registrar has set up subjects for this term. */
  configured: boolean;
  subjects: StudentTermSubject[];
  /** Curriculum subjects for this semester and year level that are not offered this term. */
  notOffered: { code: string; title: string; units: number; yearLevel: string }[];
  /** Subjects for this term (offered or in the curriculum) the student has already passed or been credited. */
  completed: (CompletedSubject & { yearLevel: string })[];
}

const fromOffering = (o: AcademicSubject, extra: Partial<StudentTermSubject>): StudentTermSubject => ({
  id: o.id,
  offeringId: o.id,
  code: o.code,
  title: o.title,
  units: Number(o.units) || 0,
  schedule: o.schedule || 'TBA',
  room: o.room || 'TBA',
  instructor: o.instructor || 'TBA',
  section: o.section || '',
  capacity: Number(o.capacity) || 0,
  enrolledCount: Number(o.enrolledCount) || 0,
  full: !!o.capacity && (Number(o.enrolledCount) || 0) >= Number(o.capacity),
  closed: o.status === 'Closed',
  category: o.category || '',
  description: o.description || '',
  yearLevel: normalizeYearLevel(o.yearLevel) || o.yearLevel || '',
  backSubject: false,
  prerequisitesMet: true,
  ...extra,
});

/**
 * What a student may take in a term: the term's offerings for their program, at their year level or
 * earlier (earlier ones are back subjects), minus subjects already passed or credited.
 */
export function studentTermSubjects(input: {
  catalog: AcademicSubject[];
  term: TermRef | null | undefined;
  /** The program's curriculum (Subjects per Year Level). */
  programSubjects: CurriculumSubject[];
  program: Partial<AcademicProgram> | null | undefined;
  student: Partial<StudentProfile>;
  yearLevel?: string;
}): StudentTermSubjects {
  const { catalog, term, program, student } = input;
  if (!term) return { configured: false, subjects: [], notOffered: [], completed: [] };
  const yearLevel = input.yearLevel || student.yearLevel || '';
  const level = yearIdx(yearLevel);
  const done = completedSubjects(student);
  const passed = new Set(done.keys());
  const kind = semesterKind(term.semester);
  const curriculum = (input.programSubjects || []).filter((s) => s.status !== 'Inactive');
  const currByCode = new Map(curriculum.map((s) => [normCode(s.code), s]));
  const all = termOfferings(catalog, term);
  // Subjects the student is already taking in this same term.
  const enrolledNow = new Set(
    sameTerm(student.currentSemester, termLabel(term.semester, term.academicYear))
      ? (student.courses || []).filter((c) => c.status !== 'Dropped' && !passed.has(normCode(c.code))).map((c) => normCode(c.code))
      : []
  );
  // Completed subjects among this term's offerings and the curriculum for this semester, up to the student's year level.
  const completedFor = (codes: { code: string; yearLevel?: string }[]) => {
    const seen = new Map<string, CompletedSubject & { yearLevel: string }>();
    for (const x of codes) {
      const c = normCode(x.code);
      const d = done.get(c);
      const i = yearIdx(x.yearLevel || '');
      if (!d || seen.has(c) || (level >= 0 && i > level)) continue;
      seen.set(c, { ...d, code: x.code, yearLevel: normalizeYearLevel(x.yearLevel) || x.yearLevel || '' });
    }
    return Array.from(seen.values()).sort((a, b) => yearIdx(a.yearLevel) - yearIdx(b.yearLevel) || a.code.localeCompare(b.code));
  };
  const curriculumThisSem = curriculum.filter((s) => !s.semester || !kind || semesterKind(s.semester) === kind);

  if (all.length === 0) {
    // Not set up yet: the curriculum with older unassigned offerings (previous behaviour).
    const legacy = unassignedOfferings(catalog).filter((o) => !o.semester || !kind || semesterKind(o.semester) === kind);
    if (curriculum.length) {
      const byCode = new Map(legacy.map((o) => [normCode(o.code), o]));
      const subjects = offeredSubjects(curriculum, legacy, yearLevel, term.semester || '', student).map((s) => {
        const o = byCode.get(normCode(s.code));
        const row = o ? { ...fromOffering(o, {}), ...s, id: o.id, offeringId: o.id } : { ...s, id: s.id || s.code, offeringId: '', section: '', capacity: 0, enrolledCount: 0, full: false, closed: false };
        return { ...row, alreadyEnrolled: enrolledNow.has(normCode(s.code)) };
      });
      return { configured: false, subjects, notOffered: [], completed: completedFor(curriculumThisSem) };
    }
    return {
      configured: false,
      subjects: legacy.filter((o) => !passed.has(normCode(o.code)) && offeringForProgram(o, program)).map((o) => fromOffering(o, { alreadyEnrolled: enrolledNow.has(normCode(o.code)) })),
      notOffered: [],
      completed: completedFor(legacy.filter((o) => offeringForProgram(o, program))),
    };
  }

  const offerings = all.filter((o) => offeringForProgram(o, program));
  const subjects: StudentTermSubject[] = [];
  for (const o of offerings) {
    const code = normCode(o.code);
    if (passed.has(code)) continue;
    const c = currByCode.get(code);
    const yl = normalizeYearLevel(o.yearLevel) || (c ? normalizeYearLevel(c.yearLevel) || c.yearLevel : '') || '';
    const i = yearIdx(yl);
    if (level >= 0 && i > level) continue; // a later year level
    const prereqText = (o.prerequisites || []).filter(Boolean).join(', ') || o.prerequisite || c?.prerequisites || '';
    subjects.push(
      fromOffering(o, {
        yearLevel: yl,
        backSubject: level >= 0 && i >= 0 && i < level,
        prerequisites: prereqText,
        prerequisitesMet: prerequisiteCodes(prereqText).every((p) => passed.has(p)),
        alreadyEnrolled: enrolledNow.has(code),
      })
    );
  }
  subjects.sort(
    (a, b) => Number(a.backSubject) - Number(b.backSubject) || yearIdx(a.yearLevel) - yearIdx(b.yearLevel) || a.code.localeCompare(b.code) || a.section.localeCompare(b.section)
  );
  const offeredCodes = new Set(offerings.map((o) => normCode(o.code)));
  const notOffered = curriculum
    .filter((s) => !s.semester || !kind || semesterKind(s.semester) === kind)
    .filter((s) => {
      const i = yearIdx(s.yearLevel);
      return (level < 0 || (i >= 0 && i <= level)) && !passed.has(normCode(s.code)) && !offeredCodes.has(normCode(s.code));
    })
    .map((s) => ({ code: s.code, title: s.title, units: Number(s.units) || 0, yearLevel: normalizeYearLevel(s.yearLevel) || s.yearLevel }));
  const offeredWithLevel = offerings.map((o) => ({ code: o.code, yearLevel: normalizeYearLevel(o.yearLevel) || normalizeYearLevel(currByCode.get(normCode(o.code))?.yearLevel) || '' }));
  return { configured: true, subjects, notOffered, completed: completedFor([...offeredWithLevel, ...curriculumThisSem]) };
}

/**
 * The offering of a subject in a term (e.g. to update its enrolled count): that term's offering when
 * the term has subjects set up, otherwise an older unassigned one. Never another term's offering.
 */
export function offeringForCode(catalog: AcademicSubject[], term: TermRef | null | undefined, code: string): AcademicSubject | undefined {
  const c = normCode(code);
  const inTerm = termOfferings(catalog, term).filter((o) => normCode(o.code) === c);
  if (inTerm.length) return inTerm.find((o) => o.status !== 'Closed') || inTerm[0];
  return unassignedOfferings(catalog).find((o) => normCode(o.code) === c);
}

// ---------------------------------------------------------------------------
// Setting up a term (Registrar / Admin)
// ---------------------------------------------------------------------------

export type OfferingDraft = Omit<AcademicSubject, 'id' | 'enrolledCount'> & { programId?: string };

/** One offering per term, program, code and section, so the same subject can't be added twice. */
export function offeringIdFor(term: TermRef, programId: string, code: string, section: string): string {
  const part = (s: string) => squash(s) || 'x';
  return `off-${part(termKeyOf(term.semester, term.academicYear))}-${part(programId || 'all')}-${part(code)}-${part(section || 'a')}`;
}

/** Same term, program, code and section as an existing (not removed) offering. */
export function duplicateOffering(existing: AcademicSubject[], d: Pick<OfferingDraft, 'code' | 'section' | 'semester' | 'academicYear'> & { programId?: string; program?: string }, ignoreId?: string): AcademicSubject | undefined {
  return termOfferings(existing, d).find(
    (o) =>
      o.id !== ignoreId &&
      normCode(o.code) === normCode(d.code) &&
      squash(o.section) === squash(d.section) &&
      (((o as any).programId || '') === (d.programId || '') || (!(o as any).programId && !d.programId && squash(o.program) === squash(d.program)))
  );
}

/** The program's curriculum subjects for the term's semester, by year level. */
export function curriculumForTerm(programSubjects: CurriculumSubject[], term: TermRef): CurriculumSubject[] {
  const kind = semesterKind(term.semester);
  return (programSubjects || [])
    .filter((s) => s.status !== 'Inactive')
    .filter((s) => !s.semester || !kind || semesterKind(s.semester) === kind)
    .sort((a, b) => yearIdx(a.yearLevel) - yearIdx(b.yearLevel) || (a.order ?? 0) - (b.order ?? 0) || a.code.localeCompare(b.code));
}

/**
 * Creates offerings; any that already exist (same term, program, code and section) are skipped, never
 * overwritten. Returns how many were created and skipped.
 */
export async function createOfferings(drafts: OfferingDraft[], existing: AcademicSubject[], by: string): Promise<{ created: number; skipped: number }> {
  const now = new Date().toISOString();
  const seen = new Set<string>();
  const toWrite: { id: string; data: AcademicSubject & { programId?: string } }[] = [];
  let skipped = 0;
  for (const d of drafts) {
    const id = offeringIdFor(d, d.programId || '', d.code, d.section);
    if (seen.has(id) || duplicateOffering(existing, d)) {
      skipped += 1;
      continue;
    }
    seen.add(id);
    toWrite.push({ id, data: { ...d, id, enrolledCount: 0, createdAt: now, createdBy: by } as any });
  }
  // A removed offering with the same id is brought back with the new details (its seat count is kept);
  // one that is still offered is skipped.
  const fresh: typeof toWrite = [];
  const back: typeof toWrite = [];
  for (const w of toWrite) {
    const snap = await getDoc(doc(db, 'academicSubjects', w.id));
    if (!snap.exists()) fresh.push(w);
    else if ((snap.data() as AcademicSubject).isArchived) back.push(w);
    else skipped += 1;
  }
  const writes = [
    ...fresh.map((w) => (b: ReturnType<typeof writeBatch>) => b.set(doc(db, 'academicSubjects', w.id), JSON.parse(JSON.stringify(w.data)))),
    ...back.map((w) => (b: ReturnType<typeof writeBatch>) => {
      const { enrolledCount, createdAt, createdBy, ...details } = w.data as any;
      b.update(doc(db, 'academicSubjects', w.id), { ...JSON.parse(JSON.stringify(details)), isArchived: false, removedAt: '', removedBy: '', restoredAt: now, restoredBy: by });
    }),
  ];
  for (let i = 0; i < writes.length; i += 400) {
    const batch = writeBatch(db);
    writes.slice(i, i + 400).forEach((w) => w(batch));
    await batch.commit();
  }
  return { created: fresh.length + back.length, skipped };
}

// ---------------------------------------------------------------------------
// Automatic setup of a new term
// ---------------------------------------------------------------------------

const programName = (p?: Partial<AcademicProgram> | null) => (p ? p.name || (p as any).title || p.code || '' : '');
const levelOf = (o: { yearLevel?: string }) => normalizeYearLevel(o.yearLevel) || '';

/** The same semester one academic year earlier (2nd Semester 2025–2026 for 2nd Semester 2026–2027). */
export function previousYearTerm(term: TermRef): TermRef | null {
  const m = normAY(term.academicYear).match(/^(\d{4})–(\d{4})$/);
  return m ? { semester: term.semester, academicYear: `${Number(m[1]) - 1}–${Number(m[2]) - 1}` } : null;
}

const copyOffering = (o: AcademicSubject & { programId?: string }, term: TermRef): OfferingDraft => ({
  semester: term.semester || '',
  academicYear: normAY(term.academicYear),
  program: o.program || '',
  programId: o.programId || '',
  yearLevel: o.yearLevel || '',
  code: o.code,
  title: o.title,
  description: o.description || '',
  category: o.category || '',
  units: Number(o.units) || 0,
  prerequisites: o.prerequisites || [],
  ...(o.prerequisite ? { prerequisite: o.prerequisite } : {}),
  ...(o.subjectType ? { subjectType: o.subjectType } : {}),
  section: o.section || '',
  schedule: o.schedule || '',
  room: o.room || '',
  instructor: o.instructor || '',
  instructorId: o.instructorId || '',
  capacity: Number(o.capacity) || 0,
  status: 'Open',
});

// Schedule, room and instructor stay blank (shown as TBA) and capacity 0 (no limit) until the Registrar sets them.
const curriculumOffering = (s: CurriculumSubject, program: AcademicProgram, term: TermRef): OfferingDraft => ({
  semester: term.semester || '',
  academicYear: normAY(term.academicYear),
  program: programName(program),
  programId: program.id,
  yearLevel: normalizeYearLevel(s.yearLevel) || s.yearLevel || '',
  code: s.code,
  title: s.title,
  description: s.description || '',
  category: s.type || '',
  units: Number(s.units) || 0,
  prerequisites: s.prerequisites && !/^(none|n\/a|-)$/i.test(s.prerequisites.trim()) ? s.prerequisites.split(/[,;]/).map((x) => x.trim()).filter(Boolean) : [],
  section: '',
  schedule: '',
  room: '',
  instructor: '',
  capacity: 0,
  status: 'Open',
});

export interface AutoTermSetup {
  drafts: OfferingDraft[];
  /** What each draft group fills: program (blank: every program), year level, where it came from. */
  filled: { program: string; yearLevel: string; source: 'previous' | 'curriculum'; count: number }[];
}

/**
 * Subjects for a term the Registrar hasn't set up yet, per program and year level: last year's offerings
 * for the same semester (sections, schedules, rooms, instructors, capacity), else the program's curriculum
 * for that semester. Only program/year-level groups with no subjects in the term yet are filled, so
 * anything the Registrar already added or removed is left alone.
 */
export function autoTermOfferings(input: { term: TermRef; programs: AcademicProgram[]; curriculumSubjects: CurriculumSubject[]; catalog: AcademicSubject[] }): AutoTermSetup {
  const { term, catalog } = input;
  const drafts: OfferingDraft[] = [];
  const filled: AutoTermSetup['filled'] = [];
  // Removed subjects count too: the Registrar removed them on purpose.
  const inTerm = (catalog || []).filter((o) => o && isTermOffering(o, term)) as (AcademicSubject & { programId?: string })[];
  const prevRef = previousYearTerm(term);
  const prev = (prevRef ? termOfferings(catalog, prevRef) : []) as (AcademicSubject & { programId?: string })[];
  const forAll = (o: { programId?: string; program?: string }) => !o.programId && !o.program;

  // Subjects for every program (no program set).
  const generalHave = new Set(inTerm.filter(forAll).map(levelOf));
  const generalCopied = new Set<string>();
  for (const level of Array.from(new Set(prev.filter(forAll).map(levelOf)))) {
    if (generalHave.has(level)) continue;
    const rows = prev.filter((o) => forAll(o) && levelOf(o) === level).map((o) => copyOffering(o, term));
    drafts.push(...rows);
    generalCopied.add(level);
    filled.push({ program: '', yearLevel: level, source: 'previous', count: rows.length });
  }

  for (const program of (input.programs || []).filter((p) => p && p.id && programName(p))) {
    const mine = (o: AcademicSubject & { programId?: string }) => !forAll(o) && offeringForProgram(o, program);
    const have = new Set([...inTerm.filter((o) => mine(o) || forAll(o)).map(levelOf), ...Array.from(generalCopied)]);
    const prevMine = prev.filter(mine);
    const curriculum = curriculumForTerm(subjectsForProgram(input.curriculumSubjects || [], program), term);
    const levels = Array.from(new Set([...prevMine.map(levelOf), ...curriculum.map((s) => normalizeYearLevel(s.yearLevel) || '')]));
    for (const level of levels) {
      if (have.has(level)) continue;
      const fromPrev = prevMine.filter((o) => levelOf(o) === level);
      const rows = fromPrev.length
        ? fromPrev.map((o) => ({ ...copyOffering(o, term), program: programName(program), programId: program.id }))
        : curriculum.filter((s) => (normalizeYearLevel(s.yearLevel) || '') === level).map((s) => curriculumOffering(s, program, term));
      if (!rows.length) continue;
      drafts.push(...rows);
      filled.push({ program: programName(program), yearLevel: level, source: fromPrev.length ? 'previous' : 'curriculum', count: rows.length });
    }
  }
  return { drafts, filled };
}

export interface TermReadinessRow {
  programId: string;
  program: string;
  yearLevel: string;
  /** Subjects offered in the term for this program and year level (including ones for every program). */
  offered: number;
  /** Curriculum subjects for this semester and year level. */
  inCurriculum: number;
}

/** Per program and year level (from the curriculum and the term's subjects): how many subjects are offered. */
export function termReadiness(input: { term: TermRef; programs: AcademicProgram[]; curriculumSubjects: CurriculumSubject[]; catalog: AcademicSubject[] }): TermReadinessRow[] {
  const all = termOfferings(input.catalog, input.term);
  const rows: TermReadinessRow[] = [];
  for (const program of (input.programs || []).filter((p) => p && p.id && programName(p))) {
    const offerings = all.filter((o) => offeringForProgram(o, program));
    const curriculum = curriculumForTerm(subjectsForProgram(input.curriculumSubjects || [], program), input.term);
    const levels = Array.from(new Set([...curriculum.map((s) => normalizeYearLevel(s.yearLevel) || ''), ...offerings.map(levelOf).filter(Boolean)])).sort(
      (a, b) => yearIdx(a) - yearIdx(b)
    );
    for (const level of levels) {
      rows.push({
        programId: program.id,
        program: programName(program),
        yearLevel: level,
        offered: offerings.filter((o) => !levelOf(o) || levelOf(o) === level).length,
        inCurriculum: curriculum.filter((s) => (normalizeYearLevel(s.yearLevel) || '') === level).length,
      });
    }
  }
  return rows;
}

// ---------------------------------------------------------------------------
// Enrolled students, counted from the student records
// ---------------------------------------------------------------------------

/** Students whose record says they are enrolled in this term. */
export function studentsEnrolledInTerm(students: Partial<StudentProfile>[], term: TermRef): Partial<StudentProfile>[] {
  const label = termLabel(term.semester, term.academicYear);
  return (students || []).filter((s) => s && !s.isArchived && s.enrollmentStatus === 'Enrolled' && sameTerm(s.currentSemester, label));
}

/**
 * Enrolled students per offering of a term: every subject (not dropped) of a student enrolled in the term
 * counts toward its offering, found by id or else by the term's offering for its code (as at approval).
 */
export function termEnrollmentCounts(students: Partial<StudentProfile>[], catalog: AcademicSubject[], term: TermRef): Map<string, number> {
  const counts = new Map<string, number>();
  termEnrollmentRosters(students, catalog, term).forEach((ids, id) => counts.set(id, ids.length));
  return counts;
}

/** The student record ids enrolled in each offering of a term (same matching as the counts). */
export function termEnrollmentRosters(students: Partial<StudentProfile>[], catalog: AcademicSubject[], term: TermRef): Map<string, string[]> {
  const rosters = new Map<string, string[]>();
  const inTerm = termOfferings(catalog, term);
  for (const o of inTerm) rosters.set(o.id, []);
  for (const s of studentsEnrolledInTerm(students, term)) {
    const seen = new Set<string>();
    for (const c of s.courses || []) {
      if (!c || c.status === 'Dropped') continue;
      const byId = inTerm.find((o) => o.id === c.id && normCode(o.code) === normCode(c.code));
      const offering = byId || offeringForCode(catalog, term, c.code);
      if (!offering || seen.has(offering.id)) continue;
      seen.add(offering.id);
      rosters.set(offering.id, [...(rosters.get(offering.id) || []), String(s.id || s.studentId || '')]);
    }
  }
  return rosters;
}
