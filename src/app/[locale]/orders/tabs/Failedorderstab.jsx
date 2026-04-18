"use client";

import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { motion, AnimatePresence } from "framer-motion";
import ActionButtons from "@/components/atoms/Actions";
import {
  Download,
  Loader2,
  RefreshCcw,
  Clock,
  CheckCircle,
  XCircle,
  AlertTriangle,
  RotateCcw,
  Store,
  AlertCircle,
  PackageX,
  ShoppingBag,
  Eye,
  Wrench,
  Package,
  FileJson,
  CheckCircle2,
  X,
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
  FileText
} from "lucide-react";
import { useTranslations } from "next-intl";
import { cn } from "@/utils/cn";
import toast from "react-hot-toast";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
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
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Input } from "@/components/ui/input";


// ── Shared Table system ──────────────────────────────────────────────────────
import Table, { FilterField } from "@/components/atoms/Table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import PageHeader from "@/components/atoms/Pageheader";
import Button_ from "@/components/atoms/Button";
import { useSocket } from "@/context/SocketContext";
import DateRangePicker from "@/components/atoms/DateRangePicker";
import { useDebounce } from "@/hook/useDebounce";
import { useRouter } from "@/i18n/navigation";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Bone } from "@/components/atoms/BannerSkeleton";
import { Label } from "@/components/ui/label";
import { usePlatformSettings } from "@/context/PlatformSettingsContext";

// ─────────────────────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────────────────────
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

// ─────────────────────────────────────────────────────────────────────────────
// Failure Details Modal Skeleton
// ─────────────────────────────────────────────────────────────────────────────
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

function FailedOrderDetailsModal({
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
  const handleFetchExternalProduct = async (slug, provider) => {
    setExpandedExternal(prev => ({ ...prev, [slug]: !prev[slug] }));

    if (externalCache[slug]?.data || externalCache[slug]?.loading) return;

    setExternalCache(prev => ({ ...prev, [slug]: { loading: true } }));
    try {
      const res = await api.get(`/stores/external/${provider}/${slug}`);
      setExternalCache(prev => ({ ...prev, [slug]: { loading: false, data: res.data } }));
    } catch (err) {
      setExternalCache(prev => ({ ...prev, [slug]: { loading: false, error: true } }));
      toast.error(t('errors.externalFetchFailed'));
    }
  };

  const handleCreatePurchaseOrder = () => {
    if (selectedSkus.length === 0) return toast.error(t('errors.noSkusSelected'));
    router.push(`/purchases/new?skus=${selectedSkus.join(',')}`);
  };

  // 5. Render Helpers
  const renderExternalProductDetails = (slug, provider) => {
    const cache = externalCache[slug];
    const isExpanded = expandedExternal[slug];

    return (
      <div className="mt-2 border border-gray-200 dark:border-slate-700 rounded-lg overflow-hidden bg-gray-50 dark:bg-slate-900/50">
        <button
          onClick={() => handleFetchExternalProduct(slug, provider)}
          className="w-full px-3 py-2 flex items-center justify-between text-xs font-bold text-slate-700 hover:bg-gray-100 dark:text-slate-300 dark:hover:bg-slate-800 transition-colors"
        >
          <span className="flex items-center gap-2">
            <ExternalLink className="w-3.5 h-3.5" />
            {t('actions.fetchExternalDetails')}
          </span>
          {isExpanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
        </button>

        <AnimatePresence>
          {isExpanded && (
            <motion.div initial={{ height: 0 }} animate={{ height: 'auto' }} exit={{ height: 0 }} className="overflow-hidden">
              <div className="p-3 border-t border-gray-200 dark:border-slate-700 text-sm">
                {cache?.loading ? (
                  <div className="flex items-center justify-center py-4 text-slate-500 animate-pulse font-bold">
                    <Loader2 className="w-4 h-4 animate-spin mr-2" />
                    {t('common.loading')}...
                  </div>
                ) : cache?.error ? (
                  <div className="text-red-500 text-center py-2 font-bold">{t('errors.failedToLoadData')}</div>
                ) : cache?.data ? (
                  <div className="space-y-3">
                    <div className="flex items-start gap-3">
                      <div className="w-12 h-12 rounded-lg border-2 border-gray-200 dark:border-slate-700 overflow-hidden shrink-0">
                        <img src={cache.data.thumb || '/placeholder.png'} alt={cache.data.name} className="w-full h-full object-cover" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-bold text-slate-800 dark:text-slate-200 truncate">{cache.data.name}</p>
                        <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wider mt-1">SKU: {cache.data.sku} | Qty: {cache.data.quantity}</p>
                      </div>
                    </div>
                    <Button
                      size="sm"
                      className="w-full gap-2 rounded-xl font-bold"
                      onClick={() => router.push(`/products/${provider}/${slug}`)}
                    >
                      <Plus className="w-4 h-4" />
                      {t('actions.createProduct')}
                    </Button>
                  </div>
                ) : null}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
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
                        const problem = problems.find(p => p.slug === item.productSlug || p.sku === item.variant?.sku);
                        return (
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
                                      onClick={() => handleFetchExternalProduct(problem.slug, failure?.store?.provider)}
                                    >
                                      <ExternalLink className="w-3 h-3 mr-1" />
                                      {t('actions.fetchExternalDetails')}
                                    </Button>
                                  )}

                                  {problem.code === WebhookOrderProblem.SKU_NOT_FOUND && (
                                    <Button
                                      size="xs"
                                      variant="outline"
                                      className="h-7 text-[9px] font-black uppercase tracking-tighter rounded-lg border-2 border-red-200 hover:bg-red-50"
                                      onClick={() => router.push(`/products/edit/${problem.productId || problem.slug}`)}
                                    >
                                      {t('actions.editProduct')}
                                      <ArrowRight className="w-3 h-3 ml-1" />
                                    </Button>
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

// ─────────────────────────────────────────────────────────────────────────────
// Failed-order status config
// Maps OrderFailStatus enum → display props
// ─────────────────────────────────────────────────────────────────────────────
const FAIL_STATUS_CONFIG = {
  pending: {
    color: "#f59e0b",
    bgClass: "bg-amber-50 dark:bg-amber-950/30",
    textClass: "text-amber-700 dark:text-amber-400",
    borderClass: "border-amber-200 dark:border-amber-800",
    icon: Clock,
    labelKey: "failedOrders.statuses.pending",
  },
  retrying: {
    color: "#3b82f6",
    bgClass: "bg-blue-50 dark:bg-blue-950/30",
    textClass: "text-blue-700 dark:text-blue-400",
    borderClass: "border-blue-200 dark:border-blue-800",
    icon: RefreshCcw,
    labelKey: "failedOrders.statuses.retrying",
  },
  success: {
    color: "#10b981",
    bgClass: "bg-emerald-50 dark:bg-emerald-950/30",
    textClass: "text-emerald-700 dark:text-emerald-400",
    borderClass: "border-emerald-200 dark:border-amber-800",
    icon: CheckCircle,
    labelKey: "failedOrders.statuses.success",
  },
  failed: {
    color: "#ef4444",
    bgClass: "bg-red-50 dark:bg-red-950/30",
    textClass: "text-red-700 dark:text-red-400",
    borderClass: "border-red-200 dark:border-red-800",
    icon: XCircle,
    labelKey: "failedOrders.statuses.failed",
  },
};

// ─────────────────────────────────────────────────────────────────────────────
// Stats card definition  (icons + colors match ReplacementTab's REPLACEMENT_STATS)
// ─────────────────────────────────────────────────────────────────────────────
const FAILED_STATS_TEMPLATE = [
  // {
  //     id: 1,
  //     code: "total",
  //     title: "failedOrders.stats.total",
  //     color: "var(--primary)",
  //     darkColor: "#5b4bff",
  //     icon: PackageX,
  // },
  {
    id: 2,
    code: "pending",
    title: "failedOrders.stats.pending",
    color: "#f59e0b",
    darkColor: "#f59e0b",
    icon: Clock,
  },
  {
    id: 3,
    code: "retrying",
    title: "failedOrders.stats.retrying",
    color: "#3b82f6",
    darkColor: "#3b82f6",
    icon: RefreshCcw,
  },
  {
    id: 4,
    code: "success",
    title: "failedOrders.stats.success",
    color: "#10b981",
    darkColor: "#10b981",
    icon: CheckCircle,
  },
  {
    id: 5,
    code: "failed",
    title: "failedOrders.stats.failed",
    color: "#ef4444",
    darkColor: "#ef4444",
    icon: XCircle,
  },
];

// ─────────────────────────────────────────────────────────────────────────────
// FailStatusBadge — mirrors StatusBadge from ReplacementTab
// ─────────────────────────────────────────────────────────────────────────────
function FailStatusBadge({ status, t }) {
  if (!status) return <span className="text-muted-foreground text-xs">—</span>;
  const cfg = FAIL_STATUS_CONFIG[status] ?? {
    color: "#888",
    bgClass: "bg-muted",
    textClass: "text-muted-foreground",
    borderClass: "border-border",
    icon: AlertCircle,
    labelKey: null,
  };
  const Icon = cfg.icon;
  const label = cfg.labelKey ? t(cfg.labelKey) : status;

  return (
    <Badge
      className={cn(
        "rounded-xl px-2.5 py-1 text-xs font-semibold border flex items-center gap-1.5 w-fit",
        cfg.bgClass,
        cfg.textClass,
        cfg.borderClass,
      )}
      style={{ borderColor: `${cfg.color}44`, color: cfg.color }}
    >
      <Icon size={11} className="shrink-0" />
      {label}
    </Badge>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// ErrorReasonCell — shows the failure reason in a readable way
// ─────────────────────────────────────────────────────────────────────────────
function ErrorReasonCell({ row }) {
  const reason = row.errorReason ?? row.reason ?? row.error ?? null;
  if (!reason) return <span className="text-muted-foreground text-xs">—</span>;

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <div className="flex items-start gap-1.5 max-w-[200px] cursor-default">
            <AlertTriangle
              size={13}
              className="text-amber-500 shrink-0 mt-0.5"
            />
            <p className="text-xs text-foreground line-clamp-2 leading-snug">
              {reason}
            </p>
          </div>
        </TooltipTrigger>
        <TooltipContent className="max-w-xs text-xs leading-relaxed">
          {reason}
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Main Tab Component
// ─────────────────────────────────────────────────────────────────────────────
export function FailedOrdersTab() {
  const t = useTranslations("orders");
  const { subscribe } = useSocket();
  const [search, setSearch] = useState("");
  const { debouncedValue: debouncedSearch } = useDebounce({ value: search })
  // ── State ────────────────────────────────────────────────────────────────
  const [loading, setLoading] = useState(false);
  const [exportLoading, setExportLoading] = useState(false);
  const [statsLoading, setStatsLoading] = useState(true);
  const [stats, setStats] = useState({
    pending: 0,
    retrying: 0,
    success: 0,
    failed: 0,
    total: 0,
  });

  const [pager, setPager] = useState({
    total_records: 0,
    current_page: 1,
    per_page: 12,
    records: [],
  });

  const [filters, setFilters] = useState({
    status: "all",
    storeId: "all",
    startDate: null,
    endDate: null,
  });

  const [stores, setStores] = useState([]);

  // ── Fetch statistics ─────────────────────────────────────────────────────
  const fetchStats = useCallback(async () => {
    setStatsLoading(true);
    try {
      const { data } = await api.get("/stores/failed-orders/statistics");
      setStats({
        pending: data.pending ?? 0,
        retrying: data.retrying ?? 0,
        success: data.success ?? 0,
        failed: data.failed ?? 0,
        total: data.total ?? 0,
      });
    } catch (e) {
      console.error("Failed to fetch stats:", e);
    } finally {
      setStatsLoading(false);
    }
  }, []);



  // ── Fetch stores for filter ──────────────────────────────────────────────
  const fetchStores = useCallback(async () => {
    try {
      const { data } = await api.get("/stores", { params: { limit: 200 } });
      setStores(Array.isArray(data.records) ? data.records : []);
    } catch (_) { }
  }, []);

  // ── Build query params ───────────────────────────────────────────────────
  const buildParams = useCallback(
    (page = pager.current_page, per_page = pager.per_page) => {
      const params = { page, limit: per_page };
      if (filters.status && filters.status !== "all")
        params.status = filters.status;
      if (filters.storeId && filters.storeId !== "all")
        params.storeId = filters.storeId;
      if (filters.startDate) params.startDate = filters.startDate;
      if (filters.endDate) params.endDate = filters.endDate;
      return params;
    },
    [filters, pager.current_page, pager.per_page],
  );

  // ── Fetch failed orders list ─────────────────────────────────────────────
  const fetchFailedOrders = useCallback(
    async (page = pager.current_page, per_page = pager.per_page) => {
      setLoading(true);
      try {
        const res = await api.get("/stores/failed-orders", {
          params: buildParams(page, per_page),
        });
        const data = res.data ?? {};
        setPager({
          total_records: data.total_records ?? 0,
          current_page: data.current_page ?? page,
          per_page: data.per_page ?? per_page,
          records: Array.isArray(data.records) ? data.records : [],
        });
      } catch (e) {
        console.error(e);
        toast.error(t("failedOrders.messages.fetchFailed"));
      } finally {
        setLoading(false);
      }
    },
    [buildParams, t],
  );

  useEffect(() => {
    const unsubscribe = subscribe("FAILED_ORDER_UPDATE", (payload) => {
      if (payload) {
        const { failureId, status, attempts } = payload;

        setPager((prev) => ({
          ...prev,
          records: prev.records.map((record) =>
            record.id === failureId ? { ...record, status, attempts } : record,
          ),
        }));
      }
    });

    return unsubscribe;
  }, [subscribe]);
  const handlePageChange = ({ page, per_page }) => {
    fetchFailedOrders(page, per_page);
  };

  useEffect(() => {
    handlePageChange(1, pager.per_page);
  }, [debouncedSearch]);

  // ── Export ───────────────────────────────────────────────────────────────
  const handleExport = useCallback(async () => {
    let toastId;
    try {
      setExportLoading(true);
      toastId = toast.loading(t("messages.exportStarted"));
      const params = buildParams();
      delete params.page;
      delete params.limit;

      const response = await api.get("/stores/failed-orders/export", {
        params,
        responseType: "blob",
      });

      const contentDisposition = response.headers["content-disposition"];
      let filename = `failed_orders_${Date.now()}.xlsx`;
      if (contentDisposition) {
        const match = contentDisposition.match(/filename=(.+)/);
        if (match?.[1]) filename = match[1].replace(/"/g, "");
      }

      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", filename);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);

      toast.success(t("messages.exportSuccess"), { id: toastId });
    } catch (e) {
      toast.error(e?.response?.data?.message || t("messages.exportFailed"), {
        id: toastId,
      });
    } finally {
      setExportLoading(false);
    }
  }, [buildParams, t]);

  // ── Apply filters ────────────────────────────────────────────────────────
  const applyFilters = useCallback(() => {
    fetchFailedOrders(1, pager.per_page);
    fetchStats();
  }, [fetchFailedOrders, fetchStats, pager.per_page]);

  const hasActiveFilters = Object.values(filters).some(
    (v) => v && v !== "all" && v !== null,
  );

  // ── On mount ─────────────────────────────────────────────────────────────
  useEffect(() => {
    fetchFailedOrders(1, pager.per_page);
    fetchStats();
    fetchStores();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ── Refresh everything (called after a retry) ────────────────────────────
  const handleRefreshAll = useCallback(() => {
    fetchFailedOrders(pager.current_page, pager.per_page);
    fetchStats();
  }, [fetchFailedOrders, fetchStats, pager.current_page, pager.per_page]);

  // ── Stats cards (live values from API) ───────────────────────────────────
  const liveStats = useMemo(
    () =>
      FAILED_STATS_TEMPLATE.map((s) => ({
        id: s.id,
        name: t(s.title),
        value: s.code === "total" ? stats.total : (stats[s.code] ?? 0),
        icon: s.icon,
        color: s.color,
        sortOrder: s.id,
        loading: statsLoading,
      })),
    [stats, statsLoading, t],
  );

  // ── Modal State ──────────────────────────────────────────────────────────
  const [modalConfig, setModalConfig] = useState({
    open: false,
    failureId: null,
    fixMode: false,
  });

  const handleOpenModal = (id, fixMode = false) => {
    setModalConfig({ open: true, failureId: id, fixMode });
  };

  // ── Table columns ─────────────────────────────────────────────────────────
  const columns = useMemo(
    () => [
      // ID / reference
      // {
      //   key: "id",
      //   header: "#",
      //   cell: (row) => (
      //     <span className="font-mono text-xs text-muted-foreground font-semibold">
      //       #{row.id}
      //     </span>
      //   ),
      // },

      // Source store
      {
        key: "store",
        header: t("failedOrders.columns.store"),
        cell: (row) => {
          const storeName = row.store?.name ?? row.storeName ?? "—";
          const provider = row.store?.provider ?? row.provider ?? null;
          return (
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-xl bg-muted border border-border flex items-center justify-center shrink-0">
                <ShoppingBag size={13} className="text-muted-foreground" />
              </div>
              <div>
                <p className="text-sm font-semibold text-foreground leading-tight">
                  {storeName}
                </p>
                {provider && (
                  <p className="text-[10px] text-muted-foreground capitalize">
                    {provider}
                  </p>
                )}
              </div>
            </div>
          );
        },
      },

      // Customer name
      {
        key: "customerName",
        header: t("failedOrders.columns.customerName"),
        cell: (row) => (
          <span className="text-gray-700 dark:text-slate-200 font-semibold text-sm">
            {row.customerName ?? row.payload?.customerName ?? "—"}
          </span>
        ),
      },

      //phone number
      {
        key: "phoneNumber",
        header: t("failedOrders.columns.customerPhone"),
        cell: (row) => (
          <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-slate-300">
            <Phone size={14} />
            {row.phoneNumber ?? row.payload?.customerPhone ?? "—"}
          </div>
        ),
      },
      {
        key: "email",
        header: t("failedOrders.columns.customerEmail"),
        cell: (row) => (
          <span className="text-gray-700 dark:text-slate-200 font-semibold text-sm">
            {row.email ?? row.payload?.email ?? "—"}
          </span>
        ),
      },
      // Items Name vs Quantity
      {
        key: "itemNameVsQuantity",
        header: t("failedOrders.columns.itemNameVsQuantity"),
        cell: (row) => {
          const items = row.payload?.cartItems || row.payload?.items || [];
          return (
            <div className="text-sm">
              {items.length > 0 ? (
                items.map((item, idx) => (
                  <div key={idx} className="flex gap-2 text-gray-700 dark:text-slate-300">
                    <span>{item.name || item.productName || "Product"}</span>
                    <span className="text-muted-foreground"> (x{item.quantity})</span>
                  </div>
                ))
              ) : (
                <span className="text-muted-foreground italic text-xs">—</span>
              )}
            </div>
          );
        },
      },

      // External order reference
      {
        key: "externalOrderId",
        header: t("failedOrders.columns.externalOrderId"),
        cell: (row) => (
          <span className="font-mono text-xs text-[var(--primary)] font-semibold">
            {row.externalOrderId ?? row.externalId ?? "—"}
          </span>
        ),
      },

      // Failure reason / error message
      {
        key: "errorReason",
        header: t("failedOrders.columns.errorReason"),
        cell: (row) => <ErrorReasonCell row={row} />,
      },

      // Last retry failed reason
      {
        key: "lastRetryFailedReason",
        header: t("failedOrders.columns.lastRetryFailedReason"),
        cell: (row) => (
          <div className="max-w-[200px] truncate">
            {row.lastRetryFailedReason ? (
              <span className="text-xs text-red-600 dark:text-red-400 font-medium">
                {row.lastRetryFailedReason}
              </span>
            ) : (
              <span className="text-muted-foreground italic text-xs">—</span>
            )}
          </div>
        ),
      },

      // Status badge
      {
        key: "status",
        header: t("failedOrders.columns.status"),
        cell: (row) => <FailStatusBadge status={row.status} t={t} />,
      },

      // Retry count
      {
        key: "retryCount",
        header: t("failedOrders.columns.retryCount"),
        cell: (row) => {
          const count = row.retryCount ?? row.attempts ?? 0;
          return (
            <div className="flex items-center gap-1.5">
              <span
                className={cn(
                  "inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-bold border",
                  count === 0
                    ? "bg-muted text-muted-foreground border-border"
                    : count >= 3
                      ? "bg-red-50 dark:bg-red-950/30 text-red-600 dark:text-red-400 border-red-200 dark:border-red-800"
                      : "bg-amber-50 dark:bg-amber-950/30 text-amber-700 dark:text-amber-400 border-amber-200 dark:border-amber-800",
                )}
              >
                <RefreshCcw size={9} />
                {count}
              </span>
            </div>
          );
        },
      },

      // Created at
      {
        key: "createdAt",
        header: t("table.createdat"),
        cell: (row) => (
          <span className="text-xs text-muted-foreground whitespace-nowrap">
            {formatDate(row.createdAt ?? row.created_at)}
          </span>
        ),
      },

      {
        key: "actions",
        header: t("table.actions"),
        cell: (row) => {
          const isRetryable =
            row.status !== "success" && row.status !== "retrying";

          if (!isRetryable) {
            return (
              <span className="text-xs text-muted-foreground italic">
                {row.status === "success"
                  ? t("failedOrders.actions.alreadySuccess")
                  : t("failedOrders.actions.retrying")}
              </span>
            );
          }

          return (
            <ActionButtons
              row={row}
              actions={[
                {
                  icon: <Eye />,
                  tooltip: t("failedOrders.actions.showDetails"),
                  onClick: (r) => handleOpenModal(r.id, false),
                  variant: "outline",
                },
                {
                  icon: <Wrench />,
                  tooltip: t("failedOrders.actions.fixAndRetry"),
                  onClick: (r) => handleOpenModal(r.id, true),
                  variant: "primary",
                },
              ]}
            />
          );
        },
      },
    ],
    [t, handleRefreshAll],
  );

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <>
      <PageHeader
        breadcrumbs={[
          { name: t("breadcrumb.home"), href: "/" },
          { name: t("tabs.failedOrders") },
        ]}
        buttons={
          <Button_
            onClick={handleRefreshAll}
            size="sm"
            label={t("actions.refresh")}
            variant="outline"
            icon={<RefreshCcw size={16} />}
          />
        }
        statsCount={FAILED_STATS_TEMPLATE.length}
        stats={liveStats}
      />

      <Table
        // ── i18n ────────────────────────────────────────────────────────
        labels={{
          searchPlaceholder: t("failedOrders.searchPlaceholder"),
          filter: t("toolbar.filter"),
          apply: t("filters.apply"),
          total: t("pagination.total"),
          limit: t("pagination.limit"),
          emptyTitle: t("failedOrders.empty.title"),
          emptySubtitle: t("failedOrders.empty.subtitle"),
          preview: t("image.preview"),
        }}
        // ── Toolbar actions ──────────────────────────────────────────────
        actions={[
          // {
          //     key: "refresh",
          //     label: t("actions.refresh"),
          //     icon: <RefreshCcw size={14} />,
          //     color: "gray",
          //     onClick: handleRefreshAll,
          //     disabled: loading,
          // },
          {
            key: "export",
            label: t("toolbar.export"),
            icon: exportLoading ? (
              <Loader2 size={14} className="animate-spin" />
            ) : (
              <Download size={14} />
            ),
            color: "primary",
            onClick: handleExport,
            disabled: exportLoading,
          },
        ]}
        // ── Filters ──────────────────────────────────────────────────────
        hasActiveFilters={hasActiveFilters}
        onApplyFilters={applyFilters}
        searchValue={search}
        onSearchChange={setSearch}
        data={pager.records}
        columns={columns}
        isLoading={loading}
        pager={pager}
        // ── Pagination ───────────────────────────────────────────────────
        pagination={{
          total_records: pager.total_records,
          current_page: pager.current_page,
          per_page: pager.per_page,
        }}
        onPageChange={({ page, per_page }) => fetchFailedOrders(page, per_page)}
        filters={
          <>
            {/* Status filter */}
            <FilterField label={t("filters.status")}>
              <Select
                value={filters.status}
                onValueChange={(v) => setFilters((f) => ({ ...f, status: v }))}
              >
                <SelectTrigger className="h-10 rounded-xl border-border bg-background text-sm">
                  <SelectValue placeholder={t("filters.statusPlaceholder")} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">{t("filters.all")}</SelectItem>
                  <SelectItem value="pending">
                    <div className="flex items-center gap-2">
                      <Clock size={12} className="text-amber-500" />
                      {t("failedOrders.statuses.pending")}
                    </div>
                  </SelectItem>
                  <SelectItem value="retrying">
                    <div className="flex items-center gap-2">
                      <RefreshCcw size={12} className="text-blue-500" />
                      {t("failedOrders.statuses.retrying")}
                    </div>
                  </SelectItem>
                  <SelectItem value="success">
                    <div className="flex items-center gap-2">
                      <CheckCircle size={12} className="text-emerald-500" />
                      {t("failedOrders.statuses.success")}
                    </div>
                  </SelectItem>
                  <SelectItem value="failed">
                    <div className="flex items-center gap-2">
                      <XCircle size={12} className="text-red-500" />
                      {t("failedOrders.statuses.failed")}
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
            </FilterField>

            {/* Store filter */}
            <FilterField label={t("failedOrders.filters.store")}>
              <Select
                value={filters.storeId}
                onValueChange={(v) => setFilters((f) => ({ ...f, storeId: v }))}
              >
                <SelectTrigger className="h-10 rounded-xl border-border bg-background text-sm">
                  <SelectValue
                    placeholder={t("failedOrders.filters.storePlaceholder")}
                  />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">{t("filters.all")}</SelectItem>
                  {stores.map((s) => (
                    <SelectItem key={s.id} value={String(s.id)}>
                      <div className="flex items-center gap-2">
                        <Store size={12} className="text-muted-foreground" />
                        {s.name}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </FilterField>

            {/* Date range */}
            <FilterField label={t("filters.date")}>
              <DateRangePicker
                value={{
                  startDate: filters.startDate,
                  endDate: filters.endDate,
                }}
                onChange={(newDates) =>
                  setFilters((prev) => ({
                    ...prev,
                    ...newDates,
                  }))
                }
                placeholder={t("filters.datePlaceholder")}
                dataSize="default"
                maxDate="today"
              />
            </FilterField>
          </>
        }
      />

      <FailedOrderDetailsModal
        open={modalConfig.open}
        onOpenChange={(open) => setModalConfig((prev) => ({ ...prev, open }))}
        failureId={modalConfig.failureId}
        fixMode={modalConfig.fixMode}
        onRetrySuccess={handleRefreshAll}
      />
    </>
  );
}

export default FailedOrdersTab;
