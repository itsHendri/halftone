'use client';
import { useEmbedded } from '@/lib/embed';
import { ComponentList } from './component-list';

/** The page is static; whether it is embedded is only known in the browser. */
export function ComponentsView() {
  return <ComponentList embedded={useEmbedded()} />;
}
