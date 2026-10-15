'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { AlertCircle, CheckCircle2, ChevronLeft, ChevronRight, Edit3, Info, X } from 'lucide-react';
import { usePCM } from '@/lib/store';
import { programForStudent, subjectsForProgram } from '@/lib/curriculum';
import { termFees } from '@/lib/studentLedger';
import {
  offeredSubjects,
  openEnrollmentTerm,
  reenrollmentEligibility,
  reenrollmentRules,
  semesterKind,
  suggestYearLevel,
  termLabel,
  yearLevelChoices,
  type OfferedSubject,
} from '@/lib/reenrollment';
import { PaymentInstructions } from '@/components/enrollment/PaymentInstructions';
import { EditStudentInfoForm } from './EditStudentInfoForm';
import type { SelectedSubject } from '@/lib/types';

const peso = (n: number) => `₱${(Number(n) || 0).toLocaleString('en-PH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
const fmtDate = (d?: string) => (d ? new Date(`${d}T00:00:00`).toLocaleDateString('en-PH', { month: 'long', day: 'numeric', year: 'numeric' }) : '');

const STEPS = ['Your information', 'Year level & subjects', 'Requirements & fees', 'Review & submit'];

// Re-enrollment for returning students: same student record and Student ID, the next open term,
// the suggested year level and the subjects of their program's curriculum.
export const ReEnrollmentWizard: React.FC<{ onClose: () => void; onSubmitted?: () => void }> = ({ onClose, onSubmitted }) => {
  const {
    studentProfile,
    academicPeriods,
    enrollments,
    enrollmentSystemConfig,
    curriculumSubjects,
    programs,
    academicSubjects,
    feeStructure,
    submitReenrollment,
  } = usePCM();
  const term = openEnrollmentTerm(academicPeriods);
  const eligibility = reenrollmentEligibility(studentProfile, term, enrollments);
  const rules = reenrollmentRules(enrollmentSystemConfig);
  const program = programForStudent(programs, studentProfile);
  const programSubjects = useMemo(() => subjectsForProgram(curriculumSubjects, program), [curriculumSubjects, program]);
  const suggestion = useMemo(
    () => suggestYearLevel(studentProfile, programSubjects, term?.semester || '', rules),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [studentProfile, programSubjects, term?.semester, rules.progressionMinPercent]
  );

  const [step, setStep] = useState(0);
  const [editingInfo, setEditingInfo] = useState(false);
  const [confirmedInfo, setConfirmedInfo] = useState(false);
  const [yearLevel, setYearLevel] = useState(suggestion.yearLevel);
  const [selected, setSelected] = useState<SelectedSubject[]>([]);
  // The suggestion can change once the curriculum and record finish loading.
  useEffect(() => {
    setYearLevel(suggestion.yearLevel);
    setSelected([]);
  }, [suggestion.yearLevel]);
  const [notes, setNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  // Subjects: the program's curriculum when it is set up, otherwise the term's course offerings.
  const fromCurriculum = programSubjects.some((s) => s.status !== 'Inactive');
  const offered: OfferedSubject[] = useMemo(() => {
    if (!term) return [];
    if (fromCurriculum) return offeredSubjects(programSubjects, academicSubjects, yearLevel, term.semester, studentProfile);
    const kind = semesterKind(term.semester);
    return (academicSubjects || [])
      .filter((c) => !c.isArchived && c.status !== 'Closed' && (!c.semester || semesterKind(c.semester) === kind))
      .map((c) => ({
        id: c.id,
        code: c.code,
        title: c.title,
        units: Number(c.units) || 0,
        schedule: c.schedule || 'TBA',
        room: c.room || 'TBA',
        instructor: c.instructor || 'TBA',
        yearLevel: '',
        backSubject: false,
        prerequisitesMet: true,
      }));
  }, [term, fromCurriculum, programSubjects, academicSubjects, yearLevel, studentProfile]);

  const units = selected.reduce((t, s) => t + (Number(s.units) || 0), 0);
  const fees = termFees(units, feeStructure || [], enrollmentSystemConfig);
  const maxUnits = Number(enrollmentSystemConfig?.maxUnitsAllowed) || 0;
  const minUnits = Number(enrollmentSystemConfig?.minUnitsAllowed) || 0;
  const enforcePrereq = !!enrollmentSystemConfig?.enforcePrerequisites;
  const requiredDocs = rules.documents.filter((d) => d.required);
  const flags = [
    ...eligibility.flags,
    ...(suggestion.needsReview ? [suggestion.reason] : []),
    ...(yearLevel !== suggestion.yearLevel ? [`Requested ${yearLevel}; suggested ${suggestion.yearLevel}.`] : []),
    // An underload is allowed but needs the Registrar's approval (e.g. only a few subjects remain).
    ...(minUnits && units > 0 && units < minUnits ? [`Underload: ${units} units (minimum load is ${minUnits}).`] : []),
    ...selected.filter((s) => (s as OfferedSubject).backSubject).map((s) => `Back subject: ${s.code}.`),
    ...selected.filter((s) => (s as OfferedSubject).prerequisitesMet === false).map((s) => `Prerequisite not yet passed for ${s.code}.`),
  ];

  const toggle = (s: OfferedSubject) => {
    setError('');
    setSelected((cur) =>
      cur.some((x) => x.code === s.code)
        ? cur.filter((x) => x.code !== s.code)
        : [...cur, { id: s.id, code: s.code, title: s.title, units: s.units, schedule: s.schedule, room: s.room, instructor: s.instructor, yearLevel: s.yearLevel, backSubject: s.backSubject, prerequisitesMet: s.prerequisitesMet } as SelectedSubject]
    );
  };

  const stepProblem = (i: number): string => {
    if (i === 0 && !confirmedInfo) return 'Please confirm that your information is up to date (or update it first).';
    if (i === 1) {
      if (selected.length === 0) return 'Select at least one subject.';
      if (maxUnits && units > maxUnits) return `You selected ${units} units; the maximum load is ${maxUnits} units.`;
      if (enforcePrereq) {
        const blocked = selected.filter((s) => (s as OfferedSubject).prerequisitesMet === false);
        if (blocked.length) return `Prerequisites are not yet passed for: ${blocked.map((s) => s.code).join(', ')}.`;
      }
    }
    return '';
  };

  const next = () => {
    const p = stepProblem(step);
    setError(p);
    if (!p) setStep((s) => Math.min(STEPS.length - 1, s + 1));
  };

  const submit = async () => {
    if (!term) return;
    setSubmitting(true);
    setError('');
    try {
      const saved = await submitReenrollment({
        term,
        yearLevel,
        suggestedYearLevel: suggestion.yearLevel,
        subjects: selected.map(({ id, code, title, units: u, schedule, room, instructor }) => ({ id, code, title, units: u, schedule, room, instructor })),
        flags,
        notes: notes.trim(),
      });
      if (saved) {
        onSubmitted?.();
        onClose();
      }
    } finally {
      setSubmitting(false);
    }
  };

  const shell = (body: React.ReactNode, footer?: React.ReactNode) => (
    <div className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-black/70 p-4 backdrop-blur-xs" role="dialog" aria-modal="true" aria-label="Re-enrollment">
      <div className="w-full max-w-3xl max-h-[92vh] overflow-y-auto rounded-2xl border border-slate-200 bg-white shadow-2xl">
        <div className="sticky top-0 z-10 flex items-start justify-between gap-3 border-b border-slate-200 bg-white p-5">
          <div>
            <span className="block text-[10px] font-mono font-bold uppercase text-[#588B76]">
              Re-enrollment{term ? ` • ${termLabel(term.semester, term.academicYear)}` : ''}
            </span>
            <h3 className="font-serif text-xl font-bold text-[#18392B]">{eligibility.state === 'Eligible' ? `${step + 1}. ${STEPS[step]}` : 'Enroll for the next term'}</h3>
          </div>
          <button type="button" onClick={onClose} aria-label="Close" className="rounded-lg p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600">
            <X className="h-5 w-5" />
          </button>
        </div>
        {eligibility.state === 'Eligible' && (
          <ol className="flex gap-1 px-5 pt-4" aria-label="Steps">
            {STEPS.map((s, i) => (
              <li key={s} className={`h-1.5 flex-1 rounded-full ${i <= step ? 'bg-[#588B76]' : 'bg-slate-200'}`} title={s} />
            ))}
          </ol>
        )}
        <div className="space-y-4 p-5 text-xs text-slate-700">{body}</div>
        {footer && <div className="sticky bottom-0 flex flex-wrap items-center justify-between gap-2 border-t border-slate-200 bg-slate-50 p-4">{footer}</div>}
      </div>
    </div>
  );

  // Not able to start a request.
  if (eligibility.state !== 'Eligible') {
    const msg =
      eligibility.state === 'No Open Term'
        ? 'Enrollment for the next term is not open yet. You will be able to re-enroll here once the Registrar opens it.'
        : eligibility.state === 'Enrolled'
          ? `You are already enrolled for ${term ? termLabel(term.semester, term.academicYear) : 'this term'}.`
          : eligibility.state === 'Applied'
            ? `You already have an enrollment request for this term (${eligibility.request?.referenceNumber}). Follow its status on the Enrollment page.`
            : 'You cannot re-enroll for this term yet:';
    return shell(
      <div className={`rounded-xl border p-4 ${eligibility.state === 'Not Eligible' ? 'border-rose-200 bg-rose-50 text-rose-900' : 'border-slate-200 bg-slate-50'}`}>
        <p className="font-semibold">{msg}</p>
        {eligibility.blockers.length > 0 && (
          <ul className="mt-2 list-disc space-y-1 pl-5">
            {eligibility.blockers.map((b) => (
              <li key={b}>{b}</li>
            ))}
          </ul>
        )}
        {eligibility.state === 'Not Eligible' && <p className="mt-2">Please contact the Office of the Registrar.</p>}
      </div>,
      <button type="button" onClick={onClose} className="ml-auto rounded-lg bg-[#18392B] px-4 py-2 font-bold text-white hover:bg-[#588B76]">
        Close
      </button>
    );
  }

  const body = (
    <>
      {term?.announcement && (
        <p className="flex gap-2 rounded-xl border border-sky-200 bg-sky-50 p-3 text-sky-900">
          <Info className="h-4 w-4 shrink-0" /> {term.announcement}
        </p>
      )}

      {step === 0 &&
        (editingInfo ? (
          <EditStudentInfoForm onClose={() => setEditingInfo(false)} />
        ) : (
          <div className="space-y-3">
            <p>
              You are re-enrolling with your existing record. Your Student ID and academic history stay the same. Check your information; update it
              if anything has changed.
            </p>
            <dl className="grid grid-cols-1 gap-2 rounded-xl border border-slate-200 bg-slate-50 p-3 sm:grid-cols-2">
              {[
                ['Student ID', studentProfile.studentId],
                ['Name', studentProfile.fullName || studentProfile.name],
                ['Program', studentProfile.degreeProgram || studentProfile.program],
                ['Current year level', studentProfile.yearLevel],
                ['Email', studentProfile.email],
                ['Mobile', studentProfile.mobileNumber || studentProfile.phone],
                ['Address', studentProfile.address],
                ['Last enrolled term', studentProfile.lastEnrolledTerm || studentProfile.currentSemester],
              ].map(([k, v]) => (
                <div key={k}>
                  <dt className="text-[10px] font-bold uppercase tracking-wider text-slate-500">{k}</dt>
                  <dd className="font-semibold text-slate-900">{v || '—'}</dd>
                </div>
              ))}
            </dl>
            <div className="flex flex-wrap items-center gap-3">
              <button type="button" onClick={() => setEditingInfo(true)} className="inline-flex items-center gap-1.5 rounded-lg border border-[#588B76] px-3 py-1.5 font-semibold text-[#18392B] hover:bg-emerald-50">
                <Edit3 className="h-3.5 w-3.5" /> Update my information
              </button>
              <label className="flex items-center gap-2 font-semibold text-slate-800">
                <input type="checkbox" checked={confirmedInfo} onChange={(e) => setConfirmedInfo(e.target.checked)} /> My information is up to date
              </label>
            </div>
            {eligibility.flags.length > 0 && (
              <div className="rounded-xl border border-amber-200 bg-amber-50 p-3 text-amber-950">
                <p className="font-bold">The Registrar will check:</p>
                <ul className="mt-1 list-disc space-y-0.5 pl-5">
                  {eligibility.flags.map((f) => (
                    <li key={f}>{f}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        ))}

      {step === 1 && (
        <div className="space-y-3">
          <div className="rounded-xl border border-slate-200 p-3 space-y-2">
            <label className="block font-bold text-slate-800" htmlFor="reenroll-year-level">
              Year level for {term ? termLabel(term.semester, term.academicYear) : 'the term'}
            </label>
            <select
              id="reenroll-year-level"
              value={yearLevel}
              onChange={(e) => {
                setYearLevel(e.target.value);
                setSelected([]);
              }}
              className="w-full rounded-lg border border-slate-300 bg-white p-2 sm:w-64"
            >
              {yearLevelChoices(suggestion).map((y) => (
                <option key={y} value={y}>
                  {y}
                  {y === suggestion.yearLevel ? ' (suggested)' : ''}
                </option>
              ))}
            </select>
            <p className={`text-[11px] ${suggestion.needsReview ? 'text-amber-800' : 'text-slate-500'}`}>{suggestion.reason}</p>
          </div>

          <div className="flex flex-wrap items-center justify-between gap-2">
            <span className="font-semibold text-slate-700">
              {fromCurriculum ? `Subjects of your curriculum for ${term?.semester} (not yet passed)` : `Subjects offered for ${term?.semester}`}
            </span>
            <span className="font-mono font-bold text-[#18392B]">
              {selected.length} selected • {units} units{minUnits || maxUnits ? ` (load ${minUnits || 0}–${maxUnits || 'any'})` : ''}
            </span>
          </div>
          {offered.length === 0 ? (
            <p className="rounded-lg border border-amber-200 bg-amber-50 p-3 text-amber-900">
              No subjects are available for {yearLevel} in {term?.semester}. Please check with the Registrar.
            </p>
          ) : (
            <ul className="max-h-80 space-y-2 overflow-y-auto pr-1">
              {offered.map((s) => {
                const on = selected.some((x) => x.code === s.code);
                const blocked = enforcePrereq && !s.prerequisitesMet;
                return (
                  <li key={s.code}>
                    <label
                      className={`flex cursor-pointer items-start gap-3 rounded-xl border p-3 transition ${on ? 'border-emerald-300 bg-emerald-50/70' : 'border-slate-200 bg-white hover:border-[#588B76]'} ${blocked ? 'cursor-not-allowed opacity-60' : ''}`}
                    >
                      <input type="checkbox" checked={on} disabled={blocked && !on} onChange={() => toggle(s)} className="mt-0.5" />
                      <span className="min-w-0 flex-1">
                        <span className="flex flex-wrap items-center gap-1.5">
                          <strong className="font-mono text-[#18392B]">{s.code}</strong>
                          <span className="font-semibold text-slate-900">{s.title}</span>
                          {s.backSubject && <span className="rounded bg-amber-100 px-1.5 py-0.5 text-[10px] font-bold text-amber-900">Back subject • {s.yearLevel}</span>}
                          {!s.prerequisitesMet && <span className="rounded bg-rose-100 px-1.5 py-0.5 text-[10px] font-bold text-rose-800">Prerequisite: {s.prerequisites}</span>}
                        </span>
                        <span className="block text-[11px] text-slate-500">
                          {s.schedule} • {s.room} • {s.instructor}
                        </span>
                      </span>
                      <span className="shrink-0 font-mono font-bold">{s.units} u</span>
                    </label>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      )}

      {step === 2 && (
        <div className="space-y-3">
          <div className="rounded-xl border border-slate-200 p-3 space-y-2">
            <p className="font-bold text-[#18392B]">Requirements for this term</p>
            <ul className="space-y-1.5">
              {rules.requireAcademicClearance && (
                <li className="flex gap-2"><CheckCircle2 className="h-4 w-4 shrink-0 text-slate-400" /> Academic clearance — verified by the Registrar.</li>
              )}
              {rules.requireFinancialClearance && (
                <li className="flex gap-2">
                  <CheckCircle2 className="h-4 w-4 shrink-0 text-slate-400" /> Financial clearance — verified by the Finance Office
                  {Number(studentProfile.tuitionBalance) > 0 ? ` (current balance ${peso(Number(studentProfile.tuitionBalance))})` : ''}.
                </li>
              )}
              {rules.documents.map((d) => (
                <li key={d.id} className="flex gap-2">
                  <CheckCircle2 className="h-4 w-4 shrink-0 text-slate-400" /> {d.name}
                  {d.required ? '' : ' (optional)'} — you upload this after submitting.{d.description ? ` ${d.description}` : ''}
                </li>
              ))}
              {!rules.requireAcademicClearance && !rules.requireFinancialClearance && rules.documents.length === 0 && (
                <li>No clearances or documents are required for this term.</li>
              )}
            </ul>
          </div>
          <div className="rounded-xl border border-slate-200 p-3">
            <p className="font-bold text-[#18392B]">Estimated assessment ({units} units)</p>
            <table className="mt-1 w-full">
              <tbody>
                {fees.lines.map((l) => (
                  <tr key={l.name} className="border-b border-slate-100">
                    <td className="py-1">{l.name}</td>
                    <td className="py-1 text-right font-mono">{peso(l.amount)}</td>
                  </tr>
                ))}
                <tr>
                  <td className="py-1 font-bold">Total</td>
                  <td className="py-1 text-right font-mono font-bold">{peso(fees.total)}</td>
                </tr>
              </tbody>
            </table>
            <p className="mt-1 text-[11px] text-slate-500">The Registrar issues the official assessment when your enrollment is approved.</p>
          </div>
          <PaymentInstructions compact />
          <label className="block space-y-1">
            <span className="font-semibold">Notes for the Registrar (optional)</span>
            <textarea rows={2} value={notes} onChange={(e) => setNotes(e.target.value)} className="w-full rounded-lg border border-slate-300 p-2" />
          </label>
        </div>
      )}

      {step === 3 && (
        <div className="space-y-3">
          <dl className="grid grid-cols-1 gap-2 rounded-xl border border-slate-200 bg-slate-50 p-3 sm:grid-cols-2">
            <div><dt className="text-[10px] font-bold uppercase text-slate-500">Term</dt><dd className="font-semibold">{term ? termLabel(term.semester, term.academicYear) : ''}</dd></div>
            <div><dt className="text-[10px] font-bold uppercase text-slate-500">Year level</dt><dd className="font-semibold">{yearLevel}</dd></div>
            <div><dt className="text-[10px] font-bold uppercase text-slate-500">Subjects</dt><dd className="font-semibold">{selected.length} subjects, {units} units</dd></div>
            <div><dt className="text-[10px] font-bold uppercase text-slate-500">Estimated assessment</dt><dd className="font-semibold">{peso(fees.total)}</dd></div>
          </dl>
          <ul className="divide-y divide-slate-100 rounded-xl border border-slate-200">
            {selected.map((s) => (
              <li key={s.code} className="flex justify-between gap-2 p-2">
                <span><strong className="font-mono">{s.code}</strong> {s.title}</span>
                <span className="font-mono">{s.units} u</span>
              </li>
            ))}
          </ul>
          {flags.length > 0 && (
            <div className="rounded-xl border border-amber-200 bg-amber-50 p-3 text-amber-950">
              <p className="font-bold">Sent to the Registrar for review:</p>
              <ul className="mt-1 list-disc space-y-0.5 pl-5">
                {flags.map((f) => (
                  <li key={f}>{f}</li>
                ))}
              </ul>
            </div>
          )}
          <p className="text-[11px] text-slate-500">
            {requiredDocs.length
              ? `After submitting, upload ${requiredDocs.length === 1 ? 'the required document' : `the ${requiredDocs.length} required documents`} on the Enrollment page. Your status will be "Pending Requirements" until then.`
              : 'After submitting, your request goes to the Registrar for verification.'}{' '}
            You are officially enrolled only after the Registrar approves.
          </p>
        </div>
      )}

      {error && (
        <p role="alert" className="flex gap-2 rounded-lg border border-rose-200 bg-rose-50 p-2 text-rose-800">
          <AlertCircle className="h-4 w-4 shrink-0" /> {error}
        </p>
      )}
      {term?.enrollmentEndDate && <p className="text-[11px] text-slate-500">Enrollment for this term closes on {fmtDate(term.enrollmentEndDate)}.</p>}
    </>
  );

  return shell(
    body,
    <>
      <button
        type="button"
        onClick={() => (step === 0 ? onClose() : setStep((s) => s - 1))}
        className="inline-flex items-center gap-1 rounded-lg px-3 py-2 font-semibold text-slate-600 hover:bg-slate-200"
      >
        <ChevronLeft className="h-4 w-4" /> {step === 0 ? 'Cancel' : 'Back'}
      </button>
      {step < STEPS.length - 1 ? (
        <button
          type="button"
          onClick={next}
          disabled={step === 0 && editingInfo}
          className="inline-flex items-center gap-1 rounded-lg bg-[#18392B] px-4 py-2 font-bold text-white hover:bg-[#588B76] disabled:opacity-50"
        >
          Next <ChevronRight className="h-4 w-4" />
        </button>
      ) : (
        <button type="button" onClick={submit} disabled={submitting} className="rounded-lg bg-emerald-700 px-4 py-2 font-bold text-white hover:bg-emerald-800 disabled:opacity-50">
          {submitting ? 'Submitting…' : 'Submit re-enrollment'}
        </button>
      )}
    </>
  );
};
