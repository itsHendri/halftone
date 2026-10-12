'use client';
import * as React from 'react';
import { SIDE_LABEL, SIDES, type Side } from '@/lib/catalogue';
import { FILTER_KEY } from '@/lib/theme/keys';

/**
 * Which kits have a component, and the visitor's choice between them (apps/docs/design/components-wireframes.md).
 * The filter is `<html data-kit-filter="native|web">` (set before paint by the boot script), so the sidebar and
 * the index hide entries with CSS (app/global.css) and nothing re-renders.
 */
export type Filter = 'all' | Side;

const readFilter = (): Filter => {
  const v = typeof document === 'undefined' ? '' : document.documentElement.dataset.kitFilter;
  return v === 'native' || v === 'web' ? v : 'all';
};
const listeners = new Set<() => void>();
const subscribe = (l: () => void) => {
  listeners.add(l);
  return () => {
    listeners.delete(l);
  };
};

export function setFilter(next: Filter) {
  if (next === 'all') delete document.documentElement.dataset.kitFilter;
  else document.documentElement.dataset.kitFilter = next;
  try {
    if (next === 'all') localStorage.removeItem(FILTER_KEY);
    else localStorage.setItem(FILTER_KEY, next);
  } catch {
    /* storage unavailable: the filter lasts for this page */
  }
  listeners.forEach((l) => l());
}

export const useFilter = () => React.useSyncExternalStore(subscribe, readFilter, () => 'all' as Filter);

/** Small availability badges: `Native` `Web`. */
export function KitBadges({ sides, size = 'sm' }: { sides: Side[]; size?: 'sm' | 'md' }) {
  return (
    // The badge text is the accessible text; on a page header it reads "Available for Native, Web".
    <span className="inline-flex shrink-0 gap-1">
      {size === 'md' ? <span className="sr-only">Available for</span> : null}
      {sides.map((s) => (
        <span
          key={s}
          className={`border-border text-muted-foreground rounded-full border font-medium ${size === 'md' ? 'px-2.5 py-0.5 text-xs' : 'px-1.5 text-[10px] leading-4'}`}>
          {SIDE_LABEL[s]}
        </span>
      ))}
    </span>
  );
}

/** All | Native | Web, at the top of the components sidebar. */
export function KitFilter() {
  const filter = useFilter();
  const options: Filter[] = ['all', 'native', 'web'];
  return (
    <div role="radiogroup" aria-label="Show components for" className="bg-fd-muted flex gap-0.5 rounded-lg p-0.5 text-sm">
      {options.map((o) => (
        <button
          key={o}
          type="button"
          role="radio"
          aria-checked={filter === o}
          onClick={() => setFilter(o)}
          className={`focus-visible:ring-fd-ring flex-1 rounded-md px-2 py-1 font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 ${
            filter === o ? 'bg-fd-background text-fd-foreground shadow-sm' : 'text-fd-muted-foreground hover:text-fd-foreground'
          }`}>
          {o === 'all' ? 'All' : SIDE_LABEL[o]}
        </button>
      ))}
    </div>
  );
}

/**
 * A component's page for each kit that has it. With both, a Native | Web switch shows one; it starts on the
 * filter's side (or `?kit=`), else Native. Both panels are in the page (static export); the other is hidden.
 */
export function KitPanels({ panels }: { panels: Partial<Record<Side, React.ReactNode>> }) {
  const sides = SIDES.filter((s) => panels[s]);
  const filter = useFilter();
  const [picked, setPicked] = React.useState<Side | null>(null);
  React.useEffect(() => {
    const q = new URLSearchParams(window.location.search).get('kit');
    if (q === 'native' || q === 'web') setPicked(q);
  }, []);
  const preferred: Side = filter === 'web' ? 'web' : 'native';
  const active = picked && sides.includes(picked) ? picked : sides.includes(preferred) ? preferred : sides[0];

  return (
    <div className="flex flex-col gap-6">
      {sides.length > 1 ? (
        <div role="tablist" aria-label="Kit" className="bg-fd-muted inline-flex gap-0.5 self-start rounded-lg p-0.5 text-sm">
          {sides.map((s) => (
            <button
              key={s}
              type="button"
              role="tab"
              id={`kit-tab-${s}`}
              aria-controls={`kit-panel-${s}`}
              aria-selected={active === s}
              onClick={() => setPicked(s)}
              className={`focus-visible:ring-fd-ring rounded-md px-4 py-1 font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 ${
                active === s ? 'bg-fd-background text-fd-foreground shadow-sm' : 'text-fd-muted-foreground hover:text-fd-foreground'
              }`}>
              {SIDE_LABEL[s]}
            </button>
          ))}
        </div>
      ) : null}
      {sides.map((s) => (
        <div key={s} id={`kit-panel-${s}`} role={sides.length > 1 ? 'tabpanel' : undefined} aria-labelledby={sides.length > 1 ? `kit-tab-${s}` : undefined} hidden={active !== s}>
          {panels[s]}
        </div>
      ))}
    </div>
  );
}
