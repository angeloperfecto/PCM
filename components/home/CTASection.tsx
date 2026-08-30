'use client';

import React from 'react';
import { usePCM } from '@/lib/store';
import { ArrowRight, HelpCircle, Sparkles } from 'lucide-react';

export const CTASection: React.FC = () => {
  const { navigateTo, setRequestInfoModalOpen } = usePCM();

  return (
    <section className="relative w-full py-16 lg:py-20 bg-[#18392B] text-white overflow-hidden border-y-4 border-[#588B76]">
      {/* Background Graphic & Texture */}
      <div
        className="absolute inset-0 opacity-15 bg-cover bg-center"
        style={{
          backgroundImage: `url('https://images.unsplash.com/photo-1544717305-2782549b5136?q=80&w=1600&auto=format&fit=crop')`,
        }}
      />
      <div className="absolute inset-0 bg-gradient-to-r from-[#10261D] via-[#18392B]/95 to-[#10261D]" />

      {/* Decorative Sage Ambient Accent */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[250px] bg-[#588B76]/15 rounded-full blur-3xl pointer-events-none" />

      <div className="relative max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center space-y-4 z-10">
        <div className="inline-flex items-center gap-2 bg-[#10261D] border border-[#588B76]/50 px-3.5 py-1 rounded-sm text-xs font-mono uppercase tracking-widest text-[#85AA9B]">
          <Sparkles className="w-3.5 h-3.5" />
          <span>Equipping Servants for Kingdom Impact</span>
        </div>

        <h2 className="font-serif text-3xl sm:text-4xl md:text-5xl font-bold text-white tracking-tight leading-tight">
          YOUR CALL TO MINISTRY STARTS HERE.
        </h2>

        <p className="text-xs sm:text-base text-[#D0DED8] leading-relaxed font-sans max-w-2xl mx-auto">
          Prepare your heart. Strengthen your biblical foundation. Develop the skills needed to serve God&apos;s people faithfully in the local church and the global harvest field.
        </p>

        <div className="pt-3 flex flex-wrap items-center justify-center gap-3.5">
          <button
            id="cta-btn-apply-main"
            onClick={() => navigateTo('apply')}
            className="flex items-center gap-2 bg-[#588B76] hover:bg-[#46705F] text-white font-bold px-7 py-3 rounded-sm shadow-md transition text-xs sm:text-sm tracking-wider uppercase cursor-pointer"
          >
            <span>APPLY NOW FOR AY 2026–2027</span>
            <ArrowRight className="w-4 h-4" />
          </button>

          <button
            id="cta-btn-request-info"
            onClick={() => setRequestInfoModalOpen(true)}
            className="flex items-center gap-2 bg-[#10261D] hover:bg-[#0A1812] text-[#D0DED8] font-semibold px-6 py-3 rounded-sm border border-[#588B76]/50 hover:border-[#85AA9B] transition text-xs sm:text-sm cursor-pointer"
          >
            <HelpCircle className="w-4 h-4 text-[#85AA9B]" />
            <span>REQUEST INFORMATION</span>
          </button>
        </div>
      </div>
    </section>
  );
};
