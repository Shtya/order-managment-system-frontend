"use client";

import React, { useMemo, useState, useEffect } from "react";
import { useTranslations } from "next-intl";
import { useSearchParams, useRouter } from "next/navigation";
import PageHeader from "@/components/atoms/Pageheader";
import { Info, BarChart2, DollarSign, Wallet, CheckCircle, Plus, Building2, TrendingUp, Calendar, Package, Settings, RefreshCw, ArrowUpRight, ArrowDownLeft } from "lucide-react";
import Button_ from "@/components/atoms/Button";
import api from "@/utils/api";
import Flatpickr from "react-flatpickr";
import DateRangePicker from "@/components/atoms/DateRangePicker";
// Import tabs
import OverviewTab from "./tabs/OverviewTab";
import MonthlyExpensesTab from "./tabs/MonthlyExpensesTab";
import ManualExpensesTab, { ManualExpenseFormModal, DeleteManualExpenseAlert, CATEGORY_CONFIG, CategoryFormModal, DeleteCategoryAlert } from "./tabs/ManualExpensesTab";
import SupplierAccountsTab from "./tabs/SupplierAccountsTab";
import MonthClosingTab from "./tabs/MonthClosingTab";
import SafesTab from "./tabs/SafesTab";
import SupplierPaymentsTab from "./tabs/SupplierPaymentsTab";
import toast from "react-hot-toast";

export default function Accounts() {
    const tTutorial = useTranslations("tutorial");
    const t = useTranslations("accounts");
    const searchParams = useSearchParams();
    const router = useRouter();

    // States الخاصة بالتصنيفات
    const [categoryModalOpen, setCategoryModalOpen] = useState(false);
    const [categoryDeleteAlertOpen, setCategoryDeleteAlertOpen] = useState(false);
    const [editingCategory, setEditingCategory] = useState(null);
    const [categories, setCategories] = useState([]);

    // Get current tab from search params or default to 'overview'
    const activeTab = searchParams.get("tab") || "overview";

    // Stats and Filters state
    const [stats, setStats] = useState(null);
    const [loadingStats, setLoadingStats] = useState(false);
    const [refreshKey, setRefreshKey] = useState(0);

    const refreshStats = () => setRefreshKey(prev => prev + 1);

    // Default dates: this month
    const now = new Date();
    const [filters, setFilters] = useState({
        startDate: null,
        endDate: null,
    });

    const fetchCategories = async () => {
        try {
            setLoadingStats(true);
            const res = await api.get("/expense-categories");
            setCategories(res.data || []);
        } catch (err) {
            console.error("Error fetching categories:", err);
        } finally {
            setLoadingStats(false);
        }
    };

    useEffect(() => {
        fetchCategories();
    }, []);

    useEffect(() => {
        const fetchStats = async () => {
            // Add monthClosing and safes to the condition
            if (["overview", "monthlyExpenses", "supplierAccounts", "supplierPayments", "monthClosing", "safes"].includes(activeTab)) {
                setLoadingStats(true);
                try {
                    let endpoint = "/accounting/stats";
                    let params = { ...filters };

                    if (activeTab === "supplierAccounts") {
                        endpoint = "/accounting/supplier-closings/financial-stats";
                        params = {};
                    } else if (activeTab === "supplierPayments") {
                        endpoint = "/supplier-payments/stats";
                        params = {};
                    } else if (activeTab === "monthClosing") {
                        endpoint = "/monthly-closings/stats";
                        params = {};
                    } else if (activeTab === "safes") {
                        endpoint = "/safes/stats";
                        params = {};
                    }

                    const res = await api.get(endpoint, { params });
                    setStats(res.data);
                } catch (err) {
                    console.error("Error fetching stats:", err);
                } finally {
                    setLoadingStats(false);
                }
            }
        };

        fetchStats();
    }, [activeTab, filters, refreshKey]);

    const handleTabChange = (tabId) => {
        const params = new URLSearchParams(searchParams);
        params.set("tab", tabId);
        router.push(`?${params.toString()}`);
    };

    // Handlers
    const handleAddCategory = () => {
        setEditingCategory(null);
        setCategoryModalOpen(true);
    };

    // Delete category
    const handleDeleteCategory = async (cat) => {
        setEditingCategory(cat);
        setCategoryDeleteAlertOpen(true);
    };

    const handleEditCategory = (cat) => {
        setEditingCategory(cat);
        setCategoryModalOpen(true);
    };

    const ACCOUNTS_TABS = useMemo(() => [
        { id: "overview", label: t("tabs.overview"), description: tTutorial("accounts.tabs.overview.description"), example: tTutorial("accounts.tabs.overview.example") },
        // { id: "monthlyExpenses", label: t("tabs.monthlyExpenses") },
        { id: "manualExpenses", label: t("tabs.manualExpenses"), description: tTutorial("accounts.tabs.manualExpenses.description"), example: tTutorial("accounts.tabs.manualExpenses.example") },
        // { id: "cityDeliveries", label: t("tabs.cityDeliveries") },
        // { id: "employeePerformance", label: t("tabs.employeePerformance") },
        { id: "supplierAccounts", label: t("tabs.supplierAccounts"), description: tTutorial("accounts.tabs.supplierAccounts.description"), example: tTutorial("accounts.tabs.supplierAccounts.example") },
        { id: "supplierPayments", label: t("tabs.supplierPayments"), description: tTutorial("accounts.tabs.supplierPayments.description"), example: tTutorial("accounts.tabs.supplierPayments.example") },
        { id: "monthClosing", label: t("tabs.monthClosing"), description: tTutorial("accounts.tabs.monthClosing.description"), example: tTutorial("accounts.tabs.monthClosing.example") },
        { id: "safes", label: t("tabs.safes"), description: tTutorial("accounts.tabs.safes.description"), example: tTutorial("accounts.tabs.safes.example") },
    ], [t, tTutorial]);

    // Memoized valid tab ids
    const validTabIds = useMemo(
        () => new Set(ACCOUNTS_TABS.map(tab => tab.id)),
        [ACCOUNTS_TABS]
    );

    // Fallback to overview if invalid
    const currentTab = validTabIds.has(activeTab)
        ? activeTab
        : "overview";

    // Mock stats based on active tab
    const statsData = useMemo(() => {
        if (activeTab === "overview" || activeTab === "monthlyExpenses") {
            return [
                { name: t("stats.productPurchases"), description: t("statsDescription.productPurchases"), value: stats?.productCost?.toLocaleString() || "0", icon: BarChart2, color: "#8b5cf6", example: tTutorial("accounts.stats_example.overview_productPurchases") },
                { name: t("stats.manualExpenses"), description: t("statsDescription.manualExpenses"), value: stats?.manualExpenses?.toLocaleString() || "0", icon: BarChart2, color: "#a855f7", example: tTutorial("accounts.stats_example.overview_manualExpenses") },
                { name: t("stats.totalExpenses"), description: t("statsDescription.totalExpenses"), value: stats ? (Number(stats?.manualExpenses) + Number(stats?.productCost)).toLocaleString() || "0" : "0", icon: DollarSign, color: "#f97316", example: tTutorial("accounts.stats_example.overview_totalExpenses") },
                { name: t("stats.returns"), description: t("statsDescription.returns"), value: stats?.returnsCost?.toLocaleString() || "0", icon: BarChart2, color: "#ef4444", example: tTutorial("accounts.stats_example.overview_returns") },
            ];
        }

        if (activeTab === "manualExpenses") {
            return [
                ...categories.map(cat => ({
                    id: cat.id,
                    name: cat.name,
                    value: `${cat.expensesCount || 0} ${t("stats.manualExpensesStat")} · ${Number(cat.totalCost || 0).toLocaleString()}`,
                    icon: Plus,
                    // color: "#a855f7",
                    editable: true,
                    onDelete: () => handleDeleteCategory(cat),
                    // 4. تغيير الـ onEdit ليفتح نافذة التصنيفات
                    onEdit: () => handleEditCategory(cat),
                })),
                {
                    id: "add",
                    name: t("manualExpenses.categoryMgmt.addNew") || "إضافة تصنيف جديد",
                    icon: Plus,
                    color: "#94a3b8",
                    isAddCard: true,
                    // 5. الكارت الأخير يفتح نافذة إضافة تصنيف جديد
                    onClick: handleAddCategory,
                }
            ];
        }

        // if (activeTab === "cityDeliveries") {
        //     return [
        //         { name: t("cityDeliveries.stats.topCity"), value: stats?.highestCity?.city && stats?.highestCity?.count !== undefined ? `${stats.highestCity.city} (${stats.highestCity.count})` : "N/A", icon: CheckCircle, color: "#10b981" },
        //         { name: t("cityDeliveries.stats.lowestCity"), value: stats?.lowestCity?.city && stats?.lowestCity?.count !== undefined ? `${stats.lowestCity.city} (${stats.lowestCity.count})` : "N/A", icon: Info, color: "#ef4444" },
        //         { name: t("cityDeliveries.stats.avgDeliveries"), value: stats?.deliveriesRate !== undefined ? `${stats.deliveriesRate}%` : "0%", icon: BarChart2, color: "#3b82f6" },
        //     ];
        // }

        if (activeTab === "supplierAccounts") {
            return [
                { name: t("stats.productPurchases"), description: t("statsDescription.totalPurchases"), value: stats?.totalPurchases?.toLocaleString() || "0", icon: Building2, color: "#3b82f6", example: tTutorial("accounts.stats_example.supplierAccounts_totalPurchases") },
                { name: t("stats.totalPaid"), description: t("statsDescription.totalPaid"), value: stats?.totalPaid?.toLocaleString() || "0", icon: Wallet, color: "#10b981", example: tTutorial("accounts.stats_example.supplierAccounts_totalPaid") },
                { name: t("stats.returns"), description: t("statsDescription.returns"), value: stats?.totalReturns?.toLocaleString() || "0", icon: BarChart2, color: "#ef4444", example: tTutorial("accounts.stats_example.supplierAccounts_returns") },
                { name: t("stats.totalReceived"), description: t("statsDescription.totalPaid"), value: stats?.totalTaken?.toLocaleString() || "0", icon: Wallet, color: "#10b981", example: tTutorial("accounts.stats_example.supplierAccounts_totalReceived") },
                { name: t("stats.finalBalance"), description: t("statsDescription.finalBalance"), value: stats?.finalBalance?.toLocaleString() || "0", icon: DollarSign, color: "#f97316", example: tTutorial("accounts.stats_example.supplierAccounts_finalBalance") },
            ];
        }

        if (activeTab === "monthClosing") {
            const current = stats?.currentMonthStats;
            const last = stats?.lastMonthProfit;

            return [
                { name: t("stats.lastMonthProfit") + (last?.month ? ` (${last.month}/${last.year})` : ""), description: t("statsDescription.lastMonthProfit"), value: last?.netProfit?.toLocaleString() || "0", icon: CheckCircle, color: "#10b981", example: tTutorial("accounts.stats_example.monthClosing_lastMonthProfit") },
                { name: t("stats.currentRevenue"), description: t("statsDescription.currentRevenue"), value: current?.revenue?.toLocaleString() || "0", icon: TrendingUp, color: "#8b5cf6", example: tTutorial("accounts.stats_example.monthClosing_currentRevenue") },
                { name: t("stats.productCost"), description: t("statsDescription.productCost"), value: current?.productCost?.toLocaleString() || "0", icon: Package, color: "#f97316", example: tTutorial("accounts.stats_example.monthClosing_productCost") },
                { name: t("stats.operationalExpenses"), description: t("statsDescription.operationalExpenses"), value: current?.operationalExpenses?.toLocaleString() || "0", icon: Settings, color: "#f59e0b", example: tTutorial("accounts.stats_example.monthClosing_operationalExpenses") },
                { name: t("stats.returnsCost"), description: t("statsDescription.returnsCost"), value: current?.returnsCost?.toLocaleString() || "0", icon: RefreshCw, color: "#ef4444", example: tTutorial("accounts.stats_example.monthClosing_returnsCost") },
                { name: t("stats.currentNetProfit"), description: t("statsDescription.currentNetProfit"), value: current?.netProfit?.toLocaleString() || "0", icon: DollarSign, color: "#059669", isFinal: true, example: tTutorial("accounts.stats_example.monthClosing_currentNetProfit") },
            ];
        }

        if (activeTab === "safes") {
            return [
                { name: t("safes.stats.totalBalance"), description: t("statsDescription.totalBalance"), value: stats?.totalBalance?.toLocaleString() || "0", icon: Wallet, color: "#8b5cf6", example: tTutorial("accounts.stats_example.safes_totalBalance") },
                { name: t("safes.stats.totalIn"), description: t("statsDescription.totalIn"), value: stats?.totalIn?.toLocaleString() || "0", icon: ArrowUpRight, color: "#10b981", example: tTutorial("accounts.stats_example.safes_totalIn") },
                { name: t("safes.stats.totalOut"), description: t("statsDescription.totalOut"), value: stats?.totalOut?.toLocaleString() || "0", icon: ArrowDownLeft, color: "#ef4444", example: tTutorial("accounts.stats_example.safes_totalOut") },
                { name: t("safes.stats.accountsCount"), description: t("statsDescription.accountsCount"), value: stats?.accountsCount || "0", icon: Building2, color: "#3b82f6", example: tTutorial("accounts.stats_example.safes_accountsCount") },
            ];
        }

        if (activeTab === "supplierPayments") {
            return [
                { name: t("supplierPayments.stats.totalSuppliers"), description: t("statsDescription.accountsCount"), value: stats?.totalSuppliers || "0", icon: Building2, color: "#3b82f6", example: tTutorial("accounts.stats_example.supplierPayments_totalSuppliers") },
                { name: t("supplierPayments.stats.totalShouldPay"), description: t("statsDescription.finalBalance"), value: stats?.totalShouldPay?.toLocaleString() || "0", icon: ArrowUpRight, color: "#ef4444", example: tTutorial("accounts.stats_example.supplierPayments_totalShouldPay") },
                { name: t("supplierPayments.stats.totalShouldCollect"), description: t("statsDescription.totalShouldCollect"), value: stats?.totalShouldCollect?.toLocaleString() || "0", icon: ArrowDownLeft, color: "#10b981", example: tTutorial("accounts.stats_example.supplierPayments_totalShouldCollect") },
            ];
        }

        switch (activeTab) {
            default:
                return [];
        }
    }, [activeTab, stats, t, categories, tTutorial]);

    useEffect(() => {
        setFilters({
            startDate: null,
            endDate: null,
        });
    }, [activeTab])
    return (
        <div className="min-h-screen p-4 md:p-5 space-y-5">
            <PageHeader
                breadcrumbs={[
                    { name: t("breadcrumb.home"), href: "/dashboard" },
                    { name: t("breadcrumb.accounts") },
                ]}
                buttons={
                    <Button_
                        size="sm"
                        label={t("title")}
                        variant="ghost"
                        icon={<Info size={18} />}
                    />
                }
                statsLoading={loadingStats}
                stats={statsData}
                items={ACCOUNTS_TABS}
                active={activeTab}
                setActive={handleTabChange}
            />


            <div className="mt-6">

                {currentTab === "overview" && (
                    <OverviewTab
                        stats={stats}
                        loadingStats={loadingStats}
                        mainFilters={filters}
                        onFiltersChange={setFilters}
                        onRefresh={refreshStats}
                    />
                )}

                {currentTab === "monthlyExpenses" && (
                    <MonthlyExpensesTab />
                )}

                {currentTab === "manualExpenses" && (
                    <ManualExpensesTab
                        categories={categories}
                        refreshCategories={fetchCategories}
                    />
                )}

                {currentTab === "supplierAccounts" && (
                    <SupplierAccountsTab onRefresh={refreshStats} />
                )}

                {currentTab === "supplierPayments" && (
                    <SupplierPaymentsTab onRefresh={refreshStats} />
                )}

                {currentTab === "monthClosing" && (
                    <MonthClosingTab onRefresh={refreshStats} />
                )}

                {currentTab === "safes" && (
                    <SafesTab onRefresh={refreshStats} />
                )}

            </div>

            <CategoryFormModal
                open={categoryModalOpen}
                onOpenChange={setCategoryModalOpen}
                editingCategory={editingCategory}
                onSave={() => {
                    fetchCategories();
                }}
            />

            <DeleteCategoryAlert
                open={categoryDeleteAlertOpen}
                onOpenChange={setCategoryDeleteAlertOpen}
                categoryName={editingCategory?.name}
                onConfirm={async () => {
                    try {
                        await api.delete(`/expense-categories/${editingCategory.id}`);
                        toast.success(t("manualExpenses.messages.categoryDeleted") || "Category deleted successfully");
                        fetchCategories();
                    } catch (err) {
                        console.error("Error deleting category:", err);
                        toast.error(err?.response?.data?.message || t("manualExpenses.messages.categoryDeleteError") || "Error deleting category");
                        throw err;
                    }
                }}
            />
        </div>
    );
}
