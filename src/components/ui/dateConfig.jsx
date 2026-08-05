"use client";

import * as React from "react";
import { ChevronLeft, CalendarDays, Info, Globe } from "lucide-react";
import { cn } from "@/utils/cn";
import { useOrdersSettings } from "@/hook/useOrdersSettings";
import { useLocale } from "next-intl";

export const DEFAULT_DATE_FORMATS = [
    "DD-MM-YYYY",
    "DD/MM/YYYY",
    "YYYY-MM-DD",
    "MM-DD-YYYY",
    "DD.MM.YYYY",
    "WeekdayShort D MonthShort",
    "Weekday D Month",
    "Weekday D Month YYYY",
    "D Month",
    "D Month YYYY",
];

// Localized month/weekday names used to render named date formats. Kept in
// sync with the backend (nodeHandlers.registry.ts) so the editor preview
// matches what is actually sent.
const MONTH_NAMES = {
    en: ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"],
    ar: ["يناير", "فبراير", "مارس", "أبريل", "مايو", "يونيو", "يوليو", "أغسطس", "سبتمبر", "أكتوبر", "نوفمبر", "ديسمبر"],
};
const MONTH_SHORT_NAMES = {
    en: ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"],
    ar: ["يناير", "فبراير", "مارس", "أبريل", "مايو", "يونيو", "يولي", "أغسطس", "سبتمبر", "أكتوبر", "نوفمبر", "ديسمبر"],
};
const WEEKDAY_NAMES = {
    en: ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"],
    ar: ["الأحد", "الاثنين", "الثلاثاء", "الأربعاء", "الخميس", "الجمعة", "السبت"],
};
const WEEKDAY_SHORT_NAMES = {
    en: ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"],
    ar: ["الأحد", "الاثنين", "الثلاثاء", "الأربعاء", "الخميس", "الجمعة", "السبت"],
};

const pad2 = (n) => String(n).padStart(2, "0");

export function formatDateWithFormat(date, format, lang = "en") {
    const l = lang === "ar" ? "ar" : "en";
    const tokens = {
        YYYY: String(date.getFullYear()),
        YY: String(date.getFullYear()).slice(-2),
        MM: pad2(date.getMonth() + 1),
        M: String(date.getMonth() + 1),
        DD: pad2(date.getDate()),
        D: String(date.getDate()),
        Weekday: WEEKDAY_NAMES[l][date.getDay()],
        WeekdayShort: WEEKDAY_SHORT_NAMES[l][date.getDay()],
        Month: MONTH_NAMES[l][date.getMonth()],
        MonthShort: MONTH_SHORT_NAMES[l][date.getMonth()],
    };
    return format.replace(/WeekdayShort|Weekday|MonthShort|Month|YYYY|YY|MM|M|DD|D/g, (m) => tokens[m] ?? m);
}

function addDays(base, days) {
    const d = new Date(base);
    d.setDate(d.getDate() + days);
    return d;
}

function startOfDay(d) {
    const x = new Date(d);
    x.setHours(0, 0, 0, 0);
    return x;
}

function diffDays(a, b) {
    const MS = 1000 * 60 * 60 * 24;
    return Math.round((startOfDay(a).getTime() - startOfDay(b).getTime()) / MS);
}

export function getNaturalDayName(date, fromDate, locale = "en", fallbackFormat = "DD-MM-YYYY") {
    const L = locale === "ar" ? "ar" : "en";
    const d = diffDays(date, fromDate);
    if (d === 0) return L === "ar" ? "اليوم" : "Today";
    if (d === -1) return L === "ar" ? "أمس" : "Yesterday";
    if (d === 1) return L === "ar" ? "غداً" : "Tomorrow";
    if (d === -2) return L === "ar" ? "قبل أمس" : "Day before yesterday";
    if (d === 2) return L === "ar" ? "بعد غد" : "Day after tomorrow";
    if (d === -3) return L === "ar" ? "قبل ثلاثة أيام" : "Three days ago";
    if (d === 3) return L === "ar" ? "بعد ثلاثة أيام" : "In three days";
    if (d === -7) return L === "ar" ? "الأسبوع الماضي" : "Last week";
    if (d === 7) return L === "ar" ? "الأسبوع القادم" : "Next week";
    return formatDateWithFormat(date, fallbackFormat || "DD-MM-YYYY", L);
}

function MiniCardPattern({ selected = false }) {
    return (
        <svg className="absolute inset-0 w-full h-full opacity-[0.08] pointer-events-none" viewBox="0 0 100 140" preserveAspectRatio="none">
            <defs>
                <linearGradient id="miniCardBg" x1="0" y1="0" x2="1" y2="1">
                    <stop offset="0%" stopColor={selected ? "#7c3aed" : "#64748b"} />
                    <stop offset="100%" stopColor={selected ? "#4f46e5" : "#1e293b"} />
                </linearGradient>
            </defs>
            <rect x="0" y="0" width="100" height="18" fill="url(#miniCardBg)" opacity="0.9" />
            <circle cx="50" cy="48" r="20" fill="none" stroke="url(#miniCardBg)" strokeWidth="1.5" opacity="0.4" />
            <line x1="14" y1="82" x2="86" y2="82" stroke="url(#miniCardBg)" strokeWidth="1.2" />
            <line x1="14" y1="98" x2="58" y2="98" stroke="url(#miniCardBg)" strokeWidth="1.2" />
            <line x1="14" y1="114" x2="70" y2="114" stroke="url(#miniCardBg)" strokeWidth="1.2" />
        </svg>
    );
}

// The language dates are actually rendered/sent in — driven by the client
// settings `defaultLang` (backend uses it too), falling back to the UI
// locale when the settings provider isn't mounted (e.g. outside automations).
export function useSettingsDefaultLang() {
    try {
        return useOrdersSettings().settings?.defaultLang;
    } catch {
        return undefined;
    }
}

export function useDateLang(locale = "en") {
    const settingsDefaultLang = useSettingsDefaultLang();
    return settingsDefaultLang === "ar" || settingsDefaultLang === "en"
        ? settingsDefaultLang
        : (locale === "ar" ? "ar" : "en");
}

export function CompactDateConfig({
    configNode,
    dateOffset,
    dateFormat,
    locale = "en",
    formats = DEFAULT_DATE_FORMATS,
    onBack,
    onOffsetChange,
    onFormatChange,
    onConfirm,
}) {
    const appLocale = useLocale();
    const lang = useDateLang(locale);
    const L = lang === "ar" ? "ar" : "en"
    const today = React.useMemo(() => {
        const d = new Date(); d.setHours(0, 0, 0, 0); return d
    }, [])
    const viewport = React.useMemo(() => [-2, -1, 0, 1, 2].map(r => dateOffset + r), [dateOffset])
    const labels = configNode?.configLabels || {}
    const relLabels = [
        labels.twoDaysBefore || "2 days before",
        labels.yesterday || "Yesterday",
        labels.sendDate || "Send date",
        labels.tomorrow || "Tomorrow",
        labels.twoDaysAfter || "2 days after",
    ]
    const previewDate = React.useMemo(() => {
        const d = new Date()
        d.setDate(d.getDate() + dateOffset)
        return formatDateWithFormat(d, dateFormat, lang)
    }, [dateOffset, dateFormat, lang])
    const displayedInText = lang === "ar"
        ? (labels.localeDisplayedInArabic || "Date displayed in Arabic (current system settings)")
        : (labels.localeDisplayedInEnglish || "Date displayed in English (current system settings)")

    return (
        <div className="space-y-3">
            <button
                type="button"
                onClick={onBack}
                className="flex items-center ms-auto gap-1.5 text-[11px] font-bold text-muted-foreground hover:text-foreground transition-colors"
            >
                {labels.back || "Back"}
                <ChevronLeft className="h-3.5 w-3.5" />
            </button>

            <div className="space-y-2">
                <div className="flex items-center gap-1.5">
                    <Info size={12} className="text-muted-foreground/70" />
                    <label className="text-[10px] md:text-[11px] font-bold text-foreground/80">
                        {labels.relativeTitle || labels.offset || "Choose date relative to send time"}
                    </label>
                </div>
                <div className="flex items-stretch justify-between gap-1.5">
                    {viewport.map((cardOffset, i) => {
                        const rel = i - 2
                        const isSelected = rel === 0
                        const d = addDays(today, cardOffset)
                        const ddmm = formatDateWithFormat(d, "DD/MM", lang)
                        const dmyFull = formatDateWithFormat(d, "DD-MM-YYYY", lang)
                        const dayDiff = diffDays(d, today)
                        const closeMap = {
                            "-7": { ar: "الأسبوع الماضي", en: "Last week" },
                            "-3": { ar: "قبل 3 أيام", en: "3 days ago" },
                            "-2": { ar: "قبل أمس", en: "Day before yesterday" },
                            "-1": { ar: "أمس", en: "Yesterday" },
                            "0": { ar: "اليوم", en: "Today" },
                            "1": { ar: "غداً", en: "Tomorrow" },
                            "2": { ar: "بعد غد", en: "Day after tomorrow" },
                            "3": { ar: "بعد 3 أيام", en: "In 3 days" },
                            "7": { ar: "الأسبوع القادم", en: "Next week" },
                        }
                        const closeName = closeMap[String(dayDiff)]
                        const label = closeName ? closeName[appLocale] : ddmm
                        return (
                            <button
                                type="button"
                                key={`mini-${cardOffset}-${i}`}
                                onClick={() => onOffsetChange?.(cardOffset)}
                                title={dmyFull}
                                className={cn(
                                    "relative group flex-1 flex items-center justify-center",
                                    "min-w-0 overflow-hidden rounded-xl border-2 transition-all duration-200",
                                    "aspect-square px-1.5 py-2",
                                    isSelected
                                        ? "border-primary bg-primary/5 shadow-[0_6px_18px_-6px_var(--primary)] scale-[1.06] z-10"
                                        : "border-border bg-background hover:border-primary/60 hover:-translate-y-0.5 hover:shadow-md"
                                )}
                            >
                                <MiniCardPattern selected={isSelected} />
                                <div className="relative z-10 flex flex-col items-center justify-center gap-0.5 w-full h-full text-center leading-tight px-0.5">
                                    <span
                                        className={cn(
                                            "block leading-tight font-black",
                                            isSelected ? "text-primary" : "text-foreground",
                                            isSelected ? "text-[12x] md:text-[13px]" : "text-[10px] md:text-[11px]"
                                        )}
                                    >
                                        {label}
                                    </span>
                                </div>
                            </button>
                        )
                    })}
                </div>
            </div>

            <div className="space-y-1.5">
                <div className="flex items-center gap-1.5">
                    <Info size={12} className="text-muted-foreground/70" />
                    <label className="text-[10px] font-bold uppercase tracking-wide text-muted-foreground/85">
                        {labels.formatTitle || labels.format || "Format"}
                    </label>
                </div>
                <div className="relative">
                    <select
                        value={dateFormat}
                        onChange={(e) => onFormatChange?.(e.target.value)}
                        className="w-full h-10 rounded-xl border-2 border-border bg-background px-3 text-sm font-bold appearance-none cursor-pointer transition-all focus:border-primary focus:outline-none focus:ring-4 focus:ring-primary/10"
                    >
                        {formats.map(f => (
                            <option key={f} value={f}>{formatDateWithFormat(new Date(), f, lang)}</option>
                        ))}
                    </select>
                </div>
            </div>

            <div className="space-y-1.5">
                <div className="flex items-center gap-1.5">
                    <Info size={12} className="text-muted-foreground/70" />
                    <label className="text-[10px] font-bold uppercase tracking-wide text-muted-foreground/85">
                        {labels.preview || "Preview"}
                    </label>
                </div>
                <div className="relative overflow-hidden rounded-xl border-2 border-border/70 bg-gradient-to-br from-primary/5 via-background to-muted/30 px-3 py-2.5">
                    <MiniCardPattern selected />
                    <div className="relative z-10 flex items-center justify-center gap-2">
                        <CalendarDays size={18} className="text-primary shrink-0" />
                        <span className="text-lg font-black text-primary tracking-wide">
                            {previewDate}
                        </span>
                    </div>
                </div>
            </div>

            <div className="flex items-center justify-center gap-1.5 text-center">
                <Globe size={14} className="text-muted-foreground shrink-0" />
                <span className="text-[10px] font-bold text-muted-foreground leading-tight">
                    {displayedInText}
                </span>
            </div>

            <button
                type="button"
                onClick={onConfirm}
                className="w-full h-11 rounded-xl bg-primary text-primary-foreground text-sm font-black shadow-lg shadow-primary/20 hover:bg-primary/90 hover:shadow-xl hover:shadow-primary/25 transition-all hover:-translate-y-0.5"
            >
                <span className="flex items-center justify-center gap-2">
                    <CalendarDays size={16} />
                    {labels.insertDate || labels.insert || "Insert date"}
                </span>
            </button>
        </div>
    )
}
