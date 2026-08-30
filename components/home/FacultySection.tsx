'use client';

import React from 'react';
import { usePCM } from '@/lib/store';
import { Mail, GraduationCap, ArrowRight, Sparkles, BookOpen } from 'lucide-react';
import { FacultyPortrait } from '@/components/common/FacultyPortrait';

export const FacultySection: React.FC = () => {
  const { faculty, setSelectedFaculty, navigateTo } = usePCM();

  const featuredFaculty = faculty.filter((f) => f.featured).slice(0, 4);

  return (
    <section className="w-full bg-white py-16 lg:py-24 border-b border-[#D0DED8] font-sans">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-12 pb-4 border-b border-[#D0DED8]">
          <div>
            <div className="inline-flex items-center gap-1.5 text-xs font-bold text-[#588B76] uppercase tracking-widest font-mono mb-1">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Scholars & Shepherd-Mentors</span>
            </div>
            <h2 className="font-serif text-3xl sm:text-4xl font-extrabold text-[#18392B]">
              OUR LEADERSHIP & FACULTY
            </h2>
            <p className="text-xs sm:text-sm text-[#18392B]/75 mt-1 max-w-2xl">
              Distinguished evangelical theologians, pastors, and educators holding advanced degrees from premier international and Philippine seminaries.
            </p>
          </div>

          <button
            id="btn-view-all-faculty"
            onClick={() => navigateTo('about', 'faculty')}
            className="self-start md:self-auto text-xs font-bold text-[#18392B] hover:text-[#588B76] flex items-center gap-1.5 uppercase tracking-wider transition cursor-pointer"
          >
            <span>VIEW FULL DIRECTORY</span>
            <ArrowRight className="w-4 h-4 text-[#85AA9B]" />
          </button>
        </div>

        {/* Faculty Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {featuredFaculty.map((member) => (
            <div
              key={member.id}
              onClick={() => setSelectedFaculty(member)}
              className="group bg-[#D0DED8]/20 rounded-xl overflow-hidden border border-[#D0DED8] hover:border-[#588B76] shadow-xs hover:shadow-xl transition-all duration-300 flex flex-col justify-between cursor-pointer"
            >
              <div>
                {/* Photo */}
                <div className="h-64 overflow-hidden relative bg-[#070e1c]">
                  <FacultyPortrait
                    name={member.name}
                    imageUrl={member.imageUrl}
                    id={`featured-${member.id}`}
                    sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 25vw"
                    className="group-hover:scale-105 transition-transform duration-500"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-[#18392B]/90 via-transparent to-transparent opacity-80 group-hover:opacity-60 transition-opacity pointer-events-none" />
                  
                  <div className="absolute bottom-3 left-3 right-3">
                    <span className="text-[10px] font-mono font-bold uppercase tracking-wider bg-[#18392B]/90 text-[#D0DED8] px-2 py-0.5 rounded border border-[#588B76]/50 shadow">
                      {member.role}
                    </span>
                  </div>
                </div>

                {/* Profile Details */}
                <div className="p-5 space-y-2">
                  <h3 className="font-serif text-base font-bold text-[#18392B] group-hover:text-[#588B76] transition-colors leading-snug">
                    {member.name}
                  </h3>
                  <p className="text-xs font-semibold text-[#588B76] leading-snug">
                    {member.title}
                  </p>
                  <p className="text-[11px] text-[#18392B]/70 line-clamp-2 pt-1 leading-relaxed">
                    {member.credentials}
                  </p>
                </div>
              </div>

              {/* Card Footer */}
              <div className="p-5 pt-0 mt-auto">
                <div className="pt-3 border-t border-[#D0DED8]/80 flex items-center justify-between text-xs font-semibold text-[#18392B] group-hover:text-[#588B76]">
                  <span>View Bio & Syllabi</span>
                  <ArrowRight className="w-3.5 h-3.5 transform group-hover:translate-x-1 transition-transform text-[#85AA9B]" />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};
