'use client';

import React, { useState } from 'react';
import { usePCM } from '@/lib/store';
import { PreEnlistmentRecord } from '@/lib/types';
import {
  FileCheck,
  Search,
  CheckCircle2,
  Clock,
  XCircle,
  AlertCircle,
  Check,
  Eye,
  RotateCcw,
  X,
  MessageSquare,
  BookOpen,
  Filter,
  Download,
  Users,
} from 'lucide-react';

export const PreEnlistmentAdminView: React.FC = () => {
  const {
    preEnlistments,
    updatePreEnlistmentStatus,
    canPerformEnrollmentAction,
    addToast,
    programs,
  } = usePCM();

  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [selectedSubmission, setSelectedSubmission] = useState<PreEnlistmentRecord | null>(null);

  // Return / Feedback Modal
  const [isFeedbackModalOpen, setIsFeedbackModalOpen] = useState(false);
  const [feedbackTargetId, setFeedbackTargetId] = useState('');
  const [feedbackRemarks, setFeedbackRemarks] = useState('');

  const filteredSubmissions = preEnlistments.filter((record) => {
    const query = searchQuery.toLowerCase();
    const matchesSearch =
      (record.studentName || '').toLowerCase().includes(query) ||
      (record.studentId || '').toLowerCase().includes(query) ||
      (record.programTitle || '').toLowerCase().includes(query);

    const matchesStatus = statusFilter === 'all' || record.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const handleApprove = async (recordId: string) => {
    await updatePreEnlistmentStatus(recordId, 'Approved', 'Pre-enlistment evaluated and cleared by Registrar.');
  };

  const handleBulkApprove = async () => {
    const pending = filteredSubmissions.filter((s) => s.status === 'Pending' || s.status === 'Under Review');
    if (pending.length === 0) {
      addToast('info', 'No Pending Submissions', 'There are no pending pre-enlistment records to approve.');
      return;
    }

    for (const sub of pending) {
      await updatePreEnlistmentStatus(sub.id, 'Approved', 'Batch approved by Registrar.');
    }
    addToast('success', 'Batch Approved', `Approved ${pending.length} pre-enlistment submissions.`);
  };

  const handleOpenFeedback = (record: PreEnlistmentRecord) => {
    setFeedbackTargetId(record.id);
    setFeedbackRemarks(record.remarks || 'Please adjust your selected courses due to schedule conflict or prerequisite requirements.');
    setIsFeedbackModalOpen(true);
  };

  const handleSubmitFeedback = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!feedbackTargetId) return;
    await updatePreEnlistmentStatus(feedbackTargetId, 'Returned for Revision', feedbackRemarks);
    setIsFeedbackModalOpen(false);
  };

  const handleReject = async (recordId: string) => {
    if (confirm('Are you sure you want to decline this pre-enlistment submission?')) {
      await updatePreEnlistmentStatus(recordId, 'Rejected', 'Pre-enlistment declined. Please consult academic advising.');
    }
  };

  return (
    <div className="space-y-5">
      {/* Header & Controls */}
      <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h3 className="font-serif font-bold text-lg text-slate-900 flex items-center gap-2">
              <FileCheck className="w-5 h-5 text-blue-600" />
              <span>Pre-Enlistment Workflow & Applications</span>
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Evaluate course advisements, verify prerequisites, and clear students for official registration.
            </p>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            {canPerformEnrollmentAction('approve_pre_enlistment') && (
              <button
                onClick={handleBulkApprove}
                className="text-xs font-semibold px-3.5 py-2 rounded-lg bg-emerald-700 text-white hover:bg-emerald-800 transition flex items-center gap-1.5 cursor-pointer shadow-xs"
              >
                <Check className="w-3.5 h-3.5" />
                <span>Bulk Approve Pending</span>
              </button>
            )}
          </div>
        </div>

        {/* Search & Filters */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mt-4 pt-4 border-t border-slate-100">
          <div className="sm:col-span-2 relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              placeholder="Search by student name, student ID #, or program..."
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
              <option value="all">All Submission Statuses</option>
              <option value="Pending">Pending Review</option>
              <option value="Under Review">Under Review</option>
              <option value="Approved">Approved</option>
              <option value="Returned for Revision">Returned for Revision</option>
              <option value="Rejected">Rejected</option>
            </select>
          </div>
        </div>
      </div>

      {/* Submissions List */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-600">
            <thead className="bg-slate-50 text-slate-700 font-semibold border-b border-slate-200">
              <tr>
                <th className="py-3 px-4">Student ID & Name</th>
                <th className="py-3 px-4">Academic Term</th>
                <th className="py-3 px-4">Program & Year</th>
                <th className="py-3 px-4">Selected Units</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4">Date Submitted</th>
                <th className="py-3 px-4 text-center">Registrar Review</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredSubmissions.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-400">
                    <FileCheck className="w-8 h-8 mx-auto mb-2 opacity-40" />
                    <p className="font-medium text-sm">No pre-enlistment records found</p>
                    <p className="text-xs text-slate-400 mt-0.5">Students who submit their course wishlist will appear here.</p>
                  </td>
                </tr>
              ) : (
                filteredSubmissions.map((record) => {
                  return (
                    <tr key={record.id} className="hover:bg-slate-50/70 transition">
                      <td className="py-3 px-4">
                        <div className="font-semibold text-slate-900">{record.studentName}</div>
                        <div className="text-[11px] text-slate-500 font-mono">
                          ID: <span className="font-bold text-[#18392B]">{record.studentId}</span>
                        </div>
                      </td>

                      <td className="py-3 px-4 font-medium text-slate-900">
                        {record.academicYear} &bull; {record.semester}
                      </td>

                      <td className="py-3 px-4">
                        <div className="text-slate-900 font-medium">{record.programTitle}</div>
                        <div className="text-[11px] text-slate-500">{record.yearLevel}</div>
                      </td>

                      <td className="py-3 px-4 font-mono">
                        <span className="font-bold text-slate-900">{record.totalUnits} Units</span>
                        <span className="text-[10px] text-slate-400 block">
                          ({record.selectedSubjectCodes.length} Subjects)
                        </span>
                      </td>

                      <td className="py-3 px-4">
                        <span
                          className={`inline-block text-[10px] px-2 py-0.5 rounded-full font-semibold border ${
                            record.status === 'Approved'
                              ? 'bg-emerald-100 text-emerald-800 border-emerald-300'
                              : record.status === 'Returned for Revision'
                              ? 'bg-amber-100 text-amber-800 border-amber-300'
                              : record.status === 'Rejected'
                              ? 'bg-rose-100 text-rose-800 border-rose-300'
                              : 'bg-blue-100 text-blue-800 border-blue-300'
                          }`}
                        >
                          {record.status}
                        </span>
                      </td>

                      <td className="py-3 px-4 text-slate-500">
                        {new Date(record.createdAt).toLocaleDateString()}
                      </td>

                      <td className="py-3 px-4">
                        <div className="flex items-center justify-center gap-1.5">
                          {/* View Selected Subjects */}
                          <button
                            title="Inspect Course Selection"
                            onClick={() => setSelectedSubmission(record)}
                            className="p-1.5 rounded-lg text-slate-600 hover:bg-slate-100 transition cursor-pointer"
                          >
                            <Eye className="w-4 h-4" />
                          </button>

                          {/* Quick Approve */}
                          {canPerformEnrollmentAction('approve_pre_enlistment') && record.status !== 'Approved' && (
                            <button
                              title="Approve Pre-enlistment"
                              onClick={() => handleApprove(record.id)}
                              className="p-1.5 rounded-lg text-emerald-700 hover:bg-emerald-50 transition cursor-pointer"
                            >
                              <CheckCircle2 className="w-4 h-4" />
                            </button>
                          )}

                          {/* Return for Revision */}
                          {canPerformEnrollmentAction('approve_pre_enlistment') && (
                            <button
                              title="Return for Revision with Notes"
                              onClick={() => handleOpenFeedback(record)}
                              className="p-1.5 rounded-lg text-amber-600 hover:bg-amber-50 transition cursor-pointer"
                            >
                              <MessageSquare className="w-4 h-4" />
                            </button>
                          )}

                          {/* Reject */}
                          {canPerformEnrollmentAction('approve_pre_enlistment') && record.status !== 'Rejected' && (
                            <button
                              title="Reject"
                              onClick={() => handleReject(record.id)}
                              className="p-1.5 rounded-lg text-rose-600 hover:bg-rose-50 transition cursor-pointer"
                            >
                              <XCircle className="w-4 h-4" />
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

      {/* INSPECT SUBMISSION MODAL */}
      {selectedSubmission && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full shadow-2xl overflow-hidden animate-in fade-in zoom-in-95">
            <div className="p-5 bg-blue-900 text-white flex items-center justify-between">
              <div>
                <h3 className="text-lg font-bold font-serif">Pre-Enlistment Details</h3>
                <p className="text-xs text-blue-200">
                  {selectedSubmission.studentName} ({selectedSubmission.studentId})
                </p>
              </div>
              <button
                onClick={() => setSelectedSubmission(null)}
                className="p-1.5 rounded-lg text-white/80 hover:text-white hover:bg-white/10 transition cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-5 space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-3 p-3 rounded-lg bg-slate-50 border border-slate-200">
                <div>
                  <span className="text-slate-400 block text-[11px]">Academic Term</span>
                  <span className="font-semibold text-slate-900">
                    {selectedSubmission.academicYear} {selectedSubmission.semester}
                  </span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[11px]">Total Units</span>
                  <span className="font-semibold text-slate-900 font-mono">
                    {selectedSubmission.totalUnits} Units
                  </span>
                </div>
                <div className="col-span-2">
                  <span className="text-slate-400 block text-[11px]">Program & Year</span>
                  <span className="font-semibold text-slate-900">
                    {selectedSubmission.programTitle} &bull; {selectedSubmission.yearLevel}
                  </span>
                </div>
              </div>

              <div>
                <span className="font-semibold text-slate-900 block mb-1.5">Selected Subjects Requested:</span>
                <div className="space-y-1.5 max-h-48 overflow-y-auto">
                  {selectedSubmission.selectedSubjectCodes.map((code) => (
                    <div
                      key={code}
                      className="p-2.5 rounded-lg bg-white border border-slate-200 flex items-center justify-between font-mono"
                    >
                      <span className="font-bold text-[#18392B]">{code}</span>
                      <span className="text-[11px] text-slate-500">Requested</span>
                    </div>
                  ))}
                </div>
              </div>

              {selectedSubmission.remarks && (
                <div className="p-3 rounded-lg bg-amber-50 border border-amber-200 text-amber-900 text-[11px]">
                  <span className="font-semibold block mb-0.5">Registrar Remarks:</span>
                  {selectedSubmission.remarks}
                </div>
              )}
            </div>

            <div className="p-4 bg-slate-50 border-t border-slate-200 flex justify-end gap-2">
              <button
                onClick={() => setSelectedSubmission(null)}
                className="px-4 py-2 font-semibold text-slate-600 hover:bg-slate-200 rounded-lg transition cursor-pointer text-xs"
              >
                Close
              </button>
              {canPerformEnrollmentAction('approve_pre_enlistment') && selectedSubmission.status !== 'Approved' && (
                <button
                  onClick={async () => {
                    await handleApprove(selectedSubmission.id);
                    setSelectedSubmission(null);
                  }}
                  className="px-4 py-2 font-semibold bg-emerald-700 text-white hover:bg-emerald-800 rounded-lg transition cursor-pointer text-xs flex items-center gap-1.5"
                >
                  <Check className="w-3.5 h-3.5" />
                  <span>Approve Application</span>
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* FEEDBACK / RETURN MODAL */}
      {isFeedbackModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full shadow-2xl overflow-hidden animate-in fade-in zoom-in-95">
            <div className="p-5 bg-amber-600 text-white flex items-center justify-between">
              <div>
                <h3 className="text-lg font-bold font-serif">Return for Revision</h3>
                <p className="text-xs text-amber-100">Send advisement notes back to student</p>
              </div>
              <button
                onClick={() => setIsFeedbackModalOpen(false)}
                className="p-1.5 rounded-lg text-white/80 hover:text-white hover:bg-white/10 transition cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmitFeedback} className="p-5 space-y-4 text-xs">
              <div>
                <label className="block text-slate-600 font-semibold mb-1">
                  Registrar Evaluation Notes / Required Changes *
                </label>
                <textarea
                  required
                  rows={4}
                  value={feedbackRemarks}
                  onChange={(e) => setFeedbackRemarks(e.target.value)}
                  placeholder="Explain what subjects need adjustment, missing prerequisites, or overload constraints..."
                  className="w-full p-3 border rounded-lg focus:ring-1 focus:ring-amber-600 text-xs"
                />
              </div>

              <div className="p-4 bg-slate-50 -mx-5 -mb-5 mt-5 border-t border-slate-200 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsFeedbackModalOpen(false)}
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
    </div>
  );
};
