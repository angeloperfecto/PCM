'use client';

import React from 'react';
import { usePCM } from '@/lib/store';
import {
  Compass,
  FileEdit,
  UserCheck,
  GraduationCap,
  ArrowRight,
  Calculator,
  HelpCircle,
  Sparkles,
} from 'lucide-react';

export const Admissions4StepSection: React.FC = () => {
  const { navigateTo, setTuitionCalculatorModalOpen } = usePCM();

  const steps = [
    {
      num: '01',
      title: 'EXPLORE',
      subtitle: 'Choose Your Program',
      desc: 'Browse our undergraduate, graduate, and certificate programs to find the curriculum aligned with your ministry calling.',
      icon: Compass,
      actionText: 'View Programs',
      action: () => navigateTo('academics'),
    },
    {
      num: '02',
      title: 'APPLY',
      subtitle: 'Submit Online Application',
      desc: 'Fill out the digital application form, share your Christian testimony, and upload required pastoral recommendations.',
      icon: FileEdit,
      actionText: 'Start Application',
      action: () => navigateTo('apply'),
    },
    {
      num: '03',
      title: 'REVIEW',
      subtitle: 'Admissions Evaluation & Interview',
      desc: 'Our faculty committee evaluates your spiritual calling and conducts a warm, constructive admissions interview.',
      icon: UserCheck,
      actionText: 'Track Status',
      action: () => navigateTo('apply'),
    },
    {
      num: '04',
      title: 'ENROLL',
      subtitle: 'Begin Your PCM Journey',
      desc: 'Receive your acceptance letter, process financial grants or scholarships, and join the convocation commissioning.',
      icon: GraduationCap,
      actionText: 'Enrollment Info',
      action: () => navigateTo('admissions', 'tuition'),
    },
  ];

  return (
    <section className="w-full bg-[#18392B] text-white py-16 lg:py-24 border-b border-[#10261D]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center max-w-3xl mx-auto mb-14 space-y-3">
          <div className="inline-flex items-center gap-1.5 text-xs font-bold text-[#85AA9B] uppercase tracking-widest font-mono">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Admissions AY 2026–2027</span>
          </div>
          <h2 className="font-serif text-3xl sm:text-4xl font-extrabold text-white">
            START YOUR JOURNEY AT PCM
          </h2>
          <p className="text-xs sm:text-sm text-[#D0DED8]">
            A clear, transparent 4-step path from prayerful exploration to enrolled ministerial student.
          </p>
        </div>

        {/* 4 Steps Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {steps.map((step, idx) => {
            const Icon = step.icon;
            return (
              <div
                key={idx}
                className="bg-[#10261D] rounded-xl p-6 border border-[#588B76]/50 hover:border-[#85AA9B] shadow-xl transition-all duration-300 flex flex-col justify-between group relative"
              >
                {/* Step Number Top Pill */}
                <div className="flex items-center justify-between mb-4">
                  <div className="w-12 h-12 rounded-xl bg-[#18392B] text-[#85AA9B] border border-[#588B76]/40 flex items-center justify-center font-bold group-hover:bg-[#588B76] group-hover:text-white transition-colors shadow">
                    <Icon className="w-6 h-6" />
                  </div>
                  <span className="font-mono text-xl font-extrabold text-[#D0DED8]/40 group-hover:text-[#D0DED8] transition-colors">
                    {step.num}
                  </span>
                </div>

                <div className="space-y-2">
                  <h3 className="font-serif text-lg font-bold text-white group-hover:text-[#D0DED8] transition-colors">
                    {step.title}
                  </h3>
                  <p className="text-xs font-semibold text-[#85AA9B]">
                    {step.subtitle}
                  </p>
                  <p className="text-xs text-[#D0DED8]/90 leading-relaxed pt-1">
                    {step.desc}
                  </p>
                </div>

                <div className="pt-6 mt-4 border-t border-[#588B76]/40">
                  <button
                    onClick={step.action}
                    className="w-full text-left text-xs font-semibold text-[#85AA9B] hover:text-white flex items-center justify-between cursor-pointer group-hover:underline"
                  >
                    <span>{step.actionText}</span>
                    <ArrowRight className="w-3.5 h-3.5 transform group-hover:translate-x-1 transition-transform" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>

        {/* Action Button Strip */}
        <div className="mt-12 pt-8 border-t border-[#10261D] flex flex-wrap items-center justify-center gap-4 text-xs font-bold">
          <button
            id="admissions-btn-apply"
            onClick={() => navigateTo('apply')}
            className="bg-[#588B76] hover:bg-[#46705F] text-white px-6 py-3 rounded uppercase tracking-wider shadow transition cursor-pointer"
          >
            APPLY NOW (ONLINE FORM)
          </button>

          <button
            id="admissions-btn-requirements"
            onClick={() => navigateTo('admissions', 'requirements')}
            className="bg-[#10261D] hover:bg-[#0A1812] text-[#D0DED8] px-5 py-3 rounded border border-[#588B76]/50 transition uppercase tracking-wider cursor-pointer"
          >
            ADMISSION REQUIREMENTS
          </button>

          <button
            id="admissions-btn-tuition"
            onClick={() => setTuitionCalculatorModalOpen(true)}
            className="bg-[#10261D] hover:bg-[#0A1812] text-[#D0DED8] px-5 py-3 rounded border border-[#588B76]/50 transition flex items-center gap-2 uppercase tracking-wider cursor-pointer"
          >
            <Calculator className="w-4 h-4 text-[#85AA9B]" />
            <span>TUITION & FEE CALCULATOR</span>
          </button>

          <button
            id="admissions-btn-contact"
            onClick={() => navigateTo('contact')}
            className="bg-[#10261D] hover:bg-[#0A1812] text-[#D0DED8] px-5 py-3 rounded border border-[#588B76]/50 transition flex items-center gap-2 uppercase tracking-wider cursor-pointer"
          >
            <HelpCircle className="w-4 h-4 text-[#85AA9B]" />
            <span>CONTACT ADMISSIONS</span>
          </button>
        </div>
      </div>
    </section>
  );
};
