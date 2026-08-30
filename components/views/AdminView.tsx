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

          <div className="bg-slate-900/80 p-3 rounded-lg border border-slate-800 text-[11px] text-slate-300 text-center space-y-1">
            <div className="font-mono text-[#85AA9B]">Default Super Admin Credentials:</div>
            <div>Username: <code className="text-white font-bold">admin</code> | Password: <code className="text-white font-bold">pcm2026</code></div>
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
