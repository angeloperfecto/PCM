'use client';

import React from 'react';
import { usePCM } from '@/lib/store';
import { ArrowRight, CalendarDays, Clock, MapPin, UserCheck } from 'lucide-react';
import { Reveal, Stagger } from './fx/motion';

/** "October 15, 2026" → { month: 'Oct', day: '15', year: '2026' }; unreadable dates are shown as written. */
function dateParts(text?: string): { month: string; day: string; year: string } | null {
  const raw = String(text || '').trim();
  if (!raw) return null;
  const iso = /^\d{4}-\d{2}-\d{2}/.test(raw) ? new Date(`${raw.slice(0, 10)}T00:00:00`) : new Date(raw);
  if (Number.isNaN(iso.getTime())) return null;
  return {
    month: iso.toLocaleDateString('en-PH', { month: 'short' }),
    day: String(iso.getDate()),
    year: String(iso.getFullYear()),
  };
}

// Upcoming events from Admin → Calendar Events, each with a tear-off calendar tile.
export const EventsSection: React.FC = () => {
  const { events, setSelectedEvent, navigateTo } = usePCM();
  const shown = events.slice(0, 4);
  if (shown.length === 0) return null;

  return (
    <section className="font-text w-full bg-[#f7f5ef] py-20 lg:py-28">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <Reveal className="mb-10 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div>
            <span className="inline-flex items-center gap-2 rounded-full border border-[#588b76]/30 bg-white/70 px-4 py-1.5 text-[11px] font-semibold uppercase tracking-[0.22em] text-[#588b76]">
              <CalendarDays className="h-3.5 w-3.5" /> Conferences, Chapel &amp; Academic Services
            </span>
            <h2 className="font-display mt-5 text-4xl font-semibold leading-[1.05] text-[#10261d] sm:text-5xl lg:text-6xl">
              Upcoming <em className="italic text-[#588b76]">events</em>
            </h2>
          </div>
          <button
            id="btn-view-all-events"
            onClick={() => navigateTo('news-events', 'events')}
            className="group inline-flex items-center gap-2 self-start rounded-full border border-[#18392b]/15 px-5 py-2.5 text-sm font-semibold text-[#10261d] transition hover:border-[#18392b] hover:bg-[#18392b] hover:text-white md:self-auto"
          >
            View all events <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
          </button>
        </Reveal>

        <Stagger className="grid grid-cols-1 gap-5 md:grid-cols-2">
          {shown.map((evt) => {
            const d = dateParts(evt.date);
            return (
              <Stagger.Item key={evt.id} className="h-full">
                <div className="group flex h-full gap-5 rounded-[2rem] border border-[#18392b]/10 bg-white p-5 transition duration-500 hover:shadow-[0_30px_60px_-35px_rgba(16,38,29,0.5)] sm:p-6">
                  {/* Tear-off calendar tile */}
                  <div className="w-20 shrink-0 origin-top transition-transform duration-500 group-hover:-rotate-3 group-hover:-translate-y-1 sm:w-24">
                    <div className="overflow-hidden rounded-2xl shadow-[0_14px_30px_-16px_rgba(16,38,29,0.6)]">
                      <div className="bg-[#18392b] py-1.5 text-center text-[11px] font-bold uppercase tracking-[0.2em] text-[#e8c77a]">{d ? d.month : 'Date'}</div>
                      <div className="border-t-2 border-dotted border-[#18392b]/20 bg-[#fffdf8] px-1 py-2 text-center">
                        {d ? (
                          <>
                            <span className="font-display block text-4xl font-semibold leading-none text-[#10261d] sm:text-5xl">{d.day}</span>
                            <span className="mt-1 block text-[10px] font-semibold tracking-[0.14em] text-[#18392b]/50">{d.year}</span>
                          </>
                        ) : (
                          <span className="block text-xs font-semibold leading-snug text-[#10261d]">{evt.date || 'To be announced'}</span>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="flex min-w-0 flex-1 flex-col">
                    <div className="flex flex-wrap items-center gap-2">
                      {evt.category && <span className="rounded-full bg-[#588b76]/10 px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.14em] text-[#588b76]">{evt.category}</span>}
                      {evt.speaker && <span className="truncate text-xs italic text-[#18392b]/60">By {evt.speaker}</span>}
                    </div>
                    <h3
                      onClick={() => setSelectedEvent(evt)}
                      className="font-display mt-2 cursor-pointer text-xl font-semibold leading-snug text-[#10261d] transition-colors group-hover:text-[#588b76] sm:text-2xl"
                    >
                      {evt.title}
                    </h3>
                    <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-xs text-[#18392b]/65">
                      {evt.time && (
                        <span className="inline-flex items-center gap-1.5">
                          <Clock className="h-3.5 w-3.5 text-[#588b76]" /> {evt.time}
                        </span>
                      )}
                      {evt.location && (
                        <span className="inline-flex items-center gap-1.5">
                          <MapPin className="h-3.5 w-3.5 text-[#588b76]" /> {evt.location}
                        </span>
                      )}
                    </div>
                    <p className="mt-3 line-clamp-2 text-sm leading-relaxed text-[#18392b]/65">{evt.description}</p>
                    <div className="mt-auto flex items-center justify-between gap-3 pt-4">
                      <button
                        id={`event-btn-register-${evt.id}`}
                        onClick={() => setSelectedEvent(evt)}
                        className="inline-flex items-center gap-1.5 rounded-full bg-[#18392b] px-4 py-2.5 text-xs font-semibold text-white transition hover:bg-[#10261d]"
                      >
                        <UserCheck className="h-3.5 w-3.5 text-[#e8c77a]" /> Register / RSVP
                      </button>
                      {typeof evt.registeredCount === 'number' && <span className="text-xs text-[#18392b]/50">{evt.registeredCount} registered</span>}
                    </div>
                  </div>
                </div>
              </Stagger.Item>
            );
          })}
        </Stagger>
      </div>
    </section>
  );
};
