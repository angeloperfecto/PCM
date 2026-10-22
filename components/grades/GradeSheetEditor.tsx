'use client';

import React, { useState } from 'react';
import { AlertTriangle, BookOpen, CheckCircle2, ChevronLeft, Clock, Download, Printer, Send, X } from 'lucide-react';
import { usePCM } from '@/lib/store';
import {
  downloadGradeSheetExcel,
  enteredCount,
  isOverdue,
  lookupGrade,
  requestGradeAmendment,
  saveGradeSheet,
  sheetIssues,
  sheetStageLabel,
  useGradeAmendments,
} from '@/lib/grades';
import { GradeSheetDocument } from '@/components/grades/GradeSheetDocument';
import { printDocument } from '@/components/enrollment/CertificateOfRegistration';
import type { AcademicPeriod, GradeEntry, GradeRosterStudent, GradeSheet, GradingScale } from '@/lib/types';

export const fmtGradeDate = (d?: string) => (d ? new Date(d.length === 10 ? `${d}T00:00:00` : d).toLocaleDateString('en-PH', { month: 'short', day: 'numeric', year: 'numeric' }) : '');
const fmtDate = fmtGradeDate;

export const GRADE_STAGE_STYLE: Record<string, string> = {
  'Not Started': 'bg-slate-100 text-slate-700',
  Draft: 'bg-amber-100 text-amber-900',
  Submitted: 'bg-sky-100 text-sky-900',
  'Under Review': 'bg-indigo-100 text-indigo-900',
  Approved: 'bg-emerald-100 text-emerald-900',
  'Returned for Correction': 'bg-rose-100 text-rose-800',
  Finalized: 'bg-emerald-700 text-white',
  'Finalized & Published': 'bg-emerald-700 text-white',
};
const STATUS_STYLE = GRADE_STAGE_STYLE;

// One grade sheet: enter, save as draft, submit; view after submission; request a change once finalized.
// staff: the Registrar entering grades on the professor's behalf (e.g. from a paper grade sheet).
export const GradeSheetEditor: React.FC<{
  sheet: GradeSheet;
  scale: GradingScale | null;
  period?: AcademicPeriod;
  onBack: () => void;
  backLabel?: string;
  staff?: { name: string };
}> = ({ sheet, scale, period, onBack, backLabel = 'My classes', staff }) => {
  const { firebaseAuthUser, addToast } = usePCM();
  const editable = ['Draft', 'Returned for Correction'].includes(sheet.status) && !!scale;
  const [grades, setGrades] = useState<Record<string, GradeEntry>>(() => ({ ...(sheet.grades || {}) }));
  const [note, setNote] = useState(sheet.facultyNote || '');
  const [busy, setBusy] = useState(false);
  const [confirming, setConfirming] = useState(false);
  const [certified, setCertified] = useState(false);
  const [amend, setAmend] = useState<GradeRosterStudent | null>(null);
  const [amendGrade, setAmendGrade] = useState('');
  const [amendReason, setAmendReason] = useState('');
  const myAmendments = useGradeAmendments({ requestedByUid: firebaseAuthUser?.uid });
  const sheetAmendments = myAmendments.filter((a) => a.sheetId === sheet.id);
  const user = staff
    ? { name: `${staff.name} (for ${sheet.instructorName})`, uid: firebaseAuthUser?.uid || '' }
    : { name: firebaseAuthUser?.displayName || firebaseAuthUser?.email || 'Professor', uid: firebaseAuthUser?.uid || '' };
  const dirty = JSON.stringify(grades) !== JSON.stringify(sheet.grades || {}) || note !== (sheet.facultyNote || '');
  const live = { roster: sheet.roster, grades };
  const issues = sheetIssues(live, scale);
  const blankWithoutNote = issues.missing.filter((id) => !String(grades[id]?.note || '').trim());
  const options = scale ? [...scale.values.map((v) => v.value), ...scale.specialCodes.map((c) => c.code)] : [];

  const set = (id: string, p: Partial<GradeEntry>) => setGrades((g) => ({ ...g, [id]: { ...(g[id] || { grade: '' }), ...p } }));

  const submitProblem = (): string => {
    if (issues.invalid.length) return `${issues.invalid.length} grade(s) are not on PCM's grading scale.`;
    if (issues.missing.length && !scale?.allowIncompleteSubmission) return `${issues.missing.length} student(s) have no grade. Enter a grade or a special code (such as INC) for every student.`;
    if (issues.missing.length && blankWithoutNote.length) return `Add a note explaining each blank grade (${blankWithoutNote.length} without a note).`;
    return '';
  };

  const save = async (submit: boolean) => {
    setBusy(true);
    try {
      await saveGradeSheet(sheet, grades, note, user, submit);
      addToast('success', submit ? 'Grades submitted' : 'Draft saved', submit ? `${sheet.subjectCode} was sent to the Registrar for review.` : 'Your grades are saved as a draft.');
      setConfirming(false);
      if (submit) onBack();
    } catch (e: any) {
      addToast('error', submit ? 'Not submitted' : 'Not saved', e?.code === 'permission-denied' ? 'You can only enter grades for your own classes while the sheet is open.' : e?.message || 'Please try again.');
    } finally {
      setBusy(false);
    }
  };

  const sendAmendment = async () => {
    if (!amend) return;
    if (!options.includes(amendGrade)) return addToast('warning', 'Choose a grade', 'Pick the corrected grade from the grading scale.');
    if (amendReason.trim().length < 5) return addToast('warning', 'Reason required', 'Explain why the grade must change.');
    setBusy(true);
    try {
      await requestGradeAmendment(sheet, amend, amendGrade, amendReason, user);
      addToast('success', 'Change requested', 'The Registrar will review your grade change request.');
      setAmend(null);
      setAmendGrade('');
      setAmendReason('');
    } catch (e: any) {
      addToast('error', 'Not sent', e?.code === 'permission-denied' ? 'You can request changes only for your own finalized classes.' : 'Please try again.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="space-y-4">
      <button type="button" onClick={onBack} className="inline-flex items-center gap-1 text-xs font-semibold text-[#18392B] hover:underline">
        <ChevronLeft className="h-4 w-4" /> {backLabel}
      </button>
      {staff && (
        <p className="rounded-xl border border-indigo-200 bg-indigo-50 p-3 text-xs text-indigo-950">
          You are entering grades on behalf of <strong>{sheet.instructorName}</strong>. They are saved to the professor&apos;s grade sheet and
          recorded as entered by {staff.name}.
        </p>
      )}
      <div className="space-y-4 rounded-2xl border border-slate-200 bg-white p-5 shadow-xs">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <h2 className="font-serif text-xl font-bold text-[#18392B]"><span className="font-mono">{sheet.subjectCode}</span> {sheet.subjectTitle}</h2>
            <p className="text-xs text-slate-600">
              {sheet.sectionName ? `${sheet.sectionName} • ` : ''}{sheet.semester}, AY {sheet.academicYear} • {sheet.roster.length} students • {sheet.units} units
            </p>
          </div>
          <div className="flex flex-wrap gap-2 text-xs">
            <span className={`self-center rounded-full px-2.5 py-0.5 text-[10px] font-bold ${STATUS_STYLE[sheetStageLabel(sheet)] || 'bg-slate-100'}`}>{sheetStageLabel(sheet)}</span>
            <button type="button" onClick={() => printDocument('pcm-grade-sheet-print', `Grade Sheet ${sheet.subjectCode}`)} className="inline-flex items-center gap-1 rounded-lg border border-slate-300 px-2.5 py-1.5 font-semibold hover:bg-slate-50">
              <Printer className="h-3.5 w-3.5" /> Print
            </button>
            <button type="button" onClick={() => void downloadGradeSheetExcel({ ...sheet, grades }, scale)} className="inline-flex items-center gap-1 rounded-lg border border-slate-300 px-2.5 py-1.5 font-semibold hover:bg-slate-50">
              <Download className="h-3.5 w-3.5" /> CSV
            </button>
          </div>
        </div>

        {sheet.status === 'Returned for Correction' && sheet.reviewRemarks && (
          <p className="flex gap-2 rounded-lg border border-rose-200 bg-rose-50 p-3 text-xs text-rose-900"><AlertTriangle className="h-4 w-4 shrink-0" /> Returned by {sheet.reviewedBy}: {sheet.reviewRemarks}</p>
        )}
        {!editable && sheet.status !== 'Finalized' && scale && (
          <p className="flex gap-2 rounded-lg border border-sky-200 bg-sky-50 p-3 text-xs text-sky-950"><Clock className="h-4 w-4 shrink-0" /> Submitted {fmtDate(sheet.submittedAt)}. The sheet is locked while the Registrar reviews it.</p>
        )}
        {sheet.status === 'Finalized' && (
          <p className="flex gap-2 rounded-lg border border-emerald-200 bg-emerald-50 p-3 text-xs text-emerald-950"><CheckCircle2 className="h-4 w-4 shrink-0" /> Finalized {fmtDate(sheet.finalizedAt)}. To correct a grade, use “Request change”{staff ? ' (in the review window)' : ''}.</p>
        )}
        {period?.gradeSubmissionDeadline && editable && (
          <p className={`text-xs ${isOverdue(period, sheet) ? 'font-bold text-rose-700' : 'text-slate-600'}`}>Grades due {fmtDate(period.gradeSubmissionDeadline)}{isOverdue(period, sheet) ? ' — overdue' : ''}.</p>
        )}

        <div className="overflow-x-auto">
          <table className="w-full min-w-[760px] text-left text-xs">
            <thead className="bg-[#18392B] text-[10px] uppercase text-white">
              <tr>
                <th className="p-2">#</th>
                <th className="p-2">Student ID</th>
                <th className="p-2">Name</th>
                <th className="p-2">Program / year</th>
                <th className="p-2">Grade</th>
                <th className="p-2">Equivalent</th>
                <th className="p-2">Remark</th>
                <th className="p-2">Note</th>
                {sheet.status === 'Finalized' && !staff && <th className="p-2" />}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {sheet.students.map((s, i) => {
                const g = grades[s.studentRecordId];
                const l = lookupGrade(scale, g?.grade);
                const pending = sheetAmendments.find((a) => a.studentRecordId === s.studentRecordId && a.status === 'Pending');
                return (
                  <tr key={s.studentRecordId} className={l.kind === 'invalid' ? 'bg-rose-50' : l.kind === 'blank' ? 'bg-amber-50/50' : ''}>
                    <td className="p-2 text-slate-500">{i + 1}</td>
                    <td className="p-2 font-mono">{s.studentId}</td>
                    <td className="p-2 font-semibold text-slate-900">{s.name}</td>
                    <td className="p-2 text-slate-600">{s.program}{s.yearLevel ? ` • ${s.yearLevel}` : ''}</td>
                    <td className="p-2">
                      {editable ? (
                        <select aria-label={`Grade for ${s.name}`} value={g?.grade || ''} onChange={(e) => set(s.studentRecordId, { grade: e.target.value })} className="w-24 rounded-lg border border-slate-300 bg-white p-1.5 font-mono">
                          <option value="">—</option>
                          {options.map((o) => (
                            <option key={o} value={o}>{o}</option>
                          ))}
                        </select>
                      ) : (
                        <span className="font-mono font-bold">{g?.grade || '—'}</span>
                      )}
                    </td>
                    <td className="p-2 text-slate-600">{l.equivalent || ''}</td>
                    <td className="p-2">{l.kind === 'blank' ? <span className="text-amber-800">No grade</span> : l.kind === 'invalid' ? <span className="text-rose-700">Not on the scale</span> : l.remark}</td>
                    <td className="p-2">
                      {editable ? (
                        <input aria-label={`Note for ${s.name}`} value={g?.note || ''} onChange={(e) => set(s.studentRecordId, { note: e.target.value })} placeholder={l.kind === 'blank' ? 'Why no grade?' : ''} className="w-40 rounded-lg border border-slate-300 p-1.5" />
                      ) : (
                        <span className="text-slate-600">{g?.note || ''}</span>
                      )}
                    </td>
                    {sheet.status === 'Finalized' && !staff && (
                      <td className="p-2 text-right">
                        {pending ? (
                          <span className="text-[11px] text-amber-800">Change to {pending.newGrade} pending</span>
                        ) : (
                          <button type="button" onClick={() => setAmend(s)} className="rounded-lg border border-slate-300 px-2 py-1 font-semibold hover:bg-slate-50">Request change</button>
                        )}
                      </td>
                    )}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {editable && (
          <>
            <label className="block space-y-1 text-xs">
              <span className="font-semibold">Note to the Registrar (optional)</span>
              <textarea rows={2} value={note} onChange={(e) => setNote(e.target.value)} className="w-full rounded-lg border border-slate-300 p-2" />
            </label>
            <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
              <span className="text-slate-600">
                {enteredCount(live)} of {sheet.roster.length} entered{issues.incomplete.length ? ` • ${issues.incomplete.length} incomplete` : ''}{issues.missing.length ? ` • ${issues.missing.length} missing` : ''}
                {dirty ? ' • unsaved changes' : ''}
              </span>
              <div className="flex gap-2">
                <button type="button" disabled={busy || !dirty} onClick={() => save(false)} className="rounded-lg border border-[#18392B] px-4 py-2 font-bold text-[#18392B] hover:bg-emerald-50 disabled:opacity-50">
                  Save draft
                </button>
                <button
                  type="button"
                  disabled={busy}
                  onClick={() => {
                    const problem = submitProblem();
                    if (problem) return addToast('warning', 'Cannot submit yet', problem);
                    setCertified(false);
                    setConfirming(true);
                  }}
                  className="inline-flex items-center gap-1 rounded-lg bg-emerald-700 px-4 py-2 font-bold text-white hover:bg-emerald-800 disabled:opacity-50"
                >
                  <Send className="h-3.5 w-3.5" /> Submit for review
                </button>
              </div>
            </div>
          </>
        )}
      </div>

      <div className="hidden"><GradeSheetDocument sheet={{ ...sheet, grades }} scale={scale} id="pcm-grade-sheet-print" /></div>

      {confirming && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4" role="dialog" aria-modal="true" aria-label="Confirm grade submission">
          <div className="w-full max-w-md space-y-3 rounded-2xl bg-white p-5 text-xs shadow-2xl">
            <h3 className="font-serif text-lg font-bold text-[#18392B]">Submit {sheet.subjectCode} grades?</h3>
            <p>
              {enteredCount(live)} of {sheet.roster.length} students have a grade
              {issues.incomplete.length ? `, ${issues.incomplete.length} with an incomplete code` : ''}
              {issues.missing.length ? `, ${issues.missing.length} blank (explained in notes)` : ''}. After submitting you cannot edit the sheet unless the Registrar returns it.
            </p>
            <label className="flex items-start gap-2 font-semibold">
              <input type="checkbox" className="mt-0.5" checked={certified} onChange={(e) => setCertified(e.target.checked)} /> I certify these grades are correct and final for this class.
            </label>
            <div className="flex justify-end gap-2">
              <button type="button" onClick={() => setConfirming(false)} className="rounded-lg px-3 py-2 font-semibold text-slate-600 hover:bg-slate-100">Cancel</button>
              <button type="button" disabled={!certified || busy} onClick={() => save(true)} className="rounded-lg bg-emerald-700 px-4 py-2 font-bold text-white hover:bg-emerald-800 disabled:opacity-50">
                {busy ? 'Submitting…' : 'Submit grades'}
              </button>
            </div>
          </div>
        </div>
      )}

      {amend && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4" role="dialog" aria-modal="true" aria-label="Request grade change">
          <div className="w-full max-w-md space-y-3 rounded-2xl bg-white p-5 text-xs shadow-2xl">
            <div className="flex items-start justify-between">
              <h3 className="font-serif text-lg font-bold text-[#18392B]">Request a grade change</h3>
              <button type="button" aria-label="Close" onClick={() => setAmend(null)} className="p-1 text-slate-400"><X className="h-4 w-4" /></button>
            </div>
            <p>{amend.name} ({amend.studentId}) • current grade <strong className="font-mono">{sheet.grades?.[amend.studentRecordId]?.grade || '—'}</strong></p>
            <label className="block space-y-1">
              <span className="font-semibold">Corrected grade</span>
              <select value={amendGrade} onChange={(e) => setAmendGrade(e.target.value)} className="w-32 rounded-lg border border-slate-300 p-1.5 font-mono">
                <option value="">—</option>
                {options.map((o) => <option key={o} value={o}>{o}</option>)}
              </select>
            </label>
            <label className="block space-y-1">
              <span className="font-semibold">Reason (kept in the audit trail)</span>
              <textarea rows={3} value={amendReason} onChange={(e) => setAmendReason(e.target.value)} className="w-full rounded-lg border border-slate-300 p-2" />
            </label>
            <div className="flex justify-end gap-2">
              <button type="button" onClick={() => setAmend(null)} className="rounded-lg px-3 py-2 font-semibold text-slate-600 hover:bg-slate-100">Cancel</button>
              <button type="button" disabled={busy} onClick={sendAmendment} className="rounded-lg bg-[#18392B] px-4 py-2 font-bold text-white hover:bg-[#588B76] disabled:opacity-50">Send request</button>
            </div>
          </div>
        </div>
      )}

      {sheetAmendments.length > 0 && (
        <div className="rounded-2xl border border-slate-200 bg-white p-4 text-xs shadow-xs">
          <p className="mb-2 flex items-center gap-1.5 font-bold text-[#18392B]"><BookOpen className="h-4 w-4" /> My grade change requests</p>
          <ul className="space-y-1">
            {sheetAmendments.map((a) => (
              <li key={a.id}>
                {a.studentName}: {a.previousGrade || '—'} → {a.newGrade} • <strong>{a.status}</strong>{a.decidedBy ? ` by ${a.decidedBy}` : ''}{a.decisionRemarks ? ` (${a.decisionRemarks})` : ''}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
};
