'use client';

import React, { useState, useEffect } from 'react';
import { usePCM } from '@/lib/store';
import { db } from '@/lib/firebase';
import { findOpenApplication } from '@/lib/admissionsService';
import { StudentRegistrationWizard } from '@/components/enrollment/StudentRegistrationWizard';
import { MyApplicationPanel } from '@/components/enrollment/MyApplicationPanel';
import { Search, ShieldCheck, Sparkles, FileText } from 'lucide-react';

// One way to apply: the online registration wizard creates the admission application
// (and carries over any documents uploaded on the way). "Track" shows that application.
export const ApplicationView: React.FC = () => {
  const { activeTrackerRef, firebaseAuthUser, signInWithGoogle, isStudentLoggedIn, studentProfile, navigateTo } = usePCM();

  const [mode, setMode] = useState<'apply' | 'track'>(() => (activeTrackerRef ? 'track' : 'apply'));
  const [isSigningIn, setIsSigningIn] = useState(false);
  // Reference number of the applicant's open application: '' = none, null = not checked yet.
  const [openAppRef, setOpenAppRef] = useState<string | null>(null);

  const handleSignIn = async () => {
    setIsSigningIn(true);
    try {
      await signInWithGoogle();
    } finally {
      setIsSigningIn(false);
    }
  };

  // Opening the tracker from elsewhere on the site.
  useEffect(() => {
    if (activeTrackerRef && activeTrackerRef.trim()) setMode('track');
  }, [activeTrackerRef]);

  // Check for an existing open application before the applicant fills in the form, so they are
  // pointed to it instead of discovering the duplicate only at the final step.
  useEffect(() => {
    if (!firebaseAuthUser) {
      setOpenAppRef(null);
      return;
    }
    let cancelled = false;
    setOpenAppRef(null);
    findOpenApplication(db, {
      uid: firebaseAuthUser.uid,
      name: firebaseAuthUser.displayName || '',
      email: firebaseAuthUser.emailVerified ? firebaseAuthUser.email : null,
    })
      .then((app) => {
        if (!cancelled) setOpenAppRef(app ? app.referenceNumber || app.id : '');
      })
      .catch(() => {
        // If the check fails, submitting still refuses a duplicate and points to the existing one.
        if (!cancelled) setOpenAppRef('');
      });
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [firebaseAuthUser?.uid, mode]);

  // Shown wherever an applicant needs to be signed in.
  const signInCard = (purpose: string) => (
    <div className="mx-auto max-w-lg space-y-4 rounded-2xl border border-slate-200 bg-white p-6 text-center shadow-xl sm:p-8">
      <ShieldCheck className="mx-auto h-10 w-10 text-[#588B76]" />
      <h3 className="font-serif text-xl font-bold text-[#18392B]">Sign in with Google to {purpose}</h3>
      <p className="text-xs leading-relaxed text-slate-600">
        Your application, documents and status updates are tied to your Google account, so only you and the PCM Admissions
        Office can see them. Use the same account every time you check your application.
      </p>
      <button
        type="button"
        onClick={handleSignIn}
        disabled={isSigningIn}
        className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-[#18392B] px-5 py-3 text-sm font-bold text-white hover:bg-[#23533e] disabled:opacity-50"
      >
        {isSigningIn ? 'Opening Google sign-in…' : 'Continue with Google'}
      </button>
    </div>
  );

  const tabClass = (active: boolean) =>
    `px-5 py-2.5 rounded-lg text-xs font-bold transition cursor-pointer flex items-center gap-1.5 ${
      active ? 'bg-amber-400 text-slate-950 shadow-md font-extrabold' : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
    }`;

  return (
    <div className="w-full bg-[#FFFFFF] font-sans pb-20">
      {/* Banner */}
      <div className="bg-[#18392B] text-white py-14 lg:py-20 border-b-4 border-[#588B76]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center space-y-3">
          <span className="text-[11px] font-mono font-bold uppercase tracking-widest text-[#85AA9B]">
            Office of Admissions & Registrar
          </span>
          <h1 className="font-serif text-3xl sm:text-4xl lg:text-5xl font-extrabold text-white">
            PCM ADMISSIONS & APPLICATION PORTAL
          </h1>
          <p className="text-xs sm:text-sm text-slate-300 max-w-2xl mx-auto leading-relaxed font-sans">
            Apply for Academic Year 2026–2027 with one online application, or track the application you already sent.
          </p>

          <div className="pt-4 flex flex-wrap items-center justify-center gap-2">
            <button onClick={() => setMode('apply')} className={tabClass(mode === 'apply')}>
              <Sparkles className={`w-3.5 h-3.5 ${mode === 'apply' ? 'text-slate-950' : 'text-amber-300'}`} />
              <span>Apply Online</span>
            </button>
            <button onClick={() => setMode('track')} className={tabClass(mode === 'track')}>
              <Search className="w-3.5 h-3.5" />
              <span>Track Application Status</span>
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 pt-10">
        {mode === 'track' &&
          (firebaseAuthUser ? <MyApplicationPanel onStartApplication={() => setMode('apply')} /> : signInCard('track your application'))}

        {mode === 'apply' &&
          (!firebaseAuthUser ? (
            signInCard('start your application')
          ) : isStudentLoggedIn ? (
            // Officially enrolled students do not apply again (no duplicate student records).
            <div className="mx-auto max-w-lg space-y-4 rounded-2xl border border-emerald-200 bg-emerald-50 p-6 text-center shadow-sm sm:p-8">
              <FileText className="mx-auto h-10 w-10 text-[#588B76]" />
              <h3 className="font-serif text-xl font-bold text-[#18392B]">You are already an enrolled PCM student</h3>
              <p className="text-xs leading-relaxed text-slate-700">
                Student ID <strong className="font-mono">{studentProfile?.studentId}</strong>. Enrollment for later terms is done in the Student Portal.
              </p>
              <button
                type="button"
                onClick={() => navigateTo('portal')}
                className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-[#18392B] px-5 py-3 text-sm font-bold text-white hover:bg-[#23533e]"
              >
                Open the Student Portal
              </button>
            </div>
          ) : openAppRef === null ? (
            <p className="text-center text-xs text-slate-500 py-10">Checking for an existing application…</p>
          ) : openAppRef ? (
            <div className="mx-auto max-w-lg space-y-4 rounded-2xl border border-emerald-200 bg-emerald-50 p-6 text-center shadow-sm sm:p-8">
              <FileText className="mx-auto h-10 w-10 text-[#588B76]" />
              <h3 className="font-serif text-xl font-bold text-[#18392B]">You already have an application in progress</h3>
              <p className="text-xs leading-relaxed text-slate-700">
                Reference <strong className="font-mono">{openAppRef}</strong>. You don&apos;t need to apply again — upload any
                missing documents and follow each step of your admission and enrollment in your application tracker.
              </p>
              <button
                type="button"
                onClick={() => setMode('track')}
                className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-[#18392B] px-5 py-3 text-sm font-bold text-white hover:bg-[#23533e]"
              >
                Open my application
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="flex items-start gap-2.5 bg-emerald-50/90 p-4 rounded-2xl border border-emerald-200 text-emerald-950 shadow-xs">
                <div className="w-8 h-8 rounded-lg bg-[#18392B] text-white flex items-center justify-center shrink-0">
                  <Sparkles className="w-4 h-4 text-amber-300" />
                </div>
                <div>
                  <h3 className="font-serif font-bold text-sm text-[#18392B]">Online Application for Admission & Enrollment</h3>
                  <p className="text-[11px] text-slate-600">
                    One form for new, returning and transfer students. Each step is checked as you go, you can upload your
                    documents along the way, and submitting creates your official application with the Admissions Office.
                  </p>
                </div>
              </div>
              <StudentRegistrationWizard showAdmissionsBridge={false} enableDraft onCancel={() => setMode('track')} onCompleted={() => setMode('track')} />
            </div>
          ))}
      </div>
    </div>
  );
};
