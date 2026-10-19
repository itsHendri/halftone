import type { Metadata } from 'next';
import { Provider } from '@/components/provider';
import { kit } from '@/lib/kit';
import { themeBootScript } from '@/lib/theme/keys';
import './global.css';

export const metadata: Metadata = {
  title: { default: `${kit.fullName}: one brand, phone and web, built by your agent`, template: `%s · ${kit.name}` },
  metadataBase: kit.siteUrl ? new URL(kit.siteUrl) : undefined,
  openGraph: { siteName: kit.fullName },
  description:
    'Two prototype kits, Expo and Next.js, on one set of design tokens. Hand your agent a brief and it builds a themed, working prototype for phone and web from the components the kits ship.',
};

export default function Layout({ children }: LayoutProps<'/'>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeBootScript }} />
      </head>
      <body className="flex min-h-screen flex-col">
        <Provider>{children}</Provider>
      </body>
    </html>
  );
}
