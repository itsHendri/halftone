'use client';
import { useFrameHeight, useKitFrame } from '@/lib/frames';

type Props = {
  kind: 'mobile' | 'web';
  /** The kit's single-demo route, e.g. `/kitchen-sink?section=button`. */
  path: string;
  title: string;
  /** The least height (px): overlays need room to open. */
  minHeight?: number;
};

/**
 * A component on a plain stage: the kit's own demo, live and frameless, as tall as it reports itself
 * (`?autosize=1` → `kit:size`). Native demos render at phone width (390px), centred; web ones fill the stage.
 * Follows this site's theme (useKitFrame).
 */
export function KitStage({ kind, path, title, minHeight = 120 }: Props) {
  const sep = path.includes('?') ? '&' : '?';
  const { ref, src } = useKitFrame(kind, `${path}${sep}autosize=1`);
  const height = useFrameHeight(ref, src, 360);
  const h = Math.max(height ?? minHeight, minHeight);
  return (
    <div className="border-border bg-background relative flex justify-center overflow-hidden rounded-xl border">
      <div className="relative w-full" style={{ maxWidth: kind === 'mobile' ? 390 : undefined, height: h }}>
        {src ? <iframe ref={ref} src={src} title={title} loading="lazy" className="block size-full border-0" /> : null}
        {height === null ? <div className="bg-muted/60 absolute inset-0 animate-pulse" aria-hidden /> : null}
      </div>
    </div>
  );
}
