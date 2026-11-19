import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { Slot } from "radix-ui"

import { cn } from "@/lib/utils"

const buttonVariants = cva(
  "group/button inline-flex shrink-0 items-center justify-center rounded-md border border-transparent text-sm font-semibold whitespace-nowrap transition-colors outline-none select-none focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand disabled:pointer-events-none disabled:opacity-45 [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4",
  {
    variants: {
      variant: {
        // Primary action.
        default: "bg-brand text-primary-foreground hover:bg-brand-deep",
        outline:
          "border-rule-strong bg-transparent text-ink hover:bg-mist/70 aria-expanded:bg-mist/70",
        secondary: "bg-mist text-ink hover:bg-mist-deep",
        ghost:
          "text-ink-soft hover:bg-mist/70 hover:text-ink aria-expanded:bg-mist/70 aria-expanded:text-ink",
        // Ochre highlighter: reviewing, or taking a suggestion the review made.
        marker: "bg-marker text-[#2b2620] hover:bg-marker-deep",
        destructive: "bg-danger text-white hover:bg-danger/90 dark:text-surface",
        link: "h-auto px-0 text-brand underline-offset-4 hover:underline",
      },
      size: {
        default: "h-9 gap-2 px-3.5",
        xs: "h-7 gap-1 px-2 text-xs [&_svg:not([class*='size-'])]:size-3.5",
        sm: "h-8 gap-1.5 px-3 text-[0.8125rem] [&_svg:not([class*='size-'])]:size-3.5",
        lg: "h-12 gap-2 px-5 text-base",
        icon: "size-9",
        "icon-xs": "size-7 [&_svg:not([class*='size-'])]:size-3.5",
        "icon-sm": "size-8",
        "icon-lg": "size-10",
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
