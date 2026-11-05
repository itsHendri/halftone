import * as React from 'react';
import type { SectionId } from './sections';

/**
 * Which Foundations section is being read: the page's scroll spy writes it, the Studio sidebar's rows read it
 * (they live in the layout, the page in its column, so they share it here).
 */
let current: SectionId = 'brand';
const listeners = new Set<() => void>();

export function setCurrentSection(id: SectionId) {
  if (id === current) return;
  current = id;
  listeners.forEach((l) => l());
}

export function useCurrentSection(): SectionId {
  return React.useSyncExternalStore(
    (l) => {
      listeners.add(l);
      return () => {
        listeners.delete(l);
      };
    },
    () => current,
    () => 'brand'
  );
}
