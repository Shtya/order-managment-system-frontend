"use client";

import React, { useState, useMemo } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Search, Globe, Tag, Layout, Check } from "lucide-react";
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

const INTERNAL_CONFIG = {
    CATEGORIES: [
        { id: "MARKETING", label: "تسويق (Marketing)" },
        { id: "UTILITY", label: "خدمة (Utility)" },
        { id: "AUTHENTICATION", label: "مصادقة (Authentication)" }
    ],
    LANGUAGES: [
        { id: "ar", label: "العربية (Arabic)" },
        { id: "en", label: "English" }
    ]
};

const INTERNAL_MOCK_TEMPLATES = [
    {
        id: "int-1",
        name: "Confirm Order",
        category: "UTILITY",
        language: "en",
        template: {
            headerType: "TEXT",
            headerText: "Order Confirmed! ✅",
            bodyText: "Hi {{1}}, thank you for your order #{{2}}. We are processing it and will notify you soon.",
            footerText: "Thank you for choosing us.",
            examples: { "1": "Ahmed", "2": "1001" },
            buttons: [
                { type: "URL", text: "View Order", url: "https://example.com/order/{{2}}" }
            ]
        }
    },

    {
        id: "int-2",
        name: "Order Shipped",
        category: "UTILITY",
        language: "en",
        template: {
            headerType: "IMAGE",
            headerUrl: "https://ix-marketing.imgix.net/bg-remove_after.png?auto=format,compress&w=1946",
            bodyText: "Great news {{1}}! Your order #{{2}} has been shipped. Track your package using the button below.",
            footerText: "Expected delivery: 3-5 days.",
            examples: { "1": "Sara", "2": "1002" },
            buttons: [
                { type: "URL", text: "Track Package", url: "https://example.com/track/{{2}}" }
            ]
        }
    },
    {
        id: "int-3",
        name: "Order Delivered",
        category: "UTILITY",
        language: "en",
        template: {
            headerType: "TEXT",
            headerText: "Order Delivered 📦",
            bodyText: "Hi {{1}}, your order #{{2}} has been delivered. We hope you enjoy your purchase!",
            footerText: "Rate your experience.",
            examples: { "1": "Omar", "2": "1003" },
            buttons: [
                { type: "URL", text: "Write a Review", url: "https://example.com/review/{{2}}" }
            ]
        }
    },
    {
        id: "int-4",
        name: "تأكيد الطلب",
        category: "UTILITY",
        language: "ar",
        template: {
            headerType: "TEXT",
            headerText: "تم تأكيد طلبك! ✅",
            bodyText: "مرحباً {{1}}، شكراً لطلبك رقم #{{2}}. نحن نقوم الآن بتجهيزه وسنقوم بإعلامك قريباً.",
            footerText: "شكراً لاختيارك لنا.",
            examples: { "1": "أحمد", "2": "1001" },
            buttons: [
                { type: "URL", text: "عرض الطلب", url: "https://example.com/order/{{2}}" }
            ]
        }
    },
    {
        id: "int-5-ar",
        name: "تأكيد الطلب مع الإجراءات",
        category: "UTILITY",
        language: "ar",
        template: {
            headerType: "TEXT",
            headerText: "تأكيد طلبك 🛒",
            bodyText:
                "مرحباً {{1}}، طلبك رقم #{{2}} جاهز للتأكيد. يرجى اختيار الإجراء المناسب أدناه.",
            footerText: "يمكنك تغيير اختيارك في أي وقت قبل المعالجة.",
            examples: {
                "1": "أحمد",
                "2": "1001"
            },
            buttons: [
                {
                    type: "CUSTOM",
                    text: "تأكيد الطلب",
                    payload: "CONFIRM_ORDER"
                },
                {
                    type: "CUSTOM",
                    text: "إلغاء الطلب",
                    payload: "CANCEL_ORDER"
                },
                {
                    type: "CUSTOM",
                    text: "تأجيل الطلب",
                    payload: "DELAY_ORDER"
                }
            ]
        }
    }
];

export function InternalTemplateDialog({ open, onOpenChange, onSelectTemplate }) {
    const [searchTerm, setSearchTerm] = useState("");
    // const [selectedCategory, setSelectedCategory] = useState("UTILITY");
    const [selectedLanguage, setSelectedLanguage] = useState("ar");
    const locale = useLocale();

    const filteredTemplates = useMemo(() => {
        return INTERNAL_MOCK_TEMPLATES.filter(tpl => {
            const matchesSearch = tpl.name.toLowerCase().includes(searchTerm.toLowerCase());
            const matchesLang = tpl.language === selectedLanguage;
            // const matchesCat = tpl.category === selectedCategory;
            return matchesSearch && matchesLang;
        });
    }, [searchTerm, selectedLanguage]);
    console.log(filteredTemplates)
    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-[90vw] md:max-w-[1200px] h-[85vh] p-0 flex flex-col rounded-2xl overflow-hidden bg-background">
                <DialogHeader className="p-6 border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0f1117] flex-shrink-0 space-y-4">
                    <DialogTitle className="text-xl font-bold flex items-center gap-2 text-foreground">
                        <Layout className="w-6 h-6 text-primary" />
                        قوالب النظام الداخلية
                    </DialogTitle>

                    <div className="flex flex-wrap md:flex-nowrap gap-4 items-center">
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

                        {/* <div className="flex bg-[#fafafa] dark:bg-slate-800/50 rounded-xl p-1 border border-gray-200 dark:border-slate-700">
                            {INTERNAL_CONFIG.CATEGORIES.map(cat => (
                                <button
                                    key={cat.id}
                                    onClick={() => setSelectedCategory(cat.id)}
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
                        </div> */}
                    </div>
                </DialogHeader>

                <div className="flex-1 bg-[#f6f6f7] dark:bg-[#13161f] p-6 overflow-y-auto">
                    {filteredTemplates.length === 0 ? (
                        <div className="flex flex-col items-center justify-center h-full text-slate-400">
                            <Tag className="w-12 h-12 mb-4 opacity-20" />
                            <p>لا توجد قوالب تطابق معايير البحث.</p>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
                            {filteredTemplates.map(template => (
                                <div key={template.id} className="relative group flex flex-col bg-white dark:bg-card border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden shadow-sm hover:shadow-md transition-shadow">
                                    <div className="flex-1 flex justify-center border-b border-slate-100 dark:border-slate-800  relative min-h-[400px]">
                                        <TemplatePreview
                                            flat
                                            hasHeader={false}
                                            template={{
                                                ...template.template,
                                                language: template.language
                                            }}
                                        />
                                    </div>

                                    <div className="p-4 flex items-center justify-between">
                                        <div>
                                            <h3 className="font-bold text-sm text-foreground">{template.name}</h3>
                                            <p className="text-xs text-slate-500 mt-1">{template.category}</p>
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
            </DialogContent>
        </Dialog>
    );
}
