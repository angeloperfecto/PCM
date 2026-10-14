'use client';

import React, { useMemo, useState } from 'react';
import { Bell, BookOpen, History, Info, MessageSquare } from 'lucide-react';
import { usePCM } from '@/lib/store';
import { db, auth } from '@/lib/firebase';
import { submitPayment, uploadRequirementFile } from '@/lib/admissionsService';
import { ApplicantPaymentSection } from './PaymentSection';
import { ADMITTED_PORTAL_STATUSES, isOpenApplication, nextStepsFor, normalizeStatus, statusLabel, summarizeRequirements } from '@/lib/enrollmentWorkflow';
import { ApplicationProgress, StatusBadge } from './ApplicationProgress';
import { RequirementsChecklist } from './RequirementsChecklist';
import { useApplicationDetails } from './useApplicationDetails';
import { CorrectionForm, EnrollmentConfirmationCard, RegistrationForm, RegistrationSummary, WithdrawApplication } from './ApplicantSteps';

// The signed-in applicant's own application(s): progress tracker, next steps, documents
// to upload, notifications and status history.
export const MyApplicationPanel: React.FC<{ onStartApplication?: () => void }> = ({ onStartApplication }) => {
  const { applications, studentNotifications, firebaseAuthUser, navigateTo, markNotificationRead, currentSection } = usePCM();

  // Admins have every application loaded, so always filter to the signed-in user's own.
  const mine = useMemo(() => {
    const uid = firebaseAuthUser?.uid;
    const email = firebaseAuthUser?.emailVerified ? (firebaseAuthUser.email || '').toLowerCase() : '';
    return applications
      .filter((a) => (uid && a.applicantUid === uid) || (email && (a.email || '').toLowerCase() === email))
      .sort((a, b) => (b.createdAt || b.submissionDate || '').localeCompare(a.createdAt || a.submissionDate || ''));
  }, [applications, firebaseAuthUser]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const app = mine.find((a) => a.id === selectedId) || mine[0];
  const { requirements, history, payments, loading, error } = useApplicationDetails(app?.id);

  if (!firebaseAuthUser) return null;

  if (!app) {
    return (
      <div className="space-y-3 rounded-2xl border border-slate-200 bg-white p-6 text-center shadow-sm">
        <Info className="mx-auto h-8 w-8 text-[#588B76]" />
        <p className="text-sm font-semibold text-slate-800">No application found for {firebaseAuthUser.email}.</p>
        <p className="text-xs text-slate-500">
          If you applied with a different email address, sign in with that Google account. Otherwise you can start a new application.
        </p>
        {onStartApplication && (
          <button
            type="button"
            onClick={onStartApplication}
            className="rounded-lg bg-[#18392B] px-5 py-2.5 text-xs font-bold text-white hover:bg-[#23533e]"
          >
            Start an application
          </button>
        )}
      </div>
    );
  }

  const status = normalizeStatus(app.status);
  const summary = summarizeRequirements(requirements);
  const notifications = studentNotifications
    .filter((n) => n.recipientUid === firebaseAuthUser.uid && (n.applicationId === app.id || !n.applicationId))
    .sort((a, b) => (b.createdAt || '').localeCompare(a.createdAt || ''));
  const canEditDocuments = isOpenApplication(app.status);

  return (
    <div className="space-y-5" data-testid="my-application">
      {mine.length > 1 && (
        <label className="block text-xs font-semibold text-slate-600">
          Application
          <select
            value={app.id}
            onChange={(e) => setSelectedId(e.target.value)}
            className="mt-1 w-full rounded-lg border border-slate-300 bg-white p-2 text-sm"
          >
            {mine.map((a) => (
              <option key={a.id} value={a.id}>
                {a.referenceNumber} — {statusLabel(a.status)}
              </option>
            ))}
          </select>
        </label>
      )}

      <div className="space-y-4 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <p className="font-mono text-[11px] font-bold uppercase text-[#588B76]">Reference {app.referenceNumber}</p>
            <h3 className="font-serif text-xl font-bold text-[#18392B]">{app.fullName}</h3>
            <p className="text-xs text-slate-600">{app.programName || app.program}</p>
          </div>
          <StatusBadge status={app.status} />
        </div>

        <ApplicationProgress status={app.status} />

        <div
          className={`rounded-xl border p-4 text-xs ${
            status === 'Requirements Incomplete' || status === 'For Correction' || status === 'For Registration' ? 'border-amber-300 bg-amber-50 text-amber-950' : 'border-slate-200 bg-slate-50 text-slate-700'
          }`}
        >
          <p className="mb-1 font-bold text-[#18392B]">What happens next</p>
          <p data-testid="next-steps">{nextStepsFor(app.status, summary)}</p>
          {app.applicantMessage && (
            <p className="mt-2 flex items-start gap-1.5 rounded-lg bg-white/70 p-2 text-slate-800">
              <MessageSquare className="mt-0.5 h-3.5 w-3.5 shrink-0 text-[#588B76]" />
              <span>
                <strong>Note from the Admissions Office:</strong> {app.applicantMessage}
              </span>
            </p>
          )}
          {(status === 'Enrolled' || (ADMITTED_PORTAL_STATUSES.includes(status) && currentSection !== 'portal')) && (
            <button
              type="button"
              onClick={() => navigateTo('portal')}
              className="mt-3 inline-flex items-center gap-1.5 rounded-lg bg-[#18392B] px-4 py-2 text-xs font-bold text-white hover:bg-[#23533e]"
            >
              <BookOpen className="h-3.5 w-3.5" /> Open the Student Portal
            </button>
          )}
        </div>
      </div>

      <EnrollmentConfirmationCard app={app as any} payments={payments} />
      {status === 'For Correction' && <CorrectionForm key={app.id + (app.updatedAt || '')} app={app as any} />}
      {status === 'For Registration' && <RegistrationForm key={app.id} app={app as any} />}
      {(app as any).registration && status !== 'For Registration' && <RegistrationSummary registration={(app as any).registration} />}

      <ApplicantPaymentSection
        status={app.status}
        assessment={(app as any).assessment}
        paymentStatus={(app as any).paymentStatus}
        payments={payments}
        onSubmit={(input) =>
          submitPayment(db, { uid: auth.currentUser?.uid || '', name: app.fullName, email: auth.currentUser?.email }, app as any, input)
        }
      />

      <section className="space-y-3 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
        <h4 className="font-serif text-lg font-bold text-[#18392B]">Admission requirements</h4>
        {loading ? (
          <p className="text-xs text-slate-500">Loading your documents…</p>
        ) : error ? (
          <p role="alert" className="text-xs text-rose-700">{error}</p>
        ) : (
          <RequirementsChecklist
            mode="applicant"
            requirements={requirements}
            readOnly={!canEditDocuments}
            onUpload={(req, file) =>
              uploadRequirementFile(
                db,
                { uid: auth.currentUser?.uid || '', name: app.fullName, email: auth.currentUser?.email },
                app as any,
                req,
                requirements,
                file
              )
            }
          />
        )}
      </section>

      <div className="grid gap-5 lg:grid-cols-2">
        <section className="space-y-2 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <h4 className="flex items-center gap-1.5 font-serif text-base font-bold text-[#18392B]">
            <Bell className="h-4 w-4 text-[#588B76]" /> Notifications
          </h4>
          {notifications.length === 0 ? (
            <p className="text-xs text-slate-500">No notifications yet.</p>
          ) : (
            <ul className="max-h-72 space-y-2 overflow-y-auto">
              {notifications.map((n) => (
                <li
                  key={n.id}
                  className={`rounded-lg border p-2.5 text-xs ${n.read ? 'border-slate-100 bg-white text-slate-600' : 'border-[#588B76]/40 bg-emerald-50/60 text-slate-800'}`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <strong className="text-[#18392B]">{n.title}</strong>
                    {!n.read && (
                      <button type="button" onClick={() => markNotificationRead(n.id)} className="shrink-0 text-[10px] font-semibold text-[#588B76] underline">
                        Mark read
                      </button>
                    )}
                  </div>
                  <p className="mt-0.5">{n.message}</p>
                  <p className="mt-1 text-[10px] text-slate-400">{n.createdAt ? new Date(n.createdAt).toLocaleString() : ''}</p>
                </li>
              ))}
            </ul>
          )}
        </section>

        <section className="space-y-2 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <h4 className="flex items-center gap-1.5 font-serif text-base font-bold text-[#18392B]">
            <History className="h-4 w-4 text-[#588B76]" /> Status history
          </h4>
          {history.length === 0 ? (
            <p className="text-xs text-slate-500">No status changes recorded yet.</p>
          ) : (
            <ol className="space-y-2 border-l-2 border-[#588B76]/30 pl-3">
              {history.map((h) => (
                <li key={h.id} className="text-xs">
                  <div className="flex flex-wrap items-center gap-2">
                    <StatusBadge status={h.status} />
                    <span className="text-[10px] text-slate-400">{h.at ? new Date(h.at).toLocaleString() : ''}</span>
                  </div>
                  {h.note && <p className="mt-0.5 text-slate-700">{h.note}</p>}
                </li>
              ))}
            </ol>
          )}
        </section>
      </div>

      <WithdrawApplication app={app as any} />
    </div>
  );
};
