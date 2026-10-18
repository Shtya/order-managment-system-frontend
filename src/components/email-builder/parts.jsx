"use client";
import { useTranslations } from "next-intl";
import { useState } from "react";
import { Braces, Plus } from "lucide-react";
import { cn } from "@/utils/cn";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Slider } from "@/components/ui/slider";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { VARIABLES } from "./document";

export const FONTS = [
  "Arial",
  "Tahoma",
  "Cairo",
  "Tajawal",
  "Noto Kufi Arabic",
  "Almarai",
];

const FONT_CSS_URLS = {
  Cairo: "https://fonts.googleapis.com/css2?family=Cairo:wght@400;500;700&display=swap",
  Tajawal: "https://fonts.googleapis.com/css2?family=Tajawal:wght@400;500;700&display=swap",
  "Noto Kufi Arabic": "https://fonts.googleapis.com/css2?family=Noto+Kufi+Arabic:wght@400;500;700&display=swap",
  Almarai: "https://fonts.googleapis.com/css2?family=Almarai:wght@400;700&display=swap",
};

const LOADED_FONT_URLS = new Set();

export function ensureFontLoaded(fontName) {
  const cssUrl = FONT_CSS_URLS[fontName];
  if (!cssUrl) return Promise.resolve();
  if (LOADED_FONT_URLS.has(cssUrl)) return Promise.resolve();

  const existing = document.querySelector(`link[data-email-font="${fontName}"]`);
  if (existing) {
    LOADED_FONT_URLS.add(cssUrl);
    if ("fonts" in document) {
      return document.fonts.load(`400 16px "${fontName}"`).catch(() => undefined);
    }
    return Promise.resolve();
  }

  return new Promise((resolve) => {
    const link = document.createElement("link");
    link.rel = "stylesheet";
    link.href = cssUrl;
    link.setAttribute("data-email-font", fontName);
    link.onload = async () => {
      LOADED_FONT_URLS.add(cssUrl);
      if ("fonts" in document) {
        try {
          await document.fonts.load(`400 16px "${fontName}"`);
        } catch (error) {
          // Ignore font-loading failures and keep the fallback font.
        }
      }
      resolve();
    };
    link.onerror = () => resolve();
    document.head.appendChild(link);
  });
}

export const SWATCHES = [
  "#6763af",
  "#176c51",
  "#2563eb",
  "#e11d48",
  "#d97706",
  "#111827",
  "#ffffff",
];

export function SectionTitle({ children, className }) {
  return (
    <p
      className={cn(
        "text-[11px] font-black uppercase tracking-widest text-muted-foreground",
        className,
      )}
    >
      {children}
    </p>
  );
}

export function Field({
  id,
  label,
  required,
  hint,
  counter,
  description,
  error,
  children,
  className,
}) {
  return (
    <div className={cn("space-y-2", className)}>
      {(label || counter) && (
        <div className="flex items-center justify-between gap-2">
          {label && (
            <Label htmlFor={id} description={description}>
              {label}
              {required && (
                <span aria-hidden className="text-red-500">
                  *
                </span>
              )}
            </Label>
          )}
          {counter && (
            <span className="text-[11px] text-muted-foreground">{counter}</span>
          )}
        </div>
      )}
      {children}
      {error && <p className="text-[11px] text-red-500">{error}</p>}
      {hint && <p className="text-[11px] text-muted-foreground">{hint}</p>}
    </div>
  );
}

export function Segmented({ value, onChange, options, className, label }) {
  return (
    <div
      role="group"
      aria-label={label}
      className={cn(
        "inline-flex rounded-xl border border-border bg-muted p-[3px]",
        className,
      )}
    >
      {options.map((option) => {
        const Icon = option.icon;
        const active = option.value === value;
        return (
          <button
            key={option.value}
            type="button"
            aria-pressed={active}
            aria-label={option.ariaLabel}
            title={option.ariaLabel}
            onClick={() => onChange(option.value)}
            className={cn(
              "inline-flex h-7 flex-1 items-center justify-center gap-1.5 whitespace-nowrap rounded-lg px-2.5 text-xs font-semibold transition-colors",
              active
                ? "bg-card text-primary shadow-sm"
                : "text-muted-foreground hover:text-foreground",
            )}
          >
            {Icon && <Icon size={14} />}
            {option.label}
          </button>
        );
      })}
    </div>
  );
}

export function IconButton({ label, icon: Icon, className, active, ...props }) {
  return (
    <button
      type="button"
      aria-label={label}
      title={label}
      aria-pressed={active}
      className={cn(
        "btn btn-sm btn-outline btn-default !w-[34px] !px-0",
        active && "!text-primary",
        className,
      )}
      {...props}
    >
      <Icon size={16} />
    </button>
  );
}

export function VariableMenu({ onPick, className, size = "sm" }) {
  const t = useTranslations("emailBuilder");
  const [open, setOpen] = useState(false);
  const groups = [
    [t("variables.customerGroup"), VARIABLES.filter((v) => v.startsWith("customer."))],
    [t("variables.campaignGroup"), VARIABLES.filter((v) => v.startsWith("campaign."))],
  ];
  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button
          type="button"
          aria-label={t("variables.variables")}
          className={cn(
            "btn btn-ghost",
            size === "xs" ? "btn-sm !h-7 !px-2.5" : "btn-sm",
            className,
          )}
        >
          <Braces size={14} />
          {t("variables.variable")}
        </button>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-64 p-2">
        {groups.map(([title, items]) => (
          <div key={title} className="pb-1">
            <p className="px-2 pb-1 pt-1.5 text-[11px] font-bold text-muted-foreground">
              {title}
            </p>
            {items.map((key) => (
              <button
                key={key}
                type="button"
                onClick={() => {
                  onPick(key);
                  setOpen(false);
                }}
                className="group flex w-full items-center justify-between gap-2 rounded-lg px-2 py-1.5 text-start text-xs hover:bg-primary/5 hover:text-primary"
              >
                <span className="font-medium">{t(`variables.${key.replace(".", "_")}`)}</span>
                <code className="text-[10.5px] text-muted-foreground" dir="ltr">
                  {key}
                </code>
              </button>
            ))}
          </div>
        ))}
      </PopoverContent>
    </Popover>
  );
}

export function ColorField({ label, value, onChange, fallback = "#222222" }) {
  const current = value || fallback;
  return (
    <div className="space-y-2">
      <span className="text-sm font-medium text-muted-foreground">{label}</span>
      <div className="flex flex-wrap items-center gap-2">
        {SWATCHES.map((color) => (
          <button
            key={color}
            type="button"
            aria-label={`${label} ${color}`}
            onClick={() => onChange(color)}
            className={cn(
              "h-7 w-7 rounded-lg border-2 border-card shadow-[0_0_0_1px_var(--border)] transition",
              current.toLowerCase() === color &&
                "shadow-[0_0_0_2px_var(--primary)]",
            )}
            style={{ background: color }}
          />
        ))}
        <label
          className="relative grid h-7 w-7 cursor-pointer place-items-center overflow-hidden rounded-lg border border-dashed border-border text-muted-foreground hover:border-primary hover:text-primary"
          title={label}
        >
          <Plus size={14} />
          <input
            type="color"
            aria-label={label}
            value={current}
            onChange={(e) => onChange(e.target.value)}
            className="absolute inset-0 cursor-pointer opacity-0"
          />
        </label>
        <span
          className="ms-auto text-[11px] font-medium uppercase text-muted-foreground"
          dir="ltr"
        >
          {current}
        </span>
      </div>
    </div>
  );
}

export function RangeField({ label, value, min, max, step = 1, onChange, unit = "px" }) {
  const current = value ?? min;
  return (
    <div className="space-y-2.5">
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium text-muted-foreground">{label}</span>
        <span className="text-xs text-muted-foreground" dir="ltr">
          {current}
          {unit}
        </span>
      </div>
      <Slider
        aria-label={label}
        min={min}
        max={max}
        step={step}
        value={[current]}
        onValueChange={([next]) => onChange(next)}
      />
    </div>
  );
}

export function NumberField({ label, value, min, max, step = 1, onChange, id }) {
  return (
    <Field id={id} label={label}>
      <Input
        id={id}
        type="number"
        min={min}
        max={max}
        step={step}
        value={value ?? ""}
        onChange={(e) => {
          if (e.target.value === "") return;
          const next = Number(e.target.value);
          if (Number.isFinite(next))
            onChange(Math.min(max, Math.max(min, next)));
        }}
      />
    </Field>
  );
}

export const hydrateSample = (text, samples) =>
  String(text || "").replace(/\{\{\s*([^{}]+?)\s*\}\}/g, (match, key) =>
    samples?.[key] ? samples[key] : match,
  );

/** Static email-client chrome around server-rendered HTML. Never renders HTML outside the sandboxed iframe. */
export function EmailClientFrame({
  subject,
  senderName,
  senderEmail,
  html,
  mobile,
  title,
}) {
  const t = useTranslations("emailBuilder");
  const initial = (senderName || senderEmail || "?").trim()[0]?.toUpperCase();
  if (mobile)
    return (
      <div className="mx-auto w-[390px] rounded-[44px] bg-neutral-900 p-3 shadow-2xl">
        <div className="flex h-[720px] flex-col overflow-hidden rounded-[34px] bg-white text-slate-900">
          <div className="flex items-center justify-between px-6 pb-1 pt-3 text-[12px] font-semibold">
            <span dir="ltr">9:41</span>
            <span className="h-2.5 w-6 rounded-sm border border-slate-900" />
          </div>
          <div className="border-b border-slate-100 px-4 py-3">
            <p className="text-[17px] leading-snug" dir="auto">
              {subject}
            </p>
            <div className="mt-2 flex items-center gap-2 text-[12px]">
              <span className="grid h-8 w-8 place-items-center rounded-full bg-primary font-bold text-white">
                {initial}
              </span>
              <div className="leading-tight">
                <b>{senderName || senderEmail}</b>
                <br />
                <span className="text-slate-500">
                  {t("inboxPreview.to")} {t("inboxPreview.me")}
                </span>
              </div>
            </div>
          </div>
          <div className="min-h-0 flex-1 bg-[#f4f4f7] pt-8">
            <iframe
              title={title}
              sandbox=""
              srcDoc={html}
              className="h-full w-full bg-white"
            />
          </div>
        </div>
      </div>
    );
  return (
    <div className="mx-auto flex h-full max-w-[900px] flex-col overflow-hidden rounded-xl border border-slate-200 bg-white text-slate-900 shadow-xl">
      <div className="flex h-11 items-center gap-2 border-b border-slate-200 bg-[#f6f8fc] px-4">
        <span className="h-3 w-3 rounded-full bg-red-400" />
        <span className="h-3 w-3 rounded-full bg-amber-400" />
        <span className="h-3 w-3 rounded-full bg-emerald-400" />
        <div className="ms-4 flex h-7 flex-1 items-center rounded-full border border-slate-200 bg-white px-3 text-[12px] text-slate-400">
          {t("inboxPreview.searchMail")}
        </div>
      </div>
      <div className="border-b border-slate-100 px-8 pb-3 pt-5">
        <div className="flex items-center gap-2">
          <h2 className="text-[20px]" dir="auto">
            {subject}
          </h2>
          <span className="rounded bg-slate-100 px-1.5 text-[11px] text-slate-600">
            {t("inboxPreview.inbox")}
          </span>
        </div>
        <div className="mt-3 flex items-center gap-3">
          <span className="grid h-10 w-10 place-items-center rounded-full bg-primary font-bold text-white">
            {initial}
          </span>
          <div className="flex-1 text-[13px] leading-tight">
            <b>{senderName || senderEmail}</b>{" "}
            {senderEmail && (
              <span className="text-slate-500" dir="ltr">
                &lt;{senderEmail}&gt;
              </span>
            )}
            <br />
            <span className="text-[12px] text-slate-500">
              {t("inboxPreview.to")} {t("inboxPreview.me")}
            </span>
          </div>
        </div>
      </div>
      <div className="min-h-[560px] flex-1 bg-[#f4f4f7]">
        <iframe
          title={title}
          sandbox=""
          srcDoc={html}
          className="h-full min-h-[528px] w-full bg-white pt-8"
        />
      </div>
    </div>
  );
}
