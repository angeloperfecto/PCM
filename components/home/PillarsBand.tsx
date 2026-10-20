'use client';

import React from 'react';
import { VelocityText } from './fx/kinetic';
import { DEVELOPMENT_PILLARS } from './AboutSection';

// The six formation pillars in giant type, drifting with the reader's scroll (outlined above, dawn-gold below).
export const PillarsBand: React.FC = () => {
  const words = DEVELOPMENT_PILLARS.map((p) => p.title);
  const row = (outlined: boolean) => (
    <span className="inline-flex items-center">
      {words.map((w) => (
        <span key={w} className="inline-flex items-center">
          <span className={outlined ? 'text-outline [--outline:rgba(208,222,216,0.55)]' : 'text-dawn'}>{w}</span>
          <span aria-hidden="true" className="mx-6 text-[0.45em] text-[#e8c77a] sm:mx-10">
            ✦
          </span>
        </span>
      ))}
    </span>
  );

  return (
    <section aria-label="Formation pillars" className="font-display grain relative isolate overflow-hidden bg-[#10261d] py-10 sm:py-14">
      <div aria-hidden="true" className="pointer-events-none absolute inset-0 -z-10 bg-[radial-gradient(ellipse_at_50%_50%,rgba(232,199,122,0.14),transparent_65%)]" />
      <VelocityText baseVelocity={-1.4} className="text-[3.2rem] font-semibold leading-[1.1] sm:text-[5.5rem] lg:text-[7.5rem]">
        {row(true)}
      </VelocityText>
      <VelocityText baseVelocity={1.4} className="text-[3.2rem] font-semibold italic leading-[1.1] sm:text-[5.5rem] lg:text-[7.5rem]">
        {row(false)}
      </VelocityText>
    </section>
  );
};
