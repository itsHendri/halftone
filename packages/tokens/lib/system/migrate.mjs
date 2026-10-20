/**
 * migrate — a HalftoneSystem from what came before it: a theme recipe (or its ht- code) and the Studio's brand.
 * A document already is cleaned up and brought to the current version. Pure ESM.
 *
 *   migrate(recipe | code | system, brand?, { id?, name?, updatedAt? })  → HalftoneSystem
 *   systemToRecipe(system)  → { recipe, code, lost }: the other way; `lost` lists the overrides a recipe can't
 *                             hold (code is null when there are any)
 *
 * A recipe migrates to a system with no overrides, so it round-trips: systemToRecipe(migrate(r)).recipe is r, and
 * generateSystem(migrate(r), base) is generateTheme(r, base).
 */
import { decodeRecipe, encodeRecipe, isThemeCode } from '../theme/codec.mjs';
import { presetById } from '../theme/presets.mjs';
import { normalizeRecipe } from '../theme/recipe.mjs';
import { isSystem, newSystemId, normalizeSystem, systemOverrides } from './schema.mjs';

export function migrate(input, brand, { id, name, updatedAt } = {}) {
  if (isSystem(input)) {
    const doc = normalizeSystem(input);
    return { ...doc, ...(id ? { id } : {}), ...(name ? { name } : {}), ...(updatedAt ? { updatedAt } : {}), ...(brand ? { brand: normalizeSystem({ brand }).brand } : {}) };
  }
  const recipe = typeof input === 'string' && isThemeCode(input) ? decodeRecipe(input) : normalizeRecipe(input ?? {});
  const preset = recipe.preset ? presetById(recipe.preset) : undefined;
  return normalizeSystem({
    id: id ?? newSystemId(),
    name: name ?? (brand?.name?.trim() || preset?.name || 'My system'),
    ...(recipe.preset ? { preset: recipe.preset } : {}),
    updatedAt: updatedAt ?? new Date().toISOString(),
    recipe,
    ...(brand ? { brand } : {}),
  });
}

export function systemToRecipe(input) {
  const doc = normalizeSystem(input);
  const lost = systemOverrides(doc);
  return { recipe: doc.recipe, code: lost.length ? null : encodeRecipe(doc.recipe), lost };
}
