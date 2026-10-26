'use client';
import * as React from 'react';
import { useFrameHeight, useKitFrame } from '@/lib/frames';

type Props = {
  /** A web kit route under /showcase, e.g. `/showcase` or `/showcase/typeset?fixture=docs`. */
  path?: string;
  /** Accessible name for the iframe. */
  title: string;
  /** Show at most this much (px) and fade out the rest; `maxHeightSmall` below the md breakpoint. */
  maxHeight?: number;
  maxHeightSmall?: number;
  className?: string;
};

/**
 * The web kit's showcase, live and frameless: real registry components that follow this site's theme. The
 * kit reports its content height (`?autosize=1` → `kit:size`), so the frame is exactly as tall as the cards
 * (up to `maxHeight`, then it fades) and its width is the real width, so the masonry's columns respond.
 */
const MD = '(min-width: 768px)';
const subscribeMd = (onChange: () => void) => {
  const query = window.matchMedia(MD);
  query.addEventListener('change', onChange);
  return () => query.removeEventListener('change', onChange);
};

export function ShowcaseFrame({ path = '/showcase', title, maxHeight: maxLarge = 1100, maxHeightSmall = 720, className }: Props) {
  const wide = React.useSyncExternalStore(subscribeMd, () => window.matchMedia(MD).matches, () => true);
  const maxHeight = wide ? maxLarge : maxHeightSmall;
  const sep = path.includes('?') ? '&' : '?';
  const { ref, src } = useKitFrame('web', `${path}${sep}autosize=1`);
  const height = useFrameHeight(ref, src, maxHeight);

  const shown = Math.min(height ?? maxHeight, maxHeight);
  const clipped = height !== null && height > maxHeight;
  return (
    <div
      className={`relative w-full overflow-hidden ${clipped ? '[mask-image:linear-gradient(to_bottom,black_75%,transparent)]' : ''} ${className ?? ''}`}
      style={{ height: shown }}>
      {src ? (
        <iframe
          ref={ref}
          src={src}
          title={title}
          loading="lazy"
          className="block w-full border-0"
          style={{ height: height ?? maxHeight }}
        />
      ) : null}
      {height === null ? <div className="bg-muted-subtle absolute inset-0 animate-pulse" aria-hidden /> : null}
    </div>
  );
}
