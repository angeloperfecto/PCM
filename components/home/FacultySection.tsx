'use client';

import React from 'react';
import { usePCM } from '@/lib/store';
import { ArrowRight, Sparkles } from 'lucide-react';
import { FacultyPortrait } from '@/components/common/FacultyPortrait';
import { Reveal, Stagger } from './fx/motion';

// Featured faculty (Admin → Faculty & Trustees, "featured", in their set order) framed in chapel-window arches.
export const FacultySection: React.FC = () => {
  const { faculty, setSelectedFaculty, navigateTo } = usePCM();
  const featured = [...faculty]
    .sort((a, b) => (a.order ?? 9999) - (b.order ?? 9999))
    .filter((f) => f.featured)
    .slice(0, 4);
  if (featured.length === 0) return null;

  return (
    <section className="font-text w-full overflow-hidden bg-white py-20 lg:py-28">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <Reveal className="mb-12 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div className="max-w-2xl">
            <span className="inline-flex items-center gap-2 rounded-full border border-[#588b76]/30 bg-[#f7f5ef] px-4 py-1.5 text-[11px] font-semibold uppercase tracking-[0.22em] text-[#588b76]">
              <Sparkles className="h-3.5 w-3.5" /> Scholars &amp; Shepherd-Mentors
            </span>
            <h2 className="font-display mt-5 text-4xl font-semibold leading-[1.05] text-[#10261d] sm:text-5xl lg:text-6xl">
              Our leadership <em className="italic text-[#588b76]">&amp; faculty</em>
            </h2>
            <p className="mt-4 text-sm text-[#18392b]/70 sm:text-base">
              Distinguished evangelical theologians, pastors, and educators holding advanced degrees from premier international and Philippine seminaries.
            </p>
          </div>
          <button
            id="btn-view-all-faculty"
            onClick={() => navigateTo('about', 'faculty')}
            className="group inline-flex items-center gap-2 self-start rounded-full border border-[#18392b]/15 px-5 py-2.5 text-sm font-semibold text-[#10261d] transition hover:border-[#18392b] hover:bg-[#18392b] hover:text-white md:self-auto"
          >
            View full directory <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
          </button>
        </Reveal>

        <Stagger className="no-scrollbar -mx-4 flex snap-x snap-mandatory gap-5 overflow-x-auto px-4 pb-2 sm:mx-0 sm:grid sm:grid-cols-2 sm:overflow-visible sm:px-0 lg:grid-cols-4">
          {featured.map((member) => (
            <Stagger.Item key={member.id} className="w-[78%] shrink-0 snap-center sm:w-auto">
              <button type="button" onClick={() => setSelectedFaculty(member)} className="group block w-full text-left">
                <div className="relative">
                  {/* Gold arch outline, offset behind the portrait */}
                  <span
                    aria-hidden="true"
                    className="arch absolute inset-0 translate-x-2 translate-y-2 border-2 border-[#e8c77a]/0 transition-all duration-500 group-hover:translate-x-3 group-hover:translate-y-3 group-hover:border-[#e8c77a]"
                  />
                  <div className="arch relative h-80 overflow-hidden bg-[#10261d] shadow-[0_30px_60px_-35px_rgba(16,38,29,0.7)] transition-transform duration-500 group-hover:-translate-y-1 sm:h-96">
                    <FacultyPortrait
                      name={member.name}
                      imageUrl={member.imageUrl || member.image}
                      id={`featured-${member.id}`}
                      sizes="(max-width: 640px) 80vw, (max-width: 1024px) 50vw, 25vw"
                      className="grayscale-[35%] transition duration-700 group-hover:scale-105 group-hover:grayscale-0"
                    />
                    <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-[#0b1d16]/90 via-transparent to-transparent" />
                    {member.role && (
                      <span className="absolute inset-x-4 bottom-4 truncate rounded-full bg-white/15 px-3 py-1 text-center text-[10px] font-semibold uppercase tracking-[0.16em] text-white backdrop-blur-md">
                        {member.role}
                      </span>
                    )}
                  </div>
                </div>
                <div className="px-1 pt-5">
                  <h3 className="font-display text-xl font-semibold leading-snug text-[#10261d] transition-colors group-hover:text-[#588b76]">{member.name}</h3>
                  {member.title && <p className="mt-1 text-sm font-medium text-[#588b76]">{member.title}</p>}
                  {member.credentials && <p className="mt-1.5 line-clamp-2 text-xs leading-relaxed text-[#18392b]/60">{member.credentials}</p>}
                  <span className="mt-3 inline-flex items-center gap-1.5 text-xs font-semibold text-[#10261d]">
                    View bio &amp; syllabi <ArrowRight className="h-3.5 w-3.5 text-[#e8c77a] transition-transform group-hover:translate-x-1" />
                  </span>
                </div>
              </button>
            </Stagger.Item>
          ))}
        </Stagger>
      </div>
    </section>
  );
};
