"use client";

import React, { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { ChevronRight, ChevronDown, Database, Hash, User, Phone, MapPin, DollarSign, Package, Tag, Activity, Store } from "lucide-react";
import { cn } from "@/utils/cn";

export const ORDER_PROPERTIES = [
    { id: "orderNumber", label: "رقم الطلب", icon: Hash, example: "ORD-123", path: "orderNumber" },
    { id: "customerName", label: "اسم العميل", icon: User, example: "أحمد محمد", path: "customerName" },
    { id: "phoneNumber", label: "رقم الجوال", icon: Phone, example: "01023459658", path: "phoneNumber" },
    { id: "secondPhoneNumber", label: "رقم الجوال الثاني", icon: Phone, example: "01245234569", path: "phoneNumber" },
    { id: "address", label: "العنوان", icon: MapPin, example: "شارع الملك فهد، الرياض", path: "address" },
    { id: "city", label: "المدينة", icon: Activity, example: "الرياض", path: "city" },
    { id: "area", label: "الحي", icon: MapPin, example: "حي الملقا", path: "area" },
    { id: "landmark", label: "العلامة المميزة", icon: Database, example: "بجاني مسجد النور", path: "landmark" },
    { id: "deposit", label: "المدفوع", icon: DollarSign, example: "100", path: "deposit" },
    { id: "productsTotal", label: "إجمالي المنتجات", icon: DollarSign, example: "500", path: "productsTotal" },
    { id: "shippingCost", label: "تكلفة الشحن", icon: DollarSign, example: "30", path: "shippingCost" },
    { id: "discount", label: "الخصم", icon: Tag, example: "50", path: "discount" },
    { id: "finalTotal", label: "الإجمالي النهائي", icon: DollarSign, example: "480", path: "finalTotal" },
    { id: "status.name", label: "حالة الطلب", icon: Activity, example: "قيد التنفيذ", path: "status.name" },
    { id: "store.name", label: "المتجر", icon: Store, example: "Shopify", path: "store.name" },
    { id: "shippingCompany.name", label: "شركة الشحن", icon: Store, example: "Turbo", path: "shippingCompany.name" },
    { id: "paymentMethod", label: "طريقة الدفع", icon: Tag, example: "الدفع بالكارت", path: "paymentMethod" },
    { id: "paymentStatus", label: "حالة الدفع", icon: Activity, example: "تم الدفع", path: "paymentStatus" },
    { id: "trackingNumber", label: "رقم التتبع", icon: Hash, example: "1234567890", path: "trackingNumber" },
    { id: "shippedAt", label: "تاريخ الشحن", icon: Activity, example: "2023-12-12", path: "shippedAt" },
    { id: "deliveredAt", label: "تاريخ التوصيل", icon: Activity, example: "2023-12-12", path: "deliveredAt" },
    { id: "created_at", label: "تاريخ إنشاء الطلب", icon: Activity, example: "2023-12-12", path: "created_at" },
    { id: "allowOpenPackage", label: "السماح بفتح الطلب", icon: Activity, example: "نعم", path: "allowOpenPackage" },
    {
        id: "items", label: "المنتجات", icon: Package, children: [
            { id: "items[0].productName", label: "اسم المنتج", icon: Package, example: "ساعة ذكية", path: "items[0].productName" },
            { id: "items[0].sku", label: "رمز المنتج (SKU)", icon: Hash, example: "SKU-001", path: "items[0].sku" },
            { id: "items[0].quantity", label: "الكمية", icon: Package, example: "2", path: "items[0].quantity" },
            { id: "items[0].price", label: "السعر", icon: DollarSign, example: "250", path: "items[0].price" },
            { id: "items[0].unitCost", label: "سعر الجملة", icon: DollarSign, example: "250", path: "items[0].unitCost" },
            { id: "items[0].lineTotal", label: "الإجمالي", icon: DollarSign, example: "500", path: "items[0].lineTotal" }
        ]
    }
];

export function OrderPropertySelector({ open, onOpenChange, onSelect }) {
    const [expanded, setExpanded] = useState({ items: true, status: true, store: true });

    const toggleExpand = (id) => {
        setExpanded(prev => ({ ...prev, [id]: !prev[id] }));
    };

    const renderNode = (node, level = 0) => {
        const hasChildren = node.children && node.children.length > 0;
        const isExpanded = expanded[node.id];

        return (
            <div key={node.id} className="select-none">
                <div
                    onClick={() => hasChildren ? toggleExpand(node.id) : onSelect(node)}
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

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-md p-0 overflow-hidden rounded-3xl border-none shadow-2xl bg-white dark:bg-slate-900">
                <DialogHeader className="p-6 border-b dark:border-slate-800">
                    <DialogTitle className="text-xl font-bold flex items-center gap-2">
                        <Database className="text-primary" size={24} />
                        اختيار حقل من الطلب
                    </DialogTitle>
                </DialogHeader>
                <div className="p-4 max-h-[60vh] overflow-y-auto custom-scrollbar">
                    <div className="space-y-1">
                        {ORDER_PROPERTIES.map(prop => renderNode(prop))}
                    </div>
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
