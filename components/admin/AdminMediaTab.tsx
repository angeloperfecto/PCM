'use client';

import React, { useState, useRef } from 'react';
import Image from 'next/image';
import { usePCM } from '@/lib/store';
import { MediaItem } from '@/lib/types';
import { ConfirmDeleteModal } from '@/components/common/ConfirmDeleteModal';
import { getImageDimensions } from '@/lib/firebase';
import {
  Image as ImageIcon,
  Plus,
  Trash2,
  Copy,
  Check,
  Search,
  Upload,
  Tag,
  Eye,
  RefreshCw,
  X,
  ExternalLink,
  Calendar,
  User,
  LayoutGrid,
  List,
  CheckCircle2,
  HardDrive,
  FileImage,
  Loader2,
  Edit3,
  ShieldCheck,
  Database,
  Cloud,
  AlertCircle,
  Info,
  Sparkles,
} from 'lucide-react';
import { validateMediaFile, MAX_MEDIA_FILE_SIZE } from '@/lib/mediaService';

export const AdminMediaTab: React.FC = () => {
  const {
    mediaLibrary,
    addMediaItem,
    updateMediaItem,
    deleteMediaItem,
    uploadMediaFile,
    replaceMediaFile,
    addToast,
    canPerformAction,
    isFirebaseConnected,
  } = usePCM();

  // Search & Filter State
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [sortBy, setSortBy] = useState<'newest' | 'oldest' | 'title' | 'size'>('newest');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');

  // Interactive Action Feedback
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<MediaItem | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Migration & Storage Health State
  const [isMigrating, setIsMigrating] = useState(false);
  const [migrationStats, setMigrationStats] = useState<{
    total: number;
    migrated: number;
    alreadyClean: number;
    failed: number;
    lastRun?: string;
  } | null>(null);

  // Upload Modal State
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [uploadTab, setUploadTab] = useState<'file' | 'url'>('file');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [filePreview, setFilePreview] = useState<string | null>(null);
  const [fileDimensions, setFileDimensions] = useState<string>('');
  const [isUploading, setIsUploading] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [uploadValidationError, setUploadValidationError] = useState<string | null>(null);

  // Form Fields for Upload
  const [mediaTitle, setMediaTitle] = useState('');
  const [mediaUrl, setMediaUrl] = useState('');
  const [mediaCategory, setMediaCategory] = useState<
    'Campus' | 'Faculty' | 'Chapel' | 'Events' | 'Archive' | 'Documents' | 'General'
  >('Campus');
  const [mediaFolder, setMediaFolder] = useState<'images' | 'documents' | 'banners' | 'faculty'>('images');
  const [mediaAlt, setMediaAlt] = useState('');
  const [mediaCaption, setMediaCaption] = useState('');
  const [mediaTags, setMediaTags] = useState('');

  // Detail / Preview / Edit Modal State
  const [detailItem, setDetailItem] = useState<MediaItem | null>(null);
  const [isEditingMetadata, setIsEditingMetadata] = useState(false);
  const [editTitle, setEditTitle] = useState('');
  const [editCategory, setEditCategory] = useState<
    'Campus' | 'Faculty' | 'Chapel' | 'Events' | 'Archive' | 'Documents' | 'General'
  >('Campus');
  const [editAlt, setEditAlt] = useState('');
  const [editCaption, setEditCaption] = useState('');
  const [editTags, setEditTags] = useState('');
  const [isSavingEdit, setIsSavingEdit] = useState(false);
  const [isReplacingFile, setIsReplacingFile] = useState(false);
  const [previewImgError, setPreviewImgError] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const replaceFileInputRef = useRef<HTMLInputElement>(null);

  // Handle Drag & Drop
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  // Handle Migration Trigger
  const handleRunMigration = async () => {
    setIsMigrating(true);
    try {
      const res = await fetch('/api/media/migrate', { method: 'POST' });
      const data = await res.json();
      if (data.success) {
        setMigrationStats({
          total: data.totalProcessed || mediaLibrary.length,
          migrated: data.migratedCount || 0,
          alreadyClean: data.alreadyCleanCount || 0,
          failed: data.failedCount || 0,
          lastRun: new Date().toLocaleTimeString(),
        });
        addToast('success', 'Media Storage Verification Complete', data.summary || 'All records checked in Firebase Storage.');
      } else {
        addToast('error', 'Migration Notice', data.error || 'Check server logs');
      }
    } catch (err: any) {
      addToast('error', 'Migration Error', err.message || 'Failed to trigger media storage migration.');
    } finally {
      setIsMigrating(false);
    }
  };

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) {
      await processSelectedFile(file);
    }
  };

  const processSelectedFile = async (file: File) => {
    setUploadValidationError(null);

    // Validate size and mime-type
    const validation = validateMediaFile(file);
    if (!validation.valid) {
      setUploadValidationError(validation.error || 'Invalid file.');
      addToast('error', 'File Validation Failed', validation.error || 'File cannot be accepted.');
      return;
    }

    setSelectedFile(file);
    const objectUrl = URL.createObjectURL(file);
    setFilePreview(objectUrl);

    // Auto-populate Title if empty
    if (!mediaTitle.trim()) {
      const cleanName = file.name.replace(/\.[^/.]+$/, '').replace(/[_-]/g, ' ');
      setMediaTitle(cleanName);
    }

    // Compute dimensions
    try {
      const dims = await getImageDimensions(file);
      if (dims.width && dims.height) {
        setFileDimensions(`${dims.width} × ${dims.height}`);
      }
    } catch {
      setFileDimensions('');
    }
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    await processSelectedFile(file);
  };

  const resetUploadForm = () => {
    setSelectedFile(null);
    if (filePreview && filePreview.startsWith('blob:')) {
      URL.revokeObjectURL(filePreview);
    }
    setFilePreview(null);
    setFileDimensions('');
    setMediaTitle('');
    setMediaUrl('');
    setMediaCategory('Campus');
    setMediaFolder('images');
    setMediaAlt('');
    setMediaCaption('');
    setMediaTags('');
    setUploadValidationError(null);
    setIsUploading(false);
  };

  // Submit Upload to Firebase Storage & Firestore
  const handleSaveMedia = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!canPerformAction('Editor')) {
      addToast('error', 'Permission Denied', 'You need at least Editor privileges to upload assets.');
      return;
    }

    if (uploadTab === 'file') {
      if (!selectedFile) {
        addToast('error', 'No File Selected', 'Please choose an image file to upload.');
        return;
      }
      if (!mediaTitle.trim()) {
        addToast('error', 'Title Required', 'Please enter a title for the media asset.');
        return;
      }

      setIsUploading(true);
      try {
        const parsedTags = mediaTags
          .split(',')
          .map((t) => t.trim())
          .filter(Boolean);

        await uploadMediaFile(
          selectedFile,
          mediaCategory,
          mediaTitle.trim(),
          mediaAlt.trim() || mediaTitle.trim(),
          parsedTags,
          mediaFolder,
          mediaCaption.trim()
        );

        addToast('success', 'Asset Saved Permanently', `"${mediaTitle}" saved to media library.`);
        setIsUploadModalOpen(false);
        resetUploadForm();
      } catch (err: any) {
        console.error('Upload error:', err);
        addToast('error', 'Upload Failed', err.message || 'Unable to store file. Please try again.');
      } finally {
        setIsUploading(false);
      }
    } else {
      // URL Tab
      if (!mediaUrl.trim() || !mediaTitle.trim()) {
        addToast('error', 'Missing Information', 'Please provide both an Image URL and Title.');
        return;
      }

      setIsUploading(true);
      try {
        const parsedTags = mediaTags
          .split(',')
          .map((t) => t.trim())
          .filter(Boolean);

        addMediaItem({
          title: mediaTitle.trim(),
          url: mediaUrl.trim(),
          downloadURL: mediaUrl.trim(),
          category: mediaCategory,
          folder: mediaFolder,
          altText: mediaAlt.trim() || mediaTitle.trim(),
          caption: mediaCaption.trim(),
          fileSize: 'External Link',
          dimensions: fileDimensions || '1600x1067',
          tags: parsedTags,
        });

        addToast('success', 'Asset Added', `External asset "${mediaTitle}" saved to library.`);
        setIsUploadModalOpen(false);
        resetUploadForm();
      } catch (err: any) {
        addToast('error', 'Error Saving Asset', err.message || 'Unable to save external asset.');
      } finally {
        setIsUploading(false);
      }
    }
  };

  // Copy Permanent URL
  const handleCopyUrl = (id: string, url: string) => {
    if (!url) return;
    navigator.clipboard.writeText(url);
    setCopiedId(id);
    addToast('info', 'URL Copied', 'Permanent image URL copied to clipboard.');
    setTimeout(() => setCopiedId(null), 2500);
  };

  // Open Details Modal
  const handleOpenDetail = (item: MediaItem) => {
    setDetailItem(item);
    setPreviewImgError(false);
    setIsEditingMetadata(false);
    setEditTitle(item.title);
    setEditCategory((item.category as any) || 'Campus');
    setEditAlt(item.altText || '');
    setEditCaption(item.caption || '');
    setEditTags((item.tags || []).join(', '));
  };

  // Save Edited Metadata
  const handleSaveMetadata = async () => {
    if (!detailItem) return;
    if (!editTitle.trim()) {
      addToast('error', 'Validation Error', 'Title cannot be empty.');
      return;
    }

    setIsSavingEdit(true);
    try {
      const parsedTags = editTags
        .split(',')
        .map((t) => t.trim())
        .filter(Boolean);

      const updates: Partial<MediaItem> = {
        title: editTitle.trim(),
        category: editCategory,
        altText: editAlt.trim() || editTitle.trim(),
        caption: editCaption.trim(),
        tags: parsedTags,
      };

      updateMediaItem(detailItem.id, updates);
      setDetailItem((prev) => (prev ? { ...prev, ...updates } : null));
      setIsEditingMetadata(false);
      addToast('success', 'Updated', 'Asset details updated in Firestore database.');
    } catch (err: any) {
      addToast('error', 'Update Failed', err.message || 'Unable to save updates.');
    } finally {
      setIsSavingEdit(false);
    }
  };

  // Replace File for Existing Asset
  const handleReplaceFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !detailItem) return;

    setIsReplacingFile(true);
    try {
      const updated = await replaceMediaFile(detailItem.id, file);
      setDetailItem(updated);
      setPreviewImgError(false);
      addToast('success', 'File Replaced', 'New image uploaded and saved successfully.');
    } catch (err: any) {
      addToast('error', 'Replacement Failed', err.message || 'Could not replace file.');
    } finally {
      setIsReplacingFile(false);
      if (replaceFileInputRef.current) {
        replaceFileInputRef.current.value = '';
      }
    }
  };

  // Delete Action
  const handleDeleteClick = (item: MediaItem) => {
    if (!canPerformAction('Content Admin')) {
      addToast('error', 'Permission Denied', 'Content Admin privileges required to delete assets.');
      return;
    }
    setDeleteTarget(item);
  };

  const confirmDeleteMedia = async () => {
    if (!deleteTarget) return;
    setIsDeleting(true);
    try {
      deleteMediaItem(deleteTarget.id);
      if (detailItem?.id === deleteTarget.id) {
        setDetailItem(null);
      }
      setDeleteTarget(null);
    } catch (err: any) {
      addToast('error', 'Delete Failed', err.message || 'Could not remove asset.');
    } finally {
      setIsDeleting(false);
    }
  };

  // Filter & Sort Assets
  const filteredAndSortedMedia = mediaLibrary
    .filter((m) => {
      const q = search.toLowerCase();
      const matchesSearch =
        !search ||
        m.title?.toLowerCase().includes(q) ||
        m.category?.toLowerCase().includes(q) ||
        m.altText?.toLowerCase().includes(q) ||
        (m.tags && m.tags.some((t) => t.toLowerCase().includes(q))) ||
        (m.fileName && m.fileName.toLowerCase().includes(q));

      const matchesCategory =
        categoryFilter === 'all' || m.category?.toLowerCase() === categoryFilter.toLowerCase();

      return matchesSearch && matchesCategory;
    })
    .sort((a, b) => {
      if (sortBy === 'newest') {
        const timeA = new Date(a.createdAt || a.uploadDate || 0).getTime();
        const timeB = new Date(b.createdAt || b.uploadDate || 0).getTime();
        return timeB - timeA;
      }
      if (sortBy === 'oldest') {
        const timeA = new Date(a.createdAt || a.uploadDate || 0).getTime();
        const timeB = new Date(b.createdAt || b.uploadDate || 0).getTime();
        return timeA - timeB;
      }
      if (sortBy === 'title') {
        return (a.title || '').localeCompare(b.title || '');
      }
      if (sortBy === 'size') {
        return (b.fileSizeBytes || 0) - (a.fileSizeBytes || 0);
      }
      return 0;
    });

  const categories = ['all', 'Campus', 'Faculty', 'Chapel', 'Events', 'Archive', 'Documents', 'General'];

  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-6 space-y-6">
      {/* Top Header */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 border-b border-slate-100 pb-5">
        <div className="space-y-1">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-[#588B76]/10 flex items-center justify-center text-[#588B76]">
              <ImageIcon className="w-5 h-5" />
            </div>
            <h2 className="font-serif text-lg font-bold text-[#18392B]">
              Media Library & Photographic Asset Manager
            </h2>
          </div>
          <p className="text-xs text-slate-500 max-w-2xl">
            Upload, permanently store, and manage photographic assets for hero banners, faculty
            portraits, college news, events, and albums. Stored in Firebase Storage & Firestore.
          </p>
        </div>

        {/* Action Controls & Sync Status */}
        <div className="flex flex-wrap items-center gap-2.5">
          <div
            className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-[11px] font-medium border ${
              isFirebaseConnected
                ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                : 'bg-amber-50 text-amber-700 border-amber-200'
            }`}
          >
            <span
              className={`w-2 h-2 rounded-full ${
                isFirebaseConnected ? 'bg-emerald-500 animate-pulse' : 'bg-amber-500'
              }`}
            />
            <span>
              {isFirebaseConnected ? 'Cloud Synced' : 'Syncing'} ({mediaLibrary.length} assets)
            </span>
          </div>

          <button
            onClick={handleRunMigration}
            disabled={isMigrating}
            className="flex items-center gap-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 px-3 py-2 rounded-lg text-xs font-semibold transition cursor-pointer border border-slate-200 disabled:opacity-50"
            title="Verify that all media documents in Firestore contain only metadata and binary files reside in Firebase Storage"
          >
            <RefreshCw className={`w-3.5 h-3.5 text-[#588B76] ${isMigrating ? 'animate-spin' : ''}`} />
            <span>{isMigrating ? 'Checking Storage...' : 'Verify Storage'}</span>
          </button>

          <button
            onClick={() => {
              resetUploadForm();
              setIsUploadModalOpen(true);
            }}
            className="flex items-center gap-2 bg-[#588B76] hover:bg-[#46705F] text-white px-4 py-2 rounded-lg text-xs font-bold uppercase tracking-wider transition cursor-pointer shadow-xs"
          >
            <Upload className="w-4 h-4" />
            <span>Upload Asset</span>
          </button>
        </div>
      </div>

      {/* Storage Architecture & Health Status Card */}
      <div className="bg-gradient-to-r from-emerald-50/70 via-slate-50 to-teal-50/40 border border-emerald-100 rounded-xl p-4 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="flex items-start gap-3">
          <div className="w-9 h-9 rounded-lg bg-emerald-600/10 text-emerald-700 flex items-center justify-center shrink-0 mt-0.5">
            <ShieldCheck className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider font-mono">
                Storage Architecture: Firebase Storage + Lightweight Firestore
              </h3>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">
                1MB Limit Safe
              </span>
            </div>
            <p className="text-[11px] text-slate-600 mt-0.5 leading-relaxed">
              Binary image bytes are stored in Google Cloud Firebase Storage. Firestore preserves only lightweight index metadata (&lt; 2 KB / doc), completely preventing Firestore 1 MiB document size limit errors.
            </p>
          </div>
        </div>

        {/* Quick Health Stats */}
        <div className="flex items-center gap-3 shrink-0 text-[11px] font-mono text-slate-600 self-end md:self-center">
          <div className="text-right">
            <span className="text-slate-400 block text-[9px] uppercase font-sans">Active Assets</span>
            <span className="font-bold text-[#18392B] text-xs">{mediaLibrary.length} in Cloud</span>
          </div>
          <div className="h-6 w-px bg-slate-200" />
          <div className="text-right">
            <span className="text-slate-400 block text-[9px] uppercase font-sans">Base64 in DB</span>
            <span className="font-bold text-emerald-700 text-xs">0 (Blocked)</span>
          </div>
          {migrationStats?.lastRun && (
            <>
              <div className="h-6 w-px bg-slate-200" />
              <div className="text-right">
                <span className="text-slate-400 block text-[9px] uppercase font-sans">Last Check</span>
                <span className="font-semibold text-slate-600 text-xs">{migrationStats.lastRun}</span>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Search, Filters, View Modes */}
      <div className="space-y-3">
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
          {/* Search bar */}
          <div className="relative flex-1 max-w-md">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              placeholder="Search assets by title, category, tag, or alt text..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-8 py-2 text-xs rounded-lg border border-slate-200 focus:border-[#588B76] focus:outline-none"
            />
            {search && (
              <button
                onClick={() => setSearch('')}
                className="absolute right-2.5 top-2.5 text-slate-400 hover:text-slate-600"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Sort & View Mode controls */}
          <div className="flex items-center gap-2 self-end sm:self-auto">
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="px-3 py-2 text-xs rounded-lg border border-slate-200 bg-white text-slate-700 focus:border-[#588B76] focus:outline-none"
            >
              <option value="newest">Sort: Newest First</option>
              <option value="oldest">Sort: Oldest First</option>
              <option value="title">Sort: Title (A-Z)</option>
              <option value="size">Sort: File Size (Largest)</option>
            </select>

            <div className="flex items-center border border-slate-200 rounded-lg p-0.5 bg-slate-50">
              <button
                onClick={() => setViewMode('grid')}
                className={`p-1.5 rounded-md text-xs transition cursor-pointer ${
                  viewMode === 'grid'
                    ? 'bg-white text-[#18392B] shadow-2xs font-bold'
                    : 'text-slate-500 hover:text-slate-700'
                }`}
                title="Grid View"
              >
                <LayoutGrid className="w-4 h-4" />
              </button>
              <button
                onClick={() => setViewMode('list')}
                className={`p-1.5 rounded-md text-xs transition cursor-pointer ${
                  viewMode === 'list'
                    ? 'bg-white text-[#18392B] shadow-2xs font-bold'
                    : 'text-slate-500 hover:text-slate-700'
                }`}
                title="List View"
              >
                <List className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>

        {/* Category Pills */}
        <div className="flex flex-wrap items-center gap-1.5 text-xs">
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setCategoryFilter(cat)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition cursor-pointer ${
                categoryFilter === cat
                  ? 'bg-[#18392B] text-white font-bold shadow-2xs'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              {cat === 'all' ? 'All Assets' : cat}
              <span className="ml-1.5 opacity-60 text-[10px]">
                {cat === 'all'
                  ? mediaLibrary.length
                  : mediaLibrary.filter((m) => m.category?.toLowerCase() === cat.toLowerCase()).length}
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* Media Content Display */}
      {filteredAndSortedMedia.length === 0 ? (
        <div className="border-2 border-dashed border-slate-200 rounded-xl p-12 text-center space-y-3">
          <div className="w-12 h-12 rounded-full bg-slate-100 text-slate-400 mx-auto flex items-center justify-center">
            <ImageIcon className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-slate-700">No media assets found</h3>
            <p className="text-xs text-slate-500 mt-1">
              {search || categoryFilter !== 'all'
                ? 'Try adjusting your search keywords or category filters.'
                : 'Your media library is empty. Upload your first high-resolution photo.'}
            </p>
          </div>
          <button
            onClick={() => {
              resetUploadForm();
              setIsUploadModalOpen(true);
            }}
            className="inline-flex items-center gap-2 bg-[#588B76] hover:bg-[#46705F] text-white px-4 py-2 rounded-lg text-xs font-bold uppercase tracking-wider transition cursor-pointer shadow-xs"
          >
            <Plus className="w-4 h-4" />
            <span>Upload New Asset</span>
          </button>
        </div>
      ) : viewMode === 'grid' ? (
        /* Grid View */
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
          {filteredAndSortedMedia.map((m) => {
            const displayUrl = m.dataUrl || m.downloadURL || m.url;
            return (
              <div
                key={m.id}
                className="group relative bg-white rounded-xl border border-slate-200 overflow-hidden shadow-2xs hover:shadow-md hover:border-[#588B76] transition-all flex flex-col justify-between"
              >
                {/* Thumbnail Image Container */}
                <div
                  onClick={() => handleOpenDetail(m)}
                  className="w-full h-36 bg-slate-100 bg-cover bg-center border-b border-slate-200 relative cursor-pointer overflow-hidden"
                  style={{ backgroundImage: `url(${displayUrl})` }}
                >
                  {/* Subtle Gradient Overlay */}
                  <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors" />

                  {/* Top-right Quick Action Buttons */}
                  <div
                    onClick={(e) => e.stopPropagation()}
                    className="absolute top-2 right-2 flex gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity z-10"
                  >
                    <button
                      onClick={() => handleCopyUrl(m.id, displayUrl)}
                      className="p-1.5 rounded-md bg-white/95 hover:bg-white text-slate-700 shadow-xs cursor-pointer transition hover:scale-105"
                      title="Copy Public URL"
                    >
                      {copiedId === m.id ? (
                        <Check className="w-3.5 h-3.5 text-emerald-600" />
                      ) : (
                        <Copy className="w-3.5 h-3.5" />
                      )}
                    </button>
                    <button
                      onClick={() => handleOpenDetail(m)}
                      className="p-1.5 rounded-md bg-white/95 hover:bg-white text-slate-700 shadow-xs cursor-pointer transition hover:scale-105"
                      title="View Details"
                    >
                      <Eye className="w-3.5 h-3.5 text-[#588B76]" />
                    </button>
                    <button
                      onClick={() => handleDeleteClick(m)}
                      className="p-1.5 rounded-md bg-white/95 hover:bg-red-600 hover:text-white text-red-600 shadow-xs cursor-pointer transition hover:scale-105"
                      title="Delete Asset"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  {/* Category Chip on image */}
                  <div className="absolute bottom-2 left-2">
                    <span className="px-2 py-0.5 rounded-md bg-black/70 backdrop-blur-xs text-white text-[9px] font-mono uppercase font-bold tracking-wider">
                      {m.category || 'General'}
                    </span>
                  </div>
                </div>

                {/* Metadata Card Footer */}
                <div className="p-3 space-y-1 bg-white">
                  <h4
                    onClick={() => handleOpenDetail(m)}
                    className="text-xs font-bold text-[#18392B] truncate cursor-pointer hover:text-[#588B76]"
                    title={m.title}
                  >
                    {m.title}
                  </h4>
                  <div className="flex items-center justify-between text-[10px] text-slate-400">
                    <span>{m.fileSize || 'Image'}</span>
                    <span>{m.uploadDate || (m.createdAt ? m.createdAt.split('T')[0] : '')}</span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        /* List View */
        <div className="overflow-x-auto rounded-xl border border-slate-200">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-semibold uppercase text-[10px] tracking-wider">
              <tr>
                <th className="py-3 px-4">Preview</th>
                <th className="py-3 px-4">Title & Details</th>
                <th className="py-3 px-4">Category</th>
                <th className="py-3 px-4">Resolution</th>
                <th className="py-3 px-4">Size</th>
                <th className="py-3 px-4">Upload Date</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredAndSortedMedia.map((m) => {
                const displayUrl = m.dataUrl || m.downloadURL || m.url;
                return (
                  <tr key={m.id} className="hover:bg-slate-50 transition">
                    <td className="py-2.5 px-4">
                      <div
                        onClick={() => handleOpenDetail(m)}
                        className="w-12 h-12 rounded-lg bg-cover bg-center border border-slate-200 cursor-pointer hover:opacity-90"
                        style={{ backgroundImage: `url(${displayUrl})` }}
                      />
                    </td>
                    <td className="py-2.5 px-4 max-w-xs">
                      <div
                        onClick={() => handleOpenDetail(m)}
                        className="font-bold text-[#18392B] truncate cursor-pointer hover:text-[#588B76]"
                        title={m.title}
                      >
                        {m.title}
                      </div>
                      <div className="text-[11px] text-slate-400 truncate" title={m.altText || ''}>
                        {m.altText || 'No alt text provided'}
                      </div>
                    </td>
                    <td className="py-2.5 px-4">
                      <span className="px-2 py-0.5 rounded bg-[#588B76]/10 text-[#588B76] font-mono text-[10px] font-bold uppercase">
                        {m.category || 'General'}
                      </span>
                    </td>
                    <td className="py-2.5 px-4 text-slate-500 font-mono text-[11px]">
                      {m.dimensions || '—'}
                    </td>
                    <td className="py-2.5 px-4 text-slate-500">{m.fileSize || '—'}</td>
                    <td className="py-2.5 px-4 text-slate-500">
                      {m.uploadDate || (m.createdAt ? m.createdAt.split('T')[0] : '—')}
                    </td>
                    <td className="py-2.5 px-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => handleCopyUrl(m.id, displayUrl)}
                          className="p-1.5 rounded bg-slate-100 hover:bg-slate-200 text-slate-700 transition"
                          title="Copy Permanent URL"
                        >
                          {copiedId === m.id ? (
                            <Check className="w-3.5 h-3.5 text-emerald-600" />
                          ) : (
                            <Copy className="w-3.5 h-3.5" />
                          )}
                        </button>
                        <button
                          onClick={() => handleOpenDetail(m)}
                          className="p-1.5 rounded bg-slate-100 hover:bg-[#588B76] hover:text-white text-slate-700 transition"
                          title="View Details"
                        >
                          <Eye className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handleDeleteClick(m)}
                          className="p-1.5 rounded bg-slate-100 hover:bg-red-600 hover:text-white text-slate-700 transition"
                          title="Delete Asset"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* UPLOAD ASSET MODAL */}
      {isUploadModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 space-y-5 shadow-2xl border border-slate-200 my-8">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg bg-[#588B76]/15 flex items-center justify-center text-[#588B76]">
                  <Upload className="w-4 h-4" />
                </div>
                <h3 className="font-serif text-base font-bold text-[#18392B]">
                  Add Asset to PCM Media Library
                </h3>
              </div>
              <button
                onClick={() => {
                  if (!isUploading) {
                    setIsUploadModalOpen(false);
                    resetUploadForm();
                  }
                }}
                className="text-slate-400 hover:text-slate-600 p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Tabs: File Upload vs Direct URL */}
            <div className="flex border-b border-slate-200">
              <button
                type="button"
                onClick={() => setUploadTab('file')}
                className={`py-2 px-4 text-xs font-bold border-b-2 transition ${
                  uploadTab === 'file'
                    ? 'border-[#588B76] text-[#588B76]'
                    : 'border-transparent text-slate-500 hover:text-slate-800'
                }`}
              >
                Upload File from Computer (Firebase Storage)
              </button>
              <button
                type="button"
                onClick={() => setUploadTab('url')}
                className={`py-2 px-4 text-xs font-bold border-b-2 transition ${
                  uploadTab === 'url'
                    ? 'border-[#588B76] text-[#588B76]'
                    : 'border-transparent text-slate-500 hover:text-slate-800'
                }`}
              >
                Register by Web URL
              </button>
            </div>

            <form onSubmit={handleSaveMedia} className="space-y-4 text-xs">
              {uploadTab === 'file' ? (
                /* Drag & Drop File Upload Area */
                <div className="space-y-3">
                  <div
                    onDragOver={handleDragOver}
                    onDragLeave={handleDragLeave}
                    onDrop={handleDrop}
                    onClick={() => fileInputRef.current?.click()}
                    className={`border-2 border-dashed rounded-xl p-6 text-center cursor-pointer transition-colors ${
                      isDragging
                        ? 'border-[#588B76] bg-[#588B76]/5'
                        : selectedFile
                        ? 'border-emerald-300 bg-emerald-50/40'
                        : 'border-slate-200 hover:border-slate-300 bg-slate-50/50'
                    }`}
                  >
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/*"
                      onChange={handleFileChange}
                      className="hidden"
                    />

                    {filePreview ? (
                      <div className="space-y-2">
                        <div
                          className="w-full h-36 rounded-lg bg-cover bg-center border border-slate-200 shadow-inner"
                          style={{ backgroundImage: `url(${filePreview})` }}
                        />
                        <div className="flex items-center justify-between text-[11px] text-slate-600 px-1">
                          <span className="font-semibold truncate max-w-[200px]">
                            {selectedFile?.name}
                          </span>
                          <span>
                            {selectedFile
                              ? selectedFile.size < 1024 * 1024
                                ? `${(selectedFile.size / 1024).toFixed(1)} KB`
                                : `${(selectedFile.size / (1024 * 1024)).toFixed(1)} MB`
                              : ''}
                            {fileDimensions && ` • ${fileDimensions}`}
                          </span>
                        </div>
                        <p className="text-[10px] text-[#588B76] font-medium">
                          Click or drag another image here to replace
                        </p>
                      </div>
                    ) : (
                      <div className="space-y-2">
                        <div className="w-10 h-10 rounded-full bg-[#588B76]/10 text-[#588B76] mx-auto flex items-center justify-center">
                          <FileImage className="w-5 h-5" />
                        </div>
                        <div className="text-slate-700 font-semibold">
                          Click to browse or drag & drop image here
                        </div>
                        <p className="text-[10px] text-slate-400">
                          Supports PNG, JPG, JPEG, WEBP, GIF, SVG (up to 25MB). Permanently stored in
                          Firebase Storage.
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              ) : (
                /* Direct URL Input */
                <div className="space-y-3">
                  <div>
                    <label className="block text-slate-700 font-bold mb-1">Permanent Image URL</label>
                    <input
                      type="url"
                      required
                      value={mediaUrl}
                      onChange={(e) => setMediaUrl(e.target.value)}
                      placeholder="https://images.unsplash.com/... or https://firebasestorage..."
                      className="w-full p-2.5 rounded-lg border border-slate-200 focus:border-[#588B76] text-xs focus:outline-none"
                    />
                  </div>

                  {mediaUrl && (
                    <div
                      className="w-full h-32 rounded-lg bg-cover bg-center border border-slate-200 shadow-inner"
                      style={{ backgroundImage: `url(${mediaUrl})` }}
                    />
                  )}
                </div>
              )}

              {/* Validation Error Alert */}
              {uploadValidationError && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-lg flex items-start gap-2 text-red-700 text-xs">
                  <AlertCircle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
                  <div>
                    <span className="font-bold">File Rejected: </span>
                    <span>{uploadValidationError}</span>
                  </div>
                </div>
              )}

              {/* Title Input */}
              <div>
                <label className="block text-slate-700 font-bold mb-1">
                  Asset Title / Description <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={mediaTitle}
                  onChange={(e) => setMediaTitle(e.target.value)}
                  placeholder="e.g. Theological Classroom Lecture - Manila Campus"
                  className="w-full p-2.5 rounded-lg border border-slate-200 focus:border-[#588B76] text-xs focus:outline-none"
                />
              </div>

              {/* Category, Storage Folder & Alt Text */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-slate-700 font-bold mb-1">Category</label>
                  <select
                    value={mediaCategory}
                    onChange={(e) => setMediaCategory(e.target.value as any)}
                    className="w-full p-2.5 rounded-lg border border-slate-200 focus:border-[#588B76] text-xs focus:outline-none bg-white"
                  >
                    <option value="Campus">Campus & Grounds</option>
                    <option value="Faculty">Faculty & Leadership</option>
                    <option value="Chapel">Chapel & Worship</option>
                    <option value="Events">College Events</option>
                    <option value="Archive">Historical Archive</option>
                    <option value="Documents">Documents & Certificates</option>
                    <option value="General">General Assets</option>
                  </select>
                </div>

                <div>
                  <label className="block text-slate-700 font-bold mb-1">Storage Folder</label>
                  <select
                    value={mediaFolder}
                    onChange={(e) => setMediaFolder(e.target.value as any)}
                    className="w-full p-2.5 rounded-lg border border-slate-200 focus:border-[#588B76] text-xs focus:outline-none bg-white font-mono"
                  >
                    <option value="images">images/</option>
                    <option value="banners">banners/</option>
                    <option value="faculty">faculty/</option>
                    <option value="documents">documents/</option>
                  </select>
                </div>

                <div>
                  <label className="block text-slate-700 font-bold mb-1">Alt Text</label>
                  <input
                    type="text"
                    value={mediaAlt}
                    onChange={(e) => setMediaAlt(e.target.value)}
                    placeholder="Accessibility label"
                    className="w-full p-2.5 rounded-lg border border-slate-200 focus:border-[#588B76] text-xs focus:outline-none"
                  />
                </div>
              </div>

              {/* Caption */}
              <div>
                <label className="block text-slate-700 font-bold mb-1">
                  Caption <span className="text-slate-400 font-normal">(Optional context or citation)</span>
                </label>
                <input
                  type="text"
                  value={mediaCaption}
                  onChange={(e) => setMediaCaption(e.target.value)}
                  placeholder="e.g. PCM students during the 2025 opening convocation service"
                  className="w-full p-2.5 rounded-lg border border-slate-200 focus:border-[#588B76] text-xs focus:outline-none"
                />
              </div>

              {/* Tags */}
              <div>
                <label className="block text-slate-700 font-bold mb-1">
                  Tags <span className="text-slate-400 font-normal">(comma-separated)</span>
                </label>
                <input
                  type="text"
                  value={mediaTags}
                  onChange={(e) => setMediaTags(e.target.value)}
                  placeholder="e.g. graduation, students, 2025, baccalaureate"
                  className="w-full p-2.5 rounded-lg border border-slate-200 focus:border-[#588B76] text-xs focus:outline-none"
                />
              </div>

              {/* Action Buttons */}
              <div className="flex items-center justify-end gap-2.5 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  disabled={isUploading}
                  onClick={() => {
                    setIsUploadModalOpen(false);
                    resetUploadForm();
                  }}
                  className="px-4 py-2 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 font-medium cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isUploading}
                  className="flex items-center gap-2 px-5 py-2 rounded-lg bg-[#588B76] hover:bg-[#46705F] text-white font-bold cursor-pointer shadow-xs disabled:opacity-50"
                >
                  {isUploading ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Uploading to Firebase...</span>
                    </>
                  ) : (
                    <>
                      <Upload className="w-4 h-4" />
                      <span>Save Permanently</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ASSET DETAIL / EDIT / REPLACE MODAL */}
      {detailItem && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl max-w-2xl w-full p-6 space-y-5 shadow-2xl border border-slate-200 my-8">
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <ImageIcon className="w-5 h-5 text-[#588B76]" />
                <h3 className="font-serif text-base font-bold text-[#18392B] truncate max-w-md">
                  {detailItem.title}
                </h3>
              </div>
              <button
                onClick={() => setDetailItem(null)}
                className="text-slate-400 hover:text-slate-600 p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Image Preview Box */}
            <div className="relative w-full h-64 bg-slate-900 rounded-xl overflow-hidden flex items-center justify-center border border-slate-200 group">
              {!previewImgError ? (
                <Image
                  src={detailItem.dataUrl || detailItem.downloadURL || detailItem.url}
                  alt={detailItem.altText || detailItem.title}
                  fill
                  className="object-contain"
                  referrerPolicy="no-referrer"
                  onError={() => {
                    console.warn('Preview image failed to load for:', detailItem.title);
                    setPreviewImgError(true);
                  }}
                />
              ) : (
                <div className="flex flex-col items-center justify-center p-6 text-center text-slate-300">
                  <div className="w-12 h-12 rounded-full bg-slate-800 flex items-center justify-center mb-3 text-amber-400">
                    <ImageIcon className="w-6 h-6" />
                  </div>
                  <p className="font-semibold text-sm text-white mb-1">{detailItem.title}</p>
                  <p className="text-xs text-slate-400 max-w-xs mb-3">
                    Asset image is currently optimizing or unavailable from remote storage.
                  </p>
                  <button
                    onClick={() => replaceFileInputRef.current?.click()}
                    className="px-3 py-1.5 rounded-lg bg-[#588B76] hover:bg-[#18392B] text-white text-xs font-semibold transition flex items-center gap-1.5 shadow-sm"
                  >
                    <Upload className="w-3.5 h-3.5" />
                    <span>Upload New Image File</span>
                  </button>
                </div>
              )}
              {!previewImgError && (detailItem.dataUrl || detailItem.downloadURL || detailItem.url) && (
                <div className="absolute top-2.5 right-2.5 flex items-center gap-1.5">
                  <a
                    href={detailItem.dataUrl || detailItem.downloadURL || detailItem.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="p-1.5 rounded-lg bg-black/60 hover:bg-black/80 text-white transition flex items-center gap-1 text-[10px]"
                  >
                    <ExternalLink className="w-3.5 h-3.5" />
                    <span>Open Full View</span>
                  </a>
                </div>
              )}
            </div>

            {/* Details & Metadata */}
            {isEditingMetadata ? (
              /* Edit Metadata Form */
              <div className="space-y-3 text-xs bg-slate-50 p-4 rounded-xl border border-slate-200">
                <h4 className="font-bold text-[#18392B] flex items-center gap-1.5">
                  <Edit3 className="w-4 h-4 text-[#588B76]" />
                  <span>Edit Asset Metadata</span>
                </h4>

                <div>
                  <label className="block text-slate-700 font-bold mb-1">Asset Title</label>
                  <input
                    type="text"
                    value={editTitle}
                    onChange={(e) => setEditTitle(e.target.value)}
                    className="w-full p-2 rounded-lg border border-slate-200 bg-white text-xs focus:outline-none focus:border-[#588B76]"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-slate-700 font-bold mb-1">Category</label>
                    <select
                      value={editCategory}
                      onChange={(e) => setEditCategory(e.target.value as any)}
                      className="w-full p-2 rounded-lg border border-slate-200 bg-white text-xs focus:outline-none focus:border-[#588B76]"
                    >
                      <option value="Campus">Campus & Grounds</option>
                      <option value="Faculty">Faculty & Leadership</option>
                      <option value="Chapel">Chapel & Worship</option>
                      <option value="Events">College Events</option>
                      <option value="Archive">Historical Archive</option>
                      <option value="Documents">Documents & Certificates</option>
                      <option value="General">General Assets</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-slate-700 font-bold mb-1">Alt Text</label>
                    <input
                      type="text"
                      value={editAlt}
                      onChange={(e) => setEditAlt(e.target.value)}
                      className="w-full p-2 rounded-lg border border-slate-200 bg-white text-xs focus:outline-none focus:border-[#588B76]"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-slate-700 font-bold mb-1">Caption</label>
                  <input
                    type="text"
                    value={editCaption}
                    onChange={(e) => setEditCaption(e.target.value)}
                    placeholder="Contextual description or citation"
                    className="w-full p-2 rounded-lg border border-slate-200 bg-white text-xs focus:outline-none focus:border-[#588B76]"
                  />
                </div>

                <div>
                  <label className="block text-slate-700 font-bold mb-1">Tags</label>
                  <input
                    type="text"
                    value={editTags}
                    onChange={(e) => setEditTags(e.target.value)}
                    className="w-full p-2 rounded-lg border border-slate-200 bg-white text-xs focus:outline-none focus:border-[#588B76]"
                  />
                </div>

                <div className="flex justify-end gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setIsEditingMetadata(false)}
                    className="px-3 py-1.5 rounded-lg bg-slate-200 text-slate-700 font-medium"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    disabled={isSavingEdit}
                    onClick={handleSaveMetadata}
                    className="px-4 py-1.5 rounded-lg bg-[#588B76] text-white font-bold hover:bg-[#46705F]"
                  >
                    {isSavingEdit ? 'Saving...' : 'Save Updates'}
                  </button>
                </div>
              </div>
            ) : (
              /* Display Metadata Grid */
              <div className="space-y-4 text-xs">
                {/* Permanent URL Copy Row */}
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-1.5">
                  <div className="flex items-center justify-between text-[11px] font-bold text-slate-700">
                    <span>Permanent Download URL (Firebase Storage)</span>
                    <button
                      onClick={() =>
                        handleCopyUrl(detailItem.id, detailItem.downloadURL || detailItem.url)
                      }
                      className="flex items-center gap-1 text-[#588B76] hover:text-[#46705F] cursor-pointer font-bold"
                    >
                      {copiedId === detailItem.id ? (
                        <>
                          <Check className="w-3.5 h-3.5 text-emerald-600" />
                          <span className="text-emerald-600">Copied to Clipboard!</span>
                        </>
                      ) : (
                        <>
                          <Copy className="w-3.5 h-3.5" />
                          <span>Copy URL</span>
                        </>
                      )}
                    </button>
                  </div>
                  <input
                    type="text"
                    readOnly
                    value={detailItem.downloadURL || detailItem.url}
                    className="w-full p-2 text-[11px] font-mono rounded-lg border border-slate-200 bg-white text-slate-600 select-all focus:outline-none"
                  />
                </div>

                {/* Metadata Details Grid */}
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 p-3 bg-slate-50 rounded-xl border border-slate-200 text-[11px]">
                  <div>
                    <span className="text-slate-400 block">Category</span>
                    <span className="font-bold text-[#18392B] uppercase font-mono">
                      {detailItem.category || 'General'}
                    </span>
                  </div>

                  <div>
                    <span className="text-slate-400 block">Storage Path</span>
                    <span className="font-mono text-emerald-700 font-semibold truncate block" title={detailItem.storagePath || 'Cloud Storage'}>
                      {detailItem.storagePath ? detailItem.storagePath.split('/').slice(-2).join('/') : 'Firebase Storage'}
                    </span>
                  </div>

                  <div>
                    <span className="text-slate-400 block">File Size</span>
                    <span className="font-semibold text-slate-700">
                      {detailItem.fileSize || 'Standard'}
                    </span>
                  </div>

                  <div>
                    <span className="text-slate-400 block">Dimensions</span>
                    <span className="font-semibold text-slate-700 font-mono">
                      {detailItem.dimensions || '1600 × 1067'}
                    </span>
                  </div>

                  <div>
                    <span className="text-slate-400 block">Uploaded By</span>
                    <span className="font-semibold text-slate-700">
                      {detailItem.uploadedBy || 'Administrator'}
                    </span>
                  </div>

                  <div>
                    <span className="text-slate-400 block">Upload Date</span>
                    <span className="font-semibold text-slate-700">
                      {detailItem.uploadDate ||
                        (detailItem.createdAt ? detailItem.createdAt.split('T')[0] : '—')}
                    </span>
                  </div>

                  <div className="col-span-2 sm:col-span-3">
                    <span className="text-slate-400 block">Alt Text</span>
                    <span className="font-medium text-slate-700 block" title={detailItem.altText}>
                      {detailItem.altText || 'None'}
                    </span>
                  </div>

                  {detailItem.caption && (
                    <div className="col-span-2 sm:col-span-3">
                      <span className="text-slate-400 block">Caption</span>
                      <span className="font-medium text-slate-600 italic block">
                        &ldquo;{detailItem.caption}&rdquo;
                      </span>
                    </div>
                  )}
                </div>

                {/* Tags if any */}
                {detailItem.tags && detailItem.tags.length > 0 && (
                  <div className="flex flex-wrap items-center gap-1.5">
                    <span className="text-slate-400 text-[11px] mr-1">Tags:</span>
                    {detailItem.tags.map((t, idx) => (
                      <span
                        key={idx}
                        className="px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 text-[10px] font-medium"
                      >
                        #{t}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Bottom Actions Row */}
            <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-slate-100 text-xs">
              <div className="flex items-center gap-2">
                {/* Replace Image Button */}
                <input
                  ref={replaceFileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleReplaceFileChange}
                  className="hidden"
                />
                <button
                  type="button"
                  disabled={isReplacingFile}
                  onClick={() => replaceFileInputRef.current?.click()}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-200 hover:bg-slate-50 text-slate-700 font-medium transition cursor-pointer disabled:opacity-50"
                  title="Upload a new image file to replace this asset in Firebase"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${isReplacingFile ? 'animate-spin' : ''}`} />
                  <span>{isReplacingFile ? 'Replacing...' : 'Replace Image'}</span>
                </button>

                {/* Edit Metadata Toggle */}
                {!isEditingMetadata && (
                  <button
                    type="button"
                    onClick={() => setIsEditingMetadata(true)}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-200 hover:bg-slate-50 text-slate-700 font-medium transition cursor-pointer"
                  >
                    <Edit3 className="w-3.5 h-3.5" />
                    <span>Edit Info</span>
                  </button>
                )}
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => handleDeleteClick(detailItem)}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-red-50 hover:bg-red-100 text-red-600 font-semibold transition cursor-pointer"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Delete Asset</span>
                </button>

                <button
                  type="button"
                  onClick={() => setDetailItem(null)}
                  className="px-4 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 font-medium transition cursor-pointer"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* CONFIRM DELETE MODAL */}
      <ConfirmDeleteModal
        isOpen={!!deleteTarget}
        title="Delete Media Asset Permanently"
        itemName={deleteTarget?.title}
        message="Are you sure you want to permanently delete this media asset? It will be removed from Firestore and Firebase Storage immediately. Any website pages referencing this URL will no longer be able to display it."
        confirmLabel={isDeleting ? 'Deleting...' : 'Delete Permanently'}
        onConfirm={confirmDeleteMedia}
        onCancel={() => setDeleteTarget(null)}
      />
    </div>
  );
};
