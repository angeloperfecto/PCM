'use client';

import React, { useRef, useState } from 'react';
import { CheckCircle2, FileText, Upload, XCircle, Clock, AlertCircle, Eye, RefreshCw } from 'lucide-react';
import type { ApplicationRequirement } from '@/lib/enrollmentWorkflow';
import { summarizeRequirements } from '@/lib/enrollmentWorkflow';

type Mode = 'applicant' | 'staff';

interface Props {
  mode: Mode;
  requirements: ApplicationRequirement[];
  // Applicant: upload or replace a document.
  onUpload?: (req: ApplicationRequirement, file: File) => Promise<{ ok: boolean; message: string }>;
  // Staff: verify or reject a submitted document.
  onReview?: (req: ApplicationRequirement, verdict: 'Verified' | 'Rejected', remarks: string) => Promise<{ ok: boolean; message: string }>;
  readOnly?: boolean;
}

const statusStyle: Record<string, string> = {
  Missing: 'bg-slate-100 text-slate-700 border-slate-300',
  Submitted: 'bg-blue-50 text-blue-800 border-blue-200',
  Verified: 'bg-emerald-50 text-emerald-800 border-emerald-200',
  Rejected: 'bg-rose-50 text-rose-800 border-rose-200',
};

const statusLabel: Record<string, string> = {
  Missing: 'Not submitted',
  Submitted: 'Awaiting review',
  Verified: 'Verified',
  Rejected: 'Needs replacement',
};

export const RequirementsChecklist: React.FC<Props> = ({ mode, requirements, onUpload, onReview, readOnly }) => {
  const summary = summarizeRequirements(requirements);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<Record<string, { ok: boolean; message: string }>>({});
  const [remarks, setRemarks] = useState<Record<string, string>>({});
  const inputs = useRef<Record<string, HTMLInputElement | null>>({});

  const run = async (id: string, action: () => Promise<{ ok: boolean; message: string }>) => {
    setBusyId(id);
    setFeedback((f) => ({ ...f, [id]: undefined as any }));
    try {
      const result = await action();
      setFeedback((f) => ({ ...f, [id]: result }));
    } catch (e: any) {
      setFeedback((f) => ({ ...f, [id]: { ok: false, message: e?.message || 'Something went wrong. Please try again.' } }));
    } finally {
      setBusyId(null);
    }
  };

  // Opens the stored file in a new tab. Built with DOM APIs (not innerHTML) because the
  // file name and data come from the applicant.
  const openFile = (req: ApplicationRequirement) => {
    const dataUrl = req.fileDataUrl || '';
    if (!/^data:(application\/pdf|image\/(jpeg|png|webp));base64,/.test(dataUrl)) return;
    const w = window.open('', '_blank');
    if (!w) return;
    w.opener = null;
    w.document.title = req.fileName || req.name;
    w.document.body.style.margin = '0';
    const isPdf = dataUrl.startsWith('data:application/pdf');
    const el = w.document.createElement(isPdf ? 'iframe' : 'img');
    el.setAttribute('src', dataUrl);
    if (isPdf) {
      el.setAttribute('style', 'border:0;width:100vw;height:100vh');
    } else {
      el.setAttribute('alt', req.name);
      el.setAttribute('style', 'max-width:100%;display:block;margin:auto');
    }
    w.document.body.appendChild(el);
  };

  if (requirements.length === 0) {
    return <p className="text-xs text-slate-500">No document checklist was created for this application.</p>;
  }

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center gap-2 text-[11px]">
        <span className="font-bold text-[#18392B]">
          {summary.verified} of {summary.total} verified
        </span>
        {summary.missing.length > 0 && (
          <span className="rounded-full bg-slate-100 px-2 py-0.5 font-semibold text-slate-700">{summary.missing.length} required missing</span>
        )}
        {summary.rejected.length > 0 && (
          <span className="rounded-full bg-rose-100 px-2 py-0.5 font-semibold text-rose-800">{summary.rejected.length} need replacement</span>
        )}
        {summary.awaitingReview.length > 0 && (
          <span className="rounded-full bg-blue-100 px-2 py-0.5 font-semibold text-blue-800">{summary.awaitingReview.length} awaiting review</span>
        )}
        {summary.allRequiredVerified && (
          <span className="rounded-full bg-emerald-100 px-2 py-0.5 font-semibold text-emerald-800">All required documents verified</span>
        )}
      </div>

      <ul className="divide-y divide-slate-100 rounded-xl border border-slate-200 bg-white">
        {requirements.map((req) => {
          const fb = feedback[req.id];
          const busy = busyId === req.id;
          const canUpload = mode === 'applicant' && !readOnly && req.status !== 'Verified';
          return (
            <li key={req.id} className="space-y-2 p-3" data-requirement={req.id}>
              <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                <div className="min-w-0 space-y-0.5">
                  <div className="flex flex-wrap items-center gap-2">
                    <FileText className="h-4 w-4 shrink-0 text-[#588B76]" />
                    <span className="text-sm font-semibold text-slate-900">{req.name}</span>
                    {req.required ? (
                      <span className="text-[10px] font-bold uppercase text-rose-700">Required</span>
                    ) : (
                      <span className="text-[10px] font-semibold uppercase text-slate-400">Optional</span>
                    )}
                  </div>
                  {req.description && <p className="text-[11px] text-slate-500">{req.description}</p>}
                  {req.fileName && (
                    <p className="truncate text-[11px] text-slate-600">
                      File: {req.fileName}
                      {req.fileSize ? ` (${Math.round(req.fileSize / 1024)} KB)` : ''}
                    </p>
                  )}
                  {req.remarks && (req.status === 'Rejected' || req.status === 'Missing') && (
                    <p className="flex items-start gap-1 text-[11px] font-medium text-rose-700">
                      <AlertCircle className="mt-0.5 h-3 w-3 shrink-0" />
                      <span>Admissions Office: {req.remarks}</span>
                    </p>
                  )}
                  {req.status === 'Verified' && req.reviewedBy && (
                    <p className="text-[11px] text-emerald-700">Verified by {req.reviewedBy}</p>
                  )}
                </div>
                <span className={`inline-flex shrink-0 items-center gap-1 self-start rounded-full border px-2 py-0.5 text-[11px] font-bold ${statusStyle[req.status]}`}>
                  {req.status === 'Verified' ? (
                    <CheckCircle2 className="h-3 w-3" />
                  ) : req.status === 'Rejected' ? (
                    <XCircle className="h-3 w-3" />
                  ) : req.status === 'Submitted' ? (
                    <Clock className="h-3 w-3" />
                  ) : (
                    <AlertCircle className="h-3 w-3" />
                  )}
                  {statusLabel[req.status]}
                </span>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                {req.fileDataUrl && (
                  <button
                    type="button"
                    onClick={() => openFile(req)}
                    className="inline-flex items-center gap-1 rounded-lg border border-slate-300 px-2.5 py-1.5 text-[11px] font-semibold text-slate-700 hover:bg-slate-50"
                  >
                    <Eye className="h-3.5 w-3.5" /> View file
                  </button>
                )}

                {canUpload && (
                  <>
                    <input
                      ref={(el) => {
                        inputs.current[req.id] = el;
                      }}
                      type="file"
                      accept="application/pdf,image/jpeg,image/png,image/webp"
                      className="hidden"
                      aria-label={`Upload ${req.name}`}
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        e.target.value = '';
                        if (file && onUpload) run(req.id, () => onUpload(req, file));
                      }}
                    />
                    <button
                      type="button"
                      disabled={busy}
                      onClick={() => inputs.current[req.id]?.click()}
                      className="inline-flex items-center gap-1 rounded-lg bg-[#18392B] px-3 py-1.5 text-[11px] font-bold text-white hover:bg-[#23533e] disabled:opacity-50"
                    >
                      {busy ? <RefreshCw className="h-3.5 w-3.5 animate-spin" /> : <Upload className="h-3.5 w-3.5" />}
                      {busy ? 'Uploading…' : req.status === 'Missing' ? 'Upload' : 'Replace'}
                    </button>
                  </>
                )}

                {mode === 'staff' && !readOnly && onReview && (req.status === 'Submitted' || req.status === 'Rejected' || req.status === 'Verified') && (
                  <div className="flex w-full flex-col gap-2 sm:flex-row sm:items-center">
                    <input
                      type="text"
                      value={remarks[req.id] ?? ''}
                      onChange={(e) => setRemarks((r) => ({ ...r, [req.id]: e.target.value }))}
                      placeholder="Remarks for the applicant (required to reject)"
                      aria-label={`Remarks for ${req.name}`}
                      className="min-w-0 flex-1 rounded-lg border border-slate-300 px-2.5 py-1.5 text-[11px] focus:border-[#588B76] focus:outline-none"
                    />
                    <div className="flex gap-2">
                      <button
                        type="button"
                        disabled={busy || req.status === 'Verified'}
                        onClick={() => run(req.id, () => onReview(req, 'Verified', remarks[req.id] || ''))}
                        className="inline-flex items-center gap-1 rounded-lg bg-emerald-600 px-3 py-1.5 text-[11px] font-bold text-white hover:bg-emerald-700 disabled:opacity-40"
                      >
                        <CheckCircle2 className="h-3.5 w-3.5" /> Verify
                      </button>
                      <button
                        type="button"
                        disabled={busy}
                        onClick={() => run(req.id, () => onReview(req, 'Rejected', remarks[req.id] || ''))}
                        className="inline-flex items-center gap-1 rounded-lg bg-rose-600 px-3 py-1.5 text-[11px] font-bold text-white hover:bg-rose-700 disabled:opacity-40"
                      >
                        <XCircle className="h-3.5 w-3.5" /> Reject
                      </button>
                    </div>
                  </div>
                )}
              </div>

              {fb && (
                <p role={fb.ok ? 'status' : 'alert'} className={`text-[11px] font-medium ${fb.ok ? 'text-emerald-700' : 'text-rose-700'}`}>
                  {fb.message}
                </p>
              )}
            </li>
          );
        })}
      </ul>
      {mode === 'applicant' && !readOnly && (
        <p className="text-[11px] text-slate-500">Accepted files: PDF, JPG, PNG or WEBP, up to 700 KB each. Photos are compressed automatically.</p>
      )}
    </div>
  );
};
