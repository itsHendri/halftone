// npm test -w packages/tokens — the HalftoneSystem document: schema, generator, migration, apply and the CLI.
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import { test } from 'node:test';
import { fileURLToPath } from 'node:url';

import { hexToOklchParts, inGamut } from '../lib/color.mjs';
import { contrastFailures } from '../lib/contrast.mjs';
import { loadTokens } from '../lib/resolve.mjs';
import { STEPS } from '../lib/theme/palettes.mjs';
import { resolveTextStyles, textEdits, TYPE, typeScale } from '../lib/theme/recipe.mjs';
import { textStyleVars } from '../lib/theme/vars.mjs';
import { brandRamp, neutralSeedRamp } from '../lib/theme/ramp.mjs';
import {
  applyRecipe,
  applySystem,
  createSystem,
  DEFAULT_RECIPE,
  encodeRecipe,
  FONTS,
  generateSystem,
  generateTheme,
  hasOverrides,
  migrate,
  normalizeRecipe,
  normalizeSystem,
  OPTIONS,
  PRESETS,
  systemCode,
  systemOverrides,
  systemRadii,
  systemRamps,
  systemToRecipe,
  textStyles,
  themeStatus,
  validateSystem,
} from '../lib/theme/index.mjs';
import nativewind3 from '../targets/nativewind3.mjs';
import shadcnWeb from '../targets/shadcn-web.mjs';

const pkg = join(dirname(fileURLToPath(import.meta.url)), '..');
const base = JSON.parse(readFileSync(join(pkg, 'test/fixtures/halftone-tokens.json'), 'utf8'));
const ref = (ramp, step) => `{primitive.color.${ramp}.${step}}`;
const FIXED = { id: 'test', updatedAt: '2026-10-20T12:00:00.000Z' };
/** A system on the default recipe (or `recipe`) with `parts` on top. */
const sys = (parts = {}, recipe = DEFAULT_RECIPE) => ({ ...migrate(recipe, undefined, FIXED), ...parts });

function rng(seed) {
  let s = seed >>> 0;
  return () => ((s = (Math.imul(s, 1664525) + 1013904223) >>> 0) / 2 ** 32);
}
const pick = (rand, list) => list[Math.floor(rand() * list.length)];
const randomHex = (rand) => '#' + Math.floor(rand() * 0x1000000).toString(16).padStart(6, '0');
function randomRecipe(rand) {
  const text = FONTS.filter((f) => f.id !== 'system-mono');
  const r = { brand: randomHex(rand), font: { heading: pick(rand, text).id, body: pick(rand, text).id, mono: pick(rand, FONTS.filter((f) => f.category === 'mono')).id } };
  for (const [key, list] of Object.entries(OPTIONS)) r[key] = pick(rand, list);
  return r;
}
const lightness = (ramp) => Object.values(ramp).map((hex) => hexToOklchParts(hex)[0]);
const inOrder = (ramp) => lightness(ramp).every((L, i, all) => i === 0 || L <= all[i - 1] + 1e-3);

// ---------- identity ------------------------------------------------------------------------------

test('a system with no overrides is exactly generateTheme', () => {
  const rand = rng(11);
  const recipes = [DEFAULT_RECIPE, ...PRESETS.map((p) => p.recipe), ...Array.from({ length: 150 }, () => randomRecipe(rand))];
  for (const recipe of recipes) {
    const doc = migrate(recipe);
    assert.equal(hasOverrides(doc), false);
    assert.deepEqual(generateSystem(doc, base), generateTheme(recipe, base), recipe.brand);
  }
  // With brand assets too: the brand is never part of the theme.
  const branded = migrate(DEFAULT_RECIPE, { name: 'Acme', logo: { svg: '<svg/>', aspect: 2 } });
  assert.deepEqual(generateSystem(branded, base), generateTheme(DEFAULT_RECIPE, base));
  assert.deepEqual(applySystem(base, migrate(DEFAULT_RECIPE)).tokens.semantic, applyRecipe(base, DEFAULT_RECIPE).tokens.semantic);
});

// ---------- ramps ---------------------------------------------------------------------------------

test('every colour role gets a ramp from its seed, with the seed on its step', () => {
  const rand = rng(5);
  for (let i = 0; i < 60; i++) {
    const seeds = { danger: randomHex(rand), success: randomHex(rand), warning: randomHex(rand), info: randomHex(rand), neutral: randomHex(rand) };
    const doc = sys({ colors: Object.fromEntries(Object.entries(seeds).map(([role, seed]) => [role, { seed }])) });
    const ramps = systemRamps(doc, base);
    for (const [role, seed] of Object.entries(seeds)) {
      const r = ramps[role];
      assert.equal(r.source, 'seed');
      assert.equal(r.values[r.anchor], seed, `${role} ${seed} sits on ${r.anchor}`);
      assert.ok(inOrder(r.values), `${role} ${seed} in order`);
      for (const hex of Object.values(r.values)) assert.ok(inGamut(hexToOklchParts(hex), 1e-3));
    }
    // The neutral keeps white and black at its ends, and the grey ramps' dark end.
    assert.deepEqual([ramps.neutral.values[0], ramps.neutral.values[1000]], ['#ffffff', '#000000']);
    // Every generated system still passes the gate: only hand-picked colours may fail.
    const theme = generateSystem(doc, base);
    assert.deepEqual(theme.warnings, []);
    for (const mode of ['light', 'dark']) assert.deepEqual(contrastFailures(theme.resolved[mode], mode, { strict: true }), []);
  }
  // Without a seed: the recipe's brand and neutral, the base file's status ramps.
  const plain = systemRamps(sys(), base);
  assert.deepEqual([plain.brand.source, plain.neutral.source, plain.danger.source], ['recipe', 'recipe', 'base']);
  assert.equal(plain.danger.values['600'], base.primitive.color.danger['600'].$value);
});

test('a seed can be pinned to any step and the ramp stays in order', () => {
  const rand = rng(9);
  for (let i = 0; i < 40; i++) {
    const seed = randomHex(rand);
    for (const anchor of STEPS) {
      const ramp = brandRamp(seed, { anchor });
      assert.equal(ramp[anchor], seed);
      assert.ok(inOrder(ramp), `${seed} pinned to ${anchor}`);
      const neutral = neutralSeedRamp(seed, { anchor });
      assert.equal(neutral[anchor], seed);
      assert.ok(inOrder(neutral), `neutral ${seed} pinned to ${anchor}`);
    }
  }
  // The seed's own step is no override; a curated seed pinned elsewhere is generated.
  assert.deepEqual(normalizeSystem(sys({ colors: { brand: { anchor: '600' } } })).colors, {});
  assert.notDeepEqual(brandRamp('#2563eb', { anchor: '500' }), brandRamp('#2563eb'));
  // The brand's anchor moves primary with it.
  const theme = generateSystem(sys({ colors: { brand: { anchor: '500' } } }), base, { fix: false });
  assert.equal(theme.semantic.color.primary.light, ref('brand', 500));
});

test("a status seed's tone follows the step it sits on", () => {
  // A light red sits on 500 (generated: only a curated 600 is a curated ramp): destructive, on 600 for the
  // curated ramp, moves to 500 and its dark tone to 400.
  const doc = sys({ colors: { danger: { seed: '#f87171' } } });
  assert.equal(systemRamps(doc, base).danger.anchor, '500');
  const theme = generateSystem(doc, base, { fix: false });
  assert.deepEqual(theme.semantic.color.destructive, { light: ref('danger', 500), dark: ref('danger', 400) });
  assert.ok(theme.primitives.danger, 'the status ramp is part of the theme');
  // Fixed for contrast like any generated colour (white on red 400 fails).
  const fixed = generateSystem(sys({ colors: { danger: { seed: '#f87171' } } }), base);
  assert.deepEqual(fixed.warnings, []);
  assert.ok(fixed.adjustments.some((a) => a.token === 'destructive' && a.mode === 'light'));
});

// ---------- step overrides ------------------------------------------------------------------------

test('edited steps override the ramp; the seed regenerates the rest; reset is generateTheme again', () => {
  const edited = sys({ colors: { brand: { steps: { 300: '#a0b0ff' } } } });
  const ramps = systemRamps(edited, base);
  assert.equal(ramps.brand.values[300], '#a0b0ff');
  assert.deepEqual(ramps.brand.edited, ['300']);
  for (const step of STEPS.filter((s) => s !== '300')) assert.equal(ramps.brand.values[step], ramps.brand.generated[step]);
  assert.equal(generateSystem(edited, base).primitives.brand[300], '#a0b0ff');

  // A new seed: every step but the edited one follows it.
  const reseeded = { ...edited, recipe: { ...edited.recipe, brand: '#16a34a' } };
  const next = systemRamps(reseeded, base).brand;
  assert.equal(next.values[300], '#a0b0ff');
  assert.equal(next.values[600], '#16a34a');
  assert.equal(next.values[500], brandRamp('#16a34a')[500]);

  // Reset: drop the override, and it is the recipe's theme again.
  const { steps, ...reset } = edited.colors.brand;
  assert.deepEqual(generateSystem({ ...edited, colors: { brand: reset } }, base), generateTheme(edited.recipe, base));

  // A role on an edited step keeps it exactly, even where the fixer would have moved it.
  const pinned = generateSystem(sys({ colors: { brand: { steps: { 600: '#93c5fd' } } } }), base);
  assert.equal(pinned.resolved.light.primary, '#93c5fd');
  // …its label still flips (that's the generated side), and what can't be fixed is a warning.
  assert.equal(pinned.semantic.color['primary-foreground'].light, ref('neutral', 950));
  assert.ok(pinned.warnings.some((w) => w.mode === 'light' && w.locked.includes('primary')));
});

// ---------- roles ---------------------------------------------------------------------------------

test('roles map light and dark separately, and what shares primary follows it', () => {
  const doc = sys({ roles: { primary: { dark: 'brand.300' }, accent: { light: 'brand.50' }, border: { light: '#d4d4d4' } } });
  const theme = generateSystem(doc, base);
  const brand = theme.primitives.brand;
  assert.equal(theme.resolved.dark.primary, brand[300]);
  assert.equal(theme.resolved.light.primary, generateTheme(DEFAULT_RECIPE, base).resolved.light.primary, 'light stays generated');
  for (const linked of ['ring', 'sidebar-primary', 'sidebar-ring', 'button', 'button-edge']) assert.equal(theme.resolved.dark[linked], brand[300], linked);
  assert.equal(theme.resolved.light.accent, brand[50]);
  assert.equal(theme.semantic.color.border.light, '#d4d4d4');
  // The label on a hand-mapped fill is generated: it flips to read on brand 300.
  assert.equal(theme.semantic.color['primary-foreground'].dark, ref('neutral', 950));
  assert.deepEqual(theme.warnings, []);
  // A role mapped by hand isn't linked: ring keeps its own mapping.
  const own = generateSystem(sys({ roles: { primary: { dark: 'brand.300' }, ring: { dark: 'brand.500' } } }), base);
  assert.equal(own.resolved.dark.ring, own.primitives.brand[500]);
});

test('hand-picked colours that fail contrast are warnings, never moved; generated ones are fixed', () => {
  const doc = sys({ roles: { 'muted-foreground': { light: 'neutral.400' } }, colors: { danger: { seed: '#f87171' } } });
  const theme = generateSystem(doc, base);
  assert.equal(theme.resolved.light['muted-foreground'], theme.primitives.neutral[400], 'not moved');
  const labels = theme.warnings.map((w) => `${w.mode} ${w.label}`);
  assert.ok(labels.includes('light muted-foreground on background'));
  assert.ok(theme.warnings.every((w) => w.locked.includes('muted-foreground')), 'only the hand-picked colour fails');
  assert.equal(new Set(labels).size, labels.length, 'each pairing once');
  // The surfaces it sits on stay as generated (no fill moved to suit a hand-picked label).
  assert.equal(theme.resolved.light.muted, generateTheme(DEFAULT_RECIPE, base).resolved.light.muted);
  // The generated danger tone was fixed instead, as a recipe's brand always was.
  assert.ok(theme.adjustments.some((a) => a.token === 'destructive'));
  // Everything that isn't hand-picked passes.
  const failing = contrastFailures(theme.resolved.light, 'light', { strict: true });
  assert.ok(failing.every((f) => f.includes('muted-foreground')), failing.join('\n'));
});

// ---------- type, fonts, shape, extras ------------------------------------------------------------

test('text styles: defaults follow the typeset, edited styles become whole tokens', () => {
  const styles = textStyles(sys());
  assert.deepEqual(styles.h1, { font: 'heading', weight: 800, size: 36, leading: 1.1111, tracking: -0.025, edited: [] });
  assert.equal(styles.p.leading, 1.75);
  const big = textStyles(sys({}, { ...DEFAULT_RECIPE, size: '18', leading: 'relaxed' }));
  assert.equal(big.h1.size, 40.5);
  assert.equal(big.p.leading, 1.9);
  assert.equal(big.small.leading, 1, 'leading-none never scales');

  const theme = generateSystem(sys({ type: { h1: { size: 44, weight: 700 }, code: { font: 'body' } } }), base);
  assert.deepEqual(theme.semantic.type.h1, { size: 44, leading: 1.1111, weight: 700, tracking: -0.025, font: '{primitive.font.family.heading}' });
  assert.equal(theme.semantic.type.code.font, '{primitive.font.family.body}');
  assert.equal(theme.semantic.type.h2, undefined, 'only edited styles are written');
  assert.equal(theme.semantic.type.size, 16, 'the typeset stays');
  assert.deepEqual(textStyles(sys({ type: { h1: { size: 44 } } })).h1.edited, ['size']);
});

test('fonts take any Google family; a curated one folds into the recipe', () => {
  const doc = normalizeSystem(sys({ fonts: { heading: 'Inter Tight', body: 'Inter', mono: 'jetbrains mono' } }));
  assert.deepEqual(doc.fonts, { heading: 'Inter Tight' });
  assert.deepEqual([doc.recipe.font.body, doc.recipe.font.mono], ['inter', 'jetbrains-mono']);
  assert.equal(generateSystem(doc, base).fonts.heading, 'Inter Tight');
  assert.ok(!validateSystem(sys({ fonts: { heading: 'Comic <Sans>' } })).ok);
});

test('radius, shadow and border overrides, and extras as their own tokens', () => {
  const doc = sys({
    radius: { md: 6, '2xl': 28 },
    shadow: { 2: [{ y: 6, blur: 16, alpha: 0.15 }], 3: { light: [{ y: 2, blur: 4, alpha: 0.2, inset: true }], dark: [] } },
    border: { width: 2, style: 'dashed' },
    extras: {
      color: [{ name: 'sunset', seed: '#ff7700' }, { name: 'ink', value: { light: '#111111', dark: '#eeeeee' } }],
      text: [{ name: 'eyebrow', size: 12, weight: 600, tracking: 0.08 }],
      radius: [{ name: 'hero', value: 32 }],
      shadow: [{ name: 'glow', layers: [{ blur: 24, color: '#7c3aed', alpha: 0.5 }] }],
      border: [{ name: 'thick', width: 4 }],
    },
  });
  const theme = generateSystem(doc, base);
  assert.equal(theme.semantic.radius.md, 6);
  assert.deepEqual(systemRadii(doc, base, theme), { sm: 6, md: 6, lg: 10, xl: 16, '2xl': 28 });
  assert.deepEqual(theme.semantic.shadow[2].light, [{ offsetX: 0, offsetY: 6, blur: 16, spread: 0, color: '#00000026' }]);
  assert.equal(theme.semantic.shadow[3].light[0].inset, true);
  assert.deepEqual(theme.semantic.shadow[1], generateTheme(DEFAULT_RECIPE, base).semantic.shadow[1], 'other levels stay');
  assert.deepEqual([theme.borderWidth, theme.semantic.border.style, theme.field.border, theme.semantic.field['border-width']], [2, 'dashed', 2, 2]);
  assert.equal(theme.extra.color.sunset['600'].$value === undefined, false);
  assert.ok(Object.values(theme.extra.color.sunset).some((t) => t.$value === '#ff7700'));
  assert.deepEqual(theme.extra.color.ink.$value, { light: '#111111', dark: '#eeeeee' });
  assert.equal(theme.extra.text.eyebrow.font.$value, '{primitive.font.family.body}');
  assert.equal(theme.extra.radius.hero.$value, 32);
  assert.equal(theme.extra.border.thick.width.$value, 4);
  assert.deepEqual(systemOverrides(doc).filter((p) => p.startsWith('extras')), ['extras.color.sunset', 'extras.color.ink', 'extras.text.eyebrow', 'extras.radius.hero', 'extras.shadow.glow', 'extras.border.thick']);
});

// ---------- schema --------------------------------------------------------------------------------

test('validation names every problem, with its path', () => {
  const { ok, errors } = validateSystem({
    kind: 'halftone.system',
    colors: { pink: {}, danger: { seed: 'red', anchor: '650' }, neutral: { anchor: '500' } },
    roles: { primary: { light: 'brand.601', dark: 'teal.500' }, nope: {} },
    type: { h1: { weight: 850, size: -1 } },
    extras: { color: [{ name: 'Sunset', value: '#fff' }, { name: 'primary', value: '#ffffff' }] },
    surprise: true,
  });
  assert.equal(ok, false);
  for (const fragment of [
    'surprise:',
    'colors.pink:',
    'colors.danger.seed:',
    'colors.danger.anchor:',
    'colors.neutral.anchor: pins a seed',
    'roles.primary.light: "brand" has no step "601"',
    'roles.primary.dark:',
    'roles.nope:',
    'type.h1.weight:',
    'type.h1.size:',
    'extras.color[0].name:',
    'extras.color[0].value:',
    'extras.color[1].name: "primary" is a built-in',
  ]) {
    assert.ok(errors.some((e) => e.startsWith(fragment)), `${fragment}\n${errors.join('\n')}`);
  }
  assert.throws(() => normalizeSystem({ v: 2 }), /newer @halftone-ds\/tokens/);
  assert.throws(() => normalizeSystem('nope'), /JSON object/);
});

test('components is reserved: kept as given, checked as an object, ignored by the generator', () => {
  const doc = normalizeSystem(sys({ components: { button: { radius: 4, height: 44, role: 'primary' }, chip: {} } }));
  assert.deepEqual(doc.components, { button: { radius: 4, height: 44, role: 'primary' }, chip: {} });
  assert.deepEqual(normalizeSystem(sys()).components, {});
  assert.deepEqual(generateSystem(doc, base), generateTheme(DEFAULT_RECIPE, base));
  assert.equal(hasOverrides(doc), false, 'nothing is generated from it yet');
  const { errors } = validateSystem(sys({ components: { Button: {}, chip: 3 } }));
  assert.ok(errors.some((e) => e.startsWith('components.Button:')) && errors.some((e) => e.startsWith('components.chip:')), errors.join('\n'));
  assert.ok(!validateSystem(sys({ components: [] })).ok);
  // It travels with the record.
  assert.deepEqual(applySystem(base, doc).tokens.$extensions['com.halftonedesignsystem.theme'].system.components, doc.components);
});

test('normalising is idempotent and survives JSON', () => {
  const doc = createSystem({
    name: '  Acme  ',
    colors: { brand: { seed: '#7C3AED' }, neutral: { seed: 'slate' }, danger: { seed: '#E5484D', steps: { 700: '#AA0000' } } },
    roles: { primary: { dark: 'brand.300' } },
    shadow: { 2: [{ y: 4 }] },
    brand: { name: 'Acme', logoDark: { svg: '<svg/>', aspect: 1 } },
  });
  assert.equal(doc.name, 'Acme');
  assert.equal(doc.recipe.brand, '#7c3aed', 'the brand seed is the recipe');
  assert.equal(doc.recipe.neutral, 'slate');
  assert.deepEqual(doc.colors, { danger: { seed: '#e5484d', steps: { 700: '#aa0000' } } });
  assert.equal(doc.brand.logoDark, undefined, 'no dark logo without a logo');
  assert.match(doc.id, /.+/);
  assert.deepEqual(normalizeSystem(doc), doc);
  assert.deepEqual(normalizeSystem(JSON.parse(JSON.stringify(doc))), doc);
});

// ---------- migration -----------------------------------------------------------------------------

test('migrate builds a system from a recipe, a code or a document, and round-trips', () => {
  const rand = rng(21);
  for (const recipe of [DEFAULT_RECIPE, ...PRESETS.map((p) => ({ ...p.recipe, preset: p.id })), ...Array.from({ length: 100 }, () => randomRecipe(rand))]) {
    const doc = migrate(recipe, undefined, FIXED);
    const back = systemToRecipe(doc);
    assert.deepEqual(back.recipe, normalizeRecipe(recipe));
    assert.equal(back.code, encodeRecipe(recipe));
    assert.deepEqual(back.lost, []);
    assert.equal(systemCode(doc), encodeRecipe(recipe));
    assert.deepEqual(migrate(back.recipe, undefined, FIXED), doc, 'recipe → system → recipe → system');
    // A code holds no preset label.
    const { preset, ...unlabelled } = doc.recipe;
    assert.deepEqual(migrate(encodeRecipe(recipe), undefined, FIXED).recipe, unlabelled, 'from its code');
    assert.deepEqual(migrate(doc), doc, 'a document is normalised, not rebuilt');
  }
  const calm = PRESETS.find((p) => p.id === 'calm');
  const named = migrate({ ...calm.recipe, preset: 'calm' }, { name: '', iconBackground: 'white', logo: { svg: '<svg/>', aspect: 3 } });
  assert.equal(named.name, calm.name);
  assert.equal(named.preset, 'calm');
  assert.equal(named.brand.iconBackground, 'white');
  assert.equal(migrate(DEFAULT_RECIPE, { name: 'Acme', iconBackground: 'brand' }).name, 'Acme');
  // Overrides are what a recipe loses.
  const edited = sys({ roles: { primary: { dark: 'brand.300' } } });
  assert.deepEqual(systemToRecipe(edited), { recipe: edited.recipe, code: null, lost: ['roles.primary.dark'] });
});

// ---------- apply ---------------------------------------------------------------------------------

const EDITED = {
  name: 'Acme',
  recipe: { brand: '#7c3aed', neutral: 'slate' },
  colors: { danger: { seed: '#e5484d' } },
  roles: { primary: { dark: 'brand.300' } },
  type: { h1: { size: 44 } },
  fonts: { heading: 'Inter Tight' },
  radius: { md: 6 },
  border: { width: 2, style: 'dashed' },
  extras: { color: [{ name: 'sunset', seed: '#ff7700' }] },
  brand: { name: 'Acme', iconBackground: 'brand', logo: { svg: '<svg/>', aspect: 2 }, mark: { png: 'data:image/png;base64,AAAA', aspect: 1 } },
};

test('applySystem records the document without brand images, and is idempotent', () => {
  const { tokens, theme, system } = applySystem(base, EDITED);
  const record = tokens.$extensions['com.halftonedesignsystem.theme'];
  assert.equal(record.code, undefined, 'no code for a system with overrides');
  assert.deepEqual(record.recipe, theme.recipe);
  assert.deepEqual(record.system.brand, { name: 'Acme', iconBackground: 'brand' });
  assert.deepEqual({ ...record.system, brand: system.brand }, system);
  assert.equal(tokens.primitive.color.danger['600'].$value, '#e5484d');
  assert.equal(tokens.semantic.type.h1.size.$value, 44);
  assert.equal(tokens.semantic.type.h1.font.$type, 'fontFamily');
  assert.equal(tokens.semantic.radius.md.$value, 6);
  assert.equal(tokens.semantic.border.style.$type, 'strokeStyle');
  assert.equal(tokens.primitive.font.family.heading.$value, 'Inter Tight');
  assert.ok(tokens.extra.color.sunset);
  assert.deepEqual(applySystem(tokens, EDITED).tokens, tokens);
  assert.deepEqual(base, JSON.parse(readFileSync(join(pkg, 'test/fixtures/halftone-tokens.json'), 'utf8')), 'the input is not mutated');

  const status = themeStatus(tokens);
  assert.equal(status.code, null);
  assert.equal(status.system.name, 'Acme');
  assert.deepEqual(status.drift, []);
  const edited = JSON.parse(JSON.stringify(tokens));
  edited.semantic.type.h1.size.$value = 48;
  assert.deepEqual(themeStatus(edited).drift, ['semantic.type.h1.size']);

  // A system with no overrides keeps its code.
  const plain = applySystem(base, migrate(DEFAULT_RECIPE, { name: 'Plain', iconBackground: 'brand' }));
  assert.equal(themeStatus(plain.tokens).code, encodeRecipe(DEFAULT_RECIPE));
});

test('applying another theme removes what the system owned and restores its status ramps', () => {
  const { tokens } = applySystem(base, EDITED);
  for (const next of [applyRecipe(tokens, DEFAULT_RECIPE).tokens, applySystem(tokens, migrate(DEFAULT_RECIPE)).tokens]) {
    assert.equal(next.extra, undefined);
    assert.equal(next.semantic.type.h1, undefined);
    assert.equal(next.semantic.radius.md, undefined);
    assert.equal(next.semantic.border.style, undefined);
    assert.deepEqual(next.primitive.color.danger, base.primitive.color.danger);
    assert.deepEqual(themeStatus(next).drift, []);
    // Back to the theme a clean file gets.
    assert.deepEqual(next.semantic, applyRecipe(base, DEFAULT_RECIPE).tokens.semantic);
    assert.deepEqual(next.primitive, applyRecipe(base, DEFAULT_RECIPE).tokens.primitive);
  }
});

test('a system builds: fixed corners and edited text styles reach the CSS, the new tokens collide with nothing', async () => {
  const { tokens } = applySystem(base, EDITED);
  const dir = mkdtempSync(join(tmpdir(), 'halftone-system-'));
  try {
    const path = join(dir, 'tokens.json');
    writeFileSync(path, JSON.stringify(tokens));
    const ctx = await loadTokens(path);
    ctx.header = 'test';
    assert.deepEqual(ctx.radius.steps.find((s) => s.name === 'md'), { name: 'md', scale: 0.8, px: 6, fixed: true });
    assert.equal(ctx.textStyles.h1.size, 44);
    assert.equal(ctx.textStyles.h1.edited, true);
    assert.equal(ctx.textStyles.h2.edited, false);
    const [web] = shadcnWeb(ctx, { out: 'web.css' });
    assert.match(web.contents, /--radius-md: 0\.375rem;/);
    assert.match(web.contents, /--radius-lg: var\(--radius\);/);
    const [css, tw] = nativewind3(ctx, { css: 'global.css', tailwind: 'theme.js' });
    assert.doesNotMatch(css.contents, /--radius-md|--type-h1-font/);
    // The edited h1 (44px, 800, leading 1.1111 × size) is its variables; the others keep the typeset's.
    assert.match(css.contents, /--type-h1-size: 2\.75rem;\n    --type-h1-leading: 3\.0555rem;\n    --type-h1-weight: 800;\n    --type-h1-tracking: -0\.025em;/);
    assert.match(css.contents, /--type-h2-size: 1\.875rem;/);
    assert.match(web.contents, /--type-h1-size: 2\.75rem;\n  --type-h1-leading: 1\.1111;\n  --type-h1-weight: 800;/);
    assert.match(web.contents, /@utility type-h1 \{/);
    const theme = new Function('module', `${tw.contents}; return module.exports;`)({});
    assert.equal(theme.borderRadius.md, '0.375rem');
    assert.equal(theme.fontSize['type-h1'], 'var(--type-h1-size)');
    assert.equal(theme.fontWeight['type-code'], 'var(--type-code-weight)');
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});

// ---------- CLI -----------------------------------------------------------------------------------

test('the CLI applies a .halftone.json, shows it, and refuses a code for one with overrides', () => {
  const root = mkdtempSync(join(tmpdir(), 'halftone-cli-'));
  const cli = (...args) => spawnSync(process.execPath, [join(pkg, 'cli.mjs'), 'theme', ...args, '--root', root], { encoding: 'utf8' });
  try {
    mkdirSync(join(root, 'tokens'));
    writeFileSync(join(root, 'tokens/tokens.json'), JSON.stringify(applyRecipe(base, DEFAULT_RECIPE).tokens, null, 2));
    writeFileSync(join(root, 'tokens/tokens.config.json'), JSON.stringify({ source: 'tokens/tokens.json', targets: { 'shadcn-web': { out: 'web.css' }, fonts: { platform: 'next', out: 'fonts.ts' } } }));
    writeFileSync(join(root, 'acme.halftone.json'), JSON.stringify(EDITED));
    writeFileSync(join(root, 'plain.halftone.json'), JSON.stringify(migrate({ ...DEFAULT_RECIPE, brand: '#7c3aed' }, { name: 'Plain', iconBackground: 'brand' })));

    const applied = cli('apply', 'acme.halftone.json');
    assert.equal(applied.status, 0, applied.stderr);
    assert.match(applied.stdout, /System "Acme"/);
    assert.match(applied.stdout, /Overrides \(no theme code carries these/);
    const tokens = JSON.parse(readFileSync(join(root, 'tokens/tokens.json'), 'utf8'));
    assert.equal(tokens.$extensions['com.halftonedesignsystem.theme'].system.name, 'Acme');
    assert.equal(tokens.$extensions['com.halftonedesignsystem.theme'].system.brand.logo, undefined, 'no brand images in tokens.json');
    assert.match(readFileSync(join(root, 'web.css'), 'utf8'), /--radius-md: 0\.375rem;/);
    assert.match(readFileSync(join(root, 'fonts.ts'), 'utf8'), /Inter_Tight/);

    const shown = cli('show', '--check');
    assert.equal(shown.status, 0, shown.stderr);
    assert.match(shown.stdout, /System "Acme" \(no theme code: it has overrides\)/);
    assert.match(shown.stdout, /roles: primary\.dark/);

    const encoded = cli('encode', 'acme.halftone.json');
    assert.equal(encoded.status, 1);
    assert.match(encoded.stderr, /can't carry/);
    assert.equal(cli('resolve').status, 1);

    // A system with no overrides is a code.
    const plain = cli('encode', 'plain.halftone.json');
    assert.equal(plain.status, 0, plain.stderr);
    assert.equal(plain.stdout.trim(), encodeRecipe({ ...DEFAULT_RECIPE, brand: '#7c3aed' }));
    assert.equal(cli('apply', 'plain.halftone.json').status, 0);
    assert.equal(cli('resolve').stdout.trim(), plain.stdout.trim());

    // An invalid document names its problems.
    writeFileSync(join(root, 'bad.halftone.json'), JSON.stringify({ kind: 'halftone.system', roles: { primary: { light: 'brand.601' } } }));
    const bad = cli('apply', 'bad.halftone.json', '--force');
    assert.equal(bad.status, 1);
    assert.match(bad.stderr, /roles\.primary\.light/);
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
});

test('an edited style\'s font role reaches the build from tokens.json', () => {
  const { tokens } = applySystem(base, { ...EDITED, type: { code: { font: 'body', tracking: 0.05 } } });
  const edits = textEdits(tokens.semantic.type);
  // An edited style is written whole (generateSystem), so every key is there.
  assert.deepEqual(Object.keys(edits), ['code']);
  assert.equal(edits.code.font, 'body');
  assert.equal(edits.code.tracking, 0.05);
  const styles = resolveTextStyles(typeScale(TYPE), edits);
  assert.equal(styles.code.font, 'body');
  assert.equal(styles.code.weight, 600, 'the keys not edited keep the default');
  assert.equal(styles.h1.size, 36, 'and the styles not edited keep the typeset');
  assert.equal(textStyleVars(styles, 'hsl')['--type-code-tracking'], '0.05em');
  assert.equal(textStyleVars(styles, 'hsl')['--type-code-tracking-native'], undefined, 'one tracking, in em, on every platform');
});
