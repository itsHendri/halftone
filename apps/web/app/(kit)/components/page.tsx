import type { Metadata } from 'next';
import { Suspense } from 'react';
import { ComponentsView } from '@/components/devkit/components-view';
import { COMPONENTS } from '@/registry/components';

export const metadata: Metadata = { title: 'Components' };

export default function ComponentsPage() {
  return (
    <div className="flex flex-col gap-8">
      <header className="kit-chrome flex flex-col gap-2">
        <h1 className="text-3xl font-semibold tracking-tight">Components</h1>
        <p className="text-muted-foreground max-w-2xl">
          {COMPONENTS.length} components. A prototype uses these and nothing else; DESIGN_SYSTEM.md has the rules for each.
        </p>
      </header>
      <Suspense>
        <ComponentsView />
      </Suspense>
    </div>
  );
}
