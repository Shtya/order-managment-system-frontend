"use client";

import { useEffect, useState } from "react";
import { Controller } from "react-hook-form";
import { useTranslations } from "next-intl";
import toast from "react-hot-toast";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import api from "@/utils/api";
import { normalizeAxiosError } from "@/utils/axios";
import {
  AGENT_GENDERS,
  AGENT_LANGUAGES,
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

export default function StepGeneral({ control, errors }) {
  const t = useTranslations("agents");
  const [providers, setProviders] = useState([]);
  const [providersLoading, setProvidersLoading] = useState(false);

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

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label className="text-sm font-semibold" description={t("form.nameDescription")}>
          {t("form.name")}
        </Label>
        <Controller
          name="name"
          control={control}
          render={({ field }) => (
            <Input
              {...field}
              placeholder={t("form.name")}
              className="rounded-xl h-[50px]"
            />
          )}
        />
        {errors.name ? (
          <p className="text-xs text-red-600">{t(errors.name.message)}</p>
        ) : null}
      </div>

      <div className="space-y-2">
        <Label className="text-sm font-semibold" description={t("form.languageDescription")}>
          {t("form.language")}
        </Label>
        <Controller
          control={control}
          name="language"
          render={({ field }) => (
            <Select value={field.value} onValueChange={field.onChange}>
              <SelectTrigger className="h-[50px] rounded-xl">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {AGENT_LANGUAGES.map((language) => (
                  <SelectItem key={language} value={language}>
                    {t(`languages.${language}`)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
        />
        {errors.language ? (
          <p className="text-xs text-red-600">{t(errors.language.message)}</p>
        ) : null}
      </div>

      <div className="space-y-2">
        <Label className="text-sm font-semibold" description={t("form.genderDescription")}>
          {t("form.gender")}
        </Label>
        <Controller
          control={control}
          name="gender"
          render={({ field }) => (
            <Select value={field.value} onValueChange={field.onChange}>
              <SelectTrigger className="h-[50px] rounded-xl">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {AGENT_GENDERS.map((gender) => (
                  <SelectItem key={gender} value={gender}>
                    {t(`genders.${gender}`)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
        />
        {errors.gender ? (
          <p className="text-xs text-red-600">{t(errors.gender.message)}</p>
        ) : null}
      </div>

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

      <div className="space-y-2">
        <Label className="text-sm font-semibold" description={t("form.customInstructionsDescription")}>
          {t("form.customInstructions")}
        </Label>
        <Controller
          name="customInstructions"
          control={control}
          render={({ field }) => (
            <Textarea
              {...field}
              rows={4}
              maxLength={4000}
              placeholder={t("form.customInstructionsPlaceholder")}
              className="rounded-xl"
            />
          )}
        />
        {errors.customInstructions ? (
          <p className="text-xs text-red-600">{t(errors.customInstructions.message)}</p>
        ) : null}
      </div>

      <div className="flex items-center gap-3 py-2">
        <Controller
          control={control}
          name="isActive"
          render={({ field }) => (
            <Switch
              checked={field.value}
              onCheckedChange={field.onChange}
            />
          )}
        />
        <Label className="text-sm font-semibold" description={t("form.isActiveDescription")}>
          {t("form.isActive")}
        </Label>
      </div>
    </div>
  );
}
