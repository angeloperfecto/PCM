'use client';

import React, { useState } from 'react';
import { usePCM } from '@/lib/store';
import { AcademicProgram, ProgramLevel } from '@/lib/types';
import {
  GraduationCap,
  Clock,
  BookOpen,
  ArrowRight,
  Sparkles,
  CheckCircle,
  FileText,
} from 'lucide-react';

export const FeaturedProgramsSection: React.FC = () => {
  const { programs, setSelectedProgram, navigateTo } = usePCM();
  const [activeTab, setActiveTab] = useState<'all' | ProgramLevel>('all');

  const filteredPrograms = programs.filter((p) => {
    if (activeTab === 'all') return true;
    return p.level === activeTab;
  });

  return (
    <section className="w-full bg-[#D0DED8]/25 py-12 lg:py-16 border-b border-[#D0DED8]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Heading with High Density Deep Sage Indicator */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-8 pb-4 border-b border-[#D0DED8]">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <div className="w-2 h-6 bg-[#588B76]" />
              <h2 className="font-serif text-2xl sm:text-3xl font-bold text-[#18392B]">
                ACADEMIC PROGRAMS
              </h2>
            </div>
            <p className="text-xs sm:text-sm text-[#18392B]/80 pl-4">
              Rigorous, Christ-centered theological degrees designed to prepare shepherds, scholars, and servant-leaders.
            </p>
          </div>

          {/* Level Filter Tabs */}
          <div className="flex flex-wrap items-center gap-1 bg-white p-1 rounded-sm border border-[#D0DED8] text-xs font-semibold shadow-xs">
            {(
              [
                { id: 'all', label: 'All Degrees' },
                { id: 'undergraduate', label: 'Undergraduate' },
                { id: 'graduate', label: 'Graduate' },
                { id: 'certificate', label: 'Certificate' },
                { id: 'diploma', label: 'Diploma' },
              ] as const
            ).map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`px-3 py-1 rounded-sm transition cursor-pointer text-xs ${
                  activeTab === tab.id
                    ? 'bg-[#18392B] text-white shadow-xs font-bold'
                    : 'text-[#18392B]/70 hover:text-[#18392B] hover:bg-[#D0DED8]/40'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* Programs Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredPrograms.map((prog) => (
            <div
              key={prog.id}
              className="bg-white rounded-sm border border-[#D0DED8] border-l-4 border-l-[#18392B] hover:border-l-[#588B76] p-5 shadow-xs hover:shadow-md transition-all duration-200 flex flex-col justify-between group"
            >
              <div>
                {/* Header Tag */}
                <div className="flex items-center justify-between gap-2 mb-2">
                  <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-[#18392B] bg-[#D0DED8]/30 px-2 py-0.5 rounded-sm border border-[#588B76]/40">
                    {prog.code}
                  </span>
                  <span className="text-[11px] font-semibold text-[#588B76] uppercase tracking-wider">
                    {prog.level}
                  </span>
                </div>

                <h3 className="font-serif text-base font-bold text-[#18392B] group-hover:text-[#588B76] transition-colors leading-snug mb-2">
                  {prog.name}
                </h3>

                <p className="text-xs text-[#18392B]/75 line-clamp-3 leading-relaxed mb-3">
                  {prog.shortDescription}
                </p>

                {/* Key Metrics */}
                <div className="space-y-1.5 py-2.5 border-y border-[#D0DED8]/60 text-xs text-[#18392B]/75">
                  <div className="flex items-center justify-between">
                    <span className="text-[#18392B]/60">Duration:</span>
                    <strong className="text-[#18392B]">{prog.duration}</strong>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-[#18392B]/60">Units:</span>
                    <strong className="text-[#18392B]">{prog.credits} Units</strong>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-[#18392B]/60">Format:</span>
                    <strong className="text-[#18392B]">{prog.studyMode}</strong>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="pt-3 flex items-center justify-between gap-2">
                <button
                  id={`prog-btn-learn-${prog.id}`}
                  onClick={() => setSelectedProgram(prog)}
                  className="w-full bg-[#18392B] hover:bg-[#10261D] text-white text-xs font-semibold py-2 px-3 rounded-sm shadow-xs transition flex items-center justify-center gap-1 cursor-pointer"
                >
                  <span>Curriculum</span>
                  <ArrowRight className="w-3.5 h-3.5 text-[#85AA9B]" />
                </button>
                <button
                  id={`prog-btn-apply-${prog.id}`}
                  onClick={() => navigateTo('apply')}
                  className="bg-[#588B76] hover:bg-[#46705F] text-white text-xs font-bold py-2 px-3 rounded-sm transition shrink-0 cursor-pointer uppercase tracking-wider"
                  title="Apply for this program"
                >
                  Apply
                </button>
              </div>
            </div>
          ))}
        </div>

        {/* Bottom High Density Banner */}
        <div className="mt-8 bg-[#18392B] text-white rounded-sm p-5 sm:p-6 flex flex-col md:flex-row items-center justify-between gap-4 border-l-4 border-[#588B76] shadow-sm">
          <div className="space-y-1">
            <h4 className="font-serif text-base sm:text-lg font-bold text-white">
              Need Guidance on Which Theological Track is Right For You?
            </h4>
            <p className="text-xs text-[#D0DED8]">
              Download our complete 2026–2027 Academic Prospectus or speak directly with an admissions mentor.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-3 shrink-0">
            <button
              onClick={() => navigateTo('resources', 'downloads')}
              className="bg-[#10261D] hover:bg-black text-[#D0DED8] text-xs font-semibold px-4 py-2 rounded-sm border border-[#588B76]/50 transition flex items-center gap-2 cursor-pointer"
            >
              <FileText className="w-3.5 h-3.5 text-[#85AA9B]" />
              <span>Prospectus (PDF)</span>
            </button>
            <button
              onClick={() => navigateTo('admissions', 'tuition')}
              className="bg-[#588B76] hover:bg-[#46705F] text-white text-xs font-bold px-4 py-2 rounded-sm transition uppercase cursor-pointer"
            >
              Tuition & Scholarships
            </button>
          </div>
        </div>
      </div>
    </section>
  );
};
