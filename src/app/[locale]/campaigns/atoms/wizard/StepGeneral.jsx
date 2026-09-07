"use client";

import { useEffect } from "react";
import { Controller } from "react-hook-form";
import { useTranslations } from "next-intl";
import { MessageCircle, Mail, MessageSquareText } from "lucide-react";
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
import DateRangePicker from "@/components/atoms/DateRangePicker";
import { cn } from "@/utils/cn";
import { CAMPAIGN_CATEGORIES } from "./wizardSchema";

const CHANNELS = [
  { id: "whatsapp", icon: MessageCircle, enabled: true },
  { id: "sms", icon: MessageSquareText, enabled: false },
  { id: "email", icon: Mail, enabled: false },
];

export default function StepGeneral({ control, errors, watch, setValue }) {
  const t = useTranslations("campaigns.wizard");

  const workingHoursEnabled = watch("workingHoursEnabled");
  const workingHoursTimezone = watch("workingHoursTimezone");
  const channel = watch("channel");
  const scheduleMode = watch("scheduleMode");

  useEffect(() => {
    if (!workingHoursTimezone && typeof Intl !== "undefined") {
      const detected = Intl.DateTimeFormat().resolvedOptions().timeZone;
      if (detected) setValue("workingHoursTimezone", detected, { shouldDirty: true });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label>
            {t("name")} <span className="text-red-500">*</span>
          </Label>
          <Controller
            name="name"
            control={control}
            render={({ field }) => (
              <Input {...field} maxLength={255} placeholder={t("namePlaceholder")} />
            )}
          />
          {errors.name && <p className="text-xs text-red-500">{t(errors.name.message)}</p>}
        </div>
        <div className="space-y-2">
          <Label>{t("category")}</Label>
          <Controller
            name="category"
            control={control}
            render={({ field }) => (
              <Select value={field.value} onValueChange={field.onChange}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {CAMPAIGN_CATEGORIES.map((c) => (
                    <SelectItem key={c} value={c}>
                      {t(`categories.${c}`)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label>{t("description")}</Label>
        <Controller
          name="description"
          control={control}
          render={({ field }) => (
            <Textarea {...field} value={field.value || ""} maxLength={2000} placeholder={t("descriptionPlaceholder")} />
          )}
        />
      </div>

      <div className="rounded-xl border border-border bg-muted/30 p-4 space-y-3">
        <div className="flex items-center justify-between gap-3">
          <div>
            <p className="text-sm font-semibold">{t("workingHours")}</p>
            <p className="text-xs text-muted-foreground">{t("workingHoursHint")}</p>
          </div>
          <Controller
            name="workingHoursEnabled"
            control={control}
            render={({ field }) => (
              <Switch checked={!!field.value} onCheckedChange={field.onChange} />
            )}
          />
        </div>
        {workingHoursEnabled && (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>{t("workingHoursStart")}</Label>
                <Controller
                  name="workingHoursStart"
                  control={control}
                  render={({ field }) => <Input type="time" {...field} />}
                />
              </div>
              <div className="space-y-2">
                <Label>{t("workingHoursEnd")}</Label>
                <Controller
                  name="workingHoursEnd"
                  control={control}
                  render={({ field }) => <Input type="time" {...field} />}
                />
              </div>
              {(errors.workingHoursStart || errors.workingHoursEnd) && (
                <p className="text-xs text-red-500">{t("validation.workingHoursRequired")}</p>
              )}
            </div>
            {/* <p className="text-[11px] text-muted-foreground">
              🌍 {t("timezone")}:{" "}
              <span className="font-semibold text-foreground">{workingHoursTimezone || "—"}</span>
            </p> */}
          </>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="space-y-2">
          <Label>
            {t("delayMin")} <span className="text-red-500">*</span>
          </Label>
          <Controller
            name="delayMinSeconds"
            control={control}
            render={({ field }) => <Input type="number" min={4} {...field} />}
          />
          {errors.delayMinSeconds && <p className="text-xs text-red-500">{t("validation.delayMin")}</p>}
        </div>
        <div className="space-y-2">
          <Label>
            {t("delayMax")} <span className="text-red-500">*</span>
          </Label>
          <Controller
            name="delayMaxSeconds"
            control={control}
            render={({ field }) => <Input type="number" min={4} {...field} />}
          />
          {errors.delayMaxSeconds && <p className="text-xs text-red-500">{t("validation.delayMax")}</p>}
        </div>
        <div className="space-y-2">
          <Label>{t("maxPerHour")}</Label>
          <Controller
            name="maxMessagesPerHour"
            control={control}
            render={({ field }) => (
              <Input type="number" min={1} placeholder="—" {...field} value={field.value ?? ""} />
            )}
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label>
          {t("channel")} <span className="text-red-500">*</span>
        </Label>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          {CHANNELS.map((c) => {
            const Icon = c.icon;
            const active = channel === c.id;
            return (
              <button
                key={c.id}
                type="button"
                disabled={!c.enabled}
                onClick={() => setValue("channel", c.id, { shouldDirty: true })}
                className={cn(
                  "flex gap-3 rounded-xl border p-3.5 text-start transition-all",
                  active
                    ? "border-primary bg-primary/5 shadow-[0_0_0_3px_rgb(var(--primary-shadow))]"
                    : "border-border bg-background",
                  !c.enabled && "opacity-60 cursor-not-allowed",
                )}
              >
                <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-primary/10 text-primary">
                  <Icon size={18} />
                </span>
                <span className="min-w-0">
                  <span className="block text-sm font-bold">
                    {t(`channels.${c.id}`)}
                    {!c.enabled && <span className="ms-2 text-[10px] font-medium text-muted-foreground">· {t(`channels.${c.id}Hint`)}</span>}
                  </span>
                  <span className="mt-0.5 block text-xs text-muted-foreground leading-relaxed">
                    {t(`channels.${c.id}Hint`)}
                  </span>
                </span>
              </button>
            );
          })}
        </div>
      </div>

      <div className="space-y-4">
        <div className="space-y-2">
          <Label>{t("scheduleMode")}</Label>
          <Controller
            name="scheduleMode"
            control={control}
            render={({ field }) => (
              <Select value={field.value} onValueChange={field.onChange}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="now">{t("scheduleNow")}</SelectItem>
                  <SelectItem value="scheduled">{t("scheduleScheduled")}</SelectItem>
                </SelectContent>
              </Select>
            )}
          />
        </div>
        {scheduleMode === "scheduled" && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>
                {t("scheduledDate")} <span className="text-red-500">*</span>
              </Label>
              <Controller
                name="scheduledDate"
                control={control}
                render={({ field }) => (
                  <DateRangePicker
                    mode="single"
                    value={field.value || null}
                    onChange={(date) => field.onChange(date || "")}
                    minDate="today"
                    maxDate={null}
                    placeholder={t("scheduledDate")}
                    className="theme-field w-full"
                  />
                )}
              />
            </div>
            <div className="space-y-2">
              <Label>
                {t("scheduledTime")} <span className="text-red-500">*</span>
              </Label>
              <Controller
                name="scheduledTime"
                control={control}
                render={({ field }) => <Input type="time" {...field} value={field.value || ""} />}
              />
            </div>
            {(errors.scheduledDate || errors.scheduledTime) && (
              <p className="text-xs text-red-500">
                {t(errors.scheduledDate?.message || errors.scheduledTime?.message)}
              </p>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
