import * as React from "react"
import { cn } from "cn"

function Input({
  className,
  type,
  inputSize = "md",
  ...props
}: React.ComponentProps<"input"> & {
  /** S, M or L (--field-h-*); M by default. (`size` is HTML's own attribute.) */
  inputSize?: "sm" | "md" | "lg"
}) {
  return (
    <input
      type={type}
      data-slot="input"
      data-size={inputSize}
      className={cn(
        // The theme's Input (semantic.component.input, --field-*): the field style's fill, line, corners, inset and
        // shadow, its height, text and placeholder, the focus ring's width, and each state's colours.
        "data-[size=sm]:h-(--field-h-sm) data-[size=md]:h-(--field-h-md) data-[size=lg]:h-(--field-h-lg) w-full min-w-0 rounded-t-field rounded-b-field-b border-(length:--field-border-w) border-b-(length:--field-edge-w) border-field-default-border bg-field-default-bg px-field-x py-1 type-field text-field-default-fg shadow-(--field-shadow) transition-[color,box-shadow] outline-none selection:bg-primary selection:text-primary-foreground file:inline-flex file:h-7 file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-foreground placeholder:text-field-placeholder disabled:pointer-events-none disabled:cursor-not-allowed disabled:border-field-disabled-border disabled:bg-field-disabled-bg disabled:text-field-disabled-fg disabled:opacity-50",
        "focus-visible:border-field-focus-border focus-visible:bg-field-focus-bg focus-visible:text-field-focus-fg focus-visible:ring-(length:--field-ring-w) focus-visible:ring-field-focus-ring",
        "aria-invalid:border-field-error-border aria-invalid:bg-field-error-bg aria-invalid:text-field-error-fg aria-invalid:ring-field-error-ring",
        className
      )}
      {...props}
    />
  )
}

export { Input }
