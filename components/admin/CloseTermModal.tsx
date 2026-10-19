'use client';

import React, { useMemo, useState } from 'react';
import { AlertTriangle, CheckCircle2, Lock, X } from 'lucide-react';
import { usePCM } from '@/lib/store';
import { planTermClose, reenrollmentRules, termKeyOf, termLabel } from '@/lib/reenrollment';
import {
  gradingScaleOf,
  termClassSections,
  sheetIssues,
  sheetStageLabel,
  subjectsWithoutSection,
  useGradeAmendments,
  useGradeSheets,
} from '@/lib/grades';
import type { AcademicPeriod } from '@/lib/types';

// Closing a term: preview what moves into each student's academic history, confirm, then
// activate the next term so returning students can re-enroll.
export const CloseTermModal: React.FC<{ period: AcademicPeriod; onClose: () => void }> = ({ period, onClose }) => {
  const { students, enrollments, academicPeriods, academicSubjects, enrollmentSystemConfig, classSections, closeAcademicTerm, setCurrentAcademicPeriod, updateAcademicPeriod, canManageTerms } = usePCM();
  const rules = reenrollmentRules(enrollmentSystemConfig);
  const label = termLabel(period.semester, period.academicYear);
  const [confirmed, setConfirmed] = useState(false);
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState<{ students: number; subjects: number; withoutGrade: number } | null>(null);
  const [nextId, setNextId] = useState('');
  const [openEnrollment, setOpenEnrollment] = useState(true);
  const [activated, setActivated] = useState('');
  const [useException, setUseException] = useState(false);
  const [exceptionReason, setExceptionReason] = useState('');

  // Grade checklist: every class's grades must be finalized and published before the term closes,
  // unless an exception is documented (the open items are kept with the term for follow-up).
  const termKeyForGrades = termKeyOf(period.semester, period.academicYear);
  const { sheets: termSheets, loaded: sheetsLoaded } = useGradeSheets({ termKey: termKeyForGrades });
  const termAmendments = useGradeAmendments({ termKey: termKeyForGrades });
  const gradeScale = gradingScaleOf(enrollmentSystemConfig);
  const termSections = termClassSections(period, classSections, academicSubjects, students);
  const gradeItems: string[] = [
    ...termSheets.filter((x) => !(x.status === 'Finalized' && x.publishedAt)).map((x) => `${x.subjectCode} ${x.sectionName} (${x.instructorName}): ${sheetStageLabel(x)}`),
    ...termSections.filter((x) => !termSheets.some((g) => g.sectionId === x.id)).map((x) => `${x.subjectCode} ${x.sectionName}: no grade sheet`),
    ...subjectsWithoutSection(students, period, termSections).map((x) => `${x.code}: ${x.students} student(s) with no class section or grade sheet`),
    ...termAmendments.filter((a) => a.status === 'Pending').map((a) => `Pending grade change: ${a.studentName}, ${a.subjectCode}`),
  ];
  const incompleteGrades = termSheets.flatMap((x) => {
    const i = sheetIssues(x, gradeScale);
    return [...i.missing, ...i.incomplete].map((id) => `${x.students.find((r) => r.studentRecordId === id)?.name || id} — ${x.subjectCode}: ${x.grades?.[id]?.grade || 'no grade'}`);
  });
  const gradeBlocked = gradeItems.length > 0 && (!useException || exceptionReason.trim().length < 10);

  const preview = useMemo(() => {
    if (rules.passingGrade == null) return null;
    const now = new Date().toISOString();
    const rows = students
      .map((s) => ({ s, plan: planTermClose(s, period, rules.passingGrade as number, '', now) }))
      .filter((x) => x.plan) as { s: (typeof students)[number]; plan: NonNullable<ReturnType<typeof planTermClose>> }[];
    const count = (st: string) => rows.reduce((t, r) => t + r.plan.entries.filter((e) => e.status === st).length, 0);
    return {
      rows,
      subjects: rows.reduce((t, r) => t + r.plan.entries.length, 0),
      passed: count('Passed'),
      failed: count('Failed'),
      incomplete: count('Incomplete'),
      withoutGrade: rows.reduce((t, r) => t + r.plan.withoutGrade, 0),
    };
  }, [students, period, rules.passingGrade]);

  const key = termKeyOf(period.semester, period.academicYear);
  const pendingForTerm = enrollments.filter(
    (e) => termKeyOf(e.semester, e.schoolYear) === key && !['Approved', 'Rejected', 'Not Eligible', 'Cancelled'].includes(String(e.status))
  ).length;
  const nextTerms = academicPeriods.filter((p) => p.id !== period.id && !p.closedAt && p.status !== 'Archived');

  const close = async () => {
    setBusy(true);
    try {
      const result = await closeAcademicTerm(
        period.id,
        gradeItems.length ? { reason: exceptionReason, unresolved: [...gradeItems, ...incompleteGrades.map((x) => `Incomplete grade: ${x}`)] } : undefined
      );
      if (result) {
        setDone(result);
        setNextId(nextTerms.find((p) => p.status === 'Upcoming')?.id || nextTerms[0]?.id || '');
      }
    } finally {
      setBusy(false);
    }
  };

  const activate = async () => {
    const next = academicPeriods.find((p) => p.id === nextId);
    if (!next) return;
    setBusy(true);
    try {
      if (!(await setCurrentAcademicPeriod(next.id))) return;
      if (openEnrollment && next.enrollmentStatus !== 'Open') {
        if (!next.enrollmentStartDate || !next.enrollmentEndDate) {
          setActivated(`${termLabel(next.semester, next.academicYear)} is now the active term. Set its enrollment dates (Edit term) to open re-enrollment.`);
          return;
        }
        await updateAcademicPeriod(next.id, { enrollmentStatus: 'Open' });
      }
      setActivated(
        `${termLabel(next.semester, next.academicYear)} is now the active term${openEnrollment ? ' and re-enrollment is open to eligible returning students' : ''}.`
      );
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 p-4" role="dialog" aria-modal="true" aria-label={`Close ${label}`}>
      <div className="w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-2xl bg-white shadow-2xl">
        <div className="flex items-start justify-between gap-3 bg-[#18392B] p-4 text-white">
          <div>
            <h4 className="flex items-center gap-2 font-serif text-lg font-bold"><Lock className="h-5 w-5" /> Close academic term</h4>
            <p className="text-xs text-slate-300">{label}</p>
          </div>
          <button type="button" onClick={onClose} aria-label="Close" className="rounded p-1 text-white/70 hover:text-white">
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="space-y-4 p-5 text-xs text-slate-700">
          {!done && (
            <>
              <p>
                Closing the term keeps every record. For each student enrolled in {label}, the term&apos;s subjects and final grades are added to their
                academic history (GPA and units earned are recalculated), the term is added to their enrollment history, and they become able to
                re-enroll. Payments and balances are not changed. The term is then archived and its enrollment, pre-enlistment and add/drop windows
                close.
              </p>

              {rules.passingGrade == null ? (
                <p className="flex gap-2 rounded-lg border border-rose-200 bg-rose-50 p-3 text-rose-900">
                  <AlertTriangle className="h-4 w-4 shrink-0" /> Set the highest passing grade first: Enrollment &amp; Records → System Governance →
                  Re-enrollment &amp; Term Closing.
                </p>
              ) : (
                preview && (
                  <>
                    <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                      {[
                        ['Students', preview.rows.length],
                        ['Subjects recorded', preview.subjects],
                        ['Passed / Failed', `${preview.passed} / ${preview.failed}`],
                        ['Incomplete', preview.incomplete],
                      ].map(([k, v]) => (
                        <div key={String(k)} className="rounded-xl border border-slate-200 bg-slate-50 p-3">
                          <span className="block text-[10px] font-bold uppercase text-slate-500">{k}</span>
                          <strong className="font-mono text-base text-[#18392B]">{v}</strong>
                        </div>
                      ))}
                    </div>
                    <p className="text-[11px] text-slate-500">
                      Passing grade: {rules.passingGrade.toFixed(2)} or better. Subjects already in a student&apos;s history for this term are not added again.
                    </p>
                    {preview.withoutGrade > 0 && (
                      <div className="rounded-lg border border-amber-200 bg-amber-50 p-3 text-amber-950">
                        <p className="flex items-center gap-1.5 font-bold">
                          <AlertTriangle className="h-4 w-4" /> {preview.withoutGrade} subject{preview.withoutGrade === 1 ? ' has' : 's have'} no final grade
                        </p>
                        <p>They will be recorded as Incomplete. You can encode grades first, or update them later in the student&apos;s academic records.</p>
                        <ul className="mt-1 max-h-28 list-disc overflow-y-auto pl-5">
                          {preview.rows
                            .filter((r) => r.plan.withoutGrade > 0)
                            .slice(0, 30)
                            .map((r) => (
                              <li key={r.s.id}>
                                {r.s.fullName || r.s.name} ({r.s.studentId}):{' '}
                                {r.plan.entries.filter((e) => e.status === 'Incomplete' && !String(e.grade)).map((e) => e.code).join(', ')}
                              </li>
                            ))}
                        </ul>
                      </div>
                    )}
                    {pendingForTerm > 0 && (
                      <p className="rounded-lg border border-slate-200 bg-slate-50 p-3">
                        {pendingForTerm} enrollment request{pendingForTerm === 1 ? ' is' : 's are'} still pending for this term. They stay in the Enrollment
                        Queue for you to approve or decline.
                      </p>
                    )}
                    <div className={`space-y-2 rounded-xl border p-3 ${gradeItems.length ? 'border-rose-200 bg-rose-50' : 'border-emerald-200 bg-emerald-50'}`} data-testid="grade-checklist">
                      <p className="font-bold text-slate-900">Grade checklist</p>
                      {!sheetsLoaded ? (
                        <p>Checking grade sheets…</p>
                      ) : gradeItems.length === 0 ? (
                        <p className="text-emerald-900">All {termSheets.length} grade sheet{termSheets.length === 1 ? ' is' : 's are'} finalized and published.</p>
                      ) : (
                        <>
                          <p className="text-rose-900">Not finished — closing now would leave these grades unofficial:</p>
                          <ul className="max-h-32 list-disc overflow-y-auto pl-5 text-rose-900">
                            {gradeItems.map((x) => <li key={x}>{x}</li>)}
                          </ul>
                          <label className="flex items-start gap-2 font-semibold text-slate-800">
                            <input type="checkbox" className="mt-0.5" checked={useException} onChange={(e) => setUseException(e.target.checked)} />
                            Close anyway under a documented exception (the open items are kept with the term for follow-up)
                          </label>
                          {useException && (
                            <textarea
                              rows={2}
                              value={exceptionReason}
                              onChange={(e) => setExceptionReason(e.target.value)}
                              placeholder="Authorization and reason (e.g. approved by the Academic Dean on …)"
                              aria-label="Exception authorization"
                              className="w-full rounded-lg border border-rose-300 p-2"
                            />
                          )}
                        </>
                      )}
                      {incompleteGrades.length > 0 && (
                        <p className="text-slate-700">Incomplete grades to follow up ({incompleteGrades.length}): {incompleteGrades.slice(0, 6).join('; ')}{incompleteGrades.length > 6 ? '…' : ''}</p>
                      )}
                    </div>
                    <label className="flex items-start gap-2 font-semibold text-slate-800">
                      <input type="checkbox" checked={confirmed} onChange={(e) => setConfirmed(e.target.checked)} className="mt-0.5" />
                      I have reviewed this and want to close {label}. This cannot be undone.
                    </label>
                  </>
                )
              )}
            </>
          )}

          {done && (
            <div className="space-y-4">
              <p className="flex gap-2 rounded-lg border border-emerald-200 bg-emerald-50 p-3 text-emerald-950">
                <CheckCircle2 className="h-4 w-4 shrink-0" />
                {label} is closed: {done.students} student record{done.students === 1 ? '' : 's'} updated, {done.subjects} subject
                {done.subjects === 1 ? '' : 's'} recorded in academic history{done.withoutGrade ? ` (${done.withoutGrade} without a final grade)` : ''}.
              </p>
              <div className="space-y-2 rounded-xl border border-slate-200 p-3">
                <p className="font-bold text-[#18392B]">Activate the next term</p>
                {nextTerms.length === 0 ? (
                  <p>No other term is set up. Add the next term in Academic Terms, then set it as the active term.</p>
                ) : (
                  <>
                    <select value={nextId} onChange={(e) => setNextId(e.target.value)} className="w-full rounded-lg border border-slate-300 p-2 sm:w-80" aria-label="Next term">
                      {nextTerms.map((p) => (
                        <option key={p.id} value={p.id}>
                          {termLabel(p.semester, p.academicYear)} ({p.status})
                        </option>
                      ))}
                    </select>
                    <label className="flex items-center gap-2">
                      <input type="checkbox" checked={openEnrollment} onChange={(e) => setOpenEnrollment(e.target.checked)} /> Open re-enrollment for returning
                      students
                    </label>
                    <button type="button" onClick={activate} disabled={busy || !nextId || !!activated} className="rounded-lg bg-[#18392B] px-4 py-2 font-bold text-white hover:bg-[#588B76] disabled:opacity-50">
                      Activate term
                    </button>
                  </>
                )}
                {activated && <p className="rounded-lg bg-emerald-50 p-2 text-emerald-950">{activated}</p>}
              </div>
            </div>
          )}
        </div>

        <div className="flex justify-end gap-2 border-t border-slate-200 bg-slate-50 p-4">
          <button type="button" onClick={onClose} className="rounded-lg px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-200">
            {done ? 'Done' : 'Cancel'}
          </button>
          {!done && (
            <button
              type="button"
              onClick={close}
              disabled={!canManageTerms || !confirmed || busy || rules.passingGrade == null || !sheetsLoaded || gradeBlocked}
              title={canManageTerms ? undefined : 'Only the Registrar or an Administrator can close a term'}
              className="rounded-lg bg-rose-700 px-4 py-2 text-xs font-bold text-white hover:bg-rose-800 disabled:opacity-50"
            >
              {busy ? 'Closing…' : 'Close term'}
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
