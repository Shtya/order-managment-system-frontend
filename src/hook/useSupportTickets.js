import { useCallback, useEffect, useRef, useState } from "react";
import { useTranslations } from "next-intl";
import toast from "react-hot-toast";
import api, { BASE_URL } from "@/utils/api";
import { normalizeAxiosError } from "@/utils/axios";
import { useSocket } from "@/context/SocketContext";

const TENANT = "/support-tickets";
const ADMIN = "/admin/support-tickets";

/**
 * Download-manager extensions (IDM Advanced Integration, FDM, etc.) intercept
 * `fetch`/XHR blob requests to capture downloads. When they do, they replace
 * the real response with a synthetic empty 204/0-byte payload — breaking
 * `URL.createObjectURL`. Detect that scenario and fall back to a direct
 * navigation using a short-lived `auth_token` cookie (readable by the NestJS
 * server if/when you add cookie-token auth to those endpoints).
 */
function setAuthCookieForRedirect() {
  if (typeof window === "undefined") return;
  const token = localStorage.getItem("accessToken");
  if (!token) return;
  const expires = new Date(Date.now() + 60_000).toUTCString(); // 1 minute
  document.cookie = `auth_token=${encodeURIComponent(
    token,
  )}; path=/; expires=${expires}; SameSite=Lax`;
}

function cleanupAuthCookie() {
  if (typeof window === "undefined") return;
  document.cookie =
    "auth_token=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT; SameSite=Lax";
}

export const TICKET_SCOPE = {
  tenant: TENANT,
  admin: ADMIN,
};

function clean(obj = {}) {
  const out = {};
  Object.entries(obj).forEach(([key, value]) => {
    if (value === undefined || value === null || value === "") return;
    out[key] = value;
  });
  return out;
}

function buildForm(fields = {}) {
  const fd = new FormData();
  Object.entries(fields).forEach(([key, value]) => {
    if (value === undefined || value === null) return;
    if (Array.isArray(value)) {
      value.forEach((item) => fd.append(key, item));
      return;
    }
    fd.append(key, value);
  });
  return fd;
}

/**
 * Support tickets data hook.
 *
 * scope: "tenant" → regular admin dashboard (`/support-tickets`)
 *        "admin"  → super-admin support desk (`/admin/support-tickets`)
 */
export function useSupportTickets(scope = "tenant") {
  const t = useTranslations("supportTickets");
  const base = TICKET_SCOPE[scope] || TENANT;

  const [loading, setLoading] = useState(false);
  const [tickets, setTickets] = useState([]);
  const [totalRecords, setTotalRecords] = useState(0);
  const [stats, setStats] = useState(null);

  /* ── Read ─────────────────────────────────────────────── */

  const fetchList = useCallback(
    async (params = {}) => {
      setLoading(true);
      try {
        const { data } = await api.get(base, { params: clean(params) });
        setTickets(data.records || []);
        setTotalRecords(data.total_records || 0);
        return data;
      } catch (e) {
        toast.error(normalizeAxiosError(e));
        return null;
      } finally {
        setLoading(false);
      }
    },
    [base],
  );

  const fetchStats = useCallback(
    async (params = {}) => {
      try {
        const { data } = await api.get(`${base}/statistics`, {
          params: clean(params),
        });
        setStats(data);
        return data;
      } catch (e) {
        toast.error(normalizeAxiosError(e));
        return null;
      }
    },
    [base],
  );

  const getTicket = useCallback(
    async (ticketId) => {
      setLoading(true);
      try {
        const { data } = await api.get(`${base}/${ticketId}`);
        return data;
      } catch (e) {
        toast.error(normalizeAxiosError(e));
        return null;
      } finally {
        setLoading(false);
      }
    },
    [base],
  );

  const getMessages = useCallback(
    async (ticketId, params = {}) => {
      const q = {
        limit: params.limit ?? 50,
        sortDir: params.sortDir ?? "DESC",
      };
      if (params.cursor) {
        q["cursor[value]"] = params.cursor.value;
        q["cursor[id]"] = params.cursor.id;
      }
      const { data } = await api.get(`${base}/${ticketId}/messages`, {
        params: q,
      });
      return data;
    },
    [base],
  );

  const getActivity = useCallback(
    async (ticketId) => {
      const { data } = await api.get(`${base}/${ticketId}/activity`);
      return data;
    },
    [base],
  );

  const getSupportUsers = useCallback(async (params = {}) => {
    const { data } = await api.get(`${ADMIN}/support-users`, {
      params: clean(params),
    });
    return data;
  }, []);

  /* ── Write ────────────────────────────────────────────── */

  const createTicket = useCallback(
    async ({ title, message, files = [] }, callbacks = {}) => {
      try {
        const fd = buildForm({ title, message, files });
        const { data } = await api.post(TENANT, fd);
        toast.success(data?.message || t("toast.ticketCreated"));
        callbacks.onSuccess?.(data?.data);
        return data;
      } catch (e) {
        toast.error(normalizeAxiosError(e));
        callbacks.onError?.(e);
        return null;
      }
    },
    [t],
  );

  const reply = useCallback(
    async (ticketId, { message, isInternalNote = false, files = [] }, callbacks = {}) => {
      try {
        const fd = buildForm({ message, isInternalNote, files });
        const { data } = await api.post(`${base}/${ticketId}/messages`, fd);
        toast.success(t("toast.sent"));
        callbacks.onSuccess?.(data);
        return data;
      } catch (e) {
        toast.error(normalizeAxiosError(e));
        callbacks.onError?.(e);
        return null;
      }
    },
    [base, t],
  );

  const editMessage = useCallback(
    async (ticketId, messageId, message, callbacks = {}) => {
      try {
        const { data } = await api.patch(
          `${base}/${ticketId}/messages/${messageId}`,
          { message },
        );
        toast.success(data?.message || t("toast.saved"));
        callbacks.onSuccess?.(data?.data);
        return data;
      } catch (e) {
        toast.error(normalizeAxiosError(e));
        callbacks.onError?.(e);
        return null;
      }
    },
    [base, t],
  );

  const deleteMessage = useCallback(
    async (ticketId, messageId, callbacks = {}) => {
      try {
        const { data } = await api.delete(
          `${base}/${ticketId}/messages/${messageId}`,
        );
        toast.success(data?.message || t("toast.deleted"));
        callbacks.onSuccess?.(data);
        return data;
      } catch (e) {
        toast.error(normalizeAxiosError(e));
        callbacks.onError?.(e);
        return null;
      }
    },
    [base, t],
  );

  const cancelTicket = useCallback(
    async (ticketId, reason = "", callbacks = {}) => {
      try {
        const { data } = await api.patch(`${TENANT}/${ticketId}/cancel`, {
          reason,
        });
        toast.success(data?.message || t("toast.saved"));
        callbacks.onSuccess?.(data);
        return data;
      } catch (e) {
        toast.error(normalizeAxiosError(e));
        callbacks.onError?.(e);
        return null;
      }
    },
    [t],
  );

  const markRead = useCallback(
    async (ticketId, callbacks = {}) => {
      try {
        const { data } = await api.patch(`${base}/${ticketId}/read`);
        callbacks.onSuccess?.(data);
        return data;
      } catch (e) {
        toast.error(normalizeAxiosError(e));
        callbacks.onError?.(e);
        return null;
      }
    },
    [base],
  );

  const changeStatus = useCallback(
    async (ticketId, status, reason = "", callbacks = {}) => {
      try {
        const { data } = await api.patch(`${ADMIN}/${ticketId}/status`, {
          status,
          reason,
        });
        toast.success(data?.message || t("toast.statusChanged"));
        callbacks.onSuccess?.(data);
        return data;
      } catch (e) {
        toast.error(normalizeAxiosError(e));
        callbacks.onError?.(e);
        return null;
      }
    },
    [t],
  );

  const changePriority = useCallback(
    async (ticketId, priority, callbacks = {}) => {
      try {
        const { data } = await api.patch(`${ADMIN}/${ticketId}/priority`, {
          priority,
        });
        toast.success(data?.message || t("toast.priorityChanged"));
        callbacks.onSuccess?.(data);
        return data;
      } catch (e) {
        toast.error(normalizeAxiosError(e));
        callbacks.onError?.(e);
        return null;
      }
    },
    [t],
  );

  const downloadAttachment = useCallback(
    async ({ ticketId, attachmentId, originalName = "attachment" }) => {
      try {
        const response = await api.get(
          `${base}/${ticketId}/attachments/${attachmentId}/download`,
          { responseType: "blob" },
        );

        // Guard against IDM / download-manager extension interception. Such
        // extensions swallow the real response and inject a synthetic 204
        // with a zero-length blob. When detected, fall back to direct URL
        // navigation with a short-lived auth cookie.
        const blob = response.data;
        const intercepted =
          !blob ||
          (blob.size === 0 && response.status !== 204 /* explicit 204 OK */);

        if (intercepted) {
          setAuthCookieForRedirect();
          try {
            const directUrl = `${BASE_URL}${base}/${ticketId}/attachments/${attachmentId}/download`;
            const link = document.createElement("a");
            link.href = directUrl;
            link.setAttribute("download", originalName);
            link.rel = "noopener noreferrer";
            document.body.appendChild(link);
            link.click();
            link.remove();
          } finally {
            // Clean up the short-lived cookie after the navigation has fired.
            setTimeout(cleanupAuthCookie, 5000);
          }
          return;
        }

        const url = window.URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.href = url;
        link.setAttribute("download", originalName);
        document.body.appendChild(link);
        link.click();
        link.remove();
        window.URL.revokeObjectURL(url);
      } catch (e) {
        // toast.error(normalizeAxiosError(e));
      }
    },
    [base],
  );

  const openPreview = useCallback(
    async (ticketId, attachmentId) => {
      try {
        const response = await api.get(
          `${base}/${ticketId}/attachments/${attachmentId}/preview`,
          { responseType: "blob" },
        );

        const blob = response.data;
        const intercepted =
          !blob ||
          (blob.size === 0 && response.status !== 204 /* explicit 204 OK */);

        if (intercepted) {
          setAuthCookieForRedirect();
          try {
            const directUrl = `${BASE_URL}${base}/${ticketId}/attachments/${attachmentId}/preview`;
            window.open(directUrl, "_blank", "noopener,noreferrer");
          } finally {
            setTimeout(cleanupAuthCookie, 5000);
          }
          return;
        }

        const url = window.URL.createObjectURL(blob);
        window.open(url, "_blank");
      } catch (e) {
        // toast.error(normalizeAxiosError(e));
      }
    },
    [base],
  );

  return {
    base,
    scope,
    loading,
    tickets,
    totalRecords,
    stats,
    fetchList,
    fetchStats,
    getTicket,
    getMessages,
    getActivity,
    getSupportUsers,
    createTicket,
    reply,
    editMessage,
    deleteMessage,
    cancelTicket,
    markRead,
    changeStatus,
    changePriority,
    downloadAttachment,
    openPreview,
  };
}

/**
 * Subscribe to the support-ticket socket events and fire the
 * matching callbacks. Returns a stable unsubscribe fn.
 */
export function useSupportTicketEvents(callbacks = {}) {
  const { subscribe } = useSocket();
  const [ready, setReady] = useState(false);
  const callbacksRef = useRef(callbacks);

  useEffect(() => {
    callbacksRef.current = callbacks;
  }, [callbacks]);

  useEffect(() => {
    if (!subscribe) return;
    const offs = [
      subscribe("SUPPORT_TICKET_CREATED", (payload) =>
        callbacksRef.current.onCreated?.(payload),
      ),
      subscribe("SUPPORT_TICKET_UPDATED", (payload) =>
        callbacksRef.current.onUpdated?.(payload),
      ),
      subscribe("SUPPORT_TICKET_MESSAGE_CREATED", (payload) =>
        callbacksRef.current.onMessageCreated?.(payload),
      ),
      subscribe("SUPPORT_TICKET_MESSAGE_UPDATED", (payload) =>
        callbacksRef.current.onMessageUpdated?.(payload),
      ),
      subscribe("SUPPORT_TICKET_READ", (payload) =>
        callbacksRef.current.onRead?.(payload),
      ),
    ];
    setReady(true);
    return () => offs.forEach((off) => off?.());
  }, [subscribe]);

  return ready;
}
