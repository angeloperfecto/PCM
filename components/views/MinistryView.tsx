'use client';

import React from 'react';
import Image from 'next/image';
import { usePCM } from '@/lib/store';
import {
  Church,
  Compass,
  Globe,
  HeartHandshake,
  Users,
  CheckCircle2,
  ArrowRight,
} from 'lucide-react';

export const MinistryView: React.FC = () => {
  const { navigateTo } = usePCM();

  return (
    <div className="w-full bg-[#FFFFFF] font-sans pb-20">
      {/* Banner */}
      <div className="bg-[#18392B] text-white py-14 lg:py-20 border-b-4 border-[#588B76]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center space-y-3">
          <span className="text-[11px] font-mono font-bold uppercase tracking-widest text-[#85AA9B]">
            Kingdom Advancement
          </span>
          <h1 className="font-serif text-3xl sm:text-4xl lg:text-5xl font-extrabold text-white">
            MINISTRY FORMATION & FIELD PRACTICUM
          </h1>
          <p className="text-xs sm:text-sm text-slate-300 max-w-2xl mx-auto leading-relaxed font-sans">
            Bridging academic theology with immediate local church service in over 85 partner congregations across the Philippine archipelago.
          </p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-12 space-y-16">
        {/* Practicum Overview */}
        <section id="practicum" className="grid grid-cols-1 lg:grid-cols-2 gap-10 items-center">
          <div className="space-y-4 text-xs sm:text-sm text-slate-700 leading-relaxed">
            <span className="text-[11px] font-mono font-bold uppercase tracking-widest text-[#588B76]">
              Supervised Field Ministry
            </span>
            <h2 className="font-serif text-2xl sm:text-3xl font-extrabold text-[#18392B]">
              PASTORAL APPRENTICESHIP PROGRAM
            </h2>
            <p>
              Theological education at PCM is inherently tied to the local church. Every enrolled student undergoes weekly supervised pastoral practicum under the direct mentorship of a veteran Senior Pastor.
            </p>
            <p>
              Students rotate through essential ministerial competencies: expository pulpit preaching, youth discipleship, grief and hospital visitation, church administrative finance, and small group leadership.
            </p>
            <div className="space-y-2 pt-2">
              {[
                'Minimum 400 hours of documented local church ministry for degree completion',
                'Bi-weekly supervisory feedback sessions between Pastor and Faculty Advisor',
                'Practical evaluations in wedding, funeral, and ordinance administration',
              ].map((item, i) => (
                <div key={i} className="flex items-center gap-2 font-medium text-slate-800">
                  <CheckCircle2 className="w-4 h-4 text-[#588B76] shrink-0" />
                  <span>{item}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="relative w-full h-80 rounded-2xl overflow-hidden shadow-xl border border-slate-200">
            <Image
              src="https://images.unsplash.com/photo-1438232992991-995b7058bbb3?q=80&w=800&auto=format&fit=crop"
              alt="Pastoral Practicum in Action"
              fill
              className="object-cover"
              sizes="(max-width: 1024px) 100vw, 50vw"
              referrerPolicy="no-referrer"
            />
          </div>
        </section>

        {/* 85+ Church Partnerships */}
        <section id="partnerships" className="space-y-6 pt-8 border-t border-slate-200">
          <div className="text-center max-w-2xl mx-auto space-y-1">
            <span className="text-[11px] font-mono font-bold uppercase tracking-widest text-[#588B76]">
              Ecclesial Network
            </span>
            <h2 className="font-serif text-2xl sm:text-3xl font-extrabold text-[#18392B]">
              85+ PARTNER CHURCHES ACROSS THE PHILIPPINES
            </h2>
            <p className="text-xs text-slate-600">
              PCM students actively serve across key evangelical denominations in Metro Manila, Rizal, Cavite, Laguna, Bulacan, Pangasinan, and Mindanao.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              { region: 'Metro Manila / NCR', count: '38 Partner Churches', desc: 'Urban church plants, campus outreaches, and megachurch internships' },
              { region: 'CALABARZON (Rizal/Cavite)', count: '24 Partner Churches', desc: 'Community churches, youth centers, and suburban congregations' },
              { region: 'Central & Northern Luzon', count: '15 Partner Churches', desc: 'Rural provincial ministries, bible camps, and missionary bases' },
              { region: 'Visayas & Mindanao', count: '8 Strategic Hubs', desc: 'Cross-cultural tribal outreach and theological extension cohorts' },
            ].map((reg, idx) => (
              <div key={idx} className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm space-y-2">
                <span className="text-[10px] font-mono font-bold uppercase text-[#588B76]">{reg.count}</span>
                <h4 className="font-serif font-bold text-base text-[#18392B]">{reg.region}</h4>
                <p className="text-xs text-slate-500 leading-relaxed">{reg.desc}</p>
              </div>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
};
