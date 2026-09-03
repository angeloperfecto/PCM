'use client';

import React, { useState } from 'react';
import { usePCM } from '@/lib/store';
import { AcademicPeriod, AcademicPeriodStatus } from '@/lib/types';
import {
  Calendar,
  Plus,
  Edit2,
  Trash2,
  CheckCircle2,
  Clock,
  AlertCircle,
  X,
  Check,
  RotateCcw,
  Sparkles,
} from 'lucide-react';

export const AcademicTermsAdminView: React.FC = () => {
  const {
    academicPeriods,
    currentAcademicPeriod,
    addAcademicPeriod,
    updateAcademicPeriod,
    setCurrentAcademicPeriod,
    deleteAcademicPeriod,
    canPerformEnrollmentAction,
    addToast,
  } = usePCM();

  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingPeriod, setEditingPeriod] = useState<AcademicPeriod | null>(null);

  const [formData, setFormData] = useState({
    academicYear: '2026–2027',
    semester: '2nd Semester' as const,
    status: 'Upcoming' as AcademicPeriodStatus,
    isCurrent: false,
    preEnlistmentStartDate: '2026-11-01',
    preEnlistmentEndDate: '2026-11-30',
    enrollmentStartDate: '2026-12-01',
    enrollmentEndDate: '2026-12-20',
    addingDroppingStartDate: '2027-01-05',
    addingDroppingEndDate: '2027-01-20',
    paymentDeadline: '2027-02-15',
  });

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    await addAcademicPeriod(formData);
    setIsAddModalOpen(false);
  };

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingPeriod) return;
    await updateAcademicPeriod(editingPeriod.id, editingPeriod);
    setEditingPeriod(null);
  };

  const handleDelete = async (period: AcademicPeriod) => {
    if (period.isCurrent) {
      addToast('error', 'Active Term', 'You cannot delete the currently active academic term. Set another term as active first.');
      return;
    }
    if (confirm(`Delete academic period ${period.academicYear} ${period.semester}?`)) {
      await deleteAcademicPeriod(period.id);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'Open':
        return 'bg-emerald-100 text-emerald-800 border-emerald-300';
      case 'Late Enrollment':
        return 'bg-amber-100 text-amber-800 border-amber-300';
      case 'Closed':
        return 'bg-rose-100 text-rose-800 border-rose-300';
      case 'Suspended':
        return 'bg-purple-100 text-purple-800 border-purple-300';
      default:
        return 'bg-blue-100 text-blue-800 border-blue-300';
    }
  };

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h3 className="font-serif font-bold text-lg text-slate-900 flex items-center gap-2">
            <Calendar className="w-5 h-5 text-[#18392B]" />
            <span>Academic Periods & Enrollment Windows</span>
          </h3>
          <p className="text-xs text-slate-500 mt-0.5">
            Configure semesters, active terms, pre-enlistment dates, regular enrollment windows, and payment deadlines.
          </p>
        </div>

        {canPerformEnrollmentAction('manage_periods') && (
          <button
            onClick={() => setIsAddModalOpen(true)}
            className="text-xs font-semibold px-3.5 py-2 rounded-lg bg-[#18392B] text-white hover:bg-[#23523e] transition flex items-center gap-1.5 cursor-pointer shadow-xs"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Add Academic Term</span>
          </button>
        )}
      </div>

      {/* Periods Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {academicPeriods.map((period) => {
          return (
            <div
              key={period.id}
              className={`bg-white rounded-xl border p-5 shadow-xs transition relative flex flex-col justify-between ${
                period.isCurrent
                  ? 'border-[#18392B] ring-2 ring-[#18392B]/15'
                  : 'border-slate-200 hover:border-slate-300'
              }`}
            >
              <div>
                <div className="flex items-start justify-between gap-2 mb-3">
                  <div>
                    <h4 className="font-serif font-bold text-slate-900 text-base">
                      {period.academicYear}
                    </h4>
                    <span className="text-xs font-medium text-slate-600 block">
                      {period.semester}
                    </span>
                  </div>

                  <div className="flex items-center gap-1.5">
                    {period.isCurrent ? (
                      <span className="text-[10px] bg-[#18392B] text-white px-2.5 py-0.5 rounded-full font-bold uppercase tracking-wider">
                        Active Term
                      </span>
                    ) : (
                      <span className={`text-[10px] px-2 py-0.5 rounded-full font-semibold border ${getStatusBadge(period.status)}`}>
                        {period.status}
                      </span>
                    )}
                  </div>
                </div>

                {/* Deadlines Timeline */}
                <div className="space-y-2 text-xs bg-slate-50 p-3 rounded-lg border border-slate-200 mb-4">
                  <div className="flex justify-between">
                    <span className="text-slate-500 text-[11px]">Enrollment Window:</span>
                    <span className="font-semibold text-slate-900 font-mono text-[11px]">
                      {period.enrollmentStartDate} to {period.enrollmentEndDate}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500 text-[11px]">Pre-Enlistment:</span>
                    <span className="font-medium text-slate-700 font-mono text-[11px]">
                      {period.preEnlistmentStartDate || 'TBA'} to {period.preEnlistmentEndDate || 'TBA'}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500 text-[11px]">Adding & Dropping:</span>
                    <span className="font-medium text-slate-700 font-mono text-[11px]">
                      {period.addingDroppingStartDate || 'TBA'} to {period.addingDroppingEndDate || 'TBA'}
                    </span>
                  </div>
                  <div className="flex justify-between pt-1 border-t border-slate-200">
                    <span className="text-slate-500 text-[11px]">Payment Deadline:</span>
                    <span className="font-bold text-rose-700 font-mono text-[11px]">
                      {period.paymentDeadline || 'TBA'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Actions */}
              <div className="flex items-center justify-between pt-3 border-t border-slate-100">
                {!period.isCurrent ? (
                  <button
                    onClick={() => setCurrentAcademicPeriod(period.id)}
                    className="text-xs font-semibold text-[#18392B] hover:underline cursor-pointer flex items-center gap-1"
                  >
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>Set as Active Term</span>
                  </button>
                ) : (
                  <span className="text-xs text-emerald-700 font-semibold flex items-center gap-1">
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>Current Enrollment Cycle</span>
                  </span>
                )}

                <div className="flex items-center gap-1">
                  {canPerformEnrollmentAction('manage_periods') && (
                    <>
                      <button
                        title="Edit Period"
                        onClick={() => setEditingPeriod(period)}
                        className="p-1.5 rounded-lg text-slate-600 hover:bg-slate-100 transition cursor-pointer"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                      {!period.isCurrent && (
                        <button
                          title="Delete Period"
                          onClick={() => handleDelete(period)}
                          className="p-1.5 rounded-lg text-rose-600 hover:bg-rose-50 transition cursor-pointer"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* ADD ACADEMIC PERIOD MODAL */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl max-w-lg w-full shadow-2xl overflow-hidden animate-in fade-in zoom-in-95">
            <div className="p-5 bg-[#18392B] text-white flex items-center justify-between">
              <div>
                <h3 className="text-lg font-bold font-serif">Add Academic Period</h3>
                <p className="text-xs text-[#A3D9C9]">Define calendar terms and registration schedules</p>
              </div>
              <button
                onClick={() => setIsAddModalOpen(false)}
                className="p-1.5 rounded-lg text-white/80 hover:text-white hover:bg-white/10 transition cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreate} className="p-6 space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-600 font-semibold mb-1">Academic Year *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. 2026–2027"
                    value={formData.academicYear}
                    onChange={(e) => setFormData({ ...formData, academicYear: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg focus:ring-1 focus:ring-[#18392B]"
                  />
                </div>

                <div>
                  <label className="block text-slate-600 font-semibold mb-1">Semester *</label>
                  <select
                    value={formData.semester}
                    onChange={(e) => setFormData({ ...formData, semester: e.target.value as any })}
                    className="w-full px-3 py-2 border rounded-lg bg-white focus:ring-1 focus:ring-[#18392B]"
                  >
                    <option value="1st Semester">1st Semester</option>
                    <option value="2nd Semester">2nd Semester</option>
                    <option value="Summer">Summer</option>
                    <option value="Midyear">Midyear</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-slate-600 font-semibold mb-1">Period Status</label>
                <select
                  value={formData.status}
                  onChange={(e) => setFormData({ ...formData, status: e.target.value as any })}
                  className="w-full px-3 py-2 border rounded-lg bg-white focus:ring-1 focus:ring-[#18392B]"
                >
                  <option value="Open">Open (Active Enrollment)</option>
                  <option value="Late Enrollment">Late Enrollment</option>
                  <option value="Upcoming">Upcoming</option>
                  <option value="Closed">Closed</option>
                  <option value="Suspended">Suspended</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-600 font-semibold mb-1">Enrollment Start Date</label>
                  <input
                    type="date"
                    value={formData.enrollmentStartDate}
                    onChange={(e) => setFormData({ ...formData, enrollmentStartDate: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg focus:ring-1 focus:ring-[#18392B]"
                  />
                </div>
                <div>
                  <label className="block text-slate-600 font-semibold mb-1">Enrollment End Date</label>
                  <input
                    type="date"
                    value={formData.enrollmentEndDate}
                    onChange={(e) => setFormData({ ...formData, enrollmentEndDate: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg focus:ring-1 focus:ring-[#18392B]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-600 font-semibold mb-1">Add/Drop Start Date</label>
                  <input
                    type="date"
                    value={formData.addingDroppingStartDate}
                    onChange={(e) => setFormData({ ...formData, addingDroppingStartDate: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg focus:ring-1 focus:ring-[#18392B]"
                  />
                </div>
                <div>
                  <label className="block text-slate-600 font-semibold mb-1">Add/Drop End Date</label>
                  <input
                    type="date"
                    value={formData.addingDroppingEndDate}
                    onChange={(e) => setFormData({ ...formData, addingDroppingEndDate: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg focus:ring-1 focus:ring-[#18392B]"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-600 font-semibold mb-1">Tuition Payment Deadline</label>
                <input
                  type="date"
                  value={formData.paymentDeadline}
                  onChange={(e) => setFormData({ ...formData, paymentDeadline: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg focus:ring-1 focus:ring-[#18392B]"
                />
              </div>

              <div className="p-4 bg-slate-50 -mx-6 -mb-6 mt-6 border-t border-slate-200 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="px-4 py-2 font-semibold text-slate-600 hover:bg-slate-200 rounded-lg transition cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 font-semibold bg-[#18392B] text-white hover:bg-[#23523e] rounded-lg shadow-sm transition cursor-pointer"
                >
                  Create Academic Period
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* EDIT ACADEMIC PERIOD MODAL */}
      {editingPeriod && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl max-w-lg w-full shadow-2xl overflow-hidden animate-in fade-in zoom-in-95">
            <div className="p-5 bg-slate-900 text-white flex items-center justify-between">
              <div>
                <h3 className="text-lg font-bold font-serif">Edit Academic Period</h3>
                <p className="text-xs text-slate-400">
                  {editingPeriod.academicYear} &mdash; {editingPeriod.semester}
                </p>
              </div>
              <button
                onClick={() => setEditingPeriod(null)}
                className="p-1.5 rounded-lg text-white/80 hover:text-white hover:bg-white/10 transition cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleUpdate} className="p-6 space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-600 font-semibold mb-1">Academic Year</label>
                  <input
                    type="text"
                    required
                    value={editingPeriod.academicYear}
                    onChange={(e) => setEditingPeriod({ ...editingPeriod, academicYear: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg focus:ring-1 focus:ring-slate-900"
                  />
                </div>

                <div>
                  <label className="block text-slate-600 font-semibold mb-1">Semester</label>
                  <select
                    value={editingPeriod.semester}
                    onChange={(e) => setEditingPeriod({ ...editingPeriod, semester: e.target.value as any })}
                    className="w-full px-3 py-2 border rounded-lg bg-white focus:ring-1 focus:ring-slate-900"
                  >
                    <option value="1st Semester">1st Semester</option>
                    <option value="2nd Semester">2nd Semester</option>
                    <option value="Summer">Summer</option>
                    <option value="Midyear">Midyear</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-slate-600 font-semibold mb-1">Period Status</label>
                <select
                  value={editingPeriod.status}
                  onChange={(e) => setEditingPeriod({ ...editingPeriod, status: e.target.value as any })}
                  className="w-full px-3 py-2 border rounded-lg bg-white focus:ring-1 focus:ring-slate-900"
                >
                  <option value="Open">Open (Active Enrollment)</option>
                  <option value="Late Enrollment">Late Enrollment</option>
                  <option value="Upcoming">Upcoming</option>
                  <option value="Closed">Closed</option>
                  <option value="Suspended">Suspended</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-600 font-semibold mb-1">Enrollment Start</label>
                  <input
                    type="date"
                    value={editingPeriod.enrollmentStartDate}
                    onChange={(e) => setEditingPeriod({ ...editingPeriod, enrollmentStartDate: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg focus:ring-1 focus:ring-slate-900"
                  />
                </div>
                <div>
                  <label className="block text-slate-600 font-semibold mb-1">Enrollment End</label>
                  <input
                    type="date"
                    value={editingPeriod.enrollmentEndDate}
                    onChange={(e) => setEditingPeriod({ ...editingPeriod, enrollmentEndDate: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg focus:ring-1 focus:ring-slate-900"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-600 font-semibold mb-1">Add/Drop Start</label>
                  <input
                    type="date"
                    value={editingPeriod.addingDroppingStartDate || ''}
                    onChange={(e) => setEditingPeriod({ ...editingPeriod, addingDroppingStartDate: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg focus:ring-1 focus:ring-slate-900"
                  />
                </div>
                <div>
                  <label className="block text-slate-600 font-semibold mb-1">Add/Drop End</label>
                  <input
                    type="date"
                    value={editingPeriod.addingDroppingEndDate || ''}
                    onChange={(e) => setEditingPeriod({ ...editingPeriod, addingDroppingEndDate: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg focus:ring-1 focus:ring-slate-900"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-600 font-semibold mb-1">Tuition Payment Deadline</label>
                <input
                  type="date"
                  value={editingPeriod.paymentDeadline || ''}
                  onChange={(e) => setEditingPeriod({ ...editingPeriod, paymentDeadline: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg focus:ring-1 focus:ring-slate-900"
                />
              </div>

              <div className="p-4 bg-slate-50 -mx-6 -mb-6 mt-6 border-t border-slate-200 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setEditingPeriod(null)}
                  className="px-4 py-2 font-semibold text-slate-600 hover:bg-slate-200 rounded-lg transition cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 font-semibold bg-slate-900 text-white hover:bg-slate-800 rounded-lg shadow-sm transition cursor-pointer"
                >
                  Save Settings
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
