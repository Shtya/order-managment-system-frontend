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
} from "lucide-react";

import api from "@/utils/api";
import { cn } from "@/utils/cn";
import PageHeader from "@/components/atoms/Pageheader";
import Button_ from "@/components/atoms/Button";
import { Input } from "@/components/ui/input";

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
    // Add more tabs here in the future (e.g., 'billing', 'security')
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
