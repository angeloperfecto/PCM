'use client';

import React, { useRef, useState, useEffect } from 'react';
import { usePCM } from '@/lib/store';
import { SignInScreen } from '@/components/common/SignInScreen';
import { AdminSidebar, AdminTabType } from '@/components/admin/AdminSidebar';
import { AdminHeader } from '@/components/admin/AdminHeader';
import { AdminOverviewTab } from '@/components/admin/AdminOverviewTab';
import { AdminSiteConfigTab } from '@/components/admin/AdminSiteConfigTab';
import { AdminHeroTab } from '@/components/admin/AdminHeroTab';
import { AdminProgramsTab } from '@/components/admin/AdminProgramsTab';
import { AdminFacultyTab } from '@/components/admin/AdminFacultyTab';
import { AdminNewsTab } from '@/components/admin/AdminNewsTab';
import { AdminEventsTab } from '@/components/admin/AdminEventsTab';
import { AdminAnnouncementsTab } from '@/components/admin/AdminAnnouncementsTab';
import { AdminTestimonialsTab } from '@/components/admin/AdminTestimonialsTab';
import { AdminAdmissionDirectoryTab } from '@/components/admin/AdminAdmissionDirectoryTab';
import { AdminGradesTab } from '@/components/admin/AdminGradesTab';
import { AdminMediaTab } from '@/components/admin/AdminMediaTab';
import { AdminDownloadsTab } from '@/components/admin/AdminDownloadsTab';
import { AdminYouTubeTab } from '@/components/admin/AdminYouTubeTab';
import { AdminApplicationsTab } from '@/components/admin/AdminApplicationsTab';
import { AdminEnrollmentsTab } from '@/components/admin/AdminEnrollmentsTab';
import { AdminUsersTab } from '@/components/admin/AdminUsersTab';
import { AdminDonationsTab } from '@/components/admin/AdminDonationsTab';
import { AdminStudentLifeTab } from '@/components/admin/AdminStudentLifeTab';
import { AdminLifeAtPCMManager } from '@/components/admin/AdminLifeAtPCMManager';
import { AdminScrapbookTab } from '@/components/admin/AdminScrapbookTab';
import { ConfirmDeleteModal } from '@/components/common/ConfirmDeleteModal';
import {
  ClipboardCheck,
  GraduationCap,
  LayoutTemplate,
  ShieldAlert,
} from 'lucide-react';

export const AdminView: React.FC = () => {
  const {
    isAdminAuthenticated,
    isStudentLoggedIn,
    signInWithGoogle,
    signOutUser,
    navigateTo,
    activeSubSection,
    currentUserAccount,
    firebaseAuthUser,
    applications,
    announcements,
    programs,
    faculty,
    news,
    events,
    downloads,
    mediaLibrary,
    donations,
    enrollments,
    exportDatabaseJson,
    importDatabaseJson,
    resetToInitialData,
    addToast,
  } = usePCM();

  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [showResetConfirm, setShowResetConfirm] = useState(false);
  const [isGoogleSigningIn, setIsGoogleSigningIn] = useState(false);

  const VALID_ADMIN_TABS: AdminTabType[] = [
    'overview',
    'siteConfig',
    'hero',
    'lifeAtPcm',
    'programs',
    'faculty',
    'news',
    'events',
    'announcements',
    'testimonials',
    'studentLife',
    'scrapbook',
    'media',
    'downloads',
    'youtube',
    'applications',
    'admissionDirectory',
    'grades',
    'enrollments',
    'donations',
    'users',
  ];

  const [activeTab, setActiveTab] = useState<AdminTabType>(() => {
    if (activeSubSection && VALID_ADMIN_TABS.includes(activeSubSection as AdminTabType)) {
      return activeSubSection as AdminTabType;
    }
    return 'overview';
  });
  const [prevSubSection, setPrevSubSection] = useState(activeSubSection);

  if (activeSubSection !== prevSubSection) {
    setPrevSubSection(activeSubSection);
    if (activeSubSection && VALID_ADMIN_TABS.includes(activeSubSection as AdminTabType)) {
      setActiveTab(activeSubSection as AdminTabType);
    }
  }
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);

  const handleExportDB = () => {
    const json = exportDatabaseJson();
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `pcm-backup-${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
    addToast({
      title: 'Database Exported',
      message: 'Full institutional dataset downloaded to your device.',
      type: 'success',
    });
  };

  const handleImportClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      if (content) {
        importDatabaseJson(content);
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  const handleResetClick = () => {
    setShowResetConfirm(true);
  };

  const handleGoogleAdminLogin = async () => {
    setIsGoogleSigningIn(true);
    try {
      // signInWithGoogle shows its own success / pending / error messages.
      await signInWithGoogle('Admin');
    } finally {
      setIsGoogleSigningIn(false);
    }
  };

  // Strict RBAC gate: Student accounts are completely restricted from Admin section
  const isStudentUser =
    currentUserAccount?.role === 'Student' ||
    (isStudentLoggedIn && !isAdminAuthenticated && currentUserAccount?.role !== 'Admin');

  if (isStudentUser) {
    return (
      <div className="w-full min-h-[75vh] bg-[#070e1c] py-16 px-4 flex items-center justify-center font-sans">
        <div className="max-w-md w-full bg-[#18392B] rounded-2xl border border-red-500/30 shadow-2xl p-8 space-y-6 text-white text-center">
          <div className="w-16 h-16 bg-red-500/10 border border-red-500/30 rounded-2xl flex items-center justify-center mx-auto text-red-400">
            <ShieldAlert className="w-8 h-8" />
          </div>
          <div className="space-y-2">
            <h2 className="font-serif text-2xl font-bold text-white">
              Access Restricted
            </h2>
            <p className="text-xs text-slate-300">
              Student accounts are not authorized to access the PCM Administrator CMS or view administrator user directories.
            </p>
          </div>
          <div className="p-4 rounded-xl bg-black/30 border border-white/10 text-xs text-left space-y-1.5 font-sans">
            <div className="text-slate-400 text-[11px]">Active Signed-In Account:</div>
            <div className="font-bold text-emerald-400 truncate">{currentUserAccount?.name || 'PCM Student'}</div>
            <div className="text-slate-300 truncate text-[11px]">{currentUserAccount?.email}</div>
            <div className="inline-block mt-1 px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 text-[10px] font-semibold">
              Role: Student
            </div>
          </div>
          <div className="space-y-2.5 pt-2">
            <button
              onClick={handleGoogleAdminLogin}
              disabled={isGoogleSigningIn}
              className="w-full bg-gradient-to-r from-emerald-500 to-[#588B76] hover:from-emerald-400 hover:to-[#46705F] text-white font-bold py-2.5 px-4 rounded-xl transition cursor-pointer text-xs shadow-md flex items-center justify-center gap-2"
            >
              <span>{isGoogleSigningIn ? 'Authenticating...' : 'Sign in with an Administrator Google Account'}</span>
            </button>
            <button
              onClick={() => navigateTo('portal')}
              className="w-full bg-[#10261D] hover:bg-[#18392B] border border-emerald-500/30 text-emerald-300 font-bold py-2.5 px-4 rounded-xl transition cursor-pointer text-xs shadow-md"
            >
              Go to MyPCM Student Portal
            </button>
            <button
              onClick={() => {
                signOutUser();
                navigateTo('home');
              }}
              className="w-full bg-transparent hover:bg-white/10 border border-white/20 text-slate-300 hover:text-white py-2 px-4 rounded-xl transition cursor-pointer text-xs"
            >
              Sign Out & Switch Account
            </button>
          </div>
        </div>
      </div>
    );
  }

  // If Admin is NOT logged in -> Display Auth Gate
  if (!isAdminAuthenticated) {
    return (
      <SignInScreen
        emblemId="admin-login-pcm-logo"
        eyebrow="Administration"
        title="PCM Admin Content Management System"
        subtitle="Institutional portal for Philippine College of Ministry administration, admissions officers, and content editors."
        features={[
          { icon: LayoutTemplate, title: 'Website content', text: 'Pages, news, events, media and announcements.' },
          { icon: GraduationCap, title: 'Admissions & enrollment', text: 'Applications, academic terms, subjects and student records.' },
          { icon: ClipboardCheck, title: 'Grades', text: 'Review, approve and publish grade sheets.' },
        ]}
        heading="Administrator sign-in"
        description="Use the Google account registered for you in the admin directory. What you can open depends on your role."
        buttonId="btn-admin-google-login"
        buttonLabel="Sign in with Google / Gmail"
        busyLabel="Authenticating with Google…"
        busy={isGoogleSigningIn}
        onSignIn={handleGoogleAdminLogin}
        notes={
          <p>
            <strong className="text-slate-800">No access yet?</strong> Ask a Super Admin to add your Google email in Admin → Users &amp; Roles.
          </p>
        }
      />
    );
  }

  return (
    <div className="w-full min-h-screen bg-slate-100 font-sans flex">
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileChange}
        accept=".json"
        className="hidden"
      />

      {/* Modern Vertical Sidebar */}
      <AdminSidebar
        activeTab={activeTab}
        setActiveTab={(tab) => setActiveTab(tab)}
        isCollapsed={isSidebarCollapsed}
        setIsCollapsed={setIsSidebarCollapsed}
        isMobileOpen={isMobileSidebarOpen}
        setIsMobileOpen={setIsMobileSidebarOpen}
        onExportDB={handleExportDB}
        onImportClick={handleImportClick}
        onResetClick={handleResetClick}
      />

      {/* Main Content Workspace */}
      <div
        className={`flex-1 flex flex-col min-w-0 transition-all duration-300 ${
          isSidebarCollapsed ? 'lg:pl-20' : 'lg:pl-72'
        }`}
      >
        {/* Top Header Bar */}
        <AdminHeader
          activeTab={activeTab}
          setActiveTab={(tab) => setActiveTab(tab)}
          isCollapsed={isSidebarCollapsed}
          setIsCollapsed={setIsSidebarCollapsed}
          isMobileOpen={isMobileSidebarOpen}
          setIsMobileOpen={setIsMobileSidebarOpen}
          onExportDB={handleExportDB}
          onImportClick={handleImportClick}
          onResetClick={handleResetClick}
        />

        {/* Tab Content Canvas */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-[1600px] w-full mx-auto pb-24">
          <div className="transition-all duration-150">
            {activeTab === 'overview' && <AdminOverviewTab onSelectTab={(tab) => setActiveTab(tab as any)} />}
            {activeTab === 'siteConfig' && <AdminSiteConfigTab />}
            {activeTab === 'hero' && <AdminHeroTab />}
            {activeTab === 'lifeAtPcm' && <AdminLifeAtPCMManager />}
            {activeTab === 'programs' && <AdminProgramsTab />}
            {activeTab === 'faculty' && <AdminFacultyTab />}
            {activeTab === 'news' && <AdminNewsTab />}
            {activeTab === 'events' && <AdminEventsTab />}
            {activeTab === 'announcements' && <AdminAnnouncementsTab />}
            {activeTab === 'testimonials' && <AdminTestimonialsTab />}
            {activeTab === 'media' && <AdminMediaTab />}
            {activeTab === 'downloads' && <AdminDownloadsTab />}
            {activeTab === 'youtube' && <AdminYouTubeTab />}
            {activeTab === 'applications' && <AdminApplicationsTab onOpenEnrollment={() => setActiveTab('enrollments')} />}
            {activeTab === 'admissionDirectory' && <AdminAdmissionDirectoryTab />}
            {activeTab === 'grades' && <AdminGradesTab />}
            {activeTab === 'enrollments' && <AdminEnrollmentsTab onOpenAdmissions={() => setActiveTab('applications')} />}
            {activeTab === 'donations' && <AdminDonationsTab />}
            {activeTab === 'studentLife' && <AdminStudentLifeTab />}
            {activeTab === 'scrapbook' && <AdminScrapbookTab />}
            {activeTab === 'users' && <AdminUsersTab />}
          </div>
        </main>
      </div>

      {/* Database Reset Baseline Modal */}
      <ConfirmDeleteModal
        isOpen={showResetConfirm}
        title="Reset Baseline Database"
        itemName="All Philippine College of Ministry CMS Records"
        message="Are you sure you want to reset all CMS content, news, events, faculty profiles, and configurations to the original Philippine College of Ministry baseline?"
        confirmLabel="Reset to Baseline"
        onConfirm={() => {
          resetToInitialData();
          setShowResetConfirm(false);
        }}
        onCancel={() => setShowResetConfirm(false)}
      />
    </div>
  );
};
