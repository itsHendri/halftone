import { IconSizeContext } from '@/components/ui/icon';
import { TextClassContext } from '@/components/ui/text';
import { labelClass } from '@/lib/component-classes';
import { useLiveComponent } from '@/lib/palette-context';
import { TOKENS } from '@/lib/theme';
import { cn } from '@/lib/utils';
import { Slot } from '@rn-primitives/slot';
import { cva, type VariantProps } from 'class-variance-authority';
import { Platform, View } from 'react-native';

/**
 * The theme's Badge (semantic.component.badge, --badge-*): corner, border, padding, gap, sizes,
 * text, icon size and each variant's colours.
 */
const badgeVariants = cva(
  cn(
    'group shrink-0 flex-row items-center justify-center gap-badge-gap overflow-hidden rounded-badge border-badge px-badge-x',
    Platform.select({
      web: 'focus-visible:border-ring focus-visible:ring-ring/50 aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive w-fit whitespace-nowrap transition-[color,box-shadow] focus-visible:ring-[3px] [&>svg]:pointer-events-none [&>svg]:size-[var(--badge-icon)]',
    })
  ),
  {
    variants: {
      variant: {
        default: cn('bg-badge-default-bg border-badge-default-border', Platform.select({ web: '[a&]:hover:bg-badge-default-pressed' })),
        secondary: cn('bg-badge-secondary-bg border-badge-secondary-border', Platform.select({ web: '[a&]:hover:bg-badge-secondary-pressed' })),
        destructive: cn('bg-badge-destructive-bg border-badge-destructive-border', Platform.select({ web: '[a&]:hover:bg-badge-destructive-pressed' })),
        outline: cn('bg-badge-outline-bg border-badge-outline-border', Platform.select({ web: '[a&]:hover:bg-badge-outline-pressed' })),
      },
      // S and M (h-badge-*): exact heights, the label centred.
      size: {
        sm: 'h-badge-sm',
        md: 'h-badge-md',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'md',
    },
  }
);

const badge = TOKENS.components.badge;
const text = badge.text;
const badgeTextVariants = cva(
  cn(
    'text-type-badge leading-type-badge',
    labelClass(text),
    (Platform.OS === 'web' || text.tracking !== 0) && 'tracking-type-badge',
    text.font === 'heading' && 'font-heading',
    text.font === 'mono' && 'font-mono'
  ),
  {
  variants: {
    variant: {
      default: 'text-badge-default-fg',
      secondary: 'text-badge-secondary-fg',
      destructive: 'text-badge-destructive-fg',
      outline: 'text-badge-outline-fg',
    },
  },
  defaultVariants: {
    variant: 'default',
  },
  }
);

type BadgeProps = React.ComponentProps<typeof View> & React.RefAttributes<View> & {
  asChild?: boolean;
} & VariantProps<typeof badgeVariants>;

function Badge({ className, variant, size, asChild, ...props }: BadgeProps) {
  const Component = asChild ? Slot : View;
  const live = useLiveComponent('badge');
  return (
    <TextClassContext.Provider value={cn(badgeTextVariants({ variant }), live && labelClass(live, true))}>
      <IconSizeContext.Provider value={badge.icon}>
        <Component className={cn(badgeVariants({ variant, size }), className)} {...props} />
      </IconSizeContext.Provider>
    </TextClassContext.Provider>
  );
}

export { Badge, badgeTextVariants, badgeVariants };
export type { BadgeProps };
