'use client';

import React, { useMemo, useState } from 'react';
import { CheckCircle2, Clock, GraduationCap, Pencil, Plus, Search, Trash2, X } from 'lucide-react';
import { db } from '@/lib/firebase';
import { usePCM } from '@/lib/store';
import { PCM_FOUNDED, canManageAlumni, checkAlumniInput, graduationYears, isAlumniRecord, saveAlumniRecord, subjectsByTerm, type AlumniInput } from '@/lib/alumni';
import { academicStanding } from '@/lib/studentDefaults';
import type { StudentProfile, StudentSubjectHistory } from '@/lib/types';

const SEMESTERS = ['1st Semester', '2nd Semester', 'Summer'];
const STATUSES: StudentSubjectHistory['status'][] = ['Passed', 'Credited', 'Failed', 'Incomplete'];

const emptyInput = (): AlumniInput => ({
  studentId: '',
  firstName: '',
  middleName: '',
  lastName: '',
  suffix: '',
  email: '',
  phone: '',
  dateOfBirth: '',
  sex: '',
  address: '',
  program: '',
  programId: '',
  graduationYear: '',
  graduationDate: '',
  degreeConferred: '',
  honors: '',
  yearEntered: '',
  notes: '',
  subjects: [],
});

const fromRecord = (s: StudentProfile): AlumniInput => {
  const a = (s as any).alumni || {};
  return {
    id: s.id,
    studentId: s.studentId || '',
    firstName: s.firstName || '',
    middleName: s.middleName || '',
    lastName: s.lastName || '',
    suffix: s.suffix || '',
    email: s.email || '',
    phone: s.mobileNumber || s.phone || '',
    dateOfBirth: s.dateOfBirth || '',
    sex: s.sex || '',
    address: s.currentAddress || s.address || '',
    program: s.degreeProgram || s.program || '',
    programId: s.programId || '',
    graduationYear: a.graduationYear ? String(a.graduationYear) : '',
    graduationDate: a.graduationDate || '',
    degreeConferred: a.degreeConferred || '',
    honors: a.honors || '',
    yearEntered: a.yearEntered || '',
    notes: a.notes || '',
    subjects: (s.subjectHistory || []).map((h) => ({ ...h, grade: h.finalGrade ?? h.grade ?? '' })),
  };
};

// Enrollment & Records → Alumni & Historical Records: graduates from 1992 onward, including those who finished
// before the website existed. Each record is matched to the graduate's Gmail account at their first sign-in, and
// they see only their own record in the Student Portal.
export const AlumniRecordsPanel: React.FC = () => {
  const { students, programs, currentAdminUser, addToast, logActivity } = usePCM();
  const mayManage = canManageAlumni(currentAdminUser?.role);
  const [q, setQ] = useState('');
  const [year, setYear] = useState('');
  const [form, setForm] = useState<AlumniInput | null>(null);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  const alumni = useMemo(() => (students || []).filter((s) => s && !s.isArchived && isAlumniRecord(s)), [students]);
  const shown = useMemo(() => {
    const needle = q.trim().toLowerCase();
    return alumni
      .filter((s) => !year || String((s as any).alumni?.graduationYear || '') === year)
      .filter((s) => !needle || [s.fullName, s.name, s.studentId, s.email, s.degreeProgram, s.program].some((v) => String(v || '').toLowerCase().includes(needle)))
      .sort((a, b) => Number((b as any).alumni?.graduationYear || 0) - Number((a as any).alumni?.graduationYear || 0) || String(a.lastName || a.fullName).localeCompare(String(b.lastName || b.fullName)));
  }, [alumni, q, year]);
  const programNames = useMemo(() => Array.from(new Set((programs || []).map((p: any) => p.name || p.title).filter(Boolean))) as string[], [programs]);
  const existing = form?.id ? (students || []).find((s) => s.id === form.id) || null : null;

  const set = <K extends keyof AlumniInput>(k: K, v: AlumniInput[K]) => setForm((f) => (f ? { ...f, [k]: v } : f));
  const setSubject = (i: number, patch: Partial<StudentSubjectHistory>) => setForm((f) => (f ? { ...f, subjects: f.subjects.map((s, j) => (j === i ? { ...s, ...patch } : s)) } : f));
  const addSubject = () =>
    setForm((f) => {
      if (!f) return f;
      const last = f.subjects[f.subjects.length - 1];
      return { ...f, subjects: [...f.subjects, { code: '', title: '', units: 3, grade: '', semester: last?.semester || '1st Semester', academicYear: last?.academicYear || '', status: 'Passed' }] };
    });

  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form) return;
    const problem = checkAlumniInput(form, students || []);
    if (problem) return setError(problem);
    setBusy(true);
    setError('');
    try {
      const program = (programs || []).find((p: any) => (p.name || p.title) === form.program);
      const id = await saveAlumniRecord(db, { ...form, programId: program?.id || form.programId }, existing, currentAdminUser?.name || 'Registrar');
      const name = [form.firstName, form.lastName].join(' ').trim();
      logActivity(existing ? 'UPDATE' : 'CREATE', 'Alumni Record', id, name, `${existing ? 'Updated' : 'Added'} the alumni record of ${name} (${form.studentId.toUpperCase()}, Class of ${form.graduationYear}).`);
      addToast('success', existing ? 'Alumni record updated' : 'Alumni record added', `${name} can view it in the Student Portal after signing in with ${form.email.trim().toLowerCase()}.`);
      setForm(null);
    } catch (err: any) {
      setError(err?.code === 'permission-denied' ? 'Your account cannot add or change student records. Ask the Registrar or an Admin.' : 'Not saved. Please try again.');
    } finally {
      setBusy(false);
    }
  };

  const input = 'mt-1 w-full rounded-lg border border-slate-300 bg-white p-2 text-xs';
  const label = 'block text-[11px] font-bold text-slate-600';
  const totals = form ? academicStanding({ subjectHistory: form.subjects.map((s) => ({ ...s, grade: s.grade })) } as any) : null;

  return (
    <div className="space-y-4" data-testid="alumni-records">
      <div className="flex flex-col gap-3 rounded-xl border border-slate-200 bg-white p-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h4 className="flex items-center gap-2 text-sm font-bold text-[#18392B]">
            <GraduationCap className="h-4 w-4 text-[#588B76]" /> Alumni &amp; Historical Records
          </h4>
          <p className="text-xs text-slate-500">
            PCM graduates from {PCM_FOUNDED} onward, including those who finished before this website existed. Enter the graduate’s Gmail address: when they
            sign in to the Student Portal with it, they see their own record (read-only). Changes here show in their portal right away.
          </p>
        </div>
        {mayManage && (
          <button type="button" onClick={() => (setError(''), setForm(emptyInput()))} className="flex shrink-0 items-center gap-1.5 rounded-lg bg-[#18392B] px-3.5 py-2 text-xs font-bold text-white hover:bg-[#588B76]">
            <Plus className="h-4 w-4" /> Add graduate record
          </button>
        )}
      </div>

      <div className="flex flex-col gap-2 rounded-xl border border-slate-200 bg-white p-3 sm:flex-row">
        <label className="relative flex-1">
          <Search className="pointer-events-none absolute left-2.5 top-2.5 h-3.5 w-3.5 text-slate-400" />
          <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search name, Student ID, Gmail or program" aria-label="Search alumni" className="w-full rounded-lg border border-slate-300 p-2 pl-8 text-xs" />
        </label>
        <select value={year} onChange={(e) => setYear(e.target.value)} aria-label="Graduation year" className="rounded-lg border border-slate-300 bg-white p-2 text-xs">
          <option value="">All graduation years</option>
          {graduationYears().map((y) => (
            <option key={y} value={y}>
              Class of {y}
            </option>
          ))}
        </select>
      </div>

      <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white">
        <table className="w-full text-left text-xs text-slate-700">
          <thead className="border-b border-slate-200 bg-slate-50 text-slate-500">
            <tr>
              <th className="p-3">Graduate</th>
              <th className="p-3">Program</th>
              <th className="p-3">Class of</th>
              <th className="p-3">Subjects</th>
              <th className="p-3">Student Portal</th>
              {mayManage && <th className="p-3 text-right">Manage</th>}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {shown.length === 0 && (
              <tr>
                <td colSpan={6} className="p-6 text-center text-slate-500">
                  {alumni.length ? 'No graduates match the search.' : 'No alumni records yet. Use “Add graduate record” to enter graduates from before the website.'}
                </td>
              </tr>
            )}
            {shown.map((s) => {
              const a = (s as any).alumni || {};
              const st = academicStanding(s);
              return (
                <tr key={s.id} className="hover:bg-slate-50">
                  <td className="p-3">
                    <strong className="block text-slate-900">{s.fullName || s.name}</strong>
                    <span className="font-mono text-[11px] text-slate-500">{s.studentId}</span>
                    <span className="block text-[11px] text-slate-500">{s.email || 'No Gmail yet'}</span>
                  </td>
                  <td className="p-3">
                    {a.degreeConferred || s.degreeProgram || s.program || '—'}
                    {a.honors ? <span className="block text-[11px] font-semibold text-amber-800">{a.honors}</span> : null}
                  </td>
                  <td className="p-3 font-mono">{a.graduationYear || '—'}</td>
                  <td className="p-3">
                    {(s.subjectHistory || []).length} · {st.unitsEarned} units{st.gpa ? ` · GWA ${st.gpa.toFixed(2)}` : ''}
                  </td>
                  <td className="p-3">
                    {(s as any).authUid ? (
                      <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-bold text-emerald-800">
                        <CheckCircle2 className="h-3 w-3" /> Linked to Gmail
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-bold text-amber-900" title="Links at the graduate’s first sign-in with this Gmail address">
                        <Clock className="h-3 w-3" /> Waiting for first sign-in
                      </span>
                    )}
                  </td>
                  {mayManage && (
                    <td className="p-3 text-right">
                      <button type="button" onClick={() => (setError(''), setForm(fromRecord(s)))} aria-label={`Edit ${s.fullName || s.name}`} className="rounded p-1.5 text-[#588B76] hover:bg-emerald-50">
                        <Pencil className="h-3.5 w-3.5" />
                      </button>
                    </td>
                  )}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {form && (
        <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-slate-950/60 p-4" role="dialog" aria-modal="true" aria-label={existing ? 'Edit alumni record' : 'Add alumni record'}>
          <form onSubmit={save} className="my-4 w-full max-w-4xl space-y-4 rounded-2xl bg-white p-5 shadow-2xl" data-testid="alumni-form">
            <div className="flex items-center justify-between">
              <h5 className="font-serif text-base font-bold text-[#18392B]">{existing ? `Edit record — ${existing.fullName || existing.name}` : 'Add a graduate record'}</h5>
              <button type="button" onClick={() => setForm(null)} aria-label="Close" className="rounded-lg p-1 text-slate-400 hover:bg-slate-100">
                <X className="h-4 w-4" />
              </button>
            </div>

            <fieldset className="space-y-2">
              <legend className="text-xs font-bold uppercase tracking-wider text-slate-500">Personal information</legend>
              <div className="grid grid-cols-1 gap-2 sm:grid-cols-4">
                <label className={label}>First name *<input value={form.firstName} onChange={(e) => set('firstName', e.target.value.toUpperCase())} className={input} /></label>
                <label className={label}>Middle name<input value={form.middleName} onChange={(e) => set('middleName', e.target.value.toUpperCase())} className={input} /></label>
                <label className={label}>Last name *<input value={form.lastName} onChange={(e) => set('lastName', e.target.value.toUpperCase())} className={input} /></label>
                <label className={label}>Suffix<input value={form.suffix} onChange={(e) => set('suffix', e.target.value.toUpperCase())} className={input} /></label>
                <label className={label}>Student ID *<input value={form.studentId} onChange={(e) => set('studentId', e.target.value.toUpperCase())} placeholder="e.g. 1998-PCM-0042" className={`${input} font-mono`} /></label>
                <label className={`${label} sm:col-span-2`}>
                  Gmail address (for Student Portal sign-in) *
                  <input type="email" value={form.email} onChange={(e) => set('email', e.target.value)} placeholder="name@gmail.com" className={input} />
                </label>
                <label className={label}>Mobile number<input value={form.phone} onChange={(e) => set('phone', e.target.value)} className={input} /></label>
                <label className={label}>Date of birth<input type="date" value={form.dateOfBirth} onChange={(e) => set('dateOfBirth', e.target.value)} className={input} /></label>
                <label className={label}>
                  Sex
                  <select value={form.sex} onChange={(e) => set('sex', e.target.value)} className={input}>
                    <option value="">—</option>
                    <option>Male</option>
                    <option>Female</option>
                  </select>
                </label>
                <label className={`${label} sm:col-span-2`}>Address<input value={form.address} onChange={(e) => set('address', e.target.value.toUpperCase())} className={input} /></label>
              </div>
              {existing && (existing as any).authUid && form.email.trim().toLowerCase() !== String(existing.email || '').toLowerCase() && (
                <p className="rounded-lg bg-amber-50 p-2 text-[11px] text-amber-900">
                  This record is linked to {existing.email}. Saving a new Gmail address unlinks it; it links again when the graduate signs in with the new address.
                </p>
              )}
            </fieldset>

            <fieldset className="space-y-2">
              <legend className="text-xs font-bold uppercase tracking-wider text-slate-500">PCM graduation</legend>
              <div className="grid grid-cols-1 gap-2 sm:grid-cols-4">
                <label className={`${label} sm:col-span-2`}>
                  Program *
                  <input list="alumni-programs" value={form.program} onChange={(e) => set('program', e.target.value)} className={input} />
                  <datalist id="alumni-programs">
                    {programNames.map((p) => (
                      <option key={p} value={p} />
                    ))}
                  </datalist>
                </label>
                <label className={`${label} sm:col-span-2`}>Degree conferred<input value={form.degreeConferred} onChange={(e) => set('degreeConferred', e.target.value)} placeholder="Same as the program if blank" className={input} /></label>
                <label className={label}>
                  Graduation year *
                  <select value={form.graduationYear} onChange={(e) => set('graduationYear', e.target.value)} className={input}>
                    <option value="">Choose…</option>
                    {graduationYears().map((y) => (
                      <option key={y} value={y}>
                        {y}
                      </option>
                    ))}
                  </select>
                </label>
                <label className={label}>Graduation date<input type="date" value={form.graduationDate} onChange={(e) => set('graduationDate', e.target.value)} className={input} /></label>
                <label className={label}>Year entered PCM<input value={form.yearEntered} onChange={(e) => set('yearEntered', e.target.value.replace(/\D/g, '').slice(0, 4))} placeholder="e.g. 1994" className={input} /></label>
                <label className={label}>Honors / awards<input value={form.honors} onChange={(e) => set('honors', e.target.value)} placeholder="e.g. Cum Laude" className={input} /></label>
                <label className={`${label} sm:col-span-4`}>Notes (staff)<input value={form.notes} onChange={(e) => set('notes', e.target.value)} placeholder="e.g. From the 1998 registrar ledger" className={input} /></label>
              </div>
            </fieldset>

            <fieldset className="space-y-2">
              <legend className="text-xs font-bold uppercase tracking-wider text-slate-500">
                Academic record ({form.subjects.length} subject{form.subjects.length === 1 ? '' : 's'}
                {totals ? ` · ${totals.unitsEarned} units earned${totals.gpa ? ` · GWA ${totals.gpa.toFixed(2)}` : ''}` : ''})
              </legend>
              <div className="overflow-x-auto">
                <table className="w-full min-w-[760px] text-left text-xs">
                  <thead className="text-[10px] uppercase text-slate-500">
                    <tr>
                      <th className="p-1">Code</th>
                      <th className="p-1">Subject</th>
                      <th className="p-1">Units</th>
                      <th className="p-1">Grade</th>
                      <th className="p-1">Status</th>
                      <th className="p-1">Semester</th>
                      <th className="p-1">Academic year</th>
                      <th className="p-1" />
                    </tr>
                  </thead>
                  <tbody>
                    {form.subjects.map((s, i) => (
                      <tr key={i}>
                        <td className="p-1"><input aria-label="Subject code" value={s.code} onChange={(e) => setSubject(i, { code: e.target.value.toUpperCase() })} className="w-24 rounded border border-slate-300 p-1.5 font-mono" /></td>
                        <td className="p-1"><input aria-label="Subject title" value={s.title} onChange={(e) => setSubject(i, { title: e.target.value })} className="w-full min-w-[180px] rounded border border-slate-300 p-1.5" /></td>
                        <td className="p-1"><input aria-label="Units" type="number" min="0" step="0.5" value={s.units} onChange={(e) => setSubject(i, { units: Number(e.target.value) })} className="w-16 rounded border border-slate-300 p-1.5" /></td>
                        <td className="p-1"><input aria-label="Grade" value={String(s.grade ?? '')} onChange={(e) => setSubject(i, { grade: e.target.value })} placeholder="1.50" className="w-16 rounded border border-slate-300 p-1.5 font-mono" /></td>
                        <td className="p-1">
                          <select aria-label="Status" value={s.status} onChange={(e) => setSubject(i, { status: e.target.value as StudentSubjectHistory['status'] })} className="rounded border border-slate-300 bg-white p-1.5">
                            {STATUSES.map((x) => <option key={x}>{x}</option>)}
                          </select>
                        </td>
                        <td className="p-1">
                          <select aria-label="Semester" value={s.semester} onChange={(e) => setSubject(i, { semester: e.target.value })} className="rounded border border-slate-300 bg-white p-1.5">
                            {Array.from(new Set([...SEMESTERS, s.semester].filter(Boolean))).map((x) => <option key={x}>{x}</option>)}
                          </select>
                        </td>
                        <td className="p-1"><input aria-label="Academic year" value={s.academicYear} onChange={(e) => setSubject(i, { academicYear: e.target.value })} placeholder="1995–1996" className="w-24 rounded border border-slate-300 p-1.5 font-mono" /></td>
                        <td className="p-1">
                          <button type="button" aria-label="Remove subject" onClick={() => setForm((f) => (f ? { ...f, subjects: f.subjects.filter((_, j) => j !== i) } : f))} className="rounded p-1 text-rose-600 hover:bg-rose-50">
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <button type="button" onClick={addSubject} className="inline-flex items-center gap-1 text-xs font-bold text-[#18392B]">
                <Plus className="h-3.5 w-3.5" /> Add subject
              </button>
              {form.subjects.length > 0 && (
                <p className="text-[11px] text-slate-500">Enrollment history (by term): {subjectsByTerm(form.subjects).map((t) => `${t.term} (${t.subjects.length})`).join(' · ')}</p>
              )}
            </fieldset>

            {error && (
              <p role="alert" className="text-xs font-medium text-rose-700">
                {error}
              </p>
            )}
            <div className="flex justify-end gap-2">
              <button type="button" onClick={() => setForm(null)} className="rounded-lg px-3 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100">
                Cancel
              </button>
              <button type="submit" disabled={busy} className="rounded-lg bg-[#18392B] px-4 py-2 text-xs font-bold text-white hover:bg-[#23533e] disabled:opacity-50">
                {busy ? 'Saving…' : existing ? 'Save changes' : 'Add record'}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};
