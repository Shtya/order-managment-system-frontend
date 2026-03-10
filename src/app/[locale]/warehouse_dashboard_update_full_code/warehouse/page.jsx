"use client";

import React, { useCallback, useEffect, useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { useLocale } from "next-intl";
import { usePathname, useRouter, useSearchParams } from "next/navigation";

import DistributionTab from "./tabs/DistributionTab";
import PrintLabelsTab from "./tabs/PrintLabelsTab";
import PreparationTab from "./tabs/PreparationTab";
import OutgoingTab from "./tabs/OutgoingTab";
import ReturnsTab from "./tabs/ReturnsTab";
import { RejectedTab } from "./tabs/RejectedTab";
import { LogsTab } from "./tabs/LogsTab";

import {
  CARRIERS,
  STATUS,
  initialDeliveryFiles,
  initialInventory,
  initialOpsLogs,
  initialOrders,
  initialReturnFiles,
} from "./tabs/data";
import { setPreparationSelection } from "./utils/prepareSession";

const TAB_IDS = ["distribution", "print", "preparation", "outgoing", "returns", "rejected", "logs"];

const DEFAULT_SUBTABS = {
  distribution: "unassigned",
  print: "not_printed",
  preparation: "preparing",
  outgoing: "scan",
  returns: "scan",
};

const SUBTABS = {
  distribution: ["unassigned", "assigned"],
  print: ["not_printed", "printed"],
  preparation: ["preparing", "prepared"],
  outgoing: ["scan", "files"],
  returns: ["scan", "files"],
  rejected: [],
  logs: [],
};

function isValidSubtab(tab, subtab) {
  return !!subtab && (SUBTABS[tab] || []).includes(subtab);
}

export default function WarehouseFlowPage() {
  const locale = useLocale();
  const dir = locale === "ar" ? "rtl" : "ltr";
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const [orders, setOrders] = useState(initialOrders);
  const [opsLogs, setOpsLogs] = useState(initialOpsLogs);
  const [deliveryFiles, setDeliveryFiles] = useState(initialDeliveryFiles);
  const [returnFiles, setReturnFiles] = useState(initialReturnFiles);
  const [inventory, setInventory] = useState(initialInventory);
  const [distributionDialog, setDistributionDialog] = useState(false);
  const [selectedOrdersForDistribution, setSelectedOrdersForDistribution] = useState([]);

  const activeTabFromUrl = searchParams.get("tab");
  const activeSubtabFromUrl = searchParams.get("subtab");
  const activeTab = TAB_IDS.includes(activeTabFromUrl) ? activeTabFromUrl : "distribution";
  const activeSubtab = isValidSubtab(activeTab, activeSubtabFromUrl)
    ? activeSubtabFromUrl
    : DEFAULT_SUBTABS[activeTab] || null;

  useEffect(() => {
    const rawTab = searchParams.get("tab");
    const rawSubtab = searchParams.get("subtab");
    const safeTab = TAB_IDS.includes(rawTab) ? rawTab : "distribution";
    const defaultSubtab = DEFAULT_SUBTABS[safeTab] || null;

    if (rawTab !== safeTab || (defaultSubtab && !isValidSubtab(safeTab, rawSubtab))) {
      const nextParams = new URLSearchParams(searchParams.toString());
      nextParams.set("tab", safeTab);
      if (defaultSubtab) nextParams.set("subtab", defaultSubtab);
      else nextParams.delete("subtab");
      router.replace(`${pathname}?${nextParams.toString()}`, { scroll: false });
    }
  }, [pathname, router, searchParams]);

  const setActiveTab = useCallback(
    (tabId) => {
      const nextTab = TAB_IDS.includes(tabId) ? tabId : "distribution";
      const nextParams = new URLSearchParams(searchParams.toString());
      nextParams.set("tab", nextTab);
      nextParams.delete("subtab");

      if (DEFAULT_SUBTABS[nextTab]) {
        nextParams.set("subtab", DEFAULT_SUBTABS[nextTab]);
      }

      router.push(`${pathname}?${nextParams.toString()}`, { scroll: false });
    },
    [pathname, router, searchParams]
  );

  const setActiveSubtab = useCallback(
    (subtabId) => {
      const nextParams = new URLSearchParams(searchParams.toString());
      nextParams.set("subtab", subtabId);
      router.push(`${pathname}?${nextParams.toString()}`, { scroll: false });
    },
    [pathname, router, searchParams]
  );

  const updateOrder = useCallback((orderCode, patch) => {
    setOrders((current) =>
      current.map((order) => (order.code === orderCode ? { ...order, ...patch } : order))
    );
  }, []);

  const pushOp = useCallback((operation) => {
    setOpsLogs((current) => [operation, ...current]);
  }, []);

  const addDeliveryFile = useCallback((file) => {
    setDeliveryFiles((current) => [file, ...current]);
  }, []);

  const addReturnFile = useCallback((file) => {
    setReturnFiles((current) => [file, ...current]);
  }, []);

  const updateInventory = useCallback((nextInventory) => {
    setInventory(nextInventory);
  }, []);

  const rejectOrder = useCallback(
    (orderCode, { reason, stage = "system", employee = "System" } = {}) => {
      const targetOrder = orders.find((order) => order.code === orderCode);
      if (!targetOrder) return false;

      const now = new Date().toISOString().slice(0, 16).replace("T", " ");
      const normalizedReason = reason || "تم رفض الطلب";

      updateOrder(orderCode, {
        status: STATUS.REJECTED,
        rejectReason: normalizedReason,
        rejectedAt: now,
        rejectedFrom: stage,
      });

      pushOp({
        id: `OP-${Date.now()}-${orderCode}`,
        operationType: "REJECT_ORDER",
        orderCode,
        carrier: targetOrder.carrier || "-",
        employee,
        result: "FAILED",
        details: `${normalizedReason} (${stage})`,
        createdAt: now,
      });

      return true;
    },
    [orders, pushOp, updateOrder]
  );

  const openPreparationWithOrders = useCallback(
    (orderList) => {
      const selected = (Array.isArray(orderList) ? orderList : [orderList]).filter(Boolean);
      if (selected.length === 0) return;

      const codes = selected.map((order) => order.code);
      setPreparationSelection(codes);

      setOrders((current) =>
        current.map((order) => {
          if (!codes.includes(order.code)) return order;
          if ([STATUS.PREPARING, STATUS.PREPARED, STATUS.SHIPPED].includes(order.status)) return order;
          return {
            ...order,
            status: STATUS.PREPARING,
          };
        })
      );

      const nextParams = new URLSearchParams(searchParams.toString());
      nextParams.set("tab", "preparation");
      nextParams.set("subtab", "preparing");
      router.push(`${pathname}?${nextParams.toString()}`, { scroll: false });
    },
    [pathname, router, searchParams]
  );

  const preparedOrdersForDistribution = useMemo(
    () => orders.filter((order) => order.status === STATUS.PREPARED),
    [orders]
  );

  const handleDistributePreparedOrders = useCallback(
    (carrier, codes) => {
      const now = new Date().toISOString().slice(0, 16).replace("T", " ");
      codes.forEach((code, index) => {
        updateOrder(code, {
          carrier,
          status: STATUS.SHIPPED,
          shippedAt: now,
        });

        pushOp({
          id: `OP-${Date.now()}-${index}`,
          operationType: "SHIP_ORDER",
          orderCode: code,
          carrier,
          employee: "System",
          result: "SUCCESS",
          details: `تم التوزيع على شركة الشحن ${carrier}`,
          createdAt: now,
        });
      });
    },
    [pushOp, updateOrder]
  );

  const renderKey = `${activeTab}-${activeSubtab}`;

  return (
    <div
      className="min-h-screen bg-gradient-to-br from-slate-50 via-orange-50/20 to-amber-50/20 p-4 md:p-6 dark:from-[#182337] dark:via-[#182337] dark:to-[#1a2744]"
      dir={dir}
    >
      <AnimatePresence mode="wait">
        <motion.div
          key={renderKey}
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -8 }}
          transition={{ duration: 0.18 }}
        >
          {activeTab === "distribution" ? (
            <DistributionTab
              key={renderKey}
              orders={orders}
              updateOrder={updateOrder}
              pushOp={pushOp}
              rejectOrder={rejectOrder}
              subtab={activeSubtab}
              setSubtab={setActiveSubtab}
            />
          ) : null}

          {activeTab === "print" ? (
            <PrintLabelsTab
              key={renderKey}
              orders={orders}
              updateOrder={updateOrder}
              pushOp={pushOp}
              subtab={activeSubtab}
              setSubtab={setActiveSubtab}
              onPrepareOrder={openPreparationWithOrders}
              onPrepareMultiple={openPreparationWithOrders}
            />
          ) : null}

          {activeTab === "preparation" ? (
            <PreparationTab
              key={renderKey}
              orders={orders}
              updateOrder={updateOrder}
              pushOp={pushOp}
              rejectOrder={rejectOrder}
              subtab={activeSubtab}
              setSubtab={setActiveSubtab}
              setDistributionDialog={setDistributionDialog}
              setSelectedOrdersGlobal={setSelectedOrdersForDistribution}
            />
          ) : null}

          {activeTab === "outgoing" ? (
            <OutgoingTab
              key={renderKey}
              orders={orders}
              updateOrder={updateOrder}
              pushOp={pushOp}
              rejectOrder={rejectOrder}
              inventory={inventory}
              updateInventory={updateInventory}
              deliveryFiles={deliveryFiles}
              addDeliveryFile={addDeliveryFile}
              subtab={activeSubtab}
              setSubtab={setActiveSubtab}
            />
          ) : null}

          {activeTab === "returns" ? (
            <ReturnsTab
              key={renderKey}
              orders={orders}
              updateOrder={updateOrder}
              pushOp={pushOp}
              inventory={inventory}
              updateInventory={updateInventory}
              returnFiles={returnFiles}
              addReturnFile={addReturnFile}
              subtab={activeSubtab}
              setSubtab={setActiveSubtab}
            />
          ) : null}

          {activeTab === "rejected" ? (
            <RejectedTab
              key={renderKey}
              orders={orders}
              updateOrder={updateOrder}
              pushOp={pushOp}
            />
          ) : null}

          {activeTab === "logs" ? (
            <LogsTab key={renderKey} opsLogs={opsLogs} orders={orders} />
          ) : null}
        </motion.div>
      </AnimatePresence>

      {distributionDialog ? (
        <DistributionDialog
          open={distributionDialog}
          onClose={() => setDistributionDialog(false)}
          orders={preparedOrdersForDistribution}
          selectedOrderCodes={selectedOrdersForDistribution}
          onConfirm={handleDistributePreparedOrders}
        />
      ) : null}
    </div>
  );
}

function DistributionDialog({ open, onClose, orders, selectedOrderCodes, onConfirm }) {
  const [selectedOrders, setSelectedOrders] = useState([]);
  const [carrier, setCarrier] = useState("");

  React.useEffect(() => {
    if (!open) return;
    setSelectedOrders(selectedOrderCodes.length > 0 ? selectedOrderCodes : orders.map((order) => order.code));
    setCarrier("");
  }, [open, orders, selectedOrderCodes]);

  if (!open) return null;

  const toggleOrder = (orderCode) => {
    setSelectedOrders((current) =>
      current.includes(orderCode)
        ? current.filter((code) => code !== orderCode)
        : [...current, orderCode]
    );
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/70 px-4 backdrop-blur-sm">
      <div className="w-full max-w-2xl rounded-3xl border border-border bg-card p-6 shadow-2xl">
        <div className="mb-5 flex items-center justify-between gap-3">
          <div>
            <h3 className="text-lg font-black text-foreground">توزيع الطلبات على شركة الشحن</h3>
            <p className="mt-1 text-sm text-muted-foreground">اختر الطلبات الجاهزة والشركة التي ستستلمها.</p>
          </div>
          <button type="button" onClick={onClose} className="rounded-full bg-muted px-3 py-1 text-xs font-bold text-muted-foreground">
            إغلاق
          </button>
        </div>

        <div className="mb-4 grid gap-3 md:grid-cols-4">
          {CARRIERS.map((carrierOption) => (
            <button
              key={carrierOption}
              type="button"
              onClick={() => setCarrier(carrierOption)}
              className={`rounded-2xl border px-3 py-3 text-sm font-bold transition-colors ${
                carrier === carrierOption
                  ? "border-primary bg-primary text-primary-foreground"
                  : "border-border bg-background text-foreground hover:bg-muted"
              }`}
            >
              {carrierOption}
            </button>
          ))}
        </div>

        <div className="max-h-[320px] space-y-2 overflow-y-auto rounded-2xl border border-border bg-muted/30 p-3">
          {orders.map((order) => {
            const selected = selectedOrders.includes(order.code);
            return (
              <button
                key={order.code}
                type="button"
                onClick={() => toggleOrder(order.code)}
                className={`flex w-full items-center justify-between rounded-2xl border px-4 py-3 text-start transition-colors ${
                  selected ? "border-primary bg-primary/6" : "border-border bg-background hover:bg-muted"
                }`}
              >
                <div>
                  <p className="font-mono text-sm font-black text-foreground">{order.code}</p>
                  <p className="mt-1 text-xs text-muted-foreground">{order.customer} · {order.city}</p>
                </div>
                <span className="rounded-full bg-muted px-3 py-1 text-[11px] font-black text-muted-foreground">
                  {order.products.length} منتج
                </span>
              </button>
            );
          })}
        </div>

        <div className="mt-5 flex items-center justify-end gap-2">
          <button type="button" onClick={onClose} className="rounded-2xl border border-border px-4 py-2 text-sm font-bold text-foreground">
            إلغاء
          </button>
          <button
            type="button"
            disabled={!carrier || selectedOrders.length === 0}
            onClick={() => {
              onConfirm(carrier, selectedOrders);
              onClose();
            }}
            className="rounded-2xl bg-primary px-4 py-2 text-sm font-bold text-primary-foreground disabled:cursor-not-allowed disabled:opacity-50"
          >
            تأكيد التوزيع
          </button>
        </div>
      </div>
    </div>
  );
}
