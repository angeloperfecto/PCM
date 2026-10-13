'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { collection, doc, limit, onSnapshot, orderBy, query, updateDoc } from 'firebase/firestore';
import { usePCM } from '@/lib/store';
import { db } from '@/lib/firebase';
import { Application } from '@/lib/types';
import {
  STAFF_TRANSITIONS,
  TRACKER_STAGES,
  WorkflowStatus,
  normalizeStatus,
  requirementTemplates,
  summarizeRequirements,
  transitionBlocker,
  canFinalizeEnrollment,
} from '@/lib/enrollmentWorkflow';
import {
  createRequirementChecklist,
  finalizeEnrollment,
  requestMissingRequirements,
  reviewRequirement,
  transitionApplication,
} from '@/lib/admissionsService';
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

const OUTCOME_STATUSES: WorkflowStatus[] = ['Rejected', 'Deferred'];
const ALL_STATUSES: WorkflowStatus[] = [...TRACKER_STAGES.map((s) => s.status), ...OUTCOME_STATUSES];

// Statuses where the next move is the Admissions Office's.
const NEEDS_STAFF_ACTION: WorkflowStatus[] = ['Submitted', 'Under Review', 'For Admission Approval', 'Admitted', 'For Enrollment'];

function csvCell(value: unknown): string {
  const s = value === undefined || value === null ? '' : String(value);
  return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
}

function downloadCsv(filename: string, rows: unknown[][]) {
  const blob = new Blob([rows.map((r) => r.map(csvCell).join(',')).join('\n')], { type: 'text/csv;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

// Admissions & Enrollment dashboard: every application from submission to enrollment.
// Decisions are limited to the Registrar, Admin and Super Admin (also enforced by
// firestore.rules); other admin roles can view.
export const AdminApplicationsTab: React.FC = () => {
  const { applications, programs, canDecideAdmissions, admissionsActor, addToast, addApplicationNote, enrollmentSystemConfig } = usePCM();

  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'action' | WorkflowStatus>('all');
  const [programFilter, setProgramFilter] = useState('all');
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [staffNotes, setStaffNotes] = useState<StaffNotification[]>([]);

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
        if (statusFilter === 'action' && !NEEDS_STAFF_ACTION.includes(s)) return false;
        if (statusFilter !== 'all' && statusFilter !== 'action' && s !== statusFilter) return false;
        if (programFilter !== 'all' && (a.programName || a.program) !== programFilter) return false;
        if (!q) return true;
        return [a.fullName, a.email, a.referenceNumber, a.studentId, a.phone]
          .filter(Boolean)
          .some((v) => String(v).toLowerCase().includes(q));
      })
      .sort((a, b) => (b.updatedAt || b.createdAt || '').localeCompare(a.updatedAt || a.createdAt || ''));
  }, [applications, search, statusFilter, programFilter]);

  const selected = applications.find((a) => a.id === selectedId) || null;
  const unreadAlerts = staffNotes.filter((n) => !n.read).length;

  const exportApplications = () => {
    downloadCsv(`PCM_Admissions_${new Date().toISOString().slice(0, 10)}.csv`, [
      ['Reference', 'Full Name', 'Email', 'Phone', 'Program', 'Status', 'Student ID', 'Submitted', 'Last Updated', 'Last Decision By'],
      ...filtered.map((a) => [
        a.referenceNumber,
        a.fullName,
        a.email,
        a.phone,
        a.programName || a.program,
        normalizeStatus(a.status),
        a.studentId && normalizeStatus(a.status) === 'Enrolled' ? a.studentId : '',
        a.submissionDate || a.createdAt,
        a.updatedAt,
        a.lastDecisionBy,
      ]),
    ]);
  };

  const exportSummary = () => {
    const rows: unknown[][] = [['Program', ...ALL_STATUSES, 'Total']];
    const byProgram = new Map<string, Record<string, number>>();
    applications.forEach((a) => {
      const p = a.programName || a.program || 'Unspecified';
      const row = byProgram.get(p) || {};
      const s = normalizeStatus(a.status);
      row[s] = (row[s] || 0) + 1;
      byProgram.set(p, row);
    });
    byProgram.forEach((row, p) => rows.push([p, ...ALL_STATUSES.map((s) => row[s] || 0), ALL_STATUSES.reduce((t, s) => t + (row[s] || 0), 0)]));
    rows.push(['All programs', ...ALL_STATUSES.map((s) => counts[s] || 0), applications.length]);
    downloadCsv(`PCM_Enrollment_Report_${new Date().toISOString().slice(0, 10)}.csv`, rows);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
        <div>
          <h2 className="flex items-center gap-2 font-serif text-2xl font-bold text-[#18392B]">
            <FileCheck className="h-6 w-6 text-[#588B76]" /> Admissions & Enrollment
          </h2>
          <p className="text-xs text-slate-500">From application to official enrollment. Click a stage to filter.</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button type="button" onClick={exportApplications} className="inline-flex items-center gap-1.5 rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50">
            <Download className="h-3.5 w-3.5" /> Export list (CSV)
          </button>
          <button type="button" onClick={exportSummary} className="inline-flex items-center gap-1.5 rounded-lg bg-[#18392B] px-3 py-2 text-xs font-semibold text-white hover:bg-[#23533e]">
            <Download className="h-3.5 w-3.5" /> Enrollment report (CSV)
          </button>
        </div>
      </div>

      {!canDecideAdmissions && (
        <div className="flex items-start gap-2 rounded-xl border border-amber-200 bg-amber-50 p-3 text-xs text-amber-900">
          <Lock className="mt-0.5 h-4 w-4 shrink-0" />
          <span>You can view applications. Admission decisions, document verification and enrollment are handled by the Registrar, Admin or Super Admin.</span>
        </div>
      )}

      {/* Stage counters */}
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-5 xl:grid-cols-10">
        <button
          type="button"
          onClick={() => setStatusFilter('action')}
          className={`rounded-xl border p-3 text-left transition ${statusFilter === 'action' ? 'border-amber-400 bg-amber-50' : 'border-slate-200 bg-white hover:border-amber-300'}`}
        >
          <span className="block text-[10px] font-bold uppercase text-amber-700">Needs action</span>
          <span className="text-xl font-bold text-slate-900">{applications.filter((a) => NEEDS_STAFF_ACTION.includes(normalizeStatus(a.status))).length}</span>
        </button>
        {ALL_STATUSES.map((s) => (
          <button
            key={s}
            type="button"
            onClick={() => setStatusFilter(statusFilter === s ? 'all' : s)}
            className={`rounded-xl border p-3 text-left transition ${statusFilter === s ? 'border-[#588B76] bg-emerald-50' : 'border-slate-200 bg-white hover:border-[#588B76]/50'}`}
          >
            <span className="block truncate text-[10px] font-bold uppercase text-slate-500">{s}</span>
            <span className="text-xl font-bold text-slate-900">{counts[s] || 0}</span>
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-[minmax(0,1fr)_320px]">
        <div className="min-w-0 space-y-3">
          <div className="flex flex-col gap-2 sm:flex-row">
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
              {ALL_STATUSES.map((s) => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>
            <select value={programFilter} onChange={(e) => setProgramFilter(e.target.value)} aria-label="Filter by program" className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm">
              <option value="all">All programs</option>
              {programNames.map((p) => (
                <option key={p} value={p}>{p}</option>
              ))}
            </select>
          </div>

          <p className="text-xs text-slate-500">{filtered.length} application{filtered.length === 1 ? '' : 's'}</p>

          {filtered.length === 0 ? (
            <div className="rounded-xl border border-dashed border-slate-300 bg-white p-8 text-center text-sm text-slate-500">No applications match these filters.</div>
          ) : (
            <ul className="space-y-2">
              {filtered.map((a) => (
                <li key={a.id}>
                  <button
                    type="button"
                    onClick={() => setSelectedId(a.id)}
                    className="flex w-full flex-col gap-2 rounded-xl border border-slate-200 bg-white p-3 text-left shadow-sm transition hover:border-[#588B76] sm:flex-row sm:items-center sm:justify-between"
                  >
                    <div className="min-w-0">
                      <p className="truncate text-sm font-bold text-slate-900">{a.fullName}</p>
                      <p className="truncate text-[11px] text-slate-500">
                        {a.referenceNumber} · {a.programName || a.program || 'No program'} · {a.email}
                      </p>
                    </div>
                    <div className="flex shrink-0 items-center gap-2">
                      {normalizeStatus(a.status) === 'Enrolled' && a.studentId && (
                        <span className="font-mono text-[11px] font-bold text-[#18392B]">{a.studentId}</span>
                      )}
                      <StatusBadge status={a.status} />
                    </div>
                  </button>
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
          app={selected}
          canDecide={canDecideAdmissions}
          actor={admissionsActor}
          programs={programs}
          requiredDocs={enrollmentSystemConfig?.requiredDocumentsList}
          onClose={() => setSelectedId(null)}
          onNote={(note) => addApplicationNote(selected.id, note)}
          toast={(ok, title, message) => addToast(ok ? 'success' : 'error', title, message)}
        />
      )}
    </div>
  );
};

interface DetailProps {
  app: Application;
  canDecide: boolean;
  actor: () => { uid: string; name: string; email: string; role?: string };
  programs: any[];
  requiredDocs?: string[];
  onClose: () => void;
  onNote: (note: string) => void;
  toast: (ok: boolean, title: string, message: string) => void;
}

const ApplicationDetail: React.FC<DetailProps> = ({ app, canDecide, actor, requiredDocs, onClose, onNote, toast }) => {
  const { requirements, history, loading } = useApplicationDetails(app.id);
  const status = normalizeStatus(app.status);
  const summary = summarizeRequirements(requirements);
  const [busy, setBusy] = useState(false);
  const [pending, setPending] = useState<{ to: WorkflowStatus } | null>(null);
  const [decisionNote, setDecisionNote] = useState('');
  const [showRequest, setShowRequest] = useState(false);
  const [flagged, setFlagged] = useState<Record<string, string>>({});
  const [requestNote, setRequestNote] = useState('');
  const [showFinalize, setShowFinalize] = useState(false);
  const [finalize, setFinalize] = useState({ academicYear: '2026–2027', semester: '1st Semester', yearLevel: '1st Year' });
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
  const finalizeBlocker = canFinalizeEnrollment(app.status, requirements);
  const noteRequired = pending && (pending.to === 'Rejected' || pending.to === 'Deferred');

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
            <h3 className="truncate font-serif text-xl font-bold text-[#18392B]">{app.fullName}</h3>
            <div className="mt-1 flex flex-wrap items-center gap-2">
              <StatusBadge status={app.status} />
              {status === 'Enrolled' && app.studentId && <span className="font-mono text-xs font-bold">{app.studentId}</span>}
            </div>
          </div>
          <button type="button" onClick={onClose} aria-label="Close" className="rounded-lg p-2 text-slate-500 hover:bg-slate-100">
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="space-y-5 p-4 sm:p-6">
          <ApplicationProgress status={app.status} />

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
                  const blocker = transitionBlocker(app.status, to, requirements);
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
                          : 'bg-[#18392B] text-white hover:bg-[#23533e]'
                      }`}
                    >
                      {to === 'Under Review' && (status === 'Rejected' || status === 'Deferred') ? 'Reopen for review' : `Move to ${to}`}
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
                {status === 'For Enrollment' && (
                  <button
                    type="button"
                    disabled={busy || !!finalizeBlocker}
                    title={finalizeBlocker || undefined}
                    onClick={() => setShowFinalize(true)}
                    className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-600 px-3 py-2 text-xs font-bold text-white hover:bg-emerald-700 disabled:opacity-40"
                  >
                    <GraduationCap className="h-4 w-4" /> Finalize enrollment
                  </button>
                )}
              </div>
              {transitions.some((t) => transitionBlocker(app.status, t, requirements)) && (
                <p className="text-[11px] text-slate-500">
                  Greyed-out steps need documents first: {summary.missing.length} missing, {summary.rejected.length} to replace, {summary.awaitingReview.length} awaiting your review.
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
              {canDecide && !loading && requirements.length === 0 && status !== 'Enrolled' && (
                <button
                  type="button"
                  disabled={busy}
                  onClick={() => run('Checklist created', () => createRequirementChecklist(db, actor(), app as any, requirementTemplates(requiredDocs)))}
                  className="rounded-lg border border-[#588B76] px-3 py-1.5 text-xs font-semibold text-[#18392B] hover:bg-emerald-50"
                >
                  Create document checklist
                </button>
              )}
            </div>
            {loading ? (
              <p className="text-xs text-slate-500">Loading documents…</p>
            ) : (
              <RequirementsChecklist
                mode="staff"
                requirements={requirements}
                readOnly={!canDecide || status === 'Enrolled'}
                onReview={(req, verdict, remarks) => reviewRequirement(db, actor(), app as any, req, verdict, remarks)}
              />
            )}
          </section>

          {/* Applicant details */}
          <section className="space-y-3 rounded-2xl border border-slate-200 bg-white p-4">
            <h4 className="text-sm font-bold text-[#18392B]">Applicant information</h4>
            <dl className="grid grid-cols-1 gap-3 sm:grid-cols-2">
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
              <ShieldAlert className="h-5 w-5 text-amber-500" /> Move to “{pending.to}”?
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
                const result = await finalizeEnrollment(db, actor(), app as any, requirements, finalize);
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
