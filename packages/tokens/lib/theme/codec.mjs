/**
 * Theme codes: a recipe packed into bits and written in Crockford base32 after a prefix. Short enough to
 * read out, paste into a terminal or a URL.
 *
 *   pk1-  12 characters, 60 bits: a theme with the default typeset (every code made before the typeset)
 *   pk2-  16 characters, 80 bits: any theme
 *
 *   bits  field                                   pk1   pk2
 *          recipe version (RECIPE_VERSION)          4     4
 *          brand hex                               24    24
 *          neutral, radius, controls            3+3+1 3+3+1   (option indexes, recipe.mjs)
 *          heading, body (, mono)                 5+5 6+6+6   (indexes into FONTS, fonts.mjs)
 *          stroke, depth, density, border     2+2+2+2 2+2+2+2
 *          size, leading, flow, measure             –  3+3+3+3
 *          checksum (payload mod 127)               7     7   a typo is caught instead of making another theme
 *
 * encodeRecipe writes pk1 whenever it can, so a theme that doesn't touch the typeset keeps the code it
 * always had (and older kit-tokens can read it). The preset name is not in the code: a code is the theme,
 * whichever preset it started from.
 */
import { FONTS } from './fonts.mjs';
import { defaultTypeset, normalizeRecipe, OPTIONS, RECIPE_VERSION } from './recipe.mjs';

const ALPHABET = '0123456789ABCDEFGHJKMNPQRSTVWXYZ';
const LAYOUT = [
  ['neutral', 3],
  ['radius', 3],
  ['controls', 1],
];
const TAIL = [
  ['stroke', 2],
  ['depth', 2],
  ['density', 2],
  ['border', 2],
];
const TYPESET = [
  ['size', 3],
  ['leading', 3],
  ['flow', 3],
  ['measure', 3],
];
/** Per format: prefix, characters, font width, whether the typeset is in it. */
const FORMATS = {
  pk1: { prefix: 'pk1-', chars: 12, font: 5, typeset: false },
  pk2: { prefix: 'pk2-', chars: 16, font: 6, typeset: true },
};

const fontIndex = (id) => FONTS.findIndex((f) => f.id === id);

export function encodeRecipe(input) {
  const r = normalizeRecipe(input);
  const pk1 = defaultTypeset(r) && fontIndex(r.font.heading) < 32 && fontIndex(r.font.body) < 32;
  const format = pk1 ? FORMATS.pk1 : FORMATS.pk2;
  let bits = BigInt(r.v);
  const push = (value, width) => {
    if (value < 0 || value >= 2 ** width) throw new Error(`encodeRecipe: ${value} does not fit in ${width} bits`);
    bits = (bits << BigInt(width)) | BigInt(value);
  };
  push(parseInt(r.brand.slice(1), 16), 24);
  for (const [key, width] of LAYOUT) push(OPTIONS[key].indexOf(r[key]), width);
  push(fontIndex(r.font.heading), format.font);
  push(fontIndex(r.font.body), format.font);
  if (format.typeset) push(fontIndex(r.font.mono), format.font);
  for (const [key, width] of TAIL) push(OPTIONS[key].indexOf(r[key]), width);
  if (format.typeset) for (const [key, width] of TYPESET) push(OPTIONS[key].indexOf(r[key]), width);
  bits = (bits << 7n) | (bits % 127n);

  let out = '';
  for (let i = 0; i < format.chars; i++) {
    out = ALPHABET[Number(bits & 31n)] + out;
    bits >>= 5n;
  }
  return format.prefix + out;
}

/** Code → recipe. Throws on a malformed code, a bad checksum or an unknown version. */
export function decodeRecipe(code) {
  const clean = String(code).trim().toUpperCase();
  const format = /^PK2/.test(clean) ? FORMATS.pk2 : FORMATS.pk1;
  const raw = clean.replace(/^PK[12]-?/, '').replace(/[IL]/g, '1').replace(/O/g, '0').replace(/-/g, '');
  if (!/^PK[12]/.test(clean) && /^PK\d/.test(clean)) {
    throw new Error(`"${code}" is a newer theme code than this kit-tokens reads. Update @halftone/tokens.`);
  }
  if (!new RegExp(`^[0-9A-HJKMNP-TV-Z]{${format.chars}}$`).test(raw)) {
    throw new Error(`"${code}" is not a theme code (expected pk1- and 12 characters, or pk2- and 16)`);
  }
  let bits = 0n;
  for (const ch of raw) bits = (bits << 5n) | BigInt(ALPHABET.indexOf(ch));
  const checksum = bits & 127n;
  bits >>= 7n;
  if (bits % 127n !== checksum) throw new Error(`"${code}" has a typo (checksum mismatch)`);

  const pull = (width) => {
    const value = Number(bits & ((1n << BigInt(width)) - 1n));
    bits >>= BigInt(width);
    return value;
  };
  const opt = (key, width) => {
    const value = OPTIONS[key][pull(width)];
    if (value === undefined) throw new Error(`"${code}" has an unknown ${key}`);
    return value;
  };
  const font = (width) => {
    const f = FONTS[pull(width)];
    if (!f) throw new Error(`"${code}" has an unknown font`);
    return f.id;
  };
  const fields = (list) => Object.fromEntries([...list].reverse().map(([key, width]) => [key, opt(key, width)]));
  // Read back to front.
  const typeset = format.typeset ? fields(TYPESET) : {};
  const tail = fields(TAIL);
  const mono = format.typeset ? font(format.font) : undefined;
  const body = font(format.font);
  const heading = font(format.font);
  const head = fields(LAYOUT);
  const brand = '#' + pull(24).toString(16).padStart(6, '0');
  const v = Number(bits);
  if (v !== RECIPE_VERSION) throw new Error(`"${code}" is a version ${v} theme; this kit-tokens reads version ${RECIPE_VERSION}. Update @halftone/tokens.`);
  return normalizeRecipe({ v, brand, ...head, font: { heading, body, ...(mono ? { mono } : {}) }, ...tail, ...typeset });
}

export const isThemeCode = (value) => /^(pk1-?[0-9a-z]{12}|pk2-?[0-9a-z]{16})$/i.test(String(value).trim());
