import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { kit, type Platform } from './kit';

/** The site's own address, for absolute URLs in text files. Set kit.json `siteUrl` once deployed. */
export const siteUrl = (kit.siteUrl ?? process.env.SITE_URL ?? '').replace(/\/$/, '');
export const site = (path: string) => (siteUrl ? `${siteUrl}${path}` : path);

/**
 * A kit's llms.txt (apps/<platform>/llms.txt) with its repo-relative links made absolute, so it reads the
 * same served from this site. Build time only (the routes that use it are static).
 */
export function kitLlms(platform: Platform): string {
  const text = readFileSync(join(process.cwd(), `../${platform}/llms.txt`), 'utf8');
  return text.replace(/\]\((?!https?:|#|\/)([^)]+)\)/g, (_m, path: string) => `](${kit.repo}/blob/main/apps/${platform}/${path})`);
}

/** A kit's llms.txt as a section of the site's: headings one level down, titled by the kit. */
export function kitLlmsSection(platform: Platform, title: string): string {
  return kitLlms(platform)
    .replace(/^# .*$/m, `# ${title}`)
    .replace(/^(#{1,5}) /gm, '#$1 ');
}

/** The top of the site's llms.txt and llms-full.txt. */
export function siteLlmsHeader(): string {
  return [
    `# ${kit.name}`,
    '',
    `> ${kit.tagline}`,
    '',
    'Two prototype kits on one set of design tokens: a native kit (Expo, React Native, NativeWind,',
    'react-native-reusables) and a web kit (Next.js, Tailwind 4, shadcn/ui). Each kit lists the only components a',
    'prototype may use. Start with the install guide.',
    '',
    '## This site',
    '',
    `- [Install guide for agents](${site('/install.md')}): pick a kit and a path, then the rules`,
    `- [Everything in one file](${site('/llms-full.txt')})`,
    `- [shadcn registry for Expo + react-native-reusables (${kit.registry.native})](${site('/r/native/registry.json')})`,
    `- [shadcn registry for Next.js + shadcn/ui (${kit.registry.web})](${site('/r/web/registry.json')})`,
    '',
  ].join('\n');
}
