'use client';

import React, { useState } from 'react';
import { usePCM } from '@/lib/store';
import { EnrollmentAdminSubTab } from '@/lib/types';
import { EnrollmentDashboardView } from '@/components/admin/enrollment/EnrollmentDashboardView';
import { StudentProfilesAdminView } from '@/components/admin/enrollment/StudentProfilesAdminView';
import { PreEnlistmentAdminView } from '@/components/admin/enrollment/PreEnlistmentAdminView';
import { EnrollmentWorkflowAdminView } from '@/components/admin/enrollment/EnrollmentWorkflowAdminView';
import { AddDropAdminView } from '@/components/admin/enrollment/AddDropAdminView';
import { AcademicTermsAdminView } from '@/components/admin/enrollment/AcademicTermsAdminView';
import { SubjectsCatalogAdminView } from '@/components/admin/enrollment/SubjectsCatalogAdminView';
import { SectionsScheduleAdminView } from '@/components/admin/enrollment/SectionsScheduleAdminView';
import { InstructorsAdminView } from '@/components/admin/enrollment/InstructorsAdminView';
import { FeesAssessmentAdminView } from '@/components/admin/enrollment/FeesAssessmentAdminView';
import { EnrollmentSettingsAdminView } from '@/components/admin/enrollment/EnrollmentSettingsAdminView';

import {
  LayoutDashboard,
  Users,
  FileCheck,
  GraduationCap,
  RotateCcw,
  Calendar,
  BookOpen,
  Layers,
  Briefcase,
  DollarSign,
  Settings,
  ShieldCheck,
  Sparkles,
} from 'lucide-react';

interface SubTabItem {
  id: EnrollmentAdminSubTab;
  label: string;
  icon: React.ElementType;
  badge?: number;
  badgeColor?: string;
}

export const AdminEnrollmentsTab: React.FC = () => {
  const {
    enrollments,
    preEnlistments,
    addDropRequests,
    currentAcademicPeriod,
    currentAdminUser,
    currentUserAccount,
    canPerformEnrollmentAction,
  } = usePCM();

  const [activeSubTab, setActiveSubTab] = useState<EnrollmentAdminSubTab>('dashboard');

  // Pending counts for badges
  const pendingEnrollments = enrollments.filter(
    (e) => e.status === 'Submitted' || e.status === 'Under Review'
  ).length;
  const pendingPreEnlistments = preEnlistments.filter(
    (p) => p.status === 'Pending' || p.status === 'Under Review'
  ).length;
  const pendingAddDrop = addDropRequests.filter((r) => r.status === 'Pending').length;

  const subTabs: SubTabItem[] = [
    {
      id: 'dashboard',
      label: 'Dashboard Overview',
      icon: LayoutDashboard,
    },
    {
      id: 'students',
      label: 'Student Profiles',
      icon: Users,
    },
    {
      id: 'pre-enlistment',
      label: 'Pre-Enlistment',
      icon: FileCheck,
      badge: pendingPreEnlistments,
      badgeColor: 'bg-blue-600',
    },
    {
      id: 'enrollments',
      label: 'Enrollment Queue',
      icon: GraduationCap,
      badge: pendingEnrollments,
      badgeColor: 'bg-emerald-600',
    },
    {
      id: 'add-drop',
      label: 'Adding & Dropping',
      icon: RotateCcw,
      badge: pendingAddDrop,
      badgeColor: 'bg-purple-600',
    },
    {
      id: 'academic-periods',
      label: 'Academic Terms',
      icon: Calendar,
    },
    {
      id: 'subjects',
      label: 'Curriculum & Courses',
      icon: BookOpen,
    },
    {
      id: 'sections',
      label: 'Sections & Schedules',
      icon: Layers,
    },
    {
      id: 'instructors',
      label: 'Faculty Directory',
      icon: Briefcase,
    },
    {
      id: 'fees',
      label: 'Tuition & Fee Policy',
      icon: DollarSign,
    },
    {
      id: 'settings',
      label: 'System Governance',
      icon: Settings,
    },
  ];

  const effectiveRole = currentAdminUser?.role || currentUserAccount?.role || 'Admin';

  return (
    <div className="space-y-6">
      {/* Master Top Header with Active Academic Term & Role indicator */}
      <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-[10px] bg-[#18392B] text-white px-2.5 py-0.5 rounded-full font-bold uppercase tracking-wider font-mono">
              Registrar & Admissions CMS
            </span>
            {currentAcademicPeriod && (
              <span className="text-[10px] bg-emerald-50 text-emerald-800 border border-emerald-300 px-2 py-0.5 rounded-full font-semibold">
                Active: {currentAcademicPeriod.academicYear} &bull; {currentAcademicPeriod.semester}
              </span>
            )}
          </div>
          <h2 className="font-serif text-2xl font-bold text-slate-900 flex items-center gap-2">
            <GraduationCap className="w-7 h-7 text-[#18392B]" />
            <span>Admin Enrollment Management System</span>
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Full institutional authority over student records, course pre-enlistment, section allocations, grading, and tuition assessment.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="text-right">
            <span className="text-[11px] text-slate-400 block font-mono">Authenticated Operator</span>
            <span className="text-xs font-bold text-slate-900 block">
              {currentAdminUser?.name || currentUserAccount?.name || 'Authorized Admin'}
            </span>
            <span className="inline-block text-[10px] font-semibold text-emerald-800 bg-emerald-100 px-2 py-0.5 rounded border border-emerald-300">
              Role: {effectiveRole}
            </span>
          </div>
        </div>
      </div>

      {/* Horizontal Submenu Bar */}
      <div className="bg-white rounded-xl border border-slate-200 p-1.5 shadow-xs overflow-x-auto">
        <nav className="flex items-center gap-1 min-w-max">
          {subTabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeSubTab === tab.id;

            return (
              <button
                key={tab.id}
                onClick={() => setActiveSubTab(tab.id)}
                className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-semibold transition cursor-pointer relative whitespace-nowrap ${
                  isActive
                    ? 'bg-[#18392B] text-white shadow-xs'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                }`}
              >
                <Icon className={`w-4 h-4 ${isActive ? 'text-[#A3D9C9]' : 'text-slate-500'}`} />
                <span>{tab.label}</span>

                {typeof tab.badge === 'number' && tab.badge > 0 && (
                  <span
                    className={`ml-1 px-1.5 py-0.2 rounded-full text-[10px] font-mono font-bold text-white ${
                      isActive ? 'bg-white/30 text-white' : tab.badgeColor || 'bg-slate-700'
                    }`}
                  >
                    {tab.badge}
                  </span>
                )}
              </button>
            );
          })}
        </nav>
      </div>

      {/* Active Sub-Tab Canvas */}
      <div className="animate-in fade-in duration-150">
        {activeSubTab === 'dashboard' && (
          <EnrollmentDashboardView onNavigateTab={(tab) => setActiveSubTab(tab)} />
        )}

        {activeSubTab === 'students' && <StudentProfilesAdminView />}

        {activeSubTab === 'pre-enlistment' && <PreEnlistmentAdminView />}

        {activeSubTab === 'enrollments' && <EnrollmentWorkflowAdminView />}

        {activeSubTab === 'add-drop' && <AddDropAdminView />}

        {activeSubTab === 'academic-periods' && <AcademicTermsAdminView />}

        {activeSubTab === 'subjects' && <SubjectsCatalogAdminView />}

        {activeSubTab === 'sections' && <SectionsScheduleAdminView />}

        {activeSubTab === 'instructors' && <InstructorsAdminView />}

        {activeSubTab === 'fees' && <FeesAssessmentAdminView />}

        {activeSubTab === 'settings' && <EnrollmentSettingsAdminView />}
      </div>
    </div>
  );
};
