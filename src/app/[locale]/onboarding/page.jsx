"use client";

import { useState, useEffect, useMemo, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import toast from "react-hot-toast";
import api from "@/utils/api";
import { useForm, Controller } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import * as yup from "yup";

import {
  AlertCircle,
  ArrowRight,
  Check,
  Copy,
  Crown,
  ExternalLink,
  HelpCircle,
  Loader2,
  MessageCircle,
  Package,
  RefreshCw,
  RotateCcw,
  Settings2,
  Store,
  Truck,
  Upload,
  Users,
  Webhook,
  X,
  Zap,
} from "lucide-react";
import { useRouter } from "@/i18n/navigation";
import {
  PROVIDER_META,
  SHIP_PROVIDERS,
  useShippingSettings,
  useShippingWebhook,
} from "@/hook/shipping";
import { useLocale, useTranslations } from "next-intl";
import {
  STORE_PROVIDERS,
  PROVIDER_CONFIG,
  generateEasyOrdersInstallUrl,
} from "@/hook/stores";
import {
  StoreConfigDialog,
  StoreWebhookModal,
  StoreGuideModal,
} from "../store-integration/page";
import { useSocket } from "@/context/SocketContext";
import { CustomTooltip } from "@/components/atoms/Actions";
import { useSubscriptionsApi } from "../plans/page";
import { cn } from "@/utils/cn";
import { usePlatformSettings } from "@/context/PlatformSettingsContext";
import { useAuth } from "@/context/AuthContext";
/* ─── CSS ─────────────────────────────────────────────────── */
const CSS = `
  @import url('https://fonts.googleapis.com/css2?family=Cairo:wght@300;400;500;600;700;800;900&family=JetBrains+Mono:wght@400;600&display=swap');

  :root {
    --p:         #6763AF;
    --p2:        #5750a0;
    --p-light:   #8c89c8;
    --p-xlight:  #edeeff;
    --p-dark:    #4a4788;
    --p-glow:    rgba(103,99,175,.18);
    --text:      #16162a;
    --text-2:    #4b4b6a;
    --text-3:    #9090b0;
    --border:    #e3e2f0;
    --bg:        #eeedf6;
    --surface:   #ffffff;
    --surface2:  #f7f7fc;
    --radius-sm: 10px;
    --radius:    16px;
    --radius-xl: 26px;
    --font:      'Cairo', sans-serif;
    --mono:      'JetBrains Mono', monospace;
    --shadow-sm: 0 2px 8px rgba(103,99,175,.08);
    --shadow:    0 8px 32px rgba(103,99,175,.13);
    --shadow-lg: 0 24px 64px rgba(103,99,175,.16);
  }

  .ob-root, .ob-root *, .ob-root *::before, .ob-root *::after { box-sizing: border-box; margin: 0; padding: 0; }
  .ob-root {
    font-family: var(--font);
    background: var(--bg);
    color: var(--text);
    -webkit-font-smoothing: antialiased;
    min-height: 100vh;
  }

  /* ── Inputs ── */
  .ob-input {
    width: 100%; height: 48px;
    padding: 0 44px 0 14px;
    background: var(--surface2);
    border: 1.5px solid var(--border);
    border-radius: var(--radius-sm);
    font-family: var(--font); font-size: 14px; color: var(--text);
    outline: none;
    transition: border-color .18s, box-shadow .18s, background .18s;
  }
  .ob-input:focus {
    border-color: var(--p);
    background: var(--surface);
    box-shadow: 0 0 0 3px var(--p-glow);
  }
  .ob-input.error { border-color: #ef4444; background: #fff5f5; }
  .ob-input[disabled] { opacity: .5; pointer-events: none; }

  .ob-textarea {
    width: 100%;
    padding: 12px 44px 12px 14px;
    background: var(--surface2);
    border: 1.5px solid var(--border);
    border-radius: var(--radius-sm);
    font-family: var(--font); font-size: 14px; color: var(--text);
    outline: none; resize: none;
    transition: border-color .18s, box-shadow .18s;
  }
  .ob-textarea:focus {
    border-color: var(--p);
    background: var(--surface);
    box-shadow: 0 0 0 3px var(--p-glow);
  }

  /* ── Spinner ── */
  @keyframes spin { to { transform: rotate(360deg); } }
  .spinner {
    width: 18px; height: 18px;
    border: 2.5px solid rgba(255,255,255,.3);
    border-top-color: #fff;
    border-radius: 50%;
    animation: spin .65s linear infinite;
    flex-shrink: 0;
  }

  /* ── Scrollbar ── */
  ::-webkit-scrollbar { width: 5px; }
  ::-webkit-scrollbar-track { background: transparent; }
  ::-webkit-scrollbar-thumb { background: var(--border); border-radius: 99px; }
  ::-webkit-scrollbar-thumb:hover { background: var(--p-light); }

  /* ── Plan cards ── */
  .plan-card {
    border: 2px solid var(--border);
    border-radius: 16px;
    padding: 22px 20px;
    cursor: pointer;
    transition: border-color .22s, box-shadow .22s, transform .22s;
    background: var(--surface);
    position: relative; overflow: hidden;
  }
  .plan-card:hover {
    border-color: var(--p-light);
    box-shadow: 0 8px 28px rgba(103,99,175,.12);
    transform: translateY(-2px);
  }
  .plan-card.selected {
    border-color: var(--p);
    box-shadow: 0 8px 32px rgba(103,99,175,.22);
    background: linear-gradient(145deg, #fff 60%, var(--p-xlight));
  }

  /* ── Provider cards ── */
  .prov-card {
    border: 1.5px solid var(--border);
    border-radius: 14px;
    padding: 16px 18px;
    display: flex; align-items: center; gap: 14px;
    cursor: pointer;
    transition: all .2s;
    background: var(--surface);
  }
  .prov-card:hover { border-color: var(--p-light); background: var(--p-xlight); transform: translateY(-1px); }
  .prov-card.active { border-color: var(--p); background: var(--p-xlight); }
  .prov-card.connected { border-color: #10b981; background: #f0fdf4; }

  /* ── Toaster ── */
  [data-sonner-toaster] { font-family: var(--font) !important; }
`;

/* ─── Icons ───────────────────────────────────────────────── */
const IcArrow = () => {
  const locale = useLocale();
  const isRTL = locale === "ar";
  return (<svg
    width="15"
    height="15"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2.2"
    strokeLinecap="round"
    strokeLinejoin="round"
    style={{ transform: isRTL ? "scaleX(-1)" : "none" }}
  >
    <path d="M5 12h14" />
    <path d="m12 5 7 7-7 7" />
  </svg>)
};
const IcCheck = ({ style, size = 13 }) => {
  const locale = useLocale();
  const isRTL = locale === "ar";
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      style={{ transform: isRTL ? "scaleX(-1)" : "none", ...style }}
    >
      <polyline points="20 6 9 17 4 12" />
    </svg>
  )
};
const IcUser = () => {
  const locale = useLocale();
  const isRTL = locale === "ar";
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      style={{ transform: isRTL ? "scaleX(-1)" : "none" }}
    >
      <circle cx="12" cy="8" r="5" />
      <path d="M20 21a8 8 0 1 0-16 0" />
    </svg>
  )
};
const IcBuild = () => {
  const locale = useLocale();
  const isRTL = locale === "ar";
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      style={{ transform: isRTL ? "scaleX(-1)" : "none" }}
    >
      <rect x="3" y="3" width="18" height="18" rx="3" />
      <path d="M3 9h18M9 21V9" />
    </svg>
  )
};
const IcLink = () => {
  const locale = useLocale();
  const isRTL = locale === "ar";
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      style={{ transform: isRTL ? "scaleX(-1)" : "none" }}
    >
      <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" />
      <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" />
    </svg>
  )
};
const IcShip = () => {
  const locale = useLocale();
  const isRTL = locale === "ar";
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      style={{ transform: isRTL ? "scaleX(-1)" : "none" }}
    >
      <path d="M5 17H3a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v9a2 2 0 0 1-2 2h-3" />
      <circle cx="9" cy="19" r="2" />
      <circle cx="17" cy="19" r="2" />
    </svg>
  )
};
const IcStar = () => {
  const locale = useLocale();
  const isRTL = locale === "ar";
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      style={{ transform: isRTL ? "scaleX(-1)" : "none" }}
    >
      <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
    </svg>
  )
};
const IcGlobe = () => {
  const locale = useLocale();
  const isRTL = locale === "ar";
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      style={{ transform: isRTL ? "scaleX(-1)" : "none" }}
    >
      <circle cx="12" cy="12" r="10" />
      <line x1="2" y1="12" x2="22" y2="12" />
      <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
    </svg>
  )
};
const IcPhone = () => {
  const locale = useLocale();
  const isRTL = locale === "ar";
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      style={{ transform: isRTL ? "scaleX(-1)" : "none" }}
    >
      <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07A19.5 19.5 0 0 1 4.69 12 19.79 19.79 0 0 1 1.61 3.38 2 2 0 0 1 3.58 1h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L7.91 8.56a16 16 0 0 0 6.29 6.29l.87-.87a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 22 16.92z" />
    </svg>
  )
};
const IcLock = () => {
  const locale = useLocale();
  const isRTL = locale === "ar";
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      style={{ transform: isRTL ? "scaleX(-1)" : "none" }}
    >
      <rect x="3" y="11" width="18" height="11" rx="2" />
      <path d="M7 11V7a5 5 0 0 1 10 0v4" />
    </svg>
  )
};

function Field({ label, required, children, error, style }) {
  return (
    <div style={{ marginBottom: 14, ...style }}>
      {label && (
        <label
          style={{
            display: "block",
            fontSize: 12.5,
            fontWeight: 600,
            color: "var(--text-2)",
            marginBottom: 6,
          }}
        >
          {label}
          {required && (
            <span style={{ color: "var(--p)", marginRight: 3 }}>*</span>
          )}
        </label>
      )}
      {children}
      <AnimatePresence>
        {error && (
          <motion.p
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            style={{ fontSize: 11.5, color: "#ef4444", marginTop: 4 }}
          >
            ⚠ {error}
          </motion.p>
        )}
      </AnimatePresence>
    </div>
  );
}

function InputWrap({ icon, children }) {
  return (
    <div style={{ position: "relative" }}>
      {icon && (
        <span
          style={{
            position: "absolute",
            right: 14,
            top: "50%",
            transform: "translateY(-50%)",
            color: "var(--text-3)",
            display: "flex",
            pointerEvents: "none",
            zIndex: 1,
          }}
        >
          {icon}
        </span>
      )}
      {children}
    </div>
  );
}

/* Custom select matching auth pattern */
function ObSelect({ icon, value, onChange, onBlur, children, error, style }) {
  return (
    <div style={{ position: "relative" }}>
      {icon && (
        <span
          style={{
            position: "absolute",
            right: 14,
            top: "50%",
            transform: "translateY(-50%)",
            color: "var(--text-3)",
            display: "flex",
            pointerEvents: "none",
            zIndex: 1,
          }}
        >
          {icon}
        </span>
      )}
      <span
        style={{
          position: "absolute",
          left: 8,
          top: "50%",
          transform: "translateY(-50%)",
          color: "var(--text-3)",
          display: "flex",
          pointerEvents: "none",
          zIndex: 1,
          paddingRight: 8,
          borderRight: "1px solid var(--border)",
          height: 20,
          alignItems: "center",
        }}
      >
        <svg
          width="13"
          height="13"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <polyline points="6 9 12 15 18 9" />
        </svg>
      </span>
      <select
        value={value}
        onChange={onChange}
        onBlur={onBlur}
        style={{
          width: "100%",
          height: 48,
          padding: "0 44px 0 32px",
          background: "var(--surface2)",
          border: `1.5px solid ${error ? "#ef4444" : "var(--border)"}`,
          borderRadius: "var(--radius-sm)",
          fontFamily: "var(--font)",
          fontSize: 14,
          color: "var(--text)",
          outline: "none",
          appearance: "none",
          cursor: "pointer",
          transition: "border-color .18s, box-shadow .18s",
          ...style,
        }}
        onFocus={(e) => {
          e.target.style.borderColor = "var(--p)";
          e.target.style.boxShadow = "0 0 0 3px var(--p-glow)";
          e.target.style.background = "var(--surface)";
        }}
        onBlurCapture={(e) => {
          e.target.style.borderColor = error ? "#ef4444" : "var(--border)";
          e.target.style.boxShadow = "none";
          e.target.style.background = "var(--surface2)";
        }}
      >
        {children}
      </select>
    </div>
  );
}

export default function OnboardingPage() {
  const tp = useTranslations("onboarding.plans");
  const t = useTranslations("onboarding.toasts");
  const { getDashboardRoute } = useAuth();
  const [step, setStep] = useState(0); // Start null to show a loader
  const [dbStep, setDbStep] = useState(null); // Furthest step reached
  const { user, isLoading: loadingUser } = useAuth(); // Furthest step reached
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const stepMap = {
    welcome: 0,
    plan: 1,
    company: 2,
    store: 3,
    shipping: 4,
    finished: 5,
  };

  const indexMap = {
    0: "welcome",
    1: "plan",
    2: "company",
    3: "store",
    4: "shipping",
    5: "finished"
  }

  // PROBLEM 2 FIX: Resume from last time
  useEffect(() => {
    async function init() {
      try {
        if (!user && !loadingUser) {
          toast.error(t("login_required"));
          setStep(-2); // e.g., -2 = unauthorized
          setTimeout(() => {
            router.replace("/auth?mode=signin");
          }, 1200);
        }
        if (!user) {
          return;
        }
        // Only admins can access onboarding
        if (user.role.name !== "admin") {
          toast.error(t("admin_only"));
          setStep(-2); // e.g., -2 = unauthorized
          setTimeout(() => {
            router.replace("/");
          }, 1200);
          return;
        }

        if (user.onboardingStatus === "completed") {
          const redirect = getDashboardRoute(user);
          setStep(5);
          setTimeout(() => {
            router.replace(redirect);
          }, 1200);
          return;
        }

        const current = stepMap[user.currentOnboardingStep] || 0;
        if (current === undefined) {
          setStep(-1);
          return;
        }
        setStep(current);
        setDbStep(current);
      } catch (error) {
        console.error("Error during onboarding initialization:", error);
        const status = error?.response?.status;

        if (status === 401) {
          toast.error(t("session_expired"));
        } else if (status === 403) {
          toast.error(t("admin_only_page"));
        } else {
          toast.error(t("unexpected_error"));
        }
        setStep(-2); // e.g., -2 = unauthorized
        setTimeout(() => {
          router.push("/auth?mode=signin");
        }, 1200);
      } finally {
        setLoading(false);
      }
    }
    init();
  }, [user, loadingUser]);

  const [nextLoading, setNextLoading] = useState(false);

  const next = async () => {
    // If current step is less than the max saved step, just increment locally
    if (step < dbStep) {
      setStep((s) => s + 1);
      return;
    }
    const enumStep = indexMap[step] || "welcome";
    setNextLoading(true); // start loading
    try {
      const { data } = await api.post(`/users/onboarding/next/${enumStep}`);
      const nextIndex = stepMap[data.nextStep];

      setStep(() => nextIndex);
      setDbStep(() => nextIndex);
    } catch (err) {
      const msg = err.response?.data?.message || t("unexpected_error");
      toast.error(msg);
    } finally {
      setNextLoading(false); // stop loading
    }
  };

  const back = () => setStep((s) => Math.max(s - 1, 0));

  if (loading) {
    return (
      <div
        style={{
          minHeight: "100vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background:
            "linear-gradient(145deg, #eeeef8 0%, #e8e7f4 50%, #f3f3fb 100%)",
          padding: 24,
        }}
      >
        <OnboardingSkeleton />
      </div>
    );
  }

  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: CSS }} />

      <div
        style={{
          minHeight: "100vh",
          background:
            "linear-gradient(145deg, #eeeef8 0%, #e8e7f4 50%, #f3f3fb 100%)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          padding: 24,
          position: "relative",
        }}
      >
        {/* bg dot grid */}
        <div
          style={{
            position: "fixed",
            inset: 0,
            pointerEvents: "none",
            zIndex: 0,
            backgroundImage:
              "radial-gradient(circle, rgba(103,99,175,.09) 1px, transparent 1px)",
            backgroundSize: "28px 28px",
          }}
        />
        {/* ambient orb */}
        <motion.div
          style={{
            position: "fixed",
            bottom: "-8%",
            right: "5%",
            width: 400,
            height: 400,
            borderRadius: "50%",
            background:
              "radial-gradient(circle, rgba(103,99,175,.1), transparent 70%)",
            filter: "blur(60px)",
            pointerEvents: "none",
            zIndex: 0,
          }}
          animate={{ scale: [1, 1.1, 1], y: [0, -20, 0] }}
          transition={{ duration: 12, repeat: Infinity, ease: "easeInOut" }}
        />

        <motion.div
          initial={{ opacity: 0, scale: 0.97, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
          style={{
            display: "flex",
            borderRadius: "var(--radius-xl)",
            boxShadow:
              "0 28px 80px rgba(103,99,175,.18), 0 4px 16px rgba(0,0,0,.06)",
            border: "1px solid rgba(255,255,255,.85)",
            overflow: "hidden",
            width: "100%",
            maxWidth:
              step === 0 ? 1000 : step === 1 ? 1160 : step === 2 ? 960 : 900,
            minHeight: 580,
            position: "relative",
            zIndex: 1,
            transition: "max-width .35s ease",
          }}
        >
          <Sidebar step={step} />

          {/* Content pane */}
          <div
            style={{
              flex: 1,
              background: "var(--surface)",
              padding: "44px 40px",
              overflowY: "auto",
              maxHeight: "88vh",
            }}
          >
            <AnimatePresence mode="wait">
              <WelcomeStep
                key="w"
                onNext={next}
                loading={loading}
                open={step === 0}
                nextLoading={nextLoading}
              />
              <PlanStep
                key="p"
                onNext={next}
                onBack={back}
                selectedId={user?.subscriptions?.[0]?.planId}
                open={step === 1}
                nextLoading={nextLoading}
              />
              <CompanyStep
                key="c"
                onNext={next}
                onBack={back}
                open={step === 2}
                nextLoading={nextLoading}
              />
              <StoreStep
                key="s"
                onNext={next}
                onBack={back}
                open={step === 3}
                nextLoading={nextLoading}
              />
              <ShippingStep
                key="sh"
                onNext={next}
                onBack={back}
                open={step === 4}
                nextLoading={nextLoading}
              />
              <FinishedStep key="f" open={step === 5} />
              {step === -1 && <NoStepFound />}
              {step === -2 && <UnauthorizedUser />}
            </AnimatePresence>
          </div>
        </motion.div>
      </div>
    </>
  );
}

/* ─── Sidebar ─────────────────────────────────────────────── */
function Sidebar({ step }) {
  const t = useTranslations("onboarding");
  const STEPS_META = [
    { icon: <IcUser />, label: t("steps.welcome.label"), sub: t("steps.welcome.sub") },
    { icon: <IcStar />, label: t("steps.plan.label"), sub: t("steps.plan.sub") },
    { icon: <IcBuild />, label: t("steps.company.label"), sub: t("steps.company.sub") },
    { icon: <IcLink />, label: t("steps.store.label"), sub: t("steps.store.sub") },
    { icon: <IcShip />, label: t("steps.shipping.label"), sub: t("steps.shipping.sub") },
  ];
  return (
    <div
      style={{
        width: 230,
        flexShrink: 0,
        background:
          "linear-gradient(175deg, #1a1740 0%, #231f55 55%, #2d2870 100%)",
        display: "flex",
        flexDirection: "column",
        padding: "36px 22px",
        position: "relative",
        overflow: "hidden",
      }}
    >
      {/* subtle dot grid */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          opacity: 0.06,
          backgroundImage:
            "radial-gradient(circle, rgba(255,255,255,.8) 1px, transparent 1px)",
          backgroundSize: "22px 22px",
          pointerEvents: "none",
        }}
      />
      {/* glow orb */}
      <div
        style={{
          position: "absolute",
          bottom: "-15%",
          left: "-20%",
          width: 280,
          height: 280,
          borderRadius: "50%",
          background:
            "radial-gradient(circle, rgba(155,140,240,.22), transparent 70%)",
          filter: "blur(50px)",
          pointerEvents: "none",
        }}
      />

      {/* Logo */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 11,
          marginBottom: 48,
          position: "relative",
          zIndex: 1,
        }}
      >
        <div
          style={{
            width: 42,
            height: 42,
            borderRadius: 13,
            background: "rgba(255,255,255,.14)",
            border: "1px solid rgba(255,255,255,.2)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            boxShadow: "0 4px 16px rgba(0,0,0,.22)",
          }}
        >
          <svg
            width="20"
            height="20"
            viewBox="0 0 24 24"
            fill="none"
            stroke="#fff"
            strokeWidth="2.2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" />
            <polyline points="3.27 6.96 12 12.01 20.73 6.96" />
            <line x1="12" y1="22.08" x2="12" y2="12" />
          </svg>
        </div>
        <div>
          <div
            style={{
              fontSize: 17,
              fontWeight: 800,
              color: "#fff",
              letterSpacing: "-0.3px",
            }}
          >
            {t("brand")}
          </div>
        </div>
      </div>

      {/* Steps */}
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          gap: 4,
          flex: 1,
          position: "relative",
          zIndex: 1,
        }}
      >
        {/* connector line */}
        <div
          style={{
            position: "absolute",
            right: -10,
            top: 0,
            bottom: 20,
            width: 2,
            background: "rgba(255,255,255,.08)",
            borderRadius: 99,
          }}
        >
          <motion.div
            style={{
              width: "100%",
              background:
                "linear-gradient(180deg, rgba(255,255,255,.5), rgba(255,255,255,.15))",
              borderRadius: 99,
              transformOrigin: "top",
            }}
            animate={{ height: `${Math.min(100, step / (STEPS_META.length - 1)) * 100}%` }}
            transition={{ duration: 0.5, ease: "easeOut" }}
          />
        </div>

        {STEPS_META.map((s, i) => {
          const done = i < step;
          const current = i === step;
          return (
            <motion.div
              key={i}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 12,
                padding: "10px 12px",
                borderRadius: 12,
                background: current ? "rgba(255,255,255,.12)" : "transparent",
                transition: "background .22s",
              }}
            >
              {/* dot */}
              <div
                style={{
                  width: 34,
                  height: 34,
                  borderRadius: "50%",
                  flexShrink: 0,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  background: done
                    ? "var(--p)"
                    : current
                      ? "rgba(255,255,255,.15)"
                      : "rgba(255,255,255,.06)",
                  border: `2px solid ${done ? "var(--p)" : current ? "rgba(255,255,255,.5)" : "rgba(255,255,255,.12)"}`,
                  boxShadow: current
                    ? "0 0 0 4px rgba(255,255,255,.08)"
                    : "none",
                  color: done || current ? "#fff" : "rgba(255,255,255,.35)",
                  transition: "all .3s",
                }}
              >
                {done ? <IcCheck size={12} /> : s.icon}
              </div>
              <div>
                <div
                  style={{
                    fontSize: 13,
                    fontWeight: current ? 700 : 500,
                    color: current
                      ? "#fff"
                      : done
                        ? "rgba(255,255,255,.7)"
                        : "rgba(255,255,255,.35)",
                    transition: "color .2s",
                  }}
                >
                  {s.label}
                </div>
                <div
                  style={{
                    fontSize: 10.5,
                    color: "rgba(255,255,255,.25)",
                    marginTop: 1,
                  }}
                >
                  {s.sub}
                </div>
              </div>
            </motion.div>
          );
        })}
      </div>

      {/* Progress text */}
      <div style={{ position: "relative", zIndex: 1, paddingTop: 24 }}>
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            marginBottom: 8,
          }}
        >
          <span
            style={{
              fontSize: 11,
              color: "rgba(255,255,255,.35)",
              fontWeight: 600,
            }}
          >
            {t("progress")}
          </span>
          <span
            style={{
              fontSize: 11,
              color: "rgba(255,255,255,.55)",
              fontWeight: 700,
            }}
          >
            {Math.round(Math.min(100, (step / (STEPS_META.length - 1)) * 100))}٪
          </span>
        </div>
        <div
          style={{
            height: 3,
            background: "rgba(255,255,255,.1)",
            borderRadius: 99,
          }}
        >
          <motion.div
            style={{
              height: "100%",
              background:
                "linear-gradient(90deg, rgba(255,255,255,.6), rgba(255,255,255,.35))",
              borderRadius: 99,
            }}
            animate={{ width: `${Math.min(100, (step / (STEPS_META.length - 1)) * 100)}%` }}
            transition={{ duration: 0.5, ease: "easeOut" }}
          />
        </div>
      </div>
    </div>
  );
}

/* ─── Step 0: Welcome ─────────────────────────────────────── */
function WelcomeStep({ onNext, open, nextLoading }) {
  const { user } = useAuth()
  const t = useTranslations("onboarding.welcome");
  const tiles = [
    {
      emoji: "📦",
      title: t("features.order_management.title"),
      desc: t("features.order_management.desc"),
    },
    {
      emoji: "🚚",
      title: t("features.shipping_tracking.title"),
      desc: t("features.shipping_tracking.desc"),
    },
    {
      emoji: "📊",
      title: t("features.smart_reports.title"),
      desc: t("features.smart_reports.desc"),
    },
    {
      emoji: "🔗",
      title: t("features.platform_integration.title"),
      desc: t("features.platform_integration.desc"),
    },
  ];

  if (!open) return null;
  return (
    <motion.div
      key="w"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -16 }}
      transition={{ duration: 0.35 }}
    >
      {/* Hero area */}
      <div style={{ marginBottom: 36 }}>
        <motion.div
          initial={{ scale: 0, rotate: -10 }}
          animate={{ scale: 1, rotate: 0 }}
          transition={{ type: "spring", duration: 0.7, delay: 0.1 }}
          style={{
            width: 72,
            height: 72,
            borderRadius: 22,
            background: "linear-gradient(145deg, var(--p), var(--p-dark))",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            boxShadow: "0 12px 40px rgba(103,99,175,.38)",
            fontSize: 34,
            marginBottom: 22,
          }}
        >
          🚀
        </motion.div>
        <motion.h1
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.18 }}
          style={{
            fontSize: 26,
            fontWeight: 900,
            color: "var(--text)",
            letterSpacing: "-0.5px",
            lineHeight: 1.3,
            marginBottom: 10,
          }}
        >
          {t("hero.title_welcome")}
          <br />
          <span style={{ color: "var(--p)" }}>{t("hero.title_start")}</span>
        </motion.h1>
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.28 }}
          style={{
            fontSize: 14,
            color: "var(--text-3)",
            lineHeight: 1.75,
            maxWidth: 400,
          }}
        >
          {t("hero.desc")}
        </motion.p>
      </div>

      {/* Feature tiles */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "1fr 1fr",
          gap: 12,
          marginBottom: 36,
        }}
      >
        {tiles.map((t, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 + i * 0.07 }}
            style={{
              background: "var(--surface)",
              border: "1px solid var(--border)",
              borderRadius: 14,
              padding: "16px 14px",
              display: "flex",
              gap: 12,
              alignItems: "flex-start",
              boxShadow: "0 2px 8px rgba(103,99,175,.06)",
            }}
          >
            <span style={{ fontSize: 24, flexShrink: 0, lineHeight: 1 }}>
              {t.emoji}
            </span>
            <div>
              <div
                style={{
                  fontSize: 13,
                  fontWeight: 700,
                  color: "var(--text)",
                  marginBottom: 3,
                }}
              >
                {t.title}
              </div>
              <div
                style={{
                  fontSize: 11.5,
                  color: "var(--text-3)",
                  lineHeight: 1.55,
                }}
              >
                {t.desc}
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Hint bar */}
      <div
        style={{
          background: "var(--p-xlight)",
          borderRadius: 12,
          padding: "12px 16px",
          marginBottom: 28,
          display: "flex",
          gap: 10,
          alignItems: "center",
          border: "1px solid rgba(103,99,175,.14)",
        }}
      >
        <span style={{ fontSize: 18 }}>💡</span>
        <p style={{ fontSize: 12.5, color: "var(--p-dark)", lineHeight: 1.6 }}>
          {t("hint")}
        </p>
      </div>
      <div style={{ display: "flex", gap: 10, justifyContent: "flex-end" }}>

        <BtnPrimary
          onClick={onNext}
          loading={nextLoading}
          disabled={nextLoading || !user}
          style={{ width: "100%" }}
        >
          {t("start_btn")} <IcArrow dir="right" />
        </BtnPrimary>
      </div>
    </motion.div>
  );
}

/* ─── Step 1: Plan ────────────────────────────────────────── */
const PLANS = [
  {
    id: 1,
    key: "starter",
    name: "أساسية",
    tier: "Starter",
    dotColor: "#4ade80",
    priceMonthly: 199,
    priceYearly: 149,
    badge: null,
    featured: false,
    features: ["٥٠٠ طلب / شهر", "١ مستخدم", "١ متجر", "دعم بريد إلكتروني"],
  },
  {
    id: 2,
    key: "pro",
    name: "احترافية",
    tier: "Pro",
    dotColor: "#818cf8",
    priceMonthly: 499,
    priceYearly: 399,
    badge: "الأكثر طلبًا",
    featured: true,
    features: [
      "طلبات غير محدودة",
      "٥ مستخدمين",
      "٣ متاجر",
      "دعم أولوية ٢٤/٧",
      "تقارير تفصيلية",
      "API كامل",
    ],
  },
  {
    id: 3,
    key: "enterprise",
    name: "مؤسسية",
    tier: "Enterprise",
    dotColor: "#a855f7",
    priceMonthly: 999,
    priceYearly: 799,
    badge: "للشركات",
    featured: false,
    features: [
      "كل شيء غير محدود",
      "مستخدمون غير محدودون",
      "API مخصص",
      "مدير حساب مخصص",
    ],
  },
];

function PlanSkeleton() {
  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: "repeat(3, 1fr)",
        gap: 14,
        marginBottom: 24,
      }}
    >
      {[0, 1, 2].map((idx) => {
        const isCenter = idx === 1;
        return (
          <div
            key={idx}
            style={{
              borderRadius: 20,
              padding: isCenter ? "28px 20px" : "24px 18px",
              background: isCenter ? "#1b1945" : "var(--surface)",
              border: "2px solid rgba(103,99,175,0.08)",
              transform: isCenter ? "scale(1.03)" : "scale(1)",
            }}
          >
            <div style={{ marginTop: isCenter ? 18 : 0 }}>
              {/* tier+name skeleton */}
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 6,
                  marginBottom: 10,
                }}
              >
                <div
                  style={{
                    width: 7,
                    height: 7,
                    borderRadius: "50%",
                    background: "rgba(0,0,0,0.1)",
                  }}
                />
                <div
                  style={{
                    width: 40,
                    height: 10,
                    borderRadius: 6,
                    background: "rgba(0,0,0,0.06)",
                  }}
                />
                <div
                  style={{
                    width: 60,
                    height: 12,
                    borderRadius: 6,
                    background: "rgba(0,0,0,0.08)",
                  }}
                />
              </div>

              {/* price skeleton */}
              <div
                style={{
                  width: 100,
                  height: 36,
                  borderRadius: 8,
                  background: "rgba(0,0,0,0.08)",
                  marginBottom: 4,
                }}
              />
              <div
                style={{
                  width: 80,
                  height: 10,
                  borderRadius: 6,
                  background: "rgba(0,0,0,0.05)",
                  marginBottom: 18,
                }}
              />

              {/* CTA skeleton */}
              <div
                style={{
                  width: "100%",
                  height: 40,
                  borderRadius: 99,
                  background: isCenter
                    ? "rgba(255,255,255,0.1)"
                    : "rgba(0,0,0,0.06)",
                  marginBottom: 12,
                }}
              />

              {/* divider */}
              <div
                style={{
                  height: 1,
                  background: isCenter
                    ? "rgba(255,255,255,0.06)"
                    : "var(--border)",
                  marginBottom: 14,
                }}
              />

              {/* features skeleton */}
              <div
                style={{
                  background: isCenter ? "rgba(255,255,255,0.03)" : "#F8F9FFC7",
                  borderRadius: 12,
                  padding: "10px",
                  display: "flex",
                  flexDirection: "column",
                  gap: 8,
                }}
              >
                {[0, 1, 2, 3].map((r) => (
                  <div
                    key={r}
                    style={{
                      width: `${60 + r * 8}%`,
                      height: 10,
                      borderRadius: 6,
                      background: "rgba(0,0,0,0.06)",
                    }}
                  />
                ))}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}

/* ─────────────────────────────────────────────────────────
   PLAN FEATURE ITEM (Keep original styling)
───────────────────────────────────────────────────────── */
function PlanFeature({ label, featured }) {
  return (
    <div
      style={{
        display: "flex",
        alignItems: "flex-start",
        gap: 6,
        marginBottom: 6,
      }}
    >
      <IcCheck
        size={12}
        style={{
          flexShrink: 0,
          marginTop: 2,
          color: featured ? "#BAEB33" : "var(--p)",
        }}
      />
      <span
        style={{
          fontSize: 11.5,
          lineHeight: 1.4,
          color: featured ? "rgba(255,255,255,.75)" : "var(--text-2)",
        }}
      >
        {label}
      </span>
    </div>
  );
}

/* ─────────────────────────────────────────────────────────
   BUTTONS (Keep original styling)
───────────────────────────────────────────────────────── */
function BtnGhost({ children, onClick, disabled }) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      style={{
        padding: "10px 22px",
        borderRadius: 99,
        border: "1.5px solid var(--border)",
        background: "var(--surface)",
        color: "var(--text-2)",
        fontSize: 13,
        fontWeight: 700,
        cursor: disabled ? "not-allowed" : "pointer",
        opacity: disabled ? 0.5 : 1,
        transition: "all .18s",
      }}
      onMouseEnter={(e) =>
        !disabled && (e.currentTarget.style.background = "var(--surface2)")
      }
      onMouseLeave={(e) =>
        (e.currentTarget.style.background = "var(--surface)")
      }
    >
      {children}
    </button>
  );
}

function BtnPrimary({ children, onClick, disabled, loading }) {
  return (
    <button
      onClick={onClick}
      disabled={disabled || loading}
      style={{
        padding: "10px 24px",
        borderRadius: 99,
        border: "none",
        background: "var(--p)",
        color: "#fff",
        fontSize: 13,
        fontWeight: 700,
        cursor: disabled || loading ? "not-allowed" : "pointer",
        opacity: disabled ? 0.5 : 1,
        display: "flex",
        alignItems: "center",
        gap: 6,
        boxShadow: "0 4px 16px rgba(103,99,175,.25)",
        transition: "all .18s",
      }}
      onMouseEnter={(e) =>
        !disabled && !loading && (e.currentTarget.style.opacity = "0.88")
      }
      onMouseLeave={(e) => (e.currentTarget.style.opacity = "1")}
    >
      {loading ? <div className="spinner" /> : children}
    </button>
  );
}

/* ─────────────────────────────────────────────────────────
   MAIN PLAN STEP COMPONENT
───────────────────────────────────────────────────────── */
function PlanStep({ onNext, onBack, selectedId, open, nextLoading }) {
  const t = useTranslations("onboarding.plans");
  const locale = useLocale();
  const { settings, isLoading: isSettingsLoading } = usePlatformSettings();
  const whatsapp = settings?.whatsapp;
  const [showCancelConfirm, setShowCancelConfirm] = useState(false);
  const {
    loading,
    isLoading,
    plans: rawPlans,
    activeSubscription,
    user,
    subscribe,
    cancelSubscription,
  } = useSubscriptionsApi();

  const currentPlanId =
    activeSubscription?.plan?.id || activeSubscription?.planId;
  const hasActiveSubscription = !!activeSubscription;


  // Format plans for display (matching old structure)
  const plans = rawPlans.map((plan, index) => {
    const price = Number(plan.price || 0);

    // Build features array with limits
    const features = [...(Array.isArray(plan.features) ? plan.features : [])];

    // Add limit details
    if (plan.usersLimit !== null) {
      features.push(`${plan.usersLimit} ${t("features.users")}`);
    } else {
      features.push(t("features.unlimited_users"));
    }

    if (plan.storesLimit !== null) {
      features.push(`${plan.storesLimit} ${t("features.stores")}`);
    } else {
      features.push(t("features.unlimited_stores"));
    }

    if (plan.shippingCompaniesLimit !== null) {
      features.push(`${plan.shippingCompaniesLimit} ${t("features.shipping_companies")}`);
    } else {
      features.push(t("features.unlimited_shipping_companies"));
    }

    if (plan.includedOrders !== null) {
      features.push(`${plan.includedOrders} ${t("features.included_orders")}`);
    } else {
      features.push(t("features.unlimited_orders"));
    }

    if (plan.extraOrderFee !== null && plan.extraOrderFee > 0) {
      features.push(`${plan.extraOrderFee} ${t("features.extra_order_fee")}`);
    }

    if (plan.bulkUploadPerMonth > 0) {
      features.push(`${plan.bulkUploadPerMonth} ${t("features.bulk_upload")}`);
    }

    return {
      id: plan.id,
      name: plan.name,
      type: plan.type, // 'standard', 'trial', 'negotiated'
      priceMonthly: price,
      priceYearly: Math.round(price * 0.8),
      badge: plan.isPopular ? t("popular_badge") : null,
      dotColor:
        plan.color ||
        (index === 0 ? "#8B88C1" : index === 1 ? "#BAEB33" : "var(--primary)"),

      isPopular: !!plan.isPopular,
      features,
    };
  });
  // Arrange plans: popular in center
  const arranged = [...plans];
  const popularIndex = arranged.findIndex((p) => p.isPopular);
  if (popularIndex > -1 && arranged.length >= 3) {
    const [popularPlan] = arranged.splice(popularIndex, 1);
    arranged.splice(1, 0, popularPlan);
  }

  // Set default selection
  // useEffect(() => {
  //   if (arranged.length > 0 && !selected) {
  //     const defaultIndex =
  //       arranged.findIndex((p) => p.isPopular) !== -1
  //         ? arranged.findIndex((p) => p.isPopular)
  //         : Math.min(1, arranged.length - 1);
  //     setSelected(selectedId || arranged[defaultIndex]?.id || arranged[0].id);
  //   }
  // }, [arranged.length, selectedId]);

  // Check if trial plan and user completed onboarding
  const cannotSubscribeToTrial = (planId) => {
    const plan = rawPlans.find((p) => p.id === planId);
    return plan?.type === "trial" && user?.onboardingStatus === "completed";
  };

  // Handle subscribe with new logic
  const go = async (newSelected) => {
    const finalSelected = newSelected;
    if (currentPlanId) {
      onNext();
      return;
    }
    if (!finalSelected) {
      toast.error(t("toasts.select_plan_error"));
      return;
    }

    // Check if trying to subscribe to trial when not allowed
    if (cannotSubscribeToTrial(finalSelected)) {
      toast.error(t("toasts.trial_not_available"));
      return;
    }

    try {
      await subscribe(finalSelected);
    } catch (err) {
      // Error already handled in hook
    }
  };

  // Handle cancel
  const handleCancel = async () => {
    if (!activeSubscription?.id) return;

    try {
      await cancelSubscription(activeSubscription.id);
      setShowCancelConfirm(false);
    } catch (err) {
      // Error already handled in hook
    }
  };

  if (!open) return null;

  return (
    <motion.div
      key="plan"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -16 }}
      transition={{ duration: 0.3 }}
    >
      {/* Header */}
      <div style={{ marginBottom: 24 }}>
        <h2
          style={{
            fontSize: 22,
            fontWeight: 900,
            color: "var(--text)",
            letterSpacing: "-0.4px",
            marginBottom: 6,
          }}
        >
          {t("title")}
        </h2>
        <p style={{ fontSize: 13.5, color: "var(--text-3)" }}>
          {t("subtitle")}
        </p>
      </div>

      {/* Active Subscription Alert */}
      {hasActiveSubscription && (
        <div
          style={{
            marginBottom: 20,
            padding: 14,
            background: "#f0f9ff",
            border: "1.5px solid #bfdbfe",
            borderRadius: 12,
            display: "flex",
            alignItems: "start",
            gap: 10,
          }}
        >
          <IcCheck size={18} style={{ color: "#3b82f6", marginTop: 2 }} />
          <div style={{ flex: 1 }}>
            <div
              style={{
                fontSize: 13,
                fontWeight: 700,
                color: "#1e40af",
                marginBottom: 3,
              }}
            >
              {t("active_alert.title")}
            </div>
            <div style={{ fontSize: 12, color: "#3b82f6" }}>
              {t("active_alert.desc")}
            </div>
          </div>
        </div>
      )}

      {/* Cards */}
      {isLoading ? (
        <PlanSkeleton />
      ) : (
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(3, 1fr)",
            gap: 14,
            marginBottom: 24,
            alignItems: "center",
          }}
        >
          {arranged.map((p, index) => {
            const price = p.priceMonthly;
            const isSelected = selectedId === p.id;
            const isFeatured = index === 1;
            const isCurrentPlan = p.id === currentPlanId;
            const isTrialDisabled = cannotSubscribeToTrial(p.id);

            return (
              <motion.div
                key={p.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{
                  delay: index * 0.08,
                  duration: 0.35,
                  ease: [0.34, 1.56, 0.64, 1],
                }}
                // onClick={() =>
                //   !isTrialDisabled &&
                //   !hasActiveSubscription &&
                //   setSelected(p.id)
                // }
                style={{
                  position: "relative",
                  borderRadius: 20,
                  padding: isFeatured ? "28px 20px" : "24px 18px",
                  // cursor:
                  //   isTrialDisabled || hasActiveSubscription
                  //     ? "not-allowed"
                  //     : "pointer",
                  background: isFeatured ? "#1b1945" : "var(--surface)",
                  border: isFeatured
                    ? `2px solid ${isSelected ? "#BAEB33" : "transparent"}`
                    : `2px solid ${isSelected ? "var(--p)" : "#6763AF14"}`,
                  boxShadow: isFeatured
                    ? `0 24px 48px rgba(27,25,69,.28)${isSelected ? ", 0 0 0 3px rgba(186,235,51,.2)" : ""}`
                    : `0 8px 28px rgba(103,99,175,.08)${isSelected ? ", 0 0 0 3px var(--p-glow)" : ""}`,
                  transform: isFeatured ? "scale(1.03)" : "scale(1)",
                  zIndex: isFeatured ? 2 : 1,
                  transition: "border-color .2s, box-shadow .2s, transform .2s",
                  opacity: isTrialDisabled ? 0.6 : 1,
                }}
              >
                {/* Top badge strip */}
                {p.badge && (
                  <div
                    style={{
                      position: "absolute",
                      top: 0,
                      left: 0,
                      right: 0,
                      background: isFeatured ? "#BAEB33" : "var(--p)",
                      color: "#fff",
                      fontSize: 9.5,
                      fontWeight: 700,
                      textAlign: "center",
                      padding: "4px 0",
                      letterSpacing: ".6px",
                      borderRadius: "18px 18px 0 0",
                    }}
                  >
                    {p.badge}
                  </div>
                )}

                {/* Active Plan Badge */}
                {isCurrentPlan && (
                  <div
                    style={{
                      position: "absolute",
                      top: p.badge ? 30 : 6,
                      right: 6,
                      background: "#10b981",
                      color: "#fff",
                      fontSize: 9,
                      fontWeight: 700,
                      padding: "4px 10px",
                      borderRadius: 99,
                      display: "flex",
                      alignItems: "center",
                      gap: 4,
                    }}
                  >
                    <span
                      style={{
                        width: 5,
                        height: 5,
                        borderRadius: "50%",
                        background: "#fff",
                        animation: "pulse 2s infinite",
                      }}
                    />
                    {t("status.active")}
                  </div>
                )}

                <div style={{ marginTop: p.badge ? 18 : 0 }}>
                  {/* Selected checkmark */}
                  <AnimatePresence>
                    {isSelected && !isCurrentPlan && (
                      <motion.div
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        exit={{ scale: 0 }}
                        style={{
                          position: "absolute",
                          top: p.badge ? 30 : 12,
                          left: 12,
                          width: 22,
                          height: 22,
                          borderRadius: "50%",
                          background: isFeatured ? "#BAEB33" : "var(--p)",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          color: "#fff",
                        }}
                      >
                        <IcCheck size={11} />
                      </motion.div>
                    )}
                  </AnimatePresence>

                  {/* Tier dot + label */}
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 6,
                      marginBottom: 10,
                    }}
                  >
                    <span
                      style={{
                        width: 7,
                        height: 7,
                        borderRadius: "50%",
                        flexShrink: 0,
                        background: p.dotColor,
                        boxShadow: `0 0 6px ${p.dotColor}`,
                      }}
                    />
                    {/* <span
                      style={{
                        fontSize: 11,
                        color: isFeatured
                          ? "rgba(255,255,255,.5)"
                          : "var(--text-3)",
                        fontWeight: 500,
                      }}
                    >
                      {p.tier}
                    </span> */}
                    <span
                      style={{
                        fontSize: 14,
                        fontWeight: 800,
                        color: isFeatured ? "#fff" : "var(--text)",
                      }}
                    >
                      {p.name}
                    </span>
                    {p.type === "trial" && (
                      <span
                        style={{
                          fontSize: 9,
                          background: "#3b82f6",
                          color: "#fff",
                          padding: "2px 6px",
                          borderRadius: 4,
                          fontWeight: 700,
                        }}
                      >
                        {t("status.trial")}
                      </span>
                    )}
                  </div>

                  {/* Price */}
                  {p.type === "negotiated" ? (
                    <div style={{ marginBottom: 12 }}>
                      <span
                        style={{
                          fontSize: 20,
                          fontWeight: 900,
                          color: isFeatured ? "#BAEB33" : "var(--primary)",
                        }}
                      >
                        {t("status.negotiated")}
                      </span>
                    </div>
                  ) : (
                    <>
                      <div
                        style={{
                          display: "flex",
                          alignItems: "baseline",
                          gap: 4,
                          marginBottom: 4,
                        }}
                      >
                        <span
                          style={{
                            fontSize: isFeatured ? 32 : 26,
                            fontWeight: 900,
                            color: isFeatured ? "#fff" : "var(--text)",
                            fontFamily: "var(--mono)",
                            lineHeight: 1,
                            letterSpacing: "-1px",
                          }}
                        >
                          {price.toLocaleString()}
                        </span>
                        <span
                          style={{
                            fontSize: 11,
                            color: isFeatured
                              ? "rgba(255,255,255,.55)"
                              : "var(--text-3)",
                            fontWeight: 500,
                          }}
                        >
                          {t("price_per_month")}
                        </span>
                      </div>
                    </>
                  )}

                  {/* CTA Button */}
                  {isCurrentPlan ? (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setShowCancelConfirm(true);
                      }}
                      style={{
                        width: "100%",
                        padding: "10px 0",
                        borderRadius: 99,
                        border: "none",
                        fontFamily: "var(--font)",
                        fontSize: 13,
                        fontWeight: 700,
                        cursor: "pointer",
                        marginBottom: 18,
                        marginTop: 6,
                        background: "#ef4444",
                        color: "#fff",
                        boxShadow: "0 4px 16px rgba(239,68,68,.35)",
                        transition: "opacity .18s, transform .18s",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        gap: 6,
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.opacity = ".88";
                        e.currentTarget.style.transform = "translateY(-1px)";
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.opacity = "1";
                        e.currentTarget.style.transform = "none";
                      }}
                    >
                      <X size={14} /> {t("cancel_btn")}
                    </button>
                  ) : p.type === "negotiated" ? (
                    <a
                      href={`https://wa.me/${whatsapp}?text=${encodeURIComponent(
                        `مرحباً، أنا مهتم بخطة ${p.name}`,
                      )}`}
                      disabled={isSettingsLoading}
                      target="_blank"
                      rel="noopener noreferrer"
                      onClick={(e) => e.stopPropagation()}
                      style={{
                        width: "100%",
                        padding: "10px 0",
                        borderRadius: 99,
                        border: "none",
                        fontFamily: "var(--font)",
                        fontSize: 13,
                        fontWeight: 700,
                        cursor: "pointer",
                        marginBottom: 18,
                        marginTop: 6,
                        background: "#25D366",
                        color: "#fff",
                        boxShadow: "0 4px 16px rgba(37,211,102,.35)",
                        transition: "opacity .18s, transform .18s",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        gap: 6,
                        textDecoration: "none",
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.opacity = ".88";
                        e.currentTarget.style.transform = "translateY(-1px)";
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.opacity = "1";
                        e.currentTarget.style.transform = "none";
                      }}
                    >
                      <MessageCircle size={14} /> {t("contact_us")}
                    </a>
                  ) : (
                    <button
                      style={{
                        width: "100%",
                        padding: "10px 0",
                        borderRadius: 99,
                        border: "none",
                        fontFamily: "var(--font)",
                        fontSize: 13,
                        fontWeight: 700,
                        cursor:
                          isTrialDisabled || hasActiveSubscription
                            ? "not-allowed"
                            : "pointer",
                        marginBottom: 18,
                        marginTop: 6,
                        background:
                          isTrialDisabled || hasActiveSubscription
                            ? "#9ca3af"
                            : isFeatured
                              ? "#BAEB33"
                              : "#1b1945",
                        color: "#fff",
                        boxShadow: isFeatured
                          ? "0 4px 16px rgba(186,235,51,.35)"
                          : "0 4px 16px rgba(27,25,69,.25)",
                        transition: "opacity .18s, transform .18s",
                        opacity:
                          isTrialDisabled || hasActiveSubscription ? 0.5 : 1,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        gap: 6,
                      }}
                      disabled={
                        loading || isTrialDisabled || hasActiveSubscription
                      }
                      onMouseEnter={(e) => {
                        if (!isTrialDisabled && !hasActiveSubscription) {
                          e.currentTarget.style.opacity = ".88";
                          e.currentTarget.style.transform = "translateY(-1px)";
                        }
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.opacity =
                          isTrialDisabled || hasActiveSubscription
                            ? "0.5"
                            : "1";
                        e.currentTarget.style.transform = "none";
                      }}
                      onClick={(e) => {
                        e.stopPropagation();
                        console.log(p, p.id);
                        if (
                          !isTrialDisabled &&
                          !hasActiveSubscription &&
                          !loading
                        ) {
                          go(p.id);
                        }
                      }}
                    >
                      {isTrialDisabled ? (
                        <>
                          <AlertCircle size={14} /> {t("unavailable")}
                        </>
                      ) : hasActiveSubscription ? (
                        <>
                          <AlertCircle size={14} /> {t("active_already")}
                        </>
                      ) : loading === p.id ? (
                        <Loader2 className="animate-spin" />
                      ) : (
                        t("start_now")
                      )}
                    </button>
                  )}

                  {/* Divider */}
                  <div
                    style={{
                      height: 1,
                      background: isFeatured
                        ? "rgba(255,255,255,.1)"
                        : "var(--border)",
                      marginBottom: 14,
                    }}
                  />

                  {/* Features list */}
                  <div
                    style={{
                      background: isFeatured
                        ? "rgba(255,255,255,.05)"
                        : "#F8F9FFC7",
                      border: `1px solid ${isFeatured ? "rgba(255,255,255,.08)" : "#6763AF14"}`,
                      borderRadius: 12,
                      padding: "10px 10px 6px",
                      display: "flex",
                      flexDirection: "column",
                    }}
                  >
                    {p.features.map((f, i) => (
                      <PlanFeature key={i} label={f} featured={isFeatured} />
                    ))}
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>
      )}

      {/* Buttons */}
      <div style={{ display: "flex", gap: 10, justifyContent: "flex-end" }}>
        <BtnGhost onClick={onBack}>{t("back_btn")}</BtnGhost>
        <BtnPrimary
          onClick={() => onNext()}
          disabled={
            !hasActiveSubscription || isLoading || nextLoading || loading
          }
          loading={nextLoading}
        >
          {t("continue_btn")} <IcArrow dir="right" />
        </BtnPrimary>
      </div>

      {/* Cancel Confirmation Modal */}
      {showCancelConfirm && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(0,0,0,0.5)",
            backdropFilter: "blur(4px)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 9999,
          }}
          onClick={() => setShowCancelConfirm(false)}
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            onClick={(e) => e.stopPropagation()}
            style={{
              background: "var(--surface)",
              borderRadius: 16,
              padding: 24,
              maxWidth: 420,
              width: "90%",
              border: "2px solid #fecaca",
              boxShadow: "0 24px 48px rgba(0,0,0,0.2)",
            }}
          >
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 12,
                marginBottom: 16,
              }}
            >
              <div
                style={{
                  width: 48,
                  height: 48,
                  borderRadius: 12,
                  background: "#fee2e2",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <AlertCircle size={24} style={{ color: "#dc2626" }} />
              </div>
              <h3
                style={{ fontSize: 18, fontWeight: 800, color: "var(--text)" }}
              >
                {t("cancel_confirm.title")}
              </h3>
            </div>
            <p
              style={{
                fontSize: 13.5,
                color: "var(--text-2)",
                marginBottom: 20,
                lineHeight: 1.6,
              }}
            >
              {t("cancel_confirm.desc")}
            </p>
            <div style={{ display: "flex", gap: 10 }}>
              <button
                onClick={() => setShowCancelConfirm(false)}
                style={{
                  flex: 1,
                  padding: "10px 0",
                  borderRadius: 99,
                  border: "1.5px solid var(--border)",
                  background: "var(--surface)",
                  color: "var(--text-2)",
                  fontSize: 13,
                  fontWeight: 700,
                  cursor: "pointer",
                }}
              >
                {t("cancel_confirm.keep")}
              </button>
              <button
                onClick={handleCancel}
                disabled={loading}
                style={{
                  flex: 1,
                  padding: "10px 0",
                  borderRadius: 99,
                  border: "none",
                  background: "#dc2626",
                  color: "#fff",
                  fontSize: 13,
                  fontWeight: 700,
                  cursor: loading ? "not-allowed" : "pointer",
                  opacity: loading ? 0.7 : 1,
                }}
              >
                {loading ? t("cancel_confirm.canceling") : t("cancel_confirm.confirm")}
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </motion.div>
  );
}

/* ─── Step 2: Company ─────────────────────────────────────── */
function CompanyStep({ onNext, onBack, open, nextLoading }) {
  const tp = useTranslations("onboarding.plans");
  const t = useTranslations("onboarding.company");

  const COUNTRIES_LIST = [
    { value: "egypt", label: t("countries.egypt") },
    { value: "saudi", label: t("countries.saudi") },
    { value: "uae", label: t("countries.uae") },
    { value: "kuwait", label: t("countries.kuwait") },
    { value: "qatar", label: t("countries.qatar") },
    { value: "bahrain", label: t("countries.bahrain") },
    { value: "oman", label: t("countries.oman") },
    { value: "jordan", label: t("countries.jordan") },
    { value: "lebanon", label: t("countries.lebanon") },
  ];

  const CURRENCIES_LIST = [
    { code: "EGP", label: t("currencies.egp") },
    { code: "SAR", label: t("currencies.sar") },
    { code: "AED", label: t("currencies.aed") },
    { code: "USD", label: t("currencies.usd") },
  ];

  const schema = yup.object({
    country: yup.string().required(t("validation.country_required")),
    currency: yup.string().required(t("validation.currency_required")),
    name: yup.string().trim().required(t("validation.name_required")),
    tax: yup.string().trim().nullable(),
    commercial: yup.string().trim().nullable(),
    phone: yup.string().trim().nullable(),
    address: yup.string().trim().nullable(),
    website: yup
      .string()
      .trim()
      .notRequired()
      .nullable()
      .test(
        "is-url-or-empty",
        t("validation.invalid_url"),
        (v) => !v || /^(https?:\/\/)/.test(v),
      ),
  });

  const {
    control,
    register,
    handleSubmit,
    formState: { errors, touchedFields, isSubmitting },
    reset,
  } = useForm({
    resolver: yupResolver(schema),
    defaultValues: {
      country: "",
      currency: "",
      name: "",
      tax: null,
      commercial: null,
      phone: null,
      website: null,
      address: null,
    },
    shouldFocusError: false,
    mode: "onTouched",
  });

  console.log(errors)

  useEffect(() => {
    if (!open) return;

    const loadCompany = async () => {
      try {
        const res = await api.get("/users/company");
        if (res.data) {
          reset({
            country: res.data.country || "",
            currency: res.data.currency || "",
            name: res.data.name || "",
            tax: res.data.tax || null,
            commercial: res.data.commercial || null,
            phone: res.data.phone || null,
            website: res.data.website || null,
            address: res.data.address || null,
          });
        }
      } catch (err) {
        console.error(err);
      }
    };

    loadCompany();
  }, [open, reset]);

  const onSubmit = async (data) => {
    try {
      const payload = {
        country: data.country || "",
        currency: data.currency || "",
        name: data.name || "",
        tax: data.tax || null,
        commercial: data.commercial || null,
        phone: data.phone || null,
        website: data.website || null,
        address: data.address || null,
      }
      await api.post("/users/company", payload);
      toast.success(t("toasts.save_success"));
      onNext();
    } catch (err) {
      const msg = err.response?.data?.message || t("toasts.save_error");
      toast.error(Array.isArray(msg) ? msg[0] : msg);
    }
  };

  const onInvalid = (errs) => { };

  if (!open) return null;

  return (
    <motion.div
      key="co"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -16 }}
      transition={{ duration: 0.3 }}
    >
      <div style={{ marginBottom: 24 }}>
        <h2
          style={{
            fontSize: 22,
            fontWeight: 900,
            color: "var(--text)",
            letterSpacing: "-0.4px",
            marginBottom: 6,
          }}
        >
          {t("title")}
        </h2>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <p style={{ fontSize: 13.5, color: "var(--text-3)" }}>
            {t("subtitle")}
          </p>
          <span
            style={{
              fontSize: 11.5,
              background: "var(--p-xlight)",
              color: "var(--p)",
              padding: "2px 10px",
              borderRadius: 99,
              fontWeight: 600,
              flexShrink: 0,
            }}
          >
            {t("required_hint")}
          </span>
        </div>
      </div>

      {/* Row 1: country + currency */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
        <Field
          label={t("fields.country")}
          required
          error={errors.country ? errors.country?.message : null}
        >
          <Controller
            control={control}
            name="country"
            render={({ field }) => (
              <ObSelect {...field} onBlur={() => field.onBlur()} icon="🌍">
                <option value="">{t("placeholders.select_country")}</option>
                {COUNTRIES_LIST.map((c) => (
                  <option key={c.value} value={c.value}>
                    {c.label}
                  </option>
                ))}
              </ObSelect>
            )}
          />
        </Field>

        <Field
          label={t("fields.currency")}
          required
          error={errors.currency ? errors.currency?.message : null}
        >
          <Controller
            control={control}
            name="currency"
            render={({ field }) => (
              <ObSelect {...field} onBlur={() => field.onBlur()} icon="💵">
                <option value="">{t("placeholders.select_currency")}</option>
                {CURRENCIES_LIST.map((c) => (
                  <option key={c.code} value={c.code}>
                    {c.label}
                  </option>
                ))}
              </ObSelect>
            )}
          />
        </Field>
      </div>

      {/* Company name - full width */}
      <Field
        label={t("fields.name")}
        error={errors.name ? errors.name?.message : null}
      >
        <InputWrap icon={<IcBuild />}>
          <input
            className="ob-input"
            placeholder={t("placeholders.name")}
            {...register("name")}
          />
        </InputWrap>
      </Field>

      {/* Row 2 */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
        <Field label={t("fields.tax")}>
          <InputWrap
            icon={<span style={{ fontSize: 13, fontWeight: 700 }}>%</span>}
          >
            <input
              className="ob-input"
              placeholder={t("placeholders.optional")}
              {...register("tax")}
              style={{ textAlign: "right" }}
            />
          </InputWrap>
        </Field>

        <Field label={t("fields.commercial")}>
          <InputWrap icon="📋">
            <input
              className="ob-input"
              placeholder={t("placeholders.optional")}
              {...register("commercial")}
              style={{ textAlign: "right" }}
            />
          </InputWrap>
        </Field>

        <Field label={t("fields.phone")}>
          <InputWrap icon={<IcPhone />}>
            <input
              className="ob-input"
              placeholder="+20 xxx xxxx"
              {...register("phone")}
              style={{ textAlign: "right" }}
            />
          </InputWrap>
        </Field>

        <Field label={t("fields.website")}>
          <InputWrap icon={<IcGlobe />}>
            <input
              className="ob-input"
              placeholder="https://mystore.com"
              {...register("website")}
              style={{ textAlign: "left" }}
            />
          </InputWrap>
        </Field>
      </div>

      {/* Address */}
      <Field label={t("fields.address")}>
        <div style={{ position: "relative" }}>
          <span
            style={{
              position: "absolute",
              right: 14,
              top: 13,
              color: "var(--text-3)",
              display: "flex",
              pointerEvents: "none",
            }}
          >
            📍
          </span>
          <textarea
            className="ob-textarea"
            rows={2}
            placeholder={t("placeholders.address")}
            {...register("address")}
          />
        </div>
      </Field>

      <div
        style={{
          display: "flex",
          gap: 10,
          justifyContent: "flex-end",
          marginTop: 4,
        }}
      >
        <BtnGhost onClick={onBack}>{tp("back_btn")}</BtnGhost>
        <BtnPrimary
          onClick={handleSubmit(onSubmit, onInvalid)}
          loading={isSubmitting || nextLoading}
          disabled={nextLoading}
        >
          {tp("continue_btn")} <IcArrow />
        </BtnPrimary>
      </div>
    </motion.div>
  );
}

/* ─── Step 3: Store ───────────────────────────────────────── */

const CopyableCode = ({ text }) => {
  const [copied, setCopied] = useState(false);
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: 8,
        background: "var(--surface2)",
        border: "1.5px solid var(--border)",
        borderRadius: 8,
        padding: "8px 12px",
        marginTop: 4,
      }}
    >
      <code
        style={{
          fontSize: 11,
          fontFamily: "monospace",
          color: "var(--p)",
          flex: 1,
          wordBreak: "break-all",
        }}
      >
        {text}
      </code>
      <button
        onClick={() => {
          navigator.clipboard.writeText(text);
          setCopied(true);
          setTimeout(() => setCopied(false), 1500);
        }}
        style={{
          background: "transparent",
          border: "none",
          cursor: "pointer",
          fontSize: 11,
          color: "var(--text-3)",
          padding: "2px 6px",
        }}
      >
        {copied ? "✓" : "📋"}
      </button>
    </div>
  );
};

function StoreStep({ onNext, onBack, open, nextLoading }) {
  const ts = useTranslations("onboarding.store");
  const tp = useTranslations("onboarding.plans");
  const t = useTranslations("storeIntegrations");
  const locale = useLocale();
  const { user } = useAuth();

  const [stores, setStores] = useState([]);
  const [listLoading, setListLoading] = useState(true);
  const [cancelling, setCancelling] = useState(false);

  const [dialogOpen, setDialogOpen] = useState(false);
  const [currentProvider, setCurrentProvider] = useState(null);
  const [currentStore, setCurrentStore] = useState(null);
  const [modalStore, setModalStore] = useState(null);
  const [webhookModalProvider, setWebhookModalProvider] = useState(null);
  const [guideProvider, setGuideProvider] = useState(null);

  const { subscribe } = useSocket();
  useEffect(() => {
    const unsubscribe = subscribe("STORE_SYNC_STATUS", (payload) => {
      if (payload) {
        const { storeId, status } = payload;
        setStores((prev) =>
          prev.map((store) =>
            store.id === storeId ? { ...store, syncStatus: status } : store,
          ),
        );
      }
    });
    return unsubscribe;
  }, [subscribe]);

  const fetchStores = async () => {
    try {
      setListLoading(true);
      const res = await api.get("/stores");
      setStores(res.data?.records || []);
    } catch (e) {
      // toast.error(normalizeAxiosError(e));
    } finally {
      setListLoading(false);
    }
  };

  useEffect(() => {
    if (open) fetchStores();
  }, [open]);

  const handleConfigure = async (provider, store) => {
    setCurrentProvider(provider);
    setCurrentStore(store);
    setDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setDialogOpen(false);
    setCurrentProvider(null);
    setCurrentStore(null);
  };

  const handleOpenWebhook = (provider, store) => {
    setWebhookModalProvider(provider);
    setModalStore(store);
  };

  const handleCloseWebhookModal = () => {
    setWebhookModalProvider(null);
    setModalStore(null);
  };

  const handleOpenGuide = (provider, store) => {
    setGuideProvider(provider);
    setModalStore(store);
  };

  const handleCloseGuide = () => {
    setGuideProvider(null);
    setModalStore(null);
  };

  const handleSync = async (storeId) => {
    try {
      await api.post(`/stores/${storeId}/sync`);
      toast.success(t("messages.syncStarted"));
      await fetchStores();
    } catch (e) {
      toast.error(e?.response?.data?.message || e?.message || "Unexpected error");
    }
  };

  const handleEasyOrderAction = async (provider, store) => {
    const isIntegrated = store?.isIntegrated ?? false;
    const hasStore = !!store;

    if (!hasStore) {
      handleConfigure(provider, null);
      return;
    }

    if (isIntegrated) {
      setCancelling(true);
      try {
        await api.patch("/stores/easyorder/cancel-integration");
        await fetchStores();
        toast.success(t("messages.integrationCancelled") || "Integration cancelled successfully");
      } catch (e) {
        toast.error(e?.response?.data?.message || e?.message || "Unexpected error");
      } finally {
        setCancelling(false);
      }
    } else {
      window.location.href = generateEasyOrdersInstallUrl(user?.id);
    }
  };

  const connectedCount = useMemo(() => {
    return stores.length;
  }, [stores]);

  if (!open) return null;

  return (
    <motion.div
      key="store"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -16 }}
      transition={{ duration: 0.3 }}
    >
      <div style={{ marginBottom: 24 }}>
        <h2
          style={{
            fontSize: 22,
            fontWeight: 900,
            color: "var(--text)",
            letterSpacing: "-0.4px",
            marginBottom: 6,
          }}
        >
          {ts("title")}
        </h2>
        <p style={{ fontSize: 13.5, color: "var(--text-3)" }}>
          {ts("subtitle")}
        </p>
      </div>

      {listLoading ? (
        <ProvidersSkeleton />
      ) : (
        <AnimatePresence mode="wait">
          <motion.div
            key="list"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                gap: 10,
                marginBottom: 28,
              }}
            >
              {STORE_PROVIDERS.map((p) => {
                const store = stores.find((s) => s.provider === p.key);
                const isConnected = !!store;
                const isIntegrated = store?.isIntegrated ?? false;
                const config = PROVIDER_CONFIG[p.key];

                const accent = config.accent;
                const fbCls =
                  "flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all duration-150 bg-white/80 dark:bg-[var(--muted)] border border-white/60 dark:border-[var(--border)] text-gray-600 dark:text-gray-300 shadow-sm";
                const onEnter = (e) => {
                  e.currentTarget.style.borderColor = accent;
                  e.currentTarget.style.color = accent;
                };
                const onLeave = (e) => {
                  e.currentTarget.style.borderColor = "";
                  e.currentTarget.style.color = "";
                };

                return (
                  <div
                    key={p.key}
                    className={cn(
                      "prov-card group transition-all duration-200",
                      "flex flex-col sm:flex-row items-start sm:items-center gap-4",
                      "p-4 rounded-2xl border-1.5 border-[var(--border)] bg-[var(--surface)]",
                      isConnected && "connected"
                    )}
                  >
                    <div
                      className="flex items-center gap-3 flex-1 w-full"
                    >
                      {/* Logo container */}
                      <div
                        className={cn(
                          "w-11 h-11 rounded-xl flex-shrink-0 flex items-center justify-center overflow-hidden transition-all duration-200",
                          "border-1.5",
                          isConnected ? "bg-[#f0fdf4] border-[#bbf7d0]" : "bg-[var(--surface2)] border-[var(--border)]"
                        )}
                      >
                        <img
                          src={p.img}
                          alt={p.label[locale] || p.label.en}
                          className="w-7 h-7 object-contain"
                          onError={(e) => {
                            e.currentTarget.style.display = "none";
                            e.currentTarget.parentElement.innerHTML = `<span style="font-size:22px">${p.emoji || "🔗"}</span>`;
                          }}
                        />
                      </div>

                      {/* Text */}
                      <div className="flex-1 min-w-0">
                        <div
                          className="text-sm font-bold text-[var(--text)]"
                        >
                          {p.label[locale] || p.label.en}
                        </div>
                        <div
                          className="text-xs text-[var(--text-3)] mt-0.5 line-clamp-1 sm:line-clamp-2 leading-relaxed"
                        >
                          {p.desc[locale] || p.desc.en}
                        </div>
                      </div>
                    </div>

                    {/* Actions Group */}
                    <div className="flex items-center gap-2 flex-wrap w-full sm:w-auto sm:justify-end">
                      {p.key === "easyorder" && (
                        <button
                          onClick={() => handleEasyOrderAction(p.key, store)}
                          disabled={cancelling}
                          className={cn(fbCls, "flex-1 sm:flex-none justify-center")}
                          onMouseEnter={onEnter}
                          onMouseLeave={onLeave}
                        >
                          {cancelling ? (
                            <Loader2 size={12} className="animate-spin" />
                          ) : isIntegrated ? (
                            <X size={12} className="text-red-500" />
                          ) : (
                            <Zap size={12} className="text-amber-500" />
                          )}
                          <span className="truncate">
                            {isIntegrated ? t("card.cancelIntegration") || "Cancel Integration" : t("card.integrate") || "Integrate"}
                          </span>
                        </button>
                      )}

                      <button
                        onClick={() => handleConfigure(p.key, store)}
                        className={cn(fbCls, "flex-1 sm:flex-none justify-center")}
                        onMouseEnter={onEnter}
                        onMouseLeave={onLeave}
                      >
                        <Settings2 size={12} />
                        <span className="truncate">
                          {isConnected ? t("card.settings") : t("card.configureSettings")}
                        </span>
                      </button>

                      {config?.guide?.showSteps && (
                        <button
                          onClick={() => handleOpenGuide(p.key, store)}
                          className={cn(fbCls, "flex-1 sm:flex-none justify-center")}
                          onMouseEnter={onEnter}
                          onMouseLeave={onLeave}
                        >
                          <HelpCircle size={12} />
                          <span className="hidden sm:inline">{t("card.guide")}</span>
                        </button>
                      )}

                      {isConnected && config?.showWebhook && (
                        <button
                          onClick={() => handleOpenWebhook(p.key, store)}
                          className={cn(fbCls, "flex-1 sm:flex-none justify-center")}
                          onMouseEnter={onEnter}
                          onMouseLeave={onLeave}
                        >
                          <Webhook size={12} />
                          <span className="hidden sm:inline">Webhook</span>
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>

            <div
              style={{ display: "flex", gap: 10, justifyContent: "flex-end" }}
            >
              <BtnGhost onClick={onBack}>{tp("back_btn")}</BtnGhost>
              {connectedCount === 0 && (
                <BtnGhost onClick={onNext}>{ts("actions.skip")}</BtnGhost>
              )}
              {connectedCount > 0 && (
                <BtnPrimary onClick={onNext}>
                  {tp("continue_btn")} <IcArrow dir="right" />
                </BtnPrimary>
              )}
            </div>
          </motion.div>
        </AnimatePresence>
      )}

      {/* Configuration Dialog */}
      {dialogOpen && currentProvider && (
        <StoreConfigDialog
          open={dialogOpen}
          onClose={handleCloseDialog}
          provider={currentProvider}
          existingStore={currentStore}
          fetchStores={fetchStores}
          t={t}
          onCreated={(provider, id) =>
            handleOpenWebhook(provider, { id, provider })
          }
        />
      )}

      {/* Guide Modal */}
      {guideProvider && (
        <StoreGuideModal
          provider={{ code: guideProvider }}
          onClose={handleCloseGuide}
        />
      )}

      {/* Webhook Modal */}
      {webhookModalProvider && modalStore && (
        <StoreWebhookModal
          provider={webhookModalProvider}
          open={!!webhookModalProvider}
          store={modalStore}
          onClose={handleCloseWebhookModal}
          fetchStores={fetchStores}
          t={t}
        />
      )}
    </motion.div>
  );
}

const ProvidersSkeleton = () => (
  <div
    style={{
      display: "flex",
      flexDirection: "column",
      gap: 10,
      marginBottom: 28,
    }}
  >
    {[1, 2, 3].map((i) => (
      <div
        key={i}
        className="prov-card"
        style={{
          display: "flex",
          alignItems: "center",
          gap: 12,
          padding: 12,
          borderRadius: 12,
          border: "1.5px solid var(--border)",
          background: "var(--surface)",
        }}
      >
        {/* Provider Icon */}
        <div
          className="skeleton-pulse"
          style={{
            width: 44,
            height: 44,
            borderRadius: 12,
            background: "#f0f0f0",
            flexShrink: 0,
          }}
        />

        {/* Provider Text */}
        <div
          style={{ flex: 1, display: "flex", flexDirection: "column", gap: 6 }}
        >
          <div
            className="skeleton-pulse"
            style={{
              height: 12,
              width: "35%",
              borderRadius: 6,
              background: "#eee",
            }}
          />

          <div
            className="skeleton-pulse"
            style={{
              height: 10,
              width: "70%",
              borderRadius: 6,
              background: "#f5f5f5",
            }}
          />
        </div>

        {/* Connect Button */}
        <div
          className="skeleton-pulse"
          style={{
            height: 28,
            width: 70,
            borderRadius: 8,
            background: "#eee",
          }}
        />
      </div>
    ))}
  </div>
);

// Provider metadata matching ShippingCompaniesPage

const CopyableField = ({ label, value }) => {
  const [copied, setCopied] = useState(false);

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(String(value || ""));
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch (_) { }
  };

  return (
    <div style={{ marginBottom: 12 }}>
      <label
        style={{
          fontSize: 11,
          fontWeight: 600,
          color: "var(--text)",
          marginBottom: 4,
          display: "block",
        }}
      >
        {label}
      </label>
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 8,
          background: "var(--surface2)",
          border: "1.5px solid var(--border)",
          borderRadius: 10,
          padding: "8px 12px",
        }}
      >
        <input
          readOnly
          value={value || ""}
          style={{
            flex: 1,
            background: "transparent",
            border: "none",
            outline: "none",
            fontSize: 12,
            color: "var(--text)",
            fontFamily: "monospace",
          }}
        />
        <button
          onClick={copy}
          style={{
            background: "transparent",
            border: "none",
            cursor: "pointer",
            fontSize: 14,
            padding: "2px 6px",
          }}
        >
          {copied ? "✓" : "📋"}
        </button>
      </div>
    </div>
  );
};

const WebhookSkeleton = () => (
  <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
    {[1, 2, 3].map((i) => (
      <div
        key={i}
        style={{
          border: "1.5px solid var(--border)",
          borderRadius: 12,
          padding: 12,
          background: "var(--surface)",
          display: "flex",
          flexDirection: "column",
          gap: 8,
        }}
      >
        {/* label */}
        <div
          className="skeleton-pulse"
          style={{
            height: 10,
            width: "30%",
            borderRadius: 6,
            background: "#eee",
          }}
        />

        {/* value field */}
        <div
          className="skeleton-pulse"
          style={{
            height: 34,
            width: "100%",
            borderRadius: 8,
            background: "#f5f5f5",
          }}
        />
      </div>
    ))}

    {/* Security box skeleton */}
    <div
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        gap: 12,
        borderRadius: 12,
        padding: 12,
        border: "1.5px solid var(--border)",
        background: "var(--surface2)",
      }}
    >
      <div
        className="skeleton-pulse"
        style={{
          height: 10,
          width: "60%",
          borderRadius: 6,
          background: "#eee",
        }}
      />

      <div
        className="skeleton-pulse"
        style={{
          height: 28,
          width: 70,
          borderRadius: 8,
          background: "#eee",
        }}
      />
    </div>
  </div>
);

function ShippingStep({ onNext, onBack, open, nextLoading }) {
  const t = useTranslations("shipping");
  const ts = useTranslations("onboarding.shipping");
  const tp = useTranslations("onboarding.plans");
  const tstore = useTranslations("onboarding.store");
  const locale = useLocale();

  const [active, setActive] = useState(null); // The provider code
  const [showWebhook, setShowWebhook] = useState(false);

  // Find current provider object
  const provider = SHIP_PROVIDERS.find((p) => p.code === active) || null;

  const handleOnSaved = useCallback(
    (isEditMode) => {
      if (!isEditMode) {
        setShowWebhook(true);
      } else {
        setActive(null);
      }
    },
    [active, provider?.label],
  );

  // 3. Settings Hook (Renamed to match your original variable names)
  const {
    integrations,
    connected,
    fields,
    values: fd, // Rename 'values' to 'fd'
    setValue: setFd, // Rename 'setValue' to 'setFd'
    handleSave: save, // Rename 'handleSave' to 'save'
    saving,
    loading: settingsLoading,
    integrationData,
  } = useShippingSettings(provider?.key, {
    onSaved: handleOnSaved,
    onFirstSetup: () => setShowWebhook(true),
    onClose: () => {
      setActive(null);
      setShowWebhook(false);
    },
  });

  // 4. Webhook Hook (Renamed to match your original variable names)
  const {
    data: webhookData, // Rename 'data' to 'webhookData'
    setData: setWebhookData,
    loading: webhookLoading,
    rotating: rotatingSecret,
    handleRotateSecret: rotateSecret, // Rename to match your function name
    handleCopy: copy,
    refresh,
  } = useShippingWebhook(showWebhook ? active : null);

  // Helper logic for the UI
  const providerMeta = provider ? PROVIDER_META[provider.code] : null;
  const webhookHiddenFields = providerMeta?.webhookHiddenFields || [];

  const openWebhookSetup = async (providerKey) => {
    setActive(providerKey);
    setShowWebhook(true);
    await refresh(providerKey);
  };

  if (!open) return null;

  return (
    <motion.div
      key="ship"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -16 }}
      transition={{ duration: 0.3 }}
    >
      <div style={{ marginBottom: 24 }}>
        <h2
          style={{
            fontSize: 22,
            fontWeight: 900,
            color: "var(--text)",
            letterSpacing: "-0.4px",
            marginBottom: 6,
          }}
        >
          {ts("title")}
        </h2>
        <p style={{ fontSize: 13.5, color: "var(--text-3)" }}>
          {ts("subtitle")}
        </p>
      </div>

      {settingsLoading ? (
        <ProvidersSkeleton />
      ) : (
        <AnimatePresence mode="wait">
          {!active ? (
            <motion.div
              key="slist"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                  gap: 10,
                  marginBottom: 28,
                }}
              >
                {SHIP_PROVIDERS.map((p) => (
                  <div
                    key={p.key}
                    onClick={() => setActive(p.key)}
                    className={`prov-card${connected[p.key] ? " connected" : ""}`}
                    style={{
                      cursor: "pointer",
                      display: "flex",
                      alignItems: "center",
                      gap: 12,
                      padding: 14,
                      borderRadius: 14,
                      border: "1.5px solid var(--border)",
                      background: "var(--surface)",
                      transition: "all .2s",
                    }}
                  >
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: 12,
                        flex: 1,
                      }}
                    >
                      <div
                        style={{
                          width: 44,
                          height: 44,
                          borderRadius: 12,
                          flexShrink: 0,
                          background: connected[p.key]
                            ? "#f0fdf4"
                            : "var(--surface2)",
                          border: `1.5px solid ${connected[p.key] ? "#bbf7d0" : "var(--border)"}`,
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          overflow: "hidden",
                          transition: "all .2s",
                        }}
                      >
                        <img
                          src={p.img}
                          alt={p.label[locale] || p.label.en}
                          style={{
                            width: 28,
                            height: 28,
                            objectFit: "contain",
                          }}
                          onError={(e) => {
                            e.currentTarget.style.display = "none";
                            e.currentTarget.parentElement.innerHTML = `<span style="font-size:22px">${p.emoji || "🔗"}</span>`;
                          }}
                        />
                      </div>

                      <div style={{ flex: 1 }}>
                        <div
                          style={{
                            fontSize: 14,
                            fontWeight: 700,
                            color: "var(--text)",
                          }}
                        >
                          {p.label[locale] || p.label.en}
                        </div>
                        <div
                          style={{
                            fontSize: 12,
                            color: "var(--text-3)",
                            marginTop: 2,
                          }}
                        >
                          {p.desc[locale] || p.desc.en}
                        </div>
                      </div>
                    </div>

                    <div
                      style={{ display: "flex", gap: 6, alignItems: "center" }}
                    >
                      {/* Webhook button - only show if connected */}
                      {connected[p.key] && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            openWebhookSetup(p.key);
                          }}
                          style={{
                            fontSize: 11,
                            color: "var(--p)",
                            fontWeight: 600,
                            border: "1.5px solid var(--border)",
                            borderRadius: 8,
                            padding: "4px 10px",
                            background: "var(--surface)",
                            display: "flex",
                            alignItems: "center",
                            gap: 4,
                            cursor: "pointer",
                            transition: "all .15s",
                          }}
                          onMouseEnter={(e) => {
                            e.currentTarget.style.background =
                              "var(--surface2)";
                          }}
                          onMouseLeave={(e) => {
                            e.currentTarget.style.background = "var(--surface)";
                          }}
                        >
                          <Webhook /> Webhook
                        </button>
                      )}

                      {/* Status badge */}
                      {connected[p.key] ? (
                        <motion.div
                          initial={{ scale: 0 }}
                          animate={{ scale: 1 }}
                          style={{
                            display: "flex",
                            alignItems: "center",
                            gap: 5,
                            color: "#10b981",
                            fontSize: 12,
                            fontWeight: 700,
                            background: "#f0fdf4",
                            border: "1px solid #bbf7d0",
                            borderRadius: 99,
                            padding: "4px 10px",
                            flexShrink: 0,
                          }}
                        >
                          <IcCheck /> {tstore("status.connected")}
                        </motion.div>
                      ) : (
                        <div
                          onClick={() => setActive(p.key)}
                          style={{
                            fontSize: 12,
                            color: "var(--p)",
                            fontWeight: 700,
                            border: "1.5px solid var(--p)",
                            borderRadius: 8,
                            padding: "4px 12px",
                            flexShrink: 0,
                            transition: "background .15s, color .15s",
                          }}
                          onMouseEnter={(e) => {
                            e.currentTarget.style.background = "var(--p)";
                            e.currentTarget.style.color = "#fff";
                          }}
                          onMouseLeave={(e) => {
                            e.currentTarget.style.background = "transparent";
                            e.currentTarget.style.color = "var(--p)";
                          }}
                        >
                          {tstore("status.connect_btn")}
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>

              <div
                style={{ display: "flex", gap: 10, justifyContent: "flex-end" }}
              >
                <BtnGhost onClick={onBack}>{tp("back_btn")}</BtnGhost>
                <BtnPrimary onClick={onNext}>
                  {Object.keys(connected).length > 0
                    ? ts("actions.finish")
                    : ts("actions.skip_finish")}{" "}
                  <IcArrow dir="right" />
                </BtnPrimary>
              </div>
            </motion.div>
          ) : showWebhook ? (
            // Webhook Setup View
            <motion.div
              key="webhook"
              initial={{ opacity: 0, x: 12 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -12 }}
            >
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 12,
                  marginBottom: 22,
                }}
              >
                <div
                  style={{
                    width: 44,
                    height: 44,
                    borderRadius: 12,
                    flexShrink: 0,
                    background: "var(--surface2)",
                    border: "1.5px solid var(--border)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    overflow: "hidden",
                  }}
                >
                  <img
                    src={provider.img}
                    alt={provider.label[locale] || provider.label.en}
                    style={{ width: 28, height: 28, objectFit: "contain" }}
                    onError={(e) => {
                      e.currentTarget.style.display = "none";
                      e.currentTarget.parentElement.innerHTML = `<span style="font-size:22px">${provider.emoji || "🔗"}</span>`;
                    }}
                  />
                </div>

                <div>
                  <div
                    style={{
                      fontSize: 15,
                      fontWeight: 700,
                      color: "var(--text)",
                    }}
                  >
                    {ts("webhook.title", { name: provider.label[locale] || provider.label.en })}
                  </div>
                  <div style={{ fontSize: 12, color: "var(--text-3)" }}>
                    {ts("webhook.subtitle", { name: provider.label[locale] || provider.label.en })}
                  </div>
                </div>
              </div>

              {/* Info box */}
              <div
                style={{
                  background: "var(--surface2)",
                  border: "1.5px solid var(--border)",
                  borderRadius: 12,
                  padding: 14,
                  marginBottom: 16,
                }}
              >
                <p
                  style={{
                    fontSize: 12,
                    fontWeight: 600,
                    color: "var(--text)",
                    marginBottom: 4,
                  }}
                >
                  {ts("webhook.info_title")}
                </p>
                <p
                  style={{
                    fontSize: 11,
                    color: "var(--text-3)",
                    lineHeight: 1.5,
                  }}
                >
                  {ts("webhook.info_desc")}
                </p>
              </div>

              {webhookLoading ? (
                <WebhookSkeleton />
              ) : webhookData ? (
                <>
                  {/* Webhook URL */}
                  {!webhookHiddenFields.includes("webhookUrl") && (
                    <CopyableField
                      label={t("webhook.urlLabel")}
                      value={webhookData.webhookUrl}
                    />
                  )}

                  {/* Header Name */}
                  {!webhookHiddenFields.includes("headerName") && (
                    <CopyableField
                      label={t("webhook.headerName")}
                      value={webhookData.headerName}
                    />
                  )}

                  {/* Header Value (Secret) */}
                  {!webhookHiddenFields.includes("headerValue") && (
                    <CopyableField
                      label={t("webhook.headerValue")}
                      value={webhookData.headerValue}
                    />
                  )}

                  {/* Security hint with rotate button */}
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      gap: 12,
                      background: "var(--surface2)",
                      border: "1.5px solid var(--border)",
                      borderRadius: 12,
                      padding: 12,
                      marginTop: 16,
                    }}
                  >
                    <p
                      style={{
                        fontSize: 11,
                        color: "var(--text-3)",
                        lineHeight: 1.5,
                        flex: 1,
                      }}
                    >
                      {ts("webhook.security_hint")}
                    </p>
                    <button
                      onClick={rotateSecret}
                      disabled={rotatingSecret}
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: 6,
                        fontSize: 11,
                        fontWeight: 700,
                        color: "var(--text)",
                        background: "var(--surface)",
                        border: "1.5px solid var(--border)",
                        borderRadius: 8,
                        padding: "6px 12px",
                        cursor: rotatingSecret ? "not-allowed" : "pointer",
                        opacity: rotatingSecret ? 0.5 : 1,
                        transition: "all .2s",
                      }}
                    >
                      {rotatingSecret ? (
                        <>
                          <Loader2 size={12} className="animate-spin" />
                          {ts("webhook.renewing")}
                        </>
                      ) : (
                        <>
                          <RotateCcw size={12} /> {ts("webhook.renew_btn")}
                        </>
                      )}
                    </button>
                  </div>
                </>
              ) : null}

              <div style={{ display: "flex", gap: 10, marginTop: 20 }}>
                <BtnGhost
                  onClick={() => {
                    setShowWebhook(false);
                    setWebhookData(null);
                    setActive(null);
                  }}
                >
                  {tstore("actions.close")}
                </BtnGhost>
              </div>
            </motion.div>
          ) : (
            // Credentials Form View
            <motion.div
              key="sform"
              initial={{ opacity: 0, x: 12 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -12 }}
            >
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 12,
                  marginBottom: 22,
                }}
              >
                <div
                  style={{
                    width: 44,
                    height: 44,
                    borderRadius: 12,
                    flexShrink: 0,
                    background: "var(--surface2)",
                    border: "1.5px solid var(--border)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    overflow: "hidden",
                    transition: "all .2s",
                  }}
                >
                  <img
                    src={provider.img}
                    alt={provider.label[locale] || provider.label.en}
                    style={{ width: 28, height: 28, objectFit: "contain" }}
                    onError={(e) => {
                      e.currentTarget.style.display = "none";
                      e.currentTarget.parentElement.innerHTML = `<span style="font-size:22px">${provider.emoji || "🔗"}</span>`;
                    }}
                  />
                </div>

                <div>
                  <div
                    style={{
                      fontSize: 15,
                      fontWeight: 700,
                      color: "var(--text)",
                    }}
                  >
                    {provider.label[locale] || provider.label.en}
                  </div>
                  <div style={{ fontSize: 12, color: "var(--text-3)" }}>
                    {connected[provider.key]
                      ? t("editTitle")
                      : t("addTitle")}
                  </div>
                </div>
              </div>

              {fields.map((f) => {
                const existingValue =
                  integrations[active]?.credentials?.[f.key];
                const placeholder =
                  f.hide && existingValue ? existingValue : t(f.labelKey);

                return (
                  <Field
                    key={f.key}
                    label={t(f.labelKey)}
                    required={f.required}
                  >
                    <InputWrap icon={<IcLock />}>
                      <input
                        className="ob-input"
                        type={f.type}
                        placeholder={placeholder}
                        value={fd[f.key] || ""}
                        onChange={(e) => setFd(f.key, e.target.value)}
                        style={{

                          textAlign: "left",
                          paddingLeft: 36,
                          width: "100%",
                          height: 42,
                          borderRadius: 10,
                          border: "1.5px solid var(--border)",
                          background: "var(--surface)",
                          fontSize: 13,
                          color: "var(--text)",
                          outline: "none",
                        }}
                      />
                    </InputWrap>
                  </Field>
                );
              })}

              <div style={{ display: "flex", gap: 10, marginTop: 8 }}>
                <BtnGhost
                  onClick={() => {
                    setActive(null);
                  }}
                >
                  {tstore("actions.cancel")}
                </BtnGhost>
                <BtnPrimary
                  onClick={save}
                  loading={saving || nextLoading}
                  disabled={nextLoading}
                  style={{ flex: 1 }}
                >
                  {connected[provider.key]
                    ? ts("actions.update_data")
                    : ts("actions.save_connect")}
                </BtnPrimary>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      )}
    </motion.div>
  );
}

const stepMap = {
  welcome: 0,
  plan: 1,
  company: 2,
  store: 3,
  shipping: 4,
  finished: 5,
};

const OnboardingSkeleton = () => (
  <div className="flex w-full max-w-[1000px] min-h-[580px] rounded-xl bg-surface overflow-hidden shadow-[0_28px_80px_rgba(103,99,175,0.1)]">
    {/* Mock Sidebar */}
    <div className="w-[300px] bg-[#1b1945] p-10 flex flex-col gap-5">
      {[1, 2, 3, 4].map((i) => (
        <div
          key={i}
          className="h-10 w-full rounded-lg bg-white/5 animate-pulse"
        />
      ))}
    </div>

    {/* Mock Content Area */}
    <div className="flex-1 p-11 flex flex-col gap-5">
      <div className="h-8 w-2/5 rounded-lg bg-gray-300 animate-pulse" />
      <div className="h-24 w-full rounded-xl bg-gray-200 animate-pulse" />

      <div className="grid grid-cols-2 gap-5 mt-5">
        <div className="h-44 w-full rounded-xl bg-gray-200 animate-pulse" />
        <div className="h-44 w-full rounded-xl bg-gray-200 animate-pulse" />
      </div>
    </div>
  </div>
);

/* ─── Step 5: Finished ─────────────────────────────────────── */
function FinishedStep({ open }) {
  const tLocal = useTranslations('auth');
  const t = useTranslations("onboarding.finished");
  const [loading, setLoading] = useState(false);
  const locale = useLocale();
  const router = useRouter();
  const { handleAuthSuccess } = useAuth();
  if (!open) return null;

  const highlights = [
    {
      emoji: "📦",
      title: t("highlights.orders.title"),
      desc: t("highlights.orders.desc"),
    },
    {
      emoji: "🚚",
      title: t("highlights.shipping.title"),
      desc: t("highlights.shipping.desc"),
    },
    {
      emoji: "📊",
      title: t("highlights.reports.title"),
      desc: t("highlights.reports.desc"),
    },
  ];

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    const tid = toast.loading(t('loading'));

    try {
      const { data: authData } = await api.get(`/auth/sign`);
      await handleAuthSuccess(authData);
      toast.success(t('success'), { id: tid });
    } catch (error) {
      // 7. Detailed Error Handling
      const status = error?.response?.status || error?.status;

      if (status === 401) {
        toast.error(tLocal("signin.session_expired"), { id: tid });
      } else if (status === 403) {
        toast.error(tLocal("signin.no_permission"), { id: tid });
      } else {
        toast.error(tLocal("signin.invalid_credentials"), { id: tid });
      }

      setTimeout(() => {
        router.push("/auth?mode=signin");
      }, 300);
    } finally {
      setLoading(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -16 }}
      transition={{ duration: 0.35 }}
    >
      {/* Celebration Hero */}
      <div style={{ marginBottom: 36, textAlign: "center" }}>
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ type: "spring", duration: 0.7 }}
          style={{
            width: 80,
            height: 80,
            borderRadius: 24,
            margin: "0 auto 20px",
            background: "linear-gradient(145deg, #22c55e, #16a34a)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: 36,
            boxShadow: "0 14px 40px rgba(34,197,94,.35)",
          }}
        >
          🎉
        </motion.div>

        <h1
          style={{
            fontSize: 26,
            fontWeight: 900,
            color: "var(--text)",
            marginBottom: 10,
          }}
        >
          {t("title")}
        </h1>

        <p
          style={{
            fontSize: 14,
            color: "var(--text-3)",
            lineHeight: 1.7,
            maxWidth: 420,
            margin: "0 auto",
          }}
        >
          {t("desc")}
        </p>
      </div>

      {/* Highlights */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "1fr",
          gap: 12,
          marginBottom: 36,
        }}
      >
        {highlights.map((t, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 + i * 0.08 }}
            style={{
              background: "var(--surface)",
              border: "1px solid var(--border)",
              borderRadius: 14,
              padding: "16px 14px",
              display: "flex",
              gap: 12,
              alignItems: "flex-start",
              boxShadow: "0 2px 8px rgba(0,0,0,.05)",
            }}
          >
            <span style={{ fontSize: 24 }}>{t.emoji}</span>

            <div>
              <div
                style={{
                  fontSize: 13,
                  fontWeight: 700,
                  color: "var(--text)",
                  marginBottom: 3,
                }}
              >
                {t.title}
              </div>

              <div
                style={{
                  fontSize: 11.5,
                  color: "var(--text-3)",
                  lineHeight: 1.55,
                }}
              >
                {t.desc}
              </div>
            </div>
          </motion.div>
        ))}
      </div>
      <div
        style={{
          display: "flex",
          gap: 10,
          justifyContent: "flex-end",
          marginTop: 4,
        }}
      >

        {/* Go to dashboard */}
        <BtnPrimary
          onClick={handleSubmit}
          disabled={loading}
          style={{ width: "100%" }}
        >
          {t("goBtn")} 🚀
        </BtnPrimary>
      </div>
    </motion.div>
  );
}

function NoStepFound() {
  const t = useTranslations("onboarding.errors");
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -16 }}
      transition={{ duration: 0.35 }}
    >
      {/* Icon */}
      <motion.div
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ type: "spring", duration: 0.7 }}
        style={{
          width: 72,
          height: 72,
          borderRadius: 22,
          background: "linear-gradient(145deg, #f59e0b, #d97706)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontSize: 34,
          margin: "0 auto 22px",
          boxShadow: "0 12px 40px rgba(245,158,11,.35)",
        }}
      >
        ⚠️
      </motion.div>

      <h2
        style={{
          fontSize: 22,
          fontWeight: 900,
          marginBottom: 10,
          color: "var(--text)",
          textAlign: "center",
        }}
      >
        {t("no_step_title")}
      </h2>

      <p
        style={{
          fontSize: 14,
          color: "var(--text-3)",
          lineHeight: 1.7,
          marginBottom: 28,
          textAlign: "center",
        }}
      >
        {t("no_step_desc")}
      </p>

      <div
        style={{
          display: "flex",
          gap: 12,
          justifyContent: "center",
        }}
      >
        <BtnPrimary onClick={() => window.location.reload()}>
          {t("retry_btn")}
        </BtnPrimary>
      </div>
    </motion.div>
  );
}

function UnauthorizedUser() {
  const t = useTranslations("onboarding.errors");
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -16 }}
      transition={{ duration: 0.35 }}
    >
      {/* Icon */}
      <motion.div
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ type: "spring", duration: 0.7 }}
        style={{
          width: 72,
          height: 72,
          borderRadius: 22,
          background: "linear-gradient(145deg, #f87171, #dc2626)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontSize: 34,
          margin: "0 auto 22px",
          boxShadow: "0 12px 40px rgba(220,38,38,.35)",
        }}
      >
        🚫
      </motion.div>

      {/* Heading */}
      <h2
        style={{
          fontSize: 22,
          fontWeight: 900,
          marginBottom: 10,
          color: "var(--text)",
          textAlign: "center",
        }}
      >
        {t("unauthorized_title")}
      </h2>

      {/* Description */}
      <p
        style={{
          fontSize: 14,
          color: "var(--text-3)",
          lineHeight: 1.7,
          marginBottom: 28,
          textAlign: "center",
        }}
      >
        {t("unauthorized_desc")}
      </p>
    </motion.div>
  );
}

/* ─── Main ────────────────────────────────────────────────── */

