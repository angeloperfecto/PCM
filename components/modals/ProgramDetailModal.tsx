'use client';

import React from 'react';
import { usePCM } from '@/lib/store';
import {
  X,
  GraduationCap,
  Clock,
  BookOpen,
  DollarSign,
  Briefcase,
  CheckCircle2,
  ArrowRight,
  FileText,
} from 'lucide-react';

export const ProgramDetailModal: React.FC = () => {
  const { selectedProgram, setSelectedProgram, navigateTo } = usePCM();

  if (!selectedProgram) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-in fade-in duration-200">
      <div
        className="bg-white rounded-xl shadow-2xl border border-slate-200 max-w-3xl w-full max-h-[90vh] overflow-y-auto font-sans animate-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="sticky top-0 bg-[#18392B] text-white p-6 border-b border-[#588B76]/40 z-10 flex items-start justify-between">
          <div>
            <div className="flex items-center gap-2 mb-1.5">
              <span className="text-[10px] font-mono font-bold uppercase tracking-wider bg-[#588B76] text-[#18392B] px-2 py-0.5 rounded">
                {selectedProgram.code}
              </span>
              <span className="text-xs font-semibold text-[#85AA9B] capitalize">
                {selectedProgram.level} Degree
              </span>
            </div>
            <h3 className="font-serif text-xl sm:text-2xl font-bold text-white">
              {selectedProgram.name}
            </h3>
          </div>

          <button
            onClick={() => setSelectedProgram(null)}
            className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition cursor-pointer"
            aria-label="Close"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 sm:p-8 space-y-6 text-slate-700 text-sm">
          {/* Quick Metrics Bar */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 bg-[#FFFFFF] p-4 rounded-xl border border-slate-200 text-xs">
            <div>
              <span className="text-slate-500 block text-[11px]">Duration</span>
              <strong className="text-[#18392B] font-bold text-sm">{selectedProgram.duration}</strong>
            </div>
            <div>
              <span className="text-slate-500 block text-[11px]">Total Units</span>
              <strong className="text-[#18392B] font-bold text-sm">{selectedProgram.credits} Units</strong>
            </div>
            <div>
              <span className="text-slate-500 block text-[11px]">Study Mode</span>
              <strong className="text-[#18392B] font-bold text-sm">{selectedProgram.studyMode}</strong>
            </div>
            <div>
              <span className="text-slate-500 block text-[11px]">Tuition Rate</span>
              <strong className="text-emerald-700 font-bold text-sm">₱{selectedProgram.tuitionPerUnit.toLocaleString()}/unit</strong>
            </div>
          </div>

          {/* Program Overview */}
          <div className="space-y-2">
            <h4 className="font-serif text-base font-bold text-[#18392B] flex items-center gap-2">
              <BookOpen className="w-4 h-4 text-[#588B76]" />
              <span>Program Overview</span>
            </h4>
            <p className="text-slate-600 leading-relaxed text-xs sm:text-sm">
              {selectedProgram.fullDescription}
            </p>
          </div>

          {/* Core Curriculum Modules */}
          <div className="space-y-3">
            <h4 className="font-serif text-base font-bold text-[#18392B] flex items-center gap-2">
              <GraduationCap className="w-4 h-4 text-[#588B76]" />
              <span>Core Curriculum & Course Highlights</span>
            </h4>
            <div className="space-y-3 text-xs">
              {selectedProgram.curriculum.map((mod, idx) => (
                <div key={idx} className="bg-slate-50 p-3 rounded-lg border border-slate-200">
                  <span className="font-mono font-bold text-[#588B76] block mb-2">{mod.yearOrModule}</span>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {mod.courses.map((c, cIdx) => (
                      <div key={cIdx} className="flex items-start gap-2 bg-white p-2 rounded border border-slate-200/80">
                        <CheckCircle2 className="w-3.5 h-3.5 text-[#588B76] shrink-0 mt-0.5" />
                        <div>
                          <strong className="text-[#18392B] block">{c.code}: {c.title}</strong>
                          <span className="text-[10px] text-slate-500 font-mono">{c.units} Units</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Career & Ministry Opportunities */}
          <div className="space-y-3">
            <h4 className="font-serif text-base font-bold text-[#18392B] flex items-center gap-2">
              <Briefcase className="w-4 h-4 text-[#588B76]" />
              <span>Ministry & Vocational Opportunities</span>
            </h4>
            <div className="flex flex-wrap gap-2">
              {(selectedProgram.careerOpportunities || []).map((career, idx) => (
                <span
                  key={idx}
                  className="bg-[#18392B]/5 text-[#18392B] border border-slate-300 text-xs px-3 py-1 rounded-full font-medium"
                >
                  {career}
                </span>
              ))}
            </div>
          </div>

          {/* Admission Requirements for this degree */}
          <div className="space-y-2 bg-amber-50/70 p-4 rounded-xl border border-amber-200 text-xs">
            <h5 className="font-bold text-amber-950 flex items-center gap-1.5">
              <FileText className="w-4 h-4 text-amber-700" />
              <span>Key Admission Criteria:</span>
            </h5>
            <ul className="list-disc list-inside space-y-1 text-amber-900">
              {selectedProgram.level === 'graduate' ? (
                <>
                  <li>Accredited Bachelor’s degree from a recognized institution</li>
                  <li>Minimum 2 years of active church ministry leadership experience</li>
                  <li>Endorsement letter from the applicant’s Senior Pastor or Denominational Bishop</li>
                  <li>Clear Christian testimony and doctrinal alignment with PCM Statement of Faith</li>
                </>
              ) : (
                <>
                  <li>High school diploma / Senior High Graduate or equivalent</li>
                  <li>Active member in good standing of an evangelical local church</li>
                  <li>Letter of recommendation from local church pastor</li>
                  <li>Personal testimony of salvation in Jesus Christ</li>
                </>
              )}
            </ul>
          </div>
        </div>

        {/* Modal Footer Actions */}
        <div className="bg-slate-50 p-6 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-4">
          <button
            onClick={() => setSelectedProgram(null)}
            className="w-full sm:w-auto text-xs font-semibold text-slate-600 hover:text-slate-900 transition cursor-pointer"
          >
            Close Window
          </button>

          <div className="flex items-center gap-3 w-full sm:w-auto">
            <button
              onClick={() => {
                setSelectedProgram(null);
                navigateTo('apply');
              }}
              className="w-full sm:w-auto bg-[#588B76] hover:bg-[#85AA9B] text-[#18392B] text-xs font-bold px-6 py-3 rounded shadow transition flex items-center justify-center gap-2 uppercase tracking-wider cursor-pointer"
            >
              <span>Apply for {selectedProgram.code}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
