/**
 * Tailwind 4 / shadcn web (v4 shape): oklch variables in `:root` and `.dark`, the `@theme inline`
 * mapping that turns them into utilities, and shadcn's base layer. A partial, not a full stylesheet:
 *   app/globals.css →  @import "tailwindcss";  @import "./tokens.css";
 * Same tokens, same contrast gate as the native CSS; colours are converted with a round-trip check.
 *   options: { out: 'tokens/generated/web.css' }
 *            density: false   leave the spacing scale alone (the docs site)
 *            typeset: false   leave the text sizes alone (the docs site keeps its reading sizes)
 */
import { hexToOklch } from '../lib/color.mjs';
import { group, radiusCss } from '../lib/resolve.mjs';
import { TEXT_LINE_HEIGHT } from '../lib/theme/recipe.mjs';
import { COMPONENT_NAMES, COMPONENTS, componentColors, componentVars } from '../lib/theme/components.mjs';
import { hasExtras } from '../lib/theme/extras.mjs';
import { extraVars, styleVars, textStyleVars, typeVars } from '../lib/theme/vars.mjs';

const rem = (px) => (px >= 9999 ? '9999px' : `${px / 16}rem`);
const SYSTEM_SANS = "ui-sans-serif, system-ui, -apple-system, 'Segoe UI', sans-serif";
const SYSTEM_MONO = 'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace';

/** Tailwind's text-xs…4xl from the primitive sizes, scaled by the typeset (sizes and line heights). */
function textScale(ctx) {
  const sizes = group(ctx.prim, ['font', 'size']).filter(({ key }) => key in TEXT_LINE_HEIGHT);
  return sizes
    .map(({ key, value }) => {
      // Exact ratios, as Tailwind writes them (calc(1 / 0.75)), so the default typeset changes nothing.
      return `  --text-${key}: calc(${value / 16}rem * var(--type-scale));\n  --text-${key}--line-height: calc(${TEXT_LINE_HEIGHT[key]} / ${value} * var(--leading-factor));`;
    })
    .join('\n');
}

/** A font role's family, as @theme's --font-* resolve it (app/fonts.ts or a live theme sets --kit-font-*). */
const FONT_ROLE = {
  heading: `var(--kit-font-heading, var(--kit-font-body, ${SYSTEM_SANS}))`,
  body: `var(--kit-font-body, ${SYSTEM_SANS})`,
  mono: `var(--kit-font-mono, ${SYSTEM_MONO})`,
};

/**
 * The text styles as utilities: type-h1 … type-blockquote set the style's font, size, line height, tracking and
 * weight from its variables. leading-*, tracking-* and font-* on the same element still win, as on text-*.
 */
function textStyleUtilities(names) {
  return names
    .map(
      (name) => `@utility type-${name} {
  font-family: var(--type-${name}-font);
  font-size: var(--type-${name}-size);
  line-height: var(--tw-leading, var(--type-${name}-leading));
  letter-spacing: var(--tw-tracking, var(--type-${name}-tracking));
  font-weight: var(--tw-font-weight, var(--type-${name}-weight));
}`
    )
    .join('\n');
}

/**
 * A system's extras (lib/theme/extras.mjs): their variables in :root and .dark, colours and corners in @theme (so
 * bg-<name>, text-<name>, rounded-<name> exist), and shadow-, border- and type- utilities. No kit component uses them.
 */
function extrasCss(ctx) {
  const list = ctx.extras;
  if (!list || !hasExtras(list)) return { light: '', dark: '', theme: '', utilities: '' };
  const vars = extraVars(list, 'oklch', (role) => FONT_ROLE[role]);
  const lines = (map) => Object.entries(map).map(([k, v]) => `  ${k}: ${v};`).join('\n');
  // Corners are literal in @theme (rounded-<name>), not variables of their own.
  const light = Object.fromEntries(Object.entries(vars.light).filter(([k]) => !k.startsWith('--radius-')));
  const theme = [
    ...list.color.map((c) => `  --color-${c.name}: var(--${c.name});`),
    ...list.radius.map((r) => `  --radius-${r.name}: ${rem(r.px)};`),
  ];
  const utilities = [
    ...list.shadow.map((s) => `@utility shadow-${s.name} {\n  box-shadow: var(--shadow-${s.name});\n}`),
    ...list.border.map((b) => `@utility border-${b.name} {\n  border-width: var(--border-${b.name}-width);\n  border-style: ${b.style ?? 'solid'};\n}`),
    textStyleUtilities(list.text.map((t) => t.name)),
  ].filter(Boolean);
  return {
    light: `\n  /* Extras: this system's own tokens. No kit component uses them; screens may. */\n${lines(light)}`,
    dark: Object.keys(vars.dark).length ? `\n  /* Extras */\n${lines(vars.dark)}` : '',
    theme: theme.length ? `\n  /* Extras */\n${theme.join('\n')}` : '',
    utilities: utilities.length ? `\n/* Extras */\n${utilities.join('\n')}\n` : '',
  };
}

/**
 * The component layer (Button, Chip, Badge, Input): the variables per mode, each variant's colours as Tailwind colours
 * (bg-button-primary-bg; a colour with an opacity mixes it in), rounded-button / -chip / -badge, and type-button,
 * type-chip, type-badge and type-field for the text. Heights and padding are read as h-(--button-h-md), px-(--button-x).
 */
function componentsCss(ctx) {
  const vars = componentVars(ctx.components, 'oklch', hexToOklch, (role) => FONT_ROLE[role]);
  const lines = (map) => Object.entries(map).map(([k, v]) => `  ${k}: ${v};`).join('\n');
  const colors = componentColors(ctx.components, (key, alpha) => (alpha ? `color-mix(in oklab, var(--${key}) calc(var(--${key}-a) * 100%), transparent)` : `var(--${key})`));
  const theme = [
    ...COMPONENT_NAMES.filter((n) => n !== 'input').map((n) => `  --radius-${n}: var(--${n}-radius);`),
    ...Object.entries(colors).map(([key, css]) => `  --color-${key}: ${css};`),
  ];
  const utilities = COMPONENT_NAMES.map((n) => COMPONENTS[n].prefix).map(
    (p) => `@utility type-${p} {
  font-family: var(--${p}-text-font);
  font-size: var(--${p}-text-size);
  line-height: var(--tw-leading, var(--${p}-text-leading));
  letter-spacing: var(--tw-tracking, var(--${p}-text-tracking));
}`
  );
  return {
    light: `\n  /* Components: Button, Chip, Badge, Input (corners, sizes, text, each variant's colours). */\n${lines(vars.light)}`,
    dark: `\n  /* Components */\n${lines(vars.dark)}`,
    theme: `\n  /* Components: rounded-button, bg-button-primary-bg, border-field-focus-border… */\n${theme.join('\n')}`,
    utilities: `${utilities.join('\n')}\n`,
  };
}

export default function shadcnWeb(ctx, options) {
  const extras = extrasCss(ctx);
  const components = componentsCss(ctx);
  const vars = (mode) => ctx.colors.map((c) => `  --${c.name}: ${hexToOklch(c[mode])};`).join('\n');
  const styles = (mode) => Object.entries(styleVars(ctx.shape, 'oklch')[mode]).map(([k, v]) => `  ${k}: ${v};`).join('\n');
  // The styles' fills carry their own opacity (an outline button, a transparent field).
  const color = (name) =>
    name === 'button' || name === 'field' ? `color-mix(in oklab, var(--${name}) calc(var(--${name}-alpha) * 100%), transparent)` : `var(--${name})`;
  const shadows = (mode) => Object.entries(ctx.shape.shadows[mode]).map(([level, css]) => `  --shadow-${level}: ${css};`).join('\n');
  const contents = `/* ${ctx.header} */
@custom-variant dark (&:is(.dark *));

:root {
  --radius: ${rem(ctx.radius.base)};
  --radius-control: ${rem(ctx.shape.control)};
  --border-width: ${ctx.shape.borderWidth}px;
  --icon-stroke: ${ctx.shape.stroke};${options.density === false ? '' : `\n  --density: ${ctx.shape.density.scale};`}${
    options.typeset === false ? '' : '\n' + Object.entries(typeVars(ctx.type)).map(([k, v]) => `  ${k}: ${v};`).join('\n')
  }
${styles('light')}
${shadows('light')}
  /* The text styles (type-h1…type-blockquote), literal at the typeset: an edited style is one variable. */
${Object.entries(textStyleVars(ctx.textStyles, 'oklch', (role) => FONT_ROLE[role])).map(([k, v]) => `  ${k}: ${v};`).join('\n')}
${vars('light')}${components.light}${extras.light}
}

.dark {
${styles('dark')}
${shadows('dark')}
${vars('dark')}${components.dark}${extras.dark}
}

@theme inline {
${ctx.radius.steps.map((s) => `  --radius-${s.name}: ${radiusCss(s)};`).join('\n')}
  --radius-control: var(--radius-control);
  /* The field style: rounded-field, rounded-b-field-b, px-field-x. Widths are border-(length:--field-border-w) etc. */
  --radius-field: var(--field-radius);
  --radius-field-b: var(--field-radius-b);
  --spacing-field-x: var(--field-x);
  --default-border-width: var(--border-width);${options.density === false ? '' : `\n  /* The theme's density scales the whole spacing scale (p-4, gap-2, h-9…). */\n  --spacing: calc(0.25rem * var(--density));`}
  --shadow-2xs: var(--shadow-1);
  --shadow-xs: var(--shadow-1);
  --shadow-sm: var(--shadow-1);
  --shadow-md: var(--shadow-2);
  --shadow-lg: var(--shadow-3);
  --shadow-xl: var(--shadow-3);
  --shadow-2xl: var(--shadow-3);
  --font-sans: var(--kit-font-body, ${SYSTEM_SANS});
  --font-heading: var(--kit-font-heading, var(--kit-font-body, ${SYSTEM_SANS}));
  --font-mono: var(--kit-font-mono, ${SYSTEM_MONO});${
    options.typeset === false ? '' : `\n  /* The theme's typeset scales every text size and its line height (text-sm, text-base…). */\n${textScale(ctx)}`
  }
${ctx.colors.map((c) => `  --color-${c.name}: ${color(c.name)};`).join('\n')}${components.theme}${extras.theme}
}

${textStyleUtilities(Object.keys(ctx.textStyles))}
${components.utilities}${extras.utilities}
@layer base {
  * {
    @apply border-border outline-ring/50;
  }
  body {
    @apply bg-background text-foreground;
  }
  /* The theme's heading font (--kit-font-heading, set by app/fonts.ts or a live theme). */
  h1, h2, h3, h4, [data-slot='card-title'] {
    font-family: var(--font-heading);
  }
  /* Lucide icons take the theme's stroke. */
  svg.lucide {
    stroke-width: var(--icon-stroke);
  }
}
`;
  return [{ path: options.out, contents }];
}
