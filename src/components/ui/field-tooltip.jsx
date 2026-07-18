"use client"

import { CircleHelp } from "lucide-react"
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip"

function FieldTooltip({ description, side = "top", sideOffset = 4, className, stopPropagation }) {
  if (!description) return null

  const handlers = stopPropagation
    ? {
        onClick: (e) => e.stopPropagation(),
        onPointerDown: (e) => e.stopPropagation(),
      }
    : {}

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <CircleHelp
          {...handlers}
          className={`size-3.5 shrink-0 text-muted-foreground/60 hover:text-muted-foreground transition-colors cursor-help ${className || ""}`}
        />
      </TooltipTrigger>
      <TooltipContent side={side} sideOffset={sideOffset}>
        {description}
      </TooltipContent>
    </Tooltip>
  )
}

export { FieldTooltip }
