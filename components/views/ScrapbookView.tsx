'use client';

import React, { useState, useMemo } from 'react';
import Image from 'next/image';
import { usePCM } from '@/lib/store';
import { ScrapbookItem } from '@/lib/types';
import {
  Image as ImageIcon,
  Calendar,
  MapPin,
  Search,
  Filter,
  ZoomIn,
  Sparkles,
  Heart,
  Share2,
  Download,
  X,
  ChevronLeft,
  ChevronRight,
  Camera,
  Info,
} from 'lucide-react';

export const ScrapbookView: React.FC = () => {
  const { scrapbook, selectedScrapbookItem, setSelectedScrapbookItem, addToast } = usePCM();
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');

  const categories = [
    { id: 'all', label: 'All Scrapbook Entries' },
    { id: 'History', label: 'Historical & Pioneers (1992–2005)' },
    { id: 'Campus Life', label: 'Campus Life & Fellowship' },
    { id: 'Chapel', label: 'Chapel & Spiritual Life' },
    { id: 'Missions', label: 'Missions & Practicum' },
    { id: 'Graduation', label: 'Graduation & Commencements' },
    { id: 'Community', label: 'Community & Relief Missions' },
  ];

  const filteredItems = useMemo(() => {
    return scrapbook.filter((item) => {
      const matchCat =
        selectedCategory === 'all' || item.category.toLowerCase() === selectedCategory.toLowerCase();
      const matchQuery =
        !searchQuery ||
        item.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.caption.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.location?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.year?.toLowerCase().includes(searchQuery.toLowerCase());
      return matchCat && matchQuery;
    });
  }, [scrapbook, selectedCategory, searchQuery]);

  const currentIndex = useMemo(() => {
    if (!selectedScrapbookItem) return -1;
    return filteredItems.findIndex((item) => item.id === selectedScrapbookItem.id);
  }, [selectedScrapbookItem, filteredItems]);

  const handleNext = () => {
    if (currentIndex >= 0 && currentIndex < filteredItems.length - 1) {
      setSelectedScrapbookItem(filteredItems[currentIndex + 1]);
    } else if (filteredItems.length > 0) {
      setSelectedScrapbookItem(filteredItems[0]);
    }
  };

  const handlePrev = () => {
    if (currentIndex > 0) {
      setSelectedScrapbookItem(filteredItems[currentIndex - 1]);
    } else if (filteredItems.length > 0) {
      setSelectedScrapbookItem(filteredItems[filteredItems.length - 1]);
    }
  };

  return (
    <div className="w-full bg-[#FFFFFF] font-sans pb-16">
      {/* 1. HERO HEADER */}
      <section className="relative bg-[#18392B] text-white py-14 lg:py-18 px-4 lg:px-8 border-b-4 border-[#588B76] overflow-hidden">
        <div className="max-w-6xl mx-auto relative z-10 text-center">
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-[#10261D]/80 border border-[#588B76]/40 rounded-full text-xs font-semibold text-[#588B76] tracking-wider uppercase mb-3">
            <Camera className="w-3.5 h-3.5" />
            <span>PCM Visual Archives & Memories</span>
          </div>

          <h1 className="font-serif text-3xl sm:text-4xl lg:text-5xl font-bold tracking-tight text-white mb-3">
            Institutional Scrapbook & Gallery
          </h1>

          <p className="text-slate-200 text-sm sm:text-base max-w-2xl mx-auto font-light leading-relaxed">
            Capturing over three decades of God&apos;s faithfulness at Philippine College of Ministry — from our 1992 beginnings on T. Alonzo Street to our permanent mountain ridge in Lamtang, Benguet.
          </p>

          {/* Quick Search & Count */}
          <div className="mt-6 max-w-md mx-auto relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by title, location, year, or memory..."
              className="w-full pl-10 pr-4 py-2.5 bg-[#10261D]/90 border border-slate-700 focus:border-[#588B76] text-white text-xs rounded-sm placeholder:text-slate-400 outline-none transition"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white text-xs"
              >
                Clear
              </button>
            )}
          </div>
        </div>
      </section>

      {/* 2. CATEGORY PILLS BAR */}
      <section className="bg-white border-b border-slate-200 sticky top-[73px] z-20 shadow-xs px-4 lg:px-8 py-3">
        <div className="max-w-7xl mx-auto flex items-center justify-between gap-4 overflow-x-auto no-scrollbar">
          <div className="flex items-center gap-2 shrink-0">
            {categories.map((cat) => (
              <button
                key={cat.id}
                onClick={() => setSelectedCategory(cat.id)}
                className={`px-3 py-1.5 rounded-sm text-xs font-medium whitespace-nowrap transition cursor-pointer ${
                  selectedCategory === cat.id
                    ? 'bg-[#18392B] text-white font-semibold shadow-xs'
                    : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                }`}
              >
                {cat.label}
              </button>
            ))}
          </div>

          <div className="text-xs text-slate-500 shrink-0 font-mono">
            Showing <strong className="text-[#18392B]">{filteredItems.length}</strong> photo memories
          </div>
        </div>
      </section>

      {/* 3. SCRAPBOOK PHOTO GRID */}
      <section className="max-w-7xl mx-auto px-4 lg:px-8 py-10">
        {filteredItems.length === 0 ? (
          <div className="bg-white border border-slate-200 rounded-sm p-12 text-center max-w-md mx-auto">
            <ImageIcon className="w-12 h-12 text-slate-300 mx-auto mb-3" />
            <h3 className="font-serif text-lg font-bold text-[#18392B]">No Scrapbook Entries Found</h3>
            <p className="text-xs text-slate-500 mt-1 mb-4">
              Try adjusting your search query or selecting a different category tab.
            </p>
            <button
              onClick={() => {
                setSelectedCategory('all');
                setSearchQuery('');
              }}
              className="bg-[#18392B] text-white text-xs font-semibold px-4 py-2 rounded-sm"
            >
              Reset Filters
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredItems.map((item) => (
              <div
                key={item.id}
                onClick={() => setSelectedScrapbookItem(item)}
                className="bg-white border border-slate-200 rounded-sm overflow-hidden shadow-xs hover:shadow-md transition cursor-pointer group flex flex-col justify-between"
              >
                {/* Photo container */}
                <div className="relative h-56 w-full bg-slate-800 overflow-hidden">
                  <Image
                    src={item.imageUrl}
                    alt={item.title}
                    fill
                    className="object-cover group-hover:scale-105 transition-transform duration-500"
                    sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                    referrerPolicy="no-referrer"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-60 group-hover:opacity-80 transition-opacity" />

                  {/* Top Badge */}
                  <div className="absolute top-2.5 left-2.5 flex items-center gap-1.5">
                    <span className="bg-[#18392B]/90 text-white text-[10px] uppercase font-bold px-2 py-0.5 rounded border border-[#588B76]/40 tracking-wider">
                      {item.category}
                    </span>
                    {item.year && (
                      <span className="bg-black/60 text-slate-200 text-[10px] font-mono px-2 py-0.5 rounded">
                        {item.year}
                      </span>
                    )}
                  </div>

                  {/* Zoom indicator */}
                  <div className="absolute bottom-2.5 right-2.5 w-8 h-8 rounded bg-black/60 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                    <ZoomIn className="w-4 h-4" />
                  </div>
                </div>

                {/* Content Details */}
                <div className="p-4 flex-1 flex flex-col justify-between">
                  <div>
                    <h3 className="font-serif text-base font-bold text-[#18392B] group-hover:text-[#588B76] transition-colors line-clamp-1 mb-1">
                      {item.title}
                    </h3>
                    <p className="text-xs text-slate-600 line-clamp-3 leading-relaxed mb-3">
                      {item.caption}
                    </p>
                  </div>

                  <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-500">
                    <div className="flex items-center gap-1">
                      <MapPin className="w-3 h-3 text-[#588B76]" />
                      <span className="truncate max-w-[150px]">{item.location || 'Lamtang, Benguet'}</span>
                    </div>
                    {item.date && (
                      <div className="flex items-center gap-1 font-mono">
                        <Calendar className="w-3 h-3 text-slate-400" />
                        <span>{item.date}</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* 4. HISTORICAL RECAP CALLOUT */}
      <section className="max-w-7xl mx-auto px-4 lg:px-8 mt-6">
        <div className="bg-[#18392B] text-white p-6 sm:p-8 rounded-sm border border-[#588B76]/40 flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="space-y-2">
            <h3 className="font-serif text-xl font-bold text-white flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-[#588B76]" />
              <span>Are you a PCM Alumnus with Photos or Memories?</span>
            </h3>
            <p className="text-xs text-slate-300 max-w-2xl leading-relaxed">
              We are constantly digitizing historical photographs from 1992 to the present. If you have photographs, commencement bulletins, or mission journals, help us preserve PCM&apos;s heritage.
            </p>
          </div>
          <button
            onClick={() => {
              addToast('info', 'Scrapbook Submission', 'Please email your photos and captions to archives@pcm.ph or contact our Lamtang office.');
            }}
            className="bg-[#588B76] hover:bg-[#46705F] text-white text-xs font-bold px-5 py-2.5 rounded-sm uppercase tracking-wider transition shrink-0 cursor-pointer"
          >
            Submit Alumni Photos
          </button>
        </div>
      </section>

      {/* 5. FULL-SCREEN LIGHTBOX MODAL */}
      {selectedScrapbookItem && (
        <div className="fixed inset-0 z-50 bg-black/90 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="relative w-full max-w-4xl bg-[#18392B] text-white rounded-sm overflow-hidden border border-[#588B76]/40 shadow-2xl flex flex-col max-h-[90vh]">
            {/* Modal Header */}
            <div className="px-4 py-3 bg-[#10261D] border-b border-slate-700 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="bg-[#588B76] text-white text-[10px] font-bold uppercase px-2 py-0.5 rounded">
                  {selectedScrapbookItem.category}
                </span>
                <span className="font-serif font-bold text-sm text-white truncate max-w-[300px] sm:max-w-md">
                  {selectedScrapbookItem.title}
                </span>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => {
                    navigator.clipboard.writeText(window.location.href);
                    addToast('success', 'Link Copied', 'Scrapbook link copied to clipboard.');
                  }}
                  className="text-slate-300 hover:text-white p-1 rounded hover:bg-slate-800 transition"
                  title="Share"
                >
                  <Share2 className="w-4 h-4" />
                </button>
                <button
                  onClick={() => setSelectedScrapbookItem(null)}
                  className="text-slate-300 hover:text-white p-1 rounded hover:bg-slate-800 transition"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Main Photo Area */}
            <div className="relative flex-1 bg-black min-h-[350px] sm:min-h-[420px] flex items-center justify-center">
              <Image
                src={selectedScrapbookItem.imageUrl}
                alt={selectedScrapbookItem.title}
                fill
                className="object-contain"
                sizes="100vw"
                referrerPolicy="no-referrer"
              />

              {/* Prev / Next Navigation Arrows */}
              <button
                onClick={handlePrev}
                className="absolute left-3 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-black/60 hover:bg-black/90 text-white flex items-center justify-center transition cursor-pointer"
                title="Previous Photo"
              >
                <ChevronLeft className="w-6 h-6" />
              </button>
              <button
                onClick={handleNext}
                className="absolute right-3 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-black/60 hover:bg-black/90 text-white flex items-center justify-center transition cursor-pointer"
                title="Next Photo"
              >
                <ChevronRight className="w-6 h-6" />
              </button>
            </div>

            {/* Modal Footer / Description */}
            <div className="p-4 sm:p-5 bg-[#10261D] border-t border-slate-700 text-xs">
              <p className="text-slate-200 leading-relaxed text-sm mb-3">
                {selectedScrapbookItem.caption}
              </p>

              <div className="flex flex-wrap items-center justify-between gap-3 text-slate-400 text-xs border-t border-slate-800 pt-3">
                <div className="flex items-center gap-4">
                  {selectedScrapbookItem.location && (
                    <div className="flex items-center gap-1 text-slate-300">
                      <MapPin className="w-3.5 h-3.5 text-[#588B76]" />
                      <span>{selectedScrapbookItem.location}</span>
                    </div>
                  )}
                  {selectedScrapbookItem.year && (
                    <div className="flex items-center gap-1 text-slate-300">
                      <Calendar className="w-3.5 h-3.5 text-[#588B76]" />
                      <span>Year: {selectedScrapbookItem.year}</span>
                    </div>
                  )}
                </div>

                <div className="text-slate-500 font-mono text-[11px]">
                  PCM Archives #{selectedScrapbookItem.id}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
