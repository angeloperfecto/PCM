'use client';

import React, { useState } from 'react';
import { usePCM } from '@/lib/store';
import { Megaphone, ChevronRight, Bell, ArrowRight } from 'lucide-react';

export const AnnouncementTicker: React.FC = () => {
  const { announcements, navigateTo } = usePCM();
  const [activeIdx, setActiveIdx] = useState(0);

  const activeAnnouncements = announcements.filter((a) => a.active);

  if (activeAnnouncements.length === 0) return null;

  const current = activeAnnouncements[activeIdx % activeAnnouncements.length];

  return (
    <div className="w-full bg-[#588B76] text-white py-2 px-4 sm:px-8 shadow-sm font-sans border-b border-[#18392B]/20">
      <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-2.5 text-[12px] font-bold uppercase tracking-wider">
        {/* Left Badge */}
        <div className="flex items-center gap-2.5 w-full sm:w-auto">
          <div className="flex items-center gap-1.5 bg-[#18392B] text-white px-2.5 py-0.5 rounded-sm font-bold text-[10px] tracking-widest shrink-0 shadow-sm border border-[#85AA9B]/30">
            <Megaphone className="w-3 h-3 text-[#D0DED8]" />
            <span>ANNOUNCEMENTS</span>
          </div>

          <span className="hidden md:inline-block text-[11px] bg-white/20 text-white px-2 py-0.5 rounded-sm font-medium normal-case">
            {current.category}
          </span>

          {/* Headline Message */}
          <div className="flex-1 truncate">
            <button
              onClick={() => {
                if (current.linkUrl) {
                  navigateTo(current.linkUrl as any);
                } else {
                  navigateTo('news-events', 'announcements');
                }
              }}
              className="text-left font-bold text-white hover:text-[#18392B] transition hover:underline cursor-pointer truncate max-w-full block normal-case text-xs"
            >
              {current.title}
            </button>
          </div>
        </div>

        {/* Right Navigation Controls */}
        <div className="flex items-center gap-3 shrink-0 self-end sm:self-auto text-[11px]">
          <span className="text-[#D0DED8] font-mono text-[10px]">
            {activeIdx + 1}/{activeAnnouncements.length}
          </span>

          <div className="flex items-center gap-1">
            <button
              onClick={() =>
                setActiveIdx((prev) => (prev === 0 ? activeAnnouncements.length - 1 : prev - 1))
              }
              aria-label="Previous Announcement"
              className="px-2 py-0.5 rounded-sm bg-[#18392B] hover:bg-[#10261D] text-white text-[10px] transition cursor-pointer font-bold"
            >
              ‹
            </button>
            <button
              onClick={() => setActiveIdx((prev) => (prev + 1) % activeAnnouncements.length)}
              aria-label="Next Announcement"
              className="px-2 py-0.5 rounded-sm bg-[#18392B] hover:bg-[#10261D] text-white text-[10px] transition cursor-pointer font-bold"
            >
              ›
            </button>
          </div>

          <button
            onClick={() => navigateTo('news-events', 'announcements')}
            className="text-white hover:text-[#18392B] font-bold flex items-center gap-0.5 transition cursor-pointer text-[11px]"
          >
            <span>View All</span>
            <ChevronRight className="w-3 h-3" />
          </button>
        </div>
      </div>
    </div>
  );
};
