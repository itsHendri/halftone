/**
 * lib/theme.ts — semantic colours as hex per scheme, non-colour primitives, and (for Expo Router apps)
 * the React Navigation theme.
 *   options: { out: 'lib/theme.ts', navTheme?: 'expo-router/react-navigation' | false }
 */
import { camel, group } from '../lib/resolve.mjs';
import { presetById, sameRecipe, themeStatus } from '../lib/theme/index.mjs';

/** The applied theme, for a read-only summary in the app (Foundations). */
function themeInfo(source) {
  const status = themeStatus(source);
  if (!status.applied) return 'null';
  const preset = presetById(status.recipe.preset ?? '');
  const name = preset && sameRecipe(preset.recipe, status.recipe) ? preset.name : 'Custom';
  return JSON.stringify({ code: status.code, name, edited: status.drift.length > 0, recipe: status.recipe }, null, 2);
}

const round = (n) => Number(n.toFixed(4));

function textStylesObject(styles) {
  return Object.entries(styles)
    .map(([name, s]) => `    ${name}: ${JSON.stringify({ font: s.font, weight: s.weight, size: round(s.size), lineHeight: round(s.lineHeight), tracking: s.tracking })},`)
    .join('\n');
}

function colorObject(colors, mode) {
  return colors.map((c) => `    ${camel(c.name)}: '${c[mode]}',`).join('\n');
}

function primitiveGroup(prim, prefix) {
  return group(prim, prefix)
    .map(({ key, value }) => `    ${/^[a-z_$][\w$]*$/i.test(key) ? key : `'${key}'`}: ${JSON.stringify(value)},`)
    .join('\n');
}

const navTheme = (scheme, base) => `  ${scheme}: {
    ...${base},
    colors: {
      background: THEME.${scheme}.background,
      border: THEME.${scheme}.border,
      card: THEME.${scheme}.card,
      notification: THEME.${scheme}.destructive,
      primary: THEME.${scheme}.primary,
      text: THEME.${scheme}.foreground,
    },
  },`;

export default function tsTheme(ctx, options) {
  const nav = options.navTheme;
  const contents = `// ${ctx.header}
${nav ? `import { DarkTheme, DefaultTheme, type Theme } from '${nav}';\n` : ''}
/**
 * Semantic colours as hex, per scheme. Use ONLY where a className cannot reach:
 * SVG fills, chart strokes, canvas, platform props (a StatusBar, gradient stops). Everything
 * else styles with Tailwind classes (bg-primary, text-muted-foreground, …).
 */
export const THEME = {
  light: {
${colorObject(ctx.colors, 'light')}
  },
  dark: {
${colorObject(ctx.colors, 'dark')}
  },
} as const;

export type ThemeColors = typeof THEME.light;
export type ThemeColorName = keyof ThemeColors;

/** Non-colour primitives (px / ms) for the rare inline-style or Reanimated use. */
export const TOKENS = {
  space: {
${primitiveGroup(ctx.prim, ['space'])}
  },
  radius: {
${primitiveGroup(ctx.prim, ['radius'])}
    base: ${ctx.radius.base},
    control: ${ctx.shape.control},
  },
  /** Lucide stroke width for icons (the Icon component's default; an explicit strokeWidth is relative to 2). */
  iconStroke: ${ctx.shape.stroke},
  /** Width of \`border\` in px. */
  borderWidth: ${ctx.shape.borderWidth},
  /** The theme's styles (button: solid · soft · outline · raised; field: outline · filled · underline) and their
   *  numbers (px): bg-button / bg-field, border-button-w, rounded-field… already follow them. */
  styles: ${JSON.stringify(ctx.styles)},
  button: ${JSON.stringify(ctx.shape.button)},
  field: ${JSON.stringify(ctx.shape.field)},
  /** Control heights and padding (px) for the theme's density: h-control-sm, h-control, h-control-lg, px-control-x. */
  density: ${JSON.stringify({ sm: ctx.shape.density.sm, md: ctx.shape.density.md, lg: ctx.shape.density.lg, x: ctx.shape.density.x })},
  /** The type scale at 16px; the theme's typeset multiplies it (text-* classes are already scaled). */
  fontSize: {
${primitiveGroup(ctx.prim, ['font', 'size'])}
  },
  /** The typeset: body size (px) and its scale, running-text leading and its factor on the text sizes' line
   *  heights, and Prose's flow (em between blocks) and measure (characters per line). */
  typeset: ${JSON.stringify(ctx.type)},
  /** The Text variants at the typeset, a system's edited styles included: font role, weight, size and line height
   *  (px), tracking (em). The classes (text-type-h1, leading-type-h1…) already follow them; this is for code
   *  that picks something per style, such as a font file per weight. */
  textStyles: {
${textStylesObject(ctx.textStyles)}
  },
  fontFamily: {
${primitiveGroup(ctx.prim, ['font', 'family'])}
  },
  duration: {
${primitiveGroup(ctx.prim, ['duration'])}
  },
  easing: {
${primitiveGroup(ctx.prim, ['easing'])}
  },
} as const;

/** The theme tokens.json was generated from (\`halftone-tokens theme apply\`), or null. \`edited\`: theme tokens
 *  were changed by hand since. */
export const THEME_INFO: ThemeInfo | null = ${themeInfo(ctx.source)};

export type ThemeInfo = {
  code: string;
  name: string;
  edited: boolean;
  recipe: {
    v: number;
    brand: string;
    neutral: string;
    radius: string;
    controls: string;
    font: { heading: string; body: string; mono: string };
    stroke: string;
    depth: string;
    density: string;
    border: string;
    size: string;
    leading: string;
    flow: string;
    measure: string;
    button?: string;
    field?: string;
    preset?: string;
  };
};
${
  nav
    ? `
export const NAV_THEME: Record<'light' | 'dark', Theme> = {
${navTheme('light', 'DefaultTheme')}
${navTheme('dark', 'DarkTheme')}
};
`
    : ''
}`;
  return [{ path: options.out, contents }];
}
