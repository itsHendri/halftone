'use client';
import { useTheme } from 'next-themes';
import * as React from 'react';

const noop = () => () => {};

/**
 * The site's light or dark, for code that renders by it. The server can't know it, so it is 'light' until hydrated:
 * reading next-themes' resolvedTheme straight away renders differently from the server in dark mode.
 */
export function useMode(): 'light' | 'dark' {
  const { resolvedTheme } = useTheme();
  const hydrated = React.useSyncExternalStore(noop, () => true, () => false);
  return hydrated && resolvedTheme === 'dark' ? 'dark' : 'light';
}
