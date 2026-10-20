/**
 * The kits' tokens.json and the theme committed in it: what every generated theme starts from. A plain module, so
 * the systems store (lib/studio/systems.ts) and the theme store (lib/theme/store.ts) share it without importing
 * each other.
 */
import { normalizeRecipe, themeStatus, type Recipe, type TokensJson } from '@halftone-ds/tokens/theme';
import tokensJson from '../../../mobile/tokens/tokens.json';

export const base = tokensJson as unknown as TokensJson;
const status = themeStatus(base);
/** The theme the kits ship with right now. normalizeRecipe: a recipe recorded before the typeset gets its defaults. */
export const committed: Recipe = normalizeRecipe(status.applied ? status.recipe : {});
