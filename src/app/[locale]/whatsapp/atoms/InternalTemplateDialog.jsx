"use client";

import React, { useState, useMemo, useEffect, useCallback } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Search, Globe, Tag, Layout, Check, Loader2, Phone, Filter, ChevronDown, ChevronUp } from "lucide-react";
import { cn } from "@/utils/cn";
import TemplatePreview from "./TemplatePreview";
import { useLocale, useTranslations } from "next-intl";
import { useConversation } from "./chats/ConversationContext";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/FloatingSelect";
import api from "@/utils/api";
import { toast } from "react-hot-toast";
import { useDebounce } from "@/hook/useDebounce";
import { motion, AnimatePresence } from "framer-motion";

export function InternalTemplateDialog({ title, open, onOpenChange, defaultAccountId, onSelectTemplate, library }) {
    const tCats = useTranslations("whatsApp.templates.categories");
    const tCommon = useTranslations("common");
    const t = useTranslations("whatsApp.templates.dialog");
    const [searchTerm, setSearchTerm] = useState("");
    const { debouncedValue: debouncedSearchTerm } = useDebounce({ value: searchTerm });
    const [selectedCategory, setSelectedCategory] = useState("all");
    const [selectedLanguage, setSelectedLanguage] = useState("all");
    const [selectedAccountId, setSelectedAccountId] = useState(defaultAccountId || "all");
    const [accounts, setAccounts] = useState([]);
    const [templates, setTemplates] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showFilters, setShowFilters] = useState(false);
    const locale = useLocale();

    const internalConfig = useMemo(() => ({
        CATEGORIES: [
            { id: "marketing", label: tCats("marketing") },
            { id: "utility", label: tCats("utility") },
            { id: "authentication", label: tCats("authentication") }
        ],
        LANGUAGES: [
            { id: "all", label: tCommon("all") },
            { id: "ar", label: tCommon("languages.ar") },
            { id: "en", label: tCommon("languages.en") },
            { id: "en_US", label: tCommon("languages.en_US") }
        ]
    }), [tCats, tCommon]);

    useEffect(() => {
        if (open && defaultAccountId) {
            setSelectedAccountId(defaultAccountId);
        }
    }, [open, defaultAccountId]);

    const fetchAccounts = useCallback(async () => {
        try {
            const res = await api.get("/whatsapp-accounts", { params: { limit: 200, isActive: "true" } });
            setAccounts(Array.isArray(res.data?.records) ? res.data.records : []);
        } catch (e) {
            console.error(e);
        }
    }, []);

    const fetchTemplates = useCallback(async () => {
        if (!open) return;
        setLoading(true);
        try {
            const params = {
                ...(!library && { status: "approved" }),
                page: 1,
                limit: 100,
                search: debouncedSearchTerm,
                language: selectedLanguage !== "all" ? selectedLanguage : undefined,
                category: selectedCategory !== "all" ? selectedCategory : undefined,
                accountId: selectedAccountId !== "all" ? selectedAccountId : undefined,
            };
            const res = await api.get(library ? "/whatsapp-templates/library" : "/whatsapp-templates", { params });
            setTemplates(Array.isArray(res.data?.records) ? res.data.records : []);
        } catch (e) {
            console.error(e);
            toast.error(t("fetchError"));
        } finally {
            setLoading(false);
        }
    }, [open, debouncedSearchTerm, selectedLanguage, selectedCategory, selectedAccountId, library, t]);

    useEffect(() => {
        if (open) {
            fetchAccounts();
        }
    }, [open, fetchAccounts]);

    useEffect(() => {
        fetchTemplates();
    }, [fetchTemplates]);

    const categories = useMemo(() => [
        { id: "all", label: tCommon("all") },
        ...internalConfig.CATEGORIES
    ], [tCommon, internalConfig.CATEGORIES]);

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-[90vw] md:max-w-[1200px] h-[85vh] p-0 flex flex-col rounded-2xl overflow-hidden bg-background">
                <DialogHeader className="p-4 md:p-6 border-b border-border bg-card shrink-0 space-y-4">
                    <div className="flex items-center justify-between">
                        <DialogTitle className="text-lg md:text-xl font-bold flex items-center gap-2 text-foreground">
                            <Layout className="w-5 h-5 md:w-6 md:h-6 text-primary" />
                            {title || t("title")}
                        </DialogTitle>
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setShowFilters(!showFilters)}
                            className={cn(
                                "flex items-center gap-2 rounded-xl h-9 md:h-10 px-3 md:px-4 me-10",
                                showFilters ? "bg-primary/10 text-primary" : "text-muted-foreground"
                            )}
                        >
                            <Filter className="w-4 h-4" />
                            <span className="text-xs md:text-sm font-bold">{tCommon("filters")}</span>
                            {showFilters ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                        </Button>
                    </div>

                    <div className="space-y-4">
                        <div className="relative w-full">
                            <Search className={cn("absolute top-1/2 -translate-y-1/2 text-muted-foreground/60 w-4 h-4", locale === "ar" ? "right-3" : "left-3")} />
                            <Input
                                placeholder={t("searchPlaceholder")}
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="rounded-xl h-[45px] md:h-[50px] bg-muted/50 border-border focus:ring-2 focus:ring-primary/20"
                                style={{ paddingLeft: locale === "ar" ? "10px" : "45px", paddingRight: locale === "ar" ? "45px" : "10px" }}
                            />
                        </div>

                        <AnimatePresence>
                            {showFilters && (
                                <motion.div
                                    initial={{ height: 0, opacity: 0 }}
                                    animate={{ height: "auto", opacity: 1 }}
                                    exit={{ height: 0, opacity: 0 }}
                                    className="overflow-hidden"
                                >
                                    <div className="flex flex-wrap gap-3 md:gap-4 items-center pt-2">
                                        {!library && (
                                            <div className="flex-1 min-w-[200px] md:flex-initial md:w-[220px]">
                                                <Select value={selectedAccountId} onValueChange={setSelectedAccountId}>
                                                    <SelectTrigger className="w-full h-[45px] md:h-[50px] rounded-xl bg-muted/50 border-border">
                                                        <div className="flex items-center gap-2">
                                                            <Phone className="w-4 h-4 text-muted-foreground/60" />
                                                            <SelectValue placeholder={t("filterByAccount")} />
                                                        </div>
                                                    </SelectTrigger>
                                                    <SelectContent>
                                                        <SelectItem value="all">{t("allAccounts")}</SelectItem>
                                                        {accounts.map(acc => (
                                                            <SelectItem key={acc.id} value={acc.id}>
                                                                {acc.name} ({acc.mobileNumber})
                                                            </SelectItem>
                                                        ))}
                                                    </SelectContent>
                                                </Select>
                                            </div>
                                        )}

                                        <div className="flex-1 min-w-[150px] md:flex-initial md:w-[180px]">
                                            <Select value={selectedLanguage} onValueChange={setSelectedLanguage}>
                                                <SelectTrigger className="w-full h-[45px] md:h-[50px] rounded-xl bg-muted/50 border-border">
                                                    <div className="flex items-center gap-2">
                                                        <Globe className="w-4 h-4 text-muted-foreground/60" />
                                                        <SelectValue placeholder={t("selectLanguage")} />
                                                    </div>
                                                </SelectTrigger>
                                                <SelectContent>
                                                    {internalConfig.LANGUAGES.map(lang => (
                                                        <SelectItem key={lang.id} value={lang.id}>{lang.label}</SelectItem>
                                                    ))}
                                                </SelectContent>
                                            </Select>
                                        </div>

                                        <div className="flex bg-muted/50 rounded-xl p-1 border border-border overflow-x-auto hide-scrollbar">
                                            {categories.map(cat => (
                                                <button
                                                    key={cat.id}
                                                    onClick={() => setSelectedCategory(cat.id)}
                                                    className={cn(
                                                        "px-3 md:px-4 h-[35px] md:h-[40px] rounded-lg text-[10px] md:text-[11px] font-bold transition-all duration-200 whitespace-nowrap",
                                                        selectedCategory === cat.id
                                                            ? "bg-card text-primary shadow-sm"
                                                            : "text-muted-foreground hover:text-foreground"
                                                    )}
                                                >
                                                    {cat.label}
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>
                </DialogHeader>

                <div className="flex-1 bg-[#f6f6f7] dark:bg-[#13161f] p-6 overflow-y-auto relative">
                    {loading ? (
                        <div className="absolute inset-0 bg-white/50 dark:bg-slate-900/50 flex items-center justify-center z-10">
                            <Loader2 className="w-8 h-8 animate-spin text-primary" />
                        </div>
                    )

                        : templates.length === 0 ? (
                            <div className="flex flex-col items-center justify-center h-full text-slate-400">
                                <Tag className="w-12 h-12 mb-4 opacity-20" />
                                <p>{t("noTemplatesFound")}</p>
                            </div>
                        ) : (
                            <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
                                {templates.map(template => (
                                    <div key={template.id} className="relative group flex flex-col bg-white dark:bg-card border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden shadow-sm hover:shadow-md transition-shadow">
                                        <div className="flex-1 flex justify-center border-b border-slate-100 dark:border-slate-800 relative min-h-[400px]">
                                            <TemplatePreview
                                                flat
                                                hasHeader={false}
                                                template={{
                                                    ...template.templateConfig,
                                                    language: template.language
                                                }}
                                            />
                                        </div>

                                        <div className="p-4 flex items-center justify-between">
                                            <div className="min-w-0 flex-1 mr-2">
                                                <h3 className="font-bold text-sm text-foreground truncate">{template.name}</h3>
                                                <p className="text-[10px] text-slate-500 mt-1 uppercase font-bold tracking-wider">{template.category} • {template.language}</p>
                                            </div>
                                            <Button
                                                onClick={() => {
                                                    onSelectTemplate(template);
                                                    onOpenChange(false);
                                                }}
                                                className="rounded-xl bg-primary hover:bg-primary/90 text-white shadow-lg shadow-primary/20 shrink-0"
                                            >
                                                {tCommon("use")}
                                            </Button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                </div>
            </DialogContent>
        </Dialog>
    );
}
