
"use client";

import React, { useState, useMemo } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button"; // Assuming standard shadcn/ui button
import { Search, Globe, Tag, ChevronRight, Wand2 } from "lucide-react";
import { cn } from "@/utils/cn";
import TemplatePreview from "./TemplatePreview";

export const META_TEMPLATE_CONFIG = {
    CATEGORIES: [
        { id: "MARKETING", label: "تسويق (Marketing)" },
        { id: "UTILITY", label: "خدمة (Utility)" },
        { id: "AUTHENTICATION", label: "مصادقة (Authentication)" }
    ],
    SUB_CATEGORIES: {
        MARKETING: [
            { id: "PROMOTION", label: "عروض ترويجية" },
            { id: "HOLIDAY", label: "مبيعات العطلات" },
            { id: "PRODUCT_UPDATE", label: "تحديثات المنتجات" }
        ],
        UTILITY: [
            { id: "ORDER_UPDATE", label: "تحديثات الطلب" },
            { id: "ACCOUNT_ALERT", label: "تنبيهات الحساب" },
            { id: "SHIPPING", label: "معلومات الشحن" }
        ],
        AUTHENTICATION: [
            { id: "OTP", label: "كلمات مرور لمرة واحدة (OTP)" },
            { id: "RECOVERY", label: "استرداد الحساب" }
        ]
    },
    LANGUAGES: [
        { id: "ar", label: "العربية (Arabic)" },
        { id: "en_US", label: "English (US)" }
    ]
};

// Mock data for testing the preview
export const MOCK_TEMPLATES = [
    {
        id: "1",
        name: "ramadan_offer_01",
        category: "MARKETING",
        subCategory: "PROMOTION",
        language: "ar",
        components: [
            { type: "HEADER", format: "TEXT", text: "عرض رمضان الحصري 🌙" },
            { type: "BODY", text: "مرحباً {{1}}، استفد من خصم {{2}}% على جميع منتجاتنا بمناسبة الشهر الكريم!" },
            { type: "FOOTER", text: "تطبق الشروط والأحكام" },
            { type: "BUTTONS", buttons: [{ type: "URL", text: "تسوق الآن", url: "https://example.com" }] }
        ]
    },
    {
        id: "2",
        name: "order_shipped_alert",
        category: "UTILITY",
        subCategory: "SHIPPING",
        language: "ar",
        components: [
            { type: "HEADER", format: "TEXT", text: "تم شحن طلبك 📦" },
            { type: "BODY", text: "مرحباً {{1}}، طلبك رقم {{2}} في طريقه إليك. يمكنك تتبع الشحنة عبر الرابط أدناه." },
            { type: "BUTTONS", buttons: [{ type: "URL", text: "تتبع الطلب", url: "https://example.com/track" }] }
        ]
    }
];


export function MetaTemplateDialog({ open, onOpenChange, onSelectTemplate }) {
    const [searchTerm, setSearchTerm] = useState("");
    const [selectedCategory, setSelectedCategory] = useState("MARKETING");
    const [selectedSubCategory, setSelectedSubCategory] = useState("ALL");
    const [selectedLanguage, setSelectedLanguage] = useState("ar");

    // Reset sub-category when category changes
    const handleCategoryChange = (catId) => {
        setSelectedCategory(catId);
        setSelectedSubCategory("ALL");
    };

    // Filter templates based on selections
    const filteredTemplates = useMemo(() => {
        return MOCK_TEMPLATES.filter(tpl => {
            const matchesSearch = tpl.name.toLowerCase().includes(searchTerm.toLowerCase());
            const matchesLang = tpl.language === selectedLanguage;
            const matchesCat = tpl.category === selectedCategory;
            const matchesSub = selectedSubCategory === "ALL" || tpl.subCategory === selectedSubCategory;

            return matchesSearch && matchesLang && matchesCat && matchesSub;
        });
    }, [searchTerm, selectedLanguage, selectedCategory, selectedSubCategory]);

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-[90vw] md:max-w-[1200px] h-[85vh] p-0 flex flex-col rounded-2xl overflow-hidden bg-background">
                {/* ── TOP HEADER & FILTERS ── */}
                <DialogHeader className="p-6 border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0f1117] flex-shrink-0 space-y-4">
                    <DialogTitle className="text-xl font-bold flex items-center gap-2 text-foreground">
                        <Wand2 className="w-6 h-6 text-primary" />
                        اختر قالب جاهز من Meta
                    </DialogTitle>

                    <div className="flex flex-wrap md:flex-nowrap gap-4 items-center">
                        {/* Search */}
                        <div className="relative flex-1 min-w-[200px]">
                            <Search className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
                            <Input
                                placeholder="ابحث باسم القالب..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="pr-10 rounded-xl h-[50px] bg-[#fafafa] dark:bg-slate-800/50 border-gray-200 dark:border-slate-700 focus:ring-2 focus:ring-primary/20"
                            />
                        </div>

                        {/* Language */}
                        <div className="flex-shrink-0 flex items-center gap-2 bg-[#fafafa] dark:bg-slate-800/50 rounded-xl p-1 border border-gray-200 dark:border-slate-700 h-[50px]">
                            <Globe className="w-4 h-4 text-slate-400 mr-2 ml-2" />
                            <select
                                value={selectedLanguage}
                                onChange={(e) => setSelectedLanguage(e.target.value)}
                                className="bg-transparent border-none outline-none text-sm font-medium pr-4 cursor-pointer text-foreground"
                            >
                                {META_TEMPLATE_CONFIG.LANGUAGES.map(lang => (
                                    <option key={lang.id} value={lang.id}>{lang.label}</option>
                                ))}
                            </select>
                        </div>

                        {/* Top Categories */}
                        <div className="flex bg-[#fafafa] dark:bg-slate-800/50 rounded-xl p-1 border border-gray-200 dark:border-slate-700">
                            {META_TEMPLATE_CONFIG.CATEGORIES.map(cat => (
                                <button
                                    key={cat.id}
                                    onClick={() => handleCategoryChange(cat.id)}
                                    className={cn(
                                        "px-4 h-[40px] rounded-lg text-sm font-bold transition-all duration-200",
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

                {/* ── MAIN CONTENT AREA ── */}
                <div className="flex flex-1 overflow-hidden">

                    {/* SIDEBAR: Sub-categories */}
                    <div className="w-64 border-l border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0f1117] flex-shrink-0 overflow-y-auto p-4 flex flex-col gap-2">
                        <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2 px-2">الفئات الفرعية</h4>
                        {META_TEMPLATE_CONFIG.SUB_CATEGORIES[selectedCategory].map(sub => (
                            <button
                                key={sub.id}
                                onClick={() => setSelectedSubCategory(sub.id)}
                                className={cn(
                                    "flex items-center justify-between px-4 py-3 rounded-xl text-sm font-medium transition-colors w-full text-right",
                                    selectedSubCategory === sub.id
                                        ? "bg-primary/10 text-primary border border-primary/20"
                                        : "hover:bg-slate-50 dark:hover:bg-slate-800/50 text-slate-600 dark:text-slate-300"
                                )}
                            >
                                {sub.label}
                                {selectedSubCategory === sub.id && <ChevronRight className="w-4 h-4" />}
                            </button>
                        ))}
                    </div>

                    {/* PREVIEW GRID */}
                    <div className="flex-1 bg-[#f6f6f7] dark:bg-[#13161f] p-6 overflow-y-auto">
                        {filteredTemplates.length === 0 ? (
                            <div className="flex flex-col items-center justify-center h-full text-slate-400">
                                <Tag className="w-12 h-12 mb-4 opacity-20" />
                                <p>لا توجد قوالب تطابق معايير البحث.</p>
                            </div>
                        ) : (
                            <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
                                {filteredTemplates.map(template => (
                                    <div key={template.id} className="relative group flex flex-col bg-white dark:bg-card border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden shadow-sm hover:shadow-lg transition-shadow">

                                        {/* Template Preview Component Wrapper */}
                                        <div className="p-4 bg-slate-50 dark:bg-slate-900/30 flex-1 flex justify-center border-b border-slate-100 dark:border-slate-800">
                                            {/* Note: Pass data appropriately based on your TemplatePreview.jsx prop structure */}
                                            <TemplatePreview
                                                components={template.components}
                                                locale={template.language}
                                            />
                                        </div>

                                        {/* Card Footer / Action */}
                                        <div className="p-4 flex items-center justify-between">
                                            <div>
                                                <h3 className="font-bold text-sm text-foreground">{template.name}</h3>
                                                <p className="text-xs text-slate-500 mt-1">{template.subCategory}</p>
                                            </div>
                                            <Button
                                                onClick={() => {
                                                    onSelectTemplate(template);
                                                    onOpenChange(false);
                                                }}
                                                className="rounded-xl bg-primary hover:bg-primary/90 text-white shadow-lg shadow-primary/20"
                                            >
                                                استخدام
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