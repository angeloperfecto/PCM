'use client';

import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import { usePCM } from '@/lib/store';
import {
  Calendar,
  Clock,
  MapPin,
  User,
  ArrowRight,
  Filter,
  Megaphone,
  Sparkles,
} from 'lucide-react';

export const NewsEventsView: React.FC = () => {
  const { news, events, announcements, setSelectedArticle, setSelectedEvent, activeSubSection, currentSubSection } = usePCM();
  
  const sub = activeSubSection || currentSubSection;
  const initialTab: 'news' | 'events' | 'announcements' = 
    (sub === 'events' || sub === 'conference') ? 'events' :
    sub === 'announcements' ? 'announcements' : 'news';

  const [tab, setTab] = useState<'news' | 'events' | 'announcements'>(initialTab);
  const [categoryFilter, setCategoryFilter] = useState('all');

  useEffect(() => {
    if (!sub) return;

    if (sub === 'conference') {
      const confEvent = events.find((e) => e.title.toLowerCase().includes('theology') || e.title.toLowerCase().includes('conference'));
      if (confEvent) setSelectedEvent(confEvent);
    }
  }, [sub, events, setSelectedEvent]);

  const filteredNews = news.filter((n) => {
    if (categoryFilter === 'all') return true;
    return n.category.toLowerCase() === categoryFilter.toLowerCase();
  });

  return (
    <div className="w-full bg-[#FFFFFF] font-sans pb-20">
      {/* Banner */}
      <div className="bg-[#18392B] text-white py-14 lg:py-20 border-b-4 border-[#588B76]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center space-y-3">
          <span className="text-[11px] font-mono font-bold uppercase tracking-widest text-[#588B76]">
            PCM Communications & Calendar
          </span>
          <h1 className="font-serif text-3xl sm:text-4xl lg:text-5xl font-extrabold text-white">
            NEWS, EVENTS & ANNOUNCEMENTS
          </h1>
          <p className="text-xs sm:text-sm text-slate-200 max-w-2xl mx-auto leading-relaxed font-sans font-light">
            Stay informed with the latest theological papers, campus press releases, national conferences, and registrar dates from Lamtang, Benguet.
          </p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-12 space-y-10">
        {/* Navigation Tabs */}
        <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-200 pb-4">
          <div className="flex items-center gap-2">
            <button
              onClick={() => setTab('news')}
              className={`px-4 py-2 rounded-sm text-xs font-bold transition cursor-pointer ${
                tab === 'news'
                  ? 'bg-[#18392B] text-white shadow-xs'
                  : 'bg-white text-slate-700 hover:bg-slate-100 border border-slate-200'
              }`}
            >
              Latest News ({news.length})
            </button>
            <button
              onClick={() => setTab('events')}
              className={`px-4 py-2 rounded-sm text-xs font-bold transition cursor-pointer ${
                tab === 'events'
                  ? 'bg-[#18392B] text-white shadow-xs'
                  : 'bg-white text-slate-700 hover:bg-slate-100 border border-slate-200'
              }`}
            >
              Conferences & Events ({events.length})
            </button>
            <button
              onClick={() => setTab('announcements')}
              className={`px-4 py-2 rounded-sm text-xs font-bold transition cursor-pointer ${
                tab === 'announcements'
                  ? 'bg-[#18392B] text-white shadow-xs'
                  : 'bg-white text-slate-700 hover:bg-slate-100 border border-slate-200'
              }`}
            >
              Announcements ({announcements.length})
            </button>
          </div>
        </div>

        {/* Tab 1: NEWS */}
        {tab === 'news' && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {filteredNews.map((art) => (
              <article
                key={art.id}
                onClick={() => setSelectedArticle(art)}
                className="bg-white rounded-sm border border-slate-200 overflow-hidden shadow-xs hover:shadow-md hover:border-[#588B76] transition cursor-pointer flex flex-col justify-between group"
              >
                <div>
                  <div className="h-48 overflow-hidden relative bg-slate-800">
                    <Image
                      src={art.imageUrl || art.image || 'https://images.unsplash.com/photo-1523240795612-9a054b0db644?q=80&w=800&auto=format&fit=crop'}
                      alt={art.title}
                      fill
                      className="object-cover group-hover:scale-105 transition-transform duration-500"
                      sizes="(max-width: 768px) 100vw, 33vw"
                      referrerPolicy="no-referrer"
                    />
                    <div className="absolute top-3 left-3 bg-[#18392B]/90 text-white text-[10px] font-mono font-bold uppercase px-2.5 py-0.5 rounded-sm">
                      {art.category}
                    </div>
                  </div>

                  <div className="p-5 space-y-2">
                    <div className="flex items-center gap-2 text-[11px] text-slate-400 font-mono">
                      <span>{art.date}</span>
                      <span>•</span>
                      <span>{art.readTime}</span>
                    </div>
                    <h3 className="font-serif text-base font-bold text-[#18392B] group-hover:text-[#588B76] transition-colors leading-snug line-clamp-2">
                      {art.title}
                    </h3>
                    <p className="text-xs text-slate-600 line-clamp-3 leading-relaxed">
                      {art.excerpt}
                    </p>
                  </div>
                </div>

                <div className="p-5 pt-0 mt-auto">
                  <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs font-bold text-[#18392B] group-hover:text-[#588B76]">
                    <span>Read Full Article</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </div>
                </div>
              </article>
            ))}
          </div>
        )}

        {/* Tab 2: EVENTS */}
        {tab === 'events' && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {events.map((evt) => (
              <div
                key={evt.id}
                onClick={() => setSelectedEvent(evt)}
                className="bg-white rounded-sm p-6 border border-slate-200 hover:border-[#588B76] shadow-xs hover:shadow-md transition cursor-pointer space-y-3"
              >
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-mono font-bold uppercase bg-[#18392B] text-white px-2 py-0.5 rounded-sm">
                    {evt.category}
                  </span>
                  <span className="text-xs font-bold text-[#588B76] font-mono">{evt.date}</span>
                </div>

                <h3 className="font-serif text-lg font-bold text-[#18392B]">{evt.title}</h3>
                <p className="text-xs text-slate-600 line-clamp-2 leading-relaxed">{evt.description}</p>

                <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
                  <span className="flex items-center gap-1.5">
                    <MapPin className="w-3.5 h-3.5 text-[#588B76]" />
                    <span>{evt.location}</span>
                  </span>
                  <span className="font-bold text-[#18392B] hover:text-[#588B76]">Register / View Details →</span>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Tab 3: ANNOUNCEMENTS */}
        {tab === 'announcements' && (
          <div className="space-y-4 max-w-4xl mx-auto">
            {announcements.map((ann) => (
              <div
                key={ann.id}
                className="bg-white rounded-sm p-5 border border-slate-200 shadow-xs flex items-start gap-4"
              >
                <div className="w-10 h-10 rounded-sm bg-[#18392B] text-white flex items-center justify-center shrink-0">
                  <Megaphone className="w-5 h-5 text-[#588B76]" />
                </div>
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-mono font-bold uppercase text-[#18392B] bg-[#588B76]/20 px-2 py-0.5 rounded-sm border border-[#588B76]/40">
                      {ann.category}
                    </span>
                    <span className="text-[11px] text-slate-400 font-mono">{ann.date}</span>
                  </div>
                  <h4 className="font-serif text-base font-bold text-[#18392B]">{ann.title}</h4>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
