import api, { getOnboardingStatus } from "@/utils/api";
import { normalizeAxiosError } from "@/utils/axios";
import { useTranslations } from "next-intl";
import { createContext, useContext, useEffect, useState } from "react";
import toast from "react-hot-toast";

const OrdersSettingsContext = createContext();

// 2. إنشاء الـ Provider
export function OrdersSettingsProvider({ children }) {
  const t = useTranslations("orders");

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [savedSettings, setSavedSettings] = useState(null);

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
      autoShipAfterWarehouse: false,
      warehouseDefaultShippingCompanyId: "",
      //   allowReturnCreation: true,
    },
  });

  const fetchSettings = async () => {
    setLoading(true);
    try {
      const [settingsRes] = await Promise.all([
        api.get("/orders/retry-settings"),
      ]);
      const data = settingsRes.data;

      return data;
    } catch (e) {
      toast.error(normalizeAxiosError(e));
    } finally {
      setLoading(false);
    }
  }

  const isOnboarding = getOnboardingStatus();
  /* ── fetch settings on open ─── */
  useEffect(() => {
    if(isOnboarding) {
      setLoading(false);
      return;
    }
    (async () => {
      const data = await fetchSettings();
      setSavedSettings(data);
      if (data)
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
              autoShipAfterWarehouse:
                data.shipping?.autoShipAfterWarehouse ??
                prev.shipping.autoShipAfterWarehouse,
              warehouseDefaultShippingCompanyId:
                data.shipping?.warehouseDefaultShippingCompanyId ??
                prev.shipping.warehouseDefaultShippingCompanyId,
              //   allowReturnCreation:
              //     data.shipping?.allowReturnCreation ??
              //     prev.shipping.allowReturnCreation,
            }
            : { ...prev.shipping },
        }));
    })();
  }, [isOnboarding]);
  const patch = (p) => setSettings((prev) => ({ ...prev, ...p }));
  const patchShipping = (p) =>
    setSettings((prev) => ({ ...prev, shipping: { ...prev.shipping, ...p } }));

  const toggleCode = (field, code) =>
    patch({
      [field]: settings[field].includes(code)
        ? settings[field].filter((c) => c !== code)
        : [...settings[field], code],
    });

  const handleSave = async (onSuccess) => {
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
          payload.shipping.shippingCompanyId = payload.shipping.shippingCompanyId
        } else {
          payload.shipping.shippingCompanyId = null;
        }

        if (
          payload.shipping.warehouseDefaultShippingCompanyId !== undefined &&
          payload.shipping.warehouseDefaultShippingCompanyId !== "" &&
          payload.shipping.warehouseDefaultShippingCompanyId !== null &&
          payload.shipping.warehouseDefaultShippingCompanyId !== "all" &&
          payload.shipping.warehouseDefaultShippingCompanyId !== "none"
        ) {
          payload.shipping.warehouseDefaultShippingCompanyId = payload.shipping.warehouseDefaultShippingCompanyId
        } else {
          payload.shipping.warehouseDefaultShippingCompanyId = null;
        }
      }

      await api.post("/orders/retry-settings", payload);
      toast.success(t("messages.settingsSaved"));

      if (typeof onSuccess === "function")
        onSuccess?.();
      const data = await fetchSettings();
      setSavedSettings(data);
    } catch (e) {
      toast.error(normalizeAxiosError(e));
    } finally {
      setSaving(false);
    }
  };
  const saveSetting = async (settingToSave, onSuccess) => {
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
      if (typeof onSuccess === "function")
        onSuccess?.();
      const data = await fetchSettings();
      setSavedSettings(data);
    } catch (e) {
      toast.error(normalizeAxiosError(e));
    } finally {
      setSaving(false);
    }
  };
  const isDirectShippingEnabled = savedSettings?.orderFlowPath === "shipping";
  // القيم التي سيتم مشاركتها
  const value = {
    settings,
    isDirectShippingEnabled,
    staticSettings: savedSettings,
    loading,
    saving,
    patch,
    patchShipping,
    handleSave,
    saveSetting,
    toggleCode,
  };

  return (
    <OrdersSettingsContext.Provider value={value}>
      {children}
    </OrdersSettingsContext.Provider>
  );
}

// 3. إنشاء الـ Hook المخصص لاستخدام هذا الـ Context بسهولة
export const useOrdersSettings = () => {
  const context = useContext(OrdersSettingsContext);
  if (!context) {
    throw new Error('useOrdersSettings must be used within an OrdersSettingsProvider');
  }
  return context;
};