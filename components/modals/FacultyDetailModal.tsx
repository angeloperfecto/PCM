'use client';

import React from 'react';
import { usePCM } from '@/lib/store';
import {
  X,
  GraduationCap,
  BookOpen,
  Mail,
  Award,
  CheckCircle2,
} from 'lucide-react';
import { FacultyPortrait } from '@/components/common/FacultyPortrait';

export const FacultyDetailModal: React.FC = () => {
  const { selectedFaculty, setSelectedFaculty, addToast } = usePCM();

  if (!selectedFaculty) return null;

  const handleContact = () => {
    addToast({
      title: 'Institutional Inquiry Sent',
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

          <div className="relative w-28 h-28 sm:w-32 sm:h-32 rounded-xl overflow-hidden border-2 border-[#588B76] shadow-lg shrink-0 bg-[#070e1c] flex items-center justify-center">
            <FacultyPortrait
              name={selectedFaculty.name}
              imageUrl={selectedFaculty.imageUrl}
              id={`modal-${selectedFaculty.id}`}
              sizes="128px"
            />
          </div>

          <div className="text-center sm:text-left space-y-1.5 flex-1">
            <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2">
              <span className="text-[10px] font-mono font-bold uppercase tracking-wider bg-[#588B76] text-[#18392B] px-2.5 py-0.5 rounded inline-block">
                {selectedFaculty.group || selectedFaculty.role}
              </span>
              <span className="text-[10px] font-mono font-semibold uppercase tracking-wider bg-white/10 text-slate-300 px-2 py-0.5 rounded inline-block">
                {selectedFaculty.role}
              </span>
            </div>
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
          {/* Degrees & Academic Qualifications */}
          {selectedFaculty.degrees && selectedFaculty.degrees.length > 0 && (
            <div className="space-y-3">
              <h4 className="font-serif text-base font-bold text-[#18392B] flex items-center gap-2">
                <GraduationCap className="w-4 h-4 text-[#588B76]" />
                <span>Degrees & Academic Qualifications</span>
              </h4>
              <div className="space-y-2 bg-[#F8FAF9] p-4 rounded-xl border border-[#D0DED8]">
                {selectedFaculty.degrees.map((deg, idx) => (
                  <div key={idx} className="flex items-start gap-2.5 text-xs text-slate-800 font-medium">
                    <CheckCircle2 className="w-4 h-4 text-[#588B76] shrink-0 mt-0.5" />
                    <span>{deg}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Subjects Taught / Disciplines */}
          {(selectedFaculty.subjectTaught || selectedFaculty.coursesTaught) && (
            <div className="space-y-3">
              <h4 className="font-serif text-base font-bold text-[#18392B] flex items-center gap-2">
                <BookOpen className="w-4 h-4 text-[#588B76]" />
                <span>Subjects Taught & Academic Areas</span>
              </h4>
              <div className="flex flex-wrap gap-2">
                {(selectedFaculty.subjectTaught || selectedFaculty.coursesTaught || []).map((c, idx) => (
                  <span
                    key={idx}
                    className="bg-[#FFFFFF] text-[#18392B] border border-[#D0DED8] text-xs px-3 py-1.5 rounded-lg font-medium shadow-xs"
                  >
                    {c}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Institutional Note / Biography */}
          <div className="space-y-2">
            <h4 className="font-serif text-base font-bold text-[#18392B] flex items-center gap-2">
              <Award className="w-4 h-4 text-[#588B76]" />
              <span>Institutional Profile & Designation</span>
            </h4>
            <p className="text-slate-600 leading-relaxed text-xs sm:text-sm bg-[#FFFFFF] p-4 rounded-xl border border-slate-200">
              {selectedFaculty.bio}
            </p>
          </div>

          {/* Academic Inquiries */}
          <div className="bg-[#18392B]/5 p-4 rounded-xl border border-[#588B76]/30 text-xs flex flex-col sm:flex-row items-center justify-between gap-4">
            <div>
              <span className="text-slate-500 block">Institutional Email:</span>
              <strong className="text-[#18392B] font-mono text-sm">{selectedFaculty.email}</strong>
            </div>
            <button
              onClick={handleContact}
              className="bg-[#18392B] hover:bg-[#588B76] hover:text-[#18392B] text-white font-semibold px-4 py-2 rounded-lg transition flex items-center gap-1.5 cursor-pointer shrink-0 w-full sm:w-auto justify-center"
            >
              <Mail className="w-3.5 h-3.5" />
              <span>Contact Office</span>
            </button>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="bg-slate-50 p-4 sm:px-8 border-t border-slate-200 flex justify-end">
          <button
            onClick={() => setSelectedFaculty(null)}
            className="text-xs font-semibold text-slate-600 hover:text-slate-900 transition cursor-pointer px-4 py-1.5"
          >
            Close Profile
          </button>
        </div>
      </div>
    </div>
  );
};
