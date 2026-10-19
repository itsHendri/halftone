/**
 * A theme RECIPE: the handful of choices a theme is made from. The generator (index.mjs) expands it
 * into primitives, semantic tokens and CSS variables; the codec (codec.mjs) packs it into a short code.
 *
 * Every option list is APPEND-ONLY: codes store an option's index. Add new options at the end.
 *
 * The typeset (font.mono, size, leading, flow, measure) came later. A recipe without it gets the defaults,
 * which are what the kits always had, and a theme with the default typeset still encodes as a ht1 code.
 * So did the styles (button, field): their defaults are the kits' original look, and a theme that keeps them
 * encodes as ht1 or ht2 as before.
 */
import { FONTS } from './fonts.mjs';

export const RECIPE_VERSION = 1;

export const OPTIONS = {
  /** The neutral ramp: four curated greys plus one tinted with the brand hue. */
  neutral: ['zinc', 'neutral', 'slate', 'stone', 'gray', 'brand'],
  /** Base corner radius (px). Tailwind's rounded-sm…2xl are offsets from it. */
  radius: ['none', 'sm', 'md', 'lg', 'xl', '2xl'],
  /** Controls (buttons, inputs, chips) follow the radius, or are pills. */
  controls: ['pill', 'match'],
  /** Lucide stroke width. */
  stroke: ['regular', 'thin', 'bold'],
  /** Elevation of cards, sheets and menus. */
  depth: ['soft', 'flat', 'raised', 'hard'],
  /** Control heights and padding. */
  density: ['comfortable', 'compact', 'spacious'],
  /** Border width of cards, inputs and outlines. */
  border: ['regular', 'hairline', 'heavy'],
  /** Typeset: the body text size (px). Every text size scales with it (text-xs…4xl). */
  size: ['16', '14', '15', '18'],
  /** Typeset: line height of running text; the text sizes' own line heights scale with it. */
  leading: ['normal', 'tight', 'relaxed'],
  /** Typeset: the space between blocks of long-form text (Prose). */
  flow: ['normal', 'tight', 'loose'],
  /** Typeset: the longest line of long-form text (Prose), in characters. */
  measure: ['70', '60', '80', '90'],
  /** Style: the primary button. Solid fill, a brand tint, a brand outline, or solid with a darker bottom edge. */
  button: ['solid', 'soft', 'outline', 'raised'],
  /** Style: text fields (inputs, text areas, select triggers). A box, a tinted field with a line, or a line. */
  field: ['outline', 'filled', 'underline'],
};

/** The recipe keys that make up the typeset, besides font.mono. */
export const TYPESET_KEYS = ['size', 'leading', 'flow', 'measure'];
/** The recipe keys that are component styles (ht3 codes). */
export const STYLE_KEYS = ['button', 'field'];

/** Base radius per option: a primitive radius step (a reference) or 0. */
export const RADIUS = { none: 0, sm: 'sm', md: 'md', lg: 'lg', xl: 'xl', '2xl': '2xl' };
export const STROKE = { thin: 1.5, regular: 2, bold: 2.5 };
/** px; hairline renders as one device pixel on a 2x screen. */
export const BORDER = { hairline: 0.5, regular: 1, heavy: 2 };
/**
 * Button styles as numbers (px), on top of the colours in semantic.mjs (styleColors). `alpha` is the fill's
 * opacity: an outline button has no fill. `border` is every side, `edge` the bottom (raised: a thicker,
 * darker bottom edge).
 */
export const BUTTON = {
  solid: { alpha: 1, border: 0, edge: 0 },
  soft: { alpha: 1, border: 0, edge: 0 },
  outline: { alpha: 0, border: 2, edge: 2 },
  raised: { alpha: 1, border: 0, edge: 3 },
};
/**
 * Field styles. `alpha` per mode (outline: transparent, with a faint tint in dark, as the kits always had).
 * `border` / `edge`: 'border' = the theme's border width, 'line' = at least 1px (it's the field's only edge).
 * `round` / `roundBottom`: 1 = the md radius, 0 = square. `inset`: 1 = the usual inner padding, 0 = flush.
 */
export const FIELD = {
  outline: { alpha: { light: 0, dark: 0.3 }, border: 'border', edge: 'border', round: 1, roundBottom: 1, inset: 1 },
  filled: { alpha: { light: 1, dark: 1 }, border: 0, edge: 'line', round: 1, roundBottom: 0, inset: 1 },
  underline: { alpha: { light: 0, dark: 0 }, border: 0, edge: 'line', round: 0, roundBottom: 0, inset: 0 },
};
/** A field width in px for a border width. */
export const fieldWidth = (value, borderWidth) => (value === 'border' ? borderWidth : value === 'line' ? Math.max(1, borderWidth) : value);

/** Line height of running text (× size). 1.75 = leading-7 at 16px, what the kits' paragraphs always had. */
export const LEADING = { tight: 1.6, normal: 1.75, relaxed: 1.9 };
/** Space between blocks of long-form text, in em. */
export const FLOW = { tight: 1, normal: 1.25, loose: 2 };
/**
 * Line height (px) of each text size at 16px: Tailwind's defaults (3 and 4 agree). The typeset scales both;
 * text-5xl and up keep Tailwind's (line height 1).
 */
export const TEXT_LINE_HEIGHT = { xs: 16, sm: 20, base: 24, lg: 28, xl: 28, '2xl': 32, '3xl': 36, '4xl': 40 };

/** The default typeset as tokens (semantic.type), for a token file from before the typeset. */
export const TYPE = { size: 16, leading: LEADING.normal, flow: FLOW.normal, measure: 70 };

/**
 * The typeset as the numbers the targets use: every text size scales by size / 16, every text size's line
 * height by leading / 1.75 (so the default typeset is exactly Tailwind's scale), and long-form text (Prose)
 * gets the leading, flow (em) and measure (ch) as they are.
 */
export const typeScale = ({ size, leading, flow, measure }) => ({
  size,
  scale: Number((size / 16).toFixed(4)),
  leading,
  leadingFactor: Number((leading / 1.75).toFixed(4)),
  flow,
  measure,
});


const s = (x, y, blur, spread, color) => ({ offsetX: x, offsetY: y, blur, spread, color });
/**
 * Three elevation levels per depth (DTCG shadow values, light and dark): 1 for controls and cards,
 * 2 for raised cards and popovers, 3 for menus, dialogs and floating buttons. An empty list is no shadow.
 * Flat keeps a faint level 3 so a menu still separates from the page.
 */
export const DEPTH = {
  flat: {
    1: { light: [], dark: [] },
    2: { light: [], dark: [] },
    3: { light: [s(0, 4, 12, 0, '#0000001a')], dark: [s(0, 4, 12, 0, '#00000066')] },
  },
  soft: {
    1: { light: [s(0, 1, 2, 0, '#0000000d')], dark: [s(0, 1, 2, 0, '#0000004d')] },
    2: { light: [s(0, 4, 12, -2, '#00000014')], dark: [s(0, 4, 12, -2, '#00000066')] },
    3: { light: [s(0, 12, 24, -6, '#0000001f')], dark: [s(0, 12, 24, -6, '#00000080')] },
  },
  raised: {
    1: { light: [s(0, 2, 8, -2, '#0000001f')], dark: [s(0, 2, 8, -2, '#00000066')] },
    2: { light: [s(0, 8, 20, -6, '#0000002e')], dark: [s(0, 8, 20, -6, '#00000080')] },
    3: { light: [s(0, 20, 40, -10, '#00000040')], dark: [s(0, 20, 40, -10, '#00000099')] },
  },
  hard: {
    1: { light: [s(2, 2, 0, 0, '#09090b')], dark: [s(2, 2, 0, 0, '#fafafa')] },
    2: { light: [s(3, 3, 0, 0, '#09090b')], dark: [s(3, 3, 0, 0, '#fafafa')] },
    3: { light: [s(5, 5, 0, 0, '#09090b')], dark: [s(5, 5, 0, 0, '#fafafa')] },
  },
};

/** A DTCG shadow list as CSS. */
export const shadowCss = (list) =>
  list.length ? list.map((x) => `${x.offsetX}px ${x.offsetY}px ${x.blur}px ${x.spread}px ${hexAlphaToRgba(x.color)}`).join(', ') : '0 0 #0000';

function hexAlphaToRgba(hex) {
  const n = parseInt(hex.slice(1, 7), 16);
  const a = hex.length === 9 ? parseInt(hex.slice(7), 16) / 255 : 1;
  return `rgba(${(n >> 16) & 255}, ${(n >> 8) & 255}, ${n & 255}, ${Number(a.toFixed(3))})`;
}

/**
 * Density: control heights (sm / md / lg) and horizontal padding on mobile, and a scale for the web kit's
 * whole spacing scale (Tailwind 4's --spacing, the way Radix Themes' `scaling` works).
 */
export const DENSITY = {
  compact: { sm: 36, md: 44, lg: 52, x: 16, scale: 0.875 },
  comfortable: { sm: 40, md: 48, lg: 56, x: 20, scale: 1 },
  spacious: { sm: 44, md: 52, lg: 60, x: 24, scale: 1.125 },
};

export const DEFAULT_RECIPE = Object.freeze({
  v: RECIPE_VERSION,
  brand: '#2563eb',
  neutral: 'zinc',
  radius: 'lg',
  controls: 'pill',
  font: Object.freeze({ heading: 'system', body: 'system', mono: 'system-mono' }),
  stroke: 'regular',
  depth: 'soft',
  density: 'comfortable',
  border: 'regular',
  size: '16',
  leading: 'normal',
  flow: 'normal',
  measure: '70',
  button: 'solid',
  field: 'outline',
});

const HEX = /^#[0-9a-f]{6}$/;

/** Does the recipe use the default typeset (what every ht1 code means)? */
export const defaultTypeset = (r) => r.font.mono === DEFAULT_RECIPE.font.mono && TYPESET_KEYS.every((k) => r[k] === DEFAULT_RECIPE[k]);

/** Does the recipe keep the default styles (solid buttons, outline fields: every ht1 and ht2 code)? */
export const defaultStyles = (r) => STYLE_KEYS.every((k) => r[k] === DEFAULT_RECIPE[k]);

/** Fill in defaults, normalise, and throw on anything invalid. Returns a new, plain recipe. */
export function normalizeRecipe(input = {}) {
  const r = { ...DEFAULT_RECIPE, ...input, font: { ...DEFAULT_RECIPE.font, ...input.font } };
  r.v = RECIPE_VERSION;
  r.brand = String(r.brand).toLowerCase();
  if (!HEX.test(r.brand)) throw new Error(`Recipe brand must be a 6-digit hex colour, got "${input.brand}"`);
  for (const [key, list] of Object.entries(OPTIONS)) {
    if (typeof r[key] === 'number') r[key] = String(r[key]);
    if (!list.includes(r[key])) throw new Error(`Recipe ${key} must be one of ${list.join(', ')}; got "${r[key]}"`);
  }
  for (const role of ['heading', 'body', 'mono']) {
    const font = FONTS.find((f) => f.id === r.font[role]);
    if (!font) throw new Error(`Unknown ${role} font "${r.font[role]}"`);
    // The system fonts belong to their role: System for heading and body, System mono for mono.
    if (font.system && (font.category === 'mono') !== (role === 'mono')) throw new Error(`"${font.id}" can't be the ${role} font`);
    if (role === 'mono' && font.category !== 'mono') throw new Error(`The mono font must be a mono font; "${font.id}" is ${font.category}`);
  }
  const out = {
    v: r.v,
    brand: r.brand,
    neutral: r.neutral,
    radius: r.radius,
    controls: r.controls,
    font: { heading: r.font.heading, body: r.font.body, mono: r.font.mono },
    stroke: r.stroke,
    depth: r.depth,
    density: r.density,
    border: r.border,
    size: r.size,
    leading: r.leading,
    flow: r.flow,
    measure: r.measure,
    button: r.button,
    field: r.field,
  };
  if (input.preset) out.preset = String(input.preset);
  return out;
}

/** Same theme? (ignores the preset label) */
export function sameRecipe(a, b) {
  const strip = ({ preset, ...rest }) => rest;
  return JSON.stringify(strip(normalizeRecipe(a))) === JSON.stringify(strip(normalizeRecipe(b)));
}
