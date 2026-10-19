"use client";
import { Inbox, Plus, RefreshCw } from "lucide-react";
import { cn } from "@/utils/cn";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useMemo } from "react";
import { useTranslations } from "next-intl";
import { VariableInput } from "@/components/ui/VariableInput";
import { VariablePreviewText } from "@/components/ui/VariableChip";
import { getCampaignPlaceholderChips } from "@/app/[locale]/campaigns/atoms/campaignPlaceholders";
import { Field, SectionTitle } from "./parts";
import { Link } from "@/i18n/navigation";

const STATUS_TONES = {
  connected: "bg-emerald-50 text-emerald-600 dark:bg-emerald-500/10",
  reconnect_required: "bg-amber-50 text-amber-600 dark:bg-amber-500/10",
  suspended: "bg-red-50 text-red-600 dark:bg-red-500/10",
};
export function accountStatusLabel(t, status) {
  return (
    {
      connected: t("envelope.statusConnected"),
      reconnect_required: t("envelope.statusReconnect"),
      suspended: t("envelope.statusSuspended"),
    }[status] || t("envelope.statusDisconnected")
  );
}
function StatusBadge({ status }) {
  const t = useTranslations("emailBuilder");
  return (
    <span
      className={cn(
        "inline-flex h-5 shrink-0 items-center gap-1 rounded-full px-2 text-[10.5px] font-semibold",
        STATUS_TONES[status] || "bg-muted text-muted-foreground",
      )}
    >
      <span className="h-1.5 w-1.5 rounded-full bg-current" />
      {accountStatusLabel(t, status)}
    </span>
  );
}

function EnvelopeInput({ id, value, maxLength, onChange, variables, popupTitle }) {
  if (variables) {
    return (
      <VariableInput
        id={id}
        value={value || ""}
        maxLength={maxLength}
        onChange={onChange}
        variables={variables}
        popupTitle={popupTitle}
        placeholder=""
      />
    );
  }
  return (
    <Input
      id={id}
      value={value || ""}
      maxLength={maxLength}
      onChange={(event) => onChange(event.target.value)}
    />
  );
}

export function GmailIcon() {
  return (
    <svg viewBox="0 0 48 48" className="h-5 w-5 shrink-0" aria-hidden="true">
      <path fill="#4caf50" d="M45 16.2l-5 2.75-5 4.75V40h7c1.657 0 3-1.343 3-3V16.2z" />
      <path fill="#1e88e5" d="M3 16.2l3.614 1.71L13 23.7V40H6c-1.657 0-3-1.343-3-3V16.2z" />
      <polygon fill="#e53935" points="35,11.2 24,19.45 13,11.2 12,17 13,23.7 24,31.95 35,23.7 36,17" />
      <path fill="#c62828" d="M3 12.298V16.2l10 7.5V11.2L9.876 8.859C9.132 8.301 8.228 8 7.298 8h0C4.924 8 3 9.924 3 12.298z" />
      <path fill="#fbc02d" d="M45 12.298V16.2l-10 7.5V11.2l3.124-2.341C38.868 8.301 39.772 8 40.702 8h0C43.076 8 45 9.924 45 12.298z" />
    </svg>
  );
}

export default function EmailEnvelope({
  email,
  patchEmail,
  accounts,
  status,
  samples,
  continuation,
  onConnect,
  errors,
  onClearError,
}) {
  const t = useTranslations("emailBuilder");
  const tw = useTranslations("campaigns.wizard");
  const chips = useMemo(() => getCampaignPlaceholderChips(tw), [tw]);
  const popupTitle = tw("message.placeholders.title");
  const account = accounts.find((a) => a.id === email.accountId);
  const senderName = account?.senderName || account?.email || "—";
  return (
    <div>
      <div className="space-y-4 rounded-xl border border-border p-4">
        <SectionTitle>{t("envelope.envelope")}</SectionTitle>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <Field
            label={t("envelope.sender")}
            description={t("descriptions.sender")}
            error={errors?.accountId?.message ? tw(errors.accountId.message) : ""}
          >
            <div className="flex gap-2">
              <Select
                value={email.accountId || undefined}
                onValueChange={(accountId) => {
                  const selected = accounts.find((item) => item.id === accountId);
                  onClearError?.("accountId");
                  patchEmail({ accountId, accountStatus: selected?.status || null });
                }}
              >
                <SelectTrigger aria-label={t("envelope.sender")} className="flex-1">
                  <SelectValue placeholder={t("envelope.senderPlaceholder")}>
                    {account && (
                      <span className="flex min-w-0 items-center gap-2">
                        <span className="truncate" dir="ltr">
                          {account.email}
                        </span>
                        <GmailIcon />
                        <StatusBadge status={account.status} />
                      </span>
                    )}
                  </SelectValue>
                </SelectTrigger>
                <SelectContent>
                  {accounts.map((a) => (
                    <SelectItem key={a.id} value={a.id}>
                      <span className="flex min-w-0 items-center gap-2">
                        <span className="truncate" dir="ltr">
                          {a.email}
                        </span>
                        <GmailIcon />
                        <StatusBadge status={a.status} />
                      </span>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <button
                type="button"
                className="btn btn-md btn-ghost !px-3"
                aria-label={t("envelope.reconnect")}
                title={t("envelope.reconnect")}
                disabled={!email.accountId}
                onClick={() => onConnect(true)}
              >
                <RefreshCw size={16} />
              </button>
            </div>
            {!accounts.length && (
              <p className="text-[11px] text-muted-foreground">{t("envelope.noAccounts")}</p>
            )}
            <div className="flex flex-wrap items-center gap-3">
              <button
                type="button"
                className="inline-flex items-center gap-1.5 text-xs font-semibold text-primary hover:underline"
                onClick={() => onConnect(false)}
              >
                <Plus size={14} />
                {accounts.length ? t("envelope.connectAnother") : t("envelope.connect")}
              </button>
              {continuation && (
                <a
                  href={continuation}
                  className="text-xs font-semibold text-primary underline"
                >
                  {t("envelope.continue")}
                </a>
              )}
              <Link
                href="/privacy"
                target="_blank"
                className="text-xs font-semibold text-muted-foreground underline underline-offset-2 hover:text-primary"
              >
                {t("envelope.privacy")}
              </Link>
            </div>
          </Field>
          <Field
            id="email-identity"
            label={t("envelope.identity")}
            description={t("envelope.identityHint")}
            error={errors?.businessIdentity?.message ? tw(errors.businessIdentity.message) : ""}
          >
            <EnvelopeInput
              id="email-identity"
              maxLength={1000}
              value={email.businessIdentity}
              onChange={(businessIdentity) => {
                onClearError?.("businessIdentity");
                patchEmail({ businessIdentity });
              }}
            />
          </Field>
        </div>
        <Field
          id="email-subject"
          label={t("envelope.subject")}
          
          description={t("descriptions.subject")}
          counter={`${(email.subject || "").length} / 200`}
          error={errors?.subject?.message ? tw(errors.subject.message) : ""}
        >
          <EnvelopeInput
            id="email-subject"
            variables={chips}
            popupTitle={popupTitle}
            maxLength={200}
            value={email.subject}
            onChange={(subject) => {
              onClearError?.("subject");
              patchEmail({ subject });
            }}
          />
        </Field>
        <Field
          id="email-preheader"
          label={
            <>
              {t("envelope.preheader")}
            </>
          }
          counter={`${(email.preheader || "").length} / 300`}
          description={t("envelope.preheaderHint")}
        >
          <EnvelopeInput
            id="email-preheader"
            variables={chips}
            popupTitle={popupTitle}
            maxLength={300}
            value={email.preheader}
            onChange={(preheader) => patchEmail({ preheader })}
          />
        </Field>
      </div>
    </div>
  );
}

export function InboxPreview({ email, accounts, samples }) {
  const t = useTranslations("emailBuilder");
  const tw = useTranslations("campaigns.wizard");
  const chips = useMemo(() => getCampaignPlaceholderChips(tw), [tw]);
  const account = accounts.find((a) => a.id === email.accountId);
  const senderName = account?.senderName || account?.email || "";
  return (
    <div className="space-y-3 rounded-xl border border-border bg-card p-4">
      <SectionTitle className="text-center">{t("inboxPreview.inboxPreview")}</SectionTitle>
      <div className="overflow-hidden rounded-xl border border-border bg-card">
        <div className="flex items-center gap-2 border-b border-border bg-muted/40 px-3.5 py-2.5 text-xs text-muted-foreground">
          <Inbox size={14} />
          {t("inboxPreview.inboxPrimary")}
        </div>
        <div className="grid grid-cols-[40px_1fr_auto] items-start gap-3 border-b border-border p-3.5 opacity-55">
          <span className="grid h-10 w-10 place-items-center rounded-full bg-muted-foreground text-[15px] font-semibold text-white">A</span>
          <div className="min-w-0">
            <p className="truncate text-[13.5px] font-semibold">{t("inboxPreview.otherSender")}</p>
            <p className="truncate text-[13px] font-medium">{t("inboxPreview.otherEmail")}</p>
          </div>
        </div>
        <div className="relative grid grid-cols-[40px_1fr_auto] items-start gap-3 border-b border-border bg-primary/10 p-3.5">
          <span className="absolute inset-y-0 start-0 w-[3px] bg-primary" />
          <span className="grid h-10 w-10 place-items-center rounded-full bg-primary text-[15px] font-semibold text-white">{senderName[0]?.toUpperCase()}</span>
          <div className="min-w-0">
            <p className="truncate text-[13.5px] font-semibold">{senderName}</p>
            <p className="truncate text-[13px] font-medium" dir="auto">
              {email.subject ? <VariablePreviewText text={email.subject} variables={chips} values={samples} /> : "\u2026"}
            </p>
            <p className="truncate text-[12.5px] text-muted-foreground" dir="auto">
              {email.preheader ? <VariablePreviewText text={email.preheader} variables={chips} values={samples} /> : "\u2026"}
            </p>
          </div>
          <div>
            <p className="whitespace-nowrap text-[11px] text-muted-foreground">{t("inboxPreview.now")}</p>
            <span className="ms-auto mt-2 block h-2 w-2 rounded-full bg-primary" aria-hidden="true" />
          </div>
        </div>
        <div className="grid grid-cols-[40px_1fr_auto] items-start gap-3 p-3.5 opacity-55">
          <span className="grid h-10 w-10 place-items-center rounded-full bg-muted-foreground text-[15px] font-semibold text-white">B</span>
          <div className="min-w-0">
            <p className="truncate text-[13.5px] font-semibold">{t("inboxPreview.otherSender")}</p>
            <p className="truncate text-[13px] font-medium">{t("inboxPreview.otherEmail")}</p>
          </div>
        </div>
      </div>
    </div>
  );
}
