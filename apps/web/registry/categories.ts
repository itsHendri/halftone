import type { CategoryMeta } from './types';

/** Component categories, in display order. */
export const CATEGORY_META: CategoryMeta[] = [
  { id: 'actions', label: 'Actions', blurb: 'Buttons, toggles, menus that act' },
  { id: 'inputs', label: 'Inputs & selection', blurb: 'Fields, choices, dates, pickers' },
  { id: 'navigation', label: 'Navigation', blurb: 'App shell, tabs, menus, breadcrumbs, pagination, command' },
  { id: 'data', label: 'Data display', blurb: 'Tables, stats, charts, badges, avatars' },
  { id: 'feedback', label: 'Feedback & status', blurb: 'Alerts, toasts, progress, empty states' },
  { id: 'layout', label: 'Containers & layout', blurb: 'Cards, page headers, accordions' },
  { id: 'overlays', label: 'Overlays', blurb: 'Dialogs, sheets, drawers, popovers, tooltips' },
  { id: 'media', label: 'Media', blurb: 'Images, placeholders, illustration-scale icons' },
  { id: 'marketing', label: 'Marketing', blurb: 'Heroes, feature grids, pricing' },
  { id: 'ai', label: 'AI product', blurb: 'Chat, history, streaming, tool calls, approvals' },
];
