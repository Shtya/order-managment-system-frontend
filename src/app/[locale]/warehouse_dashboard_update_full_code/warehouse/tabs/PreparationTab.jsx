"use client";

import React, { useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { CheckCircle2, Clock, FileDown, Info, Package, Search, Truck } from "lucide-react";
import { useTranslations } from "next-intl";

import Table, { FilterField } from "@/components/atoms/Table";
import Button_ from "@/components/atoms/Button";
import PageHeader from "@/components/atoms/Pageheader";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { CARRIERS, STATUS, getOrderItemCount } from "./data";
import MultiPrepareView from "../atoms/MultiPrepareView";

function PreparedSubtab({ orders, setDistributionDialog, setSelectedOrdersGlobal, t }) {
  const preparedOrders = useMemo(() => orders.filter((order) => order.status === STATUS.PREPARED), [orders]);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState({ current_page: 1, per_page: 12 });
  const [carrier, setCarrier] = useState("all");

  const filtered = useMemo(() => {
    const query = search.trim().toLowerCase();
    return preparedOrders.filter((order) => {
      if (carrier !== "all" && order.carrier !== carrier) return false;
      if (
        query &&
        ![order.code, order.customer, order.city, order.area, order.carrier]
          .filter(Boolean)
          .some((value) => String(value).toLowerCase().includes(query))
      ) {
        return false;
      }
      return true;
    });
  }, [carrier, preparedOrders, search]);

  const columns = useMemo(
    () => [
      {
        key: "code",
        header: t("fields.orderCode"),
        cell: (row) => <span className="font-mono text-sm font-black text-primary">{row.code}</span>,
      },
      {
        key: "customer",
        header: t("fields.customer"),
        cell: (row) => <span className="font-bold text-foreground">{row.customer}</span>,
      },
      { key: "city", header: t("fields.city") },
      {
        key: "carrier",
        header: t("fields.carrier"),
        cell: (row) => <span className="rounded-full bg-muted px-3 py-1 text-xs font-black text-muted-foreground">{row.carrier || t("common.notSpecified")}</span>,
      },
      {
        key: "items",
        header: t("fields.items"),
        cell: (row) => <span className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-black text-emerald-700">{getOrderItemCount(row)}</span>,
      },
      {
        key: "preparedAt",
        header: t("prepared.preparedAt"),
        cell: (row) => <span className="text-sm text-muted-foreground">{row.preparedAt || t("common.none")}</span>,
      },
      {
        key: "actions",
        header: t("fields.actions"),
        cell: (row) => (
          <button
            type="button"
            onClick={() => {
              setSelectedOrdersGlobal([row.code]);
              setDistributionDialog(true);
            }}
            className="rounded-full border border-emerald-200 bg-emerald-50 px-3 py-2 text-xs font-black text-emerald-700 transition-colors hover:bg-emerald-600 hover:text-white"
          >
            {t("prepared.distribute")}
          </button>
        ),
      },
    ],
    [setDistributionDialog, setSelectedOrdersGlobal, t]
  );

  return (
    <Table
      searchValue={search}
      onSearchChange={setSearch}
      onSearch={() => {}}
      labels={{
        searchPlaceholder: t("prepared.search"),
        filter: t("common.filter"),
        apply: t("common.apply"),
        total: t("common.total"),
        limit: t("common.limit"),
        emptyTitle: t("prepared.emptyTitle"),
        emptySubtitle: "",
      }}
      actions={[
        { key: "export", label: t("actions.export"), icon: <FileDown size={14} />, color: "blue", onClick: () => {} },
      ]}
      hasActiveFilters={carrier !== "all"}
      onApplyFilters={() => {}}
      filters={
        <FilterField label={t("fields.carrier")}>
          <Select value={carrier} onValueChange={setCarrier}>
            <SelectTrigger className="h-10 rounded-xl border-border bg-background text-sm">
              <SelectValue placeholder={t("filters.allCarriers")} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">{t("filters.allCarriers")}</SelectItem>
              {CARRIERS.map((carrierOption) => (
                <SelectItem key={carrierOption} value={carrierOption}>{carrierOption}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </FilterField>
      }
      columns={columns}
      data={filtered}
      isLoading={false}
      pagination={{ total_records: filtered.length, current_page: page.current_page, per_page: page.per_page }}
      onPageChange={({ page: nextPage, per_page: perPage }) => setPage({ current_page: nextPage, per_page: perPage })}
    />
  );
}

export default function PreparationTab({
  orders,
  updateOrder,
  pushOp,
  rejectOrder,
  subtab,
  setSubtab,
  setDistributionDialog,
  setSelectedOrdersGlobal,
}) {
  const t = useTranslations("warehouse.preparation");

  const preparingOrders = useMemo(() => orders.filter((order) => order.status === STATUS.PREPARING), [orders]);
  const preparedOrders = useMemo(() => orders.filter((order) => order.status === STATUS.PREPARED), [orders]);

  const stats = subtab === "prepared"
    ? [
        { id: "prepared", name: t("stats.preparedOrders"), value: preparedOrders.length, icon: CheckCircle2, color: "#10b981", sortOrder: 0 },
        { id: "items", name: t("stats.preparedItemsTable"), value: preparedOrders.reduce((sum, order) => sum + getOrderItemCount(order), 0), icon: Package, color: "#2563eb", sortOrder: 1 },
      ]
    : [];

  return (
    <div className="space-y-4">
      <PageHeader
        breadcrumbs={[
          { name: t("breadcrumbs.home"), href: "/" },
          { name: t("breadcrumbs.warehouse"), href: "/warehouse" },
          { name: t("breadcrumbs.preparation") },
        ]}
        buttons={<Button_ size="sm" label={t("actions.help")} variant="ghost" onClick={() => {}} icon={<Info size={16} />} />}
        stats={stats}
        items={[
          { id: "preparing", label: t("tabs.preparing"), count: preparingOrders.length, icon: Clock },
          { id: "prepared", label: t("tabs.prepared"), count: preparedOrders.length, icon: CheckCircle2 },
        ]}
        active={subtab}
        setActive={setSubtab}
      />

      <AnimatePresence mode="wait">
        <motion.div
          key={subtab}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -8 }}
          transition={{ duration: 0.16 }}
        >
          {subtab === "preparing" ? (
            <MultiPrepareView orders={orders} updateOrder={updateOrder} pushOp={pushOp} rejectOrder={rejectOrder} />
          ) : null}

          {subtab === "prepared" ? (
            <PreparedSubtab
              orders={orders}
              setDistributionDialog={setDistributionDialog}
              setSelectedOrdersGlobal={setSelectedOrdersGlobal}
              t={t}
            />
          ) : null}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
