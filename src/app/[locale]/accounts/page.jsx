"use client";

import React, { useMemo, useState, useEffect } from "react";
import { useTranslations } from "next-intl";
import { useSearchParams, useRouter } from "next/navigation";
import PageHeader from "@/components/atoms/Pageheader";
import { Info, BarChart2, DollarSign, Wallet, CheckCircle, Plus, Building2, TrendingUp, Calendar } from "lucide-react";
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
import { FilterField } from "@/components/atoms/Table";
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

    // Default dates: this month
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const endOfMonth = new Date();

    const [filters, setFilters] = useState({
        startDate: startOfMonth,
        endDate: endOfMonth,
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
        // Define the async function
        const fetchStats = async () => {
            if (activeTab === "overview" || activeTab === "monthlyExpenses") {
                setLoadingStats(true);
                try {
                    const res = await api.get("/accounting/stats", { params: filters });
                    setStats(res.data);
                } catch (err) {
                    console.error("Error fetching stats:", err);
                } finally {
                    setLoadingStats(false);
                }
            }
        };

        // Execute the function
        fetchStats();
    }, [activeTab, filters]);

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
                { name: t("cityDeliveries.stats.topCity"), value: "القاهرة (245)", icon: CheckCircle, color: "#10b981" },
                { name: t("cityDeliveries.stats.lowestCity"), value: "المنيا (12)", icon: Info, color: "#ef4444" },
                { name: t("cityDeliveries.stats.avgDeliveries"), value: "85%", icon: BarChart2, color: "#3b82f6" },
            ];
        }

        if (activeTab === "supplierAccounts") {
            return [
                { name: t("stats.totalSuppliers"), value: "15", icon: Building2, color: "#3b82f6" },
                { name: t("stats.totalOwed"), value: "45,800", icon: DollarSign, color: "#ef4444" },
                { name: t("stats.totalCredit"), value: "12,400", icon: Wallet, color: "#10b981" },
            ];
        }

        if (activeTab === "monthClosing") {
            return [
                { name: t("stats.lastSettlement"), value: "15,000", icon: CheckCircle, color: "#10b981" },
                { name: t("stats.totalHistorySales"), value: "117,000", icon: BarChart2, color: "#8b5cf6" },
                { name: t("stats.totalHistoryCosts"), value: "83,000", icon: DollarSign, color: "#f97316" },
                { name: t("stats.totalNetProfit"), value: "34,000", icon: TrendingUp, color: "#10b981" },
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
                return <OverviewTab stats={stats} loadingStats={loadingStats} mainFilters={filters} onFiltersChange={setFilters} />;
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
                return <SupplierAccountsTab />;
            case "monthClosing":
                return <MonthClosingTab />;
            default:
                return <OverviewTab />;
        }
    };

    return (
        <div className="min-h-screen p-4 md:p-5 space-y-5">
            <PageHeader
                breadcrumbs={[
                    { name: t("breadcrumb.home"), href: "/" },
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
