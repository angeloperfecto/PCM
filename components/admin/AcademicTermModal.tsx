'use client';

import React, { useState } from 'react';
import { Calendar, X } from 'lucide-react';
import type { AcademicPeriod } from '@/lib/types';

export type AcademicTermDraft = Omit<AcademicPeriod, 'id' | 'isCurrent' | 'createdAt' | 'updatedAt'>;

const SEMESTERS = ['1st Semester', '2nd Semester', 'Summer Term'];
const STATUSES: AcademicPeriod['status'][] = ['Upcoming', 'Active', 'Archived'];

const emptyDraft = (): AcademicTermDraft => {
  const year = new Date().getFullYear();
  return {
    academicYear: `${year}–${year + 1}`,
    semester: '1st Semester',
    status: 'Upcoming',
    enrollmentStatus: 'Closed',
    enrollmentStartDate: '',
    enrollmentEndDate: '',
    preEnlistmentStatus: 'Closed',
    preEnlistmentStartDate: '',
    preEnlistmentEndDate: '',
    addDropStatus: 'Closed',
    addDropStartDate: '',
    addDropEndDate: '',
  };
};

// Normalises "2026-2027" / "2026 - 2027" to the en dash form the site already uses ("2026–2027").
const normaliseYear = (value: string) => {
  const m = value.trim().match(/^(\d{4})\s*[-–—]\s*(\d{4})$/);
  return m ? `${m[1]}–${m[2]}` : value.trim();
};

interface Props {
  term?: AcademicPeriod | null;
  existing: AcademicPeriod[];
  onCancel: () => void;
  onSave: (draft: AcademicTermDraft) => Promise<boolean>;
}

export const AcademicTermModal: React.FC<Props> = ({ term, existing, onCancel, onSave }) => {
  const [draft, setDraft] = useState<AcademicTermDraft>(() => {
    if (!term) return emptyDraft();
    const { id: _id, isCurrent: _cur, createdAt: _c, updatedAt: _u, ...rest } = term;
    return { ...emptyDraft(), ...rest };
  });
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  const set = <K extends keyof AcademicTermDraft>(key: K, value: AcademicTermDraft[K]) => setDraft((d) => ({ ...d, [key]: value }));

  const validate = (): string => {
    const year = normaliseYear(draft.academicYear);
    const m = year.match(/^(\d{4})–(\d{4})$/);
    if (!m) return 'Academic year must look like 2026–2027.';
    if (Number(m[2]) !== Number(m[1]) + 1) return 'The second year must follow the first (e.g. 2026–2027).';
    if (!draft.semester.trim()) return 'Choose a semester.';
    const dup = existing.find(
      (p) => p.id !== term?.id && normaliseYear(p.academicYear) === year && p.semester.trim().toLowerCase() === draft.semester.trim().toLowerCase()
    );
    if (dup) return `${draft.semester}, AY ${year} already exists.`;
    const ranges: [string, string | undefined, string | undefined][] = [
      ['Enrollment', draft.enrollmentStartDate, draft.enrollmentEndDate],
      ['Pre-enlistment', draft.preEnlistmentStartDate, draft.preEnlistmentEndDate],
      ['Add/Drop', draft.addDropStartDate, draft.addDropEndDate],
    ];
    for (const [label, start, end] of ranges) {
      if (start && end && end < start) return `${label} end date must be on or after its start date.`;
    }
    if (draft.enrollmentStatus === 'Open' && (!draft.enrollmentStartDate || !draft.enrollmentEndDate))
      return 'Set the enrollment start and end dates before opening enrollment.';
    return '';
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    const problem = validate();
    setError(problem);
    if (problem) return;
    setSaving(true);
    try {
      const ok = await onSave({ ...draft, academicYear: normaliseYear(draft.academicYear), semester: draft.semester.trim() });
      if (!ok) setError('The term was not saved. Check your permissions or connection and try again.');
    } finally {
      setSaving(false);
    }
  };

  const input = 'w-full rounded-lg border border-slate-300 px-3 py-2 text-xs focus:border-[#588B76] focus:outline-none';
  const label = 'block text-[11px] font-semibold text-slate-600 mb-1';

  const windowRow = (
    title: string,
    statusKey: 'enrollmentStatus' | 'preEnlistmentStatus' | 'addDropStatus',
    startKey: 'enrollmentStartDate' | 'preEnlistmentStartDate' | 'addDropStartDate',
    endKey: 'enrollmentEndDate' | 'preEnlistmentEndDate' | 'addDropEndDate'
  ) => (
    <fieldset className="rounded-xl border border-slate-200 p-3 space-y-2">
      <legend className="px-1 text-xs font-bold text-[#18392B]">{title}</legend>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
        <label className="block">
          <span className={label}>Status</span>
          <select value={draft[statusKey]} onChange={(e) => set(statusKey, e.target.value as 'Open' | 'Closed')} className={input}>
            <option value="Open">Open</option>
            <option value="Closed">Closed</option>
          </select>
        </label>
        <label className="block">
          <span className={label}>Start date</span>
          <input type="date" value={draft[startKey] || ''} onChange={(e) => set(startKey, e.target.value)} className={input} />
        </label>
        <label className="block">
          <span className={label}>End date</span>
          <input type="date" value={draft[endKey] || ''} onChange={(e) => set(endKey, e.target.value)} className={input} />
        </label>
      </div>
    </fieldset>
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 p-4" role="dialog" aria-modal="true" aria-label={term ? 'Edit academic term' : 'Add academic term'}>
      <form onSubmit={submit} className="w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-2xl bg-white p-5 shadow-2xl space-y-4">
        <div className="flex items-start justify-between gap-3">
          <h3 className="flex items-center gap-2 font-serif text-lg font-bold text-[#18392B]">
            <Calendar className="h-5 w-5 text-[#588B76]" />
            {term ? 'Edit Academic Term' : 'Add Academic Term'}
          </h3>
          <button type="button" onClick={onCancel} aria-label="Close" className="rounded-lg p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600">
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <label className="block">
            <span className={label}>Academic year</span>
            <input value={draft.academicYear} onChange={(e) => set('academicYear', e.target.value)} placeholder="2026–2027" className={input} required />
          </label>
          <label className="block">
            <span className={label}>Semester</span>
            <input list="pcm-semester-options" value={draft.semester} onChange={(e) => set('semester', e.target.value)} className={input} required />
            <datalist id="pcm-semester-options">
              {SEMESTERS.map((s) => (
                <option key={s} value={s} />
              ))}
            </datalist>
          </label>
          <label className="block">
            <span className={label}>Calendar status</span>
            <select value={draft.status} onChange={(e) => set('status', e.target.value as AcademicPeriod['status'])} className={input}>
              {STATUSES.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
          </label>
        </div>

        {windowRow('Enrollment window', 'enrollmentStatus', 'enrollmentStartDate', 'enrollmentEndDate')}
        {windowRow('Pre-enlistment window', 'preEnlistmentStatus', 'preEnlistmentStartDate', 'preEnlistmentEndDate')}
        {windowRow('Adding & dropping window', 'addDropStatus', 'addDropStartDate', 'addDropEndDate')}

        <p className="text-[11px] text-slate-500">
          The current term is chosen with <strong>Set as Active Term</strong> on the term card.
        </p>

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
            {saving ? 'Saving…' : term ? 'Save Changes' : 'Add Term'}
          </button>
        </div>
      </form>
    </div>
  );
};
