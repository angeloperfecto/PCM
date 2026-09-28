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
  Users,
  Mail,
  Phone,
  MapPin,
  Calendar,
  Building,
  GraduationCap,
  MessageSquare,
  ExternalLink,
} from 'lucide-react';

export const AdmissionsView: React.FC = () => {
  const {
    navigateTo,
    setTuitionCalculatorModalOpen,
    setRequestInfoModalOpen,
    activeSubSection,
    currentSubSection,
  } = usePCM();

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

  const ADMISSION_OFFICERS = [
    {
      role: 'Director of Admissions & Church Relations',
      name: 'Rev. Nathan Valdez, M.Div.',
      department: 'Office of Admissions & Student Recruitment',
      email: 'admissions@pcm.ph',
      phone: '+63 917 582 1992',
      landline: '+63 74 422 2577 ext. 104',
      office: 'Room 102, Administration Building, Lamtang Campus',
      hours: 'Mon – Fri: 8:00 AM – 5:00 PM PHT',
      scope: 'Inquiries, student recruitment, provincial church endorsements, and admissions counseling.',
    },
    {
      role: 'Admissions Registrar & Document Evaluator',
      name: 'Sis. Grace Morales',
      department: 'Office of the College Registrar',
      email: 'registrar@pcm.ph',
      phone: '+63 74 422 2577 ext. 103',
      office: 'Room 101, Records & Registration Hall, Lamtang Campus',
      hours: 'Mon – Fri: 8:00 AM – 4:30 PM PHT',
      scope: 'Transcript evaluations, Form 138 verification, honorable dismissal, and enrollment clearance.',
    },
    {
      role: 'Admissions Committee Chair & Academic Dean',
      name: 'Rev. Dr. Emmanuel Santos',
      department: 'Office of the Academic Dean',
      email: 'dean@pcm.edu.ph',
      phone: '+63 74 422 2577 ext. 102',
      office: 'Dean\'s Office, 2nd Floor, Academic Wing',
      hours: 'Tue & Thu: 1:30 PM – 4:30 PM (By appointment)',
      scope: 'Formal ministerial calling interviews, academic assessment results, and admission approvals.',
    },
    {
      role: 'Financial Aid & Scholarship Coordinator',
      name: 'Ptr. Joshua Dela Cruz, B.Th.',
      department: 'Student Financial Aid Desk',
      email: 'scholarships@pcm.ph',
      phone: '+63 920 945 8812',
      landline: '+63 74 422 2577 ext. 105',
      office: 'Financial Aid Office, Administration Wing',
      hours: 'Mon – Fri: 9:00 AM – 4:00 PM PHT',
      scope: 'Ministerial scholarship grants, work-study assistantships, and local church matching funds.',
    },
    {
      role: 'Lamtang Campus Admissions Receptionist',
      name: 'Sis. Loida Batnag',
      department: 'Information & Visitor Center',
      email: 'info@pcm.ph',
      phone: '+63 74 422 2577',
      office: 'Main Reception Lobby, Lamtang Campus, La Trinidad, Benguet',
      hours: 'Mon – Sat: 8:00 AM – 12:00 PM & 1:00 PM – 5:00 PM PHT',
      scope: 'Campus visit check-in, brochure pickup, in-person test scheduling, and general directions.',
    },
  ];

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
            Empowering called men and women through affordable ministerial tuition, pastoral grants, and generous scholarship support.
          </p>

          <div className="pt-3 flex flex-wrap items-center justify-center gap-3">
            <button
              onClick={() => navigateTo('apply')}
              className="bg-[#588B76] hover:bg-[#46705F] text-white text-xs font-bold px-5 py-2.5 rounded-sm transition uppercase tracking-wider cursor-pointer shadow-md"
            >
              Start Online Application
            </button>
            <button
              onClick={() => {
                const el = document.getElementById('directory');
                if (el) el.scrollIntoView({ behavior: 'smooth' });
              }}
              className="bg-[#10261D] hover:bg-[#050b16] text-slate-200 text-xs font-semibold px-4 py-2.5 rounded-sm border border-[#588B76]/40 transition flex items-center gap-2 cursor-pointer"
            >
              <Users className="w-3.5 h-3.5 text-[#588B76]" />
              <span>Admission Directory</span>
            </button>
            <button
              onClick={() => setTuitionCalculatorModalOpen(true)}
              className="bg-[#10261D] hover:bg-[#050b16] text-slate-200 text-xs font-semibold px-4 py-2.5 rounded-sm border border-slate-700 transition flex items-center gap-2 cursor-pointer"
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

        {/* Sub-section 1: Admission Requirements (2 Columns) */}
        <section id="requirements" className="space-y-6 pt-8 border-t border-slate-200">
          <div className="text-center max-w-2xl mx-auto space-y-1">
            <span className="text-[11px] font-mono font-bold uppercase tracking-widest text-[#588B76]">
              Applicant Criteria
            </span>
            <h2 className="font-serif text-2xl sm:text-3xl font-extrabold text-[#18392B]">
              PROGRAM ADMISSION REQUIREMENTS
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-4xl mx-auto">
            {/* Degree Requirements */}
            <div className="bg-white rounded-sm p-6 border border-slate-200 shadow-xs space-y-4">
              <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
                <span className="text-xs font-mono font-bold uppercase bg-[#18392B] text-white px-2.5 py-1 rounded-sm">
                  Degree Admissions
                </span>
              </div>
              <h3 className="font-serif text-base font-bold text-[#18392B]">
                Bachelor of Arts in Theology (B.Th. 4-Year)
              </h3>
              <ul className="space-y-2.5 text-xs text-slate-700">
                {[
                  'Duly completed PCM Online Admissions Application',
                  'High School / Senior High School Graduate (or College Transferee Transcript)',
                  'Personal Christian Testimony of faith in Jesus Christ and ministerial calling',
                  'Official Recommendation Letter from your current home church pastor',
                  'Passing score in PCM Bible Knowledge and English Comprehension Assessment',
                  'Formal Admission Interview with the Faculty Admissions Committee',
                ].map((req, i) => (
                  <li key={i} className="flex items-start gap-2">
                    <CheckCircle2 className="w-4 h-4 text-[#588B76] shrink-0 mt-0.5" />
                    <span>{req}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Document Requirements */}
            <div className="bg-white rounded-sm p-6 border border-slate-200 shadow-xs space-y-4">
              <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
                <span className="text-xs font-mono font-bold uppercase bg-[#588B76] text-white px-2.5 py-1 rounded-sm">
                  Documentary Credentials
                </span>
              </div>
              <h3 className="font-serif text-base font-bold text-[#18392B]">
                Required Verification Documents
              </h3>
              <ul className="space-y-2.5 text-xs text-slate-700">
                {[
                  'Original PSA / NSO Birth Certificate (and 2 photocopies)',
                  'Form 138 (Report Card) or Official Transcript of Records (TOR) with S.O. number',
                  'Certificate of Good Moral Character from previous school or institution',
                  'Four (4) recent 2x2 colored ID pictures (white background with collar)',
                  'Medical Clearance Certificate from a licensed physician',
                  'Church Membership Certificate or Baptismal Record',
                ].map((req, i) => (
                  <li key={i} className="flex items-start gap-2">
                    <CheckCircle2 className="w-4 h-4 text-[#588B76] shrink-0 mt-0.5" />
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
                    <th className="p-3.5">Details / Scholarship Coverage</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-700">
                  <tr>
                    <td className="p-3.5 font-semibold text-[#18392B]">Bachelor of Arts in Theology (B.Th.) Tuition</td>
                    <td className="p-3.5 font-mono font-bold text-emerald-800">₱650 – ₱850 / unit</td>
                    <td className="p-3.5 text-slate-500">Standard full-load is 18–21 units per semester (subsidized by endowment)</td>
                  </tr>
                  <tr>
                    <td className="p-3.5 font-semibold text-[#18392B]">Ministerial Scholarship Grant (Needy Pastoral Candidates)</td>
                    <td className="p-3.5 font-mono font-bold text-emerald-700">Up to 100% Tuition Subsidy</td>
                    <td className="p-3.5 text-slate-500">Requires home church recommendation & work-study ministry commitment</td>
                  </tr>
                  <tr>
                    <td className="p-3.5 font-semibold text-[#18392B]">Registration & Basic Miscellaneous</td>
                    <td className="p-3.5 font-mono font-bold">₱2,500 / semester</td>
                    <td className="p-3.5 text-slate-500">Includes library catalog, campus facilities, and student insurance</td>
                  </tr>
                  <tr>
                    <td className="p-3.5 font-semibold text-[#18392B]">On-Campus Dormitory & Board</td>
                    <td className="p-3.5 font-mono font-bold">₱3,500 / month</td>
                    <td className="p-3.5 text-slate-500">Includes student dormitory bedspace and dining utilities in Lamtang</td>
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

        {/* Sub-section 4: ADMISSION DIRECTORY & RECRUITMENT DESK */}
        <section id="directory" className="space-y-8 pt-8 border-t border-slate-200">
          <div className="text-center max-w-2xl mx-auto space-y-1">
            <span className="text-[11px] font-mono font-bold uppercase tracking-widest text-[#588B76]">
              Admissions Directory & Key Contacts
            </span>
            <h2 className="font-serif text-2xl sm:text-3xl font-extrabold text-[#18392B]">
              OFFICIAL ADMISSION DIRECTORY
            </h2>
            <p className="text-xs text-slate-600 font-light">
              Connect directly with our admissions officers, credentials evaluators, academic interview mentors, and financial aid counselors.
            </p>
          </div>

          {/* Directory Personnel Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {ADMISSION_OFFICERS.map((officer, idx) => (
              <div
                key={idx}
                className="bg-white border border-slate-200 rounded-sm p-6 shadow-xs flex flex-col justify-between hover:border-[#588B76] transition space-y-4"
              >
                <div className="space-y-3">
                  <div className="flex items-start justify-between gap-2 border-b border-slate-100 pb-3">
                    <div>
                      <span className="text-[10px] font-mono font-bold uppercase text-[#588B76] tracking-wider block">
                        {officer.department}
                      </span>
                      <h3 className="font-serif font-bold text-base text-[#18392B] mt-0.5">
                        {officer.name}
                      </h3>
                      <p className="text-xs text-slate-600 font-medium">
                        {officer.role}
                      </p>
                    </div>
                    <div className="w-9 h-9 rounded-sm bg-[#18392B] text-white flex items-center justify-center shrink-0">
                      <Users className="w-4 h-4 text-[#588B76]" />
                    </div>
                  </div>

                  <p className="text-xs text-slate-600 leading-relaxed font-light">
                    {officer.scope}
                  </p>

                  <div className="space-y-2 text-xs text-slate-700 pt-1">
                    <div className="flex items-center gap-2">
                      <Mail className="w-3.5 h-3.5 text-[#588B76] shrink-0" />
                      <a
                        href={`mailto:${officer.email}`}
                        className="font-mono text-[11px] text-[#18392B] hover:text-[#588B76] hover:underline truncate"
                      >
                        {officer.email}
                      </a>
                    </div>

                    <div className="flex items-center gap-2">
                      <Phone className="w-3.5 h-3.5 text-[#588B76] shrink-0" />
                      <span className="font-mono text-[11px] text-slate-600">
                        {officer.phone || officer.landline}
                      </span>
                    </div>

                    <div className="flex items-start gap-2">
                      <MapPin className="w-3.5 h-3.5 text-[#588B76] shrink-0 mt-0.5" />
                      <span className="text-[11px] text-slate-600">
                        {officer.office}
                      </span>
                    </div>

                    <div className="flex items-start gap-2">
                      <Clock className="w-3.5 h-3.5 text-[#588B76] shrink-0 mt-0.5" />
                      <span className="text-[11px] text-slate-600">
                        {officer.hours}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="pt-3 border-t border-slate-100 flex items-center gap-2">
                  <a
                    href={`mailto:${officer.email}?subject=PCM%20Admissions%20Inquiry%20AY%202026-2027`}
                    className="flex-1 text-center bg-slate-100 hover:bg-[#18392B] hover:text-white text-slate-700 text-[11px] font-bold py-1.5 px-2 rounded-sm transition cursor-pointer"
                  >
                    Email Officer
                  </a>
                  <button
                    type="button"
                    onClick={() => setRequestInfoModalOpen(true)}
                    className="flex-1 text-center bg-[#588B76]/10 hover:bg-[#588B76] hover:text-white text-[#588B76] text-[11px] font-bold py-1.5 px-2 rounded-sm transition cursor-pointer"
                  >
                    Request Info
                  </button>
                </div>
              </div>
            ))}
          </div>

          {/* Central Admissions Office Hours & Fast Action Banner */}
          <div className="bg-[#18392B] text-white p-8 rounded-sm border border-[#588B76]/40 grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
            <div className="lg:col-span-8 space-y-3">
              <span className="text-[11px] font-mono font-bold uppercase tracking-widest text-[#588B76]">
                General Admissions Help Desk
              </span>
              <h3 className="font-serif text-2xl font-bold text-white">
                Need Help with Your Admissions Application?
              </h3>
              <p className="text-xs sm:text-sm text-slate-200 leading-relaxed font-light">
                Our Admissions Counselors are ready to walk you through degree selection, entrance assessment requirements, pastoral endorsement letters, and provincial accommodation options.
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 text-xs text-slate-300">
                <div className="flex items-center gap-2">
                  <Clock className="w-4 h-4 text-[#588B76] shrink-0" />
                  <span>Mon – Fri: 8:00 AM – 5:00 PM | Sat: 8:00 AM – 12:00 PM</span>
                </div>
                <div className="flex items-center gap-2">
                  <Phone className="w-4 h-4 text-[#588B76] shrink-0" />
                  <span>Hotline: +63 917 582 1992 / +63 74 422 2577</span>
                </div>
              </div>
            </div>

            <div className="lg:col-span-4 flex flex-col gap-3">
              <button
                onClick={() => navigateTo('apply')}
                className="w-full bg-[#588B76] hover:bg-[#46705F] text-white text-xs font-bold py-3 px-4 rounded-sm transition uppercase tracking-wider cursor-pointer shadow-md text-center"
              >
                Start Online Application
              </button>
              <button
                onClick={() => navigateTo('resources', 'downloads')}
                className="w-full bg-[#10261D] hover:bg-[#050b16] text-slate-200 text-xs font-semibold py-2.5 px-4 rounded-sm border border-[#588B76]/40 transition flex items-center justify-center gap-2 cursor-pointer"
              >
                <Download className="w-3.5 h-3.5 text-[#588B76]" />
                <span>Download Admission Forms</span>
              </button>
              <button
                onClick={() => navigateTo('contact')}
                className="w-full bg-transparent hover:bg-white/10 text-slate-200 text-xs font-semibold py-2 px-4 rounded-sm border border-slate-600 transition flex items-center justify-center gap-2 cursor-pointer"
              >
                <span>Schedule Campus Visit</span>
              </button>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
};
