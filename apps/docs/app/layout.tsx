import type { Metadata } from 'next';
import { Provider } from '@/components/provider';
import { kit } from '@/lib/kit';
import { themeBootScript } from '@/lib/theme/keys';
import './global.css';

export const metadata: Metadata = {
  title: { default: `${kit.fullName}: prototype kits coding agents build from`, template: `%s · ${kit.name}` },
  metadataBase: kit.siteUrl ? new URL(kit.siteUrl) : undefined,
  openGraph: { siteName: kit.fullName },
  description:
    'Mobile and web prototype kits for designers and coding agents. Hand an agent a brief and get a themed, working prototype built only from the kit.',
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
