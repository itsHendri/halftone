'use client';
import * as React from 'react';
import { RIPPLE_MS, RIPPLE_REACH, ripplePush, ripples, siteColours } from '@/lib/halftone/field';
import { fitCanvas, onFrame, prefersReducedMotion } from '@/lib/halftone/loop';

/**
 * A click on empty page sends a ring of halftone dots out from the pointer, pushing outward as it goes.
 * Background only: never on a control, a link, text, code or an embedded kit, never on touch (a tap starts
 * a scroll), never with a selection, and not at all under reduced motion. Hero fields push their own dots
 * with the same ripples (lib/halftone/field.ts).
 */
const SKIP = 'a, button, input, textarea, select, label, summary, iframe, video, pre, code, p, li, h1, h2, h3, h4, h5, h6, td, th, [role], [contenteditable], [data-no-ripple]';
const GRID = 14;

export function RippleLayer() {
  const ref = React.useRef<HTMLCanvasElement>(null);

  React.useEffect(() => {
    const canvas = ref.current;
    if (!canvas) return;
    let stop: (() => void) | null = null;

    const draw = (now: number) => {
      for (let i = ripples.length - 1; i >= 0; i--) if (now - ripples[i].t0 >= RIPPLE_MS) ripples.splice(i, 1);
      const w = window.innerWidth;
      const h = window.innerHeight;
      const ctx = fitCanvas(canvas, w, h);
      if (!ctx) return;
      ctx.clearRect(0, 0, w, h);
      if (!ripples.length) {
        stop?.();
        stop = null;
        return;
      }
      const sx = window.scrollX;
      const sy = window.scrollY;
      ctx.fillStyle = siteColours().primary;
      for (const r of ripples) {
        ctx.globalAlpha = 0.85 * (1 - (now - r.t0) / RIPPLE_MS);
        ctx.beginPath();
        // The page's grid, in page coordinates, around the ring.
        const x0 = Math.max(sx, r.x - RIPPLE_REACH);
        const y0 = Math.max(sy, r.y - RIPPLE_REACH);
        for (let y = Math.floor(y0 / GRID) * GRID + GRID / 2; y < Math.min(sy + h, r.y + RIPPLE_REACH); y += GRID) {
          for (let x = Math.floor(x0 / GRID) * GRID + GRID / 2; x < Math.min(sx + w, r.x + RIPPLE_REACH); x += GRID) {
            const push = ripplePush(r, now, x, y);
            if (!push) continue;
            const px = x - sx + push.ux * 12 * push.k;
            const py = y - sy + push.uy * 12 * push.k;
            ctx.moveTo(px + 1.3, py);
            ctx.arc(px, py, 1.3, 0, Math.PI * 2);
          }
        }
        ctx.fill();
      }
      ctx.globalAlpha = 1;
    };

    const onDown = (e: PointerEvent) => {
      if (e.button !== 0 || e.pointerType === 'touch' || prefersReducedMotion()) return;
      if (!(e.target instanceof Element) || e.target.closest(SKIP)) return;
      if (String(window.getSelection() ?? '').length) return;
      ripples.push({ x: e.pageX, y: e.pageY, t0: performance.now() });
      stop ??= onFrame(draw);
    };
    document.addEventListener('pointerdown', onDown);
    return () => {
      document.removeEventListener('pointerdown', onDown);
      stop?.();
    };
  }, []);

  return <canvas ref={ref} aria-hidden className="pointer-events-none fixed inset-0 z-50 size-full print:hidden" />;
}
