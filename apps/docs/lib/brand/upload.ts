/**
 * A file the person dropped or picked, as a brand image: an SVG is cleaned and checked (lib/brand/svg.ts); a PNG is
 * downscaled to at most 1024 px on a canvas, so a large export still fits in this browser's storage.
 */
import { BrandImageError, brandImageFromPng, brandImageFromSvg, type BrandImage } from './svg';

const MAX_SIDE = 1024;

export async function readBrandFile(file: File): Promise<BrandImage> {
  if (file.type === 'image/svg+xml' || /\.svg$/i.test(file.name)) return brandImageFromSvg(await file.text());
  if (file.type === 'image/png' || /\.png$/i.test(file.name)) {
    const bitmap = await createImageBitmap(file);
    const scale = Math.min(1, MAX_SIDE / Math.max(bitmap.width, bitmap.height));
    const w = Math.max(1, Math.round(bitmap.width * scale));
    const h = Math.max(1, Math.round(bitmap.height * scale));
    const canvas = Object.assign(document.createElement('canvas'), { width: w, height: h });
    canvas.getContext('2d')!.drawImage(bitmap, 0, 0, w, h);
    bitmap.close();
    return brandImageFromPng(canvas.toDataURL('image/png'), w, h);
  }
  throw new BrandImageError('Use an SVG (best: it stays sharp and can follow the theme) or a PNG.');
}
