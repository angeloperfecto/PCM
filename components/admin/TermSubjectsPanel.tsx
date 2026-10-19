'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { doc, updateDoc } from 'firebase/firestore';
import { BookOpen, Copy, Eye, ListPlus, Lock, Pencil, Plus, RotateCcw, Trash2, Unlock, X } from 'lucide-react';
import { db } from '@/lib/firebase';
import { usePCM } from '@/lib/store';
import { YEAR_LEVELS, normalizeYearLevel, subjectsForProgram } from '@/lib/curriculum';
import { displayTerm, normCode, semesterKind, termKeyOf, termLabel } from '@/lib/reenrollment';
import {
  createOfferings,
  curriculumForTerm,
  duplicateOffering,
  isTermOffering,
  offeringForProgram,
  studentTermSubjects,
  termOfferings,
  type OfferingDraft,
} from '@/lib/termSubjects';
import type { AcademicPeriod, AcademicProgram, AcademicSubject } from '@/lib/types';

const programLabel = (p?: Partial<AcademicProgram> | null) => (p ? p.name || (p as any).title || p.code || '' : '');
const ALL = '(all year levels)';

type FormState = {
  id?: string;
  code: string;
  title: string;
  units: string;
  yearLevel: string;
  section: string;
  schedule: string;
  room: string;
  instructor: string;
  capacity: string;
  prerequisites: string;
  status: AcademicSubject['status'];
};
const emptyForm = (yearLevel = ''): FormState => ({
  code: '', title: '', units: '', yearLevel, section: '', schedule: '', room: '', instructor: '', capacity: '', prerequisites: '', status: 'Open',
});

// Enrollment & Records → Term Subjects: the subjects offered in each term, per program and year level.
// Students see exactly these (lib/termSubjects.ts) when they register, re-enroll, pre-enlist and add subjects.
export const TermSubjectsPanel: React.FC<{ initialTermId?: string }> = ({ initialTermId }) => {
  const { academicPeriods, academicSubjects, programs, curriculumSubjects, faculty, currentAdminUser, addToast, logActivity } = usePCM();
  const by = currentAdminUser?.name || currentAdminUser?.email || "Admin";

  const openTerm = displayTerm(academicPeriods);
  const terms = useMemo(() => {
    const open = displayTerm(academicPeriods);
    const rank = (p: AcademicPeriod) => (p.id === open?.id ? 0 : p.isCurrent ? 1 : p.closedAt ? 3 : 2);
    return [...academicPeriods].sort((a, b) => rank(a) - rank(b) || termKeyOf(b.semester, b.academicYear).localeCompare(termKeyOf(a.semester, a.academicYear)));
  }, [academicPeriods]);
  const [termId, setTermId] = useState(initialTermId || '');
  useEffect(() => {
    if (initialTermId) setTermId(initialTermId);
  }, [initialTermId]);
  const term = terms.find((p) => p.id === termId) || terms[0] || null;

  const programList = useMemo(() => (programs || []).filter((p: any) => programLabel(p)), [programs]);
  const [programId, setProgramId] = useState('');
  const program = programList.find((p) => p.id === programId) || programList[0] || null;
  const programSubjects = useMemo(() => subjectsForProgram(curriculumSubjects, program), [curriculumSubjects, program]);

  const [panel, setPanel] = useState<'' | 'curriculum' | 'copy' | 'form' | 'preview'>('');
  const [form, setForm] = useState<FormState>(emptyForm());
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [pickedIds, setPickedIds] = useState<string[]>([]);
  const [sourceId, setSourceId] = useState('');
  const [previewLevel, setPreviewLevel] = useState('1st Year');
  const closed = !!term?.closedAt;

  const allForTerm = useMemo(() => (term ? termOfferings(academicSubjects, term) : []), [academicSubjects, term]);
  const forProgram = useMemo(() => allForTerm.filter((o) => offeringForProgram(o, program)), [allForTerm, program]);
  const removed = useMemo(
    () => (term ? academicSubjects.filter((o) => o.isArchived && isTermOffering(o, term) && offeringForProgram(o, program)) : []),
    [academicSubjects, term, program]
  );
  const groups = useMemo(() => {
    const levels = [...YEAR_LEVELS, ALL];
    return levels
      .map((y) => ({
        yearLevel: y,
        rows: forProgram
          .filter((o) => (y === ALL ? !normalizeYearLevel(o.yearLevel) : normalizeYearLevel(o.yearLevel) === y))
          .sort((a, b) => a.code.localeCompare(b.code) || (a.section || '').localeCompare(b.section || '')),
      }))
      .filter((g) => g.rows.length);
  }, [forProgram]);

  if (!term) {
    return <p className="rounded-xl border border-slate-200 bg-white p-4 text-xs text-slate-600">Create an academic term first (Academic Terms), then set up its subjects here.</p>;
  }
  const tLabel = termLabel(term.semester, term.academicYear);
  const base = (yearLevel: string): Pick<OfferingDraft, 'semester' | 'academicYear' | 'program' | 'programId' | 'yearLevel'> => ({
    semester: term.semester,
    academicYear: term.academicYear,
    program: programLabel(program),
    programId: program?.id || '',
    yearLevel,
  });

  // ---------------------------------------------------------------- curriculum
  const curriculum = curriculumForTerm(programSubjects, term);
  const offeredCodes = new Set(forProgram.map((o) => normCode(o.code)));
  const pickedSet = new Set(pickedIds);
  const setPicked = (ids: string[]) => setPickedIds(ids);

  const run = async (fn: () => Promise<void>) => {
    setBusy(true);
    setError('');
    try {
      await fn();
    } catch (e: any) {
      setError(e?.code === 'permission-denied' ? 'Your account cannot change course offerings.' : e?.message || 'Not saved. Please try again.');
    } finally {
      setBusy(false);
    }
  };

  const capacityOf = (v: string) => {
    const n = Number(v);
    return Number.isInteger(n) && n >= 1 ? n : 0;
  };

  const addFromCurriculum = () =>
    run(async () => {
      const cap = capacityOf(form.capacity);
      if (!cap) throw new Error('Enter the class capacity (a whole number of at least 1).');
      const chosen = curriculum.filter((s) => pickedSet.has(s.id));
      if (!chosen.length) throw new Error('Choose at least one subject.');
      const drafts: OfferingDraft[] = chosen.map((s) => ({
        ...base(normalizeYearLevel(s.yearLevel) || s.yearLevel),
        code: s.code,
        title: s.title,
        description: s.description || '',
        category: s.type || '',
        units: Number(s.units) || 0,
        prerequisites: s.prerequisites && !/^(none|n\/a|-)$/i.test(s.prerequisites.trim()) ? s.prerequisites.split(/[,;]/).map((x) => x.trim()).filter(Boolean) : [],
        section: form.section.trim(),
        schedule: '',
        room: '',
        instructor: '',
        capacity: cap,
        status: 'Open',
      }));
      const r = await createOfferings(drafts, academicSubjects, by);
      logActivity('CREATE', 'Term Subjects', term.id, tLabel, `Added ${r.created} subject(s) from the ${programLabel(program)} curriculum.`);
      addToast('success', 'Subjects added', `${r.created} added to ${tLabel}${r.skipped ? `; ${r.skipped} already offered (skipped)` : ''}.`);
      setPanel('');
      setForm(emptyForm());
      setPickedIds([]);
      setSourceId('');
    });

  // ---------------------------------------------------------------- copy
  // Same-semester terms first (e.g. last year's 1st Semester for this 1st Semester).
  const sameSem = (p: AcademicPeriod) => semesterKind(p.semester) === semesterKind(term.semester);
  const sourceTerms = terms
    .filter((p) => p.id !== term.id && termOfferings(academicSubjects, p).some((o) => offeringForProgram(o, program)))
    .sort((a, b) => Number(sameSem(b)) - Number(sameSem(a)) || termKeyOf(b.semester, b.academicYear).localeCompare(termKeyOf(a.semester, a.academicYear)));
  const source = sourceTerms.find((p) => p.id === sourceId) || null;
  const sourceRows = source ? termOfferings(academicSubjects, source).filter((o) => offeringForProgram(o, program)) : [];
  const copyFromTerm = () =>
    run(async () => {
      if (!source) throw new Error('Choose the term to copy from.');
      const drafts: OfferingDraft[] = sourceRows.map((o) => ({
        ...base(o.yearLevel || ''),
        program: o.program || '',
        programId: o.programId || '',
        code: o.code,
        title: o.title,
        description: o.description || '',
        category: o.category || '',
        units: Number(o.units) || 0,
        prerequisites: o.prerequisites || [],
        subjectType: o.subjectType,
        section: o.section || '',
        schedule: o.schedule || '',
        room: o.room || '',
        instructor: o.instructor || '',
        instructorId: o.instructorId || '',
        capacity: Number(o.capacity) || 0,
        status: 'Open',
      }));
      const r = await createOfferings(drafts, academicSubjects, by);
      logActivity('CREATE', 'Term Subjects', term.id, tLabel, `Copied ${r.created} subject(s) from ${termLabel(source.semester, source.academicYear)}.`);
      addToast('success', 'Subjects copied', `${r.created} copied to ${tLabel}${r.skipped ? `; ${r.skipped} already offered (skipped)` : ''}.`);
      setPanel('');
      setForm(emptyForm());
      setPickedIds([]);
      setSourceId('');
    });

  // ---------------------------------------------------------------- add / edit one
  const editing = form.id ? academicSubjects.find((o) => o.id === form.id) : null;
  const saveOne = () =>
    run(async () => {
      const code = form.code.trim().toUpperCase();
      const units = Number(form.units);
      const cap = capacityOf(form.capacity);
      if (!/^[A-Z0-9][A-Z0-9 .-]{1,19}$/.test(code)) throw new Error('Enter the subject code (e.g. BIB-305).');
      if (!form.title.trim()) throw new Error('Enter the descriptive title.');
      if (!Number.isFinite(units) || units < 1 || units > 12) throw new Error('Units must be between 1 and 12.');
      if (!cap) throw new Error('Enter the class capacity (a whole number of at least 1).');
      if (editing && cap < (editing.enrolledCount || 0)) throw new Error(`Capacity cannot be below the ${editing.enrolledCount} students already enrolled.`);
      const fields = {
        code,
        title: form.title.trim(),
        units,
        yearLevel: form.yearLevel,
        section: form.section.trim(),
        schedule: form.schedule.trim(),
        room: form.room.trim(),
        instructor: form.instructor.trim(),
        capacity: cap,
        status: form.status,
        prerequisites: form.prerequisites.split(/[,;]/).map((x) => x.trim()).filter(Boolean),
      };
      const target = editing
        ? { ...fields, semester: editing.semester, academicYear: editing.academicYear, program: editing.program, programId: editing.programId }
        : { ...base(form.yearLevel), ...fields };
      if (duplicateOffering(academicSubjects, target, editing?.id)) throw new Error(`${code}${fields.section ? ` section ${fields.section}` : ''} is already offered in ${tLabel}.`);
      if (editing) {
        await updateDoc(doc(db, 'academicSubjects', editing.id), { ...fields, updatedAt: new Date().toISOString(), updatedBy: by });
        logActivity('UPDATE', 'Term Subjects', editing.id, code, `Updated ${code} for ${tLabel}.`);
        addToast('success', 'Subject saved', `${code} updated for ${tLabel}.`);
      } else {
        const r = await createOfferings([{ ...(target as OfferingDraft), description: '', category: '' }], academicSubjects, by);
        if (!r.created) throw new Error(`${code} was offered in ${tLabel} before and removed. Restore it from “Removed subjects” below.`);
        logActivity('CREATE', 'Term Subjects', term.id, code, `Added ${code} to ${tLabel}.`);
        addToast('success', 'Subject added', `${code} added to ${tLabel}.`);
      }
      setPanel('');
      setForm(emptyForm());
      setPickedIds([]);
      setSourceId('');
    });

  const setStatus = (o: AcademicSubject, status: AcademicSubject['status']) =>
    run(async () => {
      await updateDoc(doc(db, 'academicSubjects', o.id), { status, updatedAt: new Date().toISOString(), updatedBy: by });
      logActivity('UPDATE', 'Term Subjects', o.id, o.code, `${status === 'Closed' ? 'Closed' : 'Opened'} ${o.code} for ${tLabel}.`);
    });
  const remove = (o: AcademicSubject) =>
    run(async () => {
      if ((o.enrolledCount || 0) > 0) throw new Error(`${o.enrolledCount} student(s) are enrolled in ${o.code}. Close it instead so no one else can enroll.`);
      await updateDoc(doc(db, 'academicSubjects', o.id), { isArchived: true, removedAt: new Date().toISOString(), removedBy: by });
      logActivity('UPDATE', 'Term Subjects', o.id, o.code, `Removed ${o.code} from ${tLabel} (can be restored).`);
      addToast('info', 'Subject removed', `${o.code} is no longer offered in ${tLabel}. You can restore it below.`);
    });
  const restore = (o: AcademicSubject) =>
    run(async () => {
      await updateDoc(doc(db, 'academicSubjects', o.id), { isArchived: false, removedAt: '', removedBy: '' });
      logActivity('UPDATE', 'Term Subjects', o.id, o.code, `Restored ${o.code} to ${tLabel}.`);
    });

  // ---------------------------------------------------------------- preview
  const preview = panel === 'preview' ? studentTermSubjects({ catalog: academicSubjects, term, programSubjects, program, student: {}, yearLevel: previewLevel }) : null;

  const input = 'w-full rounded-lg border border-slate-300 bg-white p-2 text-xs';
  const btn = 'flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-bold disabled:opacity-50';
  const open = (p: typeof panel, f: FormState = emptyForm()) => {
    setError('');
    setPickedIds([]);
    setSourceId('');
    setForm(f);
    setPanel(panel === p && !f.id ? '' : p);
  };

  return (
    <div className="space-y-4" data-testid="term-subjects">
      <div className="space-y-3 rounded-xl border border-slate-200 bg-white p-4">
        <div>
          <h4 className="flex items-center gap-2 text-sm font-bold text-[#18392B]">
            <BookOpen className="h-4 w-4 text-[#588B76]" /> Term Subjects
          </h4>
          <p className="text-xs text-slate-500">
            The subjects offered in each term, by program and year level. Students see only these when they register, re-enroll, pre-enlist and
            add subjects, limited to their year level (and back subjects from earlier years not yet passed).
          </p>
        </div>
        <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
          <label className="text-[11px] font-bold text-slate-600">
            Term
            <select aria-label="Term" value={term.id} onChange={(e) => { setTermId(e.target.value); setPanel(''); }} className={input}>
              {terms.map((p) => (
                <option key={p.id} value={p.id}>
                  {termLabel(p.semester, p.academicYear)}
                  {p.closedAt ? ' (closed)' : p.id === openTerm?.id && p.enrollmentStatus === 'Open' ? ' (open for enrollment)' : p.isCurrent ? ' (current)' : ''}
                </option>
              ))}
            </select>
          </label>
          <label className="text-[11px] font-bold text-slate-600">
            Program
            <select aria-label="Program" value={program?.id || ''} onChange={(e) => { setProgramId(e.target.value); setPanel(''); }} className={input}>
              {programList.map((p) => (
                <option key={p.id} value={p.id}>{programLabel(p)}</option>
              ))}
            </select>
          </label>
        </div>

        <p className="text-xs text-slate-700">
          <strong>{forProgram.length}</strong> subject offering{forProgram.length === 1 ? '' : 's'} for {programLabel(program) || 'this program'} in {tLabel}
          {allForTerm.length !== forProgram.length ? ` (${allForTerm.length} across all programs)` : ''}.
        </p>
        {allForTerm.length === 0 && !closed && (
          <p className="rounded-lg border border-amber-200 bg-amber-50 p-2.5 text-xs text-amber-950">
            No subjects are set up for {tLabel} yet. Until they are, students see the program curriculum with the older course catalog entries
            that aren’t assigned to any term. Add subjects from the curriculum or copy them from an earlier term.
          </p>
        )}
        {closed && (
          <p className="flex items-center gap-1.5 rounded-lg border border-slate-200 bg-slate-50 p-2.5 text-xs text-slate-700">
            <Lock className="h-3.5 w-3.5" /> This term is closed; its subjects are kept as a record and can’t be changed.
          </p>
        )}
        {!closed && (
          <div className="flex flex-wrap gap-2">
            <button type="button" onClick={() => open('curriculum')} className={`${btn} bg-[#18392B] text-white hover:bg-[#588B76]`}>
              <ListPlus className="h-3.5 w-3.5" /> Add from curriculum
            </button>
            <button type="button" onClick={() => open('copy')} className={`${btn} border border-slate-300 bg-white text-slate-800 hover:bg-slate-50`}>
              <Copy className="h-3.5 w-3.5" /> Copy from an earlier term
            </button>
            <button type="button" onClick={() => open('form')} className={`${btn} border border-slate-300 bg-white text-slate-800 hover:bg-slate-50`}>
              <Plus className="h-3.5 w-3.5" /> Add a subject
            </button>
            <button type="button" onClick={() => open('preview')} className={`${btn} border border-slate-300 bg-white text-slate-800 hover:bg-slate-50`}>
              <Eye className="h-3.5 w-3.5" /> Preview as a student
            </button>
          </div>
        )}
        {error && <p className="rounded-lg border border-rose-200 bg-rose-50 p-2 text-xs text-rose-800" role="alert">{error}</p>}
      </div>

      {panel === 'curriculum' && (
        <div className="space-y-3 rounded-xl border border-emerald-200 bg-emerald-50/40 p-4" data-testid="add-from-curriculum">
          <div className="flex items-center justify-between">
            <h5 className="text-xs font-bold text-[#18392B]">{programLabel(program)} curriculum — {term.semester}</h5>
            <button type="button" aria-label="Close" onClick={() => setPanel('')}><X className="h-4 w-4 text-slate-500" /></button>
          </div>
          {curriculum.length === 0 ? (
            <p className="text-xs text-slate-600">
              The {programLabel(program)} curriculum has no subjects for the {term.semester}. Set them up in Subjects per Year Level, or use “Add a subject”.
            </p>
          ) : (
            <>
              {YEAR_LEVELS.map((y) => {
                const rows = curriculum.filter((s) => (normalizeYearLevel(s.yearLevel) || s.yearLevel) === y);
                if (!rows.length) return null;
                const selectable = rows.filter((s) => !offeredCodes.has(normCode(s.code)));
                return (
                  <div key={y} className="space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] font-bold uppercase tracking-wider text-slate-600">{y}</span>
                      {selectable.length > 0 && (
                        <button
                          type="button"
                          className="text-[11px] font-bold text-[#588B76] hover:underline"
                          onClick={() => setPicked(Array.from(new Set([...pickedSet, ...selectable.map((s) => s.id)])))}
                        >
                          Select all {y}
                        </button>
                      )}
                    </div>
                    {rows.map((s) => {
                      const already = offeredCodes.has(normCode(s.code));
                      return (
                        <label key={s.id} className={`flex items-center gap-2 rounded-lg bg-white p-2 text-xs ${already ? 'text-slate-400' : 'text-slate-800'}`}>
                          <input
                            type="checkbox"
                            disabled={already}
                            checked={already || pickedSet.has(s.id)}
                            onChange={(e) => {
                              const next = new Set(pickedSet);
                              if (e.target.checked) next.add(s.id);
                              else next.delete(s.id);
                              setPicked([...next]);
                            }}
                          />
                          <span className="font-mono font-bold">{s.code}</span> {s.title} · {s.units} units
                          {s.prerequisites ? <span className="text-slate-500"> · prereq {s.prerequisites}</span> : null}
                          {already && <span className="ml-auto text-[10px] font-bold uppercase">Already offered</span>}
                        </label>
                      );
                    })}
                  </div>
                );
              })}
              <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
                <label className="text-[11px] font-bold text-slate-600">
                  Class capacity *
                  <input type="number" min={1} value={form.capacity} onChange={(e) => setForm((f) => ({ ...f, capacity: e.target.value }))} className={input} />
                </label>
                <label className="text-[11px] font-bold text-slate-600">
                  Section (optional)
                  <input value={form.section} onChange={(e) => setForm((f) => ({ ...f, section: e.target.value }))} className={input} />
                </label>
                <div className="flex items-end">
                  <button type="button" disabled={busy || pickedSet.size === 0} onClick={addFromCurriculum} className={`${btn} w-full justify-center bg-[#18392B] text-white`}>
                    {busy ? 'Adding…' : `Add ${pickedSet.size} subject${pickedSet.size === 1 ? '' : 's'} to ${term.semester}`}
                  </button>
                </div>
              </div>
              <p className="text-[11px] text-slate-500">Schedule, room and instructor can be filled in afterwards with Edit. Subjects already offered are skipped.</p>
            </>
          )}
        </div>
      )}

      {panel === 'copy' && (
        <div className="space-y-3 rounded-xl border border-sky-200 bg-sky-50/40 p-4">
          <div className="flex items-center justify-between">
            <h5 className="text-xs font-bold text-[#18392B]">Copy {programLabel(program)} subjects from an earlier term</h5>
            <button type="button" aria-label="Close" onClick={() => setPanel('')}><X className="h-4 w-4 text-slate-500" /></button>
          </div>
          {sourceTerms.length === 0 ? (
            <p className="text-xs text-slate-600">No other term has {programLabel(program)} subjects set up.</p>
          ) : (
            <>
              <select aria-label="Copy from" value={sourceId} onChange={(e) => setSourceId(e.target.value)} className={input}>
                <option value="">Choose a term…</option>
                {sourceTerms.map((p) => (
                  <option key={p.id} value={p.id}>{termLabel(p.semester, p.academicYear)}{sameSem(p) ? '' : ' (different semester)'}</option>
                ))}
              </select>
              {source && !sameSem(source) && (
                <p className="text-xs text-amber-900">That term is a different semester; check that these subjects belong in {term.semester}.</p>
              )}
              {source && (
                <p className="text-xs text-slate-700">
                  {sourceRows.length} offering{sourceRows.length === 1 ? '' : 's'} with their year level, section, schedule, room, instructor and capacity.
                  Enrollment counts start at 0; subjects already offered in {tLabel} are skipped.
                </p>
              )}
              <button type="button" disabled={busy || !source} onClick={copyFromTerm} className={`${btn} bg-sky-800 text-white`}>
                {busy ? 'Copying…' : `Copy to ${tLabel}`}
              </button>
            </>
          )}
        </div>
      )}

      {panel === 'form' && (
        <div className="space-y-3 rounded-xl border border-slate-300 bg-white p-4" data-testid="offering-form">
          <div className="flex items-center justify-between">
            <h5 className="text-xs font-bold text-[#18392B]">{editing ? `Edit ${editing.code}` : `Add a subject to ${tLabel}`}</h5>
            <button type="button" aria-label="Close" onClick={() => { setPanel(''); setForm(emptyForm()); }}><X className="h-4 w-4 text-slate-500" /></button>
          </div>
          <div className="grid grid-cols-1 gap-2 sm:grid-cols-4">
            {(
              [
                ['code', 'Code *', 'e.g. BIB-305'],
                ['title', 'Descriptive title *', ''],
                ['units', 'Units *', ''],
                ['section', 'Section', 'optional'],
                ['schedule', 'Schedule', 'e.g. MWF 9:00–10:00'],
                ['room', 'Room', ''],
                ['instructor', 'Instructor', ''],
                ['capacity', 'Capacity *', ''],
              ] as [keyof FormState, string, string][]
            ).map(([k, label, ph]) => (
              <label key={k} className={`text-[11px] font-bold text-slate-600 ${k === 'title' ? 'sm:col-span-2' : ''}`}>
                {label}
                <input
                  value={String(form[k] ?? '')}
                  placeholder={ph}
                  list={k === 'instructor' ? 'pcm-term-instructors' : undefined}
                  type={k === 'units' || k === 'capacity' ? 'number' : 'text'}
                  onChange={(e) => setForm((f) => ({ ...f, [k]: e.target.value }))}
                  className={input}
                />
              </label>
            ))}
            <label className="text-[11px] font-bold text-slate-600">
              Year level
              <select value={form.yearLevel} onChange={(e) => setForm((f) => ({ ...f, yearLevel: e.target.value }))} className={input}>
                <option value="">All year levels</option>
                {YEAR_LEVELS.map((y) => <option key={y} value={y}>{y}</option>)}
              </select>
            </label>
            <label className="text-[11px] font-bold text-slate-600 sm:col-span-2">
              Prerequisites (codes, comma-separated)
              <input value={form.prerequisites} onChange={(e) => setForm((f) => ({ ...f, prerequisites: e.target.value }))} className={input} />
            </label>
            <label className="text-[11px] font-bold text-slate-600">
              Status
              <select value={form.status} onChange={(e) => setForm((f) => ({ ...f, status: e.target.value as AcademicSubject['status'] }))} className={input}>
                <option value="Open">Open</option>
                <option value="Closed">Closed</option>
                <option value="Waitlist">Waitlist</option>
              </select>
            </label>
          </div>
          <datalist id="pcm-term-instructors">
            {[...new Set((faculty || []).map((m: any) => m.name).filter(Boolean))].map((n) => <option key={n as string} value={n as string} />)}
          </datalist>
          <button type="button" disabled={busy} onClick={saveOne} className={`${btn} bg-[#18392B] text-white`}>
            {busy ? 'Saving…' : editing ? 'Save changes' : 'Add subject'}
          </button>
        </div>
      )}

      {panel === 'preview' && preview && (
        <div className="space-y-2 rounded-xl border border-violet-200 bg-violet-50/40 p-4" data-testid="term-preview">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h5 className="text-xs font-bold text-[#18392B]">What a {previewLevel} {programLabel(program)} student sees in {tLabel} (before any subjects are passed)</h5>
            <div className="flex items-center gap-2">
              <select aria-label="Preview year level" value={previewLevel} onChange={(e) => setPreviewLevel(e.target.value)} className="rounded-lg border border-slate-300 bg-white p-1.5 text-xs">
                {YEAR_LEVELS.map((y) => <option key={y} value={y}>{y}</option>)}
              </select>
              <button type="button" aria-label="Close" onClick={() => setPanel('')}><X className="h-4 w-4 text-slate-500" /></button>
            </div>
          </div>
          {preview.subjects.length === 0 ? (
            <p className="text-xs text-slate-600">No subjects available for {previewLevel}.</p>
          ) : (
            <ul className="space-y-1 text-xs">
              {preview.subjects.map((s) => (
                <li key={s.id} className="rounded-lg bg-white p-2">
                  <span className="font-mono font-bold">{s.code}</span> {s.title} · {s.units} units{s.section ? ` · ${s.section}` : ''} · {s.yearLevel || 'All year levels'}
                  {s.backSubject ? ' · back subject' : ''}
                  {s.prerequisites ? ` · prereq ${s.prerequisites}` : ''}
                  {s.closed ? ' · closed' : s.full ? ' · full' : ''}
                </li>
              ))}
            </ul>
          )}
          {preview.notOffered.length > 0 && (
            <p className="text-[11px] text-amber-900">
              In the curriculum for this semester but not offered: {preview.notOffered.map((s) => `${s.code} (${s.yearLevel})`).join(', ')}.
            </p>
          )}
          <p className="text-[11px] text-slate-500">Students who already passed or were credited a subject don’t see it; earlier-year subjects show as back subjects.</p>
        </div>
      )}

      {groups.map((g) => (
        <div key={g.yearLevel} className="overflow-x-auto rounded-xl border border-slate-200 bg-white">
          <div className="flex items-center justify-between border-b border-slate-100 bg-slate-50 px-3.5 py-2">
            <span className="text-xs font-bold text-[#18392B]">{g.yearLevel === ALL ? 'All year levels' : g.yearLevel}</span>
            <span className="text-[11px] text-slate-500">
              {g.rows.length} subject{g.rows.length === 1 ? '' : 's'} · {g.rows.reduce((t, o) => t + (Number(o.units) || 0), 0)} units
            </span>
          </div>
          <table className="w-full text-left text-xs text-slate-700">
            <thead className="text-slate-500">
              <tr>
                <th className="p-2.5">Code</th>
                <th className="p-2.5">Title</th>
                <th className="p-2.5">Units</th>
                <th className="p-2.5">Section</th>
                <th className="p-2.5">Schedule / Room</th>
                <th className="p-2.5">Instructor</th>
                <th className="p-2.5">Enrolled</th>
                <th className="p-2.5">Status</th>
                {!closed && <th className="p-2.5 text-right">Manage</th>}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {g.rows.map((o) => (
                <tr key={o.id}>
                  <td className="p-2.5 font-mono font-bold text-[#18392B]">{o.code}</td>
                  <td className="p-2.5">{o.title}{!o.programId && !o.program ? <span className="ml-1 text-[10px] text-slate-500">(all programs)</span> : null}</td>
                  <td className="p-2.5 font-mono">{o.units}</td>
                  <td className="p-2.5">{o.section || '—'}</td>
                  <td className="p-2.5">{[o.schedule, o.room].filter(Boolean).join(' · ') || <span className="text-amber-700">Not set</span>}</td>
                  <td className="p-2.5">{o.instructor || <span className="text-amber-700">Not set</span>}</td>
                  <td className="p-2.5 font-mono">{o.enrolledCount || 0}/{o.capacity}</td>
                  <td className="p-2.5">
                    <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${o.status === 'Closed' ? 'bg-slate-200 text-slate-700' : 'bg-emerald-100 text-emerald-800'}`}>{o.status || 'Open'}</span>
                  </td>
                  {!closed && (
                    <td className="p-2.5">
                      <div className="flex justify-end gap-1">
                        <button
                          type="button"
                          aria-label={`Edit ${o.code}`}
                          title="Edit"
                          onClick={() =>
                            open('form', {
                              id: o.id,
                              code: o.code,
                              title: o.title,
                              units: String(o.units ?? ''),
                              yearLevel: normalizeYearLevel(o.yearLevel) || '',
                              section: o.section || '',
                              schedule: o.schedule || '',
                              room: o.room || '',
                              instructor: o.instructor || '',
                              capacity: String(o.capacity ?? ''),
                              prerequisites: (o.prerequisites || []).join(', '),
                              status: o.status || 'Open',
                            })
                          }
                          className="rounded-lg p-1.5 text-[#588B76] hover:bg-emerald-50"
                        >
                          <Pencil className="h-3.5 w-3.5" />
                        </button>
                        <button
                          type="button"
                          aria-label={`${o.status === 'Closed' ? 'Open' : 'Close'} ${o.code}`}
                          title={o.status === 'Closed' ? 'Open for enrollment' : 'Close (no new enrollments)'}
                          disabled={busy}
                          onClick={() => setStatus(o, o.status === 'Closed' ? 'Open' : 'Closed')}
                          className="rounded-lg p-1.5 text-slate-600 hover:bg-slate-100"
                        >
                          {o.status === 'Closed' ? <Unlock className="h-3.5 w-3.5" /> : <Lock className="h-3.5 w-3.5" />}
                        </button>
                        <button type="button" aria-label={`Remove ${o.code}`} title="Remove from this term" disabled={busy} onClick={() => remove(o)} className="rounded-lg p-1.5 text-rose-600 hover:bg-rose-50">
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ))}

      {removed.length > 0 && (
        <details className="rounded-xl border border-slate-200 bg-white p-3 text-xs">
          <summary className="cursor-pointer font-bold text-slate-700">Removed subjects ({removed.length})</summary>
          <ul className="mt-2 space-y-1">
            {removed.map((o) => (
              <li key={o.id} className="flex items-center justify-between rounded-lg bg-slate-50 p-2">
                <span><span className="font-mono font-bold">{o.code}</span> {o.title}{o.yearLevel ? ` · ${o.yearLevel}` : ''}{o.section ? ` · ${o.section}` : ''}</span>
                {!closed && (
                  <button type="button" disabled={busy} onClick={() => restore(o)} className="flex items-center gap-1 font-bold text-[#588B76] hover:underline">
                    <RotateCcw className="h-3.5 w-3.5" /> Restore
                  </button>
                )}
              </li>
            ))}
          </ul>
        </details>
      )}
    </div>
  );
};
