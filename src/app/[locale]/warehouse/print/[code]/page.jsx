import React from "react";

const mockGet = async (code) => {
  return {
    order: {
      code,
      customer: "أحمد محمد",
      phone: "0551234567",
      city: "الدمام",
      address: "الدمام، حي الفيصلية",
      carrier: "DHL",
      orderDate: "2025-06-18",
      assignedEmployee: "محمد أحمد",
      products: [
        { sku: "PRD-001", name: "هاتف ذكي", requestedQty: 1, scannedQty: 1 },
        { sku: "PRD-002", name: "سماعات", requestedQty: 2, scannedQty: 2 },
        { sku: "PRD-003", name: "شاحن لاسلكي", requestedQty: 1, scannedQty: 1 },
      ],
    },
  };
};

function fmtDate(iso) {
  try {
    return new Date(iso).toLocaleDateString("ar-SA", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  } catch {
    return iso;
  }
}

export async function generateMetadata({ params }) {
  return { title: `Success PDF - ${params.code}` };
}

export default async function Page({ params }) {
  const { code } = params;
  const { order } = await mockGet(code);

  const totalRequested = order.products.reduce((s, p) => s + (p.requestedQty || 0), 0);
  const totalScanned = order.products.reduce((s, p) => s + (p.scannedQty || 0), 0);
  const allComplete = totalScanned >= totalRequested;

  return (
    <div dir="rtl" className="min-h-screen bg-slate-50 py-[20mm] flex justify-center print:bg-white">
      {/* Minimal global CSS for print + animation */}
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Cairo:wght@400;500;600;700;800;900&display=swap');
        @page { size: A4; margin: 0; }
        * { -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; box-sizing: border-box; }
        body { margin: 0; font-family: 'Cairo', ui-sans-serif, system-ui, sans-serif; }
        @keyframes gradientShift {
          0% { background-position: 0% 50%; }
          50% { background-position: 100% 50%; }
          100% { background-position: 0% 50%; }
        }
        .animated-gradient {
          background-size: 200% 200%;
          animation: gradientShift 8s ease infinite;
        }
      `}</style>

      {/* A4 page */}
      <div className="relative w-[210mm] min-h-[297mm] bg-white shadow-[0_4px_40px_rgba(0,0,0,0.08)] px-[18mm] py-[20mm] print:shadow-none print:m-0">
        {/* corner accents */}
        <div className="pointer-events-none absolute top-0 right-0 h-[60px] w-[60px] opacity-15 rounded-bl-[100%]
                        bg-[linear-gradient(225deg,#ff8b00_0%,transparent_70%)]" />
        <div className="pointer-events-none absolute bottom-0 left-0 h-[60px] w-[60px] opacity-15 rounded-tr-[100%]
                        bg-[linear-gradient(45deg,#10b981_0%,transparent_70%)]" />

        {/* HERO HEADER */}
        <div
          className={[
            "relative overflow-hidden rounded-3xl mb-6 px-9 py-8",
            "bg-[linear-gradient(135deg,rgba(255,139,0,0.12)_0%,rgba(255,92,43,0.08)_25%,rgba(16,185,129,0.08)_50%,rgba(255,139,0,0.12)_75%,rgba(255,92,43,0.08)_100%)]",
            "animated-gradient",
            "bg-[radial-gradient(circle_at_2px_2px,rgba(255,139,0,0.04)_1px,transparent_1px)] bg-[length:24px_24px]",
          ].join(" ")}
        >
          {/* top stripe */}
          <div className="absolute top-0 left-0 right-0 h-1 bg-[linear-gradient(90deg,#ff8b00_0%,#ff5c2b_40%,#10b981_100%)]" />

          <div className="relative z-10 flex items-start justify-between gap-6">
            {/* left */}
            <div className="flex-1">
              <div className="inline-flex items-center gap-2.5 rounded-2xl border-2 border-emerald-500 bg-[linear-gradient(135deg,#ecfdf5,#d1fae5)]
                              px-5 py-2 mb-4 shadow-[0_4px_20px_rgba(16,185,129,0.2)]">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#10b981" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="20 6 9 17 4 12"></polyline>
                </svg>
                <span className="text-[14px] font-black tracking-[0.02em] text-emerald-900">تم التجهيز بنجاح ✓</span>
              </div>

              <div className="flex items-center gap-4 mb-3">
                <div className="h-16 w-16 rounded-[20px] flex items-center justify-center text-[32px] flex-shrink-0
                                bg-[linear-gradient(135deg,#ff8b00,#ff5c2b)] shadow-[0_8px_32px_rgba(255,139,0,0.35)]">
                  📦
                </div>

                <div className="flex-1">
                  <div className="text-[36px] font-black leading-[1.2] mb-1 bg-[linear-gradient(135deg,#ff8b00,#ff5c2b)]
                                  bg-clip-text text-transparent">
                    {order.code}
                  </div>
                  <div className="text-[14px] font-semibold text-slate-500">وصل استلام رسمي — جاهز للشحن</div>
                </div>
              </div>

              <div className="inline-flex items-center gap-2 rounded-xl px-4 py-2 border border-[rgba(255,139,0,0.2)]
                              bg-[rgba(255,255,255,0.6)] backdrop-blur">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#ff8b00" strokeWidth="2">
                  <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
                  <line x1="16" y1="2" x2="16" y2="6"></line>
                  <line x1="8" y1="2" x2="8" y2="6"></line>
                  <line x1="3" y1="10" x2="21" y2="10"></line>
                </svg>
                <span className="text-[13px] font-bold text-slate-600">{fmtDate(new Date().toISOString())}</span>
              </div>
            </div>

            {/* right stats */}
            <div className="grid grid-cols-3 gap-3">
              <StatCard label="المطلوب" value={totalRequested} gradientClass="bg-[linear-gradient(135deg,#ff8b00,#ff5c2b)]" />
              <StatCard label="الممسوح" value={totalScanned} gradientClass="bg-[linear-gradient(135deg,#10b981,#059669)]" />
              <StatCard
                label="الحالة"
                value={allComplete ? "مكتمل" : "ناقص"}
                isText
                gradientClass={allComplete ? "bg-[linear-gradient(135deg,#10b981,#059669)]" : "bg-[linear-gradient(135deg,#f59e0b,#d97706)]"}
              />
            </div>
          </div>
        </div>

        {/* ORDER INFORMATION */}
        <Card>
          <SectionTitle icon="ℹ️" text="معلومات الطلب" />

          <div className="grid grid-cols-4 gap-4 mb-4">
            <InfoCard label="اسم العميل" value={order.customer} icon="👤" />
            <InfoCard label="رقم الهاتف" value={order.phone} icon="📱" mono />
            <InfoCard label="المدينة" value={order.city} icon="📍" />
            <InfoCard label="شركة الشحن" value={order.carrier || "غير محدد"} icon="🚚" accent />
          </div>

          <div className="grid grid-cols-[2fr_1fr_1fr] gap-4">
            <InfoCard label="العنوان الكامل" value={order.address} icon="🏠" wide />
            <InfoCard label="تاريخ الطلب" value={order.orderDate} icon="📅" />
            <InfoCard label="الموظف المسؤول" value={order.assignedEmployee} icon="👨‍💼" highlight />
          </div>
        </Card>

        {/* PRODUCTS TABLE */}
        <Card>
          <div className="flex items-center justify-between mb-5">
            <SectionTitle icon="📋" text="قائمة المنتجات" noMargin />
            <div className="rounded-xl border-2 border-[rgba(255,139,0,0.3)] px-4 py-1.5 text-[13px] font-extrabold text-amber-900
                            bg-[linear-gradient(135deg,rgba(255,139,0,0.15),rgba(255,92,43,0.1))]">
              {order.products.length} منتج
            </div>
          </div>

          <div className="relative rounded-2xl overflow-hidden bg-white">
            {/* gradient border via pseudo alternative: wrapper */}
            <div className="absolute inset-0 rounded-2xl p-[2px] bg-[linear-gradient(135deg,#ff8b00,#ff5c2b,#10b981)]" />
            <div className="relative rounded-2xl overflow-hidden bg-white">
              {/* header */}
              <div className="grid grid-cols-[2fr_1.2fr_0.8fr_0.8fr_1fr] gap-4 px-5 py-4 text-[12px] font-extrabold tracking-[0.05em]
                              uppercase text-amber-900 bg-white">
                <div>اسم المنتج</div>
                <div className="text-center">رقم SKU</div>
                <div className="text-center">المطلوب</div>
                <div className="text-center">الممسوح</div>
                <div className="text-center">الحالة</div>
              </div>

              {order.products.map((p, i) => {
                const complete = (p.scannedQty || 0) >= (p.requestedQty || 0);
                return (
                  <div
                    key={p.sku}
                    className={[
                      "grid grid-cols-[2fr_1.2fr_0.8fr_0.8fr_1fr] gap-4 px-5 py-4 items-center text-[14px] border-t border-slate-100",
                      i % 2 === 0 ? "bg-white" : "bg-slate-50",
                    ].join(" ")}
                  >
                    <div className="font-bold text-slate-800">{p.name}</div>

                    <div className="text-center">
                      <span className="inline-block rounded-md bg-slate-50 px-2 py-1 font-mono text-[12px] text-slate-500">
                        {p.sku}
                      </span>
                    </div>

                    <div className="text-center text-[16px] font-bold">{p.requestedQty}</div>

                    <div className={["text-center text-[16px] font-bold", complete ? "text-emerald-500" : "text-amber-500"].join(" ")}>
                      {p.scannedQty}
                    </div>

                    <div className="text-center">
                      <StatusBadge complete={complete} />
                    </div>
                  </div>
                );
              })}

              {/* totals */}
              <div className="grid grid-cols-[2fr_1.2fr_0.8fr_0.8fr_1fr] gap-4 px-5 py-4 font-extrabold border-t-2
                              border-t-[rgba(255,139,0,0.25)]
                              bg-[linear-gradient(90deg,rgba(255,139,0,0.08),rgba(16,185,129,0.06))]">
                <div className="text-amber-900">الإجمالي</div>
                <div />
                <div className="text-center text-[18px] text-amber-900">{totalRequested}</div>
                <div className="text-center text-[18px] text-emerald-500">{totalScanned}</div>
                <div className="text-center">
                  <StatusBadge complete={allComplete} />
                </div>
              </div>
            </div>
          </div>
        </Card>

        {/* DELIVERY RECEIPT */}
        <Card className="relative overflow-hidden">
          {/* watermark */}
          <div className="pointer-events-none select-none absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 -rotate-[25deg]
                          text-[120px] font-black tracking-[0.1em] text-[rgba(255,139,0,0.03)]">
            مُعتمد
          </div>

          <SectionTitle icon="✍️" text="إقرار التسليم" />

          {/* glass card */}
          <div className="relative overflow-hidden rounded-2xl p-6 mb-6 border border-white/30
                          bg-white/70 backdrop-blur-xl shadow-[0_8px_32px_rgba(0,0,0,0.08),inset_0_1px_0_rgba(255,255,255,0.8)]">
            <div className="absolute top-0 left-0 right-0 h-[3px] bg-[linear-gradient(90deg,#ff8b00,#ff5c2b)]" />

            <div className="flex items-center justify-between gap-5">
              <div className="flex-1">
                <div className="text-[11px] font-bold tracking-[0.1em] uppercase text-slate-400 mb-2">
                  المندوب المعين للتسليم
                </div>
                <div className="text-[28px] font-black bg-[linear-gradient(135deg,#1e293b,#475569)] bg-clip-text text-transparent">
                  {order.assignedEmployee || "غير محدد"}
                </div>
              </div>

              <div className="h-[72px] w-[72px] rounded-[18px] flex items-center justify-center text-[36px] flex-shrink-0
                              bg-[linear-gradient(135deg,#ff8b00,#ff5c2b)] shadow-[0_8px_32px_rgba(255,139,0,0.3)]">
                🚚
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-5">
            <SignatureBox label="توقيع المندوب" icon="✍️" />
            <SignatureBox label="تاريخ الاستلام" icon="📅" />
          </div>

          <div className="mt-6 pt-5 border-t-2 border-dashed border-slate-200 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="h-9 w-9 rounded-xl flex items-center justify-center text-[18px]
                              bg-[linear-gradient(135deg,#ff8b00,#ff5c2b)] shadow-[0_4px_16px_rgba(255,139,0,0.3)]">
                📦
              </div>
              <div>
                <div className="text-[16px] font-extrabold text-slate-800">{order.code}</div>
                <div className="text-[11px] font-semibold text-slate-400">وثيقة رسمية معتمدة</div>
              </div>
            </div>

            <div className="text-[11px] text-slate-300 text-right">
              طُبع بتاريخ {fmtDate(new Date().toISOString())}
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}

/* ---------- Tailwind sub-components ---------- */

function Card({ children, className = "" }) {
  return (
    <div
      className={[
        "bg-white rounded-[20px] border border-slate-100 px-7 py-6 mb-6",
        "shadow-[0_4px_24px_rgba(0,0,0,0.04)]",
        className,
      ].join(" ")}
    >
      {children}
    </div>
  );
}

function SectionTitle({ icon, text, noMargin }) {
  return (
    <div className={["flex items-center gap-3", noMargin ? "" : "mb-5"].join(" ")}>
      <div className="h-9 w-9 rounded-xl flex items-center justify-center text-[18px]
                      border border-[rgba(255,139,0,0.2)]
                      bg-[linear-gradient(135deg,rgba(255,139,0,0.15),rgba(255,92,43,0.1))]">
        {icon}
      </div>
      <h2 className="m-0 text-[18px] font-extrabold text-slate-800 tracking-[-0.01em]">{text}</h2>
    </div>
  );
}

function StatCard({ label, value, gradientClass, isText }) {
  return (
    <div className="min-w-[90px] text-center rounded-2xl p-4
                    bg-white/80 backdrop-blur-xl border border-white/50
                    shadow-[0_4px_20px_rgba(0,0,0,0.08)]">
      <div className="text-[10px] font-bold uppercase tracking-[0.08em] text-slate-400 mb-2">{label}</div>
      <div className={["font-black leading-none bg-clip-text text-transparent", gradientClass, isText ? "text-[16px]" : "text-[32px]"].join(" ")}>
        {value}
      </div>
    </div>
  );
}

function InfoCard({ label, value, icon, mono, accent, highlight, wide }) {
  const bg = accent
    ? "bg-[linear-gradient(135deg,rgba(255,139,0,0.08),rgba(255,92,43,0.05))] border-[rgba(255,139,0,0.25)]"
    : highlight
    ? "bg-[linear-gradient(135deg,rgba(16,185,129,0.08),rgba(5,150,105,0.05))] border-[rgba(16,185,129,0.25)]"
    : "bg-slate-50 border-slate-100";

  const labelColor = accent ? "text-[#ff8b00]" : highlight ? "text-emerald-500" : "text-slate-400";

  return (
    <div className={["rounded-[14px] border px-4 py-3.5", bg, wide ? "col-span-2" : ""].join(" ")}>
      <div className="flex items-center gap-2 mb-2">
        <span className="text-[14px]">{icon}</span>
        <div className={["text-[10px] font-bold uppercase tracking-[0.08em]", labelColor].join(" ")}>
          {label}
        </div>
      </div>
      <div className={["text-[15px] font-bold text-slate-800", mono ? "font-mono text-[13px]" : ""].join(" ")}>
        {value || "—"}
      </div>
    </div>
  );
}

function StatusBadge({ complete }) {
  return (
    <div
      className={[
        "inline-flex items-center gap-1.5 rounded-full px-3.5 py-1.5 text-[12px] font-extrabold",
        complete
          ? "text-emerald-900 border-2 border-emerald-500 bg-[linear-gradient(135deg,#ecfdf5,#d1fae5)] shadow-[0_4px_12px_rgba(16,185,129,0.2)]"
          : "text-amber-900 border-2 border-amber-500 bg-[linear-gradient(135deg,#fffbeb,#fef3c7)] shadow-[0_4px_12px_rgba(245,158,11,0.2)]",
      ].join(" ")}
    >
      <span className="text-[14px]">{complete ? "✓" : "⚠"}</span>
      {complete ? "مكتمل" : "ناقص"}
    </div>
  );
}

function SignatureBox({ label, icon }) {
  return (
    <div className="text-center rounded-[14px] border-2 border-dashed border-slate-200 bg-slate-50 p-5">
      <div className="flex items-center justify-center gap-2 mb-3">
        <span className="text-[16px]">{icon}</span>
        <div className="text-[12px] font-bold uppercase tracking-[0.08em] text-slate-500">{label}</div>
      </div>
      <div className="mt-10 mb-2 border-b-2 border-slate-300" />
      <div className="text-[10px] italic text-slate-300">التوقيع / الختم هنا</div>
    </div>
  );
}
