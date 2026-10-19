'use client';

import React, { useMemo, useState } from 'react';
import { AlertTriangle, Bell, ClipboardCheck, Clock, FileEdit, LogIn, LogOut } from 'lucide-react';
import { usePCM } from '@/lib/store';
import { professorDisplayName } from '@/lib/professors';
import { enteredCount, gradingScaleOf, isOverdue, normEmail, sheetStageLabel, useGradeSheets } from '@/lib/grades';
import { termKeyOf, termLabel } from '@/lib/reenrollment';
import { GRADE_STAGE_STYLE, GradeSheetEditor, fmtGradeDate } from '@/components/grades/GradeSheetEditor';
import type { GradeSheet } from '@/lib/types';

const fmtDate = fmtGradeDate;
const STATUS_STYLE = GRADE_STAGE_STYLE;

// Faculty Portal: a professor's assigned classes for each term and their grade sheets.
// Access is by the professor's verified PCM Google email, matched to Faculty Load.
export const FacultyPortalView: React.FC = () => {
  const { firebaseAuthUser, signInWithGoogle, signOutUser, instructors, academicPeriods, enrollmentSystemConfig, studentNotifications, markNotificationRead, isAdminLoggedIn, navigateTo } = usePCM();
  const email = firebaseAuthUser?.emailVerified ? normEmail(firebaseAuthUser.email || '') : '';
  const instructor = email ? instructors.find((i) => normEmail(i.email) === email) : undefined;
  const { sheets, loaded, error, errorCode } = useGradeSheets({ instructorEmail: instructor ? email : undefined });
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
              {instructor ? `${professorDisplayName(instructor)} • ${instructor.department || 'Faculty'}` : 'Grade submission for PCM professors'}
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
      <div className="space-y-4">
        <div className="rounded-2xl border border-amber-200 bg-amber-50 p-6 text-sm text-amber-950">
          <p className="font-semibold">This account ({firebaseAuthUser.email}) is not linked to a professor.</p>
          <p className="mt-1">
            Professors: ask the Registrar to add this email address to your record (Admin → Grade Management → Set up grade submission, or
            Enrollment &amp; Records → Faculty Load), then sign in again.
          </p>
        </div>
        {isAdminLoggedIn && (
          <div className="rounded-2xl border border-slate-200 bg-white p-6 text-sm text-slate-700 shadow-xs">
            <p className="font-semibold text-[#18392B]">Signed in as staff?</p>
            <p className="mt-1">
              Set up grade submission, follow each class&apos;s grade sheet, and enter grades on a professor&apos;s behalf in the Admin Workspace.
            </p>
            <button
              type="button"
              onClick={() => navigateTo('admin', 'grades')}
              className="mt-3 inline-flex items-center gap-2 rounded-xl bg-[#18392B] px-4 py-2.5 text-xs font-bold text-white hover:bg-[#588B76]"
            >
              <ClipboardCheck className="h-4 w-4" /> Open Grade Management
            </button>
          </div>
        )}
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
      {error && (
        <p className="rounded-xl border border-rose-200 bg-rose-50 p-3 text-xs text-rose-800">
          {errorCode === 'permission-denied'
            ? 'Your grade sheets cannot be opened yet because grade access has not been switched on for the website. Please tell the Registrar.'
            : error}
        </p>
      )}
      {!loaded ? (
        <p className="py-10 text-center text-xs text-slate-500">Loading your classes…</p>
      ) : terms.length === 0 ? (
        <p className="rounded-2xl border border-slate-200 bg-white p-6 text-sm text-slate-600">
          No grade sheets yet. When grade submission opens, the Registrar creates a grade sheet for each class you teach and it appears
          here. You then choose a grade for each student, save as a draft, and submit it for review.
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
