"use client";

import React from "react";
import { PlusCircle, Trash2, Smile, Bold, Italic, Strikethrough, Code, Info } from "lucide-react";
import { cn } from "@/utils/cn";
import { Label } from "@/components/ui/label";
import { useTranslations } from "next-intl";
import WhatsAppMessageBodyBuilder from "./WhatsAppMessageBodyBuilder";
import MediaUpload from "@/app/[locale]/whatsapp/atoms/MediaUpload";
import { VariableInput } from "@/components/ui/VariableInput";

export default function InteractiveMessageBuilder({
  value,
  onChange,
  errors = {},
  setHeaderMediaFile,
  config = {
    minButtons: 1,
    maxButtons: 3,
    headerTypes: ["NONE", "TEXT", "IMAGE", "VIDEO", "DOCUMENT"],
    allowVariables: false,
    buttonStyles: [] // e.g. ["emerald", "red"]
  },
  accountId,
  variableProps = {}
}) {
  const t = useTranslations("upsells.builder");
  
  const {
    headerType = "NONE",
    headerText = "",
    headerUrl = "",
    bodyText = "",
    footerText = "",
    buttons = []
  } = value || {};
  
  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setHeaderMediaFile?.(file);
      const url = URL.createObjectURL(file);
      onChange({ ...value, headerUrl: url });
    }
    e.target.value = "";
  };


  const handleUpdate = (updates) => {
    onChange({ ...value, ...updates });
  };

  const handleAddButton = () => {
    if (buttons.length >= config.maxButtons) return;
    handleUpdate({
      buttons: [...buttons, { text: "" }]
    });
  };

  const handleRemoveButton = (idx) => {
    const next = [...buttons];
    next.splice(idx, 1);
    handleUpdate({ buttons: next });
  };

  const handleButtonChange = (idx, text) => {
    const next = [...buttons];
    next[idx] = { ...next[idx], text };
    handleUpdate({ buttons: next });
  };

  const addEmoji = (emoji) => {
    handleUpdate({ bodyText: (bodyText || "") + emoji.native });
  };

  return (
    <div className="space-y-8">
      {/* Header Settings */}
      {config.headerTypes.length > 0 && (
        <div className="space-y-4">
          <Label className="text-base font-bold flex items-center gap-2">
            {t("header")}
            <span className="text-slate-400 text-sm font-normal">({t("optional")})</span>
          </Label>
          <div className="flex flex-wrap gap-2">
            {config.headerTypes.map((type) => (
              <button
                key={type}
                type="button"
                onClick={() => {
                  setHeaderMediaFile?.(null);
                  handleUpdate({ headerType: type, headerText: "", headerUrl: "" });
                }}
                className={cn(
                  "px-4 py-2 rounded-lg text-sm font-medium transition-colors border",
                  headerType === type
                    ? "bg-primary text-white border-primary shadow-md shadow-primary/20"
                    : "bg-white dark:bg-slate-950 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800"
                )}
              >
                {t(`headerTypes.${type}`)}
              </button>
            ))}
          </div>

          {headerType === "TEXT" && (
            <div className="pt-2 space-y-2">
              <VariableInput
                name="headerText"
                placeholder={t("headerPlaceholder")}
                maxLength={60}
                value={headerText}
                onChange={(val) => handleUpdate({ headerText: val })}
                error={errors.headerText}
                {...variableProps}
              />
              {errors.headerText && <p className="text-[11px] text-red-500">{errors.headerText.message || errors.headerText}</p>}
            </div>
          )}

          {["IMAGE", "VIDEO", "DOCUMENT"].includes(headerType) && (
            <div className="space-y-2">
              <MediaUpload
                type={headerType}
                url={headerUrl}
                accountId={accountId}
                onUrlChange={(url) => {
                  if(!url) {
                    setHeaderMediaFile?.(null);
                  }
                  handleUpdate({ headerUrl: url })
                }}
                onFileChange={(file) => handleFileChange(file)}
              />
              {errors.headerUrl && <p className="text-[11px] text-red-500">{errors.headerUrl.message || errors.headerUrl}</p>}
            </div>
          )}
        </div>
      )}

      {/* Body Settings */}
      <WhatsAppMessageBodyBuilder
        value={bodyText}
        onChange={(val) => handleUpdate({ bodyText: val })}
        label={t("body")}
        placeholder={t("bodyPlaceholder")}
        allowVariables={config.allowVariables}
        error={errors.bodyText?.message || errors.bodyText}
        variableProps={variableProps}
      />

      {/* Footer Settings */}
      <div className="space-y-3">
        <Label className="text-base font-bold">{t("footer")} <span className="text-slate-400 text-sm font-normal">({t("optional")})</span></Label>
        <div className="space-y-2">
          <VariableInput
            name="footerText"
            placeholder={t("footerPlaceholder")}
            maxLength={60}
            value={footerText}
            onChange={(val) => handleUpdate({ footerText: val })}
            {...variableProps}
            error={errors.footerText}
          />
          {errors.footerText && <p className="text-[11px] text-red-500">{errors.footerText.message || errors.footerText}</p>}
        </div>
      </div>

      {/* Buttons Settings */}
      <div className="space-y-4">
        <div className="flex justify-between items-center">
          <Label className="text-base font-bold">{t("buttons")} <span className="text-red-500">*</span></Label>
          <span className="text-xs font-bold text-primary bg-primary/5 px-2 py-1 rounded-full">
            {buttons.length} / {config.maxButtons}
          </span>
        </div>

        <div className="space-y-3">
          {buttons.map((btn, idx) => {
            const btnStyle = config.buttonStyles?.[idx];
            const borderClass = btnStyle === "emerald" ? "border-emerald-500" : btnStyle === "red" ? "border-red-500" : "";
            const btnError = errors.buttons?.[idx]?.text;
            
            return (
              <div key={idx} className="flex items-center gap-2 group">
                <div className="flex-1 space-y-2">
                  <div className={cn("relative border-s-4 rounded-md", borderClass)}>
                    <VariableInput
                      name={`button-${idx}`}
                      placeholder={t("buttonPlaceholder")}
                      maxLength={20}
                      value={btn.text}
                      onChange={(val) => handleButtonChange(idx, val)}
                      // {...variableProps}
                      error={btnError}
                      className="h-11"
                    />
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[10px] text-slate-400">
                      {btn.text?.length || 0}/20
                    </span>
                  </div>
                  {btnError && <p className="text-[11px] text-red-500">{btnError.message || btnError}</p>}
                </div>
                {buttons.length > config.minButtons && (
                  <button
                    type="button"
                    onClick={() => handleRemoveButton(idx)}
                    className="p-2.5 text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/30 rounded-lg transition-all self-start mt-1"
                  >
                    <Trash2 size={20} />
                  </button>
                )}
              </div>
            );
          })}
          {errors.buttons && !Array.isArray(errors.buttons) && <p className="text-xs text-red-500 mt-1">{errors.buttons.message || errors.buttons}</p>}
          {buttons.length < config.maxButtons && (
            <button
              type="button"
              onClick={handleAddButton}
              className="w-full py-3 border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-xl text-slate-500 hover:border-primary hover:text-primary hover:bg-primary/5 transition-all flex items-center justify-center gap-2 font-bold text-sm"
            >
              <PlusCircle size={18} />
              {t("addButton")}
            </button>
          )}
        </div>  
      </div>
    </div>
  );
}
