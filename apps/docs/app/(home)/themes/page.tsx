import type { Metadata } from 'next';
import Link from 'next/link';
import { MovedTo } from '@/components/moved-to';

/**
 * /themes moved to /studio (apps/docs/design/studio-wireframes.md). Cloudflare answers it with a 301 first
 * (scripts/build-docs.mjs, `_redirects`); this page covers everywhere else (next dev), keeping `?t=` and `?s=`.
 */
export const metadata: Metadata = {
  title: 'Studio',
  robots: { index: false },
  alternates: { canonical: '/studio/' },
};

export default function ThemesPage() {
  return (
    <main className="mx-auto flex w-full max-w-xl flex-1 flex-col gap-2 px-4 py-16">
      <MovedTo to="/studio/" />
      <h1 className="text-2xl font-semibold">The theme studio is now Studio</h1>
      <p className="text-muted-foreground">
        Taking you to{' '}
        <Link href="/studio" className="text-foreground underline underline-offset-2">
          Studio
        </Link>
        …
      </p>
    </main>
  );
}
