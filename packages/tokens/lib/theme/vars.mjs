/**
 * A generated theme as CSS variables, in the format each app's build writes them, so a live override
 * matches what `tokens:build` would produce:
 *   'hsl'    NativeWind 4 / shadcn v3 triplets (`221.2 83.2% 53.3%`) — the mobile kit
 *   'oklch'  Tailwind 4 / shadcn web (`oklch(0.546 0.2152 262.88)`) — the web kit and the docs site
 */
import { hexToHslTriplet, hexToOklch } from '../color.mjs';
import { componentVars } from './components.mjs';
import { extraList, extraTextStyles } from './extras.mjs';
import { resolveTextStyles, shadowCss, textEdits } from './recipe.mjs';

export const rem = (px) => (px >= 9999 ? '9999px' : `${px / 16}rem`);

const camel = (s) => s.replace(/-([a-z0-9])/g, (_, c) => c.toUpperCase());

/** The typeset's variables (both formats): text sizes and line heights scale with the first two. */
export const typeVars = (type) => ({
  '--type-scale': String(type.scale),
  '--leading-factor': String(type.leadingFactor),
  '--typeset-leading': String(type.leading),
  '--typeset-flow': `${type.flow}em`,
  '--typeset-measure': `${type.measure}ch`,
});

const fixed = (n, places = 4) => Number(n.toFixed(places));

/** A theme's text styles as drawn (recipe.mjs resolveTextStyles): its typeset, its edited styles on top. */
export const themeTextStyles = (theme) => resolveTextStyles(theme.type, textEdits(theme.semantic?.type));

/**
 * The text styles' variables, --type-<style>-{size,leading,weight,tracking,font}, from resolveTextStyles. Literal
 * values at the theme's typeset, in each kit's units:
 *   'hsl'    mobile (NativeWind): size and line height in rem (native line heights are lengths); the font is
 *            the role, which components/ui/text.tsx picks in JS, so no variable. Tracking is em on native too:
 *            NativeWind resolves it against the style's own size (its preset's tracking-* are fixed px instead)
 *   'oklch'  web: rem and a unitless line height; the font is the role's family variable. `font(role)` writes
 *            it (the build adds fallbacks; a live theme always sets --kit-font-*)
 */
export function textStyleVars(styles, format, font = (role) => `var(--kit-font-${role})`) {
  const vars = {};
  // Mobile rounds rem to 4 places, as nativewind3's text-* sizes always were.
  const length = (px) => (format === 'hsl' ? `${fixed(px / 16)}rem` : rem(fixed(px)));
  for (const [name, s] of Object.entries(styles)) {
    const v = `--type-${name}`;
    vars[`${v}-size`] = length(s.size);
    vars[`${v}-leading`] = format === 'hsl' ? length(s.lineHeight ?? s.size * s.leading) : String(fixed(s.leading, 6));
    vars[`${v}-weight`] = String(s.weight);
    vars[`${v}-tracking`] = `${s.tracking}em`;
    if (format !== 'hsl') vars[`${v}-font`] = font(s.font);
  }
  return vars;
}

/**
 * The button and field styles' variables (both formats), from a theme's or a token file's { button, field }
 * (generate.mjs, resolve.mjs). Widths are numbers on the light block; the field's fill opacity is per mode. A
 * field's corners, padding and shadow are the component layer's (componentVars: --field-radius, --field-radius-b,
 * --field-x, --field-shadow; a field is flat until a system gives it a shadow).
 */
export function styleVars({ button, field }, format) {
  return {
    light: {
      '--button-alpha': String(button.alpha),
      '--button-border-w': `${button.border}px`,
      '--button-edge-w': `${button.edge}px`,
      '--field-alpha': String(field.alpha.light),
      '--field-border-w': `${field.border}px`,
      '--field-edge-w': `${field.edge}px`,
    },
    dark: { '--field-alpha': String(field.alpha.dark) },
  };
}

/**
 * A system's extras as variables (lib/theme/extras.mjs): --<colour> (a ramp's --<name>-<step>), --radius-<name>,
 * --shadow-<name> per mode, --border-<name>-width and --type-<name>-*. `font` as textStyleVars takes it.
 */
export function extraVars(list, format, font) {
  const convert = format === 'hsl' ? hexToHslTriplet : hexToOklch;
  const light = {};
  const dark = {};
  for (const c of list.color) {
    light[`--${c.name}`] = convert(c.light);
    dark[`--${c.name}`] = convert(c.dark);
  }
  for (const r of list.radius) light[`--radius-${r.name}`] = rem(r.px);
  for (const s of list.shadow) {
    light[`--shadow-${s.name}`] = shadowCss(s.light);
    dark[`--shadow-${s.name}`] = shadowCss(s.dark);
  }
  for (const b of list.border) light[`--border-${b.name}-width`] = `${b.width}px`;
  Object.assign(light, textStyleVars(extraTextStyles(list), format, font));
  return { light, dark };
}

/** { light: { '--primary': '…', '--radius': '0.625rem' }, dark: { … } } (a system's extras too) */
export function themeVars(theme, format) {
  const convert = format === 'hsl' ? hexToHslTriplet : hexToOklch;
  const mode = (m) => {
    const vars = Object.fromEntries(Object.entries(theme.resolved[m]).map(([name, hex]) => [`--${name}`, convert(hex)]));
    if (m === 'light') {
      vars['--radius'] = rem(theme.radius);
      vars['--radius-control'] = rem(theme.radiusControl);
      vars['--border-width'] = `${theme.borderWidth}px`;
      vars['--icon-stroke'] = String(theme.stroke);
      vars['--density'] = String(theme.density.scale);
      for (const size of ['sm', 'md', 'lg', 'x']) vars[`--control-${size}`] = `${theme.density[size]}px`;
      Object.assign(vars, typeVars(theme.type), textStyleVars(themeTextStyles(theme), format));
    }
    Object.assign(vars, styleVars(theme, format)[m]);
    if (theme.components) Object.assign(vars, componentVars(theme.components, format, convert)[m]);
    for (const [level, value] of Object.entries(theme.semantic.shadow)) vars[`--shadow-${level}`] = shadowCss(value[m]);
    if (theme.extra) Object.assign(vars, extraVars(extraList(theme.extra), format)[m]);
    return vars;
  };
  return { light: mode('light'), dark: mode('dark') };
}

/** { light: { primary: '#…', primaryForeground: '#…' }, dark: { … } } — the shape of the kit's THEME. */
export function themeHex(theme) {
  const mode = (m) => Object.fromEntries(Object.entries(theme.resolved[m]).map(([name, hex]) => [camel(name), hex]));
  return { light: mode('light'), dark: mode('dark') };
}

/** A stylesheet that applies the theme: `:root { … } <dark> { … }`. */
export function themeCss(theme, { format = 'oklch', light = ':root', dark = '.dark' } = {}) {
  const vars = themeVars(theme, format);
  const block = (selector, map) => `${selector} {\n${Object.entries(map).map(([k, v]) => `  ${k}: ${v};`).join('\n')}\n}`;
  return `${block(light, vars.light)}\n${block(dark, vars.dark)}\n`;
}
