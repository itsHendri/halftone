// npm test -w packages/tokens — the theme generator's guarantees.
import assert from 'node:assert/strict';
import { existsSync, readFileSync, unlinkSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { test } from 'node:test';
import { fileURLToPath } from 'node:url';

import { hexToOklchParts, inGamut } from '../lib/color.mjs';
import { contrastFailures } from '../lib/contrast.mjs';
import { loadTokens } from '../lib/resolve.mjs';
import { resolveTree } from '../lib/theme/refs.mjs';
import {
  applyRecipe,
  decodeRecipe,
  DEFAULT_RECIPE,
  encodeRecipe,
  FONTS,
  generateTheme,
  OPTIONS,
  PRESETS,
  TYPESET_KEYS,
  themeCss,
  themeHex,
  themeStatus,
  themeVars,
} from '../lib/theme/index.mjs';
import { normalizeRecipe } from '../lib/theme/recipe.mjs';
import { brandRamp, curatedRamp } from '../lib/theme/ramp.mjs';
import nativewind3 from '../targets/nativewind3.mjs';
import shadcnWeb from '../targets/shadcn-web.mjs';
import { semanticColors } from '../lib/theme/semantic.mjs';

const pkg = join(dirname(fileURLToPath(import.meta.url)), '..');
const repo = join(pkg, '../..');
const sources = {
  fixture: join(pkg, 'test/fixtures/tokens.json'),
  // The kit's tokens.json as it shipped before themes: the base the generator tests build on.
  kit: join(pkg, 'test/fixtures/halftone-tokens.json'),
  mobile: join(repo, 'apps/mobile/tokens/tokens.json'),
};

for (const [name, path] of Object.entries(sources)) {
  test(`refs.mjs resolves ${name} tokens.json exactly as Style Dictionary does`, async () => {
    const source = JSON.parse(readFileSync(path, 'utf8'));
    const sd = await loadTokens(path);
    const sdBy = (list) => Object.fromEntries(list.map((t) => [t.path.join('.'), t.$value]));
    const ours = (mode) => Object.fromEntries(resolveTree(source, mode).map((t) => [t.path.join('.'), t.$value]));
    assert.deepEqual(ours('light'), { ...sdBy(sd.prim), ...sdBy(sd.semLight) });
    assert.deepEqual(ours('dark'), { ...sdBy(sd.prim), ...sdBy(sd.semDark) });
  });
}

test('refs.mjs reports missing and circular references', () => {
  assert.throws(() => resolveTree({ a: { $value: '{b}' } }, 'light'), /Unresolved reference \{b\}/);
  assert.throws(() => resolveTree({ a: { $value: '{b}' }, b: { $value: '{a}' } }, 'light'), /Circular reference/);
});

test('strict contrast adds tones as ink on muted and accent', () => {
  const hex = { background: '#ffffff', card: '#ffffff', muted: '#d4d4d8', accent: '#ffffff', primary: '#2563eb' };
  assert.deepEqual(contrastFailures(hex, 'light'), []);
  const strict = contrastFailures(hex, 'light', { strict: true });
  assert.equal(strict.length, 1);
  assert.match(strict[0], /text-primary on muted/);
});

// ---------- generator ---------------------------------------------------------------------------

const base = JSON.parse(readFileSync(sources.kit, 'utf8'));

/** A deterministic pseudo-random generator, so the sweep is the same on every run. */
function rng(seed) {
  let s = seed >>> 0;
  return () => ((s = (Math.imul(s, 1664525) + 1013904223) >>> 0) / 2 ** 32);
}
const pick = (rand, list) => list[Math.floor(rand() * list.length)];
const randomHex = (rand) => '#' + Math.floor(rand() * 0x1000000).toString(16).padStart(6, '0');
const TEXT_FONTS = FONTS.filter((f) => f.id !== 'system-mono');
const MONO_FONTS = FONTS.filter((f) => f.category === 'mono');
function randomRecipe(rand, { typeset = true } = {}) {
  const r = { brand: randomHex(rand), font: { heading: pick(rand, TEXT_FONTS).id, body: pick(rand, TEXT_FONTS).id } };
  for (const [key, list] of Object.entries(OPTIONS)) r[key] = pick(rand, list);
  if (typeset) r.font.mono = pick(rand, MONO_FONTS).id;
  else for (const key of TYPESET_KEYS) r[key] = DEFAULT_RECIPE[key];
  return r;
}

test('generated ramps keep the seed exactly, stay in order and stay in sRGB', () => {
  const rand = rng(7);
  for (let i = 0; i < 300; i++) {
    const seed = randomHex(rand);
    const ramp = brandRamp(seed);
    const values = Object.values(ramp);
    assert.ok(values.includes(seed), `${seed} is a step of its own ramp`);
    const L = values.map((hex) => hexToOklchParts(hex)[0]);
    for (let s = 1; s < L.length; s++) assert.ok(L[s] <= L[s - 1] + 1e-3, `${seed}: step ${s} is not darker than step ${s - 1}`);
    for (const hex of values) assert.ok(inGamut(hexToOklchParts(hex), 1e-3), `${hex} is in gamut`);
  }
});

test('a curated seed (a Tailwind 600) returns that ramp untouched', () => {
  assert.equal(curatedRamp('#2563EB'), 'blue');
  assert.deepEqual(brandRamp('#2563eb'), Object.fromEntries(Object.entries(base.primitive.color.brand).map(([k, v]) => [k, v.$value])));
});

test('every preset and 500 random recipes pass the strict contrast gate after auto-fix', () => {
  const rand = rng(42);
  // #cc4575: neither label reads on it, so the fixer has to move the fill (it used to move it the wrong way).
  const recipes = [...PRESETS.map((p) => p.recipe), { brand: '#cc4575' }, ...Array.from({ length: 500 }, () => randomRecipe(rand))];
  for (const recipe of recipes) {
    const theme = generateTheme(recipe, base);
    for (const mode of ['light', 'dark']) {
      assert.deepEqual(contrastFailures(theme.resolved[mode], mode, { strict: true }), [], `${recipe.brand} ${mode}`);
    }
  }
});

test("the default recipe, before fixes, is exactly the kit's original semantic map", () => {
  const theme = generateTheme(DEFAULT_RECIPE, base, { fix: false });
  const original = Object.fromEntries(Object.entries(base.semantic.color).map(([k, v]) => [k, v.$value]));
  assert.deepEqual(theme.semantic.color, original);
  assert.deepEqual(Object.keys(semanticColors()), Object.keys(original), 'same tokens, same order');
  assert.equal(theme.semantic.radius.base, base.semantic.radius.base.$value);
});

test('theme codes round-trip and catch typos', () => {
  const rand = rng(3);
  for (let i = 0; i < 400; i++) {
    // Half keep the default typeset: those must stay ht1 codes, readable by any version of halftone-tokens.
    const recipe = randomRecipe(rand, { typeset: i % 2 === 0 });
    const code = encodeRecipe(recipe);
    assert.match(code, /^(ht1-[0-9A-HJKMNP-TV-Z]{12}|ht2-[0-9A-HJKMNP-TV-Z]{16})$/);
    assert.deepEqual(decodeRecipe(code), decodeRecipe(code.toLowerCase()));
    assert.equal(encodeRecipe(decodeRecipe(code)), code);
    assert.deepEqual(decodeRecipe(code), normalizeRecipe(recipe));
  }
  for (const code of [encodeRecipe(DEFAULT_RECIPE), encodeRecipe({ ...DEFAULT_RECIPE, size: '18' })]) {
    const typo = code.slice(0, -1) + (code.at(-1) === '0' ? '1' : '0');
    assert.throws(() => decodeRecipe(typo), /typo/);
  }
  assert.throws(() => decodeRecipe('ht1-short'), /not a theme code/);
  assert.throws(() => decodeRecipe('ht3-0000000000000000'), /newer theme code/);
});

test('the default typeset keeps ht1 codes; anything else is ht2', () => {
  // The committed kit theme's code from before the typeset decodes, with the default typeset.
  const old = decodeRecipe('ht1-29B3XC60003T');
  assert.deepEqual(old, normalizeRecipe(DEFAULT_RECIPE));
  assert.equal(encodeRecipe(DEFAULT_RECIPE), 'ht1-29B3XC60003T');
  assert.match(encodeRecipe({ ...DEFAULT_RECIPE, leading: 'relaxed' }), /^ht2-/);
  assert.match(encodeRecipe({ ...DEFAULT_RECIPE, font: { mono: 'geist-mono' } }), /^ht2-/);
  assert.throws(() => normalizeRecipe({ font: { mono: 'inter' } }), /mono font/);
  assert.throws(() => normalizeRecipe({ font: { heading: 'system-mono' } }), /can't be the heading font/);
});

test('the default typeset builds exactly the text scale the kits always had', async () => {
  const ctx = await loadTokens(sources.kit);
  ctx.header = 'test';
  const [web] = shadcnWeb(ctx, { out: 'web.css' });
  assert.match(web.contents, /--text-base: calc\(1rem \* var\(--type-scale\)\);/);
  assert.match(web.contents, /--type-scale: 1;\n {2}--leading-factor: 1;/);
  assert.doesNotMatch(shadcnWeb(ctx, { out: 'web.css', typeset: false })[0].contents, /--text-base|--type-scale/);
  const [, tw] = nativewind3(ctx, { css: 'global.css', tailwind: 'theme.js' });
  // Tailwind 3's own defaults.
  const theme = new Function('module', `${tw.contents}; return module.exports;`)({});
  assert.deepEqual(theme.fontSize.base, ['1rem', { lineHeight: '1.5rem' }]);
  assert.deepEqual(theme.fontSize['4xl'], ['2.25rem', { lineHeight: '2.5rem' }]);
  assert.equal(theme.lineHeight.prose, '1.75rem', 'leading-7, what Text p always had');
  // A bigger, looser typeset scales them.
  const { tokens } = applyRecipe(base, { ...DEFAULT_RECIPE, size: '18', leading: 'relaxed' });
  const path = join(pkg, 'test/fixtures/.typeset-tokens.json');
  writeFileSync(path, JSON.stringify(tokens));
  const big = await loadTokens(path);
  big.header = 'test';
  const bigTheme = new Function('module', `${nativewind3(big, { css: 'a', tailwind: 'b' })[1].contents}; return module.exports;`)({});
  assert.deepEqual(bigTheme.fontSize.base, ['1.125rem', { lineHeight: `${Number(((24 * 1.125 * (1.9 / 1.75)) / 16).toFixed(4))}rem` }]);
  assert.match(shadcnWeb(big, { out: 'x' })[0].contents, /--type-scale: 1.125;/);
  unlinkSync(path);
});

// Golden output: a generator change that alters what an existing code produces must bump RECIPE_VERSION.
// Regenerate deliberately with UPDATE_GOLDEN=1 npm test -w packages/tokens.
test('presets produce their golden codes and colours', () => {
  const goldenPath = join(pkg, 'test/fixtures/theme-golden.json');
  const actual = Object.fromEntries(
    PRESETS.map((p) => {
      const theme = generateTheme(p.recipe, base);
      return [p.id, { code: theme.code, light: theme.resolved.light, dark: theme.resolved.dark, brand: theme.primitives.brand, neutral: theme.primitives.neutral }];
    })
  );
  if (process.env.UPDATE_GOLDEN || !existsSync(goldenPath)) writeFileSync(goldenPath, JSON.stringify(actual, null, 2) + '\n');
  assert.deepEqual(actual, JSON.parse(readFileSync(goldenPath, 'utf8')));
});

test('applyRecipe writes only what a theme owns, records it, and is idempotent', () => {
  const recipe = PRESETS.find((p) => p.id === 'calm').recipe;
  const { tokens, theme } = applyRecipe(base, recipe);
  assert.deepEqual(tokens.primitive.space, base.primitive.space);
  assert.deepEqual(tokens.primitive.color.success, base.primitive.color.success);
  assert.equal(tokens.semantic.color.primary.$value.light, theme.semantic.color.primary.light);
  assert.equal(tokens.$extensions['com.halftonedesignsystem.theme'].code, theme.code);
  assert.deepEqual(applyRecipe(tokens, recipe).tokens, tokens);
  assert.deepEqual(base, JSON.parse(readFileSync(sources.kit, 'utf8')), 'the input is not mutated');
});

test('themeStatus reports the applied theme and hand edits as drift', () => {
  assert.deepEqual(themeStatus({ primitive: {}, semantic: {} }), { applied: false });
  const { tokens, theme } = applyRecipe(base, DEFAULT_RECIPE);
  assert.deepEqual(themeStatus(tokens), { applied: true, code: theme.code, recipe: theme.recipe, drift: [] });
  const edited = JSON.parse(JSON.stringify(tokens));
  edited.semantic.color.muted.$value.light = '#eeeeee';
  assert.deepEqual(themeStatus(edited).drift, ['semantic.color.muted']);
});

test('theme variables match what the build writes for the same tokens', async () => {
  const { tokens, theme } = applyRecipe(base, PRESETS.find((p) => p.id === 'playful').recipe);
  const hsl = themeVars(theme, 'hsl');
  const oklch = themeVars(theme, 'oklch');
  assert.equal(hsl.light['--radius'], `${theme.radius / 16}rem`);
  assert.match(oklch.dark['--primary'], /^oklch\(/);
  assert.equal(themeHex(theme).dark.primaryForeground, theme.resolved.dark['primary-foreground']);
  assert.match(themeCss(theme), /^:root \{\n {2}--background: oklch/);
  // The resolver used by the build agrees with the generator's own resolution.
  for (const mode of ['light', 'dark']) {
    const resolved = Object.fromEntries(resolveTree(tokens, mode).filter((t) => t.path[1] === 'color' && t.path[0] === 'semantic').map((t) => [t.path[2], t.$value]));
    assert.deepEqual(resolved, theme.resolved[mode]);
  }
});
