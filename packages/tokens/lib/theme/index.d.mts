/** Types for @halftone-ds/tokens/theme (index.mjs). */
import type { HalftoneSystem } from '../system/index.mjs';
// Systems (lib/system): also @halftone-ds/tokens/system.
export * from '../system/index.mjs';

export type Neutral = 'zinc' | 'neutral' | 'slate' | 'stone' | 'gray' | 'brand';
export type Radius = 'none' | 'sm' | 'md' | 'lg' | 'xl' | '2xl';
export type Controls = 'pill' | 'match';
export type Stroke = 'regular' | 'thin' | 'bold';
export type Depth = 'soft' | 'flat' | 'raised' | 'hard';
export type Density = 'comfortable' | 'compact' | 'spacious';
export type Border = 'regular' | 'hairline' | 'heavy';
export type Size = '16' | '14' | '15' | '18';
export type Leading = 'normal' | 'tight' | 'relaxed';
export type Flow = 'normal' | 'tight' | 'loose';
export type Measure = '70' | '60' | '80' | '90';
export type ButtonStyle = 'solid' | 'soft' | 'outline' | 'raised';
export type FieldStyle = 'outline' | 'filled' | 'underline';
export type Mode = 'light' | 'dark';
export type CvdType = 'protanopia' | 'deuteranopia' | 'tritanopia';
/** A pair of tones as one vision sees them: `fg` and `bg` are the simulated hex of `a` and `b`. */
export type PairDistance = { a: string; b: string; vision: CvdType | 'none'; fg: string; bg: string; deltaE: number };
export type CvdWarning = PairDistance & { mode: Mode };

export type Recipe = {
  v: number;
  brand: string;
  neutral: Neutral;
  radius: Radius;
  controls: Controls;
  font: { heading: string; body: string; mono: string };
  stroke: Stroke;
  depth: Depth;
  density: Density;
  border: Border;
  size: Size;
  leading: Leading;
  flow: Flow;
  measure: Measure;
  /** The primary button's style. */
  button: ButtonStyle;
  /** Text fields' style (inputs, text areas, select triggers). */
  field: FieldStyle;
  preset?: string;
};
export type RecipeInput = Partial<Omit<Recipe, 'font'>> & { font?: Partial<Recipe['font']> };

export type Adjustment = { token: string; mode: Mode; from: string; to: string };
/** A pairing the contrast fixer left failing because a colour in it was chosen by hand (a system's role or step). */
export type ThemeWarning = { mode: Mode; label: string; fg: string; bg: string; ratio: number; threshold: number; locked: string[] };

export type Theme = {
  recipe: Recipe;
  code: string;
  /** brand and neutral, plus a status ramp a system seeded or edited. */
  primitives: { brand: Record<string, string>; neutral: Record<string, string> } & Partial<Record<'danger' | 'success' | 'warning' | 'info', Record<string, string>>>;
  semantic: Record<string, unknown>;
  /** Semantic colours as hex per mode, kebab-case names (`primary-foreground`). */
  resolved: Record<Mode, Record<string, string>>;
  /** Base radius in px. */
  radius: number;
  adjustments: Adjustment[];
  /** Always empty for a recipe; a system's hand-picked colours that fail contrast. */
  warnings: ThemeWarning[];
  /** Font families by role ('' = system; mono 'Menlo' = the platform monospace). */
  fonts: { heading: string; body: string; mono: string };
  /** The typeset: size (px), scale (size / 16), leading, leadingFactor (leading / 1.75), flow (em), measure (ch). */
  type: TypeScale;
  radiusControl: number;
  borderWidth: number;
  stroke: number;
  density: { sm: number; md: number; lg: number; x: number; scale: number };
  /** The button style's numbers: fill opacity, border and bottom edge (px). */
  button: { alpha: number; border: number; edge: number };
  /** The field style's numbers: fill opacity per mode, border and bottom edge (px), radii (px), inset (0 or 1). */
  field: { alpha: Record<Mode, number>; border: number; edge: number; inset: number; radius: number; radiusBottom: number };
  /** The component layer (Button, Chip, Badge, Input), resolved: what both kits draw. */
  components: ComponentShapes;
  [key: string]: unknown;
};

export type ComponentName = 'button' | 'chip' | 'badge' | 'input';
export type Corner = 'sm' | 'md' | 'lg' | 'xl' | '2xl' | 'full';
export type ComponentSlot = 'fill' | 'label' | 'border' | 'pressed';
/** A component colour as drawn: its role (null for a style's ramp step), hex and opacity per mode. */
export type ComponentColor = {
  role: string | null;
  light: string;
  dark: string;
  alpha: Record<Mode, number>;
  ref?: Record<Mode, string>;
  /** Set in the system (not the default). */
  edited?: boolean;
  /** Pressed derived from the fill, a ring from the border. */
  derived?: boolean;
};
export type ComponentVariant = Partial<Record<ComponentSlot | 'ring', ComponentColor>> & { borderWidth?: number; edgeWidth?: number };
export type ComponentShape = {
  style?: string;
  /** The Foundations corner it follows, or null when set in px. */
  corner?: Corner | null;
  /** px (9999 = a pill); Input: the top corners. */
  radius: number;
  radiusBottom?: number;
  /** Heights (px) by size. */
  h: Partial<Record<'sm' | 'md' | 'lg', number>>;
  /** Horizontal padding (px) by size. */
  x: Partial<Record<'sm' | 'md' | 'lg', number>>;
  /** Font role, size and line height (px), tracking (em), the label's weight and case; `style` the text style it follows. */
  text: { style?: string; font: 'heading' | 'body' | 'mono'; size: number; leading: number; tracking: number; weight: number; case: ComponentCase };
  /** The border width set on the component (px), or null: as the style draws it. */
  border?: number | null;
  /** Chip, Badge and Input: the drawn border and bottom edge (px). Button's are per variant. */
  borderWidth?: number;
  edgeWidth?: number;
  /** The gap between an icon and the label (px) by size; Input has none. */
  gap?: Partial<Record<'sm' | 'md' | 'lg', number>>;
  /** Icon size (px): ICON_DEFAULT until a system sets one. */
  icon?: number;
  /** Button and Input: a Foundations shadow level, or 'none' (defaultShadow until a system sets one). */
  shadow?: ComponentShadow;
  /** Button and Input: the focus ring's width (px) and role (null: derived). */
  ring?: { width: number; role: string | null };
  /** Button: the focused border (the ring's role). */
  focusBorder?: ComponentColor;
  /** Input: the placeholder's colour. */
  placeholder?: ComponentColor;
  variants: Record<string, ComponentVariant>;
};
export type ComponentCase = 'none' | 'uppercase';
export type ComponentShadow = 'none' | '1' | '2' | '3';
export type ComponentProp = 'border' | 'weight' | 'case' | 'icon' | 'shadow' | 'ring' | 'placeholder';
export type ComponentShapes = Record<ComponentName, ComponentShape>;
export type ComponentDefinition = {
  prefix: string;
  label: string;
  styles: string[];
  /** The size steps it has (heights). */
  steps: Array<'sm' | 'md' | 'lg'>;
  /** The size keys a system may set: the steps, padding and (not Input) the icon gap. */
  sizes: Array<'sm' | 'md' | 'lg' | 'x' | 'gap'>;
  /** The properties beyond style, corner, size and text it has. */
  props: ComponentProp[];
  variants: Record<string, ComponentSlot[]>;
  text: string;
};
export const COMPONENT_NAMES: ComponentName[];
export const COMPONENTS: Record<ComponentName, ComponentDefinition>;
export const CORNERS: Corner[];
export const SLOTS: ComponentSlot[];
export const SLOT_VAR: Record<ComponentSlot | 'ring', string>;
export const WEIGHTS: number[];
export const CASES: ComponentCase[];
export const SHADOWS: ComponentShadow[];
/** The icon size (px) each component draws on the web until a system sets one. */
export const ICON_DEFAULT: Record<'button' | 'chip' | 'badge', number>;
export const RING_WIDTH: number;
/** A component's shadow until a system sets one: Button '1'; Input '1' for a boxed field (a border), else 'none'. */
export function defaultShadow(name: ComponentName, borderWidth?: number): ComponentShadow;
/** The touch-target floor (px) the mobile kit applies on phones. */
export const TOUCH_TARGET: number;
export function defaultCorner(name: ComponentName, options?: { controls?: string; style?: string }): Corner;
export function defaultStyle(name: ComponentName, recipe?: Partial<Recipe>): string;
export function fittedLeading(style: string): number;
export function componentVars(shape: ComponentShapes, format: 'hsl' | 'oklch', convert: (hex: string) => string, font?: (role: string) => string): Record<Mode, Record<string, string>>;
export function componentVarNames(): string[];
export function componentColors(shape: ComponentShapes, css: (key: string, alpha: boolean) => string): Record<string, string>;
export function componentPairs(
  shape: ComponentShapes,
  mode: Mode,
  background: string,
  blend: (hex: string, base: string, alpha: number) => string
): Array<{ component: ComponentName; variant: string; label: string; fg: string; bg: string; fgRole: string | null; bgRole: string | null }>;
/** Every variant's label on its fill, both modes: rows like contrastReport's, with the component and variant. */
export function componentContrast(shape: ComponentShapes, background: Record<Mode, string>): Array<ContrastPair & { component: ComponentName; variant: string }>;

export type TypeScale = { size: number; scale: number; leading: number; leadingFactor: number; flow: number; measure: number };
export type Font = { id: string; family: string; category: 'sans' | 'serif' | 'display' | 'mono'; weights: number[]; expoPrefix?: string; hidden?: boolean; system?: boolean };
export type Preset = { id: string; name: string; description: string; recipe: RecipeInput };
export type ThemeStatus =
  | { applied: false }
  /** code is null for a system with overrides; system is set when a system document was applied. */
  | { applied: true; code: string | null; recipe: Recipe; system?: HalftoneSystem; drift: string[] };
export type TokensJson = Record<string, unknown> & { primitive: Record<string, unknown>; semantic: Record<string, unknown> };

export const RECIPE_VERSION: number;
export const DEFAULT_RECIPE: Readonly<Recipe>;
export const OPTIONS: {
  neutral: Neutral[];
  radius: Radius[];
  controls: Controls[];
  stroke: Stroke[];
  depth: Depth[];
  density: Density[];
  border: Border[];
  size: Size[];
  leading: Leading[];
  flow: Flow[];
  measure: Measure[];
  button: ButtonStyle[];
  field: FieldStyle[];
};
export const TYPESET_KEYS: ['size', 'leading', 'flow', 'measure'];
export const STYLE_KEYS: ['button', 'field'];
export const LEADING: Record<Leading, number>;
export const FLOW: Record<Flow, number>;
export const FONTS: Font[];
export const PRESETS: Preset[];
export const BRAND_RAMPS: Record<string, Record<string, string>>;
export const THEME_EXTENSION: string;
export const CVD_TYPES: CvdType[];
export const DISTINCT_PAIRS: [string, string][];
export const MIN_DELTA_E: number;

export function normalizeRecipe(input?: RecipeInput): Recipe;
export function sameRecipe(a: RecipeInput, b: RecipeInput): boolean;
export function generateTheme(recipe: RecipeInput, base: TokensJson, options?: { fix?: boolean }): Theme;
export function encodeRecipe(recipe: RecipeInput): string;
export function decodeRecipe(code: string): Recipe;
export function isThemeCode(value: unknown): boolean;
export function fontById(id: string): Font | undefined;
/** The curated font for a family, or one made from any Google Fonts family name (400–700). */
export function fontByFamily(family: string): Font;
export function googleFontsHref(ids: string[]): string | null;
export function presetById(id: string): Preset | undefined;
export function defaultTypeset(recipe: Recipe): boolean;
export function defaultStyles(recipe: Recipe): boolean;
export function typeVars(type: TypeScale): Record<string, string>;
export type TextStyleName = 'h1' | 'h2' | 'h3' | 'h4' | 'lead' | 'p' | 'large' | 'small' | 'muted' | 'code' | 'blockquote';
export type TextFontRole = 'heading' | 'body' | 'mono';
/** A text style as drawn: size and lineHeight px, leading × size, tracking em; edited: a system changed it. */
export type DrawnTextStyle = { font: TextFontRole; weight: number; size: number; leading: number; tracking: number; lineHeight: number; edited: boolean };
export const TEXT_STYLES: TextStyleName[];
export const TEXT_DEFAULTS: Record<TextStyleName, { font: TextFontRole; weight: number; size: number; leading: number | 'prose'; tracking: number }>;
/** A system's edited styles from a semantic.type group (a theme's, or a token file's DTCG one). */
export function textEdits(group?: Record<string, unknown>): Partial<Record<TextStyleName, Partial<Omit<DrawnTextStyle, 'lineHeight' | 'edited'>>>>;
export function resolveTextStyles(type: TypeScale, edits?: ReturnType<typeof textEdits>): Record<TextStyleName, DrawnTextStyle>;
export function themeTextStyles(theme: Theme): Record<TextStyleName, DrawnTextStyle>;
/** --type-<style>-{size,leading,weight,tracking} (+ -font on the web) in a kit's units. */
export function textStyleVars(styles: Record<string, DrawnTextStyle>, format: 'hsl' | 'oklch', font?: (role: TextFontRole) => string): Record<string, string>;
export function styleVars(styles: Pick<Theme, 'button' | 'field'>, format: 'hsl' | 'oklch'): Record<Mode, Record<string, string>>;
export function themeVars(theme: Theme, format: 'hsl' | 'oklch'): Record<Mode, Record<string, string>>;
export function themeHex(theme: Theme): Record<Mode, Record<string, string>>;
export function themeCss(theme: Theme, options?: { format?: 'hsl' | 'oklch'; light?: string; dark?: string }): string;
export function applyRecipe(tokens: TokensJson, recipe: RecipeInput): { tokens: TokensJson; theme: Theme };
export function themeStatus(tokens: TokensJson): ThemeStatus;

/** One pairing the contrast gate checks: `fg` on `bg` in one mode, its WCAG ratio and the threshold it must clear. */
export type ContrastPair = { mode: Mode; label: string; fgName: string; bgName: string; fg: string; bg: string; threshold: number; ratio: number };
/** A ContrastPair for a table: `pass` against its WCAG threshold, and `apca`, the advisory APCA Lc (signed). */
export type ContrastRow = ContrastPair & { pass: boolean; apca: number };

/** WCAG 2.1 AA for text (4.5) and for icons and other non-text (3). */
export const AA: number;
export const AA_NON_TEXT: number;
export function contrastPairs(hex: Record<string, string>, mode: Mode, options?: { strict?: boolean; fg?: string }): ContrastPair[];
/** Every pairing the build checks (strict by default), light then dark. `hex` is a theme's `resolved`. */
export function contrastReport(hex: Partial<Record<Mode, Record<string, string>>>, options?: { strict?: boolean }): ContrastRow[];
/** APCA Lc of `text` on `background` (APCA-W3 0.0.98G-4g). Advisory: it never fails the build. */
export function apcaContrast(text: string, background: string): number;
export function simulateCvd(hex: string, type: CvdType | 'none' | null | undefined): string;
export function pairDistances(hex: Record<string, string>, type: CvdType | 'none', pairs?: [string, string][]): PairDistance[];
export function cvdWarnings(resolved: Partial<Record<Mode, Record<string, string>>>, options?: { pairs?: [string, string][]; threshold?: number }): CvdWarning[];
export function describeCvdWarnings(warnings: CvdWarning[]): string[];

/** A decoded shadcn/ui preset code (ui.shadcn.com/create). */
export type ShadcnPreset = {
  version: 'a' | 'b';
  style: string;
  baseColor: string;
  theme: string;
  chartColor: string;
  iconLibrary: string;
  font: string;
  fontHeading: string;
  radius: string;
  menuAccent: string;
  menuColor: string;
};
/** A shadcn registry item (registry:theme or registry:font), as JSON. */
export type ShadcnRegistryItem = {
  $schema: string;
  name: string;
  title?: string;
  description?: string;
  type: 'registry:theme' | 'registry:font';
  registryDependencies?: string[];
  cssVars?: { theme?: Record<string, string>; light?: Record<string, string>; dark?: Record<string, string> };
  font?: { family: string; provider: 'google'; import: string; variable: string; subsets?: string[]; weight?: string[]; dependency?: string };
};
export function isShadcnPresetCode(s: unknown): s is string;
export function decodeShadcnPreset(code: string): ShadcnPreset | null;
export function encodeShadcnPreset(preset: Partial<ShadcnPreset>): string;
/** The nearest Halftone recipe for a shadcn preset, and a note for each value it approximated or dropped. */
export function recipeFromShadcn(preset: ShadcnPreset): { recipe: Recipe; notes: string[] };
export const SHADCN_FONTS_URL: string;
export function shadcnTheme(theme: Theme, options?: { name?: string; title?: string; description?: string; fontsUrl?: string }): ShadcnRegistryItem;
export function shadcnFont(id: string, role?: 'body' | 'heading' | 'mono'): ShadcnRegistryItem | null;
export function shadcnFontPath(id: string, role: 'body' | 'heading' | 'mono'): string;
