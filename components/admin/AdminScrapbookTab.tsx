'use client';

import React, { useState, useMemo } from 'react';
import Image from 'next/image';
import { usePCM } from '@/lib/store';
import { ScrapbookItem, ContentStatus } from '@/lib/types';
import {
  Camera,
  Plus,
  Search,
  Filter,
  Edit2,
  Trash2,
  ExternalLink,
  Calendar,
  MapPin,
  Tag,
  Eye,
  CheckCircle2,
  Clock,
  Sparkles,
  BookOpen,
  Image as ImageIcon,
  ChevronRight,
  Layers,
  Archive,
} from 'lucide-react';
import { ConfirmDeleteModal } from '@/components/common/ConfirmDeleteModal';

const SCRAPBOOK_CATEGORIES = [
  'Campus Life & Lamtang',
  'Chapel & Worship',
  'Missions & Outreach',
  'Graduation & Convocation',
  'Retreats & Fellowship',
  'Heritage & Pioneers',
] as const;

export const AdminScrapbookTab: React.FC = () => {
  const {
    scrapbook,
    addScrapbookItem,
    updateScrapbookItem,
    deleteScrapbookItem,
    navigateTo,
    addToast,
    canPerformAction,
  } = usePCM();

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [selectedStatus, setSelectedStatus] = useState<string>('All');

  // Modal states
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<ScrapbookItem | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<ScrapbookItem | null>(null);

  // Form fields
  const [formTitle, setFormTitle] = useState('');
  const [formCategory, setFormCategory] = useState<ScrapbookItem['category']>('Heritage & Pioneers');
  const [formImageUrl, setFormImageUrl] = useState('');
  const [formDate, setFormDate] = useState('');
  const [formYear, setFormYear] = useState('');
  const [formLocation, setFormLocation] = useState('');
  const [formCaption, setFormCaption] = useState('');
  const [formTags, setFormTags] = useState('');
  const [formStatus, setFormStatus] = useState<ContentStatus>('Published');

  const filteredItems = useMemo(() => {
    return scrapbook.filter((item) => {
      const q = searchQuery.toLowerCase().trim();
      const matchQuery =
        !q ||
        item.title.toLowerCase().includes(q) ||
        item.caption.toLowerCase().includes(q) ||
        item.location.toLowerCase().includes(q) ||
        item.year.toLowerCase().includes(q) ||
        item.tags.some((t) => t.toLowerCase().includes(q));

      const matchCategory =
        selectedCategory === 'All' || item.category === selectedCategory;

      const matchStatus =
        selectedStatus === 'All' ||
        (item.status ? item.status === selectedStatus : selectedStatus === 'Published');

      return matchQuery && matchCategory && matchStatus;
    });
  }, [scrapbook, searchQuery, selectedCategory, selectedStatus]);

  const handleOpenAdd = () => {
    setEditingItem(null);
    setFormTitle('');
    setFormCategory('Campus Life & Lamtang');
    setFormImageUrl('https://images.unsplash.com/photo-1523240795612-9a054b0db644?q=80&w=800&auto=format&fit=crop');
    setFormDate(new Date().toLocaleDateString('en-US', { month: 'long', year: 'numeric' }));
    setFormYear(new Date().getFullYear().toString());
    setFormLocation('Lamtang, Puguis, La Trinidad, Benguet');
    setFormCaption('');
    setFormTags('Heritage, Campus Life, Lamtang');
    setFormStatus('Published');
    setIsModalOpen(true);
  };

  const handleOpenEdit = (item: ScrapbookItem) => {
    setEditingItem(item);
    setFormTitle(item.title);
    setFormCategory(item.category);
    setFormImageUrl(item.imageUrl);
    setFormDate(item.date);
    setFormYear(item.year);
    setFormLocation(item.location);
    setFormCaption(item.caption);
    setFormTags((item.tags || []).join(', '));
    setFormStatus(item.status || 'Published');
    setIsModalOpen(true);
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!canPerformAction('Content Admin')) {
      addToast('error', 'Permission Denied', 'Content Admin permissions are required to modify the heritage archive.');
      return;
    }

    if (!formTitle.trim()) {
      addToast('error', 'Validation Error', 'Title is required for the scrapbook record.');
      return;
    }

    if (!formImageUrl.trim()) {
      addToast('error', 'Validation Error', 'A valid image URL is required.');
      return;
    }

    const tagsArray = formTags
      .split(',')
      .map((t) => t.trim())
      .filter((t) => t.length > 0);

    if (editingItem) {
      updateScrapbookItem(editingItem.id, {
        title: formTitle.trim(),
        category: formCategory,
        imageUrl: formImageUrl.trim(),
        date: formDate.trim() || formYear.trim(),
        year: formYear.trim() || new Date().getFullYear().toString(),
        location: formLocation.trim() || 'Lamtang, Benguet',
        caption: formCaption.trim(),
        tags: tagsArray,
        status: formStatus,
      });
    } else {
      addScrapbookItem({
        title: formTitle.trim(),
        category: formCategory,
        imageUrl: formImageUrl.trim(),
        date: formDate.trim() || formYear.trim(),
        year: formYear.trim() || new Date().getFullYear().toString(),
        location: formLocation.trim() || 'Lamtang, Benguet',
        caption: formCaption.trim(),
        tags: tagsArray,
        status: formStatus,
      });
    }

    setIsModalOpen(false);
  };

  const confirmDelete = () => {
    if (!deleteTarget) return;
    deleteScrapbookItem(deleteTarget.id);
    setDeleteTarget(null);
  };

  return (
    <div className="space-y-6 font-sans">
      {/* Header Bar */}
      <div className="bg-white border border-slate-200 rounded-sm p-4 sm:p-5 flex flex-wrap items-center justify-between gap-4 shadow-xs">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-1.5 bg-[#18392B]/10 text-[#18392B] rounded-xs">
              <Camera className="w-5 h-5 text-[#588B76]" />
            </span>
            <h2 className="font-serif text-lg sm:text-xl font-bold text-[#18392B]">
              Historical Scrapbook & Heritage Archive
            </h2>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Curate photographs, pioneer milestones, campus relocations, and sacred moments spanning PCM’s 34-year legacy.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => navigateTo('about', 'scrapbook')}
            className="px-3 py-1.5 border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-semibold rounded-sm transition flex items-center gap-1.5 cursor-pointer"
          >
            <ExternalLink className="w-3.5 h-3.5 text-[#588B76]" />
            <span>Public View</span>
          </button>
          <button
            type="button"
            onClick={handleOpenAdd}
            className="bg-[#588B76] hover:bg-[#46705F] text-white px-4 py-1.5 text-xs font-bold rounded-sm transition flex items-center gap-1.5 cursor-pointer shadow-xs"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Add Heritage Entry</span>
          </button>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white border border-slate-200 rounded-sm p-4 space-y-3">
        <div className="flex flex-col sm:flex-row items-center gap-3">
          <div className="relative flex-1 w-full">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by title, location, milestone year, caption, or tags..."
              className="w-full text-xs pl-9 pr-3 py-2 border border-slate-200 rounded-sm focus:border-[#588B76] focus:outline-hidden"
            />
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto">
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="text-xs border border-slate-200 rounded-sm px-3 py-2 bg-white text-slate-700 focus:border-[#588B76] focus:outline-hidden"
            >
              <option value="All">All Statuses</option>
              <option value="Published">Published</option>
              <option value="Draft">Draft</option>
              <option value="Archived">Archived</option>
            </select>

            <span className="text-xs text-slate-500 whitespace-nowrap px-2 font-mono">
              {filteredItems.length} {filteredItems.length === 1 ? 'item' : 'items'}
            </span>
          </div>
        </div>

        {/* Category Filter Pills */}
        <div className="flex flex-wrap gap-1.5 pt-1 border-t border-slate-100">
          <button
            type="button"
            onClick={() => setSelectedCategory('All')}
            className={`text-xs px-3 py-1 rounded-xs font-medium transition cursor-pointer ${
              selectedCategory === 'All'
                ? 'bg-[#18392B] text-white font-bold'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            All Categories ({scrapbook.length})
          </button>
          {SCRAPBOOK_CATEGORIES.map((cat) => {
            const count = scrapbook.filter((s) => s.category === cat).length;
            const isSelected = selectedCategory === cat;
            return (
              <button
                key={cat}
                type="button"
                onClick={() => setSelectedCategory(cat)}
                className={`text-xs px-3 py-1 rounded-xs transition cursor-pointer flex items-center gap-1.5 ${
                  isSelected
                    ? 'bg-[#18392B] text-white font-bold'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                <span>{cat}</span>
                <span className={`text-[10px] font-mono px-1 rounded-full ${isSelected ? 'bg-white/20 text-white' : 'bg-slate-200 text-slate-600'}`}>
                  {count}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Grid of Scrapbook Cards */}
      {filteredItems.length === 0 ? (
        <div className="bg-white border border-slate-200 rounded-sm p-12 text-center space-y-3">
          <Camera className="w-10 h-10 text-slate-300 mx-auto" />
          <h3 className="font-serif text-base font-bold text-slate-700">No Scrapbook Entries Found</h3>
          <p className="text-xs text-slate-500 max-w-sm mx-auto">
            {searchQuery || selectedCategory !== 'All'
              ? 'Try clearing search terms or selecting a different category.'
              : 'Add historical milestones, photos, and pioneer narratives to build the institutional archive.'}
          </p>
          <button
            type="button"
            onClick={handleOpenAdd}
            className="inline-flex items-center gap-1.5 px-4 py-2 bg-[#588B76] text-white text-xs font-bold rounded-sm hover:bg-[#46705F] transition cursor-pointer shadow-xs"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Create First Entry</span>
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredItems.map((item) => (
            <div
              key={item.id}
              className="bg-white border border-slate-200 rounded-sm overflow-hidden hover:border-[#588B76] hover:shadow-xs transition group flex flex-col justify-between"
            >
              <div>
                {/* Photo Thumbnail */}
                <div className="h-48 w-full relative bg-slate-100 overflow-hidden">
                  {item.imageUrl ? (
                    <Image
                      src={item.imageUrl}
                      alt={item.title}
                      fill
                      className="object-cover group-hover:scale-102 transition-transform duration-300"
                      referrerPolicy="no-referrer"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-slate-300">
                      <ImageIcon className="w-8 h-8" />
                    </div>
                  )}

                  {/* Badges Overlay */}
                  <div className="absolute top-2 left-2 flex flex-col gap-1">
                    <span className="text-[10px] font-mono uppercase font-bold px-2 py-0.5 rounded-xs bg-slate-900/80 text-white backdrop-blur-xs">
                      {item.category}
                    </span>
                  </div>

                  <div className="absolute top-2 right-2 flex items-center gap-1">
                    <span
                      className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded-xs backdrop-blur-xs ${
                        item.status === 'Draft'
                          ? 'bg-amber-600/90 text-white'
                          : item.status === 'Archived'
                          ? 'bg-slate-600/90 text-white'
                          : 'bg-emerald-700/90 text-white'
                      }`}
                    >
                      {item.status || 'Published'}
                    </span>
                  </div>

                  {/* Year Tag */}
                  <div className="absolute bottom-2 right-2">
                    <span className="text-[11px] font-mono font-bold px-2 py-0.5 rounded-xs bg-[#18392B]/90 text-white backdrop-blur-xs flex items-center gap-1">
                      <Calendar className="w-3 h-3 text-[#588B76]" />
                      <span>{item.year}</span>
                    </span>
                  </div>
                </div>

                {/* Details */}
                <div className="p-4 space-y-2">
                  <div className="flex items-center gap-1.5 text-[11px] text-slate-500">
                    <MapPin className="w-3 h-3 text-[#588B76] shrink-0" />
                    <span className="truncate">{item.location}</span>
                    <span className="text-slate-300">•</span>
                    <span>{item.date}</span>
                  </div>

                  <h3 className="font-serif font-bold text-sm text-[#18392B] group-hover:text-[#588B76] transition line-clamp-1">
                    {item.title}
                  </h3>

                  <p className="text-xs text-slate-600 leading-relaxed font-light line-clamp-3">
                    {item.caption}
                  </p>

                  {item.tags && item.tags.length > 0 && (
                    <div className="flex flex-wrap gap-1 pt-1">
                      {item.tags.map((t, idx) => (
                        <span
                          key={idx}
                          className="bg-slate-100 text-slate-600 px-1.5 py-0.2 rounded-xs text-[10px] font-mono"
                        >
                          #{t}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* Action Buttons */}
              <div className="px-4 py-3 border-t border-slate-100 bg-slate-50/50 flex items-center justify-between">
                <span className="text-[10px] font-mono text-slate-400">ID: {item.id}</span>
                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    onClick={() => handleOpenEdit(item)}
                    className="p-1.5 text-slate-600 hover:text-[#18392B] hover:bg-white rounded-xs border border-transparent hover:border-slate-200 transition cursor-pointer"
                    title="Edit entry"
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                  </button>
                  <button
                    type="button"
                    onClick={() => setDeleteTarget(item)}
                    className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-xs transition cursor-pointer"
                    title="Delete entry"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add / Edit Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <div className="bg-white border border-slate-200 rounded-sm max-w-xl w-full p-6 space-y-4 shadow-xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="font-serif font-bold text-base text-[#18392B]">
                {editingItem ? 'Edit Historical Archive Entry' : 'Add New Historical Scrapbook Entry'}
              </h3>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 cursor-pointer text-lg font-bold"
              >
                ×
              </button>
            </div>

            <form onSubmit={handleSave} className="space-y-3.5 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Entry Title *</label>
                <input
                  type="text"
                  required
                  value={formTitle}
                  onChange={(e) => setFormTitle(e.target.value)}
                  className="w-full p-2.5 border border-slate-200 rounded-sm font-serif focus:border-[#588B76] focus:outline-hidden"
                  placeholder="e.g. 1992 Founding Inaugural Convocation on T. Alonzo St."
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Archive Category *</label>
                  <select
                    value={formCategory}
                    onChange={(e) => setFormCategory(e.target.value as any)}
                    className="w-full p-2 border border-slate-200 rounded-sm focus:border-[#588B76] focus:outline-hidden"
                  >
                    {SCRAPBOOK_CATEGORIES.map((cat) => (
                      <option key={cat} value={cat}>
                        {cat}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Publish Status</label>
                  <select
                    value={formStatus}
                    onChange={(e) => setFormStatus(e.target.value as ContentStatus)}
                    className="w-full p-2 border border-slate-200 rounded-sm focus:border-[#588B76] focus:outline-hidden"
                  >
                    <option value="Published">Published (Visible to all)</option>
                    <option value="Draft">Draft (Hidden)</option>
                    <option value="Archived">Archived</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Milestone Year (4-digit) *</label>
                  <input
                    type="text"
                    required
                    value={formYear}
                    onChange={(e) => setFormYear(e.target.value)}
                    className="w-full p-2 border border-slate-200 rounded-sm font-mono focus:border-[#588B76] focus:outline-hidden"
                    placeholder="e.g. 1992, 1998, 2012, 2026"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Specific Date (Display Text)</label>
                  <input
                    type="text"
                    value={formDate}
                    onChange={(e) => setFormDate(e.target.value)}
                    className="w-full p-2 border border-slate-200 rounded-sm focus:border-[#588B76] focus:outline-hidden"
                    placeholder="e.g. June 1992, October 24, 2025"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Historical Location</label>
                <input
                  type="text"
                  value={formLocation}
                  onChange={(e) => setFormLocation(e.target.value)}
                  className="w-full p-2 border border-slate-200 rounded-sm focus:border-[#588B76] focus:outline-hidden"
                  placeholder="e.g. Lamtang, Puguis, La Trinidad, Benguet"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Photograph URL *</label>
                <input
                  type="url"
                  required
                  value={formImageUrl}
                  onChange={(e) => setFormImageUrl(e.target.value)}
                  className="w-full p-2 border border-slate-200 rounded-sm focus:border-[#588B76] focus:outline-hidden"
                  placeholder="https://images.unsplash.com/... or /images/..."
                />
                {formImageUrl && (
                  <div className="mt-2 h-24 w-full relative rounded-sm overflow-hidden border border-slate-200 bg-slate-50">
                    <Image
                      src={formImageUrl}
                      alt="Preview"
                      fill
                      className="object-cover"
                      referrerPolicy="no-referrer"
                    />
                  </div>
                )}
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Narrative Caption & Heritage Story</label>
                <textarea
                  rows={3}
                  value={formCaption}
                  onChange={(e) => setFormCaption(e.target.value)}
                  className="w-full p-2 border border-slate-200 rounded-sm leading-relaxed focus:border-[#588B76] focus:outline-hidden"
                  placeholder="Describe the people, occasion, spiritual significance, or historical context of this record..."
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Search Tags (Comma-separated)</label>
                <input
                  type="text"
                  value={formTags}
                  onChange={(e) => setFormTags(e.target.value)}
                  className="w-full p-2 border border-slate-200 rounded-sm focus:border-[#588B76] focus:outline-hidden"
                  placeholder="e.g. Founders, Lamtang Ridge, Pioneers, Chapel Dedication"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 border border-slate-200 text-slate-600 rounded-sm hover:bg-slate-50 transition cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-[#588B76] hover:bg-[#46705F] text-white font-bold rounded-sm transition cursor-pointer shadow-xs"
                >
                  {editingItem ? 'Save Milestone' : 'Add to Archive'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      <ConfirmDeleteModal
        isOpen={Boolean(deleteTarget)}
        title="Remove Historical Entry"
        itemName={deleteTarget?.title || 'Historical Milestone'}
        message="Are you sure you want to remove this entry from the institutional heritage archive? This action cannot be undone."
        confirmLabel="Delete Milestone"
        onConfirm={confirmDelete}
        onCancel={() => setDeleteTarget(null)}
      />
    </div>
  );
};
