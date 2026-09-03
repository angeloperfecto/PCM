'use client';

import React, { useState } from 'react';
import { usePCM } from '@/lib/store';
import { OnlineEnrollment, EnrollmentStatus } from '@/lib/types';
import { Emblem } from '@/components/common/Emblem';
import {
  GraduationCap,
  Search,
  CheckCircle2,
  Clock,
  XCircle,
  AlertCircle,
  FileCheck,
  RotateCcw,
  Eye,
  Printer,
  Check,
  X,
  MessageSquare,
  Ban,
  FileText,
  DollarSign,
  Calendar,
  BookOpen,
} from 'lucide-react';

export const EnrollmentWorkflowAdminView: React.FC = () => {
  const {
    enrollments,
    approveEnrollment,
    returnEnrollmentForCorrection,
    rejectEnrollment,
    cancelEnrollment,
    reopenEnrollment,
    deleteEnrollment,
    canPerformEnrollmentAction,
    addToast,
  } = usePCM();

  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');

  // Modals
  const [selectedEnrollment, setSelectedEnrollment] = useState<OnlineEnrollment | null>(null);
  const [viewingCorEnrollment, setViewingCorEnrollment] = useState<OnlineEnrollment | null>(null);

  // Return for Correction Modal
  const [isReturnModalOpen, setIsReturnModalOpen] = useState(false);
  const [returnTargetId, setReturnTargetId] = useState('');
  const [returnFeedback, setReturnFeedback] = useState('');

  // Cancel Enrollment Modal
  const [isCancelModalOpen, setIsCancelModalOpen] = useState(false);
  const [cancelTargetId, setCancelTargetId] = useState('');
  const [cancelReason, setCancelReason] = useState('');

  const filteredEnrollments = enrollments.filter((e) => {
    const query = searchQuery.toLowerCase();
    const matchesSearch =
      (e.studentName || '').toLowerCase().includes(query) ||
      (e.studentId || '').toLowerCase().includes(query) ||
      (e.referenceNumber || '').toLowerCase().includes(query) ||
      (e.programTitle || e.programName || '').toLowerCase().includes(query);

    const matchesStatus = statusFilter === 'all' || e.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const handleApprove = async (enrollment: OnlineEnrollment) => {
    const success = await approveEnrollment(enrollment.id);
    if (success && selectedEnrollment?.id === enrollment.id) {
      setSelectedEnrollment(null);
    }
  };

  const handleOpenReturnModal = (enrollment: OnlineEnrollment) => {
    setReturnTargetId(enrollment.id);
    setReturnFeedback(enrollment.rejectionReason || 'Please review your document submissions or course schedule.');
    setIsReturnModalOpen(true);
  };

  const handleSubmitReturn = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!returnTargetId) return;
    await returnEnrollmentForCorrection(returnTargetId, returnFeedback);
    setIsReturnModalOpen(false);
    if (selectedEnrollment?.id === returnTargetId) {
      setSelectedEnrollment(null);
    }
  };

  const handleOpenCancelModal = (enrollment: OnlineEnrollment) => {
    setCancelTargetId(enrollment.id);
    setCancelReason('Student requested withdrawal or failed to submit credentials.');
    setIsCancelModalOpen(true);
  };

  const handleSubmitCancel = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!cancelTargetId) return;
    await cancelEnrollment(cancelTargetId, cancelReason);
    setIsCancelModalOpen(false);
    if (selectedEnrollment?.id === cancelTargetId) {
      setSelectedEnrollment(null);
    }
  };

  const handleReopen = async (enrollmentId: string) => {
    await reopenEnrollment(enrollmentId);
  };

  return (
    <div className="space-y-5">
      {/* Header & Controls */}
      <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h3 className="font-serif font-bold text-lg text-slate-900 flex items-center gap-2">
              <GraduationCap className="w-5 h-5 text-[#18392B]" />
              <span>Official Enrollment Processing Queue</span>
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Review course schedules, tuition estimates, approve registrations, and issue official Certificates of Registration (COR).
            </p>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs bg-slate-100 text-slate-700 px-3 py-1.5 rounded-lg font-mono">
              Total Queue: <strong>{enrollments.length}</strong>
            </span>
          </div>
        </div>

        {/* Search & Filter Bar */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mt-4 pt-4 border-t border-slate-100">
          <div className="sm:col-span-2 relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              placeholder="Search by student name, ID #, Ref #, or degree..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-2 text-xs rounded-lg border border-slate-200 focus:outline-none focus:ring-1 focus:ring-[#18392B]"
            />
          </div>

          <div>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full px-3 py-2 text-xs rounded-lg border border-slate-200 focus:outline-none focus:ring-1 focus:ring-[#18392B] bg-white text-slate-700"
            >
              <option value="all">All Processing Statuses</option>
              <option value="Submitted">Submitted (Needs Action)</option>
              <option value="Under Review">Under Review</option>
              <option value="Approved">Approved (COR Issued)</option>
              <option value="Returned for Correction">Returned for Correction</option>
              <option value="Cancelled">Cancelled</option>
              <option value="Rejected">Rejected</option>
            </select>
          </div>
        </div>
      </div>

      {/* Enrollments Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-600">
            <thead className="bg-slate-50 text-slate-700 font-semibold border-b border-slate-200">
              <tr>
                <th className="py-3 px-4">Student & Reference #</th>
                <th className="py-3 px-4">Program & Term</th>
                <th className="py-3 px-4">Units & Tuition</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4">Date Filed</th>
                <th className="py-3 px-4 text-center">COR Document</th>
                <th className="py-3 px-4 text-center">Registrar Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredEnrollments.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-400">
                    <GraduationCap className="w-8 h-8 mx-auto mb-2 opacity-40" />
                    <p className="font-medium text-sm">No enrollment applications found</p>
                    <p className="text-xs text-slate-400 mt-0.5">When students submit formal enrollment, their dossiers appear here.</p>
                  </td>
                </tr>
              ) : (
                filteredEnrollments.map((enrollment) => {
                  return (
                    <tr key={enrollment.id} className="hover:bg-slate-50/70 transition">
                      <td className="py-3 px-4">
                        <div className="font-semibold text-slate-900">{enrollment.studentName}</div>
                        <div className="text-[11px] text-slate-500 font-mono">
                          ID: <span className="font-bold text-[#18392B]">{enrollment.studentId}</span> &bull;{' '}
                          Ref: {enrollment.referenceNumber}
                        </div>
                      </td>

                      <td className="py-3 px-4">
                        <div className="font-medium text-slate-900">
                          {enrollment.programTitle || enrollment.programName}
                        </div>
                        <div className="text-[11px] text-slate-500">
                          {enrollment.academicYear} &bull; {enrollment.semester} ({enrollment.yearLevel})
                        </div>
                      </td>

                      <td className="py-3 px-4 font-mono">
                        <div className="font-bold text-slate-900">
                          {enrollment.totalUnits || (enrollment.subjects || []).reduce((a, b) => a + (b.units || 0), 0)} Units
                        </div>
                        <div className="text-[11px] text-emerald-700 font-semibold">
                          ₱{(enrollment.tuitionEstimate || enrollment.totalAssessment || 0).toLocaleString()}
                        </div>
                      </td>

                      <td className="py-3 px-4">
                        <span
                          className={`inline-block text-[10px] px-2.5 py-0.5 rounded-full font-semibold border ${
                            enrollment.status === 'Approved'
                              ? 'bg-emerald-100 text-emerald-800 border-emerald-300'
                              : enrollment.status === 'Returned for Correction'
                              ? 'bg-amber-100 text-amber-800 border-amber-300'
                              : enrollment.status === 'Cancelled'
                              ? 'bg-slate-100 text-slate-700 border-slate-300'
                              : enrollment.status === 'Rejected'
                              ? 'bg-rose-100 text-rose-800 border-rose-300'
                              : 'bg-blue-100 text-blue-800 border-blue-300'
                          }`}
                        >
                          {enrollment.status}
                        </span>
                      </td>

                      <td className="py-3 px-4 text-slate-500">
                        {new Date(enrollment.dateSubmitted || enrollment.submittedAt || Date.now()).toLocaleDateString()}
                      </td>

                      <td className="py-3 px-4 text-center">
                        <button
                          onClick={() => setViewingCorEnrollment(enrollment)}
                          title="View Official Certificate of Registration (COR)"
                          className="px-2 py-1 rounded bg-slate-100 hover:bg-[#18392B] hover:text-white text-slate-700 text-[11px] font-semibold transition cursor-pointer inline-flex items-center gap-1"
                        >
                          <FileText className="w-3.5 h-3.5" />
                          <span>View COR</span>
                        </button>
                      </td>

                      <td className="py-3 px-4">
                        <div className="flex items-center justify-center gap-1.5">
                          {/* Inspect Modal */}
                          <button
                            title="Inspect Application"
                            onClick={() => setSelectedEnrollment(enrollment)}
                            className="p-1.5 rounded-lg text-slate-600 hover:bg-slate-100 transition cursor-pointer"
                          >
                            <Eye className="w-4 h-4" />
                          </button>

                          {/* Approve */}
                          {canPerformEnrollmentAction('approve_enrollment') && enrollment.status !== 'Approved' && (
                            <button
                              title="Approve Enrollment"
                              onClick={() => handleApprove(enrollment)}
                              className="p-1.5 rounded-lg text-emerald-700 hover:bg-emerald-50 transition cursor-pointer"
                            >
                              <CheckCircle2 className="w-4 h-4" />
                            </button>
                          )}

                          {/* Return for Correction */}
                          {canPerformEnrollmentAction('approve_enrollment') && enrollment.status !== 'Approved' && (
                            <button
                              title="Return for Correction"
                              onClick={() => handleOpenReturnModal(enrollment)}
                              className="p-1.5 rounded-lg text-amber-600 hover:bg-amber-50 transition cursor-pointer"
                            >
                              <MessageSquare className="w-4 h-4" />
                            </button>
                          )}

                          {/* Cancel */}
                          {canPerformEnrollmentAction('approve_enrollment') && enrollment.status === 'Approved' && (
                            <button
                              title="Cancel Enrollment"
                              onClick={() => handleOpenCancelModal(enrollment)}
                              className="p-1.5 rounded-lg text-rose-600 hover:bg-rose-50 transition cursor-pointer"
                            >
                              <Ban className="w-4 h-4" />
                            </button>
                          )}

                          {/* Reopen */}
                          {canPerformEnrollmentAction('approve_enrollment') &&
                            (enrollment.status === 'Cancelled' || enrollment.status === 'Rejected') && (
                              <button
                                title="Reopen Enrollment"
                                onClick={() => handleReopen(enrollment.id)}
                                className="p-1.5 rounded-lg text-blue-600 hover:bg-blue-50 transition cursor-pointer"
                              >
                                <RotateCcw className="w-4 h-4" />
                              </button>
                            )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* INSPECT ENROLLMENT DETAILS MODAL */}
      {selectedEnrollment && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] flex flex-col shadow-2xl overflow-hidden animate-in fade-in zoom-in-95">
            <div className="p-5 bg-[#18392B] text-white flex items-center justify-between">
              <div>
                <span className="text-xs text-[#A3D9C9] font-mono uppercase tracking-wider">
                  Registration Dossier
                </span>
                <h3 className="text-xl font-bold font-serif">{selectedEnrollment.studentName}</h3>
                <p className="text-xs text-slate-300 font-mono mt-0.5">
                  ID: {selectedEnrollment.studentId} &bull; Ref: {selectedEnrollment.referenceNumber}
                </p>
              </div>
              <button
                onClick={() => setSelectedEnrollment(null)}
                className="p-1.5 rounded-lg text-white/80 hover:text-white hover:bg-white/10 transition cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 overflow-y-auto space-y-5 text-xs text-slate-700">
              <div className="grid grid-cols-2 gap-4 p-4 rounded-xl bg-slate-50 border border-slate-200">
                <div>
                  <span className="text-slate-400 block text-[11px]">Academic Term</span>
                  <span className="font-semibold text-slate-900">
                    {selectedEnrollment.academicYear} &bull; {selectedEnrollment.semester}
                  </span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[11px]">Program & Year</span>
                  <span className="font-semibold text-slate-900">
                    {selectedEnrollment.programTitle || selectedEnrollment.programName} ({selectedEnrollment.yearLevel})
                  </span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[11px]">Tuition Assessment Estimate</span>
                  <span className="font-bold text-emerald-700 font-mono text-sm">
                    ₱{(selectedEnrollment.tuitionEstimate || selectedEnrollment.totalAssessment || 0).toLocaleString()}
                  </span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[11px]">Payment Plan</span>
                  <span className="font-semibold text-slate-900">
                    {selectedEnrollment.paymentPlan || 'Installment (4 terms)'}
                  </span>
                </div>
              </div>

              <div>
                <h4 className="font-semibold text-slate-900 text-sm mb-2 flex items-center gap-2">
                  <BookOpen className="w-4 h-4 text-[#18392B]" />
                  <span>Enrolled Course Schedule</span>
                </h4>
                <div className="border border-slate-200 rounded-lg overflow-hidden">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-100 text-slate-700 font-semibold">
                      <tr>
                        <th className="py-2.5 px-3">Code</th>
                        <th className="py-2.5 px-3">Subject Title</th>
                        <th className="py-2.5 px-3 font-mono">Units</th>
                        <th className="py-2.5 px-3">Schedule</th>
                        <th className="py-2.5 px-3">Instructor</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {(selectedEnrollment.subjects || []).map((s) => (
                        <tr key={s.id || s.code}>
                          <td className="py-2.5 px-3 font-mono font-bold text-[#18392B]">{s.code}</td>
                          <td className="py-2.5 px-3 font-medium text-slate-900">{s.title}</td>
                          <td className="py-2.5 px-3 font-mono">{s.units}</td>
                          <td className="py-2.5 px-3 text-slate-600">{s.schedule || 'TBA'}</td>
                          <td className="py-2.5 px-3 text-slate-600">{s.instructor || 'Faculty'}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {selectedEnrollment.rejectionReason && (
                <div className="p-3.5 rounded-lg bg-amber-50 border border-amber-200 text-amber-900 text-xs">
                  <span className="font-semibold block mb-0.5">Evaluation Remarks:</span>
                  {selectedEnrollment.rejectionReason}
                </div>
              )}
            </div>

            <div className="p-4 bg-slate-50 border-t border-slate-200 flex justify-between items-center">
              <button
                onClick={() => {
                  setViewingCorEnrollment(selectedEnrollment);
                  setSelectedEnrollment(null);
                }}
                className="px-3.5 py-2 font-semibold text-xs rounded-lg border border-slate-300 text-slate-700 hover:bg-slate-100 transition cursor-pointer flex items-center gap-1.5"
              >
                <FileText className="w-3.5 h-3.5" />
                <span>Open Printable COR</span>
              </button>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => setSelectedEnrollment(null)}
                  className="px-4 py-2 text-xs font-semibold rounded-lg bg-slate-200 text-slate-700 hover:bg-slate-300 transition cursor-pointer"
                >
                  Close
                </button>
                {canPerformEnrollmentAction('approve_enrollment') && selectedEnrollment.status !== 'Approved' && (
                  <button
                    onClick={() => handleApprove(selectedEnrollment)}
                    className="px-4 py-2 text-xs font-semibold bg-emerald-700 text-white hover:bg-emerald-800 rounded-lg transition cursor-pointer flex items-center gap-1.5"
                  >
                    <Check className="w-3.5 h-3.5" />
                    <span>Approve Enrollment</span>
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* OFFICIAL CERTIFICATE OF REGISTRATION (COR) MODAL */}
      {viewingCorEnrollment && (
        <div className="fixed inset-0 z-50 bg-slate-900/70 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl max-w-3xl w-full max-h-[92vh] flex flex-col shadow-2xl overflow-hidden animate-in fade-in zoom-in-95">
            <div className="p-4 bg-slate-900 text-white flex items-center justify-between print:hidden">
              <span className="text-xs font-semibold">Official Certificate of Registration Preview</span>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => window.print()}
                  className="px-3 py-1.5 rounded-lg bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-semibold flex items-center gap-1.5 transition cursor-pointer"
                >
                  <Printer className="w-3.5 h-3.5" />
                  <span>Print Document</span>
                </button>
                <button
                  onClick={() => setViewingCorEnrollment(null)}
                  className="p-1.5 rounded-lg text-white/80 hover:text-white hover:bg-white/10 transition cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* COR Document Printable Canvas */}
            <div className="p-8 overflow-y-auto space-y-6 text-slate-800 bg-white">
              {/* Institutional Header */}
              <div className="text-center pb-4 border-b-2 border-[#18392B] space-y-1">
                <div className="flex items-center justify-center gap-3 mb-2">
                  <Emblem id="cor-seal" size={56} className="w-14 h-14" />
                  <div className="text-left">
                    <h2 className="font-serif text-lg font-bold text-[#18392B] leading-tight">
                      Philippine College of Ministry
                    </h2>
                    <p className="text-[11px] text-slate-500 font-sans">
                      Lamut, La Trinidad, Benguet &bull; Office of the Registrar
                    </p>
                  </div>
                </div>
                <h3 className="font-serif text-base font-bold uppercase tracking-wider text-slate-900 pt-1">
                  Certificate of Registration & Assessment (COR)
                </h3>
                <p className="text-xs font-mono text-slate-600">
                  Academic Year {viewingCorEnrollment.academicYear} &mdash; {viewingCorEnrollment.semester}
                </p>
              </div>

              {/* Student Metadata */}
              <div className="grid grid-cols-2 gap-4 text-xs bg-slate-50 p-4 rounded-lg border border-slate-200">
                <div>
                  <span className="text-slate-500 text-[11px] block">Student ID Number:</span>
                  <span className="font-bold text-[#18392B] font-mono text-sm">
                    {viewingCorEnrollment.studentId}
                  </span>
                </div>
                <div>
                  <span className="text-slate-500 text-[11px] block">Student Name:</span>
                  <span className="font-bold text-slate-900 text-sm">
                    {viewingCorEnrollment.studentName}
                  </span>
                </div>
                <div>
                  <span className="text-slate-500 text-[11px] block">Degree Program:</span>
                  <span className="font-semibold text-slate-900">
                    {viewingCorEnrollment.programTitle || viewingCorEnrollment.programName}
                  </span>
                </div>
                <div>
                  <span className="text-slate-500 text-[11px] block">Year Level & Status:</span>
                  <span className="font-semibold text-slate-900">
                    {viewingCorEnrollment.yearLevel} &bull; {viewingCorEnrollment.status}
                  </span>
                </div>
              </div>

              {/* Subject Schedule Matrix */}
              <div>
                <table className="w-full text-left text-xs border border-slate-300">
                  <thead className="bg-[#18392B] text-white font-semibold">
                    <tr>
                      <th className="py-2 px-3">Subject Code</th>
                      <th className="py-2 px-3">Descriptive Title</th>
                      <th className="py-2 px-3 text-center">Units</th>
                      <th className="py-2 px-3">Schedule</th>
                      <th className="py-2 px-3">Room</th>
                      <th className="py-2 px-3">Instructor</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200">
                    {(viewingCorEnrollment.subjects || []).map((s) => (
                      <tr key={s.id || s.code} className="hover:bg-slate-50">
                        <td className="py-2 px-3 font-mono font-bold text-[#18392B]">{s.code}</td>
                        <td className="py-2 px-3 font-medium">{s.title}</td>
                        <td className="py-2 px-3 text-center font-mono">{s.units}</td>
                        <td className="py-2 px-3 text-slate-600">{s.schedule || 'TBA'}</td>
                        <td className="py-2 px-3 text-slate-600">{s.room || 'Main Hall'}</td>
                        <td className="py-2 px-3 text-slate-600">{s.instructor || 'Faculty'}</td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot className="bg-slate-100 font-bold border-t border-slate-300">
                    <tr>
                      <td colSpan={2} className="py-2 px-3 text-right">
                        Total Enrolled Units:
                      </td>
                      <td className="py-2 px-3 text-center font-mono">
                        {(viewingCorEnrollment.subjects || []).reduce((a, b) => a + (b.units || 0), 0)}
                      </td>
                      <td colSpan={3}></td>
                    </tr>
                  </tfoot>
                </table>
              </div>

              {/* Financial Breakdown */}
              <div className="p-4 rounded-lg bg-slate-50 border border-slate-200 flex justify-between items-center text-xs">
                <div>
                  <span className="text-slate-500 block">Assessment Breakdown:</span>
                  <span className="font-semibold text-slate-800">
                    Tuition & Miscellaneous Fees (Term Total)
                  </span>
                </div>
                <div className="text-right font-mono">
                  <span className="text-sm font-bold text-emerald-800">
                    ₱{(viewingCorEnrollment.tuitionEstimate || viewingCorEnrollment.totalAssessment || 0).toLocaleString()}
                  </span>
                  <span className="text-[11px] text-slate-400 block">Assessed by Finance Dept</span>
                </div>
              </div>

              {/* Signatures Block */}
              <div className="grid grid-cols-2 gap-8 pt-8 text-center text-xs">
                <div>
                  <div className="border-b border-slate-400 w-48 mx-auto mb-1"></div>
                  <span className="font-bold text-slate-900 block">Student Signature</span>
                  <span className="text-[10px] text-slate-400">Affirmed by Student</span>
                </div>
                <div>
                  <div className="border-b border-slate-400 w-48 mx-auto mb-1"></div>
                  <span className="font-bold text-slate-900 block">Dr. Mario Mendoza</span>
                  <span className="text-[10px] text-slate-400">College Registrar & Admissions Officer</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* RETURN FOR CORRECTION MODAL */}
      {isReturnModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full shadow-2xl overflow-hidden animate-in fade-in zoom-in-95">
            <div className="p-5 bg-amber-600 text-white flex items-center justify-between">
              <div>
                <h3 className="text-lg font-bold font-serif">Return for Correction</h3>
                <p className="text-xs text-amber-100">Send feedback to student for corrections</p>
              </div>
              <button
                onClick={() => setIsReturnModalOpen(false)}
                className="p-1.5 rounded-lg text-white/80 hover:text-white hover:bg-white/10 transition cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmitReturn} className="p-5 space-y-4 text-xs">
              <div>
                <label className="block text-slate-600 font-semibold mb-1">
                  Specify Required Corrections *
                </label>
                <textarea
                  required
                  rows={4}
                  value={returnFeedback}
                  onChange={(e) => setReturnFeedback(e.target.value)}
                  placeholder="Explain what documents are missing or schedule changes needed..."
                  className="w-full p-3 border rounded-lg focus:ring-1 focus:ring-amber-600 text-xs"
                />
              </div>

              <div className="p-4 bg-slate-50 -mx-5 -mb-5 mt-5 border-t border-slate-200 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsReturnModalOpen(false)}
                  className="px-4 py-2 font-semibold text-slate-600 hover:bg-slate-200 rounded-lg transition cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 font-semibold bg-amber-600 text-white hover:bg-amber-700 rounded-lg shadow-sm transition cursor-pointer"
                >
                  Return to Student
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* CANCEL ENROLLMENT MODAL */}
      {isCancelModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full shadow-2xl overflow-hidden animate-in fade-in zoom-in-95">
            <div className="p-5 bg-rose-700 text-white flex items-center justify-between">
              <div>
                <h3 className="text-lg font-bold font-serif">Cancel Registration</h3>
                <p className="text-xs text-rose-100">Revoke enrollment and deactivate COR</p>
              </div>
              <button
                onClick={() => setIsCancelModalOpen(false)}
                className="p-1.5 rounded-lg text-white/80 hover:text-white hover:bg-white/10 transition cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmitCancel} className="p-5 space-y-4 text-xs">
              <div>
                <label className="block text-slate-600 font-semibold mb-1">
                  Reason for Cancellation *
                </label>
                <textarea
                  required
                  rows={4}
                  value={cancelReason}
                  onChange={(e) => setCancelReason(e.target.value)}
                  placeholder="Provide institutional justification for cancelling this enrollment..."
                  className="w-full p-3 border rounded-lg focus:ring-1 focus:ring-rose-700 text-xs"
                />
              </div>

              <div className="p-4 bg-slate-50 -mx-5 -mb-5 mt-5 border-t border-slate-200 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsCancelModalOpen(false)}
                  className="px-4 py-2 font-semibold text-slate-600 hover:bg-slate-200 rounded-lg transition cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 font-semibold bg-rose-700 text-white hover:bg-rose-800 rounded-lg shadow-sm transition cursor-pointer"
                >
                  Confirm Cancellation
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
