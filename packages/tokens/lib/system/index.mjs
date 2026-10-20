/**
 * @halftone-ds/tokens/system — the HalftoneSystem document: one design system (a recipe plus everything edited
 * by hand on top of it), as the Studio keeps it and `halftone-tokens theme apply ./name.halftone.json` commits it.
 * Pure ESM with no Node APIs. See schema.mjs for the shape.
 */
export {
  BORDER_STYLES,
  COLOR_ROLES,
  createSystem,
  EXTRA_KINDS,
  FONT_ROLES,
  hasOverrides,
  isSystem,
  newSystemId,
  normalizeSystem,
  RADIUS_STEPS,
  ROLE_NAMES,
  SHADOW_LEVELS,
  STATUS_ROLES,
  SYSTEM_KIND,
  SYSTEM_VERSION,
  SystemError,
  systemOverrides,
  TEXT_DEFAULTS,
  TEXT_KEYS,
  TEXT_STYLES,
  validateSystem,
  withoutBrandImages,
} from './schema.mjs';
export { generateSystem, systemCode, systemRadii, systemRamps, textStyles } from './generate.mjs';
export { migrate, systemToRecipe } from './migrate.mjs';
export { applySystem } from '../theme/apply.mjs';
