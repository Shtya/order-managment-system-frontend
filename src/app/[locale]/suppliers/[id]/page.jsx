"use client";

import React, { useEffect, useState, useCallback, useMemo } from "react";
import { useParams } from "next/navigation";
import { useTranslations } from "next-intl";
import {
    Calendar,
    FileText,
    TrendingUp,
    DollarSign,
    History,
    Eye,
    Clock,
    CheckCircle2,
    Download,
    Info,
    User,
    Phone,
    MapPin,
    Mail,
    Tag,
    Wallet,
    ReceiptText,
    Loader2,
} from "lucide-react";
import api from "@/utils/api";
import { usePlatformSettings } from "@/context/PlatformSettingsContext";
import PageHeader from "@/components/atoms/Pageheader";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import Table from "@/components/atoms/Table";
import ActionButtons from "@/components/atoms/Actions";
import toast from "react-hot-toast";
import { DetailsModal as PurchaseDetailsModal } from "@/app/[locale]/purchases/page";
import { DetailsModal as ReturnDetailsModal } from "@/app/[locale]/purchases/return/page";
import { cn } from "@/utils/cn";
import DateRangePicker from "@/components/atoms/DateRangePicker";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useDebounce } from "@/hook/useDebounce";

export default function SupplierDetailsPage() {
    const [activeSubTab, setActiveSubTab] = useState('purchases');
    const params = useParams();
    const id = params.id;
    const tPurchases = useTranslations("purchases");
    const tSuppliers = useTranslations("suppliers");
    const tReturns = useTranslations("purchasesReturn");
    const tCommon = useTranslations("common");
    const t = useTranslations("accounts.supplierAccounts");
    const { formatCurrency } = usePlatformSettings();

    const [supplier, setSupplier] = useState(null);
    const [loading, setLoading] = useState(true);

    // Purchases State
    const [purchasesPager, setPurchasesPager] = useState({ records: [], total_records: 0, current_page: 1, per_page: 12 });
    const [purchasesLoading, setPurchasesLoading] = useState(false);
    const [purchasesFilters, setPurchasesFilters] = useState({ startDate: null, endDate: null });

    // Returns State
    const [returnsPager, setReturnsPager] = useState({ records: [], total_records: 0, current_page: 1, per_page: 12 });
    const [returnsLoading, setReturnsLoading] = useState(false);
    const [returnsFilters, setReturnsFilters] = useState({ startDate: null, endDate: null });

    // Modals State
    const [purchaseModal, setPurchaseModal] = useState({ isOpen: false, invoice: null, loading: false });
    const [returnModal, setReturnModal] = useState({ isOpen: false, invoice: null, loading: false });
    const currentYear = new Date().getFullYear();
    const years = useMemo(() => Array.from({ length: 10 }, (_, i) => (currentYear - i).toString()), [currentYear]);
    const [selectedYear, setSelectedYear] = useState(currentYear.toString());
    const [historyPager, setHistoryPager] = useState({
        records: [],
        total_records: 0,
        current_page: 1,
        per_page: 12,
    });
    const [historyLoading, setHistoryLoading] = useState(false);

    const [Purchasesearch, setPurchaseSearch] = useState("");
    const { debouncedValue: debouncedPurchaseSearch } = useDebounce({
        value: Purchasesearch,
        delay: 300,
    });

    const [Returnsearch, setReturnSearch] = useState("");
    const { debouncedValue: debouncedReturnSearch } = useDebounce({
        value: Returnsearch,
        delay: 300,
    });

    const [Historysearch, setHistorySearch] = useState("");
    const { debouncedValue: debouncedHistorySearch } = useDebounce({
        value: Historysearch,
        delay: 300,
    });

    const fetchSupplier = useCallback(async () => {
        try {
            const res = await api.get(`/suppliers/${id}`);
            setSupplier(res.data);
        } catch (error) {
            toast.error(error?.response?.data?.message || "Failed to fetch supplier");
        } finally {
            setLoading(false);
        }
    }, [id]);

    const fetchPurchases = useCallback(async (page = 1, limit = 10, search) => {
        setPurchasesLoading(true);
        try {
            const params = new URLSearchParams();
            params.set("page", String(page));
            params.set("limit", String(limit));
            params.set("supplierId", id);
            if(search)  params.set("search", search);
            if (purchasesFilters.startDate) params.set("startDate", purchasesFilters.startDate);
            if (purchasesFilters.endDate) params.set("endDate", purchasesFilters.endDate);

            const res = await api.get(`/purchases?${params.toString()}`);
            setPurchasesPager({
                records: res.data.records || [],
                total_records: res.data.total_records || 0,
                current_page: res.data.current_page || 1,
                per_page: res.data.per_page || 10,
            });
        } catch (error) {
            console.error(error);
        } finally {
            setPurchasesLoading(false);
        }
    }, [id, purchasesFilters]);

    const fetchReturns = useCallback(async (page = 1, limit = 10, search) => {
        setReturnsLoading(true);
        try {
            const params = new URLSearchParams();
            params.set("page", String(page));
            params.set("limit", String(limit));
            params.set("supplierId", id);
            if(search)  params.set("search", search);
            if (returnsFilters.startDate) params.set("startDate", returnsFilters.startDate);
            if (returnsFilters.endDate) params.set("endDate", returnsFilters.endDate);

            const res = await api.get(`/purchases-return?${params.toString()}`);
            setReturnsPager({
                records: res.data.records || [],
                total_records: res.data.total_records || 0,
                current_page: res.data.current_page || 1,
                per_page: res.data.per_page || 10,
            });
        } catch (error) {
            console.error(error);
        } finally {
            setReturnsLoading(false);
        }
    }, [id, returnsFilters]);

    const fetchHistory = useCallback(async (page = 1, limit = 10, search) => {
        if (!id) return;

        setHistoryLoading(true);
        try {
            const params = new URLSearchParams();
            params.set("page", String(page));
            params.set("limit", String(limit));
            params.set("supplierId", id);
            if(search) params.set("search", search);
            params.set("year", String(selectedYear));

            const res = await api.get(`/accounting/supplier-closings/closings?${params.toString()}`);

            setHistoryPager({
                records: res.data.records || [],
                total_records: res.data.total_records || 0,
                current_page: res.data.current_page || 1,
                per_page: res.data.per_page || 10,
            });

        } catch (err) {
            console.error("Error fetching closing history:", err);
        } finally {
            setHistoryLoading(false);
        }
    }, [id, selectedYear, id]);

    useEffect(() => {
        fetchHistory();
    }, [fetchHistory]);

    useEffect(() => {
        fetchSupplier();
    }, [fetchSupplier]);

    useEffect(() => {
        fetchPurchases();
    }, [fetchPurchases]);

    useEffect(() => {
        fetchReturns();
    }, [fetchReturns]);

    useEffect(() => {
        fetchReturns(1, 12, Returnsearch);
    }, [Returnsearch]);

    useEffect(() => {
        fetchPurchases(1, 12, Purchasesearch);
    }, [Purchasesearch]);

    useEffect(() => {
        fetchHistory(1, 12, Historysearch);
    }, [Historysearch]);


    const handleViewPurchase = async (row) => {
        setPurchaseModal({ isOpen: true, invoice: null, loading: true });
        try {
            const res = await api.get(`/purchases/${row.id}`);
            setPurchaseModal({ isOpen: true, invoice: res.data, loading: false });
        } catch (error) {
            toast.error("Failed to load details");
            setPurchaseModal({ isOpen: false, invoice: null, loading: false });
        }
    };

    const handleViewReturn = async (row) => {
        setReturnModal({ isOpen: true, invoice: null, loading: true });
        try {
            const res = await api.get(`/purchases-return/${row.id}`);
            setReturnModal({ isOpen: true, invoice: res.data, loading: false });
        } catch (error) {
            toast.error("Failed to load details");
            setReturnModal({ isOpen: false, invoice: null, loading: false });
        }
    };

    const purchaseColumns = useMemo(() => [
        { key: "receiptNumber", header: tPurchases("table.receiptNumber") },
        {
            key: "subtotal",
            header: tPurchases("table.subtotal"),
            cell: (row) => (
                <span className="text-gray-600 dark:text-slate-200">
                    {formatCurrency(row.subtotal || 0)}
                </span>
            ),
        },

        { key: "paidAmount", header: tPurchases("table.paidAmount"), cell: (row) => formatCurrency(row.paidAmount) },
        {
            key: "remainingAmount",
            header: tPurchases("table.remainingAmount"),
            cell: (row) => (
                <span className={cn(
                    "font-medium",
                    row.remainingAmount > 0 ? "text-orange-600 dark:text-orange-400" : "text-gray-500 dark:text-slate-400"
                )}>
                    {formatCurrency(row.remainingAmount || 0)}
                </span>
            ),
        },
        { key: "created_at", header: tReturns("table.createdAt"), cell: (row) => new Date(row.created_at).toLocaleDateString() },
        {
            key: "status",
            header: tPurchases("table.status"),
            cell: (row) => (
                <Badge variant={row.status === "accepted" ? "success" : row.status === "pending" ? "warning" : "destructive"}>
                    {tPurchases(`status.${row.status}`)}
                </Badge>
            )
        },
        {
            key: "actions",
            header: tPurchases("table.actions"),
            cell: (row) => (
                <ActionButtons
                    row={row}
                    actions={[
                        {
                            icon: <Eye />,
                            tooltip: tPurchases("actions.view"),
                            onClick: handleViewPurchase,
                            variant: "primary",
                        }
                    ]}
                />
            )
        }
    ], [tPurchases, formatCurrency]);

    const returnColumns = useMemo(() => [
        { key: "returnNumber", header: tReturns("table.returnNumber") },
        { key: "totalReturn", header: tReturns("table.totalReturn"), cell: (row) => formatCurrency(row.totalReturn) },
        { key: "paidAmount", header: tReturns("table.paidAmount"), cell: (row) => formatCurrency(row.paidAmount) },
        {
            key: "remaining",
            header: tReturns("table.remainingAmount"),
            cell: (row) => (
                <span className="text-primary font-bold">
                    {formatCurrency(Number(row.totalReturn) - Number(row.paidAmount))}
                </span>
            )
        },
        { key: "created_at", header: tReturns("table.createdAt"), cell: (row) => new Date(row.created_at).toLocaleDateString() },
        {
            key: "status",
            header: tReturns("table.status"),
            cell: (row) => (
                <Badge variant={row.status === "accepted" ? "success" : row.status === "pending" ? "warning" : "destructive"}>
                    {tReturns(`statuses.${row.status}`)}
                </Badge>
            )
        },
        {
            key: "actions",
            header: tReturns("table.options"),
            cell: (row) => (
                <ActionButtons
                    row={row}
                    actions={[
                        {
                            icon: <Eye />,
                            tooltip: tReturns("actions.view"),
                            onClick: handleViewReturn,
                            variant: "primary",
                        }
                    ]}
                />
            )
        }
    ], [tReturns, formatCurrency]);

    const historyColumns = useMemo(() => [
        {
            key: "createdAt",
            header: t("history.closedAt"),
            cell: (row) => (
                <span className="tabular-nums text-[11px]">
                    {new Date(row.createdAt).toLocaleDateString()}
                </span>
            ),
        },
        {
            key: "period",
            header: t("history.period"),
            cell: (row) => (
                <span className="text-xs font-medium">
                    {new Date(row.startDate).toLocaleDateString()} - {new Date(row.endDate).toLocaleDateString()}
                </span>
            ),
        },
        {
            key: "totalPurchases",
            header: t("close.totalPurchases"),
            cell: (row) => (
                <span className="tabular-nums text-xs text-purple-600">
                    {Number(row.totalPurchases).toLocaleString()}
                </span>
            ),
        },
        {
            key: "totalReturns",
            header: t("close.totalReturns"),
            cell: (row) => (
                <span className="tabular-nums text-xs text-red-600">
                    {(Number(row.totalReturns) * -1).toLocaleString()}
                </span>
            ),
        },
        {
            key: "totalPaid",
            header: t("close.totalPayments"),
            cell: (row) => (
                <span className="tabular-nums text-xs text-emerald-600">
                    {(Number(row.totalPaid) * -1).toLocaleString()}
                </span>
            ),
        },
        {
            key: "finalBalance",
            header: t("history.balance"),
            cell: (row) => (
                <span className="font-black text-xs text-red-600 tabular-nums">
                    {Number(row.finalBalance).toLocaleString()}
                </span>
            ),
        },
        {
            key: "actions",
            header: "",
            cell: (row) => (
                <button
                    className="p-1 hover:bg-muted rounded-md transition-colors text-muted-foreground"
                    title="طباعة التقرير"
                >
                    <Download size={14} />
                </button>
            ),
        },
    ], [t]);


    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="text-center">
                    <Loader2 className="w-12 h-12 animate-spin text-primary mx-auto mb-4" />
                    <p className="text-slate-600 dark:text-slate-300">{t("loading.message")}</p>
                </div>
            </div>
        );
    }

    if (!supplier) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="text-center">
                    <p className="text-lg text-slate-600 dark:text-slate-300">{t("loading.notFound")}</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen p-5 space-y-6">
            <PageHeader
                breadcrumbs={[
                    { name: tSuppliers("breadcrumb.home"), href: "/dashboard" },
                    { name: tSuppliers("breadcrumb.suppliers"), href: "/suppliers" },
                    { name: supplier.name }
                ]}
                stats={[
                    { name: t("columns.pendingBalance"), value: formatCurrency(supplier.dueBalance || 0), icon: Wallet, color: "#F59E0B" },
                    { name: t("statement.totalPurchases"), value: formatCurrency(supplier.purchaseValue || 0), icon: ReceiptText, color: "#6B7CFF" },
                ]}
            />

            {/* Supplier Info Card */}
            <div className="grid  gap-6">
                <Card className="">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <User className="w-5 h-5 text-primary" />
                            {t("details.title")}
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                            <div className="flex items-center gap-3 p-3 rounded-xl border bg-muted/5">
                                <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center text-primary">
                                    <User size={20} />
                                </div>
                                <div>
                                    <p className="text-xs text-muted-foreground">{tSuppliers("form.name")}</p>
                                    <p className="font-bold">{supplier.name}</p>
                                </div>
                            </div>
                            <div className="flex items-center gap-3 p-3 rounded-xl border bg-muted/5">
                                <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center text-primary">
                                    <Phone size={20} />
                                </div>
                                <div>
                                    <p className="text-xs text-muted-foreground">{tSuppliers("view.phone")}</p>
                                    <p className="font-bold font-[Inter]">{supplier.phone || "—"}</p>
                                </div>
                            </div>
                            <div className="flex items-center gap-3 p-3 rounded-xl border bg-muted/5">
                                <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center text-primary">
                                    <Mail size={20} />
                                </div>
                                <div>
                                    <p className="text-xs text-muted-foreground">{tSuppliers("view.email")}</p>
                                    <p className="font-bold">{supplier.email || "—"}</p>
                                </div>
                            </div>
                            <div className="flex items-center gap-3 p-3 rounded-xl border bg-muted/5">
                                <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center text-primary">
                                    <MapPin size={20} />
                                </div>
                                <div>
                                    <p className="text-xs text-muted-foreground">{tSuppliers("view.address")}</p>
                                    <p className="font-bold">{supplier.address || "—"}</p>
                                </div>
                            </div>
                            <div className="flex items-center gap-3 p-3 rounded-xl border bg-muted/5">
                                <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center text-primary">
                                    <Calendar size={20} />
                                </div>
                                <div>
                                    <p className="text-xs text-muted-foreground">{tSuppliers("view.createdAt")}</p>
                                    <p className="font-bold">{supplier.created_at ? new Date(supplier.created_at).toLocaleDateString() : "—"}</p>
                                </div>
                            </div>
                            <div className="flex items-center gap-3 p-3 rounded-xl border bg-muted/5">
                                <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center text-primary">
                                    <Tag size={20} />
                                </div>
                                <div className="flex flex-wrap gap-1">
                                    {supplier.categories?.map(c => (
                                        <Badge key={c.id} variant="secondary">{c.name}</Badge>
                                    )) || "—"}
                                </div>
                            </div>
                            {supplier.description && (
                                <div className="flex items-start gap-3 p-3 rounded-xl border bg-muted/5 col-span-full">
                                    <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center text-primary mt-1">
                                        <FileText size={20} />
                                    </div>
                                    <div className="flex-1">
                                        <p className="text-xs text-muted-foreground">{tSuppliers("view.description")}</p>
                                        <p className="text-sm font-medium leading-relaxed">{supplier.description}</p>
                                    </div>
                                </div>
                            )}
                        </div>
                    </CardContent>
                </Card>


            </div>

            {/* Main Content Tabs */}
            <Tabs value={activeSubTab} onValueChange={setActiveSubTab} defaultValue="purchases" className="w-full dir-force ">
                <TabsList className="grid w-full grid-cols-3 !h-auto mb-6 main-card">
                    <TabsTrigger value="purchases" className="flex items-center gap-2 py-2.5">
                        <ReceiptText size={18} />
                        {t("details.purchasesTab")}
                    </TabsTrigger>
                    <TabsTrigger value="returns" className="flex items-center gap-2 py-2.5">
                        <TrendingUp size={18} />
                        {t("details.returnsTab")}
                    </TabsTrigger>
                    <TabsTrigger value="history" className="flex items-center gap-2 py-2.5">
                        <History size={18} />
                        {t("details.historyTab")}
                    </TabsTrigger>
                </TabsList>

                <TabsContent value="purchases">
                    <Table
                       searchValue={Purchasesearch}
                        onSearchChange={setPurchaseSearch}
                        labels={{
                            searchPlaceholder: tCommon("search"),
                            filter: tCommon("filter"),
                            apply: tCommon("apply"),
                            emptyTitle: tCommon("noData"),
                        }}
                        filters={
                            <div className="flex items-center gap-3">
                                <div className="flex flex-col gap-1">
                                    <span className="text-xs font-bold px-1">{tPurchases("filters.dateRange")}</span>
                                    <DateRangePicker
                                        value={{
                                            startDate: purchasesFilters.startDate,
                                            endDate: purchasesFilters.endDate
                                        }}
                                        onChange={(newDates) => setPurchasesFilters(prev => ({
                                            ...prev,
                                            ...newDates
                                        }))}
                                        placeholder={tPurchases("filters.selectDateRange")}
                                        dataSize="default"
                                    />
                                </div>
                            </div>
                        }
                        onApplyFilters={() => fetchPurchases(1)}
                        columns={purchaseColumns}
                        data={purchasesPager.records}
                        isLoading={purchasesLoading}
                        pagination={{
                            total_records: purchasesPager.total_records,
                            current_page: purchasesPager.current_page,
                            per_page: purchasesPager.per_page,
                        }}
                        onPageChange={({ page, per_page }) => fetchPurchases(page, per_page)}
                    />
                </TabsContent>

                <TabsContent value="returns">
                    <Table
                     searchValue={Returnsearch}
                        onSearchChange={setReturnSearch}
                        
                        labels={{
                            searchPlaceholder: tCommon("search"),
                            filter: tCommon("filter"),
                            apply: tCommon("apply"),
                            emptyTitle: tCommon("noData"),
                        }}
                        filters={
                            <div className="flex items-center gap-3">
                                <div className="flex flex-col gap-1">
                                    <span className="text-xs font-bold px-1">{tPurchases("filters.dateRange")}</span>
                                    <DateRangePicker
                                        value={{
                                            startDate: returnsFilters.startDate,
                                            endDate: returnsFilters.endDate
                                        }}
                                        onChange={(newDates) => setReturnsFilters(prev => ({
                                            ...prev,
                                            ...newDates
                                        }))}
                                        placeholder={tPurchases("filters.selectDateRange")}
                                        dataSize="default"
                                    />
                                </div>
                            </div>
                        }
                        onApplyFilters={() => fetchReturns(1)}
                        columns={returnColumns}
                        data={returnsPager.records}
                        isLoading={returnsLoading}
                        pagination={{
                            total_records: returnsPager.total_records,
                            current_page: returnsPager.current_page,
                            per_page: returnsPager.per_page,
                        }}
                        onPageChange={({ page, per_page }) => fetchReturns(page, per_page)}
                    />
                </TabsContent>

                <TabsContent value="history">

                    <Table
                        searchValue={Historysearch}
                        onSearchChange={setHistorySearch}
                        labels={{
                            searchPlaceholder: tCommon("search"),
                            filter: tCommon("filter"),
                            apply: tCommon("apply"),
                            emptyTitle: tCommon("noData"),
                        }}
                        filters={
                            <div className="flex items-center gap-3">
                                <div className="flex flex-col gap-1">
                                    <span className="text-xs font-bold px-1">{t("filters.year")}</span>
                                    <Select value={selectedYear} onValueChange={setSelectedYear}>
                                        <SelectTrigger className="theme-field h-9 w-32">
                                            <SelectValue placeholder={t("filters.selectYear")} />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {years.map(y => (
                                                <SelectItem key={y} value={y}>{y}</SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>
                            </div>
                        }
                        onApplyFilters={() => fetchHistory(1)}
                        columns={historyColumns}
                        data={historyPager.records}
                        isLoading={historyLoading}
                        pagination={{
                            total_records: historyPager.total_records,
                            current_page: historyPager.current_page,
                            per_page: historyPager.per_page,
                        }}
                        onPageChange={({ page, per_page }) => fetchHistory(page, per_page)}
                    />

                </TabsContent>
            </Tabs>

            {/* Modals */}
            <PurchaseDetailsModal
                isOpen={purchaseModal.isOpen}
                onClose={() => setPurchaseModal({ isOpen: false, invoice: null })}
                invoice={purchaseModal.invoice}
                isLoading={purchaseModal.loading}
                formatCurrency={formatCurrency}
            />

            <ReturnDetailsModal
                isOpen={returnModal.isOpen}
                onClose={() => setReturnModal({ isOpen: false, invoice: null })}
                invoice={returnModal.invoice}
                isLoading={returnModal.loading}
                formatCurrency={formatCurrency}
            />
        </div>
    );
}
