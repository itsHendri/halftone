import * as React from "react"
import { cn } from "cn"

function Textarea({ className, ...props }: React.ComponentProps<"textarea">) {
  return (
    <textarea
      data-slot="textarea"
      className={cn(
        // The theme's Input (semantic.component.input, --field-*), as Input draws it.
        "flex field-sizing-content min-h-16 w-full rounded-t-field rounded-b-field-b border-(length:--field-border-w) border-b-(length:--field-edge-w) border-field-default-border bg-field-default-bg px-field-x py-2 type-field text-field-default-fg shadow-(--field-shadow) transition-[color,box-shadow] outline-none placeholder:text-field-placeholder focus-visible:border-field-focus-border focus-visible:bg-field-focus-bg focus-visible:text-field-focus-fg focus-visible:ring-(length:--field-ring-w) focus-visible:ring-field-focus-ring disabled:cursor-not-allowed disabled:border-field-disabled-border disabled:bg-field-disabled-bg disabled:text-field-disabled-fg disabled:opacity-50 aria-invalid:border-field-error-border aria-invalid:bg-field-error-bg aria-invalid:text-field-error-fg aria-invalid:ring-field-error-ring",
        className
      )}
      {...props}
    />
  )
}

export { Textarea }
