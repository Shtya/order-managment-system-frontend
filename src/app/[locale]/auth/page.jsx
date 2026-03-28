"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Toaster } from "react-hot-toast";
import { useTranslations } from "next-intl";

import AuthBrandSide from "./tabs/AuthBrandSide";
import SignIn from "./tabs/Signin";
import SignUp from "./tabs/Signup";
import ForgotPassword from "./tabs/Forgotpassword";
import { useSearchParams } from "next/navigation";

/* ─────────────────────────────────────────────────────────────
   Global CSS
───────────────────────────────────────────────────────────── */
const GLOBAL_CSS = `
  @import url('https://fonts.googleapis.com/css2?family=Cairo:wght@300;400;500;600;700;800;900&family=JetBrains+Mono:wght@400;500;600&display=swap');

  :root {
    --p:         #6763AF;
    --p2:        #5750a0;
    --p-light:   #8c89c8;
    --p-xlight:  #edeeff;
    --p-dark:    #4a4788;
    --p-glow:    rgba(103,99,175,.18);
    --p-glow-md: rgba(103,99,175,.28);
    --text:      #16162a;
    --text-2:    #4b4b6a;
    --text-3:    #9090b0;
    --border:    #e3e2f0;
    --border-hi: #c8c6e8;
    --bg:        #eeedf6;
    --bg-alt:    #e8e7f2;
    --surface:   #ffffff;
    --surface2:  #f7f7fc;
    --surface3:  #f0f0f8;
    --radius-sm: 10px;
    --radius:    14px;
    --radius-xl: 24px;
    --font:      'Cairo', sans-serif;
    --mono:      'JetBrains Mono', monospace;
  }

  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
  body {
    font-family: var(--font);
    background: var(--bg);
    color: var(--text);
    overflow: hidden;
    height: 100vh;
    -webkit-font-smoothing: antialiased;
    -moz-osx-font-smoothing: grayscale;
  }

  /* ── Inputs ── */
  .auth-input {
    width: 100%; height: 48px;
    padding-inline-start: 44px;
    padding-inline-end: 14px;
    background: var(--surface2);
    border: 1.5px solid var(--border);
    border-radius: var(--radius-sm);
    font-family: var(--font); font-size: 14px; color: var(--text);
    outline: none;
    transition: border-color .18s, box-shadow .18s, background .18s;
  }
  .auth-input:focus {
    border-color: var(--p);
    background: var(--surface);
    box-shadow: 0 0 0 3px var(--p-glow);
  }
  .auth-input.error { border-color: #ef4444; background: #fff5f5; }
  .auth-input::placeholder { color: var(--text-3); }

  .auth-select {
    width: 100%; height: 48px;
    padding: 0 44px 0 32px;
    background: var(--surface2);
    border: 1.5px solid var(--border);
    border-radius: var(--radius-sm);
    font-family: var(--font); font-size: 14px; color: var(--text);
    outline: none; appearance: none; cursor: pointer;
    transition: border-color .18s, box-shadow .18s;
  }
  .auth-select:focus {
    border-color: var(--p);
    background: var(--surface);
    box-shadow: 0 0 0 3px var(--p-glow);
  }

  .otp-cell {
    width: 50px; height: 56px;
    text-align: center; font-size: 22px; font-weight: 700;
    font-family: var(--mono);
    border-radius: var(--radius-sm);
    border: 2px solid var(--border);
    background: var(--surface2); color: var(--text);
    outline: none;
    transition: border-color .18s, box-shadow .18s, background .18s;
  }
  .otp-cell:focus  { border-color: var(--p); box-shadow: 0 0 0 3px var(--p-glow); background: var(--surface); }
  .otp-cell.filled { border-color: var(--p); color: var(--p); background: var(--p-xlight); }
  .otp-cell.error-cell { border-color: #ef4444; color: #ef4444; }

  @keyframes spin { to { transform: rotate(360deg); } }
  .spinner {
    width: 18px; height: 18px;
    border: 2.5px solid rgba(255,255,255,.32);
    border-top-color: #fff;
    border-radius: 50%;
    animation: spin .65s linear infinite;
    flex-shrink: 0;
  }

  .form-scroll::-webkit-scrollbar { width: 4px; }
  .form-scroll::-webkit-scrollbar-track { background: transparent; }
  .form-scroll::-webkit-scrollbar-thumb { background: var(--border); border-radius: 99px; }

  @keyframes auth-bg-drift {
    0%, 100% { transform: translate(0, 0) scale(1); }
    33%       { transform: translate(12px, -18px) scale(1.04); }
    66%       { transform: translate(-8px, 10px) scale(0.97); }
  }

  @media (max-width: 1024px) {
    body { overflow-y: auto !important; height: auto !important; }
    .auth-main-wrapper { height: auto !important; overflow: visible !important; display: block !important; }
    .brand-col  { display: none !important; }
    .form-col   { 
      width: 100vw !important; 
      height: auto !important;
      min-height: 100vh !important;
      justify-content: center !important; 
      align-items: flex-start !important; 
      padding: clamp(24px, 5vw, 48px) clamp(16px, 4vw, 24px) !important; 
    }
    .card-outer { margin-right: 0 !important; padding: 0 !important; max-width: 100% !important; margin-top: auto; margin-bottom: auto; }
  }

  @media (max-width: 640px) {
    body { overflow-y: auto !important; height: auto !important; min-height: 100vh !important; }
    .form-col { padding: 16px 10px !important; height: auto !important; min-height: 100vh !important; align-items: flex-start !important; }
    .auth-card-body { padding: clamp(16px, 5vw, 24px) clamp(12px, 4vw, 20px) clamp(20px, 6vw, 28px) !important; }
    .otp-cell { width: clamp(40px, 12vw, 50px); height: clamp(48px, 14vw, 56px); font-size: 18px; }
    
  }
`;

/* ─────────────────────────────────────────────────────────────
   Right-side decorative background
───────────────────────────────────────────────────────────── */
function FormSideBackground() {
  return (
    <>
      {/* Dot grid */}
      <div
        style={{
          position: "fixed",
          top: 0,
          bottom: 0,
          right: 0,
          width: "clamp(300px, 50vw, 50vw)",
          backgroundImage:
            "radial-gradient(circle, rgba(103,99,175,0.10) 1.2px, transparent 1.2px)",
          backgroundSize: "24px 24px",
          pointerEvents: "none",
          zIndex: 0,
        }}
      />

      {/* Top-right corner arc - hidden on mobile */}
      <div
        className="hidden sm:block"
        style={{
          position: "fixed",
          top: -80,
          right: -80,
          width: 320,
          height: 320,
          borderRadius: "50%",
          border: "1px solid rgba(103,99,175,0.10)",
          pointerEvents: "none",
          zIndex: 0,
        }}
      />
      <div
        className="hidden sm:block"
        style={{
          position: "fixed",
          top: -130,
          right: -130,
          width: 460,
          height: 460,
          borderRadius: "50%",
          border: "1px solid rgba(103,99,175,0.06)",
          pointerEvents: "none",
          zIndex: 0,
        }}
      />

      {/* Bottom ambient orb */}
      <motion.div
        style={{
          position: "fixed",
          bottom: "-10%",
          right: "4%",
          width: "clamp(200px, 30vw, 360px)",
          height: "clamp(200px, 30vw, 360px)",
          borderRadius: "50%",
          background:
            "radial-gradient(circle, rgba(103,99,175,.09), transparent 70%)",
          filter: "blur(60px)",
          pointerEvents: "none",
          zIndex: 0,
        }}
        animate={{ scale: [1, 1.12, 1], y: [0, -18, 0] }}
        transition={{ duration: 14, repeat: Infinity, ease: "easeInOut" }}
      />

      {/* Top ambient orb */}
      <motion.div
        style={{
          position: "fixed",
          top: "-8%",
          right: "18%",
          width: 260,
          height: 260,
          borderRadius: "50%",
          background:
            "radial-gradient(circle, rgba(140,137,200,.07), transparent 70%)",
          filter: "blur(50px)",
          pointerEvents: "none",
          zIndex: 0,
        }}
        animate={{ scale: [1.08, 1, 1.08], x: [0, 12, 0] }}
        transition={{
          duration: 11,
          repeat: Infinity,
          ease: "easeInOut",
          delay: 2,
        }}
      />
    </>
  );
}

/* ─────────────────────────────────────────────────────────────
   Mode Toggle — animated sliding pill
───────────────────────────────────────────────────────────── */
function ModeToggle({ mode, onChange, t }) {
  const signinRef = useRef(null);
  const signupRef = useRef(null);
  const [pill, setPill] = useState({ left: 4, width: 120 });

  useEffect(() => {
    const el = mode === "signin" ? signinRef.current : signupRef.current;
    if (el) setPill({ left: el.offsetLeft, width: el.offsetWidth });
  }, [mode]);

  return (
    <div
      style={{
        position: "relative",
        display: "flex",
        background: "rgba(103,99,175,0.06)",
        borderBottom: "1px solid var(--border)",
        padding: "clamp(3px, 1vw, 5px)",
        gap: "clamp(2px, 0.5vw, 4px)",
      }}
    >
      {/* Sliding pill */}
      <motion.div
        style={{
          position: "absolute",
          top: "clamp(3px, 1vw, 5px)",
          bottom: "clamp(3px, 1vw, 5px)",
          borderRadius: 10,
          background: "linear-gradient(135deg, var(--p), var(--p2))",
          boxShadow:
            "0 4px 18px rgba(103,99,175,.38), inset 0 1px 0 rgba(255,255,255,.18)",
          zIndex: 0,
        }}
        animate={{ left: pill.left, width: pill.width }}
        transition={{ type: "spring", stiffness: 460, damping: 36 }}
      />

      {[
        { id: "signin", ref: signinRef, label: t("mode.signin") },
        { id: "signup", ref: signupRef, label: t("mode.signup") },
      ].map((btn) => (
        <button
          key={btn.id}
          ref={btn.ref}
          onClick={() => onChange(btn.id)}
          style={{
            flex: 1,
            padding: "clamp(8px, 2vw, 12px) clamp(10px, 3vw, 14px)",
            border: "none",
            background: "transparent",
            borderRadius: 8,
            fontFamily: "var(--font)",
            fontSize: "clamp(12px, 3.5vw, 14px)",
            fontWeight: 700,
            cursor: "pointer",
            color: mode === btn.id ? "#fff" : "var(--text-3)",
            position: "relative",
            zIndex: 1,
            transition: "color .22s",
            letterSpacing: "-0.1px",
            whiteSpace: "nowrap",
          }}
        >
          {btn.label}
        </button>
      ))}
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────
   Card top accent bar — shows active mode color
───────────────────────────────────────────────────────────── */
function CardAccentBar({ mode, showForgot }) {
  const color = showForgot
    ? "linear-gradient(90deg, #6763AF, #8c89c8, #6763AF)"
    : mode === "signin"
      ? "linear-gradient(90deg, #6763AF 0%, #9d9bd8 50%, #6763AF 100%)"
      : "linear-gradient(90deg, #5750a0 0%, #7270be 50%, #5750a0 100%)";

  return (
    <motion.div
      key={mode + showForgot}
      initial={{ opacity: 0, scaleX: 0.7 }}
      animate={{ opacity: 1, scaleX: 1 }}
      transition={{ duration: 0.45, ease: [0.16, 1, 0.3, 1] }}
      style={{
        height: 3,
        width: "100%",
        background: color,
        transformOrigin: "left center",
      }}
    />
  );
}

/* ─────────────────────────────────────────────────────────────
   Forgot password back bar
───────────────────────────────────────────────────────────── */
function ForgotBackBar({ onClick, t }) {
  const [hov, setHov] = useState(false);
  return (
    <motion.div
      initial={{ opacity: 0, height: 0 }}
      animate={{ opacity: 1, height: "auto" }}
      exit={{ opacity: 0, height: 0 }}
      transition={{ duration: 0.22 }}
      style={{ overflow: "hidden" }}
    >
      <button
        type="button"
        onClick={onClick}
        onMouseEnter={() => setHov(true)}
        onMouseLeave={() => setHov(false)}
        style={{
          display: "flex",
          alignItems: "center",
          gap: 8,
          width: "100%",
          padding: "clamp(10px, 3vw, 12px) clamp(16px, 4vw, 22px)",
          background: hov ? "rgba(103,99,175,0.1)" : "var(--p-xlight)",
          borderBottom: "1px solid rgba(103,99,175,.12)",
          border: "none",
          fontFamily: "var(--font)",
          fontSize: "clamp(12px, 3.5vw, 13px)",
          fontWeight: 700,
          color: "var(--p)",
          cursor: "pointer",
          transition: "background .18s",
        }}
      >
        <motion.span
          animate={{ x: hov ? -3 : 0 }}
          transition={{ duration: 0.18 }}
        >
          <svg
            width="14"
            height="14"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M19 12H5" />
            <path d="m12 19-7-7 7-7" />
          </svg>
        </motion.span>
        {t("forgot.back")}
      </button>
    </motion.div>
  );
}

/* ─────────────────────────────────────────────────────────────
   Page
───────────────────────────────────────────────────────────── */
export default function AuthPage() {
  const t = useTranslations("auth");

  const searchParams = useSearchParams();

  const [mode, setMode] = useState(() => {
    return searchParams.get("mode") === "signup" ? "signup" : "signin";
  });

  const [showForgot, setShowForgot] = useState(false);

  const handleModeChange = useCallback((m) => {
    setMode(m);
    setShowForgot(false);
    if (typeof window !== "undefined") {
      const url = new URL(window.location.href);
      url.searchParams.set("mode", m);
      window.history.pushState({}, "", url.toString());
    }
  }, []);

  useEffect(() => {
    const handler = () => {
      const m = new URLSearchParams(window.location.search).get("mode");
      setMode(m === "signup" ? "signup" : "signin");
    };
    window.addEventListener("popstate", handler);
    return () => window.removeEventListener("popstate", handler);
  }, []);

  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: GLOBAL_CSS }} />
      <Toaster position="top-center" />

      <div
        className="auth-main-wrapper"
        style={{
          display: "flex",
          width: "100vw",
          height: "100vh",
          overflow: "hidden",
        }}
      >
        {/* ── Brand side ── */}
        <div
          className="brand-col"
          style={{
            width: "50vw",
            height: "100vh",
            flexShrink: 0,
            position: "relative",
            zIndex: 1,
          }}
        >
          <AuthBrandSide mode={showForgot ? "signin" : mode} t={t} />
        </div>

        {/* ── Form side ── */}
        <div
          className="form-col"
          style={{
            width: "50vw",
            height: "100vh",
            overflowY: "auto",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: "32px 48px",
            position: "relative",
            zIndex: 2,
            background: "var(--bg)",
          }}
        >
          <FormSideBackground />

          {/* Card wrapper — overlaps the divider slightly */}
          <motion.div
            className="card-outer"
            style={{
              width: "100%",
              maxWidth: 560,
              position: "relative",
              zIndex: 10,
              flexShrink: 0,
            }}
            initial={{ opacity: 0, x: 44, scale: 0.96 }}
            animate={{ opacity: 1, x: 0, scale: 1 }}
            transition={{ duration: 0.65, ease: [0.16, 1, 0.3, 1] }}
          >
            {/* ── Outer glow shadow (breathing) ── */}
            <motion.div
              style={{
                position: "absolute",
                inset: -14,
                borderRadius: 30,
                pointerEvents: "none",
                zIndex: -1,
              }}
              animate={{
                boxShadow: [
                  "-18px 0 60px rgba(103,99,175,.12), 0 32px 80px rgba(30,20,80,.16), 0 8px 24px rgba(103,99,175,.10)",
                  "-22px 0 80px rgba(103,99,175,.18), 0 40px 100px rgba(30,20,80,.22), 0 12px 32px rgba(103,99,175,.16)",
                  "-18px 0 60px rgba(103,99,175,.12), 0 32px 80px rgba(30,20,80,.16), 0 8px 24px rgba(103,99,175,.10)",
                ],
              }}
              transition={{ duration: 5, repeat: Infinity, ease: "easeInOut" }}
            />

            {/* ── Card ── */}
            <div
              style={{
                background: "rgba(255,255,255,0.98)",
                backdropFilter: "blur(28px)",
                borderRadius: 20,
                border: "1px solid rgba(255,255,255,0.92)",
                overflow: "hidden",
                position: "relative",
                /* subtle inner top highlight */
                boxShadow: "inset 0 1px 0 rgba(255,255,255,1)",
              }}
            >
              {/* Top gradient accent rule */}
              <CardAccentBar mode={mode} showForgot={showForgot} />

              {/* Forgot back bar */}
              <AnimatePresence>
                {showForgot && (
                  <ForgotBackBar
                    key="fbar"
                    onClick={() => setShowForgot(false)}
                    t={t}
                  />
                )}
              </AnimatePresence>

              {/* Mode toggle tabs */}
              <AnimatePresence>
                {!showForgot && (
                  <motion.div
                    key="toggle"
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    exit={{ opacity: 0, height: 0 }}
                    transition={{ duration: 0.2 }}
                    style={{ overflow: "hidden" }}
                  >
                    <ModeToggle mode={mode} onChange={handleModeChange} t={t} />
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Form body */}
              <div className="auth-card-body" style={{ padding: "28px 32px 32px" }}>
                <AnimatePresence mode="wait">
                  {showForgot ? (
                    <motion.div
                      key="forgot"
                      initial={{ opacity: 0, y: 14, filter: "blur(4px)" }}
                      animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
                      exit={{ opacity: 0, y: -10, filter: "blur(4px)" }}
                      transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
                    >
                      <ForgotPassword
                        t={t}
                        onBack={() => setShowForgot(false)}
                      />
                    </motion.div>
                  ) : mode === "signin" ? (
                    <motion.div
                      key="signin"
                      initial={{ opacity: 0, y: 14, filter: "blur(4px)" }}
                      animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
                      exit={{ opacity: 0, y: -10, filter: "blur(4px)" }}
                      transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
                    >
                      <SignIn
                        t={t}
                        onSwitchMode={() => handleModeChange("signup")}
                        onForgotPassword={() => setShowForgot(true)}
                      />
                    </motion.div>
                  ) : (
                    <motion.div
                      key="signup"
                      initial={{ opacity: 0, y: 14, filter: "blur(4px)" }}
                      animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
                      exit={{ opacity: 0, y: -10, filter: "blur(4px)" }}
                      transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
                    >
                      <SignUp
                        t={t}
                        onSwitchMode={() => handleModeChange("signin")}
                      />
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </>
  );
}
