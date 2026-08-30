'use client';

import React from 'react';
import { ShieldCheck, Building2, Globe2, BookOpen, Church } from 'lucide-react';

export const PartnersSection: React.FC = () => {
  const partners = [
    {
      category: 'Theological Alliances',
      name: 'Asia Theological Association (ATA)',
      desc: 'Regional Accrediting Commission for Evangelical Theological Education',
      icon: Globe2,
    },
    {
      category: 'Philippine Churches',
      name: 'Philippine Council of Evangelical Churches (PCEC)',
      desc: 'National Network of Over 40,000 Evangelical Congregations',
      icon: Church,
    },
    {
      category: 'Academic Accreditation',
      name: 'ACSCU Philippines',
      desc: 'Association of Christian Schools, Colleges and Universities',
      icon: Building2,
    },
    {
      category: 'Theological Fellowship',
      name: 'Philippine Association of Bible & Theological Colleges',
      desc: 'Collaborative Forum for Biblical & Ministerial Formation',
      icon: BookOpen,
    },
  ];

  return (
    <section className="w-full bg-[#D0DED8]/25 py-14 lg:py-18 border-b border-[#D0DED8]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-2xl mx-auto mb-10 space-y-1">
          <span className="text-[11px] font-mono font-bold uppercase tracking-widest text-[#588B76]">
            Kingdom Alliances
          </span>
          <h2 className="font-serif text-2xl sm:text-3xl font-extrabold text-[#18392B]">
            OUR PARTNERS & AFFILIATIONS
          </h2>
          <p className="text-xs text-[#18392B]/75">
            Collaborating with recognized national and international accreditation bodies, denominations, and mission networks.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {partners.map((p, idx) => {
            const Icon = p.icon;
            return (
              <div
                key={idx}
                className="bg-white rounded-xl p-5 border border-[#D0DED8] shadow-xs flex flex-col justify-between hover:border-[#588B76] transition-colors"
              >
                <div>
                  <div className="w-10 h-10 rounded-lg bg-[#18392B] text-[#85AA9B] flex items-center justify-center mb-3">
                    <Icon className="w-5 h-5" />
                  </div>
                  <span className="text-[10px] font-mono uppercase tracking-wider text-[#588B76] font-bold block mb-1">
                    {p.category}
                  </span>
                  <h3 className="font-serif text-sm font-bold text-[#18392B] leading-snug">
                    {p.name}
                  </h3>
                  <p className="text-[11px] text-[#18392B]/70 mt-2 leading-relaxed">
                    {p.desc}
                  </p>
                </div>

                <div className="mt-4 pt-3 border-t border-[#D0DED8] flex items-center gap-1.5 text-[10px] text-[#588B76] font-semibold">
                  <ShieldCheck className="w-3.5 h-3.5" />
                  <span>Recognized Member</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
};
