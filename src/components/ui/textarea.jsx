"use client"

import * as React from "react"
import { cn } from "@/utils/cn"

/**
 * Textarea — themed to match Input and Select.
 *
 * Extra props:
 *   error    — boolean, activates destructive ring + border
 *   resize   — "none" | "y" | "x" | "both" (default: "y")
 *
 * Usage:
 *   <Textarea placeholder="Write a note…" rows={4} />
 *   <Textarea error={!!errors.note} resize="none" />
 */

function Textarea({ className, error, resize = "y", ...props }) {
  return (
    <textarea
      data-slot="textarea"
      className={cn(
        // layout
        "flex w-full min-w-0 min-h-[80px]",
        // shape + base colors
        "rounded-xl border border-border",
        "bg-background/60 text-foreground text-sm",
        "px-3.5 py-3",
        // placeholder
        "placeholder:text-muted-foreground/50",
        // selection
        "selection:bg-[var(--primary)]/20 selection:text-foreground",
        // shadow + transition
        "shadow-sm transition-all duration-200",
        // hover
        "hover:border-[var(--primary)]/50 dark:hover:border-[#5b4bff]/50",
        "hover:bg-background",
        // focus — identical ring to Input / Select
        "!outline-none",
        "focus:border-[var(--primary)] dark:focus:border-[#5b4bff]",
        "focus:bg-background",
        "focus:shadow-[0_0_0_3px_rgba(255,139,0,0.12)] dark:focus:shadow-[0_0_0_3px_rgba(91,75,255,0.18)]",
        // resize
        resize === "none"  && "resize-none",
        resize === "y"     && "resize-y",
        resize === "x"     && "resize-x",
        resize === "both"  && "resize",
        // disabled
        "disabled:cursor-not-allowed disabled:opacity-50",
        // error state
        error && [
          "border-destructive",
          "focus:border-destructive",
          "focus:shadow-[0_0_0_3px_rgba(239,68,68,0.15)] dark:focus:shadow-[0_0_0_3px_rgba(239,68,68,0.2)]",
        ],
        // aria-invalid
        "aria-invalid:border-destructive",
        "aria-invalid:focus:shadow-[0_0_0_3px_rgba(239,68,68,0.15)]"
      )}
      {...props}
    />
  )
}

export { Textarea }