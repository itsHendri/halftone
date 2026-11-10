import assert from 'node:assert/strict';
import { describe, test } from 'node:test';
import { bezierEasing, bezierPath, bezierToCss, clampBezier, EASING_PRESETS, parseBezier, sampleBezier, type Bezier } from '@/lib/controls/bezier';

const close = (a: number, b: number, eps = 1e-3) => assert.ok(Math.abs(a - b) < eps, `${a} ≈ ${b}`);

describe('bezierEasing', () => {
  test('starts at 0 and ends at 1', () => {
    const ease = bezierEasing(EASING_PRESETS.standard);
    assert.equal(ease(0), 0);
    assert.equal(ease(1), 1);
    assert.equal(ease(-1), 0);
    assert.equal(ease(2), 1);
  });

  test('linear is the identity', () => {
    const ease = bezierEasing(EASING_PRESETS.linear);
    for (const t of [0.1, 0.25, 0.5, 0.9]) close(ease(t), t);
  });

  test('matches CSS ease at known points', () => {
    // Reference values for cubic-bezier(0.25, 0.1, 0.25, 1), from the browser's own solver.
    const ease = bezierEasing(EASING_PRESETS.ease);
    close(ease(0.25), 0.4094);
    close(ease(0.5), 0.8024);
    close(ease(0.75), 0.9604);
  });

  test('ease-in-out is symmetric', () => {
    const ease = bezierEasing(EASING_PRESETS['ease-in-out']);
    close(ease(0.5), 0.5);
    for (const t of [0.1, 0.3]) close(ease(t), 1 - ease(1 - t));
  });

  test('an overshooting curve goes past 1 and comes back', () => {
    const values = sampleBezier(EASING_PRESETS.overshoot, 100).map((s) => s.value);
    assert.ok(Math.max(...values) > 1.05);
    assert.equal(values.at(-1), 1);
  });

  test('stays monotonic in time for a steep curve', () => {
    const samples = sampleBezier([0.9, 0, 0.1, 1], 200);
    for (let i = 1; i < samples.length; i++) assert.ok(samples[i].value >= samples[i - 1].value - 1e-9);
  });
});

describe('reading and writing', () => {
  test('parses CSS, lists, arrays and preset names', () => {
    assert.deepEqual(parseBezier('cubic-bezier(0.2, 0, 0, 1)'), [0.2, 0, 0, 1]);
    assert.deepEqual(parseBezier('0.2 0 0 1'), [0.2, 0, 0, 1]);
    assert.deepEqual(parseBezier('[0.2, 0, 0, 1]'), [0.2, 0, 0, 1]);
    assert.deepEqual(parseBezier([0.34, 1.56, 0.64, 1]), [0.34, 1.56, 0.64, 1]);
    assert.deepEqual(parseBezier('ease-out'), EASING_PRESETS['ease-out']);
  });

  test('refuses an x outside 0–1 and anything else', () => {
    assert.equal(parseBezier([1.2, 0, 0, 1]), null);
    assert.equal(parseBezier('cubic-bezier(0, 0, 1)'), null);
    assert.equal(parseBezier('bouncy'), null);
    assert.equal(parseBezier(42), null);
  });

  test('a parsed preset is a copy', () => {
    const curve = parseBezier('linear') as Bezier;
    curve[0] = 0.5;
    assert.deepEqual(EASING_PRESETS.linear, [0, 0, 1, 1]);
  });

  test('writes CSS, keywords when asked', () => {
    assert.equal(bezierToCss([0.2, 0, 0, 1]), 'cubic-bezier(0.2, 0, 0, 1)');
    assert.equal(bezierToCss([0.42, 0, 0.58, 1], { keywords: true }), 'ease-in-out');
    assert.equal(bezierToCss([0.123456, 0, 1.5, 1]), 'cubic-bezier(0.123, 0, 1, 1)');
  });

  test('clampBezier keeps y and pulls x into range', () => {
    assert.deepEqual(clampBezier([-0.2, -0.5, 1.4, 1.6]), [0, -0.5, 1, 1.6]);
  });

  test('bezierPath draws y up in the box', () => {
    assert.equal(bezierPath([0, 0, 1, 1], 100, 100), 'M0,100 C0,100 100,0 100,0');
    assert.equal(bezierPath([0.2, 0, 0, 1], 100, 50, 10), 'M10,60 C30,60 10,10 110,10');
  });
});
