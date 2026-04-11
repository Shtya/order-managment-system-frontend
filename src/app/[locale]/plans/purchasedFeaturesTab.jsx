import { useEffect, useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
    Loader2,
    ShoppingCart,
    CheckCircle2,
    AlertCircle,
    ExternalLink,
    Search,
    CreditCard
} from "lucide-react";
import { useTranslations } from "next-intl";
import api from "@/utils/api";
import toast from "react-hot-toast";
import Table from "@/components/atoms/Table";
import { ActionButtons } from "@/components/atoms/Actions";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/utils/cn";
import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
} from "@/components/ui/tooltip";
import { usePlatformSettings } from "@/context/PlatformSettingsContext";

export default function PurchasedFeaturesTab() {
    const tf = useTranslations("extraFeatures");
    const t = useTranslations("plans");
    const { formatCurrency } = usePlatformSettings();

    const [features, setFeatures] = useState([]);
    const [loading, setLoading] = useState(false);
    const [search, setSearch] = useState('');
    const [purchasingId, setPurchasingId] = useState(null);

    const fetchUserFeatures = async () => {
        try {
            setLoading(true);
            // استدعاء المسار الجديد الذي يدمج الميزات مع حالة اشتراك المستخدم
            const { data } = await api.get("/extra-features/user");
            setFeatures(data);
        } catch (error) {
            toast.error(tf("messages.fetchFailed") || "Error fetching features");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchUserFeatures();
    }, []);

    const handlePurchase = async (featureId) => {
        try {
            setPurchasingId(featureId);
            const { data } = await api.post("/extra-features/purchase-addon", { featureId });

            if (data.checkoutUrl) {
                toast.success(t("purchasedFeaturesTab.messages.redirecting"));
                // فتح رابط الدفع في نافذة جديدة
                window.location.href = data.checkoutUrl;
            } else {
                toast.error(t("purchasedFeaturesTab.messages.checkoutUrlNotFound"));
            }
        } catch (error) {
            toast.error(error?.response?.data?.message || t("purchasedFeaturesTab.messages.purchaseFailed"));
        } finally {
            setPurchasingId(null);
        }
    };

    const filteredFeatures = useMemo(() => {
        if (!search) return features;
        const lower = search.toLowerCase();
        return features.filter(f =>
            f.name.toLowerCase().includes(lower) ||
            f.type.toLowerCase().includes(lower)
        );
    }, [features, search]);

    const columns = useMemo(() => [
        {
            key: "name",
            header: tf("columns.featureName").trim(),
            cell: (row) => (
                <div className="flex flex-col">
                    <span className="font-bold text-slate-900 dark:text-slate-100">{row.name.trim()}</span>
                    <span className="text-[10px] uppercase text-muted-foreground font-medium tracking-wider">{row.type}</span>
                </div>
            ),
        },
        {
            key: "price",
            header: tf("columns.price").trim(),
            cell: (row) => (
                <div className="flex items-center gap-1 font-semibold text-blue-600 dark:text-blue-400">
                    <CreditCard size={12} />
                    {formatCurrency(row.price)}
                </div>
            ),
        },
        {
            key: "status",
            header: tf("columns.status").trim(),
            cell: (row) => {
                const isSubscribed = !!row.subscription;
                return (
                    <Badge
                        variant="outline"
                        className={cn(
                            "text-[11px] px-3 py-0.5 rounded-full border shadow-sm",
                            isSubscribed
                                ? "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/30 dark:text-emerald-400"
                                : "bg-slate-50 text-slate-500 border-slate-200 dark:bg-slate-900/50"
                        )}
                    >
                        {isSubscribed ? (
                            <div className="flex items-center gap-1">
                                <CheckCircle2 size={12} />
                                {tf("status.active").trim()}
                            </div>
                        ) : (
                            tf("status.notSubscribed").trim()
                        )}
                    </Badge>
                );
            },
        },
        {
            key: "actions",
            header: tf("columns.actions").trim(),
            cell: (row) => (
                <div className="flex items-center justify-end">
                    {row.subscription ? (
                        <div className="text-[10px] text-emerald-600 font-bold bg-emerald-50 px-2 py-1 rounded-lg border border-emerald-100">
                            {tf("messages.alreadyOwned").trim()}
                        </div>
                    ) : (
                        <ActionButtons
                            row={row}
                            actions={[
                                {
                                    icon: purchasingId === row.id ? (
                                        <Loader2 className="animate-spin" />
                                    ) : (
                                        <ShoppingCart />
                                    ),
                                    tooltip: tf("tooltips.purchaseNow").trim(),
                                    onClick: (r) => handlePurchase(r.id),
                                    disabled: purchasingId === row.id,
                                    variant: "primary",
                                },
                            ]}
                        />
                    )}
                </div>
            ),
        }
    ], [tf, purchasingId, formatCurrency]);

    return (
        <div className="space-y-4">
            <Table
                searchValue={search}
                onSearchChange={setSearch}
                labels={{
                    searchPlaceholder: tf("toolbar.searchPlaceholder").trim(),
                    total: t("pagination.total").trim(),
                    emptyTitle: tf("messages.noFeaturesFound").trim(),
                }}
                columns={columns}
                data={filteredFeatures}
                isLoading={loading}
                pagination={null}
            />
        </div>
    );
}