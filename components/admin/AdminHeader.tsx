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
  onExportDB?: () => void;
  onImportClick?: () => void;
  onResetClick?: () => void;
}

export const AdminHeader: React.FC<AdminHeaderProps> = ({
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
    <header className="bg-[#18392B] text-white py-5 px-4 sm:px-8 border-b-4 border-[#588B76] shadow-lg">
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileChange}
        accept=".json"
        className="hidden"
      />
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        {/* Left: Branding & Role */}
        <div className="flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-xl bg-white/10 p-1 border border-[#588B76]/40 flex items-center justify-center shrink-0 shadow-inner">
            <Emblem id="admin-header-logo" size={40} className="w-10 h-10" />
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-[#85AA9B]">
                PCM Institutional Content Management System
              </span>
              <span className="bg-[#588B76]/30 text-[#85AA9B] border border-[#588B76]/50 text-[10px] font-semibold px-2 py-0.2 rounded-full flex items-center gap-1">
                <Shield className="w-2.5 h-2.5" />
                {currentAdminUser?.role || 'Super Admin'}
              </span>
            </div>
            <h1 className="font-serif text-xl sm:text-2xl font-bold text-white tracking-wide">
              Administrator CMS Workspace
            </h1>
            <p className="text-xs text-[#D0DED8]">
              Signed in as <strong className="text-white">{currentAdminUser?.name || 'Administrator'}</strong> ({currentAdminUser?.email || 'admin@pcm.ph'})
            </p>
          </div>
        </div>

        {/* Right: Quick Global Controls */}
        <div className="flex flex-wrap items-center gap-2 text-xs">
          {/* Automatic Cloud Synchronization Live Indicator */}
          <div
            id="admin-auto-sync-status-badge"
            className={`px-3 py-1.5 rounded-sm flex items-center gap-2 font-medium border shadow-xs transition-all ${
              firebaseSyncStatus === 'syncing'
                ? 'bg-amber-950/70 text-amber-300 border-amber-700/60'
                : 'bg-emerald-950/70 text-emerald-300 border-emerald-700/60'
            }`}
            title="Real-time automatic cloud synchronization is active. All institutional data, submissions, and settings auto-persist seamlessly."
          >
            <span
              className={`w-2 h-2 rounded-full shrink-0 ${
                firebaseSyncStatus === 'syncing'
                  ? 'bg-amber-400 animate-spin'
                  : 'bg-emerald-400 animate-pulse'
              }`}
            />
            <span className="text-xs font-semibold tracking-wide">
              {firebaseSyncStatus === 'syncing'
                ? 'Auto-Syncing...'
                : 'Auto-Sync Active (Live Cloud)'}
            </span>
          </div>

          {pendingApps > 0 && (
            <div className="bg-[#85AA9B]/20 text-[#D0DED8] border border-[#85AA9B]/40 px-2.5 py-1 rounded-sm flex items-center gap-1.5 font-medium">
              <span className="w-2 h-2 rounded-full bg-[#85AA9B] animate-pulse" />
              <span>{pendingApps} Pending Applications</span>
            </div>
          )}

          <button
            id="admin-btn-export-db"
            onClick={handleExport}
            title="Download full database snapshot as JSON file"
            className="flex items-center gap-1.5 bg-[#10261D] hover:bg-[#0A1812] text-[#D0DED8] hover:text-white px-3 py-1.5 rounded-sm border border-[#588B76]/40 transition cursor-pointer font-medium"
          >
            <Download className="w-3.5 h-3.5 text-[#85AA9B]" />
            <span>Backup DB</span>
          </button>

          <button
            id="admin-btn-import-db"
            onClick={handleImport}
            title="Restore database from JSON file"
            className="flex items-center gap-1.5 bg-[#10261D] hover:bg-[#0A1812] text-[#D0DED8] hover:text-white px-3 py-1.5 rounded-sm border border-[#588B76]/40 transition cursor-pointer font-medium"
          >
            <Upload className="w-3.5 h-3.5 text-[#85AA9B]" />
            <span>Restore</span>
          </button>

          <button
            id="admin-btn-reset-db"
            onClick={handleReset}
            title="Reset to factory initial dataset"
            className="flex items-center gap-1.5 bg-red-950/40 hover:bg-red-900/60 text-red-200 px-3 py-1.5 rounded-sm border border-red-800/40 transition cursor-pointer font-medium"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Reset</span>
          </button>

          <button
            id="admin-btn-view-live"
            onClick={() => navigateTo('home')}
            className="flex items-center gap-1.5 bg-[#588B76] hover:bg-[#46705F] text-white px-3 py-1.5 rounded-sm font-bold uppercase tracking-wider transition cursor-pointer shadow-sm"
          >
            <span>View Public Site</span>
            <ExternalLink className="w-3.5 h-3.5" />
          </button>

          <button
            id="admin-btn-logout"
            onClick={adminLogout}
            className="flex items-center gap-1.5 bg-[#18392B] hover:bg-red-900/40 text-red-300 hover:text-white px-3 py-1.5 rounded-sm border border-red-800/40 transition cursor-pointer font-medium"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>Logout</span>
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
