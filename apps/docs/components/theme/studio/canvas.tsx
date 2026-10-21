'use client';
import { AccessibilityTab } from '@/components/theme/studio/accessibility-tab';
import { ComponentsTab, type ComponentsView } from '@/components/theme/studio/components-tab';
import { Foundations } from '@/components/theme/studio/foundations';

/** The Studio's tabs (design/studio-wireframes.md). Accessibility is the old Contrast view, renamed. */
export const TABS = [
  { id: 'foundations', label: 'Foundations' },
  { id: 'components', label: 'Components' },
  { id: 'accessibility', label: 'Accessibility' },
] as const;
export type Tab = (typeof TABS)[number]['id'];

export function Canvas({ tab, view, onView }: { tab: Tab; view: ComponentsView; onView: (patch: Partial<ComponentsView>) => void }) {
  return tab === 'foundations' ? <Foundations /> : tab === 'components' ? <ComponentsTab view={view} onView={onView} /> : <AccessibilityTab />;
}
