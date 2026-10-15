'use client';

import React, { useMemo, useState } from 'react';
import { AlertTriangle, Bell, BookOpen, CheckCircle2, ChevronLeft, Clock, Download, FileEdit, LogIn, LogOut, Printer, Send, X } from 'lucide-react';
import { usePCM } from '@/lib/store';
import {
  downloadText,
  gradesCsv,
  gradingScaleOf,
  isOverdue,
  lookupGrade,
  normEmail,
  requestGradeAmendment,
  saveGradeSheet,
  sheetIssues,
  sheetStageLabel,
  enteredCount,
  useGradeAmendments,
  useGradeSheets,
} from '@/lib/grades';
import { termKeyOf, termLabel } from '@/lib/reenrollment';
import { GradeSheetDocument } from '@/components/grades/GradeSheetDocument';
import { printDocument } from '@/components/enrollment/CertificateOfRegistration';
import type { AcademicPeriod, GradeEntry, GradeRosterStudent, GradeSheet, GradingScale } from '@/lib/types';

const fmtDate = (d?: string) => (d ? new Date(d.length === 10 ? `${d}T00:00:00` : d).toLocaleDateString('en-PH', { month: 'short', day: 'numeric', year: 'numeric' }) : '');

const STATUS_STYLE: Record<string, string> = {
  'Not Started': 'bg-slate-100 text-slate-700',
  Draft: 'bg-amber-100 text-amber-900',
  Submitted: 'bg-sky-100 text-sky-900',
  'Under Review': 'bg-indigo-100 text-indigo-900',
  Approved: 'bg-emerald-100 text-emerald-900',
  'Returned for Correction': 'bg-rose-100 text-rose-800',
  Finalized: 'bg-emerald-700 text-white',
  'Finalized & Published': 'bg-emerald-700 text-white',
};

// Faculty Portal: a professor's assigned classes for each term and their grade sheets.
// Access is by the professor's verified PCM Google email, matched to Faculty Load.
export const FacultyPortalView: React.FC = () => {
  const { firebaseAuthUser, signInWithGoogle, signOutUser, instructors, academicPeriods, enrollmentSystemConfig, studentNotifications, markNotificationRead } = usePCM();
  const email = firebaseAuthUser?.emailVerified ? normEmail(firebaseAuthUser.email || '') : '';
  const instructor = email ? instructors.find((i) => normEmail(i.email) === email) : undefined;
  const { sheets, loaded, error } = useGradeSheets({ instructorEmail: instructor ? email : undefined });
  const scale = gradingScaleOf(enrollmentSystemConfig);
  const [openId, setOpenId] = useState<string | null>(null);
  const open = sheets.find((s) => s.id === openId) || null;
  const notifications = studentNotifications.filter((n) => firebaseAuthUser && n.recipientUid === firebaseAuthUser.uid).slice(0, 8);
  const termOf = (s: GradeSheet) => academicPeriods.find((p) => termKeyOf(p.semester, p.academicYear) === s.termKey);

  // Terms, newest first; the current term first.
  const terms = useMemo(() => {
    const keys = Array.from(new Set(sheets.map((s) => s.termKey)));
    return keys
      .map((k) => ({ key: k, sheet: sheets.find((s) => s.termKey === k)!, period: academicPeriods.find((p) => termKeyOf(p.semester, p.academicYear) === k) }))
      .sort((a, b) => Number(!!b.period?.isCurrent) - Number(!!a.period?.isCurrent) || b.key.localeCompare(a.key));
  }, [sheets, academicPeriods]);

  const frame = (children: React.ReactNode) => (
    <div className="min-h-[80vh] bg-slate-50 px-4 py-8 font-sans">
      <div className="mx-auto max-w-6xl space-y-5">
        <div className="flex flex-col gap-3 rounded-2xl bg-[#18392B] p-5 text-white sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="font-serif text-2xl font-bold">Faculty Portal</h1>
            <p className="text-xs text-slate-300">
              {instructor ? `${[instructor.title, instructor.fullName].filter(Boolean).join(' ')} • ${instructor.department || 'Faculty'}` : 'Grade submission for PCM professors'}
            </p>
          </div>
          {firebaseAuthUser && (
            <button type="button" onClick={() => signOutUser()} className="inline-flex items-center gap-1.5 self-start rounded-lg border border-white/30 px-3 py-1.5 text-xs font-semibold hover:bg-white/10 sm:self-auto">
              <LogOut className="h-3.5 w-3.5" /> Sign out
            </button>
          )}
        </div>
        {children}
      </div>
    </div>
  );

  if (!firebaseAuthUser) {
    return frame(
      <div className="rounded-2xl border border-slate-200 bg-white p-6 text-sm text-slate-700 shadow-xs">
        <p>Sign in with the Google account the Registrar has on file for you in Faculty Load.</p>
        <button type="button" onClick={() => signInWithGoogle()} className="mt-4 inline-flex items-center gap-2 rounded-xl bg-[#18392B] px-4 py-2.5 text-xs font-bold text-white hover:bg-[#588B76]">
          <LogIn className="h-4 w-4" /> Sign in with Google
        </button>
      </div>
    );
  }
  if (!email || !instructor) {
    return frame(
      <div className="rounded-2xl border border-amber-200 bg-amber-50 p-6 text-sm text-amber-950">
        <p className="font-semibold">This account ({firebaseAuthUser.email}) is not linked to a professor.</p>
        <p className="mt-1">Ask the Registrar to add this email address to your record in Enrollment &amp; Records → Faculty Load, then sign in again.</p>
      </div>
    );
  }

  if (open) return frame(<GradeSheetEditor sheet={open} scale={scale} period={termOf(open)} onBack={() => setOpenId(null)} />);

  return frame(
    <>
      {notifications.length > 0 && (
        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-xs">
          <p className="mb-2 flex items-center gap-1.5 text-xs font-bold text-[#18392B]"><Bell className="h-4 w-4" /> Notifications</p>
          <ul className="space-y-1.5 text-xs">
            {notifications.map((n) => (
              <li key={n.id} className={`flex items-start justify-between gap-2 rounded-lg p-2 ${n.read ? 'bg-slate-50 text-slate-500' : 'bg-sky-50 text-sky-950'}`}>
                <span><strong>{n.title}</strong> — {n.message}</span>
                {!n.read && <button type="button" onClick={() => markNotificationRead(n.id)} className="shrink-0 text-[11px] font-semibold underline">Mark read</button>}
              </li>
            ))}
          </ul>
        </div>
      )}
      {!scale && (
        <p className="flex gap-2 rounded-xl border border-amber-200 bg-amber-50 p-3 text-xs text-amber-950">
          <AlertTriangle className="h-4 w-4 shrink-0" /> The grading scale has not been set up yet, so grades cannot be entered. Please contact the Registrar.
        </p>
      )}
      {error && <p className="rounded-xl border border-rose-200 bg-rose-50 p-3 text-xs text-rose-800">{error}</p>}
      {!loaded ? (
        <p className="py-10 text-center text-xs text-slate-500">Loading your classes…</p>
      ) : terms.length === 0 ? (
        <p className="rounded-2xl border border-slate-200 bg-white p-6 text-sm text-slate-600">
          No grade sheets yet. The Registrar prepares a grade sheet for each of your classes when grade submission opens.
        </p>
      ) : (
        terms.map(({ key, sheet: first, period }) => {
          const list = sheets.filter((s) => s.termKey === key);
          return (
            <section key={key} className="space-y-3 rounded-2xl border border-slate-200 bg-white p-5 shadow-xs">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <h2 className="font-serif text-lg font-bold text-[#18392B]">
                  {termLabel(first.semester, first.academicYear)} {period?.isCurrent && <span className="ml-1 rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-bold text-emerald-800">Current term</span>}
                </h2>
                <span className="flex items-center gap-1.5 text-xs text-slate-600">
                  <Clock className="h-3.5 w-3.5" />
                  {period?.gradeSubmissionDeadline ? `Grades due ${fmtDate(period.gradeSubmissionDeadline)}` : 'No deadline set'}
                </span>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full min-w-[640px] text-left text-xs">
                  <thead className="bg-slate-50 text-[10px] uppercase text-slate-500">
                    <tr>
                      <th className="p-2.5">Subject</th>
                      <th className="p-2.5">Section</th>
                      <th className="p-2.5">Students</th>
                      <th className="p-2.5">Grades entered</th>
                      <th className="p-2.5">Status</th>
                      <th className="p-2.5 text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {list.map((s) => {
                      const stage = sheetStageLabel(s);
                      return (
                        <tr key={s.id}>
                          <td className="p-2.5"><strong className="font-mono text-[#18392B]">{s.subjectCode}</strong> {s.subjectTitle}</td>
                          <td className="p-2.5">{s.sectionName || '—'}</td>
                          <td className="p-2.5 font-mono">{s.roster.length}</td>
                          <td className="p-2.5 font-mono">{enteredCount(s)} / {s.roster.length}</td>
                          <td className="p-2.5">
                            <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${STATUS_STYLE[stage] || 'bg-slate-100'}`}>{stage}</span>
                            {isOverdue(period, s) && <span className="ml-1 rounded-full bg-rose-600 px-2 py-0.5 text-[10px] font-bold text-white">Overdue</span>}
                          </td>
                          <td className="p-2.5 text-right">
                            <button type="button" onClick={() => setOpenId(s.id)} className="inline-flex items-center gap-1 rounded-lg bg-[#18392B] px-3 py-1.5 font-bold text-white hover:bg-[#588B76]">
                              <FileEdit className="h-3.5 w-3.5" /> {['Draft', 'Returned for Correction'].includes(s.status) ? 'Enter grades' : 'View'}
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </section>
          );
        })
      )}
    </>
  );
};

// One grade sheet: enter, save as draft, submit; view after submission; request a change once finalized.
const GradeSheetEditor: React.FC<{ sheet: GradeSheet; scale: GradingScale | null; period?: AcademicPeriod; onBack: () => void }> = ({ sheet, scale, period, onBack }) => {
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
  const user = { name: firebaseAuthUser?.displayName || firebaseAuthUser?.email || 'Professor', uid: firebaseAuthUser?.uid || '' };
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
        <ChevronLeft className="h-4 w-4" /> My classes
      </button>
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
            <button type="button" onClick={() => downloadText(`${sheet.subjectCode}-${sheet.termKey}.csv`.replace(/[|\s]/g, '_'), gradesCsv({ ...sheet, grades }, scale))} className="inline-flex items-center gap-1 rounded-lg border border-slate-300 px-2.5 py-1.5 font-semibold hover:bg-slate-50">
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
          <p className="flex gap-2 rounded-lg border border-emerald-200 bg-emerald-50 p-3 text-xs text-emerald-950"><CheckCircle2 className="h-4 w-4 shrink-0" /> Finalized {fmtDate(sheet.finalizedAt)}. To correct a grade, use “Request change”.</p>
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
                {sheet.status === 'Finalized' && <th className="p-2" />}
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
                    {sheet.status === 'Finalized' && (
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
