'use client';

import React from 'react';
import { usePCM } from '@/lib/store';
import { ArrowRight, ArrowUpRight, Sparkles } from 'lucide-react';
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
              {/* Same card style as the lead story in Latest News: full-bleed photo, chip, arrow and text over a gradient */}
              <button
                type="button"
                onClick={() => setSelectedFaculty(member)}
                className="group relative block aspect-[4/5] w-full overflow-hidden rounded-[2rem] bg-[#10261d] text-left shadow-[0_30px_60px_-35px_rgba(16,38,29,0.6)] transition duration-500 hover:shadow-[0_40px_70px_-35px_rgba(16,38,29,0.75)]"
              >
                <FacultyPortrait
                  name={member.name}
                  imageUrl={member.imageUrl || member.image}
                  id={`featured-${member.id}`}
                  bare
                  sizes="(max-width: 640px) 80vw, (max-width: 1024px) 50vw, 25vw"
                  className="transition-transform duration-[1200ms] ease-out group-hover:scale-110"
                />
                <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-[#0b1d16] via-[#0b1d16]/40 to-transparent" />

                {member.role && (
                  <span className="absolute left-4 top-4 max-w-[calc(100%-5rem)] truncate rounded-full bg-[#e8c77a] px-3 py-1 text-[10px] font-bold uppercase tracking-[0.16em] text-[#10261d]" title={member.role}>
                    {member.role}
                  </span>
                )}
                <span className="absolute right-4 top-4 flex h-10 w-10 items-center justify-center rounded-full bg-white/15 text-white backdrop-blur transition duration-500 group-hover:rotate-45 group-hover:bg-white group-hover:text-[#10261d]">
                  <ArrowUpRight className="h-5 w-5" />
                </span>

                <div className="absolute inset-x-5 bottom-5">
                  <h3 className="font-display text-2xl font-semibold leading-tight text-white">
                    <span className="bg-gradient-to-r from-[#e8c77a] to-[#e8c77a] bg-[length:0%_2px] bg-left-bottom bg-no-repeat transition-[background-size] duration-700 group-hover:bg-[length:100%_2px]">
                      {member.name}
                    </span>
                  </h3>
                  {member.title && member.title !== member.role && <p className="mt-1.5 line-clamp-2 text-sm text-white/80">{member.title}</p>}
                  {member.credentials && <p className="mt-1.5 line-clamp-2 text-xs leading-relaxed text-white/60">{member.credentials}</p>}
                </div>
              </button>
            </Stagger.Item>
          ))}
        </Stagger>
      </div>
    </section>
  );
};
