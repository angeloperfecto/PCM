'use client';

import React, { useId } from 'react';
import { motion, useMotionValue, useReducedMotion, useSpring, useTransform } from 'motion/react';

/**
 * Seamless horizontal marquee: the children are rendered twice and slide left forever (CSS, compositor-only).
 * Pauses on hover/focus; with reduced motion it becomes a plain horizontally scrollable row.
 */
export const Marquee: React.FC<{ children: React.ReactNode; duration?: number; reverse?: boolean; className?: string; label?: string }> = ({
  children,
  duration = 40,
  reverse = false,
  className = '',
  label,
}) => (
  <div className={`marquee group/marquee relative overflow-hidden ${className}`} aria-label={label}>
    <div className={`marquee-track ${reverse ? 'marquee-reverse' : ''}`} style={{ ['--dur' as string]: `${duration}s` }}>
      <div className="flex shrink-0 items-center">{children}</div>
      <div className="flex shrink-0 items-center" aria-hidden="true">
        {children}
      </div>
    </div>
  </div>
);

/** A card that tilts toward the cursor in 3D with a moving glare (mouse only; still for touch / reduced motion). */
export const TiltCard: React.FC<{ children: React.ReactNode; className?: string; max?: number }> = ({ children, className = '', max = 8 }) => {
  const reduce = useReducedMotion();
  const rx = useMotionValue(0);
  const ry = useMotionValue(0);
  const srx = useSpring(rx, { stiffness: 200, damping: 18 });
  const sry = useSpring(ry, { stiffness: 200, damping: 18 });
  const gx = useMotionValue(50);
  const gy = useMotionValue(50);
  const glare = useTransform([gx, gy] as any, ([x, y]: number[]) => `radial-gradient(circle at ${x}% ${y}%, rgba(255,255,255,0.35), transparent 55%)`);

  return (
    <motion.div
      className={`group/tilt relative ${className}`}
      style={reduce ? undefined : { rotateX: srx, rotateY: sry, transformPerspective: 900 }}
      onPointerMove={(e) => {
        if (reduce || e.pointerType !== 'mouse') return;
        const r = e.currentTarget.getBoundingClientRect();
        const px = (e.clientX - r.left) / r.width;
        const py = (e.clientY - r.top) / r.height;
        ry.set((px - 0.5) * max * 2);
        rx.set(-(py - 0.5) * max * 2);
        gx.set(px * 100);
        gy.set(py * 100);
      }}
      onPointerLeave={() => {
        rx.set(0);
        ry.set(0);
      }}
    >
      {children}
      {!reduce && (
        <motion.span
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 rounded-[inherit] opacity-0 mix-blend-soft-light transition-opacity duration-300 group-hover/tilt:opacity-100"
          style={{ background: glare }}
        />
      )}
    </motion.div>
  );
};

/** Text set around a circle that turns slowly (a seal / badge). */
export const RotatingSeal: React.FC<{ text: string; className?: string; children?: React.ReactNode }> = ({ text, className = '', children }) => {
  const reduce = useReducedMotion();
  const id = `seal-${useId().replace(/[^a-zA-Z0-9]/g, '')}`;
  return (
    <div className={`${className.split(/\s+/).some((c) => c === 'absolute' || c === 'fixed') ? '' : 'relative'} ${className}`}>
      <motion.svg
        viewBox="0 0 200 200"
        className="absolute inset-0 h-full w-full"
        animate={reduce ? undefined : { rotate: 360 }}
        transition={{ duration: 28, repeat: Infinity, ease: 'linear' }}
        aria-hidden="true"
      >
        <defs>
          <path id={id} d="M100,100 m-78,0 a78,78 0 1,1 156,0 a78,78 0 1,1 -156,0" />
        </defs>
        <text className="fill-current text-[13px] font-semibold uppercase">
          {/* textLength = the circle's circumference, so any text fits exactly once around */}
          <textPath href={`#${id}`} textLength={Math.round(2 * Math.PI * 78)} lengthAdjust="spacing">
            {text}
          </textPath>
        </text>
      </motion.svg>
      <div className="absolute inset-0 flex items-center justify-center">{children}</div>
    </div>
  );
};
