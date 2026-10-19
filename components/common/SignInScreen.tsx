'use client';

import React from 'react';
import { Loader2, ShieldCheck } from 'lucide-react';
import { Emblem } from '@/components/common/Emblem';

export interface SignInFeature {
  icon: React.ElementType;
  title: string;
  text: string;
}

interface Props {
  /** Unique id for the emblem's SVG gradients. */
  emblemId: string;
  /** Small label above the title, e.g. "Student Portal". */
  eyebrow: string;
  title: string;
  subtitle: string;
  features: SignInFeature[];
  heading: string;
  description: string;
  buttonId?: string;
  buttonLabel: string;
  busyLabel: string;
  busy: boolean;
  onSignIn: () => void;
  /** Help shown under the button. */
  notes?: React.ReactNode;
  /** Optional block under a divider (e.g. a link to the admissions portal). */
  secondary?: React.ReactNode;
}

const GoogleMark = () => (
  <svg className="h-5 w-5 shrink-0" viewBox="0 0 24 24" aria-hidden="true">
    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" />
    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
  </svg>
);

// The sign-in screen shared by the Student Portal and the Admin area: a brand panel (what the area is
// for) beside a sign-in panel with Google sign-in. Stacks on small screens.
export const SignInScreen: React.FC<Props> = ({
  emblemId,
  eyebrow,
  title,
  subtitle,
  features,
  heading,
  description,
  buttonId,
  buttonLabel,
  busyLabel,
  busy,
  onSignIn,
  notes,
  secondary,
}) => (
  <div className="flex min-h-[85vh] w-full items-center justify-center bg-[#eef2ef] px-4 py-10 font-sans sm:py-16">
    <div className="grid w-full max-w-5xl overflow-hidden rounded-3xl bg-white shadow-[0_24px_60px_-20px_rgba(15,38,28,0.35)] ring-1 ring-[#18392B]/10 lg:grid-cols-[1.05fr_1fr]">
      {/* Brand panel */}
      <aside className="relative overflow-hidden bg-gradient-to-br from-[#0f261c] via-[#18392B] to-[#2a5a45] px-6 py-8 text-white sm:px-10 sm:py-10 lg:px-12 lg:py-14">
        <div aria-hidden="true" className="pointer-events-none absolute -right-24 -top-24 h-72 w-72 rounded-full bg-[#588B76]/25 blur-3xl" />
        <div aria-hidden="true" className="pointer-events-none absolute -bottom-28 -left-20 h-72 w-72 rounded-full bg-amber-300/10 blur-3xl" />
        <div className="relative flex h-full flex-col">
          <div className="flex items-center gap-3">
            <span className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-white/10 p-1.5 ring-1 ring-white/20 backdrop-blur-sm">
              <Emblem id={emblemId} size={48} className="h-12 w-12 drop-shadow" />
            </span>
            <span className="leading-tight">
              <span className="block text-[11px] font-semibold uppercase tracking-[0.18em] text-emerald-200/90">Philippine College of Ministry</span>
              <span className="block text-sm font-semibold text-white/90">{eyebrow}</span>
            </span>
          </div>

          <h1 className="mt-6 font-serif text-2xl font-bold leading-tight sm:mt-8 sm:text-4xl">{title}</h1>
          <p className="mt-3 max-w-md text-sm leading-relaxed text-emerald-50/80">{subtitle}</p>

          <ul className="mt-8 hidden space-y-4 sm:block">
            {features.map(({ icon: Icon, title: t, text }) => (
              <li key={t} className="flex gap-3">
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-white/10 ring-1 ring-white/15">
                  <Icon className="h-4 w-4 text-amber-200" aria-hidden="true" />
                </span>
                <span>
                  <span className="block text-sm font-semibold">{t}</span>
                  <span className="block text-xs leading-relaxed text-emerald-50/70">{text}</span>
                </span>
              </li>
            ))}
          </ul>
        </div>
      </aside>

      {/* Sign-in panel */}
      <main className="flex flex-col justify-center px-6 py-8 sm:px-10 sm:py-12 lg:px-12">
        <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-[#588B76]">Sign in</p>
        <h2 className="mt-1 font-serif text-2xl font-bold text-[#18392B] sm:text-3xl">{heading}</h2>
        <p className="mt-2 text-sm leading-relaxed text-slate-600">{description}</p>

        <button
          id={buttonId}
          type="button"
          onClick={onSignIn}
          disabled={busy}
          aria-busy={busy}
          className="mt-7 flex w-full items-center justify-center gap-3 rounded-xl border border-slate-300 bg-white px-4 py-3.5 text-sm font-semibold text-slate-800 shadow-sm transition hover:border-slate-400 hover:bg-slate-50 hover:shadow focus:outline-none focus-visible:ring-2 focus-visible:ring-[#588B76] focus-visible:ring-offset-2 disabled:cursor-wait disabled:opacity-70"
        >
          {busy ? <Loader2 className="h-5 w-5 animate-spin text-[#18392B]" aria-hidden="true" /> : <GoogleMark />}
          <span>{busy ? busyLabel : buttonLabel}</span>
        </button>

        {notes && <div className="mt-5 space-y-2.5 rounded-xl border border-slate-200 bg-slate-50 p-4 text-xs leading-relaxed text-slate-600">{notes}</div>}

        {secondary && (
          <div className="mt-6">
            <div className="flex items-center gap-3" aria-hidden="true">
              <span className="h-px flex-1 bg-slate-200" />
              <span className="text-[10px] font-semibold uppercase tracking-[0.16em] text-slate-400">or</span>
              <span className="h-px flex-1 bg-slate-200" />
            </div>
            <div className="mt-4">{secondary}</div>
          </div>
        )}

        <p className="mt-8 flex items-center gap-1.5 text-[11px] text-slate-500">
          <ShieldCheck className="h-3.5 w-3.5 shrink-0 text-[#588B76]" aria-hidden="true" />
          Secure sign-in through Google. PCM never sees your Google password.
        </p>
      </main>
    </div>
  </div>
);
