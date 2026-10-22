// Historical student records and alumni (PCM was founded in 1992; many graduated before the website existed).
//
// An alumni record is an ordinary student record (studentProfiles/{id}) marked as graduated, with the PCM graduation
// details in `alumni` and the subjects taken in `subjectHistory`. It is added by the Registrar or an Admin with the
// graduate's Gmail address; when the graduate first signs in with that Gmail account, the existing Student Portal
// sign-in links the record to their account (authUid) and shows them their own record only. firestore.rules keeps
// every other student out, and keeps the graduate from changing their academic or graduation details.

import { Firestore, doc, setDoc } from 'firebase/firestore';
import { calculateGPAFromGrades } from './studentDefaults';
import { normAY, termLabel } from './reenrollment';
import type { AlumniInfo, StudentProfile, StudentSubjectHistory, StudentTermRecord } from './types';

export const PCM_FOUNDED = 1992;

export type { AlumniInfo };

export const canManageAlumni = (role?: string) => ['Super Admin', 'Admin', 'Registrar'].includes(String(role || ''));

/** A graduate's record (added here, or a student whose status is Alumni / Graduated). */
export function isAlumniRecord(p?: Partial<StudentProfile> | null): boolean {
  if (!p) return false;
  return !!(p as any).alumni || /^(alumni|graduated)$/i.test(String(p.academicStatus || '')) || /^graduated$/i.test(String(p.enrollmentStatus || ''));
}

export const graduationYears = (now = new Date()): number[] => {
  const years: number[] = [];
  for (let y = now.getFullYear(); y >= PCM_FOUNDED; y--) years.push(y);
  return years;
};

const SEM_ORDER = (s: string) => (/1st|first/i.test(s) ? 1 : /2nd|second/i.test(s) ? 2 : /summer/i.test(s) ? 3 : 4);

/** Subjects grouped by term, oldest first (for the transcript and the enrollment history). */
export function subjectsByTerm(subjects: StudentSubjectHistory[]): { term: string; semester: string; academicYear: string; subjects: StudentSubjectHistory[] }[] {
  const groups = new Map<string, { term: string; semester: string; academicYear: string; subjects: StudentSubjectHistory[] }>();
  for (const s of subjects || []) {
    const ay = normAY(s.academicYear || '');
    const sem = String(s.semester || '').trim();
    const key = `${ay}|${sem}`;
    if (!groups.has(key)) groups.set(key, { term: ay || sem ? termLabel(sem, ay) : 'Term not recorded', semester: sem, academicYear: ay, subjects: [] });
    groups.get(key)!.subjects.push(s);
  }
  return [...groups.values()].sort((a, b) => a.academicYear.localeCompare(b.academicYear) || SEM_ORDER(a.semester) - SEM_ORDER(b.semester));
}

export interface AlumniInput {
  id?: string;
  studentId: string;
  firstName: string;
  middleName: string;
  lastName: string;
  suffix: string;
  email: string;
  phone: string;
  dateOfBirth: string;
  sex: string;
  address: string;
  program: string;
  programId: string;
  graduationYear: string;
  graduationDate: string;
  degreeConferred: string;
  honors: string;
  yearEntered: string;
  notes: string;
  subjects: StudentSubjectHistory[];
}

const isEmail = (e: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e);

/** What is wrong with the form, or null. */
export function checkAlumniInput(input: AlumniInput, others: Partial<StudentProfile>[], now = new Date()): string | null {
  const id = input.studentId.trim().toUpperCase();
  const email = input.email.trim().toLowerCase();
  const year = Number(input.graduationYear);
  if (!input.firstName.trim() || !input.lastName.trim()) return 'Enter the first and last name.';
  if (!id) return 'Enter the Student ID.';
  if (others.some((s) => s.id !== input.id && String(s.studentId || '').trim().toUpperCase() === id)) return `Student ID ${id} is already used by another record.`;
  if (!isEmail(email)) return 'Enter the graduate’s Gmail address (the account they will sign in with).';
  const taken = others.find((s) => s.id !== input.id && String(s.email || '').trim().toLowerCase() === email);
  if (taken) return `${email} is already used by ${taken.fullName || taken.name || taken.studentId}.`;
  if (!input.program.trim()) return 'Choose the program the student graduated from.';
  if (!Number.isInteger(year) || year < PCM_FOUNDED || year > now.getFullYear()) return `Choose the graduation year (${PCM_FOUNDED}–${now.getFullYear()}).`;
  if (input.yearEntered && (!/^\d{4}$/.test(input.yearEntered) || Number(input.yearEntered) < PCM_FOUNDED - 6 || Number(input.yearEntered) > year)) return 'The year entered must be a year on or before the graduation year.';
  if (input.graduationDate && Number(input.graduationDate.slice(0, 4)) !== year) return 'The graduation date must be in the graduation year.';
  for (const s of input.subjects) {
    if (!s.code.trim() || !s.title.trim()) return 'Each subject needs a code and a title.';
    if (!(Number(s.units) > 0)) return `Enter the units for ${s.code || 'each subject'}.`;
  }
  return null;
}

/** Saves (creates or updates) a graduate's record. Returns the record id. */
export async function saveAlumniRecord(db: Firestore, input: AlumniInput, existing: Partial<StudentProfile> | null, staffName: string): Promise<string> {
  const timestamp = new Date().toISOString();
  const id = existing?.id || input.id || `alum-${Date.now()}`;
  const email = input.email.trim().toLowerCase();
  const subjects: StudentSubjectHistory[] = input.subjects.map((s, i) => ({
    id: s.id || `h-${Date.now()}-${i}`,
    code: s.code.trim().toUpperCase(),
    title: s.title.trim(),
    units: Number(s.units) || 0,
    grade: s.grade === '' || s.grade === undefined ? '' : !Number.isNaN(Number(s.grade)) ? Number(s.grade) : String(s.grade).trim().toUpperCase(),
    finalGrade: String(s.grade ?? '').trim(),
    semester: String(s.semester || '').trim(),
    academicYear: normAY(String(s.academicYear || '')),
    status: s.status || 'Passed',
  }));
  const termHistory: StudentTermRecord[] = subjectsByTerm(subjects).map((t) => ({
    term: t.term,
    semester: t.semester,
    academicYear: t.academicYear,
    yearLevel: '',
    units: t.subjects.reduce((n, s) => n + (Number(s.units) || 0), 0),
    subjects: t.subjects.length,
    closedAt: '',
  }));
  const fullName = [input.firstName, input.middleName, input.lastName, input.suffix].map((x) => x.trim()).filter(Boolean).join(' ');
  const alumni: AlumniInfo = {
    graduationYear: Number(input.graduationYear),
    degreeConferred: input.degreeConferred.trim() || input.program.trim(),
    ...(input.graduationDate ? { graduationDate: input.graduationDate } : {}),
    ...(input.honors.trim() ? { honors: input.honors.trim() } : {}),
    ...(input.yearEntered ? { yearEntered: input.yearEntered } : {}),
    ...(input.notes.trim() ? { notes: input.notes.trim() } : {}),
    addedBy: (existing as any)?.alumni?.addedBy || staffName,
    addedAt: (existing as any)?.alumni?.addedAt || timestamp,
    updatedBy: staffName,
  };
  // A changed Gmail address is linked again at that account's first sign-in.
  const relink = !!existing && String(existing.email || '').toLowerCase() !== email && !!(existing as any).authUid;
  const data: Record<string, unknown> = {
    id,
    studentId: input.studentId.trim().toUpperCase(),
    firstName: input.firstName.trim(),
    middleName: input.middleName.trim(),
    lastName: input.lastName.trim(),
    suffix: input.suffix.trim(),
    fullName,
    name: fullName,
    email,
    phone: input.phone.trim(),
    mobileNumber: input.phone.trim(),
    dateOfBirth: input.dateOfBirth,
    sex: input.sex,
    currentAddress: input.address.trim(),
    address: input.address.trim(),
    program: input.program.trim(),
    degreeProgram: input.program.trim(),
    programId: input.programId,
    academicStatus: 'Alumni',
    enrollmentStatus: 'Graduated',
    yearLevel: '',
    currentSemester: '',
    courses: [],
    subjectHistory: subjects,
    termHistory,
    gpa: calculateGPAFromGrades(subjects),
    totalUnitsEarned: subjects.filter((s) => s.status === 'Passed' || s.status === 'Credited').reduce((n, s) => n + (Number(s.units) || 0), 0),
    alumni,
    recordSource: (existing as any)?.recordSource || 'Historical record (added by staff)',
    updatedAt: timestamp,
    ...(existing ? {} : { createdAt: timestamp, createdBy: staffName, authUid: '' }),
    ...(relink ? { authUid: '', linkedAt: null } : {}),
  };
  await setDoc(doc(db, 'studentProfiles', id), JSON.parse(JSON.stringify(data)), { merge: true });
  return id;
}
