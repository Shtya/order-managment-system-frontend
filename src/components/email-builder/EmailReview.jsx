"use client";
import { useEffect, useMemo, useState } from "react";
import { Monitor, Smartphone } from "lucide-react";
import { useTranslations } from "next-intl";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/utils/cn";
import api from "@/utils/api";
import { combineScheduledAt } from "@/app/[locale]/campaigns/atoms/wizard/wizardSchema";
import { emailContentPayload } from "./document";
import { EmailClientFrame } from "./parts";
import { GmailIcon, InboxPreview } from "./EmailEnvelope";
import { VariablePreviewText } from "@/components/ui/VariableChip";
import {
  CAMPAIGN_PREVIEW_VALUES,
  getCampaignPlaceholderChips,
} from "@/app/[locale]/campaigns/atoms/campaignPlaceholders";

const TITLE =
  "mb-2 text-xs font-black uppercase tracking-widest text-muted-foreground";
const previewValues = CAMPAIGN_PREVIEW_VALUES;

export default function EmailReview({ getValues }) {
  const values = getValues();
  const tw = useTranslations("campaigns.wizard");
  const t = useTranslations("emailBuilder");
  const variables = useMemo(() => getCampaignPlaceholderChips(tw), [tw]);
  const [html, setHtml] = useState("");
  const [subject, setSubject] = useState(values.email?.subject || "");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const [mobile, setMobile] = useState(false);
  const [account, setAccount] = useState(null);
  const empty = tw("review.empty");

  useEffect(() => {
    let live = true;
    api
      .post(
        "/email/content/preview",
        emailContentPayload(values.email, previewValues),
      )
      .then(({ data }) => {
        if (!live) return;
        setHtml(data.html);
        if (data.subject) setSubject(data.subject);
      })
      .catch((e) => {
        if (live) setError(e.response?.data?.message || t("feedback.loadError"));
      })
      .finally(() => live && setLoading(false));
    api
      .get("/email/accounts")
      .then(({ data }) => {
        if (live)
          setAccount(data.find((a) => a.id === values.email?.accountId) || null);
      })
      .catch(() => {});
    return () => {
      live = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const audience =
    values.audienceType === "manual"
      ? `${tw("recipients.manual")} (${values.manualRecipients?.length || 0})`
      : tw(`recipients.${values.audienceType}`);
  const schedule =
    values.scheduleMode === "scheduled"
      ? combineScheduledAt(values.scheduledDate, values.scheduledTime) ||
        `${values.scheduledDate || ""} ${values.scheduledTime || ""}`
      : tw("scheduleNow");
  const rows = [
    [tw("name"), values.name],
    [t("envelope.sender"), account?.email || values.email?.accountId],
    [t("envelope.subject"), values.email?.subject],
    [t("envelope.identity"), values.email?.businessIdentity],
    [t("review.audience"), audience],
    [t("review.schedule"), schedule],
  ];

  return (
    <div className="space-y-4">
      <div>
        <h3 className="text-sm font-bold">{tw("review.title")}</h3>
        <p className="text-xs text-muted-foreground">{tw("review.subtitle")}</p>
      </div>

     
      <div className="rounded-xl border border-border p-4">
        <p className={TITLE}>{tw("review.general")}</p>
        <dl className="grid grid-cols-1 gap-x-4 gap-y-2 text-sm sm:grid-cols-[180px_1fr]">
          {rows.map(([label, val]) => (
            <div key={label} className="contents">
              <dt className="text-muted-foreground">{label}</dt>
              <dd className="break-words font-medium text-start">
                {label === t("envelope.sender") && account?.email ? (
                  <span className="inline-flex items-center gap-2" dir="ltr">
                    <GmailIcon />
                    {account.email}
                  </span>
                ) : label === t("envelope.subject") ? (
                  <VariablePreviewText
                    text={values.email?.subject}
                    variables={variables}
                    values={previewValues}
                  />
                ) : (
                  <span dir="auto">{String(val || empty)}</span>
                )}
              </dd>
            </div>
          ))}
        </dl>
        <Badge variant="outline" className="mt-3">
          {tw("channels.email")}
        </Badge>
      </div>
      
       <InboxPreview
        email={values.email || {}}
        accounts={account ? [account] : []}
        samples={previewValues}
      />


      <div className="rounded-xl border border-border p-4">
        <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
          <div>
            <p className="text-xs font-black uppercase tracking-widest text-muted-foreground">
              {t("review.previewTitle")}
            </p>
            <p className="text-xs text-muted-foreground">{t("review.previewHint")}</p>
          </div>
          <div className="inline-flex rounded-xl border border-border p-0.5">
            {[
              [false, Monitor],
              [true, Smartphone],
            ].map(([isMobile, Icon]) => (
              <button
                key={String(isMobile)}
                type="button"
                aria-pressed={mobile === isMobile}
                onClick={() => setMobile(isMobile)}
                className={cn(
                  "grid h-7 w-9 place-items-center rounded-lg text-muted-foreground transition",
                  mobile === isMobile && "bg-primary/10 text-primary",
                )}
              >
                <Icon className="h-3.5 w-3.5" />
              </button>
            ))}
          </div>
        </div>
        {error && (
          <p
            role="alert"
            className="mb-3 rounded-lg bg-red-50 px-3 py-2 text-xs text-red-600 dark:bg-red-500/10"
          >
            {error}
          </p>
        )}
        {loading && !error ? (
          <div className="h-[560px] animate-pulse rounded-xl bg-muted/50" />
        ) : (
          !error && (
            <div className="rounded-xl bg-muted/50 p-4">
              <EmailClientFrame
                title={t("preview.preview")}
                subject={
                  <VariablePreviewText
                    text={values.email?.subject || subject}
                    variables={variables}
                    values={previewValues}
                  />
                }
                senderName={account?.senderName || account?.email || ""}
                senderEmail={account?.email || ""}
                html={html}
                mobile={mobile}
              />
            </div>
          )
        )}
      </div>
    </div>
  );
}
