'use client';

import React from 'react';
import { usePCM } from '@/lib/store';
import {
  GraduationCap,
  Sparkles,
  ArrowRight,
  ShieldCheck,
  CheckCircle2,
  Calendar,
  Clock,
} from 'lucide-react';

export const EnrollmentAnnouncementBanner: React.FC = () => {
  const { navigateTo, setIsStudentLoggedIn, setIsAdminLoggedIn } = usePCM();

  const handleOpenStudentHub = () => {
    setIsStudentLoggedIn(true);
    navigateTo('portal');
  };

  const handleOpenRegistrarCMS = () => {
    setIsAdminLoggedIn(true);
    navigateTo('admin');
  };

  return (
    <section className="w-full bg-linear-to-r from-[#18392B] via-[#204938] to-[#10261D] text-white py-6 px-4 border-y border-[#588B76]/30 shadow-md">
      <div className="max-w-7xl mx-auto flex flex-col lg:flex-row items-center justify-between gap-6">
        {/* Left message with badge */}
        <div className="space-y-2 text-center lg:text-left">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#A3D9C9]/20 text-[#A3D9C9] border border-[#A3D9C9]/30 text-xs font-semibold">
            <Sparkles className="w-3.5 h-3.5 text-amber-300" />
            <span>Academic Year 2026–2027 Enrollment is Officially Open</span>
          </div>

          <h3 className="font-serif text-xl sm:text-2xl font-bold tracking-tight text-white flex items-center justify-center lg:justify-start gap-2">
            <GraduationCap className="w-6 h-6 text-emerald-400 shrink-0" />
            <span>PCM Online Enrollment & Academic Portal</span>
          </h3>

          <p className="text-xs sm:text-sm text-slate-200 max-w-2xl leading-relaxed">
            New & returning students may now process course pre-enlistment, subject selection, tuition assessment, and Certificate of Registration (COR) verification online.
          </p>

          <div className="flex flex-wrap items-center justify-center lg:justify-start gap-4 text-[11px] text-[#A3D9C9] pt-1">
            <span className="flex items-center gap-1">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" /> Pre-Enlistment Active
            </span>
            <span className="flex items-center gap-1">
              <Calendar className="w-3.5 h-3.5 text-emerald-400" /> 1st Semester AY 2026–2027
            </span>
            <span className="flex items-center gap-1">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" /> CHED & DepEd Accredited
            </span>
          </div>
        </div>

        {/* Right Action Buttons */}
        <div className="flex flex-wrap items-center justify-center gap-3 shrink-0">
          <button
            onClick={handleOpenStudentHub}
            className="bg-amber-400 hover:bg-amber-300 text-slate-950 font-bold text-xs sm:text-sm px-5 py-3 rounded-xl shadow-lg transition flex items-center gap-2 cursor-pointer transform hover:-translate-y-0.5"
          >
            <GraduationCap className="w-4 h-4 text-slate-950" />
            <span>Open Student Enrollment Hub</span>
            <ArrowRight className="w-4 h-4" />
          </button>

          <button
            onClick={handleOpenRegistrarCMS}
            className="bg-white/10 hover:bg-white/20 border border-white/30 text-white font-semibold text-xs sm:text-sm px-4 py-3 rounded-xl shadow-sm transition flex items-center gap-2 cursor-pointer"
          >
            <ShieldCheck className="w-4 h-4 text-emerald-300" />
            <span>Open Registrar CMS (Admin)</span>
          </button>
        </div>
      </div>
    </section>
  );
};
