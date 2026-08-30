'use client';

import React, { useState } from 'react';
import { usePCM } from '@/lib/store';
import {
  FileCheck,
  Megaphone,
  BookOpen,
  Users,
  Calendar,
  Image as ImageIcon,
  Shield,
  Download,
  Clock,
  Plus,
  ArrowRight,
  Search,
  CheckCircle2,
  AlertCircle,
  Eye,
  TrendingUp,
  Sparkles,
} from 'lucide-react';

interface AdminOverviewTabProps {
  onSelectTab: (tab: string) => void;
  onOpenCreateModal?: (type: string) => void;
}

export const AdminOverviewTab: React.FC<AdminOverviewTabProps> = ({
  onSelectTab,
  onOpenCreateModal,
}) => {
  const {
    applications,
    announcements,
    programs,
    faculty,
    news,
    events,
    mediaLibrary,
    activityLogs,
    currentAdminUser,
    stats,
  } = usePCM();

  const [logFilter, setLogFilter] = useState('all');
  const [logSearch, setLogSearch] = useState('');

  const pendingApps = applications.filter(
    (a) => a.status === 'Submitted' || a.status === 'Under Review'
  ).length;
  const acceptedApps = applications.filter((a) => a.status === 'Accepted' || a.status === 'Enrolled').length;

  const filteredLogs = activityLogs.filter((log) => {
    const entity = log.entity || log.entityType || '';
    const details = log.details || log.description || '';
    const userName = log.userName || log.adminName || 'Admin';

    const matchesFilter =
      logFilter === 'all' ||
      (logFilter === 'admissions' && (entity === 'Application' || entity === 'Admissions Application')) ||
      (logFilter === 'content' &&
        ['News', 'Event', 'Announcement', 'Program', 'Faculty', 'HeroSlide'].includes(
          entity
        )) ||
      (logFilter === 'media' && entity === 'MediaItem') ||
      (logFilter === 'system' && ['SiteConfig', 'AdminUser', 'Settings'].includes(entity));

    const matchesSearch =
      !logSearch ||
      log.action.toLowerCase().includes(logSearch.toLowerCase()) ||
      details.toLowerCase().includes(logSearch.toLowerCase()) ||
      userName.toLowerCase().includes(logSearch.toLowerCase()) ||
      entity.toLowerCase().includes(logSearch.toLowerCase());

    return matchesFilter && matchesSearch;
  });

  return (
    <div className="space-y-8">
      {/* 1. Live CMS Metric Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3.5">
        <div
          onClick={() => onSelectTab('applications')}
          className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs hover:border-[#588B76] hover:shadow-md transition cursor-pointer group"
        >
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-600">Applications</span>
            <FileCheck className="w-4 h-4 text-[#588B76] group-hover:scale-110 transition-transform" />
          </div>
          <div className="text-2xl font-serif font-bold text-[#18392B]">{applications.length}</div>
          <div className="text-[11px] text-amber-600 font-medium mt-1 flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" />
            {pendingApps} require review
          </div>
        </div>

        <div
          onClick={() => onSelectTab('programs')}
          className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs hover:border-[#588B76] hover:shadow-md transition cursor-pointer group"
        >
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-600">Programs</span>
            <BookOpen className="w-4 h-4 text-[#588B76] group-hover:scale-110 transition-transform" />
          </div>
          <div className="text-2xl font-serif font-bold text-[#18392B]">{programs.length}</div>
          <div className="text-[11px] text-[#588B76] font-medium mt-1">
            {programs.filter((p) => p.featured).length} Featured on Home
          </div>
        </div>

        <div
          onClick={() => onSelectTab('faculty')}
          className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs hover:border-[#588B76] hover:shadow-md transition cursor-pointer group"
        >
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-600">Faculty & Staff</span>
            <Users className="w-4 h-4 text-[#588B76] group-hover:scale-110 transition-transform" />
          </div>
          <div className="text-2xl font-serif font-bold text-[#18392B]">{faculty.length}</div>
          <div className="text-[11px] text-slate-500 font-medium mt-1">
            Board & Academic Staff
          </div>
        </div>

        <div
          onClick={() => onSelectTab('news')}
          className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs hover:border-[#588B76] hover:shadow-md transition cursor-pointer group"
        >
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-600">News Articles</span>
            <Megaphone className="w-4 h-4 text-[#588B76] group-hover:scale-110 transition-transform" />
          </div>
          <div className="text-2xl font-serif font-bold text-[#18392B]">{news.length}</div>
          <div className="text-[11px] text-[#588B76] font-medium mt-1">
            {news.filter((n) => n.published !== false).length} Published Live
          </div>
        </div>

        <div
          onClick={() => onSelectTab('events')}
          className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs hover:border-[#588B76] hover:shadow-md transition cursor-pointer group"
        >
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-600">Calendar Events</span>
            <Calendar className="w-4 h-4 text-[#588B76] group-hover:scale-110 transition-transform" />
          </div>
          <div className="text-2xl font-serif font-bold text-[#18392B]">{events.length}</div>
          <div className="text-[11px] text-slate-500 font-medium mt-1">
            Academic AY 2026–2027
          </div>
        </div>

        <div
          onClick={() => onSelectTab('media')}
          className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs hover:border-[#588B76] hover:shadow-md transition cursor-pointer group"
        >
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-600">Media Assets</span>
            <ImageIcon className="w-4 h-4 text-[#588B76] group-hover:scale-110 transition-transform" />
          </div>
          <div className="text-2xl font-serif font-bold text-[#18392B]">{mediaLibrary.length}</div>
          <div className="text-[11px] text-slate-500 font-medium mt-1">
            Photos & Documents
          </div>
        </div>
      </div>

      {/* 2. Quick Action Launcher */}
      <div className="bg-[#18392B] text-white p-6 rounded-2xl shadow-md border border-[#588B76]/30">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 mb-4">
          <div>
            <h3 className="font-serif text-lg font-bold text-white flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-[#85AA9B]" />
              Quick CMS Operations
            </h3>
            <p className="text-xs text-[#D0DED8]">
              Instantly create content, update site settings, or review pending student admissions.
            </p>
          </div>
          <span className="text-[11px] font-mono text-[#85AA9B] bg-[#10261D] px-2.5 py-1 rounded-sm border border-[#588B76]/40">
            Real-time synchronization enabled
          </span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2.5">
          <button
            onClick={() => onOpenCreateModal ? onOpenCreateModal('news') : onSelectTab('news')}
            className="flex items-center gap-2 bg-[#588B76] hover:bg-[#46705F] text-white p-3 rounded-lg text-xs font-bold transition cursor-pointer shadow-xs justify-center"
          >
            <Plus className="w-4 h-4 shrink-0" />
            <span>+ New Article</span>
          </button>

          <button
            onClick={() => onOpenCreateModal ? onOpenCreateModal('announcement') : onSelectTab('announcements')}
            className="flex items-center gap-2 bg-[#588B76]/80 hover:bg-[#588B76] text-white p-3 rounded-lg text-xs font-bold transition cursor-pointer shadow-xs justify-center"
          >
            <Plus className="w-4 h-4 shrink-0" />
            <span>+ Announcement</span>
          </button>

          <button
            onClick={() => onOpenCreateModal ? onOpenCreateModal('faculty') : onSelectTab('faculty')}
            className="flex items-center gap-2 bg-[#588B76]/80 hover:bg-[#588B76] text-white p-3 rounded-lg text-xs font-bold transition cursor-pointer shadow-xs justify-center"
          >
            <Plus className="w-4 h-4 shrink-0" />
            <span>+ Faculty Member</span>
          </button>

          <button
            onClick={() => onOpenCreateModal ? onOpenCreateModal('program') : onSelectTab('programs')}
            className="flex items-center gap-2 bg-[#588B76]/80 hover:bg-[#588B76] text-white p-3 rounded-lg text-xs font-bold transition cursor-pointer shadow-xs justify-center"
          >
            <Plus className="w-4 h-4 shrink-0" />
            <span>+ Academic Degree</span>
          </button>

          <button
            onClick={() => onOpenCreateModal ? onOpenCreateModal('event') : onSelectTab('events')}
            className="flex items-center gap-2 bg-[#588B76]/80 hover:bg-[#588B76] text-white p-3 rounded-lg text-xs font-bold transition cursor-pointer shadow-xs justify-center"
          >
            <Plus className="w-4 h-4 shrink-0" />
            <span>+ Calendar Event</span>
          </button>

          <button
            onClick={() => onOpenCreateModal ? onOpenCreateModal('media') : onSelectTab('media')}
            className="flex items-center gap-2 bg-[#10261D] hover:bg-[#0A1812] text-[#85AA9B] hover:text-white p-3 rounded-lg text-xs font-bold transition border border-[#588B76]/40 cursor-pointer justify-center"
          >
            <ImageIcon className="w-4 h-4 shrink-0" />
            <span>+ Upload Media</span>
          </button>
        </div>
      </div>

      {/* 3. Activity Audit Trail & System Health */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Activity Logs (2 cols) */}
        <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-200 shadow-xs p-6 space-y-4">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-b border-slate-100 pb-4">
            <div>
              <h3 className="font-serif text-base font-bold text-[#18392B] flex items-center gap-2">
                <Clock className="w-4 h-4 text-[#588B76]" />
                CMS Activity Audit Trail
              </h3>
              <p className="text-xs text-slate-500">
                Chronological log of all additions, edits, removals, and status changes.
              </p>
            </div>

            {/* Filter Tabs */}
            <div className="flex items-center gap-1.5 text-xs bg-slate-100 p-1 rounded-lg">
              {['all', 'admissions', 'content', 'media', 'system'].map((f) => (
                <button
                  key={f}
                  onClick={() => setLogFilter(f)}
                  className={`px-2.5 py-1 rounded-md capitalize font-medium transition cursor-pointer ${
                    logFilter === f
                      ? 'bg-white text-[#18392B] font-bold shadow-xs'
                      : 'text-slate-500 hover:text-slate-900'
                  }`}
                >
                  {f}
                </button>
              ))}
            </div>
          </div>

          {/* Search box for logs */}
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              placeholder="Search audit trail by user, action, or details..."
              value={logSearch}
              onChange={(e) => setLogSearch(e.target.value)}
              className="w-full pl-9 pr-3 py-2 text-xs rounded-lg border border-slate-200 focus:border-[#588B76] focus:outline-none"
            />
          </div>

          {/* Logs List */}
          <div className="divide-y divide-slate-100 max-h-96 overflow-y-auto pr-1 text-xs">
            {filteredLogs.length === 0 ? (
              <div className="py-8 text-center text-slate-400">
                No activity logs match your filter criteria.
              </div>
            ) : (
              filteredLogs.slice(0, 15).map((log) => (
                <div key={log.id} className="py-3 flex items-start justify-between gap-3">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-bold text-[#18392B]">{log.action}</span>
                      <span className="bg-slate-100 text-slate-600 px-1.5 py-0.2 rounded text-[10px] font-mono">
                        {log.entity || log.entityType || 'Item'}
                      </span>
                      <span className="text-[11px] text-slate-500">
                        by <strong className="text-slate-700">{log.userName || log.adminName || 'Admin'}</strong> ({log.userRole || log.adminRole || 'Staff'})
                      </span>
                    </div>
                    <p className="text-slate-600 text-[11px] leading-relaxed">{log.details || log.description || ''}</p>
                  </div>
                  <div className="text-[10px] font-mono text-slate-400 shrink-0 text-right">
                    {new Date(log.timestamp).toLocaleTimeString([], {
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                    <div className="text-[9px] text-slate-400">
                      {new Date(log.timestamp).toLocaleDateString([], {
                        month: 'short',
                        day: 'numeric',
                      })}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* System Summary & Admissions Health (1 col) */}
        <div className="space-y-6">
          {/* Firebase Real-Time Cloud Health Card */}
          <div className="bg-[#18392B] text-white rounded-2xl border border-[#588B76]/40 p-6 space-y-4 shadow-sm">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
                <h4 className="font-serif text-sm font-bold text-white">Firebase Cloud Database</h4>
              </div>
              <span className="text-[10px] font-mono text-[#85AA9B] bg-[#10261D] px-2 py-0.5 rounded-full border border-[#588B76]/40">
                Firestore Live
              </span>
            </div>

            <div className="space-y-2 text-xs text-[#D0DED8]">
              <div className="flex justify-between items-center">
                <span>Project ID:</span>
                <span className="font-mono text-white text-[11px]">intelligent-park-95fd2</span>
              </div>
              <div className="flex justify-between items-center">
                <span>Sync Architecture:</span>
                <span className="text-[#85AA9B] font-medium">Real-time WebSockets</span>
              </div>
              <div className="flex justify-between items-center">
                <span>Cloud Storage:</span>
                <span className="text-emerald-300 font-medium">Firebase Storage Ready</span>
              </div>
              <div className="flex justify-between items-center">
                <span>Security Rules:</span>
                <span className="text-emerald-300 font-medium">Deployed & Active</span>
              </div>
            </div>

            <div className="pt-2 border-t border-[#588B76]/30 flex items-center justify-between text-[11px] text-[#85AA9B]">
              <span>Single Source of Truth</span>
              <span className="text-white font-semibold">100% Synced</span>
            </div>
          </div>

          {/* Admissions Summary Card */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-6 space-y-4">
            <h4 className="font-serif text-sm font-bold text-[#18392B] border-b border-slate-100 pb-2">
              Admissions Funnel (AY 2026–2027)
            </h4>
            <div className="space-y-2.5 text-xs">
              <div className="flex justify-between items-center text-slate-600">
                <span>Total Applications:</span>
                <span className="font-bold text-[#18392B]">{applications.length}</span>
              </div>
              <div className="flex justify-between items-center text-slate-600">
                <span>Under Review / Submitted:</span>
                <span className="font-bold text-amber-600">{pendingApps}</span>
              </div>
              <div className="flex justify-between items-center text-slate-600">
                <span>Accepted / Enrolled:</span>
                <span className="font-bold text-[#588B76]">{acceptedApps}</span>
              </div>
              <div className="flex justify-between items-center text-slate-600">
                <span>Financial Aid Requests:</span>
                <span className="font-bold text-blue-600">
                  {applications.filter((a) => a.financialAidRequired).length}
                </span>
              </div>
            </div>

            <button
              onClick={() => onSelectTab('applications')}
              className="w-full bg-slate-100 hover:bg-[#588B76] hover:text-white text-[#18392B] font-bold py-2 rounded-lg text-xs transition cursor-pointer text-center"
            >
              Open Admissions Review Portal
            </button>
          </div>

          {/* Quick Shortcuts */}
          <div className="bg-slate-50 rounded-2xl border border-slate-200 p-6 space-y-3">
            <h4 className="font-serif text-sm font-bold text-[#18392B]">CMS Management Modules</h4>
            <div className="grid grid-cols-2 gap-2 text-xs">
              <button
                onClick={() => onSelectTab('site-config')}
                className="bg-white p-2.5 rounded-lg border border-slate-200 hover:border-[#588B76] text-left font-medium text-slate-700 hover:text-[#18392B] transition"
              >
                Site Identity & SEO
              </button>
              <button
                onClick={() => onSelectTab('hero')}
                className="bg-white p-2.5 rounded-lg border border-slate-200 hover:border-[#588B76] text-left font-medium text-slate-700 hover:text-[#18392B] transition"
              >
                Hero Slideshow
              </button>
              <button
                onClick={() => onSelectTab('announcements')}
                className="bg-white p-2.5 rounded-lg border border-slate-200 hover:border-[#588B76] text-left font-medium text-slate-700 hover:text-[#18392B] transition"
              >
                Announcements
              </button>
              <button
                onClick={() => onSelectTab('downloads')}
                className="bg-white p-2.5 rounded-lg border border-slate-200 hover:border-[#588B76] text-left font-medium text-slate-700 hover:text-[#18392B] transition"
              >
                Download Center
              </button>
              <button
                onClick={() => onSelectTab('testimonials')}
                className="bg-white p-2.5 rounded-lg border border-slate-200 hover:border-[#588B76] text-left font-medium text-slate-700 hover:text-[#18392B] transition"
              >
                Testimonials & FAQs
              </button>
              <button
                onClick={() => onSelectTab('users')}
                className="bg-white p-2.5 rounded-lg border border-slate-200 hover:border-[#588B76] text-left font-medium text-slate-700 hover:text-[#18392B] transition"
              >
                Admin Roles & Users
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
