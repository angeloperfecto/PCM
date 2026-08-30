'use client';

import React from 'react';
import Image from 'next/image';
import { usePCM } from '@/lib/store';
import {
  ShieldCheck,
  Target,
  Eye,
  Award,
  Users,
  BookOpen,
  Calendar,
  Heart,
  Flame,
  CheckCircle2,
  Mail,
  MapPin,
  Mountain,
  Sparkles,
  ArrowRight,
  ExternalLink,
  Phone,
} from 'lucide-react';

export const AboutView: React.FC = () => {
  const { activeSubSection, currentSubSection, faculty, setSelectedFaculty, setStatementOfFaithModalOpen, navigateTo } = usePCM();

  React.useEffect(() => {
    const sub = activeSubSection || currentSubSection;
    if (sub === 'faith') {
      setStatementOfFaithModalOpen(true);
    } else if (sub) {
      const targetId = sub === 'leadership' ? 'faculty' : sub;
      const el = document.getElementById(targetId);
      if (el) {
        setTimeout(() => {
          el.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }, 100);
      }
    }
  }, [activeSubSection, currentSubSection, setStatementOfFaithModalOpen]);

  return (
    <div className="w-full bg-[#FFFFFF] font-sans pb-20">
      {/* Page Header Banner */}
      <div className="bg-[#18392B] text-white py-14 lg:py-20 border-b-4 border-[#588B76]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center space-y-3">
          <span className="text-[11px] font-mono font-bold uppercase tracking-widest text-[#588B76]">
            About Philippine College of Ministry
          </span>
          <h1 className="font-serif text-3xl sm:text-4xl lg:text-5xl font-extrabold text-white">
            EQUIPPING SERVANTS. TRANSFORMING LIVES.
          </h1>
          <p className="text-xs sm:text-sm text-slate-200 max-w-2xl mx-auto leading-relaxed font-sans font-light">
            Founded on June 12, 1992 in Baguio City and permanently located in Lamtang, Benguet. Dedicated to biblical inerrancy, academic rigour, spiritual holiness, and pastoral leadership.
          </p>

          <div className="pt-3 flex flex-wrap items-center justify-center gap-3">
            <button
              onClick={() => navigateTo('why-choose-pcm')}
              className="bg-[#588B76] hover:bg-[#46705F] text-white text-xs font-bold px-4 py-2 rounded-sm transition uppercase tracking-wider cursor-pointer"
            >
              Why Choose PCM
            </button>
            <button
              onClick={() => setStatementOfFaithModalOpen(true)}
              className="bg-[#10261D] hover:bg-[#050b16] text-slate-200 text-xs font-semibold px-4 py-2 rounded-sm border border-[#588B76]/40 transition flex items-center gap-2 cursor-pointer"
            >
              <ShieldCheck className="w-3.5 h-3.5 text-[#588B76]" />
              <span>Statement of Faith</span>
            </button>
            <button
              onClick={() => navigateTo('scrapbook')}
              className="bg-[#10261D] hover:bg-[#050b16] text-slate-200 text-xs font-semibold px-4 py-2 rounded-sm border border-slate-700 transition flex items-center gap-2 cursor-pointer"
            >
              <span>PCM Scrapbook</span>
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-12 space-y-16">
        {/* Sub-section 1: Overview & Heritage */}
        <section id="about-us" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-center">
            <div className="lg:col-span-6 space-y-4 text-slate-700 text-xs sm:text-sm leading-relaxed">
              <div className="inline-flex items-center gap-1.5 text-xs font-bold text-[#588B76] uppercase tracking-widest font-mono">
                <Mountain className="w-4 h-4" />
                <span>Our Heritage & Identity</span>
              </div>
              <h2 className="font-serif text-2xl sm:text-3xl font-extrabold text-[#18392B]">
                A CHRIST-CENTERED EVANGELICAL BIBLE COLLEGE
              </h2>
              <p>
                <strong>Philippine College of Ministry (PCM)</strong> is a non-denominational evangelical institution affiliated with the <strong>Christian Churches / Churches of Christ</strong> and the historic <strong>Stone-Campbell Restoration Movement</strong>.
              </p>
              <p>
                We are dedicated to simple New Testament Christianity, the inerrant authority of Holy Scripture, and the preparation of passionate pastors, church planters, teachers, chaplains, and cross-cultural missionaries for the Philippines, Southeast Asia, and beyond.
              </p>
              <p>
                Recognized by the <strong>Commission on Higher Education (CHED)</strong> and affiliated with the <strong>Philippine Association of Bible and Theological Schools (PABATS)</strong> and the <strong>Philippine Council of Evangelical Churches (PCEC)</strong>, PCM pairs scholastic rigor with practical weekly ministry across 85+ partner congregations.
              </p>
              <div className="pt-2 flex flex-wrap gap-3">
                <button
                  onClick={() => setStatementOfFaithModalOpen(true)}
                  className="bg-[#18392B] hover:bg-[#10261D] text-white text-xs font-bold px-4 py-2.5 rounded-sm transition inline-flex items-center gap-2 cursor-pointer shadow"
                >
                  <ShieldCheck className="w-4 h-4 text-[#588B76]" />
                  <span>View 12-Article Doctrinal Basis</span>
                </button>
              </div>
            </div>

            <div className="lg:col-span-6">
              <div className="rounded-sm overflow-hidden shadow-md border border-slate-200 bg-white">
                <div className="relative h-72 w-full bg-slate-800">
                  <Image
                    src="https://images.unsplash.com/photo-1541829070764-84a7d30dd3f3?q=80&w=1000&auto=format&fit=crop"
                    alt="PCM Lamtang Campus, Benguet"
                    fill
                    className="object-cover"
                    sizes="(max-width: 1024px) 100vw, 50vw"
                    referrerPolicy="no-referrer"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-60" />
                  <div className="absolute bottom-3 left-3 text-white">
                    <span className="text-[10px] font-mono uppercase bg-[#588B76] px-2 py-0.5 rounded font-bold">Lamtang Campus</span>
                    <h4 className="font-serif text-sm font-bold mt-1">Lamtang, Puguis, La Trinidad, Benguet</h4>
                  </div>
                </div>
                <div className="p-4 bg-[#18392B] text-white text-xs flex justify-between items-center border-t border-[#588B76]/40">
                  <span>7,500 sqm Hillside Mountain Campus</span>
                  <span className="font-mono text-[#588B76]">Founded June 12, 1992</span>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Sub-section 2: Mission & Vision */}
        <section id="vision-mission" className="grid grid-cols-1 md:grid-cols-2 gap-8 pt-8 border-t border-slate-200">
          <div className="bg-[#18392B] text-white rounded-sm p-8 border border-[#588B76]/40 shadow-md space-y-4">
            <div className="w-12 h-12 rounded-sm bg-[#588B76] text-[#18392B] flex items-center justify-center font-bold">
              <Target className="w-6 h-6" />
            </div>
            <h3 className="font-serif text-2xl font-bold text-white">OUR MISSION</h3>
            <p className="text-xs sm:text-sm text-slate-200 leading-relaxed font-sans font-light">
              To equip servant leaders through biblically sound, culturally relevant, and spirit-empowered training for pastoral leadership, church planting, and holistic ministry in the Cordillera, throughout the Philippines, and to the ends of the earth.
            </p>
          </div>

          <div className="bg-[#18392B] text-white rounded-sm p-8 border border-[#588B76]/40 shadow-md space-y-4">
            <div className="w-12 h-12 rounded-sm bg-white text-[#18392B] flex items-center justify-center font-bold">
              <Eye className="w-6 h-6" />
            </div>
            <h3 className="font-serif text-2xl font-bold text-white">OUR VISION</h3>
            <p className="text-xs sm:text-sm text-slate-200 leading-relaxed font-sans font-light">
              A premier theological institution producing godly, competent, and visionary Christian leaders who transform churches and communities for the glory of Jesus Christ.
            </p>
          </div>
        </section>

        {/* Sub-section 3: Core Values & Pillars */}
        <section id="values" className="space-y-6 pt-8 border-t border-slate-200">
          <div className="text-center max-w-2xl mx-auto space-y-2">
            <span className="text-[11px] font-mono font-bold uppercase tracking-widest text-[#588B76]">
              Institutional Pillars
            </span>
            <h2 className="font-serif text-2xl sm:text-3xl font-extrabold text-[#18392B]">
              CORE VALUES OF PCM
            </h2>
            <p className="text-xs text-slate-600">
              The foundational convictions that guide our academic instruction, community life, and ministerial apprenticeship.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              {
                title: 'Christ-Centeredness',
                desc: 'Exalting Jesus Christ as Lord and Savior in all curricula, community worship, and personal life.',
                icon: Heart,
              },
              {
                title: 'Biblical Authority',
                desc: 'Uncompromising adherence to the inerrant Word of God as the supreme guide for faith, doctrine, and practice.',
                icon: BookOpen,
              },
              {
                title: 'Servant Leadership',
                desc: 'Cultivating humility, integrity, and sacrificial devotion to shepherding the flock of God.',
                icon: Users,
              },
              {
                title: 'Evangelistic Zeal',
                desc: 'Active passion for soul-winning, aggressive church planting, and global cross-cultural missions.',
                icon: Flame,
              },
            ].map((val, idx) => {
              const Icon = val.icon;
              return (
                <div
                  key={idx}
                  className="bg-white border border-slate-200 p-5 rounded-sm shadow-xs hover:border-[#588B76] transition-all flex flex-col justify-between"
                >
                  <div>
                    <div className="w-10 h-10 bg-[#18392B]/5 text-[#18392B] flex items-center justify-center rounded-sm mb-3">
                      <Icon className="w-5 h-5 text-[#588B76]" />
                    </div>
                    <h3 className="font-serif text-base font-bold text-[#18392B] mb-1">
                      {val.title}
                    </h3>
                    <p className="text-xs text-slate-600 leading-relaxed">
                      {val.desc}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        {/* Sub-section 4: Historical Milestones */}
        <section id="history" className="space-y-6 pt-8 border-t border-slate-200">
          <div className="text-center max-w-2xl mx-auto space-y-1">
            <span className="text-[11px] font-mono font-bold uppercase tracking-widest text-[#588B76]">
              34+ Years of God&apos;s Faithfulness
            </span>
            <h2 className="font-serif text-2xl sm:text-3xl font-extrabold text-[#18392B]">
              HISTORICAL TIMELINE & MILESTONES
            </h2>
            <p className="text-xs text-slate-600">
              The providential journey of Philippine College of Ministry from 1992 to the present day.
            </p>
          </div>

          <div className="space-y-4 max-w-3xl mx-auto">
            {[
              {
                year: 'June 12, 1992',
                title: 'Founding of PCM in Baguio City',
                desc: 'Founded on Philippine Independence Day under the leadership of Rev. Samson Lubag, beginning with a dedicated cohort of pioneer ministerial candidates.',
              },
              {
                year: '1992 – 1995',
                title: 'Classes at #22 T. Alonzo Street',
                desc: 'Initial classes, chapel gatherings, and theological library established at #22 T. Alonzo St., Baguio City.',
              },
              {
                year: '1995 – 2005',
                title: 'Expansion to Ruff Hause Hotel',
                desc: 'Moved to larger facilities at Ruff Hause Hotel, #10 Rimando Road, Baguio City, accommodating growing undergraduate student enrollment.',
              },
              {
                year: 'December 2002',
                title: 'Acquisition of 7,500 sqm Property in Lamtang',
                desc: 'By God’s providence and sacrificial international partner support, PCM purchased 7,500 square meters of scenic hillside land in Lamtang, Puguis, La Trinidad, Benguet.',
              },
              {
                year: 'June 13, 2005',
                title: 'Official Dedication & Move to Permanent Campus',
                desc: 'Classes and dormitories officially transferred to the permanent Lamtang mountain campus, opening state-of-the-art academic halls, dormitories, and chapel facilities.',
              },
              {
                year: '2016 – Present',
                title: 'Senior High School (GAS) & Specialized Chaplaincy (SCM)',
                desc: 'Added Senior High School General Academic Strand with DepEd voucher support and BTh Specialized Chaplaincy Ministry, serving over 85+ partner churches.',
              },
            ].map((m, idx) => (
              <div key={idx} className="flex gap-4 items-start bg-white p-4 rounded-sm border border-slate-200 shadow-xs">
                <span className="font-mono text-xs font-extrabold text-[#18392B] bg-[#588B76]/20 px-2.5 py-1 rounded-sm border border-[#588B76]/40 shrink-0">
                  {m.year}
                </span>
                <div>
                  <h4 className="font-serif text-sm font-bold text-[#18392B]">{m.title}</h4>
                  <p className="text-xs text-slate-600 mt-0.5 leading-relaxed">{m.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Sub-section 5: Leadership & Faculty Directory */}
        <section id="faculty" className="space-y-6 pt-8 border-t border-slate-200">
          <div className="text-center max-w-2xl mx-auto space-y-2">
            <span className="text-[11px] font-mono font-bold uppercase tracking-widest text-[#588B76]">
              Pioneer & Faculty Leadership
            </span>
            <h2 className="font-serif text-2xl sm:text-3xl font-extrabold text-[#18392B]">
              FACULTY & ADMINISTRATIVE DIRECTORY
            </h2>
            <p className="text-xs text-slate-600">
              Click any faculty mentor to inspect their full biographical profile, credentials, and courses taught.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {faculty.map((f) => (
              <div
                key={f.id}
                onClick={() => setSelectedFaculty(f)}
                className="bg-white rounded-sm p-5 border border-slate-200 hover:border-[#588B76] shadow-xs hover:shadow-md transition-all cursor-pointer flex flex-col justify-between group"
              >
                <div className="flex items-start gap-4">
                  <div className="relative w-16 h-16 rounded-sm overflow-hidden border border-[#588B76] shrink-0 bg-slate-800">
                    <Image
                      src={f.imageUrl}
                      alt={f.name}
                      fill
                      className="object-cover"
                      sizes="64px"
                      referrerPolicy="no-referrer"
                    />
                  </div>
                  <div>
                    <span className="text-[10px] font-mono font-bold uppercase text-[#588B76] block">
                      {f.role}
                    </span>
                    <h4 className="font-serif text-sm font-bold text-[#18392B] group-hover:text-[#588B76] transition-colors leading-snug">
                      {f.name}
                    </h4>
                    <p className="text-xs text-slate-600 leading-tight mt-0.5 font-medium">
                      {f.title}
                    </p>
                    <p className="text-[11px] text-slate-400 font-mono mt-1">
                      {f.credentials}
                    </p>
                  </div>
                </div>

                <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-[#18392B] group-hover:text-[#588B76] font-semibold">
                  <span>View Full Profile</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </div>
              </div>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
};
