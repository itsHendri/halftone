import type { Metadata } from 'next';
import Link from 'next/link';
import { MovedTo } from '@/components/moved-to';

/**
 * The brief wizard was removed (apps/docs/design/navigation-wireframes.md › Round two): Start a prototype explains
 * how the transcript-to-prototype skill takes a transcript or notes from chat. Cloudflare answers /brief with a 301
 * first (scripts/build-docs.mjs, `_redirects`); this page covers everywhere else (next dev).
 */
export const metadata: Metadata = {
  title: 'Start a prototype',
  robots: { index: false },
  alternates: { canonical: '/docs/start/' },
};

export default function BriefPage() {
  return (
    <main className="mx-auto flex w-full max-w-xl flex-1 flex-col gap-2 px-4 py-16">
      <MovedTo to="/docs/start/" />
      <h1 className="text-2xl font-semibold">Start a prototype</h1>
      <p className="text-muted-foreground">
        Taking you to{' '}
        <Link href="/docs/start" className="text-foreground underline underline-offset-2">
          Start a prototype
        </Link>
        …
      </p>
    </main>
  );
}
