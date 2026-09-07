"use client";

import { useEffect, useMemo, useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { Badge } from "@/components/ui/badge";
import TemplatePreview from "@/app/[locale]/whatsapp/atoms/TemplatePreview";
import api from "@/utils/api";
import {
  AudienceFilterSummary,
  buildAudienceFieldOptions,
} from "@/components/audience-filter";
import {
  EMPTY_AUDIENCE_LOOKUPS,
  fetchAudienceLookupKeys,
  lookupKeysForFields,
} from "@/components/audience-filter/lookups";
import { collectRuleFields } from "@/components/audience-filter/audience-filter.utils";
import { combineScheduledAt } from "./wizardSchema";

export default function StepReview({ getValues }) {
  const t = useTranslations("campaigns.wizard");
  const tSeg = useTranslations("customerSegments");
  const ta = useTranslations("audienceFilter");
  const tOrders = useTranslations("orders");
  const tTags = useTranslations("tags");
  const locale = useLocale();
  const v = getValues();
  const empty = t("review.empty");

  const [segment, setSegment] = useState(null);
  const [metadata, setMetadata] = useState(null);
  const [lookupsRaw, setLookupsRaw] = useState(EMPTY_AUDIENCE_LOOKUPS);

  useEffect(() => {
    if (v.audienceType !== "segment" || !v.audienceSegmentId) return;
    let cancelled = false;
    (async () => {
      try {
        const res = await api.get(`/client-segments/${v.audienceSegmentId}`);
        if (!cancelled) setSegment(res.data?.id ? res.data : res.data?.data);
      } catch {
        /* show id fallback */
      }
    })();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (v.audienceType !== "customers") return;
    let cancelled = false;
    (async () => {
      try {
        const metaRes = await api.get("/audience-filter/entities");
        if (cancelled) return;
        setMetadata(metaRes.data?.entities ? metaRes.data : metaRes.data?.data || metaRes.data);
        const raw = v.audienceFilterRaw;
        if (raw) {
          const loaded = await fetchAudienceLookupKeys(
            lookupKeysForFields(collectRuleFields(raw), { includeTenant: true }),
          );
          if (!cancelled) setLookupsRaw((prev) => ({ ...prev, ...loaded }));
        }
      } catch {
        /* summary falls back to counts */
      }
    })();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const fieldOptions = useMemo(
    () => buildAudienceFieldOptions({ lookups: lookupsRaw, locale, tOrders, tTags, tAudience: ta }),
    [lookupsRaw, locale, tOrders, tTags, ta],
  );

  let segTypeLabel = segment?.type || "";
  try {
    if (segment?.type) segTypeLabel = tSeg(`types.${segment.type}`);
  } catch {
    /* fallback to raw type */
  }

  const rows = [
    [t("name"), v.name || empty],
    [t("category"), v.category ? t(`categories.${v.category}`) : empty],
    [t("description"), v.description || empty],
    [t("workingHours"), v.workingHoursEnabled ? `${v.workingHoursStart} → ${v.workingHoursEnd}` : t("review.offHours")],
    [t("delayMax"), `${v.delayMinSeconds}s → ${v.delayMaxSeconds}s`],
    [t("channel"), t("channels.whatsapp")],
    [t("scheduleMode"), v.scheduleMode === "scheduled"
      ? combineScheduledAt(v.scheduledDate, v.scheduledTime) || `${v.scheduledDate || ""} ${v.scheduledTime || ""}`
      : t("scheduleNow")],
    [t("maxPerHour"), v.maxMessagesPerHour || "—"],
  ];

  return (
    <div className="space-y-4">
      <div>
        <h3 className="text-sm font-bold">{t("review.title")}</h3>
        <p className="text-xs text-muted-foreground">{t("review.subtitle")}</p>
      </div>

      <div className="rounded-xl border border-border p-4">
        <p className="mb-2 text-xs font-black uppercase tracking-widest text-muted-foreground">{t("review.general")}</p>
        <dl className="grid grid-cols-1 sm:grid-cols-[180px_1fr] gap-x-4 gap-y-2 text-sm">
          {rows.map(([label, val]) => (
            <div key={label} className="contents">
              <dt className="text-muted-foreground">{label}</dt>
              <dd className="font-medium break-words">{String(val || empty)}</dd>
            </div>
          ))}
        </dl>
      </div>

      <div className="rounded-xl border border-border p-4">
        <p className="mb-2 text-xs font-black uppercase tracking-widest text-muted-foreground">{t("review.audience")}</p>
        <Badge variant="outline">{t(`recipients.${v.audienceType === "customers" ? "customers" : v.audienceType}`)}</Badge>

        {v.audienceType === "segment" && (
          <div className="mt-3 flex items-center gap-3 rounded-xl border border-border bg-muted/30 p-3">
            <span className="min-w-0 flex-1">
              <span className="block truncate text-sm font-bold">{segment?.name || v.audienceSegmentId}</span>
              <span className="block text-xs text-muted-foreground">
                {(segment?.estimatedRecipientsCount ?? segment?.frozenRecipientsCount ?? "—") + (segTypeLabel ? ` · ${segTypeLabel}` : "")}
              </span>
            </span>
            {segTypeLabel && <Badge variant="outline">{segTypeLabel}</Badge>}
          </div>
        )}

        {v.audienceType === "customers" && (
          <div className="mt-3">
            {metadata && v.audienceFilterRaw ? (
              <AudienceFilterSummary value={v.audienceFilterRaw} metadata={metadata} lookups={fieldOptions} />
            ) : (
              <p className="text-sm text-muted-foreground">{t("recipients.loading")}</p>
            )}
          </div>
        )}

        {v.audienceType === "file" && (
          <div className="mt-3 rounded-xl border border-border bg-muted/30 px-3 py-2 text-sm">
            <p className="truncate font-medium">{v.audienceFileMeta?.name || v.audienceFile?.name || empty}</p>
            <p className="mt-1 text-xs">
              ✅ {t("recipients.numbersFound", { count: v.audienceFileMeta?.valid ?? 0 })}
              {(v.audienceFileMeta?.invalid ?? 0) > 0 && (
                <span className="text-red-500"> · ⚠️ {t("recipients.invalidRows", { count: v.audienceFileMeta.invalid })}</span>
              )}
            </p>
          </div>
        )}

        {v.audienceType === "manual" && (
          <div className="mt-3 space-y-2">
            <p className="text-xs text-muted-foreground">
              {t("recipients.numbersFound", { count: (v.manualRecipients || []).length })}
            </p>
            {(v.manualRecipients || []).map((row, index) => (
              <div key={`${row.phoneNumber}-${index}`} className="rounded-xl border border-border px-3 py-2 text-sm">
                <span className="font-bold" dir="ltr">{row.phoneNumber}</span>
                {row.name && <span className="ms-2 text-muted-foreground">{row.name}</span>}
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="rounded-xl border border-border p-4">
        <p className="mb-2 text-xs font-black uppercase tracking-widest text-muted-foreground">{t("review.template")}</p>
        {v.whatsapp?.templateData ? (
          <div className="max-w-[360px]">
            <TemplatePreview template={{...v.whatsapp.templateData, ...(v.whatsapp.headerUrl ? { headerUrl: v.whatsapp.headerUrl } : {})}} flat forceShowExamples />
          </div>
        ) : (
          <p className="text-sm">{empty}</p>
        )}
      </div>
    </div>
  );
}
