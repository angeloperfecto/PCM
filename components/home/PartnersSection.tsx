'use client';

import React from 'react';
import { Building2, BookOpen, Church, Globe2 } from 'lucide-react';
import { Reveal } from './fx/motion';
import { Marquee } from './fx/kinetic';

const PARTNERS = [
  { category: 'Theological Alliances', name: 'Asia Theological Association (ATA)', desc: 'Regional Accrediting Commission for Evangelical Theological Education', icon: Globe2 },
  { category: 'Philippine Churches', name: 'Philippine Council of Evangelical Churches (PCEC)', desc: 'National Network of Over 40,000 Evangelical Congregations', icon: Church },
  { category: 'Academic Accreditation', name: 'ACSCU Philippines', desc: 'Association of Christian Schools, Colleges and Universities', icon: Building2 },
  { category: 'Theological Fellowship', name: 'Philippine Association of Bible & Theological Colleges', desc: 'Collaborative Forum for Biblical & Ministerial Formation', icon: BookOpen },
];

/** "Asia Theological Association (ATA)" → "ATA"; otherwise the initials of the main words. */
const monogram = (name: string) =>
  (name.match(/\(([A-Z]{2,6})\)/)?.[1] ||
    name.split(/\s+/)[0].match(/^[A-Z]{3,6}$/)?.[0] ||
    name
      .split(/\s+/)
      .filter((w) => /^[A-Z]/.test(w))
      .map((w) => w[0])
      .join('')
      .slice(0, 5));

// Partners & affiliations as a slow marquee of monogram seals (pauses on hover).
export const PartnersSection: React.FC = () => (
  <section className="font-text w-full overflow-hidden bg-[#f7f5ef] py-20 lg:py-24">
    <Reveal className="mx-auto mb-10 max-w-2xl px-4 text-center">
      <span className="text-[11px] font-semibold uppercase tracking-[0.22em] text-[#588b76]">Kingdom Alliances</span>
      <h2 className="font-display mt-3 text-3xl font-semibold leading-tight text-[#10261d] sm:text-4xl lg:text-5xl">
        Our partners <em className="italic text-[#588b76]">&amp; affiliations</em>
      </h2>
      <p className="mt-3 text-sm text-[#18392b]/70">Collaborating with recognized national and international accreditation bodies, denominations, and mission networks.</p>
    </Reveal>
    <Marquee duration={36} label="Partners and affiliations">
      {PARTNERS.map((p) => {
        const Icon = p.icon;
        return (
          <div key={p.name} title={p.desc} className="mx-3 flex w-[300px] items-center gap-4 rounded-full border border-[#18392b]/10 bg-white py-3 pl-3 pr-6 sm:w-[380px]">
            <span className="relative flex h-16 w-16 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-[#18392b] to-[#10261d] text-[#f6e3b4] ring-4 ring-[#e8c77a]/25">
              <span className="font-display text-sm font-semibold tracking-wide">{monogram(p.name)}</span>
              <Icon className="absolute -bottom-1 -right-1 h-6 w-6 rounded-full bg-[#e8c77a] p-1 text-[#10261d]" />
            </span>
            <span className="min-w-0">
              <span className="block text-[10px] font-semibold uppercase tracking-[0.16em] text-[#588b76]">{p.category}</span>
              <span className="font-display block text-sm font-semibold leading-snug text-[#10261d] sm:text-base">{p.name}</span>
            </span>
          </div>
        );
      })}
    </Marquee>
  </section>
);
