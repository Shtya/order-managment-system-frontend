import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Loader2, Wallet, ArrowUpCircle, ArrowDownCircle, History, Save } from "lucide-react";
import { useTranslations } from "next-intl";
import api from "@/utils/api";
import toast from "react-hot-toast";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

export default function ManageWalletModal({ isOpen, onClose, user, onRefresh }) {
    const t = useTranslations("wallet");
    const [wallet, setWallet] = useState(null);
    const [loading, setLoading] = useState(false);
    const [saving, setSaving] = useState(false);

    const [form, setForm] = useState({
        amount: "",
        note: ""
    });

    useEffect(() => {
        if (isOpen && user?.id) {
            fetchWalletInfo();
        }
    }, [isOpen, user?.id]);

    const fetchWalletInfo = async () => {
        try {
            setLoading(true);
            const res = await api.get(`/wallet/admin/user-wallet/${user.id}`);
            setWallet(res.data);
        } catch (error) {
            toast.error("Failed to load wallet information");
        } finally {
            setLoading(false);
        }
    };

    const handleAdjust = async () => {
        if (!form.amount || isNaN(form.amount)) {
            return toast.error("Please enter a valid amount");
        }
        try {
            setSaving(true);
            await api.post("/wallet/admin/adjust", {
                userId: user.id,
                amount: Number(form.amount),
                note: form.note.trim()
            });
            toast.success(t("controlModal.success").trim());
            onRefresh?.();
            onClose();
            setForm({ amount: "", note: "" });
        } catch (error) {
            toast.error(error?.response?.data?.message || "Error adjusting balance");
        } finally {
            setSaving(false);
        }
    };

    return (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="p-4 space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between bg-emerald-50/30 dark:bg-emerald-950/10">
                <div>
                    <h2 className="text-xl font-bold flex items-center gap-2">
                        <Wallet className="text-emerald-600" size={24} />
                        {t("controlModal.title").trim()}
                    </h2>
                    <p className="text-sm text-muted-foreground mt-1">{user?.name}</p>
                </div>
            </div>

            <div className="space-y-6">
                {/* 1. Wallet Stats Cards */}
                {loading ? (
                    <div className="flex justify-center p-8"><Loader2 className="animate-spin text-emerald-600" /></div>
                ) : (
                    <div className="grid grid-cols-3 gap-3">
                        <div className="p-4 rounded-2xl bg-blue-50 dark:bg-blue-950/20 border border-blue-100 dark:border-blue-900/50 text-center">
                            <p className="text-[10px] text-blue-600 font-bold mb-1 uppercase">{t("controlModal.currentBalance")}</p>
                            <p className="text-lg font-bold text-blue-900 dark:text-blue-300">{wallet?.currentBalance || 0}</p>
                        </div>
                        <div className="p-4 rounded-2xl bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-100 dark:border-emerald-900/50 text-center">
                            <p className="text-[10px] text-emerald-600 font-bold mb-1 uppercase">{t("controlModal.totalCharged")}</p>
                            <p className="text-lg font-bold text-emerald-900 dark:text-emerald-400">{wallet?.totalCharged || 0}</p>
                        </div>
                        <div className="p-4 rounded-2xl bg-rose-50 dark:bg-rose-950/20 border border-rose-100 dark:border-rose-900/50 text-center">
                            <p className="text-[10px] text-rose-600 font-bold mb-1 uppercase">{t("controlModal.totalWithdrawn")}</p>
                            <p className="text-lg font-bold text-rose-900 dark:text-rose-400">{wallet?.totalWithdrawn || 0}</p>
                        </div>
                    </div>
                )}

                <hr className="border-border/50" />

                {/* 2. Adjustment Form */}
                <div className="space-y-4">
                    <h3 className="text-sm font-bold flex items-center gap-2 text-gray-500">
                        <History size={16} />
                        {t("controlModal.adjustTitle").trim()}
                    </h3>

                    <div className="space-y-1.5">
                        <Label className="text-xs text-gray-500">{t("controlModal.amountLabel").trim()}</Label>
                        <Input
                            type="number"
                            placeholder="مثال: 100 أو -50"
                            value={form.amount}
                            onChange={(e) => setForm(p => ({ ...p, amount: e.target.value }))}
                            className="rounded-full h-[48px] bg-[#fafafa] dark:bg-slate-800/50 text-left font-en"
                            dir="ltr"
                        />
                    </div>

                    <div className="space-y-1.5">
                        <Label className="text-xs text-gray-500">{t("controlModal.noteLabel").trim()}</Label>
                        <Textarea
                            value={form.note}
                            onChange={(e) => setForm(p => ({ ...p, note: e.target.value }))}
                            className="rounded-2xl bg-[#fafafa] dark:bg-slate-800/50 resize-none"
                            rows={3}
                        />
                    </div>
                </div>
            </div>

            {/* Footer */}
            <div className=" flex justify-end gap-3">
                <button
                    onClick={onClose}
                    className="px-8 py-3 text-sm font-bold rounded-full hover:bg-gray-200 transition-all"
                >
                    {t("actions.cancel") || "Cancel"}
                </button>
                <button
                    onClick={handleAdjust}
                    disabled={saving || !form.amount || loading}
                    className="px-10 py-3 text-sm font-bold bg-emerald-600 text-white rounded-full hover:bg-emerald-700 shadow-lg shadow-emerald-200 transition-all flex items-center gap-2 disabled:opacity-50"
                >
                    {saving ? <Loader2 size={18} className="animate-spin" /> : <Save size={18} />}
                    {t("controlModal.submit").trim()}
                </button>
            </div>
        </motion.div>
    );
}