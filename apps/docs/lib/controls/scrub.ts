export type Modifier = 'fine' | 'normal' | 'coarse';
export type Range = { min?: number; max?: number; step: number };

/** How far each modifier moves, as a multiple of the step. */
export const MODIFIER_SCALE: Record<Modifier, number> = { fine: 0.1, normal: 1, coarse: 10 };
/** Pixels of drag per step. */
export const PX_PER_STEP = 4;

/** Shift is fine and Alt (Option) is coarse; Shift wins when both are held. */
export function modifierOf(e: { shiftKey?: boolean; altKey?: boolean }): Modifier {
  return e.shiftKey ? 'fine' : e.altKey ? 'coarse' : 'normal';
}

/** Decimal places in a number as written: 0.25 → 2, 1e-3 → 3, 10 → 0. */
export function decimalsOf(n: number): number {
  if (!Number.isFinite(n)) return 0;
  const [mantissa, exp] = String(n).toLowerCase().split('e');
  const places = (mantissa.split('.')[1] ?? '').length - Number(exp ?? 0);
  return Math.max(0, places);
}

export function clamp(n: number, min = -Infinity, max = Infinity): number {
  return Math.min(max, Math.max(min, n));
}

/** Rounds away float noise (0.1 + 0.2) to the places a step of `step` can produce. */
export function roundTo(n: number, step: number): number {
  return Number(n.toFixed(Math.min(10, decimalsOf(step))));
}

/** The step a modifier moves by: a tenth of 1 is 0.1, ten of 0.01 is 0.1. */
export function stepFor(range: Range, modifier: Modifier): number {
  return roundTo(range.step * MODIFIER_SCALE[modifier], range.step * MODIFIER_SCALE.fine);
}

/** The finest places a range's values can have: a fine step's. A coarse step keeps them (52.3 + 10 is 62.3). */
const precisionOf = (range: Range) => stepFor(range, 'fine');

/** One step up (+1) or down (-1), clamped to the range. */
export function nudge(value: number, direction: 1 | -1, modifier: Modifier, range: Range): number {
  return clamp(roundTo(value + direction * stepFor(range, modifier), precisionOf(range)), range.min, range.max);
}

/**
 * What a key does to the value, or null when the key isn't one of ours (so the event keeps its default). Up and Right
 * step up, Down and Left step down, Page Up/Down step coarse, Home and End go to the range's ends.
 */
export function keyAction(key: string, value: number, modifier: Modifier, range: Range): number | null {
  switch (key) {
    case 'ArrowUp':
    case 'ArrowRight':
      return nudge(value, 1, modifier, range);
    case 'ArrowDown':
    case 'ArrowLeft':
      return nudge(value, -1, modifier, range);
    case 'PageUp':
      return nudge(value, 1, 'coarse', range);
    case 'PageDown':
      return nudge(value, -1, 'coarse', range);
    case 'Home':
      return range.min !== undefined && Number.isFinite(range.min) ? range.min : null;
    case 'End':
      return range.max !== undefined && Number.isFinite(range.max) ? range.max : null;
    default:
      return null;
  }
}

/**
 * A scrub in progress: `move(dx, modifier)` gives the value for the pointer `dx` pixels from where it started. When
 * the modifier changes, the scrub carries on from the current value at the new rate.
 */
export function createScrub(start: number, range: Range, pxPerStep = PX_PER_STEP) {
  let base = start;
  let origin = 0;
  let current = start;
  // Set by the first move: a modifier held from the start is no change.
  let mode: Modifier | null = null;
  return {
    move(dx: number, modifier: Modifier = 'normal'): number {
      if (mode !== null && modifier !== mode) {
        base = current;
        origin = dx;
      }
      mode = modifier;
      const steps = Math.trunc((dx - origin) / pxPerStep);
      current = clamp(roundTo(base + steps * stepFor(range, modifier), precisionOf(range)), range.min, range.max);
      return current;
    },
    get value() {
      return current;
    },
  };
}

/** Reads a typed number: `12`, `12.5px`, `-3`, ` 4 `. Null when there's no number at the start. */
export function parseNumber(text: string): number | null {
  const m = /^\s*(-?(?:\d+\.?\d*|\.\d+))/.exec(text);
  if (!m) return null;
  const n = Number(m[1]);
  return Number.isFinite(n) ? n : null;
}

/** The value as the field shows it: the step's places (12.50 for a step of 0.01 is shown as 12.5). */
export function formatNumber(n: number, step: number): string {
  return String(roundTo(n, step));
}

/**
 * Locks the pointer to `handle` for a drag and reports how far it has gone (`dx`, pixels), until the button comes up
 * or the lock is lost. Where the lock is refused (a frame that may not lock, a test page), the drag still works from
 * the pointer's own position. Returns a function that stops the drag without calling `onEnd`.
 *
 * Ported from Nudge UI's `tokens/dragPointerLock.ts` by way of Codename's panel. MIT License, Copyright (c) 2026
 * Charles Smart (https://github.com/charlessmart/nudge-ui). The full notice is at the end of this file.
 */
export function startDragLock(handle: HTMLElement, startX: number, onMove: (dx: number, e: MouseEvent) => void, onEnd: (moved: boolean) => void): () => void {
  const doc = handle.ownerDocument;
  let dx = 0;
  let moved = false;
  let locked = false;
  let stopped = false;

  const isLocked = () => doc.pointerLockElement === handle;
  const onLockChange = () => {
    if (isLocked()) locked = true;
    else if (locked) end();
  };
  const onMouseMove = (e: MouseEvent) => {
    if (stopped) return;
    dx = isLocked() ? dx + e.movementX : e.clientX - startX;
    if (dx !== 0) moved = true;
    onMove(dx, e);
  };
  const onMouseUp = (e: MouseEvent) => {
    if (e.button === 0) end();
  };

  function stop() {
    if (stopped) return;
    stopped = true;
    doc.removeEventListener('mousemove', onMouseMove);
    doc.removeEventListener('mouseup', onMouseUp);
    doc.removeEventListener('pointerlockchange', onLockChange);
    if (isLocked()) doc.exitPointerLock();
  }
  function end() {
    if (stopped) return;
    stop();
    onEnd(moved);
  }

  doc.addEventListener('mousemove', onMouseMove);
  doc.addEventListener('mouseup', onMouseUp);
  doc.addEventListener('pointerlockchange', onLockChange);
  try {
    // Older engines return nothing; a refusal keeps the plain drag.
    const request = handle.requestPointerLock?.() as unknown as Promise<void> | undefined;
    if (request && typeof request.catch === 'function') request.catch(() => {});
  } catch {
    // Plain drag.
  }
  return stop;
}

/*
 * startDragLock is ported from Nudge UI:
 *
 * MIT License
 *
 * Copyright (c) 2026 Charles Smart
 *
 * Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated
 * documentation files (the "Software"), to deal in the Software without restriction, including without limitation the
 * rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the Software, and to
 * permit persons to whom the Software is furnished to do so, subject to the following conditions:
 *
 * The above copyright notice and this permission notice shall be included in all copies or substantial portions of the
 * Software.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE
 * WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR
 * COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR
 * OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
 */
