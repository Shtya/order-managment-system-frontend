"use client";

import React from "react";
import { Loader2, Settings2, Tags, Workflow } from "lucide-react";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { FieldTooltip } from "@/components/ui/field-tooltip";
import { useOrdersSettings } from "@/hook/useOrdersSettings";

function RadioCard({ selected, onClick, title, description, hint }) {
  return (
    <div
      className={`flex items-center gap-3 p-4 rounded-xl border-2 cursor-pointer transition-all ${
        selected
          ? "border-primary bg-primary/5"
          : "border-slate-200 dark:border-slate-700"
      }`}
      onClick={onClick}
    >
      <div
        className="flex items-center justify-center w-5 h-5 rounded-full border-2 mr-2 transition-all"
        style={{ borderColor: selected ? "#6366f1" : "#d1d5db" }}
      >
        {selected && (
          <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: "#6366f1" }} />
        )}
      </div>
      <div className="flex-1">
        <div className="font-medium flex items-center gap-2">
          {title}
          <FieldTooltip description={hint} stopPropagation />
        </div>
        <div className="text-xs text-slate-500 dark:text-slate-400">{description}</div>
      </div>
    </div>
  );
}

export function TagSettingsDialog({ open, onOpenChange }) {
  const t = useTranslations("tags");
  const tCommon = useTranslations("common");
  const { tempSettings, patch, saving, handleSave } = useOrdersSettings();

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl p-0 overflow-hidden rounded-3xl border-none shadow-2xl bg-white dark:bg-slate-900">
        <DialogHeader className="p-6 border-b dark:border-slate-800">
          <DialogTitle className="text-xl font-bold flex items-center gap-2">
            <Settings2 className="text-primary" />
            {t("settings.title")}
          </DialogTitle>
        </DialogHeader>

        <div className="p-6 space-y-6">
          <div className="bg-white dark:bg-slate-950 border border-slate-100 dark:border-slate-800 rounded-2xl p-6 shadow-sm space-y-4">
            <h3 className="text-base font-bold flex items-center gap-2">
              <Tags className="text-primary" size={20} />
              {t("settings.modeTitle")}
            </h3>
            <div className="space-y-3">
              <RadioCard
                selected={tempSettings.orderTagMode === "many"}
                onClick={() => patch({ orderTagMode: "many" })}
                title={t("settings.many")}
                description={t("settings.manyDesc")}
                hint={t("settings.manyDescription")}
              />
              <RadioCard
                selected={tempSettings.orderTagMode === "one"}
                onClick={() => patch({ orderTagMode: "one" })}
                title={t("settings.one")}
                description={t("settings.oneDesc")}
                hint={t("settings.oneDescription")}
              />
            </div>
          </div>

          <div className="bg-white dark:bg-slate-950 border border-slate-100 dark:border-slate-800 rounded-2xl p-6 shadow-sm space-y-4">
            <h3 className="text-base font-bold flex items-center gap-2">
              <Workflow className="text-primary" size={20} />
              {t("settings.automationsTitle")}
            </h3>
            <div className="space-y-3">
              <RadioCard
                selected={tempSettings.tagAutomationsEnabled === true}
                onClick={() => patch({ tagAutomationsEnabled: true })}
                title={t("settings.automationsOn")}
                description={t("settings.automationsOnDesc")}
                hint={t("settings.automationsOnDescription")}
              />
              <RadioCard
                selected={tempSettings.tagAutomationsEnabled === false}
                onClick={() => patch({ tagAutomationsEnabled: false })}
                title={t("settings.automationsOff")}
                description={t("settings.automationsOffDesc")}
                hint={t("settings.automationsOffDescription")}
              />
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t dark:border-slate-800">
            <Button
              variant="outline"
              onClick={() => onOpenChange(false)}
              className="rounded-xl"
            >
              {tCommon("cancel")}
            </Button>
            <Button
              onClick={() => handleSave(() => onOpenChange(false))}
              disabled={saving}
              className="rounded-xl px-8"
            >
              {saving ? <Loader2 className="animate-spin" /> : tCommon("save")}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
