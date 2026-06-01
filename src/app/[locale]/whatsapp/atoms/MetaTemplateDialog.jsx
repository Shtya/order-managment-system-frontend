"use client";

import React, { useState, useMemo, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Search, Globe, Tag, ChevronDown, Wand2, Loader2 } from "lucide-react";
import { cn } from "@/utils/cn";
import TemplatePreview from "./TemplatePreview";
import { useLocale, useTranslations } from "next-intl";

import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/FloatingSelect";
import { Checkbox } from "@/components/ui/checkbox";
import { AnimatePresence, motion } from "framer-motion";
import api from "@/utils/api";

export default function MetaTemplateDialog({ open, onOpenChange, onSelectTemplate }) {
    const locale = useLocale();
    const tCats = useTranslations("whatsApp.templates.categories");
    const tInd = useTranslations("whatsApp.templates.industries");
    const tUc = useTranslations("whatsApp.templates.usecases");
    const tCommon = useTranslations("common");
    const t = useTranslations("whatsApp.templates.metaDialog");

    const STATIC_CATEGORIES = useMemo(() => [
        { id: "ALL", label: tCats("all") },
        { id: "E_COMMERCE", label: tInd("E_COMMERCE") },
        { id: "FINANCIAL_SERVICES", label: tInd("FINANCIAL_SERVICES") }
    ], [tCats, tInd]);

    const STATIC_LANGUAGES = useMemo(() => [
        { id: "ar", label: tCommon("languages.ar") },
        { id: "en", label: tCommon("languages.en") },
        { id: "en_US", label: tCommon("languages.en_US") }
    ], [tCommon]);

    const STATIC_INDUSTRIES = useMemo(() => [
        {
            id: "E_COMMERCE",
            label: tInd("E_COMMERCE"),
            usecases: [
                { id: "ORDER_CONFIRMATION", label: tUc("ORDER_CONFIRMATION") },
                { id: "DELIVERY_CONFIRMATION", label: tUc("DELIVERY_CONFIRMATION") },
                { id: "DELIVERY_UPDATE", label: tUc("DELIVERY_UPDATE") },
                { id: "DELIVERY_FAILED", label: tUc("DELIVERY_FAILED") },
                { id: "SHIPMENT_CONFIRMATION", label: tUc("SHIPMENT_CONFIRMATION") },
                { id: "ORDER_PICK_UP", label: tUc("ORDER_PICK_UP") },
                { id: "ORDER_DELAY", label: tUc("ORDER_DELAY") },
                { id: "ORDER_ACTION_NEEDED", label: tUc("ORDER_ACTION_NEEDED") },
                { id: "RETURN_CONFIRMATION", label: tUc("RETURN_CONFIRMATION") },
                { id: "CUSTOMER_FEEDBACK", label: tUc("CUSTOMER_FEEDBACK") },
                { id: "FEEDBACK_SURVEY", label: tUc("FEEDBACK_SURVEY") }
            ]
        },
        {
            id: "FINANCIAL_SERVICES",
            label: tInd("FINANCIAL_SERVICES"),
            usecases: [
                { id: "PAYMENT_CONFIRMATION", label: tUc("PAYMENT_CONFIRMATION") },
                { id: "PAYMENT_ACTION_REQUIRED", label: tUc("PAYMENT_ACTION_REQUIRED") },
                { id: "PAYMENT_DUE_REMINDER", label: tUc("PAYMENT_DUE_REMINDER") },
                { id: "PAYMENT_OVERDUE", label: tUc("PAYMENT_OVERDUE") },
                { id: "PAYMENT_REJECT_FAIL", label: tUc("PAYMENT_REJECT_FAIL") },
                { id: "PAYMENT_SCHEDULED", label: tUc("PAYMENT_SCHEDULED") },
                { id: "AUTO_PAY_REMINDER", label: tUc("AUTO_PAY_REMINDER") },
                { id: "LOW_BALANCE_WARNING", label: tUc("LOW_BALANCE_WARNING") },
                { id: "TRANSACTION_ALERT", label: tUc("TRANSACTION_ALERT") },
                { id: "FRAUD_ALERT", label: tUc("FRAUD_ALERT") },
                { id: "STATEMENT_AVAILABLE", label: tUc("STATEMENT_AVAILABLE") },
                { id: "STATEMENT_ATTACHMENT", label: tUc("STATEMENT_ATTACHMENT") },
                { id: "RECEIPT_ATTACHMENT", label: tUc("RECEIPT_ATTACHMENT") },
                { id: "ACCOUNT_CREATION_CONFIRMATION", label: tUc("ACCOUNT_CREATION_CONFIRMATION") },
                { id: "ORDER_OR_TRANSACTION_CANCEL", label: tUc("ORDER_OR_TRANSACTION_CANCEL") }
            ]
        }
    ], [tInd, tUc]);

    // Filter & UI States
    const [searchTerm, setSearchTerm] = useState("");
    const [debouncedSearch, setDebouncedSearch] = useState("");
    const [selectedLanguage, setSelectedLanguage] = useState("ar"); // Default Arabic
    const [selectedCategory, setSelectedCategory] = useState("ALL");
    const [selectedUsecase, setSelectedUsecase] = useState(null); // Single active usecase filter

    // Accordion Expansion State
    const [expandedGroups, setExpandedGroups] = useState({
        E_COMMERCE: true,
        FINANCIAL_SERVICES: true
    });

    // API Data States
    const [templates, setTemplates] = useState([]);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState(null);

    // ─── 1. DEBOUNCE SEARCH TERM ───
    useEffect(() => {
        const timer = setTimeout(() => {
            setDebouncedSearch(searchTerm);
        }, 400); // 400ms debounce window
        return () => clearTimeout(timer);
    }, [searchTerm]);

    // ─── 2. FETCH DATA ON FILTER CHANGE ───
    useEffect(() => {
        if (!open) return;

        const fetchTemplates = async () => {
            setIsLoading(true);
            setError(null);
            try {
                const params = new URLSearchParams();
                if (debouncedSearch) params.append("search", debouncedSearch);
                if (selectedLanguage) params.append("language", selectedLanguage);
                if (selectedUsecase) params.append("usecase", selectedUsecase);

                // Find and append industry automatically if a usecase is active
                if (selectedUsecase) {
                    const parentIndustry = STATIC_INDUSTRIES.find(ind =>
                        ind.usecases.some(uc => uc.id === selectedUsecase)
                    );
                    if (parentIndustry) params.append("industry", parentIndustry.id);
                }
                if (selectedCategory !== "ALL") {
                    params.append("industry", selectedCategory);
                }


                // ⚠️ استبدل هذا المسار بمسار الـ API الخاص بمشروعك ⚠️
                const { data } = await api.get(`/whatsapp-templates/meta-library`, { params })

                const fetchedTemplates = Array.isArray(data) ? data : (data?.data || []);
                setTemplates(fetchedTemplates);

            } catch (err) {
                console.error("Meta Library Fetch Error:", err);
                setError(err.message);
                setTemplates([]);
            } finally {
                setIsLoading(false);
            }
        };

        fetchTemplates();
    }, [debouncedSearch, selectedLanguage, selectedCategory, selectedUsecase, open]);

    // ─── 3. CLIENT SIDE COUNTS GENERATION ───
    // Calculate template frequencies dynamically based on current fetch results
    const counts = useMemo(() => {
        const industryMap = {};
        const usecaseMap = {};

        // Initialize maps with 0 for all static items
        STATIC_INDUSTRIES.forEach(ind => {
            industryMap[ind.id] = 0;
            ind.usecases.forEach(uc => {
                usecaseMap[uc.id] = 0;
            });
        });

        // Compute template intersections
        templates.forEach(tpl => {
            // Apply top category filter if selected (since backend doesn't handle category directly)
            if (selectedCategory !== "ALL" && tpl.category !== selectedCategory) {
                return;
            }

            // Increment usecase count
            if (tpl.usecase && usecaseMap[tpl.usecase] !== undefined) {
                usecaseMap[tpl.usecase] += 1;
            }

            // Increment industry count (handles string or array mapping from api)
            if (tpl.industry) {
                const indList = Array.isArray(tpl.industry) ? tpl.industry : [tpl.industry];
                indList.forEach(indId => {
                    if (industryMap[indId] !== undefined) {
                        industryMap[indId] += 1;
                    }
                });
            } else if (tpl.usecase) {
                // Fallback: If industry field missing, map through our static relation logic
                const parentInd = STATIC_INDUSTRIES.find(ind => ind.usecases.some(uc => uc.id === tpl.usecase));
                if (parentInd) {
                    industryMap[parentInd.id] += 1;
                }
            }
        });

        return { industries: industryMap, usecases: usecaseMap };
    }, [templates, selectedCategory]);

    // ─── 4. FINAL FILTERED DATA FOR GRID ───
    const displayTemplates = useMemo(() => {
        return templates;
    }, [templates, selectedCategory]);

    // ─── UI HANDLERS ───
    const handleUsecaseToggle = (usecaseId) => {
        setSelectedUsecase(prev => (prev === usecaseId ? null : usecaseId));
    };

    const toggleGroup = (groupId) => {
        setExpandedGroups(prev => ({ ...prev, [groupId]: !prev[groupId] }));
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-[90vw] md:max-w-[1200px] h-[85vh] p-0 flex flex-col rounded-2xl overflow-hidden bg-background">

                {/* ── TOP HEADER & FILTERS ── */}
                <DialogHeader className="p-6 border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0f1117] flex-shrink-0 space-y-4">
                    <DialogTitle className="text-xl font-bold flex items-center gap-2 text-foreground">
                        <Wand2 className="w-6 h-6 text-primary" />
                        {t("title")}
                    </DialogTitle>

                    <div className="flex flex-wrap md:flex-nowrap gap-4 items-center">
                        {/* Search Input */}
                        <div className="relative flex-1 min-w-[200px]">
                            <Search className={cn("absolute top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4", locale === "ar" ? "right-3" : "left-3")} />
                            <Input
                                placeholder={t("searchPlaceholder")}
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="rounded-xl h-[50px] bg-[#fafafa] dark:bg-slate-800/50 border-gray-200 dark:border-slate-700 focus:ring-2 focus:ring-primary/20"
                                style={{ paddingLeft: locale === "ar" ? "10px" : "45px", paddingRight: locale === "ar" ? "45px" : "10px" }}
                            />
                        </div>

                        {/* Language Selection */}
                        <div className="flex-shrink-0">
                            <Select value={selectedLanguage} onValueChange={setSelectedLanguage}>
                                <SelectTrigger className="w-[180px] h-[50px] rounded-xl bg-[#fafafa] dark:bg-slate-800/50 border-gray-200 dark:border-slate-700">
                                    <div className="flex items-center gap-2">
                                        <Globe className="w-4 h-4 text-slate-400" />
                                        <SelectValue placeholder={t("selectLanguage")} />
                                    </div>
                                </SelectTrigger>
                                <SelectContent>
                                    {STATIC_LANGUAGES.map(lang => (
                                        <SelectItem key={lang.id} value={lang.id}>
                                            {lang.label}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>

                        {/* Top Category Tabs */}
                        <div className="flex bg-[#fafafa] dark:bg-slate-800/50 rounded-xl p-1 border border-gray-200 dark:border-slate-700 overflow-x-auto hide-scrollbar">
                            {STATIC_CATEGORIES.map(category => (
                                <button
                                    key={category.id}
                                    onClick={() => setSelectedCategory(category.id)}
                                    className={cn(
                                        "px-4 h-[40px] rounded-lg text-sm font-bold transition-all duration-200 whitespace-nowrap",
                                        selectedCategory === category.id
                                            ? "bg-white dark:bg-slate-700 text-primary shadow-sm"
                                            : "text-slate-500 hover:text-slate-700 dark:hover:text-slate-300"
                                    )}
                                >
                                    {category.label}
                                </button>
                            ))}
                        </div>
                    </div>
                </DialogHeader>

                {/* ── MAIN WORKSPACE ── */}
                <div className="flex flex-1 overflow-hidden">

                    {/* SIDEBAR: Static Industries Accordions */}
                    <div className="w-80 border-l border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0f1117] flex-shrink-0 overflow-y-auto p-4 flex flex-col gap-2">
                        <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2 px-2">{tInd("title")}</h4>

                        {STATIC_INDUSTRIES.map(industry => {
                            const isExpanded = expandedGroups[industry.id];
                            const industryCount = counts.industries[industry.id] || 0;

                            return (
                                <div key={industry.id} className="flex flex-col gap-1">
                                    {/* Accordion Header */}
                                    <button
                                        onClick={() => toggleGroup(industry.id)}
                                        className={cn(
                                            "flex items-center justify-between px-3 py-2.5 rounded-xl text-sm font-bold transition-all w-full text-right bg-slate-50/70 dark:bg-slate-800/30 border border-transparent hover:bg-slate-50 dark:hover:bg-slate-800/60",
                                            isExpanded && "border-slate-200/60 dark:border-slate-700/60"
                                        )}
                                    >
                                        <div className="flex items-center gap-1.5 truncate">
                                            <span className="text-slate-800 dark:text-slate-200 truncate">{industry.label}</span>
                                            <span className="text-xs bg-slate-200/60 dark:bg-slate-800 px-1.5 py-0.5 rounded-full text-slate-500">
                                                {industryCount}
                                            </span>
                                        </div>
                                        <ChevronDown className={cn("w-4 h-4 text-slate-400 transition-transform duration-200", isExpanded && "rotate-180")} />
                                    </button>

                                    {/* Static Nested Use Cases */}
                                    <AnimatePresence initial={false}>
                                        {isExpanded && (
                                            <motion.div
                                                initial={{ height: 0, opacity: 0 }}
                                                animate={{ height: "auto", opacity: 1 }}
                                                exit={{ height: 0, opacity: 0 }}
                                                className="overflow-hidden flex flex-col gap-1 mt-0.5 pr-1"
                                            >
                                                {industry.usecases.map(uc => {
                                                    const ucCount = counts.usecases[uc.id] || 0;
                                                    const isSelected = selectedUsecase === uc.id;

                                                    return (
                                                        <div
                                                            key={uc.id}
                                                            onClick={() => handleUsecaseToggle(uc.id)}
                                                            className={cn(
                                                                "flex items-center gap-3 px-3 py-2 rounded-lg cursor-pointer transition-colors group",
                                                                isSelected
                                                                    ? "bg-primary/5 dark:bg-primary/10"
                                                                    : "hover:bg-slate-50 dark:hover:bg-slate-800/40",
                                                                ucCount === 0 && "opacity-50" // Dim out if no templates present
                                                            )}
                                                        >
                                                            <Checkbox
                                                                checked={isSelected}
                                                                className="data-[state=checked]:bg-primary data-[state=checked]:border-primary"
                                                            />
                                                            <span className={cn(
                                                                "text-xs font-medium flex-1 truncate transition-colors",
                                                                isSelected
                                                                    ? "text-primary font-bold"
                                                                    : "text-slate-600 dark:text-slate-400 group-hover:text-slate-900 dark:group-hover:text-slate-200"
                                                            )}>
                                                                {uc.label}
                                                            </span>
                                                            <span className="text-[10px] text-slate-400 font-mono bg-slate-100 dark:bg-slate-800/80 px-1.5 py-0.5 rounded">
                                                                {ucCount}
                                                            </span>
                                                        </div>
                                                    );
                                                })}
                                            </motion.div>
                                        )}
                                    </AnimatePresence>
                                </div>
                            );
                        })}
                    </div>

                    {/* PREVIEW GRID AREA */}
                    <div className="flex-1 bg-[#f6f6f7] dark:bg-[#13161f] p-6 overflow-y-auto relative">
                        {isLoading ? (
                            <div className="flex flex-col items-center justify-center h-full text-slate-400">
                                <Loader2 className="w-12 h-12 mb-4 animate-spin text-primary opacity-80" />
                                <p>{t("loading")}</p>
                            </div>
                        ) : error ? (
                            <div className="flex flex-col items-center justify-center h-full text-red-400 p-4 text-center">
                                <p>{t("error", { error })}</p>
                                <Button variant="outline" className="mt-4 rounded-xl border-red-200" onClick={() => setSearchTerm(searchTerm)}>
                                    {t("retry")}
                                </Button>
                            </div>
                        ) : displayTemplates.length === 0 ? (
                            <div className="flex flex-col items-center justify-center h-full text-slate-400 text-center">
                                <Tag className="w-12 h-12 mb-4 opacity-20" />
                                <p className="font-medium">{t("noTemplates")}</p>
                                <p className="text-xs text-slate-400 mt-1">{t("matchNote")}</p>
                            </div>
                        ) : (
                            <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
                                {displayTemplates.map(template => (
                                    <div key={template.id} className="relative group flex flex-col bg-white dark:bg-card border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden transition-all duration-200 hover:shadow-md">

                                        {/* Phone Canvas Frame */}
                                        <div className="flex-1 flex justify-center border-b border-slate-100 dark:border-slate-800/60 relative min-h-[380px]">
                                            <TemplatePreview
                                                flat
                                                hasHeader={false}
                                                template={{
                                                    ...template.templateConfig,
                                                    language: template.language,
                                                    subcategory: template.usecase
                                                }}
                                            />
                                        </div>

                                        {/* Card Actions */}
                                        <div className="p-4 flex items-center justify-between bg-white dark:bg-card">
                                            <div className="truncate pr-3 flex-1">
                                                <h3 className="font-bold text-sm text-foreground truncate" title={template.name}>
                                                    {template.name}
                                                </h3>
                                                <div className="flex items-center gap-2 mt-1">
                                                    <span className="text-[10px] uppercase font-bold text-primary bg-primary/5 px-2 py-0.5 rounded">
                                                        {template.category}
                                                    </span>
                                                </div>
                                            </div>
                                            <Button
                                                onClick={() => {
                                                    onSelectTemplate(template);
                                                    onOpenChange(false);
                                                }}
                                                className="rounded-xl bg-primary hover:bg-primary/90 text-white shadow-md shadow-primary/10 flex-shrink-0"
                                            >
                                                {tCommon("use")}
                                            </Button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
}