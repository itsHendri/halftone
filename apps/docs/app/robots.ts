import type { MetadataRoute } from 'next';
import { site } from '@/lib/llms';

export const revalidate = false;

/** /robots.txt: crawl everything, here's the sitemap. It replaces Cloudflare's managed robots.txt, which only had comments. */
export default function robots(): MetadataRoute.Robots {
  return { rules: { userAgent: '*', allow: '/' }, sitemap: site('/sitemap.xml') };
}
