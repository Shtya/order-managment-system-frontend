"use client";

import * as React from "react";
import { cn } from "@/utils/cn";

const chipSizeClasses = {
  normal: "pl-1 pr-2 py-0.5 text-xs",
  small: "pl-1 pr-1.5 py-px text-[10px]",
};

const chipIconSizeClasses = {
  normal: "h-4 w-4 text-[10px]",
  small: "h-3.5 w-3.5 text-[9px]",
};

const VariableChip = React.memo(function VariableChip({
  variable,
  example,
  showExample = false,
  size = "normal",
  className,
}) {
  const Icon = variable?.icon;
  const label = variable?.label ?? "";
  const preview = example ?? variable?.preview ?? variable?.example;

  return (
    <span
      className={cn(
        "inline-flex max-w-full min-w-0 flex-wrap items-center gap-1.5 align-middle select-none",
        "mx-0.5 rounded-sm border border-border bg-foreground/5",
        chipSizeClasses[size] ?? chipSizeClasses.normal,
        className,
      )}
    >
      <span
        className={cn(
          "flex shrink-0 items-center justify-center rounded-[4px] bg-[var(--primary)] font-bold text-white",
          chipIconSizeClasses[size] ?? chipIconSizeClasses.normal,
        )}
      >
        {Icon ? (
          <Icon
            className={cn(
              "text-current",
              size === "small" ? "h-2 w-2" : "h-2.5 w-2.5",
            )}
          />
        ) : (
          label?.[0]?.toUpperCase() ?? "•"
        )}
      </span>
      <span className="min-w-0 break-all font-medium text-foreground">
        {label}
      </span>
      {preview != null && preview !== "" && (
        <span
          className={cn(
            "min-w-0 break-all",
            showExample
              ? "font-medium text-foreground"
              : "text-muted-foreground/80",
          )}
        >
          {preview}
        </span>
      )}
    </span>
  );
});

VariableChip.displayName = "VariableChip";

const flattenVariables = (variables = []) =>
  variables.flatMap((variable) => [
    variable,
    ...flattenVariables(variable.children || []),
  ]);

const readableVariableName = (id = "") => {
  const leaf = id.split(".").at(-1) || id;
  return leaf
    .replace(/([a-z0-9])([A-Z])/g, "$1 $2")
    .replace(/[_-]+/g, " ")
    .replace(/^./, (character) => character.toUpperCase());
};

const VariablePreviewValue = React.memo(function VariablePreviewValue({
  variable,
  value,
  className,
}) {
  const label = variable?.label || readableVariableName(variable?.id);
  const hasValue = value != null && String(value).trim() !== "";

  return (
    <span
      dir="auto"
      data-preview-variable-state={hasValue ? "value" : "missing"}
      aria-label={hasValue ? `${label}: ${value}` : label}
      title={label}
      className={cn(
        "mx-px inline rounded-sm px-0.5 py-0 align-baseline font-medium leading-[inherit] decoration-clone",
        hasValue
          ? "border-b border-dotted border-primary/70 bg-primary/10 text-inherit"
          : "border border-dashed border-amber-400 bg-amber-50 text-amber-800",
        className,
      )}
    >
      {hasValue ? String(value) : label}
    </span>
  );
});

VariablePreviewValue.displayName = "VariablePreviewValue";

function VariablePreviewText({ text, variables = [], values, className }) {
  const catalog = React.useMemo(() => flattenVariables(variables), [variables]);
  const pieces = String(text || "").split(/(\{\{\s*[^{}]+?\s*\}\})/g);

  return (
    <span className={className}>
      {pieces.map((piece, index) => {
        const match = piece.match(/^\{\{\s*([^{}]+?)\s*\}\}$/);
        if (!match) return <React.Fragment key={index}>{piece}</React.Fragment>;
        const id = match[1].trim();
        const variable = catalog.find((item) => item.id === id) || {
          id,
          label: readableVariableName(id),
        };
        const hasValues = values != null;
        const value = hasValues
          ? values?.[id]
          : variable.preview ?? variable.example;
        return (
          <VariablePreviewValue
            key={`${id}-${index}`}
            variable={variable}
            value={value}
          />
        );
      })}
    </span>
  );
}

export { VariableChip, VariablePreviewText, VariablePreviewValue };
export default VariableChip;
