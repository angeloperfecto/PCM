'use client';

import React, { useMemo, useState } from 'react';
import { Users } from 'lucide-react';
import { usePCM } from '@/lib/store';
import { normalizeStatus } from '@/lib/enrollmentWorkflow';
import { displayTerm, sameTerm, termKeyOf, termLabel } from '@/lib/reenrollment';

type Category = 'New Students' | 'Transferees' | 'Returnees' | 'Continuing Students';
const CATEGORIES: Category[] = ['New Students', 'Transferees', 'Returnees', 'Continuing Students'];
const CLOSED_APP = ['Rejected', 'Withdrawn', 'Deferred'];

// Enrollment for one term by student category: new students and transferees come through Admissions,
// returnees through Admissions or re-enrollment, continuing students through re-enrollment.
export const TermEnrollmentOverview: React.FC = () => {
  const { academicPeriods, applications, enrollments, students } = usePCM();
  const terms = useMemo(() => [...academicPeriods].sort((a, b) => Number(!!b.isCurrent) - Number(!!a.isCurrent) || termKeyOf(b.semester, b.academicYear).localeCompare(termKeyOf(a.semester, a.academicYear))), [academicPeriods]);
  const fallback = displayTerm(academicPeriods);
  const [termId, setTermId] = useState('');
  const term = terms.find((p) => p.id === termId) || fallback || terms[0];
  if (!term) return null;
  const key = termKeyOf(term.semester, term.academicYear);
  const isOpenTerm = fallback?.id === term.id;

  const rows: Record<Category, { applying: number; enrolled: number }> = {
    'New Students': { applying: 0, enrolled: 0 },
    Transferees: { applying: 0, enrolled: 0 },
    Returnees: { applying: 0, enrolled: 0 },
    'Continuing Students': { applying: 0, enrolled: 0 },
  };
  const appCategory = (t?: string): Category => (t === 'Transfer Student' ? 'Transferees' : t === 'Returning Student' ? 'Returnees' : 'New Students');

  // Admissions: by the term of the registration or enrollment; applications not registered yet count toward the open term.
  for (const a of applications as any[]) {
    const st = normalizeStatus(a.status);
    if (CLOSED_APP.includes(st)) continue;
    const t = a.enrollmentConfirmation || a.registration;
    const forTerm = t?.semester && t?.academicYear ? termKeyOf(t.semester, t.academicYear) === key : isOpenTerm;
    if (!forTerm) continue;
    const c = appCategory(a.applicantType);
    if (st === 'Enrolled') rows[c].enrolled += 1;
    else rows[c].applying += 1;
  }
  // Re-enrollment requests.
  for (const e of enrollments) {
    if (!e.reenrollment || termKeyOf(e.semester, e.schoolYear) !== key) continue;
    if (['Rejected', 'Not Eligible', 'Cancelled'].includes(String(e.status))) continue;
    const c: Category = e.enrollmentType === 'Returnee' ? 'Returnees' : 'Continuing Students';
    if (e.status === 'Approved') rows[c].enrolled += 1;
    else rows[c].applying += 1;
  }
  const enrolledOnRecord = students.filter((s) => s.enrollmentStatus === 'Enrolled' && sameTerm(s.currentSemester, termLabel(term.semester, term.academicYear))).length;
  const totalApplying = CATEGORIES.reduce((t, c) => t + rows[c].applying, 0);

  return (
    <div className="space-y-3 rounded-xl border border-slate-200 bg-white p-4" data-testid="term-enrollment-overview">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h4 className="flex items-center gap-2 text-sm font-bold text-[#18392B]">
          <Users className="h-4 w-4 text-[#588B76]" /> Enrollment by student type
        </h4>
        <select aria-label="Term" value={term.id} onChange={(e) => setTermId(e.target.value)} className="rounded-lg border border-slate-300 bg-white p-1.5 text-xs">
          {terms.map((p) => (
            <option key={p.id} value={p.id}>{termLabel(p.semester, p.academicYear)}{p.id === fallback?.id ? ' (open / current)' : p.closedAt ? ' (closed)' : ''}</option>
          ))}
        </select>
      </div>
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
        {CATEGORIES.map((c) => (
          <div key={c} className="rounded-lg border border-slate-200 bg-slate-50 p-2.5 text-xs">
            <span className="block text-[10px] font-bold uppercase text-slate-500">{c}</span>
            <span className="font-mono text-lg font-bold text-[#18392B]">{rows[c].enrolled}</span> <span className="text-slate-500">enrolled</span>
            <span className="block text-amber-800">{rows[c].applying} in progress</span>
          </div>
        ))}
      </div>
      <p className="text-[11px] text-slate-500">
        {enrolledOnRecord} student{enrolledOnRecord === 1 ? '' : 's'} enrolled for {termLabel(term.semester, term.academicYear)}
        {term.capacity ? ` (capacity ${term.capacity})` : ''} • {totalApplying} application{totalApplying === 1 ? '' : 's'} in progress. New students and transferees
        enroll through Admissions Review; continuing students and returnees with a portal account re-enroll in the Student Portal (Enrollment Queue).
      </p>
    </div>
  );
};
