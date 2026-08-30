'use client';

import React from 'react';
import { usePCM } from '@/lib/store';
import {
  FileText,
  DollarSign,
  Award,
  CheckCircle2,
  HelpCircle,
  Calculator,
  ArrowRight,
  Download,
  Clock,
  ShieldCheck,
  Tag,
  BookOpen,
  Sparkles,
} from 'lucide-react';

export const AdmissionsView: React.FC = () => {
  const { navigateTo, setTuitionCalculatorModalOpen, setRequestInfoModalOpen, activeSubSection, currentSubSection } = usePCM();

  React.useEffect(() => {
    const sub = activeSubSection || currentSubSection;
    if (!sub) return;

    if (sub === 'why-pcm') {
      navigateTo('why-choose-pcm');
    } else {
      const el = document.getElementById(sub);
      if (el) {
        setTimeout(() => el.scrollIntoView({ behavior: 'smooth' }), 100);
      }
    }
  }, [activeSubSection, currentSubSection, navigateTo]);

  return (
    <div className="w-full bg-[#FFFFFF] font-sans pb-20">
      {/* Banner */}
      <div className="bg-[#18392B] text-white py-14 lg:py-20 border-b-4 border-[#588B76]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center space-y-3">
          <span className="text-[11px] font-mono font-bold uppercase tracking-widest text-[#588B76]">
            Admissions AY 2026–2027
          </span>
          <h1 className="font-serif text-3xl sm:text-4xl lg:text-5xl font-extrabold text-white">
            ADMISSIONS & FINANCIAL AID
          </h1>
          <p className="text-xs sm:text-sm text-slate-200 max-w-2xl mx-auto leading-relaxed font-sans font-light">
            Empowering called men and women through affordable tuition, DepEd Senior High vouchers, and generous pastoral scholarship grants.
          </p>

          <div className="pt-3 flex flex-wrap items-center justify-center gap-3">
            <button
              onClick={() => navigateTo('apply')}
              className="bg-[#588B76] hover:bg-[#46705F] text-white text-xs font-bold px-5 py-2.5 rounded-sm transition uppercase tracking-wider cursor-pointer shadow-md"
            >
              Start Online Application
            </button>
            <button
              onClick={() => setTuitionCalculatorModalOpen(true)}
              className="bg-[#10261D] hover:bg-[#050b16] text-slate-200 text-xs font-semibold px-4 py-2.5 rounded-sm border border-[#588B76]/40 transition flex items-center gap-2 cursor-pointer"
            >
              <Calculator className="w-3.5 h-3.5 text-[#588B76]" />
              <span>Tuition Calculator</span>
            </button>
            <button
              onClick={() => navigateTo('why-choose-pcm')}
              className="bg-[#10261D] hover:bg-[#050b16] text-slate-200 text-xs font-semibold px-4 py-2.5 rounded-sm border border-slate-700 transition flex items-center gap-2 cursor-pointer"
            >
              <span>Why Choose PCM</span>
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-12 space-y-16">
        {/* 4-Step Application Flow */}
        <section id="process" className="space-y-6">
          <div className="text-center max-w-2xl mx-auto space-y-1">
            <span className="text-[11px] font-mono font-bold uppercase tracking-widest text-[#588B76]">
              Straightforward Path
            </span>
            <h2 className="font-serif text-2xl sm:text-3xl font-extrabold text-[#18392B]">
              4-STEP APPLICATION PROCESS
            </h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              {
                step: '01',
                title: 'Online Application',
                desc: 'Fill out our secure digital application form or submit hard copies at our Lamtang campus.',
              },
              {
                step: '02',
                title: 'Document Submission',
                desc: 'Submit Form 138 / TOR, PSA birth certificate, pastor endorsement, and personal Christian testimony.',
              },
              {
                step: '03',
                title: 'Admissions Interview',
                desc: 'Meet with a faculty mentor for a pastoral conversation regarding your calling and spiritual formation.',
              },
              {
                step: '04',
                title: 'Enrollment & Orientation',
                desc: 'Receive official acceptance notification, register for courses, and attend convocation in Lamtang.',
              },
            ].map((s, idx) => (
              <div key={idx} className="bg-white border border-slate-200 p-6 rounded-sm shadow-xs relative">
                <div className="font-serif font-bold text-3xl text-[#588B76]/40 mb-2">{s.step}</div>
                <h3 className="font-serif text-base font-bold text-[#18392B] mb-1">{s.title}</h3>
                <p className="text-xs text-slate-600 leading-relaxed">{s.desc}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Sub-section 1: Admission Requirements (3 Columns) */}
        <section id="requirements" className="space-y-6 pt-8 border-t border-slate-200">
          <div className="text-center max-w-2xl mx-auto space-y-1">
            <span className="text-[11px] font-mono font-bold uppercase tracking-widest text-[#588B76]">
              Applicant Criteria
            </span>
            <h2 className="font-serif text-2xl sm:text-3xl font-extrabold text-[#18392B]">
              PROGRAM ADMISSION REQUIREMENTS
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Senior High School */}
            <div id="vouchers" className="bg-white rounded-sm p-6 border border-slate-200 shadow-xs space-y-4">
              <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
                <span className="text-xs font-mono font-bold uppercase bg-[#18392B] text-white px-2.5 py-1 rounded-sm">
                  Senior High (GAS)
                </span>
              </div>
              <h3 className="font-serif text-base font-bold text-[#18392B]">
                Grade 11 & 12 Applicants
              </h3>
              <ul className="space-y-2.5 text-xs text-slate-700">
                {[
                  'Junior High School Completion Certificate & Form 138 (Report Card)',
                  'DepEd ESC Voucher / QVR Certificate (100% or 80% coverage)',
                  'Certificate of Good Moral Character from Junior High School Principal',
                  'PSA Birth Certificate (Copy) & 2x2 ID Pictures',
                  'Parent / Guardian Endorsement & Consent Form',
                ].map((req, i) => (
                  <li key={i} className="flex items-start gap-2">
                    <CheckCircle2 className="w-4 h-4 text-[#588B76] shrink-0 mt-0.5" />
                    <span>{req}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Undergraduate */}
            <div className="bg-white rounded-sm p-6 border border-slate-200 shadow-xs space-y-4">
              <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
                <span className="text-xs font-mono font-bold uppercase bg-[#588B76] text-white px-2.5 py-1 rounded-sm">
                  Undergraduate
                </span>
              </div>
              <h3 className="font-serif text-base font-bold text-[#18392B]">
                B.Th., SCM & Associate Applicants
              </h3>
              <ul className="space-y-2.5 text-xs text-slate-700">
                {[
                  'Duly completed PCM Online Application Form',
                  'Senior High School Diploma / Form 138 or Official College Transcript if transferee',
                  'Personal Christian Testimony (500 words on salvation and ministry calling)',
                  'Recommendation Letter from current Local Church Pastor',
                  'PSA Birth Certificate & 2x2 ID Pictures',
                  'Satisfactory Entrance Interview with PCM Admissions Committee',
                ].map((req, i) => (
                  <li key={i} className="flex items-start gap-2">
                    <CheckCircle2 className="w-4 h-4 text-[#588B76] shrink-0 mt-0.5" />
                    <span>{req}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Graduate School */}
            <div className="bg-white rounded-sm p-6 border border-slate-200 shadow-xs space-y-4">
              <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
                <span className="text-xs font-mono font-bold uppercase bg-[#10261D] text-[#588B76] px-2.5 py-1 rounded-sm border border-[#588B76]/40">
                  Graduate School
                </span>
              </div>
              <h3 className="font-serif text-base font-bold text-[#18392B]">
                M.Div. & M.C.L. Applicants
              </h3>
              <ul className="space-y-2.5 text-xs text-slate-700">
                {[
                  'Bachelor’s Degree Transcript of Records from an accredited institution',
                  'Minimum of 2 years active pastoral or ministry leadership experience',
                  'Two Letters of Recommendation (1 Denominational Leader / 1 Colleague)',
                  'Theological Statement & Research Essay (750 words)',
                  'Comprehensive Graduate Interview with Academic Dean',
                ].map((req, i) => (
                  <li key={i} className="flex items-start gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                    <span>{req}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </section>

        {/* Sub-section 2: Tuition & Fees Schedule */}
        <section id="tuition" className="space-y-6 pt-8 border-t border-slate-200">
          <div className="text-center max-w-2xl mx-auto space-y-1">
            <span className="text-[11px] font-mono font-bold uppercase tracking-widest text-[#588B76]">
              Transparent & Affordable
            </span>
            <h2 className="font-serif text-2xl sm:text-3xl font-extrabold text-[#18392B]">
              TUITION & FEE SCHEDULE
            </h2>
          </div>

          <div className="bg-white rounded-sm border border-slate-200 overflow-hidden shadow-xs">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse min-w-[540px]">
                <thead>
                  <tr className="bg-[#18392B] text-white font-serif font-bold text-xs uppercase tracking-wider">
                    <th className="p-3.5">Academic Level / Item</th>
                    <th className="p-3.5">Tuition Rate (PHP)</th>
                    <th className="p-3.5">Details / Voucher Coverage</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-700">
                  <tr>
                    <td className="p-3.5 font-semibold text-[#18392B]">Senior High School (GAS Strand)</td>
                    <td className="p-3.5 font-mono font-bold text-emerald-700">100% DepEd Voucher Covered</td>
                    <td className="p-3.5 text-slate-500">No out-of-pocket tuition for qualified public Junior High completers</td>
                  </tr>
                  <tr>
                    <td className="p-3.5 font-semibold text-[#18392B]">Undergraduate Tuition (B.Th. / SCM / Assoc.)</td>
                    <td className="p-3.5 font-mono font-bold">₱650 – ₱850 / unit</td>
                    <td className="p-3.5 text-slate-500">Standard full-load is 18–21 units per semester</td>
                  </tr>
                  <tr>
                    <td className="p-3.5 font-semibold text-[#18392B]">Graduate School Tuition (M.Div. / M.C.L.)</td>
                    <td className="p-3.5 font-mono font-bold">₱1,200 – ₱1,400 / unit</td>
                    <td className="p-3.5 text-slate-500">Standard full-load is 9–12 units per semester</td>
                  </tr>
                  <tr>
                    <td className="p-3.5 font-semibold text-[#18392B]">Registration & Basic Miscellaneous</td>
                    <td className="p-3.5 font-mono font-bold">₱2,500 / semester</td>
                    <td className="p-3.5 text-slate-500">Includes library catalog, campus facilities, and student insurance</td>
                  </tr>
                  <tr>
                    <td className="p-3.5 font-semibold text-[#18392B]">On-Campus Dormitory & Board</td>
                    <td className="p-3.5 font-mono font-bold">₱3,500 / month</td>
                    <td className="p-3.5 text-slate-500">Includes student dormitory bedspace and dining utilities</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </section>

        {/* Sub-section 3: Scholarships & Grants */}
        <section id="scholarships" className="space-y-6 pt-8 border-t border-slate-200">
          <div className="text-center max-w-2xl mx-auto space-y-1">
            <span className="text-[11px] font-mono font-bold uppercase tracking-widest text-[#588B76]">
              Financial Assistance
            </span>
            <h2 className="font-serif text-2xl sm:text-3xl font-extrabold text-[#18392B]">
              SCHOLARSHIPS & MINISTERIAL GRANTS
            </h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {[
              {
                title: 'Pastoral Worker Grant',
                desc: '50% to 100% tuition discount for children and immediate dependents of full-time Christian pastors and active missionaries.',
                icon: Award,
              },
              {
                title: 'Work-Study Student Assistantship',
                desc: 'On-campus assistantship opportunities in the theological library, administration, and campus grounds offsetting tuition and dorm fees.',
                icon: DollarSign,
              },
              {
                title: 'Local Church Matching Fund',
                desc: 'PCM matches sponsorship support provided by endorsing local congregations and partner mission bodies.',
                icon: Sparkles,
              },
            ].map((sch, i) => {
              const Icon = sch.icon;
              return (
                <div key={i} className="bg-white border border-slate-200 p-6 rounded-sm shadow-xs flex flex-col justify-between">
                  <div>
                    <div className="w-10 h-10 bg-[#18392B]/5 text-[#18392B] flex items-center justify-center rounded-sm mb-3">
                      <Icon className="w-5 h-5 text-[#588B76]" />
                    </div>
                    <h3 className="font-serif text-base font-bold text-[#18392B] mb-1">{sch.title}</h3>
                    <p className="text-xs text-slate-600 leading-relaxed">{sch.desc}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      </div>
    </div>
  );
};
