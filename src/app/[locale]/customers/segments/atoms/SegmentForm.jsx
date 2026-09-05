"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { Controller, useForm } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import * as yup from "yup";
import toast from "react-hot-toast";
import { LayoutTemplate, Loader2, RefreshCw, Snowflake, Unlock, Users, Zap } from "lucide-react";
import PageHeader from "@/components/atoms/Pageheader";
import Button_, { GhostBtn, PrimaryBtn } from "@/components/atoms/Button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { useRouter } from "@/i18n/navigation";
import api from "@/utils/api";
import { normalizeAxiosError } from "@/utils/axios";
import { cn } from "@/utils/cn";
import {
  AudienceFilterBuilder,
  AudienceFilterSummary,
  buildAudienceFieldOptions,
  countRules,
  collectInvalidRuleIds,
  emptyAudienceFilter,
  fromApiFilter,
  serializeAudienceFilter,
  TENANT_AUDIENCE_FIELDS,
} from "@/components/audience-filter";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { avatarSrc } from "@/components/atoms/UserSelect";
import { Bone } from "@/components/atoms/BannerSkeleton";
import SegmentTemplatePickerDialog from "./SegmentTemplatePickerDialog";
import { collectRuleFields } from "@/components/audience-filter/audience-filter.utils";
import {
  EMPTY_AUDIENCE_LOOKUPS,
  fetchAudienceLookupKeys,
  lookupKeysForFields,
} from "@/components/audience-filter/lookups";

const STEPS = ["identity", "filter", "review"];
const PREVIEW_PAGE_SIZE = 5;
const PREVIEW_ROW_PX = 56;

function unwrapRecipients(data) {
  const body = data?.records ? data : data?.data || {};
  return {
    records: body.records || [],
    hasMore: !!body.hasMore,
    nextCursor: body.nextCursor || null,
  };
}

function filterLockedFor(segment) {
  return segment?.type === "frozen" || segment?.type === "freezing";
}

export default function SegmentForm({ mode = "create", segmentId, variant = "segment" }) {
  const isTemplate = variant === "template";
  const t = useTranslations(isTemplate ? "customerSegmentTemplates" : "customerSegments");
  const ta = useTranslations("audienceFilter");
  const tOrders = useTranslations("orders");
  const tTags = useTranslations("tags");
  const locale = useLocale();
  const router = useRouter();
  const isEdit = mode === "edit";
  const listPath = isTemplate ? "/dashboard/customers/segments" : "/customers/segments";
  const itemApiBase = isTemplate ? "/client-segment-templates/admin" : "/client-segments";
  const hiddenFields = isTemplate ? TENANT_AUDIENCE_FIELDS : [];

  const [step, setStep] = useState(0);
  const [segment, setSegment] = useState(null);
  const [pageLoading, setPageLoading] = useState(isEdit);
  const [metadata, setMetadata] = useState(null);
  const [lookupsRaw, setLookupsRaw] = useState(EMPTY_AUDIENCE_LOOKUPS);
  const [lookupLoading, setLookupLoading] = useState({});
  const loadedLookupKeys = useRef(new Set());
  const inflightLookupKeys = useRef(new Set());
  const [previewLoading, setPreviewLoading] = useState(false);
  const [previewLoadingMore, setPreviewLoadingMore] = useState(false);
  const [previewCount, setPreviewCount] = useState(null);
  const [previewSamples, setPreviewSamples] = useState([]);
  const [previewNextCursor, setPreviewNextCursor] = useState(null);
  const [previewHasMore, setPreviewHasMore] = useState(false);
  const [stepError, setStepError] = useState("");
  const [showFilterErrors, setShowFilterErrors] = useState(false);
  const [freezeLoading, setFreezeLoading] = useState(false);
  const [templatesOpen, setTemplatesOpen] = useState(false);

  const schema = useMemo(
    () =>
      yup.object({
        name: yup
          .string()
          .trim()
          .required(t("validation.nameRequired"))
          .max(160, t("validation.nameMax")),
        description: yup.string().max(1000, t("validation.descriptionMax")).nullable(),
        type: isTemplate
          ? yup.string().nullable()
          : yup.string().oneOf(["dynamic", "frozen"]).required(),
        audienceFilter: yup
          .mixed()
          .test("rules", t("validation.rulesMin"), (value) => countRules(value) >= 1)
          .test("values", t("validation.valueRequired"), (value) => collectInvalidRuleIds(value).length === 0),
      }),
    [isTemplate, t],
  );

  const {
    control,
    handleSubmit,
    reset,
    watch,
    setValue,
    getValues,
    formState: { errors, isSubmitting },
  } = useForm({
    resolver: yupResolver(schema),
    defaultValues: {
      name: "",
      description: "",
      type: "dynamic",
      audienceFilter: emptyAudienceFilter(),
    },
  });

  const name = watch("name") || "";
  const description = watch("description") || "";
  const type = watch("type");
  const audienceFilter = watch("audienceFilter");
  const filterLocked = !isTemplate && isEdit && filterLockedFor(segment);
  const invalidRuleIds = useMemo(
    () => (showFilterErrors ? collectInvalidRuleIds(audienceFilter) : []),
    [audienceFilter, showFilterErrors],
  );

  const fieldOptions = useMemo(
    () => buildAudienceFieldOptions({ lookups: lookupsRaw, locale, tOrders, tTags, tAudience: ta }),
    [lookupsRaw, locale, tOrders, tTags, ta],
  );

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const metaRes = await api.get("/audience-filter/entities");
        if (cancelled) return;
        setMetadata(metaRes.data?.entities ? metaRes.data : metaRes.data?.data || metaRes.data);
      } catch (error) {
        toast.error(normalizeAxiosError(error));
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    const keys = lookupKeysForFields(collectRuleFields(audienceFilter), { includeTenant: !isTemplate });
    const missing = keys.filter(
      (key) => !loadedLookupKeys.current.has(key) && !inflightLookupKeys.current.has(key),
    );
    if (!missing.length) return undefined;
    missing.forEach((key) => inflightLookupKeys.current.add(key));
    let cancelled = false;
    setLookupLoading((prev) => {
      const next = { ...prev };
      missing.forEach((key) => {
        next[key] = true;
      });
      return next;
    });
    (async () => {
      try {
        const loaded = await fetchAudienceLookupKeys(missing);
        if (cancelled) return;
        missing.forEach((key) => loadedLookupKeys.current.add(key));
        setLookupsRaw((prev) => ({ ...prev, ...loaded }));
      } catch (error) {
        toast.error(normalizeAxiosError(error));
      } finally {
        missing.forEach((key) => inflightLookupKeys.current.delete(key));
        if (!cancelled) {
          setLookupLoading((prev) => {
            const next = { ...prev };
            missing.forEach((key) => {
              delete next[key];
            });
            return next;
          });
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [audienceFilter, isTemplate]);

  useEffect(() => {
    if (!isEdit || !segmentId) return;
    let cancelled = false;
    (async () => {
      setPageLoading(true);
      try {
        const res = await api.get(`${itemApiBase}/${segmentId}`);
        if (cancelled) return;
        const row = res.data?.id ? res.data : res.data?.data || res.data;
        setSegment(row);
        reset({
          name: row.name || "",
          description: row.description || "",
          type: isTemplate
            ? "dynamic"
            : row.type === "frozen" || row.type === "freezing"
              ? "frozen"
              : "dynamic",
          audienceFilter: fromApiFilter(row.audienceFilter),
        });
      } catch (error) {
        toast.error(normalizeAxiosError(error) || t("toast.loadFailed"));
        router.push(listPath);
      } finally {
        if (!cancelled) setPageLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [isEdit, isTemplate, itemApiBase, listPath, reset, router, segmentId, t]);

  const goList = () => router.push(listPath);

  const applyTemplate = (row) => {
    reset({
      name: row.name || "",
      description: row.description || "",
      type: getValues("type") || "dynamic",
      audienceFilter: fromApiFilter(row.audienceFilter),
    });
    setShowFilterErrors(false);
    setStepError("");
    setStep(0);
    toast.success(t("toast.templateApplied"));
  };

  const fetchPreviewRecipients = useCallback(
    async ({ cursor = null, append = false } = {}) => {
      const payload = {
        audienceFilter: serializeAudienceFilter(
          getValues("audienceFilter"),
          metadata,
        ),
      };

      const params = {
        limit: PREVIEW_PAGE_SIZE,
        ...(cursor && { cursor }),
      };

      const res = await api.post(
        "/client-segments/recipients",
        payload,
        { params },
      );

      const { records, hasMore, nextCursor } = unwrapRecipients(res.data);

      setPreviewSamples((prev) =>
        append ? [...prev, ...records] : records,
      );
      setPreviewHasMore(hasMore);
      setPreviewNextCursor(nextCursor);
    },
    [getValues, metadata],
  );
  
  const refreshPreview = useCallback(async () => {
    setPreviewLoading(true);
    setPreviewHasMore(false);
    setPreviewNextCursor(null);
    try {
      const payload = { audienceFilter: serializeAudienceFilter(getValues("audienceFilter"), metadata) };
      const [countRes] = await Promise.all([
        api.post("/client-segments/preview", payload),
        fetchPreviewRecipients({ cursor: null, append: false }),
      ]);
      setPreviewCount(countRes.data?.count ?? countRes.data?.data?.count ?? 0);
    } catch (error) {
      toast.error(normalizeAxiosError(error) || t("toast.previewFailed"));
      setPreviewSamples([]);
      setPreviewHasMore(false);
      setPreviewNextCursor(null);
    } finally {
      setPreviewLoading(false);
    }
  }, [fetchPreviewRecipients, getValues, metadata, t]);

  const loadMoreClients = useCallback(async () => {
    if (!previewHasMore || !previewNextCursor || previewLoadingMore || previewLoading) return;
    setPreviewLoadingMore(true);
    try {
      await fetchPreviewRecipients({ cursor: previewNextCursor, append: true });
    } catch (error) {
      toast.error(normalizeAxiosError(error) || t("toast.previewFailed"));
    } finally {
      setPreviewLoadingMore(false);
    }
  }, [fetchPreviewRecipients, previewHasMore, previewLoading, previewLoadingMore, previewNextCursor, t]);

  const canFreeze =
    !isTemplate && isEdit && (segment?.type === "dynamic" || segment?.type === "freeze_failed");
  const canUnfreeze =
    !isTemplate && isEdit && (segment?.type === "frozen" || segment?.type === "freeze_failed");

  const reloadSegment = async () => {
    const res = await api.get(`/client-segments/${segmentId}`);
    const row = res.data?.id ? res.data : res.data?.data || res.data;
    setSegment(row);
    setValue(
      "type",
      row.type === "frozen" || row.type === "freezing" ? "frozen" : "dynamic",
    );
  };

  const handleFreeze = async () => {
    if (!canFreeze || !segmentId || freezeLoading) return;
    setFreezeLoading(true);
    try {
      await api.post(`/client-segments/${segmentId}/freeze`);
      toast.success(t("toast.frozen"));
      await reloadSegment();
    } catch (error) {
      toast.error(normalizeAxiosError(error) || t("toast.freezeFailed"));
    } finally {
      setFreezeLoading(false);
    }
  };

  const handleUnfreeze = async () => {
    if (!canUnfreeze || !segmentId || freezeLoading) return;
    setFreezeLoading(true);
    try {
      await api.post(`/client-segments/${segmentId}/unfreeze`);
      toast.success(t("toast.unfrozen"));
      await reloadSegment();
    } catch (error) {
      toast.error(normalizeAxiosError(error) || t("toast.unfreezeFailed"));
    } finally {
      setFreezeLoading(false);
    }
  };

  const goNext = async () => {
    setStepError("");
    if (step === 0) {
      const currentName = getValues("name")?.trim();
      if (!currentName) {
        setStepError(t("validation.nameRequired"));
        return;
      }
    }
    if (step === 1) {
      const filter = getValues("audienceFilter");
      if (countRules(filter) < 1) {
        setShowFilterErrors(true);
        setStepError(t("validation.rulesMin"));
        return;
      }
      if (collectInvalidRuleIds(filter).length) {
        setShowFilterErrors(true);
        setStepError(t("validation.valueRequired"));
        return;
      }
    }
    const next = Math.min(STEPS.length - 1, step + 1);
    setStep(next);
    if (next === 2 && !isTemplate) {
      setPreviewCount(null);
      setPreviewSamples([]);
      setPreviewHasMore(false);
      setPreviewNextCursor(null);
      refreshPreview();
    }
  };

  const onSubmit = handleSubmit(async (values) => {
    try {
      const audienceFilterPayload = serializeAudienceFilter(values.audienceFilter, metadata);
      if (isEdit) {
        const body = {
          name: values.name.trim(),
          description: values.description?.trim() || undefined,
        };
        if (isTemplate || !filterLocked) body.audienceFilter = audienceFilterPayload;
        await api.patch(`${itemApiBase}/${segmentId}`, body);
        toast.success(t("toast.updated"));
      } else if (isTemplate) {
        await api.post(itemApiBase, {
          name: values.name.trim(),
          description: values.description?.trim() || undefined,
          audienceFilter: audienceFilterPayload,
        });
        toast.success(t("toast.created"));
      } else {
        await api.post("/client-segments", {
          name: values.name.trim(),
          description: values.description?.trim() || undefined,
          type: values.type,
          audienceFilter: audienceFilterPayload,
        });
        toast.success(values.type === "frozen" ? t("toast.createdFrozen") : t("toast.created"));
      }
      goList();
    } catch (error) {
      toast.error(normalizeAxiosError(error));
    }
  });

  const breadcrumbs = isTemplate
    ? [
        { name: t("breadcrumb.home"), href: "/dashboard" },
        { name: t("breadcrumb.segments"), href: listPath },
        { name: isEdit ? t("breadcrumb.edit") : t("breadcrumb.new") },
      ]
    : [
        { name: t("breadcrumb.home"), href: "/dashboard" },
        { name: t("breadcrumb.customers"), href: "/customers" },
        { name: t("breadcrumb.segments"), href: listPath },
        { name: isEdit ? t("breadcrumb.edit") : t("breadcrumb.new") },
      ];

  if (pageLoading || !metadata) {
    return <SegmentFormSkeleton breadcrumbs={breadcrumbs} />;
  }

  return (
    <div className="min-h-screen p-5 space-y-4">
      <PageHeader
        breadcrumbs={breadcrumbs}
        buttons={
          !isTemplate && !isEdit ? (
            <Button_
              size="sm"
              variant="outline"
              label={t("actions.useTemplate")}
              permission="client-segments.read"
              icon={<LayoutTemplate size={16} />}
              onClick={() => setTemplatesOpen(true)}
            />
          ) : canFreeze || canUnfreeze ? (
            <div className="flex flex-wrap items-center gap-2">
              {canFreeze ? (
                <Button_
                  size="sm"
                  variant="outline"
                  label={t("actions.freeze")}
                  permission="client-segments.freeze"
                  disabled={freezeLoading}
                  icon={freezeLoading ? <Loader2 size={16} className="animate-spin" /> : <Snowflake size={16} />}
                  onClick={handleFreeze}
                />
              ) : null}
              {canUnfreeze ? (
                <Button_
                  size="sm"
                  variant="outline"
                  label={t("actions.unfreeze")}
                  permission="client-segments.freeze"
                  disabled={freezeLoading}
                  icon={freezeLoading ? <Loader2 size={16} className="animate-spin" /> : <Unlock size={16} />}
                  onClick={handleUnfreeze}
                />
              ) : null}
            </div>
          ) : null
        }
      />
      <Card>
        <CardHeader>
          <CardTitle className="text-2xl font-bold">
            {isEdit ? t("form.editTitle") : t("form.createTitle")}
          </CardTitle>
          <CardDescription>{t("form.subtitle")}</CardDescription>
        </CardHeader>
      </Card>

      <Card>
        <CardContent>
          <div className="flex items-center gap-0">
            {STEPS.map((key, index) => (
              <div key={key} className="flex items-center flex-1 min-w-0">
                <div className="flex items-center gap-2 min-w-0">
                  <div
                    className={cn(
                      "grid h-8 w-8 shrink-0 place-items-center rounded-full border text-sm font-bold",
                      index === step
                        ? "border-primary bg-primary text-white"
                        : index < step
                          ? "border-primary bg-primary/10 text-primary"
                          : "border-border text-muted-foreground",
                    )}
                  >
                    {index < step ? "✓" : index + 1}
                  </div>
                  <div className={cn("text-xs truncate", index === step ? "font-bold text-foreground" : "text-muted-foreground")}>
                    {t(`form.steps.${key}`)}
                  </div>
                </div>
                {index < STEPS.length - 1 && (
                  <div className={cn("h-0.5 flex-1 mx-2", index < step ? "bg-primary" : "bg-border")} />
                )}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <Card>
        <form
          onSubmit={(event) => {
            event.preventDefault();
          }}
        >
          <CardContent className="space-y-5">
            {step === 0 && (
              <div className="space-y-5">
                <div className="space-y-2">
                  <Label className="text-sm text-gray-600 dark:text-slate-300">
                    {t("form.name")} <span className="text-red-500">*</span>
                  </Label>
                  <Controller
                    name="name"
                    control={control}
                    render={({ field }) => (
                      <Input {...field} maxLength={160} placeholder={t("form.namePlaceholder")} />
                    )}
                  />
                  <div className="text-[11px] text-muted-foreground ltr:text-left" dir="ltr">
                    {name.length} / 160
                  </div>
                  {errors.name && <p className="text-xs text-red-500">{errors.name.message}</p>}
                </div>

                <div className="space-y-2">
                  <Label className="text-sm text-gray-600 dark:text-slate-300">
                    {t("form.description")} <span className="font-normal text-gray-400">{t("form.optional")}</span>
                  </Label>
                  <Controller
                    name="description"
                    control={control}
                    render={({ field }) => (
                      <Textarea {...field} maxLength={1000} placeholder={t("form.descriptionPlaceholder")} />
                    )}
                  />
                  <div className="text-[11px] text-muted-foreground ltr:text-left" dir="ltr">
                    {description.length} / 1000
                  </div>
                  {errors.description && <p className="text-xs text-red-500">{errors.description.message}</p>}
                </div>

                {!isTemplate && (
                <div className="space-y-2">
                  <Label className="text-sm font-semibold text-gray-600 dark:text-slate-300">{t("form.type")}</Label>
                  {isEdit ? (
                    <div className="rounded-lg border border-border bg-muted/40 px-3 py-2 text-sm">
                      {t(`types.${segment?.type || type}`)}
                      <p className="text-xs text-muted-foreground mt-1">{t("form.typeLocked")}</p>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      {[
                        { id: "dynamic", icon: Zap },
                        { id: "frozen", icon: Snowflake },
                      ].map((option) => {
                        const Icon = option.icon;
                        const active = type === option.id;
                        return (
                          <button
                            key={option.id}
                            type="button"
                            onClick={() => setValue("type", option.id)}
                            className={cn(
                              "flex gap-3 rounded-lg border p-3.5 text-start",
                              active
                                ? "border-primary bg-primary/5 shadow-[0_0_0_3px_rgb(var(--primary-shadow))]"
                                : "border-border bg-background",
                            )}
                          >
                            <span
                              className={cn(
                                "mt-0.5 grid h-[18px] w-[18px] shrink-0 place-items-center rounded-full border-2",
                                active ? "border-primary" : "border-slate-300",
                              )}
                            >
                              {active && <span className="h-2 w-2 rounded-full bg-primary" />}
                            </span>
                            <span>
                              <span className="flex items-center gap-2 text-sm font-bold">
                                <Icon size={14} className="text-primary" />
                                {t(`form.typeCards.${option.id}.title`)}
                              </span>
                              <span className="mt-1 block text-xs text-muted-foreground leading-relaxed">
                                {t(`form.typeCards.${option.id}.desc`)}
                              </span>
                            </span>
                          </button>
                        );
                      })}
                    </div>
                  )}
                  {!isEdit && (
                    <div className="rounded-lg bg-primary/10 px-3 py-2 text-xs text-primary">
                      {type === "frozen" ? t("form.frozenNote") : t("form.dynamicNote")}
                    </div>
                  )}
                </div>
                )}
              </div>
            )}

            {step === 1 && (
              <div className="space-y-3">
                {filterLocked && (
                  <div className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-800">
                    {t("form.filterLocked")}
                  </div>
                )}
                <Controller
                  name="audienceFilter"
                  control={control}
                  render={({ field }) => (
                    <AudienceFilterBuilder
                      value={field.value}
                      onChange={field.onChange}
                      disabled={filterLocked}
                      metadata={metadata}
                      lookups={fieldOptions}
                      lookupsLoading={lookupLoading}
                      invalidRuleIds={invalidRuleIds}
                      hiddenFields={hiddenFields}
                    />
                  )}
                />
                {errors.audienceFilter && (
                  <p className="text-xs text-red-500">{errors.audienceFilter.message}</p>
                )}
              </div>
            )}

            {step === 2 && (
              <div>
                <h2 className="text-base font-semibold mb-1">{t("form.reviewTitle")}</h2>
                <p className="text-xs text-muted-foreground mb-4">{t("form.reviewSubtitle")}</p>
                <div className="grid grid-cols-1 sm:grid-cols-[180px_1fr] gap-x-4 gap-y-2 text-sm mb-4">
                  <strong>{t("form.name")}</strong>
                  <span>{name || "—"}</span>
                  {!isTemplate && (
                    <>
                      <strong>{t("form.type")}</strong>
                      <span>{isEdit ? t(`types.${segment?.type || type}`) : t(`types.${type}`)}</span>
                    </>
                  )}
                  <strong>{t("form.description")}</strong>
                  <span>{description || "—"}</span>
                </div>
                <div className="mb-6 space-y-2">
                  <strong className="text-sm">{t("form.conditions")}</strong>
                  <AudienceFilterSummary
                    value={audienceFilter}
                    metadata={metadata}
                    lookups={fieldOptions}
                  />
                </div>
                {!isTemplate && (
                <div className="border-t border-border pt-5 grid grid-cols-1 lg:grid-cols-[minmax(0,240px)_1fr] gap-4">
                  <div className="rounded-xl border border-border bg-muted/40 p-4 flex flex-col gap-4">
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                        {t("form.estimatedResults")}
                      </p>
                      {filterLocked && segment?.frozenRecipientsCount != null && (
                        <p className="text-[11px] text-muted-foreground mt-1">
                          {t("form.frozenCount", { count: segment.frozenRecipientsCount })}
                        </p>
                      )}
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="grid h-12 w-12 shrink-0 place-items-center rounded-xl bg-primary/10 text-primary">
                        <Users size={22} />
                      </div>
                      <div className="min-w-0">
                        <div className="text-3xl font-black tabular-nums leading-none text-foreground">
                          {previewLoading ? (
                            <Loader2 className="animate-spin text-primary" size={26} />
                          ) : previewCount == null ? (
                            "—"
                          ) : (
                            previewCount.toLocaleString(locale)
                          )}
                        </div>
                        <p className="text-xs text-muted-foreground mt-1.5">{t("form.possibleCustomers")}</p>
                      </div>
                    </div>
                    <Button_
                      type="button"
                      size="sm"
                      variant="outline"
                      className="w-full mt-auto"
                      label={t("form.refreshPreview")}
                      permission="client-segments.preview"
                      disabled={previewLoading || previewLoadingMore}
                      icon={previewLoading ? <Loader2 size={14} className="animate-spin" /> : <RefreshCw size={14} />}
                      onClick={refreshPreview}
                    />
                  </div>
                  <div className="rounded-xl border border-border p-4 min-w-0 flex flex-col">
                    <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-3">
                      {t("form.clients")}
                    </p>
                    {previewLoading ? (
                      <div className="overflow-hidden" style={{ maxHeight: PREVIEW_PAGE_SIZE * PREVIEW_ROW_PX }}>
                        {Array.from({ length: PREVIEW_PAGE_SIZE }).map((_, index) => (
                          <PreviewClientSkeleton key={index} />
                        ))}
                      </div>
                    ) : previewSamples.length ? (
                      <>
                        <div className="overflow-y-auto" style={{ maxHeight: PREVIEW_PAGE_SIZE * PREVIEW_ROW_PX }}>
                          {previewSamples.map((row) => (
                            <div
                              key={row.clientId}
                              className="flex items-center gap-2.5 border-b border-border/60 py-2 last:border-b-0"
                              style={{ minHeight: PREVIEW_ROW_PX }}
                            >
                              <Avatar className="w-10 h-10 border border-border">
                                <AvatarImage
                                  src={avatarSrc(row.profilePicture)}
                                  alt={row.name || ""}
                                />
                                <AvatarFallback className="bg-muted text-muted-foreground">
                                  {(row.name || row.phoneNumber || "?").slice(-2)}
                                </AvatarFallback>
                              </Avatar>
                              <div className="min-w-0">
                                <div className="text-sm font-bold truncate">{row.name || row.customerId || row.clientId}</div>
                                <div className="text-xs text-muted-foreground" dir="ltr">
                                  {row.phoneNumber || "—"}
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                        {previewHasMore && previewNextCursor && (
                          <Button_
                            type="button"
                            size="sm"
                            variant="ghost"
                            className="w-full mt-2"
                            label={t("form.loadMore")}
                            permission="client-segments.preview"
                            disabled={previewLoadingMore}
                            icon={previewLoadingMore ? <Loader2 size={14} className="animate-spin" /> : null}
                            onClick={loadMoreClients}
                          />
                        )}
                      </>
                    ) : (
                      <p className="text-xs text-muted-foreground">{t("form.noClients")}</p>
                    )}
                  </div>
                </div>
                )}
              </div>
            )}

          </CardContent>
          <CardFooter className="justify-between gap-3 border-t mt-5!">
            <p className="text-xs text-red-500">{stepError}</p>
            <div className="flex items-center gap-2 ms-auto">
              {/* <GhostBtn type="button" onClick={goList}>
              {t("form.cancel")}
            </GhostBtn> */}
              {step > 0 && (
                <Button_ type="button" size="sm" variant="outline" label={t("form.back")} onClick={() => setStep(step - 1)} />
              )}
              {step < 2 ? (
                <PrimaryBtn key="next-step" type="button" onClick={goNext}>
                  {step === 0 ? t("form.nextFilter") : t("form.nextReview")}
                </PrimaryBtn>
              ) : (
                <PrimaryBtn
                  key="save-segment"
                  type="button"
                  loading={isSubmitting}
                  permission={isTemplate ? undefined : isEdit ? "client-segments.update" : "client-segments.create"}
                  onClick={onSubmit}
                >
                  {isEdit ? t("form.save") : t("form.create")}
                </PrimaryBtn>
              )}
            </div>
          </CardFooter>
        </form>
      </Card>

      {!isTemplate && !isEdit ? (
        <SegmentTemplatePickerDialog
          open={templatesOpen}
          onOpenChange={setTemplatesOpen}
          onSelect={applyTemplate}
        />
      ) : null}
    </div>
  );
}

function PreviewClientSkeleton() {
  return (
    <div className="flex items-center gap-2.5 border-b border-border/60 py-2 last:border-b-0" style={{ minHeight: PREVIEW_ROW_PX }}>
      <Bone className="h-10 w-10 rounded-full shrink-0" />
      <div className="min-w-0 flex-1 space-y-1.5">
        <Bone className="h-3.5 w-32 max-w-full" />
        <Bone className="h-3 w-24 max-w-full" />
      </div>
    </div>
  );
}

function SegmentFormSkeleton({ breadcrumbs }) {
  return (
    <div className="min-h-screen p-5 space-y-4">
      <PageHeader breadcrumbs={breadcrumbs} />

      <Card>
        <CardHeader>
          <Bone className="h-7 w-64 max-w-full" />
          <Bone className="h-3 w-96 max-w-full" />
        </CardHeader>
      </Card>

      <Card>
        <CardContent>
          <div className="flex items-center gap-2">
            {Array.from({ length: 3 }).map((_, index) => (
              <div key={index} className="flex items-center flex-1 min-w-0 gap-2">
                <Bone className="h-8 w-8 rounded-full shrink-0" />
                <Bone className="h-3 w-24" />
                {index < 2 && <Bone className="h-0.5 flex-1" />}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="space-y-5">
          <div className="space-y-2">
            <Bone className="h-3 w-28" />
            <Bone className="h-10 w-full rounded-md" />
            <Bone className="h-3 w-16" />
          </div>
          <div className="space-y-2">
            <Bone className="h-3 w-32" />
            <Bone className="h-24 w-full rounded-md" />
          </div>
          <div className="space-y-2">
            <Bone className="h-3 w-24" />
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <Bone className="h-24 w-full rounded-lg" />
              <Bone className="h-24 w-full rounded-lg" />
            </div>
          </div>
        </CardContent>
        <CardFooter className="justify-end gap-2 border-t">
          <Bone className="h-10 w-20 rounded-xl" />
          <Bone className="h-10 w-36 rounded-xl" />
        </CardFooter>
      </Card>
    </div>
  );
}
