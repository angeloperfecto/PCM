'use client';

import React, { useState } from 'react';
import { usePCM } from '@/lib/store';
import {
  Lock,
  LogOut,
  Users,
  FileCheck,
  Megaphone,
  BookOpen,
  Calendar,
  Sparkles,
  Plus,
  Trash2,
  CheckCircle2,
  XCircle,
  Clock,
  RotateCcw,
} from 'lucide-react';

export const AdminView: React.FC = () => {
  const {
    isAdminAuthenticated,
    adminLogin,
    adminLogout,
    applications,
    updateApplicationStatus,
    announcements,
    addAnnouncement,
    toggleAnnouncement,
    deleteAnnouncement,
    news,
    events,
    programs,
    stats,
    resetToInitialData,
    addToast,
  } = usePCM();

  const [adminUser, setAdminUser] = useState('admin');
  const [adminPass, setAdminPass] = useState('pcm2026');

  const [tab, setTab] = useState<
    'applications' | 'announcements' | 'programs' | 'news' | 'stats'
  >('applications');

  // New Announcement Modal State
  const [newAnnTitle, setNewAnnTitle] = useState('');
  const [newAnnCategory, setNewAnnCategory] = useState<'Admissions' | 'Academic' | 'Chapel' | 'Conference' | 'General'>('Admissions');

  const handleAdminLogin = (e: React.FormEvent) => {
    e.preventDefault();
    const ok = adminLogin(adminUser, adminPass);
    if (!ok) {
      addToast({
        title: 'Access Denied',
        message: 'Invalid Admin Credentials (Default: admin / pcm2026)',
        type: 'error',
      });
    }
  };

  const handleCreateAnnouncement = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newAnnTitle.trim()) return;
    addAnnouncement({
      title: newAnnTitle.trim(),
      category: newAnnCategory,
      date: 'Aug 29, 2026',
      active: true,
    });
    setNewAnnTitle('');
  };

  // If Admin is NOT logged in
  if (!isAdminAuthenticated) {
    return (
      <div className="w-full min-h-[70vh] bg-[#070e1c] py-16 px-4 flex items-center justify-center font-sans">
        <div className="max-w-md w-full bg-[#18392B] rounded-2xl border border-slate-700 shadow-2xl p-8 space-y-6 text-white">
          <div className="text-center space-y-2">
            <div className="w-14 h-14 rounded-2xl bg-[#588B76] text-[#18392B] flex items-center justify-center mx-auto shadow-lg">
              <Lock className="w-7 h-7" />
            </div>
            <h2 className="font-serif text-2xl font-bold text-white">
              PCM Admin CMS Console
            </h2>
            <p className="text-xs text-slate-400">
              Authorized administrative access for Office of the Registrar, Admissions Committee, and Webmaster.
            </p>
          </div>

          <form onSubmit={handleAdminLogin} className="space-y-4 text-xs">
            <div>
              <label className="block text-slate-300 font-bold mb-1">
                Admin Username
              </label>
              <input
                type="text"
                required
                value={adminUser}
                onChange={(e) => setAdminUser(e.target.value)}
                className="w-full p-3 rounded-lg border border-slate-700 bg-[#070e1c] text-white focus:border-[#588B76] text-sm focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-slate-300 font-bold mb-1">
                Security Password
              </label>
              <input
                type="password"
                required
                value={adminPass}
                onChange={(e) => setAdminPass(e.target.value)}
                className="w-full p-3 rounded-lg border border-slate-700 bg-[#070e1c] text-white focus:border-[#588B76] text-sm focus:outline-none"
              />
            </div>

            <button
              type="submit"
              className="w-full bg-[#588B76] hover:bg-[#85AA9B] text-[#18392B] font-bold py-3 rounded-lg text-xs uppercase tracking-wider transition cursor-pointer shadow-lg"
            >
              Authenticate & Open CMS
            </button>
          </form>

          <div className="bg-slate-900/80 p-3 rounded-lg border border-slate-800 text-[11px] text-slate-400 text-center">
            Demo Credentials: User: <code>admin</code> | Password: <code>pcm2026</code>
          </div>
        </div>
      </div>
    );
  }

  // Admin Dashboard
  return (
    <div className="w-full bg-[#FFFFFF] font-sans pb-20">
      {/* Top Header */}
      <div className="bg-[#18392B] text-white py-6 px-4 sm:px-8 border-b-4 border-[#588B76]">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <div>
            <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-[#85AA9B]">
              PCM Institutional Content & Admissions Management System
            </span>
            <h1 className="font-serif text-2xl font-bold text-white">
              Administrator Control Console
            </h1>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={resetToInitialData}
              className="bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs px-3 py-2 rounded border border-slate-700 flex items-center gap-1.5 transition cursor-pointer"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Reset Data</span>
            </button>

            <button
              onClick={adminLogout}
              className="bg-rose-900/80 hover:bg-rose-800 text-white text-xs font-semibold px-4 py-2 rounded flex items-center gap-1.5 transition cursor-pointer"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>Sign Out</span>
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8 space-y-8">
        {/* Metric Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
            <span className="text-[11px] text-slate-500 block">Total Applications</span>
            <span className="font-serif text-2xl font-extrabold text-[#18392B]">{applications.length}</span>
          </div>
          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
            <span className="text-[11px] text-slate-500 block">Active Announcements</span>
            <span className="font-serif text-2xl font-extrabold text-amber-700">
              {announcements.filter((a) => a.active).length}
            </span>
          </div>
          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
            <span className="text-[11px] text-slate-500 block">Degree Programs</span>
            <span className="font-serif text-2xl font-extrabold text-[#18392B]">{programs.length}</span>
          </div>
          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
            <span className="text-[11px] text-slate-500 block">Published Articles</span>
            <span className="font-serif text-2xl font-extrabold text-[#18392B]">{news.length}</span>
          </div>
        </div>

        {/* Tab Selector */}
        <div className="flex flex-wrap items-center gap-2 border-b border-slate-200 pb-3 text-xs font-bold">
          {[
            { id: 'applications', label: `Admissions Review (${applications.length})`, icon: FileCheck },
            { id: 'announcements', label: `Announcements Ticker (${announcements.length})`, icon: Megaphone },
            { id: 'programs', label: `Academic Degrees (${programs.length})`, icon: BookOpen },
            { id: 'news', label: `News & Dispatches (${news.length})`, icon: Calendar },
          ].map((t) => {
            const Icon = t.icon;
            return (
              <button
                key={t.id}
                onClick={() => setTab(t.id as any)}
                className={`px-4 py-2.5 rounded-lg flex items-center gap-2 transition cursor-pointer ${
                  tab === t.id
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

        {/* TAB 1: ADMISSIONS APPLICATIONS REVIEW */}
        {tab === 'applications' && (
          <div className="space-y-4">
            <h3 className="font-serif text-xl font-bold text-[#18392B]">
              Applicant Review Queue (AY 2026–2027)
            </h3>

            <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-sm">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse min-w-[640px]">
                  <thead>
                    <tr className="bg-[#18392B] text-white">
                      <th className="p-3.5 font-bold">Ref #</th>
                      <th className="p-3.5 font-bold">Candidate Name</th>
                      <th className="p-3.5 font-bold">Program</th>
                      <th className="p-3.5 font-bold">Church / Pastor</th>
                      <th className="p-3.5 font-bold">Status</th>
                      <th className="p-3.5 font-bold text-right">Committee Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200 text-slate-700">
                    {applications.map((app) => (
                      <tr key={app.id} className="hover:bg-slate-50">
                        <td className="p-3.5 font-mono font-bold text-[#18392B]">{app.referenceNumber}</td>
                        <td className="p-3.5">
                          <strong className="block text-slate-900">{app.fullName}</strong>
                          <span className="text-[10px] text-slate-500 font-mono">{app.email}</span>
                        </td>
                        <td className="p-3.5">{app.programName}</td>
                        <td className="p-3.5">
                          <span className="block">{app.homeChurch}</span>
                          <span className="text-[10px] text-slate-400">Pastor: {app.pastorName}</span>
                        </td>
                        <td className="p-3.5">
                          <span
                            className={`text-[10px] font-mono font-bold uppercase px-2.5 py-1 rounded-full ${
                              app.status === 'Accepted' || app.status === 'Enrolled'
                                ? 'bg-emerald-100 text-emerald-800'
                                : app.status === 'Under Review'
                                ? 'bg-blue-100 text-blue-800'
                                : app.status === 'Rejected'
                                ? 'bg-rose-100 text-rose-800'
                                : 'bg-amber-100 text-amber-800'
                            }`}
                          >
                            {app.status}
                          </span>
                        </td>
                        <td className="p-3.5 text-right space-x-1.5 whitespace-nowrap">
                          <button
                            onClick={() => updateApplicationStatus(app.id, 'Under Review', 'Scheduled for admissions faculty interview')}
                            title="Mark Under Review"
                            className="bg-blue-600 hover:bg-blue-700 text-white text-[10px] font-bold px-2 py-1 rounded transition cursor-pointer"
                          >
                            Review
                          </button>
                          <button
                            onClick={() => updateApplicationStatus(app.id, 'Accepted', 'Approved for enrollment')}
                            title="Accept Candidate"
                            className="bg-emerald-600 hover:bg-emerald-700 text-white text-[10px] font-bold px-2 py-1 rounded transition cursor-pointer"
                          >
                            Accept
                          </button>
                          <button
                            onClick={() => updateApplicationStatus(app.id, 'Rejected', 'Application does not meet criteria')}
                            title="Reject Application"
                            className="bg-rose-600 hover:bg-rose-700 text-white text-[10px] font-bold px-2 py-1 rounded transition cursor-pointer"
                          >
                            Reject
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: ANNOUNCEMENTS TICKER MANAGER */}
        {tab === 'announcements' && (
          <div className="space-y-6">
            <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm space-y-4">
              <h4 className="font-serif text-base font-bold text-[#18392B]">
                Add New Announcement Ticker Item
              </h4>
              <form onSubmit={handleCreateAnnouncement} className="flex flex-col sm:flex-row gap-3 text-xs">
                <input
                  type="text"
                  required
                  value={newAnnTitle}
                  onChange={(e) => setNewAnnTitle(e.target.value)}
                  placeholder="Announcement headline message..."
                  className="w-full p-2.5 rounded border border-slate-300 focus:border-[#588B76] focus:outline-none"
                />
                <select
                  value={newAnnCategory}
                  onChange={(e) => setNewAnnCategory(e.target.value as any)}
                  className="p-2.5 rounded border border-slate-300 focus:border-[#588B76] focus:outline-none bg-white shrink-0"
                >
                  <option value="Admissions">Admissions</option>
                  <option value="Academic">Academic</option>
                  <option value="Chapel">Chapel</option>
                  <option value="Conference">Conference</option>
                  <option value="General">General</option>
                </select>
                <button
                  type="submit"
                  className="bg-[#18392B] hover:bg-[#588B76] hover:text-[#18392B] text-white font-bold px-5 py-2.5 rounded transition uppercase cursor-pointer shrink-0"
                >
                  Add Ticker Item
                </button>
              </form>
            </div>

            <div className="space-y-3">
              {announcements.map((ann) => (
                <div
                  key={ann.id}
                  className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex items-center justify-between gap-4 text-xs"
                >
                  <div className="space-y-1">
                    <span className="text-[10px] font-mono font-bold uppercase text-[#588B76] bg-amber-50 px-2 py-0.5 rounded border border-amber-200">
                      {ann.category}
                    </span>
                    <h5 className="font-serif font-bold text-sm text-[#18392B]">{ann.title}</h5>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      onClick={() => toggleAnnouncement(ann.id)}
                      className={`px-3 py-1 rounded text-[10px] font-bold uppercase cursor-pointer ${
                        ann.active ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-200 text-slate-600'
                      }`}
                    >
                      {ann.active ? 'Active' : 'Inactive'}
                    </button>
                    <button
                      onClick={() => deleteAnnouncement(ann.id)}
                      className="p-1 text-slate-400 hover:text-rose-600 transition cursor-pointer"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* TAB 3: DEGREE PROGRAMS */}
        {tab === 'programs' && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {programs.map((p) => (
              <div key={p.id} className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm space-y-2 text-xs">
                <span className="font-mono font-bold text-[#18392B] bg-slate-100 px-2 py-0.5 rounded">
                  {p.code}
                </span>
                <h4 className="font-serif font-bold text-sm text-[#18392B]">{p.name}</h4>
                <p className="text-slate-500">{p.duration} • {p.credits} Units • {p.studyMode}</p>
                <div className="pt-2 border-t border-slate-100 text-slate-400 font-mono text-[10px]">
                  Tuition Rate: ₱{p.tuitionPerUnit.toLocaleString()}/unit
                </div>
              </div>
            ))}
          </div>
        )}

        {/* TAB 4: NEWS */}
        {tab === 'news' && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {news.map((n) => (
              <div key={n.id} className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm space-y-2 text-xs">
                <span className="text-[10px] font-mono text-[#588B76] uppercase font-bold">{n.category} • {n.date}</span>
                <h4 className="font-serif font-bold text-sm text-[#18392B]">{n.title}</h4>
                <p className="text-slate-500 line-clamp-2">{n.excerpt}</p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
