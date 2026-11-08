import { useSyncExternalStore } from 'react';

/**
 * Light, dark or the system's: the person's choice, kept in localStorage, applied as the .dark class on <html>
 * (which the kit's tokens.css reads). index.html applies the same rule before the first paint.
 */
export type Scheme = 'system' | 'light' | 'dark';

const KEY = 'theme';
const listeners = new Set<() => void>();
const darkQuery = () => window.matchMedia('(prefers-color-scheme: dark)');

function read(): Scheme {
  try {
    const value = localStorage.getItem(KEY);
    return value === 'light' || value === 'dark' ? value : 'system';
  } catch {
    return 'system';
  }
}

function apply(scheme: Scheme) {
  const dark = scheme === 'dark' || (scheme === 'system' && darkQuery().matches);
  document.documentElement.classList.toggle('dark', dark);
}

export function setScheme(scheme: Scheme) {
  try {
    if (scheme === 'system') localStorage.removeItem(KEY);
    else localStorage.setItem(KEY, scheme);
  } catch {
    // private mode: it still applies, for this visit
  }
  apply(scheme);
  listeners.forEach((listener) => listener());
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  // Following the system: a change there (sunset, a settings toggle) changes the page.
  const query = darkQuery();
  const onSystem = () => apply(read());
  query.addEventListener('change', onSystem);
  return () => {
    listeners.delete(listener);
    query.removeEventListener('change', onSystem);
  };
}

/** The current choice and a setter: `const [scheme, setScheme] = useScheme()`. */
export function useScheme() {
  return [useSyncExternalStore(subscribe, read, () => 'system' as Scheme), setScheme] as const;
}
