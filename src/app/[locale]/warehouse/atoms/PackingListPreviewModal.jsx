"use client";

import React, { useEffect, useMemo, useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { pdf } from "@react-pdf/renderer";
import { ClipboardList, Loader2, MapPin, Printer, X } from "lucide-react";
import { toast } from "react-hot-toast";
import QRCode from "react-qr-code";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { cn } from "@/utils/cn";
import PackingListPDF from "./PackingListPDF";
import { buildPackingListData, formatPrintDate, generatePrintNumber } from "./buildPackingListData";
import { preparePackingListAssets } from "./packingListAssets";
import { avatarSrc } from "@/components/atoms/UserSelect";

function PreviewTable({ groups, t }) {
  return (
    <div className="space-y-3">
      {(groups || []).map((group) => {
        const warehouseLabel = group.warehouseName || t("packingList.unassignedWarehouse");
        return (
          <div key={group.warehouseId} className="overflow-hidden rounded-lg border border-slate-200 dark:border-slate-700">
            <div className="flex items-center gap-2 bg-slate-50 px-3 py-2 text-sm font-bold text-primary dark:bg-slate-800/60">
              <MapPin size={14} />
              {t("packingList.warehouse")}: {warehouseLabel}
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-slate-50 text-[11px] font-bold uppercase tracking-wide text-slate-500 dark:bg-slate-800">
                  <tr>
                    <th className="px-2 py-2 text-center">{t("packingList.select")}</th>
                    <th className="px-2 py-2 text-center">{t("packingList.image")}</th>
                    <th className="px-2 py-2">{t("packingList.productName")}</th>
                    <th className="px-2 py-2">{t("packingList.sku")}</th>
                    <th className="px-2 py-2">{t("packingList.storageLocation")}</th>
                    <th className="px-2 py-2 text-center">{t("packingList.quantity")}</th>
                    <th className="px-2 py-2 text-center">{t("packingList.inOrders")}</th>
                  </tr>
                </thead>
                <tbody>
                  {(group.rows || []).map((row) => (
                    <tr key={row.key} className="border-t border-slate-100 dark:border-slate-800">
                      <td className="px-2 py-2 text-center">
                        <span className="inline-block h-3.5 w-3.5 rounded-sm border-2 border-slate-400" />
                      </td>
                      <td className="px-2 py-2 text-center">
                        {row.image ? (
                          <QRCode value={avatarSrc(row.image)} size={40} />
                        ) : (
                          <span className="inline-block h-10 w-10 rounded bg-slate-100 dark:bg-slate-800" />
                        )}
                      </td>
                      <td className="px-2 py-2 font-semibold text-slate-800 dark:text-slate-100">{row.name}</td>
                      <td className="px-2 py-2 font-mono text-xs text-slate-600">{row.sku}</td>
                      <td className="px-2 py-2 text-xs text-slate-600">{row.locationName || t("packingList.unassignedLocation")}</td>
                      <td className="px-2 py-2 text-center font-bold">{row.quantity}</td>
                      <td className="px-2 py-2 text-center">{row.orderCount}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        );
      })}
    </div>
  );
}

function StatsRow({ t, summary, printNumber, printedAt, locale, showOrderCount = true }) {
  const boxes = [
    printedAt ? [t("packingList.printDate"), formatPrintDate(printedAt, locale)] : null,
    [t("packingList.productsCount"), summary.productCount],
    [t("packingList.totalQuantity"), summary.totalQuantity],
    [t("packingList.itemsCount"), summary.itemCount],
    showOrderCount ? [t("packingList.ordersCount"), summary.orderCount] : null,
    printNumber ? [t("packingList.printNumber"), printNumber] : null,
  ].filter(Boolean);
  return (
    <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-6">
      {boxes.map(([label, value]) => (
        <div key={label} className="rounded-lg border border-slate-200 bg-slate-50 px-2.5 py-2 dark:border-slate-700 dark:bg-slate-800/60">
          <p className="text-[10px] text-slate-500">{label}</p>
          <p className="text-sm font-bold text-slate-800 dark:text-slate-100">{value}</p>
        </div>
      ))}
    </div>
  );
}

export default function PackingListPreviewModal({ open, onClose, orders }) {
  const t = useTranslations("warehouse.print");
  const tCommon = useTranslations("common");
  const locale = useLocale();
  const [mode, setMode] = useState("combined");
  const [loading, setLoading] = useState(false);
  const [printMeta, setPrintMeta] = useState(() => ({
    printNumber: generatePrintNumber(),
    printedAt: new Date(),
  }));

  useEffect(() => {
    if (open) {
      setMode("combined");
      setPrintMeta({
        printNumber: generatePrintNumber(),
        printedAt: new Date(),
      });
    }
  }, [open]);

  const data = useMemo(
    () => buildPackingListData(orders, printMeta),
    [orders, printMeta],
  );

  const handlePrint = async () => {
    try {
      setLoading(true);
      const assets = await preparePackingListAssets(data, mode);
      const blob = await pdf(
        <PackingListPDF
          t={t}
          locale={locale}
          mode={mode}
          data={data}
          headerQrUrl={assets.headerQrUrl}
          qrByImageUrl={assets.qrByImageUrl}
        />,
      ).toBlob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `packing_list_${data.printNumber}.pdf`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      onClose();
    } catch (error) {
      console.error("Error generating packing list PDF:", error);
      toast.error(t("packingList.pdfFailed"));
    } finally {
      setLoading(false);
    }
  };

  if (!open || !orders?.length) return null;

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="!max-w-5xl rounded-2xl max-h-[95vh] flex flex-col p-0 shadow-2xl border-0 overflow-hidden">
        <div
          className="relative shrink-0 px-6 pb-5 pt-6"
          style={{ background: "linear-gradient(135deg, var(--primary) 0%, var(--secondary) 100%)" }}
        >
          <div className="relative flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-white/20">
                <ClipboardList className="text-white" size={22} />
              </div>
              <div>
                <p className="mb-0.5 text-xs font-medium text-white/70">{t("packingList.previewSubtitle")}</p>
                <h2 className="text-xl font-bold text-white">{t("packingList.previewTitle")}</h2>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <div className="flex flex-col gap-1">
                <p className="text-[10px] font-bold uppercase tracking-wider text-white/60">{t("packingList.mode")}</p>
                <Select value={mode} onValueChange={setMode}>
                  <SelectTrigger className="h-9 w-[260px] rounded-lg border-white/20 bg-white/10 text-white backdrop-blur-md">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="combined">{t("packingList.modeCombined")}</SelectItem>
                    <SelectItem value="perOrder">{t("packingList.modePerOrder")}</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <button
                onClick={onClose}
                className="flex h-8 w-8 items-center justify-center rounded-lg bg-white/20 hover:bg-white/30"
              >
                <X size={16} className="text-white" />
              </button>
            </div>
          </div>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto bg-slate-50 p-5 dark:bg-slate-900/50">
          {mode === "combined" ? (
            <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-700 dark:bg-slate-800">
              <div className="mb-4 flex items-center justify-between border-b border-slate-100 pb-4 dark:border-slate-700">
                <div>
                  <h3 className="text-xl font-bold text-slate-800 dark:text-white">{t("packingList.title")}</h3>
                  <p className="text-xs font-bold tracking-widest text-[var(--primary)]">{t("packingList.subtitle")}</p>
                </div>
              </div>
              <StatsRow t={t} summary={data.summary} printNumber={data.printNumber} printedAt={data.printedAt} locale={locale} />
              <div className="mt-4">
                <p className="mb-2 text-xs font-bold text-slate-500">{t("packingList.includedOrders")}</p>
                <div className="flex flex-wrap gap-1.5">
                  {data.orderNumbers.map((n) => (
                    <span key={n} className="rounded-md bg-violet-50 px-2 py-0.5 font-mono text-xs font-bold text-[var(--primary)] dark:bg-violet-950/40">
                      {n}
                    </span>
                  ))}
                </div>
              </div>
              <div className="mt-4">
                <PreviewTable groups={data.groups} t={t} />
              </div>
              <div className="mt-4 rounded-lg border border-slate-200 bg-slate-50 p-3 dark:border-slate-700 dark:bg-slate-900/40">
                <p className="text-xs font-bold text-slate-700 dark:text-slate-200">{t("packingList.warehouseNotes")}</p>
                <p className="text-xs text-slate-500">{t("packingList.notesText")}</p>
              </div>
              <p className="mt-6 border-t border-slate-200 pt-6 text-xs text-slate-500 dark:border-slate-700">
                {t("packingList.preparerSignature")}
              </p>
            </div>
          ) : (
            <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-700 dark:bg-slate-800">
              <div className="mb-4 flex items-center justify-between border-b border-slate-100 pb-4 dark:border-slate-700">
                <div>
                  <h3 className="text-xl font-bold text-slate-800 dark:text-white">{t("packingList.title")}</h3>
                  <p className="text-xs font-bold tracking-widest text-[var(--primary)]">{t("packingList.subtitle")}</p>
                </div>
              </div>
              <StatsRow t={t} summary={data.summary} printNumber={data.printNumber} printedAt={data.printedAt} locale={locale} />
              <div className="mt-4">
                <p className="mb-2 text-xs font-bold text-slate-500">{t("packingList.includedOrders")}</p>
                <div className="flex flex-wrap gap-1.5">
                  {data.orderNumbers.map((n) => (
                    <span key={n} className="rounded-md bg-violet-50 px-2 py-0.5 font-mono text-xs font-bold text-[var(--primary)] dark:bg-violet-950/40">
                      {n}
                    </span>
                  ))}
                </div>
              </div>
              <div className="mt-4">
                {data.perOrder.map((block) => (
                  <div key={block.order?.orderNumber}>
                    <div className="my-5 flex items-center gap-3">
                      <div className="h-px flex-1 bg-slate-200 dark:bg-slate-700" />
                      <p className="shrink-0 font-mono text-sm font-bold text-[var(--primary)]">
                        {t("packingList.orderTitle", { orderNumber: block.order?.orderNumber })}
                      </p>
                      <div className="h-px flex-1 bg-slate-200 dark:bg-slate-700" />
                    </div>
                    <div className="grid grid-cols-3 gap-2">
                      <div className="rounded-lg bg-slate-50 p-2.5 dark:bg-slate-900/40">
                        <p className="text-[10px] text-slate-400">{t("fields.orderCode")}</p>
                        <p className="font-mono text-xs font-bold text-[var(--primary)]">{block.order?.orderNumber}</p>
                      </div>
                      <div className="rounded-lg bg-slate-50 p-2.5 dark:bg-slate-900/40">
                        <p className="text-[10px] text-slate-400">{t("fields.customer")}</p>
                        <p className="text-xs font-semibold">{block.order?.customerName}</p>
                      </div>
                      <div className="rounded-lg bg-slate-50 p-2.5 dark:bg-slate-900/40">
                        <p className="text-[10px] text-slate-400">{t("fields.phone")}</p>
                        <p className="font-mono text-xs" dir="ltr">{block.order?.phoneNumber}</p>
                      </div>
                    </div>
                    <div className="mt-3">
                      <StatsRow t={t} summary={block.summary} locale={locale} showOrderCount={false} />
                    </div>
                    <div className="mt-4">
                      <PreviewTable groups={block.groups} t={t} />
                    </div>
                  </div>
                ))}
              </div>
              <div className="mt-4 rounded-lg border border-slate-200 bg-slate-50 p-3 dark:border-slate-700 dark:bg-slate-900/40">
                <p className="text-xs font-bold text-slate-700 dark:text-slate-200">{t("packingList.warehouseNotes")}</p>
                <p className="text-xs text-slate-500">{t("packingList.notesText")}</p>
              </div>
              <p className="mt-6 border-t border-slate-200 pt-6 text-xs text-slate-500 dark:border-slate-700">
                {t("packingList.preparerSignature")}
              </p>
            </div>
          )}
        </div>

        <div className="flex shrink-0 justify-end gap-2 border-t border-slate-100 bg-white p-5 dark:border-slate-800 dark:bg-slate-950">
          <Button variant="outline" onClick={onClose} className="h-11 rounded-xl px-6">{tCommon("cancel")}</Button>
          <Button
            onClick={handlePrint}
            disabled={loading}
            className={cn("h-11 rounded-xl px-8 font-bold text-white shadow-lg shadow-primary/20")}
            style={{ background: "linear-gradient(135deg, var(--primary) 0%, var(--secondary) 100%)" }}
          >
            {loading ? <Loader2 size={18} className="mr-2 animate-spin" /> : <Printer size={18} className="mr-2" />}
            {t("packingList.printNow", { count: orders.length })}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
