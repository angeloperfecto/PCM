'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { collection, doc, limit, onSnapshot, orderBy, query, updateDoc } from 'firebase/firestore';
import { usePCM } from '@/lib/store';
import { StudentAvatar } from '@/components/common/StudentAvatar';
import { StudentAccountPayments } from './StudentAccountPayments';
import { downloadExcel, excelFileName } from '@/lib/excelExport';
import { canEditPayments, correctApplicationPayment } from '@/lib/paymentAdmin';
import { StudentRecordPanel } from './StudentRecordPanel';
import type { StudentProfile } from '@/lib/types';
import { accountSummary } from '@/lib/studentLedger';
import { db } from '@/lib/firebase';
import { Application } from '@/lib/types';
import {
  NOTE_REQUIRED_STATUSES,
  STAFF_TRANSITIONS,
  STATUS_LABELS,
  TRACKER_STAGES,
  WorkflowStatus,
  finalVerificationChecklist,
  normalizeStatus,
  statusLabel,
  
  summarizeRequirements,
  transitionBlocker,
  verifiedPaymentTotal,
  canFinalizeEnrollment,
  admissionRequirementTemplates,
  missingRequirements,
  type RequirementTemplate,
} from '@/lib/enrollmentWorkflow';
import {
  addMissingRequirements,
  EDITABLE_APPLICANT_FIELDS,
  addRequirement,
  createRequirementChecklist,
  deleteApplicationCompletely,
  finalizeEnrollment,
  requestMissingRequirements,
  reviewPayment,
  reviewRequirement,
  saveAssessment,
  transitionApplication,
  updateApplicantDetails,
  waivePayment,
  recordStaffPayment,
  acceptVerifiedPayment,
  continueAssessedApplication,
} from '@/lib/admissionsService';
import { StaffPaymentSection } from '@/components/enrollment/PaymentSection';
import { ApplicationProgress, StatusBadge } from '@/components/enrollment/ApplicationProgress';
import { RequirementsChecklist } from '@/components/enrollment/RequirementsChecklist';
import { useApplicationDetails } from '@/components/enrollment/useApplicationDetails';
import {
  Bell,
  CheckCircle2,
  Download,
  FileCheck,
  GraduationCap,
  History,
  Lock,
  MessageSquare,
  Search,
  ShieldAlert,
  Trash2,
  X,
} from 'lucide-react';

interface StaffNotification {
  id: string;
  applicationId?: string;
  referenceNumber?: string;
  title: string;
  message: string;
  createdAt: string;
  read?: boolean;
}

const OUTCOME_STATUSES: WorkflowStatus[] = ['For Correction', 'Rejected', 'Deferred', 'Withdrawn'];
const ALL_STATUSES: WorkflowStatus[] = [...TRACKER_STAGES.map((s) => s.status), ...OUTCOME_STATUSES];

// Statuses where the next move is the Admissions Office's.
const NEEDS_STAFF_ACTION: WorkflowStatus[] = ['Submitted', 'Under Review', 'For Admission Approval', 'Admitted', 'For Assessment', 'For Enrollment'];

const needsStaffAction = (a: Application) =>
  NEEDS_STAFF_ACTION.includes(normalizeStatus(a.status)) || isPaymentToVerify(a);

const isPaymentToVerify = (a: Application) => normalizeStatus(a.status) === 'For Payment' && a.paymentStatus === 'Submitted';


// Admissions & Enrollment dashboard: every application from submission to enrollment.
// Decisions are limited to the Registrar, Admin and Super Admin (also enforced by
// firestore.rules); other admin roles can view.
// The student record created when Admissions finalized this application. Once a student is
// enrolled, that record (kept up to date by the student and the Registrar) is the source of truth
// for their details; the application keeps what was submitted.
function linkedStudent(app: { studentRecordId?: string; studentId?: string; referenceNumber?: string } | null, students: StudentProfile[]): StudentProfile | null {
  if (!app) return null;
  return (
    (app.studentRecordId ? students.find((s) => s.id === app.studentRecordId) : undefined) ||
    (app.studentId ? students.find((s) => s.studentId === app.studentId) : undefined) ||
    (app.referenceNumber ? students.find((s) => s.applicationNumber === app.referenceNumber || s.referenceNumber === app.referenceNumber) : undefined) ||
    null
  );
}

export const AdminApplicationsTab: React.FC<{ onOpenEnrollment?: () => void }> = ({ onOpenEnrollment }) => {
  const {
    applications,
    programs,
    canDecideAdmissions,
    canVerifyPayments,
    admissionsActor,
    addToast,
    addApplicationNote,
    enrollmentSystemConfig,
    feeStructure,
    isUserDeleted,
    removeDeletedUserRecord,
    students,
  } = usePCM();
  const liveName = (a: any) => linkedStudent(a, students)?.fullName || a.fullName;

  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'action' | 'payments' | WorkflowStatus>('all');
  const [programFilter, setProgramFilter] = useState('all');
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [staffNotes, setStaffNotes] = useState<StaffNotification[]>([]);
  const [deleteTarget, setDeleteTarget] = useState<Application | null>(null);

  // Latest staff alerts (new applications, uploaded documents).
  useEffect(() => {
    const q = query(collection(db, 'staffNotifications'), orderBy('createdAt', 'desc'), limit(15));
    return onSnapshot(
      q,
      (snap) => setStaffNotes(snap.docs.map((d) => ({ id: d.id, ...d.data() }) as StaffNotification)),
      (e) => console.warn('Staff notifications notice:', e)
    );
  }, []);

  const counts = useMemo(() => {
    const c: Record<string, number> = {};
    ALL_STATUSES.forEach((s) => (c[s] = 0));
    applications.forEach((a) => (c[normalizeStatus(a.status)] = (c[normalizeStatus(a.status)] || 0) + 1));
    return c;
  }, [applications]);

  const programNames = useMemo(
    () => Array.from(new Set(applications.map((a) => a.programName || a.program || '').filter(Boolean))).sort(),
    [applications]
  );

  const filtered = useMemo(() => {
    const q = search.toLowerCase().trim();
    return applications
      .filter((a) => {
        const s = normalizeStatus(a.status);
        if (statusFilter === 'action' && !needsStaffAction(a)) return false;
        if (statusFilter === 'payments' && !isPaymentToVerify(a)) return false;
        if (statusFilter !== 'all' && statusFilter !== 'action' && statusFilter !== 'payments' && s !== statusFilter) return false;
        if (programFilter !== 'all' && (a.programName || a.program) !== programFilter) return false;
        if (!q) return true;
        return [a.fullName, linkedStudent(a as any, students)?.fullName, a.email, a.referenceNumber, a.studentId, a.phone]
          .filter(Boolean)
          .some((v) => String(v).toLowerCase().includes(q));
      })
      .sort((a, b) => (b.updatedAt || b.createdAt || '').localeCompare(a.updatedAt || a.createdAt || ''));
  }, [applications, search, statusFilter, programFilter, students]);

  const selected = applications.find((a) => a.id === selectedId) || null;
  const unreadAlerts = staffNotes.filter((n) => !n.read).length;

  const [exporting, setExporting] = useState(false);
  const runExport = async (fn: () => Promise<void>) => {
    setExporting(true);
    try {
      await fn();
    } catch (e) {
      console.warn('Export notice:', e);
      addToast('error', 'Export failed', 'The Excel file could not be created. Please try again.');
    } finally {
      setExporting(false);
    }
  };
  const filterLabel =
    statusFilter === 'all' ? 'All statuses' : statusFilter === 'action' ? 'Needs action' : statusFilter === 'payments' ? 'Payments to verify' : STATUS_LABELS[statusFilter as WorkflowStatus];

  const exportApplications = () =>
    runExport(() =>
      downloadExcel(
        excelFileName('PCM_Admissions'),
        [
          {
            name: 'Applications',
            title: 'Admissions — Application List',
            details: [
              `Filter: ${filterLabel} · ${programFilter === 'all' ? 'All programs' : programFilter}${search.trim() ? ` · Search “${search.trim()}”` : ''}`,
              `${filtered.length} application${filtered.length === 1 ? '' : 's'}`,
            ],
            columns: [
              { header: 'Reference', key: 'ref' },
              { header: 'Full name', key: 'name' },
              { header: 'Email', key: 'email' },
              { header: 'Phone', key: 'phone' },
              { header: 'Program', key: 'program' },
              { header: 'Status', key: 'status' },
              { header: 'Assessment total', key: 'total', type: 'currency' },
              { header: 'Downpayment', key: 'minimum', type: 'currency' },
              { header: 'Verified payments', key: 'paid', type: 'currency' },
              { header: 'Payment status', key: 'paymentStatus' },
              { header: 'Student ID', key: 'studentId' },
              { header: 'Submitted', key: 'submitted', type: 'datetime' },
              { header: 'Last updated', key: 'updated', type: 'datetime' },
              { header: 'Last decision by', key: 'decidedBy' },
            ],
            rows: filtered.map((a) => ({
              ref: a.referenceNumber,
              name: liveName(a),
              email: a.email,
              phone: a.phone,
              program: a.programName || a.program,
              status: STATUS_LABELS[normalizeStatus(a.status)],
              total: a.assessment?.total,
              minimum: a.assessment?.minimumPayment,
              paid: a.amountPaidVerified,
              paymentStatus: a.paymentStatus || '',
              studentId: a.studentId && normalizeStatus(a.status) === 'Enrolled' ? a.studentId : '',
              submitted: a.submissionDate || a.createdAt,
              updated: a.updatedAt,
              decidedBy: a.lastDecisionBy,
            })),
            totals: { ref: 'Total', total: 'sum', minimum: 'sum', paid: 'sum' },
          },
        ],
        { generatedBy: admissionsActor().name }
      )
    );

  const exportSummary = () => {
    const byProgram = new Map<string, Record<string, number>>();
    applications.forEach((a) => {
      const p = a.programName || a.program || 'Unspecified';
      const row = byProgram.get(p) || {};
      const s = normalizeStatus(a.status);
      row[s] = (row[s] || 0) + 1;
      byProgram.set(p, row);
    });
    const statusKey = (s: string) => `s_${s.replace(/[^a-z0-9]/gi, '_')}`;
    const rows = [...byProgram.entries()]
      .sort((a, b) => a[0].localeCompare(b[0]))
      .map(([p, row]) => ({ program: p, ...Object.fromEntries(ALL_STATUSES.map((s) => [statusKey(s), row[s] || 0])), total: ALL_STATUSES.reduce((t, s) => t + (row[s] || 0), 0) }));
    return runExport(() =>
      downloadExcel(
        excelFileName('PCM_Enrollment_Report'),
        [
          {
            name: 'Enrollment Report',
            title: 'Admissions & Enrollment Report — Applications by Program and Status',
            details: [`${applications.length} application${applications.length === 1 ? '' : 's'} in ${byProgram.size} program${byProgram.size === 1 ? '' : 's'}`],
            columns: [
              { header: 'Program', key: 'program' },
              ...ALL_STATUSES.map((s) => ({ header: STATUS_LABELS[s], key: statusKey(s), type: 'integer' as const })),
              { header: 'Total', key: 'total', type: 'integer' as const },
            ],
            rows,
            totals: { program: 'All programs', ...Object.fromEntries(ALL_STATUSES.map((s) => [statusKey(s), 'sum'])), total: 'sum' },
          },
        ],
        { generatedBy: admissionsActor().name }
      )
    );
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col justify-between gap-4 rounded-2xl border border-slate-200 bg-white p-5 shadow-xs sm:flex-row sm:items-center">
        <div className="flex items-center gap-3.5">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-[#18392B] text-emerald-300 shadow-md">
            <FileCheck className="h-6 w-6" />
          </div>
          <div>
            <h2 className="font-serif text-xl font-bold text-[#18392B] sm:text-2xl">Admissions Review</h2>
            <p className="text-xs text-slate-500">Applications from submission to official enrollment. Select a stage or card to filter the list.</p>
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          <button type="button" onClick={exportApplications} className="inline-flex items-center gap-1.5 rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50">
            <Download className="h-3.5 w-3.5" /> {exporting ? 'Preparing…' : 'Export list (Excel)'}
          </button>
          <button type="button" onClick={exportSummary} className="inline-flex items-center gap-1.5 rounded-lg bg-[#18392B] px-3 py-2 text-xs font-semibold text-white hover:bg-[#23533e]">
            <Download className="h-3.5 w-3.5" /> {exporting ? 'Preparing…' : 'Enrollment report (Excel)'}
          </button>
        </div>
      </div>

      {!canDecideAdmissions && (
        <div className="flex items-start gap-2 rounded-xl border border-amber-200 bg-amber-50 p-3 text-xs text-amber-900">
          <Lock className="mt-0.5 h-4 w-4 shrink-0" />
          <span>
            {canVerifyPayments
              ? 'You can view applications and verify enrollment payments. Admission decisions, document verification and enrollment confirmation are handled by the Registrar, Admin or Super Admin.'
              : 'You can view applications. Admission decisions, document verification and enrollment are handled by the Registrar, Admin or Super Admin.'}
          </span>
        </div>
      )}

      {/* Key figures */}
      {(() => {
        const closed = ['Enrolled', 'Rejected', 'Withdrawn', 'Deferred'];
        const inProgress = applications.filter((a) => !closed.includes(normalizeStatus(a.status))).length;
        const kpis: { key: string; label: string; value: number; hint: string; tone: string; active: boolean; onClick: () => void }[] = [
          { key: 'action', label: 'Needs action', value: applications.filter(needsStaffAction).length, hint: 'Waiting for staff', tone: 'amber', active: statusFilter === 'action', onClick: () => setStatusFilter(statusFilter === 'action' ? 'all' : 'action') },
          { key: 'payments', label: 'Payments to verify', value: applications.filter(isPaymentToVerify).length, hint: 'Reported by applicants', tone: 'yellow', active: statusFilter === 'payments', onClick: () => setStatusFilter(statusFilter === 'payments' ? 'all' : 'payments') },
          { key: 'progress', label: 'In progress', value: inProgress, hint: 'Open applications', tone: 'sky', active: false, onClick: () => setStatusFilter('all') },
          { key: 'Enrolled', label: 'Officially enrolled', value: counts['Enrolled'] || 0, hint: 'Student record created', tone: 'emerald', active: statusFilter === 'Enrolled', onClick: () => setStatusFilter(statusFilter === 'Enrolled' ? 'all' : ('Enrolled' as any)) },
        ];
        const toneCls: Record<string, string> = {
          amber: 'text-amber-700 border-amber-300 bg-amber-50',
          yellow: 'text-yellow-800 border-yellow-300 bg-yellow-50',
          sky: 'text-sky-800 border-sky-300 bg-sky-50',
          emerald: 'text-emerald-800 border-emerald-300 bg-emerald-50',
        };
        const pipeline: { label: string; statuses: string[] }[] = [
          { label: 'Intake', statuses: ['Submitted', 'Under Review', 'Requirements Incomplete', 'For Correction'] },
          { label: 'Admission decision', statuses: ['For Admission Approval', 'Admitted'] },
          { label: 'Enrollment steps', statuses: ['For Registration', 'For Assessment', 'For Payment', 'For Enrollment'] },
          { label: 'Outcome', statuses: ['Enrolled', 'Rejected', 'Deferred', 'Withdrawn'] },
        ];
        return (
          <>
            <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
              {kpis.map((k) => (
                <button
                  key={k.key}
                  type="button"
                  onClick={k.onClick}
                  aria-pressed={k.active}
                  className={`rounded-2xl border bg-white p-4 text-left shadow-xs transition hover:shadow-sm ${k.active ? toneCls[k.tone] : 'border-slate-200'}`}
                >
                  <span className={`block text-[10px] font-bold uppercase tracking-wider ${toneCls[k.tone].split(' ')[0]}`}>{k.label}</span>
                  <span className="mt-1 block font-serif text-3xl font-bold text-slate-900">{k.value}</span>
                  <span className="text-[11px] text-slate-500">{k.hint}</span>
                </button>
              ))}
            </div>

            <section aria-label="Application pipeline" className="rounded-2xl border border-slate-200 bg-white p-4 shadow-xs">
              <div className="mb-3 flex items-center justify-between">
                <h3 className="text-sm font-bold text-[#18392B]">Pipeline by stage</h3>
                {statusFilter !== 'all' && (
                  <button type="button" onClick={() => setStatusFilter('all')} className="text-xs font-semibold text-[#18392B] underline">
                    Show all
                  </button>
                )}
              </div>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
                {pipeline.map((g, gi) => (
                  <div key={g.label}>
                    <p className="mb-1.5 flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-[0.14em] text-slate-400">
                      <span className="flex h-4 w-4 items-center justify-center rounded-full bg-slate-100 text-[9px] text-slate-500">{gi + 1}</span>
                      {g.label}
                    </p>
                    <ul className="space-y-1">
                      {g.statuses
                        .filter((st) => (ALL_STATUSES as string[]).includes(st))
                        .map((st) => {
                          const n = counts[st] || 0;
                          const active = statusFilter === st;
                          return (
                            <li key={st}>
                              <button
                                type="button"
                                onClick={() => setStatusFilter(active ? 'all' : (st as any))}
                                aria-pressed={active}
                                className={`flex w-full items-center justify-between rounded-lg px-2.5 py-1.5 text-left text-xs transition ${
                                  active ? 'bg-[#18392B] text-white' : n > 0 ? 'text-slate-800 hover:bg-slate-50' : 'text-slate-400 hover:bg-slate-50'
                                }`}
                              >
                                <span className="truncate">{STATUS_LABELS[st as keyof typeof STATUS_LABELS] || st}</span>
                                <span
                                  className={`ml-2 min-w-[1.5rem] rounded-full px-1.5 text-center font-mono text-[11px] font-bold ${
                                    active ? 'bg-white/20 text-white' : n > 0 ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-100 text-slate-400'
                                  }`}
                                >
                                  {n}
                                </span>
                              </button>
                            </li>
                          );
                        })}
                    </ul>
                  </div>
                ))}
              </div>
            </section>
          </>
        );
      })()}

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-[minmax(0,1fr)_320px]">
        <div className="min-w-0 space-y-3">
          <div className="flex flex-col gap-2 rounded-2xl border border-slate-200 bg-white p-3 shadow-xs sm:flex-row">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <input
                type="search"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search name, email, reference or Student ID"
                aria-label="Search applications"
                className="w-full rounded-lg border border-slate-300 bg-white py-2 pl-9 pr-3 text-sm focus:border-[#588B76] focus:outline-none"
              />
            </div>
            <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value as any)} aria-label="Filter by status" className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm">
              <option value="all">All statuses</option>
              <option value="action">Needs action</option>
              <option value="payments">Payments to verify</option>
              {ALL_STATUSES.map((s) => (
                <option key={s} value={s}>{STATUS_LABELS[s]}</option>
              ))}
            </select>
            <select value={programFilter} onChange={(e) => setProgramFilter(e.target.value)} aria-label="Filter by program" className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm">
              <option value="all">All programs</option>
              {programNames.map((p) => (
                <option key={p} value={p}>{p}</option>
              ))}
            </select>
          </div>

          <div className="flex items-center justify-between px-1">
            <p className="text-xs font-semibold text-slate-600">
              {filtered.length} application{filtered.length === 1 ? '' : 's'}
              {statusFilter !== 'all' || programFilter !== 'all' || search ? ' (filtered)' : ''}
            </p>
            {(statusFilter !== 'all' || programFilter !== 'all' || search) && (
              <button
                type="button"
                onClick={() => {
                  setStatusFilter('all');
                  setProgramFilter('all');
                  setSearch('');
                }}
                className="text-xs font-semibold text-[#18392B] underline"
              >
                Clear filters
              </button>
            )}
          </div>

          {filtered.length === 0 ? (
            <div className="rounded-xl border border-dashed border-slate-300 bg-white p-8 text-center text-sm text-slate-500">No applications match these filters.</div>
          ) : (
            <ul className="space-y-2">
              {filtered.map((a) => (
                <li key={a.id} className="flex items-stretch gap-2">
                  <button
                    type="button"
                    onClick={() => setSelectedId(a.id)}
                    className="flex min-w-0 flex-1 flex-col gap-2 rounded-2xl border border-slate-200 bg-white p-3.5 text-left shadow-xs transition hover:border-[#588B76] hover:shadow-sm sm:flex-row sm:items-center sm:justify-between"
                  >
                    <div className="flex min-w-0 items-center gap-3">
                      <StudentAvatar
                        photo={linkedStudent(a as any, students)?.avatarUrl}
                        altPhoto={linkedStudent(a as any, students)?.profilePhoto}
                        name={liveName(a)}
                        letters={2}
                        className="h-10 w-10 rounded-full bg-[#18392B]/10 font-serif text-sm font-bold text-[#18392B]"
                      />
                      <div className="min-w-0">
                        <p className={`truncate text-sm font-bold ${liveName(a) ? 'text-slate-900' : 'italic text-slate-400'}`}>{liveName(a) || 'Unnamed application'}</p>
                        <p className="truncate text-[11px] text-slate-500">
                          <span className="font-mono">{a.referenceNumber || `ID ${a.id}`}</span> · {a.programName || a.program || 'No program'}
                        </p>
                        <p className="truncate text-[11px] text-slate-400">
                          {a.email || 'No email'}
                          {a.submissionDate || a.createdAt ? ` · Submitted ${new Date(String(a.submissionDate || a.createdAt)).toLocaleDateString('en-PH', { month: 'short', day: 'numeric', year: 'numeric' })}` : ''}
                        </p>
                      </div>
                    </div>
                    <div className="flex shrink-0 items-center gap-2">
                      {normalizeStatus(a.status) === 'Enrolled' && a.studentId && (
                        <span className="font-mono text-[11px] font-bold text-[#18392B]">{a.studentId}</span>
                      )}
                      {(isUserDeleted(a.email || '') || (!!a.applicantUid && isUserDeleted(a.applicantUid))) && (
                        <span className="rounded-full bg-rose-100 px-2 py-0.5 text-[10px] font-bold text-rose-800" title="This email is in the Deletion Registry">
                          Deletion Registry
                        </span>
                      )}
                      <StatusBadge status={a.status} />
                    </div>
                  </button>
                  {canDecideAdmissions && (
                    <button
                      type="button"
                      onClick={() => setDeleteTarget(a)}
                      aria-label={`Delete application ${a.referenceNumber || a.id}`}
                      title="Delete application"
                      className="flex shrink-0 items-center justify-center rounded-xl border border-slate-200 bg-white px-3 text-slate-400 shadow-sm transition hover:border-rose-300 hover:bg-rose-50 hover:text-rose-600"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  )}
                </li>
              ))}
            </ul>
          )}
        </div>

        <aside className="min-w-0 space-y-2 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
          <h3 className="flex items-center gap-1.5 text-sm font-bold text-[#18392B]">
            <Bell className="h-4 w-4 text-[#588B76]" /> Applicant activity
            {unreadAlerts > 0 && <span className="rounded-full bg-amber-100 px-1.5 text-[10px] font-bold text-amber-800">{unreadAlerts} new</span>}
          </h3>
          {staffNotes.length === 0 ? (
            <p className="text-xs text-slate-500">No recent activity.</p>
          ) : (
            <ul className="max-h-[420px] space-y-2 overflow-y-auto">
              {staffNotes.map((n) => (
                <li key={n.id} className={`rounded-lg border p-2 text-[11px] ${n.read ? 'border-slate-100 text-slate-500' : 'border-amber-200 bg-amber-50/60 text-slate-800'}`}>
                  <button
                    type="button"
                    className="w-full text-left"
                    onClick={() => {
                      if (n.applicationId) setSelectedId(n.applicationId);
                      if (!n.read) updateDoc(doc(db, 'staffNotifications', n.id), { read: true }).catch(() => {});
                    }}
                  >
                    <strong className="block text-[#18392B]">{n.title}</strong>
                    <span>{n.message}</span>
                    <span className="mt-0.5 block text-[10px] text-slate-400">{n.createdAt ? new Date(n.createdAt).toLocaleString() : ''}</span>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </aside>
      </div>

      {selected && (
        <ApplicationDetail
          key={selected.id}
          app={selected}
          canDecide={canDecideAdmissions}
          canVerifyPayments={canVerifyPayments}
          feeStructure={feeStructure || []}
          feeDefaults={{
            tuitionPerUnit: enrollmentSystemConfig?.defaultTuitionPerUnit,
            registrationFee: enrollmentSystemConfig?.defaultRegistrationFee,
          }}
          actor={admissionsActor}
          programs={programs}
          requiredDocs={admissionRequirementTemplates(enrollmentSystemConfig)}
          onClose={() => setSelectedId(null)}
          onDelete={canDecideAdmissions ? () => setDeleteTarget(selected) : undefined}
          onNote={(note) => addApplicationNote(selected.id, note)}
          registryBlocked={isUserDeleted(selected.email || '') || (!!selected.applicantUid && isUserDeleted(selected.applicantUid))}
          onRemoveRegistryEntry={() => removeDeletedUserRecord((selected.email || selected.applicantUid || '').toLowerCase())}
          onOpenEnrollment={onOpenEnrollment}
          toast={(ok, title, message) => addToast(ok ? 'success' : 'error', title, message)}
        />
      )}

      {deleteTarget && (
        <DeleteApplicationDialog
          app={deleteTarget}
          onCancel={() => setDeleteTarget(null)}
          onConfirm={async () => {
            try {
              const result = await deleteApplicationCompletely(db, admissionsActor(), deleteTarget as any);
              addToast(result.ok ? 'success' : 'error', result.ok ? 'Application deleted' : 'Not deleted', result.message);
              if (result.ok) {
                if (selectedId === deleteTarget.id) setSelectedId(null);
                setDeleteTarget(null);
              }
            } catch (e: any) {
              console.warn('Delete application notice:', e);
              addToast(
                'error',
                'Not deleted',
                e?.code === 'permission-denied'
                  ? 'You do not have permission to delete applications.'
                  : 'The application could not be deleted. Please check your connection and try again.'
              );
            }
          }}
        />
      )}
    </div>
  );
};

// Permanent deletion needs the admin to type DELETE.
const DeleteApplicationDialog: React.FC<{ app: Application; onCancel: () => void; onConfirm: () => Promise<void> }> = ({ app, onCancel, onConfirm }) => {
  const [typed, setTyped] = useState('');
  const [busy, setBusy] = useState(false);
  const enrolled = normalizeStatus(app.status) === 'Enrolled';
  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center bg-slate-950/60 p-4" role="alertdialog" aria-modal="true" aria-label="Delete application">
      <form
        className="w-full max-w-md space-y-3 rounded-2xl bg-white p-5 shadow-2xl"
        onSubmit={async (e) => {
          e.preventDefault();
          if (typed !== 'DELETE') return;
          setBusy(true);
          try {
            await onConfirm();
          } finally {
            setBusy(false);
          }
        }}
      >
        <h4 className="flex items-center gap-2 font-serif text-lg font-bold text-rose-700">
          <Trash2 className="h-5 w-5" /> Delete this application?
        </h4>
        <div className="rounded-lg bg-slate-50 p-3 text-xs text-slate-700">
          <p className="font-bold text-slate-900">{app.fullName || 'Unnamed application'}</p>
          <p>{[app.referenceNumber || `ID ${app.id}`, app.programName || app.program, app.email].filter(Boolean).join(' · ')}</p>
          <p className="mt-1">Status: {normalizeStatus(app.status)}</p>
        </div>
        <p className="text-xs text-slate-600">
          This permanently removes the application, its uploaded documents, payments and status history. It cannot be undone. The deletion
          is recorded in the activity log.
        </p>
        {enrolled && (
          <p className="rounded-lg border border-amber-200 bg-amber-50 p-2 text-xs text-amber-900">
            This applicant is enrolled. Their official student record{app.studentId ? ` (${app.studentId})` : ''} will <strong>not</strong> be deleted; manage it
            under Enrollment &amp; Records.
          </p>
        )}
        <label className="block text-xs font-semibold text-slate-700">
          Type <span className="font-mono text-rose-700">DELETE</span> to confirm
          <input
            autoFocus
            value={typed}
            onChange={(e) => setTyped(e.target.value)}
            aria-label="Type DELETE to confirm"
            className="mt-1 w-full rounded-lg border border-slate-300 p-2 font-mono text-sm"
          />
        </label>
        <div className="flex justify-end gap-2">
          <button type="button" onClick={onCancel} className="rounded-lg px-3 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100">
            Cancel
          </button>
          <button type="submit" disabled={busy || typed !== 'DELETE'} className="rounded-lg bg-rose-600 px-4 py-2 text-xs font-bold text-white hover:bg-rose-700 disabled:opacity-40">
            {busy ? 'Deleting…' : 'Delete permanently'}
          </button>
        </div>
      </form>
    </div>
  );
};

interface DetailProps {
  onDelete?: () => void;
  app: Application;
  canDecide: boolean;
  canVerifyPayments: boolean;
  feeStructure: { name: string; amount: number; isPerUnit?: boolean; required?: boolean }[];
  feeDefaults: { tuitionPerUnit?: number; registrationFee?: number };
  actor: () => { uid: string; name: string; email: string; role?: string };
  programs: any[];
  requiredDocs?: RequirementTemplate[];
  onClose: () => void;
  onNote: (note: string) => void;
  toast: (ok: boolean, title: string, message: string) => void;
  /** The applicant's email or account is in the Deletion Registry (blocked from the site). */
  registryBlocked?: boolean;
  onRemoveRegistryEntry?: () => Promise<boolean>;
  onOpenEnrollment?: () => void;
}

const ApplicationDetail: React.FC<DetailProps> = ({
  app,
  canDecide,
  canVerifyPayments,
  feeStructure,
  feeDefaults,
  actor,
  requiredDocs,
  onClose,
  onDelete,
  onNote,
  toast,
  registryBlocked,
  onRemoveRegistryEntry,
  onOpenEnrollment,
}) => {
  const { requirements, history, payments, loading } = useApplicationDetails(app.id);
  const { enrollmentSystemConfig: paymentConfig, students, currentAcademicPeriod, currentAdminUser, logActivity } = usePCM();
  const student = normalizeStatus(app.status) === 'Enrolled' ? linkedStudent(app as any, students) : null;
  const account = student ? accountSummary(student as any) : null;
  const [editingDetails, setEditingDetails] = useState(false);
  const [details, setDetails] = useState<Record<string, string>>(() =>
    Object.fromEntries(EDITABLE_APPLICANT_FIELDS.map((f) => [f.key, String((app as any)[f.key] ?? (f.key === 'programName' ? app.program ?? '' : ''))]))
  );
  const [newReq, setNewReq] = useState({ name: '', required: true, description: '' });
  const status = normalizeStatus(app.status);
  const summary = summarizeRequirements(requirements);
  const [busy, setBusy] = useState(false);
  const [pending, setPending] = useState<{ to: WorkflowStatus } | null>(null);
  const [decisionNote, setDecisionNote] = useState('');
  const [showRequest, setShowRequest] = useState(false);
  const [flagged, setFlagged] = useState<Record<string, string>>({});
  const [requestNote, setRequestNote] = useState('');
  const [showFinalize, setShowFinalize] = useState(false);
  // Term and year level come from the student's registration; staff can adjust them.
  const [finalize, setFinalize] = useState(() => ({
    academicYear: app.registration?.academicYear || currentAcademicPeriod?.academicYear || '',
    semester: app.registration?.semester || currentAcademicPeriod?.semester || '',
    yearLevel: app.registration?.yearLevel || '1st Year',
  }));
  const [verifiedConfirm, setVerifiedConfirm] = useState(false);
  const [note, setNote] = useState('');

  const run = async (title: string, action: () => Promise<{ ok: boolean; message: string }>) => {
    setBusy(true);
    try {
      const result = await action();
      toast(result.ok, result.ok ? title : 'Not saved', result.message);
      return result.ok;
    } catch (e: any) {
      console.warn('Admissions action notice:', e);
      toast(false, 'Not saved', e?.code === 'permission-denied' ? 'You do not have permission to make this change.' : 'The change could not be saved. Please check your connection and try again.');
      return false;
    } finally {
      setBusy(false);
    }
  };

  const transitions = STAFF_TRANSITIONS[status].filter((t) => t !== 'Requirements Incomplete');
  const finalizeBlocker =
    canFinalizeEnrollment(app.status, requirements, { assessment: app.assessment, paymentStatus: app.paymentStatus, registration: app.registration }) ||
    (registryBlocked ? 'This applicant’s email is in the Deletion Registry. Remove the registry entry first, or the new student record would be hidden and the student could not sign in.' : null);
  const [removingRegistry, setRemovingRegistry] = useState(false);
  const noteRequired = pending && NOTE_REQUIRED_STATUSES.includes(pending.to);
  const checklist = finalVerificationChecklist(app as any, requirements, payments);

  // Current value from the student record; the application's value is shown only if it differs.
  const same = (a?: unknown, b?: unknown) => String(a ?? '').trim().toLowerCase() === String(b ?? '').trim().toLowerCase();
  const liveField = (label: string, current?: string, submitted?: string) =>
    current || submitted ? (
      <div>
        <dt className="text-[10px] font-semibold uppercase text-slate-400">{label}</dt>
        <dd className="text-xs text-slate-800">{current || '—'}</dd>
        {submitted && !same(current, submitted) && <dd className="text-[10px] text-slate-400">On application: {submitted}</dd>}
      </div>
    ) : null;

  const field = (label: string, value?: React.ReactNode) =>
    value ? (
      <div>
        <dt className="text-[10px] font-semibold uppercase text-slate-400">{label}</dt>
        <dd className="text-xs text-slate-800">{value}</dd>
      </div>
    ) : null;

  return (
    <div className="fixed inset-0 z-50 flex items-stretch justify-end bg-slate-950/50" role="dialog" aria-modal="true" aria-label={`Application ${app.referenceNumber}`}>
      <div className="h-full w-full max-w-3xl overflow-y-auto bg-slate-50 shadow-2xl">
        <div className="sticky top-0 z-10 flex items-start justify-between gap-3 border-b border-slate-200 bg-white p-4">
          <div className="min-w-0">
            <p className="font-mono text-[11px] font-bold text-[#588B76]">{app.referenceNumber}</p>
            <h3 className="truncate font-serif text-xl font-bold text-[#18392B]">{student?.fullName || app.fullName || 'Unnamed application'}</h3>
            <div className="mt-1 flex flex-wrap items-center gap-2">
              <StatusBadge status={app.status} />
              {status === 'Enrolled' && (student?.studentId || app.studentId) && <span className="font-mono text-xs font-bold">{student?.studentId || app.studentId}</span>}
              {student && (
                <span className="rounded-full border border-emerald-200 bg-emerald-50 px-2 py-0.5 text-[10px] font-semibold text-emerald-900" title="Current student record">
                  Now: {student.enrollmentStatus || '—'}
                  {student.currentSemester ? ` · ${student.currentSemester}` : ''}
                  {account ? ` · balance ₱${account.balance.toLocaleString()}` : ''}
                </span>
              )}
              {status === 'Enrolled' && onOpenEnrollment && (
                <button type="button" onClick={onOpenEnrollment} className="text-[11px] font-bold text-[#18392B] underline hover:text-[#588B76]">
                  Open in Enrollment &amp; Records
                </button>
              )}
            </div>
          </div>
          <div className="flex shrink-0 items-center gap-1">
            {onDelete && (
              <button
                type="button"
                onClick={onDelete}
                className="inline-flex items-center gap-1 rounded-lg border border-rose-200 px-2.5 py-1.5 text-xs font-semibold text-rose-700 hover:bg-rose-50"
              >
                <Trash2 className="h-3.5 w-3.5" /> Delete
              </button>
            )}
            <button type="button" onClick={onClose} aria-label="Close" className="rounded-lg p-2 text-slate-500 hover:bg-slate-100">
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        <div className="space-y-5 p-4 sm:p-6">
          <ApplicationProgress status={app.status} />

          {registryBlocked && (
            <div className="space-y-2 rounded-lg border border-rose-200 bg-rose-50 p-3 text-xs text-rose-900">
              <p className="font-bold">This applicant’s email is in the Deletion Registry</p>
              <p>
                An account with <strong>{app.email}</strong> was deleted earlier, so this person is signed out of the site
                {status === 'Enrolled' ? ' and their student record is hidden in Enrollment & Records' : ' and cannot be enrolled until this is resolved'}.
                Removing the registry entry lets them use the site again (it does not restore the old deleted account).
              </p>
              {canDecide && onRemoveRegistryEntry && (
                <button
                  type="button"
                  disabled={removingRegistry}
                  onClick={async () => {
                    if (!window.confirm(`Remove ${app.email} from the Deletion Registry? They will be able to sign in again.`)) return;
                    setRemovingRegistry(true);
                    try {
                      await onRemoveRegistryEntry();
                    } finally {
                      setRemovingRegistry(false);
                    }
                  }}
                  className="rounded-lg bg-rose-600 px-3 py-1.5 font-bold text-white hover:bg-rose-700 disabled:opacity-50"
                >
                  {removingRegistry ? 'Removing…' : 'Remove registry entry'}
                </button>
              )}
            </div>
          )}

          {!app.applicantUid && (
            <p className="rounded-lg border border-slate-200 bg-white p-3 text-[11px] text-slate-600">
              This application was made before Google sign-in was required. The applicant can see it by signing in with{' '}
              <strong>{app.email}</strong>; in-app notifications start once they do.
            </p>
          )}

          {/* Decisions */}
          {canDecide && status !== 'Enrolled' && (
            <section className="space-y-3 rounded-2xl border border-slate-200 bg-white p-4">
              <h4 className="text-sm font-bold text-[#18392B]">Decision</h4>
              <div className="flex flex-wrap gap-2">
                {transitions.map((to) => {
                  const blocker = transitionBlocker(app.status, to, requirements, { registration: (app as any).registration });
                  return (
                    <button
                      key={to}
                      type="button"
                      disabled={busy || !!blocker}
                      title={blocker || undefined}
                      onClick={() => {
                        setDecisionNote('');
                        setPending({ to });
                      }}
                      className={`rounded-lg px-3 py-2 text-xs font-bold disabled:cursor-not-allowed disabled:opacity-40 ${
                        to === 'Rejected'
                          ? 'bg-rose-600 text-white hover:bg-rose-700'
                          : to === 'Deferred'
                          ? 'bg-orange-500 text-white hover:bg-orange-600'
                          : to === 'Withdrawn'
                          ? 'border border-slate-300 bg-white text-slate-700 hover:bg-slate-100'
                          : to === 'For Correction'
                          ? 'border border-amber-400 bg-amber-50 text-amber-900 hover:bg-amber-100'
                          : 'bg-[#18392B] text-white hover:bg-[#23533e]'
                      }`}
                    >
                      {to === 'Under Review' && (status === 'Rejected' || status === 'Deferred')
                        ? 'Reopen for review'
                        : to === 'For Correction'
                        ? 'Return for correction'
                        : to === 'Withdrawn'
                        ? 'Mark withdrawn'
                        : to === 'For Registration' && status === 'For Assessment'
                        ? 'Return registration for changes'
                        : `Move to ${STATUS_LABELS[to]}`}
                    </button>
                  );
                })}
                {STAFF_TRANSITIONS[status].includes('Requirements Incomplete') || status === 'Requirements Incomplete' ? (
                  <button
                    type="button"
                    disabled={busy}
                    onClick={() => setShowRequest((v) => !v)}
                    className="rounded-lg border border-amber-400 bg-amber-50 px-3 py-2 text-xs font-bold text-amber-900 hover:bg-amber-100"
                  >
                    Request missing documents
                  </button>
                ) : null}
              </div>
              {status === 'For Assessment' && app.assessment && (
                // Sent back to Assessment after the assessment was saved (and maybe paid): continue from there.
                (() => {
                  const verified = verifiedPaymentTotal(payments);
                  const minimum = Number(app.assessment.minimumPayment) || 0;
                  const paid = app.paymentStatus === 'Waived' || app.paymentStatus === 'Verified' || (minimum > 0 && verified >= minimum);
                  return (
                    <div className="space-y-2 rounded-xl border border-emerald-200 bg-emerald-50/70 p-3 text-xs text-emerald-950" data-testid="continue-assessed">
                      <p className="font-bold">This student already has an assessment{verified > 0 ? ` and ₱${verified.toLocaleString()} in verified payments` : ''}.</p>
                      <p>
                        {paid
                          ? 'The downpayment is settled, so the application can go straight to Final Verification.'
                          : `Continue to Payment so the student can pay the rest of the ₱${minimum.toLocaleString()} downpayment.`}
                      </p>
                      <button
                        type="button"
                        disabled={busy}
                        onClick={() => run(paid ? 'Moved to Final Verification' : 'Moved to Payment', () => continueAssessedApplication(db, actor(), app as any, payments))}
                        className="rounded-lg bg-[#18392B] px-3 py-2 font-bold text-white hover:bg-[#23533e] disabled:opacity-50"
                      >
                        {paid ? 'Continue to Final Verification' : 'Continue to Payment'}
                      </button>
                    </div>
                  );
                })()
              )}
              {((status === 'For Assessment' && !app.assessment) || status === 'For Payment') && (
                // The next step is done in "Enrollment assessment & payment" below, not with a status button.
                <div className="space-y-2 rounded-xl border border-sky-200 bg-sky-50/60 p-3 text-xs text-sky-950" data-testid="next-step">
                  <p className="font-bold">
                    Next step: {status === 'For Assessment' ? 'Assessment → Payment' : 'Payment → Final Verification'}
                  </p>
                  <p>
                    {status === 'For Assessment'
                      ? 'Save the enrollment assessment (fees and downpayment) in "Enrollment assessment & payment" below to move the student to Payment, or choose "No payment required…" there to go straight to Final Verification.'
                      : 'Verify the student’s reported payments in "Enrollment assessment & payment" below, record a payment made in person, or use "Move to Final Verification" / "Accept as downpayment" there.'}
                  </p>
                  {status === 'For Assessment' && !summary.allRequiredVerified && (
                    <p className="font-semibold text-amber-900">
                      First verify the required documents: {summary.missing.length} missing, {summary.rejected.length} to replace, {summary.awaitingReview.length} awaiting your review.
                    </p>
                  )}
                  <button
                    type="button"
                    onClick={() => document.querySelector('[data-testid="staff-payment"]')?.scrollIntoView({ block: 'start' })}
                    className="rounded-lg bg-[#18392B] px-3 py-2 font-bold text-white hover:bg-[#23533e]"
                  >
                    {status === 'For Assessment' ? 'Go to assessment & payment ↓' : 'Go to payments ↓'}
                  </button>
                </div>
              )}
              {status === 'For Enrollment' && (
                <div className="space-y-2 rounded-xl border border-teal-200 bg-teal-50/60 p-3" data-testid="final-verification">
                  <p className="text-xs font-bold text-teal-900">Final enrollment verification</p>
                  <ul className="space-y-1">
                    {checklist.map((item) => (
                      <li key={item.label} className="flex items-start gap-2 text-xs">
                        <span className={`mt-0.5 font-bold ${item.ok ? 'text-emerald-700' : 'text-rose-700'}`}>{item.ok ? '✓' : '✗'}</span>
                        <span>
                          <strong className="text-slate-800">{item.label}</strong> — <span className="text-slate-600">{item.detail}</span>
                        </span>
                      </li>
                    ))}
                  </ul>
                  <label className="flex items-start gap-2 text-xs text-slate-700">
                    <input type="checkbox" checked={verifiedConfirm} onChange={(e) => setVerifiedConfirm(e.target.checked)} className="mt-0.5" />
                    <span>I have reviewed this checklist and the records above, and approve official enrollment.</span>
                  </label>
                  <button
                    type="button"
                    disabled={busy || !!finalizeBlocker || !verifiedConfirm || checklist.some((i) => !i.ok)}
                    title={finalizeBlocker || (!verifiedConfirm ? 'Tick the verification box first.' : undefined)}
                    onClick={() => setShowFinalize(true)}
                    className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-600 px-3 py-2 text-xs font-bold text-white hover:bg-emerald-700 disabled:opacity-40"
                  >
                    <GraduationCap className="h-4 w-4" /> Finalize enrollment
                  </button>
                  {finalizeBlocker && <p className="text-[11px] text-rose-700">{finalizeBlocker}</p>}
                </div>
              )}
              {transitions.some((t) => transitionBlocker(app.status, t, requirements, { registration: (app as any).registration })) && (
                <p className="text-[11px] text-slate-500">
                  Greyed-out steps are waiting on documents or the student’s registration: {summary.missing.length} missing, {summary.rejected.length} to replace, {summary.awaitingReview.length} awaiting your review.
                </p>
              )}

              {showRequest && (
                <div className="space-y-2 rounded-xl border border-amber-200 bg-amber-50/50 p-3">
                  <p className="text-xs font-semibold text-amber-900">Select what the applicant must submit or replace:</p>
                  {requirements.filter((r) => r.status !== 'Verified').map((r) => (
                    <div key={r.id} className="flex flex-col gap-1 sm:flex-row sm:items-center">
                      <label className="flex min-w-0 items-center gap-2 text-xs sm:w-1/2">
                        <input
                          type="checkbox"
                          checked={r.id in flagged}
                          onChange={(e) =>
                            setFlagged((f) => {
                              const next = { ...f };
                              if (e.target.checked) next[r.id] = '';
                              else delete next[r.id];
                              return next;
                            })
                          }
                        />
                        <span className="truncate">{r.name}</span>
                      </label>
                      {r.id in flagged && (
                        <input
                          type="text"
                          value={flagged[r.id]}
                          onChange={(e) => setFlagged((f) => ({ ...f, [r.id]: e.target.value }))}
                          placeholder="What is wrong / needed"
                          className="flex-1 rounded border border-slate-300 px-2 py-1 text-xs"
                        />
                      )}
                    </div>
                  ))}
                  <textarea
                    value={requestNote}
                    onChange={(e) => setRequestNote(e.target.value)}
                    rows={2}
                    placeholder="Message to the applicant (optional)"
                    className="w-full rounded border border-slate-300 p-2 text-xs"
                  />
                  <div className="flex justify-end gap-2">
                    <button type="button" onClick={() => setShowRequest(false)} className="rounded-lg px-3 py-1.5 text-xs font-semibold text-slate-600 hover:bg-slate-100">
                      Cancel
                    </button>
                    <button
                      type="button"
                      disabled={busy}
                      onClick={async () => {
                        const ok = await run('Applicant notified', () =>
                          requestMissingRequirements(
                            db,
                            actor(),
                            app as any,
                            requirements,
                            Object.entries(flagged).map(([id, remarks]) => ({ id, remarks })),
                            requestNote
                          )
                        );
                        if (ok) {
                          setShowRequest(false);
                          setFlagged({});
                          setRequestNote('');
                        }
                      }}
                      className="rounded-lg bg-amber-500 px-3 py-1.5 text-xs font-bold text-white hover:bg-amber-600 disabled:opacity-50"
                    >
                      Send request
                    </button>
                  </div>
                </div>
              )}
            </section>
          )}

          {/* Documents */}
          <section className="space-y-3 rounded-2xl border border-slate-200 bg-white p-4">
            <div className="flex items-center justify-between gap-2">
              <h4 className="text-sm font-bold text-[#18392B]">Admission documents</h4>
              {student && (
                <p className="text-[11px] text-slate-500">Documents submitted for admission. They also appear as verified in the student&apos;s Requirements Checklist (Enrollment &amp; Records and the Student Portal).</p>
              )}
              {canDecide && !loading && requirements.length === 0 && status !== 'Enrolled' && (
                <button
                  type="button"
                  disabled={busy}
                  onClick={() => run('Checklist created', () => createRequirementChecklist(db, actor(), app as any, requiredDocs || []))}
                  className="rounded-lg border border-[#588B76] px-3 py-1.5 text-xs font-semibold text-[#18392B] hover:bg-emerald-50"
                >
                  Create document checklist
                </button>
              )}
            </div>
            {!loading && requirements.length > 0 && missingRequirements(requiredDocs || [], requirements).length > 0 && (
              <div className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-amber-200 bg-amber-50 p-3 text-xs text-amber-950">
                <span>
                  Not in this checklist yet (current admission requirements):{' '}
                  <strong>{missingRequirements(requiredDocs || [], requirements).map((t) => t.name).join(', ')}</strong>
                </span>
                {canDecide && (
                  <button
                    type="button"
                    disabled={busy}
                    onClick={() => run('Checklist updated', () => addMissingRequirements(db, actor(), app as any, requirements, requiredDocs || []))}
                    className="rounded-lg bg-[#18392B] px-3 py-1.5 font-bold text-white disabled:opacity-50"
                  >
                    Add missing documents
                  </button>
                )}
              </div>
            )}
            {loading ? (
              <p className="text-xs text-slate-500">Loading documents…</p>
            ) : (
              <RequirementsChecklist
                mode="staff"
                requirements={requirements}
                readOnly={!canDecide}
                onReview={(req, verdict, remarks) => reviewRequirement(db, actor(), app as any, req, verdict, remarks)}
              />
            )}
          </section>

          {canDecide && status !== 'Enrolled' && requirements.length > 0 && (
            <form
              className="flex flex-col gap-2 rounded-2xl border border-dashed border-slate-300 bg-white p-3 sm:flex-row sm:items-center"
              onSubmit={async (e) => {
                e.preventDefault();
                const ok = await run('Requirement added', () => addRequirement(db, actor(), app as any, requirements, newReq.name, newReq.required, newReq.description));
                if (ok) setNewReq({ name: '', required: true, description: '' });
              }}
            >
              <input
                value={newReq.name}
                onChange={(e) => setNewReq({ ...newReq, name: e.target.value })}
                placeholder="Add a requirement for this applicant"
                aria-label="New requirement name"
                className="min-w-0 flex-1 rounded-lg border border-slate-300 px-2.5 py-1.5 text-xs"
              />
              <label className="flex items-center gap-1.5 text-xs text-slate-700">
                <input type="checkbox" checked={newReq.required} onChange={(e) => setNewReq({ ...newReq, required: e.target.checked })} /> Required
              </label>
              <button type="submit" disabled={busy || !newReq.name.trim()} className="rounded-lg bg-slate-800 px-3 py-1.5 text-xs font-semibold text-white disabled:opacity-40">
                Add
              </button>
            </form>
          )}

          {/* Existing student record (returnees) and transfer credits (transferees) */}
          <StudentRecordPanel app={app as any} canDecide={canDecide} />

          {/* Academic registration (step 5) */}
          {(status === 'For Registration' || (app as any).registration) && (
            <section className="space-y-2 rounded-2xl border border-slate-200 bg-white p-4" data-testid="registration-panel">
              <h4 className="text-sm font-bold text-[#18392B]">Academic registration</h4>
              {(app as any).registration ? (
                <>
                  <p className="text-xs text-slate-600">
                    {(app as any).registration.programName} · {(app as any).registration.yearLevel} · {(app as any).registration.semester}, AY{' '}
                    {(app as any).registration.academicYear} · submitted {new Date((app as any).registration.submittedAt).toLocaleString()}
                  </p>
                  <div className="overflow-x-auto rounded-xl border border-slate-200">
                    <table className="w-full min-w-[480px] text-xs">
                      <thead className="bg-slate-50 text-left text-slate-500">
                        <tr>
                          <th className="p-2">Code</th>
                          <th className="p-2">Subject</th>
                          <th className="p-2">Schedule</th>
                          <th className="p-2 text-right">Units</th>
                        </tr>
                      </thead>
                      <tbody>
                        {(app as any).registration.subjects.map((sub: any) => (
                          <tr key={sub.subjectId || sub.code} className="border-t border-slate-100">
                            <td className="p-2 font-mono font-bold">{sub.code}</td>
                            <td className="p-2">{sub.title}</td>
                            <td className="p-2 text-slate-600">{sub.schedule || '—'}</td>
                            <td className="p-2 text-right font-mono">{sub.units}</td>
                          </tr>
                        ))}
                        <tr className="border-t border-slate-200 bg-slate-50 font-bold">
                          <td className="p-2" colSpan={3}>Total units</td>
                          <td className="p-2 text-right font-mono">{(app as any).registration.totalUnits}</td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </>
              ) : (
                <p className="text-xs text-slate-600">Waiting for the student to choose their subjects in the Student Portal.</p>
              )}
            </section>
          )}

          {/* Assessment & payment (steps 5-6) */}
          <StaffPaymentSection
            // Re-initialise the draft assessment when the student's registration arrives or changes.
            key={(app as any).registration?.submittedAt || 'no-registration'}
            defaultUnits={(app as any).registration?.totalUnits}
            downpaymentPercent={paymentConfig?.downpaymentPercent}
            status={app.status}
            assessment={app.assessment}
            paymentStatus={app.paymentStatus}
            payments={payments}
            canAssess={canDecide}
            canVerify={canVerifyPayments}
            feeStructure={feeStructure}
            defaults={feeDefaults}
            requirementsVerified={summary.allRequiredVerified}
            onSaveAssessment={(input) => saveAssessment(db, actor(), app as any, requirements, input, payments)}
            onWaive={(reason) => waivePayment(db, actor(), app as any, requirements, reason)}
            onReviewPayment={(p, verdict, remarks) => reviewPayment(db, actor(), app as any, payments, p, verdict, remarks)}
            onRecordPayment={(input) => recordStaffPayment(db, actor(), app as any, payments, input)}
            onAcceptPayment={(reason) => acceptVerifiedPayment(db, actor(), app as any, payments, reason)}
            onCorrectPayment={
              canEditPayments(currentAdminUser?.role)
                ? async (p, edit, reason) => {
                    const r = await correctApplicationPayment(db, actor(), app as any, payments, p.id, edit, reason);
                    if (r.ok) logActivity(edit ? 'UPDATE' : 'DELETE', 'Application Payment', p.id, app.fullName || app.referenceNumber || 'Applicant', `${r.message} Reason: ${reason.trim()}`);
                    return r;
                  }
                : undefined
            }
          />

          {/* Enrolled: every payment, including balance payments and cashier receipts after enrollment */}
          {student && <StudentAccountPayments student={student} applicationPayments={payments} />}

          {/* Applicant details */}
          <section className="space-y-3 rounded-2xl border border-slate-200 bg-white p-4">
            <div className="flex items-center justify-between gap-2">
              <h4 className="text-sm font-bold text-[#18392B]">
                {student ? 'Student information' : 'Applicant information'}
                {student && <span className="ml-2 rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-semibold text-emerald-800">Live from the student record</span>}
              </h4>
              {student && onOpenEnrollment && (
                <button type="button" onClick={onOpenEnrollment} className="text-xs font-semibold text-[#18392B] underline">
                  Edit in Enrollment &amp; Records
                </button>
              )}
              {!student && canDecide && !editingDetails && (
                <button type="button" onClick={() => setEditingDetails(true)} className="text-xs font-semibold text-[#18392B] underline">
                  Correct details
                </button>
              )}
            </div>
            {editingDetails && (
              <form
                className="space-y-2 rounded-xl border border-slate-200 bg-slate-50 p-3"
                onSubmit={async (e) => {
                  e.preventDefault();
                  const ok = await run('Details updated', () => updateApplicantDetails(db, actor(), app as any, details));
                  if (ok) setEditingDetails(false);
                }}
              >
                <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                  {EDITABLE_APPLICANT_FIELDS.map((f) => (
                    <label key={f.key} className="text-[11px] font-semibold text-slate-600">
                      {f.label}
                      <input
                        value={details[f.key] || ''}
                        onChange={(e) => setDetails({ ...details, [f.key]: e.target.value })}
                        className="mt-0.5 w-full rounded-lg border border-slate-300 bg-white p-1.5 text-xs"
                      />
                    </label>
                  ))}
                </div>
                <div className="flex justify-end gap-2">
                  <button type="button" onClick={() => setEditingDetails(false)} className="rounded-lg px-3 py-1.5 text-xs font-semibold text-slate-600">
                    Cancel
                  </button>
                  <button type="submit" disabled={busy} className="rounded-lg bg-[#18392B] px-3 py-1.5 text-xs font-bold text-white disabled:opacity-50">
                    Save corrections
                  </button>
                </div>
              </form>
            )}
            {student && (
              <p className="text-[11px] text-slate-500">
                This applicant is enrolled, so details come from the student record and stay in sync with the Student Portal and
                Enrollment &amp; Records. Where the original application differs, it is shown as &quot;On application&quot;.
              </p>
            )}
            <dl className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              {student ? (
                <>
                  {liveField('Program', student.degreeProgram || student.program, app.programName || app.program)}
                  {liveField('Year level / section', [student.yearLevel, student.section].filter(Boolean).join(' • '))}
                  {liveField('Current term', student.currentSemester)}
                  {liveField('Email', student.email, app.email)}
                  {liveField('Mobile', student.mobileNumber || student.phone, app.phone)}
                  {liveField('Date of birth', student.dateOfBirth || student.birthDate, app.dateOfBirth || app.birthDate)}
                  {liveField('Sex', student.sex || student.gender, app.gender)}
                  {liveField('Civil status', student.civilStatus, app.civilStatus)}
                  {liveField('Address', student.currentAddress || student.address, app.address)}
                  {liveField('Home church', student.homeChurch || student.churchName, app.churchName || app.churchAffiliation)}
                  {liveField('Senior pastor', student.pastorName, app.pastorName)}
                  {liveField('Pastor contact', student.pastorContactNumber || student.pastorPhone, app.pastorContact)}
                  {liveField('Highest education', student.highestEducationalAttainment, app.highestEducation)}
                  {liveField('Previous school', student.lastSchoolAttended, app.previousSchool || app.highSchool || app.previousCollege)}
                  {liveField('Year graduated', student.yearGraduated, app.yearGraduated)}
                  {liveField('Emergency contact', [student.emergencyContactPerson || student.emergencyContactName, student.emergencyContactNumber || student.emergencyContactPhone].filter(Boolean).join(' · '))}
                  {field('Applicant type', app.applicantType)}
                  {field('Application submitted', app.submissionDate || app.createdAt)}
                </>
              ) : (
                <>
              {field('Program', app.programName || app.program)}
              {field('Email', app.email)}
              {field('Mobile', app.phone)}
              {field('Date of birth', app.dateOfBirth || app.birthDate)}
              {field('Gender', app.gender)}
              {field('Civil status', app.civilStatus)}
              {field('Address', app.address)}
              {field('Home church', app.churchName || app.churchAffiliation)}
              {field('Senior pastor', app.pastorName)}
              {field('Pastor contact', app.pastorContact)}
              {field('Highest education', app.highestEducation)}
              {field('Previous school', app.previousSchool || app.highSchool || app.previousCollege)}
              {field('Year graduated', app.yearGraduated)}
              {field('Applicant type', app.applicantType)}
              {field('Submitted', app.submissionDate || app.createdAt)}
                </>
              )}
            </dl>
            {(app.christianTestimony || app.personalTestimony) && (
              <div>
                <p className="text-[10px] font-semibold uppercase text-slate-400">Salvation testimony</p>
                <p className="whitespace-pre-line text-xs text-slate-700">{app.christianTestimony || app.personalTestimony}</p>
              </div>
            )}
            {app.callingStatement && (
              <div>
                <p className="text-[10px] font-semibold uppercase text-slate-400">Ministry calling</p>
                <p className="whitespace-pre-line text-xs text-slate-700">{app.callingStatement}</p>
              </div>
            )}
          </section>

          {/* History and notes */}
          <section className="space-y-3 rounded-2xl border border-slate-200 bg-white p-4">
            <h4 className="flex items-center gap-1.5 text-sm font-bold text-[#18392B]">
              <History className="h-4 w-4 text-[#588B76]" /> Status history
            </h4>
            {history.length === 0 ? (
              <p className="text-xs text-slate-500">No history recorded (older application).</p>
            ) : (
              <ol className="space-y-2 border-l-2 border-[#588B76]/30 pl-3">
                {history.map((h) => (
                  <li key={h.id} className="text-xs">
                    <div className="flex flex-wrap items-center gap-2">
                      <StatusBadge status={h.status} />
                      <span className="text-[10px] text-slate-500">
                        {h.byName}
                        {h.byRole ? ` (${h.byRole})` : ''} · {h.at ? new Date(h.at).toLocaleString() : ''}
                      </span>
                    </div>
                    {h.note && <p className="mt-0.5 text-slate-700">{h.note}</p>}
                  </li>
                ))}
              </ol>
            )}

            <div className="space-y-2 border-t border-slate-100 pt-3">
              <p className="flex items-center gap-1.5 text-xs font-bold text-slate-700">
                <MessageSquare className="h-3.5 w-3.5" /> Internal notes (staff only)
              </p>
              {app.adminNotes && <p className="whitespace-pre-line rounded-lg bg-slate-50 p-2 font-mono text-[11px] text-slate-700">{app.adminNotes}</p>}
              {canDecide && (
                <form
                  className="flex gap-2"
                  onSubmit={(e) => {
                    e.preventDefault();
                    if (!note.trim()) return;
                    onNote(note.trim());
                    setNote('');
                  }}
                >
                  <input value={note} onChange={(e) => setNote(e.target.value)} placeholder="Add an internal note" className="flex-1 rounded-lg border border-slate-300 px-2.5 py-1.5 text-xs" />
                  <button type="submit" className="rounded-lg bg-slate-800 px-3 py-1.5 text-xs font-semibold text-white">Add</button>
                </form>
              )}
            </div>
          </section>
        </div>
      </div>

      {/* Confirm a decision */}
      {pending && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-slate-950/60 p-4" role="alertdialog" aria-modal="true" aria-label="Confirm decision">
          <div className="w-full max-w-md space-y-3 rounded-2xl bg-white p-5 shadow-2xl">
            <h4 className="flex items-center gap-2 font-serif text-lg font-bold text-[#18392B]">
              <ShieldAlert className="h-5 w-5 text-amber-500" /> Move to “{STATUS_LABELS[pending.to]}”?
            </h4>
            <p className="text-xs text-slate-600">
              {app.fullName} will be notified. {pending.to === 'Rejected' ? 'This closes the application (it can be reopened later).' : ''}
            </p>
            <textarea
              value={decisionNote}
              onChange={(e) => setDecisionNote(e.target.value)}
              rows={3}
              placeholder={noteRequired ? 'Reason (required, shown to the applicant)' : 'Message to the applicant (optional)'}
              className="w-full rounded-lg border border-slate-300 p-2 text-xs"
            />
            <div className="flex justify-end gap-2">
              <button type="button" onClick={() => setPending(null)} className="rounded-lg px-3 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100">
                Cancel
              </button>
              <button
                type="button"
                disabled={busy || (!!noteRequired && !decisionNote.trim())}
                onClick={async () => {
                  const ok = await run('Application updated', () => transitionApplication(db, actor(), app as any, pending.to, requirements, decisionNote));
                  if (ok) setPending(null);
                }}
                className="rounded-lg bg-[#18392B] px-4 py-2 text-xs font-bold text-white hover:bg-[#23533e] disabled:opacity-40"
              >
                {busy ? 'Saving…' : 'Confirm'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Finalize enrollment */}
      {showFinalize && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-slate-950/60 p-4" role="alertdialog" aria-modal="true" aria-label="Finalize enrollment">
          <form
            className="w-full max-w-md space-y-3 rounded-2xl bg-white p-5 shadow-2xl"
            onSubmit={async (e) => {
              e.preventDefault();
              setBusy(true);
              try {
                const result = await finalizeEnrollment(db, actor(), app as any, requirements, finalize, payments);
                toast(result.ok, result.ok ? 'Student enrolled' : 'Not enrolled', result.message);
                if (result.ok) setShowFinalize(false);
              } catch (err: any) {
                console.warn('Finalize enrollment notice:', err);
                toast(false, 'Not enrolled', err?.code === 'permission-denied' ? 'You do not have permission to finalize enrollment.' : 'Enrollment could not be saved. Nothing was changed; please try again.');
              } finally {
                setBusy(false);
              }
            }}
          >
            <h4 className="flex items-center gap-2 font-serif text-lg font-bold text-[#18392B]">
              <CheckCircle2 className="h-5 w-5 text-emerald-600" /> Finalize enrollment
            </h4>
            <p className="text-xs text-slate-600">
              This creates (or updates, if one already exists) the official student record for <strong>{app.fullName}</strong>, assigns the next Student ID, and
              notifies the student.
            </p>
            <label className="block text-xs font-semibold text-slate-700">
              Academic year
              <input required value={finalize.academicYear} onChange={(e) => setFinalize({ ...finalize, academicYear: e.target.value })} className="mt-1 w-full rounded-lg border border-slate-300 p-2 text-sm" />
            </label>
            <label className="block text-xs font-semibold text-slate-700">
              Semester
              <select value={finalize.semester} onChange={(e) => setFinalize({ ...finalize, semester: e.target.value })} className="mt-1 w-full rounded-lg border border-slate-300 bg-white p-2 text-sm">
                <option>1st Semester</option>
                <option>2nd Semester</option>
                <option>Summer Term</option>
              </select>
            </label>
            <label className="block text-xs font-semibold text-slate-700">
              Year level
              <select value={finalize.yearLevel} onChange={(e) => setFinalize({ ...finalize, yearLevel: e.target.value })} className="mt-1 w-full rounded-lg border border-slate-300 bg-white p-2 text-sm">
                <option>1st Year</option>
                <option>2nd Year</option>
                <option>3rd Year</option>
                <option>4th Year</option>
                <option>Graduate</option>
              </select>
            </label>
            <div className="flex justify-end gap-2 pt-1">
              <button type="button" onClick={() => setShowFinalize(false)} className="rounded-lg px-3 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100">
                Cancel
              </button>
              <button type="submit" disabled={busy} className="rounded-lg bg-emerald-600 px-4 py-2 text-xs font-bold text-white hover:bg-emerald-700 disabled:opacity-50">
                {busy ? 'Enrolling…' : 'Confirm enrollment'}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};
