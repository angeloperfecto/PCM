'use client';

import React from 'react';
import { Emblem } from '@/components/common/Emblem';
import { usePCM } from '@/lib/store';
import type { StudentProfile } from '@/lib/types';
import { accountSummary } from '@/lib/studentLedger';
import { assessedLines } from '@/components/enrollment/AssessmentSlip';

const peso = (n: number) => `₱${(Number(n) || 0).toLocaleString('en-PH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
const OFFICIAL = ['Enrolled', 'Officially Enrolled', 'Approved'];

// Short, stable document number for this student and term, e.g. COR-2026PCM0001-1S2627.
function corNumber(student: StudentProfile): string {
  const id = (student.studentId || student.id || '').replace(/[^A-Za-z0-9]/g, '').toUpperCase();
  const term = (student.currentSemester || '').match(/(\d)(?:st|nd|rd|th)\s+Semester.*?(\d{2})(\d{2})\s*[–-]\s*\d{2}(\d{2})/i);
  const termCode = term ? `${term[1]}S${term[3]}${term[4]}` : (student.currentSemester || '').replace(/[^0-9]/g, '').slice(-6);
  return `COR-${id}${termCode ? `-${termCode}` : ''}`;
}

// The official Certificate of Registration, shared by the Student Portal and the Admin Workspace.
// Print it with printCertificate(), which prints only the certificate on an A4/Letter page.
export const CertificateOfRegistration: React.FC<{ student: StudentProfile; id?: string }> = ({ student, id = 'pcm-cor-document' }) => {
  const { siteConfig, calculateStudentAssessment } = usePCM();
  const contact = (siteConfig as any)?.contactInfo || {};
  const address = [contact.addressLine1, contact.addressLine2].filter(Boolean).join(', ') || contact.address || '';
  const contactLine = [contact.phonePrimary || contact.phone, contact.emailGeneral].filter(Boolean).join(' • ');

  const courses = (student.courses || []).filter((c) => c.status !== 'Dropped');
  const totalUnits = courses.reduce((s, c) => s + (Number(c.units) || 0), 0);
  const account = accountSummary(student as any);
  // The same itemized assessment as the Statement of Assessment (Registrar's official lines when on file).
  const fees = assessedLines(calculateStudentAssessment(student.id || student.studentId));
  const hasRecord = account.totalCharges > 0;
  const balance = hasRecord ? account.balance : fees.total;
  const groups = fees.lines.reduce<{ group: string; lines: typeof fees.lines }[]>((out, l) => {
    const last = out[out.length - 1];
    if (last && last.group === l.group) last.lines.push(l);
    else out.push({ group: l.group, lines: [l] });
    return out;
  }, []);
  const isOfficial = OFFICIAL.includes(String(student.enrollmentStatus || ''));
  const issued = new Date().toLocaleDateString('en-PH', { year: 'numeric', month: 'long', day: 'numeric' });
  const name = student.fullName || student.name || '';

  const Field = ({ label, value, mono }: { label: string; value?: React.ReactNode; mono?: boolean }) => (
    <div className="px-3 py-2">
      <div className="text-[9px] font-bold uppercase tracking-wider text-slate-500">{label}</div>
      <div className={`text-[12px] font-semibold text-slate-900 ${mono ? 'font-mono' : ''}`}>{value || '—'}</div>
    </div>
  );

  return (
    <article
      id={id}
      className="cor-sheet relative mx-auto w-full max-w-[820px] overflow-hidden bg-white text-slate-900 border border-slate-300 shadow-sm"
      aria-label="Certificate of Registration"
    >
      {/* Faint seal watermark */}
      <div className="pointer-events-none absolute inset-0 flex items-center justify-center opacity-[0.045]" aria-hidden="true">
        <Emblem id={`${id}-watermark`} size={460} />
      </div>
      {!isOfficial && (
        <div className="pointer-events-none absolute inset-0 flex items-center justify-center" aria-hidden="true">
          <span className="rotate-[-24deg] whitespace-nowrap rounded border-4 border-rose-300/70 px-6 py-2 text-3xl font-black uppercase tracking-[0.3em] text-rose-300/70">
            Not yet official
          </span>
        </div>
      )}

      <div className="h-2 bg-[#18392B]" />
      <div className="h-1 bg-[#D4A63A]" />

      <div className="relative space-y-5 p-6 sm:p-8">
        {/* Letterhead */}
        <header className="flex flex-col items-center gap-4 border-b-2 border-[#18392B] pb-4 sm:flex-row sm:items-start">
          <Emblem id={`${id}-seal`} size={76} className="shrink-0" />
          <div className="flex-1 text-center sm:text-left">
            <h2 className="font-serif text-[22px] font-extrabold uppercase leading-tight tracking-wide text-[#18392B]">
              Philippine College of Ministry
            </h2>
            <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-[#588B76]">Office of the Registrar</p>
            {address && <p className="mt-0.5 text-[11px] text-slate-600">{address}</p>}
            {contactLine && <p className="text-[11px] text-slate-600">{contactLine}</p>}
          </div>
          <dl className="shrink-0 rounded-lg border border-slate-300 text-[11px] sm:text-right">
            <div className="border-b border-slate-200 px-3 py-1.5">
              <dt className="text-[9px] font-bold uppercase tracking-wider text-slate-500">COR No.</dt>
              <dd className="font-mono font-bold text-[#18392B]">{corNumber(student)}</dd>
            </div>
            <div className="px-3 py-1.5">
              <dt className="text-[9px] font-bold uppercase tracking-wider text-slate-500">Date issued</dt>
              <dd className="font-semibold">{issued}</dd>
            </div>
          </dl>
        </header>

        {/* Title */}
        <div className="text-center">
          <h3 className="font-serif text-[18px] font-bold uppercase tracking-[0.25em] text-[#18392B]">Certificate of Registration</h3>
          <p className="text-[12px] text-slate-600">{student.currentSemester || 'Current term'}</p>
        </div>

        {/* Student information */}
        <section className="rounded-lg border border-slate-300">
          <div className="border-b border-slate-300 bg-[#18392B] px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider text-white">Student information</div>
          <div className="grid grid-cols-2 divide-slate-200 sm:grid-cols-4 [&>*]:border-b [&>*]:border-slate-200">
            <Field label="Student No." value={student.studentId} mono />
            <div className="col-span-1 sm:col-span-3"><Field label="Name" value={name} /></div>
            <div className="col-span-2"><Field label="Program" value={student.degreeProgram || student.program} /></div>
            <Field label="Year level" value={student.yearLevel} />
            <Field label="Section" value={student.section} />
            <Field label="Major / Track" value={(student as any).major} />
            <Field label="Status" value={isOfficial ? 'Officially enrolled' : student.enrollmentStatus || 'Pending'} />
            <Field label="Units enrolled" value={String(totalUnits)} />
            <Field label="Email" value={student.email} />
          </div>
        </section>

        {/* Subjects */}
        <section>
          <div className="mb-1.5 text-[10px] font-bold uppercase tracking-wider text-[#18392B]">Registered subjects</div>
          <div className="overflow-x-auto md:overflow-x-visible rounded-lg border border-slate-300">
            <table className="w-full min-w-[620px] border-collapse text-left text-[11px]">
              <thead className="bg-slate-100 text-[10px] uppercase tracking-wider text-slate-700">
                <tr>
                  <th className="w-8 border-b border-slate-300 px-2 py-2 text-center">#</th>
                  <th className="border-b border-slate-300 px-2 py-2">Code</th>
                  <th className="border-b border-slate-300 px-2 py-2">Descriptive title</th>
                  <th className="border-b border-slate-300 px-2 py-2 text-center">Units</th>
                  <th className="border-b border-slate-300 px-2 py-2">Schedule</th>
                  <th className="border-b border-slate-300 px-2 py-2">Room</th>
                  <th className="border-b border-slate-300 px-2 py-2">Instructor</th>
                </tr>
              </thead>
              <tbody>
                {courses.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-2 py-6 text-center text-slate-500">No subjects are registered for this term yet.</td>
                  </tr>
                ) : (
                  courses.map((c, i) => (
                    <tr key={c.id || c.code || i} className="odd:bg-white even:bg-slate-50/70">
                      <td className="border-b border-slate-200 px-2 py-1.5 text-center text-slate-500">{i + 1}</td>
                      <td className="whitespace-nowrap border-b border-slate-200 px-2 py-1.5 font-mono font-bold">{c.code}</td>
                      <td className="border-b border-slate-200 px-2 py-1.5">{c.title}</td>
                      <td className="border-b border-slate-200 px-2 py-1.5 text-center font-mono">{c.units}</td>
                      <td className="border-b border-slate-200 px-2 py-1.5">{c.schedule || 'TBA'}</td>
                      <td className="border-b border-slate-200 px-2 py-1.5">{c.room || 'TBA'}</td>
                      <td className="border-b border-slate-200 px-2 py-1.5">{c.instructor || 'TBA'}</td>
                    </tr>
                  ))
                )}
              </tbody>
              <tfoot>
                <tr className="bg-slate-100 font-bold">
                  <td colSpan={3} className="px-2 py-2 text-right text-[10px] uppercase tracking-wider">Total units</td>
                  <td className="px-2 py-2 text-center font-mono">{totalUnits}</td>
                  <td colSpan={3} className="px-2 py-2 text-slate-500 font-normal">
                    {courses.length} subject{courses.length === 1 ? '' : 's'}
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>
        </section>

        {/* Tuition & institutional fee assessment */}
        <section>
          <div className="mb-1.5 text-[10px] font-bold uppercase tracking-wider text-[#18392B]">Tuition &amp; institutional fee assessment</div>
          <div className="overflow-hidden rounded-lg border border-slate-300">
            <table className="w-full border-collapse text-left text-[11px]">
              <thead className="bg-slate-100 text-[10px] uppercase tracking-wider text-slate-700">
                <tr>
                  <th className="border-b border-slate-300 px-2 py-2">Particulars</th>
                  <th className="w-36 border-b border-slate-300 px-2 py-2 text-right">Amount</th>
                </tr>
              </thead>
              <tbody>
                {groups.length === 0 ? (
                  <tr>
                    <td colSpan={2} className="px-2 py-5 text-center text-slate-500">No fees have been assessed for this term yet.</td>
                  </tr>
                ) : (
                  groups.map((g) => {
                    const subtotal = Math.round(g.lines.reduce((t, l) => t + l.amount, 0) * 100) / 100;
                    const money = (n: number) => (n < 0 ? `−${peso(Math.abs(n))}` : peso(n));
                    return (
                      <React.Fragment key={g.group}>
                        <tr className="bg-[#18392B]/[0.04]">
                          <td className="border-b border-slate-200 px-2 py-1 text-[10px] font-bold uppercase tracking-wider text-[#18392B]">{g.group}</td>
                          <td className="border-b border-slate-200 px-2 py-1 text-right font-mono text-[10px] font-bold text-[#18392B]">
                            {g.lines.length > 1 ? money(subtotal) : ''}
                          </td>
                        </tr>
                        {g.lines.map((l, i) => (
                          <tr key={`${g.group}-${i}`}>
                            <td className="border-b border-slate-200 py-1 pl-5 pr-2">
                              <span className={l.kind === 'discount' ? 'text-emerald-800' : ''}>{l.name}</span>
                              {l.detail && <span className="ml-1.5 text-[10px] text-slate-500">({l.detail})</span>}
                            </td>
                            <td className={`border-b border-slate-200 px-2 py-1 text-right font-mono ${l.amount < 0 ? 'text-emerald-800' : ''}`}>{money(l.amount)}</td>
                          </tr>
                        ))}
                      </React.Fragment>
                    );
                  })
                )}
              </tbody>
              <tfoot>
                <tr className="bg-slate-100">
                  <td className="px-2 py-2 text-right text-[10px] font-bold uppercase tracking-wider">
                    Total assessment this term{totalUnits ? ` (${totalUnits} units)` : ''}
                  </td>
                  <td className="px-2 py-2 text-right font-mono text-[12px] font-bold text-[#18392B]">{peso(fees.total)}</td>
                </tr>
              </tfoot>
            </table>
          </div>
        </section>

        {/* Certification and account summary */}
        <section className="grid grid-cols-1 gap-4 sm:grid-cols-[1.4fr_1fr]">
          <p className="rounded-lg border border-slate-300 p-3 text-[11px] leading-relaxed text-slate-700">
            This is to certify that <strong>{name || 'the student named above'}</strong> is{' '}
            {isOfficial ? 'officially registered' : 'listed'} in the Philippine College of Ministry for{' '}
            <strong>{student.currentSemester || 'the current term'}</strong> in the subjects listed above, subject to the rules and
            regulations of the College.
          </p>
          <table className="w-full self-start rounded-lg border border-slate-300 text-[11px]">
            <caption className="bg-[#18392B] px-3 py-1.5 text-left text-[10px] font-bold uppercase tracking-wider text-white">Account summary</caption>
            <tbody>
              <tr className="border-b border-slate-200">
                <td className="px-3 py-1.5 text-slate-600">Assessment this term</td>
                <td className="px-3 py-1.5 text-right font-mono font-semibold">{peso(fees.total)}</td>
              </tr>
              {account.previousBalance > 0 && (
                <tr className="border-b border-slate-200">
                  <td className="px-3 py-1.5 text-slate-600">Previous balance</td>
                  <td className="px-3 py-1.5 text-right font-mono font-semibold">{peso(account.previousBalance)}</td>
                </tr>
              )}
              <tr className="border-b border-slate-200">
                <td className="px-3 py-1.5 text-slate-600">Less: payments received</td>
                <td className="px-3 py-1.5 text-right font-mono font-semibold">−{peso(hasRecord ? account.paymentsThisTerm : 0)}</td>
              </tr>
              <tr>
                <td className="px-3 py-1.5 font-bold">Balance due</td>
                <td className="px-3 py-1.5 text-right font-mono font-bold text-[#18392B]">{peso(balance)}</td>
              </tr>
            </tbody>
          </table>
        </section>

        {/* Signatures */}
        <section className="grid grid-cols-1 gap-8 pt-6 text-center text-[11px] sm:grid-cols-2">
          <div>
            <div className="flex h-10 items-end justify-center border-b border-slate-500 font-semibold uppercase">{name}</div>
            <div className="mt-1 font-semibold">Student</div>
            <div className="text-[10px] text-slate-500">Signature over printed name</div>
          </div>
          <div>
            <div className="h-10 border-b border-slate-500" />
            <div className="mt-1 font-semibold">College Registrar</div>
            <div className="text-[10px] text-slate-500">Signature over printed name • Date</div>
          </div>
        </section>

        <footer className="flex flex-col gap-1 border-t border-slate-300 pt-3 text-[9.5px] text-slate-500 sm:flex-row sm:justify-between">
          <span>Valid only with the Registrar&apos;s signature and the College dry seal. Any erasure or alteration voids this certificate.</span>
          <span className="font-mono">{corNumber(student)}</span>
        </footer>
      </div>
    </article>
  );
};

// Prints only the certificate, in a separate window that carries the site's styles.
export function printCertificate(id = 'pcm-cor-document') {
  printDocument(id, 'Certificate of Registration');
}

// Prints one element (an official document) in its own window with the site's styles, so the
// printout contains only that document.
export function printDocument(id: string, title: string) {
  const el = document.getElementById(id);
  if (!el) return;
  const w = window.open('', '_blank', 'width=900,height=1100');
  if (!w) {
    window.print();
    return;
  }
  const styles = Array.from(document.querySelectorAll('link[rel="stylesheet"], style'))
    .map((n) => n.outerHTML)
    .join('\n');
  w.document.open();
  w.document.write(`<!doctype html><html><head><meta charset="utf-8"><title>${title}</title>${styles}
<style>
  @page { size: A4; margin: 10mm; }
  html, body { background: #fff; margin: 0; }
  body { -webkit-print-color-adjust: exact; print-color-adjust: exact; padding: 12px; }
  .cor-sheet { box-shadow: none !important; max-width: 100% !important; border: 0 !important; }
  @media print { body { padding: 0; } }
</style></head><body>${el.outerHTML}</body></html>`);
  w.document.close();
  const go = () => {
    w.focus();
    w.print();
  };
  if (w.document.readyState === 'complete') setTimeout(go, 400);
  else w.addEventListener('load', () => setTimeout(go, 200));
}
