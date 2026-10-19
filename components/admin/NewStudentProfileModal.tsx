'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { Info, UserPlus, Wand2, X } from 'lucide-react';
import { usePCM } from '@/lib/store';
import { MAJOR_OPTIONS, YEAR_LEVELS } from '@/lib/curriculum';
import { displayTerm, normAY, termLabel } from '@/lib/reenrollment';
import type { StudentProfile } from '@/lib/types';

const STUDENT_TYPES = ['New Student', 'Transfer Student', 'Returning Student'] as const;
const ID_PATTERN = /^[A-Z0-9][A-Z0-9-]{3,29}$/;
const programLabel = (p: any) => p?.name || p?.title || p?.code || '';

/** The next free ID in the "YYYY-PCM-0001" series for a year, from the existing records. */
export function nextStudentId(students: Pick<StudentProfile, 'studentId'>[], year: string): string {
  const re = new RegExp(`^${year}-PCM-(\\d+)$`, 'i');
  const max = students.reduce((m, s) => {
    const n = Number((String(s.studentId || '').trim().match(re) || [])[1]);
    return Number.isFinite(n) && n > m ? n : m;
  }, 0);
  return `${year}-PCM-${String(max + 1).padStart(4, '0')}`;
}

const blank = {
  firstName: '',
  middleName: '',
  lastName: '',
  suffix: '',
  studentId: '',
  email: '',
  applicantType: 'New Student' as (typeof STUDENT_TYPES)[number],
  programId: '',
  yearLevel: '1st Year',
  major: '',
};

// Enrollment & Records → Add Student Profile: a student record created by the Registrar (for example a
// student enrolled before the online system). Programs come from Academic Programs and the term from
// Academic Terms; the Student ID and email must not belong to another record.
export const NewStudentProfileModal: React.FC<{ onClose: () => void; onCreated?: (s: StudentProfile) => void }> = ({ onClose, onCreated }) => {
  const { students, programs, academicPeriods, createStudentProfile } = usePCM();
  const programList = useMemo(() => (programs || []).filter((p: any) => programLabel(p) && p.status !== 'Archived'), [programs]);
  const term = displayTerm(academicPeriods || []);
  const idYear = (normAY(term?.academicYear).match(/^(\d{4})/) || [])[1] || String(new Date().getFullYear());
  const suggestedId = nextStudentId(students, idYear);

  const [form, setForm] = useState(() => ({ ...blank, programId: programList[0]?.id || '' }));
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);
  const set = <K extends keyof typeof blank>(k: K, v: (typeof blank)[K]) => {
    setError('');
    setForm((f) => ({ ...f, [k]: v }));
  };
  // Programs load after the dialog may open.
  useEffect(() => {
    if (!form.programId && programList[0]) setForm((f) => ({ ...f, programId: programList[0].id }));
  }, [programList, form.programId]);
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && !saving && onClose();
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose, saving]);

  const program = programList.find((p) => p.id === form.programId) || null;
  const fullName = [form.firstName, form.middleName, form.lastName].map((x) => x.trim()).filter(Boolean).join(' ') + (form.suffix.trim() ? ` ${form.suffix.trim()}` : '');
  const id = form.studentId.trim().toUpperCase();
  const email = form.email.trim().toLowerCase();
  const idTaken = !!id && students.some((s) => String(s.studentId || '').trim().toUpperCase() === id);
  const emailTaken = !!email && students.find((s) => String(s.email || '').trim().toLowerCase() === email);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.firstName.trim() || !form.lastName.trim()) return setError('Enter the student’s first and last name.');
    if (!id) return setError('Enter the Student ID, or use the next available one.');
    if (!ID_PATTERN.test(id)) return setError('Student ID may use letters, numbers and dashes only (e.g. 2026-PCM-0001).');
    if (idTaken) return setError(`Student ID ${id} already belongs to another student.`);
    if (email && !/^\S+@\S+\.\S+$/.test(email)) return setError('Enter a valid email address.');
    if (emailTaken) return setError(`${email} is already used by ${emailTaken.fullName || emailTaken.name || emailTaken.studentId}.`);
    if (!program) return setError('Choose the degree program (add programs in Academic Programs).');
    setSaving(true);
    try {
      const created = await createStudentProfile({
        studentId: id,
        firstName: form.firstName.trim(),
        middleName: form.middleName.trim(),
        lastName: form.lastName.trim(),
        suffix: form.suffix.trim(),
        name: fullName,
        fullName,
        email,
        applicantType: form.applicantType,
        programId: program.id,
        degreeProgram: programLabel(program),
        program: programLabel(program),
        yearLevel: form.yearLevel,
        major: form.major,
        specialization: form.major,
        academicStatus: 'Regular',
        // The term set in Academic Terms (blank when none is set).
        academicYear: term ? normAY(term.academicYear) : '',
        currentSemester: term ? termLabel(term.semester, term.academicYear) : '',
        enrollmentStatus: 'Draft',
        // No grades, subjects or assessment yet.
        gpa: 0,
        totalUnitsEarned: 0,
        tuitionTotal: 0,
        tuitionPaid: 0,
        tuitionBalance: 0,
        homeChurch: '',
        mentorName: '',
        avatarUrl: '',
        courses: [],
        practicumEntries: [],
        documents: [],
        paymentHistory: [],
      } as Omit<StudentProfile, 'id'>);
      if (!created) {
        setError('The student record was not saved. Please check your connection and permissions, then try again.');
        return;
      }
      onCreated?.(created);
      onClose();
    } finally {
      setSaving(false);
    }
  };

  const input = 'w-full rounded-lg border border-slate-300 bg-white p-2.5 text-xs focus:border-[#588B76] focus:outline-none';
  const label = 'mb-1 block text-[11px] font-semibold text-slate-600';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 p-4 backdrop-blur-xs" role="dialog" aria-modal="true" aria-labelledby="new-student-title">
      <div className="flex max-h-[92vh] w-full max-w-xl flex-col rounded-2xl bg-white shadow-2xl">
        <div className="flex items-start justify-between gap-3 border-b border-slate-100 p-5">
          <div>
            <h4 id="new-student-title" className="flex items-center gap-2 font-serif text-lg font-bold text-[#18392B]">
              <UserPlus className="h-5 w-5 text-[#588B76]" /> Register Student Profile
            </h4>
            <p className="text-[11px] text-slate-500">
              For students not coming through online admission. Applicants who apply online get their record when the Registrar finalizes enrollment.
            </p>
          </div>
          <button type="button" aria-label="Close" onClick={onClose} disabled={saving} className="rounded-lg p-1 text-slate-500 hover:bg-slate-100">
            <X className="h-4 w-4" />
          </button>
        </div>

        <form onSubmit={submit} className="space-y-4 overflow-y-auto overflow-x-hidden p-5 text-xs" data-testid="new-student-form" noValidate>
          <fieldset className="space-y-2">
            <legend className="mb-1 text-[11px] font-bold uppercase tracking-wider text-[#18392B]">Name (as on the COR)</legend>
            <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
              <label className={label}>
                First name *
                <input value={form.firstName} onChange={(e) => set('firstName', e.target.value)} className={input} autoFocus />
              </label>
              <label className={label}>
                Middle name
                <input value={form.middleName} onChange={(e) => set('middleName', e.target.value)} className={input} />
              </label>
              <label className={label}>
                Last name *
                <input value={form.lastName} onChange={(e) => set('lastName', e.target.value)} className={input} />
              </label>
              <label className={label}>
                Suffix
                <input value={form.suffix} onChange={(e) => set('suffix', e.target.value)} placeholder="Jr., III" className={input} />
              </label>
            </div>
            {fullName.trim() && <p className="text-[11px] text-slate-500">Full name: <strong className="text-slate-800">{fullName}</strong></p>}
          </fieldset>

          <fieldset className="space-y-2">
            <legend className="mb-1 text-[11px] font-bold uppercase tracking-wider text-[#18392B]">Student ID & account</legend>
            <label className={label}>
              Permanent Student ID *
              <div className="flex min-w-0 gap-2">
                <input
                  value={form.studentId}
                  onChange={(e) => set('studentId', e.target.value.toUpperCase())}
                  placeholder={suggestedId}
                  className={`${input} min-w-0 flex-1 font-mono ${idTaken ? 'border-rose-400 bg-rose-50' : ''}`}
                />
                <button
                  type="button"
                  onClick={() => set('studentId', suggestedId)}
                  className="flex shrink-0 items-center gap-1 rounded-lg border border-slate-300 px-2.5 font-semibold text-[#18392B] hover:bg-slate-50"
                  title="Fill in the next unused ID in this year's series"
                >
                  <Wand2 className="h-3.5 w-3.5" /> Use {suggestedId}
                </button>
              </div>
            </label>
            {idTaken && <p className="text-[11px] text-rose-700">This Student ID already belongs to another student.</p>}
            <label className={label}>
              Email address
              <input
                type="email"
                value={form.email}
                onChange={(e) => set('email', e.target.value)}
                placeholder="student@pcm.edu.ph"
                className={`${input} ${emailTaken ? 'border-rose-400 bg-rose-50' : ''}`}
              />
            </label>
            <p className="text-[11px] text-slate-500">
              {emailTaken
                ? `Already used by ${emailTaken.fullName || emailTaken.name || emailTaken.studentId}.`
                : 'The student signs in to the Student Portal with this email; their account links to this record automatically.'}
            </p>
          </fieldset>

          <fieldset className="space-y-2">
            <legend className="mb-1 text-[11px] font-bold uppercase tracking-wider text-[#18392B]">Program</legend>
            <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
              <label className={label}>
                Student type
                <select value={form.applicantType} onChange={(e) => set('applicantType', e.target.value as (typeof STUDENT_TYPES)[number])} className={input}>
                  {STUDENT_TYPES.map((t) => (
                    <option key={t} value={t}>{t === 'Transfer Student' ? 'Transferee' : t === 'Returning Student' ? 'Returnee' : t}</option>
                  ))}
                </select>
              </label>
              <label className={label}>
                Degree program *
                <select value={form.programId} onChange={(e) => set('programId', e.target.value)} className={input}>
                  {programList.length === 0 && <option value="">No programs yet</option>}
                  {programList.map((p: any) => (
                    <option key={p.id} value={p.id}>{programLabel(p)}</option>
                  ))}
                </select>
              </label>
              <label className={label}>
                Year level
                <select value={form.yearLevel} onChange={(e) => set('yearLevel', e.target.value)} className={input}>
                  {YEAR_LEVELS.map((y) => (
                    <option key={y} value={y}>{y}</option>
                  ))}
                </select>
              </label>
              <label className={label}>
                Major / specialization
                <select value={form.major} onChange={(e) => set('major', e.target.value)} className={input}>
                  <option value="">Not set yet</option>
                  {MAJOR_OPTIONS.map((m) => (
                    <option key={m.value} value={m.value}>{m.label}</option>
                  ))}
                </select>
              </label>
            </div>
            <p className="flex items-start gap-1.5 rounded-lg border border-slate-200 bg-slate-50 p-2.5 text-[11px] text-slate-600">
              <Info className="mt-0.5 h-3.5 w-3.5 shrink-0" />
              {term
                ? `Recorded under ${termLabel(term.semester, term.academicYear)} (Academic Terms). The record starts with no subjects, grades or fees; enroll the student and add their history from their dossier.`
                : 'No academic term is set yet (Academic Terms). The record starts with no subjects, grades or fees.'}
            </p>
          </fieldset>

          {error && (
            <p role="alert" className="rounded-lg border border-rose-200 bg-rose-50 p-2.5 text-rose-800">
              {error}
            </p>
          )}

          <div className="flex justify-end gap-2 border-t border-slate-100 pt-3">
            <button type="button" onClick={onClose} disabled={saving} className="px-4 py-2 text-slate-600 hover:text-slate-900">
              Cancel
            </button>
            <button type="submit" disabled={saving || programList.length === 0} className="rounded-xl bg-[#18392B] px-4 py-2 font-bold text-white hover:bg-[#588B76] disabled:opacity-50">
              {saving ? 'Creating…' : 'Create student'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
