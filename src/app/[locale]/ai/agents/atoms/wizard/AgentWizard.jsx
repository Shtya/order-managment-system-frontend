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
  buildAgentPayload,
  initialAgentWizardData,
  mapAgentToForm,
  validateStepGeneral,
} from "./agentWizardSchema";

const LIST_HREF = "/ai/agents";

const SECTION_IDS = {
  general: "agent-section-general",
  knowledge: "agent-section-knowledge",
  capabilities: "agent-section-capabilities",
  review: "agent-section-review",
};

function SectionCard({ stepKey, index, children }) {
  const t = useTranslations("agents");
  return (
    <Card id={SECTION_IDS[stepKey]}>
      <CardContent className="pt-6">
        <div className="flex items-center gap-2 mb-4">
          <div
            className={cn(
              "grid h-8 w-8 shrink-0 place-items-center rounded-full border text-sm font-bold",
              "border-primary bg-primary text-white",
            )}
          >
            {index + 1}
          </div>
          <div className="text-sm font-bold text-foreground">
            {t(`wizard.steps.${stepKey}`)}
          </div>
        </div>
        {children}
      </CardContent>
    </Card>
  );
}

export default function AgentWizard({ mode = "create", agentId = null }) {
  const isEdit = mode === "edit";
  const t = useTranslations("agents");
  const router = useRouter();
  const [formError, setFormError] = useState("");
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

  const scrollToSection = (stepKey) => {
    document
      .getElementById(SECTION_IDS[stepKey])
      ?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  const handleSave = async () => {
    const values = getValues();
    const g = validateStepGeneral(values);
    clearErrors();
    Object.entries(g).forEach(([k, v]) => setError(k, { type: "manual", message: v }));
    if (Object.keys(g).length) {
      setFormError(t("wizard.fixStepErrors"));
      scrollToSection("general");
      return;
    }
    setFormError("");
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

      <SectionCard stepKey="general" index={0}>
        <StepGeneral control={control} errors={errors} />
      </SectionCard>

      <SectionCard stepKey="knowledge" index={1}>
        <StepKnowledge watch={watch} setValue={setValue} />
      </SectionCard>

      <SectionCard stepKey="capabilities" index={2}>
        <StepCapabilities watch={watch} setValue={setValue} />
      </SectionCard>

      {/* <SectionCard stepKey="review" index={3}>
        <StepReview control={control} onEditSection={scrollToSection} />
      </SectionCard> */}
    </div>
  );
}
