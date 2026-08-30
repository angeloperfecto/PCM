'use client';

import React, { useState } from 'react';
import { usePCM } from '@/lib/store';
import { X, Send, CheckCircle2, HelpCircle, BookOpen } from 'lucide-react';

export const RequestInfoModal: React.FC = () => {
  const { isRequestInfoModalOpen, setRequestInfoModalOpen, programs, addToast } = usePCM();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [programInterest, setProgramInterest] = useState(programs[0]?.name || 'Bachelor of Theology');
  const [questions, setQuestions] = useState('');
  const [submitted, setSubmitted] = useState(false);

  if (!isRequestInfoModalOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitted(true);
    addToast({
      title: 'Information Packet Dispatched',
      message: `An admissions counselor has sent the digital prospectus to ${email}.`,
      type: 'success',
    });
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-in fade-in duration-200">
      <div
        className="bg-white rounded-xl shadow-2xl border border-slate-200 max-w-lg w-full max-h-[90vh] overflow-y-auto font-sans animate-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="bg-[#18392B] text-white p-6 border-b border-[#588B76]/40 flex items-start justify-between">
          <div>
            <div className="flex items-center gap-1.5 text-xs text-[#85AA9B] font-mono uppercase mb-1">
              <HelpCircle className="w-4 h-4" />
              <span>Admissions Inquiries</span>
            </div>
            <h3 className="font-serif text-xl sm:text-2xl font-bold text-white">
              REQUEST INFORMATION
            </h3>
          </div>

          <button
            onClick={() => {
              setRequestInfoModalOpen(false);
              setSubmitted(false);
            }}
            className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition cursor-pointer"
            aria-label="Close"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 sm:p-8 space-y-4 text-xs text-slate-700">
          {submitted ? (
            <div className="text-center py-8 space-y-4">
              <div className="w-16 h-16 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto shadow-inner">
                <CheckCircle2 className="w-10 h-10" />
              </div>
              <h4 className="font-serif text-xl font-bold text-[#18392B]">
                Inquiry Received!
              </h4>
              <p className="text-slate-600 leading-relaxed text-xs">
                Thank you, <strong>{name}</strong>. An admissions mentor from the Philippine College of Ministry will reach out to you within 24 hours at <strong>{email}</strong>.
              </p>
              <button
                onClick={() => {
                  setRequestInfoModalOpen(false);
                  setSubmitted(false);
                }}
                className="bg-[#18392B] text-white px-6 py-2.5 rounded font-bold uppercase tracking-wider text-xs hover:bg-[#14234b] transition cursor-pointer"
              >
                Close Window
              </button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-3.5">
              <p className="text-slate-600 leading-relaxed">
                Fill in your contact details below to receive our official Academic Prospectus, Financial Aid guide, and schedule a 1-on-1 counseling appointment.
              </p>

              <div>
                <label className="block text-slate-700 font-semibold mb-1">
                  Full Name *
                </label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Juan Dela Cruz"
                  className="w-full p-2.5 rounded border border-slate-300 focus:border-[#588B76] focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 font-semibold mb-1">
                    Email Address *
                  </label>
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="juan@gmail.com"
                    className="w-full p-2.5 rounded border border-slate-300 focus:border-[#588B76] focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-slate-700 font-semibold mb-1">
                    Mobile / Viber Number
                  </label>
                  <input
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="+63 917 123 4567"
                    className="w-full p-2.5 rounded border border-slate-300 focus:border-[#588B76] focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-700 font-semibold mb-1">
                  Program of Interest *
                </label>
                <select
                  value={programInterest}
                  onChange={(e) => setProgramInterest(e.target.value)}
                  className="w-full p-2.5 rounded border border-slate-300 focus:border-[#588B76] focus:outline-none bg-white"
                >
                  {programs.map((p) => (
                    <option key={p.id} value={p.name}>
                      {p.name} ({p.code})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-slate-700 font-semibold mb-1">
                  Specific Questions or Prayer Requests
                </label>
                <textarea
                  rows={3}
                  value={questions}
                  onChange={(e) => setQuestions(e.target.value)}
                  placeholder="Ask about admissions criteria, dormitory housing, or scholarships..."
                  className="w-full p-2.5 rounded border border-slate-300 focus:border-[#588B76] focus:outline-none"
                />
              </div>

              <button
                type="submit"
                className="w-full bg-[#588B76] hover:bg-[#85AA9B] text-[#18392B] text-xs font-bold py-3 rounded uppercase tracking-wider transition flex items-center justify-center gap-2 cursor-pointer shadow"
              >
                <span>SEND INFORMATION PACKET</span>
                <Send className="w-3.5 h-3.5" />
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};
