"use client";

import React, { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import toast from "react-hot-toast";
import { useForm } from "react-hook-form";
import * as yup from "yup";
import { yupResolver } from "@hookform/resolvers/yup";
import { useTranslations } from "next-intl";

import {
  Save,
  RefreshCw,
  Mail,
  Phone,
  Facebook,
  Instagram,
  Twitter,
  Linkedin,
  Github,
  Youtube,
  Link as LinkIcon,
  Loader2,
  Contact,
  Brain,
  Image as ImageIcon,
  Sparkles,
} from "lucide-react";

import api from "@/utils/api";
import { cn } from "@/utils/cn";
import PageHeader from "@/components/atoms/Pageheader";
import Button_ from "@/components/atoms/Button";
import { Input } from "@/components/ui/input";
import { FaWhatsapp } from "react-icons/fa";
import HostedModelsCatalog from "./hosted-models-catalog";

// ── Design tokens ─────────────────────────────────────────────────────────────
const P_04 = "color-mix(in oklab, var(--primary)  4%, transparent)";
const P_08 = "color-mix(in oklab, var(--primary)  8%, transparent)";
const P_12 = "color-mix(in oklab, var(--primary) 12%, transparent)";
const P_20 = "color-mix(in oklab, var(--primary) 20%, transparent)";

// ── Shared UI Components ──────────────────────────────────────────────────────
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

function SettingCard({ children, className }) {
  return (
    <div
      className={cn(
        "relative rounded-2xl border border-border/50 main-card overflow-hidden p-6 mb-6",
        "shadow-[0_1px_3px_rgba(0,0,0,0.05),0_4px_16px_rgba(0,0,0,0.04)]",
        className,
      )}
    >
      {children}
    </div>
  );
}

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
      {error && <p className="text-[11px] text-destructive">{error}</p>}
    </div>
  );
}

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

function FormSkeleton({ rows = 4 }) {
  return (
    <div className="space-y-4">
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="space-y-1.5">
          <div className="h-3 w-20 rounded-xl bg-muted/50 animate-pulse" />
          <div className="h-11 w-full rounded-xl bg-muted/50 animate-pulse" />
        </div>
      ))}
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════
   SCHEMAS & DATA
═══════════════════════════════════════════════════════════════ */
const createContactsSchema = (t) =>
  yup.object({
    email: yup
      .string()
      .email(t("validation.invalidEmail"))
      .required(t("validation.emailRequired")),
    whatsapp: yup.string().required(t("validation.whatsappRequired")),
    facebook: yup.string().url(t("validation.invalidUrl")).nullable(),
    instagram: yup.string().url(t("validation.invalidUrl")).nullable(),
    x: yup.string().url(t("validation.invalidUrl")).nullable(),
    linkedin: yup.string().url(t("validation.invalidUrl")).nullable(),
    github: yup.string().url(t("validation.invalidUrl")).nullable(),
    youtube: yup.string().url(t("validation.invalidUrl")).nullable(),
  });

const limitedUnits = (t, modeField) =>
  yup.number().when(modeField, {
    is: "limited",
    then: (schema) =>
      schema
        .typeError(t("validation.invalidInteger"))
        .integer(t("validation.invalidInteger"))
        .min(0, t("validation.invalidInteger"))
        .required(t("validation.invalidInteger")),
    otherwise: (schema) => schema.nullable().notRequired(),
  });

const createAiSchema = (t) =>
  yup.object({
    durationDays: yup
      .number()
      .transform((value, originalValue) =>
        originalValue === "" || originalValue == null ? null : value,
      )
      .nullable()
      .notRequired()
      .typeError(t("validation.invalidInteger"))
      .integer(t("validation.invalidInteger"))
      .min(0, t("validation.invalidInteger")),
    allowanceAnchorDate: yup
      .string()
      .transform((value) => (value === "" || value == null ? null : value))
      .nullable()
      .notRequired()
      .matches(/^\d{4}-\d{2}-\d{2}$/, {
        message: t("validation.invalidDate"),
        excludeEmptyString: true,
      }),
    decisionTokenPrice: yup
      .number()
      .typeError(t("validation.invalidNumber"))
      .min(0, t("validation.invalidNumber"))
      .required(t("validation.invalidNumber")),
    decisionAllowanceMode: yup.string().oneOf(["unlimited", "limited"]).required(),
    decisionUnits: limitedUnits(t, "decisionAllowanceMode"),
    mediaTokenPrice: yup
      .number()
      .typeError(t("validation.invalidNumber"))
      .min(0, t("validation.invalidNumber"))
      .required(t("validation.invalidNumber")),
    mediaAudioMinutePrice: yup
      .number()
      .typeError(t("validation.invalidNumber"))
      .min(0, t("validation.invalidNumber"))
      .required(t("validation.invalidNumber")),
    mediaAllowanceMode: yup.string().oneOf(["unlimited", "limited"]).required(),
    mediaUnits: limitedUnits(t, "mediaAllowanceMode"),
    hostedInputTokenPrice: yup
      .number()
      .typeError(t("validation.invalidNumber"))
      .min(0, t("validation.invalidNumber"))
      .required(t("validation.invalidNumber")),
    hostedOutputTokenPrice: yup
      .number()
      .typeError(t("validation.invalidNumber"))
      .min(0, t("validation.invalidNumber"))
      .required(t("validation.invalidNumber")),
    hostedAllowanceMode: yup.string().oneOf(["unlimited", "limited"]).required(),
    hostedUnits: limitedUnits(t, "hostedAllowanceMode"),
  });

const SOCIAL_PLATFORMS = [
  {
    id: "facebook",
    icon: Facebook,
    color: "#1877F2",
    labelKey: "socials.facebook",
  },
  {
    id: "instagram",
    icon: Instagram,
    color: "#E4405F",
    labelKey: "socials.instagram",
  },
  { id: "x", icon: Twitter, color: "#000000", labelKey: "socials.x" },
  {
    id: "linkedin",
    icon: Linkedin,
    color: "#0A66C2",
    labelKey: "socials.linkedin",
  },
  { id: "github", icon: Github, color: "#333", labelKey: "socials.github" },
  {
    id: "youtube",
    icon: Youtube,
    color: "#FF0000",
    labelKey: "socials.youtube",
  },
];

/* ═══════════════════════════════════════════════════════════════
   MAIN PAGE
═══════════════════════════════════════════════════════════════ */
export default function SuperAdminSettingsPage() {
  const t = useTranslations("superAdminSettings");
  const [activeTab, setActiveTab] = useState("contacts");

  const TABS = [
    { id: "contacts", label: t("tabs.contacts"), icon: Contact },
    { id: "whatsapp", label: t("tabs.whatsapp"), icon: FaWhatsapp },
    { id: "ai", label: t("tabs.ai"), icon: Brain },
  ];

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="min-h-screen p-4 md:p-6"
    >
      <div className="max-w-5xl mx-auto space-y-6">
        <PageHeader
          title={t("header.title")}
          breadcrumbs={[
            { name: t("breadcrumb.home"), href: "/admin/dashboard" },
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

        <div className="relative  main-card rounded-2xl border border-border/50 overflow-hidden shadow-[0_1px_3px_rgba(0,0,0,0.05),0_8px_32px_rgba(0,0,0,0.05)]">
          <AnimatePresence mode="wait">
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.18, ease: [0.16, 1, 0.3, 1] }}
            >
              {activeTab === "contacts" && <ContactsTab t={t} />}
              {activeTab === "whatsapp" && <WhatsAppTab t={t} />}
              {activeTab === "ai" && <AiTab t={t} />}
            </motion.div>
          </AnimatePresence>
        </div>
      </div>
    </motion.div>
  );
}

/* ═══════════════════════════════════════════════════════════════
   CONTACTS TAB
═══════════════════════════════════════════════════════════════ */
function ContactsTab({ t }) {
  const [loading, setLoading] = useState(true);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm({
    resolver: yupResolver(createContactsSchema(t)),
    defaultValues: {
      email: "",
      whatsapp: "",
      facebook: "",
      instagram: "",
      x: "",
      linkedin: "",
      github: "",
      youtube: "",
    },
  });

  useEffect(() => {
    (async () => {
      setLoading(true);
      try {
        const res = await api.get("/admin-settings");
        // Assuming API returns { email, whatsapp, socials: { facebook, ... } }
        const data = res.data || {};
        reset({
          email: data.email || "",
          whatsapp: data.whatsapp || "",
          facebook: data.socials?.facebook || "",
          instagram: data.socials?.instagram || "",
          x: data.socials?.x || "",
          linkedin: data.socials?.linkedin || "",
          github: data.socials?.github || "",
          youtube: data.socials?.youtube || "",
        });
      } catch (err) {
        toast.error(t("toast.loadError"));
      } finally {
        setLoading(false);
      }
    })();
  }, [reset, t]);

  const onSubmit = async (values) => {
    try {
      // Format data for backend
      const cleanValue = (val) => (val && val.trim() !== "" ? val : null);

      const payload = {
        email: cleanValue(values.email),
        whatsapp: cleanValue(values.whatsapp),
        socials: {
          facebook: cleanValue(values.facebook),
          instagram: cleanValue(values.instagram),
          x: cleanValue(values.x),
          linkedin: cleanValue(values.linkedin),
          github: cleanValue(values.github),
          youtube: cleanValue(values.youtube),
        },
      };

      await api.patch("/admin-settings", payload);
      toast.success(t("toast.saveSuccess"));
    } catch (err) {
      const msg = err.response?.data?.message || t("toast.saveError");
      toast.error(Array.isArray(msg) ? msg[0] : msg);
    }
  };

  if (loading)
    return (
      <SettingCard>
        <FormSkeleton rows={6} />
      </SettingCard>
    );

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      {/* Primary Contacts */}
      <SettingCard className=" border-0 bg-transparent shadow-none">
        <SectionHead
          title={t("contacts.primaryTitle")}
          subtitle={t("contacts.primarySubtitle")}
        />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-6 main-card rounded-2xl border border-border/50 shadow-[0_1px_3px_rgba(0,0,0,0.05)]">
          <Field
            label={t("contacts.emailLabel")}
            error={errors.email?.message}
            required
          >
            <div className="relative">
              <Mail
                size={16}
                className="absolute start-3.5 top-1/2 -translate-y-1/2 text-muted-foreground/80pointer-events-none"
              />
              <Input
                {...register("email")}
                className="h-11 ps-10"
                placeholder="admin@platform.com"
                dir="ltr"
              />
            </div>
          </Field>

          <Field
            label={t("contacts.whatsappLabel")}
            error={errors.whatsapp?.message}
            required
          >
            <div className="relative">
              <Phone
                size={16}
                className="absolute start-3.5 top-1/2 -translate-y-1/2 text-muted-foreground/80pointer-events-none"
              />
              <Input
                {...register("whatsapp")}
                className="h-11 ps-10"
                placeholder="+1234567890"
                dir="ltr"
              />
            </div>
          </Field>
        </div>
      </SettingCard>

      {/* Social Media Cards */}
      <SettingCard className=" border-0 bg-transparent shadow-none">
        <SectionHead
          title={t("contacts.socialTitle")}
          subtitle={t("contacts.socialSubtitle")}
        />
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {SOCIAL_PLATFORMS.map((platform) => {
            const Icon = platform.icon;
            const fieldError = errors[platform.id]?.message;

            return (
              <div
                key={platform.id}
                className={cn(
                  "flex flex-col gap-3 p-4 rounded-2xl border border-border/40",
                  "bg-background/60 hover:bg-[var(--primary)]/[0.02] transition-colors duration-150",
                )}
              >
                <div className="flex items-center gap-3">
                  <div
                    className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
                    style={{ background: P_08, border: `1px solid ${P_20}` }}
                  >
                    <Icon size={18} style={{ color: "var(--primary)" }} />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-bold text-foreground">
                      {t(platform.labelKey)}
                    </p>
                  </div>
                </div>

                <div className="relative mt-1">
                  <LinkIcon
                    size={14}
                    className="absolute start-3 top-1/2 -translate-y-1/2 text-muted-foreground/80pointer-events-none"
                  />
                  <Input
                    {...register(platform.id)}
                    type="url"
                    className={cn(
                      "h-10 ps-8 text-xs main-card",
                      fieldError &&
                      "border-destructive focus-visible:ring-destructive",
                    )}
                    placeholder={`https://${platform.id}.com/...`}
                    dir="ltr"
                  />
                </div>
                {fieldError && (
                  <p className="text-[10px] text-destructive mt-1">
                    {fieldError}
                  </p>
                )}
              </div>
            );
          })}
        </div>

        <SaveFooter
          onSave={handleSubmit(onSubmit)}
          saving={isSubmitting}
          label={t("common.saveChanges")}
        />
      </SettingCard>
    </form>
  );
}


function WhatsAppTab({ t }) {
  const [loading, setLoading] = useState(true);
  const [whatsappIntegrationMode, setWhatsappIntegrationMode] = useState("embedded_signup");

  useEffect(() => {
    (async () => {
      setLoading(true);
      try {
        const res = await api.get("/admin-settings");
        const data = res.data || {};
        setWhatsappIntegrationMode(data.whatsappIntegrationMode || "embedded_signup");
      } catch (err) {
        toast.error(t("toast.loadError"));
      } finally {
        setLoading(false);
      }
    })();
  }, [t]);

  const onSave = async () => {
    try {
      await api.patch("/admin-settings", { whatsappIntegrationMode });
      toast.success(t("toast.saveSuccess"));
    } catch (err) {
      const msg = err.response?.data?.message || t("toast.saveError");
      toast.error(Array.isArray(msg) ? msg[0] : msg);
    }
  };

  if (loading)
    return (
      <SettingCard>
        <FormSkeleton rows={3} />
      </SettingCard>
    );

  const MODES = [
    { id: "embedded_signup", name: t("whatsapp.modes.embedded_signup.name"), desc: t("whatsapp.modes.embedded_signup.desc") },
    { id: "manual", name: t("whatsapp.modes.manual.name"), desc: t("whatsapp.modes.manual.desc") },
    { id: "none", name: t("whatsapp.modes.none.name"), desc: t("whatsapp.modes.none.desc") },
  ];

  return (
    <div className="space-y-6">
      <SettingCard className="border-0 bg-transparent shadow-none">
        <SectionHead
          title={t("whatsapp.title")}
          subtitle={t("whatsapp.subtitle")}
        />
        <div className="space-y-3 p-6 main-card rounded-2xl border border-border/50 shadow-[0_1px_3px_rgba(0,0,0,0.05)]">
          {MODES.map((mode) => (
            <div
              key={mode.id}
              className={`flex items-center gap-3 p-4 rounded-xl border-2 cursor-pointer transition-all ${whatsappIntegrationMode === mode.id
                ? "border-primary bg-primary/5"
                : "border-slate-200 dark:border-slate-700"
                }`}
              onClick={() => setWhatsappIntegrationMode(mode.id)}
            >
              <div
                className="flex items-center justify-center w-5 h-5 rounded-full border-2 mr-2 transition-all"
                style={{
                  borderColor: whatsappIntegrationMode === mode.id ? "#6366f1" : "#d1d5db"
                }}
              >
                {whatsappIntegrationMode === mode.id && (
                  <div
                    className="w-2.5 h-2.5 rounded-full"
                    style={{ backgroundColor: "#6366f1" }}
                  />
                )}
              </div>
              <div className="flex-1">
                <div className="font-medium">{mode.name}</div>
                <div className="text-xs text-slate-500 dark:text-slate-400">{mode.desc}</div>
              </div>
            </div>
          ))}
        </div>
        <SaveFooter
          onSave={onSave}
          saving={false}
          label={t("common.saveChanges")}
        />
      </SettingCard>
    </div>
  );
}

function toDateInput(value) {
  if (!value) return "";
  const m = String(value).match(/^(\d{4}-\d{2}-\d{2})/);
  return m ? m[1] : "";
}

function toDurationInput(value) {
  return value === null || value === undefined ? "" : value;
}

function allowanceModeOf(allowance) {
  return allowance === null ? "unlimited" : "limited";
}

function allowancePatch(mode, units) {
  return mode === "unlimited" ? null : { units: Number(units) };
}

function AllowanceModePicker({ modes, value, onChange }) {
  return modes.map((mode) => (
    <div
      key={mode.id}
      className={`flex items-center gap-3 p-4 rounded-xl border-2 cursor-pointer transition-all ${
        value === mode.id
          ? "border-primary bg-primary/5"
          : "border-slate-200 dark:border-slate-700"
      }`}
      onClick={() => onChange(mode.id)}
    >
      <div
        className="flex items-center justify-center w-5 h-5 rounded-full border-2 mr-2 transition-all"
        style={{ borderColor: value === mode.id ? "#6366f1" : "#d1d5db" }}
      >
        {value === mode.id && (
          <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: "#6366f1" }} />
        )}
      </div>
      <div className="flex-1">
        <div className="font-medium">{mode.name}</div>
        <div className="text-xs text-slate-500 dark:text-slate-400">{mode.desc}</div>
      </div>
    </div>
  ));
}

/* ═══════════════════════════════════════════════════════════════
   AI TAB — one window for all AI types; three product sections
═══════════════════════════════════════════════════════════════ */
function AiTab({ t }) {
  const [loading, setLoading] = useState(true);
  const {
    register,
    handleSubmit,
    reset,
    watch,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm({
    resolver: yupResolver(createAiSchema(t)),
    defaultValues: {
      durationDays: "",
      allowanceAnchorDate: "",
      decisionTokenPrice: 0.5,
      decisionAllowanceMode: "limited",
      decisionUnits: 0,
      mediaTokenPrice: 0.5,
      mediaAudioMinutePrice: 0.006,
      mediaAllowanceMode: "limited",
      mediaUnits: 0,
      hostedInputTokenPrice: 0.5,
      hostedOutputTokenPrice: 0.5,
      hostedAllowanceMode: "limited",
      hostedUnits: 0,
    },
  });

  const decisionAllowanceMode = watch("decisionAllowanceMode");
  const mediaAllowanceMode = watch("mediaAllowanceMode");
  const hostedAllowanceMode = watch("hostedAllowanceMode");

  useEffect(() => {
    (async () => {
      setLoading(true);
      try {
        const res = await api.get("/admin-settings");
        const billing = res.data?.billing || {};
        const decision = billing.aiDecision || {};
        const media = billing.aiMedia || {};
        const hosted = billing.aiHosted || {};
        const decisionAllowance =
          decision.allowance === undefined ? { units: 0 } : decision.allowance;
        const mediaAllowance =
          media.allowance === undefined ? { units: 0 } : media.allowance;
        const hostedAllowance =
          hosted.allowance === undefined ? { units: 0 } : hosted.allowance;
        reset({
          durationDays: toDurationInput(billing.allowanceDurationDays),
          allowanceAnchorDate: toDateInput(billing.allowanceAnchorDate),
          decisionTokenPrice: decision.tokenPrice ?? decision.inputPerMillion ?? 0.5,
          decisionAllowanceMode: allowanceModeOf(decisionAllowance),
          decisionUnits: decisionAllowance?.units ?? 0,
          mediaTokenPrice: media.tokenPrice ?? 0.5,
          mediaAudioMinutePrice: media.audioMinutePrice ?? 0.006,
          mediaAllowanceMode: allowanceModeOf(mediaAllowance),
          mediaUnits: mediaAllowance?.units ?? 0,
          hostedInputTokenPrice:
            hosted.inputTokenPrice ?? hosted.tokenPrice ?? 0.5,
          hostedOutputTokenPrice:
            hosted.outputTokenPrice ?? hosted.tokenPrice ?? 0.5,
          hostedAllowanceMode: allowanceModeOf(hostedAllowance),
          hostedUnits: hostedAllowance?.units ?? 0,
        });
      } catch (err) {
        toast.error(t("toast.loadError"));
      } finally {
        setLoading(false);
      }
    })();
  }, [reset, t]);

  const onSubmit = async (values) => {
    try {
      const durationRaw =
        values.durationDays === "" ||
        values.durationDays === null ||
        values.durationDays === undefined
          ? null
          : Number(values.durationDays);
      const anchorRaw =
        values.allowanceAnchorDate === "" || values.allowanceAnchorDate == null
          ? null
          : values.allowanceAnchorDate;
      await api.patch("/admin-settings", {
        billing: {
          allowanceDurationDays: durationRaw,
          allowanceAnchorDate: anchorRaw,
          aiDecision: {
            tokenPrice: Number(values.decisionTokenPrice),
            allowance: allowancePatch(
              values.decisionAllowanceMode,
              values.decisionUnits,
            ),
          },
          aiMedia: {
            tokenPrice: Number(values.mediaTokenPrice),
            audioMinutePrice: Number(values.mediaAudioMinutePrice),
            allowance: allowancePatch(
              values.mediaAllowanceMode,
              values.mediaUnits,
            ),
          },
          aiHosted: {
            inputTokenPrice: Number(values.hostedInputTokenPrice),
            outputTokenPrice: Number(values.hostedOutputTokenPrice),
            allowance: allowancePatch(
              values.hostedAllowanceMode,
              values.hostedUnits,
            ),
          },
        },
      });
      toast.success(t("toast.saveSuccess"));
    } catch (err) {
      const msg = err.response?.data?.message || t("toast.saveError");
      toast.error(Array.isArray(msg) ? msg[0] : msg);
    }
  };

  if (loading)
    return (
      <SettingCard>
        <FormSkeleton rows={8} />
      </SettingCard>
    );

  return (
    <>
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      <SettingCard className=" border-0 bg-transparent shadow-none">
        <SectionHead title={t("ai.sharedTitle")} subtitle={t("ai.sharedSubtitle")} />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-6 main-card rounded-2xl border border-border/50 shadow-[0_1px_3px_rgba(0,0,0,0.05)]">
          <Field label={t("ai.durationLabel")} error={errors.durationDays?.message}>
            <Input
              {...register("durationDays")}
              type="number"
              min={0}
              step={1}
              className="h-11"
              placeholder={t("ai.durationPlaceholder")}
              dir="ltr"
            />
            <p className="text-[11px] text-muted-foreground">{t("ai.durationHint")}</p>
          </Field>
          <Field label={t("ai.cutoffLabel")} error={errors.allowanceAnchorDate?.message}>
            <Input {...register("allowanceAnchorDate")} type="date" className="h-11" dir="ltr" />
            <p className="text-[11px] text-muted-foreground">{t("ai.cutoffHint")}</p>
          </Field>
        </div>
      </SettingCard>

      <SettingCard className=" border-0 bg-transparent shadow-none">
        <div className="flex items-center gap-2 mb-1">
          <Brain size={16} className="text-primary" />
          <SectionHead title={t("aiDecision.pricingTitle")} subtitle={t("aiDecision.pricingSubtitle")} />
        </div>
        <div className="p-6 main-card rounded-2xl border border-border/50 shadow-[0_1px_3px_rgba(0,0,0,0.05)] space-y-4">
          <Field label={t("aiDecision.tokenPriceLabel")} error={errors.decisionTokenPrice?.message} required>
            <Input
              {...register("decisionTokenPrice")}
              type="number"
              min={0}
              step="any"
              className="h-11"
              placeholder="0.5"
              dir="ltr"
            />
            <p className="text-[11px] text-muted-foreground">{t("aiDecision.tokenPriceHint")}</p>
          </Field>
          <SectionHead title={t("aiDecision.allowanceTitle")} subtitle={t("aiDecision.allowanceSubtitle")} />
          <AllowanceModePicker
            value={decisionAllowanceMode}
            onChange={(id) => setValue("decisionAllowanceMode", id, { shouldValidate: true })}
            modes={[
              { id: "unlimited", name: t("aiDecision.modes.unlimited.name"), desc: t("aiDecision.modes.unlimited.desc") },
              { id: "limited", name: t("aiDecision.modes.limited.name"), desc: t("aiDecision.modes.limited.desc") },
            ]}
          />
          {decisionAllowanceMode === "limited" ? (
            <Field label={t("aiDecision.unitsLabel")} error={errors.decisionUnits?.message} required>
              <Input {...register("decisionUnits")} type="number" min={0} step={1} className="h-11" dir="ltr" />
              <p className="text-[11px] text-muted-foreground">{t("aiDecision.unitsHint")}</p>
            </Field>
          ) : (
            <p className="text-xs text-slate-500 dark:text-slate-400">{t("aiDecision.unlimitedNote")}</p>
          )}
        </div>
      </SettingCard>

      <SettingCard className=" border-0 bg-transparent shadow-none">
        <div className="flex items-center gap-2 mb-1">
          <ImageIcon size={16} className="text-primary" />
          <SectionHead title={t("aiMedia.pricingTitle")} subtitle={t("aiMedia.pricingSubtitle")} />
        </div>
        <div className="p-6 main-card rounded-2xl border border-border/50 shadow-[0_1px_3px_rgba(0,0,0,0.05)] space-y-4">
          <Field label={t("aiMedia.tokenPriceLabel")} error={errors.mediaTokenPrice?.message}>
            <Input {...register("mediaTokenPrice")} type="number" min={0} step="0.0001" className="h-11" dir="ltr" />
            <p className="text-[11px] text-muted-foreground">{t("aiMedia.tokenPriceHint")}</p>
          </Field>
          <Field label={t("aiMedia.audioMinutePriceLabel")} error={errors.mediaAudioMinutePrice?.message}>
            <Input {...register("mediaAudioMinutePrice")} type="number" min={0} step="0.0001" className="h-11" dir="ltr" />
            <p className="text-[11px] text-muted-foreground">{t("aiMedia.audioMinutePriceHint")}</p>
          </Field>
          <SectionHead title={t("aiMedia.allowanceTitle")} subtitle={t("aiMedia.allowanceSubtitle")} />
          <AllowanceModePicker
            value={mediaAllowanceMode}
            onChange={(id) => setValue("mediaAllowanceMode", id, { shouldValidate: true })}
            modes={[
              { id: "unlimited", name: t("aiMedia.modes.unlimited.name"), desc: t("aiMedia.modes.unlimited.desc") },
              { id: "limited", name: t("aiMedia.modes.limited.name"), desc: t("aiMedia.modes.limited.desc") },
            ]}
          />
          {mediaAllowanceMode === "limited" ? (
            <Field label={t("aiMedia.unitsLabel")} error={errors.mediaUnits?.message} required>
              <Input {...register("mediaUnits")} type="number" min={0} step={1} className="h-11" dir="ltr" />
            </Field>
          ) : (
            <p className="text-xs text-slate-500 dark:text-slate-400">{t("aiMedia.unlimitedNote")}</p>
          )}
        </div>
      </SettingCard>

      <SettingCard className=" border-0 bg-transparent shadow-none">
        <div className="flex items-center gap-2 mb-1">
          <Sparkles size={16} className="text-primary" />
          <SectionHead title={t("aiHosted.sectionTitle")} subtitle={t("aiHosted.sectionSubtitle")} />
        </div>
        <div className="p-6 main-card rounded-2xl border border-border/50 shadow-[0_1px_3px_rgba(0,0,0,0.05)] space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Field label={t("aiHosted.inputTokenPriceLabel")} error={errors.hostedInputTokenPrice?.message} required>
              <Input
                {...register("hostedInputTokenPrice")}
                type="number"
                min={0}
                step="any"
                className="h-11"
                placeholder="0.5"
                dir="ltr"
              />
              <p className="text-[11px] text-muted-foreground">{t("aiHosted.inputTokenPriceHint")}</p>
            </Field>
            <Field label={t("aiHosted.outputTokenPriceLabel")} error={errors.hostedOutputTokenPrice?.message} required>
              <Input
                {...register("hostedOutputTokenPrice")}
                type="number"
                min={0}
                step="any"
                className="h-11"
                placeholder="0.5"
                dir="ltr"
              />
              <p className="text-[11px] text-muted-foreground">{t("aiHosted.outputTokenPriceHint")}</p>
            </Field>
          </div>
          <SectionHead title={t("aiHosted.allowanceTitle")} subtitle={t("aiHosted.allowanceSubtitle")} />
          <AllowanceModePicker
            value={hostedAllowanceMode}
            onChange={(id) => setValue("hostedAllowanceMode", id, { shouldValidate: true })}
            modes={[
              { id: "unlimited", name: t("aiHosted.modes.unlimited.name"), desc: t("aiHosted.modes.unlimited.desc") },
              { id: "limited", name: t("aiHosted.modes.limited.name"), desc: t("aiHosted.modes.limited.desc") },
            ]}
          />
          {hostedAllowanceMode === "limited" ? (
            <Field label={t("aiHosted.unitsLabel")} error={errors.hostedUnits?.message} required>
              <Input {...register("hostedUnits")} type="number" min={0} step={1} className="h-11" dir="ltr" />
            </Field>
          ) : (
            <p className="text-xs text-slate-500 dark:text-slate-400">{t("aiHosted.unlimitedNote")}</p>
          )}
        </div>
        <SaveFooter onSave={handleSubmit(onSubmit)} saving={isSubmitting} label={t("common.saveChanges")} />
      </SettingCard>
    </form>
      <SettingCard className=" border-0 bg-transparent shadow-none">
        <HostedModelsCatalog />
      </SettingCard>
    </>
  );
}