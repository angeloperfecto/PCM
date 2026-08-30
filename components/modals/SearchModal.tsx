'use client';

import React, { useState, useEffect, useRef } from 'react';
import { usePCM } from '@/lib/store';
import {
  Search,
  X,
  BookOpen,
  Calendar,
  User,
  Volume2,
  Download,
  ShieldCheck,
  Calculator,
  ArrowRight,
  GraduationCap,
  Sparkles,
  MapPin,
  Clock,
} from 'lucide-react';

export const SearchModal: React.FC = () => {
  const {
    searchModalOpen,
    setSearchModalOpen,
    programs,
    news,
    events,
    faculty,
    sermons,
    downloads,
    setSelectedProgram,
    setSelectedArticle,
    setSelectedEvent,
    setSelectedFaculty,
    setSelectedSermon,
    setStatementOfFaithModalOpen,
    setTuitionCalculatorModalOpen,
    navigateTo,
    addToast,
  } = usePCM();

  const [query, setQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState<'all' | 'programs' | 'news' | 'faculty' | 'resources'>('all');
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (searchModalOpen) {
      const timer = setTimeout(() => {
        inputRef.current?.focus();
      }, 50);
      return () => clearTimeout(timer);
    }
  }, [searchModalOpen]);

  // Handle Cmd+K & Escape globally
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setSearchModalOpen(!searchModalOpen);
      }
      if (e.key === 'Escape' && searchModalOpen) {
        setSearchModalOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [searchModalOpen, setSearchModalOpen]);

  if (!searchModalOpen) return null;

  const q = query.trim().toLowerCase();

  // Quick Action Links
  const quickLinks = [
    {
      title: 'Online Application AY 2026–2027',
      desc: 'Begin digital application for B.Th., Senior High, or Graduate programs',
      icon: GraduationCap,
      action: () => {
        navigateTo('apply');
        setSearchModalOpen(false);
      },
    },
    {
      title: 'Tuition & Fee Calculator',
      desc: 'Calculate estimated semester tuition, lab fees, and DepEd voucher coverage',
      icon: Calculator,
      action: () => {
        setSearchModalOpen(false);
        setTuitionCalculatorModalOpen(true);
      },
    },
    {
      title: '12-Article Statement of Faith',
      desc: 'Review PCM doctrinal basis, biblical inerrancy, and restoration movement convictions',
      icon: ShieldCheck,
      action: () => {
        setSearchModalOpen(false);
        setStatementOfFaithModalOpen(true);
      },
    },
    {
      title: 'Why Choose PCM',
      desc: 'Discover academic excellence, spiritual formation, and pastoral apprenticeship',
      icon: Sparkles,
      action: () => {
        navigateTo('why-choose-pcm');
        setSearchModalOpen(false);
      },
    },
    {
      title: 'Campus Location & Contact',
      desc: 'Lamtang, Benguet campus directions, office hours, and contact details',
      icon: MapPin,
      action: () => {
        navigateTo('contact');
        setSearchModalOpen(false);
      },
    },
  ];

  // Filtered Programs
  const filteredPrograms = programs.filter(
    (p) =>
      !q ||
      p.name?.toLowerCase().includes(q) ||
      p.code?.toLowerCase().includes(q) ||
      (p.shortDescription || p.description || '')?.toLowerCase().includes(q)
  );

  // Filtered News & Events
  const filteredNews = news.filter(
    (n) =>
      !q ||
      n.title?.toLowerCase().includes(q) ||
      n.category?.toLowerCase().includes(q) ||
      (n.excerpt || '')?.toLowerCase().includes(q)
  );

  const filteredEvents = events.filter(
    (ev) =>
      !q ||
      ev.title?.toLowerCase().includes(q) ||
      ev.location?.toLowerCase().includes(q) ||
      (ev.description || '')?.toLowerCase().includes(q)
  );

  // Filtered Faculty
  const filteredFaculty = faculty.filter(
    (f) =>
      !q ||
      f.name?.toLowerCase().includes(q) ||
      f.role?.toLowerCase().includes(q) ||
      (f.title || '')?.toLowerCase().includes(q)
  );

  // Filtered Sermons & Downloads
  const filteredSermons = sermons.filter(
    (s) =>
      !q ||
      s.title.toLowerCase().includes(q) ||
      s.speaker.toLowerCase().includes(q) ||
      s.passage.toLowerCase().includes(q)
  );

  const filteredDownloads = downloads.filter(
    (d) =>
      !q ||
      d.title.toLowerCase().includes(q) ||
      d.category.toLowerCase().includes(q) ||
      d.description.toLowerCase().includes(q)
  );

  const totalResults =
    (activeCategory === 'all' || activeCategory === 'programs' ? filteredPrograms.length : 0) +
    (activeCategory === 'all' || activeCategory === 'news' ? filteredNews.length + filteredEvents.length : 0) +
    (activeCategory === 'all' || activeCategory === 'faculty' ? filteredFaculty.length : 0) +
    (activeCategory === 'all' || activeCategory === 'resources' ? filteredSermons.length + filteredDownloads.length : 0);

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-16 sm:pt-24 px-4 bg-black/75 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-white w-full max-w-3xl rounded-sm shadow-2xl border border-[#D0DED8] overflow-hidden flex flex-col max-h-[80vh]">
        {/* Search Input Header */}
        <div className="p-4 bg-[#18392B] border-b border-[#588B76]/40 flex items-center gap-3">
          <Search className="w-5 h-5 text-[#85AA9B] shrink-0" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search academic programs, faculty, sermons, admissions, events, documents..."
            className="w-full bg-transparent text-white placeholder-slate-300 text-sm sm:text-base focus:outline-hidden font-sans"
          />
          {query && (
            <button
              onClick={() => setQuery('')}
              className="text-slate-300 hover:text-white p-1 rounded-sm cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          )}
          <button
            onClick={() => setSearchModalOpen(false)}
            className="text-slate-300 hover:text-white p-1.5 rounded-sm hover:bg-[#10261D] transition cursor-pointer"
          >
            <kbd className="bg-[#10261D] px-2 py-0.5 rounded text-[10px] text-[#D0DED8] font-mono border border-[#588B76]/40">
              ESC
            </kbd>
          </button>
        </div>

        {/* Category Tabs */}
        <div className="bg-slate-50 px-4 py-2 border-b border-slate-200 flex flex-wrap items-center gap-2 text-xs">
          {[
            { id: 'all', label: 'All Results' },
            { id: 'programs', label: `Programs (${filteredPrograms.length})` },
            { id: 'news', label: `News & Events (${filteredNews.length + filteredEvents.length})` },
            { id: 'faculty', label: `Faculty (${filteredFaculty.length})` },
            { id: 'resources', label: `Resources (${filteredSermons.length + filteredDownloads.length})` },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveCategory(tab.id as any)}
              className={`px-2.5 py-1 rounded-sm font-semibold transition cursor-pointer ${
                activeCategory === tab.id
                  ? 'bg-[#18392B] text-white shadow-2xs'
                  : 'bg-white text-slate-600 hover:bg-slate-200 border border-slate-200'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Results Container */}
        <div className="overflow-y-auto p-4 space-y-6 flex-1 divide-y divide-slate-100">
          {/* Quick Actions (when no search query) */}
          {!q && (
            <div className="space-y-2">
              <span className="text-[11px] font-mono font-bold uppercase tracking-wider text-[#588B76]">
                Institutional Quick Actions & Tools
              </span>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-1">
                {quickLinks.map((item, idx) => {
                  const Icon = item.icon;
                  return (
                    <button
                      key={idx}
                      onClick={item.action}
                      className="text-left p-3 rounded-sm bg-white border border-slate-200 hover:border-[#588B76] hover:bg-[#F8FAF9] transition flex items-start gap-3 group cursor-pointer"
                    >
                      <div className="w-8 h-8 rounded-sm bg-[#18392B]/5 text-[#18392B] group-hover:bg-[#18392B] group-hover:text-white flex items-center justify-center shrink-0 transition">
                        <Icon className="w-4 h-4 text-[#588B76] group-hover:text-[#85AA9B]" />
                      </div>
                      <div>
                        <h4 className="font-serif text-xs font-bold text-[#18392B] group-hover:text-[#588B76] transition">
                          {item.title}
                        </h4>
                        <p className="text-[11px] text-slate-500 line-clamp-1 leading-tight mt-0.5">
                          {item.desc}
                        </p>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Programs Section */}
          {(activeCategory === 'all' || activeCategory === 'programs') && filteredPrograms.length > 0 && (
            <div className="space-y-2 pt-4">
              <span className="text-[11px] font-mono font-bold uppercase tracking-wider text-[#588B76] flex items-center gap-1.5">
                <BookOpen className="w-3.5 h-3.5" />
                <span>Academic Programs ({filteredPrograms.length})</span>
              </span>
              <div className="space-y-2">
                {filteredPrograms.map((prog) => (
                  <div
                    key={prog.id}
                    onClick={() => {
                      setSelectedProgram(prog);
                      setSearchModalOpen(false);
                    }}
                    className="p-3 bg-white border border-slate-200 hover:border-[#588B76] hover:bg-slate-50 rounded-sm transition cursor-pointer flex items-center justify-between group"
                  >
                    <div>
                      <div className="flex items-center gap-2 mb-0.5">
                        <span className="text-[10px] font-mono font-bold bg-[#18392B] text-white px-2 py-0.2 rounded-xs">
                          {prog.code}
                        </span>
                        <span className="text-[11px] font-medium text-slate-500 capitalize">
                          {prog.level} • {prog.duration}
                        </span>
                      </div>
                      <h4 className="font-serif text-sm font-bold text-[#18392B] group-hover:text-[#588B76] transition">
                        {prog.name}
                      </h4>
                      <p className="text-xs text-slate-600 line-clamp-1 mt-0.5">
                        {prog.shortDescription || prog.description || ''}
                      </p>
                    </div>
                    <ArrowRight className="w-4 h-4 text-slate-400 group-hover:text-[#588B76] shrink-0 ml-3" />
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* News & Articles */}
          {(activeCategory === 'all' || activeCategory === 'news') && filteredNews.length > 0 && (
            <div className="space-y-2 pt-4">
              <span className="text-[11px] font-mono font-bold uppercase tracking-wider text-[#588B76] flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5" />
                <span>News & Campus Articles ({filteredNews.length})</span>
              </span>
              <div className="space-y-2">
                {filteredNews.map((article) => (
                  <div
                    key={article.id}
                    onClick={() => {
                      setSelectedArticle(article);
                      setSearchModalOpen(false);
                    }}
                    className="p-3 bg-white border border-slate-200 hover:border-[#588B76] hover:bg-slate-50 rounded-sm transition cursor-pointer flex items-center justify-between group"
                  >
                    <div>
                      <span className="text-[10px] font-mono font-bold text-[#588B76] uppercase">
                        {article.category} • {article.date}
                      </span>
                      <h4 className="font-serif text-sm font-bold text-[#18392B] group-hover:text-[#588B76] transition">
                        {article.title}
                      </h4>
                      <p className="text-xs text-slate-600 line-clamp-1 mt-0.5">
                        {article.excerpt}
                      </p>
                    </div>
                    <ArrowRight className="w-4 h-4 text-slate-400 group-hover:text-[#588B76] shrink-0 ml-3" />
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Conferences & Events */}
          {(activeCategory === 'all' || activeCategory === 'news') && filteredEvents.length > 0 && (
            <div className="space-y-2 pt-4">
              <span className="text-[11px] font-mono font-bold uppercase tracking-wider text-[#588B76] flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5" />
                <span>Upcoming Conferences & Events ({filteredEvents.length})</span>
              </span>
              <div className="space-y-2">
                {filteredEvents.map((ev) => (
                  <div
                    key={ev.id}
                    onClick={() => {
                      setSelectedEvent(ev);
                      setSearchModalOpen(false);
                    }}
                    className="p-3 bg-white border border-slate-200 hover:border-[#588B76] hover:bg-slate-50 rounded-sm transition cursor-pointer flex items-center justify-between group"
                  >
                    <div>
                      <span className="text-[10px] font-mono font-bold text-[#18392B] bg-[#588B76]/20 px-2 py-0.5 rounded">
                        {ev.date}
                      </span>
                      <h4 className="font-serif text-sm font-bold text-[#18392B] group-hover:text-[#588B76] transition mt-1">
                        {ev.title}
                      </h4>
                      <p className="text-xs text-slate-500 flex items-center gap-2 mt-0.5">
                        <span>{ev.location}</span>
                        <span>•</span>
                        <span>{ev.time}</span>
                      </p>
                    </div>
                    <ArrowRight className="w-4 h-4 text-slate-400 group-hover:text-[#588B76] shrink-0 ml-3" />
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Faculty Directory */}
          {(activeCategory === 'all' || activeCategory === 'faculty') && filteredFaculty.length > 0 && (
            <div className="space-y-2 pt-4">
              <span className="text-[11px] font-mono font-bold uppercase tracking-wider text-[#588B76] flex items-center gap-1.5">
                <User className="w-3.5 h-3.5" />
                <span>Faculty & Mentors ({filteredFaculty.length})</span>
              </span>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {filteredFaculty.map((f) => (
                  <div
                    key={f.id}
                    onClick={() => {
                      setSelectedFaculty(f);
                      setSearchModalOpen(false);
                    }}
                    className="p-2.5 bg-white border border-slate-200 hover:border-[#588B76] hover:bg-slate-50 rounded-sm transition cursor-pointer flex items-center justify-between group"
                  >
                    <div>
                      <span className="text-[10px] font-mono font-bold uppercase text-[#588B76]">
                        {f.role}
                      </span>
                      <h4 className="font-serif text-xs font-bold text-[#18392B] group-hover:text-[#588B76] transition">
                        {f.name}
                      </h4>
                      <p className="text-[11px] text-slate-500">{f.title}</p>
                    </div>
                    <ArrowRight className="w-3.5 h-3.5 text-slate-400 group-hover:text-[#588B76] shrink-0 ml-2" />
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Sermons & Downloads */}
          {(activeCategory === 'all' || activeCategory === 'resources') && (filteredSermons.length > 0 || filteredDownloads.length > 0) && (
            <div className="space-y-3 pt-4">
              <span className="text-[11px] font-mono font-bold uppercase tracking-wider text-[#588B76] flex items-center gap-1.5">
                <Volume2 className="w-3.5 h-3.5" />
                <span>Sermon Archives & Official Documents</span>
              </span>

              <div className="space-y-2">
                {filteredSermons.map((s) => (
                  <div
                    key={s.id}
                    onClick={() => {
                      setSelectedSermon(s);
                      setSearchModalOpen(false);
                    }}
                    className="p-2.5 bg-white border border-slate-200 hover:border-[#588B76] hover:bg-slate-50 rounded-sm transition cursor-pointer flex items-center justify-between group"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-7 h-7 rounded-full bg-[#588B76]/10 text-[#588B76] flex items-center justify-center shrink-0">
                        <Volume2 className="w-3.5 h-3.5" />
                      </div>
                      <div>
                        <h4 className="font-serif text-xs font-bold text-[#18392B] group-hover:text-[#588B76] transition">
                          {s.title}
                        </h4>
                        <p className="text-[11px] text-slate-500">
                          {s.speaker} • {s.passage} ({s.duration})
                        </p>
                      </div>
                    </div>
                    <ArrowRight className="w-3.5 h-3.5 text-slate-400 group-hover:text-[#588B76] shrink-0" />
                  </div>
                ))}

                {filteredDownloads.map((d) => (
                  <div
                    key={d.id}
                    onClick={() => {
                      addToast('success', 'Download Initialized', `Downloading official document "${d.title}" (${d.format}).`);
                      setSearchModalOpen(false);
                    }}
                    className="p-2.5 bg-white border border-slate-200 hover:border-[#588B76] hover:bg-slate-50 rounded-sm transition cursor-pointer flex items-center justify-between group"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-7 h-7 rounded-sm bg-[#18392B] text-white flex items-center justify-center shrink-0 text-[10px] font-mono font-bold">
                        {d.format}
                      </div>
                      <div>
                        <h4 className="font-serif text-xs font-bold text-[#18392B] group-hover:text-[#588B76] transition">
                          {d.title}
                        </h4>
                        <p className="text-[11px] text-slate-500">
                          {d.category} • {d.fileSize}
                        </p>
                      </div>
                    </div>
                    <Download className="w-3.5 h-3.5 text-slate-400 group-hover:text-[#588B76] shrink-0" />
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Empty State */}
          {q && totalResults === 0 && (
            <div className="text-center py-12 space-y-3">
              <Search className="w-10 h-10 text-slate-300 mx-auto" />
              <h3 className="font-serif text-base font-bold text-slate-700">
                No matching results found for &ldquo;{query}&rdquo;
              </h3>
              <p className="text-xs text-slate-500 max-w-sm mx-auto">
                Try searching for keywords like &ldquo;Theology&rdquo;, &ldquo;Admissions&rdquo;, &ldquo;Voucher&rdquo;, &ldquo;Tuition&rdquo;, or &ldquo;Lamtang&rdquo;.
              </p>
            </div>
          )}
        </div>

        {/* Footer info */}
        <div className="p-3 bg-slate-50 border-t border-slate-200 flex items-center justify-between text-[11px] text-slate-500">
          <div className="flex items-center gap-3 font-mono">
            <span>Use ↑↓ to navigate</span>
            <span>•</span>
            <span>ESC to close</span>
          </div>
          <span>Philippine College of Ministry Repository</span>
        </div>
      </div>
    </div>
  );
};
