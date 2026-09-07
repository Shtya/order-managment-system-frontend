"use client";

import { useEffect, useRef, useState } from "react";
import { useTranslations } from "next-intl";
import { Check } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/utils/cn";
import api from "@/utils/api";
import { useDebounce } from "@/hook/useDebounce";

export default function SegmentPicker({ watch, setValue }) {
  const t = useTranslations("campaigns.wizard");
  const tSeg = useTranslations("customerSegments");
  const selectedId = watch("audienceSegmentId");
  const [search, setSearch] = useState("");
  const { debouncedValue: debouncedSearch } = useDebounce({ value: search });
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selected, setSelected] = useState(null);
  const inputRef = useRef(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      try {
        const res = await api.get("/client-segments", {
          params: { search: debouncedSearch || undefined, limit: 20, status: "active" },
        });
        if (cancelled) return;
        const rows = res.data?.records || res.data?.data?.records || [];
        setRecords(rows);
      } catch {
        if (!cancelled) setRecords([]);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [debouncedSearch]);

  useEffect(() => {
    if (!selectedId) {
      setSelected(null);
      return;
    }
    if (records.find((r) => String(r.id) === String(selectedId))) {
      setSelected(records.find((r) => String(r.id) === String(selectedId)));
      return;
    }
    let cancelled = false;
    (async () => {
      try {
        const res = await api.get(`/client-segments/${selectedId}`);
        if (!cancelled) setSelected(res.data?.id ? res.data : res.data?.data);
      } catch (error) {
        // A deleted segment must not linger as a stale selection
        // (covers edit + duplicate prefill); other errors keep it.
        if (!cancelled && error?.response?.status === 404) {
          setValue("audienceSegmentId", null, { shouldDirty: true });
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [selectedId, records]);

  return (
    <div className="space-y-3 rounded-xl border border-border p-4">
      <div className="space-y-2">
        <Label>{t("recipients.searchSegments")}</Label>
        <Input
          ref={inputRef}
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder={t("recipients.searchSegmentsPlaceholder")}
        />
      </div>
      <div className="max-h-64 overflow-y-auto space-y-2">
        {loading && <p className="text-xs text-muted-foreground">{t("recipients.loading")}</p>}
        {!loading && !records.length && (
          <p className="text-xs text-muted-foreground">{t("recipients.noSegments")}</p>
        )}
        {records.map((s) => {
          const active = String(selectedId) === String(s.id);
          let typeLabel = s.type || "—";
          try {
            if (s.type) typeLabel = tSeg(`types.${s.type}`);
          } catch {
            /* fallback to raw type */
          }
          return (
            <button
              key={s.id}
              type="button"
              onClick={() => setValue("audienceSegmentId", s.id, { shouldDirty: true })}
              className={cn(
                "flex w-full items-center gap-3 rounded-xl border p-3 text-start transition-all",
                active ? "border-primary bg-primary/5" : "border-border bg-background",
              )}
            >
              <span
                className={cn(
                  "grid h-[18px] w-[18px] shrink-0 place-items-center rounded-full border-2",
                  active ? "border-primary text-primary" : "border-slate-300 text-transparent",
                )}
              >
                <Check size={12} />
              </span>
              <span className="min-w-0 flex-1">
                <span className="block truncate text-sm font-bold">{s.name}</span>
                <span className="block text-xs text-muted-foreground">
                  {(s.estimatedRecipientsCount ?? s.frozenRecipientsCount ?? "—") + " · " + typeLabel}
                </span>
              </span>
              <Badge variant="outline">{typeLabel}</Badge>
            </button>
          );
        })}
      </div>
      {selected && (
        <p className="text-xs text-muted-foreground">
          {t("recipients.selectedSegment")}: <span className="font-bold text-foreground">{selected.name}</span>
        </p>
      )}
    </div>
  );
}
