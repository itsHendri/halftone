'use client';
import { PHONE_BEZEL, PHONE_VIEWPORT } from '@/lib/device';
import { useKitFrame } from '@/lib/frames';

/** The phone's logical viewport (iPhone 16/17), rendered at this size and scaled down to fit. */
const VIEWPORT = PHONE_VIEWPORT;

type Props = {
  /** A native kit route with its query, e.g. `/kitchen-sink?section=list-row` or `/shop`. */
  path: string;
  /** Accessible name for the iframe ("List row preview"). */
  title: string;
  /** Rendered width in px; the height follows the phone's aspect ratio. */
  width?: number;
  /** Show only the top part of the screen (in viewport px), for single components. */
  viewportHeight?: number;
  className?: string;
};

/**
 * The real native kit, live: an iframe of its web export in embed mode (no tab bar, header or KitChip),
 * scaled into a phone outline. The theme follows the site (see useKitFrame).
 */
export function PhoneFrame({ path, title, width = 300, viewportHeight = VIEWPORT.height, className }: Props) {
  const { ref, src } = useKitFrame('mobile', path);
  const scale = width / VIEWPORT.width;
  const bezel = PHONE_BEZEL;

  return (
    <div
      className={`border-border bg-foreground/90 inline-block shrink-0 rounded-[2.75rem] border shadow-xl ${className ?? ''}`}
      style={{ padding: bezel, width: width + bezel * 2 }}>
      <div className="bg-background relative overflow-hidden rounded-[2.1rem]" style={{ width, height: viewportHeight * scale }}>
        {src ? (
          <iframe
            ref={ref}
            src={src}
            title={title}
            loading="lazy"
            className="absolute left-0 top-0 origin-top-left border-0"
            style={{ width: VIEWPORT.width, height: viewportHeight, transform: `scale(${scale})` }}
          />
        ) : (
          <div className="bg-muted absolute inset-0 animate-pulse" aria-hidden />
        )}
      </div>
    </div>
  );
}
