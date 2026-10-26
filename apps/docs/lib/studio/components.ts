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
export const SIZE_LABELS: Record<string, string> = { sm: 'Small', md: 'Medium', lg: 'Large', x: 'Padding x', gap: 'Gap' };

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

/** Reset every edit of a component (the style too, for Chip and Badge). */
export function resetComponent(name: ComponentName) {
  edit((doc) => {
    const components = { ...doc.components } as Record<string, Edit>;
    delete components[name];
    doc.components = components as HalftoneSystem['components'];
    return doc;
  });
}

/** The slots a variant edits in the system. */
export const editedSlots = (doc: HalftoneSystem, name: ComponentName, variant: string) => Object.keys(editsOf(doc, name).variants?.[variant] ?? {}) as Slot[];

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

/** Label on fill, light and dark, for one variant (the fill over the page at its opacity). */
export function variantContrast(theme: Theme, name: ComponentName, variant: string) {
  const rows = componentContrast(theme.components, { light: theme.resolved.light.background, dark: theme.resolved.dark.background });
  return rows.filter((r) => r.component === name && r.variant === variant);
}

/** The px a corner name stands for in this theme. */
export function cornerPx(shape: ComponentShape) {
  return shape.radius >= 9999 ? 'full' : `${shape.radius}px`;
}
