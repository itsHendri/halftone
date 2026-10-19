'use client';
import * as React from 'react';
import { BRAND, type Brand, type BrandImage } from '@/lib/brand';
import { allowedOrigins, readEmbed } from '@/lib/embed';

/**
 * The brand on screen: lib/brand.ts, or the docs studio's live one in an embedded session. The studio posts
 * `{ type: 'kit:brand', v: 1, brand }` (brand null = back to lib/brand.ts) and keeps the latest in
 * sessionStorage for the next frame. Every image is checked before it is shown.
 */
export const EMBED_BRAND_KEY = 'kit.embed.brand';
const MAX_SVG = 300_000;
const MAX_PNG = 400_000;

function isBrandImage(value: unknown): value is BrandImage {
  if (!value || typeof value !== 'object') return false;
  const v = value as BrandImage;
  if (typeof v.aspect !== 'number' || !(v.aspect > 0 && v.aspect < 50)) return false;
  if (typeof v.png === 'string') return v.png.startsWith('data:image/png;base64,') && v.png.length <= MAX_PNG;
  if (typeof v.svg === 'string') return v.svg.length <= MAX_SVG && /^<svg\b/i.test(v.svg.trim()) && !/<script|<foreignObject|\son[a-z]+\s*=/i.test(v.svg);
  return false;
}

/** A message's brand, checked: the brand, null to go back to lib/brand.ts, or undefined to ignore it. */
export function parseEmbedBrand(data: unknown): Brand | null | undefined {
  const d = data as { type?: unknown; v?: unknown; brand?: unknown } | null;
  if (d?.type !== 'kit:brand' || d.v !== 1) return undefined;
  if (d.brand === null) return null;
  const b = d.brand as Partial<Brand> | undefined;
  if (!b || typeof b.name !== 'string' || !b.name.trim()) return undefined;
  const out: Brand = { name: b.name.slice(0, 80) };
  for (const key of ['logo', 'logoDark', 'mark', 'markDark'] as const) if (isBrandImage(b[key])) out[key] = b[key];
  return out;
}

/** A brand image as a URL an <img> or a CSS mask can load. */
export const brandImageUrl = (image: BrandImage) => image.png ?? `data:image/svg+xml;charset=utf-8,${encodeURIComponent(image.svg ?? '')}`;

// A tiny store rather than a provider: <Logo> works anywhere, and the server render (BRAND) hydrates cleanly
// before an embedded frame switches to the studio's brand.
let current: Brand = BRAND;
let started = false;
const listeners = new Set<() => void>();
const set = (next: Brand) => {
  current = next;
  listeners.forEach((l) => l());
};

function start() {
  if (started || typeof window === 'undefined') return;
  started = true;
  if (!readEmbed().embedded || window.parent === window) return;
  // The last brand the studio sent, for a frame that loads after it.
  try {
    const raw = sessionStorage.getItem(EMBED_BRAND_KEY);
    const cached = raw ? parseEmbedBrand({ type: 'kit:brand', v: 1, brand: JSON.parse(raw) }) : undefined;
    if (cached) current = cached;
  } catch {}
  const origins = allowedOrigins();
  window.addEventListener('message', (event: MessageEvent) => {
    if (!origins.includes(event.origin)) return;
    const next = parseEmbedBrand(event.data);
    if (next !== undefined) set(next ?? BRAND);
  });
}

const subscribe = (listener: () => void) => {
  start();
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
};

/** The brand on screen (lib/brand.ts, or the docs studio's live one). */
export const useBrand = () => React.useSyncExternalStore(subscribe, () => current, () => BRAND);
