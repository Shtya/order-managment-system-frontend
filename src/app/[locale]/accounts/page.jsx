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
import CityDeliveriesTab from "./tabs/CityDeliveriesTab";
import SupplierAccountsTab from "./tabs/SupplierAccountsTab";
import MonthClosingTab from "./tabs/MonthClosingTab";
import SafesTab from "./tabs/SafesTab";
import toast from "react-hot-toast";

export default function Accounts() {
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
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const endOfMonth = new Date();

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
            if (["overview", "monthlyExpenses", "cityDeliveries", "supplierAccounts", "monthClosing", "safes"].includes(activeTab)) {
                setLoadingStats(true);
                try {
                    let endpoint = "/accounting/stats";
                    let params = { ...filters };

                    if (activeTab === "cityDeliveries") {
                        endpoint = "/accounting/shipments-summary";
                        params = {};
                    } else if (activeTab === "supplierAccounts") {
                        endpoint = "/accounting/supplier-closings/financial-stats";
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
        { id: "overview", label: t("tabs.overview") },
        // { id: "monthlyExpenses", label: t("tabs.monthlyExpenses") },
        { id: "manualExpenses", label: t("tabs.manualExpenses") },
        { id: "cityDeliveries", label: t("tabs.cityDeliveries") },
        // { id: "employeePerformance", label: t("tabs.employeePerformance") },
        { id: "supplierAccounts", label: t("tabs.supplierAccounts") },
        { id: "monthClosing", label: t("tabs.monthClosing") },
        { id: "safes", label: t("tabs.safes") },
    ], [t]);

    // Mock stats based on active tab
    const statsData = useMemo(() => {
        if (activeTab === "overview" || activeTab === "monthlyExpenses") {
            return [
                { name: t("stats.productPurchases"), value: stats?.productCost?.toLocaleString() || "0", icon: BarChart2, color: "#8b5cf6" },
                { name: t("stats.manualExpenses"), value: stats?.manualExpenses?.toLocaleString() || "0", icon: BarChart2, color: "#a855f7" },
                { name: t("stats.totalExpenses"), value: stats ? (Number(stats?.manualExpenses) + Number(stats?.productCost)).toLocaleString() || "0" : "0", icon: DollarSign, color: "#f97316" },
                { name: t("stats.returns"), value: stats?.returnsCost?.toLocaleString() || "0", icon: BarChart2, color: "#ef4444" },
            ];
        }

        if (activeTab === "manualExpenses") {
            return [
                ...categories.map(cat => ({
                    id: cat.id,
                    name: cat.name,
                    value: cat.expensesCount || 0, // Could fetch summary if needed
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

        if (activeTab === "cityDeliveries") {
            return [
                { name: t("cityDeliveries.stats.topCity"), value: stats?.highestCity?.city && stats?.highestCity?.count !== undefined ? `${stats.highestCity.city} (${stats.highestCity.count})` : "N/A", icon: CheckCircle, color: "#10b981" },
                { name: t("cityDeliveries.stats.lowestCity"), value: stats?.lowestCity?.city && stats?.lowestCity?.count !== undefined ? `${stats.lowestCity.city} (${stats.lowestCity.count})` : "N/A", icon: Info, color: "#ef4444" },
                { name: t("cityDeliveries.stats.avgDeliveries"), value: stats?.deliveriesRate !== undefined ? `${stats.deliveriesRate}%` : "0%", icon: BarChart2, color: "#3b82f6" },
            ];
        }

        if (activeTab === "supplierAccounts") {
            return [
                { name: t("stats.productPurchases"), value: stats?.totalPurchases?.toLocaleString() || "0", icon: Building2, color: "#3b82f6" },
                { name: t("stats.totalPaid"), value: stats?.totalPaid?.toLocaleString() || "0", icon: Wallet, color: "#10b981" },
                { name: t("stats.totalReceived"), value: stats?.totalTaken?.toLocaleString() || "0", icon: Wallet, color: "#10b981" },
                { name: t("stats.returns"), value: stats?.totalReturns?.toLocaleString() || "0", icon: BarChart2, color: "#ef4444" },
                { name: t("stats.finalBalance"), value: stats?.finalBalance?.toLocaleString() || "0", icon: DollarSign, color: "#f97316" },
            ];
        }

        if (activeTab === "monthClosing") {
            const current = stats?.currentMonthStats;
            const last = stats?.lastMonthProfit;

            return [
                { name: t("stats.lastMonthProfit") + (last?.month ? ` (${last.month}/${last.year})` : ""), value: last?.netProfit?.toLocaleString() || "0", icon: CheckCircle, color: "#10b981" },
                { name: t("stats.currentRevenue"), value: current?.revenue?.toLocaleString() || "0", icon: TrendingUp, color: "#8b5cf6" },
                { name: t("stats.productCost"), value: current?.productCost?.toLocaleString() || "0", icon: Package, color: "#f97316" },
                { name: t("stats.operationalExpenses"), value: current?.operationalExpenses?.toLocaleString() || "0", icon: Settings, color: "#f59e0b" },
                { name: t("stats.returnsCost"), value: current?.returnsCost?.toLocaleString() || "0", icon: RefreshCw, color: "#ef4444" },
                { name: t("stats.currentNetProfit"), value: current?.netProfit?.toLocaleString() || "0", icon: DollarSign, color: "#059669", isFinal: true },
            ];
        }

        if (activeTab === "safes") {
            return [
                { name: t("safes.stats.totalBalance"), value: stats?.totalBalance?.toLocaleString() || "0", icon: Wallet, color: "#8b5cf6" },
                { name: t("safes.stats.totalIn"), value: stats?.totalIn?.toLocaleString() || "0", icon: ArrowUpRight, color: "#10b981" },
                { name: t("safes.stats.totalOut"), value: stats?.totalOut?.toLocaleString() || "0", icon: ArrowDownLeft, color: "#ef4444" },
                { name: t("safes.stats.accountsCount"), value: stats?.accountsCount || "0", icon: Building2, color: "#3b82f6" },
            ];
        }

        switch (activeTab) {
            default:
                return [];
        }
    }, [activeTab, stats, t, categories]);


    const renderTabContent = () => {
        switch (activeTab) {
            case "overview":
                return <OverviewTab stats={stats} loadingStats={loadingStats} mainFilters={filters} onFiltersChange={setFilters} onRefresh={refreshStats} />;
            case "monthlyExpenses":
                return <MonthlyExpensesTab />;
            case "manualExpenses":
                return (
                    <ManualExpensesTab
                        categories={categories}
                        refreshCategories={fetchCategories}
                    />
                );
            case "cityDeliveries":
                return <CityDeliveriesTab />;
            // case "employeePerformance":
            //     return <EmployeePerformanceTab />;
            case "supplierAccounts":
                return <SupplierAccountsTab onRefresh={refreshStats} />;
            case "monthClosing":
                return <MonthClosingTab onRefresh={refreshStats} />;
            case "safes":
                return <SafesTab onRefresh={refreshStats} />;
            default:
                return <OverviewTab onRefresh={refreshStats} />;
        }
    };

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
                {renderTabContent()}
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
