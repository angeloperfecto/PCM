'use client';

import React, { useState } from 'react';
import { usePCM } from '@/lib/store';
import {
  OnlineEnrollment,
  StudentProfile,
  EnrollmentStatus,
  DocumentVerificationStatus,
} from '@/lib/types';
import {
  GraduationCap,
  FileCheck,
  Clock,
  CheckCircle2,
  AlertCircle,
  XCircle,
  Search,
  Eye,
  Check,
  RotateCcw,
  Trash2,
  Edit2,
  DollarSign,
  Plus,
  BookOpen,
  Award,
  Filter,
  FileText,
  User,
  Mail,
  Phone,
  Calendar,
  X,
  Send,
  Download,
} from 'lucide-react';

export const AdminEnrollmentsTab: React.FC = () => {
  const {
    enrollments,
    students,
    studentProfile,
    approveEnrollment,
    returnEnrollmentForCorrection,
    rejectEnrollment,
    deleteEnrollment,
    updateDocumentVerification,
    createStudentProfile,
    updateStudentProfile,
    deleteStudentProfile,
    addStudentGrade,
    recordStudentPayment,
    addToast,
    programs,
  } = usePCM();

  const [activeSubTab, setActiveSubTab] = useState<'enrollments' | 'students' | 'documents'>('enrollments');
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [selectedEnrollment, setSelectedEnrollment] = useState<OnlineEnrollment | null>(null);

  // Return for correction modal state
  const [isReturnModalOpen, setIsReturnModalOpen] = useState(false);
  const [returnTargetId, setReturnTargetId] = useState<string>('');
  const [returnFeedback, setReturnFeedback] = useState<string>('');

  // Grade encoding modal state
  const [isGradeModalOpen, setIsGradeModalOpen] = useState(false);
  const [gradeStudent, setGradeStudent] = useState<StudentProfile | null>(null);
  const [gradeCourseCode, setGradeCourseCode] = useState<string>('');
  const [gradeMidterm, setGradeMidterm] = useState<string>('1.25');
  const [gradeFinal, setGradeFinal] = useState<string>('1.25');

  // Payment record modal state
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [paymentStudent, setPaymentStudent] = useState<StudentProfile | null>(null);
  const [paymentAmount, setPaymentAmount] = useState<number>(5000);
  const [paymentMethod, setPaymentMethod] = useState<string>('GCash');
  const [paymentRef, setPaymentRef] = useState<string>('');
  const [paymentDesc, setPaymentDesc] = useState<string>('Tuition Installment Payment');

  // New Student modal state
  const [isNewStudentModalOpen, setIsNewStudentModalOpen] = useState(false);
  const [newStudentName, setNewStudentName] = useState('');
  const [newStudentId, setNewStudentId] = useState('2026-PCM-1001');
  const [newStudentEmail, setNewStudentEmail] = useState('');
  const [newStudentProgram, setNewStudentProgram] = useState('Bachelor of Theology');
  const [newStudentYear, setNewStudentYear] = useState('1st Year');

  // KPIs
  const totalEnrollments = enrollments.length;
  const pendingEnrollments = enrollments.filter((e) => e.status === 'Submitted' || e.status === 'Under Review').length;
  const approvedEnrollments = enrollments.filter((e) => e.status === 'Approved').length;
  const returnedEnrollments = enrollments.filter((e) => e.status === 'Returned for Correction').length;

  const filteredEnrollments = enrollments.filter((e) => {
    const matchesSearch =
      (e.studentName || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (e.studentId || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (e.referenceNumber || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (e.programTitle || e.programName || '').toLowerCase().includes(searchQuery.toLowerCase());

    const matchesStatus = statusFilter === 'all' || e.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const allStudents = students.length > 0 ? students : [studentProfile];
  const filteredStudents = allStudents.filter((s) => {
    return (
      (s.fullName || s.name || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (s.studentId || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (s.degreeProgram || s.program || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (s.email || '').toLowerCase().includes(searchQuery.toLowerCase())
    );
  });

  // Handle Enrollment Approval
  const handleApprove = async (enrollment: OnlineEnrollment) => {
    const success = await approveEnrollment(enrollment.id);
    if (success && selectedEnrollment?.id === enrollment.id) {
      setSelectedEnrollment({ ...enrollment, status: 'Approved' });
    }
  };

  // Open return modal
  const openReturnModal = (enrollmentId: string) => {
    setReturnTargetId(enrollmentId);
    setReturnFeedback('');
    setIsReturnModalOpen(true);
  };

  const handleConfirmReturn = async () => {
    if (!returnFeedback.trim()) {
      addToast('warning', 'Feedback Required', 'Please enter specific instructions for the student.');
      return;
    }
    await returnEnrollmentForCorrection(returnTargetId, returnFeedback.trim());
    setIsReturnModalOpen(false);
    if (selectedEnrollment?.id === returnTargetId) {
      setSelectedEnrollment(null);
    }
  };

  // Grade submit
  const handleGradeSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!gradeStudent || !gradeCourseCode) return;
    await addStudentGrade(gradeStudent.id, gradeCourseCode, gradeMidterm, gradeFinal);
    setIsGradeModalOpen(false);
  };

  // Payment submit
  const handlePaymentSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!paymentStudent || paymentAmount <= 0) return;
    await recordStudentPayment(paymentStudent.id, {
      date: new Date().toISOString().split('T')[0],
      amount: Number(paymentAmount),
      paymentMethod,
      referenceNumber: paymentRef || `REF-${Math.floor(100000 + Math.random() * 900000)}`,
      description: paymentDesc,
      status: 'Verified',
      receiptUrl: '',
    });
    setIsPaymentModalOpen(false);
  };

  // New Student submit
  const handleNewStudentSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newStudentName.trim() || !newStudentId.trim()) return;
    await createStudentProfile({
      studentId: newStudentId.trim(),
      name: newStudentName.trim(),
      fullName: newStudentName.trim(),
      email: newStudentEmail.trim() || `${newStudentId.toLowerCase()}@student.pcm.edu.ph`,
      phone: '0917-123-4567',
      degreeProgram: newStudentProgram,
      program: newStudentProgram,
      yearLevel: newStudentYear,
      academicStatus: 'Regular',
      academicYear: '2026-2027',
      currentSemester: '1st Semester, AY 2026-2027',
      enrollmentStatus: 'Draft',
      gpa: 1.0,
      totalUnitsEarned: 0,
      tuitionTotal: 17800,
      tuitionPaid: 0,
      tuitionBalance: 17800,
      homeChurch: 'Philippine Church of Christ',
      mentorName: 'Dr. Benjamin Villanueva',
      avatarUrl: '',
      courses: [],
      practicumEntries: [],
      documents: [],
      paymentHistory: [],
    });
    setIsNewStudentModalOpen(false);
    setNewStudentName('');
  };

  return (
    <div className="space-y-6">
      {/* Header & Subtabs */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-4">
        <div>
          <h2 className="font-serif text-2xl font-bold text-[#18392B] flex items-center gap-2.5">
            <GraduationCap className="w-7 h-7 text-[#588B76]" />
            <span>Online Enrollment & Student Records Manager</span>
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Real-time verification of student enrollments, academic evaluations, tuition billing, and official records.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => {
              setNewStudentId(`2026-PCM-${Math.floor(1000 + Math.random() * 9000)}`);
              setIsNewStudentModalOpen(true);
            }}
            className="bg-[#18392B] hover:bg-[#588B76] text-white hover:text-[#18392B] font-semibold text-xs px-3.5 py-2.5 rounded-lg transition flex items-center gap-1.5 cursor-pointer shadow-sm"
          >
            <Plus className="w-4 h-4" />
            <span>Add Student Profile</span>
          </button>
        </div>
      </div>

      {/* KPI Stats Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
          <span className="text-[11px] font-mono text-slate-500 uppercase block">Total Applications</span>
          <span className="font-serif text-2xl font-bold text-slate-900">{totalEnrollments}</span>
        </div>
        <div className="bg-white p-4 rounded-xl border border-amber-200 shadow-xs bg-amber-50/50">
          <span className="text-[11px] font-mono text-amber-800 uppercase block">Pending Verification</span>
          <span className="font-serif text-2xl font-bold text-amber-700">{pendingEnrollments}</span>
        </div>
        <div className="bg-white p-4 rounded-xl border border-emerald-200 shadow-xs bg-emerald-50/50">
          <span className="text-[11px] font-mono text-emerald-800 uppercase block">Approved & Enrolled</span>
          <span className="font-serif text-2xl font-bold text-emerald-700">{approvedEnrollments}</span>
        </div>
        <div className="bg-white p-4 rounded-xl border border-rose-200 shadow-xs bg-rose-50/50">
          <span className="text-[11px] font-mono text-rose-800 uppercase block">Returned for Correction</span>
          <span className="font-serif text-2xl font-bold text-rose-700">{returnedEnrollments}</span>
        </div>
      </div>

      {/* Sub-Navigation Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-200 pb-2">
        <button
          onClick={() => setActiveSubTab('enrollments')}
          className={`px-4 py-2 rounded-lg text-xs font-bold transition flex items-center gap-2 cursor-pointer ${
            activeSubTab === 'enrollments'
              ? 'bg-[#18392B] text-white shadow-xs'
              : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
          }`}
        >
          <FileCheck className="w-4 h-4 text-[#588B76]" />
          <span>Online Enrollments ({enrollments.length})</span>
        </button>

        <button
          onClick={() => setActiveSubTab('students')}
          className={`px-4 py-2 rounded-lg text-xs font-bold transition flex items-center gap-2 cursor-pointer ${
            activeSubTab === 'students'
              ? 'bg-[#18392B] text-white shadow-xs'
              : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
          }`}
        >
          <User className="w-4 h-4 text-[#588B76]" />
          <span>Student Directory & Grades ({allStudents.length})</span>
        </button>

        <button
          onClick={() => setActiveSubTab('documents')}
          className={`px-4 py-2 rounded-lg text-xs font-bold transition flex items-center gap-2 cursor-pointer ${
            activeSubTab === 'documents'
              ? 'bg-[#18392B] text-white shadow-xs'
              : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
          }`}
        >
          <FileText className="w-4 h-4 text-[#588B76]" />
          <span>Document Vault & Clearances</span>
        </button>
      </div>

      {/* SUBTAB 1: ONLINE ENROLLMENTS */}
      {activeSubTab === 'enrollments' && (
        <div className="space-y-4">
          {/* Filter and Search Bar */}
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search by student name, ID, reference #, or degree program..."
                className="w-full pl-9 pr-4 py-2 rounded-lg border border-slate-300 text-xs bg-white focus:outline-none focus:border-[#588B76]"
              />
            </div>

            <div className="flex items-center gap-2">
              <Filter className="w-4 h-4 text-slate-500" />
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="py-2 px-3 rounded-lg border border-slate-300 text-xs bg-white focus:outline-none focus:border-[#588B76]"
              >
                <option value="all">All Statuses</option>
                <option value="Submitted">Submitted (Needs Review)</option>
                <option value="Under Review">Under Review</option>
                <option value="Approved">Approved & Enrolled</option>
                <option value="Returned for Correction">Returned for Correction</option>
                <option value="Draft">Draft</option>
                <option value="Rejected">Rejected</option>
              </select>
            </div>
          </div>

          {/* Enrollments Table */}
          <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-xs">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse min-w-[750px]">
                <thead>
                  <tr className="bg-[#18392B] text-white">
                    <th className="p-3.5 font-bold">Reference #</th>
                    <th className="p-3.5 font-bold">Student Name & ID</th>
                    <th className="p-3.5 font-bold">Program & Year</th>
                    <th className="p-3.5 font-bold">Subjects / Units</th>
                    <th className="p-3.5 font-bold">Tuition / Payment</th>
                    <th className="p-3.5 font-bold">Status</th>
                    <th className="p-3.5 font-bold text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 text-slate-700">
                  {filteredEnrollments.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="p-8 text-center text-slate-500">
                        No enrollment applications match your search criteria.
                      </td>
                    </tr>
                  ) : (
                    filteredEnrollments.map((enr) => {
                      const isPending = enr.status === 'Submitted' || enr.status === 'Under Review';
                      const isApproved = enr.status === 'Approved';
                      const isReturned = enr.status === 'Returned for Correction';

                      return (
                        <tr key={enr.id} className="hover:bg-slate-50 transition">
                          <td className="p-3.5 font-mono font-bold text-[#18392B]">
                            {enr.referenceNumber}
                            <span className="block text-[10px] text-slate-400 font-normal">
                              {enr.submissionDate || enr.submittedAt?.split('T')[0] || 'Draft'}
                            </span>
                          </td>
                          <td className="p-3.5">
                            <span className="font-bold text-slate-900 block">{enr.studentName}</span>
                            <span className="font-mono text-[11px] text-[#588B76] font-semibold">{enr.studentId}</span>
                          </td>
                          <td className="p-3.5">
                            <span className="font-semibold text-slate-800 block">{enr.programTitle}</span>
                            <span className="text-slate-500 text-[11px]">
                              {enr.yearLevel} • {enr.semester}
                            </span>
                          </td>
                          <td className="p-3.5 font-mono">
                            <span className="font-bold text-slate-800">{enr.selectedSubjects?.length || 0} Subjects</span>
                            <span className="block text-slate-500 text-[11px]">({enr.totalUnits || 0} Total Units)</span>
                          </td>
                          <td className="p-3.5">
                            <span className="font-bold text-slate-900 block font-mono">
                              ₱{(enr.estimatedTuition || 0).toLocaleString()}
                            </span>
                            <span className="text-[10px] text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded font-mono font-semibold">
                              {enr.paymentMethod} • {enr.paymentOption?.split(' ')[0] || 'Cash'}
                            </span>
                          </td>
                          <td className="p-3.5">
                            <span
                              className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold font-mono ${
                                isApproved
                                  ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                                  : isPending
                                  ? 'bg-amber-100 text-amber-800 border border-amber-300'
                                  : isReturned
                                  ? 'bg-rose-100 text-rose-800 border border-rose-300'
                                  : 'bg-slate-100 text-slate-700 border border-slate-300'
                              }`}
                            >
                              {isApproved && <CheckCircle2 className="w-3 h-3" />}
                              {isPending && <Clock className="w-3 h-3" />}
                              {isReturned && <AlertCircle className="w-3 h-3" />}
                              <span>{enr.status}</span>
                            </span>
                          </td>
                          <td className="p-3.5 text-right">
                            <div className="flex items-center justify-end gap-1.5">
                              <button
                                onClick={() => setSelectedEnrollment(enr)}
                                title="View Application Details"
                                className="p-1.5 rounded hover:bg-slate-100 text-slate-600 hover:text-slate-900 transition cursor-pointer"
                              >
                                <Eye className="w-4 h-4" />
                              </button>

                              {isPending && (
                                <>
                                  <button
                                    onClick={() => handleApprove(enr)}
                                    title="Approve & Officially Enroll"
                                    className="p-1.5 rounded bg-emerald-600 hover:bg-emerald-700 text-white transition cursor-pointer"
                                  >
                                    <Check className="w-4 h-4" />
                                  </button>
                                  <button
                                    onClick={() => openReturnModal(enr.id)}
                                    title="Return for Correction"
                                    className="p-1.5 rounded bg-amber-500 hover:bg-amber-600 text-white transition cursor-pointer"
                                  >
                                    <RotateCcw className="w-4 h-4" />
                                  </button>
                                </>
                              )}

                              <button
                                onClick={() => deleteEnrollment(enr.id)}
                                title="Delete Record"
                                className="p-1.5 rounded hover:bg-rose-100 text-slate-400 hover:text-rose-600 transition cursor-pointer"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
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
        </div>
      )}

      {/* SUBTAB 2: STUDENT DIRECTORY & ACADEMIC GRADES */}
      {activeSubTab === 'students' && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search students by name, Student ID, or program..."
                className="w-full pl-9 pr-4 py-2 rounded-lg border border-slate-300 text-xs bg-white focus:outline-none focus:border-[#588B76]"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {filteredStudents.map((stu) => (
              <div key={stu.id} className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs space-y-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-full bg-[#18392B] text-[#588B76] font-serif font-black text-lg flex items-center justify-center shrink-0 border-2 border-amber-300">
                      {(stu.fullName || stu.name || 'S').charAt(0)}
                    </div>
                    <div>
                      <span className="text-[10px] font-mono font-bold text-[#588B76] block uppercase tracking-wider">
                        {stu.studentId} • {stu.yearLevel}
                      </span>
                      <h3 className="font-serif text-base font-bold text-slate-900">
                        {stu.fullName || stu.name}
                      </h3>
                      <span className="text-xs text-slate-500 block">
                        {stu.degreeProgram || stu.program}
                      </span>
                    </div>
                  </div>

                  <span
                    className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded-full ${
                      stu.enrollmentStatus === 'Enrolled'
                        ? 'bg-emerald-100 text-emerald-800'
                        : 'bg-slate-100 text-slate-700'
                    }`}
                  >
                    {stu.enrollmentStatus || 'Active'}
                  </span>
                </div>

                <div className="grid grid-cols-3 gap-2 text-center bg-slate-50 p-2.5 rounded-lg border border-slate-100 text-xs">
                  <div>
                    <span className="text-[10px] text-slate-400 uppercase font-mono block">GPA</span>
                    <span className="font-serif font-bold text-slate-900">{stu.gpa?.toFixed(2) || '1.00'}</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 uppercase font-mono block">Units Earned</span>
                    <span className="font-serif font-bold text-slate-900">{stu.totalUnitsEarned || 0}</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 uppercase font-mono block">Tuition Balance</span>
                    <span className={`font-serif font-bold ${stu.tuitionBalance ? 'text-amber-700' : 'text-emerald-700'}`}>
                      ₱{(stu.tuitionBalance ?? (stu.tuitionTotal - stu.tuitionPaid)).toLocaleString()}
                    </span>
                  </div>
                </div>

                {/* Enrolled Courses / Grade encoding quick trigger */}
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between text-[11px] font-bold text-slate-700">
                    <span>Enrolled Courses ({stu.courses?.length || 0})</span>
                    <span className="text-slate-400 font-normal">Term Grades</span>
                  </div>
                  <div className="space-y-1 max-h-32 overflow-y-auto pr-1">
                    {(stu.courses || []).map((c) => (
                      <div key={c.id || c.code} className="flex items-center justify-between p-2 rounded bg-slate-50 border border-slate-100 text-xs">
                        <div>
                          <span className="font-mono font-bold text-[#18392B] mr-2">{c.code}</span>
                          <span className="text-slate-700 text-[11px]">{c.title}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="font-mono font-bold text-[#588B76] text-xs">
                            {c.finalGrade || 'In Progress'}
                          </span>
                          <button
                            onClick={() => {
                              setGradeStudent(stu);
                              setGradeCourseCode(c.code);
                              setGradeMidterm(String(c.midtermGrade || '1.25'));
                              setGradeFinal(String(c.finalGrade || '1.25'));
                              setIsGradeModalOpen(true);
                            }}
                            className="text-[10px] bg-white hover:bg-slate-100 border border-slate-200 px-2 py-0.5 rounded text-slate-700 transition cursor-pointer"
                          >
                            Encode
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="pt-2 border-t border-slate-100 flex items-center justify-between gap-2 text-xs">
                  <button
                    onClick={() => {
                      setPaymentStudent(stu);
                      setPaymentAmount(stu.tuitionBalance || 5000);
                      setIsPaymentModalOpen(true);
                    }}
                    className="bg-emerald-50 hover:bg-emerald-100 text-emerald-800 font-semibold px-3 py-1.5 rounded-lg border border-emerald-200 transition flex items-center gap-1.5 cursor-pointer text-[11px]"
                  >
                    <DollarSign className="w-3.5 h-3.5 text-emerald-600" />
                    <span>Record Payment</span>
                  </button>

                  <button
                    onClick={() => deleteStudentProfile(stu.id)}
                    className="text-slate-400 hover:text-rose-600 transition p-1.5 rounded hover:bg-rose-50 cursor-pointer"
                    title="Delete Student Profile"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* SUBTAB 3: DOCUMENT VAULT & VERIFICATION */}
      {activeSubTab === 'documents' && (
        <div className="space-y-4">
          <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs space-y-4">
            <h3 className="font-serif text-lg font-bold text-[#18392B] flex items-center gap-2">
              <FileCheck className="w-5 h-5 text-[#588B76]" />
              <span>Student Submitted Documents & Clearances</span>
            </h3>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse min-w-[700px]">
                <thead>
                  <tr className="bg-[#18392B] text-white">
                    <th className="p-3.5 font-bold">Student</th>
                    <th className="p-3.5 font-bold">Document Type</th>
                    <th className="p-3.5 font-bold">Upload Date</th>
                    <th className="p-3.5 font-bold">Verification Status</th>
                    <th className="p-3.5 font-bold text-right">Registrar Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 text-slate-700">
                  {allStudents.flatMap((s) => (s.documents || []).map((doc) => ({ student: s, doc }))).length === 0 ? (
                    <tr>
                      <td colSpan={5} className="p-8 text-center text-slate-500">
                        No uploaded student documents found.
                      </td>
                    </tr>
                  ) : (
                    allStudents.flatMap((s) => (s.documents || []).map((doc) => (
                      <tr key={doc.id} className="hover:bg-slate-50">
                        <td className="p-3.5">
                          <span className="font-bold text-slate-900 block">{s.fullName || s.name}</span>
                          <span className="font-mono text-[11px] text-[#588B76]">{s.studentId}</span>
                        </td>
                        <td className="p-3.5">
                          <span className="font-semibold text-slate-800 block">{doc.name || doc.fileName}</span>
                          <span className="text-[10px] text-slate-400 uppercase font-mono">{doc.type || doc.documentType}</span>
                        </td>
                        <td className="p-3.5 font-mono text-slate-500">{doc.uploadDate}</td>
                        <td className="p-3.5">
                          <span
                            className={`inline-block px-2.5 py-1 rounded-full text-[10px] font-bold font-mono ${
                              doc.verificationStatus === 'Verified'
                                ? 'bg-emerald-100 text-emerald-800'
                                : doc.verificationStatus === 'Action Required'
                                ? 'bg-rose-100 text-rose-800'
                                : 'bg-amber-100 text-amber-800'
                            }`}
                          >
                            {doc.verificationStatus}
                          </span>
                        </td>
                        <td className="p-3.5 text-right">
                          <div className="flex items-center justify-end gap-2">
                            <button
                              onClick={() => updateDocumentVerification(s.id, doc.id, 'Verified', 'Approved by Registrar')}
                              className="px-2.5 py-1 rounded bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-[11px] transition cursor-pointer"
                            >
                              Verify
                            </button>
                            <button
                              onClick={() => updateDocumentVerification(s.id, doc.id, 'Action Required', 'Please provide a clear scan/certified copy')}
                              className="px-2.5 py-1 rounded bg-amber-500 hover:bg-amber-600 text-white font-semibold text-[11px] transition cursor-pointer"
                            >
                              Request Clear Copy
                            </button>
                          </div>
                        </td>
                      </tr>
                    )))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* VIEW ENROLLMENT DETAILS MODAL */}
      {selectedEnrollment && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl max-w-3xl w-full max-h-[90vh] overflow-y-auto p-6 space-y-6 shadow-2xl border border-slate-200">
            <div className="flex items-center justify-between border-b border-slate-200 pb-4">
              <div>
                <span className="text-[11px] font-mono font-bold text-[#588B76] uppercase block">
                  Application Ref: {selectedEnrollment.referenceNumber}
                </span>
                <h3 className="font-serif text-2xl font-bold text-[#18392B]">
                  Online Enrollment Details
                </h3>
              </div>
              <button
                onClick={() => setSelectedEnrollment(null)}
                className="p-2 rounded-full hover:bg-slate-100 text-slate-500 hover:text-slate-800 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Student Info Card */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 bg-slate-50 p-4 rounded-xl border border-slate-200 text-xs">
              <div className="space-y-1">
                <span className="text-slate-400 block uppercase font-mono text-[10px]">Student Name</span>
                <span className="font-bold text-slate-900 text-sm">{selectedEnrollment.studentName}</span>
                <span className="font-mono text-[#588B76] font-semibold block">{selectedEnrollment.studentId}</span>
              </div>
              <div className="space-y-1">
                <span className="text-slate-400 block uppercase font-mono text-[10px]">Academic Term & Program</span>
                <span className="font-bold text-slate-900">{selectedEnrollment.programTitle}</span>
                <span className="text-slate-600 block">{selectedEnrollment.yearLevel} • {selectedEnrollment.semester}, AY {selectedEnrollment.schoolYear}</span>
              </div>
              <div className="space-y-1">
                <span className="text-slate-400 block uppercase font-mono text-[10px]">Contact Info</span>
                <span className="text-slate-700 block">{selectedEnrollment.studentEmail}</span>
                <span className="text-slate-700 block">{selectedEnrollment.studentContact}</span>
              </div>
              <div className="space-y-1">
                <span className="text-slate-400 block uppercase font-mono text-[10px]">Payment Plan & Tuition</span>
                <span className="font-bold text-slate-900 block font-mono">₱{(selectedEnrollment.estimatedTuition || 0).toLocaleString()}</span>
                <span className="text-slate-600 block">{selectedEnrollment.paymentMethod} • {selectedEnrollment.paymentOption}</span>
              </div>
            </div>

            {/* Selected Subjects */}
            <div className="space-y-2">
              <h4 className="font-serif text-sm font-bold text-[#18392B]">
                Requested Subjects ({selectedEnrollment.selectedSubjects?.length || 0} Courses, {selectedEnrollment.totalUnits} Units)
              </h4>
              <div className="border border-slate-200 rounded-xl overflow-hidden">
                <table className="w-full text-left text-xs">
                  <thead className="bg-[#18392B] text-white">
                    <tr>
                      <th className="p-2.5">Code</th>
                      <th className="p-2.5">Title</th>
                      <th className="p-2.5">Units</th>
                      <th className="p-2.5">Schedule</th>
                      <th className="p-2.5">Instructor</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200">
                    {(selectedEnrollment.selectedSubjects || []).map((s) => (
                      <tr key={s.code}>
                        <td className="p-2.5 font-mono font-bold text-[#18392B]">{s.code}</td>
                        <td className="p-2.5 font-semibold text-slate-800">{s.title}</td>
                        <td className="p-2.5 font-mono">{s.units} Units</td>
                        <td className="p-2.5 text-slate-600">{s.schedule}</td>
                        <td className="p-2.5 text-slate-500">{s.instructor}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Admin Remarks if any */}
            {selectedEnrollment.adminRemarks && (
              <div className="p-3.5 bg-amber-50 rounded-xl border border-amber-200 text-xs text-amber-900 space-y-1">
                <span className="font-bold block">Registrar Remarks / Action Notes:</span>
                <p>{selectedEnrollment.adminRemarks}</p>
              </div>
            )}

            {/* Action Bar */}
            <div className="pt-4 border-t border-slate-200 flex flex-wrap items-center justify-between gap-3 text-xs">
              <span className="font-mono text-slate-500">
                Current Status: <strong>{selectedEnrollment.status}</strong>
              </span>

              <div className="flex items-center gap-2">
                {selectedEnrollment.status !== 'Approved' && (
                  <button
                    onClick={() => handleApprove(selectedEnrollment)}
                    className="bg-emerald-700 hover:bg-emerald-800 text-white font-bold px-4 py-2 rounded-lg transition cursor-pointer flex items-center gap-1.5"
                  >
                    <Check className="w-4 h-4" />
                    <span>Approve & Generate Official COR</span>
                  </button>
                )}

                {selectedEnrollment.status !== 'Returned for Correction' && (
                  <button
                    onClick={() => openReturnModal(selectedEnrollment.id)}
                    className="bg-amber-500 hover:bg-amber-600 text-white font-bold px-4 py-2 rounded-lg transition cursor-pointer flex items-center gap-1.5"
                  >
                    <RotateCcw className="w-4 h-4" />
                    <span>Return for Correction</span>
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* RETURN FOR CORRECTION MODAL */}
      {isReturnModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 space-y-4 shadow-2xl border border-slate-200">
            <div className="flex items-center justify-between">
              <h3 className="font-serif text-lg font-bold text-[#18392B]">
                Return Enrollment for Correction
              </h3>
              <button onClick={() => setIsReturnModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>
            <p className="text-xs text-slate-500">
              Please specify the corrections required. The student will be notified immediately and invited to resubmit.
            </p>
            <textarea
              rows={4}
              value={returnFeedback}
              onChange={(e) => setReturnFeedback(e.target.value)}
              placeholder="e.g. Please upload an updated Grade Slip / TOR and complete payment proof reference..."
              className="w-full p-3 text-xs border border-slate-300 rounded-lg focus:border-[#588B76] focus:outline-none"
            />
            <div className="flex justify-end gap-2 pt-2">
              <button
                onClick={() => setIsReturnModalOpen(false)}
                className="px-4 py-2 rounded-lg border border-slate-300 text-xs font-semibold text-slate-600 hover:bg-slate-100"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmReturn}
                className="px-4 py-2 rounded-lg bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold transition flex items-center gap-1.5"
              >
                <Send className="w-3.5 h-3.5" />
                <span>Send to Student</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ENCODE GRADE MODAL */}
      {isGradeModalOpen && gradeStudent && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 space-y-4 shadow-2xl border border-slate-200">
            <div className="flex items-center justify-between">
              <h3 className="font-serif text-lg font-bold text-[#18392B]">
                Encode Official Term Grades
              </h3>
              <button onClick={() => setIsGradeModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="bg-slate-50 p-3 rounded-lg border border-slate-200 text-xs space-y-1">
              <span className="font-bold text-slate-900 block">{gradeStudent.fullName || gradeStudent.name}</span>
              <span className="font-mono text-[#588B76]">{gradeStudent.studentId} • Subject: {gradeCourseCode}</span>
            </div>

            <form onSubmit={handleGradeSubmit} className="space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-slate-600 font-semibold">Midterm Grade</label>
                  <input
                    type="text"
                    required
                    value={gradeMidterm}
                    onChange={(e) => setGradeMidterm(e.target.value)}
                    placeholder="1.25"
                    className="w-full p-2.5 border border-slate-300 rounded font-mono font-bold text-slate-900"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-slate-600 font-semibold">Final Grade</label>
                  <input
                    type="text"
                    required
                    value={gradeFinal}
                    onChange={(e) => setGradeFinal(e.target.value)}
                    placeholder="1.25"
                    className="w-full p-2.5 border border-slate-300 rounded font-mono font-bold text-slate-900"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsGradeModalOpen(false)}
                  className="px-4 py-2 rounded-lg border border-slate-300 text-xs font-semibold text-slate-600 hover:bg-slate-100"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-lg bg-[#18392B] hover:bg-[#588B76] hover:text-[#18392B] text-white text-xs font-bold transition"
                >
                  Post Official Grade
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* RECORD PAYMENT MODAL */}
      {isPaymentModalOpen && paymentStudent && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 space-y-4 shadow-2xl border border-slate-200">
            <div className="flex items-center justify-between">
              <h3 className="font-serif text-lg font-bold text-[#18392B]">
                Record Student Tuition Payment
              </h3>
              <button onClick={() => setIsPaymentModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="bg-slate-50 p-3 rounded-lg border border-slate-200 text-xs space-y-1">
              <span className="font-bold text-slate-900 block">{paymentStudent.fullName || paymentStudent.name}</span>
              <span className="font-mono text-[#588B76]">
                Balance: ₱{(paymentStudent.tuitionBalance ?? (paymentStudent.tuitionTotal - paymentStudent.tuitionPaid)).toLocaleString()}
              </span>
            </div>

            <form onSubmit={handlePaymentSubmit} className="space-y-3 text-xs">
              <div className="space-y-1">
                <label className="text-slate-600 font-semibold">Payment Amount (PHP)</label>
                <input
                  type="number"
                  required
                  min="100"
                  value={paymentAmount}
                  onChange={(e) => setPaymentAmount(Number(e.target.value))}
                  className="w-full p-2.5 border border-slate-300 rounded font-mono font-bold text-slate-900"
                />
              </div>

              <div className="space-y-1">
                <label className="text-slate-600 font-semibold">Payment Channel</label>
                <select
                  value={paymentMethod}
                  onChange={(e) => setPaymentMethod(e.target.value)}
                  className="w-full p-2.5 border border-slate-300 rounded bg-white"
                >
                  <option value="GCash">GCash</option>
                  <option value="Maya">Maya</option>
                  <option value="Bank Transfer (BDO)">Bank Transfer (BDO)</option>
                  <option value="Bank Transfer (BPI)">Bank Transfer (BPI)</option>
                  <option value="Cash / Campus Cashier">Cash / Campus Cashier</option>
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-slate-600 font-semibold">Reference / Receipt #</label>
                <input
                  type="text"
                  value={paymentRef}
                  onChange={(e) => setPaymentRef(e.target.value)}
                  placeholder="e.g. GC-98234812"
                  className="w-full p-2.5 border border-slate-300 rounded font-mono"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsPaymentModalOpen(false)}
                  className="px-4 py-2 rounded-lg border border-slate-300 text-xs font-semibold text-slate-600 hover:bg-slate-100"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-lg bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-bold transition"
                >
                  Issue Official Receipt
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* NEW STUDENT MODAL */}
      {isNewStudentModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 space-y-4 shadow-2xl border border-slate-200">
            <div className="flex items-center justify-between">
              <h3 className="font-serif text-lg font-bold text-[#18392B]">
                Create Student Account & ID
              </h3>
              <button onClick={() => setIsNewStudentModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleNewStudentSubmit} className="space-y-3 text-xs">
              <div className="space-y-1">
                <label className="text-slate-600 font-semibold">Student Full Name</label>
                <input
                  type="text"
                  required
                  value={newStudentName}
                  onChange={(e) => setNewStudentName(e.target.value)}
                  placeholder="e.g. Hannah Grace Morales"
                  className="w-full p-2.5 border border-slate-300 rounded"
                />
              </div>

              <div className="space-y-1">
                <label className="text-slate-600 font-semibold">Permanent Student ID Number</label>
                <input
                  type="text"
                  required
                  value={newStudentId}
                  onChange={(e) => setNewStudentId(e.target.value)}
                  className="w-full p-2.5 border border-slate-300 rounded font-mono font-bold text-[#18392B]"
                />
              </div>

              <div className="space-y-1">
                <label className="text-slate-600 font-semibold">Student Email (Gmail / Institutional)</label>
                <input
                  type="email"
                  value={newStudentEmail}
                  onChange={(e) => setNewStudentEmail(e.target.value)}
                  placeholder="student@gmail.com"
                  className="w-full p-2.5 border border-slate-300 rounded font-mono"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div className="space-y-1">
                  <label className="text-slate-600 font-semibold">Degree Program</label>
                  <select
                    value={newStudentProgram}
                    onChange={(e) => setNewStudentProgram(e.target.value)}
                    className="w-full p-2.5 border border-slate-300 rounded bg-white"
                  >
                    <option value="Bachelor of Theology">Bachelor of Theology</option>
                    <option value="Bachelor of Ministry">Bachelor of Ministry</option>
                    <option value="Master of Divinity">Master of Divinity</option>
                    <option value="Diploma in Christian Ministry">Diploma in Ministry</option>
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="text-slate-600 font-semibold">Year Level</label>
                  <select
                    value={newStudentYear}
                    onChange={(e) => setNewStudentYear(e.target.value)}
                    className="w-full p-2.5 border border-slate-300 rounded bg-white"
                  >
                    <option value="1st Year">1st Year</option>
                    <option value="2nd Year">2nd Year</option>
                    <option value="3rd Year">3rd Year</option>
                    <option value="4th Year">4th Year</option>
                  </select>
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsNewStudentModalOpen(false)}
                  className="px-4 py-2 rounded-lg border border-slate-300 text-xs font-semibold text-slate-600 hover:bg-slate-100"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-lg bg-[#18392B] hover:bg-[#588B76] hover:text-[#18392B] text-white text-xs font-bold transition"
                >
                  Create Student
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
