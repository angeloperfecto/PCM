'use client';

import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Building, Clock, Layers, User } from 'lucide-react';
import { usePCM } from '@/lib/store';
import { normalizeYearLevel } from '@/lib/curriculum';
import { displayTerm, termKeyOf, termLabel } from '@/lib/reenrollment';
import { termEnrollmentRosters, termOfferings } from '@/lib/termSubjects';
import { ClassListModal } from './ClassListModal';
import type { AcademicPeriod } from '@/lib/types';

const YEAR_ORDER = ['1st Year', '2nd Year', '3rd Year', '4th Year', '5th Year'];

// Enrollment & Records → Class Schedules: the classes of one term (its Term Subjects offerings) with schedule, room,
// professor and seats. The term follows Academic Terms: the active term is shown, and when another term is set as
// active it switches to that term. Students are counted per class, the same way as Term Subjects and Grade Management.
export const ClassSchedulesPanel: React.FC<{ onOpenTermSubjects?: (termId: string) => void }> = ({ onOpenTermSubjects }) => {
  const { academicPeriods, academicSubjects, students } = usePCM();
  const open = displayTerm(academicPeriods || []);
  const terms = useMemo(() => {
    const rank = (p: AcademicPeriod) => (p.isCurrent ? 0 : p.id === open?.id ? 1 : p.closedAt ? 3 : 2);
    return [...(academicPeriods || [])].sort((a, b) => rank(a) - rank(b) || termKeyOf(b.semester, b.academicYear).localeCompare(termKeyOf(a.semester, a.academicYear)));
  }, [academicPeriods, open?.id]);
  const [termId, setTermId] = useState('');
  const activeTermId = (academicPeriods || []).find((p) => p.isCurrent)?.id || '';
  const lastActive = useRef(activeTermId);
  useEffect(() => {
    if (activeTermId && activeTermId !== lastActive.current) setTermId(activeTermId);
    lastActive.current = activeTermId;
  }, [activeTermId]);
  const term = terms.find((p) => p.id === termId) || terms[0] || null;

  const classes = useMemo(() => {
    if (!term) return [];
    const yi = (y?: string) => {
      const i = YEAR_ORDER.indexOf(normalizeYearLevel(y) || '');
      return i < 0 ? 99 : i;
    };
    return termOfferings(academicSubjects || [], term).sort(
      (a, b) => yi(a.yearLevel) - yi(b.yearLevel) || a.code.localeCompare(b.code) || (a.section || '').localeCompare(b.section || '')
    );
  }, [academicSubjects, term]);
  const rosters = useMemo(() => (term ? termEnrollmentRosters(students || [], academicSubjects || [], term) : new Map<string, string[]>()), [students, academicSubjects, term]);
  const [listId, setListId] = useState<string | null>(null);
  const listSubject = classes.find((c) => c.id === listId);

  return (
    <div className="space-y-4" data-testid="class-schedules">
      <div className="flex flex-col gap-3 rounded-xl border border-slate-200 bg-white p-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h4 className="flex items-center gap-2 text-sm font-bold text-[#18392B]">
            <Layers className="h-4 w-4 text-[#588B76]" /> Class Schedules
          </h4>
          <p className="text-xs text-slate-500">
            The classes of the term with schedule, room, professor and seats, from Term Subjects. The active term in Academic Terms is shown first.
          </p>
        </div>
        {terms.length > 0 && term && (
          <label className="text-[11px] font-bold text-slate-600">
            Term
            <select aria-label="Term" value={term.id} onChange={(e) => setTermId(e.target.value)} className="mt-1 block w-full rounded-lg border border-slate-300 bg-white p-2 text-xs sm:w-72">
              {terms.map((p) => (
                <option key={p.id} value={p.id}>
                  {termLabel(p.semester, p.academicYear)}
                  {p.closedAt ? ' (closed)' : p.isCurrent ? ' (current)' : p.id === open?.id && p.enrollmentStatus === 'Open' ? ' (open for enrollment)' : ''}
                </option>
              ))}
            </select>
          </label>
        )}
      </div>

      {!term ? (
        <p className="rounded-xl border border-slate-200 bg-white p-4 text-xs text-slate-600">Create an academic term first (Academic Terms).</p>
      ) : classes.length === 0 ? (
        <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-xs text-amber-950">
          No classes are set up for {termLabel(term.semester, term.academicYear)} yet. Add the subjects offered this term in Term Subjects.
          {onOpenTermSubjects && (
            <button type="button" onClick={() => onOpenTermSubjects(term.id)} className="ml-2 font-bold text-[#18392B] underline">
              Open Term Subjects
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {classes.map((subj) => {
            const enrolled = (rosters.get(subj.id) || []).length;
            const cap = Number(subj.capacity) || 0;
            const pct = cap ? Math.min(100, Math.round((enrolled / cap) * 100)) : 0;
            return (
              <div key={subj.id} className="space-y-3 rounded-xl border border-slate-200 bg-white p-5 shadow-xs" data-testid="class-card">
                <div className="flex items-center justify-between gap-2">
                  <span className="rounded bg-emerald-100 px-2 py-0.5 font-mono text-[10px] font-bold text-emerald-800">{subj.section || 'No section'}</span>
                  <span className="font-mono text-xs font-bold text-slate-700">{subj.code}</span>
                </div>
                <div>
                  <h5 className="text-sm font-bold leading-tight text-slate-900">{subj.title}</h5>
                  <p className="mt-1 text-[11px] text-slate-500">{[subj.program, normalizeYearLevel(subj.yearLevel) || subj.yearLevel].filter(Boolean).join(' · ') || 'All programs'}</p>
                </div>
                <div className="space-y-1 rounded-lg bg-slate-50 p-2.5 text-xs font-medium text-slate-600">
                  <div className="flex items-center gap-2">
                    <Clock className="h-3.5 w-3.5 text-[#588B76]" />
                    {subj.schedule ? <span>{subj.schedule}</span> : <span className="text-amber-700">Schedule not set</span>}
                  </div>
                  <div className="flex items-center gap-2">
                    <Building className="h-3.5 w-3.5 text-[#588B76]" />
                    {subj.room ? <span>{subj.room}</span> : <span className="text-amber-700">Room not set</span>}
                  </div>
                  <div className="flex items-center gap-2">
                    <User className="h-3.5 w-3.5 text-[#588B76]" />
                    {subj.instructor ? <span>{subj.instructor}</span> : <span className="text-amber-700">No professor yet</span>}
                  </div>
                </div>
                <div className="space-y-1">
                  <div className="flex justify-between text-[11px] font-medium text-slate-600">
                    <span>Seat Capacity Fill</span>
                    <span className="font-mono font-bold">{cap ? `${enrolled}/${cap} (${pct}%)` : `${enrolled} enrolled`}</span>
                  </div>
                  <div className="h-2 w-full overflow-hidden rounded-full bg-slate-100">
                    <div className={`h-full transition-all ${pct >= 90 ? 'bg-rose-500' : pct >= 70 ? 'bg-amber-500' : 'bg-emerald-500'}`} style={{ width: `${pct}%` }} />
                  </div>
                  {subj.status === 'Closed' && <p className="text-[10px] font-bold uppercase text-slate-500">Closed for enrollment</p>}
                </div>
                <button
                  type="button"
                  onClick={() => setListId(subj.id)}
                  className="w-full rounded-lg border border-[#588B76]/40 bg-emerald-50/60 px-3 py-2 text-xs font-bold text-[#18392B] hover:bg-emerald-100"
                >
                  View class list ({enrolled})
                </button>
              </div>
            );
          })}
        </div>
      )}

      {listSubject && <ClassListModal subject={listSubject} students={students || []} studentIds={rosters.get(listSubject.id) || []} onClose={() => setListId(null)} />}
    </div>
  );
};
