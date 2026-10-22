import { TextClassContext } from '@/components/ui/text';
import { TOKENS } from '@/lib/theme';
import { cn } from '@/lib/utils';
import { cva, type VariantProps } from 'class-variance-authority';
import { Platform, Pressable } from 'react-native';

/**
 * The theme's Button (tokens.json semantic.component.button, --button-*): corner, heights, padding, text and each
 * variant's fill, label, border and pressed colours. Hover follows pressed; disabled is 50% opacity.
 */
const buttonVariants = cva(
  cn(
    'group shrink-0 flex-row items-center justify-center gap-2 rounded-button shadow-none',
    Platform.select({
      web: "focus-visible:border-ring focus-visible:ring-ring/50 aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive whitespace-nowrap outline-none transition-all focus-visible:ring-[3px] disabled:pointer-events-none [&_svg:not([class*='size-'])]:size-4 [&_svg]:pointer-events-none [&_svg]:shrink-0",
    })
  ),
  {
    variants: {
      variant: {
        // Primary: the theme's button style (solid, soft, outline, raised) unless the system set its colours.
        default: cn(
          'bg-button-primary-bg border-button-primary-border border-button-primary-w border-b-button-primary-edge-w active:bg-button-primary-pressed shadow-sm',
          Platform.select({ web: 'hover:bg-button-primary-pressed' })
        ),
        destructive: cn(
          'bg-button-destructive-bg border-button-destructive-border border-button-destructive-w border-b-button-destructive-edge-w active:bg-button-destructive-pressed shadow-sm',
          Platform.select({
            web: 'hover:bg-button-destructive-pressed focus-visible:ring-destructive/20 dark:focus-visible:ring-destructive/40',
          })
        ),
        outline: cn(
          'bg-button-outline-bg border-button-outline-border border-button-outline-w border-b-button-outline-edge-w active:bg-button-outline-pressed shadow-sm',
          Platform.select({ web: 'hover:bg-button-outline-pressed' })
        ),
        secondary: cn(
          'bg-button-secondary-bg border-button-secondary-border border-button-secondary-w border-b-button-secondary-edge-w active:bg-button-secondary-pressed shadow-sm',
          Platform.select({ web: 'hover:bg-button-secondary-pressed' })
        ),
        ghost: cn(
          'bg-button-ghost-bg border-button-ghost-border border-button-ghost-w border-b-button-ghost-edge-w active:bg-button-ghost-pressed',
          Platform.select({ web: 'hover:bg-button-ghost-pressed' })
        ),
        link: '',
      },
      size: {
        default: cn('h-button-md px-button-x py-2', Platform.select({ web: 'has-[>svg]:px-3' })),
        sm: cn('h-button-sm gap-1.5 px-button-x-sm', Platform.select({ web: 'has-[>svg]:px-2.5' })),
        lg: cn('h-button-lg px-button-x-lg', Platform.select({ web: 'has-[>svg]:px-4' })),
        icon: 'h-button-md w-button-md',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'default',
    },
  }
);

const text = TOKENS.components.button.text;
const buttonTextVariants = cva(
  cn(
    // The Button's text style (its size and font), in the kit's own weight. A style with no tracking sets none
    // on native, which keeps iOS's optical tracking (as Text does).
    'text-type-button leading-type-button font-medium',
    (Platform.OS === 'web' || text.tracking !== 0) && 'tracking-type-button',
    text.font === 'heading' && 'font-heading',
    text.font === 'mono' && 'font-mono',
    Platform.select({ web: 'pointer-events-none transition-colors' })
  ),
  {
    variants: {
      variant: {
        default: 'text-button-primary-fg',
        destructive: 'text-button-destructive-fg',
        outline: 'text-button-outline-fg',
        secondary: 'text-button-secondary-fg',
        ghost: 'text-button-ghost-fg',
        link: cn(
          'text-primary group-active:underline',
          Platform.select({ web: 'underline-offset-4 hover:underline group-hover:underline' })
        ),
      },
      size: {
        default: '',
        sm: '',
        lg: '',
        icon: '',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'default',
    },
  }
);

/** Phones raise a tap target under 44pt to 44 (hitSlop): the button keeps its drawn height. */
const HEIGHT = TOKENS.components.button.height;
function touchSlop(size: ButtonProps['size']) {
  if (Platform.OS === 'web') return undefined;
  const height = size === 'sm' ? HEIGHT.sm : size === 'lg' ? HEIGHT.lg : HEIGHT.md;
  const y = Math.max(0, Math.ceil((44 - height) / 2));
  const x = size === 'icon' ? y : 0;
  return y ? { top: y, bottom: y, left: x, right: x } : undefined;
}

type ButtonProps = React.ComponentProps<typeof Pressable> & React.RefAttributes<typeof Pressable> & VariantProps<typeof buttonVariants>;

function Button({ className, variant, size, ...props }: ButtonProps) {
  return (
    <TextClassContext.Provider value={buttonTextVariants({ variant, size })}>
      <Pressable
        className={cn(props.disabled && 'opacity-50', buttonVariants({ variant, size }), className)}
        role="button"
        hitSlop={touchSlop(size)}
        {...props}
      />
    </TextClassContext.Provider>
  );
}

export { Button, buttonTextVariants, buttonVariants };
export type { ButtonProps };
