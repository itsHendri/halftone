/**
 * lib/theme.ts — semantic colours as hex per scheme, non-colour primitives, and (for Expo Router apps)
 * the React Navigation theme.
 *   options: { out: 'lib/theme.ts', navTheme?: 'expo-router/react-navigation' | false }
 */
import { camel, group } from '../lib/resolve.mjs';
import { COMPONENT_NAMES, componentVarNames, TOUCH_TARGET } from '../lib/theme/components.mjs';
import { presetById, sameRecipe, themeStatus } from '../lib/theme/index.mjs';

/** The applied theme, for a read-only summary in the app (Foundations). */
function themeInfo(source) {
  const status = themeStatus(source);
  if (!status.applied) return 'null';
  const preset = presetById(status.recipe.preset ?? '');
  // A system is named after itself; its code is null when it has overrides a code can't carry.
  const name = status.system?.name ?? (preset && sameRecipe(preset.recipe, status.recipe) ? preset.name : 'Custom');
  return JSON.stringify({ code: status.code, name, edited: status.drift.length > 0, recipe: status.recipe }, null, 2);
}

const round = (n) => Number(n.toFixed(4));

/** The component layer's numbers: sizes (px, for the phone touch-target floor) and each text's font role and tracking. */
function componentsObject(components) {
  return COMPONENT_NAMES.map((name) => {
    const c = components[name];
    const text = { font: c.text.font, size: round(c.text.size), lineHeight: round(c.text.leading), tracking: c.text.tracking, weight: c.text.weight ?? (name === 'input' ? 400 : 500), case: c.text.case ?? 'none' };
    // The icon size and the shadow ('none', '1'…'3'): native picks them in JS.
    const own = { ...(c.gap ? { gap: c.gap } : {}), ...('icon' in c ? { icon: c.icon } : {}), ...('shadow' in c ? { shadow: c.shadow } : {}) };
    // The font role is typed as a role, so code can branch on it (the object is `as const`), and tracking as a
    // number: a kit compares it with 0, which wouldn't typecheck against a system's literal 0.01.
    const json = JSON.stringify({ height: c.h, x: c.x, radius: c.radius, text, ...own })
      .replace(/"font":("\w+")/, `"font":$1 as 'heading' | 'body' | 'mono'`)
      .replace(/"tracking":(-?[\d.e-]+)/, '"tracking":$1 as number')
      .replace(/"weight":(\d+)/, '"weight":$1 as number')
      .replace(/"case":("\w+")/, `"case":$1 as 'none' | 'uppercase'`)
      .replace(/"icon":([\d.]+)/, '"icon":$1 as number')
      .replace(/"shadow":("\w+")/, `"shadow":$1 as 'none' | '1' | '2' | '3'`);
    return `    ${name}: ${json},`;
  }).join('\n');
}

function textStylesObject(styles) {
  return Object.entries(styles)
    // Tracking as a number, as the components' (a kit compares it with 0).
    .map(([name, s]) => `    ${name}: ${JSON.stringify({ font: s.font, weight: s.weight, size: round(s.size), lineHeight: round(s.lineHeight), tracking: s.tracking }).replace(/"tracking":(-?[\d.e-]+)/, '"tracking":$1 as number')},`)
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
  /** The Foundations shadows as CSS, per mode (shadow-sm / md / lg): native draws a component's shadow with them
   *  (React Native's boxShadow), so a see-through field shows one too. */
  shadows: ${JSON.stringify(ctx.shape.shadows)},
  /** Width of \`border\` in px. */
  borderWidth: ${ctx.shape.borderWidth},
  /** The theme's styles (button: solid · soft · outline · raised; field: outline · filled · underline) and their
   *  numbers (px): bg-button / bg-field, border-button-w, rounded-field… already follow them. */
  styles: ${JSON.stringify(ctx.styles)},
  button: ${JSON.stringify(ctx.shape.button)},
  field: ${JSON.stringify(ctx.shape.field)},
  /** The component layer (Button, Chip, Badge, Input) as numbers: heights, padding and gaps (px), corner, the text's
   *  font role, tracking, weight and case, the icon size and shadow level. The classes (h-button-md,
   *  rounded-button, text-type-button…) already follow the sizes; this is for the touch-target floor (phones raise a
   *  height under ${TOUCH_TARGET} with hitSlop) and what native picks in JS: the font, weight, case, icon and shadow. */
  components: {
${componentsObject(ctx.components)}
  },
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

/** The component layer's CSS variables (what an embedded kit accepts from the docs site's live theme). */
export const COMPONENT_VARS = ${JSON.stringify(componentVarNames())} as const;

/** The theme tokens.json was generated from (\`halftone-tokens theme apply\`), or null. \`edited\`: theme tokens
 *  were changed by hand since. */
export const THEME_INFO: ThemeInfo | null = ${themeInfo(ctx.source)};

export type ThemeInfo = {
  /** null for a system (\`.halftone.json\`) with overrides no theme code carries. */
  code: string | null;
  /** The preset's name, the system's name, or 'Custom'. */
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
