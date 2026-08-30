'use client';

import React from 'react';
import Image from 'next/image';
import { usePCM } from '@/lib/store';
import {
  X,
  GraduationCap,
  BookOpen,
  Mail,
  Award,
  Heart,
  Send,
} from 'lucide-react';

export const FacultyDetailModal: React.FC = () => {
  const { selectedFaculty, setSelectedFaculty, addToast } = usePCM();

  if (!selectedFaculty) return null;

  const handleContact = () => {
    addToast({
      title: 'Faculty Inquiries',
      message: `Your inquiry has been directed to the Office of Academic Affairs for ${selectedFaculty.name}.`,
      type: 'info',
    });
    setSelectedFaculty(null);
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-in fade-in duration-200">
      <div
        className="bg-white rounded-xl shadow-2xl border border-slate-200 max-w-2xl w-full max-h-[90vh] overflow-y-auto font-sans animate-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header with Photo & Credentials */}
        <div className="bg-[#18392B] text-white p-6 sm:p-8 flex flex-col sm:flex-row items-center sm:items-start gap-6 border-b border-[#588B76]/40 relative">
          <button
            onClick={() => setSelectedFaculty(null)}
            className="absolute top-4 right-4 text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition cursor-pointer"
            aria-label="Close"
          >
            <X className="w-5 h-5" />
          </button>

          <div className="relative w-28 h-28 sm:w-32 sm:h-32 rounded-xl overflow-hidden border-2 border-[#588B76] shadow-lg shrink-0">
            <Image
              src={selectedFaculty.imageUrl}
              alt={selectedFaculty.name}
              fill
              className="object-cover"
              sizes="128px"
              referrerPolicy="no-referrer"
            />
          </div>

          <div className="text-center sm:text-left space-y-1.5">
            <span className="text-[10px] font-mono font-bold uppercase tracking-wider bg-[#588B76] text-[#18392B] px-2.5 py-0.5 rounded inline-block">
              {selectedFaculty.role}
            </span>
            <h3 className="font-serif text-xl sm:text-2xl font-bold text-white">
              {selectedFaculty.name}
            </h3>
            <p className="text-xs font-semibold text-[#85AA9B]">
              {selectedFaculty.title}
            </p>
            <p className="text-xs text-slate-300 font-mono">
              {selectedFaculty.credentials}
            </p>
          </div>
        </div>

        {/* Content */}
        <div className="p-6 sm:p-8 space-y-6 text-slate-700 text-sm">
          {/* Biography */}
          <div className="space-y-2">
            <h4 className="font-serif text-base font-bold text-[#18392B] flex items-center gap-2">
              <Award className="w-4 h-4 text-[#588B76]" />
              <span>Academic & Ministerial Profile</span>
            </h4>
            <p className="text-slate-600 leading-relaxed text-xs sm:text-sm">
              {selectedFaculty.bio}
            </p>
          </div>

          {/* Courses Taught */}
          <div className="space-y-3">
            <h4 className="font-serif text-base font-bold text-[#18392B] flex items-center gap-2">
              <BookOpen className="w-4 h-4 text-[#588B76]" />
              <span>Teaching Disciplines & Syllabi</span>
            </h4>
            <div className="flex flex-wrap gap-2">
              {(selectedFaculty.coursesTaught || []).map((c, idx) => (
                <span
                  key={idx}
                  className="bg-[#FFFFFF] text-[#18392B] border border-slate-300 text-xs px-3 py-1.5 rounded-lg font-medium"
                >
                  {c}
                </span>
              ))}
            </div>
          </div>

          {/* Academic Inquiries */}
          <div className="bg-[#FFFFFF] p-4 rounded-xl border border-slate-200 text-xs flex items-center justify-between gap-4">
            <div>
              <span className="text-slate-500 block">Faculty Email Office:</span>
              <strong className="text-[#18392B] font-mono text-sm">{selectedFaculty.email}</strong>
            </div>
            <button
              onClick={handleContact}
              className="bg-[#18392B] hover:bg-[#588B76] hover:text-[#18392B] text-white font-semibold px-4 py-2 rounded transition flex items-center gap-1.5 cursor-pointer shrink-0"
            >
              <Mail className="w-3.5 h-3.5" />
              <span>Send Note</span>
            </button>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="bg-slate-50 p-4 sm:px-8 border-t border-slate-200 flex justify-end">
          <button
            onClick={() => setSelectedFaculty(null)}
            className="text-xs font-semibold text-slate-600 hover:text-slate-900 transition cursor-pointer"
          >
            Close Profile
          </button>
        </div>
      </div>
    </div>
  );
};
