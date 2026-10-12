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
  { id: 'native-only', label: 'Native only', blurb: 'The device: camera, Face ID, permissions, share, tab bar', icon: 'Smartphone' },
  { id: 'web-only', label: 'Web only', blurb: 'Pages and the browser: app shell, tables, heroes, command', icon: 'Globe' },
];

/** Components that belong to one platform by design (device, touch, or the browser), not for lack of a twin. */
const NATIVE_ONLY = new Set(['photo-capture', 'code-scanner', 'biometric-gate', 'permission-primer', 'share', 'notify', 'tab-bar', 'swipe-to-confirm', 'numeric-keypad']);
const WEB_ONLY = new Set(['app-shell', 'navigation-menu', 'breadcrumb', 'pagination', 'command', 'data-table', 'table', 'scroll-area', 'hero', 'feature-grid']);
/** Scaffolding, not product components. */
const HIDDEN = new Set(['kit-chip']);

/** The same idea under another name in the other kit: cross-linked, not merged. */
const COUNTERPARTS: Record<string, string> = {
  'line-chart': 'chart',
  'bar-chart': 'chart',
  'donut-chart': 'chart',
  'screen-header': 'page-header',
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
  native?: KitComponent;
  web?: KitComponent;
  sides: Side[];
  /** Differently named counterparts in the other kit, e.g. `{ side: 'web', id: 'chart', title: 'Chart' }`. */
  counterparts: { side: Side; id: string; title: string }[];
};

function build(): Entry[] {
  const byId = new Map<string, Entry>();
  const add = (side: Side, c: KitComponent) => {
    if (HIDDEN.has(c.id)) return;
    let e = byId.get(c.id);
    if (!e) {
      e = { id: c.id, title: c.title, group: 'actions', sides: [], counterparts: [] };
      byId.set(c.id, e);
    }
    e[side] = c;
    e.sides.push(side);
  };
  for (const c of kits.mobile.components) add('native', c);
  for (const c of kits.web.components) add('web', c);

  for (const e of byId.values()) {
    const category = (e.native ?? e.web)!.category as GroupId;
    e.group = NATIVE_ONLY.has(e.id) || category === ('native' as GroupId) ? 'native-only' : WEB_ONLY.has(e.id) ? 'web-only' : category;
    e.sides.sort((a, b) => SIDES.indexOf(a) - SIDES.indexOf(b));
  }
  // Counterparts both ways (chart lists line, bar and donut chart).
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
/** `native`, `web` or `native web`: what the sidebar and index filter on. */
export const sidesAttr = (e: Entry) => e.sides.join(' ');
