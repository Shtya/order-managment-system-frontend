"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { useLocale } from "next-intl";
import { BookOpenCheck, ChevronDown, CircleHelp, ExternalLink, ShieldCheck, X } from "lucide-react";
import Button_ from "@/components/atoms/Button";
import { cn } from "@/utils/cn";
import {
  EMAIL_GUIDELINE_SOURCES,
  EMAIL_GUIDELINE_TYPES,
  EMAIL_SENDING_GUIDELINES,
} from "./emailSendingGuidelinesConfig";

const TYPE_STYLE = {
  required: "border-red-100 bg-red-50 text-red-700",
  recommended: "border-emerald-100 bg-emerald-50 text-emerald-700",
  prohibited: "border-amber-100 bg-amber-50 text-amber-800",
  platform: "border-violet-100 bg-violet-50 text-violet-700",
};

const COPY = {
  ar: {
    button: "إرشادات الإرسال",
    title: "إرشادات إرسال البريد",
    description: "راجع القواعد التي تساعدك على إرسال حملات واضحة ومرغوبة وتحافظ على سمعة حسابك.",
    openAll: "فتح الكل",
    closeAll: "إغلاق الكل",
    sources: "المصادر",
    close: "إغلاق",
  },
  en: {
    button: "Sending guidelines",
    title: "Email sending guidelines",
    description: "Review the rules that help you send wanted, transparent campaigns and protect your account reputation.",
    openAll: "Open all",
    closeAll: "Close all",
    sources: "Sources",
    close: "Close",
  },
};

export default function EmailSendingGuidelines() {
  const locale = useLocale() === "ar" ? "ar" : "en";
  const ui = COPY[locale];
  const [open, setOpen] = useState(false);
  const [expanded, setExpanded] = useState(() => new Set([EMAIL_SENDING_GUIDELINES[0].id]));

  useEffect(() => {
    if (!open) return undefined;
    const close = (event) => event.key === "Escape" && setOpen(false);
    document.addEventListener("keydown", close);
    return () => document.removeEventListener("keydown", close);
  }, [open]);

  const allOpen = expanded.size === EMAIL_SENDING_GUIDELINES.length;
  const sidebar = open && typeof document !== "undefined"
    ? createPortal(
        <div className="fixed inset-0 z-[10020]" dir={locale === "ar" ? "rtl" : "ltr"}>
          <button
            type="button"
            className="absolute inset-0 bg-slate-950/45 backdrop-blur-[1px]"
            aria-label={ui.close}
            onClick={() => setOpen(false)}
          />
          <aside
            role="dialog"
            aria-modal="true"
            aria-labelledby="email-guidelines-title"
            className={cn(
              "absolute inset-y-0 flex w-full max-w-[500px] flex-col bg-white text-slate-900 shadow-2xl",
              locale === "ar" ? "left-0 border-r border-slate-200" : "right-0 border-l border-slate-200",
            )}
          >
            <header className="relative border-b border-slate-200 bg-white p-5 pe-16">
              <div className="flex items-start gap-3">
                <span className="grid size-11 shrink-0 place-items-center rounded-xl bg-primary/10 text-primary">
                  <BookOpenCheck size={22} />
                </span>
                <div>
                  <h2 id="email-guidelines-title" className="text-lg font-black text-slate-950">{ui.title}</h2>
                  <p className="mt-1 text-sm leading-6 text-slate-600">{ui.description}</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setOpen(false)}
                className={cn(
                  "absolute top-5 grid size-9 place-items-center rounded-xl border border-slate-200 bg-white text-slate-500 shadow-sm transition hover:bg-slate-50 hover:text-slate-900",
                  locale === "ar" ? "left-4" : "right-4",
                )}
                aria-label={ui.close}
              >
                <X size={18} />
              </button>
            </header>

            <div className="flex-1 overflow-y-auto bg-white p-5">
              <div className="mb-4 flex flex-wrap items-center gap-2 rounded-xl border border-slate-200 bg-slate-50/80 p-3">
                {Object.entries(EMAIL_GUIDELINE_TYPES).map(([type, label]) => (
                  <span key={type} className={cn("rounded-full border px-2.5 py-1 text-[11px] font-bold", TYPE_STYLE[type])}>
                    {label[locale]}
                  </span>
                ))}
                <button
                  type="button"
                  className="ms-auto rounded-lg px-2 py-1 text-xs font-bold text-primary transition hover:bg-primary/10"
                  onClick={() =>
                    setExpanded(
                      allOpen
                        ? new Set()
                        : new Set(EMAIL_SENDING_GUIDELINES.map((group) => group.id)),
                    )
                  }
                >
                  {allOpen ? ui.closeAll : ui.openAll}
                </button>
              </div>

              <div className="space-y-3">
                {EMAIL_SENDING_GUIDELINES.map((group) => {
                  const isOpen = expanded.has(group.id);
                  return (
                    <section
                      key={group.id}
                      className={cn(
                        "overflow-hidden rounded-2xl border bg-white transition-all duration-200",
                        isOpen
                          ? "border-primary/30 shadow-[0_8px_24px_rgba(15,23,42,0.07)]"
                          : "border-slate-200 shadow-sm hover:border-slate-300",
                      )}
                    >
                      <button
                        type="button"
                        aria-expanded={isOpen}
                        onClick={() =>
                          setExpanded((current) => {
                            const next = new Set(current);
                            if (next.has(group.id)) next.delete(group.id);
                            else next.add(group.id);
                            return next;
                          })
                        }
                        className={cn(
                          "group flex w-full items-center gap-3 px-4 py-3.5 text-start transition-colors hover:bg-slate-50",
                          isOpen && "bg-primary/[0.035]",
                        )}
                      >
                        <span className={cn(
                          "grid size-9 shrink-0 place-items-center rounded-xl transition-colors",
                          isOpen ? "bg-primary text-white" : "bg-slate-100 text-slate-500 group-hover:text-primary",
                        )}>
                          <ShieldCheck size={17} />
                        </span>
                        <span className="flex-1 text-sm font-black text-slate-900">{group.title[locale]}</span>
                        <span className="rounded-full border border-slate-200 bg-white px-2.5 py-0.5 text-[11px] font-bold text-slate-500 shadow-sm">
                          {group.advices.length}
                        </span>
                        <span className="grid size-8 shrink-0 place-items-center rounded-full bg-slate-100 text-slate-500">
                          <ChevronDown
                            size={17}
                            className={cn("transition-transform duration-200", isOpen && "rotate-180")}
                          />
                        </span>
                      </button>
                      {isOpen && (
                        <div className="space-y-2 border-t border-slate-100 bg-white p-3">
                          {group.advices.map((item, index) => (
                            <article key={`${group.id}-${index}`} className="rounded-xl border border-slate-100 bg-slate-50/70 p-3.5">
                              <div className="flex flex-wrap items-center gap-2">
                                <span className={cn("rounded-full border px-2 py-0.5 text-[10px] font-bold", TYPE_STYLE[item.type])}>
                                  {EMAIL_GUIDELINE_TYPES[item.type][locale]}
                                </span>
                                <h3 className="text-sm font-bold text-slate-900">{item.title[locale]}</h3>
                              </div>
                              <p className="mt-1.5 text-[13px] leading-6 text-slate-600">
                                {item.description[locale]}
                              </p>
                            </article>
                          ))}
                          {group.note && (
                            <p className="rounded-xl border border-violet-100 bg-violet-50 px-3.5 py-3 text-xs leading-5 text-violet-800">
                              {group.note[locale]}
                            </p>
                          )}
                        </div>
                      )}
                    </section>
                  );
                })}
              </div>

              <div className="mt-5 rounded-2xl border border-slate-200 bg-slate-50/80 p-4">
                <h3 className="text-sm font-black text-slate-900">{ui.sources}</h3>
                <ul className="mt-2 space-y-2">
                  {EMAIL_GUIDELINE_SOURCES.map((source) => (
                    <li key={source.url}>
                      <a
                        href={source.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center justify-between gap-3 rounded-lg bg-white px-3 py-2.5 text-xs font-semibold text-primary shadow-sm ring-1 ring-slate-200 transition hover:bg-primary/[0.04]"
                      >
                        <span>{source.title[locale]}</span>
                        <ExternalLink size={13} className="shrink-0" />
                      </a>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </aside>
        </div>,
        document.body,
      )
    : null;

  return (
    <>
      <Button_
        type="button"
        size="sm"
        variant="outline"
        label={ui.button}
        icon={<CircleHelp size={16} />}
        onClick={() => setOpen(true)}
      />
      {sidebar}
    </>
  );
}
