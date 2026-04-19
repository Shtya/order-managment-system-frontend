"use client";

import React, {
    useEffect,
    useMemo,
    useState,
} from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
    Loader2,
    Clock,
    AlertTriangle,
    Store,
    AlertCircle,
    PackageX,
    X,
    Package,
    CheckCircle2,
    User,
    Phone,
    MapPin,
    CreditCard,
    RefreshCw,
    ChevronDown,
    ChevronUp,
    ShoppingCart,
    ArrowRight,
    ExternalLink,
    ShieldAlert,
    FileText,
    Plus,
    Edit
} from "lucide-react";
import { useTranslations } from "next-intl";
import { cn } from "@/utils/cn";
import toast from "react-hot-toast";
import { Badge } from "@/components/ui/badge";
import api from "@/utils/api";
import Flatpickr from "react-flatpickr";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
    DialogFooter
} from "@/components/ui/dialog";
import { useRouter } from "@/i18n/navigation";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { usePlatformSettings } from "@/context/PlatformSettingsContext";
import { Bone } from "@/components/atoms/BannerSkeleton";


function FailedOrderDetailsModalSkeleton() {
    return (
        <div className="space-y-6 animate-pulse p-6">
            {/* Header Skeleton */}
            <div className="border-b-2 border-border pb-4 space-y-3">
                <div className="flex items-center gap-3">
                    <Bone className="w-12 h-12 rounded-xl" />
                    <div className="space-y-2">
                        <Bone className="h-6 w-48" />
                        <Bone className="h-4 w-64" />
                    </div>
                </div>
            </div>

            {/* Info Grid Skeleton */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {Array.from({ length: 4 }).map((_, i) => (
                    <div key={i} className="p-4 rounded-xl border border-border/40 bg-muted/20 space-y-2">
                        <Bone className="h-3 w-16" />
                        <Bone className="h-4 w-24" />
                    </div>
                ))}
            </div>

            {/* Client & Order Sections Skeleton */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-3">
                    <Bone className="h-5 w-40" />
                    <div className="p-4 rounded-xl border border-border/40 space-y-3 h-40">
                        <Bone className="h-4 w-full" />
                        <Bone className="h-4 w-full" />
                        <Bone className="h-4 w-full" />
                    </div>
                </div>
                <div className="space-y-3">
                    <Bone className="h-5 w-40" />
                    <div className="p-4 rounded-xl border border-border/40 space-y-3 h-40">
                        <Bone className="h-4 w-full" />
                        <Bone className="h-4 w-full" />
                        <Bone className="h-4 w-full" />
                    </div>
                </div>
            </div>

            {/* Items Table Skeleton */}
            <div className="space-y-3">
                <Bone className="h-5 w-40" />
                <div className="rounded-xl border border-border/30 overflow-hidden">
                    <div className="bg-muted/30 px-4 py-3 flex justify-between">
                        <Bone className="h-3 w-20" />
                        <Bone className="h-3 w-24" />
                        <Bone className="h-3 w-16" />
                        <Bone className="h-3 w-20" />
                        <Bone className="h-3 w-24" />
                        <Bone className="h-3 w-16" />
                    </div>
                    {Array.from({ length: 3 }).map((_, i) => (
                        <div key={i} className="flex gap-4 px-4 py-4 border-t border-border/20">
                            <Bone className="h-4 w-full" />
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}

// Mock Enum based on your provided backend enum
const WebhookOrderProblem = {
    PRODUCT_NOT_FOUND: 'PRODUCT_NOT_FOUND',
    SKU_NOT_FOUND: 'SKU_NOT_FOUND',
    INSUFFICIENT_STOCK: 'INSUFFICIENT_STOCK',
};

function formatDate(dateStr) {
    if (!dateStr) return "—";
    return new Date(dateStr).toLocaleDateString("en-US", {
        year: "numeric",
        month: "short",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
    });
}

export function FailedOrderDetailsModal({
    open,
    onOpenChange,
    failureId,
    fixMode = false,
    onRetrySuccess
}) {
    const t = useTranslations('orders.failedOrders');
    const router = useRouter();
    const { formatCurrency } = usePlatformSettings();

    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [retrying, setRetrying] = useState(false);

    // Fix Mode States
    const [selectedSkus, setSelectedSkus] = useState([]); // For INSUFFICIENT_STOCK PO creation

    // External Product Cache: { [slug]: { loading, data, error } }
    const [externalCache, setExternalCache] = useState({});
    const [expandedExternal, setExpandedExternal] = useState({}); // { [slug]: boolean }

    // 1. Fetch Data
    useEffect(() => {
        const fetchData = async () => {
            setLoading(true);
            try {
                const res = await api.get(`/stores/failed-orders/${failureId}`);
                const result = res.data;

                setData(result);

                // Initialize selected SKUs for out-of-stock items by default
                const oosSkus = result?.problems
                    ?.filter((p) => p.code === WebhookOrderProblem.INSUFFICIENT_STOCK)
                    .map((p) => p.sku)
                    .filter(Boolean);

                setSelectedSkus(oosSkus || []);
            } catch (err) {
                toast.error(t('errors.fetchFailed'));
            } finally {
                setLoading(false);
            }
        };

        if (open && failureId) {
            fetchData();
        } else {
            setData(null);
            setSelectedSkus([]);
        }
    }, [open, failureId, t]);

    const failure = data?.failureLog;
    const problems = data?.problems || [];
    const payload = failure?.payload;

    // 2. Retry Logic
    const isRetryDisabled = useMemo(() => {
        if (!fixMode || loading || retrying) return true;
        // Disabled if ANY problem exists (user said: do not allow retry if has any product)
        return problems.length > 0;
    }, [problems, fixMode, loading, retrying]);

    const handleRetry = async () => {
        setRetrying(true);
        try {
            await api.post(`/stores/failed-orders/${failureId}/retry`);
            toast.success(t('messages.retrySuccess'));
            onRetrySuccess?.();
            onOpenChange(false);
        } catch (error) {
            toast.error(t('messages.retryFailed'));
        } finally {
            setRetrying(false);
        }
    };

    // 4. Problem Action Handlers
    const handleFetchExternalProduct = async (remoteId, provider) => {
        try {
            setExpandedProducts(prev => {
                const newSet = new Set(prev);
                newSet.add(remoteId);
                return newSet;
            });
            setExpandedExternal(prev => ({ ...prev, [remoteId]: !prev[remoteId] }));

            if (externalCache[remoteId]?.data || externalCache[remoteId]?.loading) return;
            console.log("fetch 1: ", remoteId)
            setExternalCache(prev => ({ ...prev, [remoteId]: { loading: true } }));
            console.log("fetch: ", remoteId)
            const res = await api.get(`/stores/external/${provider}/${remoteId}`);
            setExternalCache(prev => ({ ...prev, [remoteId]: { loading: false, data: res.data } }));
        } catch (err) {
            setExternalCache(prev => ({ ...prev, [remoteId]: { loading: false, error: true } }));
            toast.error(t('errors.externalFetchFailed'));
        }
    };

    const handleCreatePurchaseOrder = () => {
        if (selectedSkus.length === 0) return toast.error(t('errors.noSkusSelected'));
        router.push(`/purchases/new?skus=${selectedSkus.join(',')}`);
    };

    // 5. Render Helpers
    // ═══════════════════════════════════════════════════════════════════════
    // IMPROVED EXTERNAL PRODUCT DETAILS - PER ROW STATE
    // ═══════════════════════════════════════════════════════════════════════
    const [expandedProducts, setExpandedProducts] = useState(new Set());

    const toggleProductExpansion = (remoteId) => {
        setExpandedProducts(prev => {
            const newSet = new Set(prev);
            if (newSet.has(remoteId)) {
                newSet.delete(remoteId);
            } else {
                newSet.add(remoteId);
            }
            return newSet;
        });
    };

    const renderExternalProductDetails = (remoteId, provider, itemIndex) => {
        if (!remoteId || !provider) return null;

        const cache = externalCache[remoteId];
        const isExpanded = expandedProducts.has(remoteId);

        return (
            <tr key={`details-${remoteId}-${itemIndex}`}>
                <td colSpan={6} className="p-0 bg-muted/30">
                    <div className="border-t border-border">
                        {/* Toggle Button */}
                        <button
                            type="button"
                            onClick={() => {
                                if (!cache) {
                                    handleFetchExternalProduct(remoteId, provider);
                                }
                                toggleProductExpansion(remoteId);
                            }}
                            className={cn(
                                "w-full px-4 py-3 flex items-center justify-between text-sm font-semibold transition-all",
                                "hover:bg-accent/50",
                                isExpanded && "bg-accent/30"
                            )}
                        >
                            <span className="flex items-center gap-2 text-muted-foreground">
                                <ExternalLink size={14} />
                                {t('actions.viewExternalProductDetails')}
                            </span>
                            <ChevronDown
                                size={16}
                                className={cn(
                                    "transition-transform text-muted-foreground",
                                    isExpanded && "rotate-180"
                                )}
                            />
                        </button>

                        {/* Expandable Content */}
                        <AnimatePresence>
                            {isExpanded && (
                                <motion.div
                                    initial={{ height: 0, opacity: 0 }}
                                    animate={{ height: "auto", opacity: 1 }}
                                    exit={{ height: 0, opacity: 0 }}
                                    transition={{ duration: 0.2 }}
                                    className="overflow-hidden"
                                >
                                    <div className="p-6 bg-card border-t border-border">
                                        {cache?.loading ? (
                                            // Loading State
                                            <div className="flex items-center justify-center py-12 gap-3">
                                                <Loader2 size={20} className="animate-spin text-primary" />
                                                <span className="text-sm text-muted-foreground font-medium">
                                                    {t('common.loadingProductDetails')}...
                                                </span>
                                            </div>
                                        ) : cache?.error ? (
                                            // Error State
                                            <div className="flex flex-col items-center justify-center py-12 gap-4">
                                                <div className="w-12 h-12 rounded-full bg-destructive/10 flex items-center justify-center">
                                                    <AlertCircle size={24} className="text-destructive" />
                                                </div>
                                                <div className="text-center">
                                                    <p className="font-semibold text-destructive mb-1">
                                                        {t('errors.failedToLoadProductDetails')}
                                                    </p>
                                                    <p className="text-sm text-muted-foreground">
                                                        {cache.error}
                                                    </p>
                                                </div>
                                                <Button
                                                    size="sm"
                                                    variant="outline"
                                                    onClick={() => handleFetchExternalProduct(remoteId, provider)}
                                                >
                                                    <RefreshCw size={14} className="mr-2" />
                                                    {t('actions.retry')}
                                                </Button>
                                            </div>
                                        ) : cache?.data ? (
                                            // Success - Show FULL Product Details
                                            <div className="space-y-6">
                                                {/* Header with Image & Basic Info */}
                                                <div className="flex items-start gap-6">
                                                    {/* Product Image */}
                                                    <div className="relative w-32 h-32 rounded-xl overflow-hidden border-2 border-border shrink-0 bg-muted">
                                                        <img
                                                            src={cache.data.thumb || '/placeholder.png'}
                                                            alt={cache.data.name}
                                                            className="w-full h-full object-cover"
                                                            onError={(e) => {
                                                                e.currentTarget.src = '/placeholder.png';
                                                            }}
                                                        />
                                                    </div>

                                                    {/* Product Info */}
                                                    <div className="flex-1 space-y-3">
                                                        <div>
                                                            <h4 className="text-lg font-bold text-foreground mb-1">
                                                                {cache.data.name}
                                                            </h4>
                                                            {cache.data.description && (
                                                                <p className="text-sm text-muted-foreground line-clamp-2">
                                                                    {cache.data.description}
                                                                </p>
                                                            )}
                                                        </div>

                                                        <div className="flex flex-wrap gap-3">
                                                            <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-muted">
                                                                <span className="text-xs font-semibold text-muted-foreground">
                                                                    SKU:
                                                                </span>
                                                                <span className="text-xs font-mono font-bold text-foreground">
                                                                    {cache.data.sku}
                                                                </span>
                                                            </div>

                                                            <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-muted">
                                                                <span className="text-xs font-semibold text-muted-foreground">
                                                                    {t('labels.price')}:
                                                                </span>
                                                                <span className="text-xs font-bold text-primary">
                                                                    {formatCurrency(cache.data.price)}
                                                                </span>
                                                            </div>

                                                            {cache.data.expense && (
                                                                <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-muted">
                                                                    <span className="text-xs font-semibold text-muted-foreground">
                                                                        {t('labels.expense')}:
                                                                    </span>
                                                                    <span className="text-xs font-bold text-orange-600">
                                                                        {formatCurrency(cache.data.expense)}
                                                                    </span>
                                                                </div>
                                                            )}

                                                            <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-muted">
                                                                <span className="text-xs font-semibold text-muted-foreground">
                                                                    {t('labels.quantity')}:
                                                                </span>
                                                                <span className="text-xs font-bold text-foreground">
                                                                    {cache.data.quantity}
                                                                </span>
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>

                                                {/* Categories */}
                                                {cache.data.categories && cache.data.categories.length > 0 && (
                                                    <div className="space-y-2">
                                                        <Label className="text-xs font-semibold text-muted-foreground uppercase">
                                                            {t('labels.categories')}
                                                        </Label>
                                                        <div className="flex flex-wrap gap-2">
                                                            {cache.data.categories.map((cat, idx) => (
                                                                <Badge key={idx} variant="secondary" className="text-xs">
                                                                    {cat.name || cat.id}
                                                                </Badge>
                                                            ))}
                                                        </div>
                                                    </div>
                                                )}

                                                {/* Variations & Variants */}
                                                {cache.data.variations && cache.data.variations.length > 0 && (
                                                    <div className="space-y-3">
                                                        <Label className="text-xs font-semibold text-muted-foreground uppercase">
                                                            {t('labels.variations')}
                                                        </Label>
                                                        <div className="space-y-2">
                                                            {cache.data.variations.map((variation) => (
                                                                <div
                                                                    key={variation.id}
                                                                    className="p-3 rounded-lg border border-border bg-muted/50"
                                                                >
                                                                    <p className="font-semibold text-sm text-foreground mb-2">
                                                                        {variation.name}
                                                                    </p>
                                                                    <div className="flex flex-wrap gap-2">
                                                                        {variation.props.map((prop) => (
                                                                            <span
                                                                                key={prop.id}
                                                                                className="px-2 py-1 rounded bg-background text-xs font-medium"
                                                                            >
                                                                                {prop.name}: <strong>{prop.value}</strong>
                                                                            </span>
                                                                        ))}
                                                                    </div>
                                                                </div>
                                                            ))}
                                                        </div>
                                                    </div>
                                                )}

                                                {/* Variants Table */}
                                                {cache.data.variants && cache.data.variants.length > 0 && (
                                                    <div className="space-y-3">
                                                        <Label className="text-xs font-semibold text-muted-foreground uppercase">
                                                            {t('labels.variants')} ({cache.data.variants.length})
                                                        </Label>
                                                        <div className="border border-border rounded-lg overflow-hidden">
                                                            <table className="w-full text-sm">
                                                                <thead className="bg-muted">
                                                                    <tr>
                                                                        <th className="px-3 py-2 text-left text-xs font-semibold">
                                                                            {t('table.attributes')}
                                                                        </th>
                                                                        <th className="px-3 py-2 text-left text-xs font-semibold">
                                                                            SKU
                                                                        </th>
                                                                        <th className="px-3 py-2 text-right text-xs font-semibold">
                                                                            {t('table.price')}
                                                                        </th>
                                                                        {cache.data.variants.some(v => v.expense) && (
                                                                            <th className="px-3 py-2 text-right text-xs font-semibold">
                                                                                {t('table.expense')}
                                                                            </th>
                                                                        )}
                                                                        <th className="px-3 py-2 text-right text-xs font-semibold">
                                                                            {t('table.quantity')}
                                                                        </th>
                                                                    </tr>
                                                                </thead>
                                                                <tbody className="divide-y divide-border">
                                                                    {cache.data.variants.map((variant, idx) => (
                                                                        <tr key={idx} className="hover:bg-muted/30 transition-colors">
                                                                            <td className="px-3 py-2">
                                                                                <div className="flex flex-wrap gap-1">
                                                                                    {variant.variation_props.map((prop, propIdx) => (
                                                                                        <span
                                                                                            key={propIdx}
                                                                                            className="px-2 py-0.5 rounded text-xs bg-accent text-accent-foreground"
                                                                                        >
                                                                                            {prop.variation_prop}
                                                                                        </span>
                                                                                    ))}
                                                                                </div>
                                                                            </td>
                                                                            <td className="px-3 py-2">
                                                                                <code className="text-xs font-mono bg-muted px-2 py-1 rounded">
                                                                                    {variant.sku}
                                                                                </code>
                                                                            </td>
                                                                            <td className="px-3 py-2 text-right font-semibold text-primary">
                                                                                {formatCurrency(variant.price)}
                                                                            </td>
                                                                            {cache.data.variants.some(v => v.expense) && (
                                                                                <td className="px-3 py-2 text-right font-semibold text-orange-600">
                                                                                    {variant.expense ? formatCurrency(variant.expense) : '—'}
                                                                                </td>
                                                                            )}
                                                                            <td className="px-3 py-2 text-right font-semibold">
                                                                                {variant.quantity}
                                                                            </td>
                                                                        </tr>
                                                                    ))}
                                                                </tbody>
                                                            </table>
                                                        </div>
                                                    </div>
                                                )}

                                                {/* Additional Images */}
                                                {cache.data.images && cache.data.images.length > 1 && (
                                                    <div className="space-y-3">
                                                        <Label className="text-xs font-semibold text-muted-foreground uppercase">
                                                            {t('labels.additionalImages')}
                                                        </Label>
                                                        <div className="grid grid-cols-6 gap-2">
                                                            {cache.data.images.slice(1).map((img, idx) => (
                                                                <div
                                                                    key={idx}
                                                                    className="aspect-square rounded-lg overflow-hidden border border-border bg-muted"
                                                                >
                                                                    <img
                                                                        src={img}
                                                                        alt={`${cache.data.name} ${idx + 2}`}
                                                                        className="w-full h-full object-cover"
                                                                        onError={(e) => {
                                                                            e.currentTarget.src = '/placeholder.png';
                                                                        }}
                                                                    />
                                                                </div>
                                                            ))}
                                                        </div>
                                                    </div>
                                                )}

                                                {/* Action Button */}
                                                <div className="pt-4 border-t border-border">
                                                    <Button
                                                        className="w-full"
                                                        onClick={() => router.push(`/products/${provider}/${remoteId}`)}
                                                    >
                                                        <Plus size={16} className="mr-2" />
                                                        {t('actions.createProductFromExternal')}
                                                    </Button>
                                                </div>
                                            </div>
                                        ) : null}
                                    </div>
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>
                </td>
            </tr>
        );
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="!max-w-5xl max-h-[90vh] flex flex-col overflow-hidden bg-white dark:bg-slate-950 border-none shadow-2xl">
                {/* Header */}
                <DialogHeader className="mb-5 border-b-2 border-gray-100 dark:border-slate-800 bg-white dark:bg-slate-950 shrink-0">
                    <div className="flex items-center gap-4">
                        <div className="w-14 h-14 rounded-2xl bg-red-50 dark:bg-red-900/20 flex items-center justify-center shrink-0 border-2 border-red-100 dark:border-red-900/30">
                            <ShieldAlert className="w-7 h-7 text-red-600 dark:text-red-400" />
                        </div>
                        <div>
                            <DialogTitle className="text-2xl font-black text-slate-900 dark:text-white tracking-tight font-semibold">
                                {t('title')}
                            </DialogTitle>
                            <DialogDescription className="text-sm mt-1 text-slate-500 dark:text-slate-400 flex items-center gap-2">
                                <span className="font-medium">{t('details.externalOrderId')}:</span>
                                <span className="font-black text-primary px-2 py-0.5 rounded-lg bg-primary/5 border border-primary/10">
                                    {failure?.externalOrderId || 'N/A'}
                                </span>
                            </DialogDescription>
                        </div>
                    </div>
                </DialogHeader>

                <div className="flex-1 overflow-y-auto custom-scrollbar">
                    {loading ? (
                        <FailedOrderDetailsModalSkeleton />
                    ) : !failure ? (
                        <div className="flex flex-col items-center justify-center py-20 text-slate-500 gap-4">
                            <PackageX className="w-16 h-16 opacity-20" />
                            <p className="font-bold text-lg">{t('errors.notFound')}</p>
                        </div>
                    ) : (
                        <div className="p-6 space-y-8">
                            {/* Failure Reason Alert */}
                            <div className="bg-gradient-to-r from-red-50 to-white dark:from-red-950/20 dark:to-slate-950 border-2 border-red-100 dark:border-red-900/30 rounded-2xl p-5 flex items-start gap-4 shadow-sm">
                                <div className="w-10 h-10 rounded-xl bg-red-100 dark:bg-red-900/30 flex items-center justify-center shrink-0">
                                    <AlertCircle className="w-5 h-5 text-red-600 dark:text-red-400" />
                                </div>
                                <div>
                                    <h4 className="font-black text-red-800 dark:text-red-400 text-sm uppercase tracking-wider">{t('labels.failureReason')}</h4>
                                    <p className="text-sm text-red-600 dark:text-red-300 mt-1.5 font-bold leading-relaxed">{failure.reason || t('common.unknownError')}</p>
                                </div>
                            </div>

                            {/* Info Grid (Cards) */}
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                <div className="p-4 space-y-2 rounded-2xl bg-gradient-to-br from-gray-50 to-gray-100 dark:from-slate-900 dark:to-slate-800 border-2 border-gray-100 dark:border-slate-800 transition-all hover:shadow-md">
                                    <Label className="text-[10px] text-slate-500 dark:text-slate-400 mb-2 block uppercase tracking-widest font-black">{t('details.status')}</Label>
                                    <div className="flex">
                                        <Badge className={cn(
                                            "rounded-xl px-3 py-1 text-[10px] font-black uppercase tracking-wider border-2",
                                            failure.status === "failed"
                                                ? "bg-red-50 text-red-700 border-red-100 dark:bg-red-900/20 dark:text-red-400 dark:border-red-900/30"
                                                : "bg-blue-50 text-blue-700 border-blue-100 dark:bg-blue-900/20 dark:text-blue-400 dark:border-blue-900/30"
                                        )}>
                                            {failure.status}
                                        </Badge>
                                    </div>
                                </div>
                                <div className="p-4 space-y-2 rounded-2xl bg-gradient-to-br from-gray-50 to-gray-100 dark:from-slate-900 dark:to-slate-800 border-2 border-gray-100 dark:border-slate-800 transition-all hover:shadow-md">
                                    <Label className="text-[10px] text-slate-500 dark:text-slate-400 mb-2 block uppercase tracking-widest font-black">{t('labels.attempts')}</Label>
                                    <p className="text-lg font-black text-slate-900 dark:text-white flex items-center gap-2">
                                        <RefreshCw className="w-4 h-4 text-primary" />
                                        {failure.attempts}
                                    </p>
                                </div>
                                <div className="p-4 space-y-2 rounded-2xl bg-gradient-to-br from-gray-50 to-gray-100 dark:from-slate-900 dark:to-slate-800 border-2 border-gray-100 dark:border-slate-800 transition-all hover:shadow-md">
                                    <Label className="text-[10px] text-slate-500 dark:text-slate-400 mb-2 block uppercase tracking-widest font-black">{t('details.date')}</Label>
                                    <p className="text-sm font-black text-slate-900 dark:text-white flex items-center gap-2">
                                        <Clock className="w-4 h-4 text-primary" />
                                        {formatDate(failure.created_at)}
                                    </p>
                                </div>
                                <div className="p-4 space-y-2 rounded-2xl bg-gradient-to-br from-gray-50 to-gray-100 dark:from-slate-900 dark:to-slate-800 border-2 border-gray-100 dark:border-slate-800 transition-all hover:shadow-md">
                                    <Label className="text-[10px] text-slate-500 dark:text-slate-400 mb-2 block uppercase tracking-widest font-black">{t('details.store')}</Label>
                                    <p className="text-sm font-black text-slate-900 dark:text-white flex items-center gap-2 truncate">
                                        <Store className="w-4 h-4 text-primary shrink-0" />
                                        {failure.store?.name}
                                    </p>
                                </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                {/* Client Details Card */}
                                <div className="space-y-4">
                                    <h3 className="text-lg font-black text-slate-800 dark:text-slate-200 flex items-center gap-3">
                                        <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
                                            <User className="w-4 h-4 text-primary" />
                                        </div>
                                        {t('sections.clientDetails')}
                                    </h3>
                                    <div className="bg-white dark:bg-slate-900 border-2 border-gray-100 dark:border-slate-800 rounded-2xl p-6 space-y-5 shadow-sm hover:shadow-md transition-all">
                                        <div className="grid grid-cols-2 gap-6">
                                            <div className="space-y-2 ">
                                                <Label className="text-[10px] text-slate-400 uppercase font-black tracking-widest mb-1.5 block">{t('labels.name')}</Label>
                                                <p className="text-sm font-black text-slate-900 dark:text-white truncate">{payload?.fullName || '—'}</p>
                                            </div>
                                            <div className="space-y-2 ">
                                                <Label className="text-[10px] text-slate-400 uppercase font-black tracking-widest mb-1.5 block">{t('labels.email')}</Label>
                                                <p className="text-sm font-black text-slate-900 dark:text-white truncate">{payload?.email || '—'}</p>
                                            </div>
                                            <div className="space-y-2 ">
                                                <Label className="text-[10px] text-slate-400 uppercase font-black tracking-widest mb-1.5 block">{t('labels.phone')}</Label>
                                                <p className="text-sm font-black text-slate-900 dark:text-white flex items-center gap-2">
                                                    <Phone className="w-3.5 h-3.5 text-primary" />
                                                    {payload?.phone || '—'}
                                                </p>
                                            </div>
                                            <div className="space-y-2 ">
                                                <Label className="text-[10px] text-slate-400 uppercase font-black tracking-widest mb-1.5 block">{t('labels.government')}</Label>
                                                <p className="text-sm font-black text-slate-900 dark:text-white flex items-center gap-2">
                                                    <MapPin className="w-3.5 h-3.5 text-primary" />
                                                    {payload?.government || '—'}
                                                </p>
                                            </div>
                                        </div>
                                        <div className="pt-4 space-y-2 border-t-2 border-gray-50 dark:border-slate-800">
                                            <Label className="text-[10px] text-slate-400 uppercase font-black tracking-widest mb-1.5 block">{t('labels.address')}</Label>
                                            <p className="text-sm font-bold text-slate-700 dark:text-slate-300 leading-relaxed">{payload?.address || '—'}</p>
                                        </div>
                                    </div>
                                </div>

                                {/* Order Summary Card */}
                                <div className="space-y-4">
                                    <h3 className="text-lg font-black text-slate-800 dark:text-slate-200 flex items-center gap-3">
                                        <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
                                            <ShoppingCart className="w-4 h-4 text-primary" />
                                        </div>
                                        {t('sections.orderDetails')}
                                    </h3>
                                    <div className="bg-white dark:bg-slate-900 border-2 border-gray-100 dark:border-slate-800 rounded-2xl p-6 space-y-5 shadow-sm hover:shadow-md transition-all">
                                        <div className="grid grid-cols-2 gap-6">
                                            <div className="space-y-2">
                                                <Label className="text-[10px] text-slate-400 uppercase font-black tracking-widest mb-1.5 block">{t('labels.paymentMethod')}</Label>
                                                <Badge variant="outline" className="font-black px-2 py-0.5 rounded-lg border-2 uppercase text-[10px] tracking-wider">
                                                    <CreditCard className="w-3 h-3 mr-1.5" />
                                                    {payload?.paymentMethod === "cod" ? t('labels.paymentMethods.cod') : payload?.paymentMethod || "—"}
                                                </Badge>
                                            </div>
                                            <div className="space-y-2">
                                                <Label className="text-[10px] text-slate-400 uppercase font-black tracking-widest mb-1.5 block">{t('labels.paymentStatus')}</Label>
                                                <p className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-wider">{payload?.status || '—'}</p>
                                            </div>
                                        </div>
                                        <div className="grid grid-cols-2 gap-6">
                                            <div className="space-y-2">
                                                <Label className="text-[10px] text-slate-400 uppercase font-black tracking-widest mb-1.5 block">{t('labels.shippingCost')}</Label>
                                                <p className="text-sm font-black text-slate-900 dark:text-white">{formatCurrency(payload?.shippingCost || 0)}</p>
                                            </div>
                                            <div className="space-y-2">
                                                <Label className="text-[10px] text-slate-400 uppercase font-black tracking-widest mb-1.5 block">{t('labels.total')}</Label>
                                                <p className="text-sm font-black text-slate-900 dark:text-white">{formatCurrency(payload?.totalCost || 0)}</p>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Items Section (Table) */}
                            <div className="space-y-4">
                                <div className="flex items-center justify-between">
                                    <h3 className="text-lg font-black text-slate-800 dark:text-slate-200 flex items-center gap-3">
                                        <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
                                            <Package className="w-4 h-4 text-primary" />
                                        </div>
                                        {t('sections.itemsDetails')}
                                    </h3>
                                    {selectedSkus.length > 0 && fixMode && (
                                        <Button size="sm" onClick={handleCreatePurchaseOrder} className="bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-black shadow-lg shadow-indigo-200 dark:shadow-none transition-all hover:scale-105 uppercase tracking-wider text-[10px]">
                                            <Plus className="w-3.5 h-3.5 mr-2" />
                                            {t('actions.createPOForSelected')} ({selectedSkus.length})
                                        </Button>
                                    )}
                                </div>

                                <div className="border-2 border-gray-100 dark:border-slate-800 rounded-2xl overflow-hidden shadow-sm hover:shadow-md transition-all bg-white dark:bg-slate-900">
                                    <table className="w-full text-sm">
                                        <thead className="bg-gray-50/50 dark:bg-slate-800/50 border-b-2 border-gray-100 dark:border-slate-800">
                                            <tr>
                                                <th className="text-right p-4 font-black text-slate-500 dark:text-slate-400 uppercase text-[10px] tracking-widest">{t('table.product')}</th>
                                                {/* <th className="text-center p-4 font-black text-slate-500 dark:text-slate-400 uppercase text-[10px] tracking-widest">{t('table.sku')}</th> */}
                                                <th className="text-center p-4 font-black text-slate-500 dark:text-slate-400 uppercase text-[10px] tracking-widest">{t('table.quantity')}</th>
                                                <th className="text-right p-4 font-black text-slate-500 dark:text-slate-400 uppercase text-[10px] tracking-widest">{t('table.total')}</th>
                                                <th className="text-right p-4 font-black text-slate-500 dark:text-slate-400 uppercase text-[10px] tracking-widest">{t('table.problem')}</th>
                                                {fixMode && <th className="text-center p-4 font-black text-slate-500 dark:text-slate-400 uppercase text-[10px] tracking-widest">{t('table.actions')}</th>}
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-gray-100 dark:divide-slate-800">
                                            {payload?.cartItems?.map((item, idx) => {
                                                const problem = problems.find(p => {
                                                    return p.slug === item.productSlug
                                                });
                                                return (
                                                    <>
                                                        <tr key={idx} className={cn(
                                                            "hover:bg-slate-50/50 dark:hover:bg-slate-800/50 transition-colors group",
                                                            problem && "bg-red-50/10 dark:bg-red-950/5"
                                                        )}>
                                                            <td className="p-4">
                                                                <div className="font-black text-slate-900 dark:text-white leading-tight">{item.name}</div>
                                                                <div className="text-[10px] text-slate-400 mt-1 font-bold uppercase tracking-wider flex items-center gap-1.5">
                                                                    <ExternalLink className="w-3 h-3" />
                                                                    Slug: {item.productSlug}
                                                                </div>
                                                            </td>
                                                            {/* <td className="p-4 text-center">
                              <span className="font-black text-xs px-2 py-1 rounded bg-gray-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 uppercase tracking-tighter">
                                {item.variant?.key || item.variant?.sku || '—'}
                              </span>
                            </td> */}
                                                            <td className="p-4 text-center">
                                                                <span className="inline-flex items-center px-3 py-1 rounded-xl bg-slate-100 dark:bg-slate-800 font-black text-slate-700 dark:text-slate-300">
                                                                    {item.quantity}
                                                                </span>
                                                            </td>
                                                            <td className="p-4 text-right font-black text-slate-900 dark:text-white">
                                                                {formatCurrency(item.quantity * item.price)}
                                                            </td>
                                                            <td className="p-4 text-right min-w-[200px]">
                                                                {problem ? (
                                                                    <div className="space-y-1">
                                                                        <div className="text-[10px] font-black text-red-700 dark:text-red-400 uppercase tracking-wider flex items-center gap-1.5">
                                                                            <AlertCircle className="w-3 h-3" />
                                                                            {t(`problems.${problem.code}`)}
                                                                        </div>
                                                                    </div>
                                                                ) : (
                                                                    <div className="text-[10px] font-black text-green-600 dark:text-green-400 uppercase tracking-wider flex items-center gap-1.5">
                                                                        <CheckCircle2 className="w-3 h-3" />
                                                                        {t('actions.alreadySuccess')}
                                                                    </div>
                                                                )}
                                                            </td>
                                                            {fixMode && <td className="p-4 text-center min-w-[150px]">
                                                                {problem && fixMode ? (
                                                                    <div className="flex flex-col gap-2">
                                                                        {problem.code === WebhookOrderProblem.PRODUCT_NOT_FOUND && (
                                                                            <Button
                                                                                size="xs"
                                                                                variant="outline"
                                                                                className="h-7 text-[9px] font-black uppercase tracking-tighter rounded-lg border-2"
                                                                                onClick={() => handleFetchExternalProduct(problem.remoteId, failure?.store?.provider)}
                                                                            >
                                                                                <ExternalLink className="w-3 h-3 mr-1" />
                                                                                {t('actions.fetchExternalDetails')}
                                                                            </Button>
                                                                        )}

                                                                        {problem?.code === WebhookOrderProblem.SKU_NOT_FOUND && (
                                                                            <div className="mt-2 p-3 rounded-lg bg-destructive/5 border border-destructive/20">
                                                                                <div className="flex items-start gap-2 mb-2">
                                                                                    <AlertCircle size={14} className="text-destructive mt-0.5 shrink-0" />
                                                                                    <div className="flex-1 min-w-0">
                                                                                        <p className="text-xs font-semibold text-destructive mb-1">
                                                                                            {t('errors.skuNotFoundInSystem')}
                                                                                        </p>

                                                                                        {/* Show the variant that was NOT found */}
                                                                                        {item.variant?.variation_props && item.variant.variation_props.length > 0 && (
                                                                                            <div className="space-y-1">
                                                                                                <p className="text-xs text-muted-foreground font-medium">
                                                                                                    {t('labels.requestedVariant')}:
                                                                                                </p>
                                                                                                <div className="flex flex-wrap gap-1.5">
                                                                                                    {item.variant.variation_props.map((prop, idx) => (
                                                                                                        <span
                                                                                                            key={idx}
                                                                                                            className="inline-flex items-center gap-1 px-2 py-1 rounded-md bg-destructive/10 border border-destructive/20 text-xs"
                                                                                                        >
                                                                                                            <span className="font-medium text-destructive/70">
                                                                                                                {prop.name}:
                                                                                                            </span>
                                                                                                            <span className="font-bold text-destructive">
                                                                                                                {prop.value}
                                                                                                            </span>
                                                                                                        </span>
                                                                                                    ))}
                                                                                                </div>
                                                                                            </div>
                                                                                        )}
                                                                                    </div>
                                                                                </div>

                                                                                {/* Action: Edit Product */}
                                                                                <Button
                                                                                    size="sm"
                                                                                    variant="outline"
                                                                                    className="w-full mt-3 border-destructive/30 hover:bg-destructive/10"
                                                                                    onClick={() => router.push(`/products/edit/${item.variant?.localProductId || problem.productId}`)}
                                                                                >
                                                                                    <Edit size={14} className="mr-2" />
                                                                                    {t('actions.editProductAndAddVariant')}
                                                                                </Button>
                                                                            </div>
                                                                        )}

                                                                        {problem.code === WebhookOrderProblem.INSUFFICIENT_STOCK && (
                                                                            <label className="flex items-center gap-2 p-1.5 rounded-lg bg-gray-50 dark:bg-slate-800 border border-red-100 dark:border-red-900/30 cursor-pointer hover:border-red-200 transition-all">
                                                                                <Checkbox
                                                                                    className="h-3 w-3"
                                                                                    checked={selectedSkus.includes(problem.sku)}
                                                                                    onCheckedChange={(checked) => {
                                                                                        setSelectedSkus(prev =>
                                                                                            checked ? [...prev, problem.sku] : prev.filter(s => s !== problem.sku)
                                                                                        );
                                                                                    }}
                                                                                />
                                                                                <span className="font-black text-[9px] text-slate-700 dark:text-slate-300 uppercase tracking-tighter">
                                                                                    {t('actions.includeInPurchaseOrder')}
                                                                                </span>
                                                                            </label>
                                                                        )}
                                                                    </div>
                                                                ) : !problem ? (
                                                                    <div className="flex justify-center">
                                                                        <div className="w-6 h-6 rounded-full bg-green-50 dark:bg-green-900/20 flex items-center justify-center border border-green-100 dark:border-green-900/30">
                                                                            <CheckCircle2 className="w-3.5 h-3.5 text-green-600 dark:text-green-400" />
                                                                        </div>
                                                                    </div>
                                                                ) : (
                                                                    <div className="flex justify-center">
                                                                        <div className="w-6 h-6 rounded-full bg-red-50 dark:bg-red-900/20 flex items-center justify-center border border-red-100 dark:border-red-900/30">
                                                                            <AlertTriangle className="w-3.5 h-3.5 text-red-600 dark:text-red-400" />
                                                                        </div>
                                                                    </div>
                                                                )}
                                                            </td>}
                                                        </tr>
                                                        {renderExternalProductDetails(problem?.remoteId, failure?.store?.provider, idx)}
                                                    </>
                                                );
                                            })}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        </div>
                    )}
                </div>

                {/* Footer Actions */}
                <DialogFooter className="px-4 sm:px-6 py-3 sm:py-4 border-t-2 border-gray-100 dark:border-slate-800 bg-gray-50 dark:bg-slate-800/50 shrink-0">
                    <div className="flex flex-col sm:flex-row items-center justify-between w-full gap-4 sm:gap-0">
                        <div className="text-[10px] sm:text-xs text-gray-500 dark:text-slate-400 order-2 sm:order-1">
                            {!loading && failure && problems.length === 0 && (
                                <span className="flex items-center gap-2">
                                    <div className="w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full bg-green-500 animate-pulse"></div>
                                    <span className="font-black uppercase tracking-wider">{t('actions.alreadySuccess')}</span>
                                </span>
                            )}
                        </div>
                        <div className="flex items-center gap-2 sm:gap-3 w-full sm:w-auto order-1 sm:order-2">
                            <Button
                                variant="outline"
                                onClick={() => onOpenChange(false)}
                                className="flex-1 sm:flex-none px-4 sm:px-8 py-2 sm:py-2.5 rounded-xl text-xs sm:text-sm font-black border-2 uppercase tracking-widest"
                            >
                                {t('common.close')}
                            </Button>
                            {fixMode && failure && (
                                <Button
                                    onClick={handleRetry}
                                    disabled={isRetryDisabled}
                                    className={cn(
                                        "flex-1 sm:flex-none px-4 sm:px-10 py-2 sm:py-2.5 rounded-xl text-xs sm:text-sm font-black shadow-lg transition-all transform hover:scale-105 active:scale-95 uppercase tracking-widest",
                                        isRetryDisabled
                                            ? "bg-slate-200 text-slate-400 cursor-not-allowed shadow-none"
                                            : "bg-primary hover:bg-primary/90 text-white shadow-primary/30"
                                    )}
                                >
                                    {retrying ? (
                                        <RefreshCw className="w-4 h-4 sm:w-5 sm:h-5 animate-spin mr-2" />
                                    ) : (
                                        <CheckCircle2 className="w-4 h-4 sm:w-5 sm:h-5 mr-2" />
                                    )}
                                    {t('actions.retryOrder')}
                                </Button>
                            )}
                        </div>
                    </div>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
