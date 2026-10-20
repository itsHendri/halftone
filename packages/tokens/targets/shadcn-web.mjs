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
import { styleVars, typeVars } from '../lib/theme/vars.mjs';

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

export default function shadcnWeb(ctx, options) {
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
${vars('light')}
}

.dark {
${styles('dark')}
${shadows('dark')}
${vars('dark')}
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
${ctx.colors.map((c) => `  --color-${c.name}: ${color(c.name)};`).join('\n')}
}

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
