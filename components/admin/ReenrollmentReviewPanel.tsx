'use client';

import React, { useState } from 'react';
import { AlertTriangle, CheckCircle2, Download, XCircle } from 'lucide-react';
import { usePCM } from '@/lib/store';
import { YEAR_LEVELS } from '@/lib/curriculum';
import {
  approvalBlockers,
  documentChecklist,
  reenrollmentRules,
  reenrollmentStatusLabel,
  reviewReenrollmentDocument,
  termKeyOf,
  termLabel,
  termStillOpen,
  useReenrollmentDocuments,
} from '@/lib/reenrollment';
import type { OnlineEnrollment, ReenrollmentClearance } from '@/lib/types';

const peso = (n: number) => `₱${(Number(n) || 0).toLocaleString('en-PH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

// Registrar review of a returning student's re-enrollment: standing, clearances, documents,
// year level, then approve (only when every mandatory requirement is verified).
export const ReenrollmentReviewPanel: React.FC<{ enrollment: OnlineEnrollment; onReturn: () => void; onClose: () => void }> = ({ enrollment: e, onReturn, onClose }) => {
  const {
    students,
    academicPeriods,
    enrollmentSystemConfig,
    canManageEnrollment,
    currentAdminUser,
    addToast,
    setReenrollmentClearance,
    setReenrollmentYearLevel,
    markReenrollmentNotEligible,
    approveEnrollment,
  } = usePCM();
  const student = students.find((s) => s.id === e.studentRecordId || s.studentId === e.studentId);
  const rules = reenrollmentRules(enrollmentSystemConfig);
  const { docs } = useReenrollmentDocuments(e.id);
  const checklist = documentChecklist(rules.documents, docs);
  const period = academicPeriods.find((p) => termKeyOf(p.semester, p.academicYear) === termKeyOf(e.semester, e.schoolYear));
  const label = termLabel(e.semester, e.schoolYear);
  const decided = ['Approved', 'Not Eligible', 'Rejected'].includes(String(e.status));

  const [yl, setYl] = useState(e.approvedYearLevel || e.yearLevel);
  const [remarks, setRemarks] = useState<Record<string, string>>({});
  const [notEligible, setNotEligible] = useState('');
  const [askNotEligible, setAskNotEligible] = useState(false);
  const [busy, setBusy] = useState('');

  const blockers = [
    ...approvalBlockers(e, rules, checklist),
    ...(student && termStillOpen(student, label) ? [`Close ${student.currentSemester} first (the student is still enrolled in it).`] : []),
    ...(period?.capacity && (period.enrolledCount || 0) >= period.capacity ? [`${label} is at capacity (${period.capacity}).`] : []),
    ...(!student ? ['Student record not found.'] : []),
  ];

  const run = async (key: string, fn: () => Promise<unknown>) => {
    setBusy(key);
    try {
      await fn();
    } finally {
      setBusy('');
    }
  };
  const actor = currentAdminUser?.name || 'Registrar';

  const clearanceRow = (kind: 'academic' | 'financial', title: string, detail: string) => {
    const c: ReenrollmentClearance | undefined = e.clearances?.[kind];
    const required = kind === 'academic' ? rules.requireAcademicClearance : rules.requireFinancialClearance;
    if (!required) return null;
    const set = (status: ReenrollmentClearance['status']) => {
      const r = (remarks[kind] || '').trim();
      if (status === 'Not Cleared' && !r) {
        addToast('warning', 'Add a remark', 'Tell the student what is needed for this clearance.');
        return;
      }
      run(kind + status, () => setReenrollmentClearance(e.id, kind, status, r));
    };
    return (
      <li className="space-y-2 rounded-xl border border-slate-200 p-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <span>
            <strong className="text-slate-900">{title}</strong>
            <span className="block text-[11px] text-slate-500">{detail}</span>
          </span>
          <span className={`rounded px-2 py-0.5 font-mono text-[10px] font-bold ${c?.status === 'Cleared' ? 'bg-emerald-100 text-emerald-800' : c?.status === 'Not Cleared' ? 'bg-rose-100 text-rose-800' : 'bg-amber-100 text-amber-900'}`}>
            {c?.status || 'Pending'}
          </span>
        </div>
        {c?.by && <p className="text-[11px] text-slate-500">{c.status} by {c.by}{c.at ? ` on ${c.at.slice(0, 10)}` : ''}{c.remarks ? ` — ${c.remarks}` : ''}</p>}
        {!decided && canManageEnrollment && (
          <div className="flex flex-col gap-2 sm:flex-row">
            <input
              value={remarks[kind] || ''}
              onChange={(ev) => setRemarks((r) => ({ ...r, [kind]: ev.target.value }))}
              placeholder="Remarks (required when not cleared)"
              aria-label={`${title} remarks`}
              className="flex-1 rounded-lg border border-slate-300 p-1.5"
            />
            <button type="button" disabled={!!busy} onClick={() => set('Cleared')} className="rounded-lg bg-emerald-600 px-3 py-1.5 font-bold text-white hover:bg-emerald-700 disabled:opacity-50">
              Cleared
            </button>
            <button type="button" disabled={!!busy} onClick={() => set('Not Cleared')} className="rounded-lg bg-rose-100 px-3 py-1.5 font-bold text-rose-800 hover:bg-rose-200 disabled:opacity-50">
              Not cleared
            </button>
          </div>
        )}
      </li>
    );
  };

  return (
    <>
      <div className="flex-1 space-y-4 overflow-y-auto p-6 text-xs text-slate-700">
        <div className="flex flex-wrap items-center gap-2">
          <span className="rounded-full bg-[#18392B] px-2.5 py-0.5 text-[10px] font-bold text-white">Returning student</span>
          <span className="rounded-full border border-slate-300 px-2.5 py-0.5 text-[10px] font-bold">{reenrollmentStatusLabel(e)}</span>
          <span className="text-slate-500">{label}</span>
        </div>

        <div className="grid grid-cols-2 gap-3 rounded-xl bg-slate-50 p-3 sm:grid-cols-4">
          {[
            ['Student ID', e.studentId],
            ['Program', e.programTitle || e.programName],
            ['Requested year level', `${e.yearLevel}${e.suggestedYearLevel && e.suggestedYearLevel !== e.yearLevel ? ` (suggested ${e.suggestedYearLevel})` : ''}`],
            ['Load', `${e.selectedSubjects?.length || 0} subjects, ${e.totalUnits} units`],
            ['Current year level', student?.yearLevel],
            ['Academic status', student?.academicStatus],
            ['Balance', student ? peso(Number(student.tuitionBalance) || 0) : '—'],
            ['Last enrolled', student?.lastEnrolledTerm || student?.currentSemester],
          ].map(([k, v]) => (
            <div key={String(k)}>
              <span className="block text-[10px] text-slate-400">{k}</span>
              <span className="font-bold text-slate-800">{v || '—'}</span>
            </div>
          ))}
        </div>

        {student?.enrollmentHold?.active && (
          <p className="flex gap-2 rounded-lg border border-rose-200 bg-rose-50 p-2.5 text-rose-900">
            <XCircle className="h-4 w-4 shrink-0" /> Enrollment hold: {student.enrollmentHold.reason}
          </p>
        )}
        {(e.eligibilityFlags || []).length > 0 && (
          <div className="rounded-xl border border-amber-200 bg-amber-50 p-3 text-amber-950">
            <p className="font-bold">Check before approving</p>
            <ul className="mt-1 list-disc space-y-0.5 pl-5">
              {(e.eligibilityFlags || []).map((f) => (
                <li key={f}>{f}</li>
              ))}
            </ul>
          </div>
        )}

        <div className="space-y-1">
          <span className="block font-bold text-slate-900">Subjects</span>
          <div className="divide-y divide-slate-100 rounded-lg border border-slate-200 p-2">
            {(e.selectedSubjects || []).map((s) => (
              <div key={s.code} className="flex justify-between gap-2 py-1.5">
                <span className="font-mono font-bold text-[#18392B]">
                  {s.code} – <span className="font-sans font-normal text-slate-700">{s.title}</span>
                </span>
                <span className="font-mono">{s.units}u</span>
              </div>
            ))}
          </div>
          <p className="text-[11px] text-slate-500">Estimated assessment {peso(e.estimatedTuition)}; the official assessment is issued on approval.</p>
        </div>

        <div className="space-y-2 rounded-xl border border-slate-200 p-3">
          <label className="block font-bold text-slate-900" htmlFor={`yl-${e.id}`}>
            Year level for {label}
          </label>
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
            <select id={`yl-${e.id}`} value={yl} disabled={decided || !canManageEnrollment} onChange={(ev) => setYl(ev.target.value)} className="rounded-lg border border-slate-300 p-1.5 sm:w-48">
              {Array.from(new Set([e.yearLevel, ...YEAR_LEVELS])).map((y) => (
                <option key={y} value={y}>
                  {y}
                </option>
              ))}
            </select>
            {!decided && canManageEnrollment && (
              <button type="button" disabled={!!busy} onClick={() => run('yl', () => setReenrollmentYearLevel(e.id, yl))} className="rounded-lg bg-[#18392B] px-3 py-1.5 font-bold text-white hover:bg-[#588B76] disabled:opacity-50">
                Confirm year level
              </button>
            )}
            <span className={e.approvedYearLevel ? 'font-semibold text-emerald-800' : 'text-amber-800'}>
              {e.approvedYearLevel ? `Confirmed: ${e.approvedYearLevel}` : 'Not confirmed yet'}
            </span>
          </div>
        </div>

        <ul className="space-y-2">
          {clearanceRow('academic', 'Academic clearance', 'Grades complete, no academic holds or deficiencies.')}
          {clearanceRow('financial', 'Financial clearance', `Current balance ${peso(Number(student?.tuitionBalance) || 0)}.`)}
          {checklist.map((d) => (
            <li key={d.id} className="space-y-2 rounded-xl border border-slate-200 p-3">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <span className="min-w-0">
                  <strong className="text-slate-900">{d.name}</strong>
                  {!d.required && <span className="ml-1 text-[10px] font-bold uppercase text-slate-400">Optional</span>}
                  <span className="block truncate text-[11px] text-slate-500">{d.fileName || 'Not uploaded yet'}</span>
                </span>
                <span className="flex items-center gap-2">
                  {d.fileDataUrl && (
                    <a href={d.fileDataUrl} download={d.fileName || d.name} className="inline-flex items-center gap-1 rounded-lg border border-slate-300 px-2 py-1 font-semibold hover:bg-slate-50">
                      <Download className="h-3.5 w-3.5" /> File
                    </a>
                  )}
                  <span className={`rounded px-2 py-0.5 font-mono text-[10px] font-bold ${d.status === 'Verified' ? 'bg-emerald-100 text-emerald-800' : d.status === 'Rejected' ? 'bg-rose-100 text-rose-800' : d.status === 'Submitted' ? 'bg-sky-100 text-sky-900' : 'bg-amber-100 text-amber-900'}`}>
                    {d.status}
                  </span>
                </span>
              </div>
              {d.reviewedBy && <p className="text-[11px] text-slate-500">{d.status} by {d.reviewedBy}{d.remarks ? ` — ${d.remarks}` : ''}</p>}
              {!decided && canManageEnrollment && d.status === 'Submitted' && (
                <div className="flex flex-col gap-2 sm:flex-row">
                  <input
                    value={remarks[d.id] || ''}
                    onChange={(ev) => setRemarks((r) => ({ ...r, [d.id]: ev.target.value }))}
                    placeholder="Remarks (required when returning)"
                    aria-label={`${d.name} remarks`}
                    className="flex-1 rounded-lg border border-slate-300 p-1.5"
                  />
                  <button type="button" disabled={!!busy} onClick={() => run(d.id, () => reviewReenrollmentDocument(e.id, d.id, 'Verified', actor, (remarks[d.id] || '').trim()))} className="rounded-lg bg-emerald-600 px-3 py-1.5 font-bold text-white hover:bg-emerald-700 disabled:opacity-50">
                    Verify
                  </button>
                  <button
                    type="button"
                    disabled={!!busy}
                    onClick={() => {
                      const r = (remarks[d.id] || '').trim();
                      if (!r) return addToast('warning', 'Add a remark', 'Tell the student why the document is returned.');
                      run(d.id, () => reviewReenrollmentDocument(e.id, d.id, 'Rejected', actor, r));
                    }}
                    className="rounded-lg bg-rose-100 px-3 py-1.5 font-bold text-rose-800 hover:bg-rose-200 disabled:opacity-50"
                  >
                    Return
                  </button>
                </div>
              )}
            </li>
          ))}
        </ul>

        {!decided && (
          blockers.length ? (
            <div className="rounded-xl border border-amber-200 bg-amber-50 p-3 text-amber-950">
              <p className="flex items-center gap-1.5 font-bold"><AlertTriangle className="h-4 w-4" /> Not ready to approve</p>
              <ul className="mt-1 list-disc space-y-0.5 pl-5">
                {blockers.map((b) => (
                  <li key={b}>{b}</li>
                ))}
              </ul>
            </div>
          ) : (
            <p className="flex items-center gap-1.5 rounded-xl border border-emerald-200 bg-emerald-50 p-3 font-semibold text-emerald-900">
              <CheckCircle2 className="h-4 w-4" /> All requirements are verified. Approving enrolls the student in {label} as {e.approvedYearLevel}.
            </p>
          )
        )}
        {e.adminRemarks && decided && <p className="rounded-lg bg-slate-100 p-2.5">Registrar&apos;s note: {e.adminRemarks}</p>}

        {askNotEligible && (
          <div className="space-y-2 rounded-xl border border-rose-200 bg-rose-50 p-3">
            <label className="block font-bold text-rose-900" htmlFor={`ne-${e.id}`}>Reason the student is not eligible (sent to the student)</label>
            <textarea id={`ne-${e.id}`} rows={2} value={notEligible} onChange={(ev) => setNotEligible(ev.target.value)} className="w-full rounded-lg border border-rose-300 p-2" />
            <div className="flex justify-end gap-2">
              <button type="button" onClick={() => setAskNotEligible(false)} className="rounded-lg px-3 py-1.5 font-semibold text-slate-600 hover:bg-white">Cancel</button>
              <button
                type="button"
                disabled={!notEligible.trim() || !!busy}
                onClick={() => run('ne', async () => { if (await markReenrollmentNotEligible(e.id, notEligible.trim())) setAskNotEligible(false); })}
                className="rounded-lg bg-rose-700 px-3 py-1.5 font-bold text-white hover:bg-rose-800 disabled:opacity-50"
              >
                Mark not eligible
              </button>
            </div>
          </div>
        )}
      </div>

      <div className="flex flex-wrap items-center justify-between gap-2 border-t border-slate-200 bg-slate-50 p-4 text-xs">
        {decided ? (
          <button type="button" onClick={onClose} className="ml-auto rounded-xl bg-slate-200 px-4 py-2 font-semibold text-slate-800 hover:bg-slate-300">Close</button>
        ) : (
          <>
            <div className="flex gap-2">
              <button type="button" disabled={!canManageEnrollment} onClick={onReturn} className="rounded-xl bg-rose-100 px-4 py-2 font-semibold text-rose-800 hover:bg-rose-200 disabled:opacity-40">
                Return for revision
              </button>
              <button type="button" disabled={!canManageEnrollment} onClick={() => setAskNotEligible(true)} className="rounded-xl border border-rose-300 px-4 py-2 font-semibold text-rose-800 hover:bg-rose-50 disabled:opacity-40">
                Not eligible
              </button>
            </div>
            <button
              type="button"
              disabled={!canManageEnrollment || blockers.length > 0 || !!busy}
              title={blockers.length ? blockers.join(' ') : undefined}
              onClick={() => run('approve', () => approveEnrollment(e.id))}
              className="rounded-xl bg-emerald-600 px-4 py-2 font-bold text-white hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-40"
            >
              {busy === 'approve' ? 'Approving…' : 'Approve & enroll'}
            </button>
          </>
        )}
      </div>
    </>
  );
};
