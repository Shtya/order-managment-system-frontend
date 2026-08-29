"use client";

import React, { useState, useEffect, useRef, useMemo, useCallback } from "react";
import { X, Search, Check, Loader2, ChevronDown } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { cn } from "@/utils/cn";
import { Badge } from "@/components/ui/badge";
import { fieldBase } from "@/components/ui/input";
import {
    SelectContentFade,
    SelectContentSheen,
    SelectOverflowScrollButton,
    selectContentClassName,
} from "@/components/ui/select";
import api from "@/utils/api";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { motion } from "framer-motion";

function resolveId(v, valueKey) {
    if (v == null) return v;
    return typeof v === "object" ? v[valueKey] : v;
}

function optionLabel(option, locale, labelKey) {
    if (option == null) return "";
    if (typeof option !== "object") return String(option);
    if (locale === "ar") {
        return option.nameAr || option.nameEn || option[labelKey] || option.name || "";
    }
    return option.nameEn || option.nameAr || option[labelKey] || option.name || "";
}

function mergeUnique(base, extras, valueKey) {
    const merged = [...(base || [])];
    (extras || []).forEach((obj) => {
        if (!obj || typeof obj !== "object") return;
        if (!merged.some((d) => d[valueKey] === obj[valueKey])) {
            merged.unshift(obj);
        }
    });
    return merged;
}

function dedupeByKey(items, valueKey) {
    const seen = new Set();
    return (items || []).filter((item) => {
        const id = item?.[valueKey];
        if (seen.has(id)) return false;
        seen.add(id);
        return true;
    });
}

function useListOverflow(open, extraKey) {
    const viewportRef = useRef(null);
    const holdTimer = useRef(null);
    const [canScrollUp, setCanScrollUp] = useState(false);
    const [canScrollDown, setCanScrollDown] = useState(false);

    const update = useCallback(() => {
        const el = viewportRef.current;
        if (!el) {
            setCanScrollUp(false);
            setCanScrollDown(false);
            return;
        }
        setCanScrollUp(el.scrollTop > 1);
        setCanScrollDown(el.scrollTop + el.clientHeight < el.scrollHeight - 1);
    }, []);

    useEffect(() => {
        if (!open) return;
        let el = viewportRef.current;
        let ro;
        let raf;
        let cancelled = false;

        const attach = () => {
            el = viewportRef.current;
            if (!el || cancelled) return false;
            update();
            el.addEventListener("scroll", update, { passive: true });
            if (typeof ResizeObserver !== "undefined") {
                ro = new ResizeObserver(update);
                ro.observe(el);
            }
            return true;
        };

        if (!attach()) {
            raf = requestAnimationFrame(attach);
        }

        return () => {
            cancelled = true;
            if (raf) cancelAnimationFrame(raf);
            el?.removeEventListener("scroll", update);
            ro?.disconnect();
        };
    }, [open, extraKey, update]);

    const stopHold = useCallback(() => {
        if (holdTimer.current) {
            clearInterval(holdTimer.current);
            holdTimer.current = null;
        }
    }, []);

    const holdScroll = useCallback(
        (amount) => ({
            onPointerDown: (e) => {
                e.preventDefault();
                const step = () => {
                    const el = viewportRef.current;
                    if (!el) {
                        stopHold();
                        return;
                    }
                    const atStart = el.scrollTop <= 1;
                    const atEnd = el.scrollTop + el.clientHeight >= el.scrollHeight - 1;
                    if ((amount < 0 && atStart) || (amount > 0 && atEnd)) {
                        stopHold();
                        update();
                        return;
                    }
                    el.scrollBy({ top: amount });
                };
                step();
                stopHold();
                holdTimer.current = setInterval(step, 40);
            },
            onPointerUp: stopHold,
            onPointerLeave: stopHold,
            onPointerCancel: stopHold,
        }),
        [stopHold, update],
    );

    useEffect(() => stopHold, [stopHold]);

    return { viewportRef, canScrollUp, canScrollDown, holdScroll };
}

/**
 * Multi-purpose multi-select.
 *
 * variant="chips"  — current badge/chip trigger (forms)
 * variant="select" — trigger + panel styled like the shared Select input (filters)
 *
 * Provide `endpoint` to fetch options, `options` for a local list, or both.
 */
export default function MultiSelect({
    endpoint,
    options: optionsProp,
    value = [],
    onChange,
    placeholder,
    labelKey = "name",
    valueKey = "id",
    params = {},
    initialValues = [],
    single = false,
    variant = "chips",
    className,
    searchable = true,
}) {
    const locale = useLocale();
    const t = useTranslations("common");
    const isSelect = variant === "select";
    const [open, setOpen] = useState(false);
    const [search, setSearch] = useState("");
    const [options, setOptions] = useState(optionsProp || initialValues || []);
    const [loading, setLoading] = useState(false);
    const [triggerWidth, setTriggerWidth] = useState(0);

    const containerRef = useRef(null);

    const getLabel = useCallback(
        (option) => optionLabel(option, locale, labelKey),
        [locale, labelKey],
    );

    useEffect(() => {
        if (initialValues?.length) {
            setOptions((prev) => mergeUnique(prev, initialValues, valueKey));
        }
    }, [initialValues, valueKey]);

    useEffect(() => {
        if (!optionsProp) return;
        if (!endpoint) {
            setOptions(optionsProp);
            return;
        }
        if (optionsProp.length) {
            setOptions((prev) => mergeUnique(prev, optionsProp, valueKey));
        }
    }, [optionsProp, valueKey, endpoint]);

    useEffect(() => {
        if (!open) setSearch("");
    }, [open]);

    useEffect(() => {
        if (containerRef.current) {
            setTriggerWidth(containerRef.current.offsetWidth);
        }
    }, [open]);

    useEffect(() => {
        if (open && endpoint) {
            fetchOptions();
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [open, search, endpoint]);

    const fetchOptions = async () => {
        if (!endpoint) return;
        try {
            setLoading(true);
            const res = await api.get(endpoint, {
                params: {
                    ...params,
                    search: search || undefined,
                    limit: 50,
                },
            });

            let data = [];
            if (Array.isArray(res.data)) {
                data = res.data;
            } else if (res.data?.records) {
                data = res.data.records;
            } else if (res.data?.data) {
                data = res.data.data;
            }

            const valueObjects = value.filter((v) => typeof v === "object");
            let mergedData = [...data];
            mergedData = mergeUnique(mergedData, valueObjects, valueKey);
            mergedData = mergeUnique(mergedData, initialValues || [], valueKey);
            mergedData = mergeUnique(mergedData, optionsProp || [], valueKey);
            setOptions(dedupeByKey(mergedData, valueKey));
        } catch (err) {
            console.error("MultiSelect fetch error:", err);
        } finally {
            setLoading(false);
        }
    };

    const displayedOptions = useMemo(() => {
        const source = options.length ? options : optionsProp || [];
        if (endpoint || !search.trim()) return source;
        const q = search.toLowerCase();
        return source.filter((opt) => getLabel(opt).toLowerCase().includes(q));
    }, [options, optionsProp, search, endpoint, getLabel]);

    const { viewportRef, canScrollUp, canScrollDown, holdScroll } = useListOverflow(
        open && isSelect,
        `${displayedOptions.length}:${search}:${loading}`,
    );

    const isSelectedValue = useCallback(
        (val) => value.some((v) => resolveId(v, valueKey) === val),
        [value, valueKey],
    );

    const toggleOption = (option) => {
        const val = option[valueKey];
        const isSelected = isSelectedValue(val);

        let newValue;
        if (isSelected) {
            newValue = value.filter((v) => resolveId(v, valueKey) !== val);
        } else if (single) {
            newValue = [option];
        } else {
            newValue = [...value, option];
        }

        onChange(newValue);
        if (single && !isSelected) setOpen(false);
    };

    const removeOption = (valId) => {
        onChange(value.filter((v) => resolveId(v, valueKey) !== valId));
    };

    const selectedLabels = useMemo(() => {
        return value
            .map((v) => {
                if (typeof v === "object") return getLabel(v);
                const option =
                    options.find((opt) => opt[valueKey] === v) ||
                    (optionsProp || []).find((opt) => opt[valueKey] === v) ||
                    (initialValues || []).find((opt) => opt[valueKey] === v);
                return option ? getLabel(option) : "";
            })
            .filter(Boolean);
    }, [value, options, optionsProp, initialValues, valueKey, getLabel]);

    const commaLabel = selectedLabels.join(", ");

    const renderOptionRow = (option) => {
        const isSelected = isSelectedValue(option[valueKey]);
        return (
            <div
                key={option[valueKey]}
                role="option"
                aria-selected={isSelected}
                className={cn(
                    isSelect
                        ? cn(
                              "group cursor-pointer relative rtl:flex-row-reverse flex w-full select-none items-center gap-2.5",
                              "!rounded-md px-3 py-2.5 text-sm outline-none",
                              "text-foreground/80 transition-colors duration-150 rtl:text-right",
                              isSelected
                                  ? "text-[var(--primary)] font-semibold bg-[var(--primary)]/8"
                                  : "hover:bg-[var(--primary)]/8 hover:text-foreground",
                          )
                        : cn(
                              "flex items-center justify-between px-3 py-2 rounded-lg cursor-pointer transition-colors",
                              isSelected ? "bg-primary/10 text-primary" : "hover:bg-muted",
                          ),
                )}
                onMouseDown={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                }}
                onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    toggleOption(option);
                }}
            >
                <span className={cn("text-sm truncate flex-1", !isSelect && "font-medium")}>
                    {getLabel(option)}
                </span>
                {isSelected && <Check size={16} className="shrink-0 text-[var(--primary)]" />}
            </div>
        );
    };

    const emptyState = (
        <div className="py-6 text-center text-sm text-muted-foreground">
            {t("noData")}
        </div>
    );

    const loadingState = (
        <div className="flex items-center justify-center py-6">
            <Loader2 className="h-5 w-5 animate-spin text-primary" />
        </div>
    );

    return (
        <Popover open={open} onOpenChange={setOpen}>
            <PopoverTrigger asChild>
                {isSelect ? (
                    <div
                        ref={containerRef}
                        data-slot="select-trigger"
                        data-state={open ? "open" : "closed"}
                        role="combobox"
                        aria-expanded={open}
                        aria-haspopup="listbox"
                        tabIndex={0}
                        className={cn(
                            ...fieldBase,
                            "group relative rtl:flex-row-reverse inline-flex items-center justify-between gap-2",
                            "!h-10 text-sm px-3.5",
                            "data-[state=open]:border-[var(--primary)]",
                            "data-[state=open]:shadow-[0_0_0_3px_rgb(var(--primary-shadow))]",
                            "data-[state=open]:bg-background",
                            "cursor-pointer",
                            className,
                        )}
                    >
                        <span
                            aria-hidden
                            className="pointer-events-none absolute inset-x-0 top-0 h-1/2 rounded-t-md
                              bg-gradient-to-b from-white/20 to-transparent dark:from-white/[0.06]"
                        />
                        <span
                            aria-hidden
                            className={cn(
                                "pointer-events-none absolute start-0 top-2 bottom-2 w-[2px] rounded-full",
                                "bg-gradient-to-b from-[var(--primary)] to-[var(--third,var(--secondary))]",
                                "opacity-0 transition-opacity duration-200",
                                open && "opacity-100",
                            )}
                        />
                        <span className="relative z-10 flex min-w-0 flex-1">
                            <span
                                className={cn(
                                    "truncate text-start w-full",
                                    !commaLabel && "text-muted-foreground/80",
                                )}
                            >
                                {commaLabel || placeholder}
                            </span>
                        </span>
                        <ChevronDown
                            className={cn(
                                "relative z-10 size-4 shrink-0 transition-all duration-300",
                                "text-muted-foreground/80",
                                open && "text-[var(--primary)] rotate-180",
                            )}
                        />
                    </div>
                ) : (
                    <div
                        ref={containerRef}
                        className={cn(
                            "min-h-[50px] w-full rounded-xl border border-input bg-background px-3 py-2 text-sm ring-offset-background flex flex-wrap gap-2 cursor-pointer transition-all items-center",
                            open && "ring-2 ring-primary ring-offset-2 border-primary shadow-sm",
                            className,
                        )}
                    >
                        {value.length === 0 && (
                            <span className="text-muted-foreground self-center">{placeholder}</span>
                        )}
                        {value.map((v) => {
                            const id = resolveId(v, valueKey);
                            let label = "";

                            if (typeof v === "object") {
                                label = getLabel(v);
                            } else {
                                const option = options.find((opt) => opt[valueKey] === id);
                                label = option ? getLabel(option) : id;
                            }

                            return (
                                <Badge
                                    key={id}
                                    variant="outline"
                                    className="gap-1 pr-1 py-1 h-7 bg-muted/50 border-border text-foreground font-medium max-w-full"
                                >
                                    <span className="whitespace-nowrap truncate max-w-[200px]">
                                        {label}
                                    </span>
                                    <button
                                        type="button"
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            removeOption(id);
                                        }}
                                        className="rounded-full hover:bg-muted p-0.5 shrink-0"
                                    >
                                        <X size={12} />
                                    </button>
                                </Badge>
                            );
                        })}
                        {value.length > 0 && (
                            <button
                                type="button"
                                onClick={(e) => {
                                    e.stopPropagation();
                                    onChange([]);
                                }}
                                className="ms-auto text-xs text-muted-foreground hover:text-foreground px-1.5 py-0.5 rounded-md hover:bg-muted transition-colors"
                            >
                                {t("clearAll")}
                            </button>
                        )}
                    </div>
                )}
            </PopoverTrigger>

            {isSelect ? (
                <PopoverContent
                    className={cn("p-0", ...selectContentClassName)}
                    style={{ width: triggerWidth || "auto" }}
                    align="start"
                    sideOffset={6}
                >
                    <SelectContentSheen />
                    {searchable && (
                        <div className="relative z-10 px-1.5 pt-1.5 pb-1">
                            <div className="relative">
                                <Search className="absolute start-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground/80 pointer-events-none" />
                                <input
                                    autoFocus
                                    className="w-full h-8 ps-8 pe-3 rounded-md text-sm border border-border/70 bg-background/60 outline-none focus:border-[var(--primary)] transition-all"
                                    placeholder={t("search")}
                                    value={search}
                                    onChange={(e) => setSearch(e.target.value)}
                                />
                            </div>
                        </div>
                    )}
                    <SelectOverflowScrollButton
                        direction="up"
                        hidden={!canScrollUp}
                        {...holdScroll(-32)}
                    />
                    <div
                        ref={viewportRef}
                        className="w-full p-1.5 max-h-[240px] overflow-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
                    >
                        {loading && loadingState}
                        {!loading && displayedOptions.length === 0 && emptyState}
                        {!loading && displayedOptions.map(renderOptionRow)}
                    </div>
                    <SelectOverflowScrollButton
                        direction="down"
                        hidden={!canScrollDown}
                        {...holdScroll(32)}
                    />
                    <SelectContentFade />
                </PopoverContent>
            ) : (
                <PopoverContent
                    className="p-0 border-0 shadow-none bg-transparent"
                    style={{ width: triggerWidth || "auto" }}
                    align="start"
                    sideOffset={8}
                >
                    <motion.div
                        initial={{ opacity: 0, y: -6, scale: 0.985 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        transition={{ duration: 0.18, ease: [0.16, 1, 0.3, 1] }}
                        className={cn(
                            "relative w-full overflow-hidden",
                            "rounded-2xl border border-primary/20",
                            "bg-popover/96 backdrop-blur-md",
                            "shadow-lg",
                        )}
                    >
                        <div
                            aria-hidden
                            className="absolute inset-x-0 top-0 h-[2px] rounded-t-2xl
                            bg-gradient-to-r from-primary via-primary/50 to-primary"
                        />

                        {searchable && (
                            <div className="px-3 pt-4 pb-2 flex items-center gap-2">
                                <div className="relative flex-1">
                                    <Search className="absolute start-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground/80 pointer-events-none" />
                                    <input
                                        autoFocus
                                        className="w-full h-10 ps-9 pe-4 rounded-xl text-sm border border-border/70 bg-background/60 outline-none focus:border-primary transition-all"
                                        placeholder={t("search")}
                                        value={search}
                                        onChange={(e) => setSearch(e.target.value)}
                                    />
                                </div>
                            </div>
                        )}

                        <div className="max-h-[300px] overflow-auto p-2 space-y-1">
                            {loading && loadingState}
                            {!loading && displayedOptions.length === 0 && emptyState}
                            {!loading && displayedOptions.map(renderOptionRow)}
                        </div>
                    </motion.div>
                </PopoverContent>
            )}
        </Popover>
    );
}
