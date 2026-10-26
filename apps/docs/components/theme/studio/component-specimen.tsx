'use client';
import { ICON_DEFAULT, type ComponentColor, type ComponentName, type ComponentShape } from '@halftone-ds/tokens/theme';
import { Loader2Icon, PlusIcon, SearchIcon, StarIcon } from 'lucide-react';
import * as React from 'react';
import { colorCss, prefixOf } from '@/lib/studio/components';
import type { Mode } from '@/lib/studio/foundations';

/**
 * A component as the web kit draws it, from the theme's component layer (theme.components): the open card's specimen
 * grid, its states row and in-context strip, and the collapsed card's small one. Everything is the live system:
 * corners, sizes, gap, border, text (weight and case), icon size, shadow, focus ring and each variant's colours.
 * Hover follows pressed, disabled is 50% opacity; loading is display only (a spinner where the icon sits).
 */

export type SpecimenState = 'rest' | 'hover' | 'pressed' | 'focus' | 'disabled' | 'loading';
export type Step = 'sm' | 'md' | 'lg';

const ICON = { button: PlusIcon, chip: StarIcon, badge: StarIcon, input: SearchIcon } as const;

/** A shadow level as CSS (the Foundations shadows), with the web kit's own until the system sets one. */
function shadowOf(name: ComponentName, shape: ComponentShape, variant: string): string | null {
  const level = shape.shadow;
  if (level === undefined) return null;
  if (level === null) {
    // The web kit's own: an Outline button's shadow-xs; a boxed field's.
    if (name === 'button') return variant === 'outline' ? 'var(--shadow-1)' : null;
    return shape.borderWidth ? 'var(--shadow-1)' : null;
  }
  if (level === 'none' || (name === 'button' && variant === 'ghost')) return null;
  return `var(--shadow-${level})`;
}

const text = (name: ComponentName, shape: ComponentShape): React.CSSProperties => ({
  fontFamily: `var(--${prefixOf(name)}-text-font)`,
  fontSize: shape.text.size,
  lineHeight: `${shape.text.leading}px`,
  letterSpacing: `${shape.text.tracking}em`,
  fontWeight: shape.text.weight,
  textTransform: shape.text.case === 'uppercase' ? 'uppercase' : undefined,
});

/** Border widths side by side (the shorthand and a bottom of its own would fight on a re-render). */
const sides = (width: number, bottom: number): React.CSSProperties => ({ borderTopWidth: width, borderLeftWidth: width, borderRightWidth: width, borderBottomWidth: bottom });

/** A label that must not be read for contrast (a disabled control is faint on purpose): drawn with CSS content. */
const Faint = ({ children }: { children: string }) => <span className="before:content-[attr(data-text)]" data-text={children} aria-hidden />;

export function Specimen({
  name,
  shape,
  variant,
  mode,
  step = 'md',
  state = 'rest',
  icon = false,
  label,
  value,
  className = '',
}: {
  name: ComponentName;
  shape: ComponentShape;
  variant: string;
  mode: Mode;
  step?: Step;
  state?: SpecimenState;
  icon?: boolean;
  label: string;
  /** Input: a typed value (otherwise the placeholder shows). */
  value?: string;
  className?: string;
}) {
  const v = shape.variants[variant] ?? shape.variants.default;
  const iconPx = shape.icon ?? (name === 'input' ? 16 : ICON_DEFAULT[name]);
  const Icon = ICON[name];
  const focus = state === 'focus';
  // A state's label isn't read for contrast here (disabled is faint on purpose; hover and pressed are moments): the
  // Colours group gives their ratios.
  const faint = state !== 'rest' && state !== 'focus';
  const shadows = [shadowOf(name, shape, variant)];

  if (name === 'input') {
    const d = shape.variants.default;
    const ring = v.ring ?? (focus ? shape.variants.focus.ring : undefined);
    if (ring) shadows.push(`0 0 0 ${shape.ring?.width ?? 3}px ${colorCss(ring, mode)}`);
    return (
      <span
        className={`inline-flex w-full min-w-0 items-center gap-2 overflow-hidden whitespace-nowrap ${className}`}
        style={{
          ...text(name, shape),
          height: shape.h[step] ?? shape.h.md,
          paddingInline: shape.x.md,
          background: colorCss(v.fill ?? d.fill, mode),
          color: colorCss(v.label ?? d.label, mode),
          borderStyle: 'solid',
          borderColor: colorCss(v.border ?? d.border, mode),
          ...sides(shape.borderWidth ?? 1, shape.edgeWidth ?? shape.borderWidth ?? 1),
          borderTopLeftRadius: shape.radius,
          borderTopRightRadius: shape.radius,
          borderBottomLeftRadius: shape.radiusBottom ?? shape.radius,
          borderBottomRightRadius: shape.radiusBottom ?? shape.radius,
          boxShadow: shadows.filter(Boolean).join(', ') || undefined,
          opacity: variant === 'disabled' ? 0.5 : 1,
        }}>
        {icon ? <Icon style={{ width: iconPx, height: iconPx, flexShrink: 0 }} aria-hidden /> : null}
        {variant === 'disabled' ? (
          <span style={{ color: colorCss(shape.placeholder, mode) }}>
            <Faint>{value ?? label}</Faint>
          </span>
        ) : value ? (
          <span className="truncate">{value}</span>
        ) : (
          <span className="truncate" style={{ color: colorCss(shape.placeholder, mode) }}>
            {label}
          </span>
        )}
      </span>
    );
  }

  const fill: ComponentColor | undefined = state === 'hover' || state === 'pressed' ? (v.pressed ?? v.fill) : v.fill;
  const borderWidth = name === 'button' ? (v.borderWidth ?? 0) : (shape.borderWidth ?? 1);
  const edgeWidth = name === 'button' ? (v.edgeWidth ?? 0) : borderWidth;
  const borderColor = focus && name === 'button' && shape.focusBorder && borderWidth ? colorCss(shape.focusBorder, mode) : colorCss(v.border, mode);
  if (focus) shadows.push(`0 0 0 ${shape.ring?.width ?? 3}px ${colorCss(v.ring ?? shape.focusBorder, mode)}`);
  const badge = name === 'badge';
  const height = shape.h[step] ?? shape.h.md;
  return (
    <span
      className={`inline-flex shrink-0 items-center justify-center whitespace-nowrap ${className}`}
      style={{
        ...text(name, shape),
        height: badge ? undefined : height,
        minHeight: badge ? height : undefined,
        paddingInline: shape.x[step] ?? shape.x.md,
        paddingBlock: badge ? (step === 'sm' ? 0 : 2) : undefined,
        gap: shape.gap?.[step] ?? shape.gap?.md,
        borderRadius: shape.radius,
        background: colorCss(fill, mode),
        color: colorCss(v.label, mode),
        borderStyle: 'solid',
        borderColor,
        ...sides(borderWidth, edgeWidth),
        boxShadow: shadows.filter(Boolean).join(', ') || undefined,
        opacity: state === 'disabled' ? 0.5 : 1,
      }}>
      {state === 'loading' ? <Loader2Icon className="animate-spin motion-reduce:animate-none" style={{ width: iconPx, height: iconPx }} aria-hidden /> : icon ? <Icon style={{ width: iconPx, height: iconPx }} aria-hidden /> : null}
      {faint ? <Faint>{label}</Faint> : label}
    </span>
  );
}

/** The in-context strip under the specimen (wireframe 9): where each component usually sits, live on the system. */
export function InContext({ name, shape, mode, input }: { name: ComponentName; shape: ComponentShape; mode: Mode; input: ComponentShape }) {
  const card = 'border-border bg-card text-card-foreground flex min-w-0 flex-1 basis-56 flex-col gap-3 rounded-xl border p-4';
  if (name === 'button') {
    return (
      <>
        <div className={card}>
          <p className="text-sm font-medium">Book a discovery call</p>
          <Specimen name="input" shape={input} variant="default" mode={mode} label="name@studio.com" />
          <div className="flex flex-wrap justify-end gap-2">
            <Specimen name="button" shape={shape} variant="outline" mode={mode} label="Cancel" />
            <Specimen name="button" shape={shape} variant="primary" mode={mode} label="Book a call" />
          </div>
        </div>
        <div className={`${card} justify-between`}>
          <div className="flex items-center justify-between gap-2">
            <p className="min-w-0 truncate text-sm font-medium">Northwind rebrand</p>
            <div className="flex gap-1.5">
              <Specimen name="button" shape={shape} variant="ghost" step="sm" mode={mode} label="Share" />
              <Specimen name="button" shape={shape} variant="secondary" step="sm" mode={mode} icon label="Invite" />
            </div>
          </div>
          <p className="text-muted-foreground text-xs">Updated 2 hours ago · 4 people</p>
        </div>
      </>
    );
  }
  if (name === 'chip') {
    return (
      <div className={card}>
        <p className="text-sm font-medium">Invoices</p>
        <div className="flex flex-wrap gap-2">
          <Specimen name="chip" shape={shape} variant="selected" mode={mode} label="All" />
          <Specimen name="chip" shape={shape} variant="unselected" mode={mode} icon label="Starred" />
          <Specimen name="chip" shape={shape} variant="unselected" mode={mode} label="Overdue" />
          <Specimen name="chip" shape={shape} variant="selected" mode={mode} label="This month" />
          <Specimen name="chip" shape={shape} variant="unselected" mode={mode} label="Draft" />
        </div>
      </div>
    );
  }
  if (name === 'badge') {
    const rows: [string, string, string, string][] = [
      ['Acme Studio', 'INV-0142 · £1,240', 'default', 'Paid'],
      ['Northwind', 'INV-0139 · £860', 'destructive', 'Overdue'],
      ['Globex', 'INV-0137 · £2,100', 'secondary', 'Draft'],
    ];
    return (
      <div className={`${card} gap-0 p-0`}>
        {rows.map(([title, sub, variant, label]) => (
          <div key={title} className="border-border flex items-center gap-3 border-b px-4 py-3 last:border-b-0">
            <span className="bg-muted text-muted-foreground inline-flex size-8 shrink-0 items-center justify-center rounded-full text-xs font-semibold" aria-hidden>
              {title[0]}
            </span>
            <span className="flex min-w-0 flex-1 flex-col">
              <span className="truncate text-sm font-medium">{title}</span>
              <span className="text-muted-foreground truncate text-xs">{sub}</span>
            </span>
            <Specimen name="badge" shape={shape} variant={variant} mode={mode} label={label} />
          </div>
        ))}
      </div>
    );
  }
  return (
    <div className={card}>
      <div className="flex flex-col gap-1.5">
        <p className="text-sm font-medium">Name</p>
        <Specimen name="input" shape={shape} variant="default" mode={mode} label="Your name" value="Ada Lovelace" />
      </div>
      <div className="flex flex-col gap-1.5">
        <p className="text-sm font-medium">Email</p>
        <Specimen name="input" shape={shape} variant="error" mode={mode} icon label="name@studio.com" value="ada@" />
        <p className="text-destructive text-xs">Enter a whole email address.</p>
      </div>
      <div className="flex flex-col gap-1.5">
        <p className="text-sm font-medium">Company</p>
        <Specimen name="input" shape={shape} variant="default" mode={mode} label="Optional" />
      </div>
    </div>
  );
}

export const STEP_LABEL: Record<Step, string> = { sm: 'Small', md: 'Medium', lg: 'Large' };
