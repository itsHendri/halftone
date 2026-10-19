import { BRAND, type Brand, type BrandImage } from '@/lib/brand';
import { EMBED, useEmbedMessage } from '@/lib/embed';
import * as React from 'react';
import { Platform } from 'react-native';

/**
 * The brand on screen: lib/brand.ts, or the docs studio's live one in an embedded session. The studio posts
 * `{ type: 'kit:brand', v: 1, brand }` (brand null = back to lib/brand.ts) and keeps the latest in
 * sessionStorage for the next frame's first paint. Every image is checked before it is shown.
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

function cachedBrand(): Brand | null {
  if (!EMBED.embedded || Platform.OS !== 'web' || typeof window === 'undefined') return null;
  try {
    const raw = window.sessionStorage.getItem(EMBED_BRAND_KEY);
    return raw ? (parseEmbedBrand({ type: 'kit:brand', v: 1, brand: JSON.parse(raw) }) ?? null) : null;
  } catch {
    return null;
  }
}

const BrandContext = React.createContext<Brand>(BRAND);

export function BrandProvider({ children }: { children: React.ReactNode }) {
  const [brand, setBrand] = React.useState<Brand>(() => cachedBrand() ?? BRAND);
  const onBrand = React.useCallback((data: unknown) => {
    const next = parseEmbedBrand(data);
    if (next !== undefined) setBrand(next ?? BRAND);
  }, []);
  useEmbedMessage('kit:brand', onBrand);
  return <BrandContext.Provider value={brand}>{children}</BrandContext.Provider>;
}

/** The brand on screen (lib/brand.ts, or the docs studio's live one). */
export const useBrand = () => React.useContext(BrandContext);
