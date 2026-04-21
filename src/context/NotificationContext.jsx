"use client";

import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  useRef,
} from "react";
import { motion, AnimatePresence } from "framer-motion";
import api from "@/utils/api";
import { useSocket } from "./SocketContext";
import { useLocale } from "next-intl";
import toast from "react-hot-toast";
import { Bell, X } from "lucide-react";
import { cn } from "@/utils/cn";
import { useTranslations } from "use-intl";

const NotificationContext = createContext();

export function NotificationProvider({ children }) {
  const [notifications, setNotifications] = useState([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [page, setPage] = useState(1);
  const {
    unreadNotificationsCount,
    setUnreadNotificationsCount,
    decrementUnread,
    incrementUnread,
    resetUnread,
    subscribe,
  } = useSocket();
  const locale = useLocale();
  const isRtl = locale === 'ar';
  const LIMIT = 10;
  const hasMore = notifications.length < total;

  const fetchNotifications = useCallback(
    async (pageNum = 1, reset = false, params = {}) => {
      try {
        reset ? setLoading(true) : setLoadingMore(true);
        const res = await api.get("/notifications", {
          params: { page: pageNum, limit: LIMIT, ...params },
        });
        const records = res.data.records ?? [];
        const totalRecords = res.data.total_records ?? 0;

        setTotal(totalRecords);
        setNotifications((prev) => (reset ? records : [...prev, ...records]));
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
        setLoadingMore(false);
      }
    },
    [],
  );

  useEffect(() => {
    fetchNotifications(1, true);
  }, [fetchNotifications]);

  useEffect(() => {
    const unsubscribe = subscribe("NEW_NOTIFICATION", (payload) => {
      if (payload) {
        toast.custom((t) => (
          <NotificationToast toastItem={t} notification={payload} isRtl={isRtl} />
        ), {
          position: 'top-right',
          duration: 5000,
        });

        setNotifications((prev) => [payload, ...prev]);
        setTotal((prev) => prev + 1);
      }
    });
    return unsubscribe;
  }, [subscribe, isRtl]);

  const handleMarkAsRead = useCallback(
    async (id) => {
      const originalNotifications = [...notifications];
      setNotifications((prev) =>
        prev.map((n) => (n.id == id ? { ...n, isRead: true } : n)),
      );
      decrementUnread();

      try {
        await api.patch(`/notifications/${id}/read`);
      } catch (e) {
        setNotifications(originalNotifications);
        incrementUnread();
        // No need to increment, as the socket context handles the source of truth
        console.error(e);
      }
    },
    [notifications],
  );

  const handleMarkAllRead = useCallback(async () => {
    const originalNotifications = [...notifications];
    setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
    const prevUnreadCount = resetUnread();

    try {
      await api.post("/notifications/read-all");
    } catch (e) {
      setNotifications(originalNotifications);
      setUnreadNotificationsCount(prevUnreadCount);
      console.error(e);
    }
  }, [notifications]);

  const value = {
    notifications,
    total,
    loading,
    loadingMore,
    hasMore,
    page,
    setPage,
    fetchNotifications,
    handleMarkAsRead,
    handleMarkAllRead,
    unreadCount: unreadNotificationsCount,
  };

  return (
    <NotificationContext.Provider value={value}>
      {children}
    </NotificationContext.Provider>
  );
}

export const useNotification = () => useContext(NotificationContext);


function NotificationToast({ toastItem, notification, isRtl }) {
  const t = useTranslations("header");

  return (
    <motion.div
      initial={{ opacity: 0, x: isRtl ? -100 : 100, scale: 0.9 }}
      animate={{ opacity: 1, x: 0, scale: 1 }}
      exit={{ opacity: 0, scale: 0.8, transition: { duration: 0.2 } }}
      className={cn(
        "relative flex w-full max-w-[380px] overflow-hidden rounded-2xl border bg-card/95 p-4 shadow-2xl backdrop-blur-md",
        "border-border/50 ring-1 ring-black/5 dark:ring-white/5",
        t.visible ? "animate-in fade-in zoom-in" : "animate-out fade-out zoom-out"
      )}
      style={{ direction: isRtl ? 'rtl' : 'ltr' }}
    >
      {/* Accent Line */}
      <div className="absolute inset-y-0 start-0 w-1.5 bg-gradient-to-b from-primary to-primary/40" />

      <div className="flex flex-1 items-start gap-4">
        {/* Icon with Animated Background */}
        <div className="relative flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
          <Bell className="h-5 w-5 animate-bounce" />
          <span className="absolute -end-1 -top-1 flex h-3 w-3">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-primary opacity-75"></span>
            <span className="relative inline-flex h-3 w-3 rounded-full bg-primary"></span>
          </span>
        </div>

        {/* Content */}
        <div className="flex-1 space-y-1">
          <div className="flex items-center justify-between">
            <h4 className="text-[13.5px] font-bold tracking-tight text-foreground">
              {notification.title}
            </h4>
            <span className="text-[10px] font-medium text-muted-foreground/70">
              {t(`now`)}
            </span>
          </div>
          <p className="text-[12px] leading-relaxed text-muted-foreground line-clamp-2">
            {notification.message}
          </p>
        </div>

        {/* Close Button */}
        <button
          onClick={() => toast.dismiss(toastItem.id)}
          className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg text-muted-foreground/50 transition-colors hover:bg-muted hover:text-foreground"
        >
          <X size={14} strokeWidth={2.5} />
        </button>
      </div>
    </motion.div>
  );
}