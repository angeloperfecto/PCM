'use client';

import React from 'react';
import {
  GraduationCap,
  Calendar,
  Award,
  FileText,
  DollarSign,
  Flame,
  BookOpen,
  Bell,
  LogOut,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  Printer,
  Sparkles,
  CheckCircle2,
  AlertCircle,
  Clock,
  Menu,
  X,
  User,
  ExternalLink,
} from 'lucide-react';
import { StudentProfile } from '@/lib/types';

export type StudentPortalTabType =
  | 'enrollment'
  | 'schedule'
  | 'grades'
  | 'vault'
  | 'financial'
  | 'practicum'
  | 'spiritual'
  | 'notifications';

interface NavItem {
  id: StudentPortalTabType;
  label: string;
  icon: React.ElementType;
  badge?: string;
  count?: number;
  isBadgeCount?: boolean;
  highlight?: boolean;
  hasSubItems?: boolean;
}

interface NavGroup {
  groupTitle: string;
  items: NavItem[];
}

interface StudentPortalSidebarProps {
  activeTab: StudentPortalTabType;
  setActiveTab: (tab: StudentPortalTabType) => void;
  enrollmentActiveSubTab: string;
  setEnrollmentActiveSubTab: (subTab: any) => void;
  studentProfile: StudentProfile;
  isEnrolled: boolean;
  isPendingEnrollment: boolean;
  isReturnedEnrollment: boolean;
  unreadNotifsCount: number;
  totalPracticumHours: number;
  remainingBalance: number;
  onOpenCORModal: () => void;
  onOpenEnrollmentWizard: () => void;
  studentLogout: () => void;
  isCollapsed: boolean;
  setIsCollapsed: (collapsed: boolean) => void;
  isMobileOpen: boolean;
  setIsMobileOpen: (open: boolean) => void;
}

export const StudentPortalSidebar: React.FC<StudentPortalSidebarProps> = ({
  activeTab,
  setActiveTab,
  enrollmentActiveSubTab,
  setEnrollmentActiveSubTab,
  studentProfile,
  isEnrolled,
  isPendingEnrollment,
  isReturnedEnrollment,
  unreadNotifsCount,
  totalPracticumHours,
  remainingBalance,
  onOpenCORModal,
  onOpenEnrollmentWizard,
  studentLogout,
  isCollapsed,
  setIsCollapsed,
  isMobileOpen,
  setIsMobileOpen,
}) => {
  const [isEnrollmentSubmenuOpen, setIsEnrollmentSubmenuOpen] = React.useState(true);

  const navGroups: NavGroup[] = [
    {
      groupTitle: 'Academic & Enrollment',
      items: [
        {
          id: 'enrollment',
          label: 'Online Enrollment Hub',
          icon: GraduationCap,
          badge: isEnrolled ? 'Enrolled' : isPendingEnrollment ? 'Pending' : 'AY 26–27',
          highlight: !isEnrolled,
          hasSubItems: true,
        },
        {
          id: 'schedule',
          label: 'Class Schedule',
          icon: Calendar,
          count: studentProfile.courses?.length || 0,
        },
        {
          id: 'grades',
          label: 'Grades & Evaluation',
          icon: Award,
        },
        {
          id: 'vault',
          label: 'Document Vault',
          icon: FileText,
          count: studentProfile.documents?.length || 0,
        },
      ],
    },
    {
      groupTitle: 'Accounts & Finance',
      items: [
        {
          id: 'financial',
          label: 'Tuition & Billing',
          icon: DollarSign,
          badge: remainingBalance > 0 ? `₱${remainingBalance.toLocaleString()}` : 'Cleared',
        },
      ],
    },
    {
      groupTitle: 'Formation & Ministry',
      items: [
        {
          id: 'practicum',
          label: 'Practicum Log',
          icon: Flame,
          badge: `${totalPracticumHours}h`,
        },
        {
          id: 'spiritual',
          label: 'Mentorship & Church',
          icon: BookOpen,
        },
      ],
    },
    {
      groupTitle: 'Communication',
      items: [
        {
          id: 'notifications',
          label: 'Notifications',
          icon: Bell,
          count: unreadNotifsCount,
          isBadgeCount: true,
        },
      ],
    },
  ];

  const enrollmentSubItems = [
    { id: 'profile', label: 'Student Profile' },
    { id: 'pre-enlistment', label: 'Pre-Enlistment' },
    { id: 'enrollment', label: 'Enrollment & COR' },
    { id: 'add-drop', label: 'Adding & Dropping' },
    { id: 'assessment', label: 'Assessment of Fees' },
    { id: 'amount-due', label: 'Amount Due & Payment' },
  ];

  const handleItemClick = (tabId: StudentPortalTabType) => {
    setActiveTab(tabId);
    if (tabId === 'enrollment') {
      setIsEnrollmentSubmenuOpen(true);
    }
    setIsMobileOpen(false);
  };

  const handleSubItemClick = (subId: string) => {
    setActiveTab('enrollment');
    setEnrollmentActiveSubTab(subId);
    setIsMobileOpen(false);
  };

  const sidebarContent = (
    <div className="flex flex-col h-full bg-white text-slate-800">
      {/* Student Profile Quick Header */}
      <div className="p-4 border-b border-slate-200 bg-gradient-to-b from-[#18392B]/5 to-transparent">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-xl bg-[#18392B] text-white font-serif font-black text-lg flex items-center justify-center shadow-xs border border-[#588B76]/30 shrink-0">
            {(studentProfile.fullName || studentProfile.name || 'S').charAt(0)}
          </div>
          {!isCollapsed && (
            <div className="min-w-0 flex-1">
              <h3 className="font-serif font-bold text-sm text-slate-900 truncate leading-tight">
                {studentProfile.fullName || studentProfile.name}
              </h3>
              <p className="text-[11px] font-mono font-medium text-[#588B76] truncate">
                {studentProfile.studentId}
              </p>
              <div className="flex items-center gap-1.5 mt-1">
                <span
                  className={`inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-full border ${
                    isEnrolled
                      ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                      : isPendingEnrollment
                      ? 'bg-amber-50 text-amber-700 border-amber-200'
                      : isReturnedEnrollment
                      ? 'bg-rose-50 text-rose-700 border-rose-200'
                      : 'bg-slate-100 text-slate-600 border-slate-200'
                  }`}
                >
                  {isEnrolled ? (
                    <>
                      <CheckCircle2 className="w-2.5 h-2.5 text-emerald-600" />
                      <span>Enrolled</span>
                    </>
                  ) : isPendingEnrollment ? (
                    <>
                      <Clock className="w-2.5 h-2.5 text-amber-600" />
                      <span>Submitted</span>
                    </>
                  ) : isReturnedEnrollment ? (
                    <>
                      <AlertCircle className="w-2.5 h-2.5 text-rose-600" />
                      <span>Correction</span>
                    </>
                  ) : (
                    <span>Matriculated</span>
                  )}
                </span>
                <span className="text-[10px] text-slate-400 font-mono">AY 2026–2027</span>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Navigation Links (Categorized) */}
      <div className="flex-1 overflow-y-auto p-3 space-y-4">
        {navGroups.map((group) => (
          <div key={group.groupTitle} className="space-y-1">
            {!isCollapsed && (
              <div className="px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-slate-400 font-mono">
                {group.groupTitle}
              </div>
            )}
            <div className="space-y-0.5">
              {group.items.map((item) => {
                const Icon = item.icon;
                const isActive = activeTab === item.id;

                return (
                  <div key={item.id} className="space-y-0.5">
                    <div
                      className={`w-full flex items-center justify-between rounded-xl text-xs font-semibold transition group ${
                        isActive
                          ? 'bg-[#18392B] text-white shadow-xs'
                          : 'text-slate-700 hover:bg-slate-100 hover:text-slate-900'
                      }`}
                    >
                      <button
                        type="button"
                        id={`student-nav-${item.id}`}
                        onClick={() => handleItemClick(item.id)}
                        title={isCollapsed ? item.label : undefined}
                        className="flex-1 flex items-center justify-between px-3 py-2.5 min-w-0 cursor-pointer text-left"
                      >
                        <div className="flex items-center gap-2.5 min-w-0">
                          <Icon
                            className={`w-4 h-4 shrink-0 transition ${
                              isActive
                                ? 'text-amber-300'
                                : 'text-slate-500 group-hover:text-[#18392B]'
                            }`}
                          />
                          {!isCollapsed && (
                            <span className="truncate text-left">{item.label}</span>
                          )}
                        </div>

                        {!isCollapsed && (
                          <div className="flex items-center gap-1.5 shrink-0 ml-2">
                            {item.badge && (
                              <span
                                className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full font-mono ${
                                  isActive
                                    ? 'bg-white/20 text-white'
                                    : item.highlight
                                    ? 'bg-amber-100 text-amber-900 border border-amber-300'
                                    : 'bg-emerald-100 text-emerald-800'
                                }`}
                              >
                                {item.badge}
                              </span>
                            )}
                            {item.count !== undefined && item.count > 0 && (
                              <span
                                className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full font-mono ${
                                  isActive
                                    ? 'bg-white/20 text-white'
                                    : item.isBadgeCount
                                    ? 'bg-amber-500 text-white'
                                    : 'bg-slate-100 text-slate-700'
                                }`}
                              >
                                {item.count}
                              </span>
                            )}
                          </div>
                        )}
                      </button>

                      {!isCollapsed && item.hasSubItems && (
                        <button
                          type="button"
                          id={`student-nav-${item.id}-toggle`}
                          onClick={(e) => {
                            e.stopPropagation();
                            setIsEnrollmentSubmenuOpen(!isEnrollmentSubmenuOpen);
                          }}
                          className="px-2.5 py-2.5 hover:bg-black/10 rounded-r-xl transition cursor-pointer shrink-0 text-slate-400"
                          title="Toggle submenu"
                          aria-label="Toggle submenu"
                        >
                          <ChevronDown
                            className={`w-3.5 h-3.5 transition-transform ${
                              isEnrollmentSubmenuOpen ? 'rotate-180' : ''
                            } ${isActive ? 'text-white' : 'text-slate-400'}`}
                          />
                        </button>
                      )}
                    </div>

                    {/* Submenu for Online Enrollment Hub */}
                    {!isCollapsed && item.hasSubItems && isEnrollmentSubmenuOpen && (
                      <div className="pl-6 pr-2 py-1 space-y-0.5 border-l-2 border-slate-200 ml-4 mt-0.5">
                        {enrollmentSubItems.map((sub) => {
                          const isSubActive =
                            activeTab === 'enrollment' && enrollmentActiveSubTab === sub.id;
                          return (
                            <button
                              key={sub.id}
                              type="button"
                              onClick={() => handleSubItemClick(sub.id)}
                              className={`w-full text-left px-2.5 py-1.5 rounded-lg text-[11px] font-medium transition cursor-pointer flex items-center justify-between ${
                                isSubActive
                                  ? 'bg-[#588B76]/15 text-[#18392B] font-bold'
                                  : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                              }`}
                            >
                              <span className="truncate">{sub.label}</span>
                              {isSubActive && (
                                <span className="w-1.5 h-1.5 rounded-full bg-[#18392B] shrink-0" />
                              )}
                            </button>
                          );
                        })}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </div>

      {/* Bottom Quick Tools & Sign Out */}
      <div className="p-3 border-t border-slate-200 bg-slate-50/70 space-y-2">
        {!isCollapsed ? (
          <>
            {/* Quick Action: Certificate of Registration */}
            <button
              type="button"
              id="btn-sidebar-quick-cor"
              onClick={onOpenCORModal}
              className="w-full bg-white hover:bg-emerald-50 text-[#18392B] border border-slate-200 hover:border-emerald-300 font-semibold px-3 py-2 rounded-xl text-xs flex items-center justify-center gap-2 transition cursor-pointer shadow-2xs"
            >
              <Printer className="w-3.5 h-3.5 text-[#588B76]" />
              <span>Official COR Document</span>
            </button>

            {/* Program & Year Indicator */}
            <div className="p-2.5 bg-white rounded-xl border border-slate-200 text-[10px] space-y-0.5">
              <span className="text-slate-400 block uppercase font-mono font-bold">Enrolled Degree</span>
              <p className="font-semibold text-slate-800 truncate">
                {studentProfile.degreeProgram || studentProfile.program}
              </p>
              <div className="flex items-center justify-between text-slate-500 pt-0.5">
                <span>{studentProfile.yearLevel}</span>
                <span className="font-mono text-[#588B76] font-bold">
                  GPA: {(studentProfile.gpa || 1.0).toFixed(2)}
                </span>
              </div>
            </div>

            <div className="flex items-center justify-between pt-1">
              <button
                type="button"
                id="btn-sidebar-logout"
                onClick={studentLogout}
                className="text-xs text-slate-500 hover:text-rose-700 font-semibold flex items-center gap-1.5 transition cursor-pointer p-1"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span>Sign Out</span>
              </button>

              <button
                type="button"
                onClick={() => setIsCollapsed(true)}
                title="Collapse sidebar"
                className="hidden lg:flex p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-200/60 rounded-lg transition cursor-pointer"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
            </div>
          </>
        ) : (
          <div className="space-y-2 flex flex-col items-center">
            <button
              type="button"
              onClick={onOpenCORModal}
              title="Official COR Document"
              className="p-2 bg-white hover:bg-emerald-50 text-[#18392B] border border-slate-200 rounded-xl transition cursor-pointer"
            >
              <Printer className="w-4 h-4 text-[#588B76]" />
            </button>

            <button
              type="button"
              onClick={studentLogout}
              title="Sign Out"
              className="p-2 text-slate-500 hover:text-rose-700 transition cursor-pointer"
            >
              <LogOut className="w-4 h-4" />
            </button>

            <button
              type="button"
              onClick={() => setIsCollapsed(false)}
              title="Expand sidebar"
              className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-200 rounded-lg transition cursor-pointer"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop Sidebar */}
      <aside
        id="student-portal-sidebar"
        className={`hidden lg:block shrink-0 transition-all duration-300 self-start sticky top-20 ${
          isCollapsed ? 'w-20' : 'w-72'
        } bg-white border border-slate-200 rounded-2xl shadow-xs overflow-hidden`}
        style={{ maxHeight: 'calc(100vh - 6rem)' }}
      >
        {sidebarContent}
      </aside>

      {/* Mobile Drawer (Overlay) */}
      {isMobileOpen && (
        <div className="lg:hidden fixed inset-0 z-50 flex">
          {/* Backdrop */}
          <div
            className="fixed inset-0 bg-black/50 backdrop-blur-xs transition-opacity"
            onClick={() => setIsMobileOpen(false)}
          />

          {/* Drawer Panel */}
          <div className="relative w-72 max-w-[85vw] bg-white h-full shadow-2xl flex flex-col z-10 animate-in slide-in-from-left duration-200">
            <div className="flex items-center justify-between p-3 border-b border-slate-200 bg-[#18392B] text-white">
              <span className="font-serif font-bold text-sm">Student Portal Navigation</span>
              <button
                type="button"
                onClick={() => setIsMobileOpen(false)}
                className="p-1.5 hover:bg-white/10 rounded-lg transition cursor-pointer text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="flex-1 overflow-hidden">{sidebarContent}</div>
          </div>
        </div>
      )}
    </>
  );
};
