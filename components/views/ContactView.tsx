'use client';

import React, { useState } from 'react';
import { usePCM } from '@/lib/store';
import {
  MapPin,
  Phone,
  Mail,
  Clock,
  Send,
  CheckCircle2,
  Building,
  Calendar,
  Compass,
  Navigation,
  ExternalLink,
  ShieldCheck,
} from 'lucide-react';

export const ContactView: React.FC = () => {
  const { addToast } = usePCM();
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    department: 'Admissions Office',
    subject: '',
    message: '',
  });
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitted(true);
    addToast({
      title: 'Inquiry Submitted',
      message: `Your message has been sent to the ${formData.department}. A PCM officer will respond within 24 hours.`,
      type: 'success',
    });
  };

  return (
    <div className="w-full bg-[#FFFFFF] font-sans pb-20">
      {/* Banner */}
      <div className="bg-[#18392B] text-white py-14 lg:py-20 border-b-4 border-[#588B76]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center space-y-3">
          <span className="text-[11px] font-mono font-bold uppercase tracking-widest text-[#588B76]">
            Connect With PCM
          </span>
          <h1 className="font-serif text-3xl sm:text-4xl lg:text-5xl font-extrabold text-white">
            CONTACT & CAMPUS VISIT
          </h1>
          <p className="text-xs sm:text-sm text-slate-200 max-w-2xl mx-auto leading-relaxed font-sans font-light">
            We welcome prospective students, pastors, church delegates, alumni, and prayer partners to visit our hillside campus in Lamtang, Benguet.
          </p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-12">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
          {/* Left Column: Contact Details & Department Directory */}
          <div className="lg:col-span-5 space-y-6">
            <div className="bg-white rounded-sm p-6 border border-slate-200 shadow-xs space-y-4">
              <h3 className="font-serif text-lg font-bold text-[#18392B] border-b border-slate-100 pb-3 flex items-center gap-2">
                <Building className="w-5 h-5 text-[#588B76]" />
                <span>Campus Location & Hours</span>
              </h3>

              <div className="space-y-4 text-xs text-slate-700">
                <div className="flex items-start gap-3">
                  <MapPin className="w-4 h-4 text-[#588B76] shrink-0 mt-0.5" />
                  <div>
                    <strong className="block text-[#18392B] font-serif text-sm">Philippine College of Ministry</strong>
                    <span className="text-slate-600 block mt-0.5">
                      Lamtang, Puguis, La Trinidad, Benguet, Philippines
                    </span>
                    <span className="text-slate-500 font-mono text-[11px] block mt-0.5">
                      Mailing Address: P.O. Box 298, Baguio City 2600, Philippines
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <Phone className="w-4 h-4 text-[#588B76] shrink-0" />
                  <div>
                    <strong className="block text-[#18392B]">Landline & Mobile</strong>
                    <span className="font-mono text-slate-600">+63 74 422 2577 / +63 917 582 1992</span>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <Mail className="w-4 h-4 text-[#588B76] shrink-0" />
                  <div>
                    <strong className="block text-[#18392B]">Electronic Mail</strong>
                    <span className="font-mono text-slate-600">info@pcm.ph | pcmpresident1992@gmail.com</span>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <Clock className="w-4 h-4 text-[#588B76] shrink-0 mt-0.5" />
                  <div>
                    <strong className="block text-[#18392B]">Office & Library Hours</strong>
                    <span className="text-slate-600">
                      Monday – Friday: 8:00 AM – 5:00 PM PHT<br />
                      Saturday: 8:00 AM – 12:00 PM (By Appointment)
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Travel Directions Guide */}
            <div className="bg-[#18392B] text-white rounded-sm p-6 space-y-3 border border-[#588B76]/40 shadow-sm text-xs">
              <h4 className="font-serif text-base font-bold text-[#588B76] flex items-center gap-2">
                <Navigation className="w-4 h-4 text-[#588B76]" />
                <span>How to Get to PCM Lamtang</span>
              </h4>
              <div className="space-y-2.5 text-slate-300 font-light leading-relaxed">
                <p>
                  <strong>From Baguio City Center (Burnham / Bokawkan):</strong> Take a taxi or jeepney bound for Puguis / Lamtang via Naguilian Road. Travel time is approximately 15–20 minutes.
                </p>
                <p>
                  <strong>From La Trinidad KM 4 / Provincial Capitol:</strong> Head through Puguis road towards the Lamtang ridge overlooking the valley.
                </p>
              </div>
            </div>
          </div>

          {/* Right Column: Contact Message Form */}
          <div className="lg:col-span-7">
            <div className="bg-white rounded-sm p-8 border border-slate-200 shadow-xs space-y-6">
              <div className="space-y-1">
                <h3 className="font-serif text-2xl font-bold text-[#18392B]">
                  Send a Message to PCM
                </h3>
                <p className="text-xs text-slate-500">
                  Fill out the official inquiry form below and an administrative officer will respond promptly.
                </p>
              </div>

              {submitted ? (
                <div className="bg-emerald-50 border border-emerald-300 rounded-sm p-6 text-emerald-900 text-center space-y-3">
                  <CheckCircle2 className="w-10 h-10 text-emerald-600 mx-auto" />
                  <h4 className="font-serif text-lg font-bold">Message Dispatched Successfully</h4>
                  <p className="text-xs text-emerald-800 leading-relaxed">
                    Thank you, <strong>{formData.name}</strong>. Your message has been transmitted to the {formData.department}. A representative will contact you at <strong>{formData.email}</strong>.
                  </p>
                  <button
                    onClick={() => {
                      setSubmitted(false);
                      setFormData({
                        name: '',
                        email: '',
                        phone: '',
                        department: 'Admissions Office',
                        subject: '',
                        message: '',
                      });
                    }}
                    className="bg-[#18392B] text-white text-xs font-bold px-4 py-2 rounded-sm uppercase tracking-wider"
                  >
                    Send Another Message
                  </button>
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="space-y-4 text-xs">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block font-semibold text-slate-700 mb-1">
                        Full Name <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        required
                        value={formData.name}
                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                        placeholder="e.g. Pastor Samuel Balais"
                        className="w-full p-2.5 bg-slate-50 border border-slate-200 focus:border-[#588B76] rounded-sm outline-none"
                      />
                    </div>

                    <div>
                      <label className="block font-semibold text-slate-700 mb-1">
                        Email Address <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="email"
                        required
                        value={formData.email}
                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                        placeholder="e.g. samuel@example.com"
                        className="w-full p-2.5 bg-slate-50 border border-slate-200 focus:border-[#588B76] rounded-sm outline-none"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block font-semibold text-slate-700 mb-1">
                        Contact Number
                      </label>
                      <input
                        type="text"
                        value={formData.phone}
                        onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                        placeholder="+63 9XX XXX XXXX"
                        className="w-full p-2.5 bg-slate-50 border border-slate-200 focus:border-[#588B76] rounded-sm outline-none"
                      />
                    </div>

                    <div>
                      <label className="block font-semibold text-slate-700 mb-1">
                        Recipient Department
                      </label>
                      <select
                        value={formData.department}
                        onChange={(e) => setFormData({ ...formData, department: e.target.value })}
                        className="w-full p-2.5 bg-slate-50 border border-slate-200 focus:border-[#588B76] rounded-sm outline-none"
                      >
                        <option>Admissions Office</option>
                        <option>Office of the President</option>
                        <option>Academic Dean & Registrar</option>
                        <option>Senior High School Coordinator</option>
                        <option>Ministry Practicum & Placement</option>
                        <option>General Administration</option>
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">
                      Subject / Topic <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      value={formData.subject}
                      onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                      placeholder="e.g. Senior High Voucher Enrollment Inquiry"
                      className="w-full p-2.5 bg-slate-50 border border-slate-200 focus:border-[#588B76] rounded-sm outline-none"
                    />
                  </div>

                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">
                      Message / Inquiry Details <span className="text-red-500">*</span>
                    </label>
                    <textarea
                      required
                      rows={5}
                      value={formData.message}
                      onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                      placeholder="Please write your detailed inquiry or prayer request here..."
                      className="w-full p-2.5 bg-slate-50 border border-slate-200 focus:border-[#588B76] rounded-sm outline-none resize-y"
                    />
                  </div>

                  <button
                    type="submit"
                    className="w-full bg-[#588B76] hover:bg-[#46705F] text-white font-bold py-3 rounded-sm uppercase tracking-wider transition cursor-pointer flex items-center justify-center gap-2 shadow-sm"
                  >
                    <Send className="w-4 h-4" />
                    <span>Submit Inquiry</span>
                  </button>
                </form>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
