"use client";

import React, { useEffect, useState, useCallback, useMemo } from "react";
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
} from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { cn } from "@/utils/cn";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import api from "@/utils/api";
import toast from "react-hot-toast";

import { useRouter } from "@/i18n/navigation";
import { ModalHeader, ModalShell } from "@/components/ui/modalShell";
import { GhostBtn, PrimaryBtn } from "@/components/atoms/Button";
import { useSocket } from "@/context/SocketContext";
import { tenantId } from "@/utils/healpers";
import PageHeader from "@/components/atoms/Pageheader";
import { CustomTooltip } from "@/components/atoms/Actions";
import {
  PROVIDER_CONFIG,
  useStoreConfig,
  useStoreWebhook,
  generateEasyOrdersInstallUrl,
} from "@/hook/stores";
import { useAuth } from "@/context/AuthContext";
import { Checkbox } from "@/components/ui/checkbox";
import { Controller } from "react-hook-form";

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

  const [stores, setStores] = useState([]);
  const [loading, setLoading] = useState(true);

  // Handle EasyOrder error from URL
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const error = params.get("error");
    if (error === "easyOrder_not_found") {
      toast.error(t("messages.easyOrderNotFound") || "EasyOrder store not found for this user");
    } else if (error === "shopify_store_not_found") {
      toast.error(t("messages.shopifyNotFound") || "Shopify store not found for this user");
    } else if (error === "woocommerce_store_not_found") {
      toast.error(t("messages.woocommerceNotFound") || "Woocommerce store not found for this user");
    } else if (error === "shopify_connection_failed") {
      toast.error(t("messages.shopifyConnectionFailed"));
    }
    else if (error === "shopify_security_verification_failed") {
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
        const { storeId, status } = payload;

        setStores((prev) =>
          prev.map((store) =>
            store.id === storeId ? { ...store, syncStatus: status } : store,
          ),
        );
      }
    });

    return unsubscribe;
  }, [subscribe]);

  useEffect(() => {
    fetchStores();
  }, []);

  const fetchStores = async () => {
    try {
      setLoading(true);
      const res = await api.get("/stores");
      setStores(res.data?.records || []);
    } catch (e) {
      // toast.error(normalizeAxiosError(e));
    } finally {
      setLoading(false);
    }
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
      await fetchStores();
    } catch (e) {
      toast.error(normalizeAxiosError(e));
    }
  };

  return (
    <div className="min-h-screen p-5 ">
      {/* Header */}

      <PageHeader
        breadcrumbs={[
          { name: t("breadcrumb.home"), href: "/" },
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
          className="main-card min-h-[500px] "
        >
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {loading
              ? PROVIDERS.map((provider, i) => (
                <SkeletonCard key={provider || i} />
              ))
              : PROVIDERS.map((provider, index) => {
                const store = stores.find((s) => s.provider === provider);

                return (
                  <motion.div
                    key={provider}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.1 }}
                  >
                    <StoreCard
                      provider={provider}
                      store={store}
                      t={t}
                      onConfigure={handleConfigure}
                      onSync={handleSync}
                      onOpenWebhook={handleOpenWebhook}
                      onOpenGuide={handleOpenGuide}
                      fetchStores={fetchStores}
                      index={index}
                    />
                  </motion.div>
                );
              })}
          </div>
        </motion.div>
      </AnimatePresence>
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


function StoreCard({
  provider,
  store,
  t,
  onOpenGuide,
  onConfigure,
  onSync,
  onOpenWebhook,
  fetchStores,
  index,
}) {
  const { user, hasPermission } = useAuth();
  const config = PROVIDER_CONFIG[provider];
  const hasStore = !!store;
  const isSyncing = store?.syncStatus === "syncing";
  const isActive = store?.isActive ?? false;
  const isIntegrated = store?.isIntegrated ?? false;

  const [toggling, setToggling] = useState(false);
  const [cancelling, setCancelling] = useState(false);

  async function handleToggle() {
    if (!hasStore) {
      onConfigure(provider, store);
      return;
    }

    setToggling(true);
    try {
      await api.patch(`/stores/${store.id}`, {
        isActive: !isActive,
      });
      await fetchStores();
      toast.success(t("messages.statusUpdated"));
    } catch (e) {
      toast.error(normalizeAxiosError(e));
    } finally {
      setToggling(false);
    }
  }

  const handleEasyOrderAction = async () => {
    if (!hasStore) {
      onConfigure(provider, null);
      return;
    }

    if (isIntegrated) {
      // Cancel integration
      setCancelling(true);
      try {
        await api.patch("/stores/easyorder/cancel-integration");
        await fetchStores();
        toast.success(t("messages.integrationCancelled") || "Integration cancelled successfully");
      } catch (e) {
        toast.error(normalizeAxiosError(e));
      } finally {
        setCancelling(false);
      }
    } else {
      // Integrate: redirect to install URL
      window.location.href = generateEasyOrdersInstallUrl(user?.id);
    }
  };

  // accent shortcuts from the three new PROVIDER_CONFIG tokens
  const accent = config.accent;
  const accentBg = config.accentBg;

  // shared footer ghost-button base classes; hover tints border+text to accent
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

          {/* Toggle */}
          {hasPermission("stores.update") && (
            <div className="flex flex-col items-end gap-1 flex-shrink-0">
              <button
                onClick={handleToggle}
                disabled={toggling || isSyncing || (config.autoIntegrated && !isIntegrated)}
                className="relative rounded-full transition-all duration-300"
                style={{
                  width: 40,
                  height: 22,
                  background: isActive ? accent : "rgba(0,0,0,0.13)",
                  border: "none",
                  opacity: toggling ? 0.7 : 1,
                  cursor: toggling ? "not-allowed" : "pointer",
                }}
              >
                <span
                  className="absolute rounded-full bg-white transition-all duration-300 flex items-center justify-center"
                  style={{
                    top: 3,
                    width: 16,
                    height: 16,
                    left: isActive ? "calc(100% - 19px)" : 3,
                    boxShadow: "0 1px 4px rgba(0,0,0,0.18)",
                  }}
                >
                  {toggling && (
                    <svg
                      className="animate-spin h-2.5 w-2.5"
                      viewBox="0 0 24 24"
                      style={{ color: accent }}
                    >
                      <circle
                        className="opacity-25"
                        cx="12"
                        cy="12"
                        r="10"
                        stroke="currentColor"
                        strokeWidth="4"
                      />
                      <path
                        className="opacity-75"
                        fill="currentColor"
                        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
                      />
                    </svg>
                  )}
                </span>
              </button>
              <span
                className="font-semibold uppercase tracking-wide transition-colors duration-300"
                style={{
                  fontSize: 9,
                  color: isActive ? accent : "rgba(0,0,0,0.3)",
                }}
              >
                {toggling
                  ? t("card.updating")
                  : isActive
                    ? t("card.connected")
                    : t("card.notConnected")}
              </span>
            </div>
          )}
        </div>

        {/* Description */}
        <p className="text-xs text-gray-600 dark:text-gray-400 leading-relaxed line-clamp-2">
          {config.description}
        </p>

        {/* Status Badge — configured keeps original emerald; not-configured uses provider accent */}
        {hasStore ? (
          <span className="inline-flex items-center gap-1.5 text-[11px] font-medium text-emerald-700 dark:text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded-full w-fit">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
            {t("card.configured")}
          </span>
        ) : (
          <span
            className="inline-flex items-center gap-1.5 text-[11px] font-medium px-2 py-0.5 rounded-full w-fit"
            style={{
              color: accent,
              background: accentBg,
              border: `1px solid ${accent}30`,
            }}
          >
            <span
              className="w-1.5 h-1.5 rounded-full"
              style={{ background: accent }}
            />
            {t("card.notConfigured")}
          </span>
        )}
      </div>

      {/* Footer */}
      <div
        className="px-4 py-3 flex items-center gap-1.5 flex-wrap border-t border-white/50 dark:border-[var(--border)] bg-white/55 dark:bg-[var(--muted)]/80 backdrop-blur-md"
      >
        {provider === "easyorder" ? (
          <>
            <button
              onClick={handleEasyOrderAction}
              disabled={cancelling}
              className={fbCls}
              onMouseEnter={onEnter}
              onMouseLeave={onLeave}
            >
              {cancelling ? (
                <Loader2 size={12} className="animate-spin" />
              ) : isIntegrated ? (
                <X size={12} className="text-red-500" />
              ) : (
                <Zap size={12} className="text-amber-500" />
              )}
              {isIntegrated ? t("card.cancelIntegration") || "Cancel Integration" : t("card.integrate") || "Integrate"}
            </button>
            {hasStore && hasPermission("stores.update") && (
              <button
                onClick={() => onConfigure(provider, store)}
                className={fbCls}
                onMouseEnter={onEnter}
                onMouseLeave={onLeave}
              >
                <Settings2 size={12} />
                {t("card.settings")}
              </button>
            )}
          </>
        ) : (
          hasPermission(hasStore ? "stores.update" : "stores.create") && (
            <button
              onClick={() => onConfigure(provider, store)}
              className={fbCls}
              onMouseEnter={onEnter}
              onMouseLeave={onLeave}
            >
              <Settings2 size={12} />
              {hasStore ? t("card.settings") : t("card.configureSettings")}
            </button>
          )
        )}

        {config?.guide?.showSteps ? (
          <button
            onClick={() => onOpenGuide(provider, store)}
            className={fbCls}
            onMouseEnter={onEnter}
            onMouseLeave={onLeave}
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

        {hasStore && hasPermission("stores.read") && config.showWebhook ? (
          <button
            onClick={() => onOpenWebhook(provider, store)}
            className={`font-en ${fbCls}`}
            onMouseEnter={onEnter}
            onMouseLeave={onLeave}
          >
            <Webhook size={12} />
            Webhook
          </button>
        ) : null}

        {/* Sync pushed to end; disabled state preserved from original */}
        {hasPermission("stores.update") && (
          <button
            onClick={() => hasStore && onSync(store.id)}
            disabled={isSyncing || !hasStore || !isActive}
            className={`${fbCls} ml-auto`}
            style={{
              background: isSyncing ? accentBg : undefined,
              color: isSyncing ? accent : undefined,
              opacity: (!hasStore || !isActive) && !isSyncing ? 0.35 : 1,
              cursor: !hasStore || !isActive ? "not-allowed" : "pointer",
            }}
            onMouseEnter={(e) => {
              if (hasStore && isActive && !isSyncing) onEnter(e);
            }}
            onMouseLeave={(e) => {
              if (!isSyncing) onLeave(e);
            }}
          >
            <RefreshCw size={12} className={isSyncing ? "animate-spin" : ""} />
            {t("card.sync")}
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
    <ModalShell
      open={open}
      onOpenChange={(v) => !v && onClose()}
      maxWidth="max-w-2xl max-h-[90vh] overflow-auto!"
    >
      <ModalHeader
        icon={Settings2}
        title={t("dialog.title", { provider: config.label })}
        subtitle={t("dialog.subtitle")}
        onClose={onClose}
      />
      <div className="rounded-xl  max-h-[90vh] p-3">
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
                    type="url"
                    {...register("storeUrl")}
                    placeholder="https://your-store.com"

                  />
                  {errors?.storeUrl && (
                    <div className="text-xs text-red-600">
                      {errors.storeUrl.message}
                    </div>
                  )}
                </div>

                <div className="flex gap-1.5">
                  <Controller
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
                            value={config.webhookEndpoints?.create?.(user?.id) || ""}
                            className="flex-1 rounded-xl border border-[var(--input)] bg-[var(--background)] px-4 py-2.5 text-sm text-[var(--foreground)]"
                          />
                          <button
                            type="button"
                            onClick={() =>
                              navigator.clipboard.writeText(
                                String(
                                  config.webhookEndpoints?.create?.(user?.id) ||
                                  "",
                                ),
                              )
                            }
                            className="px-3 rounded-xl border border-[var(--border)] bg-[var(--background)] hover:bg-[var(--muted)] transition-all"
                            title="Copy"
                          >
                            <Copy size={14} />
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
                            value={config.webhookEndpoints?.update?.(user?.id) || ""}
                            className="flex-1 rounded-xl border border-[var(--input)] bg-[var(--background)] px-4 py-2.5 text-sm text-[var(--foreground)]"
                          />
                          <button
                            type="button"
                            onClick={() =>
                              navigator.clipboard.writeText(
                                String(
                                  config.webhookEndpoints?.update?.(user?.id) ||
                                  "",
                                ),
                              )
                            }
                            className="px-3 rounded-xl border border-[var(--border)] bg-[var(--background)] hover:bg-[var(--muted)] transition-all"
                            title="Copy"
                          >
                            <Copy size={14} />
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
              <div className="flex justify-end gap-2 pt-4 border-t border-gray-200 dark:border-slate-800 mb-3">
                <PrimaryBtn
                  type="submit"
                  onClick={handleSubmit(onSubmit)}
                  disabled={isSubmitting}
                  loading={isSubmitting}
                  className="w-full"
                >
                  {isEdit ? t("form.update") : t("form.create")}
                </PrimaryBtn>
              </div>
            </form>
          </>
        )}
      </div>
    </ModalShell>
  );
}

// ─── Store Webhook Modal (shape/style as shipping WebhookModal) ─────────────────

export function StoreWebhookModal({ provider, store, onClose, open, fetchStores, t }) {
  const { user } = useAuth();
  const {
    loading,
    error,
    rotating,
    copyToClipboard,
    rotateWooCommerce,
    cred,
  } = useStoreWebhook({ store, provider, onClose, open });

  const config = PROVIDER_CONFIG[provider];

  return (
    <ModalShell onClose={onClose} maxWidth="max-w-lg">
      <ModalHeader
        icon={Webhook}
        title={t("webhook.title")}
        subtitle={t("webhook.subtitle")}
        onClose={onClose}
      />

      <div className="p-6 space-y-5">
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
            {/* Webhook URLs - create */}
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-[var(--card-foreground)]">
                {t("instructions.webhookCreateOrderLabel")}
              </label>
              <div className="flex gap-2">
                <input
                  readOnly
                  value={config.webhookEndpoints.create(user?.id)}
                  className="flex-1 rounded-xl border border-[var(--input)] bg-[var(--background)] px-4 py-2.5 text-sm text-[var(--foreground)]"
                />
                <button
                  type="button"
                  onClick={() =>
                    copyToClipboard(config.webhookEndpoints.create(user?.id))
                  }
                  className="px-3 rounded-xl border border-[var(--border)] bg-[var(--background)] hover:bg-[var(--muted)] transition-all"
                  title="Copy"
                >
                  <Copy size={14} />
                </button>
              </div>
            </div>
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-[var(--card-foreground)]">
                {t("instructions.webhookUpdateStatusLabel")}
              </label>
              <div className="flex gap-2">
                <input
                  readOnly
                  value={config.webhookEndpoints.update(user?.id)}
                  className="flex-1 rounded-xl border border-[var(--input)] bg-[var(--background)] px-4 py-2.5 text-sm text-[var(--foreground)]"
                />
                <button
                  type="button"
                  onClick={() =>
                    copyToClipboard(config.webhookEndpoints.update(user?.id))
                  }
                  className="px-3 rounded-xl border border-[var(--border)] bg-[var(--background)] hover:bg-[var(--muted)] transition-all"
                  title="Copy"
                >
                  <Copy size={14} />
                </button>
              </div>
            </div>
            <p className="text-[11px] text-[var(--muted-foreground)]">
              {t("webhook.urlHint")}
            </p>

            {/* WooCommerce: system secrets (read-only + copy + regenerate) */}
            {provider === "woocommerce" && (
              <>
                <div className="grid gap-3 md:grid-cols-2 grid-cols-1">
                  {cred.webhookCreateOrderSecret && (
                    <div className="space-y-1.5">
                      <label className="text-sm font-medium text-[var(--card-foreground)]">
                        {t("form.webhookCreateOrderSecret")}
                      </label>
                      <div className="flex gap-2">
                        <input
                          readOnly
                          value={cred.webhookCreateOrderSecret}
                          className="flex-1 rounded-xl border border-[var(--input)] bg-[var(--background)] px-4 py-2.5 text-sm text-[var(--foreground)]"
                        />
                        <button
                          type="button"
                          onClick={() =>
                            copyToClipboard(cred.webhookCreateOrderSecret)
                          }
                          className="px-3 rounded-xl border border-[var(--border)] bg-[var(--background)] hover:bg-[var(--muted)] transition-all"
                          title="Copy"
                        >
                          <Copy size={14} />
                        </button>
                      </div>
                    </div>
                  )}
                  {cred.webhookUpdateStatusSecret && (
                    <div className="space-y-1.5">
                      <label className="text-sm font-medium text-[var(--card-foreground)]">
                        {t("form.webhookUpdateStatusSecret")}
                      </label>
                      <div className="flex gap-2">
                        <input
                          readOnly
                          value={cred.webhookUpdateStatusSecret}
                          className="flex-1 rounded-xl border border-[var(--input)] bg-[var(--background)] px-4 py-2.5 text-sm text-[var(--foreground)]"
                        />
                        <button
                          type="button"
                          onClick={() =>
                            copyToClipboard(cred.webhookUpdateStatusSecret)
                          }
                          className="px-3 rounded-xl border border-[var(--border)] bg-[var(--background)] hover:bg-[var(--muted)] transition-all"
                          title="Copy"
                        >
                          <Copy size={14} />
                        </button>
                      </div>
                    </div>
                  )}
                </div>
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
              </>
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
    </ModalShell>
  );
}

function SkeletonCard() {
  return (
    <div className="rounded-xl border border-[var(--border)] overflow-hidden animate-pulse bg-[var(--muted)]">
      <div className="p-5 space-y-4">
        <div className="flex items-start justify-between">
          <div className="w-14 h-14 rounded-xl bg-[var(--border)]" />
          <div className="w-11 h-6 rounded-full bg-[var(--border)]" />
        </div>
        <div className="space-y-1.5">
          <div className="h-4 w-28 rounded bg-[var(--border)]" />
          <div className="h-2.5 w-20 rounded bg-[var(--border)]" />
        </div>
        <div className="space-y-1.5">
          <div className="h-2 w-full rounded bg-[var(--border)]" />
          <div className="h-2 w-4/5 rounded bg-[var(--border)]" />
        </div>
      </div>
      <div className="border-t border-[var(--border)] px-4 py-3 flex gap-2">
        <div className="h-7 w-20 rounded-xl bg-[var(--border)]" />
        <div className="h-7 w-20 rounded-xl bg-[var(--border)]" />
        <div className="h-7 w-16 rounded-xl bg-[var(--border)] ml-auto" />
      </div>
    </div>
  );
}
function pick(bilingualObj, locale) {
  if (!bilingualObj) return "";
  return locale?.startsWith("ar") ? bilingualObj.ar : bilingualObj.en;
}

export function StoreGuideModal({ provider, onClose }) {
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
  const [imgLoaded, setImgLoaded] = useState(false);
  return (
    <ModalShell onClose={onClose} maxWidth="max-w-xl">
      <ModalHeader
        icon={HelpCircle}
        title={t("guide.title", { name: meta?.label })}
        subtitle={t("guide.subtitle", { name: meta?.label })}
        onClose={onClose}
      />

      {/* Tabs */}
      <div className="flex border-b border-[var(--border)] px-6 gap-1 pt-3 overflow-x-auto scrollbar-none">
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
                <div className="mt-3 flex items-center justify-between gap-2 rounded-xl border bg-muted/40 px-3 py-2">
                  {(() => {
                    // If URL is a function, call it with store/admin ID (replace with your param)
                    console.log(user)
                    const url =
                      typeof currentStep.url === "function"
                        ? currentStep.url(user) // or any param needed
                        : currentStep.url;

                    return (
                      <>
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
                      </>
                    );
                  })()}
                </div>
              )}
            </div>
          </div>

          {currentStep?.image && (
            <div
              className="rounded-xl  overflow-hidden border border-[var(--border)] bg-[var(--muted)] relative"
              // reserve vertical space and cap maximum height to viewport
              style={{ minHeight: 160, maxHeight: "60vh" }}
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
      <div className="border-t border-[var(--border)] px-6 py-4 flex items-center justify-between gap-3">
        <GhostBtn
          onClick={() => setActiveStep((v) => Math.max(0, v - 1))}
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
            onClick={() =>
              setActiveStep((v) => Math.min(currentSteps.length - 1, v + 1))
            }
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
    </ModalShell>
  );
}
