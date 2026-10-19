'use client';

import React, { useEffect, useMemo, useRef, useState } from 'react';
import { AlertTriangle, CheckCircle2, ClipboardCheck, Download, ExternalLink, FileEdit, FileSpreadsheet, Printer, RefreshCcw, X } from 'lucide-react';
import { usePCM } from '@/lib/store';
import { linkFacultyMember, resolveSectionProfessor } from '@/lib/professors';
import {
  classListFor,
  decideGradeAmendment,
  downloadText,
  enteredCount,
  finalizeGradeSheet,
  gradesCsv,
  gradingScaleOf,
  normEmail,
  isOverdue,
  lookupGrade,
  prepareGradeSheets,
  publishGradeSheet,
  requestGradeAmendment,
  termClassSections,
  setSheetStatus,
  sheetIssues,
  sheetStageLabel,
  useGradeAmendments,
  useGradeSheets,
  type SheetIssues, sheetForSection } from '@/lib/grades';
import { termKeyOf, termLabel } from '@/lib/reenrollment';
import { GradeSheetDocument } from '@/components/grades/GradeSheetDocument';
import { GradeSheetEditor } from '@/components/grades/GradeSheetEditor';
import { GradeSetupPanel } from './GradeSetupPanel';
import { printDocument } from '@/components/enrollment/CertificateOfRegistration';
import type { AcademicPeriod, GradeAmendment, GradeSheet, GradingScale } from '@/lib/types';

const fmt = (d?: string) => (d ? new Date(d.length === 10 ? `${d}T00:00:00` : d).toLocaleString('en-PH', { month: 'short', day: 'numeric', year: 'numeric', ...(d.length > 10 ? { hour: 'numeric', minute: '2-digit' } : {}) }) : '');

const STAGES = ['Not Started', 'Draft', 'Submitted', 'Under Review', 'Returned for Correction', 'Approved', 'Finalized', 'Finalized & Published'];
const STAGE_STYLE: Record<string, string> = {
  'Not Started': 'bg-slate-100 text-slate-700',
  Draft: 'bg-amber-100 text-amber-900',
  Submitted: 'bg-sky-100 text-sky-900',
  'Under Review': 'bg-indigo-100 text-indigo-900',
  'Returned for Correction': 'bg-rose-100 text-rose-800',
  Approved: 'bg-emerald-100 text-emerald-900',
  Finalized: 'bg-emerald-600 text-white',
  'Finalized & Published': 'bg-emerald-800 text-white',
};

// Admin → Grade Management: every class's grade sheet for a term, from preparation to publication.
export const AdminGradesTab: React.FC = () => {
  const { academicPeriods, academicSubjects, classSections, instructors, students, enrollmentSystemConfig, canManageCurriculum, currentAdminUser, addToast, navigateTo, faculty, addInstructor, updateInstructor } = usePCM();
  const scale = gradingScaleOf(enrollmentSystemConfig);
  const sortedTerms = useMemo(
    // Current term first, then active, then closed (most recent first); upcoming terms last.
    () => {
      const rank = (p: AcademicPeriod) => (p.isCurrent ? 0 : p.status === 'Active' ? 1 : p.closedAt || p.status === 'Archived' ? 2 : 3);
      return [...academicPeriods].sort((a, b) => rank(a) - rank(b) || termKeyOf(b.semester, b.academicYear).localeCompare(termKeyOf(a.semester, a.academicYear)));
    },
    [academicPeriods]
  );
  const [termId, setTermId] = useState('');
  const term = sortedTerms.find((p) => p.id === termId) || sortedTerms[0];
  const termKey = term ? termKeyOf(term.semester, term.academicYear) : '';
  const { sheets, loaded, error, errorCode } = useGradeSheets({ termKey: termKey || undefined });
  const amendments = useGradeAmendments({ termKey: termKey || undefined });
  const [filters, setFilters] = useState({ professor: '', subject: '', program: '', yearLevel: '', stage: '' });
  const [reviewId, setReviewId] = useState<string | null>(null);
  // Sheet the Registrar is entering grades for, on the professor's behalf.
  const [editId, setEditId] = useState<string | null>(null);
  const [preparing, setPreparing] = useState(false);
  const [prepareNote, setPrepareNote] = useState<string[]>([]);
  const actor = currentAdminUser?.name || 'Registrar';

  // Classes from Enrollment & Records → Term Subjects (and any stored class sections), with their enrolled students.
  const termSections = useMemo(() => (term ? termClassSections(term, classSections, academicSubjects, students) : []), [term, classSections, academicSubjects, students]);
  const professors = Array.from(new Set(sheets.map((s) => s.instructorName))).sort();
  const programs = Array.from(new Set(sheets.flatMap((s) => s.students.map((x) => x.program)).filter(Boolean))).sort();
  const yearLevels = Array.from(new Set(sheets.flatMap((s) => s.students.map((x) => x.yearLevel)).filter(Boolean))).sort();

  const filtered = sheets.filter((s) => {
    const q = filters.subject.trim().toLowerCase();
    return (
      (!filters.professor || s.instructorName === filters.professor) &&
      (!q || `${s.subjectCode} ${s.subjectTitle}`.toLowerCase().includes(q)) &&
      (!filters.program || s.students.some((x) => x.program === filters.program)) &&
      (!filters.yearLevel || s.students.some((x) => x.yearLevel === filters.yearLevel)) &&
      (!filters.stage || (filters.stage === 'Overdue' ? isOverdue(term, s) : sheetStageLabel(s) === filters.stage))
    );
  });
  const counts = STAGES.map((st) => [st, sheets.filter((s) => sheetStageLabel(s) === st).length] as const);
  const overdue = sheets.filter((s) => isOverdue(term, s)).length;

  // Students with no grade or an incomplete grade.
  const unresolved = sheets.flatMap((s) => {
    const i = sheetIssues(s, scale);
    return [...i.missing.map((id) => ({ s, id, issue: 'No grade' })), ...i.incomplete.map((id) => ({ s, id, issue: `Incomplete (${s.grades[id]?.grade})` })), ...i.invalid.map((id) => ({ s, id, issue: 'Not on the scale' }))];
  });

  const prepare = async (auto = false) => {
    if (!term) return;
    setPreparing(true);
    try {
      // Professors set in Enrollment & Records from Faculty & Trustees get their grading record (sign-in
      // email) linked first, so their classes get sheets.
      let roster = [...instructors];
      for (const section of termSections) {
        const p = resolveSectionProfessor(section, roster, faculty || []);
        if (!p.member || (p.instructor && p.instructor.facultyId === p.member.id && normEmail(p.instructor.email))) continue;
        if (!p.email) continue; // no email anywhere yet: it is asked for in the setup panel
        const linked = await linkFacultyMember(p.member, roster, { addInstructor, updateInstructor });
        if (linked) roster = [...roster.filter((i) => i.id !== linked.id), linked];
      }
      const r = await prepareGradeSheets(term, termSections, roster, students, sheets, actor, faculty || []);
      setPrepareNote([...r.skipped.map((x) => `${x.section}: ${x.reason}`), ...Array.from(new Set(r.warnings))]);
      if (!auto || r.created || r.updated)
        addToast(
          'success',
          auto ? 'Grade sheets updated' : 'Grade sheets prepared',
          `${auto ? 'From Enrollment & Records: ' : ''}${r.created} created, ${r.updated} refreshed${r.skipped.length ? `, ${r.skipped.length} skipped` : ''}.`
        );
    } catch (e: any) {
      addToast('error', 'Not prepared', e?.code === 'permission-denied' ? 'Only the Registrar, Academic Admin or an Admin can prepare grade sheets.' : 'Please try again.');
    } finally {
      setPreparing(false);
    }
  };

  // What Enrollment & Records changed since the sheets were prepared: classes with a professor but no sheet, and
  // draft sheets whose class list, subject details or professor differ. Refreshed automatically for staff.
  const syncSignature = useMemo(() => {
    if (!term || term.closedAt || !loaded || !canManageCurriculum) return '';
    const parts: string[] = [];
    for (const section of termSections) {
      // Same professor lookup as Enrollment & Records; a Faculty & Trustees email counts (linked on refresh).
      const p = resolveSectionProfessor(section, instructors, faculty || []);
      const sheet = sheetForSection(section, sheets);
      if (!p.email) {
        // Professor changed to someone without a sign-in email (or removed): hand the draft sheet over.
        if (sheet && ['Draft', 'Returned for Correction'].includes(sheet.status) && (sheet.instructorEmail || (sheet.instructorName || '') !== p.name))
          parts.push(`reassign:${section.id}:${p.name}`);
        continue;
      }
      const ins = { email: p.email };
      if (!sheet) {
        parts.push(`new:${section.id}`);
        continue;
      }
      if (!['Draft', 'Returned for Correction'].includes(sheet.status)) continue;
      const roster = classListFor(section, termSections, students, term).students.map((s) => s.id).sort().join(',');
      const same =
        [...sheet.roster].sort().join(',') === roster &&
        sheet.subjectTitle === section.subjectTitle &&
        Number(sheet.units) === (Number(section.units) || 0) &&
        (sheet.sectionName || '') === (section.sectionName || section.sectionCode || '') &&
        sheet.instructorEmail === normEmail(ins.email);
      if (!same) parts.push([section.id, roster, section.subjectTitle, section.units, section.sectionName, normEmail(ins.email)].join(':'));
    }
    return parts.join('|');
  }, [term, loaded, canManageCurriculum, termSections, instructors, faculty, sheets, students]);
  const lastSync = useRef('');
  useEffect(() => {
    if (!syncSignature || preparing || syncSignature === lastSync.current) return;
    lastSync.current = syncSignature;
    void prepare(true);
    // Re-checked when a refresh finishes, so a change that arrived during it is not missed.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [syncSignature, preparing]);

  const review = sheets.find((s) => s.id === reviewId) || null;
  const select = 'rounded-lg border border-slate-300 bg-white p-2 text-xs';
  const editing = sheets.find((s) => s.id === editId) || null;
  if (editing) {
    return (
      <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
        <GradeSheetEditor sheet={editing} scale={scale} period={term} staff={{ name: actor }} backLabel="Grade Management" onBack={() => setEditId(null)} />
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs space-y-4">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <h2 className="flex items-center gap-2 font-serif text-lg font-bold text-[#18392B]"><ClipboardCheck className="h-5 w-5 text-[#588B76]" /> Grade Management</h2>
            <p className="text-xs text-slate-500">
              Professors enter grades in the Faculty Portal (top bar → Faculty) and submit them; you review, approve, finalize and publish them here. You can
              also enter grades for a professor with “Enter grades”.
            </p>
          </div>
          <div className="flex flex-wrap items-end gap-2">
            <label className="text-xs">
              <span className="block font-semibold text-slate-600">Academic term</span>
              <select value={term?.id || ''} onChange={(e) => setTermId(e.target.value)} className={select} aria-label="Academic term">
                {sortedTerms.map((p) => (
                  <option key={p.id} value={p.id}>{termLabel(p.semester, p.academicYear)}{p.isCurrent ? ' (current)' : p.closedAt ? ' (closed)' : ''}</option>
                ))}
              </select>
            </label>
            {canManageCurriculum && term && !term.closedAt && (
              <button type="button" onClick={() => prepare()} disabled={preparing} className="inline-flex items-center gap-1.5 rounded-lg border border-[#18392B] px-3 py-2 text-xs font-bold text-[#18392B] hover:bg-emerald-50 disabled:opacity-50">
                <RefreshCcw className="h-3.5 w-3.5" /> {preparing ? 'Preparing…' : 'Prepare / refresh grade sheets'}
              </button>
            )}
            <button type="button" onClick={() => navigateTo('faculty-portal')} className="inline-flex items-center gap-1.5 rounded-lg bg-slate-100 px-3 py-2 text-xs font-bold text-slate-700 hover:bg-slate-200">
              <ExternalLink className="h-3.5 w-3.5" /> Faculty Portal
            </button>
          </div>
        </div>

        {errorCode === 'permission-denied' && (
          <p className="flex gap-2 rounded-lg border border-rose-200 bg-rose-50 p-3 text-xs text-rose-900">
            <AlertTriangle className="h-4 w-4 shrink-0" /> Grade sheets are blocked by the database security rules. The updated Firestore rules (from the
            grade submission update) still need to be published to Firebase; until then no one can create or open grade sheets.
          </p>
        )}
        {!scale && (
          <p className="flex gap-2 rounded-lg border border-amber-200 bg-amber-50 p-3 text-xs text-amber-950">
            <AlertTriangle className="h-4 w-4 shrink-0" /> Set PCM&apos;s grading scale first (Enrollment &amp; Records → System Governance → Grading Scale). Professors cannot enter grades until then.
          </p>
        )}
        {term && (
          <p className="text-xs text-slate-600">
            Grade submission: {term.gradeSubmissionStart ? fmt(term.gradeSubmissionStart) : 'start not set'} to{' '}
            <strong>{term.gradeSubmissionDeadline ? fmt(term.gradeSubmissionDeadline) : 'no deadline set'}</strong> (set in Academic Terms → Edit term).
          </p>
        )}

        <div className="grid grid-cols-2 gap-2 sm:grid-cols-4 lg:grid-cols-9">
          <button type="button" aria-label={`Classes: ${termSections.length}`} onClick={() => setFilters((f) => ({ ...f, stage: '' }))} className="rounded-xl border border-slate-200 bg-slate-50 p-2 text-left">
            <span className="block text-[10px] font-bold uppercase text-slate-500">Classes</span>
            <strong className="font-mono text-lg text-[#18392B]">{termSections.length}</strong>
          </button>
          {counts.map(([st, n]) => (
            <button key={st} type="button" aria-label={`${st}: ${n}`} aria-pressed={filters.stage === st} onClick={() => setFilters((f) => ({ ...f, stage: f.stage === st ? '' : st }))} className={`rounded-xl border p-2 text-left ${filters.stage === st ? 'border-[#18392B] ring-1 ring-[#18392B]' : 'border-slate-200'}`}>
              <span className="block text-[10px] font-bold uppercase text-slate-500">{st}</span>
              <strong className="font-mono text-lg text-[#18392B]">{n}</strong>
            </button>
          ))}
        </div>
        {overdue > 0 && (
          <button type="button" onClick={() => setFilters((f) => ({ ...f, stage: 'Overdue' }))} className="rounded-lg bg-rose-600 px-3 py-1.5 text-xs font-bold text-white">
            {overdue} overdue grade sheet{overdue === 1 ? '' : 's'} — show
          </button>
        )}

        {prepareNote.length > 0 && (
          <div className="space-y-1 rounded-xl border border-amber-200 bg-amber-50 p-3 text-xs text-amber-950">
            <p className="font-bold">Needs attention</p>
            <ul className="list-disc space-y-0.5 pl-5">
              {prepareNote.map((n) => <li key={n}>{n}</li>)}
            </ul>
          </div>
        )}
      </div>

      {term && !term.closedAt && canManageCurriculum && <GradeSetupPanel term={term} sheets={sheets} termSections={termSections} onPrepare={() => prepare()} preparing={preparing} />}

      <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs space-y-3">
        <div className="flex flex-wrap gap-2">
          <select aria-label="Professor" value={filters.professor} onChange={(e) => setFilters((f) => ({ ...f, professor: e.target.value }))} className={select}>
            <option value="">All professors</option>
            {professors.map((p) => <option key={p}>{p}</option>)}
          </select>
          <input aria-label="Subject" value={filters.subject} onChange={(e) => setFilters((f) => ({ ...f, subject: e.target.value }))} placeholder="Subject code or title" className={`${select} w-48`} />
          <select aria-label="Program" value={filters.program} onChange={(e) => setFilters((f) => ({ ...f, program: e.target.value }))} className={select}>
            <option value="">All programs</option>
            {programs.map((p) => <option key={p}>{p}</option>)}
          </select>
          <select aria-label="Year level" value={filters.yearLevel} onChange={(e) => setFilters((f) => ({ ...f, yearLevel: e.target.value }))} className={select}>
            <option value="">All year levels</option>
            {yearLevels.map((p) => <option key={p}>{p}</option>)}
          </select>
          <select aria-label="Status" value={filters.stage} onChange={(e) => setFilters((f) => ({ ...f, stage: e.target.value }))} className={select}>
            <option value="">All statuses</option>
            {[...STAGES, 'Overdue'].map((p) => <option key={p}>{p}</option>)}
          </select>
        </div>
        {error && <p className="text-xs text-rose-700">{error}</p>}
        <div className="overflow-x-auto">
          <table className="w-full min-w-[820px] text-left text-xs">
            <thead className="bg-slate-50 text-[10px] uppercase text-slate-500">
              <tr>
                <th className="p-2.5">Subject</th>
                <th className="p-2.5">Section</th>
                <th className="p-2.5">Professor</th>
                <th className="p-2.5">Grades</th>
                <th className="p-2.5">Issues</th>
                <th className="p-2.5">Status</th>
                <th className="p-2.5">Updated</th>
                <th className="p-2.5 text-right" />
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {!loaded && <tr><td colSpan={8} className="p-6 text-center text-slate-500">Loading…</td></tr>}
              {loaded && filtered.length === 0 && <tr><td colSpan={8} className="p-6 text-center text-slate-500">No grade sheets{sheets.length ? ' match the filters' : ' for this term yet — press “Prepare / refresh grade sheets”'}.</td></tr>}
              {filtered.map((s) => {
                const i = sheetIssues(s, scale);
                const stage = sheetStageLabel(s);
                return (
                  <tr key={s.id} className="hover:bg-slate-50">
                    <td className="p-2.5">
                      <strong className="font-mono text-[#18392B]">{s.subjectCode}</strong> {s.subjectTitle}
                      {!termSections.some((c) => sheetForSection(c, [s])) && (
                        <span className="mt-0.5 block text-[10px] font-semibold text-amber-800" title="Made for a class that is not among this semester’s Term Subjects. It is kept; add the subject in Term Subjects or leave it.">
                          Not in this semester’s Term Subjects
                        </span>
                      )}
                    </td>
                    <td className="p-2.5">{s.sectionName || '—'}</td>
                    <td className="p-2.5">{s.instructorName}</td>
                    <td className="p-2.5 font-mono">{enteredCount(s)} / {s.roster.length}</td>
                    <td className="p-2.5">
                      {i.missing.length + i.invalid.length + i.incomplete.length === 0 ? (
                        <span className="text-emerald-700">None</span>
                      ) : (
                        <span className="text-amber-800">
                          {[i.missing.length && `${i.missing.length} missing`, i.incomplete.length && `${i.incomplete.length} incomplete`, i.invalid.length && `${i.invalid.length} invalid`].filter(Boolean).join(', ')}
                        </span>
                      )}
                    </td>
                    <td className="p-2.5">
                      <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${STAGE_STYLE[stage] || 'bg-slate-100'}`}>{stage}</span>
                      {isOverdue(term, s) && <span className="ml-1 rounded-full bg-rose-600 px-2 py-0.5 text-[10px] font-bold text-white">Overdue</span>}
                    </td>
                    <td className="p-2.5 text-slate-500">{fmt(s.updatedAt || s.savedAt || s.createdAt)}</td>
                    <td className="p-2.5 text-right">
                      <span className="inline-flex gap-1.5">
                        {canManageCurriculum && scale && ['Draft', 'Returned for Correction'].includes(s.status) && (
                          <button type="button" onClick={() => setEditId(s.id)} className="inline-flex items-center gap-1 rounded-lg bg-[#18392B] px-2.5 py-1 font-semibold text-white hover:bg-[#588B76]">
                            <FileEdit className="h-3.5 w-3.5" /> Enter grades
                          </button>
                        )}
                        <button type="button" onClick={() => setReviewId(s.id)} className="rounded-lg bg-slate-100 px-2.5 py-1 font-semibold hover:bg-slate-200">Review</button>
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-5 xl:grid-cols-2">
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs">
          <h3 className="mb-2 font-serif text-base font-bold text-[#18392B]">Students with missing or incomplete grades ({unresolved.length})</h3>
          {unresolved.length === 0 ? (
            <p className="text-xs text-slate-500">None for this term.</p>
          ) : (
            <ul className="max-h-64 divide-y divide-slate-100 overflow-y-auto text-xs">
              {unresolved.map(({ s, id, issue }) => {
                const st = s.students.find((x) => x.studentRecordId === id);
                return (
                  <li key={`${s.id}-${id}`} className="flex flex-wrap justify-between gap-2 py-1.5">
                    <span><strong>{st?.name}</strong> <span className="font-mono text-slate-500">{st?.studentId}</span> • {s.subjectCode}</span>
                    <span className="text-amber-800">{issue} • {sheetStageLabel(s)}</span>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
        <AmendmentQueue amendments={amendments} sheets={sheets} scale={scale} />
      </div>

      {review && term && <GradeReviewModal sheet={review} term={term} scale={scale} amendments={amendments.filter((a) => a.sheetId === review.id)} onClose={() => setReviewId(null)} />}
    </div>
  );
};

// Pending grade changes: approve (applied with an audit entry) or reject.
const AmendmentQueue: React.FC<{ amendments: GradeAmendment[]; sheets: GradeSheet[]; scale: GradingScale | null }> = ({ amendments, sheets, scale }) => {
  const { students, canManageCurriculum, currentAdminUser, firebaseAuthUser, addToast } = usePCM();
  const [remarks, setRemarks] = useState<Record<string, string>>({});
  const [busy, setBusy] = useState('');
  const decide = async (a: GradeAmendment, approve: boolean) => {
    const sheet = sheets.find((s) => s.id === a.sheetId);
    if (!sheet || !scale) return;
    if (!approve && !(remarks[a.id] || '').trim()) return addToast('warning', 'Add a remark', 'Explain why the change is not approved.');
    setBusy(a.id);
    try {
      await decideGradeAmendment(a, approve, sheet, scale, students.find((s) => s.id === a.studentRecordId), { name: currentAdminUser?.name || 'Registrar', uid: firebaseAuthUser?.uid || '' }, remarks[a.id] || '');
      addToast('success', approve ? 'Grade change applied' : 'Grade change rejected', `${a.studentName} • ${a.subjectCode}`);
    } catch (e: any) {
      addToast('error', 'Not saved', e?.code === 'permission-denied' ? 'You do not have permission to decide grade changes.' : 'Please try again.');
    } finally {
      setBusy('');
    }
  };
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs">
      <h3 className="mb-2 font-serif text-base font-bold text-[#18392B]">Grade change requests</h3>
      {amendments.length === 0 ? (
        <p className="text-xs text-slate-500">No grade change requests for this term.</p>
      ) : (
        <ul className="max-h-80 space-y-2 overflow-y-auto text-xs">
          {amendments.map((a) => (
            <li key={a.id} className="space-y-1.5 rounded-xl border border-slate-200 p-3">
              <div className="flex flex-wrap justify-between gap-2">
                <span><strong>{a.studentName}</strong> ({a.studentId}) • {a.subjectCode}: <span className="font-mono">{a.previousGrade || '—'} → {a.newGrade}</span></span>
                <span className={`rounded px-2 py-0.5 text-[10px] font-bold ${a.status === 'Approved' ? 'bg-emerald-100 text-emerald-800' : a.status === 'Rejected' ? 'bg-rose-100 text-rose-800' : 'bg-amber-100 text-amber-900'}`}>{a.status}</span>
              </div>
              <p className="text-slate-600">Reason: {a.reason} — requested by {a.requestedBy}, {fmt(a.requestedAt)}</p>
              {a.decidedBy && <p className="text-slate-600">{a.status} by {a.decidedBy}, {fmt(a.decidedAt)}{a.decisionRemarks ? ` — ${a.decisionRemarks}` : ''}</p>}
              {a.status === 'Pending' && canManageCurriculum && (
                <div className="flex flex-col gap-2 sm:flex-row">
                  <input aria-label="Decision remarks" value={remarks[a.id] || ''} onChange={(e) => setRemarks((r) => ({ ...r, [a.id]: e.target.value }))} placeholder="Remarks (required to reject)" className="flex-1 rounded-lg border border-slate-300 p-1.5" />
                  <button type="button" disabled={!!busy} onClick={() => decide(a, true)} className="rounded-lg bg-emerald-600 px-3 py-1.5 font-bold text-white disabled:opacity-50">Approve</button>
                  <button type="button" disabled={!!busy} onClick={() => decide(a, false)} className="rounded-lg bg-rose-100 px-3 py-1.5 font-bold text-rose-800 disabled:opacity-50">Reject</button>
                </div>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

// Review of one grade sheet: issues, approve / return, finalize, publish, print, amendments.
const GradeReviewModal: React.FC<{ sheet: GradeSheet; term: AcademicPeriod; scale: GradingScale | null; amendments: GradeAmendment[]; onClose: () => void }> = ({ sheet, term, scale, amendments, onClose }) => {
  const { classSections, academicSubjects, students, canManageCurriculum, currentAdminUser, firebaseAuthUser, addToast } = usePCM();
  const actor = currentAdminUser?.name || 'Registrar';
  const termSections = termClassSections(term, classSections, academicSubjects, students);
  const section = termSections.find((s) => s.id === sheet.sectionId);
  const enrolledIds = section ? classListFor(section, termSections, students, term).students.map((s) => s.id) : undefined;
  const issues: SheetIssues = sheetIssues(sheet, scale, enrolledIds);
  const [remarks, setRemarks] = useState('');
  const [busy, setBusy] = useState(false);
  const [confirmFinal, setConfirmFinal] = useState(false);
  const [amendFor, setAmendFor] = useState('');
  const [amendGrade, setAmendGrade] = useState('');
  const [amendReason, setAmendReason] = useState('');
  const options = scale ? [...scale.values.map((v) => v.value), ...scale.specialCodes.map((c) => c.code)] : [];
  const nameOf = (id: string) => sheet.students.find((s) => s.studentRecordId === id)?.name || students.find((s) => s.id === id)?.fullName || id;

  const approveBlockers = [
    ...(issues.invalid.length ? [`${issues.invalid.length} grade(s) are not on the grading scale.`] : []),
    ...(issues.missing.length && !scale?.allowIncompleteSubmission ? [`${issues.missing.length} student(s) have no grade.`] : []),
    ...(issues.notEnrolled.length ? [`Not officially enrolled in ${sheet.subjectCode}: ${issues.notEnrolled.map(nameOf).join(', ')}.`] : []),
    ...(!scale ? ['The grading scale is not set up.'] : []),
  ];

  const act = async (fn: () => Promise<unknown>, ok: string) => {
    setBusy(true);
    try {
      await fn();
      addToast('success', ok, `${sheet.subjectCode} ${sheet.sectionName}`);
    } catch (e: any) {
      addToast('error', 'Not saved', e?.code === 'permission-denied' ? 'Only the Registrar, Academic Admin or an Admin can do this.' : e?.message || 'Please try again.');
    } finally {
      setBusy(false);
    }
  };

  const finalize = () =>
    act(async () => {
      if (!scale) throw new Error('Set the grading scale first.');
      if (scale.publishOnFinalize) {
        const r = await publishGradeSheet(sheet, scale, students, actor, true);
        if (r.skipped.length) addToast('warning', 'Some grades not published', r.skipped.map((x) => `${x.name}: ${x.reason}`).join('; '));
      } else {
        await finalizeGradeSheet(sheet, actor);
      }
      setConfirmFinal(false);
    }, scale?.publishOnFinalize ? 'Finalized and published' : 'Finalized');

  const publish = () =>
    act(async () => {
      if (!scale) throw new Error('Set the grading scale first.');
      const r = await publishGradeSheet(sheet, scale, students, actor, false);
      if (r.skipped.length) addToast('warning', 'Some grades not published', r.skipped.map((x) => `${x.name}: ${x.reason}`).join('; '));
    }, 'Published to students');

  const sendAmendment = () =>
    act(async () => {
      const st = sheet.students.find((s) => s.studentRecordId === amendFor);
      if (!st || !options.includes(amendGrade) || amendReason.trim().length < 5) throw new Error('Choose the student, the corrected grade and a reason.');
      await requestGradeAmendment(sheet, st, amendGrade, amendReason, { name: actor, uid: firebaseAuthUser?.uid || '' });
      setAmendFor('');
      setAmendGrade('');
      setAmendReason('');
    }, 'Grade change requested');

  const timeline: [string, string | undefined, string | undefined][] = [
    ['Last saved', sheet.savedAt, sheet.savedBy],
    ['Submitted', sheet.submittedAt, sheet.submittedBy],
    ['Review started', sheet.reviewStartedAt, sheet.reviewedBy],
    ['Returned', sheet.returnedAt, sheet.reviewedBy],
    ['Approved', sheet.approvedAt, sheet.approvedBy],
    ['Finalized', sheet.finalizedAt, sheet.finalizedBy],
    ['Published', sheet.publishedAt, sheet.publishedBy],
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 p-4" role="dialog" aria-modal="true" aria-label="Grade sheet review">
      <div className="flex max-h-[92vh] w-full max-w-4xl flex-col overflow-hidden rounded-2xl bg-white shadow-2xl">
        <div className="flex items-start justify-between gap-3 bg-[#18392B] p-4 text-white">
          <div>
            <h4 className="font-serif text-lg font-bold"><span className="font-mono">{sheet.subjectCode}</span> {sheet.subjectTitle}</h4>
            <p className="text-xs text-slate-300">{sheet.sectionName ? `${sheet.sectionName} • ` : ''}{sheet.semester}, AY {sheet.academicYear} • {sheet.instructorName}</p>
          </div>
          <button type="button" onClick={onClose} aria-label="Close" className="p-1 text-white/70 hover:text-white"><X className="h-5 w-5" /></button>
        </div>
        <div className="flex-1 space-y-4 overflow-y-auto p-5 text-xs text-slate-700">
          <div className="flex flex-wrap items-center gap-2">
            <span className={`rounded-full px-2.5 py-0.5 text-[10px] font-bold ${STAGE_STYLE[sheetStageLabel(sheet)] || 'bg-slate-100'}`}>{sheetStageLabel(sheet)}</span>
            {isOverdue(term, sheet) && <span className="rounded-full bg-rose-600 px-2 py-0.5 text-[10px] font-bold text-white">Overdue</span>}
            <span className="flex-1" />
            <button type="button" onClick={() => printDocument('pcm-grade-sheet-review', `Grade Sheet ${sheet.subjectCode}`)} className="inline-flex items-center gap-1 rounded-lg border border-slate-300 px-2.5 py-1.5 font-semibold hover:bg-slate-50"><Printer className="h-3.5 w-3.5" /> Print</button>
            <button type="button" onClick={() => downloadText(`${sheet.subjectCode}-${sheet.termKey}.csv`.replace(/[|\s]/g, '_'), gradesCsv(sheet, scale))} className="inline-flex items-center gap-1 rounded-lg border border-slate-300 px-2.5 py-1.5 font-semibold hover:bg-slate-50"><Download className="h-3.5 w-3.5" /> CSV</button>
          </div>
          <dl className="grid grid-cols-2 gap-2 rounded-xl bg-slate-50 p-3 sm:grid-cols-4">
            {timeline.filter(([, at]) => at).map(([k, at, by]) => (
              <div key={k}><dt className="text-[10px] text-slate-500">{k}</dt><dd className="font-semibold">{fmt(at)}{by ? ` • ${by}` : ''}</dd></div>
            ))}
          </dl>
          {sheet.facultyNote && <p className="rounded-lg bg-sky-50 p-2.5 text-sky-950">Professor&apos;s note: {sheet.facultyNote}</p>}
          {sheet.reviewRemarks && <p className="rounded-lg bg-slate-100 p-2.5">Review remarks: {sheet.reviewRemarks}</p>}

          {(issues.missing.length + issues.invalid.length + issues.incomplete.length + issues.notEnrolled.length + issues.notOnRoster.length > 0) && (
            <div className="rounded-xl border border-amber-200 bg-amber-50 p-3 text-amber-950">
              <p className="font-bold">Checks</p>
              <ul className="mt-1 list-disc space-y-0.5 pl-5">
                {issues.missing.length > 0 && <li>No grade: {issues.missing.map(nameOf).join(', ')}</li>}
                {issues.incomplete.length > 0 && <li>Incomplete: {issues.incomplete.map((id) => `${nameOf(id)} (${sheet.grades[id]?.grade})`).join(', ')}</li>}
                {issues.invalid.length > 0 && <li>Not on the grading scale: {issues.invalid.map((id) => `${nameOf(id)} (${sheet.grades[id]?.grade})`).join(', ')}</li>}
                {issues.notEnrolled.length > 0 && <li>Not officially enrolled in {sheet.subjectCode} any more: {issues.notEnrolled.map(nameOf).join(', ')}</li>}
                {issues.notOnRoster.length > 0 && <li>Enrolled but not on this sheet: {issues.notOnRoster.map(nameOf).join(', ')} (refresh the class list while the sheet is with the professor)</li>}
              </ul>
            </div>
          )}

          <div className="overflow-x-auto">
            <table className="w-full min-w-[640px] text-left">
              <thead className="bg-slate-50 text-[10px] uppercase text-slate-500">
                <tr><th className="p-2">Student ID</th><th className="p-2">Name</th><th className="p-2">Program / year</th><th className="p-2">Grade</th><th className="p-2">Equivalent</th><th className="p-2">Remark</th><th className="p-2">Note</th></tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {sheet.students.map((s) => {
                  const g = sheet.grades?.[s.studentRecordId];
                  const l = lookupGrade(scale, g?.grade);
                  const flag = issues.notEnrolled.includes(s.studentRecordId) || l.kind === 'invalid';
                  return (
                    <tr key={s.studentRecordId} className={flag ? 'bg-rose-50' : l.kind === 'blank' || l.incomplete ? 'bg-amber-50/60' : ''}>
                      <td className="p-2 font-mono">{s.studentId}</td>
                      <td className="p-2 font-semibold">{s.name}</td>
                      <td className="p-2 text-slate-600">{s.program}{s.yearLevel ? ` • ${s.yearLevel}` : ''}</td>
                      <td className="p-2 font-mono font-bold">{g?.grade || '—'}</td>
                      <td className="p-2">{l.equivalent || ''}</td>
                      <td className="p-2">{l.kind === 'blank' ? 'No grade' : l.kind === 'invalid' ? 'Not on the scale' : l.remark}</td>
                      <td className="p-2 text-slate-600">{g?.note || ''}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {(sheet.amendmentLog || []).length > 0 && (
            <div className="rounded-xl border border-slate-200 p-3">
              <p className="mb-1 flex items-center gap-1.5 font-bold text-[#18392B]"><FileSpreadsheet className="h-4 w-4" /> Amendment audit trail</p>
              <ul className="space-y-1">
                {(sheet.amendmentLog || []).map((l) => (
                  <li key={l.amendmentId}>{fmt(l.approvedAt)} • {l.studentId}: {l.previousGrade || '—'} → {l.newGrade} • requested by {l.requestedBy}, approved by {l.approvedBy} • “{l.reason}”</li>
                ))}
              </ul>
            </div>
          )}

          {sheet.status === 'Finalized' && canManageCurriculum && (
            <div className="space-y-2 rounded-xl border border-slate-200 p-3">
              <p className="font-bold text-[#18392B]">Request a grade change (amendment)</p>
              <div className="grid grid-cols-1 gap-2 sm:grid-cols-[1fr_7rem]">
                <select aria-label="Student to amend" value={amendFor} onChange={(e) => setAmendFor(e.target.value)} className="rounded-lg border border-slate-300 p-1.5">
                  <option value="">Choose student…</option>
                  {sheet.students.map((s) => <option key={s.studentRecordId} value={s.studentRecordId}>{s.name} ({sheet.grades?.[s.studentRecordId]?.grade || '—'})</option>)}
                </select>
                <select aria-label="Corrected grade" value={amendGrade} onChange={(e) => setAmendGrade(e.target.value)} className="rounded-lg border border-slate-300 p-1.5 font-mono">
                  <option value="">Grade…</option>
                  {options.map((o) => <option key={o}>{o}</option>)}
                </select>
              </div>
              <textarea aria-label="Reason for the change" rows={2} value={amendReason} onChange={(e) => setAmendReason(e.target.value)} placeholder="Reason (kept in the audit trail)" className="w-full rounded-lg border border-slate-300 p-2" />
              <button type="button" disabled={busy} onClick={sendAmendment} className="rounded-lg bg-slate-800 px-3 py-1.5 font-bold text-white disabled:opacity-50">Request change</button>
              {amendments.some((a) => a.status === 'Pending') && <p className="text-[11px] text-slate-500">Pending requests are decided in “Grade change requests”.</p>}
            </div>
          )}

          {['Under Review', 'Approved', 'Submitted'].includes(sheet.status) && canManageCurriculum && (
            <label className="block space-y-1">
              <span className="font-semibold">Remarks to the professor (required when returning)</span>
              <textarea rows={2} value={remarks} onChange={(e) => setRemarks(e.target.value)} className="w-full rounded-lg border border-slate-300 p-2" />
            </label>
          )}
          {sheet.status === 'Under Review' && approveBlockers.length > 0 && (
            <p className="flex gap-2 rounded-lg border border-rose-200 bg-rose-50 p-2.5 text-rose-900"><AlertTriangle className="h-4 w-4 shrink-0" /> Cannot approve: {approveBlockers.join(' ')}</p>
          )}
          {confirmFinal && (
            <div className="space-y-2 rounded-xl border border-emerald-300 bg-emerald-50 p-3 text-emerald-950">
              <p className="font-bold">Finalize {sheet.subjectCode}?</p>
              <p>
                The sheet will be locked; later changes need an approved amendment.{' '}
                {scale?.publishOnFinalize ? 'The grades will be published to the students’ records now.' : 'Publish the grades to students separately afterwards.'}
              </p>
              <div className="flex gap-2">
                <button type="button" onClick={() => setConfirmFinal(false)} className="rounded-lg px-3 py-1.5 font-semibold hover:bg-white">Cancel</button>
                <button type="button" disabled={busy} onClick={finalize} className="rounded-lg bg-emerald-700 px-3 py-1.5 font-bold text-white disabled:opacity-50">Finalize{scale?.publishOnFinalize ? ' & publish' : ''}</button>
              </div>
            </div>
          )}
        </div>

        <div className="flex flex-wrap items-center justify-end gap-2 border-t border-slate-200 bg-slate-50 p-4 text-xs">
          {!canManageCurriculum && <span className="mr-auto text-slate-500">Only the Registrar, Academic Admin or an Admin can review grades.</span>}
          {['Draft', 'Returned for Correction'].includes(sheet.status) && <span className="mr-auto text-slate-500">With the professor ({sheet.status === 'Draft' ? 'not submitted yet' : 'returned for correction'}).</span>}
          {canManageCurriculum && sheet.status === 'Submitted' && (
            <button type="button" disabled={busy} onClick={() => act(() => setSheetStatus(sheet, 'Under Review', actor), 'Review started')} className="rounded-xl bg-indigo-600 px-4 py-2 font-bold text-white disabled:opacity-50">Start review</button>
          )}
          {canManageCurriculum && ['Under Review', 'Approved'].includes(sheet.status) && (
            <button
              type="button"
              disabled={busy}
              onClick={() => {
                if (!remarks.trim()) return addToast('warning', 'Add remarks', 'Tell the professor what to correct.');
                act(() => setSheetStatus(sheet, 'Returned for Correction', actor, remarks.trim()), 'Returned to the professor');
              }}
              className="rounded-xl bg-rose-100 px-4 py-2 font-bold text-rose-800 disabled:opacity-50"
            >
              Return for correction
            </button>
          )}
          {canManageCurriculum && sheet.status === 'Under Review' && (
            <button type="button" disabled={busy || approveBlockers.length > 0} onClick={() => act(() => setSheetStatus(sheet, 'Approved', actor, remarks.trim()), 'Grades approved')} className="rounded-xl bg-emerald-600 px-4 py-2 font-bold text-white disabled:opacity-40">
              Approve
            </button>
          )}
          {canManageCurriculum && sheet.status === 'Approved' && !confirmFinal && (
            <button type="button" disabled={busy || issues.notEnrolled.length > 0} onClick={() => setConfirmFinal(true)} className="inline-flex items-center gap-1 rounded-xl bg-emerald-800 px-4 py-2 font-bold text-white disabled:opacity-40">
              <CheckCircle2 className="h-4 w-4" /> Finalize
            </button>
          )}
          {canManageCurriculum && sheet.status === 'Finalized' && !sheet.publishedAt && (
            <button type="button" disabled={busy} onClick={publish} className="rounded-xl bg-emerald-800 px-4 py-2 font-bold text-white disabled:opacity-50">Publish to students</button>
          )}
        </div>
      </div>
      <div className="hidden"><GradeSheetDocument sheet={sheet} scale={scale} id="pcm-grade-sheet-review" /></div>
    </div>
  );
};
