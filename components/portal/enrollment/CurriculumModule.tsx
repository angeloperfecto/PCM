'use client';

import React, { useMemo, useState } from 'react';
import { BookOpen, CheckCircle2, Clock } from 'lucide-react';
import { usePCM } from '@/lib/store';
import { YEAR_LEVELS, groupByYearAndSemester, normalizeYearLevel, programForStudent, subjectsForProgram } from '@/lib/curriculum';

const norm = (s?: string) => (s || '').toLowerCase().replace(/[^a-z0-9]/g, '');

// Student Portal → Curriculum: the subjects of the student's program by year level and semester,
// read-only, from the curriculum the Registrar maintains (updates appear live).
export const CurriculumModule: React.FC = () => {
  const { studentProfile, programs, curriculumSubjects } = usePCM();
  const program = programForStudent(programs, studentProfile);
  const subjects = useMemo(() => subjectsForProgram(curriculumSubjects, program).filter((s) => s.status !== 'Inactive'), [curriculumSubjects, program]);
  const myYear = normalizeYearLevel(studentProfile.yearLevel) || '';
  const years = useMemo(() => {
    const present = Array.from(new Set(subjects.map((s) => s.yearLevel)));
    return [...YEAR_LEVELS.filter((y) => present.includes(y)), ...present.filter((y) => !YEAR_LEVELS.includes(y))];
  }, [subjects]);
  const [year, setYear] = useState<string>('');
  const selected = year || (years.includes(myYear) ? myYear : years[0] || 'all');
  const groups = groupByYearAndSemester(selected === 'all' ? subjects : subjects.filter((s) => s.yearLevel === selected));

  // Progress from the student's own record.
  const completed = new Set(
    (studentProfile.subjectHistory || []).filter((h) => ['Passed', 'Credited'].includes(String(h.status))).map((h) => norm(h.code))
  );
  (studentProfile.courses || []).filter((c) => c.status === 'Completed').forEach((c) => completed.add(norm(c.code)));
  const current = new Set((studentProfile.courses || []).filter((c) => c.status === 'Enrolled' || c.status === 'In Progress').map((c) => norm(c.code)));

  return (
    <div id="pcm-curriculum-module" className="space-y-4" data-testid="curriculum-portal">
      <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs">
        <span className="rounded-md border border-emerald-200 bg-emerald-50 px-2 py-0.5 font-mono text-[11px] font-bold text-emerald-800">Curriculum</span>
        <h3 className="mt-1 font-serif text-2xl font-bold text-[#18392B]">Subjects per Year Level</h3>
        <p className="text-xs text-slate-500">
          {program ? (program.name || program.title || program.code) : studentProfile.degreeProgram || studentProfile.program || 'Your program'}
          {myYear ? ` · You are in ${myYear}` : ''}
        </p>
      </div>

      {subjects.length === 0 ? (
        <p className="rounded-2xl border border-slate-200 bg-white p-6 text-center text-sm text-slate-500">
          The curriculum for your program has not been published yet. Please check with the Office of the Registrar.
        </p>
      ) : (
        <>
          <div className="flex flex-wrap gap-1.5" role="tablist" aria-label="Year level">
            {[...years, 'all'].map((y) => (
              <button
                key={y}
                type="button"
                role="tab"
                aria-selected={selected === y}
                onClick={() => setYear(y)}
                className={`rounded-full px-3 py-1.5 text-xs font-bold transition ${selected === y ? 'bg-[#18392B] text-white' : 'border border-slate-300 bg-white text-slate-700 hover:bg-slate-50'}`}
              >
                {y === 'all' ? 'All years' : y}
                {y === myYear && y !== 'all' ? ' (you)' : ''}
              </button>
            ))}
          </div>

          {groups.map((g) => (
            <section key={g.yearLevel} className="space-y-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-xs">
              <div className="flex items-center justify-between">
                <h4 className="flex items-center gap-2 font-serif text-lg font-bold text-[#18392B]">
                  <BookOpen className="h-4 w-4 text-[#588B76]" /> {g.yearLevel}
                </h4>
                <span className="text-xs font-semibold text-slate-500">{g.units} units</span>
              </div>
              {g.semesters.map((sem) => (
                <div key={sem.semester} className="overflow-hidden rounded-xl border border-slate-200">
                  <div className="flex items-center justify-between bg-slate-50 px-3 py-2 text-[11px] font-bold uppercase tracking-wider text-slate-600">
                    <span>{sem.semester || 'Whole year'}</span>
                    <span>{sem.units} units</span>
                  </div>
                  <ul className="divide-y divide-slate-100">
                    {sem.subjects.map((s) => {
                      const done = completed.has(norm(s.code));
                      const now = current.has(norm(s.code));
                      return (
                        <li key={s.id} className="flex flex-wrap items-start justify-between gap-x-3 gap-y-1 px-3 py-2.5 text-xs">
                          <div className="min-w-0 flex-1">
                            <p>
                              <span className="mr-2 font-mono font-bold text-[#18392B]">{s.code}</span>
                              <span className="font-semibold text-slate-900">{s.title}</span>
                            </p>
                            {s.description && <p className="mt-0.5 text-[11px] text-slate-500">{s.description}</p>}
                            <p className="mt-0.5 text-[11px] text-slate-500">
                              {s.type || 'Core'}
                              {s.prerequisites ? ` · Prerequisite: ${s.prerequisites}` : ''}
                            </p>
                          </div>
                          <div className="flex shrink-0 items-center gap-2">
                            {done ? (
                              <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-bold text-emerald-800">
                                <CheckCircle2 className="h-3 w-3" /> Completed
                              </span>
                            ) : now ? (
                              <span className="inline-flex items-center gap-1 rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-bold text-amber-900">
                                <Clock className="h-3 w-3" /> Taking now
                              </span>
                            ) : null}
                            <span className="font-mono font-bold text-slate-700">{s.units} u</span>
                          </div>
                        </li>
                      );
                    })}
                  </ul>
                </div>
              ))}
            </section>
          ))}
        </>
      )}
    </div>
  );
};
