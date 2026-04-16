"use client";

import React, { useMemo, useState } from "react";
import { useTranslations } from "next-intl";
import {
  Package,
  Truck,
  RefreshCw,
  DollarSign,
  Search,
  Calendar,
  Building2,
  FileText,
  Eye,
  ArrowUpRight,
  ArrowDownLeft,
  Download,
  Loader2
} from "lucide-react";
import { cn } from "@/utils/cn";
import Table, { FilterField } from "@/components/atoms/Table";
import DateRangePicker from "@/components/atoms/DateRangePicker";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from "@/components/ui/select";

export default function MonthlyExpensesTab() {
  const tOrders = useTranslations("orders");
  const t = useTranslations("accounts");

  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState("");
  const [selectedExpense, setSelectedExpense] = useState(null);

  // Default dates: this month
  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const endOfMonth = new Date();

  const [filters, setFilters] = useState({
    startDate: startOfMonth,
    endDate: endOfMonth,
    source: "all",
  });

  // Mock data based on provided examples
  const expensesData = [
    {
      id: 1,
      date: "2025-11-30",
      type: "purchase",
      source: "المورد 8",
      reference: "PUR-2025-001",
      amount: 5000,
      status: "completed",
      details: {
        products: [
          { name: "Product A", qty: 100, price: 30 },
          { name: "Product B", qty: 50, price: 40 },
        ],
        supplier: "المورد 8"
      }
    },
    {
      id: 2,
      date: "2025-11-29",
      type: "shipping",
      source: "Aramex",
      reference: "SHIP-99210",
      amount: 1200,
      status: "completed",
      details: {
        orders: [
          { id: "#10234", cost: 40 },
          { id: "#10235", cost: 45 },
        ],
        company: "Aramex"
      }
    },
    {
      id: 3,
      date: "2025-11-28",
      type: "return",
      source: "المورد 2",
      reference: "RET-102",
      amount: -800,
      status: "completed",
      details: {
        products: [{ name: "Product C", qty: 2, price: 400 }],
        reason: "Damaged Items",
        supplier: "المورد 2"
      }
    },
    {
      id: 4,
      date: "2025-11-27",
      type: "manual",
      source: "Admin",
      reference: "MAN-55",
      amount: 300,
      status: "completed",
      details: {
        description: "Office Supplies"
      }
    }
  ];

  const columns = useMemo(() => [
    {
      key: "date",
      header: t("monthlyExpenses.columns.date"),
      cell: (row) => <span className="text-xs font-medium">{row.date}</span>
    },
    {
      key: "type",
      header: t("monthlyExpenses.columns.type"),
      cell: (row) => {
        const typeConfig = {
          purchase: { icon: Package, color: "text-purple-500 bg-purple-50", label: t("monthlyExpenses.types.purchase") },
          shipping: { icon: Truck, color: "text-blue-500 bg-blue-50", label: t("monthlyExpenses.types.shipping") },
          return: { icon: RefreshCw, color: "text-red-500 bg-red-50", label: t("monthlyExpenses.types.return") },
          manual: { icon: DollarSign, color: "text-orange-500 bg-orange-50", label: t("monthlyExpenses.types.manual") },
        };
        const config = typeConfig[row.type];
        return (
          <div className="flex items-center gap-2">
            <div className={cn("w-7 h-7 rounded-lg flex items-center justify-center", config.color)}>
              <config.icon size={14} />
            </div>
            <span className="text-xs font-bold">{config.label}</span>
          </div>
        );
      }
    },
    {
      key: "source",
      header: t("monthlyExpenses.columns.source"),
      cell: (row) => <span className="text-xs font-semibold">{row.source}</span>
    },
    {
      key: "reference",
      header: t("monthlyExpenses.columns.reference"),
      cell: (row) => (
        <div className="flex items-center gap-1.5">
          <FileText size={12} className="text-muted-foreground" />
          <span className="text-xs font-mono text-muted-foreground">{row.reference}</span>
        </div>
      )
    },
    {
      key: "amount",
      header: t("monthlyExpenses.columns.amount"),
      cell: (row) => (
        <div className="flex items-center gap-1">
          {row.amount > 0 ? <ArrowUpRight size={12} className="text-emerald-500" /> : <ArrowDownLeft size={12} className="text-red-500" />}
          <span className={cn(
            "text-sm font-black tabular-nums",
            row.amount > 0 ? "text-emerald-600" : "text-red-600"
          )}>
            {Math.abs(row.amount).toLocaleString()}
          </span>
        </div>
      )
    },
    {
      key: "actions",
      header: "",
      cell: (row) => (
        <button
          onClick={() => setSelectedExpense(row)}
          className="p-2 hover:bg-muted rounded-lg transition-colors text-muted-foreground hover:text-primary"
        >
          <Eye size={16} />
        </button>
      )
    }
  ], [t]);

  let exportLoading = false
  return (
    <div className="space-y-5">
      <Table
        searchValue={search}
        onSearchChange={setSearch}
        labels={{
          searchPlaceholder: tOrders("toolbar.searchPlaceholder"),
          apply: t("filters.apply"),
          total: tOrders("pagination.total"),
          limit: tOrders("pagination.limit"),
          emptyTitle: tOrders("empty"),
          emptySubtitle: tOrders("emptySubtitle"),
        }}
        filters={
          <>
            {/* Date Range */}
            <FilterField label={t("filters.dateRange")} icon={Calendar}>
              <DateRangePicker
                value={{ startDate: filters.startDate, endDate: filters.endDate }}
                onChange={(newDates) => setFilters(f => ({ ...f, ...newDates }))}
              />
            </FilterField>

            {/* Source */}
            <FilterField label={t("monthlyExpenses.filters.source")} icon={Building2}>
              <Select
                value={filters.source}
                onValueChange={(v) => setFilters((f) => ({ ...f, source: v }))}
              >
                <SelectTrigger className="theme-field">
                  <SelectValue placeholder={t("monthlyExpenses.filters.allSources")} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">{t("monthlyExpenses.filters.allSources")}</SelectItem>
                  <SelectItem value="supplier">الموردين</SelectItem>
                  <SelectItem value="shipping">شركات الشحن</SelectItem>
                  <SelectItem value="admin">Admin</SelectItem>
                </SelectContent>
              </Select>
            </FilterField>

          </>
        }
        actions={[
          {
            key: "export",
            label: t("export"),
            icon: exportLoading ? (
              <Loader2 size={14} className="animate-spin" />
            ) : (
              <Download size={14} />
            ),
            color: "primary",
            // onClick: handleExport,
            // disabled: exportLoading,
            permission: "orders.read",
          },

        ]}
        columns={columns}
        data={expensesData}
        isLoading={loading}
        pagination={{
          total_records: expensesData.length,
          current_page: 1,
          per_page: 12,
        }}
      />

      {/* Details Modal */}
      <Dialog open={!!selectedExpense} onOpenChange={() => setSelectedExpense(null)}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Eye className="text-primary" size={20} />
              {t("monthlyExpenses.details.title")}
            </DialogTitle>
          </DialogHeader>

          {selectedExpense && (
            <div className="space-y-6 py-4">
              {/* Common Header */}
              <div className="flex items-center justify-between p-4 bg-muted/30 rounded-xl border border-border">
                <div className="flex flex-col">
                  <span className="text-[10px] font-black uppercase tracking-wider text-muted-foreground">{t("monthlyExpenses.columns.reference")}</span>
                  <span className="font-bold">{selectedExpense.reference}</span>
                </div>
                <div className="flex flex-col items-end">
                  <span className="text-[10px] font-black uppercase tracking-wider text-muted-foreground">{t("monthlyExpenses.columns.amount")}</span>
                  <span className={cn("text-lg font-black", selectedExpense.amount > 0 ? "text-emerald-600" : "text-red-600")}>
                    {Math.abs(selectedExpense.amount).toLocaleString()}
                  </span>
                </div>
              </div>

              {/* Type Specific Details */}
              <div className="space-y-4">
                {selectedExpense.type === 'purchase' && (
                  <>
                    <DetailRow label={t("monthlyExpenses.details.supplier")} value={selectedExpense.details.supplier} icon={Building2} />
                    <div className="space-y-2">
                      <span className="text-xs font-bold flex items-center gap-2">
                        <Package size={14} className="text-primary" />
                        {t("monthlyExpenses.details.products")}
                      </span>
                      <div className="rounded-lg border border-border overflow-hidden">
                        <table className="w-full text-xs">
                          <thead className="bg-muted/50 border-b border-border">
                            <tr>
                              <th className="px-3 py-2 text-left font-bold">{t("monthlyExpenses.details.products")}</th>
                              <th className="px-3 py-2 text-center font-bold">{t("monthlyExpenses.details.quantity")}</th>
                              <th className="px-3 py-2 text-right font-bold">{t("monthlyExpenses.details.unitPrice")}</th>
                            </tr>
                          </thead>
                          <tbody>
                            {selectedExpense.details.products.map((p, i) => (
                              <tr key={i} className="border-b border-border last:border-0">
                                <td className="px-3 py-2">{p.name}</td>
                                <td className="px-3 py-2 text-center font-mono">{p.qty}</td>
                                <td className="px-3 py-2 text-right font-mono">{p.price}ج</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  </>
                )}

                {selectedExpense.type === 'shipping' && (
                  <>
                    <DetailRow label={t("monthlyExpenses.details.shippingCompany")} value={selectedExpense.details.company} icon={Truck} />
                    <div className="space-y-2">
                      <span className="text-xs font-bold flex items-center gap-2">
                        <FileText size={14} className="text-primary" />
                        {t("monthlyExpenses.details.ordersList")}
                      </span>
                      <div className="grid grid-cols-2 gap-2">
                        {selectedExpense.details.orders.map((o, i) => (
                          <div key={i} className="flex items-center justify-between p-2 rounded-lg border border-border bg-muted/10">
                            <span className="font-mono text-[11px]">{o.id}</span>
                            <span className="font-bold text-[11px] text-primary">{o.cost}ج</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </>
                )}

                {selectedExpense.type === 'return' && (
                  <>
                    <DetailRow label={t("monthlyExpenses.details.supplier")} value={selectedExpense.details.supplier} icon={Building2} />
                    <DetailRow label={t("monthlyExpenses.details.returnReason")} value={selectedExpense.details.reason} icon={RefreshCw} />
                    <div className="space-y-2">
                      <span className="text-xs font-bold">{t("monthlyExpenses.details.products")}</span>
                      {selectedExpense.details.products.map((p, i) => (
                        <div key={i} className="flex items-center justify-between p-3 rounded-lg border border-border">
                          <span className="font-medium">{p.name}</span>
                          <span className="font-mono text-red-600">-{p.qty}</span>
                        </div>
                      ))}
                    </div>
                  </>
                )}

                {selectedExpense.type === 'manual' && (
                  <div className="p-4 rounded-xl bg-orange-50/50 border border-orange-100 text-orange-900">
                    <span className="text-[10px] font-black uppercase tracking-widest block mb-1 opacity-60">Description</span>
                    <p className="text-sm font-medium">{selectedExpense.details.description}</p>
                  </div>
                )}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

function DetailRow({ label, value, icon: Icon }) {
  return (
    <div className="flex items-center justify-between py-3 border-b border-border last:border-0">
      <span className="text-xs text-muted-foreground flex items-center gap-2">
        <Icon size={14} className="text-muted-foreground/60" />
        {label}
      </span>
      <span className="text-xs font-bold">{value}</span>
    </div>
  );
}
