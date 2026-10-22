import { TextClassContext } from '@/components/ui/text';
import { TOKENS } from '@/lib/theme';
import { cn } from '@/lib/utils';
import { Slot } from '@rn-primitives/slot';
import { cva, type VariantProps } from 'class-variance-authority';
import { Platform, View } from 'react-native';

/** The theme's Badge (semantic.component.badge, --badge-*): corner, padding, text and each variant's colours. */
const badgeVariants = cva(
  cn(
    'group shrink-0 flex-row items-center justify-center gap-1 overflow-hidden rounded-badge border px-badge-x py-0.5',
    Platform.select({
      web: 'focus-visible:border-ring focus-visible:ring-ring/50 aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive w-fit whitespace-nowrap transition-[color,box-shadow] focus-visible:ring-[3px] [&>svg]:pointer-events-none [&>svg]:size-3',
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
    },
    defaultVariants: {
      variant: 'default',
    },
  }
);

const text = TOKENS.components.badge.text;
const badgeTextVariants = cva(
  cn(
    'text-type-badge leading-type-badge font-medium',
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

function Badge({ className, variant, asChild, ...props }: BadgeProps) {
  const Component = asChild ? Slot : View;
  return (
    <TextClassContext.Provider value={badgeTextVariants({ variant })}>
      <Component className={cn(badgeVariants({ variant }), className)} {...props} />
    </TextClassContext.Provider>
  );
}

export { Badge, badgeTextVariants, badgeVariants };
export type { BadgeProps };
