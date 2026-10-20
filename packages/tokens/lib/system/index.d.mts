/** Types for @halftone-ds/tokens/system (index.mjs): the HalftoneSystem v1 document. */
import type { Mode, Neutral, Recipe, RecipeInput, Theme, TokensJson } from '../theme/index.mjs';

export type ColorRole = 'brand' | 'neutral' | 'danger' | 'success' | 'warning' | 'info';
export type StatusRole = 'danger' | 'success' | 'warning' | 'info';
export type Step = '50' | '100' | '200' | '300' | '400' | '500' | '600' | '700' | '800' | '900' | '950';
/** The neutral also has '0' (white) and '1000' (black). */
export type NeutralStep = Step | '0' | '1000';
export type TextStyleName = 'h1' | 'h2' | 'h3' | 'h4' | 'lead' | 'p' | 'large' | 'small' | 'muted' | 'code' | 'blockquote';
export type FontRole = 'heading' | 'body' | 'mono';
export type RadiusStep = 'sm' | 'md' | 'lg' | 'xl' | '2xl';
export type ShadowLevel = '1' | '2' | '3';
export type BorderStyle = 'solid' | 'dashed' | 'dotted';
export type ExtraKind = 'color' | 'text' | 'radius' | 'shadow' | 'border';
/** A 6-digit lowercase hex colour, '#2563eb'. */
export type Hex = `#${string}`;
/** A ramp step ('brand.600', 'neutral.0') or a hex. */
export type RoleValue = `${ColorRole}.${NeutralStep}` | Hex;

/**
 * One colour role. brand: its seed is recipe.brand (a seed here folds into it). neutral: a hex seed makes a custom
 * neutral; a preset name folds into recipe.neutral. A status role without a seed keeps the base file's ramp.
 */
export type ColorOverride = {
  seed?: Hex;
  /** The step the seed is pinned to, when not its nearest one. */
  anchor?: Step;
  /** Steps edited by hand. */
  steps?: Partial<Record<NeutralStep, Hex>>;
};
export type RoleOverride = { light?: RoleValue; dark?: RoleValue };
/** size px, leading × size, tracking em. */
export type TextStyle = { font: FontRole; weight: number; size: number; leading: number; tracking: number };
export type ShadowLayer = { x: number; y: number; blur: number; spread: number; color: Hex; alpha: number; inset?: true };
export type Shadow = Record<Mode, ShadowLayer[]>;
export type BorderOverride = { width?: number; style?: BorderStyle };

export type ExtraColor = { name: string } & ({ value: Hex | Record<Mode, Hex> } | { seed: Hex; anchor?: Step; steps?: Partial<Record<Step, Hex>> });
export type ExtraText = { name: string } & TextStyle;
export type ExtraRadius = { name: string; value: number };
export type ExtraShadow = { name: string } & Shadow;
export type ExtraBorder = { name: string; width: number; style?: BorderStyle };
export type Extras = { color: ExtraColor[]; text: ExtraText[]; radius: ExtraRadius[]; shadow: ExtraShadow[]; border: ExtraBorder[] };

/** As the docs site's brand store keeps it (apps/docs lib/brand/svg.ts). */
export type BrandImage = { svg?: string; png?: string; mono?: boolean; aspect: number };
export type IconBackground = 'brand' | 'white' | 'black' | Hex;
export type SystemBrand = {
  name: string;
  iconBackground: IconBackground;
  logo?: BrandImage;
  logoDark?: BrandImage;
  mark?: BrandImage;
  markDark?: BrandImage;
};

/** A normalised system: every section present, overrides only. */
export type HalftoneSystem = {
  kind: 'halftone.system';
  v: 1;
  id: string;
  name: string;
  preset?: string;
  updatedAt?: string;
  recipe: Recipe;
  colors: Partial<Record<ColorRole, ColorOverride>>;
  roles: Partial<Record<string, RoleOverride>>;
  type: Partial<Record<TextStyleName, Partial<TextStyle>>>;
  /** Any Google Fonts family. */
  fonts: Partial<Record<FontRole, string>>;
  radius: Partial<Record<RadiusStep, number>>;
  shadow: Partial<Record<ShadowLevel, Shadow>>;
  border: BorderOverride;
  extras: Extras;
  brand: SystemBrand;
  /**
   * Reserved for component-level edits (Button, Chip, Tag…), which come after the foundations. Kept as given and
   * not generated yet.
   */
  components: Record<string, Record<string, unknown>>;
};

/** What normalizeSystem accepts: any section may be missing, a shadow may be a plain layer list, a layer partial. */
export type HalftoneSystemInput = Partial<Omit<HalftoneSystem, 'recipe' | 'colors' | 'shadow' | 'extras' | 'brand' | 'components' | 'kind' | 'v'>> & {
  kind?: 'halftone.system';
  v?: number;
  recipe?: RecipeInput;
  colors?: Partial<Record<Exclude<ColorRole, 'neutral'>, ColorOverride>> & { neutral?: Omit<ColorOverride, 'seed'> & { seed?: Hex | Neutral } };
  shadow?: Partial<Record<ShadowLevel, Partial<ShadowLayer>[] | { light?: Partial<ShadowLayer>[]; dark?: Partial<ShadowLayer>[] }>>;
  extras?: Partial<Record<ExtraKind, Array<Record<string, unknown> & { name: string }>>>;
  brand?: Partial<SystemBrand>;
  components?: Record<string, Record<string, unknown>>;
};

/** A contrast pairing the fixer left failing because a colour in it was chosen by hand. */
export type ContrastWarning = { mode: Mode; label: string; fg: string; bg: string; ratio: number; threshold: number; locked: string[] };

/** A colour role's ramp as the Studio draws it. */
export type SystemRamp = {
  /** The seed (a neutral preset's name for a preset neutral). */
  seed: string;
  /** The step the seed sits on (null for a preset neutral). */
  anchor: Step | null;
  source: 'recipe' | 'seed' | 'base';
  /** Before edits. */
  generated: Record<string, string>;
  /** After edits. */
  values: Record<string, string>;
  edited: string[];
};
export type ResolvedTextStyle = TextStyle & { edited: (keyof TextStyle)[] };

export const SYSTEM_KIND: 'halftone.system';
export const SYSTEM_VERSION: 1;
export const COLOR_ROLES: ColorRole[];
export const STATUS_ROLES: StatusRole[];
/** Every semantic colour a role mapping can set. */
export const ROLE_NAMES: string[];
export const TEXT_STYLES: TextStyleName[];
export const TEXT_KEYS: (keyof TextStyle)[];
export const TEXT_DEFAULTS: Record<TextStyleName, Omit<TextStyle, 'leading'> & { leading: number | 'prose' }>;
export const FONT_ROLES: FontRole[];
export const RADIUS_STEPS: RadiusStep[];
export const SHADOW_LEVELS: ShadowLevel[];
export const BORDER_STYLES: BorderStyle[];
export const EXTRA_KINDS: ExtraKind[];

export class SystemError extends Error {
  /** Every problem, as 'path: message'. */
  errors: string[];
}
export function isSystem(value: unknown): boolean;
/** Why an extra can't take this name (a built-in slot, a Tailwind class it would shadow, a theme variable, `taken`), or null. */
export function extraNameProblem(kind: ExtraKind, name: string, taken?: string[]): string | null;
export function newSystemId(): string;
export function normalizeSystem(input: HalftoneSystemInput | HalftoneSystem): HalftoneSystem;
export function validateSystem(input: unknown): { ok: boolean; errors: string[]; system: HalftoneSystem | null };
/** A new system with a fresh id and the time. */
export function createSystem(input?: HalftoneSystemInput): HalftoneSystem;
/** Every override as a path ('colors.danger.seed', 'roles.primary.dark', 'extras.color.sunset'). */
export function systemOverrides(system: HalftoneSystemInput | HalftoneSystem): string[];
export function hasOverrides(system: HalftoneSystemInput | HalftoneSystem): boolean;
export function withoutBrandImages(system: HalftoneSystem): HalftoneSystem;

/** The theme for a system: generateTheme's shape; `extra` holds the extras as a DTCG group. */
export function generateSystem(system: HalftoneSystemInput | HalftoneSystem, base: TokensJson, options?: { fix?: boolean }): Theme & { extra?: Record<string, unknown> };
/** The ht- code, or null when the system has overrides a code can't carry. */
export function systemCode(system: HalftoneSystemInput | HalftoneSystem): string | null;
export function systemRamps(system: HalftoneSystemInput | HalftoneSystem, base: TokensJson): Record<ColorRole, SystemRamp>;
export function textStyles(system: HalftoneSystemInput | HalftoneSystem): Record<TextStyleName, ResolvedTextStyle>;
/** rounded-sm…2xl in px. */
export function systemRadii(system: HalftoneSystemInput | HalftoneSystem, base: TokensJson, theme?: Theme): Record<RadiusStep, number>;

/** A system from a recipe (or an ht- code) and the Studio's brand; a document is normalised. */
export function migrate(input: RecipeInput | string | HalftoneSystemInput, brand?: Partial<SystemBrand>, options?: { id?: string; name?: string; updatedAt?: string }): HalftoneSystem;
/** The recipe under a system, its code (null with overrides) and the overrides a recipe loses. */
export function systemToRecipe(system: HalftoneSystemInput | HalftoneSystem): { recipe: Recipe; code: string | null; lost: string[] };
/** Commit a system into tokens.json; the record keeps the document without brand images. */
export function applySystem(tokens: TokensJson, system: HalftoneSystemInput | HalftoneSystem): { tokens: TokensJson; theme: Theme; system: HalftoneSystem };
