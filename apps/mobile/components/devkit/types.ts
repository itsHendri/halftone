import type { ComponentType } from 'react';
import type { LucideIcon } from 'lucide-react-native';

import type { CategoryId } from '@/registry/types';

export type { CategoryId };

/** Foundation buckets for the Foundations screen. */
export type FoundationId = 'color' | 'metrics' | 'type' | 'motion';

export type CategoryDef<Id extends string> = {
  id: Id;
  label: string;
  blurb: string;
  icon: LucideIcon;
};

/**
 * One entry in the Components page registry. `Demo` is self-contained (owns its own
 * preview state) so sections can render in any order on any page.
 */
export type Section<Cat extends string = string> = {
  /** Stable slug — unique across the registry. Also the deep-link anchor. */
  id: string;
  /** Display title + primary search key. */
  title: string;
  category: Cat;
  /** Extra search terms ("toggle" → Switch). */
  aliases?: string[];
  /** One-line API hint for docs (not rendered in the preview). */
  api?: string;
  /** Usage guidance shown under the demo. */
  caption?: string;
  Demo: ComponentType;
};

export type ComponentSection = Section<CategoryId>;
export type FoundationSection = Section<FoundationId>;
