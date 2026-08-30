'use client';

import React, { useState } from 'react';
import { usePCM } from '@/lib/store';
import {
  X,
  Play,
  Pause,
  Volume2,
  Calendar,
  User,
  BookOpen,
  Download,
  Share2,
  Check,
} from 'lucide-react';

export const SermonPlayerModal: React.FC = () => {
  const { selectedSermon, setSelectedSermon, addToast } = usePCM();
  const [isPlaying, setIsPlaying] = useState(false);
  const [progress, setProgress] = useState(25);

  if (!selectedSermon) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div
        className="bg-white rounded-xl shadow-2xl border border-slate-200 max-w-2xl w-full max-h-[90vh] overflow-y-auto font-sans animate-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="bg-[#18392B] text-white p-6 border-b border-[#588B76]/40 flex items-start justify-between">
          <div>
            <div className="flex items-center gap-2 mb-1.5">
              <span className="text-[10px] font-mono font-bold uppercase tracking-wider bg-[#588B76] text-[#18392B] px-2 py-0.5 rounded">
                PCM Chapel Audio & Media
              </span>
              <span className="text-xs text-[#85AA9B] font-mono">{selectedSermon.duration}</span>
            </div>
            <h3 className="font-serif text-xl sm:text-2xl font-bold text-white">
              {selectedSermon.title}
            </h3>
          </div>

          <button
            onClick={() => setSelectedSermon(null)}
            className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition cursor-pointer"
            aria-label="Close"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Media Player Console */}
        <div className="p-6 sm:p-8 space-y-6 text-slate-700 text-sm">
          {/* Simulated Audio Wave Player */}
          <div className="bg-[#18392B] text-white p-6 rounded-2xl border border-slate-700 shadow-xl space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-[#85AA9B] font-mono uppercase">Preacher</p>
                <h4 className="font-serif text-lg font-bold">{selectedSermon.speaker}</h4>
              </div>
              <div className="text-right">
                <p className="text-xs text-slate-400 font-mono">Scripture Text</p>
                <h4 className="font-serif text-sm font-bold text-[#85AA9B]">{selectedSermon.passage}</h4>
              </div>
            </div>

            {/* Simulated Scrubber Bar */}
            <div className="space-y-1.5">
              <div
                className="h-2 bg-slate-700 rounded-full overflow-hidden cursor-pointer relative"
                onClick={(e) => {
                  const rect = e.currentTarget.getBoundingClientRect();
                  const clickX = e.clientX - rect.left;
                  setProgress(Math.round((clickX / rect.width) * 100));
                }}
              >
                <div
                  className="h-full bg-gradient-to-r from-[#588B76] to-[#85AA9B] rounded-full transition-all"
                  style={{ width: `${progress}%` }}
                />
              </div>
              <div className="flex justify-between text-[10px] font-mono text-slate-400">
                <span>08:45</span>
                <span>{selectedSermon.duration}</span>
              </div>
            </div>

            {/* Playback Controls */}
            <div className="flex items-center justify-center gap-6 pt-2">
              <button
                onClick={() => setProgress((p) => Math.max(0, p - 10))}
                className="text-slate-400 hover:text-white text-xs font-mono transition"
              >
                -15s
              </button>

              <button
                onClick={() => setIsPlaying(!isPlaying)}
                className="w-14 h-14 rounded-full bg-[#588B76] hover:bg-[#85AA9B] text-[#18392B] flex items-center justify-center shadow-lg transition transform hover:scale-105 cursor-pointer"
              >
                {isPlaying ? (
                  <Pause className="w-6 h-6 fill-current" />
                ) : (
                  <Play className="w-6 h-6 fill-current ml-0.5" />
                )}
              </button>

              <button
                onClick={() => setProgress((p) => Math.min(100, p + 10))}
                className="text-slate-400 hover:text-white text-xs font-mono transition"
              >
                +15s
              </button>
            </div>
          </div>

          {/* Description & Exegesis Notes */}
          <div className="space-y-2">
            <h4 className="font-serif text-base font-bold text-[#18392B] flex items-center gap-2">
              <BookOpen className="w-4 h-4 text-[#588B76]" />
              <span>Sermon Summary & Expository Outline</span>
            </h4>
            <p className="text-slate-600 leading-relaxed text-xs sm:text-sm">
              {selectedSermon.description}
            </p>
          </div>

          <div className="flex items-center gap-4 pt-2">
            <button
              onClick={() =>
                addToast({
                  title: 'Download Initiated',
                  message: `Downloading MP3 and Sermon Study Handout for "${selectedSermon.title}".`,
                  type: 'success',
                })
              }
              className="bg-slate-100 hover:bg-slate-200 text-[#18392B] text-xs font-semibold px-4 py-2.5 rounded border border-slate-300 transition flex items-center gap-2 cursor-pointer"
            >
              <Download className="w-3.5 h-3.5 text-[#588B76]" />
              <span>Download Audio & Manuscript</span>
            </button>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="bg-slate-50 p-4 sm:px-8 border-t border-slate-200 flex justify-end">
          <button
            onClick={() => setSelectedSermon(null)}
            className="text-xs font-semibold text-slate-600 hover:text-slate-900 transition cursor-pointer"
          >
            Close Media Player
          </button>
        </div>
      </div>
    </div>
  );
};
