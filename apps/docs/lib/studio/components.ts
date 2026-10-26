'use client';
/**
 * Foundations › Components (apps/docs/design/studio-wireframes.md › Components section of Foundations, wireframe 7):
 * what the Button, Chip, Badge and Input cards read and write. The component layer lives in @halftone-ds/tokens
 * (lib/theme/components.mjs); a system stores only its edits (`components.<name>`), and every edit goes through
 * `edit`, so it applies live, saves itself and undoes with ⌘Z. Button and Input styles are the recipe's.
 */
import type { HalftoneSystem } from '@halftone-ds/tokens/system';
import { COMPONENTS, componentContrast, type ComponentColor, type ComponentName, type ComponentShape, type Theme } from '@halftone-ds/tokens/theme';
import { edit, type Mode } from '@/lib/studio/foundations';
import { setRecipe } from '@/lib/theme/store';

export type Slot = 'fill' | 'label' | 'border' | 'pressed';
type Edit = NonNullable<HalftoneSystem['components'][ComponentName]>;
/** The open card's panel groups (wireframe 9), always in this order; a component shows the ones it has. */
export type Group = 'style' | 'shape' | 'size' | 'type' | 'effects' | 'colours';
export const GROUP_LABELS: Record<Group, string> = { style: 'Style', shape: 'Shape', size: 'Size', type: 'Type', effects: 'Icon · effects', colours: 'Colours' };

export const COMPONENT_ORDER: ComponentName[] = ['button', 'chip', 'badge', 'input'];

export const VARIANT_LABELS: Record<string, string> = {
  primary: 'Primary',
  secondary: 'Secondary',
  outline: 'Outline',
  ghost: 'Ghost',
  destructive: 'Destructive',
  unselected: 'Unselected',
  selected: 'Selected',
  default: 'Default',
  focus: 'Focus',
  error: 'Error',
  disabled: 'Disabled',
  placeholder: 'Placeholder',
};
export const SLOT_LABELS: Record<Slot, string> = { fill: 'Fill', label: 'Label', border: 'Border', pressed: 'Pressed' };
export const STYLE_LABELS: Record<string, string> = {
  solid: 'Solid',
  soft: 'Soft',
  outline: 'Outline',
  raised: 'Raised',
  filled: 'Filled',
  underline: 'Underline',
  pill: 'Pill',
  square: 'Square',
};
export const CORNER_LABELS: Record<string, string> = { sm: 'Small', md: 'Medium', lg: 'Large', xl: 'XL', '2xl': '2XL', full: 'Full' };
export const SIZE_LABELS: Record<string, string> = { sm: 'Small', md: 'Medium', lg: 'Large', x: 'Padding', gap: 'Gap' };
export const STEP_SHORT: Record<string, string> = { sm: 'S', md: 'M', lg: 'L' };
export const WEIGHT_LABELS: Record<number, string> = { 400: 'Regular', 500: 'Medium', 600: 'Semibold', 700: 'Bold' };

/** What a variant is called in the kits' classes and variables: --button-primary-bg, bg-chip-selected-bg. */
export const prefixOf = (name: ComponentName) => COMPONENTS[name].prefix;

export const componentsOf = (theme: Theme) => theme.components;

/** The edits a system holds for one component (an empty object when none). */
export const editsOf = (doc: HalftoneSystem, name: ComponentName): Edit => (doc.components?.[name] ?? {}) as Edit;

/** Change one component's edits; an edit left empty is removed. */
function editComponent(name: ComponentName, change: (entry: Edit) => Edit, coalesce?: string) {
  edit((doc) => {
    const components = { ...doc.components } as Record<string, Edit>;
    const next = change(structuredClone(components[name] ?? {}));
    if (next.size && !Object.keys(next.size).length) delete next.size;
    if (next.variants) {
      for (const [v, slots] of Object.entries(next.variants)) if (!Object.keys(slots ?? {}).length) delete next.variants[v];
      if (!Object.keys(next.variants).length) delete next.variants;
    }
    if (Object.keys(next).length) components[name] = next;
    else delete components[name];
    doc.components = components as HalftoneSystem['components'];
    return doc;
  }, coalesce);
}

/** The style: Button and Input set the recipe's (a theme code keeps it); Chip and Badge keep it as an edit. */
export function setStyle(name: ComponentName, style: string | null) {
  if (name === 'button') return setRecipe({ button: (style ?? 'solid') as never });
  if (name === 'input') return setRecipe({ field: (style ?? 'outline') as never });
  editComponent(name, (e) => {
    if (style === null || style === COMPONENTS[name].styles[0]) delete e.style;
    else e.style = style;
    return e;
  });
}

/** The corner: a Foundations corner ('md', 'full'), px, or null to follow the default. */
export function setCorner(name: ComponentName, radius: string | number | null) {
  editComponent(
    name,
    (e) => {
      if (radius === null) delete e.radius;
      else e.radius = radius as Edit['radius'];
      return e;
    },
    typeof radius === 'number' ? `component.${name}.radius` : undefined
  );
}

export function setSize(name: ComponentName, key: 'sm' | 'md' | 'lg' | 'x' | 'gap', px: number | null) {
  editComponent(
    name,
    (e) => {
      const size = { ...e.size };
      if (px === null) delete size[key];
      else size[key] = px;
      e.size = size;
      return e;
    },
    px === null ? undefined : `component.${name}.size.${key}`
  );
}

export function resetSize(name: ComponentName) {
  editComponent(name, (e) => {
    delete e.size;
    return e;
  });
}

export function setText(name: ComponentName, style: string | null) {
  editComponent(name, (e) => {
    if (style === null || style === COMPONENTS[name].text) delete e.text;
    else e.text = style;
    return e;
  });
}

/** A variant's colour: a role, 'none', or null to go back to the default (or, for pressed, to derived). */
export function setVariant(name: ComponentName, variant: string, slot: Slot, role: string | null) {
  editComponent(name, (e) => {
    const variants = { ...e.variants };
    const slots = { ...variants[variant] };
    if (role === null) delete slots[slot];
    else slots[slot] = role;
    variants[variant] = slots;
    e.variants = variants;
    return e;
  });
}

export function resetVariant(name: ComponentName, variant: string) {
  editComponent(name, (e) => {
    const variants = { ...e.variants };
    delete variants[variant];
    e.variants = variants;
    return e;
  });
}

type Prop = 'border' | 'weight' | 'case' | 'icon' | 'shadow' | 'placeholder';

/** One of the open card's properties (border, weight, case, icon, shadow, placeholder), or null for the default. */
export function setProp(name: ComponentName, key: Prop, value: string | number | null) {
  editComponent(
    name,
    (e) => {
      const entry = e as Record<string, unknown>;
      if (value === null) delete entry[key];
      else entry[key] = value;
      return e;
    },
    typeof value === 'number' ? `component.${name}.${key}` : undefined
  );
}

/** The focus ring's width (px) or role, or null for the default. */
export function setRing(name: ComponentName, key: 'width' | 'role', value: string | number | null) {
  editComponent(
    name,
    (e) => {
      const ring = { ...e.ring } as Record<string, unknown>;
      if (value === null) delete ring[key];
      else ring[key] = value;
      if (Object.keys(ring).length) e.ring = ring as Edit['ring'];
      else delete e.ring;
      return e;
    },
    typeof value === 'number' ? `component.${name}.ring.${key}` : undefined
  );
}

/** What each panel group edits, as paths into the component's edits (and Colours: the variants). */
const GROUP_KEYS: Record<Exclude<Group, 'colours'>, string[]> = {
  style: ['style'],
  shape: ['radius', 'border'],
  size: ['size'],
  type: ['text', 'weight', 'case', 'placeholder'],
  effects: ['icon', 'shadow', 'ring'],
};

/** The edits in one group: "size.md", "ring.role", "variants.primary.fill". */
export function groupEdits(doc: HalftoneSystem, name: ComponentName, group: Group): string[] {
  const e = editsOf(doc, name) as Record<string, unknown>;
  const keys = group === 'colours' ? ['variants'] : GROUP_KEYS[group];
  const out: string[] = [];
  for (const key of keys) {
    const v = e[key];
    if (v === undefined) continue;
    if (key === 'variants') for (const [variant, slots] of Object.entries(v as Record<string, object>)) for (const slot of Object.keys(slots)) out.push(`variants.${variant}.${slot}`);
    else if (v && typeof v === 'object') for (const k of Object.keys(v)) out.push(`${key}.${k}`);
    else out.push(key);
  }
  return out;
}

/** Every edit a component holds (the card header's "N edited"). */
export const componentEdits = (doc: HalftoneSystem, name: ComponentName) => (['style', 'shape', 'size', 'type', 'effects', 'colours'] as Group[]).flatMap((g) => groupEdits(doc, name, g));

/** Reset one group's edits. */
export function resetGroup(name: ComponentName, group: Group) {
  editComponent(name, (e) => {
    const entry = e as Record<string, unknown>;
    for (const key of group === 'colours' ? ['variants'] : GROUP_KEYS[group]) delete entry[key];
    return e;
  });
}

/** Reset every edit of a component (the style too, for Chip and Badge). */
export function resetComponent(name: ComponentName) {
  edit((doc) => {
    const components = { ...doc.components } as Record<string, Edit>;
    delete components[name];
    doc.components = components as HalftoneSystem['components'];
    return doc;
  });
}

/**
 * The slots a variant edits in the system. Input's placeholder pairing (its own line in Accessibility) counts the
 * placeholder role as its label and the default state's fill.
 */
export const editedSlots = (doc: HalftoneSystem, name: ComponentName, variant: string): Slot[] => {
  const e = editsOf(doc, name);
  if (name === 'input' && variant === 'placeholder') return [...(e.placeholder ? ['label' as const] : []), ...(e.variants?.default?.fill ? ['fill' as const] : [])];
  return Object.keys(e.variants?.[variant] ?? {}) as Slot[];
};

/** A colour as CSS, its opacity mixed in (a clear fill is transparent). */
export const colorCss = (c: ComponentColor | undefined, mode: Mode) => {
  if (!c) return 'transparent';
  const a = c.alpha[mode];
  if (a >= 1) return c[mode];
  if (a <= 0) return 'transparent';
  return `color-mix(in oklab, ${c[mode]} ${Math.round(a * 100)}%, transparent)`;
};

/** A role's name as the pickers show it: 'Primary foreground', 'None'. */
export const roleName = (role: string | null) => {
  if (!role) return 'Style colour';
  if (role === 'none') return 'None';
  const s = role.replace(/-/g, ' ');
  return s.charAt(0).toUpperCase() + s.slice(1);
};

/** Label on fill, light and dark, for one variant (the fill over the page at its opacity), or for every one (null). */
export function variantContrast(theme: Theme, name: ComponentName, variant: string | null) {
  const rows = componentContrast(theme.components, { light: theme.resolved.light.background, dark: theme.resolved.dark.background });
  return rows.filter((r) => r.component === name && (variant === null || r.variant === variant));
}

/** The px a corner name stands for in this theme. */
export function cornerPx(shape: ComponentShape) {
  return shape.radius >= 9999 ? 'full' : `${shape.radius}px`;
}
