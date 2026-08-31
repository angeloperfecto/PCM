'use client';

import React, { useState } from 'react';
import { usePCM } from '@/lib/store';
import { Application, ApplicationStatus } from '@/lib/types';
import {
  FileCheck,
  Search,
  CheckCircle2,
  Clock,
  XCircle,
  Eye,
  MessageSquare,
  Download,
  Calendar,
  Mail,
  Phone,
  Church,
  GraduationCap,
  Heart,
  Plus,
} from 'lucide-react';

export const AdminApplicationsTab: React.FC = () => {
  const {
    applications,
    updateApplicationStatus,
    addApplicationNote,
    addToast,
    canPerformAction,
    currentAdminUser,
  } = usePCM();

  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [selectedApp, setSelectedApp] = useState<Application | null>(null);
  const [newNote, setNewNote] = useState('');

  const statusColors: Record<ApplicationStatus, string> = {
    Draft: 'bg-slate-100 text-slate-700 border-slate-200',
    Submitted: 'bg-blue-100 text-blue-800 border-blue-200',
    'Under Review': 'bg-amber-100 text-amber-800 border-amber-200',
    'Additional Documents Required': 'bg-amber-100 text-amber-900 border-amber-300',
    'Exam Scheduled': 'bg-purple-100 text-purple-800 border-purple-200',
    Interviewed: 'bg-indigo-100 text-indigo-800 border-indigo-200',
    Accepted: 'bg-emerald-100 text-emerald-800 border-emerald-200',
    Waitlisted: 'bg-orange-100 text-orange-800 border-orange-200',
    Enrolled: 'bg-[#18392B] text-white border-[#18392B]',
    Rejected: 'bg-red-100 text-red-800 border-red-200',
  };

  const handleStatusChange = (appId: string, newStatus: ApplicationStatus) => {
    if (!canPerformAction('Content Admin')) {
      addToast({
        title: 'Permission Denied',
        message: 'You need Content Admin privileges to change admission decisions.',
        type: 'error',
      });
      return;
    }

    updateApplicationStatus(appId, newStatus);
    addToast({
      title: 'Status Updated',
      message: `Applicant status updated to ${newStatus}.`,
      type: 'success',
    });

    if (selectedApp && selectedApp.id === appId) {
      setSelectedApp({ ...selectedApp, status: newStatus });
    }
  };

  const handleAddNote = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedApp || !newNote.trim()) return;

    addApplicationNote(selectedApp.id, newNote.trim());
    addToast({ title: 'Note Added', message: 'Review note added to applicant record.', type: 'info' });
    setNewNote('');

    // Update selected app notes
    const updatedNotes = [
      ...(selectedApp.internalNotes || selectedApp.notes || []),
      `[${new Date().toLocaleDateString()} by ${currentAdminUser?.name || 'Admin'}]: ${newNote.trim()}`,
    ];
    setSelectedApp({ ...selectedApp, notes: updatedNotes, internalNotes: updatedNotes });
  };

  const exportCSV = () => {
    const headers = ['TrackingNo', 'FullName', 'Email', 'Phone', 'Program', 'Status', 'Church', 'SubmittedDate'];
    const rows = applications.map((a) => [
      a.trackingNumber || a.referenceNumber,
      `"${a.fullName}"`,
      a.email,
      a.phone,
      `"${a.programName}"`,
      a.status,
      `"${a.churchName || a.homeChurch || ''}"`,
      a.submissionDate || a.createdAt,
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `PCM_Admissions_Roster_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    addToast({ title: 'Roster Exported', message: 'Admissions CSV generated successfully.', type: 'success' });
  };

  const filteredApps = applications.filter((app) => {
    const matchesSearch =
      !search ||
      app.fullName.toLowerCase().includes(search.toLowerCase()) ||
      (app.trackingNumber && app.trackingNumber.toLowerCase().includes(search.toLowerCase())) ||
      (app.referenceNumber && app.referenceNumber.toLowerCase().includes(search.toLowerCase())) ||
      app.email.toLowerCase().includes(search.toLowerCase()) ||
      ((app.programName || app.program || '').toLowerCase().includes(search.toLowerCase())) ||
      (app.churchName && app.churchName.toLowerCase().includes(search.toLowerCase())) ||
      (app.homeChurch && app.homeChurch.toLowerCase().includes(search.toLowerCase()));

    const matchesStatus = statusFilter === 'all' || app.status === statusFilter;

    return matchesSearch && matchesStatus;
  });

  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-6 space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-slate-100 pb-4">
        <div>
          <h2 className="font-serif text-lg font-bold text-[#18392B] flex items-center gap-2">
            <FileCheck className="w-5 h-5 text-[#588B76]" />
            Online Admissions Applications & Review Portal
          </h2>
          <p className="text-xs text-slate-500">
            Review incoming applicant records, testimony dossiers, pastor endorsements, and admission decisions.
          </p>
        </div>

        <button
          onClick={exportCSV}
          className="flex items-center gap-2 bg-[#18392B] hover:bg-[#10261D] text-white px-4 py-2.5 rounded-lg text-xs font-bold uppercase tracking-wider transition cursor-pointer shadow-sm"
        >
          <Download className="w-4 h-4 text-[#85AA9B]" />
          <span>Export CSV Roster</span>
        </button>
      </div>

      {/* Search & Status Filters */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            placeholder="Search applicants by name, tracking number, email, or church..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-2 text-xs rounded-lg border border-slate-200 focus:border-[#588B76] focus:outline-none"
          />
        </div>

        <div className="flex flex-wrap items-center gap-1.5 text-xs">
          {['all', 'Submitted', 'Under Review', 'Accepted', 'Enrolled', 'Waitlisted', 'Rejected'].map((st) => (
            <button
              key={st}
              onClick={() => setStatusFilter(st)}
              className={`px-3 py-1.5 rounded-lg font-medium transition cursor-pointer ${
                statusFilter === st
                  ? 'bg-[#18392B] text-white font-bold'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              {st === 'all' ? 'All Applicants' : st}
            </button>
          ))}
        </div>
      </div>

      {/* Applications Table */}
      <div className="border border-slate-200 rounded-xl overflow-hidden overflow-x-auto bg-white">
        <table className="w-full text-left text-xs border-collapse">
          <thead>
            <tr className="bg-slate-50 text-slate-600 font-serif border-b border-slate-200">
              <th className="py-3 px-4 font-bold">Tracking #</th>
              <th className="py-3 px-4 font-bold">Applicant Name</th>
              <th className="py-3 px-4 font-bold">Program Desired</th>
              <th className="py-3 px-4 font-bold">Church & Location</th>
              <th className="py-3 px-4 font-bold">Submission Date</th>
              <th className="py-3 px-4 font-bold">Status</th>
              <th className="py-3 px-4 font-bold text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 text-slate-700">
            {filteredApps.length === 0 ? (
              <tr>
                <td colSpan={7} className="py-8 text-center text-slate-400">
                  No applicant records found matching your filters.
                </td>
              </tr>
            ) : (
              filteredApps.map((app) => (
                <tr key={app.id} className="hover:bg-slate-50 transition">
                  <td className="py-3 px-4 font-mono font-bold text-[#588B76]">
                    {app.trackingNumber || app.referenceNumber}
                  </td>
                  <td className="py-3 px-4 font-bold text-[#18392B]">
                    <div>{app.fullName}</div>
                    <div className="text-[11px] font-normal text-slate-400">{app.email}</div>
                  </td>
                  <td className="py-3 px-4">{app.programName || app.program || 'N/A'}</td>
                  <td className="py-3 px-4 text-slate-500">{app.churchName || app.homeChurch || 'N/A'}</td>
                  <td className="py-3 px-4 font-mono text-slate-500">{app.submissionDate || app.createdAt}</td>
                  <td className="py-3 px-4">
                    <select
                      value={app.status}
                      onChange={(e) => handleStatusChange(app.id, e.target.value as ApplicationStatus)}
                      className={`text-[11px] font-bold px-2 py-1 rounded border focus:outline-none cursor-pointer ${
                        statusColors[app.status] || 'bg-slate-100'
                      }`}
                    >
                      <option value="Submitted">Submitted</option>
                      <option value="Under Review">Under Review</option>
                      <option value="Exam Scheduled">Exam Scheduled</option>
                      <option value="Interviewed">Interviewed</option>
                      <option value="Accepted">Accepted</option>
                      <option value="Waitlisted">Waitlisted</option>
                      <option value="Enrolled">Enrolled</option>
                      <option value="Rejected">Rejected</option>
                    </select>
                  </td>
                  <td className="py-3 px-4 text-right">
                    <button
                      onClick={() => setSelectedApp(app)}
                      className="px-3 py-1 bg-slate-100 hover:bg-[#588B76] hover:text-white rounded text-[11px] font-bold text-[#18392B] transition cursor-pointer"
                    >
                      Review Dossier
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Applicant Detail Review Modal */}
      {selectedApp && (
        <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-2xl w-full p-6 space-y-5 shadow-2xl border border-slate-200 max-h-[90vh] overflow-y-auto">
            {/* Header */}
            <div className="flex items-start justify-between gap-4 border-b border-slate-100 pb-3">
              <div>
                <span className="text-[10px] font-mono font-bold uppercase text-[#588B76] bg-[#588B76]/10 px-2 py-0.5 rounded">
                  Tracking: {selectedApp.trackingNumber || selectedApp.referenceNumber}
                </span>
                <h3 className="font-serif text-lg font-bold text-[#18392B] mt-1">
                  {selectedApp.fullName}
                </h3>
                <p className="text-xs text-slate-500">
                  Applied for <strong>{selectedApp.programName || selectedApp.program || 'Program'}</strong> on {selectedApp.submissionDate || selectedApp.createdAt}
                </p>
              </div>

              <div className="flex items-center gap-2">
                <span
                  className={`text-xs font-bold px-3 py-1 rounded-full border ${
                    statusColors[selectedApp.status]
                  }`}
                >
                  {selectedApp.status}
                </span>
              </div>
            </div>

            {/* Content Tabs / Info Blocks */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
              {/* Personal & Contact */}
              <div className="bg-slate-50 p-4 rounded-xl space-y-2 border border-slate-200">
                <h4 className="font-bold text-[#18392B] flex items-center gap-1.5">
                  <Mail className="w-3.5 h-3.5 text-[#588B76]" />
                  Contact & Personal Background
                </h4>
                <div className="space-y-1 text-slate-600 text-[11px]">
                  <div>Email: <strong>{selectedApp.email}</strong></div>
                  <div>Phone: <strong>{selectedApp.phone}</strong></div>
                  <div>Gender: <strong>{selectedApp.gender || 'N/A'}</strong></div>
                  <div>Birthdate: <strong>{selectedApp.birthdate || selectedApp.birthDate || 'N/A'}</strong></div>
                  <div>Address: <strong>{selectedApp.address || 'N/A'}</strong></div>
                </div>
              </div>

              {/* Church & Spiritual Endorsement */}
              <div className="bg-slate-50 p-4 rounded-xl space-y-2 border border-slate-200">
                <h4 className="font-bold text-[#18392B] flex items-center gap-1.5">
                  <Church className="w-3.5 h-3.5 text-[#588B76]" />
                  Local Church Affiliation
                </h4>
                <div className="space-y-1 text-slate-600 text-[11px]">
                  <div>Home Church: <strong>{selectedApp.churchName || selectedApp.homeChurch || 'N/A'}</strong></div>
                  <div>Senior Pastor: <strong>{selectedApp.pastorName || 'N/A'}</strong></div>
                  <div>Years in Faith: <strong>{selectedApp.yearsInFaith || selectedApp.salvationYear || 'N/A'}</strong></div>
                  <div>Ministry Roles: <strong>{selectedApp.ministryExperience || selectedApp.currentMinistryInvolvement || 'N/A'}</strong></div>
                </div>
              </div>
            </div>

            {/* Spiritual Calling & Testimony */}
            {(selectedApp.salvationTestimony || selectedApp.personalTestimony || selectedApp.callingStatement) && (
              <div className="bg-emerald-50/50 p-4 rounded-xl border border-emerald-200 space-y-1.5 text-xs">
                <h4 className="font-bold text-[#18392B] flex items-center gap-1.5">
                  <Heart className="w-3.5 h-3.5 text-[#588B76]" />
                  Personal Christian Testimony & Calling to Ministry
                </h4>
                <p className="text-slate-700 leading-relaxed text-[11px] italic bg-white p-3 rounded-lg border border-emerald-100">
                  &ldquo;{selectedApp.salvationTestimony || selectedApp.personalTestimony || selectedApp.callingStatement}&rdquo;
                </p>
              </div>
            )}

            {/* Financial Aid Status */}
            {selectedApp.financialAidRequired && (
              <div className="bg-blue-50 p-3 rounded-xl border border-blue-200 text-xs text-blue-900 flex items-center justify-between">
                <div>
                  <strong>Financial Assistance / Scholarship Requested:</strong>
                  <div className="text-[11px] text-blue-700">
                    Applicant requested pastoral grant consideration for tuition assistance.
                  </div>
                </div>
                <span className="bg-blue-200 text-blue-900 px-2 py-0.5 rounded font-bold text-[10px]">
                  Scholarship Candidate
                </span>
              </div>
            )}

            {/* Review Notes Section */}
            <div className="space-y-2 text-xs border-t border-slate-100 pt-3">
              <h4 className="font-bold text-[#18392B] flex items-center gap-1.5">
                <MessageSquare className="w-3.5 h-3.5 text-[#588B76]" />
                Admissions Committee Internal Notes
              </h4>

              {selectedApp.notes && selectedApp.notes.length > 0 ? (
                <div className="space-y-1.5 max-h-32 overflow-y-auto pr-1">
                  {selectedApp.notes.map((note, idx) => (
                    <div key={idx} className="bg-slate-100 p-2 rounded text-[11px] text-slate-700">
                      {note}
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-[11px] text-slate-400 italic">No notes recorded yet.</p>
              )}

              <form onSubmit={handleAddNote} className="flex gap-2 pt-1">
                <input
                  type="text"
                  placeholder="Add an internal reviewer evaluation note..."
                  value={newNote}
                  onChange={(e) => setNewNote(e.target.value)}
                  className="flex-1 p-2 rounded-lg border border-slate-200 text-xs focus:border-[#588B76] focus:outline-none"
                />
                <button
                  type="submit"
                  className="px-4 py-2 bg-[#588B76] hover:bg-[#46705F] text-white font-bold rounded-lg cursor-pointer"
                >
                  Post Note
                </button>
              </form>
            </div>

            {/* Footer Buttons */}
            <div className="flex justify-between items-center pt-3 border-t border-slate-100 text-xs">
              <div className="flex items-center gap-2">
                <span className="text-slate-500">Change Decision:</span>
                <select
                  value={selectedApp.status}
                  onChange={(e) => handleStatusChange(selectedApp.id, e.target.value as ApplicationStatus)}
                  className="p-1.5 rounded border border-slate-300 font-bold text-slate-800 bg-white"
                >
                  <option value="Submitted">Submitted</option>
                  <option value="Under Review">Under Review</option>
                  <option value="Exam Scheduled">Exam Scheduled</option>
                  <option value="Interviewed">Interviewed</option>
                  <option value="Accepted">Accepted</option>
                  <option value="Waitlisted">Waitlisted</option>
                  <option value="Enrolled">Enrolled</option>
                  <option value="Rejected">Rejected</option>
                </select>
              </div>

              <button
                type="button"
                onClick={() => setSelectedApp(null)}
                className="px-4 py-2 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 font-medium cursor-pointer"
              >
                Close Dossier
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
