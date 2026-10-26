import { IconSizeContext } from '@/components/ui/icon';
import { TextClassContext } from '@/components/ui/text';
import { labelClass, shadowClass } from '@/lib/component-classes';
import { useLiveComponent } from '@/lib/palette-context';
import { TOKENS } from '@/lib/theme';
import { cn } from '@/lib/utils';
import { cva, type VariantProps } from 'class-variance-authority';
import { Platform, Pressable } from 'react-native';

/**
 * The theme's Button (tokens.json semantic.component.button, --button-*): corner, heights, padding, gaps, text, icon
 * size, focus ring, shadow and each variant's fill, label, border and pressed colours. Hover follows pressed;
 * disabled is 50% opacity.
 */
const button = TOKENS.components.button;
/** The shadow, on every variant but Ghost. */
const shadow = shadowClass(button.shadow);
const buttonVariants = cva(
  cn(
    'group shrink-0 flex-row items-center justify-center gap-button-gap rounded-button shadow-none',
    Platform.select({
      web: "focus-visible:border-button-focus-border aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive whitespace-nowrap outline-none transition-all focus-visible:ring-[length:var(--button-ring-w)] disabled:pointer-events-none [&_svg:not([class*='size-'])]:size-[var(--button-icon)] [&_svg]:pointer-events-none [&_svg]:shrink-0",
    })
  ),
  {
    variants: {
      variant: {
        // Primary: the theme's button style (solid, soft, outline, raised) unless the system set its colours.
        default: cn(
          'bg-button-primary-bg border-button-primary-border border-button-primary-w border-b-button-primary-edge-w active:bg-button-primary-pressed',
          shadow,
          Platform.select({ web: 'hover:bg-button-primary-pressed focus-visible:ring-button-primary-ring' })
        ),
        destructive: cn(
          'bg-button-destructive-bg border-button-destructive-border border-button-destructive-w border-b-button-destructive-edge-w active:bg-button-destructive-pressed',
          shadow,
          Platform.select({ web: 'hover:bg-button-destructive-pressed focus-visible:ring-button-destructive-ring' })
        ),
        outline: cn(
          'bg-button-outline-bg border-button-outline-border border-button-outline-w border-b-button-outline-edge-w active:bg-button-outline-pressed',
          shadow,
          Platform.select({ web: 'hover:bg-button-outline-pressed focus-visible:ring-button-outline-ring' })
        ),
        secondary: cn(
          'bg-button-secondary-bg border-button-secondary-border border-button-secondary-w border-b-button-secondary-edge-w active:bg-button-secondary-pressed',
          shadow,
          Platform.select({ web: 'hover:bg-button-secondary-pressed focus-visible:ring-button-secondary-ring' })
        ),
        ghost: cn(
          'bg-button-ghost-bg border-button-ghost-border border-button-ghost-w border-b-button-ghost-edge-w active:bg-button-ghost-pressed',
          Platform.select({ web: 'hover:bg-button-ghost-pressed focus-visible:ring-button-ghost-ring' })
        ),
        link: '',
      },
      size: {
        default: cn('h-button-md px-button-x py-2', Platform.select({ web: 'has-[>svg]:px-3' })),
        sm: cn('h-button-sm gap-button-gap-sm px-button-x-sm', Platform.select({ web: 'has-[>svg]:px-2.5' })),
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

const text = button.text;
const buttonTextVariants = cva(
  cn(
    // The Button's text style (its size and font), weight and case. A style with no tracking sets none on native,
    // which keeps iOS's optical tracking (as Text does).
    'text-type-button leading-type-button',
    labelClass(text),
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
const HEIGHT = button.height;
function touchSlop(size: ButtonProps['size']) {
  if (Platform.OS === 'web') return undefined;
  const height = size === 'sm' ? HEIGHT.sm : size === 'lg' ? HEIGHT.lg : HEIGHT.md;
  const y = Math.max(0, Math.ceil((44 - height) / 2));
  const x = size === 'icon' ? y : 0;
  return y ? { top: y, bottom: y, left: x, right: x } : undefined;
}

type ButtonProps = React.ComponentProps<typeof Pressable> & React.RefAttributes<typeof Pressable> & VariantProps<typeof buttonVariants>;

function Button({ className, variant, size, ...props }: ButtonProps) {
  // A live theme from the docs site (embedded web) brings its own weight, case and shadow.
  const live = useLiveComponent('button');
  const liveShadow = live?.shadow && variant !== 'ghost' && variant !== 'link' ? shadowClass(live.shadow) : null;
  return (
    <TextClassContext.Provider value={cn(buttonTextVariants({ variant, size }), live && labelClass(live, true))}>
      <IconSizeContext.Provider value={button.icon}>
        <Pressable
          className={cn(props.disabled && 'opacity-50', buttonVariants({ variant, size }), liveShadow, className)}
          role="button"
          hitSlop={touchSlop(size)}
          {...props}
        />
      </IconSizeContext.Provider>
    </TextClassContext.Provider>
  );
}

export { Button, buttonTextVariants, buttonVariants };
export type { ButtonProps };
