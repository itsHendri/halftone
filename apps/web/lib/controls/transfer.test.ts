import assert from 'node:assert/strict';
import { describe, test } from 'node:test';
import { defaultValues, inferStep, isDefault, labelOf, leaves, parseControls, setAt, type ControlConfig } from '@/lib/controls/schema';
import { describePaste, parseSettings, serializeSettings } from '@/lib/controls/transfer';

const config: ControlConfig = {
  radius: [12, 0, 48],
  opacity: 0.8,
  tint: '#2563EB',
  visible: true,
  align: { type: 'select', options: ['start', 'center', 'end'] },
  ease: { type: 'easing', default: 'cubic-bezier(0.2, 0, 0, 1)' },
  spring: { type: 'spring', default: { visualDuration: 0.3, bounce: 0.2 } },
  offset: { type: 'vec2', default: [0, 0], min: -1, max: 1 },
  shadow: { blur: [8, 0, 40], y: [2, -10, 10, 1] },
};
const nodes = parseControls(config);
const defaults = defaultValues(nodes);

describe('schema inference', () => {
  test('each value gets the control its type says', () => {
    const kinds = Object.fromEntries(leaves(nodes).map((n) => [n.path, n.kind]));
    assert.deepEqual(kinds, {
      radius: 'number',
      opacity: 'number',
      tint: 'colour',
      visible: 'switch',
      align: 'select',
      ease: 'easing',
      spring: 'spring',
      offset: 'vec2',
      'shadow.blur': 'number',
      'shadow.y': 'number',
    });
  });

  test('ranges and steps are inferred', () => {
    const [radius, opacity] = nodes;
    assert.deepEqual([radius.kind === 'number' && radius.min, radius.kind === 'number' && radius.max, radius.kind === 'number' && radius.step], [0, 48, 0.5]);
    assert.deepEqual([opacity.kind === 'number' && opacity.min, opacity.kind === 'number' && opacity.max, opacity.kind === 'number' && opacity.step], [0, 1, 0.01]);
    assert.equal(inferStep(0, 1, 0.35), 0.01);
    assert.equal(inferStep(0, 1000), 10);
  });

  test('labels come from keys; short choices are segmented', () => {
    assert.equal(labelOf('blurRadius'), 'Blur radius');
    assert.equal(labelOf('blur_radius'), 'Blur radius');
    const align = nodes.find((n) => n.key === 'align');
    assert.ok(align?.kind === 'select' && align.display === 'segmented');
  });

  test('defaults keep the config’s shape, hex lower-cased', () => {
    assert.equal(defaults.tint, '#2563eb');
    assert.deepEqual(defaults.shadow, { blur: 8, y: 2 });
    assert.deepEqual(defaults.spring, { mode: 'time', visualDuration: 0.3, bounce: 0.2 });
  });

  test('a plain string that isn’t a colour is an error that says what to use', () => {
    assert.throws(() => parseControls({ name: 'hello' }), /select/);
  });

  test('isDefault compares by value', () => {
    const offset = leaves(nodes).find((n) => n.path === 'offset')!;
    assert.ok(isDefault(offset, [0, 0]));
    assert.ok(!isDefault(offset, [0, 0.5]));
  });
});

describe('copy and paste', () => {
  test('round-trips through the wrapped format', () => {
    const edited = setAt(setAt(defaults, 'shadow.blur', 20), 'tint', '#e11d48');
    const text = serializeSettings(edited, 'Card');
    assert.match(text, /"\$controls": 1/);
    const result = parseSettings(text, nodes, defaults);
    assert.ok(result.ok);
    assert.deepEqual(result.values, edited);
    assert.deepEqual(result.skipped, []);
  });

  test('takes a bare values object, and keeps what it doesn’t mention', () => {
    const result = parseSettings(JSON.stringify({ radius: 20 }), nodes, defaults);
    assert.ok(result.ok);
    assert.equal(result.values.radius, 20);
    assert.equal(result.values.opacity, 0.8);
    assert.deepEqual(result.applied, ['radius']);
  });

  test('clamps out-of-range numbers and skips the wrong type or an unknown key', () => {
    const result = parseSettings(JSON.stringify({ radius: 500, opacity: 'high', shadow: { y: -99, spread: 4 }, extra: 1 }), nodes, defaults);
    assert.ok(result.ok);
    assert.equal(result.values.radius, 48);
    assert.equal((result.values.shadow as { y: number }).y, -10);
    assert.equal(result.values.opacity, 0.8);
    assert.deepEqual(
      result.skipped.map((s) => s.path),
      ['opacity', 'shadow.spread', 'extra']
    );
    assert.match(describePaste(result), /^Pasted 2 settings; skipped opacity \(not a number\)/);
  });

  test('checks colours, choices, curves, springs and points', () => {
    const result = parseSettings(
      JSON.stringify({ tint: 'red', align: 'middle', ease: 'ease-out', spring: { stiffness: 300, damping: 25 }, offset: [2, -0.5] }),
      nodes,
      defaults
    );
    assert.ok(result.ok);
    assert.deepEqual(result.values.ease, [0, 0, 0.58, 1]);
    assert.deepEqual(result.values.spring, { mode: 'physics', stiffness: 300, damping: 25, mass: 1 });
    assert.deepEqual(result.values.offset, [1, -0.5]);
    assert.deepEqual(
      result.skipped.map((s) => s.path),
      ['tint', 'align']
    );
  });

  test('refuses what isn’t settings, without changing anything', () => {
    for (const text of ['not json', '[1, 2]', '{"$controls": 99, "values": {}}', '{"nothing": "here"}']) {
      const result = parseSettings(text, nodes, defaults);
      assert.equal(result.ok, false, text);
    }
  });
});
