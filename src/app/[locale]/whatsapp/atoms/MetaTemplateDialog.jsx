
"use client";

import React, { useState, useMemo } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button"; // Assuming standard shadcn/ui button
import { Search, Globe, Tag, ChevronRight, Wand2 } from "lucide-react";
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
import { Checkbox } from "@/components/ui/checkbox";
import { ChevronDown } from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";

export const META_TEMPLATE_CONFIG = {
    CATEGORIES: [
        { id: "MARKETING", label: "تسويق (Marketing)" },
        { id: "UTILITY", label: "خدمة (Utility)" },
        { id: "AUTHENTICATION", label: "مصادقة (Authentication)" }
    ],
    SUB_CATEGORIES: {
        MARKETING: [
            {
                id: "ACCOUNT_PROTECTION",
                label: "Account or product protection",
                items: [
                    { id: "FRAUD_AWARENESS", label: "Fraud awareness", count: 1 },
                    { id: "PRODUCT_RECALLS", label: "Product recalls", count: 1 },
                    { id: "WARRANTY_ALERTS", label: "Warranty alerts", count: 1 }
                ]
            },
            {
                id: "ACCOUNT_UPDATES",
                label: "Account updates",
                items: [
                    { id: "ACCOUNT_INFO", label: "Account info", count: 2 },
                    { id: "BILLING_UPDATE", label: "Billing update", count: 1 }
                ]
            },
            {
                id: "CALL_PERMISSIONS",
                label: "Call permissions",
                items: [
                    { id: "CALL_OPT_IN", label: "Call opt-in", count: 1 }
                ]
            }
        ],
        UTILITY: [
            {
                id: "ORDER_MANAGEMENT",
                label: "Order management",
                items: [
                    { id: "ORDER_CONFIRMATION", label: "Order confirmation", count: 5 },
                    { id: "ORDER_STATUS", label: "Order status", count: 3 }
                ]
            }
        ],
        AUTHENTICATION: [
            {
                id: "SECURITY",
                label: "Security",
                items: [
                    { id: "OTP", label: "OTP", count: 10 }
                ]
            }
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
        name: "fraud_alert_01",
        category: "MARKETING",
        subCategory: "FRAUD_AWARENESS",
        language: "en_US",
        template: {
            headerType: "TEXT",
            headerText: "Security Alert ⚠️",
            bodyText:
                "Hello {{1}}, we detected a login attempt from {{2}}. If this wasn't you, please reset your password.",
            footerText: "Protect your account.",
            examples: {
                "1": "John Doe",
                "2": "Cairo, Egypt"
            },
            buttons: [
                {
                    type: "VISIT_WEBSITE",
                    text: "Reset Password",
                    url: "https://example.com/reset"
                }
            ]
        }
    },
    {
        id: "2",
        name: "order_confirmation_v2",
        category: "UTILITY",
        subCategory: "ORDER_CONFIRMATION",
        language: "en_US",
        template: {
            headerType: "IMAGE",
            headerUrl:
                "https://ix-marketing.imgix.net/autocompress.png?auto=format,compress&w=1946",
            bodyText:
                "Hi {{1}}, your order #{{2}} is confirmed! We will notify you when it ships.",
            footerText: "Thank you for shopping with us.",
            examples: {
                "1": "John Doe",
                "2": "ORD-12345"
            },
            buttons: [
                {
                    type: "CUSTOM",
                    text: "Confirm Order"
                },
                {
                    type: "CUSTOM",
                    text: "Cancel Order"
                },
                {
                    type: "CUSTOM",
                    text: "Delay Order"
                }
            ]
        }
    },

    {
        id: "3",
        name: "ramadan_greeting_ar",
        category: "MARKETING",
        subCategory: "PROMOTION",
        language: "ar",
        template: {
            headerType: "TEXT",
            headerText: "مبارك عليكم الشهر 🌙",
            bodyText:
                "أهلاً {{1}}، يسعدنا أن نقدم لك خصم {{2}}% على كافة المنتجات بمناسبة شهر رمضان المبارك.",
            footerText: "تطبق الشروط والأحكام.",
            examples: {
                "1": "أحمد محمد",
                "2": "20"
            },
            buttons: [
                {
                    type: "VISIT_WEBSITE",
                    text: "تسوق الآن",
                    url: "https://example.com"
                }
            ]
        }
    },

    // =========================
    // AUTHENTICATION (EN)
    // =========================
    {
        id: "4",
        name: "auth_security_en",
        category: "AUTHENTICATION",
        subCategory: "SECURITY",
        language: "en_US",
        template: {
            headerType: "TEXT",
            headerText: "Security Verification Code 🔐",
            bodyText:
                "Hi {{1}}, your verification code is {{2}}. It will expire in {{3}} minutes.",
            footerText: "Do not share this code with anyone.",
            examples: {
                "1": "John Doe",
                "2": "482910",
                "3": "5"
            },
            buttons: [
                {
                    type: "CUSTOM",
                    text: "Resend Code"
                }
            ]
        }
    },

    // =========================
    // AUTHENTICATION (AR)
    // =========================
    {
        id: "5",
        name: "auth_security_ar",
        category: "AUTHENTICATION",
        subCategory: "SECURITY",
        language: "ar",
        template: {
            headerType: "TEXT",
            headerText: "رمز التحقق الأمني 🔐",
            bodyText:
                "مرحباً {{1}}، رمز التحقق الخاص بك هو {{2}} وسينتهي خلال {{3}} دقائق.",
            footerText: "لا تشارك هذا الرمز مع أي شخص.",
            examples: {
                "1": "أحمد محمد",
                "2": "482910",
                "3": "5"
            },
            buttons: [
                {
                    type: "CUSTOM",
                    text: "إعادة إرسال الرمز"
                }
            ]
        }
    },

    // =========================
    // UTILITIES (AR)
    // =========================
    {
        id: "6",
        name: "invoice_reminder_ar",
        category: "UTILITY",
        subCategory: "BILLING",
        language: "ar",
        template: {
            headerType: "TEXT",
            headerText: "تذكير بالفاتورة 💳",
            bodyText:
                "مرحباً {{1}}، لديك فاتورة رقم {{2}} بقيمة {{3}} ريال مستحقة الدفع.",
            footerText: "يرجى السداد في أقرب وقت.",
            examples: {
                "1": "أحمد علي",
                "2": "INV-1029",
                "3": "250"
            },
            buttons: [
                {
                    type: "VISIT_WEBSITE",
                    text: "دفع الفاتورة",
                    url: "https://example.com/pay/{{2}}"
                },
                {
                    type: "PHONE_NUMBER",
                    text: "الدعم",
                    phoneNumber: "+201234567890"
                }
            ]
        }
    }
];


export function MetaTemplateDialog({ open, onOpenChange, onSelectTemplate }) {
    const [searchTerm, setSearchTerm] = useState("");
    const [selectedCategory, setSelectedCategory] = useState("MARKETING");
    const [selectedSubCategories, setSelectedSubCategories] = useState([]); // Array of IDs
    const [expandedGroups, setExpandedGroups] = useState({}); // { groupId: boolean }
    const [selectedLanguage, setSelectedLanguage] = useState("ar");
    const locale = useLocale();

    // Reset filters when category changes
    const handleCategoryChange = (catId) => {
        setSelectedCategory(catId);
        setSelectedSubCategories([]);
    };

    const toggleGroup = (groupId) => {
        setExpandedGroups(prev => ({ ...prev, [groupId]: !prev[groupId] }));
    };

    const toggleSubCategory = (subId) => {
        setSelectedSubCategories(prev =>
            prev.includes(subId)
                ? prev.filter(id => id !== subId)
                : [...prev, subId]
        );
    };

    // Filter templates based on selections
    const filteredTemplates = useMemo(() => {
        return MOCK_TEMPLATES.filter(tpl => {
            const matchesSearch = tpl.name.toLowerCase().includes(searchTerm.toLowerCase());
            const matchesLang = tpl.language === selectedLanguage;
            const matchesCat = tpl.category === selectedCategory;
            const matchesSub = selectedSubCategories.length === 0 || selectedSubCategories.includes(tpl.subCategory);


            return matchesSearch && matchesLang && matchesCat && matchesSub;
        });
    }, [searchTerm, selectedLanguage, selectedCategory, selectedSubCategories]);

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
                                className="rounded-xl h-[50px] bg-[#fafafa] dark:bg-slate-800/50 border-gray-200 dark:border-slate-700 focus:ring-2 focus:ring-primary/20"
                                style={{ paddingLeft: locale === "ar" ? "10px" : "45px", paddingRight: locale === "ar" ? "45px" : "10px" }}
                            />
                        </div>

                        {/* Language */}
                        <div className="flex-shrink-0">
                            <Select value={selectedLanguage} onValueChange={setSelectedLanguage}>
                                <SelectTrigger className="w-[180px] h-[50px] rounded-xl bg-[#fafafa] dark:bg-slate-800/50 border-gray-200 dark:border-slate-700">
                                    <div className="flex items-center gap-2">
                                        <Globe className="w-4 h-4 text-slate-400" />
                                        <SelectValue placeholder="اختر اللغة" />
                                    </div>
                                </SelectTrigger>
                                <SelectContent>
                                    {META_TEMPLATE_CONFIG.LANGUAGES.map(lang => (
                                        <SelectItem key={lang.id} value={lang.id}>
                                            {lang.label}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
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
                    <div className="w-72 border-l border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0f1117] flex-shrink-0 overflow-y-auto p-4 flex flex-col gap-2">
                        <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-4 px-2">الفئات الفرعية</h4>

                        {META_TEMPLATE_CONFIG.SUB_CATEGORIES[selectedCategory].map(group => {
                            const isExpanded = expandedGroups[group.id];
                            return (
                                <div key={group.id} className="flex flex-col gap-1">
                                    {/* Group Header */}
                                    <button
                                        onClick={() => toggleGroup(group.id)}
                                        className={cn(
                                            "flex items-center justify-between px-4 py-2.5 rounded-xl text-sm font-bold transition-all w-full text-right bg-slate-50/50 dark:bg-slate-800/30 border border-transparent",
                                            isExpanded && "border-slate-200 dark:border-slate-700"
                                        )}
                                    >
                                        <span className="text-slate-800 dark:text-slate-200">{group.label}</span>
                                        <ChevronDown className={cn("w-4 h-4 transition-transform duration-200", isExpanded && "rotate-180")} />
                                    </button>

                                    {/* Sub-items (Checkboxes) */}
                                    <AnimatePresence>
                                        {isExpanded && (
                                            <motion.div
                                                initial={{ height: 0, opacity: 0 }}
                                                animate={{ height: "auto", opacity: 1 }}
                                                exit={{ height: 0, opacity: 0 }}
                                                className="overflow-hidden flex flex-col gap-1 mt-1 pr-2"
                                            >
                                                {group.items.map(item => (
                                                    <div
                                                        key={item.id}
                                                        onClick={() => toggleSubCategory(item.id)}
                                                        className="flex items-center gap-3 px-4 py-2 hover:bg-slate-50 dark:hover:bg-slate-800/50 rounded-lg cursor-pointer transition-colors group"
                                                    >
                                                        <Checkbox
                                                            checked={selectedSubCategories.includes(item.id)}
                                                            className="data-[state=checked]:bg-primary data-[state=checked]:border-primary"
                                                        />
                                                        <span className="text-sm text-slate-600 dark:text-slate-400 group-hover:text-slate-900 dark:group-hover:text-slate-200">
                                                            {item.label} ({item.count})
                                                        </span>
                                                    </div>
                                                ))}
                                            </motion.div>
                                        )}
                                    </AnimatePresence>
                                </div>
                            );
                        })}
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
                                    <div key={template.id} className="relative group flex flex-col bg-white dark:bg-card border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden">

                                        {/* Template Preview Component Wrapper */}
                                        <div className="flex-1 flex justify-center border-b border-slate-100 dark:border-slate-800 relative min-h-[400px]">
                                            <TemplatePreview
                                                flat
                                                hasHeader={false}
                                                template={{
                                                    ...template.template,
                                                    language: template.language,
                                                    subcategory: template.subCategory
                                                }}
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