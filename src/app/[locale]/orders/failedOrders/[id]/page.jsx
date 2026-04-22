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
    Mail
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
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";

import PageHeader from "@/components/atoms/Pageheader";
import Table from "@/components/atoms/Table";
import ActionButtons from "@/components/atoms/Actions";
import { convert } from "html-to-text";
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

//expense - description - categories

// ─────────────────────────────────────────────────────────────────────────────
// External Product Modal Component
// ─────────────────────────────────────────────────────────────────────────────
function ExternalProductModal({ isOpen, onClose, remoteId, provider, cache, onFetch, formatCurrency }) {
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
                                        <Badge variant="outline">SKU: {cache.data.sku}</Badge>
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
                                                    <th className="px-3 py-2 text-start font-semibold">SKU</th>
                                                    <th className="px-3 py-2 text-end font-semibold">{t('table.price')}</th>
                                                    <th className="px-3 py-2 text-end font-semibold">{t('table.quantity')}</th>
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y">
                                                {cache.data.variants.map((v, i) => (
                                                    <tr key={i} className="hover:bg-muted/30">
                                                        <td className="px-3 py-2">
                                                            <div className="flex flex-wrap gap-1">
                                                                {v.variation_props?.map((p, idx) => (
                                                                    <span key={idx} className="px-2 py-0.5 rounded text-xs bg-accent">{p.variation_prop}</span>
                                                                ))}
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
            toast.error(t('errors.fetchFailed'));
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
            toast.error(t('messages.retryFailed'));
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
            const res = await api.get(`/stores/external/${provider}/${remoteId}`);
            setExternalCache(prev => ({ ...prev, [remoteId]: { loading: false, data: res.data } }));
        } catch (err) {
            setExternalCache(prev => ({ ...prev, [remoteId]: { loading: false, error: true } }));
            toast.error(t('errors.externalFetchFailed'));
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
                        <ExternalLink className="w-3 h-3" /> Slug: {row.productSlug}
                    </div>
                </div>
            )
        },
        {
            key: "options",
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
                                {props.slice(0, 3).map((prop, idx) => (
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

                                {props.length > 3 && (
                                    <Badge className="rounded-full bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400 text-[10px] border-none">
                                        +{props.length - 3}
                                    </Badge>
                                )}
                            </>
                        )}
                    </div>
                );
            }
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
            cell: (row) => {
                const problem = problems.find(p => p.slug === row.productSlug && p.key === row.variant.key);

                const remoteId = row?.remoteProductId || problem?.remoteId;
                const provider = failure?.store?.provider;
                if (failure.status === 'success') return [];
                // Build dynamic actions based on problem
                let actions = [];

                actions.push({
                    icon: <ExternalLink size={16} />,
                    tooltip: t('actions.fetchExternalDetails'),
                    variant: "warning",
                    onClick: () => setExternalModal({ isOpen: true, remoteId, provider: failure?.store?.provider })
                });
                if (problem?.code === WebhookOrderProblem.PRODUCT_NOT_FOUND) {
                    actions.push({
                        icon: <Store size={16} />,
                        tooltip: t('actions.createProduct'),
                        variant: "outline",
                        onClick: () => router.push(`/products/${provider}/${remoteId}`)
                    });
                }

                if (problem?.code === WebhookOrderProblem.SKU_NOT_FOUND) {
                    actions.push({
                        icon: <Edit size={16} />,
                        tooltip: t('actions.editProductAndAddVariant'),
                        variant: "primary",
                        onClick: () => router.push(`/products/edit/${row.variant?.localProductId || problem.productId}`)
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

    const isRetryDisabled = problems.length > 0 || retrying;

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
                    { name: t("breadcrumb.home"), href: "/" },
                    { name: t("breadcrumb.failedOrders"), href: "/orders?tab=failedOrders" },
                    { name: `${payload?.fullName || id}` }
                ]}
                buttons={
                    <Button
                        onClick={handleRetry}
                        disabled={isRetryDisabled}
                        className={cn(
                            "shadow-lg font-bold",
                            isRetryDisabled ? "bg-muted text-muted-foreground shadow-none" : "bg-primary text-primary-foreground hover:bg-primary/90"
                        )}
                    >
                        {retrying ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <RefreshCw className="w-4 h-4 mr-2" />}
                        {t('actions.retryOrder')}
                    </Button>
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
                    <CardContent className="pt-4 grid grid-cols-1 sm:grid-cols-2 gap-3">
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
                        <div className="col-span-full p-3 rounded-xl border border-red-500 bg-red-50  dark:bg-red-950/10">
                            <p className="text-xs text-red-700 dark:text-red-300 mb-1 font-semibold">{t('labels.failureReason')}</p>
                            <p className="font-bold text-red-700 dark:text-red-300 text-wrap text-sm flex items-center gap-1.5 truncate"><Mail className="w-3.5 h-3.5 text-primary" /> {failure.reason || t('common.unknownError')}</p>
                        </div>
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
                    <CardContent className="pt-4 grid grid-cols-1 sm:grid-cols-2 gap-3">
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
                    <CardContent className="pt-4 grid grid-cols-1 sm:grid-cols-2 gap-3">
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
            <Card className="shadow-sm gap-0">
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
        </div>
    );
}