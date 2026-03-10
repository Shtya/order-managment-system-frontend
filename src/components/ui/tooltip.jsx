 "use client"

import * as React from "react"
import * as TooltipPrimitive from "@radix-ui/react-tooltip"

import { cn } from "@/utils/cn"

function TooltipProvider({
  delayDuration = 0,
  ...props
}) {
  return (
    <TooltipPrimitive.Provider
      data-slot="tooltip-provider"
      delayDuration={delayDuration}
      {...props}
    />
  );
}

function Tooltip({ ...props }) {
  return (
    <TooltipProvider>
      <TooltipPrimitive.Root data-slot="tooltip" {...props} />
    </TooltipProvider>
  );
}

function TooltipTrigger({ ...props }) {
  return <TooltipPrimitive.Trigger data-slot="tooltip-trigger" {...props} />;
}

function TooltipContent({
  className,
  sideOffset = 0,
  children,
  arrowClassName,
  arrowStyle,
  ...props
}) {
  return (
    <TooltipPrimitive.Portal>
      <TooltipPrimitive.Content
        data-slot="tooltip-content"
        sideOffset={sideOffset}
        className={cn(
          "animate-in fade-in-0 zoom-in-95 data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=closed]:zoom-out-95",
          "data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2",
          "z-50 w-fit origin-(--radix-tooltip-content-transform-origin)",
          "!rounded-md px-3 py-1.5 text-xs font-semibold text-white text-balance border-none",
          className
        )}
        style={{
          background: "linear-gradient(135deg, rgb(var(--primary-from)), rgb(var(--primary-to)))",
          boxShadow: "0 4px 16px rgb(var(--primary-shadow))",
        }}
        {...props}
      >
        {children}
        <TooltipPrimitive.Arrow
          className={cn("z-50 size-2.5 translate-y-[calc(-50%_0px)] rounded-[12px]", arrowClassName)}
          style={{ fill: `rgb(var(--primary-to))`, ...arrowStyle }}
        />
      </TooltipPrimitive.Content>
    </TooltipPrimitive.Portal>
  );
}

const TooltipArrow = TooltipPrimitive.Arrow

export { Tooltip, TooltipTrigger, TooltipContent, TooltipProvider, TooltipArrow }