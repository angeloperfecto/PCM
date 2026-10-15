'use client';

import React, { useMemo } from 'react';
import { Award, BookOpen, CheckCircle2, Clock, GraduationCap, Printer, TrendingUp } from 'lucide-react';
import { usePCM } from '@/lib/store';
import { gradingScaleOf, lookupGrade } from '@/lib/grades';
import { normAY } from '@/lib/reenrollment';
import { academicStanding } from '@/lib/studentDefaults';
import { printDocument } from '@/components/enrollment/CertificateOfRegistration';
import type { StudentSubjectHistory } from '@/lib/types';

const num = (g: unknown) => {
  const n = typeof g === 'number' ? g : parseFloat(String(g ?? ''));
  return Number.isFinite(n) && n > 0 ? n : null;
};

/** Units-weighted average of numeric grades (codes such as INC are not counted). */
function weightedAverage(rows: { grade: unknown; units: number }[]): number | null {
  const graded = rows.map((r) => ({ g: num(r.grade), u: Number(r.units) || 0 })).filter((r) => r.g !== null && r.u > 0);
  const units = graded.reduce((t, r) => t + r.u, 0);
  return units ? Math.round((graded.reduce((t, r) => t + (r.g as number) * r.u, 0) / units) * 100) / 100 : null;
}

const REMARK_STYLE: Record<string, string> = {
  passed: 'bg-emerald-100 text-emerald-800 border-emerald-200',
  credited: 'bg-emerald-100 text-emerald-800 border-emerald-200',
  failed: 'bg-rose-100 text-rose-800 border-rose-200',
  incomplete: 'bg-amber-100 text-amber-900 border-amber-200',
};
const remarkClass = (r: string) => REMARK_STYLE[r.trim().toLowerCase()] || 'bg-slate-100 text-slate-600 border-slate-200';

// Student Portal → Grades & Evaluation. Everything comes from the student's own record:
// current-term subjects (grades appear once the Registrar publishes them) and the academic history.
export const StudentGradesModule: React.FC = () => {
  const { studentProfile, enrollmentSystemConfig } = usePCM();
  const scale = gradingScaleOf(enrollmentSystemConfig);

  const courses = (studentProfile.courses || []).filter((c) => c.status !== 'Dropped');
  const released = courses.filter((c) => String(c.finalGrade ?? '').trim());
  const termUnits = courses.reduce((t, c) => t + (Number(c.units) || 0), 0);
  const termGwa = weightedAverage(released.map((c) => ({ grade: c.finalGrade, units: c.units })));

  const history = useMemo(() => studentProfile.subjectHistory || [], [studentProfile.subjectHistory]);
  const { gpa: cumulative, unitsEarned } = academicStanding(studentProfile);

  // Academic history by term, newest first.
  const terms = useMemo(() => {
    const map = new Map<string, { label: string; sortKey: string; rows: StudentSubjectHistory[] }>();
    for (const h of history) {
      const ay = normAY(h.academicYear);
      const label = `${h.semester || 'Term'}, AY ${ay || '—'}`;
      const semRank = /2nd|second/i.test(h.semester || '') ? 2 : /summer/i.test(h.semester || '') ? 3 : 1;
      const cur = map.get(label) || { label, sortKey: `${ay}-${semRank}`, rows: [] };
      cur.rows.push(h);
      map.set(label, cur);
    }
    return Array.from(map.values()).sort((a, b) => b.sortKey.localeCompare(a.sortKey));
  }, [history]);

  const stat = (icon: React.ReactNode, label: string, value: React.ReactNode, hint?: string) => (
    <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-xs">
      <span className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider text-slate-500">{icon} {label}</span>
      <strong className="mt-1 block font-mono text-xl text-[#18392B]">{value}</strong>
      {hint && <span className="text-[11px] text-slate-500">{hint}</span>}
    </div>
  );

  return (
    <div className="space-y-5" id="pcm-student-grades">
      <div className="flex flex-col gap-3 rounded-2xl border border-slate-200 bg-white p-5 shadow-xs sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h3 className="font-serif text-xl font-bold text-[#18392B]">Term Grades &amp; Academic Evaluation</h3>
          <p className="text-xs text-slate-500">
            {studentProfile.fullName || studentProfile.name} • {studentProfile.studentId} • {studentProfile.degreeProgram || studentProfile.program}
            {studentProfile.yearLevel ? ` • ${studentProfile.yearLevel}` : ''}
          </p>
          <p className="mt-1 text-xs text-slate-500">Grades appear here once the Registrar finalizes and publishes your professor&apos;s grade sheet.</p>
        </div>
        <div className="flex flex-wrap items-center gap-2 print:hidden">
          {studentProfile.academicStatus && (
            <span className="rounded-full border border-amber-300 bg-amber-50 px-3 py-1 text-xs font-bold text-amber-900">Academic status: {studentProfile.academicStatus}</span>
          )}
          <button type="button" onClick={() => printDocument('pcm-student-grades', 'Grade Report')} className="inline-flex items-center gap-1.5 rounded-lg border border-slate-300 px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50">
            <Printer className="h-3.5 w-3.5" /> Print
          </button>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {stat(<BookOpen className="h-3.5 w-3.5" />, 'Current term', `${courses.length} subject${courses.length === 1 ? '' : 's'}`, `${termUnits} units • ${studentProfile.currentSemester || 'No term on record'}`)}
        {stat(<CheckCircle2 className="h-3.5 w-3.5" />, 'Grades released', `${released.length} / ${courses.length}`, released.length < courses.length ? `${courses.length - released.length} not yet released` : courses.length ? 'All released' : '—')}
        {stat(<TrendingUp className="h-3.5 w-3.5" />, 'Term average', termGwa !== null ? termGwa.toFixed(2) : '—', 'Released numeric grades, weighted by units')}
        {stat(<Award className="h-3.5 w-3.5" />, 'Cumulative GPA', cumulative ? cumulative.toFixed(2) : '—', `${unitsEarned} units earned`)}
      </div>

      <section className="space-y-3 rounded-2xl border border-slate-200 bg-white p-5 shadow-xs">
        <h4 className="flex items-center gap-2 font-serif text-base font-bold text-[#18392B]">
          <GraduationCap className="h-4 w-4 text-[#588B76]" /> {studentProfile.currentSemester || 'Current term'}
        </h4>
        {courses.length === 0 ? (
          <p className="rounded-xl bg-slate-50 p-4 text-xs text-slate-600">No subjects for the current term. After a term is closed, its grades appear in your academic history below.</p>
        ) : (
          <>
          <ul className="space-y-2 sm:hidden">
            {courses.map((c) => {
              const grade = String(c.finalGrade ?? '').trim();
              const l = lookupGrade(scale, grade);
              const remark = grade ? c.gradeRemark || (l.kind === 'value' || l.kind === 'code' ? l.remark : c.status === 'Completed' ? 'Completed' : '') : '';
              return (
                <li key={c.id || c.code} className="flex items-start justify-between gap-3 rounded-xl border border-slate-200 p-3 text-xs">
                  <span className="min-w-0">
                    <span className="font-mono font-bold text-[#18392B]">{c.code}</span> <span className="text-slate-500">• {c.units} units</span>
                    <span className="block font-semibold text-slate-900">{c.title}</span>
                    <span className="block text-[11px] text-slate-500">{c.instructor || 'TBA'}</span>
                  </span>
                  <span className="shrink-0 text-right">
                    {grade ? (
                      <>
                        <span className="block font-mono text-base font-extrabold text-[#18392B]">{grade}</span>
                        <span className={`mt-0.5 inline-block rounded-full border px-2 py-0.5 text-[10px] font-bold ${remarkClass(remark)}`}>{remark || '—'}</span>
                      </>
                    ) : (
                      <span className="inline-flex items-center gap-1 rounded-full border border-slate-200 bg-slate-50 px-2 py-0.5 text-[10px] font-bold text-slate-500">
                        <Clock className="h-3 w-3" /> Not yet released
                      </span>
                    )}
                  </span>
                </li>
              );
            })}
          </ul>
          <div className="hidden overflow-x-auto sm:block">
            <table className="w-full min-w-[560px] text-left text-xs">
              <thead className="bg-[#18392B] text-[10px] uppercase tracking-wider text-white">
                <tr>
                  <th className="p-2.5">Code</th>
                  <th className="p-2.5">Subject</th>
                  <th className="p-2.5">Instructor</th>
                  <th className="p-2.5 text-center">Units</th>
                  <th className="p-2.5 text-center">Final grade</th>
                  <th className="p-2.5">Equivalent</th>
                  <th className="p-2.5">Remark</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {courses.map((c) => {
                  const grade = String(c.finalGrade ?? '').trim();
                  const l = lookupGrade(scale, grade);
                  const remark = grade ? c.gradeRemark || (l.kind === 'value' || l.kind === 'code' ? l.remark : c.status === 'Completed' ? 'Completed' : '') : '';
                  return (
                    <tr key={c.id || c.code} className="hover:bg-slate-50">
                      <td className="p-2.5 font-mono font-bold text-[#18392B]">{c.code}</td>
                      <td className="p-2.5 font-semibold text-slate-900">{c.title}</td>
                      <td className="p-2.5 text-slate-600">{c.instructor || 'TBA'}</td>
                      <td className="p-2.5 text-center font-mono">{c.units}</td>
                      <td className="p-2.5 text-center">
                        {grade ? (
                          <span className="font-mono text-sm font-extrabold text-[#18392B]">{grade}</span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-[11px] text-slate-500"><Clock className="h-3 w-3" /> Not yet released</span>
                        )}
                      </td>
                      <td className="p-2.5 text-slate-600">{grade ? l.equivalent || '—' : '—'}</td>
                      <td className="p-2.5">
                        {grade ? (
                          <span className={`rounded-full border px-2 py-0.5 text-[10px] font-bold ${remarkClass(remark)}`}>{remark || '—'}</span>
                        ) : (
                          <span className="rounded-full border border-slate-200 bg-slate-50 px-2 py-0.5 text-[10px] font-bold text-slate-500">Pending</span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          </>
        )}
      </section>

      <section className="space-y-3 rounded-2xl border border-slate-200 bg-white p-5 shadow-xs">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h4 className="font-serif text-base font-bold text-[#18392B]">Academic history</h4>
          <span className="text-xs text-slate-500">
            {history.length} subject{history.length === 1 ? '' : 's'} • {unitsEarned} units earned • GPA {cumulative ? cumulative.toFixed(2) : '—'}
          </span>
        </div>
        {terms.length === 0 ? (
          <p className="rounded-xl bg-slate-50 p-4 text-xs text-slate-600">No completed terms yet.</p>
        ) : (
          terms.map((t, i) => {
            const avg = weightedAverage(t.rows.map((h) => ({ grade: h.grade, units: h.units })));
            const units = t.rows.reduce((s, h) => s + (Number(h.units) || 0), 0);
            return (
              <details key={t.label} open={i === 0} className="rounded-xl border border-slate-200">
                <summary className="flex cursor-pointer flex-wrap items-center justify-between gap-2 bg-slate-50 px-3 py-2 text-xs">
                  <strong className="text-slate-900">{t.label}</strong>
                  <span className="text-slate-600">
                    {t.rows.length} subject{t.rows.length === 1 ? '' : 's'} • {units} units • Average {avg !== null ? avg.toFixed(2) : '—'}
                  </span>
                </summary>
                <div className="overflow-x-auto">
                  <table className="w-full min-w-[420px] text-left text-xs">
                    <thead className="text-[10px] uppercase text-slate-500">
                      <tr><th className="p-2">Code</th><th className="p-2">Subject</th><th className="p-2 text-center">Units</th><th className="p-2 text-center">Grade</th><th className="p-2">Remark</th></tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {t.rows.map((h, k) => {
                        const g = h.grade !== '' && h.grade != null ? String(h.grade) : '';
                        const shown = g && num(g) !== null ? (num(g) as number).toFixed(2) : g;
                        return (
                          <tr key={`${h.code}-${k}`}>
                            <td className="p-2 font-mono font-bold text-[#18392B]">{h.code}</td>
                            <td className="p-2">{h.title}</td>
                            <td className="p-2 text-center font-mono">{h.units}</td>
                            <td className="p-2 text-center font-mono font-bold">{shown || '—'}</td>
                            <td className="p-2">
                              <span className={`rounded-full border px-2 py-0.5 text-[10px] font-bold ${remarkClass(String(h.status))}`}>{h.status}</span>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </details>
            );
          })
        )}
        <p className="text-[11px] text-slate-500">Averages use numeric grades weighted by units; codes such as INC are not counted.</p>
      </section>
    </div>
  );
};
