'use client';

import React, { useState, useEffect } from 'react';
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
  HelpCircle,
  ChevronDown,
  Building,
} from 'lucide-react';

export const ResourcesView: React.FC = () => {
  const { downloads, sermons, setSelectedSermon, addToast, activeSubSection, currentSubSection } = usePCM();
  
  const sub = activeSubSection || currentSubSection;
  const initialTab: 'downloads' | 'sermons' | 'journals' | 'faqs' =
    sub === 'sermons' ? 'sermons' :
    (sub === 'publications' || sub === 'journals') ? 'journals' :
    sub === 'faqs' ? 'faqs' : 'downloads';

  const [tab, setTab] = useState<'downloads' | 'sermons' | 'journals' | 'faqs'>(initialTab);
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedFaq, setExpandedFaq] = useState<number | null>(0);

  useEffect(() => {
    if (!sub) return;

    if (sub === 'library') {
      const el = document.getElementById('library');
      if (el) {
        const timer = setTimeout(() => el.scrollIntoView({ behavior: 'smooth' }), 100);
        return () => clearTimeout(timer);
      }
    }
  }, [sub]);

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

  const handleDownload = (title: string, format: string = 'PDF') => {
    addToast('success', 'Download Initialized', `Downloading official document "${title}" (${format}).`);
  };

  const faqs = [
    {
      q: 'Is Philippine College of Ministry recognized by the Philippine Government (CHED)?',
      a: 'Yes. Philippine College of Ministry operates in compliance with the Commission on Higher Education (CHED) standards and is affiliated with the Philippine Association of Bible and Theological Schools (PABATS) and the Philippine Council of Evangelical Churches (PCEC).',
    },
    {
      q: 'Does PCM accept DepEd Senior High School Vouchers for Grades 11 & 12?',
      a: 'Yes! Grade 10 completers from public Junior High Schools qualify for 100% DepEd Senior High School ESC/QVR voucher coverage, meaning zero out-of-pocket tuition for the General Academic Strand (GAS).',
    },
    {
      q: 'Where is the permanent campus located and how can I visit?',
      a: 'PCM is located at Lamtang, Puguis, La Trinidad, Benguet (just 15–20 minutes from Baguio City center via Naguilian/Asin road). Visitors and prospective students are welcome Monday through Friday, 8:00 AM to 5:00 PM.',
    },
    {
      q: 'What theological tradition and doctrine does PCM adhere to?',
      a: 'PCM is a non-denominational evangelical college rooted in the historic Stone-Campbell Restoration Movement, affirming the inerrancy and divine authority of Holy Scripture, salvation by grace through faith in Jesus Christ, and the mandate of the Great Commission.',
    },
    {
      q: 'What financial aid and scholarship options are available?',
      a: 'PCM provides Pastoral Worker Grants (50%–100% discount for pastors’ children), Work-Study Assistantships in our library and campus administration, and Local Church Matching Support.',
    },
  ];

  return (
    <div className="w-full bg-[#FFFFFF] font-sans pb-20">
      {/* Institutional Banner */}
      <div className="bg-[#18392B] text-white py-14 lg:py-20 border-b-4 border-[#588B76]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center space-y-3">
          <span className="text-[11px] font-mono font-bold uppercase tracking-widest text-[#588B76]">
            Theological Repository & Academic Media
          </span>
          <h1 className="font-serif text-3xl sm:text-4xl lg:text-5xl font-extrabold text-white">
            PCM RESOURCES & REPOSITORY
          </h1>
          <p className="text-xs sm:text-sm text-slate-200 max-w-2xl mx-auto leading-relaxed font-sans font-light">
            Access institutional prospectuses, official downloadable registrar forms, chapel sermon audio archives, and theological journals.
          </p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-12 space-y-10">
        {/* Navigation Tabs & Search */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 border-b border-slate-200 pb-4">
          <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
            <button
              onClick={() => setTab('downloads')}
              className={`px-4 py-2 rounded-sm text-xs font-bold transition cursor-pointer flex items-center gap-2 ${
                tab === 'downloads'
                  ? 'bg-[#18392B] text-white shadow-xs'
                  : 'bg-white text-slate-700 hover:bg-slate-100 border border-slate-200'
              }`}
            >
              <Download className="w-3.5 h-3.5 text-[#588B76]" />
              <span>Official Downloads ({downloads.length})</span>
            </button>

            <button
              onClick={() => setTab('sermons')}
              className={`px-4 py-2 rounded-sm text-xs font-bold transition cursor-pointer flex items-center gap-2 ${
                tab === 'sermons'
                  ? 'bg-[#18392B] text-white shadow-xs'
                  : 'bg-white text-slate-700 hover:bg-slate-100 border border-slate-200'
              }`}
            >
              <Volume2 className="w-3.5 h-3.5 text-[#588B76]" />
              <span>Chapel Sermons ({sermons.length})</span>
            </button>

            <button
              onClick={() => setTab('journals')}
              className={`px-4 py-2 rounded-sm text-xs font-bold transition cursor-pointer flex items-center gap-2 ${
                tab === 'journals'
                  ? 'bg-[#18392B] text-white shadow-xs'
                  : 'bg-white text-slate-700 hover:bg-slate-100 border border-slate-200'
              }`}
            >
              <BookOpen className="w-3.5 h-3.5 text-[#588B76]" />
              <span>Theological Journal</span>
            </button>

            <button
              onClick={() => setTab('faqs')}
              className={`px-4 py-2 rounded-sm text-xs font-bold transition cursor-pointer flex items-center gap-2 ${
                tab === 'faqs'
                  ? 'bg-[#18392B] text-white shadow-xs'
                  : 'bg-white text-slate-700 hover:bg-slate-100 border border-slate-200'
              }`}
            >
              <HelpCircle className="w-3.5 h-3.5 text-[#588B76]" />
              <span>FAQs</span>
            </button>
          </div>

          <div className="flex items-center gap-2 w-full sm:w-72 bg-white px-3 py-1.5 rounded-sm border border-slate-200 shadow-2xs">
            <Search className="w-4 h-4 text-slate-400 shrink-0" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search repository..."
              className="w-full text-xs bg-transparent focus:outline-hidden"
            />
          </div>
        </div>

        {/* Tab 1: DOWNLOADS */}
        {tab === 'downloads' && (
          <div className="space-y-8">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredDownloads.map((doc) => (
                <div
                  key={doc.id}
                  className="bg-white rounded-sm p-5 border border-slate-200 hover:border-[#588B76] shadow-xs hover:shadow-md transition-all flex flex-col justify-between group"
                >
                  <div>
                    <div className="flex items-center justify-between mb-3">
                      <span className="text-[10px] font-mono font-bold bg-[#18392B] text-white px-2 py-0.5 rounded-sm">
                        {doc.format}
                      </span>
                      <span className="text-[11px] text-slate-400 font-mono">{doc.fileSize}</span>
                    </div>

                    <h4 className="font-serif text-base font-bold text-[#18392B] group-hover:text-[#588B76] transition-colors leading-snug">
                      {doc.title}
                    </h4>
                    <p className="text-xs text-slate-600 mt-1 leading-relaxed">{doc.description}</p>
                  </div>

                  <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between">
                    <span className="text-[11px] font-mono text-slate-400">{doc.category}</span>
                    <button
                      onClick={() => handleDownload(doc.title, doc.format)}
                      className="bg-[#18392B] hover:bg-[#588B76] text-white text-xs font-bold px-3 py-1.5 rounded-sm transition flex items-center gap-1.5 cursor-pointer"
                    >
                      <Download className="w-3.5 h-3.5" />
                      <span>Download</span>
                    </button>
                  </div>
                </div>
              ))}
            </div>

            {/* Library info box */}
            <div id="library" className="bg-[#18392B] text-white p-6 rounded-sm border border-[#588B76]/40 flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="space-y-1">
                <span className="text-[10px] font-mono uppercase font-bold text-[#588B76]">Theological Library & Media Center</span>
                <h3 className="font-serif text-lg font-bold">Over 15,000+ Theological Volumes & Greek/Hebrew Exegetical Tools</h3>
                <p className="text-xs text-slate-300">Open Monday–Saturday, 8:00 AM – 8:00 PM for enrolled students, alumni, and visiting researchers.</p>
              </div>
              <button
                onClick={() => handleDownload('PCM Theological Library Catalog 2026', 'PDF')}
                className="bg-[#588B76] hover:bg-[#46705F] text-white text-xs font-bold px-4 py-2.5 rounded-sm shrink-0 transition cursor-pointer"
              >
                Download Library Catalog
              </button>
            </div>
          </div>
        )}

        {/* Tab 2: SERMONS */}
        {tab === 'sermons' && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredSermons.map((sermon) => (
              <div
                key={sermon.id}
                onClick={() => setSelectedSermon(sermon)}
                className="bg-white rounded-sm p-5 border border-slate-200 hover:border-[#588B76] shadow-xs hover:shadow-md transition cursor-pointer flex flex-col justify-between group"
              >
                <div>
                  <div className="flex items-center justify-between text-xs text-slate-400 mb-2">
                    <span className="font-mono text-[11px] text-[#588B76] font-bold">{sermon.date}</span>
                    <span className="font-mono text-[11px]">{sermon.duration}</span>
                  </div>

                  <h4 className="font-serif text-base font-bold text-[#18392B] group-hover:text-[#588B76] transition-colors leading-snug">
                    {sermon.title}
                  </h4>
                  <p className="text-xs text-slate-600 mt-1 font-medium">{sermon.speaker}</p>
                  <p className="text-xs text-slate-500 italic mt-0.5">{sermon.passage}</p>
                </div>

                <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs font-bold text-[#18392B] group-hover:text-[#588B76]">
                  <span className="flex items-center gap-1.5">
                    <Play className="w-3.5 h-3.5 fill-current text-[#588B76]" />
                    <span>Play Audio Message</span>
                  </span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Tab 3: JOURNALS */}
        {tab === 'journals' && (
          <div className="bg-white rounded-sm p-8 border border-slate-200 space-y-6 max-w-4xl mx-auto">
            <div className="border-b border-slate-100 pb-4">
              <span className="text-[11px] font-mono font-bold uppercase tracking-wider text-[#588B76]">
                Academic Publication
              </span>
              <h3 className="font-serif text-2xl font-bold text-[#18392B] mt-1">
                VERITAS ET MINISTERIUM: JOURNAL OF BIBLICAL THEOLOGY
              </h3>
              <p className="text-xs text-slate-600 mt-1">
                An annual peer-reviewed academic theological publication by the faculty and alumni of Philippine College of Ministry.
              </p>
            </div>

            <div className="space-y-4">
              {[
                {
                  vol: 'Volume IX (2025–2026 Edition)',
                  theme: 'Expository Preaching in Multi-Ethnic Cordillera Contexts',
                  articles: [
                    'Samson Lubag: The Restoration Ideal and Indigenous Leadership in Northern Luzon',
                    'Faculty Symposium: Exegetical Analysis of Romans 12 in Tribal Communities',
                    'Graduate Thesis Abstract: Urban Church Planting Methodologies in Benguet',
                  ],
                },
                {
                  vol: 'Volume VIII (2024 Edition)',
                  theme: 'Biblical Inerrancy and Theological Education in 21st-Century Asia',
                  articles: [
                    'Academic Dean: Hermeneutical Integrity in Cross-Cultural Mission Fields',
                    'Historical Perspectives: 32 Years of Theological Equipping at PCM Lamtang',
                  ],
                },
              ].map((vol, idx) => (
                <div key={idx} className="p-4 bg-slate-50 rounded-sm border border-slate-200 space-y-2">
                  <div className="flex items-center justify-between">
                    <h4 className="font-serif font-bold text-sm text-[#18392B]">{vol.vol}</h4>
                    <button
                      onClick={() => handleDownload(`${vol.vol} - Complete Journal`, 'PDF')}
                      className="bg-[#18392B] hover:bg-[#588B76] text-white text-[11px] font-bold px-3 py-1 rounded-sm transition cursor-pointer flex items-center gap-1"
                    >
                      <Download className="w-3 h-3" />
                      <span>Download Issue (PDF)</span>
                    </button>
                  </div>
                  <p className="text-xs font-semibold text-[#588B76]">Theme: {vol.theme}</p>
                  <ul className="text-xs text-slate-600 space-y-1 list-disc pl-4">
                    {vol.articles.map((art, i) => (
                      <li key={i}>{art}</li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Tab 4: FAQS */}
        {tab === 'faqs' && (
          <div className="max-w-3xl mx-auto space-y-3">
            {faqs.map((faq, idx) => {
              const isExpanded = expandedFaq === idx;
              return (
                <div
                  key={idx}
                  className="bg-white border border-slate-200 rounded-sm overflow-hidden shadow-2xs"
                >
                  <button
                    onClick={() => setExpandedFaq(isExpanded ? null : idx)}
                    className="w-full text-left p-4 flex items-center justify-between font-serif font-bold text-sm text-[#18392B] hover:text-[#588B76] transition cursor-pointer"
                  >
                    <span>{faq.q}</span>
                    <ChevronDown
                      className={`w-4 h-4 text-[#588B76] transition-transform duration-200 shrink-0 ml-2 ${
                        isExpanded ? 'rotate-180' : ''
                      }`}
                    />
                  </button>
                  {isExpanded && (
                    <div className="px-4 pb-4 text-xs text-slate-600 leading-relaxed border-t border-slate-100 pt-3">
                      {faq.a}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};
