// Professors for classes and grading come from Faculty & Trustees (the list the Admin maintains). Each
// professor chosen for a class is linked to an instructor record (instructors collection), which holds the
// Google email used to sign in to the Faculty Portal and is what grade sheets point to.

import type { FacultyMember, InstructorRecord } from './types';

const squash = (s?: string) => String(s || '').toLowerCase().replace(/[^a-z0-9]/g, '');
const normEmail = (e?: string) => String(e || '').trim().toLowerCase();

/** "Rev. Dr." + "Jonathan Reyes" → "Rev. Dr. Jonathan Reyes", without repeating a title the name already has. */
export function professorDisplayName(p: { title?: string; fullName?: string; name?: string } | null | undefined): string {
  if (!p) return '';
  const name = String(p.fullName || p.name || '').trim();
  const title = String(p.title || '').trim();
  if (!title) return name;
  return squash(name).startsWith(squash(title)) ? name : `${title} ${name}`.trim();
}

/** Faculty & Trustees groups whose members teach (listed first). */
export function isTeachingGroup(group?: string): boolean {
  return /faculty|adjunct|emeritus|professor|instructor/i.test(String(group || ''));
}

/** People who can be assigned to a class: everyone in Faculty & Trustees except archived entries, teaching groups first. */
export function assignableProfessors(faculty: FacultyMember[]): { teaching: FacultyMember[]; others: FacultyMember[] } {
  const list = (faculty || [])
    .filter((m) => m && m.name && String(m.status || '').toLowerCase() !== 'archived')
    .sort((a, b) => a.name.localeCompare(b.name));
  return { teaching: list.filter((m) => isTeachingGroup(m.group)), others: list.filter((m) => !isTeachingGroup(m.group)) };
}

/** The instructor record for a Faculty & Trustees member: linked by id, else the same email, else the same name. */
export function instructorForFaculty(member: FacultyMember, instructors: InstructorRecord[]): InstructorRecord | undefined {
  const email = normEmail(member.email);
  const name = squash(member.name);
  return (
    instructors.find((i) => i.facultyId === member.id) ||
    (email ? instructors.find((i) => normEmail(i.email) === email) : undefined) ||
    instructors.find((i) => !i.facultyId && name && (squash(i.fullName) === name || squash(professorDisplayName(i)) === name))
  );
}

/** The Faculty & Trustees member an instructor record belongs to (reverse of instructorForFaculty). */
export function facultyForInstructor(ins: InstructorRecord | undefined, faculty: FacultyMember[]): FacultyMember | undefined {
  if (!ins) return undefined;
  const email = normEmail(ins.email);
  return (
    (ins.facultyId ? faculty.find((m) => m.id === ins.facultyId) : undefined) ||
    (email ? faculty.find((m) => normEmail(m.email) === email) : undefined) ||
    faculty.find((m) => squash(m.name) && (squash(m.name) === squash(ins.fullName) || squash(m.name) === squash(professorDisplayName(ins))))
  );
}
