"use client";

import React, { useState, useMemo, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useLocale, useTranslations } from "next-intl";
import { useForm, Controller } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import * as yup from "yup";
import {
    Wallet,
    ArrowUpRight,
    ArrowDownLeft,
    ArrowLeftRight,
    Plus,
    Edit2,
    Power,
    Building2,
    Banknote,
    Smartphone,
    ClipboardList,
    Download,
    User,
    TrendingUp,
    TrendingDown,
    Eye
} from "lucide-react";
import Button_ from "@/components/atoms/Button";
import ActionButtons from "@/components/atoms/Actions";
import api from "@/utils/api";
import toast from "react-hot-toast";
import Table, { FilterField, TablePagination, TableToolbar } from "@/components/atoms/Table";
import { format } from "date-fns";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2, ArrowRight } from "lucide-react";
import { cn } from "@/utils/cn";
import { useDebounce } from "@/hook/useDebounce";
import { useExport } from "@/hook/useExport";
import { useSafeAmountWithCommission } from "@/hook/useSafeAmountWithCommission";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Card } from "@/components/ui/card";
import AccountIcon from "@/components/atoms/AccountIcon";
import DateRangePicker from "@/components/atoms/DateRangePicker";
import SafeAmountPreviewCard from "@/components/molecules/SafeAmountPreviewCard";


const TX_REFERENCE_TYPES = [
    'INITIAL_DEPOSIT',
    'MANUAL_ADD',
    'SHIPPING_COLLECTION',
    'CUSTOMER_COLLECTION',
    'ORDER_COLLECTION',
    'PURCHASE_RETURN',
    'TRANSFER_IN',
    'DEPOSIT',
    'EXPENSE_REFUND',
    'OTHER_IN',
    'PURCHASE_PAYMENT',
    'OPERATING_EXPENSE',
    'CASH_WITHDRAWAL',
    'TRANSFER_OUT',
    'VENDOR_PAYMENT',
    'BANK_FEE',
    'OTHER_OUT',
];


const getLink = (row) => {
    if (!row.referenceId) return null;
    switch (row.referenceType) {
        case 'ORDER_COLLECTION':
        case 'SHIPPING_COLLECTION':
        case 'ORDER_REFUND':
            return `/orders/details/${row.referenceId}`;
        case 'PURCHASE_PAYMENT':
            return `/purchases?detials=${row.referenceId}`;
        case 'PURCHASE_RETURN':
            return `/purchases/return?detials=${row.referenceId}`;
        case 'EXPENSE':
        case 'OPERATING_EXPENSE':
            return `/accounts?tab=manualExpenses&detials=${row.referenceId}`;
        default:
            return null;
    }
};

export default function SafesTab({ onRefresh }) {
    const t = useTranslations("accounts");
    const router = useRouter();
    const { handleExport, exportLoading } = useExport();
    const [loading, setLoading] = useState(false);
    const [activeSubTab, setActiveSubTab] = useState('accounts');

    // --- Accounts State ---
    const [search, setSearch] = useState("");
    const { debouncedValue: debouncedSearch } = useDebounce({ value: search, delay: 300 });
    const [pager, setPager] = useState({ total_records: 0, current_page: 1, per_page: 12 });
    const [accounts, setAccounts] = useState([]);

    // --- All Transactions State ---
    const [txSearch, setTxSearch] = useState("");
    const { debouncedValue: debouncedTxSearch } = useDebounce({ value: txSearch, delay: 300 });
    const [txPager, setTxPager] = useState({ total_records: 0, current_page: 1, per_page: 12 });
    const [allTransactions, setAllTransactions] = useState([]);
    const defaultTxFilters = useMemo(() => ({
        accountId: "all",
        referenceType: "all",
        direction: "all",
        startDate: "",
        endDate: "",
    }), []);
    const [txFilterDraft, setTxFilterDraft] = useState(defaultTxFilters);
    const [txFilters, setTxFilters] = useState(defaultTxFilters);

    // --- All Transfers State ---
    const [trSearch, setTrSearch] = useState("");
    const { debouncedValue: debouncedTrSearch } = useDebounce({ value: trSearch, delay: 300 });
    const [trPager, setTrPager] = useState({ total_records: 0, current_page: 1, per_page: 12 });
    const [allTransfers, setAllTransfers] = useState([]);

    // Modal states
    const [accountModalOpen, setAccountModalOpen] = useState(false);
    const [editingAccount, setEditingAccount] = useState(null);
    const [transactionModal, setTransactionModal] = useState({ open: false, direction: 'IN', accountId: null });
    const [transferModal, setTransferModal] = useState({ open: false, fromAccountId: null });
    const [txnsViewerModal, setTxnsViewerModal] = useState({ open: false, account: null });

    // Toggle Confirmation state
    const [toggleConfirm, setToggleConfirm] = useState({ open: false, account: null });

    const fetchAccounts = useCallback(async (page = pager.current_page, limit = pager.per_page, silent = false) => {
        if (!silent) setLoading(true);
        try {
            const res = await api.get('/safes/accounts', {
                params: {
                    page,
                    limit: 200,
                    search: debouncedSearch
                }
            });
            setAccounts(res.data.records || []);
            setPager({
                total_records: res.data.total_records || 0,
                current_page: res.data.current_page || page,
                per_page: res.data.per_page || limit,
            });
        } catch (err) {
            console.error(`Error fetching accounts:`, err);
            if (!silent) toast.error(t(`safes.messages.fetchError`) || "Error fetching data");
        } finally {
            if (!silent) setLoading(false);
        }
    }, [debouncedSearch, t]);

    const fetchAllTransactions = useCallback(async (page = txPager.current_page, limit = txPager.per_page, silent = false) => {
        if (!silent) setLoading(true);
        try {
            const params = {
                page,
                limit,
                search: debouncedTxSearch
            };

            if (txFilters.accountId && txFilters.accountId !== "all") params.accountId = txFilters.accountId;
            if (txFilters.referenceType && txFilters.referenceType !== "all") params.referenceType = txFilters.referenceType;
            if (txFilters.direction && txFilters.direction !== "all") params.direction = txFilters.direction;
            if (txFilters.startDate) params.startDate = txFilters.startDate;
            if (txFilters.endDate) params.endDate = txFilters.endDate;

            const res = await api.get('/safes/transactions', {
                params
            });
            setAllTransactions(res.data.records || []);
            setTxPager({
                total_records: res.data.total_records || 0,
                current_page: res.data.current_page || page,
                per_page: res.data.per_page || limit,
            });
        } catch (err) {
            console.error(`Error fetching transactions:`, err);
            if (!silent) toast.error(t(`safes.messages.fetchError`) || "Error fetching data");
        } finally {
            if (!silent) setLoading(false);
        }
    }, [debouncedTxSearch, t, txFilters]);

    const fetchAllTransfers = useCallback(async (page = trPager.current_page, limit = trPager.per_page, silent = false) => {
        if (!silent) setLoading(true);
        try {
            const res = await api.get('/safes/transfers', {
                params: {
                    page,
                    limit,
                    search: debouncedTrSearch
                }
            });
            setAllTransfers(res.data.records || []);
            setTrPager({
                total_records: res.data.total_records || 0,
                current_page: res.data.current_page || page,
                per_page: res.data.per_page || limit,
            });
        } catch (err) {
            console.error(`Error fetching transfers:`, err);
            if (!silent) toast.error(t(`safes.messages.fetchError`) || "Error fetching data");
        } finally {
            if (!silent) setLoading(false);
        }
    }, [debouncedTrSearch, t]);

    const handleRefreshAll = async () => {
        if (activeSubTab === 'accounts') await fetchAccounts(pager.current_page, pager.per_page, true);
        else if (activeSubTab === 'transactions') await fetchAllTransactions(txPager.current_page, txPager.per_page, true);
        else if (activeSubTab === 'transfers') await fetchAllTransfers(trPager.current_page, trPager.per_page, true);
        onRefresh?.();
    };

    useEffect(() => {
        if (activeSubTab === 'accounts') fetchAccounts(1);
        else if (activeSubTab === 'transactions') fetchAllTransactions(1);
        else if (activeSubTab === 'transfers') fetchAllTransfers(1);
    }, [activeSubTab, debouncedSearch, debouncedTxSearch, debouncedTrSearch, fetchAccounts, fetchAllTransactions, fetchAllTransfers]);

    useEffect(() => {
        if (activeSubTab === 'transactions' && accounts.length === 0) {
            fetchAccounts(1, 200, true);
        }
    }, [activeSubTab, accounts.length, fetchAccounts]);

    const handlePageChange = ({ page, per_page }) => {
        if (activeSubTab === 'accounts') fetchAccounts(page, per_page);
        else if (activeSubTab === 'transactions') fetchAllTransactions(page, per_page);
        else if (activeSubTab === 'transfers') fetchAllTransfers(page, per_page);
    };

    const hasActiveTxFilters = useMemo(() => (
        txFilters.accountId !== "all" ||
        txFilters.referenceType !== "all" ||
        txFilters.direction !== "all" ||
        Boolean(txFilters.startDate) ||
        Boolean(txFilters.endDate)
    ), [txFilters]);

    const applyTransactionsFilters = useCallback(() => {
        setTxFilters(txFilterDraft);
        setTxPager((prev) => ({ ...prev, current_page: 1 }));
    }, [txFilterDraft]);

    // ─────────────────────────────────────────────────────────────────────────
    // ACTION HANDLERS
    // ─────────────────────────────────────────────────────────────────────────

    const handleAddAccount = () => {
        setEditingAccount(null);
        setAccountModalOpen(true);
    };

    const handleEditAccount = (acc) => {
        setEditingAccount(acc);
        setAccountModalOpen(true);
    };

    const handleToggleAccount = (acc) => {
        setToggleConfirm({ open: true, account: acc });
    };

    const confirmToggleAccount = async () => {
        const acc = toggleConfirm.account;
        if (!acc) return;
        try {
            await api.patch(`/safes/accounts/${acc.id}/toggle`);
            toast.success(acc.status === 'ACTIVE' ? t("safes.messages.accountDeactivated") : t("safes.messages.accountActivated"));
            setToggleConfirm({ open: false, account: null });
            fetchAccounts(pager.current_page, pager.per_page, true);
        } catch (err) {
            toast.error(err.response?.data?.message || "Error");
        }
    };

    const handleOpenTransactions = (account) => {
        setTxnsViewerModal({ open: true, account });
    };

    const handleDeposit = (accountId) => {
        setTransactionModal({ open: true, direction: 'IN', accountId });
    };

    const handleWithdraw = (accountId) => {
        setTransactionModal({ open: true, direction: 'OUT', accountId });
    };

    const handleNewTransfer = (fromAccountId = null) => {
        setTransferModal({ open: true, fromAccountId });
    };

    const handleExportData = () => {
        let endpoint = "";
        let params = {};
        let filename = "";

        if (activeSubTab === 'accounts') {
            endpoint = "/safes/accounts/export";
            params = { search: debouncedSearch };
            filename = `Accounts_${Date.now()}.xlsx`;
        } else if (activeSubTab === 'transactions') {
            endpoint = "/safes/transactions/export";
            params = {
                search: debouncedTxSearch,
                ...txFilters
            };
            if (params.accountId === "all") delete params.accountId;
            if (params.referenceType === "all") delete params.referenceType;
            if (params.direction === "all") delete params.direction;
            filename = `Transactions_${Date.now()}.xlsx`;
        } else if (activeSubTab === 'transfers') {
            endpoint = "/safes/transfers/export";
            params = {
                search: debouncedTrSearch
            };
            filename = `Transfers_${Date.now()}.xlsx`;
        }

        if (endpoint) {
            handleExport({ endpoint, params, filename });
        }
    };

    const locale = useLocale()
    return (
        <div className="space-y-6">
            <Tabs value={activeSubTab} onValueChange={setActiveSubTab} dir={locale === 'ar' ? 'rtl' : 'ltr'}>
                {/* Topbar */}
                <Card className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-4" >
                    <div className="flex flex-col gap-2">
                        <h2 className="text-lg font-semibold font-black text-gray-900 dark:text-white">{t("safes.title")}</h2>
                        <TabsList>
                            <TabsTrigger value="accounts">{t("safes.tabs.accounts")}</TabsTrigger>
                            <TabsTrigger value="transactions">{t("safes.tabs.transactions")}</TabsTrigger>
                            <TabsTrigger value="transfers">{t("safes.tabs.transfers")}</TabsTrigger>
                        </TabsList>
                    </div>
                    <div className="flex items-center gap-3">
                        {/* <TableToolbar
                            hasSearch={true}
                            searchValue={activeSubTab === 'accounts' ? search : activeSubTab === 'transactions' ? txSearch : trSearch}
                            onSearchChange={activeSubTab === 'accounts' ? setSearch : activeSubTab === 'transactions' ? setTxSearch : setTrSearch}
                            searchPlaceholder={t("safes.accounts.searchPlaceholder") || "Search..."}
                        /> */}
                        <Button_
                            label={t("safes.transfers.new")}
                            icon={<ArrowLeftRight size={16} />}
                            variant="outline"
                            size="sm"
                            onClick={() => handleNewTransfer(null)}
                        />
                        <Button_
                            label={t("safes.accounts.add")}
                            icon={<Plus size={16} />}
                            tone="primary"
                            variant="solid"
                            className="bg-teal-500 hover:bg-teal-600 border-none text-white"
                            size="sm"
                            onClick={handleAddAccount}
                        />
                    </div>
                </Card>

                <TabsContent value="accounts">
                    {loading ? (
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                            {[...Array(8)].map((_, i) => (
                                <div key={i} className="bg-white dark:bg-slate-900 border border-[var(--border)] p-5 rounded-2xl min-h-[300px] animate-pulse">
                                    <div className="h-1.5 w-full bg-muted mb-5"></div>
                                    <div className="flex justify-between mb-5">
                                        <div className="h-4 w-16 bg-muted rounded"></div>
                                        <div className="flex gap-2">
                                            <div className="h-4 w-4 bg-muted rounded"></div>
                                            <div className="h-4 w-4 bg-muted rounded"></div>
                                        </div>
                                    </div>
                                    <div className="h-12 w-12 bg-muted rounded-xl mb-4"></div>
                                    <div className="h-6 w-3/4 bg-muted rounded mb-2"></div>
                                    <div className="h-4 w-1/2 bg-muted rounded mb-4"></div>
                                    <div className="h-16 w-full bg-muted rounded-xl mb-4"></div>
                                    <div className="grid grid-cols-4 gap-2 pt-4 border-t border-[var(--border)]">
                                        {[...Array(4)].map((_, j) => <div key={j} className="h-10 bg-muted rounded-lg"></div>)}
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <>
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                                {/* Account Cards */}
                                {accounts.map((acc, i) => {
                                    const isInactive = acc.status !== 'ACTIVE';

                                    return (
                                        <div
                                            key={acc.id}
                                            className={`relative bg-white dark:bg-slate-900 border border-[var(--border)] p-5 transition-all hover:-translate-y-1 hover:shadow-xl group overflow-hidden flex flex-col justify-between min-h-[300px] ${isInactive ? 'opacity-60' : ''}`}
                                            style={{ borderRadius: 'var(--radius-lg)', fontFamily: 'var(--font-arabic)' }}
                                        >
                                            {/* Top Gradient Line using your primary-from/to logic */}
                                            <div className="absolute top-0 inset-x-0 h-1.5 bg-gradient-to-r from-[var(--primary)] to-[var(--third)]"></div>

                                            <div className="flex-1">
                                                {/* Header */}
                                                <div className="flex justify-between items-center mb-5">
                                                    <span
                                                        className="text-[10px] font-bold px-2.5 py-1 rounded-md tracking-wider uppercase"
                                                        style={{
                                                            backgroundColor: `color-mix(in srgb, var(--primary), transparent 90%)`,
                                                            color: 'var(--primary)'
                                                        }}
                                                    >
                                                        {t(`safes.accounts.types.${acc.type}`)}
                                                    </span>
                                                    <div className="flex items-center gap-2">
                                                        <button onClick={() => handleEditAccount(acc)} className="text-[var(--muted-foreground)] hover:text-[var(--primary)] transition-colors">
                                                            <Edit2 size={15} />
                                                        </button>
                                                        <button
                                                            onClick={() => handleToggleAccount(acc)}
                                                            className={cn(
                                                                "transition-all duration-200",
                                                                isInactive ? "text-rose-500 hover:text-rose-600" : "text-emerald-500 hover:text-emerald-600"
                                                            )}
                                                            title={isInactive ? t("safes.accounts.activate") : t("safes.accounts.deactivate")}
                                                        >
                                                            <Power size={15} />
                                                        </button>
                                                    </div>
                                                </div>

                                                {/* Info */}
                                                <div className="mb-4">
                                                    <div className="mb-3 p-2 rounded-xl inline-block bg-[var(--muted)]" style={{ color: 'var(--primary)' }}>
                                                        <AccountIcon type={acc.type} size={24} />
                                                    </div>
                                                    <h3 className="text-[16px] font-bold text-[var(--foreground)] mb-1 truncate">{acc.name}</h3>
                                                    <p className="text-[12px] text-[var(--muted-foreground)] truncate flex items-center gap-1">
                                                        <User size={12} /> {acc.managedBy?.name || t("safes.accounts.noOwner")}
                                                    </p>
                                                </div>

                                                {/* Balance Box - Styled like your StatusDonut legend items */}
                                                <div className="bg-[var(--muted)] dark:bg-slate-800/40 rounded-xl px-4 py-3 mb-4 border border-[var(--border)]">
                                                    <p className="text-[10px] text-[var(--muted-foreground)] uppercase tracking-widest mb-1 font-bold">
                                                        {t("safes.accounts.balance")}
                                                    </p>
                                                    <div className="text-xl font-black tracking-tight truncate" style={{ color: 'var(--primary)' }}>
                                                        {acc.currentBalance?.toLocaleString()} <span className="text-xs ml-1 opacity-70">{acc.currency}</span>
                                                    </div>
                                                </div>
                                            </div>

                                            {/* Action Buttons - Unified with your .btn-solid / muted style */}
                                            <div className="grid grid-cols-4 gap-2 pt-4 border-t border-[var(--border)] mt-auto">
                                                {[
                                                    { icon: ClipboardList, label: t("safes.tabs.transactions"), onClick: () => handleOpenTransactions(acc), className: "" },
                                                    { icon: ArrowUpRight, label: t("safes.transactions.deposit"), onClick: () => handleDeposit(acc.id), className: "bg-emerald-50 text-emerald-600 hover:bg-emerald-500 hover:text-white dark:bg-emerald-500/10 dark:text-emerald-400 dark:hover:bg-emerald-500" },
                                                    { icon: ArrowDownLeft, label: t("safes.transactions.withdraw"), onClick: () => handleWithdraw(acc.id), className: "bg-rose-50 text-rose-600 hover:bg-rose-500 hover:text-white dark:bg-rose-500/10 dark:text-rose-400 dark:hover:bg-rose-500" },
                                                    { icon: ArrowLeftRight, label: t("safes.tabs.transfers"), onClick: () => handleNewTransfer(acc.id), className: "" },
                                                ].map((btn, idx) => (
                                                    <button
                                                        key={idx}
                                                        onClick={btn.onClick}
                                                        disabled={isInactive}
                                                        className={cn(
                                                            "flex flex-col items-center justify-center gap-1.5 p-2 rounded-lg border border-transparent bg-[var(--muted)] hover:bg-[var(--primary)] hover:text-white dark:bg-slate-800 dark:hover:bg-[var(--primary)] text-[var(--muted-foreground)] transition-all text-[9px] font-bold disabled:opacity-30",
                                                            btn.className
                                                        )}
                                                    >
                                                        <btn.icon size={16} />
                                                        <span className="truncate w-full text-center">{btn.label}</span>
                                                    </button>
                                                ))}
                                            </div>
                                        </div>
                                    );
                                })}

                                {/* Add New Card */}
                                <div
                                    onClick={handleAddAccount}
                                    className="flex flex-col items-center justify-center gap-3 border-2 border-dashed border-gray-300 dark:border-gray-700 rounded-2xl min-h-[320px] cursor-pointer hover:border-primary/50 hover:bg-primary/10 dark:hover:bg-primary/10 transition-all group"
                                >
                                    <Plus size={32} className="text-muted-foreground/80 group-hover:text-[var(--primary)]" />
                                    <span className="text-[13px] font-bold text-primary/80 group-hover:text-[var(--primary)] dark:group-hover:text-[var(--primary)]/80">
                                        {t("safes.accounts.add")}
                                    </span>
                                </div>
                            </div>
                            {/* 
                            <div className="mt-6 flex">
                                <TablePagination
                                    pagination={{
                                        total_records: pager.total_records,
                                        current_page: pager.current_page,
                                        per_page: pager.per_page,
                                    }}
                                    onPageChange={handlePageChange}
                                />
                            </div> */}
                        </>
                    )}
                </TabsContent>

                <TabsContent value="transactions">
                    <Table
                        isLoading={loading}
                        searchValue={txSearch}
                        onSearchChange={setTxSearch}
                        labels={{
                            searchPlaceholder: t("safes.transactions.searchPlaceholder") || "Search transactions...",
                            filter: t("toolbar.filter") || "Filter",
                            apply: t("filters.apply") || "Apply",
                        }}
                        actions={[
                            {
                                key: "export",
                                label: t("toolbar.export") || "Export",
                                icon: exportLoading ? (
                                    <Loader2 size={14} className="animate-spin" />
                                ) : (
                                    <Download size={14} />
                                ),
                                color: "primary",
                                onClick: handleExportData,
                                disabled: exportLoading,
                            },
                        ]}
                        hasActiveFilters={hasActiveTxFilters}
                        onApplyFilters={applyTransactionsFilters}
                        filters={
                            <>
                                <FilterField label={t("safes.transactions.account")}>
                                    <Select
                                        value={txFilterDraft.accountId}
                                        onValueChange={(v) => setTxFilterDraft((f) => ({ ...f, accountId: v }))}
                                    >
                                        <SelectTrigger className="h-10 rounded-xl border-border bg-background text-sm">
                                            <SelectValue placeholder={t("safes.transactions.account")} />
                                        </SelectTrigger>
                                        <SelectContent className="bg-card-select">
                                            <SelectItem value="all">{t("filters.all") || "All"}</SelectItem>
                                            {accounts.map((acc) => (
                                                <SelectItem key={acc.id} value={String(acc.id)}>
                                                    {acc.name}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </FilterField>

                                <FilterField label={t("safes.transactions.type")}>
                                    <Select
                                        value={txFilterDraft.referenceType}
                                        onValueChange={(v) => setTxFilterDraft((f) => ({ ...f, referenceType: v }))}
                                    >
                                        <SelectTrigger className="h-10 rounded-xl border-border bg-background text-sm">
                                            <SelectValue placeholder={t("safes.transactions.type")} />
                                        </SelectTrigger>
                                        <SelectContent className="bg-card-select">
                                            <SelectItem value="all">{t("filters.all") || "All"}</SelectItem>
                                            {TX_REFERENCE_TYPES.map((type) => (
                                                <SelectItem key={type} value={type}>
                                                    {t(`safes.transactions.types.${type}`)}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </FilterField>

                                <FilterField label={t("safes.transactions.direction")}>
                                    <Select
                                        value={txFilterDraft.direction}
                                        onValueChange={(v) => setTxFilterDraft((f) => ({ ...f, direction: v }))}
                                    >
                                        <SelectTrigger className="h-10 rounded-xl border-border bg-background text-sm">
                                            <SelectValue placeholder={t("safes.transactions.direction")} />
                                        </SelectTrigger>
                                        <SelectContent className="bg-card-select">
                                            <SelectItem value="all">{t("filters.all") || "All"}</SelectItem>
                                            <SelectItem value="IN">{t("safes.transactions.directions.IN")}</SelectItem>
                                            <SelectItem value="OUT">{t("safes.transactions.directions.OUT")}</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </FilterField>

                                <FilterField label={t("filters.dateRange") || "Date range"}>
                                    <DateRangePicker
                                        value={{
                                            startDate: txFilterDraft.startDate,
                                            endDate: txFilterDraft.endDate,
                                        }}
                                        onChange={(newDates) => setTxFilterDraft((f) => ({ ...f, ...newDates }))}
                                        placeholder={t("filters.selectDateRange") || "تاريخ"}
                                        dataSize="default"
                                        maxDate="today"
                                    />
                                </FilterField>
                            </>
                        }
                        columns={[
                            {
                                header: "ID",
                                key: "number",
                                cell: (row) => <span className="text-[10px] font-black font-mono text-gray-400 dark:text-slate-500 uppercase">{row.number}</span>
                            },
                            {
                                header: t("safes.transactions.account"),
                                key: "account",
                                cell: (row) => <span className="text-xs font-bold text-gray-700 dark:text-slate-200">{row?.account?.name}</span>
                            },
                            {
                                header: t("safes.transactions.date"),
                                key: "transactionDate",
                                cell: (row) => (
                                    <div className="flex flex-col">
                                        <span className="text-xs font-bold text-gray-700 dark:text-slate-200">{row.transactionDate ? format(new Date(row.transactionDate), "yyyy-MM-dd") : "-"}</span>
                                        <span className="text-[10px] text-gray-400 dark:text-slate-500">{row.transactionDate ? format(new Date(row.transactionDate), "HH:mm") : ""}</span>
                                    </div>
                                )
                            },
                            {
                                header: t("safes.transactions.type"),
                                key: "referenceType",
                                cell: (row) => (
                                    <span className="text-xs font-bold text-gray-600 dark:text-slate-300">
                                        {t(`safes.transactions.types.${row.referenceType}`)}
                                    </span>
                                )
                            },
                            {
                                header: t("safes.transactions.metadata.title") || "Metadata",
                                key: "metadata",
                                cell: (row) => {
                                    if (!row.referenceMeta) return "-";
                                    const metadata = Object.entries(row.referenceMeta);
                                    if (metadata?.length == 0) return "-";
                                    return (
                                        <div className="flex flex-wrap gap-1 max-w-[200px]">
                                            {metadata.map(([key, value]) => (
                                                <div key={key} className="flex items-center gap-1 bg-gray-100 dark:bg-slate-800 px-1.5 py-0.5 rounded text-[9px] font-bold">
                                                    <span className="text-gray-500">{t(`safes.transactions.metadata.${key}`) || key}:</span>
                                                    <span className="text-primary">{value}</span>
                                                </div>
                                            ))}
                                        </div>
                                    );
                                }
                            },
                            {
                                header: t("safes.transactions.direction"),
                                key: "direction",
                                cell: (row) => (
                                    <div className={cn(
                                        "inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[10px] font-black uppercase tracking-wider",
                                        row.direction === 'IN' ? 'bg-emerald-50 text-emerald-600 dark:bg-emerald-500/10 dark:text-emerald-400' : 'bg-rose-50 text-rose-600 dark:bg-rose-500/10 dark:text-rose-400'
                                    )}>
                                        {row.direction === 'IN' ? <TrendingUp size={10} /> : <TrendingDown size={10} />}
                                        {t(`safes.transactions.directions.${row.direction}`)}
                                    </div>
                                )
                            },
                            {
                                header: t("safes.transactions.amount"),
                                key: "amount",
                                cell: (row) => (
                                    <div className="flex flex-col">
                                        <span className={cn(
                                            "text-sm font-black tabular-nums tracking-tight",
                                            row.direction === 'IN' ? "text-emerald-600 dark:text-emerald-400" : "text-rose-600 dark:text-rose-400"
                                        )}>
                                            {row.direction === 'IN' ? "+" : "-"}{row.amount?.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                                            <span className="text-[10px] ml-1 opacity-70 uppercase">{row?.currency}</span>
                                        </span>
                                    </div>
                                )
                            },
                            {
                                header: t("safes.transfers.commission"),
                                key: "commission",
                                cell: (row) => (
                                    <span className="text-xs font-medium tabular-nums text-rose-500">
                                        {row.commission > 0 ? `-${row.commission?.toLocaleString()} ${row?.outTransaction?.currency || ""}` : "-"}
                                        {row.commissionRate > 0 && row.direction === 'OUT' ? ` (${row.commissionRate?.toLocaleString()}%)` : ""}
                                    </span>
                                )
                            },
                            // {
                            //     header: t("safes.transactions.balanceBefore"),
                            //     key: "balanceBefore",
                            //     cell: (row) => {
                            //         const netChange = row.direction === 'IN' ? (row.amount - row.commission) : -(Number(row.amount) + Number(row.commission));
                            //         const before = Number(row.balanceAfter) - netChange;
                            //         return <span className="text-xs font-bold text-gray-500 tabular-nums">{before?.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                            //     }
                            // },
                            {
                                header: t("safes.transactions.balanceAfter"),
                                key: "balanceAfter",
                                cell: (row) => <span className="text-xs font-bold text-gray-800 dark:text-slate-200 tabular-nums">
                                    {Number(row.balanceAfter)?.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                                    <span className="text-[10px] ml-1 opacity-70 uppercase">{row?.currency}</span>
                                </span>
                            },

                            // {
                            //     header: t("safes.transactions.counterparty"),
                            //     key: "counterparty",
                            //     cell: (row) => <span className="text-xs font-semibold text-gray-600 dark:text-slate-300">{row.counterparty?.name || "-"}</span>
                            // },
                            {
                                header: t("safes.accounts.createdBy"),
                                key: "createdBy",
                                cell: (row) => <span className="text-xs font-semibold text-gray-600 dark:text-slate-300">{row.createdBy?.name || "-"}</span>
                            },
                            {
                                header: t("safes.transactions.notes"),
                                key: "notes",
                                cell: (row) => <span className="text-[11px] text-gray-500 dark:text-slate-400  block" title={row.notes}>{row.notes || "-"}</span>
                            },
                            {
                                header: t("safes.accounts.actions"),
                                key: "actions",
                                cell: (row) => {

                                    const link = getLink(row);
                                    return (
                                        <ActionButtons
                                            row={row}
                                            actions={[
                                                {
                                                    icon: <Eye />,
                                                    tooltip: t("common.view") || "View",
                                                    onClick: () => link && router.push(link),
                                                    variant: "purple",
                                                    disabled: !link
                                                }
                                            ]}
                                        />
                                    );
                                }
                            },
                        ]}
                        data={allTransactions}
                        pagination={{ total_records: txPager.total_records, current_page: txPager.current_page, per_page: txPager.per_page }}
                        onPageChange={handlePageChange}
                    />
                </TabsContent>

                <TabsContent value="transfers">
                    <Table
                        isLoading={loading}
                        searchValue={trSearch}
                        onSearchChange={setTrSearch}
                        labels={{ searchPlaceholder: t("safes.transfers.searchPlaceholder") || "Search transfers..." }}
                        actions={[
                            {
                                key: "export",
                                label: t("toolbar.export") || "Export",
                                icon: exportLoading ? (
                                    <Loader2 size={14} className="animate-spin" />
                                ) : (
                                    <Download size={14} />
                                ),
                                color: "primary",
                                onClick: handleExportData,
                                disabled: exportLoading,
                            },
                        ]}
                        columns={[
                            {
                                header: t("safes.transfers.from"),
                                key: "fromAccount",
                                cell: (row) => (
                                    <div className="flex flex-col gap-0.5">
                                        <div className="flex items-center gap-2">
                                            <Building2 size={14} className="text-rose-500" />
                                            <span className="text-xs font-bold text-gray-700 dark:text-slate-200">{row.fromAccount?.name}</span>
                                        </div>
                                        {row.outTransaction?.balanceAfter !== undefined && (
                                            <span className="text-[10px] font-medium text-gray-400 dark:text-slate-500 flex items-center gap-1">
                                                {t("safes.transactions.balanceAfter")}:
                                                <span className="font-bold text-gray-600 dark:text-slate-400 tabular-nums">
                                                    {Number(row.outTransaction.balanceAfter).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                                                </span>
                                                <span className="text-[10px] opacity-70 uppercase">{row.outTransaction?.currency}</span>
                                            </span>
                                        )}
                                    </div>
                                )
                            },
                            {
                                header: t("safes.transfers.to"),
                                key: "toAccount",
                                cell: (row) => (
                                    <div className="flex flex-col gap-0.5">
                                        <div className="flex items-center gap-2">
                                            <Building2 size={14} className="text-emerald-500" />
                                            <span className="text-xs font-bold text-gray-700 dark:text-slate-200">{row.toAccount?.name}</span>
                                        </div>
                                        {row.inTransaction?.balanceAfter !== undefined && (
                                            <span className="text-[10px] font-medium text-gray-400 dark:text-slate-500 flex items-center gap-1">
                                                {t("safes.transactions.balanceAfter")}:
                                                <span className="font-bold text-gray-600 dark:text-slate-400 tabular-nums">
                                                    {Number(row.inTransaction.balanceAfter).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                                                </span>
                                                <span className="text-[10px] opacity-70 uppercase">{row.inTransaction?.currency}</span>
                                            </span>
                                        )}
                                    </div>
                                )
                            },
                            {
                                header: t("safes.transfers.amount"),
                                key: "amount",
                                cell: (row) => (
                                    <span className="text-sm font-black tabular-nums tracking-tight text-gray-800 dark:text-slate-100">
                                        {row.amount?.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                                    </span>
                                )
                            },
                            {
                                header: t("safes.transfers.commission"),
                                key: "commission",
                                cell: (row) => (
                                    <span className="text-xs font-medium tabular-nums text-rose-500">
                                        {row.commission > 0 ? `-${row.commission?.toLocaleString()} ${row?.outTransaction?.currency || ""}` : "-"}
                                        {row.commissionRate > 0 ? ` (${row.commissionRate?.toLocaleString()}%)` : ""}
                                    </span>
                                )
                            },
                            {
                                header: t("safes.accounts.createdBy"),
                                key: "createdBy",
                                cell: (row) => <span className="text-xs font-semibold text-gray-600 dark:text-slate-300">{row.createdBy?.name || "-"}</span>
                            },
                            {
                                header: t("safes.transactions.date"),
                                key: "createdAt",
                                cell: (row) => (
                                    <span className="text-xs text-gray-500 dark:text-slate-400">
                                        {row.createdAt ? format(new Date(row.createdAt), "yyyy-MM-dd HH:mm") : "-"}
                                    </span>
                                )
                            },
                            {
                                header: t("safes.transfers.notes"),
                                key: "notes",
                                cell: (row) => <span className="text-[11px] text-gray-500 dark:text-slate-400  block" title={row.notes}>{row.notes || "-"}</span>
                            },
                        ]}
                        data={allTransfers}
                        pagination={{ total_records: trPager.total_records, current_page: trPager.current_page, per_page: trPager.per_page }}
                        onPageChange={handlePageChange}
                    />
                </TabsContent>
            </Tabs>

            {/* Modals */}
            <AccountModal
                open={accountModalOpen}
                onOpenChange={setAccountModalOpen}
                editingAccount={editingAccount}
                onSave={handleRefreshAll}
            />

            <TransactionModal
                open={transactionModal.open}
                onOpenChange={(open) => setTransactionModal(prev => ({ ...prev, open }))}
                direction={transactionModal.direction}
                initialAccountId={transactionModal.accountId}
                accounts={accounts.filter(a => a.status === 'ACTIVE')}
                onSave={handleRefreshAll}
            />

            <TransferModal
                open={transferModal.open}
                onOpenChange={(open) => setTransferModal(prev => ({ ...prev, open }))}
                initialAccountId={transferModal.fromAccountId}
                accounts={accounts.filter(a => a.status === 'ACTIVE')}
                onSave={handleRefreshAll}
            />

            <TransactionsViewerModal
                open={txnsViewerModal.open}
                onOpenChange={(open) => setTxnsViewerModal(prev => ({ ...prev, open }))}
                account={txnsViewerModal.account}
            />

            <ConfirmDialog
                open={toggleConfirm.open}
                onOpenChange={(open) => setToggleConfirm(prev => ({ ...prev, open }))}
                title={toggleConfirm.account?.status === 'ACTIVE' ? t("safes.accounts.deactivateTitle") : t("safes.accounts.activateTitle")}
                description={toggleConfirm.account?.status === 'ACTIVE' ? t("safes.accounts.deactivateDesc") : t("safes.accounts.activateDesc")}
                confirmText={toggleConfirm.account?.status === 'ACTIVE' ? t("safes.accounts.deactivate") : t("safes.accounts.activate")}
                cancelText={t("common.cancel")}
                onConfirm={confirmToggleAccount}
                variant={toggleConfirm.account?.status === 'ACTIVE' ? 'destructive' : 'success'}
            />
        </div >
    );
}

function ConfirmDialog({ open, onOpenChange, title, description, confirmText, cancelText, onConfirm, loading = false, variant = 'destructive' }) {
    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="!max-w-md rounded-3xl border border-gray-100 dark:border-slate-800 shadow-2xl p-6">
                <div className="space-y-2">
                    <h3 className="text-lg font-black text-gray-900 dark:text-slate-100">{title}</h3>
                    {description ? <p className="text-sm text-gray-500 dark:text-slate-400 font-medium">{description}</p> : null}
                </div>

                <div className="mt-8 flex items-center justify-end gap-3">
                    <Button_ variant="outline" onClick={() => onOpenChange(false)} disabled={loading} label={cancelText} className="rounded-xl px-6" />
                    <Button_
                        onClick={onConfirm}
                        disabled={loading}
                        label={loading ? <Loader2 className="w-4 h-4 animate-spin" /> : confirmText}
                        className={cn(
                            "rounded-xl px-6 text-white border-none",
                            variant === 'destructive' ? "bg-rose-500 hover:bg-rose-600 shadow-lg shadow-rose-500/20" : "bg-emerald-500 hover:bg-emerald-600 shadow-lg shadow-emerald-500/20"
                        )}
                    />
                </div>
            </DialogContent>
        </Dialog>
    );
}

// ─────────────────────────────────────────────────────────────────────────
// TRANSACTIONS VIEWER MODAL (NEW)
// ─────────────────────────────────────────────────────────────────────────
function TransactionsViewerModal({ open, onOpenChange, account }) {
    const t = useTranslations("accounts");
    const router = useRouter();
    const [transactions, setTransactions] = useState([]);
    const [loading, setLoading] = useState(false);
    const [search, setSearch] = useState("");
    const { debouncedValue: debouncedSearch } = useDebounce({ value: search, delay: 300 });
    const [pager, setPager] = useState({ current_page: 1, per_page: 12, total_records: 0 });
    const { handleExport, exportLoading } = useExport();

    const fetchAccountTransactions = useCallback(async (page = pager.current_page, limit = pager.per_page) => {
        setLoading(true);
        try {
            const res = await api.get('/safes/transactions', {
                params: {
                    accountId: account.id,
                    page,
                    limit,
                    search: debouncedSearch
                }
            });
            setTransactions(res.data.records || []);
            setPager({
                total_records: res.data.total_records || 0,
                current_page: res.data.current_page || page,
                per_page: res.data.per_page || limit,
            });
        } catch (err) {
            toast.error(t("safes.messages.fetchError"));
        } finally {
            setLoading(false);
        }
    }, [account?.id, debouncedSearch, t]);

    useEffect(() => {
        if (open && account?.id) fetchAccountTransactions(1);
        else if (!open) {
            setTransactions([]);
            setSearch("");
        }
    }, [open, account?.id, debouncedSearch, fetchAccountTransactions]);

    const handlePageChange = ({ page, per_page }) => {
        fetchAccountTransactions(page, per_page);
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-4xl md:min-w-4xl max-h-[90vh] overflow-hidden flex flex-col p-0 border-none bg-transparent shadow-none">
                <div className="bg-white dark:bg-[#162032] rounded-3xl overflow-hidden border border-gray-100 dark:border-slate-800 shadow-2xl flex flex-col h-full">
                    <DialogHeader className="p-6 border-b border-gray-50 dark:border-slate-800/50 bg-gray-50/50 dark:bg-slate-900/20">
                        <DialogTitle className="flex items-center gap-3 text-xl font-bold text-gray-800 dark:text-slate-100">
                            <div className="w-10 h-10 rounded-xl bg-teal-500/10 flex items-center justify-center text-teal-500">
                                <ClipboardList size={20} />
                            </div>
                            <div className="flex flex-col">
                                <span>{t("safes.tabs.transactions")}</span>
                                <span className="text-xs font-medium text-teal-600 dark:text-teal-400 mt-0.5">{account?.name}</span>
                            </div>
                        </DialogTitle>
                    </DialogHeader>

                    <div className="flex-1 overflow-y-auto ">
                        <Table
                            isLoading={loading}
                            searchValue={search}
                            flat={true}
                            onSearchChange={setSearch}
                            labels={{ searchPlaceholder: t("safes.transactions.searchPlaceholder") || "Search transactions..." }}
                            actions={[
                                {
                                    key: "export",
                                    label: t("toolbar.export") || "Export",
                                    icon: exportLoading ? (
                                        <Loader2 size={14} className="animate-spin" />
                                    ) : (
                                        <Download size={14} />
                                    ),
                                    color: "primary",
                                    onClick: () => handleExport({
                                        endpoint: "/safes/transactions/export",
                                        params: { accountId: account?.id, search: debouncedSearch },
                                        filename: `Transactions_${account?.name}_${Date.now()}.xlsx`
                                    }),
                                    disabled: exportLoading,
                                },
                            ]}
                            columns={[
                                {
                                    header: "ID",
                                    key: "number",
                                    cell: (row) => <span className="text-[10px] font-black font-mono text-gray-400 dark:text-slate-500 uppercase">{row.number}</span>
                                },
                                {
                                    header: t("safes.transactions.date"),
                                    key: "transactionDate",
                                    cell: (row) => (
                                        <div className="flex flex-col">
                                            <span className="text-xs font-bold text-gray-700 dark:text-slate-200">{row.transactionDate ? format(new Date(row.transactionDate), "yyyy-MM-dd") : "-"}</span>
                                            <span className="text-[10px] text-gray-400 dark:text-slate-500">{row.transactionDate ? format(new Date(row.transactionDate), "HH:mm") : ""}</span>
                                        </div>
                                    )
                                },
                                {
                                    header: t("safes.transactions.type"),
                                    key: "referenceType",
                                    cell: (row) => (
                                        <span className="text-xs font-bold text-gray-600 dark:text-slate-300">
                                            {t(`safes.transactions.types.${row.referenceType}`)}
                                        </span>
                                    )
                                },
                                {
                                    header: t("safes.transactions.metadata.title") || "Metadata",
                                    key: "metadata",
                                    cell: (row) => {
                                        if (!row.referenceMeta) return "-";
                                        const metadata = Object.entries(row.referenceMeta);
                                        if (metadata?.length == 0) return "-";
                                        return (
                                            <div className="flex flex-wrap gap-1 max-w-[200px]">
                                                {metadata.map(([key, value]) => (
                                                    <div key={key} className="flex items-center gap-1 bg-gray-100 dark:bg-slate-800 px-1.5 py-0.5 rounded text-[9px] font-bold">
                                                        <span className="text-gray-500">{t(`safes.transactions.metadata.${key}`) || key}:</span>
                                                        <span className="text-primary">{value}</span>
                                                    </div>
                                                ))}
                                            </div>
                                        );
                                    }
                                },
                                {
                                    header: t("safes.transactions.direction"),
                                    key: "direction",
                                    cell: (row) => (
                                        <div className={cn(
                                            "inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[10px] font-black uppercase tracking-wider",
                                            row.direction === 'IN' ? 'bg-emerald-50 text-emerald-600 dark:bg-emerald-500/10 dark:text-emerald-400' : 'bg-rose-50 text-rose-600 dark:bg-rose-500/10 dark:text-rose-400'
                                        )}>
                                            {row.direction === 'IN' ? <TrendingUp size={10} /> : <TrendingDown size={10} />}
                                            {t(`safes.transactions.directions.${row.direction}`)}
                                        </div>
                                    )
                                },
                                {
                                    header: t("safes.transactions.amount"),
                                    key: "amount",
                                    cell: (row) => (
                                        <div className="flex flex-col">
                                            <span className={cn(
                                                "text-sm font-black tabular-nums tracking-tight",
                                                row.direction === 'IN' ? "text-emerald-600 dark:text-emerald-400" : "text-rose-600 dark:text-rose-400"
                                            )}>
                                                {row.direction === 'IN' ? "+" : "-"}{row.amount?.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                                                <span className="text-[10px] ml-1 opacity-70 uppercase">{row?.currency}</span>
                                            </span>
                                        </div>
                                    )
                                },
                                {
                                    header: t("safes.transfers.commission"),
                                    key: "commission",
                                    cell: (row) => (
                                        <span className="text-xs font-medium tabular-nums text-rose-500">
                                            {row.commission > 0 ? `-${row.commission?.toLocaleString()} ${row?.outTransaction?.currency || ""}` : "-"}
                                            {row.commissionRate > 0 && row.direction === 'OUT' ? ` (${row.commissionRate?.toLocaleString()}%)` : ""}
                                        </span>
                                    )
                                },
                                // {
                                //     header: t("safes.transactions.balanceBefore"),
                                //     key: "balanceBefore",
                                //     cell: (row) => {
                                //         const netChange = row.direction === 'IN' ? (row.amount - row.commission) : -(Number(row.amount) + Number(row.commission));
                                //         const before = Number(row.balanceAfter) - netChange;
                                //         return <span className="text-xs font-bold text-gray-500 tabular-nums">{before?.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                                //     }
                                // },
                                {
                                    header: t("safes.transactions.balanceAfter"),
                                    key: "balanceAfter",
                                    cell: (row) => <span className="text-xs font-bold text-gray-800 dark:text-slate-200 tabular-nums">
                                        {Number(row.balanceAfter)?.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                                        <span className="text-[10px] ml-1 opacity-70 uppercase">{row?.currency}</span>
                                    </span>
                                },

                                // {
                                //     header: t("safes.transactions.counterparty"),
                                //     key: "counterparty",
                                //     cell: (row) => <span className="text-xs font-semibold text-gray-600 dark:text-slate-300">{row.counterparty?.name || "-"}</span>
                                // },
                                {
                                    header: t("safes.accounts.createdBy"),
                                    key: "createdBy",
                                    cell: (row) => <span className="text-xs font-semibold text-gray-600 dark:text-slate-300">{row.createdBy?.name || "-"}</span>
                                },
                                {
                                    header: t("safes.transactions.notes"),
                                    key: "notes",
                                    cell: (row) => <span className="text-[11px] text-gray-500 dark:text-slate-400  block" title={row.notes}>{row.notes || "-"}</span>
                                },
                                // Created By
                                {
                                    header: t("safes.accounts.actions"),
                                    key: "actions",
                                    cell: (row) => {

                                        const link = getLink(row);
                                        return (
                                            <ActionButtons
                                                row={row}
                                                actions={[
                                                    {
                                                        icon: <Eye />,
                                                        tooltip: t("common.view") || "View",
                                                        onClick: () => link && router.push(link),
                                                        variant: "purple",
                                                        disabled: !link
                                                    }
                                                ]}
                                            />
                                        );
                                    }
                                },
                            ]}
                            data={transactions}
                            pagination={{ total_records: pager.total_records, current_page: pager.current_page, per_page: pager.per_page }}
                            onPageChange={handlePageChange}
                        />
                    </div>

                    <DialogFooter className="p-4 border-t border-gray-50 dark:border-slate-800/50 bg-gray-50/50 dark:bg-slate-900/20">
                        <Button_ variant="outline" onClick={() => onOpenChange(false)} label={t("common.close")} className="rounded-xl px-8" />
                    </DialogFooter>
                </div>
            </DialogContent>
        </Dialog>
    );
}
// ─────────────────────────────────────────────────────────────────────────
// SHARED FORM HELPERS
// ─────────────────────────────────────────────────────────────────────────
const Field = ({ label, children, error, required }) => (
    <div className="space-y-2">
        <Label className="flex items-center gap-1 text-[11px] font-bold text-gray-500 uppercase tracking-wider font-mono">
            {label}
            {required && <span className="text-red-500">*</span>}
        </Label>
        {children}
        {error && <p className="text-xs text-red-500">{error}</p>}
    </div>
);

// ─────────────────────────────────────────────────────────────────────────
// ACCOUNT MODAL
// ─────────────────────────────────────────────────────────────────────────
const createAccountSchema = (t) =>
    yup.object({
        name: yup.string().trim().required(t("safes.accounts.validation.nameRequired")),
        type: yup.string().required(t("safes.accounts.validation.typeRequired")),
        currency: yup.string().required(t("safes.accounts.validation.currencyRequired")),
        initialBalance: yup.number().transform((value) => (isNaN(value) ? 0 : value)).default(0),
        bankName: yup.string().when('type', { is: 'BANK', then: (s) => s.required(t("safes.accounts.validation.bankNameRequired")), otherwise: (s) => s.nullable() }),
        accountOwnerName: yup.string().when('type', { is: (v) => ['BANK', 'WALLET'].includes(v), then: (s) => s.required(t("safes.accounts.validation.accountOwnerNameRequired")), otherwise: (s) => s.nullable() }),
        accountNumber: yup.string().when('type', { is: (v) => ['BANK', 'WALLET'].includes(v), then: (s) => s.required(t("safes.accounts.validation.accountNumberRequired")), otherwise: (s) => s.nullable() }),
        iban: yup.string().nullable(),
        managedById: yup.string().when('type', { is: 'EMPLOYEE_CUSTODY', then: (s) => s.required(t("safes.accounts.validation.managedByRequired")), otherwise: (s) => s.nullable() }),
        commissionRate: yup.number().transform((v) => (isNaN(v) ? 0 : v)).min(0).max(100).default(0),
        notes: yup.string().nullable(),
    });

export function AccountModal({ open, onOpenChange, editingAccount, onSave }) {
    const t = useTranslations("accounts");
    const [loading, setLoading] = useState(false);
    const [employees, setEmployees] = useState([]);

    const { register, handleSubmit, control, reset, watch, formState: { errors } } = useForm({
        resolver: yupResolver(createAccountSchema(t)), mode: "onBlur",
        defaultValues: { name: "", type: "CASH", currency: "EGP", initialBalance: 0, bankName: "", accountOwnerName: "", accountNumber: "", iban: "", managedById: null, commissionRate: 0, notes: "" }
    });
    const accountType = watch("type");

    useEffect(() => {
        if (open) {

            reset(editingAccount ?
                {
                    name: editingAccount?.name || "",
                    type: editingAccount?.type || "CASH",
                    currency: editingAccount?.currency || "EGP",
                    initialBalance: editingAccount?.initialBalance || 0,
                    bankName: editingAccount?.bankName || "",
                    accountOwnerName: editingAccount?.accountOwnerName || "",
                    accountNumber: editingAccount?.accountNumber || "",
                    iban: editingAccount?.iban || "",
                    managedById: editingAccount?.managedById || null,
                    commissionRate: editingAccount?.commissionRate || 0,
                    notes: editingAccount?.commissionRate?.notes || ""
                } :
                { name: "", type: "CASH", currency: "EGP", initialBalance: 0, bankName: "", accountOwnerName: "", accountNumber: "", iban: "", managedById: null, commissionRate: 0, notes: "" });

        }
    }, [open, editingAccount, reset]);

    useEffect(() => {
        const load = async () => {
            if (accountType === 'EMPLOYEE_CUSTODY') {
                await fetchEmployees();
            }
        };

        load();
    }, [accountType]);


    const fetchEmployees = async () => {
        try { const res = await api.get("/users", { params: { limit: 1000 } }); setEmployees(res.data.records || []); } catch (err) { }
    };

    const onSubmit = async (data) => {
        setLoading(true);
        try {
            if (editingAccount) {
                const { type, initialBalance, ...rest } = data;
                await api.patch(`/safes/accounts/${editingAccount.id}`, rest);
                toast.success(t("safes.messages.accountUpdated"));
            } else {
                await api.post("/safes/accounts", data);
                toast.success(t("safes.messages.accountCreated"));
            }
            onSave();
            onOpenChange(false);
        } catch (err) { toast.error(err.response?.data?.message || t("safes.messages.fetchError")); } finally { setLoading(false); }
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
                <DialogHeader><DialogTitle>{editingAccount ? t("safes.accounts.edit") : t("safes.accounts.add")}</DialogTitle></DialogHeader>
                <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 py-4">
                    <div className="grid grid-cols-2 gap-4">
                        <Field label={t("safes.accounts.name")} error={errors.name?.message} required><Input {...register("name")} /></Field>
                        <Field label={t("safes.accounts.type")} error={errors.type?.message} required>
                            <Controller control={control} name="type" render={({ field }) => (
                                <Select onValueChange={field.onChange} value={field.value} disabled={!!editingAccount}>
                                    <SelectTrigger>
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="CASH">{t("safes.accounts.types.CASH")}</SelectItem>
                                        <SelectItem value="BANK">{t("safes.accounts.types.BANK")}</SelectItem>
                                        <SelectItem value="WALLET">{t("safes.accounts.types.WALLET")}</SelectItem>
                                        <SelectItem value="EMPLOYEE_CUSTODY">{t("safes.accounts.types.EMPLOYEE_CUSTODY")}</SelectItem>
                                    </SelectContent>
                                </Select>
                            )} />
                        </Field>
                        <Field label={t("safes.accounts.currency")} error={errors.currency?.message} required>
                            <Controller control={control} name="currency" render={({ field }) => (
                                <Select onValueChange={field.onChange} value={field.value}>
                                    <SelectTrigger><SelectValue /></SelectTrigger>
                                    <SelectContent>{["EGP", "SAR", "USD", "AED"].map((curr) => <SelectItem key={curr} value={curr}>{curr}</SelectItem>)}</SelectContent>
                                </Select>
                            )} />
                        </Field>
                        <Field label={t("safes.accounts.initialBalance")} error={errors.initialBalance?.message}><Input type="number" {...register("initialBalance")} disabled={!!editingAccount} /></Field>
                    </div>
                    {accountType === 'BANK' && (
                        <div className="grid grid-cols-2 gap-4">
                            <Field label={t("safes.accounts.bankName")} error={errors.bankName?.message} required><Input {...register("bankName")} /></Field>
                            <Field label={t("safes.accounts.accountOwnerName")} error={errors.accountOwnerName?.message} required><Input {...register("accountOwnerName")} /></Field>
                            <Field label={t("safes.accounts.accountNumber")} error={errors.accountNumber?.message} required><Input {...register("accountNumber")} /></Field>
                            <Field label={t("safes.accounts.iban")} error={errors.iban?.message}><Input {...register("iban")} /></Field>
                            <Field label={t("safes.accounts.commissionRate")} error={errors.commissionRate?.message}><Input type="number" {...register("commissionRate")} /></Field>
                        </div>
                    )}
                    {accountType === 'WALLET' && (
                        <div className="grid grid-cols-2 gap-4">
                            <Field label={t("safes.accounts.accountOwnerName")} error={errors.accountOwnerName?.message} required><Input {...register("accountOwnerName")} /></Field>
                            <Field label={t("safes.accounts.accountNumber")} error={errors.accountNumber?.message} required><Input {...register("accountNumber")} /></Field>
                            <Field label={t("safes.accounts.commissionRate")} error={errors.commissionRate?.message}><Input type="number" {...register("commissionRate")} /></Field>
                        </div>
                    )}
                    {accountType === 'EMPLOYEE_CUSTODY' && (
                        <Field label={t("safes.accounts.managedBy")} error={errors.managedById?.message} required>
                            <Controller control={control} name="managedById" render={({ field }) => (
                                <Select onValueChange={field.onChange} value={field.value}>
                                    <SelectTrigger><SelectValue /></SelectTrigger>
                                    <SelectContent>{employees.map((emp) => <SelectItem key={emp.id} value={emp.id}>{emp.name}</SelectItem>)}</SelectContent>
                                </Select>
                            )} />
                        </Field>
                    )}
                    <Field label="Notes" error={errors.notes?.message}><Textarea {...register("notes")} /></Field>
                    <DialogFooter><Button_ type="submit" disabled={loading} label={loading ? <Loader2 className="animate-spin" size={18} /> : "Save"} className="bg-teal-500 hover:bg-teal-600 text-white" /></DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}

// ─────────────────────────────────────────────────────────────────────────
// TRANSACTION MODAL (DEPOSIT/WITHDRAW)
// ─────────────────────────────────────────────────────────────────────────
const createTransactionSchema = (t, direction, accounts) =>
    yup.object({
        accountId: yup.string().required(t("safes.transactions.validation.accountRequired")),
        amount: yup.number().transform((v) => (isNaN(v) ? 0 : v)).required(t("safes.transactions.validation.amountRequired")).positive(t("safes.transactions.validation.amountPositive"))
            .test('max-balance', t("safes.transactions.validation.insufficientBalance"), function (value) {
                if (direction !== 'OUT') return true;
                const account = accounts.find(a => a.id === this.parent.accountId);
                return !account || value <= account.currentBalance;
            }),
        transactionDate: yup.string().required(t("safes.transactions.validation.dateRequired")),
        // counterparty: yup.string().nullable(),
        notes: yup.string().nullable(),
        referenceType: yup.string().required(t("safes.transactions.validation.typeRequired")),
    });

function TransactionModal({ open, onOpenChange, direction, initialAccountId, accounts, onSave }) {
    const t = useTranslations("accounts");
    const [loading, setLoading] = useState(false);
    const IN_TYPES = ['MANUAL_ADD', 'SHIPPING_COLLECTION', 'CUSTOMER_COLLECTION', 'PURCHASE_RETURN', 'TRANSFER_IN', 'DEPOSIT', 'EXPENSE_REFUND', 'OTHER_IN'];
    const OUT_TYPES = ['PURCHASE_PAYMENT', 'OPERATING_EXPENSE', 'CASH_WITHDRAWAL', 'TRANSFER_OUT', 'VENDOR_PAYMENT', 'BANK_FEE', 'OTHER_OUT'];
    const currentTypes = direction === 'IN' ? IN_TYPES : OUT_TYPES;

    const { register, handleSubmit, control, reset, watch, setValue, formState: { errors } } = useForm({
        resolver: yupResolver(createTransactionSchema(t, direction, accounts)), mode: "onBlur",
        defaultValues: { accountId: "", amount: 0, transactionDate: format(new Date(), "yyyy-MM-dd"), counterparty: "", notes: "", referenceType: direction === 'IN' ? 'MANUAL_ADD' : 'OPERATING_EXPENSE' }
    });

    const selectedAccountId = watch("accountId");
    const amountValue = watch("amount");
    const { selectedAccount, commissionAmount, finalAmount } = useSafeAmountWithCommission({
        safeId: selectedAccountId,
        accounts,
        amount: amountValue,
        direction,
        onSetValue: setValue,
        amountField: "amount",
    });

    useEffect(() => {
        if (open) {
            reset({
                accountId: initialAccountId || accounts[0]?.id || "",
                amount: 0,
                transactionDate: format(new Date(), "yyyy-MM-dd"),
                // counterparty: "",
                notes: "",
                referenceType: direction === 'IN' ? 'MANUAL_ADD' : 'OPERATING_EXPENSE'
            });
        }
    }, [open, accounts, direction, initialAccountId, reset]);

    const onSubmit = async (data) => {
        setLoading(true);
        try {
            await api.post(direction === 'IN' ? "/safes/transactions/deposit" : "/safes/transactions/withdraw", data);
            toast.success(direction === 'IN' ? t("safes.messages.depositSuccess") : t("safes.messages.withdrawSuccess"));
            onSave();
            onOpenChange(false);
        } catch (err) { toast.error(err.response?.data?.message || t("safes.messages.fetchError")); } finally { setLoading(false); }
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[500px]">
                <DialogHeader><DialogTitle >{direction === 'IN' ? t("safes.transactions.deposit") : t("safes.transactions.withdraw")}</DialogTitle></DialogHeader>

                <SafeAmountPreviewCard
                    account={selectedAccount}
                    amount={Number(amountValue)}
                    commissionAmount={commissionAmount}
                    commissionRateLabel={t("safes.accounts.commissionRate")}
                    amountLabel={direction === 'IN' ? t("safes.transactions.amountToDeposit") : t("safes.transactions.amountToWithdraw")}
                    direction={direction}
                />

                <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 py-2">
                    <Field label={t("safes.transactions.account")} error={errors.accountId?.message} required>
                        <Controller control={control} name="accountId" render={({ field }) => (
                            <Select onValueChange={field.onChange} value={field.value}>
                                <SelectTrigger><SelectValue /></SelectTrigger>
                                <SelectContent>{accounts.map(acc => <SelectItem key={acc.id} value={acc.id}>{acc.name} ({acc.currentBalance.toLocaleString()})</SelectItem>)}</SelectContent>
                            </Select>
                        )} />
                    </Field>
                    <Field label={t("safes.transactions.referenceType")} error={errors.referenceType?.message} required>
                        <Controller control={control} name="referenceType" render={({ field }) => (
                            <Select onValueChange={field.onChange} value={field.value}>
                                <SelectTrigger><SelectValue /></SelectTrigger>
                                <SelectContent>{currentTypes.map(type => <SelectItem key={type} value={type}>{t(`safes.transactions.types.${type}`)}</SelectItem>)}</SelectContent>
                            </Select>
                        )} />
                    </Field>
                    <div className="grid grid-cols-2 gap-4">
                        <Field label={t("safes.transactions.amount")} error={errors.amount?.message} required>
                            <Input type="number" {...register("amount")} max={direction === 'OUT' ? selectedAccount?.currentBalance : undefined} />
                        </Field>
                        <Field label={t("safes.transactions.date")} error={errors.transactionDate?.message} required>
                            <Input type="date" {...register("transactionDate")} />
                        </Field>
                    </div>
                    {/* <Field label={t("safes.transactions.counterparty")} error={errors.counterparty?.message}><Input {...register("counterparty")} /></Field> */}
                    <Field label={t("safes.transactions.notes")} error={errors.notes?.message}><Textarea {...register("notes")} /></Field>
                    <DialogFooter>
                        <Button_ type="button" variant="outline" onClick={() => onOpenChange(false)} label={t("common.cancel") || "Cancel"} />
                        <Button_ type="submit" disabled={loading || (direction === 'OUT' && (Number(amountValue) <= 0 || (selectedAccount && Number(amountValue) > Number(selectedAccount.currentBalance))))} label={loading ? <Loader2 className="animate-spin" size={18} /> : t('confirm')} className={direction === 'IN' ? 'bg-teal-500 hover:bg-teal-600 text-white' : 'bg-red-500 hover:bg-red-600 text-white'} />
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}

// ─────────────────────────────────────────────────────────────────────────
// TRANSFER MODAL
// ─────────────────────────────────────────────────────────────────────────
const createTransferSchema = (t, accounts) =>
    yup.object({
        fromAccountId: yup.string().required(t("safes.transfers.validation.fromAccountRequired")),
        toAccountId: yup.string().required(t("safes.transfers.validation.toAccountRequired")).test('not-same', t("safes.transfers.validation.sameAccount"), function (value) { return value !== this.parent.fromAccountId; }),
        amount: yup.number().transform((v) => (isNaN(v) ? 0 : v)).required(t("safes.transfers.validation.amountRequired")).positive(t("safes.transfers.validation.amountPositive"))
            .test('max-balance', t("safes.transfers.validation.insufficientBalance"), function (value) {
                const account = accounts.find(a => a.id === this.parent.fromAccountId);
                const commission = account && account.commissionRate ? (value * (account.commissionRate / 100)) : 0;
                return !account || (value + commission) <= account.currentBalance;
            }),
        notes: yup.string().nullable(),
    });

function TransferModal({ open, onOpenChange, accounts, initialAccountId, onSave }) {
    const t = useTranslations("accounts");
    const [loading, setLoading] = useState(false);

    const { register, handleSubmit, control, reset, watch, setValue, formState: { errors } } = useForm({
        resolver: yupResolver(createTransferSchema(t, accounts)), mode: "onBlur",
        defaultValues: {
            fromAccountId: initialAccountId || "",
            toAccountId: initialAccountId && (initialAccountId === accounts?.[0]?.id ? accounts?.[1]?.id || "" : accounts?.[1]?.id || ""),
            amount: 0, notes: ""
        }
    });

    const fromAccountId = watch("fromAccountId");
    const toAccountId = watch("toAccountId");
    const amountValue = watch("amount");
    const sourceAccount = useMemo(() => accounts.find(a => a.id === fromAccountId), [fromAccountId, accounts]);

    const commissionAmount = useMemo(() => {
        if (!sourceAccount || !sourceAccount.commissionRate) return 0;
        return (Number(amountValue) * (sourceAccount.commissionRate / 100));
    }, [sourceAccount, amountValue]);

    const finalAmount = useMemo(() => {
        return Number(amountValue) + commissionAmount;
    }, [amountValue, commissionAmount]);

    useEffect(() => {
        if (sourceAccount) {
            const currentCommRate = sourceAccount.commissionRate || 0;
            const totalNeeded = Number(amountValue) + (Number(amountValue) * (currentCommRate / 100));
            if (totalNeeded > sourceAccount.currentBalance) {
                // If amount + (amount * rate/100) > balance
                // amount * (1 + rate/100) > balance
                // amount > balance / (1 + rate/100)
                const maxAmount = sourceAccount.currentBalance / (1 + (currentCommRate / 100));
                if (Number(amountValue) > maxAmount) {
                    setValue("amount", Math.floor(maxAmount * 100) / 100, { shouldValidate: true });
                }
            }
        }
    }, [amountValue, sourceAccount, setValue]);

    useEffect(() => {
        if (open) reset({
            fromAccountId: initialAccountId || "",
            toAccountId: initialAccountId && (initialAccountId === accounts?.[0]?.id ? accounts?.[1]?.id || "" : accounts?.[0]?.id || ""),
            amount: 0, notes: ""
        });
    }, [open, accounts, reset, initialAccountId]);

    const onSubmit = async (data) => {
        setLoading(true);
        try {
            await api.post("/safes/transfers", data);
            toast.success(t("safes.transfers.success"));
            onSave();
            onOpenChange(false);
        } catch (err) { toast.error(err.response?.data?.message || t("safes.messages.fetchError")); } finally { setLoading(false); }
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[450px]">
                <DialogHeader><DialogTitle>{t("safes.transfers.new")}</DialogTitle></DialogHeader>

                {/* Account Info Card */}
                {sourceAccount && (
                    <div className="bg-gray-50 dark:bg-slate-900/50 p-4 rounded-2xl border border-gray-100 dark:border-slate-800 mb-2 grid grid-cols-2 gap-y-2">
                        <div className="flex flex-col">
                            <span className="text-[10px] text-gray-500 uppercase font-bold">{t("safes.transfers.from")}</span>
                            <span className="text-sm font-bold truncate">{sourceAccount.name}</span>
                        </div>
                        <div className="flex flex-col items-end text-right">
                            <span className="text-[10px] text-gray-500 uppercase font-bold">{t("safes.accounts.balance")}</span>
                            <span className="text-sm font-black text-primary">{sourceAccount.currentBalance?.toLocaleString()} {sourceAccount.currency}</span>
                        </div>
                        <div className="flex flex-col">
                            <span className="text-[10px] text-gray-500 uppercase font-bold">{t("safes.accounts.commissionRate")}</span>
                            <span className="text-sm font-bold text-rose-500">%{sourceAccount.commissionRate || 0}</span>
                        </div>
                        {commissionAmount > 0 && (
                            <div className="flex flex-col items-end text-right">
                                <span className="text-[10px] text-gray-500 uppercase font-bold">{t("safes.transfers.commission")}</span>
                                <span className="text-sm font-bold text-rose-500">-{commissionAmount.toLocaleString()} {sourceAccount.currency}</span>
                            </div>
                        )}
                    </div>
                )}

                {/* Preview Box */}
                <div className="p-4 rounded-xl border-2 border-primary/30 bg-primary/5 text-center mb-4">
                    <div className="text-3xl font-black font-mono text-primary">
                        {Number(finalAmount || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        <span className="text-xs ml-1 opacity-70 uppercase">{sourceAccount?.currency}</span>
                    </div>
                    <div className="text-xs text-gray-500 mt-1 uppercase tracking-wider font-bold">
                        {t("safes.transfers.amountToTransfer")}
                        {commissionAmount > 0 && <span className="block text-[10px] text-rose-400 mt-0.5 lowercase">(after commission)</span>}
                    </div>
                </div>

                <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 py-0">
                    <Field label={t("safes.transfers.from")} error={errors.fromAccountId?.message} required>
                        <Controller control={control} name="fromAccountId" render={({ field }) => (
                            <Select onValueChange={field.onChange} value={field.value}>
                                <SelectTrigger><SelectValue /></SelectTrigger>
                                <SelectContent>{accounts.map(acc => <SelectItem key={acc.id} value={acc.id}>{acc.name} ({acc.currentBalance.toLocaleString()})</SelectItem>)}</SelectContent>
                            </Select>
                        )} />
                    </Field>
                    <Field label={t("safes.transfers.to")} error={errors.toAccountId?.message} required>
                        <Controller control={control} name="toAccountId" render={({ field }) => (
                            <Select onValueChange={field.onChange} value={field.value}>
                                <SelectTrigger><SelectValue /></SelectTrigger>
                                <SelectContent>{accounts.map(acc => <SelectItem key={acc.id} value={acc.id} disabled={acc.id === fromAccountId}>{acc.name} ({acc.currentBalance.toLocaleString()})</SelectItem>)}</SelectContent>
                            </Select>
                        )} />
                    </Field>
                    <Field label={t("safes.transfers.amount")} error={errors.amount?.message} required>
                        <Input type="number" {...register("amount")} />
                    </Field>
                    <Field label={t("safes.transfers.notes")} error={errors.notes?.message}><Textarea {...register("notes")} /></Field>
                    <DialogFooter>
                        <Button_ type="submit" disabled={loading || Number(amountValue) <= 0 || toAccountId === fromAccountId} label={loading ? <Loader2 className="animate-spin" size={18} /> : t('transfer')} className="bg-teal-500 hover:bg-teal-600 text-white w-full" />

                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}