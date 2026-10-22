'use client';

import React, { useState } from 'react';
import { Trash2, X } from 'lucide-react';
import { auth, db } from '@/lib/firebase';
import { usePCM } from '@/lib/store';
import { cancelAndDeleteMyApplication, cancelBlocker, type CancelReason } from '@/lib/applicantCancel';

// "Cancel or defer my application": deletes the applicant's application, documents, draft, notifications, their
// Users & Roles entry and their sign-in on this website. Shown in the online application and the tracker.
export const CancelApplication: React.FC<{ app?: { status?: string; amountPaidVerified?: number; studentRecordId?: string; referenceNumber?: string } | null; compact?: boolean }> = ({
  app,
  compact,
}) => {
  const { addToast, navigateTo } = usePCM();
  const [open, setOpen] = useState(false);
  const [reason, setReason] = useState<CancelReason>('Cancel');
  const [note, setNote] = useState('');
  const [confirmText, setConfirmText] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const blocker = cancelBlocker(app);
  const word = 'DELETE';

  const run = async () => {
    setBusy(true);
    setError('');
    try {
      const r = await cancelAndDeleteMyApplication(db, auth, reason, note);
      if (!r.ok) return setError(r.message);
      setOpen(false);
      addToast('success', reason === 'Defer' ? 'Application deferred' : 'Application cancelled', r.message);
      navigateTo('home');
    } catch (e: any) {
      setError(e?.code === 'permission-denied' ? 'This application can’t be deleted online. Please contact the Admissions Office.' : 'Something went wrong. Please try again.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <>
      <button
        type="button"
        onClick={() => (setError(''), setConfirmText(''), setOpen(true))}
        className={compact ? 'font-semibold text-slate-700 underline hover:text-rose-700' : 'inline-flex items-center gap-1.5 text-xs font-semibold text-slate-600 hover:text-rose-700'}
      >
        {!compact && <Trash2 className="h-3.5 w-3.5" />}
        Cancel or defer my application
      </button>
      {open && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-slate-950/60 p-4" role="dialog" aria-modal="true" aria-label="Cancel or defer my application">
          <div className="w-full max-w-md space-y-3 rounded-2xl bg-white p-5 text-xs text-slate-700 shadow-2xl" data-testid="cancel-application">
            <div className="flex items-center justify-between">
              <h5 className="text-sm font-bold text-rose-700">Cancel or defer my application</h5>
              <button type="button" onClick={() => setOpen(false)} aria-label="Close" className="rounded-lg p-1 text-slate-400 hover:bg-slate-100">
                <X className="h-4 w-4" />
              </button>
            </div>
            {blocker ? (
              <p className="rounded-lg bg-amber-50 p-3 text-amber-900">{blocker}</p>
            ) : (
              <>
                <div className="grid grid-cols-2 gap-2">
                  {(
                    [
                      ['Cancel', 'Cancel', 'I will not continue my application.'],
                      ['Defer', 'Defer', 'I will apply again for a later intake.'],
                    ] as const
                  ).map(([value, title, hint]) => (
                    <label key={value} className={`cursor-pointer rounded-xl border p-3 ${reason === value ? 'border-rose-400 bg-rose-50' : 'border-slate-200'}`}>
                      <input type="radio" name="cancel-reason" value={value} checked={reason === value} onChange={() => setReason(value)} className="mr-1.5" />
                      <strong>{title}</strong>
                      <span className="mt-0.5 block text-[11px] text-slate-500">{hint}</span>
                    </label>
                  ))}
                </div>
                <div className="rounded-lg border border-rose-200 bg-rose-50 p-3 text-rose-900">
                  <p className="font-bold">This permanently deletes from the website:</p>
                  <ul className="mt-1 list-disc space-y-0.5 pl-4">
                    <li>your application{app?.referenceNumber ? ` (${app.referenceNumber})` : ''}, its documents and status history</li>
                    <li>your saved draft and your notifications</li>
                    <li>your account (Gmail sign-in) on this website</li>
                  </ul>
                  <p className="mt-1">It can’t be undone. {reason === 'Defer' ? 'When you are ready, sign in again with your Gmail and start a new application.' : ''}</p>
                </div>
                <label className="block font-bold text-slate-600">
                  Reason (optional, sent to the Admissions Office without your details)
                  <input value={note} onChange={(e) => setNote(e.target.value)} className="mt-1 w-full rounded-lg border border-slate-300 p-2 font-normal" />
                </label>
                <label className="block font-bold text-slate-600">
                  Type {word} to confirm
                  <input value={confirmText} onChange={(e) => setConfirmText(e.target.value.toUpperCase())} className="mt-1 w-full rounded-lg border border-slate-300 p-2 font-mono font-normal" />
                </label>
                {error && (
                  <p role="alert" className="font-medium text-rose-700">
                    {error}
                  </p>
                )}
                <div className="flex justify-end gap-2">
                  <button type="button" onClick={() => setOpen(false)} className="rounded-lg px-3 py-2 font-semibold text-slate-600 hover:bg-slate-100">
                    Keep my application
                  </button>
                  <button type="button" disabled={busy || confirmText !== word} onClick={run} className="rounded-lg bg-rose-600 px-4 py-2 font-bold text-white hover:bg-rose-700 disabled:opacity-40">
                    {busy ? 'Deleting…' : reason === 'Defer' ? 'Defer and delete my information' : 'Cancel and delete my information'}
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </>
  );
};
