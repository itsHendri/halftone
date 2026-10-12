import { CATEGORY_META } from '@/registry/categories';
import type { CategoryDef, CategoryId, FoundationId } from './types';
import {
  ActivityIcon,
  BellIcon,
  BlocksIcon,
  ChartBarIcon,
  CompassIcon,
  ImageIcon,
  LayersIcon,
  MegaphoneIcon,
  MousePointerClickIcon,
  PaletteIcon,
  PenLineIcon,
  RulerIcon,
  SmartphoneIcon,
  SparklesIcon,
  TypeIcon,
  type LucideIcon,
} from 'lucide-react-native';

const CATEGORY_ICON: Record<CategoryId, LucideIcon> = {
  actions: MousePointerClickIcon,
  inputs: PenLineIcon,
  navigation: CompassIcon,
  data: ChartBarIcon,
  feedback: BellIcon,
  layout: BlocksIcon,
  overlays: LayersIcon,
  media: ImageIcon,
  marketing: MegaphoneIcon,
  ai: SparklesIcon,
  native: SmartphoneIcon,
};

/** Component categories, in display order (labels and blurbs live in registry/categories.ts). */
export const CATEGORIES: CategoryDef<CategoryId>[] = CATEGORY_META.map((c) => ({ ...c, icon: CATEGORY_ICON[c.id] }));

/** Foundation categories, in display order. */
export const FOUNDATIONS: CategoryDef<FoundationId>[] = [
  { id: 'color', label: 'Colour', blurb: 'Semantic colour tokens', icon: PaletteIcon },
  { id: 'metrics', label: 'Spacing & radius', blurb: 'The 4-pt grid and corner radii', icon: RulerIcon },
  { id: 'type', label: 'Typography', blurb: 'Text variants and the type scale', icon: TypeIcon },
  { id: 'motion', label: 'Motion', blurb: 'Durations & easing curves', icon: ActivityIcon },
];

export const CATEGORY_LABEL = Object.fromEntries(CATEGORIES.map((c) => [c.id, c.label])) as Record<
  CategoryId,
  string
>;

export function isCategoryId(value: unknown): value is CategoryId {
  return typeof value === 'string' && CATEGORIES.some((c) => c.id === value);
}
