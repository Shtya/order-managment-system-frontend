"use client";
import { emailContentPayload } from "@/components/email-builder/document";

import { useEffect, useMemo, useState, useRef } from "react";
import { useForm } from "react-hook-form";
import { useSearchParams } from "next/navigation";
import { useTranslations } from "next-intl";
import toast from "react-hot-toast";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import PageHeader from "@/components/atoms/Pageheader";
import Button_, { PrimaryBtn } from "@/components/atoms/Button";
import { Bone } from "@/components/atoms/BannerSkeleton";
import { cn } from "@/utils/cn";
import { useRouter } from "@/i18n/navigation";
import api from "@/utils/api";
import { normalizeAxiosError } from "@/utils/axios";
import { setDocumentTitle } from "@/utils/documentTitle";
import EmailDraftRecovery from "@/components/email-builder/EmailDraftRecovery";
import StepGeneral from "./StepGeneral";
import StepRecipients from "./StepRecipients";
import StepMessage from "./StepMessage";
import StepOffer from "./StepOffer";
import StepReview from "./StepReview";
import {
  initialWizardData,
  validateStepGeneral,
  validateStepRecipients,
  validateStepMessage,
  validateStepOffer,
  buildCampaignPayload,
  WIZARD_STEPS,
} from "./wizardSchema";
import { fromApiFilter } from "@/components/audience-filter";
import {
  campaignListHref,
  normalizeCampaignChannel,
} from "../campaignChannel";

const STEPS = WIZARD_STEPS;
const EDITABLE_STATUSES = ["draft", "scheduled"];

function mapCampaignToForm(campaign) {
  const snap = campaign.templateConfigSnapshot || {};
  const headerType = snap.templateData?.headerType || null;
  let scheduledDate = "";
  let scheduledTime = "";
  if (campaign.scheduledAt) {
    const d = new Date(campaign.scheduledAt);
    if (!Number.isNaN(d.getTime())) {
      scheduledDate = d.toISOString();
      scheduledTime = `${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
    }
  }
  return {
    ...initialWizardData,
    name: campaign.name || "",
    description: campaign.description || "",
    category: campaign.category || "general_marketing",
    workingHoursEnabled: !!(campaign.workingHoursStart || campaign.workingHoursEnd),
    workingHoursStart: campaign.workingHoursStart || "09:00",
    workingHoursEnd: campaign.workingHoursEnd || "22:00",
    workingHoursTimezone: campaign.workingHoursTimezone || initialWizardData.workingHoursTimezone,
    delayMinSeconds: campaign.delayMinSeconds ?? 30,
    delayMaxSeconds: campaign.delayMaxSeconds ?? 90,
    channel: campaign.channel || "whatsapp",
    scheduleMode: campaign.scheduleMode || "now",
    scheduledDate,
    scheduledTime,
    maxMessagesPerHour: campaign.maxMessagesPerHour ?? "",
    audienceType: campaign.audienceType || "segment",
    audienceSegmentId: campaign.audienceSegmentId || null,
    audienceFile: null,
    audienceFileMeta: null,
    audienceFileUrl: campaign.audienceFileUrl || null,
    manualRecipients: (campaign.audienceManualSnapshot || []).map((r) => ({
      phoneNumber: r.phoneNumber,
      email:r.email,
      name: r.name || null,
    })),
    audienceFilter: campaign.audienceFilter || null,
    audienceFilterRaw: campaign.audienceFilter ? fromApiFilter(campaign.audienceFilter) : null,
    email: campaign.channel === "email" ? { accountId:snap.accountId, subject:snap.subject, preheader:snap.preheader || "", businessIdentity:snap.businessIdentity, document:snap.document } : null,
    whatsappAccountId: campaign.channel === "email" ? null : snap.accountId || null,
    whatsapp: campaign.templateId
      ? {
          templateId: campaign.templateId,
          templateName: campaign.template?.name || "",
          templateData: snap.templateData || null,
          parameterFormat: snap.templateData?.parameterFormat,
          headerVariables: snap.headerVariables || {},
          bodyVariables: snap.bodyVariables || {},
          buttonVariables: snap.buttonVariables || {},
          locationData: snap.locationData || null,
          headerUrl: snap.headerUrl || "",
          headerFile: null,
          needsMedia: ["IMAGE", "VIDEO", "DOCUMENT"].includes(headerType),
          needsLocation: headerType === "LOCATION",
          headerType,
          accountId: snap.accountId || null,
        }
      : null,
    enablePurchasePage: !!campaign.enablePurchasePage,
    products: (campaign.products || []).map((p) => ({
      variantId: p.variantId,
      productId: p.productId,
      name: p.name,
      sku: p.sku,
      image: p.image,
      quantity: Number(p.quantity || 1),
      price: Number(p.price || 0),
    })),
    shippingPrice: Number(campaign.shippingPrice || 0),
    orderReplyFollowupEnabled: !!campaign.orderReplyFollowupEnabled,
    orderReplyFollowups: Array.isArray(campaign.orderReplyFollowups)
      ? campaign.orderReplyFollowups.map((item) => ({
        buttonIndex: Number(item?.buttonIndex ?? 0),
        text: String(item?.text ?? ""),
      }))
      : [],
  };
}

export default function CampaignWizard({ mode = "create", campaignId = null, copyFromId = null, channel: channelProp = null }) {
  const emailHistoryRef = useRef(null);
  const isEdit = mode === "edit";
  const isCopy = !isEdit && !!copyFromId;
  const searchParams = useSearchParams();
  const queryChannel = normalizeCampaignChannel(
    searchParams.get("channel") ?? channelProp ?? "whatsapp",
  );
  const lockedChannel = normalizeCampaignChannel(channelProp ?? queryChannel ?? "whatsapp");
  const t = useTranslations("campaigns.wizard");
  const tc = useTranslations("campaigns");
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [stepError, setStepError] = useState("");
  const [saving, setSaving] = useState(false);
  const [validating, setValidating] = useState(false);
  const [nameStatus, setNameStatus] = useState(null);
  const [pageLoading, setPageLoading] = useState(isEdit || isCopy);
  const [notEditable, setNotEditable] = useState(false);

  const { control, watch, setValue, getValues, reset, setError, clearErrors, formState: { errors } } = useForm({
    defaultValues: { ...initialWizardData, channel: lockedChannel },
  });

  const watchedChannel = watch("channel");
  const previousChannelRef = useRef(watchedChannel || lockedChannel);
  const listHref = useMemo(
    () => campaignListHref(watchedChannel),
    [watchedChannel],
  );

  // Fresh create / duplicate: keep the URL channel locked.
  // Edit keeps the stored campaign channel (applied on load below).
  useEffect(() => {
    if (isEdit) return;
    const next = normalizeCampaignChannel(queryChannel ?? lockedChannel ?? "whatsapp");
    if (watchedChannel !== next) {
      setValue("channel", next, { shouldDirty: true });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [queryChannel, lockedChannel, isEdit]);

  useEffect(() => {
    if (isEdit) return;
    const prev = previousChannelRef.current;
    if (watchedChannel && prev && watchedChannel !== prev) {
      setValue("email", null, { shouldDirty: true });
      setValue("whatsappAccountId", null, { shouldDirty: true });
      setValue("whatsapp", null, { shouldDirty: true });
      setValue("enablePurchasePage", false, { shouldDirty: true });
      setValue("products", [], { shouldDirty: true });
      setValue("shippingPrice", 0, { shouldDirty: true });
      setValue("orderReplyFollowupEnabled", false, { shouldDirty: true });
      setValue("orderReplyFollowups", [], { shouldDirty: true });
      setStep(0);
    }
    previousChannelRef.current = watchedChannel;
  }, [watchedChannel, isEdit]);

  useEffect(() => {
    setDocumentTitle(t(isEdit ? "editTitle" : "title"));
  }, [t, isEdit]);

  useEffect(() => {
    const sourceId = isEdit ? campaignId : copyFromId;
    if (!sourceId) return;
    let cancelled = false;
    (async () => {
      setPageLoading(true);
      try {
        const res = await api.get(`/campaigns/${sourceId}`);
        const row = res.data?.id ? res.data : res.data?.data;
        if (cancelled) return;
        if (isEdit && !EDITABLE_STATUSES.includes(row?.status)) {
          setNotEditable(true);
          return;
        }
        const mapped = mapCampaignToForm(row);
        
        // Duplicate flow: reuse everything as initial data except the
        // (unique) name, which the user must enter fresh.
        reset(isCopy ? { ...mapped, name: "" } : mapped);
      } catch (error) {
        if (!cancelled) toast.error(normalizeAxiosError(error) || t("loadFailed"));
      } finally {
        if (!cancelled) setPageLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isEdit, campaignId, copyFromId]);

  const breadcrumbs = useMemo(
    () => [
      { name: tc("breadcrumb.home"), href: "/dashboard" },
      { name: tc("breadcrumb.campaigns"), href: listHref },
      { name: t(isEdit ? "editTitle" : "title") },
    ],
    [tc, t, isEdit, listHref],
  );

  const goNext = async () => {
    if (validating) return;
    setStepError("");
    const values = getValues();
    if (step === 0) {
      const errs = validateStepGeneral(values);
      clearErrors();
      Object.entries(errs).forEach(([k, v]) => setError(k, { type: "manual", message: v }));
      if (Object.keys(errs).length) {
        setStepError(t("fixStepErrors"));
        return;
      }
      if (nameStatus === "checking" || nameStatus === "taken") {
        setStepError(t(nameStatus === "taken" ? "nameTaken" : "fixStepErrors"));
        return;
      }
    }
    if (step === 1) {
      const errs = validateStepRecipients(values);
      if (Object.keys(errs).length) {
        setStepError(t(errs[Object.keys(errs)[0]]));
        return;
      }
    }
    if (step === 2) {
      const errs = validateStepMessage(values);
      clearErrors("email");
      Object.entries(errs).forEach(([key, message]) =>
        setError(key, { type: "manual", message }),
      );
      if (Object.keys(errs).length) {
        const errorKey = errs["email.document"] || errs.whatsapp;
        setStepError(errorKey ? t(errorKey) : "");
        if (errs["email.accountId"] === "validation.emailAccountSuspended")
          toast.error(t(errs["email.accountId"]));
        return;
      }
    }
    if (step === 2 && values.channel === "email") {
      setValidating(true);
      try { await api.post("/email/content/validate", emailContentPayload(values.email)); }
      catch(error) {
        window.dispatchEvent(new CustomEvent("email-builder-diagnostics", {
          detail: error.response?.data?.diagnostics || [],
        }));
        setStepError(normalizeAxiosError(error) || t("fixStepErrors"));
        return;
      }
      finally { setValidating(false); }
    }
    if (step === 3) {
      const errs = validateStepOffer(values);
      if (Object.keys(errs).length) {
        setStepError(t(errs[Object.keys(errs)[0]] || "fixStepErrors"));
        return;
      }
    }
    setStep((s) => Math.min(STEPS.length - 1, s + 1));
  };

  const handleSave = async () => {
    const values = getValues();
    const g = validateStepGeneral(values);
    const r = validateStepRecipients(values);
    const m = validateStepMessage(values);
    const o = validateStepOffer(values);
    if (Object.keys(g).length || Object.keys(r).length || Object.keys(m).length || Object.keys(o).length) {
      clearErrors();
      Object.entries({ ...g, ...r, ...m, ...o }).forEach(([key, message]) =>
        setError(key, { type: "manual", message }),
      );
      if (Object.keys(g).length) setStep(0);
      else if (Object.keys(r).length) setStep(1);
      else if (Object.keys(m).length) setStep(2);
      else setStep(3);
      const globalMessage = m["email.document"] || m.whatsapp;
      setStepError(globalMessage ? t(globalMessage) : "");
      return;
    }
    if (nameStatus === "checking" || nameStatus === "taken") {
      setStepError(t(nameStatus === "taken" ? "nameTaken" : "fixStepErrors"));
      return;
    }
    setSaving(true);
    try {
      const payload = buildCampaignPayload(values, { copyStoredFile: !isEdit });
      if (values.channel === "email") {
        try {
          await api.post("/email/content/validate", emailContentPayload(values.email));
        } catch (error) {
          window.dispatchEvent(new CustomEvent("email-builder-diagnostics", {
            detail: error.response?.data?.diagnostics || [],
          }));
          throw error;
        }
      }
      // Header media picked from disk must become a hosted URL first.
      // Mirrors whatsapp-healper handleAssetUpload (/orphan-files/any).
      const headerFile = values.channel === "whatsapp" ? values.whatsapp?.headerFile : null;
      if (headerFile) {
        const fd = new FormData();
        fd.append("file", headerFile);
        const { data } = await api.post("/orphan-files/any", fd, {
          headers: { "Content-Type": "multipart/form-data" },
        });
        const url = data?.url;
        const orphanId = data?.id;
        if (!url) throw new Error("media_upload_failed");
        payload.whatsapp = { ...(payload.whatsapp || {}), headerUrl: url };
        if (orphanId) payload.orphanFileIds = [orphanId];
      } else if (typeof payload.whatsapp?.headerUrl === "string" && payload.whatsapp.headerUrl.startsWith("blob:")) {
        delete payload.whatsapp.headerUrl;
      }
      if (isEdit) {
        if (values.audienceType === "file" && values.audienceFile) {
          const formData = new FormData();
          formData.append("payload", JSON.stringify(payload));
          formData.append("audienceFile", values.audienceFile);
          await api.patch(`/campaigns/${campaignId}`, formData, {
            headers: { "Content-Type": "multipart/form-data" },
          });
        } else {
          await api.patch(`/campaigns/${campaignId}`, payload);
        }
      } else {
        const formData = new FormData();
        formData.append("payload", JSON.stringify(payload));
        if (values.audienceType === "file" && values.audienceFile) {
          formData.append("audienceFile", values.audienceFile);
        }
        await api.post("/campaigns", formData, {
          headers: { "Content-Type": "multipart/form-data" },
        });
      }
      window.dispatchEvent(new CustomEvent("email-draft-clear"));
      toast.success(t("saved"));
      router.push(campaignListHref(values.channel));
    } catch (error) {
      toast.error(normalizeAxiosError(error) || t("saveFailed"));
    } finally {
      setSaving(false);
    }
  };

  if (pageLoading) {
    return (
      <div className="min-h-screen p-5 space-y-4">
        <PageHeader breadcrumbs={breadcrumbs} />
        <Card>
          <CardContent className="space-y-3 pt-6">
            <Bone className="h-6 w-48" />
            <Bone className="h-10 w-full rounded-md" />
            <Bone className="h-24 w-full rounded-md" />
          </CardContent>
        </Card>
      </div>
    );
  }

  if (notEditable) {
    return (
      <div className="min-h-screen p-5 space-y-4">
        <PageHeader breadcrumbs={breadcrumbs} />
        <Card>
          <CardContent className="pt-6">
            <p className="text-sm text-red-500">{t("notEditable")}</p>
            <div className="mt-4">
              <Button_ size="sm" variant="outline" label={t("backToList")} onClick={() => router.push(listHref)} />
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen p-5 space-y-4">
      <PageHeader breadcrumbs={breadcrumbs} />
      {/* {watchedChannel === "email" && <EmailDraftRecovery watch={watch} setValue={setValue} campaignId={campaignId || copyFromId || "new"}/>} */}

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
                    {t(`steps.${key}`)}
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
        <CardContent className="pt-6">
          {step === 0 && (
            <StepGeneral
              control={control}
              errors={errors}
              watch={watch}
              setValue={setValue}
              setStep={setStep}
              step={step}
              campaignId={isEdit ? campaignId : null}
              nameStatus={nameStatus}
              setNameStatus={setNameStatus}
            />
          )}
          {step === 1 && <StepRecipients control={control} watch={watch} setValue={setValue} getValues={getValues} />}
          {step === 2 && <StepMessage watch={watch} setValue={setValue} getValues={getValues} emailHistoryRef={emailHistoryRef} errors={errors} clearErrors={clearErrors}/>}
          {step === 3 && <StepOffer watch={watch} setValue={setValue} />}
          {step === 4 && <StepReview watch={watch} getValues={getValues} />}
        </CardContent>
        <CardFooter className="justify-between gap-3 border-t mt-5!">
          <p className="text-xs text-red-500">{stepError}</p>
          <div className="flex items-center gap-2 ms-auto">
            {step > 0 && (
              <Button_ type="button" size="sm" variant="outline" label={t("back")} onClick={() => setStep((s) => s - 1)} />
            )}
            {step < STEPS.length - 1 ? (
              <PrimaryBtn key="next" type="button" loading={validating} onClick={goNext}>
                {t("next")}
              </PrimaryBtn>
            ) : (
              <PrimaryBtn key="save" type="button" loading={saving} permission={isEdit ? "campaigns.update" : "campaigns.create"} onClick={handleSave}>
                {t("save")}
              </PrimaryBtn>
            )}
          </div>
        </CardFooter>
      </Card>
    </div>
  );
}
