'use client';

import React, { useState } from 'react';
import { Plus, Trash2, Wallet } from 'lucide-react';
import { usePCM } from '@/lib/store';
import type { PaymentBankAccount, PaymentInstructions } from '@/lib/types';

// Payment instructions shown to applicants and students, and the default downpayment
// percentage used when the Registrar prepares an assessment.
export const PaymentSettingsCard: React.FC = () => {
  const { enrollmentSystemConfig, updateEnrollmentSystemConfig } = usePCM();
  const current = enrollmentSystemConfig?.paymentInstructions || {};
  const [form, setForm] = useState<PaymentInstructions>(() => ({
    gcashName: current.gcashName || '',
    gcashNumber: current.gcashNumber || '',
    bankAccounts: current.bankAccounts?.length ? current.bankAccounts : [{ bank: '', accountName: '', accountNumber: '', branch: '' }],
    cashierLocation: current.cashierLocation || '',
    cashierHours: current.cashierHours || '',
    notes: current.notes || '',
  }));
  const [percent, setPercent] = useState<string>(String(enrollmentSystemConfig?.downpaymentPercent ?? 40));
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  const setBank = (i: number, key: keyof PaymentBankAccount, value: string) =>
    setForm((f) => ({ ...f, bankAccounts: (f.bankAccounts || []).map((b, j) => (j === i ? { ...b, [key]: value } : b)) }));

  const save = async () => {
    const pct = Number(percent);
    if (!Number.isFinite(pct) || pct < 1 || pct > 100) return setError('The downpayment must be between 1% and 100%.');
    if (form.gcashNumber && !/^[0-9 +\-]{10,16}$/.test(form.gcashNumber.trim())) return setError('Enter the GCash number as digits, e.g. 0917 123 4567.');
    const banks = (form.bankAccounts || [])
      .map((b) => ({ bank: b.bank.trim(), accountName: b.accountName.trim(), accountNumber: b.accountNumber.trim(), branch: (b.branch || '').trim() }))
      .filter((b) => b.bank || b.accountName || b.accountNumber);
    if (banks.some((b) => !b.bank || !b.accountName || !b.accountNumber)) return setError('Each bank account needs the bank, account name and account number.');
    setError('');
    setSaving(true);
    try {
      await updateEnrollmentSystemConfig({
        downpaymentPercent: Math.round(pct),
        paymentInstructions: {
          gcashName: (form.gcashName || '').trim(),
          gcashNumber: (form.gcashNumber || '').trim(),
          bankAccounts: banks,
          cashierLocation: (form.cashierLocation || '').trim(),
          cashierHours: (form.cashierHours || '').trim(),
          notes: (form.notes || '').trim(),
        },
      });
    } finally {
      setSaving(false);
    }
  };

  const input = 'mt-1 w-full rounded-lg border border-slate-300 p-2 text-xs';
  return (
    <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-4" data-testid="payment-settings">
      <div>
        <h4 className="font-serif text-lg font-bold text-[#18392B] flex items-center gap-2">
          <Wallet className="w-5 h-5 text-[#588B76]" /> Payment instructions & downpayment
        </h4>
        <p className="text-xs text-slate-500">Shown to applicants at the payment step and to students on their Amount Due page.</p>
      </div>

      <label className="block text-xs font-semibold text-slate-700 max-w-xs">
        Default downpayment before enrollment (% of assessment)
        <input type="number" min={1} max={100} value={percent} onChange={(e) => setPercent(e.target.value)} className={input} />
      </label>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <label className="block text-xs font-semibold text-slate-700">
          GCash account name
          <input value={form.gcashName} onChange={(e) => setForm({ ...form, gcashName: e.target.value })} className={input} />
        </label>
        <label className="block text-xs font-semibold text-slate-700">
          GCash number
          <input value={form.gcashNumber} onChange={(e) => setForm({ ...form, gcashNumber: e.target.value })} placeholder="0917 123 4567" className={input} />
        </label>
      </div>

      <div className="space-y-2">
        <p className="text-xs font-semibold text-slate-700">Bank accounts</p>
        {(form.bankAccounts || []).map((b, i) => (
          <div key={i} className="grid grid-cols-1 sm:grid-cols-[1fr_1.4fr_1.2fr_1fr_auto] gap-2 items-end">
            <input aria-label="Bank" placeholder="Bank (e.g. BDO)" value={b.bank} onChange={(e) => setBank(i, 'bank', e.target.value)} className={input} />
            <input aria-label="Account name" placeholder="Account name" value={b.accountName} onChange={(e) => setBank(i, 'accountName', e.target.value)} className={input} />
            <input aria-label="Account number" placeholder="Account number" value={b.accountNumber} onChange={(e) => setBank(i, 'accountNumber', e.target.value)} className={input} />
            <input aria-label="Branch" placeholder="Branch (optional)" value={b.branch || ''} onChange={(e) => setBank(i, 'branch', e.target.value)} className={input} />
            <button
              type="button"
              aria-label="Remove bank account"
              onClick={() => setForm((f) => ({ ...f, bankAccounts: (f.bankAccounts || []).filter((_, j) => j !== i) }))}
              className="p-2 text-rose-600 hover:bg-rose-50 rounded-lg"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        ))}
        <button
          type="button"
          onClick={() => setForm((f) => ({ ...f, bankAccounts: [...(f.bankAccounts || []), { bank: '', accountName: '', accountNumber: '', branch: '' }] }))}
          className="inline-flex items-center gap-1 text-xs font-semibold text-[#18392B] hover:text-[#588B76]"
        >
          <Plus className="w-3.5 h-3.5" /> Add bank account
        </button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <label className="block text-xs font-semibold text-slate-700">
          Cashier (pay in person)
          <input value={form.cashierLocation} onChange={(e) => setForm({ ...form, cashierLocation: e.target.value })} placeholder="Finance Office, Admin Building" className={input} />
        </label>
        <label className="block text-xs font-semibold text-slate-700">
          Cashier hours
          <input value={form.cashierHours} onChange={(e) => setForm({ ...form, cashierHours: e.target.value })} placeholder="Mon–Fri 8:00 AM – 5:00 PM" className={input} />
        </label>
      </div>
      <label className="block text-xs font-semibold text-slate-700">
        Additional instructions (optional)
        <textarea rows={2} value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} placeholder="e.g. Write your full name and Student ID in the payment note." className={input} />
      </label>

      {error && (
        <p role="alert" className="rounded-lg border border-rose-200 bg-rose-50 p-2 text-xs text-rose-800">
          {error}
        </p>
      )}
      <button type="button" disabled={saving} onClick={save} className="rounded-lg bg-[#18392B] px-4 py-2 text-xs font-bold text-white hover:bg-[#588B76] disabled:opacity-50">
        {saving ? 'Saving…' : 'Save payment settings'}
      </button>
    </div>
  );
};
