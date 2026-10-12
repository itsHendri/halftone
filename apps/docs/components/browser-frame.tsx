'use client';
import * as React from 'react';
import { useKitFrame } from '@/lib/frames';

type Props = {
  /** A web kit route with its query, e.g. `/components?section=data-table` or `/dashboard`. */
  path: string;
  /** Accessible name for the iframe. */
  title: string;
  /** The page's logical viewport, rendered at this size and scaled to the frame's width. */
  viewport?: { width: number; height: number };
  /** What the address bar shows (defaults to the path, without the query). */
  address?: string;
  className?: string;
  /** The window's whole height (px), e.g. to match a phone beside it; the page renders taller to fill it. */
  height?: number;
};

/**
 * The real web kit, live: an iframe of its static export in embed mode (no kit header or KitChip), in a
 * browser window that fills its container. The page renders at `viewport` and scales down to fit, so a
 * dashboard keeps its desktop layout in a narrow column. The theme follows the site (see useKitFrame).
 */
export function BrowserFrame({ path, title, viewport = { width: 1280, height: 800 }, address, className, height }: Props) {
  const { ref, src } = useKitFrame('web', path);
  const box = React.useRef<HTMLDivElement>(null);
  const [width, setWidth] = React.useState(0);

  React.useEffect(() => {
    const el = box.current;
    if (!el) return;
    const ro = new ResizeObserver(([entry]) => setWidth(entry.contentRect.width));
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  const scale = width ? Math.min(1, width / viewport.width) : 0;
  // With a fixed height, the page area is what's left under the title bar (h-9 and borders), and the page renders
  // at the viewport's width and however tall that area is at this scale.
  // Only beside something (a wide frame); stacked on a phone, the page keeps its own proportions.
  const fixed = height && width >= 560 ? height : undefined;
  const body = fixed ? fixed - 38 : scale ? viewport.height * scale : viewport.height * 0.5;
  const pageHeight = fixed && scale ? body / scale : viewport.height;

  return (
    <div className={`border-border bg-card w-full min-w-0 overflow-hidden rounded-xl border shadow-xl ${className ?? ''}`}>
      <div className="border-border bg-muted/60 flex h-9 items-center gap-3 border-b px-3" aria-hidden>
        <span className="flex gap-1.5">
          <span className="bg-foreground/15 size-2.5 rounded-full" />
          <span className="bg-foreground/15 size-2.5 rounded-full" />
          <span className="bg-foreground/15 size-2.5 rounded-full" />
        </span>
        <span className="bg-background text-muted-foreground min-w-0 flex-1 truncate rounded-md px-3 py-0.5 text-center font-mono text-xs">
          {address ?? path.split('?')[0]}
        </span>
        <span className="w-[42px]" />
      </div>
      <div ref={box} className="bg-background relative w-full" style={{ height: body }}>
        {src && scale ? (
          <iframe
            ref={ref}
            src={src}
            title={title}
            loading="lazy"
            className="absolute left-0 top-0 origin-top-left border-0"
            style={{ width: scale < 1 ? viewport.width : '100%', height: pageHeight, transform: scale < 1 ? `scale(${scale})` : undefined }}
          />
        ) : (
          <div className="bg-muted absolute inset-0 animate-pulse" aria-hidden />
        )}
      </div>
    </div>
  );
}
