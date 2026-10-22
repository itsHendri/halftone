import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "cn"
import { Slot } from "radix-ui"

const badgeVariants = cva(
  "inline-flex w-fit shrink-0 items-center justify-center gap-1 overflow-hidden rounded-badge border px-(--badge-x) py-0.5 type-badge font-medium whitespace-nowrap transition-[color,box-shadow] focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50 aria-invalid:border-destructive aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 [&>svg]:pointer-events-none [&>svg]:size-3",
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
    },
    defaultVariants: {
      variant: "default",
    },
  }
)

function Badge({
  className,
  variant = "default",
  asChild = false,
  ...props
}: React.ComponentProps<"span"> &
  VariantProps<typeof badgeVariants> & { asChild?: boolean }) {
  const Comp = asChild ? Slot.Root : "span"

  return (
    <Comp
      data-slot="badge"
      data-variant={variant}
      className={cn(badgeVariants({ variant }), className)}
      {...props}
    />
  )
}

export { Badge, badgeVariants }
