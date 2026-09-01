'use client';

import React, { useState } from 'react';
import { usePCM } from '@/lib/store';
import { MediaItem } from '@/lib/types';
import { ConfirmDeleteModal } from '@/components/common/ConfirmDeleteModal';
import {
  Image as ImageIcon,
  Plus,
  Trash2,
  Copy,
  Check,
  Search,
  Upload,
  FolderPlus,
  Tag,
} from 'lucide-react';

export const AdminMediaTab: React.FC = () => {
  const {
    mediaLibrary,
    addMediaItem,
    deleteMediaItem,
    galleryAlbums,
    addGalleryAlbum,
    addToast,
    canPerformAction,
  } = usePCM();

  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<{ id: string; title: string } | null>(null);

  // Upload/Add Media Modal
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [mediaTitle, setMediaTitle] = useState('');
  const [mediaUrl, setMediaUrl] = useState('');
  const [mediaCategory, setMediaCategory] = useState<'Campus' | 'Faculty' | 'Chapel' | 'Events' | 'Archive' | 'Documents'>('Campus');
  const [mediaAlt, setMediaAlt] = useState('');

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      if (typeof event.target?.result === 'string') {
        setMediaUrl(event.target.result);
        if (!mediaTitle) setMediaTitle(file.name.replace(/\.[^/.]+$/, ''));
      }
    };
    reader.readAsDataURL(file);
  };

  const handleSaveMedia = (e: React.FormEvent) => {
    e.preventDefault();
    if (!canPerformAction('Editor')) {
      addToast({
        title: 'Permission Denied',
        message: 'You need at least Editor role to upload assets.',
        type: 'error',
      });
      return;
    }

    if (!mediaTitle.trim() || !mediaUrl.trim()) {
      addToast({ title: 'Missing Information', message: 'Title and Media URL / File are required.', type: 'error' });
      return;
    }

    addMediaItem({
      title: mediaTitle.trim(),
      url: mediaUrl.trim(),
      category: mediaCategory,
      altText: mediaAlt.trim() || mediaTitle.trim(),
      fileSize: '180 KB',
      dimensions: '1600x1067',
    });

    addToast({ title: 'Media Added', message: 'Asset added to the PCM Media Library.', type: 'success' });
    setIsModalOpen(false);
    setMediaTitle('');
    setMediaUrl('');
    setMediaAlt('');
  };

  const handleCopyUrl = (id: string, url: string) => {
    navigator.clipboard.writeText(url);
    setCopiedId(id);
    addToast({ title: 'URL Copied', message: 'Asset URL copied to clipboard.', type: 'info' });
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleDelete = (id: string, title: string) => {
    if (!canPerformAction('Content Admin')) {
      addToast({
        title: 'Permission Denied',
        message: 'You need Content Admin privileges to delete media assets.',
        type: 'error',
      });
      return;
    }

    setDeleteTarget({ id, title });
  };

  const confirmDeleteMedia = () => {
    if (!deleteTarget) return;
    deleteMediaItem(deleteTarget.id);
    addToast({ title: 'Asset Removed', message: `"${deleteTarget.title}" deleted.`, type: 'info' });
    setDeleteTarget(null);
  };

  const filteredMedia = mediaLibrary.filter((m) => {
    const matchesSearch =
      !search ||
      m.title.toLowerCase().includes(search.toLowerCase()) ||
      m.category.toLowerCase().includes(search.toLowerCase());

    const matchesCategory =
      categoryFilter === 'all' || m.category.toLowerCase() === categoryFilter.toLowerCase();

    return matchesSearch && matchesCategory;
  });

  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-6 space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-slate-100 pb-4">
        <div>
          <h2 className="font-serif text-lg font-bold text-[#18392B] flex items-center gap-2">
            <ImageIcon className="w-5 h-5 text-[#588B76]" />
            Media Library & Photographic Asset Manager
          </h2>
          <p className="text-xs text-slate-500">
            Upload, manage, and retrieve photography for hero carousels, faculty portraits, articles, and albums.
          </p>
        </div>

        <button
          onClick={() => setIsModalOpen(true)}
          className="flex items-center gap-2 bg-[#588B76] hover:bg-[#46705F] text-white px-4 py-2.5 rounded-lg text-xs font-bold uppercase tracking-wider transition cursor-pointer shadow-sm"
        >
          <Upload className="w-4 h-4" />
          <span>Upload Asset</span>
        </button>
      </div>

      {/* Search & Category Filter */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            placeholder="Search media by title or category..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-2 text-xs rounded-lg border border-slate-200 focus:border-[#588B76] focus:outline-none"
          />
        </div>

        <div className="flex flex-wrap items-center gap-1.5 text-xs">
          {['all', 'Campus', 'Faculty', 'Chapel', 'Events', 'Archive', 'Documents'].map((cat) => (
            <button
              key={cat}
              onClick={() => setCategoryFilter(cat)}
              className={`px-3 py-1.5 rounded-lg font-medium transition cursor-pointer ${
                categoryFilter === cat
                  ? 'bg-[#18392B] text-white font-bold'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              {cat === 'all' ? 'All Assets' : cat}
            </button>
          ))}
        </div>
      </div>

      {/* Media Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3.5">
        {filteredMedia.map((m) => (
          <div
            key={m.id}
            className="group relative bg-slate-50 rounded-xl border border-slate-200 overflow-hidden shadow-xs hover:border-[#588B76] transition flex flex-col justify-between"
          >
            <div
              className="w-full h-32 bg-cover bg-center border-b border-slate-200 relative"
              style={{ backgroundImage: `url(${m.url})` }}
            >
              <div className="absolute top-1.5 right-1.5 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                <button
                  onClick={() => handleCopyUrl(m.id, m.url)}
                  className="p-1 rounded bg-white/90 hover:bg-white text-slate-700 shadow-xs cursor-pointer"
                  title="Copy URL"
                >
                  {copiedId === m.id ? (
                    <Check className="w-3.5 h-3.5 text-emerald-600" />
                  ) : (
                    <Copy className="w-3.5 h-3.5" />
                  )}
                </button>
                <button
                  onClick={() => handleDelete(m.id, m.title)}
                  className="p-1 rounded bg-red-600 text-white hover:bg-red-700 shadow-xs cursor-pointer"
                  title="Delete Media"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            <div className="p-2.5 space-y-1">
              <div className="flex items-center justify-between text-[10px] text-slate-400">
                <span className="font-mono text-[#588B76] font-bold uppercase">{m.category}</span>
                <span>{m.fileSize || 'Image'}</span>
              </div>
              <h4 className="text-xs font-bold text-[#18392B] truncate" title={m.title}>
                {m.title}
              </h4>
            </div>
          </div>
        ))}
      </div>

      {/* Upload/Add Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 space-y-4 shadow-2xl border border-slate-200">
            <h3 className="font-serif text-base font-bold text-[#18392B]">
              Add Asset to Media Library
            </h3>

            <form onSubmit={handleSaveMedia} className="space-y-4 text-xs">
              {/* File upload or URL */}
              <div>
                <label className="block text-slate-700 font-bold mb-1">
                  Upload Image File from Computer
                </label>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleFileUpload}
                  className="w-full text-xs text-slate-500 file:mr-3 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-[#588B76]/10 file:text-[#588B76] hover:file:bg-[#588B76]/20 cursor-pointer"
                />
              </div>

              <div className="text-center text-[10px] text-slate-400 uppercase font-mono tracking-widest">
                — OR ENTER URL DIRECTLY —
              </div>

              <div>
                <label className="block text-slate-700 font-bold mb-1">
                  Image URL / Link
                </label>
                <input
                  type="text"
                  required
                  value={mediaUrl}
                  onChange={(e) => setMediaUrl(e.target.value)}
                  placeholder="https://images.unsplash.com/..."
                  className="w-full p-2.5 rounded-lg border border-slate-200 focus:border-[#588B76] text-xs focus:outline-none"
                />
              </div>

              {mediaUrl && (
                <div className="w-full h-28 rounded-lg bg-cover bg-center border border-slate-200 shadow-inner" style={{ backgroundImage: `url(${mediaUrl})` }} />
              )}

              <div>
                <label className="block text-slate-700 font-bold mb-1">
                  Asset Title / Caption
                </label>
                <input
                  type="text"
                  required
                  value={mediaTitle}
                  onChange={(e) => setMediaTitle(e.target.value)}
                  placeholder="e.g. Theological Classroom Lecture"
                  className="w-full p-2.5 rounded-lg border border-slate-200 focus:border-[#588B76] text-xs focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 font-bold mb-1">
                    Category
                  </label>
                  <select
                    value={mediaCategory}
                    onChange={(e) => setMediaCategory(e.target.value as any)}
                    className="w-full p-2.5 rounded-lg border border-slate-200 focus:border-[#588B76] text-xs focus:outline-none bg-white"
                  >
                    <option value="Campus">Campus</option>
                    <option value="Faculty">Faculty</option>
                    <option value="Chapel">Chapel</option>
                    <option value="Events">Events</option>
                    <option value="Archive">Archive</option>
                    <option value="Documents">Documents</option>
                  </select>
                </div>

                <div>
                  <label className="block text-slate-700 font-bold mb-1">
                    Alt Text (Accessibility)
                  </label>
                  <input
                    type="text"
                    value={mediaAlt}
                    onChange={(e) => setMediaAlt(e.target.value)}
                    placeholder="Visual description"
                    className="w-full p-2.5 rounded-lg border border-slate-200 focus:border-[#588B76] text-xs focus:outline-none"
                  />
                </div>
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
                  Add to Library
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Confirmation Modal */}
      <ConfirmDeleteModal
        isOpen={!!deleteTarget}
        title="Remove Media Asset"
        itemName={deleteTarget?.title}
        message="Are you sure you want to remove this asset from the media library?"
        confirmLabel="Remove Asset"
        onConfirm={confirmDeleteMedia}
        onCancel={() => setDeleteTarget(null)}
      />
    </div>
  );
};
