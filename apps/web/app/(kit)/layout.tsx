import { KitHeader } from '@/components/site/kit-header';

/**
 * The kit shell: Home · Components (the Kitchen Sink) · Foundations. A real prototype lives in its own
 * folder (app/<slug>/) with its own layout; it does not use this one.
 */
export default function KitLayout({ children }: LayoutProps<'/'>) {
  return (
    <>
      <KitHeader />
      {/* Embedded (the docs site's previews and tiles), the page is just the demo: no width cap, no padding. */}
      <main className="mx-auto w-full max-w-6xl px-4 py-10 sm:px-6 [[data-embed]_&]:max-w-none [[data-embed]_&]:p-0">{children}</main>
    </>
  );
}
