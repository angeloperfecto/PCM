'use client';

import React from 'react';
import Image from 'next/image';
import { usePCM } from '@/lib/store';
import {
  CheckCircle2,
  BookOpen,
  Heart,
  Award,
  Users,
  Compass,
  Flame,
  ArrowRight,
} from 'lucide-react';

export const AboutSection: React.FC = () => {
  const { navigateTo } = usePCM();

  const developmentPillars = [
    {
      title: 'Biblical Knowledge',
      desc: 'Mastery of Old & New Testament canonical Scriptures in original Greek and Hebrew.',
      icon: BookOpen,
    },
    {
      title: 'Spiritual Maturity',
      desc: 'Disciplines of constant prayer, fasting, holiness, and vibrant walk with the Holy Spirit.',
      icon: Flame,
    },
    {
      title: 'Christ-Like Character',
      desc: 'Uncompromising integrity, moral purity, and humble pastoral vulnerability.',
      icon: Heart,
    },
    {
      title: 'Visionary Leadership',
      desc: 'Strategic organizational governance, elder board wisdom, and team mobilization.',
      icon: Award,
    },
    {
      title: 'Ministry Competence',
      desc: 'Expository homiletics, pastoral counseling, crisis care, and church administration.',
      icon: Compass,
    },
    {
      title: 'Servant-Heartedness',
      desc: 'Washing the feet of the church body and sacrificing for the marginalized.',
      icon: Users,
    },
  ];

  return (
    <section className="w-full bg-white py-12 lg:py-16 border-b border-[#D0DED8]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center">
          {/* Left Column: Image Composition */}
          <div className="lg:col-span-5 relative">
            <div className="relative rounded-sm overflow-hidden shadow-md border-2 border-[#D0DED8] h-[400px]">
              <Image
                src="https://images.unsplash.com/photo-1524178232363-1fb2b075b655?q=80&w=1000&auto=format&fit=crop"
                alt="PCM Theological Classroom Discussion"
                fill
                className="object-cover object-center"
                sizes="(max-width: 1024px) 100vw, 40vw"
                referrerPolicy="no-referrer"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-[#18392B]/95 via-[#18392B]/40 to-transparent" />
              
              <div className="absolute bottom-5 left-5 right-5 text-white space-y-1">
                <span className="text-[10px] font-mono uppercase tracking-widest text-[#85AA9B] font-bold">
                  Philippine Theological Heritage
                </span>
                <h4 className="font-serif text-base font-bold">
                  Rigorous Exegesis Meets Pastoral Piety
                </h4>
                <p className="text-xs text-[#D0DED8]">
                  Forming faithful shepherds for Philippine local churches and overseas Filipino diaspora.
                </p>
              </div>
            </div>

            {/* Floating Experience Badge */}
            <div className="absolute -bottom-4 -right-2 sm:right-4 bg-[#18392B] text-white p-3.5 rounded-sm border-2 border-[#588B76] shadow-lg text-center">
              <span className="block font-serif text-2xl font-bold text-[#85AA9B]">24+</span>
              <span className="text-[9px] font-bold uppercase tracking-wider text-[#D0DED8]">
                Years of Faithfulness
              </span>
            </div>
          </div>

          {/* Right Column: Editorial Overview */}
          <div className="lg:col-span-7 space-y-4">
            <div className="space-y-1">
              <div className="flex items-center gap-2 mb-1">
                <div className="w-2 h-6 bg-[#588B76]" />
                <h2 className="font-serif text-2xl sm:text-3xl font-bold text-[#18392B] leading-tight">
                  FORMING LIVES. EQUIPPING MINISTERS. SERVING THE KINGDOM.
                </h2>
              </div>
              <p className="text-xs text-[#588B76] font-bold uppercase tracking-widest font-mono pl-4">
                About Philippine College of Ministry
              </p>
            </div>

            <p className="text-xs sm:text-sm text-[#18392B]/90 leading-relaxed">
              Founded in 2002, <strong>Philippine College of Ministry (PCM)</strong> stands as a premier theological institution in Northern Luzon and Metro Manila networks, committed to the historic Christian faith, the inerrancy of Holy Scripture, and the urgent imperative of the Great Commission.
            </p>

            <p className="text-xs text-[#18392B]/75 leading-relaxed">
              We do not merely confer academic credentials; we prayerfully cultivate men and women into godly shepherds, missionary church planters, Christian educators, and community leaders equipped to confront the intellectual and spiritual challenges of contemporary Southeast Asia.
            </p>

            {/* 6 Core Development Areas (High Density Grid) */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-1">
              {developmentPillars.map((p, idx) => {
                const Icon = p.icon;
                return (
                  <div
                    key={idx}
                    className="flex items-start gap-2.5 p-2.5 rounded-sm bg-[#D0DED8]/25 border border-[#D0DED8] border-l-2 border-l-[#18392B] shadow-xs"
                  >
                    <div className="w-7 h-7 rounded-sm bg-[#18392B] text-[#85AA9B] flex items-center justify-center shrink-0 mt-0.5">
                      <Icon className="w-3.5 h-3.5" />
                    </div>
                    <div>
                      <h4 className="text-xs font-bold text-[#18392B]">{p.title}</h4>
                      <p className="text-[11px] text-[#18392B]/70 mt-0.5 leading-tight">{p.desc}</p>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Action CTAs */}
            <div className="pt-3 flex flex-wrap items-center gap-3">
              <button
                id="about-btn-learn-more"
                onClick={() => navigateTo('about')}
                className="bg-[#18392B] hover:bg-[#10261D] text-white text-xs font-bold px-5 py-2.5 rounded-sm shadow-sm transition flex items-center gap-2 cursor-pointer uppercase tracking-wider"
              >
                <span>Learn More About PCM</span>
                <ArrowRight className="w-3.5 h-3.5 text-[#85AA9B]" />
              </button>

              <button
                id="about-btn-faith"
                onClick={() => navigateTo('about', 'faith')}
                className="text-xs font-bold text-[#588B76] hover:text-[#18392B] underline transition cursor-pointer"
              >
                Read Doctrinal Statement of Faith →
              </button>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
