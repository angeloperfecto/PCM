'use client';

import React, { useState } from 'react';
import { usePCM } from '@/lib/store';
import { Mail, CheckCircle2, Send, Sparkles } from 'lucide-react';

export const NewsletterSection: React.FC = () => {
  const { subscribeNewsletter } = usePCM();
  const [email, setEmail] = useState('');
  const [categories, setCategories] = useState({
    admissions: true,
    theologyJournal: true,
    events: true,
  });
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (email) {
      const ok = subscribeNewsletter(email);
      if (ok) {
        setSubmitted(true);
        setEmail('');
      }
    }
  };

  return (
    <section className="w-full bg-[#18392B] text-white py-14 lg:py-20 border-b border-[#10261D]">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center space-y-6">
        <div className="inline-flex items-center gap-1.5 text-xs font-bold text-[#85AA9B] uppercase tracking-widest font-mono">
          <Sparkles className="w-3.5 h-3.5" />
          <span>PCM Community Newsletter</span>
        </div>

        <h2 className="font-serif text-2xl sm:text-3xl lg:text-4xl font-extrabold text-white">
          STAY CONNECTED WITH PCM
        </h2>

        <p className="text-xs sm:text-sm text-[#D0DED8] max-w-2xl mx-auto leading-relaxed">
          Receive official announcements, theological papers from <em>Veritas et Ministerium</em>, upcoming conference invites, and admissions updates delivered directly to your inbox.
        </p>

        {submitted ? (
          <div className="bg-[#10261D] border border-[#588B76] rounded-xl p-6 text-[#D0DED8] max-w-md mx-auto flex items-center justify-center gap-3 animate-in fade-in">
            <CheckCircle2 className="w-6 h-6 text-[#85AA9B] shrink-0" />
            <div className="text-left text-xs">
              <p className="font-bold text-sm text-white">Thank You for Subscribing!</p>
              <p className="text-[#D0DED8] mt-0.5">
                You are now subscribed to Philippines College of Ministry dispatches.
              </p>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="max-w-xl mx-auto space-y-4">
            <div className="flex flex-col sm:flex-row items-center gap-2 bg-[#10261D] p-1.5 rounded-lg border border-[#588B76]/60 shadow-xl">
              <div className="flex items-center gap-2 px-3 py-2 w-full">
                <Mail className="w-4 h-4 text-[#85AA9B] shrink-0" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Enter your email address (e.g. pastor@church.ph)"
                  required
                  className="bg-transparent text-white placeholder-[#D0DED8]/50 text-xs sm:text-sm focus:outline-none w-full"
                />
              </div>

              <button
                type="submit"
                id="newsletter-btn-subscribe"
                className="w-full sm:w-auto bg-[#588B76] hover:bg-[#46705F] text-white text-xs font-bold px-6 py-3 rounded-md uppercase tracking-wider transition shrink-0 flex items-center justify-center gap-2 cursor-pointer shadow"
              >
                <span>SUBSCRIBE</span>
                <Send className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* Subscription Preference Checkboxes */}
            <div className="flex flex-wrap items-center justify-center gap-4 text-xs text-[#D0DED8]/80 pt-1">
              <label className="flex items-center gap-2 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={categories.admissions}
                  onChange={(e) =>
                    setCategories((prev) => ({ ...prev, admissions: e.target.checked }))
                  }
                  className="rounded text-[#588B76] focus:ring-[#588B76]"
                />
                <span>Admissions & Scholarships</span>
              </label>

              <label className="flex items-center gap-2 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={categories.theologyJournal}
                  onChange={(e) =>
                    setCategories((prev) => ({ ...prev, theologyJournal: e.target.checked }))
                  }
                  className="rounded text-[#588B76] focus:ring-[#588B76]"
                />
                <span>Theological Articles & Sermons</span>
              </label>

              <label className="flex items-center gap-2 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={categories.events}
                  onChange={(e) =>
                    setCategories((prev) => ({ ...prev, events: e.target.checked }))
                  }
                  className="rounded text-[#588B76] focus:ring-[#588B76]"
                />
                <span>National Conferences</span>
              </label>
            </div>
          </form>
        )}
      </div>
    </section>
  );
};
