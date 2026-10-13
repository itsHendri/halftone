import type * as React from 'react';

/**
 * Arrow keys for a radio group (WAI-ARIA radio pattern): the group is one tab stop, and the arrows, Home and End
 * move between its `[role="radio"]` items. Give the checked item (or the first, when none is) `tabIndex={0}` and
 * the rest `-1` with `rovingTabIndex`.
 *
 * `select: true` clicks the item it lands on, so the arrow also picks it (a row of chips). Leave it off where focus
 * already previews and Enter picks (the studio's pickers).
 */
export function rovingKeyDown(e: React.KeyboardEvent<HTMLElement>, { select = false }: { select?: boolean } = {}) {
  const keys = ['ArrowDown', 'ArrowRight', 'ArrowUp', 'ArrowLeft', 'Home', 'End'];
  if (!keys.includes(e.key)) return;
  const items = Array.from(e.currentTarget.querySelectorAll<HTMLElement>('[role="radio"]:not([disabled])'));
  if (!items.length) return;
  const current = items.indexOf(document.activeElement as HTMLElement);
  const next =
    e.key === 'Home'
      ? 0
      : e.key === 'End'
        ? items.length - 1
        : (Math.max(current, 0) + (e.key === 'ArrowDown' || e.key === 'ArrowRight' ? 1 : items.length - 1)) % items.length;
  e.preventDefault();
  items[next].focus();
  if (select) items[next].click();
}

/** `tabIndex` for item `index` of a roving group whose checked item is `checked` (-1 when none). */
export const rovingTabIndex = (index: number, checked: number) => (index === (checked < 0 ? 0 : checked) ? 0 : -1);
