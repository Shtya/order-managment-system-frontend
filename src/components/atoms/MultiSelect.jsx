"use client";

import React, { useState, useEffect, useRef } from "react";
import { X, Search, Check, Loader2 } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { cn } from "@/utils/cn";
import { Badge } from "@/components/ui/badge";
import api from "@/utils/api";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { motion } from "framer-motion";

export default function MultiSelect({
    endpoint,
    value = [],
    onChange,
    placeholder,
    labelKey = "name",
    valueKey = "id",
    params = {},
    initialValues = [],
}) {
    const locale = useLocale();
    const t = useTranslations("common");
    const [open, setOpen] = useState(false);
    const [search, setSearch] = useState("");
    const [options, setOptions] = useState(initialValues || []);
    const [loading, setLoading] = useState(false);
    const [triggerWidth, setTriggerWidth] = useState(0);
    
    const containerRef = useRef(null);

    useEffect(() => {
        if (initialValues?.length) {
            setOptions(prev => {
                const merged = [...prev];
                initialValues.forEach(obj => {
                    if (!merged.some(d => d[valueKey] === obj[valueKey])) {
                        merged.unshift(obj);
                    }
                });
                return merged;
            });
        }
    }, [initialValues]);

    useEffect(() => {
        if (containerRef.current) {
            setTriggerWidth(containerRef.current.offsetWidth);
        }
    }, [open]);

    useEffect(() => {
        if (open) {
            fetchOptions();
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [open, search]);

    const fetchOptions = async () => {
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
            
            // Merge with initial values and current value objects
            const valueObjects = value.filter(v => typeof v === 'object');
            
            // Start with new data
            let mergedData = [...data];
            
            // Helper to add unique items
            const addUnique = (items) => {
                items.forEach(obj => {
                    const exists = mergedData.some(d => d[valueKey] === obj[valueKey]);
                    if (!exists) {
                        mergedData.unshift(obj);
                    }
                });
            };

            // Add current value objects and initial values
            addUnique(valueObjects);
            addUnique(initialValues || []);
            
            // Final check for duplicates in the entire set (just in case)
            const seen = new Set();
            mergedData = mergedData.filter(item => {
                const id = item[valueKey];
                if (seen.has(id)) return false;
                seen.add(id);
                return true;
            });
            
            setOptions(mergedData);
        } catch (err) {
            console.error("MultiSelect fetch error:", err);
        } finally {
            setLoading(false);
        }
    };

    const toggleOption = (option) => {
        const val = option[valueKey];
        const isSelected = value.some(v => (typeof v === 'object' ? v[valueKey] : v) === val);
        
        let newValue;
        if (isSelected) {
            newValue = value.filter(v => (typeof v === 'object' ? v[valueKey] : v) !== val);
        } else {
            newValue = [...value, option];
        }
        
        onChange(newValue);
    };

    const removeOption = (valId) => {
        const newValue = value.filter(v => (typeof v === 'object' ? v[valueKey] : v) !== valId);
        onChange(newValue);
    };

    return (
        <Popover open={open} onOpenChange={setOpen}>
            <PopoverTrigger asChild>
                <div
                    ref={containerRef}
                    className={cn(
                        "min-h-[50px] w-full rounded-xl border border-input bg-background px-3 py-2 text-sm ring-offset-background flex flex-wrap gap-2 cursor-pointer transition-all",
                        open && "ring-2 ring-primary ring-offset-2 border-primary shadow-sm"
                    )}
                >
                    {value.length === 0 && (
                        <span className="text-muted-foreground self-center">{placeholder}</span>
                    )}
                    {value.map((v) => {
                        const id = typeof v === 'object' ? v[valueKey] : v;
                        let label = "";
                        
                        if (typeof v === 'object') {
                            label = locale === 'ar' ? (v.nameAr || v.nameEn || v.name) : (v.nameEn || v.nameAr || v.name);
                        } else {
                            const option = options.find(opt => opt[valueKey] === id);
                            if (option) {
                                label = locale === 'ar' ? (option.nameAr || option.nameEn || option.name) : (option.nameEn || option.nameAr || option.name);
                            } else {
                                label = id; 
                            }
                        }

                        return (
                            <Badge
                                key={id}
                                variant="outline"
                                className="gap-1 pr-1 py-1 h-7 bg-muted/50 border-border text-foreground font-medium max-w-sm "
                            >
                                <span className="whitespace-nowrap  truncate ">
                                {label}
                                </span>
                                <button
                                    type="button"
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        removeOption(id);
                                    }}
                                    className="rounded-full hover:bg-muted p-0.5"
                                >
                                    <X size={12} />
                                </button>
                            </Badge>
                        );
                    })}
                </div>
            </PopoverTrigger>

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
                        "shadow-lg"
                    )}
                >
                    {/* Top accent gradient bar */}
                    <div
                        aria-hidden
                        className="absolute inset-x-0 top-0 h-[2px] rounded-t-2xl
                        bg-gradient-to-r from-primary via-primary/50 to-primary"
                    />

                    {/* Search header */}
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

                    <div className="max-h-[300px] overflow-auto p-2 space-y-1">
                        {loading && (
                            <div className="flex items-center justify-center py-6">
                                <Loader2 className="h-5 w-5 animate-spin text-primary" />
                            </div>
                        )}
                        {!loading && options.length === 0 && (
                            <div className="py-6 text-center text-sm text-muted-foreground">
                                No results found.
                            </div>
                        )}
                        {options.map((option) => {
                            const isSelected = value.some(v => (typeof v === 'object' ? v[valueKey] : v) === option[valueKey]);
                            return (
                                <div
                                    key={option[valueKey]}
                                    className={cn(
                                        "flex items-center justify-between px-3 py-2 rounded-lg cursor-pointer transition-colors",
                                        isSelected ? "bg-primary/10 text-primary" : "hover:bg-muted"
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
                                    <span className="text-sm font-medium">
                                        {locale === 'ar' ? (option.nameAr || option.nameEn || option.name) : (option.nameEn || option.nameAr || option.name)}
                                    </span>
                                    {isSelected && <Check size={16} />}
                                </div>
                            );
                        })}
                    </div>
                </motion.div>
            </PopoverContent>
        </Popover>
    );
}