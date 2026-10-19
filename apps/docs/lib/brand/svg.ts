/**
 * Brand images as the studio keeps them (lib/theme/brand.ts) and the kits render them (lib/brand.ts in each kit):
 * an SVG as text, or a PNG as a data URL. Pure functions, no DOM and no `@/` imports, so `node --test` runs them
 * (svg.test.ts).
 *
 * The kits only ever show these through an <img>/mask data URL (web) or react-native-svg (native), where scripts
 * never run; cleaning them here is defence in depth, and keeps the zip a person commits free of anything odd.
 */

/** One brand image. `aspect` is width / height; `mono` means every colour in it is `currentColor`. */
export type BrandImage = { svg?: string; png?: string; mono?: boolean; aspect: number };

/** Upload limits: an SVG as text, a PNG as a data URL (after downscaling to 1024 px). */
export const MAX_SVG = 300_000;
export const MAX_PNG = 400_000;

export class BrandImageError extends Error {}

/**
 * An uploaded SVG, cleaned: no scripts, foreign objects, event handlers, or links outside the file; a viewBox
 * required (it decides the logo's shape). Throws a BrandImageError for the person.
 */
export function cleanSvg(text: string): string {
  if (text.length > MAX_SVG) throw new BrandImageError(`That SVG is ${Math.round(text.length / 1000)} KB; keep it under ${MAX_SVG / 1000} KB (export it without embedded images).`);
  let svg = text
    .replace(/<\?xml[^>]*\?>/gi, '')
    .replace(/<!DOCTYPE[^>]*>/gi, '')
    .replace(/<!--[\s\S]*?-->/g, '')
    .trim();
  const open = /<svg\b[^>]*>/i.exec(svg);
  if (!open || !/<\/svg>\s*$/i.test(svg)) throw new BrandImageError('That file is not an SVG.');
  svg = svg
    .replace(/<script\b[\s\S]*?<\/script\s*>/gi, '')
    .replace(/<script\b[^>]*\/>/gi, '')
    .replace(/<foreignObject\b[\s\S]*?<\/foreignObject\s*>/gi, '')
    .replace(/\son[a-z]+\s*=\s*("[^"]*"|'[^']*'|[^\s>]+)/gi, '')
    // Links only within the file (#id); anything else (http:, data:, javascript:) goes.
    .replace(/\s(?:xlink:)?href\s*=\s*("(?!#)[^"]*"|'(?!#)[^']*')/gi, '');
  if (!viewBox(svg)) throw new BrandImageError('That SVG has no viewBox. Re-export it with a viewBox (most tools have a "responsive" option).');
  return svg;
}

/** The viewBox's width and height, or null. */
export function viewBox(svg: string): { w: number; h: number } | null {
  const m = /<svg\b[^>]*\sviewBox\s*=\s*["']\s*[-\d.]+[\s,]+[-\d.]+[\s,]+([\d.]+)[\s,]+([\d.]+)\s*["']/i.exec(svg);
  if (!m) return null;
  const w = Number(m[1]);
  const h = Number(m[2]);
  return w > 0 && h > 0 ? { w, h } : null;
}

const NO_COLOUR = /^(none|currentcolor|transparent|inherit|initial|unset|context-fill|context-stroke)$/i;
/** fill/stroke/stop-color/color as attributes, and as declarations in style="" or a <style> block. */
const ATTR = /\s(fill|stroke|stop-color|color)\s*=\s*("([^"]*)"|'([^']*)')/gi;
const DECL = /(fill|stroke|stop-color|color)\s*:\s*([^;"'}]+)/gi;

const normal = (c: string) => {
  const v = c.trim().toLowerCase().replace(/\s+/g, '');
  const short = /^#([0-9a-f])([0-9a-f])([0-9a-f])$/.exec(v);
  return short ? `#${short[1]}${short[1]}${short[2]}${short[2]}${short[3]}${short[3]}` : v;
};

/** The distinct colours an SVG paints with (url(#gradient) counts as its stops). */
export function svgColours(svg: string): string[] {
  const found = new Set<string>();
  const add = (value: string) => {
    const v = value.trim();
    if (!v || NO_COLOUR.test(v) || /^url\(/i.test(v)) return;
    found.add(normal(v));
  };
  for (const m of svg.matchAll(ATTR)) add(m[3] ?? m[4] ?? '');
  for (const m of svg.matchAll(DECL)) add(m[2]);
  return [...found];
}

/**
 * One colour (or none: shapes default to black) means the logo can take the theme's text colour. Gradients are
 * never one colour, even with matching stops: they're drawn on purpose.
 */
export function isMonochrome(svg: string): boolean {
  if (/<(linear|radial)Gradient\b/i.test(svg) || /<image\b/i.test(svg)) return false;
  return svgColours(svg).length <= 1;
}

/** Every colour → currentColor, and currentColor on the root for shapes that relied on the default black. */
export function toCurrentColor(svg: string): string {
  const out = svg
    .replace(ATTR, (all, name: string, _q: string, a?: string, b?: string) => {
      const v = (a ?? b ?? '').trim();
      return NO_COLOUR.test(v) || /^url\(/i.test(v) ? all : ` ${name}="currentColor"`;
    })
    .replace(DECL, (all, name: string, value: string) => (NO_COLOUR.test(value.trim()) || /^url\(/i.test(value.trim()) ? all : `${name}:currentColor`));
  return out.replace(/<svg\b([^>]*)>/i, (open, attrs: string) => (/\sfill\s*=/.test(attrs) ? open : `<svg${attrs} fill="currentColor">`));
}

/** An uploaded SVG as a brand image: cleaned, measured, and recoloured when it is one colour. */
export function brandImageFromSvg(text: string): BrandImage {
  const svg = cleanSvg(text);
  const box = viewBox(svg)!;
  const mono = isMonochrome(svg);
  return { svg: mono ? toCurrentColor(svg) : svg, mono, aspect: Math.round((box.w / box.h) * 1000) / 1000 };
}

/** A PNG data URL (already downscaled in the browser) as a brand image. */
export function brandImageFromPng(dataUrl: string, width: number, height: number): BrandImage {
  if (!dataUrl.startsWith('data:image/png;base64,')) throw new BrandImageError('That file is not a PNG.');
  if (dataUrl.length > MAX_PNG) throw new BrandImageError(`That PNG is too large (${Math.round(dataUrl.length / 1000)} KB as stored); use a simpler or smaller image, or an SVG.`);
  return { png: dataUrl, aspect: Math.round((width / height) * 1000) / 1000 };
}

/** A brand image as a URL an <img>, a CSS mask or a canvas can load. */
export const imageUrl = (image: BrandImage) => image.png ?? `data:image/svg+xml;charset=utf-8,${encodeURIComponent(image.svg ?? '')}`;

/** Whether a value from a message or storage is a brand image the kits may show. */
export function isBrandImage(value: unknown): value is BrandImage {
  if (!value || typeof value !== 'object') return false;
  const v = value as BrandImage;
  if (typeof v.aspect !== 'number' || !(v.aspect > 0 && v.aspect < 50)) return false;
  if (typeof v.png === 'string') return v.png.startsWith('data:image/png;base64,') && v.png.length <= MAX_PNG;
  if (typeof v.svg === 'string') return v.svg.length <= MAX_SVG && /^<svg\b/i.test(v.svg.trim()) && !/<script|<foreignObject|\son[a-z]+\s*=/i.test(v.svg);
  return false;
}
