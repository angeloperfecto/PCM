import React from 'react';
import Link from 'next/link';

export default function NotFound() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-white text-[#18392B] px-4 text-center">
      <div className="w-16 h-16 rounded-full bg-[#18392B]/10 flex items-center justify-center mb-4">
        <span className="font-serif text-2xl font-bold text-[#18392B]">404</span>
      </div>
      <h1 className="font-serif text-2xl sm:text-3xl font-bold text-[#18392B] mb-2">
        Page Not Found
      </h1>
      <p className="text-sm text-slate-600 max-w-md mb-6 leading-relaxed">
        The requested page or resource could not be found. Please return to the Philippine College of Ministry homepage.
      </p>
      <Link
        href="/"
        className="inline-flex items-center gap-2 bg-[#18392B] text-white px-5 py-2.5 rounded-lg text-xs font-semibold hover:bg-[#588B76] transition-colors shadow-xs"
      >
        Return to Home
      </Link>
    </div>
  );
}
