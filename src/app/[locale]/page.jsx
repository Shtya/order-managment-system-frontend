"use client";

import FeatureSection from "@/components/pages/home/FeatureSection";
import { Link, useRouter } from "@/i18n/navigation";
import { usePathname } from "@/i18n/navigation";
import { motion, useScroll, useMotionValueEvent, AnimatePresence } from "framer-motion";
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

const BRAND = "#6763AF";

/* ─── Animation helpers ─── */
const fadeUp = (delay = 0) => ({
	initial: { opacity: 0, y: 32 },
	animate: { opacity: 1, y: 0 },
	transition: { duration: 0.72, delay, ease: [0.22, 1, 0.36, 1] },
});

const stagger = (i) => ({
	initial: { opacity: 0, y: 20 },
	animate: { opacity: 1, y: 0 },
	transition: { duration: 0.55, delay: 0.08 + i * 0.07, ease: [0.22, 1, 0.36, 1] },
});

/* ─── Get user from localStorage ─── */
function useStoredUser() {
	const [user, setUser] = useState(null);
	useEffect(() => {
		try {
			const raw = localStorage.getItem("user");
			if (raw) setUser(JSON.parse(raw));
		} catch {
			setUser(null);
		}
	}, []);
	return user;
}

/* ─── Role-based dashboard route ─── */
function getDashboardRoute(role) {
	if (role === "admin") return "/orders";
	if (role === "super_admin") return "/dashboard/users";
	return "/overview";
}

/* ─── Language Toggle (mirrors dashboard header) ─── */
function LanguageToggle({ currentLang, onToggle, languages = { ar: "AR", en: "EN" } }) {
	const [hovered, setHovered] = useState(false);

	const otherLang = useMemo(() => {
		const keys = Object.keys(languages);
		return keys.find((l) => l !== currentLang) || keys[0];
	}, [languages, currentLang]);

	return (
		<motion.button
			type="button"
			onClick={onToggle}
			aria-label="Toggle language"
			whileTap={{ scale: 0.93 }}
			onMouseEnter={() => setHovered(true)}
			onMouseLeave={() => setHovered(false)}
			className="relative flex items-center gap-2 h-9 px-3 rounded-xl overflow-hidden
        border border-slate-200
        hover:border-[#6763AF]/40
        bg-white/80 backdrop-blur-sm
        text-slate-700
        transition-all duration-300"
		>
			<AnimatePresence>
				{hovered && (
					<motion.span
						initial={{ x: "-100%" }}
						animate={{ x: "250%" }}
						exit={{ opacity: 0 }}
						transition={{ duration: 0.55, ease: "easeOut" }}
						className="absolute inset-0 pointer-events-none skew-x-12"
						style={{ background: `linear-gradient(90deg, transparent, ${BRAND}22, transparent)` }}
					/>
				)}
			</AnimatePresence>

			<motion.div
				animate={{ rotate: hovered ? 180 : 0 }}
				transition={{ duration: 0.45, ease: "easeInOut" }}
			>
				<Globe size={14} className="text-slate-500" />
			</motion.div>

			<span className="w-px h-4 bg-slate-200" />

			<AnimatePresence mode="wait">
				<motion.span
					key={otherLang}
					initial={{ y: 8, opacity: 0 }}
					animate={{ y: 0, opacity: 1 }}
					exit={{ y: -8, opacity: 0 }}
					transition={{ duration: 0.18 }}
					className="text-xs font-bold uppercase tracking-wide text-slate-700"
				>
					{otherLang}
				</motion.span>
			</AnimatePresence>
		</motion.button>
	);
}

/* ─── Navbar ─── */
function Navbar({ t, locale, switchLocale, user }) {
	const [scrolled, setScrolled] = useState(false);
	const [activeLink, setActiveLink] = useState(t("nav.home"));
	const [mobileOpen, setMobileOpen] = useState(false);
	const { scrollY } = useScroll();

	useMotionValueEvent(scrollY, "change", (v) => setScrolled(v > 30));

	// Close mobile menu on resize to desktop
	useEffect(() => {
		const onResize = () => { if (window.innerWidth >= 768) setMobileOpen(false); };
		window.addEventListener("resize", onResize);
		return () => window.removeEventListener("resize", onResize);
	}, []);

	// Lock body scroll when mobile menu is open
	useEffect(() => {
		document.body.style.overflow = mobileOpen ? "hidden" : "";
		return () => { document.body.style.overflow = ""; };
	}, [mobileOpen]);

	const navLinks = [
		t("nav.home"),
		t("nav.services"),
		t("nav.about"),
		t("nav.pricing"),
		t("nav.contact"),
	];

	const dashRoute = user ? getDashboardRoute(user.role) : null;

	// Whether the nav bg should be solid — always solid when mobile menu is open
	const solidBg = scrolled || mobileOpen;

	return (
		<>
			<motion.nav
				initial={{ opacity: 0, y: -32 }}
				animate={{ opacity: 1, y: 0 }}
				transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
				className="fixed top-0 inset-x-0 z-50"
			>
				{/* ── Bar ── */}
				<motion.div
					animate={{
						backgroundColor: solidBg ? "rgba(255,255,255,0.97)" : "rgba(255,255,255,0)",
						boxShadow: scrolled && !mobileOpen
							? "0 1px 40px rgba(103,99,175,0.10), 0 1px 0 rgba(103,99,175,0.06)"
							: "none",
					}}
					transition={{ duration: 0.35 }}
					className="w-full"
					style={{ backdropFilter: solidBg ? "blur(20px)" : "none" }}
				>
					<div className="container mx-auto px-6">
						<div className="flex items-center justify-between h-16">

							{/* Logo */}
							<motion.div
								whileHover={{ scale: 1.02 }}
								className="flex items-center gap-2.5 cursor-pointer select-none"
							>
								<div
									className="w-9 h-9 rounded-xl flex items-center justify-center shadow-md overflow-hidden relative"
									style={{
										background: `linear-gradient(135deg, ${BRAND}, #8b88c9)`,
										boxShadow: `0 4px 14px ${BRAND}44`,
									}}
								>
									<motion.div
										className="absolute inset-0 -skew-x-12"
										animate={{ x: ["-150%", "250%"] }}
										transition={{ duration: 3.5, repeat: Infinity, repeatDelay: 2, ease: "easeInOut" }}
										style={{ background: "linear-gradient(90deg, transparent, rgba(255,255,255,0.3), transparent)" }}
									/>
									<svg width="18" height="18" viewBox="0 0 24 24" fill="none" className="relative z-10">
										<path d="M21 8L12 3L3 8V16L12 21L21 16V8Z" stroke="white" strokeWidth="2" strokeLinejoin="round" />
										<path d="M12 3V21M3 8L12 13L21 8" stroke="white" strokeWidth="2" strokeLinejoin="round" />
									</svg>
								</div>
								<span className="font-extrabold text-gray-800 text-[15px] tracking-tight">
									{t("brand.name")} <span style={{ color: BRAND }}>{t("brand.suffix")}</span>
								</span>
							</motion.div>

							{/* Desktop Nav Links */}
							<div className="hidden md:flex items-center gap-1">
								{navLinks.map((link, i) => {
									const isActive = activeLink === link;
									return (
										<motion.button
											key={link}
											onClick={() => setActiveLink(link)}
											{...stagger(i)}
											whileHover={{ scale: 1.02 }}
											whileTap={{ scale: 0.98 }}
											className="relative px-4 py-2 text-[13.5px] font-medium rounded-lg transition-colors duration-200"
											style={{ color: isActive ? BRAND : "#6b7280" }}
										>
											{link}
											{isActive && (
												<motion.div
													layoutId="activeLink"
													className="absolute inset-0 rounded-lg -z-10"
													style={{ background: `${BRAND}12` }}
													transition={{ type: "spring", stiffness: 380, damping: 32 }}
												/>
											)}
										</motion.button>
									);
								})}
							</div>

							{/* Desktop Right: Lang + Auth */}
							<div className="hidden md:flex items-center gap-2.5">
								<LanguageToggle
									currentLang={locale}
									languages={{ ar: "AR", en: "EN" }}
									onToggle={() => switchLocale(locale === "ar" ? "en" : "ar")}
								/>

								{user ? (
									<Link
										href={dashRoute}
										className="relative text-[13px] font-bold px-5 py-2.5 rounded-xl text-white overflow-hidden"
										style={{
											background: `linear-gradient(135deg, ${BRAND} 0%, #8b88c9 100%)`,
											boxShadow: `0 4px 16px ${BRAND}35`,
										}}
									>
										<motion.div
											className="absolute inset-0"
											animate={{ x: ["-100%", "200%"] }}
											transition={{ duration: 2.5, repeat: Infinity, repeatDelay: 3 }}
											style={{ background: "linear-gradient(90deg, transparent, rgba(255,255,255,0.25), transparent)" }}
										/>
										<span className="relative z-10">{t("auth.dashboard")}</span>
									</Link>
								) : (
									<>
										<Link
											href="/auth?mode=signup"
											className="text-[13px] font-semibold px-5 py-2.5 rounded-xl border transition-all duration-200"
											style={{ color: BRAND, borderColor: `${BRAND}40`, background: "transparent" }}
										>
											{t("auth.signup")}
										</Link>
										<Link
											href="/auth?mode=signin"
											className="relative text-[13px] font-bold px-5 py-2.5 rounded-xl text-white overflow-hidden"
											style={{
												background: `linear-gradient(135deg, ${BRAND} 0%, #8b88c9 100%)`,
												boxShadow: `0 4px 16px ${BRAND}35`,
											}}
										>
											<motion.div
												className="absolute inset-0"
												animate={{ x: ["-100%", "200%"] }}
												transition={{ duration: 2.5, repeat: Infinity, repeatDelay: 3 }}
												style={{ background: "linear-gradient(90deg, transparent, rgba(255,255,255,0.25), transparent)" }}
											/>
											<span className="relative z-10">{t("auth.signin")}</span>
										</Link>
									</>
								)}
							</div>

							{/* Mobile: Lang + Hamburger */}
							<div className="md:hidden flex items-center gap-2">
								<LanguageToggle
									currentLang={locale}
									languages={{ ar: "AR", en: "EN" }}
									onToggle={() => switchLocale(locale === "ar" ? "en" : "ar")}
								/>
								<motion.button
									whileTap={{ scale: 0.92 }}
									onClick={() => setMobileOpen((v) => !v)}
									aria-label="Toggle menu"
									className="w-9 h-9 flex flex-col items-center justify-center gap-[5px] rounded-lg"
								>
									<motion.span
										animate={mobileOpen ? { rotate: 45, y: 7 } : { rotate: 0, y: 0 }}
										transition={{ duration: 0.25 }}
										className="block w-5 h-0.5 rounded-full origin-center"
										style={{ background: BRAND }}
									/>
									<motion.span
										animate={mobileOpen ? { opacity: 0, scaleX: 0 } : { opacity: 1, scaleX: 1 }}
										transition={{ duration: 0.2 }}
										className="block w-5 h-0.5 rounded-full"
										style={{ background: BRAND }}
									/>
									<motion.span
										animate={mobileOpen ? { rotate: -45, y: -7 } : { rotate: 0, y: 0 }}
										transition={{ duration: 0.25 }}
										className="block w-5 h-0.5 rounded-full origin-center"
										style={{ background: BRAND }}
									/>
								</motion.button>
							</div>

						</div>
					</div>

					{/* ── Mobile Menu (inside the same white bg container) ── */}
					<motion.div
						initial={false}
						animate={mobileOpen ? { height: "auto", opacity: 1 } : { height: 0, opacity: 0 }}
						transition={{ duration: 0.32, ease: [0.22, 1, 0.36, 1] }}
						className="overflow-hidden md:hidden border-t"
						style={{
							borderColor: mobileOpen ? `${BRAND}18` : "transparent",
						}}
					>
						<div
							className="container mx-auto px-6 py-4 flex flex-col gap-1"
							dir={locale === "ar" ? "rtl" : "ltr"}
						>
							{navLinks.map((link, i) => {
								const isActive = activeLink === link;
								return (
									<motion.button
										key={link}
										initial={false}
										animate={
											mobileOpen
												? { opacity: 1, x: 0 }
												: { opacity: 0, x: locale === "ar" ? 16 : -16 }
										}
										transition={{ delay: mobileOpen ? i * 0.055 : 0, duration: 0.3 }}
										onClick={() => { setActiveLink(link); setMobileOpen(false); }}
										className="text-sm rounded-xl font-medium transition-colors px-4 py-3"
										style={{
											textAlign: locale === "ar" ? "right" : "left",
											color: isActive ? BRAND : "#6b7280",
											background: isActive ? `${BRAND}10` : "transparent",
										}}
									>
										{link}
									</motion.button>
								);
							})}

							{/* Mobile Auth Buttons */}
							<div className="flex gap-2 mt-3 pt-3" style={{ borderTop: `1px solid ${BRAND}12` }}>
								{user ? (
									<Link
										href={dashRoute}
										onClick={() => setMobileOpen(false)}
										className="flex-1 text-center text-sm font-bold py-2.5 rounded-xl text-white"
										style={{ background: `linear-gradient(135deg, ${BRAND}, #8b88c9)` }}
									>
										{t("auth.dashboard")}
									</Link>
								) : (
									<>
										<Link
											href="/auth?mode=signup"
											onClick={() => setMobileOpen(false)}
											className="flex-1 text-center text-sm font-semibold py-2.5 rounded-xl border transition-colors"
											style={{ color: BRAND, borderColor: `${BRAND}40` }}
										>
											{t("auth.signup")}
										</Link>
										<Link
											href="/auth?mode=signin"
											onClick={() => setMobileOpen(false)}
											className="flex-1 text-center text-sm font-bold py-2.5 rounded-xl text-white"
											style={{ background: `linear-gradient(135deg, ${BRAND}, #8b88c9)` }}
										>
											{t("auth.signin")}
										</Link>
									</>
								)}
							</div>

							{/* Bottom padding for safe area on mobile */}
							<div className="h-2" />
						</div>
					</motion.div>
				</motion.div>
			</motion.nav>

			<div className="h-16" />
		</>
	);
}

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
					transition={{ duration: orb.dur, delay: orb.delay, repeat: Infinity, ease: "easeInOut" }}
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

	const handleSubmit = () => {
		if (email) {
			setSubmitted(true);
			setTimeout(() => setSubmitted(false), 3000);
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
				boxShadow: focused ? `0 0 0 4px ${BRAND}18, 0 8px 30px ${BRAND}22` : "0 4px 20px rgba(0,0,0,0.08)",
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
							style={{ background: "linear-gradient(90deg, transparent, rgba(255,255,255,0.25), transparent)" }}
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
		<section className="h-fit !pt-[100px] !pb-[40px] relative overflow-hidden">
			<Navbar t={t} locale={locale} switchLocale={switchLocale} user={user} />

			<span className="absolute inset-0 z-0" style={{ background: "linear-gradient(74.09deg, #BFA3DB -9.83%, #FFFFFF 58.75%)" }} />
			<div className="absolute inset-0 z-0 opacity-[0.04]" style={{ backgroundImage: `linear-gradient(${BRAND} 1px, transparent 1px), linear-gradient(90deg, ${BRAND} 1px, transparent 1px)`, backgroundSize: "60px 60px", }} />
			<FloatingOrbs />

			<div className="container mx-auto px-6 relative z-10 grid lg:grid-cols-2 gap-10 items-center py-[140px] md:py-[200px]">
				<div className="text-right">


					<motion.h1
						{...fadeUp(0.1)}
						className="text-4xl md:text-[3rem] font-extrabold text-[#111928] leading-[1.25] mb-5"
					>
						{t("hero.title1")}{" "}
						<br />
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
						transition={{ duration: 0.6, delay: 0.15, ease: [0.22, 1, 0.36, 1] }}
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
	const user = useStoredUser();

	const switchLocale = (next) => router.replace(pathname, { locale: next });

	return (
		<div className="home"  >

			<Hero t={t} heroImage={heroImage} locale={locale} switchLocale={switchLocale} user={user} />

			<ServicesSection />
			<MarqueeTextSection />
			<HowItWorksSection />
			<ShippingSection />
			<TestimonialsSection />
			<PricingSection />
			<FaqSection />
			<HeroBannerSection />
			<FooterSection />
		</div>
	);
}