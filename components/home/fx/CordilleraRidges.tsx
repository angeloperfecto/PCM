'use client';

import React, { useId, useMemo, useRef } from 'react';
import { motion, useReducedMotion, useScroll, useTransform, type MotionValue } from 'motion/react';

// Deterministic pseudo-random numbers, so the ridges are the same on every visit and on the server.
function rng(seed: number) {
  let s = seed >>> 0;
  return () => {
    s = (s + 0x6d2b79f5) >>> 0;
    let t = s;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const W = 1440;
const H = 420;

/** A ridge line from layered smooth noise; optional pine silhouettes along its crest. */
function ridgePath(seed: number, base: number, amp: number, roughness: number, pines: number): string {
  const r = rng(seed);
  const knots = 9;
  const pts: number[] = [];
  for (let i = 0; i <= knots; i++) pts.push(r());
  const steps = 160;
  const ys: number[] = [];
  for (let i = 0; i <= steps; i++) {
    const u = (i / steps) * knots;
    const k = Math.floor(u);
    const f = u - k;
    const s = f * f * (3 - 2 * f);
    const big = pts[k] * (1 - s) + pts[Math.min(k + 1, knots)] * s;
    const fine = Math.sin(i * 0.9 + seed) * 0.5 + Math.sin(i * 2.3 + seed * 1.7) * 0.25;
    ys.push(base - big * amp - fine * roughness);
  }
  let d = `M0 ${H + 400} L0 ${ys[0].toFixed(1)}`;
  const dx = W / steps;
  ys.forEach((y, i) => {
    const x = i * dx;
    d += ` L${x.toFixed(1)} ${y.toFixed(1)}`;
    // Pines: narrow triangles rising from the crest, denser where `pines` is high.
    if (pines > 0 && r() < pines) {
      const ph = 10 + r() * 22;
      const pw = 3 + r() * 4;
      d += ` L${(x + pw * 0.2).toFixed(1)} ${(y - ph * 0.45).toFixed(1)} L${(x - pw * 0.3).toFixed(1)} ${(y - ph * 0.45).toFixed(1)}`;
      d += ` L${(x + pw * 0.5).toFixed(1)} ${(y - ph).toFixed(1)} L${(x + pw * 1.3).toFixed(1)} ${(y - ph * 0.45).toFixed(1)}`;
      d += ` L${(x + pw * 0.8).toFixed(1)} ${(y - ph * 0.45).toFixed(1)} L${(x + pw).toFixed(1)} ${y.toFixed(1)}`;
    }
  });
  d += ` L${W} ${H + 400} Z`;
  return d;
}

const LAYERS = [
  { seed: 11, base: 250, amp: 150, rough: 6, pines: 0, from: '#9fbcae', to: '#85aa9b', opacity: 0.5, speed: 0.06 },
  { seed: 27, base: 290, amp: 130, rough: 7, pines: 0.04, from: '#6f9886', to: '#588b76', opacity: 0.7, speed: 0.12 },
  { seed: 43, base: 325, amp: 110, rough: 8, pines: 0.12, from: '#3f6b58', to: '#2b5141', opacity: 0.88, speed: 0.2 },
  { seed: 58, base: 360, amp: 90, rough: 8, pines: 0.22, from: '#1f4434', to: '#18392b', opacity: 1, speed: 0.3 },
  { seed: 71, base: 395, amp: 60, rough: 6, pines: 0.3, from: '#15332a', to: '#18392b', opacity: 1, speed: 0.42 },
];

const Layer: React.FC<{ uid: string; d: string; i: number; from: string; to: string; opacity: number; y: MotionValue<number> | number }> = ({ uid, d, i, from, to, opacity, y }) => (
  <motion.g style={{ y }}>
    <defs>
      <linearGradient id={`${uid}-ridge-${i}`} x1="0" x2="0" y1="0" y2="1">
        <stop offset="0" stopColor={from} />
        <stop offset="1" stopColor={to} />
      </linearGradient>
    </defs>
    <path d={d} fill={`url(#${uid}-ridge-${i})`} opacity={opacity} />
  </motion.g>
);

/**
 * Five layered Cordillera ridges with pines (Lamtang, Benguet), drawn procedurally as one SVG. Each layer moves
 * at its own speed while the hero scrolls away. `fadeTo` paints the front layer into the next section's colour.
 */
export const CordilleraRidges: React.FC<{ className?: string; fadeTo?: string; layers?: number }> = ({ className = '', fadeTo, layers = 5 }) => {
  const ref = useRef<HTMLDivElement | null>(null);
  const uid = useId().replace(/[^a-zA-Z0-9]/g, "");
  const reduce = useReducedMotion();
  const { scrollYProgress } = useScroll({ target: ref, offset: ['start end', 'end start'] });
  const paths = useMemo(() => LAYERS.map((l) => ridgePath(l.seed, l.base, l.amp, l.rough, l.pines)), []);
  const ys = [
    useTransform(scrollYProgress, [0, 1], [0, -LAYERS[0].speed * 260]),
    useTransform(scrollYProgress, [0, 1], [0, -LAYERS[1].speed * 260]),
    useTransform(scrollYProgress, [0, 1], [0, -LAYERS[2].speed * 260]),
    useTransform(scrollYProgress, [0, 1], [0, -LAYERS[3].speed * 260]),
    useTransform(scrollYProgress, [0, 1], [0, -LAYERS[4].speed * 260]),
  ];
  const shown = LAYERS.slice(LAYERS.length - layers);

  return (
    <div ref={ref} aria-hidden="true" className={`pointer-events-none absolute inset-x-0 bottom-0 ${className}`}>
      <svg viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="xMidYMax slice" className="block h-full w-full overflow-visible">
        {shown.map((l) => {
          const i = LAYERS.indexOf(l);
          return <Layer key={l.seed} uid={uid} d={paths[i]} i={i} from={l.from} to={l.to} opacity={l.opacity} y={reduce ? 0 : ys[i]} />;
        })}
        {fadeTo && (
          <>
            <defs>
              <linearGradient id={`${uid}-fade`} x1="0" x2="0" y1="0" y2="1">
                <stop offset="0.55" stopColor={fadeTo} stopOpacity="0" />
                <stop offset="1" stopColor={fadeTo} stopOpacity="1" />
              </linearGradient>
            </defs>
            <rect x="0" y="0" width={W} height={H} fill={`url(#${uid}-fade)`} />
          </>
        )}
      </svg>
    </div>
  );
};
