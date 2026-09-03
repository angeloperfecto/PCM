'use client';

import React, { useState } from 'react';
import { usePCM } from '@/lib/store';
import {
  OnlineEnrollment,
  StudentProfile,
  AcademicSubject,
  PreEnlistmentRecord,
  AddDropRequest,
  FeeStructureItem,
  EnrollmentStatus,
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
  LayoutDashboard,
  ShieldCheck,
  Settings,
  Layers,
  Users,
  ChevronRight,
  Printer,
  Sparkles,
  ToggleLeft,
  ToggleRight,
  Building,
} from 'lucide-react';

export type EnrollmentAdminSubTab =
  | 'dashboard'
  | 'students'
  | 'pre-enlistment'
  | 'enrollments'
  | 'add-drop'
  | 'academic-periods'
  | 'subjects'
  | 'sections'
  | 'instructors'
  | 'fees'
  | 'settings';

export const AdminEnrollmentsTab: React.FC = () => {
  const {
    enrollments,
    students,
    studentProfile,
    academicSubjects,
    addAcademicSubject,
    updateAcademicSubject,
    deleteAcademicSubject,
    preEnlistments,
    submitPreEnlistment,
    updatePreEnlistmentStatus,
    addDropRequests,
    reviewAddDropRequest,
    feeStructure,
    addFeeStructureItem,
    updateFeeStructureItem,
    deleteFeeStructureItem,
    approveEnrollment,
    returnEnrollmentForCorrection,
    rejectEnrollment,
    deleteEnrollment,
    createStudentProfile,
    updateStudentProfile,
    deleteStudentProfile,
    addStudentGrade,
    recordStudentPayment,
    addToast,
    programs,
    faculty,
    exportDatabaseJson,
  } = usePCM();

  // Active Subtab
  const [activeSubTab, setActiveSubTab] = useState<EnrollmentAdminSubTab>('dashboard');

  // Search & Filter
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [programFilter, setProgramFilter] = useState<string>('all');

  // Modals & Drawers
  const [selectedEnrollment, setSelectedEnrollment] = useState<OnlineEnrollment | null>(null);
  const [selectedStudentDossier, setSelectedStudentDossier] = useState<StudentProfile | null>(null);
  const [isCORModalOpen, setIsCORModalOpen] = useState(false);
  const [corStudent, setCorStudent] = useState<StudentProfile | null>(null);

  // Return for correction modal state
  const [isReturnModalOpen, setIsReturnModalOpen] = useState(false);
  const [returnTargetId, setReturnTargetId] = useState<string>('');
  const [returnFeedback, setReturnFeedback] = useState<string>('');

  // Pre-enlistment Review modal
  const [selectedPreEnlistment, setSelectedPreEnlistment] = useState<PreEnlistmentRecord | null>(null);
  const [preEnlistmentRemarks, setPreEnlistmentRemarks] = useState('');

  // Add / Edit Subject modal
  const [isSubjectModalOpen, setIsSubjectModalOpen] = useState(false);
  const [subjectForm, setSubjectForm] = useState({
    code: '',
    title: '',
    units: 3,
    schedule: 'Mon/Wed 8:00–9:30 AM',
    room: 'Room 201',
    instructor: 'Dr. Benjamin Villanueva',
    section: 'BTH-1A',
    capacity: 35,
    semester: '1st Semester',
    academicYear: '2026–2027',
  });

  // Add Student Profile modal
  const [isNewStudentModalOpen, setIsNewStudentModalOpen] = useState(false);
  const [newStudentForm, setNewStudentForm] = useState({
    name: '',
    studentId: '2026-PCM-5001',
    email: '',
    phone: '0917-555-0199',
    program: 'Bachelor of Theology',
    yearLevel: '1st Year',
  });

  // Add Fee Item Modal
  const [isFeeModalOpen, setIsFeeModalOpen] = useState(false);
  const [feeForm, setFeeForm] = useState({
    name: '',
    category: 'Miscellaneous' as 'Tuition' | 'Miscellaneous' | 'Laboratory' | 'Other',
    amount: 500,
    isPerUnit: false,
    required: true,
  });

  // System Governance Switches state
  const [govSwitches, setGovSwitches] = useState({
    allowPreEnlistment: true,
    allowOnlineRegistration: true,
    allowAddDrop: true,
    requireFinanceClearance: true,
    emergencySuspensionLock: false,
  });

  // Academic Periods State
  const [academicPeriods, setAcademicPeriods] = useState([
    {
      id: 'term-1',
      code: 'AY 2026–2027 (1st Sem)',
      name: '1st Semester, Academic Year 2026–2027',
      status: 'Active',
      registrationOpen: true,
      startDate: 'August 10, 2026',
      endDate: 'December 18, 2026',
      addDropCutoff: 'August 28, 2026',
    },
    {
      id: 'term-2',
      code: 'AY 2026–2027 (2nd Sem)',
      name: '2nd Semester, Academic Year 2026–2027',
      status: 'Scheduled',
      registrationOpen: false,
      startDate: 'January 11, 2027',
      endDate: 'May 28, 2027',
      addDropCutoff: 'January 29, 2027',
    },
    {
      id: 'term-3',
      code: 'Summer 2027',
      name: 'Summer Intensive Ministry Term 2027',
      status: 'Scheduled',
      registrationOpen: false,
      startDate: 'June 7, 2027',
      endDate: 'July 16, 2027',
      addDropCutoff: 'June 11, 2027',
    },
  ]);

  // KPIs
  const totalEnrollments = enrollments.length;
  const pendingEnrollments = enrollments.filter(
    (e) => e.status === 'Submitted' || e.status === 'Under Review'
  ).length;
  const approvedEnrollments = enrollments.filter((e) => e.status === 'Approved').length;
  const returnedEnrollments = enrollments.filter((e) => e.status === 'Returned for Correction').length;
  const pendingPreEnlistments = preEnlistments.filter((p) => p.status === 'Submitted').length;
  const pendingAddDrop = addDropRequests.filter((a) => a.status === 'Pending').length;

  // Student list resolution
  const allStudents = students.length > 0 ? students : [studentProfile];
  const filteredStudents = allStudents.filter((s) => {
    const matchesSearch =
      (s.fullName || s.name || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (s.studentId || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (s.email || '').toLowerCase().includes(searchQuery.toLowerCase());
    const matchesProgram =
      programFilter === 'all' || (s.degreeProgram || s.program || '') === programFilter;
    return matchesSearch && matchesProgram;
  });

  // Filtered Enrollments
  const filteredEnrollments = enrollments.filter((e) => {
    const matchesSearch =
      (e.studentName || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (e.studentId || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (e.referenceNumber || '').toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === 'all' || e.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  // Handlers
  const handleApproveEnrollment = async (enrollment: OnlineEnrollment) => {
    const success = await approveEnrollment(enrollment.id);
    if (success && selectedEnrollment?.id === enrollment.id) {
      setSelectedEnrollment({ ...enrollment, status: 'Approved' });
    }
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

  const handleApprovePreEnlistment = async (id: string) => {
    await updatePreEnlistmentStatus(id, 'Approved', preEnlistmentRemarks || 'Course selection cleared by Dean');
    setSelectedPreEnlistment(null);
  };

  const handleReturnPreEnlistment = async (id: string) => {
    await updatePreEnlistmentStatus(id, 'Returned for Revision', preEnlistmentRemarks || 'Please review elective units with advisor.');
    setSelectedPreEnlistment(null);
  };

  const handleAddSubjectSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!subjectForm.code || !subjectForm.title) return;
    await addAcademicSubject({
      code: subjectForm.code.trim().toUpperCase(),
      title: subjectForm.title.trim(),
      units: Number(subjectForm.units),
      schedule: subjectForm.schedule,
      room: subjectForm.room,
      instructor: subjectForm.instructor,
      section: subjectForm.section,
      capacity: Number(subjectForm.capacity),
      enrolledCount: 0,
      status: 'Open',
      semester: subjectForm.semester,
      academicYear: subjectForm.academicYear,
      prerequisites: [],
    });
    setIsSubjectModalOpen(false);
    setSubjectForm({
      code: '',
      title: '',
      units: 3,
      schedule: 'Mon/Wed 8:00–9:30 AM',
      room: 'Room 201',
      instructor: 'Dr. Benjamin Villanueva',
      section: 'BTH-1A',
      capacity: 35,
      semester: '1st Semester',
      academicYear: '2026–2027',
    });
  };

  const handleNewStudentSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newStudentForm.name.trim() || !newStudentForm.studentId.trim()) return;
    await createStudentProfile({
      studentId: newStudentForm.studentId.trim(),
      name: newStudentForm.name.trim(),
      fullName: newStudentForm.name.trim(),
      email: newStudentForm.email.trim() || `${newStudentForm.studentId.toLowerCase()}@student.pcm.edu.ph`,
      phone: newStudentForm.phone,
      degreeProgram: newStudentForm.program,
      program: newStudentForm.program,
      yearLevel: newStudentForm.yearLevel,
      academicStatus: 'Regular',
      academicYear: '2026–2027',
      currentSemester: '1st Semester, AY 2026–2027',
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
  };

  const handleAddFeeSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!feeForm.name) return;
    await addFeeStructureItem({
      name: feeForm.name.trim(),
      category: feeForm.category,
      amount: Number(feeForm.amount),
      isPerUnit: feeForm.isPerUnit,
      required: feeForm.required,
    });
    setIsFeeModalOpen(false);
  };

  const handlePrintCOR = (student: StudentProfile) => {
    setCorStudent(student);
    setIsCORModalOpen(true);
  };

  return (
    <div className="space-y-6 font-sans">
      {/* 1. INSTITUTIONAL SYSTEM HEADER */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-2xl bg-[#18392B] text-emerald-400 flex items-center justify-center shrink-0 shadow-md">
            <GraduationCap className="w-7 h-7" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="font-serif text-xl sm:text-2xl font-bold text-[#18392B]">
                PCM Enrollment & Academic Administration
              </h2>
              <span className="text-[10px] bg-emerald-100 text-emerald-800 font-bold px-2 py-0.5 rounded-full uppercase tracking-wider">
                AY 2026–2027 Live
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Comprehensive institutional management for online enrollment, student directory, curriculum catalog, class schedules, and billing assessments.
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2 shrink-0">
          <button
            onClick={() => setIsNewStudentModalOpen(true)}
            className="bg-[#18392B] hover:bg-[#588B76] text-white hover:text-[#18392B] font-semibold text-xs px-3.5 py-2.5 rounded-xl transition flex items-center gap-1.5 cursor-pointer shadow-xs"
          >
            <Plus className="w-4 h-4" />
            <span>Add Student Profile</span>
          </button>
          <button
            onClick={() => setIsSubjectModalOpen(true)}
            className="bg-white hover:bg-slate-100 text-slate-700 border border-slate-300 font-semibold text-xs px-3.5 py-2.5 rounded-xl transition flex items-center gap-1.5 cursor-pointer shadow-xs"
          >
            <Plus className="w-4 h-4 text-[#588B76]" />
            <span>Add Course</span>
          </button>
        </div>
      </div>

      {/* 2. SUB-NAVIGATION MODULE TABS */}
      <div className="bg-white p-2 rounded-2xl border border-slate-200 shadow-xs flex items-center gap-1.5 overflow-x-auto text-xs font-bold scrollbar-none">
        {[
          { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
          { id: 'students', label: 'Student Directory', icon: Users, count: allStudents.length },
          { id: 'pre-enlistment', label: 'Pre-Enlistment', icon: FileCheck, count: pendingPreEnlistments, isPending: true },
          { id: 'enrollments', label: 'Enrollment Queue', icon: GraduationCap, count: pendingEnrollments, isPending: true },
          { id: 'add-drop', label: 'Adding & Dropping', icon: RotateCcw, count: pendingAddDrop, isPending: true },
          { id: 'academic-periods', label: 'Academic Terms', icon: Calendar },
          { id: 'subjects', label: 'Curriculum Catalog', icon: BookOpen, count: academicSubjects.length },
          { id: 'sections', label: 'Class Schedules', icon: Layers },
          { id: 'instructors', label: 'Faculty Load', icon: User, count: faculty.length },
          { id: 'fees', label: 'Tuition & Fee Policy', icon: DollarSign },
          { id: 'settings', label: 'System Governance', icon: Settings },
        ].map((tab) => {
          const Icon = tab.icon;
          const isActive = activeSubTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveSubTab(tab.id as EnrollmentAdminSubTab)}
              className={`px-3.5 py-2.5 rounded-xl flex items-center gap-2 whitespace-nowrap transition cursor-pointer shrink-0 ${
                isActive
                  ? 'bg-[#18392B] text-white shadow-xs'
                  : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
              }`}
            >
              <Icon className={`w-4 h-4 ${isActive ? 'text-emerald-400' : 'text-[#588B76]'}`} />
              <span>{tab.label}</span>
              {tab.count !== undefined && (
                <span
                  className={`text-[10px] px-1.5 py-0.2 rounded-full font-mono ${
                    isActive
                      ? 'bg-white/20 text-white'
                      : tab.isPending && tab.count > 0
                      ? 'bg-amber-500 text-white font-bold'
                      : 'bg-slate-100 text-slate-700'
                  }`}
                >
                  {tab.count}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* ========================================================================= */}
      {/* SUBVIEW 1: DASHBOARD OVERVIEW */}
      {/* ========================================================================= */}
      {activeSubTab === 'dashboard' && (
        <div className="space-y-6">
          {/* Active Period Banner */}
          <div className="bg-gradient-to-r from-[#18392B] via-[#204938] to-[#10261D] rounded-2xl p-6 text-white shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
            <div className="space-y-1">
              <div className="inline-flex items-center gap-2 px-2.5 py-0.5 rounded-full bg-emerald-400/20 text-emerald-300 text-xs font-semibold">
                <Sparkles className="w-3.5 h-3.5" />
                <span>Current Term: 1st Semester, Academic Year 2026–2027</span>
              </div>
              <h3 className="font-serif text-2xl font-bold text-white">Enrollment Hub Operations Active</h3>
              <p className="text-xs text-slate-300 max-w-xl">
                Online registration window closes on August 28, 2026. Review incoming pre-enlistments and verify student payment receipts promptly.
              </p>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <button
                onClick={() => setActiveSubTab('enrollments')}
                className="bg-amber-400 hover:bg-amber-300 text-slate-950 font-bold text-xs px-4 py-2.5 rounded-xl shadow-md transition cursor-pointer"
              >
                Review Pending ({pendingEnrollments})
              </button>
              <button
                onClick={() => setActiveSubTab('pre-enlistment')}
                className="bg-white/10 hover:bg-white/20 text-white border border-white/20 font-semibold text-xs px-3.5 py-2.5 rounded-xl transition cursor-pointer"
              >
                Pre-Enlistments ({pendingPreEnlistments})
              </button>
            </div>
          </div>

          {/* KPI Metric Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
              <span className="text-[11px] font-mono text-slate-500 uppercase block">Total Enrolled</span>
              <span className="font-serif text-3xl font-bold text-[#18392B]">{approvedEnrollments}</span>
              <span className="text-[11px] text-emerald-600 block mt-1">Official COR Issued</span>
            </div>
            <div className="bg-white p-4 rounded-xl border border-amber-200 shadow-xs bg-amber-50/40">
              <span className="text-[11px] font-mono text-amber-800 uppercase block">Pending Review</span>
              <span className="font-serif text-3xl font-bold text-amber-700">{pendingEnrollments}</span>
              <span className="text-[11px] text-amber-700 block mt-1">Awaiting Registrar check</span>
            </div>
            <div className="bg-white p-4 rounded-xl border border-blue-200 shadow-xs bg-blue-50/40">
              <span className="text-[11px] font-mono text-blue-800 uppercase block">Pre-Enlisted</span>
              <span className="font-serif text-3xl font-bold text-blue-700">{preEnlistments.length}</span>
              <span className="text-[11px] text-blue-700 block mt-1">{pendingPreEnlistments} pending advising</span>
            </div>
            <div className="bg-white p-4 rounded-xl border border-purple-200 shadow-xs bg-purple-50/40">
              <span className="text-[11px] font-mono text-purple-800 uppercase block">Add/Drop Requests</span>
              <span className="font-serif text-3xl font-bold text-purple-700">{addDropRequests.length}</span>
              <span className="text-[11px] text-purple-700 block mt-1">{pendingAddDrop} pending resolution</span>
            </div>
          </div>

          {/* Visual Enrollment Funnel Pipeline */}
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-4">
            <h4 className="font-serif text-base font-bold text-[#18392B] flex items-center gap-2">
              <Layers className="w-5 h-5 text-[#588B76]" />
              <span>Enrollment Lifecycle Pipeline Funnel</span>
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-5 gap-3">
              {[
                { stage: '1. Pre-Enlistment', count: preEnlistments.length, desc: 'Courses chosen', color: 'border-blue-300 bg-blue-50/60 text-blue-900' },
                { stage: '2. Application Filed', count: totalEnrollments, desc: 'Submitted by student', color: 'border-amber-300 bg-amber-50/60 text-amber-900' },
                { stage: '3. Dean Advising', count: enrollments.filter(e => e.status === 'Under Review').length, desc: 'Load evaluation', color: 'border-indigo-300 bg-indigo-50/60 text-indigo-900' },
                { stage: '4. Finance Clearance', count: enrollments.filter(e => e.paymentReference).length, desc: 'Downpayment logged', color: 'border-emerald-300 bg-emerald-50/60 text-emerald-900' },
                { stage: '5. Officially Enrolled', count: approvedEnrollments, desc: 'COR generated', color: 'border-[#588B76] bg-[#18392B] text-white' },
              ].map((step, i) => (
                <div key={i} className={`p-4 rounded-xl border ${step.color} flex flex-col justify-between`}>
                  <div>
                    <span className="text-[11px] font-bold uppercase tracking-wider block opacity-80">{step.stage}</span>
                    <span className="text-2xl font-serif font-bold mt-1 block">{step.count}</span>
                  </div>
                  <span className="text-[10px] opacity-75 mt-2">{step.desc}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Quick Action Operations */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs space-y-3">
              <h5 className="font-bold text-sm text-slate-800 flex items-center gap-2">
                <FileCheck className="w-4 h-4 text-[#588B76]" />
                <span>Quick Advising Queue</span>
              </h5>
              <p className="text-xs text-slate-500">
                {pendingPreEnlistments} student pre-enlistments require Academic Dean course clearance.
              </p>
              <button
                onClick={() => setActiveSubTab('pre-enlistment')}
                className="w-full bg-[#18392B] hover:bg-[#588B76] text-white text-xs font-semibold py-2 rounded-lg transition cursor-pointer"
              >
                Go to Pre-Enlistment Advising
              </button>
            </div>

            <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs space-y-3">
              <h5 className="font-bold text-sm text-slate-800 flex items-center gap-2">
                <GraduationCap className="w-4 h-4 text-[#588B76]" />
                <span>Registrar Approvals</span>
              </h5>
              <p className="text-xs text-slate-500">
                {pendingEnrollments} official enrollment applications need credential & downpayment check.
              </p>
              <button
                onClick={() => setActiveSubTab('enrollments')}
                className="w-full bg-[#18392B] hover:bg-[#588B76] text-white text-xs font-semibold py-2 rounded-lg transition cursor-pointer"
              >
                Open Enrollment Workflow Queue
              </button>
            </div>

            <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs space-y-3">
              <h5 className="font-bold text-sm text-slate-800 flex items-center gap-2">
                <Download className="w-4 h-4 text-[#588B76]" />
                <span>System Data Backup</span>
              </h5>
              <p className="text-xs text-slate-500">
                Generate an immediate JSON snapshot of all student enrollment files, catalog, and grades.
              </p>
              <button
                onClick={() => {
                  const json = exportDatabaseJson();
                  const blob = new Blob([json], { type: 'application/json' });
                  const url = URL.createObjectURL(blob);
                  const a = document.createElement('a');
                  a.href = url;
                  a.download = `pcm-enrollment-export-${new Date().toISOString().split('T')[0]}.json`;
                  a.click();
                  URL.revokeObjectURL(url);
                  addToast('success', 'Backup Downloaded', 'Enrollment database exported successfully.');
                }}
                className="w-full bg-slate-800 hover:bg-slate-900 text-white text-xs font-semibold py-2 rounded-lg transition cursor-pointer"
              >
                Export Database JSON
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* SUBVIEW 2: STUDENT DIRECTORY & PROFILES */}
      {/* ========================================================================= */}
      {activeSubTab === 'students' && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-4 rounded-xl border border-slate-200">
            <div className="flex flex-wrap items-center gap-3">
              <div className="relative">
                <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  placeholder="Search by student name, ID, or email..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9 pr-3 py-2 text-xs border border-slate-300 rounded-lg w-64 focus:outline-none focus:border-[#588B76]"
                />
              </div>

              <select
                value={programFilter}
                onChange={(e) => setProgramFilter(e.target.value)}
                className="text-xs border border-slate-300 rounded-lg px-3 py-2 focus:outline-none focus:border-[#588B76] bg-white text-slate-700"
              >
                <option value="all">All Degree Programs</option>
                <option value="Bachelor of Theology">Bachelor of Theology</option>
                <option value="Associate of Theology">Associate of Theology</option>
                <option value="Master of Divinity">Master of Divinity</option>
                <option value="Senior High School (GAS Strand)">Senior High School (GAS Strand)</option>
              </select>
            </div>

            <button
              onClick={() => setIsNewStudentModalOpen(true)}
              className="bg-[#18392B] hover:bg-[#588B76] text-white text-xs font-bold px-3.5 py-2 rounded-lg transition flex items-center gap-1.5 cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Register New Student</span>
            </button>
          </div>

          {/* Students Table */}
          <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
            <table className="w-full text-left text-xs text-slate-700 border-collapse">
              <thead className="bg-slate-50 text-slate-500 font-semibold border-b border-slate-200">
                <tr>
                  <th className="p-3.5">Student ID & Name</th>
                  <th className="p-3.5">Degree Program</th>
                  <th className="p-3.5">Year Level</th>
                  <th className="p-3.5">Academic Status</th>
                  <th className="p-3.5">Tuition Balance</th>
                  <th className="p-3.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredStudents.map((student) => (
                  <tr key={student.id} className="hover:bg-slate-50 transition">
                    <td className="p-3.5">
                      <div className="font-bold text-slate-900">{student.fullName || student.name}</div>
                      <div className="text-[11px] font-mono text-slate-500">{student.studentId} • {student.email}</div>
                    </td>
                    <td className="p-3.5">
                      <span className="font-medium text-slate-800">{student.degreeProgram || student.program}</span>
                    </td>
                    <td className="p-3.5 font-medium text-slate-600">{student.yearLevel}</td>
                    <td className="p-3.5">
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold ${
                        student.academicStatus === 'Regular'
                          ? 'bg-emerald-100 text-emerald-800'
                          : 'bg-amber-100 text-amber-800'
                      }`}>
                        {student.academicStatus || 'Regular'}
                      </span>
                    </td>
                    <td className="p-3.5 font-mono font-bold text-slate-900">
                      ₱{(student.tuitionBalance || 0).toLocaleString()}
                    </td>
                    <td className="p-3.5 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => setSelectedStudentDossier(student)}
                          className="p-1.5 text-[#588B76] hover:bg-emerald-50 rounded-lg transition cursor-pointer"
                          title="View Full Student Dossier"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handlePrintCOR(student)}
                          className="p-1.5 text-indigo-600 hover:bg-indigo-50 rounded-lg transition cursor-pointer"
                          title="Print Certificate of Registration (COR)"
                        >
                          <Printer className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* SUBVIEW 3: COURSE PRE-ENLISTMENT */}
      {/* ========================================================================= */}
      {activeSubTab === 'pre-enlistment' && (
        <div className="space-y-4">
          <div className="bg-white p-4 rounded-xl border border-slate-200 flex items-center justify-between">
            <div>
              <h4 className="font-bold text-sm text-[#18392B]">Academic Dean Pre-Enlistment Advising Queue</h4>
              <p className="text-xs text-slate-500">
                Review courses drafted by students prior to official Registrar application filing.
              </p>
            </div>
            <span className="text-xs font-bold text-slate-600 bg-slate-100 px-3 py-1 rounded-lg font-mono">
              Total Submissions: {preEnlistments.length}
            </span>
          </div>

          <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
            <table className="w-full text-left text-xs text-slate-700">
              <thead className="bg-slate-50 text-slate-500 font-semibold border-b border-slate-200">
                <tr>
                  <th className="p-3.5">Student</th>
                  <th className="p-3.5">Program & Year</th>
                  <th className="p-3.5">Semester</th>
                  <th className="p-3.5">Requested Units</th>
                  <th className="p-3.5">Status</th>
                  <th className="p-3.5 text-right">Review Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {preEnlistments.map((record) => (
                  <tr key={record.id} className="hover:bg-slate-50 transition">
                    <td className="p-3.5">
                      <div className="font-bold text-slate-900">{record.studentName}</div>
                      <div className="text-[11px] font-mono text-slate-500">{record.studentId}</div>
                    </td>
                    <td className="p-3.5">
                      <div>{record.program || record.degreeProgram}</div>
                      <div className="text-[11px] text-slate-500">{record.yearLevel}</div>
                    </td>
                    <td className="p-3.5 font-medium">{record.semester}</td>
                    <td className="p-3.5 font-bold font-mono text-[#18392B]">{record.totalUnits} units</td>
                    <td className="p-3.5">
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold ${
                        record.status === 'Approved'
                          ? 'bg-emerald-100 text-emerald-800'
                          : record.status === 'Submitted'
                          ? 'bg-amber-100 text-amber-800'
                          : 'bg-rose-100 text-rose-800'
                      }`}>
                        {record.status}
                      </span>
                    </td>
                    <td className="p-3.5 text-right">
                      <button
                        onClick={() => {
                          setSelectedPreEnlistment(record);
                          setPreEnlistmentRemarks(record.adminRemarks || '');
                        }}
                        className="bg-[#18392B] hover:bg-[#588B76] text-white text-[11px] font-semibold px-3 py-1.5 rounded-lg transition cursor-pointer"
                      >
                        Inspect & Advise
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* SUBVIEW 4: OFFICIAL ENROLLMENT QUEUE */}
      {/* ========================================================================= */}
      {activeSubTab === 'enrollments' && (
        <div className="space-y-4">
          {/* Filter Bar */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-4 rounded-xl border border-slate-200">
            <div className="flex items-center gap-2">
              {['all', 'Submitted', 'Under Review', 'Approved', 'Returned for Correction', 'Rejected'].map((status) => (
                <button
                  key={status}
                  onClick={() => setStatusFilter(status)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition cursor-pointer ${
                    statusFilter === status
                      ? 'bg-[#18392B] text-white shadow-xs'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  {status === 'all' ? 'All Applications' : status}
                </button>
              ))}
            </div>

            <div className="relative">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="Search reference, student name..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9 pr-3 py-2 text-xs border border-slate-300 rounded-lg w-60 focus:outline-none focus:border-[#588B76]"
              />
            </div>
          </div>

          {/* Enrollments Table */}
          <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
            <table className="w-full text-left text-xs text-slate-700">
              <thead className="bg-slate-50 text-slate-500 font-semibold border-b border-slate-200">
                <tr>
                  <th className="p-3.5">Reference #</th>
                  <th className="p-3.5">Student Name & ID</th>
                  <th className="p-3.5">Program & Year</th>
                  <th className="p-3.5">Units & Load</th>
                  <th className="p-3.5">Est. Tuition</th>
                  <th className="p-3.5">Payment Ref</th>
                  <th className="p-3.5">Status</th>
                  <th className="p-3.5 text-right">Workflow Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredEnrollments.map((enr) => (
                  <tr key={enr.id} className="hover:bg-slate-50 transition">
                    <td className="p-3.5 font-mono font-bold text-[#18392B]">{enr.referenceNumber}</td>
                    <td className="p-3.5">
                      <div className="font-bold text-slate-900">{enr.studentName}</div>
                      <div className="text-[11px] font-mono text-slate-500">{enr.studentId}</div>
                    </td>
                    <td className="p-3.5">
                      <div>{enr.programTitle || enr.programName}</div>
                      <div className="text-[11px] text-slate-500">{enr.yearLevel}</div>
                    </td>
                    <td className="p-3.5">
                      <span className="font-bold text-slate-900">{enr.totalUnits} units</span>
                      <div className="text-[11px] text-slate-500">{enr.selectedSubjects?.length || 0} courses</div>
                    </td>
                    <td className="p-3.5 font-mono font-bold text-slate-900">
                      ₱{(enr.estimatedTuition || 0).toLocaleString()}
                    </td>
                    <td className="p-3.5 font-mono text-slate-600">
                      {enr.paymentReference || 'Unpaid / On-Site'}
                    </td>
                    <td className="p-3.5">
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                        enr.status === 'Approved'
                          ? 'bg-emerald-100 text-emerald-800'
                          : enr.status === 'Submitted'
                          ? 'bg-amber-100 text-amber-800'
                          : enr.status === 'Returned for Correction'
                          ? 'bg-rose-100 text-rose-800'
                          : 'bg-slate-100 text-slate-700'
                      }`}>
                        {enr.status}
                      </span>
                    </td>
                    <td className="p-3.5 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => setSelectedEnrollment(enr)}
                          className="bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold px-2.5 py-1 rounded-lg text-[11px] transition cursor-pointer"
                        >
                          Review
                        </button>
                        {enr.status !== 'Approved' && (
                          <button
                            onClick={() => handleApproveEnrollment(enr)}
                            className="bg-emerald-600 hover:bg-emerald-700 text-white font-semibold px-2.5 py-1 rounded-lg text-[11px] transition cursor-pointer"
                          >
                            Approve
                          </button>
                        )}
                        {enr.status === 'Approved' && (
                          <button
                            onClick={() => {
                              const found = allStudents.find((s) => s.studentId === enr.studentId) || studentProfile;
                              handlePrintCOR(found);
                            }}
                            className="p-1 text-[#588B76] hover:bg-emerald-50 rounded transition"
                            title="Print Official COR"
                          >
                            <Printer className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* SUBVIEW 5: ADDING & DROPPING */}
      {/* ========================================================================= */}
      {activeSubTab === 'add-drop' && (
        <div className="space-y-4">
          <div className="bg-white p-4 rounded-xl border border-slate-200 flex items-center justify-between">
            <div>
              <h4 className="font-bold text-sm text-[#18392B]">Student Adding & Dropping Course Adjustments</h4>
              <p className="text-xs text-slate-500">
                Requests to add or drop registered subjects during the active adjustment window.
              </p>
            </div>
            <span className="text-xs font-bold bg-amber-100 text-amber-800 px-3 py-1 rounded-lg font-mono">
              Pending Evaluation: {pendingAddDrop}
            </span>
          </div>

          <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
            <table className="w-full text-left text-xs text-slate-700">
              <thead className="bg-slate-50 text-slate-500 font-semibold border-b border-slate-200">
                <tr>
                  <th className="p-3.5">Action</th>
                  <th className="p-3.5">Student</th>
                  <th className="p-3.5">Course Code & Title</th>
                  <th className="p-3.5">Units</th>
                  <th className="p-3.5">Reason Stated</th>
                  <th className="p-3.5">Filing Date</th>
                  <th className="p-3.5">Status</th>
                  <th className="p-3.5 text-right">Registrar Resolution</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {addDropRequests.map((req) => (
                  <tr key={req.id} className="hover:bg-slate-50 transition">
                    <td className="p-3.5">
                      <span className={`px-2.5 py-1 rounded-md text-[10px] font-bold uppercase ${
                        req.action === 'Add' ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'
                      }`}>
                        {req.action}
                      </span>
                    </td>
                    <td className="p-3.5">
                      <div className="font-bold text-slate-900">{req.studentName}</div>
                      <div className="text-[11px] font-mono text-slate-500">{req.studentId}</div>
                    </td>
                    <td className="p-3.5">
                      <div className="font-bold font-mono text-[#18392B]">{req.subjectCode}</div>
                      <div className="text-[11px] text-slate-600">{req.subjectTitle}</div>
                    </td>
                    <td className="p-3.5 font-bold font-mono">{req.units}u</td>
                    <td className="p-3.5 max-w-xs text-slate-600 truncate" title={req.reason}>
                      {req.reason}
                    </td>
                    <td className="p-3.5 font-mono text-slate-500">{req.dateSubmitted}</td>
                    <td className="p-3.5">
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold ${
                        req.status === 'Approved'
                          ? 'bg-emerald-100 text-emerald-800'
                          : req.status === 'Pending'
                          ? 'bg-amber-100 text-amber-800'
                          : 'bg-rose-100 text-rose-800'
                      }`}>
                        {req.status}
                      </span>
                    </td>
                    <td className="p-3.5 text-right">
                      {req.status === 'Pending' ? (
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => reviewAddDropRequest(req.id, 'Approved', 'Cleared by Academic Registrar')}
                            className="bg-emerald-600 hover:bg-emerald-700 text-white px-2.5 py-1 rounded-lg text-[11px] font-semibold transition cursor-pointer"
                          >
                            Approve
                          </button>
                          <button
                            onClick={() => reviewAddDropRequest(req.id, 'Rejected', 'Exceeds maximum allowable units')}
                            className="bg-rose-600 hover:bg-rose-700 text-white px-2.5 py-1 rounded-lg text-[11px] font-semibold transition cursor-pointer"
                          >
                            Disapprove
                          </button>
                        </div>
                      ) : (
                        <span className="text-[11px] text-slate-400 font-mono">Resolved</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* SUBVIEW 6: ACADEMIC PERIODS & TERMS */}
      {/* ========================================================================= */}
      {activeSubTab === 'academic-periods' && (
        <div className="space-y-4">
          <div className="bg-white p-4 rounded-xl border border-slate-200 flex items-center justify-between">
            <div>
              <h4 className="font-bold text-sm text-[#18392B]">Academic Terms & Registration Windows</h4>
              <p className="text-xs text-slate-500">
                Configure institutional calendar periods, enrollment active states, and add/drop cutoffs.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {academicPeriods.map((period) => (
              <div
                key={period.id}
                className={`p-5 rounded-2xl border ${
                  period.status === 'Active'
                    ? 'border-[#588B76] bg-emerald-50/20 ring-2 ring-[#588B76]/20'
                    : 'border-slate-200 bg-white'
                } shadow-xs space-y-3`}
              >
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-mono font-bold text-slate-500 uppercase">{period.code}</span>
                  <span
                    className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                      period.status === 'Active' ? 'bg-[#18392B] text-white' : 'bg-slate-100 text-slate-600'
                    }`}
                  >
                    {period.status}
                  </span>
                </div>

                <h5 className="font-serif text-base font-bold text-[#18392B]">{period.name}</h5>

                <div className="text-xs space-y-1 text-slate-600">
                  <div className="flex justify-between">
                    <span className="text-slate-400">Class Dates:</span>
                    <span className="font-medium">{period.startDate} – {period.endDate}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Add/Drop Deadline:</span>
                    <span className="font-medium text-amber-700">{period.addDropCutoff}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Enrollment Portal:</span>
                    <span className={`font-bold ${period.registrationOpen ? 'text-emerald-700' : 'text-slate-400'}`}>
                      {period.registrationOpen ? 'Accepting Applications' : 'Closed'}
                    </span>
                  </div>
                </div>

                <button
                  onClick={() => {
                    setAcademicPeriods((prev) =>
                      prev.map((p) => ({
                        ...p,
                        status: p.id === period.id ? 'Active' : 'Scheduled',
                        registrationOpen: p.id === period.id,
                      }))
                    );
                    addToast('success', 'Active Period Updated', `${period.name} is now the primary enrollment term.`);
                  }}
                  disabled={period.status === 'Active'}
                  className={`w-full text-xs font-semibold py-2 rounded-xl transition cursor-pointer ${
                    period.status === 'Active'
                      ? 'bg-emerald-100 text-emerald-800 cursor-default'
                      : 'bg-slate-100 hover:bg-[#18392B] hover:text-white text-slate-700'
                  }`}
                >
                  {period.status === 'Active' ? 'Currently Active Term' : 'Set as Active Term'}
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* SUBVIEW 7: CURRICULUM & SUBJECTS CATALOG */}
      {/* ========================================================================= */}
      {activeSubTab === 'subjects' && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-4 rounded-xl border border-slate-200">
            <div>
              <h4 className="font-bold text-sm text-[#18392B]">Academic Course Catalog & Curricular Inventory</h4>
              <p className="text-xs text-slate-500">
                Authorized Seminary & College courses available for student selection and degree fulfillment.
              </p>
            </div>
            <button
              onClick={() => setIsSubjectModalOpen(true)}
              className="bg-[#18392B] hover:bg-[#588B76] text-white text-xs font-bold px-3.5 py-2 rounded-lg transition flex items-center gap-1.5 cursor-pointer shrink-0"
            >
              <Plus className="w-4 h-4" />
              <span>Add New Course</span>
            </button>
          </div>

          <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
            <table className="w-full text-left text-xs text-slate-700">
              <thead className="bg-slate-50 text-slate-500 font-semibold border-b border-slate-200">
                <tr>
                  <th className="p-3.5">Code</th>
                  <th className="p-3.5">Descriptive Title</th>
                  <th className="p-3.5">Units</th>
                  <th className="p-3.5">Class Schedule</th>
                  <th className="p-3.5">Room</th>
                  <th className="p-3.5">Instructor</th>
                  <th className="p-3.5">Capacity</th>
                  <th className="p-3.5 text-right">Manage</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {academicSubjects.map((subj) => (
                  <tr key={subj.id} className="hover:bg-slate-50 transition">
                    <td className="p-3.5 font-mono font-bold text-[#18392B]">{subj.code}</td>
                    <td className="p-3.5 font-medium text-slate-900">{subj.title}</td>
                    <td className="p-3.5 font-bold font-mono">{subj.units} units</td>
                    <td className="p-3.5 text-slate-600">{subj.schedule}</td>
                    <td className="p-3.5 font-mono text-slate-600">{subj.room}</td>
                    <td className="p-3.5 text-slate-800">{subj.instructor}</td>
                    <td className="p-3.5">
                      <span className="font-mono text-[11px] text-slate-600">
                        {subj.enrolledCount || 0}/{subj.capacity}
                      </span>
                    </td>
                    <td className="p-3.5 text-right">
                      <button
                        onClick={() => deleteAcademicSubject(subj.id)}
                        className="p-1 text-slate-400 hover:text-rose-600 transition"
                        title="Remove Subject"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* SUBVIEW 8: SECTIONS & CLASS SCHEDULES */}
      {/* ========================================================================= */}
      {activeSubTab === 'sections' && (
        <div className="space-y-4">
          <div className="bg-white p-4 rounded-xl border border-slate-200 flex items-center justify-between">
            <div>
              <h4 className="font-bold text-sm text-[#18392B]">Active Section Offerings & Class Schedules</h4>
              <p className="text-xs text-slate-500">
                Timetable matrix with room allotments, instructors, and student capacity counters.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {academicSubjects.map((subj) => {
              const enrolled = subj.enrolledCount || 18;
              const cap = subj.capacity || 30;
              const pct = Math.min(100, Math.round((enrolled / cap) * 100));

              return (
                <div key={subj.id} className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 font-mono text-[10px] font-bold">
                      {subj.section || 'SEC-A'}
                    </span>
                    <span className="font-mono font-bold text-xs text-slate-700">{subj.code}</span>
                  </div>

                  <div>
                    <h5 className="font-bold text-sm text-slate-900 leading-tight">{subj.title}</h5>
                    <p className="text-xs text-slate-500 mt-1">{subj.instructor}</p>
                  </div>

                  <div className="bg-slate-50 p-2.5 rounded-lg text-xs space-y-1 text-slate-600 font-medium">
                    <div className="flex items-center gap-2">
                      <Clock className="w-3.5 h-3.5 text-[#588B76]" />
                      <span>{subj.schedule}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Building className="w-3.5 h-3.5 text-[#588B76]" />
                      <span>{subj.room}</span>
                    </div>
                  </div>

                  <div className="space-y-1">
                    <div className="flex justify-between text-[11px] font-medium text-slate-600">
                      <span>Seat Capacity Fill</span>
                      <span className="font-mono font-bold">{enrolled}/{cap} ({pct}%)</span>
                    </div>
                    <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                      <div
                        className={`h-full transition-all ${
                          pct >= 90 ? 'bg-rose-500' : pct >= 70 ? 'bg-amber-500' : 'bg-emerald-500'
                        }`}
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* SUBVIEW 9: FACULTY TEACHING LOAD */}
      {/* ========================================================================= */}
      {activeSubTab === 'instructors' && (
        <div className="space-y-4">
          <div className="bg-white p-4 rounded-xl border border-slate-200 flex items-center justify-between">
            <div>
              <h4 className="font-bold text-sm text-[#18392B]">Faculty Roster & Teaching Load Distribution</h4>
              <p className="text-xs text-slate-500">
                Professor assignments, course allocations, and weekly teaching unit commitments.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {faculty.map((member) => (
              <div key={member.id} className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs space-y-3">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-xl bg-slate-100 overflow-hidden shrink-0 border border-slate-200">
                    <img
                      src={member.imageUrl || member.image || 'https://images.unsplash.com/photo-1544005313-94ddf0286df2'}
                      alt={member.name}
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <div>
                    <h5 className="font-bold text-sm text-slate-900">{member.name}</h5>
                    <p className="text-xs text-slate-500">{member.title}</p>
                    <span className="text-[10px] font-mono text-[#588B76] uppercase font-semibold block mt-0.5">
                      {member.department || 'Biblical Studies'}
                    </span>
                  </div>
                </div>

                <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-xs">
                  <span className="text-slate-500">Weekly Unit Load:</span>
                  <span className="font-mono font-bold text-[#18392B]">12 Units (4 Courses)</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* SUBVIEW 10: TUITION & FEE POLICY */}
      {/* ========================================================================= */}
      {activeSubTab === 'fees' && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-4 rounded-xl border border-slate-200">
            <div>
              <h4 className="font-bold text-sm text-[#18392B]">Tuition Schedule & Miscellaneous Fee Policy</h4>
              <p className="text-xs text-slate-500">
                Define per-unit rates, laboratory charges, and required registration fees for automatic student billing.
              </p>
            </div>
            <button
              onClick={() => setIsFeeModalOpen(true)}
              className="bg-[#18392B] hover:bg-[#588B76] text-white text-xs font-bold px-3.5 py-2 rounded-lg transition flex items-center gap-1.5 cursor-pointer shrink-0"
            >
              <Plus className="w-4 h-4" />
              <span>Add Fee Item</span>
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
              <span className="text-[11px] font-mono text-slate-500 uppercase block">Undergraduate Rate</span>
              <span className="font-serif text-2xl font-bold text-[#18392B]">₱850 / Unit</span>
              <p className="text-[11px] text-slate-500 mt-1">Applicable to B.Th. & Associate programs</p>
            </div>
            <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
              <span className="text-[11px] font-mono text-slate-500 uppercase block">Graduate Studies Rate</span>
              <span className="font-serif text-2xl font-bold text-[#18392B]">₱1,200 / Unit</span>
              <p className="text-[11px] text-slate-500 mt-1">M.Div. and MCL degree candidates</p>
            </div>
            <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
              <span className="text-[11px] font-mono text-slate-500 uppercase block">Downpayment Requirement</span>
              <span className="font-serif text-2xl font-bold text-emerald-700">40% Minimum</span>
              <p className="text-[11px] text-slate-500 mt-1">Required to release official COR</p>
            </div>
          </div>

          <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
            <table className="w-full text-left text-xs text-slate-700">
              <thead className="bg-slate-50 text-slate-500 font-semibold border-b border-slate-200">
                <tr>
                  <th className="p-3.5">Fee Name</th>
                  <th className="p-3.5">Category</th>
                  <th className="p-3.5">Amount</th>
                  <th className="p-3.5">Assessment Type</th>
                  <th className="p-3.5">Mandatory</th>
                  <th className="p-3.5 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {feeStructure.map((fee) => (
                  <tr key={fee.id} className="hover:bg-slate-50 transition">
                    <td className="p-3.5 font-bold text-slate-900">{fee.name}</td>
                    <td className="p-3.5">
                      <span className="px-2 py-0.5 rounded-full text-[10px] bg-slate-100 text-slate-700 font-medium">
                        {fee.category}
                      </span>
                    </td>
                    <td className="p-3.5 font-mono font-bold text-slate-900">₱{fee.amount.toLocaleString()}</td>
                    <td className="p-3.5 text-slate-600">{fee.isPerUnit ? 'Per Unit Course' : 'Fixed Per Term'}</td>
                    <td className="p-3.5">
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                        fee.required ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-100 text-slate-600'
                      }`}>
                        {fee.required ? 'Required' : 'Optional'}
                      </span>
                    </td>
                    <td className="p-3.5 text-right">
                      <button
                        onClick={() => deleteFeeStructureItem(fee.id)}
                        className="p-1 text-slate-400 hover:text-rose-600 transition cursor-pointer"
                        title="Delete Fee Item"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* SUBVIEW 11: SYSTEM GOVERNANCE & SETTINGS */}
      {/* ========================================================================= */}
      {activeSubTab === 'settings' && (
        <div className="space-y-6">
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-4">
            <h4 className="font-serif text-lg font-bold text-[#18392B] flex items-center gap-2">
              <ShieldCheck className="w-5 h-5 text-[#588B76]" />
              <span>Enrollment Governance & Feature Toggles</span>
            </h4>
            <p className="text-xs text-slate-500">
              Institutional controls to open or close student registration pipelines in real-time without database downtime.
            </p>

            <div className="divide-y divide-slate-100 text-xs">
              <div className="py-3 flex items-center justify-between">
                <div>
                  <strong className="block text-slate-900 font-bold">Allow Student Course Pre-Enlistment</strong>
                  <span className="text-slate-500">Enables the 6-step course advising planner in the student portal.</span>
                </div>
                <button
                  onClick={() => setGovSwitches((s) => ({ ...s, allowPreEnlistment: !s.allowPreEnlistment }))}
                  className={`px-3 py-1 rounded-full font-bold transition cursor-pointer ${
                    govSwitches.allowPreEnlistment ? 'bg-emerald-600 text-white' : 'bg-slate-200 text-slate-600'
                  }`}
                >
                  {govSwitches.allowPreEnlistment ? 'ENABLED' : 'DISABLED'}
                </button>
              </div>

              <div className="py-3 flex items-center justify-between">
                <div>
                  <strong className="block text-slate-900 font-bold">Allow Online Registration & Application Filing</strong>
                  <span className="text-slate-500">Allows new and returning students to submit enrollment drafts online.</span>
                </div>
                <button
                  onClick={() => setGovSwitches((s) => ({ ...s, allowOnlineRegistration: !s.allowOnlineRegistration }))}
                  className={`px-3 py-1 rounded-full font-bold transition cursor-pointer ${
                    govSwitches.allowOnlineRegistration ? 'bg-emerald-600 text-white' : 'bg-slate-200 text-slate-600'
                  }`}
                >
                  {govSwitches.allowOnlineRegistration ? 'ENABLED' : 'DISABLED'}
                </button>
              </div>

              <div className="py-3 flex items-center justify-between">
                <div>
                  <strong className="block text-slate-900 font-bold">Allow Student Adding & Dropping Requests</strong>
                  <span className="text-slate-500">Permits enrolled students to file course alteration requests.</span>
                </div>
                <button
                  onClick={() => setGovSwitches((s) => ({ ...s, allowAddDrop: !s.allowAddDrop }))}
                  className={`px-3 py-1 rounded-full font-bold transition cursor-pointer ${
                    govSwitches.allowAddDrop ? 'bg-emerald-600 text-white' : 'bg-slate-200 text-slate-600'
                  }`}
                >
                  {govSwitches.allowAddDrop ? 'ENABLED' : 'DISABLED'}
                </button>
              </div>

              <div className="py-3 flex items-center justify-between">
                <div>
                  <strong className="block text-slate-900 font-bold">Require Finance Downpayment Clearance</strong>
                  <span className="text-slate-500">Withholds Certificate of Registration until minimum downpayment is logged.</span>
                </div>
                <button
                  onClick={() => setGovSwitches((s) => ({ ...s, requireFinanceClearance: !s.requireFinanceClearance }))}
                  className={`px-3 py-1 rounded-full font-bold transition cursor-pointer ${
                    govSwitches.requireFinanceClearance ? 'bg-emerald-600 text-white' : 'bg-slate-200 text-slate-600'
                  }`}
                >
                  {govSwitches.requireFinanceClearance ? 'ENABLED' : 'DISABLED'}
                </button>
              </div>

              <div className="py-3 flex items-center justify-between bg-rose-50/50 p-2 rounded-xl">
                <div>
                  <strong className="block text-rose-900 font-bold">Emergency Enrollment System Suspension Lock</strong>
                  <span className="text-rose-700">Instantly locks down all enrollment pipelines during system audits.</span>
                </div>
                <button
                  onClick={() => setGovSwitches((s) => ({ ...s, emergencySuspensionLock: !s.emergencySuspensionLock }))}
                  className={`px-3 py-1 rounded-full font-bold transition cursor-pointer ${
                    govSwitches.emergencySuspensionLock ? 'bg-rose-700 text-white' : 'bg-slate-200 text-slate-600'
                  }`}
                >
                  {govSwitches.emergencySuspensionLock ? 'LOCKED' : 'NORMAL'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 1: STUDENT DOSSIER DRAWER */}
      {/* ========================================================================= */}
      {selectedStudentDossier && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-2xl rounded-2xl shadow-2xl border border-slate-200 overflow-hidden max-h-[90vh] flex flex-col">
            <div className="bg-[#18392B] p-4 text-white flex items-center justify-between">
              <div className="flex items-center gap-3">
                <GraduationCap className="w-6 h-6 text-emerald-400" />
                <div>
                  <h4 className="font-serif text-lg font-bold">{selectedStudentDossier.fullName || selectedStudentDossier.name}</h4>
                  <p className="text-xs text-slate-300 font-mono">{selectedStudentDossier.studentId} • {selectedStudentDossier.degreeProgram}</p>
                </div>
              </div>
              <button
                onClick={() => setSelectedStudentDossier(null)}
                className="text-white/70 hover:text-white p-1 rounded transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 overflow-y-auto space-y-6 text-xs text-slate-700 flex-1">
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-slate-50 p-3 rounded-xl">
                <div>
                  <span className="text-slate-400 block text-[10px]">Year Level</span>
                  <span className="font-bold text-slate-800">{selectedStudentDossier.yearLevel}</span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[10px]">Academic Status</span>
                  <span className="font-bold text-slate-800">{selectedStudentDossier.academicStatus}</span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[10px]">Current Term</span>
                  <span className="font-bold text-slate-800">{selectedStudentDossier.currentSemester}</span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[10px]">Tuition Balance</span>
                  <span className="font-mono font-bold text-slate-900">₱{(selectedStudentDossier.tuitionBalance || 0).toLocaleString()}</span>
                </div>
              </div>

              {/* Enrolled Courses */}
              <div className="space-y-2">
                <h5 className="font-bold text-sm text-[#18392B]">Current Enrolled Courses</h5>
                <div className="border border-slate-200 rounded-xl overflow-hidden">
                  <table className="w-full text-left">
                    <thead className="bg-slate-50 font-semibold text-slate-500 border-b border-slate-200">
                      <tr>
                        <th className="p-2.5">Course Code</th>
                        <th className="p-2.5">Descriptive Title</th>
                        <th className="p-2.5">Units</th>
                        <th className="p-2.5">Schedule & Room</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {(selectedStudentDossier.courses || []).map((c, i) => (
                        <tr key={i}>
                          <td className="p-2.5 font-mono font-bold text-[#18392B]">{c.code}</td>
                          <td className="p-2.5">{c.title}</td>
                          <td className="p-2.5 font-mono">{c.units}u</td>
                          <td className="p-2.5 text-slate-500">{c.schedule || 'TBA'} ({c.room || 'Room 201'})</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Church & Spiritual Background */}
              <div className="bg-emerald-50/40 p-4 rounded-xl border border-emerald-200/60 space-y-1">
                <span className="font-bold text-emerald-900 block">Spiritual Formation Details</span>
                <p>Home Church: <strong>{selectedStudentDossier.homeChurch || 'Philippine Church of Christ'}</strong></p>
                <p>Spiritual Mentor: <strong>{selectedStudentDossier.mentorName || 'Dr. Benjamin Villanueva'}</strong></p>
              </div>
            </div>

            <div className="p-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between">
              <button
                onClick={() => {
                  setSelectedStudentDossier(null);
                  handlePrintCOR(selectedStudentDossier);
                }}
                className="bg-[#18392B] hover:bg-[#588B76] text-white font-semibold px-4 py-2 rounded-xl transition flex items-center gap-1.5 cursor-pointer text-xs"
              >
                <Printer className="w-4 h-4" />
                <span>Print Official COR</span>
              </button>
              <button
                onClick={() => setSelectedStudentDossier(null)}
                className="text-slate-600 hover:text-slate-900 font-semibold px-4 py-2 cursor-pointer text-xs"
              >
                Close Dossier
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 2: CERTIFICATE OF REGISTRATION (COR) */}
      {/* ========================================================================= */}
      {isCORModalOpen && corStudent && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-3xl rounded-2xl shadow-2xl border border-slate-300 overflow-hidden max-h-[92vh] flex flex-col font-serif">
            {/* COR Header */}
            <div className="bg-slate-100 p-4 flex items-center justify-between border-b border-slate-200 font-sans">
              <div className="flex items-center gap-2 text-xs font-bold text-slate-700">
                <Printer className="w-4 h-4 text-[#588B76]" />
                <span>Certificate of Registration (COR) • Official Document Viewer</span>
              </div>
              <button
                onClick={() => setIsCORModalOpen(false)}
                className="text-slate-500 hover:text-slate-800 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Printable Document Body */}
            <div className="p-8 overflow-y-auto space-y-6 text-slate-900 bg-[#FAF9F6] flex-1">
              <div className="text-center space-y-1 border-b-2 border-slate-900 pb-4">
                <h3 className="font-serif text-xl font-bold uppercase tracking-widest text-[#18392B]">
                  Philippine College of Ministry
                </h3>
                <p className="text-xs text-slate-600 font-sans">
                  Office of the Academic Registrar • Baguio City, Philippines
                </p>
                <div className="text-xs font-sans font-bold uppercase tracking-widest text-slate-800 pt-1">
                  OFFICIAL CERTIFICATE OF REGISTRATION (C.O.R.)
                </div>
                <div className="text-[11px] font-mono text-slate-600">
                  Academic Year 2026–2027 • 1st Semester
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 text-xs font-sans border-b border-slate-300 pb-4">
                <div>
                  <span className="text-slate-500 block">Student Name:</span>
                  <strong className="text-sm font-serif">{corStudent.fullName || corStudent.name}</strong>
                  <span className="text-slate-500 block mt-2">Degree Program:</span>
                  <strong className="text-slate-800">{corStudent.degreeProgram || corStudent.program}</strong>
                </div>
                <div>
                  <span className="text-slate-500 block">Student ID Number:</span>
                  <strong className="font-mono text-sm">{corStudent.studentId}</strong>
                  <span className="text-slate-500 block mt-2">Year Level / Classification:</span>
                  <strong className="text-slate-800">{corStudent.yearLevel} • {corStudent.academicStatus || 'Regular'}</strong>
                </div>
              </div>

              {/* Course Matrix */}
              <div className="space-y-2 font-sans">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-700">
                  Officially Matriculated Courses
                </span>
                <table className="w-full text-left text-xs border border-slate-300">
                  <thead className="bg-slate-200 font-bold text-slate-800">
                    <tr>
                      <th className="p-2 border-b border-slate-300">Course</th>
                      <th className="p-2 border-b border-slate-300">Description</th>
                      <th className="p-2 border-b border-slate-300 text-center">Units</th>
                      <th className="p-2 border-b border-slate-300">Schedule</th>
                      <th className="p-2 border-b border-slate-300">Room</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200">
                    {((corStudent.courses && corStudent.courses.length > 0)
                      ? corStudent.courses
                      : academicSubjects.slice(0, 5)
                    ).map((c, idx) => (
                      <tr key={idx}>
                        <td className="p-2 font-mono font-bold">{c.code}</td>
                        <td className="p-2">{c.title}</td>
                        <td className="p-2 font-mono font-bold text-center">{c.units}</td>
                        <td className="p-2 text-slate-600">{c.schedule || 'MWF 8:00–9:30 AM'}</td>
                        <td className="p-2 text-slate-600">{c.room || 'Room 201'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="pt-8 grid grid-cols-2 gap-8 text-center text-xs font-sans">
                <div className="border-t border-slate-400 pt-2">
                  <strong>Dr. Jonathan Reyes</strong>
                  <span className="block text-[10px] text-slate-500">Dean of Academics</span>
                </div>
                <div className="border-t border-slate-400 pt-2">
                  <strong>Rev. Emmanuel Santos</strong>
                  <span className="block text-[10px] text-slate-500">College Registrar</span>
                </div>
              </div>
            </div>

            <div className="p-4 bg-slate-100 border-t border-slate-200 flex items-center justify-between font-sans text-xs">
              <span className="text-slate-500 italic">Authentic institutional record with digital seal verification.</span>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => window.print()}
                  className="bg-[#18392B] hover:bg-[#588B76] text-white font-bold px-4 py-2 rounded-xl transition flex items-center gap-1.5 cursor-pointer"
                >
                  <Printer className="w-4 h-4" />
                  <span>Print Document</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 3: ENROLLMENT APPLICATION REVIEW DRAWER */}
      {/* ========================================================================= */}
      {selectedEnrollment && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-2xl rounded-2xl shadow-2xl border border-slate-200 overflow-hidden max-h-[90vh] flex flex-col">
            <div className="bg-[#18392B] p-4 text-white flex items-center justify-between">
              <div>
                <h4 className="font-serif text-lg font-bold">Enrollment Application Review</h4>
                <p className="text-xs text-slate-300 font-mono">Ref: {selectedEnrollment.referenceNumber} • {selectedEnrollment.studentName}</p>
              </div>
              <button
                onClick={() => setSelectedEnrollment(null)}
                className="text-white/70 hover:text-white p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 overflow-y-auto space-y-4 text-xs text-slate-700 flex-1">
              <div className="grid grid-cols-2 gap-3 bg-slate-50 p-3 rounded-xl">
                <div>
                  <span className="text-slate-400 block text-[10px]">Program</span>
                  <span className="font-bold text-slate-800">{selectedEnrollment.programTitle || selectedEnrollment.programName}</span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[10px]">Year Level</span>
                  <span className="font-bold text-slate-800">{selectedEnrollment.yearLevel}</span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[10px]">Total Units</span>
                  <span className="font-bold font-mono text-slate-800">{selectedEnrollment.totalUnits} Units</span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[10px]">Est. Tuition</span>
                  <span className="font-bold font-mono text-slate-900">₱{(selectedEnrollment.estimatedTuition || 0).toLocaleString()}</span>
                </div>
              </div>

              <div className="space-y-1">
                <span className="font-bold text-slate-900 block">Selected Subject Load</span>
                <div className="border border-slate-200 rounded-lg p-2 divide-y divide-slate-100">
                  {(selectedEnrollment.selectedSubjects || []).map((s, i) => (
                    <div key={i} className="py-1.5 flex justify-between">
                      <span className="font-mono font-bold text-[#18392B]">{s.code} – {s.title}</span>
                      <span className="font-mono">{s.units}u</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="bg-amber-50 p-3 rounded-xl border border-amber-200 text-amber-900 space-y-1">
                <span className="font-bold block">Payment Clearance Reference</span>
                <p>Method: <strong>{selectedEnrollment.paymentMethod || 'GCash'}</strong></p>
                <p>Reference Code: <strong className="font-mono">{selectedEnrollment.paymentReference || 'None Provided'}</strong></p>
              </div>
            </div>

            <div className="p-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between text-xs">
              <button
                onClick={() => {
                  setReturnTargetId(selectedEnrollment.id);
                  setReturnFeedback('');
                  setIsReturnModalOpen(true);
                }}
                className="bg-rose-100 hover:bg-rose-200 text-rose-800 font-semibold px-4 py-2 rounded-xl transition cursor-pointer"
              >
                Return for Revision
              </button>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => handleApproveEnrollment(selectedEnrollment)}
                  className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold px-4 py-2 rounded-xl transition cursor-pointer"
                >
                  Approve Application
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 4: RETURN WITH CORRECTIONS */}
      {/* ========================================================================= */}
      {isReturnModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-md rounded-2xl shadow-2xl p-6 space-y-4">
            <h4 className="font-serif text-lg font-bold text-[#18392B]">Return Enrollment for Revision</h4>
            <p className="text-xs text-slate-500">
              Provide feedback or specify required document updates for the student.
            </p>
            <textarea
              rows={4}
              value={returnFeedback}
              onChange={(e) => setReturnFeedback(e.target.value)}
              placeholder="e.g., Please upload your certified Form 138 / TOR and verify downpayment reference..."
              className="w-full p-3 border border-slate-300 rounded-xl text-xs focus:outline-none focus:border-[#588B76]"
            />
            <div className="flex justify-end gap-2 text-xs">
              <button
                onClick={() => setIsReturnModalOpen(false)}
                className="px-4 py-2 text-slate-600 hover:text-slate-900"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmReturn}
                className="bg-rose-700 hover:bg-rose-800 text-white font-bold px-4 py-2 rounded-xl"
              >
                Transmit to Student
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 5: ADD SUBJECT MODAL */}
      {/* ========================================================================= */}
      {isSubjectModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-md rounded-2xl shadow-2xl p-6 space-y-4">
            <h4 className="font-serif text-lg font-bold text-[#18392B]">Add Academic Course</h4>
            <form onSubmit={handleAddSubjectSubmit} className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-600 font-semibold mb-1">Course Code</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. BIB-305"
                  value={subjectForm.code}
                  onChange={(e) => setSubjectForm({ ...subjectForm, code: e.target.value })}
                  className="w-full p-2.5 border border-slate-300 rounded-lg uppercase"
                />
              </div>
              <div>
                <label className="block text-slate-600 font-semibold mb-1">Descriptive Title</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Hermeneutics & Biblical Interpretation"
                  value={subjectForm.title}
                  onChange={(e) => setSubjectForm({ ...subjectForm, title: e.target.value })}
                  className="w-full p-2.5 border border-slate-300 rounded-lg"
                />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-slate-600 font-semibold mb-1">Units</label>
                  <input
                    type="number"
                    min={1}
                    max={6}
                    value={subjectForm.units}
                    onChange={(e) => setSubjectForm({ ...subjectForm, units: Number(e.target.value) })}
                    className="w-full p-2.5 border border-slate-300 rounded-lg"
                  />
                </div>
                <div>
                  <label className="block text-slate-600 font-semibold mb-1">Section</label>
                  <input
                    type="text"
                    value={subjectForm.section}
                    onChange={(e) => setSubjectForm({ ...subjectForm, section: e.target.value })}
                    className="w-full p-2.5 border border-slate-300 rounded-lg"
                  />
                </div>
              </div>
              <div>
                <label className="block text-slate-600 font-semibold mb-1">Schedule</label>
                <input
                  type="text"
                  value={subjectForm.schedule}
                  onChange={(e) => setSubjectForm({ ...subjectForm, schedule: e.target.value })}
                  className="w-full p-2.5 border border-slate-300 rounded-lg"
                />
              </div>
              <div>
                <label className="block text-slate-600 font-semibold mb-1">Instructor</label>
                <input
                  type="text"
                  value={subjectForm.instructor}
                  onChange={(e) => setSubjectForm({ ...subjectForm, instructor: e.target.value })}
                  className="w-full p-2.5 border border-slate-300 rounded-lg"
                />
              </div>
              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsSubjectModalOpen(false)}
                  className="px-4 py-2 text-slate-600 hover:text-slate-900"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="bg-[#18392B] hover:bg-[#588B76] text-white font-bold px-4 py-2 rounded-xl"
                >
                  Save Subject
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 6: ADD STUDENT PROFILE MODAL */}
      {/* ========================================================================= */}
      {isNewStudentModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-md rounded-2xl shadow-2xl p-6 space-y-4">
            <h4 className="font-serif text-lg font-bold text-[#18392B]">Register Student Profile</h4>
            <form onSubmit={handleNewStudentSubmit} className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-600 font-semibold mb-1">Full Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Joshua Daniel Evangelista"
                  value={newStudentForm.name}
                  onChange={(e) => setNewStudentForm({ ...newStudentForm, name: e.target.value })}
                  className="w-full p-2.5 border border-slate-300 rounded-lg"
                />
              </div>
              <div>
                <label className="block text-slate-600 font-semibold mb-1">Permanent Student ID</label>
                <input
                  type="text"
                  required
                  value={newStudentForm.studentId}
                  onChange={(e) => setNewStudentForm({ ...newStudentForm, studentId: e.target.value })}
                  className="w-full p-2.5 border border-slate-300 rounded-lg font-mono"
                />
              </div>
              <div>
                <label className="block text-slate-600 font-semibold mb-1">Email Address</label>
                <input
                  type="email"
                  placeholder="student@pcm.edu.ph"
                  value={newStudentForm.email}
                  onChange={(e) => setNewStudentForm({ ...newStudentForm, email: e.target.value })}
                  className="w-full p-2.5 border border-slate-300 rounded-lg"
                />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-slate-600 font-semibold mb-1">Degree Program</label>
                  <select
                    value={newStudentForm.program}
                    onChange={(e) => setNewStudentForm({ ...newStudentForm, program: e.target.value })}
                    className="w-full p-2.5 border border-slate-300 rounded-lg bg-white"
                  >
                    <option value="Bachelor of Theology">Bachelor of Theology</option>
                    <option value="Associate of Theology">Associate of Theology</option>
                    <option value="Master of Divinity">Master of Divinity</option>
                    <option value="Senior High School (GAS Strand)">Senior High School (GAS Strand)</option>
                  </select>
                </div>
                <div>
                  <label className="block text-slate-600 font-semibold mb-1">Year Level</label>
                  <select
                    value={newStudentForm.yearLevel}
                    onChange={(e) => setNewStudentForm({ ...newStudentForm, yearLevel: e.target.value })}
                    className="w-full p-2.5 border border-slate-300 rounded-lg bg-white"
                  >
                    <option value="1st Year">1st Year</option>
                    <option value="2nd Year">2nd Year</option>
                    <option value="3rd Year">3rd Year</option>
                    <option value="4th Year">4th Year</option>
                  </select>
                </div>
              </div>
              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsNewStudentModalOpen(false)}
                  className="px-4 py-2 text-slate-600 hover:text-slate-900"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="bg-[#18392B] hover:bg-[#588B76] text-white font-bold px-4 py-2 rounded-xl"
                >
                  Create Student
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 7: PRE-ENLISTMENT INSPECT & ADVISING */}
      {/* ========================================================================= */}
      {selectedPreEnlistment && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-md rounded-2xl shadow-2xl p-6 space-y-4 text-xs">
            <h4 className="font-serif text-lg font-bold text-[#18392B]">Academic Dean Pre-Enlistment Advising</h4>
            <div className="bg-slate-50 p-3 rounded-xl space-y-1">
              <p>Student: <strong>{selectedPreEnlistment.studentName}</strong> ({selectedPreEnlistment.studentId})</p>
              <p>Program: <strong>{selectedPreEnlistment.program || selectedPreEnlistment.degreeProgram}</strong></p>
              <p>Requested Units: <strong>{selectedPreEnlistment.totalUnits} Units</strong></p>
            </div>

            <div>
              <label className="block text-slate-600 font-semibold mb-1">Dean / Advisor Recommendation Notes</label>
              <textarea
                rows={3}
                value={preEnlistmentRemarks}
                onChange={(e) => setPreEnlistmentRemarks(e.target.value)}
                placeholder="Approved for official enrollment. Clear subject load with Registrar."
                className="w-full p-2.5 border border-slate-300 rounded-lg text-xs"
              />
            </div>

            <div className="pt-2 flex items-center justify-between">
              <button
                onClick={() => handleReturnPreEnlistment(selectedPreEnlistment.id)}
                className="bg-amber-100 hover:bg-amber-200 text-amber-800 font-semibold px-3 py-2 rounded-xl transition"
              >
                Request Revision
              </button>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setSelectedPreEnlistment(null)}
                  className="px-3 py-2 text-slate-500"
                >
                  Close
                </button>
                <button
                  onClick={() => handleApprovePreEnlistment(selectedPreEnlistment.id)}
                  className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold px-4 py-2 rounded-xl transition"
                >
                  Approve Course Load
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
