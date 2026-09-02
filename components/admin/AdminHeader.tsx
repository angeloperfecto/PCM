'use client';

import React, { useRef, useState } from 'react';
import { usePCM } from '@/lib/store';
import { Emblem } from '@/components/common/Emblem';
import { ConfirmDeleteModal } from '@/components/common/ConfirmDeleteModal';
import {
  LogOut,
  Shield,
  Download,
  Upload,
  RotateCcw,
  ExternalLink,
  UserCheck,
} from 'lucide-react';

interface AdminHeaderProps {
  activeTab?: string;
  setActiveTab?: (tab: any) => void;
  isCollapsed?: boolean;
  setIsCollapsed?: (collapsed: boolean) => void;
  isMobileOpen?: boolean;
  setIsMobileOpen?: (open: boolean) => void;
  onExportDB?: () => void;
  onImportClick?: () => void;
  onResetClick?: () => void;
}

export const AdminHeader: React.FC<AdminHeaderProps> = ({
  activeTab,
  setActiveTab,
  isCollapsed,
  setIsCollapsed,
  isMobileOpen,
  setIsMobileOpen,
  onExportDB,
  onImportClick,
  onResetClick,
}) => {
  const {
    currentAdminUser,
    adminLogout,
    navigateTo,
    applications,
    exportDatabaseJson,
    importDatabaseJson,
    resetToInitialData,
    addToast,
    isFirebaseConnected,
    firebaseSyncStatus,
  } = usePCM();

  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [showResetConfirm, setShowResetConfirm] = useState(false);

  const pendingApps = applications.filter(
    (a) => a.status === 'Submitted' || a.status === 'Under Review'
  ).length;

  const tabTitles: Record<string, { title: string; subtitle: string }> = {
    overview: {
      title: 'Institutional Dashboard Overview',
      subtitle: 'System activity telemetry, pending applications queue, and quick management shortcuts.',
    },
    siteConfig: {
      title: 'Site Identity, SEO & Social Config',
      subtitle: 'College branding, institutional contacts, vision/mission, and search metadata.',
    },
    hero: {
      title: 'Hero Slideshow & Carousel',
      subtitle: 'Homepage visual slides, headline announcements, and admissions promotional banners.',
    },
    programs: {
      title: 'Academic Programs & Curriculum',
      subtitle: 'Degree offerings, unit requirements, curriculum syllabi, and theological disciplines.',
    },
    faculty: {
      title: 'Faculty, Instructors & Board of Trustees',
      subtitle: 'Academic staff directories, leadership biographies, and ministry appointments.',
    },
    news: {
      title: 'News, Articles & Publications',
      subtitle: 'Campus reports, ministry updates, press statements, and newsletter articles.',
    },
    events: {
      title: 'Calendar & Campus Events',
      subtitle: 'Institutional calendar, chapel schedules, conferences, and semester timelines.',
    },
    announcements: {
      title: 'Urgent Ticker & Header Notices',
      subtitle: 'High-priority banner alerts, weather disruptions, and registration deadlines.',
    },
    media: {
      title: 'Campus Media Library',
      subtitle: 'Institutional image repository, event photo galleries, and campus photography.',
    },
    downloads: {
      title: 'Downloadable Resources & Forms',
      subtitle: 'Syllabi, registration forms, student handbooks, and official PDF documents.',
    },
    applications: {
      title: 'Admissions Review & Applications',
      subtitle: 'Online applicant evaluations, document verification, and intake approvals.',
    },
    enrollments: {
      title: 'Enrollment & Academic Records',
      subtitle: 'Student directory, course registration approvals, grading, and tuition ledger.',
    },
    donations: {
      title: 'Donations, Giving & Fund Drives',
      subtitle: 'Financial gifts ledger, scholarship sponsorships, and digital giving accounts.',
    },
    users: {
      title: 'CMS Users, Roles & RBAC Security',
      subtitle: 'Administrator access levels, credential management, and audit logs.',
    },
  };

  const currentTabInfo = tabTitles[activeTab || 'overview'] || {
    title: 'Administrator CMS Workspace',
    subtitle: 'Institutional content management system for Philippine College of Ministry.',
  };

  const handleExport = () => {
    if (onExportDB) {
      onExportDB();
      return;
    }
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

  const handleImport = () => {
    if (onImportClick) {
      onImportClick();
      return;
    }
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

  const handleReset = () => {
    if (onResetClick) {
      onResetClick();
      return;
    }
    setShowResetConfirm(true);
  };

  return (
    <header className="bg-[#18392B] text-white py-4 px-4 sm:px-6 lg:px-8 border-b-2 border-[#588B76]/50 shadow-md sticky top-0 z-30">
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileChange}
        accept=".json"
        className="hidden"
      />
      <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
        {/* Left: Mobile Toggle & Tab Info */}
        <div className="flex items-center gap-3">
          {/* Mobile Menu Toggle Button */}
          <button
            type="button"
            onClick={() => setIsMobileOpen?.(!isMobileOpen)}
            className="lg:hidden p-2 rounded-xl bg-[#11261D] text-slate-200 hover:text-white border border-[#2B5E47] transition cursor-pointer"
            title="Toggle Navigation Menu"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>

          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-[#85AA9B]">
                PCM CMS
              </span>
              <span className="text-slate-400 text-xs">•</span>
              <span className="text-[11px] text-emerald-300 font-medium font-sans">
                {currentTabInfo.title}
              </span>
              <span className="bg-[#588B76]/30 text-[#85AA9B] border border-[#588B76]/50 text-[10px] font-semibold px-2 py-0.2 rounded-full hidden sm:inline-flex items-center gap-1">
                <Shield className="w-2.5 h-2.5" />
                {currentAdminUser?.role || 'Super Admin'}
              </span>
            </div>
            <h1 className="font-serif text-lg sm:text-xl font-bold text-white tracking-wide mt-0.5">
              {currentTabInfo.title}
            </h1>
            <p className="text-xs text-[#D0DED8] hidden sm:block">
              {currentTabInfo.subtitle}
            </p>
          </div>
        </div>

        {/* Right: Quick Controls & Status */}
        <div className="flex flex-wrap items-center gap-2 text-xs w-full lg:w-auto justify-between lg:justify-end">
          {/* Live Cloud Sync Indicator */}
          <div
            id="admin-auto-sync-status-badge"
            className={`px-2.5 py-1.5 rounded-lg flex items-center gap-2 font-medium border shadow-xs transition-all ${
              firebaseSyncStatus === 'syncing'
                ? 'bg-amber-950/70 text-amber-300 border-amber-700/60'
                : 'bg-emerald-950/70 text-emerald-300 border-emerald-700/60'
            }`}
            title="Real-time automatic cloud synchronization is active."
          >
            <span
              className={`w-2 h-2 rounded-full shrink-0 ${
                firebaseSyncStatus === 'syncing'
                  ? 'bg-amber-400 animate-spin'
                  : 'bg-emerald-400 animate-pulse'
              }`}
            />
            <span className="text-[11px] font-semibold tracking-wide">
              {firebaseSyncStatus === 'syncing'
                ? 'Syncing Cloud...'
                : 'Live Cloud Connected'}
            </span>
          </div>

          {pendingApps > 0 && (
            <button
              onClick={() => setActiveTab?.('applications')}
              className="bg-amber-500/20 text-amber-300 border border-amber-500/50 px-2.5 py-1.5 rounded-lg flex items-center gap-1.5 font-medium transition cursor-pointer hover:bg-amber-500/30"
              title="Click to view pending admissions applications"
            >
              <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
              <span>{pendingApps} Pending Review</span>
            </button>
          )}

          <div className="hidden sm:flex items-center gap-1.5">
            <button
              id="admin-btn-export-db"
              onClick={handleExport}
              title="Download full database snapshot as JSON file"
              className="flex items-center gap-1.5 bg-[#10261D] hover:bg-[#0A1812] text-[#D0DED8] hover:text-white px-2.5 py-1.5 rounded-lg border border-[#588B76]/40 transition cursor-pointer font-medium text-xs"
            >
              <Download className="w-3.5 h-3.5 text-[#85AA9B]" />
              <span>Backup</span>
            </button>

            <button
              id="admin-btn-import-db"
              onClick={handleImport}
              title="Restore database from JSON file"
              className="flex items-center gap-1.5 bg-[#10261D] hover:bg-[#0A1812] text-[#D0DED8] hover:text-white px-2.5 py-1.5 rounded-lg border border-[#588B76]/40 transition cursor-pointer font-medium text-xs"
            >
              <Upload className="w-3.5 h-3.5 text-[#85AA9B]" />
              <span>Restore</span>
            </button>
          </div>

          <button
            id="admin-btn-view-live"
            onClick={() => navigateTo('home')}
            className="flex items-center gap-1.5 bg-[#588B76] hover:bg-[#46705F] text-white px-3 py-1.5 rounded-lg font-bold text-xs transition cursor-pointer shadow-xs"
          >
            <span>Public Site</span>
            <ExternalLink className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Confirmation Modal */}
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
    </header>
  );
};
