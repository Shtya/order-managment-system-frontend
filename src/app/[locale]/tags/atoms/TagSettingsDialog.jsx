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

export function TagSettingsDialog({ open, onOpenChange }) {
  const t = useTranslations("tags");
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
          <div className="space-y-1.5">
            <Label className="text-sm font-medium">{t("settings.modeTitle")}</Label>
            <Select
              value={tempSettings.orderTagMode || "many"}
              onValueChange={(value) => patch({ orderTagMode: value })}
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
              value={tempSettings.tagAutomationsEnabled === false ? "false" : "true"}
              onValueChange={(value) => patch({ tagAutomationsEnabled: value === "true" })}
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
              value={tempSettings.tagAutomationsRemoveUnmatched === false ? "false" : "true"}
              onValueChange={(value) =>
                patch({ tagAutomationsRemoveUnmatched: value === "true" })
              }
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
