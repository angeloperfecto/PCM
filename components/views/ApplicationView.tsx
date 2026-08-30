'use client';

import React, { useState } from 'react';
import { usePCM } from '@/lib/store';
import { ProgramLevel } from '@/lib/types';
import {
  FileEdit,
  CheckCircle2,
  Search,
  ArrowRight,
  ArrowLeft,
  Send,
  Sparkles,
  ShieldCheck,
  User,
  BookOpen,
  Church,
  FileText,
  AlertCircle,
  Copy,
} from 'lucide-react';

export const ApplicationView: React.FC = () => {
  const { programs, submitApplication, getApplicationByRef, addToast } = usePCM();

  // Mode: 'apply' or 'track'
  const [mode, setMode] = useState<'apply' | 'track'>('apply');

  // Step 1 to 4
  const [step, setStep] = useState(1);

  // Application Form State
  const [formData, setFormData] = useState({
    programId: programs[0]?.id || 'bth',
    programName: programs[0]?.name || 'Bachelor of Theology',
    programLevel: (programs[0]?.level || 'undergraduate') as ProgramLevel,
    fullName: '',
    email: '',
    phone: '',
    birthDate: '',
    gender: 'Male',
    civilStatus: 'Single',
    address: '',
    churchName: '',
    pastorName: '',
    pastorPhone: '',
    testimony: '',
    ministryCalling: '',
    previousEducation: '',
    highSchoolOrCollege: '',
    yearGraduated: '2024',
  });

  const [submittedRef, setSubmittedRef] = useState<string | null>(null);

  // Tracker State
  const [trackRef, setTrackRef] = useState('');
  const [trackedApp, setTrackedApp] = useState<any | null>(null);
  const [searched, setSearched] = useState(false);

  // Handle Program select
  const handleProgramSelect = (progId: string) => {
    const p = programs.find((x) => x.id === progId);
    if (p) {
      setFormData((prev) => ({
        ...prev,
        programId: p.id,
        programName: p.name,
        programLevel: p.level,
      }));
    }
  };

  // Submit Application
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.fullName || !formData.email || !formData.testimony) {
      addToast({
        title: 'Incomplete Fields',
        message: 'Please provide your full name, email, and spiritual testimony.',
        type: 'error',
      });
      return;
    }

    const ref = submitApplication(formData);
    setSubmittedRef(ref);
  };

  // Track Application Lookup
  const handleTrack = (e: React.FormEvent) => {
    e.preventDefault();
    if (!trackRef.trim()) return;
    const found = getApplicationByRef(trackRef.trim());
    setTrackedApp(found || null);
    setSearched(true);
  };

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
            Submit your online application for Academic Year 2026–2027 or track an existing application status in real-time.
          </p>

          <div className="pt-4 flex items-center justify-center gap-2">
            <button
              onClick={() => setMode('apply')}
              className={`px-5 py-2.5 rounded-lg text-xs font-bold transition cursor-pointer ${
                mode === 'apply'
                  ? 'bg-[#588B76] text-[#18392B] shadow-md'
                  : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
              }`}
            >
              Start New Application
            </button>
            <button
              onClick={() => setMode('track')}
              className={`px-5 py-2.5 rounded-lg text-xs font-bold transition cursor-pointer flex items-center gap-1.5 ${
                mode === 'track'
                  ? 'bg-[#588B76] text-[#18392B] shadow-md'
                  : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
              }`}
            >
              <Search className="w-3.5 h-3.5" />
              <span>Track Application Status</span>
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 pt-10">
        {/* MODE 1: TRACK APPLICATION */}
        {mode === 'track' && (
          <div className="bg-white rounded-2xl p-6 sm:p-8 border border-slate-200 shadow-xl space-y-6">
            <div className="text-center space-y-1">
              <h3 className="font-serif text-2xl font-bold text-[#18392B]">
                Track Your Admissions Application
              </h3>
              <p className="text-xs text-slate-500">
                Enter the reference number assigned upon submitting your PCM application (e.g., <code>PCM-2026-4821</code>).
              </p>
            </div>

            <form onSubmit={handleTrack} className="flex gap-2 max-w-lg mx-auto">
              <input
                type="text"
                required
                value={trackRef}
                onChange={(e) => setTrackRef(e.target.value)}
                placeholder="PCM-2026-XXXX"
                className="w-full p-3 rounded-lg border border-slate-300 focus:border-[#588B76] font-mono text-sm uppercase focus:outline-none"
              />
              <button
                type="submit"
                className="bg-[#18392B] hover:bg-[#588B76] hover:text-[#18392B] text-white font-bold px-6 py-3 rounded-lg text-xs uppercase tracking-wider transition cursor-pointer shrink-0"
              >
                Search
              </button>
            </form>

            {searched && (
              <div className="pt-6 border-t border-slate-200">
                {trackedApp ? (
                  <div className="bg-[#FFFFFF] p-6 rounded-xl border border-slate-200 space-y-4">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                      <div>
                        <span className="text-[10px] font-mono font-bold uppercase text-[#588B76]">
                          Reference Code: {trackedApp.referenceNumber}
                        </span>
                        <h4 className="font-serif text-xl font-bold text-[#18392B]">
                          {trackedApp.fullName}
                        </h4>
                        <p className="text-xs text-slate-600 font-medium">
                          Program: {trackedApp.programName}
                        </p>
                      </div>

                      <div className="self-start sm:self-auto">
                        <span
                          className={`text-xs font-mono font-bold uppercase px-3 py-1.5 rounded-full border shadow-sm ${
                            trackedApp.status === 'approved'
                              ? 'bg-emerald-100 text-emerald-800 border-emerald-300'
                              : trackedApp.status === 'interview_scheduled'
                              ? 'bg-blue-100 text-blue-800 border-blue-300'
                              : trackedApp.status === 'rejected'
                              ? 'bg-rose-100 text-rose-800 border-rose-300'
                              : 'bg-amber-100 text-amber-800 border-amber-300'
                          }`}
                        >
                          Status: {trackedApp.status.replace('_', ' ')}
                        </span>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs text-slate-700 pt-2 border-t border-slate-200">
                      <div>
                        <span className="text-slate-400 block text-[10px]">Date Submitted:</span>
                        <strong className="text-slate-800">{trackedApp.submittedAt}</strong>
                      </div>
                      <div>
                        <span className="text-slate-400 block text-[10px]">Home Church:</span>
                        <strong className="text-slate-800">{trackedApp.churchName}</strong>
                      </div>
                      <div>
                        <span className="text-slate-400 block text-[10px]">Contact Email:</span>
                        <strong className="text-slate-800">{trackedApp.email}</strong>
                      </div>
                    </div>

                    <div className="bg-white p-4 rounded-lg border border-slate-200 text-xs space-y-1">
                      <span className="font-bold text-[#18392B]">Admissions Committee Note:</span>
                      <p className="text-slate-600 leading-relaxed">
                        {trackedApp.status === 'approved' &&
                          'Congratulations! Your application has been approved for enrollment. Please proceed to the Registrar for official matriculation.'}
                        {trackedApp.status === 'interview_scheduled' &&
                          'Your admissions interview has been scheduled with the Faculty Panel. Check your email for Zoom link / room assignment.'}
                        {trackedApp.status === 'submitted' &&
                          'Your documents and spiritual testimony are currently undergoing evaluation by the Academic Dean.'}
                        {trackedApp.status === 'under_review' &&
                          'Your application is under formal committee review. Sponsoring pastor references are being verified.'}
                        {trackedApp.status === 'rejected' &&
                          'Thank you for your interest. Unfortunately, admission cannot be granted for this semester.'}
                      </p>
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-8 text-slate-500 space-y-2">
                    <AlertCircle className="w-10 h-10 text-slate-400 mx-auto" />
                    <p className="text-sm font-semibold">No Application Found</p>
                    <p className="text-xs">
                      We could not find any record with reference <strong>{trackRef}</strong>. Please check the code or submit a new application.
                    </p>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* MODE 2: MULTI-STEP APPLICATION FORM */}
        {mode === 'apply' && (
          <>
            {submittedRef ? (
              /* Success Screen */
              <div className="bg-white rounded-2xl p-8 sm:p-12 border border-slate-200 shadow-2xl text-center space-y-6 animate-in zoom-in-95">
                <div className="w-20 h-20 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto shadow-inner">
                  <CheckCircle2 className="w-12 h-12" />
                </div>

                <div className="space-y-2">
                  <span className="text-xs font-mono font-bold uppercase tracking-widest text-[#588B76]">
                    Application Submitted Successfully
                  </span>
                  <h2 className="font-serif text-3xl font-extrabold text-[#18392B]">
                    Welcome to the PCM Admissions Pipeline
                  </h2>
                  <p className="text-xs sm:text-sm text-slate-600 max-w-lg mx-auto leading-relaxed">
                    Thank you, <strong>{formData.fullName}</strong>. Your online application for the <strong>{formData.programName}</strong> has been logged into the registrar database.
                  </p>
                </div>

                {/* Reference Code Box */}
                <div className="bg-[#18392B] text-white p-6 rounded-xl border-2 border-[#588B76] max-w-md mx-auto space-y-2">
                  <span className="text-xs text-[#85AA9B] font-mono uppercase tracking-wider block">
                    Your Official Application Reference Number:
                  </span>
                  <div className="font-mono text-3xl font-extrabold tracking-wider text-white">
                    {submittedRef}
                  </div>
                  <p className="text-[11px] text-slate-400">
                    Save this reference code to check your evaluation status anytime.
                  </p>
                </div>

                <div className="pt-4 flex flex-wrap items-center justify-center gap-4">
                  <button
                    onClick={() => {
                      setMode('track');
                      setTrackRef(submittedRef);
                      const app = getApplicationByRef(submittedRef);
                      setTrackedApp(app);
                      setSearched(true);
                    }}
                    className="bg-[#588B76] hover:bg-[#85AA9B] text-[#18392B] text-xs font-bold px-6 py-3 rounded uppercase tracking-wider transition cursor-pointer"
                  >
                    Track Status Now
                  </button>
                  <button
                    onClick={() => {
                      setSubmittedRef(null);
                      setStep(1);
                      setFormData({
                        programId: programs[0]?.id || 'bth',
                        programName: programs[0]?.name || 'Bachelor of Theology',
                        programLevel: 'undergraduate',
                        fullName: '',
                        email: '',
                        phone: '',
                        birthDate: '',
                        gender: 'Male',
                        civilStatus: 'Single',
                        address: '',
                        churchName: '',
                        pastorName: '',
                        pastorPhone: '',
                        testimony: '',
                        ministryCalling: '',
                        previousEducation: '',
                        highSchoolOrCollege: '',
                        yearGraduated: '2024',
                      });
                    }}
                    className="bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-semibold px-6 py-3 rounded transition cursor-pointer"
                  >
                    Submit Another Application
                  </button>
                </div>
              </div>
            ) : (
              /* Step Form */
              <div className="bg-white rounded-2xl border border-slate-200 shadow-xl overflow-hidden">
                {/* Step Progress Bar */}
                <div className="bg-[#18392B] text-white p-6 border-b border-[#588B76]/40">
                  <div className="flex items-center justify-between text-xs mb-3">
                    <span className="font-mono text-[#85AA9B] font-bold">
                      STEP {step} OF 4
                    </span>
                    <span className="text-slate-300 font-serif">
                      {step === 1 && '1. Program & Personal Info'}
                      {step === 2 && '2. Church & Pastoral Endorsement'}
                      {step === 3 && '3. Testimony & Ministry Calling'}
                      {step === 4 && '4. Review & Confirmation'}
                    </span>
                  </div>

                  <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden">
                    <div
                      className="bg-gradient-to-r from-[#588B76] to-[#85AA9B] h-full transition-all duration-300"
                      style={{ width: `${(step / 4) * 100}%` }}
                    />
                  </div>
                </div>

                {/* Form Content */}
                <form onSubmit={handleSubmit} className="p-6 sm:p-8 space-y-6 text-xs text-slate-700">
                  {/* STEP 1 */}
                  {step === 1 && (
                    <div className="space-y-4 animate-in fade-in">
                      <h3 className="font-serif text-lg font-bold text-[#18392B] border-b border-slate-100 pb-2">
                        Desired Academic Program & Personal Profile
                      </h3>

                      <div>
                        <label className="block text-slate-800 font-bold mb-1">
                          Select Degree Program *
                        </label>
                        <select
                          value={formData.programId}
                          onChange={(e) => handleProgramSelect(e.target.value)}
                          className="w-full p-3 rounded-lg border border-slate-300 focus:border-[#588B76] font-semibold text-sm bg-white focus:outline-none"
                        >
                          {programs.map((p) => (
                            <option key={p.id} value={p.id}>
                              {p.name} ({p.code} — {p.level.toUpperCase()})
                            </option>
                          ))}
                        </select>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-slate-800 font-semibold mb-1">
                            Full Legal Name *
                          </label>
                          <input
                            type="text"
                            required
                            value={formData.fullName}
                            onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                            placeholder="e.g. Joshua David Santos"
                            className="w-full p-2.5 rounded border border-slate-300 focus:border-[#588B76] focus:outline-none"
                          />
                        </div>

                        <div>
                          <label className="block text-slate-800 font-semibold mb-1">
                            Email Address *
                          </label>
                          <input
                            type="email"
                            required
                            value={formData.email}
                            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                            placeholder="joshua@gmail.com"
                            className="w-full p-2.5 rounded border border-slate-300 focus:border-[#588B76] focus:outline-none"
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                        <div>
                          <label className="block text-slate-800 font-semibold mb-1">
                            Mobile Number *
                          </label>
                          <input
                            type="tel"
                            required
                            value={formData.phone}
                            onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                            placeholder="+63 917 123 4567"
                            className="w-full p-2.5 rounded border border-slate-300 focus:border-[#588B76] focus:outline-none"
                          />
                        </div>

                        <div>
                          <label className="block text-slate-800 font-semibold mb-1">
                            Date of Birth
                          </label>
                          <input
                            type="date"
                            value={formData.birthDate}
                            onChange={(e) => setFormData({ ...formData, birthDate: e.target.value })}
                            className="w-full p-2.5 rounded border border-slate-300 focus:border-[#588B76] focus:outline-none bg-white"
                          />
                        </div>

                        <div>
                          <label className="block text-slate-800 font-semibold mb-1">
                            Civil Status
                          </label>
                          <select
                            value={formData.civilStatus}
                            onChange={(e) => setFormData({ ...formData, civilStatus: e.target.value })}
                            className="w-full p-2.5 rounded border border-slate-300 focus:border-[#588B76] focus:outline-none bg-white"
                          >
                            <option value="Single">Single</option>
                            <option value="Married">Married</option>
                            <option value="Widowed">Widowed</option>
                          </select>
                        </div>
                      </div>

                      <div>
                        <label className="block text-slate-800 font-semibold mb-1">
                          Current Residential Address
                        </label>
                        <input
                          type="text"
                          value={formData.address}
                          onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                          placeholder="House No., Barangay, City, Province"
                          className="w-full p-2.5 rounded border border-slate-300 focus:border-[#588B76] focus:outline-none"
                        />
                      </div>
                    </div>
                  )}

                  {/* STEP 2 */}
                  {step === 2 && (
                    <div className="space-y-4 animate-in fade-in">
                      <h3 className="font-serif text-lg font-bold text-[#18392B] border-b border-slate-100 pb-2">
                        Local Church & Sponsoring Pastor Information
                      </h3>

                      <div>
                        <label className="block text-slate-800 font-semibold mb-1">
                          Home Local Church / Denomination *
                        </label>
                        <input
                          type="text"
                          required
                          value={formData.churchName}
                          onChange={(e) => setFormData({ ...formData, churchName: e.target.value })}
                          placeholder="e.g. Grace Gospel Bible Church Diliman"
                          className="w-full p-2.5 rounded border border-slate-300 focus:border-[#588B76] focus:outline-none"
                        />
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-slate-800 font-semibold mb-1">
                            Senior Pastor / Presiding Minister Name *
                          </label>
                          <input
                            type="text"
                            required
                            value={formData.pastorName}
                            onChange={(e) => setFormData({ ...formData, pastorName: e.target.value })}
                            placeholder="e.g. Pastor Roberto Mendoza"
                            className="w-full p-2.5 rounded border border-slate-300 focus:border-[#588B76] focus:outline-none"
                          />
                        </div>

                        <div>
                          <label className="block text-slate-800 font-semibold mb-1">
                            Pastor Contact / Mobile Number
                          </label>
                          <input
                            type="tel"
                            value={formData.pastorPhone}
                            onChange={(e) => setFormData({ ...formData, pastorPhone: e.target.value })}
                            placeholder="+63 918 765 4321"
                            className="w-full p-2.5 rounded border border-slate-300 focus:border-[#588B76] focus:outline-none"
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-slate-800 font-semibold mb-1">
                            Highest Educational Attainment
                          </label>
                          <input
                            type="text"
                            value={formData.previousEducation}
                            onChange={(e) => setFormData({ ...formData, previousEducation: e.target.value })}
                            placeholder="e.g. BS Psychology / Senior High Graduate"
                            className="w-full p-2.5 rounded border border-slate-300 focus:border-[#588B76] focus:outline-none"
                          />
                        </div>

                        <div>
                          <label className="block text-slate-800 font-semibold mb-1">
                            Previous School / University Attended
                          </label>
                          <input
                            type="text"
                            value={formData.highSchoolOrCollege}
                            onChange={(e) => setFormData({ ...formData, highSchoolOrCollege: e.target.value })}
                            placeholder="e.g. University of the Philippines"
                            className="w-full p-2.5 rounded border border-slate-300 focus:border-[#588B76] focus:outline-none"
                          />
                        </div>
                      </div>
                    </div>
                  )}

                  {/* STEP 3 */}
                  {step === 3 && (
                    <div className="space-y-4 animate-in fade-in">
                      <h3 className="font-serif text-lg font-bold text-[#18392B] border-b border-slate-100 pb-2">
                        Spiritual Testimony & Ministry Calling
                      </h3>

                      <div>
                        <label className="block text-slate-800 font-semibold mb-1">
                          Personal Salvation Testimony (How and when did you receive Jesus Christ as your personal Lord and Savior?) *
                        </label>
                        <textarea
                          rows={5}
                          required
                          value={formData.testimony}
                          onChange={(e) => setFormData({ ...formData, testimony: e.target.value })}
                          placeholder="Write a sincere description of your faith journey and conversion..."
                          className="w-full p-2.5 rounded border border-slate-300 focus:border-[#588B76] focus:outline-none"
                        />
                      </div>

                      <div>
                        <label className="block text-slate-800 font-semibold mb-1">
                          Ministerial Vision & Future Calling (How do you hope God will use your PCM training?) *
                        </label>
                        <textarea
                          rows={4}
                          value={formData.ministryCalling}
                          onChange={(e) => setFormData({ ...formData, ministryCalling: e.target.value })}
                          placeholder="e.g. Church planting, youth pastorate, pastoral counseling, cross-cultural missions..."
                          className="w-full p-2.5 rounded border border-slate-300 focus:border-[#588B76] focus:outline-none"
                        />
                      </div>
                    </div>
                  )}

                  {/* STEP 4 */}
                  {step === 4 && (
                    <div className="space-y-4 animate-in fade-in">
                      <h3 className="font-serif text-lg font-bold text-[#18392B] border-b border-slate-100 pb-2">
                        Review & Statement Affirmation
                      </h3>

                      <div className="bg-[#FFFFFF] p-5 rounded-xl border border-slate-200 space-y-3">
                        <div className="flex justify-between border-b border-slate-200/80 pb-2">
                          <span className="text-slate-500">Degree Program:</span>
                          <strong className="text-[#18392B]">{formData.programName} ({formData.programLevel})</strong>
                        </div>
                        <div className="flex justify-between border-b border-slate-200/80 pb-2">
                          <span className="text-slate-500">Applicant:</span>
                          <strong className="text-[#18392B]">{formData.fullName} ({formData.email})</strong>
                        </div>
                        <div className="flex justify-between border-b border-slate-200/80 pb-2">
                          <span className="text-slate-500">Local Church:</span>
                          <strong className="text-[#18392B]">{formData.churchName}</strong>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-slate-500">Sponsoring Pastor:</span>
                          <strong className="text-[#18392B]">{formData.pastorName}</strong>
                        </div>
                      </div>

                      <div className="bg-amber-50/70 p-4 rounded-xl border border-amber-200 text-xs text-amber-900 space-y-2">
                        <div className="flex items-center gap-2 font-bold text-[#18392B]">
                          <ShieldCheck className="w-4 h-4 text-[#588B76]" />
                          <span>Applicant Declaration & Doctrinal Respect</span>
                        </div>
                        <p>
                          By submitting this application, I certify that all information given is true, accurate, and complete. I express my willingness to respect and abide by the institutional standards, Statement of Faith, and community covenant of Philippine College of Ministry.
                        </p>
                      </div>
                    </div>
                  )}

                  {/* Navigation Buttons */}
                  <div className="pt-6 border-t border-slate-200 flex items-center justify-between">
                    {step > 1 ? (
                      <button
                        type="button"
                        onClick={() => setStep(step - 1)}
                        className="bg-slate-100 hover:bg-slate-200 text-slate-700 px-5 py-2.5 rounded text-xs font-semibold flex items-center gap-2 transition cursor-pointer"
                      >
                        <ArrowLeft className="w-3.5 h-3.5" />
                        <span>Previous Step</span>
                      </button>
                    ) : <div />}

                    {step < 4 ? (
                      <button
                        type="button"
                        onClick={() => {
                          if (step === 1 && (!formData.fullName || !formData.email)) {
                            addToast({
                              title: 'Required Fields',
                              message: 'Please fill in your name and email to proceed.',
                              type: 'warning',
                            });
                            return;
                          }
                          setStep(step + 1);
                        }}
                        className="bg-[#18392B] hover:bg-[#14234b] text-white px-6 py-2.5 rounded text-xs font-bold flex items-center gap-2 transition cursor-pointer"
                      >
                        <span>Next Step</span>
                        <ArrowRight className="w-3.5 h-3.5 text-[#588B76]" />
                      </button>
                    ) : (
                      <button
                        type="submit"
                        className="bg-[#588B76] hover:bg-[#85AA9B] text-[#18392B] px-8 py-3 rounded text-xs font-bold uppercase tracking-wider flex items-center gap-2 transition cursor-pointer shadow-lg"
                      >
                        <span>SUBMIT OFFICIAL APPLICATION</span>
                        <Send className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                </form>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};
