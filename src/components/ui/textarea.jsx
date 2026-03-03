"use client"

import * as React from "react"
import { cn } from "@/utils/cn"
import { fieldBase, fieldError } from "./input"

/* ─────────────────────────────────────────────────────────────────────────
   Textarea
   resize: "none" | "y" | "x" | "both"  (default "y")
───────────────────────────────────────────────────────────────────────── */
function Textarea({ className, error, resize = "y", ...props }) {
  return (
    <textarea
      data-slot="textarea"
      className={cn(
        ...fieldBase,
        // textarea-specific layout
        "flex min-h-[80px]",
        "px-3.5 py-3",
        // resize variants
        resize === "none" && "resize-none",
        resize === "y"    && "resize-y",
        resize === "x"    && "resize-x",
        resize === "both" && "resize",
        // error
        error && fieldError,
        // aria-invalid mirrors error state automatically
        "aria-invalid:border-destructive",
        "aria-invalid:focus:shadow-[0_0_0_3px_oklch(var(--destructive)/0.15)]",
        className
      )}
      {...props}
    />
  )
}

export { Textarea }