/**
 * Commit a theme into a tokens.json object. Only the paths a theme owns are written; everything else
 * (status ramps, spacing, type sizes, motion, descriptions) is left exactly as it was. The recipe is
 * recorded under `$extensions["com.halftonedesignsystem.theme"]`, so the docs picker and `halftone-tokens theme show`
 * can tell which theme is applied, and whether anyone has hand-edited it since (drift).
 *
 * A system document (lib/system) is applied the same way (applySystem): the record keeps the document too,
 * without its brand images. A system owns more than a recipe: edited text styles (semantic.type.<style>),
 * corner overrides (semantic.radius.<step>), a border style, status ramps from its own seeds, and its extras
 * (the `extra` group), and component edits (semantic.component.<name>, which every theme writes). What the previous theme owned and the new one doesn't is removed, and a status ramp it
 * had replaced goes back to the curated one (red, green, amber, sky).
 */
import { generateSystem, systemCode } from '../system/generate.mjs';
import { normalizeSystem, withoutBrandImages } from '../system/schema.mjs';
import { generateTheme } from './generate.mjs';
import { BRAND_RAMPS } from './palettes.mjs';
import { normalizeRecipe } from './recipe.mjs';
import { flatten } from './refs.mjs';

export const THEME_EXTENSION = 'com.halftonedesignsystem.theme';

const clone = (value) => JSON.parse(JSON.stringify(value));

/** The status ramps the kits ship, which a system's own status seed replaces until it is removed. */
const STATUS_RAMPS = { danger: BRAND_RAMPS.red, success: BRAND_RAMPS.green, warning: BRAND_RAMPS.amber, info: BRAND_RAMPS.sky };

/** A DTCG group as { 'prefix.path': $value }. */
const flatValues = (group, prefix) => Object.fromEntries(flatten(group).map((t) => [[prefix, ...t.path].join('.'), t.$value]));

/** The values a theme owns, as { 'path.to.token': $value }. */
function ownedValues(theme) {
  const out = {};
  for (const [group, ramp] of Object.entries(theme.primitives)) {
    for (const [step, hex] of Object.entries(ramp)) out[`primitive.color.${group}.${step}`] = hex;
  }
  for (const [name, value] of Object.entries(theme.semantic.color)) out[`semantic.color.${name}`] = value;
  // base and control, and a system's corners (sm…2xl).
  for (const [key, value] of Object.entries(theme.semantic.radius)) out[`semantic.radius.${key}`] = value;
  // width, and a system's style.
  for (const [key, value] of Object.entries(theme.semantic.border)) out[`semantic.border.${key}`] = value;
  out['semantic.icon.stroke'] = theme.semantic.icon.stroke;
  for (const [level, value] of Object.entries(theme.semantic.shadow)) out[`semantic.shadow.${level}`] = value;
  out['semantic.density.scale'] = theme.semantic.density.scale;
  for (const [size, value] of Object.entries(theme.semantic.density.control)) out[`semantic.density.control.${size}`] = value;
  out['primitive.font.family.heading'] = theme.fonts.heading;
  out['primitive.font.family.body'] = theme.fonts.body;
  out['primitive.font.family.mono'] = theme.fonts.mono;
  for (const [key, value] of Object.entries(theme.semantic.type)) {
    // The typeset's numbers, and a system's text styles ({ size, leading, weight, tracking, font }).
    if (value && typeof value === 'object') for (const [k, v] of Object.entries(value)) out[`semantic.type.${key}.${k}`] = v;
    else out[`semantic.type.${key}`] = value;
  }
  // The component layer (Button, Chip, Badge, Input): leaves are numbers, references, or { light, dark }.
  const walk = (node, path) => {
    for (const [key, value] of Object.entries(node)) {
      if (value && typeof value === 'object' && !('light' in value && 'dark' in value)) walk(value, `${path}.${key}`);
      else out[`${path}.${key}`] = value;
    }
  };
  walk(theme.semantic.component, 'semantic.component');
  if (theme.extra) Object.assign(out, flatValues(theme.extra, 'extra'));
  return out;
}

/** The `$type` of each token an `extra` group holds, by path. */
const extraTypes = (theme) => Object.fromEntries(flatten(theme.extra ?? {}).map((t) => [['extra', ...t.path].join('.'), t.$type]));

const TYPES = { radius: 'number', border: 'number', icon: 'number', density: 'number', type: 'number', button: 'number', field: 'number', shadow: 'shadow', font: 'fontFamily', color: 'color' };
const DESCRIPTIONS = {
  'semantic.radius.control': 'Corner radius of mobile buttons and chips: rounded-control. 9999 = pills; otherwise the base radius.',
  'semantic.border.width': 'Width of `border` (px). border-2 and border-hairline stay explicit.',
  'semantic.icon.stroke': "Lucide stroke width; an icon's own strokeWidth is relative to 2.",
  'semantic.shadow.1': 'shadow-xs / shadow-sm / shadow: controls and cards.',
  'semantic.shadow.2': 'shadow-md: raised cards and popovers.',
  'semantic.shadow.3': 'shadow-lg / shadow-xl: menus, dialogs, floating buttons.',
  'semantic.density.scale': "Web: multiplies the spacing scale (Tailwind 4 --spacing). Mobile: see density.control.",
  'semantic.density.control.sm': 'Mobile: small control height (h-control-sm), px.',
  'semantic.density.control.md': 'Mobile: control height (h-control): buttons, inputs, selects, px.',
  'semantic.density.control.lg': 'Mobile: large control height (h-control-lg), px.',
  'semantic.density.control.x': 'Mobile: control horizontal padding (px-control-x), px.',
  'primitive.font.family.heading': 'Headings (Text h1–h4, titles). Empty = the platform system font.',
  'primitive.font.family.body': 'Everything else. Empty = the platform system font.',
  'primitive.font.family.mono': 'Code and figures (font-mono). Menlo = the platform monospace font.',
  'semantic.type.size': 'Typeset: body text size (px). Every text size (text-xs…4xl) scales by size / 16.',
  'semantic.type.leading': "Typeset: line height of running text (× size); the text sizes' line heights scale by leading / 1.75.",
  'semantic.type.flow': 'Typeset: space between blocks of long-form text (Prose), em.',
  'semantic.type.measure': 'Typeset: the longest line of long-form text (Prose), characters.',
  'semantic.color.button': 'The primary button: bg-button (its alpha is component.button.alpha). Follows the theme\'s button style.',
  'semantic.color.button-foreground': 'Text and icons on the primary button: text-button-foreground.',
  'semantic.color.button-edge': 'The primary button\'s border and bottom edge: border-button-edge.',
  'semantic.color.field': 'Text fields: bg-field (its alpha is component.input.alpha). Follows the theme\'s field style.',
  'semantic.color.field-edge': 'Text fields\' border or bottom line: border-field-edge.',
};

function typeOf(path) {
  const parts = path.split('.');
  if (parts[0] === 'semantic' && parts[1] === 'type' && parts.length === 4) return { font: 'fontFamily', weight: 'fontWeight' }[parts[3]] ?? 'number';
  if (path === 'semantic.border.style') return 'strokeStyle';
  if (parts[1] === 'component') return COLOR_SLOTS.has(parts.at(-1)) ? 'color' : { font: 'fontFamily', weight: 'fontWeight' }[parts.at(-1)] ?? 'number';
  return TYPES[parts[1]] ?? 'color';
}

const COLOR_SLOTS = new Set(['fill', 'label', 'border', 'pressed', 'ring', 'focus-border', 'placeholder']);
/** What a component token is, for its $description (semantic.component.<name>.…). */
const COMPONENT_DESCRIPTION = {
  radius: 'corner radius (px; 9999 = a pill)',
  'radius-bottom': 'bottom corner radius (px)',
  'height.sm': 'small height (px; phones raise a touch target under 44 to 44)',
  'height.md': 'height (px; phones raise a touch target under 44 to 44)',
  'height.lg': 'large height (px)',
  'x.sm': 'small horizontal padding (px)',
  'x.md': 'horizontal padding (px)',
  'x.lg': 'large horizontal padding (px)',
  'text.size': 'text size (px), from its text style',
  'text.leading': 'line height (px), fitted to the control',
  'text.tracking': 'letter spacing (em)',
  'text.font': "the text style's font",
  'text.weight': "the label's font weight",
  'text.uppercase': '1 = uppercase labels',
  'gap.sm': 'small gap between an icon and the label (px)',
  'gap.md': 'gap between an icon and the label (px)',
  'gap.lg': 'large gap between an icon and the label (px)',
  icon: 'icon size (px)',
  shadow: 'shadow level (0 = none)',
  'ring-width': 'focus ring width (px)',
  'focus-border': 'border colour when focused (the focus ring role)',
  placeholder: 'placeholder text colour (a role)',
  fill: 'fill colour (a role)',
  'fill-alpha': 'fill opacity',
  label: 'label colour (a role)',
  border: 'border colour (a role)',
  'border-alpha': 'border opacity',
  'border-width': 'border width (px)',
  'edge-width': 'bottom edge width (px)',
  pressed: 'pressed and hover fill (derived from the fill unless set)',
  'pressed-alpha': 'pressed and hover opacity',
  ring: 'focus ring colour (a role or the border, faded)',
  'ring-alpha': 'focus ring opacity',
  alpha: "the style's fill opacity",
  round: '1 = rounded top corners, 0 = square',
  'round-bottom': '1 = rounded bottom corners, 0 = square',
  inset: '1 = inner padding, 0 = flush',
};

const TEXT_DESCRIPTION = {
  size: 'size (px)',
  leading: 'line height (× size)',
  weight: 'font weight',
  tracking: 'letter spacing (em)',
  font: 'font family (a role: heading, body or mono)',
};
function describe(path) {
  if (DESCRIPTIONS[path]) return DESCRIPTIONS[path];
  const parts = path.split('.');
  if (parts[1] === 'type' && parts.length === 4) return `Text ${parts[2]}: ${TEXT_DESCRIPTION[parts[3]] ?? parts[3]}. Edited in the system.`;
  if (parts[1] === 'radius' && parts.length === 3) return `rounded-${parts[2]} (px), edited in the system; otherwise a multiple of the base radius.`;
  if (path === 'semantic.border.style') return 'Border style: solid, dashed or dotted.';
  if (parts[1] === 'component') {
    const [name, ...rest] = parts.slice(2);
    const key = rest.join('.');
    const label = { button: 'Button', chip: 'Chip', badge: 'Badge', input: 'Input' }[name] ?? name;
    if (COMPONENT_DESCRIPTION[key]) return `${label}: ${COMPONENT_DESCRIPTION[key]}.`;
    if (rest.length === 2 && COMPONENT_DESCRIPTION[rest[1]]) return `${label} ${rest[0]}: ${COMPONENT_DESCRIPTION[rest[1]]}.`;
  }
  return undefined;
}

function setPath(root, path, $value, $type = typeOf(path)) {
  let node = root;
  const keys = path.split('.');
  for (const key of keys.slice(0, -1)) node = node[key] ??= {};
  const leaf = keys.at(-1);
  if (node[leaf] && typeof node[leaf] === 'object' && '$value' in node[leaf]) node[leaf].$value = $value;
  else {
    const $description = describe(path);
    node[leaf] = { $type, ...($description ? { $description } : {}), $value };
  }
}

/** Remove a token, and any group it leaves empty. */
function deletePath(root, path) {
  const keys = path.split('.');
  const chain = [root];
  for (const key of keys.slice(0, -1)) {
    const next = chain.at(-1)[key];
    if (!next || typeof next !== 'object') return;
    chain.push(next);
  }
  delete chain.at(-1)[keys.at(-1)];
  for (let i = chain.length - 1; i > 0; i--) {
    if (Object.keys(chain[i]).some((k) => !k.startsWith('$'))) break;
    delete chain[i - 1][keys[i - 1]];
  }
}

/** The theme a tokens.json's record describes, generated on that file (null when there is none). */
function recordedTheme(tokens) {
  const record = tokens.$extensions?.[THEME_EXTENSION];
  if (record?.system) return generateSystem(record.system, tokens);
  if (record?.recipe) return generateTheme(record.recipe, tokens);
  return null;
}

/** What the recorded theme owns, or nothing when this version can't read the record (a newer one wrote it). */
function previouslyOwned(tokens) {
  try {
    const previous = recordedTheme(tokens);
    return previous ? ownedValues(previous) : {};
  } catch {
    return {};
  }
}

/**
 * The file a new theme is generated on: the status ramps the recorded system replaced go back to the curated
 * ones first, so a new system builds on those (a seed regenerates its ramp anyway), and the new theme's colours
 * are fixed against the ramps it will ship with.
 */
function prepare(tokens) {
  const out = clone(tokens);
  for (const path of Object.keys(previouslyOwned(tokens))) {
    const [, , ramp, step] = path.split('.');
    if (path.startsWith('primitive.color.') && STATUS_RAMPS[ramp]?.[step]) setPath(out, path, STATUS_RAMPS[ramp][step]);
  }
  return out;
}

/** Write a theme's values, drop what the previous theme owned and this one doesn't, and record it. */
function commit(tokens, theme, record) {
  const out = clone(tokens);
  const owned = ownedValues(theme);
  // Status ramps went back in prepare(); everything else the new theme doesn't own goes.
  for (const path of Object.keys(previouslyOwned(tokens))) if (!(path in owned) && !path.startsWith('primitive.color.')) deletePath(out, path);
  const types = extraTypes(theme);
  for (const [path, value] of Object.entries(owned)) setPath(out, path, value, types[path]);
  const { $extensions = {}, ...rest } = out;
  if (theme.adjustments.length) record.adjustments = theme.adjustments;
  if (theme.warnings?.length) record.warnings = theme.warnings;
  return { ...rest, $extensions: { ...$extensions, [THEME_EXTENSION]: record } };
}

/** → { tokens, theme }. `tokens` is a new object; the input is not touched. */
export function applyRecipe(tokens, recipe) {
  const base = prepare(tokens);
  const theme = generateTheme(recipe, base);
  const record = { version: theme.recipe.v, code: theme.code, recipe: theme.recipe };
  return { tokens: commit(base, theme, record), theme };
}

/**
 * A system document into tokens.json → { tokens, theme, system }. The record keeps the document without its
 * brand images, and the code only when the system has no overrides (a code can't carry them).
 */
export function applySystem(tokens, input) {
  const system = normalizeSystem(input);
  const base = prepare(tokens);
  const theme = generateSystem(system, base);
  const code = systemCode(system);
  const record = { version: theme.recipe.v, ...(code ? { code } : {}), recipe: theme.recipe, system: withoutBrandImages(system) };
  return { tokens: commit(base, theme, record), theme, system };
}

/**
 * What theme a tokens.json carries:
 *   { applied: false }                               no theme recorded
 *   { applied: true, code, recipe, drift: [paths] }  drift = owned paths edited since the theme was applied
 *   … system                                         when a system document was applied; code is null when
 *                                                    the system has overrides (no code reproduces it)
 */
export function themeStatus(tokens) {
  const record = tokens.$extensions?.[THEME_EXTENSION];
  if (!record?.recipe) return { applied: false };
  const expected = ownedValues(recordedTheme(tokens));
  const actual = Object.fromEntries(flatten(tokens).map((t) => [t.path.join('.'), t.$value]));
  // A path the file doesn't have yet (a newer halftone-tokens owns more) is not an edit; apply adds it.
  const drift = Object.entries(expected)
    .filter(([path, value]) => path in actual && JSON.stringify(actual[path]) !== JSON.stringify(value))
    .map(([path]) => path);
  // Normalised: a recipe recorded by an older halftone-tokens gets the axes it didn't have (the typeset).
  if (record.system) {
    const system = normalizeSystem(record.system);
    return { applied: true, code: systemCode(system), recipe: system.recipe, system, drift };
  }
  return { applied: true, code: record.code, recipe: normalizeRecipe(record.recipe), drift };
}
