'use client';
import type * as React from 'react';
import { imageUrl, type BrandImage } from '@/lib/brand/svg';

/**
 * A brand image drawn the way the kits draw it: a one-colour SVG as a mask in the text colour (so it follows
 * light, dark and any `text-*` class), anything else as an image. Height in pixels; width follows its shape.
 * An empty label makes it decorative (hidden from screen readers), for a thumbnail beside its own text.
 */
export function BrandImageView({ image, height, label, className }: { image: BrandImage; height: number; label: string; className?: string }) {
  const url = imageUrl(image);
  const box: React.CSSProperties = { width: Math.round(height * image.aspect), height };
  if (image.mono) {
    const mask = `url("${url}") center / contain no-repeat`;
    const name = label ? { role: 'img', 'aria-label': label } : { 'aria-hidden': true };
    return <span {...name} className={`inline-block shrink-0 bg-current ${className ?? ''}`} style={{ ...box, mask, WebkitMask: mask }} />;
  }
  // eslint-disable-next-line @next/next/no-img-element -- a data-URL logo the visitor uploaded
  return <img src={url} alt={label} style={box} className={`shrink-0 object-contain ${className ?? ''}`} />;
}
