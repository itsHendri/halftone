'use client';
import * as React from 'react';
import { cn } from 'cn';
import { useReducedMotion } from '@/hooks/use-reduced-motion';

type Props<T extends string> = {
  segments: readonly { value: T; label: string }[];
  value: T;
  onChange: (value: T) => void;
  /** Names the group for screen readers ("View"). */
  'aria-label'?: string;
  className?: string;
};

/**
 * A sliding thumb over 2–4 mutually exclusive options. For content panes use Tabs.
 * Labels never truncate: segments share the width equally while every label fits, a long label takes what it needs,
 * and when even that is too wide the control scrolls sideways inside itself (the page never does).
 */
export function SegmentedControl<T extends string>({ segments, value, onChange, className, ...props }: Props<T>) {
  const reduced = useReducedMotion();
  const index = Math.max(
    0,
    segments.findIndex((s) => s.value === value)
  );
  const track = React.useRef<HTMLDivElement>(null);
  const buttons = React.useRef<(HTMLButtonElement | null)[]>([]);
  // The thumb sits under the active button, measured, so segments of different widths still line up.
  const [thumb, setThumb] = React.useState<{ left: number; width: number } | null>(null);

  React.useLayoutEffect(() => {
    const el = track.current;
    if (!el) return;
    const measure = () => {
      const b = buttons.current[index];
      if (!b) return;
      setThumb((t) => (t && t.left === b.offsetLeft && t.width === b.offsetWidth ? t : { left: b.offsetLeft, width: b.offsetWidth }));
      // Keep the active segment in view when the control scrolls (never the page, which scrollIntoView would move).
      if (el.scrollWidth > el.clientWidth) {
        const end = b.offsetLeft + b.offsetWidth;
        if (b.offsetLeft < el.scrollLeft) el.scrollLeft = b.offsetLeft;
        else if (end > el.scrollLeft + el.clientWidth) el.scrollLeft = end - el.clientWidth;
      }
    };
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    buttons.current.forEach((b) => b && ro.observe(b));
    return () => ro.disconnect();
  }, [index, segments]);

  return (
    <div
      ref={track}
      role="radiogroup"
      aria-label={props['aria-label']}
      className={cn(
        'bg-muted relative grid auto-cols-[minmax(max-content,1fr)] grid-flow-col overflow-x-auto overscroll-x-contain rounded-lg p-[3px] [scrollbar-width:none]',
        className
      )}>
      <span
        aria-hidden
        className={cn(
          'bg-card absolute inset-y-[3px] left-0 rounded-md shadow-sm',
          // Slide between segments, not on the first measure.
          thumb && !reduced && 'transition-[transform,width] duration-base ease-standard'
        )}
        style={
          thumb
            ? { width: thumb.width, transform: `translateX(${thumb.left}px)` }
            : // Before the first measure (the server render): equal shares, which is what most controls show anyway.
              { left: 3, width: `calc((100% - 6px) / ${segments.length})`, transform: `translateX(${index * 100}%)` }
        }
      />
      {segments.map((s, i) => {
        const active = s.value === value;
        return (
          <button
            key={s.value}
            ref={(b) => {
              buttons.current[i] = b;
            }}
            type="button"
            role="radio"
            aria-checked={active}
            onClick={() => onChange(s.value)}
            className={cn(
              'focus-visible:ring-ring/50 relative h-8 rounded-md px-3 text-sm whitespace-nowrap outline-none focus-visible:ring-[3px]',
              active ? 'text-foreground font-semibold' : 'text-muted-foreground hover:text-foreground'
            )}>
            {/* A hidden bold copy reserves the active weight's width, so choosing a segment never nudges the others. */}
            <span className="grid">
              <span className="col-start-1 row-start-1">{s.label}</span>
              <span aria-hidden className="invisible col-start-1 row-start-1 font-semibold">
                {s.label}
              </span>
            </span>
          </button>
        );
      })}
    </div>
  );
}
