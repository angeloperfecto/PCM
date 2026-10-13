'use client';

import React, { useState } from 'react';
import { BookOpen, X } from 'lucide-react';
import type { AcademicSubject } from '@/lib/types';

export type AcademicCourseDraft = Omit<AcademicSubject, 'id' | 'enrolledCount'>;

const SUBJECT_TYPES: NonNullable<AcademicSubject['subjectType']>[] = ['Lecture', 'Laboratory', 'Practicum', 'Seminar'];
const STATUSES: AcademicSubject['status'][] = ['Open', 'Closed', 'Waitlist'];

interface Props {
  course?: AcademicSubject | null;
  existing: AcademicSubject[];
  /** Suggestions only; any value can be typed. */
  instructorOptions: string[];
  semesterOptions: string[];
  academicYearOptions: string[];
  programOptions: string[];
  defaultSemester: string;
  defaultAcademicYear: string;
  onCancel: () => void;
  onSave: (draft: AcademicCourseDraft) => Promise<boolean>;
}

const toDraft = (c: AcademicSubject | null | undefined, semester: string, academicYear: string): AcademicCourseDraft => ({
  code: c?.code || '',
  title: c?.title || '',
  description: c?.description || '',
  category: c?.category || '',
  units: c?.units ?? 3,
  schedule: c?.schedule || '',
  room: c?.room || '',
  instructor: c?.instructor || '',
  prerequisites: c?.prerequisites || [],
  subjectType: c?.subjectType || 'Lecture',
  semester: c?.semester || semester,
  academicYear: c?.academicYear || academicYear,
  section: c?.section || '',
  capacity: c?.capacity ?? 35,
  status: c?.status || 'Open',
  program: c?.program || '',
  yearLevel: c?.yearLevel || '',
  remarks: c?.remarks || '',
});

export const AcademicCourseModal: React.FC<Props> = ({
  course,
  existing,
  instructorOptions,
  semesterOptions,
  academicYearOptions,
  programOptions,
  defaultSemester,
  defaultAcademicYear,
  onCancel,
  onSave,
}) => {
  const [draft, setDraft] = useState<AcademicCourseDraft>(() => toDraft(course, defaultSemester, defaultAcademicYear));
  const [prereqText, setPrereqText] = useState(() => (course?.prerequisites || []).join(', '));
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);
  const enrolled = course?.enrolledCount || 0;

  const set = <K extends keyof AcademicCourseDraft>(key: K, value: AcademicCourseDraft[K]) => setDraft((d) => ({ ...d, [key]: value }));

  const validate = (code: string, prereqs: string[]): string => {
    if (!/^[A-Z0-9][A-Z0-9 .-]{1,19}$/.test(code)) return 'Course code must be 2–20 letters, numbers, spaces, dots or dashes (e.g. BIB-305).';
    if (!draft.title.trim()) return 'Enter the descriptive title.';
    if (!Number.isFinite(draft.units) || draft.units < 1 || draft.units > 12) return 'Units must be between 1 and 12.';
    if (!Number.isInteger(draft.capacity) || draft.capacity < 1) return 'Capacity must be a whole number of at least 1.';
    if (draft.capacity < enrolled) return `Capacity cannot be below the ${enrolled} students already enrolled.`;
    const section = draft.section.trim().toLowerCase();
    const dup = existing.find(
      (s) =>
        s.id !== course?.id &&
        s.code.trim().toUpperCase() === code &&
        (s.section || '').trim().toLowerCase() === section &&
        (s.semester || '') === draft.semester &&
        (s.academicYear || '') === draft.academicYear
    );
    if (dup) return `${code}${draft.section ? ` section ${draft.section}` : ''} already exists for ${draft.semester}, AY ${draft.academicYear}.`;
    if (prereqs.includes(code)) return 'A course cannot be its own prerequisite.';
    return '';
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    const code = draft.code.trim().toUpperCase();
    const prereqs = [...new Set(prereqText.split(/[,;]/).map((p) => p.trim().toUpperCase()).filter(Boolean))];
    const problem = validate(code, prereqs);
    setError(problem);
    if (problem) return;
    setSaving(true);
    try {
      const ok = await onSave({
        ...draft,
        code,
        title: draft.title.trim(),
        section: draft.section.trim(),
        schedule: draft.schedule.trim(),
        room: draft.room.trim(),
        instructor: draft.instructor.trim(),
        prerequisites: prereqs,
        prerequisite: prereqs.join(', '),
      });
      if (!ok) setError('The course was not saved. Check your permissions or connection and try again.');
    } finally {
      setSaving(false);
    }
  };

  const input = 'w-full rounded-lg border border-slate-300 px-3 py-2 text-xs focus:border-[#588B76] focus:outline-none';
  const label = 'block text-[11px] font-semibold text-slate-600 mb-1';
  const text = (key: 'title' | 'schedule' | 'room' | 'instructor' | 'section' | 'category' | 'yearLevel' | 'program', title: string, placeholder = '', list?: string) => (
    <label className="block">
      <span className={label}>{title}</span>
      <input value={(draft[key] as string) || ''} onChange={(e) => set(key, e.target.value)} placeholder={placeholder} list={list} className={input} />
    </label>
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 p-4" role="dialog" aria-modal="true" aria-label={course ? 'Edit course' : 'Add course'}>
      <form onSubmit={submit} className="w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-2xl bg-white p-5 shadow-2xl space-y-4">
        <div className="flex items-start justify-between gap-3">
          <h3 className="flex items-center gap-2 font-serif text-lg font-bold text-[#18392B]">
            <BookOpen className="h-5 w-5 text-[#588B76]" />
            {course ? `Edit Course ${course.code}` : 'Add Academic Course'}
          </h3>
          <button type="button" onClick={onCancel} aria-label="Close" className="rounded-lg p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600">
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
          <label className="block">
            <span className={label}>Course code *</span>
            <input required value={draft.code} onChange={(e) => set('code', e.target.value)} placeholder="BIB-305" className={`${input} uppercase font-mono`} />
          </label>
          <div className="sm:col-span-3">{text('title', 'Descriptive title *', 'Hermeneutics & Biblical Interpretation')}</div>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <label className="block">
            <span className={label}>Units</span>
            <input type="number" min={1} max={12} step={0.5} value={draft.units} onChange={(e) => set('units', Number(e.target.value))} className={input} />
          </label>
          <label className="block">
            <span className={label}>Capacity</span>
            <input type="number" min={Math.max(1, enrolled)} step={1} value={draft.capacity} onChange={(e) => set('capacity', Number(e.target.value))} className={input} />
          </label>
          <label className="block">
            <span className={label}>Type</span>
            <select value={draft.subjectType} onChange={(e) => set('subjectType', e.target.value as AcademicSubject['subjectType'])} className={input}>
              {SUBJECT_TYPES.map((t) => (
                <option key={t}>{t}</option>
              ))}
            </select>
          </label>
          <label className="block">
            <span className={label}>Status</span>
            <select value={draft.status} onChange={(e) => set('status', e.target.value as AcademicSubject['status'])} className={input}>
              {STATUSES.map((t) => (
                <option key={t}>{t}</option>
              ))}
            </select>
          </label>
        </div>
        {course && <p className="-mt-2 text-[11px] text-slate-500">Currently enrolled: {enrolled}</p>}

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {text('schedule', 'Class schedule', 'Mon / Wed 8:30 AM – 10:00 AM')}
          {text('room', 'Room', 'Bible Hall 101')}
          {text('instructor', 'Instructor', 'Choose or type a name', 'pcm-course-instructors')}
          {text('section', 'Section', 'BTH-1A')}
          <label className="block">
            <span className={label}>Semester</span>
            <input value={draft.semester} onChange={(e) => set('semester', e.target.value)} list="pcm-course-semesters" className={input} />
          </label>
          <label className="block">
            <span className={label}>Academic year</span>
            <input value={draft.academicYear} onChange={(e) => set('academicYear', e.target.value)} list="pcm-course-years" placeholder="2026–2027" className={input} />
          </label>
          {text('program', 'Program (optional)', 'Bachelor of Theology', 'pcm-course-programs')}
          {text('yearLevel', 'Year level (optional)', '1st Year')}
        </div>

        <label className="block">
          <span className={label}>Prerequisites (course codes, separated by commas)</span>
          <input value={prereqText} onChange={(e) => setPrereqText(e.target.value)} placeholder="BIB-101, THE-201" className={`${input} font-mono uppercase`} />
        </label>
        <label className="block">
          <span className={label}>Description (optional)</span>
          <textarea value={draft.description || ''} onChange={(e) => set('description', e.target.value)} rows={2} className={input} />
        </label>

        <datalist id="pcm-course-instructors">
          {instructorOptions.map((o) => (
            <option key={o} value={o} />
          ))}
        </datalist>
        <datalist id="pcm-course-semesters">
          {semesterOptions.map((o) => (
            <option key={o} value={o} />
          ))}
        </datalist>
        <datalist id="pcm-course-years">
          {academicYearOptions.map((o) => (
            <option key={o} value={o} />
          ))}
        </datalist>
        <datalist id="pcm-course-programs">
          {programOptions.map((o) => (
            <option key={o} value={o} />
          ))}
        </datalist>

        {error && (
          <p role="alert" className="rounded-lg border border-rose-200 bg-rose-50 p-2 text-xs text-rose-800">
            {error}
          </p>
        )}

        <div className="flex justify-end gap-2">
          <button type="button" onClick={onCancel} disabled={saving} className="rounded-lg px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 disabled:opacity-50">
            Cancel
          </button>
          <button type="submit" disabled={saving} className="rounded-lg bg-[#18392B] px-4 py-2 text-xs font-bold text-white hover:bg-[#588B76] disabled:opacity-50">
            {saving ? 'Saving…' : course ? 'Save Changes' : 'Add Course'}
          </button>
        </div>
      </form>
    </div>
  );
};
