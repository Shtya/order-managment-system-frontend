import Table from "@/components/atoms/Table";
import { ActionButtons } from "@/components/atoms/Actions";
import { Edit3, Loader2 } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import toast from "react-hot-toast";
import { useTranslations } from "next-intl";
import api from "@/utils/api";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/utils/cn";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { motion, AnimatePresence } from "framer-motion";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { usePlatformSettings } from "@/context/PlatformSettingsContext";



export default function FeaturesTab() {
    const t = useTranslations("plans");
    const tf = useTranslations("extraFeatures");
    const [features, setFeatures] = useState([]);
    const [loading, setLoading] = useState(false);
    const [search, setSearch] = useState('');

    // Modal State
    const [selectedFeature, setSelectedFeature] = useState(null);
    const [isEditOpen, setIsEditOpen] = useState(false);
    const [editForm, setEditForm] = useState({ name: "", price: 0, isActive: false });
    const [saving, setSaving] = useState(false);

    const fetchFeatures = async () => {
        try {
            setLoading(true);
            const { data } = await api.get("/extra-features/features");
            setFeatures(data);
        } catch (error) {
            toast.error(tf("messages.fetchFailed"));
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchFeatures();
    }, []);

    // Filter local data based on search
    const filteredFeatures = useMemo(() => {
        if (!search) return features;
        const lower = search.toLowerCase();
        return features.filter(f => f.name.toLowerCase().includes(lower) || f.type.toLowerCase().includes(lower));
    }, [features, search]);

    const handleEditClick = (feature) => {
        setSelectedFeature(feature);
        setEditForm({ name: feature.name, price: feature.price, isActive: feature.isActive });
        setIsEditOpen(true);
    };

    const handleSaveFeature = async () => {
        try {
            setSaving(true);
            await api.patch(`/extra-features/features/${selectedFeature.id}`, {
                name: editForm.name,
                price: Number(editForm.price),
                isActive: editForm.isActive
            });
            toast.success(tf("messages.updateSuccess"));
            setIsEditOpen(false);
            fetchFeatures(); // Refresh list
        } catch (error) {
            toast.error(error?.response?.data?.message || tf("messages.updateFailed"));
        } finally {
            setSaving(false);
        }
    };
    const { formatCurrency } = usePlatformSettings();

    const columns = useMemo(() => [
        {
            key: "name",
            header: tf("columns.featureName"),
            cell: (row) => <span className="font-semibold text-primary">{row.name}</span>,
        },
        {
            key: "type",
            header: tf("columns.featureType"),
            cell: (row) => <span className="text-sm text-muted-foreground uppercase">{row.type}</span>,
        },
        {
            key: "price",
            header: tf("columns.price"),
            cell: (row) => <span className="font-semibold tabular-nums text-blue-600">{formatCurrency(row.price)}</span>,
        },
        {
            key: "isActive",
            header: tf("columns.isActive"),
            cell: (row) => (
                <Badge variant="outline" className={cn("text-xs", row.isActive ? "text-emerald-600 bg-emerald-50" : "text-red-600 bg-red-50")}>
                    {row.isActive ? t("statuses.active") : t("statuses.cancelled")}
                </Badge>
            ),
        },
        {
            key: "actions",
            header: tf("columns.actions"),
            cell: (row) => (
                <ActionButtons
                    row={row}
                    actions={[
                        {
                            icon: <Edit3 />,
                            tooltip: tf("actions.editFeature"),
                            onClick: (r) => handleEditClick(r),
                            variant: "blue",
                        },
                    ]}
                />
            ),
        }
    ], [t, tf, formatCurrency]);

    return (
        <>
            <Table
                searchValue={search}
                onSearchChange={setSearch}
                labels={{
                    searchPlaceholder: t("toolbar.searchPlaceholder"),
                    total: t("pagination.total"),
                    emptyTitle: t("transactions.emptyTitle"),
                }}
                columns={columns}
                data={filteredFeatures}
                isLoading={loading}
                pagination={null} // All features are loaded at once
            />

            {/* Edit Feature Modal Overlay */}
            <AnimatePresence>
                {isEditOpen && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.95 }}
                            className="bg-background w-full max-w-lg rounded-3xl shadow-xl overflow-hidden border border-border"
                        >
                            <div className="p-6 border-b border-border bg-[#fafafa] dark:bg-slate-800/20">
                                <h2 className="text-xl font-bold">{tf("modal.editTitle")}</h2>
                            </div>

                            <div className="p-6 space-y-6">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    {/* Name Input */}
                                    <div>
                                        <Label className="text-xs text-gray-500 dark:text-slate-400">
                                            {tf("modal.name")}
                                        </Label>
                                        <Input
                                            value={editForm.name}
                                            onChange={(e) => setEditForm((p) => ({ ...p, name: e.target.value }))}
                                            className="rounded-full h-[42px] bg-[#fafafa] dark:bg-slate-800/50 border-gray-200 dark:border-slate-700 mt-1"
                                            placeholder={tf("modal.name")}
                                        />
                                    </div>

                                    {/* Price Input */}
                                    <div>
                                        <Label className="text-xs text-gray-500 dark:text-slate-400">
                                            {tf("modal.price")}
                                        </Label>
                                        <Input
                                            type="number"
                                            min="0"
                                            step="0.01"
                                            value={editForm.price}
                                            onChange={(e) => setEditForm((p) => ({ ...p, price: e.target.value }))}
                                            className="rounded-full h-[42px] bg-[#fafafa] dark:bg-slate-800/50 border-gray-200 dark:border-slate-700 mt-1 font-en"
                                            placeholder="0.00"
                                        />
                                    </div>
                                </div>

                                {/* Status Checkbox */}
                                <div className="flex items-center gap-3 p-4 rounded-2xl bg-[#fafafa] dark:bg-slate-800/30 border border-gray-100 dark:border-slate-700/50">
                                    <Checkbox
                                        id="feature-active"
                                        checked={editForm.isActive}
                                        onCheckedChange={(checked) => setEditForm((p) => ({ ...p, isActive: checked }))}
                                        disabled={saving}
                                    />
                                    <Label
                                        htmlFor="feature-active"
                                        className="text-sm font-medium cursor-pointer select-none"
                                    >
                                        {tf("modal.isActive")}
                                    </Label>
                                </div>
                            </div>

                            <div className="p-5 bg-[#fafafa] dark:bg-slate-800/20 border-t border-border flex justify-end gap-3">
                                <button
                                    onClick={() => setIsEditOpen(false)}
                                    className="px-6 py-2 text-sm font-medium rounded-full hover:bg-gray-200 dark:hover:bg-slate-700 transition-colors"
                                >
                                    {tf("modal.cancel")}
                                </button>
                                <button
                                    onClick={handleSaveFeature}
                                    disabled={saving || !editForm.name}
                                    className="px-8 py-2 text-sm font-medium bg-primary text-primary-foreground rounded-full hover:opacity-90 transition-opacity flex items-center gap-2 disabled:opacity-50"
                                >
                                    {saving && <Loader2 size={14} className="animate-spin" />}
                                    {tf("modal.save")}
                                </button>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </>
    );
}