'use client';

import React, { useCallback, useEffect, useRef, useState } from 'react';
import { RotateCcw, ZoomIn, ZoomOut } from 'lucide-react';

export const MIN_ZOOM = 1;
export const MAX_ZOOM = 5;
const STEP = 1.5;

type View = { scale: number; x: number; y: number };
const FIT: View = { scale: 1, x: 0, y: 0 };
const clampScale = (s: number) => Math.min(MAX_ZOOM, Math.max(MIN_ZOOM, s));

export interface ZoomPan {
  view: View;
  stageRef: React.RefObject<HTMLDivElement | null>;
  zoomIn: () => void;
  zoomOut: () => void;
  reset: () => void;
  /** Zoom to `scale` keeping the point (px from the stage centre) under the cursor/finger. */
  zoomAt: (scale: number, px?: number, py?: number) => void;
  setView: React.Dispatch<React.SetStateAction<View>>;
}

/** Zoom and pan state for one image. Resets whenever `resetKey` changes (e.g. the next photo). */
export function useZoomPan(resetKey: unknown): ZoomPan {
  const [view, setView] = useState<View>(FIT);
  const stageRef = useRef<HTMLDivElement | null>(null);

  // Keep the image covering the stage: no panning past its edges.
  const clamp = useCallback((v: View): View => {
    const el = stageRef.current;
    if (v.scale <= 1 || !el) return { scale: clampScale(v.scale), x: 0, y: 0 };
    const maxX = ((v.scale - 1) * el.clientWidth) / 2;
    const maxY = ((v.scale - 1) * el.clientHeight) / 2;
    return { scale: v.scale, x: Math.min(maxX, Math.max(-maxX, v.x)), y: Math.min(maxY, Math.max(-maxY, v.y)) };
  }, []);

  const zoomAt = useCallback(
    (scale: number, px = 0, py = 0) =>
      setView((v) => {
        const s = clampScale(scale);
        const k = s / v.scale;
        return clamp({ scale: s, x: px - (px - v.x) * k, y: py - (py - v.y) * k });
      }),
    [clamp]
  );
  const zoomIn = useCallback(() => setView((v) => clamp({ ...v, scale: clampScale(v.scale * STEP), x: v.x * STEP, y: v.y * STEP })), [clamp]);
  const zoomOut = useCallback(() => setView((v) => clamp({ ...v, scale: clampScale(v.scale / STEP), x: v.x / STEP, y: v.y / STEP })), [clamp]);
  const reset = useCallback(() => setView(FIT), []);

  useEffect(() => {
    setView(FIT);
  }, [resetKey]);

  return { view, stageRef, zoomIn, zoomOut, reset, zoomAt, setView };
}

/**
 * The area the image is shown in: wheel / trackpad zoom toward the cursor, double-click or double-tap
 * to zoom, drag to pan when zoomed, pinch to zoom on touch screens.
 */
export const ZoomPanStage: React.FC<{ zoom: ZoomPan; className?: string; children: React.ReactNode; label?: string }> = ({
  zoom,
  className = '',
  children,
  label = 'Photo',
}) => {
  const { view, stageRef, zoomAt, setView } = zoom;
  const pointers = useRef(new Map<number, { x: number; y: number }>());
  const gesture = useRef<{ kind: 'pan' | 'pinch'; startX: number; startY: number; view: View; dist: number } | null>(null);
  const lastTap = useRef(0);
  const [active, setActive] = useState(false);

  const toLocal = (clientX: number, clientY: number) => {
    const r = stageRef.current!.getBoundingClientRect();
    return { x: clientX - (r.left + r.width / 2), y: clientY - (r.top + r.height / 2) };
  };

  // Wheel zoom needs a non-passive listener to stop the page from scrolling.
  useEffect(() => {
    const el = stageRef.current;
    if (!el) return;
    const onWheel = (e: WheelEvent) => {
      e.preventDefault();
      const p = toLocal(e.clientX, e.clientY);
      const factor = Math.exp(-e.deltaY * (e.ctrlKey ? 0.01 : 0.0025));
      setView((v) => {
        const s = clampScale(v.scale * factor);
        const k = s / v.scale;
        const next = { scale: s, x: p.x - (p.x - v.x) * k, y: p.y - (p.y - v.y) * k };
        if (s <= 1) return { scale: 1, x: 0, y: 0 };
        const maxX = ((s - 1) * el.clientWidth) / 2;
        const maxY = ((s - 1) * el.clientHeight) / 2;
        return { scale: s, x: Math.min(maxX, Math.max(-maxX, next.x)), y: Math.min(maxY, Math.max(-maxY, next.y)) };
      });
    };
    el.addEventListener('wheel', onWheel, { passive: false });
    return () => el.removeEventListener('wheel', onWheel);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [stageRef, setView]);

  const pinchInfo = () => {
    const [a, b] = Array.from(pointers.current.values());
    return { dist: Math.hypot(a.x - b.x, a.y - b.y), cx: (a.x + b.x) / 2, cy: (a.y + b.y) / 2 };
  };

  const onPointerDown = (e: React.PointerEvent) => {
    if ((e.target as HTMLElement).closest('button')) return;
    try {
      (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
    } catch {
      // Not a capturable pointer (e.g. it ended already); the gesture still works without capture.
    }
    pointers.current.set(e.pointerId, { x: e.clientX, y: e.clientY });
    if (pointers.current.size === 2) {
      gesture.current = { kind: 'pinch', startX: 0, startY: 0, view, dist: pinchInfo().dist || 1 };
      setActive(true);
    } else if (pointers.current.size === 1) {
      // Double-tap / double-click: zoom in to 2.5× at that point, or back to fit.
      const now = Date.now();
      if (now - lastTap.current < 300) {
        const p = toLocal(e.clientX, e.clientY);
        if (view.scale > 1) setView(FIT);
        else zoomAt(2.5, p.x, p.y);
        lastTap.current = 0;
        gesture.current = null;
        return;
      }
      lastTap.current = now;
      gesture.current = { kind: 'pan', startX: e.clientX, startY: e.clientY, view, dist: 0 };
      setActive(true);
    }
  };

  const onPointerMove = (e: React.PointerEvent) => {
    if (!pointers.current.has(e.pointerId)) return;
    pointers.current.set(e.pointerId, { x: e.clientX, y: e.clientY });
    const g = gesture.current;
    if (!g) return;
    if (g.kind === 'pinch' && pointers.current.size >= 2) {
      const { dist, cx, cy } = pinchInfo();
      const p = toLocal(cx, cy);
      const s = clampScale(g.view.scale * (dist / g.dist));
      const k = s / g.view.scale;
      const el = stageRef.current!;
      const maxX = ((s - 1) * el.clientWidth) / 2;
      const maxY = ((s - 1) * el.clientHeight) / 2;
      const nx = p.x - (p.x - g.view.x) * k;
      const ny = p.y - (p.y - g.view.y) * k;
      setView(s <= 1 ? FIT : { scale: s, x: Math.min(maxX, Math.max(-maxX, nx)), y: Math.min(maxY, Math.max(-maxY, ny)) });
    } else if (g.kind === 'pan' && g.view.scale > 1) {
      const el = stageRef.current!;
      const maxX = ((g.view.scale - 1) * el.clientWidth) / 2;
      const maxY = ((g.view.scale - 1) * el.clientHeight) / 2;
      const nx = g.view.x + (e.clientX - g.startX);
      const ny = g.view.y + (e.clientY - g.startY);
      setView({ scale: g.view.scale, x: Math.min(maxX, Math.max(-maxX, nx)), y: Math.min(maxY, Math.max(-maxY, ny)) });
    }
  };

  const onPointerUp = (e: React.PointerEvent) => {
    pointers.current.delete(e.pointerId);
    if (pointers.current.size === 1) {
      const [rest] = Array.from(pointers.current.values());
      gesture.current = { kind: 'pan', startX: rest.x, startY: rest.y, view, dist: 0 };
    } else if (pointers.current.size === 0) {
      gesture.current = null;
      setActive(false);
    }
  };

  const zoomed = view.scale > 1;
  return (
    <div
      ref={stageRef}
      className={`relative touch-none overflow-hidden ${zoomed ? 'cursor-grab active:cursor-grabbing' : 'cursor-zoom-in'} ${className}`}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
      onPointerCancel={onPointerUp}
      aria-label={`${label}${zoomed ? `, zoomed ${Math.round(view.scale * 100)}%` : ''}. Scroll or pinch to zoom; drag to move when zoomed.`}
      data-testid="zoom-stage"
    >
      <div
        className="absolute inset-0"
        style={{
          transform: `translate(${view.x}px, ${view.y}px) scale(${view.scale})`,
          transformOrigin: 'center center',
          transition: active ? 'none' : 'transform 120ms ease-out',
          willChange: 'transform',
        }}
      >
        {children}
      </div>
    </div>
  );
};

/** Zoom out / percentage (click to reset) / zoom in, for a dark viewer toolbar. */
export const ZoomControls: React.FC<{ zoom: ZoomPan }> = ({ zoom }) => {
  const pct = Math.round(zoom.view.scale * 100);
  const btn = 'p-2 text-slate-300 hover:text-white hover:bg-white/10 rounded-full transition cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed';
  return (
    <div className="flex items-center gap-0.5 rounded-full bg-white/5 px-1" role="group" aria-label="Zoom">
      <button type="button" onClick={zoom.zoomOut} disabled={zoom.view.scale <= MIN_ZOOM} className={btn} title="Zoom out (−)" aria-label="Zoom out">
        <ZoomOut className="w-4 h-4" />
      </button>
      <button
        type="button"
        onClick={zoom.reset}
        disabled={zoom.view.scale === 1}
        className="min-w-[3.25rem] rounded-full px-1.5 py-1 text-center font-mono text-[11px] text-slate-200 hover:bg-white/10 disabled:cursor-default disabled:hover:bg-transparent"
        title="Reset to fit (0)"
        aria-label={`Zoom ${pct}%. Reset to fit`}
        data-testid="zoom-level"
      >
        {zoom.view.scale === 1 ? '100%' : (
          <span className="inline-flex items-center gap-1">
            {pct}% <RotateCcw className="h-3 w-3" />
          </span>
        )}
      </button>
      <button type="button" onClick={zoom.zoomIn} disabled={zoom.view.scale >= MAX_ZOOM} className={btn} title="Zoom in (+)" aria-label="Zoom in">
        <ZoomIn className="w-4 h-4" />
      </button>
    </div>
  );
};
