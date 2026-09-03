'use client';

import React from 'react';
import { usePCM } from '@/lib/store';
import { EnrollmentAdminSubTab } from '@/lib/types';
import {
  Users,
  GraduationCap,
  Clock,
  CheckCircle2,
  FileCheck,
  RotateCcw,
  BookOpen,
  DollarSign,
  AlertCircle,
  Calendar,
  Layers,
  ArrowRight,
  TrendingUp,
  ShieldCheck,
  Building,
} from 'lucide-react';

interface EnrollmentDashboardViewProps {
  onNavigateTab: (tab: EnrollmentAdminSubTab) => void;
}

export const EnrollmentDashboardView: React.FC<EnrollmentDashboardViewProps> = ({ onNavigateTab }) => {
  const {
    students,
    studentProfile,
    enrollments,
    preEnlistments,
    addDropRequests,
    academicPeriods,
    currentAcademicPeriod,
    classSections,
    feeStructure,
    calculateStudentAssessment,
    currentAdminUser,
    canPerformEnrollmentAction,
  } = usePCM();

  const allStudents = students.length > 0 ? students : [studentProfile];
  const activeStudents = allStudents.filter((s) => !s.isArchived && s.academicStatus !== 'Archived');
  const enrolledStudents = activeStudents.filter((s) => s.enrollmentStatus === 'Enrolled');

  // Pre-Enlistment metrics
  const pendingPreEnlistments = preEnlistments.filter((p) => p.status === 'Pending' || p.status === 'Under Review').length;
  const approvedPreEnlistments = preEnlistments.filter((p) => p.status === 'Approved').length;

  // Enrollment metrics
  const pendingEnrollments = enrollments.filter((e) => e.status === 'Submitted' || e.status === 'Under Review').length;
  const approvedEnrollments = enrollments.filter((e) => e.status === 'Approved').length;
  const returnedEnrollments = enrollments.filter((e) => e.status === 'Returned for Correction').length;

  // Add/Drop metrics
  const pendingAddDrop = addDropRequests.filter((r) => r.status === 'Pending').length;
  const approvedAddDrop = addDropRequests.filter((r) => r.status === 'Approved').length;

  // Units enrolled across all students
  const totalUnitsEnrolled = allStudents.reduce((acc, s) => {
    const units = (s.courses || [])
      .filter((c) => c.status !== 'Dropped')
      .reduce((sum, c) => sum + (c.units || 0), 0);
    return acc + units;
  }, 0);

  // Financial calculations
  let totalAssessed = 0;
  let totalPaid = 0;
  let totalOutstanding = 0;
  let paidAccountsCount = 0;
  let unpaidAccountsCount = 0;

  activeStudents.forEach((student) => {
    const assessment = calculateStudentAssessment(student.studentId || student.id);
    totalAssessed += assessment.totalAssessment;
    totalPaid += assessment.totalAmountPaid;
    totalOutstanding += assessment.currentAmountDue;
    if (assessment.currentAmountDue <= 0 && assessment.totalAssessment > 0) {
      paidAccountsCount++;
    } else {
      unpaidAccountsCount++;
    }
  });

  const activePeriod = currentAcademicPeriod || academicPeriods[0] || {
    academicYear: '2026–2027',
    semester: '1st Semester',
    status: 'Open',
  };

  const getStatusBadge = (status?: string) => {
    switch (status) {
      case 'Open':
        return 'bg-emerald-100 text-emerald-800 border-emerald-300';
      case 'Late Enrollment':
        return 'bg-amber-100 text-amber-800 border-amber-300';
      case 'Closed':
        return 'bg-rose-100 text-rose-800 border-rose-300';
      case 'Suspended':
        return 'bg-purple-100 text-purple-800 border-purple-300';
      default:
        return 'bg-blue-100 text-blue-800 border-blue-300';
    }
  };

  return (
    <div className="space-y-6">
      {/* Active Academic Term Banner */}
      <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-[#18392B] text-white flex items-center justify-center shrink-0 shadow-sm">
            <Calendar className="w-6 h-6 text-[#A3D9C9]" />
          </div>
          <div>
            <div className="flex items-center gap-2.5">
              <h2 className="text-lg font-bold text-slate-900 font-serif">
                {activePeriod.academicYear} &mdash; {activePeriod.semester}
              </h2>
              <span className={`text-xs px-2.5 py-0.5 rounded-full font-semibold border ${getStatusBadge(activePeriod.status)}`}>
                {activePeriod.status || 'Open'}
              </span>
              <span className="text-xs text-slate-500 bg-slate-100 px-2 py-0.5 rounded font-mono">
                Active Term
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Current institutional enrollment cycle. All student records, assessments, and pre-enlistment submissions are tracked for this term.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {canPerformEnrollmentAction('manage_periods') && (
            <button
              onClick={() => onNavigateTab('terms')}
              className="text-xs font-semibold px-3 py-2 rounded-lg bg-slate-100 text-slate-700 hover:bg-slate-200 transition flex items-center gap-1.5 cursor-pointer"
            >
              <Calendar className="w-3.5 h-3.5" />
              <span>Configure Academic Term</span>
            </button>
          )}
          {canPerformEnrollmentAction('manage_settings') && (
            <button
              onClick={() => onNavigateTab('policies')}
              className="text-xs font-semibold px-3 py-2 rounded-lg bg-[#18392B] text-white hover:bg-[#23523e] transition flex items-center gap-1.5 cursor-pointer shadow-xs"
            >
              <span>Enrollment Policies</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3 sm:gap-4">
        {/* Total Students */}
        <div
          onClick={() => onNavigateTab('students')}
          className="bg-white rounded-xl border border-slate-200 p-4 shadow-xs hover:border-slate-300 hover:shadow-sm transition cursor-pointer group"
        >
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-medium text-slate-600">Total Students</span>
            <Users className="w-4 h-4 text-slate-400 group-hover:text-[#18392B] transition" />
          </div>
          <div className="text-2xl font-bold text-slate-900">{activeStudents.length}</div>
          <div className="text-[11px] text-slate-500 mt-1 flex items-center justify-between">
            <span>{enrolledStudents.length} Officially Enrolled</span>
            <span className="text-xs text-[#18392B] font-semibold">&rarr;</span>
          </div>
        </div>

        {/* Pending Enrollments */}
        <div
          onClick={() => onNavigateTab('enrollment_workflow')}
          className="bg-white rounded-xl border border-amber-200 bg-amber-50/20 p-4 shadow-xs hover:border-amber-300 hover:shadow-sm transition cursor-pointer group"
        >
          <div className="flex items-center justify-between text-amber-700 mb-2">
            <span className="text-xs font-medium">Pending Enrollments</span>
            <Clock className="w-4 h-4 text-amber-500 group-hover:scale-110 transition" />
          </div>
          <div className="text-2xl font-bold text-amber-900">{pendingEnrollments}</div>
          <div className="text-[11px] text-amber-700 mt-1 flex items-center justify-between">
            <span>Needs Registrar Action</span>
            <span className="text-xs font-semibold">&rarr;</span>
          </div>
        </div>

        {/* Approved Enrollments */}
        <div
          onClick={() => onNavigateTab('enrollment_workflow')}
          className="bg-white rounded-xl border border-emerald-200 bg-emerald-50/20 p-4 shadow-xs hover:border-emerald-300 hover:shadow-sm transition cursor-pointer group"
        >
          <div className="flex items-center justify-between text-emerald-700 mb-2">
            <span className="text-xs font-medium">Approved Enrollments</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="text-2xl font-bold text-emerald-900">{approvedEnrollments}</div>
          <div className="text-[11px] text-emerald-700 mt-1 flex items-center justify-between">
            <span>COR Issued</span>
            <span className="text-xs font-semibold">&rarr;</span>
          </div>
        </div>

        {/* Pre-Enlistment */}
        <div
          onClick={() => onNavigateTab('pre_enlistment')}
          className="bg-white rounded-xl border border-blue-200 bg-blue-50/20 p-4 shadow-xs hover:border-blue-300 hover:shadow-sm transition cursor-pointer group"
        >
          <div className="flex items-center justify-between text-blue-700 mb-2">
            <span className="text-xs font-medium">Pre-Enlistments</span>
            <FileCheck className="w-4 h-4 text-blue-600" />
          </div>
          <div className="text-2xl font-bold text-blue-900">{preEnlistments.length}</div>
          <div className="text-[11px] text-blue-700 mt-1 flex items-center justify-between">
            <span>{pendingPreEnlistments} Pending Review</span>
            <span className="text-xs font-semibold">&rarr;</span>
          </div>
        </div>

        {/* Add/Drop Requests */}
        <div
          onClick={() => onNavigateTab('add_drop')}
          className="bg-white rounded-xl border border-purple-200 bg-purple-50/20 p-4 shadow-xs hover:border-purple-300 hover:shadow-sm transition cursor-pointer group"
        >
          <div className="flex items-center justify-between text-purple-700 mb-2">
            <span className="text-xs font-medium">Add / Drop Queue</span>
            <RotateCcw className="w-4 h-4 text-purple-600" />
          </div>
          <div className="text-2xl font-bold text-purple-900">{addDropRequests.length}</div>
          <div className="text-[11px] text-purple-700 mt-1 flex items-center justify-between">
            <span>{pendingAddDrop} Pending Review</span>
            <span className="text-xs font-semibold">&rarr;</span>
          </div>
        </div>

        {/* Total Units Enrolled */}
        <div
          onClick={() => onNavigateTab('subjects')}
          className="bg-white rounded-xl border border-slate-200 p-4 shadow-xs hover:border-slate-300 hover:shadow-sm transition cursor-pointer group"
        >
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-medium text-slate-600">Total Units Enrolled</span>
            <BookOpen className="w-4 h-4 text-slate-400 group-hover:text-[#18392B] transition" />
          </div>
          <div className="text-2xl font-bold text-slate-900">{totalUnitsEnrolled}</div>
          <div className="text-[11px] text-slate-500 mt-1 flex items-center justify-between">
            <span>{classSections.length} Active Sections</span>
            <span className="text-xs text-[#18392B] font-semibold">&rarr;</span>
          </div>
        </div>
      </div>

      {/* Financial Health Row */}
      <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between pb-4 border-b border-slate-100 gap-2">
          <div>
            <h3 className="font-serif font-bold text-slate-900 flex items-center gap-2">
              <DollarSign className="w-5 h-5 text-emerald-600" />
              <span>Enrollment Financial Summary &mdash; {activePeriod.academicYear}</span>
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Live tuition assessment, collections, and outstanding student receivables from Firebase.
            </p>
          </div>
          {canPerformEnrollmentAction('manage_fees') && (
            <div className="flex items-center gap-2">
              <button
                onClick={() => onNavigateTab('fees')}
                className="text-xs font-semibold px-3 py-1.5 rounded-lg border border-slate-200 text-slate-700 hover:bg-slate-50 transition cursor-pointer"
              >
                Fee Structure
              </button>
              <button
                onClick={() => onNavigateTab('ledger')}
                className="text-xs font-semibold px-3 py-1.5 rounded-lg bg-emerald-700 text-white hover:bg-emerald-800 transition cursor-pointer"
              >
                Payment Ledger
              </button>
            </div>
          )}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 pt-4">
          <div className="p-3.5 rounded-lg bg-slate-50 border border-slate-200">
            <span className="text-xs text-slate-500">Total Assessed Tuition & Fees</span>
            <div className="text-xl font-bold text-slate-900 mt-1">
              ₱{totalAssessed.toLocaleString()}
            </div>
            <span className="text-[11px] text-slate-400">Calculated from enrolled units & misc</span>
          </div>

          <div className="p-3.5 rounded-lg bg-emerald-50/50 border border-emerald-200">
            <span className="text-xs text-emerald-700 font-medium">Total Amount Collected</span>
            <div className="text-xl font-bold text-emerald-900 mt-1">
              ₱{totalPaid.toLocaleString()}
            </div>
            <span className="text-[11px] text-emerald-600">
              {totalAssessed > 0 ? `${Math.round((totalPaid / totalAssessed) * 100)}% collection rate` : 'No assessments'}
            </span>
          </div>

          <div className="p-3.5 rounded-lg bg-rose-50/50 border border-rose-200">
            <span className="text-xs text-rose-700 font-medium">Outstanding Balances</span>
            <div className="text-xl font-bold text-rose-900 mt-1">
              ₱{totalOutstanding.toLocaleString()}
            </div>
            <span className="text-[11px] text-rose-600">Unpaid student tuition ledger</span>
          </div>

          <div className="p-3.5 rounded-lg bg-blue-50/50 border border-blue-200 flex flex-col justify-between">
            <span className="text-xs text-blue-700 font-medium">Account Settlement Status</span>
            <div className="flex items-center gap-3 mt-1">
              <div>
                <span className="text-lg font-bold text-emerald-700">{paidAccountsCount}</span>
                <span className="text-[11px] text-slate-500 block">Fully Paid</span>
              </div>
              <div className="h-6 w-px bg-slate-300"></div>
              <div>
                <span className="text-lg font-bold text-amber-700">{unpaidAccountsCount}</span>
                <span className="text-[11px] text-slate-500 block">With Balance</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Quick Action Navigation Panels */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        {/* Registrar Quick Actions */}
        <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs space-y-3">
          <div className="flex items-center justify-between">
            <h4 className="font-semibold text-slate-900 text-sm flex items-center gap-2">
              <GraduationCap className="w-4 h-4 text-[#18392B]" />
              <span>Enrollment & Registrar</span>
            </h4>
            <span className="text-[10px] bg-slate-100 text-slate-600 font-semibold px-2 py-0.5 rounded">
              Workflow
            </span>
          </div>
          <p className="text-xs text-slate-500">
            Review student admissions, evaluate course loads, process adding/dropping, and generate official registration cards.
          </p>
          <div className="space-y-1.5 pt-1">
            <button
              onClick={() => onNavigateTab('enrollment_workflow')}
              className="w-full text-left px-3 py-2 rounded-lg bg-slate-50 hover:bg-slate-100 text-xs text-slate-700 font-medium flex items-center justify-between transition cursor-pointer"
            >
              <span>Review Pending Enrollments</span>
              <span className="bg-amber-100 text-amber-800 text-[10px] font-bold px-1.5 py-0.5 rounded">
                {pendingEnrollments}
              </span>
            </button>
            <button
              onClick={() => onNavigateTab('pre_enlistment')}
              className="w-full text-left px-3 py-2 rounded-lg bg-slate-50 hover:bg-slate-100 text-xs text-slate-700 font-medium flex items-center justify-between transition cursor-pointer"
            >
              <span>Pre-Enlistment Submissions</span>
              <span className="bg-blue-100 text-blue-800 text-[10px] font-bold px-1.5 py-0.5 rounded">
                {pendingPreEnlistments}
              </span>
            </button>
            <button
              onClick={() => onNavigateTab('add_drop')}
              className="w-full text-left px-3 py-2 rounded-lg bg-slate-50 hover:bg-slate-100 text-xs text-slate-700 font-medium flex items-center justify-between transition cursor-pointer"
            >
              <span>Adding & Dropping Requests</span>
              <span className="bg-purple-100 text-purple-800 text-[10px] font-bold px-1.5 py-0.5 rounded">
                {pendingAddDrop}
              </span>
            </button>
          </div>
        </div>

        {/* Academics & Schedules */}
        <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs space-y-3">
          <div className="flex items-center justify-between">
            <h4 className="font-semibold text-slate-900 text-sm flex items-center gap-2">
              <BookOpen className="w-4 h-4 text-[#18392B]" />
              <span>Academics & Schedules</span>
            </h4>
            <span className="text-[10px] bg-slate-100 text-slate-600 font-semibold px-2 py-0.5 rounded">
              Curriculum
            </span>
          </div>
          <p className="text-xs text-slate-500">
            Maintain course catalog, manage class sections, set classroom venues, and balance instructor faculty assignments.
          </p>
          <div className="space-y-1.5 pt-1">
            <button
              onClick={() => onNavigateTab('subjects')}
              className="w-full text-left px-3 py-2 rounded-lg bg-slate-50 hover:bg-slate-100 text-xs text-slate-700 font-medium flex items-center justify-between transition cursor-pointer"
            >
              <span>Subjects & Courses Catalog</span>
              <span className="text-slate-400 text-xs">&rarr;</span>
            </button>
            <button
              onClick={() => onNavigateTab('sections')}
              className="w-full text-left px-3 py-2 rounded-lg bg-slate-50 hover:bg-slate-100 text-xs text-slate-700 font-medium flex items-center justify-between transition cursor-pointer"
            >
              <span>Class Sections & Room Schedules</span>
              <span className="text-slate-400 text-xs">&rarr;</span>
            </button>
            <button
              onClick={() => onNavigateTab('instructors')}
              className="w-full text-left px-3 py-2 rounded-lg bg-slate-50 hover:bg-slate-100 text-xs text-slate-700 font-medium flex items-center justify-between transition cursor-pointer"
            >
              <span>Faculty & Instructor Roster</span>
              <span className="text-slate-400 text-xs">&rarr;</span>
            </button>
          </div>
        </div>

        {/* Finance & System Config */}
        <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs space-y-3">
          <div className="flex items-center justify-between">
            <h4 className="font-semibold text-slate-900 text-sm flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-[#18392B]" />
              <span>Finance & Governance</span>
            </h4>
            <span className="text-[10px] bg-slate-100 text-slate-600 font-semibold px-2 py-0.5 rounded">
              Administration
            </span>
          </div>
          <p className="text-xs text-slate-500">
            Manage tuition rate per unit, miscellaneous fees, scholarships, payment posting with official receipts, and audit trails.
          </p>
          <div className="space-y-1.5 pt-1">
            <button
              onClick={() => onNavigateTab('fees')}
              className="w-full text-left px-3 py-2 rounded-lg bg-slate-50 hover:bg-slate-100 text-xs text-slate-700 font-medium flex items-center justify-between transition cursor-pointer"
            >
              <span>Institutional Fee Schedule</span>
              <span className="text-slate-400 text-xs">&rarr;</span>
            </button>
            <button
              onClick={() => onNavigateTab('ledger')}
              className="w-full text-left px-3 py-2 rounded-lg bg-slate-50 hover:bg-slate-100 text-xs text-slate-700 font-medium flex items-center justify-between transition cursor-pointer"
            >
              <span>Student Accounts & Ledgers</span>
              <span className="text-slate-400 text-xs">&rarr;</span>
            </button>
            <button
              onClick={() => onNavigateTab('audit')}
              className="w-full text-left px-3 py-2 rounded-lg bg-slate-50 hover:bg-slate-100 text-xs text-slate-700 font-medium flex items-center justify-between transition cursor-pointer"
            >
              <span>Enrollment Audit Trail</span>
              <span className="text-slate-400 text-xs">&rarr;</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
