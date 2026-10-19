// Professors for classes and grading come from Faculty & Trustees (the list the Admin maintains). Each
// professor chosen for a class is linked to an instructor record (instructors collection), which holds the
// Google email used to sign in to the Faculty Portal and is what grade sheets point to.
//
// A class (Term Subjects offering or class section) stores the professor's name and, when linked, the
// instructor record id. resolveSectionProfessor() reads both the same way in Enrollment & Records and in
// Grade Management, so a professor set in one shows in the other.

import type { FacultyMember, InstructorRecord } from './types';

const squash = (s?: string) => String(s || '').toLowerCase().replace(/[^a-z0-9]/g, '');
const normEmail = (e?: string) => String(e || '').trim().toLowerCase();
const HONORIFIC = /^(the\s+)?(rev(erend)?|rt\.?\s*rev|dr|prof(essor)?|pastor|ptr|atty|attorney|mr|mrs|ms|miss|bishop|engr|fr|sis|sister|bro|brother|hon|dean)\.?\s+/i;

/** "Rev. Dr. Jonathan Reyes" / "Jonathan Reyes" → the same comparable name (titles ignored). */
export function bareName(name?: string): string {
  let s = String(name || '').trim();
  for (let prev = ''; prev !== s; ) {
    prev = s;
    s = s.replace(HONORIFIC, '').trim();
  }
  return squash(s);
}

export function sameProfessorName(a?: string, b?: string): boolean {
  const x = bareName(a);
  return !!x && x === bareName(b);
}

/** "Rev. Dr." + "Jonathan Reyes" → "Rev. Dr. Jonathan Reyes", without repeating a title the name already has. */
export function professorDisplayName(p: { title?: string; fullName?: string; name?: string } | null | undefined): string {
  if (!p) return '';
  const name = String(p.fullName || p.name || '').trim();
  const title = String(p.title || '').trim();
  if (!title) return name;
  return squash(name).startsWith(squash(title)) ? name : `${title} ${name}`.trim();
}

const insNameMatches = (i: InstructorRecord, name?: string) => sameProfessorName(i.fullName, name) || sameProfessorName(professorDisplayName(i), name);

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
  return (
    instructors.find((i) => i.facultyId === member.id) ||
    (email ? instructors.find((i) => normEmail(i.email) === email) : undefined) ||
    instructors.find((i) => !i.facultyId && insNameMatches(i, member.name))
  );
}

/** The Faculty & Trustees member an instructor record belongs to (reverse of instructorForFaculty). */
export function facultyForInstructor(ins: InstructorRecord | undefined, faculty: FacultyMember[]): FacultyMember | undefined {
  if (!ins) return undefined;
  const email = normEmail(ins.email);
  return (
    (ins.facultyId ? faculty.find((m) => m.id === ins.facultyId) : undefined) ||
    (email ? faculty.find((m) => normEmail(m.email) === email) : undefined) ||
    faculty.find((m) => insNameMatches(ins, m.name))
  );
}

export interface ResolvedProfessor {
  instructor?: InstructorRecord;
  member?: FacultyMember;
  /** The sign-in email: the instructor record's, else the Faculty & Trustees entry's. */
  email: string;
  name: string;
}

/**
 * The professor of a class, read the same way everywhere. The stored link (instructorId) is used unless the
 * class's professor name was changed since (then the name decides); names match with or without titles.
 */
export function resolveSectionProfessor(
  section: { instructorId?: string; instructorName?: string },
  instructors: InstructorRecord[],
  faculty: FacultyMember[] = []
): ResolvedProfessor {
  const name = String(section.instructorName || '').trim();
  let instructor = section.instructorId ? instructors.find((i) => i.id === section.instructorId) : undefined;
  if (instructor && name && !insNameMatches(instructor, name)) instructor = undefined; // stale link
  if (!instructor && name) instructor = instructors.find((i) => insNameMatches(i, name));
  let member = facultyForInstructor(instructor, faculty);
  if (!member && name) member = faculty.find((m) => sameProfessorName(m.name, name));
  if (member && !instructor) instructor = instructorForFaculty(member, instructors);
  return {
    instructor,
    member,
    email: normEmail(instructor?.email) || normEmail(member?.email),
    name: member?.name || (instructor ? professorDisplayName(instructor) : name),
  };
}

/**
 * Makes sure a Faculty & Trustees member has a linked instructor record (created from their entry when
 * missing; link and email filled in when missing). Returns the record, or null if it could not be saved.
 */
export async function linkFacultyMember(
  member: FacultyMember,
  instructors: InstructorRecord[],
  api: {
    addInstructor: (i: Omit<InstructorRecord, 'id'>) => Promise<InstructorRecord | null>;
    updateInstructor: (id: string, u: Partial<InstructorRecord>) => Promise<boolean>;
  }
): Promise<InstructorRecord | null> {
  const email = normEmail(member.email);
  const existing = instructorForFaculty(member, instructors);
  if (!existing) {
    return api.addInstructor({
      employeeId: '',
      fullName: member.name,
      title: '',
      email,
      department: member.department || '',
      status: 'Active',
      facultyId: member.id,
    });
  }
  const updates: Partial<InstructorRecord> = {};
  if (existing.facultyId !== member.id) updates.facultyId = member.id;
  if (!normEmail(existing.email) && email) updates.email = email;
  if (Object.keys(updates).length) {
    if (!(await api.updateInstructor(existing.id, updates))) return null;
    return { ...existing, ...updates };
  }
  return existing;
}
