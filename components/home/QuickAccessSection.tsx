'use client';

import React from 'react';
import { usePCM } from '@/lib/store';
import { Reveal, Stagger, spotlightHandlers } from './fx/motion';
import { CordilleraRidges } from './fx/CordilleraRidges';
import { LightField } from './fx/LightField';
import {
  GraduationCap,
  FileCheck,
  Users,
  Compass,
  BookMarked,
  MailQuestion,
  ArrowUpRight,
} from 'lucide-react';

export const QuickAccessSection: React.FC = () => {
  const { navigateTo } = usePCM();

  const cards = [
    {
      id: 'academics',
      title: 'ACADEMICS',
      description: 'Explore our accredited theological, ministerial, and biblical degree programs.',
      icon: GraduationCap,
      action: () => navigateTo('academics'),
      badge: 'B.Th. • M.Div. • M.C.L.',
    },
    {
      id: 'admissions',
      title: 'ADMISSIONS',
      description: 'Learn how to begin your journey at PCM with our 4-step admission guide.',
      icon: FileCheck,
      action: () => navigateTo('admissions'),
      badge: 'Apply Online',
    },
    {
      id: 'student-life',
      title: 'STUDENT LIFE',
      description: 'Discover our Christ-centered community, spiritual chapel, and student body.',
      icon: Users,
      action: () => navigateTo('student-life'),
      badge: 'Chapel & Fellowship',
    },
    {
      id: 'ministry',
      title: 'MINISTRY',
      description: 'Develop practical ministry skills through real-world service in 85+ partner churches.',
      icon: Compass,
      action: () => navigateTo('ministry'),
      badge: 'Practicum & Missions',
    },
    {
      id: 'library',
      title: 'LIBRARY',
      description: 'Access 25,000+ theological volumes, Greek & Hebrew commentaries, and journals.',
      icon: BookMarked,
      action: () => navigateTo('resources', 'library'),
      badge: 'Digital Catalog',
    },
    {
      id: 'contact',
      title: 'CONTACT',
      description: 'Connect with our admissions counselors, schedule a campus visit, or inquire.',
      icon: MailQuestion,
      action: () => navigateTo('contact'),
      badge: 'Baguio-Benguet Campus',
    },
  ];

  return (
    <section className="font-text relative w-full overflow-hidden bg-[#f7f5ef] py-20 lg:py-28">
      {/* Soft dawn wash and topographic lines */}
      <div aria-hidden="true" className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_top_left,rgba(232,199,122,0.18),transparent_55%),radial-gradient(ellipse_at_bottom_right,rgba(133,170,155,0.22),transparent_50%)]" />
      <svg aria-hidden="true" className="pointer-events-none absolute inset-0 h-full w-full opacity-[0.07]" preserveAspectRatio="none" viewBox="0 0 800 600">
        {Array.from({ length: 14 }, (_, i) => (
          <path key={i} d={`M0 ${60 + i * 38} C 200 ${20 + i * 38}, 380 ${110 + i * 38}, 560 ${50 + i * 38} S 800 ${90 + i * 38}, 820 ${60 + i * 38}`} fill="none" stroke="#18392b" strokeWidth="1" />
        ))}
      </svg>

      <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <Reveal className="mx-auto mb-12 max-w-2xl text-center lg:mb-16">
          <span className="inline-flex items-center gap-2 rounded-full border border-[#588b76]/30 bg-white/70 px-4 py-1.5 text-[11px] font-semibold uppercase tracking-[0.22em] text-[#588b76] backdrop-blur">
            <Compass className="h-3.5 w-3.5" /> Explore PCM
          </span>
          <h2 className="font-display mt-5 text-4xl font-semibold leading-[1.05] text-[#10261d] sm:text-5xl lg:text-6xl">
            Gateways to <em className="font-display italic text-[#588b76]">theological</em> excellence
          </h2>
          <p className="mt-4 text-sm text-[#18392b]/75 sm:text-base">
            Select an area below to discover our academic programs, admissions requirements, spiritual community, and kingdom resources.
          </p>
        </Reveal>

        <Stagger className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4 lg:grid-rows-[minmax(0,1fr)_minmax(0,1fr)_auto] lg:gap-5">
          {cards.map((c, i) => {
            const Icon = c.icon;
            const feature = i === 0;
            const strip = i === cards.length - 1; // last card: a slim horizontal strip on large screens
            return (
              <Stagger.Item key={c.id} className={feature ? 'sm:col-span-2 lg:row-span-2' : i === 5 ? 'sm:col-span-2 lg:col-span-4' : ''}>
                <button
                  type="button"
                  onClick={c.action}
                  {...spotlightHandlers}
                  className={`spotlight group relative flex h-full w-full flex-col justify-between overflow-hidden rounded-[1.75rem] border p-6 text-left transition-all duration-500 hover:-translate-y-1 hover:shadow-[0_30px_60px_-30px_rgba(16,38,29,0.45)] sm:p-7 ${
                    feature ? 'min-h-[320px] border-transparent bg-[#10261d] text-white lg:min-h-full' : 'min-h-[200px] border-[#18392b]/10 bg-white/80 text-[#10261d] backdrop-blur'} ${strip ? 'lg:min-h-0 lg:flex-row lg:items-center lg:gap-8' : ''
                  }`}
                >
                  {feature && (
                    <>
                      <span aria-hidden="true" className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_85%_0%,rgba(232,199,122,0.45),transparent_55%)]" />
                      <span aria-hidden="true" className="aurora-blob pointer-events-none absolute -right-24 -top-24 h-72 w-72 rounded-full bg-[#e8c77a]/30 blur-3xl" />
                      <LightField className="mix-blend-screen" intensity={0.7} origin={[0.85, -0.15]} />
                      <CordilleraRidges className="h-[55%]" layers={4} />
                      <span aria-hidden="true" className="pointer-events-none absolute inset-x-0 bottom-0 h-2/3 bg-gradient-to-t from-[#0b1d16] via-[#0b1d16]/70 to-transparent" />
                    </>
                  )}
                  <div className="relative flex items-start justify-between gap-3">
                    <span
                      className={`flex h-12 w-12 items-center justify-center rounded-2xl transition-transform duration-500 group-hover:-rotate-6 group-hover:scale-110 ${
                        feature ? 'bg-gradient-to-br from-[#e8c77a] to-[#f6e3b4] text-[#10261d]' : 'bg-gradient-to-br from-[#18392b] to-[#588b76] text-[#f6e3b4]'
                      }`}
                    >
                      <Icon className="h-5 w-5" />
                    </span>
                    <span className={`font-display text-sm ${feature ? 'text-white/40' : 'text-[#18392b]/30'}`}>{String(i + 1).padStart(2, '0')}</span>
                  </div>
                  <div className={`relative mt-8 ${strip ? "lg:mt-0 lg:flex lg:flex-1 lg:items-center lg:justify-between lg:gap-8" : ""}`}>
                    <span className={`mb-2 inline-block rounded-full px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.14em] ${feature ? 'bg-white/10 text-[#f6e3b4]' : 'bg-[#588b76]/10 text-[#588b76]'}`}>
                      {c.badge}
                    </span>
                    <h3 className={`font-display font-semibold leading-tight ${feature ? 'text-4xl sm:text-5xl' : 'text-2xl'}`}>
                      {c.title.charAt(0) + c.title.slice(1).toLowerCase()}
                    </h3>
                    <p className={`mt-2 max-w-md text-sm leading-relaxed ${feature ? 'text-white/75' : 'text-[#18392b]/70'}`}>{c.description}</p>
                    <span className={`mt-5 inline-flex items-center gap-1.5 text-sm font-semibold ${feature ? 'text-[#f6e3b4]' : 'text-[#18392b]'}`}>
                      Discover more
                      <ArrowUpRight className="h-4 w-4 transition-transform duration-300 group-hover:-translate-y-0.5 group-hover:translate-x-0.5" />
                    </span>
                  </div>
                </button>
              </Stagger.Item>
            );
          })}
        </Stagger>
      </div>
    </section>
  );
};
