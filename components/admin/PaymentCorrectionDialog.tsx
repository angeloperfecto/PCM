'use client';

import React, { useState } from 'react';
import { X } from 'lucide-react';
import { PAYMENT_METHODS } from '@/lib/enrollmentWorkflow';
import { checkPaymentEdit, type PaymentEdit } from '@/lib/paymentAdmin';

export interface PaymentToCorrect {
  id: string;
  amount: number;
  method: string;
  reference: string;
  date: string;
}

const peso = (n: number) => `₱${(Number(n) || 0).toLocaleString('en-PH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

// Edit (amount, method, reference, date) or delete a payment, with the reason recorded. Used by the Registrar and
// Admins wherever a student's payments are listed.
export const PaymentCorrectionDialog: React.FC<{
  payment: PaymentToCorrect;
  mode: 'edit' | 'delete';
  /** What else changes, e.g. "The student's paid total and balance are updated." */
  note?: string;
  onSave: (edit: PaymentEdit | null, reason: string) => Promise<{ ok: boolean; message: string }>;
  onClose: () => void;
}> = ({ payment, mode, note, onSave, onClose }) => {
  const methods = Array.from(new Set([...PAYMENT_METHODS.filter((m) => m !== 'Scholarship Grant'), payment.method].filter(Boolean)));
  const [form, setForm] = useState({ amount: String(payment.amount || ''), method: payment.method || methods[0], referenceNo: payment.reference || '', paidOn: (payment.date || '').slice(0, 10) });
  const [reason, setReason] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const today = new Date().toISOString().slice(0, 10);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    const edit: PaymentEdit | null = mode === 'edit' ? { amount: Number(form.amount), method: form.method, referenceNo: form.referenceNo, paidOn: form.paidOn } : null;
    const problem = checkPaymentEdit(edit, reason);
    if (problem) return setError(problem);
    setBusy(true);
    setError('');
    try {
      const r = await onSave(edit, reason);
      if (r.ok) onClose();
      else setError(r.message);
    } catch (err: any) {
      setError(err?.code === 'permission-denied' ? 'Your account cannot change payments. Ask the Registrar or an Admin.' : 'Not saved. Please try again.');
    } finally {
      setBusy(false);
    }
  };

  const input = 'mt-1 w-full rounded-lg border border-slate-300 bg-white p-2 text-xs';
  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-slate-950/60 p-4" role="dialog" aria-modal="true" aria-label={mode === 'edit' ? 'Edit payment' : 'Delete payment'}>
      <form onSubmit={submit} className="w-full max-w-md space-y-3 rounded-2xl bg-white p-5 shadow-2xl" data-testid="payment-correction">
        <div className="flex items-center justify-between">
          <h5 className={`text-sm font-bold ${mode === 'delete' ? 'text-rose-700' : 'text-[#18392B]'}`}>{mode === 'edit' ? 'Edit payment' : 'Delete payment'}</h5>
          <button type="button" onClick={onClose} aria-label="Close" className="rounded-lg p-1 text-slate-400 hover:bg-slate-100">
            <X className="h-4 w-4" />
          </button>
        </div>
        <p className="rounded-lg bg-slate-50 p-2 text-xs text-slate-700">
          Recorded: <strong>{peso(payment.amount)}</strong> · {payment.method || '—'} · {payment.reference ? `ref ${payment.reference}` : 'no reference'}
          {payment.date ? ` · paid ${payment.date.slice(0, 10)}` : ''}
        </p>
        {mode === 'edit' ? (
          <div className="grid grid-cols-2 gap-3">
            <label className="text-[11px] font-bold text-slate-600">
              Amount (₱)
              <input type="number" min="0.01" step="0.01" value={form.amount} onChange={(e) => setForm({ ...form, amount: e.target.value })} className={input} />
            </label>
            <label className="text-[11px] font-bold text-slate-600">
              Method
              <select value={form.method} onChange={(e) => setForm({ ...form, method: e.target.value })} className={input}>
                {methods.map((m) => (
                  <option key={m}>{m}</option>
                ))}
              </select>
            </label>
            <label className="text-[11px] font-bold text-slate-600">
              Reference / OR no.
              <input value={form.referenceNo} onChange={(e) => setForm({ ...form, referenceNo: e.target.value })} className={input} />
            </label>
            <label className="text-[11px] font-bold text-slate-600">
              Date paid
              <input type="date" max={today} value={form.paidOn} onChange={(e) => setForm({ ...form, paidOn: e.target.value })} className={input} />
            </label>
          </div>
        ) : (
          <p className="text-xs text-rose-800">The payment will be removed. Use this only for a payment recorded by mistake (for example a duplicate).</p>
        )}
        <label className="block text-[11px] font-bold text-slate-600">
          Reason (kept in the record and activity log) *
          <input value={reason} onChange={(e) => setReason(e.target.value)} placeholder={mode === 'edit' ? 'e.g. Amount typed wrong; receipt shows ₱5,000' : 'e.g. Duplicate entry of OR-0012'} className={input} />
        </label>
        {note && <p className="text-[11px] text-slate-500">{note}</p>}
        {error && (
          <p role="alert" className="text-xs font-medium text-rose-700">
            {error}
          </p>
        )}
        <div className="flex justify-end gap-2">
          <button type="button" onClick={onClose} className="rounded-lg px-3 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100">
            Cancel
          </button>
          <button
            type="submit"
            disabled={busy}
            className={`rounded-lg px-4 py-2 text-xs font-bold text-white disabled:opacity-50 ${mode === 'delete' ? 'bg-rose-600 hover:bg-rose-700' : 'bg-[#18392B] hover:bg-[#23533e]'}`}
          >
            {busy ? 'Saving…' : mode === 'edit' ? 'Save correction' : 'Delete payment'}
          </button>
        </div>
      </form>
    </div>
  );
};
