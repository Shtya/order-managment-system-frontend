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
    notifyOrderUpdates: true,
    notifyNewProducts: false,
    notifyLowStock: false,
    notifyMarketing: false,
    stockDeductionStrategy: "on_shipment",
    workingHours: { enabled: true, start: "09:00", end: "18:00" },
    orderFlowPath: "warehouse", // Options: 'warehouse' or 'shipping'
    shipping: {
      shippingCompanyId: "",
      triggerStatus: "",
      //   requirePaymentConfirm: true,
      notifyOnShipment: true,
      autoGenerateLabel: false,
      partialPaymentThreshold: 0,
      requireFullPayment: false,
      //   allowReturnCreation: true,
    },
  });

  /* ── fetch settings on open ─── */
  useEffect(() => {
    if (!isOpen) return;
    (async () => {
      setLoading(true);
      try {
        const [settingsRes] = await Promise.all([
          api.get("/orders/retry-settings"),
        ]);
        const data = settingsRes.data;

        if (data) {
          setSettings((prev) => ({
            // تحديث القيم الأساسية يدوياً
            enabled: data.enabled ?? prev.enabled,
            maxRetries: data.maxRetries ?? prev.maxRetries,
            retryInterval: data.retryInterval ?? prev.retryInterval,
            autoMoveStatus: data.autoMoveStatus ?? prev.autoMoveStatus,
            retryStatuses: data.retryStatuses ?? prev.retryStatuses,
            confirmationStatuses:
              data.confirmationStatuses ?? prev.confirmationStatuses,
            notifyEmployee: data.notifyEmployee ?? prev.notifyEmployee,
            notifyAdmin: data.notifyAdmin ?? prev.notifyAdmin,
            notifyOrderUpdates:
              data.notifyOrderUpdates ?? prev.notifyOrderUpdates,
            notifyNewProducts: data.notifyNewProducts ?? prev.notifyNewProducts,
            notifyLowStock: data.notifyLowStock ?? prev.notifyLowStock,
            notifyMarketing: data.notifyMarketing ?? prev.notifyMarketing,
            stockDeductionStrategy:
              data.stockDeductionStrategy ?? prev.stockDeductionStrategy,
            orderFlowPath: data.orderFlowPath ?? prev.orderFlowPath,

            // تحديث الكائنات المتداخلة (Nested Objects)
            workingHours: {
              enabled: data.workingHours?.enabled ?? prev.workingHours.enabled,
              start: data.workingHours?.start ?? prev.workingHours.start,
              end: data.workingHours?.end ?? prev.workingHours.end,
            },

            shipping: data.shipping
              ? {
                shippingCompanyId:
                  data.shipping?.shippingCompanyId ??
                  prev.shipping.shippingCompanyId,
                triggerStatus:
                  data.shipping?.triggerStatus ?? prev.shipping.triggerStatus,
                //   requirePaymentConfirm:
                //     data.shipping?.requirePaymentConfirm ??
                //     prev.shipping.requirePaymentConfirm,
                notifyOnShipment:
                  data.shipping?.notifyOnShipment ??
                  prev.shipping.notifyOnShipment,
                autoGenerateLabel:
                  data.shipping?.autoGenerateLabel ??
                  prev.shipping.autoGenerateLabel,
                partialPaymentThreshold:
                  data.shipping?.partialPaymentThreshold ??
                  prev.shipping.partialPaymentThreshold,
                requireFullPayment:
                  data.shipping?.requireFullPayment ??
                  prev.shipping.requireFullPayment,
                //   allowReturnCreation:
                //     data.shipping?.allowReturnCreation ??
                //     prev.shipping.allowReturnCreation,
              }
              : { ...prev.shipping },
          }));
        }
      } catch (e) {
        toast.error(normalizeAxiosError(e));
      } finally {
        setLoading(false);
      }
    })();
  }, [isOpen]);
  const patch = (p) => setSettings((prev) => ({ ...prev, ...p }));
  const patchShipping = (p) =>
    setSettings((prev) => ({ ...prev, shipping: { ...prev.shipping, ...p } }));

  const toggleCode = (field, code) =>
    patch({
      [field]: settings[field].includes(code)
        ? settings[field].filter((c) => c !== code)
        : [...settings[field], code],
    });

  const handleSave = async () => {
    setSaving(true);
    try {
      const payload = { ...settings };

      if (payload.shipping) {
        payload.shipping = {
          ...payload.shipping,
        };

        if (
          payload.shipping.partialPaymentThreshold !== undefined &&
          payload.shipping.partialPaymentThreshold !== ""
        ) {
          payload.shipping.partialPaymentThreshold = Number(
            payload.shipping.partialPaymentThreshold,
          );
        } else {
          payload.shipping.partialPaymentThreshold = 0; // Or whatever your default is
        }

        if (
          payload.shipping.shippingCompanyId !== undefined &&
          payload.shipping.shippingCompanyId !== "" &&
          payload.shipping.shippingCompanyId !== null &&
          payload.shipping.shippingCompanyId !== "all" &&
          payload.shipping.shippingCompanyId !== "none"
        ) {
          payload.shipping.shippingCompanyId = Number(
            payload.shipping.shippingCompanyId,
          );
        } else {
          payload.shipping.shippingCompanyId = null;
        }
      }

      await api.post("/orders/retry-settings", payload);
      toast.success(t("messages.settingsSaved"));
      onClose?.();
    } catch (e) {
      toast.error(normalizeAxiosError(e));
    } finally {
      setSaving(false);
    }
  };
  const saveSetting = async (settingToSave) => {
    setSaving(true);
    try {


      const res = await api.post("/orders/retry-settings", settingToSave);

      if (res.data) {
        setSettings((prev) => ({
          ...prev,
          ...res.data,
        }));
      }
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
    patch,
    patchShipping,
    handleSave,
    saveSetting,
    toggleCode,
  };
}
