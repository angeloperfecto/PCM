'use client';

import React, { useMemo, useState } from 'react';
import { usePCM } from '@/lib/store';
import { db } from '@/lib/firebase';
import { reviewBalancePayment } from '@/lib/studentPaymentsService';
import type { StudentBalancePayment } from '@/lib/types';

const peso = (n: number) => `₱${(Number(n) || 0).toLocaleString('en-PH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

// Balance payments reported by enrolled students. Verifying posts the payment to the student's
// account (paid amount, balance, payment records); rejecting tells the student why.
export const StudentPaymentsPanel: React.FC = () => {
  const { studentPayments, students, canVerifyPayments, admissionsActor, addToast } = usePCM();
  const [filter, setFilter] = useState<'Submitted' | 'all'>('Submitted');
  const [remarks, setRemarks] = useState<Record<string, string>>({});
  const [busyId, setBusyId] = useState<string | null>(null);

  const list = useMemo(
    () =>
      [...studentPayments]
        .filter((p) => filter === 'all' || p.status === 'Submitted')
        .sort((a, b) => (b.submittedAt || '').localeCompare(a.submittedAt || '')),
    [studentPayments, filter]
  );
  const pendingCount = studentPayments.filter((p) => p.status === 'Submitted').length;

  const openProof = (p: StudentBalancePayment) => {
    if (!p.proofDataUrl) return;
    const w = window.open('', '_blank');
    if (!w) return;
    const isPdf = p.proofDataUrl.startsWith('data:application/pdf');
    const el = w.document.createElement(isPdf ? 'iframe' : 'img');
    el.setAttribute('src', p.proofDataUrl);
    el.setAttribute('style', isPdf ? 'width:100%;height:100vh;border:0' : 'max-width:100%');
    w.document.title = p.proofFileName || 'Proof of payment';
    w.document.body.appendChild(el);
  };

  const review = async (p: StudentBalancePayment, verdict: 'Verified' | 'Rejected') => {
    setBusyId(p.id);
    try {
      const r = await reviewBalancePayment(db, admissionsActor(), p, verdict, remarks[p.id] || '');
      addToast(r.ok ? 'success' : 'error', r.ok ? (verdict === 'Verified' ? 'Payment verified' : 'Payment rejected') : 'Not saved', r.message);
    } catch (e: any) {
      addToast('error', 'Not saved', e?.code === 'permission-denied' ? 'You do not have permission to verify payments.' : 'The payment could not be updated. Please try again.');
    } finally {
      setBusyId(null);
    }
  };

  return (
    <div className="space-y-4" data-testid="student-payments">
      <div className="bg-white p-4 rounded-xl border border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h4 className="font-bold text-sm text-[#18392B]">Student balance payments</h4>
          <p className="text-xs text-slate-500">
            Payments enrolled students report against their balance. {canVerifyPayments ? 'Verify each one against your GCash, bank or cashier records.' : 'Only Finance, the Registrar and Admins can verify payments.'}
          </p>
        </div>
        <div className="flex gap-1.5 text-xs">
          {(['Submitted', 'all'] as const).map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-3 py-1.5 rounded-lg font-semibold ${filter === f ? 'bg-[#18392B] text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}
            >
              {f === 'Submitted' ? `To verify (${pendingCount})` : 'All'}
            </button>
          ))}
        </div>
      </div>

      {list.length === 0 ? (
        <p className="bg-white rounded-xl border border-slate-200 p-6 text-center text-xs text-slate-500">
          {filter === 'Submitted' ? 'No payments are waiting for verification.' : 'No balance payments yet.'}
        </p>
      ) : (
        <ul className="space-y-3">
          {list.map((p) => {
            const student = students.find((s) => s.id === p.studentRecordId);
            return (
              <li key={p.id} className="bg-white rounded-xl border border-slate-200 p-4 text-xs space-y-2">
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <div>
                    <p className="font-bold text-slate-900">
                      {p.studentName} <span className="font-mono text-slate-500">· {p.studentId}</span>
                    </p>
                    <p className="text-slate-600">
                      {peso(p.amount)} via {p.method} · ref <span className="font-mono">{p.referenceNo}</span> · paid {p.paidOn} · reported{' '}
                      {new Date(p.submittedAt).toLocaleString()}
                    </p>
                    {student && (
                      <p className="text-slate-500">
                        Account: {peso(Number(student.tuitionTotal) || 0)} total · {peso(Number(student.tuitionPaid) || 0)} paid · balance{' '}
                        {peso(Number(student.tuitionBalance) || 0)}
                      </p>
                    )}
                    {p.status !== 'Submitted' && (
                      <p className="text-slate-500">
                        {p.status} by {p.reviewedBy} {p.reviewedAt ? `on ${new Date(p.reviewedAt).toLocaleString()}` : ''} {p.remarks ? `· ${p.remarks}` : ''}
                      </p>
                    )}
                  </div>
                  <span
                    className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${
                      p.status === 'Verified' ? 'bg-emerald-100 text-emerald-800' : p.status === 'Rejected' ? 'bg-rose-100 text-rose-800' : 'bg-amber-100 text-amber-900'
                    }`}
                  >
                    {p.status === 'Submitted' ? 'To verify' : p.status}
                  </span>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  {p.proofDataUrl && (
                    <button type="button" onClick={() => openProof(p)} className="rounded-lg border border-slate-300 px-2.5 py-1 font-semibold text-slate-700 hover:bg-slate-50">
                      View proof
                    </button>
                  )}
                  {p.status === 'Submitted' && canVerifyPayments && (
                    <>
                      <input
                        value={remarks[p.id] || ''}
                        onChange={(e) => setRemarks((r) => ({ ...r, [p.id]: e.target.value }))}
                        placeholder="Remarks (required to reject)"
                        aria-label={`Remarks for payment ${p.referenceNo}`}
                        className="min-w-0 flex-1 rounded-lg border border-slate-300 px-2 py-1"
                      />
                      <button
                        type="button"
                        disabled={busyId === p.id}
                        onClick={() => review(p, 'Verified')}
                        className="rounded-lg bg-emerald-600 px-3 py-1 font-bold text-white hover:bg-emerald-700 disabled:opacity-50"
                      >
                        Verify
                      </button>
                      <button
                        type="button"
                        disabled={busyId === p.id}
                        onClick={() => review(p, 'Rejected')}
                        className="rounded-lg bg-rose-600 px-3 py-1 font-bold text-white hover:bg-rose-700 disabled:opacity-50"
                      >
                        Reject
                      </button>
                    </>
                  )}
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
};
