/* 
   i need form you take form this page the 
*/

"use client";

import React, { useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Ban, FileDown, Info, Package, Store, Truck } from "lucide-react";
import { useTranslations } from "next-intl";

import { cn } from "@/utils/cn";
import Table, { FilterField } from "@/components/atoms/Table";
import PageHeader from "@/components/atoms/Pageheader";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

import Button_ from "@/components/atoms/Button";
import { CARRIERS, STATUS, getOrderItemCount } from "./data";
import DateRangePicker from "@/components/atoms/DateRangePicker";

const CARRIER_STYLES = {
  ARAMEX: "bg-red-50 text-red-700 border-red-200",
  SMSA: "bg-blue-50 text-blue-700 border-blue-200",
  DHL: "bg-yellow-50 text-yellow-700 border-yellow-200",
  BOSTA: "bg-orange-50 text-orange-700 border-orange-200",
};

function CarrierBadge({ carrier }) {
  return (
    <span className={cn("inline-flex items-center gap-1 rounded-full border px-2.5 py-1 text-[11px] font-black", CARRIER_STYLES[carrier] || "bg-muted text-foreground border-border")}>
      <Truck size={12} />
      {carrier}
    </span>
  );
}

function OrderDetailsDialog({ order, open, onClose, t }) {
  if (!order) return null;

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-h-[90vh] max-w-3xl overflow-y-auto rounded-3xl  p-0" dir="rtl">
        <DialogHeader className="border-b border-border px-6 py-5">
          <DialogTitle className="flex items-center gap-2 text-lg font-black text-foreground">
            <Package size={20} className="text-primary" />
            {t("details.title", { code: order.code })}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-5 px-6 py-6">
          <div className="grid gap-3 md:grid-cols-2">
            {[
              [t("fields.customer"), order.customer],
              [t("fields.phone"), order.phone],
              [t("fields.city"), order.city],
              [t("fields.region"), order.area],
              [t("fields.store"), order.store],
              [t("fields.carrier"), order.carrier || t("common.notSpecified")],
              [t("fields.trackingCode"), order.trackingCode || t("common.none")],
              [t("fields.total"), `${order.total} ${t("common.currency")}`],
            ].map(([label, value]) => (
              <div key={label} className="rounded-2xl border border-border bg-muted/30 p-4">
                <p className="mb-1 text-xs font-bold text-muted-foreground">{label}</p>
                <p className="text-sm font-black text-foreground">{value || t("common.none")}</p>
              </div>
            ))}
          </div>

          <div className="rounded-3xl border border-border bg-background">
            <div className="border-b border-border px-4 py-3">
              <h4 className="text-sm font-black text-foreground">{t("details.products")}</h4>
            </div>
            <div className="divide-y divide-border">
              {(order.products || []).map((product) => (
                <div key={`${order.code}-${product.sku}`} className="flex items-center justify-between gap-3 px-4 py-3">
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-bold text-foreground">{product.name}</p>
                    <p className="mt-1 text-xs text-muted-foreground">{product.shelf || t("common.notSpecified")}</p>
                  </div>
                  <code className="rounded-xl bg-muted px-2 py-1 text-[11px] font-black text-muted-foreground">{product.sku}</code>
                  <span className="rounded-full bg-primary/10 px-3 py-1 text-xs font-black text-primary">×{product.requestedQty}</span>
                </div>
              ))}
            </div>
          </div>

          {order.notes ? (
            <div className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-700">
              <p className="mb-1 font-black">{t("details.notes")}</p>
              <p>{order.notes}</p>
            </div>
          ) : null}

          <div className="flex justify-end">
            <Button variant="outline" onClick={onClose}>{t("common.close")}</Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function AssignCarrierDialog({ open, onClose, orders, selectedOrderCodes, updateOrder, pushOp, t }) {
  const [carrier, setCarrier] = useState("");
  const [selectedCodes, setSelectedCodes] = useState([]);

  React.useEffect(() => {
    if (!open) return;
    setCarrier("");
    setSelectedCodes(selectedOrderCodes);
  }, [open, selectedOrderCodes]);

  const selectedOrders = orders.filter((order) => selectedCodes.includes(order.code));

  const toggleCode = (orderCode) => {
    setSelectedCodes((current) =>
      current.includes(orderCode) ? current.filter((code) => code !== orderCode) : [...current, orderCode]
    );
  };

  const handleConfirm = () => {
    if (!carrier || selectedCodes.length === 0) return;

    const now = new Date().toISOString().slice(0, 16).replace("T", " ");
    selectedCodes.forEach((code, index) => {
      updateOrder(code, {
        carrier,
        distributedAt: now,
      });

      pushOp({
        id: `OP-${Date.now()}-${index}`,
        operationType: "ASSIGN_CARRIER",
        orderCode: code,
        carrier,
        employee: "System",
        result: "SUCCESS",
        details: `${t("actions.assign")}: ${carrier}`,
        createdAt: now,
      });
    });

    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-h-[90vh] max-w-2xl overflow-y-auto rounded-3xl  p-0" dir="rtl">
        <DialogHeader className="border-b border-border px-6 py-5">
          <DialogTitle className="flex items-center gap-2 text-lg font-black text-foreground">
            <Truck size={20} className="text-primary" />
            {t("dialogs.assignTitle")}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-5 px-6 py-6">
          <div>
            <Label className="mb-2 block text-sm font-black text-foreground">{t("fields.carrier")}</Label>
            <div className="grid gap-2 sm:grid-cols-4">
              {CARRIERS.map((carrierOption) => (
                <button
                  key={carrierOption}
                  type="button"
                  onClick={() => setCarrier(carrierOption)}
                  className={cn(
                    "rounded-2xl border px-3 py-3 text-sm font-black transition-colors",
                    carrier === carrierOption ? "border-primary bg-primary text-primary-foreground" : "border-border bg-background text-foreground hover:bg-muted"
                  )}
                >
                  {carrierOption}
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-2 rounded-3xl border border-border bg-muted/20 p-3">
            {selectedOrders.map((order) => (
              <button
                key={order.code}
                type="button"
                onClick={() => toggleCode(order.code)}
                className={cn(
                  "flex w-full items-center justify-between rounded-2xl border px-4 py-3 text-start transition-colors",
                  selectedCodes.includes(order.code) ? "border-primary bg-primary/6" : "border-border bg-background"
                )}
              >
                <div>
                  <p className="font-mono text-sm font-black text-foreground">{order.code}</p>
                  <p className="mt-1 text-xs text-muted-foreground">{order.customer} · {order.city}</p>
                </div>
                <Checkbox checked={selectedCodes.includes(order.code)} />
              </button>
            ))}
          </div>

          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={onClose}>{t("common.cancel")}</Button>
            <Button onClick={handleConfirm} disabled={!carrier || selectedCodes.length === 0}>{t("actions.confirmAssign")}</Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function RejectOrderDialog({ open, onClose, orderCode, rejectOrder, t }) {
  const [reason, setReason] = useState("");

  React.useEffect(() => {
    if (open) setReason("");
  }, [open]);

  const handleConfirm = () => {
    if (!orderCode || !reason.trim()) return;
    rejectOrder(orderCode, { reason: reason.trim(), stage: "distribution" });
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-lg rounded-3xl  p-0" dir="rtl">
        <DialogHeader className="border-b border-border px-6 py-5">
          <DialogTitle className="flex items-center gap-2 text-lg font-black text-foreground">
            <Ban size={20} className="text-red-500" />
            {t("dialogs.rejectTitle")}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 px-6 py-6">
          <div className="rounded-2xl border border-border bg-muted/30 p-4">
            <p className="text-xs font-bold text-muted-foreground">{t("fields.orderCode")}</p>
            <p className="mt-1 font-mono text-sm font-black text-foreground">{orderCode}</p>
          </div>

          <div>
            <Label className="mb-2 block text-sm font-black text-foreground">{t("dialogs.rejectReason")}</Label>
            <Textarea
              value={reason}
              onChange={(event) => setReason(event.target.value)}
              rows={4}
              className="rounded-2xl"
              placeholder={t("dialogs.rejectPlaceholder")}
            />
          </div>

          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={onClose}>{t("common.cancel")}</Button>
            <Button variant="destructive" onClick={handleConfirm} disabled={!reason.trim()}>{t("actions.reject")}</Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function ActionButtons({ row, onView, onAssign, onReject, t }) {
  return (
    <TooltipProvider>
      <div className="flex items-center gap-2">
        <Tooltip>
          <TooltipTrigger asChild>
            <button type="button" onClick={() => onView(row)} className="flex h-9 w-9 items-center justify-center rounded-full border border-indigo-200 bg-indigo-50 text-indigo-600 transition-colors hover:bg-indigo-600 hover:text-white">
              <Info size={15} />
            </button>
          </TooltipTrigger>
          <TooltipContent>{t("actions.view")}</TooltipContent>
        </Tooltip>

        <Tooltip>
          <TooltipTrigger asChild>
            <button type="button" onClick={() => onAssign(row)} className="flex h-9 w-9 items-center justify-center rounded-full border border-emerald-200 bg-emerald-50 text-emerald-600 transition-colors hover:bg-emerald-600 hover:text-white">
              <Truck size={15} />
            </button>
          </TooltipTrigger>
          <TooltipContent>{t("actions.assign")}</TooltipContent>
        </Tooltip>

        <Tooltip>
          <TooltipTrigger asChild>
            <button type="button" onClick={() => onReject(row)} className="flex h-9 w-9 items-center justify-center rounded-full border border-red-200 bg-red-50 text-red-600 transition-colors hover:bg-red-600 hover:text-white">
              <Ban size={15} />
            </button>
          </TooltipTrigger>
          <TooltipContent>{t("actions.reject")}</TooltipContent>
        </Tooltip>
      </div>
    </TooltipProvider>
  );
}

function DistributionOrdersTable({ type, orders, updateOrder, pushOp, rejectOrder, t }) {
  const isAssigned = type === "assigned";
  const sourceOrders = useMemo(
    () => orders.filter((order) => order.status === STATUS.CONFIRMED && (isAssigned ? !!order.carrier : !order.carrier)),
    [isAssigned, orders]
  );

  const [search, setSearch] = useState("");
  const [page, setPage] = useState({ current_page: 1, per_page: 12 });
  const [selectedCodes, setSelectedCodes] = useState([]);
  const [assignDialogCodes, setAssignDialogCodes] = useState([]);
  const [detailsOrder, setDetailsOrder] = useState(null);
  const [rejectOrderCode, setRejectOrderCode] = useState("");
  const [filters, setFilters] = useState({
    carrier: "all",
    store: "all",
    paymentType: "all",
    product: "all",
    region: "all",
    date: "",
  });

  const stores = useMemo(() => [...new Set(sourceOrders.map((order) => order.store).filter(Boolean))], [sourceOrders]);
  const products = useMemo(
    () => [...new Set(sourceOrders.flatMap((order) => (order.products || []).map((product) => product.name)).filter(Boolean))],
    [sourceOrders]
  );
  const regions = useMemo(() => [...new Set(sourceOrders.map((order) => order.area).filter(Boolean))], [sourceOrders]);

  const filtered = useMemo(() => {
    const query = search.trim().toLowerCase();

    return sourceOrders.filter((order) => {
      if (
        query &&
        ![
          order.code,
          order.customer,
          order.phone,
          order.city,
          order.area,
          order.store,
          order.carrier,
        ]
          .filter(Boolean)
          .some((value) => String(value).toLowerCase().includes(query))
      ) {
        return false;
      }

      if (filters.carrier !== "all" && order.carrier !== filters.carrier) return false;
      if (filters.store !== "all" && order.store !== filters.store) return false;
      if (filters.paymentType !== "all" && order.paymentType !== filters.paymentType) return false;
      if (filters.product !== "all" && !(order.products || []).some((product) => product.name === filters.product)) return false;
      if (filters.region !== "all" && order.area !== filters.region) return false;
      if (filters.date && order.orderDate !== filters.date) return false;

      return true;
    });
  }, [filters, search, sourceOrders]);

  const hasActiveFilters = Object.entries(filters).some(([key, value]) => (key === "date" ? !!value : value !== "all"));

  const toggleCode = (orderCode) => {
    setSelectedCodes((current) =>
      current.includes(orderCode) ? current.filter((code) => code !== orderCode) : [...current, orderCode]
    );
  };

  const toggleAll = () => {
    setSelectedCodes((current) => (current.length === filtered.length ? [] : filtered.map((order) => order.code)));
  };

  const columns = useMemo(() => {
    const baseColumns = [
      {
        key: "select",
        header: (
          <div className="flex items-center justify-center">
            <Checkbox checked={filtered.length > 0 && selectedCodes.length === filtered.length} onCheckedChange={toggleAll} />
          </div>
        ),
        className: "w-[48px]",
        cell: (row) => (
          <div className="flex items-center justify-center">
            <Checkbox checked={selectedCodes.includes(row.code)} onCheckedChange={() => toggleCode(row.code)} />
          </div>
        ),
      },
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
      {
        key: "phone",
        header: t("fields.phone"),
        cell: (row) => <span className="font-mono text-sm text-muted-foreground">{row.phone}</span>,
      },
      { key: "city", header: t("fields.city") },
      { key: "area", header: t("fields.region") },
      {
        key: "store",
        header: t("fields.store"),
        cell: (row) => (
          <span className="inline-flex items-center gap-2 text-sm text-foreground">
            <Store size={14} className="text-muted-foreground" />
            {row.store}
          </span>
        ),
      },
      {
        key: "productCount",
        header: t("fields.products"),
        cell: (row) => (
          <span className="rounded-full bg-muted px-3 py-1 text-xs font-black text-muted-foreground">
            {getOrderItemCount(row)}
          </span>
        ),
      },
      {
        key: "total",
        header: t("fields.total"),
        cell: (row) => <span className="font-black text-emerald-700">{row.total} {t("common.currency")}</span>,
      },
    ];

    if (isAssigned) {
      baseColumns.splice(6, 0, {
        key: "carrier",
        header: t("fields.carrier"),
        cell: (row) => <CarrierBadge carrier={row.carrier} />,
      });
    }

    baseColumns.push({
      key: "actions",
      header: t("fields.actions"),
      cell: (row) => (
        <ActionButtons
          row={row}
          onView={setDetailsOrder}
          onAssign={(target) => setAssignDialogCodes([target.code])}
          onReject={(target) => setRejectOrderCode(target.code)}
          t={t}
        />
      ),
    });

    return baseColumns;
  }, [filtered.length, isAssigned, selectedCodes, t]);

  return (
    <div className="space-y-4">
      <Table
        searchValue={search}
        onSearchChange={setSearch}
        onSearch={() => { }}
        labels={{
          searchPlaceholder: t(`search.${type}`),
          filter: t("common.filter"),
          apply: t("common.apply"),
          total: t("common.total"),
          limit: t("common.limit"),
          emptyTitle: t(`empty.${type}`),
          emptySubtitle: "",
        }}
        actions={[
          {
            key: "assign-selected",
            label: t("actions.assignSelected", { count: selectedCodes.length }),
            icon: <Truck size={14} />,
            color: "emerald",
            onClick: () => setAssignDialogCodes(selectedCodes),
            disabled: selectedCodes.length === 0,
          },
          {
            key: "export",
            label: t("actions.export"),
            icon: <FileDown size={14} />,
            color: "primary",
            onClick: () => { },
          },
        ]}
        hasActiveFilters={hasActiveFilters}
        onApplyFilters={() => { }}
        filters={
          <>
            {isAssigned ? (
              <FilterField label={t("fields.carrier")}>
                <Select value={filters.carrier} onValueChange={(value) => setFilters((current) => ({ ...current, carrier: value }))}>
                  <SelectTrigger className="h-10 rounded-xl border-border bg-background text-sm">
                    <SelectValue placeholder={t("filters.allCarriers")} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">{t("filters.allCarriers")}</SelectItem>
                    {CARRIERS.map((carrier) => (
                      <SelectItem key={carrier} value={carrier}>{carrier}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </FilterField>
            ) : null}

            <FilterField label={t("fields.store")}>
              <Select value={filters.store} onValueChange={(value) => setFilters((current) => ({ ...current, store: value }))}>
                <SelectTrigger className="h-10 rounded-xl border-border bg-background text-sm">
                  <SelectValue placeholder={t("filters.allStores")} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">{t("filters.allStores")}</SelectItem>
                  {stores.map((store) => (
                    <SelectItem key={store} value={store}>{store}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </FilterField>

            <FilterField label={t("fields.paymentType")}>
              <Select value={filters.paymentType} onValueChange={(value) => setFilters((current) => ({ ...current, paymentType: value }))}>
                <SelectTrigger className="h-10 rounded-xl border-border bg-background text-sm">
                  <SelectValue placeholder={t("filters.allPayments")} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">{t("filters.allPayments")}</SelectItem>
                  <SelectItem value="COD">{t("common.cod")}</SelectItem>
                  <SelectItem value="PAID">{t("common.paid")}</SelectItem>
                </SelectContent>
              </Select>
            </FilterField>

            <FilterField label={t("fields.product")}>
              <Select value={filters.product} onValueChange={(value) => setFilters((current) => ({ ...current, product: value }))}>
                <SelectTrigger className="h-10 rounded-xl border-border bg-background text-sm">
                  <SelectValue placeholder={t("filters.allProducts")} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">{t("filters.allProducts")}</SelectItem>
                  {products.map((product) => (
                    <SelectItem key={product} value={product}>{product}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </FilterField>

            <FilterField label={t("fields.region")}>
              <Select value={filters.region} onValueChange={(value) => setFilters((current) => ({ ...current, region: value }))}>
                <SelectTrigger className="h-10 rounded-xl border-border bg-background text-sm">
                  <SelectValue placeholder={t("filters.allRegions")} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">{t("filters.allRegions")}</SelectItem>
                  {regions.map((region) => (
                    <SelectItem key={region} value={region}>{region}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </FilterField>

            <FilterField label={t("fields.date")}>
              <DateRangePicker
                mode="single"
                value={filters.date}
                onChange={(date) => setFilters((current) => ({ ...current, date }))}
                dataSize="default"
              />
            </FilterField>
          </>
        }
        columns={columns}
        data={filtered}
        isLoading={false}
        pagination={{
          total_records: filtered.length,
          current_page: page.current_page,
          per_page: page.per_page,
        }}
        onPageChange={({ page: nextPage, per_page: perPage }) => setPage({ current_page: nextPage, per_page: perPage })}
      />

      <AssignCarrierDialog
        open={assignDialogCodes.length > 0}
        onClose={() => setAssignDialogCodes([])}
        orders={sourceOrders}
        selectedOrderCodes={assignDialogCodes}
        updateOrder={updateOrder}
        pushOp={pushOp}
        t={t}
      />

      <OrderDetailsDialog order={detailsOrder} open={!!detailsOrder} onClose={() => setDetailsOrder(null)} t={t} />
      <RejectOrderDialog open={!!rejectOrderCode} onClose={() => setRejectOrderCode("")} orderCode={rejectOrderCode} rejectOrder={rejectOrder} t={t} />
    </div>
  );
}

export default function DistributionTab({ orders, updateOrder, pushOp, rejectOrder, subtab, setSubtab }) {
  const t = useTranslations("warehouse.distribution");

  const confirmedOrders = useMemo(() => orders.filter((order) => order.status === STATUS.CONFIRMED), [orders]);
  const unassigned = confirmedOrders.filter((order) => !order.carrier);
  const assigned = confirmedOrders.filter((order) => !!order.carrier);
  const readyToPrint = assigned.filter((order) => !order.labelPrinted);

  const stats = [
    { id: "confirmed", name: t("stats.totalConfirmed"), value: confirmedOrders.length, icon: Package, color: "#2563eb", sortOrder: 0 },
    { id: "unassigned", name: t("stats.unassigned"), value: unassigned.length, icon: Ban, color: "#f59e0b", sortOrder: 1 },
    { id: "assigned", name: t("stats.assigned"), value: assigned.length, icon: Truck, color: "#10b981", sortOrder: 2 },
    { id: "ready", name: t("stats.readyToPrint"), value: readyToPrint.length, icon: FileDown, color: "#8b5cf6", sortOrder: 3 },
  ];

  return (
    <div className="space-y-4">
      <PageHeader
        breadcrumbs={[
          { name: t("breadcrumbs.home"), href: "/" },
          { name: t("breadcrumbs.orders"), href: "/orders" },
          { name: t("breadcrumbs.distribution") },
        ]}
        buttons={<Button_ size="sm" label={t("actions.help")} variant="ghost" onClick={() => { }} icon={<Info size={16} />} />}
        stats={stats}
        items={[
          { id: "unassigned", label: t("tabs.unassigned"), count: unassigned.length, icon: Ban },
          { id: "assigned", label: t("tabs.assigned"), count: assigned.length, icon: Truck },
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
          {subtab === "unassigned" ? (
            <DistributionOrdersTable
              type="unassigned"
              orders={orders}
              updateOrder={updateOrder}
              pushOp={pushOp}
              rejectOrder={rejectOrder}
              t={t}
            />
          ) : null}

          {subtab === "assigned" ? (
            <DistributionOrdersTable
              type="assigned"
              orders={orders}
              updateOrder={updateOrder}
              pushOp={pushOp}
              rejectOrder={rejectOrder}
              t={t}
            />
          ) : null}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
