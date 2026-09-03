'use client';

import React, { useState } from 'react';
import { usePCM } from '@/lib/store';
import { InstructorRecord } from '@/lib/types';
import {
  Users,
  Search,
  Plus,
  Edit2,
  Trash2,
  Mail,
  Phone,
  BookOpen,
  Award,
  CheckCircle2,
  X,
  Briefcase,
} from 'lucide-react';

export const InstructorsAdminView: React.FC = () => {
  const {
    instructors,
    addInstructor,
    updateInstructor,
    deleteInstructor,
    canPerformEnrollmentAction,
    addToast,
  } = usePCM();

  const [searchQuery, setSearchQuery] = useState('');
  const [departmentFilter, setDepartmentFilter] = useState('all');

  // Modals
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingInstructor, setEditingInstructor] = useState<InstructorRecord | null>(null);

  const [formData, setFormData] = useState({
    fullName: '',
    title: 'Rev. Dr.',
    email: '',
    phone: '',
    department: 'Theological Studies',
    assignedSubjects: [] as string[],
    assignedSubjectsText: '',
    maxLoadUnits: 18,
    status: 'Active' as const,
  });

  const filteredInstructors = instructors.filter((inst) => {
    const query = searchQuery.toLowerCase();
    const matchesSearch =
      inst.fullName.toLowerCase().includes(query) ||
      inst.email.toLowerCase().includes(query) ||
      (inst.department || '').toLowerCase().includes(query);

    const matchesDept = departmentFilter === 'all' || inst.department === departmentFilter;
    return matchesSearch && matchesDept;
  });

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.fullName.trim() || !formData.email.trim()) {
      addToast('error', 'Missing Fields', 'Full name and institutional email are required.');
      return;
    }

    const assigned = formData.assignedSubjectsText
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean);

    await addInstructor({
      fullName: formData.fullName.trim(),
      title: formData.title,
      email: formData.email.trim(),
      phone: formData.phone.trim(),
      department: formData.department,
      assignedSubjects: assigned,
      currentLoadUnits: assigned.length * 3, // default estimation
      maxLoadUnits: Number(formData.maxLoadUnits),
      status: formData.status,
    });

    setIsAddModalOpen(false);
    setFormData({
      fullName: '',
      title: 'Rev. Dr.',
      email: '',
      phone: '',
      department: 'Theological Studies',
      assignedSubjects: [],
      assignedSubjectsText: '',
      maxLoadUnits: 18,
      status: 'Active',
    });
  };

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingInstructor) return;
    await updateInstructor(editingInstructor.id, editingInstructor);
    setEditingInstructor(null);
  };

  const handleDelete = async (inst: InstructorRecord) => {
    if (confirm(`Remove faculty member ${inst.fullName} from directory?`)) {
      await deleteInstructor(inst.id);
    }
  };

  return (
    <div className="space-y-5">
      {/* Header & Controls */}
      <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h3 className="font-serif font-bold text-lg text-slate-900 flex items-center gap-2">
              <Users className="w-5 h-5 text-[#18392B]" />
              <span>Faculty & Instructor Course Assignment</span>
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Manage theological faculty directory, teaching load quotas, and course subject assignments.
            </p>
          </div>

          <div className="flex items-center gap-2">
            {canPerformEnrollmentAction('manage_instructors') && (
              <button
                onClick={() => setIsAddModalOpen(true)}
                className="text-xs font-semibold px-3.5 py-2 rounded-lg bg-[#18392B] text-white hover:bg-[#23523e] transition flex items-center gap-1.5 cursor-pointer shadow-xs"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add Faculty Member</span>
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
              placeholder="Search faculty by name, email, or department..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-2 text-xs rounded-lg border border-slate-200 focus:outline-none focus:ring-1 focus:ring-[#18392B]"
            />
          </div>

          <div>
            <select
              value={departmentFilter}
              onChange={(e) => setDepartmentFilter(e.target.value)}
              className="w-full px-3 py-2 text-xs rounded-lg border border-slate-200 focus:outline-none focus:ring-1 focus:ring-[#18392B] bg-white text-slate-700"
            >
              <option value="all">All Departments</option>
              <option value="Theological Studies">Theological Studies</option>
              <option value="Pastoral & Biblical Ministry">Pastoral & Biblical Ministry</option>
              <option value="Christian Education">Christian Education</option>
              <option value="Cross-Cultural Missions">Cross-Cultural Missions</option>
            </select>
          </div>
        </div>
      </div>

      {/* Instructors Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {filteredInstructors.map((inst) => {
          const loadPercent = Math.min(100, Math.round((inst.currentLoadUnits / inst.maxLoadUnits) * 100));

          return (
            <div
              key={inst.id}
              className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs hover:border-slate-300 transition flex flex-col justify-between"
            >
              <div>
                <div className="flex items-start justify-between gap-2 mb-2">
                  <div>
                    <span className="text-[10px] text-slate-400 font-semibold uppercase">
                      {inst.title}
                    </span>
                    <h4 className="font-serif font-bold text-slate-900 text-base">
                      {inst.fullName}
                    </h4>
                    <span className="text-xs text-[#18392B] font-medium block">
                      {inst.department}
                    </span>
                  </div>

                  <span
                    className={`text-[10px] px-2 py-0.5 rounded-full font-semibold border ${
                      inst.status === 'Active'
                        ? 'bg-emerald-100 text-emerald-800 border-emerald-300'
                        : inst.status === 'On Leave'
                        ? 'bg-amber-100 text-amber-800 border-amber-300'
                        : 'bg-slate-100 text-slate-600 border-slate-300'
                    }`}
                  >
                    {inst.status}
                  </span>
                </div>

                <div className="space-y-1.5 text-xs text-slate-600 bg-slate-50 p-3 rounded-lg border border-slate-200 my-3">
                  <div className="flex items-center gap-2">
                    <Mail className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                    <span className="truncate">{inst.email}</span>
                  </div>
                  {inst.phone && (
                    <div className="flex items-center gap-2">
                      <Phone className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                      <span>{inst.phone}</span>
                    </div>
                  )}
                </div>

                {/* Teaching Load */}
                <div className="mb-3">
                  <div className="flex justify-between text-[11px] mb-1">
                    <span className="text-slate-500">Current Teaching Load</span>
                    <span className="font-mono font-bold text-slate-900">
                      {inst.currentLoadUnits} / {inst.maxLoadUnits} Units ({loadPercent}%)
                    </span>
                  </div>
                  <div className="w-full h-1.5 rounded-full bg-slate-100 overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all ${
                        loadPercent >= 100 ? 'bg-rose-500' : loadPercent > 80 ? 'bg-amber-500' : 'bg-emerald-600'
                      }`}
                      style={{ width: `${loadPercent}%` }}
                    />
                  </div>
                </div>

                {/* Assigned Subjects */}
                <div>
                  <span className="text-[11px] font-semibold text-slate-700 block mb-1">
                    Assigned Course Codes:
                  </span>
                  <div className="flex flex-wrap gap-1">
                    {(inst.assignedSubjects || []).map((code) => (
                      <span
                        key={code}
                        className="text-[10px] bg-slate-100 text-slate-700 font-mono px-2 py-0.5 rounded border border-slate-200"
                      >
                        {code}
                      </span>
                    ))}
                    {(!inst.assignedSubjects || inst.assignedSubjects.length === 0) && (
                      <span className="text-xs text-slate-400 italic">No assigned subjects</span>
                    )}
                  </div>
                </div>
              </div>

              {/* Actions */}
              <div className="flex items-center justify-end gap-1.5 pt-4 border-t border-slate-100 mt-4">
                {canPerformEnrollmentAction('manage_instructors') && (
                  <>
                    <button
                      title="Edit Instructor"
                      onClick={() => setEditingInstructor(inst)}
                      className="p-1.5 rounded-lg text-slate-600 hover:bg-slate-100 transition cursor-pointer"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>
                    <button
                      title="Delete Instructor"
                      onClick={() => handleDelete(inst)}
                      className="p-1.5 rounded-lg text-rose-600 hover:bg-rose-50 transition cursor-pointer"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* ADD INSTRUCTOR MODAL */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl max-w-lg w-full shadow-2xl overflow-hidden animate-in fade-in zoom-in-95">
            <div className="p-5 bg-[#18392B] text-white flex items-center justify-between">
              <div>
                <h3 className="text-lg font-bold font-serif">Add Faculty Member</h3>
                <p className="text-xs text-[#A3D9C9]">Register academic instructor in directory</p>
              </div>
              <button
                onClick={() => setIsAddModalOpen(false)}
                className="p-1.5 rounded-lg text-white/80 hover:text-white hover:bg-white/10 transition cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreate} className="p-6 space-y-4 text-xs">
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-slate-600 font-semibold mb-1">Title/Prefix</label>
                  <input
                    type="text"
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg focus:ring-1 focus:ring-[#18392B]"
                  />
                </div>

                <div className="col-span-2">
                  <label className="block text-slate-600 font-semibold mb-1">Full Name *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Mario Mendoza"
                    value={formData.fullName}
                    onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg focus:ring-1 focus:ring-[#18392B]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-600 font-semibold mb-1">Institutional Email *</label>
                  <input
                    type="email"
                    required
                    placeholder="mario.mendoza@pcm.edu.ph"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg focus:ring-1 focus:ring-[#18392B]"
                  />
                </div>

                <div>
                  <label className="block text-slate-600 font-semibold mb-1">Phone Number</label>
                  <input
                    type="text"
                    placeholder="+63 917 123 4567"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg focus:ring-1 focus:ring-[#18392B]"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-600 font-semibold mb-1">Department</label>
                <select
                  value={formData.department}
                  onChange={(e) => setFormData({ ...formData, department: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg bg-white focus:ring-1 focus:ring-[#18392B]"
                >
                  <option value="Theological Studies">Theological Studies</option>
                  <option value="Pastoral & Biblical Ministry">Pastoral & Biblical Ministry</option>
                  <option value="Christian Education">Christian Education</option>
                  <option value="Cross-Cultural Missions">Cross-Cultural Missions</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-600 font-semibold mb-1">Max Teaching Units</label>
                  <input
                    type="number"
                    min={3}
                    max={30}
                    value={formData.maxLoadUnits}
                    onChange={(e) => setFormData({ ...formData, maxLoadUnits: Number(e.target.value) })}
                    className="w-full px-3 py-2 border rounded-lg font-mono focus:ring-1 focus:ring-[#18392B]"
                  />
                </div>

                <div>
                  <label className="block text-slate-600 font-semibold mb-1">Status</label>
                  <select
                    value={formData.status}
                    onChange={(e) => setFormData({ ...formData, status: e.target.value as any })}
                    className="w-full px-3 py-2 border rounded-lg bg-white focus:ring-1 focus:ring-[#18392B]"
                  >
                    <option value="Active">Active Faculty</option>
                    <option value="On Leave">On Sabbatical / Leave</option>
                    <option value="Inactive">Inactive</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-slate-600 font-semibold mb-1">
                  Assigned Subject Codes (Comma-separated)
                </label>
                <input
                  type="text"
                  placeholder="e.g. THEO101, THEO201, BIBL102"
                  value={formData.assignedSubjectsText}
                  onChange={(e) => setFormData({ ...formData, assignedSubjectsText: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg font-mono focus:ring-1 focus:ring-[#18392B]"
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
                  Add Faculty
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* EDIT INSTRUCTOR MODAL */}
      {editingInstructor && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl max-w-lg w-full shadow-2xl overflow-hidden animate-in fade-in zoom-in-95">
            <div className="p-5 bg-slate-900 text-white flex items-center justify-between">
              <div>
                <h3 className="text-lg font-bold font-serif">Edit Faculty Member</h3>
                <p className="text-xs text-slate-400">{editingInstructor.fullName}</p>
              </div>
              <button
                onClick={() => setEditingInstructor(null)}
                className="p-1.5 rounded-lg text-white/80 hover:text-white hover:bg-white/10 transition cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleUpdate} className="p-6 space-y-4 text-xs">
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-slate-600 font-semibold mb-1">Title</label>
                  <input
                    type="text"
                    value={editingInstructor.title}
                    onChange={(e) => setEditingInstructor({ ...editingInstructor, title: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg focus:ring-1 focus:ring-slate-900"
                  />
                </div>

                <div className="col-span-2">
                  <label className="block text-slate-600 font-semibold mb-1">Full Name</label>
                  <input
                    type="text"
                    required
                    value={editingInstructor.fullName}
                    onChange={(e) => setEditingInstructor({ ...editingInstructor, fullName: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg focus:ring-1 focus:ring-slate-900"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-600 font-semibold mb-1">Email</label>
                  <input
                    type="email"
                    required
                    value={editingInstructor.email}
                    onChange={(e) => setEditingInstructor({ ...editingInstructor, email: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg focus:ring-1 focus:ring-slate-900"
                  />
                </div>

                <div>
                  <label className="block text-slate-600 font-semibold mb-1">Phone</label>
                  <input
                    type="text"
                    value={editingInstructor.phone || ''}
                    onChange={(e) => setEditingInstructor({ ...editingInstructor, phone: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg focus:ring-1 focus:ring-slate-900"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-600 font-semibold mb-1">Department</label>
                  <input
                    type="text"
                    value={editingInstructor.department}
                    onChange={(e) => setEditingInstructor({ ...editingInstructor, department: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg focus:ring-1 focus:ring-slate-900"
                  />
                </div>

                <div>
                  <label className="block text-slate-600 font-semibold mb-1">Max Units</label>
                  <input
                    type="number"
                    value={editingInstructor.maxLoadUnits}
                    onChange={(e) => setEditingInstructor({ ...editingInstructor, maxLoadUnits: Number(e.target.value) })}
                    className="w-full px-3 py-2 border rounded-lg font-mono focus:ring-1 focus:ring-slate-900"
                  />
                </div>
              </div>

              <div className="p-4 bg-slate-50 -mx-6 -mb-6 mt-6 border-t border-slate-200 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setEditingInstructor(null)}
                  className="px-4 py-2 font-semibold text-slate-600 hover:bg-slate-200 rounded-lg transition cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 font-semibold bg-slate-900 text-white hover:bg-slate-800 rounded-lg shadow-sm transition cursor-pointer"
                >
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
