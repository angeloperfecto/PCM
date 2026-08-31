'use client';

import React, { useState } from 'react';
import { usePCM } from '@/lib/store';
import {
  X,
  Shield,
  GraduationCap,
  Users,
  CheckCircle2,
  LogOut,
  ExternalLink,
  Mail,
  Calendar,
  Sparkles,
  RefreshCw,
  Clock,
  IdCard,
  Building,
} from 'lucide-react';

export const UserAccountModal: React.FC = () => {
  const {
    userAccountModalOpen,
    setUserAccountModalOpen,
    currentUserAccount,
    firebaseAuthUser,
    signInWithGoogle,
    signOutUser,
    navigateTo,
    isAdminLoggedIn,
    isStudentLoggedIn,
    studentProfile,
    linkStudentIdToUser,
    addToast,
  } = usePCM();

  const [isSigningIn, setIsSigningIn] = useState(false);
  const [studentIdInput, setStudentIdInput] = useState('');
  const [isLinking, setIsLinking] = useState(false);

  if (!userAccountModalOpen) return null;

  const handleGoogleSignIn = async () => {
    setIsSigningIn(true);
    try {
      const res = await signInWithGoogle();
      if (res.success) {
        if (res.role === 'Admin') {
          navigateTo('admin');
        } else if (res.role === 'Student') {
          navigateTo('portal');
        }
      }
    } finally {
      setIsSigningIn(false);
    }
  };

  const handleLinkStudentId = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!studentIdInput.trim()) return;
    setIsLinking(true);
    try {
      await linkStudentIdToUser(studentIdInput.trim());
      setStudentIdInput('');
    } finally {
      setIsLinking(false);
    }
  };

  return (
    <div
      id="user-account-modal-overlay"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200"
      onClick={() => setUserAccountModalOpen(false)}
    >
      <div
        id="user-account-modal-container"
        className="bg-white rounded-3xl shadow-2xl max-w-lg w-full overflow-hidden border border-slate-200 animate-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="bg-[#18392B] text-white p-6 relative">
          <button
            id="close-user-account-modal-btn"
            onClick={() => setUserAccountModalOpen(false)}
            className="absolute top-5 right-5 p-2 rounded-full text-slate-300 hover:text-white hover:bg-white/10 transition-colors"
            title="Close modal"
          >
            <X className="w-5 h-5" />
          </button>

          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#234E3D] border border-emerald-500/30 flex items-center justify-center text-[#97D4B6]">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-serif text-xl font-bold text-[#E2EBE6]">
                PCM User Authentication
              </h3>
              <p className="text-xs text-slate-300">
                Google / Gmail Single Sign-On & Account Hub
              </p>
            </div>
          </div>
        </div>

        {/* Modal Content */}
        <div className="p-6 space-y-6 max-h-[80vh] overflow-y-auto">
          {currentUserAccount || firebaseAuthUser ? (
            /* Signed In User Profile */
            <div className="space-y-6">
              {/* Profile Card */}
              <div className="flex items-start gap-4 p-4 rounded-2xl bg-slate-50 border border-slate-200/80">
                {currentUserAccount?.photoURL || firebaseAuthUser?.photoURL ? (
                  <img
                    src={currentUserAccount?.photoURL || firebaseAuthUser?.photoURL || ''}
                    alt={currentUserAccount?.name || 'User Avatar'}
                    className="w-16 h-16 rounded-full object-cover border-2 border-[#18392B]/20 shadow-xs"
                    referrerPolicy="no-referrer"
                  />
                ) : (
                  <div className="w-16 h-16 rounded-full bg-[#18392B] text-[#97D4B6] font-bold text-xl flex items-center justify-center shadow-xs">
                    {(currentUserAccount?.name || firebaseAuthUser?.displayName || 'U').charAt(0).toUpperCase()}
                  </div>
                )}

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h4 className="font-bold text-slate-900 text-base truncate">
                      {currentUserAccount?.name || firebaseAuthUser?.displayName || 'PCM User'}
                    </h4>
                    <span
                      className={`inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-0.5 rounded-full ${
                        currentUserAccount?.role === 'Admin'
                          ? 'bg-amber-100 text-amber-800 border border-amber-300'
                          : currentUserAccount?.role === 'Student'
                          ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                          : 'bg-blue-100 text-blue-800 border border-blue-300'
                      }`}
                    >
                      {currentUserAccount?.role === 'Admin' && <Shield className="w-3 h-3" />}
                      {currentUserAccount?.role === 'Student' && <GraduationCap className="w-3 h-3" />}
                      {currentUserAccount?.role || 'Member'}
                    </span>
                  </div>

                  <p className="text-xs text-slate-600 truncate flex items-center gap-1.5 mt-1">
                    <Mail className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                    {currentUserAccount?.email || firebaseAuthUser?.email}
                  </p>

                  <div className="flex items-center gap-3 mt-2 text-[11px] text-slate-500">
                    <span className="flex items-center gap-1">
                      <Clock className="w-3 h-3 text-slate-400" />
                      Status: <strong className="text-emerald-700 font-semibold">{currentUserAccount?.status || 'Active'}</strong>
                    </span>
                    <span className="flex items-center gap-1">
                      <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                      Google Verified
                    </span>
                  </div>
                </div>
              </div>

              {/* Account Details & Metadata */}
              <div className="grid grid-cols-2 gap-3 text-xs">
                <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
                  <span className="text-slate-500 block mb-0.5">Firebase UID</span>
                  <span className="font-mono text-[11px] text-slate-800 truncate block" title={currentUserAccount?.uid || firebaseAuthUser?.uid}>
                    {(currentUserAccount?.uid || firebaseAuthUser?.uid || '').substring(0, 18)}...
                  </span>
                </div>
                <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
                  <span className="text-slate-500 block mb-0.5">Account Role</span>
                  <span className="font-semibold text-slate-900 block">
                    {currentUserAccount?.role === 'Admin'
                      ? `${currentUserAccount.adminRole || 'Super Admin'}`
                      : currentUserAccount?.role || 'Member'}
                  </span>
                </div>
                {currentUserAccount?.studentId && (
                  <div className="p-3 rounded-xl bg-emerald-50/70 border border-emerald-200 col-span-2 flex items-center justify-between">
                    <div>
                      <span className="text-emerald-700 block text-[11px] font-medium">Linked Student Record</span>
                      <span className="font-bold text-[#18392B] text-sm">{currentUserAccount.studentId}</span>
                    </div>
                    <span className="text-xs px-2.5 py-1 rounded-lg bg-emerald-600 text-white font-medium">
                      Enrolled
                    </span>
                  </div>
                )}
              </div>

              {/* Quick Navigation based on Role */}
              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-700 uppercase tracking-wider block">
                  Accessible PCM Portals
                </label>
                <div className="grid grid-cols-1 gap-2">
                  {currentUserAccount?.role === 'Admin' && (
                    <button
                      id="goto-admin-cms-btn"
                      onClick={() => {
                        setUserAccountModalOpen(false);
                        navigateTo('admin');
                      }}
                      className="w-full flex items-center justify-between p-3 rounded-xl bg-[#18392B] text-white hover:bg-[#234E3D] transition-colors text-sm font-medium"
                    >
                      <span className="flex items-center gap-2">
                        <Shield className="w-4 h-4 text-[#97D4B6]" />
                        Launch Administrator CMS Workspace
                      </span>
                      <ExternalLink className="w-4 h-4 text-[#97D4B6]" />
                    </button>
                  )}

                  <button
                    id="goto-student-portal-btn"
                    onClick={() => {
                      setUserAccountModalOpen(false);
                      navigateTo('portal');
                    }}
                    className="w-full flex items-center justify-between p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-900 hover:bg-emerald-100 transition-colors text-sm font-medium"
                  >
                    <span className="flex items-center gap-2">
                      <GraduationCap className="w-4 h-4 text-emerald-700" />
                      Launch MyPCM Student Portal & Grades
                    </span>
                    <ExternalLink className="w-4 h-4 text-emerald-700" />
                  </button>

                  <button
                    id="goto-admissions-btn"
                    onClick={() => {
                      setUserAccountModalOpen(false);
                      navigateTo('admissions', 'apply');
                    }}
                    className="w-full flex items-center justify-between p-3 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 transition-colors text-sm font-medium"
                  >
                    <span className="flex items-center gap-2">
                      <IdCard className="w-4 h-4 text-slate-600" />
                      Online Admissions & Enrollment Tracker
                    </span>
                    <ExternalLink className="w-4 h-4 text-slate-600" />
                  </button>
                </div>
              </div>

              {/* Sign Out Action */}
              <div className="pt-2 border-t border-slate-200">
                <button
                  id="google-sign-out-btn"
                  onClick={() => {
                    signOutUser();
                    setUserAccountModalOpen(false);
                  }}
                  className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl border border-red-200 text-red-700 hover:bg-red-50 text-sm font-medium transition-colors"
                >
                  <LogOut className="w-4 h-4" />
                  Sign Out from Google Account
                </button>
              </div>
            </div>
          ) : (
            /* Unauthenticated View: Sign In with Google */
            <div className="text-center py-4 space-y-6">
              <div className="w-16 h-16 mx-auto rounded-full bg-emerald-50 border border-emerald-200 flex items-center justify-center text-[#18392B]">
                <svg className="w-8 h-8" viewBox="0 0 24 24">
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
              </div>

              <div>
                <h4 className="font-serif text-xl font-bold text-slate-900">
                  Sign in to Philippine College of Ministry
                </h4>
                <p className="text-sm text-slate-600 mt-1 max-w-sm mx-auto">
                  Access your Student Portal, faculty materials, admission files, or Administrator CMS using your Google or Gmail account.
                </p>
              </div>

              {/* 1-Click Google Sign-In Button */}
              <button
                id="modal-google-sign-in-btn"
                onClick={handleGoogleSignIn}
                disabled={isSigningIn}
                className="w-full flex items-center justify-center gap-3 py-3.5 px-6 rounded-2xl bg-white border-2 border-slate-300 text-slate-800 font-semibold shadow-xs hover:bg-slate-50 hover:border-slate-400 transition-all text-base disabled:opacity-50"
              >
                {isSigningIn ? (
                  <RefreshCw className="w-5 h-5 animate-spin text-slate-600" />
                ) : (
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
                )}
                {isSigningIn ? 'Authenticating with Google...' : 'Continue with Google / Gmail'}
              </button>

              <div className="bg-slate-50 rounded-2xl p-4 border border-slate-200 text-left space-y-2">
                <div className="flex items-center gap-2 text-xs font-semibold text-slate-800">
                  <Shield className="w-4 h-4 text-[#18392B]" />
                  Secure Role-Based Access:
                </div>
                <ul className="text-xs text-slate-600 space-y-1 pl-4 list-disc">
                  <li><strong>Administrator (angeloperfecto.epc@gmail.com / president@pcm.edu.ph):</strong> Full CMS editing, faculty, events, programs & database sync.</li>
                  <li><strong>Student / Member:</strong> MyPCM Portal, grades transcript, tuition ledger & practicum logs.</li>
                </ul>
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="bg-slate-50 px-6 py-3 border-t border-slate-200 flex items-center justify-between text-xs text-slate-500">
          <span>Philippine College of Ministry • Baguio City</span>
          <span className="flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
            Firestore Real-time Sync
          </span>
        </div>
      </div>
    </div>
  );
};
