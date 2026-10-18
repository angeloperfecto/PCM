'use client';

import React, { useMemo, useState } from 'react';
import { GraduationCap, Link2, Search, Trash2, UserCheck } from 'lucide-react';
import { usePCM } from '@/lib/store';
import { db } from '@/lib/firebase';
import { programForStudent, subjectsForProgram } from '@/lib/curriculum';
import { linkApplicationToStudentRecord, saveCreditedSubjects, unlinkApplicationRecord, type ApplicationRecord, type CreditedSubject } from '@/lib/admissionsService';
import type { StudentProfile } from '@/lib/types';

const squash = (s?: string) => String(s || '').toLowerCase().replace(/[^a-z0-9]/g, '');
const peso = (n: number) => `₱${(Number(n) || 0).toLocaleString('en-PH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

/** Why a student record may belong to this applicant (shown to the Registrar; never linked automatically). */
function matchReasons(app: ApplicationRecord, s: StudentProfile): string[] {
  const out: string[] = [];
  const claimed = squash(app.registrationDetails?.existingStudentId);
  if (claimed && squash(s.studentId) === claimed) out.push('Student ID given by the applicant');
  if (app.email && s.email && app.email.toLowerCase() === s.email.toLowerCase()) out.push('Same email');
  const dob = String(app.dateOfBirth || app.birthDate || '');
  if (squash(app.fullName) && squash(app.fullName) === squash(s.fullName || s.name) && dob && dob === String(s.dateOfBirth || '')) out.push('Same name and birth date');
  else if (squash(app.fullName) && squash(app.fullName) === squash(s.fullName || s.name)) out.push('Same name');
  return out;
}

// Admissions Review: the applicant's existing student record (returnees keep their Student ID and
// history) and the transfer credit evaluation (transferees).
export const StudentRecordPanel: React.FC<{ app: ApplicationRecord; canDecide: boolean }> = ({ app, canDecide }) => {
  const { students, programs, curriculumSubjects, currentAdminUser, addToast } = usePCM();
  const actor = currentAdminUser?.name || 'Registrar';
  const enrolled = String(app.status) === 'Enrolled';
  const type = String(app.applicantType || 'New Student');
  const linked = app.linkedStudentRecordId ? students.find((s) => s.id === app.linkedStudentRecordId) : undefined;
  const [query, setQuery] = useState('');
  const [busy, setBusy] = useState(false);

  const candidates = useMemo(
    () =>
      students
        .map((s) => ({ s, reasons: matchReasons(app, s) }))
        .filter((x) => x.reasons.length > 0 && x.s.id !== app.studentRecordId)
        .slice(0, 6),
    [students, app]
  );
  const found = useMemo(() => {
    const q = squash(query);
    if (q.length < 3) return [];
    return students.filter((s) => squash(s.studentId).includes(q) || squash(s.fullName || s.name).includes(q)).slice(0, 6);
  }, [students, query]);

  // Transfer credits.
  const program = programForStudent(programs, { programId: app.programId, program: app.programName || app.program, degreeProgram: app.programName || app.program });
  const programSubjects = subjectsForProgram(curriculumSubjects, program).filter((s) => s.status !== 'Inactive');
  const [credits, setCredits] = useState<CreditedSubject[]>(() => (Array.isArray(app.creditedSubjects) ? app.creditedSubjects : []));
  const [draft, setDraft] = useState<CreditedSubject>({ code: '', title: '', units: 0, sourceSchool: String(app.previousSchool || app.highSchoolOrCollege || ''), sourceSubject: '', sourceGrade: '' });
  const creditsDirty = JSON.stringify(credits) !== JSON.stringify(Array.isArray(app.creditedSubjects) ? app.creditedSubjects : []);
  const showCredits = type === 'Transfer Student' || credits.length > 0;

  const run = async (fn: () => Promise<void>, ok: string) => {
    setBusy(true);
    try {
      await fn();
      addToast('success', ok, app.fullName);
    } catch (e: any) {
      addToast('error', 'Not saved', e?.code === 'permission-denied' ? 'Only the Registrar or an Admin can do this.' : 'Please try again.');
    } finally {
      setBusy(false);
    }
  };

  const addCredit = () => {
    if (!draft.code.trim() || !draft.title.trim() || !(Number(draft.units) > 0) || !draft.sourceSchool.trim()) {
      addToast('warning', 'Complete the credit', 'Choose or enter the PCM subject, its units, and the previous school.');
      return;
    }
    if (credits.some((c) => squash(c.code) === squash(draft.code))) {
      addToast('warning', 'Already credited', `${draft.code} is already in the list.`);
      return;
    }
    setCredits((c) => [...c, { ...draft, code: draft.code.trim(), title: draft.title.trim(), units: Number(draft.units), sourceSchool: draft.sourceSchool.trim() }]);
    setDraft((d) => ({ ...d, code: '', title: '', units: 0, sourceSubject: '', sourceGrade: '' }));
  };

  const recordCard = (s: StudentProfile) => (
    <div className="text-xs">
      <strong className="text-slate-900">{s.fullName || s.name}</strong> <span className="font-mono text-slate-500">{s.studentId}</span>
      <span className="block text-slate-600">
        {s.degreeProgram || s.program} • {s.yearLevel} • last term {s.lastEnrolledTerm || s.currentSemester || '—'} • {(s.subjectHistory || []).length} subjects in history • balance{' '}
        {peso(Number(s.tuitionBalance) || 0)}
      </span>
    </div>
  );

  const input = 'w-full rounded-lg border border-slate-300 p-1.5 text-xs';
  return (
    <section className="space-y-3 rounded-2xl border border-slate-200 bg-white p-4" data-testid="student-record-panel">
      <h4 className="flex items-center gap-2 text-sm font-bold text-[#18392B]">
        <UserCheck className="h-4 w-4 text-[#588B76]" /> Student record <span className="text-xs font-normal text-slate-500">• {type}</span>
      </h4>

      {enrolled ? (
        <p className="text-xs text-slate-600">Enrolled under student record {app.studentId || app.studentRecordId}.</p>
      ) : linked ? (
        <div className="space-y-2 rounded-xl border border-emerald-200 bg-emerald-50 p-3">
          <p className="text-[11px] font-bold uppercase text-emerald-800">Linked existing record — the Student ID and academic history are kept</p>
          {recordCard(linked)}
          {canDecide && (
            <button type="button" disabled={busy} onClick={() => run(() => unlinkApplicationRecord(db, app, actor), 'Link removed')} className="text-xs font-semibold text-rose-700 underline">
              Remove link
            </button>
          )}
        </div>
      ) : (
        <div className="space-y-2">
          {app.noPriorRecordConfirmed ? (
            <p className="rounded-xl border border-slate-200 bg-slate-50 p-3 text-xs">
              Confirmed by {app.recordLinkedBy || 'staff'}: no earlier student record. A new Student ID will be assigned.
            </p>
          ) : type === 'Returning Student' ? (
            <p className="rounded-xl border border-amber-200 bg-amber-50 p-3 text-xs text-amber-950">
              Returning student: link their existing record so they keep their Student ID, academic history and balance. Enrollment cannot be
              finalized until a record is linked or you confirm there is none.
              {app.registrationDetails?.existingStudentId ? ` They gave Student ID ${app.registrationDetails.existingStudentId}.` : ''}
            </p>
          ) : null}
          {candidates.length > 0 && (
            <div className="space-y-1.5">
              <p className="text-[11px] font-bold uppercase text-slate-500">Possible existing records</p>
              {candidates.map(({ s, reasons }) => (
                <div key={s.id} className="flex flex-col gap-2 rounded-xl border border-slate-200 p-2.5 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    {recordCard(s)}
                    <span className="text-[11px] text-amber-800">{reasons.join(' • ')}</span>
                  </div>
                  {canDecide && (
                    <button type="button" disabled={busy} onClick={() => run(() => linkApplicationToStudentRecord(db, app, s.id, actor), 'Record linked')} className="inline-flex shrink-0 items-center gap-1 rounded-lg bg-[#18392B] px-3 py-1.5 text-xs font-bold text-white disabled:opacity-50">
                      <Link2 className="h-3.5 w-3.5" /> Link this record
                    </button>
                  )}
                </div>
              ))}
            </div>
          )}
          {canDecide && (
            <>
              <label className="flex items-center gap-2 text-xs">
                <Search className="h-3.5 w-3.5 text-slate-400" />
                <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Find a record by Student ID or name" aria-label="Find student record" className={input} />
              </label>
              {found.map((s) => (
                <div key={s.id} className="flex items-center justify-between gap-2 rounded-lg border border-slate-200 p-2">
                  {recordCard(s)}
                  <button type="button" disabled={busy} onClick={() => run(() => linkApplicationToStudentRecord(db, app, s.id, actor), 'Record linked')} className="shrink-0 rounded-lg bg-[#18392B] px-2.5 py-1 text-xs font-bold text-white disabled:opacity-50">
                    Link
                  </button>
                </div>
              ))}
              {type === 'Returning Student' && !app.noPriorRecordConfirmed && (
                <button type="button" disabled={busy} onClick={() => run(() => linkApplicationToStudentRecord(db, app, null, actor), 'Recorded: no earlier record')} className="text-xs font-semibold text-slate-600 underline">
                  No earlier record exists — assign a new Student ID
                </button>
              )}
            </>
          )}
          {candidates.length === 0 && type !== 'Returning Student' && <p className="text-xs text-slate-500">No existing record matches this applicant; a new Student ID will be assigned.</p>}
        </div>
      )}

      {showCredits && (
        <div className="space-y-2 border-t border-slate-100 pt-3">
          <p className="flex items-center gap-1.5 text-xs font-bold text-[#18392B]">
            <GraduationCap className="h-4 w-4" /> Transfer credit evaluation
          </p>
          <p className="text-[11px] text-slate-500">
            PCM subjects credited from the previous school. They are added to the academic history as Credited when enrollment is finalized,
            count toward prerequisites and year level, and are not offered again.
          </p>
          {credits.length === 0 ? (
            <p className="text-xs text-slate-500">No credited subjects yet.</p>
          ) : (
            <ul className="divide-y divide-slate-100 rounded-lg border border-slate-200 text-xs">
              {credits.map((c, i) => (
                <li key={c.code} className="flex items-center justify-between gap-2 p-2">
                  <span>
                    <strong className="font-mono">{c.code}</strong> {c.title} • {c.units} u
                    <span className="block text-[11px] text-slate-500">
                      from {c.sourceSchool}{c.sourceSubject ? ` (${c.sourceSubject}` : ''}{c.sourceGrade ? `${c.sourceSubject ? ', ' : ' ('}grade ${c.sourceGrade})` : c.sourceSubject ? ')' : ''}
                    </span>
                  </span>
                  {canDecide && !enrolled && (
                    <button type="button" aria-label={`Remove ${c.code}`} onClick={() => setCredits((x) => x.filter((_, j) => j !== i))} className="rounded p-1 text-rose-600 hover:bg-rose-50">
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  )}
                </li>
              ))}
            </ul>
          )}
          {canDecide && !enrolled && (
            <div className="grid grid-cols-1 gap-2 rounded-xl border border-dashed border-slate-300 p-2 sm:grid-cols-2">
              <select
                aria-label="PCM subject to credit"
                value={draft.code}
                onChange={(e) => {
                  const sub = programSubjects.find((s) => s.code === e.target.value);
                  setDraft((d) => ({ ...d, code: e.target.value, title: sub?.title || d.title, units: sub ? Number(sub.units) || 0 : d.units }));
                }}
                className={input}
              >
                <option value="">PCM subject (from the curriculum)…</option>
                {programSubjects.map((s) => (
                  <option key={s.id} value={s.code}>{s.code} — {s.title} ({s.yearLevel}, {s.units} u)</option>
                ))}
              </select>
              <input aria-label="Previous school" value={draft.sourceSchool} onChange={(e) => setDraft((d) => ({ ...d, sourceSchool: e.target.value }))} placeholder="Previous school" className={input} />
              <input aria-label="Subject taken there" value={draft.sourceSubject || ''} onChange={(e) => setDraft((d) => ({ ...d, sourceSubject: e.target.value }))} placeholder="Subject taken there (optional)" className={input} />
              <input aria-label="Grade there" value={draft.sourceGrade || ''} onChange={(e) => setDraft((d) => ({ ...d, sourceGrade: e.target.value }))} placeholder="Grade there (optional)" className={input} />
              {programSubjects.length === 0 && (
                <>
                  <input aria-label="PCM code" value={draft.code} onChange={(e) => setDraft((d) => ({ ...d, code: e.target.value }))} placeholder="PCM subject code" className={input} />
                  <input aria-label="PCM title" value={draft.title} onChange={(e) => setDraft((d) => ({ ...d, title: e.target.value }))} placeholder="PCM subject title" className={input} />
                  <input aria-label="Units" type="number" min={1} value={draft.units || ''} onChange={(e) => setDraft((d) => ({ ...d, units: Number(e.target.value) }))} placeholder="Units" className={input} />
                </>
              )}
              <div className="flex gap-2 sm:col-span-2">
                <button type="button" onClick={addCredit} className="rounded-lg border border-[#18392B] px-3 py-1.5 text-xs font-semibold text-[#18392B]">Add credit</button>
                <button type="button" disabled={!creditsDirty || busy} onClick={() => run(() => saveCreditedSubjects(db, app, credits, actor), 'Credits saved')} className="rounded-lg bg-[#18392B] px-3 py-1.5 text-xs font-bold text-white disabled:opacity-40">
                  Save credits
                </button>
              </div>
            </div>
          )}
          {app.creditsEvaluatedBy && <p className="text-[11px] text-slate-500">Evaluated by {app.creditsEvaluatedBy}.</p>}
        </div>
      )}
    </section>
  );
};
