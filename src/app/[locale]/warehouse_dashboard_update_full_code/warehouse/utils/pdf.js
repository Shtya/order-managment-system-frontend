import { getDocumentSummary, getOrderItemCount, getOrderSkuCount, getOrderValue } from "../tabs/data";

function escapeHtml(value) {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/\"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

export function formatCurrency(value) {
  return `${Number(value || 0).toLocaleString("en-US")} ر.س`;
}

export function getPdfBaseStyles() {
  return `
    <style>
      * { box-sizing: border-box; }
      html, body { margin: 0; padding: 0; }
      body {
        font-family: 'Segoe UI', Tahoma, Arial, sans-serif;
        direction: rtl;
        color: #0f172a;
        background: #f8fafc;
        padding: 28px;
        -webkit-print-color-adjust: exact;
        print-color-adjust: exact;
      }
      .toolbar {
        position: sticky;
        top: 0;
        z-index: 20;
        display: flex;
        justify-content: space-between;
        align-items: center;
        gap: 12px;
        padding: 12px 16px;
        margin-bottom: 20px;
        border: 1px solid #e2e8f0;
        border-radius: 16px;
        background: rgba(255, 255, 255, 0.92);
        backdrop-filter: blur(12px);
      }
      .toolbar-actions {
        display: flex;
        gap: 8px;
        flex-wrap: wrap;
      }
      .toolbar button {
        border: none;
        border-radius: 999px;
        padding: 10px 16px;
        font: inherit;
        font-size: 13px;
        font-weight: 700;
        cursor: pointer;
      }
      .btn-download { background: #0f172a; color: #ffffff; }
      .btn-print { background: #e2e8f0; color: #0f172a; }
      .btn-close { background: transparent; color: #64748b; }
      .document {
        max-width: 980px;
        margin: 0 auto;
        display: flex;
        flex-direction: column;
        gap: 18px;
      }
      .hero {
        border-radius: 22px;
        padding: 22px 24px;
        color: #ffffff;
        background: linear-gradient(135deg, #f97316 0%, #f59e0b 100%);
      }
      .hero.hero-danger {
        background: linear-gradient(135deg, #dc2626 0%, #b91c1c 100%);
      }
      .hero.hero-info {
        background: linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%);
      }
      .hero h1 {
        margin: 0 0 6px;
        font-size: 22px;
        line-height: 1.3;
      }
      .hero p {
        margin: 0;
        font-size: 13px;
        opacity: 0.92;
      }
      .surface {
        border: 1px solid #e2e8f0;
        border-radius: 20px;
        padding: 18px;
        background: #ffffff;
        box-shadow: 0 18px 38px -32px rgba(15, 23, 42, 0.35);
      }
      .grid {
        display: grid;
        gap: 12px;
      }
      .grid.cols-2 { grid-template-columns: repeat(2, minmax(0, 1fr)); }
      .grid.cols-4 { grid-template-columns: repeat(4, minmax(0, 1fr)); }
      .meta-card {
        padding: 12px 14px;
        border-radius: 16px;
        border: 1px solid #e2e8f0;
        background: #f8fafc;
      }
      .meta-label {
        display: block;
        margin-bottom: 6px;
        font-size: 11px;
        color: #64748b;
      }
      .meta-value {
        font-size: 14px;
        font-weight: 700;
        color: #0f172a;
      }
      .section-title {
        margin: 0 0 12px;
        font-size: 15px;
        font-weight: 800;
        color: #0f172a;
      }
      .table-wrap {
        overflow: hidden;
        border-radius: 16px;
        border: 1px solid #e2e8f0;
      }
      table {
        width: 100%;
        border-collapse: collapse;
        font-size: 13px;
      }
      thead {
        background: #f8fafc;
      }
      th, td {
        padding: 10px 12px;
        text-align: right;
        vertical-align: top;
      }
      th {
        font-size: 11px;
        text-transform: uppercase;
        color: #64748b;
        border-bottom: 1px solid #e2e8f0;
      }
      td {
        border-bottom: 1px solid #f1f5f9;
      }
      tbody tr:last-child td {
        border-bottom: none;
      }
      .mono {
        font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
      }
      .badge {
        display: inline-flex;
        align-items: center;
        justify-content: center;
        gap: 6px;
        min-width: 0;
        padding: 4px 10px;
        border-radius: 999px;
        font-size: 11px;
        font-weight: 800;
        border: 1px solid transparent;
      }
      .badge-success {
        background: #dcfce7;
        color: #166534;
        border-color: #bbf7d0;
      }
      .badge-warning {
        background: #fef3c7;
        color: #92400e;
        border-color: #fcd34d;
      }
      .badge-danger {
        background: #fee2e2;
        color: #b91c1c;
        border-color: #fecaca;
      }
      .order-card {
        border: 1px solid #e2e8f0;
        border-radius: 20px;
        overflow: hidden;
        background: #ffffff;
      }
      .order-card-head {
        display: flex;
        justify-content: space-between;
        align-items: center;
        gap: 16px;
        padding: 14px 16px;
        background: #f8fafc;
        border-bottom: 1px solid #e2e8f0;
      }
      .order-title {
        margin: 0 0 4px;
        font-size: 16px;
        font-weight: 800;
        color: #0f172a;
      }
      .order-subtitle {
        margin: 0;
        font-size: 12px;
        color: #64748b;
      }
      .summary-strip {
        display: grid;
        grid-template-columns: repeat(4, minmax(0, 1fr));
        gap: 12px;
      }
      .summary-box {
        padding: 14px;
        border-radius: 16px;
        border: 1px solid #e2e8f0;
        background: #ffffff;
      }
      .summary-box b {
        display: block;
        margin-top: 6px;
        font-size: 18px;
        color: #0f172a;
      }
      .summary-box span {
        font-size: 11px;
        color: #64748b;
      }
      .signature {
        min-height: 120px;
        border: 2px dashed #cbd5e1;
        border-radius: 18px;
        padding: 18px;
        background: #ffffff;
      }
      .signature-grid {
        display: grid;
        grid-template-columns: repeat(3, minmax(0, 1fr));
        gap: 16px;
        margin-top: 20px;
      }
      .signature-field {
        padding-top: 24px;
        border-top: 1px solid #94a3b8;
        font-size: 11px;
        color: #64748b;
      }
      body[data-output="print"] {
        background: #ffffff;
      }
      @media print {
        .toolbar { display: none !important; }
        body { padding: 0; background: #ffffff !important; }
        body[data-output="print"] .hero {
          background: #ffffff !important;
          color: #000000 !important;
          border: 2px solid #000000 !important;
        }
        body[data-output="print"] .surface,
        body[data-output="print"] .order-card,
        body[data-output="print"] .meta-card,
        body[data-output="print"] .summary-box,
        body[data-output="print"] .table-wrap,
        body[data-output="print"] .signature {
          box-shadow: none !important;
          background: #ffffff !important;
          border-color: #000000 !important;
        }
        body[data-output="print"] thead {
          background: #f3f4f6 !important;
        }
        body[data-output="print"] .badge {
          background: #ffffff !important;
          color: #000000 !important;
          border-color: #000000 !important;
        }
      }
    </style>
  `;
}

export function buildOrderSummarySection(orders = [], labels = {}) {
  const summary = getDocumentSummary(orders);

  return `
    <section class="surface">
      <h2 class="section-title">${escapeHtml(labels.title || "الملخص النهائي")}</h2>
      <div class="summary-strip">
        <div class="summary-box">
          <span>${escapeHtml(labels.totalOrders || "إجمالي الطلبات")}</span>
          <b>${summary.totalOrders}</b>
        </div>
        <div class="summary-box">
          <span>${escapeHtml(labels.totalSkus || "إجمالي عدد الـ SKU")}</span>
          <b>${summary.totalSkus}</b>
        </div>
        <div class="summary-box">
          <span>${escapeHtml(labels.totalItems || "إجمالي الكميات")}</span>
          <b>${summary.totalItems}</b>
        </div>
        <div class="summary-box">
          <span>${escapeHtml(labels.totalValue || "القيمة الإجمالية")}</span>
          <b>${escapeHtml(formatCurrency(summary.totalValue))}</b>
        </div>
      </div>
    </section>
  `;
}

export function buildOrderOverviewCards(order, labels = {}) {
  return `
    <div class="grid cols-4">
      <div class="meta-card">
        <span class="meta-label">${escapeHtml(labels.customer || "العميل")}</span>
        <div class="meta-value">${escapeHtml(order.customer || "—")}</div>
      </div>
      <div class="meta-card">
        <span class="meta-label">${escapeHtml(labels.city || "المدينة")}</span>
        <div class="meta-value">${escapeHtml(order.city || "—")}</div>
      </div>
      <div class="meta-card">
        <span class="meta-label">${escapeHtml(labels.orderValue || "قيمة الطلب")}</span>
        <div class="meta-value">${escapeHtml(formatCurrency(order.total || getOrderValue(order)))}</div>
      </div>
      <div class="meta-card">
        <span class="meta-label">${escapeHtml(labels.orderSummary || "ملخص الطلب")}</span>
        <div class="meta-value">${getOrderSkuCount(order)} SKU / ${getOrderItemCount(order)} ${escapeHtml(labels.itemsWord || "قطعة")}</div>
      </div>
    </div>
  `;
}

export function openPdfDocument({ title, filename, body, output = "download", autoPrint = false }) {
  const win = window.open("", "_blank", "width=1100,height=900");
  if (!win) return;

  const safeTitle = escapeHtml(title || filename || "PDF");
  const safeFilename = escapeHtml(filename || "document");
  const safeOutput = output === "print" ? "print" : "download";

  win.document.write(`
    <!DOCTYPE html>
    <html lang="ar" dir="rtl">
      <head>
        <meta charset="UTF-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <title>${safeTitle}</title>
        ${getPdfBaseStyles()}
      </head>
      <body data-output="${safeOutput}">
        <div class="toolbar">
          <div>
            <strong>${safeTitle}</strong>
          </div>
          <div class="toolbar-actions">
            <button class="btn-download" onclick="document.body.dataset.output='download';window.print()">تنزيل PDF ملون</button>
            <button class="btn-print" onclick="document.body.dataset.output='print';window.print()">طباعة أبيض وأسود</button>
            <button class="btn-close" onclick="window.close()">إغلاق</button>
          </div>
        </div>
        <main class="document">${body}</main>
        <script>
          document.title = ${JSON.stringify(safeFilename)};
          ${autoPrint ? `window.addEventListener('load', () => { document.body.dataset.output='${safeOutput}'; window.print(); });` : ""}
        </script>
      </body>
    </html>
  `);

  win.document.close();
  win.focus();
}
