'use client';

import React, { useState } from 'react';
import { usePCM } from '@/lib/store';
import { ProgramLevel } from '@/lib/types';
import {
  GraduationCap,
  Clock,
  BookOpen,
  Calendar,
  ArrowRight,
  FileText,
  CheckCircle2,
  Sparkles,
  ShieldCheck,
  Award,
} from 'lucide-react';

export const AcademicsView: React.FC = () => {
  const { programs, setSelectedProgram, navigateTo } = usePCM();
  const [selectedLevel, setSelectedLevel] = useState<'all' | ProgramLevel>('all');

  const filtered = programs.filter((p) => {
    if (selectedLevel === 'all') return true;
    return p.level === selectedLevel;
  });

  const academicCalendar = [
    {
      sem: 'First Semester (AY 2026–2027)',
      dates: 'August 10, 2026 – December 18, 2026',
      events: 'Faculty Convocation, Registration, Midterm Exegesis Exams, Ministry Practicum Week, Final Exams',
    },
    {
      sem: 'Inter-Sem / Winter Intensive Term',
      dates: 'January 4, 2027 – January 22, 2027',
      events: 'Biblical Greek & Hebrew Exegesis Modules, Cross-Cultural Missions & Church Planting Treks',
    },
    {
      sem: 'Second Semester (AY 2026–2027)',
      dates: 'February 1, 2027 – June 18, 2027',
      events: 'Theological Symposia, Pastoral Apprenticeship Evaluations, Baccalaureate Service, 34th Commencement Exercises',
    },
  ];

  return (
    <div className="w-full bg-[#FFFFFF] font-sans pb-20">
      {/* Banner */}
      <div className="bg-[#18392B] text-white py-14 lg:py-20 border-b-4 border-[#588B76]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center space-y-3">
          <span className="text-[11px] font-mono font-bold uppercase tracking-widest text-[#588B76]">
            Academic Rigor & Biblical Exposition
          </span>
          <h1 className="font-serif text-3xl sm:text-4xl lg:text-5xl font-extrabold text-white">
            ACADEMIC PROGRAMS & CURRICULUM
          </h1>
          <p className="text-xs sm:text-sm text-slate-200 max-w-2xl mx-auto leading-relaxed font-sans font-light">
            Providing CHED-recognized degrees, Senior High DepEd vouchers, original language study (Greek/Hebrew), and supervised pastoral apprenticeships in Lamtang, Benguet.
          </p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-12 space-y-14">
        {/* Level Filters */}
        <div className="flex flex-wrap items-center justify-between gap-4 pb-6 border-b border-slate-200">
          <div className="flex flex-wrap items-center gap-2">
            {(
              [
                { id: 'all', label: 'All Programs' },
                { id: 'shs', label: 'Senior High School (GAS)' },
                { id: 'undergraduate', label: 'Undergraduate Degrees (B.Th.)' },
                { id: 'graduate', label: 'Graduate School (Master’s)' },
                { id: 'certificate', label: 'Certificates & Associate' },
              ] as const
            ).map((tab) => (
              <button
                key={tab.id}
                onClick={() => setSelectedLevel(tab.id as any)}
                className={`px-3.5 py-1.5 rounded-sm text-xs font-bold transition cursor-pointer ${
                  selectedLevel === tab.id
                    ? 'bg-[#18392B] text-white shadow-xs'
                    : 'bg-white text-slate-700 hover:bg-slate-100 border border-slate-200'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          <button
            onClick={() => navigateTo('admissions', 'tuition')}
            className="text-xs font-bold text-[#18392B] hover:text-[#588B76] uppercase tracking-wider flex items-center gap-1 cursor-pointer"
          >
            <span>View Tuition & Vouchers →</span>
          </button>
        </div>

        {/* Programs Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filtered.map((prog) => (
            <div
              key={prog.id}
              className="bg-white rounded-sm p-6 border border-slate-200 hover:border-[#588B76] shadow-xs hover:shadow-md transition-all duration-300 flex flex-col justify-between group"
            >
              <div>
                <div className="flex items-center justify-between mb-3">
                  <span className="text-[10px] font-mono font-bold uppercase tracking-wider bg-[#18392B] text-white px-2 py-0.5 rounded-sm">
                    {prog.code}
                  </span>
                  <span className="text-xs font-semibold text-slate-500 capitalize">
                    {prog.level}
                  </span>
                </div>

                <h3 className="font-serif text-lg font-bold text-[#18392B] group-hover:text-[#588B76] transition-colors leading-snug">
                  {prog.name}
                </h3>

                <p className="text-xs text-slate-600 mt-2 leading-relaxed line-clamp-3">
                  {prog.shortDescription}
                </p>

                <div className="mt-4 pt-4 border-t border-slate-100 space-y-1.5 text-xs text-slate-600">
                  <div className="flex justify-between">
                    <span className="text-slate-500">Duration:</span>
                    <strong className="text-[#18392B]">{prog.duration}</strong>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Curriculum Units:</span>
                    <strong className="text-[#18392B]">{prog.credits} Units</strong>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Delivery Mode:</span>
                    <strong className="text-[#18392B]">{prog.studyMode}</strong>
                  </div>
                </div>
              </div>

              <div className="mt-6 pt-4 border-t border-slate-100 flex items-center justify-between">
                <button
                  onClick={() => setSelectedProgram(prog)}
                  className="text-xs font-bold text-[#18392B] group-hover:text-[#588B76] flex items-center gap-1.5 transition cursor-pointer"
                >
                  <span>View Curriculum & Syllabi</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
                <button
                  onClick={() => navigateTo('apply')}
                  className="bg-[#18392B] hover:bg-[#588B76] text-white text-[11px] font-bold px-3 py-1.5 rounded-sm transition cursor-pointer"
                >
                  Apply
                </button>
              </div>
            </div>
          ))}
        </div>

        {/* Academic Calendar Section */}
        <div id="calendar" className="bg-[#18392B] text-white rounded-sm p-8 border border-[#588B76]/40 shadow-sm space-y-6">
          <div className="flex items-center justify-between flex-wrap gap-4 border-b border-slate-700 pb-4">
            <div>
              <span className="text-xs font-mono font-bold uppercase tracking-widest text-[#588B76]">
                Registrar&apos;s Schedule
              </span>
              <h2 className="font-serif text-2xl font-bold text-white mt-0.5">
                ACADEMIC CALENDAR (AY 2026–2027)
              </h2>
            </div>
            <div className="text-xs text-slate-300 font-mono">
              Philippine Standard Time (PHT)
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {academicCalendar.map((item, idx) => (
              <div key={idx} className="bg-[#10261D] p-5 rounded-sm border border-slate-700/80 space-y-3">
                <div className="flex items-center gap-2 text-[#588B76] font-serif font-bold text-sm">
                  <Calendar className="w-4 h-4" />
                  <span>{item.sem}</span>
                </div>
                <p className="text-xs font-mono text-white bg-[#18392B] px-2.5 py-1 rounded border border-slate-700">
                  {item.dates}
                </p>
                <p className="text-xs text-slate-300 leading-relaxed font-light">
                  {item.events}
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
