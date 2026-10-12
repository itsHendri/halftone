import type { CategoryMeta } from './types';

/** Component categories, in display order. Icons live in components/devkit/categories.ts. */
export const CATEGORY_META: CategoryMeta[] = [
  { id: 'actions', label: 'Actions', blurb: 'Buttons & commit affordances' },
  { id: 'inputs', label: 'Inputs & selection', blurb: 'Fields, toggles, pickers' },
  { id: 'navigation', label: 'Navigation', blurb: 'Tabs, menus, headers' },
  { id: 'data', label: 'Data display', blurb: 'Text, avatars, badges, cards' },
  { id: 'feedback', label: 'Feedback & status', blurb: 'Alerts, progress, skeletons' },
  { id: 'layout', label: 'Containers & layout', blurb: 'Cards, accordions, collapsibles' },
  { id: 'overlays', label: 'Overlays', blurb: 'Dialogs, popovers, menus' },
  { id: 'media', label: 'Media & icons', blurb: 'Icons, images, ratios' },
  { id: 'marketing', label: 'Marketing', blurb: 'Paywalls and plans' },
  { id: 'ai', label: 'AI product', blurb: 'Chat, streaming, tool calls, approvals' },
  { id: 'native', label: 'Device capabilities', blurb: 'Camera, photos, Face ID, alerts' },
];
