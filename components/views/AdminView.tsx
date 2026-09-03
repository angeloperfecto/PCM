'use client';

import React, { useRef, useState, useEffect } from 'react';
import { usePCM } from '@/lib/store';
import { Emblem } from '@/components/common/Emblem';
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
import { AdminMediaTab } from '@/components/admin/AdminMediaTab';
import { AdminDownloadsTab } from '@/components/admin/AdminDownloadsTab';
import { AdminApplicationsTab } from '@/components/admin/AdminApplicationsTab';
import { AdminEnrollmentsTab } from '@/components/admin/AdminEnrollmentsTab';
import { AdminUsersTab } from '@/components/admin/AdminUsersTab';
import { AdminDonationsTab } from '@/components/admin/AdminDonationsTab';
import { ConfirmDeleteModal } from '@/components/common/ConfirmDeleteModal';
import {
  ShieldAlert,
  Lock,
} from 'lucide-react';

export const AdminView: React.FC = () => {
  const {
    isAdminAuthenticated,
    isStudentLoggedIn,
    adminLogin,
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
  const [loginUser, setLoginUser] = useState('admin');
  const [loginPass, setLoginPass] = useState('pcm2026');
  const [isGoogleSigningIn, setIsGoogleSigningIn] = useState(false);

  const [activeTab, setActiveTab] = useState<AdminTabType>(() =>
    activeSubSection === 'enrollments' ? 'enrollments' : 'overview'
  );
  const [prevSubSection, setPrevSubSection] = useState(activeSubSection);

  if (activeSubSection !== prevSubSection) {
    setPrevSubSection(activeSubSection);
    if (activeSubSection === 'enrollments') {
      setActiveTab('enrollments');
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
              onClick={() => navigateTo('portal')}
              className="w-full bg-[#588B76] hover:bg-[#85AA9B] text-[#18392B] font-bold py-2.5 px-4 rounded-xl transition cursor-pointer text-xs shadow-md"
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

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    const success = adminLogin(loginUser, loginPass);
    if (!success) {
      addToast({
        title: 'Authentication Failed',
        message: 'Invalid administrator username or password.',
        type: 'error',
      });
    }
  };

  const handleGoogleAdminLogin = async () => {
    // If student is currently active in session, forbid immediately
    if (currentUserAccount?.role === 'Student' || isStudentLoggedIn) {
      addToast({
        title: 'Access Prohibited',
        message: 'You are currently signed in as a Student. Student accounts are not permitted to access or register in the Admin Portal. Please sign out from your student session first.',
        type: 'error',
      });
      return;
    }

    setIsGoogleSigningIn(true);
    try {
      const res = await signInWithGoogle();
      if (res.success) {
        if (res.role === 'Student' || res.user?.role === 'Student') {
          addToast({
            title: 'Administrator Access Denied',
            message: 'Your Google/Gmail account is registered as a Student. Student accounts are strictly prohibited from signing in or registering in the Administrator CMS.',
            type: 'error',
          });
          navigateTo('portal');
        } else if (res.role === 'Admin') {
          addToast({
            title: 'Administrator Verified',
            message: 'Welcome to Philippine College of Ministry Institutional CMS Workspace.',
            type: 'success',
          });
        }
      } else {
        addToast({
          title: 'Google Login',
          message: 'Unable to authenticate with Google.',
          type: 'error',
        });
      }
    } finally {
      setIsGoogleSigningIn(false);
    }
  };

  // If Admin is NOT logged in -> Display Auth Gate
  if (!isAdminAuthenticated) {
    return (
      <div className="w-full min-h-[75vh] bg-[#070e1c] py-16 px-4 flex items-center justify-center font-sans">
        <div className="max-w-md w-full bg-[#18392B] rounded-2xl border border-slate-700 shadow-2xl p-8 space-y-6 text-white">
          <div className="text-center space-y-3">
            <div className="w-20 h-20 bg-white/10 p-2.5 rounded-2xl border border-[#588B76]/40 flex items-center justify-center mx-auto shadow-xl backdrop-blur-xs">
              <Emblem id="admin-login-pcm-logo" size={64} className="w-16 h-16 drop-shadow-md" />
            </div>
            <h2 className="font-serif text-2xl font-bold text-white">
              PCM Admin Content Management System
            </h2>
            <p className="text-xs text-slate-300">
              Institutional portal for Philippine College of Ministry administration, admissions officers, and content editors.
            </p>
          </div>

          {/* 1-Click Google Admin Sign In */}
          <div className="space-y-3">
            <button
              id="btn-admin-instant-enrollment-access"
              type="button"
              onClick={() => {
                adminLogin('admin', 'pcm2026');
                setActiveTab('enrollments');
              }}
              className="w-full bg-gradient-to-r from-amber-400 to-amber-500 hover:from-amber-300 hover:to-amber-400 text-slate-950 font-extrabold py-3 px-4 rounded-xl shadow-lg transition flex items-center justify-center gap-2 text-xs uppercase tracking-wider cursor-pointer"
            >
              <span>⚡ 1-Click Enter: Enrollment & Registrar Hub</span>
            </button>

            <button
              id="btn-admin-google-login"
              type="button"
              onClick={handleGoogleAdminLogin}
              disabled={isGoogleSigningIn}
              className="w-full bg-white hover:bg-slate-100 text-slate-900 font-semibold py-3 px-4 rounded-xl shadow-lg transition flex items-center justify-center gap-3 text-sm cursor-pointer disabled:opacity-50"
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
              <span className="text-[11px] text-slate-400 font-mono">OR USE CREDENTIALS</span>
              <div className="flex-1 h-px bg-slate-700"></div>
            </div>
          </div>

          <form onSubmit={handleLogin} className="space-y-4 text-xs">
            <div>
              <label className="block text-slate-300 font-bold mb-1">
                Admin Username
              </label>
              <input
                type="text"
                required
                value={loginUser}
                onChange={(e) => setLoginUser(e.target.value)}
                placeholder="Username (e.g. admin)"
                className="w-full p-3 rounded-lg border border-slate-700 bg-[#070e1c] text-white focus:border-[#588B76] text-sm focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-slate-300 font-bold mb-1">
                Security Password
              </label>
              <input
                type="password"
                required
                value={loginPass}
                onChange={(e) => setLoginPass(e.target.value)}
                placeholder="••••••••"
                className="w-full p-3 rounded-lg border border-slate-700 bg-[#070e1c] text-white focus:border-[#588B76] text-sm focus:outline-none"
              />
            </div>

            <button
              type="submit"
              className="w-full bg-[#588B76] hover:bg-[#85AA9B] text-[#18392B] font-bold py-3 rounded-lg text-xs uppercase tracking-wider transition cursor-pointer shadow-lg flex items-center justify-center gap-2"
            >
              <Lock className="w-4 h-4" />
              <span>Authenticate & Access CMS</span>
            </button>
          </form>

          <div className="bg-slate-900/90 p-3.5 rounded-xl border border-slate-800 text-[11px] text-slate-300 space-y-2">
            <div className="flex items-center justify-between">
              <span className="font-mono font-bold text-[#85AA9B]">Authorized Demo Accounts:</span>
              <button
                type="button"
                onClick={() => {
                  setLoginUser('admin');
                  setLoginPass('pcm2026');
                }}
                className="text-[10px] bg-[#588B76]/20 hover:bg-[#588B76]/30 text-[#85AA9B] px-2 py-0.5 rounded font-mono transition cursor-pointer"
              >
                Auto Fill
              </button>
            </div>
            <div className="grid grid-cols-2 gap-2 font-mono text-[11px]">
              <div className="bg-black/40 p-2 rounded border border-white/5">
                <span className="text-slate-400 block text-[10px]">Super Admin</span>
                <div>User: <code className="text-white font-bold">admin</code></div>
                <div>Pass: <code className="text-white font-bold">pcm2026</code></div>
              </div>
              <div className="bg-black/40 p-2 rounded border border-white/5">
                <span className="text-slate-400 block text-[10px]">Content Admin</span>
                <div>User: <code className="text-white font-bold">esantos</code></div>
                <div>Pass: <code className="text-white font-bold">pcm2026</code></div>
              </div>
            </div>
          </div>
        </div>
      </div>
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
            {activeTab === 'programs' && <AdminProgramsTab />}
            {activeTab === 'faculty' && <AdminFacultyTab />}
            {activeTab === 'news' && <AdminNewsTab />}
            {activeTab === 'events' && <AdminEventsTab />}
            {activeTab === 'announcements' && <AdminAnnouncementsTab />}
            {activeTab === 'media' && <AdminMediaTab />}
            {activeTab === 'downloads' && <AdminDownloadsTab />}
            {activeTab === 'applications' && <AdminApplicationsTab />}
            {activeTab === 'enrollments' && <AdminEnrollmentsTab />}
            {activeTab === 'donations' && <AdminDonationsTab />}
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
