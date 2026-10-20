'use client';
import * as React from 'react';

/** Sends a moved page on to its new address, with its query (a shared `?t=`) and hash. Static export: no server redirect. */
export function MovedTo({ to }: { to: string }) {
  React.useEffect(() => {
    window.location.replace(`${to}${window.location.search}${window.location.hash}`);
  }, [to]);
  return null;
}
