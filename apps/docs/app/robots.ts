import type { MetadataRoute } from 'next';
import { site } from '@/lib/llms';

export const revalidate = false;

/** /robots.txt: crawl everything, here's the sitemap. Cloudflare puts its content-signals block in front of it. */
export default function robots(): MetadataRoute.Robots {
  return { rules: { userAgent: '*', allow: '/' }, sitemap: site('/sitemap.xml') };
}
