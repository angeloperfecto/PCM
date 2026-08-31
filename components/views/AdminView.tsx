'use client';

import React, { useState } from 'react';
import { usePCM } from '@/lib/store';
import { Emblem } from '@/components/common/Emblem';
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
import { AdminUsersTab } from '@/components/admin/AdminUsersTab';
import {
  LayoutDashboard,
  Building,
  Sparkles,
  BookOpen,
  Users,
  Megaphone,
  Calendar,
  Bell,
  Image as ImageIcon,
  Download,
  FileCheck,
  ShieldCheck,
  Lock,
} from 'lucide-react';

export const AdminView: React.FC = () => {
  const {
    isAdminAuthenticated,
    adminLogin,
    signInWithGoogle,
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
    addToast,
  } = usePCM();

  const [loginUser, setLoginUser] = useState('admin');
  const [loginPass, setLoginPass] = useState('pcm2026');
  const [isGoogleSigningIn, setIsGoogleSigningIn] = useState(false);

  const [activeTab, setActiveTab] = useState<
    | 'overview'
    | 'siteConfig'
    | 'hero'
    | 'programs'
    | 'faculty'
    | 'news'
    | 'events'
    | 'announcements'
    | 'media'
    | 'downloads'
    | 'applications'
    | 'users'
  >('overview');

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
    setIsGoogleSigningIn(true);
    try {
      const res = await signInWithGoogle();
      if (!res.success) {
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

  // Navigation tabs definition with badges
  const navTabs = [
    { id: 'overview', label: 'Dashboard Overview', icon: LayoutDashboard },
    { id: 'siteConfig', label: 'Site Identity & SEO', icon: Building },
    { id: 'hero', label: 'Hero Slideshow', icon: Sparkles },
    { id: 'programs', label: 'Academic Programs', icon: BookOpen, count: programs.length },
    { id: 'faculty', label: 'Faculty & Trustees', icon: Users, count: faculty.length },
    { id: 'news', label: 'News & Articles', icon: Megaphone, count: news.length },
    { id: 'events', label: 'Calendar Events', icon: Calendar, count: events.length },
    { id: 'announcements', label: 'Ticker Notices', icon: Bell, count: announcements.filter(a => a.active).length },
    { id: 'media', label: 'Media Library', icon: ImageIcon, count: mediaLibrary.length },
    { id: 'downloads', label: 'Download Center', icon: Download, count: downloads.length },
    { id: 'applications', label: 'Admissions Review', icon: FileCheck, count: applications.length, highlight: true },
    { id: 'users', label: 'Users & Roles', icon: ShieldCheck },
  ];

  return (
    <div className="w-full min-h-screen bg-slate-50 font-sans pb-24">
      {/* Top Controls Header */}
      <AdminHeader />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-6 space-y-6">
        {/* Navigation Tabs Bar */}
        <div className="bg-white p-2 rounded-2xl border border-slate-200 shadow-xs flex items-center gap-1.5 overflow-x-auto text-xs font-bold scrollbar-none">
          {navTabs.map((t) => {
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
                <Icon
                  className={`w-4 h-4 ${
                    isActive ? 'text-[#85AA9B]' : 'text-slate-400'
                  }`}
                />
                <span>{t.label}</span>
                {t.count !== undefined && (
                  <span
                    className={`text-[10px] px-1.5 py-0.2 rounded-full font-mono ${
                      isActive
                        ? 'bg-white/20 text-white'
                        : t.highlight
                        ? 'bg-amber-100 text-amber-800'
                        : 'bg-slate-200 text-slate-700'
                    }`}
                  >
                    {t.count}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* Tab Content Rendering */}
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
          {activeTab === 'users' && <AdminUsersTab />}
        </div>
      </div>
    </div>
  );
};
