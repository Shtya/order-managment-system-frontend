"use client";

import { useRef, useState } from "react";
import { useTranslations } from "next-intl";
import toast from "react-hot-toast";
import { FileUp, RefreshCw, Download, Loader2 } from "lucide-react";
import Button_ from "@/components/atoms/Button";
import api from "@/utils/api";

const MAX_BYTES = 5 * 1024 * 1024;
const MAX_ROWS = 50000;

// Mirrors backend campaign-audience-file.util header sets.
const PHONE_HEADERS = new Set(
  ["phonenumber", "phone", "mobile", "mobilenumber", "msisdn", "رقمالهاتف", "هاتف", "موبايل"],
);

function normalizeHeader(value) {
  return String(value ?? "")
    .toLowerCase()
    .replace(/[\s_]+/g, "");
}

export function normalizeAnyPhone(value) {
  const cleaned = String(value ?? "").trim().replace(/[\s\-().]+/g, "");
  if (!/^\+?\d{7,15}$/.test(cleaned)) return null;
  return cleaned;
}

function cellText(value) {
  if (value == null) return "";
  if (typeof value === "number") return Number.isFinite(value) ? String(Math.trunc(value)) : "";
  return String(value).trim();
}

// Shared row-matrix parser: rows[0] is the header row.
function parseMatrix(rows) {
  const data = (rows || []).filter((r) => r.some((c) => String(c ?? "").trim() !== ""));
  if (!data.length) return { error: "empty" };
  const headers = data[0].map(normalizeHeader);
  const phoneIdx = headers.findIndex((h) => PHONE_HEADERS.has(h));
  if (phoneIdx === -1) return { error: "missing_phone", headers: data[0].map((c) => String(c ?? "")) };
  const body = data.slice(1);
  if (body.length > MAX_ROWS) return { error: "too_many" };
  let valid = 0;
  let invalid = 0;
  for (const row of body) {
    if (!normalizeAnyPhone(cellText(row[phoneIdx]))) invalid += 1;
    else valid += 1;
  }
  if (!valid) return { error: "empty_valid" };
  return { valid, invalid };
}

export default function FileUpload({ watch, setValue }) {
  const t = useTranslations("campaigns.wizard");
  const file = watch("audienceFile");
  const meta = watch("audienceFileMeta");
  const existingUrl = watch("audienceFileUrl");
  const [dragOver, setDragOver] = useState(false);
  const [parsing, setParsing] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const inputRef = useRef(null);

  const commit = (f, parsed) => {
    setValue("audienceFile", f, { shouldDirty: true });
    setValue(
      "audienceFileMeta",
      { name: f.name, valid: parsed.valid, invalid: parsed.invalid },
      { shouldDirty: true },
    );
  };

  const fail = (key) => toast.error(t(`recipients.fileError_${key}`));

  const handleFile = async (f) => {
    if (!f || parsing) return false;
    if (!/\.(xlsx|xls|csv)$/i.test(f.name)) {
      toast.error(t("recipients.fileTypeError"));
      return false;
    }
    if (f.size > MAX_BYTES) {
      toast.error(t("recipients.fileSizeError"));
      return false;
    }
    setParsing(true);
    try {
      if (/\.csv$/i.test(f.name)) {
        const text = await f.text();
        const lines = String(text || "")
          .split(/\r?\n/)
          .filter((l) => l.trim());
        const parsed = parseMatrix(lines.map((l) => l.split(",")));
        if (parsed.error) {
          fail(parsed.error);
          if (parsed.headers) {
            setValue(
              "audienceFileMeta",
              { name: f.name, valid: 0, invalid: 0, preview: [], headers: parsed.headers },
              { shouldDirty: true },
            );
          }
          return false;
        }
        commit(f, parsed);
        return true;
      }
      const XLSX = await import("xlsx");
      const buf = await f.arrayBuffer();
      const wb = XLSX.read(buf, { type: "array" });
      const ws = wb.Sheets?.[wb.SheetNames?.[0]];
      if (!ws) {
        fail("empty");
        return false;
      }
      const rows = XLSX.utils.sheet_to_json(ws, { header: 1, defval: "", raw: true });
      const parsed = parseMatrix(rows);
      if (parsed.error) {
        fail(parsed.error);
        if (parsed.headers) {
          setValue(
            "audienceFileMeta",
            { name: f.name, valid: 0, invalid: 0, preview: [], headers: parsed.headers },
            { shouldDirty: true },
          );
        }
        return false;
      }
      commit(f, parsed);
      return true;
    } catch {
      toast.error(t("recipients.fileError_invalid"));
      return false;
    } finally {
      setParsing(false);
    }
  };

  const downloadTemplate = async () => {
    setDownloading(true);
    try {
      const res = await api.get("/campaigns/audience-file-template", { responseType: "blob" });
      const url = URL.createObjectURL(new Blob([res.data]));
      const a = document.createElement("a");
      a.href = url;
      a.download = "campaign-audience-template.xlsx";
      a.click();
      URL.revokeObjectURL(url);
    } catch {
      toast.error(t("recipients.templateFailed"));
    } finally {
      setDownloading(false);
    }
  };

  return (
    <div className="space-y-3 rounded-xl border border-border p-4">
      <div className="flex items-center justify-between gap-2">
        <p className="text-sm font-semibold">{t("recipients.fileTitle")}</p>
        <Button_
          size="sm"
          variant="outline"
          label={t("recipients.template")}
          icon={<Download size={14} />}
          onClick={downloadTemplate}
          disabled={downloading}
        />
      </div>
      <div
        onDragOver={(e) => {
          e.preventDefault();
          setDragOver(true);
        }}
        onDragLeave={() => setDragOver(false)}
        onDrop={(e) => {
          e.preventDefault();
          setDragOver(false);
          handleFile(e.dataTransfer.files?.[0]);
        }}
        className={`rounded-xl border-2 border-dashed p-6 text-center transition-all ${dragOver ? "border-primary bg-primary/5" : "border-border bg-muted/20"}`}
      >
        {parsing ? (
          <Loader2 size={22} className="mx-auto animate-spin text-primary" />
        ) : (
          <FileUp size={22} className="mx-auto text-muted-foreground" />
        )}
        <p className="mt-2 text-sm">{parsing ? t("recipients.parsing") : t("recipients.dropHint")}</p>
        <input
          ref={inputRef}
          type="file"
          accept=".xlsx,.xls,.csv"
          className="hidden"
          onChange={(e) => handleFile(e.target.files?.[0])}
        />
        <div className="mt-3">
          <Button_ size="sm" variant="outline" label={t("recipients.browse")} disabled={parsing} onClick={() => inputRef.current?.click()} />
        </div>
        <p className="mt-2 text-[11px] text-muted-foreground">{t("recipients.fileLimits")}</p>
      </div>
      {meta && (
        <div className="space-y-2 rounded-xl border border-border bg-muted/30 px-3 py-2 text-sm">
          <div className="flex items-center justify-between gap-2">
            <span className="min-w-0 truncate font-medium">{meta.name || file?.name}</span>
            <Button_
              size="sm"
              variant="outline"
              label={t("recipients.replace")}
              icon={<RefreshCw size={14} />}
              onClick={() => {
                setValue("audienceFile", null, { shouldDirty: true });
                setValue("audienceFileMeta", null, { shouldDirty: true });
                inputRef.current?.click();
              }}
            />
          </div>
          {meta.headers && !file ? (
            <p className="text-xs text-red-500">
              {t("recipients.fileError_missing_phone")}: {(meta.headers || []).join(" · ")}
            </p>
          ) : (
            <p className="text-xs">
              ✅ {t("recipients.numbersFound", { count: meta.valid ?? 0 })}
              {(meta.invalid ?? 0) > 0 && (
                <span className="text-red-500"> · ⚠️ {t("recipients.invalidRows", { count: meta.invalid })} — {t("validation.fileHasErrors")}</span>
              )}
            </p>
          )}
        </div>
      )}
      {!meta && !file && !!existingUrl && (
        <div className="flex items-center justify-between gap-2 rounded-xl border border-border bg-muted/30 px-3 py-2 text-sm">
          <span className="min-w-0 truncate font-medium" dir="ltr">
            {String(existingUrl).split("/").pop()}
          </span>
          <Button_
            size="sm"
            variant="outline"
            label={t("recipients.replace")}
            icon={<RefreshCw size={14} />}
            onClick={() => inputRef.current?.click()}
          />
        </div>
      )}
    </div>
  );
}
