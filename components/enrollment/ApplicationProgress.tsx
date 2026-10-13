'use client';

import React from 'react';
import { CheckCircle2, Circle, Clock, XCircle, PauseCircle, AlertTriangle } from 'lucide-react';
import { TRACKER_STAGES, normalizeStatus, stageIndex } from '@/lib/enrollmentWorkflow';

// Status tracker: Application Submitted -> Under Review -> Requirements -> For Admission
// Approval -> Admitted -> For Enrollment -> Enrolled, with Rejected / Deferred shown as an
// outcome banner.
export const ApplicationProgress: React.FC<{ status?: string; compact?: boolean }> = ({ status, compact }) => {
  const current = normalizeStatus(status);
  const currentIndex = stageIndex(status);
  const closed = current === 'Rejected' || current === 'Deferred';

  return (
    <div className="space-y-3" aria-label="Application progress">
      {closed && (
        <div
          role="status"
          className={`flex items-center gap-2 rounded-xl border px-3 py-2 text-xs font-semibold ${
            current === 'Rejected'
              ? 'border-rose-200 bg-rose-50 text-rose-800'
              : 'border-amber-200 bg-amber-50 text-amber-900'
          }`}
        >
          {current === 'Rejected' ? <XCircle className="h-4 w-4 shrink-0" /> : <PauseCircle className="h-4 w-4 shrink-0" />}
          <span>Application {current === 'Rejected' ? 'not approved' : 'deferred'}</span>
        </div>
      )}
      <ol className={`grid gap-2 ${compact ? 'grid-cols-7' : 'grid-cols-1 sm:grid-cols-7'}`}>
        {TRACKER_STAGES.map((stage, i) => {
          const done = !closed && (i < currentIndex || current === 'Enrolled');
          const active = !closed && i === currentIndex && current !== 'Enrolled';
          const incomplete = active && stage.status === 'Requirements Incomplete';
          return (
            <li
              key={stage.status}
              aria-current={active ? 'step' : undefined}
              className={`flex items-center gap-2 rounded-lg border px-2.5 py-2 text-[11px] leading-tight sm:flex-col sm:items-center sm:text-center ${
                done
                  ? 'border-emerald-200 bg-emerald-50 text-emerald-900'
                  : incomplete
                  ? 'border-amber-300 bg-amber-50 text-amber-900 font-bold'
                  : active
                  ? 'border-[#588B76] bg-[#18392B] text-white font-bold shadow'
                  : 'border-slate-200 bg-white text-slate-500'
              }`}
            >
              {done ? (
                <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-600" />
              ) : incomplete ? (
                <AlertTriangle className="h-4 w-4 shrink-0 text-amber-600" />
              ) : active ? (
                <Clock className="h-4 w-4 shrink-0 text-amber-300" />
              ) : (
                <Circle className="h-4 w-4 shrink-0" />
              )}
              {!compact && (
                <span>{stage.status === 'Requirements Incomplete' && (done || !active) ? 'Requirements' : incomplete ? 'Requirements Incomplete' : stage.label}</span>
              )}
            </li>
          );
        })}
      </ol>
    </div>
  );
};

export const StatusBadge: React.FC<{ status?: string }> = ({ status }) => {
  const s = normalizeStatus(status);
  const styles: Record<string, string> = {
    Submitted: 'bg-blue-100 text-blue-800 border-blue-200',
    'Under Review': 'bg-indigo-100 text-indigo-800 border-indigo-200',
    'Requirements Incomplete': 'bg-amber-100 text-amber-900 border-amber-300',
    'For Admission Approval': 'bg-purple-100 text-purple-800 border-purple-200',
    Admitted: 'bg-emerald-100 text-emerald-800 border-emerald-200',
    'For Enrollment': 'bg-teal-100 text-teal-800 border-teal-200',
    Enrolled: 'bg-[#18392B] text-white border-[#18392B]',
    Rejected: 'bg-rose-100 text-rose-800 border-rose-200',
    Deferred: 'bg-orange-100 text-orange-800 border-orange-200',
  };
  return (
    <span className={`inline-flex items-center whitespace-nowrap rounded-full border px-2.5 py-0.5 text-[11px] font-bold ${styles[s]}`}>
      {s}
    </span>
  );
};
