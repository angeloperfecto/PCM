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
import { YEAR_LEVELS, normalizeYearLevel } from './curriculum';
import { normAY, normCode, offeredSubjects, passedCodes, prerequisiteCodes, semesterKind, termKeyOf, type OfferedSubject } from './reenrollment';
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

/** Offerings with no program are open to every program. */
export function offeringForProgram(o: Partial<AcademicSubject> & { programId?: string }, program: Partial<AcademicProgram> | null | undefined): boolean {
  if (!o.programId && !o.program) return true;
  if (!program) return true;
  if (o.programId && program.id) return o.programId === program.id;
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
}

export interface StudentTermSubjects {
  /** The Registrar has set up subjects for this term. */
  configured: boolean;
  subjects: StudentTermSubject[];
  /** Curriculum subjects for this semester and year level that are not offered this term. */
  notOffered: { code: string; title: string; units: number; yearLevel: string }[];
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
  if (!term) return { configured: false, subjects: [], notOffered: [] };
  const yearLevel = input.yearLevel || student.yearLevel || '';
  const level = yearIdx(yearLevel);
  const passed = passedCodes(student);
  const kind = semesterKind(term.semester);
  const curriculum = (input.programSubjects || []).filter((s) => s.status !== 'Inactive');
  const currByCode = new Map(curriculum.map((s) => [normCode(s.code), s]));
  const all = termOfferings(catalog, term);

  if (all.length === 0) {
    // Not set up yet: the curriculum with older unassigned offerings (previous behaviour).
    const legacy = unassignedOfferings(catalog).filter((o) => !o.semester || !kind || semesterKind(o.semester) === kind);
    if (curriculum.length) {
      const byCode = new Map(legacy.map((o) => [normCode(o.code), o]));
      const subjects = offeredSubjects(curriculum, legacy, yearLevel, term.semester || '', student).map((s) => {
        const o = byCode.get(normCode(s.code));
        return o ? { ...fromOffering(o, {}), ...s, id: o.id, offeringId: o.id } : { ...s, id: s.id || s.code, offeringId: '', section: '', capacity: 0, enrolledCount: 0, full: false, closed: false };
      });
      return { configured: false, subjects, notOffered: [] };
    }
    return {
      configured: false,
      subjects: legacy.filter((o) => !passed.has(normCode(o.code)) && offeringForProgram(o, program)).map((o) => fromOffering(o, {})),
      notOffered: [],
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
  return { configured: true, subjects, notOffered };
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
  // A removed offering with the same id is restored instead of overwritten by a new one.
  const fresh: typeof toWrite = [];
  for (const w of toWrite) {
    const snap = await getDoc(doc(db, 'academicSubjects', w.id));
    if (snap.exists()) skipped += 1;
    else fresh.push(w);
  }
  for (let i = 0; i < fresh.length; i += 400) {
    const batch = writeBatch(db);
    fresh.slice(i, i + 400).forEach((w) => batch.set(doc(db, 'academicSubjects', w.id), JSON.parse(JSON.stringify(w.data))));
    await batch.commit();
  }
  return { created: fresh.length, skipped };
}
