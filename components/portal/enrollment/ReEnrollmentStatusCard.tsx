'use client';

import React, { useRef, useState } from 'react';
import { AlertCircle, CalendarClock, CheckCircle2, Clock, FileUp, Info, RefreshCcw, XCircle } from 'lucide-react';
import { usePCM } from '@/lib/store';
import { useToday } from '@/lib/useToday';
import { prepareRequirementFile } from '@/lib/admissionsService';
import {
  displayTerm,
  windowNote,
  documentChecklist,
  enrollmentWindowOpen,
  reenrollmentEligibility,
  reenrollmentRules,
  reenrollmentStatusLabel,
  requestForTerm,
  termLabel,
  uploadReenrollmentDocument,
  useReenrollmentDocuments,
  type ReenrollmentDocument,
} from '@/lib/reenrollment';

const fmtDate = (d?: string) => (d ? new Date(`${d}T00:00:00`).toLocaleDateString('en-PH', { month: 'short', day: 'numeric', year: 'numeric' }) : '');

const STATUS_STYLE: Record<string, string> = {
  'Pending Requirements': 'bg-amber-100 text-amber-900 border-amber-300',
  'For Verification': 'bg-sky-100 text-sky-900 border-sky-300',
  Enrolled: 'bg-emerald-100 text-emerald-900 border-emerald-300',
  'Not Eligible': 'bg-rose-100 text-rose-800 border-rose-300',
  'Returned for Correction': 'bg-rose-100 text-rose-800 border-rose-300',
};

// The next term and the student's re-enrollment for it: status, requirements and uploads.
export const ReEnrollmentStatusCard: React.FC<{ onStart: () => void }> = ({ onStart }) => {
  const { studentProfile, academicPeriods, enrollments, enrollmentSystemConfig, firebaseAuthUser, sendReenrollmentForVerification, addToast } = usePCM();
  // Live from Academic Terms; the date check follows Philippine time and updates at midnight.
  const today = useToday();
  const term = displayTerm(academicPeriods, today);
  const open = term ? enrollmentWindowOpen(term, today) : false;
  const eligibility = reenrollmentEligibility(studentProfile, open ? term : null, enrollments);
  const request = eligibility.request || (term ? requestForTerm(enrollments, studentProfile, term) : undefined);
  const rules = reenrollmentRules(enrollmentSystemConfig);
  const { docs } = useReenrollmentDocuments(request?.reenrollment && firebaseAuthUser ? request.id : null, firebaseAuthUser?.uid);
  const checklist = documentChecklist(rules.documents, docs);
  const [busyDoc, setBusyDoc] = useState('');
  const [sending, setSending] = useState(false);
  const fileRefs = useRef<Record<string, HTMLInputElement | null>>({});

  if (!term) return null;
  const label = termLabel(term.semester, term.academicYear);
  const status = request ? reenrollmentStatusLabel(request) : eligibility.state === 'Enrolled' ? 'Enrolled' : '';
  const canUpload = !!request && ['Pending Requirements', 'Returned for Correction', 'Draft'].includes(String(request.status));
  const missingRequired = checklist.filter((d) => d.required && !['Submitted', 'Verified'].includes(d.status));

  const upload = async (d: ReenrollmentDocument, file?: File | null) => {
    if (!file || !request || !firebaseAuthUser) return;
    setBusyDoc(d.id);
    try {
      const prepared = await prepareRequirementFile(file);
      await uploadReenrollmentDocument(request.id, d, firebaseAuthUser.uid, prepared, d);
      addToast('success', 'Document uploaded', `${d.name} was uploaded.`);
    } catch (e: any) {
      addToast('error', 'Upload failed', e?.message && !String(e.message).includes('permission') ? e.message : 'The document could not be uploaded. Please try again.');
    } finally {
      setBusyDoc('');
      const input = fileRefs.current[d.id];
      if (input) input.value = '';
    }
  };

  const send = async () => {
    if (!request) return;
    if (missingRequired.length) {
      addToast('warning', 'Documents missing', `Upload: ${missingRequired.map((d) => d.name).join(', ')}.`);
      return;
    }
    setSending(true);
    try {
      await sendReenrollmentForVerification(request.id);
    } finally {
      setSending(false);
    }
  };

  const clearance = (name: string, required: boolean, c?: { status: string; remarks?: string }) =>
    required && (
      <li className="flex items-start justify-between gap-2 rounded-lg border border-slate-200 bg-white p-2.5">
        <span>
          <strong className="text-slate-900">{name}</strong>
          <span className="block text-[11px] text-slate-500">{c?.remarks || 'Verified by staff — nothing to upload.'}</span>
        </span>
        <span className={`shrink-0 rounded px-2 py-0.5 font-mono text-[10px] font-bold ${c?.status === 'Cleared' ? 'bg-emerald-100 text-emerald-800' : c?.status === 'Not Cleared' ? 'bg-rose-100 text-rose-800' : 'bg-amber-100 text-amber-900'}`}>
          {c?.status || 'Pending'}
        </span>
      </li>
    );

  return (
    <section className="space-y-4 rounded-2xl border-2 border-[#588B76]/40 bg-white p-6 shadow-xs" data-testid="reenrollment-card" aria-label="Re-enrollment">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <span className="flex items-center gap-1.5 text-[11px] font-mono font-bold uppercase text-[#588B76]">
            <RefreshCcw className="h-3.5 w-3.5" /> Re-enrollment
          </span>
          <h3 className="font-serif text-xl font-bold text-[#18392B]">{label}</h3>
          <p className="flex items-center gap-1.5 text-xs text-slate-600">
            <CalendarClock className="h-3.5 w-3.5" />
            {term.enrollmentStartDate || term.enrollmentEndDate
              ? `Enrollment: ${fmtDate(term.enrollmentStartDate) || '—'} to ${fmtDate(term.enrollmentEndDate) || '—'}`
              : 'Enrollment dates to be announced'}
            {' • '}
            <strong className={open ? 'text-emerald-700' : 'text-slate-500'}>{open ? 'Open' : 'Closed'}</strong>
          </p>
        </div>
        {status ? (
          <span className={`self-start rounded-full border px-3 py-1 text-xs font-bold ${STATUS_STYLE[status] || 'bg-slate-100 text-slate-700 border-slate-300'}`}>{status}</span>
        ) : open && eligibility.state === 'Eligible' ? (
          <button type="button" onClick={onStart} className="self-start rounded-xl bg-[#18392B] px-4 py-2.5 text-xs font-bold text-white hover:bg-[#588B76]">
            Start re-enrollment
          </button>
        ) : null}
      </div>

      {term.announcement && (
        <p className="flex gap-2 rounded-xl border border-sky-200 bg-sky-50 p-3 text-xs text-sky-900">
          <Info className="h-4 w-4 shrink-0" /> {term.announcement}
        </p>
      )}

      {!open && !request && (
        <p className="text-xs text-slate-600">
          Enrollment for this term is not open: {windowNote(term.enrollmentStatus, term.enrollmentStartDate, term.enrollmentEndDate, today)} This page updates
          automatically when the Registrar opens it.
        </p>
      )}

      {eligibility.state === 'Not Eligible' && (
        <div className="rounded-xl border border-rose-200 bg-rose-50 p-3 text-xs text-rose-900">
          <p className="flex items-center gap-1.5 font-bold"><XCircle className="h-4 w-4" /> You cannot re-enroll yet</p>
          <ul className="mt-1 list-disc space-y-0.5 pl-5">
            {eligibility.blockers.map((b) => (
              <li key={b}>{b}</li>
            ))}
          </ul>
          <p className="mt-1">Please contact the Office of the Registrar.</p>
        </div>
      )}

      {request && (
        <div className="space-y-3 text-xs">
          <p className="text-slate-600">
            Request <strong className="font-mono">{request.referenceNumber}</strong> • {request.yearLevel} • {request.selectedSubjects?.length || 0} subjects ({request.totalUnits} units)
          </p>
          {request.adminRemarks && ['Returned for Correction', 'Not Eligible', 'Rejected'].includes(String(request.status)) && (
            <p className="flex gap-2 rounded-lg border border-rose-200 bg-rose-50 p-2.5 text-rose-900">
              <AlertCircle className="h-4 w-4 shrink-0" /> Registrar&apos;s note: {request.adminRemarks}
            </p>
          )}
          {status === 'Pending Requirements' && <p className="rounded-lg bg-amber-50 p-2.5 text-amber-950">Upload the required documents below, then send your request for verification.</p>}
          {status === 'For Verification' && (
            <p className="flex items-center gap-1.5 rounded-lg bg-sky-50 p-2.5 text-sky-950"><Clock className="h-4 w-4" /> The Registrar is verifying your requirements.</p>
          )}
          {status === 'Enrolled' && (
            <p className="flex items-center gap-1.5 rounded-lg bg-emerald-50 p-2.5 text-emerald-950"><CheckCircle2 className="h-4 w-4" /> You are officially enrolled for {label}.</p>
          )}

          {request.reenrollment && (
            <ul className="space-y-2">
              {clearance('Academic clearance', rules.requireAcademicClearance, request.clearances?.academic)}
              {clearance('Financial clearance', rules.requireFinancialClearance, request.clearances?.financial)}
              {checklist.map((d) => (
                <li key={d.id} className="flex flex-col gap-2 rounded-lg border border-slate-200 bg-white p-2.5 sm:flex-row sm:items-center sm:justify-between">
                  <span className="min-w-0">
                    <strong className="text-slate-900">{d.name}</strong>
                    {!d.required && <span className="ml-1 text-[10px] font-bold uppercase text-slate-400">Optional</span>}
                    <span className="block truncate text-[11px] text-slate-500">
                      {d.status === 'Rejected' && d.remarks ? `Returned: ${d.remarks}` : d.fileName || d.description || 'Not uploaded yet'}
                    </span>
                  </span>
                  <span className="flex shrink-0 items-center gap-2">
                    <span className={`rounded px-2 py-0.5 font-mono text-[10px] font-bold ${d.status === 'Verified' ? 'bg-emerald-100 text-emerald-800' : d.status === 'Rejected' ? 'bg-rose-100 text-rose-800' : d.status === 'Submitted' ? 'bg-sky-100 text-sky-900' : 'bg-amber-100 text-amber-900'}`}>
                      {d.status}
                    </span>
                    {canUpload && d.status !== 'Verified' && (
                      <>
                        <input
                          ref={(el) => {
                            fileRefs.current[d.id] = el;
                          }}
                          type="file"
                          accept="image/*,application/pdf"
                          className="hidden"
                          aria-label={`Upload ${d.name}`}
                          onChange={(e) => upload(d, e.target.files?.[0])}
                        />
                        <button
                          type="button"
                          disabled={busyDoc === d.id}
                          onClick={() => fileRefs.current[d.id]?.click()}
                          className="inline-flex items-center gap-1 rounded-lg border border-[#588B76] px-2.5 py-1 font-semibold text-[#18392B] hover:bg-emerald-50 disabled:opacity-50"
                        >
                          <FileUp className="h-3.5 w-3.5" /> {busyDoc === d.id ? 'Uploading…' : d.status === 'Missing' ? 'Upload' : 'Replace'}
                        </button>
                      </>
                    )}
                  </span>
                </li>
              ))}
            </ul>
          )}

          {canUpload && (
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={send}
                disabled={sending}
                className="rounded-xl bg-emerald-700 px-4 py-2 font-bold text-white hover:bg-emerald-800 disabled:opacity-50"
              >
                {sending ? 'Sending…' : 'Send for verification'}
              </button>
              {request.status === 'Returned for Correction' && open && (
                <button type="button" onClick={onStart} className="rounded-xl border border-[#588B76] px-4 py-2 font-bold text-[#18392B] hover:bg-emerald-50">
                  Revise year level &amp; subjects
                </button>
              )}
            </div>
          )}
        </div>
      )}
    </section>
  );
};
