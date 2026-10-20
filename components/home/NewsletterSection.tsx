'use client';

import React, { useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { usePCM } from '@/lib/store';
import { CheckCircle2, Mail, Send, Sparkles } from 'lucide-react';
import { LightField } from './fx/LightField';
import { Reveal } from './fx/motion';

// Newsletter sign-up on a night-sky band (uses the store's subscribeNewsletter, as before).
export const NewsletterSection: React.FC = () => {
  const { subscribeNewsletter } = usePCM();
  const [email, setEmail] = useState('');
  const [categories, setCategories] = useState({ admissions: true, theologyJournal: true, events: true });
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (email && subscribeNewsletter(email)) {
      setSubmitted(true);
      setEmail('');
    }
  };

  const prefs: [keyof typeof categories, string][] = [
    ['admissions', 'Admissions & Scholarships'],
    ['theologyJournal', 'Theological Articles & Sermons'],
    ['events', 'National Conferences'],
  ];

  return (
    <section className="font-text grain relative isolate w-full overflow-hidden bg-[#0b1d16] py-20 text-white lg:py-28">
      <LightField className="-z-10 mix-blend-screen" intensity={0.6} origin={[0.5, -0.3]} />
      <div aria-hidden="true" className="pointer-events-none absolute inset-x-0 bottom-0 -z-10 h-1/2 bg-[radial-gradient(ellipse_at_50%_120%,rgba(88,139,118,0.45),transparent_65%)]" />
      <Reveal className="relative mx-auto max-w-3xl px-4 text-center sm:px-6">
        <span className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/[0.06] px-4 py-1.5 text-[11px] font-semibold uppercase tracking-[0.22em] text-[#f6e3b4]">
          <Sparkles className="h-3.5 w-3.5" /> PCM Community Newsletter
        </span>
        <h2 className="font-display mt-5 text-4xl font-semibold leading-[1.05] sm:text-5xl lg:text-6xl">
          Stay <span className="text-dawn italic">connected</span> with PCM
        </h2>
        <p className="mx-auto mt-4 max-w-2xl text-sm leading-relaxed text-white/70 sm:text-base">
          Receive official announcements, theological papers from <em>Veritas et Ministerium</em>, upcoming conference invites, and admissions updates delivered directly to your inbox.
        </p>

        <AnimatePresence mode="wait">
          {submitted ? (
            <motion.div
              key="done"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="mx-auto mt-10 flex max-w-md items-center gap-4 rounded-3xl border border-[#e8c77a]/30 bg-white/[0.06] p-6 text-left backdrop-blur-md"
            >
              <motion.span initial={{ scale: 0, rotate: -90 }} animate={{ scale: 1, rotate: 0 }} transition={{ type: 'spring', stiffness: 260, damping: 14, delay: 0.1 }}>
                <CheckCircle2 className="h-10 w-10 text-[#e8c77a]" />
              </motion.span>
              <span>
                <span className="block font-semibold text-white">Thank you for subscribing!</span>
                <span className="mt-0.5 block text-sm text-white/70">You are now subscribed to Philippine College of Ministry dispatches.</span>
              </span>
            </motion.div>
          ) : (
            <motion.form key="form" exit={{ opacity: 0, y: -10 }} onSubmit={handleSubmit} className="mx-auto mt-10 max-w-xl">
              <div className="group relative rounded-full bg-gradient-to-r from-[#e8c77a]/60 via-white/15 to-[#588b76]/60 p-px transition focus-within:from-[#e8c77a] focus-within:to-[#85aa9b]">
                <div className="flex flex-col items-stretch gap-2 rounded-[1.6rem] bg-[#0f251c]/95 p-2 sm:flex-row sm:items-center sm:rounded-full">
                  <label className="flex flex-1 items-center gap-3 px-4 py-2">
                    <Mail className="h-4 w-4 shrink-0 text-[#e8c77a]" />
                    <span className="sr-only">Email address</span>
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="Your email address"
                      required
                      className="w-full bg-transparent text-sm text-white placeholder-white/40 focus:outline-none"
                    />
                  </label>
                  <button
                    type="submit"
                    id="newsletter-btn-subscribe"
                    className="btn-shimmer inline-flex items-center justify-center gap-2 rounded-full bg-gradient-to-r from-[#e8c77a] to-[#f6e3b4] px-6 py-3 text-sm font-bold text-[#10261d]"
                  >
                    Subscribe <Send className="h-4 w-4" />
                  </button>
                </div>
              </div>
              <div className="mt-5 flex flex-wrap items-center justify-center gap-2">
                {prefs.map(([key, label]) => (
                  <label
                    key={key}
                    className={`cursor-pointer select-none rounded-full border px-4 py-2 text-xs font-medium transition ${
                      categories[key] ? 'border-[#e8c77a]/50 bg-[#e8c77a]/10 text-[#f6e3b4]' : 'border-white/15 text-white/60 hover:text-white'
                    }`}
                  >
                    <input type="checkbox" className="sr-only" checked={categories[key]} onChange={(e) => setCategories((prev) => ({ ...prev, [key]: e.target.checked }))} />
                    {categories[key] ? '✓ ' : ''}
                    {label}
                  </label>
                ))}
              </div>
            </motion.form>
          )}
        </AnimatePresence>
      </Reveal>
    </section>
  );
};
