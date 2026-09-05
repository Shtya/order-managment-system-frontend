"use client";

import { Check, ChevronDown, Loader2, X } from "lucide-react";
import { useState } from "react";
import { useTranslations } from "next-intl";
import { Input } from "@/components/ui/input";
import DateRangePicker from "@/components/atoms/DateRangePicker";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/utils/cn";
import {
  fieldMeta,
  isPercentField,
  operatorNeedsValue,
} from "./audience-filter.utils";
import { FIELD_TO_LOOKUP_KEY, SEARCHABLE_AUDIENCE_FIELDS } from "./lookups";
import { AudienceLookupSearch } from "./AudienceLookupSearch";

function ValuesLoadingField({ label }) {
  return (
    <div className="flex h-10 w-full items-center gap-2 rounded-md border border-border bg-muted/40 px-3 text-sm text-muted-foreground">
      <Loader2 size={14} className="animate-spin shrink-0" />
      <span className="truncate">{label}</span>
    </div>
  );
}

function OptionsMultiSelect({ options, value, onChange, placeholder, disabled, error }) {
  const selected = Array.isArray(value) ? value.map(String) : [];
  const labels = options
    .filter((opt) => selected.includes(String(opt.value)))
    .map((opt) => opt.label);

  const toggle = (nextValue) => {
    if (disabled) return;
    const exists = selected.includes(nextValue);
    onChange(exists ? selected.filter((item) => item !== nextValue) : [...selected, nextValue]);
  };

  return (
    <Popover>
      <PopoverTrigger asChild>
        <button
          type="button"
          disabled={disabled}
          className={cn(
            "relative min-h-10 w-full rounded-md border bg-background px-3 pe-8 py-2 text-sm text-start disabled:opacity-60",
            error ? "border-destructive" : "border-border",
          )}
        >
          {labels.length ? (
            <span className="flex flex-wrap gap-1">
              {labels.map((label, index) => (
                <span key={`${selected[index]}-${label}`} className="truncate rounded-md bg-muted px-1.5 py-0.5 text-xs">
                  {label}
                </span>
              ))}
            </span>
          ) : (
            <span className="text-muted-foreground">{placeholder}</span>
          )}
          <ChevronDown size={14} className="absolute end-3 top-1/2 -translate-y-1/2 opacity-60" />
        </button>
      </PopoverTrigger>
      <PopoverContent align="start" className="p-1 max-h-64 overflow-y-auto w-[var(--radix-popover-trigger-width)]">
        {options.map((opt) => {
          const active = selected.includes(String(opt.value));
          return (
            <button
              type="button"
              key={String(opt.value)}
              className="flex w-full items-center gap-2 rounded-lg px-2 py-1.5 text-sm hover:bg-muted"
              onClick={() => toggle(String(opt.value))}
            >
              <span
                className={cn(
                  "flex h-4 w-4 items-center justify-center rounded border",
                  active && "border-primary bg-primary text-primary-foreground",
                )}
              >
                {active && <Check size={10} />}
              </span>
              {opt.label}
            </button>
          );
        })}
      </PopoverContent>
    </Popover>
  );
}

function ListTextValues({ value, onChange, placeholder, disabled, error }) {
  const t = useTranslations("audienceFilter");
  const selected = Array.isArray(value) ? value.map(String).filter(Boolean) : [];
  const [draft, setDraft] = useState("");

  const commit = () => {
    const next = draft.trim();
    if (!next) return;
    if (!selected.includes(next)) onChange([...selected, next]);
    setDraft("");
  };

  return (
    <div
      className={cn(
        "rounded-md border bg-background px-2 py-1.5",
        error ? "border-destructive" : "border-border",
        disabled && "opacity-60 pointer-events-none",
      )}
    >
      <div className="flex flex-wrap gap-1">
        {selected.map((item) => (
          <span key={item} className="inline-flex items-center gap-1 rounded-md bg-muted px-1.5 py-0.5 text-xs">
            {item}
            <button type="button" onClick={() => onChange(selected.filter((valueItem) => valueItem !== item))}>
              <X size={10} />
            </button>
          </span>
        ))}
      </div>
      <Input
        value={draft}
        onChange={(event) => setDraft(event.target.value)}
        onKeyDown={(event) => {
          if (event.key === "Enter" || event.key === ",") {
            event.preventDefault();
            commit();
          }
        }}
        onBlur={commit}
        placeholder={placeholder || t("addListValue")}
        className="h-8 border-0 shadow-none px-1 focus-visible:ring-0"
        disabled={disabled}
      />
    </div>
  );
}

export function AudienceRuleValue({
  field,
  operator,
  value,
  onChange,
  metadata,
  options = {},
  disabled,
  lookupsLoading,
  error = false,
}) {
  const t = useTranslations("audienceFilter");
  const tTags = useTranslations("tags");
  if (!operatorNeedsValue(operator)) {
    return <div className="h-10 flex items-center text-xs text-muted-foreground">{t("noValueNeeded")}</div>;
  }

  const meta = fieldMeta(metadata, field);
  const opts = options[field] || [];
  const lookupKey = FIELD_TO_LOOKUP_KEY[field];
  const searchKind = SEARCHABLE_AUDIENCE_FIELDS[field];
  const isList = operator === "in" || operator === "not_in";
  const waitingForLabels = Boolean(lookupKey && lookupsLoading?.[lookupKey] && !opts.length);

  if (waitingForLabels) {
    return <ValuesLoadingField label={t("valuesLoading")} />;
  }

  if (searchKind) {
    return (
      <AudienceLookupSearch
        field={field}
        kind={searchKind}
        value={value}
        onChange={onChange}
        multiple={isList}
        disabled={disabled}
        error={error}
      />
    );
  }

  if (meta?.valueType === "boolean") {
    const trueLabel = field === "order.phone.valid" ? tTags("phone.egyptian") : tTags("boolean.true");
    const falseLabel = field === "order.phone.valid" ? tTags("phone.notEgyptian") : tTags("boolean.false");
    return (
      <Select value={String(value ?? "true")} onValueChange={onChange} disabled={disabled}>
        <SelectTrigger className={cn("h-10 rounded-md", error && "border-destructive")}>
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="true">{trueLabel}</SelectItem>
          <SelectItem value="false">{falseLabel}</SelectItem>
        </SelectContent>
      </Select>
    );
  }

  if (isList && (opts.length || lookupKey)) {
    return (
      <OptionsMultiSelect
        options={opts}
        value={value}
        onChange={onChange}
        placeholder={t("selectValues")}
        disabled={disabled}
        error={error}
      />
    );
  }

  if (isList) {
    return (
      <ListTextValues
        value={value}
        onChange={onChange}
        placeholder={t("addListValue")}
        disabled={disabled}
        error={error}
      />
    );
  }

  if (opts.length) {
    const selected = value ? String(value) : "";
    const hasMatch = opts.some((opt) => String(opt.value) === selected);
    return (
      <Select value={hasMatch ? selected : undefined} onValueChange={onChange} disabled={disabled}>
        <SelectTrigger className={cn("h-10 rounded-md", error && "border-destructive")}>
          <SelectValue placeholder={t("valuePlaceholder")} />
        </SelectTrigger>
        <SelectContent>
          {opts.map((opt) => (
            <SelectItem key={String(opt.value)} value={String(opt.value)}>
              {opt.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    );
  }

  const isPercent = isPercentField(field);
  const isNumber = meta?.valueType === "number";
  const isDate = meta?.valueType === "date";

  if (isDate) {
    return (
      <div className={cn(disabled && "pointer-events-none opacity-60")}>
        <DateRangePicker
          mode="single"
          value={value || null}
          onChange={(date) => onChange(date || "")}
          staticShow={true}
          dataSize="default"
          className={cn("theme-field w-full", error && "border-red-500")}
        />
      </div>
    );
  }

  return (
    <Input
      type={isNumber ? "number" : "text"}
      min={isPercent ? 0 : undefined}
      max={isPercent ? 100 : undefined}
      step={isPercent ? 1 : undefined}
      value={value ?? ""}
      onChange={(event) => {
        const next = event.target.value;
        if (!isPercent || next === "") {
          onChange(next);
          return;
        }
        const n = Number(next);
        if (!Number.isFinite(n)) {
          onChange("");
          return;
        }
        onChange(String(Math.min(100, Math.max(0, n))));
      }}
      placeholder={t("valuePlaceholder")}
      disabled={disabled}
      error={error}
    />
  );
}
