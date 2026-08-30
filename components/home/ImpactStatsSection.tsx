'use client';

import React from 'react';
import { usePCM } from '@/lib/store';
import { Award, GraduationCap, Church, BookOpen, Sparkles } from 'lucide-react';

export const ImpactStatsSection: React.FC = () => {
  const { stats } = usePCM();

  const getIcon = (name: string) => {
    switch (name) {
      case 'Award':
        return <Award className="w-7 h-7 text-[#85AA9B]" />;
      case 'GraduationCap':
        return <GraduationCap className="w-7 h-7 text-[#85AA9B]" />;
      case 'Church':
        return <Church className="w-7 h-7 text-[#85AA9B]" />;
      case 'BookOpen':
      default:
        return <BookOpen className="w-7 h-7 text-[#85AA9B]" />;
    }
  };

  return (
    <section className="w-full bg-[#D0DED8]/25 py-12 lg:py-16 border-b border-[#D0DED8]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-2xl mx-auto mb-8 space-y-1">
          <div className="inline-flex items-center gap-1.5 text-xs font-bold text-[#588B76] uppercase tracking-widest font-mono">
            <Sparkles className="w-3 h-3" />
            <span>Kingdom Impact</span>
          </div>
          <h2 className="font-serif text-2xl sm:text-3xl font-bold text-[#18392B]">
            TRUSTED THEOLOGICAL FORMATION BY THE NUMBERS
          </h2>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {stats.map((st) => (
            <div
              key={st.id}
              className="bg-white rounded-sm p-5 border border-[#D0DED8] shadow-xs hover:shadow-md hover:border-[#588B76] transition-all duration-200 text-center flex flex-col items-center justify-between"
            >
              <div className="w-14 h-14 rounded-sm bg-[#18392B] flex items-center justify-center mb-3 shadow-sm">
                {getIcon(st.iconName)}
              </div>

              <div>
                <span className="block font-serif text-3xl font-bold text-[#18392B] tracking-tight">
                  {st.value}
                </span>
                <h3 className="font-bold text-xs sm:text-sm text-[#18392B] uppercase tracking-wide mt-1">
                  {st.label}
                </h3>
                <p className="text-[11px] text-[#18392B]/75 mt-1.5 leading-relaxed">
                  {st.description}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};
