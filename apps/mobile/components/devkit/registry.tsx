/**
 * The Kitchen Sink registry: the metadata in registry/components.ts joined to the demos in
 * ./sections/*.tsx. registry/components.ts is the single source of truth for what the kit ships.
 *
 * Adding a component: add it under components/ui (reusables) or components/kit (ours), add an entry
 * to registry/components.ts and a demo to the matching ./sections/*.tsx DEMOS record, then run
 * `npm run registry:build`. The `add-component` skill walks through this.
 */
import { COMPONENTS } from '@/registry/components';
import type { ComponentType } from 'react';
import type { CategoryId, ComponentSection, FoundationSection, Section } from './types';
import { ACTIONS_DEMOS } from './sections/actions';
import { INPUTS_DEMOS } from './sections/inputs';
import { NAVIGATION_DEMOS } from './sections/navigation';
import { DATA_DEMOS } from './sections/data';
import { FEEDBACK_DEMOS } from './sections/feedback';
import { LAYOUT_DEMOS } from './sections/layout';
import { OVERLAYS_DEMOS } from './sections/overlays';
import { MEDIA_DEMOS } from './sections/media';
import { FOUNDATION_SECTIONS } from './foundations';
import { KIT_ACTIONS_DEMOS } from './sections/kit-actions';
import { KIT_INPUTS_DEMOS } from './sections/kit-inputs';
import { KIT_NAVIGATION_DEMOS } from './sections/kit-navigation';
import { KIT_DATA_DEMOS } from './sections/kit-data';
import { KIT_FEEDBACK_DEMOS } from './sections/kit-feedback';
import { KIT_LAYOUT_DEMOS } from './sections/kit-layout';
import { KIT_OVERLAYS_DEMOS } from './sections/kit-overlays';
import { KIT_MEDIA_DEMOS } from './sections/kit-media';
import { KIT_MARKETING_DEMOS } from './sections/kit-marketing';
import { KIT_AI_DEMOS } from './sections/kit-ai';
import { KIT_NATIVE_DEMOS } from './sections/kit-native';

/** ui/ (reusables) demos live in <category>.tsx; kit/ demos in kit-<category>.tsx. */
const DEMOS: Record<string, ComponentType> = {
  ...ACTIONS_DEMOS,
  ...KIT_ACTIONS_DEMOS,
  ...INPUTS_DEMOS,
  ...KIT_INPUTS_DEMOS,
  ...NAVIGATION_DEMOS,
  ...KIT_NAVIGATION_DEMOS,
  ...DATA_DEMOS,
  ...KIT_DATA_DEMOS,
  ...FEEDBACK_DEMOS,
  ...KIT_FEEDBACK_DEMOS,
  ...LAYOUT_DEMOS,
  ...KIT_LAYOUT_DEMOS,
  ...OVERLAYS_DEMOS,
  ...KIT_OVERLAYS_DEMOS,
  ...MEDIA_DEMOS,
  ...KIT_MEDIA_DEMOS,
  ...KIT_MARKETING_DEMOS,
  ...KIT_AI_DEMOS,
  ...KIT_NATIVE_DEMOS,
};

const PREVIEWED = COMPONENTS.filter((c) => c.preview !== false);

if (__DEV__) {
  const missing = PREVIEWED.filter((c) => !DEMOS[c.id]).map((c) => c.id);
  const orphaned = Object.keys(DEMOS).filter((id) => !PREVIEWED.some((c) => c.id === id));
  if (missing.length || orphaned.length) {
    throw new Error(
      `Kitchen Sink registry out of sync. No demo for: ${missing.join(', ') || '—'}. ` +
        `Demo without a registry entry: ${orphaned.join(', ') || '—'}.`
    );
  }
}

export const SECTIONS: ComponentSection[] = PREVIEWED.map((c) => ({
  id: c.id,
  title: c.title,
  category: c.category,
  aliases: c.aliases,
  api: c.api,
  caption: c.caption,
  Demo: DEMOS[c.id],
}));

export { FOUNDATION_SECTIONS };
export type { ComponentSection, FoundationSection };

export function sectionsForCategory(category: CategoryId): ComponentSection[] {
  return SECTIONS.filter((s) => s.category === category);
}

/** Substring match over title + aliases. */
export function matchesQuery(section: Section, query: string): boolean {
  const q = query.trim().toLowerCase();
  if (!q) return true;
  return [section.title, ...(section.aliases ?? [])].join(' ').toLowerCase().includes(q);
}
