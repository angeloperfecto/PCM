'use client';

import React, { useState, useEffect } from 'react';
import { usePCM } from '@/lib/store';
import { ProgramLevel } from '@/lib/types';
import { StudentRegistrationWizard } from '@/components/enrollment/StudentRegistrationWizard';
import { MyApplicationPanel } from '@/components/enrollment/MyApplicationPanel';
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
  GraduationCap,
  ExternalLink,
  Layers,
} from 'lucide-react';

export const ApplicationView: React.FC = () => {
  const {
    programs,
    submitApplication,
    activeTrackerRef,
    navigateTo,
    addToast,
    firebaseAuthUser,
    signInWithGoogle,
  } = usePCM();

  // Mode: 'apply' | 'track' | 'wizard'
  const [mode, setMode] = useState<'apply' | 'track' | 'wizard'>(() => (activeTrackerRef ? 'track' : 'apply'));
  const [wizardInitialRef, setWizardInitialRef] = useState<string>('');
  const [wizardInitialData, setWizardInitialData] = useState<any>(null);
  const [isSigningIn, setIsSigningIn] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [stepError, setStepError] = useState<string | null>(null);

  const handleSignIn = async () => {
    setIsSigningIn(true);
    try {
      await signInWithGoogle();
    } finally {
      setIsSigningIn(false);
    }
  };

  // Step 1 to 4
  const [step, setStep] = useState(1);

  // Application Form State
  const [formData, setFormData] = useState({
    programId: programs[0]?.id || 'prog-bth',
    programName: programs[0]?.name || 'Bachelor of Arts in Theology',
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

  // Use the signed-in Google account's email by default.
  useEffect(() => {
    if (firebaseAuthUser?.email) {
      setFormData((prev) => (prev.email ? prev : { ...prev, email: firebaseAuthUser.email || '', fullName: prev.fullName || firebaseAuthUser.displayName || '' }));
    }
  }, [firebaseAuthUser]);

  // Opening the tracker from elsewhere on the site.
  useEffect(() => {
    if (activeTrackerRef && activeTrackerRef.trim()) setMode('track');
  }, [activeTrackerRef]);

  // Validation for each step of the short application form.
  const validateStep = (s: number): string | null => {
    if (s === 1) {
      if (!formData.fullName.trim()) return 'Please enter your full legal name.';
      if (!/^\S+@\S+\.\S+$/.test(formData.email.trim())) return 'Please enter a valid email address.';
      if (formData.phone.replace(/\D/g, '').length < 10) return 'Please enter a valid mobile number (at least 10 digits).';
    }
    if (s === 2) {
      if (!formData.churchName.trim()) return 'Please enter your home church.';
      if (!formData.pastorName.trim()) return "Please enter your senior pastor's name.";
    }
    if (s === 3) {
      if (formData.testimony.trim().length < 50) return 'Please write your salvation testimony (at least 50 characters).';
      if (!formData.ministryCalling.trim()) return 'Please describe your ministry calling.';
    }
    return null;
  };

  const goNext = () => {
    const problem = validateStep(step);
    setStepError(problem);
    if (!problem) setStep(step + 1);
  };

  // Handle Program select
  const handleProgramSelect = (progId: string) => {
    const p = programs.find((x) => x.id === progId);
    if (p) {
      setFormData((prev) => ({
        ...prev,
        programId: p.id,
        programName: p.name,
        programLevel: p.level || p.degreeLevel || 'undergraduate',
      }));
    }
  };

  // Submit Application (once; duplicates are redirected to the existing application)
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmitting) return;
    if (step < 4) {
      goNext();
      return;
    }
    for (const s of [1, 2, 3]) {
      const problem = validateStep(s);
      if (problem) {
        setStep(s);
        setStepError(problem);
        return;
      }
    }
    setIsSubmitting(true);
    try {
      const ref = await submitApplication(formData);
      if (ref.startsWith('DUPLICATE:')) {
        setMode('track');
      } else if (ref) {
        setSubmittedRef(ref);
      }
    } finally {
      setIsSubmitting(false);
    }
  };

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

          <div className="pt-4 flex flex-wrap items-center justify-center gap-2">
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
            <button
              onClick={() => {
                setWizardInitialRef('');
                setWizardInitialData(null);
                setMode('wizard');
              }}
              className={`px-5 py-2.5 rounded-lg text-xs font-bold transition cursor-pointer flex items-center gap-1.5 ${
                mode === 'wizard'
                  ? 'bg-amber-400 text-slate-950 shadow-md font-extrabold'
                  : 'bg-amber-400/20 text-amber-200 hover:bg-amber-400/30 border border-amber-400/40'
              }`}
            >
              <Sparkles className="w-3.5 h-3.5 text-amber-300" />
              <span>Online Student Registration & Enrollment</span>
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 pt-10">
        {/* MODE 1: TRACK APPLICATION (the signed-in applicant's own application) */}
        {mode === 'track' &&
          (firebaseAuthUser ? (
            <MyApplicationPanel onStartApplication={() => setMode('apply')} />
          ) : (
            signInCard('track your application')
          ))}

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
                    Track it any time by signing in here with the same Google account.
                  </p>
                </div>

                <div className="mx-auto max-w-md rounded-xl border border-amber-200 bg-amber-50 p-4 text-left text-xs text-amber-950">
                  <strong className="block text-[#18392B]">Next step: upload your admission documents</strong>
                  ID photo, PSA birth certificate, report card or transcript, good moral certificate and your pastoral
                  recommendation. The Admissions Office reviews your application once they are in.
                </div>

                <div className="pt-2 flex flex-wrap items-center justify-center gap-3">
                  <button
                    onClick={() => setMode('track')}
                    className="bg-[#18392B] hover:bg-[#23533e] text-white text-xs font-bold px-6 py-3 rounded-lg uppercase tracking-wider transition cursor-pointer flex items-center gap-1.5 shadow-md"
                  >
                    <FileText className="w-4 h-4" />
                    <span>Upload documents & track my application</span>
                  </button>
                </div>
              </div>
            ) : !firebaseAuthUser ? (
              signInCard('start your application')
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
                              {p.name} ({p.code} — {(p.level || p.degreeLevel || 'Program').toUpperCase()})
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

                  {stepError && (
                    <p role="alert" className="flex items-center gap-1.5 rounded-lg border border-rose-200 bg-rose-50 p-3 text-xs font-semibold text-rose-800">
                      <AlertCircle className="h-4 w-4 shrink-0" />
                      {stepError}
                    </p>
                  )}

                  {/* Navigation Buttons */}
                  <div className="pt-6 border-t border-slate-200 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
                    {step > 1 ? (
                      <button
                        type="button"
                        onClick={() => {
                          setStepError(null);
                          setStep(step - 1);
                        }}
                        className="bg-slate-100 hover:bg-slate-200 text-slate-700 px-5 py-3 rounded text-xs font-semibold flex items-center justify-center gap-2 transition cursor-pointer order-2 sm:order-1"
                      >
                        <ArrowLeft className="w-3.5 h-3.5" />
                        <span>Previous Step</span>
                      </button>
                    ) : <div className="hidden sm:block" />}

                    {step < 4 ? (
                      <button
                        key="next-step"
                        type="button"
                        onClick={(e) => {
                          // Without preventDefault (and distinct keys), React swaps this
                          // button for the submit button during the click and the browser
                          // then submits the form, skipping the review step.
                          e.preventDefault();
                          goNext();
                        }}
                        className="bg-[#18392B] hover:bg-[#14234b] text-white px-6 py-3 rounded text-xs font-bold flex items-center justify-center gap-2 transition cursor-pointer order-1 sm:order-2"
                      >
                        <span>Next Step</span>
                        <ArrowRight className="w-3.5 h-3.5 text-[#588B76]" />
                      </button>
                    ) : (
                      <button
                        key="submit-application"
                        type="submit"
                        disabled={isSubmitting}
                        className="bg-[#588B76] hover:bg-[#85AA9B] text-[#18392B] px-8 py-3.5 rounded text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-2 transition cursor-pointer shadow-lg order-1 sm:order-2 disabled:opacity-50"
                      >
                        <span>{isSubmitting ? 'Submitting…' : 'SUBMIT OFFICIAL APPLICATION'}</span>
                        <Send className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                </form>
              </div>
            )}
          </>
        )}

        {/* MODE 3: ONLINE STUDENT REGISTRATION & ENROLLMENT WIZARD */}
        {mode === 'wizard' && (
          <div className="space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-emerald-50/90 p-4 rounded-2xl border border-emerald-200 text-emerald-950 shadow-xs">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-[#18392B] text-white flex items-center justify-center shrink-0">
                  <Sparkles className="w-4 h-4 text-amber-300" />
                </div>
                <div>
                  <h3 className="font-serif font-bold text-sm text-[#18392B]">
                    Online Student Registration & Enrollment Module
                  </h3>
                  <p className="text-[11px] text-slate-600">
                    Unified 9-step registration seamlessly synchronized with the PCM Admissions Database.
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setMode('apply')}
                className="text-xs font-bold text-[#18392B] hover:text-[#588B76] underline flex items-center gap-1 cursor-pointer self-end sm:self-auto"
              >
                <span>Back to Admissions Form</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>

            {firebaseAuthUser ? (
              <StudentRegistrationWizard
                initialAppRef={wizardInitialRef}
                initialAppData={wizardInitialData}
                onCancel={() => setMode('apply')}
                onCompleted={() => setMode('track')}
              />
            ) : (
              signInCard('register online')
            )}
          </div>
        )}
      </div>
    </div>
  );
};
