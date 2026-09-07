"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { Plus, Trash2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";

import { normalizeAnyPhone } from "./FileUpload";

export default function ManualRecipients({ watch, setValue }) {
  const t = useTranslations("campaigns.wizard");
  const list = watch("manualRecipients") || [];
  const [phone, setPhone] = useState("");
  const [name, setName] = useState("");
  const [error, setError] = useState("");

  const add = () => {
    const normalized = normalizeAnyPhone(phone);
    if (!normalized) {
      setError(t("recipients.invalidPhone"));
      return;
    }
    if (list.some((r) => r.phoneNumber === normalized)) {
      setError(t("recipients.duplicatePhone"));
      return;
    }
    setError("");
    setValue("manualRecipients", [...list, { phoneNumber: normalized, name: name.trim() || null }], {
      shouldDirty: true,
    });
    setPhone("");
    setName("");
  };

  const remove = (index) => {
    setValue(
      "manualRecipients",
      list.filter((_, i) => i !== index),
      { shouldDirty: true },
    );
  };

  return (
    <div className="space-y-3 rounded-xl border border-border p-4">
      <div className="grid grid-cols-1 md:grid-cols-[1fr_1fr_auto] gap-2">
        <div className="space-y-2">
          <Label>{t("recipients.phone")}</Label>
          <Input value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="2010xxxxxxxx" dir="ltr" />
        </div>
        <div className="space-y-2">
          <Label>{t("recipients.nameOptional")}</Label>
          <Input value={name} onChange={(e) => setName(e.target.value)} placeholder={t("recipients.namePlaceholder")} />
        </div>
        <div className="flex items-end">
          <Button type="button" variant="outline" size="sm" className="h-10 gap-1" onClick={add}>
            <Plus className="h-4 w-4" />
            {t("recipients.add")}
          </Button>
        </div>
      </div>
      {error && <p className="text-xs text-red-500">{error}</p>}
      <p className="text-xs text-muted-foreground">{t("recipients.manualHint")}</p>
      <div className="space-y-2">
        {list.map((row, index) => (
          <div key={`${row.phoneNumber}-${index}`} className="flex items-start gap-2">
            <div className="flex-1 rounded-xl border border-border px-3 py-2 text-sm">
              <span className="font-bold" dir="ltr">{row.phoneNumber}</span>
              {row.name && <span className="ms-2 text-muted-foreground">{row.name}</span>}
            </div>
            <Button
              type="button"
              variant="outline"
              size="icon"
              className="h-9 w-9 shrink-0 text-destructive hover:text-destructive"
              onClick={() => remove(index)}
              aria-label={t("recipients.remove")}
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        ))}
        {!list.length && <p className="text-xs text-muted-foreground">{t("recipients.noManual")}</p>}
      </div>
    </div>
  );
}
