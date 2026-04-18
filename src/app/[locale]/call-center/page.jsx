"use client";

import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { motion as m } from "framer-motion";
import {
    Download,
    Loader2,
    Users,
    CheckCircle,
    XCircle,
    ShoppingBag,
    Lock,
    Activity,
} from "lucide-react";
import { useTranslations } from "next-intl";
import { cn } from "@/utils/cn";
import toast from "react-hot-toast";
import api from "@/utils/api";


// ── Shared Table system ──────────────────────────────────────────────────────
import Table from "@/components/atoms/Table";
import PageHeader from "@/components/atoms/Pageheader";
import DistributionModal from "../orders/atoms/DistrubtionModal";

// ── Stats Configuration ──────────────────────────────────────────────────────
const CALL_CENTER_STATS = [
    {
        id: 1,
        code: "new",
        nameKey: "callCenter.stats.new",
        color: "var(--primary)",
        icon: ShoppingBag,
        sortOrder: 1,
    },
    {
        id: 2,
        code: "confirmed",
        nameKey: "callCenter.stats.confirmed",
        color: "#3b82f6",
        icon: CheckCircle,
        sortOrder: 2,
    },
    {
        id: 3,
        code: "cancelled",
        nameKey: "callCenter.stats.cancelled",
        color: "#ef4444",
        icon: XCircle,
        sortOrder: 3,
    },
];

export default function CallCenterPage() {
    const t = useTranslations();
    const [loading, setLoading] = useState(false);
    const [exportLoading, setExportLoading] = useState(false);
    const [search, setSearch] = useState("");
    const [debouncedSearch, setDebouncedSearch] = useState("");
    const [distributionOpen, setDistributionOpen] = useState(false);
    // Get today's date in YYYY-MM-DD format
    const today = new Date().toLocaleDateString();
    const [stats, setStats] = useState([]);
    const [statsData, setStatsData] = useState({
        new: 0,
        confirmed: 0,
        cancelled: 0,
    });

    const [pager, setPager] = useState({
        total_records: 0,
        current_page: 1,
        per_page: 12,
        records: [],
    });

    const searchTimer = useRef(null);

    /* debounce search */
    useEffect(() => {
        clearTimeout(searchTimer.current);
        searchTimer.current = setTimeout(() => setDebouncedSearch(search), 350);
        return () => clearTimeout(searchTimer.current);
    }, [search]);

    useEffect(() => {
        fetchEmployeeStats(1, pager.per_page);
    }, [debouncedSearch]);

    useEffect(() => {
        fetchStatsSummary();
    }, []);

    /* build API params */
    const buildParams = useCallback(
        (page = pager.current_page, per_page = pager.per_page) => {
            const params = {
                page,
                limit: per_page,
                startDate: today,
                endDate: today
            };
            if (debouncedSearch) params.search = debouncedSearch;
            return params;
        },
        [debouncedSearch, pager.current_page, pager.per_page, today],
    );

    /* fetch stats summary */
    const fetchStatsSummary = useCallback(async () => {
        try {
            const res = await api.get("/dashboard/employees/stats/summary", {
                params: {
                    startDate: today,
                    endDate: today,
                    except: ["new"]
                }
            });
            const data = Array.isArray(res.data) ? res.data : [];

            const getCountByCode = (code) => {
                const item = data.find(stat => stat.code === code);
                return item ? Number(item.count) : 0;
            };

            setStatsData({
                new: getCountByCode('new'),
                confirmed: getCountByCode('confirmed'),
                cancelled: getCountByCode('cancelled'),
            });

        } catch (e) {
            console.error("Error fetching stats summary:", e);
            toast.error(t("common.api.error"));
        }
    }, [t]);

    /* fetch employee statistics */
    const fetchEmployeeStats = useCallback(
        async (page = pager.current_page, per_page = pager.per_page) => {
            try {
                setLoading(true);
                const res = await api.get("/dashboard/employees/stats", { params: buildParams(page, per_page) });
                const data = res.data ?? {};
                setPager({
                    total_records: data.total_records ?? 0,
                    current_page: data.current_page ?? page,
                    per_page: data.per_page ?? per_page,
                    records: Array.isArray(data.records) ? data.records : [],
                });
            } catch (e) {
                console.error(e);
                toast.error(t("common.api.error"));
            } finally {
                setLoading(false);
            }
        },
        [buildParams, t],
    );


    const fetchStats = async () => {
        try {
            const response = await api.get("/orders/stats");
            setStats(response.data || []);
        } catch (error) {
        } finally {
        }
    };
    useEffect(() => {
        fetchStats();
    }, []);
    /* ── Columns ── */
    const columns = useMemo(
        () => [
            {
                key: "employeeName",
                header: t("callCenter.columns.employeeName"),
                cell: (row) => (
                    <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center overflow-hidden">
                            {row.avatarUrl ? (
                                <img src={row.avatarUrl} alt={row.name} className="w-full h-full object-cover" />
                            ) : (
                                <Users size={14} className="text-primary" />
                            )}
                        </div>
                        <span className="font-semibold text-foreground text-sm">
                            {row.name ?? "—"}
                        </span>
                    </div>
                ),
            },
            {
                key: "isActive",
                header: t("callCenter.columns.status"),
                cell: (row) => (
                    <span style={{ background: "color-mix(in oklab, var(--muted) 50%, var(--card))" }} className={cn(
                        "px-2 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider text-foreground",

                    )}>
                        {row.isActive ? t("common.statusCodes.active") : t("common.statusCodes.inactive")}
                    </span>
                ),
            },
            {
                key: "activeAssignments",
                header: t("callCenter.columns.activeAssignments"),
                cell: (row) => (
                    <div className="flex items-center gap-1.5">
                        <Activity size={14} className="text-primary" />
                        <span className="font-bold text-sm tabular-nums">
                            {row.activeAssignments ?? 0}
                        </span>
                    </div>
                ),
            },
            {
                key: "lockedAssignments",
                header: t("callCenter.columns.lockedAssignments"),
                cell: (row) => (
                    <div className="flex items-center gap-1.5">
                        <Lock size={14} className="text-primary" />
                        <span className="font-bold text-sm tabular-nums text-primary">
                            {row.lockedAssignments ?? 0}
                        </span>
                    </div>
                ),
            },
            {
                key: "confirmedToday",
                header: t("callCenter.columns.confirmedToday"),
                cell: (row) => (
                    <div className="flex items-center gap-1.5">
                        <CheckCircle size={14} className="text-emerald-500" />
                        <span className="font-bold text-sm tabular-nums text-emerald-600">
                            {row.confirmed?.count ?? 0}
                        </span>
                    </div>
                ),
            },
        ],
        [t]
    );

    return (
        <div className="min-h-screen p-5">
            <PageHeader
                breadcrumbs={[
                    { name: t("callCenter.breadcrumb.home"), href: "/" },
                    { name: t("callCenter.breadcrumb.orders"), href: "/orders" },
                    { name: t("callCenter.title") },
                ]}
                statsCount={3}
                stats={CALL_CENTER_STATS.map((s) => ({
                    id: s.id,
                    name: t(s.nameKey),
                    value: statsData[s.code] ?? 0,
                    icon: s.icon,
                    color: s.color,
                    sortOrder: s.sortOrder,
                }))}
            />

            <Table
                searchValue={search}
                onSearchChange={setSearch}
                onSearch={() => fetchEmployeeStats(1, pager.per_page)}
                labels={{
                    searchPlaceholder: t("callCenter.searchPlaceholder") || "Search...",
                    total: t("orders.pagination.total"),
                    limit: t("orders.pagination.limit"),
                    emptyTitle: t("callCenter.emptyTitle") || "No employees found",
                    emptySubtitle: t("callCenter.emptySubtitle") || "Try adjusting your search",
                }}
                actions={[
                    {
                        key: "distribute",
                        label: t("orders.toolbar.distribute"),
                        icon: <Users size={15} />,
                        color: "primary",
                        onClick: () => setDistributionOpen(true),
                        permission: "order.assign",
                    },
                ]}
                columns={columns}
                data={pager.records}
                isLoading={loading}
                pagination={{
                    total_records: pager.total_records,
                    current_page: pager.current_page,
                    per_page: pager.per_page,
                }}
                onPageChange={({ page, per_page }) => fetchEmployeeStats(page, per_page)}
            />

            <DistributionModal
                isOpen={distributionOpen}
                onClose={() => setDistributionOpen(false)}
                statuses={stats}
                onSuccess={() => {
                    fetchEmployeeStats(1, pager.per_page);
                    fetchStatsSummary();
                }}
            />
        </div>
    );
}
