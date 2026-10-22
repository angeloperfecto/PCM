'use client';

import React, { useMemo, useState } from 'react';
import { Download, Printer, Search, X } from 'lucide-react';
import { Emblem } from '@/components/common/Emblem';
import { printDocument } from '@/components/enrollment/CertificateOfRegistration';
import { parseTerm } from '@/lib/studentLedger';
import type { AcademicSubject, StudentProfile } from '@/lib/types';

const ENROLLED = ['Enrolled', 'Officially Enrolled', 'Approved'];
const norm = (s?: string) => (s || '').toLowerCase().replace(/[^a-z0-9]/g, '');
const sameAY = (a?: string, b?: string) => norm(a) === norm(b);

// Students officially enrolled in this subject: the subject is among their registered courses (not
// dropped) and, when the subject belongs to a term, their current term is that term.
export function classListFor(subject: AcademicSubject, students: StudentProfile[]): StudentProfile[] {
  const code = norm(subject.code);
  return students
    .filter((s) => !(s as any).isArchived && ENROLLED.includes(String(s.enrollmentStatus || '')))
    .filter((s) => (s.courses || []).some((c) => norm(c.code) === code && c.status !== 'Dropped'))
    .filter((s) => {
      if (!subject.semester && !subject.academicYear) return true;
      const t = parseTerm(s.currentSemester);
      if (!t.semester && !t.academicYear) return true;
      return (!subject.semester || norm(t.semester) === norm(subject.semester)) && (!subject.academicYear || sameAY(t.academicYear, subject.academicYear));
    })
    .sort((a, b) => sortName(a).localeCompare(sortName(b)));
}

const sortName = (s: StudentProfile) =>
  s.lastName ? `${s.lastName}, ${[s.firstName, s.middleName].filter(Boolean).join(' ')}` : s.fullName || s.name || '';

export const ClassListModal: React.FC<{
  subject: AcademicSubject;
  students: StudentProfile[];
  /** The class's own students (record ids) when known, e.g. from the term's enrollment lists; otherwise matched by subject code. */
  studentIds?: string[];
  onClose: () => void;
}> = ({ subject, students, studentIds, onClose }) => {
  const [q, setQ] = useState('');
  const list = useMemo(
    () =>
      studentIds
        ? students.filter((s) => studentIds.includes(s.id) || studentIds.includes(s.studentId)).sort((a, b) => sortName(a).localeCompare(sortName(b)))
        : classListFor(subject, students),
    [subject, students, studentIds]
  );
  const shown = useMemo(() => {
    const needle = q.trim().toLowerCase();
    if (!needle) return list;
    return list.filter((s) => [sortName(s), s.studentId, s.email, s.degreeProgram || s.program].some((v) => String(v || '').toLowerCase().includes(needle)));
  }, [list, q]);
  const capacity = Number(subject.capacity) || 0;
  const term = [subject.semester, subject.academicYear ? `AY ${subject.academicYear}` : ''].filter(Boolean).join(', ');
  const docId = `class-list-${subject.id}`;

  // The official class list as an Excel workbook, with the class details on top.
  const downloadCsv = async () => {
    const { downloadExcel, excelFileName } = await import('@/lib/excelExport');
    await downloadExcel(excelFileName(`Class_List_${subject.code}${subject.section ? `_${subject.section}` : ''}`), [
      {
        name: 'Class List',
        title: `Official Class List — ${subject.code} ${subject.title || ''}`.trim(),
        details: [
          [subject.section ? (/^section\b/i.test(subject.section) ? subject.section : `Section ${subject.section}`) : '', term, subject.yearLevel || ''].filter(Boolean).join(' · ') || 'Class',
          [subject.schedule ? `Schedule: ${subject.schedule}` : '', subject.room ? `Room: ${subject.room}` : '', subject.instructor ? `Professor: ${subject.instructor}` : ''].filter(Boolean).join(' · ') || 'Schedule, room and professor not set',
          `${list.length} student${list.length === 1 ? '' : 's'}${capacity ? ` of ${capacity} seats` : ''} · ${Number(subject.units) || 0} units`,
        ],
        columns: [
          { header: '#', key: 'n', type: 'integer' },
          { header: 'Student ID', key: 'id' },
          { header: 'Name', key: 'name' },
          { header: 'Program', key: 'program' },
          { header: 'Year level', key: 'year' },
          { header: 'Section', key: 'section' },
          { header: 'Email', key: 'email' },
          { header: 'Mobile', key: 'mobile' },
        ],
        rows: list.map((s, i) => ({ n: i + 1, id: s.studentId, name: sortName(s), program: s.degreeProgram || s.program, year: s.yearLevel, section: s.section, email: s.email, mobile: s.mobileNumber || s.phone })),
      },
    ]);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 p-2 sm:p-4" role="dialog" aria-modal="true" aria-label={`Class list ${subject.code}`}>
      <div className="flex max-h-[94vh] w-full max-w-[920px] flex-col overflow-hidden rounded-2xl border border-slate-300 bg-slate-100 shadow-2xl">
        <div className="flex flex-wrap items-center gap-2 border-b border-slate-200 bg-white p-3">
          <div className="relative min-w-[180px] flex-1">
            <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-slate-400" />
            <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search name, Student ID, email…" aria-label="Search class list" className="w-full rounded-lg border border-slate-300 py-2 pl-8 pr-2 text-xs" />
          </div>
          <button type="button" onClick={downloadCsv} disabled={list.length === 0} className="inline-flex items-center gap-1.5 rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-40">
            <Download className="h-3.5 w-3.5" /> Download Excel
          </button>
          <button type="button" onClick={() => printDocument(docId, `Class List ${subject.code}`)} className="inline-flex items-center gap-1.5 rounded-lg bg-[#18392B] px-3 py-2 text-xs font-bold text-white hover:bg-[#588B76]">
            <Printer className="h-3.5 w-3.5" /> Print
          </button>
          <button type="button" onClick={onClose} aria-label="Close" className="rounded-lg p-2 text-slate-500 hover:bg-slate-100">
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="overflow-y-auto p-3 sm:p-5">
          <article id={docId} className="cor-sheet mx-auto w-full max-w-[860px] overflow-hidden border border-slate-300 bg-white text-slate-900">
            <div className="h-2 bg-[#18392B]" />
            <div className="h-1 bg-[#D4A63A]" />
            <div className="space-y-4 p-5 sm:p-7">
              <header className="flex items-center gap-3 border-b-2 border-[#18392B] pb-3">
                <Emblem id={`${docId}-seal`} size={56} className="shrink-0" />
                <div className="flex-1">
                  <h2 className="font-serif text-lg font-extrabold uppercase tracking-wide text-[#18392B]">Philippine College of Ministry</h2>
                  <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-[#588B76]">Office of the Registrar · Official Class List</p>
                </div>
                <p className="text-right text-[10px] text-slate-500">
                  As of
                  <br />
                  <span className="font-semibold text-slate-700">{new Date().toLocaleDateString('en-PH', { year: 'numeric', month: 'long', day: 'numeric' })}</span>
                </p>
              </header>

              <section className="grid grid-cols-2 gap-x-4 gap-y-2 rounded-lg border border-slate-300 p-3 text-[11px] sm:grid-cols-4">
                {[
                  ['Subject', `${subject.code} — ${subject.title}`],
                  ['Section', subject.section],
                  ['Term', term],
                  ['Units', String(subject.units ?? '')],
                  ['Schedule', subject.schedule],
                  ['Room', subject.room],
                  ['Instructor', subject.instructor],
                  ['Enrolled', `${list.length}${capacity ? ` of ${capacity}` : ''}`],
                ].map(([label, value]) => (
                  <div key={label} className={label === 'Subject' ? 'col-span-2' : ''}>
                    <div className="text-[9px] font-bold uppercase tracking-wider text-slate-500">{label}</div>
                    <div className="font-semibold">{value || '—'}</div>
                  </div>
                ))}
              </section>

              <div className="overflow-x-auto rounded-lg border border-slate-300">
                <table className="w-full min-w-[620px] border-collapse text-left text-[11px]">
                  <thead className="bg-slate-100 text-[10px] uppercase tracking-wider text-slate-700">
                    <tr>
                      <th className="w-8 border-b border-slate-300 px-2 py-2 text-center">#</th>
                      <th className="border-b border-slate-300 px-2 py-2">Student ID</th>
                      <th className="border-b border-slate-300 px-2 py-2">Name</th>
                      <th className="border-b border-slate-300 px-2 py-2">Program</th>
                      <th className="border-b border-slate-300 px-2 py-2">Year / Sec.</th>
                      <th className="border-b border-slate-300 px-2 py-2">Email</th>
                      <th className="border-b border-slate-300 px-2 py-2">Mobile</th>
                    </tr>
                  </thead>
                  <tbody>
                    {shown.length === 0 ? (
                      <tr>
                        <td colSpan={7} className="px-2 py-8 text-center text-slate-500">
                          {list.length === 0 ? 'No students are officially enrolled in this subject yet.' : 'No students match your search.'}
                        </td>
                      </tr>
                    ) : (
                      shown.map((s, i) => (
                        <tr key={s.id} className="odd:bg-white even:bg-slate-50/70">
                          <td className="border-b border-slate-200 px-2 py-1.5 text-center text-slate-500">{i + 1}</td>
                          <td className="whitespace-nowrap border-b border-slate-200 px-2 py-1.5 font-mono font-semibold">{s.studentId}</td>
                          <td className="border-b border-slate-200 px-2 py-1.5 font-semibold">{sortName(s)}</td>
                          <td className="border-b border-slate-200 px-2 py-1.5">{s.degreeProgram || s.program || '—'}</td>
                          <td className="whitespace-nowrap border-b border-slate-200 px-2 py-1.5">{[s.yearLevel, s.section].filter(Boolean).join(' • ') || '—'}</td>
                          <td className="border-b border-slate-200 px-2 py-1.5">{s.email || '—'}</td>
                          <td className="whitespace-nowrap border-b border-slate-200 px-2 py-1.5 font-mono">{s.mobileNumber || s.phone || '—'}</td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>

              <footer className="grid grid-cols-1 gap-8 pt-4 text-center text-[11px] sm:grid-cols-2">
                <div>
                  <div className="h-8 border-b border-slate-500" />
                  <div className="mt-1 font-semibold">Instructor</div>
                  <div className="text-[10px] text-slate-500">Signature over printed name</div>
                </div>
                <div>
                  <div className="h-8 border-b border-slate-500" />
                  <div className="mt-1 font-semibold">College Registrar</div>
                  <div className="text-[10px] text-slate-500">Signature over printed name</div>
                </div>
              </footer>
              <p className="border-t border-slate-200 pt-2 text-[9.5px] text-slate-500">
                Lists students officially enrolled in this subject for the term, from the student records. Dropped subjects are excluded.
              </p>
            </div>
          </article>
        </div>
      </div>
    </div>
  );
};
