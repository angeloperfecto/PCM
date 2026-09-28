'use client';

import React from 'react';
import { usePCM } from '@/lib/store';
import { Calendar, MapPin, Clock, ArrowRight, Sparkles, UserCheck } from 'lucide-react';

export const EventsSection: React.FC = () => {
  const { events, setSelectedEvent, navigateTo } = usePCM();

  const displayedEvents = events.slice(0, 4);

  return (
    <section className="w-full bg-[#D0DED8]/25 py-12 lg:py-16 border-b border-[#D0DED8]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-8 pb-4 border-b border-[#D0DED8]">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <div className="w-2 h-6 bg-[#588B76]" />
              <h2 className="font-serif text-2xl sm:text-3xl font-bold text-[#18392B]">
                UPCOMING EVENTS
              </h2>
            </div>
            <p className="text-xs text-[#588B76] font-semibold uppercase tracking-wider pl-4">
              Conferences, Chapel Summits & Academic Services
            </p>
          </div>

          <button
            id="btn-view-all-events"
            onClick={() => navigateTo('news-events', 'events')}
            className="self-start md:self-auto text-xs font-bold text-[#18392B] hover:text-[#588B76] flex items-center gap-1.5 uppercase tracking-wider transition cursor-pointer"
          >
            <span>VIEW ALL EVENTS</span>
            <ArrowRight className="w-4 h-4 text-[#85AA9B]" />
          </button>
        </div>

        {/* Events Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {displayedEvents.map((evt) => {
            // Split date for badge
            const parts = evt.date.split(' ');
            const month = parts[0] || 'OCT';
            const day = parts[1]?.replace(',', '') || '15';

            return (
              <div
                key={evt.id}
                className="bg-white rounded-sm border border-[#D0DED8] border-l-4 border-l-[#18392B] hover:border-l-[#588B76] p-5 shadow-xs hover:shadow-md transition-all duration-200 flex flex-col sm:flex-row gap-4 items-start justify-between group"
              >
                {/* High Density Date Badge */}
                <div className="flex sm:flex-col items-center justify-center bg-[#18392B] text-white rounded-sm p-2.5 w-full sm:w-16 text-center shrink-0 border border-[#588B76]/50 shadow-xs">
                  <span className="text-[10px] font-mono uppercase tracking-widest text-[#85AA9B] font-bold">
                    {month.slice(0, 3)}
                  </span>
                  <span className="font-serif text-2xl font-bold text-white leading-none my-0.5 ml-2 sm:ml-0">
                    {day}
                  </span>
                  <span className="text-[9px] text-[#D0DED8] font-mono hidden sm:block">2026</span>
                </div>

                {/* Event Details */}
                <div className="flex-1 space-y-2">
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-bold uppercase tracking-wider bg-[#D0DED8]/30 text-[#18392B] px-2 py-0.5 rounded-sm border border-[#588B76]/40">
                      {evt.category}
                    </span>
                    {evt.speaker && (
                      <span className="text-[11px] text-[#18392B]/70 italic truncate max-w-xs">
                        By {evt.speaker}
                      </span>
                    )}
                  </div>

                  <h3
                    onClick={() => setSelectedEvent(evt)}
                    className="font-serif text-base font-bold text-[#18392B] group-hover:text-[#588B76] transition-colors leading-snug cursor-pointer"
                  >
                    {evt.title}
                  </h3>

                  <div className="space-y-1 text-xs text-[#18392B]/75">
                    <div className="flex items-center gap-2">
                      <Clock className="w-3.5 h-3.5 text-[#588B76] shrink-0" />
                      <span>{evt.time}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <MapPin className="w-3.5 h-3.5 text-[#588B76] shrink-0" />
                      <span>{evt.location}</span>
                    </div>
                  </div>

                  <p className="text-xs text-[#18392B]/70 line-clamp-2 pt-0.5 leading-relaxed">
                    {evt.description}
                  </p>

                  <div className="pt-2 flex items-center justify-between gap-3">
                    <button
                      id={`event-btn-register-${evt.id}`}
                      onClick={() => setSelectedEvent(evt)}
                      className="bg-[#18392B] hover:bg-[#588B76] hover:text-white text-white text-xs font-semibold px-3.5 py-1.5 rounded-sm transition flex items-center gap-1.5 cursor-pointer shadow-xs"
                    >
                      <UserCheck className="w-3.5 h-3.5" />
                      <span>Register / RSVP</span>
                    </button>
                    <span className="text-[11px] text-[#18392B]/60 font-mono">
                      {evt.registeredCount} Registered
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
};
