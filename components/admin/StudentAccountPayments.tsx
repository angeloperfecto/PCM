'use client';

import React, { useMemo, useState } from 'react';
import { CheckCircle2, Clock, XCircle } from 'lucide-react';
import { usePCM } from '@/lib/store';
import { accountSummary, ledgerPayments } from '@/lib/studentLedger';
import type { ApplicationPayment } from '@/lib/enrollmentWorkflow';
import type { StudentProfile } from '@/lib/types';
import { db } from '@/lib/firebase';
import { canEditPayments, correctStudentPayment } from '@/lib/paymentAdmin';
import { PaymentCorrectionDialog } from './PaymentCorrectionDialog';

const peso = (n: number) => `₱${(Number(n) || 0).toLocaleString('en-PH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
const day = (d?: string) => (d ? String(d).slice(0, 10) : '');

interface Row {
  id: string;
  source: 'Enrollment payment' | 'Balance payment' | 'Cashier receipt';
  amount: number;
  method: string;
  reference: string;
  date: string;
  status: 'Verified' | 'Submitted' | 'Rejected';
  by?: string;
  remarks?: string;
}

// Every payment of an enrolled student, live: enrollment payments (admission application),
// balance payments reported in the Student Portal (any status) and cashier receipts recorded by
// staff — with the account totals from the student record.
export const StudentAccountPayments: React.FC<{ student: StudentProfile; applicationPayments: ApplicationPayment[] }> = ({ student, applicationPayments }) => {
  const { studentPayments, currentAdminUser, firebaseAuthUser, logActivity, addToast } = usePCM();
  const mayCorrect = canEditPayments(currentAdminUser?.role);
  const [correcting, setCorrecting] = useState<{ row: Row; mode: 'edit' | 'delete' } | null>(null);
  const account = accountSummary(student as any);

  const rows = useMemo(() => {
    const out = new Map<string, Row>();
    applicationPayments.forEach((p) =>
      out.set(p.id, {
        id: p.id,
        source: 'Enrollment payment',
        amount: Number(p.amount) || 0,
        method: p.method,
        reference: p.referenceNo,
        date: p.paidOn || day(p.submittedAt),
        status: p.status,
        by: p.reviewedBy,
        remarks: p.remarks,
      })
    );
    const reports = (studentPayments || []).filter((p) => p.studentRecordId === student.id || p.studentId === student.studentId);
    reports.forEach((p) =>
      out.set(p.id, {
        id: p.id,
        source: 'Balance payment',
        amount: Number(p.amount) || 0,
        method: p.method,
        reference: p.referenceNo,
        date: p.paidOn || day(p.submittedAt),
        status: p.status,
        by: p.reviewedBy,
        remarks: p.remarks,
      })
    );
    // Verified entries on the student record not already listed (cashier receipts, older records).
    ledgerPayments(student as any).forEach((l) => {
      if (out.has(l.id)) return;
      const dup = [...out.values()].some((r) => r.status === 'Verified' && r.amount === l.amount && r.reference && r.reference === l.reference);
      if (dup) return;
      out.set(l.id, {
        id: l.id,
        source: l.receipt ? 'Cashier receipt' : /balance/i.test(l.description) ? 'Balance payment' : 'Cashier receipt',
        amount: l.amount,
        method: l.method,
        reference: l.receipt ? `Receipt ${l.receipt}` : l.reference,
        date: day(l.date),
        status: (l.status as Row['status']) || 'Verified',
      });
    });
    return [...out.values()].sort((a, b) => (b.date || '').localeCompare(a.date || ''));
  }, [applicationPayments, studentPayments, student]);

  const verifiedTotal = rows.filter((r) => r.status === 'Verified').reduce((t, r) => t + r.amount, 0);
  const pending = rows.filter((r) => r.status === 'Submitted');

  return (
    <section className="space-y-3 rounded-2xl border border-slate-200 bg-white p-4" data-testid="student-account-payments">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h4 className="text-sm font-bold text-[#18392B]">Student account &amp; all payments</h4>
        <span className="rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-semibold text-emerald-800">Live from the student record</span>
      </div>

      <dl className="grid grid-cols-2 gap-2 text-xs sm:grid-cols-4">
        {[
          ['Total charges', peso(account.totalCharges)],
          ['Payments received', peso(account.totalPaid)],
          ['Balance', peso(account.balance)],
          ['Waiting for verification', `${pending.length} · ${peso(pending.reduce((t, r) => t + r.amount, 0))}`],
        ].map(([label, value]) => (
          <div key={label} className="rounded-xl border border-slate-200 p-2.5">
            <dt className="text-[10px] font-bold uppercase tracking-wider text-slate-500">{label}</dt>
            <dd className={`font-mono text-sm font-bold ${label === 'Balance' && account.balance > 0 ? 'text-amber-800' : 'text-[#18392B]'}`}>{value}</dd>
          </div>
        ))}
      </dl>

      {Math.abs(verifiedTotal - account.totalPaid) >= 0.01 && (
        <p className="rounded-lg border border-amber-200 bg-amber-50 p-2 text-[11px] text-amber-900">
          Verified payments listed here total {peso(verifiedTotal)}, but the student record shows {peso(account.totalPaid)} paid. Some older payments may
          have been entered without a receipt; check the student&apos;s Tuition &amp; Payments in Enrollment &amp; Records.
        </p>
      )}

      {rows.length === 0 ? (
        <p className="text-xs text-slate-500">No payments yet.</p>
      ) : (
        <ul className="divide-y divide-slate-100 rounded-xl border border-slate-200">
          {rows.map((r) => (
            <li key={r.id} className="flex flex-wrap items-start justify-between gap-2 p-3 text-xs">
              <div className="min-w-0">
                <p className="font-bold text-slate-900">
                  {peso(r.amount)} · {r.method || '—'}
                  <span className="ml-2 rounded bg-slate-100 px-1.5 py-0.5 text-[10px] font-semibold text-slate-600">{r.source}</span>
                </p>
                <p className="text-[11px] text-slate-500">
                  {r.reference ? (r.reference.startsWith('Receipt ') ? r.reference : `Ref ${r.reference}`) : 'No reference'}
                  {r.date ? ` · paid ${r.date}` : ''}
                </p>
                {r.by && <p className="text-[11px] text-slate-500">{r.status === 'Rejected' ? 'Returned' : 'Verified'} by {r.by}</p>}
                {r.status === 'Rejected' && r.remarks && <p className="text-[11px] text-rose-700">{r.remarks}</p>}
                {mayCorrect && (
                  <span className="mt-1 flex gap-1">
                    <button type="button" onClick={() => setCorrecting({ row: r, mode: 'edit' })} className="rounded px-1.5 py-0.5 text-[11px] font-bold text-[#18392B] hover:bg-emerald-50">
                      Edit
                    </button>
                    <button type="button" onClick={() => setCorrecting({ row: r, mode: 'delete' })} className="rounded px-1.5 py-0.5 text-[11px] font-bold text-rose-600 hover:bg-rose-50">
                      Delete
                    </button>
                  </span>
                )}
              </div>
              <span
                className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-bold ${
                  r.status === 'Verified' ? 'bg-emerald-100 text-emerald-800' : r.status === 'Rejected' ? 'bg-rose-100 text-rose-800' : 'bg-amber-100 text-amber-900'
                }`}
              >
                {r.status === 'Verified' ? <CheckCircle2 className="h-3 w-3" /> : r.status === 'Rejected' ? <XCircle className="h-3 w-3" /> : <Clock className="h-3 w-3" />}
                {r.status === 'Submitted' ? 'Waiting for verification' : r.status}
              </span>
            </li>
          ))}
        </ul>
      )}
      {pending.length > 0 && (
        <p className="text-[11px] text-slate-500">Balance payments waiting for verification are verified in Enrollment &amp; Records → Student Payments.</p>
      )}
      {correcting && (
        <PaymentCorrectionDialog
          payment={{ id: correcting.row.id, amount: correcting.row.amount, method: correcting.row.method, reference: correcting.row.reference.replace(/^Receipt /, ''), date: correcting.row.date }}
          mode={correcting.mode}
          note="The student’s paid total and balance are updated, along with the same payment in Admissions or Student Payments."
          onClose={() => setCorrecting(null)}
          onSave={async (edit, reason) => {
            const r = await correctStudentPayment(db, { uid: firebaseAuthUser?.uid || '', name: currentAdminUser?.name || 'Registrar', role: currentAdminUser?.role }, student.id, correcting.row.id, edit, reason);
            if (r.ok) {
              logActivity(edit ? 'UPDATE' : 'DELETE', 'Student Payment', correcting.row.id, student.fullName || student.name || 'Student', r.summary || r.message);
              addToast('success', edit ? 'Payment corrected' : 'Payment deleted', r.message);
            }
            return r;
          }}
        />
      )}
    </section>
  );
};
