"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import toast from "react-hot-toast";
import {
  Settings2,
  Layers,
  User,
  Bell,
  Shield,
  Plus,
  Edit2,
  Trash2,
  Save,
  X,
  XCircle,
  Upload,
  Loader2,
  Camera,
  Globe,
  Monitor,
  Moon,
  Sun,
  MapPin,
  Warehouse,
  Store,
  Building2,
  Hash,
  FileText,
  Phone,
  Zap,
  Truck,
  Mail,
  KeyRound,
  RefreshCw,
  Lock,
  Copy,
  ChevronRight,
  MoreVertical,
  Eye,
  Archive,
} from "lucide-react";

import { useForm, Controller } from "react-hook-form";
import * as yup from "yup";
import { yupResolver } from "@hookform/resolvers/yup";

import api from "@/utils/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import { useLocale, useTranslations } from "next-intl";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { cn } from "@/utils/cn";
import { getUser } from "../../../hook/getUser";
import SlugInput, { useSlugify } from "@/components/atoms/SlugInput";
import {
  AutomationTab,
  GeneralTab,
  ShippingTab,
  WarehouseTab,
  NotificationsSettingsTab
} from "../orders/atoms/SettingsModal";
import { useOrdersSettings } from "@/hook/useOrdersSettings";
import { useTheme } from "next-themes";
import { usePathname, useRouter } from "@/i18n/navigation";
import { avatarSrc } from "@/components/atoms/UserSelect";
import { BIZ_TYPES_KEYS } from "../auth/tabs/Signup";
import { IconArrow, OtpInput, PasswordStrength } from "../auth/tabs/AuthUi";
import PageHeader from "@/components/atoms/Pageheader";
import Button_ from "@/components/atoms/Button";
import { useAuth } from "@/context/AuthContext";

// ── Design tokens ─────────────────────────────────────────────────────────────
export const P_04 = "color-mix(in oklab, var(--primary)  4%, transparent)";
export const P_08 = "color-mix(in oklab, var(--primary)  8%, transparent)";
export const P_12 = "color-mix(in oklab, var(--primary) 12%, transparent)";
export const P_20 = "color-mix(in oklab, var(--primary) 20%, transparent)";
export const P_25 = "color-mix(in oklab, var(--primary) 25%, transparent)";

// ── Accent bar ────────────────────────────────────────────────────────────────
function AccentBar({ className }) {
  return (
    <div
      aria-hidden
      className={cn(
        "h-[2.5px] bg-gradient-to-r from-[var(--primary)] via-[var(--secondary,var(--third))] to-[var(--third,var(--secondary))]",
        className,
      )}
    />
  );
}

// ── Section heading ───────────────────────────────────────────────────────────
function SectionHead({ title, subtitle }) {
  return (
    <div className="mb-6">
      <h2 className="text-xl font-black text-foreground tracking-tight">
        {title}
      </h2>
      {subtitle && (
        <p className="text-sm text-muted-foreground mt-1">{subtitle}</p>
      )}
    </div>
  );
}

// ── Setting card shell ────────────────────────────────────────────────────────
function SettingCard({ children, className }) {
  return (
    <div
      className={cn(
        "relative rounded-2xl border border-border/50 main-card overflow-hidden",
        "shadow-[0_1px_3px_rgba(0,0,0,0.05),0_4px_16px_rgba(0,0,0,0.04)]",
        className,
      )}
    >
      {children}
    </div>
  );
}

// ── Form field wrapper ────────────────────────────────────────────────────────
function Field({ label, error, children, className, required }) {
  return (
    <div className={cn("space-y-1.5", className)}>
      {label && (
        <label className="text-xs font-semibold text-muted-foreground/80 uppercase tracking-wider block">
          {label}
          {required && <span className="text-destructive ml-1">*</span>}
        </label>
      )}
      {children}
      {error && (
        <p className="text-[11px] text-destructive flex items-center gap-1">
          <XCircle size={11} /> {error}
        </p>
      )}
    </div>
  );
}

// ── Sub-tab bar ───────────────────────────────────────────────────────────────
function SubTabBar({ tabs, active, setActive }) {
  return (
    <div className="flex gap-1 border-b border-border/40 mb-6 overflow-y-hidden overflow-x-auto">
      {tabs.map(({ key, label, icon: Icon }) => {
        const isActive = active === key;
        return (
          <button
            key={key}
            onClick={() => setActive(key)}
            className={cn(
              "relative flex items-center gap-1.5 px-3.5 py-3 text-xs font-bold",
              "whitespace-nowrap border-b-2 -mb-px transition-colors duration-150 border-transparent text-muted-foreground hover:text-foreground",
            )}
          >
            {Icon && <Icon size={13} />}
            {label}
            {isActive && (
              <motion.span
                layoutId="subtab-pill"
                className="absolute inset-x-2 bottom-0 h-[2px] rounded-full bg-[var(--primary)]"
              />
            )}
          </button>
        );
      })}
    </div>
  );
}

// ── Save footer ───────────────────────────────────────────────────────────────
function SaveFooter({ onSave, saving, label }) {
  return (
    <div className="flex justify-end pt-5 mt-5 border-t border-border/40">
      <motion.button
        whileHover={{ scale: 1.02, y: -1 }}
        whileTap={{ scale: 0.97 }}
        onClick={onSave}
        disabled={saving}
        className={cn(
          "inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold",
          "bg-[var(--primary)] text-white shadow-[0_2px_12px_color-mix(in_oklab,var(--primary)_30%,transparent)]",
          "hover:opacity-90 transition-all disabled:opacity-50 disabled:cursor-not-allowed",
        )}
      >
        {saving ? (
          <Loader2 size={14} className="animate-spin" />
        ) : (
          <Save size={14} />
        )}
        {label}
      </motion.button>
    </div>
  );
}

// ── Skeleton bone ─────────────────────────────────────────────────────────────
function Bone({ className }) {
  return (
    <div className={cn("rounded-xl bg-muted/50 animate-pulse", className)} />
  );
}

function FormSkeleton({ rows = 4 }) {
  return (
    <div className="space-y-4">
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="space-y-1.5">
          <Bone className="h-3 w-20" />
          <Bone className="h-11 w-full" />
        </div>
      ))}
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════
   PHONE HELPERS
═══════════════════════════════════════════════════════════════ */
export const COUNTRIES = [
  {
    key: "SA",
    nameAr: "السعودية",
    dialCode: "+966",
    phone: { min: 9, max: 9, regex: /^5\d{8}$/ },
    placeholder: "5XXXXXXXX",
  },
  {
    key: "EG",
    nameAr: "مصر",
    dialCode: "+20",
    phone: { min: 10, max: 10, regex: /^(10|11|12|15)\d{8}$/ },
    placeholder: "1XXXXXXXXX",
  },
  {
    key: "AE",
    nameAr: "الإمارات",
    dialCode: "+971",
    phone: { min: 9, max: 9, regex: /^5\d{8}$/ },
    placeholder: "5XXXXXXXX",
  },
  {
    key: "KW",
    nameAr: "الكويت",
    dialCode: "+965",
    phone: { min: 8, max: 8, regex: /^\d{8}$/ },
    placeholder: "XXXXXXXX",
  },
  {
    key: "QA",
    nameAr: "قطر",
    dialCode: "+974",
    phone: { min: 8, max: 8, regex: /^\d{8}$/ },
    placeholder: "XXXXXXXX",
  },
  {
    key: "BH",
    nameAr: "البحرين",
    dialCode: "+973",
    phone: { min: 8, max: 8, regex: /^\d{8}$/ },
    placeholder: "XXXXXXXX",
  },
  {
    key: "JO",
    nameAr: "الأردن",
    dialCode: "+962",
    phone: { min: 9, max: 9, regex: /^7\d{8}$/ },
    placeholder: "7XXXXXXXX",
  },
];

function digitsOnly(v) {
  return (v || "").replace(/\D/g, "");
}

function validatePhone(raw, country, t) {
  const v = digitsOnly(raw);
  if (!v) return t("phone.required");
  if (v.length < country.phone.min || v.length > country.phone.max) {
    return country.phone.min === country.phone.max
      ? t("phone.lengthExact", { min: country.phone.min })
      : t("phone.lengthRange", { min: country.phone.min, max: country.phone.max });
  }
  if (
    v.length === country.phone.max &&
    country.phone.regex &&
    !country.phone.regex.test(v)
  )
    return t("phone.invalidForCountry");
  return "";
}

function parsePhoneToCountry(phone) {
  const raw = String(phone || "").trim();
  if (!raw) return { countryKey: "EG", localDigits: "" };
  const normalized = raw.startsWith("+") ? raw : `+${raw}`;
  const matched = COUNTRIES.find((c) => normalized.startsWith(c.dialCode));
  if (matched)
    return {
      countryKey: matched.key,
      localDigits: digitsOnly(normalized.slice(matched.dialCode.length)),
    };
  return { countryKey: "EG", localDigits: digitsOnly(raw) };
}

function normalizeAxiosError(err) {
  const msg =
    err?.response?.data?.message ??
    err?.response?.data?.error ??
    err?.message ??
    "Unexpected error";
  return Array.isArray(msg) ? msg.join(", ") : String(msg);
}

function makeId() {
  return crypto.randomUUID();
}

/* ═══════════════════════════════════════════════════════════════
   SCHEMAS
═══════════════════════════════════════════════════════════════ */
const createCategorySchema = (t) => yup.object({
  name: yup
    .string()
    .trim()
    .max(160, t("categories.validation.nameMax", { max: 160 }))
    .required(t("categories.validation.nameRequired")),

  slug: yup
    .string()
    .trim()
    .max(200, t("categories.validation.slugMax", { max: 200 }))
    .required(t("categories.validation.slugRequired"))
    .matches(
      /^[a-z0-9]+(?:-[a-z0-9]+)*$/,
      t("categories.validation.slugInvalid")
    ),
});
const createAccountSchema = (t) => yup.object({
  name: yup.string().trim().required(t("account.validation.nameRequired")),
  email: yup
    .string()
    .trim()
    .email(t("account.validation.emailInvalid"))
    .required(t("account.validation.emailRequired")),
  employeeType: yup.string().trim().nullable(),
});

const createCompanySchema = (t) =>
  yup.object({
    country: yup.string().required(t("company.validation.countryRequired")),
    currency: yup.string().required(t("company.validation.currencyRequired")),
    name: yup.string().trim().required(t("company.validation.nameRequired")),
    tax: yup.string().trim(),
    commercial: yup.string().trim(),
    businessType: yup
      .string()
      .required(t("company.validation.businessRequired")),
    phone: yup.string().trim(),
    website: yup
      .string()
      .trim()
      .notRequired()
      .nullable()
      .test(
        "is-url-or-empty",
        t("company.validation.invalidUrl"),
        (v) => !v || /^https?:\/\//.test(v),
      ),
    address: yup.string().trim(),
  });

/* ═══════════════════════════════════════════════════════════════
   CONSTANTS
═══════════════════════════════════════════════════════════════ */
const SETTINGS_TABS = [
  { key: "general", icon: Settings2, labelKey: "retrySettings.tabs.general" },
  { key: "automation", icon: Zap, labelKey: "retrySettings.tabs.automation" },
  { key: "shipping", icon: Truck, labelKey: "retrySettings.tabs.shipping" },
  // {
  //   key: "warehouse",
  //   icon: Warehouse,
  //   labelKey: "retrySettings.tabs.warehouse",
  // },
  {
    key: "notifications",
    icon: Bell,
    labelKey: "retrySettings.tabs.notifications",
  },
];

const SECURITY_TABS = [
  { key: "password", icon: Lock, labelKey: "tabs.password.label" },
  { key: "email", icon: Mail, labelKey: "tabs.email.label" },
];

/* ═══════════════════════════════════════════════════════════════
   MAIN PAGE
═══════════════════════════════════════════════════════════════ */
export default function SettingsPage() {
  const tOrders = useTranslations("orders");
  const [activeTab, setActiveTab] = useState("company");
  const t = useTranslations("settings");

  const TABS = [
    { id: "company", label: t("tabs.company.label"), icon: Building2 },
    {
      id: "configuration",
      label: t("tabs.configuration.label"),
      icon: Settings2,
    },
    // { id: "categories", label: t("tabs.categories.label"), icon: Layers },
    { id: "account", label: t("tabs.account.label"), icon: User },
    { id: "security", label: t("tabs.security.label"), icon: Shield },
    { id: "notifications", label: t("tabs.notifications.label"), icon: Bell },
  ];

  const content = {
    company: <CompanyTab />,
    configuration: <SettingsTab />,
    // categories: <CategoriesTab />,
    account: <AccountTab />,
    security: <SecurityTab />,
    notifications: <NotificationsTab />,
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="min-h-screen p-4 md:p-6"
    >
      <div className="max-w-6xl mx-auto space-y-6">
        <PageHeader
          breadcrumbs={[
            { name: t("breadcrumb.home"), href: "/dashboard" },
            { name: t("header.title") },
          ]}
          buttons={
            <Button_
              size="sm"
              label={t("header.refresh")}
              tone="ghost"
              variant="cancel"
              icon={<RefreshCw size={14} />}
              className="bg-white! dark:bg-slate-800! text-slate-600! dark:text-slate-300!"
              onClick={() => window.location.reload()}
            />
          }
          items={TABS.map((tab) => ({ id: tab.id, label: tab.label }))}
          active={activeTab}
          setActive={setActiveTab}
        />

        {/* Content card */}
        <div className="relative  main-card rounded-2xl border border-border/50 overflow-hidden shadow-[0_1px_3px_rgba(0,0,0,0.05),0_8px_32px_rgba(0,0,0,0.05)]">
          <AnimatePresence mode="wait">
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.18, ease: [0.16, 1, 0.3, 1] }}
            >
              {content[activeTab]}
            </motion.div>
          </AnimatePresence>
        </div>
      </div>
    </motion.div>
  );
}

/* ═══════════════════════════════════════════════════════════════
   COMPANY TAB
═══════════════════════════════════════════════════════════════ */
function CompanyTab() {
  const tsignup = useTranslations("auth.signup");
  const t = useTranslations("settings");
  const [loading, setLoading] = useState(true);
  const [companyData, setCompanyData] = useState(null);

  const {
    control,
    register,
    handleSubmit,
    reset,
    watch,
    formState: { errors, isSubmitting },
  } = useForm({
    resolver: yupResolver(createCompanySchema(t)),
    defaultValues: {
      country: "",
      currency: "",
      name: "",
      tax: "",
      businessType: "",
      commercial: "",
      phone: "",
      website: "",
      address: "",
    },
  });

  useEffect(() => {
    (async () => {
      setLoading(true);
      try {
        const res = await api.get("/users/company");
        if (res.data) {
          setCompanyData(res.data);
          reset({
            country: res.data.country || "",
            currency: res.data.currency || "",
            businessType: res.data.businessType || "",
            name: res.data.name || "",
            tax: res.data.tax || "",
            commercial: res.data.commercial || "",
            phone: res.data.phone || "",
            website: res.data.website || "",
            address: res.data.address || "",
          });
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const onSubmit = async (data) => {
    try {
      await api.post("/users/company", data);
      toast.success(t("company.saveSuccess"));
    } catch (err) {
      const msg = err.response?.data?.message || t("common.error");
      toast.error(Array.isArray(msg) ? msg[0] : msg);
    }
  };

  return (
    <div>
      <SectionHead
        title={t("tabs.company.label")}
        subtitle={t("tabs.company.description")}
      />

      {loading ? (
        <SettingCard>
          <FormSkeleton rows={6} />
        </SettingCard>
      ) : (
        <SettingCard>
          {/* Preview strip */}
          <div
            className="flex items-center gap-4 p-4 rounded-xl mb-6 border border-border/40"
            style={{ background: P_04 }}
          >
            <div
              className="w-12 h-12 rounded-xl flex items-center justify-center shrink-0"
              style={{ background: P_12, border: `1px solid ${P_20}` }}
            >
              <Building2 size={20} style={{ color: "var(--primary)" }} />
            </div>
            <div className="min-w-0">
              <p className="font-bold text-foreground text-sm truncate">
                {watch("name") || t("company.placeholderName")}
              </p>
              <div className="flex items-center gap-1.5 mt-1 flex-wrap">
                <span
                  className="inline-flex px-2 py-0.5 rounded-lg text-[10px] font-bold border"
                  style={{
                    background: P_08,
                    borderColor: P_20,
                    color: "var(--primary)",
                  }}
                >
                  {watch("country") || t("company.noCountry")}
                </span>
                <span className="inline-flex px-2 py-0.5 rounded-lg text-[10px] font-mono font-bold bg-muted/60 border border-border/50 text-muted-foreground">
                  {watch("currency") || "---"}
                </span>
              </div>
            </div>
          </div>

          <form
            onSubmit={handleSubmit(onSubmit)}
            className="grid grid-cols-1 md:grid-cols-2 gap-4"
          >
            <Field
              label={t("company.form.companyName")}
              error={errors.name?.message}
              required
            >
              <Input
                {...register("name")}
                className="h-11"
                placeholder={t("company.form.companyNamePlaceholder")}
              />
            </Field>

            <Field
              label={tsignup("business_type")}
              error={errors.businessType?.message}
              required
            >
              <Controller
                control={control}
                name="businessType"
                render={({ field }) => (
                  <select
                    {...field}
                    className="h-10 w-full rounded-md border border-border/70 bg-background/60 px-3.5 text-sm text-foreground focus:border-[var(--primary)] focus:outline-none  transition-all"
                  >
                    <option value="">{tsignup("business_placeholder")}</option>
                    {BIZ_TYPES_KEYS.map((k) => (
                      <option key={k} value={k}>
                        {tsignup(`business_${k}`)}
                      </option>
                    ))}
                  </select>
                )}
              />
            </Field>

            <Field label={t("company.form.country")} required>
              <Controller
                control={control}
                name="country"
                render={({ field }) => (
                  <Select onValueChange={field.onChange} value={field.value}>
                    <SelectTrigger className="h-11">
                      <SelectValue
                        placeholder={t("company.form.selectCountry")}
                      />
                    </SelectTrigger>
                    <SelectContent>
                      {["Egypt", "Saudi Arabia", "UAE"].map((c) => (
                        <SelectItem key={c} value={c}>
                          {c}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              />
            </Field>

            <Field label={t("company.form.phone")}>
              <Input {...register("phone")} dir="ltr" className="h-11" />
            </Field>

            <Field
              label={t("company.form.website")}
              error={errors.website?.message}
            >
              <Input
                {...register("website")}
                dir="ltr"
                className="h-11"
                placeholder="https://"
              />
            </Field>

            <Field label={t("company.form.taxNumber")}>
              <Input {...register("tax")} className="h-11" />
            </Field>

            <Field label={t("company.form.commercialRegister")}>
              <Input {...register("commercial")} className="h-11" />
            </Field>

            <Field label={t("company.form.currency")} required>
              <Controller
                control={control}
                name="currency"
                render={({ field }) => (
                  <Select onValueChange={field.onChange} value={field.value}>
                    <SelectTrigger className="h-11">
                      <SelectValue
                        placeholder={t("company.form.selectCurrency")}
                      />
                    </SelectTrigger>
                    <SelectContent>
                      {["EGP", "SAR", "USD", "AED"].map((curr) => (
                        <SelectItem key={curr} value={curr}>
                          {curr}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              />
            </Field>

            <Field label={t("company.form.address")} className="md:col-span-2">
              <div className="relative">
                <MapPin
                  size={14}
                  className="absolute start-3.5 top-1/2 -translate-y-1/2 text-muted-foreground/80pointer-events-none"
                />
                <Input {...register("address")} className="h-11 ps-9" />
              </div>
            </Field>
          </form>

          <SaveFooter
            onSave={handleSubmit(onSubmit)}
            saving={isSubmitting}
            label={t("common.saveChanges")}
          />
        </SettingCard>
      )}
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════
   SETTINGS (configuration) TAB
═══════════════════════════════════════════════════════════════ */
function SettingsTab() {
  const tSettings = useTranslations("settings");
  const tOrders = useTranslations("orders");
  const [activeTab, setActiveTab] = useState("general");
  const [statuses, setStatuses] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchStatuses = async () => {
      try {
        setIsLoading(true);
        const { data } = await api.get("/orders/statuses");

        setStatuses(Array.isArray(data) ? data : data.records || []);
      } catch (error) {
        console.error("Failed to fetch statuses:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchStatuses();
  }, []);

  const {
    settings,
    loading,
    saving,
    shippingCompanies,
    patch,
    patchShipping,
    handleSave,
    toggleCode,
  } = useOrdersSettings();

  const tabs = SETTINGS_TABS.map((t) => ({
    key: t.key,
    label: tOrders(t.labelKey),
    icon: t.icon,
  }));

  return (
    <div>
      <SectionHead
        title={tSettings("tabs.configuration.label")}
        subtitle={tSettings("tabs.configuration.description")}
      />
      <SubTabBar tabs={tabs} active={activeTab} setActive={setActiveTab} />

      {loading ? (
        <SettingCard>
          <FormSkeleton rows={5} />
        </SettingCard>
      ) : (
        // <SettingCard>
        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            transition={{ duration: 0.15 }}
            className="min-h-[280px]"
          >
            {activeTab === "general" && (
              <GeneralTab settings={settings} patch={patch} t={tOrders} />
            )}
            {activeTab === "automation" && (
              <AutomationTab
                settings={settings}
                statuses={statuses}
                patch={patch}
                toggleCode={toggleCode}
                t={tOrders}
              />
            )}
            {activeTab === "shipping" && (
              <ShippingTab
                settings={settings}
                statuses={statuses}
                shippingCompanies={shippingCompanies}
                patchShipping={patchShipping}
                patch={patch}
                t={tOrders}
              />
            )}
            {activeTab === "warehouse" && (
              <WarehouseTab settings={settings} patch={patch} t={tOrders} />
            )}
            {activeTab === "notifications" && (
              <NotificationsSettingsTab settings={settings} patch={patch} t={tOrders} />
            )}
          </motion.div>
          <SaveFooter
            onSave={handleSave}
            saving={saving}
            label={tSettings("common.saveChanges")}
          />
        </AnimatePresence>
        // </SettingCard>
      )}
    </div>
  );
}


function NotificationsTab() {
  const tSettings = useTranslations("settings");
  const t = useTranslations("settings.notifications");
  const {
    settings,
    patch,
    saving,
    handleSave,
  } = useOrdersSettings();
  const notifications = [
    { id: 1, key: "orderUpdates", icon: Truck, field: "notifyOrderUpdates" },
    { id: 2, key: "newProducts", icon: Layers, field: "notifyNewProducts" },
    { id: 3, key: "lowStock", icon: Archive, field: "notifyLowStock" },
    { id: 4, key: "marketing", icon: Mail, field: "notifyMarketing" },
  ];

  return (
    <div>
      <SectionHead title={t("title")} subtitle={t("subtitle")} />
      <div className="space-y-3">
        {notifications.map((n, idx) => {
          const Icon = n.icon;
          const isChecked = settings?.[n.field];
          return (
            <motion.div
              key={n.id}
              initial={{ opacity: 0, x: -6 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: idx * 0.05 }}
              className={cn(
                "flex items-center gap-4 p-4 rounded-2xl border border-border/40",
                "bg-background/60 hover:bg-[var(--primary)]/[0.02] transition-colors duration-150",
              )}
            >
              <div
                className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
                style={{ background: P_08, border: `1px solid ${P_20}` }}
              >
                <Icon size={15} style={{ color: "var(--primary)" }} />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-bold text-foreground">
                  {t(`items.${n.key}.title`)}
                </p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  {t(`items.${n.key}.description`)}
                </p>
              </div>
              <Switch
                checked={isChecked}
                onCheckedChange={(val) => patch({ [n.field]: val })}
              />
            </motion.div>
          );
        })}
      </div>
      <SaveFooter
        onSave={handleSave}
        saving={saving}
        label={tSettings("common.saveChanges")}
      />
    </div>
  );
}
/* ═══════════════════════════════════════════════════════════════
   CATEGORIES TAB
═══════════════════════════════════════════════════════════════ */
function CategoriesTab() {
  const t = useTranslations("settings.categories");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState(null);
  const [categories, setCategories] = useState([]);
  const [slugStatus, setSlugStatus] = useState(null);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
    setValue,
    watch,
  } = useForm({
    resolver: yupResolver(createCategorySchema(t)),
    defaultValues: { name: "", slug: "" },
    mode: "onTouched",
  });

  const slug = watch("slug");
  const name = watch("name");

  async function loadCategories() {
    setLoading(true);
    try {
      const res = await api.get("/categories", { params: { limit: 200 } });
      const list = Array.isArray(res.data?.records)
        ? res.data.records
        : Array.isArray(res.data)
          ? res.data
          : [];
      setCategories(list);
    } catch (e) {
      toast.error(normalizeAxiosError(e));
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadCategories();
  }, []);

  useEffect(() => {
    if (!slug || errors.slug) {
      setSlugStatus(null);
      return;
    }
    const id = setTimeout(async () => {
      setSlugStatus("checking");
      try {
        const params = new URLSearchParams({ slug: slug.trim() });
        if (editing?.id) params.append("category", editing.id.toString());
        const res = await api.get(`/categories/check-slug?${params}`);
        setSlugStatus(res.data.isUnique ? "unique" : "taken");
      } catch {
        setSlugStatus(null);
      }
    }, 280);
    return () => clearTimeout(id);
  }, [slug, errors.slug, editing?.id]);

  function openAdd() {
    setEditing(null);
    reset({ name: "", slug: "" });
    setShowForm(true);
  }

  function openEdit(cat) {
    if (cat?.adminId == null) {
      toast.error(t("global.lockedToast"));
      return;
    }
    setEditing(cat);
    reset({ name: cat.name ?? "", slug: cat.slug ?? "" });
    setShowForm(true);
  }

  const { user } = useAuth();

  async function onSubmit(values) {
    setSaving(true);
    try {
      if (editing?.id) {
        await toast.promise(
          api.patch(`/categories/${editing.id}`, {
            name: values.name,
            slug: values.slug,
          }),
          {
            loading: t("toast.updating"),
            success: t("toast.updated"),
            error: (e) => normalizeAxiosError(e),
          },
        );
      } else {
        await toast.promise(
          api.post("/categories", {
            name: values.name,
            slug: values.slug,
            adminId: user?.id,
          }),
          {
            loading: t("toast.creating"),
            success: t("toast.created"),
            error: (e) => normalizeAxiosError(e),
          },
        );
      }
      setShowForm(false);
      setEditing(null);
      reset({ name: "" });
      await loadCategories();
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(cat) {
    if (cat?.adminId == null) {
      toast.error(t("global.lockedToast"));
      return;
    }
    try {
      await api.delete(`/categories/${cat.id}`);
      await loadCategories();
      toast.success(t("toast.deleted"));
    } catch (err) {
      toast.error(normalizeAxiosError(err));
    }
  }

  const { generateSlug } = useSlugify();

  async function handleDuplicate(cat) {
    try {
      const newName = `${cat.name} (Copy)`;

      const newSlug = await generateSlug(newName);

      await toast.promise(
        api.post("/categories", {
          name: newName,
          slug: newSlug // Passing the generated slug
        }),
        {
          loading: t("toast.duplicating") || "Duplicating…",
          success: t("toast.duplicated") || "Duplicated!",
          error: (e) => normalizeAxiosError(e),
        },
      );
      await loadCategories();
    } catch (error) {
      console.error(error);
    }
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <SectionHead title={t("title")} subtitle={t("subtitle")} />
        <motion.button
          whileHover={{ scale: 1.02, y: -1 }}
          whileTap={{ scale: 0.97 }}
          onClick={() => (showForm ? setShowForm(false) : openAdd())}
          className={cn(
            "inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-sm font-bold",
            "bg-[var(--primary)] text-white shadow-[0_2px_12px_color-mix(in_oklab,var(--primary)_30%,transparent)]",
            "hover:opacity-90 transition-all",
          )}
        >
          {showForm ? <X size={14} /> : <Plus size={14} />}
          {showForm ? t("form.cancel") : t("addButton")}
        </motion.button>
      </div>

      {/* Add / Edit form */}
      <AnimatePresence>
        {showForm && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden mb-4"
          >
            <SettingCard>
              <p className="text-sm font-bold text-foreground mb-4">
                {editing ? t("editForm.title") : t("addForm.title")}
              </p>
              <form
                onSubmit={handleSubmit(onSubmit)}
                className="grid grid-cols-1 sm:grid-cols-2 gap-4"
              >
                <Field label={t("form.name")} error={errors.name?.message}>
                  <Input
                    {...register("name")}
                    placeholder={t("form.namePlaceholder")}
                    className="h-11"
                  />
                </Field>
                <SlugInput
                  errors={errors}
                  register={register}
                  name={name}
                  slugStatus={slugStatus}
                  slug={slug}
                  setValue={setValue}
                  className="h-11"
                />
                <div className="flex gap-2 sm:col-span-2">
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.97 }}
                    type="submit"
                    disabled={saving}
                    className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-sm font-bold bg-[var(--primary)] text-white hover:opacity-90 disabled:opacity-50 transition-all"
                  >
                    {saving ? (
                      <Loader2 size={13} className="animate-spin" />
                    ) : (
                      <Save size={13} />
                    )}
                    {t("form.save")}
                  </motion.button>
                  <button
                    type="button"
                    onClick={() => {
                      setShowForm(false);
                      setEditing(null);
                    }}
                    className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-sm font-medium border border-border/60 hover:bg-muted/40 transition-all"
                  >
                    <X size={13} /> {t("form.cancel")}
                  </button>
                </div>
              </form>
            </SettingCard>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Category list */}
      {loading ? (
        <div className="space-y-2">
          {Array.from({ length: 5 }).map((_, i) => (
            <div
              key={i}
              className="flex items-center gap-4 p-4 rounded-2xl border border-border/40"
            >
              <Bone className="w-12 h-12 rounded-xl shrink-0" />
              <div className="flex-1 space-y-2">
                <Bone className="h-3.5 w-1/3" />
                <Bone className="h-3 w-1/5" />
              </div>
              <div className="flex gap-2">
                <Bone className="w-8 h-8 rounded-xl" />
                <Bone className="w-8 h-8 rounded-xl" />
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="space-y-2">
          {categories.map((cat, idx) => {
            const isGlobal = cat?.adminId == null;
            return (
              <motion.div
                key={cat.id ?? makeId()}
                initial={{ opacity: 0, x: -6 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: idx * 0.03 }}
                className={cn(
                  "group flex items-center gap-4 p-4 rounded-2xl border border-border/40",
                  "bg-background/60 hover:bg-[var(--primary)]/[0.025]",
                  "hover:border-[var(--primary)]/30 transition-all duration-150",
                )}
              >
                {/* Icon */}
                <div
                  className="w-11 h-11 rounded-xl flex items-center justify-center overflow-hidden shrink-0 border"
                  style={{ background: P_08, borderColor: P_20 }}
                >
                  {cat.image ? (
                    <img
                      src={cat.image}
                      alt={cat.name}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <Layers size={16} style={{ color: "var(--primary)" }} />
                  )}
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-sm font-bold text-foreground">
                      {cat.name}
                    </span>
                    {isGlobal && (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg text-[10px] font-bold bg-muted/60 border border-border/50 text-muted-foreground">
                        <Lock size={9} /> {t("global.badge")}
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground/80font-mono mt-0.5 truncate">
                    /{cat.slug}
                  </p>
                </div>

                {/* Actions */}
                <CategoryActionButtons
                  category={cat}
                  isGlobal={isGlobal}
                  isLoading={loading}
                  onEdit={openEdit}
                  onDelete={handleDelete}
                  onDuplicate={handleDuplicate}
                  t={t}
                />
              </motion.div>
            );
          })}
        </div>
      )}
    </div>
  );
}

function CategoryActionButtons({
  category,
  isGlobal,
  isLoading,
  onEdit,
  onDelete,
  onDuplicate,
  t,
}) {
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [actionLoading, setActionLoading] = useState(null);

  const handleDelete = async () => {
    setActionLoading("delete");
    await onDelete?.(category);
    setActionLoading(null);
    setShowDeleteDialog(false);
  };

  const handleDuplicate = async () => {
    setActionLoading("duplicate");
    await onDuplicate?.(category);
    setActionLoading(null);
  };

  const iconBtn = (onClick, icon, colorHover, disabled, loading_) => (
    <motion.button
      whileHover={!disabled ? { scale: 1.1 } : {}}
      whileTap={!disabled ? { scale: 0.9 } : {}}
      type="button"
      onClick={onClick}
      disabled={disabled || isLoading}
      className={cn(
        "relative w-8 h-8 rounded-xl flex items-center justify-center border border-transparent",
        "text-muted-foreground transition-all duration-150",
        colorHover,
        (disabled || isLoading) && "opacity-35 cursor-not-allowed",
      )}
    >
      {loading_ ? <Loader2 size={13} className="animate-spin" /> : icon}
      {disabled && (
        <span className="absolute -top-1 -end-1 w-3.5 h-3.5 rounded-full bg-amber-400 border-2 border-background flex items-center justify-center">
          <Lock size={7} className="text-white" />
        </span>
      )}
    </motion.button>
  );

  return (
    <TooltipProvider delayDuration={200}>
      <div className="flex items-center gap-1 opacity-60 group-hover:opacity-100 transition-opacity">
        <Tooltip>
          <TooltipTrigger asChild>
            {iconBtn(
              () => !isGlobal && onEdit?.(category),
              <Edit2 size={13} />,
              "hover:bg-blue-50 hover:text-blue-600 dark:hover:bg-blue-900/20",
              isGlobal,
            )}
          </TooltipTrigger>
          <TooltipContent side="top">
            <p>{isGlobal ? t("global.lockedHint") : t("list.edit")}</p>
          </TooltipContent>
        </Tooltip>

        <Tooltip>
          <TooltipTrigger asChild>
            {iconBtn(
              handleDuplicate,
              <Copy size={13} />,
              "hover:bg-muted/60 hover:text-foreground",
              false,
              actionLoading === "duplicate",
            )}
          </TooltipTrigger>
          <TooltipContent side="top">
            <p>{t("list.duplicate") || "Duplicate"}</p>
          </TooltipContent>
        </Tooltip>

        <Tooltip>
          <TooltipTrigger asChild>
            {iconBtn(
              () => !isGlobal && setShowDeleteDialog(true),
              <Trash2 size={13} />,
              "hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-900/20",
              isGlobal,
              actionLoading === "delete",
            )}
          </TooltipTrigger>
          <TooltipContent side="top">
            <p>{isGlobal ? t("global.lockedHint") : t("list.delete")}</p>
          </TooltipContent>
        </Tooltip>
      </div>

      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent className="rounded-2xl">
          <AlertDialogHeader>
            <AlertDialogTitle>{t("dialogs.delete.title")}</AlertDialogTitle>
            <AlertDialogDescription>
              {t("dialogs.delete.description", { name: category.name })}
              <br />
              <span className="font-semibold text-destructive">
                {t("dialogs.delete.warning")}
              </span>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={actionLoading === "delete"}>
              {t("common.cancel")}
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={actionLoading === "delete"}
              className="bg-red-600 hover:bg-red-700"
            >
              {actionLoading === "delete" ? (
                <Loader2 size={13} className="animate-spin me-1.5" />
              ) : (
                <Trash2 size={13} className="me-1.5" />
              )}
              {t("common.delete")}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </TooltipProvider>
  );
}

/* ═══════════════════════════════════════════════════════════════
   ACCOUNT TAB
═══════════════════════════════════════════════════════════════ */
function AccountTab() {
  const t = useTranslations("settings.account");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [avatarUploading, setAvatarUploading] = useState(false);
  const [me, setMe] = useState(null);
  const [avatarPreview, setAvatarPreview] = useState(null);
  const [countryKey, setCountryKey] = useState("EG");
  const [phoneDigits, setPhoneDigits] = useState("");
  const [phoneError, setPhoneError] = useState("");
  const fileInputRef = useRef(null);

  const selectedCountry = useMemo(
    () => COUNTRIES.find((c) => c.key === countryKey) || COUNTRIES[0],
    [countryKey],
  );

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm({
    resolver: yupResolver(createAccountSchema(t)),
    defaultValues: { name: "", email: "", employeeType: "" },
    mode: "onTouched",
  });

  async function fetchMe() {
    setLoading(true);
    try {
      let res;
      try {
        res = await api.get("/users/me");
      } catch {
        const id =
          typeof window !== "undefined" ? localStorage.getItem("userId") : null;
        if (!id) throw new Error();
        res = await api.get(`/users/${id}`);
      }
      const user = res.data?.user ?? res.data;
      setMe(user);
      reset({
        name: user?.name ?? "",
        email: user?.email ?? "",
        employeeType: user?.employeeType ?? "",
      });
      const parsed = parsePhoneToCountry(user?.phone);
      setCountryKey(parsed.countryKey);
      setPhoneDigits(parsed.localDigits);
      setPhoneError(
        parsed.localDigits
          ? validatePhone(
            parsed.localDigits,
            COUNTRIES.find((c) => c.key === parsed.countryKey) ||
            COUNTRIES[0],
            t,
          )
          : "",
      );
      setAvatarPreview(null);
    } catch (e) {
      toast.error(normalizeAxiosError(e));
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchMe();
  }, []);

  function buildFullPhone() {
    const local = digitsOnly(phoneDigits);
    if (!local) return null;
    return `${selectedCountry?.dialCode || "+20"}${local}`;
  }

  async function onSave(values) {
    if (!me?.id) return;
    const phoneMsg = phoneDigits
      ? validatePhone(phoneDigits, selectedCountry, t)
      : "";
    setPhoneError(phoneMsg);
    if (phoneMsg) {
      toast.error(t("account.phone.invalid"));
      return;
    }
    setSaving(true);
    try {
      const patch = {
        name: values.name.trim(),
        email: values.email.trim(),
        employeeType: (values.employeeType ?? "").trim() || null,
        phone: buildFullPhone(),
      };
      await toast.promise(
        (async () => {
          try {
            await api.patch("/users/me", patch);
          } catch {
            await api.patch(`/users/${me.id}`, patch);
          }
        })(),
        {
          loading: t("toast.saving"),
          success: t("toast.saved"),
          error: (e) => normalizeAxiosError(e),
        },
      );
      await fetchMe();
    } finally {
      setSaving(false);
    }
  }

  async function uploadAvatar(file) {
    if (!file || !me?.id) return;
    setAvatarUploading(true);
    try {
      const fd = new FormData();
      fd.append("avatar", file);
      await toast.promise(
        (async () => {
          try {
            await api.post("/users/me/avatar", fd, {
              headers: { "Content-Type": "multipart/form-data" },
            });
          } catch {
            throw new Error(t("errors.missingAvatarEndpoint"));
          }
        })(),
        {
          loading: t("toast.uploadingAvatar"),
          success: t("toast.avatarUpdated"),
          error: (e) => normalizeAxiosError(e),
        },
      );
      await fetchMe();
    } finally {
      setAvatarUploading(false);
    }
  }

  return (
    <div>
      <SectionHead title={t("title")} subtitle={t("subtitle")} />

      {loading ? (
        <SettingCard>
          <div className="flex items-center gap-4 mb-6">
            <Bone className="w-20 h-20 rounded-2xl shrink-0" />
            <div className="flex-1 space-y-2">
              <Bone className="h-5 w-32" />
              <Bone className="h-3.5 w-48" />
            </div>
          </div>
          <FormSkeleton rows={4} />
        </SettingCard>
      ) : (
        <SettingCard>
          {/* Avatar + identity */}
          <div className="flex items-center gap-5 mb-7">
            <div className="relative shrink-0">
              <Avatar className="w-20 h-20 border-4 border-[var(--primary)]/20 rounded-2xl">
                <AvatarImage
                  src={avatarPreview || avatarSrc(me?.avatarUrl || "")}
                />
                <AvatarFallback
                  className="rounded-2xl text-lg font-black"
                  style={{ background: P_12, color: "var(--primary)" }}
                >
                  {(me?.name || "U").slice(0, 2).toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={async (e) => {
                  const f = e.target.files?.[0];
                  if (!f) return;
                  try {
                    await uploadAvatar(f);
                  } finally {
                    e.target.value = "";
                  }
                }}
              />
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                disabled={avatarUploading}
                className="absolute -bottom-2 -end-2 w-8 h-8 rounded-xl bg-[var(--primary)] text-white flex items-center justify-center shadow-lg disabled:opacity-60 transition-all hover:opacity-90"
              >
                {avatarUploading ? (
                  <Loader2 size={13} className="animate-spin" />
                ) : (
                  <Camera size={13} />
                )}
              </button>
            </div>

            <div className="flex-1 min-w-0">
              <p className="text-lg font-black text-foreground truncate">
                {me?.name}
              </p>
              <p className="text-sm text-muted-foreground truncate">
                {me?.email}
              </p>
              <div className="flex items-center gap-2 mt-2 flex-wrap">
                {me?.role?.name && (
                  <span
                    className="inline-flex px-2.5 py-1 rounded-lg text-[11px] font-bold border"
                    style={{
                      background: P_08,
                      borderColor: P_20,
                      color: "var(--primary)",
                    }}
                  >
                    {t("profile.role")}: {me.role.name}
                  </span>
                )}
                {me?.plan?.name && (
                  <span className="inline-flex px-2.5 py-1 rounded-lg text-[11px] font-bold bg-muted/50 border border-border/50 text-muted-foreground">
                    {t("profile.plan")}: {me.plan.name}
                  </span>
                )}
              </div>
            </div>
          </div>

          <form
            onSubmit={handleSubmit(onSave)}
            className="grid grid-cols-1 md:grid-cols-2 gap-4"
          >
            <Field label={t("profile.fullName")} error={errors.name?.message}>
              <Input {...register("name")} className="h-11" />
            </Field>

            {/* Phone */}
            <Field label={t("phone.label")} error={phoneError}>
              <div className="flex gap-2">
                <div className="w-40 shrink-0">
                  <Select
                    value={countryKey}
                    onValueChange={(v) => {
                      setCountryKey(v);
                      const next =
                        COUNTRIES.find((c) => c.key === v) || COUNTRIES[0];
                      setPhoneError(
                        phoneDigits ? validatePhone(phoneDigits, next) : "",
                      );
                    }}
                  >
                    <SelectTrigger
                      className="h-11 font-bold"
                      style={{ color: "var(--primary)" }}
                    >
                      <SelectValue
                        placeholder={t("phone.countryPlaceholder")}
                      />
                    </SelectTrigger>
                    <SelectContent className="max-h-72">
                      {COUNTRIES.map((c) => (
                        <SelectItem key={c.key} value={c.key}>
                          {c.dialCode} — {c.nameAr}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <Input
                  dir="ltr"
                  value={phoneDigits}
                  onChange={(e) => {
                    const v = digitsOnly(e.target.value);
                    setPhoneDigits(v);
                    setPhoneError(v ? validatePhone(v, selectedCountry) : "");
                  }}
                  placeholder={selectedCountry.placeholder}
                  className={cn(
                    "flex-1 h-11 font-mono",
                    phoneError ? "border-destructive" : "",
                  )}
                  inputMode="numeric"
                />
              </div>
            </Field>

            <div className="md:col-span-2">
              <SaveFooter
                onSave={handleSubmit(onSave)}
                saving={saving}
                label={t("profile.saveChanges")}
              />
            </div>
          </form>

          <div className="mt-4 pt-4 border-t border-border/40 grid grid-cols-3 gap-4">
            {[
              { label: t("profile.userId"), value: me?.id },
              { label: t("profile.adminId"), value: me?.adminId },
              { label: t("profile.employeeType"), value: me?.employeeType },
            ].map(({ label, value }) => (
              <div key={label} className="space-y-1">
                <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground/80">
                  {label}
                </p>
                <p className="text-xs font-semibold text-foreground font-mono">
                  {value ?? "—"}
                </p>
              </div>
            ))}
          </div>
        </SettingCard>
      )
      }
    </div >
  );
}

/* ═══════════════════════════════════════════════════════════════
   SECURITY TAB
═══════════════════════════════════════════════════════════════ */
function SecurityTab() {
  const t = useTranslations("settings.security");
  const [activeTab, setActiveTab] = useState("password");
  const tabs = SECURITY_TABS.map((tab) => ({
    key: tab.key,
    label: t(tab.labelKey),
    icon: tab.icon,
  }));

  return (
    <div>
      <SectionHead title={t("title")} subtitle={t("subtitle")} />
      <SubTabBar tabs={tabs} active={activeTab} setActive={setActiveTab} />
      <AnimatePresence mode="wait">
        <motion.div
          key={activeTab}
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -6 }}
          transition={{ duration: 0.15 }}
        >
          {activeTab === "password" && <PasswordSection t={t} />}
          {activeTab === "email" && <EmailSection t={t} />}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}

function PasswordSection({ t }) {
  const { user, setUser } = useAuth();
  const hasPassword = user?.hasPassword;
  console.log(user, hasPassword)
  const [data, setData] = useState({
    oldPassword: "",
    newPassword: "",
    confirmPassword: "",
  });
  const [loading, setLoading] = useState(false);

  const handleUpdate = async () => {
    // تنظيف المدخلات لضمان سلامة البيانات
    const oldPass = data.oldPassword.trim();
    const newPass = data.newPassword.trim();
    const confirmPass = data.confirmPassword.trim();

    if (!newPass) {
      toast.error(t("errors.required"));
      return;
    }

    if (newPass !== confirmPass) {
      toast.error(t("errors.mismatch"));
      return;
    }

    setLoading(true);
    try {
      if (hasPassword) {
        // حالة تغيير كلمة المرور الحالية
        await api.post("/auth/change-password", {
          newPassword: newPass,
          oldPassword: oldPass,
        });
        toast.success(t("password_success"));
      } else {
        // حالة إضافة كلمة مرور لأول مرة
        await api.post("/auth/set-password", {
          newPassword: newPass,
        });
        toast.success(t("set_password_success"));
      }
      setUser(p => ({ ...p, hasPassword: true }));
      setData({ oldPassword: "", newPassword: "", confirmPassword: "" });
    } catch (err) {
      toast.error(err?.response?.data?.message || t("errors.failed"));
    } finally {
      setLoading(false);
    }
  };

  return (
    <SettingCard>
      <div className="space-y-4 max-w-md">
        {/* لا يظهر حقل كلمة المرور القديمة إذا لم يكن لدى المستخدم واحدة */}
        {hasPassword && (
          <Field label={t("form.old_password")}>
            <Input
              type="password"
              value={data.oldPassword}
              placeholder={t("form.old_password")}
              onChange={(e) => setData({ ...data, oldPassword: e.target.value })}
              className="h-11"
            />
          </Field>
        )}

        <Field label={hasPassword ? t("form.new_password") : t("form.password")}>
          <Input
            type="password"
            value={data.newPassword}
            placeholder={t("form.new_password")}
            onChange={(e) => setData({ ...data, newPassword: e.target.value })}
            className="h-11"
          />
          <PasswordStrength password={data.newPassword} />
        </Field>

        <Field label={t("form.confirm_password")}>
          <Input
            type="password"
            value={data.confirmPassword}
            placeholder={t("form.confirm_password")}
            onChange={(e) =>
              setData({ ...data, confirmPassword: e.target.value })
            }
            className="h-11"
          />
        </Field>
      </div>

      <SaveFooter
        onSave={handleUpdate}
        saving={loading}
        // تغيير نص الزر بناءً على الحالة
        label={hasPassword ? t("form.update_password") : t("form.set_password")}
      />
    </SettingCard>
  );
}

function EmailSection({ t }) {
  const [step, setStep] = useState(1);
  const [newEmail, setNewEmail] = useState("");
  const [loading, setLoading] = useState(false);

  const requestChange = async () => {
    setLoading(true);
    try {
      await api.post("/auth/request-email-change", { newEmail });
      toast.success(t("email_otp_sent"));
      setStep(2);
    } catch (err) {
      toast.error(
        err?.response?.data?.message || t("errors.failedSendEmailOTP"),
      );
    } finally {
      setLoading(false);
    }
  };

  async function onVerified(data) {
    setStep(1);
    setNewEmail("");
    if (data?.accessToken) {
      localStorage.setItem("accessToken", data.accessToken);
      localStorage.setItem("user", JSON.stringify(data.user));
    }
    await fetch("/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ accessToken: data.accessToken, user: data.user }),
    });
  }

  if (step === 2)
    return <EmailOtpStep email={newEmail} t={t} onVerified={onVerified} />;

  return (
    <SettingCard>
      <div className="max-w-md space-y-4">
        <Field label={t("form.new_email")}>
          <Input
            type="email"
            placeholder="example@mail.com"
            value={newEmail}
            onChange={(e) => setNewEmail(e.target.value)}
            className="h-11"
          />
        </Field>
      </div>
      <SaveFooter
        onSave={requestChange}
        saving={loading}
        label={t("form.send_otp")}
      />
    </SettingCard>
  );
}

function EmailOtpStep({ email, t, onVerified }) {
  const [otp, setOtp] = useState("");
  const [otpErr, setOtpErr] = useState(false);
  const [timer, setTimer] = useState(120);
  const [canResend, setCanResend] = useState(false);
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);

  useEffect(() => {
    const iv = setInterval(
      () =>
        setTimer((p) => {
          if (p <= 1) {
            clearInterval(iv);
            setCanResend(true);
            return 0;
          }
          return p - 1;
        }),
      1000,
    );
    return () => clearInterval(iv);
  }, [canResend]);

  const handleVerify = async () => {
    setLoading(true);
    try {
      const { data } = await api.post("/auth/verify-email-change", { otp });
      toast.success(t("email_success"));
      onVerified(data);
      setOtpErr(false);
    } catch (err) {
      toast.error(err?.response?.data?.message || t("signup.otp_wrong"));
      setOtpErr(true);
      setOtp("");
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    if (!canResend || resending) return;
    setResending(true);
    const tid = toast.loading(t("signup.resending"));
    try {
      await api.post("/auth/resend-email-request");
      toast.success(t("signup.resend_success"), { id: tid });
      setCanResend(false);
      setTimer(120);
      setOtp("");
      setOtpErr(false);
    } catch (err) {
      toast.error(err?.message || t("signup.resend_error"), { id: tid });
    } finally {
      setResending(false);
    }
  };

  return (
    <SettingCard>
      <div className="max-w-sm mx-auto text-center">
        <div
          className="w-14 h-14 rounded-2xl flex items-center justify-center mx-auto mb-4"
          style={{ background: P_12, border: `1px solid ${P_20}` }}
        >
          <Mail size={24} style={{ color: "var(--primary)" }} />
        </div>
        <h3 className="text-base font-bold text-foreground mb-1">
          {t("otp_title")}
        </h3>
        <p className="text-sm text-muted-foreground mb-6">
          {t("otp_sub")}{" "}
          <span className="font-bold text-foreground">{email}</span>
        </p>

        <OtpInput value={otp} onChange={setOtp} />
        {otpErr && (
          <p className="text-xs text-destructive mt-2">⚠ {t("otp_wrong")}</p>
        )}

        <div className="flex items-center justify-between mt-5 text-sm">
          <span className="text-muted-foreground text-xs">
            {canResend
              ? t("otp_expired")
              : `${t("otp_timer")} ${Math.floor(timer / 60)}:${String(timer % 60).padStart(2, "0")}`}
          </span>
          <button
            onClick={handleResend}
            disabled={!canResend || resending}
            className="text-xs font-bold text-[var(--primary)] disabled:opacity-40 flex items-center gap-1"
          >
            {resending && <Loader2 size={11} className="animate-spin" />}
            {t("otp_resend")}
          </button>
        </div>
      </div>
      <SaveFooter
        onSave={handleVerify}
        saving={loading || otp.length !== 6}
        label={t("otp_verify")}
      />
    </SettingCard>
  );
}

/* ═══════════════════════════════════════════════════════════════
   NOTIFICATIONS TAB
═══════════════════════════════════════════════════════════════ */

