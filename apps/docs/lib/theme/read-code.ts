/**
 * A pasted theme code in either format: a Halftone code (ht1-…, ht2-…) or a shadcn/ui preset code
 * (ui.shadcn.com/create). A shadcn code becomes the nearest Halftone recipe, with a note for each value that
 * doesn't carry over. Used by the studio's Open box, the ?t= link and the brief wizard.
 */
import { decodeRecipe, decodeShadcnPreset, isShadcnPresetCode, isThemeCode, recipeFromShadcn, type Recipe } from '@halftone-ds/tokens/theme';

export type ReadCode = { recipe: Recipe; notes: string[]; from: 'halftone' | 'shadcn' };

/** Throws, with a message for the person, when the text is neither kind of code. */
export function readThemeCode(input: string): ReadCode {
  const code = input.trim();
  if (isThemeCode(code)) return { recipe: decodeRecipe(code), notes: [], from: 'halftone' };
  const shadcn = isShadcnPresetCode(code) ? decodeShadcnPreset(code) : null;
  if (shadcn) return { ...recipeFromShadcn(shadcn), from: 'shadcn' };
  throw new Error('Not a theme code. Paste a Halftone code (ht1-…, ht2-…) or a shadcn preset code from ui.shadcn.com/create.');
}
