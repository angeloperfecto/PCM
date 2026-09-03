'use client';

import React, { useState } from 'react';
import { usePCM } from '@/lib/store';
import { AcademicSubject } from '@/lib/types';
import {
  BookOpen,
  Search,
  Plus,
  Edit2,
  Trash2,
  Copy,
  CheckCircle2,
  XCircle,
  X,
  Filter,
  Users,
  Clock,
  Layers,
} from 'lucide-react';

export const SubjectsCatalogAdminView: React.FC = () => {
  const {
    academicSubjects,
    addAcademicSubject,
    updateAcademicSubject,
    deleteAcademicSubject,
    duplicateAcademicSubject,
    academicPeriods,
    instructors,
    canPerformEnrollmentAction,
    addToast,
    programs,
  } = usePCM();

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedSemester, setSelectedSemester] = useState('all');
  const [selectedYearLevel, setSelectedYearLevel] = useState('all');

  // Modals
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingSubject, setEditingSubject] = useState<AcademicSubject | null>(null);
  const [cloningSubject, setCloningSubject] = useState<AcademicSubject | null>(null);
  const [cloneTargetYear, setCloneTargetYear] = useState('2026–2027');
  const [cloneTargetSem, setCloneTargetSem] = useState('2nd Semester');

  const [formData, setFormData] = useState({
    code: '',
    title: '',
    units: 3,
    lectureHours: 3,
    labHours: 0,
    prerequisites: [] as string[],
    prerequisitesText: '',
    description: '',
    yearLevel: '1st Year',
    semester: '1st Semester',
    academicYear: '2026–2027',
    department: 'Theological Studies',
    instructor: 'Dr. Mario Mendoza',
    maxCapacity: 35,
    status: 'Open' as const,
  });

  const filteredSubjects = academicSubjects.filter((subj) => {
    const query = searchQuery.toLowerCase();
    const matchesSearch =
      subj.code.toLowerCase().includes(query) ||
      subj.title.toLowerCase().includes(query) ||
      (subj.instructor || '').toLowerCase().includes(query);

    const matchesSem = selectedSemester === 'all' || subj.semester === selectedSemester;
    const matchesYear = selectedYearLevel === 'all' || subj.yearLevel === selectedYearLevel;
    return matchesSearch && matchesSem && matchesYear;
  });

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.code.trim() || !formData.title.trim()) {
      addToast('error', 'Missing Information', 'Please provide subject code and descriptive title.');
      return;
    }

    const prereqs = formData.prerequisitesText
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean);

    await addAcademicSubject({
      code: formData.code.trim().toUpperCase(),
      title: formData.title.trim(),
      units: Number(formData.units),
      lectureHours: Number(formData.lectureHours),
      labHours: Number(formData.labHours),
      prerequisites: prereqs,
      description: formData.description.trim(),
      yearLevel: formData.yearLevel,
      semester: formData.semester,
      academicYear: formData.academicYear,
      department: formData.department,
      instructor: formData.instructor,
      maxCapacity: Number(formData.maxCapacity),
      enrolledCount: 0,
      status: formData.status,
    });

    setIsAddModalOpen(false);
    setFormData({
      code: '',
      title: '',
      units: 3,
      lectureHours: 3,
      labHours: 0,
      prerequisites: [],
      prerequisitesText: '',
      description: '',
      yearLevel: '1st Year',
      semester: '1st Semester',
      academicYear: '2026–2027',
      department: 'Theological Studies',
      instructor: 'Dr. Mario Mendoza',
      maxCapacity: 35,
      status: 'Open',
    });
  };

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingSubject) return;
    await updateAcademicSubject(editingSubject.id, editingSubject);
    setEditingSubject(null);
  };

  const handleClone = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!cloningSubject) return;
    await duplicateAcademicSubject(cloningSubject.id, cloneTargetYear, cloneTargetSem);
    setCloningSubject(null);
  };

  const handleDelete = async (subject: AcademicSubject) => {
    if (confirm(`Remove course ${subject.code} (${subject.title}) from the catalog?`)) {
      await deleteAcademicSubject(subject.id);
    }
  };

  return (
    <div className="space-y-5">
      {/* Header & Controls */}
      <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h3 className="font-serif font-bold text-lg text-slate-900 flex items-center gap-2">
              <BookOpen className="w-5 h-5 text-[#18392B]" />
              <span>Institutional Curriculum & Courses Catalog</span>
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Maintain academic course master records, credit units, prerequisites, lecture hours, and assign instructors.
            </p>
          </div>

          <div className="flex items-center gap-2">
            {canPerformEnrollmentAction('manage_subjects') && (
              <button
                onClick={() => setIsAddModalOpen(true)}
                className="text-xs font-semibold px-3.5 py-2 rounded-lg bg-[#18392B] text-white hover:bg-[#23523e] transition flex items-center gap-1.5 cursor-pointer shadow-xs"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add New Course</span>
              </button>
            )}
          </div>
        </div>

        {/* Search & Filters */}
        <div className="grid grid-cols-1 sm:grid-cols-3 md:grid-cols-4 gap-3 mt-4 pt-4 border-t border-slate-100">
          <div className="sm:col-span-2 relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              placeholder="Search by subject code, title, or instructor..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-2 text-xs rounded-lg border border-slate-200 focus:outline-none focus:ring-1 focus:ring-[#18392B]"
            />
          </div>

          <div>
            <select
              value={selectedSemester}
              onChange={(e) => setSelectedSemester(e.target.value)}
              className="w-full px-3 py-2 text-xs rounded-lg border border-slate-200 focus:outline-none focus:ring-1 focus:ring-[#18392B] bg-white text-slate-700"
            >
              <option value="all">All Semesters</option>
              <option value="1st Semester">1st Semester</option>
              <option value="2nd Semester">2nd Semester</option>
              <option value="Summer">Summer</option>
            </select>
          </div>

          <div>
            <select
              value={selectedYearLevel}
              onChange={(e) => setSelectedYearLevel(e.target.value)}
              className="w-full px-3 py-2 text-xs rounded-lg border border-slate-200 focus:outline-none focus:ring-1 focus:ring-[#18392B] bg-white text-slate-700"
            >
              <option value="all">All Year Levels</option>
              <option value="1st Year">1st Year</option>
              <option value="2nd Year">2nd Year</option>
              <option value="3rd Year">3rd Year</option>
              <option value="4th Year">4th Year</option>
            </select>
          </div>
        </div>
      </div>

      {/* Catalog Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-600">
            <thead className="bg-slate-50 text-slate-700 font-semibold border-b border-slate-200">
              <tr>
                <th className="py-3 px-4">Subject Code</th>
                <th className="py-3 px-4">Descriptive Title</th>
                <th className="py-3 px-4 text-center">Units</th>
                <th className="py-3 px-4">Prerequisites</th>
                <th className="py-3 px-4">Term & Year</th>
                <th className="py-3 px-4">Instructor</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4 text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredSubjects.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-slate-400">
                    <BookOpen className="w-8 h-8 mx-auto mb-2 opacity-40" />
                    <p className="font-medium text-sm">No courses matching your criteria</p>
                  </td>
                </tr>
              ) : (
                filteredSubjects.map((subj) => {
                  return (
                    <tr key={subj.id} className="hover:bg-slate-50/70 transition">
                      <td className="py-3 px-4 font-mono font-bold text-[#18392B]">
                        {subj.code}
                      </td>

                      <td className="py-3 px-4">
                        <div className="font-semibold text-slate-900">{subj.title}</div>
                        <div className="text-[11px] text-slate-400">
                          {subj.department || 'Theological Studies'} &bull; Lec: {subj.lectureHours || 3}h / Lab: {subj.labHours || 0}h
                        </div>
                      </td>

                      <td className="py-3 px-4 text-center font-mono font-bold text-slate-900">
                        {subj.units}
                      </td>

                      <td className="py-3 px-4">
                        {subj.prerequisites && subj.prerequisites.length > 0 ? (
                          <div className="flex flex-wrap gap-1">
                            {subj.prerequisites.map((p) => (
                              <span key={p} className="text-[10px] bg-slate-100 text-slate-700 px-1.5 py-0.5 rounded font-mono">
                                {p}
                              </span>
                            ))}
                          </div>
                        ) : (
                          <span className="text-[11px] text-slate-400 italic">None</span>
                        )}
                      </td>

                      <td className="py-3 px-4">
                        <div className="text-slate-900 font-medium">{subj.semester}</div>
                        <div className="text-[11px] text-slate-500">{subj.yearLevel}</div>
                      </td>

                      <td className="py-3 px-4 text-slate-700">
                        {subj.instructor || 'Faculty TBA'}
                      </td>

                      <td className="py-3 px-4">
                        <span
                          className={`inline-block text-[10px] px-2 py-0.5 rounded-full font-semibold border ${
                            subj.status === 'Open'
                              ? 'bg-emerald-100 text-emerald-800 border-emerald-300'
                              : 'bg-rose-100 text-rose-800 border-rose-300'
                          }`}
                        >
                          {subj.status}
                        </span>
                      </td>

                      <td className="py-3 px-4">
                        <div className="flex items-center justify-center gap-1.5">
                          {/* Clone / Duplicate */}
                          {canPerformEnrollmentAction('manage_subjects') && (
                            <button
                              title="Duplicate to another term"
                              onClick={() => setCloningSubject(subj)}
                              className="p-1.5 rounded-lg text-slate-500 hover:bg-slate-100 transition cursor-pointer"
                            >
                              <Copy className="w-4 h-4" />
                            </button>
                          )}

                          {/* Edit */}
                          {canPerformEnrollmentAction('manage_subjects') && (
                            <button
                              title="Edit Course"
                              onClick={() => setEditingSubject(subj)}
                              className="p-1.5 rounded-lg text-slate-600 hover:bg-slate-100 transition cursor-pointer"
                            >
                              <Edit2 className="w-4 h-4" />
                            </button>
                          )}

                          {/* Delete */}
                          {canPerformEnrollmentAction('manage_subjects') && (
                            <button
                              title="Delete Course"
                              onClick={() => handleDelete(subj)}
                              className="p-1.5 rounded-lg text-rose-600 hover:bg-rose-50 transition cursor-pointer"
                            >
                              <Trash2 className="w-4 h-4" />
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

      {/* ADD SUBJECT MODAL */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl max-w-xl w-full shadow-2xl overflow-hidden animate-in fade-in zoom-in-95">
            <div className="p-5 bg-[#18392B] text-white flex items-center justify-between">
              <div>
                <h3 className="text-lg font-bold font-serif">Add Academic Subject</h3>
                <p className="text-xs text-[#A3D9C9]">Create new course syllabus entry in catalog</p>
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
                  <label className="block text-slate-600 font-semibold mb-1">Subject Code *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. THEO201"
                    value={formData.code}
                    onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg font-mono font-bold uppercase focus:ring-1 focus:ring-[#18392B]"
                  />
                </div>

                <div>
                  <label className="block text-slate-600 font-semibold mb-1">Credit Units *</label>
                  <input
                    type="number"
                    required
                    min={1}
                    max={12}
                    value={formData.units}
                    onChange={(e) => setFormData({ ...formData, units: Number(e.target.value) })}
                    className="w-full px-3 py-2 border rounded-lg font-mono focus:ring-1 focus:ring-[#18392B]"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-600 font-semibold mb-1">Descriptive Title *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Systematic Theology I"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg focus:ring-1 focus:ring-[#18392B]"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-600 font-semibold mb-1">Semester</label>
                  <select
                    value={formData.semester}
                    onChange={(e) => setFormData({ ...formData, semester: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg bg-white focus:ring-1 focus:ring-[#18392B]"
                  >
                    <option value="1st Semester">1st Semester</option>
                    <option value="2nd Semester">2nd Semester</option>
                    <option value="Summer">Summer</option>
                  </select>
                </div>

                <div>
                  <label className="block text-slate-600 font-semibold mb-1">Year Level</label>
                  <select
                    value={formData.yearLevel}
                    onChange={(e) => setFormData({ ...formData, yearLevel: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg bg-white focus:ring-1 focus:ring-[#18392B]"
                  >
                    <option value="1st Year">1st Year</option>
                    <option value="2nd Year">2nd Year</option>
                    <option value="3rd Year">3rd Year</option>
                    <option value="4th Year">4th Year</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-slate-600 font-semibold mb-1">Prerequisites (Comma-separated)</label>
                <input
                  type="text"
                  placeholder="e.g. THEO101, BIBL102"
                  value={formData.prerequisitesText}
                  onChange={(e) => setFormData({ ...formData, prerequisitesText: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg font-mono focus:ring-1 focus:ring-[#18392B]"
                />
              </div>

              <div>
                <label className="block text-slate-600 font-semibold mb-1">Instructor Assigned</label>
                <select
                  value={formData.instructor}
                  onChange={(e) => setFormData({ ...formData, instructor: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg bg-white focus:ring-1 focus:ring-[#18392B]"
                >
                  {instructors.map((i) => (
                    <option key={i.id} value={i.fullName}>
                      {i.fullName} ({i.department})
                    </option>
                  ))}
                  {instructors.length === 0 && (
                    <option value="Dr. Mario Mendoza">Dr. Mario Mendoza</option>
                  )}
                </select>
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
                  Create Course
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* EDIT SUBJECT MODAL */}
      {editingSubject && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl max-w-xl w-full shadow-2xl overflow-hidden animate-in fade-in zoom-in-95">
            <div className="p-5 bg-slate-900 text-white flex items-center justify-between">
              <div>
                <h3 className="text-lg font-bold font-serif">Edit Course Details</h3>
                <p className="text-xs text-slate-400 font-mono">{editingSubject.code}</p>
              </div>
              <button
                onClick={() => setEditingSubject(null)}
                className="p-1.5 rounded-lg text-white/80 hover:text-white hover:bg-white/10 transition cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleUpdate} className="p-6 space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-600 font-semibold mb-1">Subject Code</label>
                  <input
                    type="text"
                    required
                    value={editingSubject.code}
                    onChange={(e) => setEditingSubject({ ...editingSubject, code: e.target.value.toUpperCase() })}
                    className="w-full px-3 py-2 border rounded-lg font-mono font-bold focus:ring-1 focus:ring-slate-900"
                  />
                </div>

                <div>
                  <label className="block text-slate-600 font-semibold mb-1">Credit Units</label>
                  <input
                    type="number"
                    required
                    min={1}
                    value={editingSubject.units}
                    onChange={(e) => setEditingSubject({ ...editingSubject, units: Number(e.target.value) })}
                    className="w-full px-3 py-2 border rounded-lg font-mono focus:ring-1 focus:ring-slate-900"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-600 font-semibold mb-1">Descriptive Title</label>
                <input
                  type="text"
                  required
                  value={editingSubject.title}
                  onChange={(e) => setEditingSubject({ ...editingSubject, title: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg focus:ring-1 focus:ring-slate-900"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-600 font-semibold mb-1">Status</label>
                  <select
                    value={editingSubject.status}
                    onChange={(e) => setEditingSubject({ ...editingSubject, status: e.target.value as any })}
                    className="w-full px-3 py-2 border rounded-lg bg-white focus:ring-1 focus:ring-slate-900"
                  >
                    <option value="Open">Open</option>
                    <option value="Closed">Closed</option>
                  </select>
                </div>

                <div>
                  <label className="block text-slate-600 font-semibold mb-1">Instructor</label>
                  <input
                    type="text"
                    value={editingSubject.instructor || ''}
                    onChange={(e) => setEditingSubject({ ...editingSubject, instructor: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg focus:ring-1 focus:ring-slate-900"
                  />
                </div>
              </div>

              <div className="p-4 bg-slate-50 -mx-6 -mb-6 mt-6 border-t border-slate-200 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setEditingSubject(null)}
                  className="px-4 py-2 font-semibold text-slate-600 hover:bg-slate-200 rounded-lg transition cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 font-semibold bg-slate-900 text-white hover:bg-slate-800 rounded-lg shadow-sm transition cursor-pointer"
                >
                  Save Subject
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* CLONE SUBJECT MODAL */}
      {cloningSubject && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full shadow-2xl overflow-hidden animate-in fade-in zoom-in-95">
            <div className="p-5 bg-blue-900 text-white flex items-center justify-between">
              <div>
                <h3 className="text-lg font-bold font-serif">Clone Course to Semester</h3>
                <p className="text-xs text-blue-200">
                  {cloningSubject.code} &mdash; {cloningSubject.title}
                </p>
              </div>
              <button
                onClick={() => setCloningSubject(null)}
                className="p-1.5 rounded-lg text-white/80 hover:text-white hover:bg-white/10 transition cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleClone} className="p-5 space-y-4 text-xs">
              <div>
                <label className="block text-slate-600 font-semibold mb-1">Target Academic Year *</label>
                <input
                  type="text"
                  required
                  value={cloneTargetYear}
                  onChange={(e) => setCloneTargetYear(e.target.value)}
                  className="w-full px-3 py-2 border rounded-lg focus:ring-1 focus:ring-blue-900"
                />
              </div>

              <div>
                <label className="block text-slate-600 font-semibold mb-1">Target Semester *</label>
                <select
                  value={cloneTargetSem}
                  onChange={(e) => setCloneTargetSem(e.target.value)}
                  className="w-full px-3 py-2 border rounded-lg bg-white focus:ring-1 focus:ring-blue-900"
                >
                  <option value="1st Semester">1st Semester</option>
                  <option value="2nd Semester">2nd Semester</option>
                  <option value="Summer">Summer</option>
                </select>
              </div>

              <div className="p-4 bg-slate-50 -mx-5 -mb-5 mt-5 border-t border-slate-200 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setCloningSubject(null)}
                  className="px-4 py-2 font-semibold text-slate-600 hover:bg-slate-200 rounded-lg transition cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 font-semibold bg-blue-900 text-white hover:bg-blue-800 rounded-lg shadow-sm transition cursor-pointer flex items-center gap-1"
                >
                  <Copy className="w-3.5 h-3.5" />
                  <span>Duplicate Subject</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
