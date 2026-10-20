'use client';

import React, { useMemo, useState } from 'react';
import { AnimatePresence, motion, useReducedMotion } from 'motion/react';
import { usePCM } from '@/lib/store';
import { programDescription, programUnits } from '@/lib/programFacts';
import { ProgramLevel } from '@/lib/types';
import { ArrowRight, BookOpen, Clock, FileText, GraduationCap, Layers } from 'lucide-react';
import { Reveal } from './fx/motion';
import { TiltCard } from './fx/kinetic';

const TABS: { id: 'all' | ProgramLevel; label: string }[] = [
  { id: 'all', label: 'All degrees' },
  { id: 'undergraduate', label: 'Undergraduate' },
  { id: 'graduate', label: 'Graduate' },
  { id: 'certificate', label: 'Certificate' },
  { id: 'diploma', label: 'Diploma' },
];

// Programs from Admin → Academic Programs: tilt cards with an outlined code watermark, filtered by level.
export const FeaturedProgramsSection: React.FC = () => {
  const { programs, setSelectedProgram, navigateTo } = usePCM();
  const reduce = useReducedMotion();
  const [activeTab, setActiveTab] = useState<'all' | ProgramLevel>('all');
  const counts = useMemo(() => {
    const c: Record<string, number> = { all: programs.length };
    programs.forEach((p) => {
      if (p.level) c[p.level] = (c[p.level] || 0) + 1;
    });
    return c;
  }, [programs]);
  const tabs = TABS.filter((t) => t.id === 'all' || counts[t.id]);
  const filtered = programs.filter((p) => activeTab === 'all' || p.level === activeTab);

  return (
    <section className="font-text relative w-full overflow-hidden bg-white py-20 lg:py-28">
      <div aria-hidden="true" className="pointer-events-none absolute inset-0 bg-[linear-gradient(rgba(24,57,43,0.045)_1px,transparent_1px),linear-gradient(90deg,rgba(24,57,43,0.045)_1px,transparent_1px)] bg-[size:56px_56px] [mask-image:radial-gradient(ellipse_at_top,#000_30%,transparent_75%)]" />
      <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <Reveal className="mb-10 flex flex-col gap-6 lg:mb-14">
          <div className="max-w-2xl">
            <span className="inline-flex items-center gap-2 rounded-full border border-[#588b76]/30 bg-[#f7f5ef] px-4 py-1.5 text-[11px] font-semibold uppercase tracking-[0.22em] text-[#588b76]">
              <GraduationCap className="h-3.5 w-3.5" /> Academic Programs
            </span>
            <h2 className="font-display mt-5 text-4xl font-semibold leading-[1.05] text-[#10261d] sm:text-5xl lg:text-6xl">
              Degrees that form <em className="italic text-[#588b76]">shepherds</em>, scholars and servant-leaders
            </h2>
            <p className="mt-4 text-sm text-[#18392b]/70 sm:text-base">
              Rigorous, Christ-centered theological degrees designed to prepare shepherds, scholars, and servant-leaders.
            </p>
          </div>

          <div role="tablist" aria-label="Program level" className="no-scrollbar -mx-4 flex gap-1 overflow-x-auto px-4 sm:mx-0 sm:px-0">
            <div className="flex gap-1 rounded-full border border-[#18392b]/10 bg-[#f7f5ef] p-1">
              {tabs.map((t) => {
                const on = activeTab === t.id;
                return (
                  <button
                    key={t.id}
                    role="tab"
                    aria-selected={on}
                    onClick={() => setActiveTab(t.id)}
                    className={`relative whitespace-nowrap rounded-full px-4 py-2 text-xs font-semibold transition-colors ${on ? 'text-white' : 'text-[#18392b]/70 hover:text-[#10261d]'}`}
                  >
                    {on && <motion.span layoutId="program-tab" className="absolute inset-0 rounded-full bg-[#18392b]" transition={{ type: 'spring', stiffness: 380, damping: 32 }} />}
                    <span className="relative">
                      {t.label} <span className={on ? 'text-[#f6e3b4]' : 'text-[#18392b]/40'}>{counts[t.id] || 0}</span>
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        </Reveal>

        <motion.div layout={!reduce} className="grid grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-3">
          <AnimatePresence mode="popLayout" initial={false}>
            {filtered.map((prog, i) => {
              const units = programUnits(prog);
              return (
                <motion.div
                  key={prog.id}
                  layout={!reduce}
                  initial={reduce ? false : { opacity: 0, y: 30, scale: 0.97 }}
                  whileInView={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  viewport={{ once: true, margin: '0px 0px -10% 0px' }}
                  transition={{ duration: 0.6, delay: (i % 3) * 0.08, ease: [0.22, 1, 0.36, 1] }}
                  className="h-full"
                >
                  <TiltCard className="h-full rounded-[1.75rem]">
                    <article className="relative flex h-full flex-col overflow-hidden rounded-[1.75rem] border border-[#18392b]/10 bg-gradient-to-b from-white to-[#f7f5ef] p-6 shadow-[0_1px_0_rgba(16,38,29,0.04)] transition-shadow duration-500 hover:shadow-[0_40px_70px_-40px_rgba(16,38,29,0.5)] sm:p-7">
                      <span aria-hidden="true" className="font-display text-outline-strong pointer-events-none absolute -right-1 top-2 select-none text-[5.5rem] font-bold leading-none [--outline:rgba(88,139,118,0.32)]">
                        {prog.code}
                      </span>
                      <div className="relative flex items-center gap-2">
                        <span className="rounded-full bg-[#18392b] px-2.5 py-1 font-mono text-[10px] font-bold uppercase tracking-[0.12em] text-[#f6e3b4]">{prog.code}</span>
                        <span className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[#588b76]">{prog.level}</span>
                      </div>
                      <h3 className="font-display relative mt-5 text-2xl font-semibold leading-tight text-[#10261d]">{prog.name}</h3>
                      <p className="relative mt-3 line-clamp-3 text-sm leading-relaxed text-[#18392b]/70">{programDescription(prog)}</p>

                      <dl className="relative mt-6 grid grid-cols-3 gap-2 text-center">
                        {[
                          { icon: Clock, k: 'Duration', v: prog.duration || '—' },
                          { icon: Layers, k: 'Units', v: units ? String(units) : '—' },
                          { icon: BookOpen, k: 'Format', v: prog.studyMode || '—' },
                        ].map(({ icon: Icon, k, v }) => (
                          <div key={k} className="rounded-2xl border border-[#18392b]/8 bg-white/80 px-2 py-3">
                            <Icon className="mx-auto h-4 w-4 text-[#588b76]" />
                            <dt className="mt-1.5 text-[10px] uppercase tracking-[0.12em] text-[#18392b]/50">{k}</dt>
                            <dd className="mt-0.5 overflow-hidden text-ellipsis text-[11px] font-semibold leading-tight text-[#10261d]" title={v}>
                              {v}
                            </dd>
                          </div>
                        ))}
                      </dl>

                      <div className="relative mt-auto flex items-center gap-2 pt-6">
                        <button
                          id={`prog-btn-learn-${prog.id}`}
                          onClick={() => setSelectedProgram(prog)}
                          className="group/btn inline-flex flex-1 items-center justify-center gap-1.5 rounded-full bg-[#18392b] px-4 py-3 text-xs font-semibold text-white transition hover:bg-[#10261d]"
                        >
                          Curriculum <ArrowRight className="h-3.5 w-3.5 text-[#e8c77a] transition-transform group-hover/btn:translate-x-0.5" />
                        </button>
                        <button
                          id={`prog-btn-apply-${prog.id}`}
                          onClick={() => navigateTo('apply')}
                          className="rounded-full border border-[#18392b]/15 px-5 py-3 text-xs font-semibold text-[#18392b] transition hover:border-[#e8c77a] hover:bg-[#e8c77a]/15"
                          title="Apply for this program"
                        >
                          Apply
                        </button>
                      </div>
                    </article>
                  </TiltCard>
                </motion.div>
              );
            })}
          </AnimatePresence>
        </motion.div>

        <Reveal className="mt-10">
          <div className="grain relative isolate flex flex-col items-start justify-between gap-5 overflow-hidden rounded-[1.75rem] bg-[#10261d] p-6 text-white sm:p-8 md:flex-row md:items-center">
            <span aria-hidden="true" className="aurora-blob pointer-events-none absolute -right-16 -top-20 -z-10 h-64 w-64 rounded-full bg-[#e8c77a]/25 blur-3xl" />
            <div>
              <h3 className="font-display text-2xl font-semibold leading-tight sm:text-3xl">Not sure which track is yours?</h3>
              <p className="mt-2 max-w-xl text-sm text-white/70">Download our Academic Prospectus or speak directly with an admissions mentor.</p>
            </div>
            <div className="flex w-full flex-col gap-2 sm:w-auto sm:flex-row">
              <button
                onClick={() => navigateTo('resources', 'downloads')}
                className="inline-flex items-center justify-center gap-2 rounded-full border border-white/20 bg-white/[0.06] px-5 py-3 text-xs font-semibold transition hover:bg-white/15"
              >
                <FileText className="h-4 w-4 text-[#e8c77a]" /> Prospectus (PDF)
              </button>
              <button
                onClick={() => navigateTo('admissions', 'tuition')}
                className="btn-shimmer inline-flex items-center justify-center gap-2 rounded-full bg-gradient-to-r from-[#e8c77a] to-[#f6e3b4] px-5 py-3 text-xs font-bold text-[#10261d]"
              >
                Tuition &amp; scholarships <ArrowRight className="h-4 w-4" />
              </button>
            </div>
          </div>
        </Reveal>
      </div>
    </section>
  );
};
