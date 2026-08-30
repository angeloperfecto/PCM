'use client';

import React from 'react';
import { usePCM } from '@/lib/store';
import {
  BookOpen,
  Mountain,
  Award,
  Users,
  HeartHandshake,
  GraduationCap,
  Compass,
  ArrowRight,
  ShieldCheck,
  CheckCircle2,
  FileText,
  MapPin,
  Sparkles,
  PhoneCall,
  Clock,
  Briefcase,
} from 'lucide-react';

export const WhyChoosePCMView: React.FC = () => {
  const { navigateTo, setStatementOfFaithModalOpen, setRequestInfoModalOpen } = usePCM();

  const reasons = [
    {
      id: 'reason-1',
      title: 'Uncompromised Biblical & Doctrinal Fidelity',
      short: 'Rooted in God’s Inerrant Word',
      icon: BookOpen,
      desc: 'At Philippine College of Ministry, the 66 books of the Holy Bible are held as the verbally inspired, inerrant, authoritative Word of God. Every lecture, thesis, and homiletic exercise is anchored in sound grammatical-historical exegesis and historic Christian orthodoxy.',
      highlights: [
        'Rigorous original language training in Biblical Greek and Hebrew',
        'Systematic theology grounded in biblical exposition rather than human philosophy',
        'Commitment to the Stone-Campbell Restoration Movement heritage of simple New Testament Christianity',
      ],
    },
    {
      id: 'reason-2',
      title: 'Serene Cordillera Mountain Campus (Lamtang, Benguet)',
      short: 'An Atmosphere Conducive to Deep Study & Prayer',
      icon: Mountain,
      desc: 'Located along the cool, pine-covered mountain slopes of Lamtang, Puguis, La Trinidad, Benguet (just minutes from Baguio City), PCM provides a peaceful, distraction-free environment where students can focus on prayer, contemplation, fellowship, and serious intellectual study.',
      highlights: [
        'Cool, invigorating climate ideal for concentration and spiritual retreats',
        '7,500 square meter hillside campus overlooking lush mountain valleys',
        'Dedicated prayer rooms, amphitheater, and quiet library study decks',
      ],
    },
    {
      id: 'reason-3',
      title: 'Affordable Tuition & Government Voucher Support',
      short: 'Ministry Preparation Within Financial Reach',
      icon: Award,
      desc: 'We believe God’s call to ministry should never be hindered by insurmountable financial debt. PCM offers among the most affordable theological tuition rates in the Philippines, paired with generous pastoral grants and Senior High School DepEd voucher subsidies.',
      highlights: [
        'DepEd ESC / Government Voucher support for Senior High School GAS strand (free or minimal tuition)',
        'Pastoral Worker Grants for sons and daughters of pastors and missionaries',
        'On-campus work-study scholarships and church matching support programs',
      ],
    },
    {
      id: 'reason-4',
      title: 'Hands-On Pastoral Practicum & Field Apprenticeship',
      short: 'Theory Tested in Real-World Local Churches',
      icon: Briefcase,
      desc: 'Ministry is not learned solely in a lecture hall. Every PCM degree includes weekly supervised ministry practicum, pulpit supply opportunities, hospital and prison chaplaincy rotations, and cross-cultural church planting apprenticeships across northern Luzon.',
      highlights: [
        'Active network of 85+ partner churches in Baguio, Benguet, La Union, Pangasinan, and beyond',
        '300+ supervised practicum hours under seasoned pastoral mentors',
        'Regular community medical missions, evangelism treks, and youth leadership camps',
      ],
    },
    {
      id: 'reason-5',
      title: 'High Placement Rate & Global Alumni Network',
      short: 'Graduates Serving in Over 18 Countries',
      icon: GraduationCap,
      desc: 'Over 650+ PCM alumni currently serve as senior pastors, church planters, military and hospital chaplains, Bible college professors, and cross-cultural missionaries throughout the Philippines, Southeast Asia, North America, and the Middle East.',
      highlights: [
        'Over 90% of our graduates transition directly into active vocational or bi-vocational ministry',
        'Recognized by the Commission on Higher Education (CHED) and member of PABATS & PCEC',
        'Active lifelong alumni fellowship and continuing pastoral education conferences',
      ],
    },
    {
      id: 'reason-6',
      title: 'Caring, Close-Knit Christian Community & Mentorship',
      short: 'Faculty Who Walk Alongside You',
      icon: Users,
      desc: 'At PCM, you are not just a student number. Our faculty and resident staff live and worship on or near campus, eating meals with students, leading weekly discipleship pods, and providing one-on-one pastoral counseling for spiritual and personal growth.',
      highlights: [
        'Low student-to-faculty ratio ensuring personalized academic attention',
        'Weekly campus chapel worship, prayer days, and semestral spiritual retreats',
        'Family-oriented resident dormitories fostering lifelong ministry friendships',
      ],
    },
  ];

  return (
    <div className="w-full bg-[#FFFFFF] font-sans pb-16">
      {/* 1. HERO HEADER */}
      <section className="relative bg-[#18392B] text-white py-16 lg:py-20 px-4 lg:px-8 border-b-4 border-[#588B76] overflow-hidden">
        <div className="absolute inset-0 opacity-10 bg-[radial-gradient(#588B76_1px,transparent_1px)] [background-size:16px_16px]" />
        
        <div className="max-w-6xl mx-auto relative z-10 text-center">
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-[#10261D]/80 border border-[#588B76]/40 rounded-full text-xs font-semibold text-[#588B76] tracking-wider uppercase mb-4">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Discover the PCM Difference</span>
          </div>

          <h1 className="font-serif text-3xl sm:text-4xl lg:text-5xl font-bold tracking-tight text-white mb-4">
            Why Choose Philippine College of Ministry?
          </h1>

          <p className="text-slate-200 text-base sm:text-lg max-w-3xl mx-auto leading-relaxed font-light">
            Founded in 1992, PCM provides Christ-centered theological education, passionate spiritual formation, and practical pastoral training on our serene mountain campus in Benguet.
          </p>

          <div className="mt-8 flex flex-wrap items-center justify-center gap-4">
            <button
              id="btn-why-apply-now"
              onClick={() => navigateTo('apply')}
              className="bg-[#588B76] hover:bg-[#46705F] text-white font-bold text-sm px-6 py-3 rounded-sm shadow-md transition flex items-center gap-2 uppercase tracking-wider cursor-pointer"
            >
              <span>Apply for Admissions</span>
              <ArrowRight className="w-4 h-4" />
            </button>
            <button
              id="btn-why-request-info"
              onClick={() => setRequestInfoModalOpen(true)}
              className="bg-[#10261D] hover:bg-[#050b16] text-slate-200 font-semibold text-sm px-5 py-3 rounded-sm border border-[#588B76]/40 transition flex items-center gap-2 cursor-pointer"
            >
              <FileText className="w-4 h-4 text-[#588B76]" />
              <span>Request Info Packet</span>
            </button>
          </div>
        </div>
      </section>

      {/* 2. CORE INSTITUTIONAL PILLARS */}
      <section className="max-w-7xl mx-auto px-4 lg:px-8 py-12 lg:py-16">
        <div className="text-center mb-12">
          <h2 className="font-serif text-2xl sm:text-3xl font-bold text-[#18392B]">
            Six Distinctives of a PCM Theological Education
          </h2>
          <div className="w-16 h-1 bg-[#588B76] mx-auto mt-3 mb-4" />
          <p className="text-slate-600 max-w-2xl mx-auto text-sm leading-relaxed">
            Every aspect of life at PCM is designed to prepare men and women who love God passionately, handle Scripture accurately, and shepherd people selflessly.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-8">
          {reasons.map((r, idx) => {
            const Icon = r.icon;
            return (
              <div
                key={r.id}
                className="bg-white border border-slate-200 rounded-sm p-6 shadow-sm hover:shadow-md transition-all flex flex-col justify-between group relative overflow-hidden"
              >
                <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-[#18392B] to-[#588B76] opacity-0 group-hover:opacity-100 transition-opacity" />
                
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <div className="w-12 h-12 rounded-sm bg-[#18392B]/5 text-[#18392B] flex items-center justify-center border border-slate-200 group-hover:bg-[#18392B] group-hover:text-[#588B76] transition-colors">
                      <Icon className="w-6 h-6" />
                    </div>
                    <span className="text-xs font-serif font-bold text-[#588B76] bg-[#588B76]/10 px-2 py-0.5 rounded">
                      0{idx + 1}
                    </span>
                  </div>

                  <h3 className="font-serif text-lg font-bold text-[#18392B] mb-1 group-hover:text-[#588B76] transition-colors">
                    {r.title}
                  </h3>
                  <p className="text-xs font-semibold text-slate-700 italic mb-3">
                    {r.short}
                  </p>
                  <p className="text-xs text-slate-600 leading-relaxed mb-4">
                    {r.desc}
                  </p>

                  <div className="space-y-2 pt-3 border-t border-slate-100">
                    {r.highlights.map((h, i) => (
                      <div key={i} className="flex items-start gap-2 text-[11px] text-slate-700">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0 mt-0.5" />
                        <span>{h}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* 3. COMPARISON MATRIX / DISTINCTIVES TABLE */}
      <section className="bg-[#18392B]/5 border-y border-slate-200 py-12 px-4 lg:px-8">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-8">
            <h3 className="font-serif text-xl sm:text-2xl font-bold text-[#18392B]">
              At a Glance: The PCM Advantage
            </h3>
            <p className="text-slate-600 text-xs mt-1">
              How our balanced approach serves you from your first day through lifelong ministry
            </p>
          </div>

          <div className="bg-white rounded-sm border border-slate-200 shadow-sm overflow-hidden text-xs">
            <div className="grid grid-cols-3 bg-[#18392B] text-white p-3 font-semibold text-xs tracking-wide uppercase">
              <div>Dimension</div>
              <div>Typical Seminary Model</div>
              <div className="text-[#588B76]">PCM Experiential Model</div>
            </div>

            <div className="divide-y divide-slate-100">
              <div className="grid grid-cols-3 p-3.5 hover:bg-slate-50">
                <div className="font-semibold text-slate-900">Biblical Grounding</div>
                <div className="text-slate-600">Theoretical survey courses</div>
                <div className="text-[#18392B] font-medium">Original languages (Greek/Hebrew) + Expository preaching mastery</div>
              </div>
              <div className="grid grid-cols-3 p-3.5 hover:bg-slate-50 bg-slate-50/50">
                <div className="font-semibold text-slate-900">Campus Environment</div>
                <div className="text-slate-600">Congested urban setting</div>
                <div className="text-[#18392B] font-medium">Lamtang, Benguet mountain ridge with prayer cabins and pine groves</div>
              </div>
              <div className="grid grid-cols-3 p-3.5 hover:bg-slate-50">
                <div className="font-semibold text-slate-900">Practical Ministry</div>
                <div className="text-slate-600">Final semester internship</div>
                <div className="text-[#18392B] font-medium">Continuous weekly supervised practicum across 85+ partner churches</div>
              </div>
              <div className="grid grid-cols-3 p-3.5 hover:bg-slate-50 bg-slate-50/50">
                <div className="font-semibold text-slate-900">Financial Burden</div>
                <div className="text-slate-600">High tuition causing student debt</div>
                <div className="text-[#18392B] font-medium">Subsidized tuition, DepEd Senior High vouchers, and pastoral grants</div>
              </div>
              <div className="grid grid-cols-3 p-3.5 hover:bg-slate-50">
                <div className="font-semibold text-slate-900">Faculty Access</div>
                <div className="text-slate-600">Adjuncts with limited office hours</div>
                <div className="text-[#18392B] font-medium">Resident faculty mentoring in weekly chapel, dining hall, and prayer pods</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 4. STUDENT & ALUMNI VOICES */}
      <section className="max-w-6xl mx-auto px-4 lg:px-8 py-14">
        <div className="bg-[#18392B] text-white rounded-sm p-8 lg:p-10 relative overflow-hidden border border-[#588B76]/40">
          <div className="relative z-10 grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
            <div>
              <span className="text-[#588B76] font-serif text-sm font-semibold tracking-wider uppercase block mb-2">
                Alumni Testimony
              </span>
              <h3 className="font-serif text-2xl font-bold text-white mb-4">
                &quot;PCM did not just give me a diploma; it shaped my heart to love God&apos;s people.&quot;
              </h3>
              <p className="text-slate-300 text-xs leading-relaxed mb-6 font-light">
                &quot;The four years I spent in Lamtang wrestling with the Greek text, praying with fellow brothers on the mountain ridge, and preaching in Benguet churches gave me the tools and endurance needed for 15+ years of pastoral ministry.&quot;
              </p>
              <div>
                <p className="font-bold text-white text-sm">Pastor Joshua Mendoza</p>
                <p className="text-[#588B76] text-xs">B.Th. Class of 2011 | Senior Pastor & Church Planter</p>
              </div>
            </div>

            <div className="bg-[#10261D] p-6 rounded-sm border border-[#588B76]/30 space-y-4">
              <h4 className="font-serif text-base font-bold text-[#588B76] flex items-center gap-2">
                <ShieldCheck className="w-5 h-5 text-[#588B76]" />
                <span>Ready to Begin Your Journey?</span>
              </h4>
              <p className="text-xs text-slate-300 leading-relaxed">
                Whether you are finishing high school, sensing a mid-career calling into pastoral ministry, or seeking advanced theological grounding, PCM is here to equip you.
              </p>

              <div className="space-y-2 pt-2">
                <button
                  onClick={() => navigateTo('apply')}
                  className="w-full bg-[#588B76] hover:bg-[#46705F] text-white font-bold text-xs py-2.5 rounded-sm uppercase tracking-wider transition cursor-pointer text-center"
                >
                  Apply Online Now (AY 2026–2027)
                </button>
                <button
                  onClick={() => navigateTo('contact')}
                  className="w-full bg-[#18392B] hover:bg-[#15233b] text-slate-200 text-xs py-2.5 rounded-sm border border-slate-700 transition cursor-pointer text-center"
                >
                  Schedule a Campus Visit in Lamtang
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};
