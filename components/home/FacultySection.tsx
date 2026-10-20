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
              <button type="button" onClick={() => setSelectedFaculty(member)} className="group block w-full text-center">
                {/* Gallery frame: gold hairline arch → ivory mat → fine gold keyline → portrait */}
                <div className="arch relative mx-auto bg-gradient-to-b from-[#f1d898] via-[#c9a55a] to-[#8f7436] p-[2px] shadow-[0_2px_4px_rgba(16,38,29,0.08),0_18px_40px_-18px_rgba(16,38,29,0.45),0_40px_80px_-40px_rgba(16,38,29,0.35)] transition duration-500 group-hover:-translate-y-1.5 group-hover:shadow-[0_2px_4px_rgba(16,38,29,0.08),0_26px_50px_-18px_rgba(16,38,29,0.5),0_50px_90px_-40px_rgba(16,38,29,0.4)]">
                  <div className="arch bg-gradient-to-b from-[#fffdf7] to-[#f3eee2] p-2.5 sm:p-3">
                    <div className="arch relative aspect-[4/5] overflow-hidden bg-[#10261d] ring-1 ring-[#c9a55a]/70 ring-offset-2 ring-offset-[#fbf8f0]">
                      <FacultyPortrait
                        name={member.name}
                        imageUrl={member.imageUrl || member.image}
                        id={`featured-${member.id}`}
                        sizes="(max-width: 640px) 80vw, (max-width: 1024px) 50vw, 25vw"
                        className="transition-transform duration-700 ease-out group-hover:scale-[1.04]"
                      />
                      {/* Soft studio light from above and a gentle floor shade */}
                      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_50%_0%,rgba(255,255,255,0.14),transparent_55%)]" />
                      <div className="pointer-events-none absolute inset-x-0 bottom-0 h-1/4 bg-gradient-to-t from-[#0b1d16]/35 to-transparent" />
                    </div>
                  </div>
                </div>

                <div className="px-2 pt-6">
                  {(
                    <p className="mx-auto flex min-h-[2.4rem] max-w-full items-center justify-center gap-2 text-[10px] font-semibold uppercase leading-snug tracking-[0.2em] text-[#8f7436]">
                      {member.role && (
                        <>
                          <span aria-hidden="true" className="h-px w-5 shrink-0 bg-[#c9a55a]" />
                          <span className="line-clamp-2">{member.role}</span>
                          <span aria-hidden="true" className="h-px w-5 shrink-0 bg-[#c9a55a]" />
                        </>
                      )}
                    </p>
                  )}
                  <h3 className="font-display mt-2 text-xl font-semibold leading-snug text-[#10261d] transition-colors group-hover:text-[#588b76]">{member.name}</h3>
                  {member.title && member.title !== member.role && <p className="mt-1 text-sm font-medium text-[#588b76]">{member.title}</p>}
                  {member.credentials && <p className="mx-auto mt-2 line-clamp-2 max-w-xs text-xs leading-relaxed text-[#18392b]/60">{member.credentials}</p>}
                  <span className="mt-4 inline-flex items-center gap-1.5 border-b border-transparent pb-0.5 text-xs font-semibold text-[#10261d] transition group-hover:border-[#c9a55a]">
                    View bio &amp; syllabi <ArrowRight className="h-3.5 w-3.5 text-[#c9a55a] transition-transform group-hover:translate-x-1" />
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
