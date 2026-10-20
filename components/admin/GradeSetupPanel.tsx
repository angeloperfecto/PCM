'use client';

import React, { useEffect, useState } from 'react';
import { doc, updateDoc } from 'firebase/firestore';
import { CheckCircle2, ChevronDown, ChevronUp, Circle, Trash2, X } from 'lucide-react';
import { db } from '@/lib/firebase';
import { usePCM } from '@/lib/store';
import { assignableProfessors, linkFacultyMember, resolveSectionProfessor } from '@/lib/professors';
import { gradingScaleOf, normEmail, subjectsWithoutSection, sheetForSection } from '@/lib/grades';
import { termLabel } from '@/lib/reenrollment';
import { GradingScaleCard } from './GradingScaleCard';
import type { AcademicPeriod, ClassSection, GradeSheet } from '@/lib/types';

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
// termSections: the term's classes (Term Subjects offerings and stored class sections), from Grade Management.
export const GradeSetupPanel: React.FC<{ term: AcademicPeriod; sheets: GradeSheet[]; termSections: ClassSection[]; onPrepare: () => void; preparing: boolean }> = ({
  term,
  sheets,
  termSections,
  onPrepare,
  preparing,
}) => {
  const { enrollmentSystemConfig, instructors, faculty, students, updateClassSection, updateAcademicSubject, updateInstructor, addInstructor, updateAcademicPeriod, canManageCurriculum, addToast, logActivity, currentAdminUser } = usePCM();
  // Professors come from Faculty & Trustees, as the Admin set them up.
  const { teaching, others } = assignableProfessors(faculty || []);
  const scale = gradingScaleOf(enrollmentSystemConfig);
  const noSection = subjectsWithoutSection(students, term, termSections);
  // The professor set in Enrollment & Records (Term Subjects) or here, read the same way in both places.
  const rows = [...termSections]
    .sort((a, b) => a.subjectCode.localeCompare(b.subjectCode) || (a.sectionName || '').localeCompare(b.sectionName || ''))
    .map((s) => ({ section: s, ...resolveSectionProfessor(s, instructors, faculty || []) }));
  // Ready when the professor has a sign-in email (their Faculty & Trustees email counts; the grading
  // record is linked automatically when the grade sheets are prepared).
  const readySections = rows.filter((r) => (r.instructor || r.member) && r.email);
  const toCreate = readySections.filter((r) => !sheetForSection(r.section, sheets)).length;

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

  // Assign a Faculty & Trustees member to a class. Their instructor record (sign-in email, grade sheets)
  // is reused when it exists, otherwise created and linked to them.
  const assign = (sectionId: string, facultyId: string) =>
    run(`sec-${sectionId}`, async () => {
      if (facultyId.startsWith('ins:')) return; // the current, unlisted professor: nothing to change
      const member = (faculty || []).find((m) => m.id === facultyId);
      const ins = member ? (await linkFacultyMember(member, instructors, { addInstructor, updateInstructor })) || undefined : undefined;
      if (member && !ins) return;
      const name = member ? member.name : '';
      const section = termSections.find((s) => s.id === sectionId);
      // A Term Subjects class is updated in Term Subjects, so Enrollment & Records shows the same professor.
      if (section?.offeringId) await updateAcademicSubject(section.offeringId, { instructorId: ins?.id || '', instructor: name });
      else await updateClassSection(sectionId, { instructorId: ins?.id || '', instructorName: name });
    });

  // Take the professor off a class (their record and email are kept).
  const clearProfessor = (section: ClassSection, name: string) => {
    if (!window.confirm(`Remove ${name || 'the professor'} from ${section.subjectCode}${section.sectionName ? ` ${section.sectionName}` : ''}? You can choose a professor again at any time.`)) return;
    return assign(section.id, '');
  };

  // Take a class off this term, the same way as Term Subjects (archived, not deleted). Not allowed once students
  // are enrolled or it has a grade sheet.
  const removeClass = (section: ClassSection) =>
    run(`rm-${section.id}`, async () => {
      const label = `${section.subjectCode}${section.sectionName ? ` (${section.sectionName})` : ''}`;
      if (!section.offeringId) return addToast('warning', 'Can’t remove here', `${label} is an older class section. Remove it in Enrollment & Records.`);
      if ((section.enrolledStudentIds || []).length > 0)
        return addToast('warning', 'Students are enrolled', `${section.enrolledStudentIds!.length} student(s) are enrolled in ${label}. Close it in Term Subjects instead.`);
      if (sheetForSection(section, sheets)) return addToast('warning', 'Grade sheet exists', `${label} already has a grade sheet, so it can’t be removed.`);
      const tLabel = termLabel(term.semester, term.academicYear);
      if (!window.confirm(`Remove ${label} from ${tLabel}? It is also removed from Term Subjects, so students will no longer see it. To offer it again, add it again in Term Subjects.`)) return;
      await updateDoc(doc(db, 'academicSubjects', section.offeringId), { isArchived: true, removedAt: new Date().toISOString(), removedBy: currentAdminUser?.name || currentAdminUser?.email || 'Admin' });
      logActivity('UPDATE', 'Term Subjects', section.offeringId, section.subjectCode, `Removed ${section.subjectCode} from ${tLabel} (Grade Management).`);
      addToast('info', 'Class removed', `${label} is no longer offered in ${tLabel}.`);
    });

  // Save a professor's sign-in email (on their grading record, created from Faculty & Trustees if needed).
  const saveEmail = (key: string, row: { instructor?: (typeof instructors)[number]; member?: (typeof faculty)[number] }) =>
    run(`em-${key}`, async () => {
      const e = (emails[key] || '').trim();
      if (!isEmail(e)) return addToast('warning', 'Check the email', 'Enter the Google email the professor will sign in with.');
      const ins = row.instructor || (row.member ? await linkFacultyMember(row.member, instructors, { addInstructor, updateInstructor }) : null);
      if (ins) await updateInstructor(ins.id, { email: e.toLowerCase() });
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
                    <tr><th className="p-1.5">Class</th><th className="p-1.5">Professor</th><th className="p-1.5">Sign-in email</th>{!ro && <th className="p-1.5"><span className="sr-only">Actions</span></th>}</tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {rows.map(({ section, instructor, member, email, name }) => (
                      <tr key={section.id}>
                        <td className="p-1.5"><strong className="font-mono">{section.subjectCode}</strong> {section.sectionName}</td>
                        <td className="p-1.5">
                          <select
                            aria-label={`Professor for ${section.subjectCode} ${section.sectionName}`}
                            value={member?.id || (instructor ? `ins:${instructor.id}` : '')}
                            disabled={ro || busy === `sec-${section.id}`}
                            onChange={(e) => assign(section.id, e.target.value)}
                            className="w-full rounded-lg border border-slate-300 bg-white p-1.5"
                          >
                            <option value="">Choose professor…</option>
                            {instructor && !member && (
                              <option value={`ins:${instructor.id}`}>{name} (not in Faculty &amp; Trustees)</option>
                            )}
                            {teaching.length > 0 && (
                              <optgroup label="Faculty">
                                {teaching.map((m) => (
                                  <option key={m.id} value={m.id}>{m.name}{m.title ? ` — ${m.title}` : ''}</option>
                                ))}
                              </optgroup>
                            )}
                            {others.length > 0 && (
                              <optgroup label="Administration & others">
                                {others.map((m) => (
                                  <option key={m.id} value={m.id}>{m.name}{m.title ? ` — ${m.title}` : ''}</option>
                                ))}
                              </optgroup>
                            )}
                          </select>
                        </td>
                        <td className="p-1.5">
                          {!instructor && !member ? (
                            <span className="text-slate-400">—</span>
                          ) : email ? (
                            <span className="text-emerald-800" data-testid={`email-${section.id}`}>
                              {email}
                              {!normEmail(instructor?.email) && <span className="ml-1 text-[10px] text-slate-500">(Faculty &amp; Trustees)</span>}
                            </span>
                          ) : (
                            (() => {
                              const key = instructor?.id || `fac-${member?.id}`;
                              return (
                                <span className="flex gap-1">
                                  <input
                                    type="email"
                                    aria-label={`Email for ${name}`}
                                    value={emails[key] || ''}
                                    disabled={ro}
                                    onChange={(e) => setEmails((m) => ({ ...m, [key]: e.target.value }))}
                                    placeholder="name@gmail.com"
                                    className="w-44 rounded-lg border border-amber-300 p-1.5"
                                  />
                                  {!ro && (
                                    <button type="button" disabled={busy === `em-${key}`} onClick={() => saveEmail(key, { instructor, member })} className="rounded-lg bg-[#18392B] px-2 py-1 font-bold text-white disabled:opacity-50">
                                      Save
                                    </button>
                                  )}
                                </span>
                              );
                            })()
                          )}
                        </td>
                        {!ro && (
                          <td className="whitespace-nowrap p-1.5 text-right">
                            {(instructor || member) && (
                              <button
                                type="button"
                                aria-label={`Remove professor from ${section.subjectCode} ${section.sectionName}`.trim()}
                                title="Remove professor"
                                disabled={!!busy}
                                onClick={() => clearProfessor(section, name)}
                                className="rounded-lg p-1.5 text-slate-500 hover:bg-slate-100 hover:text-slate-800 disabled:opacity-50"
                              >
                                <X className="h-3.5 w-3.5" />
                              </button>
                            )}
                            {section.offeringId && (
                              <button
                                type="button"
                                aria-label={`Remove ${section.subjectCode}${section.sectionName ? ` ${section.sectionName}` : ''} from this term`}
                                title="Remove class from this term"
                                disabled={!!busy}
                                onClick={() => removeClass(section)}
                                className="rounded-lg p-1.5 text-rose-600 hover:bg-rose-50 disabled:opacity-50"
                              >
                                <Trash2 className="h-3.5 w-3.5" />
                              </button>
                            )}
                          </td>
                        )}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
            {teaching.length + others.length === 0 && <p>No professors yet. Add them in Faculty &amp; Trustees.</p>}
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
