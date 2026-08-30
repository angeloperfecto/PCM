'use client';

import React, { useState, useEffect } from 'react';
import { usePCM } from '@/lib/store';
import {
  ArrowRight,
  GraduationCap,
  BookOpen,
  Award,
  ShieldCheck,
  ChevronLeft,
  ChevronRight,
  Play,
} from 'lucide-react';

const HERO_SLIDES = [
  {
    image: 'https://images.unsplash.com/photo-1523240795612-9a054b0db644?q=80&w=1600&auto=format&fit=crop',
    tag: 'Accredited Theological Education',
    headline: 'EQUIPPING SERVANTS FOR KINGDOM IMPACT',
    subtext:
      'Philippine College of Ministry exists to equip men and women with biblical knowledge, spiritual maturity, and practical ministry skills for faithful service to Christ, the Church, and the community.',
  },
  {
    image: 'https://images.unsplash.com/photo-1511578314322-379afb476865?q=80&w=1600&auto=format&fit=crop',
    tag: 'Spiritual Formation & Worship',
    headline: 'ROOTED IN TRUTH. PASSIONATE IN WORSHIP.',
    subtext:
      'Cultivating humble shepherd hearts through daily corporate chapel, intensive Greek & Hebrew exegesis, and intimate faculty discipleship mentorship.',
  },
  {
    image: 'https://images.unsplash.com/photo-1559027615-cd4628902d4a?q=80&w=1600&auto=format&fit=crop',
    tag: 'Hands-On Pastoral Apprenticeship',
    headline: 'REAL-WORLD MINISTRY IN 85+ LOCAL CHURCHES',
    subtext:
      'Every PCM student participates in supervised weekly pulpit ministry, urban church planting, youth discipleship, and compassionate community missions.',
  },
];

export const HeroSection: React.FC = () => {
  const { navigateTo, setRequestInfoModalOpen, setSelectedSermon, sermons } = usePCM();
  const [currentSlide, setCurrentSlide] = useState(0);

  // Auto-advance slides every 7 seconds
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % HERO_SLIDES.length);
    }, 7000);
    return () => clearInterval(timer);
  }, []);

  const slide = HERO_SLIDES[currentSlide];

  return (
    <section className="relative w-full min-h-[560px] lg:min-h-[640px] bg-[#18392B] text-white overflow-hidden flex items-center">
      {/* Background Slideshow with Smooth Crossfade */}
      {HERO_SLIDES.map((s, idx) => (
        <div
          key={idx}
          className={`absolute inset-0 transition-opacity duration-1000 ease-in-out ${
            idx === currentSlide ? 'opacity-100 scale-100' : 'opacity-0 scale-105'
          }`}
          style={{
            backgroundImage: `url(${s.image})`,
            backgroundSize: 'cover',
            backgroundPosition: 'center 30%',
          }}
        >
          {/* High Density Gradient Overlays */}
          <div className="absolute inset-0 bg-gradient-to-r from-[#10261D]/95 via-[#18392B]/85 to-[#18392B]/60" />
          <div className="absolute inset-0 bg-gradient-to-t from-[#10261D] via-transparent to-transparent" />
        </div>
      ))}

      {/* Decorative Sage Ambient Accent */}
      <div className="absolute top-10 right-10 w-96 h-96 bg-[#85AA9B]/10 rounded-full blur-3xl pointer-events-none" />

      {/* Hero Content Container */}
      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 lg:py-20 z-10 w-full">
        <div className="max-w-3xl space-y-4">
          {/* Deep Sage Accent Bar */}
          <div className="w-12 h-1 bg-[#588B76]" />

          {/* Institutional Badge */}
          <div className="inline-flex items-center gap-2 bg-[#18392B]/90 border border-[#588B76]/60 px-3 py-1 rounded-sm text-xs font-semibold text-[#D0DED8] shadow-sm">
            <span className="w-2 h-2 rounded-full bg-[#85AA9B] animate-pulse" />
            <span className="tracking-widest uppercase font-mono text-[11px]">{slide.tag}</span>
          </div>

          {/* Main Headline */}
          <h1 className="font-serif text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold tracking-tight text-white leading-[1.1]">
            {slide.headline}
          </h1>

          {/* Supporting Text with Sage border accent */}
          <p className="text-[#D0DED8] text-sm sm:text-base md:text-lg leading-relaxed font-sans max-w-2xl border-l-2 border-[#588B76] pl-5">
            {slide.subtext}
          </p>

          {/* Action CTAs */}
          <div className="pt-3 flex flex-col sm:flex-row items-stretch sm:items-center gap-3 sm:gap-3.5">
            <button
              id="hero-cta-apply"
              onClick={() => navigateTo('apply')}
              className="flex items-center justify-center gap-2 bg-[#588B76] text-white font-bold px-6 sm:px-7 py-3 sm:py-3.5 uppercase text-xs tracking-widest hover:bg-[#46705F] rounded-sm shadow-md transition cursor-pointer text-center"
            >
              <span>APPLY NOW FOR 2026–2027</span>
              <ArrowRight className="w-4 h-4" />
            </button>

            <button
              id="hero-cta-explore"
              onClick={() => navigateTo('academics')}
              className="flex items-center justify-center gap-2 border border-[#D0DED8] text-white font-bold px-5 sm:px-6 py-3 sm:py-3.5 uppercase text-xs tracking-widest hover:bg-white hover:text-[#18392B] rounded-sm transition cursor-pointer text-center"
            >
              <BookOpen className="w-4 h-4 text-[#85AA9B]" />
              <span>EXPLORE PROGRAMS</span>
            </button>

            {sermons.length > 0 && (
              <button
                id="hero-cta-watch-convocation"
                onClick={() => setSelectedSermon(sermons[0])}
                className="hidden md:flex items-center gap-2 text-[#D0DED8] hover:text-white px-3 py-2 text-xs font-medium transition cursor-pointer"
              >
                <div className="w-7 h-7 rounded-full bg-[#588B76]/30 border border-[#588B76] flex items-center justify-center text-[#85AA9B]">
                  <Play className="w-3 h-3 fill-current ml-0.5" />
                </div>
                <span>Watch Convocation Address</span>
              </button>
            )}
          </div>

          {/* Quick Institutional Highlights */}
          <div className="pt-5 border-t border-[#588B76]/40 grid grid-cols-2 sm:grid-cols-3 gap-4 text-xs">
            <div className="flex items-center gap-2.5">
              <ShieldCheck className="w-4 h-4 text-[#85AA9B] shrink-0" />
              <div>
                <p className="font-bold text-white">Biblical Fidelity</p>
                <p className="text-[11px] text-[#D0DED8]/80">Infallible Word of God</p>
              </div>
            </div>
            <div className="flex items-center gap-2.5">
              <GraduationCap className="w-4 h-4 text-[#85AA9B] shrink-0" />
              <div>
                <p className="font-bold text-white">CHED Recognized</p>
                <p className="text-[11px] text-[#D0DED8]/80">Accredited Degrees</p>
              </div>
            </div>
            <div className="hidden sm:flex items-center gap-2.5">
              <Award className="w-4 h-4 text-[#85AA9B] shrink-0" />
              <div>
                <p className="font-bold text-white">Scholarships</p>
                <p className="text-[11px] text-[#D0DED8]/80">Pastoral Grants Available</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Slider Controls */}
      <div className="absolute bottom-6 right-6 z-20 flex items-center gap-2 bg-[#18392B]/90 p-1.5 rounded-sm border border-[#588B76]/40 backdrop-blur-md">
        <button
          onClick={() =>
            setCurrentSlide((prev) => (prev === 0 ? HERO_SLIDES.length - 1 : prev - 1))
          }
          className="p-1.5 rounded-sm hover:bg-[#10261D] text-[#D0DED8] hover:text-white transition cursor-pointer"
          aria-label="Previous Slide"
        >
          <ChevronLeft className="w-4 h-4" />
        </button>

        <div className="flex gap-1 px-1">
          {HERO_SLIDES.map((_, idx) => (
            <button
              key={idx}
              onClick={() => setCurrentSlide(idx)}
              aria-label={`Slide ${idx + 1}`}
              className={`h-1.5 rounded-sm transition-all duration-300 cursor-pointer ${
                idx === currentSlide ? 'w-6 bg-[#588B76]' : 'w-2 bg-[#85AA9B]/40'
              }`}
            />
          ))}
        </div>

        <button
          onClick={() => setCurrentSlide((prev) => (prev + 1) % HERO_SLIDES.length)}
          className="p-1.5 rounded-sm hover:bg-[#10261D] text-[#D0DED8] hover:text-white transition cursor-pointer"
          aria-label="Next Slide"
        >
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>
    </section>
  );
};
