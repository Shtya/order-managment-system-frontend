"use client";

import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  useRef,
} from "react";
import api from "@/utils/api";
import { useSocket } from "./SocketContext";

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
        setNotifications((prev) => [payload, ...prev]);
        setTotal((prev) => prev + 1);
      }
    });
    return unsubscribe;
  }, [subscribe]);

  const handleMarkAsRead = useCallback(
    async (id) => {
      const originalNotifications = [...notifications];
      setNotifications((prev) =>
        prev.map((n) => (n.id === id ? { ...n, isRead: true } : n)),
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
