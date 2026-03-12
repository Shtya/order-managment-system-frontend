import { useEffect, useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Loader2, CreditCard, CheckCircle2 } from "lucide-react";
import { useTranslations } from "next-intl";
import api from "@/utils/api";
import toast from "react-hot-toast";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { PAYMENT_METHODS_ARRAY } from "./manageSubscription";
const SELECT_CLS = "w-full rounded-xl h-[46px] bg-[#fafafa] dark:bg-slate-800/50 border-gray-200 dark:border-slate-700";

export default function AssignFeatureModal({ isOpen, onClose, user, onRefresh }) {
    const t = useTranslations("plans");
    const tf = useTranslations("extraFeatures");

    const [allFeatures, setAllFeatures] = useState([]);
    const [userFeatures, setUserFeatures] = useState([]);
    const [loadingData, setLoadingData] = useState(false);
    const [saving, setSaving] = useState(false);

    const [form, setForm] = useState({
        featureId: "",
        price: "",
        paymentMethod: "cash"
    });

    // جلب البيانات عند فتح النافذة
    useEffect(() => {
        if (isOpen && user?.id) {
            fetchInitialData();
        }
    }, [isOpen, user?.id]);

    const fetchInitialData = async () => {
        try {
            setLoadingData(true);
            const [allRes, userRes] = await Promise.all([
                api.get("/extra-features/features"),
                api.get(`/extra-features?userId=${user.id}&status=active`)
            ]);
            console.log(allRes.data)
            setAllFeatures(allRes.data);
            setUserFeatures(userRes.data.records || []);
        } catch (error) {
            toast.error("Error loading features data");
        } finally {
            setLoadingData(false);
        }
    };

    // تحديد الميزة المختارة لتحديث السعر الافتراضي تلقائياً
    const handleFeatureChange = (id) => {
        const feature = allFeatures.find(f => String(f.id) === id);
        setForm(p => ({
            ...p,
            featureId: id,
            price: feature ? feature.price : ""
        }));
    };

    const handleAssign = async () => {
        try {
            setSaving(true);
            await api.post("/extra-features/assign", {
                userId: user.id,
                featureId: Number(form.featureId),
                price: Number(form.price),
                paymentMethod: form.paymentMethod.trim()
            });
            toast.success(tf("messages.updateSuccess"));
            onRefresh?.();
            onClose();
        } catch (error) {
            toast.error(error?.response?.data?.message || "Error assigning feature");
        } finally {
            setSaving(false);
        }
    };

    // مصفوفة المعرفات التي يمتلكها المستخدم لمنع اختيارها
    const ownedFeatureIds = useMemo(() =>
        userFeatures.map(uf => String(uf.featureId)),
        [userFeatures]);

    return (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="p-4 space-y-6">

            <div className="">
                {/* 1. Preview: What user already has */}
                <div className="space-y-3 mb-5">
                    <Label className="text-xs font-bold uppercase tracking-wider text-gray-400">
                        {tf("assignModal.userHas").trim()}
                    </Label>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                        {loadingData ? (
                            <div className="col-span-2 flex justify-center p-4"><Loader2 className="animate-spin text-muted-foreground" /></div>
                        ) : userFeatures.length > 0 ? (
                            userFeatures.map(uf => (
                                <div key={uf.id} className="flex items-center gap-3 p-3 rounded-2xl bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-100 dark:border-emerald-800/50">
                                    <CheckCircle2 size={16} className="text-emerald-600" />
                                    <div className="flex flex-col">
                                        <span className="text-sm font-semibold text-emerald-900 dark:text-emerald-400">{uf.feature?.name}</span>
                                        <span className="text-[10px] text-emerald-600/70 uppercase font-bold">{uf.feature?.type}</span>
                                    </div>
                                </div>
                            ))
                        ) : (
                            <div className="col-span-2 p-4 rounded-2xl border border-dashed text-center text-sm text-muted-foreground">
                                {tf("assignModal.noFeatures").trim()}
                            </div>
                        )}
                    </div>
                </div>

                <div className="md:col-span-3 border-t my-4" />
                {/* 2. Form: Add New Feature */}
                <div className="space-y-6">
                    <div className="space-y-3">
                        <Label className="text-xs text-gray-500 dark:text-slate-400">{tf("assignModal.selectFeature").trim()}</Label>
                        <Select value={form.featureId} onValueChange={handleFeatureChange}>
                            <SelectTrigger className={SELECT_CLS}>
                                <SelectValue placeholder={tf("assignModal.selectFeature")} />
                            </SelectTrigger>
                            <SelectContent>
                                {allFeatures.map(f => {
                                    const isOwned = ownedFeatureIds.includes(String(f.id));
                                    return (
                                        <SelectItem
                                            key={f.id}
                                            value={String(f.id)}
                                            disabled={isOwned || !f.isActive}
                                            className="flex justify-between items-center"
                                        >
                                            <div className="flex items-center gap-2">
                                                <span>{f.name}</span>
                                                {isOwned && <Badge variant="outline" className="text-[10px] ml-2 bg-gray-100">{tf("assignModal.alreadyOwned")}</Badge>}
                                            </div>
                                        </SelectItem>
                                    );
                                })}
                            </SelectContent>
                        </Select>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-3">
                            <Label className="text-xs text-gray-500 dark:text-slate-400">{tf("assignModal.price").trim()}</Label>
                            <Input
                                type="number"
                                value={form.price}
                                onChange={(e) => setForm(p => ({ ...p, price: e.target.value }))}
                                className="rounded-full h-[48px] bg-[#fafafa] dark:bg-slate-800/50 border-gray-200 dark:border-slate-700 font-en"
                            />
                        </div>
                        <div className="space-y-3">
                            <Label className="text-xs text-gray-500 dark:text-slate-400">{tf("assignModal.paymentMethod").trim()}</Label>
                            <Select value={form.paymentMethod} onValueChange={(v) => setForm(p => ({ ...p, paymentMethod: v }))}>
                                <SelectTrigger className={SELECT_CLS}>
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent position="popper" className="z-[100]">

                                    {PAYMENT_METHODS_ARRAY.map((method) => (
                                        <SelectItem key={method} value={method}>
                                            {t(`paymentMethods.${method.toLowerCase()}`)}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                    </div>
                </div>
            </div>

            {/* Footer Actions */}
            <div className=" flex justify-end gap-3">
                <button
                    onClick={onClose}
                    className="px-8 py-3 text-sm font-bold rounded-full hover:bg-gray-200 dark:hover:bg-slate-700 transition-all active:scale-95"
                >
                    {t("filters.cancel") || "Cancel"}
                </button>
                <button
                    onClick={handleAssign}
                    disabled={saving || !form.featureId || loadingData}
                    className="px-10 py-3 text-sm font-bold bg-primary text-primary-foreground rounded-full hover:opacity-90 shadow-lg shadow-primary/20 transition-all flex items-center gap-2 disabled:opacity-50 active:scale-95"
                >
                    {saving ? <Loader2 size={18} className="animate-spin" /> : <CheckCircle2 size={18} />}
                    {tf("assignModal.assign").trim()}
                </button>
            </div>
        </motion.div>
    );
}