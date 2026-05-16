"use client";

import React, { useEffect, useMemo, useState, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import {
    Loader2,
    Clock,
    AlertTriangle,
    Store,
    AlertCircle,
    PackageX,
    Package,
    CheckCircle2,
    User,
    Phone,
    MapPin,
    CreditCard,
    RefreshCw,
    ShoppingCart,
    ExternalLink,
    ShieldAlert,
    Plus,
    Edit,
    Info,
    Mail,
    Eye,
    Boxes,
    Hash,
    CalendarDays,
    ImageIcon,
    Tag,
    Warehouse,
    XCircle
} from "lucide-react";
import { cn } from "@/utils/cn";
import toast from "react-hot-toast";
import api from "@/utils/api";
import { usePlatformSettings } from "@/context/PlatformSettingsContext";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Separator } from "@/components/ui/separator";

import PageHeader from "@/components/atoms/Pageheader";
import Table from "@/components/atoms/Table";
import ActionButtons from "@/components/atoms/Actions";
import { convert } from "html-to-text";
import { normalizeAxiosError } from "@/utils/axios";
import Button_ from "@/components/atoms/Button";
import { avatarSrc } from "@/components/atoms/UserSelect";

function toAbsUrl(url) {
    if (!url) return null;
    if (String(url).startsWith("http")) return url;
    return url;
}
const WebhookOrderProblem = {
    PRODUCT_NOT_FOUND: 'PRODUCT_NOT_FOUND',
    SKU_NOT_FOUND: 'SKU_NOT_FOUND',
    INSUFFICIENT_STOCK: 'INSUFFICIENT_STOCK',
    PRODUCT_INACTIVE: 'PRODUCT_INACTIVE',
    SKU_INACTIVE: 'SKU_INACTIVE',
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

//expense - description - categories

// ─────────────────────────────────────────────────────────────────────────────
// External Product Modal Component
// ─────────────────────────────────────────────────────────────────────────────
export function ExternalProductModal({ isOpen, onClose, remoteId, provider, cache, onFetch, formatCurrency }) {
    const t = useTranslations('orders.failedOrders');
    useEffect(() => {
        if (isOpen && remoteId && provider && !cache?.data && !cache?.loading) {
            onFetch(remoteId, provider);
        }
    }, [isOpen, remoteId, provider]);

    const text = useMemo(() => {
        if (!cache?.data?.description) return '';

        return convert(cache.data.description, {
            wordwrap: false,
            selectors: [
                { selector: 'img', format: 'skip' },
                { selector: 'a', options: { ignoreHref: true } },
            ],
        });
    }, [cache?.data?.description]);
    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="max-w-4xl! max-h-[85vh] overflow-y-auto bg-white dark:bg-slate-950">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2 text-xl font-black">
                        <ExternalLink className="w-5 h-5 text-primary" />
                        {t('actions.viewExternalProductDetails')}
                    </DialogTitle>
                    <DialogDescription>
                        {t('labels.externalId')}: {remoteId}
                    </DialogDescription>
                </DialogHeader>

                <div className="py-4">
                    {cache?.loading ? (
                        <div className="flex flex-col items-center justify-center py-12 gap-3">
                            <Loader2 size={32} className="animate-spin text-primary" />
                            <span className="text-sm text-muted-foreground font-medium">
                                {t('common.loadingProductDetails')}...
                            </span>
                        </div>
                    ) : cache?.error ? (
                        <div className="flex flex-col items-center justify-center py-12 gap-4">
                            <div className="w-16 h-16 rounded-full bg-red-50 flex items-center justify-center">
                                <AlertCircle size={32} className="text-red-500" />
                            </div>
                            <p className="font-bold text-red-600">{t('errors.failedToLoadProductDetails')}</p>
                            <Button variant="outline" onClick={() => onFetch(remoteId, provider)}>
                                <RefreshCw size={14} className="mr-2" /> {t('actions.retry')}
                            </Button>
                        </div>
                    ) : cache?.data ? (
                        <div className="space-y-6">
                            <div className="flex flex-col md:flex-row items-start gap-6">
                                <div className="w-32 h-32 rounded-xl overflow-hidden border shrink-0 bg-muted">
                                    <img src={cache.data.thumb || '/placeholder.png'} alt={cache.data.name} className="w-full h-full object-cover" />
                                </div>
                                <div className="flex-1 space-y-3">
                                    <h4 className="text-lg font-bold">{cache.data.name}</h4>
                                    <div className="flex flex-wrap gap-2">
                                        <Badge variant="outline">{t('labels.sku')}: {cache.data.sku}</Badge>
                                        <Badge variant="outline" className="text-primary">{t('labels.price')}: {formatCurrency(cache.data.price)}</Badge>
                                        <Badge variant="outline">{t('labels.quantity')}: {cache.data.quantity}</Badge>
                                    </div>
                                </div>
                            </div>

                            {text && (
                                <div className="space-y-2">
                                    <Label className="text-xs font-semibold text-muted-foreground uppercase">
                                        {t('labels.description')}
                                    </Label>
                                    <div className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed bg-muted/30 p-3 rounded-lg border border-border/40">
                                        {convert(text || '')}
                                    </div>
                                </div>
                            )}
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

                            {cache.data.variants && cache.data.variants.length > 0 && (
                                <div className="space-y-3">
                                    <Label className="text-xs font-semibold text-muted-foreground uppercase">
                                        {t('labels.variants')}
                                    </Label>
                                    <div className="border rounded-lg overflow-hidden">
                                        <table className="w-full text-sm">
                                            <thead className="bg-muted/50">
                                                <tr>
                                                    <th className="px-3 py-2 text-start font-semibold">{t('table.attributes')}</th>
                                                    <th className="px-3 py-2 text-start font-semibold">{t('labels.sku')}</th>
                                                    <th className="px-3 py-2 text-end font-semibold">{t('table.price')}</th>
                                                    <th className="px-3 py-2 text-end font-semibold">{t('table.quantity')}</th>
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y">
                                                {cache.data.variants.map((v, i) => (
                                                    <tr key={i} className="hover:bg-muted/30">
                                                        <td className="px-3 py-2">
                                                            <div className="flex flex-wrap gap-1">
                                                                {/* //or object has no keys */}
                                                                {v.variation_props && Object.keys(v.variation_props || {}).length > 0 ? v.variation_props?.map((p, idx) => (
                                                                    <span key={idx} className="px-2 py-0.5 rounded text-xs bg-accent">{p.variation_prop}</span>
                                                                )) : 'N/A'}
                                                            </div>
                                                        </td>
                                                        <td className="px-3 py-2 font-mono text-xs">{v.sku}</td>
                                                        <td className="px-3 py-2 text-end font-bold text-primary">{formatCurrency(v.price)}</td>
                                                        <td className="px-3 py-2 text-end">{v.quantity}</td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                </div>
                            )}
                        </div>
                    ) : null}
                </div>
            </DialogContent>
        </Dialog>
    );
}

// ─────────────────────────────────────────────────────────────────────────────
// SKU Selector Modal Component
// ─────────────────────────────────────────────────────────────────────────────
function SkuSelectorModal({ isOpen, onClose, product, loading, error, currentKey, onSelect }) {
    const t = useTranslations('orders.failedOrders');
    const { formatCurrency } = usePlatformSettings();
    const na = t('common.na');

    const skus = Array.isArray(product?.skus) ? product.skus.filter(s => s.isActive || s.sku === currentKey) : [];
    const mainImage = toAbsUrl(product?.mainImage);

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="max-w-4xl! max-h-[85vh] overflow-hidden p-0 bg-white dark:bg-slate-950">
                <DialogHeader className="px-6 pt-6 pb-4 border-b">
                    <DialogTitle className="flex items-center gap-2 text-xl font-bold">
                        <Boxes className="text-primary" size={20} />
                        {t('labels.selectVariant')}
                    </DialogTitle>
                </DialogHeader>

                <div className="p-6 overflow-y-auto max-h-[calc(85vh-80px)] space-y-6">
                    {loading ? (
                        <div className="flex flex-col items-center justify-center py-12 gap-3">
                            <Loader2 size={32} className="animate-spin text-primary" />
                            <span className="text-sm text-muted-foreground font-medium">{t('common.loading')}...</span>
                        </div>
                    ) : error ? (
                        <div className="flex flex-col items-center justify-center py-12 gap-4 text-center">
                            <AlertCircle size={40} className="text-red-500" />
                            <p className="font-bold text-red-600">{error}</p>
                        </div>
                    ) : !product ? (
                        <div className="py-10 text-center text-slate-500">{t('errors.notFound')}</div>
                    ) : (
                        <>
                            <div className="rounded-xl border p-4 shadow-sm bg-muted/10">
                                <div className="flex gap-4">
                                    <div className="w-20 h-20 shrink-0 rounded-xl overflow-hidden bg-slate-100 dark:bg-slate-800 flex items-center justify-center border">
                                        {mainImage ? (
                                            <img src={avatarSrc(mainImage)} alt={product.name} className="w-full h-full object-cover" />
                                        ) : (
                                            <ImageIcon className="text-slate-400" />
                                        )}
                                    </div>
                                    <div>
                                        <h4 className="text-lg font-bold">{product.name}</h4>
                                        <div className="mt-2 flex flex-wrap gap-2">
                                            <Badge variant="outline" className="text-[10px]">{t('labels.id')}: {product.id}</Badge>
                                            <Badge variant="outline" className="text-[10px]">{t('labels.sku')}: {product.sku || na}</Badge>
                                            <Badge variant="secondary" className="text-[10px]">{product?.category?.name || na}</Badge>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div className="space-y-3">
                                <h5 className="text-sm font-semibold flex items-center gap-2">
                                    <Hash size={16} className="text-primary" />
                                    {t('labels.variants')} ({skus.length})
                                </h5>

                                {skus.length === 0 ? (
                                    <div className="text-sm text-muted-foreground py-4 text-center border rounded-lg border-dashed">
                                        {t('errors.skuNotFoundInSystem')}
                                    </div>
                                ) : (
                                    <div className="border rounded-xl overflow-hidden shadow-sm">
                                        <div className="overflow-x-auto">
                                            <table className="w-full text-sm">
                                                <thead className="bg-muted/50 border-b">
                                                    <tr>
                                                        <th className="px-4 py-3 text-start font-bold">{t('labels.sku')}</th>
                                                        <th className="px-4 py-3 text-center font-bold">{t('table.attributes')}</th>
                                                        <th className="px-4 py-3 text-center font-bold">{t('table.price')}</th>
                                                        <th className="px-4 py-3 text-center font-bold">{t('table.quantity')}</th>
                                                        <th className="px-4 py-3 text-end font-bold">{t('table.actions')}</th>
                                                    </tr>
                                                </thead>
                                                <tbody className="divide-y">
                                                    {skus.map((s) => {
                                                        const attrs = s?.attributes ? Object.entries(s.attributes) : [];
                                                        const avail = s?.available ?? Math.max(0, (s?.stockOnHand ?? 0) - (s?.reserved ?? 0));
                                                        const isCurrent = s.key === currentKey;

                                                        return (
                                                            <tr key={s.id} className={cn(
                                                                "hover:bg-muted/30 transition-colors",
                                                                isCurrent && "bg-primary/5"
                                                            )}>
                                                                <td className="px-4 py-3">
                                                                    <div className="flex items-center gap-2">
                                                                        <div className="font-bold text-slate-900 dark:text-slate-50">{s.sku || `#${s.id}`}</div>
                                                                        {isCurrent && (
                                                                            <Badge className="bg-primary/20 text-primary border-primary/30 text-[9px] h-4 px-1">
                                                                                {t('actions.selected')}
                                                                            </Badge>
                                                                        )}
                                                                    </div>
                                                                    <div className="text-[10px] text-muted-foreground font-mono mt-0.5">{s.key || na}</div>
                                                                </td>
                                                                <td className="px-4 py-3">
                                                                    <div className="flex flex-wrap gap-1 justify-center">
                                                                        {attrs.length === 0 ? (
                                                                            <span className="text-slate-400 text-xs">{na}</span>
                                                                        ) : (
                                                                            attrs.map(([k, v]) => (
                                                                                <Badge key={k} variant="outline" className="text-[10px] bg-white dark:bg-slate-900 px-1.5 py-0">
                                                                                    {k}: {String(v)}
                                                                                </Badge>
                                                                            ))
                                                                        )}
                                                                    </div>
                                                                </td>
                                                                <td className="px-4 py-3 text-center">
                                                                    <Badge className="bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-900/20 dark:text-emerald-200">
                                                                        {formatCurrency(s?.price || 0)}
                                                                    </Badge>
                                                                </td>
                                                                <td className="px-4 py-3 text-center">
                                                                    <div className="flex flex-col gap-1 items-center">
                                                                        <span className={cn("text-xs font-bold", avail > 0 ? "text-emerald-600" : "text-red-600")}>
                                                                            {avail} {t('common.items')}
                                                                        </span>
                                                                        {s.reserved > 0 && <span className="text-[10px] text-orange-500 font-medium">({s.reserved} {t('common.reserved')})</span>}
                                                                    </div>
                                                                </td>
                                                                <td className="px-4 py-3 text-end">
                                                                    <Button
                                                                        size="sm"
                                                                        className={cn(
                                                                            "h-8 font-bold",
                                                                            isCurrent ? "bg-slate-200 text-slate-500 hover:bg-slate-200" : ""
                                                                        )}
                                                                        onClick={() => onSelect(s)}
                                                                        disabled={!s.isActive || isCurrent}
                                                                    >
                                                                        {isCurrent ? t('actions.selected') : t('actions.select')}
                                                                    </Button>
                                                                </td>
                                                            </tr>
                                                        );
                                                    })}
                                                </tbody>
                                            </table>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </>
                    )}
                </div>
            </DialogContent>
        </Dialog>
    );
}

// ─────────────────────────────────────────────────────────────────────────────
// Main Page Component
// ─────────────────────────────────────────────────────────────────────────────
export default function FailedOrderDetailsPage() {
    const params = useParams();
    const id = params.id;
    const tCommon = useTranslations('common');
    const t = useTranslations('orders.failedOrders');
    const router = useRouter();
    const { formatCurrency } = usePlatformSettings();

    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [retrying, setRetrying] = useState(false);

    // Fix Mode States
    const [selectedSkus, setSelectedSkus] = useState([]);

    // External Modal State
    const [externalModal, setExternalModal] = useState({ isOpen: false, remoteId: null, provider: null });
    const [externalCache, setExternalCache] = useState({});

    // SKU Selector Modal State
    const [skuSelectorModal, setSkuSelectorModal] = useState({
        isOpen: false,
        productId: null,
        cartItemIdx: null,
        currentKey: null,
        loading: false,
        product: null,
        error: null
    });

    const [updatingPayload, setUpdatingPayload] = useState(false);

    // 1. Fetch Data
    const fetchData = useCallback(async () => {
        setLoading(true);
        try {
            const res = await api.get(`/stores/failed-orders/${id}`);
            const result = res.data;
            setData(result);

            // Auto-select OOS SKUs
            const oosSkus = result?.problems
                ?.filter((p) => p.code === WebhookOrderProblem.INSUFFICIENT_STOCK)
                .map((p) => p.sku)
                .filter(Boolean);
            setSelectedSkus(oosSkus || []);
        } catch (err) {
            const message = error?.response?.data?.message || t('errors.fetchFailed');
            toast.error(message);
        } finally {
            setLoading(false);
        }
    }, [id, t]);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    const failure = data?.failureLog;
    const isSuccess = failure?.status === 'success';
    const problems = data?.problems || [];
    const payload = failure?.payload;

    // 2. Actions
    const handleRetry = async () => {
        setRetrying(true);
        try {
            await api.post(`/stores/failed-orders/${id}/retry`);
            toast.success(t('messages.retrySuccess'));
            fetchData();
        } catch (error) {
            const message = error?.response?.data?.message || t('messages.retryFailed');
            toast.error(message);
        } finally {
            setRetrying(false);
        }
    };

    const handleCreatePurchaseOrder = () => {
        if (selectedSkus.length === 0) return toast.error(t('errors.noSkusSelected'));
        router.push(`/purchases/new?skus=${selectedSkus.join(',')}`);
    };

    const handleFetchExternalProduct = async (remoteId, provider) => {
        if (externalCache[remoteId]?.data || externalCache[remoteId]?.loading) return;
        try {
            setExternalCache(prev => ({ ...prev, [remoteId]: { loading: true } }));
            const res = await api.get(`/stores/external/${provider}?id=${remoteId}`);
            setExternalCache(prev => ({ ...prev, [remoteId]: { loading: false, data: res.data } }));
        } catch (err) {
            setExternalCache(prev => ({ ...prev, [remoteId]: { loading: false, error: true } }));
            toast.error(normalizeAxiosError(err) || t('errors.externalFetchFailed'));
        }
    };

    const handleOpenSkuSelector = async (productId, cartItemIdx, currentKey) => {
        setSkuSelectorModal({
            isOpen: true,
            productId,
            cartItemIdx,
            currentKey,
            loading: true,
            product: null,
            error: null
        });

        try {
            const res = await api.get(`/products/${productId}`);
            setSkuSelectorModal(prev => ({ ...prev, loading: false, product: res.data }));
        } catch (err) {
            setSkuSelectorModal(prev => ({ ...prev, loading: false, error: normalizeAxiosError(err) }));
            toast.error(normalizeAxiosError(err) || t('errors.fetchProductFailed'));
        }
    };

    const handleSelectNewSku = async (variant) => {
        const { cartItemIdx } = skuSelectorModal;
        if (cartItemIdx === null || !payload) return;

        setUpdatingPayload(true);
        const toastId = toast.loading(t('messages.updatingPayload'));

        try {
            // Clone payload to avoid direct mutation
            const newPayload = JSON.parse(JSON.stringify(payload));
            const item = newPayload.cartItems[cartItemIdx];

            // Update item with new variant details
            item.variant = {
                ...item.variant,
                key: variant.key,
                sku: variant.sku,
                variation_props: Object.entries(variant.attributes || {}).map(([name, value]) => ({
                    name,
                    value
                }))
            };

            // Send to backend
            await api.patch(`/stores/failed-orders/${id}`, newPayload);

            toast.success(t('messages.payloadUpdated'), { id: toastId });
            setSkuSelectorModal({ isOpen: false, productId: null, cartItemIdx: null, loading: false, product: null, error: null });
            fetchData();
        } catch (err) {
            toast.error(normalizeAxiosError(err) || t('messages.updatePayloadFailed'), { id: toastId });
        } finally {
            setUpdatingPayload(false);
        }
    };

    // 3. Table Columns Definition
    const itemColumns = useMemo(() => [
        {
            key: "product",
            header: t('table.product'),
            cell: (row) => (
                <div>
                    <div className="font-bold text-slate-900 dark:text-white leading-tight">{row.name}</div>
                    <div className="text-[10px] text-slate-400 mt-1 uppercase tracking-wider flex items-center gap-1">
                        <ExternalLink className="w-3 h-3" /> {t('labels.slug')}: {row.productSlug}
                    </div>
                </div>
            )
        },
        {
            key: "variants",
            header: t('table.options'),
            cell: (row) => {
                const props = row.variant?.variation_props || [];

                return (
                    <div className="flex flex-wrap items-center gap-1.5">
                        {props.length === 0 ? (
                            <span className="text-slate-400 text-xs italic">
                                {t('table.noOptions')}
                            </span>
                        ) : (
                            <>
                                {props.map((prop, idx) => (
                                    <Badge
                                        key={idx}
                                        className="rounded-full bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-200 whitespace-nowrap font-medium text-[10px] border-none"
                                    >
                                        <span className="opacity-70 mr-1">
                                            {prop.name.replace(/_/g, ' ')}:
                                        </span>
                                        {prop.value.replace(/_/g, ' ')}
                                    </Badge>
                                ))}

                            </>
                        )}
                    </div>
                );
            }
        },
        {
            key: "sku",
            header: "SKU",
            cell: (row) => (
                <span className="inline-flex items-center px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-slate-800">
                    {row.variant?.sku || "-"}
                </span>
            )
        },
        {
            key: "quantity",
            header: t('table.quantity'),
            cell: (row) => (
                <span className="inline-flex items-center px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 font-bold">
                    {row.quantity}
                </span>
            )
        },
        {
            key: "total",
            header: t('table.total'),
            cell: (row) => (
                <span className="font-bold text-primary">
                    {formatCurrency(row.quantity * row.price)}
                </span>
            )
        },
        {
            key: "problem",
            header: t('table.problem'),
            cell: (row) => {
                const problem = problems.find(p => p.slug === row.productSlug && p.key === row.variant.key);

                if (problem && !isSuccess) {
                    return (
                        <div className="flex items-center gap-1.5 text-xs font-bold text-red-600 bg-red-50 px-2 py-1 rounded-md w-fit">
                            <AlertCircle className="w-3.5 h-3.5" />
                            {t(`problems.${problem.code}`)}
                        </div>
                    );
                }
                return (
                    <div className="flex items-center gap-1.5 text-xs font-bold text-green-600 bg-green-50 px-2 py-1 rounded-md w-fit">
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        {t('actions.alreadySuccess')}
                    </div>
                );
            }
        },

        {
            key: "actions",
            header: t('table.actions'),
            cell: (row, i) => {
                const problem = problems.find(p => p.slug === row.productSlug && p.key === row.variant.key);

                const remoteId = row?.remoteProductId || problem?.remoteId;
                const provider = failure?.store?.provider;
                const cartItemIdx = i;

                // if (failure.status === 'success') return [];
                // Build dynamic actions based on problem
                let actions = [];

                actions.push({
                    icon: <Eye size={16} />,
                    tooltip: t('actions.fetchExternalDetails'),
                    variant: "warning",
                    onClick: () => setExternalModal({ isOpen: true, remoteId, provider: failure?.store?.provider })
                });

                if (problem?.code === WebhookOrderProblem.PRODUCT_NOT_FOUND) {
                    actions.push({
                        icon: <Store size={16} />,
                        tooltip: t('actions.createProduct'),
                        variant: "outline",
                        permission: "orders.restoreFailed",
                        onClick: () => router.push(`/products/external/${provider}?id=${remoteId}`)
                    });
                }
                const localProductId = row.variant?.localProductId || problem?.productId;
                if (localProductId) {
                    actions.push({
                        icon: <RefreshCw size={16} />,
                        tooltip: t('actions.chooseDifferentSku'),
                        variant: "info",
                        disabled: isSuccess,
                        permission: "orders.restoreFailed",
                        onClick: () => handleOpenSkuSelector(localProductId, cartItemIdx, row.variant?.key)
                    });
                }
                if (problem?.code === WebhookOrderProblem.SKU_NOT_FOUND || problem?.code === WebhookOrderProblem.SKU_INACTIVE) {
                    // Option to choose a different SKU from the same product


                    actions.push({
                        icon: <Edit size={16} />,
                        tooltip: t('actions.editProductAndAddVariant'),
                        variant: "primary",
                        permission: "orders.restoreFailed",
                        onClick: () => router.push(`/products/edit/${row.variant?.localProductId || problem.productId}`)
                    });
                }

                if (problem?.code === WebhookOrderProblem.PRODUCT_INACTIVE) {
                    actions.push({
                        icon: <Edit size={16} />,
                        tooltip: t('actions.reactivateProduct'),
                        variant: "primary",
                        permission: "orders.restoreFailed",
                        onClick: async (r) => {
                            const toastId = toast.loading(t("common.loading"));

                            try {
                                await api.patch(`/products/${r.id}/restore`);

                                toast.success(t("actions.restored"), { id: toastId });

                                // reload products
                                await fetchData();
                            } catch (e) {
                                toast.error(normalizeAxiosError(e), { id: toastId });
                            }
                        },
                    });
                }

                return (
                    <div className="flex items-center gap-3">
                        {actions.length > 0 && <ActionButtons row={row} actions={actions} />}

                        {/* Render Checkbox manually for INSUFFICIENT_STOCK */}
                        {problem?.code === WebhookOrderProblem.INSUFFICIENT_STOCK && (
                            <label className="flex items-center gap-2 px-2 py-1.5 rounded-lg border bg-muted/30 cursor-pointer hover:bg-muted/50 transition-colors">
                                <Checkbox
                                    checked={selectedSkus.includes(problem.sku)}
                                    onCheckedChange={(checked) => {
                                        setSelectedSkus(prev =>
                                            checked ? [...prev, problem.sku] : prev.filter(s => s !== problem.sku)
                                        );
                                    }}
                                />
                                <span className="text-[10px] font-bold uppercase">{t('actions.includeInPurchaseOrder')}</span>
                            </label>
                        )}
                    </div>
                );
            }
        }
    ], [problems, selectedSkus, t, formatCurrency, failure, isSuccess]);


    // 4. Render Loading / Error
    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="text-center">
                    <Loader2 className="w-12 h-12 animate-spin text-primary mx-auto mb-4" />
                    <p className="text-slate-600 font-medium">{t("common.loading")}</p>
                </div>
            </div>
        );
    }

    if (!failure) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="text-center flex flex-col items-center gap-4 text-muted-foreground">
                    <PackageX className="w-16 h-16 opacity-30" />
                    <p className="text-lg font-bold">{t("errors.notFound")}</p>
                    <Button variant="outline" onClick={() => router.back()}>{tCommon('back')}</Button>
                </div>
            </div>
        );
    }

    const isRetryDisabled = problems.length > 0 || retrying || isSuccess;

    const statusMap = {
        pending: {
            variant: "outline",
            className: "border-amber-500 text-amber-600 bg-amber-50",
            icon: <Clock className="w-3 h-3" />
        },
        retrying: {
            variant: "default",
            className: "bg-blue-600 text-white animate-pulse",
            icon: <RefreshCw className="w-3 h-3 animate-spin" />
        },
        success: {
            variant: "secondary",
            className: "bg-emerald-600 text-white",
            icon: <CheckCircle2 className="w-3 h-3" />
        },
        failed: {
            variant: "destructive",
            className: "font-black",
            icon: <AlertCircle className="w-3 h-3" />
        },
    };
    const config = statusMap[failure?.status] || statusMap.pending;
    return (
        <div className="min-h-screen p-5 space-y-6">
            <PageHeader
                breadcrumbs={[
                    { name: t("breadcrumb.home"), href: "/dashboard" },
                    { name: t("breadcrumb.failedOrders"), href: "/orders?tab=failedOrders" },
                    { name: `${payload?.fullName || id}` }
                ]}
                buttons={
                    <Button_
                        onClick={handleRetry}
                        disabled={isRetryDisabled}
                        permission="orders.restoreFailed"
                        icon={retrying ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <RefreshCw className="w-4 h-4 mr-2" />}
                        label={t('actions.retryOrder')}
                    />

                }
            />


            {/* Cards Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

                {/* 1. Failure Details Card */}
                <Card className="shadow-sm">
                    <CardHeader className="pb-3 border-b border-border/50 bg-muted/10">
                        <CardTitle className="flex items-center gap-2 text-base">
                            <AlertTriangle className="w-5 h-5 text-orange-500" />
                            {t('sections.failureDetails')}
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="p-0! grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div className="p-3 rounded-xl border bg-muted/5">
                            <p className="text-xs text-muted-foreground mb-1 font-semibold">{t('details.status')}</p>
                            <Badge
                                variant={config.variant}
                                className={cn("uppercase text-[10px] flex items-center gap-1 w-fit", config.className)}
                            >
                                {config.icon}
                                {failure.status}
                            </Badge>
                        </div>
                        <div className="p-3 rounded-xl border bg-muted/5">
                            <p className="text-xs text-muted-foreground mb-1 font-semibold">{t('labels.attempts')}</p>
                            <p className="font-bold flex items-center gap-1.5"><RefreshCw className="w-3.5 h-3.5 text-primary" /> {failure.attempts}</p>
                        </div>
                        <div className="p-3 rounded-xl border bg-muted/5">
                            <p className="text-xs text-muted-foreground mb-1 font-semibold">{t('details.date')}</p>
                            <p className="font-bold text-sm flex items-center gap-1.5"><Clock className="w-3.5 h-3.5 text-primary" /> {formatDate(failure.created_at)}</p>
                        </div>
                        <div className="p-3 rounded-xl border bg-muted/5">
                            <p className="text-xs text-muted-foreground mb-1 font-semibold">{t('details.store')}</p>
                            <p className="font-bold text-sm flex items-center gap-1.5 truncate"><Store className="w-3.5 h-3.5 text-primary shrink-0" /> {failure.store?.name}</p>
                        </div>
                        {isRetryDisabled && !isSuccess && !retrying ? (
                            <div className="col-span-full p-4 rounded-xl border border-amber-200 bg-amber-50/50 dark:border-amber-900/30 dark:bg-amber-950/10 flex items-start gap-3 shadow-sm">
                                <ShieldAlert className="w-5 h-5 text-amber-600 dark:text-amber-500 shrink-0 mt-0.5" />
                                <div className="space-y-1">
                                    <p className="text-sm font-bold text-amber-800 dark:text-amber-400">
                                        {t('messages.reviewIssuesTitle')}
                                    </p>
                                    <p className="text-xs text-amber-700/80 dark:text-amber-500/80 leading-relaxed font-medium">
                                        {t('messages.reviewIssuesDescription')}
                                    </p>
                                </div>
                            </div>
                        ) : !isSuccess && !retrying ? (
                            <div className="col-span-full p-4 rounded-xl border border-emerald-200 bg-emerald-50/50 dark:border-emerald-900/30 dark:bg-emerald-950/10 flex items-start gap-3 shadow-sm">
                                <CheckCircle2 className="w-5 h-5 text-emerald-600 dark:text-emerald-500 shrink-0 mt-0.5" />
                                <div className="space-y-1">
                                    <p className="text-sm font-bold text-emerald-800 dark:text-emerald-400">
                                        {t('messages.orderReadyTitle')}
                                    </p>
                                    <p className="text-xs text-emerald-700/80 dark:text-emerald-500/80 leading-relaxed font-medium">
                                        {t('messages.orderReadyDescription')}
                                    </p>
                                </div>
                            </div>
                        ) : null}
                    </CardContent>
                </Card>

                {/* 2. Client Details Card */}
                <Card className="shadow-sm">
                    <CardHeader className="pb-3 border-b border-border/50 bg-muted/10">
                        <CardTitle className="flex items-center gap-2 text-base">
                            <User className="w-5 h-5 text-blue-500" />
                            {t('sections.clientDetails')}
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="p-0! grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div className="p-3 rounded-xl border bg-muted/5">
                            <p className="text-xs text-muted-foreground mb-1 font-semibold">{t('labels.name')}</p>
                            <p className="font-bold text-sm truncate">{payload?.fullName || '—'}</p>
                        </div>
                        <div className="p-3 rounded-xl border bg-muted/5">
                            <p className="text-xs text-muted-foreground mb-1 font-semibold">{t('labels.phone')}</p>
                            <p className="font-bold text-sm flex items-center gap-1.5 truncate font-mono"><Phone className="w-3.5 h-3.5 text-primary" /> {payload?.phone || '—'}</p>
                        </div>
                        <div className="col-span-full p-3 rounded-xl border bg-muted/5">
                            <p className="text-xs text-muted-foreground mb-1 font-semibold">{t('labels.email')}</p>
                            <p className="font-bold text-sm flex items-center gap-1.5 truncate"><Mail className="w-3.5 h-3.5 text-primary" /> {payload?.email || '—'}</p>
                        </div>
                        <div className="col-span-full p-3 rounded-xl border bg-muted/5">
                            <p className="text-xs text-muted-foreground mb-1 font-semibold">{t('labels.address')}</p>
                            <p className="font-bold text-wrap text-sm flex items-start gap-1.5 leading-relaxed">
                                <MapPin className="w-3.5 h-3.5 text-primary mt-0.5 shrink-0" />
                                {payload?.government ? `${payload.government}, ` : ''}{payload?.address || '—'}
                            </p>
                        </div>
                    </CardContent>
                </Card>

                {/* 3. Order Summary Card */}
                <Card className="shadow-sm">
                    <CardHeader className="pb-3 border-b border-border/50 bg-muted/10">
                        <CardTitle className="flex items-center gap-2 text-base">
                            <ShoppingCart className="w-5 h-5 text-emerald-500" />
                            {t('sections.orderDetails')}
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="p-0! grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div className="p-3 rounded-xl border bg-muted/5">
                            <p className="text-xs text-muted-foreground mb-1 font-semibold">{t('labels.paymentMethod')}</p>
                            <Badge variant="outline" className="font-bold">
                                <CreditCard className="w-3 h-3 mr-1" />
                                {payload?.paymentMethod === "cod" ? t('labels.paymentMethods.cod') : payload?.paymentMethod || "—"}
                            </Badge>
                        </div>
                        <div className="p-3 rounded-xl border bg-muted/5">
                            <p className="text-xs text-muted-foreground mb-1 font-semibold">{t('labels.paymentStatus')}</p>
                            <p className="font-bold text-sm uppercase">{payload?.paymentStatus || '—'}</p>
                        </div>
                        <div className="p-3 rounded-xl border bg-muted/5">
                            <p className="text-xs text-muted-foreground mb-1 font-semibold">{t('labels.orderStatus')}</p>
                            <p className="font-bold text-sm uppercase">{payload?.status || '—'}</p>
                        </div>
                        <div className="p-3 rounded-xl border bg-muted/5">
                            <p className="text-xs text-muted-foreground mb-1 font-semibold">{t('labels.shippingCost')}</p>
                            <p className="font-bold text-sm text-slate-700 dark:text-slate-300">{formatCurrency(payload?.shippingCost || 0)}</p>
                        </div>
                        <div className="p-3 rounded-xl border bg-emerald-50 dark:bg-emerald-950/10 border-emerald-100">
                            <p className="text-xs text-emerald-600 dark:text-emerald-400 mb-1 font-bold">{t('labels.total')}</p>
                            <p className="font-black text-lg text-emerald-700 dark:text-emerald-300">{formatCurrency(payload?.totalCost || 0)}</p>
                        </div>
                    </CardContent>
                </Card>

            </div>

            {/* Items Table Section */}
            <Card className="shadow-sm gap-0 p-0!">
                <CardHeader className="flex flex-row items-center justify-between py-4 border-b border-border/50 bg-muted/10">
                    <CardTitle className="flex items-center gap-2 text-base">
                        <Package className="w-5 h-5 text-indigo-500" />
                        {t('sections.itemsDetails')}
                    </CardTitle>
                    {selectedSkus.length > 0 && !isSuccess && (
                        <Button size="sm" onClick={handleCreatePurchaseOrder} className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold">
                            <Plus className="w-4 h-4 mr-1.5" />
                            {t('actions.createPOForSelected')} ({selectedSkus.length})
                        </Button>
                    )}
                </CardHeader>
                <div className="p-0">
                    <Table
                        columns={itemColumns}
                        data={payload?.cartItems || []}
                        isLoading={loading}
                        hasFilters={false}
                        flat={true}
                        hasSearch={false}
                    />
                </div>
            </Card>

            {/* External Product Modal */}
            <ExternalProductModal
                isOpen={externalModal.isOpen}
                onClose={() => setExternalModal({ isOpen: false, remoteId: null, provider: null })}
                remoteId={externalModal.remoteId}
                provider={externalModal.provider}
                cache={externalCache[externalModal.remoteId]}
                onFetch={handleFetchExternalProduct}
                formatCurrency={formatCurrency}
            />

            {/* SKU Selector Modal */}
            <SkuSelectorModal
                isOpen={skuSelectorModal.isOpen}
                onClose={() => setSkuSelectorModal(prev => ({ ...prev, isOpen: false }))}
                product={skuSelectorModal.product}
                loading={skuSelectorModal.loading}
                error={skuSelectorModal.error}
                currentKey={skuSelectorModal.currentKey}
                onSelect={handleSelectNewSku}
            />
        </div>
    );
}