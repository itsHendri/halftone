'use client';
import * as React from 'react';

/**
 * The Foundations page's scaffold (wireframe 1): each section's header has its name and count, its base knob (the
 * recipe axis that rewrites every item you haven't edited) and "+ New"; a sticky index jumps between sections, and
 * under 1024px it is a jump menu under the Studio bar (wireframe 6).
 */

export const SECTIONS = [
  { id: 'brand', label: 'Brand' },
  { id: 'colours', label: 'Colours' },
  { id: 'typography', label: 'Typography' },
  { id: 'corners', label: 'Corners' },
  { id: 'shadows', label: 'Shadows' },
  { id: 'borders', label: 'Borders' },
  { id: 'controls', label: 'Controls' },
] as const;
export type SectionId = (typeof SECTIONS)[number]['id'];

const sectionId = (id: string) => `foundations-${id}`;

/** Under the site header (3rem) and the Studio bar (measured, --studio-bar), plus the jump menu below lg. */
const SCROLL_MARGIN = 'scroll-mt-[calc(3rem+var(--studio-bar,3.5rem)+3.75rem)] lg:scroll-mt-[calc(3rem+var(--studio-bar,3.5rem)+1rem)]';

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
  const headingId = `${sectionId(id)}-title`;
  return (
    <section id={sectionId(id)} aria-labelledby={headingId} data-foundation={id} className={`border-border bg-card text-card-foreground flex flex-col gap-4 rounded-xl border p-4 outline-none sm:p-5 ${SCROLL_MARGIN}`}>
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

/** Which section is in view, for the index's aria-current. */
function useCurrent() {
  const [current, setCurrent] = React.useState<SectionId>('brand');
  React.useEffect(() => {
    const seen = new Map<string, boolean>();
    const io = new IntersectionObserver(
      (entries) => {
        for (const e of entries) seen.set((e.target as HTMLElement).dataset.foundation!, e.isIntersecting);
        const first = SECTIONS.find((s) => seen.get(s.id));
        if (first) setCurrent(first.id);
      },
      // The band just under the bars: the section whose top part is there is the one being read.
      { rootMargin: '-160px 0px -55% 0px' }
    );
    document.querySelectorAll<HTMLElement>('[data-foundation]').forEach((el) => io.observe(el));
    return () => io.disconnect();
  }, []);
  return current;
}

function jump(id: SectionId) {
  const el = document.getElementById(sectionId(id));
  if (!el) return;
  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  el.scrollIntoView({ behavior: reduce ? 'auto' : 'smooth', block: 'start' });
  // Keyboard and screen-reader users land in the section too.
  el.setAttribute('tabindex', '-1');
  el.focus({ preventScroll: true });
}

/** The sticky index (lg and up) and the jump menu (below). */
export function SectionIndex() {
  const current = useCurrent();
  return (
    <>
      <nav aria-label="Foundations sections" className="sticky top-[calc(3rem+var(--studio-bar,3.5rem)+1rem)] self-start max-lg:hidden">
        <ul className="flex flex-col gap-0.5">
          {SECTIONS.map((s) => (
            <li key={s.id}>
              <a
                href={`#${sectionId(s.id)}`}
                aria-current={current === s.id ? 'true' : undefined}
                onClick={(e) => {
                  e.preventDefault();
                  jump(s.id);
                }}
                className={`focus-visible:ring-ring block rounded-md px-2.5 py-1.5 text-sm focus-visible:outline-none focus-visible:ring-2 ${
                  current === s.id ? 'bg-accent text-accent-foreground font-medium' : 'text-muted-foreground hover:text-foreground'
                }`}>
                {s.label}
              </a>
            </li>
          ))}
        </ul>
      </nav>
      <div className="bg-muted/90 sticky top-[calc(3rem+var(--studio-bar,3.5rem))] z-20 -mx-4 px-4 py-2 backdrop-blur-sm md:-mx-6 md:px-6 lg:hidden">
        <label className="flex items-center gap-2 text-sm">
          <span className="text-muted-foreground shrink-0">Jump to</span>
          <select
            value={current}
            onChange={(e) => jump(e.target.value as SectionId)}
            className="border-border bg-background focus-visible:ring-ring h-9 min-w-0 flex-1 rounded-md border px-2 text-sm font-medium focus-visible:outline-none focus-visible:ring-2">
            {SECTIONS.map((s) => (
              <option key={s.id} value={s.id}>
                {s.label}
              </option>
            ))}
          </select>
        </label>
      </div>
    </>
  );
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
