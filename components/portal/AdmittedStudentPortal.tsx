'use client';

import React from 'react';
import { CheckCircle2, Circle, GraduationCap, Lock, LogOut } from 'lucide-react';
import { usePCM } from '@/lib/store';
import { MyApplicationPanel } from '@/components/enrollment/MyApplicationPanel';
import { normalizeStatus, type WorkflowStatus } from '@/lib/enrollmentWorkflow';

const PATH: { status: WorkflowStatus; label: string; detail: string }[] = [
  { status: 'Admitted', label: 'Admitted', detail: 'Admission approved; the Registrar verifies your documents' },
  { status: 'For Registration', label: 'Registration', detail: 'Choose your year level and subjects' },
  { status: 'For Assessment', label: 'Assessment', detail: 'The Registrar computes your fees' },
  { status: 'For Payment', label: 'Payment', detail: 'Pay the downpayment and report your payment' },
  { status: 'For Enrollment', label: 'Final verification', detail: 'The Registrar checks everything and approves' },
  { status: 'Enrolled', label: 'Officially enrolled', detail: 'Student ID issued; full Student Portal opens' },
];

const LOCKED_FEATURES = ['Official Student ID', 'Class schedule', 'Grades & evaluation', 'Certificate of Registration (COR)', 'Pre-enlistment & adding/dropping'];

interface Props {
  app: { fullName?: string; programName?: string; program?: string; referenceNumber?: string; status?: string };
}

// Student Portal for applicants who have been admitted but are not yet officially enrolled.
// They follow the remaining steps (requirements, assessment, payment) here; the full portal
// opens automatically once the Registrar finalizes enrollment and creates the student record.
export const AdmittedStudentPortal: React.FC<Props> = ({ app }) => {
  const { firebaseAuthUser, signOutUser } = usePCM();
  const status = normalizeStatus(app.status);
  const currentIndex = PATH.findIndex((p) => p.status === status);

  return (
    <div className="w-full min-h-[85vh] bg-slate-50 py-8 px-4 font-sans">
      <div className="max-w-5xl mx-auto space-y-5">
        <div className="flex flex-col gap-4 rounded-2xl bg-[#18392B] p-5 sm:p-6 text-white sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-start gap-3 min-w-0">
            <div className="w-12 h-12 rounded-xl bg-white/10 border border-[#588B76]/40 flex items-center justify-center shrink-0">
              <GraduationCap className="w-6 h-6 text-amber-300" />
            </div>
            <div className="min-w-0">
              <span className="inline-block text-[10px] font-mono font-bold uppercase tracking-widest bg-amber-400 text-slate-950 px-2 py-0.5 rounded-full">
                Admitted student · enrollment in progress
              </span>
              <h2 className="font-serif text-xl sm:text-2xl font-bold mt-1 truncate">Welcome, {app.fullName || firebaseAuthUser?.displayName || 'Student'}</h2>
              <p className="text-xs text-slate-300">
                {[app.programName || app.program, app.referenceNumber && `Application ${app.referenceNumber}`].filter(Boolean).join(' · ')}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => signOutUser()}
            className="self-start inline-flex items-center gap-1.5 rounded-lg border border-white/30 px-3 py-1.5 text-xs font-semibold hover:bg-white/10 sm:self-auto"
          >
            <LogOut className="w-3.5 h-3.5" /> Sign out
          </button>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm space-y-3">
          <h3 className="font-serif text-base font-bold text-[#18392B]">Your path to official enrollment</h3>
          <ol className="grid grid-cols-1 sm:grid-cols-3 lg:grid-cols-6 gap-2">
            {PATH.map((step, i) => {
              const done = i < currentIndex;
              const current = i === currentIndex;
              return (
                <li
                  key={step.status}
                  aria-current={current ? 'step' : undefined}
                  className={`rounded-xl border p-3 text-xs ${
                    current
                      ? 'border-[#588B76] bg-emerald-50 ring-2 ring-[#588B76]/20'
                      : done
                      ? 'border-emerald-200 bg-white'
                      : 'border-slate-200 bg-slate-50 text-slate-500'
                  }`}
                >
                  <span className="flex items-center gap-1.5 font-bold text-[#18392B]">
                    {done ? <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" /> : <Circle className={`w-4 h-4 shrink-0 ${current ? 'text-[#588B76]' : 'text-slate-300'}`} />}
                    {step.label}
                  </span>
                  <span className="block mt-1 text-[11px] leading-snug">{step.detail}</span>
                  {current && <span className="mt-1.5 inline-block text-[10px] font-bold uppercase text-[#588B76]">You are here</span>}
                </li>
              );
            })}
          </ol>
        </div>

        <MyApplicationPanel />

        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <h3 className="font-serif text-base font-bold text-[#18392B] flex items-center gap-2">
            <Lock className="w-4 h-4 text-slate-400" /> Unlocks when you are officially enrolled
          </h3>
          <ul className="mt-2 flex flex-wrap gap-2">
            {LOCKED_FEATURES.map((f) => (
              <li key={f} className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-[11px] text-slate-600">
                {f}
              </li>
            ))}
          </ul>
          <p className="mt-2 text-[11px] text-slate-500">
            Once the Registrar confirms your enrollment, this page becomes your full Student Portal automatically — no new account needed.
          </p>
        </div>
      </div>
    </div>
  );
};
