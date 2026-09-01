'use client';

import React, { useState } from 'react';
import { usePCM } from '@/lib/store';
import { Emblem } from '@/components/common/Emblem';
import {
  OnlineEnrollment,
  StudentDocument,
  SelectedSubject,
} from '@/lib/types';
import {
  GraduationCap,
  Calendar,
  Award,
  DollarSign,
  BookOpen,
  LogOut,
  Flame,
  User,
  Lock,
  PlusCircle,
  Clock,
  MapPin,
  FileCheck,
  CheckCircle2,
  AlertCircle,
  FileText,
  Upload,
  Download,
  Bell,
  Check,
  Send,
  Printer,
  ChevronRight,
  ChevronLeft,
  X,
  Shield,
  HelpCircle,
  Sparkles,
  Info,
  Link as LinkIcon,
} from 'lucide-react';

export const PortalView: React.FC = () => {
  const {
    isStudentLoggedIn,
    studentProfile,
    students,
    studentLogin,
    studentLogout,
    linkGoogleAccountToStudent,
    signInWithGoogle,
    currentUserAccount,
    firebaseAuthUser,
    addPracticumEntry,
    makeTuitionPayment,
    enrollments,
    currentEnrollmentDraft,
    saveEnrollmentDraft,
    submitEnrollment,
    uploadStudentDocument,
    studentNotifications,
    markNotificationRead,
    markAllNotificationsRead,
    addToast,
    programs,
  } = usePCM();

  // Authentication states
  const [studentIdInput, setStudentIdInput] = useState('2024-PCM-0418');
  const [passwordInput, setPasswordInput] = useState('pcmstudent');
  const [isGoogleSigningIn, setIsGoogleSigningIn] = useState(false);
  const [linkStudentIdInput, setLinkStudentIdInput] = useState('');
  const [isLinkingModalOpen, setIsLinkingModalOpen] = useState(false);

  // Active Main Navigation Tab
  const [activeTab, setActiveTab] = useState<
    'enrollment' | 'schedule' | 'grades' | 'vault' | 'financial' | 'practicum' | 'spiritual' | 'notifications'
  >('enrollment');

  // Practicum form state
  const [practicumType, setPracticumType] = useState<
    | 'Preaching / Teaching'
    | 'Youth Ministry'
    | 'Evangelism & Outreach'
    | 'Counseling & Visitation'
    | 'Worship & Media'
    | 'Church Administration'
  >('Preaching / Teaching');
  const [practicumLocation, setPracticumLocation] = useState('');
  const [practicumHours, setPracticumHours] = useState(4);
  const [practicumSupervisor, setPracticumSupervisor] = useState('');
  const [practicumDescription, setPracticumDescription] = useState('');

  // Payment form state
  const [paymentAmount, setPaymentAmount] = useState(5000);
  const [paymentMethod, setPaymentMethod] = useState('GCash');
  const [paymentRef, setPaymentRef] = useState('');

  // Document upload modal state
  const [isDocModalOpen, setIsDocModalOpen] = useState(false);
  const [docName, setDocName] = useState('');
  const [docType, setDocType] = useState<StudentDocument['type']>('Form 138 / TOR');

  // Certificate of Registration (COR) Modal
  const [isCORModalOpen, setIsCORModalOpen] = useState(false);

  // --- ONLINE ENROLLMENT WIZARD STATE ---
  const [isEnrollmentWizardOpen, setIsEnrollmentWizardOpen] = useState(false);
  const [wizardStep, setWizardStep] = useState<number>(1);
  const [wizardProgram, setWizardProgram] = useState(studentProfile?.degreeProgram || 'Bachelor of Theology');
  const [wizardYearLevel, setWizardYearLevel] = useState(studentProfile?.yearLevel || '3rd Year');
  const [wizardSemester, setWizardSemester] = useState('1st Semester');
  const [wizardSchoolYear, setWizardSchoolYear] = useState('2026-2027');
  const [wizardPaymentMethod, setWizardPaymentMethod] = useState('GCash');
  const [wizardPaymentOption, setWizardPaymentOption] = useState('Installment (40% Downpayment)');
  const [wizardPaymentRef, setWizardPaymentRef] = useState('');
  const [wizardNotes, setWizardNotes] = useState('');

  // Available subjects pool for enrollment selection
  const AVAILABLE_CATALOG_SUBJECTS: SelectedSubject[] = [
    { code: 'BIB-301', title: 'Greek Exegesis of Romans', units: 3, schedule: 'Mon/Wed 8:00–9:30 AM', room: 'Room 201', instructor: 'Dr. Benjamin Villanueva' },
    { code: 'THEO-302', title: 'Pneumatology & Eschatology', units: 3, schedule: 'Tue/Thu 10:00–11:30 AM', room: 'Room 104', instructor: 'Rev. Emmanuel Santos' },
    { code: 'MIN-305', title: 'Church Planting & Multiplication', units: 3, schedule: 'Mon/Wed 1:30–3:00 PM', room: 'Chapel Hall', instructor: 'Pastor Ronald Cruz' },
    { code: 'PAST-310', title: 'Pastoral Counseling & Ethics', units: 3, schedule: 'Tue/Thu 1:30–3:00 PM', room: 'Room 205', instructor: 'Dr. Maria Rebecca Santos' },
    { code: 'HIST-301', title: 'Philippine Church History', units: 3, schedule: 'Friday 9:00–12:00 PM', room: 'Room 102', instructor: 'Prof. David Morales' },
    { code: 'APOL-301', title: 'Christian Apologetics & Worldviews', units: 3, schedule: 'Friday 1:30–4:30 PM', room: 'Room 103', instructor: 'Rev. Samuel Garcia' },
  ];

  const [selectedSubjects, setSelectedSubjects] = useState<SelectedSubject[]>([
    AVAILABLE_CATALOG_SUBJECTS[0],
    AVAILABLE_CATALOG_SUBJECTS[1],
    AVAILABLE_CATALOG_SUBJECTS[2],
    AVAILABLE_CATALOG_SUBJECTS[3],
    AVAILABLE_CATALOG_SUBJECTS[4],
  ]);

  const toggleSubjectSelection = (subj: SelectedSubject) => {
    if (selectedSubjects.some((s) => s.code === subj.code)) {
      setSelectedSubjects((prev) => prev.filter((s) => s.code !== subj.code));
    } else {
      setSelectedSubjects((prev) => [...prev, subj]);
    }
  };

  const totalWizardUnits = selectedSubjects.reduce((sum, s) => sum + s.units, 0);
  const tuitionPerUnit = 850;
  const miscellaneousFees = 2500;
  const estimatedTuitionTotal = totalWizardUnits * tuitionPerUnit + miscellaneousFees;

  // Active student's latest enrollment record
  const latestEnrollment =
    enrollments.find((e) => e.studentId === studentProfile.studentId || e.studentId === studentProfile.id) ||
    currentEnrollmentDraft;

  // Unread notifications for current student
  const studentNotifs = studentNotifications.filter(
    (n) => n.studentId === studentProfile.id || n.studentId === studentProfile.studentId
  );
  const unreadNotifsCount = studentNotifs.filter((n) => !n.read).length;

  // --- AUTH HANDLERS ---
  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    const success = studentLogin(studentIdInput, passwordInput);
    if (!success) {
      addToast('error', 'Login Failed', 'Please verify your Student ID Number or password.');
    }
  };

  const handleGoogleStudentLogin = async () => {
    setIsGoogleSigningIn(true);
    try {
      const res = await signInWithGoogle();
      if (!res.success) {
        addToast('error', 'Google Login', 'Unable to complete sign-in with Google.');
      }
    } finally {
      setIsGoogleSigningIn(false);
    }
  };

  const handleLinkStudentId = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!linkStudentIdInput.trim()) return;
    const success = await linkGoogleAccountToStudent(linkStudentIdInput.trim());
    if (success) {
      setIsLinkingModalOpen(false);
      setLinkStudentIdInput('');
    }
  };

  // Practicum submission
  const handlePracticumSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!practicumLocation.trim() || !practicumSupervisor.trim()) {
      addToast('warning', 'Missing Details', 'Please fill in church location and supervisor name.');
      return;
    }
    addPracticumEntry({
      date: new Date().toISOString().split('T')[0],
      ministryType: practicumType,
      location: practicumLocation.trim(),
      hours: Number(practicumHours),
      description: practicumDescription.trim() || 'Ministry engagement logged via MyPCM Portal.',
      supervisorName: practicumSupervisor.trim(),
    });
    setPracticumLocation('');
    setPracticumSupervisor('');
    setPracticumDescription('');
  };

  // Payment submission
  const handlePayment = (e: React.FormEvent) => {
    e.preventDefault();
    if (paymentAmount <= 0) return;
    makeTuitionPayment(Number(paymentAmount), paymentMethod, paymentRef);
    setPaymentRef('');
  };

  // Document upload handler
  const handleDocumentUploadSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!docName.trim()) return;
    await uploadStudentDocument(studentProfile.id, {
      name: docName.trim(),
      type: docType,
      fileUrl: '',
      fileSize: '1.4 MB',
    });
    setIsDocModalOpen(false);
    setDocName('');
  };

  // Enrollment Wizard handlers
  const handleSaveDraft = async () => {
    await saveEnrollmentDraft({
      studentId: studentProfile.studentId,
      studentName: studentProfile.fullName || studentProfile.name,
      studentEmail: studentProfile.email,
      studentContact: studentProfile.phone,
      programTitle: wizardProgram,
      yearLevel: wizardYearLevel,
      semester: wizardSemester,
      schoolYear: wizardSchoolYear,
      selectedSubjects,
      totalUnits: totalWizardUnits,
      estimatedTuition: estimatedTuitionTotal,
      paymentMethod: wizardPaymentMethod,
      paymentOption: wizardPaymentOption,
      paymentReference: wizardPaymentRef,
      notes: wizardNotes,
    });
  };

  const handleSubmitEnrollment = async () => {
    if (selectedSubjects.length === 0) {
      addToast('warning', 'Subject Required', 'Please select at least 1 course subject to enroll.');
      return;
    }
    const result = await submitEnrollment({
      studentId: studentProfile.studentId,
      studentName: studentProfile.fullName || studentProfile.name,
      studentEmail: studentProfile.email,
      studentContact: studentProfile.phone,
      programTitle: wizardProgram,
      yearLevel: wizardYearLevel,
      semester: wizardSemester,
      schoolYear: wizardSchoolYear,
      selectedSubjects,
      totalUnits: totalWizardUnits,
      estimatedTuition: estimatedTuitionTotal,
      paymentMethod: wizardPaymentMethod,
      paymentOption: wizardPaymentOption,
      paymentReference: wizardPaymentRef,
      notes: wizardNotes,
    });

    if (result.success) {
      setIsEnrollmentWizardOpen(false);
    }
  };

  // --- RENDER LOGIN VIEW IF NOT AUTHENTICATED ---
  if (!isStudentLoggedIn) {
    return (
      <div className="w-full min-h-[85vh] bg-[#070e1c] py-16 px-4 flex items-center justify-center font-sans">
        <div className="max-w-md w-full bg-[#18392B] rounded-2xl border border-slate-700 shadow-2xl p-8 space-y-6 text-white">
          <div className="text-center space-y-3">
            <div className="w-20 h-20 bg-white/10 p-2.5 rounded-2xl border border-[#588B76]/40 flex items-center justify-center mx-auto shadow-xl backdrop-blur-xs">
              <Emblem id="student-portal-pcm-logo" size={64} className="w-16 h-16 drop-shadow-md" />
            </div>
            <h2 className="font-serif text-2xl font-bold text-white">MyPCM Student Portal</h2>
            <p className="text-xs text-slate-300">
              Institutional portal for Seminary & College student enrollment, academic records, and coursework.
            </p>
          </div>

          {/* 1-Click Google Sign In */}
          <div className="space-y-3">
            <button
              id="btn-student-google-login"
              type="button"
              onClick={handleGoogleStudentLogin}
              disabled={isGoogleSigningIn}
              className="w-full bg-white hover:bg-slate-100 text-slate-900 font-semibold py-3 px-4 rounded-xl shadow-lg transition flex items-center justify-center gap-3 text-xs cursor-pointer disabled:opacity-50"
            >
              <svg className="w-5 h-5 shrink-0" viewBox="0 0 24 24">
                <path
                  fill="#4285F4"
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                />
                <path
                  fill="#34A853"
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                />
                <path
                  fill="#FBBC05"
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                />
                <path
                  fill="#EA4335"
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                />
              </svg>
              <span>{isGoogleSigningIn ? 'Authenticating with Google...' : 'Sign in with Google / Gmail'}</span>
            </button>

            <div className="flex items-center gap-3">
              <div className="flex-1 h-px bg-slate-700"></div>
              <span className="text-[10px] text-slate-400 font-mono">OR SIGN IN WITH STUDENT ID</span>
              <div className="flex-1 h-px bg-slate-700"></div>
            </div>
          </div>

          {/* Demo Access Credentials Badge */}
          <div className="bg-amber-500/10 border border-amber-500/30 rounded-xl p-3.5 text-xs text-amber-200 space-y-2">
            <div className="flex items-center justify-between">
              <span className="font-bold text-amber-300">Demo Student Credentials:</span>
              <button
                type="button"
                onClick={() => {
                  setStudentIdInput('2024-PCM-0418');
                  setPasswordInput('pcmstudent');
                }}
                className="text-[10px] bg-amber-400/20 hover:bg-amber-400/30 text-amber-200 px-2 py-0.5 rounded font-mono transition cursor-pointer"
              >
                Auto Fill
              </button>
            </div>
            <div className="grid grid-cols-2 gap-2 font-mono text-[11px]">
              <div className="bg-black/30 p-1.5 rounded border border-white/5">
                <span className="text-slate-400 block text-[10px]">Student ID</span>
                <code className="text-white font-bold">2024-PCM-0418</code>
              </div>
              <div className="bg-black/30 p-1.5 rounded border border-white/5">
                <span className="text-slate-400 block text-[10px]">Password</span>
                <code className="text-white font-bold">pcmstudent</code>
              </div>
            </div>
          </div>

          {/* Standard Form */}
          <form onSubmit={handleLogin} className="space-y-4 text-xs">
            <div className="space-y-1">
              <label className="text-slate-300 font-semibold flex items-center gap-1.5">
                <User className="w-3.5 h-3.5 text-[#588B76]" />
                <span>Student ID Number</span>
              </label>
              <input
                type="text"
                required
                value={studentIdInput}
                onChange={(e) => setStudentIdInput(e.target.value)}
                placeholder="2024-PCM-0418"
                className="w-full bg-[#070e1c] border border-slate-700 rounded-lg p-3 text-white font-mono focus:border-[#588B76] focus:outline-none"
              />
            </div>

            <div className="space-y-1">
              <label className="text-slate-300 font-semibold flex items-center gap-1.5">
                <Lock className="w-3.5 h-3.5 text-[#588B76]" />
                <span>Student Portal Password</span>
              </label>
              <input
                type="password"
                required
                value={passwordInput}
                onChange={(e) => setPasswordInput(e.target.value)}
                placeholder="••••••••"
                className="w-full bg-[#070e1c] border border-slate-700 rounded-lg p-3 text-white font-mono focus:border-[#588B76] focus:outline-none"
              />
            </div>

            <button
              type="submit"
              className="w-full bg-[#588B76] hover:bg-[#85AA9B] text-[#18392B] font-bold py-3.5 rounded-lg text-xs transition uppercase tracking-wider cursor-pointer shadow-lg mt-2"
            >
              Sign In to MyPCM Portal
            </button>
          </form>
        </div>
      </div>
    );
  }

  // Calculate Balances
  const remainingBalance =
    studentProfile.tuitionBalance !== undefined
      ? studentProfile.tuitionBalance
      : Math.max(0, (studentProfile.tuitionTotal || 0) - (studentProfile.tuitionPaid || 0));
  const totalPracticumHours = (studentProfile.practicumEntries || []).reduce((acc, curr) => acc + curr.hours, 0);

  const isEnrolled = studentProfile.enrollmentStatus === 'Enrolled' || latestEnrollment?.status === 'Approved';
  const isPendingEnrollment = studentProfile.enrollmentStatus === 'Submitted' || latestEnrollment?.status === 'Submitted' || latestEnrollment?.status === 'Under Review';
  const isReturnedEnrollment = studentProfile.enrollmentStatus === 'Returned for Correction' || latestEnrollment?.status === 'Returned for Correction';

  return (
    <div className="w-full min-h-screen bg-slate-50 pb-24 font-sans">
      {/* Student Banner Header */}
      <div className="bg-[#18392B] text-white border-b border-[#588B76]/40 py-8 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-full bg-[#588B76] text-[#18392B] font-serif font-black text-2xl flex items-center justify-center shadow-lg border-2 border-amber-300 shrink-0">
              {(studentProfile.fullName || studentProfile.name || 'S').charAt(0)}
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-[11px] font-mono font-bold uppercase tracking-wider text-[#85AA9B] bg-white/10 px-2.5 py-0.5 rounded border border-white/10">
                  ID: {studentProfile.studentId}
                </span>
                <span
                  className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded-full ${
                    isEnrolled
                      ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                      : isPendingEnrollment
                      ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                      : isReturnedEnrollment
                      ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                      : 'bg-slate-500/20 text-slate-300 border border-slate-500/30'
                  }`}
                >
                  {isEnrolled ? 'Officially Enrolled' : studentProfile.enrollmentStatus || 'Matriculated'}
                </span>
              </div>
              <h1 className="font-serif text-2xl sm:text-3xl font-bold text-white mt-1">
                {studentProfile.fullName || studentProfile.name}
              </h1>
              <p className="text-xs text-slate-300">
                {studentProfile.degreeProgram || studentProfile.program} • {studentProfile.yearLevel} | {studentProfile.currentSemester}
              </p>
            </div>
          </div>

          {/* Quick Metrics & Actions */}
          <div className="flex flex-wrap items-center gap-3">
            <div className="bg-[#070e1c] px-3.5 py-2 rounded-xl border border-slate-700 text-center">
              <span className="text-[10px] text-slate-400 uppercase font-mono block">Cumulative GPA</span>
              <span className="font-serif text-lg font-bold text-[#85AA9B]">
                {(studentProfile.gpa || 1.0).toFixed(2)}
              </span>
            </div>

            <div className="bg-[#070e1c] px-3.5 py-2 rounded-xl border border-slate-700 text-center">
              <span className="text-[10px] text-slate-400 uppercase font-mono block">Units Completed</span>
              <span className="font-serif text-lg font-bold text-emerald-400">
                {studentProfile.totalUnitsEarned || 36}
              </span>
            </div>

            <div className="bg-[#070e1c] px-3.5 py-2 rounded-xl border border-slate-700 text-center">
              <span className="text-[10px] text-slate-400 uppercase font-mono block">Tuition Balance</span>
              <span className={`font-serif text-lg font-bold ${remainingBalance > 0 ? 'text-amber-400' : 'text-emerald-400'}`}>
                ₱{remainingBalance.toLocaleString()}
              </span>
            </div>

            <button
              onClick={studentLogout}
              className="bg-slate-800 hover:bg-rose-900 text-slate-200 text-xs font-semibold px-4 py-3 rounded-xl border border-slate-700 transition flex items-center gap-1.5 cursor-pointer"
            >
              <LogOut className="w-4 h-4" />
              <span>Logout</span>
            </button>
          </div>
        </div>
      </div>

      {/* Main Student Console */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-6 space-y-6">
        {/* Important Enrollment Notice Banner */}
        {isReturnedEnrollment && (
          <div className="bg-rose-50 border border-rose-200 rounded-2xl p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 text-xs text-rose-900 shadow-xs">
            <div className="flex items-center gap-3">
              <AlertCircle className="w-6 h-6 text-rose-600 shrink-0" />
              <div>
                <strong className="block text-sm font-bold text-rose-800">Enrollment Action Required</strong>
                <p>The Registrar returned your application with comments: &quot;{latestEnrollment?.adminRemarks || 'Please review subject load & clear credentials.'}&quot;</p>
              </div>
            </div>
            <button
              onClick={() => setIsEnrollmentWizardOpen(true)}
              className="bg-rose-700 hover:bg-rose-800 text-white font-bold px-4 py-2 rounded-lg transition cursor-pointer shrink-0"
            >
              Revise & Resubmit Application
            </button>
          </div>
        )}

        {/* Navigation Tabs Bar */}
        <div className="bg-white p-2 rounded-2xl border border-slate-200 shadow-xs flex items-center gap-1.5 overflow-x-auto text-xs font-bold scrollbar-none">
          {[
            { id: 'enrollment', label: 'Online Enrollment Hub', icon: GraduationCap, badge: isEnrolled ? 'Enrolled' : 'Active Term' },
            { id: 'schedule', label: 'Class Schedule', icon: Calendar, count: studentProfile.courses?.length || 0 },
            { id: 'grades', label: 'Grades & Evaluation', icon: Award },
            { id: 'vault', label: 'Document Vault', icon: FileText, count: studentProfile.documents?.length || 0 },
            { id: 'financial', label: 'Tuition & Billing', icon: DollarSign },
            { id: 'practicum', label: `Practicum Log (${totalPracticumHours}h)`, icon: Flame },
            { id: 'spiritual', label: 'Mentorship & Church', icon: BookOpen },
            { id: 'notifications', label: 'Notifications', icon: Bell, count: unreadNotifsCount, isBadgeCount: true },
          ].map((t) => {
            const Icon = t.icon;
            const isActive = activeTab === t.id;
            return (
              <button
                key={t.id}
                onClick={() => setActiveTab(t.id as any)}
                className={`px-3.5 py-2.5 rounded-xl flex items-center gap-2 whitespace-nowrap transition cursor-pointer shrink-0 ${
                  isActive
                    ? 'bg-[#18392B] text-white shadow-xs'
                    : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                }`}
              >
                <Icon className={`w-4 h-4 ${isActive ? 'text-[#85AA9B]' : 'text-[#588B76]'}`} />
                <span>{t.label}</span>
                {t.badge && (
                  <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-mono ${isActive ? 'bg-white/20 text-white' : 'bg-emerald-100 text-emerald-800'}`}>
                    {t.badge}
                  </span>
                )}
                {t.count !== undefined && t.count > 0 && (
                  <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-mono ${isActive ? 'bg-white/20 text-white' : t.isBadgeCount ? 'bg-amber-500 text-white font-bold' : 'bg-slate-100 text-slate-700'}`}>
                    {t.count}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* TAB 1: ONLINE ENROLLMENT HUB */}
        {activeTab === 'enrollment' && (
          <div className="space-y-6">
            {/* Enrollment Status Card */}
            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-6">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-100 pb-4">
                <div>
                  <span className="text-xs font-mono font-bold text-[#588B76] uppercase">
                    Academic Year 2026–2027 • 1st Semester
                  </span>
                  <h3 className="font-serif text-2xl font-bold text-[#18392B]">
                    Online Enrollment & Course Registration
                  </h3>
                  <p className="text-xs text-slate-500 mt-1">
                    Manage your semester subject enlistment, upload admission requirements, and obtain your official Certificate of Registration.
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  {isEnrolled && (
                    <button
                      onClick={() => setIsCORModalOpen(true)}
                      className="bg-[#18392B] hover:bg-[#588B76] text-white hover:text-[#18392B] font-bold px-4 py-2.5 rounded-xl text-xs transition flex items-center gap-2 cursor-pointer shadow-sm"
                    >
                      <Printer className="w-4 h-4" />
                      <span>View & Print Official COR</span>
                    </button>
                  )}

                  <button
                    onClick={() => setIsEnrollmentWizardOpen(true)}
                    className="bg-[#588B76] hover:bg-[#85AA9B] text-[#18392B] font-bold px-4 py-2.5 rounded-xl text-xs transition flex items-center gap-2 cursor-pointer shadow-sm"
                  >
                    <PlusCircle className="w-4 h-4" />
                    <span>{latestEnrollment ? 'Manage / Update Enrollment' : 'Start Online Enrollment'}</span>
                  </button>
                </div>
              </div>

              {/* Status Timeline Workflow */}
              <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
                {[
                  { step: '1', title: 'Course Enlistment', desc: 'Subjects selected & units assessed', completed: true },
                  { step: '2', title: 'Document Verification', desc: 'TOR, Good Moral & Endorsement', completed: true },
                  { step: '3', title: 'Registrar Approval', desc: 'Verification of academic prerequisites', completed: isEnrolled },
                  { step: '4', title: 'Official COR Release', desc: 'Certificate of Registration issued', completed: isEnrolled },
                ].map((st, i) => (
                  <div
                    key={st.step}
                    className={`p-4 rounded-xl border text-xs space-y-1.5 ${
                      st.completed
                        ? 'bg-emerald-50/70 border-emerald-200 text-emerald-950'
                        : 'bg-slate-50 border-slate-200 text-slate-500'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-mono font-bold text-[10px] text-[#588B76]">Step 0{st.step}</span>
                      {st.completed ? (
                        <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                      ) : (
                        <Clock className="w-4 h-4 text-slate-400" />
                      )}
                    </div>
                    <strong className="font-serif text-sm block font-bold text-slate-900">{st.title}</strong>
                    <p className="text-[11px] text-slate-600">{st.desc}</p>
                  </div>
                ))}
              </div>

              {/* Current Application Summary */}
              {latestEnrollment && (
                <div className="bg-slate-50 rounded-xl p-4 border border-slate-200 space-y-3 text-xs">
                  <div className="flex items-center justify-between">
                    <span className="font-mono font-bold text-[#18392B]">
                      Active Enrollment Record: {latestEnrollment.referenceNumber}
                    </span>
                    <span
                      className={`font-mono font-bold px-2 py-0.5 rounded text-[10px] ${
                        latestEnrollment.status === 'Approved'
                          ? 'bg-emerald-100 text-emerald-800'
                          : latestEnrollment.status === 'Submitted'
                          ? 'bg-amber-100 text-amber-800'
                          : 'bg-slate-200 text-slate-700'
                      }`}
                    >
                      Status: {latestEnrollment.status}
                    </span>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-slate-700 font-sans">
                    <div>
                      <span className="text-slate-400 block text-[10px]">Degree Program</span>
                      <strong className="font-semibold">{latestEnrollment.programTitle}</strong>
                    </div>
                    <div>
                      <span className="text-slate-400 block text-[10px]">Academic Term</span>
                      <strong className="font-semibold">{latestEnrollment.semester}, {latestEnrollment.schoolYear}</strong>
                    </div>
                    <div>
                      <span className="text-slate-400 block text-[10px]">Course Load</span>
                      <strong className="font-semibold font-mono">{latestEnrollment.selectedSubjects?.length || 0} Subjects ({latestEnrollment.totalUnits} Units)</strong>
                    </div>
                    <div>
                      <span className="text-slate-400 block text-[10px]">Assessed Tuition</span>
                      <strong className="font-semibold font-mono text-[#18392B]">₱{(latestEnrollment.estimatedTuition || 0).toLocaleString()}</strong>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* TAB 2: CLASS SCHEDULE */}
        {activeTab === 'schedule' && (
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="font-serif text-xl font-bold text-[#18392B]">
                Enrolled Class Schedule — {studentProfile.currentSemester}
              </h3>
              <span className="text-xs font-mono font-semibold text-emerald-800 bg-emerald-100 px-3 py-1 rounded-full border border-emerald-300">
                Officially Registered
              </span>
            </div>

            <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-xs">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse min-w-[650px]">
                  <thead>
                    <tr className="bg-[#18392B] text-white">
                      <th className="p-3.5 font-bold">Course Code</th>
                      <th className="p-3.5 font-bold">Subject Title</th>
                      <th className="p-3.5 font-bold">Units</th>
                      <th className="p-3.5 font-bold">Class Schedule</th>
                      <th className="p-3.5 font-bold">Room</th>
                      <th className="p-3.5 font-bold">Faculty Instructor</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200 text-slate-700">
                    {(studentProfile.courses || []).map((c) => (
                      <tr key={c.id || c.code} className="hover:bg-slate-50 transition">
                        <td className="p-3.5 font-mono font-bold text-[#18392B]">{c.code}</td>
                        <td className="p-3.5 font-semibold text-slate-900">{c.title}</td>
                        <td className="p-3.5 font-mono">{c.units} Units</td>
                        <td className="p-3.5">{c.schedule}</td>
                        <td className="p-3.5 text-slate-600">{c.room}</td>
                        <td className="p-3.5 text-slate-500">{c.instructor}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* TAB 3: GRADES & EVALUATION */}
        {activeTab === 'grades' && (
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <div>
                <h3 className="font-serif text-xl font-bold text-[#18392B]">
                  Term Grades & Academic Evaluation
                </h3>
                <p className="text-xs text-slate-500">Official grades posted by the Dean of Academic Affairs.</p>
              </div>
              <span className="text-xs font-mono font-bold text-[#18392B] bg-amber-100 px-3 py-1 rounded border border-amber-300">
                Dean&apos;s Honor List Standing
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {(studentProfile.courses || []).map((c) => (
                <div key={c.id || c.code} className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="font-mono text-xs font-bold text-[#588B76]">{c.code}</span>
                    <span className="font-mono font-extrabold text-base text-[#18392B] bg-slate-100 px-2 py-0.5 rounded">
                      {c.finalGrade || 'In Progress'}
                    </span>
                  </div>
                  <h4 className="font-serif text-sm font-bold text-[#18392B]">{c.title}</h4>
                  <div className="pt-2 border-t border-slate-100 flex justify-between text-xs text-slate-500 font-mono">
                    <span>Midterm: {c.midtermGrade || '1.25'}</span>
                    <span>Units: {c.units}</span>
                    <span className="text-emerald-700 font-bold">{c.status || 'Completed'}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* TAB 4: DOCUMENT VAULT */}
        {activeTab === 'vault' && (
          <div className="space-y-6">
            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-4">
                <div>
                  <h3 className="font-serif text-xl font-bold text-[#18392B] flex items-center gap-2">
                    <FileText className="w-5 h-5 text-[#588B76]" />
                    <span>Student Credentials & Document Vault</span>
                  </h3>
                  <p className="text-xs text-slate-500">
                    Uploaded admission documents, baptismal certificates, and medical clearances verified by the Registrar.
                  </p>
                </div>
                <button
                  onClick={() => setIsDocModalOpen(true)}
                  className="bg-[#18392B] hover:bg-[#588B76] text-white hover:text-[#18392B] font-bold px-4 py-2.5 rounded-xl text-xs transition flex items-center gap-2 cursor-pointer shadow-sm shrink-0"
                >
                  <Upload className="w-4 h-4" />
                  <span>Upload New Document</span>
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {(studentProfile.documents || []).map((doc) => (
                  <div key={doc.id} className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-3 text-xs">
                    <div className="flex items-start justify-between gap-2">
                      <div className="space-y-0.5">
                        <span className="font-mono text-[10px] text-slate-400 uppercase">{doc.type}</span>
                        <h4 className="font-bold text-slate-900">{doc.name}</h4>
                      </div>
                      <span
                        className={`font-mono text-[10px] font-bold px-2 py-0.5 rounded-full ${
                          doc.verificationStatus === 'Verified'
                            ? 'bg-emerald-100 text-emerald-800'
                            : doc.verificationStatus === 'Action Required'
                            ? 'bg-rose-100 text-rose-800'
                            : 'bg-amber-100 text-amber-800'
                        }`}
                      >
                        {doc.verificationStatus}
                      </span>
                    </div>

                    <div className="text-[11px] text-slate-500 font-mono flex items-center justify-between">
                      <span>Uploaded: {doc.uploadDate}</span>
                      <span>{doc.fileSize || '1.2 MB'}</span>
                    </div>

                    {doc.adminFeedback && (
                      <p className="text-[11px] text-amber-800 bg-amber-50 p-2 rounded border border-amber-200">
                        <strong>Registrar Note:</strong> {doc.adminFeedback}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* TAB 5: TUITION & FINANCIAL BILLING */}
        {activeTab === 'financial' && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-[#18392B] text-white p-6 rounded-xl border border-[#588B76]/40 space-y-2">
                <span className="text-xs font-mono text-[#85AA9B] uppercase">Total Assessed Tuition</span>
                <div className="font-serif text-3xl font-extrabold text-white">
                  ₱{(studentProfile.tuitionTotal || 17800).toLocaleString('en-PH')}
                </div>
                <span className="text-xs text-slate-400 block">AY 2026–2027 (18 Units Total)</span>
              </div>

              <div className="bg-emerald-900 text-white p-6 rounded-xl border border-emerald-500/40 space-y-2">
                <span className="text-xs font-mono text-emerald-300 uppercase">Total Paid to Date</span>
                <div className="font-serif text-3xl font-extrabold text-white">
                  ₱{(studentProfile.tuitionPaid || 0).toLocaleString('en-PH')}
                </div>
                <span className="text-xs text-emerald-200 block">Verified Official Receipts</span>
              </div>

              <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm space-y-2">
                <span className="text-xs font-mono text-slate-500 uppercase">Outstanding Balance</span>
                <div className={`font-serif text-3xl font-extrabold ${remainingBalance > 0 ? 'text-amber-700' : 'text-emerald-700'}`}>
                  ₱{remainingBalance.toLocaleString('en-PH')}
                </div>
                <span className="text-xs text-slate-500 block">
                  {remainingBalance === 0 ? 'Account Cleared & In Good Standing' : 'Payable prior to Term Finals'}
                </span>
              </div>
            </div>

            {/* Payment Portal */}
            <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm space-y-4">
              <h4 className="font-serif text-base font-bold text-[#18392B] flex items-center gap-2">
                <DollarSign className="w-5 h-5 text-[#588B76]" />
                <span>Submit Online Tuition Installment Payment</span>
              </h4>
              <form onSubmit={handlePayment} className="grid grid-cols-1 sm:grid-cols-4 gap-3 text-xs">
                <div className="space-y-1">
                  <label className="text-slate-600 font-semibold">Payment Amount (PHP)</label>
                  <input
                    type="number"
                    min="1000"
                    max={remainingBalance || 50000}
                    value={paymentAmount}
                    onChange={(e) => setPaymentAmount(Number(e.target.value))}
                    className="p-2.5 rounded border border-slate-300 w-full font-mono font-bold"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-slate-600 font-semibold">Payment Channel</label>
                  <select
                    value={paymentMethod}
                    onChange={(e) => setPaymentMethod(e.target.value)}
                    className="p-2.5 rounded border border-slate-300 w-full bg-white"
                  >
                    <option value="GCash">GCash (0917-888-PCM1)</option>
                    <option value="Maya">Maya (0918-999-PCM2)</option>
                    <option value="Bank Transfer (BDO)">BDO (Acct # 0012-3456-7890)</option>
                    <option value="Bank Transfer (BPI)">BPI (Acct # 9876-5432-10)</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-slate-600 font-semibold">Transaction Reference #</label>
                  <input
                    type="text"
                    required
                    value={paymentRef}
                    onChange={(e) => setPaymentRef(e.target.value)}
                    placeholder="e.g. GC-9821384"
                    className="p-2.5 rounded border border-slate-300 w-full font-mono"
                  />
                </div>

                <div className="flex items-end">
                  <button
                    type="submit"
                    disabled={remainingBalance === 0}
                    className="w-full bg-[#18392B] hover:bg-[#588B76] hover:text-[#18392B] text-white font-bold py-2.5 rounded transition uppercase cursor-pointer disabled:opacity-50"
                  >
                    Submit Payment
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* TAB 6: PRACTICUM TRACKER */}
        {activeTab === 'practicum' && (
          <div className="space-y-6">
            <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm space-y-4">
              <h3 className="font-serif text-lg font-bold text-[#18392B] flex items-center gap-2">
                <PlusCircle className="w-5 h-5 text-[#588B76]" />
                <span>Log New Ministry Practicum Hours</span>
              </h3>
              <form onSubmit={handlePracticumSubmit} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-xs">
                <div className="space-y-1">
                  <label className="text-slate-600 font-semibold">Ministry Track</label>
                  <select
                    value={practicumType}
                    onChange={(e) => setPracticumType(e.target.value as any)}
                    className="w-full p-2 rounded border border-slate-300 bg-white"
                  >
                    <option value="Preaching / Teaching">Preaching / Teaching</option>
                    <option value="Youth Ministry">Youth Ministry</option>
                    <option value="Evangelism & Outreach">Evangelism & Outreach</option>
                    <option value="Counseling & Visitation">Counseling & Visitation</option>
                    <option value="Worship & Media">Worship & Media</option>
                    <option value="Church Administration">Church Administration</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-slate-600 font-semibold">Location / Partner Church</label>
                  <input
                    type="text"
                    required
                    value={practicumLocation}
                    onChange={(e) => setPracticumLocation(e.target.value)}
                    placeholder="e.g. Grace Bible Church, Cainta"
                    className="w-full p-2 rounded border border-slate-300"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-slate-600 font-semibold">Hours Rendered</label>
                  <input
                    type="number"
                    min="1"
                    max="24"
                    required
                    value={practicumHours}
                    onChange={(e) => setPracticumHours(Number(e.target.value))}
                    className="w-full p-2 rounded border border-slate-300"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-slate-600 font-semibold">Supervisor / Pastor</label>
                  <input
                    type="text"
                    required
                    value={practicumSupervisor}
                    onChange={(e) => setPracticumSupervisor(e.target.value)}
                    placeholder="e.g. Pastor Arnold Santos"
                    className="w-full p-2 rounded border border-slate-300"
                  />
                </div>

                <div className="sm:col-span-2 lg:col-span-3 space-y-1">
                  <label className="text-slate-600 font-semibold">Description of Ministry Activity</label>
                  <input
                    type="text"
                    value={practicumDescription}
                    onChange={(e) => setPracticumDescription(e.target.value)}
                    placeholder="Brief ministry summary..."
                    className="w-full p-2 rounded border border-slate-300"
                  />
                </div>

                <div className="sm:col-span-2 lg:col-span-1 flex items-end">
                  <button
                    type="submit"
                    className="w-full bg-[#18392B] hover:bg-[#588B76] hover:text-[#18392B] text-white font-bold py-2 rounded transition uppercase cursor-pointer"
                  >
                    Submit Entry
                  </button>
                </div>
              </form>
            </div>

            <div className="space-y-3">
              <h4 className="font-serif text-base font-bold text-[#18392B]">
                Practicum Log Entries ({(studentProfile.practicumEntries || []).length} Recorded)
              </h4>
              <div className="space-y-2">
                {(studentProfile.practicumEntries || []).map((p) => (
                  <div key={p.id} className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="font-mono font-bold text-[#588B76] bg-amber-50 px-2 py-0.5 rounded border border-amber-200 text-[10px]">
                          {p.ministryType}
                        </span>
                        <span className="text-slate-400 font-mono text-[10px]">{p.date}</span>
                      </div>
                      <p className="text-slate-800 font-medium">{p.description}</p>
                      <div className="flex items-center gap-3 text-slate-500 text-[11px]">
                        <span className="flex items-center gap-1">
                          <MapPin className="w-3.5 h-3.5 text-[#588B76]" />
                          {p.location}
                        </span>
                        <span>Supervisor: {p.supervisorName}</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-3 shrink-0">
                      <span className="font-mono font-bold text-slate-900 text-sm flex items-center gap-1">
                        <Clock className="w-3.5 h-3.5 text-slate-500" />
                        {p.hours} hrs
                      </span>
                      <span className="bg-emerald-100 text-emerald-800 font-bold px-2.5 py-1 rounded text-[10px] flex items-center gap-1">
                        <FileCheck className="w-3 h-3" />
                        {p.status}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* TAB 7: SPIRITUAL MENTORSHIP */}
        {activeTab === 'spiritual' && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm space-y-4 text-xs">
              <h4 className="font-serif text-base font-bold text-[#18392B]">Assigned Faculty Mentor</h4>
              <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-2">
                <strong className="font-serif text-base text-[#18392B] block">{studentProfile.mentorName || 'Dr. Benjamin Villanueva'}</strong>
                <p className="text-slate-600">Department of Biblical Studies & Pastoral Theology</p>
                <span className="text-slate-500 block">Weekly Discipleship Group: Thursdays 4:00 PM</span>
              </div>
            </div>

            <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm space-y-4 text-xs">
              <h4 className="font-serif text-base font-bold text-[#18392B]">Home Church Endorsement</h4>
              <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-2">
                <strong className="font-serif text-base text-[#18392B] block">{studentProfile.homeChurch || 'Philippine Church of Christ'}</strong>
                <p className="text-slate-600">Active ministry status verified for ministerial scholarship.</p>
              </div>
            </div>
          </div>
        )}

        {/* TAB 8: NOTIFICATIONS HUB */}
        {activeTab === 'notifications' && (
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <h3 className="font-serif text-xl font-bold text-[#18392B] flex items-center gap-2">
                <Bell className="w-5 h-5 text-[#588B76]" />
                <span>Student Notifications & Registrar Bulletins</span>
              </h3>
              <button
                onClick={() => markAllNotificationsRead(studentProfile.id)}
                className="text-xs font-semibold text-[#588B76] hover:underline cursor-pointer"
              >
                Mark all as read
              </button>
            </div>

            <div className="space-y-3">
              {studentNotifs.length === 0 ? (
                <p className="text-xs text-slate-500 text-center py-8">No notifications at this time.</p>
              ) : (
                studentNotifs.map((n) => (
                  <div
                    key={n.id}
                    onClick={() => markNotificationRead(n.id)}
                    className={`p-4 rounded-xl border text-xs space-y-1 transition cursor-pointer ${
                      n.read ? 'bg-white border-slate-200 text-slate-600' : 'bg-amber-50/70 border-amber-200 text-amber-950 font-medium'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-bold font-serif text-slate-900">{n.title}</span>
                      <span className="font-mono text-[10px] text-slate-400">{n.createdAt?.split('T')[0]}</span>
                    </div>
                    <p>{n.message}</p>
                  </div>
                ))
              )}
            </div>
          </div>
        )}
      </div>

      {/* --- MODAL 1: ONLINE ENROLLMENT WIZARD --- */}
      {isEnrollmentWizardOpen && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[92vh] overflow-y-auto p-6 space-y-6 shadow-2xl border border-slate-200">
            <div className="flex items-center justify-between border-b border-slate-200 pb-4">
              <div>
                <span className="text-[10px] font-mono font-bold text-[#588B76] uppercase block">Step {wizardStep} of 4</span>
                <h3 className="font-serif text-2xl font-bold text-[#18392B]">
                  {wizardStep === 1 && '1. Program & Academic Term Selection'}
                  {wizardStep === 2 && '2. Course Load & Subject Selection'}
                  {wizardStep === 3 && '3. Tuition Assessment & Payment Plan'}
                  {wizardStep === 4 && '4. Review & Submit Application'}
                </h3>
              </div>
              <button onClick={() => setIsEnrollmentWizardOpen(false)} className="text-slate-400 hover:text-slate-600 cursor-pointer">
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* STEP 1: PROGRAM & TERM */}
            {wizardStep === 1 && (
              <div className="space-y-4 text-xs">
                <div className="space-y-1">
                  <label className="text-slate-700 font-semibold">Degree Program</label>
                  <select
                    value={wizardProgram}
                    onChange={(e) => setWizardProgram(e.target.value)}
                    className="w-full p-2.5 rounded-lg border border-slate-300 bg-white"
                  >
                    <option value="Bachelor of Theology">Bachelor of Theology (B.Th.)</option>
                    <option value="Bachelor of Ministry">Bachelor of Ministry (B.Min.)</option>
                    <option value="Master of Divinity">Master of Divinity (M.Div.)</option>
                    <option value="Diploma in Christian Ministry">Diploma in Christian Ministry</option>
                  </select>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="text-slate-700 font-semibold">Year Level</label>
                    <select
                      value={wizardYearLevel}
                      onChange={(e) => setWizardYearLevel(e.target.value)}
                      className="w-full p-2.5 rounded-lg border border-slate-300 bg-white"
                    >
                      <option value="1st Year">1st Year</option>
                      <option value="2nd Year">2nd Year</option>
                      <option value="3rd Year">3rd Year</option>
                      <option value="4th Year">4th Year</option>
                    </select>
                  </div>

                  <div className="space-y-1">
                    <label className="text-slate-700 font-semibold">Academic Semester</label>
                    <select
                      value={wizardSemester}
                      onChange={(e) => setWizardSemester(e.target.value)}
                      className="w-full p-2.5 rounded-lg border border-slate-300 bg-white"
                    >
                      <option value="1st Semester">1st Semester (Aug–Dec 2026)</option>
                      <option value="2nd Semester">2nd Semester (Jan–May 2027)</option>
                      <option value="Summer Term">Summer Term (Jun–Jul 2027)</option>
                    </select>
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-slate-700 font-semibold">Student Contact Phone</label>
                  <input
                    type="text"
                    defaultValue={studentProfile.phone || '0917-555-4321'}
                    className="w-full p-2.5 rounded-lg border border-slate-300"
                  />
                </div>
              </div>
            )}

            {/* STEP 2: SUBJECTS SELECTION */}
            {wizardStep === 2 && (
              <div className="space-y-4 text-xs">
                <div className="flex items-center justify-between">
                  <span className="text-slate-600">Select course offerings for {wizardSemester}:</span>
                  <span className="font-mono font-bold text-[#18392B]">
                    Selected: {selectedSubjects.length} Courses ({totalWizardUnits} Units)
                  </span>
                </div>

                <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
                  {AVAILABLE_CATALOG_SUBJECTS.map((subj) => {
                    const isSelected = selectedSubjects.some((s) => s.code === subj.code);
                    return (
                      <div
                        key={subj.code}
                        onClick={() => toggleSubjectSelection(subj)}
                        className={`p-3 rounded-xl border flex items-center justify-between gap-3 transition cursor-pointer ${
                          isSelected ? 'bg-emerald-50/70 border-emerald-300 text-emerald-950' : 'bg-white border-slate-200 text-slate-700'
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <input
                            type="checkbox"
                            checked={isSelected}
                            onChange={() => {}}
                            className="w-4 h-4 text-emerald-600 rounded cursor-pointer"
                          />
                          <div>
                            <span className="font-mono font-bold text-[#18392B] mr-2">{subj.code}</span>
                            <span className="font-semibold">{subj.title}</span>
                            <div className="text-[11px] text-slate-500 font-sans">
                              {subj.schedule} • {subj.room} • {subj.instructor}
                            </div>
                          </div>
                        </div>
                        <span className="font-mono font-bold shrink-0">{subj.units} Units</span>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* STEP 3: TUITION & PAYMENT OPTION */}
            {wizardStep === 3 && (
              <div className="space-y-4 text-xs">
                <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-2">
                  <div className="flex justify-between">
                    <span>Tuition Fee ({totalWizardUnits} units @ ₱{tuitionPerUnit}/unit):</span>
                    <span className="font-mono font-bold">₱{(totalWizardUnits * tuitionPerUnit).toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Registration & Miscellaneous:</span>
                    <span className="font-mono font-bold">₱{miscellaneousFees.toLocaleString()}</span>
                  </div>
                  <div className="pt-2 border-t border-slate-200 flex justify-between font-serif text-sm font-bold text-[#18392B]">
                    <span>Total Assessed Tuition:</span>
                    <span className="font-mono text-base">₱{estimatedTuitionTotal.toLocaleString()}</span>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="text-slate-700 font-semibold">Payment Scheme</label>
                    <select
                      value={wizardPaymentOption}
                      onChange={(e) => setWizardPaymentOption(e.target.value)}
                      className="w-full p-2.5 rounded-lg border border-slate-300 bg-white"
                    >
                      <option value="Full Payment (5% Discount)">Full Payment (5% Discount)</option>
                      <option value="Installment (40% Downpayment)">Installment (40% Downpayment)</option>
                      <option value="Monthly Installment Plan">Monthly Installment Plan</option>
                    </select>
                  </div>

                  <div className="space-y-1">
                    <label className="text-slate-700 font-semibold">Payment Channel</label>
                    <select
                      value={wizardPaymentMethod}
                      onChange={(e) => setWizardPaymentMethod(e.target.value)}
                      className="w-full p-2.5 rounded-lg border border-slate-300 bg-white"
                    >
                      <option value="GCash">GCash</option>
                      <option value="Maya">Maya</option>
                      <option value="Bank Transfer (BDO)">Bank Transfer (BDO)</option>
                      <option value="Bank Transfer (BPI)">Bank Transfer (BPI)</option>
                      <option value="Cash / Campus Cashier">Cash / Campus Cashier</option>
                    </select>
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-slate-700 font-semibold">Proof of Payment Reference (Optional)</label>
                  <input
                    type="text"
                    value={wizardPaymentRef}
                    onChange={(e) => setWizardPaymentRef(e.target.value)}
                    placeholder="e.g. GC-8912381"
                    className="w-full p-2.5 rounded-lg border border-slate-300 font-mono"
                  />
                </div>
              </div>
            )}

            {/* STEP 4: REVIEW & SUBMIT */}
            {wizardStep === 4 && (
              <div className="space-y-4 text-xs">
                <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-2 font-sans">
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <span className="text-slate-400 block text-[10px]">Student Name</span>
                      <strong>{studentProfile.fullName || studentProfile.name}</strong>
                    </div>
                    <div>
                      <span className="text-slate-400 block text-[10px]">Student ID</span>
                      <strong className="font-mono text-[#588B76]">{studentProfile.studentId}</strong>
                    </div>
                    <div>
                      <span className="text-slate-400 block text-[10px]">Enrolling In</span>
                      <strong>{wizardProgram} ({wizardYearLevel})</strong>
                    </div>
                    <div>
                      <span className="text-slate-400 block text-[10px]">Total Course Load</span>
                      <strong className="font-mono">{selectedSubjects.length} Courses • {totalWizardUnits} Units</strong>
                    </div>
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-slate-700 font-semibold">Additional Remarks / Requests to Registrar</label>
                  <textarea
                    rows={2}
                    value={wizardNotes}
                    onChange={(e) => setWizardNotes(e.target.value)}
                    placeholder="Any special requests or scheduling notes..."
                    className="w-full p-2.5 border border-slate-300 rounded-lg"
                  />
                </div>
              </div>
            )}

            {/* Wizard Navigation Bar */}
            <div className="pt-4 border-t border-slate-200 flex items-center justify-between text-xs">
              {wizardStep > 1 ? (
                <button
                  type="button"
                  onClick={() => setWizardStep((prev) => prev - 1)}
                  className="px-4 py-2 rounded-lg border border-slate-300 text-slate-700 hover:bg-slate-100 flex items-center gap-1.5 cursor-pointer"
                >
                  <ChevronLeft className="w-4 h-4" />
                  <span>Back</span>
                </button>
              ) : (
                <button
                  type="button"
                  onClick={handleSaveDraft}
                  className="px-4 py-2 rounded-lg border border-slate-300 text-slate-700 hover:bg-slate-100 cursor-pointer"
                >
                  Save as Draft
                </button>
              )}

              {wizardStep < 4 ? (
                <button
                  type="button"
                  onClick={() => setWizardStep((prev) => prev + 1)}
                  className="bg-[#18392B] hover:bg-[#588B76] hover:text-[#18392B] text-white font-bold px-5 py-2.5 rounded-lg flex items-center gap-1.5 transition cursor-pointer"
                >
                  <span>Continue</span>
                  <ChevronRight className="w-4 h-4" />
                </button>
              ) : (
                <button
                  type="button"
                  onClick={handleSubmitEnrollment}
                  className="bg-emerald-700 hover:bg-emerald-800 text-white font-bold px-6 py-2.5 rounded-lg flex items-center gap-1.5 transition cursor-pointer shadow-md"
                >
                  <Send className="w-4 h-4" />
                  <span>Submit Enrollment Application</span>
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* --- MODAL 2: OFFICIAL CERTIFICATE OF REGISTRATION (COR) --- */}
      {isCORModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl max-w-3xl w-full max-h-[95vh] overflow-y-auto p-8 space-y-6 shadow-2xl border border-slate-300 print:p-0 print:border-none">
            {/* Header */}
            <div className="text-center space-y-2 border-b-2 border-[#18392B] pb-4">
              <div className="w-16 h-16 mx-auto flex items-center justify-center">
                <Emblem id="cor-emblem" size={56} />
              </div>
              <h2 className="font-serif text-xl font-extrabold text-[#18392B] tracking-wide uppercase">
                Philippine College of Ministry
              </h2>
              <p className="text-[11px] text-slate-600 font-serif">
                Bagabag, Nueva Vizcaya, Philippines • Office of the Registrar
              </p>
              <div className="inline-block bg-[#18392B] text-white px-4 py-1 rounded text-xs font-mono font-bold uppercase tracking-wider">
                Official Certificate of Registration (COR)
              </div>
            </div>

            {/* Student Meta Details */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 bg-slate-50 p-4 rounded-xl border border-slate-200 text-xs">
              <div>
                <span className="text-slate-400 block text-[10px]">Student ID No.</span>
                <strong className="font-mono text-[#18392B]">{studentProfile.studentId}</strong>
              </div>
              <div>
                <span className="text-slate-400 block text-[10px]">Student Full Name</span>
                <strong>{studentProfile.fullName || studentProfile.name}</strong>
              </div>
              <div>
                <span className="text-slate-400 block text-[10px]">Program / Degree</span>
                <strong>{studentProfile.degreeProgram || studentProfile.program}</strong>
              </div>
              <div>
                <span className="text-slate-400 block text-[10px]">Term & School Year</span>
                <strong>{studentProfile.currentSemester}</strong>
              </div>
            </div>

            {/* Subjects Table */}
            <div className="space-y-2">
              <h4 className="font-serif text-xs font-bold text-[#18392B] uppercase">Registered Course Enlistment</h4>
              <table className="w-full text-left text-xs border border-slate-300">
                <thead className="bg-[#18392B] text-white">
                  <tr>
                    <th className="p-2 border border-slate-300">Course Code</th>
                    <th className="p-2 border border-slate-300">Subject Description</th>
                    <th className="p-2 border border-slate-300">Units</th>
                    <th className="p-2 border border-slate-300">Schedule & Room</th>
                    <th className="p-2 border border-slate-300">Instructor</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-300">
                  {(studentProfile.courses || []).map((c) => (
                    <tr key={c.code || c.id}>
                      <td className="p-2 font-mono font-bold border border-slate-300">{c.code}</td>
                      <td className="p-2 font-medium border border-slate-300">{c.title}</td>
                      <td className="p-2 font-mono border border-slate-300">{c.units}</td>
                      <td className="p-2 border border-slate-300">{c.schedule} ({c.room})</td>
                      <td className="p-2 border border-slate-300">{c.instructor}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Signatures & Seal */}
            <div className="pt-6 grid grid-cols-2 gap-8 text-xs text-center border-t border-slate-200">
              <div className="space-y-6">
                <div className="h-10 border-b border-slate-400"></div>
                <span>Student Signature</span>
              </div>
              <div className="space-y-6">
                <div className="h-10 border-b border-slate-400 flex items-center justify-center font-serif font-bold text-[#18392B]">
                  Dr. Benjamin Villanueva
                </div>
                <span>College Registrar / Chancellor</span>
              </div>
            </div>

            {/* Print Action */}
            <div className="flex justify-end gap-2 pt-4 border-t border-slate-200 print:hidden">
              <button
                onClick={() => setIsCORModalOpen(false)}
                className="px-4 py-2 border border-slate-300 rounded-lg text-xs font-semibold hover:bg-slate-100"
              >
                Close
              </button>
              <button
                onClick={() => window.print()}
                className="bg-[#18392B] hover:bg-[#588B76] text-white font-bold px-4 py-2 rounded-lg text-xs flex items-center gap-1.5 cursor-pointer"
              >
                <Printer className="w-4 h-4" />
                <span>Print Document</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* --- MODAL 3: UPLOAD DOCUMENT MODAL --- */}
      {isDocModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 space-y-4 shadow-2xl border border-slate-200">
            <div className="flex items-center justify-between">
              <h3 className="font-serif text-lg font-bold text-[#18392B]">
                Upload Student Document
              </h3>
              <button onClick={() => setIsDocModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleDocumentUploadSubmit} className="space-y-3 text-xs">
              <div className="space-y-1">
                <label className="text-slate-600 font-semibold">Document Title</label>
                <input
                  type="text"
                  required
                  value={docName}
                  onChange={(e) => setDocName(e.target.value)}
                  placeholder="e.g. Official Transcript of Records (TOR)"
                  className="w-full p-2.5 border border-slate-300 rounded"
                />
              </div>

              <div className="space-y-1">
                <label className="text-slate-600 font-semibold">Document Category</label>
                <select
                  value={docType}
                  onChange={(e) => setDocType(e.target.value as any)}
                  className="w-full p-2.5 border border-slate-300 rounded bg-white"
                >
                  <option value="Form 138 / TOR">Form 138 / TOR</option>
                  <option value="Good Moral Certificate">Good Moral Certificate</option>
                  <option value="Pastoral Endorsement">Pastoral Endorsement</option>
                  <option value="2x2 Photo">2x2 ID Photo</option>
                  <option value="Baptismal Certificate">Baptismal Certificate</option>
                  <option value="Medical Clearance">Medical Clearance</option>
                </select>
              </div>

              <div className="p-4 border-2 border-dashed border-slate-300 rounded-xl text-center text-slate-500 space-y-2">
                <Upload className="w-6 h-6 mx-auto text-[#588B76]" />
                <p>Click to browse or drop document PDF / JPG</p>
                <span className="text-[10px] text-slate-400 block">Maximum file size: 10 MB</span>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsDocModalOpen(false)}
                  className="px-4 py-2 border border-slate-300 rounded-lg text-slate-600 font-semibold hover:bg-slate-100"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-[#18392B] hover:bg-[#588B76] hover:text-[#18392B] text-white font-bold rounded-lg transition"
                >
                  Upload & Verify
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
