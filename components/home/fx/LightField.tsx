'use client';

import React, { useEffect, useRef } from 'react';

type Mote = { x: number; y: number; z: number; r: number; vx: number; vy: number; tw: number; hue: number };

/**
 * "Light over the ridges": slow volumetric rays from the upper right and drifting motes of light at three
 * depths that lean toward the cursor. Pure canvas, no assets. Scales particle count to the screen, caps the
 * pixel ratio, pauses off-screen / in background tabs, and draws one still frame for reduced motion.
 */
export const LightField: React.FC<{ className?: string; intensity?: number; origin?: [number, number] }> = ({
  className = '',
  intensity = 1,
  origin = [0.82, -0.1],
}) => {
  const ref = useRef<HTMLCanvasElement | null>(null);
  const [originX, originY] = origin;

  useEffect(() => {
    const canvas = ref.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    let w = 0;
    let h = 0;
    let dpr = 1;
    let motes: Mote[] = [];
    let raf = 0;
    let running = false;
    let visible = true;
    const pointer = { x: 0.5, y: 0.5, tx: 0.5, ty: 0.5 };
    const start = performance.now();

    const seed = () => {
      const area = w * h;
      const count = Math.round(Math.min(140, Math.max(36, area / 9000)) * intensity);
      motes = Array.from({ length: count }, () => {
        const z = Math.random();
        return {
          x: Math.random() * w,
          y: Math.random() * h,
          z,
          r: 0.6 + z * 2.2,
          vx: (Math.random() - 0.5) * 0.12 * (0.4 + z),
          vy: -(0.05 + Math.random() * 0.22) * (0.4 + z),
          tw: Math.random() * Math.PI * 2,
          hue: Math.random() < 0.7 ? 43 : 150, // gold motes with a few sage ones
        };
      });
    };

    const resize = () => {
      const rect = canvas.getBoundingClientRect();
      dpr = Math.min(window.devicePixelRatio || 1, w < 640 ? 1.25 : 1.6);
      w = Math.max(1, Math.round(rect.width));
      h = Math.max(1, Math.round(rect.height));
      canvas.width = Math.round(w * dpr);
      canvas.height = Math.round(h * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      seed();
    };

    const draw = (now: number) => {
      const t = (now - start) / 1000;
      pointer.x += (pointer.tx - pointer.x) * 0.04;
      pointer.y += (pointer.ty - pointer.y) * 0.04;
      ctx.clearRect(0, 0, w, h);

      // Volumetric rays: soft wedges fanning from the origin, slowly breathing.
      const ox = originX * w + (pointer.x - 0.5) * 40;
      const oy = originY * h;
      ctx.save();
      ctx.globalCompositeOperation = 'lighter';
      const rays = 7;
      for (let i = 0; i < rays; i++) {
        const base = Math.PI * 0.62 + (i / (rays - 1)) * Math.PI * 0.38;
        const ang = base + Math.sin(t * 0.12 + i * 1.7) * 0.035;
        const spread = 0.045 + 0.03 * Math.sin(t * 0.2 + i);
        const len = Math.hypot(w, h) * 1.15;
        const alpha = (0.05 + 0.035 * (0.5 + 0.5 * Math.sin(t * 0.35 + i * 2.1))) * intensity;
        const g = ctx.createLinearGradient(ox, oy, ox + Math.cos(ang) * len, oy + Math.sin(ang) * len);
        g.addColorStop(0, `rgba(246, 227, 180, ${alpha * 1.6})`);
        g.addColorStop(0.45, `rgba(232, 199, 122, ${alpha})`);
        g.addColorStop(1, 'rgba(232, 199, 122, 0)');
        ctx.fillStyle = g;
        ctx.beginPath();
        ctx.moveTo(ox, oy);
        ctx.lineTo(ox + Math.cos(ang - spread) * len, oy + Math.sin(ang - spread) * len);
        ctx.lineTo(ox + Math.cos(ang + spread) * len, oy + Math.sin(ang + spread) * len);
        ctx.closePath();
        ctx.fill();
      }
      // Sun glow at the origin
      const glow = ctx.createRadialGradient(ox, oy, 0, ox, oy, Math.max(w, h) * 0.55);
      glow.addColorStop(0, `rgba(246, 227, 180, ${0.28 * intensity})`);
      glow.addColorStop(1, 'rgba(246, 227, 180, 0)');
      ctx.fillStyle = glow;
      ctx.fillRect(0, 0, w, h);

      // Motes
      for (const m of motes) {
        m.x += m.vx + (pointer.x - 0.5) * 0.15 * m.z;
        m.y += m.vy;
        m.tw += 0.02 + m.z * 0.02;
        if (m.y < -10) {
          m.y = h + 10;
          m.x = Math.random() * w;
        }
        if (m.x < -10) m.x = w + 10;
        if (m.x > w + 10) m.x = -10;
        const px = m.x + (pointer.x - 0.5) * 30 * m.z;
        const py = m.y + (pointer.y - 0.5) * 20 * m.z;
        const a = (0.25 + 0.55 * (0.5 + 0.5 * Math.sin(m.tw))) * (0.35 + m.z * 0.65) * intensity;
        const rad = m.r * 4;
        const mg = ctx.createRadialGradient(px, py, 0, px, py, rad);
        const c = m.hue === 43 ? '246, 227, 180' : '208, 222, 216';
        mg.addColorStop(0, `rgba(${c}, ${a})`);
        mg.addColorStop(0.35, `rgba(${c}, ${a * 0.35})`);
        mg.addColorStop(1, `rgba(${c}, 0)`);
        ctx.fillStyle = mg;
        ctx.beginPath();
        ctx.arc(px, py, rad, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.restore();
    };

    const loop = (now: number) => {
      draw(now);
      raf = requestAnimationFrame(loop);
    };
    const play = () => {
      if (running || reduce || !visible || document.hidden) return;
      running = true;
      raf = requestAnimationFrame(loop);
    };
    const pause = () => {
      running = false;
      cancelAnimationFrame(raf);
    };

    resize();
    draw(performance.now());

    const ro = new ResizeObserver(() => {
      resize();
      draw(performance.now());
    });
    ro.observe(canvas);
    const io = new IntersectionObserver(([e]) => {
      visible = e.isIntersecting;
      if (visible) play();
      else pause();
    });
    io.observe(canvas);
    const onVis = () => (document.hidden ? pause() : play());
    document.addEventListener('visibilitychange', onVis);
    const onMove = (e: PointerEvent) => {
      if (e.pointerType !== 'mouse') return;
      pointer.tx = e.clientX / window.innerWidth;
      pointer.ty = e.clientY / window.innerHeight;
    };
    window.addEventListener('pointermove', onMove, { passive: true });
    play();

    return () => {
      pause();
      ro.disconnect();
      io.disconnect();
      document.removeEventListener('visibilitychange', onVis);
      window.removeEventListener('pointermove', onMove);
    };
  }, [intensity, originX, originY]);

  return <canvas ref={ref} aria-hidden="true" className={`pointer-events-none absolute inset-0 h-full w-full ${className}`} />;
};
