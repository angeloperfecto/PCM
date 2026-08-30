'use client';

import React from 'react';
import { usePCM } from '@/lib/store';
import {
  GraduationCap,
  FileCheck,
  Users,
  Compass,
  BookMarked,
  MailQuestion,
  ArrowUpRight,
} from 'lucide-react';

export const QuickAccessSection: React.FC = () => {
  const { navigateTo } = usePCM();

  const cards = [
    {
      id: 'academics',
      title: 'ACADEMICS',
      description: 'Explore our accredited theological, ministerial, and biblical degree programs.',
      icon: GraduationCap,
      action: () => navigateTo('academics'),
      badge: 'B.Th. • M.Div. • M.C.L.',
    },
    {
      id: 'admissions',
      title: 'ADMISSIONS',
      description: 'Learn how to begin your journey at PCM with our 4-step admission guide.',
      icon: FileCheck,
      action: () => navigateTo('admissions'),
      badge: 'Apply Online',
    },
    {
      id: 'student-life',
      title: 'STUDENT LIFE',
      description: 'Discover our Christ-centered community, spiritual chapel, and student body.',
      icon: Users,
      action: () => navigateTo('student-life'),
      badge: 'Chapel & Fellowship',
    },
    {
      id: 'ministry',
      title: 'MINISTRY',
      description: 'Develop practical ministry skills through real-world service in 85+ partner churches.',
      icon: Compass,
      action: () => navigateTo('ministry'),
      badge: 'Practicum & Missions',
    },
    {
      id: 'library',
      title: 'LIBRARY',
      description: 'Access 25,000+ theological volumes, Greek & Hebrew commentaries, and journals.',
      icon: BookMarked,
      action: () => navigateTo('resources', 'library'),
      badge: 'Digital Catalog',
    },
    {
      id: 'contact',
      title: 'CONTACT',
      description: 'Connect with our admissions counselors, schedule a campus visit, or inquire.',
      icon: MailQuestion,
      action: () => navigateTo('contact'),
      badge: 'Baguio-Benguet Campus',
    },
  ];

  return (
    <section className="w-full bg-[#D0DED8]/25 py-12 lg:py-16 border-b border-[#D0DED8]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="text-center max-w-2xl mx-auto mb-8 space-y-1">
          <div className="inline-flex items-center gap-1.5 text-xs font-bold text-[#588B76] uppercase tracking-widest font-mono">
            <span>Explore PCM</span>
          </div>
          <h2 className="font-serif text-2xl sm:text-3xl font-bold text-[#18392B]">
            GATEWAYS TO THEOLOGICAL EXCELLENCE
          </h2>
          <p className="text-xs sm:text-sm text-[#18392B]/80">
            Select an area below to discover our academic programs, admissions requirements, spiritual community, and kingdom resources.
          </p>
        </div>

        {/* 6 Grid Cards (High Density) */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {cards.map((c) => {
            const Icon = c.icon;
            return (
              <div
                key={c.id}
                onClick={c.action}
                className="group relative bg-white rounded-sm p-5 border border-[#D0DED8] hover:border-[#588B76] border-t-2 border-t-[#18392B] hover:border-t-[#588B76] shadow-xs hover:shadow-md transition-all duration-200 cursor-pointer flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <div className="w-10 h-10 rounded-sm bg-[#18392B] text-[#D0DED8] flex items-center justify-center group-hover:bg-[#588B76] group-hover:text-white transition-colors shadow-sm">
                      <Icon className="w-5 h-5" />
                    </div>
                    <span className="text-[10px] font-bold text-[#18392B] bg-[#D0DED8]/30 px-2 py-0.5 rounded-sm border border-[#D0DED8]">
                      {c.badge}
                    </span>
                  </div>

                  <h3 className="font-serif text-base font-bold text-[#18392B] group-hover:text-[#588B76] transition-colors">
                    {c.title}
                  </h3>

                  <p className="text-xs text-[#18392B]/75 mt-1.5 leading-relaxed">
                    {c.description}
                  </p>
                </div>

                <div className="pt-3 mt-3 border-t border-[#D0DED8]/60 flex items-center justify-between text-xs font-bold text-[#18392B] group-hover:text-[#588B76]">
                  <span>Discover More</span>
                  <ArrowUpRight className="w-4 h-4 transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform text-[#588B76]" />
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
};
