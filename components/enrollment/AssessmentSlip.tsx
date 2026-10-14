'use client';

import React from 'react';
import { Emblem } from '@/components/common/Emblem';
import { PaymentInstructions } from '@/components/enrollment/PaymentInstructions';
import { usePCM } from '@/lib/store';
import { accountSummary } from '@/lib/studentLedger';
import type { StudentAssessment, StudentProfile } from '@/lib/types';

const peso = (n: number) => `₱${(Number(n) || 0).toLocaleString('en-PH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

// Stable slip number for the student and term, e.g. ASM-2026PCM0001-1S2627.
function slipNumber(student: StudentProfile, a: StudentAssessment): string {
  const id = (student.studentId || student.id || '').replace(/[^A-Za-z0-9]/g, '').toUpperCase();
  const sem = (a.semester || '').match(/^(\d)/)?.[1] || (/summer/i.test(a.semester || '') ? 'S' : '');
  const ay = (a.academicYear || '').match(/\d{2}(\d{2})\D+\d{2}(\d{2})/);
  return `ASM-${id}${sem || ay ? `-${sem}S${ay ? ay[1] + ay[2] : ''}` : ''}`;
}

// The official Statement of Assessment for the student's current term. Every line comes from the
// assessment the store computes (the Registrar's itemized assessment when known), so the lines
// always add up to the total. Print it with printDocument(id, title).
export const AssessmentSlip: React.FC<{ student: StudentProfile; assessment: StudentAssessment; id?: string }> = ({
  student,
  assessment: a,
  id = 'pcm-assessment-slip',
}) => {
  const { siteConfig } = usePCM();
  const contact = (siteConfig as any)?.contactInfo || {};
  const address = [contact.addressLine1, contact.addressLine2].filter(Boolean).join(', ') || contact.address || '';
  const contactLine = [contact.phonePrimary || contact.phone, contact.emailGeneral].filter(Boolean).join(' • ');
  const account = accountSummary(student as any);
  const issued = new Date().toLocaleDateString('en-PH', { year: 'numeric', month: 'long', day: 'numeric' });
  const name = student.fullName || student.name || '';
  const term = [a.semester, a.academicYear ? `AY ${a.academicYear}` : ''].filter(Boolean).join(', ') || student.currentSemester || 'Current term';

  const lines: { name: string; detail?: string; amount: number; kind?: 'discount' | 'adjustment' }[] = [
    ...(a.tuitionTotal
      ? [{ name: 'Tuition', detail: a.totalUnits ? `${a.totalUnits} units × ${peso(a.tuitionPerUnit)}` : undefined, amount: a.tuitionTotal }]
      : []),
    ...a.miscBreakdown.map((l) => ({ name: l.name, amount: l.amount })),
    ...a.labBreakdown.map((l) => ({ name: l.name, amount: l.amount })),
    ...a.otherBreakdown.map((l) => ({ name: l.name, amount: l.amount })),
    ...a.discountsBreakdown.map((l) => ({ name: l.name, amount: -Math.abs(l.amount), kind: 'discount' as const })),
    ...a.adjustmentsBreakdown.map((l) => ({ name: l.name, detail: l.note, amount: l.amount, kind: 'adjustment' as const })),
  ].filter((l) => Math.abs(l.amount) >= 0.005);
  const total = Math.round(lines.reduce((s, l) => s + l.amount, 0) * 100) / 100;
  const hasRecord = account.totalCharges > 0;
  const balance = account.totalCharges > 0 ? account.balance : total;

  return (
    <article id={id} className="cor-sheet relative mx-auto w-full max-w-[820px] overflow-hidden bg-white text-slate-900 border border-slate-300 shadow-sm" aria-label="Statement of Assessment">
      <div className="pointer-events-none absolute inset-0 flex items-center justify-center opacity-[0.045]" aria-hidden="true">
        <Emblem id={`${id}-watermark`} size={440} />
      </div>
      {hasRecord && balance <= 0 && (
        <div className="pointer-events-none absolute inset-0 flex items-center justify-center" aria-hidden="true">
          <span className="rotate-[-20deg] rounded border-4 border-emerald-400/60 px-6 py-2 text-3xl font-black uppercase tracking-[0.3em] text-emerald-500/60">Fully paid</span>
        </div>
      )}
      <div className="h-2 bg-[#18392B]" />
      <div className="h-1 bg-[#D4A63A]" />

      <div className="relative space-y-5 p-6 sm:p-8">
        <header className="flex flex-col items-center gap-4 border-b-2 border-[#18392B] pb-4 sm:flex-row sm:items-start">
          <Emblem id={`${id}-seal`} size={72} className="shrink-0" />
          <div className="flex-1 text-center sm:text-left">
            <h2 className="font-serif text-[22px] font-extrabold uppercase leading-tight tracking-wide text-[#18392B]">Philippine College of Ministry</h2>
            <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-[#588B76]">Accounting &amp; Cashier Office</p>
            {address && <p className="mt-0.5 text-[11px] text-slate-600">{address}</p>}
            {contactLine && <p className="text-[11px] text-slate-600">{contactLine}</p>}
          </div>
          <dl className="shrink-0 rounded-lg border border-slate-300 text-[11px] sm:text-right">
            <div className="border-b border-slate-200 px-3 py-1.5">
              <dt className="text-[9px] font-bold uppercase tracking-wider text-slate-500">Slip No.</dt>
              <dd className="font-mono font-bold text-[#18392B]">{slipNumber(student, a)}</dd>
            </div>
            <div className="px-3 py-1.5">
              <dt className="text-[9px] font-bold uppercase tracking-wider text-slate-500">Date issued</dt>
              <dd className="font-semibold">{issued}</dd>
            </div>
          </dl>
        </header>

        <div className="text-center">
          <h3 className="font-serif text-[18px] font-bold uppercase tracking-[0.22em] text-[#18392B]">Statement of Assessment</h3>
          <p className="text-[12px] text-slate-600">{term}</p>
        </div>

        <section className="grid grid-cols-2 rounded-lg border border-slate-300 sm:grid-cols-4 [&>div]:border-b [&>div]:border-slate-200 [&>div]:px-3 [&>div]:py-2">
          {[
            ['Student No.', student.studentId, true],
            ['Name', name, false],
            ['Program', student.degreeProgram || student.program, false],
            ['Year level / section', [student.yearLevel, student.section].filter(Boolean).join(' • '), false],
          ].map(([label, value, mono]) => (
            <div key={String(label)}>
              <div className="text-[9px] font-bold uppercase tracking-wider text-slate-500">{label}</div>
              <div className={`text-[12px] font-semibold ${mono ? 'font-mono' : ''}`}>{value || '—'}</div>
            </div>
          ))}
        </section>

        <section>
          <div className="mb-1.5 text-[10px] font-bold uppercase tracking-wider text-[#18392B]">Assessed fees</div>
          <table className="w-full border-collapse rounded-lg border border-slate-300 text-left text-[12px]">
            <thead className="bg-slate-100 text-[10px] uppercase tracking-wider text-slate-700">
              <tr>
                <th className="w-8 border-b border-slate-300 px-2 py-2 text-center">#</th>
                <th className="border-b border-slate-300 px-2 py-2">Particulars</th>
                <th className="border-b border-slate-300 px-2 py-2 text-right">Amount</th>
              </tr>
            </thead>
            <tbody>
              {lines.length === 0 ? (
                <tr>
                  <td colSpan={3} className="px-2 py-6 text-center text-slate-500">
                    No fees have been assessed for this term yet.
                  </td>
                </tr>
              ) : (
                lines.map((l, i) => (
                  <tr key={`${l.name}-${i}`} className="odd:bg-white even:bg-slate-50/70">
                    <td className="border-b border-slate-200 px-2 py-1.5 text-center text-slate-500">{i + 1}</td>
                    <td className="border-b border-slate-200 px-2 py-1.5">
                      <span className={l.kind === 'discount' ? 'text-emerald-800' : ''}>{l.name}</span>
                      {l.detail && <span className="block text-[10px] text-slate-500">{l.detail}</span>}
                    </td>
                    <td className={`border-b border-slate-200 px-2 py-1.5 text-right font-mono ${l.amount < 0 ? 'text-emerald-800' : ''}`}>
                      {l.amount < 0 ? `−${peso(Math.abs(l.amount))}` : peso(l.amount)}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
            <tfoot>
              <tr className="bg-slate-100">
                <td colSpan={2} className="px-2 py-2 text-right text-[11px] font-bold uppercase tracking-wider">
                  Total assessment this term{a.totalUnits ? ` (${a.totalUnits} units)` : ''}
                </td>
                <td className="px-2 py-2 text-right font-mono text-[13px] font-bold text-[#18392B]">{peso(total)}</td>
              </tr>
            </tfoot>
          </table>
        </section>

        <section className="grid grid-cols-1 gap-4 sm:grid-cols-[1fr_1.1fr]">
          <table className="w-full self-start rounded-lg border border-slate-300 text-[12px]">
            <caption className="bg-[#18392B] px-3 py-1.5 text-left text-[10px] font-bold uppercase tracking-wider text-white">Account summary</caption>
            <tbody>
              <tr className="border-b border-slate-200">
                <td className="px-3 py-1.5 text-slate-600">Assessment this term</td>
                <td className="px-3 py-1.5 text-right font-mono">{peso(total)}</td>
              </tr>
              {account.previousBalance > 0 && (
                <tr className="border-b border-slate-200">
                  <td className="px-3 py-1.5 text-slate-600">Previous balance</td>
                  <td className="px-3 py-1.5 text-right font-mono">{peso(account.previousBalance)}</td>
                </tr>
              )}
              <tr className="border-b border-slate-200">
                <td className="px-3 py-1.5 text-slate-600">Less: payments received</td>
                <td className="px-3 py-1.5 text-right font-mono">−{peso(account.totalCharges > 0 ? account.paymentsThisTerm : 0)}</td>
              </tr>
              <tr>
                <td className="px-3 py-2 font-bold">Balance due</td>
                <td className="px-3 py-2 text-right font-mono text-[13px] font-bold text-[#18392B]">{peso(balance)}</td>
              </tr>
            </tbody>
          </table>
          <div className="space-y-2 text-[11px]">
            <p className="font-bold uppercase tracking-wider text-[#18392B] text-[10px]">How to pay</p>
            <PaymentInstructions compact reportHint={false} />
            <p className="text-slate-600">
              After paying, report the payment in the Student Portal (Amount Due &amp; Payment) with the reference number. The balance is
              updated once the Finance Office verifies it.
            </p>
          </div>
        </section>

        <section className="grid grid-cols-1 gap-8 pt-5 text-center text-[11px] sm:grid-cols-2">
          <div>
            <div className="h-10 border-b border-slate-500" />
            <div className="mt-1 font-semibold">Assessed by</div>
            <div className="text-[10px] text-slate-500">Accounting / Registrar&apos;s Office • Signature over printed name • Date</div>
          </div>
          <div>
            <div className="flex h-10 items-end justify-center border-b border-slate-500 font-semibold uppercase">{name}</div>
            <div className="mt-1 font-semibold">Student conforme</div>
            <div className="text-[10px] text-slate-500">Signature over printed name • Date</div>
          </div>
        </section>

        <footer className="flex flex-col gap-1 border-t border-slate-300 pt-3 text-[9.5px] text-slate-500 sm:flex-row sm:justify-between">
          <span>This statement reflects the official assessment on file as of the date issued. Fees are subject to the College&apos;s refund and withdrawal policy.</span>
          <span className="font-mono">{slipNumber(student, a)}</span>
        </footer>
      </div>
    </article>
  );
};
