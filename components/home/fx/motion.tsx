'use client';

import React, { useEffect, useRef, useState } from 'react';
import { animate, motion, useInView, useReducedMotion, useScroll, useSpring, type Variants } from 'motion/react';

const EASE = [0.22, 1, 0.36, 1] as const;

/** Rises, sharpens and fades in as it scrolls into view (once). */
export const Reveal: React.FC<{ children: React.ReactNode; delay?: number; y?: number; className?: string; as?: 'div' | 'section' }> = ({
  children,
  delay = 0,
  y = 36,
  className = '',
  as = 'div',
}) => {
  const reduce = useReducedMotion();
  const Tag = as === 'section' ? motion.section : motion.div;
  return (
    <Tag
      className={className}
      initial={reduce ? false : { opacity: 0, y, filter: 'blur(6px)' }}
      whileInView={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
      viewport={{ once: true, margin: '0px 0px -12% 0px' }}
      transition={{ duration: 0.9, ease: EASE, delay }}
    >
      {children}
    </Tag>
  );
};

/** Children appear one after another (use <Stagger.Item> for each). */
const container: Variants = { hidden: {}, show: { transition: { staggerChildren: 0.08, delayChildren: 0.05 } } };
const item: Variants = {
  hidden: { opacity: 0, y: 28, scale: 0.98 },
  show: { opacity: 1, y: 0, scale: 1, transition: { duration: 0.7, ease: EASE } },
};
export const Stagger: React.FC<{ children: React.ReactNode; className?: string }> & { Item: React.FC<{ children: React.ReactNode; className?: string }> } = Object.assign(
  ({ children, className = '' }: { children: React.ReactNode; className?: string }) => {
    const reduce = useReducedMotion();
    return (
      <motion.div className={className} variants={container} initial={reduce ? false : 'hidden'} whileInView="show" viewport={{ once: true, margin: '0px 0px -10% 0px' }}>
        {children}
      </motion.div>
    );
  },
  {
    Item: ({ children, className = '' }: { children: React.ReactNode; className?: string }) => (
      <motion.div className={className} variants={item}>
        {children}
      </motion.div>
    ),
  }
);

/** ALL-CAPS text (as often typed in the CMS) shown in title case; other text unchanged. */
const SMALL = new Set(['a', 'an', 'and', 'as', 'at', 'but', 'by', 'for', 'in', 'of', 'on', 'or', 'the', 'to', 'with']);
export function displayCase(text: string): string {
  const t = String(text || '');
  if (!/[A-Z]/.test(t) || t !== t.toUpperCase()) return t;
  return t
    .toLowerCase()
    .split(/(\s+)/)
    .map((w, i) => (i > 0 && SMALL.has(w.replace(/[^a-z]/g, '')) ? w : w.replace(/[a-z]/, (c) => c.toUpperCase())))
    .join('');
}

/** A headline unveiled word by word from below a mask. Re-plays when `playKey` changes. */
export const SplitWords: React.FC<{ text: string; className?: string; playKey?: string | number; delay?: number; highlight?: number[] }> = ({
  text,
  className = '',
  playKey,
  delay = 0,
  highlight = [],
}) => {
  const reduce = useReducedMotion();
  const words = displayCase(text).split(/\s+/).filter(Boolean);
  return (
    <span key={playKey} className={className} aria-label={text}>
      {words.map((w, i) => (
        <span key={`${w}-${i}`} aria-hidden="true" className="-mb-[0.18em] inline-block overflow-hidden pb-[0.18em] pt-[0.04em] align-bottom">
          <motion.span
            className={`inline-block ${highlight.includes(i) ? 'text-dawn' : ''}`}
            initial={reduce ? false : { y: '110%', rotate: 4, opacity: 0 }}
            animate={{ y: '0%', rotate: 0, opacity: 1 }}
            transition={{ duration: 0.9, ease: EASE, delay: delay + i * 0.055 }}
          >
            {w}
          </motion.span>
          {i < words.length - 1 ? ' ' : ''}
        </span>
      ))}
    </span>
  );
};

/** Pulls gently toward the cursor (mouse only). */
export const Magnetic: React.FC<{ children: React.ReactNode; strength?: number; className?: string }> = ({ children, strength = 0.25, className = '' }) => {
  const ref = useRef<HTMLSpanElement | null>(null);
  const reduce = useReducedMotion();
  const [pos, setPos] = useState({ x: 0, y: 0 });
  return (
    <motion.span
      ref={ref}
      className={`inline-flex ${className}`}
      animate={pos}
      transition={{ type: 'spring', stiffness: 220, damping: 16, mass: 0.4 }}
      onPointerMove={(e) => {
        if (reduce || e.pointerType !== 'mouse' || !ref.current) return;
        const r = ref.current.getBoundingClientRect();
        setPos({ x: (e.clientX - (r.left + r.width / 2)) * strength, y: (e.clientY - (r.top + r.height / 2)) * strength });
      }}
      onPointerLeave={() => setPos({ x: 0, y: 0 })}
    >
      {children}
    </motion.span>
  );
};

/** Sets --mx / --my for the .spotlight glow under the cursor. */
export const spotlightHandlers = {
  onPointerMove: (e: React.PointerEvent<HTMLElement>) => {
    const r = e.currentTarget.getBoundingClientRect();
    e.currentTarget.style.setProperty('--mx', `${e.clientX - r.left}px`);
    e.currentTarget.style.setProperty('--my', `${e.clientY - r.top}px`);
  },
};

/** "1,250+" counts up from 0 when it scrolls into view; any prefix/suffix text is kept. */
export const CountUp: React.FC<{ value: string; className?: string }> = ({ value, className = '' }) => {
  const ref = useRef<HTMLSpanElement | null>(null);
  const inView = useInView(ref, { once: true, margin: '0px 0px -10% 0px' });
  const reduce = useReducedMotion();
  const m = String(value || '').match(/^(\D*)([\d,]+(?:\.\d+)?)(.*)$/);
  const [shown, setShown] = useState(m ? `${m[1]}0${m[3]}` : value);
  useEffect(() => {
    if (!m) {
      setShown(value);
      return;
    }
    const target = Number(m[2].replace(/,/g, ''));
    const decimals = (m[2].split('.')[1] || '').length;
    const withCommas = m[2].includes(',');
    const fmt = (n: number) => {
      const s = n.toFixed(decimals);
      return withCommas ? Number(s).toLocaleString('en-US', { minimumFractionDigits: decimals, maximumFractionDigits: decimals }) : s;
    };
    if (reduce || !inView) {
      setShown(reduce ? value : `${m[1]}${fmt(0)}${m[3]}`);
      return;
    }
    const controls = animate(0, target, {
      duration: 1.8,
      ease: EASE,
      onUpdate: (n) => setShown(`${m[1]}${fmt(n)}${m[3]}`),
    });
    return () => controls.stop();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [inView, value, reduce]);
  return (
    <span ref={ref} className={className} aria-label={value}>
      {shown}
    </span>
  );
};

/** Thin dawn-gold reading-progress bar along the top of the page. */
export const ScrollProgress: React.FC = () => {
  const { scrollYProgress } = useScroll();
  const scaleX = useSpring(scrollYProgress, { stiffness: 120, damping: 24, mass: 0.3 });
  return (
    <motion.div
      aria-hidden="true"
      className="fixed inset-x-0 top-0 z-[60] h-[3px] origin-left bg-gradient-to-r from-[#e8c77a] via-[#f6e3b4] to-[#85aa9b]"
      style={{ scaleX }}
    />
  );
};
