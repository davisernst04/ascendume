import * as React from "react"

import { cn } from "@/lib/utils"

/** Shared look for text inputs and textareas: a ruled field that turns blue-brand on focus. */
export const fieldClass =
  "w-full min-w-0 rounded-md border border-input bg-raised px-3 py-2 text-[0.9375rem] text-ink transition-colors outline-none placeholder:text-ink-soft/70 focus-visible:border-brand focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-brand/20 disabled:cursor-not-allowed disabled:opacity-50 aria-invalid:border-danger"

function Input({ className, type, ...props }: React.ComponentProps<"input">) {
  return (
    <input
      type={type}
      data-slot="input"
      className={cn(fieldClass, "h-10", className)}
      {...props}
    />
  )
}

function Textarea({ className, ...props }: React.ComponentProps<"textarea">) {
  return (
    <textarea
      data-slot="textarea"
      className={cn(fieldClass, "resize-y leading-relaxed", className)}
      {...props}
    />
  )
}

export { Input, Textarea }
