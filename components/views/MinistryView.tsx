'use client';

import React, { useEffect } from 'react';
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
  ShieldCheck,
  Building,
  Heart,
} from 'lucide-react';

export const MinistryView: React.FC = () => {
  const { navigateTo, activeSubSection, currentSubSection } = usePCM();

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
            Kingdom Advancement & Ecclesial Service
          </span>
          <h1 className="font-serif text-3xl sm:text-4xl lg:text-5xl font-extrabold text-white">
            MINISTRY FORMATION & FIELD PRACTICUM
          </h1>
          <p className="text-xs sm:text-sm text-slate-200 max-w-2xl mx-auto leading-relaxed font-sans font-light">
            Bridging academic theology with immediate local church service in over 85 partner congregations across the Philippine archipelago.
          </p>

          <div className="pt-3 flex flex-wrap items-center justify-center gap-3">
            <button
              onClick={() => navigateTo('apply')}
              className="bg-[#588B76] hover:bg-[#46705F] text-white text-xs font-bold px-4 py-2 rounded-sm transition uppercase tracking-wider cursor-pointer shadow"
            >
              Apply to PCM
            </button>
            <button
              onClick={() => navigateTo('contact')}
              className="bg-[#10261D] hover:bg-[#050b16] text-slate-200 text-xs font-semibold px-4 py-2 rounded-sm border border-[#588B76]/40 transition cursor-pointer"
            >
              Partner with PCM
            </button>
          </div>
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

          <div className="relative w-full h-80 rounded-sm overflow-hidden shadow-md border border-slate-200">
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
              PCM students actively serve across key evangelical denominations in Benguet, Baguio City, Metro Manila, Rizal, Cavite, Laguna, Bulacan, Pangasinan, and Mindanao.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              { region: 'Cordillera & Baguio-Benguet', count: '42 Partner Churches', desc: 'Mountain church plants, tribal ministries, and community congregations in Benguet' },
              { region: 'Metro Manila / NCR', count: '22 Partner Churches', desc: 'Urban church plants, campus outreaches, and pastoral internships' },
              { region: 'Central & Northern Luzon', count: '14 Partner Churches', desc: 'Provincial ministries, bible camps, and missionary bases in Pangasinan and La Union' },
              { region: 'Visayas & Mindanao', count: '7 Strategic Hubs', desc: 'Cross-cultural tribal outreach and theological extension cohorts' },
            ].map((reg, idx) => (
              <div key={idx} className="bg-white p-5 rounded-sm border border-slate-200 shadow-xs space-y-2 hover:border-[#588B76] transition">
                <span className="text-[10px] font-mono font-bold uppercase text-[#588B76]">{reg.count}</span>
                <h4 className="font-serif font-bold text-base text-[#18392B]">{reg.region}</h4>
                <p className="text-xs text-slate-500 leading-relaxed">{reg.desc}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Missions & Community Service */}
        <section id="missions" className="grid grid-cols-1 md:grid-cols-2 gap-8 pt-8 border-t border-slate-200">
          <div id="formation" className="bg-white rounded-sm p-6 border border-slate-200 shadow-xs space-y-3">
            <div className="w-10 h-10 rounded-sm bg-[#18392B]/5 text-[#18392B] flex items-center justify-center">
              <Globe className="w-5 h-5 text-[#588B76]" />
            </div>
            <h3 className="font-serif text-lg font-bold text-[#18392B]">Missions & Cross-Cultural Outreach</h3>
            <p className="text-xs text-slate-600 leading-relaxed">
              Every January during the intensive winter term, PCM cohorts embark on cross-cultural mission treks to unreached indigenous communities in the Cordillera mountains and cross-cultural mission hubs across Southeast Asia.
            </p>
          </div>

          <div id="community" className="bg-white rounded-sm p-6 border border-slate-200 shadow-xs space-y-3">
            <div className="w-10 h-10 rounded-sm bg-[#18392B]/5 text-[#18392B] flex items-center justify-center">
              <HeartHandshake className="w-5 h-5 text-[#588B76]" />
            </div>
            <h3 className="font-serif text-lg font-bold text-[#18392B]">Community & Medical Missions</h3>
            <p className="text-xs text-slate-600 leading-relaxed">
              In partnership with local healthcare practitioners and partner churches, PCM coordinates free medical/dental clinics, relief distributions in disaster-affected areas, and community values education programs.
            </p>
          </div>
        </section>
      </div>
    </div>
  );
};
