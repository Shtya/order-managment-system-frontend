"use client";

import React, { useState, useMemo, useEffect, useCallback } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Search, Globe, Tag, Layout, Check, Loader2, Phone } from "lucide-react";
import { cn } from "@/utils/cn";
import TemplatePreview from "./TemplatePreview";
import { useLocale } from "next-intl";
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

const INTERNAL_CONFIG = {
    CATEGORIES: [
        { id: "marketing", label: "تسويق (Marketing)" },
        { id: "utility", label: "خدمة (Utility)" },
        { id: "authentication", label: "مصادقة (Authentication)" }
    ],
    LANGUAGES: [
        { id: "all", label: "كل" },
        { id: "ar", label: "العربية (Arabic)" },
        { id: "en", label: "English" }
    ]
};


export function InternalTemplateDialog({ open, onOpenChange, onSelectTemplate, library }) {
    const [searchTerm, setSearchTerm] = useState("");
    const { debouncedValue: debouncedSearchTerm } = useDebounce({ value: searchTerm });
    const [selectedCategory, setSelectedCategory] = useState("all");
    const [selectedLanguage, setSelectedLanguage] = useState("all");
    const [selectedAccountId, setSelectedAccountId] = useState("all");
    const [accounts, setAccounts] = useState([]);
    const [templates, setTemplates] = useState([]);
    const [loading, setLoading] = useState(true);
    const locale = useLocale();

    const fetchAccounts = useCallback(async () => {
        try {
            const res = await api.get("/whatsapp-accounts", { params: { limit: 200 } });
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
            toast.error("فشل في جلب القوالب");
        } finally {
            setLoading(false);
        }
    }, [open, debouncedSearchTerm, selectedLanguage, selectedCategory, selectedAccountId]);

    useEffect(() => {
        if (open) {
            fetchAccounts();
        }
    }, [open, fetchAccounts]);

    useEffect(() => {
        fetchTemplates();
    }, [fetchTemplates]);

    const categories = useMemo(() => [
        { id: "all", label: "الكل" },
        ...INTERNAL_CONFIG.CATEGORIES
    ], []);

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-[90vw] md:max-w-[1200px] h-[85vh] p-0 flex flex-col rounded-2xl overflow-hidden bg-background">
                <DialogHeader className="p-6 border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0f1117] flex-shrink-0 space-y-4">
                    <DialogTitle className="text-xl font-bold flex items-center gap-2 text-foreground">
                        <Layout className="w-6 h-6 text-primary" />
                        قوالب الواتساب المعتمدة
                    </DialogTitle>

                    <div className="flex flex-wrap gap-4 items-center">
                        <div className="relative flex-1 min-w-[200px]">
                            <Search className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
                            <Input
                                placeholder="ابحث باسم القالب..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="rounded-xl h-[50px] bg-[#fafafa] dark:bg-slate-800/50 border-gray-200 dark:border-slate-700 focus:ring-2 focus:ring-primary/20"
                                style={{ paddingLeft: locale === "ar" ? "10px" : "45px", paddingRight: locale === "ar" ? "45px" : "10px" }}
                            />
                        </div>

                        {!library && <div className="flex-shrink-0">
                            <Select value={selectedAccountId} onValueChange={setSelectedAccountId}>
                                <SelectTrigger className="w-[220px] h-[50px] rounded-xl bg-[#fafafa] dark:bg-slate-800/50 border-gray-200 dark:border-slate-700">
                                    <div className="flex items-center gap-2">
                                        <Phone className="w-4 h-4 text-slate-400" />
                                        <SelectValue placeholder="تصفية حسب الحساب" />
                                    </div>
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">جميع الحسابات</SelectItem>
                                    {accounts.map(acc => (
                                        <SelectItem key={acc.id} value={acc.id}>
                                            {acc.name} ({acc.mobileNumber})
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>}

                        <div className="flex-shrink-0">
                            <Select value={selectedLanguage} onValueChange={setSelectedLanguage}>
                                <SelectTrigger className="w-[180px] h-[50px] rounded-xl bg-[#fafafa] dark:bg-slate-800/50 border-gray-200 dark:border-slate-700">
                                    <div className="flex items-center gap-2">
                                        <Globe className="w-4 h-4 text-slate-400" />
                                        <SelectValue placeholder="اختر اللغة" />
                                    </div>
                                </SelectTrigger>
                                <SelectContent>
                                    {INTERNAL_CONFIG.LANGUAGES.map(lang => (
                                        <SelectItem key={lang.id} value={lang.id}>{lang.label}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="flex bg-[#fafafa] dark:bg-slate-800/50 rounded-xl p-1 border border-gray-200 dark:border-slate-700">
                            {categories.map(cat => (
                                <button
                                    key={cat.id}
                                    onClick={() => setSelectedCategory(cat.id)}
                                    className={cn(
                                        "px-4 h-[40px] rounded-lg text-[11px] font-bold transition-all duration-200",
                                        selectedCategory === cat.id
                                            ? "bg-white dark:bg-slate-700 text-primary shadow-sm"
                                            : "text-slate-500 hover:text-slate-700 dark:hover:text-slate-300"
                                    )}
                                >
                                    {cat.label}
                                </button>
                            ))}
                        </div>
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
                                <p>لا توجد قوالب تطابق معايير البحث.</p>
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
                                                استخدام
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
