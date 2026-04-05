"use client";

import React, { useMemo, useState } from "react";
import { useTranslations } from "next-intl";
import { useSearchParams, useRouter } from "next/navigation";
import PageHeader from "@/components/atoms/Pageheader";
import { Info, BarChart2, DollarSign, Wallet, CheckCircle, Plus, Building2, TrendingUp } from "lucide-react";
import Button_ from "@/components/atoms/Button";

// Import tabs
import OverviewTab from "./tabs/OverviewTab";
import MonthlyExpensesTab from "./tabs/MonthlyExpensesTab";
import ManualExpensesTab, { ManualExpenseFormModal, DeleteManualExpenseAlert, CATEGORY_CONFIG, CategoryFormModal } from "./tabs/ManualExpensesTab";
import CityDeliveriesTab from "./tabs/CityDeliveriesTab";
import SupplierAccountsTab from "./tabs/SupplierAccountsTab";
import MonthClosingTab from "./tabs/MonthClosingTab";

export default function Accounts() {
    const t = useTranslations("accounts");
    const searchParams = useSearchParams();
    const router = useRouter();

    // Modals State
    const [addEditModalOpen, setAddEditModalOpen] = useState(false);
    const [deleteAlertOpen, setDeleteAlertOpen] = useState(false);
    const [editingExpense, setEditingExpense] = useState(null);

    // Get current tab from search params or default to 'overview'
    const activeTab = searchParams.get("tab") || "overview";

    // States الخاصة بالتصنيفات
    const [categoryModalOpen, setCategoryModalOpen] = useState(false);
    const [editingCategory, setEditingCategory] = useState(null);

    const handleTabChange = (tabId) => {
        const params = new URLSearchParams(searchParams);
        params.set("tab", tabId);
        router.push(`?${params.toString()}`);
    };

    // Handlers
    const handleAddManualExpense = () => {
        setEditingExpense(null);
        setAddEditModalOpen(true);
    };

    const handleEditManualExpense = (expense) => {
        setEditingExpense(expense);
        setAddEditModalOpen(true);
    };

    const handleDeleteManualExpense = (expense) => {
        setEditingExpense(expense);
        setDeleteAlertOpen(true);
    };

    const handleAddCategory = () => {
        setEditingCategory(null);
        setCategoryModalOpen(true);
    };

    const handleEditCategory = (cat) => {
        setEditingCategory(cat);
        setCategoryModalOpen(true);
    };

    const ACCOUNTS_TABS = useMemo(() => [
        { id: "overview", label: t("tabs.overview") },
        { id: "monthlyExpenses", label: t("tabs.monthlyExpenses") },
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
                { name: t("stats.totalExpenses"), value: "198,880", icon: DollarSign, color: "#f97316" },
                { name: t("stats.productPurchases"), value: "128,900", icon: BarChart2, color: "#8b5cf6" },
                { name: t("stats.shippingCost"), value: "45,300", icon: Wallet, color: "#3b82f6" },
                { name: t("stats.manualExpenses"), value: "24,680", icon: BarChart2, color: "#a855f7" },
                { name: t("stats.returns"), value: "18,250", icon: BarChart2, color: "#ef4444" },
                { name: t("stats.netResult"), value: "132,450", icon: BarChart2, color: "#10b981" },
            ];
        }

        if (activeTab === "manualExpenses") {
            const categories = [
                { id: "ads", name: t("manualExpenses.categories.ads"), description: "وصف الإعلانات", value: "8,450", ...CATEGORY_CONFIG.ads },
                { id: "packaging", name: t("manualExpenses.categories.packaging"), description: "وصف التغليف", value: "3,200", ...CATEGORY_CONFIG.packaging },
                { id: "transport", name: t("manualExpenses.categories.transport"), description: "وصف النقل", value: "5,500", ...CATEGORY_CONFIG.transport },
                { id: "office", name: t("manualExpenses.categories.office"), description: "وصف المكتب", value: "2,100", ...CATEGORY_CONFIG.office },
                { id: "salaries", name: t("manualExpenses.categories.salaries"), description: "وصف الرواتب", value: "15,000", ...CATEGORY_CONFIG.salaries },
            ];

            return [
                ...categories.map(cat => ({
                    id: cat.id,
                    name: cat.name,
                    value: cat.value,
                    icon: cat.icon,
                    color: cat.iconColor,
                    editable: true,
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
    }, [activeTab, t]);

    const renderTabContent = () => {
        switch (activeTab) {
            case "overview":
                return <OverviewTab />;
            case "monthlyExpenses":
                return <MonthlyExpensesTab />;
            case "manualExpenses":
                return (
                    <ManualExpensesTab
                        onAdd={handleAddManualExpense}
                        onEdit={handleEditManualExpense}
                        onDelete={handleDeleteManualExpense}
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
                stats={statsData}
                items={ACCOUNTS_TABS}
                active={activeTab}
                setActive={handleTabChange}
            />

            <div className="mt-6">
                {renderTabContent()}
            </div>

            {/* Modals for Manual Expenses */}
            <ManualExpenseFormModal
                open={addEditModalOpen}
                onOpenChange={setAddEditModalOpen}
                editingExpense={editingExpense}
                onSave={(data) => {
                    console.log("Saving expense:", data);
                    // Add logic to update state/backend here
                }}
            />

            <DeleteManualExpenseAlert
                open={deleteAlertOpen}
                onOpenChange={setDeleteAlertOpen}
                onConfirm={() => {
                    console.log("Deleting expense:", editingExpense);
                    // Add logic to delete from state/backend here
                    setDeleteAlertOpen(false);
                }}
            />

            <CategoryFormModal
                open={categoryModalOpen}
                onOpenChange={setCategoryModalOpen}
                editingCategory={editingCategory}
                onSave={(data) => {
                    console.log("Saving Category:", data);
                    // قم بإضافة كود حفظ التصنيف هنا
                }}
            />
        </div>
    );
}
