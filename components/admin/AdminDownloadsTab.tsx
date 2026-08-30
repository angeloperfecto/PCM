'use client';

import React, { useState } from 'react';
import { usePCM } from '@/lib/store';
import { DownloadResource } from '@/lib/types';
import {
  Download,
  Plus,
  Trash2,
  Edit2,
  FileText,
  Search,
  CheckCircle2,
} from 'lucide-react';

export const AdminDownloadsTab: React.FC = () => {
  const {
    downloads,
    addDownloadResource,
    deleteDownloadResource,
    addToast,
    canPerformAction,
  } = usePCM();

  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formTitle, setFormTitle] = useState('');
  const [formCategory, setFormCategory] = useState<'Admissions' | 'Academic' | 'Theology' | 'Institutional' | 'Forms'>('Admissions');
  const [formType, setFormType] = useState('PDF');
  const [formSize, setFormSize] = useState('2.4 MB');
  const [formUrl, setFormUrl] = useState('#');
  const [formDesc, setFormDesc] = useState('');

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!canPerformAction('Editor')) {
      addToast({
        title: 'Permission Denied',
        message: 'You need Editor role to upload resources.',
        type: 'error',
      });
      return;
    }

    if (!formTitle.trim()) {
      addToast({ title: 'Missing Title', message: 'Resource title is required.', type: 'error' });
      return;
    }

    addDownloadResource({
      title: formTitle.trim(),
      category: formCategory,
      fileType: formType.trim(),
      fileSize: formSize.trim(),
      url: formUrl.trim() || '#',
      description: formDesc.trim(),
      year: '2026',
    });

    addToast({ title: 'Resource Added', message: `${formTitle} is now available for download.`, type: 'success' });
    setIsModalOpen(false);
    setFormTitle('');
    setFormDesc('');
  };

  const handleDelete = (id: string, title: string) => {
    if (!canPerformAction('Content Admin')) {
      addToast({
        title: 'Permission Denied',
        message: 'You need Content Admin privileges to delete download files.',
        type: 'error',
      });
      return;
    }

    if (confirm(`Are you sure you want to delete "${title}"?`)) {
      deleteDownloadResource(id);
      addToast({ title: 'Resource Deleted', message: 'File has been removed from download center.', type: 'info' });
    }
  };

  const filteredDownloads = downloads.filter((d) => {
    const matchesSearch =
      !search ||
      d.title.toLowerCase().includes(search.toLowerCase()) ||
      d.description.toLowerCase().includes(search.toLowerCase());

    const matchesCategory =
      categoryFilter === 'all' || d.category?.toLowerCase() === categoryFilter.toLowerCase();

    return matchesSearch && matchesCategory;
  });

  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-6 space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-slate-100 pb-4">
        <div>
          <h2 className="font-serif text-lg font-bold text-[#18392B] flex items-center gap-2">
            <Download className="w-5 h-5 text-[#588B76]" />
            Download Center & Theological Resources Manager
          </h2>
          <p className="text-xs text-slate-500">
            Publish academic prospectuses, application PDF forms, pastoral handbooks, and journal volumes.
          </p>
        </div>

        <button
          onClick={() => setIsModalOpen(true)}
          className="flex items-center gap-2 bg-[#588B76] hover:bg-[#46705F] text-white px-4 py-2.5 rounded-lg text-xs font-bold uppercase tracking-wider transition cursor-pointer shadow-sm"
        >
          <Plus className="w-4 h-4" />
          <span>Add Downloadable Document</span>
        </button>
      </div>

      {/* Search & Category Filter */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            placeholder="Search downloads by title or description..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-2 text-xs rounded-lg border border-slate-200 focus:border-[#588B76] focus:outline-none"
          />
        </div>

        <div className="flex flex-wrap items-center gap-1.5 text-xs">
          {['all', 'Admissions', 'Academic', 'Theology', 'Institutional', 'Forms'].map((cat) => (
            <button
              key={cat}
              onClick={() => setCategoryFilter(cat)}
              className={`px-3 py-1.5 rounded-lg font-medium transition cursor-pointer ${
                categoryFilter === cat
                  ? 'bg-[#18392B] text-white font-bold'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              {cat === 'all' ? 'All Categories' : cat}
            </button>
          ))}
        </div>
      </div>

      {/* Downloads List */}
      <div className="divide-y divide-slate-100 border border-slate-200 rounded-xl overflow-hidden bg-white">
        {filteredDownloads.map((d) => (
          <div
            key={d.id}
            className="p-4 flex items-center justify-between gap-4 transition hover:bg-slate-50"
          >
            <div className="flex items-start gap-3 flex-1">
              <div className="w-10 h-10 rounded-lg bg-[#588B76]/10 text-[#588B76] flex items-center justify-center shrink-0 font-mono text-xs font-bold">
                {d.fileType}
              </div>
              <div className="space-y-0.5">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-[10px] font-mono font-bold uppercase text-[#588B76] bg-[#588B76]/10 px-2 py-0.2 rounded">
                    {d.category}
                  </span>
                  <span className="text-[10px] text-slate-400 font-mono">{d.fileSize}</span>
                  <span className="text-[10px] text-slate-400">Year {d.year}</span>
                </div>
                <h4 className="font-bold text-xs text-[#18392B]">{d.title}</h4>
                <p className="text-xs text-slate-500 line-clamp-1">{d.description}</p>
              </div>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              <button
                onClick={() => handleDelete(d.id, d.title)}
                className="p-1.5 rounded bg-red-50 hover:bg-red-100 text-red-600 cursor-pointer"
                title="Delete Resource"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Add Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 space-y-4 shadow-2xl border border-slate-200">
            <h3 className="font-serif text-base font-bold text-[#18392B]">
              Add Download Resource
            </h3>

            <form onSubmit={handleSave} className="space-y-4 text-xs">
              <div>
                <label className="block text-slate-700 font-bold mb-1">
                  Document Title
                </label>
                <input
                  type="text"
                  required
                  value={formTitle}
                  onChange={(e) => setFormTitle(e.target.value)}
                  placeholder="e.g. PCM Official Academic Catalog AY 2026–2027"
                  className="w-full p-2.5 rounded-lg border border-slate-200 focus:border-[#588B76] text-xs focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 font-bold mb-1">
                    Category
                  </label>
                  <select
                    value={formCategory}
                    onChange={(e) => setFormCategory(e.target.value as any)}
                    className="w-full p-2.5 rounded-lg border border-slate-200 focus:border-[#588B76] text-xs focus:outline-none bg-white"
                  >
                    <option value="Admissions">Admissions</option>
                    <option value="Academic">Academic</option>
                    <option value="Theology">Theology & Journal</option>
                    <option value="Institutional">Institutional</option>
                    <option value="Forms">Student Forms</option>
                  </select>
                </div>

                <div>
                  <label className="block text-slate-700 font-bold mb-1">
                    File Type
                  </label>
                  <input
                    type="text"
                    value={formType}
                    onChange={(e) => setFormType(e.target.value)}
                    placeholder="PDF, DOCX, ZIP"
                    className="w-full p-2.5 rounded-lg border border-slate-200 focus:border-[#588B76] text-xs focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 font-bold mb-1">
                    File Size
                  </label>
                  <input
                    type="text"
                    value={formSize}
                    onChange={(e) => setFormSize(e.target.value)}
                    placeholder="e.g. 2.4 MB"
                    className="w-full p-2.5 rounded-lg border border-slate-200 focus:border-[#588B76] text-xs focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-slate-700 font-bold mb-1">
                    Download URL / Path
                  </label>
                  <input
                    type="text"
                    value={formUrl}
                    onChange={(e) => setFormUrl(e.target.value)}
                    placeholder="/downloads/prospectus.pdf"
                    className="w-full p-2.5 rounded-lg border border-slate-200 focus:border-[#588B76] text-xs focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-700 font-bold mb-1">
                  Brief Description
                </label>
                <textarea
                  rows={2}
                  value={formDesc}
                  onChange={(e) => setFormDesc(e.target.value)}
                  placeholder="Official prospectus containing course descriptions and graduation requirements..."
                  className="w-full p-2.5 rounded-lg border border-slate-200 focus:border-[#588B76] text-xs focus:outline-none"
                />
              </div>

              <div className="flex justify-end gap-2 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 font-medium cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-lg bg-[#588B76] hover:bg-[#46705F] text-white font-bold cursor-pointer shadow-sm"
                >
                  Save Document
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
