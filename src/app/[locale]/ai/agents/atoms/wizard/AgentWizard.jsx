"use client";

import { useEffect, useMemo, useState } from "react";
import { useForm } from "react-hook-form";
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
import StepGeneral from "./StepGeneral";
import StepKnowledge from "./StepKnowledge";
import StepCapabilities from "./StepCapabilities";
import StepReview from "./StepReview";
import {
  AGENT_WIZARD_STEPS,
  buildAgentPayload,
  initialAgentWizardData,
  mapAgentToForm,
  validateStepGeneral,
} from "./agentWizardSchema";

const STEPS = AGENT_WIZARD_STEPS;
const LIST_HREF = "/ai/agents";

export default function AgentWizard({ mode = "create", agentId = null }) {
  const isEdit = mode === "edit";
  const t = useTranslations("agents");
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [stepError, setStepError] = useState("");
  const [saving, setSaving] = useState(false);
  const [pageLoading, setPageLoading] = useState(isEdit);

  const { control, watch, setValue, getValues, reset, setError, clearErrors, formState: { errors } } = useForm({
    defaultValues: { ...initialAgentWizardData },
  });

  useEffect(() => {
    setDocumentTitle(t(isEdit ? "wizard.editTitle" : "wizard.title"));
  }, [t, isEdit]);

  useEffect(() => {
    if (!isEdit || !agentId) return;
    let cancelled = false;
    (async () => {
      setPageLoading(true);
      try {
        const res = await api.get(`/agents/${agentId}`);
        const row = res.data?.id ? res.data : res.data?.data;
        if (cancelled) return;
        reset(mapAgentToForm(row));
      } catch (error) {
        if (!cancelled) toast.error(normalizeAxiosError(error) || t("wizard.loadFailed"));
      } finally {
        if (!cancelled) setPageLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isEdit, agentId]);

  const breadcrumbs = useMemo(
    () => [
      { name: t("breadcrumb.home"), href: "/dashboard" },
      { name: t("breadcrumb.ai"), href: "/ai" },
      { name: t("breadcrumb.agents"), href: LIST_HREF },
      { name: t(isEdit ? "wizard.editTitle" : "wizard.title") },
    ],
    [t, isEdit],
  );

  const goNext = async () => {
    setStepError("");
    const values = getValues();
    if (step === 0) {
      const errs = validateStepGeneral(values);
      clearErrors();
      Object.entries(errs).forEach(([k, v]) => setError(k, { type: "manual", message: v }));
      if (Object.keys(errs).length) {
        setStepError(t("wizard.fixStepErrors"));
        return;
      }
    }
    setStep((s) => Math.min(STEPS.length - 1, s + 1));
  };

  const handleSave = async () => {
    const values = getValues();
    const g = validateStepGeneral(values);
    if (Object.keys(g).length) {
      setStepError(t("wizard.fixStepErrors"));
      return;
    }
    setSaving(true);
    try {
      const payload = buildAgentPayload(values);
      if (isEdit) {
        await api.patch(`/agents/${agentId}`, payload);
      } else {
        await api.post("/agents", payload);
      }
      toast.success(t("wizard.saved"));
      router.push(LIST_HREF);
    } catch (error) {
      toast.error(normalizeAxiosError(error) || t("wizard.saveFailed"));
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

  return (
    <div className="min-h-screen p-5 space-y-4">
      <PageHeader breadcrumbs={breadcrumbs} />

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
                    {t(`wizard.steps.${key}`)}
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
          {step === 0 && <StepGeneral control={control} errors={errors} />}
          {step === 1 && <StepKnowledge watch={watch} setValue={setValue} />}
          {step === 2 && <StepCapabilities />}
          {step === 3 && <StepReview getValues={getValues} onEditStep={setStep} />}
        </CardContent>
        <CardFooter className="justify-between gap-3 border-t mt-5!">
          <p className="text-xs text-red-500">{stepError}</p>
          <div className="flex items-center gap-2 ms-auto">
            {step > 0 && (
              <Button_ type="button" size="sm" variant="outline" label={t("wizard.back")} onClick={() => setStep((s) => s - 1)} />
            )}
            {step < STEPS.length - 1 ? (
              <PrimaryBtn key="next" type="button" onClick={goNext}>
                {t("wizard.next")}
              </PrimaryBtn>
            ) : (
              <PrimaryBtn key="save" type="button" loading={saving} permission={isEdit ? "agents.update" : "agents.create"} onClick={handleSave}>
                {t("wizard.save")}
              </PrimaryBtn>
            )}
          </div>
        </CardFooter>
      </Card>
    </div>
  );
}
