'use client';

import React, { useState } from 'react';
import {
  ArrowLeftRight,
  Plus,
  MinusCircle,
  Clock,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Info,
  Calendar,
  Send,
  X,
  FileCheck,
} from 'lucide-react';
import { usePCM } from '@/lib/store';
import { AddDropAction, AcademicSubject, StudentCourse } from '@/lib/types';

export const AddDropModule: React.FC = () => {
  const {
    studentProfile,
    academicSubjects,
    addDropRequests,
    submitAddDropRequest,
    addToast,
  } = usePCM();

  // Active student requests
  const studentRequests = addDropRequests.filter(
    (r) => r.studentId === studentProfile.studentId
  );

  // Active courses
  const enrolledCourses = (studentProfile.courses || []).filter(
    (c) => c.status !== 'Dropped'
  );

  // Courses available to add
  const enrolledCodes = enrolledCourses.map((c) => c.code);
  const availableToAdd = academicSubjects.filter(
    (s) => !enrolledCodes.includes(s.code)
  );

  // Modal state
  const [selectedAction, setSelectedAction] = useState<AddDropAction | null>(null);
  const [targetSubject, setTargetSubject] = useState<{
    code: string;
    title: string;
    units: number;
  } | null>(null);
  const [reason, setReason] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const openActionModal = (
    action: AddDropAction,
    subject: { code: string; title: string; units: number }
  ) => {
    setSelectedAction(action);
    setTargetSubject(subject);
    setReason('');
  };

  const closeActionModal = () => {
    setSelectedAction(null);
    setTargetSubject(null);
    setReason('');
  };

  const handleConfirmSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedAction || !targetSubject) return;

    if (!reason.trim()) {
      addToast('warning', 'Reason Required', 'Please provide a justification for adding/dropping this course.');
      return;
    }

    setIsSubmitting(true);
    try {
      await submitAddDropRequest({
        studentId: studentProfile.studentId,
        studentName: studentProfile.fullName,
        program: studentProfile.degreeProgram || studentProfile.program || 'Bachelor of Theology',
        degreeProgram: studentProfile.degreeProgram || studentProfile.program || 'Bachelor of Theology',
        action: selectedAction,
        subjectCode: targetSubject.code,
        subjectTitle: targetSubject.title,
        units: targetSubject.units,
        reason: reason.trim(),
        semester: '1st Semester',
        academicYear: '2026–2027',
      });
      closeActionModal();
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div id="pcm-add-drop-module" className="space-y-6">
      {/* Policy & Add/Drop Period Status Banner */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-6 space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-100 pb-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="bg-emerald-100 text-emerald-800 text-[11px] font-mono font-bold px-2.5 py-0.5 rounded-md border border-emerald-300 flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                Add/Drop Window: ACTIVE
              </span>
              <span className="text-slate-300">•</span>
              <span className="text-xs text-slate-500 font-mono">
                Valid: August 15 – September 05, 2026
              </span>
            </div>
            <h3 className="font-serif text-2xl font-bold text-[#18392B] mt-1">
              Course Adding & Dropping Management
            </h3>
            <p className="text-xs text-slate-500">
              Submit official subject adjustment requests for Academic Dean and Registrar evaluation. Dropping during this window incurs no academic penalty.
            </p>
          </div>

          <div className="bg-purple-50 border border-purple-200 px-4 py-3 rounded-xl text-xs space-y-0.5 max-w-xs">
            <span className="font-mono font-bold text-purple-900 block text-[10px] uppercase">
              Current Academic Load
            </span>
            <strong className="text-slate-900 text-sm block">
              {enrolledCourses.reduce((sum, c) => sum + (c.units || 0), 0)} Units Enrolled
            </strong>
            <span className="text-[11px] text-purple-700 block">
              {enrolledCourses.length} Registered Courses
            </span>
          </div>
        </div>

        <div className="flex items-start gap-2.5 text-xs text-slate-600 bg-slate-50 p-3.5 rounded-xl border border-slate-200/80">
          <Info className="w-4 h-4 text-purple-700 shrink-0 mt-0.5" />
          <p>
            <strong>Official PCM Policy:</strong> Adding a subject is subject to classroom capacity and prerequisite clearances. Dropping a subject removes the course from your active load and recalculates your semester assessment. All adjustments require Dean approval.
          </p>
        </div>
      </div>

      {/* Two Columns: Currently Enrolled (To Drop) & Available to Add */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Panel 1: Enrolled Courses (Drop Actions) */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-5 space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div>
              <h4 className="font-serif text-base font-bold text-[#18392B] flex items-center gap-2">
                <MinusCircle className="w-4 h-4 text-rose-600" />
                Currently Enrolled Courses
              </h4>
              <p className="text-[11px] text-slate-500">Select a course to request a formal drop</p>
            </div>
            <span className="text-xs font-mono text-slate-600 font-bold">
              {enrolledCourses.length} Subjects
            </span>
          </div>

          <div className="space-y-2.5">
            {enrolledCourses.map((c) => {
              const hasPendingDrop = studentRequests.some(
                (r) => r.subjectCode === c.code && r.action === 'Drop' && r.status === 'Pending'
              );

              return (
                <div
                  key={c.id || c.code}
                  className="p-3.5 rounded-xl border border-slate-200 bg-slate-50/60 flex items-center justify-between gap-3 text-xs hover:bg-slate-50 transition"
                >
                  <div className="space-y-0.5">
                    <div className="flex items-center gap-2">
                      <span className="font-mono font-bold text-[#18392B]">{c.code}</span>
                      <span className="text-[10px] font-mono text-slate-500">({c.units} Units)</span>
                    </div>
                    <div className="font-semibold text-slate-900">{c.title}</div>
                    <div className="text-[11px] text-slate-500">{c.schedule} • {c.room}</div>
                  </div>

                  {hasPendingDrop ? (
                    <span className="bg-amber-100 text-amber-800 text-[10px] font-mono font-bold px-2 py-1 rounded border border-amber-300">
                      Drop Pending
                    </span>
                  ) : (
                    <button
                      onClick={() => openActionModal('Drop', { code: c.code, title: c.title, units: c.units })}
                      className="bg-white hover:bg-rose-50 text-rose-700 border border-rose-200 font-semibold px-3 py-1.5 rounded-lg text-xs flex items-center gap-1 transition shadow-2xs cursor-pointer shrink-0"
                    >
                      <MinusCircle className="w-3.5 h-3.5" />
                      <span>Drop Course</span>
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Panel 2: Available Courses to Add */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-5 space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div>
              <h4 className="font-serif text-base font-bold text-[#18392B] flex items-center gap-2">
                <Plus className="w-4 h-4 text-emerald-600" />
                Available Courses to Add
              </h4>
              <p className="text-[11px] text-slate-500">Open subjects in the AY 26–27 catalog</p>
            </div>
            <span className="text-xs font-mono text-slate-600 font-bold">
              {availableToAdd.length} Available
            </span>
          </div>

          <div className="space-y-2.5 max-h-[460px] overflow-y-auto pr-1">
            {availableToAdd.map((s) => {
              const hasPendingAdd = studentRequests.some(
                (r) => r.subjectCode === s.code && r.action === 'Add' && r.status === 'Pending'
              );
              const isFull = (s.enrolledCount || 0) >= s.capacity;

              return (
                <div
                  key={s.id}
                  className="p-3.5 rounded-xl border border-slate-200 bg-slate-50/60 flex items-center justify-between gap-3 text-xs hover:bg-slate-50 transition"
                >
                  <div className="space-y-0.5">
                    <div className="flex items-center gap-2">
                      <span className="font-mono font-bold text-[#18392B]">{s.code}</span>
                      <span className="text-[10px] font-mono text-purple-800 bg-purple-50 px-1.5 py-0.2 rounded border border-purple-200">
                        {s.units} Units
                      </span>
                      <span className="text-[10px] text-slate-400 font-mono">
                        Slots: {s.enrolledCount || 0}/{s.capacity}
                      </span>
                    </div>
                    <div className="font-semibold text-slate-900">{s.title}</div>
                    <div className="text-[11px] text-slate-500">
                      {s.schedule} • {s.room} ({s.instructor})
                    </div>
                  </div>

                  {hasPendingAdd ? (
                    <span className="bg-amber-100 text-amber-800 text-[10px] font-mono font-bold px-2 py-1 rounded border border-amber-300">
                      Add Pending
                    </span>
                  ) : isFull ? (
                    <span className="bg-slate-200 text-slate-600 text-[10px] font-mono font-bold px-2 py-1 rounded">
                      Section Full
                    </span>
                  ) : (
                    <button
                      onClick={() => openActionModal('Add', { code: s.code, title: s.title, units: s.units })}
                      className="bg-white hover:bg-emerald-50 text-emerald-700 border border-emerald-300 font-semibold px-3 py-1.5 rounded-lg text-xs flex items-center gap-1 transition shadow-2xs cursor-pointer shrink-0"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>Add Course</span>
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Real-Time Request History & Status Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-6 space-y-4">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <h4 className="font-serif text-lg font-bold text-[#18392B] flex items-center gap-2">
            <Clock className="w-4 h-4 text-purple-700" />
            Adding & Dropping Applications History
          </h4>
          <span className="text-xs font-mono text-slate-500 font-semibold">
            {studentRequests.length} Total Requests Filed
          </span>
        </div>

        {studentRequests.length === 0 ? (
          <div className="p-8 text-center text-slate-400 text-xs">
            No add/drop requests submitted this semester.
          </div>
        ) : (
          <div className="border border-slate-200 rounded-xl overflow-hidden shadow-xs">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse min-w-[700px]">
                <thead>
                  <tr className="bg-[#18392B] text-white">
                    <th className="p-3 font-bold">Action</th>
                    <th className="p-3 font-bold">Subject Code</th>
                    <th className="p-3 font-bold">Course Title</th>
                    <th className="p-3 font-bold">Units</th>
                    <th className="p-3 font-bold">Justification Reason</th>
                    <th className="p-3 font-bold">Date Filed</th>
                    <th className="p-3 font-bold text-center">Status</th>
                    <th className="p-3 font-bold">Registrar Remarks</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 text-slate-700">
                  {studentRequests.map((req) => (
                    <tr key={req.id} className="hover:bg-slate-50 transition">
                      <td className="p-3">
                        <span
                          className={`font-mono font-bold text-[10px] px-2 py-0.5 rounded ${
                            req.action === 'Add'
                              ? 'bg-emerald-100 text-emerald-800'
                              : 'bg-rose-100 text-rose-800'
                          }`}
                        >
                          {req.action.toUpperCase()}
                        </span>
                      </td>
                      <td className="p-3 font-mono font-bold text-[#18392B]">{req.subjectCode}</td>
                      <td className="p-3 font-semibold text-slate-900">{req.subjectTitle}</td>
                      <td className="p-3 font-mono">{req.units}</td>
                      <td className="p-3 text-slate-600 max-w-[200px] truncate" title={req.reason}>
                        {req.reason}
                      </td>
                      <td className="p-3 font-mono text-slate-500">{req.dateSubmitted}</td>
                      <td className="p-3 text-center">
                        <span
                          className={`font-mono font-bold text-[10px] px-2 py-0.5 rounded ${
                            req.status === 'Approved'
                              ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                              : req.status === 'Rejected'
                              ? 'bg-rose-100 text-rose-800 border border-rose-300'
                              : 'bg-amber-100 text-amber-800 border border-amber-300'
                          }`}
                        >
                          {req.status}
                        </span>
                      </td>
                      <td className="p-3 text-[11px] text-slate-500">
                        {req.adminRemarks || 'Under Dean review'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      {/* Add / Drop Justification Modal */}
      {selectedAction && targetSubject && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 space-y-5 shadow-2xl border border-slate-200">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <div
                  className={`p-2 rounded-xl ${
                    selectedAction === 'Add'
                      ? 'bg-emerald-100 text-emerald-800'
                      : 'bg-rose-100 text-rose-800'
                  }`}
                >
                  {selectedAction === 'Add' ? <Plus className="w-4 h-4" /> : <MinusCircle className="w-4 h-4" />}
                </div>
                <div>
                  <h3 className="font-serif text-lg font-bold text-slate-900">
                    Request to {selectedAction} Course
                  </h3>
                  <span className="text-xs font-mono font-bold text-purple-900">
                    {targetSubject.code} ({targetSubject.units} Units)
                  </span>
                </div>
              </div>
              <button onClick={closeActionModal} className="text-slate-400 hover:text-slate-600 p-1">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 text-xs text-slate-700">
              <div className="font-semibold text-slate-900">{targetSubject.title}</div>
              <div className="text-slate-500 text-[11px] mt-0.5">
                Degree Program: {studentProfile.degreeProgram} • AY 2026–2027
              </div>
            </div>

            <form onSubmit={handleConfirmSubmit} className="space-y-4 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Reason / Academic Justification <span className="text-rose-500">*</span>
                </label>
                <textarea
                  required
                  rows={3}
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  placeholder="E.g., Schedule conflict with ministry practicum; or approved prerequisite load balancing by Academic Advisor..."
                  className="w-full p-3 bg-white border border-slate-300 rounded-xl text-slate-900 focus:ring-2 focus:ring-purple-500 outline-none resize-none"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={closeActionModal}
                  className="px-4 py-2 rounded-xl text-slate-600 hover:bg-slate-100 font-semibold transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className={`font-bold px-5 py-2 rounded-xl text-white transition flex items-center gap-1.5 shadow-sm ${
                    selectedAction === 'Add'
                      ? 'bg-emerald-700 hover:bg-emerald-800'
                      : 'bg-rose-700 hover:bg-rose-800'
                  }`}
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>{isSubmitting ? 'Submitting...' : `Submit ${selectedAction} Request`}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
