'use client';

import React from 'react';
import Image from 'next/image';
import { usePCM } from '@/lib/store';
import {
  Flame,
  BookOpen,
  Users,
  Compass,
  Globe,
  Award,
  HeartHandshake,
  GraduationCap,
  ArrowRight,
} from 'lucide-react';

export const LifeAtPCMSection: React.FC = () => {
  const { navigateTo } = usePCM();

  const lifeItems = [
    {
      title: 'Chapel & Corporate Worship',
      desc: 'Weekly sacred assemblies gathering faculty and students for deep prayer, testimony, and passionate worship.',
      icon: Flame,
      image: 'https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?q=80&w=600&auto=format&fit=crop',
    },
    {
      title: 'Bible Study & Exegesis Circles',
      desc: 'Intimate student cohort discussions wrestling with original languages, doctrinal papers, and canonical theology.',
      icon: BookOpen,
      image: 'https://images.unsplash.com/photo-1577495508048-b635879837f1?q=80&w=600&auto=format&fit=crop',
    },
    {
      title: 'Brotherhood & Sisterhood Fellowship',
      desc: 'Lifelong friendships forged through communal meals, prayer walks in Diliman, and residence hall devotions.',
      icon: Users,
      image: 'https://images.unsplash.com/photo-1529156069898-49953e39b3ac?q=80&w=600&auto=format&fit=crop',
    },
    {
      title: 'Ministry Practicum',
      desc: 'Direct weekly pulpit preaching, youth leadership, and pastoral counseling in 85+ partner evangelical churches.',
      icon: Compass,
      image: 'https://images.unsplash.com/photo-1438232992991-995b7058bbb3?q=80&w=600&auto=format&fit=crop',
    },
    {
      title: 'Cross-Cultural Missions',
      desc: 'Short-term mission exposures to indigenous tribal communities in Mindoro, Northern Luzon, and Southeast Asia.',
      icon: Globe,
      image: 'https://images.unsplash.com/photo-1488521787991-ed7bbaae773c?q=80&w=600&auto=format&fit=crop',
    },
    {
      title: 'Student Council & Organizations',
      desc: 'Student-led ministries including the Worship Guild, Evangelism Society, and Christian Social Action Committee.',
      icon: Award,
      image: 'https://images.unsplash.com/photo-1523240795612-9a054b0db644?q=80&w=600&auto=format&fit=crop',
    },
    {
      title: 'Community Outreach & Relief',
      desc: 'Practical expression of Christ’s love through medical-dental missions, disaster relief, and feeding ministries.',
      icon: HeartHandshake,
      image: 'https://images.unsplash.com/photo-1559027615-cd4628902d4a?q=80&w=600&auto=format&fit=crop',
    },
    {
      title: 'Leadership Development',
      desc: 'Mentorship pods with seasoned pastors, organizational management training, and character assessments.',
      icon: GraduationCap,
      image: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?q=80&w=600&auto=format&fit=crop',
    },
  ];

  return (
    <section className="w-full bg-white py-16 lg:py-24 border-b border-[#D0DED8]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center max-w-3xl mx-auto mb-14 space-y-3">
          <div className="inline-flex items-center gap-1.5 text-xs font-bold text-[#588B76] uppercase tracking-widest font-mono">
            <span>Holistic Formation</span>
          </div>
          <h2 className="font-serif text-3xl sm:text-4xl font-extrabold text-[#18392B]">
            LIFE AT PCM
          </h2>
          <p className="text-xs sm:text-sm text-[#18392B]/80">
            Education at Philippine College of Ministry extends far beyond the lecture hall. Experience a vibrant, Christ-centered campus community where minds are sharpened and hearts are ignited for kingdom service.
          </p>
        </div>

        {/* 8 Bento Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {lifeItems.map((item, idx) => {
            const Icon = item.icon;
            return (
              <div
                key={idx}
                className="group relative bg-[#D0DED8]/20 rounded-xl overflow-hidden border border-[#D0DED8] hover:border-[#588B76] shadow-xs hover:shadow-xl transition-all duration-300 flex flex-col"
              >
                {/* Image */}
                <div className="h-40 overflow-hidden relative">
                  <Image
                    src={item.image}
                    alt={item.title}
                    fill
                    className="object-cover group-hover:scale-105 transition-transform duration-500"
                    sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
                    referrerPolicy="no-referrer"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-[#18392B]/95 via-[#18392B]/35 to-transparent" />
                  <div className="absolute bottom-3 left-3 flex items-center gap-2">
                    <div className="w-8 h-8 rounded-lg bg-[#588B76] text-white flex items-center justify-center font-bold shadow">
                      <Icon className="w-4 h-4" />
                    </div>
                  </div>
                </div>

                {/* Content */}
                <div className="p-4 flex-1 flex flex-col justify-between space-y-2">
                  <div>
                    <h3 className="font-serif text-sm sm:text-base font-bold text-[#18392B] group-hover:text-[#588B76] transition-colors leading-snug">
                      {item.title}
                    </h3>
                    <p className="text-xs text-[#18392B]/75 mt-1 leading-relaxed line-clamp-3">
                      {item.desc}
                    </p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Bottom CTA */}
        <div className="mt-12 text-center">
          <button
            onClick={() => navigateTo('student-life')}
            className="inline-flex items-center gap-2 bg-[#18392B] hover:bg-[#10261D] text-white text-xs font-bold px-6 py-3 rounded shadow transition uppercase tracking-wider cursor-pointer"
          >
            <span>Explore Campus Life & Spiritual Formation</span>
            <ArrowRight className="w-4 h-4 text-[#85AA9B]" />
          </button>
        </div>
      </div>
    </section>
  );
};
