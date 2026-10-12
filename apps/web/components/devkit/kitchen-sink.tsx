'use client';
import { ArrowUpRightIcon, SearchIcon } from 'lucide-react';
import { cn } from 'cn';
import { useSearchParams } from 'next/navigation';
import * as React from 'react';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { CATEGORY_META } from '@/registry/categories';
import { COMPONENTS } from '@/registry/components';
import type { ComponentMeta } from '@/registry/types';
import { allowedOrigins } from '@/lib/embed';
import { DEMOS } from './demos';

const PREVIEWED = COMPONENTS.filter((c) => c.preview !== false);

if (process.env.NODE_ENV !== 'production') {
  const missing = PREVIEWED.filter((c) => !DEMOS[c.id]).map((c) => c.id);
  const orphaned = Object.keys(DEMOS).filter((id) => !PREVIEWED.some((c) => c.id === id));
  if (missing.length || orphaned.length) {
    throw new Error(`Kitchen Sink out of sync. No demo for: ${missing.join(', ') || '—'}. Demo without an entry: ${orphaned.join(', ') || '—'}.`);
  }
}

const matches = (c: ComponentMeta, q: string) => [c.title, ...c.exports, ...(c.aliases ?? [])].join(' ').toLowerCase().includes(q);

/** One preview: title, the one rule, the demo. */
function Section({ c, highlighted, bare }: { c: ComponentMeta; highlighted?: boolean; bare?: boolean }) {
  const Demo = DEMOS[c.id];
  return (
    <section
      id={c.id}
      aria-labelledby={bare ? undefined : `${c.id}-title`}
      aria-label={bare ? c.title : undefined}
      className={cn('scroll-mt-20 rounded-xl transition-colors', !bare && 'border-border border p-5', highlighted && 'bg-primary/10')}>
      {bare ? null : (
        <div className="mb-4 flex flex-col gap-1">
          <h3 id={`${c.id}-title`} className="text-muted-foreground text-xs font-semibold uppercase tracking-widest">
            {c.title}
          </h3>
          {c.caption ? <p className="text-muted-foreground max-w-3xl text-sm">{c.caption}</p> : null}
        </div>
      )}
      <Demo />
    </section>
  );
}

/** Ask the docs page around this frame to open a component's page (the tile grid's titles). */
function openInHost(id: string) {
  if (window.parent === window) return;
  for (const origin of allowedOrigins()) window.parent.postMessage({ type: 'kit:open', id }, origin);
}

/**
 * The docs index's live tiles (?tiles=a,b,c with ?embed=1): each component's demo in a cell, its title a button
 * that opens the component's page in the docs (`kit:open`). Measured for ?autosize=1.
 */
function Tiles({ ids }: { ids: string[] }) {
  const list = ids.map((id) => PREVIEWED.find((c) => c.id === id)).filter((c) => c !== undefined);
  return (
    <div data-autosize className="bg-border grid grid-cols-[repeat(auto-fill,minmax(300px,1fr))] gap-px">
      {list.map((c) => (
        <div key={c.id} className="bg-background flex flex-col">
          <button
            type="button"
            onClick={() => openInHost(c.id)}
            className="text-muted-foreground hover:text-foreground focus-visible:ring-ring flex items-center justify-between gap-2 px-4 pt-3 text-left text-sm font-medium focus-visible:outline-none focus-visible:ring-2">
            {c.title}
            <ArrowUpRightIcon className="size-4" aria-hidden />
          </button>
          <div className="flex max-h-80 min-h-44 flex-1 justify-center overflow-hidden p-6 [align-items:safe_center] [mask-image:linear-gradient(to_bottom,black_85%,transparent)]">
            {/* min-w-0: a full-width demo (an amount field, a chip row) fits the tile instead of widening it. */}
            <div className="max-w-full min-w-0">
              <Section c={c} bare />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

/**
 * Every component the kit ships, by category, searchable. Deep links: ?section=<id> scrolls to a
 * component and tints it; with ?embed=1 (docs site) only that component's demo renders.
 */
export function KitchenSink({ embedded }: { embedded?: boolean }) {
  const params = useSearchParams();
  const section = params.get('section');
  const [query, setQuery] = React.useState('');
  const [highlight, setHighlight] = React.useState(section);
  const q = query.trim().toLowerCase();

  React.useEffect(() => {
    if (!section) return;
    // After Next's own scroll-to-top for the navigation, or it wins.
    const scroll = setTimeout(() => document.getElementById(section)?.scrollIntoView({ block: 'start' }), 100);
    const fade = setTimeout(() => setHighlight(null), 2000);
    return () => {
      clearTimeout(scroll);
      clearTimeout(fade);
    };
  }, [section]);

  const tiles = params.get('tiles');
  if (embedded && tiles) return <Tiles ids={tiles.split(',')} />;

  if (embedded && section) {
    const c = PREVIEWED.find((x) => x.id === section);
    // data-autosize: what the embed bridge measures for ?autosize=1 (the docs' plain-stage previews).
    return (
      <div data-autosize className="p-5">
        {c ? <Section c={c} bare /> : <p className="text-muted-foreground">No component called “{section}”.</p>}
      </div>
    );
  }

  const results = q ? PREVIEWED.filter((c) => matches(c, q)) : null;

  return (
    <div className="flex flex-col gap-8">
      <div className="relative max-w-md">
        <SearchIcon className="text-muted-foreground pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2" aria-hidden />
        <Input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search components" aria-label="Search components" className="pl-9" />
      </div>

      {results ? (
        <div className="flex flex-col gap-4">
          {results.length ? results.map((c) => <Section key={c.id} c={c} />) : <p className="text-muted-foreground">No matches. Search covers names, exports and aliases.</p>}
        </div>
      ) : (
        <>
          <nav aria-label="Categories" className="flex flex-wrap gap-2">
            {CATEGORY_META.map((cat) => (
              <a key={cat.id} href={`#cat-${cat.id}`} className="border-border hover:bg-accent inline-flex items-center gap-2 rounded-full border px-3 py-1 text-sm">
                {cat.label}
                <Badge variant="secondary" className="px-1.5">
                  {PREVIEWED.filter((c) => c.category === cat.id).length}
                </Badge>
              </a>
            ))}
          </nav>
          {CATEGORY_META.map((cat) => (
            <section key={cat.id} id={`cat-${cat.id}`} aria-labelledby={`cat-${cat.id}-title`} className="flex scroll-mt-20 flex-col gap-4">
              <div>
                <h2 id={`cat-${cat.id}-title`} className="text-xl font-semibold">
                  {cat.label}
                </h2>
                <p className="text-muted-foreground text-sm">{cat.blurb}</p>
              </div>
              {PREVIEWED.filter((c) => c.category === cat.id).map((c) => (
                <Section key={c.id} c={c} highlighted={highlight === c.id} />
              ))}
            </section>
          ))}
        </>
      )}
    </div>
  );
}
