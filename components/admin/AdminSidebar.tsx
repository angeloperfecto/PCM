'use client';

import React, { useState } from 'react';
import { usePCM } from '@/lib/store';
import { Emblem } from '@/components/common/Emblem';
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
  GraduationCap,
  ShieldCheck,
  Shield,
  Heart,
  ChevronLeft,
  ChevronRight,
  LogOut,
  ExternalLink,
  Search,
  Database,
  RotateCcw,
  Upload,
  CloudCheck,
  RefreshCw,
} from 'lucide-react';

export type AdminTabType =
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
  | 'enrollments'
  | 'donations'
  | 'users';

interface NavItem {
  id: AdminTabType;
  label: string;
  icon: React.ElementType;
  count?: number;
  highlight?: boolean;
}

interface NavGroup {
  groupTitle: string;
  items: NavItem[];
}

interface AdminSidebarProps {
  activeTab: AdminTabType;
  setActiveTab: (tab: AdminTabType) => void;
  isCollapsed: boolean;
  setIsCollapsed: (collapsed: boolean) => void;
  isMobileOpen: boolean;
  setIsMobileOpen: (open: boolean) => void;
  onExportDB: () => void;
  onImportClick: () => void;
  onResetClick: () => void;
}

export const AdminSidebar: React.FC<AdminSidebarProps> = ({
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
    announcements,
    programs,
    faculty,
    news,
    events,
    downloads,
    mediaLibrary,
    donations,
    enrollments,
    firebaseSyncStatus,
  } = usePCM();

  const [searchFilter, setSearchFilter] = useState('');

  const pendingApps = applications.filter(
    (a) => a.status === 'Submitted' || a.status === 'Under Review'
  ).length;

  const navGroups: NavGroup[] = [
    {
      groupTitle: 'Core',
      items: [
        { id: 'overview', label: 'Dashboard Overview', icon: LayoutDashboard },
      ],
    },
    {
      groupTitle: 'Admissions & Students',
      items: [
        {
          id: 'applications',
          label: 'Admissions Review',
          icon: FileCheck,
          count: applications.length,
          highlight: pendingApps > 0,
        },
        {
          id: 'enrollments',
          label: 'Enrollment & Records',
          icon: GraduationCap,
          count: enrollments.length,
          highlight: true,
        },
        {
          id: 'programs',
          label: 'Academic Programs',
          icon: BookOpen,
          count: programs.length,
        },
        {
          id: 'faculty',
          label: 'Faculty & Trustees',
          icon: Users,
          count: faculty.length,
        },
      ],
    },
    {
      groupTitle: 'Campus & Content',
      items: [
        {
          id: 'news',
          label: 'News & Articles',
          icon: Megaphone,
          count: news.length,
        },
        {
          id: 'events',
          label: 'Calendar Events',
          icon: Calendar,
          count: events.length,
        },
        {
          id: 'announcements',
          label: 'Ticker Notices',
          icon: Bell,
          count: announcements.filter((a) => a.active).length,
        },
        {
          id: 'donations',
          label: 'Donations & Giving',
          icon: Heart,
          count: donations.length,
          highlight: true,
        },
      ],
    },
    {
      groupTitle: 'Media & Files',
      items: [
        {
          id: 'media',
          label: 'Media Library',
          icon: ImageIcon,
          count: mediaLibrary.length,
        },
        {
          id: 'downloads',
          label: 'Download Center',
          icon: Download,
          count: downloads.length,
        },
      ],
    },
    {
      groupTitle: 'System & Branding',
      items: [
        { id: 'siteConfig', label: 'Site Identity & SEO', icon: Building },
        { id: 'hero', label: 'Hero Slideshow', icon: Sparkles },
        { id: 'users', label: 'Users & Roles', icon: ShieldCheck },
      ],
    },
  ];

  const filteredGroups = navGroups
    .map((g) => ({
      ...g,
      items: g.items.filter((item) =>
        item.label.toLowerCase().includes(searchFilter.toLowerCase())
      ),
    }))
    .filter((g) => g.items.length > 0);

  const handleSelectTab = (tab: AdminTabType) => {
    setActiveTab(tab);
    if (isMobileOpen) {
      setIsMobileOpen(false);
    }
  };

  return (
    <>
      {/* Mobile Backdrop */}
      {isMobileOpen && (
        <div
          onClick={() => setIsMobileOpen(false)}
          className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-40 lg:hidden transition-opacity"
        />
      )}

      {/* Main Sidebar Container */}
      <aside
        className={`fixed top-0 bottom-0 left-0 z-50 flex flex-col bg-[#11261D] text-slate-200 border-r border-[#1E4434] transition-all duration-300 ease-in-out shadow-2xl lg:shadow-none ${
          isMobileOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        } ${isCollapsed ? 'w-20' : 'w-72'}`}
      >
        {/* Top Header / Branding */}
        <div className="p-4 border-b border-[#1E4434] flex items-center justify-between gap-3 bg-[#0D1F17] shrink-0">
          <div className="flex items-center gap-3 overflow-hidden">
            <div className="w-10 h-10 rounded-xl bg-white/10 p-1 border border-[#588B76]/40 flex items-center justify-center shrink-0 shadow-inner">
              <Emblem id="sidebar-pcm-logo" size={32} className="w-8 h-8" />
            </div>
            {!isCollapsed && (
              <div className="truncate">
                <div className="flex items-center gap-1.5">
                  <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-[#85AA9B]">
                    PCM CMS
                  </span>
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                </div>
                <h2 className="font-serif text-sm font-bold text-white tracking-wide truncate">
                  Admin Workspace
                </h2>
              </div>
            )}
          </div>

          {/* Desktop Collapse / Expand Button */}
          <button
            onClick={() => setIsCollapsed(!isCollapsed)}
            className="hidden lg:flex w-7 h-7 rounded-lg bg-[#18392B] hover:bg-[#23533E] text-slate-300 hover:text-white items-center justify-center transition cursor-pointer border border-[#2B5E47]"
            title={isCollapsed ? 'Expand Sidebar' : 'Collapse Sidebar'}
          >
            {isCollapsed ? (
              <ChevronRight className="w-4 h-4" />
            ) : (
              <ChevronLeft className="w-4 h-4" />
            )}
          </button>
        </div>

        {/* Admin Profile Card */}
        {!isCollapsed ? (
          <div className="px-4 py-3 border-b border-[#1E4434] bg-[#0E2319] shrink-0">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-[#588B76]/20 border border-[#588B76]/40 flex items-center justify-center text-[#85AA9B] font-bold text-sm font-mono shrink-0">
                {(currentAdminUser?.name || 'A').charAt(0).toUpperCase()}
              </div>
              <div className="truncate flex-1">
                <div className="text-xs font-bold text-white truncate">
                  {currentAdminUser?.name || 'Administrator'}
                </div>
                <div className="flex items-center gap-1.5 mt-0.5">
                  <span className="text-[10px] bg-[#588B76]/30 text-[#85AA9B] border border-[#588B76]/50 px-1.5 py-0.2 rounded font-medium inline-flex items-center gap-1">
                    <Shield className="w-2.5 h-2.5" />
                    {currentAdminUser?.role || 'Super Admin'}
                  </span>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="py-3 flex justify-center border-b border-[#1E4434] bg-[#0E2319] shrink-0">
            <div
              className="w-9 h-9 rounded-xl bg-[#588B76]/20 border border-[#588B76]/40 flex items-center justify-center text-[#85AA9B] font-bold text-sm font-mono"
              title={`${currentAdminUser?.name || 'Admin'} (${currentAdminUser?.role || 'Super Admin'})`}
            >
              {(currentAdminUser?.name || 'A').charAt(0).toUpperCase()}
            </div>
          </div>
        )}

        {/* Quick Search Filter (When Expanded) */}
        {!isCollapsed && (
          <div className="px-3 pt-3 pb-1 shrink-0">
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchFilter}
                onChange={(e) => setSearchFilter(e.target.value)}
                placeholder="Filter menu tabs..."
                className="w-full bg-[#0D1F17] text-xs text-slate-200 placeholder-slate-500 pl-8 pr-2 py-1.5 rounded-lg border border-[#1E4434] focus:outline-none focus:border-[#588B76] transition"
              />
            </div>
          </div>
        )}

        {/* Scrollable Navigation Groups */}
        <div className="flex-1 overflow-y-auto px-3 py-3 space-y-4 scrollbar-thin scrollbar-thumb-[#1E4434] scrollbar-track-transparent">
          {filteredGroups.map((group, gIdx) => (
            <div key={gIdx} className="space-y-1">
              {!isCollapsed && (
                <div className="px-2.5 py-1 text-[10px] font-mono font-bold uppercase tracking-wider text-[#85AA9B]/70">
                  {group.groupTitle}
                </div>
              )}
              {group.items.map((item) => {
                const Icon = item.icon;
                const isActive = activeTab === item.id;

                return (
                  <button
                    key={item.id}
                    id={`sidebar-tab-${item.id}`}
                    onClick={() => handleSelectTab(item.id)}
                    title={isCollapsed ? item.label : undefined}
                    className={`w-full flex items-center rounded-xl transition cursor-pointer font-medium text-xs ${
                      isCollapsed
                        ? 'justify-center p-2.5'
                        : 'justify-between px-3 py-2.5 gap-2.5'
                    } ${
                      isActive
                        ? 'bg-[#588B76] text-white shadow-md font-semibold'
                        : 'text-slate-300 hover:bg-[#18392B] hover:text-white'
                    }`}
                  >
                    <div className="flex items-center gap-2.5 truncate">
                      <Icon
                        className={`w-4 h-4 shrink-0 ${
                          isActive ? 'text-white' : 'text-[#85AA9B]'
                        }`}
                      />
                      {!isCollapsed && <span className="truncate">{item.label}</span>}
                    </div>

                    {!isCollapsed && item.count !== undefined && (
                      <span
                        className={`text-[10px] px-1.5 py-0.2 rounded-full font-mono shrink-0 ${
                          isActive
                            ? 'bg-black/20 text-white font-bold'
                            : item.highlight
                            ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                            : 'bg-[#18392B] text-[#D0DED8]'
                        }`}
                      >
                        {item.count}
                      </span>
                    )}

                    {isCollapsed && item.count !== undefined && item.count > 0 && (
                      <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-amber-400" />
                    )}
                  </button>
                );
              })}
            </div>
          ))}
        </div>

        {/* Bottom Utility Actions Dock */}
        <div className="p-3 border-t border-[#1E4434] bg-[#0D1F17] space-y-2 shrink-0">
          {/* Cloud Auto-Sync Indicator */}
          <div
            className={`px-2.5 py-1.5 rounded-lg border text-[11px] flex items-center gap-2 transition ${
              firebaseSyncStatus === 'syncing'
                ? 'bg-amber-950/50 text-amber-300 border-amber-800/40'
                : 'bg-[#18392B]/60 text-emerald-300 border-[#2B5E47]'
            } ${isCollapsed ? 'justify-center' : ''}`}
            title="Real-time automatic cloud database synchronization is active."
          >
            <span
              className={`w-2 h-2 rounded-full shrink-0 ${
                firebaseSyncStatus === 'syncing'
                  ? 'bg-amber-400 animate-spin'
                  : 'bg-emerald-400 animate-pulse'
              }`}
            />
            {!isCollapsed && (
              <span className="truncate font-mono text-[10px]">
                {firebaseSyncStatus === 'syncing' ? 'Syncing...' : 'Live Cloud Sync'}
              </span>
            )}
          </div>

          {/* Quick Tools Grid */}
          {!isCollapsed ? (
            <div className="grid grid-cols-3 gap-1.5 pt-1">
              <button
                onClick={onExportDB}
                title="Backup full database JSON"
                className="flex flex-col items-center justify-center p-1.5 rounded-lg bg-[#18392B] hover:bg-[#23533E] text-slate-300 hover:text-white border border-[#2B5E47] transition cursor-pointer text-[10px]"
              >
                <Download className="w-3.5 h-3.5 text-[#85AA9B] mb-0.5" />
                <span>Backup</span>
              </button>
              <button
                onClick={onImportClick}
                title="Restore database JSON"
                className="flex flex-col items-center justify-center p-1.5 rounded-lg bg-[#18392B] hover:bg-[#23533E] text-slate-300 hover:text-white border border-[#2B5E47] transition cursor-pointer text-[10px]"
              >
                <Upload className="w-3.5 h-3.5 text-[#85AA9B] mb-0.5" />
                <span>Restore</span>
              </button>
              <button
                onClick={onResetClick}
                title="Reset to initial data baseline"
                className="flex flex-col items-center justify-center p-1.5 rounded-lg bg-red-950/40 hover:bg-red-900/60 text-red-200 border border-red-800/40 transition cursor-pointer text-[10px]"
              >
                <RotateCcw className="w-3.5 h-3.5 text-red-400 mb-0.5" />
                <span>Reset</span>
              </button>
            </div>
          ) : (
            <div className="flex flex-col gap-1.5 pt-1">
              <button
                onClick={onExportDB}
                title="Backup full database JSON"
                className="p-2 rounded-lg bg-[#18392B] hover:bg-[#23533E] text-slate-300 hover:text-white flex justify-center border border-[#2B5E47] transition cursor-pointer"
              >
                <Download className="w-4 h-4 text-[#85AA9B]" />
              </button>
            </div>
          )}

          {/* Public Site & Sign Out */}
          <div className="pt-1 space-y-1">
            <button
              onClick={() => navigateTo('home')}
              className={`w-full flex items-center rounded-lg bg-[#18392B] hover:bg-[#23533E] text-slate-200 hover:text-white border border-[#2B5E47] transition cursor-pointer text-xs font-semibold ${
                isCollapsed ? 'justify-center p-2.5' : 'justify-between px-3 py-2'
              }`}
              title="View Live Public Website"
            >
              {!isCollapsed && <span>View Public Site</span>}
              <ExternalLink className="w-3.5 h-3.5 text-[#85AA9B]" />
            </button>

            <button
              onClick={adminLogout}
              className={`w-full flex items-center rounded-lg bg-red-950/30 hover:bg-red-900/50 text-red-300 hover:text-white border border-red-900/40 transition cursor-pointer text-xs font-semibold ${
                isCollapsed ? 'justify-center p-2.5' : 'justify-between px-3 py-2'
              }`}
              title="Sign Out of Admin Portal"
            >
              {!isCollapsed && <span>Logout</span>}
              <LogOut className="w-3.5 h-3.5 text-red-400" />
            </button>
          </div>
        </div>
      </aside>
    </>
  );
};
