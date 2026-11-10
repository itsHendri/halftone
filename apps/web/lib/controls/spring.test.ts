import assert from 'node:assert/strict';
import { describe, test } from 'node:test';
import { convertSpring, parseSpring, physicsToTime, sampleSpring, settleTime, springAt, springToCss, timeToPhysics, type SpringPhysics } from '@/lib/controls/spring';

const close = (a: number, b: number, eps = 1e-2) => assert.ok(Math.abs(a - b) < eps, `${a} ≈ ${b}`);

describe('time and physics', () => {
  test('time to physics follows Motion: mass 1, period 1.2 × the visual duration', () => {
    const p = timeToPhysics({ visualDuration: 0.5, bounce: 0 });
    assert.equal(p.mass, 1);
    close(p.stiffness, ((2 * Math.PI) / 0.6) ** 2, 1e-2);
    close(p.damping, 2 * Math.sqrt(p.stiffness), 1e-2);
  });

  test('bounce lowers the damping', () => {
    const still = timeToPhysics({ visualDuration: 0.4, bounce: 0 });
    const bouncy = timeToPhysics({ visualDuration: 0.4, bounce: 0.5 });
    assert.equal(still.stiffness, bouncy.stiffness);
    close(bouncy.damping, still.damping / 2, 1e-2);
  });

  test('round-trips both ways', () => {
    for (const t of [
      { visualDuration: 0.3, bounce: 0.15 },
      { visualDuration: 1.2, bounce: 0.6 },
    ]) {
      const back = physicsToTime(timeToPhysics(t));
      close(back.visualDuration, t.visualDuration, 1e-3);
      close(back.bounce, t.bounce, 1e-3);
    }
  });

  test('mass folds in: twice the mass and stiffness is the same spring', () => {
    const a = physicsToTime({ stiffness: 200, damping: 20, mass: 1 });
    const b = physicsToTime({ stiffness: 400, damping: 40, mass: 2 });
    assert.deepEqual(a, b);
  });

  test('an overdamped spring reads as bounce 0', () => {
    assert.equal(physicsToTime({ stiffness: 100, damping: 200, mass: 1 }).bounce, 0);
  });

  test('the mode switch converts and keeps the motion', () => {
    const time = { mode: 'time' as const, visualDuration: 0.4, bounce: 0.3 };
    const physics = convertSpring(time, 'physics');
    assert.equal(physics.mode, 'physics');
    const back = convertSpring(physics, 'time');
    assert.equal(back.mode, 'time');
    if (back.mode === 'time') close(back.visualDuration, 0.4, 1e-3);
    assert.equal(convertSpring(time, 'time'), time);
  });
});

describe('motion', () => {
  const regimes: Record<string, SpringPhysics> = {
    under: { stiffness: 300, damping: 10, mass: 1 },
    critical: { stiffness: 100, damping: 20, mass: 1 },
    over: { stiffness: 100, damping: 60, mass: 1 },
  };

  test('every regime starts at 0 and comes to rest at 1', () => {
    for (const [name, p] of Object.entries(regimes)) {
      assert.equal(springAt(p, 0), 0, name);
      close(springAt(p, 10), 1, 1e-3);
    }
  });

  test('only an underdamped spring overshoots', () => {
    const peak = (p: SpringPhysics) => Math.max(...Array.from({ length: 400 }, (_, i) => springAt(p, i / 100)));
    assert.ok(peak(regimes.under) > 1.1);
    assert.ok(peak(regimes.critical) <= 1 + 1e-9);
    assert.ok(peak(regimes.over) <= 1 + 1e-9);
  });

  test('settles later the bouncier it is, and never past the cap', () => {
    const calm = settleTime({ mode: 'time', visualDuration: 0.3, bounce: 0 });
    const bouncy = settleTime({ mode: 'time', visualDuration: 0.3, bounce: 0.6 });
    assert.ok(calm > 0 && calm < bouncy);
    assert.equal(settleTime({ stiffness: 100, damping: 0, mass: 1 }, { max: 3 }), 3);
  });

  test('samples run from release to rest', () => {
    const samples = sampleSpring({ mode: 'time', visualDuration: 0.3, bounce: 0.2 }, { points: 30 });
    assert.equal(samples.length, 31);
    assert.equal(samples[0].value, 0);
    close(samples.at(-1)!.value, 1, 2e-3);
  });

  test('CSS linear() with a duration', () => {
    const css = springToCss({ mode: 'time', visualDuration: 0.3, bounce: 0.2 }, 10);
    assert.match(css.easing, /^linear\(0, [\d., ]+\)$/);
    assert.equal(css.easing.split(',').length, 11);
    assert.ok(css.duration > 200 && css.duration < 2000);
  });
});

describe('parseSpring', () => {
  test('reads either mode, with or without `mode`', () => {
    assert.deepEqual(parseSpring({ visualDuration: 0.3, bounce: 0.2 }), { mode: 'time', visualDuration: 0.3, bounce: 0.2 });
    assert.deepEqual(parseSpring({ stiffness: 200, damping: 20 }), { mode: 'physics', stiffness: 200, damping: 20, mass: 1 });
    assert.deepEqual(parseSpring({ mode: 'time', visualDuration: 0.3 }), { mode: 'time', visualDuration: 0.3, bounce: 0 });
  });

  test('clamps bounce and refuses what isn’t a spring', () => {
    assert.deepEqual(parseSpring({ visualDuration: 0.3, bounce: 3 }), { mode: 'time', visualDuration: 0.3, bounce: 0.95 });
    assert.equal(parseSpring({ duration: 300 }), null);
    assert.equal(parseSpring('snappy'), null);
    assert.equal(parseSpring(null), null);
  });
});
