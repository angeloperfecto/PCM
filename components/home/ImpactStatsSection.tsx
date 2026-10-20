'use client';

import React from 'react';
import { usePCM } from '@/lib/store';
import { Award, BookOpen, Church, GraduationCap, Sparkles } from 'lucide-react';
import { CountUp, Reveal, Stagger, spotlightHandlers } from './fx/motion';
import { LightField } from './fx/LightField';

const ICONS: Record<string, React.ElementType> = { Award, GraduationCap, Church, BookOpen };

// Institutional numbers from Admin → Statistics, counting up on a night-pine band with drifting aurora light.
export const ImpactStatsSection: React.FC = () => {
  const { stats } = usePCM();
  if (!stats || stats.length === 0) return null;

  return (
    <section className="font-text grain relative isolate w-full overflow-hidden bg-[#0b1d16] py-20 text-white lg:py-28">
      <div aria-hidden="true" className="aurora-blob pointer-events-none absolute -left-32 top-0 -z-10 h-[28rem] w-[28rem] rounded-full bg-[#588b76]/30 blur-[100px]" />
      <div aria-hidden="true" className="aurora-blob pointer-events-none absolute -right-24 bottom-0 -z-10 h-[24rem] w-[24rem] rounded-full bg-[#e8c77a]/20 blur-[100px] [animation-delay:-9s]" />
      <LightField className="-z-10 opacity-70 mix-blend-screen" intensity={0.55} origin={[0.5, -0.25]} />

      <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <Reveal className="mx-auto mb-14 max-w-2xl text-center">
          <span className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/[0.06] px-4 py-1.5 text-[11px] font-semibold uppercase tracking-[0.22em] text-[#f6e3b4] backdrop-blur">
            <Sparkles className="h-3.5 w-3.5" /> Kingdom Impact
          </span>
          <h2 className="font-display mt-5 text-4xl font-semibold leading-[1.05] sm:text-5xl lg:text-6xl">
            Trusted theological formation, <span className="text-dawn italic">by the numbers</span>
          </h2>
        </Reveal>

        <Stagger className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4 lg:gap-5">
          {stats.map((st) => {
            const Icon = ICONS[st.iconName] || BookOpen;
            return (
              <Stagger.Item key={st.id} className="h-full">
                <div
                  {...spotlightHandlers}
                  className="spotlight group flex h-full flex-col rounded-[1.75rem] border border-white/10 bg-white/[0.04] p-7 backdrop-blur-md transition duration-500 hover:-translate-y-1 hover:border-[#e8c77a]/40"
                >
                  <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-[#e8c77a]/25 to-[#588b76]/25 ring-1 ring-white/10 transition-transform duration-500 group-hover:rotate-6">
                    <Icon className="h-5 w-5 text-[#f6e3b4]" />
                  </span>
                  <CountUp value={st.value} className="font-display mt-8 block text-[clamp(2.4rem,4.4vw,3.75rem)] font-semibold leading-none tracking-tight text-white" />
                  <h3 className="mt-3 text-sm font-semibold uppercase tracking-[0.14em] text-[#f6e3b4]">{st.label}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-white/65">{st.description}</p>
                </div>
              </Stagger.Item>
            );
          })}
        </Stagger>
      </div>
    </section>
  );
};
