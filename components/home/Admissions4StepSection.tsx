'use client';

import React, { useRef } from 'react';
import { motion, useReducedMotion, useScroll, useSpring, useTransform, type MotionValue } from 'motion/react';
import { usePCM } from '@/lib/store';
import { openEnrollmentTerm, termLabel } from '@/lib/reenrollment';
import { ArrowRight, Calculator, Compass, FileEdit, GraduationCap, HelpCircle, Mountain, UserCheck } from 'lucide-react';
import { Magnetic, Reveal } from './fx/motion';

/** A waypoint that lights up once the trail's progress passes it. */
const Waypoint: React.FC<{ progress: MotionValue<number>; at: number; icon: React.ElementType; reduce: boolean | null }> = ({ progress, at, icon: Icon, reduce }) => {
  const lit = useTransform(progress, [at - 0.08, at], [0, 1]);
  const scale = useTransform(lit, [0, 1], [0.85, 1]);
  return (
    <span className="relative flex h-14 w-14 items-center justify-center">
      <span className="absolute inset-0 rounded-full border border-white/15 bg-[#10261d]" />
      <Icon className="absolute h-5 w-5 text-white/60" />
      <motion.span
        className="absolute inset-0 flex items-center justify-center rounded-full bg-gradient-to-br from-[#e8c77a] to-[#f6e3b4] shadow-[0_0_30px_rgba(232,199,122,0.65)]"
        style={reduce ? { opacity: 1 } : { opacity: lit, scale }}
      >
        <Icon className="h-5 w-5 text-[#10261d]" />
      </motion.span>
    </span>
  );
};

// The admissions path: four waypoints along a trail that is drawn as you scroll.
export const Admissions4StepSection: React.FC = () => {
  const { navigateTo, setTuitionCalculatorModalOpen, academicPeriods } = usePCM();
  const reduce = useReducedMotion();
  const term = openEnrollmentTerm(academicPeriods || []);
  const trail = useRef<HTMLDivElement | null>(null);
  const { scrollYProgress } = useScroll({ target: trail, offset: ['start 0.85', 'end 0.55'] });
  const progress = useSpring(scrollYProgress, { stiffness: 90, damping: 24 });

  const steps = [
    { num: '01', title: 'Explore', subtitle: 'Choose your program', desc: 'Browse our undergraduate, graduate, and certificate programs to find the curriculum aligned with your ministry calling.', icon: Compass, actionText: 'View programs', action: () => navigateTo('academics') },
    { num: '02', title: 'Apply', subtitle: 'Submit the online application', desc: 'Fill out the digital application form, share your Christian testimony, and upload required pastoral recommendations.', icon: FileEdit, actionText: 'Start application', action: () => navigateTo('apply') },
    { num: '03', title: 'Review', subtitle: 'Evaluation & interview', desc: 'Our faculty committee evaluates your spiritual calling and conducts a warm, constructive admissions interview.', icon: UserCheck, actionText: 'Track status', action: () => navigateTo('apply') },
    { num: '04', title: 'Enroll', subtitle: 'Begin your PCM journey', desc: 'Receive your acceptance letter, process financial grants or scholarships, and join the convocation commissioning.', icon: GraduationCap, actionText: 'Enrollment info', action: () => navigateTo('admissions', 'tuition') },
  ];

  return (
    <section className="font-text grain relative isolate w-full overflow-hidden bg-gradient-to-b from-[#18392b] to-[#0b1d16] py-20 text-white lg:py-28">
      <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <Reveal className="mx-auto mb-14 max-w-3xl text-center lg:mb-20">
          <span className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/[0.06] px-4 py-1.5 text-[11px] font-semibold uppercase tracking-[0.22em] text-[#f6e3b4]">
            <Mountain className="h-3.5 w-3.5" /> {term ? `Admissions · ${termLabel(term.semester, term.academicYear)}` : 'Admissions'}
          </span>
          <h2 className="font-display mt-5 text-4xl font-semibold leading-[1.05] sm:text-5xl lg:text-6xl">
            Start your <span className="text-dawn italic">journey</span> at PCM
          </h2>
          <p className="mt-4 text-sm text-white/70 sm:text-base">A clear, transparent 4-step path from prayerful exploration to enrolled ministerial student.</p>
        </Reveal>

        <div ref={trail} className="relative">
          {/* Trail: horizontal on large screens, vertical below */}
          <div aria-hidden="true" className="absolute left-[12.5%] right-[12.5%] top-7 hidden h-[2px] lg:block">
            <span className="absolute inset-0 border-t-2 border-dashed border-white/15" />
            <motion.span className="absolute inset-0 origin-left bg-gradient-to-r from-[#e8c77a] to-[#f6e3b4] shadow-[0_0_14px_rgba(232,199,122,0.7)]" style={reduce ? { scaleX: 1 } : { scaleX: progress }} />
          </div>
          <div aria-hidden="true" className="absolute bottom-10 left-7 top-7 w-[2px] lg:hidden">
            <span className="absolute inset-0 border-l-2 border-dashed border-white/15" />
            <motion.span className="absolute inset-0 origin-top bg-gradient-to-b from-[#e8c77a] to-[#f6e3b4] shadow-[0_0_14px_rgba(232,199,122,0.7)]" style={reduce ? { scaleY: 1 } : { scaleY: progress }} />
          </div>

          <ol className="relative grid grid-cols-1 gap-8 lg:grid-cols-4 lg:gap-6">
            {steps.map((s, k) => (
              <li key={s.num} className="flex gap-5 lg:flex-col lg:items-center lg:text-center">
                <Waypoint progress={progress} at={(k + 0.5) / steps.length} icon={s.icon} reduce={reduce} />
                <Reveal delay={k * 0.08} className="min-w-0 flex-1 lg:w-full">
                  <div className="group h-full rounded-[1.75rem] border border-white/10 bg-white/[0.04] p-6 backdrop-blur-md transition duration-500 hover:-translate-y-1 hover:border-[#e8c77a]/40 lg:mt-6">
                    <span className="font-display text-sm text-[#e8c77a]">{s.num}</span>
                    <h3 className="font-display mt-1 text-2xl font-semibold">{s.title}</h3>
                    <p className="mt-1 text-sm font-medium text-[#85aa9b]">{s.subtitle}</p>
                    <p className="mt-3 text-sm leading-relaxed text-white/70">{s.desc}</p>
                    <button onClick={s.action} className="mt-5 inline-flex items-center gap-1.5 text-sm font-semibold text-[#f6e3b4] transition hover:text-white">
                      {s.actionText} <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                    </button>
                  </div>
                </Reveal>
              </li>
            ))}
          </ol>
        </div>

        <Reveal className="mt-14 flex flex-col items-stretch justify-center gap-3 sm:flex-row sm:flex-wrap sm:items-center">
          <Magnetic>
            <button
              id="admissions-btn-apply"
              onClick={() => navigateTo('apply')}
              className="btn-shimmer inline-flex w-full items-center justify-center gap-2 rounded-full bg-gradient-to-r from-[#e8c77a] to-[#f6e3b4] px-7 py-4 text-sm font-bold text-[#10261d] shadow-[0_10px_40px_-8px_rgba(232,199,122,0.6)] sm:w-auto"
            >
              Apply now (online form) <ArrowRight className="h-4 w-4" />
            </button>
          </Magnetic>
          <button
            id="admissions-btn-requirements"
            onClick={() => navigateTo('admissions', 'requirements')}
            className="rounded-full border border-white/20 bg-white/[0.06] px-6 py-4 text-sm font-semibold transition hover:bg-white/15"
          >
            Admission requirements
          </button>
          <button
            id="admissions-btn-tuition"
            onClick={() => setTuitionCalculatorModalOpen(true)}
            className="inline-flex items-center justify-center gap-2 rounded-full border border-white/20 bg-white/[0.06] px-6 py-4 text-sm font-semibold transition hover:bg-white/15"
          >
            <Calculator className="h-4 w-4 text-[#e8c77a]" /> Tuition &amp; fee calculator
          </button>
          <button
            id="admissions-btn-contact"
            onClick={() => navigateTo('contact')}
            className="inline-flex items-center justify-center gap-2 rounded-full border border-white/20 bg-white/[0.06] px-6 py-4 text-sm font-semibold transition hover:bg-white/15"
          >
            <HelpCircle className="h-4 w-4 text-[#85aa9b]" /> Contact admissions
          </button>
        </Reveal>
      </div>
    </section>
  );
};
