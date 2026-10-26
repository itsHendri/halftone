/**
 * NativeWind 4 / Tailwind 3 (shadcn v3 shape): bare HSL triplets in `:root` and `.dark:root`, plus the
 * colour + radius maps tailwind.config.js spreads in.
 *   options: { css: 'global.css', tailwind: 'tokens/generated/tailwind.theme.js' }
 */
import { hexToHslTriplet } from '../lib/color.mjs';
import { cssName, group, isColor, radiusCss } from '../lib/resolve.mjs';
import { shadowCss, TEXT_LINE_HEIGHT } from '../lib/theme/recipe.mjs';
import { COMPONENT_NAMES, COMPONENTS, componentColors, componentVars } from '../lib/theme/components.mjs';
import { extraTextStyles } from '../lib/theme/extras.mjs';
import { extraVars, styleVars, textStyleVars } from '../lib/theme/vars.mjs';

const rem = (px) => (px >= 9999 ? '9999px' : `${Number((px / 16).toFixed(4))}rem`);

/** Shape variables come from ctx.shape, which has defaults for a token file from before themes. */
const SHAPE = new Set(['radius-control', 'border-width', 'icon-stroke']);

function cssBlock(selector, tokens, shape, mode, colors) {
  const lines = tokens
    // Shadows are literal in tailwind.theme.js: a var() box-shadow drops the view on native. The styles'
    // numbers come from shape (with their units), below.
    // A system's radius steps are in borderRadius below, with their units.
    .filter((t) => t.$type !== 'shadow' && !SHAPE.has(cssName(t)) && !/^(density|type|radius)-/.test(cssName(t)))
    .filter((t) => isColor(t) || !/^(button|field)-/.test(cssName(t)))
    .map((t) => {
      const name = cssName(t);
      if (isColor(t)) return `    --${name}: ${hexToHslTriplet(t.$value)};`;
      if (name === 'radius') return `    --${name}: ${rem(t.$value)};`;
      return `    --${name}: ${t.$value};`;
    });
  if (shape.control !== undefined) {
    lines.push(`    --radius-control: ${rem(shape.control)};`, `    --border-width: ${shape.borderWidth}px;`, `    --icon-stroke: ${shape.stroke};`);
    for (const size of ['sm', 'md', 'lg', 'x']) lines.push(`    --control-${size}: ${shape.density[size]}px;`);
  }
  // The text styles (Text h1…blockquote): literal at the typeset, so an edited style is one variable.
  if (shape.textStyles) for (const [name, value] of Object.entries(textStyleVars(shape.textStyles, 'hsl'))) lines.push(`    ${name}: ${value};`);
  // Style colours a token file from before the styles doesn't have (resolve.mjs adds them), then the styles' numbers.
  const present = new Set(tokens.filter(isColor).map(cssName));
  for (const c of colors) if (!present.has(c.name)) lines.push(`    --${c.name}: ${hexToHslTriplet(c[mode])};`);
  for (const [name, value] of Object.entries(styleVars(shape.styleShape, 'hsl')[mode])) lines.push(`    ${name}: ${value};`);
  // The component layer (Button, Chip, Badge, Input): corners, sizes, text and each variant's colours.
  if (shape.components) for (const [name, value] of Object.entries(componentVars(shape.components, 'hsl', hexToHslTriplet)[mode])) lines.push(`    ${name}: ${value};`);
  // A system's extras: colours, text styles and border widths (corners and shadows are literal in tailwind.theme.js).
  if (shape.extras) {
    const extra = Object.entries(extraVars(shape.extras, 'hsl')[mode]).filter(([name]) => !/^--(radius|shadow)-/.test(name));
    if (extra.length) lines.push('    /* Extras: this system\'s own tokens. No kit component uses them; screens may. */', ...extra.map(([name, value]) => `    ${name}: ${value};`));
  }
  return `  ${selector} {\n${lines.join('\n')}\n  }`;
}

export default function nativewind3(ctx, options) {
  const css = `/* ${ctx.header} */
@tailwind base;
@tailwind components;
@tailwind utilities;

@layer base {
${cssBlock(':root', ctx.semLight, { ...ctx.shape, styleShape: ctx.shape, textStyles: ctx.textStyles, extras: ctx.extras, components: ctx.components }, 'light', ctx.colors)}

${cssBlock('.dark:root', ctx.semDark, { styleShape: ctx.shape, extras: ctx.extras, components: ctx.components }, 'dark', ctx.colors)}
}
`;
  const colors = Object.fromEntries(ctx.colors.map((c) => [c.name, `hsl(var(--${c.name}))`]));
  // The styles' fills carry their own opacity (an outline button, a transparent field). No /90 modifiers on these.
  colors.button = 'hsl(var(--button) / var(--button-alpha))';
  colors.field = 'hsl(var(--field) / var(--field-alpha))';
  const borderRadius = Object.fromEntries(ctx.radius.steps.map((s) => [s.name, radiusCss(s)]));
  borderRadius.control = 'var(--radius-control)';
  // Field style: rounded-field (top) and rounded-b-field-b (bottom).
  borderRadius.field = 'var(--field-radius)';
  borderRadius['field-b'] = 'var(--field-radius-b)';
  // The styles' widths: border-button-w / border-b-button-edge-w, border-field-w / border-b-field-edge-w (named
  // apart from the colours, or border-button would set both).
  const borderWidth = { DEFAULT: 'var(--border-width)', 'button-w': 'var(--button-border-w)', 'button-edge-w': 'var(--button-edge-w)', 'field-w': 'var(--field-border-w)', 'field-edge-w': 'var(--field-edge-w)' };
  // The theme's depth takes over Tailwind's shadow scale: 1 = xs/sm/shadow, 2 = md, 3 = lg/xl/2xl. Light
  // values: native can't switch a box-shadow per scheme.
  const s = ctx.shape.shadows.light;
  const boxShadow = { xs: s[1], sm: s[1], DEFAULT: s[1], md: s[2], lg: s[3], xl: s[3], '2xl': s[3] };
  // Density: control heights (h-control-sm / h-control / h-control-lg, and min-h-*) and padding (px-control-x).
  const height = { 'control-sm': 'var(--control-sm)', control: 'var(--control-md)', 'control-lg': 'var(--control-lg)' };
  // The typeset, literal (native has no runtime theme): text-xs…4xl and their line heights scaled, and
  // Prose's leading-prose, gap-flow and max-w-measure (native has no ch: half the text size per character).
  const { scale, leadingFactor, size, leading, flow, measure } = ctx.type;
  const fontSize = Object.fromEntries(
    group(ctx.prim, ['font', 'size'])
      .filter(({ key }) => key in TEXT_LINE_HEIGHT)
      .map(({ key, value }) => [key, [rem(value * scale), { lineHeight: rem(TEXT_LINE_HEIGHT[key] * scale * leadingFactor) }]])
  );
  const lineHeight = { prose: rem(size * leading) };
  const spacing = { 'control-x': 'var(--control-x)', 'field-x': 'var(--field-x)', flow: rem(size * flow) };
  const maxWidth = { measure: rem(measure * size * 0.5) };
  // The text styles, one key per property: text-type-h1, leading-type-h1, tracking-type-h1, font-type-h1 (Text's
  // variants). Variables (global.css), so a system's edited style changes one value.
  for (const name of Object.keys(ctx.textStyles)) {
    fontSize[`type-${name}`] = `var(--type-${name}-size)`;
    lineHeight[`type-${name}`] = `var(--type-${name}-leading)`;
  }
  const letterSpacing = Object.fromEntries(Object.keys(ctx.textStyles).map((name) => [`type-${name}`, `var(--type-${name}-tracking)`]));
  const fontWeight = Object.fromEntries(Object.keys(ctx.textStyles).map((name) => [`type-${name}`, `var(--type-${name}-weight)`]));
  // The component layer: bg-button-primary-bg, rounded-button, h-button-md, px-button-x, text-type-button,
  // border-button-primary-w, gap-button-gap, border-chip… Each colour carries its opacity (--button-primary-bg-a).
  // Weight, case and shadow are picked in JS from TOKENS.components (a custom font is one family per weight).
  Object.assign(colors, componentColors(ctx.components, (key, alpha) => (alpha ? `hsl(var(--${key}) / var(--${key}-a))` : `hsl(var(--${key}))`)));
  for (const name of COMPONENT_NAMES) {
    const c = ctx.components[name];
    const p = COMPONENTS[name].prefix;
    if (name !== 'input') borderRadius[p] = `var(--${p}-radius)`;
    for (const size of Object.keys(c.h)) height[`${p}-${size}`] = `var(--${p}-h-${size})`;
    if (name !== 'input') spacing[`${p}-x`] = `var(--${p}-x)`;
    fontSize[`type-${p}`] = `var(--${p}-text-size)`;
    lineHeight[`type-${p}`] = `var(--${p}-text-leading)`;
    letterSpacing[`type-${p}`] = `var(--${p}-text-tracking)`;
  }
  Object.assign(spacing, { 'button-x-sm': 'var(--button-x-sm)', 'button-x-lg': 'var(--button-x-lg)' });
  // Gaps (gap-button-gap, gap-button-gap-sm, gap-chip-gap, gap-badge-gap) and Chip and Badge borders (border-chip).
  for (const name of ['button', 'chip', 'badge']) spacing[`${name}-gap`] = `var(--${name}-gap)`;
  spacing['button-gap-sm'] = 'var(--button-gap-sm)';
  for (const name of ['chip', 'badge']) borderWidth[name] = `var(--${name}-border-w)`;
  for (const variant of Object.keys(ctx.components.button.variants)) {
    borderWidth[`button-${variant}-w`] = `var(--button-${variant}-border-w)`;
    borderWidth[`button-${variant}-edge-w`] = `var(--button-${variant}-edge-w)`;
  }
  // A system's extras: bg-<name>, rounded-<name>, shadow-<name>, border-<name> (its width), text-type-<name>…
  const extras = ctx.extras ?? { color: [], text: [], radius: [], shadow: [], border: [] };
  for (const c of extras.color) colors[c.name] = `hsl(var(--${c.name}))`;
  for (const r of extras.radius) borderRadius[r.name] = rem(r.px);
  for (const sh of extras.shadow) boxShadow[sh.name] = shadowCss(sh.light);
  for (const b of extras.border) borderWidth[b.name] = `var(--border-${b.name}-width)`;
  for (const name of Object.keys(extraTextStyles(extras))) {
    fontSize[`type-${name}`] = `var(--type-${name}-size)`;
    lineHeight[`type-${name}`] = `var(--type-${name}-leading)`;
    letterSpacing[`type-${name}`] = `var(--type-${name}-tracking)`;
    fontWeight[`type-${name}`] = `var(--type-${name}-weight)`;
  }
  const tailwind = `// ${ctx.header}\nmodule.exports = ${JSON.stringify({ colors, borderRadius, borderWidth, boxShadow, height, minHeight: height, width: height, spacing, fontSize, lineHeight, letterSpacing, fontWeight, maxWidth }, null, 2)};\n`;
  return [
    { path: options.css, contents: css },
    { path: options.tailwind, contents: tailwind },
  ];
}
