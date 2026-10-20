'use client';

import React from 'react';
import { usePCM } from '@/lib/store';
import { ChevronRight, Megaphone } from 'lucide-react';
import { Marquee } from './fx/kinetic';

// Active announcements from Admin → Announcements, as a seamless ribbon (pauses on hover; each item opens its link).
export const AnnouncementTicker: React.FC = () => {
  const { announcements, navigateTo } = usePCM();
  const active = announcements.filter((a) => a.active);
  if (active.length === 0) return null;

  const open = (linkUrl?: string) => (linkUrl ? navigateTo(linkUrl as any) : navigateTo('news-events', 'announcements'));
  const duration = Math.max(28, active.length * 14);

  return (
    <div className="font-text relative flex w-full items-stretch overflow-hidden border-y border-[#e8c77a]/20 bg-[#0b1d16] text-white">
      <div className="relative z-10 flex shrink-0 items-center gap-2 bg-gradient-to-r from-[#e8c77a] to-[#f6e3b4] px-3 py-2.5 text-[10px] font-bold uppercase tracking-[0.2em] text-[#10261d] sm:px-5">
        <Megaphone className="h-3.5 w-3.5" />
        <span className="hidden sm:inline">Announcements</span>
        <span className="absolute -right-3 top-0 h-full w-6 skew-x-[-18deg] bg-[#f6e3b4]" aria-hidden="true" />
      </div>
      <Marquee duration={duration} className="flex-1 py-2.5" label="Announcements">
        {active.map((a) => (
          <button
            key={a.id}
            type="button"
            onClick={() => open(a.linkUrl)}
            className="group mx-6 inline-flex items-center gap-3 whitespace-nowrap text-sm transition hover:text-[#f6e3b4]"
          >
            {a.category && <span className="rounded-full border border-white/15 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.14em] text-[#85aa9b]">{a.category}</span>}
            <span className="font-medium">{a.title}</span>
            <span className="h-1.5 w-1.5 rounded-full bg-[#e8c77a]" aria-hidden="true" />
          </button>
        ))}
      </Marquee>
      <button
        type="button"
        onClick={() => navigateTo('news-events', 'announcements')}
        className="relative z-10 hidden shrink-0 items-center gap-1 border-l border-white/10 bg-[#0b1d16] px-4 text-xs font-semibold text-[#f6e3b4] transition hover:text-white sm:inline-flex"
      >
        View all <ChevronRight className="h-3.5 w-3.5" />
      </button>
    </div>
  );
};
