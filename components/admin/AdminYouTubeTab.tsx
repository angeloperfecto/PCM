'use client';

import React, { useState, useMemo, useEffect } from 'react';
import { usePCM } from '@/lib/store';
import { YouTubeVideo, HomepageVideoConfig } from '@/lib/types';
import {
  extractYouTubeVideoId,
  getYouTubeThumbnailUrl,
  getYouTubeEmbedUrl,
  isValidYouTubeId,
  VIDEO_CATEGORIES,
} from '@/lib/youtube';
import { ConfirmDeleteModal } from '@/components/common/ConfirmDeleteModal';
import {
  Tv,
  Plus,
  Edit2,
  Trash2,
  Sparkles,
  Eye,
  EyeOff,
  Search,
  ExternalLink,
  SlidersHorizontal,
  Save,
  CheckCircle2,
  XCircle,
  Play,
  ArrowUp,
  ArrowDown,
  RefreshCw,
  LayoutGrid,
  Layers,
  Info,
  X,
} from 'lucide-react';

export const AdminYouTubeTab: React.FC = () => {
  const {
    videos,
    homepageVideoConfig,
    featuredVideo,
    addYouTubeVideo,
    updateYouTubeVideo,
    deleteYouTubeVideo,
    togglePublishYouTubeVideo,
    setFeaturedYouTubeVideo,
    reorderYouTubeVideos,
    updateHomepageVideoConfig,
    syncVideosToFirebase,
    addToast,
    canPerformAction,
    firebaseSyncStatus,
    lastSyncedAt,
  } = usePCM();

  // Navigation Sub-Tabs
  const [subTab, setSubTab] = useState<'videos' | 'homepage-settings'>('videos');

  // Search & Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('All');
  const [statusFilter, setStatusFilter] = useState<'all' | 'published' | 'unpublished' | 'featured' | 'home'>('all');

  // Modals state
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingVideo, setEditingVideo] = useState<YouTubeVideo | null>(null);
  const [previewVideo, setPreviewVideo] = useState<YouTubeVideo | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<YouTubeVideo | null>(null);

  // Add / Edit Form State
  const [formTitle, setFormTitle] = useState('');
  const [formUrlOrId, setFormUrlOrId] = useState('');
  const [formDescription, setFormDescription] = useState('');
  const [formCategory, setFormCategory] = useState<string>(VIDEO_CATEGORIES[0]);
  const [formDisplayOrder, setFormDisplayOrder] = useState<number>(1);
  const [formIsFeatured, setFormIsFeatured] = useState<boolean>(false);
  const [formIsPublished, setFormIsPublished] = useState<boolean>(true);
  const [formShowOnHome, setFormShowOnHome] = useState<boolean>(true);

  // Derived extracted video ID from form input
  const extractedFormVideoId = useMemo(() => {
    return extractYouTubeVideoId(formUrlOrId) || '';
  }, [formUrlOrId]);

  // Homepage Config Form State
  const [configEnabled, setConfigEnabled] = useState<boolean>(homepageVideoConfig.enabled);
  const [configTitle, setConfigTitle] = useState<string>(homepageVideoConfig.sectionTitle);
  const [configSubtitle, setConfigSubtitle] = useState<string>(homepageVideoConfig.sectionSubtitle);
  const [configFeaturedId, setConfigFeaturedId] = useState<string>(homepageVideoConfig.featuredVideoId || '');
  const [configMaxCount, setConfigMaxCount] = useState<number>(homepageVideoConfig.maxDisplayCount || 6);
  const [configLayout, setConfigLayout] = useState<'featured-playlist' | 'grid'>(
    homepageVideoConfig.layoutStyle || 'featured-playlist'
  );
  const [isSavingConfig, setIsSavingConfig] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);

  // Filtered list of videos
  const filteredVideos = useMemo(() => {
    const q = (searchQuery || '').toLowerCase().trim();
    return videos
      .filter((v) => {
        const matchesSearch =
          !q ||
          (v.title && v.title.toLowerCase().includes(q)) ||
          (v.youtubeVideoId && v.youtubeVideoId.toLowerCase().includes(q)) ||
          (v.description && v.description.toLowerCase().includes(q));

        const matchesCat = categoryFilter === 'All' || v.category === categoryFilter;

        let matchesStatus = true;
        if (statusFilter === 'published') matchesStatus = v.isPublished;
        if (statusFilter === 'unpublished') matchesStatus = !v.isPublished;
        if (statusFilter === 'featured') matchesStatus = v.isFeatured;
        if (statusFilter === 'home') matchesStatus = v.showOnHome;

        return matchesSearch && matchesCat && matchesStatus;
      })
      .sort((a, b) => (a.displayOrder ?? 999) - (b.displayOrder ?? 999));
  }, [videos, searchQuery, categoryFilter, statusFilter]);

  // Open Edit Modal
  const handleOpenEdit = (video: YouTubeVideo) => {
    setEditingVideo(video);
    setFormTitle(video.title);
    setFormUrlOrId(video.youtubeUrl || video.youtubeVideoId);
    setFormDescription(video.description || '');
    setFormCategory(video.category || VIDEO_CATEGORIES[0]);
    setFormDisplayOrder(video.displayOrder ?? 1);
    setFormIsFeatured(video.isFeatured);
    setFormIsPublished(video.isPublished);
    setFormShowOnHome(video.showOnHome);
  };

  // Open Add Modal
  const handleOpenAdd = () => {
    setEditingVideo(null);
    setFormTitle('');
    setFormUrlOrId('');
    setFormDescription('');
    setFormCategory(VIDEO_CATEGORIES[0]);
    setFormDisplayOrder(videos.length + 1);
    setFormIsFeatured(false);
    setFormIsPublished(true);
    setFormShowOnHome(true);
    setIsAddModalOpen(true);
  };

  // Handle Form Submit (Add or Edit)
  const handleSaveVideo = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!canPerformAction('Editor')) {
      addToast('error', 'Permission Denied', 'You need Editor or Admin permissions to manage videos.');
      return;
    }

    if (!formTitle.trim()) {
      addToast('error', 'Validation Error', 'Please enter a video title.');
      return;
    }

    const videoId = extractedFormVideoId;
    if (!videoId || !isValidYouTubeId(videoId)) {
      addToast(
        'error',
        'Invalid YouTube URL / ID',
        'Please enter a valid YouTube URL (e.g., https://www.youtube.com/watch?v=...) or an 11-character Video ID.'
      );
      return;
    }

    const standardUrl = formUrlOrId.startsWith('http')
      ? formUrlOrId.trim()
      : `https://www.youtube.com/watch?v=${videoId}`;

    const thumb = getYouTubeThumbnailUrl(videoId, 'hq');

    if (editingVideo) {
      // Update
      await updateYouTubeVideo(editingVideo.id, {
        title: formTitle.trim(),
        youtubeUrl: standardUrl,
        youtubeVideoId: videoId,
        thumbnailUrl: thumb,
        description: formDescription.trim(),
        category: formCategory,
        displayOrder: Number(formDisplayOrder),
        isFeatured: formIsFeatured,
        isPublished: formIsPublished,
        showOnHome: formShowOnHome,
      });
      setEditingVideo(null);
    } else {
      // Create
      await addYouTubeVideo({
        title: formTitle.trim(),
        youtubeUrl: standardUrl,
        youtubeVideoId: videoId,
        thumbnailUrl: thumb,
        description: formDescription.trim(),
        category: formCategory,
        displayOrder: Number(formDisplayOrder),
        isFeatured: formIsFeatured,
        isPublished: formIsPublished,
        showOnHome: formShowOnHome,
      });
      setIsAddModalOpen(false);
    }
  };

  // Reorder Item Move
  const handleMoveOrder = async (id: string, direction: 'up' | 'down') => {
    const sorted = [...videos].sort((a, b) => (a.displayOrder ?? 999) - (b.displayOrder ?? 999));
    const index = sorted.findIndex((v) => v.id === id);
    if (index === -1) return;

    if (direction === 'up' && index > 0) {
      const temp = sorted[index];
      sorted[index] = sorted[index - 1];
      sorted[index - 1] = temp;
    } else if (direction === 'down' && index < sorted.length - 1) {
      const temp = sorted[index];
      sorted[index] = sorted[index + 1];
      sorted[index + 1] = temp;
    } else {
      return;
    }

    await reorderYouTubeVideos(sorted.map((v) => v.id));
  };

  // Save Homepage Settings
  const handleSaveHomepageConfig = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!canPerformAction('Editor')) {
      addToast('error', 'Permission Denied', 'You need Editor permissions to adjust settings.');
      return;
    }

    setIsSavingConfig(true);
    try {
      await updateHomepageVideoConfig({
        enabled: configEnabled,
        sectionTitle: configTitle.trim(),
        sectionSubtitle: configSubtitle.trim(),
        featuredVideoId: configFeaturedId,
        maxDisplayCount: Number(configMaxCount),
        layoutStyle: configLayout,
      });
      addToast('success', 'Homepage Settings Saved', 'Homepage Video Ministry controls updated in Firebase.');
    } catch {
      addToast('error', 'Update Failed', 'Could not save homepage settings to Firebase.');
    } finally {
      setIsSavingConfig(false);
    }
  };

  // Sync to Firebase manually
  const handleManualSync = async () => {
    setIsSyncing(true);
    await syncVideosToFirebase();
    setIsSyncing(false);
  };

  return (
    <div className="space-y-6">
      {/* Top Header Card */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 rounded-xl bg-[#588B76]/10 text-[#588B76] flex items-center justify-center shrink-0">
              <Tv className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl font-serif font-bold text-slate-900">
                  YouTube Video Management
                </h1>
                <span className="px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[11px] font-bold">
                  Firebase Sync Active
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-1">
                Manage, publish, order, and control YouTube videos featured on the Philippine College of Ministry website and HOME page.
              </p>
            </div>
          </div>

          {/* Quick Action Buttons */}
          <div className="flex flex-wrap items-center gap-2.5">
            <button
              onClick={handleManualSync}
              disabled={isSyncing}
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-50 text-slate-700 text-xs font-semibold border border-slate-200 hover:bg-slate-100 transition-colors shadow-xs disabled:opacity-50"
              title="Force sync all videos to Firebase"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isSyncing ? 'animate-spin text-[#588B76]' : 'text-slate-500'}`} />
              <span>{isSyncing ? 'Syncing...' : 'Sync Firebase'}</span>
            </button>

            <button
              onClick={handleOpenAdd}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-[#588B76] hover:bg-[#456e5d] text-white text-xs font-bold transition-all shadow-sm"
            >
              <Plus className="w-4 h-4" />
              <span>Add YouTube Video</span>
            </button>
          </div>
        </div>

        {/* Real-time Status Banner */}
        <div className="mt-6 pt-5 border-t border-slate-100 grid grid-cols-2 sm:grid-cols-4 gap-4">
          <div className="bg-slate-50 rounded-xl p-3 border border-slate-200/70">
            <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider block">
              Total Managed
            </span>
            <span className="text-xl font-bold text-slate-900 mt-0.5 block">
              {videos.length} <span className="text-xs font-normal text-slate-500">videos</span>
            </span>
          </div>

          <div className="bg-slate-50 rounded-xl p-3 border border-slate-200/70">
            <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider block">
              Published on Site
            </span>
            <span className="text-xl font-bold text-emerald-600 mt-0.5 block">
              {videos.filter((v) => v.isPublished).length} <span className="text-xs font-normal text-slate-500">active</span>
            </span>
          </div>

          <div className="bg-slate-50 rounded-xl p-3 border border-slate-200/70">
            <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider block">
              Home Section
            </span>
            <span className={`text-xl font-bold mt-0.5 flex items-center gap-1.5 ${homepageVideoConfig.enabled ? 'text-emerald-600' : 'text-slate-400'}`}>
              {homepageVideoConfig.enabled ? 'Enabled' : 'Hidden'}
              <span className="text-xs font-normal text-slate-500">({videos.filter((v) => v.showOnHome && v.isPublished).length} on home)</span>
            </span>
          </div>

          <div className="bg-slate-50 rounded-xl p-3 border border-slate-200/70">
            <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider block">
              Home Featured Video
            </span>
            <span className="text-xs font-bold text-[#8C6D37] mt-1 block truncate" title={featuredVideo?.title || 'None Selected'}>
              ★ {featuredVideo?.title || 'None Selected'}
            </span>
          </div>
        </div>
      </div>

      {/* Main Tab Navigation */}
      <div className="flex border-b border-slate-200">
        <button
          onClick={() => setSubTab('videos')}
          className={`pb-3 px-4 text-xs font-bold flex items-center gap-2 border-b-2 transition-colors ${
            subTab === 'videos'
              ? 'border-[#588B76] text-[#588B76]'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <Tv className="w-4 h-4" />
          <span>Manage Video Catalog ({videos.length})</span>
        </button>

        <button
          onClick={() => setSubTab('homepage-settings')}
          className={`pb-3 px-4 text-xs font-bold flex items-center gap-2 border-b-2 transition-colors ${
            subTab === 'homepage-settings'
              ? 'border-[#588B76] text-[#588B76]'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <SlidersHorizontal className="w-4 h-4" />
          <span>Homepage Video Settings</span>
        </button>
      </div>

      {/* TAB 1: VIDEO DIRECTORY & ORDERING */}
      {subTab === 'videos' && (
        <div className="space-y-4">
          {/* Filter Bar */}
          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex flex-col md:flex-row gap-3 items-stretch md:items-center justify-between">
            {/* Search */}
            <div className="relative flex-1 max-w-md">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search videos by title, YouTube ID, description..."
                className="w-full pl-9 pr-3 py-1.5 rounded-lg border border-slate-200 text-xs focus:outline-hidden focus:ring-2 focus:ring-[#588B76]/20 focus:border-[#588B76]"
              />
            </div>

            {/* Filters */}
            <div className="flex flex-wrap items-center gap-2 text-xs">
              {/* Category Filter */}
              <select
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value)}
                className="px-2.5 py-1.5 rounded-lg border border-slate-200 bg-white text-slate-700 font-medium"
              >
                <option value="All">All Categories</option>
                {VIDEO_CATEGORIES.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
              </select>

              {/* Status Filter */}
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value as any)}
                className="px-2.5 py-1.5 rounded-lg border border-slate-200 bg-white text-slate-700 font-medium"
              >
                <option value="all">All Statuses</option>
                <option value="published">Published Only</option>
                <option value="unpublished">Unpublished Only</option>
                <option value="featured">Featured Only</option>
                <option value="home">Home Section Only</option>
              </select>

              {(searchQuery || categoryFilter !== 'All' || statusFilter !== 'all') && (
                <button
                  onClick={() => {
                    setSearchQuery('');
                    setCategoryFilter('All');
                    setStatusFilter('all');
                  }}
                  className="text-xs text-slate-500 hover:text-slate-800 underline font-medium"
                >
                  Clear
                </button>
              )}
            </div>
          </div>

          {/* Videos List / Table */}
          {filteredVideos.length === 0 ? (
            <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center">
              <Tv className="w-12 h-12 text-slate-300 mx-auto mb-3" />
              <h3 className="text-base font-bold text-slate-800">No videos found</h3>
              <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
                {videos.length === 0
                  ? 'There are currently no YouTube videos in the directory. Click "Add YouTube Video" to add your first video.'
                  : 'No videos matched your filter criteria. Try clearing the search or category filter.'}
              </p>
              {videos.length === 0 && (
                <button
                  onClick={handleOpenAdd}
                  className="mt-4 px-4 py-2 bg-[#588B76] text-white rounded-xl text-xs font-bold hover:bg-[#456e5d]"
                >
                  Add First Video
                </button>
              )}
            </div>
          ) : (
            <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="bg-slate-50/80 border-b border-slate-200 text-slate-500 font-semibold uppercase tracking-wider text-[11px]">
                      <th className="py-3 px-4 w-16 text-center">Order</th>
                      <th className="py-3 px-4 w-28">Preview</th>
                      <th className="py-3 px-4 min-w-[240px]">Video Title & Details</th>
                      <th className="py-3 px-4 w-36">Category</th>
                      <th className="py-3 px-4 w-32 text-center">Status</th>
                      <th className="py-3 px-4 w-32 text-center">Home Page</th>
                      <th className="py-3 px-4 w-44 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {filteredVideos.map((video, index) => {
                      const thumb = video.thumbnailUrl || getYouTubeThumbnailUrl(video.youtubeVideoId, 'hq');

                      return (
                        <tr
                          key={video.id}
                          className={`hover:bg-slate-50/60 transition-colors ${
                            video.isFeatured ? 'bg-[#C5A880]/5' : ''
                          }`}
                        >
                          {/* Order Priority Buttons */}
                          <td className="py-3 px-4 text-center">
                            <div className="flex flex-col items-center gap-0.5">
                              <span className="font-mono text-xs font-bold text-slate-700">
                                #{video.displayOrder ?? index + 1}
                              </span>
                              <div className="flex items-center gap-1">
                                <button
                                  onClick={() => handleMoveOrder(video.id, 'up')}
                                  disabled={index === 0}
                                  className="p-1 rounded hover:bg-slate-200 text-slate-400 hover:text-slate-700 disabled:opacity-20"
                                  title="Move Up"
                                >
                                  <ArrowUp className="w-3 h-3" />
                                </button>
                                <button
                                  onClick={() => handleMoveOrder(video.id, 'down')}
                                  disabled={index === filteredVideos.length - 1}
                                  className="p-1 rounded hover:bg-slate-200 text-slate-400 hover:text-slate-700 disabled:opacity-20"
                                  title="Move Down"
                                >
                                  <ArrowDown className="w-3 h-3" />
                                </button>
                              </div>
                            </div>
                          </td>

                          {/* Thumbnail */}
                          <td className="py-3 px-4">
                            <div
                              onClick={() => setPreviewVideo(video)}
                              className="relative w-24 aspect-video rounded-lg overflow-hidden bg-slate-900 cursor-pointer group shadow-xs"
                            >
                              {/* eslint-disable-next-line @next/next/no-img-element */}
                              <img
                                src={thumb}
                                alt={video.title}
                                className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                                loading="lazy"
                              />
                              <div className="absolute inset-0 bg-black/30 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                                <Play className="w-4 h-4 text-white fill-current" />
                              </div>
                            </div>
                          </td>

                          {/* Title & Info */}
                          <td className="py-3 px-4">
                            <div className="flex items-center gap-2 mb-1">
                              {video.isFeatured && (
                                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-[#C5A880]/20 text-[#8C6D37] text-[10px] font-bold">
                                  <Sparkles className="w-3 h-3" />
                                  HOME FEATURED
                                </span>
                              )}
                              <span className="font-mono text-[11px] text-slate-400">
                                ID: {video.youtubeVideoId}
                              </span>
                            </div>
                            <h4
                              onClick={() => setPreviewVideo(video)}
                              className="text-xs sm:text-sm font-bold text-slate-900 hover:text-[#588B76] cursor-pointer transition-colors"
                            >
                              {video.title}
                            </h4>
                            {video.description && (
                              <p className="text-[11px] text-slate-500 line-clamp-1 mt-0.5">
                                {video.description}
                              </p>
                            )}
                            <div className="mt-1 flex items-center gap-2 text-[10px] text-slate-400">
                              <a
                                href={video.youtubeUrl || `https://www.youtube.com/watch?v=${video.youtubeVideoId}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-[#588B76] hover:underline flex items-center gap-1"
                              >
                                YouTube Link <ExternalLink className="w-2.5 h-2.5" />
                              </a>
                            </div>
                          </td>

                          {/* Category */}
                          <td className="py-3 px-4">
                            <span className="px-2.5 py-1 rounded-md bg-slate-100 text-slate-700 font-semibold text-[11px]">
                              {video.category || 'General'}
                            </span>
                          </td>

                          {/* Published Status Toggle */}
                          <td className="py-3 px-4 text-center">
                            <button
                              onClick={() => togglePublishYouTubeVideo(video.id)}
                              className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold transition-colors ${
                                video.isPublished
                                  ? 'bg-emerald-100 text-emerald-800 hover:bg-emerald-200'
                                  : 'bg-slate-100 text-slate-500 hover:bg-slate-200'
                              }`}
                              title="Click to toggle publish status"
                            >
                              {video.isPublished ? (
                                <>
                                  <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                                  <span>Published</span>
                                </>
                              ) : (
                                <>
                                  <EyeOff className="w-3 h-3 text-slate-400" />
                                  <span>Draft</span>
                                </>
                              )}
                            </button>
                          </td>

                          {/* Show on Home Toggle */}
                          <td className="py-3 px-4 text-center">
                            <button
                              onClick={() => updateYouTubeVideo(video.id, { showOnHome: !video.showOnHome })}
                              className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-semibold transition-colors ${
                                video.showOnHome
                                  ? 'bg-blue-50 text-blue-700 hover:bg-blue-100'
                                  : 'bg-slate-100 text-slate-400 hover:bg-slate-200'
                              }`}
                              title="Click to toggle display on Home section"
                            >
                              {video.showOnHome ? 'Shown on Home' : 'Hidden'}
                            </button>
                          </td>

                          {/* Action Buttons */}
                          <td className="py-3 px-4 text-right">
                            <div className="flex items-center justify-end gap-1.5">
                              {/* Set as Featured Button */}
                              <button
                                onClick={() => setFeaturedYouTubeVideo(video.id)}
                                className={`p-1.5 rounded-lg text-xs font-medium transition-colors ${
                                  video.isFeatured
                                    ? 'bg-[#C5A880] text-white'
                                    : 'text-slate-400 hover:text-[#8C6D37] hover:bg-[#C5A880]/15'
                                }`}
                                title={video.isFeatured ? 'Current Home Featured Video' : 'Make this the Featured Video on HOME'}
                              >
                                <Sparkles className="w-3.5 h-3.5" />
                              </button>

                              {/* Preview */}
                              <button
                                onClick={() => setPreviewVideo(video)}
                                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100"
                                title="Preview Video Playback"
                              >
                                <Eye className="w-3.5 h-3.5" />
                              </button>

                              {/* Edit */}
                              <button
                                onClick={() => handleOpenEdit(video)}
                                className="p-1.5 rounded-lg text-slate-400 hover:text-[#588B76] hover:bg-[#588B76]/10"
                                title="Edit Video Information"
                              >
                                <Edit2 className="w-3.5 h-3.5" />
                              </button>

                              {/* Delete */}
                              <button
                                onClick={() => setDeleteTarget(video)}
                                className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50"
                                title="Delete Video"
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
            </div>
          )}
        </div>
      )}

      {/* TAB 2: HOMEPAGE VIDEO SETTINGS */}
      {subTab === 'homepage-settings' && (
        <form onSubmit={handleSaveHomepageConfig} className="space-y-6">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 space-y-6">
            <div>
              <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <SlidersHorizontal className="w-5 h-5 text-[#588B76]" />
                Homepage Video Ministry Controls
              </h3>
              <p className="text-xs text-slate-500 mt-1">
                Customize how the public &quot;Featured Videos&quot; section appears on the Philippine College of Ministry HOME page.
              </p>
            </div>

            {/* Visibility Toggle */}
            <div className="flex items-center justify-between p-4 bg-slate-50 rounded-xl border border-slate-200">
              <div>
                <span className="text-xs font-bold text-slate-900 block">
                  Enable Video Ministry Section on HOME Page
                </span>
                <span className="text-[11px] text-slate-500 block mt-0.5">
                  When enabled, the interactive video showcase appears for all prospective students, alumni, and visitors.
                </span>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={configEnabled}
                  onChange={(e) => setConfigEnabled(e.target.checked)}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-slate-300 peer-focus:outline-hidden rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#588B76]"></div>
              </label>
            </div>

            {/* Section Titles */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Section Headline Title
                </label>
                <input
                  type="text"
                  value={configTitle}
                  onChange={(e) => setConfigTitle(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs focus:ring-2 focus:ring-[#588B76]/20 focus:border-[#588B76]"
                  placeholder="e.g. PCM Video Ministry & Chapel"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Maximum Videos to Display on Home
                </label>
                <select
                  value={configMaxCount}
                  onChange={(e) => setConfigMaxCount(Number(e.target.value))}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white text-xs font-medium"
                >
                  <option value={3}>3 Videos</option>
                  <option value={4}>4 Videos</option>
                  <option value={6}>6 Videos (Recommended)</option>
                  <option value={8}>8 Videos</option>
                  <option value={12}>12 Videos</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Section Subtitle / Description
              </label>
              <textarea
                value={configSubtitle}
                onChange={(e) => setConfigSubtitle(e.target.value)}
                rows={2}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs focus:ring-2 focus:ring-[#588B76]/20 focus:border-[#588B76]"
                placeholder="Brief introductory text beneath the headline..."
              />
            </div>

            {/* Default Featured Video Selector */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Default Featured Video (Starts in Main Player)
              </label>
              <select
                value={configFeaturedId}
                onChange={(e) => setConfigFeaturedId(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white text-xs font-medium"
              >
                <option value="">Auto (First Published / Explicit Star)</option>
                {videos.map((v) => (
                  <option key={v.id} value={v.id}>
                    {v.title} ({v.category}) {v.isFeatured ? '★ [Current Star]' : ''}
                  </option>
                ))}
              </select>
              <p className="text-[11px] text-slate-500 mt-1">
                This video loads automatically in the large player when visitors arrive at the HOME page.
              </p>
            </div>

            {/* Layout Style Selector */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-2">
                Homepage Layout Style
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div
                  onClick={() => setConfigLayout('featured-playlist')}
                  className={`p-4 rounded-xl border-2 cursor-pointer transition-all ${
                    configLayout === 'featured-playlist'
                      ? 'border-[#588B76] bg-[#588B76]/5 shadow-xs'
                      : 'border-slate-200 hover:border-slate-300'
                  }`}
                >
                  <div className="flex items-center gap-2 mb-2">
                    <Layers className="w-4 h-4 text-[#588B76]" />
                    <span className="text-xs font-bold text-slate-900">
                      Featured Showcase + Playlist Sidebar (Recommended)
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-500 leading-relaxed">
                    Main 16:9 embedded player on the left with an interactive vertical playlist of videos on the right. Clicking changes the active video instantly.
                  </p>
                </div>

                <div
                  onClick={() => setConfigLayout('grid')}
                  className={`p-4 rounded-xl border-2 cursor-pointer transition-all ${
                    configLayout === 'grid'
                      ? 'border-[#588B76] bg-[#588B76]/5 shadow-xs'
                      : 'border-slate-200 hover:border-slate-300'
                  }`}
                >
                  <div className="flex items-center gap-2 mb-2">
                    <LayoutGrid className="w-4 h-4 text-[#588B76]" />
                    <span className="text-xs font-bold text-slate-900">
                      Top Featured Banner + Card Grid
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-500 leading-relaxed">
                    Large top featured player with a responsive 3-column thumbnail card grid underneath.
                  </p>
                </div>
              </div>
            </div>

            {/* Submit Button */}
            <div className="pt-4 border-t border-slate-100 flex items-center justify-between">
              <span className="text-[11px] text-slate-400">
                Changes saved here update immediately across all devices via Firebase.
              </span>
              <button
                type="submit"
                disabled={isSavingConfig}
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#588B76] hover:bg-[#456e5d] text-white text-xs font-bold transition-all shadow-sm disabled:opacity-50"
              >
                <Save className="w-4 h-4" />
                <span>{isSavingConfig ? 'Saving to Firebase...' : 'Save Homepage Settings'}</span>
              </button>
            </div>
          </div>
        </form>
      )}

      {/* ADD / EDIT VIDEO MODAL */}
      {(isAddModalOpen || editingVideo) && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl max-w-2xl w-full p-6 shadow-2xl border border-slate-200 my-8">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100 mb-5">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-[#588B76]/10 text-[#588B76] flex items-center justify-center">
                  <Tv className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900">
                    {editingVideo ? 'Edit YouTube Video' : 'Add New YouTube Video'}
                  </h3>
                  <p className="text-[11px] text-slate-500">
                    Enter YouTube URL or Video ID. Preview will update in real time.
                  </p>
                </div>
              </div>
              <button
                onClick={() => {
                  setIsAddModalOpen(false);
                  setEditingVideo(null);
                }}
                className="text-slate-400 hover:text-slate-700 p-1.5 rounded-lg hover:bg-slate-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveVideo} className="space-y-4 text-xs">
              {/* YouTube URL / ID input */}
              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  YouTube URL or Video ID <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={formUrlOrId}
                  onChange={(e) => setFormUrlOrId(e.target.value)}
                  placeholder="e.g. https://www.youtube.com/watch?v=dQw4w9WgXcQ or dQw4w9WgXcQ"
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 font-mono focus:ring-2 focus:ring-[#588B76]/20 focus:border-[#588B76]"
                />
                <p className="text-[11px] text-slate-500 mt-1">
                  Supports standard YouTube links, short links (youtu.be), YouTube Shorts, and 11-char Video IDs.
                </p>
              </div>

              {/* LIVE EMBED PREVIEW */}
              {extractedFormVideoId && isValidYouTubeId(extractedFormVideoId) && (
                <div className="p-3 bg-slate-900 rounded-xl overflow-hidden border border-slate-800">
                  <div className="flex items-center justify-between text-slate-300 mb-2 px-1">
                    <span className="text-[11px] font-semibold flex items-center gap-1 text-emerald-400">
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      Valid Video ID: <code className="font-mono text-white">{extractedFormVideoId}</code>
                    </span>
                    <span className="text-[10px] text-slate-400">Live Player Preview</span>
                  </div>
                  <div className="relative aspect-video w-full rounded-lg overflow-hidden bg-black">
                    <iframe
                      src={getYouTubeEmbedUrl(extractedFormVideoId)}
                      title="Preview Player"
                      className="w-full h-full border-0"
                      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                      allowFullScreen
                    />
                  </div>
                </div>
              )}

              {/* Title */}
              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  Video Title <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={formTitle}
                  onChange={(e) => setFormTitle(e.target.value)}
                  placeholder="e.g. PCM Semestral Chapel Service — Faithful to the Calling"
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 focus:ring-2 focus:ring-[#588B76]/20 focus:border-[#588B76]"
                />
              </div>

              {/* Category & Order */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Category / Tag</label>
                  <select
                    value={formCategory}
                    onChange={(e) => setFormCategory(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 bg-white font-medium"
                  >
                    {VIDEO_CATEGORIES.map((cat) => (
                      <option key={cat} value={cat}>
                        {cat}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    Display Order / Priority
                  </label>
                  <input
                    type="number"
                    min={1}
                    value={formDisplayOrder}
                    onChange={(e) => setFormDisplayOrder(Number(e.target.value))}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 focus:ring-2 focus:ring-[#588B76]/20 focus:border-[#588B76]"
                  />
                  <span className="text-[10px] text-slate-400">Lower numbers display first.</span>
                </div>
              </div>

              {/* Description */}
              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  Description / Pastoral Summary
                </label>
                <textarea
                  value={formDescription}
                  onChange={(e) => setFormDescription(e.target.value)}
                  rows={3}
                  placeholder="Key scriptures, speakers, or event context for this video..."
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 focus:ring-2 focus:ring-[#588B76]/20 focus:border-[#588B76]"
                />
              </div>

              {/* Toggles */}
              <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 space-y-2.5">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formIsPublished}
                    onChange={(e) => setFormIsPublished(e.target.checked)}
                    className="w-4 h-4 rounded text-[#588B76] focus:ring-[#588B76]"
                  />
                  <div>
                    <span className="font-bold text-slate-800">Published Status (Active on Website)</span>
                    <span className="text-[11px] text-slate-500 block">
                      Uncheck to hide this video without deleting it from the system.
                    </span>
                  </div>
                </label>

                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formShowOnHome}
                    onChange={(e) => setFormShowOnHome(e.target.checked)}
                    className="w-4 h-4 rounded text-[#588B76] focus:ring-[#588B76]"
                  />
                  <div>
                    <span className="font-bold text-slate-800">Show in HOME Page Section</span>
                    <span className="text-[11px] text-slate-500 block">
                      Controls whether this video appears in the public HOME video playlist.
                    </span>
                  </div>
                </label>

                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formIsFeatured}
                    onChange={(e) => setFormIsFeatured(e.target.checked)}
                    className="w-4 h-4 rounded text-[#588B76] focus:ring-[#588B76]"
                  />
                  <div>
                    <span className="font-bold text-[#8C6D37]">★ Set as Primary Featured Video</span>
                    <span className="text-[11px] text-slate-500 block">
                      Loads automatically in the large player when visitors open the HOME section.
                    </span>
                  </div>
                </label>
              </div>

              {/* Form Action Buttons */}
              <div className="pt-4 border-t border-slate-100 flex items-center justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => {
                    setIsAddModalOpen(false);
                    setEditingVideo(null);
                  }}
                  className="px-4 py-2 rounded-xl text-slate-600 hover:bg-slate-100 font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-[#588B76] hover:bg-[#456e5d] text-white font-bold transition-all shadow-sm"
                >
                  {editingVideo ? 'Save Changes' : 'Publish Video'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* FULL VIDEO PREVIEW MODAL */}
      {previewVideo && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-3xl w-full overflow-hidden shadow-2xl border border-slate-800 animate-in fade-in zoom-in-95 duration-200">
            {/* Header */}
            <div className="p-4 bg-slate-900 text-white flex items-center justify-between">
              <div className="flex items-center gap-2 truncate pr-4">
                <Tv className="w-4 h-4 text-[#588B76] shrink-0" />
                <span className="font-bold text-xs truncate">{previewVideo.title}</span>
              </div>
              <button
                onClick={() => setPreviewVideo(null)}
                className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Video Player */}
            <div className="relative aspect-video w-full bg-black">
              <iframe
                src={getYouTubeEmbedUrl(previewVideo.youtubeVideoId, { autoplay: true })}
                title={previewVideo.title}
                className="w-full h-full border-0"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
              />
            </div>

            {/* Video Details */}
            <div className="p-5 text-xs">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <span className="px-2.5 py-0.5 rounded-md bg-[#588B76]/10 text-[#588B76] font-bold text-[11px]">
                    {previewVideo.category || 'General'}
                  </span>
                  {previewVideo.isFeatured && (
                    <span className="px-2 py-0.5 rounded-md bg-[#C5A880]/20 text-[#8C6D37] font-bold text-[10px]">
                      ★ Featured Video
                    </span>
                  )}
                </div>
                <a
                  href={previewVideo.youtubeUrl || `https://www.youtube.com/watch?v=${previewVideo.youtubeVideoId}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-[#588B76] hover:underline flex items-center gap-1 font-semibold"
                >
                  Open in YouTube <ExternalLink className="w-3.5 h-3.5" />
                </a>
              </div>

              <h3 className="text-base font-bold font-serif text-slate-900 mb-1.5">
                {previewVideo.title}
              </h3>

              {previewVideo.description && (
                <p className="text-slate-600 leading-relaxed whitespace-pre-line">
                  {previewVideo.description}
                </p>
              )}

              <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-400">
                <span>YouTube ID: {previewVideo.youtubeVideoId}</span>
                <span>Order Priority: #{previewVideo.displayOrder ?? '1'}</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* DELETE CONFIRMATION MODAL */}
      <ConfirmDeleteModal
        isOpen={!!deleteTarget}
        title="Delete YouTube Video"
        itemName={deleteTarget?.title || 'YouTube Video'}
        message="Are you sure you want to delete this YouTube video record from the PCM directory? This action cannot be undone."
        confirmLabel="Delete Video"
        onConfirm={async () => {
          if (deleteTarget) {
            await deleteYouTubeVideo(deleteTarget.id);
            setDeleteTarget(null);
          }
        }}
        onCancel={() => setDeleteTarget(null)}
      />
    </div>
  );
};
