"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { Badge } from "@/components/ui/badge";
import api from "@/utils/api";

export default function StepReview({ getValues, onEditStep }) {
  const t = useTranslations("agents");
  const v = getValues();
  const selectedIds = Array.isArray(v.knowledgeIds) ? v.knowledgeIds : [];
  const enabledCapabilities = Array.isArray(v.capabilities) ? v.capabilities : [];
  const [titles, setTitles] = useState([]);
  const [providerName, setProviderName] = useState(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const [knowledgeRes, providersRes] = await Promise.all([
          selectedIds.length
            ? api.get("/agents/knowledge", { params: { limit: 100 } })
            : Promise.resolve(null),
          v.responseProviderId && v.responseProviderId !== "auto"
            ? api.get("/ai/providers", { params: { scope: "all", isActive: "true" } })
            : Promise.resolve(null),
        ]);
        if (cancelled) return;
        const records = Array.isArray(knowledgeRes?.data?.records)
          ? knowledgeRes.data.records
          : [];
        setTitles(
          records
            .filter((item) => selectedIds.includes(item.id))
            .map((item) => item.title),
        );
        const providerRecords = Array.isArray(providersRes?.data)
          ? providersRes.data
          : providersRes?.data?.records || [];
        setProviderName(
          providerRecords.find((provider) => provider.id === v.responseProviderId)?.name || null,
        );
      } catch {
        if (!cancelled) {
          setTitles([]);
          setProviderName(null);
        }
      }
    })();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const sections = [
    {
      step: 0,
      title: t("wizard.steps.general"),
      rows: [
        [t("form.name"), v.name || "—"],
        [t("form.language"), t(`languages.${v.language || "auto"}`)],
        [t("form.gender"), t(`genders.${v.gender || "male"}`)],
        [t("form.provider"), providerName || t("provider.auto")],
        [t("form.customInstructions"), v.customInstructions || "—"],
        [
          t("form.isActive"),
          <Badge
            key="status"
            variant={v.isActive ? "secondary" : "outline"}
          >
            {t(`status.${v.isActive ? "active" : "inactive"}`)}
          </Badge>,
        ],
      ],
    },
    {
      step: 1,
      title: t("wizard.steps.knowledge"),
      custom: selectedIds.length ? (
        <ul className="list-disc ps-5 space-y-1">
          {titles.map((title) => (
            <li key={title}>{title}</li>
          ))}
        </ul>
      ) : (
        <span className="text-muted-foreground">{t("wizard.reviewEmptyKnowledge")}</span>
      ),
      footnote: t("knowledge.assign.selected", { count: selectedIds.length }),
    },
    {
      step: 2,
      title: t("wizard.steps.capabilities"),
      custom: (
        <ul className="list-disc ps-5 space-y-1">
          {enabledCapabilities.map((id) => (
            <li key={id}>{t(`wizard.capabilities.${id}.title`)}</li>
          ))}
        </ul>
      ),
    },
  ];

  return (
    <div className="space-y-3">
      {sections.map((section) => (
        <div key={section.title} className="border border-border rounded-xl p-4">
          <div className="flex items-center justify-between mb-3">
            <p className="text-sm font-semibold text-foreground">{section.title}</p>
            <button
              type="button"
              onClick={() => onEditStep(section.step)}
              className="text-xs font-semibold text-primary hover:underline"
            >
              {t("wizard.editSection")}
            </button>
          </div>
          {section.rows ? (
            <dl className="grid grid-cols-[140px_1fr] gap-x-3 gap-y-2 text-sm">
              {section.rows.map(([label, value]) => (
                <div key={label} className="contents">
                  <dt className="text-muted-foreground">{label}</dt>
                  <dd className="text-foreground break-words">{value}</dd>
                </div>
              ))}
            </dl>
          ) : (
            section.custom
          )}
          {section.footnote ? (
            <p className="text-xs text-muted-foreground mt-2">{section.footnote}</p>
          ) : null}
        </div>
      ))}
    </div>
  );
}
