'use client';
import { XIcon } from 'lucide-react';
import * as React from 'react';
import { GroupTiles, hasTile } from '@/components/kit-tiles';
import { Segmented } from '@/components/theme/studio/section';
import { CATALOGUE, GROUPS, type Entry, type GroupId, type Side } from '@/lib/catalogue';
import { rovingKeyDown, rovingTabIndex } from '@/lib/roving';
import { entriesUsing, usesLabel } from '@/lib/studio/usage';

/**
 * The Components tab (apps/docs/design/studio-wireframes.md › Components tab, wireframe 4): every catalogue tile, live
 * on the active system, one kit at a time. Read-only: a tile opens its docs page. Light and dark come from the top bar.
 *
 * Its state is in the URL: `?tab=components&group=<group>&kit=web|mobile&uses=<keys>`, and the group scrolled to
 * as the hash (`#components-<group>`), so a link, a reload or Back lands where you were.
 */

export type ComponentsView = { group: GroupId | null; kit: Side; uses: string | null };

const KIT_PARAM: Record<Side, string> = { web: 'web', native: 'mobile' };
const KIT_LABEL: Record<Side, string> = { web: 'Web', native: 'Mobile' };

/** The view in a URL's query; the kit defaults to the site's Native/Web filter, else Web. */
export function readView(params: URLSearchParams): ComponentsView {
  const g = params.get('group');
  const k = params.get('kit');
  const site = document.documentElement.dataset.kitFilter;
  return {
    group: GROUPS.some((x) => x.id === g) ? (g as GroupId) : null,
    kit: k === 'mobile' || k === 'native' ? 'native' : k === 'web' ? 'web' : site === 'native' ? 'native' : 'web',
    uses: params.get('uses') || null,
  };
}

/** Write the view into a URL's query (and clear what it doesn't set). */
export function writeView(params: URLSearchParams, view: ComponentsView | null) {
  for (const key of ['group', 'kit', 'uses']) params.delete(key);
  if (!view) return;
  if (view.group) params.set('group', view.group);
  params.set('kit', KIT_PARAM[view.kit]);
  if (view.uses) params.set('uses', view.uses);
}

const CHIPS_SHOWN = 7;
const sectionId = (g: GroupId) => `components-${g}`;

/** Keep the group at the top of the window in the hash, and go back to it on load. */
function useScrollInHash() {
  React.useEffect(() => {
    const id = window.location.hash.slice(1);
    if (id.startsWith('components-')) requestAnimationFrame(() => document.getElementById(id)?.scrollIntoView());
  }, []);
  React.useEffect(() => {
    let raf = 0;
    const onScroll = () => {
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(() => {
        // Under the site header (48px) and the Studio bar.
        const studio = document.querySelector<HTMLElement>('[data-studio]');
        const bar = (studio && parseFloat(getComputedStyle(studio).getPropertyValue('--studio-bar'))) || 0;
        let current = '';
        for (const el of document.querySelectorAll<HTMLElement>('[data-components-group]')) if (el.getBoundingClientRect().top <= 48 + bar + 80) current = el.id;
        const url = new URL(window.location.href);
        url.hash = current;
        if (url.href !== window.location.href) window.history.replaceState(window.history.state, '', url);
      });
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener('scroll', onScroll);
    };
  }, []);
}

export function ComponentsTab({ view, onView }: { view: ComponentsView; onView: (patch: Partial<ComponentsView>) => void }) {
  const { group, kit, uses } = view;
  const using = React.useMemo(() => (uses ? entriesUsing(uses) : null), [uses]);
  // A tile shows when the kit has it live and, under Show usage, when that kit's version draws the token.
  const shows = (e: Entry, side: Side) => hasTile(e, side) && (!using || !!using.get(e.id)?.includes(side));
  const inKit = CATALOGUE.filter((e) => shows(e, kit));
  const other: Side = kit === 'web' ? 'native' : 'web';
  const inOther = using ? CATALOGUE.filter((e) => shows(e, other) && !shows(e, kit)).length : 0;
  const shown = group ? inKit.filter((e) => e.group === group) : inKit;
  const groups = GROUPS.filter((g) => g.id === group || inKit.some((e) => e.group === g.id));
  const [expanded, setExpanded] = React.useState(false);
  const chipIndex = (id: GroupId | null) => (id === null ? 0 : groups.findIndex((g) => g.id === id) + 1);
  // From sm up the first few show and "+ N" opens the rest; on a phone every chip is in one row that scrolls.
  const folded = (g: GroupId, i: number) => !expanded && i >= CHIPS_SHOWN && g !== group;
  const hidden = groups.filter((g, i) => folded(g.id, i)).length;
  useScrollInHash();

  const chip = (id: GroupId | null, label: string, i: number, fold = false) => (
    <button
      key={id ?? 'all'}
      type="button"
      role="radio"
      aria-checked={group === id}
      tabIndex={rovingTabIndex(i, chipIndex(group))}
      onClick={() => onView({ group: id })}
      className={`focus-visible:ring-ring h-8 shrink-0 rounded-full border px-3 text-sm whitespace-nowrap focus-visible:outline-none focus-visible:ring-2 ${fold ? 'sm:hidden' : ''} ${
        group === id ? 'bg-accent text-accent-foreground border-transparent font-medium' : 'border-border text-muted-foreground hover:text-foreground'
      }`}>
      {label}
    </button>
  );

  return (
    <div className="mx-auto flex max-w-6xl flex-col gap-6">
      <div className="flex flex-col gap-3">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="flex min-w-0 gap-1.5 max-sm:order-last max-sm:-mx-4 max-sm:w-[calc(100%+2rem)] max-sm:overflow-x-auto max-sm:px-4 max-sm:[scrollbar-width:none] sm:flex-1 sm:flex-wrap">
            <div role="radiogroup" aria-label="Group" onKeyDown={(e) => rovingKeyDown(e, { select: true })} className="contents">
              {chip(null, 'All', 0)}
              {groups.map((g, i) => chip(g.id, g.label, chipIndex(g.id), folded(g.id, i)))}
            </div>
            {hidden > 0 || expanded ? (
              <button
                type="button"
                aria-expanded={expanded}
                onClick={() => setExpanded(!expanded)}
                className="focus-visible:ring-ring text-muted-foreground hover:text-foreground h-8 rounded-full px-3 text-sm focus-visible:outline-none focus-visible:ring-2 max-sm:hidden">
                {expanded ? 'Fewer' : `+ ${hidden}`}
                <span className="sr-only">{expanded ? ' groups' : ' more groups'}</span>
              </button>
            ) : null}
          </div>
          <Segmented<Side>
            label="Kit"
            value={kit}
            options={[
              { value: 'web', label: KIT_LABEL.web },
              { value: 'native', label: KIT_LABEL.native },
            ]}
            onChange={(k) => onView({ kit: k })}
          />
        </div>

        {uses ? (
          <div role="status" className="bg-accent text-accent-foreground flex flex-wrap items-center gap-x-2 gap-y-1 self-start rounded-2xl py-1 pl-3 pr-1 text-sm">
            <span>
              {shown.length ? `Showing ${shown.length}` : `No ${KIT_LABEL[kit]}`} component{shown.length === 1 ? '' : 's'} that use{shown.length === 1 ? 's' : ''}{' '}
              <span className="font-medium">{usesLabel(uses)}</span>
              {group ? ` in ${GROUPS.find((g) => g.id === group)?.label}` : ''}
            </span>
            {inOther ? (
              <button type="button" onClick={() => onView({ kit: other })} className="focus-visible:ring-ring rounded underline underline-offset-2 focus-visible:outline-none focus-visible:ring-2">
                {inOther} more in {KIT_LABEL[other]}
              </button>
            ) : null}
            <span aria-hidden>·</span>
            <button
              type="button"
              onClick={() => onView({ uses: null })}
              aria-label="Clear the filter: show every component"
              className="hover:bg-background focus-visible:ring-ring inline-flex items-center gap-1 rounded-full px-2 py-0.5 focus-visible:outline-none focus-visible:ring-2">
              clear
              <XIcon className="size-3.5" aria-hidden />
            </button>
          </div>
        ) : null}
      </div>

      {(group ? GROUPS.filter((g) => g.id === group) : GROUPS).map((g) => {
        const entries = shown.filter((e) => e.group === g.id);
        if (!entries.length) return null;
        return (
          <section key={g.id} id={sectionId(g.id)} data-components-group aria-labelledby={`studio-group-${g.id}`} className="flex scroll-mt-[calc(var(--studio-bar,3.5rem)+4rem)] flex-col gap-3">
            <h2 id={`studio-group-${g.id}`} className="text-base font-semibold">
              {g.label}
            </h2>
            <GroupTiles entries={entries} label={g.label} kit={kit} />
          </section>
        );
      })}
      {!shown.length && !uses ? (
        <p className="text-muted-foreground text-sm">
          No {group ? GROUPS.find((g) => g.id === group)?.label.toLowerCase() : ''} components in the {KIT_LABEL[kit]} kit.{' '}
          <button type="button" onClick={() => onView({ kit: other })} className="text-foreground focus-visible:ring-ring rounded underline underline-offset-2 focus-visible:outline-none focus-visible:ring-2">
            Show {KIT_LABEL[other]}
          </button>
        </p>
      ) : null}
    </div>
  );
}
