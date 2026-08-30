'use client';

import React, { useState } from 'react';
import { usePCM } from '@/lib/store';
import {
  X,
  Calendar,
  Clock,
  MapPin,
  User,
  CheckCircle2,
  Send,
  Sparkles,
} from 'lucide-react';

export const EventDetailModal: React.FC = () => {
  const { selectedEvent, setSelectedEvent, registerForEvent } = usePCM();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [church, setChurch] = useState('');
  const [registered, setRegistered] = useState(false);

  if (!selectedEvent) return null;

  const handleRegister = (e: React.FormEvent) => {
    e.preventDefault();
    if (name && email) {
      registerForEvent(selectedEvent.id, name, email);
      setRegistered(true);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-in fade-in duration-200">
      <div
        className="bg-white rounded-xl shadow-2xl border border-slate-200 max-w-2xl w-full max-h-[90vh] overflow-y-auto font-sans animate-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="bg-[#18392B] text-white p-6 border-b border-[#588B76]/40 flex items-start justify-between">
          <div>
            <span className="text-[10px] font-mono font-bold uppercase tracking-wider bg-[#588B76] text-[#18392B] px-2.5 py-0.5 rounded">
              {selectedEvent.category}
            </span>
            <h3 className="font-serif text-xl sm:text-2xl font-bold text-white mt-2">
              {selectedEvent.title}
            </h3>
          </div>

          <button
            onClick={() => setSelectedEvent(null)}
            className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition cursor-pointer"
            aria-label="Close"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Event Body */}
        <div className="p-6 sm:p-8 space-y-6 text-slate-700 text-sm">
          {/* Key Logistics */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 bg-[#FFFFFF] p-4 rounded-xl border border-slate-200 text-xs">
            <div className="flex items-center gap-2.5">
              <Calendar className="w-4 h-4 text-[#588B76] shrink-0" />
              <div>
                <span className="text-slate-500 block text-[10px] uppercase">Date</span>
                <strong className="text-[#18392B]">{selectedEvent.date}</strong>
              </div>
            </div>

            <div className="flex items-center gap-2.5">
              <Clock className="w-4 h-4 text-[#588B76] shrink-0" />
              <div>
                <span className="text-slate-500 block text-[10px] uppercase">Time</span>
                <strong className="text-[#18392B]">{selectedEvent.time}</strong>
              </div>
            </div>

            <div className="flex items-center gap-2.5 sm:col-span-2">
              <MapPin className="w-4 h-4 text-[#588B76] shrink-0" />
              <div>
                <span className="text-slate-500 block text-[10px] uppercase">Venue</span>
                <strong className="text-[#18392B]">{selectedEvent.location}</strong>
              </div>
            </div>

            {selectedEvent.speaker && (
              <div className="flex items-center gap-2.5 sm:col-span-2">
                <User className="w-4 h-4 text-[#588B76] shrink-0" />
                <div>
                  <span className="text-slate-500 block text-[10px] uppercase">Featured Speaker / Presider</span>
                  <strong className="text-[#18392B]">{selectedEvent.speaker}</strong>
                </div>
              </div>
            )}
          </div>

          {/* Description */}
          <div className="space-y-2">
            <h4 className="font-serif text-base font-bold text-[#18392B]">
              About this Event
            </h4>
            <p className="text-slate-600 leading-relaxed text-xs sm:text-sm">
              {selectedEvent.description}
            </p>
          </div>

          {/* RSVP Registration Form */}
          <div className="border-t border-slate-200 pt-6">
            <h4 className="font-serif text-base font-bold text-[#18392B] mb-1">
              Event Registration & RSVP
            </h4>
            <p className="text-xs text-slate-500 mb-4">
              Reserve your seat or join the livestream cohort. Admission is open to pastors, students, and ministry leaders.
            </p>

            {registered ? (
              <div className="bg-emerald-50 border border-emerald-300 rounded-xl p-5 text-emerald-900 flex items-center gap-3">
                <CheckCircle2 className="w-6 h-6 text-emerald-600 shrink-0" />
                <div className="text-xs">
                  <p className="font-bold text-sm">Registration Confirmed!</p>
                  <p className="text-emerald-700 mt-0.5">
                    We have sent the confirmation packet and calendar invite to <strong>{email}</strong>.
                  </p>
                </div>
              </div>
            ) : (
              <form onSubmit={handleRegister} className="space-y-3 bg-[#FFFFFF] p-4 rounded-xl border border-slate-200 text-xs">
                <div>
                  <label className="block text-slate-700 font-semibold mb-1">
                    Full Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Pastor / Brother / Sister..."
                    className="w-full p-2 rounded border border-slate-300 focus:border-[#588B76] focus:outline-none"
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
                      placeholder="your.email@gmail.com"
                      className="w-full p-2 rounded border border-slate-300 focus:border-[#588B76] focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-slate-700 font-semibold mb-1">
                      Local Church / Organization
                    </label>
                    <input
                      type="text"
                      value={church}
                      onChange={(e) => setChurch(e.target.value)}
                      placeholder="e.g. Grace Evangelical Church QC"
                      className="w-full p-2 rounded border border-slate-300 focus:border-[#588B76] focus:outline-none"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  className="w-full bg-[#18392B] hover:bg-[#588B76] hover:text-[#18392B] text-white font-bold py-2.5 rounded transition flex items-center justify-center gap-2 uppercase tracking-wider cursor-pointer"
                >
                  <span>Complete Event RSVP</span>
                  <Send className="w-3.5 h-3.5" />
                </button>
              </form>
            )}
          </div>
        </div>

        {/* Modal Footer */}
        <div className="bg-slate-50 p-4 sm:px-8 border-t border-slate-200 flex justify-end">
          <button
            onClick={() => setSelectedEvent(null)}
            className="text-xs font-semibold text-slate-600 hover:text-slate-900 transition cursor-pointer"
          >
            Close Window
          </button>
        </div>
      </div>
    </div>
  );
};
