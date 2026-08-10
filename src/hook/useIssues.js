import { useCallback, useEffect, useRef, useState } from "react";
import toast from "react-hot-toast";
import api from "@/utils/api";
import { normalizeAxiosError } from "@/utils/axios";
import { useSocket } from "@/context/SocketContext";

const BASE = "/issues";

/* ============================================================
   Helpers (mirror useSupportTickets pattern)
============================================================ */
function clean(obj = {}) {
  const out = {};
  Object.entries(obj).forEach(([key, value]) => {
    if (value === undefined || value === null || value === "") return;
    out[key] = value;
  });
  return out;
}

/* ============================================================
   Main hook (scope-less — always tenant issues via /issues)
============================================================ */
export function useIssues() {
  /* ── global loading + local state caches ──────────────── */
  const [loading, setLoading] = useState(false);
  const [issues, setIssues] = useState([]);
  const [totalRecords, setTotalRecords] = useState(0);
  const [stats, setStats] = useState(null);
  const [statuses, setStatuses] = useState([]);
  const [causes, setCauses] = useState([]);
  const [boardColumns, setBoardColumns] = useState([]);
  const [boardLoading, setBoardLoading] = useState(false);
  const [boardColumnLoading, setBoardColumnLoading] = useState({});

  /* ── Socket refresh for realtime ──────────────────────── */
  const refreshListRef = useRef(null);
  const refreshStatsRef = useRef(null);
  const refreshBoardRef = useRef(null);
  const lastBoardParamsRef = useRef({});
  const { subscribe } = useSocket();


  /* ============================================================
     READ — list / stats / statuses / causes / detail
  ============================================================ */

  const fetchList = useCallback(async (params = {}) => {
    setLoading(true);
    try {
      const q = clean(params);
      if (q.page === undefined) q.page = 1;
      if (q.limit === undefined) q.limit = 9999;
      const { data } = await api.get(BASE, { params: q });
      setIssues(data.records || []);
      setTotalRecords(data.total_records || 0);
      return data;
    } catch (e) {
      toast.error(normalizeAxiosError(e));
      return null;
    } finally {
      setLoading(false);
    }
  }, []);
  refreshListRef.current = fetchList;

  const fetchStats = useCallback(async () => {
    try {
      const { data } = await api.get(`${BASE}/statistics`);
      setStats(data);
      return data;
    } catch (e) {
      toast.error(normalizeAxiosError(e));
      return null;
    }
  }, []);
  refreshStatsRef.current = fetchStats;

  const fetchStatuses = useCallback(async (params = {}) => {
    try {
      const { data } = await api.get(`${BASE}/statuses`, {
        params: clean(params),
      });
      setStatuses(Array.isArray(data) ? data : []);
      return data;
    } catch (e) {
      toast.error(normalizeAxiosError(e));
      return null;
    }
  }, []);

  const fetchCauses = useCallback(async (params = {}) => {
    try {
      const { data } = await api.get(`${BASE}/causes`, {
        params: clean(params),
      });
      setCauses(Array.isArray(data) ? data : []);
      return data;
    } catch (e) {
      toast.error(normalizeAxiosError(e));
      return null;
    }
  }, []);

  /* ============================================================
     READ — board (cursor pagination per status column)
  ============================================================ */

  const fetchBoard = useCallback(async (params = {}) => {
    setBoardLoading(true);
    try {
      const q = clean(params);
      lastBoardParamsRef.current = q;
      const { data } = await api.get(`${BASE}/board`, { params: q });
      setBoardColumns(Array.isArray(data?.columns) ? data.columns : []);
      return data;
    } catch (e) {
      toast.error(normalizeAxiosError(e));
      return null;
    } finally {
      setBoardLoading(false);
    }
  }, []);
  refreshBoardRef.current = () => fetchBoard(lastBoardParamsRef.current);

  const fetchBoardColumn = useCallback(
    async (statusId, cursor, params = {}) => {
      setBoardColumnLoading((prev) => ({ ...prev, [statusId]: true }));
      try {
        const q = clean({ ...params, cursor });
        const { data } = await api.get(`${BASE}/board/${statusId}`, {
          params: q,
        });
        setBoardColumns((cols) =>
          cols.map((col) => {
            if (String(col.status?.id) !== String(statusId)) return col;
            const seen = new Set((col.records ?? []).map((it) => it.id));
            const appended = (data?.records ?? []).filter(
              (it) => !seen.has(it.id),
            );
            return {
              ...col,
              records: [...(col.records ?? []), ...appended],
              pagination: data?.pagination ?? col.pagination,
            };
          }),
        );
        return data;
      } catch (e) {
        toast.error(normalizeAxiosError(e));
        return null;
      } finally {
        setBoardColumnLoading((prev) => ({ ...prev, [statusId]: false }));
      }
    },
    [],
  );

  const getIssue = useCallback(async (issueId) => {
    setLoading(true);
    try {
      const { data } = await api.get(`${BASE}/${issueId}`);
      return data;
    } catch (e) {
      toast.error(normalizeAxiosError(e));
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  const getMessages = useCallback(async (issueId, params = {}) => {
    try {
      const q = {
        limit: params.limit ?? 50,
        sortDir: params.sortDir ?? "DESC",
      };
      if (params.cursor) {
        q["cursor[value]"] = params.cursor.value;
        q["cursor[id]"] = params.cursor.id;
      }
      if (params.startDate) q.startDate = params.startDate;
      if (params.endDate) q.endDate = params.endDate;
      const { data } = await api.get(`${BASE}/${issueId}/messages`, {
        params: q,
      });
      return data;
    } catch (e) {
      toast.error(normalizeAxiosError(e));
      return null;
    }
  }, []);

  const getActivity = useCallback(async (issueId) => {
    try {
      const { data } = await api.get(`${BASE}/${issueId}/activity`);
      return data;
    } catch (e) {
      toast.error(normalizeAxiosError(e));
      return null;
    }
  }, []);

  /* ============================================================
     WRITE — issue CRUD + state change + assign
  ============================================================ */

  const createIssue = useCallback(async (dto = {}, callbacks = {}) => {
    try {
      const { data } = await api.post(BASE, clean(dto));
      toast.success(data?.message || "Issue created");
      await refreshListRef.current?.();
      await refreshBoardRef.current?.();
      await refreshStatsRef.current?.();
      callbacks.onSuccess?.(data?.data);
      return data;
    } catch (e) {
      toast.error(normalizeAxiosError(e));
      callbacks.onError?.(e);
      return null;
    }
  }, []);

  const updateIssue = useCallback(async (id, dto = {}, callbacks = {}) => {
    try {
      const { data } = await api.patch(`${BASE}/${id}`, clean(dto));
      toast.success(data?.message || "Issue updated");
      await refreshListRef.current?.();
      await refreshBoardRef.current?.();
      callbacks.onSuccess?.(data?.data);
      return data;
    } catch (e) {
      toast.error(normalizeAxiosError(e));
      callbacks.onError?.(e);
      return null;
    }
  }, []);

  const deleteIssue = useCallback(async (id, callbacks = {}) => {
    try {
      const { data } = await api.delete(`${BASE}/${id}`);
      toast.success(data?.message || "Issue deleted");
      await refreshListRef.current?.();
      await refreshBoardRef.current?.();
      await refreshStatsRef.current?.();
      callbacks.onSuccess?.();
      return data;
    } catch (e) {
      toast.error(normalizeAxiosError(e));
      callbacks.onError?.(e);
      return null;
    }
  }, []);

  const changeStatus = useCallback(async (id, dto = {}, callbacks = {}) => {
    try {
      const { data } = await api.patch(`${BASE}/${id}/status`, clean(dto));
      toast.success(data?.message || "Status changed");
      await refreshListRef.current?.();
      await refreshBoardRef.current?.();
      await refreshStatsRef.current?.();
      callbacks.onSuccess?.(data?.data);
      return data;
    } catch (e) {
      toast.error(normalizeAxiosError(e));
      callbacks.onError?.(e);
      return null;
    }
  }, []);

  const changePriority = useCallback(async (id, dto = {}, callbacks = {}) => {
    try {
      const { data } = await api.patch(`${BASE}/${id}/priority`, clean(dto));
      toast.success(data?.message || "Priority changed");
      await refreshListRef.current?.();
      await refreshBoardRef.current?.();
      callbacks.onSuccess?.(data?.data);
      return data;
    } catch (e) {
      toast.error(normalizeAxiosError(e));
      callbacks.onError?.(e);
      return null;
    }
  }, []);

  const assignIssue = useCallback(async (id, dto = {}, callbacks = {}) => {
    try {
      const { data } = await api.post(`${BASE}/${id}/assign`, clean(dto));
      toast.success(data?.message || "Assigned");
      await refreshListRef.current?.();
      await refreshBoardRef.current?.();
      callbacks.onSuccess?.(data?.data);
      return data;
    } catch (e) {
      toast.error(normalizeAxiosError(e));
      callbacks.onError?.(e);
      return null;
    }
  }, []);

  const markRead = useCallback(async (id, callbacks = {}) => {
    try {
      const { data } = await api.patch(`${BASE}/${id}/read`);
      callbacks.onSuccess?.(data);
      return data;
    } catch (e) {
      toast.error(normalizeAxiosError(e));
      callbacks.onError?.(e);
      return null;
    }
  }, []);

  /* ============================================================
     MESSAGES — reply, edit, delete
  ============================================================ */

  const reply = useCallback(async (id, dto = {}, callbacks = {}) => {
    try {
      const { data } = await api.post(`${BASE}/${id}/messages`, clean(dto));
      toast.success(data?.message || "Message sent");
      callbacks.onSuccess?.(data?.data);
      return data;
    } catch (e) {
      toast.error(normalizeAxiosError(e));
      callbacks.onError?.(e);
      return null;
    }
  }, []);

  const updateMessage = useCallback(
    async (id, messageId, dto = {}, callbacks = {}) => {
      try {
        const { data } = await api.patch(
          `${BASE}/${id}/messages/${messageId}`,
          clean(dto),
        );
        toast.success(data?.message || "Message updated");
        callbacks.onSuccess?.(data?.data);
        return data;
      } catch (e) {
        toast.error(normalizeAxiosError(e));
        callbacks.onError?.(e);
        return null;
      }
    },
    [],
  );

  const deleteMessage = useCallback(
    async (id, messageId, callbacks = {}) => {
      try {
        const { data } = await api.delete(`${BASE}/${id}/messages/${messageId}`);
        toast.success(data?.message || "Message deleted");
        callbacks.onSuccess?.();
        return data;
      } catch (e) {
        toast.error(normalizeAxiosError(e));
        callbacks.onError?.(e);
        return null;
      }
    },
    [],
  );

  /* ============================================================
     STATUSES — CRUD
  ============================================================ */

  const createStatus = useCallback(async (dto = {}, callbacks = {}) => {
    try {
      const { data } = await api.post(`${BASE}/statuses`, clean(dto));
      toast.success(data?.message || "Status created");
      await fetchStatuses();
      await refreshBoardRef.current?.();
      callbacks.onSuccess?.(data?.data);
      return data;
    } catch (e) {
      toast.error(normalizeAxiosError(e));
      callbacks.onError?.(e);
      return null;
    }
  }, [fetchStatuses]);

  const updateStatus = useCallback(async (id, dto = {}, callbacks = {}) => {
    try {
      const { data } = await api.patch(`${BASE}/statuses/${id}`, clean(dto));
      toast.success(data?.message || "Status updated");
      await fetchStatuses();
      await refreshBoardRef.current?.();
      callbacks.onSuccess?.(data?.data);
      return data;
    } catch (e) {
      toast.error(normalizeAxiosError(e));
      callbacks.onError?.(e);
      return null;
    }
  }, [fetchStatuses]);

  const deleteStatus = useCallback(async (id, callbacks = {}) => {
    try {
      const { data } = await api.delete(`${BASE}/statuses/${id}`);
      toast.success(data?.message || "Status deleted");
      await fetchStatuses();
      await refreshBoardRef.current?.();
      await refreshStatsRef.current?.();
      callbacks.onSuccess?.();
      return data;
    } catch (e) {
      toast.error(normalizeAxiosError(e));
      callbacks.onError?.(e);
      return null;
    }
  }, [fetchStatuses]);

  /* ============================================================
     CAUSES — CRUD
  ============================================================ */

  const createCause = useCallback(async (dto = {}, callbacks = {}) => {
    try {
      const { data } = await api.post(`${BASE}/causes`, clean(dto));
      toast.success(data?.message || "Cause created");
      await fetchCauses();
      callbacks.onSuccess?.(data?.data);
      return data;
    } catch (e) {
      toast.error(normalizeAxiosError(e));
      callbacks.onError?.(e);
      return null;
    }
  }, [fetchCauses]);

  const updateCause = useCallback(async (id, dto = {}, callbacks = {}) => {
    try {
      const { data } = await api.patch(`${BASE}/causes/${id}`, clean(dto));
      toast.success(data?.message || "Cause updated");
      await fetchCauses();
      callbacks.onSuccess?.(data?.data);
      return data;
    } catch (e) {
      toast.error(normalizeAxiosError(e));
      callbacks.onError?.(e);
      return null;
    }
  }, [fetchCauses]);

  const deleteCause = useCallback(async (id, callbacks = {}) => {
    try {
      const { data } = await api.delete(`${BASE}/causes/${id}`);
      toast.success(data?.message || "Cause deleted");
      await fetchCauses();
      callbacks.onSuccess?.();
      return data;
    } catch (e) {
      toast.error(normalizeAxiosError(e));
      callbacks.onError?.(e);
      return null;
    }
  }, [fetchCauses]);

  /* ============================================================
     Auto-realtime: refresh list & stats whenever socket events fire
  ============================================================ */
  // useEffect(() => {
  //   const onAny = () => {
  //     refreshListRef.current?.();
  //     refreshStatsRef.current?.();
  //   };
  //   const handlers = [
  //     ["issue:created", onAny],
  //     ["issue:updated", onAny],
  //     ["issue:deleted", onAny],
  //   ];
  //   handlers.forEach(([evt, fn]) => onSocket(evt, fn));
  //   return () => {
  //     handlers.forEach(([evt, fn]) => offSocket(evt, fn));
  //   };
  // }, [onSocket, offSocket]);

  /* ============================================================
     EXPORT (handled by useExport hook at page level — kept here
     only as a shorthand if needed; callers prefer useExport())
  ============================================================ */
  const exportParams = (params = {}) => ({
    endpoint: `${BASE}/export`,
    params: clean(params),
  });
  const exportCausesParams = (params = {}) => ({
    endpoint: `${BASE}/causes/export`,
    params: clean(params),
  });

  return {
    loading,
    issues,
    setIssues,
    totalRecords,
    stats,
    setStats,
    statuses,
    setStatuses,
    causes,
    setCauses,
    boardColumns,
    setBoardColumns,
    boardLoading,
    boardColumnLoading,

    // reads
    fetchList,
    fetchBoard,
    fetchBoardColumn,
    fetchStats,
    fetchStatuses,
    fetchCauses,
    getIssue,
    getMessages,
    getActivity,

    // issue writes
    createIssue,
    updateIssue,
    deleteIssue,
    changeStatus,
    changePriority,
    assignIssue,
    markRead,

    // messages
    reply,
    updateMessage,
    deleteMessage,

    // statuses
    createStatus,
    updateStatus,
    deleteStatus,

    // causes
    createCause,
    updateCause,
    deleteCause,
    // export helpers
    exportParams,
    exportCausesParams,
  };
}
