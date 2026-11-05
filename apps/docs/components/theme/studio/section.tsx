'use client';
import { Popover, PopoverContent, PopoverTrigger } from 'fumadocs-ui/components/ui/popover';
import { LockIcon, LockOpenIcon, PlusIcon } from 'lucide-react';
import * as React from 'react';
import { openItem, useOpenItem } from '@/components/theme/studio/item-popover';
import { setCurrentSection } from '@/lib/studio/current-section';
import { FOUNDATION_SECTIONS, sectionAnchor, type SectionId } from '@/lib/studio/sections';

export type { SectionId };
import { toggleLock, useLocks, type LockKey } from '@/lib/theme/store';

/**
 * The Foundations page's scaffold (wireframe 1): each section's header has its name and count, its base knob (the
 * recipe axis that rewrites every item you haven't edited) and "+ New". The Studio sidebar's Foundations rows jump
 * between sections and follow the one being read (useSectionSpy).
 */

/** Under the site header (3.5rem) and the Studio toolbar (measured, --studio-bar). */
const SCROLL_MARGIN = 'scroll-mt-[calc(3.5rem+var(--studio-bar,3.5rem)+1rem)]';

export function FoundationSection({
  id,
  title,
  count,
  knob,
  add,
  children,
}: {
  id: SectionId;
  title: string;
  count?: number;
  /** The base knob (Scale, Base radius, Depth, Light/dark). */
  knob?: React.ReactNode;
  /** "+ New". */
  add?: React.ReactNode;
  children: React.ReactNode;
}) {
  const headingId = `${sectionAnchor(id)}-title`;
  return (
    <section id={sectionAnchor(id)} aria-labelledby={headingId} data-foundation={id} className={`border-border bg-card text-card-foreground flex flex-col gap-4 rounded-xl border p-4 outline-none sm:p-5 ${SCROLL_MARGIN}`}>
      <div className="flex flex-wrap items-center gap-x-3 gap-y-2">
        <h2 id={headingId} className="flex items-baseline gap-2 text-base font-semibold">
          {title}
          {count !== undefined ? (
            <span className="text-muted-foreground text-xs font-normal tabular-nums">
              {count}
              <span className="sr-only"> items</span>
            </span>
          ) : null}
        </h2>
        <div className="flex-1" />
        {knob}
        {add}
      </div>
      {children}
    </section>
  );
}

/** Which section is being read, for the Studio sidebar's Foundations rows (lib/studio/current-section.ts). */
export function useSectionSpy() {
  React.useEffect(() => {
    const seen = new Map<string, boolean>();
    const update = () => {
      // The last section can't scroll up into the band: at the end of the page, it is the one being read.
      const atEnd = window.innerHeight + window.scrollY >= document.documentElement.scrollHeight - 4;
      const first = atEnd ? FOUNDATION_SECTIONS.at(-1) : FOUNDATION_SECTIONS.find((s) => seen.get(s.id));
      if (first) setCurrentSection(first.id);
    };
    const io = new IntersectionObserver(
      (entries) => {
        for (const e of entries) seen.set((e.target as HTMLElement).dataset.foundation!, e.isIntersecting);
        update();
      },
      // The band just under the bars: the section whose top part is there is the one being read.
      { rootMargin: '-160px 0px -55% 0px' }
    );
    document.querySelectorAll<HTMLElement>('[data-foundation]').forEach((el) => io.observe(el));
    window.addEventListener('scroll', update, { passive: true });
    return () => {
      io.disconnect();
      window.removeEventListener('scroll', update);
    };
  }, []);
}

/** A small two-way switch for a section header (Colours' Light / dark). */
export function Segmented<T extends string>({ label, value, options, onChange }: { label: string; value: T; options: { value: T; label: string }[]; onChange: (v: T) => void }) {
  return (
    <div
      role="radiogroup"
      aria-label={label}
      className="bg-muted inline-flex rounded-full p-0.5"
      onKeyDown={(e) => {
        if (!['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown'].includes(e.key)) return;
        e.preventDefault();
        const i = options.findIndex((o) => o.value === value);
        const next = options[(i + (e.key === 'ArrowRight' || e.key === 'ArrowDown' ? 1 : options.length - 1)) % options.length];
        onChange(next.value);
        e.currentTarget.querySelector<HTMLElement>(`[data-value="${next.value}"]`)?.focus();
      }}>
      {options.map((o) => (
        <button
          key={o.value}
          type="button"
          role="radio"
          data-value={o.value}
          tabIndex={value === o.value ? 0 : -1}
          aria-checked={value === o.value}
          onClick={() => onChange(o.value)}
          className={`focus-visible:ring-ring h-7 rounded-full px-3 text-xs font-medium focus-visible:outline-none focus-visible:ring-2 ${
            value === o.value ? 'bg-background text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'
          }`}>
          {o.label}
        </button>
      ))}
    </div>
  );
}

/**
 * "+ New" (wireframe 8): a short menu of what to start from. Colours asks for the kind (a single colour or a ramp);
 * every other section, which item to copy. Picking one adds the extra and opens its popover.
 */
export function NewMenu({ section, label, heading, options, onPick }: { section: SectionId; label: string; heading: string; options: { id: string; label: string; hint?: string }[]; onPick: (id: string) => void }) {
  const id = `new:${section}`;
  const open = useOpenItem() === id;
  return (
    <Popover open={open} onOpenChange={(next) => openItem(next ? id : null)}>
      <PopoverTrigger className="border-border hover:bg-accent focus-visible:ring-ring inline-flex h-7 items-center gap-1 rounded-full border px-2.5 text-xs font-medium focus-visible:outline-none focus-visible:ring-2">
        <PlusIcon className="size-3.5" aria-hidden />
        {label}
      </PopoverTrigger>
      <PopoverContent align="end" sideOffset={6} className="bg-popover w-60 p-1 backdrop-blur-none">
        <p className="text-muted-foreground px-2 pb-1 pt-1 text-xs font-medium">{heading}</p>
        <div role="menu" aria-label={heading} className="flex flex-col">
          {options.map((o) => (
            <button
              key={o.id}
              type="button"
              role="menuitem"
              onClick={() => {
                openItem(null);
                onPick(o.id);
              }}
              className="hover:bg-accent focus-visible:bg-accent flex w-full flex-col items-start rounded-md px-2 py-1.5 text-left text-sm outline-none">
              {o.label}
              {o.hint ? <span className="text-muted-foreground text-xs">{o.hint}</span> : null}
            </button>
          ))}
        </div>
      </PopoverContent>
    </Popover>
  );
}

/** A base knob's lock: shuffle leaves the axis (or axes) alone while it's on. */
export function KnobLock({ keys, label }: { keys: LockKey[]; label: string }) {
  const locks = useLocks();
  const locked = keys.every((k) => locks.has(k));
  return (
    <button
      type="button"
      aria-pressed={locked}
      aria-label={`Lock ${label} for shuffle`}
      title={locked ? `${label} is locked: shuffle leaves it alone` : `Lock ${label} for shuffle`}
      onClick={() => {
        for (const k of keys) if (locks.has(k) === locked) toggleLock(k);
      }}
      className={`focus-visible:ring-ring inline-flex size-7 items-center justify-center rounded-full focus-visible:outline-none focus-visible:ring-2 ${
        locked ? 'bg-accent text-foreground' : 'text-muted-foreground hover:bg-accent hover:text-foreground'
      }`}>
      {locked ? <LockIcon className="size-3.5" aria-hidden /> : <LockOpenIcon className="size-3.5" aria-hidden />}
    </button>
  );
}
