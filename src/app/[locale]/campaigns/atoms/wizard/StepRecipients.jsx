"use client";

import { useTranslations } from "next-intl";
import { Puzzle, FileUp, PenLine, Filter } from "lucide-react";
import { cn } from "@/utils/cn";
import SegmentPicker from "./SegmentPicker";
import FileUpload from "./FileUpload";
import ManualRecipients from "./ManualRecipients";
import FilterRecipients from "./FilterRecipients";

const SOURCES = [
  { id: "segment", icon: Puzzle },
  { id: "file", icon: FileUp },
  { id: "manual", icon: PenLine },
  { id: "customers", icon: Filter },
];

// Switching source wipes the other sources' data (add + edit mode)
// so stale segments/files/numbers/filters are never submitted.
const RESET_ON_SWITCH = {
  segment: {
    audienceFile: null,
    audienceFileMeta: null,
    audienceFileUrl: null,
    manualRecipients: [],
    audienceFilter: null,
    audienceFilterRaw: null,
  },
  file: {
    audienceSegmentId: null,
    manualRecipients: [],
    audienceFilter: null,
    audienceFilterRaw: null,
  },
  manual: {
    audienceSegmentId: null,
    audienceFile: null,
    audienceFileMeta: null,
    audienceFileUrl: null,
    audienceFilter: null,
    audienceFilterRaw: null,
  },
  customers: {
    audienceSegmentId: null,
    audienceFile: null,
    audienceFileMeta: null,
    audienceFileUrl: null,
    manualRecipients: [],
  },
};

export default function StepRecipients({ watch, setValue, getValues }) {
  const t = useTranslations("campaigns.wizard");
  const audienceType = watch("audienceType") || "segment";

  const pickSource = (id) => {
    if (id === audienceType) return;
    setValue("audienceType", id, { shouldDirty: true });
    Object.entries(RESET_ON_SWITCH[id] || {}).forEach(([k, v]) =>
      setValue(k, v, { shouldDirty: true }),
    );
  };

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {SOURCES.map((s) => {
          const Icon = s.icon;
          const active = audienceType === s.id;
          return (
              <button
                key={s.id}
                type="button"
                onClick={() => pickSource(s.id)}
              className={cn(
                "flex flex-col items-center gap-1 rounded-xl border p-3.5 text-center transition-all",
                active
                  ? "border-primary bg-primary/5 shadow-[0_0_0_3px_rgb(var(--primary-shadow))]"
                  : "border-border bg-background",
              )}
            >
              <span className="grid h-9 w-9 place-items-center rounded-xl bg-primary/10 text-primary">
                <Icon size={17} />
              </span>
              <span className="text-sm font-bold">{t(`recipients.${s.id}`)}</span>
              <span className="text-[11px] text-muted-foreground leading-snug">{t(`recipients.${s.id}Hint`)}</span>
            </button>
          );
        })}
      </div>

      {audienceType === "segment" && <SegmentPicker watch={watch} setValue={setValue} />}
      {audienceType === "file" && <FileUpload watch={watch} setValue={setValue} />}
      {audienceType === "manual" && <ManualRecipients watch={watch} setValue={setValue} />}
      {audienceType === "customers" && <FilterRecipients setValue={setValue} getValues={getValues} />}
    </div>
  );
}
