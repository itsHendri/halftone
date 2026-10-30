import type { MetadataRoute } from 'next';
import { CATALOGUE, entryUrl } from '@/lib/catalogue';
import { site } from '@/lib/llms';
import { source } from '@/lib/source';

export const revalidate = false;

/**
 * /sitemap.xml, written at build time like llms.txt. Every page a search engine should list, with the trailing
 * slash the static export serves. Left out: /themes (moved to /studio, noindex) and the kits' own exports under
 * /m and /w, which are the frames the docs embed rather than pages of their own.
 */
export default function sitemap(): MetadataRoute.Sitemap {
  const paths = [
    '/',
    '/studio',
    '/screens',
    '/brief',
    '/components',
    ...CATALOGUE.map((e) => entryUrl(e.id)),
    ...source.getPages().map((p) => p.url),
  ];
  return paths.map((path) => ({ url: site(path.endsWith('/') ? path : `${path}/`) }));
}
