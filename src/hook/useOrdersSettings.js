import api from "@/utils/api";
import { normalizeAxiosError } from "@/utils/axios";
import { useTranslations } from "next-intl";
import { useEffect, useState } from "react";
import toast from "react-hot-toast";


export default function useOrdersSettings({ isOpen, onClose }) {
    const t = useTranslations("orders");

    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);

    const [settings, setSettings] = useState({
        enabled: true,
        maxRetries: 3,
        retryInterval: 30,
        autoMoveStatus: "",
        retryStatuses: [],
        confirmationStatuses: [],
        notifyEmployee: true,
        notifyAdmin: false,
        workingHours: { enabled: true, start: "09:00", end: "18:00" },
        orderFlowPath: "warehouse", // Options: 'warehouse' or 'shipping'
        shipping: {
            autoSendToShipping: false,
            shippingCompanyId: "",
            triggerStatus: "",
            requirePaymentConfirm: true,
            notifyOnShipment: true,
            autoGenerateLabel: false,
            partialPaymentThreshold: 0,
            requireFullPayment: false,
            allowReturnCreation: true,
        },
    });

    const [shippingCompanies, setShippingCompanies] = useState([]);

    /* ── fetch settings on open ─── */
    useEffect(() => {
        if (!isOpen) return;
        (async () => {
            setLoading(true);
            try {
                const [settingsRes, shippingRes] = await Promise.all([
                    api.get("/orders/retry-settings"),
                    api.get("/shipping/integrations/active").catch(() => ({ data: { integrations: [] } })),
                ]);
                if (settingsRes.data) {
                    setSettings(prev => ({
                        ...prev,
                        ...settingsRes.data,
                        shipping: { ...prev.shipping, ...(settingsRes.data.shipping ?? {}) },
                    }));
                }
                const integrations = shippingRes.data?.integrations ?? shippingRes.data ?? [];
                setShippingCompanies(Array.isArray(integrations) ? integrations : []);
            } catch (e) {
                toast.error(normalizeAxiosError(e));
            } finally {
                setLoading(false);
            }
        })();
    }, [isOpen]);

    const patch = (p) => setSettings(prev => ({ ...prev, ...p }));
    const patchShipping = (p) => setSettings(prev => ({ ...prev, shipping: { ...prev.shipping, ...p } }));

    const toggleCode = (field, code) =>
        patch({
            [field]: settings[field].includes(code)
                ? settings[field].filter(c => c !== code)
                : [...settings[field], code],
        });

    const handleSave = async () => {
        setSaving(true);
        try {
            await api.post("/orders/retry-settings", settings);
            toast.success(t("messages.settingsSaved"));
            onClose?.();
        } catch (e) {
            toast.error(normalizeAxiosError(e));
        } finally {
            setSaving(false);
        }
    };

    return {
        settings,
        loading,
        saving,
        shippingCompanies,
        patch,
        patchShipping,
        handleSave,
        toggleCode
    }
}