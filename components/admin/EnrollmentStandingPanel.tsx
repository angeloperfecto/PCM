'use client';

import React, { useState } from 'react';
import { History, ShieldAlert } from 'lucide-react';
import { usePCM } from '@/lib/store';
import type { StudentProfile } from '@/lib/types';

const peso = (n?: number) => (typeof n === 'number' ? `₱${n.toLocaleString('en-PH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` : '—');

// A student's enrollment standing for re-enrollment: hold (blocks re-enrollment until lifted) and
// the record of each closed term they were enrolled in.
export const EnrollmentStandingPanel: React.FC<{ student: StudentProfile }> = ({ student }) => {
  const { setEnrollmentHold, canManageEnrollment, addToast } = usePCM();
  const hold = student.enrollmentHold;
  const [reason, setReason] = useState('');
  const [busy, setBusy] = useState(false);
  const history = [...(student.termHistory || [])].sort((a, b) => (b.closedAt || '').localeCompare(a.closedAt || ''));

  const place = async () => {
    if (!reason.trim()) return addToast('warning', 'Add a reason', 'The student sees this reason when they try to re-enroll.');
    setBusy(true);
    try {
      if (await setEnrollmentHold(student.id, true, reason)) setReason('');
    } finally {
      setBusy(false);
    }
  };
  const lift = async () => {
    setBusy(true);
    try {
      await setEnrollmentHold(student.id, false, hold?.reason || '');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="grid grid-cols-1 gap-3 lg:grid-cols-2" data-testid="enrollment-standing">
      <div className={`space-y-2 rounded-xl border p-3 text-xs ${hold?.active ? 'border-rose-200 bg-rose-50' : 'border-slate-200 bg-white'}`}>
        <p className="flex items-center gap-1.5 font-bold text-slate-900">
          <ShieldAlert className={`h-4 w-4 ${hold?.active ? 'text-rose-700' : 'text-slate-400'}`} /> Enrollment hold
        </p>
        {hold?.active ? (
          <>
            <p className="text-rose-900">
              {hold.reason}
              <span className="block text-[11px] text-rose-700">
                Placed by {hold.setBy || 'staff'}{hold.setAt ? ` on ${hold.setAt.slice(0, 10)}` : ''}. The student cannot re-enroll until it is lifted.
              </span>
            </p>
            {canManageEnrollment && (
              <button type="button" onClick={lift} disabled={busy} className="rounded-lg bg-white px-3 py-1.5 font-bold text-rose-800 ring-1 ring-rose-300 hover:bg-rose-100 disabled:opacity-50">
                Lift hold
              </button>
            )}
          </>
        ) : (
          <>
            <p className="text-slate-600">No hold. Place one to stop re-enrollment (for example: on leave, unsettled clearance).</p>
            {canManageEnrollment && (
              <div className="flex flex-col gap-2 sm:flex-row">
                <input value={reason} onChange={(e) => setReason(e.target.value)} placeholder="Reason (shown to the student)" aria-label="Hold reason" className="flex-1 rounded-lg border border-slate-300 p-1.5" />
                <button type="button" onClick={place} disabled={busy} className="rounded-lg bg-rose-700 px-3 py-1.5 font-bold text-white hover:bg-rose-800 disabled:opacity-50">
                  Place hold
                </button>
              </div>
            )}
          </>
        )}
      </div>

      <div className="space-y-2 rounded-xl border border-slate-200 bg-white p-3 text-xs">
        <p className="flex items-center gap-1.5 font-bold text-slate-900">
          <History className="h-4 w-4 text-[#588B76]" /> Enrollment history (closed terms)
        </p>
        {history.length === 0 ? (
          <p className="text-slate-500">No closed terms yet. Each term appears here when the Registrar closes it.</p>
        ) : (
          <ul className="max-h-40 divide-y divide-slate-100 overflow-y-auto">
            {history.map((t) => (
              <li key={t.term} className="flex flex-wrap justify-between gap-2 py-1.5">
                <span className="font-semibold text-slate-800">
                  {t.term} <span className="font-normal text-slate-500">• {t.yearLevel}</span>
                </span>
                <span className="font-mono text-slate-600">
                  {t.subjects} subj • {t.units} u • {peso(t.assessment)}
                </span>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
};
