'use client';

import React from 'react';
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
} from 'lucide-react';

export const StudentLifeView: React.FC = () => {
  const { navigateTo } = usePCM();

  return (
    <div className="w-full bg-[#FFFFFF] font-sans pb-20">
      {/* Banner */}
      <div className="bg-[#18392B] text-white py-14 lg:py-20 border-b-4 border-[#588B76]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center space-y-3">
          <span className="text-[11px] font-mono font-bold uppercase tracking-widest text-[#85AA9B]">
            Community & Spiritual Formation
          </span>
          <h1 className="font-serif text-3xl sm:text-4xl lg:text-5xl font-extrabold text-white">
            LIFE AT PHILIPPINES COLLEGE OF MINISTRY
          </h1>
          <p className="text-xs sm:text-sm text-slate-300 max-w-2xl mx-auto leading-relaxed font-sans">
            A sanctified environment where scholarship is nourished by prayer, fellowship, and sacrificial service.
          </p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-12 space-y-16">
        {/* Core Pillars Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="bg-white rounded-xl p-6 border border-slate-200 shadow-sm space-y-3">
            <div className="w-12 h-12 rounded-xl bg-[#18392B] text-[#85AA9B] flex items-center justify-center font-bold">
              <Flame className="w-6 h-6" />
            </div>
            <h3 className="font-serif text-xl font-bold text-[#18392B]">Chapel Services</h3>
            <p className="text-xs text-slate-600 leading-relaxed">
              Every Tuesday and Thursday at 10:00 AM, the entire PCM community gathers for spirited worship, fervent intercessory prayer, and expository messages delivered by guest pastors and faculty.
            </p>
          </div>

          <div className="bg-white rounded-xl p-6 border border-slate-200 shadow-sm space-y-3">
            <div className="w-12 h-12 rounded-xl bg-[#18392B] text-[#85AA9B] flex items-center justify-center font-bold">
              <Users className="w-6 h-6" />
            </div>
            <h3 className="font-serif text-xl font-bold text-[#18392B]">Discipleship Pods</h3>
            <p className="text-xs text-slate-600 leading-relaxed">
              Small accountability groups led by faculty mentors where students share personal burdens, confess struggles, pray for their home churches, and build lifelong bonds in Christ.
            </p>
          </div>

          <div className="bg-white rounded-xl p-6 border border-slate-200 shadow-sm space-y-3">
            <div className="w-12 h-12 rounded-xl bg-[#18392B] text-[#85AA9B] flex items-center justify-center font-bold">
              <Home className="w-6 h-6" />
            </div>
            <h3 className="font-serif text-xl font-bold text-[#18392B]">Residence Life</h3>
            <p className="text-xs text-slate-600 leading-relaxed">
              On-campus dormitories provide a vibrant communal living experience featuring shared dining, evening devotions, group study lounges, and high-speed research WiFi.
            </p>
          </div>
        </div>

        {/* Student Organizations */}
        <section className="space-y-6 pt-8 border-t border-slate-200">
          <div className="text-center max-w-2xl mx-auto space-y-1">
            <span className="text-[11px] font-mono font-bold uppercase tracking-widest text-[#588B76]">
              Student-Led Initiatives
            </span>
            <h2 className="font-serif text-2xl sm:text-3xl font-extrabold text-[#18392B]">
              STUDENT GUILDS & SOCIETIES
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
                <div key={idx} className="bg-white p-5 rounded-xl border border-slate-200 text-center space-y-2">
                  <div className="w-12 h-12 rounded-full bg-[#FFFFFF] text-[#18392B] flex items-center justify-center mx-auto">
                    <Icon className="w-5 h-5 text-[#588B76]" />
                  </div>
                  <h4 className="font-serif font-bold text-sm text-[#18392B]">{org.name}</h4>
                  <p className="text-xs text-slate-500">{org.role}</p>
                </div>
              );
            })}
          </div>
        </section>
      </div>
    </div>
  );
};
