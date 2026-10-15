'use client';

import React, { useEffect, useState } from 'react';
import { CheckCircle2, ChevronDown, ChevronUp, Circle } from 'lucide-react';
import { usePCM } from '@/lib/store';
import { gradingScaleOf, instructorForSection, normEmail, sectionsForTerm, subjectsWithoutSection } from '@/lib/grades';
import { termLabel } from '@/lib/reenrollment';
import { GradingScaleCard } from './GradingScaleCard';
import type { AcademicPeriod, GradeSheet } from '@/lib/types';

const isEmail = (e: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e.trim());

// One setup step (outside the panel so its inputs keep focus while typing).
const Step: React.FC<{ n: number; ok: boolean; title: string; children: React.ReactNode }> = ({ n, ok, title, children }) => (
  <li className={`rounded-xl border p-3 ${ok ? 'border-emerald-200 bg-emerald-50/50' : 'border-amber-200 bg-amber-50/60'}`}>
    <p className="flex items-center gap-2 text-xs font-bold text-slate-900">
      {ok ? <CheckCircle2 className="h-4 w-4 text-emerald-600" /> : <Circle className="h-4 w-4 text-amber-600" />}
      Step {n}. {title}
    </p>
    <div className="mt-2 space-y-2 pl-6 text-xs text-slate-700">{children}</div>
  </li>
);

// Everything a term needs before professors can enter grades, done in one place:
// grading scale → deadline → a professor (with email) for each class → grade sheets.
export const GradeSetupPanel: React.FC<{ term: AcademicPeriod; sheets: GradeSheet[]; onPrepare: () => void; preparing: boolean }> = ({ term, sheets, onPrepare, preparing }) => {
  const { enrollmentSystemConfig, classSections, instructors, students, updateClassSection, updateInstructor, updateAcademicPeriod, canManageCurriculum, addToast } = usePCM();
  const scale = gradingScaleOf(enrollmentSystemConfig);
  const termSections = sectionsForTerm(classSections, term);
  const noSection = subjectsWithoutSection(students, term, termSections);
  const rows = termSections.map((s) => ({ section: s, instructor: instructorForSection(s, instructors) }));
  const readySections = rows.filter((r) => r.instructor && normEmail(r.instructor.email));
  const toCreate = readySections.filter((r) => !sheets.some((x) => x.sectionId === r.section.id)).length;

  const steps = {
    scale: !!scale,
    deadline: !!term.gradeSubmissionDeadline,
    professors: termSections.length > 0 && readySections.length === termSections.length,
    sheets: termSections.length > 0 && toCreate === 0 && sheets.length > 0,
  };
  const done = Object.values(steps).filter(Boolean).length;
  const [open, setOpen] = useState(done < 4);
  useEffect(() => {
    if (done < 4) setOpen(true);
  }, [done]);
  const [showScale, setShowScale] = useState(false);
  const [dates, setDates] = useState({ start: term.gradeSubmissionStart || '', end: term.gradeSubmissionDeadline || '' });
  useEffect(() => setDates({ start: term.gradeSubmissionStart || '', end: term.gradeSubmissionDeadline || '' }), [term.id, term.gradeSubmissionStart, term.gradeSubmissionDeadline]);
  const [emails, setEmails] = useState<Record<string, string>>({});
  const [busy, setBusy] = useState('');
  const ro = !canManageCurriculum;

  const run = async (key: string, fn: () => Promise<unknown>) => {
    setBusy(key);
    try {
      await fn();
    } finally {
      setBusy('');
    }
  };

  const saveDates = () =>
    run('dates', async () => {
      if (!dates.end) return addToast('warning', 'Choose a deadline', 'Set the last day professors can submit grades.');
      if (dates.start && dates.end < dates.start) return addToast('warning', 'Check the dates', 'The deadline must be on or after the opening date.');
      await updateAcademicPeriod(term.id, { gradeSubmissionStart: dates.start, gradeSubmissionDeadline: dates.end });
    });

  const assign = (sectionId: string, instructorId: string) =>
    run(`sec-${sectionId}`, async () => {
      const ins = instructors.find((i) => i.id === instructorId);
      await updateClassSection(sectionId, { instructorId: ins?.id || '', instructorName: ins ? [ins.title, ins.fullName].filter(Boolean).join(' ') : '' });
    });

  const saveEmail = (instructorId: string) =>
    run(`em-${instructorId}`, async () => {
      const e = (emails[instructorId] || '').trim();
      if (!isEmail(e)) return addToast('warning', 'Check the email', 'Enter the Google email the professor will sign in with.');
      await updateInstructor(instructorId, { email: e.toLowerCase() });
    });

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs" data-testid="grade-setup">
      <button type="button" onClick={() => setOpen((o) => !o)} className="flex w-full items-center justify-between gap-2 text-left" aria-expanded={open}>
        <span>
          <span className="block font-serif text-base font-bold text-[#18392B]">Set up grade submission — {termLabel(term.semester, term.academicYear)}</span>
          <span className={`text-xs ${done === 4 ? 'text-emerald-700' : 'text-amber-800'}`}>
            {done === 4 ? 'Ready: professors can enter grades in the Faculty Portal.' : `${done} of 4 steps done. Professors can enter grades once all steps are done.`}
          </span>
        </span>
        {open ? <ChevronUp className="h-5 w-5 text-slate-500" /> : <ChevronDown className="h-5 w-5 text-slate-500" />}
      </button>

      {open && (
        <ol className="mt-4 space-y-3">
          <Step n={1} ok={steps.scale} title="Grading scale">
            <p>{scale ? `${scale.values.length} grades and ${scale.specialCodes.length} special code(s) are set.` : 'Enter the grades professors may give (e.g. 1.00–5.00) and codes such as INC.'}</p>
            {!ro && (
              <button type="button" onClick={() => setShowScale((v) => !v)} className="rounded-lg border border-[#18392B] px-3 py-1.5 font-semibold text-[#18392B] hover:bg-emerald-50">
                {showScale ? 'Hide grading scale' : scale ? 'Edit grading scale' : 'Set up grading scale'}
              </button>
            )}
            {showScale && <GradingScaleCard />}
          </Step>

          <Step n={2} ok={steps.deadline} title="Grade submission dates">
            <div className="flex flex-wrap items-end gap-2">
              <label>
                <span className="block text-[11px] font-semibold text-slate-600">Opens</span>
                <input type="date" value={dates.start} disabled={ro} onChange={(e) => setDates((d) => ({ ...d, start: e.target.value }))} className="rounded-lg border border-slate-300 p-1.5" />
              </label>
              <label>
                <span className="block text-[11px] font-semibold text-slate-600">Deadline</span>
                <input type="date" value={dates.end} disabled={ro} onChange={(e) => setDates((d) => ({ ...d, end: e.target.value }))} className="rounded-lg border border-slate-300 p-1.5" />
              </label>
              {!ro && (
                <button type="button" disabled={busy === 'dates'} onClick={saveDates} className="rounded-lg bg-[#18392B] px-3 py-1.5 font-bold text-white hover:bg-[#588B76] disabled:opacity-50">
                  Save dates
                </button>
              )}
            </div>
          </Step>

          <Step n={3} ok={steps.professors} title="A professor (with sign-in email) for each class">
            {termSections.length === 0 ? (
              <p>
                No classes are set up for this term. Add them in Enrollment &amp; Records → Class Schedules (one per subject and section), then
                come back here.
              </p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full min-w-[560px] text-left">
                  <thead className="text-[10px] uppercase text-slate-500">
                    <tr><th className="p-1.5">Class</th><th className="p-1.5">Professor</th><th className="p-1.5">Sign-in email</th></tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {rows.map(({ section, instructor }) => (
                      <tr key={section.id}>
                        <td className="p-1.5"><strong className="font-mono">{section.subjectCode}</strong> {section.sectionName}</td>
                        <td className="p-1.5">
                          <select
                            aria-label={`Professor for ${section.subjectCode} ${section.sectionName}`}
                            value={instructor?.id || ''}
                            disabled={ro || busy === `sec-${section.id}`}
                            onChange={(e) => assign(section.id, e.target.value)}
                            className="w-full rounded-lg border border-slate-300 bg-white p-1.5"
                          >
                            <option value="">Choose professor…</option>
                            {instructors.filter((i) => i.status !== 'Inactive').map((i) => (
                              <option key={i.id} value={i.id}>{[i.title, i.fullName].filter(Boolean).join(' ')}</option>
                            ))}
                          </select>
                        </td>
                        <td className="p-1.5">
                          {!instructor ? (
                            <span className="text-slate-400">—</span>
                          ) : normEmail(instructor.email) ? (
                            <span className="text-emerald-800">{instructor.email}</span>
                          ) : (
                            <span className="flex gap-1">
                              <input
                                type="email"
                                aria-label={`Email for ${instructor.fullName}`}
                                value={emails[instructor.id] || ''}
                                disabled={ro}
                                onChange={(e) => setEmails((m) => ({ ...m, [instructor.id]: e.target.value }))}
                                placeholder="name@gmail.com"
                                className="w-44 rounded-lg border border-amber-300 p-1.5"
                              />
                              {!ro && (
                                <button type="button" disabled={busy === `em-${instructor.id}`} onClick={() => saveEmail(instructor.id)} className="rounded-lg bg-[#18392B] px-2 py-1 font-bold text-white disabled:opacity-50">
                                  Save
                                </button>
                              )}
                            </span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
            {instructors.length === 0 && <p>No professors yet. Add them in Enrollment &amp; Records → Faculty Load.</p>}
            {noSection.length > 0 && (
              <p className="text-amber-900">
                Students are enrolled in subjects without a class: {noSection.map((x) => `${x.code} (${x.students})`).join(', ')}. Add a class for each in
                Class Schedules so they get a grade sheet.
              </p>
            )}
          </Step>

          <Step n={4} ok={steps.sheets} title="Create grade sheets">
            <p>
              {sheets.length} grade sheet{sheets.length === 1 ? '' : 's'} created
              {toCreate ? `; ${toCreate} class${toCreate === 1 ? '' : 'es'} ready for a grade sheet` : ''}. Each sheet lists the students officially
              enrolled in that class and appears in the professor&apos;s Faculty Portal.
            </p>
            {!ro && (
              <button type="button" disabled={preparing || readySections.length === 0} onClick={onPrepare} className="rounded-lg bg-[#18392B] px-3 py-1.5 font-bold text-white hover:bg-[#588B76] disabled:opacity-50">
                {preparing ? 'Creating…' : toCreate ? `Create ${toCreate} grade sheet${toCreate === 1 ? '' : 's'}` : 'Refresh class lists'}
              </button>
            )}
          </Step>
        </ol>
      )}
    </div>
  );
};
