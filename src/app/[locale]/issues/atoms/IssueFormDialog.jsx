"use client";

import React, { useEffect, useMemo, useState } from "react";
import { AlertCircle, Loader2 } from "lucide-react";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { usePlatformSettings } from "@/context/PlatformSettingsContext";
import OrderSearchSection from "@/components/molecules/OrderSearchSection";
import { VariableInput } from "@/components/ui/VariableInput";
import IssueAssignmentFields from "./IssueAssignmentFields";

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
      orderId: yup.string().nullable().optional(),
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
                {t("form.fields.order")}
              </Label>
              <OrderSearchSection
                errors={errors.orderId?.message ? { order: errors.orderId.message } : {}}
                selectedOrder={selectedOrder}
                onSelect={setSelectedOrder}
                formatCurrency={formatCurrency}
                isEditMode={isEdit || Boolean(order)}
                status={null}
                hasReplacement={null}
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


          <IssueAssignmentFields
            control={control}
            errors={errors}
            options={{ statuses: options.statuses || [], roles, users }}
            employeeIds={employeeIds}
            onToggleEmployee={toggleEmployee}
            requiredRole
          >
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
          </IssueAssignmentFields>

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
