"use client";

import { Controller, useWatch } from "react-hook-form";
import { useLocale, useTranslations } from "next-intl";
import { Tag } from "lucide-react";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { cn } from "@/utils/cn";

export const ISSUE_PRIORITIES = ["low", "medium", "high", "urgent"];

export function issueOptionLabel(item, locale) {
  return (
    item?.name ||
    (locale === "ar" ? item?.nameAr : item?.nameEn) ||
    item?.nameEn ||
    item?.nameAr ||
    item?.id
  );
}

export default function IssueAssignmentFields({
  children,
  control,
  errors = {},
  options = { statuses: [], roles: [], users: [] },
  employeeIds = [],
  onToggleEmployee,
  fieldNames = {},
  requiredRole = false,
}) {
  const agentsT = useTranslations("agents");
  const t = useTranslations("issues");
  const locale = useLocale();
  const err = (name) => {
    const message = errors[name]?.message;
    if (!message) return null;
    return String(message).startsWith("validation.") ? agentsT(message) : message;
  };
  const names = {
    assignedRoleId: "assignedRoleId",
    estimatedMinutes: "estimatedMinutes",
    priority: "priority",
    statusId: "statusId",
    ...fieldNames,
  };
  const { statuses = [], roles = [], users = [] } = options;
  const watchedRoleId = useWatch({ control, name: names.assignedRoleId });
  const visibleUsers = !watchedRoleId
    ? users
    : users.filter((u) => u.roleId === watchedRoleId);
  const labelOf = (item) => issueOptionLabel(item, locale);

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {children}
        <div className="space-y-2">
          <Label className="text-sm font-semibold">
            {t("form.fields.status")}
          </Label>
          <Controller
            name={names.statusId}
            control={control}
            render={({ field }) => (
              <Select
                value={field.value || "__none"}
                onValueChange={(v) => field.onChange(v === "__none" ? "" : v)}
              >
                <SelectTrigger className="h-[50px] rounded-xl">
                  <SelectValue placeholder={t("form.fields.selectStatus")} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="__none">
                    {t("form.fields.selectStatus")}
                  </SelectItem>
                  {statuses.map((s) => (
                    <SelectItem key={s.id} value={String(s.id)}>
                      {labelOf(s)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          />
          {err(names.statusId) && (
            <p className="text-xs text-red-600">{err(names.statusId)}</p>
          )}
        </div>

        <div className="space-y-2">
          <Label className="text-sm font-semibold">
            {t("form.fields.priority")}
          </Label>
          <Controller
            name={names.priority}
            control={control}
            render={({ field }) => (
              <Select
                value={field.value || "medium"}
                onValueChange={field.onChange}
              >
                <SelectTrigger className="h-[50px] rounded-xl">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {ISSUE_PRIORITIES.map((p) => (
                    <SelectItem key={p} value={p}>
                      {t(`priority.${p}`)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          />
          {err(names.priority) && (
            <p className="text-xs text-red-600">{err(names.priority)}</p>
          )}
        </div>

        <div className="space-y-2">
          <Label className="text-sm font-semibold">
            {t("form.fields.estimatedMinutes")}
          </Label>
          <Controller
            name={names.estimatedMinutes}
            control={control}
            render={({ field }) => (
              <Input
                type="number"
                min={1}
                {...field}
                value={field.value ?? ""}
                placeholder={t("form.fields.estimatedMinutesPlaceholder")}
                className="rounded-xl h-[50px]"
                error={Boolean(errors[names.estimatedMinutes])}
              />
            )}
          />
          {err(names.estimatedMinutes) && (
            <p className="text-xs text-red-600">{err(names.estimatedMinutes)}</p>
          )}
        </div>
      </div>

      <div className="space-y-2">
        <Label className="text-sm font-semibold">
          {t("form.fields.assignedRole")}
          {requiredRole ? <span className="text-red-500"> *</span> : null}
        </Label>
        <Controller
          name={names.assignedRoleId}
          control={control}
          render={({ field }) => (
            <Select value={field.value || ""} onValueChange={field.onChange}>
              <SelectTrigger className="h-[50px] rounded-xl">
                <SelectValue placeholder={t("form.fields.selectRole")} />
              </SelectTrigger>
              <SelectContent>
                {roles.map((r) => (
                  <SelectItem key={r.id} value={String(r.id)}>
                    {labelOf(r)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
        />
        {err(names.assignedRoleId) && (
          <p className="text-xs text-red-600">{err(names.assignedRoleId)}</p>
        )}
      </div>

      <div className="space-y-2">
        <Label className="text-sm font-semibold">
          {t("form.fields.employees")}
        </Label>
        {visibleUsers.length === 0 ? (
          <p className="text-xs text-muted-foreground">{t("filters.noEmployees")}</p>
        ) : (
          <div className="flex flex-wrap gap-1.5">
            {visibleUsers.map((u) => {
              const active = employeeIds.includes(u.id);
              return (
                <button
                  key={u.id}
                  type="button"
                  onClick={() => onToggleEmployee?.(u.id)}
                  className={cn(
                    "inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full border text-xs font-medium transition-colors",
                    active
                      ? "border-primary/40 bg-primary/10 text-primary"
                      : "border-border/70 bg-background text-muted-foreground hover:border-primary/30",
                  )}
                >
                  <Tag size={11} />
                  {labelOf(u)}
                </button>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
