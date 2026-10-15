"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import toast from "react-hot-toast";
import { Copy, Info, Link2, Trash2, X } from "lucide-react";
import { motion } from "framer-motion";
import api from "@/utils/api";
import Table from "@/components/atoms/Table";
import { ActionButtons } from "@/components/atoms/Actions";
import Button_ from "@/components/atoms/Button";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
const WRITE_SCOPE = "madar:write";

function mcpUrl() {
  const base = String(process.env.NEXT_PUBLIC_BASE_URL || "").replace(/\/+$/, "");
  return `${base}/mcp`;
}

function hasWrite(scope) {
  return String(scope || "")
    .split(/\s+/)
    .includes(WRITE_SCOPE);
}

function formatRelative(iso, locale) {
  if (!iso) return null;
  const seconds = (new Date(iso).getTime() - Date.now()) / 1000;
  const abs = Math.abs(seconds);
  const rtf = new Intl.RelativeTimeFormat(locale, { numeric: "auto" });
  if (abs < 3600) return rtf.format(Math.round(seconds / 60), "minute");
  if (abs < 86400) return rtf.format(Math.round(seconds / 3600), "hour");
  return rtf.format(Math.round(seconds / 86400), "day");
}

async function copyText(text, okMsg, failMsg) {
  try {
    await navigator.clipboard.writeText(text);
    toast.success(okMsg);
  } catch {
    toast.error(failMsg);
  }
}

function IntegrationGuide({ open, onOpenChange, t }) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        showCloseButton={false}
        className="flex w-[min(420px,calc(100%-24px))] flex-col overflow-hidden p-0 sm:max-w-[420px]"
      >
        <div className="flex items-start justify-between gap-3 border-b border-border px-6 py-5">
          <DialogTitle className="text-lg font-bold">{t("guide.title")}</DialogTitle>
          <button
            type="button"
            className="grid size-[34px] place-items-center rounded-full border border-border bg-background"
            onClick={() => onOpenChange(false)}
            aria-label={t("guide.close")}
          >
            <X size={16} />
          </button>
        </div>
        <div className="px-6 py-10 text-center text-base font-semibold text-muted-foreground">
          {t("guide.comingSoon")}
        </div>
      </DialogContent>
    </Dialog>
  );
}

export default function McpConnectionsTab({ guideOpen = false, onGuideOpenChange }) {
  const tSet = useTranslations("settings.tabs.mcp");
  const t = useTranslations("settings.mcp");
  const locale = useLocale();
  const url = mcpUrl();

  const [loading, setLoading] = useState(true);
  const [grants, setGrants] = useState([]);
  const [search, setSearch] = useState("");
  const [pending, setPending] = useState(null);
  const [revoking, setRevoking] = useState(false);

  const fetchGrants = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.get("/oauth/grants");
      const rows = Array.isArray(res.data) ? res.data : res.data?.records ?? [];
      setGrants(rows);
    } catch (e) {
      const msg =
        e?.response?.data?.message ??
        e?.response?.data?.error ??
        e?.message ??
        t("loadFailed");
      toast.error(Array.isArray(msg) ? msg.join(", ") : String(msg));
    } finally {
      setLoading(false);
    }
  }, [t]);

  useEffect(() => {
    fetchGrants();
  }, [fetchGrants]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return grants;
    return grants.filter((g) => String(g.clientName || "").toLowerCase().includes(q));
  }, [grants, search]);

  const handleRevoke = async () => {
    if (!pending) return;
    setRevoking(true);
    try {
      await api.delete(`/oauth/grants/${pending.id}`);
      setGrants((rows) => rows.filter((g) => g.id !== pending.id));
      toast.success(t("revoked", { name: pending.clientName }));
      setPending(null);
    } catch (e) {
      const msg =
        e?.response?.data?.message ??
        e?.response?.data?.error ??
        e?.message ??
        t("revokeFailed");
      toast.error(Array.isArray(msg) ? msg.join(", ") : String(msg));
    } finally {
      setRevoking(false);
    }
  };

  const columns = useMemo(
    () => [
      {
        key: "app",
        header: t("table.app"),
        className: "min-w-[180px]",
        cell: (row) => (
          <div className="flex items-center gap-3">
            <div className="grid size-[46px] place-items-center rounded-[14px] bg-primary/10 text-lg font-bold text-primary">
              {String(row.clientName || "?").charAt(0).toUpperCase()}
            </div>
            <div className="font-bold text-[15px]">{row.clientName}</div>
          </div>
        ),
      },
      {
        key: "scope",
        header: t("table.permissions"),
        cell: (row) =>
          hasWrite(row.scope) ? (
            <span className="inline-flex rounded-full bg-amber-50 px-2.5 py-1 text-xs font-semibold text-amber-700 dark:bg-amber-950/40 dark:text-amber-400">
              {t("scope.write")}
            </span>
          ) : (
            <span className="inline-flex rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-semibold text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400">
              {t("scope.read")}
            </span>
          ),
      },
      {
        key: "createdAt",
        header: t("table.connectedAt"),
        cell: (row) =>
          row.createdAt
            ? new Intl.DateTimeFormat(locale, { dateStyle: "medium" }).format(
                new Date(row.createdAt),
              )
            : "—",
      },
      {
        key: "lastUsedAt",
        header: t("table.lastUsed"),
        cell: (row) => {
          const rel = formatRelative(row.lastUsedAt, locale);
          return rel ? (
            rel
          ) : (
            <span className="text-muted-foreground">{t("neverUsed")}</span>
          );
        },
      },
      {
        key: "options",
        header: t("table.options"),
        className: "w-[80px]",
        cell: (row) => (
          <ActionButtons
            row={row}
            actions={[
              {
                icon: <Trash2 size={16} />,
                tooltip: t("revoke"),
                onClick: (r) => setPending(r),
                variant: "red",
              },
            ]}
          />
        ),
      },
    ],
    [t, locale],
  );

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className="border border-border rounded-[14px] bg-white overflow-hidden shadow-[0_2px_10px_rgba(30,30,60,0.03)]"
    >
      <div className="px-5 py-4 border-b border-border">
        <div className="flex items-center gap-2">
          <h2 className="text-[16px] font-semibold text-foreground">{t("activeTitle")}</h2>
          <span className="px-2 py-0.5 rounded-md bg-primary/10 text-primary text-[10px] font-bold">{grants.length}</span>
        </div>
        <p className="mt-1 text-xs text-muted-foreground">{tSet("description")}</p>

        <div className="mt-3 flex flex-wrap items-center gap-3 rounded-[11px] border border-border bg-muted/30 p-3">
          <div className="grid size-[38px] place-items-center rounded-[10px] bg-primary/10 text-primary">
            <Link2 size={18} />
          </div>
          <div className="min-w-0 flex-1">
            <div className="text-[13px] font-semibold">{t("urlLabel")}</div>
            <div className="mt-0.5 text-[11px] text-muted-foreground">{t("urlHint")}</div>
          </div>
          <code className="max-w-full truncate rounded-lg border border-border bg-background px-3 py-2 text-xs ltr:text-left" dir="ltr">
            {url}
          </code>
          <Button_
            size="sm"
            variant="cancel"
            tone="ghost"
            label={t("copyUrl")}
            icon={<Copy size={14} />}
            onClick={() => copyText(url, t("copiedUrl"), t("copyFailed"))}
          />
        </div>
      </div>

      <Table
        tableKey="ai-mcp-grants"
        flat
        columns={columns}
        data={filtered}
        isLoading={loading}
        searchValue={search}
        onSearchChange={setSearch}
        labels={{
          searchPlaceholder: t("searchPlaceholder"),
          emptyTitle: t("emptyTitle"),
          emptySubtitle: t("emptySubtitle"),
        }}
      />

      <p className="flex items-start gap-2 border-t border-border px-5 py-3 text-xs leading-relaxed text-muted-foreground">
        <Info size={16} className="mt-0.5 shrink-0" />
        {t("footnote")}
      </p>

      <IntegrationGuide open={guideOpen} onOpenChange={onGuideOpenChange} t={t} />

      <AlertDialog open={Boolean(pending)} onOpenChange={(o) => !o && setPending(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {t("revokeTitle", { name: pending?.clientName ?? "" })}
            </AlertDialogTitle>
            <AlertDialogDescription>{t("revokeBody")}</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={revoking}>{t("cancel")}</AlertDialogCancel>
            <AlertDialogAction
              disabled={revoking}
              onClick={(e) => {
                e.preventDefault();
                handleRevoke();
              }}
            >
              {t("revoke")}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </motion.div>
  );
}
