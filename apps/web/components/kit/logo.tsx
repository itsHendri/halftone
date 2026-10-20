'use client';
import type * as React from 'react';
import { cn } from 'cn';
import type { BrandImage } from '@/lib/brand';
import { brandImageUrl, useBrand } from '@/lib/brand-context';

type Props = {
  /** `full` the logo (default), `mark` the square mark (falls back to the logo). */
  variant?: 'full' | 'mark';
  /** Height in pixels. Width follows the logo's shape. Default 20. */
  size?: number;
  /** The name to show (and read out) when there's no logo: a sample's product name. Default the brand's name. */
  name?: string;
  className?: string;
};

/**
 * The brand's logo from lib/brand.ts (Studio's brand download). A one-colour logo is drawn in the
 * text colour (`currentColor`), so it follows light and dark and any `text-*` class; a coloured one can have a
 * dark version. Without a logo: a placeholder square and the name, so pages look the same before a brand is
 * applied.
 */
export function Logo({ variant = 'full', size = 20, name, className }: Props) {
  const brand = useBrand();
  const label = name ?? brand.name;
  const light = variant === 'mark' ? (brand.mark ?? brand.logo) : brand.logo;
  const dark = variant === 'mark' ? (brand.mark ? brand.markDark : brand.logoDark) : brand.logoDark;

  if (!light) {
    return (
      <span className={cn('inline-flex items-center gap-2', className)}>
        <span aria-hidden className="bg-primary shrink-0 rounded-md" style={{ width: size, height: size }} />
        {variant === 'full' ? label : <span className="sr-only">{label}</span>}
      </span>
    );
  }
  const draw = (image: BrandImage, extra?: string): React.ReactNode => {
    const url = brandImageUrl(image);
    const box = { width: Math.round(size * image.aspect), height: size };
    if (image.mono) {
      const mask = `url("${url}") center / contain no-repeat`;
      return <span role="img" aria-label={label} className={cn('inline-block shrink-0 bg-current', extra)} style={{ ...box, mask, WebkitMask: mask }} />;
    }
    // eslint-disable-next-line @next/next/no-img-element -- a data-URL logo: next/image has nothing to optimise
    return <img src={url} alt={label} {...box} className={cn('shrink-0', extra)} />;
  };
  return (
    <span className={cn('inline-flex items-center', className)}>
      {dark ? (
        <>
          {draw(light, 'dark:hidden')}
          {draw(dark, 'hidden dark:inline-block')}
        </>
      ) : (
        draw(light)
      )}
    </span>
  );
}
