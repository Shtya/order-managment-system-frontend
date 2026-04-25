"use client";

import React, { useCallback, useEffect, useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Package, Phone, CheckCircle, Loader2, ArrowRight, ArrowLeft,
  Lock, ChevronDown, Zap, SkipForward, ShoppingBag, User,
  TrendingUp, Activity, RefreshCw, Clock, Building2,
  BadgeCheck, Banknote, StickyNote, Mail, Receipt, Star,
  Navigation, Plus, Minus, X, Save, Info, Trash2, Truck, MapPin, CreditCard,
} from "lucide-react";
import { useTranslations, useLocale } from "next-intl";
import { useRouter } from "@/i18n/navigation";
import toast from "react-hot-toast";
import { Textarea } from "@/components/ui/textarea";
import api from "@/utils/api";
import { ProductSkuSearchPopover } from "@/components/molecules/ProductSkuSearchPopover";
import { avatarSrc } from "@/components/atoms/UserSelect";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Controller, useForm } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import * as yup from "yup";
import { usePlatformSettings } from "@/context/PlatformSettingsContext";

// ─── RAW HEX (for alpha only) ──────────────────────────────────────────────
const HEX = {
  orange: "var(--primary)", amber: "var(--third)", flame: "var(--secondary)",
  violet: "#6763af", green: "#16a34a", red: "#dc2626", sky: "#0369a1",
};
// const rgba = (hex, op) => {
//   if (!hex?.startsWith("#")) return hex;
//   const x = hex.replace("#", "");
//   const r = parseInt(x.slice(0, 2), 16), g = parseInt(x.slice(2, 4), 16), b = parseInt(x.slice(4, 6), 16);
//   return `rgba(${r},${g},${b},${op})`;
// };
const rgba = (color, op = 0.1) => {
  if (!color) return "";

  // تحويل نسبة الشفافية (Opacity) إلى نسبة مئوية للشفاف (Transparent)
  // 0.1 opacity تعني 90% transparent
  const transparentPercentage = (1 - op) * 100;

  return `color-mix(in srgb, ${color}, transparent ${transparentPercentage}%)`;
};

const fmtDt = (d, loc = "ar-EG") => d ? new Date(d).toLocaleString(loc, { year: "numeric", month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" }) : "—";

// ─── SCHEMA ────────────────────────────────────────────────────────────────
const mkSchema = t => yup.object({
  customerName: yup.string().trim().required(t("validation.customerNameRequired")),
  email: yup.string().email(),
  phoneNumber: yup.string().trim().required(t("validation.phoneRequired")),
  secondPhoneNumber: yup.string().trim(),
  city: yup.string().trim().required(t("validation.cityRequired")),
  address: yup.string().trim().required(t("validation.addressRequired")),
  paymentMethod: yup.string().trim().required(t("validation.paymentMethodRequired")),
  shippingCost: yup.number().transform(v => isNaN(v) ? undefined : v).min(0),
  deposit: yup.number().transform(v => isNaN(v) ? undefined : v).min(0),
});

// ─── HOOKS ─────────────────────────────────────────────────────────────────
function useLock(lockedUntil) {
  const [ms, setMs] = useState(() => lockedUntil ? new Date(lockedUntil).getTime() - Date.now() : 0);
  useEffect(() => {
    if (!lockedUntil) return;
    const id = setInterval(() => setMs(new Date(lockedUntil).getTime() - Date.now()), 1000);
    return () => clearInterval(id);
  }, [lockedUntil]);
  if (ms <= 0) return null;
  const h = Math.floor(ms / 3600000), m = Math.floor((ms % 3600000) / 60000), s = Math.floor((ms % 60000) / 1000);
  return h > 0 ? `${h}h ${m}m ${s}s` : m > 0 ? `${m}m ${s}s` : `${s}s`;
}

function useCount(target, delay = 0) {
  const raw = parseFloat(String(target).replace(/[^0-9.]/g, ""));
  const [n, setN] = useState(0); const [go, setGo] = useState(false);
  useEffect(() => { const t2 = setTimeout(() => setGo(true), delay); return () => clearTimeout(t2); }, [delay]);
  useEffect(() => {
    if (!go || isNaN(raw)) return;
    let s; const dur = 680;
    const f = ts => { if (!s) s = ts; const p = Math.min((ts - s) / dur, 1); setN(Math.round((1 - Math.pow(1 - p, 3)) * raw)); if (p < 1) requestAnimationFrame(f); else setN(raw); };
    requestAnimationFrame(f);
  }, [go, raw]);
  return isNaN(raw) ? target : n;
}

// ─── GLOBAL STYLES ─────────────────────────────────────────────────────────
const GS = () => (
  <style>{`

 
    @keyframes ping    { 75%,100%{transform:scale(2.2);opacity:0} }
    @keyframes spin    { to{transform:rotate(360deg)} }
    @keyframes shimmer { 0%{background-position:-700px 0}100%{background-position:700px 0} }
    @keyframes nudge   { 0%,100%{transform:translateY(0)} 50%{transform:translateY(4px)} }

    input[type=number]::-webkit-inner-spin-button { -webkit-appearance:none; }
    input:focus,textarea:focus { outline:none; }
 
    /* ── Skeleton ── */
    .sk {
      background:linear-gradient(90deg,var(--muted) 0,var(--border) 200px,var(--muted) 400px);
      background-size:700px 100%;
      animation:shimmer 1.6s ease-in-out infinite;
      border-radius:var(--radius);
    }

    /* ── Card shell ── */
    .card {
      background:var(--card);
      border:1px solid var(--border);
      border-radius:var(--radius-lg);
      overflow:hidden;
      box-shadow:var(--shadow-sm);
    }

    /* ── Product table ── */
    .ptable { width:100%;  border-collapse:collapse; }
    .ptable thead tr { background:var(--muted); }
    .ptable th {
      
      font-size:9px; font-weight:800; letter-spacing:0.2em; text-transform:uppercase;
      color:var(--foreground);
      padding:9px 12px; text-align:start; border-bottom:1.5px solid var(--border);
      white-space:nowrap;
    }
    .ptable th:first-child { padding-inline-start:18px; }
    .ptable th:last-child  { text-align:center; }
    .ptable td { padding:11px 12px; border-bottom:1px solid var(--border); vertical-align:middle; }
    .ptable td:first-child { padding-inline-start:18px; }
    .ptable td:last-child  { text-align:center; }
    .ptable tbody tr { transition:background 0.1s; }
    .ptable tbody tr:hover { background:var(--accent); }
    .ptable tbody tr:last-child td { border-bottom:none; }
    .ptable tfoot td {
      background:var(--muted); border-top:2px solid var(--border);
      padding:10px 12px;
    }
    .ptable tfoot td:first-child { padding-inline-start:18px; }

    /* ── Qty pill ── */
    .qty { display:inline-flex; align-items:center; border-radius:var(--radius); border:1.5px solid var(--border); background:var(--muted); overflow:hidden; }
    .qty button { width:28px;height:28px;border:none;background:transparent;display:flex;align-items:center;justify-content:center;color:var(--foreground);transition:background .1s,color .1s; }
    .qty button:hover { background:var(--border); color:var(--foreground); }
    .qty input { width:32px;height:28px;text-align:center;border:none;border-left:1.5px solid var(--border);border-right:1.5px solid var(--border);background:transparent;font-family:'DM Mono',monospace;font-size:12px;font-weight:500;color:var(--foreground); }

    /* ── Form field ── */
    .field { display:flex; flex-direction:column; gap:5px; }
    .field label {  font-size:9.5px; font-weight:800; letter-spacing:0.18em; text-transform:uppercase; color:var(--foreground); transition:color .15s; }
    .field label.on { color:var(--primary); }
    .field input {
      height:40px; border-radius:var(--radius); border:1.5px solid var(--border);
      background:var(--input); padding:0 12px; 
      font-size:13px; color:var(--foreground); transition:border-color .15s,background .15s; width:100%;
    }
    .field input:focus { border-color:var(--primary); background:#fff8f5; }
    .field input.err { border-color:var(--destructive); }
    .field .emsg { font-size:10.5px; color:var(--destructive);  }

    /* ── Status pill in action bar ── */
    .spill {
      display:inline-flex; align-items:center; gap:7px;
      padding:8px 15px; border-radius:var(--radius);
       font-size:12px; font-weight:700; letter-spacing:0.02em;
      white-space:nowrap; border:1.5px solid transparent; transition:all .14s; outline:none;
    }
    .scroll-x { overflow-x:auto; scrollbar-width:none; }
    .scroll-x::-webkit-scrollbar { display:none; }

    /* ── Section rule header ── */
    .srule { display:flex; align-items:center; gap:10px; margin-bottom:13px; }
    .srule-line { display:block; width:18px; height:2.5px; border-radius:2px; flex-shrink:0; }
    .srule-text {   font-size:8.5px; font-weight:800; letter-spacing:0.22em; text-transform:uppercase; flex-shrink:0; }
    .srule-tail { display:block; flex:1; height:1px; }
  `}</style>
);

// ─── ATOMS ─────────────────────────────────────────────────────────────────
function Ping({ color, size = 8 }) {
  return (
    <span style={{ position: "relative", display: "inline-flex", width: size, height: size, flexShrink: 0 }}>
      <span style={{ position: "absolute", inset: 0, borderRadius: "50%", background: color, opacity: .32, animation: "ping 1.8s cubic-bezier(0,0,.2,1) infinite" }} />
      <span style={{ width: size, height: size, borderRadius: "50%", background: color, boxShadow: `0 0 5px ${rgba(color, .6)}`, position: "relative" }} />
    </span>
  );
}

function Tag({ children, color, sm = false }) {
  return (
    <span style={{ background: `color-mix(in srgb, ${color}, transparent 90%)`, display: "inline-flex", alignItems: "center", gap: 3, fontWeight: 700, fontSize: sm ? 9 : 10.5, letterSpacing: "0.05em", padding: sm ? "2px 7px" : "3px 10px", borderRadius: 6, color, border: `1px solid ${rgba(color, .24)}`, whiteSpace: "nowrap" }}>
      {children}
    </span>
  );
}

function Rule({ children, color = HEX.orange }) {
  return (
    <div className="srule">
      <span className="srule-line" style={{ background: color }} />
      <span className="srule-text" style={{ color: rgba(color, .7) }}>{children}</span>
      <span className="srule-tail" style={{ background: `linear-gradient(90deg,${rgba(color, .18)},transparent)` }} />
    </div>
  );
}

function NumStat({ value, color, size = 20, delay = 0, plain = false }) {
  const raw = parseFloat(String(value).replace(/[^0-9.]/g, ""));
  const n = useCount(plain ? 0 : raw, delay);
  const pre = String(value).match(/^[^0-9]*/)?.[0] || "";
  const suf = String(value).replace(/^[^0-9]*[0-9,.]+/, "");
  return (
    <span className="mono" style={{ fontSize: size, fontWeight: 500, color, lineHeight: 1, letterSpacing: "-0.03em" }}>
      {value}
    </span>
  );
}

// Card header with left accent bar
function CardHead({ icon: Icon, color, title, eyebrow, right, py = "14px" }) {
  return (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: `${py} 20px`, borderBottom: "1px solid var(--border)", background: `color-mix(in srgb, ${color}, transparent 75%)`, }}>
      <div style={{ display: "flex", alignItems: "center", gap: 0 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div style={{ width: 34, height: 34, borderRadius: "var(--radius)", background: rgba(color, .1), border: `1px solid ${rgba(color, .2)}`, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
            <Icon size={14} style={{ color }} />
          </div>
          <div>
            {eyebrow && <div style={{ fontSize: 8.5, fontWeight: 800, letterSpacing: "0.2em", textTransform: "uppercase", color: `color-mix(in srgb, ${color}, transparent 50%)`, marginBottom: 2 }}>{eyebrow}</div>}
            <div style={{ fontSize: 13.5, fontWeight: 700, color: "var(--card-foreground)", lineHeight: 1 }}>{title}</div>
          </div>
        </div>
      </div>
      {right && <div style={{ display: "flex", alignItems: "center", gap: 8, flexShrink: 0 }}>{right}</div>}
    </div>
  );
}

// Collapsible trigger
function ColHead({ open, onToggle, icon: Icon, color, title, eyebrow, right }) {
  return (
    <button type="button" onClick={onToggle}
      style={{ width: "100%", display: "flex", alignItems: "center", justifyContent: "space-between", padding: "15px 20px", background: open ? `color-mix(in srgb, ${color}, transparent 75%)` : "transparent", border: "none", borderBottom: open ? "1px solid var(--border)" : "none", cursor: "pointer", outline: "none", transition: "background .2s" }} >
      <div style={{ display: "flex", alignItems: "center", gap: 0 }}>
        {/* <div style={{width:4,alignSelf:"stretch",borderRadius:"0 3px 3px 0",background:open?color:rgba(color,.3),flexShrink:0,minHeight:24,marginInlineEnd:14,transition:"background .2s"}} /> */}
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div style={{ width: 30, height: 30, borderRadius: "var(--radius)", background: `color-mix(in srgb, ${color}, transparent 90%)`, border: `1px solid ${rgba(color, .16)}`, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
            <Icon size={13} style={{ color }} />
          </div>
          <div style={{ textAlign: "start" }}>
            {eyebrow && <div style={{ fontSize: 8.5, fontWeight: 800, letterSpacing: "0.2em", textTransform: "uppercase", color: `color-mix(in srgb, ${color}, transparent 50%)`, marginBottom: 2 }}>{eyebrow}</div>}
            <div style={{ fontSize: 13, fontWeight: 700, color: "var(--card-foreground)", lineHeight: 1 }}>{title}</div>
          </div>
        </div>
      </div>
      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
        {right}
        <div style={{ width: 22, height: 22, borderRadius: "var(--radius-sm)", background: "var(--muted)", border: "1px solid var(--border)", display: "flex", alignItems: "center", justifyContent: "center", transform: open ? "rotate(180deg)" : "rotate(0)", transition: "transform .22s" }}>
          <ChevronDown size={12} style={{ color: "var(--foreground)" }} />
        </div>
      </div>
    </button >
  );
}

// Metric tile
function MetTile({ icon: Icon, label, value, color, delay = 0, plain = false }) {
  const [hov, setHov] = useState(false);

  return (
    <motion.div onHoverStart={() => setHov(true)} onHoverEnd={() => setHov(false)}
      initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay, duration: .28 }}
      whileHover={{ y: -3, transition: { duration: .18 } }}
      style={{ background: "var(--card)", borderRadius: "var(--radius)", border: `1px solid ${hov ? rgba(color, .4) : "var(--border)"}`, padding: "13px 15px", position: "relative", overflow: "hidden", boxShadow: hov ? `0 6px 22px ${rgba(color, .18)}` : "var(--shadow-sm)", transition: "border-color .2s,box-shadow .2s" }}>
      <div style={{ position: "absolute", left: 0, top: 8, bottom: 8, width: 3, borderRadius: "0 3px 3px 0", background: color, opacity: hov ? 1 : .42, transition: "opacity .2s" }} />
      <div style={{ position: "absolute", inset: 0, background: `radial-gradient(ellipse at 0% 50%,${rgba(color, .07)},transparent 65%)`, opacity: hov ? 1 : 0, transition: "opacity .28s", pointerEvents: "none" }} />
      <div style={{ position: "relative", display: "flex", alignItems: "center", gap: 11 }}>
        <div style={{ width: 38, height: 38, borderRadius: "var(--radius)", background: `color-mix(in srgb, ${color}, transparent 90%)`, border: `1px solid ${rgba(color, .2)}`, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
          <Icon size={15} style={{ color }} />
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <NumStat value={value} color={hov ? color : "var(--foreground)"} size={19} delay={delay * 800} plain={plain} />
          <div style={{ fontSize: 9, fontWeight: 700, letterSpacing: "0.16em", textTransform: "uppercase", color: "var(--foreground)", marginTop: 5 }}>{label}</div>
        </div>
      </div>
    </motion.div>
  );
}

// Form input
function Fld({ label, name, control, error, disabled = false, type = "text", style: st = {} }) {
  const [foc, setFoc] = useState(false);
  return (
    <div className="field">
      <label className={foc ? "on" : ""}>{label}</label>
      <Controller name={name} control={control} render={({ field }) => (
        <input {...field} type={type} disabled={disabled}
          onFocus={() => setFoc(true)} onBlur={() => setFoc(false)}
          className={error ? "err" : ""} style={{ ...st, opacity: disabled ? .6 : 1 }}
        />
      )} />
      {error && <p className="emsg">{error.message}</p>}
    </div>
  );
}

// ─── PAGE ROOT ─────────────────────────────────────────────────────────────
export default function OrderConfirmationWorkPage() {
  const t = useTranslations("orders-work");
  const router = useRouter();
  const locale = useLocale();
  const isRtl = locale?.startsWith("ar");

  const [originalOrder, setOriginalOrder] = useState(null);
  const [editedOrder, setEditedOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [selectedSkus, setSelectedSkus] = useState([]);
  const [changingStatus, setChangingStatus] = useState(false);
  const [refetching, setRefetching] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [selStatusId, setSelStatusId] = useState(null);
  const [notes, setNotes] = useState("");
  const [allowedStatuses, setAllowedStatuses] = useState([]);
  const [isLocked, setIsLocked] = useState(false);
  const [lockedUntil, setLockedUntil] = useState(null);
  const [decided, setDecided] = useState(false);
  const [upsellOpen, setUpsellOpen] = useState(false);
  const [upsellProd, setUpsellProd] = useState(null);
  const [removedIds, setRemovedIds] = useState([]);

  useEffect(() => { fetchNext(); fetchStatuses(); }, []);

  const fetchNext = async () => {
    try { setLoading(true); const r = await api.get("/orders/employee/orders/next"); initOrder(r.data); }
    catch { toast.error(t("messages.errorFetchingOrder")); }
    finally { setLoading(false); }
  };
  const fetchStatuses = async () => {
    try { const r = await api.get("/orders/allowed-confirmation"); setAllowedStatuses(r.data || []); } catch { }
  };

  const { control, handleSubmit, reset, watch, setValue, formState: { errors } } = useForm({ resolver: yupResolver(mkSchema(t)), mode: "onChange" });
  const w = watch();

  useEffect(() => {
    if (w && Object.keys(w).length > 0) setEditedOrder(prev => ({ ...prev, ...w }));
  }, [w?.customerName, w?.phoneNumber, w?.city, w?.address, w?.paymentMethod, w?.shippingCost, w?.deposit, w?.email]);
  const hasChanges = useMemo(() => {
    if (!editedOrder) return false;
    console.log(JSON.stringify(originalOrder), JSON.stringify(editedOrder))
    return JSON.stringify(originalOrder) !== JSON.stringify(editedOrder);
  }, [originalOrder, editedOrder]);

  const wItems = watch("items"), wShip = watch("shippingCost"), wDisc = watch("discount");
  useEffect(() => {
    if (wItems) { const pt = wItems.reduce((s, i) => s + (i.unitPrice * i.quantity), 0); setValue("productsTotal", pt); setValue("finalTotal", pt + Number(wShip || 0) - Number(wDisc || 0)); }
  }, [wItems, wShip, wDisc, setValue]);

  const initOrder = data => {
    if (!data) return;
    setOriginalOrder(data); setEditedOrder(JSON.parse(JSON.stringify(data)));
    reset({
      customerName: data.customerName || "", email: data.email || null, phoneNumber: data.phoneNumber || "",
      secondPhoneNumber: data.secondPhoneNumber || null, city: data.city || "", area: data.area || null,
      address: data.address || "", deposit: data.deposit || 0, shippingCost: data.shippingCost || 0,
      paymentMethod: data.paymentMethod || "cod", allowOpenPackage: data.allowOpenPackage ?? false, items: data.items || []
    });
    if (data.items?.length) setSelectedSkus(data.items.map(i => ({ id: i.variant?.id || i.variantId, label: i.variant?.product?.name || i.productName, productName: i.variant?.product?.name || i.productName, sku: i.variant?.sku || i.sku, attributes: i.variant?.attributes || i.attributes || {}, price: i.unitPrice || 0, cost: i.unitCost || i.unitPrice || 0 })));
    else setSelectedSkus([]);
    const asgn = data.assignments?.find(x => x.isAssignmentActive);
    if (asgn?.lockedUntil) { setIsLocked(new Date(asgn.lockedUntil) > new Date()); setLockedUntil(asgn.lockedUntil); }
    else { setIsLocked(false); setLockedUntil(null); }
  };

  const recalc = o => { const pt = o.items.reduce((s, i) => s + (i.unitPrice * i.quantity), 0); return { ...o, productsTotal: pt, finalTotal: pt + parseFloat(o.shippingCost || 0) - parseFloat(o.discount || 0) }; };

  const handleQty = (item, delta) =>
    setEditedOrder(prev => recalc({ ...prev, items: prev.items.map(i => (i.id ? i.id === item.id : i.variantId === item.variantId) ? { ...i, quantity: Math.max(1, i.quantity + delta) } : i) }));

  const handleSelectSku = useCallback(sku => {
    if (selectedSkus.some(s => s.id === sku.id)) return;
    setSelectedSkus(p => [...p, sku]);
    setEditedOrder(prev => recalc({
      ...prev, items: [...prev.items, {
        isAdditional: true, variantId: sku.id,
        variant: { id: sku.id, sku: sku.sku || sku.key, attributes: sku.attributes || {}, stockOnHand: sku.stockOnHand || 0, reserved: sku.reserved || 0, product: { id: sku.productId, name: sku.label || sku.productName } },
        productName: sku.label || sku.productName, sku: sku.sku || sku.key, attributes: sku.attributes || {}, quantity: 1, unitPrice: sku.price || 0, unitCost: sku.cost || sku.price || 0
      }]
    }));
    toast.success(t("productAdded"));
  }, [selectedSkus, t]);

  const handleRemove = item => {
    const vId = item.variant?.id || item.variantId;
    setEditedOrder(prev => recalc({ ...prev, items: prev.items.filter(i => i.id ? i.id !== item.id : i.variantId !== item.variantId) }));
    setRemovedIds(p => [...p, { variantId: vId }]); setSelectedSkus(p => p.filter(s => s.id !== vId));
  };

  const onSave = async data => {
    try {
      setSaving(true);
      const { productsTotal, finalTotal, items: _, assignments, logs, ...rest } = data;
      await api.patch(`/orders/${editedOrder?.id}`, { ...rest, removedItems: removedIds, items: editedOrder?.items.map(i => ({ variantId: i.variant?.id || i.variantId, quantity: Number(i.quantity), unitPrice: i.unitPrice, isAdditional: i.isAdditional })) });
      toast.success(t("messages.updateSuccess"));
      const r = await api.get(`/orders/${editedOrder?.id}`); initOrder(r.data);
    } catch (e) { toast.error(e.response?.data?.message || "حدث خطأ"); }
    finally { setSaving(false); }
  };

  const cancelChanges = () => {
    setRemovedIds([]);
    setEditedOrder(JSON.parse(JSON.stringify(originalOrder)));
    setSelectedSkus(originalOrder.items.map(i => ({ id: i.variant?.id || i.variantId, label: i.variant?.product?.name || i.productName, productName: i.variant?.product?.name || i.productName, sku: i.variant?.sku || i.sku, attributes: i.variant?.attributes || i.attributes || {}, price: i.unitPrice || 0, cost: i.unitCost || i.unitPrice || 0 })));
    reset({ customerName: originalOrder.customerName || null, email: originalOrder.email || null, phoneNumber: originalOrder.phoneNumber || "", secondPhoneNumber: originalOrder.secondPhoneNumber || null, city: originalOrder.city || "", area: originalOrder.area || null, address: originalOrder.address || "", paymentMethod: originalOrder.paymentMethod || null, shippingCost: originalOrder.shippingCost ?? 0, deposit: originalOrder.deposit ?? 0, allowOpenPackage: originalOrder.allowOpenPackage ?? 0 });
  };

  const changeStatus = async statusId => {
    if (!originalOrder || isLocked || decided) return;
    try {
      setChangingStatus(true); setSelStatusId(statusId);
      await api.put(`/orders/${originalOrder.id}/confirm-status`, { statusId, notes: notes.trim() || undefined });
      toast.success(t("messages.statusUpdated")); setShowSuccess(true); setRefetching(true);
      const r = await api.get(`/orders/${originalOrder.id}`); initOrder(r.data);
      setDecided(true); setNotes(""); setSelStatusId(null);
    } catch (e) { toast.error(e.response?.data?.message || t("messages.errorUpdatingStatus")); setSelStatusId(null); setDecided(false); }
    finally { setChangingStatus(false); setRefetching(false); }
  };

  const nextOrder = () => {
    setOriginalOrder(null); setEditedOrder(null); setNotes(""); setSelStatusId(null);
    setIsLocked(false); setLockedUntil(null); setDecided(false); setShowSuccess(false);
    fetchNext();
  };
  const { formatCurrency } = usePlatformSettings();
  if (loading) return <Skeleton />;
  if (!originalOrder) return <Empty onRetry={fetchNext} onBack={() => router.push("/orders/employee-orders")} t={t} isRtl={isRtl} />;

  const items = editedOrder?.items || [];
  const mainItems = items.filter(i => !i.isAdditional);
  const addlItems = items.filter(i => i.isAdditional);
  const sh = { t, isRtl };

  return (
    <div className="oc">
      <GS />
      {/* Top accent rule */}
      <div style={{ height: 4, background: `linear-gradient(90deg,${HEX.orange},${HEX.amber},${HEX.flame})`, flexShrink: 0 }} />

      {/* ── HERO HEADER ─────────────────────────── */}
      <Hero order={editedOrder} {...sh} />

      {/* ── BODY GRID ───────────────────────────── */}
      <div style={{ padding: "20px 24px 150px 24px", display: "grid", gridTemplateColumns: "minmax(0,1.85fr) minmax(0,3fr)", gap: 20, alignItems: "start" }}>

        {/* LEFT */}
        <div style={{ display: "flex", flexDirection: "column", gap: 16, order: isRtl ? 2 : 1 }}>
          <ProdTable color={HEX.orange} icon={ShoppingBag} title={t("mainProducts")} eyebrow={t("items")}
            items={mainItems} onQty={handleQty} onRemove={handleRemove} isAdditional={false}
            handleSelectSku={handleSelectSku} selectedSkus={selectedSkus} {...sh} />
          <ProdTable color={HEX.green} icon={Package} title={t("additionalProducts")} eyebrow={t("items")}
            items={addlItems} onQty={handleQty} onRemove={handleRemove} isAdditional={true}
            handleSelectSku={handleSelectSku} selectedSkus={selectedSkus} {...sh} />
          <UpsellSection order={originalOrder} items={editedOrder.items} onOpen={p => { setUpsellProd(p); setUpsellOpen(true); }} {...sh} />
          <NotesSection order={editedOrder} {...sh} />
          <HistSection order={editedOrder} {...sh} />
        </div>

        {/* RIGHT */}
        <div style={{ display: "flex", flexDirection: "column", gap: 16, position: "sticky", top: 20, order: isRtl ? 1 : 2 }}>
          <CustomerSection order={editedOrder} control={control} errors={errors} {...sh} />
          <FinancialSection order={editedOrder} control={control} errors={errors} {...sh} />
          <DecisionSection order={editedOrder} notes={notes} setNotes={setNotes} changingStatus={changingStatus}
            isLocked={isLocked} decided={decided} refetching={refetching} showSuccess={showSuccess} lockedUntil={lockedUntil} {...sh} />
        </div>
      </div>

      <UpsellModal isOpen={upsellOpen} onClose={() => setUpsellOpen(false)} product={upsellProd}
        handleSelectSku={handleSelectSku} selectedSkus={selectedSkus} {...sh} />

      {hasChanges
        ? <SaveBar onSave={handleSubmit(onSave)} onCancel={cancelChanges} loading={saving} {...sh} />
        : <ActionBar order={originalOrder} allowedStatuses={allowedStatuses} changingStatus={changingStatus}
          selStatusId={selStatusId} isLocked={isLocked} decided={decided} refetching={refetching}
          changeStatus={changeStatus} nextOrder={nextOrder} loading={loading} {...sh} />
      }
    </div>
  );
}

// ─── HERO HEADER ───────────────────────────────────────────────────────────
function Hero({ order, t, isRtl }) {
  if (!order) return null;
  const status = order.status;
  const { formatCurrency } = usePlatformSettings();
  return (
    <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: .4, ease: [.16, 1, .3, 1] }}>
      {/* Main card — no side padding to bleed full width */}
      <div style={{ background: "var(--card)", borderBottom: "1px solid var(--border)" }}>

        {/* Identity row */}
        <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", flexWrap: "wrap", gap: 12, padding: "20px 24px 16px", borderBottom: "1px solid var(--border)" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
            <motion.div whileHover={{ rotate: 7, scale: 1.07 }} transition={{ type: "spring", stiffness: 280 }}
              style={{ width: 54, height: 54, borderRadius: "var(--radius-lg)", background: rgba(HEX.orange, .1), border: `1.5px solid ${rgba(HEX.orange, .22)}`, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
              <Receipt size={22} style={{ color: HEX.orange }} />
            </motion.div>
            <div style={{ textAlign: isRtl ? "right" : "left" }}>
              <div style={{ fontSize: 8.5, fontWeight: 800, letterSpacing: "0.22em", textTransform: "uppercase", color: rgba(HEX.orange, .65), marginBottom: 4 }}>{t("orderNumber")}</div>
              <div className="serif" style={{ fontSize: 44, fontStyle: "italic", lineHeight: .88, letterSpacing: "-0.015em", color: "var(--foreground)" }}>{order.orderNumber}</div>
              <div style={{ display: "flex", alignItems: "center", gap: 5, marginTop: 7 }}>
                <Clock size={10} style={{ color: "var(--foreground)" }} />
                <span style={{ fontSize: 11, color: "var(--foreground)" }}>{fmtDt(order.created_at, isRtl ? "ar-EG" : "en-US")}</span>
              </div>
            </div>
          </div>

          <div style={{ display: "flex", flexWrap: "wrap", alignItems: "center", gap: 8, paddingTop: 4 }}>
            {order.isReplacement && <Tag color={HEX.amber}><RefreshCw size={9} style={{ marginInlineEnd: 3 }} />{t("replacement")}</Tag>}
            {status && (
              <motion.div initial={{ opacity: 0, x: 8 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: .12 }}
                style={{ display: "flex", alignItems: "center", gap: 9, padding: "9px 18px", borderRadius: "var(--radius-xl)", background: rgba(status.color, .08), border: `1.5px solid ${rgba(status.color, .28)}`, boxShadow: `0 2px 14px ${rgba(status.color, .17)}` }}>
                <Ping color={status.color} />
                <span style={{ fontSize: 13, fontWeight: 700, color: status.color }}>{status.system ? t(`statuses.${status.code}`) : status.name}</span>
              </motion.div>
            )}
          </div>
        </div>

        {/* Metrics row */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(148px,1fr))", gap: 10, padding: "14px 24px", borderBottom: "1px solid var(--border)" }}>
          {[
            { icon: User, label: t("customer"), value: order.customerName || "—", color: HEX.violet, delay: .06, plain: true },
            { icon: Phone, label: t("phone"), value: order.phoneNumber || "—", color: HEX.sky, delay: .1, plain: true },
            { icon: Banknote, label: t("finalTotal"), value: formatCurrency(order.finalTotal), color: HEX.orange, delay: .14 },
            { icon: TrendingUp, label: t("profit"), value: formatCurrency(order.profit), color: HEX.green, delay: .18 },
          ].map(p => <MetTile key={p.label} {...p} />)}
        </div>

        {/* Info strips */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr" }}>
          <div style={{ padding: "14px 24px", borderInlineEnd: "1px solid var(--border)", display: "flex", flexDirection: "column", gap: 8 }}>
            <Rule color={HEX.orange}>{t("addressDetails")}</Rule>
            {[
              [order.area, order.city].filter(Boolean).join("، ") && { icon: MapPin, val: [order.area, order.city].filter(Boolean).join("، "), color: HEX.orange },
              order.address && { icon: Building2, val: order.address, color: HEX.orange },
              order.email && { icon: Mail, val: order.email, color: HEX.sky },
            ].filter(Boolean).map(({ icon: Icon, val, color }, i) => (
              <div key={i} style={{ display: "flex", alignItems: "center", gap: 9 }}>
                <Icon size={11} style={{ color, flexShrink: 0 }} />
                <span style={{ fontSize: 12, color: "var(--foreground)" }}>{val}</span>
              </div>
            ))}
          </div>

          <div style={{ padding: "14px 24px", display: "flex", flexDirection: "column", gap: 8 }}>
            <Rule color={HEX.violet}>{t("paymentShipping")}</Rule>
            <div style={{ display: "flex", alignItems: "center", gap: 7, flexWrap: "wrap" }}>
              <CreditCard size={11} style={{ color: HEX.violet, flexShrink: 0 }} />
              <span style={{ fontSize: 12, color: "var(--foreground)" }}>{order.paymentMethod}</span>
              {order.paymentStatus && <Tag color={order.paymentStatus === "paid" ? HEX.green : HEX.amber} sm>{t(`paymentStatus.${order.paymentStatus}`)}</Tag>}
            </div>
            {order.shippingCompany && (
              <div style={{ display: "flex", alignItems: "center", gap: 7 }}>
                <Truck size={11} style={{ color: "var(--foreground)" }} />
                <span style={{ fontSize: 12, color: "var(--foreground)" }}>{order.shippingCompany.name}</span>
              </div>
            )}
            {order.trackingNumber && (
              <div style={{ display: "flex", alignItems: "center", gap: 7 }}>
                <Navigation size={11} style={{ color: HEX.sky }} />
                <span className="mono" style={{ fontSize: 11.5, fontWeight: 500, color: HEX.sky }}>{order.trackingNumber}</span>
              </div>
            )}
          </div>
        </div>
      </div>
    </motion.div>
  );
}

// ─── PRODUCT TABLE ─────────────────────────────────────────────────────────
function ProdTable({ color, icon, title, eyebrow, items, onQty, onRemove, isAdditional, t, isRtl, handleSelectSku, selectedSkus }) {
  const [open, setOpen] = useState(true);
  if (!items?.length && !isAdditional) return null;
  const { formatCurrency } = usePlatformSettings();
  const totalQty = items?.reduce((s, i) => s + (parseInt(i.quantity) || 0), 0) || 0;
  const totalAmt = items?.reduce((s, i) => s + (i.unitPrice * i.quantity), 0) || 0;

  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: .3 }}>
      <div className="main-card !p-0 overflow-hidden">

        <ColHead open={open} onToggle={() => setOpen(p => !p)} icon={icon} color={color} eyebrow={eyebrow} title={title}
          right={
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <span className="mono" style={{ fontSize: 11, color: "var(--foreground)" }}>{totalQty} × {formatCurrency(totalAmt)}</span>
              <Tag color={color} sm>{items?.length || 0}</Tag>
            </div>
          } />

        <AnimatePresence initial={false}>
          {open && (
            <motion.div key="tbody" initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} transition={{ duration: .22 }} style={{ overflow: "hidden" }}>

              {items?.length > 0 ? (
                <div style={{ overflowX: "auto" }}>
                  <table className=" ptable">
                    <thead  >
                      <tr  >
                        <th style={{ width: 50 }}>{/* img */}</th>
                        <th>{t("productName") || "المنتج"}</th>
                        <th>{t("sku") || "SKU"}</th>
                        <th>{t("attributes") || "المواصفات"}</th>
                        <th style={{ textAlign: "center" }}>{t("quantity") || "الكمية"}</th>
                        {/* <th style={{textAlign:"center"}}>{t("stock")||"المخزون"}</th> */}
                        <th style={{ textAlign: "end" }}>{t("unitPrice") || "السعر"}</th>
                        <th style={{ textAlign: "end", paddingInlineEnd: 18 }}>{t("lineTotal") || "الإجمالي"}</th>
                        <th>{/* actions */}</th>
                      </tr>
                    </thead>
                    <tbody>
                      {items.map((item, idx) => {
                        const prod = item.variant?.product;
                        const attrs = item.variant?.attributes || {};
                        const stock = (item.variant?.stockOnHand ?? 0) - (item.variant?.reserved ?? 0);
                        const low = stock < 5;
                        return (
                          <motion.tr key={item.id || idx} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: idx * .035 }}>
                            {/* Thumb */}
                            <td>
                              <div style={{ position: "relative", width: 44, height: 44, borderRadius: "var(--radius)", overflow: "hidden", background: "var(--muted)", border: "1px solid var(--border)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                                {prod?.mainImage
                                  ? <img src={avatarSrc(prod.mainImage)} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                                  : <Package size={16} style={{ color: "var(--foreground)" }} />}
                                <span style={{ position: "absolute", bottom: -3, insetInlineEnd: -3, minWidth: 17, height: 17, borderRadius: 99, background: color, border: "2.5px solid var(--card)", display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "'DM Mono',monospace", fontSize: 8, fontWeight: 600, color: "#fff", padding: "0 3px" }}>
                                  {item.quantity}
                                </span>
                              </div>
                            </td>

                            {/* Name */}
                            <td style={{ minWidth: 140 }}>
                              <p style={{ fontSize: 12.5, fontWeight: 700, color: "var(--card-foreground)", lineHeight: 1.3, marginBottom: 2 }}>{prod?.name || item.productName || "—"}</p>
                              {prod?.callCenterProductDescription && (
                                <p style={{ fontSize: 10.5, color: "var(--foreground)", lineHeight: 1.4 }}>{prod.callCenterProductDescription.slice(0, 55)}{prod.callCenterProductDescription.length > 55 ? "…" : ""}</p>
                              )}
                            </td>

                            {/* SKU */}
                            <td>
                              <span className="mono" style={{ fontSize: 10, padding: "3px 8px", borderRadius: "var(--radius-sm)", background: "var(--muted)", color: "var(--foreground)", border: "1px solid var(--border)", whiteSpace: "nowrap", display: "inline-block" }}>{item.variant?.sku || item.sku}</span>
                            </td>

                            {/* Attributes */}
                            <td style={{ minWidth: 80 }}>
                              <div style={{ display: "flex", flexWrap: "wrap", gap: 3 }}>
                                {Object.entries(attrs).map(([k, v]) => <Tag key={k} color={color} sm>{k}: {v}</Tag>)}
                              </div>
                            </td>

                            {/* Qty */}
                            <td style={{ textAlign: "center" }}>
                              <div className="qty" style={{ margin: "0 auto" }}>
                                <button type="button" onClick={() => onQty(item, -1)}><Minus size={11} /></button>
                                <input type="number" value={item.quantity} onChange={e => onQty(item, parseInt(e.target.value) - item.quantity)} />
                                <button type="button" onClick={() => onQty(item, 1)}><Plus size={11} /></button>
                              </div>
                            </td>

                            {/* Stock bar */}
                            {/* <td style={{textAlign:"center"}}>
                              <div style={{display:"flex",flexDirection:"column",alignItems:"center",gap:4}}>
                                <div style={{width:44,height:4,borderRadius:99,background:"var(--muted)",overflow:"hidden"}}>
                                  <motion.div initial={{width:0}} animate={{width:`${Math.min(100,(stock/20)*100)}%`}}
                                    style={{height:"100%",borderRadius:99,background:low?HEX.red:HEX.green}} />
                                </div>
                                <span className="mono" style={{fontSize:10,fontWeight:500,color:low?HEX.red:HEX.green}}>{stock}</span>
                              </div>
                            </td> */}

                            {/* Unit price */}
                            <td style={{ textAlign: "end" }}>
                              <span className="mono" style={{ fontSize: 12, color: "var(--foreground)" }}>{formatCurrency(item.unitPrice)}</span>
                            </td>

                            {/* Line total */}
                            <td style={{ textAlign: "end", paddingInlineEnd: 18 }}>
                              <span className="mono" style={{ fontSize: 13, fontWeight: 500, color: "var(--card-foreground)" }}>{formatCurrency(item.unitPrice * item.quantity)}</span>
                            </td>

                            {/* Remove */}
                            <td>
                              <button type="button" onClick={() => onRemove(item)}
                                style={{ width: 28, height: 28, borderRadius: "var(--radius-sm)", border: `1px solid ${rgba(HEX.red, .22)}`, background: rgba(HEX.red, .05), display: "flex", alignItems: "center", justifyContent: "center", color: HEX.red, transition: "background .12s", margin: "0 auto" }}
                                onMouseEnter={e => e.currentTarget.style.background = rgba(HEX.red, .12)}
                                onMouseLeave={e => e.currentTarget.style.background = rgba(HEX.red, .05)}>
                                <Trash2 size={13} />
                              </button>
                            </td>
                          </motion.tr>
                        );
                      })}
                    </tbody>
                    <tfoot>
                      <tr>
                        <td colSpan={6} style={{ textAlign: "end" }}>
                          <span style={{ fontSize: 9.5, fontWeight: 800, letterSpacing: "0.14em", textTransform: "uppercase", color: "var(--foreground)" }}>{t("productsTotal") || "إجمالي المنتجات"}</span>
                        </td>
                        <td style={{ textAlign: "end", paddingInlineEnd: 18 }}>
                          <span className="mono" style={{ fontSize: 14, fontWeight: 500, color }}>{formatCurrency(totalAmt)}</span>
                        </td>
                        <td />
                      </tr>
                    </tfoot>
                  </table>
                </div>
              ) : (
                !isAdditional && (
                  <div style={{ padding: "28px 18px", textAlign: "center", color: "var(--foreground)", fontSize: 13 }}>
                    {t("noItems") || "لا توجد منتجات"}
                  </div>
                )
              )}

              {/* Add product CTA */}
              {isAdditional && (
                <div style={{ padding: "12px 18px 16px", borderTop: items?.length ? "1px dashed var(--border)" : "none" }}>
                  <Rule color={color}>{t("addAdditionalProduct")}</Rule>
                  <ProductSkuSearchPopover closeOnSelect={false} handleSelectSku={handleSelectSku} selectedSkus={selectedSkus}
                    trigger={() => (
                      <button type="button"
                        style={{ width: "100%", display: "flex", alignItems: "center", justifyContent: "center", gap: 9, padding: "11px", borderRadius: "var(--radius)", border: `1.5px dashed ${rgba(color, .4)}`, background: rgba(color, .04), fontSize: 12.5, fontWeight: 700, color, transition: "background .15s" }}
                        onMouseEnter={e => e.currentTarget.style.background = rgba(color, .1)}
                        onMouseLeave={e => e.currentTarget.style.background = rgba(color, .04)}>
                        <span style={{ width: 22, height: 22, borderRadius: "50%", background: color, color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 16, lineHeight: 1, flexShrink: 0 }}>+</span>
                        {t("addProduct")}
                      </button>
                    )} />
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  );
}

// ─── UPSELL SECTION ────────────────────────────────────────────────────────
function UpsellSection({ order, items, onOpen, t, isRtl }) {
  const upItems = order?.items?.flatMap(i => i.variant?.product?.upsellingEnabled ? i.variant.product.upsellingProducts || [] : []) || [];
  if (!upItems.length) return null;
  const addedMap = useMemo(() => { const m = new Map(); items.forEach(i => { const pId = i.variant?.product?.id || i.productId; const sku = i.variant?.sku || i.sku; if (pId && sku) { if (!m.has(pId)) m.set(pId, new Set()); m.get(pId).add(sku); } }); return m; }, [items]);

  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: .1 }}>
      <div className="main-card !p-0 overflow-hidden">
        <CardHead icon={Star} color={HEX.violet} eyebrow={t("upsell") || "Upsell"} title={t("upselling")} right={<Tag color={HEX.violet} sm>{upItems.length}</Tag>} />
        <div style={{ padding: "12px 18px 16px", display: "flex", flexDirection: "column", gap: 8 }}>
          {upItems.map((up, i) => {
            const added = Array.from(addedMap.get(up.productId) || new Set());
            return (
              <div key={i} style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 12, padding: "12px 14px", borderRadius: "var(--radius)", background: rgba(HEX.violet, .04), border: `1px solid ${rgba(HEX.violet, .14)}` }}>
                <div style={{ display: "flex", alignItems: "flex-start", gap: 10, flex: 1 }}>
                  <div style={{ width: 28, height: 28, borderRadius: "var(--radius-sm)", background: rgba(HEX.violet, .12), border: `1px solid ${rgba(HEX.violet, .22)}`, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                    <Zap size={12} style={{ color: HEX.violet }} />
                  </div>
                  <div style={{ textAlign: isRtl ? "right" : "left" }}>
                    <p style={{ fontSize: 12.5, fontWeight: 700, color: HEX.violet, marginBottom: 3 }}>{up.label}</p>
                    {up.callCenterDescription && <p style={{ fontSize: 11, color: "var(--foreground)", lineHeight: 1.5 }}>{up.callCenterDescription}</p>}
                    {added.length > 0 && <div style={{ display: "flex", flexWrap: "wrap", gap: 4, marginTop: 6 }}>{added.map(s => <Tag key={s} color={HEX.green} sm><CheckCircle size={8} style={{ marginInlineEnd: 3 }} />{s}</Tag>)}</div>}
                  </div>
                </div>
                <button onClick={() => onOpen(up)}
                  style={{ width: 32, height: 32, borderRadius: "var(--radius-sm)", border: "1px solid var(--border)", background: "var(--card)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, transition: "border-color .14s,background .14s" }}
                  onMouseEnter={e => { e.currentTarget.style.borderColor = HEX.orange; e.currentTarget.style.background = rgba(HEX.orange, .06); }}
                  onMouseLeave={e => { e.currentTarget.style.borderColor = "var(--border)"; e.currentTarget.style.background = "var(--card)"; }}>
                  <Plus size={14} style={{ color: "var(--foreground)" }} />
                </button>
              </div>
            );
          })}
        </div>
      </div>
    </motion.div>
  );
}

// ─── NOTES SECTION ─────────────────────────────────────────────────────────
function NotesSection({ order, t, isRtl }) {
  const [open, setOpen] = useState(false);
  if (!order?.customerNotes && !order?.notes) return null;
  const lbl = order.customerNotes && order.notes ? `${t("customerNotes")} & ${t("internalNotes")}` : order.customerNotes ? t("customerNotes") : t("internalNotes");

  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: .15 }}>
      <div className="main-card !p-0 overflow-hidden">
        <ColHead open={open} onToggle={() => setOpen(p => !p)} icon={StickyNote} color={HEX.sky}
          eyebrow={t("notes")} title={lbl}
          right={<Tag color={HEX.sky} sm>{[order.customerNotes, order.notes].filter(Boolean).length}</Tag>} />
        <AnimatePresence>
          {open && (
            <motion.div initial={{ height: 0 }} animate={{ height: "auto" }} exit={{ height: 0 }} style={{ overflow: "hidden" }}>
              <div style={{ padding: "14px 18px 18px", display: "flex", flexDirection: "column", gap: 10 }}>
                {order.customerNotes && <NoteBlock icon={User} color={HEX.sky} label={t("customerNotes")} text={order.customerNotes} isRtl={isRtl} />}
                {order.notes && <NoteBlock icon={Lock} color={HEX.violet} label={t("internalNotes")} text={order.notes} isRtl={isRtl} />}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  );
}

function NoteBlock({ icon: Icon, color, label, text, isRtl }) {
  return (
    <div style={{ borderRadius: "var(--radius)", overflow: "hidden", border: `1px solid ${rgba(color, .2)}` }}>
      <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "8px 13px", background: rgba(color, .06), borderBottom: `1px solid ${rgba(color, .16)}` }}>
        <div style={{ width: 20, height: 20, borderRadius: 6, background: rgba(color, .15), display: "flex", alignItems: "center", justifyContent: "center" }}>
          <Icon size={10} style={{ color }} />
        </div>
        <span style={{ fontSize: 9, fontWeight: 800, letterSpacing: "0.18em", textTransform: "uppercase", color }}>{label}</span>
      </div>
      <div style={{ padding: "10px 13px", background: rgba(color, .025) }}>
        <p style={{ fontSize: 13, lineHeight: 1.72, color: "var(--card-foreground)", textAlign: isRtl ? "right" : "left" }}>{text}</p>
      </div>
    </div>
  );
}

// ─── HISTORY SECTION ───────────────────────────────────────────────────────
function HistSection({ order, t, isRtl }) {
  const [open, setOpen] = useState(false);
  const hist = order?.statusHistory;
  if (!hist?.length) return null;
  const sorted = [...hist].sort((a2, b) => new Date(a2.created_at) - new Date(b.created_at));
  const latest = sorted[sorted.length - 1];

  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: .2 }}>
      <div className="main-card !p-0 overflow-hidden">
        <ColHead open={open} onToggle={() => setOpen(p => !p)} icon={Activity} color={HEX.green}
          eyebrow={isRtl ? "سجل النشاط" : "Activity"} title={t("statusHistory")}
          right={
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              {latest?.toStatus && (
                <div style={{ display: "flex", alignItems: "center", gap: 6, padding: "4px 10px", borderRadius: "var(--radius-sm)", background: rgba(latest.toStatus.color, .08), border: `1px solid ${rgba(latest.toStatus.color, .25)}` }}>
                  <Ping color={latest.toStatus.color} size={7} />
                  <span style={{ fontSize: 11, fontWeight: 700, color: latest.toStatus.color }}>{latest.toStatus.system ? t(`statuses.${latest.toStatus.code}`) : latest.toStatus.name}</span>
                </div>
              )}
              <Tag color={HEX.green} sm>{hist.length}</Tag>
            </div>
          } />
        <AnimatePresence>
          {open && (
            <motion.div initial={{ height: 0 }} animate={{ height: "auto" }} exit={{ height: 0 }} style={{ overflow: "hidden" }}>
              <div style={{ padding: "12px 18px 16px" }}>
                {sorted.map((entry, idx) => {
                  const last = idx === sorted.length - 1;
                  const tc = entry.toStatus?.color || "#94a3b8";
                  const fc = entry.fromStatus?.color || "#94a3b8";
                  return (
                    <motion.div key={entry.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: idx * .04 }}
                      style={{ display: "flex", alignItems: "flex-start", gap: 12 }}>
                      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", width: 18, flexShrink: 0 }}>
                        <div style={{ width: 18, height: 18, borderRadius: "50%", background: rgba(tc, .12), border: `1.5px solid ${rgba(tc, .36)}`, display: "flex", alignItems: "center", justifyContent: "center" }}>
                          <div style={{ width: 7, height: 7, borderRadius: "50%", background: tc }} />
                        </div>
                        {!last && <div style={{ width: 1, flex: 1, minHeight: 18, background: "var(--border)", margin: "2px 0" }} />}
                      </div>
                      <div style={{ flex: 1, minWidth: 0, paddingBottom: last ? 0 : 16, textAlign: isRtl ? "right" : "left" }}>
                        <div style={{ display: "flex", flexWrap: "wrap", alignItems: "center", gap: 5, marginBottom: 4 }}>
                          {entry.fromStatus && <Tag color={fc} sm>{entry.fromStatus.system ? t(`statuses.${entry.fromStatus.code}`) : entry.fromStatus.name}</Tag>}
                          {isRtl ? <ArrowLeft size={8} style={{ color: "var(--foreground)" }} /> : <ArrowRight size={8} style={{ color: "var(--foreground)" }} />}
                          {entry.toStatus && <Tag color={tc} sm>{entry.toStatus.system ? t(`statuses.${entry.toStatus.code}`) : entry.toStatus.name}</Tag>}
                        </div>
                        <div style={{ display: "flex", flexWrap: "wrap", alignItems: "center", gap: 6 }}>
                          <span style={{ display: "flex", alignItems: "center", gap: 3, fontSize: 10.5, color: "var(--foreground)" }}><Clock size={9} />{fmtDt(entry.created_at, isRtl ? "ar-EG" : "en-US")}</span>
                          {entry.notes && <span style={{ fontSize: 10.5, color: "var(--foreground)", background: "var(--muted)", padding: "2px 8px", borderRadius: "var(--radius-sm)", border: "1px solid var(--border)" }}>{entry.notes}</span>}
                        </div>
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  );
}

// ─── CUSTOMER SECTION ──────────────────────────────────────────────────────
function CustomerSection({ control, errors, t, isRtl }) {

  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
      <div className="main-card !p-0 overflow-hidden">
        <CardHead icon={User} color={HEX.violet} eyebrow={t("customer")} title={t("editCustomerInfo")} />
        <div style={{ padding: "16px 20px", display: "grid", gridTemplateColumns: "1fr 1fr", gap: 13 }}>
          <Fld name="customerName" label={t("customerName")} control={control} error={errors.customerName} />
          <Fld name="email" label={t("email")} control={control} error={errors.email} type="email" />
          <Fld name="phoneNumber" label={t("phone")} control={control} error={errors.phoneNumber} />
          <Fld name="secondPhoneNumber" label={t("secondPhone")} control={control} />
          <Fld name="city" label={t("city")} control={control} error={errors.city} />
          <Fld name="area" label={t("area")} control={control} />
          <div style={{ gridColumn: "1/-1" }}><Fld name="address" label={t("address")} control={control} error={errors.address} /></div>
        </div>
      </div>
    </motion.div>
  );
}

// ─── FINANCIAL SECTION ─────────────────────────────────────────────────────
function FinancialSection({ control, order, errors, t, isRtl }) {
  const tO = useTranslations("createOrder");
  const remaining = (order?.finalTotal || 0) - parseFloat(order?.deposit || 0);
  const { formatCurrency } = usePlatformSettings();
  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
      <div className="main-card !p-0 overflow-hidden">
        <CardHead icon={Banknote} color={HEX.orange} eyebrow={t("financials") || "Financials"} title={t("editFinancials")} />
        <div style={{ padding: "16px 20px", display: "grid", gridTemplateColumns: "1fr 1fr", gap: 13 }}>
          <Fld name="productsTotal" label={t("finalTotal")} control={control} disabled />
          <Fld name="deposit" label={t("deposit")} control={control} error={errors.deposit} type="number" />

          {/* Remaining */}
          <div className="field">
            <label>{t("remaining")}</label>
            <div style={{ height: 40, borderRadius: "var(--radius)", border: "1.5px dashed var(--border)", background: "var(--muted)", padding: "0 12px", display: "flex", alignItems: "center" }}>
              <span className="mono" style={{ fontSize: 14, fontWeight: 500, color: remaining < 0 ? HEX.red : HEX.green }}>{formatCurrency(remaining)}</span>
            </div>
          </div>

          <Fld name="shippingCost" label={t("shippingCost")} control={control} error={errors.shippingCost} type="number" />

          {/* Payment */}
          <div className="field">
            <label>{tO("fields.paymentMethod")} *</label>
            <Controller name="paymentMethod" control={control} render={({ field }) => (
              <Select value={field.value} onValueChange={field.onChange} dir={isRtl ? "rtl" : "ltr"}>
                <SelectTrigger style={{ height: 40, borderRadius: "var(--radius)", border: `1.5px solid ${errors.paymentMethod ? "var(--destructive)" : "var(--border)"}`, background: "var(--input)", fontSize: 13, color: "var(--foreground)" }}>
                  <SelectValue placeholder={tO("placeholders.selectPayment")} />
                </SelectTrigger>
                <SelectContent>
                  {[["cod", "cod"], ["cash", "cash"], ["card", "card"], ["bank_transfer", "bankTransfer"], ["wallet", "wallet"], ["other", "other"], ["unknown", "unknown"]].map(([v, k]) => (
                    <SelectItem key={v} value={v}>{tO(`paymentMethods.${k}`)}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )} />
            {errors.paymentMethod && <p className="emsg">{errors.paymentMethod.message}</p>}
          </div>

          {/* Open package */}
          <div className="field">
            <label>{tO("fields.allowOpenPackage")}</label>
            <Controller name="allowOpenPackage" control={control} render={({ field }) => (
              <Select value={field.value ? "true" : "false"} onValueChange={v => field.onChange(v === "true")} dir={isRtl ? "rtl" : "ltr"}>
                <SelectTrigger style={{ height: 40, borderRadius: "var(--radius)", border: "1.5px solid var(--border)", background: "var(--input)", fontSize: 13, color: "var(--foreground)" }}>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="true">{tO("allowOpenOptions.yes")}</SelectItem>
                  <SelectItem value="false">{tO("allowOpenOptions.no")}</SelectItem>
                </SelectContent>
              </Select>
            )} />
          </div>
        </div>
      </div>
    </motion.div>
  );
}

// ─── DECISION SECTION ──────────────────────────────────────────────────────
function DecisionSection({ order, notes, setNotes, changingStatus, isLocked, decided, refetching, showSuccess, lockedUntil, t, isRtl }) {
  const countdown = useLock(isLocked ? lockedUntil : null);

  return (
    <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: .1 }}>
      <div className="main-card !p-0 overflow-hidden">

        {/* Serif panel header */}
        <div style={{ padding: "16px 20px", borderBottom: "1px solid var(--border)", background: `color-mix(in srgb, ${HEX.orange}, transparent 75%)` }}>
          <div style={{ display: "flex", alignItems: "center", gap: 0 }}>
            <div style={{ width: 4, alignSelf: "stretch", borderRadius: "0 3px 3px 0", background: `linear-gradient(180deg,${HEX.orange},${HEX.amber})`, flexShrink: 0, minHeight: 40, marginInlineEnd: 14 }} />
            <div>
              <div style={{ fontSize: 8.5, fontWeight: 800, letterSpacing: "0.22em", textTransform: "uppercase", color: `color-mix(in srgb, ${HEX.orange}, transparent 65%)`, marginBottom: 4 }}>{t("workPage.changeStatus")}</div>
              <div className="serif" style={{ fontSize: 24, fontStyle: "italic", color: "var(--card-foreground)", lineHeight: 1 }}>{t("workPage.selectStatus")}</div>
            </div>
          </div>
        </div>

        <div style={{ padding: "16px 20px", display: "flex", flexDirection: "column", gap: 14 }}>

          {/* Feedback */}
          <AnimatePresence>
            {(showSuccess || refetching || isLocked) && (
              <motion.div key="fb" initial={{ opacity: 0, y: -6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                style={{ borderRadius: "var(--radius)", overflow: "hidden", border: `1px solid ${isLocked ? rgba(HEX.red, .25) : rgba(HEX.green, .25)}`, background: isLocked ? rgba(HEX.red, .04) : rgba(HEX.green, .04) }}>
                <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "11px 14px" }}>
                  <div style={{ width: 32, height: 32, borderRadius: "var(--radius-sm)", background: isLocked ? `color-mix(in srgb, ${HEX.red}, transparent 75%)` : `color-mix(in srgb, ${HEX.green}, transparent 75%)`, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                    {isLocked ? <Lock size={14} style={{ color: HEX.red }} /> : refetching ? <Loader2 size={14} style={{ color: HEX.orange, animation: "spin 1s linear infinite" }} /> : <CheckCircle size={14} style={{ color: HEX.green }} />}
                  </div>
                  <div style={{ flex: 1 }}>
                    <p style={{ fontSize: 13, fontWeight: 700, color: "var(--card-foreground)", marginBottom: 2 }}>{isLocked ? t("workPage.orderLocked") : refetching ? t("workPage.updatingOrder") : t("workPage.statusChanged")}</p>
                    <p style={{ fontSize: 11, color: "var(--foreground)" }}>{isLocked ? t("workPage.lockedMessage") : refetching ? t("workPage.pleaseWait") : t("workPage.orderUpdated")}</p>
                  </div>
                  {isLocked && countdown && <span className="mono" style={{ padding: "4px 12px", borderRadius: 999, background: HEX.red, color: "#fff", fontSize: 12, fontWeight: 500 }}>{countdown}</span>}
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Notes */}
          <div className="field">
            <label>{t("workPage.notes")}</label>
            <Textarea value={notes} onChange={e => setNotes(e.target.value)} placeholder={t("workPage.notesPlaceholder")}
              disabled={isLocked || changingStatus || decided} rows={3}
              style={{ borderRadius: "var(--radius)", border: "1.5px solid var(--border)", background: "var(--input)", fontSize: 13, padding: "10px 12px", resize: "none", color: "var(--foreground)", textAlign: isRtl ? "right" : "left", width: "100%" }}
              onFocus={e => e.currentTarget.style.borderColor = HEX.orange}
              onBlur={e => e.currentTarget.style.borderColor = "var(--border)"} />
          </div>

          {/* Hint */}
          {!decided && !isLocked && (
            <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 8 }}>
              <motion.div animate={{ y: [0, 4, 0] }} transition={{ repeat: Infinity, duration: 1.5 }}>
                <ChevronDown size={12} style={{ color: "var(--foreground)" }} />
              </motion.div>
              <span style={{ fontSize: 9, fontWeight: 700, letterSpacing: "0.18em", textTransform: "uppercase", color: "var(--foreground)" }}>{t("workPage.selectFromBottom")}</span>
              <motion.div animate={{ y: [0, 4, 0] }} transition={{ repeat: Infinity, duration: 1.5, delay: .2 }}>
                <ChevronDown size={12} style={{ color: "var(--foreground)" }} />
              </motion.div>
            </div>
          )}
        </div>
      </div>
    </motion.div>
  );
}

// ─── SAVE BAR ──────────────────────────────────────────────────────────────
function SaveBar({ onSave, onCancel, loading, t }) {
  return (
    <motion.div initial={{ y: 90, opacity: 0 }} animate={{ y: 0, opacity: 1 }}
      style={{ position: "fixed", bottom: 0, left: 0, right: 0, zIndex: 50, pointerEvents: "none" }} className=" max-w-[1000px] w-full left-1/2 -translate-x-1/2 " >
      <div style={{ position: "absolute", inset: 0, background: "linear-gradient(to bottom,transparent,color-mix(in oklab,var(--background) 90%,transparent) 40%,var(--background))" }} />
      <div style={{ position: "relative", padding: "10px 24px 22px", pointerEvents: "auto" }}>
        {/* Full width — no max-width */}
        <div style={{ borderRadius: "var(--radius-lg)", background: "var(--card)", border: `2px solid ${HEX.orange}`, boxShadow: `0 8px 32px ${rgba(HEX.orange, .22)},var(--shadow-lg)`, display: "flex", alignItems: "center", justifyContent: "space-between", padding: "13px 22px", gap: 12 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <div style={{ width: 36, height: 36, borderRadius: "var(--radius)", background: rgba(HEX.orange, .1), border: `1px solid ${rgba(HEX.orange, .2)}`, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
              <Info size={15} style={{ color: HEX.orange }} />
            </div>
            <div>
              <p style={{ fontSize: 14, fontWeight: 700, color: "var(--card-foreground)", marginBottom: 2 }}>{t("unsavedChanges")}</p>
              <p style={{ fontSize: 11, color: "var(--foreground)" }}>{t("unsavedChangesDesc")}</p>
            </div>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <button onClick={onCancel} disabled={loading}
              style={{ padding: "9px 20px", borderRadius: "var(--radius)", border: "1.5px solid var(--border)", background: "var(--muted)", fontSize: 13, fontWeight: 700, color: "var(--foreground)" }}>
              {t("cancel")}
            </button>
            <motion.button onClick={onSave} disabled={loading} whileHover={{ scale: 1.02 }} whileTap={{ scale: .97 }}
              style={{ display: "flex", alignItems: "center", gap: 8, padding: "9px 22px", borderRadius: "var(--radius)", border: "none", background: `linear-gradient(135deg,${HEX.orange},${HEX.flame})`, fontSize: 13, fontWeight: 700, color: "#fff", boxShadow: `0 4px 16px ${rgba(HEX.orange, .38)}` }}>
              {loading ? <Loader2 size={15} style={{ animation: "spin 1s linear infinite" }} /> : <Save size={15} />}
              {t("saveChanges")}
            </motion.button>
          </div>
        </div>
      </div>
    </motion.div>
  );
}

// ─── ACTION BAR ────────────────────────────────────────────────────────────
function ActionBar({ order, allowedStatuses, changingStatus, selStatusId, isLocked, decided, refetching, changeStatus, nextOrder, loading, t, isRtl }) {
  const canNext = decided && !loading && !changingStatus && !refetching;

  return (
    <motion.div initial={{ y: 90, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: .25, duration: .42 }}
      style={{ position: "fixed", zIndex: 50, pointerEvents: "none" }} className=" max-w-[1000px] w-full left-1/2 -translate-x-1/2 bottom-[10px] " >
      <div style={{ position: "absolute", inset: 0, background: "linear-gradient(to bottom,transparent,color-mix(in oklab,var(--background) 90%,transparent) 40%,var(--background))" }} />
      <div style={{ position: "relative", padding: "10px 24px 22px", pointerEvents: "auto" }}>
        <div style={{ borderRadius: "var(--radius-lg)", background: "var(--card)", border: "1px solid var(--border)", boxShadow: "var(--shadow-lg)", overflow: "hidden" }}>
          {/* Progress line */}
          <div style={{ height: 3, background: decided ? `linear-gradient(90deg,${HEX.green},#22c55e)` : `linear-gradient(90deg,${HEX.orange},${HEX.amber})` }} />

          <div style={{ display: "flex", alignItems: "center", padding: "0 10px", gap: 12, }}>
            {/* Status buttons */}
            <div className="scroll-x ltr:pl-[15px] rtl:pr-[15px] py-[15px] " style={{ flex: 1 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 6, minWidth: "max-content" }}>
                {allowedStatuses.map(status => {
                  const curr = status.id === order?.status?.id;
                  const busy = changingStatus && selStatusId === status.id;
                  const off = isLocked || changingStatus || curr || decided;
                  const c = status.color;
                  const lbl = status.system ? t(`statuses.${status.code}`) : status.name;

                  return (
                    <motion.button key={status.id} type="button" onClick={() => !off && changeStatus(status.id)} disabled={off}
                      className="spill"
                      whileHover={!off ? { y: -2, boxShadow: `0 5px 18px ${rgba(c, .3)}` } : {}}
                      whileTap={!off ? { scale: .96 } : {}}
                      style={{ borderColor: curr ? c : rgba(c, .28), background: curr ? c : rgba(c, .06), color: curr ? "#fff" : c, opacity: off && !curr ? .4 : 1, cursor: off ? "not-allowed" : "pointer", boxShadow: curr ? `0 4px 14px ${rgba(c, .34)}` : "none" }}>
                      <span style={{ width: 7, height: 7, borderRadius: "50%", background: curr ? "rgba(255,255,255,.85)" : c, flexShrink: 0 }} />
                      {lbl}
                      {busy && <Loader2 size={11} style={{ animation: "spin 1s linear infinite" }} />}
                      {curr && <BadgeCheck size={12} style={{ color: "rgba(255,255,255,.85)" }} />}
                    </motion.button>
                  );
                })}
              </div>
            </div>

            <div style={{ width: 1, alignSelf: "stretch", background: "var(--border)", flexShrink: 0 }} />

            {/* Next order */}
            <motion.button type="button" onClick={nextOrder} disabled={!canNext}
              whileHover={canNext ? { y: -2, boxShadow: `0 8px 24px ${rgba(HEX.orange, .42)}` } : {}}
              whileTap={canNext ? { scale: .96 } : {}}
              style={{ flexShrink: 0, display: "flex", alignItems: "center", gap: 8, padding: "9px 22px", borderRadius: "var(--radius)", border: "none", background: canNext ? `linear-gradient(135deg,${HEX.orange},${HEX.flame})` : "var(--muted)", fontSize: 13, fontWeight: 700, color: canNext ? "#fff" : "var(--foreground)", opacity: canNext ? 1 : .5, cursor: canNext ? "pointer" : "not-allowed", boxShadow: canNext ? `0 4px 16px ${rgba(HEX.orange, .35)}` : "none", transition: "all .2s" }}>
              {t("workPage.nextOrder")}
              {loading || refetching ? <Loader2 size={13} style={{ animation: "spin 1s linear infinite" }} /> : <SkipForward size={13} style={{ transform: isRtl ? "scaleX(-1)" : "none" }} />}
            </motion.button>
          </div>
        </div>
      </div>
    </motion.div>
  );
}

// ─── UPSELL MODAL ──────────────────────────────────────────────────────────
function UpsellModal({ isOpen, onClose, product, handleSelectSku, selectedSkus, t, isRtl }) {
  if (!isOpen) return null;
  return (
    <div style={{ position: "fixed", inset: 0, zIndex: 100, display: "flex", alignItems: "center", justifyContent: "center", background: "rgba(0,0,0,.46)", backdropFilter: "blur(5px)", padding: 16 }} dir={isRtl ? "rtl" : "ltr"}>
      <motion.div initial={{ scale: .95, opacity: 0, y: 10 }} animate={{ scale: 1, opacity: 1, y: 0 }} transition={{ type: "spring", stiffness: 320, damping: 22 }}
        style={{ background: "var(--card)", width: "100%", maxWidth: 520, borderRadius: "var(--radius-xl)", boxShadow: "var(--shadow-lg)", border: "1px solid var(--border)", display: "flex", flexDirection: "column", maxHeight: "80vh", overflow: "hidden" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "16px 18px", borderBottom: "1px solid var(--border)" }}>
          <h3 style={{ fontSize: 16, fontWeight: 700, color: "var(--card-foreground)" }}>{product ? product.label || product.name : t("addAdditionalProduct")}</h3>
          <button onClick={onClose} style={{ width: 32, height: 32, borderRadius: "var(--radius-sm)", border: "1px solid var(--border)", background: "var(--muted)", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <X size={15} style={{ color: "var(--foreground)" }} />
          </button>
        </div>
        <div style={{ padding: "12px 18px", flex: 1, overflowY: "auto" }}>
          <ProductSkuSearchPopover closeOnSelect={false}
            handleSelectSku={sku => { handleSelectSku(sku); onClose(); }}
            selectedSkus={selectedSkus}
            initialSearch={product?.label || product?.name}
            productId={product?.id || product?.productId} />
        </div>
      </motion.div>
    </div>
  );
}

// ─── SKELETON ──────────────────────────────────────────────────────────────
function Skeleton() {
  return (
    <div className="oc" style={{ width: "100%" }}>
      <GS />
      <div style={{ height: 4, background: `linear-gradient(90deg,${HEX.orange},${HEX.amber},${HEX.flame})` }} />
      <div style={{ background: "var(--card)", borderBottom: "1px solid var(--border)", padding: "20px 24px" }}>
        <div className="sk" style={{ height: 80, marginBottom: 12 }} />
        <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 10, marginBottom: 12 }}>
          {[0, 1, 2, 3].map(i => <div key={i} className="sk" style={{ height: 70 }} />)}
        </div>
        <div className="sk" style={{ height: 52 }} />
      </div>
      <div style={{ padding: "20px 24px", display: "grid", gridTemplateColumns: "minmax(0,1.85fr) minmax(0,3fr)", gap: 20 }}>
        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          {[220, 170, 120, 90].map((h, i) => <div key={i} className="sk" style={{ height: h }} />)}
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          {[240, 230, 180].map((h, i) => <div key={i} className="sk" style={{ height: h }} />)}
        </div>
      </div>
    </div>
  );
}

// ─── EMPTY STATE ───────────────────────────────────────────────────────────
function Empty({ onRetry, onBack, t, isRtl }) {
  return (
    <div className="oc" style={{ width: "100%", minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", padding: "0 24px" }}>
      <GS />
      <div style={{ textAlign: "center", maxWidth: 380 }}>
        <motion.div animate={{ y: [0, -7, 0] }} transition={{ repeat: Infinity, duration: 3, ease: "easeInOut" }}
          style={{ width: 100, height: 100, borderRadius: "50%", background: rgba(HEX.orange, .08), border: `1.5px dashed ${rgba(HEX.orange, .26)}`, display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 28px" }}>
          <Package size={36} style={{ color: HEX.orange }} />
        </motion.div>
        <h3 className="serif" style={{ fontSize: 32, fontStyle: "italic", color: "var(--foreground)", marginBottom: 10 }}>{t("workPage.noOrders") || "لا توجد طلبات"}</h3>
        <p style={{ fontSize: 13, color: "var(--foreground)", lineHeight: 1.72, marginBottom: 28 }}>{t("workPage.noOrdersDescription") || "لا توجد طلبات معلقة حالياً."}</p>
        <div style={{ display: "flex", gap: 10, justifyContent: "center" }}>
          <motion.button onClick={onRetry} whileHover={{ y: -2 }} whileTap={{ scale: .97 }}
            style={{ display: "flex", alignItems: "center", gap: 7, padding: "10px 22px", borderRadius: "var(--radius-xl)", background: "var(--card)", border: "1.5px solid var(--border)", fontSize: 13, fontWeight: 700, color: "var(--foreground)", boxShadow: "var(--shadow-sm)" }}>
            <RefreshCw size={13} />{t("retry") || "إعادة المحاولة"}
          </motion.button>
          <motion.button onClick={onBack} whileHover={{ y: -2 }} whileTap={{ scale: .97 }}
            style={{ display: "flex", alignItems: "center", gap: 7, padding: "10px 22px", borderRadius: "var(--radius-xl)", border: "none", background: `linear-gradient(135deg,${HEX.orange},${HEX.flame})`, fontSize: 13, fontWeight: 700, color: "#fff", boxShadow: `0 6px 20px ${rgba(HEX.orange, .34)}` }}>
            {t("workPage.backToMyOrders") || "العودة"}
          </motion.button>
        </div>
      </div>
    </div>
  );
}