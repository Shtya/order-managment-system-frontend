"use client";

import React, { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { ChevronRight, ChevronDown, Database, Hash, User, Phone, MapPin, DollarSign, Package, Tag, Activity, Store, Globe, Building2, Mail, Calendar } from "lucide-react";
import { cn } from "@/utils/cn";
import { useTranslations, useLocale } from "next-intl";
import { Button } from "@/components/ui/button";

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

function formatDateWithFormat(date, format, lang = "en") {
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

export function useOrderProperties() {
    const t = useTranslations("whatsApp.automations.builder.orderProperties");
    const ORDER_PROPERTIES = [
        {
            id: "orderData", label: t("orderData"), icon: Package, children: [
                { id: "orderNumber", label: t("orderNumber"), icon: Hash, example: t("examples.orderNumber"), path: "orderNumber" },
                { id: "customerName", label: t("customerName"), icon: User, example: t("examples.customerName"), path: "customerName" },
                { id: "phoneNumber", label: t("phoneNumber"), icon: Phone, example: t("examples.phoneNumber"), path: "phoneNumber" },
                { id: "secondPhoneNumber", label: t("secondPhoneNumber"), icon: Phone, example: t("examples.secondPhoneNumber"), path: "phoneNumber" },
                { id: "address", label: t("address"), icon: MapPin, example: t("examples.address"), path: "address" },
                { id: "city", label: t("city"), icon: Activity, example: t("examples.city"), path: "city" },
                { id: "area", label: t("area"), icon: MapPin, example: t("examples.area"), path: "area" },
                { id: "landmark", label: t("landmark"), icon: Database, example: t("examples.landmark"), path: "landmark" },
                { id: "deposit", label: t("deposit"), icon: DollarSign, example: t("examples.deposit"), path: "deposit" },
                { id: "productsTotal", label: t("productsTotal"), icon: DollarSign, example: t("examples.productsTotal"), path: "productsTotal" },
                { id: "shippingCost", label: t("shippingCost"), icon: DollarSign, example: t("examples.shippingCost"), path: "shippingCost" },
                { id: "discount", label: t("discount"), icon: Tag, example: t("examples.discount"), path: "discount" },
                { id: "finalTotal", label: t("finalTotal"), icon: DollarSign, example: t("examples.finalTotal"), path: "finalTotal" },
                { id: "status.name", label: t("status"), icon: Activity, example: t("examples.status"), path: "status.name" },
                { id: "store.name", label: t("store"), icon: Store, example: t("examples.store"), path: "store.name" },
                { id: "paymentMethod", label: t("paymentMethod"), icon: Tag, example: t("examples.paymentMethod"), path: "paymentMethod" },
                { id: "paymentStatus", label: t("paymentStatus"), icon: Activity, example: t("examples.paymentStatus"), path: "paymentStatus" },
                { id: "shippingCompany.name", label: t("shippingCompany"), icon: Store, example: t("examples.shippingCompany"), path: "shippingCompany.name" },
                { id: "trackingNumber", label: t("trackingNumber"), icon: Hash, example: t("examples.trackingNumber"), path: "trackingNumber" },
                { id: "shippedAt", label: t("shippedAt"), icon: Activity, example: t("examples.shippedAt"), path: "shippedAt" },
                { id: "deliveredAt", label: t("deliveredAt"), icon: Activity, example: t("examples.deliveredAt"), path: "deliveredAt" },
                { id: "created_at", label: t("created_at"), icon: Activity, example: t("examples.created_at"), path: "created_at" },
                { id: "allowOpenPackage", label: t("allowOpenPackage"), icon: Activity, example: t("examples.allowOpenPackage"), path: "allowOpenPackage" },
                { id: "rejectReason", label: t("rejectReason"), icon: Tag, example: t("examples.rejectReason"), path: "rejectReason" },
                { id: "rejectedAt", label: t("rejectedAt"), icon: Activity, example: t("examples.rejectedAt"), path: "rejectedAt" },
                { id: "postponedDate", label: t("postponedDate"), icon: Activity, example: t("examples.postponedDate"), path: "postponedDate" },
                { id: "returnedAt", label: t("returnedAt"), icon: Activity, example: t("examples.returnedAt"), path: "returnedAt" },
                { id: "customerNotes", label: t("customerNotes"), icon: Tag, example: t("examples.customerNotes"), path: "customerNotes" },
                { id: "duplicateCount", label: t("duplicateCount"), icon: Tag, example: t("examples.duplicateCount"), path: "duplicateCount" },
                { id: "originalOrderNumber", label: t("originalOrderNumber"), icon: Tag, example: t("examples.originalOrderNumber"), path: "originalOrderNumber" },
                {
                    id: "itemsAll", label: t("items"), icon: Package, children: [
                        { id: "items[].variant.product.name", label: t("productName"), icon: Package, example: t("examples.productName"), path: "items[].variant.product.name" },
                        { id: "items[].variant.sku", label: t("sku"), icon: Hash, example: t("examples.sku"), path: "items[].variant.sku" },
                        { id: "items[].quantity", label: t("quantity"), icon: Package, example: t("examples.quantity"), path: "items[].quantity" },
                        { id: "items[].unitPrice", label: t("price"), icon: DollarSign, example: t("examples.price"), path: "items[].unitPrice" },
                        { id: "items[].unitCost", label: t("unitCost"), icon: DollarSign, example: t("examples.unitCost"), path: "items[].unitCost" },
                        { id: "items[].lineTotal", label: t("lineTotal"), icon: DollarSign, example: t("examples.lineTotal"), path: "items[].lineTotal" }
                    ]
                },
                {
                    id: "itemsFirst", label: t("firstitems"), icon: Package, children: [
                        { id: "items[0].variant.product.name", label: t("productNameFirst"), icon: Package, example: t("examples.productName"), path: "items[0].variant.product.name" },
                        { id: "items[0].variant.sku", label: t("skuFirst"), icon: Hash, example: t("examples.sku"), path: "items[0].variant.sku" },
                        { id: "items[0].quantity", label: t("quantityFirst"), icon: Package, example: t("examples.quantity"), path: "items[0].quantity" },
                        { id: "items[0].unitPrice", label: t("priceFirst"), icon: DollarSign, example: t("examples.price"), path: "items[0].unitPrice" },
                        { id: "items[0].unitCost", label: t("unitCostFirst"), icon: DollarSign, example: t("examples.unitCost"), path: "items[0].unitCost" },
                        { id: "items[0].lineTotal", label: t("lineTotalFirst"), icon: DollarSign, example: t("examples.lineTotal"), path: "items[0].lineTotal" }
                    ]
                },
                {
                    id: "itemsLast", label: t("lastitems"), icon: Package, children: [
                        { id: "items[-1].variant.product.name", label: t("productNameLast"), icon: Package, example: t("examples.productName"), path: "items[-1].variant.product.name" },
                        { id: "items[-1].variant.sku", label: t("skuLast"), icon: Hash, example: t("examples.sku"), path: "items[-1].variant.sku" },
                        { id: "items[-1].quantity", label: t("quantityLast"), icon: Package, example: t("examples.quantity"), path: "items[-1].quantity" },
                        { id: "items[-1].unitPrice", label: t("priceLast"), icon: DollarSign, example: t("examples.price"), path: "items[-1].unitPrice" },
                        { id: "items[-1].unitCost", label: t("unitCostLast"), icon: DollarSign, example: t("examples.unitCost"), path: "items[-1].unitCost" },
                        { id: "items[-1].lineTotal", label: t("lineTotalLast"), icon: DollarSign, example: t("examples.lineTotal"), path: "items[-1].lineTotal" }
                    ]
                }
            ]
        },
        {
            id: "globalData", label: t("globalData"), icon: Globe, children: [
                { id: "global.brandName", label: t("brandName"), icon: Building2, example: t("examples.brandName"), path: "global.brandName" },
                {
                    id: "global.date.0.DD-MM-YYYY",
                    label: t("chooseDate"),
                    icon: Calendar,
                    path: "global.date.0.DD-MM-YYYY",
                    type: "date",
                    requiresConfig: true,
                    defaultOffset: 0,
                    defaultFormat: "DD-MM-YYYY",
                    formats: DEFAULT_DATE_FORMATS,
                    configLabels: {
                        title: t("dateConfig.title"),
                        offset: t("dateConfig.offset"),
                        format: t("dateConfig.format"),
                        today: t("dateConfig.today"),
                        insert: t("dateConfig.insert"),
                        back: t("dateConfig.back")
                    },
                    example: t("examples.date")
                },
                { id: "global.companyEmail", label: t("companyEmail"), icon: Mail, example: t("examples.companyEmail"), path: "global.companyEmail" },
                { id: "global.companyWebsite", label: t("companyWebsite"), icon: Globe, example: t("examples.companyWebsite"), path: "global.companyWebsite" },
                { id: "global.companyPhone", label: t("companyPhone"), icon: Phone, example: t("examples.companyPhone"), path: "global.companyPhone" },
                { id: "global.companyAddress", label: t("companyAddress"), icon: MapPin, example: t("examples.companyAddress"), path: "global.companyAddress" },
                { id: "global.companyCurrency", label: t("companyCurrency"), icon: DollarSign, example: t("examples.companyCurrency"), path: "global.companyCurrency" }
            ]
        }
    ];

    return ORDER_PROPERTIES;
}

export function OrderPropertySelector({ open, onOpenChange, onSelect }) {
    const [expanded, setExpanded] = useState({ orderData: true, globalData: true, itemsAll: true, itemsFirst: true, itemsLast: true });
    const [configNode, setConfigNode] = useState(null);
    const [dateOffset, setDateOffset] = useState(0);
    const [dateFormat, setDateFormat] = useState("DD-MM-YYYY");
    const t = useTranslations("whatsApp.automations.builder.orderProperties");
    const locale = useLocale();
    const orderProperties = useOrderProperties();

    const toggleExpand = (id) => {
        setExpanded(prev => ({ ...prev, [id]: !prev[id] }));
    };

    const handleNodeClick = (node) => {
        if (node.children && node.children.length > 0) {
            toggleExpand(node.id);
            return;
        }
        if (node.requiresConfig) {
            setDateOffset(node.defaultOffset ?? 0);
            setDateFormat(node.defaultFormat ?? DEFAULT_DATE_FORMATS[0]);
            setConfigNode(node);
            return;
        }
        onSelect(node);
    };

    const handleConfirmConfig = () => {
        if (!configNode) return;
        const token = `global.date.${dateOffset}.${dateFormat}`;
        onSelect({ ...configNode, id: token, path: token });
        setConfigNode(null);
    };

    const renderNode = (node, level = 0) => {
        const hasChildren = node.children && node.children.length > 0;
        const isExpanded = expanded[node.id];

        return (
            <div key={node.id} className="select-none">
                <div
                    onClick={() => handleNodeClick(node)}
                    className={cn(
                        "flex items-center gap-3 p-3 rounded-xl transition-all cursor-pointer group",
                        level > 0 ? "ms-6" : "",
                        hasChildren ? "hover:bg-slate-50 dark:hover:bg-slate-800/50" : "hover:bg-primary/5 hover:text-primary"
                    )}
                >
                    <div className="flex items-center gap-2 flex-1 min-w-0">
                        {hasChildren ? (
                            isExpanded ? <ChevronDown size={16} className="text-slate-400" /> : <ChevronRight size={16} className="text-slate-400" />
                        ) : (
                            <div className="w-4 h-4" />
                        )}
                        <node.icon size={18} className={cn("shrink-0", hasChildren ? "text-slate-400" : "text-primary")} />
                        <span className="text-sm font-bold truncate">{node.label}</span>
                        {!hasChildren && node.example && (
                            <span className="text-[10px] text-slate-400 font-medium truncate">({node.example})</span>
                        )}
                    </div>
                    {!hasChildren && (
                        <div className="opacity-0 group-hover:opacity-100 transition-opacity">
                            <Plus size={16} className="text-primary" />
                        </div>
                    )}
                </div>
                {hasChildren && isExpanded && (
                    <div className="mt-1">
                        {node.children.map(child => renderNode(child, level + 1))}
                    </div>
                )}
            </div>
        );
    };

    const labels = configNode?.configLabels || {};

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-md p-0 overflow-hidden rounded-3xl border-none shadow-2xl bg-white dark:bg-slate-900">
                <DialogHeader className="p-6 border-b dark:border-slate-800">
                    <DialogTitle className="text-xl font-bold flex items-center gap-2">
                        <Database className="text-primary" size={24} />
                        {configNode ? configNode.label : t('title')}
                    </DialogTitle>
                </DialogHeader>
                <div className="p-4 max-h-[60vh] overflow-y-auto custom-scrollbar">
                    {configNode ? (
                        <div className="space-y-4">
                            <div className="space-y-1">
                                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{labels.title}</p>
                                <div>
                                    <label className="block text-[11px] font-bold text-slate-500 mb-1">{labels.offset}</label>
                                    <input
                                        type="number"
                                        value={dateOffset}
                                        onChange={(e) => setDateOffset(parseInt(e.target.value || "0", 10))}
                                        className="w-full h-10 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 text-sm font-bold"
                                    />
                                </div>
                                <div>
                                    <label className="block text-[11px] font-bold text-slate-500 mb-1">{labels.format}</label>
                                    <select
                                        value={dateFormat}
                                        onChange={(e) => setDateFormat(e.target.value)}
                                        className="w-full h-10 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 text-sm font-bold"
                                    >
                                        {(configNode.formats || DEFAULT_DATE_FORMATS).map(f => (
                                            <option key={f} value={f}>{formatDateWithFormat(new Date(), f, locale)}</option>
                                        ))}
                                    </select>
                                </div>
                            </div>
                            <div className="flex gap-2">
                                <Button
                                    variant="ghost"
                                    onClick={() => setConfigNode(null)}
                                    className="flex-1 h-10 rounded-xl"
                                >
                                    {labels.back}
                                </Button>
                                <Button onClick={handleConfirmConfig} className="flex-1 h-10 rounded-xl bg-primary hover:bg-primary/90 text-white">
                                    {labels.insert}
                                </Button>
                            </div>
                        </div>
                    ) : (
                        <div className="space-y-1">
                            {orderProperties.map(prop => renderNode(prop))}
                        </div>
                    )}
                </div>
            </DialogContent>
        </Dialog>
    );
}

const Plus = ({ size, className }) => (
    <svg
        xmlns="http://www.w3.org/2000/svg"
        width={size}
        height={size}
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        className={className}
    >
        <path d="M5 12h14" />
        <path d="M12 5v14" />
    </svg>
);
