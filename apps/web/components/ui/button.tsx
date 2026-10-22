import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "cn"
import { Slot } from "radix-ui"

const buttonVariants = cva(
  "inline-flex shrink-0 items-center justify-center gap-2 rounded-button type-button font-medium whitespace-nowrap transition-all outline-none focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50 disabled:pointer-events-none disabled:opacity-50 aria-invalid:border-destructive aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4",
  {
    variants: {
      variant: {
        // The theme's Button (semantic.component.button, --button-*): each variant's fill, label, border and
        // pressed colours; hover follows pressed. Primary is the theme's button style unless the system set it.
        default:
          "border-(length:--button-primary-border-w) border-b-(length:--button-primary-edge-w) border-button-primary-border bg-button-primary-bg text-button-primary-fg hover:bg-button-primary-pressed active:bg-button-primary-pressed",
        destructive:
          "border-(length:--button-destructive-border-w) border-b-(length:--button-destructive-edge-w) border-button-destructive-border bg-button-destructive-bg text-button-destructive-fg hover:bg-button-destructive-pressed active:bg-button-destructive-pressed focus-visible:ring-destructive/20 dark:focus-visible:ring-destructive/40",
        outline:
          "border-(length:--button-outline-border-w) border-b-(length:--button-outline-edge-w) border-button-outline-border bg-button-outline-bg text-button-outline-fg shadow-xs hover:bg-button-outline-pressed active:bg-button-outline-pressed",
        secondary:
          "border-(length:--button-secondary-border-w) border-b-(length:--button-secondary-edge-w) border-button-secondary-border bg-button-secondary-bg text-button-secondary-fg hover:bg-button-secondary-pressed active:bg-button-secondary-pressed",
        ghost:
          "border-(length:--button-ghost-border-w) border-b-(length:--button-ghost-edge-w) border-button-ghost-border bg-button-ghost-bg text-button-ghost-fg hover:bg-button-ghost-pressed active:bg-button-ghost-pressed",
        link: "text-primary underline-offset-4 hover:underline",
      },
      size: {
        // The theme's sizes, shared with the mobile kit: heights and padding (--button-h-*, --button-x*).
        default: "h-(--button-h-md) px-(--button-x) py-2 has-[>svg]:px-3",
        xs: "h-6 gap-1 px-2 text-xs has-[>svg]:px-1.5 [&_svg:not([class*='size-'])]:size-3",
        sm: "h-(--button-h-sm) gap-1.5 px-(--button-x-sm) has-[>svg]:px-2.5",
        lg: "h-(--button-h-lg) px-(--button-x-lg) has-[>svg]:px-4",
        icon: "size-(--button-h-md)",
        "icon-xs": "size-6 [&_svg:not([class*='size-'])]:size-3",
        "icon-sm": "size-(--button-h-sm)",
        "icon-lg": "size-(--button-h-lg)",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

function Button({
  className,
  variant = "default",
  size = "default",
  asChild = false,
  ...props
}: React.ComponentProps<"button"> &
  VariantProps<typeof buttonVariants> & {
    asChild?: boolean
  }) {
  const Comp = asChild ? Slot.Root : "button"

  return (
    <Comp
      data-slot="button"
      data-variant={variant}
      data-size={size}
      className={cn(buttonVariants({ variant, size, className }))}
      {...props}
    />
  )
}

export { Button, buttonVariants }
