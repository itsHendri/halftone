'use client';
import { FONTS, googleFontsHref, normalizeRecipe, OPTIONS, PRESETS, type RecipeInput } from '@halftone-ds/tokens/theme';
import { themeFor } from '@/lib/theme/store';

/** Display names for option values (the codec's values are short ids). */
export const LABELS: Record<string, string> = {
  zinc: 'Zinc',
  neutral: 'Neutral',
  slate: 'Slate',
  stone: 'Stone',
  gray: 'Gray',
  brand: 'Tinted',
  none: 'None',
  sm: 'Small',
  md: 'Medium',
  lg: 'Large',
  xl: 'XL',
  '2xl': '2XL',
  pill: 'Pills',
  match: 'Follow radius',
  thin: 'Thin',
  regular: 'Regular',
  bold: 'Bold',
  flat: 'Flat',
  soft: 'Soft',
  raised: 'Raised',
  hard: 'Hard',
  compact: 'Compact',
  comfortable: 'Comfortable',
  spacious: 'Spacious',
  hairline: 'Hairline',
  heavy: 'Heavy',
  '14': '14px',
  '15': '15px',
  '16': '16px',
  '18': '18px',
  tight: 'Tight',
  normal: 'Regular',
  relaxed: 'Relaxed',
  loose: 'Loose',
  '60': '60ch',
  '70': '70ch',
  '80': '80ch',
  '90': '90ch',
  solid: 'Solid',
  outline: 'Outline',
  filled: 'Filled',
  underline: 'Underline',
};

/** Display order of each option list (the codec's order is append-only, not the order to show). */
export const ORDER: { [K in keyof typeof OPTIONS]: (typeof OPTIONS)[K] } = {
  neutral: ['zinc', 'neutral', 'slate', 'stone', 'gray', 'brand'],
  radius: ['none', 'sm', 'md', 'lg', 'xl', '2xl'],
  controls: ['pill', 'match'],
  stroke: ['thin', 'regular', 'bold'],
  depth: ['flat', 'soft', 'raised', 'hard'],
  density: ['compact', 'comfortable', 'spacious'],
  border: ['hairline', 'regular', 'heavy'],
  size: ['14', '15', '16', '18'],
  leading: ['tight', 'normal', 'relaxed'],
  flow: ['tight', 'normal', 'loose'],
  measure: ['60', '70', '80', '90'],
  button: ['solid', 'soft', 'outline', 'raised'],
  field: ['outline', 'filled', 'underline'],
};

/** A font id as a CSS font-family, so a picker can show each font in its own face. */
export const fontFamily = (id: string) => {
  const font = FONTS.find((f) => f.id === id);
  if (font?.system) return font.category === 'mono' ? 'ui-monospace, SFMono-Regular, Menlo, monospace' : 'ui-sans-serif, system-ui, sans-serif';
  return `"${font?.family}", ${font?.category === 'mono' ? 'ui-monospace' : 'ui-sans-serif, system-ui'}`;
};

export const fontLabel = (id: string) => {
  const font = FONTS.find((f) => f.id === id);
  if (!font) return id;
  if (font.system) return font.category === 'mono' ? 'System mono' : 'System';
  return font.family;
};

/** Every font (the pickers show each in its face) and every preset's, so the studio loads them once. */
export const ALL_FONTS = googleFontsHref(FONTS.map((f) => f.id));
export const PRESET_FONTS = googleFontsHref(PRESETS.flatMap((p) => Object.values(p.recipe.font ?? {})));

/** A preset as a small card: its heading font and its primary on its own muted surface. A radio in a group. */
export function PresetCard({ name, recipe: input, selected, tabIndex, onPick }: { name: string; recipe: RecipeInput; selected: boolean; tabIndex?: number; onPick: () => void }) {
  const recipe = normalizeRecipe(input);
  const t = themeFor(recipe);
  const radius = Math.min(t.radius, 14);
  return (
    <button
      type="button"
      role="radio"
      aria-checked={selected}
      tabIndex={tabIndex}
      onClick={onPick}
      className={`focus-visible:ring-ring flex flex-col gap-2 rounded-xl border p-1.5 text-left transition-colors focus-visible:outline-none focus-visible:ring-2 ${
        selected ? 'border-foreground ring-foreground ring-1' : 'border-border hover:border-muted-foreground'
      }`}>
      <span className="flex h-12 items-end justify-between rounded-lg p-2" style={{ background: t.resolved.light.muted }} aria-hidden>
        <span className="text-xl leading-none" style={{ fontFamily: fontFamily(recipe.font.heading), color: t.resolved.light.foreground, fontWeight: 600 }}>
          Aa
        </span>
        <span
          className="h-4 w-8"
          style={{
            background: t.resolved.light.primary,
            borderRadius: recipe.controls === 'pill' ? 999 : radius,
            boxShadow: recipe.depth === 'hard' ? `2px 2px 0 ${t.resolved.light.foreground}` : undefined,
          }}
        />
      </span>
      <span className="px-0.5 text-xs font-medium">{name}</span>
    </button>
  );
}
