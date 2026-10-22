/// <reference types="node" />
import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

import type { ConfigContext, ExpoConfig } from 'expo/config';

/**
 * The brand download from Studio (assets/brand/brand.json, beside the icon and splash images it
 * unzips into assets/images): the app icon's Android background and the splash colours, light and dark.
 * Without it, app.json's values stand.
 */
type BrandConfig = { iconBackground?: string; splashBackground?: string; splashBackgroundDark?: string };
const HEX = /^#[0-9a-f]{6}$/i;

function withBrand(config: Partial<ExpoConfig>, projectRoot: string): Partial<ExpoConfig> {
  const path = join(projectRoot, 'assets/brand/brand.json');
  if (!existsSync(path)) return {};
  let brand: BrandConfig;
  try {
    brand = JSON.parse(readFileSync(path, 'utf8')) as BrandConfig;
  } catch {
    return {};
  }
  const out: Partial<ExpoConfig> = {};
  if (brand.iconBackground && HEX.test(brand.iconBackground)) {
    out.android = { ...config.android, adaptiveIcon: { ...config.android?.adaptiveIcon, backgroundColor: brand.iconBackground } };
  }
  if (brand.splashBackground && HEX.test(brand.splashBackground)) {
    const dark = brand.splashBackgroundDark && HEX.test(brand.splashBackgroundDark) && existsSync(join(projectRoot, 'assets/images/splash-dark.png'));
    out.plugins = (config.plugins ?? []).map((plugin) =>
      Array.isArray(plugin) && plugin[0] === 'expo-splash-screen'
        ? [
            'expo-splash-screen',
            {
              ...(plugin[1] as object),
              image: './assets/images/splash.png',
              imageWidth: 200,
              backgroundColor: brand.splashBackground,
              ...(dark ? { dark: { image: './assets/images/splash-dark.png', backgroundColor: brand.splashBackgroundDark } } : {}),
            },
          ]
        : plugin
    );
  }
  return out;
}

// Account-specific values come from the environment, so a fresh clone carries none of them.
// Locally: `.env.local` (gitignored; see `.env.example`). EAS Build / Update / Workflows: the same
// names as EAS environment variables. Leave them unset and the kit still runs everywhere except
// EAS (`npm run setup -- --eas-init` creates the project and writes them).
//   APP_ID            bundle identifier + Android package (default com.halftonedesignsystem.app)
//   EAS_OWNER         Expo account or org that owns the project
//   EAS_PROJECT_ID    EAS project id; also sets the update URL
//   KIT_WEB_BASE_URL  sub-path for a web export hosted below the root, e.g. /m (production only)
export default ({ config, projectRoot }: ConfigContext): ExpoConfig => {
  // Expo CLI loads these files itself; EAS CLI does not. Values already in the environment win.
  for (const file of ['.env.local', '.env']) {
    const path = join(projectRoot, file);
    if (existsSync(path)) process.loadEnvFile(path);
  }

  const appId = process.env.APP_ID || 'com.halftonedesignsystem.app';
  const projectId = process.env.EAS_PROJECT_ID;
  const baseUrl = process.env.KIT_WEB_BASE_URL;

  const brand = withBrand(config, projectRoot);
  return {
    ...config,
    ...brand,
    name: config.name ?? 'Halftone',
    slug: config.slug ?? 'halftone',
    ios: { ...config.ios, bundleIdentifier: appId },
    android: { ...config.android, ...brand.android, package: appId },
    ...(process.env.EAS_OWNER ? { owner: process.env.EAS_OWNER } : {}),
    extra: { ...config.extra, ...(projectId ? { eas: { projectId } } : {}) },
    ...(projectId ? { updates: { url: `https://u.expo.dev/${projectId}` } } : {}),
    experiments: { ...config.experiments, ...(baseUrl ? { baseUrl } : {}) },
  };
};
