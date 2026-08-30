'use client';

import React, { useState } from 'react';
import Image from 'next/image';
import { usePCM } from '@/lib/store';
import { Quote, ChevronLeft, ChevronRight, Sparkles, GraduationCap } from 'lucide-react';

export const TestimonialsSection: React.FC = () => {
  const { testimonials } = usePCM();
  const [currentIndex, setCurrentIndex] = useState(0);

  if (testimonials.length === 0) return null;

  const current = testimonials[currentIndex % testimonials.length];

  return (
    <section className="w-full bg-[#D0DED8]/20 py-16 lg:py-24 border-b border-[#D0DED8]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center max-w-3xl mx-auto mb-12 space-y-2">
          <div className="inline-flex items-center gap-1.5 text-xs font-bold text-[#588B76] uppercase tracking-widest font-mono">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Transforming Lives</span>
          </div>
          <h2 className="font-serif text-3xl sm:text-4xl font-extrabold text-[#18392B]">
            HEAR FROM OUR COMMUNITY
          </h2>
          <p className="text-xs sm:text-sm text-[#18392B]/75">
            Stories of faith, spiritual growth, pastoral preparation, and kingdom impact from students, alumni, faculty, and ministry partners.
          </p>
        </div>

        {/* Big Testimonial Display Card */}
        <div className="max-w-4xl mx-auto bg-white rounded-2xl border border-[#D0DED8] shadow-xl p-8 sm:p-12 relative overflow-hidden">
          {/* Subtle Quote Watermark */}
          <Quote className="absolute -top-4 -right-4 w-32 h-32 text-[#D0DED8]/40 rotate-180 pointer-events-none" />

          <div className="relative z-10 space-y-6">
            {/* Category Tag */}
            <div className="inline-flex items-center gap-2 bg-[#18392B] text-[#D0DED8] px-3 py-1 rounded-full text-xs font-mono font-bold uppercase tracking-wider">
              <GraduationCap className="w-3.5 h-3.5" />
              <span>{current.category} Spotlight</span>
            </div>

            {/* Main Quote Text */}
            <blockquote className="font-serif text-lg sm:text-xl md:text-2xl text-[#18392B] leading-relaxed italic">
              &ldquo;{current.quote}&rdquo;
            </blockquote>

            {/* Author Profile */}
            <div className="pt-6 border-t border-[#D0DED8] flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="flex items-center gap-4">
                {current.avatarUrl && (
                  <div className="relative w-14 h-14 rounded-full overflow-hidden border-2 border-[#588B76] shadow-sm shrink-0">
                    <Image
                      src={current.avatarUrl}
                      alt={current.name}
                      fill
                      className="object-cover"
                      sizes="56px"
                      referrerPolicy="no-referrer"
                    />
                  </div>
                )}
                <div>
                  <h4 className="font-serif text-base font-bold text-[#18392B]">
                    {current.name}
                  </h4>
                  <p className="text-xs font-semibold text-[#588B76]">
                    {current.role}
                  </p>
                  <p className="text-[11px] text-[#18392B]/70">
                    {current.programOrMinistry}
                  </p>
                </div>
              </div>

              {/* Slider Navigation Buttons */}
              <div className="flex items-center gap-2 self-end sm:self-center">
                <button
                  onClick={() =>
                    setCurrentIndex((prev) => (prev === 0 ? testimonials.length - 1 : prev - 1))
                  }
                  className="w-10 h-10 rounded-full border border-[#D0DED8] hover:border-[#588B76] hover:bg-[#18392B] hover:text-white flex items-center justify-center text-[#18392B] transition cursor-pointer"
                  aria-label="Previous Testimonial"
                >
                  <ChevronLeft className="w-5 h-5" />
                </button>
                <span className="text-xs font-mono font-semibold text-[#18392B]/70 px-1">
                  {currentIndex + 1} / {testimonials.length}
                </span>
                <button
                  onClick={() => setCurrentIndex((prev) => (prev + 1) % testimonials.length)}
                  className="w-10 h-10 rounded-full border border-[#D0DED8] hover:border-[#588B76] hover:bg-[#18392B] hover:text-white flex items-center justify-center text-[#18392B] transition cursor-pointer"
                  aria-label="Next Testimonial"
                >
                  <ChevronRight className="w-5 h-5" />
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
