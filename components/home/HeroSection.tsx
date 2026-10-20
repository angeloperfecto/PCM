'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { AnimatePresence, motion, useMotionValue, useReducedMotion, useSpring } from 'motion/react';
import { usePCM } from '@/lib/store';
import { DEFAULT_HERO_SLIDES } from '@/lib/slideshowService';
import { openEnrollmentTerm, termLabel } from '@/lib/reenrollment';
import { HeroSlide } from '@/lib/types';
import { ArrowRight, Award, BookOpen, ChevronDown, GraduationCap, Pause, Play, ShieldCheck } from 'lucide-react';
import { LightField } from './fx/LightField';
import { CordilleraRidges } from './fx/CordilleraRidges';
import { Magnetic, SplitWords, displayCase } from './fx/motion';

const SLIDE_MS = 7000;

const getSlideImageUrl = (s: HeroSlide) => {
  if (s.image && s.image.trim()) {
    if (s.image.startsWith('/uploads/slideshow/')) return `/api/slideshow/image?id=${s.id}&t=${encodeURIComponent(s.updatedAt || '')}`;
    return s.image;
  }
  return `/api/slideshow/image?id=${s.id}`;
};

// "Dawn over the Cordillera": the slideshow set in Admin → Hero Slideshow, with light, ridges and motion.
export const HeroSection: React.FC = () => {
  const { navigateTo, setSelectedSermon, sermons, siteConfig, academicPeriods } = usePCM();
  const reduce = useReducedMotion();
  const [current, setCurrent] = useState(0);
  const [paused, setPaused] = useState(false);

  const slides = useMemo(() => {
    if (siteConfig?.heroSlides !== undefined && Array.isArray(siteConfig.heroSlides)) {
      const active = siteConfig.heroSlides.filter((s) => s.active !== false);
      if (active.length > 0) return active;
      if (siteConfig.heroSlides.length > 0) return siteConfig.heroSlides;
      return [];
    }
    return DEFAULT_HERO_SLIDES;
  }, [siteConfig?.heroSlides]);

  const index = slides.length > 0 ? current % slides.length : 0;
  const slide = slides[index] || slides[0] || DEFAULT_HERO_SLIDES[0];
  const term = openEnrollmentTerm(academicPeriods || []); // named only while its enrollment is open
  const applyLabel = term ? `Apply for ${termLabel(term.semester, term.academicYear)}` : 'Apply now';

  // Autoplay (paused while the pointer is over the navigator).
  useEffect(() => {
    if (slides.length <= 1 || paused || reduce) return;
    const t = window.setTimeout(() => setCurrent((p) => (p + 1) % slides.length), SLIDE_MS);
    return () => window.clearTimeout(t);
  }, [index, slides.length, paused, reduce]);

  // Preload the next slide's image.
  useEffect(() => {
    const next = slides[(index + 1) % Math.max(1, slides.length)];
    if (next) {
      const img = new Image();
      img.src = getSlideImageUrl(next);
    }
  }, [index, slides]);

  // Subtle photo parallax with the mouse.
  const mx = useMotionValue(0);
  const my = useMotionValue(0);
  const px = useSpring(mx, { stiffness: 60, damping: 20 });
  const py = useSpring(my, { stiffness: 60, damping: 20 });

  const go = (target?: string) => {
    const clean = (target || '').trim().toLowerCase();
    if (['apply', 'academics', 'about', 'resources', 'contact', 'portal'].includes(clean)) navigateTo(clean as any);
    else navigateTo('apply');
  };

  const words = displayCase(slide.headline).split(/\s+/).filter(Boolean);
  const highlight = words.length > 3 ? [words.length - 2, words.length - 1] : words.length ? [words.length - 1] : [];

  return (
    <section
      className="font-text grain relative isolate flex min-h-[max(640px,calc(100svh-7rem))] w-full items-center overflow-hidden bg-[#0b1d16] text-white"
      onPointerMove={(e) => {
        if (reduce || e.pointerType !== 'mouse') return;
        mx.set((e.clientX / window.innerWidth - 0.5) * -24);
        my.set((e.clientY / window.innerHeight - 0.5) * -16);
      }}
      aria-roledescription="carousel"
      aria-label="Featured"
    >
      {/* 1. Photo: slow cinematic zoom, crossfading between slides */}
      <motion.div className="absolute inset-[-24px] -z-30" style={{ x: px, y: py }}>
        <AnimatePresence initial={false}>
          <motion.div
            key={slide.id || index}
            className="absolute inset-0 bg-cover"
            style={{ backgroundImage: `url("${getSlideImageUrl(slide)}")`, backgroundPosition: 'center 30%' }}
            initial={reduce ? { opacity: 0 } : { opacity: 0, scale: 1.16 }}
            animate={reduce ? { opacity: 1 } : { opacity: 1, scale: 1.04 }}
            exit={{ opacity: 0 }}
            transition={{ opacity: { duration: 1.4, ease: 'easeInOut' }, scale: { duration: SLIDE_MS / 1000 + 2, ease: 'linear' } }}
          />
        </AnimatePresence>
      </motion.div>

      {/* 2. Colour grade: deep pine wash, dawn warmth, vignette */}
      <div className="absolute inset-0 -z-20 bg-[linear-gradient(100deg,rgba(8,22,16,0.94)_0%,rgba(16,38,29,0.82)_38%,rgba(24,57,43,0.35)_70%,rgba(24,57,43,0.15)_100%)]" />
      <div className="absolute inset-0 -z-20 bg-[radial-gradient(ellipse_at_80%_0%,rgba(232,199,122,0.28),transparent_55%)]" />
      <div className="absolute inset-0 -z-20 bg-[radial-gradient(ellipse_at_center,transparent_40%,rgba(5,14,10,0.65)_100%)]" />
      {/* Phones: the text runs full width, so the whole photo is darkened evenly */}
      <div className="absolute inset-0 -z-20 bg-gradient-to-b from-[#081610]/70 via-[#081610]/55 to-[#081610]/75 lg:hidden" />

      {/* 3. Light rays and motes */}
      <LightField className="-z-10 mix-blend-screen" />

      {/* 4. Ridges rising into the next section */}
      <CordilleraRidges className="-z-10 h-[34%] min-h-[180px] sm:h-[38%]" />

      {/* 5. Content */}
      <div className="relative mx-auto grid w-full max-w-7xl grid-cols-1 items-center gap-10 px-4 pb-40 pt-16 sm:px-6 sm:pb-48 lg:grid-cols-[minmax(0,1fr)_320px] lg:px-8 lg:pb-56 lg:pt-20">
        <div className="max-w-3xl">
          <motion.div
            key={`tag-${index}`}
            initial={reduce ? false : { opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="mb-5 inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/[0.06] px-3.5 py-1.5 text-[11px] font-semibold uppercase tracking-[0.18em] text-[#f6e3b4] backdrop-blur-md"
          >
            <span className="relative flex h-2 w-2">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-[#e8c77a] opacity-60" />
              <span className="relative inline-flex h-2 w-2 rounded-full bg-[#e8c77a]" />
            </span>
            {slide.tag || 'Philippine College of Ministry'}
          </motion.div>

          <h1 className="font-display text-[2.4rem] font-semibold leading-[1.04] text-white drop-shadow-[0_2px_24px_rgba(0,0,0,0.35)] sm:text-6xl lg:text-[4.1rem] xl:text-[4.9rem]">
            <SplitWords text={slide.headline} playKey={`h-${index}`} delay={0.1} highlight={highlight} />
          </h1>

          <motion.p
            key={`p-${index}`}
            initial={reduce ? false : { opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.45 }}
            className="mt-6 max-w-2xl text-base leading-relaxed text-[#d8e6df]/90 sm:text-lg"
          >
            {slide.subtext}
          </motion.p>

          <motion.div
            initial={reduce ? false : { opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.6 }}
            className="mt-9 flex flex-col items-stretch gap-3 sm:flex-row sm:items-center sm:gap-4"
          >
            <Magnetic>
              <button
                id="hero-cta-apply"
                onClick={() => go(slide.primaryBtnLink)}
                className="btn-shimmer group inline-flex w-full items-center justify-center gap-2 rounded-full bg-gradient-to-r from-[#e8c77a] to-[#f6e3b4] px-7 py-4 text-sm font-bold text-[#10261d] shadow-[0_10px_40px_-8px_rgba(232,199,122,0.65)] transition hover:shadow-[0_14px_50px_-6px_rgba(232,199,122,0.85)] sm:w-auto"
              >
                {displayCase(slide.primaryBtnText || '') || applyLabel}
                <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
              </button>
            </Magnetic>
            <Magnetic strength={0.18}>
              <button
                id="hero-cta-explore"
                onClick={() => go(slide.secondaryBtnLink)}
                className="inline-flex w-full items-center justify-center gap-2 rounded-full border border-white/25 bg-white/[0.06] px-6 py-4 text-sm font-semibold text-white backdrop-blur-md transition hover:border-white/60 hover:bg-white/15 sm:w-auto"
              >
                <BookOpen className="h-4 w-4 text-[#e8c77a]" />
                {displayCase(slide.secondaryBtnText || '') || 'Explore programs'}
              </button>
            </Magnetic>
            {sermons.length > 0 && (
              <button
                id="hero-cta-watch-convocation"
                onClick={() => setSelectedSermon(sermons[0])}
                className="group hidden items-center gap-3 px-2 py-2 text-sm font-medium text-white/85 transition hover:text-white md:inline-flex"
              >
                <span className="relative flex h-11 w-11 items-center justify-center rounded-full border border-white/30 bg-white/10 backdrop-blur-md transition group-hover:scale-110">
                  <span className="absolute inset-0 animate-ping rounded-full border border-[#e8c77a]/40" />
                  <Play className="ml-0.5 h-4 w-4 fill-current" />
                </span>
                Watch Convocation Address
              </button>
            )}
          </motion.div>

          <motion.ul
            initial={reduce ? false : { opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 1, delay: 0.85 }}
            className="mt-8 flex flex-wrap gap-2 text-xs sm:mt-10 sm:gap-2.5"
          >
            {[
              { icon: ShieldCheck, t: 'Biblical Fidelity', s: 'Infallible Word of God' },
              { icon: GraduationCap, t: 'CHED Recognized', s: 'Accredited Degrees' },
              { icon: Award, t: 'Scholarships', s: 'Pastoral Grants Available' },
            ].map(({ icon: Icon, t, s }) => (
              <li key={t} className="flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.05] py-1.5 pl-1.5 pr-3.5 backdrop-blur-md sm:gap-2.5 sm:rounded-2xl sm:px-3.5 sm:py-2.5">
                <span className="flex h-7 w-7 items-center justify-center rounded-full bg-gradient-to-br from-[#e8c77a]/30 to-[#588b76]/30 sm:h-8 sm:w-8 sm:rounded-xl">
                  <Icon className="h-4 w-4 text-[#f6e3b4]" />
                </span>
                <span>
                  <span className="block font-semibold text-white">{t}</span>
                  <span className="hidden text-[11px] text-white/65 sm:block">{s}</span>
                </span>
              </li>
            ))}
          </motion.ul>
        </div>

        {/* Slide navigator (desktop) */}
        {slides.length > 1 && (
          <motion.nav
            aria-label="Slides"
            initial={reduce ? false : { opacity: 0, x: 24 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.9, delay: 0.7 }}
            onPointerEnter={() => setPaused(true)}
            onPointerLeave={() => setPaused(false)}
            className="hidden flex-col gap-2 rounded-3xl border border-white/10 bg-black/20 p-3 backdrop-blur-xl lg:flex"
          >
            <div className="flex items-center justify-between px-2 pb-1 text-[10px] font-semibold uppercase tracking-[0.2em] text-white/50">
              <span>
                {String(index + 1).padStart(2, '0')} / {String(slides.length).padStart(2, '0')}
              </span>
              {paused ? <Pause className="h-3 w-3" /> : <Play className="h-3 w-3" />}
            </div>
            {slides.map((s, i) => (
              <button
                key={s.id || i}
                onClick={() => setCurrent(i)}
                aria-current={i === index}
                className={`group relative overflow-hidden rounded-2xl px-3 py-2.5 text-left transition ${i === index ? 'bg-white/12' : 'hover:bg-white/[0.06]'}`}
              >
                <span className={`block truncate text-[10px] font-semibold uppercase tracking-[0.16em] ${i === index ? 'text-[#e8c77a]' : 'text-white/45'}`}>{s.tag || `Slide ${i + 1}`}</span>
                <span className={`mt-0.5 line-clamp-2 block font-display text-sm leading-snug ${i === index ? 'text-white' : 'text-white/60 group-hover:text-white/85'}`}>{displayCase(s.headline)}</span>
                <span className="absolute inset-x-3 bottom-1 h-[2px] overflow-hidden rounded-full bg-white/10">
                  {i === index && (
                    <motion.span
                      key={`bar-${index}-${paused}`}
                      className="block h-full origin-left bg-gradient-to-r from-[#e8c77a] to-[#f6e3b4]"
                      initial={{ scaleX: 0 }}
                      animate={{ scaleX: paused || reduce ? 0 : 1 }}
                      transition={{ duration: SLIDE_MS / 1000, ease: 'linear' }}
                    />
                  )}
                </span>
              </button>
            ))}
          </motion.nav>
        )}
      </div>

      {/* Slide progress (mobile / tablet) */}
      {slides.length > 1 && (
        <div className="absolute inset-x-0 bottom-28 z-10 flex justify-center gap-2 sm:bottom-32 lg:hidden">
          {slides.map((s, i) => (
            <button
              key={s.id || i}
              onClick={() => setCurrent(i)}
              aria-label={`Slide ${i + 1}`}
              aria-current={i === index}
              className="relative h-1.5 w-10 overflow-hidden rounded-full bg-white/25"
            >
              {i === index && (
                <motion.span
                  key={`m-${index}`}
                  className="absolute inset-0 origin-left bg-[#e8c77a]"
                  initial={{ scaleX: reduce ? 1 : 0 }}
                  animate={{ scaleX: 1 }}
                  transition={{ duration: reduce ? 0 : SLIDE_MS / 1000, ease: 'linear' }}
                />
              )}
            </button>
          ))}
        </div>
      )}

      {/* Scroll cue */}
      <button
        type="button"
        onClick={() => window.scrollBy({ top: window.innerHeight * 0.85, behavior: reduce ? 'auto' : 'smooth' })}
        className="absolute bottom-8 left-1/2 z-10 hidden -translate-x-1/2 flex-col items-center gap-2 text-[10px] font-semibold uppercase tracking-[0.3em] text-white/70 transition hover:text-white sm:flex"
        aria-label="Scroll to content"
      >
        Scroll
        <span className="relative flex h-10 w-6 justify-center rounded-full border border-white/30">
          <motion.span
            className="mt-2 h-2 w-1 rounded-full bg-[#e8c77a]"
            animate={reduce ? undefined : { y: [0, 14, 0], opacity: [1, 0.2, 1] }}
            transition={{ duration: 1.8, repeat: Infinity, ease: 'easeInOut' }}
          />
        </span>
        <ChevronDown className="h-3 w-3" />
      </button>
    </section>
  );
};
