"use client";

import { useMemo, useState } from "react";
import { useTranslations } from "next-intl";
import { Check } from "lucide-react";
import { Label } from "@/components/ui/label";
import VariableInput from "@/components/ui/VariableInput";
import Button_ from "@/components/atoms/Button";
import { InternalTemplateDialog } from "@/app/[locale]/whatsapp/atoms/InternalTemplateDialog";
import TemplatePreview from "@/app/[locale]/whatsapp/atoms/TemplatePreview";
import MediaUpload from "@/app/[locale]/whatsapp/atoms/MediaUpload";
import LocationFields from "@/app/[locale]/whatsapp/atoms/chats/LocationFields";
import { extractVariableNames } from "@/utils/whatsapp-healper";
import { campaignTemplateChipPreview, getCampaignPlaceholderChips } from "../campaignPlaceholders";

function buildInitialWhatsapp(template, accountId) {
  const config = template.templateConfig || {};
  const paramFormat = template.templateConfig?.parameterFormat || config.parameterFormat;
  const headerVars = [...new Set(extractVariableNames(config.headerText, paramFormat))];
  const bodyVars = [...new Set(extractVariableNames(config.bodyText, paramFormat))];
  const headerVariables = {};
  headerVars.forEach((num) => {
    headerVariables[num] = { type: "direct", value: "", example: config.headerVariables?.[num] || "" };
  });
  const bodyVariables = {};
  bodyVars.forEach((num) => {
    bodyVariables[num] = { type: "direct", value: "", example: config.bodyVariables?.[num] || "" };
  });
  const buttonVariables = {};
  (config.buttons || []).forEach((btn, idx) => {
    if (btn.type === "VISIT_WEBSITE" && btn.urlType === "Dynamic") {
      buttonVariables[String(idx)] = { type: "Dynamic", buttonType: "url", value: "", label: btn.text || "", example: btn.url || "" };
    } else if (btn.type === "COPY_CODE") {
      buttonVariables[String(idx)] = { type: "COPY_CODE", buttonType: "copy_code", value: "", label: "Copy code", example: btn.example || "" };
    }
  });
  return {
    templateId: template.id,
    templateName: template.name,
    templateData: config,
    parameterFormat: paramFormat,
    headerVariables,
    bodyVariables,
    buttonVariables,
    locationData: config.headerType === "LOCATION" ? { latitude: 30.0444, longitude: 31.2357, name: "", address: "" } : null,
    headerUrl: config.headerUrl || "",
    headerFile: null,
    needsMedia: ["IMAGE", "VIDEO", "DOCUMENT"].includes(config.headerType),
    needsLocation: config.headerType === "LOCATION",
    headerType: config.headerType,
    accountId,
  };
}

export default function StepMessage({ watch, setValue }) {
  const t = useTranslations("campaigns.wizard");
  const accountId = watch("whatsappAccountId");
  const whatsapp = watch("whatsapp");
  const [dialogOpen, setDialogOpen] = useState(false);
  const customerVariables = useMemo(() => getCampaignPlaceholderChips(t), [t]);
  const variableProps = useMemo(
    () => ({
      disableHydrate: false,
      variables: customerVariables,
      popupTitle: t("message.placeholders.title"),
    }),
    [customerVariables, t],
  );

  const vars = useMemo(() => {
    if (!whatsapp?.templateData) return { header: [], body: [], buttons: [] };
    const fmt = whatsapp.parameterFormat;
    return {
      header: [...new Set(extractVariableNames(whatsapp.templateData.headerText, fmt))],
      body: [...new Set(extractVariableNames(whatsapp.templateData.bodyText, fmt))],
      buttons: Object.keys(whatsapp.buttonVariables || {}),
    };
  }, [whatsapp]);

  const updateWhatsapp = (patch) => {
    setValue("whatsapp", { ...(watch("whatsapp") || {}), ...patch }, { shouldDirty: true });
  };

  const updateVar = (group, key, value) => {
    const current = watch("whatsapp") || {};
    setValue(
      "whatsapp",
      { ...current, [group]: { ...(current[group] || {}), [key]: { ...(current[group]?.[key] || {}), value } } },
      { shouldDirty: true },
    );
  };

  const handleSelectTemplate = (template) => {
    const selectedAccountId = !!template?.selectedAccountId && !["all", null].includes(template?.selectedAccountId) ? template.selectedAccountId : template?.accountId;
    setValue("whatsappAccountId", selectedAccountId, { shouldDirty: true });
    updateWhatsapp(buildInitialWhatsapp({ ...template, accountId: selectedAccountId }, selectedAccountId));
    setDialogOpen(false);
  };

  return (
    <div className="space-y-4">
      <div className="rounded-xl border border-border p-4 space-y-3">
        {!whatsapp?.templateId ? (
          <div className="flex flex-col items-center gap-2 rounded-xl border border-dashed border-border p-6 text-center">
            <p className="text-sm font-semibold">{t("message.noTemplate")}</p>
            <Button_ size="sm" label={t("message.chooseTemplate")} onClick={() => setDialogOpen(true)} />
            {!accountId && <p className="text-xs text-muted-foreground">{t("message.account")}</p>}
          </div>
        ) : (
          <div className="flex items-center justify-between gap-3 rounded-xl border border-primary/20 bg-primary/5 p-3">
            <div className="flex items-center gap-3 min-w-0">
              <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-primary text-white">
                <Check size={18} />
              </span>
              <div className="min-w-0">
                <p className="truncate text-sm font-bold">{whatsapp.templateName}</p>
                <p className="text-[11px] text-muted-foreground">{whatsapp.headerType || ""}</p>
              </div>
            </div>
            <Button_ size="sm" variant="outline" label={t("message.changeTemplate")} onClick={() => setDialogOpen(true)} />
          </div>
        )}
      </div>

      {whatsapp?.templateId && (
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-4">
          <div className="space-y-4 rounded-xl border border-border p-4">
            <p className="text-xs font-black uppercase tracking-widest text-muted-foreground">{t("message.fillVariables")}</p>
            {whatsapp.needsMedia && (
              <div className="space-y-2">
                <Label>{t("message.mediaHeader")}</Label>
                <MediaUpload
                  type={whatsapp.headerType}
                  url={whatsapp.headerUrl}
                  accountId={accountId}
                  onUrlChange={() => updateWhatsapp({ headerUrl: "", headerFile: null })}
                  onFileChange={(e) => {
                    const file = e.target.files?.[0];
                    if (!file) return;
                    updateWhatsapp({ headerFile: file, headerUrl: URL.createObjectURL(file) });
                    e.target.value = "";
                  }}
                />
              </div>
            )}
            {whatsapp.needsLocation && (
              <div className="space-y-2">
                <Label>{t("message.locationHeader")}</Label>
                <LocationFields
                  values={whatsapp.locationData || {}}
                  onChange={(updates) => updateWhatsapp({ locationData: { ...(whatsapp.locationData || {}), ...updates } })}
                />
              </div>
            )}
            {vars.header.length > 0 && (
              <div className="space-y-3 rounded-xl bg-muted/30 p-3">
                <p className="text-[11px] font-black uppercase tracking-widest text-muted-foreground">
                  {t("message.header")}
                </p>
                {vars.header.map((num) => (
                  <div key={`h-${num}`} className="space-y-2">
                    <Label>{`{{${num}}}`}</Label>
                    <VariableInput
                      value={whatsapp.headerVariables?.[num]?.value || ""}
                      onChange={(value) => updateVar("headerVariables", num, value)}
                      placeholder={whatsapp.headerVariables?.[num]?.example || ""}
                      {...variableProps}
                    />
                  </div>
                ))}
              </div>
            )}
            {vars.body.length > 0 && (
              <div className="space-y-3 rounded-xl bg-muted/30 p-3">
                <p className="text-[11px] font-black uppercase tracking-widest text-muted-foreground">
                  {t("message.body")}
                </p>
                {vars.body.map((num) => (
                  <div key={`b-${num}`} className="space-y-2">
                    <Label>{`{{${num}}}`}</Label>
                    <VariableInput
                      value={whatsapp.bodyVariables?.[num]?.value || ""}
                      onChange={(value) => updateVar("bodyVariables", num, value)}
                      placeholder={whatsapp.bodyVariables?.[num]?.example || ""}
                      {...variableProps}
                    />
                  </div>
                ))}
              </div>
            )}
            {vars.buttons.length > 0 && (
              <div className="space-y-3 rounded-xl bg-muted/30 p-3">
                <p className="text-[11px] font-black uppercase tracking-widest text-muted-foreground">
                  {t("message.buttons")}
                </p>
                {vars.buttons.map((idx) => {
                  const btnName =
                    whatsapp.buttonVariables?.[idx]?.label ||
                    whatsapp.templateData?.buttons?.[Number(idx)]?.text ||
                    `#${idx}`;
                  return (
                    <div key={`btn-${idx}`} className="space-y-2">
                      <Label>{btnName}</Label>
                      <VariableInput
                        value={whatsapp.buttonVariables?.[idx]?.value || ""}
                        onChange={(value) => {
                          const next = String(value || "");
                          updateVar(
                            "buttonVariables",
                            idx,
                            /\{\{/.test(next) ? next : next.replace(/\s/g, "_"),
                          );
                        }}
                        placeholder={whatsapp.buttonVariables?.[idx]?.example || ""}
                        {...variableProps}
                      />
                    </div>
                  );
                })}
              </div>
            )}
            {!vars.header.length && !vars.body.length && !vars.buttons.length && !whatsapp.needsMedia && !whatsapp.needsLocation && (
              <p className="text-xs text-muted-foreground">—</p>
            )}
          </div>
          <div className="rounded-xl border border-border bg-muted/30 p-4">
            <p className="mb-3 text-center text-[11px] font-bold uppercase tracking-widest text-muted-foreground">
              {t("message.preview")}
            </p>
            <TemplatePreview
              {...campaignTemplateChipPreview(whatsapp, { chipVariables: customerVariables })}
              flat
            />
          </div>
        </div>
      )}

      <InternalTemplateDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        onSelectTemplate={handleSelectTemplate}
        defaultAccountId={accountId}
      />
    </div>
  );
}
