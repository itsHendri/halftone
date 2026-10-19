/**
 * generateTheme — a recipe expanded into a theme. Pure ESM, no Node APIs: the docs site runs it in
 * the browser for the live picker, the CLI runs it to commit a theme into tokens.json.
 *
 *   generateTheme(recipe, base)  base = the app's tokens.json (status ramps, radius steps come from it)
 *     → { recipe, code, primitives, semantic, resolved, radius, type, adjustments }
 *
 * Status colours (success, warning, danger, info) are not themed in v1; they come from `base`.
 */
import { fixContrast } from './fix.mjs';
import { encodeRecipe } from './codec.mjs';
import { fontById } from './fonts.mjs';
import { BORDER, BUTTON, DENSITY, DEPTH, FIELD, fieldWidth, FLOW, LEADING, normalizeRecipe, RADIUS, STROKE, typeScale } from './recipe.mjs';
import { anchorStep, brandRamp, neutralRamp } from './ramp.mjs';
import { resolvedMap } from './refs.mjs';
import { semanticColors, styleColors } from './semantic.mjs';


const ramp = (values) => Object.fromEntries(Object.entries(values).map(([step, $value]) => [step, { $type: 'color', $value }]));

/** The theme for a recipe, on top of `base` (a tokens.json object). `fix: false` skips the contrast fixer. */
export function generateTheme(input, base, { fix = true } = {}) {
  const recipe = normalizeRecipe(input);
  const brand = brandRamp(recipe.brand);
  const neutral = neutralRamp(recipe.neutral, recipe.brand);

  // Primitive lookup: the base primitives with this theme's ramps swapped in.
  const primitive = { ...base.primitive, color: { ...base.primitive.color, brand: ramp(brand), neutral: ramp(neutral) } };
  const prim = resolvedMap({ primitive }, 'light');
  const lookup = (value) => {
    if (typeof value !== 'string' || !value.startsWith('{')) return value;
    const hex = prim[value.slice(1, -1)];
    if (hex === undefined) throw new Error(`generateTheme: ${value} is not in the base tokens`);
    return hex;
  };

  const anchor = anchorStep(recipe.brand);
  let colors = semanticColors(anchor);
  let adjustments = [];
  if (fix) ({ semantic: colors, adjustments } = fixContrast(colors, lookup));
  // The styles' colours build on the fixed ones, then get their own check (a soft button's ink, a field's line).
  colors = { ...colors, ...styleColors(recipe, anchor, colors) };
  if (fix) {
    const styled = fixContrast(colors, lookup);
    colors = styled.semantic;
    adjustments = [...adjustments, ...styled.adjustments];
  }

  const radiusRef = RADIUS[recipe.radius];
  const radiusValue = typeof radiusRef === 'string' ? `{primitive.radius.${radiusRef}}` : radiusRef;
  const resolved = Object.fromEntries(
    ['light', 'dark'].map((mode) => [mode, Object.fromEntries(Object.entries(colors).map(([name, v]) => [name, lookup(v[mode])]))])
  );

  const radius = lookup(radiusValue);
  const controlRadius = recipe.controls === 'pill' ? 9999 : radiusValue;
  // Heading and body: '' is the platform font. Mono: system-mono is Menlo, what tokens.json always had.
  const font = (id) => (id === 'system' ? '' : fontById(id).family);
  const density = DENSITY[recipe.density];
  const size = Number(recipe.size);
  const type = {
    size,
    leading: LEADING[recipe.leading],
    flow: FLOW[recipe.flow],
    measure: Number(recipe.measure),
  };

  const borderWidth = BORDER[recipe.border];
  const btn = BUTTON[recipe.button];
  const fld = FIELD[recipe.field];
  const button = { alpha: btn.alpha, border: btn.border, edge: btn.edge };
  const field = { alpha: fld.alpha, border: fieldWidth(fld.border, borderWidth), edge: fieldWidth(fld.edge, borderWidth), inset: fld.inset };
  // As tokens: widths named apart from the colours (semantic.color.button-edge is a colour).
  const buttonTokens = { alpha: button.alpha, 'border-width': button.border, 'edge-width': button.edge };
  const fieldTokens = { alpha: field.alpha, 'border-width': field.border, 'edge-width': field.edge, round: fld.round, 'round-bottom': fld.roundBottom, inset: field.inset };
  // rounded-md is the radius × md / lg (resolve.mjs); a field's radius is that or square.
  const md = lookup('{primitive.radius.md}') / lookup('{primitive.radius.lg}');

  return {
    recipe,
    code: encodeRecipe(recipe),
    primitives: { brand, neutral },
    fonts: { heading: font(recipe.font.heading), body: font(recipe.font.body), mono: font(recipe.font.mono) },
    semantic: {
      color: colors,
      radius: { base: radiusValue, control: controlRadius },
      border: { width: BORDER[recipe.border] },
      icon: { stroke: STROKE[recipe.stroke] },
      shadow: DEPTH[recipe.depth],
      density: { scale: density.scale, control: { sm: density.sm, md: density.md, lg: density.lg, x: density.x } },
      type,
      button: buttonTokens,
      field: fieldTokens,
    },
    density,
    type: typeScale(type),
    resolved,
    radius,
    radiusControl: lookup(controlRadius),
    borderWidth,
    button,
    field: { ...field, radius: lookup(radiusValue) * md * fld.round, radiusBottom: lookup(radiusValue) * md * fld.roundBottom },
    stroke: STROKE[recipe.stroke],
    adjustments,
  };
}
