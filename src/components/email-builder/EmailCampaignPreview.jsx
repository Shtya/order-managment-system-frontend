"use client";

import { useEffect, useMemo, useState } from "react";
import { Monitor, Smartphone } from "lucide-react";
import { useTranslations } from "next-intl";
import api from "@/utils/api";
import { cn } from "@/utils/cn";
import { CAMPAIGN_PREVIEW_VALUES, getCampaignPlaceholderChips } from "@/app/[locale]/campaigns/atoms/campaignPlaceholders";
import { VariablePreviewText } from "@/components/ui/VariableChip";
import { emailContentPayload } from "./document";
import { InboxPreview } from "./EmailEnvelope";
import { EmailClientFrame } from "./parts";

export default function EmailCampaignPreview({ email }) {
  const t = useTranslations("emailBuilder");
  const tw = useTranslations("campaigns.wizard");
  const variables = useMemo(() => getCampaignPlaceholderChips(tw), [tw]);
  const [account, setAccount] = useState(null);
  const [preview, setPreview] = useState(null);
  const [error, setError] = useState("");
  const [mobile, setMobile] = useState(false);

  useEffect(() => {
    let active = true;
    setPreview(null);
    setError("");

    api
      .post("/email/content/preview", emailContentPayload(email, CAMPAIGN_PREVIEW_VALUES))
      .then((previewResponse) => {
        if (!active) return;
        setPreview(previewResponse.data);
      })
      .catch((requestError) => {
        if (active)
          setError(requestError.response?.data?.message || t("feedback.loadError"));
      });

    api
      .get("/email/accounts")
      .then(({ data }) => {
        if (active)
          setAccount((data || []).find((item) => item.id === email?.accountId) || null);
      })
      .catch(() => {
        if (active) setAccount(null);
      });

    return () => {
      active = false;
    };
  }, [email, t]);

  return (
    <div className="space-y-5">
      <InboxPreview
        email={email || {}}
        accounts={account ? [account] : []}
        samples={CAMPAIGN_PREVIEW_VALUES}
      />

      <div className="rounded-xl border border-border p-4">
        <div className="mb-3 flex items-center justify-between gap-3">
          <div>
            <p className="text-xs font-black uppercase tracking-widest text-muted-foreground">
              {t("review.previewTitle")}
            </p>
            <p className="text-xs text-muted-foreground">{t("review.previewHint")}</p>
          </div>
          <div className="inline-flex rounded-xl border border-border p-0.5">
            {[[false, Monitor], [true, Smartphone]].map(([isMobile, Icon]) => (
              <button
                key={String(isMobile)}
                type="button"
                aria-pressed={mobile === isMobile}
                onClick={() => setMobile(isMobile)}
                className={cn(
                  "grid h-7 w-9 place-items-center rounded-lg text-muted-foreground",
                  mobile === isMobile && "bg-primary/10 text-primary",
                )}
              >
                <Icon className="h-3.5 w-3.5" />
              </button>
            ))}
          </div>
        </div>

        {error ? (
          <p role="alert" className="rounded-lg bg-red-50 px-3 py-2 text-xs text-red-600 dark:bg-red-500/10">
            {error}
          </p>
        ) : !preview ? (
          <div className="h-[560px] animate-pulse rounded-xl bg-muted/50" />
        ) : (
          <div className="rounded-xl bg-muted/50 p-4">
            <EmailClientFrame
              title={t("preview.preview")}
              subject={
                <VariablePreviewText
                  text={email?.subject || preview.subject}
                  variables={variables}
                  values={CAMPAIGN_PREVIEW_VALUES}
                />
              }
              senderName={account?.senderName || account?.email || ""}
              senderEmail={account?.email || ""}
              html={preview.html}
              mobile={mobile}
            />
          </div>
        )}
      </div>
    </div>
  );
}
