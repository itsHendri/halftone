/**
 * Everything the site knows about the kits, read from the monorepo at build time. The docs app is the
 * one app that may reach outside its folder: it documents the others.
 */
import kitJson from '../../../kit.json';
import mobileIndex from '../../mobile/registry/generated/index.json';
import mobileRegistry from '../../mobile/registry.json';
import type * as Mobile from '../../mobile/registry/types';
import themeJson from '../../mobile/tokens/generated/theme.registry.json';
import webIndex from '../../web/registry/generated/index.json';
import webRegistry from '../../web/registry.json';
import type * as Web from '../../web/registry/types';

export const kit = kitJson as {
  name: string;
  /** For titles and search: "Halftone Design System". `name` is what copy uses. */
  fullName: string;
  tagline: string;
  repo: string;
  siteUrl: string | null;
  npmScope: string;
  registry: { native: string; web: string };
};

export type Platform = 'mobile' | 'web';
export const PLATFORMS: Platform[] = ['mobile', 'web'];

type CategoryMeta = Mobile.CategoryMeta | Web.CategoryMeta;
export type KitComponent = (Mobile.ComponentMeta | Web.ComponentMeta) & { install: string | null };
type RegistryItem = { name: string; dependencies?: string[]; registryDependencies?: string[] };

export type KitInfo = {
  platform: Platform;
  /** "Native kit" */
  label: string;
  /** What it is built on, one line. */
  stack: string;
  categories: CategoryMeta[];
  components: KitComponent[];
  /** What the Components page previews (some components have no demo of their own). */
  previewed: KitComponent[];
  /** The shadcn registry namespace (`@halftone-native`) and where this site serves it (`/r/native`). */
  namespace: string;
  registryPath: string;
  registryItems: RegistryItem[];
  /** The Components page route inside the kit, for live previews. */
  componentsRoute: string;
};

const build = (
  platform: Platform,
  label: string,
  stack: string,
  index: { categories: unknown; components: unknown },
  registry: { items: RegistryItem[] },
  namespace: string,
  registryPath: string,
  componentsRoute: string
): KitInfo => {
  const components = index.components as KitComponent[];
  return {
    platform,
    label,
    stack,
    categories: index.categories as CategoryMeta[],
    components,
    previewed: components.filter((c) => c.preview !== false),
    namespace,
    registryPath,
    registryItems: registry.items,
    componentsRoute,
  };
};

export const kits: Record<Platform, KitInfo> = {
  mobile: build('mobile', 'Native kit', 'Expo, React Native, NativeWind, react-native-reusables', mobileIndex, mobileRegistry, kit.registry.native, '/r/native', '/components'),
  web: build('web', 'Web kit', 'Next.js, Tailwind 4, shadcn/ui', webIndex, webRegistry, kit.registry.web, '/r/web', '/components'),
};

export const isPlatform = (p: string): p is Platform => p === 'mobile' || p === 'web';

export const componentsIn = (platform: Platform, category: string) => kits[platform].components.filter((c) => c.category === category);
export const getComponent = (platform: Platform, id: string) => kits[platform].components.find((c) => c.id === id);
export const categoryLabel = (platform: Platform, id: string) => kits[platform].categories.find((c) => c.id === id)?.label ?? id;
export const componentUrl = (platform: Platform, id: string) => `/components/${platform}/${id}`;

/** Every component across both kits. */
export const totalComponents = kits.mobile.components.length + kits.web.components.length;

/** Semantic colour names, in tokens.json order (radius excluded). Both kits share one tokens.json. */
export const colorNames = Object.keys(themeJson.web.cssVars.light).filter((k) => k !== 'radius');

/** Source link for a file in a kit. */
export const sourceUrl = (platform: Platform, file: string) => `${kit.repo}/blob/main/apps/${platform}/${file}`;

/** The published shadcn item behind a component (`@halftone-native/list-row` → its deps), if the kit publishes it. */
export function registryItemFor(platform: Platform, c: KitComponent): RegistryItem | undefined {
  const { namespace, registryItems } = kits[platform];
  if (!c.install?.startsWith(`${namespace}/`)) return undefined;
  const name = c.install.slice(namespace.length + 1);
  return registryItems.find((i) => i.name === name);
}
