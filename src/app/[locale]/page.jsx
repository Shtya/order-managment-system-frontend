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
            className="absolute ltr:right-[10px] rtl:left-[10px] whitespace-nowrap text-white font-bold text-sm px-6 py-3 rounded-full flex-shrink-0"
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
            className="absolute ltr:right-[10px] rtl:left-[10px] whitespace-nowrap text-white font-bold text-sm px-6 py-3 rounded-full flex-shrink-0 transition-all overflow-hidden"
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
        className="flex-1 h-[55px] bg-transparent !outline-none text-base px-4 text-gray-500 placeholder-gray-400"
        dir="rtl"
      />
    </motion.div>
  );
}

/* ─── Hero ─── */
function Hero({ t, heroImage, locale, switchLocale, user }) {
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
        <div className="text-right">
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

          <motion.p
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{
              duration: 0.6,
              delay: 0.15,
              ease: [0.22, 1, 0.36, 1],
            }}
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
  const {user} = useAuth();

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
