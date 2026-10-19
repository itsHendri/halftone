/**
 * @halftone-ds/tokens/theme — theme recipes, the generator, codes, presets and CSS output. Pure ESM
 * with no Node APIs: the docs site runs it in the browser for the live picker, and the CLI runs it to
 * commit a theme into tokens.json (`halftone-tokens theme apply`).
 */
export { generateTheme } from './generate.mjs';
export { encodeRecipe, decodeRecipe, isThemeCode } from './codec.mjs';
export { DEFAULT_RECIPE, defaultStyles, defaultTypeset, FLOW, LEADING, OPTIONS, normalizeRecipe, sameRecipe, RECIPE_VERSION, STYLE_KEYS, TYPESET_KEYS } from './recipe.mjs';
export { FONTS, fontById, googleFontsHref } from './fonts.mjs';
export { PRESETS, presetById } from './presets.mjs';
export { styleVars, themeVars, themeCss, themeHex, typeVars } from './vars.mjs';
export { applyRecipe, themeStatus, THEME_EXTENSION } from './apply.mjs';
export { BRAND_RAMPS } from './palettes.mjs';
export {
  decodeShadcnPreset,
  encodeShadcnPreset,
  isShadcnPresetCode,
  recipeFromShadcn,
  SHADCN_FONTS_URL,
  shadcnFont,
  shadcnFontPath,
  shadcnTheme,
} from './shadcn.mjs';
export { CVD_TYPES, cvdWarnings, describeCvdWarnings, DISTINCT_PAIRS, MIN_DELTA_E, pairDistances, simulateCvd } from '../cvd.mjs';

export { AA, AA_NON_TEXT, contrastPairs, contrastReport } from '../contrast.mjs';
export { apcaContrast } from '../apca.mjs';
