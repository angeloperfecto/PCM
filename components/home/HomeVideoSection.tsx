'use client';

import React, { useState, useMemo } from 'react';
import { usePCM } from '@/lib/store';
import { YouTubeVideo } from '@/lib/types';
import { getYouTubeEmbedUrl, getYouTubeThumbnailUrl, isValidYouTubeId } from '@/lib/youtube';
import {
  Play,
  Tv,
  ExternalLink,
  Sparkles,
  SlidersHorizontal,
  Layers,
  CheckCircle2,
  Calendar,
  Tag,
  Eye,
  Settings,
} from 'lucide-react';

export const HomeVideoSection: React.FC = () => {
  const {
    videos,
    homepageVideoConfig,
    featuredVideo,
    isAdminLoggedIn,
    navigateTo,
  } = usePCM();

  // Filter videos that are published and flagged to show on HOME
  const eligibleVideos = useMemo(() => {
    return videos
      .filter((v) => v.isPublished && v.showOnHome)
      .sort((a, b) => (a.displayOrder ?? 999) - (b.displayOrder ?? 999));
  }, [videos]);

  // Categories present in eligible videos
  const categories = useMemo(() => {
    const set = new Set<string>();
    eligibleVideos.forEach((v) => {
      if (v.category) set.add(v.category);
    });
    return ['All', ...Array.from(set)];
  }, [eligibleVideos]);

  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [activeVideoId, setActiveVideoId] = useState<string | null>(null);
  const [showAllVideos, setShowAllVideos] = useState<boolean>(false);

  // Filtered by category
  const filteredVideos = useMemo(() => {
    if (selectedCategory === 'All') return eligibleVideos;
    return eligibleVideos.filter((v) => v.category === selectedCategory);
  }, [eligibleVideos, selectedCategory]);

  // Determine current active video in the main showcase player
  const currentActiveVideo: YouTubeVideo | null = useMemo(() => {
    if (activeVideoId) {
      const match = eligibleVideos.find((v) => v.id === activeVideoId);
      if (match) return match;
    }
    if (featuredVideo && eligibleVideos.some((v) => v.id === featuredVideo.id)) {
      return featuredVideo;
    }
    return eligibleVideos[0] || null;
  }, [activeVideoId, eligibleVideos, featuredVideo]);

  // Limit display count based on config unless user clicked "Show All"
  const displayVideos = useMemo(() => {
    if (showAllVideos) return filteredVideos;
    const limit = homepageVideoConfig.maxDisplayCount || 6;
    return filteredVideos.slice(0, limit);
  }, [filteredVideos, homepageVideoConfig.maxDisplayCount, showAllVideos]);

  // If section is disabled in admin settings or no videos eligible, do not render
  if (!homepageVideoConfig.enabled || eligibleVideos.length === 0) {
    return null;
  }

  const layoutStyle = homepageVideoConfig.layoutStyle || 'featured-playlist';

  return (
    <section
      id="home-video-ministry-section"
      className="py-16 md:py-24 bg-[#F8FAFC] border-y border-slate-200/80 relative overflow-hidden"
    >
      {/* Background Subtle Accents */}
      <div className="absolute top-0 right-0 w-96 h-96 bg-[#588B76]/5 rounded-full blur-3xl pointer-events-none -mr-32 -mt-32" />
      <div className="absolute bottom-0 left-0 w-96 h-96 bg-[#C5A880]/5 rounded-full blur-3xl pointer-events-none -ml-32 -mb-32" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        {/* Section Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-10 md:mb-12 gap-6">
          <div className="max-w-2xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#588B76]/10 text-[#588B76] text-xs font-semibold uppercase tracking-wider mb-3">
              <Tv className="w-3.5 h-3.5" />
              <span>Video Ministry & Media</span>
            </div>
            <h2 className="text-3xl sm:text-4xl font-serif font-bold text-slate-900 tracking-tight">
              {homepageVideoConfig.sectionTitle || 'PCM Video Ministry & Chapel'}
            </h2>
            <p className="mt-3 text-base sm:text-lg text-slate-600 leading-relaxed">
              {homepageVideoConfig.sectionSubtitle ||
                'Experience our worship, student testimonies, biblical chapel messages, and campus life at the Philippines College of Ministry.'}
            </p>
          </div>

          {/* Admin Live Quick Access Badge */}
          <div className="flex flex-wrap items-center gap-3">
            {isAdminLoggedIn && (
              <button
                onClick={() => navigateTo('admin')}
                className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-white text-slate-700 text-xs font-medium border border-slate-300 hover:border-[#588B76] hover:text-[#588B76] transition-colors shadow-sm"
                title="Manage YouTube Videos in Admin Dashboard"
              >
                <Settings className="w-3.5 h-3.5 text-[#588B76]" />
                <span>Admin Video Control</span>
              </button>
            )}
            <span className="text-xs text-slate-500 font-medium hidden sm:inline-block">
              {eligibleVideos.length} {eligibleVideos.length === 1 ? 'Video' : 'Videos'} Available
            </span>
          </div>
        </div>

        {/* Category Filter Pills */}
        {categories.length > 2 && (
          <div className="flex items-center gap-2 overflow-x-auto pb-4 mb-8 scrollbar-thin">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider flex items-center gap-1 shrink-0 mr-1">
              <SlidersHorizontal className="w-3.5 h-3.5" />
              Filter:
            </span>
            {categories.map((cat) => {
              const count = cat === 'All' ? eligibleVideos.length : eligibleVideos.filter((v) => v.category === cat).length;
              const isActive = selectedCategory === cat;
              return (
                <button
                  key={cat}
                  onClick={() => setSelectedCategory(cat)}
                  className={`px-3.5 py-1.5 rounded-full text-xs font-medium transition-all whitespace-nowrap shrink-0 flex items-center gap-1.5 ${
                    isActive
                      ? 'bg-[#588B76] text-white shadow-sm ring-2 ring-[#588B76]/20'
                      : 'bg-white text-slate-700 hover:bg-slate-100 border border-slate-200'
                  }`}
                >
                  <span>{cat}</span>
                  <span
                    className={`text-[10px] px-1.5 py-0.5 rounded-full ${
                      isActive ? 'bg-white/20 text-white' : 'bg-slate-100 text-slate-500'
                    }`}
                  >
                    {count}
                  </span>
                </button>
              );
            })}
          </div>
        )}

        {/* Layout Render */}
        {layoutStyle === 'featured-playlist' ? (
          /* 2-Column Featured + Playlist Layout */
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            {/* Main Featured Player (7 cols) */}
            <div className="lg:col-span-7 flex flex-col gap-4">
              {currentActiveVideo ? (
                <div className="bg-white rounded-2xl border border-slate-200 shadow-lg overflow-hidden transition-all">
                  {/* Video Embed Frame */}
                  <div className="relative aspect-video w-full bg-black">
                    {isValidYouTubeId(currentActiveVideo.youtubeVideoId) ? (
                      <iframe
                        src={getYouTubeEmbedUrl(currentActiveVideo.youtubeVideoId)}
                        title={currentActiveVideo.title}
                        className="w-full h-full border-0"
                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                        allowFullScreen
                      />
                    ) : (
                      <div className="w-full h-full flex flex-col items-center justify-center text-white p-6 text-center">
                        <Tv className="w-12 h-12 text-slate-500 mb-2" />
                        <p className="font-semibold text-slate-200">Video Preview Unavailable</p>
                        <p className="text-xs text-slate-400 mt-1">Please verify the YouTube ID in Admin Dashboard.</p>
                      </div>
                    )}
                  </div>

                  {/* Video Info Card */}
                  <div className="p-5 sm:p-6">
                    <div className="flex flex-wrap items-center justify-between gap-3 mb-3">
                      <div className="flex items-center gap-2">
                        {currentActiveVideo.isFeatured && (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-md bg-[#C5A880]/15 text-[#8C6D37] text-xs font-semibold">
                            <Sparkles className="w-3 h-3" />
                            Featured Video
                          </span>
                        )}
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-md bg-slate-100 text-slate-700 text-xs font-medium">
                          <Tag className="w-3 h-3 text-slate-500" />
                          {currentActiveVideo.category || 'General'}
                        </span>
                      </div>

                      <a
                        href={currentActiveVideo.youtubeUrl || `https://www.youtube.com/watch?v=${currentActiveVideo.youtubeVideoId}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#588B76] hover:text-[#456e5d] transition-colors"
                      >
                        <span>Watch on YouTube</span>
                        <ExternalLink className="w-3.5 h-3.5" />
                      </a>
                    </div>

                    <h3 className="text-xl sm:text-2xl font-bold font-serif text-slate-900 leading-snug">
                      {currentActiveVideo.title}
                    </h3>

                    {currentActiveVideo.description && (
                      <p className="mt-3 text-sm text-slate-600 leading-relaxed whitespace-pre-line">
                        {currentActiveVideo.description}
                      </p>
                    )}

                    <div className="mt-4 pt-4 border-t border-slate-100 flex items-center justify-between text-xs text-slate-400">
                      <span className="flex items-center gap-1">
                        <Calendar className="w-3.5 h-3.5" />
                        Added: {currentActiveVideo.createdAt ? new Date(currentActiveVideo.createdAt).toLocaleDateString() : 'Recent'}
                      </span>
                      <span className="font-mono text-[11px] text-slate-400">
                        ID: {currentActiveVideo.youtubeVideoId}
                      </span>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center">
                  <p className="text-slate-500">No active video selected.</p>
                </div>
              )}
            </div>

            {/* Interactive Playlist (5 cols) */}
            <div className="lg:col-span-5 flex flex-col gap-3">
              <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-4 sm:p-5 flex flex-col">
                <div className="flex items-center justify-between pb-3 mb-3 border-b border-slate-100">
                  <div className="flex items-center gap-2">
                    <Layers className="w-4 h-4 text-[#588B76]" />
                    <h4 className="text-sm font-bold text-slate-900 uppercase tracking-wider">
                      PCM Video Playlist
                    </h4>
                  </div>
                  <span className="text-xs text-slate-500 font-medium">
                    {filteredVideos.length} items
                  </span>
                </div>

                {/* Playlist Scroll Container */}
                <div className="space-y-2.5 max-h-[560px] overflow-y-auto pr-1 scrollbar-thin">
                  {displayVideos.map((video, idx) => {
                    const isCurrent = currentActiveVideo?.id === video.id;
                    const thumb = video.thumbnailUrl || getYouTubeThumbnailUrl(video.youtubeVideoId, 'hq');

                    return (
                      <button
                        key={video.id}
                        onClick={() => setActiveVideoId(video.id)}
                        className={`w-full text-left p-3 rounded-xl transition-all flex items-start gap-3.5 group relative ${
                          isCurrent
                            ? 'bg-[#588B76]/10 border-2 border-[#588B76] shadow-sm'
                            : 'bg-slate-50 hover:bg-slate-100 border border-slate-200/80 hover:border-slate-300'
                        }`}
                      >
                        {/* Thumbnail Container */}
                        <div className="relative w-28 sm:w-32 aspect-video rounded-lg overflow-hidden shrink-0 bg-slate-900">
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img
                            src={thumb}
                            alt={video.title}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                            loading="lazy"
                          />
                          <div className="absolute inset-0 bg-black/25 flex items-center justify-center group-hover:bg-black/10 transition-colors">
                            <div
                              className={`w-7 h-7 rounded-full flex items-center justify-center ${
                                isCurrent ? 'bg-[#588B76] text-white shadow-md' : 'bg-white/90 text-slate-900 group-hover:scale-110'
                              } transition-transform`}
                            >
                              <Play className="w-3.5 h-3.5 fill-current ml-0.5" />
                            </div>
                          </div>
                          {video.isFeatured && (
                            <span className="absolute top-1 left-1 px-1.5 py-0.5 rounded bg-[#C5A880] text-white text-[9px] font-bold uppercase tracking-wider">
                              Star
                            </span>
                          )}
                        </div>

                        {/* Metadata */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-1.5 mb-1">
                            <span className="text-[10px] font-semibold text-[#588B76] uppercase tracking-wider">
                              {video.category || 'Chapel'}
                            </span>
                            {isCurrent && (
                              <span className="inline-flex items-center gap-0.5 text-[10px] font-bold text-[#588B76]">
                                • Playing
                              </span>
                            )}
                          </div>

                          <h5
                            className={`text-xs sm:text-sm font-semibold leading-snug line-clamp-2 ${
                              isCurrent ? 'text-slate-900 font-bold' : 'text-slate-800 group-hover:text-[#588B76]'
                            }`}
                          >
                            {video.title}
                          </h5>

                          {video.description && (
                            <p className="text-[11px] text-slate-500 line-clamp-1 mt-1">
                              {video.description}
                            </p>
                          )}

                          <div className="flex items-center gap-2 mt-1.5 text-[10px] text-slate-400">
                            <span>#{idx + 1}</span>
                            {video.showOnHome && (
                              <span className="flex items-center gap-0.5 text-emerald-600">
                                <CheckCircle2 className="w-2.5 h-2.5" />
                                Home
                              </span>
                            )}
                          </div>
                        </div>
                      </button>
                    );
                  })}
                </div>

                {/* Show All / Show Less Toggle Button */}
                {filteredVideos.length > (homepageVideoConfig.maxDisplayCount || 6) && (
                  <button
                    onClick={() => setShowAllVideos(!showAllVideos)}
                    className="mt-3 py-2 px-4 rounded-lg bg-slate-100 hover:bg-slate-200 text-xs font-semibold text-slate-700 transition-colors text-center"
                  >
                    {showAllVideos
                      ? 'Show Less'
                      : `View All ${filteredVideos.length} Videos`}
                  </button>
                )}
              </div>
            </div>
          </div>
        ) : (
          /* Grid Layout Style */
          <div className="space-y-8">
            {/* Top Featured Player Banner */}
            {currentActiveVideo && (
              <div className="bg-white rounded-2xl border border-slate-200 shadow-lg overflow-hidden max-w-4xl mx-auto">
                <div className="relative aspect-video w-full bg-black">
                  <iframe
                    src={getYouTubeEmbedUrl(currentActiveVideo.youtubeVideoId)}
                    title={currentActiveVideo.title}
                    className="w-full h-full border-0"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                    allowFullScreen
                  />
                </div>
                <div className="p-6">
                  <div className="flex items-center justify-between gap-4 mb-2">
                    <span className="text-xs font-bold text-[#588B76] uppercase tracking-wider">
                      {currentActiveVideo.category || 'Chapel'}
                    </span>
                    <a
                      href={currentActiveVideo.youtubeUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-xs font-semibold text-[#588B76] flex items-center gap-1 hover:underline"
                    >
                      Open in YouTube <ExternalLink className="w-3.5 h-3.5" />
                    </a>
                  </div>
                  <h3 className="text-xl sm:text-2xl font-bold font-serif text-slate-900">
                    {currentActiveVideo.title}
                  </h3>
                  {currentActiveVideo.description && (
                    <p className="mt-2 text-sm text-slate-600 leading-relaxed">
                      {currentActiveVideo.description}
                    </p>
                  )}
                </div>
              </div>
            )}

            {/* Video Cards Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {displayVideos.map((video) => {
                const isCurrent = currentActiveVideo?.id === video.id;
                const thumb = video.thumbnailUrl || getYouTubeThumbnailUrl(video.youtubeVideoId, 'hq');

                return (
                  <div
                    key={video.id}
                    onClick={() => {
                      setActiveVideoId(video.id);
                      // Smooth scroll to top of video section
                      document
                        .getElementById('home-video-ministry-section')
                        ?.scrollIntoView({ behavior: 'smooth' });
                    }}
                    className={`cursor-pointer group bg-white rounded-2xl border overflow-hidden transition-all duration-200 flex flex-col ${
                      isCurrent
                        ? 'border-[#588B76] ring-2 ring-[#588B76]/20 shadow-md'
                        : 'border-slate-200 hover:border-slate-300 hover:shadow-md'
                    }`}
                  >
                    <div className="relative aspect-video bg-slate-900 overflow-hidden">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={thumb}
                        alt={video.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        loading="lazy"
                      />
                      <div className="absolute inset-0 bg-black/30 flex items-center justify-center group-hover:bg-black/10 transition-colors">
                        <div className="w-10 h-10 rounded-full bg-white/90 text-slate-900 flex items-center justify-center group-hover:scale-110 shadow-md transition-transform">
                          <Play className="w-4 h-4 fill-current ml-0.5" />
                        </div>
                      </div>
                      {video.isFeatured && (
                        <span className="absolute top-2 left-2 px-2 py-0.5 rounded bg-[#C5A880] text-white text-[10px] font-bold uppercase tracking-wider">
                          Featured
                        </span>
                      )}
                    </div>

                    <div className="p-4 flex-1 flex flex-col justify-between">
                      <div>
                        <div className="flex items-center justify-between text-xs text-slate-500 mb-1.5">
                          <span className="font-semibold text-[#588B76]">{video.category || 'General'}</span>
                          <span>{video.createdAt ? new Date(video.createdAt).toLocaleDateString() : ''}</span>
                        </div>
                        <h4 className="text-base font-bold text-slate-900 group-hover:text-[#588B76] transition-colors line-clamp-2">
                          {video.title}
                        </h4>
                        {video.description && (
                          <p className="mt-1.5 text-xs text-slate-600 line-clamp-2">
                            {video.description}
                          </p>
                        )}
                      </div>

                      <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs font-semibold text-[#588B76]">
                        <span>{isCurrent ? 'Currently Playing' : 'Click to Play'}</span>
                        <Play className="w-3.5 h-3.5" />
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </section>
  );
};
