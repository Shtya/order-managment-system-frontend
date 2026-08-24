"use client";

import React, { useEffect, useState, useCallback, useMemo, useRef } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  ChevronLeft,
  Store,
  RefreshCw,
  Loader2,
  AlertCircle,
  ExternalLink,
  Settings2,
  HelpCircle,
  Webhook,
  Copy,
  RotateCcw,
  ChevronRight,
  Info,
  ImageIcon,
  X,
  Zap,
  Check,
  Download,
  Power,
  Trash2,
} from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { cn } from "@/utils/cn";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import api from "@/utils/api";
import toast from "react-hot-toast";
import { GhostBtn, PrimaryBtn } from "@/components/atoms/Button";
import { useSocket } from "@/context/SocketContext";
import PageHeader from "@/components/atoms/Pageheader";
import {
  PROVIDER_CONFIG,
  useStoreConfig,
  useStoreWebhook,
  generateInstallUrl,
  getCancelIntegrationEndpoint,
  STORE_PROVIDERS,
} from '@/hook/stores';
import { useAuth } from "@/context/AuthContext";
import { Checkbox } from "@/components/ui/checkbox";
import { Controller } from "react-hook-form";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { ImagePreviewModal } from "@/components/atoms/ImagePreviewModal";
import Table, { FilterField } from "@/components/atoms/Table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import DateRangePicker from "@/components/atoms/DateRangePicker";
import { ActionButtons } from "@/components/atoms/Actions";
import { useExport } from "@/hook/useExport";
import { useClipboard } from "@/hook/useClipboard";

// ─── helpers ─────────────────────────────────────────────────────────────────

function normalizeAxiosError(err) {
  const msg =
    err?.response?.data?.message ??
    err?.response?.data?.error ??
    err?.message ??
    "Unexpected error";
  return Array.isArray(msg) ? msg.join(", ") : String(msg);
}

const PROVIDERS = ["easyorder", "shopify", "woocommerce"];

// ─── Provider Configuration ──────────────────────────────────────────────────

// ─── StoreCard ───────────────────────────────────────────────────────────────

export default function StoresIntegrationPage() {
  const t = useTranslations("storeIntegrations");
  const { user } = useAuth();

  const [stores, setStores] = useState([]);
  const [loading, setLoading] = useState(true);
  const [totalRecords, setTotalRecords] = useState(0);
  const lastTableParams = useRef({ page: 1, limit: 12 });

  // Handle EasyOrder error from URL
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const error = params.get("error");
    const errorMessage = params.get("errorMessage");
    if (errorMessage) {
      toast.error(errorMessage);
      return;
    }
    if (error === "easyOrder_not_found") {
      toast.error(t("messages.easyOrderNotFound") || "EasyOrder store not found for this user");
    } else if (error === "shopify_store_not_found") {
      toast.error(t("messages.shopifyNotFound") || "Shopify store not found for this user");
    } else if (error === "woocommerce_store_not_found") {
      toast.error(t("messages.woocommerceNotFound") || "Woocommerce store not found for this user");
    } else if (error === "shopify_connection_failed") {
      toast.error(t("messages.shopifyConnectionFailed"));
    } else if (error === "shopify_invalid_session") {
      toast.error(t("messages.shopifyInvalidSession") || "Shopify session is invalid. Please log in again.");
    } else if (error === "shopify_security_verification_failed") {
      toast.error(t("messages.shopifySecurityFailed") || "Shopify security verification failed. Please try again.");
    }
    if (error)
      window.history.replaceState({}, "", window.location.pathname);
  }, [t]);

  const [dialogOpen, setDialogOpen] = useState(false);
  const [currentProvider, setCurrentProvider] = useState(null);
  const [currentStore, setCurrentStore] = useState(null);
  const [modalStore, setModalStore] = useState(null);
  const [webhookModalProvider, setWebhookModalProvider] = useState(null);
  const [guideProvider, setGuideProvider] = useState(null);

  const { subscribe } = useSocket();
  useEffect(() => {
    const unsubscribe = subscribe("STORE_SYNC_STATUS", (payload) => {
      console.log("Received socket event:", payload);
      if (payload) {
        const { storeId, status, type } = payload;

        setStores((prev) =>
          prev.map((store) =>
            store.id === storeId ? {
              ...store,
              ...(type === "local"
                ? { localSyncStatus: status }
                : { syncStatus: status }),
            } : store,
          ),
        );
      }
    });

    return unsubscribe;
  }, [subscribe]);

  const fetchStores = async (params = {}) => {
    try {
      setLoading(true);
      const res = await api.get("/stores", {
        params: { limit: 12, ...params },
      });
      setStores(res.data?.records || []);
      setTotalRecords(res.data?.total_records || 0);
    } catch (e) {
      // toast.error(normalizeAxiosError(e));
    } finally {
      setLoading(false);
    }
  };

  const handleTableFetch = (params) => {
    lastTableParams.current = params;
    fetchStores(params);
  };

  const handleConfigure = async (provider, store) => {
    setCurrentProvider(provider);
    setCurrentStore(store);
    setDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setDialogOpen(false);
    setCurrentProvider(null);
    setCurrentStore(null);
  };

  const handleOpenWebhook = (provider, store) => {
    setWebhookModalProvider(provider);
    setModalStore(store);
  };

  const handleCloseWebhookModal = () => {
    setWebhookModalProvider(null);
    setModalStore(null);
  };

  const handleOpenGuide = (provider, store) => {
    setGuideProvider(provider);
    setModalStore(store);
  };

  const handleCloseGuide = () => {
    setGuideProvider(null);
    setModalStore(null);
  };

  const handleSync = async (storeId) => {
    try {
      await api.post(`/stores/${storeId}/sync`);
      toast.success(t("messages.syncStarted"));
      await fetchStores(lastTableParams.current);
    } catch (e) {
      toast.error(normalizeAxiosError(e));
    }
  };

  const handleToggleStore = async (store) => {
    try {
      await api.patch(`/stores/${store.id}`, { isActive: !store.isActive });
      toast.success(t("messages.statusUpdated"));
    } catch (e) {
      toast.error(normalizeAxiosError(e));
    }
    fetchStores(lastTableParams.current);
  };

  const handleAutoIntegratedAction = async (store) => {
    const provider = store.provider;
    if (store.isIntegrated) {
      try {
        const cancelEndpoint = getCancelIntegrationEndpoint(store);
        if (cancelEndpoint) await api.patch(cancelEndpoint);
        toast.success(t("messages.integrationCancelled") || "Integration cancelled successfully");
      } catch (e) {
        toast.error(normalizeAxiosError(e));
      }
      fetchStores(lastTableParams.current);
    } else {
      const installUrl = generateInstallUrl({ provider, adminId: user?.id, store });
      if (installUrl) {
        window.location.href = installUrl;
      } else {
        handleConfigure(provider, store);
      }
    }
  };

  const handleDeleteStore = async (store) => {
    try {
      await api.delete(`/stores/${store.id}`);
      toast.success(t("messages.deleteSuccess"));
      fetchStores(lastTableParams.current);
    } catch (e) {
      toast.error(normalizeAxiosError(e));
    }
  };

  return (
    <div className="min-h-screen p-5 ">
      {/* Header */}

      <PageHeader
        breadcrumbs={[
          { name: t("breadcrumb.home"), href: "/dashboard" },
          { name: t("breadcrumb.stores") },
        ]}
      />

      {/* Store Cards Grid */}
      <AnimatePresence mode="wait">
        <motion.div
          key="stores"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
          transition={{ duration: 0.3 }}
          className="main-card "
        >
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6" data-getting-started="stores.available" data-getting-started-type="section">
            {PROVIDERS.map((provider, index) => (
              <motion.div
                key={provider}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
              >
                <StoreCard
                  provider={provider}
                  t={t}
                  onConfigure={handleConfigure}
                  onOpenGuide={handleOpenGuide}
                  index={index}
                />
              </motion.div>
            ))}
          </div>
        </motion.div>
      </AnimatePresence>

      {/* Stores Management Table */}
      <StoresTable
        t={t}
        stores={stores}
        totalRecords={totalRecords}
        loading={loading}
        onFetch={handleTableFetch}
        onConfigure={handleConfigure}
        onOpenGuide={handleOpenGuide}
        onOpenWebhook={handleOpenWebhook}
        onToggleStore={handleToggleStore}
        onSync={handleSync}
        onAutoIntegratedAction={handleAutoIntegratedAction}
        onDelete={handleDeleteStore}
      />
      {/* Configuration Dialog */}
      {dialogOpen && currentProvider && (
        <StoreConfigDialog
          open={dialogOpen}
          onClose={handleCloseDialog}
          provider={currentProvider}
          existingStore={currentStore}
          fetchStores={fetchStores}
          t={t}
          onCreated={(provider, id) =>
            handleOpenWebhook(provider, { id, provider })
          }
        />
      )}

      {/* Guide Modal */}
      {guideProvider && (
        <StoreGuideModal
          provider={{ code: guideProvider }}
          store={modalStore}
          onClose={handleCloseGuide}
        />
      )}

      {/* Webhook Modal */}
      {webhookModalProvider && modalStore && (
        <StoreWebhookModal
          provider={webhookModalProvider}
          open={webhookModalProvider && modalStore}
          store={modalStore}
          onClose={handleCloseWebhookModal}
          fetchStores={fetchStores}
          t={t}
        />
      )}
    </div>
  );
}


function StoreCard({ provider, t, onConfigure, onOpenGuide }) {
  const { hasPermission } = useAuth();
  const config = PROVIDER_CONFIG[provider];
  const locale = useLocale();
  const isArabic = locale === "ar";
  const accent = config.accent;
  const accentBg = config.accentBg;

  const fbCls =
    "flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all duration-150 bg-white/80 dark:bg-[var(--muted)] border border-white/60 dark:border-[var(--border)] text-gray-600 dark:text-gray-300 shadow-sm";
  const onEnter = (e) => {
    e.currentTarget.style.borderColor = accent;
    e.currentTarget.style.color = accent;
  };
  const onLeave = (e) => {
    e.currentTarget.style.borderColor = "";
    e.currentTarget.style.color = "";
  };

  return (
    <motion.div
      whileHover={{ y: -3, boxShadow: "0 20px 48px 0 rgba(0,0,0,0.11)" }}
      transition={{ type: "spring", stiffness: 300, damping: 22 }}
      className={cn(
        "relative rounded-2xl overflow-hidden border border-[var(--border)] shadow-sm flex flex-col",
        config.bg,
        "dark:bg-none",
        "dark:bg-[var(--muted)]/80!"
      )}
    >
      {/* per-provider accent strip at top */}
      <span
        className="absolute top-0 left-0 right-0 z-10 pointer-events-none"
        style={{
          height: 3,
          background: config.strip,
          borderRadius: "16px 16px 0 0",
        }}
      />

      {/* Body */}
      <div className="pt-6 px-5 pb-4 flex flex-col gap-3 flex-1">
        {/* Header */}
        <div className="flex items-start justify-between gap-2">
          {/* Logo + identity */}
          <div className="flex items-center gap-3">
            <div
              className="w-11 h-11 rounded-xl flex-shrink-0 flex items-center justify-center overflow-hidden"
              style={{
                background: "#fff",
                border: "1px solid rgba(0,0,0,0.08)",
                boxShadow: "0 1px 4px rgba(0,0,0,0.07)",
              }}
            >
              <img
                src={config.logo}
                alt={config.label}
                className="w-7 h-7 object-contain"
                onError={(e) => (e.target.style.display = "none")}
              />
            </div>

            <div>
              <h3 className="text-sm font-bold text-gray-800 dark:text-white leading-tight">
                {config.label}
              </h3>
              <a
                href={`https://${config.website}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-0.5 mt-0.5 transition-opacity dark:text-white! hover:opacity-60"
                style={{
                  fontSize: 11,
                  color: "rgba(0,0,0,0.35)",
                  textDecoration: "none",
                }}
              >
                {config.website}
                <ExternalLink size={8} />
              </a>
            </div>
          </div>
        </div>

        {/* Description */}
        <p className="text-xs text-gray-600 dark:text-gray-400 leading-relaxed line-clamp-2">
          {isArabic ? config.description.ar : config.description.en}
        </p>
      </div>

      {/* Footer */}
      <div
        className="px-4 py-3 flex items-center gap-1.5 flex-wrap border-t border-white/50 dark:border-[var(--border)] bg-white/55 dark:bg-[var(--muted)]/80 backdrop-blur-md"
      >
        {config?.guide?.showSteps ? (
          <button
            onClick={() => onOpenGuide(provider, null)}
            className={fbCls}
            onMouseEnter={onEnter}
            onMouseLeave={onLeave}
            data-getting-started="store.how_to_integrate"
            data-getting-started-type="button"
          >
            <HelpCircle size={12} />
            {t("card.guide")}
          </button>
        ) : config?.guide?.docsUrl ? (
          <a
            href={config.guide.docsUrl}
            target="_blank"
            rel="noopener noreferrer"
            className={fbCls}
            style={{ textDecoration: "none" }}
            onMouseEnter={onEnter}
            onMouseLeave={onLeave}
          >
            <HelpCircle size={12} />
            {t("card.guide")}
          </a>
        ) : null}

        {hasPermission("stores.create") && (
          <button
            onClick={() => onConfigure(provider, null)}
            className={fbCls}
            onMouseEnter={onEnter}
            onMouseLeave={onLeave}
            data-getting-started="store.settings"
            data-getting-started-type="button"
          >
            <Settings2 size={12} />
            {t("card.configureSettings")}
          </button>
        )}
      </div>
    </motion.div>
  );
}

// ─── Store Configuration Dialog ──────────────────────────────────────────────

export function StoreConfigDialog({
  open,
  onClose,
  provider,
  existingStore,
  fetchStores,
  t,
  onCreated,
}) {
  const { user } = useAuth();
  const { handleCopy: copyDetail, copied: copiedDetail } = useClipboard();
  const {
    config,
    isEdit,
    fetchingStore,
    error,
    register,
    control,
    handleSubmit,
    errors,
    isSubmitting,
    masks,
    onSubmit,
  } = useStoreConfig({
    open,
    onClose,
    provider,
    existingStore,
    fetchStores,
    onCreated,
  });

  if (!config) return null;

  const hasFields = useMemo(() => {
    return Object.keys(config.fields || {}).length > 0;
  }, [config.fields]);

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-hidden p-0!" data-getting-started="store.settings_dialog" data-getting-started-type="dialog">
        <DialogHeader className="px-6 pt-6 pb-4 border-b border-slate-200 dark:border-slate-700">
          <DialogTitle className="flex items-center gap-2">
            <div className="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center text-slate-600">
              <Settings2 size={20} />
            </div>
            {t("dialog.title", { provider: config.label })}
          </DialogTitle>
          <DialogDescription>
            {t("dialog.subtitle")}
          </DialogDescription>
        </DialogHeader>

        <div className="overflow-y-auto max-h-[calc(90vh-110px)] p-6 pt-0!">
          {fetchingStore ? (
            <div className="flex items-center justify-center py-16">
              <Loader2 size={28} className="animate-spin text-primary" />
            </div>
          ) : (
            <>
              <form className="space-y-5 mt-4">
                {/* Store Info Section */}
                <div className="space-y-4">
                  <div className="flex items-center gap-2 mb-2">
                    <div className="w-0.5 h-5 bg-primary rounded-full" />
                    <span className="text-sm font-semibold text-gray-700 dark:text-slate-200">
                      {t("form.storeInfoSection")}
                    </span>
                  </div>

                  <div className="space-y-1.5">
                    <Label className="text-xs font-semibold text-gray-600 dark:text-slate-300">
                      {t("form.storeName")}
                    </Label>
                    <Input
                      {...register("name")}
                      placeholder={t("form.storeNamePlaceholder")}

                    />
                    {errors?.name && (
                      <div className="text-xs text-red-600">
                        {errors.name.message}
                      </div>
                    )}
                  </div>

                  <div className="space-y-1.5">
                    <Label className="text-xs font-semibold text-gray-600 dark:text-slate-300">
                      {t("form.storeUrl")}
                    </Label>
                    <Input
                      // type="url"
                      {...register("storeUrl")}
                      placeholder="https://your-store.com"

                    />
                    {errors?.storeUrl && (
                      <div className="text-xs text-red-600">
                        {errors.storeUrl.message}
                      </div>
                    )}
                  </div>

                  <div className="flex gap-1.5 flex-wrap">
                    {/* <Controller
                      control={control}
                      name="syncNewProducts"
                      render={({ field }) => (
                        <div className="flex items-center gap-2 h-[34px] px-2 rounded-lg border border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40">
                          <Checkbox
                            id="syncNewProducts"
                            checked={field.value}
                            onCheckedChange={(checked) => {
                              field.onChange(checked);
                            }}
                            className="h-6 w-6 border-slate-300 dark:border-slate-600 data-[state=checked]:bg-primary data-[state=checked]:border-primary"
                          />
                          <Label className="text-xs font-semibold text-gray-600 dark:text-slate-300">
                            {t("form.syncNewProducts")}
                          </Label>
                        </div>
                      )}
                    /> */}

                    <Controller
                      control={control}
                      name="syncRemoteProducts"
                      render={({ field }) => (
                        <div className="flex items-center gap-2 h-[34px] px-2 rounded-lg border border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40">
                          <Checkbox
                            id="syncRemoteProducts"
                            checked={field.value}
                            onCheckedChange={(checked) => {
                              field.onChange(checked);
                            }}
                            className="h-6 w-6 border-slate-300 dark:border-slate-600 data-[state=checked]:bg-primary data-[state=checked]:border-primary"
                          />
                          <Label className="text-xs font-semibold text-gray-600 dark:text-slate-300">
                            {t("form.syncRemoteProducts")}
                          </Label>
                        </div>
                      )}
                    />
                  </div>

                  {/* {!isEdit && (
									<div className="flex items-center gap-2.5 pt-1">
										<Controller
											control={control}
											name="isActive"
											render={({ field }) => (
												<Switch checked={field.value} onCheckedChange={field.onChange} id="isActive" />
											)}
										/>
										<Label htmlFor="isActive" className="text-xs font-semibold text-gray-600 dark:text-slate-300">
											{t("form.activeStore")}
										</Label>
									</div>
								)} */}
                </div>

                {/* API Keys Section */}
                {hasFields && (
                  <div className="space-y-3">
                    <div className="flex items-center gap-2">
                      <div className="w-0.5 h-5 bg-primary rounded-full" />
                      <span className="text-sm font-semibold text-gray-700 dark:text-slate-200">
                        {t("form.apiKeysSection")}
                      </span>
                    </div>


                    {/* Field Inputs */}
                    <div className="grid grid-cols-1 gap-3">
                      {Object.entries(config.fields).map(([fieldKey, fieldConfig]) => {
                        if (fieldConfig.readonly) return null;

                        return (
                          <div key={fieldKey} className="space-y-1.5">
                            <Label className="text-xs font-semibold text-gray-600 dark:text-slate-300">
                              {t(`form.${fieldKey}`)}
                            </Label>
                            <Input
                              type={fieldConfig.type || "text"}
                              placeholder={
                                isEdit && fieldConfig.masked
                                  ? masks[fieldKey] || t("form.maskedPlaceholder")
                                  : t(`form.${fieldKey}Placeholder`)
                              }
                              {...register(fieldKey)}
                              className={cn(
                                isEdit && fieldConfig.masked && masks?.[fieldKey] &&
                                "placeholder:text-gray-950 dark:placeholder:text-gray-100",
                              )}
                            />
                            {errors?.[fieldKey] && (
                              <div className="text-xs text-red-600">
                                {errors[fieldKey].message}
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* Integration Details Section (Shopify: App URL + Scopes) */}
                {config?.integrationDetails && (
                  <div className="space-y-3">
                    <div className="flex items-center gap-2">
                      <div className="w-0.5 h-5 bg-primary rounded-full" />
                      <span className="text-sm font-semibold text-gray-700 dark:text-slate-200">
                        {t("form.integrationDetailsSection")}
                      </span>
                    </div>

                    <div className="bg-[#FAFBFF] dark:bg-[#1E1E2E] border border-[#E8E8F0] dark:border-[#3A3A4A] rounded-xl p-3.5 space-y-3">
                      <p className="text-xs font-semibold text-gray-700 dark:text-slate-200 flex items-center gap-1.5">
                        <Zap size={13} className="text-primary" />
                        {t("form.integrationDetailsHint", { provider: config.label })}
                      </p>

                      <div className="space-y-3 pt-2">
                        {/* App URL */}
                        {config.integrationDetails.appUrl && (
                          <div className="space-y-0.5">
                            <p className="text-xs text-gray-500 dark:text-slate-400 font-semibold mb-2">
                              {t("form.appUrl")}
                            </p>
                            <div className="flex gap-2">
                              <input
                                readOnly
                                value={config.integrationDetails.appUrl(user?.id) || ""}
                                className="flex-1 rounded-xl border border-[var(--input)] bg-[var(--background)] px-4 py-2.5 text-sm text-[var(--foreground)]"
                              />
                              <button
                                type="button"
                                onClick={async () => {
                                  await copyDetail(config.integrationDetails.appUrl(user?.id) || "", "appUrl");
                                  toast.success(t("form.copied") || "Copied");
                                }}
                                className="px-3 rounded-xl border border-[var(--border)] bg-[var(--background)] hover:bg-[var(--muted)] transition-all"
                                title="Copy"
                              >
                                {copiedDetail === (config.integrationDetails.appUrl(user?.id) || "") + "appUrl"
                                  ? <Check size={14} className="text-green-600" />
                                  : <Copy size={14} />}
                              </button>
                            </div>
                          </div>
                        )}

                        {/* Scopes */}
                        {config.integrationDetails.scopes && (
                          <div className="space-y-0.5">
                            <p className="text-xs text-gray-500 dark:text-slate-400 font-semibold mb-2">
                              {t("form.requiredScopes")}
                            </p>
                            <div className="flex gap-2">
                              <input
                                readOnly
                                value={config.integrationDetails.scopes}
                                className="flex-1 rounded-xl border border-[var(--input)] bg-[var(--background)] px-4 py-2.5 text-sm text-[var(--foreground)] font-mono"
                              />
                              <button
                                type="button"
                                onClick={async () => {
                                  await copyDetail(config.integrationDetails.scopes || "", "scopes");
                                  toast.success(t("form.copied") || "Copied");
                                }}
                                className="px-3 rounded-xl border border-[var(--border)] bg-[var(--background)] hover:bg-[var(--muted)] transition-all"
                                title="Copy"
                              >
                                {copiedDetail === (config.integrationDetails.scopes || "") + "scopes"
                                  ? <Check size={14} className="text-green-600" />
                                  : <Copy size={14} />}
                              </button>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                )}

                {/* Webhooks Section - only on first-time create; when edit use Webhook modal */}
                {((config?.showWebhooksSectionEdit && isEdit) || (config?.showWebhooksSectionCreate && !isEdit)) && (
                  <div className="space-y-3">
                    <div className="flex items-center gap-2">
                      <div className="w-0.5 h-5 bg-primary rounded-full" />
                      <span className="text-sm font-semibold text-gray-700 dark:text-slate-200">
                        {t("form.webhooksSection")}
                      </span>
                    </div>

                    <div className="bg-[#FAFBFF] dark:bg-[#1E1E2E] border border-[#E8E8F0] dark:border-[#3A3A4A] rounded-xl p-3.5 space-y-3">
                      <p className="text-xs font-semibold text-gray-700 dark:text-slate-200 flex items-center gap-1.5">
                        <Zap size={13} className="text-primary" />
                        {t("instructions.webhooksTitle")}
                      </p>

                      {/* Webhook URLs (same style as webhook modal) */}
                      <div className="space-y-3 pt-2">
                        <div className="space-y-0.5">
                          <p className="text-xs text-gray-500 dark:text-slate-400 font-semibold">
                            {t("instructions.webhookCreateOrderLabel")}
                          </p>
                          <div className="flex gap-2">
                            <input
                              readOnly
                              value={config.webhookEndpoints?.create?.(user?.id, existingStore?.id) || ""}
                              className="flex-1 rounded-xl border border-[var(--input)] bg-[var(--background)] px-4 py-2.5 text-sm text-[var(--foreground)]"
                            />
                            <button
                              type="button"
                              onClick={async () => {
                                const url = config.webhookEndpoints?.create?.(user?.id, existingStore?.id) || "";
                                await copyDetail(url, "createUrl");
                                toast.success(t("form.copied") || "Copied");
                              }}
                              className="px-3 rounded-xl border border-[var(--border)] bg-[var(--background)] hover:bg-[var(--muted)] transition-all"
                              title="Copy"
                            >
                              {copiedDetail === (config.webhookEndpoints?.create?.(user?.id, existingStore?.id) || "") + "createUrl"
                                ? <Check size={14} className="text-green-600" />
                                : <Copy size={14} />}
                            </button>
                          </div>
                        </div>

                        <div className="space-y-0.5">
                          <p className="text-xs text-gray-500 dark:text-slate-400 font-semibold">
                            {t("instructions.webhookUpdateStatusLabel")}
                          </p>
                          <div className="flex gap-2">
                            <input
                              readOnly
                              value={config.webhookEndpoints?.update?.(user?.id, existingStore?.id) || ""}
                              className="flex-1 rounded-xl border border-[var(--input)] bg-[var(--background)] px-4 py-2.5 text-sm text-[var(--foreground)]"
                            />
                            <button
                              type="button"
                              onClick={async () => {
                                const url = config.webhookEndpoints?.update?.(user?.id, existingStore?.id) || "";
                                await copyDetail(url, "updateUrl");
                                toast.success(t("form.copied") || "Copied");
                              }}
                              className="px-3 rounded-xl border border-[var(--border)] bg-[var(--background)] hover:bg-[var(--muted)] transition-all"
                              title="Copy"
                            >
                              {copiedDetail === (config.webhookEndpoints?.update?.(user?.id, existingStore?.id) || "") + "updateUrl"
                                ? <Check size={14} className="text-green-600" />
                                : <Copy size={14} />}
                            </button>
                          </div>
                        </div>

                        <p className="text-[11px] text-[var(--muted-foreground)]">
                          {t("webhook.urlHint")}
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                {/* Form-level error */}
                {error && (
                  <div className="flex items-center gap-2 rounded-xl border border-red-500/25 bg-red-500/8 px-3.5 py-2.5 text-sm text-red-600 dark:text-red-400">
                    <AlertCircle size={14} />
                    {error}
                  </div>
                )}

                {/* Submit Button */}
                <DialogFooter className="gap-3 pt-4 border-t border-border">
                  <Button type="button" variant="ghost" onClick={() => onClose()} className="rounded-xl">
                    {t("form.cancel")}
                  </Button>
                  <PrimaryBtn
                    type="submit"
                    onClick={handleSubmit(onSubmit)}
                    disabled={isSubmitting}
                    loading={isSubmitting}
                    className=""
                  >
                    {isEdit ? t("form.update") : t("form.create")}
                  </PrimaryBtn>
                </DialogFooter>
              </form>
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

// ─── Store Webhook Modal (shape/style as shipping WebhookModal) ─────────────────

export function StoreWebhookModal({ provider, store, onClose, open, fetchStores, t }) {
  const { user } = useAuth();
  const {
    loading,
    error,
    rotating,
    copied,
    copyToClipboard,
    rotateWooCommerce,
    cred,
  } = useStoreWebhook({ store, provider, onClose, open });

  const config = PROVIDER_CONFIG[provider];

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-hidden p-0!">
        <DialogHeader className="px-6 pt-6 pb-4 border-b border-slate-200 dark:border-slate-700">
          <DialogTitle className="flex items-center gap-2">
            <div className="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center text-slate-600">
              <Webhook size={20} />
            </div>
            {t("webhook.title")}
          </DialogTitle>
          <DialogDescription>
            {t("webhook.subtitle")}
          </DialogDescription>
        </DialogHeader>


        <div className="overflow-y-auto max-h-[calc(90vh-110px)] p-6 space-y-5 pt-0!">
          <div className="rounded-xl border border-[var(--border)] bg-[var(--muted)] p-3">
            <p className="text-sm font-semibold text-[var(--card-foreground)] mb-1">
              {t("webhook.triggerTitle")}
            </p>
            <p className="text-xs text-[var(--muted-foreground)] leading-relaxed">
              {t("webhook.triggerDescription")}
            </p>
          </div>

          {loading && (
            <div className="flex justify-center py-8 text-[var(--muted-foreground)]">
              <Loader2 size={22} className="animate-spin" />
            </div>
          )}

          {!loading && config && (
            <div className="space-y-4">
              {/* Webhook URL - create order (label + field on one line) */}
              <div className="flex items-center gap-2">
                <label className="shrink-0 whitespace-nowrap text-sm font-medium text-[var(--card-foreground)]">
                  {t("instructions.webhookCreateOrderLabel")}
                </label>
                <input
                  readOnly
                  value={config.webhookEndpoints.create(user?.id, store?.id)}
                  className="min-w-0 flex-1 rounded-xl border border-[var(--input)] bg-[var(--background)] px-4 py-2.5 text-sm text-[var(--foreground)]"
                />
                <button
                  type="button"
                  onClick={() =>
                    copyToClipboard(config.webhookEndpoints.create(user?.id, store?.id))
                  }
                  className="shrink-0 p-3 rounded-xl border border-[var(--border)] bg-[var(--background)] hover:bg-[var(--muted)] transition-all"
                  title="Copy"
                >
                  {copied === config.webhookEndpoints.create(user?.id, store?.id) + "webhook"
                    ? <Check size={14} className="text-green-600" />
                    : <Copy size={14} />}
                </button>
              </div>

              {/* WooCommerce: create order secret */}
              {provider === "woocommerce" && cred.webhookCreateOrderSecret && (
                <div className="flex items-center gap-2">
                  <label className="shrink-0 whitespace-nowrap text-sm font-medium text-[var(--card-foreground)]">
                    {t("form.webhookCreateOrderSecret")}
                  </label>
                  <input
                    readOnly
                    value={cred.webhookCreateOrderSecret}
                    className="min-w-0 flex-1 rounded-xl border border-[var(--input)] bg-[var(--background)] px-4 py-2.5 text-sm text-[var(--foreground)]"
                  />
                  <button
                    type="button"
                    onClick={() =>
                      copyToClipboard(cred.webhookCreateOrderSecret)
                    }
                    className="shrink-0 p-3 rounded-xl border border-[var(--border)] bg-[var(--background)] hover:bg-[var(--muted)] transition-all"
                    title="Copy"
                  >
                    {copied === cred.webhookCreateOrderSecret + "webhook"
                      ? <Check size={14} className="text-green-600" />
                      : <Copy size={14} />}
                  </button>
                </div>
              )}

              {/* Update status webhook + update secret (same line) */}
              <div
                className={`space-y-4 `}
              >
                <div className="flex items-center gap-2">
                  <label className="shrink-0 whitespace-nowrap text-sm font-medium text-[var(--card-foreground)]">
                    {t("instructions.webhookUpdateStatusLabel")}
                  </label>
                  <input
                    readOnly
                    value={config.webhookEndpoints.update(user?.id, store?.id)}
                    className="min-w-0  flex-1 rounded-xl border border-[var(--input)] bg-[var(--background)] px-4 py-2.5 text-sm text-[var(--foreground)]"
                  />
                  <button
                    type="button"
                    onClick={() =>
                      copyToClipboard(config.webhookEndpoints.update(user?.id, store?.id))
                    }
                    className="shrink-0 p-3 rounded-xl border border-[var(--border)] bg-[var(--background)] hover:bg-[var(--muted)] transition-all"
                    title="Copy"
                  >
                    {copied === config.webhookEndpoints.update(user?.id, store?.id) + "webhook"
                      ? <Check size={14} className="text-green-600" />
                      : <Copy size={14} />}
                  </button>
                </div>

                {provider === "woocommerce" && cred.webhookUpdateStatusSecret && (
                  <div className="flex items-center gap-2">
                    <label className="shrink-0 whitespace-nowrap text-sm font-medium text-[var(--card-foreground)]">
                      {t("form.webhookUpdateStatusSecret")}
                    </label>
                    <input
                      readOnly
                      value={cred.webhookUpdateStatusSecret}
                      className="min-w-0 flex-1 rounded-xl border border-[var(--input)] bg-[var(--background)] px-4 py-2.5 text-sm text-[var(--foreground)]"
                    />
                    <button
                      type="button"
                      onClick={() =>
                        copyToClipboard(cred.webhookUpdateStatusSecret)
                      }
                      className="shrink-0 p-3 rounded-xl border border-[var(--border)] bg-[var(--background)] hover:bg-[var(--muted)] transition-all"
                      title="Copy"
                    >
                      {copied === cred.webhookUpdateStatusSecret + "webhook"
                        ? <Check size={14} className="text-green-600" />
                        : <Copy size={14} />}
                    </button>
                  </div>
                )}
              </div>

              <p className="text-[11px] text-[var(--muted-foreground)]">
                {t("webhook.urlHint")}
              </p>

              {/* WooCommerce: security hint + regenerate */}
              {provider === "woocommerce" && (
                <div className="flex items-center justify-between gap-3 rounded-xl border border-[var(--border)] bg-[var(--muted)] p-3">
                  <p className="text-xs text-[var(--muted-foreground)] leading-relaxed">
                    {t("webhook.securityHint")}
                  </p>
                  <button
                    type="button"
                    onClick={rotateWooCommerce}
                    disabled={rotating}
                    className="flex items-center gap-2 text-nowrap px-3 py-2 rounded-xl border border-[var(--border)] bg-[var(--background)] hover:bg-[var(--muted)] transition-all disabled:opacity-50"
                  >
                    {rotating ? (
                      <Loader2 size={14} className="animate-spin" />
                    ) : (
                      <RotateCcw size={14} />
                    )}
                    <span className="text-xs font-semibold">
                      {t("webhook.rotate")}
                    </span>
                  </button>
                </div>
              )}
            </div>
          )}

          {error && (
            <div className="flex items-center gap-2 rounded-xl border border-red-500/25 bg-red-500/8 px-3.5 py-2.5 text-sm text-red-600 dark:text-red-400">
              <AlertCircle size={14} />
              {error}
            </div>
          )}

          <div className="flex justify-end gap-2 pt-2">
            <GhostBtn onClick={onClose}>{t("webhook.close")}</GhostBtn>
            {config?.webhookDocsUrl && (
              <a
                href={config.webhookDocsUrl}
                target="_blank"
                rel="noopener noreferrer"
              >
                <PrimaryBtn type="button">
                  <ExternalLink size={14} /> {t("webhook.docs")}
                </PrimaryBtn>
              </a>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function pick(bilingualObj, locale) {
  if (!bilingualObj) return "";
  return locale?.startsWith("ar") ? bilingualObj.ar : bilingualObj.en;
}

export function StoreGuideModal({ provider, store, onClose }) {
  const t = useTranslations("storeIntegrations");
  const { user } = useAuth();
  const locale = useLocale();
  const meta = PROVIDER_CONFIG[provider.code];

  const tabs = meta?.guide?.tabs || [];
  const [activeTab, setActiveTab] = useState(0);
  const [activeStep, setActiveStep] = useState(0);

  const currentSteps = tabs[activeTab]?.steps || [];
  const currentStep = currentSteps[activeStep] || {};
  const p = (obj) => pick(obj, locale);

  const [storeOptions, setStoreOptions] = useState([]);
  const [storeLoading, setStoreLoading] = useState(false);
  const [selectedStoreId, setSelectedStoreId] = useState(store?.id || "");

  useEffect(() => {
    let active = true;
    (async () => {
      try {
        setStoreLoading(true);
        const res = await api.get("/stores", {
          params: { provider: provider.code, limit: 200 },
        });
        if (!active) return;
        let records = res.data?.records || [];
        if (store?.id && !records.some((s) => s.id === store.id)) {
          records = [store, ...records];
        }
        setStoreOptions(records);
      } catch (e) {
        // ignore
      } finally {
        if (active) setStoreLoading(false);
      }
    })();
    return () => {
      active = false;
    };
  }, [provider?.code, store?.id]);
  const [imgLoaded, setImgLoaded] = useState(false);
  const [previewImage, setPreviewImage] = useState(null);

  const handlePrev = useCallback(() => {
    setActiveStep((v) => Math.max(0, v - 1));
  }, []);

  const handleNext = useCallback(() => {
    setActiveStep((v) =>
      Math.min(currentSteps.length - 1, v + 1)
    );
  }, [currentSteps.length]);
  const isAr = locale === "ar";
  useEffect(() => {
    if (!open) return;

    const handleKeyDown = (e) => {
      if (previewImage) {
        return; // Let ImagePreviewModal handle ESC
      }
      if (e.key === "ArrowLeft") {
        if (isAr)
          handleNext();
        else
          handlePrev();
      } else if (e.key === "ArrowRight") {
        if (isAr)
          handlePrev();
        else
          handleNext();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [open, activeStep, previewImage, handlePrev, handleNext, isAr]);

  return (
    <>
      <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
        <DialogContent
          onEscapeKeyDown={(e) => {
            if (previewImage) {
              // 1. Stop Radix from closing the main dialog
              e.preventDefault();

              // 2. Close your image preview instead
              setPreviewImage(null);
            }
          }}
          onPointerDownOutside={(e) => {
            if (previewImage) {
              e.preventDefault();
            }
          }}
          onInteractOutside={(e) => {
            if (previewImage) {
              e.preventDefault();
            }
          }}
          className="sm:max-w-2xl max-h-[90vh] overflow-hidden p-0!"
          data-getting-started="store.integration_steps_dialog"
          data-getting-started-type="dialog">
          <DialogHeader className="px-6 pt-6 pb-4 border-b border-slate-200 dark:border-slate-700">
            <DialogTitle className="flex items-center gap-2">
              <div className="w-10 h-10 rounded-xl bg-slate-10 flex items-center justify-center text-slate-600">
                <HelpCircle size={20} />
              </div>
              {t("guide.title", { name: meta?.label })}
            </DialogTitle>
            <DialogDescription>
              {t("guide.subtitle", { name: meta?.label })}
            </DialogDescription>
          </DialogHeader>

          {/* Tabs */}
          <div className="overflow-y-auto max-h-[calc(90vh-110px)] p-6 pt-0!">
            <div className="flex border-b border-[var(--border)] gap-1 overflow-x-auto scrollbar-none">
              {tabs.map((tab, i) => (
                <button
                  key={i}
                  onClick={() => {
                    setActiveTab(i);
                    setActiveStep(0);
                  }}
                  className={`flex items-center gap-1.5 px-3 py-2 text-xs font-medium rounded-t-lg whitespace-nowrap border-b-2 transition-all ${activeTab === i
                    ? "border-[var(--primary)] text-[var(--primary)] bg-[var(--primary)]/5"
                    : "border-transparent text-[var(--muted-foreground)] hover:text-[var(--foreground)] hover:bg-[var(--muted)]"
                    }`}
                >
                  {p(tab.label)}
                </button>
              ))}
            </div>

            {/* Steps */}
            <AnimatePresence mode="wait">
              <motion.div
                key={activeTab + "-" + activeStep}
                initial={{ opacity: 0, x: locale?.startsWith("ar") ? -12 : 12 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: locale?.startsWith("ar") ? 12 : -12 }}
                transition={{ duration: 0.2 }}
                className="p-6 space-y-4"
              >
                <div className="flex items-start gap-3">
                  <span
                    className="flex-shrink-0 w-7 h-7 rounded-full text-xs font-bold text-white flex items-center justify-center mt-0.5"
                    style={{
                      background: `linear-gradient(135deg, rgb(var(--primary-from)), rgb(var(--primary-to)))`,
                    }}
                  >
                    {activeStep + 1}
                  </span>
                  <div>
                    <p className="text-sm font-semibold text-[var(--card-foreground)]">
                      {p(currentStep?.title)}
                    </p>
                    <p className="text-sm text-[var(--muted-foreground)] leading-relaxed mt-1">
                      {p(currentStep?.desc)}
                    </p>
                    {currentStep?.url && (
                      <div className="mt-3 space-y-2">
                        {!currentStep?.notNeedStored && (
                          <Select
                            value={selectedStoreId}
                            onValueChange={(v) => setSelectedStoreId(v)}
                          >
                            <SelectTrigger className="h-9 w-56 rounded-xl">
                              <SelectValue placeholder={t("guide.selectStore")} />
                            </SelectTrigger>
                            <SelectContent>
                              {storeOptions.map((s) => (
                                <SelectItem key={s.id} value={s.id}>
                                  {s.name}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        )}

                        {(() => {
                          const isFn = typeof currentStep.url === "function";
                          
                          const storeId = selectedStoreId || store?.id;
                          if (isFn && !storeId && !currentStep?.notNeedStored ) return null;
                          const url = isFn 
                            ? currentStep.url(user, storeId)
                            : currentStep.url;

                          return (
                            <div className="flex items-center justify-between gap-2 rounded-xl border bg-muted/40 px-3 py-2">
                              <a
                                href={url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-sm text-primary hover:underline break-all"
                              >
                                {url}
                              </a>

                              <button
                                onClick={() => navigator.clipboard.writeText(url)}
                                className="text-xs font-medium px-2 py-1 rounded-xl bg-primary/10 hover:bg-primary/20 transition"
                              >
                                <Copy size={12} className="text-primary" />
                              </button>
                            </div>
                          );
                        })()}
                      </div>
                    )}
                  </div>
                </div>

                {currentStep?.image && (
                  <div
                    className="rounded-xl overflow-hidden border border-[var(--border)] bg-[var(--muted)] relative cursor-zoom-in hover:ring-2 hover:ring-[var(--primary)]/30 transition-all"
                    // reserve vertical space and cap maximum height to viewport
                    style={{ minHeight: 250, maxHeight: "60vh" }}
                    onClick={(e) => {
                      e.stopPropagation();
                      setPreviewImage(currentStep.image);
                    }}
                  >
                    {/* Skeleton / placeholder shown while image loads */}
                    {!imgLoaded && (
                      <div className="absolute inset-0 flex items-center justify-center p-4">
                        <div className="w-full h-full rounded-xl bg-[var(--muted)] animate-pulse" />
                      </div>
                    )}

                    <img
                      src={currentStep.image}
                      alt={p(currentStep.title)}
                      loading="lazy"
                      // reserve intrinsic size to avoid layout jump (adjust if you know the image size)
                      width={1200}
                      height={700}
                      onLoad={() => setImgLoaded(true)}
                      onError={(e) => {
                        e.currentTarget.style.display = "none";
                        setImgLoaded(false);
                        // show fallback (next sibling placeholder already present)
                      }}
                      className={`w-full h-full max-h-[350px] object-contain block transition-opacity duration-200 ease-out ${imgLoaded ? "opacity-100" : "opacity-0"}`}
                      style={{ display: "block" }}
                    />

                    {/* fallback UI (keeps same shape) */}
                    <div
                      style={{ display: "none" }}
                      className="h-44 flex-col items-center justify-center gap-2 text-[var(--muted-foreground)]"
                    >
                      <ImageIcon size={28} className="opacity-30" />
                      <p className="text-xs">{t("guide.imagePlaceholder")}</p>
                    </div>
                  </div>
                )}

                {currentStep?.tip && (
                  <div className="flex flex-col gap-3 p-3 rounded-xl bg-[var(--primary)]/5 border border-[var(--primary)]/15">
                    <div className="flex gap-2.5">
                      <Info
                        size={14}
                        className="text-[var(--primary)] flex-shrink-0 mt-0.5"
                      />
                      <p className="text-xs text-[var(--foreground)] leading-relaxed">
                        {p(currentStep.tip)}
                      </p>
                    </div>

                    {currentStep.copyableTip && (
                      <div className="flex items-center justify-between gap-2 px-2 py-1.5 rounded-lg bg-black/5 dark:bg-white/5 border border-dashed border-[var(--primary)]/20 ml-6">
                        <span className="text-[10px] font-mono text-[var(--muted-foreground)] truncate">
                          {p(currentStep.copyableTip)}
                        </span>

                        <button
                          onClick={() => {
                            const textToCopy = p(currentStep.copyableTip);
                            navigator.clipboard.writeText(textToCopy);
                          }}
                          className="text-xs font-medium px-2 py-1 rounded-xl bg-primary/10 hover:bg-primary/20 transition flex-shrink-0"
                        >
                          <Copy size={12} className="text-primary" />
                        </button>
                      </div>
                    )}
                  </div>
                )}
              </motion.div>
            </AnimatePresence>

            {/* Step Navigation */}
            <div className="border-t border-[var(--border)] py-4 flex items-center justify-between gap-3">
              <GhostBtn
                onClick={handlePrev}
                className={activeStep === 0 ? "opacity-30 pointer-events-none" : ""}
              >
                <ChevronLeft
                  size={14}
                  className={
                    "rtl:-rotate-180 rtl:transition-transform  ltr:transition-transform"
                  }
                />{" "}
                {t("guide.prev")}
              </GhostBtn>

              <div className="flex items-center gap-1.5">
                {currentSteps.map((_, i) => (
                  <button
                    key={i}
                    onClick={() => setActiveStep(i)}
                    className="rounded-full transition-all duration-200"
                    style={{
                      width: i === activeStep ? "16px" : "6px",
                      height: "6px",
                      background:
                        i === activeStep
                          ? `rgb(var(--primary-from))`
                          : "var(--border)",
                    }}
                  />
                ))}
              </div>

              {activeStep < currentSteps.length - 1 ? (
                <PrimaryBtn
                  onClick={handleNext}
                >
                  {t("guide.next")}
                  <ChevronRight
                    size={14}
                    className={
                      "rtl:rotate-180 rtl:transition-transform  ltr:transition-transform"
                    }
                  />
                </PrimaryBtn>
              ) : meta?.guide?.docsUrl ? (
                <a
                  href={meta.guide.docsUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <PrimaryBtn>
                    <ExternalLink size={13} /> {t("guide.docs")}
                  </PrimaryBtn>
                </a>
              ) : null}
            </div>
          </div>

        </DialogContent>
      </Dialog>
      <ImagePreviewModal
        src={previewImage}
        isOpen={!!previewImage}
        onClose={() => setPreviewImage(null)}
      />
    </>
  );
}

// ─── Stores Management Table ──────────────────────────────────────────────
export function StoresTable({
  compact = false,
  t,
  stores,
  totalRecords,
  loading,
  onFetch,
  onConfigure,
  onOpenGuide,
  onOpenWebhook,
  onToggleStore,
  onSync,
  onAutoIntegratedAction,
  onDelete,
}) {
  const { handleExport, exportLoading } = useExport();
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [provider, setProvider] = useState("");
  const [dateRange, setDateRange] = useState({ startDate: null, endDate: null });
  const [providerDraft, setProviderDraft] = useState("");
  const [dateRangeDraft, setDateRangeDraft] = useState({ startDate: null, endDate: null });
  const [page, setPage] = useState(1);
  const [loadingAction, setLoadingAction] = useState(null);
  const searchTimer = useRef(null);
  const [limit, setLimit] = useState(12);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  const buildParams = (overrides = {}) => {
    const params = { page, limit: limit, ...overrides };
    if (debouncedSearch?.trim()) params.search = debouncedSearch.trim();
    if (provider) params.provider = provider;
    if (dateRange?.startDate) params.startDate = dateRange.startDate;
    if (dateRange?.endDate) params.endDate = dateRange.endDate;
    return params;
  };

  useEffect(() => {
    clearTimeout(searchTimer.current);
    searchTimer.current = setTimeout(() => {
      setDebouncedSearch(search);
      setPage(1);
    }, 350);
    return () => clearTimeout(searchTimer.current);
  }, [search]);

  useEffect(() => {
    onFetch(buildParams());
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [debouncedSearch, provider, dateRange]);

  const refresh = (overrides = {}) => {
    onFetch(buildParams(overrides));
  };

  const runAction = async (type, store, fn) => {
    setLoadingAction(`${store.id}:${type}`);
    try {
      await fn();
    } catch (e) {
      // errors are surfaced via toast inside the handlers
    } finally {
      setLoadingAction(null);
    }
  };

  const rowLoading = (store) => loadingAction?.startsWith(`${store.id}:`);
  const actionLoading = (store, type) => loadingAction === `${store.id}:${type}`;

  const handleSearch = () => {
    setPage(1);
    setDebouncedSearch(search);
  };

  const handleApplyFilters = () => {
    setProvider(providerDraft);
    setDateRange(dateRangeDraft);
    setPage(1);
  };

  const onPageChange = ({ page: p, per_page: l }) => {
    setPage(p);
    setLimit(l);
    refresh({ page: p, limit: l });
  };

  const handleExportClick = () => {
    const params = buildParams();
    delete params.page;
    delete params.limit;
    handleExport({ endpoint: "/stores/export", params, filename: `stores_${Date.now()}.xlsx` });
  };

  const hasActiveFilters = Boolean(
    debouncedSearch?.trim() || provider || dateRange?.startDate || dateRange?.endDate
  );

  const getRowActions = (store) => {
    const config = PROVIDER_CONFIG[store.provider];
    const isIntegrated = store.isIntegrated;
    const isActive = store.isActive;
    const isSyncing = store.syncStatus === "syncing";
    const loading = rowLoading(store);

    const actions = [];

    actions.push({
      icon: actionLoading(store, "toggle") ? <Loader2 className="animate-spin" /> : <Power />,
      tooltip: isIntegrated
        ? isActive
          ? t("table.deactivate")
          : t("table.activate")
        : t("table.activate"),
      variant: isActive ? "slate" : "emerald",
      disabled: !isIntegrated || loading,
      onClick: () => runAction("toggle", store, () => onToggleStore(store)),
    });

    actions.push({
      icon: actionLoading(store, "settings") ? <Loader2 className="animate-spin" /> : <Settings2 />,
      tooltip: isIntegrated ? t("card.editSettings") : t("card.configureSettings"),
      disabled: loading,
      onClick: () => runAction("settings", store, () => onConfigure(store.provider, store)),
    });

    if (config?.showWebhook) {
      actions.push({
        icon: actionLoading(store, "webhook") ? <Loader2 className="animate-spin" /> : <Webhook />,
        tooltip: t("table.webhooks"),
        hidden: !isIntegrated,
        disabled: loading,
        onClick: () => runAction("webhook", store, () => onOpenWebhook(store.provider, store)),
      });
    }

    if (isIntegrated) {
      actions.push({
        icon: actionLoading(store, "sync") ? <Loader2 className="animate-spin" /> : <RefreshCw className={isSyncing ? "animate-spin" : ""} />,
        tooltip: isSyncing ? t("table.syncInProgress") : t("card.sync"),
        variant: "blue",
        disabled: isSyncing || !isActive || loading,
        onClick: () => runAction("sync", store, () => onSync(store.id)),
      });
    }

    if (config?.autoIntegrated) {
      actions.push({
        icon: actionLoading(store, "auto") ? <Loader2 className="animate-spin" /> : isIntegrated ? <X /> : <Zap />,
        tooltip: isIntegrated ? t("card.cancelIntegration") : t("card.integrate"),
        variant: isIntegrated ? "red" : "amber",
        disabled: loading,
        onClick: () => runAction("auto", store, () => onAutoIntegratedAction(store)),
      });
    }

    actions.push({
      icon: actionLoading(store, "delete") ? <Loader2 className="animate-spin" /> : <Trash2 />,
      tooltip: t("table.delete"),
      variant: "red",
      disabled: loading,
      onClick: () => setDeleteTarget(store),
    });

    return actions;
  };

  const allColumns = [
    {
      key: "name",
      header: t("table.storeName"),
      cell: (row) => (
        <div className="flex flex-col">
          <span className="font-semibold text-foreground">{row.name || "—"}</span>
          {row.storeUrl ? (
            <span className="text-[11px] text-muted-foreground truncate max-w-[220px]">
              {row.storeUrl}
            </span>
          ) : null}
        </div>
      ),
    },
    {
      key: "provider",
      header: t("table.provider"),
      cell: (row) => {
        const config = PROVIDER_CONFIG[row.provider];

        return (
          <span className="inline-flex items-center gap-2">
            {config?.logo ? (
              <img
                src={config.logo}
                alt={config.label}
                className="w-5 h-5 object-contain"
                onError={(e) => (e.target.style.display = "none")}
              />
            ) : null}
            {config?.label || row.provider}
          </span>
        );
      },
    },
    {
      key: "isActive",
      header: t("table.status"),
      cell: (row) => (
        <span
          className={cn(
            "inline-flex items-center gap-1.5 text-[13px] font-medium px-2 py-0.5 rounded-full",
            row.isActive
              ? "text-emerald-700 bg-emerald-500/10 border border-emerald-500/20"
              : "text-muted-foreground bg-muted border border-border"
          )}
        >
          {row.isActive ? t("table.active") : t("table.inactive")}
        </span>
      ),
    },
    {
      key: "isIntegrated",
      header: t("table.integrated"),
      cell: (row) =>
        row.isIntegrated ? (
          <Check size={16} className="text-emerald-500" />
        ) : (
          <X size={16} className="text-muted-foreground/40" />
        ),
    },
    {
      key: "syncStatus",
      header: t("table.syncStatus"),
      cell: (row) => (
        <span className="capitalize text-[13px]">
          {row.syncStatus ? row.syncStatus.toLowerCase() : "—"}
        </span>
      ),
    },
    {
      key: "lastSyncAttemptAt",
      header: t("table.lastSyncedAt"),
      cell: (row) =>
        row.lastSyncAttemptAt
          ? new Date(row.lastSyncAttemptAt).toLocaleDateString()
          : "—",
    },
    {
      key: "created_at",
      header: t("table.createdAt"),
      cell: (row) =>
        row.created_at ? new Date(row.created_at).toLocaleDateString() : "—",
    },
    {
      key: "actions",
      header: t("table.actions"),
      cell: (row) => <ActionButtons actions={getRowActions(row)} />,
    },
  ];

  const columns = compact
    ? allColumns.filter((c) => ["name", "provider", "isActive"].includes(c.key))
    : allColumns;

  const filters = (
    <>
      <FilterField label={t("table.provider")}>
        <Select value={providerDraft || ""} onValueChange={(v) => setProviderDraft(v === "all" ? "" : v)}>
          <SelectTrigger className="h-[38px] rounded-xl">
            <SelectValue placeholder={t("table.allProviders")} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">{t("table.allProviders")}</SelectItem>
            {PROVIDERS.map((p) => {
              const config = STORE_PROVIDERS[p];
              return (
                <SelectItem key={p} value={p}>
                  {config?.label || p}
                </SelectItem>
              );
            })}
          </SelectContent>
        </Select>
      </FilterField>
      <FilterField label={t("table.createdAt")}>
        <DateRangePicker value={dateRangeDraft} onChange={setDateRangeDraft} />
      </FilterField>
    </>
  );

  return (
    <div className="mt-8">
      {/* <div className="flex items-center justify-between mb-3">
        <h2 className="text-base font-bold text-foreground">{t("table.title")}</h2>
      </div> */}
      <Table
        flat={!!compact}
        className={compact ? "border border-border/50 rounded-2xl" : ""}
        searchValue={search}
        onSearchChange={setSearch}
        onSearch={handleSearch}
        hasSearch
        actions={[
          {
            key: "export",
            color: "primary",
            label: t("table.export"),
            icon: <Download size={14} />,
            onClick: handleExportClick,
            disabled: exportLoading,
            permission: "stores.read",
          },
        ]}
        filters={compact ? null : filters}
        hasActiveFilters={hasActiveFilters}
        onApplyFilters={handleApplyFilters}
        labels={{
          searchPlaceholder: t("table.searchPlaceholder"),
          emptyTitle: t("table.emptyTitle"),
          emptySubtitle: t("table.emptySubtitle"),
          filter: t("table.filters"),
          apply: t("table.apply"),
        }}
        columns={columns}
        data={stores}
        isLoading={loading}
        // rowKey="id"
        pagination={{
          current_page: page,
          per_page: limit,
          total_records: totalRecords,
          total_pages: Math.max(1, Math.ceil(totalRecords / limit)),
        }}
        onPageChange={onPageChange}
        compact
      />
      <AlertDialog open={!!deleteTarget} onOpenChange={(open) => { if (!open) setDeleteTarget(null); }}>
        <AlertDialogContent className="rounded-xl">
          <AlertDialogHeader>
            <AlertDialogTitle>{t("table.deleteTitle")}</AlertDialogTitle>
            <AlertDialogDescription>{t("table.deleteDesc")}</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="rounded-full" disabled={deleteLoading}>{t("table.cancel")}</AlertDialogCancel>
            <AlertDialogAction
              className="rounded-full bg-red-600 hover:bg-red-700"
              disabled={deleteLoading}
              onClick={async () => {
                if (!deleteTarget) return;
                setDeleteLoading(true);
                try {
                  await onDelete(deleteTarget);
                  setDeleteTarget(null);
                } catch {
                  // error handled in parent
                } finally {
                  setDeleteLoading(false);
                }
              }}
            >
              {deleteLoading ? <Loader2 className="animate-spin" size={14} /> : t("table.confirmDelete")}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
