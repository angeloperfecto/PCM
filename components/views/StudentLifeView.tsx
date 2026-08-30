'use client';

import React, { useEffect } from 'react';
import { usePCM } from '@/lib/store';
import {
  Flame,
  Users,
  BookOpen,
  Compass,
  Heart,
  Home,
  Music,
  GraduationCap,
  Sparkles,
  ArrowRight,
  ShieldCheck,
  Calendar,
  Volume2,
} from 'lucide-react';

export const StudentLifeView: React.FC = () => {
  const { navigateTo, activeSubSection, currentSubSection, setRequestInfoModalOpen, setSelectedSermon, sermons } = usePCM();

  useEffect(() => {
    const sub = activeSubSection || currentSubSection;
    if (!sub) return;

    const el = document.getElementById(sub);
    if (el) {
      setTimeout(() => el.scrollIntoView({ behavior: 'smooth' }), 100);
    }
  }, [activeSubSection, currentSubSection]);

  return (
    <div className="w-full bg-[#FFFFFF] font-sans pb-20">
      {/* Banner */}
      <div className="bg-[#18392B] text-white py-14 lg:py-20 border-b-4 border-[#588B76]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center space-y-3">
          <span className="text-[11px] font-mono font-bold uppercase tracking-widest text-[#588B76]">
            Community & Spiritual Formation
          </span>
          <h1 className="font-serif text-3xl sm:text-4xl lg:text-5xl font-extrabold text-white">
            LIFE AT PHILIPPINE COLLEGE OF MINISTRY
          </h1>
          <p className="text-xs sm:text-sm text-slate-200 max-w-2xl mx-auto leading-relaxed font-sans font-light">
            A sanctified environment in Lamtang, Benguet where scholarship is nourished by prayer, corporate worship, discipleship pods, and sacrificial service.
          </p>

          <div className="pt-3 flex flex-wrap items-center justify-center gap-3">
            <button
              onClick={() => navigateTo('apply')}
              className="bg-[#588B76] hover:bg-[#46705F] text-white text-xs font-bold px-4 py-2 rounded-sm transition uppercase tracking-wider cursor-pointer shadow"
            >
              Apply to Join PCM
            </button>
            <button
              onClick={() => navigateTo('resources', 'sermons')}
              className="bg-[#10261D] hover:bg-[#050b16] text-slate-200 text-xs font-semibold px-4 py-2 rounded-sm border border-[#588B76]/40 transition flex items-center gap-2 cursor-pointer"
            >
              <Volume2 className="w-3.5 h-3.5 text-[#588B76]" />
              <span>Chapel Audio Archive</span>
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-12 space-y-16">
        {/* Core Pillars Grid */}
        <section id="chapel" className="space-y-6">
          <div className="text-center max-w-2xl mx-auto space-y-1">
            <span className="text-[11px] font-mono font-bold uppercase tracking-widest text-[#588B76]">
              Spiritual Life
            </span>
            <h2 className="font-serif text-2xl sm:text-3xl font-extrabold text-[#18392B]">
              SPIRITUAL FORMATION & CHAPEL SERVICES
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="bg-white rounded-sm p-6 border border-slate-200 shadow-xs space-y-3">
              <div className="w-12 h-12 rounded-sm bg-[#18392B] text-white flex items-center justify-center font-bold">
                <Flame className="w-6 h-6 text-[#588B76]" />
              </div>
              <h3 className="font-serif text-lg font-bold text-[#18392B]">Chapel Services</h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                Every Tuesday and Thursday at 10:00 AM, the entire PCM community gathers for spirited worship, fervent intercessory prayer, and expository messages delivered by guest pastors and faculty.
              </p>
              {sermons.length > 0 && (
                <button
                  onClick={() => setSelectedSermon(sermons[0])}
                  className="text-xs font-bold text-[#18392B] hover:text-[#588B76] flex items-center gap-1 cursor-pointer pt-2"
                >
                  <span>Listen to Latest Chapel Sermon →</span>
                </button>
              )}
            </div>

            <div className="bg-white rounded-sm p-6 border border-slate-200 shadow-xs space-y-3">
              <div className="w-12 h-12 rounded-sm bg-[#18392B] text-white flex items-center justify-center font-bold">
                <Users className="w-6 h-6 text-[#588B76]" />
              </div>
              <h3 className="font-serif text-lg font-bold text-[#18392B]">Discipleship Pods</h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                Small accountability groups led by faculty mentors where students share personal burdens, confess struggles, pray for their home churches, and build lifelong bonds in Christ.
              </p>
            </div>

            <div id="services" className="bg-white rounded-sm p-6 border border-slate-200 shadow-xs space-y-3">
              <div className="w-12 h-12 rounded-sm bg-[#18392B] text-white flex items-center justify-center font-bold">
                <Home className="w-6 h-6 text-[#588B76]" />
              </div>
              <h3 className="font-serif text-lg font-bold text-[#18392B]">Residence & Campus Life</h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                On-campus dormitories at Lamtang provide a vibrant communal living experience featuring shared dining, evening devotions, group study lounges, and high-speed research WiFi.
              </p>
            </div>
          </div>
        </section>

        {/* Student Organizations */}
        <section id="orgs" className="space-y-6 pt-8 border-t border-slate-200">
          <div className="text-center max-w-2xl mx-auto space-y-1">
            <span className="text-[11px] font-mono font-bold uppercase tracking-widest text-[#588B76]">
              Student-Led Initiatives
            </span>
            <h2 className="font-serif text-2xl sm:text-3xl font-extrabold text-[#18392B]">
              STUDENT ORGANIZATIONS & GUILDS
            </h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              { name: 'PCM Student Council', role: 'Student Governance & Welfare', icon: GraduationCap },
              { name: 'Worship & Liturgy Guild', role: 'Chapel Music & Audio Ministry', icon: Music },
              { name: 'Evangelism & Missions Society', role: 'Campus & Urban Outreaches', icon: Compass },
              { name: 'Theological Society', role: 'Symposia & Academic Forums', icon: BookOpen },
            ].map((org, idx) => {
              const Icon = org.icon;
              return (
                <div key={idx} className="bg-white p-5 rounded-sm border border-slate-200 text-center space-y-2 shadow-xs hover:border-[#588B76] transition">
                  <div className="w-12 h-12 rounded-sm bg-[#18392B]/5 text-[#18392B] flex items-center justify-center mx-auto">
                    <Icon className="w-5 h-5 text-[#588B76]" />
                  </div>
                  <h4 className="font-serif font-bold text-sm text-[#18392B]">{org.name}</h4>
                  <p className="text-xs text-slate-500">{org.role}</p>
                </div>
              );
            })}
          </div>
        </section>

        {/* Ministry Opportunities */}
        <section id="opportunities" className="bg-[#18392B] text-white p-8 rounded-sm border border-[#588B76]/40 space-y-4">
          <div className="max-w-3xl space-y-2">
            <span className="text-[11px] font-mono font-bold uppercase tracking-widest text-[#588B76]">
              Practical Engagement
            </span>
            <h3 className="font-serif text-2xl font-bold text-white">
              WEEKLY MINISTRY OPPORTUNITIES
            </h3>
            <p className="text-xs sm:text-sm text-slate-200 leading-relaxed font-light">
              Every weekend, PCM students deploy into partner churches across Baguio, Benguet, La Union, Pangasinan, and beyond for pastoral preaching, Sunday school teaching, youth camps, and hospital visitation.
            </p>
          </div>

          <div className="pt-2 flex flex-wrap gap-3">
            <button
              onClick={() => navigateTo('ministry', 'practicum')}
              className="bg-[#588B76] hover:bg-[#46705F] text-white text-xs font-bold px-4 py-2.5 rounded-sm transition uppercase tracking-wider cursor-pointer"
            >
              Learn About Pastoral Practicum →
            </button>
            <button
              onClick={() => navigateTo('contact')}
              className="bg-[#10261D] hover:bg-[#050b16] text-slate-200 text-xs font-semibold px-4 py-2.5 rounded-sm border border-slate-700 transition cursor-pointer"
            >
              Schedule Campus Visit
            </button>
          </div>
        </section>
      </div>
    </div>
  );
};
