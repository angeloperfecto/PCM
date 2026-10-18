'use client';

import React, { useMemo, useState } from 'react';
import { CheckCircle2, ClipboardList, Printer, Undo2 } from 'lucide-react';
import { usePCM } from '@/lib/store';
import { normAY, normCode, offeredSubjects, openEnrollmentTerm, semesterKind } from '@/lib/reenrollment';
import { subjectsForProgram } from '@/lib/curriculum';
import { db, auth } from '@/lib/firebase';
import {
  APPLICANT_CORRECTION_FIELDS,
  resubmitCorrections,
  submitRegistration,
  withdrawApplication,
} from '@/lib/admissionsService';
import {
  ApplicationPayment,
  CatalogSubject,
  EnrollmentRegistration,
  RegisteredSubject,
  YEAR_LEVELS,
  isOpenApplication,
  normalizeStatus,
  validateRegistration,
  verifiedPaymentTotal,
} from '@/lib/enrollmentWorkflow';

type App = Record<string, any> & { id: string; referenceNumber: string; status: string; fullName: string; email: string };
type Result = { ok: boolean; message: string };

const actorFor = (app: App) => ({ uid: auth.currentUser?.uid || '', name: app.fullName, email: auth.currentUser?.email });

const ResultNote: React.FC<{ result: Result | null }> = ({ result }) =>
  result ? (
    <p role={result.ok ? 'status' : 'alert'} className={`rounded-lg border p-2 text-xs ${result.ok ? 'border-emerald-200 bg-emerald-50 text-emerald-900' : 'border-rose-200 bg-rose-50 text-rose-800'}`}>
      {result.message}
    </p>
  ) : null;

// Step 5: the admitted student chooses program, year level and subjects for the open term.
export const RegistrationForm: React.FC<{ app: App }> = ({ app }) => {
  const { academicSubjects, academicPeriods, programs, enrollmentSystemConfig, curriculumSubjects } = usePCM();
  // The term open for enrollment now (status, dates and capacity from Academic Terms).
  const openTerm = openEnrollmentTerm(academicPeriods);
  const term = openTerm;
  const termFull = !!openTerm?.capacity && (openTerm.enrolledCount || 0) >= openTerm.capacity;
  const termOpen = !!openTerm && !termFull;
  const programNames = useMemo(
    () => Array.from(new Set([app.programName || app.program, ...programs.map((p: any) => p.name || p.title)].filter(Boolean))) as string[],
    [programs, app.programName, app.program]
  );
  const [programName, setProgramName] = useState<string>(app.programName || app.program || programNames[0] || '');
  const [yearLevel, setYearLevel] = useState<string>(app.applicantType === 'Transfer Student' ? '' : '1st Year');
  const [selected, setSelected] = useState<string[]>([]);
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState<Result | null>(null);

  const catalogForTerm = useMemo(
    () =>
      academicSubjects
        .filter((s: any) => !s.isArchived && (s.status || 'Open') === 'Open')
        .filter((s: any) => !term || ((!s.semester || semesterKind(s.semester) === semesterKind(term.semester)) && (!s.academicYear || normAY(s.academicYear) === normAY(term.academicYear))))
        .sort((a: any, b: any) => a.code.localeCompare(b.code)),
    [academicSubjects, term]
  );
  // The program's curriculum (Subjects per Year Level) decides which offerings apply: subjects of the
  // chosen year level and earlier ones not yet taken, minus subjects credited from a previous school.
  const credits: { code: string; title: string; units: number }[] = Array.isArray(app.creditedSubjects) ? app.creditedSubjects : [];
  const selectedProgram = programs.find((p: any) => (p.name || p.title) === programName) || null;
  const programSubjects = useMemo(() => subjectsForProgram(curriculumSubjects, selectedProgram).filter((s) => s.status !== 'Inactive'), [curriculumSubjects, selectedProgram]);
  const curriculumOffered = useMemo(
    () =>
      programSubjects.length && yearLevel && term
        ? offeredSubjects(programSubjects, academicSubjects, yearLevel, term.semester, { subjectHistory: credits.map((c) => ({ code: c.code, title: c.title, units: c.units, grade: '', semester: '', academicYear: '', status: 'Credited' })) } as any)
        : null,
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [programSubjects, academicSubjects, yearLevel, term, JSON.stringify(credits)]
  );
  const offered = useMemo(
    () => (curriculumOffered ? catalogForTerm.filter((s: any) => curriculumOffered.some((c) => normCode(c.code) === normCode(s.code))) : catalogForTerm),
    [catalogForTerm, curriculumOffered]
  );
  const notOfferedThisTerm = (curriculumOffered || []).filter((c) => !catalogForTerm.some((s: any) => normCode(s.code) === normCode(c.code)));
  const enforcePrereq = !!enrollmentSystemConfig?.enforcePrerequisites;
  const curriculumInfo = (code: string) => (curriculumOffered || []).find((c) => normCode(c.code) === normCode(code));
  const policy = {
    minUnits: Number(enrollmentSystemConfig?.minUnitsAllowed) || 0,
    maxUnits: Number(enrollmentSystemConfig?.maxUnitsAllowed) || 0,
    maxSubjects: Number(enrollmentSystemConfig?.maxSubjectsAllowed) || 0,
    enforceScheduleConflicts: enrollmentSystemConfig?.enforceScheduleConflicts !== false,
    enforceSectionCapacity: enrollmentSystemConfig?.enforceSectionCapacity !== false,
  };
  const subjects: RegisteredSubject[] = offered
    .filter((s: any) => selected.includes(s.id))
    .map((s: any) => ({
      subjectId: s.id,
      code: s.code,
      title: s.title,
      units: Number(s.units) || 0,
      section: s.section || '',
      schedule: s.schedule || '',
      room: s.room || '',
      instructor: s.instructor || '',
    }));
  const totalUnits = subjects.reduce((sum, s) => sum + s.units, 0);
  const draft = { programName, yearLevel, academicYear: term?.academicYear || '', semester: term?.semester || '', subjects };
  const prereqBlocked = enforcePrereq ? subjects.filter((x) => curriculumInfo(x.code)?.prerequisitesMet === false) : [];
  const problem =
    validateRegistration(draft, policy, offered as CatalogSubject[]) ||
    (prereqBlocked.length ? `Prerequisites not yet passed: ${prereqBlocked.map((x) => x.code).join(', ')}.` : '');

  if (!termOpen) {
    return (
      <section className="rounded-2xl border border-amber-200 bg-amber-50 p-5 text-xs text-amber-950">
        <h4 className="font-serif text-lg font-bold text-[#18392B]">Choose your subjects</h4>
        <p className="mt-1">
          {termFull
            ? `Enrollment for ${openTerm!.semester}, AY ${openTerm!.academicYear} has reached its capacity. Please contact the Registrar.`
            : 'Enrollment for the current term is not open yet. You will be able to choose your subjects once the Registrar opens it.'}
        </p>
      </section>
    );
  }

  return (
    <section className="space-y-4 rounded-2xl border-2 border-[#588B76] bg-white p-5 shadow-sm sm:p-6" data-testid="registration-form">
      <div>
        <h4 className="flex items-center gap-2 font-serif text-lg font-bold text-[#18392B]">
          <ClipboardList className="h-5 w-5 text-[#588B76]" /> Choose your subjects
        </h4>
        <p className="text-xs text-slate-600">
          {term!.semester}, Academic Year {term!.academicYear}
          {policy.minUnits || policy.maxUnits ? ` · Load: ${policy.minUnits}–${policy.maxUnits} units` : ''}
          {policy.maxSubjects ? ` · up to ${policy.maxSubjects} subjects` : ''}
        </p>
      </div>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <label className="block text-xs font-semibold text-slate-600">
          Academic program
          <select value={programName} onChange={(e) => setProgramName(e.target.value)} className="mt-1 w-full rounded-lg border border-slate-300 bg-white p-2 text-sm">
            {programNames.map((p) => (
              <option key={p}>{p}</option>
            ))}
          </select>
        </label>
        <label className="block text-xs font-semibold text-slate-600">
          Year level
          <select value={yearLevel} onChange={(e) => setYearLevel(e.target.value)} className="mt-1 w-full rounded-lg border border-slate-300 bg-white p-2 text-sm">
            <option value="">Choose…</option>
            {YEAR_LEVELS.map((y) => (
              <option key={y}>{y}</option>
            ))}
          </select>
        </label>
      </div>

      {credits.length > 0 && (
        <p className="rounded-lg border border-emerald-200 bg-emerald-50 p-2.5 text-[11px] text-emerald-950">
          Credited from your previous school: {credits.map((c) => c.code).join(', ')} ({credits.reduce((t, c) => t + (Number(c.units) || 0), 0)} units). These are not offered again.
        </p>
      )}
      {!yearLevel && <p className="text-[11px] text-amber-800">Choose your year level to see the subjects of your curriculum.</p>}
      {curriculumOffered && notOfferedThisTerm.length > 0 && (
        <p className="text-[11px] text-slate-500">
          In your curriculum but not offered this term: {notOfferedThisTerm.map((c) => c.code).join(', ')}.
        </p>
      )}
      {offered.length === 0 ? (
        <p className="text-xs text-slate-600">No subjects are offered for this term yet. Please check back or contact the Registrar.</p>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-slate-200">
          <table className="w-full min-w-[560px] text-xs">
            <thead className="bg-slate-50 text-left text-slate-500">
              <tr>
                <th className="p-2 w-8" aria-label="Select" />
                <th className="p-2">Subject</th>
                <th className="p-2">Schedule</th>
                <th className="p-2 text-right">Units</th>
                <th className="p-2 text-right">Seats</th>
              </tr>
            </thead>
            <tbody>
              {offered.map((s: any) => {
                const full = Number(s.capacity) > 0 && Number(s.enrolledCount || 0) >= Number(s.capacity);
                const checked = selected.includes(s.id);
                const info = curriculumInfo(s.code);
                const blocked = enforcePrereq && info?.prerequisitesMet === false;
                return (
                  <tr key={s.id} className={`border-t border-slate-100 ${checked ? 'bg-emerald-50/60' : ''}`}>
                    <td className="p-2">
                      <input
                        type="checkbox"
                        aria-label={`Select ${s.code}`}
                        checked={checked}
                        disabled={(full || blocked) && !checked}
                        onChange={(e) => setSelected((cur) => (e.target.checked ? [...cur, s.id] : cur.filter((x) => x !== s.id)))}
                      />
                    </td>
                    <td className="p-2">
                      <span className="font-mono font-bold text-[#18392B]">{s.code}</span> {s.title}
                      {s.section ? <span className="text-slate-400"> · {s.section}</span> : null}
                      {info?.backSubject && <span className="ml-1 rounded bg-amber-100 px-1 text-[10px] font-bold text-amber-900">{info.yearLevel}</span>}
                      {info && !info.prerequisitesMet && (
                        <span className="ml-1 rounded bg-rose-100 px-1 text-[10px] font-bold text-rose-800">Prerequisite: {info.prerequisites}</span>
                      )}
                    </td>
                    <td className="p-2 text-slate-600">{s.schedule || '—'}</td>
                    <td className="p-2 text-right font-mono">{s.units}</td>
                    <td className={`p-2 text-right font-mono ${full ? 'text-rose-600' : 'text-slate-500'}`}>
                      {Number(s.capacity) > 0 ? `${s.enrolledCount || 0}/${s.capacity}` : '—'}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-xs font-semibold text-slate-700">
          Selected: {subjects.length} subject{subjects.length === 1 ? '' : 's'} · {totalUnits} units
        </p>
        <button
          type="button"
          disabled={busy || !!problem}
          onClick={async () => {
            setBusy(true);
            setResult(null);
            try {
              setResult(await submitRegistration(db, actorFor(app), app as any, { ...draft, programId: programs.find((p: any) => (p.name || p.title) === programName)?.id }, policy, offered as CatalogSubject[]));
            } catch (e: any) {
              setResult({ ok: false, message: e?.code === 'permission-denied' ? 'Your registration could not be saved (not allowed).' : 'Your registration could not be saved. Please try again.' });
            } finally {
              setBusy(false);
            }
          }}
          className="rounded-lg bg-[#18392B] px-5 py-2.5 text-xs font-bold text-white hover:bg-[#23533e] disabled:opacity-40"
        >
          {busy ? 'Submitting…' : 'Submit registration'}
        </button>
      </div>
      {problem && subjects.length > 0 && <p className="text-[11px] text-amber-800">{problem}</p>}
      <ResultNote result={result} />
    </section>
  );
};

// Read-only summary of a submitted registration.
export const RegistrationSummary: React.FC<{ registration: EnrollmentRegistration }> = ({ registration }) => (
  <section className="space-y-2 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
    <h4 className="font-serif text-base font-bold text-[#18392B]">Your registration</h4>
    <p className="text-xs text-slate-600">
      {registration.programName} · {registration.yearLevel} · {registration.semester}, AY {registration.academicYear}
    </p>
    <ul className="divide-y divide-slate-100 text-xs">
      {registration.subjects.map((s) => (
        <li key={s.subjectId || s.code} className="flex justify-between gap-2 py-1.5">
          <span>
            <span className="font-mono font-bold">{s.code}</span> {s.title}
            {s.schedule ? <span className="text-slate-400"> · {s.schedule}</span> : null}
          </span>
          <span className="font-mono">{s.units}</span>
        </li>
      ))}
    </ul>
    <p className="text-right text-xs font-bold">Total: {registration.totalUnits} units</p>
  </section>
);

// Step 2: corrections requested by the Admissions Office.
export const CorrectionForm: React.FC<{ app: App }> = ({ app }) => {
  const [values, setValues] = useState<Record<string, string>>(() =>
    Object.fromEntries(APPLICANT_CORRECTION_FIELDS.map((f) => [f.key, String(app[f.key] ?? '')]))
  );
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState<Result | null>(null);
  return (
    <section className="space-y-3 rounded-2xl border-2 border-amber-300 bg-amber-50/60 p-5 shadow-sm sm:p-6" data-testid="correction-form">
      <h4 className="font-serif text-lg font-bold text-[#18392B]">Correct your application</h4>
      {app.applicantMessage && (
        <p className="rounded-lg bg-white p-2 text-xs text-slate-800">
          <strong>What to correct:</strong> {app.applicantMessage}
        </p>
      )}
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        {APPLICANT_CORRECTION_FIELDS.map((f) => (
          <label key={f.key} className="block text-xs font-semibold text-slate-600">
            {f.label}
            <input
              type={f.key === 'dateOfBirth' ? 'date' : 'text'}
              value={values[f.key]}
              onChange={(e) => setValues((v) => ({ ...v, [f.key]: e.target.value }))}
              className="mt-1 w-full rounded-lg border border-slate-300 bg-white p-2 text-sm"
            />
          </label>
        ))}
      </div>
      <button
        type="button"
        disabled={busy}
        onClick={async () => {
          setBusy(true);
          setResult(null);
          try {
            setResult(await resubmitCorrections(db, actorFor(app), app as any, values));
          } catch {
            setResult({ ok: false, message: 'Your corrections could not be saved. Please try again.' });
          } finally {
            setBusy(false);
          }
        }}
        className="rounded-lg bg-[#18392B] px-5 py-2.5 text-xs font-bold text-white hover:bg-[#23533e] disabled:opacity-40"
      >
        {busy ? 'Sending…' : 'Send corrections for review'}
      </button>
      <ResultNote result={result} />
    </section>
  );
};

// The applicant may withdraw an open application.
export const WithdrawApplication: React.FC<{ app: App }> = ({ app }) => {
  const [open, setOpen] = useState(false);
  const [reason, setReason] = useState('');
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState<Result | null>(null);
  if (!isOpenApplication(app.status)) return null;
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-4 text-xs">
      {!open ? (
        <button type="button" onClick={() => setOpen(true)} className="inline-flex items-center gap-1.5 font-semibold text-slate-600 hover:text-rose-700">
          <Undo2 className="h-3.5 w-3.5" /> Withdraw this application
        </button>
      ) : (
        <div className="space-y-2">
          <p className="font-bold text-slate-800">Withdraw application {app.referenceNumber}?</p>
          <p className="text-slate-600">The Admissions Office will stop processing it. You can submit a new application later.</p>
          <textarea
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            rows={2}
            placeholder="Reason (required)"
            aria-label="Reason for withdrawing"
            className="w-full rounded-lg border border-slate-300 p-2"
          />
          <div className="flex gap-2">
            <button type="button" onClick={() => setOpen(false)} className="rounded-lg px-3 py-1.5 font-semibold text-slate-600 hover:bg-slate-100">
              Keep my application
            </button>
            <button
              type="button"
              disabled={busy || !reason.trim()}
              onClick={async () => {
                setBusy(true);
                try {
                  setResult(await withdrawApplication(db, actorFor(app), app as any, reason));
                } catch {
                  setResult({ ok: false, message: 'Could not withdraw. Please try again.' });
                } finally {
                  setBusy(false);
                }
              }}
              className="rounded-lg bg-rose-600 px-3 py-1.5 font-bold text-white hover:bg-rose-700 disabled:opacity-40"
            >
              {busy ? 'Withdrawing…' : 'Withdraw application'}
            </button>
          </div>
          <ResultNote result={result} />
        </div>
      )}
    </div>
  );
};

// Step 8: printable enrollment confirmation (built with DOM APIs; no HTML strings).
function printConfirmation(app: App, payments: ApplicationPayment[]) {
  const c = app.enrollmentConfirmation || {};
  const reg: EnrollmentRegistration | undefined = app.registration || undefined;
  const w = window.open('', '_blank', 'width=820,height=900');
  if (!w) return;
  const d = w.document;
  d.title = `Enrollment Confirmation ${c.studentId || ''}`;
  const style = d.createElement('style');
  style.textContent =
    'body{font-family:Georgia,serif;color:#18392B;padding:32px}h1{font-size:20px;margin:0}h2{font-size:14px;margin:18px 0 6px}table{width:100%;border-collapse:collapse;font:12px Arial}td,th{border:1px solid #ccc;padding:6px;text-align:left}p{font:12px Arial;margin:3px 0}.r{text-align:right}';
  d.head.appendChild(style);
  const add = (tag: string, text: string, parent: HTMLElement = d.body, cls?: string) => {
    const el = d.createElement(tag);
    el.textContent = text;
    if (cls) el.className = cls;
    parent.appendChild(el);
    return el;
  };
  add('h1', 'Philippine College of Ministry — Official Enrollment Confirmation');
  add('p', `Student: ${app.fullName}   ·   Student ID: ${c.studentId || app.studentId || ''}`);
  add('p', `Program: ${c.programName || reg?.programName || app.programName || ''}   ·   ${c.yearLevel || reg?.yearLevel || ''}`);
  add('p', `Term: ${c.semester || reg?.semester || ''}, Academic Year ${c.academicYear || reg?.academicYear || ''}`);
  add('p', `Application ${app.referenceNumber}   ·   Confirmed ${c.confirmedAt ? new Date(c.confirmedAt).toLocaleString() : ''} by ${c.confirmedBy || 'the Registrar'}`);
  if (reg?.subjects?.length) {
    add('h2', 'Registered subjects');
    const t = d.createElement('table');
    const head = d.createElement('tr');
    ['Code', 'Subject', 'Schedule', 'Units'].forEach((h) => add('th', h, head));
    t.appendChild(head);
    reg.subjects.forEach((s) => {
      const tr = d.createElement('tr');
      add('td', s.code, tr);
      add('td', s.title, tr);
      add('td', s.schedule || '', tr);
      add('td', String(s.units), tr, 'r');
      t.appendChild(tr);
    });
    const tot = d.createElement('tr');
    add('td', 'Total units', tot).setAttribute('colspan', '3');
    add('td', String(reg.totalUnits), tot, 'r');
    t.appendChild(tot);
    d.body.appendChild(t);
  }
  if (app.assessment) {
    add('h2', 'Assessment and payments');
    add('p', `Total assessment: ₱${Number(app.assessment.total).toLocaleString()}`);
    add('p', app.paymentStatus === 'Waived' ? `Payment: exempted (${app.paymentWaivedReason || 'authorized'})` : `Verified payments: ₱${verifiedPaymentTotal(payments).toLocaleString()}`);
  }
  add('p', 'This confirmation was generated from the PCM enrollment records.').style.marginTop = '24px';
  w.focus();
  w.print();
}

export const EnrollmentConfirmationCard: React.FC<{ app: App; payments: ApplicationPayment[] }> = ({ app, payments }) => {
  if (normalizeStatus(app.status) !== 'Enrolled') return null;
  const c = app.enrollmentConfirmation;
  return (
    <section className="space-y-2 rounded-2xl border-2 border-[#18392B] bg-emerald-50/60 p-5 shadow-sm" data-testid="enrollment-confirmation">
      <h4 className="flex items-center gap-2 font-serif text-lg font-bold text-[#18392B]">
        <CheckCircle2 className="h-5 w-5 text-emerald-600" /> Officially enrolled
      </h4>
      <p className="text-xs text-slate-700">
        Student ID <strong className="font-mono">{c?.studentId || app.studentId}</strong>
        {c ? ` · ${c.programName} · ${c.yearLevel} · ${c.semester}, AY ${c.academicYear} · ${c.subjectCount} subjects (${c.totalUnits} units)` : ''}
      </p>
      <button
        type="button"
        onClick={() => printConfirmation(app, payments)}
        className="inline-flex items-center gap-1.5 rounded-lg bg-[#18392B] px-4 py-2 text-xs font-bold text-white hover:bg-[#23533e]"
      >
        <Printer className="h-3.5 w-3.5" /> Print enrollment confirmation
      </button>
    </section>
  );
};
