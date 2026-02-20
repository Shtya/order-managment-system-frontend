"use client";

import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
    ChevronLeft,
    Search,
    X,
    Plus,
    Trash2,
    Loader2,
    Package,
    Phone,
    MapPin,
    Calendar,
    User,
    ArrowLeftRight,
    Upload,
    ImageIcon,
    AlertTriangle,
    CheckCircle2,
    Minus,
    Hash,
    Truck,
    CreditCard,
    FileText,
    BarChart3,
    AlertCircle,
} from "lucide-react";
import { useTranslations } from "next-intl";
import { useRouter } from "@/i18n/navigation";
import toast from "react-hot-toast";
import { cn } from "@/utils/cn";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { ProductSkuSearchPopover } from "@/components/molecules/ProductSkuSearchPopover";
import { Button } from "@/components/ui/button";
import api from "@/utils/api";
import { ImageUploadBox } from "@/app/[locale]/products/new/page";
import Button_ from "@/components/atoms/Button";
import { avatarSrc } from "@/components/atoms/UserSelect";

// ─────────────────────────────────────────────
// ImageUploadBox helpers  (same as product page)
// ─────────────────────────────────────────────
const baseImg = process.env.NEXT_PUBLIC_API_URL?.replace(/\/+$/, "") ?? "";

let _imgIdCounter = 0;
function makeId() {
    return `img_${Date.now()}_${++_imgIdCounter}`;
}

// ─────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────
function hexToBg(hex, alpha = 0.1) {
    const r = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return r
        ? `rgba(${parseInt(r[1], 16)},${parseInt(r[2], 16)},${parseInt(r[3], 16)},${alpha})`
        : "transparent";
}

function formatCurrency(n) {
    return `${(Number(n) || 0).toLocaleString("ar-EG")} ج.م`;
}

function formatDate(d) {
    if (!d) return "—";
    return new Date(d).toLocaleDateString("ar-EG", {
        year: "numeric", month: "short", day: "numeric",
    });
}

// ─────────────────────────────────────────────
// Section wrapper — matches app theme
// ─────────────────────────────────────────────
function Section({ title, icon: Icon, children, className, delay = 0 }) {
    return (
        <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay }}
            className={cn(
                "bg-card rounded-2xl border border-border/60 shadow-sm",
                className
            )}
        >
            <div className="flex items-center gap-3 px-5 py-4 border-b border-border/40">
                <div className="w-8 h-8 rounded-xl bg-[color-mix(in_oklab,var(--primary)_10%,transparent)] border border-[color-mix(in_oklab,var(--primary)_20%,transparent)] flex items-center justify-center shrink-0">
                    <Icon size={15} className="text-[var(--primary)]" />
                </div>
                <h3 className="text-sm font-bold text-foreground">{title}</h3>
            </div>
            <div className="p-5">{children}</div>
        </motion.div>
    );
}

// ─────────────────────────────────────────────
// Field label + input style
// ─────────────────────────────────────────────
function FieldInput({ label, error, children }) {
    return (
        <div className="space-y-1.5">
            {label && <Label className="text-xs font-semibold text-muted-foreground">{label}</Label>}
            {children}
            {error && <p className="text-xs text-red-500">{error}</p>}
        </div>
    );
}

function StyledInput({ className, ...props }) {
    return (
        <Input
            className={cn(
                "h-[45px] rounded-xl border-border/60 bg-[var(--secondary)] text-sm",
                "focus:ring-2 focus:ring-[var(--primary)]/20 focus:border-[var(--primary)]/40",
                className
            )}
            {...props}
        />
    );
}

function StyledSelect({ value, onValueChange, placeholder, children, disabled }) {
    return (
        <Select value={value} onValueChange={onValueChange} disabled={disabled}>
            <SelectTrigger className="h-[45px] rounded-xl border-border/60 bg-[var(--secondary)] text-sm focus:ring-2 focus:ring-[var(--primary)]/20">
                <SelectValue placeholder={placeholder} />
            </SelectTrigger>
            <SelectContent>{children}</SelectContent>
        </Select>
    );
}

// ─────────────────────────────────────────────
// STEP 1 — Order search + selection
// ─────────────────────────────────────────────
function OrderSearchSection({ errors, selectedOrder, onSelect, isEditMode = false }) {
    const t = useTranslations("CreateReplacement");
    const [query, setQuery] = useState("");
    const [results, setResults] = useState([]);
    const [searching, setSearching] = useState(false);
    const [showResults, setShowResults] = useState(false);
    const debounceRef = useRef(null);
    const wrapperRef = useRef(null);

    // In edit mode, pre-fill with the locked order number
    useEffect(() => {
        if (isEditMode && selectedOrder?.orderNumber) {
            setQuery(selectedOrder.orderNumber);
        }
    }, [isEditMode, selectedOrder?.orderNumber]);
    useEffect(() => {
        clearTimeout(debounceRef.current);
        if (query.trim().length < 2) { setResults([]); setShowResults(false); return; }
        debounceRef.current = setTimeout(async () => {
            try {
                setSearching(true);
                const res = await api.get("/orders", { params: { search: query.trim(), hasReplacement: false, limit: 8, page: 1 } });
                setResults(res.data?.records ?? []);
                setShowResults(true);
            } catch { setResults([]); }
            finally { setSearching(false); }
        }, 350);
    }, [query]);

    // Close on outside click
    useEffect(() => {
        const handler = (e) => { if (!wrapperRef.current?.contains(e.target)) setShowResults(false); };
        document.addEventListener("mousedown", handler);
        return () => document.removeEventListener("mousedown", handler);
    }, []);

    const handleSelect = (order) => {
        onSelect(order);
        setQuery(order.orderNumber);
        setShowResults(false);
    };

    const handleClear = () => {
        onSelect(null);
        setQuery("");
        setResults([]);
    };

    return (
        <Section title={t("sections.searchOrder")} icon={Search} delay={0} className="relative z-20">
            <div ref={wrapperRef} className="relative">
                <FieldInput label={t("fields.orderNumber")}>
                    <div className="relative">
                        <Hash size={13} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none" />
                        <StyledInput
                            value={query}
                            onChange={(e) => {
                                if (isEditMode) return;
                                setQuery(e.target.value);
                                if (selectedOrder) onSelect(null);
                            }}
                            placeholder={t("placeholders.orderNumber")}
                            className={cn("pr-9 pl-9", isEditMode && "opacity-70 cursor-not-allowed")}
                            readOnly={isEditMode}
                            onFocus={() => !isEditMode && results.length && setShowResults(true)}
                        />
                        {searching
                            ? <Loader2 size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground animate-spin" />
                            : !isEditMode && query && <button onClick={handleClear} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition"><X size={13} /></button>
                        }
                    </div>
                </FieldInput>
                <motion.p
                    initial={{ opacity: 0, x: -5 }}
                    animate={{ opacity: 1, x: 0 }}
                    className="mt-1.5 flex items-center gap-1.5 text-[11px] text-muted-foreground/80 leading-none"
                >
                    <AlertCircle size={11} className="text-orange-500/70" />
                    {t("notes.replacementRestriction")}
                </motion.p>

                {/* Dropdown results */}
                <AnimatePresence>
                    {showResults && results.length > 0 && (
                        <motion.div
                            initial={{ opacity: 0, y: -6 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -6 }}
                            transition={{ duration: 0.15 }}
                            className="absolute top-full left-0 right-0 z-50 mt-1 bg-card border border-border/60 rounded-2xl shadow-xl overflow-hidden"
                        >
                            {results.map((order, i) => (
                                <button
                                    key={order.id}
                                    type="button"
                                    onClick={() => handleSelect(order)}
                                    className={cn(
                                        "w-full text-right flex items-center justify-between gap-4 px-4 py-3",
                                        "hover:bg-[var(--secondary)] transition-colors border-b border-border/30 last:border-0",
                                        selectedOrder?.id === order.id && "bg-[color-mix(in_oklab,var(--primary)_5%,transparent)]"
                                    )}
                                >
                                    <div className="flex items-center gap-3">
                                        <div className="w-8 h-8 rounded-xl bg-[color-mix(in_oklab,var(--primary)_10%,transparent)] flex items-center justify-center shrink-0">
                                            <Package size={14} className="text-[var(--primary)]" />
                                        </div>
                                        <div className="text-right">
                                            <p className="text-sm font-bold text-[var(--primary)] font-mono">{order.orderNumber}</p>
                                            <p className="text-xs text-muted-foreground">{order.customerName}</p>
                                        </div>
                                    </div>
                                    <div className="text-right shrink-0">
                                        <p className="text-sm font-semibold text-foreground">{formatCurrency(order.finalTotal ?? order.total)}</p>
                                        <p className="text-xs text-muted-foreground">{formatDate(order.created_at)}</p>
                                    </div>
                                </button>
                            ))}
                        </motion.div>
                    )}
                    {showResults && !searching && results.length === 0 && query.length >= 2 && (
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="absolute top-full left-0 right-0 z-50 mt-1 bg-card border border-border/60 rounded-2xl shadow-xl p-6 text-center"
                        >
                            <Search size={20} className="mx-auto mb-2 text-muted-foreground/50" />
                            <p className="text-sm text-muted-foreground">{t("noOrdersFound")}</p>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>

            {/* Selected order details */}
            <AnimatePresence>
                {selectedOrder && (
                    <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: "auto" }}
                        exit={{ opacity: 0, height: 0 }}
                        transition={{ duration: 0.2 }}
                        className="mt-5 overflow-hidden"
                    >
                        <SelectedOrderDetails order={selectedOrder} />
                    </motion.div>
                )}
            </AnimatePresence>
            {errors.order && <p className="text-xs text-red-500 mt-1 px-1">{errors.order}</p>}
        </Section>
    );
}

// ─────────────────────────────────────────────
// Selected order details panel
// ─────────────────────────────────────────────
function SelectedOrderDetails({ order }) {
    const tOrder = useTranslations("orders")
    const t = useTranslations("CreateReplacement");
    const status = order.status;

    return (
        <div className="space-y-4">
            {/* Client info pills */}
            <div className="grid grid-cols-2 md:grid-cols-3  lg:grid-cols-6 gap-2">
                {[
                    { icon: User, label: t("details.customerName"), value: order.customerName },
                    { icon: Phone, label: t("details.phone"), value: order.phoneNumber },
                    { icon: MapPin, label: t("details.address"), value: `${order.city}، ${order.address}` },
                    { icon: BarChart3, label: t("details.total"), value: formatCurrency(order.finalTotal ?? order.total) },
                    { icon: Calendar, label: t("details.createdAt"), value: formatDate(order.created_at) },
                ].map(({ icon: Icon, label, value }) => (
                    <div key={label} className="flex items-start gap-2 px-3 py-2.5 rounded-xl bg-[var(--secondary)] border border-border/50">
                        <Icon size={13} className="text-[var(--primary)] mt-0.5 shrink-0" />
                        <div className="min-w-0">
                            <p className="text-[10px] text-muted-foreground">{label}</p>
                            <p className="text-xs font-semibold text-foreground truncate">{value || "—"}</p>
                        </div>
                    </div>
                ))}

                {/* Status */}
                {status && (
                    <div className="flex items-start gap-2 px-3 py-2.5 rounded-xl bg-[var(--secondary)] border border-border/50">
                        <CheckCircle2 size={13} className="mt-0.5 shrink-0" style={{ color: status.color }} />
                        <div>
                            <p className="text-[10px] text-muted-foreground">{t("details.status")}</p>
                            <Badge
                                className="mt-0.5 rounded-lg px-2 py-0.5 text-[10px] font-bold border"
                                style={{ backgroundColor: hexToBg(status.color), color: status.color, borderColor: `${status.color}44` }}
                            >
                                {status.system ? tOrder(`statuses.${status.code}`) : (status.name || status.code)}
                            </Badge>
                        </div>
                    </div>
                )}
            </div>

            {/* Items table */}
            <div className="rounded-xl border border-border/50 overflow-hidden">
                <div className="px-4 py-2.5 bg-[var(--secondary)] border-b border-border/40">
                    <p className="text-xs font-bold text-muted-foreground">{t("details.items")}</p>
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead>
                            <tr className="border-b border-border/30">
                                {[
                                    t("details.table.image"),
                                    t("details.table.product"),
                                    t("details.table.qty"),
                                    t("details.table.unitPrice"),
                                    t("details.table.total"),
                                ].map((h) => (
                                    <th key={h} className="text-right px-3 py-2 text-[10px] font-bold text-muted-foreground">{h}</th>
                                ))}
                            </tr>
                        </thead>
                        <tbody>
                            {order.items?.map((item, i) => {
                                const variant = item.variant;
                                const product = variant?.product;
                                const img = product?.mainImage;
                                const lineTotal = (item.unitPrice || 0) * (item.quantity || 0);
                                return (
                                    <tr key={i} className="border-b border-border/20 last:border-0 hover:bg-[var(--secondary)]/50 transition-colors">
                                        <td className="px-3 py-2">
                                            {img
                                                ? <img src={avatarSrc(img)} alt={product?.name} className="w-9 h-9 rounded-lg object-cover border border-border/40" />
                                                : <div className="w-9 h-9 rounded-lg bg-[var(--secondary)] border border-border/40 flex items-center justify-center"><Package size={14} className="text-muted-foreground" /></div>
                                            }
                                        </td>
                                        <td className="px-3 py-2">
                                            <p className="text-xs font-semibold text-foreground">{product?.name || "—"}</p>
                                            {variant?.sku && <p className="text-[10px] text-muted-foreground font-mono">{variant.sku}</p>}
                                        </td>
                                        <td className="px-3 py-2 text-xs font-bold text-foreground text-right">×{item.quantity}</td>
                                        <td className="px-3 py-2 text-xs text-muted-foreground text-right">{formatCurrency(item.unitPrice)}</td>
                                        <td className="px-3 py-2 text-xs font-semibold text-[var(--primary)] text-right">{formatCurrency(lineTotal)}</td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}

// ─────────────────────────────────────────────
// STEP 2 — Reason + shipping inputs
// ─────────────────────────────────────────────
const REASONS = [
    { value: "wrong_size", label: "مقاس خاطئ" },
    { value: "damaged", label: "منتج تالف" },
    { value: "wrong_item", label: "منتج خاطئ" },
    { value: "color_issue", label: "لون مختلف" },
    { value: "quality", label: "جودة سيئة" },
    { value: "other", label: "سبب آخر" },
];

const PAYMENT_METHODS = [
    { value: "cod", label: "الدفع عند الاستلام" },
    { value: "cash", label: "كاش" },
    { value: "card", label: "بطاقة ائتمانية" },
    { value: "bank_transfer", label: "تحويل بنكي" },
];

export const getReasons = (t) => [
    { value: "wrong_size", label: t("reasons.wrong_size") },
    { value: "damaged", label: t("reasons.damaged") },
    { value: "wrong_item", label: t("reasons.wrong_item") },
    { value: "color_issue", label: t("reasons.color_issue") },
    { value: "quality", label: t("reasons.quality") },
    { value: "not_as_described", label: t("reasons.not_as_described") },
    { value: "missing_parts", label: t("reasons.missing_parts") },
    { value: "change_of_mind", label: t("reasons.change_of_mind") },
    { value: "late_delivery", label: t("reasons.late_delivery") },
    { value: "faulty", label: t("reasons.faulty") },
    { value: "other", label: t("reasons.other") },
];

function ReplacementInfoSection({ form, setForm, shippingCompanies, errors }) {
    const t = useTranslations("CreateReplacement");

    return (
        <Section title={t("sections.replacementInfo")} icon={FileText} delay={0.05}>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {/* Reason */}
                <FieldInput label={t("fields.reason")} error={errors.reason}>
                    <StyledSelect
                        value={form.reason}
                        onValueChange={(v) => setForm((p) => ({ ...p, reason: v }))}
                        placeholder={t("placeholders.reason")}
                    >
                        {REASONS.map((r) => <SelectItem key={r.value} value={r.value}>{r.label}</SelectItem>)}
                    </StyledSelect>
                </FieldInput>

                {/* Another reason */}
                <FieldInput label={t("fields.anotherReason")} error={errors.anotherReason}>
                    <StyledInput
                        value={form.anotherReason}
                        onChange={(e) => setForm((p) => ({ ...p, anotherReason: e.target.value }))}
                        placeholder={t("placeholders.anotherReason")}
                    />
                </FieldInput>

                {/* Shipping company */}
                <FieldInput label={t("fields.shippingCompany")}>
                    <StyledSelect
                        value={form.shippingCompanyId}
                        onValueChange={(v) => setForm((p) => ({ ...p, shippingCompanyId: v }))}
                        placeholder={t("placeholders.shippingCompany")}
                    >
                        <SelectItem value="none">{t("noShipping")}</SelectItem>
                        {shippingCompanies.map((s) => <SelectItem key={s.id} value={String(s.id)}>{s.name}</SelectItem>)}
                    </StyledSelect>
                </FieldInput>

                {/* Payment method */}
                <FieldInput label={t("fields.paymentMethod")} error={errors.paymentMethod}>
                    <StyledSelect
                        value={form.paymentMethod}
                        onValueChange={(v) => setForm((p) => ({ ...p, paymentMethod: v }))}
                        placeholder={t("placeholders.paymentMethod")}
                    >
                        {PAYMENT_METHODS.map((m) => <SelectItem key={m.value} value={m.value}>{m.label}</SelectItem>)}
                    </StyledSelect>
                </FieldInput>

                {/* Shipping cost */}
                <FieldInput label={t("fields.shippingCost")}>
                    <StyledInput
                        type="number" min="0"
                        value={form.shippingCost}
                        onChange={(e) => setForm((p) => ({ ...p, shippingCost: e.target.value }))}
                        placeholder="0"
                    />
                </FieldInput>

                {/* Discount */}
                <FieldInput label={t("fields.discount")}>
                    <StyledInput
                        type="number" min="0"
                        value={form.discount}
                        onChange={(e) => setForm((p) => ({ ...p, discount: e.target.value }))}
                        placeholder="0"
                    />
                </FieldInput>
            </div>

            {/* Notes */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                <FieldInput label={t("fields.internalNotes")}>
                    <Textarea
                        value={form.internalNotes}
                        onChange={(e) => setForm((p) => ({ ...p, internalNotes: e.target.value }))}
                        placeholder={t("placeholders.internalNotes")}
                        className="min-h-[72px] rounded-xl border-border/60 bg-[var(--secondary)] text-sm resize-none"
                    />
                </FieldInput>
                <FieldInput label={t("fields.customerNotes")}>
                    <Textarea
                        value={form.customerNotes}
                        onChange={(e) => setForm((p) => ({ ...p, customerNotes: e.target.value }))}
                        placeholder={t("placeholders.customerNotes")}
                        className="min-h-[72px] rounded-xl border-border/60 bg-[var(--secondary)] text-sm resize-none"
                    />
                </FieldInput>
            </div>
        </Section>
    );
}

// ─────────────────────────────────────────────
// STEP 3 — Replacement item card
// ─────────────────────────────────────────────
function ReplacementItemCard({ originalItem, cardIndex, onUpdate, onRemove, t }) {
    const [newSku, setNewSku] = useState(null); // chosen replacement variant
    const [quantity, setQuantity] = useState(originalItem.quantity || 1);
    const [newPrice, setNewPrice] = useState(0);

    const oldPrice = Number(originalItem.unitPrice || 0);
    const diff = (Number(newPrice) || 0) - oldPrice;
    const total = (Number(newPrice) || 0) * quantity;

    useEffect(() => {
        onUpdate(cardIndex, {
            originalOrderItemId: originalItem.id,
            quantityToReplace: quantity,
            newVariantId: newSku?.id ?? null,
            newUnitPrice: Number(newPrice) || 0,
            oldUnitPrice: oldPrice,
        });
    }, [newSku, quantity, newPrice]);

    const handleSelectSku = (sku) => {
        setNewSku(sku);
        setNewPrice(sku.price || 0);
    };

    const handleRemoveSku = () => {
        setNewSku(null);
        setNewPrice(0);
    };

    const product = originalItem.variant?.product;
    const variant = originalItem.variant;
    const img = product?.mainImage;

    return (
        <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10, scale: 0.97 }}
            transition={{ duration: 0.18 }}
            className="rounded-2xl border border-border/60 bg-card overflow-hidden"
        >
            {/* Card header */}
            <div className="flex items-center justify-between px-4 py-3 bg-[var(--secondary)] border-b border-border/40">
                <div className="flex items-center gap-2.5">
                    <div className="w-7 h-7 rounded-xl bg-[color-mix(in_oklab,var(--primary)_10%,transparent)] flex items-center justify-center">
                        <ArrowLeftRight size={13} className="text-[var(--primary)]" />
                    </div>
                    <p className="text-xs font-bold text-foreground">{t("itemCard.title")} #{cardIndex + 1}</p>
                </div>
                <button
                    type="button"
                    onClick={() => onRemove(cardIndex)}
                    className="w-7 h-7 rounded-xl border border-red-200 bg-red-50 text-red-500 hover:bg-red-500 hover:text-white flex items-center justify-center transition-all"
                >
                    <Trash2 size={13} />
                </button>
            </div>

            <div className="p-4 grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* LEFT: Original item */}
                <div className="space-y-3">
                    <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wide">{t("itemCard.originalItem")}</p>
                    <div className="flex items-start gap-3 px-3 py-3 rounded-xl border border-border/50 bg-[var(--secondary)]">
                        {img
                            ? <img src={avatarSrc(img)} alt={product?.name} className="w-10 h-10 rounded-lg object-cover border border-border/40 shrink-0" />
                            : <div className="w-10 h-10 rounded-lg bg-muted/40 border border-border/40 flex items-center justify-center shrink-0"><Package size={15} className="text-muted-foreground" /></div>
                        }
                        <div className="min-w-0 flex-1">
                            <p className="text-xs font-bold text-foreground line-clamp-1">{product?.name || "—"}</p>
                            {variant?.sku && <p className="text-[10px] text-muted-foreground font-mono mt-0.5">{variant.sku}</p>}
                            <p className="text-[10px] text-muted-foreground mt-1">{t("itemCard.oldPrice")}: <span className="font-semibold text-foreground">{formatCurrency(oldPrice)}</span></p>
                        </div>
                    </div>
                </div>

                {/* RIGHT: New item search */}
                <div className="space-y-3">
                    <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wide">{t("itemCard.newItem")}</p>
                    {newSku ? (
                        <div className="flex items-start gap-3 px-3 py-3 rounded-xl border border-[color-mix(in_oklab,var(--primary)_25%,transparent)] bg-[color-mix(in_oklab,var(--primary)_5%,transparent)]">
                            <div className="w-10 h-10 rounded-lg bg-[color-mix(in_oklab,var(--primary)_10%,transparent)] border border-[color-mix(in_oklab,var(--primary)_20%,transparent)] flex items-center justify-center shrink-0">
                                <Package size={15} className="text-[var(--primary)]" />
                            </div>
                            <div className="min-w-0 flex-1">
                                <p className="text-xs font-bold text-foreground line-clamp-1">{newSku.label || newSku.productName}</p>
                                <p className="text-[10px] text-muted-foreground font-mono mt-0.5">{newSku.sku}</p>
                            </div>
                            <button
                                type="button"
                                onClick={handleRemoveSku}
                                className="w-6 h-6 rounded-lg border border-red-200 bg-red-50 text-red-500 hover:bg-red-500 hover:text-white flex items-center justify-center transition-all shrink-0"
                            >
                                <X size={11} />
                            </button>
                        </div>
                    ) : (
                        <div className="rounded-xl border-2 border-dashed border-border/50 p-3">
                            <ProductSkuSearchPopover
                                closeOnSelect
                                handleSelectSku={handleSelectSku}
                                selectedSkus={newSku ? [newSku] : []}
                            />
                        </div>
                    )}
                </div>
            </div>

            {/* Bottom row: quantity + prices */}
            <div className="px-4 pb-4 grid grid-cols-2 md:grid-cols-4 gap-3">
                {/* Quantity */}
                <FieldInput label={t("itemCard.quantity")}>
                    <div className="flex items-center gap-1.5">
                        <button
                            type="button"
                            onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                            className="w-7 h-[45px] rounded-lg bg-[var(--secondary)] border border-border/60 flex items-center justify-center hover:border-border transition"
                        >
                            <Minus size={12} />
                        </button>
                        <StyledInput
                            type="number" min="1"
                            value={quantity}
                            onChange={(e) => setQuantity(Math.max(1, parseInt(e.target.value) || 1))}
                            className="text-center"
                        />
                        <button
                            type="button"
                            onClick={() => setQuantity((q) => q + 1)}
                            className="w-7 h-[45px] rounded-lg bg-[var(--secondary)] border border-border/60 flex items-center justify-center hover:border-border transition"
                        >
                            <Plus size={12} />
                        </button>
                    </div>
                </FieldInput>

                {/* Old price (readonly) */}
                <FieldInput label={t("itemCard.oldPrice")}>
                    <StyledInput value={formatCurrency(oldPrice)} readOnly className="bg-muted/30 text-muted-foreground cursor-not-allowed" />
                </FieldInput>

                {/* New price */}
                <FieldInput label={t("itemCard.newPrice")}>
                    <StyledInput
                        type="number" min="0"
                        value={newPrice}
                        onChange={(e) => setNewPrice(e.target.value)}
                    />
                </FieldInput>

                {/* Price diff */}
                <FieldInput label={t("itemCard.priceDiff")}>
                    <div className={cn(
                        "h-[45px] px-3 rounded-xl border flex items-center text-sm font-bold",
                        diff > 0 ? "border-red-200 bg-red-50/50 text-red-600" :
                            diff < 0 ? "border-emerald-200 bg-emerald-50/50 text-emerald-600" :
                                "border-border/60 bg-[var(--secondary)] text-muted-foreground"
                    )}>
                        {diff > 0 ? "+" : ""}{formatCurrency(diff)}
                    </div>
                </FieldInput>
            </div>
        </motion.div>
    );
}

// ─────────────────────────────────────────────
// STEP 3 — Items selector section
// ─────────────────────────────────────────────
function ReplacementItemsSection({ errors, selectedOrder, replacementItems, setReplacementItems }) {
    const t = useTranslations("CreateReplacement");
    const orderItems = selectedOrder?.items ?? [];

    const addItem = (orderItem) => {
        // Prevent duplicate original items
        if (replacementItems.some((ri) => ri._originalItemId === orderItem.id)) {
            toast.error(t("errors.itemAlreadyAdded"));
            return;
        }
        setReplacementItems((prev) => [
            ...prev,
            { _originalItemId: orderItem.id, _originalItem: orderItem, data: null },
        ]);
    };

    const updateItem = (idx, data) => {
        setReplacementItems((prev) => {
            const next = [...prev];
            next[idx] = { ...next[idx], data };
            return next;
        });
    };

    const removeItem = (idx) => {
        setReplacementItems((prev) => prev.filter((_, i) => i !== idx));
    };

    return (
        <Section title={t("sections.replacementItems")} icon={ArrowLeftRight} delay={0.1}>
            {/* Pick from original items */}
            {!selectedOrder ? (
                <div className="flex items-center gap-3 p-4 rounded-xl bg-[var(--secondary)] border border-dashed border-border/50">
                    <AlertTriangle size={16} className="text-muted-foreground/60 shrink-0" />
                    <p className="text-sm text-muted-foreground">{t("selectOrderFirst")}</p>
                </div>
            ) : (
                <div className="space-y-4">
                    {/* Available original items to add */}
                    {orderItems.length > 0 && (
                        <div className="space-y-2">
                            <p className="text-xs font-semibold text-muted-foreground">{t("chooseItemsToReplace")}</p>
                            <div className="flex flex-wrap gap-2">
                                {orderItems.map((item) => {
                                    const isAdded = replacementItems.some((ri) => ri._originalItemId === item.id);
                                    const name = item.variant?.product?.name || "—";
                                    return (
                                        <button
                                            key={item.id}
                                            type="button"
                                            onClick={() => !isAdded && addItem(item)}
                                            disabled={isAdded}
                                            className={cn(
                                                "inline-flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-semibold border transition-all",
                                                isAdded
                                                    ? "bg-[color-mix(in_oklab,var(--primary)_10%,transparent)] text-[var(--primary)] border-[color-mix(in_oklab,var(--primary)_25%,transparent)] opacity-60 cursor-not-allowed"
                                                    : "bg-[var(--secondary)] text-foreground border-border/60 hover:border-[var(--primary)]/40 hover:text-[var(--primary)] hover:bg-[color-mix(in_oklab,var(--primary)_5%,transparent)]"
                                            )}
                                        >
                                            {isAdded ? <CheckCircle2 size={11} /> : <Plus size={11} />}
                                            {name}
                                            <span className="text-muted-foreground font-normal">×{item.quantity}</span>
                                        </button>
                                    );
                                })}
                            </div>
                        </div>
                    )}

                    {/* Replacement cards */}
                    <div className="space-y-3">
                        <AnimatePresence>
                            {replacementItems.map((ri, idx) => (
                                <ReplacementItemCard
                                    key={`${ri._originalItemId}-${idx}`}
                                    originalItem={ri._originalItem}
                                    cardIndex={idx}
                                    onUpdate={updateItem}
                                    onRemove={removeItem}
                                    t={t}
                                />
                            ))}
                        </AnimatePresence>
                    </div>

                    {replacementItems.length === 0 && (
                        <div className="flex items-center gap-3 p-4 rounded-xl bg-[var(--secondary)] border border-dashed border-border/50 text-center justify-center">
                            <p className="text-sm text-muted-foreground">{t("noItemsAdded")}</p>
                        </div>
                    )}
                </div>
            )}
            {errors.items && <p className="text-xs text-red-500 mt-1 px-1">{errors.items}</p>}
        </Section>
    );
}



// ─────────────────────────────────────────────
// Price summary card
// ─────────────────────────────────────────────
function PriceSummaryCard({ replacementItems, form, selectedOrder }) {
    const t = useTranslations("CreateReplacement");
    const summary = useMemo(() => {
        const oldTotal = replacementItems.reduce((sum, ri) => {
            const d = ri.data;
            if (!d) return sum;
            return sum + (d.oldUnitPrice || 0) * (d.quantityToReplace || 0);
        }, 0);
        const newTotal = replacementItems.reduce((sum, ri) => {
            const d = ri.data;
            if (!d) return sum;
            return sum + (d.newUnitPrice || 0) * (d.quantityToReplace || 0);
        }, 0);
        const shipping = Number(form.shippingCost) || 0;
        const discount = Number(form.discount) || 0;
        const diff = newTotal - oldTotal;
        const finalNew = newTotal + shipping - discount;

        return { oldTotal, newTotal, shipping, discount, diff, finalNew, itemCount: replacementItems.length };
    }, [replacementItems, form]);

    const rows = [
        { label: t("summary.items"), value: summary.itemCount, color: "text-foreground" },
        { label: t("summary.oldTotal"), value: formatCurrency(summary.oldTotal), color: "text-muted-foreground" },
        { label: t("summary.newTotal"), value: formatCurrency(summary.newTotal), color: "text-foreground font-bold" },
        { label: t("summary.shipping"), value: formatCurrency(summary.shipping), color: "text-muted-foreground" },
        { label: t("summary.discount"), value: `- ${formatCurrency(summary.discount)}`, color: "text-red-500" },
        { label: t("summary.priceDiff"), value: `${summary.diff >= 0 ? "+" : ""}${formatCurrency(summary.diff)}`, color: summary.diff > 0 ? "text-red-500 font-bold" : summary.diff < 0 ? "text-emerald-600 font-bold" : "text-muted-foreground" },
    ];

    return (
        <div className="bg-card rounded-2xl border border-border/60 shadow-sm overflow-hidden h-fit">
            <div className="flex items-center gap-3 px-4 py-3 border-b border-border/40">
                <div className="w-7 h-7 rounded-xl bg-[color-mix(in_oklab,var(--primary)_10%,transparent)] border border-[color-mix(in_oklab,var(--primary)_20%,transparent)] flex items-center justify-center">
                    <BarChart3 size={13} className="text-[var(--primary)]" />
                </div>
                <p className="text-xs font-bold text-foreground">{t("sections.priceSummary")}</p>
            </div>

            <div className="p-4 space-y-2">
                {rows.map(({ label, value, color }) => (
                    <div key={label} className="flex items-center justify-between py-1.5 border-b border-border/25 last:border-0">
                        <span className="text-xs text-muted-foreground">{label}</span>
                        <span className={cn("text-xs", color)}>{value}</span>
                    </div>
                ))}

                {/* Final total highlight */}
                <div className="mt-3 flex items-center justify-between p-3 rounded-xl bg-[color-mix(in_oklab,var(--primary)_8%,transparent)] border border-[color-mix(in_oklab,var(--primary)_20%,transparent)]">
                    <span className="text-xs font-bold text-foreground">{t("summary.finalTotal")}</span>
                    <span className="text-base font-bold text-[var(--primary)]">{formatCurrency(summary.finalNew)}</span>
                </div>
            </div>
        </div>
    );
}

// ─────────────────────────────────────────────
// MAIN PAGE
// Props for edit mode:
//   isEditMode     boolean
//   replacementId  number          — id of existing OrderReplacementEntity
//   existingData   object|null     — prefetched record (will fetch if null)
// ─────────────────────────────────────────────
export default function CreateReplacementPage({ isEditMode = false, replacementId = null, existingData = null }) {
    const t = useTranslations("CreateReplacement");
    const router = useRouter();

    // ── State ──
    const [selectedOrder, setSelectedOrder] = useState(null);
    const [replacementItems, setReplacementItems] = useState([]);
    // imageFiles: ImageFile[] — local File objects + existing URL entries
    const [imageFiles, setImageFiles] = useState([]);
    // removedImages: string[] — URLs of existing images deleted by user (edit mode)
    const [removedImages, setRemovedImages] = useState([]);
    const [submitting, setSubmitting] = useState(false);
    const [initialLoading, setInitialLoading] = useState(isEditMode && !existingData);
    const [shippingCompanies, setShippingCompanies] = useState([]);
    const [errors, setErrors] = useState({});

    const [form, setForm] = useState({
        reason: "",
        anotherReason: "",
        shippingCompanyId: "",
        paymentMethod: "cod",
        shippingCost: 0,
        discount: 0,
        internalNotes: "",
        customerNotes: "",
    });

    // ── Lookups ──
    useEffect(() => {
        api.get("/shipping-companies", { params: { limit: 200, isActive: true } })
            .then((r) => setShippingCompanies(Array.isArray(r.data?.records) ? r.data.records : Array.isArray(r.data) ? r.data : []))
            .catch(() => { });
    }, []);

    // ── Load existing data in edit mode ──
    useEffect(() => {
        if (!isEditMode) return;

        const load = async () => {
            try {
                setInitialLoading(true);
                const data = existingData ?? (await api.get(`/order-replacements/${replacementId}`)).data;

                setForm({
                    reason: data.reason ?? "",
                    anotherReason: data.anotherReason ?? "",
                    shippingCompanyId: data.shippingCompanyId ? String(data.shippingCompanyId) : "",
                    paymentMethod: data.replacementOrder?.paymentMethod ?? "cod",
                    shippingCost: data.replacementOrder?.shippingCost ?? 0,
                    discount: data.replacementOrder?.discount ?? 0,
                    internalNotes: data.internalNotes ?? "",
                    customerNotes: data.replacementOrder?.customerNotes ?? "",
                });

                if (data.originalOrder) setSelectedOrder(data.originalOrder);

                // Seed existing return images as { isExisting: true, url }
                if (Array.isArray(data.returnImages) && data.returnImages.length > 0) {
                    setImageFiles(
                        data.returnImages.map((url) => ({
                            id: makeId(),
                            isExisting: true,
                            isFromLibrary: false,
                            url,
                            file: undefined,
                            previewUrl: undefined,
                        }))
                    );
                }

                // Seed replacement items from existing record
                if (Array.isArray(data.items) && data.originalOrder?.items) {
                    setReplacementItems(
                        data.items.map((ri) => ({
                            _originalItemId: ri.originalOrderItemId,
                            _originalItem: data.originalOrder.items.find((oi) => oi.id === ri.originalOrderItemId) ?? { id: ri.originalOrderItemId },
                            data: {
                                originalOrderItemId: ri.originalOrderItemId,
                                quantityToReplace: ri.quantityToReplace,
                                newVariantId: ri.newVariantId,
                                newUnitPrice: ri.newUnitPrice,
                                oldUnitPrice: ri.oldUnitPrice,
                            },
                        }))
                    );
                }
            } catch {
                toast.error(t("errors.loadFailed"));
            } finally {
                setInitialLoading(false);
            }
        };

        load();
    }, [isEditMode, replacementId]); // eslint-disable-line

    // ── Track removed existing images (called by ImageUploadBox.onRemove) ──
    const handleImageRemove = (target) => {
        if (target?.isExisting && target?.url) {
            setRemovedImages((prev) => [...prev, target.url]);
        }
    };


    // ── Validate ──
    const validate = () => {
        const e = {};
        if (!selectedOrder) e.order = t("validation.orderRequired");
        if (!form.reason) e.reason = t("validation.reasonRequired");
        // if (!form.anotherReason) e.anotherReason = t("validation.anotherReasonRequired");
        if (!form.paymentMethod) e.paymentMethod = t("validation.paymentMethodRequired");
        if (replacementItems.length === 0) e.items = t("validation.itemsRequired");
        // else {
        //     const invalid = replacementItems.some((ri) => !ri.data?.newVariantId);
        //     if (invalid) e.items = t("validation.newVariantRequired");
        // }
        setErrors(e);
        return Object.keys(e).length === 0;
    };

    // ── Submit ──
    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!validate()) { toast.error(t("validation.fixErrors")); return; }

        setSubmitting(true);
        try {
            const fd = new FormData();

            // ── Scalar fields ──
            fd.append("originalOrderId", selectedOrder.id);
            fd.append("reason", form.reason);
            fd.append("anotherReason", form.anotherReason);
            fd.append("paymentMethod", form.paymentMethod);
            if (form.shippingCompanyId && form.shippingCompanyId !== "none") {
                fd.append("shippingCompanyId", Number(form.shippingCompanyId));
            }
            fd.append("shippingCost", Number(form.shippingCost) || 0);
            fd.append("discount", Number(form.discount) || 0);
            if (form.internalNotes) fd.append("internalNotes", form.internalNotes);
            if (form.customerNotes) fd.append("customerNotes", form.customerNotes);

            // ── Items array → JSON string ──
            fd.append(
                "items",
                JSON.stringify(
                    replacementItems.map((ri) => ({
                        originalOrderItemId: ri.data.originalOrderItemId,
                        quantityToReplace: ri.data.quantityToReplace,
                        newVariantId: ri.data.newVariantId,
                        newUnitPrice: ri.data.newUnitPrice,
                    }))
                )
            );

            // ── Existing / library URLs → imagesMeta JSON string ──
            const existingUrls = imageFiles
                .filter((f) => f.isExisting && f.url && !removedImages.includes(f.url))
                .map((f) => ({ url: String(f.url) }));

            const libraryUrls = imageFiles
                .filter((f) => f.isFromLibrary && !f.isExisting && f.url)
                .map((f) => ({ url: String(f.url) }));

            if (isEditMode) {
                fd.append("images", JSON.stringify([...existingUrls, ...libraryUrls]));
            } else {
                if (libraryUrls.length) {
                    fd.append("images", JSON.stringify(libraryUrls));
                }
            }

            // ── New local File objects — appended directly, no pre-upload ──
            (imageFiles ?? []).forEach((f) => {
                if (!f) return;
                if (f.isFromLibrary || f.isExisting) return;
                if (f.file) fd.append("images", f.file);
            });

            if (isEditMode && replacementId) {
                await api.patch(`/order-replacements/${replacementId}`, fd, {
                    headers: { "Content-Type": "multipart/form-data" },
                });
                toast.success(t("messages.updateSuccess"));
            } else {
                await api.post("/order-replacements/replace", fd, {
                    headers: { "Content-Type": "multipart/form-data" },
                });
                toast.success(t("messages.createSuccess"));
            }
            router.push("/orders");
        } catch (err) {
            const msg = err?.response?.data?.message;
            toast.error(Array.isArray(msg) ? msg.join(", ") : msg || (isEditMode ? t("messages.updateFailed") : t("messages.createFailed")));
        } finally {
            setSubmitting(false);
        }
    };
    // ── Loading skeleton for edit mode ──
    if (initialLoading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-background">
                <div className="text-center space-y-3">
                    <div className="w-12 h-12 rounded-2xl bg-[color-mix(in_oklab,var(--primary)_10%,transparent)] flex items-center justify-center mx-auto">
                        <Loader2 size={22} className="text-[var(--primary)] animate-spin" />
                    </div>
                    <p className="text-sm text-muted-foreground">{t("messages.loading")}</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen p-4 md:p-6 bg-background">
            <form onSubmit={handleSubmit}>

                {/* ── Header ── */}
                <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="bg-card mb-6"
                >
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2 text-lg font-semibold">
                            <span className="text-gray-400">{t("breadcrumb.home")}</span>
                            <ChevronLeft className="text-gray-400 rtl:rotate-180" size={18} />
                            <button
                                type="button"
                                onClick={() => router.push("/orders")}
                                className="text-gray-400 hover:text-primary transition-colors"
                            >
                                {t("breadcrumb.orders")}
                            </button>
                            <ChevronLeft className="text-gray-400 rtl:rotate-180" size={18} />
                            <span className="text-primary">
                                {isEditMode ? t("titleEdit") : t("title")}
                            </span>
                            <span className="mr-3 inline-flex w-3.5 h-3.5 rounded-xl bg-primary" />
                        </div>

                        <div className="flex items-center gap-4">
                            <Button_
                                onClick={() => router.back()}
                                size="sm"
                                label={t("actions.cancel")}
                                tone="white"
                                variant="solid"
                                type="button"
                            />

                            <Button_
                                type="submit"
                                size="sm"
                                label={submitting ? t("actions.saving") : (isEditMode ? t("actions.update") : t("actions.submit"))}
                                tone="purple"
                                variant="solid"
                                disabled={submitting}
                            />
                        </div>
                    </div>
                </motion.div>

                {/* ── SECTION 1: Order Search ── */}
                <div className="mb-4">
                    <OrderSearchSection
                        selectedOrder={selectedOrder}
                        onSelect={(order) => { setSelectedOrder(order); if (!isEditMode) setReplacementItems([]); }}
                        isEditMode={isEditMode}
                        errors={errors}
                    />

                </div>

                {/* ── SECTION 2: Replacement info ── */}
                <div className="mb-4">
                    <ReplacementInfoSection
                        form={form}
                        setForm={setForm}
                        shippingCompanies={shippingCompanies}
                        errors={errors}
                    />
                </div>

                {/* ── SECTION 3: Items + sidebar ── */}
                <div className="grid grid-cols-1 lg:grid-cols-[1fr_400px] gap-4">
                    <div>
                        <ReplacementItemsSection
                            selectedOrder={selectedOrder}
                            replacementItems={replacementItems}
                            setReplacementItems={setReplacementItems}
                            errors={errors}
                        />

                    </div>

                    <div className="space-y-4">
                        {/* ImageUploadBox: files stay local, sent on submit via buildReturnImages() */}
                        <ImageUploadBox
                            title={t("sections.images")}
                            files={imageFiles}
                            onFilesChange={setImageFiles}
                            onRemove={handleImageRemove}
                        />
                        <PriceSummaryCard
                            replacementItems={replacementItems}
                            form={form}
                            selectedOrder={selectedOrder}
                        />
                    </div>
                </div>

            </form>
        </div>
    );
}