import * as React from "react"
import { cn } from "cn"

function Input({ className, type, ...props }: React.ComponentProps<"input">) {
  return (
    <input
      type={type}
      data-slot="input"
      className={cn(
        // The theme's Input (semantic.component.input, --field-*): the field style's fill, line, corners, inset and
        // shadow, its height and text, and each state's colours.
        "h-(--field-h-md) w-full min-w-0 rounded-t-field rounded-b-field-b border-(length:--field-border-w) border-b-(length:--field-edge-w) border-field-default-border bg-field-default-bg px-field-x py-1 type-field text-field-default-fg shadow-(--field-shadow) transition-[color,box-shadow] outline-none selection:bg-primary selection:text-primary-foreground file:inline-flex file:h-7 file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-foreground placeholder:text-muted-foreground disabled:pointer-events-none disabled:cursor-not-allowed disabled:border-field-disabled-border disabled:bg-field-disabled-bg disabled:text-field-disabled-fg disabled:opacity-50",
        "focus-visible:border-field-focus-border focus-visible:ring-[3px] focus-visible:ring-field-focus-ring",
        "aria-invalid:border-field-error-border aria-invalid:ring-field-error-ring",
        className
      )}
      {...props}
    />
  )
}

export { Input }
