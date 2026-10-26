'use client';
import * as React from 'react';
import { ripplePush, ripples, siteColours } from '@/lib/halftone/field';
import { fitCanvas, onFrame, prefersReducedMotion } from '@/lib/halftone/loop';

/**
 * The home hero's lit dot grid (Surface Field, the lab's "lit grid"): a faint grid that brightens and grows
 * in the brand colour around the pointer and a slowly wandering light, breathes when idle, bends away from
 * the pointer and is pushed by click ripples. It clears out behind the headline (a radial mask) so the type
 * stays legible. Fills its positioned parent; decorative, so hidden from assistive tech.
 */
const SPACING = 15;
const LIGHT = 260;
const BRIGHTNESS = 0.5;
const DISTORT = 8;
const LEVELS = 8;

export function HeroField() {
  const ref = React.useRef<HTMLCanvasElement>(null);

  React.useEffect(() => {
    const canvas = ref.current;
    const host = canvas?.parentElement;
    if (!canvas || !host) return;
    const pointer = { x: 0, y: 0, in: false };
    const onMove = (e: PointerEvent) => {
      const r = host.getBoundingClientRect();
      pointer.x = e.clientX - r.left;
      pointer.y = e.clientY - r.top;
      pointer.in = e.pointerType !== 'touch';
    };
    const onLeave = () => (pointer.in = false);
    host.addEventListener('pointermove', onMove);
    host.addEventListener('pointerleave', onLeave);

    let drawnAt = 0;
    const draw = (now: number) => {
      const still = prefersReducedMotion();
      // Still: no motion, but keep up with colour and size changes a couple of times a second.
      if (still && now - drawnAt < 500) return;
      drawnAt = now;
      const w = host.clientWidth;
      const h = host.clientHeight;
      const ctx = fitCanvas(canvas, w, h);
      if (!ctx) return;
      const colours = siteColours();
      const lights = still
        ? [{ x: w * 0.7, y: h * 0.3, cursor: false }]
        : [{ x: w * (0.5 + 0.35 * Math.sin(now * 0.00021)), y: h * (0.45 + 0.3 * Math.sin(now * 0.00033 + 1.3)), cursor: false }];
      if (pointer.in && !still) lights.push({ x: pointer.x, y: pointer.y, cursor: true });
      const rect = host.getBoundingClientRect();
      const ox = rect.left + window.scrollX;
      const oy = rect.top + window.scrollY;

      const buckets: number[][] = Array.from({ length: LEVELS }, () => []);
      for (let y = SPACING / 2; y < h; y += SPACING) {
        for (let x = SPACING / 2; x < w; x += SPACING) {
          let I = 0;
          let dx = 0;
          let dy = 0;
          for (const L of lights) {
            const d = Math.hypot(x - L.x, y - L.y);
            if (d >= LIGHT) continue;
            const k = (1 - d / LIGHT) ** 2;
            I = Math.max(I, k);
            if (L.cursor) {
              dx += ((x - L.x) / (d || 1)) * DISTORT * k;
              dy += ((y - L.y) / (d || 1)) * DISTORT * k;
            }
          }
          for (const r of ripples) {
            const push = ripplePush(r, now, x + ox, y + oy);
            if (!push) continue;
            dx += push.ux * 10 * push.k;
            dy += push.uy * 10 * push.k;
            I = Math.max(I, push.k * 0.8);
          }
          const breathe = still ? 0 : 0.05 * Math.sin(now * 0.0013 + ((x * 7 + y * 13) % 6.28));
          const alpha = Math.min(0.999, 0.12 + breathe + I * (0.45 + BRIGHTNESS));
          buckets[Math.floor(alpha * LEVELS)].push(x + dx, y + dy, 0.9 + I * 1.5);
        }
      }
      ctx.clearRect(0, 0, w, h);
      buckets.forEach((b, i) => {
        if (!b.length) return;
        ctx.globalAlpha = (i + 0.5) / LEVELS;
        // Faint dots in the text colour; lit ones in the brand.
        ctx.fillStyle = i >= LEVELS / 2 ? colours.primary : colours.foreground;
        ctx.beginPath();
        for (let j = 0; j < b.length; j += 3) {
          ctx.moveTo(b[j] + b[j + 2], b[j + 1]);
          ctx.arc(b[j], b[j + 1], b[j + 2], 0, Math.PI * 2);
        }
        ctx.fill();
      });
      ctx.globalAlpha = 1;
    };

    // Draw only while the hero is on screen.
    let stop: (() => void) | null = null;
    const seen = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) stop ??= onFrame(draw);
      else {
        stop?.();
        stop = null;
      }
    });
    seen.observe(host);
    return () => {
      seen.disconnect();
      stop?.();
      host.removeEventListener('pointermove', onMove);
      host.removeEventListener('pointerleave', onLeave);
    };
  }, []);

  return (
    <canvas
      ref={ref}
      aria-hidden
      // eslint-disable-next-line halftone/no-raw-colour -- a mask: #000 is opacity, not a colour
      className="pointer-events-none absolute inset-0 -z-10 size-full [mask-image:radial-gradient(ellipse_46%_34%_at_50%_32%,transparent_35%,#000_92%)] print:hidden"
    />
  );
}
