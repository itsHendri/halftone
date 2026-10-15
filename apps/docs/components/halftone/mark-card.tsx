'use client';
import { ArrowRightIcon } from 'lucide-react';
import Link from 'next/link';
import * as React from 'react';
import { siteColours } from '@/lib/halftone/field';
import { fitCanvas, onFrame, prefersReducedMotion } from '@/lib/halftone/loop';

/**
 * A large call-to-action (Carbon's home cards): it fills with the brand on hover or focus, and a swarm of
 * dots flies in from the pointer to form the halftone mark, a sphere lit from the top left. They scatter on
 * leave. A fine pointer only, and not under reduced motion: otherwise it just fills.
 */
type Dot = { tx: number; ty: number; r: number; delay: number; sx: number; sy: number };

/** The mark: a sphere of dots on the card's right, bigger where the light falls. */
function markDots(w: number, h: number, from: { x: number; y: number }): Dot[] {
  const R = Math.min(h * 0.36, 74);
  const cx = w - R - 28;
  const cy = h / 2;
  const S = 7.5;
  const lx = cx - R * 0.38;
  const ly = cy - R * 0.38;
  const dots: Dot[] = [];
  for (let y = cy - R; y <= cy + R; y += S) {
    for (let x = cx - R; x <= cx + R; x += S) {
      if (Math.hypot(x - cx, y - cy) > R) continue;
      const shade = 1 - Math.min(1, Math.hypot(x - lx, y - ly) / (R * 1.55));
      dots.push({ tx: x, ty: y, r: 0.5 + 2.9 * shade, delay: Math.random() * 220, sx: from.x + (Math.random() - 0.5) * 60, sy: from.y + (Math.random() - 0.5) * 60 });
    }
  }
  return dots;
}

const easeOutBack = (x: number) => 1 + 2.2 * (x - 1) ** 3 + 1.2 * (x - 1) ** 2;

export function MarkCard({ href, title, children }: { href: string; title: string; children: React.ReactNode }) {
  const ref = React.useRef<HTMLCanvasElement>(null);
  const card = React.useRef<HTMLAnchorElement>(null);

  React.useEffect(() => {
    const canvas = ref.current;
    const el = card.current;
    if (!canvas || !el) return;
    const fine = window.matchMedia('(hover: hover) and (pointer: fine)');
    let phase: 'idle' | 'in' | 'out' = 'idle';
    let t0 = 0;
    let dots: Dot[] = [];
    let stop: (() => void) | null = null;

    const draw = (now: number) => {
      const w = el.clientWidth;
      const h = el.clientHeight;
      const ctx = fitCanvas(canvas, w, h);
      if (!ctx) return;
      ctx.clearRect(0, 0, w, h);
      const dt = now - t0;
      let alive = false;
      ctx.beginPath();
      for (const d of dots) {
        let x: number;
        let y: number;
        let r: number;
        if (phase === 'in') {
          const k = Math.min(1, Math.max(0, (dt - d.delay) / 720));
          const e = easeOutBack(k);
          x = d.sx + (d.tx - d.sx) * e;
          y = d.sy + (d.ty - d.sy) * e;
          r = d.r * Math.min(1, 0.4 + k);
          if (k < 1) alive = true;
        } else {
          const k = Math.min(1, dt / 320);
          const cx = w - Math.min(h * 0.36, 74) - 28;
          x = d.tx + (d.tx - cx) * 0.6 * k;
          y = d.ty + (d.ty - h / 2) * 0.6 * k;
          r = d.r * (1 - k);
          if (k < 1) alive = true;
        }
        if (r < 0.2) continue;
        ctx.moveTo(x + r, y);
        ctx.arc(x, y, r, 0, Math.PI * 2);
      }
      ctx.globalAlpha = 0.9;
      ctx.fillStyle = siteColours()['primary-foreground'];
      ctx.fill();
      ctx.globalAlpha = 1;
      // Settled in (the mark stays drawn) or scattered out: stop drawing.
      if (!alive) {
        stop?.();
        stop = null;
        if (phase === 'out') phase = 'idle';
      }
    };

    const start = (from: { x: number; y: number }) => {
      if (!fine.matches || prefersReducedMotion()) return;
      dots = markDots(el.clientWidth, el.clientHeight, from);
      phase = 'in';
      t0 = performance.now();
      stop ??= onFrame(draw);
    };
    const end = () => {
      if (phase !== 'in') return;
      phase = 'out';
      t0 = performance.now();
      stop ??= onFrame(draw);
    };
    const onEnter = (e: PointerEvent) => {
      const r = el.getBoundingClientRect();
      start({ x: e.clientX - r.left, y: e.clientY - r.top });
    };
    // Keyboard focus gets the mark too, gathering from the card's left edge.
    const onFocus = () => el.matches(':focus-visible') && start({ x: 24, y: el.clientHeight / 2 });
    el.addEventListener('pointerenter', onEnter);
    el.addEventListener('pointerleave', end);
    el.addEventListener('focus', onFocus);
    el.addEventListener('blur', end);
    return () => {
      stop?.();
      el.removeEventListener('pointerenter', onEnter);
      el.removeEventListener('pointerleave', end);
      el.removeEventListener('focus', onFocus);
      el.removeEventListener('blur', end);
    };
  }, []);

  return (
    <Link
      ref={card}
      href={href}
      className="group bg-card/75 hover:bg-primary hover:text-primary-foreground focus-visible:bg-primary focus-visible:text-primary-foreground focus-visible:ring-ring relative flex min-h-44 flex-col justify-between gap-6 overflow-hidden p-5 text-left transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset backdrop-blur-sm motion-reduce:transition-none sm:min-h-48">
      <canvas ref={ref} aria-hidden className="pointer-events-none absolute inset-0 size-full" />
      <span className="relative flex max-w-[60%] flex-col gap-1">
        <span className="text-xl font-medium tracking-tight">{title}</span>
        <span className="text-muted-foreground group-hover:text-primary-foreground group-focus-visible:text-primary-foreground text-sm leading-6 transition-colors motion-reduce:transition-none">
          {children}
        </span>
      </span>
      <ArrowRightIcon className="relative size-5 self-end" aria-hidden />
    </Link>
  );
}
