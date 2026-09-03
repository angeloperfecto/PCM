'use client';

import React, { useState } from 'react';
import { usePCM } from '@/lib/store';
import { StudentProfile, DocumentVerificationStatus } from '@/lib/types';
import {
  Users,
  Search,
  Plus,
  Filter,
  Download,
  Eye,
  Edit2,
  Trash2,
  Archive,
  RotateCcw,
  CheckCircle2,
  Clock,
  AlertCircle,
  FileText,
  DollarSign,
  GraduationCap,
  Mail,
  Phone,
  MapPin,
  Calendar,
  Award,
  BookOpen,
  X,
  Check,
  Shield,
  FileCheck,
} from 'lucide-react';

export const StudentProfilesAdminView: React.FC = () => {
  const {
    students,
    studentProfile,
    createStudentProfile,
    updateStudentProfile,
    archiveStudentProfile,
    restoreStudentProfile,
    deleteStudentProfile,
    updateDocumentVerification,
    addStudentGrade,
    recordStudentPayment,
    programs,
    canPerformEnrollmentAction,
    addToast,
  } = usePCM();

  const allStudents = students.length > 0 ? students : [studentProfile];

  // Filters & Search
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedProgram, setSelectedProgram] = useState<string>('all');
  const [selectedAcademicStatus, setSelectedAcademicStatus] = useState<string>('all');
  const [selectedEnrollmentStatus, setSelectedEnrollmentStatus] = useState<string>('all');
  const [showArchived, setShowArchived] = useState(false);

  // Modals state
  const [viewingStudent, setViewingStudent] = useState<StudentProfile | null>(null);
  const [editingStudent, setEditingStudent] = useState<StudentProfile | null>(null);
  const [isNewStudentModalOpen, setIsNewStudentModalOpen] = useState(false);

  // Grade encoding modal
  const [isGradeModalOpen, setIsGradeModalOpen] = useState(false);
  const [gradeStudent, setGradeStudent] = useState<StudentProfile | null>(null);
  const [gradeCourseCode, setGradeCourseCode] = useState('');
  const [gradeMidterm, setGradeMidterm] = useState('1.25');
  const [gradeFinal, setGradeFinal] = useState('1.25');

  // Payment modal
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [paymentStudent, setPaymentStudent] = useState<StudentProfile | null>(null);
  const [paymentAmount, setPaymentAmount] = useState<number>(5000);
  const [paymentMethod, setPaymentMethod] = useState('GCash');
  const [paymentRef, setPaymentRef] = useState('');
  const [paymentOrNumber, setPaymentOrNumber] = useState(`OR-${Date.now().toString().slice(-6)}`);
  const [paymentRemarks, setPaymentRemarks] = useState('Tuition Installment');

  // New Student Form State
  const [newStudentData, setNewStudentData] = useState({
    studentId: `2026-PCM-${Math.floor(1000 + Math.random() * 9000)}`,
    fullName: '',
    email: '',
    contactNumber: '',
    address: 'Baguio City, Philippines',
    degreeProgram: 'Bachelor of Theology',
    major: 'Pastoral Ministry',
    yearLevel: '1st Year',
    academicStatus: 'Regular' as const,
    enrollmentStatus: 'Pre-Enlisted' as const,
    churchAffiliation: 'Church of Christ',
    homePastor: 'Ptr. David Santos',
    emergencyContact: 'Family Member - 0917-000-0000',
  });

  const filteredStudents = allStudents.filter((s) => {
    const matchesArchived = showArchived ? s.isArchived || s.academicStatus === 'Archived' : !s.isArchived && s.academicStatus !== 'Archived';
    if (!matchesArchived) return false;

    const query = searchQuery.toLowerCase();
    const matchesSearch =
      (s.fullName || s.name || '').toLowerCase().includes(query) ||
      (s.studentId || '').toLowerCase().includes(query) ||
      (s.email || '').toLowerCase().includes(query) ||
      (s.degreeProgram || s.program || '').toLowerCase().includes(query);

    const matchesProgram = selectedProgram === 'all' || (s.degreeProgram || s.program) === selectedProgram;
    const matchesAcadStatus = selectedAcademicStatus === 'all' || s.academicStatus === selectedAcademicStatus;
    const matchesEnrollStatus = selectedEnrollmentStatus === 'all' || s.enrollmentStatus === selectedEnrollmentStatus;

    return matchesSearch && matchesProgram && matchesAcadStatus && matchesEnrollStatus;
  });

  const handleCreateStudent = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newStudentData.fullName.trim()) {
      addToast('error', 'Missing Name', 'Please provide the student full name.');
      return;
    }

    await createStudentProfile({
      studentId: newStudentData.studentId.trim(),
      name: newStudentData.fullName.trim(),
      fullName: newStudentData.fullName.trim(),
      email: newStudentData.email.trim(),
      contactNumber: newStudentData.contactNumber.trim(),
      address: newStudentData.address.trim(),
      program: newStudentData.degreeProgram,
      degreeProgram: newStudentData.degreeProgram,
      major: newStudentData.major,
      yearLevel: newStudentData.yearLevel,
      academicStatus: newStudentData.academicStatus,
      enrollmentStatus: newStudentData.enrollmentStatus,
      churchAffiliation: newStudentData.churchAffiliation,
      homePastor: newStudentData.homePastor,
      emergencyContact: newStudentData.emergencyContact,
      unitsEnrolled: 0,
      totalCreditsCompleted: 0,
      gpa: 1.0,
      tuitionTotal: 18500,
      tuitionPaid: 0,
      tuitionBalance: 18500,
      courses: [],
      documents: [],
      paymentHistory: [],
    });

    setIsNewStudentModalOpen(false);
    setNewStudentData({
      studentId: `2026-PCM-${Math.floor(1000 + Math.random() * 9000)}`,
      fullName: '',
      email: '',
      contactNumber: '',
      address: 'Baguio City, Philippines',
      degreeProgram: 'Bachelor of Theology',
      major: 'Pastoral Ministry',
      yearLevel: '1st Year',
      academicStatus: 'Regular',
      enrollmentStatus: 'Pre-Enlisted',
      churchAffiliation: 'Church of Christ',
      homePastor: 'Ptr. David Santos',
      emergencyContact: 'Family Member - 0917-000-0000',
    });
  };

  const handleSaveEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingStudent) return;
    await updateStudentProfile(editingStudent.id, editingStudent);
    setEditingStudent(null);
  };

  const handlePostPayment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!paymentStudent) return;

    await recordStudentPayment(paymentStudent.id, {
      referenceNumber: paymentRef || `REF-${Date.now().toString().slice(-6)}`,
      amount: Number(paymentAmount),
      date: new Date().toISOString(),
      method: paymentMethod,
      verified: true,
      status: 'Verified',
      description: paymentRemarks,
      officialReceiptNumber: paymentOrNumber,
      postedBy: 'Admin Cashier',
    });

    setIsPaymentModalOpen(false);
    setPaymentRef('');
  };

  const handleSaveGrade = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!gradeStudent || !gradeCourseCode) return;
    await addStudentGrade(gradeStudent.id, gradeCourseCode, gradeMidterm, gradeFinal);
    setIsGradeModalOpen(false);
  };

  const handleExportCSV = () => {
    const headers = ['Student ID', 'Full Name', 'Email', 'Program', 'Year Level', 'Academic Status', 'Enrollment Status', 'Units', 'Balance'];
    const rows = filteredStudents.map((s) => [
      `"${s.studentId}"`,
      `"${s.fullName || s.name}"`,
      `"${s.email}"`,
      `"${s.degreeProgram || s.program}"`,
      `"${s.yearLevel}"`,
      `"${s.academicStatus || 'Regular'}"`,
      `"${s.enrollmentStatus || 'Enrolled'}"`,
      s.unitsEnrolled || 0,
      s.tuitionBalance || 0,
    ]);

    const csvContent = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `pcm-students-${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
    URL.revokeObjectURL(url);
    addToast('success', 'Export Complete', 'Exported student directory to CSV.');
  };

  return (
    <div className="space-y-5">
      {/* Header & Controls */}
      <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h3 className="font-serif font-bold text-lg text-slate-900 flex items-center gap-2">
              <Users className="w-5 h-5 text-[#18392B]" />
              <span>Official Student Profiles & Registry</span>
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Comprehensive institutional student records, credentials, program tracks, enrollment statuses, and academic standing.
            </p>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <button
              onClick={handleExportCSV}
              className="text-xs font-semibold px-3 py-2 rounded-lg border border-slate-200 text-slate-700 hover:bg-slate-50 transition flex items-center gap-1.5 cursor-pointer"
            >
              <Download className="w-3.5 h-3.5 text-slate-500" />
              <span>Export CSV</span>
            </button>
            {canPerformEnrollmentAction('manage_students') && (
              <button
                onClick={() => setIsNewStudentModalOpen(true)}
                className="text-xs font-semibold px-3.5 py-2 rounded-lg bg-[#18392B] text-white hover:bg-[#23523e] transition flex items-center gap-1.5 cursor-pointer shadow-xs"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add Student Record</span>
              </button>
            )}
          </div>
        </div>

        {/* Search & Filter Bar */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-3 mt-4 pt-4 border-t border-slate-100">
          <div className="sm:col-span-2 relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              placeholder="Search by student name, ID #, or email..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-2 text-xs rounded-lg border border-slate-200 focus:outline-none focus:ring-1 focus:ring-[#18392B]"
            />
          </div>

          <div>
            <select
              value={selectedProgram}
              onChange={(e) => setSelectedProgram(e.target.value)}
              className="w-full px-2.5 py-2 text-xs rounded-lg border border-slate-200 focus:outline-none focus:ring-1 focus:ring-[#18392B] bg-white text-slate-700"
            >
              <option value="all">All Degree Programs</option>
              {programs.map((p) => (
                <option key={p.id} value={p.title}>
                  {p.title}
                </option>
              ))}
            </select>
          </div>

          <div>
            <select
              value={selectedEnrollmentStatus}
              onChange={(e) => setSelectedEnrollmentStatus(e.target.value)}
              className="w-full px-2.5 py-2 text-xs rounded-lg border border-slate-200 focus:outline-none focus:ring-1 focus:ring-[#18392B] bg-white text-slate-700"
            >
              <option value="all">All Enrollment Statuses</option>
              <option value="Enrolled">Enrolled</option>
              <option value="Pre-Enlisted">Pre-Enlisted</option>
              <option value="Pending">Pending</option>
              <option value="Not Enrolled">Not Enrolled</option>
            </select>
          </div>

          <div className="flex items-center justify-between gap-2">
            <button
              onClick={() => setShowArchived(!showArchived)}
              className={`w-full text-xs font-medium px-3 py-2 rounded-lg border transition cursor-pointer flex items-center justify-center gap-1.5 ${
                showArchived
                  ? 'bg-amber-50 border-amber-300 text-amber-900'
                  : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
              }`}
            >
              <Archive className="w-3.5 h-3.5" />
              <span>{showArchived ? 'Viewing Archived' : 'Show Archived'}</span>
            </button>
          </div>
        </div>
      </div>

      {/* Student Records Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-600">
            <thead className="bg-slate-50 text-slate-700 font-semibold border-b border-slate-200">
              <tr>
                <th className="py-3 px-4">Student ID & Name</th>
                <th className="py-3 px-4">Program & Year</th>
                <th className="py-3 px-4">Academic Status</th>
                <th className="py-3 px-4">Enrollment Status</th>
                <th className="py-3 px-4">Units / GPA</th>
                <th className="py-3 px-4 text-right">Balance</th>
                <th className="py-3 px-4 text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredStudents.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-400">
                    <Users className="w-8 h-8 mx-auto mb-2 opacity-40" />
                    <p className="font-medium text-sm">No student records found</p>
                    <p className="text-xs text-slate-400 mt-0.5">Try adjusting your filters or search keywords.</p>
                  </td>
                </tr>
              ) : (
                filteredStudents.map((student) => {
                  const studentName = student.fullName || student.name || 'Unnamed Student';
                  const isArchived = student.isArchived || student.academicStatus === 'Archived';

                  return (
                    <tr key={student.id} className="hover:bg-slate-50/70 transition">
                      <td className="py-3 px-4">
                        <div className="font-semibold text-slate-900 flex items-center gap-1.5">
                          <span>{studentName}</span>
                          {isArchived && (
                            <span className="text-[10px] bg-slate-200 text-slate-700 px-1.5 py-0.2 rounded font-normal">
                              Archived
                            </span>
                          )}
                        </div>
                        <div className="text-[11px] text-slate-500 font-mono flex items-center gap-2 mt-0.5">
                          <span className="font-bold text-[#18392B]">{student.studentId}</span>
                          <span>&bull;</span>
                          <span className="truncate max-w-[140px]">{student.email}</span>
                        </div>
                      </td>

                      <td className="py-3 px-4">
                        <div className="text-slate-900 font-medium">{student.degreeProgram || student.program}</div>
                        <div className="text-[11px] text-slate-500">{student.yearLevel || '1st Year'}</div>
                      </td>

                      <td className="py-3 px-4">
                        <span
                          className={`inline-block text-[10px] px-2 py-0.5 rounded-full font-semibold border ${
                            student.academicStatus === 'Regular'
                              ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                              : student.academicStatus === 'Graduating'
                              ? 'bg-purple-50 text-purple-700 border-purple-200'
                              : student.academicStatus === 'Probationary'
                              ? 'bg-rose-50 text-rose-700 border-rose-200'
                              : student.academicStatus === 'Archived'
                              ? 'bg-slate-100 text-slate-700 border-slate-300'
                              : 'bg-amber-50 text-amber-700 border-amber-200'
                          }`}
                        >
                          {student.academicStatus || 'Regular'}
                        </span>
                      </td>

                      <td className="py-3 px-4">
                        <span
                          className={`inline-block text-[10px] px-2 py-0.5 rounded-full font-semibold border ${
                            student.enrollmentStatus === 'Enrolled'
                              ? 'bg-emerald-100 text-emerald-800 border-emerald-300'
                              : student.enrollmentStatus === 'Pre-Enlisted'
                              ? 'bg-blue-100 text-blue-800 border-blue-300'
                              : student.enrollmentStatus === 'Pending'
                              ? 'bg-amber-100 text-amber-800 border-amber-300'
                              : 'bg-slate-100 text-slate-600 border-slate-200'
                          }`}
                        >
                          {student.enrollmentStatus || 'Enrolled'}
                        </span>
                      </td>

                      <td className="py-3 px-4 font-mono">
                        <div className="text-slate-900 font-medium">
                          {(student.courses || []).filter((c) => c.status !== 'Dropped').reduce((a, b) => a + (b.units || 0), 0)} Units
                        </div>
                        <div className="text-[11px] text-slate-500">GPA: {student.gpa || '1.25'}</div>
                      </td>

                      <td className="py-3 px-4 text-right font-mono">
                        <div
                          className={`font-semibold ${
                            (student.tuitionBalance || 0) > 0 ? 'text-rose-700' : 'text-emerald-700'
                          }`}
                        >
                          ₱{(student.tuitionBalance || 0).toLocaleString()}
                        </div>
                        <div className="text-[10px] text-slate-400">
                          Paid: ₱{(student.tuitionPaid || 0).toLocaleString()}
                        </div>
                      </td>

                      <td className="py-3 px-4">
                        <div className="flex items-center justify-center gap-1.5">
                          {/* View Detail */}
                          <button
                            title="View Full Profile & Vault"
                            onClick={() => setViewingStudent(student)}
                            className="p-1.5 rounded-lg text-slate-600 hover:bg-slate-100 hover:text-slate-900 transition cursor-pointer"
                          >
                            <Eye className="w-4 h-4" />
                          </button>

                          {/* Encode Grades */}
                          {canPerformEnrollmentAction('manage_students') && (
                            <button
                              title="Encode Grades"
                              onClick={() => {
                                setGradeStudent(student);
                                setGradeCourseCode((student.courses || [])[0]?.code || 'THEO101');
                                setIsGradeModalOpen(true);
                              }}
                              className="p-1.5 rounded-lg text-blue-600 hover:bg-blue-50 transition cursor-pointer"
                            >
                              <Award className="w-4 h-4" />
                            </button>
                          )}

                          {/* Record Payment */}
                          {canPerformEnrollmentAction('record_payment') && (
                            <button
                              title="Record Payment Receipt"
                              onClick={() => {
                                setPaymentStudent(student);
                                setPaymentAmount(student.tuitionBalance ? Math.min(5000, student.tuitionBalance) : 5000);
                                setPaymentOrNumber(`OR-${Date.now().toString().slice(-6)}`);
                                setIsPaymentModalOpen(true);
                              }}
                              className="p-1.5 rounded-lg text-emerald-600 hover:bg-emerald-50 transition cursor-pointer"
                            >
                              <DollarSign className="w-4 h-4" />
                            </button>
                          )}

                          {/* Edit Profile */}
                          {canPerformEnrollmentAction('manage_students') && (
                            <button
                              title="Edit Record"
                              onClick={() => setEditingStudent(student)}
                              className="p-1.5 rounded-lg text-slate-600 hover:bg-slate-100 hover:text-slate-900 transition cursor-pointer"
                            >
                              <Edit2 className="w-4 h-4" />
                            </button>
                          )}

                          {/* Archive / Restore */}
                          {canPerformEnrollmentAction('manage_students') && (
                            isArchived ? (
                              <button
                                title="Restore Student"
                                onClick={() => restoreStudentProfile(student.id)}
                                className="p-1.5 rounded-lg text-emerald-600 hover:bg-emerald-50 transition cursor-pointer"
                              >
                                <RotateCcw className="w-4 h-4" />
                              </button>
                            ) : (
                              <button
                                title="Archive Student"
                                onClick={() => archiveStudentProfile(student.id)}
                                className="p-1.5 rounded-lg text-slate-400 hover:bg-rose-50 hover:text-rose-600 transition cursor-pointer"
                              >
                                <Archive className="w-4 h-4" />
                              </button>
                            )
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

        {/* Footer Summary */}
        <div className="bg-slate-50 px-4 py-3 border-t border-slate-200 flex items-center justify-between text-xs text-slate-500">
          <span>
            Showing <strong className="text-slate-700">{filteredStudents.length}</strong> of{' '}
            <strong className="text-slate-700">{allStudents.length}</strong> students
          </span>
          <span className="font-mono text-[11px]">Philippine College of Ministry Institutional Registry</span>
        </div>
      </div>

      {/* VIEW STUDENT DETAIL MODAL */}
      {viewingStudent && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl max-w-3xl w-full max-h-[90vh] flex flex-col shadow-2xl overflow-hidden animate-in fade-in zoom-in-95">
            <div className="p-5 bg-[#18392B] text-white flex items-center justify-between">
              <div>
                <span className="text-xs text-[#A3D9C9] font-mono uppercase tracking-wider">
                  Official Student Profile
                </span>
                <h3 className="text-xl font-bold font-serif">{viewingStudent.fullName || viewingStudent.name}</h3>
                <p className="text-xs text-slate-300 font-mono mt-0.5">
                  ID: <span className="font-bold text-white">{viewingStudent.studentId}</span> &bull;{' '}
                  {viewingStudent.degreeProgram || viewingStudent.program} ({viewingStudent.yearLevel || '1st Year'})
                </p>
              </div>
              <button
                onClick={() => setViewingStudent(null)}
                className="p-1.5 rounded-lg text-white/80 hover:text-white hover:bg-white/10 transition cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 overflow-y-auto space-y-6 text-xs text-slate-700">
              {/* Profile Grid */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-4 rounded-xl bg-slate-50 border border-slate-200">
                <div>
                  <span className="text-slate-400 block text-[11px]">Email Address</span>
                  <span className="font-medium text-slate-900 break-all">{viewingStudent.email || 'N/A'}</span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[11px]">Contact Number</span>
                  <span className="font-medium text-slate-900">{viewingStudent.contactNumber || 'N/A'}</span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[11px]">Residential Address</span>
                  <span className="font-medium text-slate-900">{viewingStudent.address || 'N/A'}</span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[11px]">Academic Status</span>
                  <span className="font-medium text-slate-900">{viewingStudent.academicStatus || 'Regular'}</span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[11px]">Enrollment Status</span>
                  <span className="font-medium text-slate-900">{viewingStudent.enrollmentStatus || 'Enrolled'}</span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[11px]">Church Affiliation</span>
                  <span className="font-medium text-slate-900">{viewingStudent.churchAffiliation || 'Church of Christ'}</span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[11px]">Home Pastor</span>
                  <span className="font-medium text-slate-900">{viewingStudent.homePastor || 'N/A'}</span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[11px]">Emergency Contact</span>
                  <span className="font-medium text-slate-900">{viewingStudent.emergencyContact || 'N/A'}</span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[11px]">Academic Advisor</span>
                  <span className="font-medium text-slate-900">{viewingStudent.academicAdvisor || 'Dr. Mario Mendoza'}</span>
                </div>
              </div>

              {/* Enrolled Courses */}
              <div>
                <h4 className="font-semibold text-slate-900 text-sm mb-2.5 flex items-center gap-2">
                  <BookOpen className="w-4 h-4 text-[#18392B]" />
                  <span>Enrolled Courses & Academic Performance</span>
                </h4>
                <div className="border border-slate-200 rounded-lg overflow-hidden">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-100 text-slate-700 font-semibold">
                      <tr>
                        <th className="py-2.5 px-3">Code</th>
                        <th className="py-2.5 px-3">Course Title</th>
                        <th className="py-2.5 px-3">Units</th>
                        <th className="py-2.5 px-3">Midterm</th>
                        <th className="py-2.5 px-3">Final</th>
                        <th className="py-2.5 px-3">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {(viewingStudent.courses || []).length === 0 ? (
                        <tr>
                          <td colSpan={6} className="py-4 text-center text-slate-400">
                            No courses registered for this student yet.
                          </td>
                        </tr>
                      ) : (
                        viewingStudent.courses?.map((c) => (
                          <tr key={c.id || c.code}>
                            <td className="py-2.5 px-3 font-mono font-bold text-[#18392B]">{c.code}</td>
                            <td className="py-2.5 px-3 font-medium text-slate-900">{c.title}</td>
                            <td className="py-2.5 px-3 font-mono">{c.units}</td>
                            <td className="py-2.5 px-3 font-mono">{c.midtermGrade || '—'}</td>
                            <td className="py-2.5 px-3 font-mono font-semibold">{c.finalGrade || '—'}</td>
                            <td className="py-2.5 px-3">
                              <span className="text-[10px] bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded font-semibold">
                                {c.status || 'Active'}
                              </span>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Document Vault Verification */}
              <div>
                <h4 className="font-semibold text-slate-900 text-sm mb-2.5 flex items-center gap-2">
                  <FileCheck className="w-4 h-4 text-[#18392B]" />
                  <span>Student Document Vault Verification</span>
                </h4>
                <div className="border border-slate-200 rounded-lg overflow-hidden divide-y divide-slate-100">
                  {(viewingStudent.documents || []).length === 0 ? (
                    <div className="p-4 text-center text-slate-400">No documents submitted to the vault.</div>
                  ) : (
                    viewingStudent.documents?.map((doc) => (
                      <div key={doc.id} className="p-3 flex items-center justify-between gap-4">
                        <div>
                          <div className="font-semibold text-slate-900">{doc.title || doc.name}</div>
                          <div className="text-[11px] text-slate-500">
                            Type: {doc.type} &bull; Uploaded: {new Date(doc.uploadedAt || doc.uploadDate).toLocaleDateString()}
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <span
                            className={`text-[10px] px-2 py-0.5 rounded font-semibold ${
                              doc.verificationStatus === 'Verified'
                                ? 'bg-emerald-100 text-emerald-800'
                                : doc.verificationStatus === 'Rejected'
                                ? 'bg-rose-100 text-rose-800'
                                : 'bg-amber-100 text-amber-800'
                            }`}
                          >
                            {doc.verificationStatus || 'Pending'}
                          </span>
                          {canPerformEnrollmentAction('manage_students') && (
                            <button
                              onClick={async () => {
                                await updateDocumentVerification(
                                  viewingStudent.id,
                                  doc.id,
                                  doc.verificationStatus === 'Verified' ? 'Pending' : 'Verified'
                                );
                                setViewingStudent((prev) =>
                                  prev
                                    ? {
                                        ...prev,
                                        documents: prev.documents.map((d) =>
                                          d.id === doc.id
                                            ? { ...d, verificationStatus: d.verificationStatus === 'Verified' ? 'Pending' : 'Verified' }
                                            : d
                                        ),
                                      }
                                    : null
                                );
                              }}
                              className="text-xs px-2.5 py-1 rounded bg-slate-100 hover:bg-slate-200 text-slate-700 transition cursor-pointer"
                            >
                              {doc.verificationStatus === 'Verified' ? 'Revert' : 'Verify'}
                            </button>
                          )}
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>

              {/* Payment History Ledger */}
              <div>
                <h4 className="font-semibold text-slate-900 text-sm mb-2.5 flex items-center gap-2">
                  <DollarSign className="w-4 h-4 text-emerald-600" />
                  <span>Tuition Payment History</span>
                </h4>
                <div className="border border-slate-200 rounded-lg overflow-hidden">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-100 text-slate-700 font-semibold">
                      <tr>
                        <th className="py-2.5 px-3">Date</th>
                        <th className="py-2.5 px-3">OR Number</th>
                        <th className="py-2.5 px-3">Reference</th>
                        <th className="py-2.5 px-3">Method</th>
                        <th className="py-2.5 px-3 text-right">Amount</th>
                        <th className="py-2.5 px-3 text-center">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {(viewingStudent.paymentHistory || []).length === 0 ? (
                        <tr>
                          <td colSpan={6} className="py-4 text-center text-slate-400">
                            No payment records logged.
                          </td>
                        </tr>
                      ) : (
                        viewingStudent.paymentHistory?.map((p) => (
                          <tr key={p.id || p.referenceNumber}>
                            <td className="py-2.5 px-3">{new Date(p.date).toLocaleDateString()}</td>
                            <td className="py-2.5 px-3 font-mono font-bold text-[#18392B]">
                              {p.officialReceiptNumber || 'OR-PENDING'}
                            </td>
                            <td className="py-2.5 px-3 font-mono">{p.referenceNumber}</td>
                            <td className="py-2.5 px-3">{p.method}</td>
                            <td className="py-2.5 px-3 text-right font-mono font-bold text-emerald-700">
                              ₱{p.amount.toLocaleString()}
                            </td>
                            <td className="py-2.5 px-3 text-center">
                              <span className="text-[10px] bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded font-semibold">
                                {p.status || 'Verified'}
                              </span>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>

            <div className="p-4 bg-slate-50 border-t border-slate-200 flex justify-end">
              <button
                onClick={() => setViewingStudent(null)}
                className="px-4 py-2 text-xs font-semibold rounded-lg bg-slate-200 text-slate-700 hover:bg-slate-300 transition cursor-pointer"
              >
                Close Profile
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ADD NEW STUDENT MODAL */}
      {isNewStudentModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl max-w-2xl w-full shadow-2xl overflow-hidden animate-in fade-in zoom-in-95">
            <div className="p-5 bg-[#18392B] text-white flex items-center justify-between">
              <div>
                <h3 className="text-lg font-bold font-serif">Enroll New Student Record</h3>
                <p className="text-xs text-[#A3D9C9]">Create official institutional profile in Philippine College of Ministry</p>
              </div>
              <button
                onClick={() => setIsNewStudentModalOpen(false)}
                className="p-1.5 rounded-lg text-white/80 hover:text-white hover:bg-white/10 transition cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateStudent} className="p-6 space-y-4 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-slate-600 font-semibold mb-1">Official Student ID Number *</label>
                  <input
                    type="text"
                    required
                    value={newStudentData.studentId}
                    onChange={(e) => setNewStudentData({ ...newStudentData, studentId: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg font-mono focus:ring-1 focus:ring-[#18392B]"
                  />
                  <span className="text-[10px] text-slate-400">Institutional identifier</span>
                </div>

                <div>
                  <label className="block text-slate-600 font-semibold mb-1">Full Name (First, Middle, Last) *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. John Michael Doe"
                    value={newStudentData.fullName}
                    onChange={(e) => setNewStudentData({ ...newStudentData, fullName: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg focus:ring-1 focus:ring-[#18392B]"
                  />
                </div>

                <div>
                  <label className="block text-slate-600 font-semibold mb-1">Email Address *</label>
                  <input
                    type="email"
                    required
                    placeholder="student@pcm.edu.ph"
                    value={newStudentData.email}
                    onChange={(e) => setNewStudentData({ ...newStudentData, email: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg focus:ring-1 focus:ring-[#18392B]"
                  />
                </div>

                <div>
                  <label className="block text-slate-600 font-semibold mb-1">Contact Phone</label>
                  <input
                    type="text"
                    placeholder="0917-000-0000"
                    value={newStudentData.contactNumber}
                    onChange={(e) => setNewStudentData({ ...newStudentData, contactNumber: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg focus:ring-1 focus:ring-[#18392B]"
                  />
                </div>

                <div>
                  <label className="block text-slate-600 font-semibold mb-1">Degree Program</label>
                  <select
                    value={newStudentData.degreeProgram}
                    onChange={(e) => setNewStudentData({ ...newStudentData, degreeProgram: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg bg-white focus:ring-1 focus:ring-[#18392B]"
                  >
                    {programs.map((p) => (
                      <option key={p.id} value={p.title}>
                        {p.title}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-slate-600 font-semibold mb-1">Major / Concentration</label>
                  <input
                    type="text"
                    value={newStudentData.major}
                    onChange={(e) => setNewStudentData({ ...newStudentData, major: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg focus:ring-1 focus:ring-[#18392B]"
                  />
                </div>

                <div>
                  <label className="block text-slate-600 font-semibold mb-1">Year Level</label>
                  <select
                    value={newStudentData.yearLevel}
                    onChange={(e) => setNewStudentData({ ...newStudentData, yearLevel: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg bg-white focus:ring-1 focus:ring-[#18392B]"
                  >
                    <option value="1st Year">1st Year</option>
                    <option value="2nd Year">2nd Year</option>
                    <option value="3rd Year">3rd Year</option>
                    <option value="4th Year">4th Year</option>
                    <option value="Graduate / Post-Baccalaureate">Graduate / Post-Baccalaureate</option>
                  </select>
                </div>

                <div>
                  <label className="block text-slate-600 font-semibold mb-1">Academic Status</label>
                  <select
                    value={newStudentData.academicStatus}
                    onChange={(e) => setNewStudentData({ ...newStudentData, academicStatus: e.target.value as any })}
                    className="w-full px-3 py-2 border rounded-lg bg-white focus:ring-1 focus:ring-[#18392B]"
                  >
                    <option value="Regular">Regular</option>
                    <option value="Irregular">Irregular</option>
                    <option value="Graduating">Graduating</option>
                    <option value="Probationary">Probationary</option>
                    <option value="On Leave">On Leave</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-slate-600 font-semibold mb-1">Home Church & Pastor</label>
                <div className="grid grid-cols-2 gap-3">
                  <input
                    type="text"
                    placeholder="Church Name"
                    value={newStudentData.churchAffiliation}
                    onChange={(e) => setNewStudentData({ ...newStudentData, churchAffiliation: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg focus:ring-1 focus:ring-[#18392B]"
                  />
                  <input
                    type="text"
                    placeholder="Pastor Name"
                    value={newStudentData.homePastor}
                    onChange={(e) => setNewStudentData({ ...newStudentData, homePastor: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg focus:ring-1 focus:ring-[#18392B]"
                  />
                </div>
              </div>

              <div className="p-4 bg-slate-50 -mx-6 -mb-6 mt-6 border-t border-slate-200 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsNewStudentModalOpen(false)}
                  className="px-4 py-2 font-semibold text-slate-600 hover:bg-slate-200 rounded-lg transition cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 font-semibold bg-[#18392B] text-white hover:bg-[#23523e] rounded-lg shadow-sm transition cursor-pointer"
                >
                  Create Student Profile
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* EDIT STUDENT PROFILE MODAL */}
      {editingStudent && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl max-w-2xl w-full shadow-2xl overflow-hidden animate-in fade-in zoom-in-95">
            <div className="p-5 bg-slate-900 text-white flex items-center justify-between">
              <div>
                <h3 className="text-lg font-bold font-serif">Edit Student Profile</h3>
                <p className="text-xs text-slate-400 font-mono">ID: {editingStudent.studentId}</p>
              </div>
              <button
                onClick={() => setEditingStudent(null)}
                className="p-1.5 rounded-lg text-white/80 hover:text-white hover:bg-white/10 transition cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveEdit} className="p-6 space-y-4 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-slate-600 font-semibold mb-1">Full Name</label>
                  <input
                    type="text"
                    required
                    value={editingStudent.fullName || editingStudent.name || ''}
                    onChange={(e) => setEditingStudent({ ...editingStudent, fullName: e.target.value, name: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg focus:ring-1 focus:ring-slate-900"
                  />
                </div>

                <div>
                  <label className="block text-slate-600 font-semibold mb-1">Email</label>
                  <input
                    type="email"
                    required
                    value={editingStudent.email || ''}
                    onChange={(e) => setEditingStudent({ ...editingStudent, email: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg focus:ring-1 focus:ring-slate-900"
                  />
                </div>

                <div>
                  <label className="block text-slate-600 font-semibold mb-1">Degree Program</label>
                  <select
                    value={editingStudent.degreeProgram || editingStudent.program || ''}
                    onChange={(e) => setEditingStudent({ ...editingStudent, degreeProgram: e.target.value, program: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg bg-white focus:ring-1 focus:ring-slate-900"
                  >
                    {programs.map((p) => (
                      <option key={p.id} value={p.title}>
                        {p.title}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-slate-600 font-semibold mb-1">Year Level</label>
                  <select
                    value={editingStudent.yearLevel || '1st Year'}
                    onChange={(e) => setEditingStudent({ ...editingStudent, yearLevel: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg bg-white focus:ring-1 focus:ring-slate-900"
                  >
                    <option value="1st Year">1st Year</option>
                    <option value="2nd Year">2nd Year</option>
                    <option value="3rd Year">3rd Year</option>
                    <option value="4th Year">4th Year</option>
                    <option value="Graduate / Post-Baccalaureate">Graduate / Post-Baccalaureate</option>
                  </select>
                </div>

                <div>
                  <label className="block text-slate-600 font-semibold mb-1">Academic Status</label>
                  <select
                    value={editingStudent.academicStatus || 'Regular'}
                    onChange={(e) => setEditingStudent({ ...editingStudent, academicStatus: e.target.value as any })}
                    className="w-full px-3 py-2 border rounded-lg bg-white focus:ring-1 focus:ring-slate-900"
                  >
                    <option value="Regular">Regular</option>
                    <option value="Irregular">Irregular</option>
                    <option value="Graduating">Graduating</option>
                    <option value="Probationary">Probationary</option>
                    <option value="On Leave">On Leave</option>
                    <option value="Archived">Archived</option>
                  </select>
                </div>

                <div>
                  <label className="block text-slate-600 font-semibold mb-1">Enrollment Status</label>
                  <select
                    value={editingStudent.enrollmentStatus || 'Enrolled'}
                    onChange={(e) => setEditingStudent({ ...editingStudent, enrollmentStatus: e.target.value as any })}
                    className="w-full px-3 py-2 border rounded-lg bg-white focus:ring-1 focus:ring-slate-900"
                  >
                    <option value="Enrolled">Enrolled</option>
                    <option value="Pre-Enlisted">Pre-Enlisted</option>
                    <option value="Pending">Pending</option>
                    <option value="Not Enrolled">Not Enrolled</option>
                  </select>
                </div>
              </div>

              <div className="p-4 bg-slate-50 -mx-6 -mb-6 mt-6 border-t border-slate-200 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setEditingStudent(null)}
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

      {/* RECORD PAYMENT MODAL */}
      {isPaymentModalOpen && paymentStudent && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full shadow-2xl overflow-hidden animate-in fade-in zoom-in-95">
            <div className="p-5 bg-emerald-800 text-white flex items-center justify-between">
              <div>
                <h3 className="text-lg font-bold font-serif">Issue Official Receipt</h3>
                <p className="text-xs text-emerald-200">
                  Posting to: {paymentStudent.fullName || paymentStudent.name} ({paymentStudent.studentId})
                </p>
              </div>
              <button
                onClick={() => setIsPaymentModalOpen(false)}
                className="p-1.5 rounded-lg text-white/80 hover:text-white hover:bg-white/10 transition cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handlePostPayment} className="p-5 space-y-3.5 text-xs">
              <div>
                <label className="block text-slate-600 font-semibold mb-1">Official Receipt Number *</label>
                <input
                  type="text"
                  required
                  value={paymentOrNumber}
                  onChange={(e) => setPaymentOrNumber(e.target.value)}
                  className="w-full px-3 py-2 border rounded-lg font-mono font-bold focus:ring-1 focus:ring-emerald-700"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-600 font-semibold mb-1">Payment Amount (₱) *</label>
                  <input
                    type="number"
                    required
                    min={1}
                    value={paymentAmount}
                    onChange={(e) => setPaymentAmount(Number(e.target.value))}
                    className="w-full px-3 py-2 border rounded-lg font-mono font-bold text-emerald-800 focus:ring-1 focus:ring-emerald-700"
                  />
                </div>

                <div>
                  <label className="block text-slate-600 font-semibold mb-1">Payment Method</label>
                  <select
                    value={paymentMethod}
                    onChange={(e) => setPaymentMethod(e.target.value)}
                    className="w-full px-3 py-2 border rounded-lg bg-white focus:ring-1 focus:ring-emerald-700"
                  >
                    <option value="GCash">GCash</option>
                    <option value="Bank Transfer (BDO)">Bank Transfer (BDO)</option>
                    <option value="Bank Transfer (Metrobank)">Bank Transfer (Metrobank)</option>
                    <option value="Cash (PCM Cashier)">Cash (PCM Cashier)</option>
                    <option value="Palawan Express">Palawan Express</option>
                    <option value="Cheque">Cheque</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-slate-600 font-semibold mb-1">Bank Reference / Transaction ID</label>
                <input
                  type="text"
                  placeholder="e.g. GCash 100234918239"
                  value={paymentRef}
                  onChange={(e) => setPaymentRef(e.target.value)}
                  className="w-full px-3 py-2 border rounded-lg font-mono focus:ring-1 focus:ring-emerald-700"
                />
              </div>

              <div>
                <label className="block text-slate-600 font-semibold mb-1">Description / Remarks</label>
                <input
                  type="text"
                  value={paymentRemarks}
                  onChange={(e) => setPaymentRemarks(e.target.value)}
                  className="w-full px-3 py-2 border rounded-lg focus:ring-1 focus:ring-emerald-700"
                />
              </div>

              <div className="p-4 bg-slate-50 -mx-5 -mb-5 mt-5 border-t border-slate-200 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsPaymentModalOpen(false)}
                  className="px-4 py-2 font-semibold text-slate-600 hover:bg-slate-200 rounded-lg transition cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 font-semibold bg-emerald-800 text-white hover:bg-emerald-900 rounded-lg shadow-sm transition cursor-pointer flex items-center gap-1.5"
                >
                  <DollarSign className="w-4 h-4" />
                  <span>Post Official Receipt</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ENCODE GRADES MODAL */}
      {isGradeModalOpen && gradeStudent && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full shadow-2xl overflow-hidden animate-in fade-in zoom-in-95">
            <div className="p-5 bg-blue-900 text-white flex items-center justify-between">
              <div>
                <h3 className="text-lg font-bold font-serif">Encode Academic Grade</h3>
                <p className="text-xs text-blue-200">
                  Student: {gradeStudent.fullName || gradeStudent.name}
                </p>
              </div>
              <button
                onClick={() => setIsGradeModalOpen(false)}
                className="p-1.5 rounded-lg text-white/80 hover:text-white hover:bg-white/10 transition cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveGrade} className="p-5 space-y-3.5 text-xs">
              <div>
                <label className="block text-slate-600 font-semibold mb-1">Select Course *</label>
                <select
                  required
                  value={gradeCourseCode}
                  onChange={(e) => setGradeCourseCode(e.target.value)}
                  className="w-full px-3 py-2 border rounded-lg bg-white focus:ring-1 focus:ring-blue-900 font-mono"
                >
                  {(gradeStudent.courses || []).length > 0 ? (
                    gradeStudent.courses?.map((c) => (
                      <option key={c.code} value={c.code}>
                        {c.code} &mdash; {c.title} ({c.units} units)
                      </option>
                    ))
                  ) : (
                    <option value="THEO101">THEO101 &mdash; Old Testament Survey</option>
                  )}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-600 font-semibold mb-1">Midterm Grade *</label>
                  <select
                    value={gradeMidterm}
                    onChange={(e) => setGradeMidterm(e.target.value)}
                    className="w-full px-3 py-2 border rounded-lg bg-white font-mono font-bold"
                  >
                    <option value="1.00">1.00 (Excellent - 98-100)</option>
                    <option value="1.25">1.25 (Very Good - 95-97)</option>
                    <option value="1.50">1.50 (Very Good - 92-94)</option>
                    <option value="1.75">1.75 (Good - 89-91)</option>
                    <option value="2.00">2.00 (Good - 86-88)</option>
                    <option value="2.25">2.25 (Fair - 83-85)</option>
                    <option value="2.50">2.50 (Fair - 80-82)</option>
                    <option value="2.75">2.75 (Pass - 77-79)</option>
                    <option value="3.00">3.00 (Pass - 75-76)</option>
                    <option value="5.00">5.00 (Failed - Below 75)</option>
                    <option value="INC">INC (Incomplete)</option>
                    <option value="DRP">DRP (Dropped)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-slate-600 font-semibold mb-1">Final Grade *</label>
                  <select
                    value={gradeFinal}
                    onChange={(e) => setGradeFinal(e.target.value)}
                    className="w-full px-3 py-2 border rounded-lg bg-white font-mono font-bold text-blue-900"
                  >
                    <option value="1.00">1.00 (Excellent - 98-100)</option>
                    <option value="1.25">1.25 (Very Good - 95-97)</option>
                    <option value="1.50">1.50 (Very Good - 92-94)</option>
                    <option value="1.75">1.75 (Good - 89-91)</option>
                    <option value="2.00">2.00 (Good - 86-88)</option>
                    <option value="2.25">2.25 (Fair - 83-85)</option>
                    <option value="2.50">2.50 (Fair - 80-82)</option>
                    <option value="2.75">2.75 (Pass - 77-79)</option>
                    <option value="3.00">3.00 (Pass - 75-76)</option>
                    <option value="5.00">5.00 (Failed - Below 75)</option>
                    <option value="INC">INC (Incomplete)</option>
                    <option value="DRP">DRP (Dropped)</option>
                  </select>
                </div>
              </div>

              <div className="p-4 bg-slate-50 -mx-5 -mb-5 mt-5 border-t border-slate-200 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsGradeModalOpen(false)}
                  className="px-4 py-2 font-semibold text-slate-600 hover:bg-slate-200 rounded-lg transition cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 font-semibold bg-blue-900 text-white hover:bg-blue-800 rounded-lg shadow-sm transition cursor-pointer"
                >
                  Record Grade
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
