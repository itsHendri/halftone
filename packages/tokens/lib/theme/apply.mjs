/**
 * Commit a theme into a tokens.json object. Only the paths a theme owns are written; everything else
 * (status ramps, spacing, type sizes, motion, descriptions) is left exactly as it was. The recipe is
 * recorded under `$extensions["com.halftonedesignsystem.theme"]`, so the docs picker and `halftone-tokens theme show`
 * can tell which theme is applied, and whether anyone has hand-edited it since (drift).
 */
import { generateTheme } from './generate.mjs';
import { normalizeRecipe } from './recipe.mjs';
import { flatten } from './refs.mjs';

export const THEME_EXTENSION = 'com.halftonedesignsystem.theme';

const clone = (value) => JSON.parse(JSON.stringify(value));

/** The values a theme owns, as { 'path.to.token': $value }. */
function ownedValues(theme) {
  const out = {};
  for (const [group, ramp] of Object.entries(theme.primitives)) {
    for (const [step, hex] of Object.entries(ramp)) out[`primitive.color.${group}.${step}`] = hex;
  }
  for (const [name, value] of Object.entries(theme.semantic.color)) out[`semantic.color.${name}`] = value;
  out['semantic.radius.base'] = theme.semantic.radius.base;
  out['semantic.radius.control'] = theme.semantic.radius.control;
  out['semantic.border.width'] = theme.semantic.border.width;
  out['semantic.icon.stroke'] = theme.semantic.icon.stroke;
  for (const [level, value] of Object.entries(theme.semantic.shadow)) out[`semantic.shadow.${level}`] = value;
  out['semantic.density.scale'] = theme.semantic.density.scale;
  for (const [size, value] of Object.entries(theme.semantic.density.control)) out[`semantic.density.control.${size}`] = value;
  out['primitive.font.family.heading'] = theme.fonts.heading;
  out['primitive.font.family.body'] = theme.fonts.body;
  out['primitive.font.family.mono'] = theme.fonts.mono;
  for (const [key, value] of Object.entries(theme.semantic.type)) out[`semantic.type.${key}`] = value;
  for (const [key, value] of Object.entries(theme.semantic.button)) out[`semantic.button.${key}`] = value;
  for (const [key, value] of Object.entries(theme.semantic.field)) out[`semantic.field.${key}`] = value;
  return out;
}

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
  'semantic.color.button': 'The primary button: bg-button (its alpha is button.alpha). Follows the theme\'s button style.',
  'semantic.color.button-foreground': 'Text and icons on the primary button: text-button-foreground.',
  'semantic.color.button-edge': 'The primary button\'s border and bottom edge: border-button-edge.',
  'semantic.color.field': 'Text fields: bg-field (its alpha is field.alpha). Follows the theme\'s field style.',
  'semantic.color.field-edge': 'Text fields\' border or bottom line: border-field-edge.',
  'semantic.button.alpha': 'Opacity of the primary button\'s fill (0 = an outline button).',
  'semantic.button.border-width': 'Primary button border, every side (px).',
  'semantic.button.edge-width': 'Primary button bottom edge (px); raised buttons have a thicker, darker one.',
  'semantic.field.alpha': 'Opacity of a text field\'s fill, per mode.',
  'semantic.field.border-width': 'Text field border, top and sides (px).',
  'semantic.field.edge-width': 'Text field bottom border (px).',
  'semantic.field.round': '1 = text fields take the md radius on top, 0 = square.',
  'semantic.field.round-bottom': '1 = text fields take the md radius at the bottom, 0 = square.',
  'semantic.field.inset': '1 = text fields have inner padding, 0 = flush (underline fields).',
};

function typeOf(path) {
  return TYPES[path.split('.')[1]] ?? 'color';
}

function setPath(root, path, $value) {
  let node = root;
  const keys = path.split('.');
  for (const key of keys.slice(0, -1)) node = node[key] ??= {};
  const leaf = keys.at(-1);
  if (node[leaf] && typeof node[leaf] === 'object' && '$value' in node[leaf]) node[leaf].$value = $value;
  else node[leaf] = { $type: typeOf(path), ...(DESCRIPTIONS[path] ? { $description: DESCRIPTIONS[path] } : {}), $value };
}

/** → { tokens, theme }. `tokens` is a new object; the input is not touched. */
export function applyRecipe(tokens, recipe) {
  const theme = generateTheme(recipe, tokens);
  const out = clone(tokens);
  for (const [path, value] of Object.entries(ownedValues(theme))) {
    setPath(out, path, value);
  }
  const { $extensions = {}, ...rest } = out;
  const record = { version: theme.recipe.v, code: theme.code, recipe: theme.recipe };
  if (theme.adjustments.length) record.adjustments = theme.adjustments;
  return { tokens: { ...rest, $extensions: { ...$extensions, [THEME_EXTENSION]: record } }, theme };
}

/**
 * What theme a tokens.json carries:
 *   { applied: false }                               no theme recorded
 *   { applied: true, code, recipe, drift: [paths] }  drift = owned paths edited since the theme was applied
 */
export function themeStatus(tokens) {
  const record = tokens.$extensions?.[THEME_EXTENSION];
  if (!record?.recipe) return { applied: false };
  const expected = ownedValues(generateTheme(record.recipe, tokens));
  const actual = Object.fromEntries(flatten(tokens).map((t) => [t.path.join('.'), t.$value]));
  // A path the file doesn't have yet (a newer halftone-tokens owns more) is not an edit; apply adds it.
  const drift = Object.entries(expected)
    .filter(([path, value]) => path in actual && JSON.stringify(actual[path]) !== JSON.stringify(value))
    .map(([path]) => path);
  // Normalised: a recipe recorded by an older halftone-tokens gets the axes it didn't have (the typeset).
  return { applied: true, code: record.code, recipe: normalizeRecipe(record.recipe), drift };
}
