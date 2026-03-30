"use client";

import FeatureSection from "@/components/pages/home/FeatureSection";
import { Link, useRouter } from "@/i18n/navigation";
import { usePathname } from "@/i18n/navigation";
import {
  motion,
  useScroll,
  useMotionValueEvent,
  AnimatePresence,
} from "framer-motion";
import { useState, useEffect, useMemo } from "react";
import { useLocale, useTranslations } from "next-intl";
import { Globe } from "lucide-react";
import ServicesSection from "@/components/pages/home/ServiceSection";
import MarqueeTextSection from "@/components/pages/home/Marqueetextsection";
import HowItWorksSection from "@/components/pages/home/Howitworkssection";
import ShippingSection from "@/components/pages/home/ShippingSection";
import TestimonialsSection from "@/components/pages/home/Testimonialssection";
import PricingSection from "@/components/pages/home/Pricingsection";
import FaqSection from "@/components/pages/home/FaqsSection";
import HeroBannerSection from "@/components/pages/home/Herobannersection";
import FooterSection from "@/components/pages/home/Footersection";
import Navbar from "@/components/pages/home/Navbar";
import * as yup from "yup";
import { useAuth } from "@/context/AuthContext";
const BRAND = "#6763AF";

/* ─── Animation helpers ─── */
const fadeUp = (delay = 0) => ({
  initial: { opacity: 0, y: 32 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.72, delay, ease: [0.22, 1, 0.36, 1] },
});


/* ─── Floating particles background ─── */
function FloatingOrbs() {
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none z-0">
      {[
        { w: 320, h: 320, top: "10%", left: "5%", delay: 0, dur: 8 },
        { w: 200, h: 200, top: "60%", right: "8%", delay: 1.5, dur: 10 },
        { w: 150, h: 150, top: "30%", right: "30%", delay: 3, dur: 7 },
      ].map((orb, i) => (
        <motion.div
          key={i}
          className="absolute rounded-full"
          style={{
            width: orb.w,
            height: orb.h,
            top: orb.top,
            left: orb.left,
            right: orb.right,
            background: `radial-gradient(circle, ${BRAND}18 0%, transparent 70%)`,
            filter: "blur(40px)",
          }}
          animate={{ y: [0, -30, 0], scale: [1, 1.08, 1] }}
          transition={{
            duration: orb.dur,
            delay: orb.delay,
            repeat: Infinity,
            ease: "easeInOut",
          }}
        />
      ))}
    </div>
  );
}

/* ─── CTA Input ─── */
function CTAInput({ t }) {
  const [email, setEmail] = useState("");
  const [focused, setFocused] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [submiting, setSubmiting] = useState(false);
  const router = useRouter();
  const schema = yup.object().shape({
    email: yup.string().email().required(),
  });

  const handleSubmit = async (e) => {
    if (e) e.preventDefault();
    setSubmiting(true);
    try {
      await schema.validate({ email });
      setTimeout(() => setSubmitted(false), 3000);
      router.push(`/auth?mode=signup&email=${encodeURIComponent(email)}`);
    } finally {
      setSubmiting(false);
    }
  };
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
      className="flex relative items-center w-full max-w-[470px] bg-white rounded-full shadow-lg overflow-hidden"
      style={{
        border: `1.5px solid ${focused ? BRAND : "#e5e3f5"}`,
        transition: "border-color 0.25s, box-shadow 0.25s",
        boxShadow: focused
          ? `0 0 0 4px ${BRAND}18, 0 8px 30px ${BRAND}22`
          : "0 4px 20px rgba(0,0,0,0.08)",
        padding: "5px",
      }}
    >
      <AnimatePresence mode="wait">
        {submitted ? (
          <motion.button
            key="done"
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.8, opacity: 0 }}
            className="absolute ltr:right-[10px] rtl:left-[10px] whitespace-nowrap text-white font-bold text-xs sm:text-sm px-4 py-2 sm:px-6 sm:py-3 rounded-full flex-shrink-0"
            style={{ background: "#22c55e" }}
          >
            ✓ {t("cta.sent")}
          </motion.button>
        ) : (
          <motion.button
            key="submit"
            disabled={submiting}
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.8, opacity: 0 }}
            whileHover={{ scale: 1.03, boxShadow: `0 6px 24px ${BRAND}55` }}
            whileTap={{ scale: 0.97 }}
            onClick={handleSubmit}
            className="absolute ltr:right-[10px] rtl:left-[10px] whitespace-nowrap text-white font-bold text-xs sm:text-sm px-4 py-2 sm:px-6 sm:py-3 rounded-full flex-shrink-0 transition-all overflow-hidden"
            style={{ background: BRAND }}
          >
            <motion.div
              className="absolute inset-0"
              animate={{ x: ["-100%", "200%"] }}
              transition={{ duration: 2, repeat: Infinity, repeatDelay: 2 }}
              style={{
                background:
                  "linear-gradient(90deg, transparent, rgba(255,255,255,0.25), transparent)",
              }}
            />
            <span className="relative z-10">{t("cta.button")}</span>
          </motion.button>
        )}
      </AnimatePresence>

      <input
        type="email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        placeholder={t("cta.placeholder")}
        className="flex-1 h-[45px] sm:h-[55px]  bg-transparent !outline-none text-sm sm:text-base px-3 sm:px-4 text-gray-500 placeholder-gray-400"
      />
    </motion.div>
  );
}

/* ─── Hero ─── */
function Hero({ t, heroImage, locale, switchLocale, user }) {
  const { handleGoogleLogin } = useAuth();
  return (
    <section
      id="home"
      className="h-fit !pt-[100px] !pb-[40px] relative overflow-hidden"
    >
      <Navbar t={t} locale={locale} switchLocale={switchLocale} user={user} />

      <span
        className="absolute inset-0 z-0"
        style={{
          background:
            "linear-gradient(74.09deg, #BFA3DB -9.83%, #FFFFFF 58.75%)",
        }}
      />
      <div
        className="absolute inset-0 z-0 opacity-[0.04]"
        style={{
          backgroundImage: `linear-gradient(${BRAND} 1px, transparent 1px), linear-gradient(90deg, ${BRAND} 1px, transparent 1px)`,
          backgroundSize: "60px 60px",
        }}
      />
      <FloatingOrbs />

      <div className="container mx-auto px-6 relative z-10 grid lg:grid-cols-2 gap-10 items-center py-[140px] md:py-[200px]">
        <div className="">
          <motion.h1
            {...fadeUp(0.1)}
            className="text-4xl md:text-[3rem] font-extrabold text-[#111928] leading-[1.25] mb-5"
          >
            {t("hero.title1")} <br />
            <span style={{ color: BRAND }}>{t("hero.title2")}</span>
          </motion.h1>

          <motion.p
            {...fadeUp(0.22)}
            className="font-[600] text-[#25456F] text-[1.3rem] leading-relaxed my-8 block"
          >
            {t("hero.subtitle")}
          </motion.p>

          <CTAInput t={t} />
          
          <motion.div
            {...fadeUp(0.35)}
            className="mt-6 flex flex-col gap-5"
          >
            <div className="flex items-center gap-4 w-full max-w-[470px]">
              <div className="h-[1px] bg-gray-200 flex-1 opacity-50" />
              <span className="text-[11px] text-gray-400 font-bold uppercase tracking-[0.1em]">{t("google_auth.or")}</span>
              <div className="h-[1px] bg-gray-200 flex-1 opacity-50" />
            </div>

            <motion.button
              whileHover={{ scale: 1.01, y: -1 }}
              whileTap={{ scale: 0.99 }}
              onClick={() => handleGoogleLogin()}
              className="group relative flex items-center justify-center gap-3 w-full max-w-[470px] h-[52px] bg-white border border-[#e5e3f5] rounded-full shadow-sm hover:shadow-md hover:border-[#6763AF] transition-all duration-300 font-bold text-gray-700 text-sm overflow-hidden"
            >
              <div className="absolute inset-0 bg-gradient-to-r from-[#6763AF05] to-[#6763AF0a] opacity-0 group-hover:opacity-100 transition-opacity" />
              <svg width="20" height="20" viewBox="0 0 24 24" className="relative z-10">
                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
                <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
                <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
              </svg>
              <span className="relative z-10">{t("google_auth.continue")}</span>
            </motion.button>
          </motion.div>

          <motion.p
            {...fadeUp(0.42)}
            className="flex items-center gap-2 rtl:pr-[20px] ltr:pl-[20px]  font-[600] mt-1 text-sm text-[#25456F]"
          >
            {t("hero.trialNote")}
            <span className="text-base">💳</span>
          </motion.p>

        </div>

        {/* Hero image with floating animation */}
        <motion.div
          initial={{ opacity: 0, y: 40, scale: 0.97 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ duration: 0.85, delay: 0.3, ease: [0.22, 1, 0.36, 1] }}
          className="relative"
        >
          <motion.img
            src={heroImage || "landing/hero.png"}
            alt="Dashboard preview"
            animate={{ y: [0, -12, 0] }}
            transition={{ duration: 5, repeat: Infinity, ease: "easeInOut" }}
            className="relative z-10  w-full"
          />
        </motion.div>
      </div>

      <FeatureSection />
    </section>
  );
}

/* ─── Root export ─── */
export default function TalbatiLanding({ heroImage }) {
  const t = useTranslations("landing");
  const locale = useLocale();
  const pathname = usePathname();
  const router = useRouter();
  const { user } = useAuth();

  const switchLocale = (next) => router.replace(pathname, { locale: next });

  return (
    <div className="home">
      <Hero
        id="home"
        t={t}
        heroImage={heroImage}
        locale={locale}
        switchLocale={switchLocale}
        user={user}
      />

      <div id="services">
        <ServicesSection />
      </div>
      <MarqueeTextSection />
      <div id="how-it-works">
        <HowItWorksSection />
      </div>
      <ShippingSection />
      <TestimonialsSection />
      <div id="pricing">
        <PricingSection />
      </div>
      <div id="faq">
        <FaqSection />
      </div>
      <div id="contact">
        <HeroBannerSection />
      </div>
      <FooterSection />
    </div>
  );
}
