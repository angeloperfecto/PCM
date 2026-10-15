'use client';

import React, { useState } from 'react';
import Image from 'next/image';
import { usePCM } from '@/lib/store';
import { CertificateOfRegistration, printCertificate } from '@/components/enrollment/CertificateOfRegistration';
import { getSafeImageSrc } from '@/lib/utils';
import {
  OnlineEnrollment,
  StudentProfile,
  AcademicSubject,
  PreEnlistmentRecord,
  AddDropRequest,
  FeeStructureItem,
  EnrollmentStatus,
  AcademicPeriod,
} from '@/lib/types';
import { AdminStudentDetailModal } from './AdminStudentDetailModal';
import { ConfirmDeleteModal } from '@/components/common/ConfirmDeleteModal';
import { normalizeStatus } from '@/lib/enrollmentWorkflow';
import { AcademicTermModal } from './AcademicTermModal';
import { StudentPaymentsPanel } from './StudentPaymentsPanel';
import { PaymentSettingsCard } from './PaymentSettingsCard';
import { AdmissionRequirementsCard } from './AdmissionRequirementsCard';
import { ReenrollmentRulesCard } from './ReenrollmentRulesCard';
import { GradingScaleCard } from './GradingScaleCard';
import { CloseTermModal } from './CloseTermModal';
import { ReenrollmentReviewPanel } from './ReenrollmentReviewPanel';
import { ClassListModal, classListFor } from './ClassListModal';
import { AdminCurriculumPanel } from './AdminCurriculumPanel';
import { AcademicCourseModal } from './AcademicCourseModal';
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
  PhilippinePeso,
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
  | 'curriculum'
  | 'sections'
  | 'instructors'
  | 'fees'
  | 'payments'
  | 'settings';

export const AdminEnrollmentsTab: React.FC<{ onOpenAdmissions?: () => void }> = ({ onOpenAdmissions }) => {
  const {
    canManageEnrollment,
    enrollments,
    students,
    applications,
    registryBlockedStudents,
    studentPayments,
    removeDeletedUserRecord,
    studentProfile,
    academicSubjects,
    addAcademicSubject,
    updateAcademicSubject,
    deleteAcademicSubject,
    preEnlistments,
    submitPreEnlistment,
    updatePreEnlistmentStatus,
    deletePreEnlistment,
    addDropRequests,
    reviewAddDropRequest,
    deleteAddDropRequest,
    academicPeriods,
    addAcademicPeriod,
    updateAcademicPeriod,
    setCurrentAcademicPeriod,
    deleteAcademicPeriod,
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
    canManageTerms,
  } = usePCM();
  // Term being closed (Academic Terms → Close Term).
  const [closingTerm, setClosingTerm] = useState<AcademicPeriod | null>(null);

  // Active Subtab
  const [activeSubTab, setActiveSubTab] = useState<EnrollmentAdminSubTab>('dashboard');

  // Search & Filter
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [programFilter, setProgramFilter] = useState<string>('all');

  // Modals & Drawers
  const [selectedEnrollmentSnap, setSelectedEnrollment] = useState<OnlineEnrollment | null>(null);
  const [selectedStudentDossier, setSelectedStudentDossier] = useState<StudentProfile | null>(null);
  const [isCORModalOpen, setIsCORModalOpen] = useState(false);
  const [corStudentSnap, setCorStudent] = useState<StudentProfile | null>(null);
  // Subject whose master list (class list) is open.
  const [classListSubjectId, setClassListSubjectId] = useState<string | null>(null);
  // Open dialogs follow the live records, so changes appear without reopening them.
  const selectedEnrollment = selectedEnrollmentSnap ? enrollments.find((e) => e.id === selectedEnrollmentSnap.id) || selectedEnrollmentSnap : null;
  const corStudent = corStudentSnap ? students.find((s) => s.id === corStudentSnap.id) || corStudentSnap : null;

  // Return for correction modal state
  const [isReturnModalOpen, setIsReturnModalOpen] = useState(false);
  const [returnTargetId, setReturnTargetId] = useState<string>('');
  const [returnFeedback, setReturnFeedback] = useState<string>('');

  // Pre-enlistment Review modal
  const [selectedPreEnlistment, setSelectedPreEnlistment] = useState<PreEnlistmentRecord | null>(null);
  const [preEnlistmentRemarks, setPreEnlistmentRemarks] = useState('');

  // Add / Edit course window (course null = new course)
  const [courseModal, setCourseModal] = useState<{ course: (typeof academicSubjects)[number] | null } | null>(null);

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

  // Academic term add/edit window (term null = new term)
  const [termModal, setTermModal] = useState<{ term: (typeof academicPeriods)[number] | null } | null>(null);
  const semesterOrder = (s: string) => (/^1st/i.test(s) ? 1 : /^2nd/i.test(s) ? 2 : /summer|mid/i.test(s) ? 3 : 4);
  // The current term from Enrollment & Records → Academic Terms (falls back to an open term).
  const currentPeriod =
    academicPeriods.find((p) => p.isCurrent) || academicPeriods.find((p) => p.enrollmentStatus === 'Open' && p.status !== 'Archived') || null;
  const fmtDate = (d?: string) => (d ? new Date(d + 'T00:00:00').toLocaleDateString('en-PH', { month: 'long', day: 'numeric', year: 'numeric' }) : '');
  const enrollmentOpen = currentPeriod?.enrollmentStatus === 'Open';
  const sortedAcademicPeriods = [...academicPeriods].sort(
    (a, b) => a.academicYear.localeCompare(b.academicYear) || semesterOrder(a.semester) - semesterOrder(b.semester) || a.semester.localeCompare(b.semester)
  );

  // Pending delete confirmation (shared by every list in this tab)
  type DeleteKind = 'student' | 'preEnlistment' | 'enrollment' | 'addDrop' | 'term' | 'course' | 'registry';
  const [pendingDelete, setPendingDelete] = useState<{ kind: DeleteKind; id: string; label: string; message: string; title?: string; confirmLabel?: string } | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const confirmPendingDelete = async () => {
    if (!pendingDelete) return;
    setIsDeleting(true);
    try {
      const { kind, id } = pendingDelete;
      const ok =
        kind === 'student'
          ? await deleteStudentProfile(id)
          : kind === 'preEnlistment'
          ? await deletePreEnlistment(id)
          : kind === 'enrollment'
          ? await deleteEnrollment(id)
          : kind === 'addDrop'
          ? await deleteAddDropRequest(id)
          : kind === 'course'
          ? await deleteAcademicSubject(id)
          : kind === 'registry'
          ? await removeDeletedUserRecord(id)
          : await deleteAcademicPeriod(id);
      if (ok) {
        if (kind === 'enrollment' && selectedEnrollment?.id === id) setSelectedEnrollment(null);
        if (kind === 'preEnlistment' && selectedPreEnlistment?.id === id) setSelectedPreEnlistment(null);
        if (kind === 'student' && selectedStudentDossier?.id === id) setSelectedStudentDossier(null);
      }
      setPendingDelete(null);
    } finally {
      setIsDeleting(false);
    }
  };

  // KPIs
  const totalEnrollments = enrollments.length;
  const pendingEnrollments = enrollments.filter((e) =>
    ['Submitted', 'Under Review', 'For Verification', 'Pending Requirements'].includes(String(e.status))
  ).length;
  const approvedEnrollments = enrollments.filter((e) => e.status === 'Approved').length;
  const returnedEnrollments = enrollments.filter((e) => e.status === 'Returned for Correction').length;
  const pendingPreEnlistments = preEnlistments.filter((p) => p.status === 'Submitted').length;
  const pendingAddDrop = addDropRequests.filter((a) => a.status === 'Pending').length;

  // Admissions Review and Enrollment & Records read the same Firestore data: an application
  // that reaches "Enrolled" creates the student record listed in the Student Directory.
  const officiallyEnrolled = students.filter((s) => (s.enrollmentStatus || '') === 'Enrolled').length;
  const admissionsStages = [
    { label: 'New applications', statuses: ['Submitted', 'Under Review', 'Requirements Incomplete', 'For Correction'], hint: 'Documents & review' },
    { label: 'Admission decision', statuses: ['For Admission Approval', 'Admitted'], hint: 'Approve or admit' },
    { label: 'Registration', statuses: ['For Registration'], hint: 'Students choosing subjects' },
    { label: 'Assessment & payment', statuses: ['For Assessment', 'For Payment'], hint: 'Fees & receipts' },
    { label: 'Final verification', statuses: ['For Enrollment'], hint: 'Checklist & approval' },
    { label: 'Officially enrolled', statuses: ['Enrolled'], hint: 'Student record created' },
  ].map((st) => ({ ...st, count: applications.filter((a) => st.statuses.includes(normalizeStatus(a.status))).length }));
  const confirmRegistryRemoval = (s: { fullName?: string; name?: string; email?: string; studentId?: string }) =>
    setPendingDelete({
      kind: 'registry',
      id: (s.email || s.studentId || '').toLowerCase(),
      label: `${s.fullName || s.name || 'Student'} (${s.email || s.studentId})`,
      title: 'Remove from Deletion Registry?',
      confirmLabel: 'Remove Entry',
      message:
        'This email is in the Deletion Registry (an account deleted earlier), so the student record is hidden here and the student is signed out of the portal. Removing the entry shows the record again and lets the student sign in. It does not restore the old deleted account.',
    });
  const registryNotice =
    registryBlockedStudents.length > 0 ? (
      <div className="bg-rose-50 border border-rose-200 rounded-xl p-4 text-xs text-rose-900 space-y-2">
        <p className="font-bold">
          {registryBlockedStudents.length} student record{registryBlockedStudents.length > 1 ? 's are' : ' is'} hidden because the email is in the
          Deletion Registry
        </p>
        <p className="text-rose-800">
          These students were enrolled (or created) after an account with the same email was deleted. They are left out of the directory and
          counts, and cannot use the Student Portal, until the registry entry is removed.
        </p>
        <ul className="space-y-1.5">
          {registryBlockedStudents.map((s) => (
            <li key={s.id} className="flex flex-wrap items-center justify-between gap-2 bg-white/70 rounded-lg px-3 py-2 border border-rose-100">
              <span>
                <strong>{s.fullName || s.name}</strong> · <span className="font-mono">{s.studentId}</span> · {s.email}
              </span>
              <button
                onClick={() => confirmRegistryRemoval(s)}
                className="px-3 py-1.5 rounded-lg bg-rose-600 hover:bg-rose-700 text-white font-bold cursor-pointer"
              >
                Remove registry entry
              </button>
            </li>
          ))}
        </ul>
      </div>
    ) : null;

  // Student list resolution: only saved records, never the built-in sample profile
  const allStudents = students;
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
            <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
              <h2 className="font-serif text-xl sm:text-2xl font-bold text-[#18392B]">
                PCM Enrollment & Academic Administration
              </h2>
              <span className={`whitespace-nowrap text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider ${currentPeriod ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-100 text-slate-600'}`}>
                {currentPeriod ? `${currentPeriod.semester} · AY ${currentPeriod.academicYear}` : 'No current term'}
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
            onClick={() => setCourseModal({ course: null })}
            className="bg-white hover:bg-slate-100 text-slate-700 border border-slate-300 font-semibold text-xs px-3.5 py-2.5 rounded-xl transition flex items-center gap-1.5 cursor-pointer shadow-xs"
          >
            <Plus className="w-4 h-4 text-[#588B76]" />
            <span>Add Course</span>
          </button>
        </div>
      </div>

      {/* 2. SUB-NAVIGATION: grouped modules */}
      {(() => {
        const navTabs: { id: string; label: string; icon: React.ElementType; count?: number; isPending?: boolean }[] = [
          { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
          { id: 'students', label: 'Student Directory', icon: Users, count: allStudents.length },
          { id: 'pre-enlistment', label: 'Pre-Enlistment', icon: FileCheck, count: pendingPreEnlistments, isPending: true },
          { id: 'enrollments', label: 'Enrollment Queue', icon: GraduationCap, count: pendingEnrollments, isPending: true },
          { id: 'add-drop', label: 'Adding & Dropping', icon: RotateCcw, count: pendingAddDrop, isPending: true },
          { id: 'academic-periods', label: 'Academic Terms', icon: Calendar },
          { id: 'subjects', label: 'Curriculum Catalog', icon: BookOpen, count: academicSubjects.length },
          { id: 'curriculum', label: 'Subjects per Year Level', icon: BookOpen },
          { id: 'sections', label: 'Class Schedules', icon: Layers },
          { id: 'instructors', label: 'Faculty Load', icon: User, count: faculty.length },
          { id: 'fees', label: 'Tuition & Fee Policy', icon: PhilippinePeso },
          { id: 'payments', label: 'Student Payments', icon: PhilippinePeso, count: studentPayments.filter((p) => p.status === 'Submitted').length, isPending: true },
          { id: 'settings', label: 'System Governance', icon: Settings },
        ];
        const groups: { label: string; ids: string[] }[] = [
          { label: 'Overview', ids: ['dashboard'] },
          { label: 'Students', ids: ['students', 'pre-enlistment', 'enrollments', 'add-drop', 'payments'] },
          { label: 'Academics', ids: ['academic-periods', 'subjects', 'curriculum', 'sections', 'instructors'] },
          { label: 'Finance & Settings', ids: ['fees', 'settings'] },
        ];
        return (
          <nav aria-label="Enrollment & Records sections" className="bg-white rounded-2xl border border-slate-200 shadow-xs p-3 sm:p-4">
            <div className="divide-y divide-slate-100">
              {groups.map((g) => (
                <div key={g.label} className="flex min-w-0 flex-col gap-1.5 py-2 first:pt-0 last:pb-0 sm:flex-row sm:items-center sm:gap-4">
                  <p className="shrink-0 text-[10px] font-bold uppercase tracking-[0.14em] text-slate-400 sm:w-36">{g.label}</p>
                  <div className="flex flex-wrap gap-1.5">
                    {g.ids
                      .map((id) => navTabs.find((t) => t.id === id))
                      .filter(Boolean)
                      .map((tab) => {
                        const t = tab!;
                        const Icon = t.icon;
                        const isActive = activeSubTab === t.id;
                        const alert = t.isPending && (t.count || 0) > 0;
                        return (
                          <button
                            key={t.id}
                            type="button"
                            aria-current={isActive ? 'page' : undefined}
                            onClick={() => setActiveSubTab(t.id as EnrollmentAdminSubTab)}
                            className={`inline-flex items-center gap-1.5 whitespace-nowrap rounded-lg px-3 py-2 text-xs font-semibold transition ${
                              isActive ? 'bg-[#18392B] text-white shadow-sm' : 'bg-slate-50 text-slate-700 hover:bg-slate-100 hover:text-slate-900'
                            }`}
                          >
                            <Icon className={`h-3.5 w-3.5 ${isActive ? 'text-emerald-300' : 'text-[#588B76]'}`} />
                            <span>{t.label}</span>
                            {t.count !== undefined && (
                              <span
                                className={`min-w-[1.25rem] rounded-full px-1.5 text-center font-mono text-[10px] ${
                                  isActive ? 'bg-white/20 text-white' : alert ? 'bg-amber-500 font-bold text-white' : 'bg-slate-200/70 text-slate-600'
                                }`}
                              >
                                {t.count}
                              </span>
                            )}
                          </button>
                        );
                      })}
                  </div>
                </div>
              ))}
            </div>
          </nav>
        );
      })()}

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
                <span>{currentPeriod ? `Current term: ${currentPeriod.semester}, Academic Year ${currentPeriod.academicYear}` : 'No current term set'}</span>
              </div>
              <h3 className="font-serif text-2xl font-bold text-white">{enrollmentOpen ? 'Enrollment is open' : 'Enrollment is closed'}</h3>
              <p className="text-xs text-slate-300 max-w-xl">
                {!currentPeriod
                  ? 'Set the current term in Academic Terms to open enrollment.'
                  : enrollmentOpen
                  ? `Online enrollment${currentPeriod.enrollmentEndDate ? ` closes on ${fmtDate(currentPeriod.enrollmentEndDate)}` : ' is open'}. Review incoming pre-enlistments and verify student payments promptly.`
                  : `Online enrollment for this term is closed${currentPeriod.enrollmentStartDate ? ` (window: ${fmtDate(currentPeriod.enrollmentStartDate)} – ${fmtDate(currentPeriod.enrollmentEndDate)})` : ''}. Open it in Academic Terms when the next window starts.`}
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

          {registryNotice}

          {/* Admissions pipeline (same applications as Admissions Review) */}
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <h4 className="font-serif text-base font-bold text-[#18392B] flex items-center gap-2">
                <FileCheck className="w-5 h-5 text-[#588B76]" />
                <span>Admissions Pipeline</span>
                <span className="text-xs font-sans font-normal text-slate-500">({applications.length} applications)</span>
              </h4>
              {onOpenAdmissions && (
                <button onClick={onOpenAdmissions} className="text-xs font-bold text-[#18392B] hover:text-[#588B76] underline cursor-pointer">
                  Open Admissions Review
                </button>
              )}
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
              {admissionsStages.map((st) => (
                <button
                  key={st.label}
                  onClick={onOpenAdmissions}
                  disabled={!onOpenAdmissions}
                  className="text-left p-3 rounded-xl border border-slate-200 bg-slate-50/60 hover:border-[#588B76] transition cursor-pointer disabled:cursor-default"
                >
                  <span className="text-[11px] font-bold uppercase tracking-wider text-slate-600 block">{st.label}</span>
                  <span className="text-2xl font-serif font-bold text-[#18392B] block">{st.count}</span>
                  <span className="text-[10px] text-slate-500">{st.hint}</span>
                </button>
              ))}
            </div>
          </div>

          {/* KPI Metric Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
              <span className="text-[11px] font-mono text-slate-500 uppercase block">Total Enrolled</span>
              <span className="font-serif text-3xl font-bold text-[#18392B]">{officiallyEnrolled}</span>
              <span className="text-[11px] text-emerald-600 block mt-1">
                Official student records · {approvedEnrollments} term enrollment{approvedEnrollments === 1 ? '' : 's'} approved
              </span>
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
          {registryNotice}
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
          <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-x-auto">
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
                {filteredStudents.length === 0 && (
                  <tr>
                    <td colSpan={6} className="p-6 text-center text-slate-500">
                      {allStudents.length === 0 ? 'No student records yet.' : 'No students match your search.'}
                    </td>
                  </tr>
                )}
                {filteredStudents.map((student) => (
                  <tr key={student.id} className="hover:bg-slate-50 transition">
                    <td className="p-3.5">
                      <div className="font-bold text-slate-900">{student.fullName || student.name}</div>
                      <div className="text-[11px] font-mono text-slate-500">{student.studentId} • {student.email}</div>
                      {(student as any).applicationNumber && (
                        <div className="text-[10px] text-slate-400">Admitted via application {(student as any).applicationNumber}</div>
                      )}
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
                        <button
                          onClick={() =>
                            setPendingDelete({
                              kind: 'student',
                              id: student.id,
                              label: `${student.fullName || student.name} (${student.studentId})`,
                              message:
                                'This permanently removes the student profile, including its grades, courses and payment records. Their admission application, enrollment requests and portal sign-in are not deleted.',
                            })
                          }
                          className="p-1.5 text-rose-600 hover:bg-rose-50 rounded-lg transition cursor-pointer"
                          title="Delete student record"
                          aria-label={`Delete student record of ${student.fullName || student.name}`}
                        >
                          <Trash2 className="w-4 h-4" />
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

          <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-x-auto">
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
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => {
                            setSelectedPreEnlistment(record);
                            setPreEnlistmentRemarks(record.adminRemarks || '');
                          }}
                          className="bg-[#18392B] hover:bg-[#588B76] text-white text-[11px] font-semibold px-3 py-1.5 rounded-lg transition cursor-pointer"
                        >
                          Inspect & Advise
                        </button>
                        <button
                          onClick={() =>
                            setPendingDelete({
                              kind: 'preEnlistment',
                              id: record.id,
                              label: `${record.studentName} · ${record.semester} · ${record.totalUnits} units`,
                              message: 'This permanently removes this pre-enlistment submission. The student record and official enrollments are not affected.',
                            })
                          }
                          className="p-1.5 text-rose-600 hover:bg-rose-50 rounded-lg transition cursor-pointer"
                          title="Delete pre-enlistment"
                          aria-label={`Delete pre-enlistment of ${record.studentName}`}
                        >
                          <Trash2 className="w-4 h-4" />
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
      {/* SUBVIEW 4: OFFICIAL ENROLLMENT QUEUE */}
      {/* ========================================================================= */}
      {activeSubTab === 'enrollments' && (
        <div className="space-y-4">
          {/* Filter Bar */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-4 rounded-xl border border-slate-200">
            <div className="flex flex-wrap items-center gap-2">
              {['all', 'Pending Requirements', 'For Verification', 'Submitted', 'Under Review', 'Approved', 'Returned for Correction', 'Not Eligible', 'Rejected'].map((status) => (
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
          <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-x-auto">
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
                      <div className="text-[11px] text-slate-500">
                        {enr.yearLevel} • {enr.semester}, AY {enr.schoolYear}
                      </div>
                      {enr.reenrollment && (
                        <span className="mt-0.5 inline-block rounded bg-[#18392B]/10 px-1.5 py-0.5 text-[10px] font-bold text-[#18392B]">Returning student</span>
                      )}
                    </td>
                    <td className="p-3.5">
                      <span className="font-bold text-slate-900">{enr.totalUnits} units</span>
                      <div className="text-[11px] text-slate-500">{enr.selectedSubjects?.length || 0} courses</div>
                    </td>
                    <td className="p-3.5 font-mono font-bold text-slate-900">
                      ₱{(enr.estimatedTuition || 0).toLocaleString()}
                    </td>
                    <td className="p-3.5 font-mono text-slate-600">
                      {(() => {
                        // Approved: the student's live account; otherwise what the student reported.
                        const acct = enr.status === 'Approved' ? students.find((st) => st.studentId === enr.studentId) : undefined;
                        if (acct) {
                          const bal = Math.max(0, Number(acct.tuitionBalance) || 0);
                          return bal > 0 ? `Balance ₱${bal.toLocaleString()}` : 'Fully paid';
                        }
                        return enr.paymentReference ? `Ref ${enr.paymentReference}` : 'No payment reported';
                      })()}
                    </td>
                    <td className="p-3.5">
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                        enr.status === 'Approved'
                          ? 'bg-emerald-100 text-emerald-800'
                          : enr.status === 'Submitted' || enr.status === 'Pending Requirements'
                          ? 'bg-amber-100 text-amber-800'
                          : enr.status === 'For Verification'
                          ? 'bg-sky-100 text-sky-800'
                          : enr.status === 'Returned for Correction' || enr.status === 'Not Eligible'
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
                        {!enr.reenrollment && !['Approved', 'Rejected', 'Not Eligible'].includes(String(enr.status)) && (
                          <button
                            disabled={!canManageEnrollment}
                            title={canManageEnrollment ? undefined : 'Only the Registrar, Academic Admin, Finance or an Admin can do this'}
                            onClick={() => handleApproveEnrollment(enr)}
                            className="bg-emerald-600 hover:bg-emerald-700 text-white font-semibold px-2.5 py-1 rounded-lg text-[11px] transition cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
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
                        <button
                          onClick={() =>
                            setPendingDelete({
                              kind: 'enrollment',
                              id: enr.id,
                              label: `${enr.referenceNumber} · ${enr.studentName}`,
                              message:
                                enr.status === 'Approved'
                                  ? 'This enrollment is already approved. Deleting it removes the enrollment application only; courses and balances already posted to the student record are kept.'
                                  : 'This permanently removes this enrollment application. The student record is not affected.',
                            })
                          }
                          className="p-1 text-rose-600 hover:bg-rose-50 rounded transition cursor-pointer"
                          title="Delete enrollment application"
                          aria-label={`Delete enrollment ${enr.referenceNumber}`}
                        >
                          <Trash2 className="w-4 h-4" />
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

          <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-x-auto">
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
                      <div className="flex items-center justify-end gap-1.5">
                      {req.status === 'Pending' ? (
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            disabled={!canManageEnrollment}
                            title={canManageEnrollment ? undefined : 'Only the Registrar, Academic Admin, Finance or an Admin can do this'}
                            onClick={() => reviewAddDropRequest(req.id, 'Approved', 'Cleared by Academic Registrar')}
                            className="bg-emerald-600 hover:bg-emerald-700 text-white px-2.5 py-1 rounded-lg text-[11px] font-semibold transition cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
                          >
                            Approve
                          </button>
                          <button
                            disabled={!canManageEnrollment}
                            title={canManageEnrollment ? undefined : 'Only the Registrar, Academic Admin, Finance or an Admin can do this'}
                            onClick={() => reviewAddDropRequest(req.id, 'Rejected', 'Exceeds maximum allowable units')}
                            className="bg-rose-600 hover:bg-rose-700 text-white px-2.5 py-1 rounded-lg text-[11px] font-semibold transition cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
                          >
                            Disapprove
                          </button>
                        </div>
                      ) : (
                        <span className="text-[11px] text-slate-400 font-mono">Resolved</span>
                      )}
                        <button
                          onClick={() =>
                            setPendingDelete({
                              kind: 'addDrop',
                              id: req.id,
                              label: `${req.action} ${req.subjectCode} · ${req.studentName}`,
                              message:
                                req.status === 'Approved'
                                  ? 'This removes the request from the list. The course change it already applied to the student record is kept.'
                                  : 'This permanently removes this add/drop request.',
                            })
                          }
                          className="p-1.5 text-rose-600 hover:bg-rose-50 rounded-lg transition cursor-pointer"
                          title="Delete add/drop request"
                          aria-label={`Delete ${req.action} ${req.subjectCode} request of ${req.studentName}`}
                        >
                          <Trash2 className="w-4 h-4" />
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
      {/* SUBVIEW 6: ACADEMIC PERIODS & TERMS */}
      {/* ========================================================================= */}
      {activeSubTab === 'academic-periods' && (
        <div className="space-y-4">
          <div className="bg-white p-4 rounded-xl border border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h4 className="font-bold text-sm text-[#18392B]">Academic Terms & Registration Windows</h4>
              <p className="text-xs text-slate-500">
                Configure institutional calendar periods, enrollment active states, and add/drop cutoffs.
              </p>
            </div>
            <button
              onClick={() => setTermModal({ term: null })}
              className="bg-[#18392B] hover:bg-[#588B76] text-white text-xs font-bold px-3.5 py-2 rounded-lg transition flex items-center justify-center gap-1.5 cursor-pointer shrink-0"
            >
              <Plus className="w-4 h-4" />
              <span>Add Term</span>
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {academicPeriods.length === 0 && (
              <p className="md:col-span-3 text-xs text-slate-500 bg-white p-4 rounded-xl border border-slate-200">
                No academic terms are configured.
              </p>
            )}
            {sortedAcademicPeriods.map((period) => {
              // Dates are stored as YYYY-MM-DD; read them as local dates so they never shift a day.
              const formatDate = (value?: string) => {
                const m = value?.match(/^(\d{4})-(\d{2})-(\d{2})$/);
                const d = m ? new Date(+m[1], +m[2] - 1, +m[3]) : value ? new Date(value) : null;
                return d && !Number.isNaN(d.getTime())
                  ? d.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })
                  : value || '—';
              };
              const formatRange = (start?: string, end?: string) =>
                start || end ? `${formatDate(start)} – ${formatDate(end)}` : 'Not set';
              const statusLabel = period.isCurrent ? 'Active' : period.status === 'Active' ? 'Scheduled' : period.status;
              return (
                <div
                  key={period.id}
                  className={`p-5 rounded-2xl border ${
                    period.isCurrent
                      ? 'border-[#588B76] bg-emerald-50/20 ring-2 ring-[#588B76]/20'
                      : 'border-slate-200 bg-white'
                  } shadow-xs space-y-3`}
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-[11px] font-mono font-bold text-slate-500 uppercase">
                      AY {period.academicYear} ({period.semester})
                    </span>
                    <div className="flex items-center gap-1.5">
                      <span
                        className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                          period.isCurrent ? 'bg-[#18392B] text-white' : 'bg-slate-100 text-slate-600'
                        }`}
                      >
                        {statusLabel}
                      </span>
                      <button
                        onClick={() => setTermModal({ term: period })}
                        className="p-1 text-[#588B76] hover:bg-emerald-50 rounded-lg transition cursor-pointer"
                        title="Edit academic term"
                        aria-label={`Edit ${period.semester} ${period.academicYear}`}
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                      {!period.isCurrent && !period.closedAt && (
                        <button
                          onClick={() =>
                            setPendingDelete({
                              kind: 'term',
                              id: period.id,
                              label: `${period.semester}, Academic Year ${period.academicYear}`,
                              message:
                                'This permanently removes this academic term from the calendar. Enrollments, pre-enlistments and student records that mention it are not changed.',
                            })
                          }
                          className="p-1 text-rose-600 hover:bg-rose-50 rounded-lg transition cursor-pointer"
                          title="Delete academic term"
                          aria-label={`Delete ${period.semester} ${period.academicYear}`}
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  </div>

                  <h5 className="font-serif text-base font-bold text-[#18392B]">
                    {period.semester}, Academic Year {period.academicYear}
                  </h5>

                  <div className="text-xs space-y-1 text-slate-600">
                    <div className="flex justify-between gap-2">
                      <span className="text-slate-400">Enrollment Period:</span>
                      <span className="font-medium text-right">
                        {formatRange(period.enrollmentStartDate, period.enrollmentEndDate)}
                      </span>
                    </div>
                    <div className="flex justify-between gap-2">
                      <span className="text-slate-400">Add/Drop Deadline:</span>
                      <span className={`font-medium ${period.addDropEndDate ? 'text-amber-700' : 'text-slate-400'}`}>
                        {period.addDropEndDate ? formatDate(period.addDropEndDate) : 'Not set'}
                      </span>
                    </div>
                    <div className="flex justify-between gap-2">
                      <span className="text-slate-400">Enrollment Portal:</span>
                      <span className={`font-bold ${period.enrollmentStatus === 'Open' ? 'text-emerald-700' : 'text-slate-400'}`}>
                        {period.enrollmentStatus === 'Open' ? 'Accepting Applications' : 'Closed'}
                      </span>
                    </div>
                    <div className="flex justify-between gap-2">
                      <span className="text-slate-400">Enrolled:</span>
                      <span className="font-medium font-mono">
                        {period.enrolledCount || 0}
                        {period.capacity ? ` / ${period.capacity}` : ' (no limit)'}
                      </span>
                    </div>
                    {period.closedAt && (
                      <p className="rounded-lg bg-slate-100 p-2 text-[11px] text-slate-600">
                        Closed {period.closedAt.slice(0, 10)}{period.closedBy ? ` by ${period.closedBy}` : ''}
                        {period.closingSummary ? ` • ${period.closingSummary.students} students, ${period.closingSummary.subjects} subjects recorded` : ''}
                      </p>
                    )}
                    {period.closingSummary?.exception && (
                      <details className="rounded-lg border border-rose-200 bg-rose-50 p-2 text-[11px] text-rose-900">
                        <summary className="cursor-pointer font-semibold">Closed under an exception • {period.closingSummary.exception.unresolved.length} open item(s)</summary>
                        <p className="mt-1">{period.closingSummary.exception.reason} — {period.closingSummary.exception.authorizedBy}</p>
                        <ul className="mt-1 list-disc pl-4">
                          {period.closingSummary.exception.unresolved.map((x) => <li key={x}>{x}</li>)}
                        </ul>
                      </details>
                    )}
                  </div>

                  {period.closedAt ? (
                    <p className="w-full rounded-xl bg-slate-100 py-2 text-center text-xs font-semibold text-slate-500">Term closed — records kept</p>
                  ) : (
                    <div className="flex flex-col gap-2 sm:flex-row">
                      <button
                        onClick={() => setCurrentAcademicPeriod(period.id)}
                        disabled={period.isCurrent}
                        className={`flex-1 text-xs font-semibold py-2 rounded-xl transition cursor-pointer ${
                          period.isCurrent
                            ? 'bg-emerald-100 text-emerald-800 cursor-default'
                            : 'bg-slate-100 hover:bg-[#18392B] hover:text-white text-slate-700'
                        }`}
                      >
                        {period.isCurrent ? 'Currently Active Term' : 'Set as Active Term'}
                      </button>
                      {(period.isCurrent || period.status === 'Active') && (
                        <button
                          onClick={() => setClosingTerm(period)}
                          disabled={!canManageTerms}
                          title={canManageTerms ? 'Close this term and keep its records' : 'Only the Registrar or an Administrator can close a term'}
                          className="flex-1 rounded-xl border border-rose-300 py-2 text-xs font-semibold text-rose-700 transition hover:bg-rose-50 disabled:opacity-40"
                        >
                          Close Term
                        </button>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
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
              onClick={() => setCourseModal({ course: null })}
              className="bg-[#18392B] hover:bg-[#588B76] text-white text-xs font-bold px-3.5 py-2 rounded-lg transition flex items-center gap-1.5 cursor-pointer shrink-0"
            >
              <Plus className="w-4 h-4" />
              <span>Add New Course</span>
            </button>
          </div>

          <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-x-auto">
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
                      <div className="flex items-center justify-end gap-1">
                        <button
                          onClick={() => setCourseModal({ course: subj })}
                          className="p-1.5 text-[#588B76] hover:bg-emerald-50 rounded-lg transition cursor-pointer"
                          title="Edit course"
                          aria-label={`Edit course ${subj.code}`}
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() =>
                            setPendingDelete({
                              kind: 'course',
                              id: subj.id,
                              label: `${subj.code} · ${subj.title}`,
                              message:
                                (subj.enrolledCount || 0) > 0
                                  ? `${subj.enrolledCount} student(s) are enrolled in this course. Deleting it removes it from the catalog only; their records and enrollments keep the course as it was.`
                                  : 'This permanently removes the course from the catalog. Student records and enrollments that already list it are not changed.',
                            })
                          }
                          className="p-1.5 text-rose-600 hover:bg-rose-50 rounded-lg transition cursor-pointer"
                          title="Delete course"
                          aria-label={`Delete course ${subj.code}`}
                        >
                          <Trash2 className="w-4 h-4" />
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
            {academicSubjects.filter((subj) => !subj.isArchived).map((subj) => {
              // Counted from the student records (the same list the class list shows).
              const enrolled = classListFor(subj, students).length;
              const cap = Number(subj.capacity) || 0;
              const pct = cap ? Math.min(100, Math.round((enrolled / cap) * 100)) : 0;

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
                      <span className="font-mono font-bold">{cap ? `${enrolled}/${cap} (${pct}%)` : `${enrolled} enrolled`}</span>
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
                  <button
                    type="button"
                    onClick={() => setClassListSubjectId(subj.id)}
                    className="w-full rounded-lg border border-[#588B76]/40 bg-emerald-50/60 px-3 py-2 text-xs font-bold text-[#18392B] hover:bg-emerald-100"
                  >
                    View class list ({enrolled})
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {activeSubTab === 'curriculum' && <AdminCurriculumPanel />}

      {classListSubjectId && academicSubjects.find((x) => x.id === classListSubjectId) && (
        <ClassListModal
          subject={academicSubjects.find((x) => x.id === classListSubjectId)!}
          students={students}
          onClose={() => setClassListSubjectId(null)}
        />
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
                  <div className="w-12 h-12 rounded-xl bg-slate-100 overflow-hidden shrink-0 border border-slate-200 relative">
                    {(() => {
                      const valid = getSafeImageSrc(member.imageUrl || member.image, 'https://images.unsplash.com/photo-1544005313-94ddf0286df2');
                      return (
                        <Image
                          src={valid}
                          alt={member.name}
                          fill
                          sizes="48px"
                          className="object-cover"
                          referrerPolicy="no-referrer"
                          unoptimized={Boolean(valid.startsWith('data:') || valid.startsWith('blob:'))}
                        />
                      );
                    })()}
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
          <PaymentSettingsCard />
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

          <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-x-auto">
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
                    <td className="p-3.5 font-mono font-bold text-slate-900">₱{(Number(fee.amount) || 0).toLocaleString()}</td>
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

      {activeSubTab === 'payments' && <StudentPaymentsPanel />}

      {/* ========================================================================= */}
      {/* SUBVIEW 11: SYSTEM GOVERNANCE & SETTINGS */}
      {/* ========================================================================= */}
      {activeSubTab === 'settings' && (
        <div className="space-y-6">
          <AdmissionRequirementsCard />
          <ReenrollmentRulesCard />
          <GradingScaleCard />
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
      {/* MODAL 1: COMPREHENSIVE STUDENT DOSSIER & REGISTRAR MANAGEMENT */}
      {/* ========================================================================= */}
      <AdminStudentDetailModal
        student={selectedStudentDossier}
        isOpen={!!selectedStudentDossier}
        onClose={() => setSelectedStudentDossier(null)}
      />

      {/* ========================================================================= */}
      {/* MODAL 2: CERTIFICATE OF REGISTRATION (COR) */}
      {/* ========================================================================= */}
      {isCORModalOpen && corStudent && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-2 sm:p-4">
          <div className="bg-slate-100 w-full max-w-[880px] rounded-2xl shadow-2xl border border-slate-300 max-h-[94vh] overflow-y-auto overflow-x-hidden p-3 sm:p-5 space-y-4">
            <CertificateOfRegistration student={corStudent} />
            <div className="flex justify-end gap-2 print:hidden">
              <button
                onClick={() => setIsCORModalOpen(false)}
                className="px-4 py-2 border border-slate-300 rounded-lg text-xs font-semibold hover:bg-slate-100"
              >
                Close
              </button>
              <button
                onClick={() => printCertificate()}
                className="bg-[#18392B] hover:bg-[#588B76] text-white font-bold px-4 py-2 rounded-lg text-xs flex items-center gap-1.5 cursor-pointer"
              >
                <Printer className="w-4 h-4" />
                <span>Print COR</span>
              </button>
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

            {selectedEnrollment.reenrollment ? (
              <ReenrollmentReviewPanel
                enrollment={selectedEnrollment}
                onClose={() => setSelectedEnrollment(null)}
                onReturn={() => {
                  setReturnTargetId(selectedEnrollment.id);
                  setReturnFeedback('');
                  setIsReturnModalOpen(true);
                }}
              />
            ) : (
            <>
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
                  disabled={!canManageEnrollment}
                  title={canManageEnrollment ? undefined : 'Only the Registrar, Academic Admin, Finance or an Admin can do this'}
                  onClick={() => handleApproveEnrollment(selectedEnrollment)}
                  className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold px-4 py-2 rounded-xl transition cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  Approve Application
                </button>
              </div>
            </div>
            </>
            )}
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
      {courseModal && (
        <AcademicCourseModal
          course={courseModal.course}
          existing={academicSubjects}
          instructorOptions={[...new Set([...faculty.map((m) => m.name), ...academicSubjects.map((s) => s.instructor)].filter(Boolean))].sort()}
          semesterOptions={[...new Set(['1st Semester', '2nd Semester', 'Summer Term', ...academicPeriods.map((p) => p.semester)])]}
          academicYearOptions={[...new Set(academicPeriods.map((p) => p.academicYear))].sort()}
          programOptions={[...new Set(programs.map((p) => p.title || p.name).filter(Boolean))] as string[]}
          defaultSemester={academicPeriods.find((p) => p.isCurrent)?.semester || '1st Semester'}
          defaultAcademicYear={academicPeriods.find((p) => p.isCurrent)?.academicYear || ''}
          onCancel={() => setCourseModal(null)}
          onSave={async (draft) => {
            const ok = courseModal.course
              ? await updateAcademicSubject(courseModal.course.id, draft)
              : !!(await addAcademicSubject({ ...draft, enrolledCount: 0 }));
            if (ok) setCourseModal(null);
            return ok;
          }}
        />
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
                  disabled={!canManageEnrollment}
                  title={canManageEnrollment ? undefined : 'Only the Registrar, Academic Admin, Finance or an Admin can do this'}
                  onClick={() => handleApprovePreEnlistment(selectedPreEnlistment.id)}
                  className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold px-4 py-2 rounded-xl transition disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  Approve Course Load
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
      {termModal && (
        <AcademicTermModal
          term={termModal.term}
          existing={academicPeriods}
          onCancel={() => setTermModal(null)}
          onSave={async (draft) => {
            const ok = termModal.term ? await updateAcademicPeriod(termModal.term.id, draft) : !!(await addAcademicPeriod({ ...draft, isCurrent: false }));
            if (ok) setTermModal(null);
            return ok;
          }}
        />
      )}
      {closingTerm && <CloseTermModal period={closingTerm} onClose={() => setClosingTerm(null)} />}
      <ConfirmDeleteModal
        isOpen={!!pendingDelete}
        title={pendingDelete?.title || 'Delete this record?'}
        confirmLabel={pendingDelete?.confirmLabel}
        itemName={pendingDelete?.label}
        message={pendingDelete?.message}
        isLoading={isDeleting}
        onConfirm={confirmPendingDelete}
        onCancel={() => !isDeleting && setPendingDelete(null)}
      />
    </div>
  );
};
