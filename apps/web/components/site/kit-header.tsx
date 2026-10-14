import Link from 'next/link';
import { ThemeToggle } from './theme-toggle';

const LINKS = [
  { href: '/', label: 'Kit' },
  { href: '/components', label: 'Components' },
  { href: '/foundations', label: 'Foundations' },
];

/** The kit shell's top bar. Hidden in embed mode (the `kit-chrome` class). */
export function KitHeader() {
  return (
    <header className="kit-chrome border-border bg-background/90 sticky top-0 z-40 border-b backdrop-blur">
      <div className="mx-auto flex h-14 max-w-6xl items-center gap-6 px-4 sm:px-6">
        <Link href="/" className="flex shrink-0 items-center gap-2 font-semibold whitespace-nowrap">
          <span aria-hidden className="bg-primary size-5 rounded-md" />
          <span className="hidden sm:inline">Halftone</span>
          <span className="sm:hidden">Kit</span>
        </Link>
        <nav aria-label="Kit" className="flex items-center gap-4 text-sm">
          {LINKS.slice(1).map((l) => (
            <Link key={l.href} href={l.href} className="text-muted-foreground hover:text-foreground">
              {l.label}
            </Link>
          ))}
        </nav>
        <div className="ml-auto">
          <ThemeToggle />
        </div>
      </div>
    </header>
  );
}
