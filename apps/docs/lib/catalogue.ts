/**
 * One catalogue of components across both kits (apps/docs/design/components-wireframes.md): a component is one
 * entry, whichever kits have it, at /components/<id>. On the site the kits are Native (apps/mobile: Expo, React
 * Native, iOS and Android) and Web (apps/web: Next.js, responsive).
 */
import { kits, type KitComponent, type Platform } from './kit';

export type Side = 'native' | 'web';
export const SIDES: Side[] = ['native', 'web'];
export const SIDE_LABEL: Record<Side, string> = { native: 'Native', web: 'Web' };
/** The kit behind each side (the registry still calls the native kit `mobile`). */
export const PLATFORM_OF: Record<Side, Platform> = { native: 'mobile', web: 'web' };

export type GroupId =
  | 'actions'
  | 'inputs'
  | 'navigation'
  | 'data'
  | 'feedback'
  | 'layout'
  | 'overlays'
  | 'media'
  | 'marketing'
  | 'ai'
  | 'controls'
  | 'native-only'
  | 'web-only';

/** Sidebar and index groups, in order. `icon` is a lucide-react icon name. */
export const GROUPS: { id: GroupId; label: string; blurb: string; icon: string }[] = [
  { id: 'actions', label: 'Actions', blurb: 'Buttons, toggles and commit affordances', icon: 'MousePointerClick' },
  { id: 'inputs', label: 'Inputs and selection', blurb: 'Fields, choices, dates and pickers', icon: 'TextCursorInput' },
  { id: 'navigation', label: 'Navigation', blurb: 'Tabs, menus, headers and steppers', icon: 'Compass' },
  { id: 'data', label: 'Data display', blurb: 'Lists, stats, charts, badges and avatars', icon: 'ChartColumn' },
  { id: 'feedback', label: 'Feedback and status', blurb: 'Alerts, toasts, progress and empty states', icon: 'BellRing' },
  { id: 'layout', label: 'Containers and layout', blurb: 'Cards, accordions and long-form text', icon: 'LayoutPanelTop' },
  { id: 'overlays', label: 'Overlays', blurb: 'Dialogs, sheets, popovers and menus', icon: 'Layers' },
  { id: 'media', label: 'Media and icons', blurb: 'Icons, images and placeholders', icon: 'Image' },
  { id: 'marketing', label: 'Marketing', blurb: 'Pricing', icon: 'Megaphone' },
  { id: 'ai', label: 'AI product', blurb: 'Chat, streaming, tool calls and approvals', icon: 'Sparkles' },
  { id: 'controls', label: 'Controls', blurb: 'For editors and design tools: inspectors, curves, springs and settings to copy', icon: 'SlidersHorizontal' },
  { id: 'native-only', label: 'Native only', blurb: 'The device: camera, Face ID, permissions, share, tab bar', icon: 'Smartphone' },
  { id: 'web-only', label: 'Web only', blurb: 'Pages and the browser: app shell, tables, heroes, command', icon: 'Globe' },
];

/** Components that belong to one platform by design (device, touch, or the browser), not for lack of a twin. */
const NATIVE_ONLY = new Set(['photo-capture', 'code-scanner', 'biometric-gate', 'permission-primer', 'share', 'notify', 'tab-bar', 'swipe-to-confirm', 'numeric-keypad']);
const WEB_ONLY = new Set(['app-shell', 'navigation-menu', 'breadcrumb', 'pagination', 'command', 'data-table', 'table', 'scroll-area', 'hero', 'feature-grid']);
/** Scaffolding, not product components. */
const HIDDEN = new Set(['kit-chip']);

/**
 * One component under different names in the two kits: one entry, one page (design/navigation-wireframes.md ›
 * Round two). A side may hold several kit components (Chart's native side is Line, Bar and Donut chart); the page
 * shows one preview per component. The old slugs redirect to the merged page (MOVED, scripts/build-docs.mjs).
 */
const MERGES: { id: string; title: string; group: GroupId; native: string[]; web: string[] }[] = [
  { id: 'chart', title: 'Chart', group: 'data', native: ['line-chart', 'bar-chart', 'donut-chart'], web: ['chart'] },
  { id: 'page-header', title: 'Page header', group: 'navigation', native: ['screen-header'], web: ['page-header'] },
];

/** Old component slugs → where they live now (`<entry>#<side>-<kit id>`). */
export const MOVED: Record<string, string> = Object.fromEntries(
  MERGES.flatMap((m) =>
    (['native', 'web'] as const).flatMap((side) => m[side].filter((id) => id !== m.id).map((id) => [id, `${m.id}#${side}-${id}`]))
  )
);

/** Close, but not the same component: a one-kit entry says what to reach for in the other kit. */
const COUNTERPARTS: Record<string, string> = {
  'option-sheet': 'drawer',
  'action-sheet': 'drawer',
};

/** Native components that occupy a whole screen: previewed in a phone outline, not on a plain stage. */
export const SCREEN_LEVEL = new Set(['tab-bar', 'sheet', 'option-sheet', 'action-sheet', 'sticky-bottom-bar', 'success-screen', 'photo-capture', 'code-scanner', 'biometric-gate', 'permission-primer']);

/** Components that open something over the page: their stage keeps room for it. */
const NEEDS_ROOM = new Set(['select', 'date-picker', 'calendar', 'combobox', 'command', 'tooltip', 'hover-card', 'context-menu', 'menubar', 'navigation-menu', 'toast', 'notify']);
export const stageMinHeight = (e: Entry) => (e.group === 'overlays' || NEEDS_ROOM.has(e.id) ? 440 : 120);

export type Entry = {
  id: string;
  title: string;
  group: GroupId;
  /** The lead kit component on each side (the first of `parts`). */
  native?: KitComponent;
  web?: KitComponent;
  /** Every kit component on each side: one for most entries, more for a merged one. */
  parts: Record<Side, KitComponent[]>;
  sides: Side[];
  /** For a one-kit entry: what to use in the other kit, e.g. `{ side: 'web', id: 'drawer', title: 'Drawer' }`. */
  counterparts: { side: Side; id: string; title: string }[];
};

function build(): Entry[] {
  const byId = new Map<string, Entry>();
  const mergedInto = new Map<string, (typeof MERGES)[number]>();
  for (const m of MERGES) for (const side of SIDES) for (const id of m[side]) mergedInto.set(`${side}:${id}`, m);
  const add = (side: Side, c: KitComponent) => {
    if (HIDDEN.has(c.id)) return;
    const m = mergedInto.get(`${side}:${c.id}`);
    const id = m?.id ?? c.id;
    let e = byId.get(id);
    if (!e) {
      e = { id, title: m?.title ?? c.title, group: m?.group ?? 'actions', parts: { native: [], web: [] }, sides: [], counterparts: [] };
      byId.set(id, e);
    }
    e.parts[side].push(c);
    e[side] ??= c;
    if (!e.sides.includes(side)) e.sides.push(side);
  };
  for (const c of kits.mobile.components) add('native', c);
  for (const c of kits.web.components) add('web', c);

  const merged = new Set(MERGES.map((m) => m.id));
  for (const e of byId.values()) {
    e.sides.sort((a, b) => SIDES.indexOf(a) - SIDES.indexOf(b));
    if (merged.has(e.id)) continue;
    const category = (e.native ?? e.web)!.category as GroupId;
    e.group = NATIVE_ONLY.has(e.id) || category === ('native' as GroupId) ? 'native-only' : WEB_ONLY.has(e.id) ? 'web-only' : category;
  }
  // Counterparts both ways (Drawer lists Option sheet and Action sheet).
  for (const [nativeId, webId] of Object.entries(COUNTERPARTS)) {
    const n = byId.get(nativeId);
    const w = byId.get(webId);
    if (!n || !w) continue;
    n.counterparts.push({ side: 'web', id: w.id, title: w.title });
    w.counterparts.push({ side: 'native', id: n.id, title: n.title });
  }
  return [...byId.values()];
}

/** Every component, in group order, then native registry order, then web. */
export const CATALOGUE: Entry[] = (() => {
  const entries = build();
  const order = (e: Entry) => GROUPS.findIndex((g) => g.id === e.group);
  return entries.map((e, i) => ({ e, i })).sort((a, b) => order(a.e) - order(b.e) || a.i - b.i).map(({ e }) => e);
})();

export const entriesIn = (group: GroupId) => CATALOGUE.filter((e) => e.group === group);
export const getEntry = (id: string) => CATALOGUE.find((e) => e.id === id);
export const entryUrl = (id: string) => `/components/${id}`;
export const groupOf = (id: GroupId) => GROUPS.find((g) => g.id === id)!;
/** The entry a kit component belongs to (a merged entry holds components with other ids). */
export const entryOf = (side: Side, kitId: string) => CATALOGUE.find((e) => e.parts[side].some((c) => c.id === kitId));
/** "Native · Web", "Native only" or "Web only": the index card's line and the page's preview header. */
export const availability = (e: Entry) => (e.sides.length > 1 ? e.sides.map((s) => SIDE_LABEL[s]).join(' · ') : `${SIDE_LABEL[e.sides[0]]} only`);
/** The anchor of one kit component's block on its entry's page. */
export const partAnchor = (side: Side, kitId: string) => `${side}-${kitId}`;
