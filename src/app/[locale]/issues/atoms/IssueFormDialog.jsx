"use client";

import React, { useEffect, useMemo, useState } from "react";
import { AlertCircle, Loader2, Tag } from "lucide-react";
import { Controller, useForm, useWatch } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import * as yup from "yup";
import { useLocale, useTranslations } from "next-intl";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { cn } from "@/utils/cn";
import { usePlatformSettings } from "@/context/PlatformSettingsContext";
import OrderSearchSection from "@/components/molecules/OrderSearchSection";
import { VariableInput } from "@/components/ui/VariableInput";

const PRIORITIES = ["low", "medium", "high", "urgent"];

/**
 * IssueFormDialog — create a new issue, or edit an existing one when
 * `initialData` is provided (edit mode).
 *
 * The linked-order picker reuses the shared OrderSearchSection but searches
 * ALL orders (no `status` / `hasReplacement` filter) by passing undefined.
 *
 * Pass `order` to lock the form to a specific order (e.g. "escalate issue"
 * from an order row): the order picker becomes read-only and shows details.
 *
 * Automation / variable-template support:
 *  - `variableProps` — forwarded to VariableInput (title & description) so
 *    callers can inject variables / config chips when building automation
 *    configs rather than creating a real issue immediately.
 *  - `hideOrderSection` — when true, the OrderSearchSection is hidden AND
 *    title / orderId / description validation is relaxed (all become
 *    optional) so the same form can be used as a template builder.
 */
export default function IssueFormDialog({
  open,
  onOpenChange,
  fetchers = {},
  options = { statuses: [], causes: [], roles: [], users: [] },
  initialStatusId = "",
  initialData = null,
  order = null,
  onCreated,
  onUpdated,
  variableProps = {},
  hideOrderSection = false,
}) {
  const t = useTranslations("issues");
  const locale = useLocale();
  const { causes = [], roles = [], users = [] } = options;
  const { formatCurrency } = usePlatformSettings();
  const isEdit = Boolean(initialData?.id);

  const [selectedOrder, setSelectedOrder] = useState(null);
  const [employeeIds, setEmployeeIds] = useState([]);

  const schema = useMemo(() => {
    const base = yup.object({
      causeId: yup.string().required(t("validation.causeRequired")),
      priority: yup.string().required(t("validation.priorityRequired")),
      statusId: yup.string().required(t("validation.statusRequired")),
      estimatedMinutes: yup
        .number()
        .typeError(t("validation.estimatedMinutesType"))
        .integer(t("validation.estimatedMinutesInteger"))
        .min(1, t("validation.estimatedMinutesMin"))
        .nullable()
        .transform((v) =>
          v === "" || v === null || v === undefined ? null : Number(v)
        ),
      assignedRoleId: yup.string().required(t("validation.roleRequired")),
    });

    if (hideOrderSection) {
      return base.shape({
        title: yup.string().trim().max(250, t("validation.titleMax")).nullable().optional(),
        orderId: yup.string().nullable().optional(),
        description: yup.string().trim().nullable().optional(),
      });
    }

    return base.shape({
      title: yup
        .string()
        .trim()
        .required(t("validation.titleRequired"))
        .max(250, t("validation.titleMax")),
      orderId: yup.string().required(t("validation.orderRequired")),
      description: yup.string().trim().nullable().optional(),
    });
  }, [t, hideOrderSection]);

  const {
    control,
    handleSubmit,
    reset,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm({
    resolver: yupResolver(schema),
    defaultValues: {
      orderId: "",
      title: "",
      description: "",
      causeId: "",
      priority: "medium",
      statusId: "",
      estimatedMinutes: "",
      assignedRoleId: "",
    },
  });

  
  useEffect(() => {
    if (!open) return;
    setSelectedOrder(
      initialData?.order
        ? { ...initialData.order }
        : order
          ? { ...order }
          : initialData?.orderId
            ? { id: initialData.orderId, orderNumber: initialData.orderNumber || "" }
            : null
    );
    setEmployeeIds(
      initialData?.assignedEmployees?.map((e) => e.id) ||
        initialData?.assignedEmployeeIds ||
        []
    );
    reset({
      orderId: initialData?.orderId || order?.id || "",
      title: initialData?.title || "",
      description: initialData?.description || "",
      causeId: initialData?.causeId || initialData?.cause?.id || "",
      priority: initialData?.priority || "medium",
      statusId:
        initialData?.statusId || initialData?.status?.id || initialStatusId || "",
      estimatedMinutes: initialData?.estimatedMinutes ?? "",
      assignedRoleId:
        initialData?.assignedRoleId || initialData?.assignedRole?.id || "",
    });
  }, [open, reset, initialStatusId, initialData, order]);

  useEffect(() => {
    setValue("orderId", selectedOrder?.id || "", { shouldValidate: true });
  }, [selectedOrder, setValue]);

  const toggleEmployee = (id) =>
    setEmployeeIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );

  const watchedRoleId = useWatch({ control, name: "assignedRoleId" });

  const visibleUsers = useMemo(() => {
    if (!watchedRoleId) return users;
    return users.filter((u) => u.roleId === watchedRoleId);
  }, [users, watchedRoleId]);

  useEffect(() => {
    if (!watchedRoleId) return;
    const roleUsers = new Set(
      users.filter((u) => u.roleId === watchedRoleId).map((u) => u.id)
    );
    setEmployeeIds((prev) => prev.filter((id) => roleUsers.has(id)));
  }, [watchedRoleId, users]);

  const labelOf = (item) =>
    item?.name ||
    (locale === "ar" ? item?.nameAr : item?.nameEn) ||
    item?.nameEn ||
    item?.nameAr ||
    item?.id;

  const submit = handleSubmit(async (values) => {
    const payload = {
      title: values.title ? values.title.trim() : values.title ?? null,
      description: values.description?.trim() || null,
      orderId: values.orderId || null,
      statusId: values.statusId || null,
      causeId: values.causeId || null,
      priority: values.priority || "medium",
      estimatedMinutes: values.estimatedMinutes || null,
      assignedRoleId: values.assignedRoleId || null,
      employeeIds,
    };
    
    if (isEdit) {
      if (!fetchers.updateIssue) return;
      await fetchers.updateIssue(initialData.id, payload, {
        onSuccess: (d) => {
          onUpdated?.(d);
          onOpenChange?.(false);
        },
      });
      return;
    }
    
    await fetchers.createIssue(
      { ...payload, statusId: payload.statusId || initialStatusId || null },
      {
        onSuccess: () => {
          onCreated?.();
          onOpenChange?.(false);
        },
      }
    );
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl! w-full h-[90vh] md:h-auto md:max-h-[90vh] flex flex-col p-0 overflow-hidden bg-white dark:bg-slate-950">
        <DialogHeader className="px-4 md:px-6 py-4 border-b border-border bg-card shrink-0">
          <DialogTitle className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-muted flex items-center justify-center text-muted-foreground">
              <AlertCircle size={20} />
            </div>
            <div>
              <span>{isEdit ? t("form.editTitle") : t("form.title")}</span>
              <DialogDescription asChild>
                <p className="text-xs mt-1">{t("form.subtitle")}</p>
              </DialogDescription>
            </div>
          </DialogTitle>
        </DialogHeader>

        <form
          onSubmit={submit}
          className="flex-1 overflow-y-auto p-4 md:p-6 custom-scrollbar bg-card space-y-5"
        >
          {!hideOrderSection && (
            <div className="space-y-2">
              <Label className="text-sm font-semibold">
                {t("form.fields.order")} <span className="text-red-500">*</span>
              </Label>
              <OrderSearchSection
                errors={errors.orderId?.message ? { order: errors.orderId.message } : {}}
                selectedOrder={selectedOrder}
                onSelect={setSelectedOrder}
                formatCurrency={formatCurrency}
                isEditMode={isEdit || Boolean(order)}
                status={undefined}
                hasReplacement={undefined}
                showOrderLink={true}
              />
            </div>
          )}

          {/* Title */}
          <div className="space-y-2">
            <Label className="text-sm font-semibold">
              {t("form.fields.title")}
              {!hideOrderSection && <span className="text-red-500">*</span>}
            </Label>
            <Controller
              name="title"
              control={control}
              render={({ field }) => (
                <VariableInput
                  value={field.value ?? ""}
                  onChange={(v) => field.onChange(v)}
                  placeholder={t("form.fields.titlePlaceholder")}
                  maxLength={250}
                  error={Boolean(errors.title)}
                  disableHydrate={true}
                  size="lg"
                  {...variableProps}
                />
              )}
            />
            {errors.title?.message && (
              <p className="text-xs text-red-600">{errors.title.message}</p>
            )}
          </div>

          {/* Description */}
          <div className="space-y-2">
            <Label className="text-sm font-semibold">
              {t("form.fields.description")}
            </Label>
            <Controller
              name="description"
              control={control}
              render={({ field }) => (
                <VariableInput
                  value={field.value ?? ""}
                  onChange={(v) => field.onChange(v)}
                  placeholder={t("form.fields.descriptionPlaceholder")}
                  multiline={true}
                  rows={5}
                  error={Boolean(errors.description)}
                  disableHydrate={true}
                  {...variableProps}
                />
              )}
            />
            {errors.description?.message && (
              <p className="text-xs text-red-600">{errors.description.message}</p>
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Cause */}
            <div className="space-y-2">
              <Label className="text-sm font-semibold">
                {t("form.fields.cause")}
              </Label>
              <Controller
                name="causeId"
                control={control}
                render={({ field }) => (
                  <Select
                    value={field.value || "__none"}
                    onValueChange={(v) => field.onChange(v === "__none" ? "" : v)}
                  >
                    <SelectTrigger className="h-[50px] rounded-xl">
                      <SelectValue placeholder={t("form.fields.selectCause")} />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="__none">
                        {t("form.fields.selectCause")}
                      </SelectItem>
                      {causes.map((c) => (
                        <SelectItem key={c.id} value={String(c.id)}>
                          {labelOf(c)}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              />
              {errors.causeId?.message && (
                <p className="text-xs text-red-600">{errors.causeId.message}</p>
              )}
            </div>

            {/* Status */}
            <div className="space-y-2">
              <Label className="text-sm font-semibold">
                {t("form.fields.status")}
              </Label>
              <Controller
                name="statusId"
                control={control}
                render={({ field }) => (
                  <Select
                    value={field.value || "__none"}
                    onValueChange={(v) =>
                      field.onChange(v === "__none" ? "" : v)
                    }
                  >
                    <SelectTrigger className="h-[50px] rounded-xl">
                      <SelectValue placeholder={t("form.fields.selectStatus")} />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="__none">
                        {t("form.fields.selectStatus")}
                      </SelectItem>
                      {options.statuses.map((s) => (
                        <SelectItem key={s.id} value={String(s.id)}>
                          {labelOf(s)}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              />
              {errors.statusId?.message && (
                <p className="text-xs text-red-600">{errors.statusId.message}</p>
              )}
            </div>

            {/* Priority */}
            <div className="space-y-2">
              <Label className="text-sm font-semibold">
                {t("form.fields.priority")}
              </Label>
              <Controller
                name="priority"
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
                      {PRIORITIES.map((p) => (
                        <SelectItem key={p} value={p}>
                          {t(`priority.${p}`)}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              />
              {errors.priority?.message && (
                <p className="text-xs text-red-600">{errors.priority.message}</p>
              )}
            </div>

            {/* Estimated minutes */}
            <div className="space-y-2">
              <Label className="text-sm font-semibold">
                {t("form.fields.estimatedMinutes")}
              </Label>
              <Controller
                name="estimatedMinutes"
                control={control}
                render={({ field }) => (
                  <Input
                    type="number"
                    min={1}
                    {...field}
                    placeholder={t("form.fields.estimatedMinutesPlaceholder")}
                    className="rounded-xl h-[50px]"
                    error={Boolean(errors.estimatedMinutes)}
                  />
                )}
              />
              {errors.estimatedMinutes?.message && (
                <p className="text-xs text-red-600">
                  {errors.estimatedMinutes.message}
                </p>
              )}
            </div>
          </div>

          {/* Assigned role */}
          <div className="space-y-2">
            <Label className="text-sm font-semibold">
              {t("form.fields.assignedRole")}
            </Label>
            <Controller
              name="assignedRoleId"
              control={control}
              render={({ field }) => (
                <Select
                  value={field.value || ""}
                  onValueChange={field.onChange}
                >
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
            {errors.assignedRoleId?.message && (
              <p className="text-xs text-red-600">
                {errors.assignedRoleId.message}
              </p>
            )}
          </div>

          {/* Employees */}
          <div className="space-y-2">
            <Label className="text-sm font-semibold">
              {t("form.fields.employees")}
            </Label>
            {visibleUsers.length === 0 ? (
              <p className="text-xs text-muted-foreground">
                {t("filters.noEmployees")}
              </p>
            ) : (
              <div className="flex flex-wrap gap-1.5">
                {visibleUsers.map((u) => {
                  const active = employeeIds.includes(u.id);
                  return (
                    <button
                      key={u.id}
                      type="button"
                      onClick={() => toggleEmployee(u.id)}
                      className={cn(
                        "inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full border text-xs font-medium transition-colors",
                        active
                          ? "border-primary/40 bg-primary/10 text-primary"
                          : "border-border/70 bg-background text-muted-foreground hover:border-primary/30"
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

          <div className="flex items-center justify-end gap-3 pt-4 border-t mt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange?.(false)}
              disabled={isSubmitting}
            >
              {t("actions.cancel")}
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin mr-2" />
                  {t("form.saving")}
                </>
              ) : isEdit ? (
                t("form.update")
              ) : (
                t("form.create")
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
