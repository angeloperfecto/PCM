'use client';

import React, { useEffect } from 'react';

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error('PCM Application Error:', error);
  }, [error]);

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-white text-[#18392B] px-4 text-center">
      <div className="w-16 h-16 rounded-full bg-amber-500/10 flex items-center justify-center mb-4">
        <span className="font-serif text-2xl font-bold text-amber-700">!</span>
      </div>
      <h1 className="font-serif text-2xl sm:text-3xl font-bold text-[#18392B] mb-2">
        Something went wrong
      </h1>
      <p className="text-sm text-slate-600 max-w-md mb-6 leading-relaxed">
        An unexpected application error occurred. You can attempt to reload the view or return to the main dashboard.
      </p>
      <div className="flex items-center gap-3">
        <button
          onClick={() => reset()}
          className="inline-flex items-center gap-2 bg-[#18392B] text-white px-5 py-2.5 rounded-lg text-xs font-semibold hover:bg-[#588B76] transition-colors shadow-xs cursor-pointer"
        >
          Try Again
        </button>
        <button
          onClick={() => {
            if (typeof window !== 'undefined') window.location.href = '/';
          }}
          className="inline-flex items-center gap-2 bg-slate-100 text-slate-700 px-5 py-2.5 rounded-lg text-xs font-semibold hover:bg-slate-200 transition-colors shadow-xs cursor-pointer"
        >
          Reload App
        </button>
      </div>
    </div>
  );
}
