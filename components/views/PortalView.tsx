'use client';

import React, { useState } from 'react';
import { usePCM } from '@/lib/store';
import { Emblem } from '@/components/common/Emblem';
import {
  GraduationCap,
  Calendar,
  Award,
  DollarSign,
  BookOpen,
  LogOut,
  Flame,
  User,
  Lock,
  PlusCircle,
  Clock,
  MapPin,
  FileCheck,
} from 'lucide-react';

export const PortalView: React.FC = () => {
  const {
    isStudentLoggedIn,
    studentProfile,
    studentLogin,
    studentLogout,
    signInWithGoogle,
    currentUserAccount,
    firebaseAuthUser,
    addPracticumEntry,
    makeTuitionPayment,
    addToast,
  } = usePCM();

  const [studentIdInput, setStudentIdInput] = useState('2024-PCM-0418');
  const [passwordInput, setPasswordInput] = useState('pcmstudent');
  const [isGoogleSigningIn, setIsGoogleSigningIn] = useState(false);
  const [activeTab, setActiveTab] = useState<
    'schedule' | 'grades' | 'practicum' | 'financial' | 'spiritual'
  >('schedule');

  // Practicum form state
  const [practicumType, setPracticumType] = useState<
    | 'Preaching / Teaching'
    | 'Youth Ministry'
    | 'Evangelism & Outreach'
    | 'Counseling & Visitation'
    | 'Worship & Media'
    | 'Church Administration'
  >('Preaching / Teaching');
  const [practicumLocation, setPracticumLocation] = useState('');
  const [practicumHours, setPracticumHours] = useState(4);
  const [practicumSupervisor, setPracticumSupervisor] = useState('');
  const [practicumDescription, setPracticumDescription] = useState('');

  // Payment form state
  const [paymentAmount, setPaymentAmount] = useState(5000);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    const success = studentLogin(studentIdInput, passwordInput);
    if (!success) {
      addToast('error', 'Login Failed', 'Please check your student ID number or password.');
    }
  };

  const handleGoogleStudentLogin = async () => {
    setIsGoogleSigningIn(true);
    try {
      const res = await signInWithGoogle();
      if (!res.success) {
        addToast('error', 'Google Login', 'Unable to complete sign-in with Google.');
      }
    } finally {
      setIsGoogleSigningIn(false);
    }
  };

  const handlePracticumSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!practicumLocation.trim() || !practicumSupervisor.trim()) {
      addToast('warning', 'Missing Details', 'Please fill in church location and supervisor name.');
      return;
    }
    addPracticumEntry({
      date: new Date().toISOString().split('T')[0],
      ministryType: practicumType,
      location: practicumLocation.trim(),
      hours: Number(practicumHours),
      description: practicumDescription.trim() || 'Ministry engagement logged via MyPCM Portal.',
      supervisorName: practicumSupervisor.trim(),
    });
    setPracticumLocation('');
    setPracticumSupervisor('');
    setPracticumDescription('');
  };

  const handlePayment = (e: React.FormEvent) => {
    e.preventDefault();
    if (paymentAmount <= 0) return;
    makeTuitionPayment(Number(paymentAmount));
  };

  if (!isStudentLoggedIn) {
    return (
      <div className="w-full min-h-[80vh] bg-[#070e1c] py-16 px-4 flex items-center justify-center font-sans">
        <div className="max-w-md w-full bg-[#18392B] rounded-2xl border border-slate-700 shadow-2xl p-8 space-y-6 text-white">
          <div className="text-center space-y-3">
            <div className="w-20 h-20 bg-white/10 p-2.5 rounded-2xl border border-[#588B76]/40 flex items-center justify-center mx-auto shadow-xl backdrop-blur-xs">
              <Emblem id="student-portal-pcm-logo" size={64} className="w-16 h-16 drop-shadow-md" />
            </div>
            <h2 className="font-serif text-2xl font-bold text-white">MyPCM Student Portal</h2>
            <p className="text-xs text-slate-400">
              Institutional access for matriculated seminary and college students
            </p>
          </div>

          {/* 1-Click Google Sign In for Students */}
          <div className="space-y-3">
            <button
              id="btn-student-google-login"
              type="button"
              onClick={handleGoogleStudentLogin}
              disabled={isGoogleSigningIn}
              className="w-full bg-white hover:bg-slate-100 text-slate-900 font-semibold py-3 px-4 rounded-xl shadow-lg transition flex items-center justify-center gap-3 text-sm cursor-pointer disabled:opacity-50"
            >
              <svg className="w-5 h-5 shrink-0" viewBox="0 0 24 24">
                <path
                  fill="#4285F4"
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                />
                <path
                  fill="#34A853"
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                />
                <path
                  fill="#FBBC05"
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                />
                <path
                  fill="#EA4335"
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                />
              </svg>
              <span>{isGoogleSigningIn ? 'Connecting to Google...' : 'Sign in with Google / Gmail'}</span>
            </button>

            <div className="flex items-center gap-3">
              <div className="flex-1 h-px bg-slate-700"></div>
              <span className="text-[11px] text-slate-400 font-mono">OR STUDENT ID LOGIN</span>
              <div className="flex-1 h-px bg-slate-700"></div>
            </div>
          </div>

          <div className="bg-amber-500/10 border border-amber-500/30 rounded-xl p-3.5 text-xs text-amber-200 space-y-2">
            <div className="flex items-center justify-between">
              <span className="font-bold text-amber-300">Demo Access Credentials:</span>
              <button
                type="button"
                onClick={() => {
                  setStudentIdInput('2024-PCM-0418');
                  setPasswordInput('pcmstudent');
                }}
                className="text-[10px] bg-amber-400/20 hover:bg-amber-400/30 text-amber-200 px-2 py-0.5 rounded font-mono transition cursor-pointer"
              >
                Auto Fill
              </button>
            </div>
            <div className="grid grid-cols-2 gap-2 font-mono text-[11px]">
              <div className="bg-black/30 p-1.5 rounded border border-white/5">
                <span className="text-slate-400 block text-[10px]">Student ID</span>
                <code className="text-white font-bold">2024-PCM-0418</code>
              </div>
              <div className="bg-black/30 p-1.5 rounded border border-white/5">
                <span className="text-slate-400 block text-[10px]">Password</span>
                <code className="text-white font-bold">pcmstudent</code>
              </div>
            </div>
          </div>

          <form onSubmit={handleLogin} className="space-y-4 text-xs">
            <div className="space-y-1">
              <label className="text-slate-300 font-semibold flex items-center gap-1.5">
                <User className="w-3.5 h-3.5 text-[#588B76]" />
                <span>Student ID Number</span>
              </label>
              <input
                type="text"
                required
                value={studentIdInput}
                onChange={(e) => setStudentIdInput(e.target.value)}
                placeholder="2024-PCM-0418"
                className="w-full bg-[#070e1c] border border-slate-700 rounded-lg p-3 text-white font-mono focus:border-[#588B76] focus:outline-none"
              />
            </div>

            <div className="space-y-1">
              <label className="text-slate-300 font-semibold flex items-center gap-1.5">
                <Lock className="w-3.5 h-3.5 text-[#588B76]" />
                <span>Student Portal Password</span>
              </label>
              <input
                type="password"
                required
                value={passwordInput}
                onChange={(e) => setPasswordInput(e.target.value)}
                placeholder="••••••••"
                className="w-full bg-[#070e1c] border border-slate-700 rounded-lg p-3 text-white font-mono focus:border-[#588B76] focus:outline-none"
              />
            </div>

            <button
              type="submit"
              className="w-full bg-[#588B76] hover:bg-[#b58532] text-[#18392B] font-bold py-3.5 rounded-lg text-sm transition uppercase tracking-wider cursor-pointer shadow-lg mt-2"
            >
              Sign In to MyPCM Portal
            </button>
          </form>
        </div>
      </div>
    );
  }

  const remainingBalance = Math.max(0, studentProfile.tuitionTotal - studentProfile.tuitionPaid);
  const totalPracticumHours = studentProfile.practicumEntries.reduce((acc, curr) => acc + curr.hours, 0);

  return (
    <div className="w-full min-h-screen bg-[#FFFFFF] pb-20 font-sans">
      {/* Student Banner Header */}
      <div className="bg-[#18392B] text-white border-b border-[#588B76]/40 py-8 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-full bg-[#588B76] text-[#18392B] font-serif font-black text-2xl flex items-center justify-center shadow-lg border-2 border-amber-300 shrink-0">
              {studentProfile.fullName.charAt(0)}
            </div>
            <div>
              <span className="text-[11px] font-mono font-bold uppercase tracking-wider text-[#85AA9B]">
                {studentProfile.studentId} • {studentProfile.yearLevel}
              </span>
              <h1 className="font-serif text-2xl sm:text-3xl font-bold text-white">
                {studentProfile.fullName}
              </h1>
              <p className="text-xs text-slate-300">
                {studentProfile.program} | {studentProfile.currentSemester}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="bg-[#070e1c] px-4 py-2 rounded-lg border border-slate-700 text-center">
              <span className="text-[10px] text-slate-400 uppercase font-mono block">Cumulative GPA</span>
              <span className="font-serif text-xl font-extrabold text-[#85AA9B]">
                {studentProfile.gpa.toFixed(2)}
              </span>
            </div>

            <div className="bg-[#070e1c] px-4 py-2 rounded-lg border border-slate-700 text-center">
              <span className="text-[10px] text-slate-400 uppercase font-mono block">Units Earned</span>
              <span className="font-serif text-xl font-extrabold text-emerald-400">
                {studentProfile.totalUnitsEarned}
              </span>
            </div>

            <button
              onClick={studentLogout}
              className="bg-slate-800 hover:bg-rose-900 text-slate-200 text-xs font-semibold px-4 py-3 rounded-lg border border-slate-700 transition flex items-center gap-1.5 cursor-pointer ml-2"
            >
              <LogOut className="w-4 h-4" />
              <span className="hidden sm:inline">Logout</span>
            </button>
          </div>
        </div>
      </div>

      {/* Main Student Console */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8 space-y-6">
        {/* Navigation Tabs */}
        <div className="flex flex-wrap items-center gap-2 border-b border-slate-300 pb-3 text-xs font-bold">
          {[
            { id: 'schedule', label: 'Enrolled Schedule', icon: Calendar },
            { id: 'grades', label: 'Grades & Academic Standing', icon: Award },
            { id: 'practicum', label: `Practicum Log (${totalPracticumHours} hrs)`, icon: Flame },
            { id: 'financial', label: 'Tuition & Billing', icon: DollarSign },
            { id: 'spiritual', label: 'Faculty Mentor & Church', icon: BookOpen },
          ].map((t) => {
            const Icon = t.icon;
            return (
              <button
                key={t.id}
                onClick={() => setActiveTab(t.id as any)}
                className={`px-4 py-2.5 rounded-lg flex items-center gap-2 transition cursor-pointer ${
                  activeTab === t.id
                    ? 'bg-[#18392B] text-[#85AA9B] shadow'
                    : 'bg-white text-slate-700 hover:bg-slate-100 border border-slate-200'
                }`}
              >
                <Icon className="w-4 h-4 text-[#588B76]" />
                <span>{t.label}</span>
              </button>
            );
          })}
        </div>

        {/* TAB 1: SCHEDULE */}
        {activeTab === 'schedule' && (
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="font-serif text-xl font-bold text-[#18392B]">
                Enrolled Class Schedule — {studentProfile.currentSemester}
              </h3>
              <span className="text-xs font-mono font-semibold text-emerald-800 bg-emerald-100 px-3 py-1 rounded-full border border-emerald-300">
                Officially Registered
              </span>
            </div>

            <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-sm">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse min-w-[600px]">
                  <thead>
                    <tr className="bg-[#18392B] text-white">
                      <th className="p-3.5 font-bold">Course Code</th>
                      <th className="p-3.5 font-bold">Subject Title</th>
                      <th className="p-3.5 font-bold">Units</th>
                      <th className="p-3.5 font-bold">Class Schedule</th>
                      <th className="p-3.5 font-bold">Room</th>
                      <th className="p-3.5 font-bold">Faculty Instructor</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200 text-slate-700">
                    {studentProfile.courses.map((c) => (
                      <tr key={c.id} className="hover:bg-slate-50">
                        <td className="p-3.5 font-mono font-bold text-[#18392B]">{c.code}</td>
                        <td className="p-3.5 font-semibold text-slate-900">{c.title}</td>
                        <td className="p-3.5 font-mono">{c.units} Units</td>
                        <td className="p-3.5">{c.schedule}</td>
                        <td className="p-3.5 text-slate-600">{c.room}</td>
                        <td className="p-3.5 text-slate-500">{c.instructor}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: GRADES */}
        {activeTab === 'grades' && (
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="font-serif text-xl font-bold text-[#18392B]">
                Term Grades & Evaluation
              </h3>
              <span className="text-xs font-mono font-bold text-[#18392B] bg-amber-100 px-3 py-1 rounded border border-amber-300">
                Dean&apos;s Honor List Standing
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {studentProfile.courses.map((c) => (
                <div key={c.id} className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="font-mono text-xs font-bold text-[#588B76]">{c.code}</span>
                    <span className="font-mono font-extrabold text-base text-[#18392B] bg-slate-100 px-2 py-0.5 rounded">
                      {c.finalGrade || 'In Progress'}
                    </span>
                  </div>
                  <h4 className="font-serif text-sm font-bold text-[#18392B]">{c.title}</h4>
                  <div className="pt-2 border-t border-slate-100 flex justify-between text-xs text-slate-500 font-mono">
                    <span>Midterm: {c.midtermGrade || '1.0'}</span>
                    <span>Units: {c.units}</span>
                    <span className="text-emerald-700 font-bold">{c.status}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* TAB 3: PRACTICUM LOG */}
        {activeTab === 'practicum' && (
          <div className="space-y-6">
            <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm space-y-4">
              <h3 className="font-serif text-lg font-bold text-[#18392B] flex items-center gap-2">
                <PlusCircle className="w-5 h-5 text-[#588B76]" />
                <span>Log New Ministry Practicum Hours</span>
              </h3>
              <form onSubmit={handlePracticumSubmit} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-xs">
                <div className="space-y-1">
                  <label className="text-slate-600 font-semibold">Ministry Track</label>
                  <select
                    value={practicumType}
                    onChange={(e) => setPracticumType(e.target.value as any)}
                    className="w-full p-2 rounded border border-slate-300 bg-white focus:border-[#588B76] focus:outline-none"
                  >
                    <option value="Preaching / Teaching">Preaching / Teaching</option>
                    <option value="Youth Ministry">Youth Ministry</option>
                    <option value="Evangelism & Outreach">Evangelism & Outreach</option>
                    <option value="Counseling & Visitation">Counseling & Visitation</option>
                    <option value="Worship & Media">Worship & Media</option>
                    <option value="Church Administration">Church Administration</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-slate-600 font-semibold">Location / Partner Church</label>
                  <input
                    type="text"
                    required
                    value={practicumLocation}
                    onChange={(e) => setPracticumLocation(e.target.value)}
                    placeholder="e.g. Grace Bible Church, Cainta"
                    className="w-full p-2 rounded border border-slate-300 focus:border-[#588B76] focus:outline-none"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-slate-600 font-semibold">Hours Rendered</label>
                  <input
                    type="number"
                    min="1"
                    max="24"
                    required
                    value={practicumHours}
                    onChange={(e) => setPracticumHours(Number(e.target.value))}
                    className="w-full p-2 rounded border border-slate-300 focus:border-[#588B76] focus:outline-none"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-slate-600 font-semibold">Ministry Supervisor / Pastor</label>
                  <input
                    type="text"
                    required
                    value={practicumSupervisor}
                    onChange={(e) => setPracticumSupervisor(e.target.value)}
                    placeholder="e.g. Pastor Arnold Santos"
                    className="w-full p-2 rounded border border-slate-300 focus:border-[#588B76] focus:outline-none"
                  />
                </div>

                <div className="sm:col-span-2 lg:col-span-3 space-y-1">
                  <label className="text-slate-600 font-semibold">Description of Ministry Activity</label>
                  <input
                    type="text"
                    value={practicumDescription}
                    onChange={(e) => setPracticumDescription(e.target.value)}
                    placeholder="Brief ministry summary..."
                    className="w-full p-2 rounded border border-slate-300 focus:border-[#588B76] focus:outline-none"
                  />
                </div>

                <div className="sm:col-span-2 lg:col-span-1 flex items-end">
                  <button
                    type="submit"
                    className="w-full bg-[#18392B] hover:bg-[#588B76] hover:text-[#18392B] text-white font-bold py-2 rounded transition uppercase cursor-pointer"
                  >
                    Submit Entry
                  </button>
                </div>
              </form>
            </div>

            <div className="space-y-3">
              <h4 className="font-serif text-base font-bold text-[#18392B]">
                Practicum Log Entries ({studentProfile.practicumEntries.length} Recorded)
              </h4>
              <div className="space-y-2">
                {studentProfile.practicumEntries.map((p) => (
                  <div key={p.id} className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="font-mono font-bold text-[#588B76] bg-amber-50 px-2 py-0.5 rounded border border-amber-200 text-[10px]">
                          {p.ministryType}
                        </span>
                        <span className="text-slate-400 font-mono text-[10px]">{p.date}</span>
                      </div>
                      <p className="text-slate-800 font-medium">{p.description}</p>
                      <div className="flex items-center gap-3 text-slate-500 text-[11px]">
                        <span className="flex items-center gap-1">
                          <MapPin className="w-3.5 h-3.5 text-[#588B76]" />
                          {p.location}
                        </span>
                        <span>Supervisor: {p.supervisorName}</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-3 shrink-0">
                      <span className="font-mono font-bold text-slate-900 text-sm flex items-center gap-1">
                        <Clock className="w-3.5 h-3.5 text-slate-500" />
                        {p.hours} hrs
                      </span>
                      <span className="bg-emerald-100 text-emerald-800 font-bold px-2.5 py-1 rounded text-[10px] flex items-center gap-1">
                        <FileCheck className="w-3 h-3" />
                        {p.status}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* TAB 4: FINANCIAL BILLING */}
        {activeTab === 'financial' && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-[#18392B] text-white p-6 rounded-xl border border-[#588B76]/40 space-y-2">
                <span className="text-xs font-mono text-[#85AA9B] uppercase">Total Assessed Tuition</span>
                <div className="font-serif text-3xl font-extrabold text-white">
                  ₱{studentProfile.tuitionTotal.toLocaleString('en-PH')}
                </div>
                <span className="text-xs text-slate-400 block">AY 2026–2027 (18 Units)</span>
              </div>

              <div className="bg-emerald-900 text-white p-6 rounded-xl border border-emerald-500/40 space-y-2">
                <span className="text-xs font-mono text-emerald-300 uppercase">Total Paid to Date</span>
                <div className="font-serif text-3xl font-extrabold text-white">
                  ₱{studentProfile.tuitionPaid.toLocaleString('en-PH')}
                </div>
                <span className="text-xs text-emerald-200 block">Official Receipts Processed</span>
              </div>

              <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm space-y-2">
                <span className="text-xs font-mono text-slate-500 uppercase">Outstanding Balance</span>
                <div className={`font-serif text-3xl font-extrabold ${remainingBalance > 0 ? 'text-amber-700' : 'text-emerald-700'}`}>
                  ₱{remainingBalance.toLocaleString('en-PH')}
                </div>
                <span className="text-xs text-slate-500 block">
                  {remainingBalance === 0 ? 'Account Cleared & In Good Standing' : 'Due prior to Midterm Exams'}
                </span>
              </div>
            </div>

            {/* Payment Simulator */}
            <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm space-y-4">
              <h4 className="font-serif text-base font-bold text-[#18392B] flex items-center gap-2">
                <DollarSign className="w-5 h-5 text-[#588B76]" />
                <span>Simulate Online Tuition Payment</span>
              </h4>
              <form onSubmit={handlePayment} className="flex flex-col sm:flex-row gap-3 text-xs">
                <input
                  type="number"
                  min="1000"
                  max={remainingBalance || 50000}
                  value={paymentAmount}
                  onChange={(e) => setPaymentAmount(Number(e.target.value))}
                  placeholder="Payment amount in PHP"
                  className="p-3 rounded border border-slate-300 focus:border-[#588B76] focus:outline-none w-full sm:w-64 font-mono font-bold"
                />
                <button
                  type="submit"
                  disabled={remainingBalance === 0}
                  className="bg-[#18392B] hover:bg-[#588B76] hover:text-[#18392B] text-white font-bold px-6 py-3 rounded transition uppercase cursor-pointer disabled:opacity-50"
                >
                  Pay ₱{paymentAmount.toLocaleString('en-PH')}
                </button>
              </form>
            </div>
          </div>
        )}

        {/* TAB 5: SPIRITUAL MENTORSHIP & CHURCH */}
        {activeTab === 'spiritual' && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm space-y-4 text-xs">
              <h4 className="font-serif text-base font-bold text-[#18392B]">Assigned Faculty Mentor</h4>
              <div className="p-4 bg-[#FFFFFF] rounded-xl border border-slate-200 space-y-2">
                <strong className="font-serif text-base text-[#18392B] block">{studentProfile.mentorName}</strong>
                <p className="text-slate-600">Department of Biblical Studies & Pastoral Theology</p>
                <span className="text-slate-500 block">Weekly Discipleship Group: Thursdays 4:00 PM</span>
              </div>
            </div>

            <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm space-y-4 text-xs">
              <h4 className="font-serif text-base font-bold text-[#18392B]">Home Church Endorsement</h4>
              <div className="p-4 bg-[#FFFFFF] rounded-xl border border-slate-200 space-y-2">
                <strong className="font-serif text-base text-[#18392B] block">{studentProfile.homeChurch}</strong>
                <p className="text-slate-600">Active ministry status verified for ministerial scholarship.</p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
