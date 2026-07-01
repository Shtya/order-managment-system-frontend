import api, { getOnboardingStatus } from "@/utils/api";
import { normalizeAxiosError } from "@/utils/axios";
import { useTranslations } from "next-intl";
import { createContext, useCallback, useContext, useEffect, useState } from "react";
import toast from "react-hot-toast";

const OrdersSettingsContext = createContext();
const DEFAULT_NOTIFICATION_SETTINGS = {
  order: true,
  store: true,
  template: true,
  webhook_order_failures: true,
  product: true,
  bundle: true,
  automation_run: true,
  subscription: true,
  user_feature: true,
  wallet: true,
  other: true,
};


const defaultSettings =  {
    assignmentMode: "immediate",
    assignmentDelay: 1,
    assignmentDelayUnit: "minutes",
    enabled: true,
    maxRetries: 3,
    retryInterval: 30,
    autoMoveStatus: "",
    retryStatuses: [],
    confirmationStatuses: [],
    notifyEmployee: true,
    notifyAdmin: false,

    notificationSettings: DEFAULT_NOTIFICATION_SETTINGS,

    notifyLowStock: false,
    notifyMarketing: false,
    stockDeductionStrategy: "on_shipment",
    reservedEnabled: false,
    duplicateWindowHours: 24,
    autoCancelDuplicates: false,
    workingHours: { enabled: true, start: "09:00", end: "18:00" },
    orderFlowPath: "warehouse", // Options: 'warehouse' or 'shipping'
    storeOrderSkuFallback: true,
    automationMigrationStrategy: "latest_patch",
    defaultWhatsAppAccountId: "",
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
  };

const buildSettingsObject = (data, prevSettings) => ({
  // تحديث القيم الأساسية يدوياً
  assignmentMode: data.assignmentMode ?? prevSettings.assignmentMode,
  assignmentDelay: data.assignmentDelay ?? prevSettings.assignmentDelay,
  assignmentDelayUnit: data.assignmentDelayUnit ?? prevSettings.assignmentDelayUnit,
  enabled: data.enabled ?? prevSettings.enabled,
  maxRetries: data.maxRetries ?? prevSettings.maxRetries,
  retryInterval: data.retryInterval ?? prevSettings.retryInterval,
  autoMoveStatus: data.autoMoveStatus ?? prevSettings.autoMoveStatus,
  notificationSettings: {
    ...DEFAULT_NOTIFICATION_SETTINGS,
    ...(data.notificationSettings ?? {}),
  },
  retryStatuses: data.retryStatuses ?? prevSettings.retryStatuses,
  confirmationStatuses:
    data.confirmationStatuses ?? prevSettings.confirmationStatuses,
  notifyEmployee: data.notifyEmployee ?? prevSettings.notifyEmployee,
  notifyAdmin: data.notifyAdmin ?? prevSettings.notifyAdmin,
  
  notifyLowStock: data.notifyLowStock ?? prevSettings.notifyLowStock,
  notifyMarketing: data.notifyMarketing ?? prevSettings.notifyMarketing,
  stockDeductionStrategy:
    data.stockDeductionStrategy ?? prevSettings.stockDeductionStrategy,
  reservedEnabled:
    data.reservedEnabled ?? prevSettings.reservedEnabled ?? false,
  duplicateWindowHours:
    data.duplicateWindowHours ?? prevSettings.duplicateWindowHours ?? 24,
  autoCancelDuplicates:
    data.autoCancelDuplicates ?? prevSettings.autoCancelDuplicates ?? false,
  orderFlowPath: data.orderFlowPath ?? prevSettings.orderFlowPath,
  storeOrderSkuFallback:
    data.storeOrderSkuFallback ?? prevSettings.storeOrderSkuFallback ?? true,
  automationMigrationStrategy:
    data.automationMigrationStrategy ?? prevSettings.automationMigrationStrategy ?? "latest_patch",
  defaultWhatsAppAccountId:
    data.defaultWhatsAppAccountId ?? prevSettings.defaultWhatsAppAccountId ?? "",

  // تحديث الكائنات المتداخلة (Nested Objects)
  workingHours: {
    enabled: data.workingHours?.enabled ?? prevSettings.workingHours.enabled,
    start: data.workingHours?.start ?? prevSettings.workingHours.start,
    end: data.workingHours?.end ?? prevSettings.workingHours.end,
  },

  shipping: data.shipping
    ? {
      shippingCompanyId:
        data.shipping?.shippingCompanyId ??
        prevSettings.shipping.shippingCompanyId,
      triggerStatus:
        data.shipping?.triggerStatus ?? prevSettings.shipping.triggerStatus,
      //   requirePaymentConfirm:
      //     data.shipping?.requirePaymentConfirm ??
      //     prevSettings.shipping.requirePaymentConfirm,
      notifyOnShipment:
        data.shipping?.notifyOnShipment ??
        prevSettings.shipping.notifyOnShipment,
      autoGenerateLabel:
        data.shipping?.autoGenerateLabel ??
        prevSettings.shipping.autoGenerateLabel,
      partialPaymentThreshold:
        data.shipping?.partialPaymentThreshold ??
        prevSettings.shipping.partialPaymentThreshold,
      requireFullPayment:
        data.shipping?.requireFullPayment ??
        prevSettings.shipping.requireFullPayment,
      autoShipAfterWarehouse:
        data.shipping?.autoShipAfterWarehouse ??
        prevSettings.shipping.autoShipAfterWarehouse,
      warehouseDefaultShippingCompanyId:
        data.shipping?.warehouseDefaultShippingCompanyId ??
        prevSettings.shipping.warehouseDefaultShippingCompanyId,
      //   allowReturnCreation:
      //     data.shipping?.allowReturnCreation ??
      //     prevSettings.shipping.allowReturnCreation,
    }
    : { ...prevSettings.shipping },
});
// 2. إنشاء الـ Provider
export function OrdersSettingsProvider({ children }) {
  const t = useTranslations("orders");

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  
  const [refreshFlag, setRefreshFlag] = useState(0);

  const [settings, setSettings] = useState(defaultSettings);
  const [tempSettings, setTempSettings] = useState(defaultSettings);

  const fetchSettings = async () => {
    setLoading(true);
    try {
      const [settingsRes] = await Promise.all([
        api.get("/orders/retry-settings"),
      ]);
      const data = settingsRes.data;

      return data;
    } catch (e) {
      console.error(e)
      // toast.error(normalizeAxiosError(e));
    } finally {
      setLoading(false);
    }
  }

  const isOnboarding = getOnboardingStatus();
  /* ── fetch settings on open ─── */
  useEffect(() => {
    if (isOnboarding) {
      setLoading(false);
      return;
    }
    (async () => {
      const data = await fetchSettings();
      
      // setSavedSettings(data);
      if (data) {
        const newSettings = buildSettingsObject(data, defaultSettings);
        setSettings(newSettings);
        setTempSettings(newSettings);
      }
    })();
  }, [isOnboarding, refreshFlag]);
  
  const refreshOrdersSettings = useCallback(() => {
    setRefreshFlag(prev => prev + 1);
  }, []);
  const patch = (p) => setTempSettings((prev) => ({ ...prev, ...p }));
  const patchShipping = (p) =>
    setTempSettings((prev) => ({ ...prev, shipping: { ...prev.shipping, ...p } }));

  const toggleCode = (field, code) =>
    patch({
      [field]: tempSettings[field].includes(code)
        ? tempSettings[field].filter((c) => c !== code)
        : [...tempSettings[field], code],
    });

  const handleSave = async (onSuccess) => {
    setSaving(true);
    try {
      const payload = { ...tempSettings };

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

      const res = await api.post("/orders/retry-settings", payload);
      toast.success(t("messages.settingsSaved"));

      if (typeof onSuccess === "function")
        onSuccess?.();
      if (res.data) {
        const updatedSettings = buildSettingsObject(res.data, tempSettings);
        setSettings(updatedSettings);
        setTempSettings(updatedSettings);
      }
      
    } catch (e) {
      console.error(e);
      toast.error(normalizeAxiosError(e));
    } finally {
      setSaving(false);
    }
  };
  
  const saveSetting = async (settingToSave, onSuccess) => {
    setSaving(true);
    try {
      // Update tempSettings with the new value first
      setTempSettings((prev) => ({ ...prev, ...settingToSave }));
      
      const res = await api.post("/orders/retry-settings", settingToSave);

      if (res.data) {
        const updatedSettings = buildSettingsObject(res.data, tempSettings);
        setSettings(updatedSettings);
        setTempSettings(updatedSettings);
      }
      toast.success(t("messages.settingsSaved"));
      if (typeof onSuccess === "function")
        onSuccess?.();
      
    } catch (e) {
      toast.error(normalizeAxiosError(e));
    } finally {
      setSaving(false);
    }
  };
  const isDirectShippingEnabled = settings?.orderFlowPath === "shipping";

  const calculateAvailableStock = useCallback(
  (stockOnHand, reserved) => {
    const isReservedEnabled = settings?.reservedEnabled ?? false;
    
    if (isReservedEnabled) {
      return Math.max(
        0,
        (Number(stockOnHand) || 0) - (Number(reserved) || 0)
      );
    }

    return Math.max(0, Number(stockOnHand) || 0);
  },
  [settings?.reservedEnabled]
);

  // القيم التي سيتم مشاركتها
  const value = {
    settings,
    tempSettings,
    isDirectShippingEnabled,
   
    reservedEnabled: settings?.reservedEnabled ?? false,
    loading,
    saving,
    patch,
    patchShipping,
    handleSave,
    saveSetting,
    toggleCode,
    calculateAvailableStock,
    refreshOrdersSettings,
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