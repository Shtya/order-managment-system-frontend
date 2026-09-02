"use client";

import React, { useCallback, useEffect, useMemo, useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import toast from "react-hot-toast";
import { Check, ChevronDown, Eye, Loader2, Pencil, Plus, Trash2, Workflow } from "lucide-react";
import { Controller, useFieldArray, useForm, useWatch } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import * as yup from "yup";
import api from "@/utils/api";
import { normalizeAxiosError } from "@/utils/axios";
import { cn } from "@/utils/cn";
import { PrimaryBtn, GhostBtn } from "@/components/atoms/Button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import {
  BOOLEAN_FIELDS,
  DEFAULT_RULE,
  LIST_FIELDS,
  MAX_RULES,
  NUMBER_FIELDS,
  PERCENT_FIELDS,
  CONFIRMATION_SOURCES,
  PAYMENT_METHODS,
  PAYMENT_STATUSES,
  SHIPMENT_STATUSES,
  displayRuleValue,
  operatorNeedsValue,
  operatorsFor,
  parseRuleValue,
  unwrapList,
} from "./condition-fields";
import { ConditionFieldPicker } from "./ConditionFieldPicker";
import { Button } from "@/components/ui/button";

const LOOKUP_FIELDS = new Set([
  "order.statusId",
  "order.storeId",
  "order.cityId",
  "order.shippingCompanyId",
  "shipment.status",
]);

function ValuesLoadingField({ label }) {
  return (
    <div className="flex h-10 w-full items-center gap-2 rounded-xl border border-border bg-muted/40 px-3 text-sm text-muted-foreground">
      <Loader2 size={14} className="animate-spin shrink-0" />
      <span className="truncate">{label}</span>
    </div>
  );
}

function OptionsMultiSelect({ options, value, onChange, placeholder, disabled, loading, loadingLabel }) {
  if (loading) {
    return <ValuesLoadingField label={loadingLabel || placeholder} />;
  }
  const selected = Array.isArray(value) ? value.map(String) : [];
  const labels = options
    .filter((opt) => selected.includes(String(opt.value)))
    .map((opt) => opt.label);

  const toggle = (nextValue) => {
    if (disabled) return;
    const exists = selected.includes(nextValue);
    onChange(exists ? selected.filter((item) => item !== nextValue) : [...selected, nextValue]);
  };

  return (
    <Popover>
      <PopoverTrigger asChild>
        <button
          type="button"
          disabled={disabled}
          className="relative h-10 w-full rounded-xl border border-border bg-background px-3 pe-8 text-sm text-start truncate disabled:opacity-60"
        >
          {labels.length ? labels.join(", ") : (
            <span className="text-muted-foreground">{placeholder}</span>
          )}
          <ChevronDown size={14} className="absolute end-3 top-1/2 -translate-y-1/2 opacity-60" />
        </button>
      </PopoverTrigger>
      <PopoverContent align="start" className="p-1 max-h-64 overflow-y-auto w-[var(--radix-popover-trigger-width)]">
        {options.map((opt) => {
          const active = selected.includes(String(opt.value));
          return (
            <button
              type="button"
              key={String(opt.value)}
              className="flex w-full items-center gap-2 rounded-lg px-2 py-1.5 text-sm hover:bg-muted"
              onClick={() => toggle(String(opt.value))}
            >
              <span
                className={cn(
                  "flex h-4 w-4 items-center justify-center rounded border",
                  active && "border-primary bg-primary text-primary-foreground",
                )}
              >
                {active && <Check size={10} />}
              </span>
              {opt.label}
            </button>
          );
        })}
      </PopoverContent>
    </Popover>
  );
}

function RuleValueInput({ field, operator, value, onChange, t, tCatalog, options, disabled, lookupsLoading }) {
  if (!operatorNeedsValue(operator)) return null;

  const isList = operator === "in" || operator === "not_in";
  const opts = options[field] || [];
  const isLookup = LOOKUP_FIELDS.has(field);
  const waitingForLabels = isLookup && lookupsLoading;
  const booleanTrueLabel =
    field === "order.phone.valid" ? tCatalog("phone.egyptian") : tCatalog("boolean.true");
  const booleanFalseLabel =
    field === "order.phone.valid" ? tCatalog("phone.notEgyptian") : tCatalog("boolean.false");

  if (waitingForLabels) {
    return <ValuesLoadingField label={t("dialog.valuesLoading")} />;
  }

  if (BOOLEAN_FIELDS.has(field)) {
    return (
      <Select value={String(value ?? "true")} onValueChange={onChange} disabled={disabled}>
        <SelectTrigger className="h-10 rounded-xl">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="true">{booleanTrueLabel}</SelectItem>
          <SelectItem value="false">{booleanFalseLabel}</SelectItem>
        </SelectContent>
      </Select>
    );
  }

  if (isList && LIST_FIELDS.has(field)) {
    return (
      <OptionsMultiSelect
        options={opts}
        value={value}
        onChange={onChange}
        placeholder={t("dialog.selectValues")}
        disabled={disabled}
        loading={waitingForLabels}
        loadingLabel={t("dialog.valuesLoading")}
      />
    );
  }

  if (isLookup || opts.length) {
    const selected = value ? String(value) : "";
    const hasMatch = opts.some((opt) => String(opt.value) === selected);
    return (
      <Select
        value={hasMatch ? selected : undefined}
        onValueChange={onChange}
        disabled={disabled}
      >
        <SelectTrigger className="h-10 rounded-xl">
          <SelectValue placeholder={t("dialog.valuePlaceholder")} />
        </SelectTrigger>
        <SelectContent>
          {opts.map((opt) => (
            <SelectItem key={opt.value} value={String(opt.value)}>
              {opt.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    );
  }

  const isPercent = PERCENT_FIELDS.has(field);
  const isNumber = NUMBER_FIELDS.has(field);

  return (
    <Input
      type={isNumber ? "number" : "text"}
      min={isPercent ? 1 : undefined}
      max={isPercent ? 100 : undefined}
      step={isPercent ? 1 : undefined}
      value={value ?? ""}
      onChange={(e) => {
        const next = e.target.value;
        if (!isPercent || next === "") {
          onChange(next);
          return;
        }
        const n = Number(next);
        if (!Number.isFinite(n)) {
          onChange("");
          return;
        }
        onChange(String(Math.min(100, Math.max(1, n))));
      }}
      placeholder={t("dialog.valuePlaceholder")}
      disabled={disabled}
    />
  );
}

export function AutomationFormDialog({
  automation,
  open,
  onClose,
  onSaved,
  tags,
  readOnly = false,
  ns = "tags",
  includeClientFields = false,
}) {
  const tOrders = useTranslations("orders");
  const t = useTranslations(ns);
  const tCatalog = useTranslations("tags");
  const locale = useLocale();
  const isEdit = !!automation;
  const [lookupsLoading, setLookupsLoading] = useState(false);
  const [lookups, setLookups] = useState({
    statuses: [],
    stores: [],
    cities: [],
    shipping: [],
    shipmentStatuses: SHIPMENT_STATUSES,
  });

  const schema = useMemo(
    () =>
      yup.object({
        name: yup
          .string()
          .trim()
          .required(t("validation.nameRequired"))
          .max(150, t("validation.nameMax")),
        tagId: yup.string().required(t("validation.tagRequired")),
        isEnabled: yup.boolean().default(true),
        logic: yup.string().oneOf(["AND", "OR"]).required(),
        rules: yup
          .array()
          .min(1, t("validation.rulesMin"))
          .max(MAX_RULES, t("validation.rulesMax"))
          .of(
            yup.object({
              field: yup.string().required(t("validation.fieldRequired")),
              operator: yup.string().required(t("validation.operatorRequired")),
              value: yup.mixed().when("operator", {
                is: (op) => operatorNeedsValue(op),
                then: (s) =>
                  s.test("value", t("validation.valueRequired"), (v) => {
                    if (Array.isArray(v)) return v.length > 0;
                    return (
                      v === 0 ||
                      v === false ||
                      (v !== undefined && v !== null && String(v).trim() !== "")
                    );
                  }),
                otherwise: (s) => s.optional(),
              }),
            }),
          ),
      }),
    [t],
  );

  const {
    control,
    handleSubmit,
    reset,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm({
    resolver: yupResolver(schema),
    defaultValues: {
      name: "",
      tagId: "",
      isEnabled: true,
      logic: "AND",
      rules: [DEFAULT_RULE],
    },
  });

  const { fields, append, remove } = useFieldArray({ control, name: "rules" });
  const watchedRules = useWatch({ control, name: "rules" });

  useEffect(() => {
    if (!open) return;
    reset({
      name: automation?.name || "",
      tagId: automation?.tagId || automation?.tag?.id || "",
      isEnabled: automation?.isEnabled ?? true,
      logic: automation?.conditions?.logic || "AND",
      rules:
        automation?.conditions?.rules?.length > 0
          ? automation.conditions.rules.slice(0, MAX_RULES).map((rule) => ({
              field: rule.field,
              operator: rule.operator,
              value: displayRuleValue(rule.field, rule.operator, rule.value),
            }))
          : [DEFAULT_RULE],
    });
  }, [open, automation, reset]);

  useEffect(() => {
    if (!open) return;
    let cancelled = false;
    setLookupsLoading(true);
    (async () => {
      try {
        const [statusesRes, storesRes, citiesRes, shippingRes, shipmentRes] = await Promise.all([
          api.get("/orders/statuses").catch(() => ({ data: [] })),
          api.get("/stores", { params: { limit: 200, isActive: true } }).catch(() => ({ data: [] })),
          api.get("/cities", { params: { limit: 500 } }).catch(() => ({ data: [] })),
          api.get("/shipping/integrations/active").catch(() => ({ data: [] })),
          api.get("/shipping/statuses").catch(() => ({ data: {} })),
        ]);
        if (cancelled) return;
        const rawStatuses = Array.isArray(shipmentRes.data?.statuses)
          ? shipmentRes.data.statuses
          : SHIPMENT_STATUSES;
        const shipmentStatuses = rawStatuses
          .map((v) => (typeof v === "string" ? v : v?.code || v?.status))
          .filter(Boolean);
        setLookups({
          statuses: unwrapList(statusesRes.data),
          stores: unwrapList(storesRes.data),
          cities: unwrapList(citiesRes.data),
          shipping: unwrapList(shippingRes.data),
          shipmentStatuses,
        });
      } catch (e) {
        toast.error(normalizeAxiosError(e));
      } finally {
        if (!cancelled) setLookupsLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [open]);

  const fieldOptions = useMemo(() => {
    const statusOptions = lookups.statuses.map((s) => ({
      value: s.id,
      label: s.system ? tOrders(`statuses.${s.code}`) : s.name || s.code || s.id,
    }));
    const storeOptions = lookups.stores.map((s) => ({
      value: s.id,
      label: s.name || s.title || s.id,
    }));
    const cityOptions = lookups.cities.map((c) => ({
      value: c.id,
      label: locale === "ar" ? c.nameAr || c.nameEn : c.nameEn || c.nameAr || c.id,
    }));
    const shippingOptions = lookups.shipping.map((c) => ({
      value: c.providerId || c.id,
      label: c.name || c.provider || c.id,
    }));
    return {
      "order.statusId": statusOptions,
      "order.storeId": storeOptions,
      "order.cityId": cityOptions,
      "order.paymentStatus": PAYMENT_STATUSES.map((v) => ({
        value: v,
        label: tCatalog(`paymentStatus.${v}`),
      })),
      "order.paymentMethod": PAYMENT_METHODS.map((v) => ({
        value: v,
        label: tOrders(
          v === "bank_transfer" ? "paymentMethods.bankTransfer" : `paymentMethods.${v}`,
        ),
      })),
      "order.shippingCompanyId": shippingOptions,
      "order.confirmationSource": CONFIRMATION_SOURCES.map((v) => ({
        value: v,
        label: tCatalog(`confirmationSource.${v}`),
      })),
      "shipment.status": lookups.shipmentStatuses.map((v) => ({
        value: v,
        label: tOrders(`trackingStatus.${v}`),
      })),
    };
  }, [lookups, locale, tCatalog, tOrders]);

  const onSubmit = useCallback(
    async (values) => {
      if (readOnly) return;
      try {
        const payload = {
          name: values.name.trim(),
          tagId: values.tagId,
          isEnabled: values.isEnabled ?? true,
          conditions: {
            logic: values.logic,
            rules: values.rules.slice(0, MAX_RULES).map((rule) => ({
              field: rule.field,
              operator: rule.operator,
              ...(operatorNeedsValue(rule.operator)
                ? { value: parseRuleValue(rule.field, rule.operator, rule.value) }
                : {}),
            })),
          },
        };
        if (isEdit) {
          await api.patch(`/tag-automations/${automation.id}`, payload);
        } else {
          await api.post("/tag-automations", payload);
        }
        toast.success(t("toast.saved"));
        onSaved?.();
        onClose?.();
      } catch (e) {
        toast.error(normalizeAxiosError(e));
      }
    },
    [isEdit, automation, onClose, onSaved, t, readOnly],
  );

  const changeOperator = (index, nextOperator, currentValue) => {
    const isList = nextOperator === "in" || nextOperator === "not_in";
    const wasList = Array.isArray(currentValue);
    if (isList) {
      return wasList ? currentValue : currentValue ? [String(currentValue)] : [];
    }
    if (wasList) return currentValue[0] ?? "";
    return currentValue ?? "";
  };

  const automationTitle = readOnly
    ? t("dialog.viewAutomationTitle")
    : isEdit
      ? t("dialog.editAutomationTitle")
      : t("dialog.addAutomationTitle");

  return (
    <Dialog open={open} onOpenChange={(next) => { if (!next) onClose?.(); }}>
      <DialogContent className="max-w-4xl! w-full h-[90vh] md:h-auto md:max-h-[90vh] flex flex-col p-0 overflow-hidden bg-white dark:bg-slate-950">
        <DialogHeader className="px-4 md:px-6 py-4 border-b border-border bg-card shrink-0">
          <DialogTitle className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-muted flex items-center justify-center text-muted-foreground">
              {readOnly ? <Eye size={20} /> : isEdit ? <Pencil size={20} /> : <Workflow size={20} />}
            </div>
            {automationTitle}
          </DialogTitle>
          <p className="text-sm text-muted-foreground font-normal">
            {t("dialog.automationSubtitle")}
          </p>
        </DialogHeader>
      <form className="flex-1 overflow-y-auto p-4 md:p-6 custom-scrollbar bg-card space-y-5" onSubmit={handleSubmit(onSubmit)}>
        <div className="space-y-1.5">
          <Label className="text-sm font-medium" >
            {t("dialog.name")}
          </Label>
          <Controller
            name="name"
            control={control}
            render={({ field }) => (
              <Input
                {...field}
                placeholder={t("dialog.namePlaceholder")}
                error={Boolean(errors.name)}
                disabled={readOnly}
              />
            )}
          />
          {errors.name?.message && <p className="text-xs text-red-500">{errors.name.message}</p>}
        </div>

        <div className="space-y-1.5">
          <Label className="text-sm font-medium" description={t("dialog.tagDescription")}>
            {t("dialog.tag")}
          </Label>
          <Controller
            name="tagId"
            control={control}
            render={({ field }) => (
              <Select value={field.value} onValueChange={field.onChange} disabled={readOnly}>
                <SelectTrigger className="h-10 rounded-xl">
                  <SelectValue placeholder={t("dialog.tagPlaceholder")} />
                </SelectTrigger>
                <SelectContent>
                  {tags.map((tag) => (
                    <SelectItem key={tag.id} value={tag.id}>
                      {tag.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          />
          {errors.tagId?.message && <p className="text-xs text-red-500">{errors.tagId.message}</p>}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <Label className="text-sm font-medium" description={t("dialog.logicDescription")}>
              {t("dialog.logic")}
            </Label>
            <Controller
              name="logic"
              control={control}
              render={({ field }) => (
                <Select value={field.value} onValueChange={field.onChange} disabled={readOnly}>
                  <SelectTrigger className="h-10 rounded-xl">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="AND">{t("dialog.logicAnd")}</SelectItem>
                    <SelectItem value="OR">{t("dialog.logicOr")}</SelectItem>
                  </SelectContent>
                </Select>
              )}
            />
          </div>
          <div className="space-y-1.5 flex justify-end mb-1">
            <div className="flex-1 flex mt-auto h-10 items-center justify-between rounded-xl border border-[var(--border)] px-3">
              <Label className="text-sm font-medium me-2" description={t("dialog.isEnabledDescription")}>
                {t("dialog.isEnabled")}
              </Label>
              <Controller
                name="isEnabled"
                control={control}
                render={({ field }) => (
                  <Switch
                    checked={Boolean(field.value)}
                    onCheckedChange={field.onChange}
                    size="sm"
                    disabled={readOnly}
                  />
                )}
              />
            </div>
          </div>
        </div>

        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Label className="text-sm font-medium" description={t("dialog.rulesDescription")}>
                {t("dialog.rules")}
              </Label>
              <span className="text-xs font-semibold tabular-nums text-muted-foreground">
                {t("dialog.rulesCount", { count: fields.length, max: MAX_RULES })}
              </span>
            </div>
            {!readOnly && (
              <GhostBtn
                disabled={fields.length >= MAX_RULES}
                onClick={() => fields.length < MAX_RULES && append({ ...DEFAULT_RULE })}
              >
                <Plus size={14} className="me-1" />
                {t("dialog.addRule")}
              </GhostBtn>
            )}
          </div>
          {errors.rules?.message && (
            <p className="text-xs text-red-500">{errors.rules.message}</p>
          )}
          {fields.map((item, index) => {
            const rule = watchedRules?.[index] || {};
            const ops = operatorsFor(rule.field);
            return (
              <div
                key={item.id}
                className="grid grid-cols-1 md:grid-cols-[1.6fr_1fr_1.2fr_auto] gap-2 p-3 rounded-xl border border-border"
              >
                <div className="space-y-1.5">
                  <Label className="text-sm font-medium" description={t("dialog.fieldDescription")}>
                    {t("dialog.field")}
                  </Label>
                  <Controller
                    name={`rules.${index}.field`}
                    control={control}
                    render={({ field }) => (
                      <ConditionFieldPicker
                        value={field.value}
                        disabled={readOnly}
                        ns={ns}
                        includeClientFields={includeClientFields}
                        onChange={(v) => {
                          field.onChange(v);
                          const nextOps = operatorsFor(v);
                          const nextOperator = nextOps.includes(watchedRules?.[index]?.operator)
                            ? watchedRules[index].operator
                            : nextOps[0];
                          if (!nextOps.includes(watchedRules?.[index]?.operator)) {
                            setValue(`rules.${index}.operator`, nextOperator);
                          }
                          setValue(
                            `rules.${index}.value`,
                            BOOLEAN_FIELDS.has(v)
                              ? "true"
                              : nextOperator === "in" || nextOperator === "not_in"
                                ? []
                                : "",
                          );
                        }}
                      />
                    )}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-sm font-medium" description={t("dialog.operatorDescription")}>
                    {t("dialog.operator")}
                  </Label>
                  <Controller
                    name={`rules.${index}.operator`}
                    control={control}
                    render={({ field }) => (
                      <Select
                        value={field.value}
                        disabled={readOnly}
                        onValueChange={(v) => {
                          field.onChange(v);
                          if (!operatorNeedsValue(v)) {
                            setValue(`rules.${index}.value`, "");
                            return;
                          }
                          setValue(
                            `rules.${index}.value`,
                            changeOperator(index, v, watchedRules?.[index]?.value),
                          );
                        }}
                      >
                        <SelectTrigger className="h-10 rounded-xl">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {ops.map((op) => (
                            <SelectItem key={op} value={op}>
                              {tCatalog(`operators.${op}`)}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    )}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-sm font-medium" description={t("dialog.valueDescription")}>
                    {t("dialog.value")}
                  </Label>
                  <Controller
                    name={`rules.${index}.value`}
                    control={control}
                    render={({ field }) => (
                      <RuleValueInput
                        field={rule.field}
                        operator={rule.operator}
                        value={field.value}
                        onChange={field.onChange}
                        t={t}
                        tCatalog={tCatalog}
                        options={fieldOptions}
                        disabled={readOnly}
                        lookupsLoading={lookupsLoading}
                      />
                    )}
                  />
                </div>
                {!readOnly && (
                  <button
                    type="button"
                    className="h-10 w-10 mt-auto rounded-xl border border-border flex items-center justify-center text-red-500 disabled:opacity-40"
                    onClick={() => fields.length > 1 && remove(index)}
                    disabled={fields.length <= 1}
                  >
                    <Trash2 size={16} />
                  </button>
                )}
              </div>
            );
          })}
        </div>

        <div className="flex items-center justify-end gap-3 pt-4 border-t mt-4">
          {readOnly ? (
            <GhostBtn onClick={onClose}>{t("dialog.close")}</GhostBtn>
          ) : (
            <>
              <Button type="button" variant="outline" onClick={onClose}>{t("dialog.cancel")}</Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? <Loader2 size={14} className="animate-spin mr-2" /> : t("dialog.save")}
              </Button>
            </>
          )}
        </div>
      </form>
      </DialogContent>
    </Dialog>
  );
}
