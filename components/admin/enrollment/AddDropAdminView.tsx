'use client';

import React, { useState } from 'react';
import { usePCM } from '@/lib/store';
import { AddDropRequest, AddDropStatus } from '@/lib/types';
import {
  RotateCcw,
  Search,
  CheckCircle2,
  XCircle,
  Clock,
  Check,
  X,
  AlertCircle,
  BookOpen,
  ArrowUpRight,
  ArrowDownRight,
  MessageSquare,
  Sparkles,
} from 'lucide-react';

export const AddDropAdminView: React.FC = () => {
  const {
    addDropRequests,
    reviewAddDropRequest,
    canPerformEnrollmentAction,
    addToast,
  } = usePCM();

  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');

  // Disapprove modal
  const [isRejectModalOpen, setIsRejectModalOpen] = useState(false);
  const [rejectTargetId, setRejectTargetId] = useState('');
  const [rejectRemarks, setRejectRemarks] = useState('');

  const filteredRequests = addDropRequests.filter((req) => {
    const query = searchQuery.toLowerCase();
    const matchesSearch =
      (req.studentName || '').toLowerCase().includes(query) ||
      (req.studentId || '').toLowerCase().includes(query) ||
      (req.subjectCode || '').toLowerCase().includes(query) ||
      (req.subjectTitle || '').toLowerCase().includes(query);

    const matchesStatus = statusFilter === 'all' || req.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const handleApprove = async (requestId: string) => {
    await reviewAddDropRequest(requestId, 'Approved', 'Approved by Registrar. Student roster and fee assessment updated.');
  };

  const handleOpenDisapprove = (req: AddDropRequest) => {
    setRejectTargetId(req.id);
    setRejectRemarks('Request denied due to maximum unit caps, prerequisite deficiencies, or elapsed deadline.');
    setIsRejectModalOpen(true);
  };

  const handleSubmitDisapprove = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!rejectTargetId) return;
    await reviewAddDropRequest(rejectTargetId, 'Disapproved', rejectRemarks);
    setIsRejectModalOpen(false);
  };

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h3 className="font-serif font-bold text-lg text-slate-900 flex items-center gap-2">
              <RotateCcw className="w-5 h-5 text-purple-600" />
              <span>Adding & Dropping Course Adjustments</span>
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Review course change requests. Approving a request automatically synchronizes the student course roster and recalculates tuition assessment.
            </p>
          </div>

          <div className="p-3 bg-purple-50 rounded-lg border border-purple-200 text-purple-900 text-xs flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-purple-600 shrink-0" />
            <span>Automatic Fee & Unit Recalculation is active for all approvals.</span>
          </div>
        </div>

        {/* Search & Filter */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mt-4 pt-4 border-t border-slate-100">
          <div className="sm:col-span-2 relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              placeholder="Search by student name, ID #, or course code..."
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
              <option value="all">All Request Statuses</option>
              <option value="Pending">Pending Action</option>
              <option value="Approved">Approved</option>
              <option value="Disapproved">Disapproved</option>
            </select>
          </div>
        </div>
      </div>

      {/* Requests Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-600">
            <thead className="bg-slate-50 text-slate-700 font-semibold border-b border-slate-200">
              <tr>
                <th className="py-3 px-4">Student Name & ID</th>
                <th className="py-3 px-4">Action Type</th>
                <th className="py-3 px-4">Subject Affected</th>
                <th className="py-3 px-4">Units</th>
                <th className="py-3 px-4">Student Justification</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4 text-center">Registrar Review</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredRequests.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-400">
                    <RotateCcw className="w-8 h-8 mx-auto mb-2 opacity-40" />
                    <p className="font-medium text-sm">No Add/Drop requests in queue</p>
                    <p className="text-xs text-slate-400 mt-0.5">Students who file course additions or withdrawals will appear here.</p>
                  </td>
                </tr>
              ) : (
                filteredRequests.map((req) => {
                  const isAdd = req.action === 'Add';

                  return (
                    <tr key={req.id} className="hover:bg-slate-50/70 transition">
                      <td className="py-3 px-4">
                        <div className="font-semibold text-slate-900">{req.studentName}</div>
                        <div className="text-[11px] text-slate-500 font-mono">
                          ID: <span className="font-bold text-[#18392B]">{req.studentId}</span>
                        </div>
                      </td>

                      <td className="py-3 px-4">
                        <span
                          className={`inline-flex items-center gap-1 text-[11px] px-2.5 py-0.5 rounded-full font-semibold border ${
                            isAdd
                              ? 'bg-emerald-100 text-emerald-800 border-emerald-300'
                              : 'bg-rose-100 text-rose-800 border-rose-300'
                          }`}
                        >
                          {isAdd ? <ArrowUpRight className="w-3.5 h-3.5" /> : <ArrowDownRight className="w-3.5 h-3.5" />}
                          <span>{isAdd ? 'Add Subject' : 'Drop Subject'}</span>
                        </span>
                      </td>

                      <td className="py-3 px-4">
                        <div className="font-bold text-slate-900 font-mono">{req.subjectCode}</div>
                        <div className="text-[11px] text-slate-500">{req.subjectTitle}</div>
                      </td>

                      <td className="py-3 px-4 font-mono font-semibold text-slate-900">
                        {req.units} Units
                      </td>

                      <td className="py-3 px-4 text-slate-700 max-w-xs">
                        <div className="truncate" title={req.reason}>
                          {req.reason}
                        </div>
                        <div className="text-[10px] text-slate-400 mt-0.5">
                          Filed: {new Date(req.dateSubmitted).toLocaleDateString()}
                        </div>
                      </td>

                      <td className="py-3 px-4">
                        <span
                          className={`inline-block text-[10px] px-2.5 py-0.5 rounded-full font-semibold border ${
                            req.status === 'Approved'
                              ? 'bg-emerald-100 text-emerald-800 border-emerald-300'
                              : req.status === 'Disapproved'
                              ? 'bg-rose-100 text-rose-800 border-rose-300'
                              : 'bg-amber-100 text-amber-800 border-amber-300'
                          }`}
                        >
                          {req.status}
                        </span>
                      </td>

                      <td className="py-3 px-4">
                        <div className="flex items-center justify-center gap-1.5">
                          {canPerformEnrollmentAction('manage_add_drop') && req.status === 'Pending' && (
                            <>
                              <button
                                title="Approve Add/Drop"
                                onClick={() => handleApprove(req.id)}
                                className="px-2.5 py-1 rounded bg-emerald-700 hover:bg-emerald-800 text-white font-semibold text-xs transition cursor-pointer flex items-center gap-1"
                              >
                                <Check className="w-3.5 h-3.5" />
                                <span>Approve</span>
                              </button>
                              <button
                                title="Disapprove Request"
                                onClick={() => handleOpenDisapprove(req)}
                                className="px-2.5 py-1 rounded bg-rose-700 hover:bg-rose-800 text-white font-semibold text-xs transition cursor-pointer flex items-center gap-1"
                              >
                                <X className="w-3.5 h-3.5" />
                                <span>Decline</span>
                              </button>
                            </>
                          )}
                          {req.status !== 'Pending' && (
                            <span className="text-[11px] text-slate-400 italic">
                              Evaluated ({new Date(req.reviewedAt || Date.now()).toLocaleDateString()})
                            </span>
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

      {/* DISAPPROVE MODAL */}
      {isRejectModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full shadow-2xl overflow-hidden animate-in fade-in zoom-in-95">
            <div className="p-5 bg-rose-700 text-white flex items-center justify-between">
              <div>
                <h3 className="text-lg font-bold font-serif">Decline Course Adjustment</h3>
                <p className="text-xs text-rose-100">Send institutional remarks to student</p>
              </div>
              <button
                onClick={() => setIsRejectModalOpen(false)}
                className="p-1.5 rounded-lg text-white/80 hover:text-white hover:bg-white/10 transition cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmitDisapprove} className="p-5 space-y-4 text-xs">
              <div>
                <label className="block text-slate-600 font-semibold mb-1">
                  Reason for Disapproval *
                </label>
                <textarea
                  required
                  rows={4}
                  value={rejectRemarks}
                  onChange={(e) => setRejectRemarks(e.target.value)}
                  placeholder="Explain why this add or drop cannot be honored..."
                  className="w-full p-3 border rounded-lg focus:ring-1 focus:ring-rose-700 text-xs"
                />
              </div>

              <div className="p-4 bg-slate-50 -mx-5 -mb-5 mt-5 border-t border-slate-200 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsRejectModalOpen(false)}
                  className="px-4 py-2 font-semibold text-slate-600 hover:bg-slate-200 rounded-lg transition cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 font-semibold bg-rose-700 text-white hover:bg-rose-800 rounded-lg shadow-sm transition cursor-pointer"
                >
                  Confirm Decline
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
