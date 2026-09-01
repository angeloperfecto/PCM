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
  Compass,
} from 'lucide-react';
import { FacultyPortrait } from '@/components/common/FacultyPortrait';

export const AboutView: React.FC = () => {
  const { activeSubSection, currentSubSection, faculty, setSelectedFaculty, setStatementOfFaithModalOpen, navigateTo, siteConfig } = usePCM();
  const [activeCategory, setActiveCategory] = React.useState('all');
  const [searchQuery, setSearchQuery] = React.useState('');

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
            <h3 className="font-serif text-2xl font-bold text-white">
              {siteConfig?.missionVisionValues?.missionTitle || 'OUR MISSION'}
            </h3>
            <p className="text-xs sm:text-sm text-slate-200 leading-relaxed font-sans font-light">
              {siteConfig?.missionVisionValues?.missionStatement ||
                siteConfig?.missionVisionValues?.mission ||
                'To equip servant leaders through biblically sound, culturally relevant, and spirit-empowered training for pastoral leadership, church planting, and holistic ministry in the Cordillera, throughout the Philippines, and to the ends of the earth.'}
            </p>
          </div>

          <div className="bg-[#18392B] text-white rounded-sm p-8 border border-[#588B76]/40 shadow-md space-y-4">
            <div className="w-12 h-12 rounded-sm bg-white text-[#18392B] flex items-center justify-center font-bold">
              <Eye className="w-6 h-6" />
            </div>
            <h3 className="font-serif text-2xl font-bold text-white">
              {siteConfig?.missionVisionValues?.visionTitle || 'OUR VISION'}
            </h3>
            <p className="text-xs sm:text-sm text-slate-200 leading-relaxed font-sans font-light">
              {siteConfig?.missionVisionValues?.visionStatement ||
                siteConfig?.missionVisionValues?.vision ||
                'A premier theological institution producing godly, competent, and visionary Christian leaders who transform churches and communities for the glory of Jesus Christ.'}
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
              {siteConfig?.missionVisionValues?.valuesTitle || 'CORE VALUES OF PCM'}
            </h2>
            <p className="text-xs text-slate-600">
              {siteConfig?.missionVisionValues?.valuesSubtitle ||
                'The foundational convictions that guide our academic instruction, community life, and ministerial apprenticeship.'}
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {(siteConfig?.missionVisionValues?.coreValues && siteConfig.missionVisionValues.coreValues.length > 0
              ? siteConfig.missionVisionValues.coreValues
              : [
                  {
                    title: 'Christ-Centeredness',
                    description: 'Exalting Jesus Christ as Lord and Savior in all curricula, community worship, and personal life.',
                  },
                  {
                    title: 'Biblical Authority',
                    description: 'Uncompromising adherence to the inerrant Word of God as the supreme guide for faith, doctrine, and practice.',
                  },
                  {
                    title: 'Servant Leadership',
                    description: 'Cultivating humility, integrity, and sacrificial devotion to shepherding the flock of God.',
                  },
                  {
                    title: 'Evangelistic Zeal',
                    description: 'Active passion for soul-winning, aggressive church planting, and global cross-cultural missions.',
                  },
                ]
            ).map((val, idx) => {
              const icons = [Heart, BookOpen, Users, Flame, ShieldCheck, Target, Sparkles, Compass];
              const Icon = icons[idx % icons.length];
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
                      {val.description || (val as any).desc}
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
        <section id="faculty" className="space-y-8 pt-10 border-t border-slate-200">
          <div className="text-center max-w-3xl mx-auto space-y-3">
            <span className="text-[11px] font-mono font-bold uppercase tracking-widest text-[#588B76] bg-[#588B76]/10 px-3 py-1 rounded-full border border-[#588B76]/30">
              Institutional Governance & Academic Leadership
            </span>
            <h2 className="font-serif text-3xl sm:text-4xl font-extrabold text-[#18392B]">
              PCM BOARD OF TRUSTEES, FACULTY AND STAFF
            </h2>
            <p className="text-xs sm:text-sm text-slate-600 max-w-2xl mx-auto leading-relaxed">
              Authoritative directory of the Philippine College of Ministry Board of Trustees, institutional administrators, academic deans, teaching faculty, and administrative staff. Click any card to inspect full degrees and academic disciplines.
            </p>
          </div>

          {/* Directory Filter & Search */}
          {(() => {
            type DirectoryCategory = 'Board of Trustees' | 'Administration' | 'Faculty' | 'Staff' | 'Adjunct & Emeritus';

            const getMemberCategory = (f: any): DirectoryCategory => {
              const grp = (f.group || '').toLowerCase();
              const role = (f.role || '').toLowerCase();
              const title = (f.title || '').toLowerCase();
              const name = (f.name || '').toLowerCase();

              // 1. Primary Reference: Board of Trustees
              if (
                grp.includes('board') ||
                grp.includes('trustee') ||
                role.includes('board of trustee') ||
                role.includes('trustee') ||
                title.includes('board of trustee') ||
                title.includes('trustee') ||
                name.includes('laruta') ||
                name.includes('ali') ||
                name.includes('batuna') ||
                name.includes('aliba') ||
                name.includes('marquez') ||
                name.includes('suello') ||
                name.includes('hong') ||
                name.includes('dungo')
              ) {
                return 'Board of Trustees';
              }

              // 2. Emeritus & Adjunct
              if (
                grp.includes('emeritus') ||
                grp.includes('adjunct') ||
                role.includes('emeritus') ||
                role.includes('adjunct') ||
                title.includes('emeritus') ||
                title.includes('adjunct') ||
                name.includes('huckaba') ||
                name.includes('lubag')
              ) {
                return 'Adjunct & Emeritus';
              }

              // 3. Administration (President, Deans, Registrar, Business Administrator)
              if (
                grp === 'administration' ||
                grp === 'key administrators' ||
                role.includes('president') ||
                role.includes('business administrator') ||
                role.includes('academic dean') ||
                role.includes('dean of student') ||
                role.includes('registrar') ||
                title.includes('president') ||
                title.includes('business administrator') ||
                title.includes('academic dean') ||
                title.includes('dean of student') ||
                title.includes('registrar') ||
                name.includes('pasion') ||
                name.includes('cruz') ||
                name.includes('santos') ||
                name.includes('agayao') ||
                name.includes('cabalar')
              ) {
                return 'Administration';
              }

              // 4. Staff (Librarian, Finance Officers, Administrative Staff)
              if (
                grp === 'administrative staff' ||
                grp === 'staff' ||
                role.includes('librarian') ||
                role.includes('finance officer') ||
                role.includes('staff of finance') ||
                title.includes('librarian') ||
                title.includes('finance officer') ||
                title.includes('administrative office') ||
                name.includes('benalio, marlon') ||
                name.includes('marlon t. benalio') ||
                name.includes('virtudazo') ||
                name.includes('bacuyag')
              ) {
                return 'Staff';
              }

              // 5. Resident Faculty (Teaching Faculty, Professors, Course Facilitators)
              return 'Faculty';
            };

            const CATEGORY_TABS: { id: string; label: string; description: string }[] = [
              { id: 'all', label: 'All Directory', description: 'Complete Institutional Directory' },
              { id: 'Board of Trustees', label: 'Board of Trustees', description: 'Governing Board of Trustees' },
              { id: 'Administration', label: 'Administration', description: 'Institutional & Academic Leadership' },
              { id: 'Faculty', label: 'Faculty', description: 'Resident & Teaching Faculty' },
              { id: 'Staff', label: 'Staff', description: 'Administrative & Operational Staff' },
              { id: 'Adjunct & Emeritus', label: 'Adjunct & Emeritus', description: 'Emeritus Deans & Adjunct Professors' },
            ];

            const categorizedFaculty = [...faculty]
              .sort((a, b) => (a.order ?? 9999) - (b.order ?? 9999))
              .map((f) => ({
                ...f,
                calculatedCategory: getMemberCategory(f),
              }));

            const matchesSearch = (f: any) => {
              if (!searchQuery.trim()) return true;
              const q = searchQuery.toLowerCase();
              return (
                (f.name && f.name.toLowerCase().includes(q)) ||
                (f.title && f.title.toLowerCase().includes(q)) ||
                (f.role && f.role.toLowerCase().includes(q)) ||
                (f.department && f.department.toLowerCase().includes(q)) ||
                (f.credentials && f.credentials.toLowerCase().includes(q)) ||
                (f.calculatedCategory && f.calculatedCategory.toLowerCase().includes(q)) ||
                (f.degrees || []).some((d: string) => d.toLowerCase().includes(q)) ||
                (f.subjectTaught || []).some((s: string) => s.toLowerCase().includes(q)) ||
                (f.coursesTaught || []).some((c: string) => c.toLowerCase().includes(q))
              );
            };

            const filteredFaculty = categorizedFaculty.filter((f) => {
              if (activeCategory !== 'all' && f.calculatedCategory !== activeCategory) return false;
              return matchesSearch(f);
            });

            const categoriesToDisplay = activeCategory === 'all'
              ? (['Board of Trustees', 'Administration', 'Faculty', 'Staff', 'Adjunct & Emeritus'] as DirectoryCategory[])
              : [activeCategory as DirectoryCategory];

            return (
              <div className="space-y-8">
                {/* Directory Filter & Search */}
                <div className="flex flex-col md:flex-row items-center justify-between gap-4 bg-[#F8FAF9] p-4 rounded-xl border border-[#D0DED8]">
                  {/* Category Buttons */}
                  <div className="flex flex-wrap items-center gap-1.5 w-full md:w-auto">
                    {CATEGORY_TABS.map((tab) => {
                      const count = tab.id === 'all'
                        ? categorizedFaculty.length
                        : categorizedFaculty.filter((f) => f.calculatedCategory === tab.id).length;

                      return (
                        <button
                          key={tab.id}
                          onClick={() => setActiveCategory(tab.id)}
                          className={`text-xs font-semibold px-3.5 py-1.5 rounded-lg transition-all cursor-pointer ${
                            activeCategory === tab.id
                              ? 'bg-[#18392B] text-white shadow-xs'
                              : 'bg-white text-slate-700 hover:bg-[#D0DED8]/50 border border-slate-200'
                          }`}
                        >
                          <span>{tab.label}</span>
                          <span
                            className={`ml-1.5 text-[10px] font-mono px-1.5 py-0.2 rounded-full ${
                              activeCategory === tab.id ? 'bg-[#588B76] text-[#18392B] font-bold' : 'bg-slate-100 text-slate-500'
                            }`}
                          >
                            {count}
                          </span>
                        </button>
                      );
                    })}
                  </div>

                  {/* Search Input */}
                  <div className="w-full md:w-72">
                    <input
                      type="text"
                      placeholder="Search name, role, degree, or course..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="w-full bg-white border border-slate-300 rounded-lg px-3 py-1.5 text-xs text-slate-800 focus:outline-none focus:border-[#588B76] focus:ring-1 focus:ring-[#588B76]"
                    />
                  </div>
                </div>

                {/* Categorized Personnels Display */}
                {filteredFaculty.length === 0 ? (
                  <div className="text-center py-12 bg-[#F8FAF9] rounded-xl border border-[#D0DED8] space-y-2">
                    <p className="text-sm font-semibold text-slate-700">No personnel found matching &ldquo;{searchQuery}&rdquo;</p>
                    <button
                      onClick={() => {
                        setSearchQuery('');
                        setActiveCategory('all');
                      }}
                      className="text-xs text-[#588B76] hover:underline font-semibold"
                    >
                      Clear filters and view all
                    </button>
                  </div>
                ) : (
                  <div className="space-y-10">
                    {categoriesToDisplay.map((catKey) => {
                      const membersInCat = filteredFaculty.filter((f) => f.calculatedCategory === catKey);
                      if (membersInCat.length === 0) return null;

                      const catMeta = CATEGORY_TABS.find((t) => t.id === catKey);

                      return (
                        <div key={catKey} className="space-y-4">
                          {/* Category Header */}
                          <div className="flex items-center justify-between pb-2 border-b-2 border-[#18392B]/15">
                            <div className="flex items-center gap-2.5">
                              <span className="w-2.5 h-2.5 rounded-full bg-[#588B76]" />
                              <h3 className="font-serif text-lg sm:text-xl font-bold text-[#18392B]">
                                {catMeta?.label || catKey}
                              </h3>
                              <span className="text-[11px] font-mono font-bold text-[#588B76] bg-[#588B76]/10 px-2 py-0.5 rounded-full border border-[#588B76]/20">
                                {membersInCat.length}
                              </span>
                            </div>
                            <span className="text-xs text-slate-500 hidden sm:inline-block font-sans">
                              {catMeta?.description}
                            </span>
                          </div>

                          {/* Cards Grid */}
                          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                            {membersInCat.map((f) => (
                              <div
                                key={f.id}
                                onClick={() => setSelectedFaculty(f)}
                                className="bg-white rounded-xl p-5 border border-slate-200 hover:border-[#588B76] shadow-xs hover:shadow-md transition-all cursor-pointer flex flex-col justify-between group"
                              >
                                <div className="space-y-4">
                                  <div className="flex items-start gap-4">
                                    <div className="relative w-18 h-18 sm:w-20 sm:h-20 rounded-xl overflow-hidden border-2 border-[#588B76] shrink-0 bg-[#070e1c] flex items-center justify-center shadow-xs">
                                      <FacultyPortrait
                                        name={f.name}
                                        imageSrc={f.image || f.imageUrl}
                                        id={`dir-${f.id}`}
                                        sizes="80px"
                                        className="group-hover:scale-105 transition-transform duration-300"
                                      />
                                    </div>
                                    <div className="space-y-1 min-w-0 flex-1">
                                      <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-[#588B76] bg-[#588B76]/10 px-2 py-0.5 rounded border border-[#588B76]/20 inline-block truncate max-w-full">
                                        {f.calculatedCategory}
                                      </span>
                                      <h4 className="font-serif text-base font-bold text-[#18392B] group-hover:text-[#588B76] transition-colors leading-snug">
                                        {f.name}
                                      </h4>
                                      <p className="text-xs text-slate-700 font-semibold leading-tight">
                                        {f.role || f.title}
                                      </p>
                                    </div>
                                  </div>

                                  {/* Degrees & Subjects Preview */}
                                  <div className="space-y-2 pt-2 border-t border-slate-100 text-xs">
                                    {f.degrees && f.degrees.length > 0 && (
                                      <div className="space-y-1">
                                        <span className="text-[10px] font-mono font-bold text-slate-400 uppercase block">
                                          Academic Credentials
                                        </span>
                                        <div className="text-[11px] text-slate-600 line-clamp-2 leading-relaxed font-sans">
                                          {f.degrees.join(' • ')}
                                        </div>
                                      </div>
                                    )}

                                    {(f.subjectTaught || f.coursesTaught) && (
                                      <div className="flex flex-wrap gap-1 pt-1">
                                        {(f.subjectTaught || f.coursesTaught || []).slice(0, 2).map((subj: string, idx: number) => (
                                          <span
                                            key={idx}
                                            className="bg-[#F8FAF9] text-[#18392B] border border-[#D0DED8] text-[10px] px-2 py-0.5 rounded font-medium truncate max-w-full"
                                          >
                                            {subj}
                                          </span>
                                        ))}
                                        {(f.subjectTaught || f.coursesTaught || []).length > 2 && (
                                          <span className="text-[10px] font-mono text-[#588B76] font-bold self-center">
                                            +{(f.subjectTaught || f.coursesTaught || []).length - 2} more
                                          </span>
                                        )}
                                      </div>
                                    )}
                                  </div>
                                </div>

                                <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-[#18392B] group-hover:text-[#588B76] font-semibold">
                                  <span>View Academic Profile</span>
                                  <ArrowRight className="w-3.5 h-3.5 transform group-hover:translate-x-1 transition-transform" />
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })()}
        </section>
      </div>
    </div>
  );
};
