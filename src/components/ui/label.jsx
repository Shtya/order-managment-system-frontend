"use client"

import * as React from "react"
import * as LabelPrimitive from "@radix-ui/react-label"

import { cn } from "@/utils/cn"

function Label({
  className,
  ...props
}) {
  return (
    <LabelPrimitive.Root
      data-slot="label"
      className={cn(
        "flex text-[11px] font-medium text-muted-foreground items-center gap-2 text-sm leading-none  peer-disabled:opacity-50",
        // className
      )}
      {...props} />
  );
}

export { Label }
