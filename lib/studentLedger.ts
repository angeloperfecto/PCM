// One place for a student's fees and payments, so the Admin Workspace, Student Portal and COR
// all show the same numbers.
//
// Fees: the required items of Enrollment & Records → Tuition & Fee Policy (feeStructure), with
// per-unit items multiplied by units — the same formula the admissions assessment uses
// (draftAssessmentLines). Falls back to the default tuition per unit / registration fee in the
// enrollment settings when no fee items exist.
//
// Payments: a student record keeps cashier-recorded payments in `paymentHistory` and verified
// enrollment/balance payments in `paymentRecords`. ledgerPayments() merges both.

import { draftAssessmentLines } from './enrollmentWorkflow';
import type { EnrollmentSystemConfig, FeeStructureItem, StudentAssessment, StudentPaymentRecord, StudentProfile } from './types';

export interface TermFees {
  lines: { name: string; amount: number }[];
  total: number;
}

export function termFees(units: number, feeStructure: FeeStructureItem[], config?: Partial<EnrollmentSystemConfig> | null): TermFees {
  const lines = draftAssessmentLines(feeStructure || [], units, {
    tuitionPerUnit: (config as any)?.defaultTuitionPerUnit,
    registrationFee: (config as any)?.defaultRegistrationFee,
  });
  const total = Math.round(lines.reduce((s, l) => s + l.amount, 0) * 100) / 100;
  return { lines, total };
}

export interface LedgerPayment {
  id: string;
  amount: number;
  method: string;
  reference: string;
  date: string;
  status: string;
  description: string;
  receipt: string;
}

export function ledgerPayments(p: Pick<StudentProfile, 'paymentHistory'> & { paymentRecords?: StudentPaymentRecord[] }): LedgerPayment[] {
  const all = [...((p.paymentHistory || []) as any[]), ...(((p as any).paymentRecords || []) as any[])];
  const seen = new Set<string>();
  const out: LedgerPayment[] = [];
  for (const r of all) {
    if (!r) continue;
    const amount = Number(r.amount) || 0;
    const reference = r.referenceNo || r.referenceNumber || '';
    const key = r.id || `${reference}-${amount}-${r.paymentDate || r.date || ''}`;
    if (seen.has(key)) continue;
    seen.add(key);
    out.push({
      id: key,
      amount,
      method: r.method || r.paymentMethod || '',
      reference,
      date: r.paymentDate || r.date || r.verifiedAt || '',
      status: r.status || 'Verified',
      description: r.description || r.notes || '',
      receipt: r.officialReceiptNumber || r.receiptNo || '',
    });
  }
  return out.sort((a, b) => (b.date || '').localeCompare(a.date || ''));
}

export function verifiedPaidTotal(p: Parameters<typeof ledgerPayments>[0]): number {
  return Math.round(ledgerPayments(p).filter((x) => x.status === 'Verified').reduce((s, x) => s + x.amount, 0) * 100) / 100;
}

// The student's account, as every screen should show it. The record keeps running totals
// (tuitionTotal = all charges, tuitionPaid = all verified payments); when a new term is approved
// the Registrar's term assessment is added and the balance carried before it is kept in
// previousBalance.
export interface AccountSummary {
  termAssessment: number;
  previousBalance: number;
  paymentsThisTerm: number;
  balance: number;
  totalCharges: number;
  totalPaid: number;
}

export function accountSummary(p: Partial<StudentProfile> & { termAssessment?: number; previousBalance?: number }): AccountSummary {
  const totalCharges = Number(p.tuitionTotal) || 0;
  const totalPaid = Number(p.tuitionPaid) || 0;
  const balance = typeof p.tuitionBalance === 'number' ? Math.max(0, p.tuitionBalance) : Math.max(0, totalCharges - totalPaid);
  const termAssessment = typeof p.termAssessment === 'number' ? p.termAssessment : totalCharges;
  const previousBalance = typeof p.previousBalance === 'number' ? p.previousBalance : 0;
  const paymentsThisTerm = Math.max(0, Math.round((termAssessment + previousBalance - balance) * 100) / 100);
  return { termAssessment, previousBalance, paymentsThisTerm, balance, totalCharges, totalPaid };
}

// "1st Semester, AY 2026-2027" → { semester: '1st Semester', academicYear: '2026–2027' }
export function parseTerm(currentSemester?: string): { semester: string; academicYear: string } {
  const text = currentSemester || '';
  const sem = text.match(/(1st|2nd|3rd|Summer)[^,]*/i)?.[0]?.trim() || '';
  const ay = text.match(/(\d{4})\s*[–-]\s*(\d{4})/);
  return { semester: sem, academicYear: ay ? `${ay[1]}–${ay[2]}` : '' };
}

// The Registrar's itemized assessment for the current term: saved on the student record
// (termAssessmentLines) when a term is approved or Admissions finalizes enrollment. For records
// enrolled before that was saved, the admission application's assessment is used when its total
// matches the official term assessment.
export interface AssessmentLine {
  name: string;
  amount: number;
}
export function officialAssessmentLines(profile: Partial<StudentProfile>, applications?: any[]): AssessmentLine[] | null {
  const stored = (profile as any).termAssessmentLines;
  if (Array.isArray(stored) && stored.length) return stored.map((l: any) => ({ name: String(l.name || ''), amount: Number(l.amount) || 0 }));
  const app = (applications || []).find(
    (a) => a && ((a.studentRecordId && a.studentRecordId === profile.id) || (profile.applicationNumber && a.referenceNumber === profile.applicationNumber))
  );
  const items = app?.assessment?.items;
  if (Array.isArray(items) && items.length && Math.abs((Number(app.assessment.total) || 0) - accountSummary(profile as any).termAssessment) < 0.01) {
    return items.map((l: any) => ({ name: String(l.name || ''), amount: Number(l.amount) || 0 }));
  }
  return null;
}

// Rebuilds an assessment's breakdown from the official lines, so every line shown adds up to the
// official total (no estimated fees, no reconciling adjustment).
export function applyOfficialLines(a: StudentAssessment, lines: AssessmentLine[]): StudentAssessment {
  const r2 = (n: number) => Math.round(n * 100) / 100;
  const sum = (ls: AssessmentLine[]) => r2(ls.reduce((s, l) => s + l.amount, 0));
  const tuition = lines.filter((l) => l.amount > 0 && /tuition/i.test(l.name));
  const fees = lines.filter((l) => l.amount > 0 && !/tuition/i.test(l.name));
  const discounts = lines.filter((l) => l.amount < 0);
  const tuitionTotal = sum(tuition);
  const unitsInName = Number(tuition[0]?.name.match(/(\d+)\s*units?/i)?.[1]) || 0;
  const units = unitsInName || a.totalUnits;
  return {
    ...a,
    totalUnits: units,
    tuitionTotal,
    tuitionPerUnit: units ? r2(tuitionTotal / units) : 0,
    miscBreakdown: fees.map((l, i) => ({ id: `off-${i}`, name: l.name, amount: l.amount })),
    miscellaneousTotal: sum(fees),
    labBreakdown: [],
    laboratoryTotal: 0,
    otherBreakdown: [],
    otherFeesTotal: 0,
    discountsBreakdown: discounts.map((l, i) => ({ id: `offd-${i}`, name: l.name, amount: Math.abs(l.amount) })),
    discountsTotal: Math.abs(sum(discounts)),
    adjustmentsBreakdown: [],
    adjustmentsTotal: 0,
    totalAssessment: sum(lines),
  };
}
