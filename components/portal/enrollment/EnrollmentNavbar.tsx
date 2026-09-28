'use client';

import React from 'react';
import {
  User,
  ListPlus,
  GraduationCap,
  ArrowLeftRight,
  Calculator,
  Receipt,
  CheckCircle2,
  Clock,
} from 'lucide-react';
import { EnrollmentSubmenuTab } from '@/lib/types';
import { usePCM } from '@/lib/store';

interface EnrollmentNavbarProps {
  activeTab: EnrollmentSubmenuTab;
  onTabChange: (tab: EnrollmentSubmenuTab) => void;
}

export const EnrollmentNavbar: React.FC<EnrollmentNavbarProps> = ({
  activeTab,
  onTabChange,
}) => {
  const { preEnlistments, addDropRequests, studentProfile } = usePCM();

  const studentPreEnlistment = preEnlistments.find(
    (p) => p.studentId === studentProfile.studentId
  );
  const pendingAddDropCount = addDropRequests.filter(
    (r) => r.studentId === studentProfile.studentId && r.status === 'Pending'
  ).length;

  const menuItems: {
    id: EnrollmentSubmenuTab;
    label: string;
    icon: React.ReactNode;
    badge?: string;
    badgeColor?: string;
  }[] = [
    {
      id: 'profile',
      label: 'Student Profile',
      icon: <User className="w-4 h-4" />,
    },
    {
      id: 'pre-enlistment',
      label: 'Pre-enlistment',
      icon: <ListPlus className="w-4 h-4" />,
      badge: studentPreEnlistment?.status || 'Active',
      badgeColor:
        studentPreEnlistment?.status === 'Approved'
          ? 'bg-emerald-500 text-white'
          : studentPreEnlistment?.status === 'Submitted'
          ? 'bg-amber-400 text-slate-950'
          : 'bg-purple-200 text-purple-900',
    },
    {
      id: 'enrollment',
      label: 'Enrollment',
      icon: <GraduationCap className="w-4 h-4" />,
      badge: studentProfile.enrollmentStatus || 'Enrolled',
      badgeColor: 'bg-emerald-500 text-white',
    },
    {
      id: 'add-drop',
      label: 'Adding & Dropping',
      icon: <ArrowLeftRight className="w-4 h-4" />,
      badge: pendingAddDropCount > 0 ? `${pendingAddDropCount} Pending` : undefined,
      badgeColor: 'bg-amber-500 text-white',
    },
    {
      id: 'assessment',
      label: 'Assessment',
      icon: <Calculator className="w-4 h-4" />,
    },
    {
      id: 'amount-due',
      label: 'Amount Due',
      icon: <Receipt className="w-4 h-4" />,
      badge: studentProfile.tuitionBalance && studentProfile.tuitionBalance > 0 ? `₱${studentProfile.tuitionBalance.toLocaleString()}` : 'Cleared',
      badgeColor: studentProfile.tuitionBalance && studentProfile.tuitionBalance > 0 ? 'bg-rose-500 text-white' : 'bg-emerald-500 text-white',
    },
  ];

  return (
    <nav
      id="pcm-enrollment-submenu-nav"
      aria-label="Enrollment Submenu Navigation"
      className="bg-white rounded-2xl border border-slate-200 shadow-xs p-2 sm:p-2.5 overflow-hidden"
    >
      <div className="flex items-center gap-1.5 sm:gap-2 overflow-x-auto no-scrollbar scroll-smooth">
        {menuItems.map((item) => {
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              id={`enrollment-subtab-${item.id}`}
              onClick={() => onTabChange(item.id)}
              type="button"
              className={`flex items-center gap-2 px-3.5 sm:px-4 py-2.5 rounded-xl text-xs sm:text-sm font-semibold whitespace-nowrap transition-all duration-200 cursor-pointer select-none ${
                isActive
                  ? 'bg-[#6D28D9] text-white shadow-md shadow-purple-900/20 ring-2 ring-purple-400/40'
                  : 'bg-slate-50/80 text-slate-700 hover:text-purple-900 hover:bg-purple-50/60 border border-slate-200/80'
              }`}
            >
              <span className={isActive ? 'text-white' : 'text-slate-500'}>
                {item.icon}
              </span>
              <span>{item.label}</span>
              {item.badge && (
                <span
                  className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded-full ${
                    isActive
                      ? 'bg-white/25 text-white'
                      : item.badgeColor || 'bg-slate-200 text-slate-700'
                  }`}
                >
                  {item.badge}
                </span>
              )}
            </button>
          );
        })}
      </div>
    </nav>
  );
};
