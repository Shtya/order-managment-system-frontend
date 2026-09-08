"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useParams } from "next/navigation";
import { useFormatter, useLocale, useTranslations } from "next-intl";
import toast from "react-hot-toast";
import {
  Ban,
  Check,
  Copy,
  Edit,
  Megaphone,
  Pause,
  Play,
  RotateCcw,
  Trash2,
  Users,
  Send,
  Eye,
  MessageCircle,
  ShoppingCart,
  XCircle,
  Clock,
  BadgeCheck,
  Percent,
} from "lucide-react";
import PageHeader from "@/components/atoms/Pageheader";
import Table, { FilterField } from "@/components/atoms/Table";
import Button_ from "@/components/atoms/Button";
import { Badge } from "@/components/ui/badge";
import { Bone } from "@/components/atoms/BannerSkeleton";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import ConfirmDialog from "@/components/molecules/ConfirmDialog";
import TemplatePreview from "@/app/[locale]/whatsapp/atoms/TemplatePreview";
import {
  AudienceFilterSummary,
  buildAudienceFieldOptions,
  fromApiFilter,
} from "@/components/audience-filter";
import {
  EMPTY_AUDIENCE_LOOKUPS,
  fetchAudienceLookupKeys,
  lookupKeysForFields,
} from "@/components/audience-filter/lookups";
import { collectRuleFields } from "@/components/audience-filter/audience-filter.utils";
import { useRouter } from "@/i18n/navigation";
import { useSocket } from "@/context/SocketContext";
import ActionButtons from "@/components/atoms/Actions";
import api from "@/utils/api";
import { normalizeAxiosError } from "@/utils/axios";
import { setDocumentTitle } from "@/utils/documentTitle";
import { cn } from "@/utils/cn";
import { avatarSrc } from "@/components/atoms/UserSelect";
import { campaignTemplateChipPreview, getCampaignPlaceholderChips } from "@/app/[locale]/campaigns/atoms/campaignPlaceholders";
import { inspectTemplateOrderLink } from "@/app/[locale]/campaigns/atoms/campaignOrderUrl";
import { VariableTextPreview } from "@/components/ui/VariableInput";
import { usePlatformSettings } from "@/context/PlatformSettingsContext";

const STATUS_BADGE_CLASS = {
  draft: "bg-slate-500/10 text-slate-600 border-slate-500/20",
  scheduled: "bg-blue-500/10 text-blue-600 border-blue-500/20",
  running: "bg-emerald-500/10 text-emerald-700 border-emerald-500/20",
  paused: "bg-amber-500/10 text-amber-700 border-amber-500/20",
  completed: "bg-violet-500/10 text-violet-700 border-violet-500/20",
  cancelled: "bg-zinc-500/10 text-zinc-600 border-zinc-500/20",
  failed: "bg-red-500/10 text-red-600 border-red-500/20",
  pending: "bg-slate-500/10 text-slate-600 border-slate-500/20",
  sending: "bg-amber-500/10 text-amber-700 border-amber-500/20",
  accepted: "bg-purple-500/10 text-purple-600 border-purple-500/20",
  sent: "bg-blue-500/10 text-blue-600 border-blue-500/20",
  delivered: "bg-cyan-500/10 text-cyan-700 border-cyan-500/20",
  read: "bg-emerald-500/10 text-emerald-700 border-emerald-500/20",
};

const RECIPIENT_STATUSES = [
  // "pending",
  // "sending",
  "accepted",
  "sent",
  "delivered",
  "read",
  "failed",
];

const CAMPAIGN_LIVE_RELATIONS = ["template", "audienceSegment"];

export default function CampaignDetailsPage() {
  const params = useParams();
  const id = params?.id;
  const tc = useTranslations("common");
  const td = useTranslations("campaigns.details");
  const tw = useTranslations("campaigns.wizard");
  const tSeg = useTranslations("customerSegments");
  const ta = useTranslations("audienceFilter");
  const tOrders = useTranslations("orders");
  const tTags = useTranslations("tags");
  const t = useTranslations("campaigns");
  const locale = useLocale();
  const format = useFormatter();
  const router = useRouter();
  const { subscribe } = useSocket() || {};
  const { formatCurrency } = usePlatformSettings();
  const placeholderChips = useMemo(() => getCampaignPlaceholderChips(tw), [tw]);

  const [campaign, setCampaign] = useState(null);
  const [loading, setLoading] = useState(true);
  const [records, setRecords] = useState([]);
  const [summary, setSummary] = useState({ total: 0, byStatus: {} });
  const [tableLoading, setTableLoading] = useState(false);
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [appliedStatus, setAppliedStatus] = useState("all");
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(12);
  const [totalRecords, setTotalRecords] = useState(0);
  const [acting, setActing] = useState(false);
  const [confirm, setConfirm] = useState({ open: false, type: null });
  const [metadata, setMetadata] = useState(null);
  const [lookupsRaw, setLookupsRaw] = useState(EMPTY_AUDIENCE_LOOKUPS);
  const [whatsappAccount, setWhatsappAccount] = useState(null);
  const searchTimer = useRef(null);
  const liveRefreshTimer = useRef(null);

  const fetchCampaign = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.get(`/campaigns/${id}`);
      const row = res.data?.id ? res.data : res.data?.data;
      setCampaign(row);
    } catch (error) {
      toast.error(normalizeAxiosError(error) || t("toast.fetchFailed"));
    } finally {
      setLoading(false);
    }
  }, [id, t]);

  const fetchRecipients = useCallback(
    async ({
      page: p = page,
      limit: l = limit,
      status = appliedStatus,
      searchValue = debouncedSearch,
      silent = false,
    } = {}) => {
      if (!silent) setTableLoading(true);
      try {
        const params = { page: p, limit: l };
        if (status && status !== "all") params.status = status;
        if (searchValue?.trim()) params.search = searchValue.trim();
        const res = await api.get(`/campaigns/${id}/recipients`, { params });
        const body = res.data?.records ? res.data : res.data?.data || {};
        setRecords(body.records || []);
        setTotalRecords(Number(body.total_records || 0));
        setPage(Number(body.current_page || p));
        setLimit(Number(body.per_page || l));
        if (body.summary) setSummary(body.summary);
      } catch (error) {
        if (!silent) toast.error(normalizeAxiosError(error) || t("toast.fetchFailed"));
      } finally {
        if (!silent) setTableLoading(false);
      }
    },
    [id, page, limit, appliedStatus, debouncedSearch, t],
  );

  useEffect(() => {
    fetchCampaign();
  }, [fetchCampaign]);

  useEffect(() => {
    if (!subscribe || !id) return undefined;
    const off = subscribe("CAMPAIGN_UPDATED", (payload) => {
      const live = payload?.campaign;
      if (!live?.id || String(live.id) !== String(id)) return;

      setCampaign((prev) => {
        if (!prev) return live;
        const merged = { ...prev, ...live };
        for (const key of CAMPAIGN_LIVE_RELATIONS) {
          if (live[key] == null && prev[key] != null) merged[key] = prev[key];
        }
        if (!live.templateConfigSnapshot && prev.templateConfigSnapshot) {
          merged.templateConfigSnapshot = prev.templateConfigSnapshot;
        }
        return merged;
      });

      const recipient = payload?.recipient;
      if (recipient?.id) {
        setRecords((prev) =>
          prev.map((row) => (row.id === recipient.id ? { ...row, ...recipient } : row)),
        );
      }

      clearTimeout(liveRefreshTimer.current);
      liveRefreshTimer.current = setTimeout(() => {
        fetchRecipients({ silent: true });
      }, 500);
    });
    return () => {
      clearTimeout(liveRefreshTimer.current);
      off?.();
    };
  }, [subscribe, id, fetchRecipients]);

  useEffect(() => {
    const accountId = campaign?.templateConfigSnapshot?.accountId;
    if (!accountId) {
      setWhatsappAccount(null);
      return;
    }
    let cancelled = false;
    (async () => {
      try {
        const res = await api.get(`/whatsapp-accounts/${accountId}`);
        const row = res.data?.id ? res.data : res.data?.data;
        if (!cancelled) setWhatsappAccount(row || null);
      } catch {
        if (!cancelled) setWhatsappAccount(null);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [campaign?.templateConfigSnapshot?.accountId]);

  useEffect(() => {
    if (campaign) setDocumentTitle(campaign.name || td("title"));
  }, [campaign, td]);

  useEffect(() => {
    clearTimeout(searchTimer.current);
    searchTimer.current = setTimeout(() => {
      setDebouncedSearch(search);
      setPage(1);
    }, 350);
    return () => clearTimeout(searchTimer.current);
  }, [search]);

  useEffect(() => {
    fetchRecipients({ page: 1 });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [debouncedSearch]);

  useEffect(() => {
    if (campaign?.audienceType !== "customers" || !campaign?.audienceFilter) return;
    let cancelled = false;
    (async () => {
      try {
        const metaRes = await api.get("/audience-filter/entities");
        if (cancelled) return;
        const meta = metaRes.data?.entities ? metaRes.data : metaRes.data?.data || metaRes.data;
        setMetadata(meta);
        const loaded = await fetchAudienceLookupKeys(
          lookupKeysForFields(collectRuleFields(fromApiFilter(campaign.audienceFilter)), { includeTenant: true }),
        );
        if (!cancelled) setLookupsRaw((prev) => ({ ...prev, ...loaded }));
      } catch {
        /* summary falls back silently */
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [campaign?.audienceType, campaign?.audienceFilter]);

  const fieldOptions = useMemo(
    () => buildAudienceFieldOptions({ lookups: lookupsRaw, locale, tOrders, tTags, tAudience: ta }),
    [lookupsRaw, locale, tOrders, tTags, ta],
  );

  const byStatus = summary.byStatus || {};
  const failed = Number(byStatus.failed || 0);
  const pending = Number(byStatus.pending || 0) + Number(byStatus.sending || 0);
  const sent = Number(campaign?.sentCount || 0);
  const delivered = Number(campaign?.deliveredCount || 0);
  const successRate = sent ? Math.round((delivered / sent) * 100) : 0;
  const conversionRate = sent ? Math.round((Number(campaign?.ordersCount || 0) / sent) * 100) : 0;

  const statsCards = useMemo(
    () => [
      { key: "recipients", name: td("stats.recipients"), value: campaign?.recipientsCount ?? 0, icon: Users, sortOrder: 0 },
      { key: "sent", name: td("stats.sent"), value: sent, icon: Send, sortOrder: 1 },
      { key: "delivered", name: td("stats.delivered"), value: delivered, icon: BadgeCheck, sortOrder: 2 },
      { key: "read", name: td("stats.read"), value: campaign?.readCount ?? 0, icon: Eye, sortOrder: 3 },
      { key: "replied", name: td("stats.replied"), value: campaign?.repliedCount ?? 0, icon: MessageCircle, sortOrder: 4 },
      { key: "failed", name: td("stats.failed"), value: failed, icon: XCircle, sortOrder: 5 },
      { key: "pending", name: td("stats.pending"), value: pending, icon: Clock, sortOrder: 6 },
      { key: "orders", name: td("stats.orders"), value: campaign?.ordersCount ?? 0, icon: ShoppingCart, sortOrder: 7 },
      { key: "successRate", name: td("stats.successRate"), value: `${successRate}%`, icon: BadgeCheck, sortOrder: 8 },
      { key: "conversion", name: td("stats.conversion"), value: `${conversionRate}%`, icon: Percent, sortOrder: 9 },
    ],
    [td, campaign, sent, delivered, failed, pending, successRate, conversionRate],
  );

  const formatDate = (value) => {
    if (!value) return "—";
    return format.dateTime(new Date(value), { dateStyle: "medium", timeStyle: "short" });
  };

  const formatUsd = (value) => {
    const amount = Number(value || 0);
  
    return `$${new Intl.NumberFormat("en-US", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 4,
    }).format(amount)}`;
  };

  const runAction = async (type) => {
    setActing(true);
    try {
      if (type === "start") {
        await api.post(`/campaigns/${id}/start`, { startNow: true });
        toast.success(t("toast.started"));
      } else if (type === "pause") {
        await api.post(`/campaigns/${id}/pause`);
        toast.success(t("toast.paused"));
      } else if (type === "resume") {
        await api.post(`/campaigns/${id}/resume`);
        toast.success(t("toast.resumed"));
      } else if (type === "cancel") {
        await api.post(`/campaigns/${id}/cancel`);
        toast.success(t("toast.cancelled"));
      } else if (type === "retry") {
        const res = await api.post(`/campaigns/${id}/retry-failed`);
        toast.success(t("toast.retried", { count: res.data?.retried ?? 0 }));
      } else if (type === "delete") {
        await api.delete(`/campaigns/${id}`);
        toast.success(t("toast.deleted"));
        router.push("/campaigns");
        return;
      }
      setConfirm({ open: false, type: null });
      fetchCampaign();
      fetchRecipients({ page: 1 });
    } catch (error) {
      toast.error(normalizeAxiosError(error) || t("toast.actionFailed"));
    } finally {
      setActing(false);
    }
  };

  const status = campaign?.status;
  const headerButtons = (
    <div className="flex flex-wrap items-center gap-2">
      {status === "scheduled" && (
        <Button_ size="sm" variant="solid" label={t("actions.edit")} icon={<Edit size={16} />} permission="campaigns.update" onClick={() => router.push(`/campaigns/${id}/edit`)} />
      )}
      {status === "scheduled" && (
        <Button_ size="sm" variant="outline" label={t("actions.startNow")} icon={<Play size={16} />} permission="campaigns.start" onClick={() => setConfirm({ open: true, type: "start" })} />
      )}
      {status === "running" && (
        <Button_ size="sm" variant="outline" label={t("actions.pause")} icon={<Pause size={16} />} permission="campaigns.update" onClick={() => runAction("pause")} />
      )}
      {status === "paused" && (
        <Button_ size="sm" variant="solid" label={t("actions.resume")} icon={<Play size={16} />} permission="campaigns.update" onClick={() => runAction("resume")} />
      )}
      {["scheduled", "running", "paused"].includes(status) && (
        <Button_ size="sm" variant="outline" label={t("actions.cancel")} icon={<Ban size={16} />} permission="campaigns.update" onClick={() => setConfirm({ open: true, type: "cancel" })} />
      )}
      {status === "failed" && (
        <Button_ size="sm" variant="outline" label={t("actions.retryFailed")} icon={<RotateCcw size={16} />} permission="campaigns.start" onClick={() => setConfirm({ open: true, type: "retry" })} />
      )}
      <Button_ size="sm" variant="outline" label={t("actions.duplicate")} icon={<Copy size={16} />} permission="campaigns.create" onClick={() => router.push(`/campaigns/new?fromId=${id}`)} />
      {status !== "running" && status !== "paused" && (
        <Button_ size="sm" variant="outline" label={t("actions.delete")} icon={<Trash2 size={16} />} permission="campaigns.delete" onClick={() => setConfirm({ open: true, type: "delete" })} />
      )}
    </div>
  );

  const columns = [
    {
      key: "name",
      header: td("columns.name"),
      className: "min-w-[180px]",
      cell: (row) => (
        <div className="min-w-0">
          <span className="block text-sm font-semibold truncate">{row.name || "—"}</span>
          <span className="block text-xs text-muted-foreground" dir="ltr">{row.phoneNumber}</span>
        </div>
      ),
    },
    {
      key: "status",
      header: td("columns.status"),
      cell: (row) => (
        <Badge variant="outline" className={cn("font-medium", STATUS_BADGE_CLASS[row.deliveryStatus])}>
          {td(`recipientStatus.${row.deliveryStatus || "pending"}`)}
        </Badge>
      ),
    },
    {
      key: "sentAt",
      header: td("columns.sentAt"),
      cell: (row) => <span className="text-xs text-muted-foreground whitespace-nowrap">{formatDate(row.sentAt)}</span>,
    },
    {
      key: "deliveredAt",
      header: td("columns.deliveredAt"),
      cell: (row) => <span className="text-xs text-muted-foreground whitespace-nowrap">{formatDate(row.deliveredAt)}</span>,
    },
    {
      key: "read",
      header: td("columns.read"),
      cell: (row) => (row.isRead ? <Check size={15} className="text-emerald-600" /> : <span className="text-muted-foreground">—</span>),
    },
    {
      key: "replied",
      header: td("columns.replied"),
      cell: (row) => (row.hasReplied ? <Check size={15} className="text-emerald-600" /> : <span className="text-muted-foreground">—</span>),
    },
    {
      key: "order",
      header: td("columns.order"),
      cell: (row) => (
        <span className="text-xs tabular-nums" dir="ltr">
          {row.order?.orderNumber || "—"}
        </span>
      ),
    },
    {
      key: "cost",
      header: td("columns.cost"),
      cell: (row) => (
        <span className="text-xs tabular-nums whitespace-nowrap" dir="ltr">
          {row.costChargedAt || Number(row.costAmount) > 0 ? formatUsd(row.costAmount) : "—"}
        </span>
      ),
    },
    {
      key: "failureReason",
      header: td("columns.failureReason"),
      className: "min-w-[180px]",
      cell: (row) =>
        row.failureReason ? (
          <span className="block text-xs text-red-600 dark:text-red-400 leading-5" title={row.failureReason}>
            {row.failureReason}
          </span>
        ) : (
          <span className="text-muted-foreground">—</span>
        ),
    },
    {
      key: "actions",
      header: td("columns.actions"),
      className: "md:sticky md:z-20",
      cell: (row) => {
        const orderId = row.orderId || row.order?.id;
        if (!orderId) return <span className="text-muted-foreground">—</span>;
        return (
          <ActionButtons
            row={row}
            actions={[
              {
                icon: <Eye />,
                tooltip: td("actions.viewOrder"),
                variant: "blue",
                permission: "orders.read",
                onClick: () => router.push(`/orders/details/${orderId}`),
              },
            ]}
          />
        );
      },
    },
  ];

  if (loading) {
    return (
      <div className="min-h-screen p-5 space-y-4">
        <PageHeader breadcrumbs={[{ name: t("breadcrumb.home"), href: "/dashboard" }, { name: t("breadcrumb.campaigns"), href: "/campaigns" }, { name: td("title") }]} />
        <div className="rounded-2xl border border-border bg-card p-5 space-y-3">
          <Bone className="h-7 w-64 max-w-full" />
          <Bone className="h-4 w-96 max-w-full" />
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 pt-2">
            {[0, 1, 2, 3].map((i) => <Bone key={i} className="h-16 rounded-xl" />)}
          </div>
        </div>
      </div>
    );
  }

  if (!campaign) {
    return (
      <div className="min-h-screen p-5 space-y-4">
        <PageHeader breadcrumbs={[{ name: t("breadcrumb.home"), href: "/dashboard" }, { name: t("breadcrumb.campaigns"), href: "/campaigns" }, { name: td("title") }]} />
        <div className="rounded-2xl border border-red-200 bg-red-50 p-6 text-red-700 dark:border-red-900/40 dark:bg-red-950/30">
          <p className="font-bold">{td("notFound")}</p>
          <div className="mt-4">
            <Button_ size="sm" variant="outline" label={tw("backToList")} onClick={() => router.push("/campaigns")} />
          </div>
        </div>
      </div>
    );
  }

  const snap = campaign.templateConfigSnapshot || {};
  const headerVars = Object.entries(snap.headerVariables || {});
  const bodyVars = Object.entries(snap.bodyVariables || {});
  const buttonVars = Object.entries(snap.buttonVariables || {});

  let segTypeLabel = campaign.audienceSegment?.type || "";
  try {
    if (campaign.audienceSegment?.type) segTypeLabel = tSeg(`types.${campaign.audienceSegment.type}`);
  } catch { /* fallback */ }

  const confirmCopy = {
    start: { title: t("confirm.startTitle"), description: t("confirm.startDesc", { name: campaign.name }), confirmText: t("actions.startNow") },
    cancel: { title: t("confirm.cancelTitle"), description: t("confirm.cancelDesc", { name: campaign.name }), confirmText: t("actions.cancel") },
    retry: { title: t("confirm.retryTitle"), description: t("confirm.retryDesc", { name: campaign.name }), confirmText: t("actions.retryFailed") },
    delete: { title: t("confirm.deleteTitle"), description: t("confirm.deleteDesc", { name: campaign.name }), confirmText: t("actions.delete") },
  }[confirm.type] || {};
  console.log(fromApiFilter(campaign.audienceFilter))
  return (
    <div className="min-h-screen p-5 space-y-4">
      <PageHeader
        breadcrumbs={[
          { name: t("breadcrumb.home"), href: "/dashboard" },
          { name: t("breadcrumb.campaigns"), href: "/campaigns" },
          { name: campaign.name || td("title") },
        ]}
        stats={statsCards}
        buttons={headerButtons}
      />

      <section className="rounded-2xl border border-border/70 bg-card p-5 sm:p-6 shadow-sm">
        <div className="flex items-center gap-4">
          <span className="grid h-16 w-16 shrink-0 place-items-center rounded-2xl bg-primary/10 text-primary">
            <Megaphone size={28} />
          </span>
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="truncate text-2xl font-black">{campaign.name}</h1>
              <Badge variant="outline" className={cn("font-medium", STATUS_BADGE_CLASS[status])}>
                {t(`status.${status || "draft"}`)}
              </Badge>
              <Badge variant="outline" className="font-medium">{t(`channels.${campaign.channel || "whatsapp"}`)}</Badge>
            </div>
            {campaign.description && <p className="mt-1 text-sm text-muted-foreground">{campaign.description}</p>}
          </div>
        </div>
        <div className="mt-5 grid grid-cols-1 gap-0 overflow-hidden rounded-2xl border border-border/60 bg-background/60 md:grid-cols-2 xl:grid-cols-4">
          <InfoBlock label={td("fields.schedule")} value={campaign.scheduleMode === "scheduled" ? formatDate(campaign.scheduledAt) : tw("scheduleNow")} />
          <InfoBlock label={tw("workingHours")} value={campaign.workingHoursStart ? `${campaign.workingHoursStart} → ${campaign.workingHoursEnd}` : td("fields.off")} />
          <InfoBlock label={tw("delayMax")} value={`${campaign.delayMinSeconds ?? "—"}s → ${campaign.delayMaxSeconds ?? "—"}s`} />
          <InfoBlock label={tw("maxPerHour")} value={campaign.maxMessagesPerHour ?? "—"} />
        </div>
      </section>

      <section className="rounded-2xl border border-border/70 bg-card p-5 sm:p-6 shadow-sm">
        <SectionTitle title={td("sections.general")} />
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          <DetailTile label={tw("category")} value={campaign.category ? tw(`categories.${campaign.category}`) : "—"} />
          <DetailTile label={td("fields.createdAt")} value={formatDate(campaign.createdAt)} />
          <DetailTile label={td("fields.startedAt")} value={formatDate(campaign.startedAt)} />
          <DetailTile label={td("fields.completedAt")} value={formatDate(campaign.completedAt)} />
          <DetailTile label={td("fields.cost")} value={<span dir="ltr">{formatUsd(campaign.costAmount)}</span>} />
          <DetailTile label={td("fields.sales")} value={Number(campaign.salesAmount || 0).toLocaleString()} />
        </div>
      </section>

      {campaign.enablePurchasePage && (
        <section className="rounded-2xl border border-border/70 bg-card p-5 sm:p-6 shadow-sm space-y-3">
          <SectionTitle title={td("sections.offer")} />
          <div className="flex flex-wrap items-center gap-2">
            <Badge variant="outline">
              {tw("offer.followup")}: {campaign.orderReplyFollowupEnabled ? tw("review.on") : tw("review.offHours")}
            </Badge>
          </div>

          <div className="space-y-2">
            <p className="text-[11px] font-black uppercase tracking-widest text-muted-foreground">{tw("offer.products")}</p>
            {!(campaign.products || []).length ? (
              <p className="text-sm text-muted-foreground">{tw("review.productsEmpty")}</p>
            ) : (
              (campaign.products || []).map((p, index) => (
                <div
                  key={`${p.variantId || p.sku || p.name}-${index}`}
                  className="flex items-start gap-3 rounded-xl border border-border bg-muted/30 p-3"
                >
                  {p.image ? (
                    <img
                      src={avatarSrc(p.image)}
                      alt=""
                      className="h-12 w-12 shrink-0 rounded-lg object-cover border border-border"
                    />
                  ) : null}
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-bold">{p.name || "—"}</p>
                    <p className="mt-0.5 text-xs text-muted-foreground">{p.sku || "—"}</p>
                  </div>
                  <div className="shrink-0 text-end text-sm">
                    <p className="font-medium tabular-nums">{tw("offer.quantity")}: {Number(p.quantity || 1)}</p>
                    <p className="text-xs text-muted-foreground tabular-nums">
                      {tw("offer.salePrice")}: {formatCurrency(Number(p.price || 0))}
                    </p>
                  </div>
                </div>
              ))
            )}
          </div>

          <div className="rounded-xl border border-border bg-muted/30 px-3 py-2 text-sm space-y-1">
            <div className="flex justify-between gap-3">
              <span className="text-muted-foreground">{tw("offer.shipping")}</span>
              <span className="font-medium tabular-nums">{formatCurrency(Number(campaign.shippingPrice || 0))}</span>
            </div>
            <div className="flex justify-between gap-3 font-semibold">
              <span>{tw("review.basketTotal")}</span>
              <span className="tabular-nums">
                {formatCurrency(
                  (campaign.products || []).reduce(
                    (sum, p) => sum + Number(p.price || 0) * Number(p.quantity || 1),
                    0,
                  ) + Number(campaign.shippingPrice || 0),
                )}
              </span>
            </div>
          </div>

          {campaign.orderReplyFollowupEnabled && (
            <div className="space-y-2">
              <p className="text-[11px] font-black uppercase tracking-widest text-muted-foreground">{tw("offer.followup")}</p>
              <div className="rounded-xl border border-border bg-muted/30 p-3 space-y-3">
                <div>
                  <p className="text-xs text-muted-foreground">{tw("review.followupButton")}</p>
                  <p className="mt-1 text-sm font-medium">
                    {inspectTemplateOrderLink(snap).quickReplies.find(
                      (btn) => btn.index === Number(campaign.orderReplyFollowupButtonIndex),
                    )?.text || campaign.orderReplyFollowupButtonText || "—"}
                  </p>
                </div>
                <div>
                  <p className="mb-1 text-xs text-muted-foreground">{tw("review.followupMessage")}</p>
                  <VariableTextPreview
                    text={campaign.orderReplyFollowupText}
                    variables={placeholderChips}
                    locale={locale}
                    empty="—"
                  />
                </div>
              </div>
            </div>
          )}
        </section>
      )}

      <section className="rounded-2xl border border-border/70 bg-card p-5 sm:p-6 shadow-sm">
        <SectionTitle title={td("sections.audience")} />
        <Badge variant="outline">{tw(`recipients.${campaign.audienceType === "customers" ? "customers" : campaign.audienceType}`)}</Badge>
        {campaign.audienceType === "segment" && (
          <div className="mt-3 flex items-center gap-3 rounded-xl border border-border bg-muted/30 p-3">
            <span className="min-w-0 flex-1">
              <span className="block truncate text-sm font-bold">{campaign.audienceSegment?.name || campaign.audienceSegmentId}</span>
              <span className="block text-xs text-muted-foreground">
                {(campaign.audienceSegment?.estimatedRecipientsCount ?? campaign.audienceSegment?.frozenRecipientsCount ?? campaign.estimatedRecipientsCount ?? "—") + (segTypeLabel ? ` · ${segTypeLabel}` : "")}
              </span>
            </span>
            {segTypeLabel && <Badge variant="outline">{segTypeLabel}</Badge>}
          </div>
        )}
        {campaign.audienceType === "file" && (
          <p className="mt-3 text-sm">
            <span className="font-medium" dir="ltr">{String(campaign.audienceFileUrl || "").split("/").pop()}</span>
            <span className="ms-2 text-xs text-muted-foreground">
              {td("fields.estimated")}: {Number(campaign.estimatedRecipientsCount || 0).toLocaleString()}
            </span>
          </p>
        )}
        {campaign.audienceType === "manual" && (
          <p className="mt-3 text-sm text-muted-foreground">
            {tw("recipients.numbersFound", { count: (campaign.audienceManualSnapshot || []).length })}
          </p>
        )}
        {campaign.audienceType === "customers" && (
          <div className="mt-3">
            {metadata ? (
              <AudienceFilterSummary value={fromApiFilter(campaign.audienceFilter)} metadata={metadata} lookups={fieldOptions} />
            ) : (
              <p className="text-xs text-muted-foreground">{tw("recipients.loading")}</p>
            )}
          </div>
        )}
      </section>

      <section className="rounded-2xl border border-border/70 bg-card p-5 sm:p-6 shadow-sm">
        <SectionTitle title={td("sections.channel")} />
        {campaign.templateId || snap.templateData ? (
          <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,1fr)_300px] gap-5">
            <div className="space-y-4 min-w-0">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="rounded-xl border border-border/70 bg-muted/20 px-4 py-3">
                  <p className="text-[11px] font-black uppercase tracking-widest text-muted-foreground">
                    {td("fields.account")}
                  </p>
                  <p className="mt-1 truncate text-sm font-bold">
                    {whatsappAccount?.name ||
                      whatsappAccount?.mobileNumber ||
                      (snap.accountId ? "—" : tw("message.account"))}
                  </p>
                  {whatsappAccount?.name && whatsappAccount?.mobileNumber ? (
                    <p className="mt-0.5 text-xs text-muted-foreground" dir="ltr">
                      {whatsappAccount.mobileNumber}
                    </p>
                  ) : !whatsappAccount && snap.accountId ? (
                    <p className="mt-0.5 truncate text-[11px] text-muted-foreground" dir="ltr">
                      {snap.accountId}
                    </p>
                  ) : null}
                </div>
                <div className="rounded-xl border border-border/70 bg-muted/20 px-4 py-3">
                  <p className="text-[11px] font-black uppercase tracking-widest text-muted-foreground">
                    {td("fields.template")}
                  </p>
                  <p className="mt-1 truncate text-sm font-bold" dir="ltr">
                    {campaign.template?.name || campaign.templateId || "—"}
                  </p>
                </div>
              </div>

              {(headerVars.length > 0 || bodyVars.length > 0 || buttonVars.length > 0) && (
                <div className="overflow-hidden rounded-xl border border-border/70">
                  <div className="grid grid-cols-[minmax(7rem,0.4fr)_1fr] gap-x-3 border-b border-border/60 bg-muted/40 px-4 py-2 text-[11px] font-black uppercase tracking-widest text-muted-foreground">
                    <span>{td("fields.variable")}</span>
                    <span>{td("fields.value")}</span>
                  </div>
                  <VariableGroup title={td("fields.headerVars")} rows={headerVars} variables={placeholderChips} locale={locale} />
                  <VariableGroup title={td("fields.bodyVars")} rows={bodyVars} variables={placeholderChips} locale={locale} />
                  <VariableGroup
                    title={td("fields.buttonVars")}
                    rows={buttonVars}
                    variables={placeholderChips}
                    locale={locale}
                    labelFor={(k, v) => v?.label || snap.templateData?.buttons?.[Number(k)]?.text || `{{${k}}}`}
                  />
                </div>
              )}
            </div>
            {snap.templateData && (
              <div className="rounded-xl border border-border bg-muted/30 p-4 h-fit">
                <TemplatePreview
                  {...campaignTemplateChipPreview(snap, {
                    chipVariables: placeholderChips,
                    headerUrl: snap?.headerUrl ? avatarSrc(snap.headerUrl) : undefined,
                  })}
                  flat
                />
              </div>
            )}
          </div>
        ) : (
          <p className="text-sm text-muted-foreground">—</p>
        )}
      </section>

      <Table
        tableKey="campaign-recipients"
        searchValue={search}
        onSearchChange={setSearch}
        onSearch={() => {
          setPage(1);
          setDebouncedSearch(search);
        }}
        filters={
          <FilterField label={td("filters.status")}>
            <Select value={statusFilter} onValueChange={(v) => setStatusFilter(v)}>
              <SelectTrigger className="h-10 rounded-xl border-border bg-background text-sm">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{tc("all")}</SelectItem>
                {RECIPIENT_STATUSES.map((s) => (
                  <SelectItem key={s} value={s}>
                    {td(`recipientStatus.${s}`)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </FilterField>
        }
        hasActiveFilters={appliedStatus !== "all"}
        onApplyFilters={() => {
          setPage(1);
          setAppliedStatus(statusFilter);
          fetchRecipients({ page: 1, status: statusFilter });
        }}
        labels={{
          searchPlaceholder: td("table.searchPlaceholder"),
          filter: tc("filter"),
          apply: tc("apply"),
          emptyTitle: td("table.emptyTitle"),
          emptySubtitle: td("table.emptySubtitle"),
        }}
        columns={columns}
        data={records}
        isLoading={tableLoading}
        rowKey={(row) => row.id}
        pagination={{ total_records: totalRecords, current_page: page, per_page: limit }}
        onPageChange={({ page: p, per_page: l }) => {
          setPage(p);
          setLimit(l);
          fetchRecipients({ page: p, limit: l });
        }}
        compact
        striped
      />

      <ConfirmDialog
        open={confirm.open}
        onOpenChange={(open) => {
          if (!open) setConfirm({ open: false, type: null });
        }}
        title={confirmCopy.title}
        description={confirmCopy.description}
        confirmText={confirmCopy.confirmText}
        loading={acting}
        onConfirm={() => runAction(confirm.type)}
      />
    </div>
  );
}

function VariableGroup({ title, rows, labelFor, variables = [], locale }) {
  if (!rows?.length) return null;
  return (
    <div className="border-b border-border/50 last:border-b-0">
      <p className="bg-muted/25 px-4 py-2 text-[11px] font-black uppercase tracking-widest text-muted-foreground">
        {title}
      </p>
      <ul className="divide-y divide-border/40">
        {rows.map(([key, item]) => (
          <li
            key={`${title}-${key}`}
            className="grid grid-cols-[minmax(7rem,0.4fr)_1fr] items-start gap-x-3 px-4 py-2.5"
          >
            <code className="mt-0.5 truncate text-xs font-semibold text-muted-foreground">
              {labelFor ? labelFor(key, item) : `{{${key}}}`}
            </code>
            <VariableTextPreview
              text={item?.value}
              variables={variables}
              locale={locale}
              empty="—"
              className="text-sm font-medium leading-5"
            />
          </li>
        ))}
      </ul>
    </div>
  );
}

function SectionTitle({ title }) {
  return <h2 className="mb-3 text-base font-black">{title}</h2>;
}

function InfoBlock({ label, value }) {
  return (
    <div className="min-h-24 p-5 border-b border-border/60 md:odd:border-e md:nth-last-[-n+2]:border-b-0 xl:border-b-0 xl:border-e xl:last:border-e-0">
      <p className="text-xs font-black text-muted-foreground">{label}</p>
      <p className="mt-2 wrap-break-word text-sm font-black leading-6">{value ?? "—"}</p>
    </div>
  );
}

function DetailTile({ label, value }) {
  return (
    <div className="flex items-center gap-3 p-3 rounded-xl border bg-muted/5">
      <div className="min-w-0">
        <p className="text-xs text-muted-foreground">{label}</p>
        <p className="font-bold break-words">{value ?? "—"}</p>
      </div>
    </div>
  );
}
