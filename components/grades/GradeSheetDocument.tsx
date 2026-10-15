'use client';

import React from 'react';
import { Emblem } from '@/components/common/Emblem';
import { lookupGrade, sheetStageLabel } from '@/lib/grades';
import type { GradeSheet, GradingScale } from '@/lib/types';

// Printable grade sheet (print with printDocument(id, 'Grade Sheet')).
export const GradeSheetDocument: React.FC<{ sheet: GradeSheet; scale: GradingScale | null; id?: string }> = ({ sheet, scale, id = 'pcm-grade-sheet' }) => {
  const printed = new Date().toLocaleDateString('en-PH', { year: 'numeric', month: 'long', day: 'numeric' });
  return (
    <article id={id} className="cor-sheet mx-auto w-full max-w-[820px] bg-white p-6 text-slate-900 border border-slate-300">
      <header className="flex items-center gap-4 border-b-2 border-[#18392B] pb-3">
        <Emblem id={`${id}-seal`} size={60} className="shrink-0" />
        <div className="flex-1">
          <h2 className="font-serif text-lg font-extrabold uppercase text-[#18392B]">Philippine College of Ministry</h2>
          <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-[#588B76]">Official Grade Sheet</p>
        </div>
        <div className="text-right text-[11px]">
          <div className="font-mono font-bold">{sheet.subjectCode}</div>
          <div>{sheet.semester}, AY {sheet.academicYear}</div>
          <div className="font-semibold">{sheetStageLabel(sheet)}</div>
        </div>
      </header>
      <dl className="my-3 grid grid-cols-2 gap-2 text-[11px] sm:grid-cols-4">
        <div><dt className="text-slate-500">Subject</dt><dd className="font-semibold">{sheet.subjectTitle}</dd></div>
        <div><dt className="text-slate-500">Section</dt><dd className="font-semibold">{sheet.sectionName || '—'}</dd></div>
        <div><dt className="text-slate-500">Units</dt><dd className="font-semibold">{sheet.units}</dd></div>
        <div><dt className="text-slate-500">Professor</dt><dd className="font-semibold">{sheet.instructorName}</dd></div>
      </dl>
      <table className="w-full border-collapse text-[11px]">
        <thead className="bg-slate-100 text-left text-[10px] uppercase">
          <tr>
            <th className="border border-slate-300 p-1.5">#</th>
            <th className="border border-slate-300 p-1.5">Student ID</th>
            <th className="border border-slate-300 p-1.5">Name</th>
            <th className="border border-slate-300 p-1.5">Year level</th>
            <th className="border border-slate-300 p-1.5 text-center">Grade</th>
            <th className="border border-slate-300 p-1.5">Equivalent</th>
            <th className="border border-slate-300 p-1.5">Remark</th>
          </tr>
        </thead>
        <tbody>
          {sheet.students.map((s, i) => {
            const g = sheet.grades?.[s.studentRecordId];
            const l = lookupGrade(scale, g?.grade);
            return (
              <tr key={s.studentRecordId}>
                <td className="border border-slate-300 p-1.5 text-center">{i + 1}</td>
                <td className="border border-slate-300 p-1.5 font-mono">{s.studentId}</td>
                <td className="border border-slate-300 p-1.5">{s.name}</td>
                <td className="border border-slate-300 p-1.5">{s.yearLevel}</td>
                <td className="border border-slate-300 p-1.5 text-center font-mono font-bold">{g?.grade || '—'}</td>
                <td className="border border-slate-300 p-1.5">{l.equivalent || ''}</td>
                <td className="border border-slate-300 p-1.5">{l.kind === 'blank' ? 'No grade' : l.kind === 'invalid' ? 'Not on the scale' : l.remark}</td>
              </tr>
            );
          })}
        </tbody>
      </table>
      <section className="mt-8 grid grid-cols-1 gap-8 text-center text-[11px] sm:grid-cols-3">
        <div><div className="flex h-8 items-end justify-center border-b border-slate-500 font-semibold">{sheet.submittedBy || ''}</div>Professor</div>
        <div><div className="flex h-8 items-end justify-center border-b border-slate-500 font-semibold">{sheet.approvedBy || ''}</div>Reviewed / approved</div>
        <div><div className="flex h-8 items-end justify-center border-b border-slate-500 font-semibold">{sheet.finalizedBy || ''}</div>Registrar</div>
      </section>
      <footer className="mt-4 flex justify-between border-t border-slate-300 pt-2 text-[9.5px] text-slate-500">
        <span>Printed {printed}. Grades are official only when finalized by the Registrar.</span>
        <span className="font-mono">{sheet.id}</span>
      </footer>
    </article>
  );
};
