"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Settings, Save, Loader2, Bell, Zap,
  RefreshCw, X, Truck, Shield,
  AlertCircle, ChevronDown, RotateCcw, CheckCheck,
} from "lucide-react";
import { useTranslations } from "next-intl";
import toast from "react-hot-toast";
import { cn } from "@/utils/cn";
import api from "@/utils/api";
import { normalizeAxiosError } from "@/utils/axios";

import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import {
  Select, SelectContent, SelectItem,
  SelectTrigger, SelectValue,
} from "@/components/ui/select";

/* ══════════════════════════════════════════════════════════════
   HELPERS
══════════════════════════════════════════════════════════════ */
function rgba(hex, a = 0.12) {
  const r = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  if (!r) return `rgba(100,100,100,${a})`;
  return `rgba(${parseInt(r[1], 16)},${parseInt(r[2], 16)},${parseInt(r[3], 16)},${a})`;
}

/* ══════════════════════════════════════════════════════════════
   TABS CONFIG
══════════════════════════════════════════════════════════════ */
const TABS = [
  { key: "general",       icon: Settings,   labelKey: "retrySettings.tabs.general"       },
  { key: "automation",    icon: Zap,        labelKey: "retrySettings.tabs.automation"    },
  { key: "shipping",      icon: Truck,      labelKey: "retrySettings.tabs.shipping"      },
  { key: "notifications", icon: Bell,       labelKey: "retrySettings.tabs.notifications" },
];

/* ══════════════════════════════════════════════════════════════
   STATUS MULTI-SELECT DROPDOWN
   Lifted directly from DistributionModal — same pattern, same UX.
   Used for "retry statuses" and "confirmation statuses".
══════════════════════════════════════════════════════════════ */
function StatusMultiSelect({
  statuses,
  selected,          // string[] of codes
  onToggle,          // (code: string) => void
  onClear,           // () => void
  placeholder,
  t,
}) {
  const [open, setOpen] = useState(false);
  const triggerRef = useRef(null);
  const dropdownRef = useRef(null);

  /* close on outside click */
  useEffect(() => {
    const handler = (e) => {
      if (
        triggerRef.current && !triggerRef.current.contains(e.target) &&
        dropdownRef.current && !dropdownRef.current.contains(e.target)
      ) setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const selectedObjects = useMemo(() => {
    const set = new Set(selected);
    return statuses.filter(s => set.has(s.code || String(s.id)));
  }, [statuses, selected]);

  const count = selected.length;

  return (
    <div className="space-y-2">

      {/* ── Trigger button ─────────────────────────────────────── */}
      <div className="relative">
        <button
          ref={triggerRef}
          type="button"
          onClick={() => setOpen(v => !v)}
          className={cn(
            "w-full flex items-center justify-between gap-2 h-11 px-4 rounded-xl",
            "border border-border bg-background text-sm transition-all duration-200",
            "hover:border-[var(--primary)] hover:shadow-[0_0_0_3px_rgba(255,139,0,0.08)]",
            open && "border-[var(--primary)] shadow-[0_0_0_3px_rgba(255,139,0,0.1)]",
          )}
        >
          <span className="flex items-center gap-2 min-w-0 flex-1">
            {count > 0 ? (
              <>
                {/* color dot preview */}
                <span className="flex -space-x-1 shrink-0">
                  {selectedObjects.slice(0, 4).map(s => (
                    <span
                      key={s.id ?? s.code}
                      className="w-3 h-3 rounded-full border-2 border-background shrink-0"
                      style={{ backgroundColor: s.color || "#888" }}
                    />
                  ))}
                </span>
                <span className="font-semibold text-foreground truncate">
                  {t("retrySettings.statusesSelected", { count })}
                </span>
              </>
            ) : (
              <span className="text-muted-foreground">{placeholder}</span>
            )}
          </span>
          <motion.span
            animate={{ rotate: open ? 180 : 0 }}
            transition={{ duration: 0.2 }}
            className={cn("shrink-0 transition-colors", open ? "text-[var(--primary)]" : "text-muted-foreground")}
          >
            <ChevronDown size={15} />
          </motion.span>
        </button>

        {/* ── Dropdown panel ───────────────────────────────────── */}
        <AnimatePresence>
          {open && (
            <motion.div
              ref={dropdownRef}
              initial={{ opacity: 0, y: -6, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -6, scale: 0.98 }}
              transition={{ duration: 0.15 }}
              className="absolute z-50 mt-1.5 w-full bg-popover border border-border rounded-2xl
                shadow-[0_8px_32px_rgba(0,0,0,0.12)] max-h-[232px] overflow-hidden"
            >
              {/* gradient strip */}
              <div className="h-[2px] w-full rounded-t-2xl bg-gradient-to-r
                from-[var(--primary)] via-[var(--secondary,#ffb703)] to-[var(--third,#ff5c2b)] opacity-70" />

              <div className="overflow-y-auto max-h-[230px] p-1.5 space-y-0.5">
                {statuses.length === 0 ? (
                  <div className="py-6 text-center text-sm text-muted-foreground flex items-center justify-center gap-2">
                    <Loader2 size={14} className="animate-spin" />
                    {t("messages.loading")}
                  </div>
                ) : statuses.map(s => {
                  const code = s.code || String(s.id);
                  const isChecked = selected.includes(code);
                  const c = s.color || "#6366f1";
                  const label = s.system ? t(`statuses.${s.code}`) : (s.name || s.code);

                  return (
                    <button
                      key={code}
                      type="button"
                      onClick={() => onToggle(code)}
                      style={{ backgroundColor: isChecked ? rgba(c, 0.1) : undefined }}
                      className={cn(
                        "w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm text-start transition-all duration-150",
                        !isChecked && "hover:bg-muted/60",
                      )}
                    >
                      {/* custom checkbox */}
                      <span
                        className="shrink-0 w-[18px] h-[18px] rounded-md flex items-center justify-center transition-all duration-150"
                        style={{
                          border: `2px solid ${isChecked ? c : "var(--border)"}`,
                          backgroundColor: isChecked ? c : "transparent",
                        }}
                      >
                        {isChecked && (
                          <svg width="10" height="8" viewBox="0 0 10 8" fill="none">
                            <path d="M1 4L3.8 7L9 1" stroke="white" strokeWidth="1.8"
                              strokeLinecap="round" strokeLinejoin="round" />
                          </svg>
                        )}
                      </span>
                      {/* color dot */}
                      <span className="w-2.5 h-2.5 rounded-full shrink-0"
                        style={{ backgroundColor: c, boxShadow: `0 0 0 2px ${rgba(c, 0.2)}` }} />
                      <span
                        className="flex-1 truncate font-medium transition-colors"
                        style={{ color: isChecked ? c : undefined, fontWeight: isChecked ? 600 : 400 }}
                      >
                        {label}
                      </span>
                      {isChecked && (
                        <motion.span
                          initial={{ scale: 0 }} animate={{ scale: 1 }}
                          className="text-[10px] font-bold shrink-0"
                          style={{ color: rgba(c, 0.7) }}
                        >
                          ✓
                        </motion.span>
                      )}
                    </button>
                  );
                })}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* ── Selected tags ─────────────────────────────────────────── */}
      <AnimatePresence>
        {selectedObjects.length > 0 && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="flex flex-wrap gap-1.5 overflow-hidden pt-0.5"
          >
            {selectedObjects.map(s => {
              const code = s.code || String(s.id);
              const c = s.color || "#6366f1";
              const label = s.system ? t(`statuses.${s.code}`) : (s.name || s.code);
              return (
                <motion.span
                  key={code}
                  initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.8 }}
                  transition={{ type: "spring", stiffness: 400, damping: 25 }}
                  className="inline-flex items-center gap-1.5 ps-2.5 pe-1.5 py-1 rounded-xl text-xs font-bold border"
                  style={{ backgroundColor: rgba(c, 0.1), borderColor: rgba(c, 0.3), color: c }}
                >
                  <span className="w-1.5 h-1.5 rounded-full shrink-0" style={{ backgroundColor: c }} />
                  {label}
                  <button
                    type="button"
                    onClick={() => onToggle(code)}
                    className="ms-0.5 w-4 h-4 rounded-lg flex items-center justify-center opacity-60 hover:opacity-100 transition-opacity"
                    style={{ color: c }}
                  >
                    <svg width="8" height="8" viewBox="0 0 8 8" fill="none">
                      <path d="M1.5 1.5l5 5M6.5 1.5l-5 5" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
                    </svg>
                  </button>
                </motion.span>
              );
            })}
            {selectedObjects.length > 1 && (
              <motion.button
                initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }}
                type="button"
                onClick={onClear}
                className="inline-flex items-center gap-1 px-2.5 py-1 rounded-xl text-xs font-bold
                  border border-dashed border-border text-muted-foreground
                  hover:border-red-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/20
                  transition-all duration-150"
              >
                <svg width="9" height="9" viewBox="0 0 9 9" fill="none">
                  <path d="M1.5 1.5l6 6M7.5 1.5l-6 6" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
                </svg>
                {t("retrySettings.clearAll")}
              </motion.button>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

/* ══════════════════════════════════════════════════════════════
   TOGGLE ROW — RTL/LTR safe
   • No justify-between (flips weirdly in RTL)
   • Text takes flex-1, switch uses ms-auto → always pushed to
     the logical "end" whether LTR or RTL
══════════════════════════════════════════════════════════════ */
function ToggleRow({ label, description, checked, onCheckedChange }) {
  return (
    <div
      className={cn(
        "flex items-center gap-4 p-4 rounded-xl border transition-all duration-200",
        checked
          ? "border-[var(--primary)]/30 dark:border-[#5b4bff]/30"
          : "border-border bg-muted/20",
      )}
      style={checked ? { background: rgba("#ff8b00", 0.04) } : {}}
    >
      <div className="min-w-0 flex-1">
        <p className="text-sm font-bold text-foreground">{label}</p>
        {description && (
          <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed">{description}</p>
        )}
      </div>
      {/* ms-auto pushes to end in both LTR and RTL */}
      <Switch checked={checked} onCheckedChange={onCheckedChange} className="shrink-0 ms-auto" />
    </div>
  );
}

/* ══════════════════════════════════════════════════════════════
   INLINE TOGGLE (used inside ShippingCard rows)
══════════════════════════════════════════════════════════════ */
function InlineToggle({ label, description, checked, onCheckedChange }) {
  return (
    <div className="flex items-center gap-3 py-0.5">
      <div className="min-w-0 flex-1">
        <p className="text-sm font-bold text-foreground">{label}</p>
        {description && <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed">{description}</p>}
      </div>
      <Switch checked={checked} onCheckedChange={onCheckedChange} className="shrink-0 ms-auto" />
    </div>
  );
}

/* ══════════════════════════════════════════════════════════════
   NUMBER FIELD
══════════════════════════════════════════════════════════════ */
function NumberField({ label, description, value, onChange, min, max, suffix }) {
  return (
    <div className="space-y-1.5">
      <Label className="text-xs font-black uppercase tracking-wider text-muted-foreground/70">
        {label}
      </Label>
      <div className="flex items-center gap-2 relative">
        <Input endIcon= {suffix && <span className=" text-sm text-muted-foreground shrink-0">{suffix}</span>} type="number" min={min} max={max} value={value} onChange={onChange}
          className="rounded-xl h-10 flex-1" />
       
      </div>
      {description && <p className="text-[11px] text-muted-foreground">{description}</p>}
    </div>
  );
}

/* ══════════════════════════════════════════════════════════════
   SECTION CARD (used in Automation + Shipping tabs)
══════════════════════════════════════════════════════════════ */
function SectionCard({ icon: Icon, iconColor, title, subtitle, badge, children }) {
  return (
    <div className="rounded-2xl border border-border bg-card !p-0 ">
      <div className="flex items-center gap-3 px-4 py-3 border-b border-border bg-muted/30">
        <div
          className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0"
          style={{ backgroundColor: rgba(iconColor, 0.12), border: `1px solid ${rgba(iconColor, 0.25)}` }}
        >
          <Icon size={13} style={{ color: iconColor }} />
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-xs font-black text-foreground">{title}</p>
          {subtitle && <p className="text-[10px] text-muted-foreground mt-0.5 leading-tight">{subtitle}</p>}
        </div>
        {badge != null && badge > 0 && (
          <span
            className="shrink-0 text-[10px] font-black px-2 py-0.5 rounded-full"
            style={{ backgroundColor: rgba(iconColor, 0.12), color: iconColor }}
          >
            {badge}
          </span>
        )}
      </div>
      <div className="p-4 space-y-3">{children}</div>
    </div>
  );
}

function FieldSubLabel({ children }) {
  return (
    <p className="text-[10px] font-black uppercase tracking-wider text-muted-foreground/60">
      {children}
    </p>
  );
}

/* ══════════════════════════════════════════════════════════════
   MAIN COMPONENT
══════════════════════════════════════════════════════════════ */
export default function GlobalRetrySettingsModal({ isOpen, onClose, statuses = [] }) {
  const t = useTranslations("orders");
  const [activeTab, setActiveTab] = useState("general");
  const [loading, setLoading]   = useState(true);
  const [saving,  setSaving]    = useState(false);

  const [settings, setSettings] = useState({
    enabled:               true,
    maxRetries:            3,
    retryInterval:         30,
    autoMoveStatus:        "",
    retryStatuses:         [],
    confirmationStatuses:  [],
    notifyEmployee:        true,
    notifyAdmin:           false,
    workingHours:          { enabled: true, start: "09:00", end: "18:00" },
    shipping: {
      autoSendToShipping:      false,
      shippingCompanyId:       "",
      triggerStatus:           "",
      requirePaymentConfirm:   true,
      notifyOnShipment:        true,
      autoGenerateLabel:       false,
      partialPaymentThreshold: 0,
      requireFullPayment:      false,
      allowReturnCreation:     true,
    },
  });

  const [shippingCompanies, setShippingCompanies] = useState([]);

  /* ── fetch settings on open ─── */
  useEffect(() => {
    if (!isOpen) return;
    (async () => {
      setLoading(true);
      try {
        const [settingsRes, shippingRes] = await Promise.all([
          api.get("/orders/retry-settings"),
          api.get("/shipping/integrations/active").catch(() => ({ data: { integrations: [] } })),
        ]);
        if (settingsRes.data) {
          setSettings(prev => ({
            ...prev,
            ...settingsRes.data,
            shipping: { ...prev.shipping, ...(settingsRes.data.shipping ?? {}) },
          }));
        }
        const integrations = shippingRes.data?.integrations ?? shippingRes.data ?? [];
        setShippingCompanies(Array.isArray(integrations) ? integrations : []);
      } catch (e) {
        toast.error(normalizeAxiosError(e));
      } finally {
        setLoading(false);
      }
    })();
  }, [isOpen]);

  const patch         = (p) => setSettings(prev => ({ ...prev, ...p }));
  const patchShipping = (p) => setSettings(prev => ({ ...prev, shipping: { ...prev.shipping, ...p } }));

  const toggleCode = (field, code) =>
    patch({
      [field]: settings[field].includes(code)
        ? settings[field].filter(c => c !== code)
        : [...settings[field], code],
    });

  const handleSave = async () => {
    setSaving(true);
    try {
      await api.post("/orders/retry-settings", settings);
      toast.success(t("messages.settingsSaved"));
      onClose();
    } catch (e) {
      toast.error(normalizeAxiosError(e));
    } finally {
      setSaving(false);
    }
  };

  /* ═══════════════════════════════════════════════════════════
     RENDER
  ═══════════════════════════════════════════════════════════ */
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent
        showCloseButton={false}
        className="!max-w-2xl p-0 overflow-hidden rounded-2xl border border-border bg-background shadow-2xl gap-0 flex flex-col max-h-[90vh]"
      >

        {/* ────────────────── HEADER ────────────────── */}
        <div className="relative overflow-hidden shrink-0">
          {/* background tint */}
          <div className="absolute inset-0 pointer-events-none opacity-[0.06]
            bg-gradient-to-br from-[var(--primary)] to-[var(--third,#ff5c2b)]
            dark:from-[#5b4bff] dark:to-[#3be7ff]" />
          {/* bottom accent bar */}
          <div className="absolute inset-x-0 bottom-0 h-[2px]
            bg-gradient-to-r from-[var(--primary)] via-[var(--secondary,#ffb703)] to-[var(--third,#ff5c2b)]
            dark:from-[#5b4bff] dark:via-[#8b7cff] dark:to-[#3be7ff] opacity-60" />

          <div className="relative flex items-center gap-4 px-6 py-5">
            <div className="w-12 h-12 rounded-2xl flex items-center justify-center shrink-0
              bg-gradient-to-br from-[var(--primary)] to-[var(--third,#ff5c2b)]
              dark:from-[#5b4bff] dark:to-[#3be7ff]
              shadow-[0_6px_20px_rgba(var(--primary-shadow))]">
              <Settings size={22} className="text-white" />
            </div>
            <div className="flex-1 min-w-0">
              <h2 className="text-lg font-black tracking-tight text-foreground">
                {t("retrySettings.globalTitle")}
              </h2>
              <p className="text-xs text-muted-foreground mt-0.5">
                {t("retrySettings.globalDescription")}
              </p>
            </div>
            <motion.button
              whileHover={{ scale: 1.1, rotate: 90 }} whileTap={{ scale: 0.9 }}
              onClick={onClose}
              className="w-8 h-8 rounded-xl flex items-center justify-center
                bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-800
                text-red-500 hover:bg-red-100 transition-all shrink-0"
            >
              <X size={14} />
            </motion.button>
          </div>

          {/* Tab bar */}
          <div className="relative flex gap-1 px-5 pb-0">
            {TABS.map(tab => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.key;
              return (
                <button
                  key={tab.key}
                  onClick={() => setActiveTab(tab.key)}
                  className={cn(
                    "relative flex items-center gap-1.5 px-3.5 py-2.5 rounded-t-xl text-xs font-bold transition-all duration-200",
                    isActive
                      ? "text-[var(--primary)] dark:text-[#8b7cff] bg-background"
                      : "text-muted-foreground hover:text-foreground hover:bg-muted/40",
                  )}
                >
                  <Icon size={13} />
                  {t(tab.labelKey)}
                  {isActive && (
                    <motion.div
                      layoutId="tab-indicator"
                      className="absolute inset-x-3 -bottom-px h-[2px] rounded-full
                        bg-gradient-to-r from-[var(--primary)] to-[var(--third,#ff5c2b)]
                        dark:from-[#5b4bff] dark:to-[#3be7ff]"
                    />
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* ────────────────── BODY ────────────────── */}
        <div className="flex-1 overflow-y-auto">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-20 gap-4">
              <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-[var(--primary)]/10 to-[var(--primary)]/5
                flex items-center justify-center">
                <Loader2 size={24} className="animate-spin text-[var(--primary)] dark:text-[#5b4bff]" />
              </div>
              <p className="text-sm text-muted-foreground">{t("common.loading")}</p>
            </div>
          ) : (
            <AnimatePresence mode="wait">
              <motion.div
                key={activeTab}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.18 }}
                className="p-6 space-y-5"
              >

                {/* ══════════════ TAB: GENERAL ══════════════ */}
                {activeTab === "general" && (
                  <>
                    {/* Master on/off */}
                    <ToggleRow
                      label={t("retrySettings.enableRetry")}
                      description={t("retrySettings.enableRetryDesc")}
                      checked={settings.enabled}
                      onCheckedChange={v => patch({ enabled: v })}
                    />

                    {/* Retry limits card */}
                    <SectionCard
                      icon={RotateCcw}
                      iconColor="#ff8b00"
                      title={t("retrySettings.retryLimitsTitle")}
                      subtitle={t("retrySettings.retryLimitsSubtitle")}
                    >
                      <div className="grid grid-cols-2 gap-4">
                        <NumberField
                          label={t("retrySettings.maxRetries")}
                          description={t("retrySettings.maxRetriesDesc")}
                          value={settings.maxRetries}
                          onChange={e => patch({ maxRetries: parseInt(e.target.value) || 1 })}
                          min={1} max={10}
                        />
                        <NumberField
                          label={t("retrySettings.retryInterval")}
                          description={t("retrySettings.retryIntervalDesc")}
                          value={settings.retryInterval}
                          onChange={e => patch({ retryInterval: parseInt(e.target.value) || 5 })}
                          min={5} max={1440}
                          suffix={t("retrySettings.minutes")}
                        />
                      </div>
                    </SectionCard>

                    {/* Working hours */}
                    <div className="space-y-3">
                      <ToggleRow
                        label={t("retrySettings.workingHours")}
                        description={t("retrySettings.workingHoursDesc")}
                        checked={settings.workingHours?.enabled ?? false}
                        onCheckedChange={v =>
                          patch({ workingHours: { ...settings.workingHours, enabled: v } })
                        }
                      />
                      <AnimatePresence>
                        {settings.workingHours?.enabled && (
                          <motion.div
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: "auto", opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            className="overflow-hidden"
                          >
                            <div className="grid grid-cols-2 gap-4 pt-1">
                              {[
                                { key: "start", labelKey: "retrySettings.workingStart", def: "09:00" },
                                { key: "end",   labelKey: "retrySettings.workingEnd",   def: "18:00" },
                              ].map(f => (
                                <div key={f.key} className="space-y-1.5">
                                  <Label className="text-xs font-black uppercase tracking-wider text-muted-foreground/70">
                                    {t(f.labelKey)}
                                  </Label>
                                  <Input
                                    type="time"
                                    value={settings.workingHours?.[f.key] ?? f.def}
                                    onChange={e =>
                                      patch({ workingHours: { ...settings.workingHours, [f.key]: e.target.value } })
                                    }
                                    className="rounded-xl h-10"
                                  />
                                </div>
                              ))}
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                  </>
                )}

                {/* ══════════════ TAB: AUTOMATION ══════════════ */}
                {activeTab === "automation" && (
                  <div className="space-y-5">

                    {/* 1 — Auto-move status */}
                    <SectionCard
                      icon={Zap}
                      iconColor="#6366f1"
                      title={t("retrySettings.autoMoveTitle")}
                      subtitle={t("retrySettings.autoMoveSubtitle")}
                    >
                      <FieldSubLabel>{t("retrySettings.autoMoveStatus")}</FieldSubLabel>
                      <Select
                        value={settings.autoMoveStatus}
                        onValueChange={v => patch({ autoMoveStatus: v })}
                      >
                        <SelectTrigger className="h-10 rounded-xl text-sm">
                          <SelectValue placeholder={t("retrySettings.selectStatus")} />
                        </SelectTrigger>
                        <SelectContent>
                          {statuses.map(s => (
                            <SelectItem key={s.code || s.id} value={s.code || String(s.id)}>
                              <span className="flex items-center gap-2">
                                <span className="w-2 h-2 rounded-full shrink-0"
                                  style={{ backgroundColor: s.color || "#6366f1" }} />
                                {s.system ? t(`statuses.${s.code}`) : s.name}
                              </span>
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <p className="text-[11px] text-muted-foreground pt-0.5">
                        {t("retrySettings.autoMoveHint")}
                      </p>
                    </SectionCard>

                    {/* 2 — Retry statuses */}
                    <SectionCard
                      icon={RotateCcw}
                      iconColor="#ff8b00"
                      title={t("retrySettings.retryStatusesTitle")}
                      subtitle={t("retrySettings.retryStatusesSubtitle")}
                      badge={settings.retryStatuses.length}
                    >
                      <StatusMultiSelect
                        statuses={statuses}
                        selected={settings.retryStatuses}
                        onToggle={code => toggleCode("retryStatuses", code)}
                        onClear={() => patch({ retryStatuses: [] })}
                        placeholder={t("retrySettings.selectStatusesPlaceholder")}
                        t={t}
                      />
                      <p className="text-[11px] text-muted-foreground leading-relaxed">
                        {t("retrySettings.retryStatusesHint")}
                      </p>
                    </SectionCard>

                    {/* 3 — Confirmation statuses */}
                    <SectionCard
                      icon={CheckCheck}
                      iconColor="#10b981"
                      title={t("retrySettings.confirmationStatusesTitle")}
                      subtitle={t("retrySettings.confirmationStatusesSubtitle")}
                      badge={settings.confirmationStatuses.length}
                    >
                      <StatusMultiSelect
                        statuses={statuses}
                        selected={settings.confirmationStatuses}
                        onToggle={code => toggleCode("confirmationStatuses", code)}
                        onClear={() => patch({ confirmationStatuses: [] })}
                        placeholder={t("retrySettings.selectStatusesPlaceholder")}
                        t={t}
                      />
                      <p className="text-[11px] text-muted-foreground leading-relaxed">
                        {t("retrySettings.confirmationStatusesHint")}
                      </p>
                    </SectionCard>

                  </div>
                )}

                {/* ══════════════ TAB: SHIPPING ══════════════ */}
                {activeTab === "shipping" && (
                  <div className="space-y-4">

                    {/* Master toggle */}
                    <div className={cn(
                      "relative overflow-hidden rounded-2xl border-2 transition-all duration-300",
                      settings.shipping.autoSendToShipping
                        ? "border-[var(--primary)]/40 dark:border-[#5b4bff]/40"
                        : "border-border",
                    )}>
                      {settings.shipping.autoSendToShipping && (
                        <div className="absolute inset-x-0 top-0 h-[2.5px]
                          bg-gradient-to-r from-[var(--primary)] via-[var(--secondary,#ffb703)] to-[var(--third,#ff5c2b)]
                          dark:from-[#5b4bff] dark:via-[#8b7cff] dark:to-[#3be7ff]" />
                      )}
                      <div
                        className="p-4 flex items-center gap-4"
                        style={settings.shipping.autoSendToShipping ? { background: rgba("#ff8b00", 0.03) } : {}}
                      >
                        <div className={cn(
                          "w-11 h-11 rounded-xl flex items-center justify-center shrink-0 transition-all duration-300",
                          settings.shipping.autoSendToShipping
                            ? "bg-gradient-to-br from-[var(--primary)] to-[var(--third,#ff5c2b)] dark:from-[#5b4bff] dark:to-[#3be7ff] shadow-[0_4px_12px_rgba(var(--primary-shadow))]"
                            : "bg-muted border border-border",
                        )}>
                          <Truck size={18} className={settings.shipping.autoSendToShipping ? "text-white" : "text-muted-foreground"} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-black text-foreground">
                            {t("retrySettings.shipping.autoSend")}
                          </p>
                          <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed">
                            {t("retrySettings.shipping.autoSendDesc")}
                          </p>
                        </div>
                        {/* ms-auto = RTL/LTR safe */}
                        <Switch
                          checked={settings.shipping.autoSendToShipping}
                          onCheckedChange={v => patchShipping({ autoSendToShipping: v })}
                          className="shrink-0 ms-auto"
                        />
                      </div>
                    </div>

                    {/* Expanded shipping config */}
                    <AnimatePresence>
                      {settings.shipping.autoSendToShipping && (
                        <motion.div
                          initial={{ opacity: 0, y: 6 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: -6 }}
                          transition={{ duration: 0.22 }}
                          className="space-y-4"
                        >
                          {/* Card: Routing */}
                          <SectionCard
                            icon={Truck} iconColor="#ff8b00"
                            title={t("retrySettings.shipping.routing")}
                            subtitle={t("retrySettings.shipping.routingDesc")}
                          >
                            <div className="grid grid-cols-2 gap-3">
                              <div className="space-y-1.5">
                                <FieldSubLabel>{t("retrySettings.shipping.company")}</FieldSubLabel>
                                <Select
                                  value={settings.shipping.shippingCompanyId}
                                  onValueChange={v => patchShipping({ shippingCompanyId: v })}
                                >
                                  <SelectTrigger className="h-10 rounded-xl text-sm">
                                    <SelectValue placeholder={t("retrySettings.shipping.selectCompany")} />
                                  </SelectTrigger>
                                  <SelectContent>
                                    {shippingCompanies.length === 0 ? (
                                      <div className="py-4 text-center text-sm text-muted-foreground">
                                        {t("retrySettings.shipping.noCompanies")}
                                      </div>
                                    ) : shippingCompanies.map(c => (
                                      <SelectItem key={c.providerId ?? c.id} value={String(c.providerId ?? c.id)}>
                                        {c.name}
                                      </SelectItem>
                                    ))}
                                  </SelectContent>
                                </Select>
                              </div>
                              <div className="space-y-1.5">
                                <FieldSubLabel>{t("retrySettings.shipping.triggerStatus")}</FieldSubLabel>
                                <Select
                                  value={settings.shipping.triggerStatus}
                                  onValueChange={v => patchShipping({ triggerStatus: v })}
                                >
                                  <SelectTrigger className="h-10 rounded-xl text-sm">
                                    <SelectValue placeholder={t("retrySettings.shipping.selectTrigger")} />
                                  </SelectTrigger>
                                  <SelectContent>
                                    {statuses.map(s => (
                                      <SelectItem key={s.code || s.id} value={s.code || String(s.id)}>
                                        <span className="flex items-center gap-2">
                                          <span className="w-2 h-2 rounded-full shrink-0"
                                            style={{ backgroundColor: s.color || "#6366f1" }} />
                                          {s.system ? t(`statuses.${s.code}`) : s.name}
                                        </span>
                                      </SelectItem>
                                    ))}
                                  </SelectContent>
                                </Select>
                              </div>
                            </div>
                            <p className="text-[11px] text-muted-foreground pt-0.5">
                              {t("retrySettings.shipping.triggerStatusDesc")}
                            </p>
                          </SectionCard>

                          {/* Card: Payment */}
                          <SectionCard
                            icon={Shield} iconColor="#10b981"
                            title={t("retrySettings.shipping.paymentOptions")}
                            subtitle={t("retrySettings.shipping.paymentOptionsDesc")}
                          >
                            <InlineToggle
                              label={t("retrySettings.shipping.requireFullPayment")}
                              description={t("retrySettings.shipping.requireFullPaymentDesc")}
                              checked={settings.shipping.requireFullPayment}
                              onCheckedChange={v => patchShipping({ requireFullPayment: v })}
                            />

                            <AnimatePresence>
                              {!settings.shipping.requireFullPayment && (
                                <motion.div
                                  initial={{ height: 0, opacity: 0 }}
                                  animate={{ height: "auto", opacity: 1 }}
                                  exit={{ height: 0, opacity: 0 }}
                                  transition={{ duration: 0.18 }}
                                  className="overflow-hidden"
                                >
                                  <div className="mt-3 pt-3 border-t border-border/60">
                                    <div className="flex items-end gap-3">
                                      <div className="flex-1 space-y-1.5">
                                        <FieldSubLabel>{t("retrySettings.shipping.partialThreshold")}</FieldSubLabel>
                                        <div className="flex items-center gap-2">
                                          <Input
                                            type="number" min={0}
                                            value={settings.shipping.partialPaymentThreshold}
                                            onChange={e => patchShipping({ partialPaymentThreshold: parseInt(e.target.value) || 0 })}
                                            className="h-10 rounded-xl flex-1 text-sm"
                                          />
                                          <span className="text-xs text-muted-foreground shrink-0 font-semibold">
                                            {t("currency") ?? "EGP"}
                                          </span>
                                        </div>
                                      </div>
                                      <div className="mb-0.5 px-2.5 py-1 rounded-lg bg-emerald-50 dark:bg-emerald-950/30
                                        border border-emerald-200 dark:border-emerald-800">
                                        <p className="text-[10px] font-black text-emerald-600 dark:text-emerald-400">
                                          {settings.shipping.partialPaymentThreshold === 0
                                            ? t("retrySettings.shipping.anyDeposit")
                                            : `≥ ${settings.shipping.partialPaymentThreshold}`}
                                        </p>
                                      </div>
                                    </div>
                                    <p className="mt-1.5 text-[11px] text-muted-foreground">
                                      {t("retrySettings.shipping.partialThresholdDesc")}
                                    </p>
                                  </div>
                                </motion.div>
                              )}
                            </AnimatePresence>

                            <div className="h-px bg-border/60" />

                            <InlineToggle
                              label={t("retrySettings.shipping.requirePaymentConfirm")}
                              description={t("retrySettings.shipping.requirePaymentConfirmDesc")}
                              checked={settings.shipping.requirePaymentConfirm}
                              onCheckedChange={v => patchShipping({ requirePaymentConfirm: v })}
                            />
                          </SectionCard>

                          {/* Card: Automation Options */}
                          <SectionCard
                            icon={Zap} iconColor="#f59e0b"
                            title={t("retrySettings.shipping.otherOptions")}
                            subtitle={t("retrySettings.shipping.otherOptionsDesc")}
                          >
                            {[
                              { key: "autoGenerateLabel",   labelKey: "retrySettings.shipping.autoLabel",        descKey: "retrySettings.shipping.autoLabelDesc"        },
                              { key: "notifyOnShipment",    labelKey: "retrySettings.shipping.notifyOnShipment", descKey: "retrySettings.shipping.notifyOnShipmentDesc" },
                              { key: "allowReturnCreation", labelKey: "retrySettings.shipping.allowReturn",      descKey: "retrySettings.shipping.allowReturnDesc"      },
                            ].map((opt, i, arr) => (
                              <div key={opt.key}>
                                <InlineToggle
                                  label={t(opt.labelKey)}
                                  description={t(opt.descKey)}
                                  checked={settings.shipping[opt.key]}
                                  onCheckedChange={v => patchShipping({ [opt.key]: v })}
                                />
                                {i < arr.length - 1 && <div className="h-px bg-border/60 mt-3" />}
                              </div>
                            ))}
                          </SectionCard>
                        </motion.div>
                      )}
                    </AnimatePresence>

                    {/* Disabled hint */}
                    {!settings.shipping.autoSendToShipping && (
                      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                        className="flex items-start gap-3 p-4 rounded-xl bg-muted/30 border border-border/50">
                        <div className="w-8 h-8 rounded-lg bg-muted border border-border flex items-center justify-center shrink-0">
                          <AlertCircle size={14} className="text-muted-foreground/60" />
                        </div>
                        <div>
                          <p className="text-xs font-bold text-foreground mb-0.5">
                            {t("retrySettings.shipping.disabledTitle")}
                          </p>
                          <p className="text-xs text-muted-foreground leading-relaxed">
                            {t("retrySettings.shipping.disabledHint")}
                          </p>
                        </div>
                      </motion.div>
                    )}
                  </div>
                )}

                {/* ══════════════ TAB: NOTIFICATIONS ══════════════ */}
                {activeTab === "notifications" && (
                  <>
                    <ToggleRow
                      label={t("retrySettings.notifyEmployee")}
                      description={t("retrySettings.notifyEmployeeDesc")}
                      checked={settings.notifyEmployee}
                      onCheckedChange={v => patch({ notifyEmployee: v })}
                    />
                    <ToggleRow
                      label={t("retrySettings.notifyAdmin")}
                      description={t("retrySettings.notifyAdminDesc")}
                      checked={settings.notifyAdmin}
                      onCheckedChange={v => patch({ notifyAdmin: v })}
                    />

                    {/* Preview card */}
                    <div className="relative overflow-hidden rounded-2xl border border-[var(--primary)]/20 dark:border-[#5b4bff]/25 p-5">
                      <div className="absolute inset-0 pointer-events-none
                        bg-gradient-to-br from-[var(--primary)]/5 to-transparent dark:from-[#5b4bff]/8" />
                      <div className="absolute inset-x-0 top-0 h-[2px] opacity-60
                        bg-gradient-to-r from-[var(--primary)] via-[var(--secondary,#ffb703)] to-[var(--third,#ff5c2b)]
                        dark:from-[#5b4bff] dark:via-[#8b7cff] dark:to-[#3be7ff]" />
                      <div className="relative flex items-start gap-3">
                        <div className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0
                          bg-gradient-to-br from-[var(--primary)] to-[var(--third,#ff5c2b)]
                          dark:from-[#5b4bff] dark:to-[#3be7ff]">
                          <Bell size={15} className="text-white" />
                        </div>
                        <div>
                          <p className="text-sm font-black text-foreground mb-1.5">
                            {t("retrySettings.notificationPreview")}
                          </p>
                          <div className="px-3 py-2 rounded-xl bg-background border border-border text-xs text-muted-foreground">
                            {t("retrySettings.notificationPreviewText")}
                          </div>
                        </div>
                      </div>
                    </div>
                  </>
                )}

              </motion.div>
            </AnimatePresence>
          )}
        </div>

        {/* ────────────────── FOOTER ────────────────── */}
        {!loading && (
          <div className="shrink-0 flex items-center justify-end gap-3 px-6 py-4 border-t border-border bg-muted/20">
            <Button variant="outline" onClick={onClose} className="rounded-xl h-10 px-5 text-sm font-semibold">
              {t("common.cancel")}
            </Button>
            <motion.button
              whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.97 }}
              onClick={handleSave}
              disabled={saving}
              className="h-10 px-6 rounded-xl text-sm font-bold text-white flex items-center gap-2
                bg-gradient-to-r from-[var(--primary)] to-[var(--third,#ff5c2b)]
                dark:from-[#5b4bff] dark:to-[#3be7ff]
                shadow-[0_4px_16px_rgba(var(--primary-shadow))]
                hover:shadow-[0_6px_24px_rgba(var(--primary-shadow))]
                hover:brightness-110 disabled:opacity-50 disabled:cursor-not-allowed
                transition-all duration-200"
            >
              {saving
                ? <><Loader2 size={14} className="animate-spin" />{t("common.saving")}</>
                : <><Save size={14} />{t("common.save")}</>
              }
            </motion.button>
          </div>
        )}

      </DialogContent>
    </Dialog>
  );
}