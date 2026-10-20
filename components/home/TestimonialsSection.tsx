'use client';

import React, { useEffect, useRef, useState } from 'react';
import Image from 'next/image';
import { AnimatePresence, motion, useInView, useReducedMotion } from 'motion/react';
import { usePCM } from '@/lib/store';
import { isValidImageSrc } from '@/lib/utils';
import { publicTestimonials } from '@/lib/testimonials';
import { ChevronLeft, ChevronRight, Sparkles } from 'lucide-react';
import { Reveal } from './fx/motion';

const AUTOPLAY_MS = 9000;

const Avatar: React.FC<{ src?: string; name: string; size: number; className?: string }> = ({ src, name, size, className = '' }) =>
  isValidImageSrc(src) ? (
    <span className={`relative block shrink-0 overflow-hidden rounded-full ${className}`} style={{ width: size, height: size }}>
      <Image src={String(src).trim()} alt={name} fill className="object-cover" sizes={`${size}px`} referrerPolicy="no-referrer" unoptimized={Boolean(String(src).startsWith('data:') || String(src).startsWith('blob:'))} />
    </span>
  ) : (
    <span
      className={`font-display flex shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-[#18392b] to-[#588b76] font-semibold text-[#f6e3b4] ${className}`}
      style={{ width: size, height: size, fontSize: size * 0.38 }}
      aria-hidden="true"
    >
      {name
        .split(/\s+/)
        .filter(Boolean)
        .slice(0, 2)
        .map((w) => w[0])
        .join('')
        .toUpperCase()}
    </span>
  );

// Published testimonials (Admin → Testimonials, in the order set there) on a cinematic quote stage.
export const TestimonialsSection: React.FC = () => {
  const { testimonials: allTestimonials } = usePCM();
  const testimonials = publicTestimonials(allTestimonials);
  const reduce = useReducedMotion();
  const [index, setIndex] = useState(0);
  const [hover, setHover] = useState(false);
  const ref = useRef<HTMLElement | null>(null);
  const inView = useInView(ref, { margin: '-20% 0px -20% 0px' });
  const count = testimonials.length;
  const i = count ? index % count : 0;

  useEffect(() => {
    if (count <= 1 || hover || reduce || !inView) return;
    const t = window.setTimeout(() => setIndex((p) => (p + 1) % count), AUTOPLAY_MS);
    return () => window.clearTimeout(t);
  }, [i, count, hover, reduce, inView]);

  if (count === 0) return null;
  const current = testimonials[i];
  const go = (d: number) => setIndex((p) => (p + d + count) % count);
  const size = current.quote.length < 150 ? 'lg:text-5xl sm:text-4xl' : current.quote.length < 280 ? 'lg:text-4xl sm:text-3xl' : 'lg:text-3xl sm:text-2xl';

  return (
    <section ref={ref} className="font-text relative w-full overflow-hidden bg-[#f7f5ef] py-20 lg:py-28">
      <div aria-hidden="true" className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_20%_10%,rgba(232,199,122,0.22),transparent_50%),radial-gradient(ellipse_at_90%_90%,rgba(133,170,155,0.25),transparent_50%)]" />
      <div className="relative mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
        <Reveal className="mb-10 text-center">
          <span className="inline-flex items-center gap-2 rounded-full border border-[#588b76]/30 bg-white/70 px-4 py-1.5 text-[11px] font-semibold uppercase tracking-[0.22em] text-[#588b76]">
            <Sparkles className="h-3.5 w-3.5" /> Transforming Lives
          </span>
          <h2 className="font-display mt-5 text-4xl font-semibold leading-[1.05] text-[#10261d] sm:text-5xl lg:text-6xl">
            Hear from our <em className="italic text-[#588b76]">community</em>
          </h2>
        </Reveal>

        <div className="relative" onPointerEnter={() => setHover(true)} onPointerLeave={() => setHover(false)}>
          <span aria-hidden="true" className="font-display text-dawn pointer-events-none absolute -left-2 -top-16 select-none text-[12rem] leading-none sm:-left-6 sm:-top-24 sm:text-[16rem]">
            &ldquo;
          </span>

          <div className="relative min-h-[320px] sm:min-h-[300px]">
            <AnimatePresence mode="wait" initial={false}>
              <motion.figure
                key={current.id || i}
                drag={reduce || count <= 1 ? false : 'x'}
                dragConstraints={{ left: 0, right: 0 }}
                dragElastic={0.25}
                onDragEnd={(_, info) => {
                  if (info.offset.x < -60) go(1);
                  else if (info.offset.x > 60) go(-1);
                }}
                initial={reduce ? { opacity: 0 } : { opacity: 0, y: 24, filter: 'blur(10px)' }}
                animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
                exit={reduce ? { opacity: 0 } : { opacity: 0, y: -16, filter: 'blur(10px)' }}
                transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
                className="relative cursor-grab active:cursor-grabbing"
              >
                <span className="inline-flex items-center gap-2 rounded-full bg-[#18392b] px-3 py-1 text-[10px] font-bold uppercase tracking-[0.18em] text-[#f6e3b4]">{current.category} spotlight</span>
                <blockquote className={`font-display mt-6 text-2xl font-medium leading-snug text-[#10261d] ${size}`}>{current.quote}</blockquote>
                <figcaption className="mt-8 flex items-center gap-4">
                  <span className="rounded-full bg-gradient-to-br from-[#e8c77a] to-[#588b76] p-[2px]">
                    <Avatar src={current.avatarUrl} name={current.name} size={56} className="ring-2 ring-[#f7f5ef]" />
                  </span>
                  <span>
                    <span className="font-display block text-lg font-semibold text-[#10261d]">{current.name}</span>
                    <span className="block text-sm font-medium text-[#588b76]">{current.role}</span>
                    {current.programOrMinistry && <span className="block text-xs text-[#18392b]/60">{current.programOrMinistry}</span>}
                  </span>
                </figcaption>
              </motion.figure>
            </AnimatePresence>
          </div>

          {count > 1 && (
            <div className="mt-10 flex flex-col gap-5 border-t border-[#18392b]/10 pt-6 sm:flex-row sm:items-center sm:justify-between">
              <div className="no-scrollbar -mx-1 flex gap-2 overflow-x-auto px-1 py-1">
                {testimonials.map((t, k) => (
                  <button
                    key={t.id || k}
                    onClick={() => setIndex(k)}
                    aria-label={`Testimonial from ${t.name}`}
                    aria-current={k === i}
                    className={`relative shrink-0 rounded-full p-[2px] transition ${k === i ? 'bg-gradient-to-br from-[#e8c77a] to-[#588b76]' : 'bg-transparent opacity-60 hover:opacity-100'}`}
                  >
                    <Avatar src={t.avatarUrl} name={t.name} size={40} className="ring-2 ring-[#f7f5ef]" />
                  </button>
                ))}
              </div>
              <div className="flex items-center gap-3">
                <div className="h-[3px] w-28 overflow-hidden rounded-full bg-[#18392b]/10">
                  <motion.div
                    key={`p-${i}-${hover}-${inView}`}
                    className="h-full origin-left bg-gradient-to-r from-[#e8c77a] to-[#588b76]"
                    initial={{ scaleX: 0 }}
                    animate={{ scaleX: hover || reduce || !inView ? 0 : 1 }}
                    transition={{ duration: AUTOPLAY_MS / 1000, ease: 'linear' }}
                  />
                </div>
                <span className="font-mono text-xs text-[#18392b]/60">
                  {i + 1} / {count}
                </span>
                <button onClick={() => go(-1)} aria-label="Previous testimonial" className="flex h-11 w-11 items-center justify-center rounded-full border border-[#18392b]/15 text-[#10261d] transition hover:bg-[#18392b] hover:text-white">
                  <ChevronLeft className="h-5 w-5" />
                </button>
                <button onClick={() => go(1)} aria-label="Next testimonial" className="flex h-11 w-11 items-center justify-center rounded-full bg-[#18392b] text-white transition hover:bg-[#10261d]">
                  <ChevronRight className="h-5 w-5" />
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </section>
  );
};
