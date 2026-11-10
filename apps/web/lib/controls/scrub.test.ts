import assert from 'node:assert/strict';
import { describe, test } from 'node:test';
import { createScrub, decimalsOf, formatNumber, keyAction, modifierOf, nudge, parseNumber, PX_PER_STEP, roundTo, stepFor } from '@/lib/controls/scrub';

describe('modifiers', () => {
  test('Shift is fine, Alt is coarse, Shift wins over Alt', () => {
    assert.equal(modifierOf({}), 'normal');
    assert.equal(modifierOf({ shiftKey: true }), 'fine');
    assert.equal(modifierOf({ altKey: true }), 'coarse');
    assert.equal(modifierOf({ shiftKey: true, altKey: true }), 'fine');
  });

  test('the step each modifier moves, without float noise', () => {
    assert.equal(stepFor({ step: 1 }, 'fine'), 0.1);
    assert.equal(stepFor({ step: 1 }, 'coarse'), 10);
    assert.equal(stepFor({ step: 0.01 }, 'fine'), 0.001);
    assert.equal(stepFor({ step: 0.01 }, 'coarse'), 0.1);
    assert.equal(stepFor({ step: 0.05 }, 'normal'), 0.05);
  });
});

describe('numbers', () => {
  test('decimalsOf reads places, exponents included', () => {
    assert.equal(decimalsOf(10), 0);
    assert.equal(decimalsOf(0.25), 2);
    assert.equal(decimalsOf(1e-3), 3);
    assert.equal(decimalsOf(1.5e-5), 6);
  });

  test('roundTo removes float noise to the step', () => {
    assert.equal(roundTo(0.1 + 0.2, 0.1), 0.3);
    assert.equal(roundTo(1.23456, 0.01), 1.23);
  });

  test('parseNumber reads a leading number and ignores a unit', () => {
    assert.equal(parseNumber('12'), 12);
    assert.equal(parseNumber(' 12.5px'), 12.5);
    assert.equal(parseNumber('-3'), -3);
    assert.equal(parseNumber('.5'), 0.5);
    assert.equal(parseNumber('px'), null);
    assert.equal(parseNumber(''), null);
  });

  test('formatNumber shows the places the step needs', () => {
    assert.equal(formatNumber(12.5, 0.01), '12.5');
    assert.equal(formatNumber(0.30000000000000004, 0.1), '0.3');
  });
});

describe('keys', () => {
  const range = { min: 0, max: 100, step: 1 };

  test('arrows step, with the modifier', () => {
    assert.equal(keyAction('ArrowUp', 10, 'normal', range), 11);
    assert.equal(keyAction('ArrowRight', 10, 'normal', range), 11);
    assert.equal(keyAction('ArrowDown', 10, 'fine', range), 9.9);
    assert.equal(keyAction('ArrowLeft', 10, 'coarse', range), 0);
  });

  test('Page Up and Down step coarse, Home and End go to the ends', () => {
    assert.equal(keyAction('PageUp', 10, 'normal', range), 20);
    assert.equal(keyAction('PageDown', 10, 'normal', range), 0);
    assert.equal(keyAction('Home', 42, 'normal', range), 0);
    assert.equal(keyAction('End', 42, 'normal', range), 100);
  });

  test('other keys are not ours, and an open range has no Home', () => {
    assert.equal(keyAction('a', 10, 'normal', range), null);
    assert.equal(keyAction('Home', 10, 'normal', { step: 1 }), null);
  });

  test('a step clamps at the range', () => {
    assert.equal(nudge(99.5, 1, 'normal', range), 100);
    assert.equal(nudge(0, -1, 'normal', range), 0);
  });
});

describe('createScrub', () => {
  const range = { min: 0, max: 100, step: 1 };

  test('one step per PX_PER_STEP pixels, either way', () => {
    const scrub = createScrub(50, range);
    assert.equal(scrub.move(PX_PER_STEP * 3), 53);
    assert.equal(scrub.move(-PX_PER_STEP * 2), 48);
    assert.equal(scrub.move(1), 50, 'less than a step is no step');
  });

  test('clamps at the ends however far the drag goes', () => {
    const scrub = createScrub(50, range);
    assert.equal(scrub.move(10_000), 100);
    assert.equal(scrub.move(-10_000), 0);
  });

  test('a modifier pressed mid-drag carries on from the current value, without a jump', () => {
    const scrub = createScrub(50, range);
    assert.equal(scrub.move(PX_PER_STEP * 2), 52);
    assert.equal(scrub.move(PX_PER_STEP * 2, 'fine'), 52, 'pressing Shift changes nothing yet');
    assert.equal(scrub.move(PX_PER_STEP * 5, 'fine'), 52.3);
    assert.equal(scrub.move(PX_PER_STEP * 5, 'coarse'), 52.3, 'switching to Alt changes nothing yet');
    assert.equal(scrub.move(PX_PER_STEP * 6, 'coarse'), 62.3);
    assert.equal(scrub.value, 62.3);
  });

  test('fine steps on a fractional step', () => {
    const scrub = createScrub(0.5, { min: 0, max: 1, step: 0.01 });
    assert.equal(scrub.move(PX_PER_STEP * 3, 'fine'), 0.503);
  });
});
