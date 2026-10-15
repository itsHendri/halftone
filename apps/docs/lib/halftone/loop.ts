'use client';
/**
 * One requestAnimationFrame for everything that moves on the site (the ambient theme, the hero field, the
 * click ripple, the card swarm), so they never run loops of their own. A callback runs every frame while it
 * is subscribed; subscribe only while there is something to draw.
 */
type Frame = (now: number) => void;
const frames = new Set<Frame>();
let raf = 0;

function run(now: number) {
  raf = 0;
  for (const frame of [...frames]) frame(now);
  if (frames.size) raf = requestAnimationFrame(run);
}

export function onFrame(frame: Frame) {
  frames.add(frame);
  if (!raf) raf = requestAnimationFrame(run);
  return () => {
    frames.delete(frame);
  };
}

const REDUCE = '(prefers-reduced-motion: reduce)';
export const prefersReducedMotion = () => typeof window !== 'undefined' && window.matchMedia(REDUCE).matches;
export function onReducedMotionChange(listener: () => void) {
  const query = window.matchMedia(REDUCE);
  query.addEventListener('change', listener);
  return () => query.removeEventListener('change', listener);
}

/** Canvas backing size at the device pixel ratio (capped at 2), returning a context in CSS pixels. */
export function fitCanvas(canvas: HTMLCanvasElement, width: number, height: number) {
  const dpr = Math.min(2, window.devicePixelRatio || 1);
  const w = Math.round(width * dpr);
  const h = Math.round(height * dpr);
  if (canvas.width !== w || canvas.height !== h) {
    canvas.width = w;
    canvas.height = h;
  }
  const ctx = canvas.getContext('2d');
  ctx?.setTransform(dpr, 0, 0, dpr, 0, 0);
  return ctx;
}
