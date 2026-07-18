"use client"

import * as React from "react"
import * as LabelPrimitive from "@radix-ui/react-label"

import { cn } from "@/utils/cn"
import { FieldTooltip } from "@/components/ui/field-tooltip"

function Label({
  className,
  description,
  children,
  ...props
}) {
  return (
    <LabelPrimitive.Root
      data-slot="label"
      className={cn(
        "flex text-[11px] font-medium text-muted-foreground items-center gap-2 text-sm leading-none  peer-disabled:opacity-50",
        // className
      )}
      {...props}>
      {children}
      <FieldTooltip description={description} />
    </LabelPrimitive.Root>
  );
}

export { Label }
