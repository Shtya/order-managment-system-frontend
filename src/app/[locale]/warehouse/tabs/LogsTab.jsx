"use client";

import React, { useMemo, useState } from "react";
import { motion } from "framer-motion";
import {
  ClipboardList, CheckCircle2, XCircle, Package, FileDown,
  Eye, AlertCircle, FileText, PenLine, Download, FileX,
} from "lucide-react";
import { useTranslations } from "next-intl";
import { cn } from "@/utils/cn";
import Table, { FilterField } from "@/components/atoms/Table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import PageHeader from "../../../../components/atoms/Pageheader";

const OPERATION_TYPE_KEYS = {
  ORDER_PREPARED: "opTypes.orderPrepared",
  REJECT_ORDER:   "opTypes.rejectOrder",
  ASSIGN_CARRIER: "opTypes.assignCarrier",
  PRINT_LABEL:    "opTypes.printLabel",
  SHIP_ORDER:     "opTypes.shipOrder",
  RETURN_ORDER:   "opTypes.returnOrder",
  RETRY_ORDER:    "opTypes.retryOrder",
  BULK_REJECT:    "opTypes.bulkReject",
  REPRINT_LABEL:  "opTypes.reprintLabel",
};

// ─────────────────────────────────────────────────────────────────────────────
// PDF GENERATORS
// ─────────────────────────────────────────────────────────────────────────────
function openPrintWindow(htmlContent) {
  const win = window.open("", "_blank", "width=900,height=700");
  if (!win) { alert("يرجى السماح بالنوافذ المنبثقة لتتمكن من تحميل الـ PDF"); return; }
  win.document.write(htmlContent);
  win.document.close();
  win.focus();
  setTimeout(() => { win.print(); }, 600);
}

const PDF_STYLE = `
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body { font-family: 'Segoe UI', Tahoma, sans-serif; direction: rtl; color: #1e293b; background: #fff; padding: 28px 32px; }
    h1 { font-size: 20px; font-weight: 700; margin-bottom: 4px; }
    h2 { font-size: 15px; font-weight: 700; margin: 20px 0 8px; color: #334155; }
    .subtitle { font-size: 12px; color: #64748b; margin-bottom: 20px; }
    .badge { display: inline-block; padding: 2px 10px; border-radius: 99px; font-size: 11px; font-weight: 600; }
    .badge-ok { background:#dcfce7; color:#16a34a; border:1px solid #bbf7d0; }
    .badge-err { background:#fee2e2; color:#dc2626; border:1px solid #fecaca; }
    .info-grid { display:grid; grid-template-columns:1fr 1fr; gap:10px; margin-bottom:18px; }
    .info-card { background:#f8fafc; border:1px solid #e2e8f0; border-radius:10px; padding:10px 14px; }
    .info-label { font-size:10px; color:#94a3b8; text-transform:uppercase; margin-bottom:3px; letter-spacing:.05em; }
    .info-value { font-size:13px; font-weight:600; }
    table { width:100%; border-collapse:collapse; font-size:13px; }
    thead { background:#f1f5f9; }
    th { text-align:right; padding:9px 12px; font-weight:600; color:#475569; border-bottom:2px solid #e2e8f0; }
    td { padding:8px 12px; border-bottom:1px solid #f1f5f9; }
    tr:last-child td { border-bottom:none; }
    .complete { color:#16a34a; font-weight:600; }
    .incomplete { color:#d97706; font-weight:600; }
    .err-row { background:#fff7f7; }
    .err-msg { font-weight:600; color:#dc2626; }
    .err-reason { font-size:11px; color:#94a3b8; }
    .sig-box { margin-top:32px; border:2px dashed #cbd5e1; border-radius:12px; padding:22px; }
    .sig-title { font-size:13px; font-weight:700; margin-bottom:14px; color:#334155; }
    .sig-row { display:flex; gap:20px; margin-top:10px; }
    .sig-field { flex:1; border-bottom:1px solid #94a3b8; padding-bottom:6px; }
    .sig-field-label { font-size:11px; color:#94a3b8; margin-bottom:28px; }
    .header-bar { background:linear-gradient(135deg,#ff8b00,#ff5c2b); color:#fff; padding:16px 20px; border-radius:12px; margin-bottom:20px; }
    .header-bar.err-bar { background:linear-gradient(135deg,#dc2626,#b91c1c); }
    .header-bar.info-bar { background:linear-gradient(135deg,#3b82f6,#6366f1); }
    .ts { font-size:11px; color:#94a3b8; font-family:monospace; }
    @media print { body { padding:16px; } button { display:none; } }
  </style>
`;

function buildCorrectPDF(prepOps) {
  const now = new Date().toLocaleString("ar-EG");
  const ordersHTML = prepOps.map((op) => {
    const order = op.orderSnapshot || {};
    const products = op.productsSnapshot || [];
    const correctLogs = (op.scanLogs || []).filter((l) => l.success);
    const productsRows = products.map((p) => {
      const done = p.scannedQty >= p.requestedQty;
      return `<tr><td><code>${p.sku}</code></td><td>${p.name}</td><td style="text-align:center">${p.requestedQty}</td><td style="text-align:center" class="${done ? "complete" : "incomplete"}">${p.scannedQty}</td><td><span class="badge ${done ? "badge-ok" : "badge-err"}">${done ? "مكتمل" : "ناقص"}</span></td></tr>`;
    }).join("");
    return `<div style="margin-bottom:28px;border:1px solid #e2e8f0;border-radius:12px;overflow:hidden;"><div style="background:#f8fafc;padding:12px 16px;border-bottom:1px solid #e2e8f0;display:flex;justify-content:space-between;align-items:center;"><div><div style="font-size:15px;font-weight:700;font-family:monospace;">${op.orderCode}</div><div style="font-size:12px;color:#64748b;margin-top:2px;">${order.customer || ""} — ${order.city || ""}</div></div><div style="text-align:left;"><div style="font-size:11px;color:#94a3b8;">شركة الشحن</div><div style="font-size:13px;font-weight:600;">${op.carrier || "—"}</div></div></div><div style="padding:14px 16px;"><table><thead><tr><th>SKU</th><th>اسم المنتج</th><th style="text-align:center">المطلوب</th><th style="text-align:center">الممسوح</th><th>الحالة</th></tr></thead><tbody>${productsRows}</tbody></table><div style="margin-top:10px;font-size:11px;color:#94a3b8;">عمليات المسح الصحيحة: <strong>${correctLogs.length}</strong></div></div></div>`;
  }).join("");
  return `<!DOCTYPE html><html lang="ar" dir="rtl"><head><meta charset="UTF-8"><title>ملف التحضير</title>${PDF_STYLE}</head><body><div class="header-bar"><div style="font-size:18px;font-weight:700;margin-bottom:4px;">✓ ملف التحضير — المسح الصحيح</div><div style="font-size:12px;opacity:.85;">تاريخ الطباعة: ${now} | عدد الطلبات: ${prepOps.length}</div></div>${ordersHTML}<div class="sig-box"><div class="sig-title">✍ تأكيد الاستلام — موظف شركة الشحن</div><p style="font-size:12px;color:#64748b;margin-bottom:12px;">أقر أنا الموظف المذكور أدناه بأنني استلمت الطلبات المُحضَّرة المدرجة في هذا الملف كاملةً وبدون نقصان.</p><div class="sig-row"><div class="sig-field"><div class="sig-field-label">اسم موظف شركة الشحن</div></div><div class="sig-field"><div class="sig-field-label">التوقيع</div></div><div class="sig-field"><div class="sig-field-label">التاريخ</div></div></div></div></body></html>`;
}

function buildErrorsPDF(prepOps) {
  const now = new Date().toLocaleString("ar-EG");
  const hasErrors = prepOps.some((op) => (op.scanLogs || []).some((l) => !l.success));
  if (!hasErrors) return null;
  const ordersHTML = prepOps.map((op) => {
    const errorLogs = (op.scanLogs || []).filter((l) => !l.success);
    if (errorLogs.length === 0) return "";
    const rows = errorLogs.map((log, i) => `<tr class="err-row"><td>${i + 1}</td><td class="err-msg">${log.message}</td><td class="err-reason">${log.reason || "—"}</td><td class="ts">${log.timestamp ? log.timestamp.slice(11, 19) : "—"}</td></tr>`).join("");
    return `<div style="margin-bottom:24px;border:1px solid #fecaca;border-radius:12px;overflow:hidden;"><div style="background:#fff7f7;padding:10px 16px;border-bottom:1px solid #fecaca;display:flex;justify-content:space-between;align-items:center;"><div style="font-family:monospace;font-size:14px;font-weight:700;color:#dc2626;">${op.orderCode}</div><span class="badge badge-err">${errorLogs.length} خطأ</span></div><div style="padding:12px 16px;"><table><thead><tr><th style="width:36px">#</th><th>الخطأ</th><th>السبب</th><th>الوقت</th></tr></thead><tbody>${rows}</tbody></table></div></div>`;
  }).join("");
  return `<!DOCTYPE html><html lang="ar" dir="rtl"><head><meta charset="UTF-8"><title>ملف الأخطاء</title>${PDF_STYLE}</head><body><div class="header-bar err-bar"><div style="font-size:18px;font-weight:700;margin-bottom:4px;">⚠ ملف التحضير — أخطاء المسح</div><div style="font-size:12px;opacity:.85;">تاريخ الطباعة: ${now} | عدد الطلبات: ${prepOps.length}</div></div><p style="font-size:13px;color:#64748b;margin-bottom:20px;">يوضح هذا الملف جميع عمليات المسح الخاطئة التي حدثت أثناء تحضير الطلبات، مرتبةً حسب الطلب والوقت.</p>${ordersHTML}</body></html>`;
}

/** Generic operation info PDF for non-prep ops */
function buildGenericOpPDF(op, order) {
  const now = new Date().toLocaleString("ar-EG");
  const opTypeLabel = {
    REJECT_ORDER: "رفض طلب", ASSIGN_CARRIER: "تعيين شركة شحن",
    PRINT_LABEL: "طباعة ملصق", SHIP_ORDER: "شحن طلب",
    RETURN_ORDER: "استلام مرتجع", RETRY_ORDER: "إعادة محاولة",
    BULK_REJECT: "رفض جماعي", REPRINT_LABEL: "إعادة طباعة ملصق",
  }[op.operationType] || op.operationType;
  const resultColor = op.result === "SUCCESS" ? "#16a34a" : "#dc2626";
  const resultLabel = op.result === "SUCCESS" ? "ناجح" : "فاشل";
  return `<!DOCTYPE html><html lang="ar" dir="rtl"><head><meta charset="UTF-8"><title>سجل العملية ${op.id}</title>${PDF_STYLE}</head><body><div class="header-bar info-bar"><div style="font-size:18px;font-weight:700;margin-bottom:4px;">📋 سجل العملية — ${opTypeLabel}</div><div style="font-size:12px;opacity:.85;">تاريخ الطباعة: ${now} | رقم العملية: ${op.id}</div></div><div class="info-grid"><div class="info-card"><div class="info-label">رقم العملية</div><div class="info-value" style="font-family:monospace">${op.id}</div></div><div class="info-card"><div class="info-label">نوع العملية</div><div class="info-value">${opTypeLabel}</div></div><div class="info-card"><div class="info-label">رقم الطلب</div><div class="info-value" style="font-family:monospace">${op.orderCode || "—"}</div></div><div class="info-card"><div class="info-label">شركة الشحن</div><div class="info-value">${op.carrier || "—"}</div></div><div class="info-card"><div class="info-label">الموظف</div><div class="info-value">${op.employee || "—"}</div></div><div class="info-card"><div class="info-label">النتيجة</div><div class="info-value" style="color:${resultColor}">${resultLabel}</div></div><div class="info-card"><div class="info-label">التاريخ والوقت</div><div class="info-value" style="font-family:monospace;font-size:12px">${op.createdAt || "—"}</div></div><div class="info-card"><div class="info-label">التفاصيل</div><div class="info-value">${op.details || "—"}</div></div></div>${order ? `<h2>بيانات الطلب</h2><div class="info-grid"><div class="info-card"><div class="info-label">العميل</div><div class="info-value">${order.customer || "—"}</div></div><div class="info-card"><div class="info-label">المدينة</div><div class="info-value">${order.city || "—"}</div></div><div class="info-card"><div class="info-label">الإجمالي</div><div class="info-value">${order.total ? order.total + " ر.س" : "—"}</div></div><div class="info-card"><div class="info-label">الحالة</div><div class="info-value">${order.status || "—"}</div></div></div>` : ""}</body></html>`;
}

// ─────────────────────────────────────────────────────────────────────────────
// GENERIC OP MODAL — for non-prep operations
// ─────────────────────────────────────────────────────────────────────────────
function GenericOpModal({ open, onClose, op, orders }) {
  if (!op) return null;
  const order = orders?.find(o => o.code === op.orderCode);
  const opTypeLabel = {
    REJECT_ORDER: "رفض طلب", ASSIGN_CARRIER: "تعيين شركة شحن",
    PRINT_LABEL: "طباعة ملصق", SHIP_ORDER: "شحن طلب",
    RETURN_ORDER: "استلام مرتجع", RETRY_ORDER: "إعادة محاولة",
    BULK_REJECT: "رفض جماعي", REPRINT_LABEL: "إعادة طباعة ملصق",
  }[op.operationType] || op.operationType;

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="!max-w-lg bg-white dark:bg-slate-900 rounded-2xl" dir="rtl">
        <DialogHeader className="border-b border-slate-200 dark:border-slate-700 pb-4">
          <DialogTitle className="text-lg font-bold flex items-center gap-2">
            <ClipboardList className="text-[#ff8b00]" size={20} />
            سجل العملية — {op.id}
          </DialogTitle>
        </DialogHeader>

        <div className="pt-4 space-y-4">
          {/* Op details grid */}
          <div className="grid grid-cols-2 gap-3">
            {[
              { label: "نوع العملية", value: opTypeLabel },
              { label: "رقم الطلب",   value: op.orderCode || "—" },
              { label: "شركة الشحن",  value: op.carrier   || "—" },
              { label: "الموظف",      value: op.employee  || "—" },
              { label: "التاريخ",     value: op.createdAt || "—" },
              { label: "التفاصيل",    value: op.details   || "—" },
            ].map(({ label, value }) => (
              <div key={label} className="bg-slate-50 dark:bg-slate-800 rounded-xl p-3">
                <p className="text-xs text-slate-400 mb-1">{label}</p>
                <p className="font-semibold text-sm truncate">{value}</p>
              </div>
            ))}
          </div>

          {/* Result badge */}
          <div className="flex items-center gap-2 px-4 py-3 rounded-xl border bg-slate-50 dark:bg-slate-800">
            <span className="text-sm font-medium text-slate-500">النتيجة:</span>
            <Badge className={cn("rounded-full text-xs border",
              op.result === "SUCCESS"
                ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                : "bg-red-50 text-red-700 border-red-200")}>
              {op.result === "SUCCESS" ? "ناجح" : "فاشل"}
            </Badge>
          </div>

          {/* Order info if found */}
          {order && (
            <div>
              <h4 className="text-sm font-bold mb-2 text-slate-600">بيانات الطلب</h4>
              <div className="grid grid-cols-2 gap-2">
                {[
                  { label: "العميل", value: order.customer },
                  { label: "المدينة", value: order.city },
                  { label: "الإجمالي", value: order.total ? `${order.total} ر.س` : "—" },
                  { label: "الحالة", value: order.status },
                ].map(({ label, value }) => (
                  <div key={label} className="bg-slate-50 dark:bg-slate-800 rounded-xl p-3">
                    <p className="text-xs text-slate-400 mb-1">{label}</p>
                    <p className="font-semibold text-sm">{value || "—"}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Download PDF */}
          <button
            onClick={() => openPrintWindow(buildGenericOpPDF(op, order))}
            className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl border-2 border-blue-200 bg-blue-50 dark:bg-blue-950/20 text-blue-700 font-semibold text-sm hover:bg-blue-100 transition-colors"
          >
            <Download className="w-4 h-4" />
            تحميل PDF سجل العملية
          </button>

          <div className="flex justify-end">
            <Button variant="outline" onClick={onClose}>إغلاق</Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// ORDER LOG MODAL — for ORDER_PREPARED ops
// ─────────────────────────────────────────────────────────────────────────────
function OrderLogModal({ open, onClose, op, opsLogs, t }) {
  const [signerName, setSignerName] = useState("");
  const [signed, setSigned]         = useState(false);

  if (!op) return null;

  const products    = op.productsSnapshot || [];
  const correctLogs = (op.scanLogs || []).filter((l) => l.success);
  const errorLogs   = (op.scanLogs || []).filter((l) => !l.success);
  const order       = op.orderSnapshot || {};

  const handleSign  = () => { if (signerName.trim()) setSigned(true); };
  const handleClose = () => { setSigned(false); setSignerName(""); onClose(); };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="!max-w-2xl bg-white dark:bg-slate-900 rounded-2xl max-h-[90vh] overflow-y-auto" dir="rtl">
        <DialogHeader className="border-b border-slate-200 dark:border-slate-700 pb-4">
          <DialogTitle className="text-lg font-bold flex items-center gap-2">
            <FileText className="text-[#ff8b00]" size={22} />
            ملف الطلب — {op.orderCode}
          </DialogTitle>
        </DialogHeader>

        <div className="pt-3 space-y-5">
          {/* Order info */}
          <div className="grid grid-cols-2 gap-3">
            {[
              { label: "العميل",       value: order.customer || "—" },
              { label: "المدينة",      value: order.city     || "—" },
              { label: "شركة الشحن",  value: op.carrier     || "غير محدد" },
              { label: "وقت التحضير", value: op.createdAt   || "—" },
            ].map(({ label, value }) => (
              <div key={label} className="bg-slate-50 dark:bg-slate-800 rounded-xl p-3">
                <p className="text-xs text-slate-400 mb-1">{label}</p>
                <p className="font-semibold text-sm">{value}</p>
              </div>
            ))}
          </div>

          {/* PDF download buttons */}
          <div className="grid grid-cols-2 gap-3">
            <button onClick={() => openPrintWindow(buildCorrectPDF([op]))}
              className="flex items-center justify-center gap-2 px-4 py-3 rounded-xl border-2 border-emerald-300 bg-emerald-50 dark:bg-emerald-950/20 text-emerald-700 font-semibold text-sm hover:bg-emerald-100 transition-colors">
              <Download className="w-4 h-4" />
              PDF المسح الصحيح
            </button>
            <button onClick={() => { const html = buildErrorsPDF([op]); if (!html) { alert("لا توجد أخطاء في هذا الطلب"); return; } openPrintWindow(html); }}
              className="flex items-center justify-center gap-2 px-4 py-3 rounded-xl border-2 border-red-300 bg-red-50 dark:bg-red-950/20 text-red-700 font-semibold text-sm hover:bg-red-100 transition-colors">
              <FileX className="w-4 h-4" />
              PDF أخطاء المسح ({errorLogs.length})
            </button>
          </div>

          {/* Products table */}
          {products.length > 0 && (
            <div>
              <h4 className="text-sm font-bold mb-3 flex items-center gap-2">
                <Package className="w-4 h-4 text-[#ff8b00]" /> المنتجات
              </h4>
              <div className="rounded-xl border border-slate-200 dark:border-slate-700 overflow-hidden">
                <table className="w-full text-sm">
                  <thead className="bg-slate-50 dark:bg-slate-800">
                    <tr>
                      {["SKU", "الاسم", "المطلوب", "الممسوح", "الحالة"].map((h) => (
                        <th key={h} className="text-right px-4 py-3 text-xs font-semibold text-slate-500 uppercase">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                    {products.map((p, i) => {
                      const done = (p.scannedQty || 0) >= p.requestedQty;
                      return (
                        <tr key={i} className="bg-white dark:bg-slate-900">
                          <td className="px-4 py-3 font-mono text-xs">{p.sku}</td>
                          <td className="px-4 py-3">{p.name}</td>
                          <td className="px-4 py-3 text-center font-mono">{p.requestedQty}</td>
                          <td className="px-4 py-3 text-center font-mono">{p.scannedQty || 0}</td>
                          <td className="px-4 py-3">
                            <Badge className={cn("rounded-full text-xs border",
                              done ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                                   : "bg-amber-50 text-amber-700 border-amber-200")}>
                              {done ? "مكتمل" : "ناقص"}
                            </Badge>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Scan errors */}
          {errorLogs.length > 0 && (
            <div>
              <h4 className="text-sm font-bold mb-3 flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-red-500" />
                أخطاء المسح ({errorLogs.length})
              </h4>
              <div className="space-y-2 max-h-40 overflow-y-auto">
                {errorLogs.map((err, i) => (
                  <div key={i} className="flex items-start gap-3 p-3 rounded-xl bg-red-50 dark:bg-red-950/20 border border-red-200">
                    <XCircle className="w-4 h-4 text-red-500 shrink-0 mt-0.5" />
                    <div>
                      <p className="text-xs font-semibold text-red-700 dark:text-red-300">{err.message}</p>
                      {err.reason && <p className="text-xs text-slate-500 mt-0.5">{err.reason}</p>}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Correct scans */}
          {correctLogs.length > 0 && (
            <div>
              <h4 className="text-sm font-bold mb-3 flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                عمليات المسح الصحيحة ({correctLogs.length})
              </h4>
              <div className="space-y-1.5 max-h-40 overflow-y-auto">
                {correctLogs.map((log, i) => (
                  <div key={i} className="flex items-start gap-2 px-3 py-2 rounded-lg bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-200 text-xs">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 mt-0.5 shrink-0" />
                    <p className="font-medium text-emerald-800 dark:text-emerald-200">{log.message}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Signature */}
          <div className="border-2 border-dashed border-slate-300 dark:border-slate-600 rounded-xl p-5 space-y-4">
            <h4 className="text-sm font-bold flex items-center gap-2">
              <PenLine className="w-4 h-4 text-[#ff8b00]" /> تأكيد الاستلام — موظف شركة الشحن
            </h4>
            {signed ? (
              <div className="bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-200 rounded-xl p-4 text-center">
                <CheckCircle2 className="w-8 h-8 text-emerald-600 mx-auto mb-2" />
                <p className="font-semibold text-emerald-800 dark:text-emerald-200">تم التوقيع بواسطة: {signerName}</p>
                <p className="text-xs text-slate-500 mt-1">{new Date().toLocaleString("ar-SA")}</p>
              </div>
            ) : (
              <>
                <p className="text-xs text-slate-500">أقر بأنني استلمت الطلبات المُحضَّرة المدرجة في هذا الملف كاملةً وبدون نقصان.</p>
                <div className="space-y-2">
                  <label className="text-xs font-medium text-slate-600 dark:text-slate-400">اسم الموظف</label>
                  <Input value={signerName} onChange={(e) => setSignerName(e.target.value)} placeholder="اسم موظف شركة الشحن" className="h-10 rounded-xl" />
                </div>
                <Button onClick={handleSign} disabled={!signerName.trim()}
                  className="w-full bg-[#ff8b00] hover:bg-[#e07a00] text-white gap-2">
                  <PenLine size={16} /> تأكيد التوقيع
                </Button>
              </>
            )}
          </div>

          <div className="flex justify-end">
            <Button variant="outline" onClick={handleClose}>إغلاق</Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// PREP SESSION MODAL
// ─────────────────────────────────────────────────────────────────────────────
function PrepSessionModal({ open, onClose, sessionOps }) {
  if (!sessionOps || sessionOps.length === 0) return null;

  const totalErrors  = sessionOps.reduce((s, op) => s + (op.scanLogs || []).filter((l) => !l.success).length, 0);
  const totalCorrect = sessionOps.reduce((s, op) => s + (op.scanLogs || []).filter((l) => l.success).length, 0);

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="!max-w-xl bg-white dark:bg-slate-900 rounded-2xl" dir="rtl">
        <DialogHeader className="border-b border-slate-200 dark:border-slate-700 pb-4">
          <DialogTitle className="text-lg font-bold flex items-center gap-2">
            <ClipboardList className="text-[#ff8b00]" size={20} />
            ملفات جلسة التحضير
          </DialogTitle>
        </DialogHeader>
        <div className="pt-4 space-y-5">
          {/* Stats */}
          <div className="grid grid-cols-3 gap-3">
            <div className="bg-slate-50 dark:bg-slate-800 rounded-xl p-3 text-center">
              <p className="text-2xl font-bold">{sessionOps.length}</p>
              <p className="text-xs text-slate-500 mt-1">طلب محضَّر</p>
            </div>
            <div className="bg-emerald-50 dark:bg-emerald-950/20 rounded-xl p-3 text-center border border-emerald-200">
              <p className="text-2xl font-bold text-emerald-700">{totalCorrect}</p>
              <p className="text-xs text-emerald-600 mt-1">مسح صحيح</p>
            </div>
            <div className="bg-red-50 dark:bg-red-950/20 rounded-xl p-3 text-center border border-red-200">
              <p className="text-2xl font-bold text-red-600">{totalErrors}</p>
              <p className="text-xs text-red-500 mt-1">مسح خاطئ</p>
            </div>
          </div>

          {/* Orders list */}
          <div className="space-y-2 max-h-48 overflow-y-auto">
            {sessionOps.map((op) => {
              const errs  = (op.scanLogs || []).filter((l) => !l.success).length;
              const prods = op.productsSnapshot || [];
              const done  = prods.every((p) => (p.scannedQty || 0) >= p.requestedQty);
              return (
                <div key={op.orderCode}
                  className="flex items-center justify-between px-4 py-3 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
                  <div className="flex items-center gap-2">
                    {done ? <CheckCircle2 className="w-4 h-4 text-emerald-600" /> : <AlertCircle className="w-4 h-4 text-amber-500" />}
                    <span className="font-mono font-bold text-sm">{op.orderCode}</span>
                    <span className="text-xs text-slate-400">{op.carrier}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    {errs > 0 && (
                      <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-red-100 text-red-700 border border-red-200">{errs} خطأ</span>
                    )}
                    <Badge className={cn("rounded-full text-xs border",
                      done ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                           : "bg-amber-50 text-amber-700 border-amber-200")}>
                      {done ? "مكتمل" : "ناقص"}
                    </Badge>
                  </div>
                </div>
              );
            })}
          </div>

          {/* PDF buttons */}
          <div className="grid grid-cols-1 gap-3">
            <button onClick={() => openPrintWindow(buildCorrectPDF(sessionOps))}
              className="flex items-center justify-center gap-3 px-5 py-4 rounded-xl border-2 border-emerald-300 bg-emerald-50 dark:bg-emerald-950/20 text-emerald-700 font-semibold hover:bg-emerald-100 transition-colors">
              <Download className="w-5 h-5" />
              <div className="text-right">
                <p className="font-bold text-sm">PDF المسح الصحيح</p>
                <p className="text-xs font-normal opacity-75">جميع الطلبات والمنتجات + نموذج التوقيع</p>
              </div>
            </button>
            <button onClick={() => { const html = buildErrorsPDF(sessionOps); if (!html) { alert("لا توجد أخطاء في هذه الجلسة"); return; } openPrintWindow(html); }}
              disabled={totalErrors === 0}
              className="flex items-center justify-center gap-3 px-5 py-4 rounded-xl border-2 border-red-300 bg-red-50 dark:bg-red-950/20 text-red-700 font-semibold hover:bg-red-100 transition-colors disabled:opacity-40 disabled:cursor-not-allowed">
              <FileX className="w-5 h-5" />
              <div className="text-right">
                <p className="font-bold text-sm">PDF أخطاء المسح ({totalErrors})</p>
                <p className="text-xs font-normal opacity-75">جميع الأكواد الخاطئة وأسباب الرفض</p>
              </div>
            </button>
          </div>

          <div className="flex justify-end">
            <Button variant="outline" onClick={onClose}>إغلاق</Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// MAIN LOGS TAB
// ─────────────────────────────────────────────────────────────────────────────
export function LogsTab({ opsLogs, orders = [] }) {
  const t = useTranslations("warehouse.logs");

  const [search,         setSearch]         = useState("");
  const [filterOpType,   setFilterOpType]   = useState("all");
  const [filterResult,   setFilterResult]   = useState("all");
  const [filterCarrier,  setFilterCarrier]  = useState("all");
  const [page,           setPage]           = useState({ current_page: 1, per_page: 12 });

  const [orderLogModal,  setOrderLogModal]  = useState(null); // prep op
  const [genericOpModal, setGenericOpModal] = useState(null); // non-prep op
  const [sessionModal,   setSessionModal]   = useState(null); // batch

  // Derive unique carriers from logs
  const allCarriers = useMemo(() => {
    const set = new Set(opsLogs.map(l => l.carrier).filter(Boolean));
    return [...set].sort();
  }, [opsLogs]);

  const hasActiveFilters = filterOpType !== "all" || filterResult !== "all" || filterCarrier !== "all";

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return opsLogs.filter((l) => {
      if (filterOpType  !== "all" && l.operationType !== filterOpType)  return false;
      if (filterResult  !== "all" && l.result        !== filterResult)  return false;
      if (filterCarrier !== "all" && l.carrier       !== filterCarrier) return false;
      if (q && !([l.id, l.orderCode, l.carrier, l.employee, l.details].some((x) => String(x || "").toLowerCase().includes(q)))) return false;
      return true;
    });
  }, [opsLogs, search, filterOpType, filterResult, filterCarrier]);

  const successCount = opsLogs.filter((l) => l.result === "SUCCESS").length;
  const failCount    = opsLogs.filter((l) => l.result === "FAILED").length;
  const rate         = opsLogs.length > 0 ? Math.round((successCount / opsLogs.length) * 100) : 0;

  const stats = [
    { id: "total-ops", name: t("stats.totalOps"),    value: opsLogs.length, icon: ClipboardList, color: "#64748b", sortOrder: 0 },
    { id: "success",   name: t("stats.success"),      value: successCount,   icon: CheckCircle2,  color: "#10b981", sortOrder: 1 },
    { id: "failed",    name: t("stats.failed"),        value: failCount,      icon: XCircle,       color: "#ef4444", sortOrder: 2 },
    { id: "rate",      name: t("stats.successRate"),  value: `${rate}%`,     icon: Package,       color: "#a855f7", sortOrder: 3 },
  ];

  const prepGroups = useMemo(() => {
    const prepared = opsLogs.filter((l) => l.operationType === "ORDER_PREPARED" && l.scanLogs);
    const groups = {};
    prepared.forEach((op) => {
      const key = op.createdAt || op.id;
      if (!groups[key]) groups[key] = [];
      groups[key].push(op);
    });
    return groups;
  }, [opsLogs]);

  const openSingleLog    = (op) => setOrderLogModal(op);
  const openSessionForOp = (op) => {
    const key   = op.createdAt || op.id;
    const group = prepGroups[key];
    if (group && group.length > 1) setSessionModal(group);
    else setOrderLogModal(op);
  };
  const openGenericLog = (op) => setGenericOpModal(op);

  const handleResetFilters = () => {
    setFilterOpType("all");
    setFilterResult("all");
    setFilterCarrier("all");
  };

  const columns = useMemo(() => [
    {
      key: "id",
      header: t("table.opNumber"),
      cell: (row) => <span className="font-mono font-bold text-primary text-xs">{row.id}</span>,
    },
    {
      key: "operationType",
      header: t("table.opType"),
      cell: (row) => <span className="text-sm font-medium">{t(OPERATION_TYPE_KEYS[row.operationType] ?? "opTypes.unknown")}</span>,
    },
    {
      key: "orderCode",
      header: t("table.orderNumber"),
      cell: (row) => <span className="font-mono text-sm font-semibold">{row.orderCode}</span>,
    },
    { key: "carrier",  header: t("table.carrier") },
    { key: "employee", header: t("table.employee") },
    {
      key: "result",
      header: t("table.result"),
      cell: (row) => (
        <Badge className={cn("rounded-full text-xs border",
          row.result === "SUCCESS"
            ? "bg-emerald-50 text-emerald-700 border-emerald-200"
            : "bg-red-50 text-red-700 border-red-200")}>
          {row.result === "SUCCESS" ? t("result.success") : t("result.failed")}
        </Badge>
      ),
    },
    {
      key: "details",
      header: t("table.details"),
      cell: (row) => <span className="text-sm text-slate-500">{row.details}</span>,
    },
    {
      key: "createdAt",
      header: t("table.datetime"),
      cell: (row) => <span className="text-sm text-slate-500 font-mono">{row.createdAt}</span>,
    },
    {
      key: "actions",
      header: "",
      cell: (row) => {
        const isPrepOp  = row.operationType === "ORDER_PREPARED" && row.scanLogs;
        const key       = row.createdAt || row.id;
        const isSession = isPrepOp && prepGroups[key] && prepGroups[key].length > 1;

        return (
          <TooltipProvider>
            <div className="flex items-center gap-1.5">
              {isPrepOp && (
                <>
                  {/* Single order file */}
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <motion.button whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.95 }}
                        onClick={() => openSingleLog(row)}
                        className="w-9 h-9 rounded-full border border-blue-200 bg-blue-50 text-blue-600 hover:bg-blue-600 hover:border-blue-600 hover:text-white flex items-center justify-center transition-all shadow-sm">
                        <Eye size={15} />
                      </motion.button>
                    </TooltipTrigger>
                    <TooltipContent>ملف الطلب + PDF</TooltipContent>
                  </Tooltip>

                  {/* Session (batch) */}
                  {isSession && (
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <motion.button whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.95 }}
                          onClick={() => openSessionForOp(row)}
                          className="w-9 h-9 rounded-full border border-emerald-200 bg-emerald-50 text-emerald-600 hover:bg-emerald-600 hover:border-emerald-600 hover:text-white flex items-center justify-center transition-all shadow-sm">
                          <FileDown size={15} />
                        </motion.button>
                      </TooltipTrigger>
                      <TooltipContent>ملف الجلسة كاملة ({prepGroups[key].length} طلبات)</TooltipContent>
                    </Tooltip>
                  )}
                </>
              )}

              {/* Generic op modal for all non-prep ops — NOW WIRED */}
              {!isPrepOp && (
                <Tooltip>
                  <TooltipTrigger asChild>
                    <motion.button whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.95 }}
                      onClick={() => openGenericLog(row)}
                      className="w-9 h-9 rounded-full border border-slate-200 bg-slate-50 text-slate-500 hover:bg-slate-600 hover:text-white flex items-center justify-center transition-all shadow-sm">
                      <Eye size={15} />
                    </motion.button>
                  </TooltipTrigger>
                  <TooltipContent>{t("table.orderFile")}</TooltipContent>
                </Tooltip>
              )}
            </div>
          </TooltipProvider>
        );
      },
    },
  ], [t, prepGroups]);

  return (
    <div className="space-y-4">
      <PageHeader
        breadcrumbs={[
          { name: t("breadcrumbs.home"),      href: "/" },
          { name: t("breadcrumbs.warehouse"), href: "/warehouse" },
          { name: t("breadcrumbs.logs") },
        ]}
        stats={stats}
      />

      <Table
        searchValue={search}
        onSearchChange={setSearch}
        onSearch={() => {}}
        labels={{
          searchPlaceholder: t("searchPlaceholder"),
          filter:     t("filter"),
          apply:      t("apply"),
          total:      t("total"),
          limit:      t("limit"),
          emptyTitle: t("emptyTitle"),
          emptySubtitle: "",
        }}
        actions={[
          { key: "export", label: t("export"), icon: <FileDown size={14} />, color: "blue", onClick: () => {} },
        ]}
        hasActiveFilters={hasActiveFilters}
        onApplyFilters={() => {}}
        filters={
          <>
            {/* Operation type */}
            <FilterField label={t("table.opType")}>
              <Select value={filterOpType} onValueChange={setFilterOpType}>
                <SelectTrigger className="h-10 min-w-[160px] rounded-xl border-border bg-background text-sm">
                  <SelectValue placeholder="جميع الأنواع" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">جميع الأنواع</SelectItem>
                  {Object.entries(OPERATION_TYPE_KEYS).map(([key, labelKey]) => (
                    <SelectItem key={key} value={key}>{t(labelKey)}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </FilterField>

            {/* Result */}
            <FilterField label={t("table.result")}>
              <Select value={filterResult} onValueChange={setFilterResult}>
                <SelectTrigger className="h-10 min-w-[140px] rounded-xl border-border bg-background text-sm">
                  <SelectValue placeholder="جميع النتائج" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">جميع النتائج</SelectItem>
                  <SelectItem value="SUCCESS">{t("result.success")}</SelectItem>
                  <SelectItem value="FAILED">{t("result.failed")}</SelectItem>
                </SelectContent>
              </Select>
            </FilterField>

            {/* Carrier */}
            {allCarriers.length > 0 && (
              <FilterField label={t("table.carrier")}>
                <Select value={filterCarrier} onValueChange={setFilterCarrier}>
                  <SelectTrigger className="h-10 min-w-[140px] rounded-xl border-border bg-background text-sm">
                    <SelectValue placeholder="جميع الشركات" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">جميع الشركات</SelectItem>
                    {allCarriers.map(c => (
                      <SelectItem key={c} value={c}>{c}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </FilterField>
            )}
 
          </>
        }
        columns={columns}
        data={filtered}
        isLoading={false}
        pagination={{ total_records: filtered.length, current_page: page.current_page, per_page: page.per_page }}
        onPageChange={({ page: p, per_page }) => setPage({ current_page: p, per_page })}
      />

      {/* Prep order log modal */}
      <OrderLogModal
        open={!!orderLogModal}
        onClose={() => setOrderLogModal(null)}
        op={orderLogModal}
        opsLogs={opsLogs}
        t={t}
      />

      {/* Generic (non-prep) op modal */}
      <GenericOpModal
        open={!!genericOpModal}
        onClose={() => setGenericOpModal(null)}
        op={genericOpModal}
        orders={orders}
      />

      {/* Full session modal */}
      <PrepSessionModal
        open={!!sessionModal}
        onClose={() => setSessionModal(null)}
        sessionOps={sessionModal}
      />
    </div>
  );
}