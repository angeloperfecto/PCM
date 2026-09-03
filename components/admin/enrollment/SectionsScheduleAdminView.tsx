'use client';

import React, { useState } from 'react';
import { usePCM } from '@/lib/store';
import { ClassSection } from '@/lib/types';
import {
  Layers,
  Search,
  Plus,
  Edit2,
  Trash2,
  Users,
  MapPin,
  Clock,
  CheckCircle2,
  AlertCircle,
  X,
  ArrowRightLeft,
  BookOpen,
} from 'lucide-react';

export const SectionsScheduleAdminView: React.FC = () => {
  const {
    classSections,
    academicSubjects,
    instructors,
    students,
    addClassSection,
    updateClassSection,
    deleteClassSection,
    transferStudentSection,
    canPerformEnrollmentAction,
    addToast,
  } = usePCM();

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedDay, setSelectedDay] = useState('all');

  // Modals
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingSection, setEditingSection] = useState<ClassSection | null>(null);
  const [viewingRosterSection, setViewingRosterSection] = useState<ClassSection | null>(null);

  // Transfer modal
  const [isTransferModalOpen, setIsTransferModalOpen] = useState(false);
  const [transferStudentId, setTransferStudentId] = useState('');
  const [transferTargetSectionId, setTransferTargetSectionId] = useState('');

  const [formData, setFormData] = useState({
    sectionCode: 'SEC-THEO101-A',
    sectionName: 'Section A &mdash; Morning',
    subjectCode: 'THEO101',
    subjectTitle: 'Old Testament Survey',
    instructorName: 'Dr. Mario Mendoza',
    room: 'Hall 101, Main Building',
    days: 'Mon / Wed / Fri',
    timeSlot: '08:00 AM - 09:30 AM',
    maxCapacity: 35,
    academicYear: '2026–2027',
    semester: '1st Semester',
    status: 'Open' as const,
  });

  const filteredSections = classSections.filter((sec) => {
    const query = searchQuery.toLowerCase();
    const matchesSearch =
      sec.sectionCode.toLowerCase().includes(query) ||
      sec.sectionName.toLowerCase().includes(query) ||
      sec.subjectCode.toLowerCase().includes(query) ||
      sec.subjectTitle.toLowerCase().includes(query) ||
      sec.instructorName.toLowerCase().includes(query);

    const matchesDay = selectedDay === 'all' || sec.days.toLowerCase().includes(selectedDay.toLowerCase());
    return matchesSearch && matchesDay;
  });

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    const subj = academicSubjects.find((s) => s.code === formData.subjectCode);

    await addClassSection({
      sectionCode: formData.sectionCode.trim().toUpperCase(),
      sectionName: formData.sectionName.trim(),
      subjectCode: formData.subjectCode.trim().toUpperCase(),
      subjectTitle: subj ? subj.title : formData.subjectTitle.trim(),
      instructorName: formData.instructorName.trim(),
      room: formData.room.trim(),
      days: formData.days.trim(),
      timeSlot: formData.timeSlot.trim(),
      maxCapacity: Number(formData.maxCapacity),
      enrolledCount: 0,
      enrolledStudentIds: [],
      academicYear: formData.academicYear,
      semester: formData.semester,
      status: formData.status,
    });

    setIsAddModalOpen(false);
  };

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingSection) return;
    await updateClassSection(editingSection.id, editingSection);
    setEditingSection(null);
  };

  const handleDelete = async (section: ClassSection) => {
    if (section.enrolledCount > 0) {
      if (!confirm(`${section.sectionName} currently has ${section.enrolledCount} enrolled students. Proceed with removal?`)) {
        return;
      }
    }
    await deleteClassSection(section.id);
  };

  const handleExecuteTransfer = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!viewingRosterSection || !transferStudentId || !transferTargetSectionId) return;

    const success = await transferStudentSection(
      transferStudentId,
      viewingRosterSection.id,
      transferTargetSectionId
    );

    if (success) {
      setIsTransferModalOpen(false);
      setTransferStudentId('');
      setViewingRosterSection(null);
    }
  };

  return (
    <div className="space-y-5">
      {/* Header & Controls */}
      <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h3 className="font-serif font-bold text-lg text-slate-900 flex items-center gap-2">
              <Layers className="w-5 h-5 text-[#18392B]" />
              <span>Class Sections, Schedules & Venue Allocations</span>
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Control room capacity, class schedules, enrolled rosters, and cross-section student transfers.
            </p>
          </div>

          <div className="flex items-center gap-2">
            {canPerformEnrollmentAction('manage_sections') && (
              <button
                onClick={() => setIsAddModalOpen(true)}
                className="text-xs font-semibold px-3.5 py-2 rounded-lg bg-[#18392B] text-white hover:bg-[#23523e] transition flex items-center gap-1.5 cursor-pointer shadow-xs"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Create Class Section</span>
              </button>
            )}
          </div>
        </div>

        {/* Search & Filter */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mt-4 pt-4 border-t border-slate-100">
          <div className="sm:col-span-2 relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              placeholder="Search by section, course, room, or faculty..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-2 text-xs rounded-lg border border-slate-200 focus:outline-none focus:ring-1 focus:ring-[#18392B]"
            />
          </div>

          <div>
            <select
              value={selectedDay}
              onChange={(e) => setSelectedDay(e.target.value)}
              className="w-full px-3 py-2 text-xs rounded-lg border border-slate-200 focus:outline-none focus:ring-1 focus:ring-[#18392B] bg-white text-slate-700"
            >
              <option value="all">All Meeting Days</option>
              <option value="Mon">Monday Schedules</option>
              <option value="Tue">Tuesday / Thursday</option>
              <option value="Wed">Wednesday / Friday</option>
              <option value="Sat">Saturday Weekend Sessions</option>
            </select>
          </div>
        </div>
      </div>

      {/* Sections Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {filteredSections.map((sec) => {
          const percentFull = Math.min(100, Math.round((sec.enrolledCount / sec.maxCapacity) * 100));
          const isFull = sec.enrolledCount >= sec.maxCapacity;

          return (
            <div
              key={sec.id}
              className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs hover:border-slate-300 transition flex flex-col justify-between"
            >
              <div>
                <div className="flex items-start justify-between gap-2 mb-2">
                  <div>
                    <span className="text-[10px] font-mono font-bold text-[#18392B] bg-emerald-50 px-2 py-0.5 rounded">
                      {sec.sectionCode}
                    </span>
                    <h4 className="font-serif font-bold text-slate-900 text-sm mt-1">
                      {sec.sectionName}
                    </h4>
                  </div>
                  <span
                    className={`text-[10px] px-2 py-0.5 rounded-full font-semibold border ${
                      isFull
                        ? 'bg-rose-100 text-rose-800 border-rose-300'
                        : sec.status === 'Open'
                        ? 'bg-emerald-100 text-emerald-800 border-emerald-300'
                        : 'bg-amber-100 text-amber-800 border-amber-300'
                    }`}
                  >
                    {isFull ? 'Full' : sec.status}
                  </span>
                </div>

                <div className="text-xs text-slate-700 font-semibold mb-3">
                  {sec.subjectCode} &mdash; {sec.subjectTitle}
                </div>

                <div className="space-y-1.5 text-xs text-slate-600 bg-slate-50 p-3 rounded-lg border border-slate-200 mb-4">
                  <div className="flex items-center gap-2">
                    <Clock className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                    <span>{sec.days} &bull; {sec.timeSlot}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                    <span>{sec.room || 'Main Academic Hall'}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Users className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                    <span>{sec.instructorName}</span>
                  </div>
                </div>

                {/* Capacity Progress */}
                <div className="mb-4">
                  <div className="flex justify-between text-[11px] mb-1">
                    <span className="text-slate-500 font-medium">Classroom Capacity</span>
                    <span className="font-mono font-bold text-slate-900">
                      {sec.enrolledCount} / {sec.maxCapacity} students ({percentFull}%)
                    </span>
                  </div>
                  <div className="w-full h-2 rounded-full bg-slate-100 overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all ${
                        percentFull >= 100
                          ? 'bg-rose-500'
                          : percentFull > 80
                          ? 'bg-amber-500'
                          : 'bg-emerald-600'
                      }`}
                      style={{ width: `${percentFull}%` }}
                    />
                  </div>
                </div>
              </div>

              {/* Actions */}
              <div className="flex items-center justify-between pt-3 border-t border-slate-100">
                <button
                  onClick={() => setViewingRosterSection(sec)}
                  className="text-xs font-semibold text-[#18392B] hover:underline cursor-pointer flex items-center gap-1"
                >
                  <Users className="w-3.5 h-3.5" />
                  <span>View Student Roster</span>
                </button>

                <div className="flex items-center gap-1">
                  {canPerformEnrollmentAction('manage_sections') && (
                    <>
                      <button
                        title="Edit Section"
                        onClick={() => setEditingSection(sec)}
                        className="p-1.5 rounded-lg text-slate-600 hover:bg-slate-100 transition cursor-pointer"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button
                        title="Delete Section"
                        onClick={() => handleDelete(sec)}
                        className="p-1.5 rounded-lg text-rose-600 hover:bg-rose-50 transition cursor-pointer"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* VIEW ROSTER MODAL */}
      {viewingRosterSection && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl max-w-2xl w-full shadow-2xl overflow-hidden animate-in fade-in zoom-in-95">
            <div className="p-5 bg-[#18392B] text-white flex items-center justify-between">
              <div>
                <span className="text-xs text-[#A3D9C9] font-mono">{viewingRosterSection.sectionCode}</span>
                <h3 className="text-lg font-bold font-serif">{viewingRosterSection.sectionName}</h3>
                <p className="text-xs text-slate-300">
                  {viewingRosterSection.subjectCode} &mdash; {viewingRosterSection.subjectTitle}
                </p>
              </div>
              <button
                onClick={() => setViewingRosterSection(null)}
                className="p-1.5 rounded-lg text-white/80 hover:text-white hover:bg-white/10 transition cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-4 text-xs">
              <div className="flex justify-between items-center bg-slate-50 p-3 rounded-lg border border-slate-200">
                <div>
                  <span className="text-slate-500 block text-[11px]">Enrolled Students</span>
                  <span className="text-base font-bold text-slate-900 font-mono">
                    {viewingRosterSection.enrolledCount} / {viewingRosterSection.maxCapacity}
                  </span>
                </div>
                <div className="text-right">
                  <span className="text-slate-500 block text-[11px]">Instructor & Venue</span>
                  <span className="font-semibold text-slate-900">
                    {viewingRosterSection.instructorName} &bull; {viewingRosterSection.room}
                  </span>
                </div>
              </div>

              {/* Enrolled Students Table */}
              <div className="border border-slate-200 rounded-lg overflow-hidden">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-100 text-slate-700 font-semibold">
                    <tr>
                      <th className="py-2.5 px-3">Student ID</th>
                      <th className="py-2.5 px-3">Student Name</th>
                      <th className="py-2.5 px-3">Program</th>
                      <th className="py-2.5 px-3 text-center">Transfer</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {(viewingRosterSection.enrolledStudentIds || []).length === 0 ? (
                      <tr>
                        <td colSpan={4} className="py-6 text-center text-slate-400">
                          No students currently registered in this specific section.
                        </td>
                      </tr>
                    ) : (
                      viewingRosterSection.enrolledStudentIds?.map((sid) => {
                        const studentObj = students.find((s) => s.id === sid || s.studentId === sid);
                        return (
                          <tr key={sid}>
                            <td className="py-2.5 px-3 font-mono font-bold text-[#18392B]">{sid}</td>
                            <td className="py-2.5 px-3 font-medium text-slate-900">
                              {studentObj ? studentObj.fullName || studentObj.name : 'Registered Student'}
                            </td>
                            <td className="py-2.5 px-3 text-slate-500">
                              {studentObj ? studentObj.degreeProgram || studentObj.program : 'Theology'}
                            </td>
                            <td className="py-2.5 px-3 text-center">
                              {canPerformEnrollmentAction('manage_sections') && (
                                <button
                                  onClick={() => {
                                    setTransferStudentId(sid);
                                    setIsTransferModalOpen(true);
                                  }}
                                  className="px-2 py-1 rounded bg-blue-50 text-blue-700 hover:bg-blue-100 font-semibold text-[11px] transition cursor-pointer inline-flex items-center gap-1"
                                >
                                  <ArrowRightLeft className="w-3 h-3" />
                                  <span>Transfer</span>
                                </button>
                              )}
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="p-4 bg-slate-50 border-t border-slate-200 flex justify-end">
              <button
                onClick={() => setViewingRosterSection(null)}
                className="px-4 py-2 text-xs font-semibold rounded-lg bg-slate-200 text-slate-700 hover:bg-slate-300 transition cursor-pointer"
              >
                Close Roster
              </button>
            </div>
          </div>
        </div>
      )}

      {/* TRANSFER STUDENT MODAL */}
      {isTransferModalOpen && viewingRosterSection && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full shadow-2xl overflow-hidden animate-in fade-in zoom-in-95">
            <div className="p-5 bg-blue-900 text-white flex items-center justify-between">
              <div>
                <h3 className="text-lg font-bold font-serif">Transfer Student Section</h3>
                <p className="text-xs text-blue-200">Reassign student to alternative class section</p>
              </div>
              <button
                onClick={() => setIsTransferModalOpen(false)}
                className="p-1.5 rounded-lg text-white/80 hover:text-white hover:bg-white/10 transition cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleExecuteTransfer} className="p-5 space-y-4 text-xs">
              <div>
                <span className="text-slate-500 block text-[11px]">Transferring Student:</span>
                <span className="font-bold text-slate-900 text-sm font-mono">{transferStudentId}</span>
              </div>

              <div>
                <label className="block text-slate-600 font-semibold mb-1">Select Target Section *</label>
                <select
                  required
                  value={transferTargetSectionId}
                  onChange={(e) => setTransferTargetSectionId(e.target.value)}
                  className="w-full px-3 py-2 border rounded-lg bg-white focus:ring-1 focus:ring-blue-900"
                >
                  <option value="">Select an open class section...</option>
                  {classSections
                    .filter((s) => s.id !== viewingRosterSection.id)
                    .map((sec) => (
                      <option
                        key={sec.id}
                        value={sec.id}
                        disabled={sec.enrolledCount >= sec.maxCapacity}
                      >
                        {sec.sectionName} ({sec.sectionCode}) &mdash; {sec.days} ({sec.enrolledCount}/{sec.maxCapacity})
                      </option>
                    ))}
                </select>
              </div>

              <div className="p-4 bg-slate-50 -mx-5 -mb-5 mt-5 border-t border-slate-200 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsTransferModalOpen(false)}
                  className="px-4 py-2 font-semibold text-slate-600 hover:bg-slate-200 rounded-lg transition cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 font-semibold bg-blue-900 text-white hover:bg-blue-800 rounded-lg shadow-sm transition cursor-pointer"
                >
                  Confirm Transfer
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* CREATE SECTION MODAL */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl max-w-xl w-full shadow-2xl overflow-hidden animate-in fade-in zoom-in-95">
            <div className="p-5 bg-[#18392B] text-white flex items-center justify-between">
              <div>
                <h3 className="text-lg font-bold font-serif">Create Class Section</h3>
                <p className="text-xs text-[#A3D9C9]">Set meeting times, room, and capacity limit</p>
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
                  <label className="block text-slate-600 font-semibold mb-1">Section Code *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. SEC-THEO101-A"
                    value={formData.sectionCode}
                    onChange={(e) => setFormData({ ...formData, sectionCode: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg font-mono font-bold uppercase focus:ring-1 focus:ring-[#18392B]"
                  />
                </div>

                <div>
                  <label className="block text-slate-600 font-semibold mb-1">Max Capacity *</label>
                  <input
                    type="number"
                    required
                    min={5}
                    max={100}
                    value={formData.maxCapacity}
                    onChange={(e) => setFormData({ ...formData, maxCapacity: Number(e.target.value) })}
                    className="w-full px-3 py-2 border rounded-lg font-mono focus:ring-1 focus:ring-[#18392B]"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-600 font-semibold mb-1">Section Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Section A - Morning Cohort"
                  value={formData.sectionName}
                  onChange={(e) => setFormData({ ...formData, sectionName: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg focus:ring-1 focus:ring-[#18392B]"
                />
              </div>

              <div>
                <label className="block text-slate-600 font-semibold mb-1">Subject *</label>
                <select
                  value={formData.subjectCode}
                  onChange={(e) => setFormData({ ...formData, subjectCode: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg bg-white focus:ring-1 focus:ring-[#18392B]"
                >
                  {academicSubjects.map((s) => (
                    <option key={s.id} value={s.code}>
                      {s.code} &mdash; {s.title} ({s.units} units)
                    </option>
                  ))}
                  {academicSubjects.length === 0 && (
                    <option value="THEO101">THEO101 &mdash; Old Testament Survey</option>
                  )}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-600 font-semibold mb-1">Meeting Days</label>
                  <input
                    type="text"
                    value={formData.days}
                    onChange={(e) => setFormData({ ...formData, days: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg focus:ring-1 focus:ring-[#18392B]"
                  />
                </div>

                <div>
                  <label className="block text-slate-600 font-semibold mb-1">Time Slot</label>
                  <input
                    type="text"
                    value={formData.timeSlot}
                    onChange={(e) => setFormData({ ...formData, timeSlot: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg focus:ring-1 focus:ring-[#18392B]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-600 font-semibold mb-1">Room / Venue</label>
                  <input
                    type="text"
                    value={formData.room}
                    onChange={(e) => setFormData({ ...formData, room: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg focus:ring-1 focus:ring-[#18392B]"
                  />
                </div>

                <div>
                  <label className="block text-slate-600 font-semibold mb-1">Instructor</label>
                  <input
                    type="text"
                    value={formData.instructorName}
                    onChange={(e) => setFormData({ ...formData, instructorName: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg focus:ring-1 focus:ring-[#18392B]"
                  />
                </div>
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
                  Create Section
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* EDIT SECTION MODAL */}
      {editingSection && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl max-w-xl w-full shadow-2xl overflow-hidden animate-in fade-in zoom-in-95">
            <div className="p-5 bg-slate-900 text-white flex items-center justify-between">
              <div>
                <h3 className="text-lg font-bold font-serif">Edit Class Section</h3>
                <p className="text-xs text-slate-400 font-mono">{editingSection.sectionCode}</p>
              </div>
              <button
                onClick={() => setEditingSection(null)}
                className="p-1.5 rounded-lg text-white/80 hover:text-white hover:bg-white/10 transition cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleUpdate} className="p-6 space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-600 font-semibold mb-1">Section Name</label>
                  <input
                    type="text"
                    required
                    value={editingSection.sectionName}
                    onChange={(e) => setEditingSection({ ...editingSection, sectionName: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg focus:ring-1 focus:ring-slate-900"
                  />
                </div>

                <div>
                  <label className="block text-slate-600 font-semibold mb-1">Max Capacity</label>
                  <input
                    type="number"
                    required
                    min={editingSection.enrolledCount || 1}
                    value={editingSection.maxCapacity}
                    onChange={(e) => setEditingSection({ ...editingSection, maxCapacity: Number(e.target.value) })}
                    className="w-full px-3 py-2 border rounded-lg font-mono focus:ring-1 focus:ring-slate-900"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-600 font-semibold mb-1">Days</label>
                  <input
                    type="text"
                    value={editingSection.days}
                    onChange={(e) => setEditingSection({ ...editingSection, days: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg focus:ring-1 focus:ring-slate-900"
                  />
                </div>

                <div>
                  <label className="block text-slate-600 font-semibold mb-1">Time Slot</label>
                  <input
                    type="text"
                    value={editingSection.timeSlot}
                    onChange={(e) => setEditingSection({ ...editingSection, timeSlot: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg focus:ring-1 focus:ring-slate-900"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-600 font-semibold mb-1">Room / Venue</label>
                  <input
                    type="text"
                    value={editingSection.room}
                    onChange={(e) => setEditingSection({ ...editingSection, room: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg focus:ring-1 focus:ring-slate-900"
                  />
                </div>

                <div>
                  <label className="block text-slate-600 font-semibold mb-1">Status</label>
                  <select
                    value={editingSection.status}
                    onChange={(e) => setEditingSection({ ...editingSection, status: e.target.value as any })}
                    className="w-full px-3 py-2 border rounded-lg bg-white focus:ring-1 focus:ring-slate-900"
                  >
                    <option value="Open">Open</option>
                    <option value="Closed">Closed</option>
                    <option value="Waitlist">Waitlist</option>
                  </select>
                </div>
              </div>

              <div className="p-4 bg-slate-50 -mx-6 -mb-6 mt-6 border-t border-slate-200 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setEditingSection(null)}
                  className="px-4 py-2 font-semibold text-slate-600 hover:bg-slate-200 rounded-lg transition cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 font-semibold bg-slate-900 text-white hover:bg-slate-800 rounded-lg shadow-sm transition cursor-pointer"
                >
                  Save Section
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
