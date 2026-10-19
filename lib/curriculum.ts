// Subjects per year level (curriculumSubjects collection). Helpers shared by the admin editor
// (Enrollment & Records → Subjects per Year Level) and the Student Portal's Curriculum tab.

import type { AcademicProgram, CurriculumSubject, StudentProfile } from './types';

export const YEAR_LEVELS = ['1st Year', '2nd Year', '3rd Year', '4th Year', '5th Year'];
export const SEMESTERS = ['1st Semester', '2nd Semester', 'Summer'];
export const SUBJECT_TYPES = ['Core', 'Major', 'General Education', 'Elective', 'Practicum'];

const norm = (s?: string) => (s || '').toLowerCase().replace(/[^a-z0-9]/g, '');

// "First Year (Biblical Foundations)", "Year 2", "3rd Year (Junior)" → "1st Year" / "2nd Year" / "3rd Year".
export function normalizeYearLevel(text?: string): string {
  const t = (text || '').toLowerCase();
  const words: [RegExp, string][] = [
    [/\b(first|1st|year\s*1|freshman)\b/, '1st Year'],
    [/\b(second|2nd|year\s*2|sophomore)\b/, '2nd Year'],
    [/\b(third|3rd|year\s*3|junior)\b/, '3rd Year'],
    [/\b(fourth|4th|year\s*4|senior)\b/, '4th Year'],
    [/\b(fifth|5th|year\s*5)\b/, '5th Year'],
  ];
  return words.find(([re]) => re.test(t))?.[1] || '';
}

export function normalizeSemester(text?: string): string {
  const t = (text || '').toLowerCase();
  if (/\b(1st|first)\s*sem/.test(t)) return '1st Semester';
  if (/\b(2nd|second)\s*sem/.test(t)) return '2nd Semester';
  if (/summer/.test(t)) return 'Summer';
  return '';
}

const programKeys = (p: Partial<AcademicProgram>) => [p.id, p.name, p.title, p.code].filter(Boolean).map((x) => norm(String(x)));

// The program a student belongs to (by id, name, title or code).
export function programForStudent(programs: AcademicProgram[], student: Partial<StudentProfile>): AcademicProgram | null {
  const keys = [student.programId, student.degreeProgram, student.program].filter(Boolean).map((x) => norm(String(x)));
  if (keys.length === 0) return null;
  return (
    // The student's own program id first, so a same-named program record can't take its place.
    (student.programId ? programs.find((p) => p.id === student.programId) : undefined) ||
    programs.find((p) => programKeys(p).some((k) => keys.includes(k))) ||
    programs.find((p) => programKeys(p).some((k) => k.length > 3 && keys.some((s) => s.includes(k) || k.includes(s)))) ||
    null
  );
}

export function subjectsForProgram(subjects: CurriculumSubject[], program: Partial<AcademicProgram> | null): CurriculumSubject[] {
  if (!program) return [];
  const keys = programKeys(program);
  return subjects.filter((s) => s.programId === program.id || keys.includes(norm(s.programName)));
}

const yearIndex = (y: string) => {
  const i = YEAR_LEVELS.indexOf(y);
  return i < 0 ? 99 : i;
};
const semIndex = (s: string) => {
  const i = SEMESTERS.indexOf(s);
  return s === '' ? -1 : i < 0 ? 98 : i;
};

// Year level → semester → subjects, in curriculum order.
export function groupByYearAndSemester(subjects: CurriculumSubject[]): { yearLevel: string; semesters: { semester: string; subjects: CurriculumSubject[]; units: number }[]; units: number }[] {
  const years = Array.from(new Set(subjects.map((s) => s.yearLevel || ''))).sort((a, b) => yearIndex(a) - yearIndex(b) || a.localeCompare(b));
  return years.map((yearLevel) => {
    const inYear = subjects.filter((s) => (s.yearLevel || '') === yearLevel);
    const sems = Array.from(new Set(inYear.map((s) => s.semester || ''))).sort((a, b) => semIndex(a) - semIndex(b) || a.localeCompare(b));
    const semesters = sems.map((semester) => {
      const list = inYear
        .filter((s) => (s.semester || '') === semester)
        .sort((a, b) => (a.order ?? 999) - (b.order ?? 999) || a.code.localeCompare(b.code));
      return { semester, subjects: list, units: list.reduce((t, s) => t + (Number(s.units) || 0), 0) };
    });
    return { yearLevel, semesters, units: semesters.reduce((t, s) => t + s.units, 0) };
  });
}

// Checks a subject before saving. Returns a message, or null when it is fine.
export function validateCurriculumSubject(s: Partial<CurriculumSubject>, all: CurriculumSubject[]): string | null {
  if (!s.programId) return 'Choose the program.';
  if (!s.yearLevel) return 'Choose the year level.';
  if (!s.code || !s.code.trim()) return 'Enter the subject code.';
  if (!s.title || !s.title.trim()) return 'Enter the subject title.';
  const units = Number(s.units);
  if (!Number.isFinite(units) || units < 0 || units > 30) return 'Units must be a number from 0 to 30.';
  const duplicate = all.find(
    (x) => x.id !== s.id && x.programId === s.programId && norm(x.code) === norm(s.code) && x.yearLevel === s.yearLevel && (x.semester || '') === (s.semester || '')
  );
  if (duplicate) return `${duplicate.code} is already in ${s.yearLevel}${s.semester ? `, ${s.semester}` : ''} of this program.`;
  return null;
}

// Subjects from the programs' existing curriculum (Academic Programs) that are not in the
// collection yet. Nothing already in the collection is changed.
export function curriculumToImport(programs: AcademicProgram[], existing: CurriculumSubject[]): Omit<CurriculumSubject, 'id'>[] {
  const out: Omit<CurriculumSubject, 'id'>[] = [];
  programs.forEach((p) => {
    (p.curriculum || []).forEach((block) => {
      const yearLevel = normalizeYearLevel(block.yearOrModule) || block.yearOrModule || '';
      const semester = normalizeSemester(block.yearOrModule);
      (block.courses || []).forEach((c, i) => {
        if (!c.code || !c.title) return;
        const dup = [...existing, ...out].some(
          (x) => x.programId === p.id && norm(x.code) === norm(c.code) && x.yearLevel === yearLevel && (x.semester || '') === semester
        );
        if (dup) return;
        out.push({
          programId: p.id,
          programName: p.name || p.title || p.code,
          yearLevel,
          semester,
          code: c.code.trim(),
          title: c.title.trim(),
          description: c.description || '',
          units: Number(c.units) || 0,
          prerequisites: '',
          type: 'Core',
          order: i,
          status: 'Active',
        });
      });
    });
  });
  return out;
}

// The semesters every year level is organised into (stored value → heading).
export const SEMESTER_SECTIONS: { key: string; label: string }[] = [
  { key: '1st Semester', label: '1st Semester' },
  { key: '2nd Semester', label: '2nd Semester' },
  { key: 'Summer', label: 'Summer Class' },
];

export interface YearTermGroup {
  yearLevel: string;
  units: number;
  /** Always the three semesters, in order (empty ones included). */
  sections: { key: string; label: string; subjects: CurriculumSubject[]; units: number }[];
  /** Subjects with no semester set yet. */
  unassigned: { subjects: CurriculumSubject[]; units: number };
}

const byOrder = (a: CurriculumSubject, b: CurriculumSubject) => (a.order ?? 999) - (b.order ?? 999) || a.code.localeCompare(b.code);
const unitsOf = (list: CurriculumSubject[]) => list.reduce((t, s) => t + (Number(s.units) || 0), 0);

// Year level → 1st Semester / 2nd Semester / Summer Class (spelling variants such as "1st Sem" or
// "Summer Term" are recognised), plus the subjects whose semester isn't set.
export function groupByYearAndTerm(subjects: CurriculumSubject[]): YearTermGroup[] {
  const years = Array.from(new Set(subjects.map((s) => normalizeYearLevel(s.yearLevel) || s.yearLevel || ''))).sort((a, b) => yearIndex(a) - yearIndex(b) || a.localeCompare(b));
  return years.map((yearLevel) => {
    const inYear = subjects.filter((s) => (normalizeYearLevel(s.yearLevel) || s.yearLevel || '') === yearLevel);
    const sections = SEMESTER_SECTIONS.map(({ key, label }) => {
      const list = inYear.filter((s) => normalizeSemester(s.semester) === key).sort(byOrder);
      return { key, label, subjects: list, units: unitsOf(list) };
    });
    const rest = inYear.filter((s) => !normalizeSemester(s.semester)).sort(byOrder);
    return { yearLevel, units: unitsOf(inYear), sections, unassigned: { subjects: rest, units: unitsOf(rest) } };
  });
}
