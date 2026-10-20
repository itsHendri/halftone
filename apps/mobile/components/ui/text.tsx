import { FONT_FAMILY } from '@/lib/fonts';
import { useLiveFonts } from '@/lib/palette-context';
import { TOKENS } from '@/lib/theme';
import { cn } from '@/lib/utils';
import { Slot } from '@rn-primitives/slot';
import { cva, type VariantProps } from 'class-variance-authority';
import * as React from 'react';
import { Platform, Text as RNText, type Role } from 'react-native';

/**
 * The theme's text styles (tokens.json semantic.type, global.css --type-<style>-*): size, line height and weight
 * (STYLE), and tracking (TRACKING), one key each so a class in className still overrides one of them. Literal:
 * Tailwind reads them from this file. The font role is TOKENS.textStyles (useFontStyle); a mono style keeps
 * `font-mono`, which is the system mono font when the theme has no font of its own.
 */
const STYLE = {
  h1: 'text-type-h1 leading-type-h1 font-type-h1',
  h2: 'text-type-h2 leading-type-h2 font-type-h2',
  h3: 'text-type-h3 leading-type-h3 font-type-h3',
  h4: 'text-type-h4 leading-type-h4 font-type-h4',
  lead: 'text-type-lead leading-type-lead font-type-lead',
  p: 'text-type-p leading-type-p font-type-p',
  large: 'text-type-large leading-type-large font-type-large',
  small: 'text-type-small leading-type-small font-type-small',
  muted: 'text-type-muted leading-type-muted font-type-muted',
  code: 'text-type-code leading-type-code font-type-code',
  blockquote: 'text-type-blockquote leading-type-blockquote font-type-blockquote',
} satisfies Record<keyof typeof TOKENS.textStyles, string>;
const TRACKING = {
  h1: 'tracking-type-h1',
  h2: 'tracking-type-h2',
  h3: 'tracking-type-h3',
  h4: 'tracking-type-h4',
  lead: 'tracking-type-lead',
  p: 'tracking-type-p',
  large: 'tracking-type-large',
  small: 'tracking-type-small',
  muted: 'tracking-type-muted',
  code: 'tracking-type-code',
  blockquote: 'tracking-type-blockquote',
} satisfies Record<keyof typeof STYLE, string>;
type TextStyleName = keyof typeof STYLE;
/** iOS keeps the system font's own optical tracking only while letterSpacing is unset, so a style with none sets
 *  none on native. */
const style = (name: TextStyleName) =>
  cn(
    STYLE[name],
    (Platform.OS === 'web' || TOKENS.textStyles[name].tracking !== 0) && TRACKING[name],
    TOKENS.textStyles[name].font === 'mono' && 'font-mono'
  );

const textVariants = cva(
  cn(
    'text-foreground text-base',
    Platform.select({
      web: 'select-text',
    })
  ),
  {
    variants: {
      variant: {
        default: '',
        h1: cn(style('h1'), 'text-center', Platform.select({ web: 'scroll-m-20 text-balance' })),
        h2: cn(style('h2'), Platform.select({ web: 'scroll-m-20 first:mt-0' })),
        h3: cn(style('h3'), Platform.select({ web: 'scroll-m-20' })),
        h4: cn(style('h4'), Platform.select({ web: 'scroll-m-20' })),
        p: cn(style('p'), 'mt-3 sm:mt-6'),
        blockquote: cn(style('blockquote'), 'mt-4 border-l-2 pl-3 italic sm:mt-6 sm:pl-6'),
        code: cn(style('code'), 'bg-muted relative rounded px-[0.3rem] py-[0.2rem]'),
        lead: cn(style('lead'), 'text-muted-foreground'),
        large: style('large'),
        small: style('small'),
        muted: cn(style('muted'), 'text-muted-foreground'),
      },
    },
    defaultVariants: {
      variant: 'default',
    },
  }
);

type TextVariantProps = VariantProps<typeof textVariants>;

type TextVariant = NonNullable<TextVariantProps['variant']>;

const ROLE: Partial<Record<TextVariant, Role>> = {
  h1: 'heading',
  h2: 'heading',
  h3: 'heading',
  h4: 'heading',
  blockquote: Platform.select({ web: 'blockquote' as Role }),
  code: Platform.select({ web: 'code' as Role }),
};

const ARIA_LEVEL: Partial<Record<TextVariant, string>> = {
  h1: '1',
  h2: '2',
  h3: '3',
  h4: '4',
};

const TextClassContext = React.createContext<string | undefined>(undefined);

const WEIGHT: Record<string, number> = {
  'font-thin': 100,
  'font-extralight': 200,
  'font-light': 300,
  'font-normal': 400,
  'font-medium': 500,
  'font-semibold': 600,
  'font-bold': 700,
  'font-extrabold': 800,
  'font-black': 900,
};
const SYSTEM_STACK = 'ui-sans-serif, system-ui, -apple-system, sans-serif';
const MONO_STACK = 'ui-monospace, SFMono-Regular, Menlo, monospace';

/**
 * The theme's font for this text (lib/fonts.ts). A `font-mono` or `font-heading` class picks that role; otherwise
 * the variant's text style does (TOKENS.textStyles: headings take the heading font, code the mono font, the rest
 * the body font), or a live theme's own styles. A custom font is one family per weight on native (Android
 * ignores fontWeight for it), so the weight in the classes, else the style's, picks the family and fontWeight
 * is reset. A live theme from the docs picker (web only) uses its Google font.
 */
function useFontStyle(classes: string, variant: TextVariant = 'default') {
  const live = useLiveFonts();
  const styled = variant === 'default' ? null : TOKENS.textStyles[variant];
  const fromClass = /(^|\s)font-mono(\s|$)/.test(classes) ? 'mono' : /(^|\s)font-heading(\s|$)/.test(classes) ? 'heading' : null;
  // A mono style's own font-mono is not a choice made in className: a live theme can still move it.
  const explicit = fromClass && fromClass !== styled?.font ? fromClass : null;
  const committed = explicit ?? styled?.font ?? 'body';
  const role = explicit ?? (variant !== 'default' ? live?.roles?.[variant] : undefined) ?? committed;
  const families = FONT_FAMILY[role];
  if (live) {
    // A live theme decides every role: its font, or the system font over a committed custom one (or over the
    // committed style's font-mono, when the live style moved off mono).
    const family = live[role];
    const stack = role === 'mono' ? MONO_STACK : SYSTEM_STACK;
    if (family) return { fontFamily: `"${family}", ${stack}` };
    return families || role !== committed ? { fontFamily: stack } : undefined;
  }
  if (!families) return undefined;
  const weight = classes.split(/\s+/).reduce<number>((w, c) => WEIGHT[c] ?? w, styled?.weight ?? 400);
  const loaded = Object.keys(families).map(Number);
  const nearest = loaded.reduce((best, w) => (Math.abs(w - weight) < Math.abs(best - weight) ? w : best), loaded[0]);
  return { fontFamily: families[nearest], fontWeight: 'normal' as const };
}

function Text({
  className,
  asChild = false,
  variant = 'default',
  ...props
}: React.ComponentProps<typeof RNText> &
  React.RefAttributes<typeof RNText> &
  TextVariantProps & {
    asChild?: boolean;
  }) {
  const textClass = React.useContext(TextClassContext);
  const Component = asChild ? Slot : RNText;
  const classes = cn(textVariants({ variant }), textClass, className);
  const font = useFontStyle(classes, variant ?? 'default');
  return (
    <Component
      className={classes}
      role={variant ? ROLE[variant] : undefined}
      aria-level={variant ? ARIA_LEVEL[variant] : undefined}
      {...props}
      style={font ? [font, props.style] : props.style}
    />
  );
}

export { Text, TextClassContext, useFontStyle };
