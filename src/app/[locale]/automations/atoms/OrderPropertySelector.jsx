"use client";

import { useState, useMemo, useCallback } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import {
    ChevronRight, ChevronDown, Database, Hash, User, Phone, MapPin,
    DollarSign, Package, Tag, Activity, Store, Globe, Building2, Mail, Calendar
} from "lucide-react";
import { cn } from "@/utils/cn";
import { useTranslations, useLocale } from "next-intl";
import { CompactDateConfig, DEFAULT_DATE_FORMATS, formatDateWithFormat, getNaturalDayName } from "@/components/ui/dateConfig";

export { DEFAULT_DATE_FORMATS, formatDateWithFormat, getNaturalDayName };

export function useOrderProperties(customOverrides = {}) {
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
                    label: t("dateConfig.title"),
                    icon: Calendar,
                    path: "global.date.0.DD-MM-YYYY",
                    type: "date",
                    requiresConfig: true,
                    defaultOffset: 0,
                    defaultFormat: "DD-MM-YYYY",
                    formats: DEFAULT_DATE_FORMATS,
                    ...customOverrides,
                    configLabels: {
                        title: t("dateConfig.title"),
                        subtitle: t("dateConfig.subtitle"),
                        relativeTitle: t("dateConfig.relativeTitle"),
                        formatTitle: t("dateConfig.formatTitle"),
                        offset: t("dateConfig.offset"),
                        format: t("dateConfig.format"),
                        today: t("dateConfig.today"),
                        twoDaysBefore: t("dateConfig.twoDaysBefore"),
                        yesterday: t("dateConfig.yesterday"),
                        sendDate: t("dateConfig.sendDate"),
                        tomorrow: t("dateConfig.tomorrow"),
                        twoDaysAfter: t("dateConfig.twoDaysAfter"),
                        preview: t("dateConfig.preview"),
                        localeDisplayedInArabic: t("dateConfig.localeDisplayedInArabic"),
                        localeDisplayedInEnglish: t("dateConfig.localeDisplayedInEnglish"),
                        insert: t("dateConfig.insert"),
                        insertDate: t("dateConfig.insertDate"),
                        back: t("dateConfig.back"),
                        ...(customOverrides?.configLabels || {}),
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

export function OrderPropertySelector({
    open,
    onOpenChange,
    onSelect,
    customProperties,
    customFormats,
    configLabels: propLabels,
    renderInput,
    renderConfigPanel,
    onConfigChange,
}) {
    const [expanded, setExpanded] = useState({ orderData: true, globalData: true, itemsAll: true, itemsFirst: true, itemsLast: true });
    const [configNode, setConfigNode] = useState(null);
    const [dateOffset, setDateOffset] = useState(0);
    const [dateFormat, setDateFormat] = useState("DD-MM-YYYY");
    const t = useTranslations("whatsApp.automations.builder.orderProperties");
    const locale = useLocale();
    const baseProperties = useOrderProperties(propLabels ? { configLabels: propLabels } : undefined);
    const orderProperties = customProperties ?? baseProperties;

    const activeFormats = useMemo(() => {
        return customFormats ?? configNode?.formats ?? DEFAULT_DATE_FORMATS;
    }, [customFormats, configNode]);

    const activeLabels = useMemo(() => {
        const defaults = {
            title: t("dateConfig.title"),
            subtitle: t("dateConfig.subtitle"),
            relativeTitle: t("dateConfig.relativeTitle"),
            formatTitle: t("dateConfig.formatTitle"),
            offset: t("dateConfig.offset"),
            format: t("dateConfig.format"),
            today: t("dateConfig.today"),
            twoDaysBefore: t("dateConfig.twoDaysBefore"),
            yesterday: t("dateConfig.yesterday"),
            sendDate: t("dateConfig.sendDate"),
            tomorrow: t("dateConfig.tomorrow"),
            twoDaysAfter: t("dateConfig.twoDaysAfter"),
            preview: t("dateConfig.preview"),
            localeDisplayedInArabic: t("dateConfig.localeDisplayedInArabic"),
            localeDisplayedInEnglish: t("dateConfig.localeDisplayedInEnglish"),
            insert: t("dateConfig.insert"),
            insertDate: t("dateConfig.insertDate"),
            back: t("dateConfig.back"),
        };
        return { ...defaults, ...(configNode?.configLabels || {}), ...(propLabels || {}) };
    }, [t, configNode, propLabels]);

    const toggleExpand = useCallback((id) => {
        setExpanded(prev => ({ ...prev, [id]: !prev[id] }));
    }, []);

    const handleOffsetChange = useCallback((next) => {
        const safe = Number.isFinite(next) ? next : 0;
        setDateOffset(safe);
        onConfigChange?.({ offset: safe, format: dateFormat });
    }, [dateFormat, onConfigChange]);

    const handleFormatChange = useCallback((next) => {
        setDateFormat(next);
        onConfigChange?.({ offset: dateOffset, format: next });
    }, [dateOffset, onConfigChange]);

    const handleNodeClick = useCallback((node) => {
        if (node.children && node.children.length > 0) {
            toggleExpand(node.id);
            return;
        }
        if (node.requiresConfig) {
            setDateOffset(node.defaultOffset ?? 0);
            setDateFormat(node.defaultFormat ?? (customFormats?.[0] ?? DEFAULT_DATE_FORMATS[0]));
            setConfigNode(node);
            return;
        }
        onSelect(node);
    }, [toggleExpand, onSelect, customFormats]);

    const handleConfirmConfig = useCallback(() => {
        if (!configNode) return;
        const token = `global.date.${dateOffset}.${dateFormat}`;
        onSelect({ ...configNode, id: token, path: token });
        setConfigNode(null);
    }, [configNode, dateOffset, dateFormat, onSelect]);

    const renderNode = useCallback((node, level = 0) => {
        const hasChildren = node.children && node.children.length > 0;
        const isExpanded = expanded[node.id];

        const defaultRender = (
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
                        {node.icon ? (
                            <node.icon size={18} className={cn("shrink-0", hasChildren ? "text-slate-400" : "text-primary")} />
                        ) : (
                            <span className="flex h-[18px] w-[18px] shrink-0 items-center justify-center rounded-[4px] bg-[var(--primary)] text-[10px] font-bold text-white">
                                {node.label?.[0]?.toUpperCase() ?? "•"}
                            </span>
                        )}
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

        if (typeof renderInput === "function" && !hasChildren) {
            return renderInput({ node, level, isExpanded, onClick: () => handleNodeClick(node), expanded }, defaultRender);
        }
        return defaultRender;
    }, [expanded, handleNodeClick, renderInput]);

    const previewDate = useMemo(() => {
        const d = new Date();
        d.setDate(d.getDate() + dateOffset);
        return formatDateWithFormat(d, dateFormat, locale);
    }, [dateOffset, dateFormat, locale]);

    const renderDateConfigPanel = () => {
        if (typeof renderConfigPanel === "function") {
            return renderConfigPanel({
                labels: activeLabels,
                dateOffset,
                dateFormat,
                formats: activeFormats,
                locale,
                onOffsetChange: handleOffsetChange,
                onFormatChange: handleFormatChange,
                onConfirm: handleConfirmConfig,
                onBack: () => setConfigNode(null),
                previewDate,
            });
        }

        return (
            <CompactDateConfig
                configNode={configNode}
                dateOffset={dateOffset}
                dateFormat={dateFormat}
                locale={locale}
                formats={activeFormats}
                onBack={() => setConfigNode(null)}
                onOffsetChange={handleOffsetChange}
                onFormatChange={handleFormatChange}
                onConfirm={handleConfirmConfig}
            />
        );
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-lg p-0 overflow-hidden rounded-[2rem] md:rounded-[2.5rem] border-none shadow-2xl bg-white dark:bg-slate-900">
                <DialogHeader className="p-6 md:p-7 border-b border-slate-100 dark:border-slate-800">
                    <DialogTitle className="text-xl md:text-2xl font-black flex items-center justify-start gap-2 text-slate-800 dark:text-slate-100">
                        {configNode ? (
                            <>
                                <Calendar className="text-primary" size={26} />
                                <span className="text-primary">{configNode.label}</span>
                            </>
                        ) : (
                            <>
                                <Database className="text-primary" size={26} />
                                <span>{t('title')}</span>
                            </>
                        )}
                    </DialogTitle>
                    {configNode && (
                        <p className="text-center text-xs md:text-sm text-slate-400 mt-2 font-bold">
                            {activeLabels.subtitle}
                        </p>
                    )}
                </DialogHeader>
                <div className="p-4 md:p-6 max-h-[75vh] overflow-y-auto custom-scrollbar">
                    {configNode ? (
                        renderDateConfigPanel()
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
