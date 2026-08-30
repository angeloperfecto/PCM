'use client';

import React from 'react';
import Image from 'next/image';
import { usePCM } from '@/lib/store';
import {
  X,
  Calendar,
  User,
  Clock,
  Share2,
  Bookmark,
  Sparkles,
  Check,
} from 'lucide-react';

export const ArticleDetailModal: React.FC = () => {
  const { selectedArticle, setSelectedArticle, addToast } = usePCM();
  const [copied, setCopied] = React.useState(false);

  if (!selectedArticle) return null;

  const handleShare = () => {
    navigator.clipboard?.writeText(window.location.href);
    setCopied(true);
    addToast({
      title: 'Link Copied',
      message: 'Article link copied to clipboard.',
      type: 'success',
    });
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-in fade-in duration-200">
      <div
        className="bg-white rounded-xl shadow-2xl border border-slate-200 max-w-3xl w-full max-h-[90vh] overflow-y-auto font-sans animate-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header Photo */}
        <div className="relative h-64 sm:h-72 w-full overflow-hidden bg-[#18392B]">
          <Image
            src={selectedArticle.imageUrl}
            alt={selectedArticle.title}
            fill
            className="object-cover"
            sizes="(max-width: 768px) 100vw, 768px"
            referrerPolicy="no-referrer"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-[#18392B] via-[#18392B]/40 to-transparent" />

          {/* Close button */}
          <button
            onClick={() => setSelectedArticle(null)}
            className="absolute top-4 right-4 bg-black/60 hover:bg-black text-white p-2 rounded-full transition cursor-pointer z-10"
            aria-label="Close"
          >
            <X className="w-5 h-5" />
          </button>

          {/* Tag & Meta */}
          <div className="absolute bottom-4 left-6 right-6 text-white space-y-1">
            <span className="bg-[#588B76] text-[#18392B] text-[10px] font-mono font-bold uppercase tracking-wider px-2.5 py-0.5 rounded">
              {selectedArticle.category}
            </span>
            <h2 className="font-serif text-xl sm:text-2xl font-bold leading-tight drop-shadow">
              {selectedArticle.title}
            </h2>
          </div>
        </div>

        {/* Article Meta Strip */}
        <div className="px-6 py-3 bg-[#FFFFFF] border-b border-slate-200 flex flex-wrap items-center justify-between text-xs text-slate-600 gap-2">
          <div className="flex items-center gap-4">
            <span className="flex items-center gap-1.5 font-medium">
              <User className="w-3.5 h-3.5 text-[#588B76]" />
              {selectedArticle.author}
            </span>
            <span>•</span>
            <span className="flex items-center gap-1.5">
              <Calendar className="w-3.5 h-3.5 text-[#588B76]" />
              {selectedArticle.date}
            </span>
            <span>•</span>
            <span className="flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5 text-slate-400" />
              {selectedArticle.readTime}
            </span>
          </div>

          <button
            onClick={handleShare}
            className="flex items-center gap-1 text-slate-700 hover:text-[#588B76] font-semibold transition cursor-pointer"
          >
            {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Share2 className="w-3.5 h-3.5" />}
            <span>{copied ? 'Copied' : 'Share'}</span>
          </button>
        </div>

        {/* Article Content */}
        <div className="p-6 sm:p-8 space-y-4 text-slate-800 text-sm leading-relaxed">
          <p className="font-serif text-base sm:text-lg italic text-[#18392B] border-l-4 border-[#588B76] pl-4 py-1 bg-amber-50/40 rounded-r">
            {selectedArticle.excerpt}
          </p>

          <div className="space-y-4 pt-2 text-slate-700">
            {selectedArticle.content.split('\n\n').map((paragraph, idx) => (
              <p key={idx}>{paragraph}</p>
            ))}
          </div>

          {/* Tags */}
          <div className="pt-6 border-t border-slate-200 flex flex-wrap items-center gap-2">
            <span className="text-xs font-semibold text-slate-500">Filed under:</span>
            {selectedArticle.tags.map((tag, idx) => (
              <span
                key={idx}
                className="text-[11px] bg-slate-100 text-slate-700 px-2.5 py-1 rounded-full border border-slate-200"
              >
                #{tag}
              </span>
            ))}
          </div>
        </div>

        {/* Modal Footer */}
        <div className="bg-slate-50 p-4 sm:px-8 border-t border-slate-200 flex justify-end">
          <button
            onClick={() => setSelectedArticle(null)}
            className="bg-[#18392B] hover:bg-[#14234b] text-white text-xs font-semibold px-6 py-2.5 rounded transition cursor-pointer"
          >
            Close Article
          </button>
        </div>
      </div>
    </div>
  );
};
