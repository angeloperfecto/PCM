'use client';

import React, { useState } from 'react';
import {
  Calendar,
  MapPin,
  Camera,
  ArrowLeft,
  Maximize2,
  Share2,
  Check,
  Newspaper,
  User,
  Sparkles,
} from 'lucide-react';
import { StudentLifeAlbum } from '@/lib/types';
import { parsePhotoStory } from '@/lib/galleryStoryParser';

interface AlbumEditorialHeaderProps {
  album: StudentLifeAlbum;
  onBack: () => void;
  onStartSlideshow: () => void;
  layoutMode?: 'mosaic' | 'grid';
  onChangeLayoutMode?: (mode: 'mosaic' | 'grid') => void;
}

export const AlbumEditorialHeader: React.FC<AlbumEditorialHeaderProps> = ({
  album,
  onBack,
  onStartSlideshow,
  layoutMode = 'mosaic',
  onChangeLayoutMode,
}) => {
  const [copied, setCopied] = useState(false);
  const story = parsePhotoStory(album);

  const handleShare = async () => {
    try {
      const url = typeof window !== 'undefined' ? window.location.href : '';
      if (navigator.clipboard) {
        await navigator.clipboard.writeText(url);
        setCopied(true);
        setTimeout(() => setCopied(false), 2500);
      }
    } catch {
      // Fallback
    }
  };

  return (
    <article className="bg-white border border-slate-200 rounded-sm p-6 sm:p-8 shadow-2xs space-y-6">
      {/* Top action row */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 pb-4">
        <button
          type="button"
          onClick={onBack}
          className="inline-flex items-center gap-2 text-xs font-bold text-[#18392B] hover:text-[#588B76] transition cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to All Albums</span>
        </button>

        <div className="flex flex-wrap items-center gap-2">
          {onChangeLayoutMode && (
            <div className="flex items-center bg-slate-100 p-0.5 rounded-xs text-[11px] font-medium text-slate-600">
              <button
                type="button"
                onClick={() => onChangeLayoutMode('mosaic')}
                className={`px-2.5 py-1 rounded-2xs transition cursor-pointer ${
                  layoutMode === 'mosaic'
                    ? 'bg-white text-[#18392B] font-bold shadow-2xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Editorial Layout
              </button>
              <button
                type="button"
                onClick={() => onChangeLayoutMode('grid')}
                className={`px-2.5 py-1 rounded-2xs transition cursor-pointer ${
                  layoutMode === 'grid'
                    ? 'bg-white text-[#18392B] font-bold shadow-2xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Grid View
              </button>
            </div>
          )}

          <button
            type="button"
            onClick={handleShare}
            className="px-3 py-1.5 border border-slate-200 text-xs font-semibold text-slate-700 hover:bg-slate-50 rounded-sm flex items-center gap-1.5 cursor-pointer transition shadow-2xs"
            title="Copy share link"
          >
            {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Share2 className="w-3.5 h-3.5 text-slate-500" />}
            <span>{copied ? 'Link Copied' : 'Share'}</span>
          </button>

          <button
            type="button"
            onClick={onStartSlideshow}
            className="px-4 py-1.5 bg-[#18392B] hover:bg-[#10261D] text-white text-xs font-bold rounded-sm flex items-center gap-1.5 cursor-pointer shadow-xs transition"
          >
            <Maximize2 className="w-3.5 h-3.5" />
            <span>Fullscreen Slideshow</span>
          </button>
        </div>
      </div>

      {/* Editorial Headline & Category */}
      <div className="space-y-3">
        <div className="flex flex-wrap items-center gap-2">
          <span className="bg-[#18392B] text-white text-[11px] font-mono font-bold tracking-wider uppercase px-2.5 py-0.5 rounded-xs">
            {story.category || 'IN PHOTOS'}
          </span>
          {story.storyDate && (
            <span className="text-xs text-slate-500 font-mono flex items-center gap-1">
              <Calendar className="w-3.5 h-3.5 text-slate-400" />
              <span>{story.storyDate}</span>
            </span>
          )}
          {story.location && (
            <span className="text-xs text-slate-500 flex items-center gap-1">
              <MapPin className="w-3.5 h-3.5 text-slate-400" />
              <span>{story.location}</span>
            </span>
          )}
        </div>

        <h1 className="font-serif text-2xl sm:text-3xl md:text-4xl font-bold text-[#18392B] leading-tight max-w-5xl">
          {story.displayTitle}
        </h1>

        {story.cleanEventName && (
          <p className="text-xs sm:text-sm font-medium text-emerald-900 bg-emerald-50/60 border-l-2 border-[#18392B] pl-3 py-1">
            Event Context: {story.cleanEventName}
          </p>
        )}
      </div>

      {/* Story Narrative Paragraphs */}
      {story.paragraphs.length > 0 && (
        <div className="space-y-3 text-slate-700 text-sm sm:text-base leading-relaxed max-w-4xl border-t border-slate-100 pt-4">
          {story.paragraphs.map((p, idx) => (
            <p key={idx} className="text-justify font-normal">
              {p}
            </p>
          ))}
        </div>
      )}

      {/* Editorial Metadata / Credits Strip */}
      <div className="flex flex-wrap items-center justify-between gap-4 pt-4 border-t border-slate-100 text-xs">
        <div className="flex flex-wrap items-center gap-3">
          {story.photographer && (
            <div className="flex items-center gap-1.5 bg-[#18392B]/5 text-[#18392B] px-3 py-1 rounded-xs font-medium">
              <Camera className="w-3.5 h-3.5 text-[#18392B]" />
              <span>Photos by: <strong className="font-semibold text-slate-900">{story.photographer}</strong></span>
            </div>
          )}

          {story.publisher && (
            <div className="flex items-center gap-1.5 text-slate-600 bg-slate-50 px-3 py-1 rounded-xs italic">
              <Newspaper className="w-3.5 h-3.5 text-slate-400" />
              <span>{story.publisher}</span>
            </div>
          )}
        </div>

        <div className="flex items-center gap-2 text-slate-500 font-mono text-xs">
          <span className="bg-slate-100 px-2.5 py-1 rounded-xs text-slate-700 font-bold">
            {album.photos?.length || 0} {album.photos?.length === 1 ? 'Photograph' : 'Photographs'}
          </span>
        </div>
      </div>
    </article>
  );
};
