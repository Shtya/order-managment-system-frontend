"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Settings,
  Save,
  Loader2,
  Bell,
  Zap,
  RefreshCw,
  X,
  Truck,
  Shield,
  AlertCircle,
  ChevronDown,
  RotateCcw,
  CheckCheck,
  Warehouse,
  Info,
  Layers,
  Archive,
  Mail,
  Copy,
  Users,
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
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useOrdersSettings } from "@/hook/useOrdersSettings";
import ShippingCompanyFilter from "@/components/atoms/ShippingCompanyFilter";
import { FieldTooltip } from "@/components/ui/field-tooltip";
import { P_08, P_04, P_12, P_20, P_25 } from "../../settings/page";
import { MdNotificationAdd } from "react-icons/md";
import { usePlatformSettings } from "@/context/PlatformSettingsContext";

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
  { key: "general", icon: Settings, labelKey: "retrySettings.tabs.general" },
  { key: "automation", icon: Zap, labelKey: "retrySettings.tabs.automation" },
  { key: "shipping", icon: Truck, labelKey: "retrySettings.tabs.shipping" },
  // {
  //   key: "warehouse",
  //   icon: Warehouse,
  //   labelKey: "retrySettings.tabs.warehouse",
  // }, // Added
  {
    key: "notifications",
    icon: Bell,
    labelKey: "retrySettings.tabs.notifications",
  },
  {
    key: "sync",
    icon: RefreshCw,
    labelKey: "retrySettings.tabs.sync",
  },
];

export default function GlobalRetrySettingsModal({
  isOpen,
  onClose,
  statuses = [],
}) {
  const t = useTranslations("orders");
  const [activeTab, setActiveTab] = useState("general");
  const {
    tempSettings,
    loading,
    saving,
    patch,
    patchShipping,
    handleSave,
    toggleCode,
  } = useOrdersSettings();

  async function save() {
    await handleSave(onClose);
  }
  /* ═══════════════════════════════════════════════════════════
     RENDER
  ═══════════════════════════════════════════════════════════ */
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent
        showCloseButton={false}
        className="!max-w-2xl p-0 overflow-hidden rounded-xl border border-border bg-background shadow-2xl gap-0 flex flex-col max-h-[90vh]"
      >
        {/* ────────────────── HEADER ────────────────── */}
        <div className="relative overflow-hidden shrink-0">
          {/* background tint */}
          <div
            className="absolute inset-0 pointer-events-none opacity-[0.06]
            bg-gradient-to-br from-[var(--primary)] to-[var(--third,var(--secondary))]
            dark:from-[#5b4bff] dark:to-[#3be7ff]"
          />
          {/* bottom accent bar */}
          <div
            className="absolute inset-x-0 bottom-0 h-[2px]
            bg-gradient-to-r from-[var(--primary)] via-[var(--secondary,var(--third))] to-[var(--third,var(--secondary))]
            dark:from-[#5b4bff] dark:via-[#8b7cff] dark:to-[#3be7ff] opacity-60"
          />

          <div className="relative flex items-center gap-3 sm:gap-4 px-4 py-4 sm:px-6 sm:py-5">
            {/* Icon Container */}
            <div
              className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl flex items-center justify-center shrink-0
    bg-gradient-to-br from-[var(--primary)] to-[var(--third,var(--secondary))]
    dark:from-[#5b4bff] dark:to-[#3be7ff]
    shadow-[0_6px_20px_rgba(var(--primary-shadow))]"
            >
              {/* تصغير الأيقونة قليلاً في الموبايل */}
              <Settings className="text-white w-5 h-5 sm:w-[22px] sm:h-[22px]" />
            </div>

            {/* Text Content */}
            <div className="flex-1 min-w-0">
              <h2 className="text-base sm:text-lg font-black tracking-tight text-foreground truncate">
                {t("retrySettings.globalTitle")}
              </h2>
              <p className="text-[10px] sm:text-xs text-muted-foreground mt-0.5 line-clamp-1 sm:line-clamp-none">
                {t("retrySettings.globalDescription")}
              </p>
            </div>

            {/* Close Button */}
            <motion.button
              whileHover={{ scale: 1.1, rotate: 90 }}
              whileTap={{ scale: 0.9 }}
              onClick={onClose}
              className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg sm:rounded-xl flex items-center justify-center bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-800 text-red-500 hover:bg-red-100 transition-all shrink-0"
            >
              <X size={14} className="sm:size-4" />
            </motion.button>
          </div>
          {/* Tab bar */}
          <div className="relative w-full overflow-x-auto overflow-y-hidden">
            <div className="flex gap-1 px-3 sm:px-5">
              {TABS.map((tab) => {
                const Icon = tab.icon;
                const isActive = activeTab === tab.key;

                return (
                  <button
                    key={tab.key}
                    onClick={() => setActiveTab(tab.key)}
                    className={cn(
                      "relative flex items-center gap-1.5 px-3 py-2.5 rounded-t-xl text-xs font-bold transition-all duration-200 whitespace-nowrap shrink-0",
                      isActive
                        ? "text-[var(--primary)] dark:text-[#8b7cff] bg-background"
                        : "text-muted-foreground hover:text-foreground hover:bg-muted/40"
                    )}
                  >
                    <Icon size={13} />
                    {t(tab.labelKey)}

                    {isActive && (
                      <motion.div
                        layoutId="tab-indicator"
                        className="absolute inset-x-2 -bottom-px h-[2px] rounded-full
              bg-gradient-to-r from-[var(--primary)] to-[var(--third,var(--secondary))]
              dark:from-[#5b4bff] dark:to-[#3be7ff]"
                      />
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-20 gap-4">
              <div
                className="w-14 h-14 rounded-xl bg-gradient-to-br from-[var(--primary)]/10 to-[var(--primary)]/5
                flex items-center justify-center"
              >
                <Loader2
                  size={24}
                  className="animate-spin text-[var(--primary)] dark:text-[#5b4bff]"
                />
              </div>
              <p className="text-sm text-muted-foreground">
                {t("common.loading")}
              </p>
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
                {activeTab === "general" && (
                  <GeneralTab settings={tempSettings} patch={patch} t={t} />
                )}

                {activeTab === "automation" && (
                  <AutomationTab
                    settings={tempSettings}
                    statuses={statuses}
                    patch={patch}
                    toggleCode={toggleCode}
                    t={t}
                  />
                )}

                {activeTab === "shipping" && (
                  <ShippingTab
                    settings={tempSettings}
                    statuses={statuses}
                    patchShipping={patchShipping}
                    patch={patch}
                    t={t}
                  />
                )}

                {activeTab === "warehouse" && (
                  <WarehouseTab settings={tempSettings} patch={patch} t={t} /> 
                )}

                {activeTab === "notifications" && (
                  <NotificationsSettingsTab settings={tempSettings} patch={patch} t={t} />
                )}

                {activeTab === "sync" && (
                  <SyncSettingsTab settings={tempSettings} patch={patch} t={t} />
                )}
              </motion.div>
            </AnimatePresence>
          )}
        </div>

        {/* ────────────────── FOOTER ────────────────── */}
        {!loading && (
          <div className="shrink-0 flex items-center justify-end gap-3 px-6 py-4 border-t border-border bg-muted/20">
            <Button
              variant="outline"
              onClick={onClose}
              className="rounded-xl h-10 px-5 text-sm font-semibold"
            >
              {t("common.cancel")}
            </Button>
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.97 }}
              onClick={save}
              disabled={saving}
              className="h-10 px-6 rounded-xl text-sm font-bold text-white flex items-center gap-2
                bg-gradient-to-r from-[var(--primary)] to-[var(--third,var(--secondary))]
                dark:from-[#5b4bff] dark:to-[#3be7ff]
                shadow-[0_4px_16px_rgba(var(--primary-shadow))]
                hover:shadow-[0_6px_24px_rgba(var(--primary-shadow))]
                hover:brightness-110 disabled:opacity-50 disabled:cursor-not-allowed
                transition-all duration-200"
            >
              {saving ? (
                <>
                  <Loader2 size={14} className="animate-spin" />
                  {t("actions.saving")}
                </>
              ) : (
                <>
                  <Save size={14} />
                  {t("common.save")}
                </>
              )}
            </motion.button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}

/* ══════════════════════════════════════════════════════════════
   STATUS MULTI-SELECT DROPDOWN
   Lifted directly from DistributionModal — same pattern, same UX.
   Used for "retry statuses" and "confirmation statuses".
══════════════════════════════════════════════════════════════ */
function StatusMultiSelect({
  statuses,
  selected, // string[] of codes
  onToggle, // (code: string) => void
  onClear, // () => void
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
        triggerRef.current &&
        !triggerRef.current.contains(e.target) &&
        dropdownRef.current &&
        !dropdownRef.current.contains(e.target)
      )
        setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const selectedObjects = useMemo(() => {
    const set = new Set(selected);
    return statuses.filter((s) => set.has(s.code || String(s.id)));
  }, [statuses, selected]);

  const count = selected.length;

  return (
    <div className="space-y-2">
      {/* ── Trigger button ─────────────────────────────────────── */}
      <div className="relative">
        <button
          ref={triggerRef}
          type="button"
          onClick={() => setOpen((v) => !v)}
          className={cn(
            "w-full flex items-center justify-between gap-2 h-11 px-4 rounded-xl",
            "border border-border bg-background text-sm transition-all duration-200",
            "hover:border-[var(--primary)] hover:shadow-[0_0_0_3px_rgba(255,139,0,0.08)]",
            open &&
            "border-[var(--primary)] shadow-[0_0_0_3px_rgba(255,139,0,0.1)]",
          )}
        >
          <span className="flex items-center gap-2 min-w-0 flex-1">
            {count > 0 ? (
              <>
                {/* color dot preview */}
                <span className="flex -space-x-1 shrink-0">
                  {selectedObjects.slice(0, 4).map((s) => (
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
            className={cn(
              "shrink-0 transition-colors",
              open ? "text-[var(--primary)]" : "text-muted-foreground",
            )}
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
              className="absolute z-50 mt-1.5 w-full bg-popover border border-border rounded-xl
                shadow-[0_8px_32px_rgba(0,0,0,0.12)] max-h-[232px] overflow-hidden"
            >
              {/* gradient strip */}
              <div
                className="h-[2px] w-full rounded-t-2xl bg-gradient-to-r
                from-[var(--primary)] via-[var(--secondary,var(--third))] to-[var(--third,var(--secondary))] opacity-70"
              />

              <div className="overflow-y-auto max-h-[230px] p-1.5 space-y-0.5">
                {statuses.length === 0 ? (
                  <div className="py-6 text-center text-sm text-muted-foreground flex items-center justify-center gap-2">
                    <Loader2 size={14} className="animate-spin" />
                    {t("messages.loading")}
                  </div>
                ) : (
                  statuses.map((s) => {
                    const code = s.code || String(s.id);
                    const isChecked = selected.includes(code);
                    const c = s.color || "#6366f1";
                    const label = s.system
                      ? t(`statuses.${s.code}`)
                      : s.name || s.code;

                    return (
                      <button
                        key={code}
                        type="button"
                        onClick={() => onToggle(code)}
                        style={{
                          backgroundColor: isChecked ? rgba(c, 0.1) : undefined,
                        }}
                        className={cn(
                          "w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm text-start transition-all duration-150",
                          !isChecked && "hover:bg-muted/60",
                        )}
                      >
                        {/* custom checkbox */}
                        <span
                          className="shrink-0 w-[18px] h-[18px] rounded-xl flex items-center justify-center transition-all duration-150"
                          style={{
                            border: `2px solid ${isChecked ? c : "var(--border)"}`,
                            backgroundColor: isChecked ? c : "transparent",
                          }}
                        >
                          {isChecked && (
                            <svg
                              width="10"
                              height="8"
                              viewBox="0 0 10 8"
                              fill="none"
                            >
                              <path
                                d="M1 4L3.8 7L9 1"
                                stroke="white"
                                strokeWidth="1.8"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                              />
                            </svg>
                          )}
                        </span>
                        {/* color dot */}
                        <span
                          className="w-2.5 h-2.5 rounded-full shrink-0"
                          style={{
                            backgroundColor: c,
                            boxShadow: `0 0 0 2px ${rgba(c, 0.2)}`,
                          }}
                        />
                        <span
                          className="flex-1 truncate font-medium transition-colors"
                          style={{
                            color: isChecked ? c : undefined,
                            fontWeight: isChecked ? 600 : 400,
                          }}
                        >
                          {label}
                        </span>
                        {isChecked && (
                          <motion.span
                            initial={{ scale: 0 }}
                            animate={{ scale: 1 }}
                            className="text-[10px] font-bold shrink-0"
                            style={{ color: rgba(c, 0.7) }}
                          >
                            ✓
                          </motion.span>
                        )}
                      </button>
                    );
                  })
                )}
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
            {selectedObjects.map((s) => {
              const code = s.code || String(s.id);
              const c = s.color || "#6366f1";
              const label = s.system
                ? t(`statuses.${s.code}`)
                : s.name || s.code;
              return (
                <motion.span
                  key={code}
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.8 }}
                  transition={{ type: "spring", stiffness: 400, damping: 25 }}
                  className="inline-flex items-center gap-1.5 ps-2.5 pe-1.5 py-1 rounded-xl text-xs font-bold border"
                  style={{
                    backgroundColor: rgba(c, 0.1),
                    borderColor: rgba(c, 0.3),
                    color: c,
                  }}
                >
                  <span
                    className="w-1.5 h-1.5 rounded-full shrink-0"
                    style={{ backgroundColor: c }}
                  />
                  {label}
                  <button
                    type="button"
                    onClick={() => onToggle(code)}
                    className="ms-0.5 w-4 h-4 rounded-xl flex items-center justify-center opacity-60 hover:opacity-100 transition-opacity"
                    style={{ color: c }}
                  >
                    <svg width="8" height="8" viewBox="0 0 8 8" fill="none">
                      <path
                        d="M1.5 1.5l5 5M6.5 1.5l-5 5"
                        stroke="currentColor"
                        strokeWidth="1.6"
                        strokeLinecap="round"
                      />
                    </svg>
                  </button>
                </motion.span>
              );
            })}
            {selectedObjects.length > 1 && (
              <motion.button
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                type="button"
                onClick={onClear}
                className="inline-flex items-center gap-1 px-2.5 py-1 rounded-xl text-xs font-bold
                  border border-dashed border-border text-muted-foreground
                  hover:border-red-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/20
                  transition-all duration-150"
              >
                <svg width="9" height="9" viewBox="0 0 9 9" fill="none">
                  <path
                    d="M1.5 1.5l6 6M7.5 1.5l-6 6"
                    stroke="currentColor"
                    strokeWidth="1.6"
                    strokeLinecap="round"
                  />
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
      style={checked ? { background: rgba("var(--primary)", 0.04) } : {}}
    >
      <div className="min-w-0 flex-1">
        <p className="text-sm font-bold text-foreground">{label}</p>
        {description && (
          <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed">
            {description}
          </p>
        )}
      </div>
      {/* ms-auto pushes to end in both LTR and RTL */}
      <Switch
        checked={checked}
        onCheckedChange={onCheckedChange}
        className="shrink-0 ms-auto"
      />
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
        {description && (
          <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed">
            {description}
          </p>
        )}
      </div>
      <Switch
        checked={checked}
        onCheckedChange={onCheckedChange}
        className="shrink-0 ms-auto"
      />
    </div>
  );
}

/* ══════════════════════════════════════════════════════════════
   NUMBER FIELD
══════════════════════════════════════════════════════════════ */
function NumberField({
  label,
  description,
  value,
  onChange,
  min,
  max,
  suffix,
}) {
  return (
    <div className="space-y-1.5">
      <Label className="text-xs font-black uppercase tracking-wider text-muted-foreground/80">
        {label}
      </Label>
      <div className="flex items-center gap-2 relative">
        <Input
          endIcon={
            suffix && (
              <span className=" text-sm text-muted-foreground shrink-0">
                {suffix}
              </span>
            )
          }
          type="number"
          min={min}
          max={max}
          value={value}
          onChange={onChange}
          className="rounded-xl h-10 flex-1"
        />
      </div>
      {
        description && (
          <p className="text-[11px] text-muted-foreground">{description}</p>
        )
      }
    </div >
  );
}

/* ══════════════════════════════════════════════════════════════
   SECTION CARD (used in Automation + Shipping tabs)
══════════════════════════════════════════════════════════════ */
function SectionCard({
  icon: Icon,
  iconColor,
  title,
  subtitle,
  badge,
  children,
}) {
  return (
    <div className="rounded-xl border border-border main-card !p-0 ">
      <div className="flex items-center gap-3 px-4 py-3 border-b border-border bg-muted/30">
        <div
          className="w-7 h-7 rounded-xl flex items-center justify-center shrink-0"
          style={{
            backgroundColor: rgba(iconColor, 0.12),
            border: `1px solid ${rgba(iconColor, 0.25)}`,
          }}
        >
          <Icon size={13} style={{ color: iconColor }} />
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-xs font-black text-foreground">{title}</p>
          {subtitle && (
            <p className="text-[10px] text-muted-foreground mt-0.5 leading-tight">
              {subtitle}
            </p>
          )}
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
    <p className="text-[10px] font-black uppercase tracking-wider text-muted-foreground/80">
      {children}
    </p>
  );
}

export function GeneralTab({ settings, patch, t }) {
  return (
    <div className="space-y-5">
      {/* Duplicate detection settings */}
      <SectionCard
        icon={Copy}
        iconColor="#3b82f6"
        title={t("retrySettings.duplicates.title")}
        subtitle={t("retrySettings.duplicates.subtitle")}
      >
        <div className="space-y-4">
          <div className="grid sm:grid-cols-2 gap-4">
            <NumberField
              label={t("retrySettings.duplicates.window")}
              description={t("retrySettings.duplicates.windowDesc")}
              value={settings.duplicateWindowHours}
              onChange={(e) =>
                patch({ duplicateWindowHours: parseInt(e.target.value) || 1 })
              }
              min={1}
              max={168}
              suffix={t("retrySettings.hours")}
            />
          </div>
          <div className="pt-2 border-t border-border/50">
            <ToggleRow
              label={t("retrySettings.duplicates.autoCancel")}
              description={t("retrySettings.duplicates.autoCancelDesc")}
              checked={settings.autoCancelDuplicates}
              onCheckedChange={(v) => patch({ autoCancelDuplicates: v })}
            />
          </div>
        </div>
      </SectionCard>

      {/* Auto Assignment section */}
      <SectionCard
        icon={Users}
        iconColor="#f59e0b"
        title={t("retrySettings.autoAssignment.title")}
        subtitle={t("retrySettings.autoAssignment.subtitle")}
      >
        <div className="space-y-3">
          <div
            className={`flex items-center gap-3 p-4 rounded-xl border-2 cursor-pointer transition-all ${settings.assignmentMode === "disabled" 
                ? "border-primary bg-primary/5" 
                : "border-slate-200 dark:border-slate-700"
            }`}
            onClick={() => patch({ assignmentMode: "disabled" })}
          >
            <div className="flex items-center justify-center w-5 h-5 rounded-full border-2 mr-2 transition-all" style={{ borderColor: settings.assignmentMode === "disabled" ? "#6366f1" : "#d1d5db" }}>
              {settings.assignmentMode === "disabled" && <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: "#6366f1" }} />}
            </div>
            <div className="flex-1">
              <div className="font-medium flex items-center gap-2">
                {t("retrySettings.autoAssignment.disabled")}
                <FieldTooltip description={t("retrySettings.autoAssignment.disabledDescription")} stopPropagation />
              </div>
              <div className="text-xs text-slate-500 dark:text-slate-400">{t("retrySettings.autoAssignment.disabledDesc")}</div>
            </div>
          </div>
          
          <div
            className={`flex items-center gap-3 p-4 rounded-xl border-2 cursor-pointer transition-all ${settings.assignmentMode === "immediate" 
                ? "border-primary bg-primary/5" 
                : "border-slate-200 dark:border-slate-700"
            }`}
            onClick={() => patch({ assignmentMode: "immediate" })}
          >
            <div className="flex items-center justify-center w-5 h-5 rounded-full border-2 mr-2 transition-all" style={{ borderColor: settings.assignmentMode === "immediate" ? "#6366f1" : "#d1d5db" }}>
              {settings.assignmentMode === "immediate" && <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: "#6366f1" }} />}
            </div>
            <div className="flex-1">
              <div className="font-medium flex items-center gap-2">
                {t("retrySettings.autoAssignment.immediate")}
                <FieldTooltip description={t("retrySettings.autoAssignment.immediateDescription")} stopPropagation />
              </div>
              <div className="text-xs text-slate-500 dark:text-slate-400">{t("retrySettings.autoAssignment.immediateDesc")}</div>
            </div>
          </div>
          
          <div
            className={`flex items-center gap-3 p-4 rounded-xl border-2 cursor-pointer transition-all ${settings.assignmentMode === "delayed" 
                ? "border-primary bg-primary/5" 
                : "border-slate-200 dark:border-slate-700"
            }`}
            onClick={() => patch({ assignmentMode: "delayed" })}
          >
            <div className="flex items-center justify-center w-5 h-5 rounded-full border-2 mr-2 transition-all" style={{ borderColor: settings.assignmentMode === "delayed" ? "#6366f1" : "#d1d5db" }}>
              {settings.assignmentMode === "delayed" && <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: "#6366f1" }} />}
            </div>
            <div className="flex-1">
              <div className="font-medium flex items-center gap-2">
                {t("retrySettings.autoAssignment.delayed")}
                <FieldTooltip description={t("retrySettings.autoAssignment.delayedDescription")} stopPropagation />
              </div>
              <div className="text-xs text-slate-500 dark:text-slate-400">{t("retrySettings.autoAssignment.delayedDesc")}</div>
            </div>
          </div>
        </div>
        
        {settings.assignmentMode === "delayed" && (
          <div className="mt-4 p-4 rounded-xl bg-slate-50 dark:bg-slate-800 space-y-3">
            <label className="text-sm font-medium">{t("retrySettings.autoAssignment.delayTime")}</label>
            <div className="flex gap-3">
              <div className="flex-1">
                <input
                  type="number"
                  min="1"
                  value={settings.assignmentDelay}
                  onChange={(e) => patch({ assignmentDelay: Math.max(1, parseInt(e.target.value) || 1) })}
                  className="w-full px-3  py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900"
                />
              </div>
              <select
                value={settings.assignmentDelayUnit}
                onChange={(e) => patch({ assignmentDelayUnit: e.target.value })}
                className="px-3  py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900"
              >
                <option value="minutes">{t("retrySettings.autoAssignment.minutes")}</option>
                <option value="hours">{t("retrySettings.autoAssignment.hours")}</option>
                <option value="days">{t("retrySettings.autoAssignment.days")}</option>
              </select>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400">{t("retrySettings.autoAssignment.delayTimeDesc")}</p>
          </div>
        )}
      </SectionCard>

      {/* Master on/off */}
      <ToggleRow
        label={t("retrySettings.enableRetry")}
        description={t("retrySettings.enableRetryDesc")}
        checked={settings.enabled}
        onCheckedChange={(v) => patch({ enabled: v })}
      />

      {/* Retry limits card */}
      <SectionCard
        icon={RotateCcw}
        iconColor="var(--primary)"
        title={t("retrySettings.retryLimitsTitle")}
        subtitle={t("retrySettings.retryLimitsSubtitle")}
      >
        <div className="grid sm:grid-cols-2 gap-4">
          <NumberField
            label={t("retrySettings.maxRetries")}
            description={t("retrySettings.maxRetriesDesc")}
            value={settings.maxRetries}
            onChange={(e) =>
              patch({ maxRetries: parseInt(e.target.value) || 1 })
            }
            min={1}
            max={10}
          />
          <NumberField
            label={t("retrySettings.retryInterval")}
            description={t("retrySettings.retryIntervalDesc")}
            value={settings.retryInterval}
            onChange={(e) =>
              patch({ retryInterval: parseInt(e.target.value) || 5 })
            }
            min={5}
            max={1440}
            suffix={t("retrySettings.minutes")}
          />
        </div>
      </SectionCard>

      {/* Working hours */}
      {/* <div className="space-y-3">
        <ToggleRow
          label={t("retrySettings.workingHours")}
          description={t("retrySettings.workingHoursDesc")}
          checked={settings.workingHours?.enabled ?? false}
          onCheckedChange={(v) =>
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
                  { key: "end", labelKey: "retrySettings.workingEnd", def: "18:00" },
                ].map((f) => (
                  <div key={f.key} className="space-y-1.5">
                    <Label className="text-xs font-black uppercase tracking-wider text-muted-foreground/80">
                      {t(f.labelKey)}
                    </Label>
                    <Input
                      type="time"
                      value={settings.workingHours?.[f.key] ?? f.def}
                      onChange={(e) =>
                        patch({
                          workingHours: { ...settings.workingHours, [f.key]: e.target.value },
                        })
                      }
                      className="rounded-xl h-10"
                    />
                  </div>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div> */}
    </div >
  );
}

// ────────────────────────────────────────────────────────────────────────────
// AUTOMATION TAB
// ────────────────────────────────────────────────────────────────────────────
export function AutomationTab({ settings, statuses, patch, toggleCode, t }) {
  return (
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
          onValueChange={(v) => patch({ autoMoveStatus: v })}
        >
          <SelectTrigger className="h-10 rounded-xl text-sm">
            <SelectValue placeholder={t("retrySettings.selectStatus")} />
          </SelectTrigger>
          <SelectContent>
            {statuses.map((s) => (
              <SelectItem key={s.code || s.id} value={s.code || String(s.id)}>
                <span className="flex items-center gap-2">
                  <span
                    className="w-2 h-2 rounded-full shrink-0"
                    style={{ backgroundColor: s.color || "#6366f1" }}
                  />
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
        iconColor="var(--primary)"
        title={t("retrySettings.retryStatusesTitle")}
        subtitle={t("retrySettings.retryStatusesSubtitle")}
        badge={settings.retryStatuses.length}
      >
        <StatusMultiSelect
          statuses={statuses}
          selected={settings.retryStatuses}
          onToggle={(code) => toggleCode("retryStatuses", code)}
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
          onToggle={(code) => toggleCode("confirmationStatuses", code)}
          onClear={() => patch({ confirmationStatuses: [] })}
          placeholder={t("retrySettings.selectStatusesPlaceholder")}
          t={t}
        />
        <p className="text-[11px] text-muted-foreground leading-relaxed">
          {t("retrySettings.confirmationStatusesHint")}
        </p>
      </SectionCard>
    </div>
  );
}

// ────────────────────────────────────────────────────────────────────────────
// SHIPPING TAB
// ────────────────────────────────────────────────────────────────────────────
export function ShippingTab({ settings, patch, t }) {
  const { shippingCompanies } = usePlatformSettings();
  const hasMoreCompanies = shippingCompanies.length > 0;
  const isShipment = settings?.orderFlowPath === "shipping";

  return (
    <div className="space-y-4">
      {/* Master toggle */}
      <div
        className={cn(
          "relative overflow-hidden rounded-xl border-2 transition-all duration-300",
          isShipment
            ? "border-[var(--primary)]/40 dark:border-[#5b4bff]/40"
            : "border-border",
        )}
      >
        {isShipment && (
          <div
            className="absolute inset-x-0 top-0 h-[2.5px]
              bg-gradient-to-r from-[var(--primary)] via-[var(--secondary,var(--third))] to-[var(--third,var(--secondary))]
              dark:from-[#5b4bff] dark:via-[#8b7cff] dark:to-[#3be7ff]"
          />
        )}
        <SectionCard
          icon={Warehouse}
          iconColor="#8b5cf6"
          title={t("retrySettings.warehouse.flowTitle")}
          subtitle={t("retrySettings.warehouse.flowSubtitle")}
        >
          <div className="space-y-3">
            <FieldSubLabel>
              {t("retrySettings.warehouse.flowLabel")}
            </FieldSubLabel>

            <Select
              value={settings.orderFlowPath}
              onValueChange={(v) => patch({ orderFlowPath: v })}
            >
              <SelectTrigger className="h-12 rounded-xl text-sm border-2">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="warehouse">
                  <div className="flex flex-col py-1">
                    <span>{t("retrySettings.warehouse.afterConfirmation")}</span>
                  </div>
                </SelectItem>
                <SelectItem value="shipping">
                  <div className="flex flex-col py-1">
                    <span>{t("retrySettings.warehouse.directToShipping")}</span>
                  </div>
                </SelectItem>
              </SelectContent>
            </Select>

            <div className="flex gap-2 items-start mt-2 bg-muted/30 p-3 rounded-lg">
              <Info size={14} className="mt-0.5 text-muted-foreground shrink-0" />
              <p className="text-[11px] text-muted-foreground leading-relaxed">
                {t("retrySettings.warehouse.flowHint")}
              </p>
            </div>
          </div>
        </SectionCard>

      </div>

      {/* Card: Stock Management */}
      <SectionCard
        icon={Archive}
        iconColor="#10b981"
        title={t("retrySettings.stock.title")}
        subtitle={t("retrySettings.stock.subtitle")}
      >
        <div className="flex items-center justify-between gap-4">
          <div className="flex-1">
            <p className="text-sm font-bold text-foreground">
              {t("retrySettings.stock.deductionStrategy")}
            </p>
            <p className="text-[11px] text-muted-foreground mt-0.5">
              {t("retrySettings.stock.deductionStrategyDesc")}
            </p>
          </div>
          <Select
            value={settings.stockDeductionStrategy}
            onValueChange={(v) => patch({ stockDeductionStrategy: v })}
          >
            <SelectTrigger className="w-44 h-10 rounded-xl text-xs border-2">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="on_confirmation">
                {t("retrySettings.stock.onConfirmation")}
              </SelectItem>
              <SelectItem value="on_shipment">
                {t("retrySettings.stock.onShipment")}
              </SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="mt-5 pt-5 border-t border-border/60">
          <ToggleRow
            label={t("retrySettings.stock.reservedEnabled")}
            description={t("retrySettings.stock.reservedEnabledDesc")}
            checked={settings.reservedEnabled !== false}
            onCheckedChange={(v) => patch({ reservedEnabled: v })}
          />
        </div>
      </SectionCard>
      {/* Disabled hint */}

    </div >
  );
}

// ────────────────────────────────────────────────────────────────────────────
// WAREHOUSE TAB
// ────────────────────────────────────────────────────────────────────────────
export function WarehouseTab({ settings, patch, t }) {
  return (
    <div className="space-y-5">
      <SectionCard
        icon={Warehouse}
        iconColor="#8b5cf6"
        title={t("retrySettings.warehouse.flowTitle")}
        subtitle={t("retrySettings.warehouse.flowSubtitle")}
      >
        <div className="space-y-3">
          <FieldSubLabel>
            {t("retrySettings.warehouse.flowLabel")}
          </FieldSubLabel>

          <Select
            value={settings.orderFlowPath}
            onValueChange={(v) => patch({ orderFlowPath: v })}
          >
            <SelectTrigger className="h-12 rounded-xl text-sm border-2">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="warehouse">
                <div className="flex flex-col py-1">
                  <span>{t("retrySettings.warehouse.afterConfirmation")}</span>
                </div>
              </SelectItem>
              <SelectItem value="shipping">
                <div className="flex flex-col py-1">
                  <span>{t("retrySettings.warehouse.directToShipping")}</span>
                </div>
              </SelectItem>
            </SelectContent>
          </Select>

          <div className="flex gap-2 items-start mt-2 bg-muted/30 p-3 rounded-lg">
            <Info size={14} className="mt-0.5 text-muted-foreground shrink-0" />
            <p className="text-[11px] text-muted-foreground leading-relaxed">
              {t("retrySettings.warehouse.flowHint")}
            </p>
          </div>
        </div>
      </SectionCard>
    </div>
  );
}

// ────────────────────────────────────────────────────────────────────────────
// NOTIFICATIONS TAB
// ────────────────────────────────────────────────────────────────────────────

export function NotificationsSettingsTab({ settings, patch, t }) {
  return (
    <>
      <ToggleRow
        label={t("retrySettings.notifyAdmin")}
        description={t("retrySettings.notifyAdminDesc")}
        checked={settings.notifyAdmin}
        onCheckedChange={(v) => patch({ notifyAdmin: v })}
      />

      {/* Preview card */}
      <div className="relative overflow-hidden rounded-xl border border-[var(--primary)]/20 dark:border-[#5b4bff]/25 p-5 mt-4">
        <div
          className="absolute inset-0 pointer-events-none
            bg-gradient-to-br from-[var(--primary)]/5 to-transparent dark:from-[#5b4bff]/8"
        />
        <div
          className="absolute inset-x-0 top-0 h-[2px] opacity-60
            bg-gradient-to-r from-[var(--primary)] via-[var(--secondary,var(--third))] to-[var(--third,var(--secondary))]
            dark:from-[rgb(91,75,255)] dark:via-[#8b7cff] dark:to-[#3be7ff]"
        />
        <div className="relative flex items-start gap-3">
          <div
            className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0
              bg-gradient-to-br from-[var(--primary)] to-[var(--third,var(--secondary))]
              dark:from-[#5b4bff] dark:to-[#3be7ff]"
          >
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
  );
}
// ═══════════════════════════════════════════════════════════════════════════
// TAB CONFIGURATION
// ═══════════════════════════════════════════════════════════════════════════

// ═══════════════════════════════════════════════════════════════════════════
// MAIN SETTINGS MODAL

/* ══════════════════════════════════════════════════════════════
   SYNC / STORE SETTINGS TAB
══════════════════════════════════════════════════════════════ */
const STORE_PROVIDER_LABELS = {
  easyorder: "EasyOrder",
  shopify: "Shopify",
  woocommerce: "WooCommerce",
};

export function SyncSettingsTab({ settings, patch }) {
  const tStores = useTranslations("storeIntegrations");
  const t = useTranslations("orders.retrySettings");
  const [stores, setStores] = useState([]);
  const [storesLoading, setStoresLoading] = useState(true);
  const [storeSavingId, setStoreSavingId] = useState(null);

  const fetchStores = useCallback(async () => {
    try {
      setStoresLoading(true);
      const res = await api.get("/stores");
      const records = res.data?.records || [];
      setStores(Array.isArray(records) ? records : []);
    } catch (e) {
      toast.error(normalizeAxiosError(e));
    } finally {
      setStoresLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchStores();
  }, [fetchStores]);

  const connectedStores = useMemo(
    () => stores.filter((s) => s.isIntegrated),
    [stores],
  );

  const handleStoreSyncToggle = async (store, checked, field = "syncNewProducts") => {
    setStoreSavingId(store.id);
    try {
      await api.patch(`/stores/${store.id}`, { [field]: !!checked });
      setStores((prev) =>
        prev.map((s) =>
          s.id === store.id ? { ...s, [field]: !!checked } : s,
        ),
      );
      toast.success(t("sync.storeSyncUpdated"));
    } catch (e) {
      toast.error(normalizeAxiosError(e));
    } finally {
      setStoreSavingId(null);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6"
    >

      <div className="space-y-3">
        <motion.div
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center gap-3"
        >
          <div
            className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0"
            style={{ background: P_12, border: `1px solid ${P_20}` }}
          >
            <Layers size={16} style={{ color: "var(--primary)" }} />
          </div>
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
            <p className="text-sm font-bold text-foreground">
              {t("sync.storesTitle")}
            </p>
            <p className="text-xs text-muted-foreground mt-0.5">
              {t("sync.storesSubtitle")}
            </p>
          </motion.div>
        </motion.div>

        {storesLoading ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex items-center justify-center py-10 gap-2 text-muted-foreground"
          >
            <Loader2 size={18} className="animate-spin text-[var(--primary)]" />
            <span className="text-sm">{t("messages.loading")}</span>
          </motion.div>
        ) : connectedStores.length === 0 ? (
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-sm text-muted-foreground py-6 text-center rounded-xl border border-dashed border-border bg-muted/20"
          >
            {t("sync.noConnectedStores")}
          </motion.p>
        ) : (
          <motion.div
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-2"
          >
            {connectedStores.map((store) => {
              const busy = storeSavingId === store.id;
              const providerLabel =
                STORE_PROVIDER_LABELS[store.provider] || store.provider;

              return (
                <motion.div
                  key={store.id}
                  layout
                  className={cn(
                    "flex flex-col sm:flex-row sm:items-center gap-3 p-4 rounded-xl border border-border bg-muted/10",
                    busy && "opacity-70 pointer-events-none",
                  )}
                >
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-bold text-foreground truncate">
                      {store.name}
                    </p>
                    <div className="flex flex-wrap items-center gap-2 mt-1">
                      <Badge variant="secondary" className="text-[10px] font-semibold">
                        {providerLabel}
                      </Badge>
                      {!store.isActive && (
                        <Badge variant="outline" className="text-[10px]">
                          {t("sync.storeInactive")}
                        </Badge>
                      )}
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center gap-2 shrink-0">
                    <motion.div className="flex items-center gap-2 h-[34px] px-2 rounded-lg border border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40">
                      <Checkbox
                        id={`sync-new-${store.id}`}
                        checked={!!store.syncNewProducts}
                        disabled={busy}
                        onCheckedChange={(checked) =>
                          handleStoreSyncToggle(store, checked, "syncNewProducts")
                        }
                        className="h-6 w-6 border-slate-300 dark:border-slate-600 data-[state=checked]:bg-primary data-[state=checked]:border-primary"
                      />
                      <Label
                        htmlFor={`sync-new-${store.id}`}
                        className="text-xs font-semibold text-gray-600 dark:text-slate-300 cursor-pointer"
                      >
                        {tStores("form.syncNewProducts")}
                      </Label>
                    </motion.div>

                    <motion.div className="flex items-center gap-2 h-[34px] px-2 rounded-lg border border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40">
                      <Checkbox
                        id={`sync-remote-${store.id}`}
                        checked={!!store.syncRemoteProducts}
                        disabled={busy}
                        onCheckedChange={(checked) =>
                          handleStoreSyncToggle(store, checked, "syncRemoteProducts")
                        }
                        className="h-6 w-6 border-slate-300 dark:border-slate-600 data-[state=checked]:bg-primary data-[state=checked]:border-primary"
                      />
                      <Label
                        htmlFor={`sync-remote-${store.id}`}
                        className="text-xs font-semibold text-gray-600 dark:text-slate-300 cursor-pointer"
                      >
                        {tStores("form.syncRemoteProducts")}
                      </Label>
                    </motion.div>
                  </div>
                </motion.div>
              );
            })}
          </motion.div>
        )}
      </div>
      <div className="mt-5 pt-5 border-t border-border/60">
        <ToggleRow
          label={t("sync.skuFallbackTitle")}
          description={t("sync.skuFallbackDesc")}
          checked={settings.storeOrderSkuFallback !== false}
          onCheckedChange={(v) => patch({ storeOrderSkuFallback: v })}
        />
      </div>

    </motion.div>
  );
}

/* ══════════════════════════════════════════════════════════════
   MAIN COMPONENT
══════════════════════════════════════════════════════════════ */

