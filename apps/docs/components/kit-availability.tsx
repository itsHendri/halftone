'use client';
import Link from 'next/link';
import * as React from 'react';
import { entryUrl, SIDE_LABEL, type Side } from '@/lib/catalogue';
import { KIT_KEY } from '@/lib/theme/keys';
import { rovingKeyDown, rovingTabIndex } from '@/lib/roving';

/**
 * Which kit a component page shows (apps/docs/design/navigation-wireframes.md › Round two). The choice is made in
 * the preview header (KitSwitch), switches the whole page (KitPanel), and is remembered for the next component.
 * `?kit=native|web` wins for the page it is on. Both kits' panels are in the static page; the other is hidden.
 */

/** The kit picked on this visit (a click), before the remembered one. */
let picked: Side | null = null;
/** `?kit=` or a block's anchor: wins on the page it is on, until a click. */
let forced: { path: string; side: Side } | null = null;
const listeners = new Set<() => void>();
const subscribe = (l: () => void) => {
  listeners.add(l);
  return () => {
    listeners.delete(l);
  };
};
const emit = () => listeners.forEach((l) => l());

/** The remembered kit (the last one picked on a component page), if any. */
export function storedKit(): Side | null {
  try {
    const v = localStorage.getItem(KIT_KEY);
    return v === 'native' || v === 'web' ? v : null;
  } catch {
    return null;
  }
}

const read = () => (forced && forced.path === window.location.pathname ? forced.side : (picked ?? storedKit()));

export function setKit(side: Side) {
  picked = side;
  forced = null;
  try {
    localStorage.setItem(KIT_KEY, side);
  } catch {
    /* storage unavailable: the choice lasts for this visit */
  }
  emit();
}

/** The kit this page shows, of the ones the component has: the choice if it has it, else its first. */
export function useKit(sides: Side[]): Side {
  React.useEffect(() => {
    // `?kit=`, or a block's anchor (`#native-line-chart`, where an old slug redirects) opens that kit.
    const q = new URLSearchParams(window.location.search).get('kit') ?? window.location.hash.match(/^#(native|web)-/)?.[1];
    if ((q === 'native' || q === 'web') && (forced?.path !== window.location.pathname || forced.side !== q)) {
      forced = { path: window.location.pathname, side: q };
      emit();
    }
  }, []);
  const pref = React.useSyncExternalStore(subscribe, read, () => null);
  return pref && sides.includes(pref) ? pref : sides[0];
}

const segment = 'bg-fd-muted inline-flex gap-0.5 rounded-lg p-0.5 text-sm';
const segmentButton = (on: boolean) =>
  `focus-visible:ring-fd-ring rounded-md px-3 py-0.5 font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 ${
    on ? 'bg-fd-background text-fd-foreground shadow-sm' : 'text-fd-muted-foreground hover:text-fd-foreground'
  }`;

/**
 * Native | Web in the preview header, or the one kit it is in ("Native only"), with what to use in the other kit
 * when there is something close.
 */
export function KitSwitch({ sides, counterparts = [] }: { sides: Side[]; counterparts?: { side: Side; id: string; title: string }[] }) {
  const active = useKit(sides);
  if (sides.length < 2) {
    return (
      <span className="text-fd-muted-foreground text-sm">
        {SIDE_LABEL[sides[0]]} only
        {counterparts.map((cp) => (
          <React.Fragment key={cp.id}>
            {' · '}
            <Link href={entryUrl(cp.id)} className="hover:text-fd-foreground underline underline-offset-4">
              {SIDE_LABEL[cp.side]}: {cp.title}
            </Link>
          </React.Fragment>
        ))}
      </span>
    );
  }
  return (
    <div role="radiogroup" aria-label="Kit" onKeyDown={(e) => rovingKeyDown(e, { select: true })} className={segment}>
      {sides.map((s, i) => (
        <button
          key={s}
          type="button"
          role="radio"
          aria-checked={active === s}
          tabIndex={rovingTabIndex(i, sides.indexOf(active))}
          onClick={() => setKit(s)}
          className={segmentButton(active === s)}>
          {SIDE_LABEL[s]}
        </button>
      ))}
    </div>
  );
}

/** One kit's half of a component page: shown when it is the active kit. */
export function KitPanel({ side, sides, children }: { side: Side; sides: Side[]; children: React.ReactNode }) {
  const active = useKit(sides);
  return (
    <div data-kit-panel={side} hidden={active !== side} className="flex flex-col gap-10">
      {children}
    </div>
  );
}

/**
 * A preview block (Untitled UI's shape): a header row with the name, the kit switch (on the first block) and
 * Preview | Code, then the live preview or the demo's source. The preview stays mounted under Code, so its frame
 * doesn't reload.
 */
export function PreviewBlock({ id, title, kitSwitch, preview, code }: { id: string; title: string; kitSwitch?: React.ReactNode; preview: React.ReactNode; code: React.ReactNode | null }) {
  const [view, setView] = React.useState<'preview' | 'code'>('preview');
  const views: ('preview' | 'code')[] = code ? ['preview', 'code'] : ['preview'];
  return (
    <figure id={id} className="flex scroll-mt-24 flex-col gap-3">
      <figcaption className="flex flex-wrap items-center gap-x-3 gap-y-2">
        <span className="text-fd-foreground font-medium">{title}</span>
        <span className="flex-1" />
        {kitSwitch}
        {code ? (
          <div role="radiogroup" aria-label={`${title}: show`} onKeyDown={(e) => rovingKeyDown(e, { select: true })} className={segment}>
            {views.map((v, i) => (
              <button
                key={v}
                type="button"
                role="radio"
                aria-checked={view === v}
                tabIndex={rovingTabIndex(i, views.indexOf(view))}
                onClick={() => setView(v)}
                className={segmentButton(view === v)}>
                {v === 'preview' ? 'Preview' : 'Code'}
              </button>
            ))}
          </div>
        ) : null}
      </figcaption>
      <div hidden={view !== 'preview'}>{preview}</div>
      {code ? <div hidden={view !== 'code'}>{code}</div> : null}
    </figure>
  );
}
