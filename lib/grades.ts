'use client';

// Faculty grade submission, review, finalization and amendments.
//
// One grade sheet per class section per term (gradeSheets/{termKey}__{sectionId}). Staff prepare the
// sheets from the official teaching assignments (class sections → instructors) and enrollment
// (students enrolled in the subject that term), so a professor only ever sees their own classes.
// Workflow: Draft → Submitted → Under Review → Approved / Returned for Correction → Finalized.
// Grades reach a student's record only when a finalized sheet is published; a finalized grade
// changes only through an approved amendment (gradeAmendments, never deleted).
// Firestore rules enforce who may do each step.

import { useEffect, useState } from 'react';
import {
  arrayUnion,
  collection,
  doc,
  onSnapshot,
  query,
  runTransaction,
  setDoc,
  updateDoc,
  where,
  writeBatch,
  type Transaction,
} from 'firebase/firestore';
import { db } from './firebase';
import { calculateGPAFromGrades } from './studentDefaults';
import { normAY, normCode, sameTerm, termKeyOf, termLabel } from './reenrollment';
import type {
  AcademicPeriod,
  ClassSection,
  EnrollmentSystemConfig,
  GradeAmendment,
  GradeEntry,
  GradeRosterStudent,
  GradeSheet,
  GradeSheetStatus,
  GradingScale,
  InstructorRecord,
  StudentProfile,
  StudentSubjectHistory,
} from './types';

export const normEmail = (e?: string) => String(e || '').trim().toLowerCase();
const squash = (s?: string) => String(s || '').toLowerCase().replace(/[^a-z0-9]/g, '');

export function gradeSheetId(termKey: string, sectionId: string): string {
  return `${termKey}__${sectionId}`.replace(/[^A-Za-z0-9_-]+/g, '-');
}

// ---------------------------------------------------------------------------
// Grading scale (System Governance)
// ---------------------------------------------------------------------------

/** PCM's grading scale, or null when it has not been set up (no grades can be entered then). */
export function gradingScaleOf(config?: Partial<EnrollmentSystemConfig> | null): GradingScale | null {
  const g = config?.gradingScale;
  if (!g || !Array.isArray(g.values) || g.values.filter((v) => v && String(v.value).trim()).length === 0) return null;
  return {
    values: g.values.filter((v) => v && String(v.value).trim()),
    specialCodes: Array.isArray(g.specialCodes) ? g.specialCodes.filter((c) => c && String(c.code).trim()) : [],
    allowIncompleteSubmission: !!g.allowIncompleteSubmission,
    publishOnFinalize: g.publishOnFinalize !== false,
  };
}

export interface GradeLookup {
  kind: 'blank' | 'value' | 'code' | 'invalid';
  remark: string;
  equivalent?: string;
  /** Not yet complete (blank, or a code such as INC). */
  incomplete: boolean;
}

export function lookupGrade(scale: GradingScale | null, grade?: string): GradeLookup {
  const g = String(grade || '').trim();
  if (!g) return { kind: 'blank', remark: '', incomplete: true };
  if (!scale) return { kind: 'invalid', remark: '', incomplete: true };
  const v = scale.values.find((x) => String(x.value).trim() === g);
  if (v) return { kind: 'value', remark: v.remark, equivalent: v.equivalent, incomplete: false };
  const c = scale.specialCodes.find((x) => String(x.code).trim().toUpperCase() === g.toUpperCase());
  if (c) return { kind: 'code', remark: c.remark, equivalent: c.meaning, incomplete: !!c.incomplete };
  return { kind: 'invalid', remark: '', incomplete: true };
}

/** Status for the academic history from a scale remark (Passed / Failed; anything else is Incomplete). */
export function historyStatusFor(remark: string): StudentSubjectHistory['status'] {
  const r = remark.trim().toLowerCase();
  if (r === 'passed') return 'Passed';
  if (r === 'failed') return 'Failed';
  return 'Incomplete';
}

// ---------------------------------------------------------------------------
// Validation
// ---------------------------------------------------------------------------

export interface SheetIssues {
  missing: string[];
  invalid: string[];
  incomplete: string[];
  /** On the sheet but no longer officially enrolled in the subject (staff check). */
  notEnrolled: string[];
  /** Officially enrolled but not on the sheet (staff check). */
  notOnRoster: string[];
}

export function sheetIssues(sheet: Pick<GradeSheet, 'roster' | 'grades'>, scale: GradingScale | null, enrolledIds?: string[]): SheetIssues {
  const out: SheetIssues = { missing: [], invalid: [], incomplete: [], notEnrolled: [], notOnRoster: [] };
  for (const id of sheet.roster || []) {
    const l = lookupGrade(scale, sheet.grades?.[id]?.grade);
    if (l.kind === 'blank') out.missing.push(id);
    else if (l.kind === 'invalid') out.invalid.push(id);
    else if (l.incomplete) out.incomplete.push(id);
  }
  if (enrolledIds) {
    out.notEnrolled = (sheet.roster || []).filter((id) => !enrolledIds.includes(id));
    out.notOnRoster = enrolledIds.filter((id) => !(sheet.roster || []).includes(id));
  }
  return out;
}

export function enteredCount(sheet: Pick<GradeSheet, 'roster' | 'grades'>): number {
  return (sheet.roster || []).filter((id) => String(sheet.grades?.[id]?.grade || '').trim()).length;
}

// ---------------------------------------------------------------------------
// Teaching assignments and class lists
// ---------------------------------------------------------------------------

export function sectionsForTerm(sections: ClassSection[], term: AcademicPeriod): ClassSection[] {
  const key = termKeyOf(term.semester, term.academicYear);
  return (sections || []).filter((s) => termKeyOf(s.semester, s.academicYear) === key);
}

export function instructorForSection(section: ClassSection, instructors: InstructorRecord[]): InstructorRecord | undefined {
  return (
    (section.instructorId && instructors.find((i) => i.id === section.instructorId)) ||
    instructors.find((i) => squash(i.fullName) && squash(i.fullName) === squash(section.instructorName)) ||
    undefined
  );
}

/** Students officially enrolled in a subject for a term: in their current subjects, or — once the term
 *  is closed — in their academic history for that term (so late grades can still be finalized). */
export function enrolledInSubject(students: StudentProfile[], term: AcademicPeriod, subjectCode: string): StudentProfile[] {
  const label = termLabel(term.semester, term.academicYear);
  const code = normCode(subjectCode);
  const ay = squash(normAY(term.academicYear));
  const sem = squash(term.semester);
  return (students || []).filter(
    (s) =>
      (sameTerm(s.currentSemester, label) && (s.courses || []).some((c) => normCode(c.code) === code && c.status !== 'Dropped')) ||
      (s.subjectHistory || []).some((h) => normCode(h.code) === code && squash(h.semester) === sem && squash(normAY(h.academicYear)) === ay)
  );
}

export interface ClassList {
  students: StudentProfile[];
  /** Why the list may need the Registrar's attention. */
  warning?: string;
}

/** The official class list of a section: its assigned students, or everyone taking the subject when it is the only section. */
export function classListFor(section: ClassSection, termSections: ClassSection[], students: StudentProfile[], term: AcademicPeriod): ClassList {
  const all = enrolledInSubject(students, term, section.subjectCode);
  const assigned = (section.enrolledStudentIds || []).filter(Boolean);
  if (assigned.length) return { students: all.filter((s) => assigned.includes(s.id) || assigned.includes(s.studentId)) };
  const siblings = termSections.filter((s) => s.id !== section.id && normCode(s.subjectCode) === normCode(section.subjectCode));
  if (siblings.length) {
    return {
      students: all,
      warning: `${section.subjectCode} has ${siblings.length + 1} sections but no students are assigned to sections; every enrolled student is listed.`,
    };
  }
  return { students: all };
}

const rosterEntry = (s: StudentProfile): GradeRosterStudent => ({
  studentRecordId: s.id,
  studentId: s.studentId,
  name: s.fullName || s.name || s.studentId,
  yearLevel: s.yearLevel || '',
  program: s.degreeProgram || s.program || '',
});

/** Subjects students are enrolled in this term that have no class section (so no grade sheet). */
export function subjectsWithoutSection(students: StudentProfile[], term: AcademicPeriod, termSections: ClassSection[]): { code: string; title: string; students: number }[] {
  const label = termLabel(term.semester, term.academicYear);
  const have = new Set(termSections.map((s) => normCode(s.subjectCode)));
  const map = new Map<string, { code: string; title: string; students: number }>();
  for (const s of students || []) {
    if (!sameTerm(s.currentSemester, label)) continue;
    for (const c of s.courses || []) {
      if (c.status === 'Dropped' || have.has(normCode(c.code))) continue;
      const k = normCode(c.code);
      const cur = map.get(k) || { code: c.code, title: c.title, students: 0 };
      cur.students += 1;
      map.set(k, cur);
    }
  }
  return Array.from(map.values());
}

// ---------------------------------------------------------------------------
// Live data
// ---------------------------------------------------------------------------

/** Grade sheets of a term (staff) or of a professor (by verified email). */
export function useGradeSheets(filter: { termKey?: string; instructorEmail?: string; all?: boolean }): { sheets: GradeSheet[]; loaded: boolean; error: string } {
  const [sheets, setSheets] = useState<GradeSheet[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [error, setError] = useState('');
  const { termKey, instructorEmail, all } = filter;
  useEffect(() => {
    setLoaded(false);
    setSheets([]);
    if (!termKey && !instructorEmail && !all) return;
    const col = collection(db, 'gradeSheets');
    const q = instructorEmail
      ? query(col, where('instructorEmail', '==', normEmail(instructorEmail)))
      : termKey
        ? query(col, where('termKey', '==', termKey))
        : col;
    return onSnapshot(
      q,
      (snap) => {
        setSheets(snap.docs.map((d) => ({ ...(d.data() as GradeSheet), id: d.id })).sort((a, b) => a.subjectCode.localeCompare(b.subjectCode) || a.sectionName.localeCompare(b.sectionName)));
        setLoaded(true);
        setError('');
      },
      (err) => {
        console.warn('gradeSheets', err);
        setError('Grade sheets could not be loaded.');
        setLoaded(true);
      }
    );
  }, [termKey, instructorEmail, all]);
  return { sheets, loaded, error };
}

export function useGradeAmendments(filter: { termKey?: string; requestedByUid?: string }): GradeAmendment[] {
  const [list, setList] = useState<GradeAmendment[]>([]);
  const { termKey, requestedByUid } = filter;
  useEffect(() => {
    setList([]);
    if (!termKey && !requestedByUid) return;
    const col = collection(db, 'gradeAmendments');
    const q = requestedByUid ? query(col, where('requestedByUid', '==', requestedByUid)) : query(col, where('termKey', '==', termKey));
    return onSnapshot(
      q,
      (snap) => setList(snap.docs.map((d) => ({ ...(d.data() as GradeAmendment), id: d.id })).sort((a, b) => b.requestedAt.localeCompare(a.requestedAt))),
      (err) => console.warn('gradeAmendments', err)
    );
  }, [termKey, requestedByUid]);
  return list;
}

// ---------------------------------------------------------------------------
// Staff: preparing grade sheets
// ---------------------------------------------------------------------------

export interface PrepareResult {
  created: number;
  updated: number;
  skipped: { section: string; reason: string }[];
  warnings: string[];
}

/** Creates a sheet for every class section of the term, and refreshes class lists of sheets still with the professor. */
export async function prepareGradeSheets(
  term: AcademicPeriod,
  sections: ClassSection[],
  instructors: InstructorRecord[],
  students: StudentProfile[],
  existing: GradeSheet[],
  actor: string
): Promise<PrepareResult> {
  const termSections = sectionsForTerm(sections, term);
  const key = termKeyOf(term.semester, term.academicYear);
  const now = new Date().toISOString();
  const result: PrepareResult = { created: 0, updated: 0, skipped: [], warnings: [] };
  const batch = writeBatch(db);
  let writes = 0;
  for (const section of termSections) {
    const label = `${section.subjectCode} ${section.sectionName || ''}`.trim();
    const instructor = instructorForSection(section, instructors);
    if (!instructor || !normEmail(instructor.email)) {
      result.skipped.push({ section: label, reason: instructor ? `${instructor.fullName} has no email address in Faculty Load.` : 'No professor is assigned (or the professor is not in Faculty Load).' });
      continue;
    }
    const list = classListFor(section, termSections, students, term);
    if (list.warning) result.warnings.push(list.warning);
    const roster = list.students.map((s) => s.id);
    const id = gradeSheetId(key, section.id);
    const prev = existing.find((s) => s.id === id);
    const teacher = {
      instructorId: instructor.id,
      instructorName: [instructor.title, instructor.fullName].filter(Boolean).join(' '),
      instructorEmail: normEmail(instructor.email),
    };
    if (!prev) {
      const sheet: GradeSheet = {
        id,
        termKey: key,
        academicYear: normAY(term.academicYear),
        semester: term.semester,
        sectionId: section.id,
        sectionName: section.sectionName || section.sectionCode || '',
        subjectCode: section.subjectCode,
        subjectTitle: section.subjectTitle,
        units: Number(section.units) || 0,
        ...teacher,
        roster,
        students: list.students.map(rosterEntry),
        grades: {},
        status: 'Draft',
        version: 0,
        createdAt: now,
        updatedAt: now,
      };
      batch.set(doc(db, 'gradeSheets', id), sheet);
      result.created += 1;
      writes += 1;
    } else if (['Draft', 'Returned for Correction'].includes(prev.status)) {
      // Keep grades already entered for students still on the list.
      const grades: Record<string, GradeEntry> = {};
      roster.forEach((sid) => {
        if (prev.grades?.[sid]) grades[sid] = prev.grades[sid];
      });
      const changed =
        prev.instructorEmail !== teacher.instructorEmail ||
        prev.roster.length !== roster.length ||
        prev.roster.some((r) => !roster.includes(r));
      if (changed) {
        batch.update(doc(db, 'gradeSheets', id), { ...teacher, roster, students: list.students.map(rosterEntry), grades, updatedAt: now, refreshedBy: actor });
        result.updated += 1;
        writes += 1;
      }
    }
    if (writes >= 450) break;
  }
  if (writes) await batch.commit();
  return result;
}

// ---------------------------------------------------------------------------
// Professors: saving and submitting
// ---------------------------------------------------------------------------

/** Saves the professor's grades (draft or submit). Refused if someone else saved since the sheet was loaded. */
export async function saveGradeSheet(
  sheet: GradeSheet,
  grades: Record<string, GradeEntry>,
  facultyNote: string,
  user: { name: string; uid: string },
  submit: boolean
): Promise<void> {
  const ref = doc(db, 'gradeSheets', sheet.id);
  await runTransaction(db, async (tx: Transaction) => {
    const snap = await tx.get(ref);
    if (!snap.exists()) throw new Error('This grade sheet no longer exists.');
    const cur = snap.data() as GradeSheet;
    if (!['Draft', 'Returned for Correction'].includes(cur.status)) throw new Error(`This grade sheet is ${cur.status} and can no longer be edited.`);
    if ((cur.version || 0) !== (sheet.version || 0)) throw new Error('These grades were changed in another window. Reload the sheet and try again.');
    const now = new Date().toISOString();
    const clean: Record<string, GradeEntry> = {};
    cur.roster.forEach((id) => {
      const g = grades[id];
      if (g && (String(g.grade || '').trim() || String(g.note || '').trim())) clean[id] = { grade: String(g.grade || '').trim(), ...(g.note?.trim() ? { note: g.note.trim() } : {}) };
    });
    tx.update(ref, {
      grades: clean,
      facultyNote: facultyNote.trim(),
      status: submit ? 'Submitted' : 'Draft',
      version: (cur.version || 0) + 1,
      savedAt: now,
      savedBy: user.name,
      savedByUid: user.uid,
      ...(submit ? { submittedAt: now, submittedBy: user.name, submittedByUid: user.uid } : {}),
    });
  });
}

// ---------------------------------------------------------------------------
// Staff: review, approval, finalization, publication
// ---------------------------------------------------------------------------

export async function notifyUser(recipientUid: string | undefined, title: string, message: string): Promise<void> {
  if (!recipientUid) return;
  const id = `notif-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
  try {
    await setDoc(doc(db, 'studentNotifications', id), { id, recipientUid, studentId: '', type: 'grade', title, message, read: false, createdAt: new Date().toISOString() });
  } catch (e) {
    console.warn('notify', e);
  }
}

export async function setSheetStatus(sheet: GradeSheet, status: GradeSheetStatus, actor: string, remarks = ''): Promise<void> {
  const now = new Date().toISOString();
  const patch: Record<string, unknown> = { status, updatedAt: now };
  if (status === 'Under Review') Object.assign(patch, { reviewStartedAt: now, reviewedBy: actor });
  if (status === 'Approved') Object.assign(patch, { approvedAt: now, approvedBy: actor, reviewRemarks: remarks });
  if (status === 'Returned for Correction') Object.assign(patch, { returnedAt: now, reviewedBy: actor, reviewRemarks: remarks });
  await updateDoc(doc(db, 'gradeSheets', sheet.id), patch);
  const who = sheet.submittedByUid || sheet.savedByUid;
  if (status === 'Returned for Correction') {
    await notifyUser(who, `Grades returned: ${sheet.subjectCode}`, `The Registrar returned your grade sheet for ${sheet.subjectCode} ${sheet.sectionName} (${sheet.semester}, AY ${sheet.academicYear}) for correction: "${remarks}".`);
  }
  if (status === 'Approved') {
    await notifyUser(who, `Grades approved: ${sheet.subjectCode}`, `Your grade sheet for ${sheet.subjectCode} ${sheet.sectionName} (${sheet.semester}, AY ${sheet.academicYear}) was approved.`);
  }
}

/** The changes publishing one grade makes to a student's record (current-term subject, or the academic history once the term is closed). */
export function gradeUpdatesForStudent(student: StudentProfile, sheet: GradeSheet, grade: string, scale: GradingScale): Partial<StudentProfile> | null {
  const l = lookupGrade(scale, grade);
  if (l.kind === 'blank' || l.kind === 'invalid') return null;
  const label = termLabel(sheet.semester, sheet.academicYear);
  const code = normCode(sheet.subjectCode);
  const now = new Date().toISOString();
  if (sameTerm(student.currentSemester, label) && (student.courses || []).some((c) => normCode(c.code) === code && c.status !== 'Dropped')) {
    return {
      courses: (student.courses || []).map((c) =>
        normCode(c.code) === code && c.status !== 'Dropped'
          ? { ...c, finalGrade: grade, status: l.incomplete ? 'Enrolled' : 'Completed', gradeStatus: 'Published', gradeRemark: l.remark, gradeSheetId: sheet.id }
          : c
      ),
      updatedAt: now,
    };
  }
  const history = student.subjectHistory || [];
  const idx = history.findIndex((h) => normCode(h.code) === code && squash(h.semester) === squash(sheet.semester) && squash(normAY(h.academicYear)) === squash(normAY(sheet.academicYear)));
  if (idx < 0) return null;
  const num = Number(grade);
  const subjectHistory = history.map((h, i) =>
    i === idx ? { ...h, grade: !Number.isNaN(num) && grade !== '' ? num : grade, finalGrade: grade, status: historyStatusFor(l.remark) } : h
  );
  return {
    subjectHistory,
    gpa: calculateGPAFromGrades(subjectHistory),
    totalUnitsEarned: subjectHistory.filter((h) => ['Passed', 'Credited'].includes(String(h.status))).reduce((t, h) => t + (Number(h.units) || 0), 0),
    updatedAt: now,
  };
}

export interface PublishResult {
  published: number;
  skipped: { name: string; reason: string }[];
}

/** Writes a finalized sheet's grades to the students' records (what students see). */
export async function publishGradeSheet(sheet: GradeSheet, scale: GradingScale, students: StudentProfile[], actor: string, finalize = false): Promise<PublishResult> {
  const result: PublishResult = { published: 0, skipped: [] };
  const batch = writeBatch(db);
  for (const r of sheet.students) {
    const student = students.find((s) => s.id === r.studentRecordId);
    const grade = String(sheet.grades?.[r.studentRecordId]?.grade || '').trim();
    if (!student) {
      result.skipped.push({ name: r.name, reason: 'student record not found' });
      continue;
    }
    if (!grade) {
      result.skipped.push({ name: r.name, reason: 'no grade' });
      continue;
    }
    const updates = gradeUpdatesForStudent(student, sheet, grade, scale);
    if (!updates) {
      result.skipped.push({ name: r.name, reason: `not enrolled in ${sheet.subjectCode} for this term` });
      continue;
    }
    batch.set(doc(db, 'studentProfiles', student.id), updates, { merge: true });
    result.published += 1;
  }
  const now = new Date().toISOString();
  batch.update(doc(db, 'gradeSheets', sheet.id), {
    ...(finalize ? { status: 'Finalized', finalizedAt: now, finalizedBy: actor } : {}),
    publishedAt: now,
    publishedBy: actor,
    updatedAt: now,
  });
  await batch.commit();
  return result;
}

export async function finalizeGradeSheet(sheet: GradeSheet, actor: string): Promise<void> {
  const now = new Date().toISOString();
  await updateDoc(doc(db, 'gradeSheets', sheet.id), { status: 'Finalized', finalizedAt: now, finalizedBy: actor, updatedAt: now });
}

// ---------------------------------------------------------------------------
// Amendments
// ---------------------------------------------------------------------------

export async function requestGradeAmendment(
  sheet: GradeSheet,
  student: GradeRosterStudent,
  newGrade: string,
  reason: string,
  user: { name: string; uid: string }
): Promise<void> {
  const id = `amend-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`;
  const a: GradeAmendment = {
    id,
    sheetId: sheet.id,
    termKey: sheet.termKey,
    subjectCode: sheet.subjectCode,
    studentRecordId: student.studentRecordId,
    studentId: student.studentId,
    studentName: student.name,
    previousGrade: String(sheet.grades?.[student.studentRecordId]?.grade || ''),
    newGrade: newGrade.trim(),
    reason: reason.trim(),
    status: 'Pending',
    requestedBy: user.name,
    requestedByUid: user.uid,
    requestedAt: new Date().toISOString(),
  };
  await setDoc(doc(db, 'gradeAmendments', id), a);
}

/** Approves (applies) or rejects an amendment. An approved change updates the sheet (with its log) and, when published, the student's record. */
export async function decideGradeAmendment(
  a: GradeAmendment,
  approve: boolean,
  sheet: GradeSheet,
  scale: GradingScale,
  student: StudentProfile | undefined,
  actor: { name: string; uid: string },
  remarks: string
): Promise<void> {
  const now = new Date().toISOString();
  const batch = writeBatch(db);
  batch.update(doc(db, 'gradeAmendments', a.id), {
    status: approve ? 'Approved' : 'Rejected',
    decidedBy: actor.name,
    decidedByUid: actor.uid,
    decidedAt: now,
    decisionRemarks: remarks.trim(),
  });
  if (approve) {
    const entry = sheet.grades?.[a.studentRecordId] || { grade: '' };
    batch.update(doc(db, 'gradeSheets', sheet.id), {
      [`grades.${a.studentRecordId}`]: { ...entry, grade: a.newGrade },
      amendmentLog: arrayUnion({
        amendmentId: a.id,
        studentRecordId: a.studentRecordId,
        studentId: a.studentId,
        previousGrade: a.previousGrade,
        newGrade: a.newGrade,
        reason: a.reason,
        requestedBy: a.requestedBy,
        approvedBy: actor.name,
        approvedAt: now,
      }),
      updatedAt: now,
    });
    if (sheet.publishedAt && student) {
      const updates = gradeUpdatesForStudent(student, sheet, a.newGrade, scale);
      if (updates) batch.set(doc(db, 'studentProfiles', student.id), updates, { merge: true });
    }
  }
  await batch.commit();
  await notifyUser(
    a.requestedByUid,
    `Grade change ${approve ? 'approved' : 'not approved'}: ${a.subjectCode}`,
    `${a.studentName}: ${a.previousGrade || '—'} → ${a.newGrade}. ${approve ? 'Applied.' : 'Not applied.'}${remarks.trim() ? ` Note: ${remarks.trim()}` : ''}`
  );
}

// ---------------------------------------------------------------------------
// Status labels and deadlines
// ---------------------------------------------------------------------------

export function isOverdue(term: AcademicPeriod | undefined, sheet?: GradeSheet): boolean {
  if (!term?.gradeSubmissionDeadline) return false;
  const today = new Date().toISOString().slice(0, 10);
  if (today <= term.gradeSubmissionDeadline) return false;
  return !sheet || ['Draft', 'Returned for Correction'].includes(sheet.status);
}

/** Professor-facing progress label: Not Started when nothing was saved yet. */
export function sheetStageLabel(sheet: GradeSheet): string {
  if (sheet.status === 'Draft' && !sheet.savedAt) return 'Not Started';
  if (sheet.status === 'Finalized') return sheet.publishedAt ? 'Finalized & Published' : 'Finalized';
  return sheet.status;
}

export function gradesCsv(sheet: GradeSheet, scale: GradingScale | null): string {
  const esc = (v: unknown) => `"${String(v ?? '').replace(/"/g, '""')}"`;
  const rows = [['Student ID', 'Name', 'Program', 'Year level', 'Grade', 'Equivalent', 'Remark', 'Note']];
  for (const s of sheet.students) {
    const g = sheet.grades?.[s.studentRecordId];
    const l = lookupGrade(scale, g?.grade);
    rows.push([s.studentId, s.name, s.program, s.yearLevel, g?.grade || '', l.equivalent || '', l.kind === 'blank' ? 'Missing' : l.kind === 'invalid' ? 'Invalid' : l.remark, g?.note || '']);
  }
  return rows.map((r) => r.map(esc).join(',')).join('\n');
}

export function downloadText(name: string, text: string, type = 'text/csv') {
  const blob = new Blob([text], { type });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = name;
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
