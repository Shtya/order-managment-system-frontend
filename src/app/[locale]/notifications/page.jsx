"use client";

import React, { useCallback, useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Bell,
  BellOff,
  CheckCheck,
  ChevronLeft,
  Filter,
  Inbox,
  Loader2,
  RefreshCw,
  Search,
  X,
} from "lucide-react";
import { useTranslations } from "next-intl";
import { useRouter } from "@/i18n/navigation";
import toast from "react-hot-toast";
import { cn } from "@/utils/cn";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import api from "@/utils/api";
import { useSocket } from "@/context/SocketContext";

// ─────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────
export function getNotificationLink(type, id) {
  if (!type || !id) return "#";
  const map = {
    order: `/orders/${id}`,
    user: `/users/${id}`,
    product: `/products/${id}`,
  };
  return map[type?.toLowerCase()] ?? "#";
}

function getNotificationIcon(type) {
  const icons = {
    order: "🛒",
    user: "👤",
    product: "📦",
    system: "⚙️",
    payment: "💳",
    alert: "⚠️",
  };
  return icons[type?.toLowerCase()] ?? "🔔";
}

function formatRelativeDate(dateStr, t) {
  if (!dateStr) return "";
  const date = new Date(dateStr);
  const now = new Date();
  const diff = now - date;
  const mins = Math.floor(diff / 60_000);
  const hours = Math.floor(diff / 3_600_000);
  const days = Math.floor(diff / 86_400_000);

  if (mins < 1) return t("justNow");
  if (mins < 60) return `${t("minutesAgo", { count: mins })}`;
  if (hours < 24) return `${t("hoursAgo", { count: hours })}`;
  if (days < 7) return `${t("daysAgo", { count: days })}`;
  return date.toLocaleDateString("ar-EG");
}

// ─────────────────────────────────────────────
// Skeleton row
// ─────────────────────────────────────────────
function NotificationSkeleton() {
  return (
    <div className="flex items-start gap-4 px-5 py-4 border-b border-border/40 animate-pulse">
      <div className="w-10 h-10 rounded-xl bg-muted/60 shrink-0" />
      <div className="flex-1 space-y-2">
        <div className="h-3.5 w-40 rounded-xl bg-muted/60" />
        <div className="h-3 w-64 rounded-xl bg-muted/40" />
      </div>
      <div className="h-3 w-14 rounded-xl bg-muted/40 shrink-0" />
    </div>
  );
}

// ─────────────────────────────────────────────
// Single notification row
// ─────────────────────────────────────────────
function NotificationRow({ n, idx, onRead, t }) {
  const router = useRouter();

  const handleClick = async () => {
    if (!n.isRead) await onRead(n.id);
    const link = getNotificationLink(n.relatedEntityType, n.relatedEntityId);
    if (link !== "#") router.push(link);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: Math.min(idx * 0.04, 0.3), duration: 0.2 }}
      onClick={handleClick}
      className={cn(
        "group relative flex items-start gap-4 px-5 py-4",
        "border-b border-border/40 last:border-0",
        "hover:bg-[var(--secondary)] transition-colors duration-150 cursor-pointer",
        !n.isRead && "bg-[color-mix(in_oklab,var(--primary)_3%,transparent)]"
      )}
    >
      {/* Unread bar */}
      {!n.isRead && (
        <span className="absolute right-0 top-1/2 -translate-y-1/2 w-1 h-8 rounded-full bg-[var(--primary)]" />
      )}

      {/* Icon bubble */}
      <div className={cn(
        "w-10 h-10 rounded-xl flex items-center justify-center text-lg shrink-0",
        "border border-border/60",
        n.isRead
          ? "bg-[var(--secondary)]"
          : "bg-[color-mix(in_oklab,var(--primary)_10%,transparent)] border-[color-mix(in_oklab,var(--primary)_20%,transparent)]"
      )}>
        {getNotificationIcon(n.relatedEntityType)}
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0 space-y-0.5">
        <p className={cn(
          "text-sm leading-snug",
          n.isRead ? "font-medium text-foreground" : "font-bold text-foreground"
        )}>
          {n.title}
        </p>
        <p className="text-xs text-muted-foreground line-clamp-2 leading-relaxed">
          {n.message}
        </p>
      </div>

      {/* Meta */}
      <div className="shrink-0 flex flex-col items-end gap-1.5 pt-0.5">
        <span className="text-[10px] text-muted-foreground whitespace-nowrap">
          {formatRelativeDate(n.createdAt, t)}
        </span>
        {!n.isRead && (
          <span className="w-2 h-2 rounded-full bg-[var(--primary)]" />
        )}
      </div>
    </motion.div>
  );
}

// ─────────────────────────────────────────────
// Filter pill button
// ─────────────────────────────────────────────
function FilterPill({ active, onClick, children }) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all duration-150",
        active
          ? "bg-[color-mix(in_oklab,var(--primary)_12%,transparent)] text-[var(--primary)] border border-[color-mix(in_oklab,var(--primary)_25%,transparent)]"
          : "bg-[var(--secondary)] text-muted-foreground border border-border/60 hover:border-border"
      )}
    >
      {children}
    </button>
  );
}

// ─────────────────────────────────────────────
// MAIN PAGE
// ─────────────────────────────────────────────
export default function NotificationsPage() {
  const tN = useTranslations("notifications");
  const router = useRouter();

  // ── State ──
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [markingAll, setMarkingAll] = useState(false);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [filter, setFilter] = useState("all"); // "all" | "unread" | "read"
  const { unreadNotificationsCount, incrementUnread, decrementUnread, resetUnread, subscribe } = useSocket()

  const LIMIT = 10;
  const hasMore = notifications.length < total;
  const searchTimer = useRef(null);

  // ── Debounce search ──
  useEffect(() => {
    clearTimeout(searchTimer.current);
    searchTimer.current = setTimeout(() => setDebouncedSearch(search), 350);
    return () => clearTimeout(searchTimer.current);
  }, [search]);

  useEffect(() => {
    const unsubscribe = subscribe("NEW_NOTIFICATION_PAGE", (action) => {
      if (action.type === "NEW_NOTIFICATION") {
        const newNotification = action.payload;

        setNotifications((prev) => {
          // لو الإشعار موجود بالفعل (احتياط)
          if (prev.some((n) => n.id === newNotification.id)) {
            return prev;
          }

          return [newNotification, ...prev]; // 🔥 أهم سطر
        });

        setTotal((prev) => prev + 1);
      }
    });

    return unsubscribe;
  }, [subscribe]);


  // ── Fetch on filter / search change ──
  useEffect(() => {
    setPage(1);
    setNotifications([]);
    fetchNotifications(1, true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filter, debouncedSearch]);

  // ── API: fetch ──
  const fetchNotifications = useCallback(async (pageNum = 1, reset = false) => {
    try {
      reset ? setLoading(true) : setLoadingMore(true);

      const params = {
        page: pageNum,
        limit: LIMIT,
        ...(debouncedSearch && { search: debouncedSearch }),
        ...(filter === "unread" && { isRead: false }),
        ...(filter === "read" && { isRead: true }),
      };

      const res = await api.get("/notifications", { params });
      const records = res.data.records ?? [];
      const totalRecords = res.data.total_records ?? 0;

      setTotal(totalRecords);
      setNotifications((prev) => (reset ? records : [...prev, ...records]));
    } catch (err) {
      console.error(err);
      toast.error(tN("errors.fetchFailed"));
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  }, [debouncedSearch, filter, tN]);

  // ── API: mark one as read ──
  const handleMarkAsRead = useCallback(async (id) => {
    try {
      incrementUnread()
      await api.patch(`/notifications/${id}/read`);
      setNotifications((prev) =>
        prev.map((n) => (n.id === id ? { ...n, isRead: true } : n))
      );

    } catch (e) {
      decrementUnread()
      console.error(e);
    }
  }, []);

  // ── API: mark all read ──
  const handleMarkAllRead = useCallback(async () => {
    try {
      setMarkingAll(true);
      resetUnread()
      setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
      await api.post("/notifications/read-all");
      toast.success(tN("allMarkedRead"));
    } catch (e) {

    } finally {
      setMarkingAll(false);
    }
  }, [tN]);

  // ── Load more ──
  const handleLoadMore = () => {
    const next = page + 1;
    setPage(next);
    fetchNotifications(next, false);
  };

  // ── Refresh ──
  const handleRefresh = () => {
    setPage(1);
    setNotifications([]);
    fetchNotifications(1, true);
  };

  const unreadInList = notifications.filter((n) => !n.isRead).length;

  return (
    <div className="min-h-screen p-4 md:p-6 bg-background">

      {/* ── Breadcrumb ── */}
      <div className="flex items-center gap-2 text-sm text-muted-foreground mb-6">
        <span
          className="hover:text-foreground cursor-pointer transition"
          onClick={() => router.push("/")}
        >
          {tN("breadcrumb.home")}
        </span>
        <ChevronLeft size={15} className="rtl:rotate-180" />
        <span className="text-[var(--primary)] font-semibold">
          {tN("breadcrumb.current")}
        </span>
      </div>

      {/* ── Page header ── */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center justify-between flex-wrap gap-4 mb-6"
      >
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-[color-mix(in_oklab,var(--primary)_12%,transparent)] border border-[color-mix(in_oklab,var(--primary)_20%,transparent)] flex items-center justify-center">
            <Bell size={18} className="text-[var(--primary)]" />
          </div>
          <div>
            <h1 className="text-lg font-bold text-foreground">{tN("title")}</h1>
            <p className="text-xs text-muted-foreground">
              {total > 0
                ? tN("subtitle", { total, unread: unreadNotificationsCount })
                : tN("subtitleEmpty")}
            </p>
          </div>
          {/* Live unread count badge — fed by socket later */}
          {unreadNotificationsCount > 0 && (
            <Badge className="rounded-xl px-2.5 py-1 text-xs font-bold
              bg-[color-mix(in_oklab,var(--primary)_12%,transparent)]
              text-[var(--primary)]
              border border-[color-mix(in_oklab,var(--primary)_25%,transparent)]">
              {unreadNotificationsCount} {tN("unread")}
            </Badge>
          )}
        </div>

        {/* Actions */}
        <div className="flex items-center gap-2">
          <button
            onClick={handleRefresh}
            disabled={loading}
            className="inline-flex items-center gap-2 px-3 py-2 rounded-xl text-sm font-semibold
              bg-[var(--secondary)] border border-border/60 text-muted-foreground
              hover:text-foreground hover:border-border transition"
          >
            <RefreshCw size={14} className={cn(loading && "animate-spin")} />
            {tN("refresh")}
          </button>

          {unreadInList > 0 && (
            <button
              onClick={handleMarkAllRead}
              disabled={markingAll}
              className="inline-flex items-center gap-2 px-3 py-2 rounded-xl text-sm font-semibold
                bg-[color-mix(in_oklab,var(--primary)_10%,transparent)]
                text-[var(--primary)]
                border border-[color-mix(in_oklab,var(--primary)_22%,transparent)]
                hover:opacity-80 transition"
            >
              {markingAll
                ? <Loader2 size={14} className="animate-spin" />
                : <CheckCheck size={14} />
              }
              {tN("markAllRead")}
            </button>
          )}
        </div>
      </motion.div>

      {/* ── Main card ── */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.05 }}
        className="bg-card rounded-xl border border-border/60 shadow-sm overflow-hidden"
      >

        {/* ── Toolbar: search + filters ── */}
        <div className="flex items-center gap-3 flex-wrap px-5 py-4 border-b border-border/40">
          {/* Search */}
          <div className="relative flex-1 min-w-[200px]">
            <Search size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder={tN("searchPlaceholder")}
              className="w-full h-9 pr-9 pl-3 rounded-xl border border-border/60 bg-[var(--secondary)]
                text-sm text-foreground placeholder:text-muted-foreground
                focus:outline-none focus:ring-2 focus:ring-[var(--primary)]/20 focus:border-[var(--primary)]/40 transition"
            />
            {search && (
              <button
                onClick={() => setSearch("")}
                className="absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition"
              >
                <X size={13} />
              </button>
            )}
          </div>

          {/* Filter pills */}
          <div className="flex items-center gap-2">
            <FilterPill active={filter === "all"} onClick={() => setFilter("all")}>
              {tN("filters.all")}
            </FilterPill>
            <FilterPill active={filter === "unread"} onClick={() => setFilter("unread")}>
              {tN("filters.unread")}
            </FilterPill>
            <FilterPill active={filter === "read"} onClick={() => setFilter("read")}>
              {tN("filters.read")}
            </FilterPill>
          </div>
        </div>

        {/* ── List ── */}
        <div className="divide-y divide-border/30">
          <AnimatePresence mode="wait">

            {/* Loading skeleton */}
            {loading && (
              <motion.div key="skeleton" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                {Array.from({ length: 6 }).map((_, i) => (
                  <NotificationSkeleton key={i} />
                ))}
              </motion.div>
            )}

            {/* Empty state */}
            {!loading && notifications.length === 0 && (
              <motion.div
                key="empty"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                className="flex flex-col items-center justify-center py-20 gap-4 text-center"
              >
                <div className="w-16 h-16 rounded-xl bg-[var(--secondary)] border border-border/60 flex items-center justify-center">
                  {filter === "unread"
                    ? <BellOff size={28} className="text-muted-foreground" />
                    : <Inbox size={28} className="text-muted-foreground" />
                  }
                </div>
                <div>
                  <p className="text-sm font-bold text-foreground mb-1">
                    {filter === "unread" ? tN("empty.noUnread") : tN("empty.noNotifications")}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {tN("empty.description")}
                  </p>
                </div>
                {filter !== "all" && (
                  <button
                    onClick={() => setFilter("all")}
                    className="text-xs font-semibold text-[var(--primary)] hover:underline"
                  >
                    {tN("empty.showAll")}
                  </button>
                )}
              </motion.div>
            )}

            {/* Notification rows */}
            {!loading && notifications.length > 0 && (
              <motion.div key="list" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                {notifications.map((n, idx) => (
                  <NotificationRow
                    key={n.id}
                    n={n}
                    idx={idx}
                    onRead={handleMarkAsRead}
                    t={tN}
                  />
                ))}
              </motion.div>
            )}

          </AnimatePresence>
        </div>

        {/* ── Load more / footer ── */}
        {!loading && notifications.length > 0 && (
          <div className="px-5 py-4 border-t border-border/40 flex items-center justify-between">
            <p className="text-xs text-muted-foreground">
              {tN("showing", { shown: notifications.length, total })}
            </p>

            {hasMore ? (
              <button
                onClick={handleLoadMore}
                disabled={loadingMore}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold
                  bg-[color-mix(in_oklab,var(--primary)_10%,transparent)]
                  text-[var(--primary)]
                  border border-[color-mix(in_oklab,var(--primary)_22%,transparent)]
                  hover:opacity-80 transition"
              >
                {loadingMore
                  ? <Loader2 size={14} className="animate-spin" />
                  : <Filter size={14} />
                }
                {tN("loadMore")}
              </button>
            ) : (
              <span className="text-xs text-muted-foreground">{tN("allLoaded")}</span>
            )}
          </div>
        )}

      </motion.div>
    </div>
  );
}