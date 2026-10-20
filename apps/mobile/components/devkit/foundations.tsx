/**
 * Foundations — design-token previews. Every tile is tap-to-copy (the Tailwind class
 * or the token value) so a designer can grab the exact name to use.
 */
import { Text } from '@/components/ui/text';
import { usePalette, useLiveThemeCode } from '@/lib/palette-context';
import { THEME_INFO, TOKENS } from '@/lib/theme';
import { cn } from '@/lib/utils';
import { useCopy } from './copy';
import type { FoundationSection } from './types';
import { Pressable, View } from 'react-native';

const kebab = (s: string) => s.replace(/([A-Z0-9])/g, '-$1').toLowerCase();

const FONT_NAMES: Record<string, string> = { system: 'System' };
const fontName = (id: string) => FONT_NAMES[id] ?? id.split('-').map((w) => w[0].toUpperCase() + w.slice(1)).join(' ');

/** The theme tokens.json was generated from, read-only. Themes are picked on the docs site and applied with halftone-tokens. */
function ThemeSummary() {
  const live = useLiveThemeCode();
  const { copied, copy } = useCopy();
  if (!THEME_INFO) {
    return <Text className="text-muted-foreground text-sm">No theme recorded. Apply one with `npx halftone-tokens theme apply &lt;code&gt;`.</Text>;
  }
  const info = THEME_INFO;
  const { recipe } = info;
  const rows: [string, string][] = [
    ['Neutral', recipe.neutral],
    ['Radius', `${recipe.radius}${recipe.controls === 'pill' ? ' · pill controls' : ''}`],
    ['Type', recipe.font.heading === recipe.font.body ? fontName(recipe.font.heading) : `${fontName(recipe.font.heading)} / ${fontName(recipe.font.body)}`],
    ['Icons', `${recipe.stroke} stroke`],
    ['Depth', recipe.depth],
    ['Density', recipe.density],
    ['Border', recipe.border],
  ];
  return (
    <View className="w-full gap-3">
      <Pressable onPress={() => copy('code', info.code)} className="flex-row items-center gap-3">
        <View className="border-border size-10 rounded-full border" style={{ backgroundColor: recipe.brand }} />
        <View className="flex-1">
          <Text className="font-semibold">
            {info.name}
            {info.edited ? ' (edited by hand)' : ''}
          </Text>
          <Text className="text-muted-foreground font-mono text-xs">{copied === 'code' ? 'Copied ✓' : info.code}</Text>
        </View>
      </Pressable>
      <View className="border-border rounded-lg border">
        {rows.map(([label, value], i) => (
          <View key={label} className={cn('flex-row justify-between px-3 py-2', i > 0 && 'border-border border-t')}>
            <Text className="text-muted-foreground text-sm">{label}</Text>
            <Text className="text-sm">{value}</Text>
          </View>
        ))}
      </View>
      {live ? (
        <Text className="text-muted-foreground text-xs">
          Previewing {live} from Studio on the docs site. The values below follow it; the summary above is what tokens.json holds.
        </Text>
      ) : null}
    </View>
  );
}

function ColorTokens() {
  const palette = usePalette();
  const { copied, copy } = useCopy();
  const entries = Object.entries(palette) as [string, string][];
  return (
    <View className="w-full flex-row flex-wrap gap-3">
      {entries.map(([name, hex]) => {
        const cls = `bg-${kebab(name)}`;
        return (
          <Pressable key={name} onPress={() => copy(name, cls)} className="w-[30%] min-w-[96px] flex-1 gap-1">
            {/* Painted from the hex, not `bg-${name}`: a class assembled at runtime is
                never seen by Tailwind, so chart-1..5 and ring rendered blank. */}
            <View className="border-border h-14 rounded-lg border" style={{ backgroundColor: hex }} />
            <Text className="text-xs font-semibold" numberOfLines={1}>
              {copied === name ? 'Copied ✓' : kebab(name)}
            </Text>
            <Text className="text-muted-foreground font-mono text-xs">{hex}</Text>
          </Pressable>
        );
      })}
    </View>
  );
}

function SpacingTokens() {
  const { copied, copy } = useCopy();
  const entries = Object.entries(TOKENS.space) as [string, number][];
  return (
    <View className="w-full gap-2">
      {entries.map(([step, px]) => (
        <Pressable key={step} onPress={() => copy(step, `p-${step}`)} className="flex-row items-center gap-3">
          <View className="bg-foreground h-4 rounded-sm" style={{ width: Math.max(px, 2) }} />
          <Text className="w-12 font-medium">{copied === step ? '✓' : step}</Text>
          <Text className="text-muted-foreground text-sm">
            {px}px · p-{step} / gap-{step} / m-{step}
          </Text>
        </Pressable>
      ))}
    </View>
  );
}

/** Literal class names: Tailwind only generates classes it can read in the source. */
const RADIUS_CLASS: Record<string, string> = {
  sm: 'rounded-sm',
  md: 'rounded-md',
  lg: 'rounded-lg',
  xl: 'rounded-xl',
  '2xl': 'rounded-2xl',
  control: 'rounded-control',
  full: 'rounded-full',
};

function RadiusTokens() {
  const { copied, copy } = useCopy();
  // rounded-sm…2xl are multiples of the theme's base radius (rounded-lg); see tokens.json › radius.
  const px = (name: string) => {
    if (name === 'full') return 'full';
    if (name === 'control') return TOKENS.radius.control >= 9999 ? 'pill' : `${TOKENS.radius.control}px`;
    const value = (TOKENS.radius.base * TOKENS.radius[name as 'sm']) / TOKENS.radius.lg;
    return `${Math.round(value * 10) / 10}px`;
  };
  return (
    <View className="w-full flex-row flex-wrap gap-4">
      {Object.entries(RADIUS_CLASS).map(([name, cls]) => (
        <Pressable key={name} onPress={() => copy(name, cls)} className="items-center gap-1">
          <View className={cn('bg-card border-border h-14 w-14 border', cls)} />
          <Text className="text-xs font-semibold">{copied === name ? 'Copied ✓' : cls}</Text>
          <Text className="text-muted-foreground text-xs">{px(name)}</Text>
        </Pressable>
      ))}
    </View>
  );
}

/** The theme's elevation scale and border width, rendered with the classes components use. */
function DepthTokens() {
  const { copied, copy } = useCopy();
  const levels = [
    ['shadow-sm', 'Controls, cards'],
    ['shadow-md', 'Raised cards, popovers'],
    ['shadow-lg', 'Menus, dialogs, floating'],
  ] as const;
  return (
    <View className="w-full gap-4">
      <View className="flex-row flex-wrap gap-4">
        {levels.map(([cls, use]) => (
          <Pressable key={cls} onPress={() => copy(cls, cls)} className="w-[30%] min-w-[96px] flex-1 gap-2">
            <View className={cn('bg-card border-border h-16 rounded-lg border', cls)} />
            <Text className="text-xs font-semibold">{copied === cls ? 'Copied ✓' : cls}</Text>
            <Text className="text-muted-foreground text-xs">{use}</Text>
          </Pressable>
        ))}
      </View>
      <Pressable onPress={() => copy('border', 'border')} className="flex-row items-center gap-3">
        <View className="border-foreground h-10 w-16 rounded-md border" />
        <Text className="text-sm">
          {copied === 'border' ? 'Copied ✓' : `border · ${TOKENS.borderWidth}px`}
          <Text className="text-muted-foreground text-sm"> (border-2 and border-hairline stay fixed)</Text>
        </Text>
      </Pressable>
    </View>
  );
}

const TYPE_VARIANTS = ['h1', 'h2', 'h3', 'h4', 'lead', 'default', 'large', 'small', 'muted', 'code'] as const;

function TypeScale() {
  const { copied, copy } = useCopy();
  return (
    <View className="w-full">
      {TYPE_VARIANTS.map((v, i) => (
        <Pressable
          key={v}
          onPress={() => copy(v, v === 'default' ? '<Text>' : `<Text variant="${v}">`)}
          className={cn('border-border py-3', i < TYPE_VARIANTS.length - 1 && 'border-b')}>
          <Text variant={v} className={v === 'h1' ? 'text-left' : undefined}>
            The quick brown fox
          </Text>
          <Text className="text-muted-foreground mt-1 text-xs">
            {copied === v ? 'Copied ✓' : v === 'default' ? '<Text>' : `variant="${v}"`}
          </Text>
        </Pressable>
      ))}
    </View>
  );
}

function FontSizes() {
  const { copied, copy } = useCopy();
  const entries = Object.entries(TOKENS.fontSize) as [string, number][];
  return (
    <View className="w-full gap-2">
      {entries.map(([name, px]) => (
        <Pressable key={name} onPress={() => copy(name, `text-${name}`)} className="flex-row items-baseline gap-3">
          <Text className="w-20 font-medium">{copied === name ? '✓' : `text-${name}`}</Text>
          <Text style={{ fontSize: px }}>Aa</Text>
          <Text className="text-muted-foreground text-sm">{px}px</Text>
        </Pressable>
      ))}
    </View>
  );
}

function Durations() {
  const { copied, copy } = useCopy();
  const entries = Object.entries(TOKENS.duration) as [string, number][];
  return (
    <View className="w-full gap-2">
      {entries.map(([name, ms]) => (
        <Pressable key={name} onPress={() => copy(name, `TOKENS.duration.${name}`)} className="flex-row justify-between">
          <Text className="font-medium">{copied === name ? 'Copied ✓' : name}</Text>
          <Text className="text-muted-foreground text-sm">{ms}ms</Text>
        </Pressable>
      ))}
    </View>
  );
}

function Easings() {
  const { copied, copy } = useCopy();
  const entries = Object.entries(TOKENS.easing) as [string, readonly number[]][];
  const hint: Record<string, string> = {
    standard: 'position changes, most enters',
    emphasized: 'hero moments, reversible',
    exit: 'leaving the screen',
  };
  return (
    <View className="w-full gap-2">
      {entries.map(([name, curve]) => (
        <Pressable key={name} onPress={() => copy(name, `TOKENS.easing.${name}`)} className="gap-0.5">
          <View className="flex-row justify-between">
            <Text className="font-medium">{copied === name ? 'Copied ✓' : name}</Text>
            <Text className="text-muted-foreground font-mono text-xs">cubic-bezier({curve.join(', ')})</Text>
          </View>
          <Text className="text-muted-foreground text-sm">{hint[name]}</Text>
        </Pressable>
      ))}
    </View>
  );
}

export const FOUNDATION_SECTIONS: FoundationSection[] = [
  {
    id: 'theme',
    title: 'Theme',
    category: 'color',
    aliases: ['preset', 'brand', 'theme code', 'recipe'],
    caption: 'Make and preview systems in Studio on the docs site (/studio), then apply one: npx halftone-tokens theme apply <code>. Tap to copy the code.',
    Demo: ThemeSummary,
  },
  {
    id: 'colors',
    title: 'Semantic colours',
    category: 'color',
    aliases: ['palette', 'hex', 'background', 'foreground', 'primary', 'muted'],
    caption: 'Tap to copy the bg-* class. text-*, border-* use the same names. Values come from tokens/tokens.json.',
    Demo: ColorTokens,
  },
  {
    id: 'spacing',
    title: 'Spacing',
    category: 'metrics',
    aliases: ['padding', 'margin', 'gap', 'grid'],
    caption: 'The 4-pt grid. Only these steps are allowed. Tap to copy.',
    Demo: SpacingTokens,
  },
  {
    id: 'radius',
    title: 'Corner radius',
    category: 'metrics',
    aliases: ['rounded', 'corner', 'border radius'],
    caption: 'rounded-lg is the base (--radius); md and sm derive from it. Tap to copy.',
    Demo: RadiusTokens,
  },
  {
    id: 'depth',
    title: 'Depth & borders',
    category: 'metrics',
    aliases: ['shadow', 'elevation', 'border width', 'outline'],
    caption: "shadow-sm, -md and -lg are the theme's three elevation levels; border is its border width. Tap to copy.",
    Demo: DepthTokens,
  },
  {
    id: 'type-scale',
    title: 'Text variants',
    category: 'type',
    aliases: ['typography', 'heading', 'font'],
    caption: 'Use a variant, not ad-hoc size classes. Tap to copy.',
    Demo: TypeScale,
  },
  {
    id: 'font-sizes',
    title: 'Font sizes',
    category: 'type',
    aliases: ['text-sm', 'text-lg', 'size'],
    caption: 'For the rare case a variant does not fit.',
    Demo: FontSizes,
  },
  {
    id: 'durations',
    title: 'Durations',
    category: 'motion',
    aliases: ['animation', 'timing', 'ms'],
    caption: 'fast for micro-feedback, base for most transitions, slow for large surfaces.',
    Demo: Durations,
  },
  {
    id: 'easings',
    title: 'Easing curves',
    category: 'motion',
    aliases: ['bezier', 'curve', 'animation'],
    Demo: Easings,
  },
];
