'use client';

import React, { useState } from 'react';
import { usePCM } from '@/lib/store';
import {
  GraduationCap,
  ShieldCheck,
  Globe,
  ChevronUp,
  ChevronDown,
  Sparkles,
} from 'lucide-react';

export const QuickViewSwitcher: React.FC = () => {
  const {
    currentSection,
    navigateTo,
    isStudentLoggedIn,
    setIsStudentLoggedIn,
    isAdminLoggedIn,
    setIsAdminLoggedIn,
  } = usePCM();

  const [isOpen, setIsOpen] = useState(true);

  const handleGoToPublic = () => {
    navigateTo('home');
  };

  const handleGoToStudentPortal = () => {
    setIsStudentLoggedIn(true);
    navigateTo('portal');
  };

  const handleGoToAdminCMS = () => {
    setIsAdminLoggedIn(true);
    navigateTo('admin');
  };

  return (
    <aside aria-label="Portal Quick Navigator" className="fixed bottom-4 right-4 z-50 font-sans shadow-2xl rounded-2xl border border-slate-700/60 bg-[#10261D]/95 backdrop-blur-md text-white p-2.5 transition-all max-w-[92vw] sm:max-w-xs">
      <div className="flex items-center justify-between gap-3 px-1 pb-1">
        <div className="flex items-center gap-1.5 text-xs font-bold text-[#A3D9C9]">
          <Sparkles className="w-3.5 h-3.5 text-amber-300" />
          <span>Portal Quick Navigator</span>
        </div>
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="text-slate-400 hover:text-white p-0.5 rounded cursor-pointer transition"
          title={isOpen ? 'Collapse' : 'Expand'}
        >
          {isOpen ? <ChevronDown className="w-4 h-4" /> : <ChevronUp className="w-4 h-4" />}
        </button>
      </div>

      {isOpen && (
        <div className="pt-2 space-y-1.5 border-t border-[#588B76]/30 text-xs">
          <button
            onClick={handleGoToPublic}
            className={`w-full flex items-center justify-between px-3 py-2 rounded-xl transition cursor-pointer font-medium ${
              currentSection === 'home'
                ? 'bg-emerald-600/30 text-emerald-300 border border-emerald-500/40 font-bold'
                : 'hover:bg-white/10 text-slate-300'
            }`}
          >
            <span className="flex items-center gap-2">
              <Globe className="w-3.5 h-3.5 text-emerald-400" />
              <span>Public Website</span>
            </span>
            {currentSection === 'home' && (
              <span className="text-[10px] bg-emerald-500 text-slate-950 font-bold px-1.5 py-0.2 rounded-full">
                Active
              </span>
            )}
          </button>

          <button
            onClick={handleGoToStudentPortal}
            className={`w-full flex items-center justify-between px-3 py-2 rounded-xl transition cursor-pointer font-medium ${
              currentSection === 'portal'
                ? 'bg-amber-500/30 text-amber-300 border border-amber-500/40 font-bold'
                : 'hover:bg-white/10 text-slate-300'
            }`}
          >
            <span className="flex items-center gap-2">
              <GraduationCap className="w-4 h-4 text-amber-400" />
              <span>Student Enrollment Hub</span>
            </span>
            {currentSection === 'portal' && (
              <span className="text-[10px] bg-amber-400 text-slate-950 font-bold px-1.5 py-0.2 rounded-full">
                Active
              </span>
            )}
          </button>

          <button
            onClick={handleGoToAdminCMS}
            className={`w-full flex items-center justify-between px-3 py-2 rounded-xl transition cursor-pointer font-medium ${
              currentSection === 'admin'
                ? 'bg-purple-500/30 text-purple-300 border border-purple-500/40 font-bold'
                : 'hover:bg-white/10 text-slate-300'
            }`}
          >
            <span className="flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-purple-400" />
              <span>Registrar Admin CMS</span>
            </span>
            {currentSection === 'admin' && (
              <span className="text-[10px] bg-purple-400 text-slate-950 font-bold px-1.5 py-0.2 rounded-full">
                Active
              </span>
            )}
          </button>
        </div>
      )}
    </aside>
  );
};
