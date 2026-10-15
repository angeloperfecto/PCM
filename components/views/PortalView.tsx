'use client';

import React, { useState } from 'react';
import { usePCM } from '@/lib/store';
import { StudentAvatar } from '@/components/common/StudentAvatar';
import { Emblem } from '@/components/common/Emblem';
import {
  OnlineEnrollment,
  StudentDocument,
} from '@/lib/types';
import { EnrollmentNavbar } from '@/components/portal/enrollment/EnrollmentNavbar';
import { StudentProfileModule } from '@/components/portal/enrollment/StudentProfileModule';
import { PreEnlistmentModule } from '@/components/portal/enrollment/PreEnlistmentModule';
import { ReEnrollmentWizard } from '@/components/portal/enrollment/ReEnrollmentWizard';
import { EnrollmentModule } from '@/components/portal/enrollment/EnrollmentModule';
import { AddDropModule } from '@/components/portal/enrollment/AddDropModule';
import { AssessmentModule } from '@/components/portal/enrollment/AssessmentModule';
import { AmountDueModule } from '@/components/portal/enrollment/AmountDueModule';
import { CurriculumModule } from '@/components/portal/enrollment/CurriculumModule';
import { CertificateOfRegistration, printCertificate } from '@/components/enrollment/CertificateOfRegistration';
import { PaymentInstructions } from '@/components/enrollment/PaymentInstructions';
import { MyApplicationPanel } from '@/components/enrollment/MyApplicationPanel';
import { AdmittedStudentPortal } from '@/components/portal/AdmittedStudentPortal';
import { ADMITTED_PORTAL_STATUSES, normalizeStatus } from '@/lib/enrollmentWorkflow';
import {
  StudentPortalSidebar,
  StudentPortalTabType,
} from '@/components/portal/StudentPortalSidebar';
import {
  GraduationCap,
  Calendar,
  Award,
  PhilippinePeso,
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
  Printer,
  X,
  Shield,
  HelpCircle,
  Sparkles,
  Info,
  Menu,
  ExternalLink,
} from 'lucide-react';

export const PortalView: React.FC = () => {
  const {
    isStudentLoggedIn,
    studentProfile,
    applications,
    students,
    firebaseAuthUser,
    signInWithGoogle,
    signOutUser,
    studentLogout,
    addPracticumEntry,
    enrollments,
    currentEnrollmentDraft,
    uploadStudentDocument,
    studentNotifications,
    markNotificationRead,
    markAllNotificationsRead,
    addToast,
    programs,
    navigateTo,
    enrollmentActiveSubTab,
    setEnrollmentActiveSubTab,
  } = usePCM();

  // Google sign-in for applicants and students
  const [isPortalSigningIn, setIsPortalSigningIn] = useState(false);
  const handlePortalSignIn = async () => {
    setIsPortalSigningIn(true);
    try {
      await signInWithGoogle();
    } finally {
      setIsPortalSigningIn(false);
    }
  };

  // Active Main Navigation Tab
  const [activeTab, setActiveTab] = useState<StudentPortalTabType>('enrollment');
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);

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

  // Document upload modal state
  const [isDocModalOpen, setIsDocModalOpen] = useState(false);
  const [docName, setDocName] = useState('');
  const [docType, setDocType] = useState<StudentDocument['type']>('Form 138 / TOR');

  // Certificate of Registration (COR) Modal
  const [isCORModalOpen, setIsCORModalOpen] = useState(false);

  // --- RE-ENROLLMENT WIZARD (returning students) ---
  const [isEnrollmentWizardOpen, setIsEnrollmentWizardOpen] = useState(false);

  // Active student's latest enrollment record
  // The student's most recent enrollment request (each term has its own).
  const latestEnrollment =
    enrollments
      .filter((e) => e.studentId === studentProfile.studentId || e.studentId === studentProfile.id || e.studentRecordId === studentProfile.id)
      .sort((a, b) => String(b.submittedAt || b.lastSavedAt || '').localeCompare(String(a.submittedAt || a.lastSavedAt || '')))[0] || currentEnrollmentDraft;

  // Unread notifications for current student
  const studentNotifs = studentNotifications.filter(
    (n) =>
      n.studentId === studentProfile.id ||
      n.studentId === studentProfile.studentId ||
      (!!firebaseAuthUser && n.recipientUid === firebaseAuthUser.uid)
  );
  const unreadNotifsCount = studentNotifs.filter((n) => !n.read).length;

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

  // --- NOT YET A LINKED STUDENT ---
  // Signed out: Google sign-in. Signed in without a student record: the applicant's own
  // application tracker (the Student Portal opens once the Registrar finalizes enrollment,
  // or immediately for existing students whose record email matches their Google account).
  if (!isStudentLoggedIn) {
    // Admitted applicants get the Student Portal (admitted view) until they are officially enrolled.
    const ownEmail = firebaseAuthUser?.emailVerified ? (firebaseAuthUser.email || '').toLowerCase() : '';
    const admittedApp = firebaseAuthUser
      ? applications.find(
          (a) =>
            (a.applicantUid === firebaseAuthUser.uid || (!!ownEmail && (a.email || '').toLowerCase() === ownEmail)) &&
            (ADMITTED_PORTAL_STATUSES.includes(normalizeStatus(a.status)) ||
              // Enrolled, but the new student record is not linked to this browser yet.
              normalizeStatus(a.status) === 'Enrolled')
        )
      : undefined;
    if (admittedApp) {
      return <AdmittedStudentPortal app={admittedApp} />;
    }
    if (firebaseAuthUser) {
      return (
        <div className="w-full min-h-[85vh] bg-slate-50 py-10 px-4 font-sans">
          <div className="max-w-4xl mx-auto space-y-5">
            <div className="flex flex-col gap-3 rounded-2xl bg-[#18392B] p-5 text-white sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h2 className="font-serif text-xl font-bold">MyPCM Student Portal</h2>
                <p className="text-xs text-slate-300">
                  Signed in as <strong>{firebaseAuthUser.email}</strong>. No enrolled student record is linked to this account yet.
                </p>
              </div>
              <button
                type="button"
                onClick={() => signOutUser()}
                className="self-start rounded-lg border border-white/30 px-3 py-1.5 text-xs font-semibold hover:bg-white/10 sm:self-auto"
              >
                Sign out
              </button>
            </div>
            <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-xs text-amber-950">
              <strong className="block text-[#18392B]">Already a PCM student?</strong>
              Sign in with the Google account whose email address is on file with the Registrar and your record will open
              automatically. If your email has changed, ask the Office of the Registrar to update it.
            </div>
            <MyApplicationPanel onStartApplication={() => navigateTo('apply')} />
          </div>
        </div>
      );
    }

    return (
      <div className="w-full min-h-[85vh] bg-[#070e1c] py-16 px-4 flex items-center justify-center font-sans">
        <div className="max-w-md w-full bg-[#18392B] rounded-2xl border border-slate-700 shadow-2xl p-8 space-y-6 text-white">
          <div className="text-center space-y-3">
            <div className="w-20 h-20 bg-white/10 p-2.5 rounded-2xl border border-[#588B76]/40 flex items-center justify-center mx-auto shadow-xl backdrop-blur-xs">
              <Emblem id="student-portal-pcm-logo" size={64} className="w-16 h-16 drop-shadow-md" />
            </div>
            <h2 className="font-serif text-2xl font-bold text-white">MyPCM Student Portal</h2>
            <p className="text-xs text-slate-300">
              Applicants and students sign in with their Google account to see their application, enrollment and records.
            </p>
          </div>

          <button
            type="button"
            onClick={handlePortalSignIn}
            disabled={isPortalSigningIn}
            className="w-full bg-white hover:bg-slate-100 text-slate-900 font-bold py-3.5 rounded-lg text-sm transition cursor-pointer shadow-lg flex items-center justify-center gap-2 disabled:opacity-50"
          >
            <Lock className="w-4 h-4 text-[#18392B]" />
            <span>{isPortalSigningIn ? 'Opening Google sign-in…' : 'Sign in with Google'}</span>
          </button>

          <div className="bg-black/20 border border-white/10 rounded-xl p-3.5 text-[11px] text-slate-300 space-y-1.5">
            <p className="flex items-start gap-1.5">
              <HelpCircle className="w-3.5 h-3.5 text-amber-300 shrink-0 mt-0.5" />
              <span>
                <strong className="text-white">Existing students:</strong> use the Google account with the email address on file at
                the Registrar. Your Student ID and records open automatically.
              </span>
            </p>
            <p className="flex items-start gap-1.5">
              <HelpCircle className="w-3.5 h-3.5 text-amber-300 shrink-0 mt-0.5" />
              <span>
                <strong className="text-white">Need help?</strong> Contact the Office of the Registrar at{' '}
                <span className="text-emerald-400 font-mono">registrar@pcm.edu.ph</span>.
              </span>
            </p>
          </div>

          <div className="pt-4 border-t border-slate-700/60 text-center space-y-2">
            <p className="text-[11px] text-slate-300">New applicant or incoming freshman?</p>
            <button
              type="button"
              onClick={() => navigateTo('apply')}
              className="w-full bg-white/10 hover:bg-white/20 text-white border border-[#588B76]/50 font-bold py-3 rounded-xl text-xs transition flex items-center justify-center gap-2 cursor-pointer shadow-sm"
            >
              <ExternalLink className="w-3.5 h-3.5 text-amber-300" />
              <span>PCM Admissions & Application Portal</span>
            </button>
          </div>
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

  // Enrolled comes from the student record (closing a term sets it to Not Enrolled until the next approval).
  const isEnrolled = studentProfile.enrollmentStatus === 'Enrolled';
  const isPendingEnrollment =
    studentProfile.enrollmentStatus === 'Submitted' ||
    ['Submitted', 'Under Review', 'For Verification', 'Pending Requirements'].includes(String(latestEnrollment?.status || ''));
  const isReturnedEnrollment = studentProfile.enrollmentStatus === 'Returned for Correction' || latestEnrollment?.status === 'Returned for Correction';

  return (
    <div className="w-full min-h-screen bg-slate-50 pb-24 font-sans">
      {/* Student Banner Header */}
      <div className="bg-[#18392B] text-white border-b border-[#588B76]/40 py-8 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="flex items-center gap-4">
            <StudentAvatar
              photo={studentProfile.avatarUrl}
              altPhoto={studentProfile.profilePhoto}
              name={studentProfile.fullName || studentProfile.name || 'Student'}
              className="w-16 h-16 rounded-full bg-[#588B76] text-[#18392B] font-serif font-black text-2xl shadow-lg border-2 border-amber-300"
            />
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
        {/* Mobile Portal Navigation Bar */}
        <div className="lg:hidden bg-white p-3 rounded-2xl border border-slate-200 shadow-xs flex items-center justify-between gap-3">
          <button
            type="button"
            id="btn-mobile-student-sidebar-toggle"
            onClick={() => setIsMobileSidebarOpen(true)}
            className="flex items-center gap-2 px-3.5 py-2 bg-[#18392B] text-white rounded-xl text-xs font-bold transition hover:bg-[#588B76] cursor-pointer shadow-xs"
          >
            <Menu className="w-4 h-4" />
            <span>Portal Menu</span>
            {unreadNotifsCount > 0 && (
              <span className="bg-amber-400 text-slate-950 text-[10px] font-black px-1.5 py-0.2 rounded-full">
                {unreadNotifsCount}
              </span>
            )}
          </button>

          <div className="text-right">
            <span className="text-[10px] font-mono text-slate-400 block uppercase">Active Section</span>
            <span className="text-xs font-bold text-slate-800">
              {activeTab === 'enrollment' && 'Online Enrollment Hub'}
              {activeTab === 'schedule' && 'Class Schedule'}
              {activeTab === 'grades' && 'Grades & Evaluation'}
              {activeTab === 'vault' && 'Document Vault'}
              {activeTab === 'financial' && 'Tuition & Billing'}
              {activeTab === 'practicum' && 'Practicum Log'}
              {activeTab === 'spiritual' && 'Mentorship & Church'}
              {activeTab === 'notifications' && 'Notifications'}
            </span>
          </div>
        </div>

        {/* Two-Column Sidebar + Content Layout */}
        <div className="flex flex-col lg:flex-row items-start gap-6">
          {/* Dedicated Student Portal Sidebar */}
          <StudentPortalSidebar
            activeTab={activeTab}
            setActiveTab={setActiveTab}
            enrollmentActiveSubTab={enrollmentActiveSubTab}
            setEnrollmentActiveSubTab={setEnrollmentActiveSubTab}
            studentProfile={studentProfile}
            isEnrolled={isEnrolled}
            isPendingEnrollment={isPendingEnrollment}
            isReturnedEnrollment={isReturnedEnrollment}
            unreadNotifsCount={unreadNotifsCount}
            totalPracticumHours={totalPracticumHours}
            remainingBalance={remainingBalance}
            onOpenCORModal={() => setIsCORModalOpen(true)}
            onOpenEnrollmentWizard={() => setIsEnrollmentWizardOpen(true)}
            studentLogout={studentLogout}
            isCollapsed={isSidebarCollapsed}
            setIsCollapsed={setIsSidebarCollapsed}
            isMobileOpen={isMobileSidebarOpen}
            setIsMobileOpen={setIsMobileSidebarOpen}
          />

          {/* Main Content Area */}
          <main className="flex-1 min-w-0 w-full space-y-6">
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

        {/* TAB 1: ENROLLMENT SECTION (6 SUBMENU MODULES) */}
        {activeTab === 'enrollment' && (
          <div className="space-y-6">
            {/* Enrollment Submenu Navigation Bar (Purple highlighted active state) */}
            <EnrollmentNavbar
              activeTab={enrollmentActiveSubTab}
              onTabChange={setEnrollmentActiveSubTab}
            />

            {/* Submenu Item 1: Student Profile */}
            {enrollmentActiveSubTab === 'profile' && <StudentProfileModule />}

            {/* Submenu Item 2: Pre-enlistment */}
            {enrollmentActiveSubTab === 'pre-enlistment' && <PreEnlistmentModule />}

            {/* Submenu Item 3: Enrollment */}
            {enrollmentActiveSubTab === 'enrollment' && (
              <EnrollmentModule
                onOpenWizard={() => setIsEnrollmentWizardOpen(true)}
                onOpenCORModal={() => setIsCORModalOpen(true)}
              />
            )}

            {/* Submenu Item 4: Adding & Dropping */}
            {enrollmentActiveSubTab === 'add-drop' && <AddDropModule />}

            {/* Submenu Item 5: Assessment */}
            {enrollmentActiveSubTab === 'assessment' && (
              <AssessmentModule
                onNavigateToAmountDue={() => setEnrollmentActiveSubTab('amount-due')}
              />
            )}

            {/* Submenu Item 6: Amount Due */}
            {enrollmentActiveSubTab === 'amount-due' && <AmountDueModule />}

            {/* Curriculum: subjects per year level */}
            {enrollmentActiveSubTab === 'curriculum' && <CurriculumModule />}
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
                <p className="text-xs text-slate-500">Grades appear once the Registrar finalizes and publishes your professor&apos;s grade sheet.</p>
              </div>
              {studentProfile.academicStatus && (
                <span className="text-xs font-mono font-bold text-[#18392B] bg-amber-100 px-3 py-1 rounded border border-amber-300">
                  {studentProfile.academicStatus}
                </span>
              )}
            </div>
            {(studentProfile.courses || []).length === 0 && (
              <p className="rounded-xl border border-slate-200 bg-white p-4 text-xs text-slate-600">No subjects for the current term.</p>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {(studentProfile.courses || []).map((c) => (
                <div key={c.id || c.code} className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="font-mono text-xs font-bold text-[#588B76]">{c.code}</span>
                    <span className={`font-mono font-extrabold px-2 py-0.5 rounded ${c.finalGrade ? 'text-base text-[#18392B] bg-slate-100' : 'text-[11px] text-slate-500 bg-slate-50'}`}>
                      {c.finalGrade || 'Not yet released'}
                    </span>
                  </div>
                  <h4 className="font-serif text-sm font-bold text-[#18392B]">{c.title}</h4>
                  <div className="pt-2 border-t border-slate-100 flex justify-between text-xs text-slate-500 font-mono">
                    <span>Units: {c.units}</span>
                    <span className={c.finalGrade ? 'text-emerald-700 font-bold' : 'text-slate-500'}>
                      {c.finalGrade ? `${c.gradeRemark || c.status}${c.gradeStatus === 'Published' ? ' • Published' : ''}` : 'Pending'}
                    </span>
                  </div>
                </div>
              ))}
            </div>

            {(studentProfile.subjectHistory || []).length > 0 && (
              <div className="bg-white rounded-xl border border-slate-200 shadow-xs p-5 space-y-2">
                <h4 className="font-serif text-base font-bold text-[#18392B]">Academic history</h4>
                <div className="overflow-x-auto">
                  <table className="w-full min-w-[560px] text-left text-xs">
                    <thead className="bg-slate-50 text-[10px] uppercase text-slate-500">
                      <tr><th className="p-2">Term</th><th className="p-2">Code</th><th className="p-2">Subject</th><th className="p-2">Units</th><th className="p-2">Grade</th><th className="p-2">Status</th></tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {[...(studentProfile.subjectHistory || [])]
                        .sort((a, b) => String(b.academicYear).localeCompare(String(a.academicYear)) || String(b.semester).localeCompare(String(a.semester)))
                        .map((h, i) => (
                          <tr key={`${h.code}-${i}`}>
                            <td className="p-2 text-slate-600">{h.semester}, AY {h.academicYear}</td>
                            <td className="p-2 font-mono font-bold text-[#18392B]">{h.code}</td>
                            <td className="p-2">{h.title}</td>
                            <td className="p-2 font-mono">{h.units}</td>
                            <td className="p-2 font-mono font-bold">{h.grade !== '' && h.grade != null ? String(h.grade) : '—'}</td>
                            <td className="p-2">{h.status}</td>
                          </tr>
                        ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
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
        {/* Tuition & Billing: the same statement of account and payment reporting as Amount Due */}
        {activeTab === 'financial' && <AmountDueModule />}

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
                type="button"
                id="portal-mark-all-read-btn"
                onClick={() => {
                  markAllNotificationsRead(studentProfile.studentId || studentProfile.id);
                  addToast('info', 'Notifications Marked Read', 'All student notifications and bulletins have been marked as read.');
                }}
                disabled={unreadNotifsCount === 0}
                className={`text-xs font-semibold transition ${
                  unreadNotifsCount === 0
                    ? 'text-slate-400 cursor-default opacity-60'
                    : 'text-[#588B76] hover:text-[#18392B] hover:underline cursor-pointer'
                }`}
                title={unreadNotifsCount === 0 ? 'All notifications are already read' : 'Mark all notifications as read'}
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
                    id={`student-notif-${n.id}`}
                    onClick={() => {
                      if (!n.read) {
                        markNotificationRead(n.id);
                      }
                    }}
                    className={`p-4 rounded-xl border text-xs space-y-1 transition cursor-pointer ${
                      n.read
                        ? 'bg-white border-slate-200 text-slate-600'
                        : 'bg-amber-50/80 border-amber-200 text-amber-950 font-medium shadow-xs hover:border-amber-300'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        {!n.read && (
                          <span className="w-2 h-2 rounded-full bg-amber-500 inline-block" title="Unread Notice" />
                        )}
                        <span className="font-bold font-serif text-slate-900">{n.title}</span>
                      </div>
                      <span className="font-mono text-[10px] text-slate-400">{n.createdAt?.split('T')[0]}</span>
                    </div>
                    <p>{n.message}</p>
                  </div>
                ))
              )}
            </div>
          </div>
        )}
          </main>
        </div>
      </div>

      {/* --- MODAL 1: ONLINE ENROLLMENT WIZARD --- */}
      {isEnrollmentWizardOpen && (
        <ReEnrollmentWizard
          onClose={() => setIsEnrollmentWizardOpen(false)}
          onSubmitted={() => {
            setActiveTab('enrollment');
            setEnrollmentActiveSubTab('enrollment');
          }}
        />
      )}

      {/* --- MODAL 2: OFFICIAL CERTIFICATE OF REGISTRATION (COR) --- */}
      {isCORModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-xs flex items-center justify-center p-2 sm:p-4 overflow-y-auto">
          <div className="bg-slate-100 rounded-2xl max-w-[880px] w-full max-h-[95vh] overflow-y-auto overflow-x-hidden p-3 sm:p-5 space-y-4 shadow-2xl border border-slate-300">
            <CertificateOfRegistration student={studentProfile} />
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
