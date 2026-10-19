/**
 * Halftone ⇄ shadcn. Pure ESM, no Node APIs: the docs site's studio runs it in the browser.
 *
 *   isShadcnPresetCode(s)        a shadcn/ui preset code (ui.shadcn.com/create): "b5owWMfJ8l"
 *   decodeShadcnPreset(code)     → { version, style, baseColor, theme, chartColor, iconLibrary, font,
 *                                    fontHeading, radius, menuAccent, menuColor } | null
 *   encodeShadcnPreset(preset)   the reverse (tests, round trips)
 *   recipeFromShadcn(preset)     → { recipe, notes }: the nearest Halftone recipe, and one plain line per
 *                                  value it approximated or dropped (Halftone has no match for it)
 *   shadcnTheme(theme, options)  a shadcn `registry:theme` item for a generated theme: colours (oklch, light
 *                                  and dark), radius, shadows, and its fonts as registryDependencies
 *   shadcnFont(id, role)         the `registry:font` item those dependencies point at
 *
 * A Halftone theme carries more than a shadcn preset (density, depth, border, icon stroke, typeset, both kits),
 * so codes go one way: a shadcn code becomes a Halftone recipe, never the reverse. The other way is the
 * registry item, which any shadcn project installs with `npx shadcn add`.
 *
 * The preset codec below is ported from shadcn/ui, packages/registry/src/preset/preset.ts (@shadcn/registry
 * 0.2.0, shadcn 4.22). Its value lists are append-only there; keep them in step.
 *
 *   MIT License
 *
 *   Copyright (c) 2023 shadcn
 *
 *   Permission is hereby granted, free of charge, to any person obtaining a copy of this software and
 *   associated documentation files (the "Software"), to deal in the Software without restriction, including
 *   without limitation the rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
 *   copies of the Software, and to permit persons to whom the Software is furnished to do so, subject to the
 *   following conditions:
 *
 *   The above copyright notice and this permission notice shall be included in all copies or substantial
 *   portions of the Software.
 *
 *   THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT
 *   LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO
 *   EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER
 *   IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE
 *   USE OR OTHER DEALINGS IN THE SOFTWARE.
 */
import { fontById } from './fonts.mjs';
import { BRAND_RAMPS, NEUTRAL_RAMPS } from './palettes.mjs';
import { normalizeRecipe } from './recipe.mjs';
import { themeVars } from './vars.mjs';

// ---- the preset codec (ported) --------------------------------------------------------------------------

const MENU_COLORS = ['default', 'inverted', 'default-translucent', 'inverted-translucent'];
const MENU_ACCENTS = ['subtle', 'bold'];
const RADII = ['default', 'none', 'small', 'medium', 'large'];
const FONTS = [
  'inter', 'noto-sans', 'nunito-sans', 'figtree', 'roboto', 'raleway', 'dm-sans', 'public-sans', 'outfit', 'jetbrains-mono',
  'geist', 'geist-mono', 'lora', 'merriweather', 'playfair-display', 'noto-serif', 'roboto-slab', 'oxanium', 'manrope',
  'space-grotesk', 'montserrat', 'ibm-plex-sans', 'source-sans-3', 'instrument-sans', 'eb-garamond', 'instrument-serif',
];
const ICON_LIBRARIES = ['lucide', 'hugeicons', 'tabler', 'phosphor', 'remixicon'];
const THEMES = [
  'neutral', 'stone', 'zinc', 'gray', 'amber', 'blue', 'cyan', 'emerald', 'fuchsia', 'green', 'indigo', 'lime', 'orange',
  'pink', 'purple', 'red', 'rose', 'sky', 'teal', 'violet', 'yellow', 'mauve', 'olive', 'mist', 'taupe',
];
const BASE_COLORS = ['neutral', 'stone', 'zinc', 'gray', 'mauve', 'olive', 'mist', 'taupe'];
const STYLES = ['nova', 'vega', 'maia', 'lyra', 'mira', 'luma', 'sera', 'rhea'];
const FONT_HEADINGS = ['inherit', ...FONTS];

const FIELDS_V1 = [
  { key: 'menuColor', values: MENU_COLORS, bits: 3 },
  { key: 'menuAccent', values: MENU_ACCENTS, bits: 3 },
  { key: 'radius', values: RADII, bits: 4 },
  { key: 'font', values: FONTS, bits: 6 },
  { key: 'iconLibrary', values: ICON_LIBRARIES, bits: 6 },
  { key: 'theme', values: THEMES, bits: 6 },
  { key: 'baseColor', values: BASE_COLORS, bits: 6 },
  { key: 'style', values: STYLES, bits: 6 },
];
const FIELDS_V2 = [...FIELDS_V1, { key: 'chartColor', values: THEMES, bits: 6 }, { key: 'fontHeading', values: FONT_HEADINGS, bits: 5 }];
/** v1 codes carry no chart colour; ui.shadcn.com picks one per theme (apps/v4 preset-query.ts). */
const V1_CHART_COLOR = { neutral: 'blue', stone: 'lime', zinc: 'amber', mauve: 'emerald', olive: 'violet', mist: 'rose', taupe: 'cyan' };

const BASE62 = '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz';
const fromBase62 = (text) => {
  let n = 0;
  for (const ch of text) {
    const i = BASE62.indexOf(ch);
    if (i === -1) return -1;
    n = n * 62 + i;
  }
  return n;
};
const toBase62 = (n) => {
  if (n === 0) return '0';
  let s = '';
  while (n > 0) {
    s = BASE62[n % 62] + s;
    n = Math.floor(n / 62);
  }
  return s;
};

export const isShadcnPresetCode = (s) => typeof s === 'string' && /^[ab][0-9A-Za-z]{1,9}$/.test(s);

export function decodeShadcnPreset(code) {
  if (!isShadcnPresetCode(code)) return null;
  const version = code[0];
  const fields = version === 'a' ? FIELDS_V1 : FIELDS_V2;
  const bits = fromBase62(code.slice(1));
  if (bits < 0) return null;
  const preset = { version };
  let offset = 0;
  for (const field of fields) {
    const i = Math.floor(bits / 2 ** offset) % 2 ** field.bits;
    preset[field.key] = i < field.values.length ? field.values[i] : field.values[0];
    offset += field.bits;
  }
  if (version === 'a') {
    preset.fontHeading = 'inherit';
    preset.chartColor = V1_CHART_COLOR[preset.theme] ?? preset.theme;
  }
  return preset;
}

export function encodeShadcnPreset(preset) {
  let bits = 0;
  let offset = 0;
  for (const field of FIELDS_V2) {
    const i = field.values.indexOf(preset[field.key] ?? field.values[0]);
    bits += (i === -1 ? 0 : i) * 2 ** offset;
    offset += field.bits;
  }
  return `b${toBase62(bits)}`;
}

// ---- shadcn → Halftone ----------------------------------------------------------------------------------

/** shadcn's extra greys → the nearest Halftone neutral. */
const NEAREST_NEUTRAL = { mauve: 'zinc', olive: 'stone', mist: 'slate', taupe: 'stone' };
const RADIUS = { default: 'lg', medium: 'lg', none: 'none', small: 'sm', large: 'xl' };
const RADIUS_REM = { small: '0.45rem', large: '0.875rem' };
/** shadcn's fonts → Halftone's (the same family, or the nearest of the same kind). */
const FONT = {
  inter: 'inter', 'dm-sans': 'dm-sans', outfit: 'outfit', 'jetbrains-mono': 'jetbrains-mono', geist: 'geist', 'geist-mono': 'geist-mono',
  lora: 'lora', 'playfair-display': 'playfair-display', manrope: 'manrope', 'space-grotesk': 'space-grotesk', 'ibm-plex-sans': 'ibm-plex-sans',
  'noto-sans': 'inter', 'nunito-sans': 'nunito', figtree: 'plus-jakarta-sans', roboto: 'inter', raleway: 'outfit', 'public-sans': 'inter',
  montserrat: 'outfit', 'source-sans-3': 'inter', 'instrument-sans': 'inter', oxanium: 'space-grotesk',
  merriweather: 'source-serif-4', 'noto-serif': 'source-serif-4', 'roboto-slab': 'source-serif-4', 'eb-garamond': 'fraunces',
  'instrument-serif': 'playfair-display',
};
const title = (id) => id.split('-').map((w) => (/^(dm|ibm|eb)$/.test(w) ? w.toUpperCase() : w[0].toUpperCase() + w.slice(1))).join(' ');

/** The nearest Halftone recipe for a decoded shadcn preset, with a note for everything it couldn't carry. */
export function recipeFromShadcn(preset) {
  const notes = [];
  const base = preset.baseColor;
  const neutral = NEAREST_NEUTRAL[base] ?? base;
  if (NEAREST_NEUTRAL[base]) notes.push(`Base colour ${base}: Halftone has no ${base} grey, so it uses ${neutral}, the nearest.`);

  let brand;
  if (BRAND_RAMPS[preset.theme]) brand = BRAND_RAMPS[preset.theme]['600'];
  else {
    // A monochrome theme (the theme is a grey): the brand is that grey's 900, as in Halftone's Mono preset.
    const grey = NEAREST_NEUTRAL[preset.theme] ?? preset.theme;
    brand = NEUTRAL_RAMPS[grey]['900'];
    if (NEAREST_NEUTRAL[preset.theme] && preset.theme !== base) notes.push(`Theme ${preset.theme}: a monochrome brand in ${grey}, the nearest grey.`);
  }

  const radius = RADIUS[preset.radius] ?? 'lg';
  if (RADIUS_REM[preset.radius]) notes.push(`Radius ${preset.radius} (${RADIUS_REM[preset.radius]}): Halftone's nearest step is ${radius}.`);

  const font = (id, role) => {
    const mapped = FONT[id] ?? 'inter';
    if (mapped !== id) notes.push(`${role} font ${title(id)}: not in Halftone's list, so it uses ${fontById(mapped).family}.`);
    return mapped;
  };
  const body = font(preset.font, 'Body');
  const heading = preset.fontHeading && preset.fontHeading !== 'inherit' ? font(preset.fontHeading, 'Heading') : body;
  // shadcn has no separate mono role; a mono body or heading font takes it too.
  const mono = [body, heading].find((id) => fontById(id).category === 'mono') ?? 'system-mono';

  if (preset.iconLibrary && preset.iconLibrary !== 'lucide') notes.push(`Icons ${title(preset.iconLibrary)}: Halftone's kits use Lucide.`);
  if (preset.chartColor && preset.chartColor !== preset.theme) notes.push(`Chart colour ${preset.chartColor}: Halftone's charts follow the brand.`);
  if (preset.menuAccent === 'bold') notes.push("Bold menu accents aren't a Halftone option: accents stay neutral.");
  if (preset.menuColor && preset.menuColor !== 'default') notes.push(`Menu colour ${preset.menuColor} isn't a Halftone option.`);
  if (preset.style && preset.style !== 'nova') {
    notes.push(`Style ${title(preset.style)}: Halftone's own density, depth and border apply. Start from a Halftone preset to change them.`);
  }

  const recipe = normalizeRecipe({ brand, neutral, radius, font: { heading, body, mono } });
  return { recipe, notes };
}

// ---- Halftone → shadcn ----------------------------------------------------------------------------------

export const SHADCN_FONTS_URL = 'https://halftonedesignsystem.com/r';

/** Tailwind's rounded-* steps as multiples of --radius (the kits' primitive radius steps over lg). */
const RADIUS_STEPS = { sm: 0.6, md: 0.8, lg: 1, xl: 1.6, '2xl': 2 };
const SHADOW_STEPS = { '2xs': 1, xs: 1, sm: 1, md: 2, lg: 3, xl: 3, '2xl': 3 };
const FONT_VARIABLE = { body: '--font-sans', heading: '--font-heading', mono: '--font-mono' };
const FALLBACK = { sans: 'sans-serif', display: 'sans-serif', serif: 'serif', mono: 'monospace' };

/** The registry item path (under the fonts URL) for a font in a role. */
const fontPath = (id, role) => `font/${role === 'body' ? '' : `${role}-`}${id}.json`;

/** A shadcn `registry:font` item for one of Halftone's Google fonts, in a role (body, heading or mono). */
export function shadcnFont(id, role = 'body') {
  const f = fontById(id);
  if (!f || f.system) return null;
  const variable = f.fontsource !== 'static';
  return {
    $schema: 'https://ui.shadcn.com/schema/registry-item.json',
    name: role === 'body' ? `font-${id}` : `font-${role}-${id}`,
    title: f.family,
    type: 'registry:font',
    font: {
      family: `'${f.family}${variable ? ' Variable' : ''}', ${FALLBACK[f.category] ?? 'sans-serif'}`,
      provider: 'google',
      import: f.family.replace(/ /g, '_'),
      variable: FONT_VARIABLE[role],
      subsets: ['latin'],
      ...(variable ? {} : { weight: f.weights.map(String) }),
      dependency: `@fontsource${variable ? '-variable' : ''}/${id}`,
    },
  };
}

/**
 * A shadcn `registry:theme` item for a generated theme. `npx shadcn add` writes the colours into :root and
 * .dark, the radius and shadow steps into @theme, and installs the fonts it depends on (fontsUrl/font/*.json,
 * hosted by the docs site). Web only: phone apps take the theme code.
 */
export function shadcnTheme(theme, { name, title: label, description, fontsUrl = SHADCN_FONTS_URL } = {}) {
  const vars = themeVars(theme, 'oklch');
  const colours = Object.keys(theme.resolved.light);
  const mode = (m) => ({
    ...(m === 'light' ? { radius: vars.light['--radius'] } : {}),
    ...Object.fromEntries(colours.map((c) => [c, vars[m][`--${c}`]])),
    ...Object.fromEntries(['1', '2', '3'].map((level) => [`shadow-${level}`, vars[m][`--shadow-${level}`]])),
  });
  const roles = { body: theme.recipe.font.body, heading: theme.recipe.font.heading, mono: theme.recipe.font.mono };
  const dependencies = Object.entries(roles)
    .filter(([, id]) => !fontById(id)?.system)
    .map(([role, id]) => `${fontsUrl.replace(/\/$/, '')}/${fontPath(id, role)}`);
  return {
    $schema: 'https://ui.shadcn.com/schema/registry-item.json',
    name: name ?? `halftone-${theme.code}`,
    title: label ?? `Halftone theme ${theme.code}`,
    description: description ?? `A Halftone theme (${theme.code}): colours for light and dark, radius, shadows and fonts. halftonedesignsystem.com/themes/?t=${theme.code}`,
    type: 'registry:theme',
    ...(dependencies.length ? { registryDependencies: dependencies } : {}),
    cssVars: {
      theme: {
        ...Object.fromEntries(Object.entries(RADIUS_STEPS).map(([step, k]) => [`radius-${step}`, k === 1 ? 'var(--radius)' : `calc(var(--radius) * ${k})`])),
        ...Object.fromEntries(Object.entries(SHADOW_STEPS).map(([step, level]) => [`shadow-${step}`, `var(--shadow-${level})`])),
      },
      light: mode('light'),
      dark: mode('dark'),
    },
  };
}

/** Where the docs site hosts a font item, for build scripts: `font/<id>.json`, `font/heading-<id>.json`, … */
export const shadcnFontPath = fontPath;
