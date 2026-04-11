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
        <div className="w-full max-w-xl mx-auto flex justify-center items-center relative">
          <svg viewBox="0 0 600 600" className="w-full h-auto">
            <circle cx="300" cy="300" r="280" fill="#f0fdf4" opacity="0.5"></circle>

            <circle cx="300" cy="300" r="220" fill="white" opacity="0.8"></circle>
            <circle cx="300" cy="300" r="180" fill="none" stroke="var(--primary)" strokeWidth="3" strokeDasharray="10,5" opacity="0.3"><animateTransform attributeName="transform" type="rotate" from="0 300 300" to="360 300 300" dur="20s" repeatCount="indefinite"></animateTransform></circle>
            <circle cx="300" cy="300" r="50" fill="var(--primary)"></circle>
            <circle cx="300" cy="300" r="40" fill="white"></circle>
            <circle cx="300" cy="300" r="25" fill="var(--primary)"></circle>
            <g><circle cx="300" cy="120" r="45" fill="white" stroke="var(--primary)" strokeWidth="3"></circle>
              <circle cx="300" cy="120" r="35" fill="color-mix(in srgb, var(--primary), white 95%)"></circle>
              <path d="M 290 115 Q 290 105, 300 105 Q 310 105, 310 115 L 310 125 M 288 120 L 288 130 Q 288 133, 291 133 L 294 133 M 306 133 L 309 133 Q 312 133, 312 130 L 312 120" stroke="var(--primary)" strokeWidth="2" fill="none" strokeLinecap="round"></path><text x="300" y="145" textAnchor="middle" className="text-xs" fill="var(--primary)" style={{ fontWeight: 600 }}>{t("hero.callCenter")}</text></g><g><circle cx="480" cy="300" r="45" fill="white" stroke="var(--primary)" strokeWidth="3"></circle>
              <circle cx="480" cy="300" r="35" fill="color-mix(in srgb, var(--primary), white 95%)"></circle>
              <rect x="465" y="290" width="30" height="25" fill="none" stroke="var(--primary)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"></rect><path d="M 465 295 L 480 285 L 495 295 M 480 285 L 480 315" stroke="var(--primary)" strokeWidth="2" fill="none" strokeLinecap="round"></path><text x="480" y="330" textAnchor="middle" className="text-xs" fill="var(--primary)" style={{ fontWeight: 600 }}>{t("hero.warehouse")}</text></g><g><circle cx="300" cy="480" r="45" fill="white" stroke="var(--primary)" strokeWidth="3"></circle>
              <circle cx="300" cy="480" r="35" fill="color-mix(in srgb, var(--primary), white 95%)"></circle>
              <circle cx="293" cy="505" r="3" fill="var(--primary)"></circle>
              <circle cx="307" cy="505" r="3" fill="var(--primary)"></circle>
              <path d="M 285 475 L 288 475 L 295 497 L 310 497 M 288 475 L 315 475 L 312 485 L 295 485" stroke="var(--primary)" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round"></path><text x="300" y="465" textAnchor="middle" className="text-xs" fill="var(--primary)" style={{ fontWeight: 600 }}>{t("hero.orders")}</text></g><g><circle cx="120" cy="300" r="45" fill="white" stroke="var(--primary)" strokeWidth="3"></circle>
              <circle cx="120" cy="300" r="35" fill="color-mix(in srgb, var(--primary), white 95%)"></circle>
              <rect x="100" y="295" width="20" height="15" fill="none" stroke="var(--primary)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"></rect><path d="M 120 295 L 130 295 L 133 303 L 133 310 L 100 310" stroke="var(--primary)" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round"></path><circle cx="108" cy="313" r="3" fill="none" stroke="var(--primary)" strokeWidth="2"></circle>
              <circle cx="125" cy="313" r="3" fill="none" stroke="var(--primary)" strokeWidth="2"></circle>
              <text x="120" y="330" textAnchor="middle" className="text-xs" fill="var(--primary)" style={{ fontWeight: 600 }}>{t("hero.shipping")}</text></g><line x1="300" y1="300" x2="300" y2="165" stroke="var(--primary)" strokeWidth="2" strokeDasharray="5,5" opacity="0.4"></line><line x1="300" y1="300" x2="435" y2="300" stroke="var(--primary)" strokeWidth="2" strokeDasharray="5,5" opacity="0.4"></line><line x1="300" y1="300" x2="300" y2="435" stroke="var(--primary)" strokeWidth="2" strokeDasharray="5,5" opacity="0.4"></line><line x1="300" y1="300" x2="165" y2="300" stroke="var(--primary)" strokeWidth="2" strokeDasharray="5,5" opacity="0.4"></line><circle r="4" fill="var(--primary)"><animateMotion dur="3s" repeatCount="indefinite" path="M 300 300 L 300 165"></animateMotion></circle>
            <circle r="4" fill="var(--primary)"><animateMotion dur="3s" repeatCount="indefinite" path="M 300 300 L 435 300"></animateMotion></circle>
            <circle r="4" fill="var(--primary)"><animateMotion dur="3s" repeatCount="indefinite" path="M 300 300 L 300 435"></animateMotion></circle>
            <circle r="4" fill="var(--primary)"><animateMotion dur="3s" repeatCount="indefinite" path="M 300 300 L 165 300"></animateMotion></circle>
            <circle cx="300" cy="300" r="240" fill="none" stroke="var(--primary)" strokeWidth="2" opacity="0.2"><animateTransform attributeName="transform" type="rotate" from="0 300 300" to="-360 300 300" dur="30s" repeatCount="indefinite"></animateTransform></circle>
            <circle r="8" fill="var(--primary)" opacity="0.6"><animateMotion dur="8s" repeatCount="indefinite" path="M 300,60 A 240,240 0 1,1 300,60"></animateMotion></circle>
            <circle r="8" fill="var(--primary)" opacity="0.6"><animateMotion dur="8s" begin="2s" repeatCount="indefinite" path="M 300,60 A 240,240 0 1,1 300,60"></animateMotion></circle>
            <circle r="8" fill="var(--primary)" opacity="0.6"><animateMotion dur="8s" begin="4s" repeatCount="indefinite" path="M 300,60 A 240,240 0 1,1 300,60"></animateMotion></circle>
            <circle r="8" fill="var(--primary)" opacity="0.6"><animateMotion dur="8s" begin="6s" repeatCount="indefinite" path="M 300,60 A 240,240 0 1,1 300,60"></animateMotion></circle>
            <defs>
              <linearGradient id="greenGradient" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" stop-color="var(--primary)"></stop><stop offset="100%" stop-color="#3db567"></stop></linearGradient></defs>
          </svg>
          <div
            className="absolute top-4 left-0 md:top-10 md:-left-10 scale-90 md:scale-100 origin-top-left bg-white rounded-2xl shadow-xl p-3 md:p-4 border border-gray-100 animate-float"
            style={{ animation: "float 3s ease-in-out 0s infinite normal none running" }}
          >
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 md:w-10 md:h-10 bg-primary/10 rounded-lg flex items-center justify-center">
                <div className="w-1.5 h-5 md:w-2 md:h-6 bg-primary rounded-full"></div>
              </div>
              <div>
                <div className="text-[10px] md:text-xs text-gray-600">{t("hero.revenue")}</div>
                <div className="text-base md:text-lg font-semibold">+24.5%</div>
              </div>
            </div>
          </div>

          {/* Orders Card (Bottom Right) */}
          <div
            className="absolute bottom-4 right-0 md:bottom-20 md:-right-10 scale-90 md:scale-100 origin-bottom-right bg-white rounded-2xl shadow-xl p-3 md:p-4 border border-gray-100 animate-float"
            style={{ animation: "float 4s ease-in-out 1s infinite normal none running" }}
          >
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 md:w-10 md:h-10 bg-primary/10 rounded-lg flex items-center justify-center">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4 md:w-5 md:h-5 text-primary">
                  <polyline points="22 7 13.5 15.5 8.5 10.5 2 17"></polyline>
                  <polyline points="16 7 22 7 22 13"></polyline>
                </svg>
              </div>
              <div>
                <div className="text-[10px] md:text-xs text-gray-600">{t("hero.orders")}</div>
                <div className="text-base md:text-lg font-semibold">1,247</div>
              </div>
            </div>
          </div>
        </div>
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
