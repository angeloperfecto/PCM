'use client';

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import Image from 'next/image';
import { usePCM } from '@/lib/store';
import { StudentLifeAlbum, StudentLifePhotoItem } from '@/lib/types';
import {
  Camera,
  Calendar,
  MapPin,
  ArrowLeft,
  ChevronLeft,
  ChevronRight,
  X,
  Maximize2,
  ExternalLink,
  Search,
  Grid,
  Layers,
  Sparkles,
  Share2,
  Download,
  Info,
} from 'lucide-react';

interface StudentLifeGalleryPublicProps {
  badge?: string;
  title?: string;
  subtitle?: string;
}

export const StudentLifeGalleryPublic: React.FC<StudentLifeGalleryPublicProps> = ({
  badge = 'Campus Moments',
  title = 'STUDENT LIFE IN PICTURES',
  subtitle = 'Experience vibrant spiritual life, ministerial training, community fellowship, and highland living through the lens of PCM students and faculty.',
}) => {
  const { studentLifeAlbums, siteConfig, addToast } = usePCM();

  // Active view: 'albums' | 'album-detail'
  const [activeAlbumId, setActiveAlbumId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'albums' | 'all-photos'>('albums');
  const [searchQuery, setSearchQuery] = useState('');

  // Lightbox state
  const [lightboxState, setLightboxState] = useState<{
    isOpen: boolean;
    photos: StudentLifePhotoItem[];
    currentIndex: number;
    albumTitle?: string;
    albumEvent?: string;
    albumDate?: string;
    albumLocation?: string;
  }>({
    isOpen: false,
    photos: [],
    currentIndex: 0,
  });

  // Only published albums for the public site
  const publishedAlbums = useMemo(() => {
    return (studentLifeAlbums || []).filter((a) => a.status === 'published');
  }, [studentLifeAlbums]);

  // Active selected album
  const currentAlbum = useMemo(() => {
    return publishedAlbums.find((a) => a.id === activeAlbumId) || null;
  }, [publishedAlbums, activeAlbumId]);

  // All published photos flattened
  const allPublishedPhotos = useMemo(() => {
    const list: { photo: StudentLifePhotoItem; album: StudentLifeAlbum }[] = [];
    publishedAlbums.forEach((alb) => {
      (alb.photos || []).forEach((p) => {
        list.push({ photo: p, album: alb });
      });
    });
    return list;
  }, [publishedAlbums]);

  // Filtered albums by search
  const filteredAlbums = useMemo(() => {
    if (!searchQuery.trim()) return publishedAlbums;
    const q = searchQuery.toLowerCase();
    return publishedAlbums.filter(
      (a) =>
        a.title.toLowerCase().includes(q) ||
        (a.eventName || '').toLowerCase().includes(q) ||
        (a.location || '').toLowerCase().includes(q) ||
        (a.description || '').toLowerCase().includes(q)
    );
  }, [publishedAlbums, searchQuery]);

  // Filtered all photos
  const filteredAllPhotos = useMemo(() => {
    if (!searchQuery.trim()) return allPublishedPhotos;
    const q = searchQuery.toLowerCase();
    return allPublishedPhotos.filter(
      (item) =>
        (item.photo.caption || '').toLowerCase().includes(q) ||
        item.album.title.toLowerCase().includes(q) ||
        (item.album.eventName || '').toLowerCase().includes(q)
    );
  }, [allPublishedPhotos, searchQuery]);

  // Open lightbox with specific photos array and start index
  const openLightbox = (
    photos: StudentLifePhotoItem[],
    index: number,
    albumInfo?: { title?: string; event?: string; date?: string; location?: string }
  ) => {
    setLightboxState({
      isOpen: true,
      photos,
      currentIndex: Math.max(0, Math.min(index, photos.length - 1)),
      albumTitle: albumInfo?.title,
      albumEvent: albumInfo?.event,
      albumDate: albumInfo?.date,
      albumLocation: albumInfo?.location,
    });
  };

  const closeLightbox = useCallback(() => {
    setLightboxState((prev) => ({ ...prev, isOpen: false }));
  }, []);

  const nextPhoto = useCallback(() => {
    setLightboxState((prev) => {
      if (prev.photos.length === 0) return prev;
      const nextIdx = (prev.currentIndex + 1) % prev.photos.length;
      return { ...prev, currentIndex: nextIdx };
    });
  }, []);

  const prevPhoto = useCallback(() => {
    setLightboxState((prev) => {
      if (prev.photos.length === 0) return prev;
      const prevIdx = (prev.currentIndex - 1 + prev.photos.length) % prev.photos.length;
      return { ...prev, currentIndex: prevIdx };
    });
  }, []);

  // Keyboard navigation for Lightbox
  useEffect(() => {
    if (!lightboxState.isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') closeLightbox();
      if (e.key === 'ArrowRight') nextPhoto();
      if (e.key === 'ArrowLeft') prevPhoto();
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [lightboxState.isOpen, closeLightbox, nextPhoto, prevPhoto]);

  // Lock body scroll when lightbox is open
  useEffect(() => {
    if (lightboxState.isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [lightboxState.isOpen]);

  // Active photo in lightbox
  const currentPhoto = lightboxState.photos[lightboxState.currentIndex];

  return (
    <section id="gallery" className="space-y-8 pt-10 border-t border-slate-200">
      {/* Section Header */}
      <div className="text-center max-w-3xl mx-auto space-y-2 px-4">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#18392B]/10 text-[#18392B] text-xs font-mono font-bold uppercase tracking-widest">
          <Camera className="w-3.5 h-3.5" />
          <span>{badge}</span>
        </div>
        <h2 className="font-serif text-3xl sm:text-4xl font-extrabold text-[#18392B] tracking-tight">
          {title}
        </h2>
        <p className="text-sm text-slate-600 font-light max-w-2xl mx-auto leading-relaxed">
          {subtitle}
        </p>

        {/* Tab switcher: Albums vs All Photos */}
        <div className="flex items-center justify-center gap-2 pt-4">
          <div className="inline-flex p-1 bg-slate-100 rounded-sm border border-slate-200 text-xs font-medium">
            <button
              type="button"
              onClick={() => {
                setActiveTab('albums');
                setActiveAlbumId(null);
              }}
              className={`px-4 py-1.5 rounded-xs flex items-center gap-1.5 transition cursor-pointer ${
                activeTab === 'albums' && !activeAlbumId
                  ? 'bg-white text-[#18392B] font-bold shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Layers className="w-3.5 h-3.5" />
              <span>Photo Albums ({publishedAlbums.length})</span>
            </button>
            <button
              type="button"
              onClick={() => {
                setActiveTab('all-photos');
                setActiveAlbumId(null);
              }}
              className={`px-4 py-1.5 rounded-xs flex items-center gap-1.5 transition cursor-pointer ${
                activeTab === 'all-photos'
                  ? 'bg-white text-[#18392B] font-bold shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Grid className="w-3.5 h-3.5" />
              <span>All Campus Photos ({allPublishedPhotos.length})</span>
            </button>
          </div>
        </div>
      </div>

      {/* Search Bar (When on album list or all photos) */}
      {!currentAlbum && (
        <div className="max-w-md mx-auto px-4">
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search albums, events, or keywords..."
              className="w-full pl-9 pr-4 py-2 text-xs border border-slate-200 rounded-sm bg-white shadow-2xs focus:border-[#588B76] focus:outline-hidden"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 text-xs p-1"
              >
                Clear
              </button>
            )}
          </div>
        </div>
      )}

      {/* VIEW 1: ALBUMS GRID (FACEBOOK STYLE) */}
      {activeTab === 'albums' && !currentAlbum && (
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          {filteredAlbums.length === 0 ? (
            <div className="text-center py-16 bg-slate-50 border border-dashed border-slate-200 rounded-sm p-8 max-w-lg mx-auto">
              <Camera className="w-10 h-10 text-slate-300 mx-auto mb-2 stroke-1" />
              <p className="text-sm font-semibold text-slate-700">No albums match your search</p>
              <p className="text-xs text-slate-500 mt-1">Try another search term or view all photos.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
              {filteredAlbums.map((album) => {
                const count = album.photos?.length || album.photoCount || 0;
                const coverImg = album.coverPhotoUrl || album.photos?.[0]?.imageUrl || '';

                return (
                  <div
                    key={album.id}
                    onClick={() => setActiveAlbumId(album.id)}
                    className="bg-white border border-slate-200 rounded-sm overflow-hidden shadow-2xs hover:border-[#588B76] hover:shadow-md transition duration-300 group cursor-pointer flex flex-col"
                  >
                    {/* Album Card Image Cover with FB style photo counter */}
                    <div className="h-60 w-full relative bg-slate-100 overflow-hidden">
                      {coverImg ? (
                        <Image
                          src={coverImg}
                          alt={album.title}
                          fill
                          sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                          className="object-cover group-hover:scale-105 transition-transform duration-500"
                          referrerPolicy="no-referrer"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-slate-300">
                          <Camera className="w-10 h-10 stroke-1" />
                        </div>
                      )}

                      {/* Dark overlay gradient */}
                      <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/20 to-transparent" />

                      {/* Photo Count Pill */}
                      <div className="absolute top-3 right-3">
                        <span className="bg-black/75 text-white backdrop-blur-xs text-[11px] font-mono font-bold px-2.5 py-1 rounded-full flex items-center gap-1.5 shadow-xs">
                          <Camera className="w-3.5 h-3.5 text-[#588B76]" />
                          <span>{count} {count === 1 ? 'Photo' : 'Photos'}</span>
                        </span>
                      </div>

                      {/* Bottom Info inside cover */}
                      <div className="absolute bottom-3 left-4 right-4 text-white">
                        <h3 className="font-serif font-bold text-lg leading-snug drop-shadow-sm group-hover:text-emerald-200 transition">
                          {album.title}
                        </h3>
                        {album.eventName && (
                          <p className="text-xs text-slate-200 font-light truncate mt-0.5">
                            {album.eventName}
                          </p>
                        )}
                      </div>
                    </div>

                    {/* Album Card Metadata */}
                    <div className="p-4 flex-1 flex flex-col justify-between space-y-3">
                      {album.description && (
                        <p className="text-xs text-slate-600 line-clamp-2 leading-relaxed font-light">
                          {album.description}
                        </p>
                      )}

                      <div className="flex flex-wrap items-center justify-between text-[11px] text-slate-500 pt-2 border-t border-slate-100">
                        <div className="flex items-center gap-3">
                          {album.eventDate && (
                            <span className="flex items-center gap-1">
                              <Calendar className="w-3 h-3 text-slate-400" />
                              <span>{album.eventDate}</span>
                            </span>
                          )}
                          {album.location && (
                            <span className="flex items-center gap-1">
                              <MapPin className="w-3 h-3 text-slate-400" />
                              <span className="truncate max-w-[150px]">{album.location}</span>
                            </span>
                          )}
                        </div>

                        <span className="text-[#18392B] font-bold group-hover:translate-x-0.5 transition flex items-center gap-0.5 text-xs">
                          View Album &rarr;
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* VIEW 2: SINGLE ALBUM DETAIL (FACEBOOK COLLAGE / MOSAIC) */}
      {currentAlbum && (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 space-y-6">
          {/* Breadcrumb & Album Header */}
          <div className="bg-white border border-slate-200 rounded-sm p-5 sm:p-6 shadow-2xs space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <button
                type="button"
                onClick={() => setActiveAlbumId(null)}
                className="inline-flex items-center gap-2 text-xs font-bold text-[#18392B] hover:text-[#588B76] transition cursor-pointer w-fit"
              >
                <ArrowLeft className="w-4 h-4" />
                <span>Back to All Albums</span>
              </button>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() =>
                    openLightbox(currentAlbum.photos, 0, {
                      title: currentAlbum.title,
                      event: currentAlbum.eventName,
                      date: currentAlbum.eventDate,
                      location: currentAlbum.location,
                    })
                  }
                  className="px-4 py-2 bg-[#18392B] hover:bg-[#10261D] text-white text-xs font-bold rounded-sm flex items-center gap-1.5 cursor-pointer shadow-xs transition"
                >
                  <Maximize2 className="w-3.5 h-3.5" />
                  <span>Start Slideshow / Fullscreen</span>
                </button>
              </div>
            </div>

            <div className="space-y-2 border-t border-slate-100 pt-4">
              <h3 className="font-serif text-2xl sm:text-3xl font-bold text-[#18392B]">
                {currentAlbum.title}
              </h3>
              {currentAlbum.description && (
                <p className="text-xs sm:text-sm text-slate-600 max-w-4xl leading-relaxed font-light">
                  {currentAlbum.description}
                </p>
              )}

              <div className="flex flex-wrap items-center gap-4 text-xs text-slate-500 pt-1">
                {currentAlbum.eventName && (
                  <span className="font-medium text-slate-700">
                    Event: <span className="font-normal text-slate-600">{currentAlbum.eventName}</span>
                  </span>
                )}
                {currentAlbum.eventDate && (
                  <span className="flex items-center gap-1">
                    <Calendar className="w-3.5 h-3.5 text-slate-400" />
                    <span>{currentAlbum.eventDate}</span>
                  </span>
                )}
                {currentAlbum.location && (
                  <span className="flex items-center gap-1">
                    <MapPin className="w-3.5 h-3.5 text-slate-400" />
                    <span>{currentAlbum.location}</span>
                  </span>
                )}
                <span className="bg-[#18392B]/10 text-[#18392B] font-mono text-[11px] font-bold px-2 py-0.5 rounded-xs">
                  {currentAlbum.photos.length} Photos
                </span>
              </div>
            </div>
          </div>

          {/* Facebook-style Photo Collage or Grid */}
          {currentAlbum.photos.length === 0 ? (
            <div className="text-center py-16 bg-white border border-slate-200 rounded-sm p-8">
              <Camera className="w-10 h-10 text-slate-300 mx-auto mb-2 stroke-1" />
              <p className="text-xs text-slate-500">No photos have been added to this album yet.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {currentAlbum.photos.map((photo, index) => {
                return (
                  <div
                    key={photo.id}
                    onClick={() =>
                      openLightbox(currentAlbum.photos, index, {
                        title: currentAlbum.title,
                        event: currentAlbum.eventName,
                        date: currentAlbum.eventDate,
                        location: currentAlbum.location,
                      })
                    }
                    className="group relative bg-slate-100 border border-slate-200 rounded-sm overflow-hidden shadow-2xs hover:shadow-md hover:border-[#588B76] transition cursor-pointer h-60"
                  >
                    <Image
                      src={photo.imageUrl}
                      alt={photo.caption || photo.fileName || currentAlbum.title}
                      fill
                      sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
                      className="object-cover group-hover:scale-105 transition-transform duration-300"
                      referrerPolicy="no-referrer"
                    />

                    {/* Gradient Overlay for Caption */}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex flex-col justify-end p-3">
                      {photo.caption ? (
                        <p className="text-white text-xs font-light line-clamp-2 leading-snug">
                          {photo.caption}
                        </p>
                      ) : (
                        <p className="text-slate-300 text-[11px] italic">
                          Click to view photo
                        </p>
                      )}
                      <span className="text-[10px] text-emerald-300 font-mono mt-1">
                        #{index + 1} of {currentAlbum.photos.length}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* VIEW 3: ALL PHOTOS FLAT GRID */}
      {activeTab === 'all-photos' && !currentAlbum && (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 space-y-4">
          {filteredAllPhotos.length === 0 ? (
            <div className="text-center py-16 bg-slate-50 border border-dashed border-slate-200 rounded-sm p-8 max-w-lg mx-auto">
              <Camera className="w-10 h-10 text-slate-300 mx-auto mb-2 stroke-1" />
              <p className="text-sm font-semibold text-slate-700">No photos found</p>
              <p className="text-xs text-slate-500 mt-1">Try another search or switch to Albums view.</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
              {filteredAllPhotos.map((item, index) => {
                return (
                  <div
                    key={item.photo.id}
                    onClick={() =>
                      openLightbox(
                        filteredAllPhotos.map((i) => i.photo),
                        index,
                        {
                          title: item.album.title,
                          event: item.album.eventName,
                          date: item.album.eventDate,
                          location: item.album.location,
                        }
                      )
                    }
                    className="group relative bg-slate-100 border border-slate-200 rounded-sm overflow-hidden h-44 shadow-2xs hover:shadow-xs hover:border-[#588B76] transition cursor-pointer"
                  >
                    <Image
                      src={item.photo.imageUrl}
                      alt={item.photo.caption || item.album.title}
                      fill
                      sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 20vw"
                      className="object-cover group-hover:scale-105 transition-transform duration-300"
                      referrerPolicy="no-referrer"
                    />

                    {/* Overlay */}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity p-2 flex flex-col justify-end">
                      <p className="text-[10px] text-emerald-300 font-medium truncate">
                        {item.album.title}
                      </p>
                      {item.photo.caption && (
                        <p className="text-white text-[11px] line-clamp-1">
                          {item.photo.caption}
                        </p>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* FULLSCREEN FACEBOOK-INSPIRED LIGHTBOX */}
      {lightboxState.isOpen && currentPhoto && (
        <div className="fixed inset-0 z-50 bg-black/95 backdrop-blur-md flex flex-col justify-between select-none animate-in fade-in duration-200">
          {/* Top Bar */}
          <div className="flex items-center justify-between px-4 py-3 bg-black/40 text-white border-b border-white/10 z-20">
            <div className="flex items-center gap-3">
              <span className="font-serif font-bold text-sm text-white drop-shadow-xs">
                {lightboxState.albumTitle || 'Student Life in Pictures'}
              </span>
              <span className="text-xs font-mono text-slate-300 bg-white/10 px-2 py-0.5 rounded-full">
                {lightboxState.currentIndex + 1} / {lightboxState.photos.length}
              </span>
            </div>

            <div className="flex items-center gap-2">
              <a
                href={currentPhoto.imageUrl}
                target="_blank"
                rel="noreferrer"
                className="p-2 text-slate-300 hover:text-white hover:bg-white/10 rounded-full transition cursor-pointer"
                title="Open original photo in new tab"
              >
                <ExternalLink className="w-4 h-4" />
              </a>

              <button
                type="button"
                onClick={closeLightbox}
                className="p-2 text-slate-300 hover:text-white hover:bg-white/10 rounded-full transition cursor-pointer"
                title="Close viewer (Esc)"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Center Display: Photo with Left/Right Nav */}
          <div className="relative flex-1 flex items-center justify-center p-4 sm:p-8 min-h-0 overflow-hidden">
            {/* Previous Button */}
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                prevPhoto();
              }}
              className="absolute left-3 sm:left-6 p-3 rounded-full bg-black/50 hover:bg-black/80 text-white backdrop-blur-xs transition z-20 cursor-pointer shadow-lg"
              title="Previous photo (Left arrow)"
            >
              <ChevronLeft className="w-6 h-6" />
            </button>

            {/* Next Button */}
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                nextPhoto();
              }}
              className="absolute right-3 sm:right-6 p-3 rounded-full bg-black/50 hover:bg-black/80 text-white backdrop-blur-xs transition z-20 cursor-pointer shadow-lg"
              title="Next photo (Right arrow)"
            >
              <ChevronRight className="w-6 h-6" />
            </button>

            {/* Active Image Container */}
            <div className="relative w-full h-full max-w-6xl max-h-[75vh] flex items-center justify-center">
              <Image
                src={currentPhoto.imageUrl}
                alt={currentPhoto.caption || 'Campus photo'}
                fill
                priority
                className="object-contain"
                sizes="(max-width: 1280px) 100vw, 1200px"
                referrerPolicy="no-referrer"
              />
            </div>
          </div>

          {/* Bottom Bar: Caption & Filmstrip Carousel */}
          <div className="bg-black/60 backdrop-blur-md border-t border-white/10 text-white px-4 py-3 z-20 space-y-3">
            {/* Caption & Metadata */}
            <div className="max-w-4xl mx-auto text-center space-y-1">
              {currentPhoto.caption && (
                <p className="text-sm text-slate-100 font-light leading-relaxed">
                  {currentPhoto.caption}
                </p>
              )}
              <div className="flex flex-wrap items-center justify-center gap-x-4 text-xs text-slate-400">
                {lightboxState.albumEvent && <span>{lightboxState.albumEvent}</span>}
                {lightboxState.albumDate && <span>• {lightboxState.albumDate}</span>}
                {lightboxState.albumLocation && <span>• {lightboxState.albumLocation}</span>}
              </div>
            </div>

            {/* Bottom Filmstrip Carousel */}
            {lightboxState.photos.length > 1 && (
              <div className="flex items-center justify-center gap-2 overflow-x-auto py-1 max-w-2xl mx-auto">
                {lightboxState.photos.map((p, idx) => {
                  const isSelected = idx === lightboxState.currentIndex;
                  return (
                    <button
                      key={p.id}
                      type="button"
                      onClick={() =>
                        setLightboxState((prev) => ({ ...prev, currentIndex: idx }))
                      }
                      className={`relative w-12 h-12 rounded-xs overflow-hidden shrink-0 transition cursor-pointer ${
                        isSelected
                          ? 'ring-2 ring-emerald-400 scale-105'
                          : 'opacity-50 hover:opacity-100'
                      }`}
                    >
                      <Image
                        src={p.thumbnailUrl || p.imageUrl}
                        alt="thumb"
                        fill
                        className="object-cover"
                        referrerPolicy="no-referrer"
                      />
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}
    </section>
  );
};
