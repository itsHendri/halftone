'use client';
import { cn } from 'cn';
import * as React from 'react';
import { PagerDots } from '@/components/kit/pager-dots';

type Props = {
  children: React.ReactNode;
  /** Width of each page: px, or any CSS length ("85%" peeks the next card). Default "85%". */
  itemWidth?: number | string;
  /** Gap between pages (px). */
  gap?: number;
  /** Inset before the first and after the last page (px). */
  sidePadding?: number;
  showDots?: boolean;
  onIndexChange?: (index: number) => void;
  /** Names the region for screen readers. Default "Pages". */
  'aria-label'?: string;
  className?: string;
};

/** Horizontal snap pager with dots. Marketing banners, account cards, onboarding slides. */
export function HorizontalPager({ children, itemWidth = '85%', gap = 12, sidePadding = 0, showDots = true, onIndexChange, className, ...props }: Props) {
  const items = React.Children.toArray(children);
  const [active, setActive] = React.useState(0);
  const onScroll = (e: React.UIEvent<HTMLDivElement>) => {
    const el = e.currentTarget;
    const first = el.firstElementChild as HTMLElement | null;
    if (!first) return;
    const i = Math.round(el.scrollLeft / (first.offsetWidth + gap));
    if (i !== active && i >= 0 && i < items.length) {
      setActive(i);
      onIndexChange?.(i);
    }
  };
  return (
    <div className={cn('flex min-w-0 flex-col', className)}>
      {/* Focusable so arrow keys scroll it. */}
      <div
        role="region"
        aria-label={props['aria-label'] ?? 'Pages'}
        tabIndex={0}
        onScroll={onScroll}
        className="focus-visible:ring-ring/50 flex snap-x snap-mandatory overflow-x-auto rounded-lg outline-none [scrollbar-width:none] focus-visible:ring-[3px] motion-safe:scroll-smooth"
        style={{ gap, paddingInline: sidePadding, scrollPaddingInline: sidePadding }}>
        {items.map((child, i) => (
          <div key={i} className="shrink-0 snap-start" style={{ width: itemWidth }}>
            {child}
          </div>
        ))}
      </div>
      {showDots && items.length > 1 ? <PagerDots count={items.length} activeIndex={active} className="mt-3" /> : null}
    </div>
  );
}
