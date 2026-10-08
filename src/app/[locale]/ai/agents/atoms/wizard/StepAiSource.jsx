"use client";

import { useEffect, useMemo, useState } from "react";
import { Controller } from "react-hook-form";
import { useLocale, useTranslations } from "next-intl";
import toast from "react-hot-toast";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Loader2, Sparkles } from "lucide-react";
import { cn } from "@/utils/cn";
import { usePlatformSettings } from "@/context/PlatformSettingsContext";
import { Link } from "@/i18n/navigation";
import { dollor, dollorSign } from "@/utils/healpers";
import api from "@/utils/api";
import { normalizeAxiosError } from "@/utils/axios";
import {
  AGENT_AI_SOURCE_HOSTED,
  AGENT_AI_SOURCE_TENANT,
  AGENT_PROVIDER_AUTO,
} from "./agentWizardSchema";

const getConnectedAiProviders = (providers) => {
  return providers.filter((provider) => {
    const integration = provider.integration;
    return !!(
      provider.isActive !== false &&
      integration &&
      (integration.credentials?.apiKey || integration.credentials)
    );
  });
};

export default function StepAiSource({ control, watch, setValue }) {
  const t = useTranslations("agents");
  const locale = useLocale();
  const { settings, formatCurrency } = usePlatformSettings();
  const formatUsdPrice = (value, fallback) => {
    const n = Number(value);
    if (!Number.isFinite(n)) return fallback;
    return n.toLocaleString("en-US", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 6,
    });
  };
  const hosted = settings?.billing?.aiHosted || {};
  const hostedInputLabel = formatUsdPrice(
    hosted.inputTokenPrice ?? hosted.tokenPrice ?? 0.5,
    "0.50",
  );
  const hostedOutputLabel = formatUsdPrice(
    hosted.outputTokenPrice ?? hosted.tokenPrice ?? 0.5,
    "0.50",
  );
  const [providers, setProviders] = useState([]);
  const [providersLoading, setProvidersLoading] = useState(false);
  const [hostedModels, setHostedModels] = useState([]);
  const [hostedLoading, setHostedLoading] = useState(false);
  const [wallet, setWallet] = useState(null);
  const [walletLoading, setWalletLoading] = useState(false);

  const aiSource = watch("aiSource") || AGENT_AI_SOURCE_HOSTED;
  const hostedModelId = watch("hostedModelId");

  useEffect(() => {
    let cancelled = false;
    const fetchProviders = async () => {
      try {
        setProvidersLoading(true);
        const providersRes = await api.get("/ai/providers", {
          params: { scope: "all", isActive: "true" },
        });
        if (cancelled) return;
        const providerRecords = Array.isArray(providersRes.data)
          ? providersRes.data
          : providersRes.data?.records || [];
        setProviders(getConnectedAiProviders(providerRecords));
      } catch (error) {
        if (!cancelled) {
          setProviders([]);
          toast.error(normalizeAxiosError(error));
        }
      } finally {
        if (!cancelled) setProvidersLoading(false);
      }
    };
    fetchProviders();
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        setHostedLoading(true);
        const { data } = await api.get("/ai/hosted-models");
        if (cancelled) return;
        const rows = Array.isArray(data) ? data : data?.records || [];
        setHostedModels(rows.filter((row) => row?.isActive !== false));
      } catch (error) {
        if (!cancelled) {
          setHostedModels([]);
          toast.error(normalizeAxiosError(error));
        }
      } finally {
        if (!cancelled) setHostedLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        setWalletLoading(true);
        const { data } = await api.get("/wallet/my-wallet");
        if (!cancelled) setWallet(data);
      } catch {
        if (!cancelled) setWallet(null);
      } finally {
        if (!cancelled) setWalletLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const pickHostedModelId = (rows, current) => {
    if (current && rows.some((row) => row.id === current)) return current;
    return rows.find((row) => row.isRecommended)?.id || rows[0]?.id || "";
  };

  useEffect(() => {
    if (aiSource !== AGENT_AI_SOURCE_HOSTED || hostedLoading) return;
    const next = pickHostedModelId(hostedModels, hostedModelId);
    if (next && next !== hostedModelId) {
      setValue("hostedModelId", next, { shouldDirty: false });
    }
  }, [aiSource, hostedLoading, hostedModels, hostedModelId, setValue]);

  const selectedHosted = useMemo(
    () => hostedModels.find((row) => row.id === hostedModelId) || hostedModels[0] || null,
    [hostedModels, hostedModelId],
  );

  const hostedDescription = (row) => {
    if (!row) return "";
    if (locale === "ar") return row.descriptionAr || row.description || "";
    return row.description || row.descriptionAr || "";
  };

  return (
    <div className="space-y-4">
      <p className="text-xs text-muted-foreground -mt-1">{t("form.aiSourceDescription")}</p>

      <Controller
        control={control}
        name="aiSource"
        render={({ field }) => (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3" role="radiogroup">
            {[
              {
                id: AGENT_AI_SOURCE_HOSTED,
                title: t("form.aiSourceHosted"),
                hint: t("form.aiSourceHostedHint"),
                badge: t("form.aiSourceHostedBadge"),
              },
              {
                id: AGENT_AI_SOURCE_TENANT,
                title: t("form.aiSourceTenant"),
                hint: t("form.aiSourceTenantHint"),
              },
            ].map((option) => {
              const checked = field.value === option.id;
              return (
                <label
                  key={option.id}
                  className={cn(
                    "flex gap-3 items-start rounded-2xl border p-4 cursor-pointer transition-colors",
                    checked
                      ? "border-primary bg-primary/5"
                      : "border-border hover:bg-muted/40",
                  )}
                >
                  <input
                    type="radio"
                    className="mt-1 accent-primary"
                    checked={checked}
                    onChange={() => field.onChange(option.id)}
                  />
                  <span>
                    <span className="text-sm font-bold text-foreground">
                      {option.title}
                      {option.badge ? (
                        <span className="ms-2 inline-flex rounded-md bg-primary px-1.5 py-0.5 text-[11px] font-medium text-white">
                          {option.badge}
                        </span>
                      ) : null}
                    </span>
                    <span className="mt-1 block text-xs text-muted-foreground">
                      {option.hint}
                    </span>
                  </span>
                </label>
              );
            })}
          </div>
        )}
      />

      {aiSource === AGENT_AI_SOURCE_HOSTED ? (
        <div className="space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-border bg-muted/40 px-4 py-3">
            <div>
              <p className="text-xs text-muted-foreground">{t("wizard.hostedPriceLabel")}</p>
              <p className="text-sm font-bold text-foreground mt-0.5">
                {t("wizard.hostedPriceValue", {
                  input: `$${hostedInputLabel}`,
                  output: `$${hostedOutputLabel}`,
                })}
              </p>
            </div>
            <p className="text-xs text-muted-foreground">{t("wizard.hostedPriceShared")}</p>
          </div>

          {hostedLoading ? (
            <p className="text-xs text-muted-foreground flex items-center gap-2">
              <Loader2 size={12} className="animate-spin" />
            </p>
          ) : hostedModels.length === 0 ? (
            <p className="text-sm text-muted-foreground rounded-2xl border border-dashed border-border px-4 py-3">
              {t("wizard.hostedModelsEmpty")}
            </p>
          ) : hostedModels.length === 1 && selectedHosted ? (
            <div>
              <p className="text-xs text-muted-foreground mb-2">{t("wizard.hostedModelUsed")}</p>
              <div className="flex items-center gap-3 rounded-2xl border  p-4">
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary text-white">
                  <Sparkles size={18} />
                </span>
                <div className="min-w-0">
                  <p className="text-sm font-bold text-foreground">
                    {selectedHosted.name}
                    {selectedHosted.isRecommended ? (
                      <span className="ms-2 rounded-md bg-emerald-100 px-1.5 py-0.5 text-[11px] font-medium text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300">
                        {t("wizard.hostedRecommended")}
                      </span>
                    ) : null}
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    {hostedDescription(selectedHosted) || t("wizard.hostedModelOnlyHint")}
                  </p>
                </div>
              </div>
            </div>
          ) : (
            <div className="space-y-2">
              <Label className="text-sm font-semibold">{t("wizard.hostedModelSelect")}</Label>
              <Controller
                control={control}
                name="hostedModelId"
                render={({ field }) => (
                  <Select value={field.value || undefined} onValueChange={field.onChange}>
                    <SelectTrigger className="h-[50px] rounded-xl">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {hostedModels.map((row) => (
                        <SelectItem key={row.id} value={row.id}>
                          {row.name}
                          {row.isRecommended ? ` — ${t("wizard.hostedRecommended")}` : ""}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              />
            </div>
          )}

          <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-border bg-muted/40 px-4 py-3">
            <div>
              <p className="text-xs text-muted-foreground">{t("wizard.walletBalance")}</p>
              <p className="text-lg font-bold text-foreground">
                {walletLoading ? (
                  <Loader2 size={16} className="inline animate-spin" />
                ) : (
                  formatCurrency(wallet?.aiBalance || 0, dollor, dollorSign)
                )}
              </p>
            </div>
            <Link
              href="/wallet"
              className="inline-flex h-10 items-center rounded-xl border border-border bg-background px-4 text-sm font-semibold text-foreground hover:bg-muted/60"
            >
              {t("wizard.chargeAiWallet")}
            </Link>
          </div>
        </div>
      ) : (
        <div className="space-y-3">
          <div className="space-y-2">
            <Label className="text-sm font-semibold" description={t("form.providerDescription")}>
              {t("form.provider")}
            </Label>
            <Controller
              control={control}
              name="responseProviderId"
              render={({ field }) => (
                <Select
                  value={field.value}
                  onValueChange={field.onChange}
                  disabled={providersLoading}
                >
                  <SelectTrigger className="h-[50px] rounded-xl">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value={AGENT_PROVIDER_AUTO}>
                      {t("provider.auto")}
                    </SelectItem>
                    {providers.map((provider) => (
                      <SelectItem key={provider.id} value={provider.id}>
                        {provider.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            />
          </div>
          {!providersLoading && providers.length === 0 ? (
            <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-dashed border-border px-4 py-3">
              <p className="text-sm text-muted-foreground">{t("wizard.noProvider")}</p>
              <Link
                href="/ai"
                className="inline-flex h-10 items-center rounded-xl border border-primary px-4 text-sm font-semibold text-primary hover:bg-primary/5"
              >
                {t("wizard.addProvider")}
              </Link>
            </div>
          ) : null}
        </div>
      )}
    </div>
  );
}
