'use client';

import React, { useMemo, useState } from 'react';
import { Download, Edit3, Plus, Search, Trash2, X } from 'lucide-react';
import { usePCM } from '@/lib/store';
import {
  SEMESTERS,
  SUBJECT_TYPES,
  YEAR_LEVELS,
  curriculumToImport,
  groupByYearAndSemester,
  subjectsForProgram,
  validateCurriculumSubject,
} from '@/lib/curriculum';
import type { CurriculumSubject } from '@/lib/types';

const empty = (programId: string, programName: string): Partial<CurriculumSubject> => ({
  programId,
  programName,
  yearLevel: '1st Year',
  semester: '1st Semester',
  code: '',
  title: '',
  description: '',
  units: 3,
  prerequisites: '',
  type: 'Core',
  order: undefined,
  status: 'Active',
});

// Enrollment & Records → Subjects per Year Level: the curriculum of each program, by year level and
// semester. Registrar, Academic Admin and Admins can add, edit and remove subjects; other staff see
// it read-only. Changes are saved to Firebase (curriculumSubjects) and appear in the Student Portal live.
export const AdminCurriculumPanel: React.FC = () => {
  const { programs, curriculumSubjects, canManageCurriculum, saveCurriculumSubject, deleteCurriculumSubject, importProgramCurricula } = usePCM();
  const programList = useMemo(() => [...programs].sort((a, b) => (a.order ?? 99) - (b.order ?? 99) || (a.name || '').localeCompare(b.name || '')), [programs]);
  const [programId, setProgramId] = useState<string>('');
  const program = programList.find((p) => p.id === programId) || programList[0] || null;
  const [year, setYear] = useState('all');
  const [q, setQ] = useState('');
  const [editing, setEditing] = useState<Partial<CurriculumSubject> | null>(null);
  const [formError, setFormError] = useState('');
  const [busy, setBusy] = useState(false);

  const forProgram = useMemo(() => subjectsForProgram(curriculumSubjects, program), [curriculumSubjects, program]);
  const filtered = useMemo(() => {
    const needle = q.trim().toLowerCase();
    return forProgram.filter(
      (s) => (year === 'all' || s.yearLevel === year) && (!needle || [s.code, s.title, s.description, s.prerequisites].some((v) => String(v || '').toLowerCase().includes(needle)))
    );
  }, [forProgram, year, q]);
  const groups = groupByYearAndSemester(filtered);
  const toImport = useMemo(() => curriculumToImport(programs, curriculumSubjects).length, [programs, curriculumSubjects]);
  const totalUnits = forProgram.filter((s) => s.status === 'Active').reduce((t, s) => t + (Number(s.units) || 0), 0);

  const startAdd = () => {
    if (!program) return;
    setFormError('');
    setEditing({ ...empty(program.id, program.name || program.title || program.code), yearLevel: year !== 'all' ? year : '1st Year' });
  };
  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editing) return;
    const problem = validateCurriculumSubject(editing, curriculumSubjects);
    if (problem) return setFormError(problem);
    setBusy(true);
    try {
      if (await saveCurriculumSubject(editing)) setEditing(null);
    } finally {
      setBusy(false);
    }
  };

  const input = 'mt-1 w-full rounded-lg border border-slate-300 bg-white p-2 text-xs';
  return (
    <div className="space-y-4" data-testid="curriculum-admin">
      <div className="flex flex-col gap-3 rounded-xl border border-slate-200 bg-white p-4 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <h4 className="text-sm font-bold text-[#18392B]">Subjects per Year Level</h4>
          <p className="text-xs text-slate-500">
            The official curriculum of each program. Students see their program&apos;s curriculum in the Student Portal, updated as soon as it is saved.
            {!canManageCurriculum && ' Only the Registrar, Academic Admin or an Admin can change it.'}
          </p>
        </div>
        {canManageCurriculum && (
          <div className="flex flex-wrap gap-2">
            {toImport > 0 && (
              <button
                type="button"
                disabled={busy}
                onClick={async () => {
                  if (!window.confirm(`Add ${toImport} subject(s) listed in Academic Programs that are not in the curriculum yet? Existing subjects are not changed.`)) return;
                  setBusy(true);
                  try {
                    await importProgramCurricula();
                  } finally {
                    setBusy(false);
                  }
                }}
                className="inline-flex items-center gap-1.5 rounded-lg border border-slate-300 px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-50"
              >
                <Download className="h-3.5 w-3.5" /> Import from Academic Programs ({toImport})
              </button>
            )}
            <button type="button" onClick={startAdd} disabled={!program} className="inline-flex items-center gap-1.5 rounded-lg bg-[#18392B] px-3 py-2 text-xs font-bold text-white hover:bg-[#588B76] disabled:opacity-50">
              <Plus className="h-3.5 w-3.5" /> Add subject
            </button>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 gap-2 rounded-xl border border-slate-200 bg-white p-3 sm:grid-cols-[1.4fr_1fr_1.2fr]">
        <label className="text-[11px] font-semibold text-slate-600">
          Program
          <select value={program?.id || ''} onChange={(e) => setProgramId(e.target.value)} className={input} aria-label="Program">
            {programList.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name || p.title || p.code}
              </option>
            ))}
          </select>
        </label>
        <label className="text-[11px] font-semibold text-slate-600">
          Year level
          <select value={year} onChange={(e) => setYear(e.target.value)} className={input} aria-label="Year level filter">
            <option value="all">All year levels</option>
            {YEAR_LEVELS.map((y) => (
              <option key={y}>{y}</option>
            ))}
          </select>
        </label>
        <label className="text-[11px] font-semibold text-slate-600">
          Search
          <span className="relative block">
            <Search className="absolute left-2.5 top-3.5 h-3.5 w-3.5 text-slate-400" />
            <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Code, title, prerequisite…" className={`${input} pl-8`} aria-label="Search subjects" />
          </span>
        </label>
      </div>

      <p className="text-xs text-slate-600">
        {forProgram.length} subject{forProgram.length === 1 ? '' : 's'} in this program · {totalUnits} active units
      </p>

      {groups.length === 0 ? (
        <p className="rounded-xl border border-slate-200 bg-white p-6 text-center text-xs text-slate-500">
          {forProgram.length === 0 ? 'No subjects yet for this program.' : 'No subjects match the filter.'}
          {canManageCurriculum && forProgram.length === 0 && ' Use “Add subject” or import the subjects listed in Academic Programs.'}
        </p>
      ) : (
        groups.map((g) => (
          <section key={g.yearLevel} className="space-y-3 rounded-2xl border border-slate-200 bg-white p-4">
            <div className="flex items-center justify-between">
              <h5 className="font-serif text-base font-bold text-[#18392B]">{g.yearLevel || 'No year level'}</h5>
              <span className="text-xs font-semibold text-slate-500">{g.units} units</span>
            </div>
            {g.semesters.map((sem) => (
              <div key={sem.semester} className="overflow-x-auto rounded-lg border border-slate-200">
                <div className="flex items-center justify-between bg-slate-50 px-3 py-1.5 text-[11px] font-bold uppercase tracking-wider text-slate-600">
                  <span>{sem.semester || 'Whole year'}</span>
                  <span>{sem.units} units</span>
                </div>
                <table className="w-full min-w-[640px] text-left text-xs">
                  <thead className="text-[10px] uppercase tracking-wider text-slate-500">
                    <tr className="border-b border-slate-200">
                      <th className="px-3 py-1.5">Code</th>
                      <th className="px-3 py-1.5">Descriptive title</th>
                      <th className="px-3 py-1.5 text-center">Units</th>
                      <th className="px-3 py-1.5">Type</th>
                      <th className="px-3 py-1.5">Prerequisite</th>
                      <th className="px-3 py-1.5">Status</th>
                      {canManageCurriculum && <th className="px-3 py-1.5 text-right">Actions</th>}
                    </tr>
                  </thead>
                  <tbody>
                    {sem.subjects.map((s) => (
                      <tr key={s.id} className={`border-b border-slate-100 ${s.status === 'Inactive' ? 'text-slate-400' : ''}`}>
                        <td className="whitespace-nowrap px-3 py-2 font-mono font-bold">{s.code}</td>
                        <td className="px-3 py-2">
                          <span className="font-semibold">{s.title}</span>
                          {s.description && <span className="block text-[11px] text-slate-500">{s.description}</span>}
                        </td>
                        <td className="px-3 py-2 text-center font-mono">{s.units}</td>
                        <td className="px-3 py-2">{s.type || '—'}</td>
                        <td className="px-3 py-2">{s.prerequisites || '—'}</td>
                        <td className="px-3 py-2">
                          <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${s.status === 'Active' ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-100 text-slate-600'}`}>{s.status}</span>
                        </td>
                        {canManageCurriculum && (
                          <td className="whitespace-nowrap px-3 py-2 text-right">
                            <button
                              type="button"
                              aria-label={`Edit ${s.code}`}
                              onClick={() => {
                                setFormError('');
                                setEditing({ ...s });
                              }}
                              className="rounded p-1.5 text-slate-600 hover:bg-slate-100"
                            >
                              <Edit3 className="h-3.5 w-3.5" />
                            </button>
                            <button
                              type="button"
                              aria-label={`Delete ${s.code}`}
                              onClick={() => {
                                if (window.confirm(`Remove ${s.code} — ${s.title} from ${s.yearLevel}${s.semester ? `, ${s.semester}` : ''}?`)) deleteCurriculumSubject(s.id);
                              }}
                              className="rounded p-1.5 text-rose-600 hover:bg-rose-50"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </button>
                          </td>
                        )}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ))}
          </section>
        ))
      )}

      {editing && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 p-3" role="dialog" aria-modal="true" aria-label={editing.id ? 'Edit subject' : 'Add subject'}>
          <form onSubmit={save} className="max-h-[92vh] w-full max-w-xl space-y-3 overflow-y-auto rounded-2xl bg-white p-5 shadow-2xl">
            <div className="flex items-center justify-between">
              <h4 className="font-serif text-lg font-bold text-[#18392B]">{editing.id ? 'Edit subject' : 'Add subject'}</h4>
              <button type="button" aria-label="Close" onClick={() => setEditing(null)} className="rounded p-1.5 text-slate-500 hover:bg-slate-100">
                <X className="h-4 w-4" />
              </button>
            </div>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <label className="text-[11px] font-semibold text-slate-600 sm:col-span-2">
                Program
                <select
                  value={editing.programId}
                  onChange={(e) => {
                    const p = programList.find((x) => x.id === e.target.value);
                    setEditing({ ...editing, programId: e.target.value, programName: p?.name || p?.title || p?.code || '' });
                  }}
                  className={input}
                >
                  {programList.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name || p.title || p.code}
                    </option>
                  ))}
                </select>
              </label>
              <label className="text-[11px] font-semibold text-slate-600">
                Year level
                <select value={editing.yearLevel} onChange={(e) => setEditing({ ...editing, yearLevel: e.target.value })} className={input}>
                  {YEAR_LEVELS.map((y) => (
                    <option key={y}>{y}</option>
                  ))}
                  {editing.yearLevel && !YEAR_LEVELS.includes(editing.yearLevel) && <option>{editing.yearLevel}</option>}
                </select>
              </label>
              <label className="text-[11px] font-semibold text-slate-600">
                Semester
                <select value={editing.semester || ''} onChange={(e) => setEditing({ ...editing, semester: e.target.value })} className={input}>
                  {SEMESTERS.map((s) => (
                    <option key={s}>{s}</option>
                  ))}
                  <option value="">Whole year</option>
                </select>
              </label>
              <label className="text-[11px] font-semibold text-slate-600">
                Subject code
                <input required value={editing.code || ''} onChange={(e) => setEditing({ ...editing, code: e.target.value.toUpperCase() })} placeholder="BIB-101" className={`${input} font-mono`} />
              </label>
              <label className="text-[11px] font-semibold text-slate-600">
                Units
                <input required type="number" min={0} max={30} step="0.5" value={editing.units ?? ''} onChange={(e) => setEditing({ ...editing, units: e.target.value === '' ? undefined : Number(e.target.value) })} className={input} />
              </label>
              <label className="text-[11px] font-semibold text-slate-600 sm:col-span-2">
                Descriptive title
                <input required value={editing.title || ''} onChange={(e) => setEditing({ ...editing, title: e.target.value })} placeholder="Old Testament Survey" className={input} />
              </label>
              <label className="text-[11px] font-semibold text-slate-600 sm:col-span-2">
                Description (optional)
                <textarea rows={2} value={editing.description || ''} onChange={(e) => setEditing({ ...editing, description: e.target.value })} className={input} />
              </label>
              <label className="text-[11px] font-semibold text-slate-600">
                Type
                <select value={editing.type || 'Core'} onChange={(e) => setEditing({ ...editing, type: e.target.value })} className={input}>
                  {SUBJECT_TYPES.map((t) => (
                    <option key={t}>{t}</option>
                  ))}
                </select>
              </label>
              <label className="text-[11px] font-semibold text-slate-600">
                Prerequisite (optional)
                <input value={editing.prerequisites || ''} onChange={(e) => setEditing({ ...editing, prerequisites: e.target.value })} placeholder="e.g. BIB-101" className={input} />
              </label>
              <label className="text-[11px] font-semibold text-slate-600">
                Order in semester
                <input type="number" min={0} value={editing.order ?? ''} onChange={(e) => setEditing({ ...editing, order: e.target.value === '' ? undefined : Number(e.target.value) })} placeholder="Auto" className={input} />
              </label>
              <label className="text-[11px] font-semibold text-slate-600">
                Status
                <select value={editing.status || 'Active'} onChange={(e) => setEditing({ ...editing, status: e.target.value as CurriculumSubject['status'] })} className={input}>
                  <option value="Active">Active</option>
                  <option value="Inactive">Inactive (hidden from students)</option>
                </select>
              </label>
            </div>
            {formError && (
              <p role="alert" className="rounded-lg border border-rose-200 bg-rose-50 p-2 text-xs text-rose-800">
                {formError}
              </p>
            )}
            <div className="flex justify-end gap-2 border-t border-slate-100 pt-3">
              <button type="button" onClick={() => setEditing(null)} className="rounded-lg px-3 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100">
                Cancel
              </button>
              <button type="submit" disabled={busy} className="rounded-lg bg-[#18392B] px-4 py-2 text-xs font-bold text-white hover:bg-[#588B76] disabled:opacity-50">
                {busy ? 'Saving…' : editing.id ? 'Save changes' : 'Add subject'}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};
