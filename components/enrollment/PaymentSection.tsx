'use client';

import React, { useMemo, useState } from 'react';
import { CheckCircle2, Clock, Plus, Receipt, Trash2, XCircle } from 'lucide-react';
import { PaymentInstructions } from './PaymentInstructions';
import {
  ApplicationPayment,
  EnrollmentAssessment,
  FeeLine,
  PAYMENT_METHODS,
  draftAssessmentLines,
  normalizeStatus,
  verifiedPaymentTotal,
} from '@/lib/enrollmentWorkflow';

type Result = { ok: boolean; message: string };

const peso = (n: number) => `₱${(Number(n) || 0).toLocaleString('en-PH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

const paymentBadge: Record<string, string> = {
  Submitted: 'bg-blue-50 text-blue-800 border-blue-200',
  Verified: 'bg-emerald-50 text-emerald-800 border-emerald-200',
  Rejected: 'bg-rose-50 text-rose-800 border-rose-200',
};

// Assessment summary + payment list, shared by the applicant and staff views.
const AssessmentSummary: React.FC<{ assessment: EnrollmentAssessment; payments: ApplicationPayment[]; paymentStatus?: string }> = ({
  assessment,
  payments,
  paymentStatus,
}) => {
  const verified = verifiedPaymentTotal(payments);
  return (
    <div className="space-y-2">
      <div className="overflow-x-auto rounded-xl border border-slate-200">
        <table className="w-full min-w-[280px] text-xs">
          <tbody>
            {(assessment.items || []).map((item, i) => (
              <tr key={i} className="border-b border-slate-100">
                <td className="p-2 text-slate-700">{item.name}</td>
                <td className="p-2 text-right font-mono text-slate-900">{peso(item.amount)}</td>
              </tr>
            ))}
            <tr className="border-b border-slate-200 bg-slate-50 font-bold">
              <td className="p-2">Total assessment</td>
              <td className="p-2 text-right font-mono">{peso(assessment.total)}</td>
            </tr>
            <tr className="border-b border-slate-100">
              <td className="p-2 text-slate-700">Downpayment required before enrollment</td>
              <td className="p-2 text-right font-mono font-bold text-[#18392B]">{peso(assessment.minimumPayment)}</td>
            </tr>
            <tr>
              <td className="p-2 text-slate-700">Verified payments</td>
              <td className="p-2 text-right font-mono text-emerald-700">{peso(verified)}</td>
            </tr>
          </tbody>
        </table>
      </div>
      <p className="text-[11px] text-slate-500">
        Assessed by {assessment.assessedBy} on {new Date(assessment.assessedAt).toLocaleString()}
        {paymentStatus ? ` · Payment status: ${paymentStatus}` : ''}
      </p>
      {assessment.notes && <p className="rounded-lg bg-slate-50 p-2 text-[11px] text-slate-700">{assessment.notes}</p>}
    </div>
  );
};

const PaymentList: React.FC<{
  payments: ApplicationPayment[];
  onReview?: (p: ApplicationPayment, verdict: 'Verified' | 'Rejected', remarks: string) => Promise<Result>;
}> = ({ payments, onReview }) => {
  const [remarks, setRemarks] = useState<Record<string, string>>({});
  const [busy, setBusy] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<Record<string, Result>>({});

  if (payments.length === 0) return <p className="text-xs text-slate-500">No payments reported yet.</p>;

  const openProof = (p: ApplicationPayment) => {
    const url = p.proofDataUrl || '';
    if (!/^data:(application\/pdf|image\/(jpeg|png|webp));base64,/.test(url)) return;
    const w = window.open('', '_blank');
    if (!w) return;
    w.opener = null;
    const el = w.document.createElement(url.startsWith('data:application/pdf') ? 'iframe' : 'img');
    el.setAttribute('src', url);
    el.setAttribute('style', url.startsWith('data:application/pdf') ? 'border:0;width:100vw;height:100vh' : 'max-width:100%');
    w.document.body.style.margin = '0';
    w.document.body.appendChild(el);
  };

  return (
    <ul className="space-y-2" data-testid="payment-list">
      {payments.map((p) => (
        <li key={p.id} className="space-y-1.5 rounded-xl border border-slate-200 bg-white p-3 text-xs" data-payment={p.id}>
          <div className="flex flex-wrap items-center justify-between gap-2">
            <span className="font-bold text-slate-900">
              {peso(p.amount)} · {p.method}
            </span>
            <span className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[11px] font-bold ${paymentBadge[p.status]}`}>
              {p.status === 'Verified' ? <CheckCircle2 className="h-3 w-3" /> : p.status === 'Rejected' ? <XCircle className="h-3 w-3" /> : <Clock className="h-3 w-3" />}
              {p.status === 'Submitted' ? 'Awaiting verification' : p.status}
            </span>
          </div>
          <p className="text-slate-600">
            Ref {p.referenceNo} · paid {p.paidOn} · reported {new Date(p.submittedAt).toLocaleString()}
          </p>
          {p.reviewedBy && (
            <p className="text-slate-500">
              {p.status} by {p.reviewedBy}
              {p.reviewedAt ? ` on ${new Date(p.reviewedAt).toLocaleString()}` : ''}
              {p.remarks ? ` — ${p.remarks}` : ''}
            </p>
          )}
          <div className="flex flex-wrap items-center gap-2">
            {p.proofDataUrl && (
              <button type="button" onClick={() => openProof(p)} className="rounded-lg border border-slate-300 px-2.5 py-1 text-[11px] font-semibold text-slate-700 hover:bg-slate-50">
                View proof
              </button>
            )}
            {onReview && p.status === 'Submitted' && (
              <div className="flex w-full flex-col gap-2 sm:flex-row sm:items-center">
                <input
                  value={remarks[p.id] || ''}
                  onChange={(e) => setRemarks({ ...remarks, [p.id]: e.target.value })}
                  placeholder="Remarks (required to reject)"
                  aria-label={`Remarks for payment ${p.referenceNo}`}
                  className="min-w-0 flex-1 rounded-lg border border-slate-300 px-2.5 py-1.5 text-[11px]"
                />
                <div className="flex gap-2">
                  {(['Verified', 'Rejected'] as const).map((verdict) => (
                    <button
                      key={verdict}
                      type="button"
                      disabled={busy === p.id}
                      onClick={async () => {
                        setBusy(p.id);
                        try {
                          setFeedback({ ...feedback, [p.id]: await onReview(p, verdict, remarks[p.id] || '') });
                        } catch (e: any) {
                          setFeedback({ ...feedback, [p.id]: { ok: false, message: e?.code === 'permission-denied' ? 'You do not have permission to verify payments.' : 'Could not save. Please try again.' } });
                        } finally {
                          setBusy(null);
                        }
                      }}
                      className={`rounded-lg px-3 py-1.5 text-[11px] font-bold text-white disabled:opacity-40 ${verdict === 'Verified' ? 'bg-emerald-600 hover:bg-emerald-700' : 'bg-rose-600 hover:bg-rose-700'}`}
                    >
                      {verdict === 'Verified' ? 'Verify' : 'Reject'}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
          {feedback[p.id] && (
            <p role={feedback[p.id].ok ? 'status' : 'alert'} className={`text-[11px] font-medium ${feedback[p.id].ok ? 'text-emerald-700' : 'text-rose-700'}`}>
              {feedback[p.id].message}
            </p>
          )}
        </li>
      ))}
    </ul>
  );
};

// ---------------------------------------------------------------------------
// Applicant view: assessment, payments and the form to report a payment.
// ---------------------------------------------------------------------------

export const ApplicantPaymentSection: React.FC<{
  status?: string;
  assessment?: EnrollmentAssessment | null;
  paymentStatus?: string;
  payments: ApplicationPayment[];
  onSubmit: (input: { amount: number; method: string; referenceNo: string; paidOn: string; proof?: File | null }) => Promise<Result>;
}> = ({ status, assessment, paymentStatus, payments, onSubmit }) => {
  const s = normalizeStatus(status);
  const verified = verifiedPaymentTotal(payments);
  const remaining = assessment ? Math.max(0, assessment.minimumPayment - verified) : 0;
  const [form, setForm] = useState({ amount: '', method: PAYMENT_METHODS[0], referenceNo: '', paidOn: new Date().toISOString().slice(0, 10) });
  const [proof, setProof] = useState<File | null>(null);
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState<Result | null>(null);

  if (!assessment) return null;
  const canPay = s === 'For Payment' && paymentStatus !== 'Verified';

  return (
    <section className="space-y-3 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6" data-testid="applicant-payment">
      <h4 className="flex items-center gap-1.5 font-serif text-lg font-bold text-[#18392B]">
        <Receipt className="h-5 w-5 text-[#588B76]" /> Enrollment assessment & payment
      </h4>
      <AssessmentSummary assessment={assessment} payments={payments} paymentStatus={paymentStatus} />

      {canPay && (
        <form
          className="space-y-3 rounded-xl border border-[#588B76]/30 bg-emerald-50/40 p-4"
          onSubmit={async (e) => {
            e.preventDefault();
            setBusy(true);
            setResult(null);
            try {
              const r = await onSubmit({ amount: Number(form.amount), method: form.method, referenceNo: form.referenceNo, paidOn: form.paidOn, proof });
              setResult(r);
              if (r.ok) {
                setForm({ ...form, amount: '', referenceNo: '' });
                setProof(null);
              }
            } catch (err: any) {
              setResult({ ok: false, message: 'Your payment details could not be saved. Please try again.' });
            } finally {
              setBusy(false);
            }
          }}
        >
          <PaymentInstructions compact />
          <p className="text-xs text-slate-700">
            Pay at least <strong>{peso(remaining)}</strong> more to complete your downpayment (you may pay more, up to the full amount), then enter the details here. The
            Finance Office verifies each payment.
          </p>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <label className="text-xs font-semibold text-slate-700">
              Amount paid (₱)
              <input required type="number" min="1" step="0.01" value={form.amount} onChange={(e) => setForm({ ...form, amount: e.target.value })} placeholder={String(remaining || '')} className="mt-1 w-full rounded-lg border border-slate-300 p-2 text-sm" />
            </label>
            <label className="text-xs font-semibold text-slate-700">
              Payment method
              <select value={form.method} onChange={(e) => setForm({ ...form, method: e.target.value })} className="mt-1 w-full rounded-lg border border-slate-300 bg-white p-2 text-sm">
                {PAYMENT_METHODS.filter((m) => m !== 'Scholarship Grant').map((m) => (
                  <option key={m}>{m}</option>
                ))}
              </select>
            </label>
            <label className="text-xs font-semibold text-slate-700">
              Reference / receipt number
              <input required value={form.referenceNo} onChange={(e) => setForm({ ...form, referenceNo: e.target.value })} className="mt-1 w-full rounded-lg border border-slate-300 p-2 text-sm" />
            </label>
            <label className="text-xs font-semibold text-slate-700">
              Date paid
              <input required type="date" value={form.paidOn} max={new Date().toISOString().slice(0, 10)} onChange={(e) => setForm({ ...form, paidOn: e.target.value })} className="mt-1 w-full rounded-lg border border-slate-300 bg-white p-2 text-sm" />
            </label>
          </div>
          <label className="block text-xs font-semibold text-slate-700">
            Proof of payment (optional, PDF/JPG/PNG up to 700 KB)
            <input type="file" accept="application/pdf,image/jpeg,image/png,image/webp" onChange={(e) => setProof(e.target.files?.[0] || null)} className="mt-1 block w-full text-xs" />
          </label>
          <button type="submit" disabled={busy} className="rounded-lg bg-[#18392B] px-4 py-2 text-xs font-bold text-white hover:bg-[#23533e] disabled:opacity-50">
            {busy ? 'Submitting…' : 'Submit payment details'}
          </button>
          {result && (
            <p role={result.ok ? 'status' : 'alert'} className={`text-xs font-medium ${result.ok ? 'text-emerald-700' : 'text-rose-700'}`}>
              {result.message}
            </p>
          )}
        </form>
      )}

      <PaymentList payments={payments} />
    </section>
  );
};

// ---------------------------------------------------------------------------
// Staff view: build the assessment, waive payment, verify payments.
// ---------------------------------------------------------------------------

export const StaffPaymentSection: React.FC<{
  status?: string;
  assessment?: EnrollmentAssessment | null;
  paymentStatus?: string;
  payments: ApplicationPayment[];
  canAssess: boolean;
  canVerify: boolean;
  feeStructure: { name: string; amount: number; isPerUnit?: boolean; required?: boolean }[];
  defaults: { tuitionPerUnit?: number; registrationFee?: number };
  requirementsVerified: boolean;
  /** Default downpayment as a percent of the total (enrollment settings). */
  downpaymentPercent?: number;
  /** Units from the student's registration, used for the draft assessment. */
  defaultUnits?: number;
  onSaveAssessment: (input: { units: number; items: FeeLine[]; minimumPayment: number; notes: string }) => Promise<Result>;
  onWaive: (reason: string) => Promise<Result>;
  onReviewPayment: (p: ApplicationPayment, verdict: 'Verified' | 'Rejected', remarks: string) => Promise<Result>;
}> = (props) => {
  const s = normalizeStatus(props.status);
  const editable = props.canAssess && (s === 'For Assessment' || s === 'For Payment');
  const [units, setUnits] = useState(props.assessment?.units || props.defaultUnits || 18);
  const [items, setItems] = useState<FeeLine[]>(
    () => props.assessment?.items || draftAssessmentLines(props.feeStructure, props.defaultUnits || 18, props.defaults)
  );
  const total = useMemo(() => Math.round(items.reduce((t, i) => t + (Number(i.amount) || 0), 0) * 100) / 100, [items]);
  const [minimum, setMinimum] = useState<string>(props.assessment ? String(props.assessment.minimumPayment) : '');
  const [notes, setNotes] = useState(props.assessment?.notes || '');
  const [waiveReason, setWaiveReason] = useState('');
  const [showWaive, setShowWaive] = useState(false);
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState<Result | null>(null);
  const [editing, setEditing] = useState(!props.assessment);

  const run = async (fn: () => Promise<Result>) => {
    setBusy(true);
    setResult(null);
    try {
      const r = await fn();
      setResult(r);
      if (r.ok) setEditing(false);
    } catch (e: any) {
      setResult({ ok: false, message: e?.code === 'permission-denied' ? 'You do not have permission for this action.' : 'Could not save. Please try again.' });
    } finally {
      setBusy(false);
    }
  };

  const showSection = !!props.assessment || editable;
  if (!showSection) return null;

  return (
    <section className="space-y-3 rounded-2xl border border-slate-200 bg-white p-4" data-testid="staff-payment">
      <h4 className="flex items-center gap-1.5 text-sm font-bold text-[#18392B]">
        <Receipt className="h-4 w-4 text-[#588B76]" /> Enrollment assessment & payment
      </h4>

      {editable && !props.requirementsVerified && (
        <p className="rounded-lg bg-amber-50 p-2 text-[11px] text-amber-900">All required documents must be verified before the assessment.</p>
      )}

      {props.assessment && !editing && <AssessmentSummary assessment={props.assessment} payments={props.payments} paymentStatus={props.paymentStatus} />}

      {editable && editing && props.requirementsVerified && (
        <div className="space-y-3 rounded-xl border border-slate-200 bg-slate-50 p-3">
          <div className="flex flex-wrap items-end gap-2">
            <label className="text-xs font-semibold text-slate-700">
              Units
              <input type="number" min="0" value={units} onChange={(e) => setUnits(Number(e.target.value))} className="mt-1 w-24 rounded-lg border border-slate-300 p-1.5 text-sm" />
            </label>
            <button type="button" onClick={() => setItems(draftAssessmentLines(props.feeStructure, units, props.defaults))} className="rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-100">
              Load fees from fee structure
            </button>
          </div>
          <ul className="space-y-1.5">
            {items.map((item, i) => (
              <li key={i} className="flex gap-2">
                <input aria-label="Fee name" value={item.name} onChange={(e) => setItems(items.map((it, j) => (j === i ? { ...it, name: e.target.value } : it)))} className="min-w-0 flex-1 rounded-lg border border-slate-300 p-1.5 text-xs" />
                <input aria-label="Fee amount" type="number" min="0" step="0.01" value={item.amount} onChange={(e) => setItems(items.map((it, j) => (j === i ? { ...it, amount: Number(e.target.value) } : it)))} className="w-28 rounded-lg border border-slate-300 p-1.5 text-right text-xs" />
                <button type="button" aria-label="Remove fee" onClick={() => setItems(items.filter((_, j) => j !== i))} className="rounded-lg p-1.5 text-slate-500 hover:bg-slate-200">
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </li>
            ))}
          </ul>
          <button type="button" onClick={() => setItems([...items, { name: '', amount: 0 }])} className="inline-flex items-center gap-1 text-xs font-semibold text-[#18392B]">
            <Plus className="h-3.5 w-3.5" /> Add fee line
          </button>
          <div className="flex flex-wrap items-end gap-3">
            <p className="text-sm font-bold">Total: {peso(total)}</p>
            <label className="text-xs font-semibold text-slate-700">
              Downpayment before enrollment (₱) · default {props.downpaymentPercent ?? 40}% of total
              <input type="number" min="1" step="0.01" value={minimum} placeholder={String(Math.round(total * ((props.downpaymentPercent ?? 40) / 100)))} onChange={(e) => setMinimum(e.target.value)} className="mt-1 w-36 rounded-lg border border-slate-300 p-1.5 text-sm" />
            </label>
          </div>
          <textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={2} placeholder="Notes for the applicant (discounts, payment instructions)" className="w-full rounded-lg border border-slate-300 p-2 text-xs" />
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              disabled={busy}
              onClick={() => run(() => props.onSaveAssessment({ units, items, minimumPayment: Number(minimum || Math.round(total * ((props.downpaymentPercent ?? 40) / 100))), notes }))}
              className="rounded-lg bg-[#18392B] px-3 py-2 text-xs font-bold text-white hover:bg-[#23533e] disabled:opacity-50"
            >
              {busy ? 'Saving…' : 'Save assessment & request payment'}
            </button>
            <button type="button" disabled={busy} onClick={() => setShowWaive((v) => !v)} className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs font-semibold text-slate-700">
              No payment required…
            </button>
            {props.assessment && (
              <button type="button" onClick={() => setEditing(false)} className="rounded-lg px-3 py-2 text-xs font-semibold text-slate-600">
                Cancel
              </button>
            )}
          </div>
          {showWaive && (
            <div className="flex flex-col gap-2 sm:flex-row">
              <input value={waiveReason} onChange={(e) => setWaiveReason(e.target.value)} placeholder="Reason (e.g. full scholarship) — recorded in the audit trail" className="min-w-0 flex-1 rounded-lg border border-slate-300 p-2 text-xs" />
              <button type="button" disabled={busy || !waiveReason.trim()} onClick={() => run(() => props.onWaive(waiveReason))} className="rounded-lg bg-amber-500 px-3 py-2 text-xs font-bold text-white disabled:opacity-40">
                Confirm waiver
              </button>
            </div>
          )}
        </div>
      )}

      {editable && props.assessment && !editing && s === 'For Payment' && (
        <button type="button" onClick={() => setEditing(true)} className="text-xs font-semibold text-[#18392B] underline">
          Revise assessment
        </button>
      )}

      {result && (
        <p role={result.ok ? 'status' : 'alert'} className={`text-xs font-medium ${result.ok ? 'text-emerald-700' : 'text-rose-700'}`}>
          {result.message}
        </p>
      )}

      {(props.assessment || props.payments.length > 0) && (
        <div className="space-y-2">
          <p className="text-xs font-bold text-slate-700">Payments</p>
          <PaymentList payments={props.payments} onReview={props.canVerify && s === 'For Payment' ? props.onReviewPayment : undefined} />
        </div>
      )}
    </section>
  );
};
