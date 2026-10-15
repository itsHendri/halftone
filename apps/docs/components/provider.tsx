'use client';
import { RippleLayer } from '@/components/halftone/ripple-layer';
import SearchDialog from '@/components/search';
import { ThemePill } from '@/components/theme/theme-pill';
import { ThemeRuntime } from '@/components/theme/theme-runtime';
import { RootProvider } from 'fumadocs-ui/provider/next';
import type { ReactNode } from 'react';

export function Provider({ children }: { children: ReactNode }) {
  return (
    <RootProvider search={{ SearchDialog }}>
      <ThemeRuntime />
      {children}
      <ThemePill />
      <RippleLayer />
    </RootProvider>
  );
}
