'use client';

import React, { useState } from 'react';
import { Pencil, Plus, Trash2, X } from 'lucide-react';
import { usePCM } from '@/lib/store';
import type { FeeStructureItem } from '@/lib/types';

const CATEGORIES: FeeStructureItem['category'][] = ['Tuition', 'Miscellaneous', 'Laboratory', 'Other'];
const peso = (n: number) => `₱${(Number(n) || 0).toLocaleString('en-PH')}`;

type FeeForm = { id?: string; name: string; category: FeeStructureItem['category']; amount: string; isPerUnit: boolean; required: boolean; description: string };
const emptyForm = (): FeeForm => ({ name: '', category: 'Miscellaneous', amount: '', isPerUnit: false, required: true, description: '' });

// Enrollment & Records → Tuition & Fees: the fee schedule used for every enrollment assessment (required fees are
// added automatically; per-unit fees are multiplied by the student's units). Every item can be added, edited or deleted.
export const FeeScheduleCard: React.FC = () => {
  const { feeStructure, addFeeStructureItem, updateFeeStructureItem, deleteFeeStructureItem, enrollmentSystemConfig } = usePCM();
  const [form, setForm] = useState<FeeForm | null>(null);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  const fees = [...(feeStructure || [])].sort((a, b) => CATEGORIES.indexOf(a.category) - CATEGORIES.indexOf(b.category) || a.name.localeCompare(b.name));
  const perUnit = fees.filter((f) => f.isPerUnit && f.required);
  const fixed = fees.filter((f) => !f.isPerUnit && f.required);
  const fixedTotal = fixed.reduce((t, f) => t + (Number(f.amount) || 0), 0);
  const downpayment = enrollmentSystemConfig?.downpaymentPercent ?? 40;

  const open = (f?: FeeStructureItem) => {
    setError('');
    setForm(
      f
        ? { id: f.id, name: f.name, category: f.category, amount: String(f.amount ?? ''), isPerUnit: !!f.isPerUnit, required: f.required !== false, description: f.description || '' }
        : emptyForm()
    );
  };

  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form) return;
    const name = form.name.trim();
    const amount = Math.round(Number(form.amount) * 100) / 100;
    if (!name) return setError('Enter the fee name.');
    if (!Number.isFinite(amount) || amount < 0 || form.amount.trim() === '') return setError('Enter the amount (₱0 or more).');
    if (fees.some((f) => f.id !== form.id && f.name.trim().toLowerCase() === name.toLowerCase())) return setError(`A fee named “${name}” already exists.`);
    const item = { name, category: form.category, amount, isPerUnit: form.isPerUnit, required: form.required, description: form.description.trim() };
    setBusy(true);
    try {
      const ok = form.id ? await updateFeeStructureItem(form.id, item) : !!(await addFeeStructureItem(item));
      if (ok) setForm(null);
      else setError('Not saved. Please try again.');
    } finally {
      setBusy(false);
    }
  };

  const remove = async (f: FeeStructureItem) => {
    if (!window.confirm(`Delete “${f.name}” (${peso(f.amount)}${f.isPerUnit ? ' per unit' : ''}) from the fee schedule? New assessments will no longer include it; saved assessments are not changed.`)) return;
    await deleteFeeStructureItem(f.id);
  };

  const input = 'mt-1 w-full rounded-lg border border-slate-300 bg-white p-2 text-xs';

  return (
    <div className="space-y-4" data-testid="fee-schedule">
      <div className="flex flex-col justify-between gap-3 rounded-xl border border-slate-200 bg-white p-4 sm:flex-row sm:items-center">
        <div>
          <h4 className="text-sm font-bold text-[#18392B]">Tuition Schedule & Miscellaneous Fee Policy</h4>
          <p className="text-xs text-slate-500">
            The fees used for every enrollment assessment: required fees are added automatically, and per-unit fees are multiplied by the student’s units.
            Click a fee’s pencil to change it.
          </p>
        </div>
        <button type="button" onClick={() => open()} className="flex shrink-0 items-center gap-1.5 rounded-lg bg-[#18392B] px-3.5 py-2 text-xs font-bold text-white transition hover:bg-[#588B76]">
          <Plus className="h-4 w-4" /> Add Fee Item
        </button>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-xs">
          <span className="block font-mono text-[11px] uppercase text-slate-500">Tuition per unit</span>
          {perUnit.length ? (
            perUnit.map((f) => (
              <span key={f.id} className="block font-serif text-2xl font-bold text-[#18392B]">
                {peso(f.amount)} / Unit
              </span>
            ))
          ) : (
            <span className="block font-serif text-lg font-bold text-amber-700">Not set</span>
          )}
          <p className="mt-1 text-[11px] text-slate-500">{perUnit.length ? perUnit.map((f) => f.name).join(', ') : 'Add a required fee marked “per unit”.'}</p>
        </div>
        <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-xs">
          <span className="block font-mono text-[11px] uppercase text-slate-500">Fixed fees per term</span>
          <span className="font-serif text-2xl font-bold text-[#18392B]">{peso(fixedTotal)}</span>
          <p className="mt-1 text-[11px] text-slate-500">{fixed.length} required fee{fixed.length === 1 ? '' : 's'}, charged once per term</p>
        </div>
        <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-xs">
          <span className="block font-mono text-[11px] uppercase text-slate-500">Downpayment requirement</span>
          <span className="font-serif text-2xl font-bold text-emerald-700">{downpayment}% Minimum</span>
          <p className="mt-1 text-[11px] text-slate-500">Of the assessment, before enrollment. Change it in Payment settings above.</p>
        </div>
      </div>

      <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white shadow-xs">
        <table className="w-full text-left text-xs text-slate-700">
          <thead className="border-b border-slate-200 bg-slate-50 font-semibold text-slate-500">
            <tr>
              <th className="p-3.5">Fee Name</th>
              <th className="p-3.5">Category</th>
              <th className="p-3.5">Amount</th>
              <th className="p-3.5">Assessment Type</th>
              <th className="p-3.5">Mandatory</th>
              <th className="p-3.5 text-right">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {fees.length === 0 && (
              <tr>
                <td colSpan={6} className="p-6 text-center text-slate-500">No fees yet. Add the tuition per unit and the fees charged each term.</td>
              </tr>
            )}
            {fees.map((fee) => (
              <tr key={fee.id} className="transition hover:bg-slate-50">
                <td className="p-3.5 font-bold text-slate-900">
                  {fee.name}
                  {fee.description ? <span className="block text-[11px] font-normal text-slate-500">{fee.description}</span> : null}
                </td>
                <td className="p-3.5">
                  <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-medium text-slate-700">{fee.category}</span>
                </td>
                <td className="p-3.5 font-mono font-bold text-slate-900">{peso(fee.amount)}</td>
                <td className="p-3.5 text-slate-600">{fee.isPerUnit ? 'Per Unit Course' : 'Fixed Per Term'}</td>
                <td className="p-3.5">
                  <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${fee.required ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-100 text-slate-600'}`}>
                    {fee.required ? 'Required' : 'Optional'}
                  </span>
                </td>
                <td className="p-3.5 text-right">
                  <span className="inline-flex gap-1">
                    <button type="button" onClick={() => open(fee)} aria-label={`Edit ${fee.name}`} title="Edit fee item" className="rounded p-1 text-slate-500 transition hover:text-[#18392B]">
                      <Pencil className="h-4 w-4" />
                    </button>
                    <button type="button" onClick={() => remove(fee)} aria-label={`Delete ${fee.name}`} title="Delete fee item" className="rounded p-1 text-slate-400 transition hover:text-rose-600">
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {form && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 p-4" role="dialog" aria-modal="true" aria-label={form.id ? 'Edit fee item' : 'Add fee item'}>
          <form onSubmit={save} className="w-full max-w-md space-y-3 rounded-2xl bg-white p-5 shadow-2xl" data-testid="fee-form">
            <div className="flex items-center justify-between">
              <h5 className="text-sm font-bold text-[#18392B]">{form.id ? 'Edit fee item' : 'Add fee item'}</h5>
              <button type="button" onClick={() => setForm(null)} aria-label="Close" className="rounded-lg p-1 text-slate-400 hover:bg-slate-100">
                <X className="h-4 w-4" />
              </button>
            </div>
            <label className="block text-[11px] font-bold text-slate-600">
              Fee name *
              <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className={input} autoFocus />
            </label>
            <div className="grid grid-cols-2 gap-3">
              <label className="block text-[11px] font-bold text-slate-600">
                Category
                <select value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value as FeeStructureItem['category'] })} className={input}>
                  {CATEGORIES.map((c) => (
                    <option key={c}>{c}</option>
                  ))}
                </select>
              </label>
              <label className="block text-[11px] font-bold text-slate-600">
                Amount (₱) *
                <input type="number" min="0" step="0.01" value={form.amount} onChange={(e) => setForm({ ...form, amount: e.target.value })} className={input} />
              </label>
            </div>
            <label className="block text-[11px] font-bold text-slate-600">
              Assessment type
              <select value={form.isPerUnit ? 'unit' : 'term'} onChange={(e) => setForm({ ...form, isPerUnit: e.target.value === 'unit' })} className={input}>
                <option value="term">Fixed per term</option>
                <option value="unit">Per unit (amount × the student’s units)</option>
              </select>
            </label>
            <label className="flex items-center gap-2 text-xs text-slate-700">
              <input type="checkbox" checked={form.required} onChange={(e) => setForm({ ...form, required: e.target.checked })} />
              Required (added to every assessment automatically)
            </label>
            <label className="block text-[11px] font-bold text-slate-600">
              Description (optional)
              <input value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} className={input} />
            </label>
            {form.id && <p className="text-[11px] text-slate-500">Changes apply to new assessments; assessments already saved keep their amounts.</p>}
            {error && <p role="alert" className="text-xs font-medium text-rose-700">{error}</p>}
            <div className="flex justify-end gap-2">
              <button type="button" onClick={() => setForm(null)} className="rounded-lg px-3 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100">
                Cancel
              </button>
              <button type="submit" disabled={busy} className="rounded-lg bg-[#18392B] px-4 py-2 text-xs font-bold text-white hover:bg-[#23533e] disabled:opacity-50">
                {busy ? 'Saving…' : form.id ? 'Save changes' : 'Add fee'}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};
