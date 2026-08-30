'use client';

import React from 'react';
import { usePCM } from '@/lib/store';
import { Target, Eye, ShieldCheck, Heart, Sparkles, BookOpen, Users, Compass } from 'lucide-react';

export const MissionVisionValuesSection: React.FC = () => {
  const { navigateTo } = usePCM();

  const coreValues = [
    { title: 'Biblical Faithfulness', desc: 'Unwavering commitment to the inerrancy and authority of Scripture.' },
    { title: 'Christ-Centeredness', desc: 'Exalting Jesus Christ in all doctrine, preaching, worship, and living.' },
    { title: 'Academic Excellence', desc: 'Rigorous exegesis, scholarship, and intellectual discipline.' },
    { title: 'Spiritual Formation', desc: 'Deep prayer, fasting, holy character, and fruit of the Spirit.' },
    { title: 'Servant Leadership', desc: 'Sacrificial, humble ministry patterned after Christ washing feet.' },
    { title: 'Moral Integrity', desc: 'Transparency, financial accountability, and spotless character.' },
    { title: 'Great Commission', desc: 'Passionate evangelism, urban church planting, and global missions.' },
    { title: 'Covenant Community', desc: 'Warm fellowship, accountability, and love in the body of Christ.' },
  ];

  return (
    <section className="w-full bg-[#18392B] text-white py-12 lg:py-16 border-b border-[#10261D]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto mb-10 space-y-2">
          <div className="inline-flex items-center gap-1.5 text-xs font-bold text-[#85AA9B] uppercase tracking-widest font-mono">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Institutional Foundations</span>
          </div>
          <h2 className="font-serif text-2xl sm:text-3xl font-bold text-white">
            MISSION, VISION & CORE VALUES
          </h2>
          <p className="text-xs sm:text-sm text-[#D0DED8]">
            The theological pillars, spiritual compass, and guiding principles of Philippines College of Ministry.
          </p>
        </div>

        {/* 3 Main Cards (High Density) */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* 1. OUR MISSION */}
          <div className="bg-[#10261D] rounded-sm p-6 border border-[#588B76]/50 shadow-md flex flex-col justify-between relative overflow-hidden group hover:border-[#85AA9B] transition-all duration-200">
            <div className="space-y-3">
              <div className="w-11 h-11 rounded-sm bg-[#588B76] text-white flex items-center justify-center shadow-sm font-bold">
                <Target className="w-6 h-6" />
              </div>
              <span className="text-[10px] font-mono font-bold tracking-widest text-[#85AA9B] uppercase block">
                Our Sacred Mandate
              </span>
              <h3 className="font-serif text-xl font-bold text-white">OUR MISSION</h3>
              <div className="w-10 h-0.5 bg-[#588B76]" />
              <p className="text-xs sm:text-sm text-[#D0DED8] leading-relaxed font-sans">
                To provide Christ-centered theological and ministry education that equips faithful servants with biblical truth, spiritual maturity, and practical competence for effective leadership, discipleship, and evangelistic service in the Church and society.
              </p>
            </div>
            <div className="mt-6 pt-3 border-t border-[#588B76]/40 text-xs text-[#85AA9B] font-bold">
              2 Timothy 2:2 • Matthew 28:19–20
            </div>
          </div>

          {/* 2. OUR VISION */}
          <div className="bg-[#10261D] rounded-sm p-6 border border-[#588B76]/50 shadow-md flex flex-col justify-between relative overflow-hidden group hover:border-[#85AA9B] transition-all duration-200">
            <div className="space-y-3">
              <div className="w-11 h-11 rounded-sm bg-[#588B76] text-white flex items-center justify-center shadow-sm font-bold">
                <Eye className="w-6 h-6" />
              </div>
              <span className="text-[10px] font-mono font-bold tracking-widest text-[#85AA9B] uppercase block">
                Our Future Horizon
              </span>
              <h3 className="font-serif text-xl font-bold text-white">OUR VISION</h3>
              <div className="w-10 h-0.5 bg-[#588B76]" />
              <p className="text-xs sm:text-sm text-[#D0DED8] leading-relaxed font-sans">
                To become a premier and globally trusted center for evangelical biblical education, spiritual formation, and kingdom leadership in the Philippines and Southeast Asia, raising up shepherds who transform generations for the glory of Jesus Christ.
              </p>
            </div>
            <div className="mt-6 pt-3 border-t border-[#588B76]/40 text-xs text-[#85AA9B] font-bold">
              Ephesians 4:11–13 • Habakkuk 2:14
            </div>
          </div>

          {/* 3. OUR VALUES */}
          <div className="bg-[#10261D] rounded-sm p-6 border border-[#588B76]/50 shadow-md flex flex-col justify-between relative overflow-hidden group hover:border-[#85AA9B] transition-all duration-200">
            <div className="space-y-3">
              <div className="w-11 h-11 rounded-sm bg-[#588B76] text-white flex items-center justify-center shadow-sm font-bold">
                <ShieldCheck className="w-6 h-6" />
              </div>
              <span className="text-[10px] font-mono font-bold tracking-widest text-[#85AA9B] uppercase block">
                Our Guiding Standards
              </span>
              <h3 className="font-serif text-xl font-bold text-white">OUR VALUES</h3>
              <div className="w-10 h-0.5 bg-[#588B76]" />
              
              <div className="grid grid-cols-2 gap-2 text-xs text-[#D0DED8] pt-1">
                {coreValues.map((v, i) => (
                  <div key={i} className="flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-[#85AA9B]" />
                    <span className="font-medium text-[#D0DED8] text-[11px]">{v.title}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="mt-6 pt-3 border-t border-[#588B76]/40 flex items-center justify-between">
              <button
                onClick={() => navigateTo('about', 'values')}
                className="text-xs text-[#85AA9B] hover:underline font-bold cursor-pointer"
              >
                Read detailed value descriptors →
              </button>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
