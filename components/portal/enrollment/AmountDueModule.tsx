'use client';

import React, { useMemo, useState } from 'react';
import { CheckCircle2, Clock, Receipt, XCircle } from 'lucide-react';
import { usePCM } from '@/lib/store';
import { db, auth } from '@/lib/firebase';
import { PAYMENT_METHODS } from '@/lib/enrollmentWorkflow';
import { balanceOf, submitBalancePayment } from '@/lib/studentPaymentsService';
import { PaymentInstructions } from '@/components/enrollment/PaymentInstructions';

const peso = (n: number) => `₱${(Number(n) || 0).toLocaleString('en-PH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

// Statement of account from the official student record, plus reporting a payment against the
// balance. Reports are verified by the Finance Office before the balance changes.
export const AmountDueModule: React.FC = () => {
  const { studentProfile, studentPayments, enrollments } = usePCM();
  // A semester enrollment waiting for the Registrar: fees are posted to the account on approval.
  const pendingEnrollment = (enrollments || []).find(
    (e) => e.studentId === studentProfile.studentId && ['Submitted', 'Pending', 'Under Review'].includes(String(e.status))
  );
  const total = Number(studentProfile.tuitionTotal) || 0;
  const paid = Number(studentProfile.tuitionPaid) || 0;
  const balance = balanceOf(studentProfile);

  const mine = useMemo(
    () => studentPayments.filter((p) => p.studentRecordId === studentProfile.id).sort((a, b) => (b.submittedAt || '').localeCompare(a.submittedAt || '')),
    [studentPayments, studentProfile.id]
  );
  const pending = mine.filter((p) => p.status === 'Submitted');
  const pendingTotal = pending.reduce((s, p) => s + p.amount, 0);
  // Verified payments on the official record (enrollment payments and verified balance payments).
  const verifiedRecords = useMemo(() => {
    const records = [...((studentProfile as any).paymentRecords || []), ...((studentProfile.paymentHistory || []) as any[])];
    const seen = new Set<string>();
    return records
      .filter((r: any) => (r.status === 'Verified' || !r.status) && (Number(r.amount) || 0) > 0)
      .filter((r: any) => {
        const key = r.id || `${r.referenceNo || r.referenceNumber}-${r.amount}`;
        if (seen.has(key)) return false;
        seen.add(key);
        return true;
      });
  }, [studentProfile]);

  const [form, setForm] = useState({ amount: '', method: PAYMENT_METHODS[0], referenceNo: '', paidOn: new Date().toISOString().slice(0, 10) });
  const [proof, setProof] = useState<File | null>(null);
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState<{ ok: boolean; message: string } | null>(null);

  return (
    <div id="pcm-amount-due-module" className="space-y-6">
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-6 space-y-4">
        <div>
          <span className="bg-purple-100 text-purple-800 text-[11px] font-mono font-bold px-2.5 py-0.5 rounded-md border border-purple-200">Statement of Account</span>
          <h3 className="font-serif text-2xl font-bold text-[#18392B] mt-1">Amount Due</h3>
          <p className="text-xs text-slate-500">{studentProfile.currentSemester || 'Current term'} · Student ID {studentProfile.studentId}</p>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3" data-testid="statement">
          <div className="rounded-xl border border-slate-200 p-4">
            <span className="text-[11px] font-mono uppercase text-slate-500">Total assessment</span>
            <div className="font-serif text-2xl font-bold text-[#18392B]">{peso(total)}</div>
          </div>
          <div className="rounded-xl border border-emerald-200 bg-emerald-50/50 p-4">
            <span className="text-[11px] font-mono uppercase text-emerald-700">Verified payments</span>
            <div className="font-serif text-2xl font-bold text-emerald-800">{peso(paid)}</div>
          </div>
          <div className={`rounded-xl border p-4 ${balance > 0 ? 'border-amber-200 bg-amber-50/60' : 'border-emerald-200 bg-emerald-50/60'}`}>
            <span className="text-[11px] font-mono uppercase text-slate-600">Outstanding balance</span>
            <div className={`font-serif text-2xl font-bold ${balance > 0 ? 'text-amber-800' : 'text-emerald-800'}`} data-testid="balance">
              {peso(balance)}
            </div>
            {pendingTotal > 0 && <span className="text-[11px] text-slate-600">{peso(pendingTotal)} waiting for verification</span>}
          </div>
        </div>
      </div>

      {balance > 0 && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-6 space-y-4">
          <h4 className="font-serif text-lg font-bold text-[#18392B] flex items-center gap-2">
            <Receipt className="w-5 h-5 text-[#588B76]" /> Pay your balance
          </h4>
          <PaymentInstructions />
          <form
            className="space-y-3 rounded-xl border border-[#588B76]/30 bg-emerald-50/40 p-4"
            data-testid="balance-payment-form"
            onSubmit={async (e) => {
              e.preventDefault();
              setBusy(true);
              setResult(null);
              try {
                const r = await submitBalancePayment(
                  db,
                  { uid: auth.currentUser?.uid || '', name: studentProfile.fullName || studentProfile.name || '' },
                  studentProfile,
                  pendingTotal,
                  { amount: Number(form.amount), method: form.method, referenceNo: form.referenceNo, paidOn: form.paidOn, proof }
                );
                setResult(r);
                if (r.ok) {
                  setForm({ ...form, amount: '', referenceNo: '' });
                  setProof(null);
                }
              } catch (err: any) {
                setResult({ ok: false, message: err?.code === 'permission-denied' ? 'Your payment report could not be saved (not allowed).' : 'Your payment report could not be saved. Please try again.' });
              } finally {
                setBusy(false);
              }
            }}
          >
            <p className="text-xs text-slate-700">After paying, enter the details here. Your balance updates once the Finance Office verifies the payment.</p>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <label className="text-xs font-semibold text-slate-700">
                Amount paid (₱)
                <input required type="number" min="1" step="0.01" max={balance} value={form.amount} onChange={(e) => setForm({ ...form, amount: e.target.value })} placeholder={String(balance)} className="mt-1 w-full rounded-lg border border-slate-300 p-2 text-sm" />
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
              {busy ? 'Submitting…' : 'Report payment'}
            </button>
            {result && (
              <p role={result.ok ? 'status' : 'alert'} className={`text-xs font-medium ${result.ok ? 'text-emerald-700' : 'text-rose-700'}`}>
                {result.message}
              </p>
            )}
          </form>
        </div>
      )}

      {balance <= 0 && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-6 space-y-3" data-testid="payment-methods-no-balance">
          <h4 className="font-serif text-lg font-bold text-[#18392B] flex items-center gap-2">
            <Receipt className="w-5 h-5 text-[#588B76]" /> Payment methods
          </h4>
          <p className="text-xs text-slate-700">
            {pendingEnrollment
              ? `Your enrollment request ${pendingEnrollment.referenceNumber || ''} is waiting for the Registrar. Once it is approved, your fees appear here and you can report your payment. You may already pay the downpayment using the details below.`
              : 'You have no outstanding balance right now. When new fees are posted to your account, you can pay using the details below and report the payment here.'}
          </p>
          <PaymentInstructions reportHint={false} />
        </div>
      )}

      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-6 space-y-3">
        <h4 className="font-serif text-lg font-bold text-[#18392B]">Payment history</h4>
        {mine.length === 0 && verifiedRecords.length === 0 ? (
          <p className="text-xs text-slate-500">No payments yet.</p>
        ) : (
          <ul className="divide-y divide-slate-100 text-xs" data-testid="payment-history">
            {mine.map((p) => (
              <li key={p.id} className="flex flex-wrap items-center justify-between gap-2 py-2">
                <span>
                  {peso(p.amount)} · {p.method} · ref <span className="font-mono">{p.referenceNo}</span> · {p.paidOn}
                  {p.status === 'Rejected' && p.remarks ? <span className="block text-rose-700">Not verified: {p.remarks}</span> : null}
                </span>
                <span
                  className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-bold ${
                    p.status === 'Verified' ? 'bg-emerald-100 text-emerald-800' : p.status === 'Rejected' ? 'bg-rose-100 text-rose-800' : 'bg-amber-100 text-amber-900'
                  }`}
                >
                  {p.status === 'Verified' ? <CheckCircle2 className="h-3 w-3" /> : p.status === 'Rejected' ? <XCircle className="h-3 w-3" /> : <Clock className="h-3 w-3" />}
                  {p.status === 'Submitted' ? 'Waiting for verification' : p.status}
                </span>
              </li>
            ))}
            {verifiedRecords
              .filter((r: any) => !mine.some((p) => p.id === r.id))
              .map((r: any, i: number) => (
                <li key={r.id || i} className="flex flex-wrap items-center justify-between gap-2 py-2">
                  <span>
                    {peso(r.amount)} · {r.method || r.paymentMethod || 'Payment'} · ref <span className="font-mono">{r.referenceNo || r.referenceNumber || '—'}</span> ·{' '}
                    {r.paymentDate || r.date || ''} {r.description ? `· ${r.description}` : ''}
                  </span>
                  <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-bold text-emerald-800">
                    <CheckCircle2 className="h-3 w-3" /> Verified
                  </span>
                </li>
              ))}
          </ul>
        )}
      </div>
    </div>
  );
};
