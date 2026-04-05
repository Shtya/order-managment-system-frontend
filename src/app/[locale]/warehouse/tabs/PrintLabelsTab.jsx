"use client";

import React, { useMemo, useState, useRef, useCallback, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Printer, CheckCircle2, Package, Truck, FileDown, Info, X,
  MapPin, Phone, User, Hash, ShoppingBag, TrendingUp, AlertCircle,
  CreditCard, Store, Clock, BarChart3, Loader2,
} from "lucide-react";
import { useTranslations } from "next-intl";
import { cn } from "@/utils/cn";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import Table, { FilterField } from "@/components/atoms/Table";
import Button_ from "@/components/atoms/Button";
import PageHeader from "../../../../components/atoms/Pageheader";
import ActionButtons from "@/components/atoms/Actions";
import { STATUS, CARRIERS, CARRIER_STYLES, CARRIER_META } from "./data";
import { useDebounce } from "@/hook/useDebounce";
import { useExport } from "@/hook/useExport";
import StoreFilter from "@/components/atoms/StoreFilter";
import ShippingCompanyFilter from "@/components/atoms/ShippingCompanyFilter";
import ProductFilter from "@/components/atoms/ProductFilter";
import api from "@/utils/api";
import { useSocket } from "@/context/SocketContext";
import { toast } from "react-hot-toast";
import { OrderDetailModal } from "./DistributionTab";
import BarcodeCell from "@/components/atoms/BarcodeCell";
import { usePlatformSettings } from "@/context/PlatformSettingsContext";

function CarrierPill({ carrier }) {
  const s = CARRIER_STYLES[carrier?.toUpperCase()] || CARRIER_STYLES.NONE;
  return (
    <span className={cn("inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold border", s.bg, s.border, s.text)}>
      <Truck size={12} />{carrier || "None"}
    </span>
  );
}

// ── Main Print Labels Tab ─────────────────────────────────────────────────────
export default function PrintLabelsTab({ subtab, setSubtab, resetToken }) {
  const t = useTranslations("warehouse.print");
  const [loading, setLoading] = useState(true);
  const [statsData, setStatsData] = useState({
    totalDistributed: 0,
    printed: 0,
    notPrinted: 0
  });

  const fetchStats = useCallback(async () => {
    try {
      setLoading(true);
      const { data } = await api.get('/orders/stats/print-lifecycle-summary');
      setStatsData(data);
    } catch (error) {
      console.error("Failed to fetch print stats", error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchStats();
  }, [fetchStats, resetToken]);

  const stats = [
    { id: "total-distributed", name: t("stats.totalDistributed"), value: statsData.totalDistributed, icon: Truck, color: "#6763af", bgColor: "#6763af15", sortOrder: 0 },
    { id: "not-printed", name: t("stats.notPrinted"), value: statsData.notPrinted, icon: Printer, color: "#ffb703", bgColor: "#ffb70315", sortOrder: 1 },
    { id: "printed", name: t("stats.printed"), value: statsData.printed, icon: CheckCircle2, color: "#10b981", bgColor: "#10b98115", sortOrder: 2 },
  ];

  return (
    <div className="space-y-4">
      <PageHeader
        breadcrumbs={[
          { name: t("breadcrumbs.home"), href: "/" },
          { name: t("breadcrumbs.warehouse"), href: "/warehouse" },
          { name: t("breadcrumbs.printLabels") },
        ]}
        buttons={
          <Button_ size="sm" label={t("howItWorks")} variant="ghost" onClick={() => { }} icon={<Info size={18} />} permission="orders.read" />
        }
        statsLoading={loading}
        stats={stats}
        items={[
          { id: "not_printed", label: t("tabs.notPrinted"), count: statsData.notPrinted, icon: Printer },
          { id: "printed", label: t("tabs.printed"), count: statsData.printed, icon: CheckCircle2 },
        ]}
        active={subtab}
        setActive={setSubtab}
      />

      <AnimatePresence mode="wait">
        <motion.div key={subtab} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} transition={{ duration: 0.15 }}>
          {subtab === "not_printed" && (
            <NotPrintedSubtab onPrinted={() => setSubtab("printed")} resetToken={resetToken} fetchStats={fetchStats} />
          )}
          {subtab === "printed" && (
            <PrintedSubtab resetToken={resetToken} fetchStats={fetchStats} />
          )}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}


// ── Print Preview Modal — Enhanced ────────────────────────────────────────────
function PrintPreviewModal({ open, onClose, orders, onConfirmPrint }) {
  const tCommon = useTranslations("common");
  const t = useTranslations("warehouse.print");
  const printRef = useRef(null);
  const { formatCurrency } = usePlatformSettings()

  const handlePrint = () => {
    const printContent = printRef.current?.innerHTML;
    if (!printContent) return;
    const w = window.open("", "_blank");
    w.document.write(`
  <html  class="light">
    <head>
      <title>${t("printPreview.tabTitle")}</title>
      <script src="https://cdn.tailwindcss.com"></script>
      <script>
        tailwind.config = { darkMode: 'class' }
      </script>
      
      <style>
        /* 1. Force the paper size and remove browser headers/footers */
        @page {
          size: auto;
          margin: 0mm; /* This removes the "URL/Date" headers that cause extra pages */
        }

        * { box-sizing: border-box; margin: 0; padding: 0; }

        body { 
          background: white !important; 
          width: 100%; 
        }

        /* 2. The Page Container */
        .page { 
          
          page-break-inside: avoid;
          overflow: hidden; /* Prevents tiny bits of shadow/border from leaking */
          display: flex;
          justify-content: center;
          align-items: center;
          /* Use fixed height for the preview, but auto for print */
          
          width: 100%;
          padding: 20px;
        }

        /* 3. The Print-Specific reset */
        @media print {
          body { 
            -webkit-print-color-adjust: exact; 
            print-color-adjust: exact; 
          }
          .page { 
            min-height: 0 !important; /* CRITICAL: Remove the 100vh during print */
            padding: 5mm !important; 
            display: block !important;
          }
          /* Prevent a blank page at the very end */
          .page:last-child {
            page-break-after: auto !important;
          }
        }
      </style>
    </head>
    <body class="bg-white">
      ${printContent}
      <script>
        setTimeout(function() {
          window.print();
        }, 1000);
      </script>
    </body>
  </html>
`);
    w.document.close();
    w.focus();
    setTimeout(() => { w.print(); w.close(); }, 300);
    onConfirmPrint(orders.map((o) => o.orderNumber));
    onClose();
  };

  if (!open || !orders?.length) return null;

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="!max-w-3xl rounded-2xl max-h-[90vh] overflow-y-auto border-0  p-0 shadow-2xl" >
        {/* Header */}
        <div className="relative px-6 pt-6 pb-5 rounded-t-2xl overflow-hidden"
          style={{ background: "linear-gradient(135deg, #ff8b00 0%, #ff5c2b 55%, #ffb703 100%)" }}>
          <div className="absolute -top-4 -left-4 w-24 h-24 rounded-full bg-white/10" />
          <div className="absolute -bottom-6 -right-2 w-28 h-28 rounded-full bg-white/10" />
          <div className="relative flex items-start justify-between">
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 rounded-xl bg-white/20 backdrop-blur-sm flex items-center justify-center">
                <Printer className="text-white" size={22} />
              </div>
              <div>
                <p className="text-white/70 text-xs font-medium mb-0.5">{t("printPreview.subtitle")}</p>
                <h2 className="text-white text-xl font-bold">{t("printPreview.title", { count: orders.length })}</h2>
              </div>
            </div>
            <button onClick={onClose} className="w-8 h-8 rounded-lg bg-white/20 hover:bg-white/30 flex items-center justify-center transition-colors">
              <X size={16} className="text-white" />
            </button>
          </div>
          <div className="relative mt-4">
            <span className="inline-flex items-center gap-1.5 bg-white/20 text-white text-xs font-semibold px-3 py-1.5 rounded-full">
              <Package size={11} />{orders.length} {t("printPreview.labels")}
            </span>
          </div>
        </div>

        {/* Preview cards */}
        <div className="p-5 max-h-[52vh] overflow-y-auto space-y-3 bg-slate-50 dark:bg-slate-800/30">
          <div ref={printRef} className="w-full">
            {orders.map((order) => (
              <div key={order.orderNumber} className="page">
                {/* Screen preview card */}
                <div className="w-full bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 overflow-hidden shadow-sm mb-3">
                  {/* Label header */}
                  <div className="label-header p-4" style={{ background: "linear-gradient(135deg, #ff8b00, #ff5c2b)" }}>
                    <div className="flex items-start justify-between">
                      <div>
                        <p className="text-white/70 text-[11px] mb-0.5">{t("printPreview.orderCode")}</p>
                        <p className="text-white text-xl font-bold font-mono">{order.orderNumber}</p>
                      </div>
                      <span className="label-carrier text-white text-xs font-bold bg-white/25 px-3 py-1.5 rounded-full">
                        {order.shippingCompany?.name}
                      </span>
                    </div>
                  </div>

                  <div className="p-4 space-y-4">
                    {/* Customer info */}
                    <div className="section">
                      <p className="section-title text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">{t("printPreview.customerInfo")}</p>
                      <div className="grid grid-cols-2 gap-2">
                        {[
                          [t("labelFields.customer"), order.customerName],
                          [t("labelFields.phone"), order.phoneNumber],
                          [t("labelFields.city"), order.city],
                          [t("labelFields.area"), order.area || "—"],
                        ].map(([k, v]) => (
                          <div key={k} className="bg-slate-50 dark:bg-slate-700/50 rounded-lg p-2.5">
                            <p className="text-[10px] text-slate-400 mb-0.5">{k}</p>
                            <p className="text-xs font-semibold text-slate-800 dark:text-slate-100">{v}</p>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Shipping info */}
                    <div className="section">
                      <p className="section-title text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">{t("printPreview.shippingInfo")}</p>
                      <div className="grid grid-cols-2 gap-2">
                        {[
                          [t("labelFields.store"), order.store?.name],
                          [t("labelFields.trackingCode"), order.trackingNumber || "—"],
                          [t("labelFields.shippingCost"), `${formatCurrency(order.shippingCost || 0)}`],
                          [t("labelFields.paymentType"), order.paymentStatus === "paid" ? t("payment.paid") : order.paymentMethod === "cod" ? t("payment.cod") : order.paymentMethod],
                        ].map(([k, v]) => (
                          <div key={k} className="bg-slate-50 dark:bg-slate-700/50 rounded-lg p-2.5">
                            <p className="text-[10px] text-slate-400 mb-0.5">{k}</p>
                            <p className="text-xs font-semibold text-slate-800 dark:text-slate-100">{v}</p>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Barcode area */}
                    {/* Replace the entire barcode-area div with this */}
                    <div>
                      <BarcodeCell
                        value={order.orderNumber} className="w-full mt-2"
                      />
                      <p className="barcode-text font-mono mt-2 text-center text-sm font-bold text-slate-800 dark:text-slate-100 tracking-widest">
                        {order.orderNumber}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Hidden print-only version */}
                <div className="label" style={{ display: "none" }}>
                  <div className="label-header">
                    <div className="label-code">{order.orderNumber}</div>
                    <div className="label-carrier">{order.shippingCompany?.name}</div>
                  </div>
                  <div className="section">
                    <div className="section-title">{t("printPreview.customerInfo")}</div>
                    {[[t("labelFields.customer"), order.customerName], [t("labelFields.phone"), order.phoneNumber], [t("labelFields.city"), order.city], [t("labelFields.area"), order.area || "—"], [t("labelFields.address"), order.address || "—"]].map(([k, v]) => (
                      <div className="row" key={k}><span className="key">{k}</span><span className="val">{v}</span></div>
                    ))}
                  </div>
                  <div className="section">
                    <div className="section-title">{t("printPreview.shippingInfo")}</div>
                    {[[t("labelFields.store"), order.store?.name], [t("labelFields.trackingCode"), order.trackingNumber || "—"], [t("labelFields.shippingCost"), `${formatCurrency(order.shippingCost || 0)}`]].map(([k, v]) => (
                      <div className="row" key={k}><span className="key">{k}</span><span className="val">{v}</span></div>
                    ))}
                    <div className="row">
                      <span className="key">{t("labelFields.paymentType")}</span>
                      <span className={`payment-badge ${order.paymentStatus === "paid" ? "paid" : "cod"}`}>
                        {order.paymentStatus === "paid" ? t("payment.paid") : order.paymentMethod === "cod" ? t("payment.cod") : order.paymentMethod}
                      </span>
                    </div>
                  </div>
                  <div className="barcode-area">
                    <div className="barcode-lines" />
                    <div className="barcode-text">{order.trackingNumber || order.orderNumber}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="flex justify-end gap-2 p-5 border-t border-slate-100 dark:border-slate-700">
          <Button variant="outline" onClick={onClose} className="rounded-xl">{t("common.cancel")}</Button>
          <motion.button
            onClick={handlePrint}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl font-bold text-sm text-white shadow-lg"
            style={{ background: "linear-gradient(135deg, #ff8b00 0%, #ff5c2b 100%)" }}
          >
            <Printer size={15} />
            {t("printPreview.printNow", { count: orders.length })}
          </motion.button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

// ── NOT-PRINTED SUBTAB ────────────────────────────────────────────────────────
function NotPrintedSubtab({ onPrinted, resetToken, fetchStats }) {
  const { formatCurrency } = usePlatformSettings()
  const tCommon = useTranslations("common");
  const t = useTranslations("warehouse.print");
  const [search, setSearch] = useState("");
  const { debouncedValue: debouncedSearch } = useDebounce({ value: search, delay: 350 })
  const [filters, setFilters] = useState({ carrier: "all", store: "all", date: "", productId: "all" });
  const [selectedOrders, setSelectedOrders] = useState([]);
  const [detailModal, setDetailModal] = useState(null);
  const [printPreview, setPrintPreview] = useState({ open: false, orders: [] });

  const [pager, setPager] = useState({
    total_records: 0,
    current_page: 1,
    per_page: 12,
    records: [],
  });
  const [ordersLoading, setOrdersLoading] = useState(false);
  const { handleExport, exportLoading } = useExport();

  const buildParams = (page = pager.current_page, per_page = pager.per_page) => {
    const params = {
      page,
      limit: per_page,
      status: 'distributed',
      labelPrinted: 'false'
    };

    if (debouncedSearch) params.search = debouncedSearch;
    if (filters.store !== "all") params.storeId = filters.store;
    if (filters.carrier !== "all") params.shippingCompanyId = filters.carrier;
    if (filters.date) params.startDate = filters.date;
    if (filters.productId !== "all") params.productId = filters.productId;

    return params;
  };

  const fetchOrders = async (page = pager.current_page, per_page = pager.per_page) => {
    try {
      setOrdersLoading(true);
      const params = buildParams(page, per_page);
      const res = await api.get('/orders', { params });
      const data = res.data || {};
      setPager({
        total_records: data.total_records || 0,
        current_page: data.current_page || page,
        per_page: data.per_page || per_page,
        records: Array.isArray(data.records) ? data.records : [],
      });
    } catch (e) {
      console.error('Error fetching orders', e);
    } finally {
      setOrdersLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders(1, pager.per_page);
  }, [debouncedSearch, resetToken]);

  const handlePageChange = ({ page, per_page }) => {
    fetchOrders(page, per_page);
  };

  const applyFilters = () => {
    fetchOrders(1, pager.per_page);
  };

  const onExport = async () => {
    const params = buildParams(1, 10000);
    delete params.page;
    delete params.limit;
    await handleExport({
      endpoint: "/orders/export",
      params,
      filename: `not_printed_orders_${Date.now()}.xlsx`,
    });
  };

  const toggleOrder = (orderNumber) => setSelectedOrders((prev) => prev.includes(orderNumber) ? prev.filter((c) => c !== orderNumber) : [...prev, orderNumber]);
  const selectAll = () => setSelectedOrders(selectedOrders.length === pager.records.length ? [] : pager.records.map((o) => o.orderNumber));

  const handleConfirmPrint = async (orderNumbers) => {
    try {
      await api.post('/orders/bulk-print', { orderNumbers });
      toast.success(t("messages.printSuccess") || "Labels marked as printed");
      fetchOrders();
      fetchStats();
      onPrinted?.();
    } catch (error) {
      console.error("Print confirmation failed", error);
    }
    setSelectedOrders([]);
  };

  const hasActiveFilters = filters.carrier !== "all" || filters.store !== "all" || !!filters.date || filters.productId !== "all";

  const columns = useMemo(() => [
    {
      key: "select",
      header: (<div className="flex items-center justify-center"><Checkbox checked={pager.records.length > 0 && selectedOrders.length === pager.records.length} onCheckedChange={selectAll} /></div>),
      className: "w-[48px]",
      cell: (row) => (<div className="flex items-center justify-center"><Checkbox checked={selectedOrders.includes(row.orderNumber)} onCheckedChange={() => toggleOrder(row.orderNumber)} /></div>),
    },
    { key: "code", header: t("field.orderCode"), cell: (row) => <span className="font-mono font-bold text-[#ff8b00]">{row.orderNumber}</span> },
    { key: "customer", header: t("field.customer"), cell: (row) => <span className="font-semibold">{row.customerName}</span> },
    { key: "phone", header: t("field.phone"), cell: (row) => <span className="font-mono text-slate-500 text-sm" dir="ltr">{row.phoneNumber}</span> },
    { key: "city", header: t("field.city") },
    { key: "area", header: t("field.area") },
    { key: "carrier", header: t("field.carrier"), cell: (row) => <CarrierPill carrier={row.shippingCompany?.name} /> },
    {
      key: "trackingCode", header: t("field.trackingCode"),
      cell: (row) => row.trackingNumber
        ? <span className="font-mono text-xs bg-slate-100 dark:bg-slate-800 px-2 py-1 rounded">{row.trackingNumber}</span>
        : <span className="text-slate-400">{t("common.none")}</span>,
    },
    { key: "total", header: t("field.total"), cell: (row) => <span className="font-bold text-emerald-700 dark:text-emerald-400">{formatCurrency(row.finalTotal)}</span> },
    { key: "orderDate", header: t("field.orderDate"), cell: (row) => <span className="text-sm text-slate-500">{new Date(row.created_at).toLocaleDateString("en-US")}</span> },
    {
      key: "actions", header: t("field.actions"),
      cell: (row) => (
        <ActionButtons
          row={row}
          actions={[
            { icon: <Info />, tooltip: t("common.details"), onClick: (r) => setDetailModal(r), variant: "purple", permission: "orders.read" },
            { icon: <Printer />, tooltip: t("common.printLabel"), onClick: (r) => setPrintPreview({ open: true, orders: [r] }), variant: "blue", permission: "orders.update" },
          ]}
        />
      ),
    },
  ], [pager.records, selectedOrders, t]);

  return (
    <div className="space-y-4">
      <Table
        searchValue={search} onSearchChange={setSearch} onSearch={applyFilters}
        labels={{ searchPlaceholder: t("notPrinted.search"), filter: t("common.filter"), apply: t("common.apply"), total: t("common.total"), limit: t("common.limit"), emptyTitle: t("notPrinted.empty"), emptySubtitle: "" }}
        actions={[
          { key: "printSelected", label: selectedOrders.length > 0 ? t("notPrinted.printSelected", { count: selectedOrders.length }) : t("notPrinted.printSelectedDefault"), icon: <Printer size={14} />, color: "emerald", onClick: () => selectedOrders.length > 0 && setPrintPreview({ open: true, orders: pager.records.filter((o) => selectedOrders.includes(o.orderNumber)) }), disabled: selectedOrders.length === 0, permission: "orders.update" },
          { key: "export", label: t("common.export"), icon: exportLoading ? <Loader2 className="animate-spin" size={14} /> : <FileDown size={14} />, color: "blue", onClick: onExport, disabled: exportLoading, permission: "orders.read" },
        ]}
        hasActiveFilters={hasActiveFilters} onApplyFilters={applyFilters}
        filters={
          <>
            <ShippingCompanyFilter value={filters.carrier} onChange={(v) => setFilters(f => ({ ...f, carrier: v }))} />
            <StoreFilter value={filters.store} onChange={(v) => setFilters(f => ({ ...f, store: v }))} />
            <ProductFilter value={filters.productId} onChange={(v) => setFilters(f => ({ ...f, productId: v }))} />
            <FilterField label={t("filter.date")}>
              <Input type="date" value={filters.date} onChange={(e) => setFilters((f) => ({ ...f, date: e.target.value }))} className="h-10 rounded-xl text-sm" />
            </FilterField>
          </>
        }
        columns={columns} data={pager.records} isLoading={ordersLoading}
        pagination={{ total_records: pager.total_records, current_page: pager.current_page, per_page: pager.per_page }}
        onPageChange={handlePageChange}
      />
      <PrintPreviewModal open={printPreview.open} onClose={() => setPrintPreview({ open: false, orders: [] })} orders={printPreview.orders} onConfirmPrint={handleConfirmPrint} />
      <OrderDetailModal open={!!detailModal} onClose={() => setDetailModal(null)} order={detailModal} hideNotes={true} />
    </div>
  );
}

// ── PRINTED SUBTAB ────────────────────────────────────────────────────────────
function PrintedSubtab({ resetToken, fetchStats }) {
  const tCommon = useTranslations("common");
  const t = useTranslations("warehouse.print");
  const { formatCurrency } = usePlatformSettings()
  const [search, setSearch] = useState("");
  const { debouncedValue: debouncedSearch } = useDebounce({ value: search, delay: 350 })
  const [filters, setFilters] = useState({ carrier: "all", store: "all", date: "", productId: "all" });
  const [selectedOrders, setSelectedOrders] = useState([]);
  const [detailModal, setDetailModal] = useState(null);
  const [printPreview, setPrintPreview] = useState({ open: false, orders: [] });

  const [pager, setPager] = useState({
    total_records: 0,
    current_page: 1,
    per_page: 12,
    records: [],
  });
  const [ordersLoading, setOrdersLoading] = useState(false);
  const { handleExport, exportLoading } = useExport();

  const buildParams = (page = pager.current_page, per_page = pager.per_page) => {
    const params = {
      page,
      limit: per_page,
      status: 'printed',
      labelPrinted: 'true'
    };

    if (debouncedSearch) params.search = debouncedSearch;
    if (filters.store !== "all") params.storeId = filters.store;
    if (filters.carrier !== "all") params.shippingCompanyId = filters.carrier;
    if (filters.date) params.startDate = filters.date;
    if (filters.productId !== "all") params.productId = filters.productId;

    return params;
  };

  const fetchOrders = async (page = pager.current_page, per_page = pager.per_page) => {
    try {
      setOrdersLoading(true);
      const params = buildParams(page, per_page);
      const res = await api.get('/orders', { params });
      const data = res.data || {};
      setPager({
        total_records: data.total_records || 0,
        current_page: data.current_page || page,
        per_page: data.per_page || per_page,
        records: Array.isArray(data.records) ? data.records : [],
      });
    } catch (e) {
      console.error('Error fetching orders', e);
    } finally {
      setOrdersLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders(1, pager.per_page);
  }, [debouncedSearch, resetToken]);

  const handlePageChange = ({ page, per_page }) => {
    fetchOrders(page, per_page);
  };

  const applyFilters = () => {
    fetchOrders(1, pager.per_page);
  };

  const onExport = async () => {
    const params = buildParams(1, 10000);
    delete params.page;
    delete params.limit;
    await handleExport({
      endpoint: "/orders/export",
      params,
      filename: `printed_orders_${Date.now()}.xlsx`,
    });
  };

  const toggleOrder = (orderNumber) => setSelectedOrders((prev) => prev.includes(orderNumber) ? prev.filter((c) => c !== orderNumber) : [...prev, orderNumber]);
  const selectAll = () => setSelectedOrders(selectedOrders.length === pager.records.length ? [] : pager.records.map((o) => o.orderNumber));

  const handleReprintConfirm = async (orderNumbers) => {
    try {
      await api.post('/orders/bulk-print', { orderNumbers });
      toast.success(t("messages.reprintSuccess") || "Labels reprinted successfully");
      fetchOrders();
      fetchStats();
    } catch (error) {
      console.error("Reprint confirmation failed", error);
    }
  };

  const hasActiveFilters = filters.carrier !== "all" || filters.store !== "all" || !!filters.date || filters.productId !== "all";

  const columns = useMemo(() => [
    {
      key: "select",
      header: (<div className="flex items-center justify-center"><Checkbox checked={pager.records.length > 0 && selectedOrders.length === pager.records.length} onCheckedChange={selectAll} /></div>),
      className: "w-[48px]",
      cell: (row) => (<div className="flex items-center justify-center"><Checkbox checked={selectedOrders.includes(row.orderNumber)} onCheckedChange={() => toggleOrder(row.orderNumber)} /></div>),
    },
    { key: "code", header: t("field.orderCode"), cell: (row) => <span className="font-mono font-bold text-[#ff8b00]">{row.orderNumber}</span> },
    { key: "customer", header: t("field.customer"), cell: (row) => <span className="font-semibold">{row.customerName}</span> },
    { key: "phone", header: t("field.phone"), cell: (row) => <span className="font-mono text-slate-500 text-sm" dir="ltr">{row.phoneNumber}</span> },
    { key: "city", header: t("field.city") },
    { key: "carrier", header: t("field.carrier"), cell: (row) => <CarrierPill carrier={row.shippingCompany?.name} /> },
    { key: "printedAt", header: t("field.printedAt"), cell: (row) => <span className="text-sm text-slate-500">{row.labelPrinted ? new Date(row.labelPrinted).toLocaleString() : "—"}</span> },
    { key: "total", header: t("field.total"), cell: (row) => <span className="font-bold text-emerald-700 dark:text-emerald-400">{formatCurrency(row.finalTotal)}</span> },
    {
      key: "actions", header: t("field.actions"),
      cell: (row) => (
        <ActionButtons
          row={row}
          actions={[
            { icon: <Info />, tooltip: t("common.details"), onClick: (r) => setDetailModal(r), variant: "purple", permission: "orders.read" },
            { icon: <Printer />, tooltip: t("common.reprint"), onClick: (r) => setPrintPreview({ open: true, orders: [r] }), variant: "blue", permission: "orders.update" },
          ]}
        />
      ),
    },
  ], [pager.records, selectedOrders, t]);

  return (
    <div className="space-y-4">
      <Table
        searchValue={search} onSearchChange={setSearch} onSearch={applyFilters}
        labels={{ searchPlaceholder: t("printed.search"), filter: t("common.filter"), apply: t("common.apply"), total: t("common.total"), limit: t("common.limit"), emptyTitle: t("printed.empty"), emptySubtitle: "" }}
        actions={[
          { key: "reprintSelected", label: selectedOrders.length > 0 ? t("printed.printSelected", { count: selectedOrders.length }) : t("printed.printSelectedDefault"), icon: <Printer size={14} />, color: "emerald", onClick: () => selectedOrders.length > 0 && setPrintPreview({ open: true, orders: pager.records.filter((o) => selectedOrders.includes(o.orderNumber)) }), disabled: selectedOrders.length === 0, permission: "orders.update" },
          { key: "export", label: t("common.export"), icon: exportLoading ? <Loader2 className="animate-spin" size={14} /> : <FileDown size={14} />, color: "blue", onClick: onExport, disabled: exportLoading, permission: "orders.read" },
        ]}
        hasActiveFilters={hasActiveFilters} onApplyFilters={applyFilters}
        filters={
          <>
            <ShippingCompanyFilter value={filters.carrier} onChange={(v) => setFilters(f => ({ ...f, carrier: v }))} />
            <StoreFilter value={filters.store} onChange={(v) => setFilters(f => ({ ...f, store: v }))} />
            <ProductFilter value={filters.productId} onChange={(v) => setFilters(f => ({ ...f, productId: v }))} />
            <FilterField label={t("filter.printDate")}>
              <Input type="date" value={filters.date} onChange={(e) => setFilters((f) => ({ ...f, date: e.target.value }))} className="h-10 rounded-xl text-sm" />
            </FilterField>
          </>
        }
        columns={columns} data={pager.records} isLoading={ordersLoading}
        pagination={{ total_records: pager.total_records, current_page: pager.current_page, per_page: pager.per_page }}
        onPageChange={handlePageChange}
      />
      <PrintPreviewModal open={printPreview.open} onClose={() => setPrintPreview({ open: false, orders: [] })} orders={printPreview.orders} onConfirmPrint={handleReprintConfirm} />
      <OrderDetailModal open={!!detailModal} onClose={() => setDetailModal(null)} order={detailModal} />
    </div>
  );
}

