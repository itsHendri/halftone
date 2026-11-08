'use client';
import * as React from 'react';

const QUERY = '(prefers-reduced-motion: reduce)';

/** True when the OS asks for less motion. Anything that animates in JS must check it. */
export function useReducedMotion(): boolean {
  return React.useSyncExternalStore(
    (onChange) => {
      const mql = window.matchMedia(QUERY);
      mql.addEventListener('change', onChange);
      return () => mql.removeEventListener('change', onChange);
    },
    () => window.matchMedia(QUERY).matches,
    () => false
  );
}
