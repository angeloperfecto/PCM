'use client';

import React, { useState, useMemo } from 'react';
import {
  ListPlus,
  Search,
  CheckCircle2,
  Clock,
  AlertCircle,
  BookOpen,
  Printer,
  Send,
  Trash2,
  Check,
  Info,
  Calendar,
  Layers,
  Sparkles,
} from 'lucide-react';
import { usePCM } from '@/lib/store';
import { AcademicSubject, PreEnlistmentRecord } from '@/lib/types';

export const PreEnlistmentModule: React.FC = () => {
  const {
    academicSubjects,
    preEnlistments,
    submitPreEnlistment,
    studentProfile,
    addToast,
  } = usePCM();

  // Find student's active pre-enlistment if any
  const existingRecord = preEnlistments.find(
    (p) => p.studentId === studentProfile.studentId && p.semester === '1st Semester'
  );

  // Selected subject IDs in current working draft
  const initialSelectedIds = useMemo(() => {
    if (existingRecord?.selectedSubjectCodes && existingRecord.selectedSubjectCodes.length > 0) {
      const codes = existingRecord.selectedSubjectCodes;
      return academicSubjects
        .filter((s) => codes.includes(s.code))
        .map((s) => s.id);
    }
    // Default to currently enrolled or standard 1st sem subjects
    const enrolledCodes = (studentProfile.courses || []).map((c) => c.code);
    const matched = academicSubjects.filter((s) => enrolledCodes.includes(s.code));
    return matched.length > 0 ? matched.map((s) => s.id) : academicSubjects.slice(0, 5).map((s) => s.id);
  }, [existingRecord, academicSubjects, studentProfile.courses]);

  const [selectedSubjectIds, setSelectedSubjectIds] = useState<string[]>(initialSelectedIds);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isPrintModalOpen, setIsPrintModalOpen] = useState(false);

  const MAX_UNITS = 21;

  // Filter subjects
  const filteredSubjects = useMemo(() => {
    return academicSubjects.filter((subj) => {
      const matchSearch =
        subj.code.toLowerCase().includes(searchQuery.toLowerCase()) ||
        subj.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        subj.instructor.toLowerCase().includes(searchQuery.toLowerCase());
      const matchCategory =
        selectedCategory === 'All' || subj.category === selectedCategory;
      return matchSearch && matchCategory;
    });
  }, [academicSubjects, searchQuery, selectedCategory]);

  // Selected subjects objects
  const selectedSubjects = useMemo(() => {
    return academicSubjects.filter((s) => selectedSubjectIds.includes(s.id));
  }, [academicSubjects, selectedSubjectIds]);

  const totalSelectedUnits = useMemo(() => {
    return selectedSubjects.reduce((sum, s) => sum + s.units, 0);
  }, [selectedSubjects]);

  const toggleSubject = (subjectId: string) => {
    const isSelected = selectedSubjectIds.includes(subjectId);
    const targetSubject = academicSubjects.find((s) => s.id === subjectId);

    if (!isSelected && targetSubject) {
      if (totalSelectedUnits + targetSubject.units > MAX_UNITS) {
        addToast(
          'warning',
          'Unit Limit Exceeded',
          `Cannot exceed ${MAX_UNITS} units for regular standing. Please drop a course first.`
        );
        return;
      }
      setSelectedSubjectIds([...selectedSubjectIds, subjectId]);
    } else {
      setSelectedSubjectIds(selectedSubjectIds.filter((id) => id !== subjectId));
    }
  };

  const handleSubmit = async () => {
    if (selectedSubjects.length === 0) {
      addToast('error', 'Selection Empty', 'Please select at least 1 course for pre-enlistment.');
      return;
    }

    setIsSubmitting(true);
    const recordPayload: Omit<PreEnlistmentRecord, 'id' | 'createdAt'> = {
      studentId: studentProfile.studentId,
      studentName: studentProfile.fullName,
      program: studentProfile.degreeProgram || studentProfile.program || 'Bachelor of Theology',
      degreeProgram: studentProfile.degreeProgram || studentProfile.program || 'Bachelor of Theology',
      yearLevel: studentProfile.yearLevel,
      academicYear: '2026–2027',
      semester: '1st Semester',
      selectedSubjectCodes: selectedSubjects.map((s) => s.code),
      totalUnits: totalSelectedUnits,
      status: 'Submitted',
      submittedAt: new Date().toISOString(),
      adminRemarks: 'Pending Academic Dean verification and prerequisite check.',
    };

    try {
      await submitPreEnlistment(recordPayload);
    } finally {
      setIsSubmitting(false);
    }
  };

  const categories = ['All', 'Biblical Studies', 'Theology', 'Pastoral Ministry', 'General Education'];

  return (
    <div id="pcm-pre-enlistment-module" className="space-y-6">
      {/* Header Banner */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-6 space-y-4">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-slate-100 pb-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="bg-purple-100 text-purple-800 text-[11px] font-mono font-bold px-2.5 py-0.5 rounded-md border border-purple-200">
                AY 2026–2027 • 1st Semester
              </span>
              <span className="text-slate-400 text-xs">•</span>
              <span className="text-xs font-semibold text-slate-600">
                Course Selection & Advising
              </span>
            </div>
            <h3 className="font-serif text-2xl font-bold text-[#18392B] mt-1">
              Online Pre-enlistment Portal
            </h3>
            <p className="text-xs text-slate-500">
              Select your required and elective subjects for the semester. Once submitted, your course load will be reviewed by the Dean of Academic Affairs.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={() => setIsPrintModalOpen(true)}
              className="bg-white hover:bg-slate-50 text-slate-700 border border-slate-300 font-semibold px-4 py-2.5 rounded-xl text-xs flex items-center gap-2 transition shadow-xs cursor-pointer"
            >
              <Printer className="w-4 h-4 text-purple-700" />
              <span>Print Advising Form</span>
            </button>

            <button
              onClick={handleSubmit}
              disabled={isSubmitting || selectedSubjects.length === 0}
              className={`font-bold px-5 py-2.5 rounded-xl text-xs flex items-center gap-2 transition shadow-sm cursor-pointer ${
                selectedSubjects.length === 0
                  ? 'bg-slate-200 text-slate-400 cursor-not-allowed'
                  : 'bg-[#6D28D9] hover:bg-purple-800 text-white'
              }`}
            >
              <Send className="w-4 h-4" />
              <span>
                {isSubmitting
                  ? 'Submitting...'
                  : existingRecord?.status === 'Submitted'
                  ? 'Update & Resubmit Pre-enlistment'
                  : 'Submit Pre-enlistment to Dean'}
              </span>
            </button>
          </div>
        </div>

        {/* Current Pre-enlistment Status Card */}
        <div className="bg-purple-50/60 rounded-xl p-4 border border-purple-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-3">
            <div
              className={`w-9 h-9 rounded-xl flex items-center justify-center ${
                existingRecord?.status === 'Approved'
                  ? 'bg-emerald-100 text-emerald-700'
                  : existingRecord?.status === 'Submitted'
                  ? 'bg-amber-100 text-amber-700'
                  : 'bg-purple-200 text-purple-800'
              }`}
            >
              {existingRecord?.status === 'Approved' ? (
                <CheckCircle2 className="w-5 h-5" />
              ) : existingRecord?.status === 'Submitted' ? (
                <Clock className="w-5 h-5" />
              ) : (
                <ListPlus className="w-5 h-5" />
              )}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-semibold text-slate-700">Pre-enlistment Status:</span>
                <span
                  className={`font-mono font-bold px-2 py-0.5 rounded text-[11px] ${
                    existingRecord?.status === 'Approved'
                      ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                      : existingRecord?.status === 'Submitted'
                      ? 'bg-amber-100 text-amber-800 border border-amber-300'
                      : 'bg-purple-100 text-purple-800 border border-purple-300'
                  }`}
                >
                  {existingRecord?.status || 'Draft (Working Selection)'}
                </span>
              </div>
              <p className="text-slate-600 text-[11px] mt-0.5">
                {existingRecord?.adminRemarks ||
                  'Your draft is ready. Review courses below and submit to request Dean approval.'}
              </p>
            </div>
          </div>

          <div className="font-mono text-right text-[11px] text-slate-500">
            {existingRecord?.submittedAt && (
              <div>Last Transmitted: {new Date(existingRecord.submittedAt).toLocaleDateString()}</div>
            )}
            {existingRecord?.reviewedBy && (
              <div className="text-purple-800 font-medium">Advisor: {existingRecord.reviewedBy}</div>
            )}
          </div>
        </div>

        {/* Units Load Tracker Progress */}
        <div className="space-y-1.5">
          <div className="flex justify-between items-center text-xs">
            <span className="font-semibold text-slate-700 flex items-center gap-1.5">
              <Layers className="w-3.5 h-3.5 text-purple-700" />
              Semester Academic Load
            </span>
            <span className="font-mono font-bold text-slate-900">
              <span className="text-purple-700 text-sm font-extrabold">{totalSelectedUnits}</span> / {MAX_UNITS} Units Maximum
            </span>
          </div>
          <div className="w-full bg-slate-100 rounded-full h-3 overflow-hidden">
            <div
              className={`h-3 rounded-full transition-all duration-300 ${
                totalSelectedUnits > MAX_UNITS
                  ? 'bg-rose-600'
                  : totalSelectedUnits >= 18
                  ? 'bg-emerald-600'
                  : 'bg-purple-600'
              }`}
              style={{ width: `${Math.min(100, (totalSelectedUnits / MAX_UNITS) * 100)}%` }}
            />
          </div>
          <div className="flex justify-between text-[11px] text-slate-500 font-mono">
            <span>Minimum Full-time: 12 Units</span>
            <span>Regular Capacity: 18–21 Units</span>
          </div>
        </div>
      </div>

      {/* Catalog Search & Category Filters */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-4 sm:p-5 space-y-4">
        <div className="flex flex-col sm:flex-row gap-3 items-center justify-between">
          <div className="relative w-full sm:w-80">
            <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Search by code, title, or instructor..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:bg-white focus:ring-2 focus:ring-purple-500 outline-none transition"
            />
          </div>

          <div className="flex items-center gap-1 overflow-x-auto w-full sm:w-auto no-scrollbar pb-1 sm:pb-0">
            {categories.map((cat) => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition ${
                  selectedCategory === cat
                    ? 'bg-purple-700 text-white shadow-xs'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>

        {/* Subjects Table */}
        <div className="border border-slate-200 rounded-xl overflow-hidden shadow-xs">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse min-w-[750px]">
              <thead>
                <tr className="bg-[#18392B] text-white">
                  <th className="p-3.5 w-12 text-center">Select</th>
                  <th className="p-3.5 font-bold">Course Code</th>
                  <th className="p-3.5 font-bold">Subject Title</th>
                  <th className="p-3.5 font-bold">Units</th>
                  <th className="p-3.5 font-bold">Prerequisite</th>
                  <th className="p-3.5 font-bold">Class Schedule</th>
                  <th className="p-3.5 font-bold">Room & Instructor</th>
                  <th className="p-3.5 font-bold text-center">Slots</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 text-slate-700">
                {filteredSubjects.map((subject) => {
                  const isChecked = selectedSubjectIds.includes(subject.id);
                  const isFull = (subject.enrolledCount || 0) >= subject.capacity;

                  return (
                    <tr
                      key={subject.id}
                      onClick={() => toggleSubject(subject.id)}
                      className={`cursor-pointer transition ${
                        isChecked
                          ? 'bg-purple-50/70 hover:bg-purple-100/50'
                          : 'hover:bg-slate-50'
                      }`}
                    >
                      <td className="p-3.5 text-center" onClick={(e) => e.stopPropagation()}>
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={() => toggleSubject(subject.id)}
                          className="w-4 h-4 text-purple-600 rounded border-slate-300 focus:ring-purple-500 cursor-pointer"
                        />
                      </td>
                      <td className="p-3.5 font-mono font-bold text-[#18392B]">
                        {subject.code}
                      </td>
                      <td className="p-3.5">
                        <div className="font-semibold text-slate-900">{subject.title}</div>
                        <span className="text-[10px] text-purple-700 bg-purple-50 px-1.5 py-0.5 rounded border border-purple-200">
                          {subject.category}
                        </span>
                      </td>
                      <td className="p-3.5 font-mono font-bold text-slate-900">
                        {subject.units} Units
                      </td>
                      <td className="p-3.5 text-slate-500 font-mono text-[11px]">
                        {subject.prerequisite || 'None'}
                      </td>
                      <td className="p-3.5">
                        <div className="font-medium text-slate-900">{subject.schedule}</div>
                      </td>
                      <td className="p-3.5">
                        <div className="text-slate-900 font-medium">{subject.room}</div>
                        <div className="text-slate-500 text-[11px]">{subject.instructor}</div>
                      </td>
                      <td className="p-3.5 text-center">
                        <span
                          className={`font-mono font-bold text-[11px] px-2 py-0.5 rounded ${
                            isFull
                              ? 'bg-rose-100 text-rose-800'
                              : 'bg-emerald-50 text-emerald-800'
                          }`}
                        >
                          {subject.enrolledCount || 0}/{subject.capacity}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Selected Subjects Summary Tray */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-6 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-3">
          <h4 className="font-serif text-lg font-bold text-[#18392B] flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-purple-700" />
            Pre-enlisted Courses Summary ({selectedSubjects.length} Courses)
          </h4>
          <span className="text-xs font-mono font-bold text-purple-900">
            Total Assessed Units: {totalSelectedUnits} Units
          </span>
        </div>

        {selectedSubjects.length === 0 ? (
          <div className="p-8 text-center text-slate-400 text-xs">
            No subjects selected. Click any row in the table above to pre-enlist.
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {selectedSubjects.map((s) => (
              <div
                key={s.id}
                className="bg-purple-50/50 p-3.5 rounded-xl border border-purple-200 flex items-start justify-between gap-2 text-xs"
              >
                <div className="space-y-1">
                  <span className="font-mono font-bold text-purple-900 bg-white px-1.5 py-0.5 rounded border border-purple-200 text-[10px]">
                    {s.code} • {s.units} Units
                  </span>
                  <div className="font-semibold text-slate-900 line-clamp-1">{s.title}</div>
                  <div className="text-[11px] text-slate-500">{s.schedule} • {s.room}</div>
                </div>
                <button
                  onClick={() => toggleSubject(s.id)}
                  title="Remove course"
                  className="text-slate-400 hover:text-rose-600 p-1 transition cursor-pointer"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Printable Pre-Enlistment Advising Modal */}
      {isPrintModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl max-w-2xl w-full p-6 space-y-6 shadow-2xl border border-slate-200 my-8">
            <div className="text-center border-b border-slate-200 pb-4 space-y-1">
              <div className="font-serif text-lg font-bold text-[#18392B] uppercase tracking-wider">
                Philippine College of Ministry
              </div>
              <p className="text-[11px] text-slate-500 font-serif">
                Lamtang, La Trinidad, Benguet • Office of Academic Affairs
              </p>
              <h3 className="font-serif text-xl font-bold text-purple-950 pt-2">
                Official Pre-Enlistment Advising Checklist
              </h3>
              <p className="text-xs text-slate-600">Academic Year 2026–2027 • 1st Semester</p>
            </div>

            <div className="grid grid-cols-2 gap-4 text-xs font-sans border-b border-slate-100 pb-3">
              <div>
                <span className="text-slate-400 block text-[10px] uppercase font-bold">Student Name</span>
                <strong className="text-slate-900 font-semibold">{studentProfile.fullName}</strong>
              </div>
              <div>
                <span className="text-slate-400 block text-[10px] uppercase font-bold">Official Student ID</span>
                <strong className="font-mono text-purple-900 font-bold">{studentProfile.studentId}</strong>
              </div>
              <div>
                <span className="text-slate-400 block text-[10px] uppercase font-bold">Degree Program</span>
                <strong className="text-slate-900">{studentProfile.degreeProgram}</strong>
              </div>
              <div>
                <span className="text-slate-400 block text-[10px] uppercase font-bold">Year Level & Standing</span>
                <strong className="text-slate-900">{studentProfile.yearLevel} • {studentProfile.academicStatus}</strong>
              </div>
            </div>

            <div className="space-y-2">
              <span className="text-xs font-bold text-slate-800">Approved Course Schedule:</span>
              <table className="w-full text-left text-xs border border-slate-200">
                <thead className="bg-slate-100 text-slate-700">
                  <tr>
                    <th className="p-2">Code</th>
                    <th className="p-2">Course Title</th>
                    <th className="p-2">Units</th>
                    <th className="p-2">Schedule</th>
                    <th className="p-2">Room</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {selectedSubjects.map((s) => (
                    <tr key={s.id}>
                      <td className="p-2 font-mono font-bold">{s.code}</td>
                      <td className="p-2">{s.title}</td>
                      <td className="p-2 font-mono">{s.units}</td>
                      <td className="p-2">{s.schedule}</td>
                      <td className="p-2">{s.room}</td>
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr className="bg-slate-50 font-bold">
                    <td colSpan={2} className="p-2 text-right">Total Units:</td>
                    <td colSpan={3} className="p-2 font-mono text-purple-900">{totalSelectedUnits} Units</td>
                  </tr>
                </tfoot>
              </table>
            </div>

            <div className="pt-8 grid grid-cols-2 gap-8 text-center text-xs">
              <div className="space-y-1">
                <div className="border-b border-slate-400 w-3/4 mx-auto pb-1 font-semibold text-slate-900">
                  {studentProfile.fullName}
                </div>
                <span className="text-[10px] text-slate-500 block">Student Signature over Printed Name</span>
              </div>

              <div className="space-y-1">
                <div className="border-b border-slate-400 w-3/4 mx-auto pb-1 font-semibold text-slate-900">
                  Dr. Jonathan Reyes, Th.D.
                </div>
                <span className="text-[10px] text-slate-500 block">Academic Dean / Registrar Signature</span>
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-4 border-t border-slate-100">
              <button
                onClick={() => setIsPrintModalOpen(false)}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100 transition cursor-pointer"
              >
                Close
              </button>
              <button
                onClick={() => {
                  window.print();
                  setIsPrintModalOpen(false);
                }}
                className="bg-[#18392B] hover:bg-[#588B76] text-white font-bold px-4 py-2 rounded-xl text-xs flex items-center gap-1.5 transition cursor-pointer"
              >
                <Printer className="w-4 h-4" />
                <span>Print Document</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
