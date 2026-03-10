"use client"

import * as React from "react"
import * as SelectPrimitive from "@radix-ui/react-select"
import { CheckIcon, ChevronDownIcon, ChevronUpIcon } from "lucide-react"
import { cn } from "@/utils/cn"
import { fieldBase } from "./input"

/* ─────────────────────────────────────────────────────────────────────────
   Body-scroll unlock while dropdown is open (Radix portal workaround)
───────────────────────────────────────────────────────────────────────── */
function useUnlockBodyScrollWhileMounted(enabled) {
  React.useEffect(() => {
    if (!enabled) return
    const body = document.body
    const unlock = () => {
      body.removeAttribute("data-scroll-locked")
      if (body.style.overflow === "hidden") body.style.overflow = ""
      body.style.paddingRight = ""
    }
    unlock()
    const obs = new MutationObserver(unlock)
    obs.observe(body, { attributes: true, attributeFilter: ["style", "data-scroll-locked"] })
    return () => obs.disconnect()
  }, [enabled])
}

/* ─────────────────────────────────────────────────────────────────────────
   Root / Group / Value  (pass-through wrappers)
───────────────────────────────────────────────────────────────────────── */
function Select(props)      { return <SelectPrimitive.Root  data-slot="select"       {...props} /> }
function SelectGroup(props) { return <SelectPrimitive.Group data-slot="select-group" {...props} /> }
function SelectValue(props) { return <SelectPrimitive.Value data-slot="select-value" {...props} /> }

/* ─────────────────────────────────────────────────────────────────────────
   Trigger
   Sizes: sm (h-9) | default (h-11) | lg (h-12)  — matches Input exactly
───────────────────────────────────────────────────────────────────────── */
function SelectTrigger({ className, size = "default", children, ...props }) {
  return (
    <SelectPrimitive.Trigger
      data-slot="select-trigger"
      data-size={size}
      className={cn(
        // ── reuse the same base tokens as Input / Textarea ──
        ...fieldBase,
        // layout overrides for trigger
        "group relative rtl:flex-row-reverse inline-flex items-center justify-between gap-2",
        // sizes — identical to InputBase
        "  data-[size=sm]:text-xs  data-[size=sm]:px-3",
        "!h-10 data-[size=default]:text-sm data-[size=default]:px-3.5",
        " data-[size=lg]:text-sm data-[size=lg]:px-4",
        // open state — same glow so the panel looks connected
        "data-[state=open]:border-[var(--primary)]",
        "data-[state=open]:shadow-[0_0_0_3px_rgb(var(--primary-shadow))]",
        "data-[state=open]:bg-background", 
        "data-[placeholder]:text-muted-foreground/50",
        // inner helpers
        "*:data-[slot=select-value]:line-clamp-1 *:data-[slot=select-value]:flex *:data-[slot=select-value]:items-center *:data-[slot=select-value]:gap-2",
        "[&_svg]:pointer-events-none [&_svg]:shrink-0",
        className
      )}
      {...props}
    >
      {/* Subtle top sheen — same as before */}
      <span
        aria-hidden
        className="pointer-events-none absolute inset-x-0 top-0 h-1/2 rounded-t-xl
          bg-gradient-to-b from-white/20 to-transparent dark:from-white/[0.06]"
      />

      {/* Left accent line (visible only when open) */}
      <span
        aria-hidden
        className="pointer-events-none absolute start-0 top-2 bottom-2 w-[2px] rounded-full
          bg-gradient-to-b from-[var(--primary)] to-[var(--third,#ff5c2b)]
          opacity-0 group-data-[state=open]:opacity-100 transition-opacity duration-200"
      />

      <span className="relative z-10 flex">{children}</span>

      <SelectPrimitive.Icon asChild>
        <ChevronDownIcon
          className={cn(
            "relative z-10 size-4 shrink-0 transition-all duration-300",
            "text-muted-foreground/60",
            "group-data-[state=open]:text-[var(--primary)] group-data-[state=open]:rotate-180",
          )}
        />
      </SelectPrimitive.Icon>
    </SelectPrimitive.Trigger>
  )
}

/* ─────────────────────────────────────────────────────────────────────────
   Content (dropdown panel)
───────────────────────────────────────────────────────────────────────── */
function SelectContent({ className, children, position = "popper", align = "start", ...props }) {
  useUnlockBodyScrollWhileMounted(true)

  const isRTL =
    typeof document !== "undefined" &&
    (document.documentElement.dir === "rtl" || document.body.dir === "rtl")

  const resolvedAlign =
    position === "popper"
      ? isRTL
        ? align === "start" ? "end" : align === "end" ? "start" : align
        : align
      : align

  return (
    <SelectPrimitive.Portal>
      <SelectPrimitive.Content
        data-slot="select-content"
        position={position}
        align={resolvedAlign}
        sideOffset={6}
        style={{
          width: "var(--radix-select-trigger-width)",
          minWidth: "var(--radix-select-trigger-width)",
        }}
        className={cn(
          "relative  z-50 overflow-hidden !rounded-md",
           "border border-[var(--primary)]/20",
           "bg-popover/95 backdrop-blur-sm text-popover-foreground",
          // shadow
          "shadow-[0_8px_32px_rgba(0,0,0,0.12),0_2px_8px_rgba(0,0,0,0.08)]",
          "dark:shadow-[0_8px_32px_rgba(0,0,0,0.5),0_2px_8px_rgba(0,0,0,0.3)]",
          "max-h-[var(--radix-select-content-available-height)]",
          // animations
          "data-[state=open]:animate-in data-[state=closed]:animate-out",
          "data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0",
          "data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-100",
          "data-[side=bottom]:slide-in-from-top-2 data-[side=top]:slide-in-from-bottom-2",
          "data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2",
          className,
        )}
        {...props}
      >
         

        {/* Inner top sheen */}
        <div
          aria-hidden
          className="pointer-events-none absolute inset-x-0 top-0 h-16
            bg-gradient-to-b from-white/[0.04] to-transparent dark:from-white/[0.03]"
        />

        <SelectScrollUpButton />

        <SelectPrimitive.Viewport className="w-full p-1.5">
          {children}
        </SelectPrimitive.Viewport>

        <SelectScrollDownButton />

        {/* Bottom gradient fade */}
        <div
          aria-hidden
          className="pointer-events-none absolute inset-x-0 bottom-0 h-4
            bg-gradient-to-t from-popover/80 to-transparent"
        />
      </SelectPrimitive.Content>
    </SelectPrimitive.Portal>
  )
}

/* ─────────────────────────────────────────────────────────────────────────
   Label
───────────────────────────────────────────────────────────────────────── */
function SelectLabel({ className, ...props }) {
  return (
    <SelectPrimitive.Label
      data-slot="select-label"
      className={cn(
        "px-3 pt-2 pb-1 text-[10px] font-black uppercase tracking-widest text-muted-foreground/60",
        className,
      )}
      {...props}
    />
  )
}

/* ─────────────────────────────────────────────────────────────────────────
   Item
───────────────────────────────────────────────────────────────────────── */
function SelectItem({ className, children, ...props }) {
  return (
    <SelectPrimitive.Item
      data-slot="select-item"
      className={cn(
        "group relative rtl:flex-row-reverse",
        "flex w-full cursor-default select-none items-center gap-2.5",
        "!rounded-md px-3 py-2.5 text-sm outline-none",
        // default
        "text-foreground/80",
        // hover / focus — uses primary token
        "focus:bg-[var(--primary)]/8 focus:text-foreground",
        // selected
        "data-[state=checked]:text-[var(--primary)] data-[state=checked]:font-semibold",
        // disabled
        "data-[disabled]:pointer-events-none data-[disabled]:opacity-40",
        "transition-colors duration-150 rtl:text-right",
        className,
      )}
      {...props}
    >
      <SelectPrimitive.ItemText className="flex-1 truncate">
        {children}
      </SelectPrimitive.ItemText>

      <span
        aria-hidden
        className="pointer-events-none absolute inset-0 !rounded-md
          bg-gradient-to-r from-[var(--primary)]/0 via-[var(--primary)]/6 to-[var(--primary)]/0
          opacity-0 group-focus:opacity-100 transition-opacity duration-150"
      />
    </SelectPrimitive.Item>
  )
}

/* ─────────────────────────────────────────────────────────────────────────
   Separator
───────────────────────────────────────────────────────────────────────── */
function SelectSeparator({ className, ...props }) {
  return (
    <SelectPrimitive.Separator
      data-slot="select-separator"
      className={cn("my-1.5 mx-3 h-px bg-gradient-to-r from-transparent via-border to-transparent", className)}
      {...props}
    />
  )
}

/* ─────────────────────────────────────────────────────────────────────────
   Scroll Buttons
───────────────────────────────────────────────────────────────────────── */
function SelectScrollUpButton({ className, ...props }) {
  return (
    <SelectPrimitive.ScrollUpButton
      data-slot="select-scroll-up-button"
      className={cn(
        "flex cursor-default items-center justify-center py-1.5",
        "text-muted-foreground hover:text-[var(--primary)]",
        "bg-gradient-to-b from-popover to-transparent",
        "transition-colors duration-150",
        className,
      )}
      {...props}
    >
      <ChevronUpIcon className="size-4" />
    </SelectPrimitive.ScrollUpButton>
  )
}

function SelectScrollDownButton({ className, ...props }) {
  return (
    <SelectPrimitive.ScrollDownButton
      data-slot="select-scroll-down-button"
      className={cn(
        "flex cursor-default items-center justify-center py-1.5",
        "text-muted-foreground hover:text-[var(--primary)]",
        "bg-gradient-to-t from-popover to-transparent",
        "transition-colors duration-150",
        className,
      )}
      {...props}
    >
      <ChevronDownIcon className="size-4" />
    </SelectPrimitive.ScrollDownButton>
  )
}

/* ─────────────────────────────────────────────────────────────────────────
   Exports
───────────────────────────────────────────────────────────────────────── */
export {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectScrollDownButton,
  SelectScrollUpButton,
  SelectSeparator,
  SelectTrigger,
  SelectValue,
}