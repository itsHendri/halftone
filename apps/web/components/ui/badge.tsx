import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "cn"
import { Slot } from "radix-ui"

const badgeVariants = cva(
  // The theme's Badge: its gap, border width, padding, label (type-badge: the text style, weight and case) and icon size.
  "inline-flex w-fit shrink-0 items-center justify-center gap-(--badge-gap) overflow-hidden rounded-badge border-(length:--badge-border-w) px-(--badge-x) type-badge whitespace-nowrap transition-[color,box-shadow] focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50 aria-invalid:border-destructive aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 [&>svg]:pointer-events-none [&>svg]:size-(--badge-icon)",
  {
    variants: {
      variant: {
        // The theme's Badge (semantic.component.badge, --badge-*): each variant's fill, label and border.
        default: "border-badge-default-border bg-badge-default-bg text-badge-default-fg [a&]:hover:bg-badge-default-pressed",
        secondary:
          "border-badge-secondary-border bg-badge-secondary-bg text-badge-secondary-fg [a&]:hover:bg-badge-secondary-pressed",
        destructive:
          "border-badge-destructive-border bg-badge-destructive-bg text-badge-destructive-fg focus-visible:ring-destructive/20 dark:focus-visible:ring-destructive/40 [a&]:hover:bg-badge-destructive-pressed",
        outline:
          "border-badge-outline-border bg-badge-outline-bg text-badge-outline-fg [a&]:hover:bg-badge-outline-pressed",
        ghost: "border-transparent [a&]:hover:bg-accent [a&]:hover:text-accent-foreground",
        link: "border-transparent text-primary underline-offset-4 [a&]:hover:underline",
      },
      // S and M (--badge-h-*): exact heights, the label centred.
      size: {
        sm: "h-(--badge-h-sm)",
        md: "h-(--badge-h-md)",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "md",
    },
  }
)

function Badge({
  className,
  variant = "default",
  size = "md",
  asChild = false,
  ...props
}: React.ComponentProps<"span"> &
  VariantProps<typeof badgeVariants> & { asChild?: boolean }) {
  const Comp = asChild ? Slot.Root : "span"

  return (
    <Comp
      data-slot="badge"
      data-variant={variant}
      data-size={size}
      className={cn(badgeVariants({ variant, size }), className)}
      {...props}
    />
  )
}

export { Badge, badgeVariants }
