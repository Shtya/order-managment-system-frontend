"use client";

import React, { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { ChevronRight, ChevronDown, Database, Hash, User, Phone, MapPin, DollarSign, Package, Tag, Activity, Store } from "lucide-react";
import { cn } from "@/utils/cn";
import { useTranslations } from "next-intl";


export function OrderPropertySelector({ open, onOpenChange, onSelect }) {
    const [expanded, setExpanded] = useState({ items: true, status: true, store: true });
     const t = useTranslations("whatsApp.automations.builder.orderProperties");

     const ORDER_PROPERTIES = [
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
    { id: "shippingCompany.name", label: t("shippingCompany"), icon: Store, example: t("examples.shippingCompany"), path: "shippingCompany.name" },
    { id: "paymentMethod", label: t("paymentMethod"), icon: Tag, example: t("examples.paymentMethod"), path: "paymentMethod" },
    { id: "paymentStatus", label: t("paymentStatus"), icon: Activity, example: t("examples.paymentStatus"), path: "paymentStatus" },
    { id: "trackingNumber", label: t("trackingNumber"), icon: Hash, example: t("examples.trackingNumber"), path: "trackingNumber" },
    { id: "shippedAt", label: t("shippedAt"), icon: Activity, example: t("examples.shippedAt"), path: "shippedAt" },
    { id: "deliveredAt", label: t("deliveredAt"), icon: Activity, example: t("examples.deliveredAt"), path: "deliveredAt" },
    { id: "created_at", label: t("created_at"), icon: Activity, example: t("examples.created_at"), path: "created_at" },
    { id: "allowOpenPackage", label: t("allowOpenPackage"), icon: Activity, example: t("examples.allowOpenPackage"), path: "allowOpenPackage" },
    {
        id: "items", label: t("items"), icon: Package, children: [
            { id: "items[].variant.product.name", label: t("productName"), icon: Package, example: t("examples.productName"), path: "items[].variant.product.name" },
            { id: "items[].variant.sku", label: t("sku"), icon: Hash, example: t("examples.sku"), path: "items[].variant.sku" },
            { id: "items[].quantity", label: t("quantity"), icon: Package, example: t("examples.quantity"), path: "items[].quantity" },
            { id: "iitems[].unitPrice", label: t("price"), icon: DollarSign, example: t("examples.price"), path: "iitems[].unitPrice" },
            { id: "items[].unitCost", label: t("unitCost"), icon: DollarSign, example: t("examples.unitCost"), path: "items[].unitCost" },
            { id: "items[].lineTotal", label: t("lineTotal"), icon: DollarSign, example: t("examples.lineTotal"), path: "items[].lineTotal" }
        ]
    },
    {
        id: "items", label: t("firstitems"), icon: Package, children: [
            { id: "items[0].variant.product.name", label: t("productName"), icon: Package, example: t("examples.productName"), path: "items[0].variant.product.name" },
            { id: "items[0].variant.sku", label: t("sku"), icon: Hash, example: t("examples.sku"), path: "items[0].variant.sku" },
            { id: "items[0].quantity", label: t("quantity"), icon: Package, example: t("examples.quantity"), path: "items[0].quantity" },
            { id: "iitems[0].unitPrice", label: t("price"), icon: DollarSign, example: t("examples.price"), path: "iitems[0].unitPrice" },
            { id: "items[0].unitCost", label: t("unitCost"), icon: DollarSign, example: t("examples.unitCost"), path: "items[0].unitCost" },
            { id: "items[0].lineTotal", label: t("lineTotal"), icon: DollarSign, example: t("examples.lineTotal"), path: "items[0].lineTotal" }
        ]
    },
    {
        id: "items", label: t("lastitems"), icon: Package, children: [
            { id: "items[-1].variant.product.name", label: t("productName"), icon: Package, example: t("examples.productName"), path: "items[-1].variant.product.name" },
            { id: "items[-1].variant.sku", label: t("sku"), icon: Hash, example: t("examples.sku"), path: "items[-1].variant.sku" },
            { id: "items[-1].quantity", label: t("quantity"), icon: Package, example: t("examples.quantity"), path: "items[-1].quantity" },
            { id: "iitems[-1].unitPrice", label: t("price"), icon: DollarSign, example: t("examples.price"), path: "iitems[-1].unitPrice" },
            { id: "items[-1].unitCost", label: t("unitCost"), icon: DollarSign, example: t("examples.unitCost"), path: "items[-1].unitCost" },
            { id: "items[-1].lineTotal", label: t("lineTotal"), icon: DollarSign, example: t("examples.lineTotal"), path: "items[-1].lineTotal" }
        ]
    }
]; 


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
                         {t('title')}
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
