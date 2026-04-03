"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  AlertTriangle,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  ClipboardList,
  Package,
  ScanLine,
  ShieldX,
  Trash2,
  User,
  XCircle,
} from "lucide-react";
import { useTranslations } from "next-intl";

import { cn } from "@/utils/cn";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";

import { STATUS, getOrderItemCount, getOrderPreparedItemCount, getProductMeta } from "../tabs/data";
import {
  buildOrderPreparationState,
  clearPrepareSession,
  mergeSessionWithOrders,
  readPrepareSession,
  writePrepareSession,
} from "../utils/prepareSession";

function playTone(kind) {
  if (typeof window === "undefined") return;
  const AudioCtor = window.AudioContext || window.webkitAudioContext;
  if (!AudioCtor) return;

  try {
    const context = new AudioCtor();
    const oscillator = context.createOscillator();
    const gainNode = context.createGain();

    oscillator.connect(gainNode);
    gainNode.connect(context.destination);

    oscillator.type = kind === "success" ? "triangle" : "square";
    oscillator.frequency.value = kind === "success" ? 840 : 220;
    gainNode.gain.setValueAtTime(0.0001, context.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.06, context.currentTime + 0.02);
    gainNode.gain.exponentialRampToValueAtTime(0.0001, context.currentTime + (kind === "success" ? 0.12 : 0.2));

    oscillator.start();
    oscillator.stop(context.currentTime + (kind === "success" ? 0.13 : 0.21));
    oscillator.onended = () => context.close();
  } catch (_) {
    // Ignore audio failures.
  }
}

function StatCard({ label, value, note, tone = "default" }) {
  const toneClass = {
    default: "border-slate-200 bg-white",
    amber: "border-amber-200 bg-amber-50",
    emerald: "border-emerald-200 bg-emerald-50",
    red: "border-red-200 bg-red-50",
  }[tone];

  return (
    <div className={cn("rounded-3xl border p-4", toneClass)}>
      <p className="text-xs font-bold uppercase tracking-[0.2em] text-muted-foreground">{label}</p>
      <p className="mt-3 text-3xl font-black text-foreground">{value}</p>
      {note ? <p className="mt-2 text-xs text-muted-foreground">{note}</p> : null}
    </div>
  );
}

function QueueOrderCard({ order, state, active, onActivate, onRemove, t }) {
  const doneItems = (state?.products || []).reduce((sum, product) => sum + (Number(product.scannedQty) || 0), 0);
  const totalItems = (state?.products || []).reduce((sum, product) => sum + (Number(product.requestedQty) || 0), 0);
  const completed = totalItems > 0 && doneItems >= totalItems;

  return (
    <div className={cn("w-full rounded-3xl border p-4 transition-colors", active ? "border-primary bg-primary/6" : "border-border bg-background hover:bg-muted/50")}>
      <div className="flex items-start justify-between gap-3">
        <button type="button" onClick={() => onActivate(order.code)} className="min-w-0 flex-1 text-start">
          <div className="flex items-center gap-2">
            <p className="font-mono text-sm font-black text-foreground">{order.code}</p>
            {completed ? <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-black text-emerald-700">{t("scan.completed")}</span> : null}
          </div>
          <p className="mt-1 truncate text-xs text-muted-foreground">{order.customer} · {order.city}</p>
        </button>

        <button
          type="button"
          onClick={() => onRemove(order.code)}
          className="rounded-full bg-muted p-2 text-muted-foreground transition-colors hover:bg-red-50 hover:text-red-600"
          aria-label={t("actions.removeOrder")}
        >
          <Trash2 size={14} />
        </button>
      </div>

      <div className="mt-4 flex items-center gap-3">
        <progress value={doneItems} max={Math.max(totalItems, 1)} className="h-2 flex-1 overflow-hidden rounded-full [appearance:none] [&::-webkit-progress-bar]:rounded-full [&::-webkit-progress-bar]:bg-muted [&::-webkit-progress-value]:rounded-full [&::-webkit-progress-value]:bg-primary [&::-moz-progress-bar]:rounded-full [&::-moz-progress-bar]:bg-primary" />
        <span className="text-[11px] font-black text-muted-foreground">{doneItems}/{totalItems}</span>
      </div>
    </div>
  );
}

function ProductScanRow({ product }) {
  const meta = getProductMeta(product.sku);
  const scannedQty = Number(product.scannedQty) || 0;
  const requestedQty = Number(product.requestedQty) || 0;
  const progress = requestedQty > 0 ? Math.round((scannedQty / requestedQty) * 100) : 0;
  const completed = scannedQty >= requestedQty && requestedQty > 0;

  return (
    <div className={cn("rounded-3xl border p-4 transition-colors", completed ? "border-emerald-200 bg-emerald-50" : scannedQty > 0 ? "border-primary/30 bg-primary/5" : "border-border bg-background")}>
      <div className="flex items-start gap-4">
        <div className="flex h-14 w-14 items-center justify-center overflow-hidden rounded-2xl border border-border bg-white">
          <img src={product.image || meta.image} alt={product.name} className="h-full w-full object-cover" />
        </div>

        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <p className="truncate text-sm font-black text-foreground">{product.name}</p>
            {completed ? <CheckCircle2 size={16} className="text-emerald-600" /> : null}
          </div>
          <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
            <code className="rounded-xl bg-muted px-2 py-1 font-black">{product.sku}</code>
            <span>{product.shelf || meta.shelf}</span>
          </div>
        </div>

        <div className="rounded-2xl bg-muted px-3 py-2 text-center">
          <p className="text-[11px] font-bold text-muted-foreground">الكمية</p>
          <p className="text-sm font-black text-foreground">{scannedQty}/{requestedQty}</p>
        </div>
      </div>

      {requestedQty > 1 ? (
        <div className="mt-4">
          <div className="mb-2 flex items-center justify-between text-xs font-bold text-muted-foreground">
            <span>{scannedQty} / {requestedQty}</span>
            <span>{progress}%</span>
          </div>
          <progress value={scannedQty} max={Math.max(requestedQty, 1)} className="h-2 w-full overflow-hidden rounded-full [appearance:none] [&::-webkit-progress-bar]:rounded-full [&::-webkit-progress-bar]:bg-muted [&::-webkit-progress-value]:rounded-full [&::-webkit-progress-value]:bg-primary [&::-moz-progress-bar]:rounded-full [&::-moz-progress-bar]:bg-primary" />
        </div>
      ) : null}
    </div>
  );
}

function RejectDialog({ open, onClose, orderCode, onConfirm, t }) {
  const [reason, setReason] = useState("");

  useEffect(() => {
    if (open) setReason("");
  }, [open]);

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-lg rounded-3xl  p-0" dir="rtl">
        <DialogHeader className="border-b border-border px-6 py-5">
          <DialogTitle className="flex items-center gap-2 text-lg font-black text-foreground">
            <ShieldX size={18} className="text-red-500" />
            {t("reject.title")}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 px-6 py-6">
          <div className="rounded-2xl border border-border bg-muted/30 p-4">
            <p className="text-xs font-bold text-muted-foreground">{t("fields.orderCode")}</p>
            <p className="mt-1 font-mono text-sm font-black text-foreground">{orderCode}</p>
          </div>

          <div>
            <label className="mb-2 block text-sm font-black text-foreground">{t("reject.reason")}</label>
            <Textarea
              value={reason}
              onChange={(event) => setReason(event.target.value)}
              rows={4}
              className="rounded-2xl"
              placeholder={t("reject.placeholder")}
            />
          </div>

          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={onClose}>{t("actions.cancel")}</Button>
            <Button variant="destructive" onClick={() => onConfirm(reason)} disabled={!reason.trim()}>{t("actions.reject")}</Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

export default function MultiPrepareView({ orders, updateOrder, pushOp, rejectOrder }) {
  const t = useTranslations("warehouse.preparation");
  const inputRef = useRef(null);
  const [session, setSession] = useState(null);
  const [scanInput, setScanInput] = useState("");
  const [saving, setSaving] = useState(false);
  const [panelOpen, setPanelOpen] = useState(true);
  const [rejectTarget, setRejectTarget] = useState("");

  const waitingOrders = useMemo(
    () => orders.filter((order) => order.status === STATUS.PREPARING),
    [orders]
  );

  useEffect(() => {
    const stored = readPrepareSession();
    const merged = mergeSessionWithOrders(stored, waitingOrders);
    setSession(merged);
  }, [waitingOrders]);

  useEffect(() => {
    if (!session) return;
    writePrepareSession(session);
  }, [session]);

  useEffect(() => {
    if (!session) return;
    const timeout = window.setTimeout(() => inputRef.current?.focus(), 80);
    return () => window.clearTimeout(timeout);
  }, [session?.activeOrderCode]);

  const orderMap = useMemo(() => new Map(waitingOrders.map((order) => [order.code, order])), [waitingOrders]);

  const queueOrders = useMemo(() => {
    if (!session) return [];
    return (session.selectedOrderCodes || []).map((code) => orderMap.get(code)).filter(Boolean);
  }, [orderMap, session]);

  const activeOrder = session?.activeOrderCode ? orderMap.get(session.activeOrderCode) : null;
  const activeState = session?.activeOrderCode ? session.orderStates?.[session.activeOrderCode] : null;

  const waitingCount = waitingOrders.length;
  const totalWaitingItems = waitingOrders.reduce((sum, order) => sum + getOrderItemCount(order), 0);
  const totalPreparedItems = waitingOrders.reduce((sum, order) => {
    const state = session?.orderStates?.[order.code];
    return sum + (state ? state.products.reduce((acc, product) => acc + (Number(product.scannedQty) || 0), 0) : getOrderPreparedItemCount(order));
  }, 0);

  const allQueuedComplete = queueOrders.length > 0 && queueOrders.every((order) => session?.orderStates?.[order.code]?.products?.every((product) => product.completed));

  const feedback = session?.lastFeedback;

  const updateSession = (updater) => {
    setSession((current) => {
      const base = current || mergeSessionWithOrders(readPrepareSession(), waitingOrders);
      return updater(base);
    });
  };

  const addFeedback = (payload) => {
    updateSession((current) => ({
      ...current,
      lastFeedback: {
        ...payload,
        timestamp: new Date().toISOString(),
      },
    }));
  };

  const removeOrderFromQueue = (orderCode) => {
    updateSession((current) => {
      const nextCodes = (current.selectedOrderCodes || []).filter((code) => code !== orderCode);
      const nextStates = { ...(current.orderStates || {}) };
      delete nextStates[orderCode];

      const nextActive = current.activeOrderCode === orderCode ? null : current.activeOrderCode;
      const nextSession = {
        ...current,
        selectedOrderCodes: nextCodes,
        scannedOrderCodes: (current.scannedOrderCodes || []).filter((code) => code !== orderCode),
        activeOrderCode: nextActive,
        orderStates: nextStates,
      };

      if (nextCodes.length === 0) {
        clearPrepareSession();
        return mergeSessionWithOrders(createEmptySession(), waitingOrders);
      }

      return mergeSessionWithOrders(nextSession, waitingOrders);
    });
  };

  const createEmptySession = () => ({
    selectedOrderCodes: [],
    scannedOrderCodes: [],
    activeOrderCode: null,
    employee: "",
    notes: "",
    counters: { success: 0, wrong: 0 },
    lastFeedback: null,
    orderStates: {},
    updatedAt: new Date().toISOString(),
  });

  const validateBarcode = (value) => /^[A-Za-z0-9-]{3,}$/.test(value);

  const handleOrderScan = (code) => {
    const foundOrder = waitingOrders.find((order) => order.code === code);

    if (!foundOrder) {
      playTone("error");
      updateSession((current) => ({
        ...current,
        counters: { ...current.counters, wrong: current.counters.wrong + 1 },
      }));
      addFeedback({ success: false, message: t("messages.orderNotFound", { code }) });
      return;
    }

    if (!foundOrder.products || foundOrder.products.length === 0) {
      playTone("error");
      updateSession((current) => ({
        ...current,
        counters: { ...current.counters, wrong: current.counters.wrong + 1 },
      }));
      addFeedback({ success: false, message: t("messages.orderMissingItems", { code }) });
      return;
    }

    playTone("success");
    updateSession((current) => {
      const nextCodes = Array.from(new Set([...(current.selectedOrderCodes || []), code]));
      const existingState = current.orderStates?.[code] || buildOrderPreparationState(foundOrder);

      return mergeSessionWithOrders(
        {
          ...current,
          selectedOrderCodes: nextCodes,
          scannedOrderCodes: Array.from(new Set([...(current.scannedOrderCodes || []), code])),
          activeOrderCode: code,
          orderStates: {
            ...(current.orderStates || {}),
            [code]: {
              ...existingState,
              orderScanned: true,
              scanLogs: [
                {
                  type: "order",
                  success: true,
                  message: t("messages.orderScanned", { code }),
                  timestamp: new Date().toISOString(),
                },
                ...(existingState.scanLogs || []),
              ],
            },
          },
          counters: { ...current.counters, success: current.counters.success + 1 },
        },
        waitingOrders
      );
    });

    addFeedback({ success: true, message: t("messages.orderReady", { code }) });
  };

  const handleItemScan = (code) => {
    if (!activeOrder || !activeState) return;

    const productIndex = (activeState.products || []).findIndex((product) => product.sku === code);
    if (productIndex === -1) {
      playTone("error");
      updateSession((current) => ({
        ...current,
        counters: { ...current.counters, wrong: current.counters.wrong + 1 },
      }));
      addFeedback({ success: false, message: t("messages.invalidItem", { code }) });
      return;
    }

    const product = activeState.products[productIndex];

    if ((Number(product.scannedQty) || 0) >= (Number(product.requestedQty) || 0)) {
      playTone("error");
      updateSession((current) => ({
        ...current,
        counters: { ...current.counters, wrong: current.counters.wrong + 1 },
      }));
      addFeedback({ success: false, message: t("messages.itemAlreadyComplete", { code }) });
      return;
    }

    playTone("success");
    updateSession((current) => {
      const currentState = current.orderStates[activeOrder.code];
      const nextProducts = currentState.products.map((item, index) => {
        if (index !== productIndex) return item;
        const nextQty = (Number(item.scannedQty) || 0) + 1;
        return {
          ...item,
          scannedQty: nextQty,
          completed: nextQty >= (Number(item.requestedQty) || 0),
        };
      });

      const completed = nextProducts.every((item) => item.completed);
      const nextState = {
        ...currentState,
        completed,
        lastItemSku: code,
        products: nextProducts,
        scanLogs: [
          {
            type: "item",
            success: true,
            message: t("messages.itemScanned", {
              product: product.name,
              scanned: (Number(product.scannedQty) || 0) + 1,
              total: product.requestedQty,
            }),
            timestamp: new Date().toISOString(),
          },
          ...(currentState.scanLogs || []),
        ],
      };

      return {
        ...current,
        activeOrderCode: completed ? null : current.activeOrderCode,
        counters: { ...current.counters, success: current.counters.success + 1 },
        orderStates: {
          ...current.orderStates,
          [activeOrder.code]: nextState,
        },
      };
    });

    if ((Number(product.scannedQty) || 0) + 1 >= (Number(product.requestedQty) || 0) && activeState.products.length === 1) {
      addFeedback({ success: true, message: t("messages.orderCompleted", { code: activeOrder.code }) });
    } else {
      addFeedback({ success: true, message: t("messages.scanSuccess") });
    }
  };

  const handleScan = () => {
    const code = scanInput.trim();
    setScanInput("");
    if (!code || !session) return;

    if (!validateBarcode(code)) {
      playTone("error");
      updateSession((current) => ({
        ...current,
        counters: { ...current.counters, wrong: current.counters.wrong + 1 },
      }));
      addFeedback({ success: false, message: t("messages.invalidBarcode") });
      return;
    }

    try {
      if (!session.activeOrderCode) {
        handleOrderScan(code);
        return;
      }

      if (code === session.activeOrderCode) {
        playTone("success");
        addFeedback({ success: true, message: t("messages.scanItemsPrompt") });
        return;
      }

      handleItemScan(code);
    } catch (_) {
      playTone("error");
      addFeedback({ success: false, message: t("messages.generalError") });
    }
  };

  const handleFinalize = async () => {
    if (!session || queueOrders.length === 0 || !allQueuedComplete) return;

    setSaving(true);
    try {
      const now = new Date().toISOString().slice(0, 16).replace("T", " ");
      queueOrders.forEach((order, index) => {
        const state = session.orderStates[order.code];
        updateOrder(order.code, {
          status: STATUS.PREPARED,
          preparedAt: now,
          assignedEmployee: session.employee || order.assignedEmployee || "System",
          notes: session.notes || order.notes,
          products: state.products,
        });

        pushOp({
          id: `OP-${Date.now()}-${index}`,
          operationType: "ORDER_PREPARED",
          orderCode: order.code,
          carrier: order.carrier || "-",
          employee: session.employee || "System",
          result: "SUCCESS",
          details: t("messages.savedOperation"),
          createdAt: now,
          scanLogs: state.scanLogs,
          productsSnapshot: state.products,
          orderSnapshot: {
            ...order,
            products: state.products,
          },
        });
      });

      clearPrepareSession();
      setSession(createEmptySession());
      addFeedback({ success: true, message: t("messages.savedAll") });
    } finally {
      setSaving(false);
    }
  };

  const clearSessionAndReset = () => {
    clearPrepareSession();
    setSession(createEmptySession());
    setScanInput("");
  };

  const handleRejectOrder = (reason) => {
    if (!rejectTarget) return;
    rejectOrder(rejectTarget, { reason, stage: "preparation", employee: session?.employee || "System" });
    removeOrderFromQueue(rejectTarget);
    setRejectTarget("");
  };

  if (!session) return null;

  return (
    <div className="space-y-5">
      <div className="grid gap-4 xl:grid-cols-[1fr_320px]">
        <div className="space-y-5">
          <div className="grid gap-4 md:grid-cols-3 xl:grid-cols-5">
            <StatCard label={t("stats.waitingOrders")} value={waitingCount} note={t("stats.systemWide")} />
            <StatCard label={t("stats.totalItems")} value={totalWaitingItems} tone="amber" />
            <StatCard label={t("stats.preparedItems")} value={totalPreparedItems} tone="emerald" />
            <StatCard label={t("stats.successScans")} value={session.counters.success} tone="emerald" />
            <StatCard label={t("stats.wrongScans")} value={session.counters.wrong} tone={session.counters.wrong > 0 ? "red" : "default"} />
          </div>

          <div className="rounded-[28px] border border-border main-card p-4 shadow-sm md:p-5">
            <div className="mb-4 flex items-center justify-between gap-3">
              <div>
                <h3 className="text-lg font-black text-foreground">{t("scan.title")}</h3>
                <p className="mt-1 text-sm text-muted-foreground">{activeOrder ? t("scan.activeOrderHint", { code: activeOrder.code }) : t("scan.defaultHint")}</p>
              </div>
              <button
                type="button"
                onClick={() => setPanelOpen((current) => !current)}
                className="inline-flex items-center gap-2 rounded-full bg-muted px-3 py-2 text-xs font-black text-muted-foreground xl:hidden"
              >
                {panelOpen ? <ChevronRight size={14} /> : <ChevronLeft size={14} />}
                {t("actions.queue")}
              </button>
            </div>

            <div className="grid gap-4 lg:grid-cols-[1fr_280px]">
              <div className="space-y-4">
                <div className="flex flex-col gap-3 rounded-3xl border border-border bg-background p-3 md:flex-row md:items-center">
                  <div className="flex flex-1 items-center gap-3 rounded-2xl border border-border main-card px-4 py-3 focus-within:border-primary focus-within:ring-2 focus-within:ring-primary/10">
                    <ScanLine size={18} className={cn(feedback?.success ? "text-emerald-600" : feedback?.success === false ? "text-red-600" : "text-primary")} />
                    <input
                      ref={inputRef}
                      value={scanInput}
                      onChange={(event) => setScanInput(event.target.value)}
                      onKeyDown={(event) => {
                        if (event.key === "Enter") handleScan();
                      }}
                      placeholder={activeOrder ? t("scan.scanItemsPlaceholder") : t("scan.scanOrderPlaceholder")}
                      className="h-10 flex-1 border-0 bg-transparent text-sm font-bold text-foreground outline-none placeholder:text-muted-foreground"
                    />
                  </div>

                  <div className="flex items-center gap-2">
                    <Button onClick={handleScan} className="rounded-2xl px-5 py-2 text-sm font-black">{t("actions.scan")}</Button>
                    <Button variant="outline" onClick={clearSessionAndReset} className="rounded-2xl px-4 py-2 text-sm font-black">{t("actions.clearSession")}</Button>
                  </div>
                </div>

                <AnimatePresence>
                  {feedback ? (
                    <motion.div
                      key={feedback.timestamp}
                      initial={{ opacity: 0, y: -6 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -6 }}
                      className={cn(
                        "rounded-2xl border px-4 py-3 text-sm font-bold",
                        feedback.success ? "border-emerald-200 bg-emerald-50 text-emerald-700" : "border-red-200 bg-red-50 text-red-700"
                      )}
                    >
                      <span className="flex items-center gap-2">
                        {feedback.success ? <CheckCircle2 size={16} /> : <AlertTriangle size={16} />}
                        {feedback.message}
                      </span>
                    </motion.div>
                  ) : null}
                </AnimatePresence>

                <div className="grid gap-4 md:grid-cols-2">
                  <div className="rounded-3xl border border-border bg-background p-4">
                    <label className="mb-2 flex items-center gap-2 text-xs font-black uppercase tracking-[0.2em] text-muted-foreground">
                      <User size={14} className="text-primary" />
                      {t("fields.employee")}
                    </label>
                    <Input
                      value={session.employee}
                      onChange={(event) => updateSession((current) => ({ ...current, employee: event.target.value }))}
                      className="rounded-2xl"
                      placeholder={t("fields.employeePlaceholder")}
                    />
                  </div>

                  <div className="rounded-3xl border border-border bg-background p-4">
                    <label className="mb-2 block text-xs font-black uppercase tracking-[0.2em] text-muted-foreground">{t("fields.notes")}</label>
                    <Textarea
                      value={session.notes}
                      onChange={(event) => updateSession((current) => ({ ...current, notes: event.target.value }))}
                      rows={3}
                      className="rounded-2xl"
                      placeholder={t("fields.notesPlaceholder")}
                    />
                  </div>
                </div>

                {activeOrder && activeState ? (
                  <div className="rounded-[28px] border border-border main-card p-4 shadow-sm md:p-5">
                    <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
                      <div>
                        <div className="flex items-center gap-2">
                          <h4 className="font-mono text-base font-black text-foreground">{activeOrder.code}</h4>
                          <span className="rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-black text-primary">{t("scan.currentOrder")}</span>
                        </div>
                        <p className="mt-1 text-sm text-muted-foreground">{activeOrder.customer} · {activeOrder.city} · {activeOrder.area}</p>
                      </div>

                      <div className="flex items-center gap-2">
                        <Button variant="outline" onClick={() => setRejectTarget(activeOrder.code)} className="rounded-2xl text-red-600 hover:text-red-600">{t("actions.reject")}</Button>
                      </div>
                    </div>

                    <div className="grid gap-3 md:grid-cols-2">
                      {(activeState.products || []).map((product) => (
                        <ProductScanRow key={`${activeOrder.code}-${product.sku}`} product={product} />
                      ))}
                    </div>
                  </div>
                ) : (
                  <div className="rounded-[28px] border border-dashed border-border main-card p-8 text-center">
                    <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-3xl bg-primary/8 text-primary">
                      <ScanLine size={28} />
                    </div>
                    <h4 className="mt-4 text-lg font-black text-foreground">{t("empty.title")}</h4>
                    <p className="mt-2 text-sm text-muted-foreground">{t("empty.description")}</p>
                  </div>
                )}

                {queueOrders.length > 0 ? (
                  <div className="rounded-[28px] border border-border main-card p-4 shadow-sm md:p-5">
                    <div className="mb-4 flex items-center justify-between gap-3">
                      <div>
                        <h4 className="text-base font-black text-foreground">{t("queue.title")}</h4>
                        <p className="mt-1 text-sm text-muted-foreground">{t("queue.description")}</p>
                      </div>

                      <Button onClick={handleFinalize} disabled={!allQueuedComplete || saving} className="rounded-2xl px-4 py-2 text-sm font-black disabled:opacity-50">
                        {saving ? t("actions.saving") : t("actions.saveAll")}
                      </Button>
                    </div>

                    <div className="space-y-2">
                      {queueOrders.map((order) => {
                        const state = session.orderStates?.[order.code];
                        const latestLog = state?.scanLogs?.[0];
                        return (
                          <div key={order.code} className="rounded-3xl border border-border bg-background p-4">
                            <div className="flex flex-wrap items-start justify-between gap-3">
                              <div>
                                <p className="font-mono text-sm font-black text-foreground">{order.code}</p>
                                <p className="mt-1 text-xs text-muted-foreground">{order.customer} · {getOrderItemCount(order)} {t("common.itemsWord")}</p>
                              </div>
                              <span className={cn("rounded-full px-3 py-1 text-[11px] font-black", state?.completed ? "bg-emerald-100 text-emerald-700" : "bg-muted text-muted-foreground")}>
                                {state?.completed ? t("scan.completed") : t("scan.pending")}
                              </span>
                            </div>
                            {latestLog ? (
                              <div className={cn("mt-3 rounded-2xl border px-3 py-2 text-xs font-semibold", latestLog.success ? "border-emerald-200 bg-emerald-50 text-emerald-700" : "border-red-200 bg-red-50 text-red-700")}>
                                {latestLog.message}
                              </div>
                            ) : null}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                ) : null}
              </div>

              <AnimatePresence initial={false}>
                {panelOpen ? (
                  <motion.aside
                    initial={{ opacity: 0, x: 16 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 16 }}
                    className="space-y-4 rounded-[28px] border border-border main-card p-4 shadow-sm xl:block"
                  >
                    <div className="flex items-center justify-between gap-3">
                      <div>
                        <h4 className="text-base font-black text-foreground">{t("queue.sidePanelTitle")}</h4>
                        <p className="mt-1 text-sm text-muted-foreground">{t("queue.sidePanelSubtitle", { count: queueOrders.length })}</p>
                      </div>
                      <button
                        type="button"
                        onClick={() => setPanelOpen(false)}
                        className="rounded-full bg-muted p-2 text-muted-foreground xl:hidden"
                      >
                        <ChevronRight size={16} />
                      </button>
                    </div>

                    {queueOrders.length > 0 ? (
                      <div className="space-y-3">
                        {queueOrders.map((order) => (
                          <QueueOrderCard
                            key={order.code}
                            order={order}
                            state={session.orderStates?.[order.code]}
                            active={session.activeOrderCode === order.code}
                            onActivate={(orderCode) => updateSession((current) => ({ ...current, activeOrderCode: orderCode }))}
                            onRemove={removeOrderFromQueue}
                            t={t}
                          />
                        ))}
                      </div>
                    ) : (
                      <div className="rounded-3xl border border-dashed border-border bg-background px-4 py-8 text-center">
                        <ClipboardList size={24} className="mx-auto text-muted-foreground" />
                        <p className="mt-3 text-sm font-bold text-foreground">{t("queue.emptyTitle")}</p>
                        <p className="mt-1 text-xs text-muted-foreground">{t("queue.emptyDescription")}</p>
                      </div>
                    )}
                  </motion.aside>
                ) : null}
              </AnimatePresence>
            </div>
          </div>
        </div>
      </div>

      <RejectDialog open={!!rejectTarget} onClose={() => setRejectTarget("")} orderCode={rejectTarget} onConfirm={handleRejectOrder} t={t} />
    </div>
  );
}
