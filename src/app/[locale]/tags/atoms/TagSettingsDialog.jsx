"use client";

import React from "react";
import { Loader2, Settings2 } from "lucide-react";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useOrdersSettings } from "@/hook/useOrdersSettings";

export function TagSettingsFields({ settings, patch, target = "order", ns = "tags" }) {
  const t = useTranslations(ns);
  const isClient = target === "client";
  const modeKey = isClient ? "clientTagMode" : "orderTagMode";
  const enabledKey = isClient ? "clientTagAutomationsEnabled" : "tagAutomationsEnabled";
  const removeKey = isClient
    ? "clientTagAutomationsRemoveUnmatched"
    : "tagAutomationsRemoveUnmatched";

  return (
    <div className="space-y-4">
      <div className="space-y-1.5">
        <Label className="text-sm font-medium">{t("settings.modeTitle")}</Label>
        <Select
          value={settings?.[modeKey] || "many"}
          onValueChange={(value) => patch({ [modeKey]: value })}
        >
          <SelectTrigger className="h-10 rounded-xl">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="many" description={t("settings.manyDescription")}>
              {t("settings.many")}
            </SelectItem>
            <SelectItem value="one" description={t("settings.oneDescription")}>
              {t("settings.one")}
            </SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-1.5">
        <Label className="text-sm font-medium">{t("settings.automationsTitle")}</Label>
        <Select
          value={settings?.[enabledKey] === false ? "false" : "true"}
          onValueChange={(value) => patch({ [enabledKey]: value === "true" })}
        >
          <SelectTrigger className="h-10 rounded-xl">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="true" description={t("settings.automationsOnDescription")}>
              {t("settings.automationsOn")}
            </SelectItem>
            <SelectItem value="false" description={t("settings.automationsOffDescription")}>
              {t("settings.automationsOff")}
            </SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-1.5">
        <Label className="text-sm font-medium">{t("settings.removeUnmatchedTitle")}</Label>
        <Select
          value={settings?.[removeKey] === false ? "false" : "true"}
          onValueChange={(value) => patch({ [removeKey]: value === "true" })}
        >
          <SelectTrigger className="h-10 rounded-xl">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="true" description={t("settings.removeUnmatchedOnDescription")}>
              {t("settings.removeUnmatchedOn")}
            </SelectItem>
            <SelectItem value="false" description={t("settings.removeUnmatchedOffDescription")}>
              {t("settings.removeUnmatchedOff")}
            </SelectItem>
          </SelectContent>
        </Select>
      </div>
    </div>
  );
}

export function TagSettingsDialog({ open, onOpenChange, target = "order", ns = "tags" }) {
  const t = useTranslations(ns);
  const tCommon = useTranslations("common");
  const { tempSettings, patch, saving, handleSave } = useOrdersSettings();

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg p-0 overflow-hidden rounded-3xl border-none shadow-2xl bg-white dark:bg-slate-900">
        <DialogHeader className="p-6 border-b dark:border-slate-800">
          <DialogTitle className="text-xl font-bold flex items-center gap-2">
            <Settings2 className="text-primary" />
            {t("settings.title")}
          </DialogTitle>
        </DialogHeader>

        <div className="p-6 space-y-5">
          <TagSettingsFields
            settings={tempSettings}
            patch={patch}
            target={target}
            ns={ns}
          />

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
