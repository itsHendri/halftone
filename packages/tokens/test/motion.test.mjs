/** Motion: the recipe's speed, a system's motion edits, the codes that carry speed, and what the build writes. */
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { test } from 'node:test';
import { fileURLToPath } from 'node:url';

import { decodeRecipe, encodeRecipe } from '../lib/theme/codec.mjs';
import { applyRecipe, themeStatus } from '../lib/theme/apply.mjs';
import { generateTheme } from '../lib/theme/generate.mjs';
import { MOTION_DEFAULTS, motionFor, scaleSpring, SPEED, springAt, springCss } from '../lib/theme/motion.mjs';
import { DEFAULT_RECIPE, OPTIONS } from '../lib/theme/recipe.mjs';
import { themeVars } from '../lib/theme/vars.mjs';
import { applySystem, generateSystem, normalizeSystem, systemCode, systemOverrides, validateSystem } from '../lib/system/index.mjs';

const pkg = join(dirname(fileURLToPath(import.meta.url)), '..');
const base = JSON.parse(readFileSync(join(pkg, 'test/fixtures/halftone-tokens.json'), 'utf8'));
/** How much of the way to critical damping a spring is (its bounce, in effect). */
const ratio = ({ stiffness, damping, mass }) => damping / (2 * Math.sqrt(stiffness * mass));

test('Speed normal is the kits’ own timings; the other speeds scale durations and springs, keeping the bounce', () => {
  assert.deepEqual(motionFor('normal'), JSON.parse(JSON.stringify(MOTION_DEFAULTS)));
  const slow = motionFor('slow');
  assert.deepEqual(slow.durations, { fast: 225, base: 300, slow: 450 });
  assert.deepEqual(slow.easings, MOTION_DEFAULTS.easings, 'speed leaves the curves alone');
  for (const name of ['snappy', 'gentle']) {
    const before = MOTION_DEFAULTS.springs[name];
    const after = slow.springs[name];
    assert.ok(Math.abs(ratio(before) - ratio(after)) < 0.01, `${name} keeps its bounce`);
    // Played 1.5× as long: where the default is at t, the slow one is at 1.5t.
    assert.ok(Math.abs(springAt(before, 0.1) - springAt(after, 0.15)) < 0.01);
  }
  assert.deepEqual(scaleSpring({ stiffness: 400, damping: 40, mass: 1 }, 2), { stiffness: 100, damping: 20, mass: 1 });
  assert.equal(Object.keys(SPEED).join(), OPTIONS.speed.join(), 'every speed option has a factor');
});

test('a system’s motion edits are set values, not scaled by speed', () => {
  const m = motionFor('snappy', { durations: { base: 260 }, easings: { exit: [0.5, 0, 1, 1] }, springs: { gentle: { stiffness: 90, damping: 12, mass: 1 } } });
  assert.equal(m.durations.base, 260);
  assert.equal(m.durations.fast, Math.round(150 * 0.75));
  assert.deepEqual(m.easings.exit, [0.5, 0, 1, 1]);
  assert.deepEqual(m.springs.gentle, { stiffness: 90, damping: 12, mass: 1 });
  assert.deepEqual(m.springs.snappy, scaleSpring(MOTION_DEFAULTS.springs.snappy, 0.75));
});

test('speed rides in ht3 codes, in bits that were reserved: every older code reads as Speed normal', () => {
  // The default theme keeps its ht1 code, and a code with styles its ht3 one.
  assert.equal(encodeRecipe(DEFAULT_RECIPE), 'ht1-29B3XC60003T');
  const soft = encodeRecipe({ ...DEFAULT_RECIPE, button: 'soft' });
  assert.equal(decodeRecipe(soft).speed, 'normal');
  for (const speed of OPTIONS.speed) {
    const code = encodeRecipe({ ...DEFAULT_RECIPE, speed });
    assert.match(code, speed === 'normal' ? /^ht1-/ : /^ht3-/);
    assert.equal(decodeRecipe(code).speed, speed);
    assert.equal(encodeRecipe(decodeRecipe(code)), code);
  }
  // A speed beyond the four is a newer code's: the next reserved bits.
  const ALPHABET = '0123456789ABCDEFGHJKMNPQRSTVWXYZ';
  let bits = 0n;
  for (const ch of soft.slice(4)) bits = (bits << 5n) | BigInt(ALPHABET.indexOf(ch));
  let payload = (bits >> 7n) | (1n << 3n);
  payload = (payload << 7n) | (payload % 127n);
  let forged = '';
  for (let i = 0; i < 18; i++) {
    forged = ALPHABET[Number(payload & 31n)] + forged;
    payload >>= 5n;
  }
  assert.throws(() => decodeRecipe(`ht3-${forged}`), /newer theme code/);
});

test('a theme owns its motion: apply writes durations, easings and springs at its speed', () => {
  const { tokens } = applyRecipe(base, { ...DEFAULT_RECIPE, speed: 'relaxed' });
  assert.equal(tokens.primitive.duration.base.$value, 250);
  assert.deepEqual(tokens.primitive.easing.standard.$value, [0.2, 0, 0, 1]);
  assert.equal(tokens.primitive.spring.snappy.stiffness.$type, 'number');
  assert.match(tokens.primitive.spring.snappy.stiffness.$description, /DTCG has no spring type/);
  assert.deepEqual(
    Object.fromEntries(Object.entries(tokens.primitive.spring.gentle).map(([k, v]) => [k, v.$value])),
    scaleSpring(MOTION_DEFAULTS.springs.gentle, 1.25)
  );
  assert.deepEqual(themeStatus(tokens).drift, []);
  assert.equal(themeStatus(tokens).recipe.speed, 'relaxed');
  // Back to normal puts today's values back.
  const again = applyRecipe(tokens, DEFAULT_RECIPE).tokens;
  assert.equal(again.primitive.duration.base.$value, 200);
  assert.equal(again.primitive.spring.snappy.stiffness.$value, MOTION_DEFAULTS.springs.snappy.stiffness);
});

test('motion in a system: optional, validated, an override, and drawn', () => {
  // A document from before motion still reads, and moves as its speed says.
  const old = normalizeSystem({ name: 'Old' });
  assert.deepEqual(old.motion, {});
  assert.deepEqual(generateSystem(old, base).motion, motionFor('normal'));

  const doc = normalizeSystem({
    name: 'Moving',
    recipe: { speed: 'snappy' },
    motion: { durations: { slow: 420 }, easings: { emphasized: [0.3, 0, 0, 1.2] }, springs: { snappy: { stiffness: 500, damping: 30 } } },
  });
  assert.deepEqual(doc.motion.springs.snappy, { stiffness: 500, damping: 30, mass: 1 });
  assert.deepEqual(systemOverrides(doc).filter((p) => p.startsWith('motion.')), ['motion.durations.slow', 'motion.easings.emphasized', 'motion.springs.snappy']);
  assert.equal(systemCode(doc), null, 'a code holds the speed, not the edits');
  assert.match(systemCode({ ...doc, motion: {} }), /^ht3-/);
  const theme = generateSystem(doc, base);
  assert.equal(theme.motion.durations.slow, 420);
  assert.equal(theme.motion.durations.base, 150);
  const { tokens } = applySystem(base, doc);
  assert.equal(tokens.primitive.duration.slow.$value, 420);
  assert.equal(tokens.primitive.spring.snappy.stiffness.$value, 500);
  assert.deepEqual(themeStatus(tokens).system.motion, doc.motion);

  const bad = validateSystem({ motion: { durations: { base: -5, slower: 300 }, easings: { exit: [1.5, 0, 1, 1] }, springs: { gentle: { stiffness: 'stiff' } }, curves: {} } });
  assert.equal(bad.ok, false);
  for (const path of ['motion.durations.base', 'motion.durations.slower', 'motion.easings.exit', 'motion.springs.gentle.stiffness', 'motion.curves']) {
    assert.ok(bad.errors.some((e) => e.startsWith(`${path}:`)), `names ${path}`);
  }
});

test('motion as CSS: durations, easings, and springs as linear() with their duration', () => {
  const vars = themeVars(generateTheme(DEFAULT_RECIPE, base), 'oklch').light;
  assert.equal(vars['--duration-base'], '200ms');
  assert.equal(vars['--ease-standard'], 'cubic-bezier(0.2, 0, 0, 1)');
  assert.match(vars['--spring-snappy'], /^linear\(0, [\d., ]+, 1\)$/);
  assert.match(vars['--spring-gentle-duration'], /^\d+ms$/);
  const css = springCss(MOTION_DEFAULTS.springs.gentle, 10);
  assert.equal(css.easing.split(',').length, 11);
  assert.ok(css.duration > springCss(MOTION_DEFAULTS.springs.snappy).duration, 'gentle takes longer than snappy');
});
