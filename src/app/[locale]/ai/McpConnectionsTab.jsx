"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import toast from "react-hot-toast";
import { Check, Copy, Image as ImageIcon, Info, Link2, Puzzle, Trash2, X } from "lucide-react";
import { cn } from "@/utils/cn";
import { ImagePreviewModal } from "@/components/atoms/ImagePreviewModal";
import { motion } from "framer-motion";
import api, { handleApiError } from "@/utils/api";
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

// Step text lives in `settings.mcp.guide.apps.<key>.steps.<n>`; set `image` once screenshots exist.
// `copyUrl` shows the copy button inside that step while it is active.
const GUIDE_APPS = [
  // {
  //   key: "chatgpt",
  //   logo: "/ai-providers/chatgpt.png",
  //   steps: [{ image: null }, { image: null }, { image: null, copyUrl: true }, { image: null }],
  // },
  {
    key: "claude",
    logo: "/ai-providers/anthropic.png",
    // The PNG is a full-bleed tile; padding it leaves a white frame.
    tile: true,
    steps: [
      { image: "/MCP/claude/1-settings-step.png" },
      { image: "/MCP/claude/2-click-button-step.png" },
      { image: "/MCP/claude/3-fill-data-and-continue.png" },
      { image: "/MCP/claude/4-authorization-method.png" },
      { image: "/MCP/claude/5-connect.png" },
      { image: "/MCP/claude/6-accept.png" },
      { image: "/MCP/claude/7-now-mcp-connected.png" },
    ],
  },
  // {
  //   key: "gemini",
  //   logo: "/ai-providers/gemini.png",
  //   steps: [{ image: null }, { image: null }, { image: null, copyUrl: true }, { image: null }],
  // },
  {
    key: "other",
    logo: null,
    steps: [{ image: null }, { image: null }, { image: null, copyUrl: true }, { image: null }],
  },
];

function AppLogo({ app, name, className }) {
  const [failed, setFailed] = useState(false);
  const showImage = app.logo && !failed;
  return (
    <span
      className={cn(
        "grid shrink-0 place-items-center overflow-hidden bg-white font-bold text-primary shadow-sm ring-1 ring-black/5",
        className,
      )}
    >
      {showImage ? (
        <img
          src={app.logo}
          alt={name}
          className={cn("size-full", app.tile ? "object-cover" : "object-contain p-1")}
          onError={() => setFailed(true)}
        />
      ) : app.key === "other" ? (
        <Puzzle className="size-[55%]" />
      ) : (
        String(name || "?").charAt(0).toUpperCase()
      )}
    </span>
  );
}

function StepImage({ src, alt, placeholder, onPreview }) {
  return (
    <div
      className={cn(
        "w-full overflow-hidden rounded-xl border border-border bg-background shadow-[0_8px_22px_rgba(22,22,42,0.08)]",
        src && "cursor-zoom-in transition-all hover:ring-2 hover:ring-primary/30",
      )}
      onClick={src ? () => onPreview?.(src) : undefined}
    >
      {/* <div className="flex gap-1 border-b border-border bg-muted/50 px-2.5 py-1.5" dir="ltr">
        <i className="size-2 rounded-full bg-border" />
        <i className="size-2 rounded-full bg-border" />
        <i className="size-2 rounded-full bg-border" />
      </div> */}
      {src ? (
        <img src={src} alt={alt} className="mx-auto block max-h-[60vh] w-full object-contain" />
      ) : (
        <div className="grid min-h-[220px] place-items-center md:min-h-[320px] p-4 text-center text-xs leading-relaxed text-muted-foreground">
          <span className="flex flex-col items-center gap-2">
            <ImageIcon size={28} className="opacity-50" />
            {placeholder}
          </span>
        </div>
      )}
    </div>
  );
}

function IntegrationGuide({ open, onOpenChange, t, url }) {
  const [activeKey, setActiveKey] = useState(GUIDE_APPS[0].key);
  const [activeStep, setActiveStep] = useState(0);
  const [copied, setCopied] = useState(false);
  const [previewImage, setPreviewImage] = useState(null);
  const app = GUIDE_APPS.find((a) => a.key === activeKey) ?? GUIDE_APPS[0];
  const appName = t(`guide.apps.${app.key}.name`);
  const stepCount = app.steps.length;
  const step = app.steps[activeStep] ?? app.steps[0];
  const hasImages = app.steps.some((s) => s.image);
  const stepTitle = t(`guide.apps.${app.key}.steps.${activeStep}.title`);

  const selectApp = (key) => {
    setActiveKey(key);
    setActiveStep(0);
  };

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 1400);
    } catch {
      toast.error(t("copyFailed"));
    }
  };

  return (
    <>
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        onEscapeKeyDown={(e) => {
          if (previewImage) {
            e.preventDefault();
            setPreviewImage(null);
          }
        }}
        onPointerDownOutside={(e) => {
          if (previewImage) e.preventDefault();
        }}
        onInteractOutside={(e) => {
          if (previewImage) e.preventDefault();
        }}
        showCloseButton={false}
        className="grid max-h-[90vh] w-[min(940px,calc(100%-24px))] grid-cols-1 gap-0 overflow-y-auto rounded-3xl p-0 sm:max-w-[940px] md:h-[min(680px,90vh)] md:grid-cols-[250px_1fr] md:overflow-hidden"
      >
        {/* ── Sidebar ─────────────────────────── */}
        <aside className="flex flex-col gap-4 bg-gradient-to-br from-primary to-secondary px-4 py-5 text-white md:overflow-y-auto">
          <div>
            <DialogTitle className="text-base font-bold text-white">{t("guide.title")}</DialogTitle>
            <p className="mt-1 text-xs text-white/80">{t("guide.subtitle")}</p>
          </div>

          <div className="rounded-2xl bg-white/15 p-3">
            <span className="text-[11px] text-white/80">{t("urlLabel")}</span>
            <div
              className="my-1.5 overflow-x-auto whitespace-nowrap text-start font-mono text-[11px] font-medium"
              dir="ltr"
            >
              {url}
            </div>
            <button
              type="button"
              onClick={handleCopy}
              className={cn(
                "flex w-full items-center justify-center gap-1.5 rounded-[10px] px-3 py-2 text-xs font-semibold transition-colors",
                copied ? "bg-white/90 text-primary" : "bg-white text-primary hover:bg-white/90",
              )}
            >
              {copied ? <Check size={14} /> : <Copy size={14} />}
              {copied ? t("copiedUrl") : t("copyUrl")}
            </button>
          </div>

          <div className="flex flex-col gap-1">
            <span className="px-1 text-[11px] font-semibold text-white/70">{t("guide.appsLabel")}</span>
            {GUIDE_APPS.map((a) => {
              const name = t(`guide.apps.${a.key}.name`);
              const active = a.key === app.key;
              return (
                <button
                  key={a.key}
                  type="button"
                  aria-pressed={active}
                  onClick={() => selectApp(a.key)}
                  className={cn(
                    "flex w-full items-center gap-2.5 rounded-xl px-2.5 py-2 text-start text-sm font-semibold transition-colors",
                    active ? "bg-white/20 opacity-100" : "opacity-80 hover:bg-white/10 hover:opacity-100",
                  )}
                >
                  <AppLogo app={a} name={name} className="size-[30px] rounded-[9px] text-xs" />
                  {name}
                  {/* <span className="ms-auto text-[11px] font-medium text-white/70">
                    {t("guide.stepsCount", { count: a.steps.length })}
                  </span> */}
                </button>
              );
            })}
          </div>
        </aside>

        {/* ── Steps ───────────────────────────── */}
        <section className="flex min-h-0 flex-col overflow-y-auto bg-card">
          <div className="flex items-start justify-between gap-3 px-6 pb-2 pt-5">
            <div className="flex items-center gap-3">
              <AppLogo app={app} name={appName} className="size-10 rounded-xl text-sm" />
              <div>
                <h2 className="text-lg font-bold text-foreground">{t("guide.connectTitle", { name: appName })}</h2>
                <p className="text-xs text-muted-foreground">{t(`guide.apps.${app.key}.summary`)}</p>
              </div>
            </div>
            <button
              type="button"
              className="grid size-[34px] shrink-0 place-items-center rounded-full border border-border bg-background hover:bg-muted"
              onClick={() => onOpenChange(false)}
              aria-label={t("guide.close")}
            >
              <X size={16} />
            </button>
          </div>

          <div
            className={cn(
              "grid flex-1 grid-cols-1 items-start gap-5 px-6 pb-5 pt-3 md:items-stretch",
              hasImages && "md:grid-cols-[1fr_1.2fr]",
            )}
          >
            <ol className="flex flex-col gap-1 md:h-full">
              {app.steps.map((s, i) => {
                const isActive = i === activeStep;
                const isDone = i < activeStep;
                return (
                  <li key={`${app.key}-${i}`} className="relative md:flex-1 md:last:flex-none">
                    {i < stepCount - 1 && (
                      <span
                        className={cn(
                          "absolute bottom-[-16px] start-[25px] top-[42px] w-0.5",
                          isDone ? "bg-primary" : "bg-border",
                        )}
                      />
                    )}
                    <div
                      role="button"
                      tabIndex={0}
                      aria-current={isActive ? "step" : undefined}
                      onClick={() => setActiveStep(i)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter" || e.key === " ") {
                          e.preventDefault();
                          setActiveStep(i);
                        }
                      }}
                      className={cn(
                        "flex w-full cursor-pointer gap-3 rounded-2xl border p-3 text-start transition-colors",
                        isActive ? "border-primary bg-primary/5" : "border-transparent hover:bg-muted/60",
                      )}
                    >
                      <span
                        className={cn(
                          "relative z-[1] grid size-7 shrink-0 place-items-center rounded-full border-2 text-[13px] font-bold",
                          isDone && "border-primary bg-primary text-white",
                          isActive && "border-primary bg-background text-primary",
                          !isDone && !isActive && "border-border bg-muted text-muted-foreground",
                        )}
                      >
                        {isDone ? <Check size={14} strokeWidth={3} /> : i + 1}
                      </span>
                      <div className="min-w-0">
                        <h4 className="text-sm font-semibold text-foreground">
                          {t(`guide.apps.${app.key}.steps.${i}.title`)}
                        </h4>
                        <p className="mt-0.5 text-xs leading-relaxed text-muted-foreground">
                          {t(`guide.apps.${app.key}.steps.${i}.text`)}
                        </p>
                        {s.copyUrl && isActive && (
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleCopy();
                            }}
                            className="mt-2 inline-flex items-center gap-1.5 rounded-lg bg-primary px-3 py-1.5 text-xs font-semibold text-white hover:bg-primary/90"
                          >
                            {copied ? <Check size={13} /> : <Copy size={13} />}
                            {copied ? t("copiedUrl") : t("copyUrl")}
                          </button>
                        )}
                      </div>
                    </div>
                  </li>
                );
              })}
            </ol>

            {step.image && (
              <div className="order-first flex flex-col items-center gap-3 md:sticky md:top-0 md:order-none md:self-start md:pt-3">
                <StepImage
                  src={step.image}
                  alt={stepTitle}
                  placeholder={t("guide.imagePlaceholder")}
                  onPreview={setPreviewImage}
                />
              </div>
            )}
          </div>

         
        </section>
      </DialogContent>
    </Dialog>
    <ImagePreviewModal
      src={previewImage}
      isOpen={!!previewImage}
      onClose={() => setPreviewImage(null)}
    />
    </>
  );
}

export default function McpConnectionsTab({ guideOpen = false, onGuideOpenChange, onGrantsChange }) {
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
      handleApiError(e, Array.isArray(msg) ? msg.join(", ") : String(msg));
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
      onGrantsChange?.();
      toast.success(t("revoked", { name: pending.clientName }));
      setPending(null);
    } catch (e) {
      const msg =
        e?.response?.data?.message ??
        e?.response?.data?.error ??
        e?.message ??
        t("revokeFailed");
      handleApiError(e, Array.isArray(msg) ? msg.join(", ") : String(msg));
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

      <IntegrationGuide open={guideOpen} onOpenChange={onGuideOpenChange} t={t} url={url} />

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
