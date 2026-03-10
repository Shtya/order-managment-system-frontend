import api from "@/utils/api";
import { normalizeAxiosError } from "@/utils/axios";
import { useTranslations } from "next-intl";
import { useEffect, useState } from "react";
import toast from "react-hot-toast";


export default function useOrdersSettings({ isOpen = true, onClose } = {}) {
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
                const data = settingsRes.data;

                if (data) {
                    setSettings(prev => ({
                        // تحديث القيم الأساسية يدوياً
                        enabled: data.enabled ?? prev.enabled,
                        maxRetries: data.maxRetries ?? prev.maxRetries,
                        retryInterval: data.retryInterval ?? prev.retryInterval,
                        autoMoveStatus: data.autoMoveStatus ?? prev.autoMoveStatus,
                        retryStatuses: data.retryStatuses ?? prev.retryStatuses,
                        confirmationStatuses: data.confirmationStatuses ?? prev.confirmationStatuses,
                        notifyEmployee: data.notifyEmployee ?? prev.notifyEmployee,
                        notifyAdmin: data.notifyAdmin ?? prev.notifyAdmin,
                        orderFlowPath: data.orderFlowPath ?? prev.orderFlowPath,

                        // تحديث الكائنات المتداخلة (Nested Objects)
                        workingHours: {
                            enabled: data.workingHours?.enabled ?? prev.workingHours.enabled,
                            start: data.workingHours?.start ?? prev.workingHours.start,
                            end: data.workingHours?.end ?? prev.workingHours.end,
                        },

                        shipping: data.shipping ? {
                            autoSendToShipping: data.shipping?.autoSendToShipping ?? prev.shipping.autoSendToShipping,
                            shippingCompanyId: data.shipping?.shippingCompanyId ?? prev.shipping.shippingCompanyId,
                            triggerStatus: data.shipping?.triggerStatus ?? prev.shipping.triggerStatus,
                            requirePaymentConfirm: data.shipping?.requirePaymentConfirm ?? prev.shipping.requirePaymentConfirm,
                            notifyOnShipment: data.shipping?.notifyOnShipment ?? prev.shipping.notifyOnShipment,
                            autoGenerateLabel: data.shipping?.autoGenerateLabel ?? prev.shipping.autoGenerateLabel,
                            partialPaymentThreshold: data.shipping?.partialPaymentThreshold ?? prev.shipping.partialPaymentThreshold,
                            requireFullPayment: data.shipping?.requireFullPayment ?? prev.shipping.requireFullPayment,
                            allowReturnCreation: data.shipping?.allowReturnCreation ?? prev.shipping.allowReturnCreation,
                        } : { ...prev.shipping },
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
            const payload = { ...settings };

            // حذف الحقول قبل الإرسال
            delete payload.shipping;
            delete payload.orderFlowPath;

            await api.post("/orders/retry-settings", payload);
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