'use client';

import React, { useState } from 'react';
import { usePCM } from '@/lib/store';
import {
  BookOpen,
  Volume2,
  Download,
  Search,
  FileText,
  Play,
  ArrowRight,
  ShieldCheck,
  FileCheck,
} from 'lucide-react';

export const ResourcesView: React.FC = () => {
  const { downloads, sermons, setSelectedSermon, addToast } = usePCM();
  const [tab, setTab] = useState<'downloads' | 'sermons' | 'journals'>('downloads');
  const [searchQuery, setSearchQuery] = useState('');

  const filteredDownloads = downloads.filter(
    (b) =>
      b.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      b.category.toLowerCase().includes(searchQuery.toLowerCase()) ||
      b.description.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const filteredSermons = sermons.filter(
    (s) =>
      s.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.speaker.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.passage.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleDownload = (title: string, format: string) => {
    addToast('success', 'Download Initialized', `Downloading official document "${title}" (${format}).`);
  };

  return (
    <div className="w-full bg-[#FFFFFF] font-sans pb-20">
      {/* Institutional Banner */}
      <div className="bg-[#18392B] text-white py-14 lg:py-20 border-b-4 border-[#588B76]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center space-y-3">
          <span className="text-[11px] font-mono font-bold uppercase tracking-widest text-[#85AA9B]">
            Theological Repository & Academic Media
          </span>
          <h1 className="font-serif text-3xl sm:text-4xl lg:text-5xl font-extrabold text-white">
            PCM RESOURCES & REPOSITORY
          </h1>
          <p className="text-xs sm:text-sm text-slate-300 max-w-2xl mx-auto leading-relaxed font-sans">
            Access institutional prospectuses, official downloadable registrar forms, chapel sermon audio archives, and theological journals.
          </p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-12 space-y-10">
        {/* Navigation Tabs & Search */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 border-b border-slate-200 pb-4">
          <div className="flex items-center gap-2 w-full sm:w-auto">
            <button
              onClick={() => setTab('downloads')}
              className={`px-5 py-2.5 rounded-lg text-xs font-bold transition cursor-pointer flex items-center gap-2 ${
                tab === 'downloads'
                  ? 'bg-[#18392B] text-[#85AA9B] shadow'
                  : 'bg-white text-slate-700 hover:bg-slate-100 border border-slate-200'
              }`}
            >
              <Download className="w-4 h-4 text-[#588B76]" />
              <span>Official Downloads</span>
            </button>

            <button
              onClick={() => setTab('sermons')}
              className={`px-5 py-2.5 rounded-lg text-xs font-bold transition cursor-pointer flex items-center gap-2 ${
                tab === 'sermons'
                  ? 'bg-[#18392B] text-[#85AA9B] shadow'
                  : 'bg-white text-slate-700 hover:bg-slate-100 border border-slate-200'
              }`}
            >
              <Volume2 className="w-4 h-4 text-[#588B76]" />
              <span>Chapel Sermons ({sermons.length})</span>
            </button>

            <button
              onClick={() => setTab('journals')}
              className={`px-5 py-2.5 rounded-lg text-xs font-bold transition cursor-pointer flex items-center gap-2 ${
                tab === 'journals'
                  ? 'bg-[#18392B] text-[#85AA9B] shadow'
                  : 'bg-white text-slate-700 hover:bg-slate-100 border border-slate-200'
              }`}
            >
              <BookOpen className="w-4 h-4 text-[#588B76]" />
              <span>Theological Publications</span>
            </button>
          </div>

          <div className="flex items-center gap-2 w-full sm:w-72 bg-white px-3 py-2 rounded-lg border border-slate-200 shadow-sm">
            <Search className="w-4 h-4 text-slate-400 shrink-0" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search resources, topics..."
              className="w-full text-xs focus:outline-none"
            />
          </div>
        </div>

        {/* 1. OFFICIAL DOWNLOADS */}
        {tab === 'downloads' && (
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {filteredDownloads.map((doc) => (
                <div
                  key={doc.id}
                  className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex flex-col justify-between space-y-4 hover:border-[#588B76] transition"
                >
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-mono font-bold uppercase text-[#588B76] bg-amber-50 px-2 py-0.5 rounded border border-amber-200">
                        {doc.category}
                      </span>
                      <span className="text-[11px] font-mono text-slate-400 font-bold">
                        {doc.format} • {doc.fileSize}
                      </span>
                    </div>

                    <h4 className="font-serif text-base font-bold text-[#18392B] leading-snug">
                      {doc.title}
                    </h4>
                    <p className="text-xs text-slate-600 leading-relaxed">
                      {doc.description}
                    </p>
                  </div>

                  <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
                    <span className="text-[11px] font-mono text-slate-400">
                      {doc.downloadCount.toLocaleString()} downloads
                    </span>
                    <button
                      onClick={() => handleDownload(doc.title, doc.format)}
                      className="bg-[#18392B] hover:bg-[#588B76] hover:text-[#18392B] text-white text-xs font-bold px-4 py-2 rounded transition flex items-center gap-1.5 cursor-pointer shadow"
                    >
                      <Download className="w-3.5 h-3.5" />
                      <span>Download {doc.format}</span>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* 2. CHAPEL SERMONS & LECTURES */}
        {tab === 'sermons' && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {filteredSermons.map((sermon) => (
              <div
                key={sermon.id}
                className="bg-white rounded-xl p-6 border border-slate-200 shadow-sm flex flex-col justify-between space-y-4"
              >
                <div>
                  <div className="flex items-center justify-between text-xs text-slate-500 mb-2">
                    <span className="font-mono text-[#588B76] font-bold">{sermon.passage}</span>
                    <span className="font-mono bg-slate-100 px-2 py-0.5 rounded">{sermon.duration}</span>
                  </div>

                  <h3 className="font-serif text-lg font-bold text-[#18392B]">{sermon.title}</h3>
                  <p className="text-xs text-slate-600 font-medium mt-1">
                    Preacher: <strong>{sermon.speaker}</strong> • {sermon.date}
                  </p>
                  <p className="text-xs text-slate-500 mt-2 line-clamp-2 leading-relaxed">
                    {sermon.description}
                  </p>
                </div>

                <div className="pt-4 border-t border-slate-100 flex items-center justify-between">
                  <button
                    onClick={() => setSelectedSermon(sermon)}
                    className="bg-[#18392B] hover:bg-[#14234b] text-white text-xs font-bold px-4 py-2.5 rounded-lg flex items-center gap-2 cursor-pointer shadow-sm"
                  >
                    <Play className="w-3.5 h-3.5 text-[#588B76] fill-current" />
                    <span>Play Chapel Sermon</span>
                  </button>
                  <button
                    onClick={() => handleDownload(`${sermon.title}.mp3`, 'MP3')}
                    className="text-xs font-semibold text-slate-600 hover:text-[#18392B] cursor-pointer flex items-center gap-1"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>Audio MP3</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* 3. THEOLOGICAL JOURNALS */}
        {tab === 'journals' && (
          <div className="space-y-6">
            <div className="bg-[#18392B] text-white p-8 rounded-2xl border border-[#588B76]/40 flex flex-col md:flex-row items-center justify-between gap-6">
              <div className="space-y-2">
                <span className="text-xs font-mono font-bold text-[#85AA9B] uppercase">
                  Peer-Reviewed Theological Publication
                </span>
                <h3 className="font-serif text-2xl font-bold">Veritas et Ministerium Academic Journal</h3>
                <p className="text-xs sm:text-sm text-slate-300 max-w-xl leading-relaxed">
                  The flagship theological journal of Philippine College of Ministry, publishing scholarly articles on Reformed theology, biblical hermeneutics, Southeast Asian church history, and urban missiology.
                </p>
              </div>
              <button
                onClick={() => handleDownload('Veritas et Ministerium (Complete Issue)', 'PDF')}
                className="bg-[#588B76] hover:bg-[#b58532] text-[#18392B] font-bold px-6 py-3 rounded-lg text-xs uppercase tracking-wider transition cursor-pointer shrink-0 shadow-lg"
              >
                Download Latest Volume
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
