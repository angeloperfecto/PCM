'use client';

import React, { useState } from 'react';
import { usePCM } from '@/lib/store';
import { Announcement } from '@/lib/types';
import { ConfirmDeleteModal } from '@/components/common/ConfirmDeleteModal';
import {
  Megaphone,
  Plus,
  Trash2,
  CheckCircle2,
  XCircle,
  Eye,
  EyeOff,
  Calendar,
} from 'lucide-react';

export const AdminAnnouncementsTab: React.FC = () => {
  const {
    announcements,
    addAnnouncement,
    toggleAnnouncement,
    deleteAnnouncement,
    addToast,
    canPerformAction,
  } = usePCM();

  const [newTitle, setNewTitle] = useState('');
  const [newCategory, setNewCategory] = useState<'Admissions' | 'Academic' | 'Chapel' | 'Conference' | 'General'>('Admissions');
  const [deleteTarget, setDeleteTarget] = useState<Announcement | null>(null);

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!canPerformAction('Editor')) {
      addToast({
        title: 'Permission Denied',
        message: 'You need Editor role to post announcements.',
        type: 'error',
      });
      return;
    }

    if (!newTitle.trim()) return;

    addAnnouncement({
      title: newTitle.trim(),
      category: newCategory,
      date: new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
      active: true,
    });

    setNewTitle('');
    addToast({
      title: 'Announcement Posted',
      message: 'Notice is now active on the public ticker.',
      type: 'success',
    });
  };

  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-6 space-y-6">
      <div className="border-b border-slate-100 pb-4">
        <h2 className="font-serif text-lg font-bold text-[#18392B] flex items-center gap-2">
          <Megaphone className="w-5 h-5 text-[#588B76]" />
          Urgent Notices & Live Announcement Ticker Manager
        </h2>
        <p className="text-xs text-slate-500">
          Manage real-time bulletins displayed on the top marquee and homepage notification banner.
        </p>
      </div>

      {/* Quick Add Form */}
      <form
        onSubmit={handleCreate}
        className="bg-slate-50 p-4 rounded-xl border border-slate-200 flex flex-col sm:flex-row gap-3 items-stretch sm:items-end text-xs"
      >
        <div className="flex-1">
          <label className="block font-bold text-slate-700 mb-1">
            Announcement Text / Title
          </label>
          <input
            type="text"
            required
            value={newTitle}
            onChange={(e) => setNewTitle(e.target.value)}
            placeholder="e.g. Entrance Examination and Interview Schedule for AY 2026–2027"
            className="w-full p-2.5 rounded-lg border border-slate-200 bg-white focus:border-[#588B76] text-xs focus:outline-none"
          />
        </div>

        <div className="w-full sm:w-48">
          <label className="block font-bold text-slate-700 mb-1">
            Category
          </label>
          <select
            value={newCategory}
            onChange={(e) => setNewCategory(e.target.value as any)}
            className="w-full p-2.5 rounded-lg border border-slate-200 bg-white focus:border-[#588B76] text-xs focus:outline-none"
          >
            <option value="Admissions">Admissions</option>
            <option value="Academic">Academic</option>
            <option value="Chapel">Chapel & Spiritual</option>
            <option value="Conference">Conference</option>
            <option value="General">General Notice</option>
          </select>
        </div>

        <button
          type="submit"
          className="bg-[#588B76] hover:bg-[#46705F] text-white px-5 py-2.5 rounded-lg font-bold uppercase tracking-wider transition cursor-pointer shrink-0 shadow-xs"
        >
          Post Notice
        </button>
      </form>

      {/* Announcements List */}
      <div className="divide-y divide-slate-100 border border-slate-200 rounded-xl overflow-hidden bg-white">
        {announcements.map((ann) => (
          <div
            key={ann.id}
            className={`p-4 flex items-center justify-between gap-4 transition hover:bg-slate-50 ${
              !ann.active ? 'opacity-50 bg-slate-50' : ''
            }`}
          >
            <div className="space-y-1">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-[10px] font-mono uppercase font-bold text-[#588B76] bg-[#588B76]/10 px-2 py-0.5 rounded">
                  {ann.category}
                </span>
                <span className="text-[11px] text-slate-400 flex items-center gap-1">
                  <Calendar className="w-3 h-3" />
                  {ann.date}
                </span>
                {ann.active ? (
                  <span className="text-[10px] bg-emerald-100 text-emerald-800 font-semibold px-2 py-0.2 rounded">
                    Active on Ticker
                  </span>
                ) : (
                  <span className="text-[10px] bg-slate-200 text-slate-600 px-2 py-0.2 rounded">
                    Hidden / Inactive
                  </span>
                )}
              </div>
              <h4 className="font-medium text-xs text-[#18392B]">{ann.title}</h4>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              <button
                onClick={() => toggleAnnouncement(ann.id)}
                className={`p-1.5 rounded text-xs font-medium cursor-pointer ${
                  ann.active
                    ? 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
                title={ann.active ? 'Hide from public ticker' : 'Show on public ticker'}
              >
                {ann.active ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
              </button>

              <button
                onClick={() => {
                  if (!canPerformAction('Editor')) {
                    addToast({
                      title: 'Permission Denied',
                      message: 'You need Editor privileges to delete announcements.',
                      type: 'error',
                    });
                    return;
                  }
                  setDeleteTarget(ann);
                }}
                className="p-1.5 rounded bg-red-50 hover:bg-red-100 text-red-600 cursor-pointer"
                title="Delete Announcement"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Confirmation Modal */}
      <ConfirmDeleteModal
        isOpen={!!deleteTarget}
        title="Delete Announcement"
        itemName={deleteTarget?.title}
        message="Are you sure you want to remove this announcement from the campus bulletin and notification banner?"
        confirmLabel="Delete Announcement"
        onConfirm={() => {
          if (deleteTarget) {
            deleteAnnouncement(deleteTarget.id);
            addToast({
              title: 'Announcement Removed',
              message: `"${deleteTarget.title}" has been deleted.`,
              type: 'info',
            });
            setDeleteTarget(null);
          }
        }}
        onCancel={() => setDeleteTarget(null)}
      />
    </div>
  );
};
