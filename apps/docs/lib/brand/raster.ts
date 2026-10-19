/**
 * Brand images drawn to PNGs at the sizes the kits need (app icon, Android icon, splash, favicons), in the
 * browser with a canvas. A one-colour SVG is drawn in the colour given (its currentColor).
 */
import { imageUrl, type BrandImage } from './svg';

export type Render = {
  /** The square canvas, in pixels. */
  size: number;
  /** Fill behind the image (an opaque icon), or none (transparent). */
  background?: string;
  /** The image's box as a share of the canvas (it's fitted inside, centred). */
  scale: number;
  /** The colour a one-colour SVG takes. */
  color?: string;
};

function load(src: string) {
  return new Promise<HTMLImageElement>((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error('The logo could not be drawn.'));
    img.src = src;
  });
}

/** The image, coloured and fitted into the canvas, as PNG bytes. */
export async function renderPng(image: BrandImage, { size, background, scale, color }: Render): Promise<Uint8Array> {
  const src = image.svg && image.mono && color ? imageUrl({ ...image, svg: image.svg.replace(/currentColor/g, color) }) : imageUrl(image);
  const img = await load(src);
  const canvas = Object.assign(document.createElement('canvas'), { width: size, height: size });
  const ctx = canvas.getContext('2d')!;
  if (background) {
    ctx.fillStyle = background;
    ctx.fillRect(0, 0, size, size);
  }
  const box = size * scale;
  const w = image.aspect >= 1 ? box : box * image.aspect;
  const h = image.aspect >= 1 ? box / image.aspect : box;
  ctx.imageSmoothingQuality = 'high';
  ctx.drawImage(img, (size - w) / 2, (size - h) / 2, w, h);
  const blob = await new Promise<Blob>((resolve, reject) => canvas.toBlob((b) => (b ? resolve(b) : reject(new Error('The icon could not be drawn.'))), 'image/png'));
  return new Uint8Array(await blob.arrayBuffer());
}
