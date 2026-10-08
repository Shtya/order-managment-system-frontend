"use client";

import { Controller } from "react-hook-form";
import { useTranslations } from "next-intl";
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
import {
  Coins,
  FileText,
  Image as ImageIcon,
  Info,
  Mic,
  Video,
} from "lucide-react";
import { cn } from "@/utils/cn";
import { usePlatformSettings } from "@/context/PlatformSettingsContext";
import {
  AGENT_GENDERS,
  AGENT_LANGUAGES,
  AGENT_MEDIA_INPUTS,
} from "./agentWizardSchema";

const MEDIA_ICONS = {
  acceptImage: ImageIcon,
  acceptVideo: Video,
  acceptDocument: FileText,
  acceptAudio: Mic,
};

const MEDIA_TINTS = [
  "bg-emerald-100 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400",
  "bg-violet-100 text-violet-600 dark:bg-violet-900/30 dark:text-violet-400",
  "bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400",
  "bg-amber-100 text-amber-600 dark:bg-amber-900/30 dark:text-amber-400",
];

export default function StepGeneral({ control, errors, watch, setValue }) {
  const t = useTranslations("agents");
  const { settings } = usePlatformSettings();
  const formatUsdPrice = (value, fallback) => {
    const n = Number(value);
    if (!Number.isFinite(n)) return fallback;
    return n.toLocaleString("en-US", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 6,
    });
  };
  const tokenPriceLabel = formatUsdPrice(
    settings?.billing?.aiMedia?.tokenPrice ?? 0.5,
    "0.50",
  );
  const audioMinutePriceLabel = formatUsdPrice(
    settings?.billing?.aiMedia?.audioMinutePrice ?? 0.006,
    "0.006",
  );

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
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

      <div className="pt-2">
        <p className="text-sm font-semibold text-foreground mb-1">
          {t("wizard.mediaInputsTitle")}
        </p>
        <p className="text-xs text-muted-foreground mb-3">
          {t("wizard.mediaInputsDescription")}
        </p>

        <div className="mb-3 flex flex-col gap-2 rounded-lg border border-border bg-muted/40 px-3 py-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-2 text-sm font-semibold text-foreground">
            <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
              <Coins size={16} />
            </span>
            {t("wizard.mediaPricingLabel")}
          </div>
          <div className="space-y-1 text-xs text-muted-foreground sm:text-end">
            <p>
              {t("wizard.mediaPricingCurrent")}{" "}
              <span className="font-semibold text-foreground">${tokenPriceLabel}</span>{" "}
              {t("wizard.mediaPricingUnit")}
            </p>
            <p>
              {t("wizard.mediaPricingCurrent")}{" "}
              <span className="font-semibold text-foreground">${audioMinutePriceLabel}</span>{" "}
              {t("wizard.mediaAudioPricingUnit")}
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {AGENT_MEDIA_INPUTS.map((id, index) => {
            const Icon = MEDIA_ICONS[id] ?? ImageIcon;
            const checked = watch(id) === true;
            return (
              <label
                key={id}
                className={cn(
                  "border rounded-lg p-3 cursor-pointer hover:bg-muted/50 transition-colors",
                  checked ? "border-border" : "border-border opacity-80",
                )}
              >
                <div className="flex items-start justify-between gap-2">
                  <div
                    className={cn(
                      "w-8 h-8 rounded-lg flex items-center justify-center shrink-0",
                      MEDIA_TINTS[index % MEDIA_TINTS.length],
                    )}
                  >
                    <Icon size={16} />
                  </div>
                  <Switch
                    checked={checked}
                    onCheckedChange={(value) =>
                      setValue(id, value === true, { shouldDirty: true })
                    }
                  />
                </div>
                <p className="mt-3 text-sm font-bold text-foreground">
                  {t(`wizard.mediaInputs.${id}.title`)}
                </p>
                <p className="mt-1 text-xs text-muted-foreground line-clamp-3">
                  {t(`wizard.mediaInputs.${id}.desc`)}
                </p>
              </label>
            );
          })}
        </div>

        <div className="mt-3 flex items-start gap-2">
          <Info size={14} className="mt-0.5 shrink-0 text-muted-foreground" />
          <p className="text-xs text-muted-foreground">
            {t("wizard.mediaInputsFooter")}
          </p>
        </div>
      </div>
    </div>
  );
}
