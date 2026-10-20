'use client';

import React from 'react';
import { usePCM } from '@/lib/store';
import { openEnrollmentTerm, termLabel } from '@/lib/reenrollment';
import { ArrowRight, Heart, HelpCircle, Sparkles } from 'lucide-react';
import { LightField } from './fx/LightField';
import { CordilleraRidges } from './fx/CordilleraRidges';
import { Magnetic, Reveal } from './fx/motion';

// The call to ministry: dawn breaking over the ridges, with the apply button for the open term.
export const CTASection: React.FC = () => {
  const { navigateTo, setRequestInfoModalOpen, academicPeriods } = usePCM();
  const term = openEnrollmentTerm(academicPeriods || []); // named only while its enrollment is open

  return (
    <section className="font-text grain relative isolate w-full overflow-hidden bg-gradient-to-b from-[#0b1d16] via-[#10261d] to-[#18392b] pb-44 pt-24 text-white sm:pb-52 lg:py-36 lg:pb-56">
      <div aria-hidden="true" className="pointer-events-none absolute inset-0 -z-20 bg-[radial-gradient(ellipse_at_50%_100%,rgba(232,199,122,0.45),transparent_60%)]" />
      <LightField className="-z-10 mix-blend-screen" intensity={0.8} origin={[0.5, 1.05]} />
      <CordilleraRidges className="-z-10 h-[24%] opacity-90 sm:h-[38%] lg:h-[45%]" layers={4} />

      <Reveal className="relative mx-auto max-w-4xl px-4 text-center sm:px-6 lg:px-8">
        <span className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/[0.06] px-4 py-1.5 text-[11px] font-semibold uppercase tracking-[0.22em] text-[#f6e3b4] backdrop-blur">
          <Sparkles className="h-3.5 w-3.5" /> Equipping Servants for Kingdom Impact
        </span>
        <h2 className="font-display mt-6 text-5xl font-semibold leading-[0.98] sm:text-6xl lg:text-8xl">
          Your call to ministry <span className="text-dawn italic">starts here.</span>
        </h2>
        <p className="mx-auto mt-6 max-w-2xl text-base leading-relaxed text-white/80 sm:text-lg">
          Prepare your heart. Strengthen your biblical foundation. Develop the skills needed to serve God&apos;s people faithfully in the local church and the
          global harvest field.
        </p>

        <div className="mt-10 flex flex-col items-stretch justify-center gap-3 sm:flex-row sm:flex-wrap sm:items-center">
          <Magnetic>
            <button
              id="cta-btn-apply-main"
              onClick={() => navigateTo('apply')}
              className="btn-shimmer group inline-flex w-full items-center justify-center gap-2 rounded-full bg-gradient-to-r from-[#e8c77a] to-[#f6e3b4] px-8 py-4 text-sm font-bold text-[#10261d] shadow-[0_10px_40px_-8px_rgba(232,199,122,0.7)] sm:w-auto"
            >
              {term ? `Apply for ${termLabel(term.semester, term.academicYear)}` : 'Apply now'}
              <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
            </button>
          </Magnetic>
          <Magnetic strength={0.18}>
            <button
              id="cta-btn-give"
              onClick={() => navigateTo('donation')}
              className="inline-flex w-full items-center justify-center gap-2 rounded-full border border-[#e8c77a]/40 bg-[#e8c77a]/10 px-6 py-4 text-sm font-semibold text-[#f6e3b4] backdrop-blur transition hover:bg-[#e8c77a]/20 sm:w-auto"
            >
              <Heart className="h-4 w-4" /> Support &amp; donate
            </button>
          </Magnetic>
          <Magnetic strength={0.18}>
            <button
              id="cta-btn-request-info"
              onClick={() => setRequestInfoModalOpen(true)}
              className="inline-flex w-full items-center justify-center gap-2 rounded-full border border-white/20 bg-white/[0.06] px-6 py-4 text-sm font-semibold text-white backdrop-blur transition hover:bg-white/15 sm:w-auto"
            >
              <HelpCircle className="h-4 w-4 text-[#85aa9b]" /> Request info
            </button>
          </Magnetic>
        </div>
      </Reveal>
    </section>
  );
};
