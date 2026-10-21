// Academic term closing and returning-student re-enrollment.
//
// Everything here is read from what PCM configures:
// - terms, enrollment windows and capacity: Enrollment & Records → Academic Terms
// - passing grade, progression rule, clearances and documents: Enrollment & Records → System Governance
// - subjects per year level: Enrollment & Records → Subjects per Year Level (curriculumSubjects)
// The suggested year level is only a suggestion; the Registrar confirms it when approving.

import { useEffect, useState } from 'react';
import { collection, doc, onSnapshot, query, setDoc, updateDoc, where } from 'firebase/firestore';
import { db } from './firebase';
import { YEAR_LEVELS, normalizeYearLevel } from './curriculum';
import { calculateGPAFromGrades } from './studentDefaults';
import type {
  AcademicPeriod,
  AcademicSubject,
  CurriculumSubject,
  EnrollmentSystemConfig,
  OnlineEnrollment,
  ReenrollmentRequirementTemplate,
  SelectedSubject,
  StudentProfile,
  StudentSubjectHistory,
  StudentTermRecord,
} from './types';

// ---------------------------------------------------------------------------
// Terms
// ---------------------------------------------------------------------------

/** "2026-2027" / "2026 – 2027" → "2026–2027". */
export function normAY(ay?: string): string {
  const m = String(ay || '').match(/(\d{4})\s*[-–—]\s*(\d{4})/);
  return m ? `${m[1]}–${m[2]}` : String(ay || '').trim();
}

export function termLabel(semester?: string, academicYear?: string): string {
  return `${String(semester || '').trim()}, AY ${normAY(academicYear)}`;
}

/** One key per term, used for one-request-per-student-per-term. */
export function termKeyOf(semester?: string, academicYear?: string): string {
  return `${normAY(academicYear).replace('–', '-')}|${String(semester || '').trim()}`;
}

const squash = (s?: string) => String(s || '').toLowerCase().replace(/[^a-z0-9]/g, '');

/** True when two term labels name the same term ("1st Semester, AY 2026-2027" vs "… 2026–2027"). */
export function sameTerm(a?: string, b?: string): boolean {
  return !!a && !!b && squash(a) === squash(b);
}

/** '1' | '2' | 'summer' | '' — semesters are named differently in terms and curricula. */
export function semesterKind(semester?: string): string {
  const s = String(semester || '').toLowerCase();
  if (/summer/.test(s)) return 'summer';
  if (/\b(1st|first)\b/.test(s)) return '1';
  if (/\b(2nd|second)\b/.test(s)) return '2';
  return '';
}

/** Today's date (YYYY-MM-DD) in the Philippines, where window start/end dates are set. */
export function todayPH(at: Date = new Date()): string {
  try {
    return at.toLocaleDateString('en-CA', { timeZone: 'Asia/Manila' });
  } catch {
    return new Date(at.getTime() + 8 * 3600 * 1000).toISOString().slice(0, 10);
  }
}
const today = () => todayPH();

/** A window set in Academic Terms: its status is Open and today is within its dates (when set). */
export function windowOpen(status: string | undefined, start?: string, end?: string, on = today()): boolean {
  if (status !== 'Open') return false;
  if (start && on < start) return false;
  if (end && on > end) return false;
  return true;
}

/** Why a window is not open (for students): not opened yet, opens on a date, or ended. */
export function windowNote(status: string | undefined, start?: string, end?: string, on = today()): string {
  const fmt = (d: string) => new Date(`${d}T00:00:00`).toLocaleDateString('en-PH', { month: 'long', day: 'numeric', year: 'numeric' });
  if (status !== 'Open') return 'Closed by the Registrar.';
  if (start && on < start) return `Opens ${fmt(start)}.`;
  if (end && on > end) return `Ended ${fmt(end)}.`;
  return end ? `Open until ${fmt(end)}.` : 'Open.';
}

const usable = (p: AcademicPeriod) => !!p && !p.closedAt && p.status !== 'Archived';

export function enrollmentWindowOpen(p: AcademicPeriod, on = today()): boolean {
  return usable(p) && windowOpen(p.enrollmentStatus, p.enrollmentStartDate, p.enrollmentEndDate, on);
}

export function preEnlistmentWindowOpen(p: AcademicPeriod | null | undefined, on = today()): boolean {
  return !!p && usable(p) && windowOpen(p.preEnlistmentStatus, p.preEnlistmentStartDate, p.preEnlistmentEndDate, on);
}

export function addDropWindowOpen(p: AcademicPeriod | null | undefined, on = today()): boolean {
  return !!p && usable(p) && windowOpen(p.addDropStatus, p.addDropStartDate, p.addDropEndDate, on);
}

/** The term students pre-enlist for: one whose pre-enlistment window is open (an upcoming term first), else the current term. */
export function preEnlistmentTerm(periods: AcademicPeriod[], on = today()): AcademicPeriod | null {
  const open = (periods || []).filter((p) => preEnlistmentWindowOpen(p, on));
  return open.find((p) => p.status === 'Upcoming') || open.find((p) => !p.isCurrent) || open[0] || (periods || []).find((p) => p.isCurrent) || null;
}

/** Short label for badges: "AY 26–27 · 2nd Sem" for the term shown to students ('' when none is set). */
export function termBadge(p: AcademicPeriod | null | undefined): string {
  if (!p) return '';
  const m = normAY(p.academicYear).match(/^(\d{4})–(\d{4})$/);
  const ay = m ? `AY ${m[1].slice(2)}–${m[2].slice(2)}` : `AY ${normAY(p.academicYear)}`;
  const k = semesterKind(p.semester);
  const sem = k === '1' ? '1st Sem' : k === '2' ? '2nd Sem' : k === 'summer' ? 'Summer' : String(p.semester || '').trim();
  return sem ? `${ay} · ${sem}` : ay;
}

/** The term students can enroll in now: the active term when its window is open, else another open term. */
export function openEnrollmentTerm(periods: AcademicPeriod[], on = today()): AcademicPeriod | null {
  const list = (periods || []).filter((p) => enrollmentWindowOpen(p, on));
  return list.find((p) => p.isCurrent) || list[0] || null;
}

/** The term to show to students: the open term, else the current term. */
export function displayTerm(periods: AcademicPeriod[], on = today()): AcademicPeriod | null {
  return openEnrollmentTerm(periods, on) || (periods || []).find((p) => p.isCurrent) || null;
}

// ---------------------------------------------------------------------------
// Requirements (System Governance)
// ---------------------------------------------------------------------------

export interface ReenrollmentRules {
  requireAcademicClearance: boolean;
  requireFinancialClearance: boolean;
  documents: ReenrollmentRequirementTemplate[];
  passingGrade: number | null;
  progressionMinPercent: number;
}

export function reenrollmentRules(config?: Partial<EnrollmentSystemConfig> | null): ReenrollmentRules {
  const r = config?.reenrollment;
  const pg = Number(config?.passingGrade);
  return {
    requireAcademicClearance: r ? r.requireAcademicClearance !== false : true,
    requireFinancialClearance: r ? r.requireFinancialClearance !== false : true,
    documents: Array.isArray(r?.documents) ? r!.documents.filter((d) => d && d.name) : [],
    passingGrade: pg >= 1 && pg <= 5 ? pg : null,
    progressionMinPercent: Math.min(100, Math.max(1, Number(config?.progressionMinPercent) || 100)),
  };
}

// ---------------------------------------------------------------------------
// Academic standing and year level
// ---------------------------------------------------------------------------

export const normCode = (c?: string) => String(c || '').toUpperCase().replace(/[^A-Z0-9]/g, '');

export interface CompletedSubject {
  code: string;
  title: string;
  units: number;
  grade: string;
  /** e.g. "1st Semester, AY 2025–2026" (blank for credits without a term). */
  term: string;
  status: 'Passed' | 'Credited';
}

/**
 * Subjects the student has completed, by code: Passed or Credited in the academic history, and
 * current-term subjects whose published grade is passing (before the term is closed into the history).
 */
export function completedSubjects(student: Partial<StudentProfile>): Map<string, CompletedSubject> {
  const done = new Map<string, CompletedSubject>();
  for (const h of student.subjectHistory || []) {
    const status = String(h.status);
    if (status !== 'Passed' && status !== 'Credited') continue;
    const code = normCode(h.code);
    if (!code || done.has(code)) continue;
    done.set(code, {
      code: h.code,
      title: h.title || '',
      units: Number(h.units) || 0,
      grade: String(h.finalGrade ?? h.grade ?? ''),
      term: h.semester || h.academicYear ? termLabel(h.semester, h.academicYear) : '',
      status: status as CompletedSubject['status'],
    });
  }
  for (const c of student.courses || []) {
    const code = normCode(c.code);
    if (!code || done.has(code)) continue;
    if (c.status !== 'Completed' || c.gradeStatus !== 'Published' || String(c.gradeRemark || '').trim().toLowerCase() !== 'passed') continue;
    done.set(code, { code: c.code, title: c.title || '', units: Number(c.units) || 0, grade: String(c.finalGrade ?? ''), term: student.currentSemester || '', status: 'Passed' });
  }
  return done;
}

export function passedCodes(student: Partial<StudentProfile>): Set<string> {
  return new Set(completedSubjects(student).keys());
}

const yearIdx = (y: string) => YEAR_LEVELS.indexOf(normalizeYearLevel(y) || y);

export interface YearLevelSuggestion {
  yearLevel: string;
  current: string;
  advanced: boolean;
  /** Why this level was suggested (shown to the student and the Registrar). */
  reason: string;
  /** Needs the Registrar's decision (irregular, no curriculum, curriculum completed, …). */
  needsReview: boolean;
  passedUnits: number;
  totalUnits: number;
}

export function suggestYearLevel(
  student: Partial<StudentProfile>,
  programSubjects: CurriculumSubject[],
  termSemester: string,
  rules: ReenrollmentRules
): YearLevelSuggestion {
  const current = normalizeYearLevel(student.yearLevel) || String(student.yearLevel || '');
  const base = { yearLevel: current, current, advanced: false, needsReview: false, passedUnits: 0, totalUnits: 0 };
  const active = programSubjects.filter((s) => s.status !== 'Inactive');
  const status = String(student.academicStatus || '');
  if (['Irregular', 'Probationary', 'On Leave'].includes(status)) {
    return { ...base, needsReview: true, reason: `Your academic status is ${status}; the Registrar will confirm your year level.` };
  }
  if (active.length === 0 || yearIdx(current) < 0) {
    return { ...base, needsReview: true, reason: 'Your program’s curriculum is not set up yet; the Registrar will confirm your year level.' };
  }
  const passed = passedCodes(student);
  const ofYear = active.filter((s) => normalizeYearLevel(s.yearLevel) === current);
  const totalUnits = ofYear.reduce((t, s) => t + (Number(s.units) || 0), 0);
  const passedUnits = ofYear.filter((s) => passed.has(normCode(s.code))).reduce((t, s) => t + (Number(s.units) || 0), 0);
  const withUnits = { ...base, passedUnits, totalUnits };
  if (semesterKind(termSemester) !== '1') {
    return { ...withUnits, reason: `Year levels change at the start of an academic year, so you stay in ${current} for ${termSemester}.` };
  }
  const pct = totalUnits ? (passedUnits / totalUnits) * 100 : 0;
  if (!totalUnits || pct + 1e-9 < rules.progressionMinPercent) {
    return {
      ...withUnits,
      needsReview: passedUnits < totalUnits,
      reason: `You have passed ${passedUnits} of ${totalUnits} units of ${current}; ${rules.progressionMinPercent}% is needed to move up, so you stay in ${current}.`,
    };
  }
  const next = YEAR_LEVELS[yearIdx(current) + 1];
  const nextHasSubjects = !!next && active.some((s) => normalizeYearLevel(s.yearLevel) === next);
  if (!nextHasSubjects) {
    return {
      ...withUnits,
      needsReview: true,
      reason: `You have completed the ${current} curriculum and there is no later year level in your program; the Registrar will confirm your standing.`,
    };
  }
  return { ...withUnits, yearLevel: next, advanced: true, reason: `You passed ${passedUnits} of ${totalUnits} units of ${current}, so you may enroll in ${next}.` };
}

/**
 * The year level a student moves up to once they have completed (passed or been credited) every active
 * subject of their current year level in their program's curriculum, e.g. all 1st Year subjects → 2nd Year.
 * Moves past several levels if those are complete too, but never beyond the program's last year level with
 * subjects. null when the student stays where they are (or the curriculum or year level isn't known).
 */
export function completedYearLevelPromotion(
  student: Partial<StudentProfile>,
  programSubjects: CurriculumSubject[]
): { from: string; to: string } | null {
  const from = normalizeYearLevel(student.yearLevel) || '';
  if (yearIdx(from) < 0) return null;
  const active = (programSubjects || []).filter((s) => s.status !== 'Inactive');
  const ofLevel = (level: string) => active.filter((s) => normalizeYearLevel(s.yearLevel) === level);
  const passed = passedCodes(student);
  let level = from;
  for (;;) {
    const subjects = ofLevel(level);
    const next = YEAR_LEVELS[yearIdx(level) + 1];
    if (!subjects.length || !subjects.every((s) => passed.has(normCode(s.code))) || !next || !ofLevel(next).length) break;
    level = next;
  }
  return level === from ? null : { from, to: level };
}

/** Year levels a student may choose: their current level and, if suggested, the next one. */
export function yearLevelChoices(s: YearLevelSuggestion): string[] {
  return Array.from(new Set([s.current, s.yearLevel].filter(Boolean)));
}

// ---------------------------------------------------------------------------
// Subjects offered
// ---------------------------------------------------------------------------

export interface OfferedSubject extends SelectedSubject {
  yearLevel: string;
  backSubject: boolean;
  prerequisites?: string;
  prerequisitesMet: boolean;
}

/** Codes named in a prerequisite text ("BIB 101, THEO-102" → ["BIB101", "THEO102"]). "None" → []. */
export function prerequisiteCodes(text?: string): string[] {
  const t = String(text || '').trim();
  if (!t || /^(none|n\/a|-)$/i.test(t)) return [];
  return (t.match(/[A-Za-z]{2,}[\s-]?\d{2,4}[A-Za-z]?/g) || []).map(normCode);
}

/** Subjects for the chosen year level and term, not yet passed, plus back subjects from earlier year levels. */
export function offeredSubjects(
  programSubjects: CurriculumSubject[],
  catalog: AcademicSubject[],
  yearLevel: string,
  termSemester: string,
  student: Partial<StudentProfile>
): OfferedSubject[] {
  const passed = passedCodes(student);
  const kind = semesterKind(termSemester);
  const level = yearIdx(yearLevel);
  const byCode = new Map((catalog || []).filter((c) => !c.isArchived).map((c) => [normCode(c.code), c]));
  return programSubjects
    .filter((s) => s.status !== 'Inactive')
    .filter((s) => !passed.has(normCode(s.code)))
    .filter((s) => !s.semester || semesterKind(s.semester) === kind)
    .filter((s) => {
      const i = yearIdx(s.yearLevel);
      return i >= 0 && i <= level;
    })
    .map((s) => {
      const offering = byCode.get(normCode(s.code));
      const prereq = prerequisiteCodes(s.prerequisites);
      return {
        id: s.id,
        code: s.code,
        title: s.title,
        units: Number(s.units) || 0,
        schedule: offering?.schedule || 'TBA',
        room: offering?.room || 'TBA',
        instructor: offering?.instructor || 'TBA',
        yearLevel: normalizeYearLevel(s.yearLevel) || s.yearLevel,
        backSubject: yearIdx(s.yearLevel) < level,
        prerequisites: s.prerequisites,
        prerequisitesMet: prereq.every((c) => passed.has(c)),
      };
    })
    .sort((a, b) => Number(a.backSubject) - Number(b.backSubject) || yearIdx(a.yearLevel) - yearIdx(b.yearLevel) || a.code.localeCompare(b.code));
}

// ---------------------------------------------------------------------------
// Eligibility
// ---------------------------------------------------------------------------

export const ACTIVE_REQUEST_STATUSES = ['Draft', 'Submitted', 'Pending Requirements', 'For Verification', 'Under Review', 'Returned for Correction', 'Approved'];

export interface Eligibility {
  /** Eligible: may apply. Applied: already has a request for this term. Enrolled: already enrolled. */
  state: 'No Open Term' | 'Eligible' | 'Applied' | 'Enrolled' | 'Not Eligible';
  blockers: string[];
  flags: string[];
  request?: OnlineEnrollment;
}

export function requestForTerm(enrollments: OnlineEnrollment[], student: Partial<StudentProfile>, term: AcademicPeriod): OnlineEnrollment | undefined {
  const key = termKeyOf(term.semester, term.academicYear);
  return (enrollments || []).find(
    (e) =>
      (e.studentId === student.studentId || e.studentId === student.id || (!!e.studentRecordId && e.studentRecordId === student.id)) &&
      (e.termKey === key || (sameTerm(termLabel(e.semester, e.schoolYear), termLabel(term.semester, term.academicYear)))) &&
      ACTIVE_REQUEST_STATUSES.includes(String(e.status))
  );
}

/** The student is still enrolled in an earlier term that has not been closed (its subjects are not in the history yet). */
export function termStillOpen(student: Partial<StudentProfile>, newTermLabel: string): boolean {
  return !sameTerm(student.currentSemester, newTermLabel) && (student.courses || []).some((c) => c.status !== 'Dropped');
}

export function reenrollmentEligibility(
  student: Partial<StudentProfile>,
  term: AcademicPeriod | null,
  enrollments: OnlineEnrollment[]
): Eligibility {
  if (!term) return { state: 'No Open Term', blockers: [], flags: [] };
  const label = termLabel(term.semester, term.academicYear);
  if (String(student.enrollmentStatus) === 'Enrolled' && sameTerm(student.currentSemester, label)) {
    return { state: 'Enrolled', blockers: [], flags: [] };
  }
  const request = requestForTerm(enrollments, student, term);
  // A request returned for correction (or a draft) can be revised; any other request stands.
  const revisable = !!request && ['Returned for Correction', 'Draft'].includes(String(request.status));
  if (request && !revisable) return { state: request.status === 'Approved' ? 'Enrolled' : 'Applied', blockers: [], flags: [], request };

  const blockers: string[] = [];
  if (student.enrollmentHold?.active) blockers.push(`Enrollment hold: ${student.enrollmentHold.reason || 'please see the Registrar'}.`);
  if (['Suspended', 'Inactive'].includes(String(student.accountStatus))) blockers.push(`Your student account is ${student.accountStatus}.`);
  if (['Alumni', 'Graduated', 'Dismissed', 'Withdrawn'].includes(String(student.academicStatus))) {
    blockers.push(`Your academic status is ${student.academicStatus}.`);
  }
  if (term.capacity && (term.enrolledCount || 0) >= term.capacity) blockers.push('Enrollment for this term has reached its capacity.');

  const flags: string[] = [];
  if (termStillOpen(student, label)) {
    flags.push(`${student.currentSemester} must be closed by the Registrar before this enrollment can be approved.`);
  }
  const balance = Number(student.tuitionBalance) || 0;
  if (balance > 0) flags.push(`Outstanding balance of ₱${balance.toLocaleString('en-PH')} (financial clearance).`);
  const history = student.subjectHistory || [];
  const inc = history.filter((h) => h.status === 'Incomplete').length;
  const failed = history.filter((h) => h.status === 'Failed').length;
  if (inc) flags.push(`${inc} subject${inc === 1 ? '' : 's'} marked Incomplete.`);
  if (failed) flags.push(`${failed} failed subject${failed === 1 ? '' : 's'} to retake.`);
  if (['Irregular', 'Probationary', 'On Leave'].includes(String(student.academicStatus))) flags.push(`Academic status: ${student.academicStatus}.`);
  const last = String(student.lastEnrolledTerm || student.currentSemester || '');
  const lastYear = Number(last.match(/(\d{4})\s*[-–—]\s*\d{4}/)?.[1]);
  const termYear = Number(normAY(term.academicYear).slice(0, 4));
  if (lastYear && termYear && termYear - lastYear >= 2) flags.push(`Returning after a gap (last enrolled ${last}).`);

  return { state: blockers.length ? 'Not Eligible' : 'Eligible', blockers, flags, request };
}

// ---------------------------------------------------------------------------
// Closing a term
// ---------------------------------------------------------------------------

export interface TermClosePlan {
  updates: Partial<StudentProfile>;
  entries: StudentSubjectHistory[];
  withoutGrade: number;
}

/** What closing the term does to one student's record, or null when the student was not enrolled in it. */
export function planTermClose(
  student: StudentProfile,
  term: AcademicPeriod,
  passingGrade: number,
  actor: string,
  now: string
): TermClosePlan | null {
  const label = termLabel(term.semester, term.academicYear);
  if (!sameTerm(student.currentSemester, label)) return null;
  const courses = (student.courses || []).filter((c) => c.status !== 'Dropped');
  if (String(student.enrollmentStatus) !== 'Enrolled' && courses.length === 0) return null;

  const ay = normAY(term.academicYear);
  const history = student.subjectHistory || [];
  const seen = new Set(history.map((h) => `${normCode(h.code)}|${squash(h.semester)}|${squash(normAY(h.academicYear))}`));
  let withoutGrade = 0;
  const entries: StudentSubjectHistory[] = [];
  for (const c of courses) {
    const key = `${normCode(c.code)}|${squash(term.semester)}|${squash(ay)}`;
    if (seen.has(key)) continue;
    const raw = String(c.finalGrade ?? '').trim();
    const num = Number(raw);
    let status: StudentSubjectHistory['status'];
    const remark = String(c.gradeRemark || '').trim().toLowerCase();
    if (raw && remark) {
      // A published grade carries its remark from PCM's grading scale.
      status = remark === 'passed' ? 'Passed' : remark === 'failed' ? 'Failed' : 'Incomplete';
    } else if (raw && !Number.isNaN(num) && num > 0) status = num <= passingGrade ? 'Passed' : 'Failed';
    else {
      status = 'Incomplete';
      if (!raw) withoutGrade += 1;
    }
    entries.push({
      id: `hist-${normCode(c.code).toLowerCase()}-${squash(term.semester)}-${ay.slice(0, 4)}`,
      code: c.code,
      title: c.title,
      units: Number(c.units) || 0,
      grade: raw && !Number.isNaN(num) ? num : raw,
      finalGrade: c.finalGrade ?? '',
      midtermGrade: c.midtermGrade ?? '',
      instructor: c.instructor || '',
      semester: term.semester,
      academicYear: ay,
      status,
    });
  }
  const subjectHistory = [...history, ...entries];
  const units = courses.reduce((t, c) => t + (Number(c.units) || 0), 0);
  const record: StudentTermRecord = {
    term: label,
    semester: term.semester,
    academicYear: ay,
    yearLevel: student.yearLevel || '',
    units,
    subjects: courses.length,
    assessment: typeof student.termAssessment === 'number' ? student.termAssessment : undefined,
    closedAt: now,
    closedBy: actor,
  };
  return {
    entries,
    withoutGrade,
    updates: {
      subjectHistory,
      gpa: calculateGPAFromGrades(subjectHistory),
      totalUnitsEarned: subjectHistory.filter((h) => ['Passed', 'Credited'].includes(String(h.status))).reduce((t, h) => t + (Number(h.units) || 0), 0),
      courses: [],
      enrollmentStatus: 'Not Enrolled',
      lastEnrolledTerm: label,
      termHistory: [...(student.termHistory || []).filter((t) => !sameTerm(t.term, label)), record],
      updatedAt: now,
    },
  };
}

// ---------------------------------------------------------------------------
// Required documents for a re-enrollment request (enrollments/{id}/requirements)
// ---------------------------------------------------------------------------

export interface ReenrollmentDocument {
  id: string;
  name: string;
  description?: string;
  required: boolean;
  status: 'Missing' | 'Submitted' | 'Verified' | 'Rejected';
  studentUid?: string;
  fileName?: string;
  fileType?: string;
  fileSize?: number;
  fileDataUrl?: string;
  uploadedAt?: string;
  reviewedBy?: string;
  reviewedAt?: string;
  remarks?: string;
}

// Staff read all of a request's documents; a student passes their uid (rules only allow reading their own).
export function useReenrollmentDocuments(enrollmentId?: string | null, studentUid?: string): { docs: ReenrollmentDocument[]; loaded: boolean } {
  const [docs, setDocs] = useState<ReenrollmentDocument[]>([]);
  const [loaded, setLoaded] = useState(false);
  useEffect(() => {
    setDocs([]);
    setLoaded(false);
    if (!enrollmentId) return;
    const col = collection(db, 'enrollments', enrollmentId, 'requirements');
    return onSnapshot(
      studentUid ? query(col, where('studentUid', '==', studentUid)) : col,
      (snap) => {
        setDocs(snap.docs.map((d) => ({ id: d.id, ...(d.data() as any) })));
        setLoaded(true);
      },
      (err) => {
        console.warn('re-enrollment documents', err);
        setLoaded(true);
      }
    );
  }, [enrollmentId, studentUid]);
  return { docs, loaded };
}

/** The required documents merged with what the student has uploaded. */
export function documentChecklist(templates: ReenrollmentRequirementTemplate[], uploaded: ReenrollmentDocument[]): ReenrollmentDocument[] {
  const byId = new Map(uploaded.map((d) => [d.id, d]));
  return templates.map((t) => ({ ...t, status: 'Missing' as const, ...(byId.get(t.id) || {}), name: t.name, required: t.required }));
}

export async function uploadReenrollmentDocument(
  enrollmentId: string,
  template: ReenrollmentRequirementTemplate,
  studentUid: string,
  file: { dataUrl: string; size: number; type: string; name: string },
  existing?: ReenrollmentDocument
): Promise<void> {
  const ref = doc(db, 'enrollments', enrollmentId, 'requirements', template.id);
  const fileFields = { status: 'Submitted', fileName: file.name, fileType: file.type, fileSize: file.size, fileDataUrl: file.dataUrl, uploadedAt: new Date().toISOString() };
  if (existing && existing.status !== 'Missing') await updateDoc(ref, fileFields);
  else await setDoc(ref, { id: template.id, name: template.name, required: template.required, studentUid, ...fileFields });
}

export async function reviewReenrollmentDocument(
  enrollmentId: string,
  docId: string,
  status: 'Verified' | 'Rejected',
  actor: string,
  remarks = ''
): Promise<void> {
  await updateDoc(doc(db, 'enrollments', enrollmentId, 'requirements', docId), {
    status,
    reviewedBy: actor,
    reviewedAt: new Date().toISOString(),
    remarks,
  });
}

/** What still blocks approval of a re-enrollment request (empty when it can be approved). */
export function approvalBlockers(e: OnlineEnrollment, rules: ReenrollmentRules, checklist: ReenrollmentDocument[]): string[] {
  if (!e.reenrollment) return [];
  const out: string[] = [];
  if (rules.requireAcademicClearance && e.clearances?.academic?.status !== 'Cleared') out.push('Academic clearance is not cleared.');
  if (rules.requireFinancialClearance && e.clearances?.financial?.status !== 'Cleared') out.push('Financial clearance is not cleared.');
  checklist.filter((d) => d.required && d.status !== 'Verified').forEach((d) => out.push(`${d.name} is not verified.`));
  if (!e.approvedYearLevel) out.push('Confirm the year level.');
  return out;
}

/** Status shown to the student for a re-enrollment request. */
export function reenrollmentStatusLabel(e?: OnlineEnrollment | null): string {
  if (!e) return '';
  switch (e.status) {
    case 'Approved':
    case 'Enrolled':
      return 'Enrolled';
    case 'Submitted':
    case 'Under Review':
      return 'For Verification';
    case 'Rejected':
      return 'Not Eligible';
    default:
      return String(e.status);
  }
}
