"use client";
import { Link } from "@/i18n/navigation";
import { motion, useScroll, useMotionValueEvent } from "framer-motion";
import { useState, useEffect, useRef } from "react";

const BRAND = "#6763AF";

/* ─── tiny helpers ─── */
const fadeUp = (delay = 0) => ({
	initial: { opacity: 0, y: 32 },
	animate: { opacity: 1, y: 0 },
	transition: { duration: 0.72, delay, ease: [0.22, 1, 0.36, 1] },
});




const navLinks = ["الرئيسية", "الخدمات", "عن المنصة", "الاسعار", "تواصل معانا"];

function Navbar() {
	const [scrolled, setScrolled] = useState(false);
	const [activeLink, setActiveLink] = useState("الرئيسية");
	const [mobileOpen, setMobileOpen] = useState(false);
	const { scrollY } = useScroll();

	useMotionValueEvent(scrollY, "change", (v) => setScrolled(v > 30));

	return (
		<>
			<motion.nav
				initial={{ opacity: 0, y: -32 }}
				animate={{ opacity: 1, y: 0 }}
				transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
				className="fixed top-0 inset-x-0 z-50"
			>
				{/* Glassmorphism bar */}
				<motion.div
					animate={{
						backgroundColor: scrolled ? "rgba(255,255,255,0.97)" : "",
						boxShadow: scrolled
							? "0 1px 40px rgba(103,99,175,0.10), 0 1px 0 rgba(103,99,175,0.06)"
							: "none",
						backdropFilter: scrolled ? "blur(20px)" : "",
					}}
					transition={{ duration: 0.4 }}
					className="w-full"
				>
					<div className="container  ">
						<div className="flex items-center justify-between h-16">

							{/* ── Logo ── */}
							<motion.div
								whileHover={{ scale: 1.02 }}
								className="flex items-center gap-2.5 cursor-pointer select-none"
							>
								<div
									className="w-9 h-9 rounded-xl flex items-center justify-center shadow-md"
									style={{
										background: `linear-gradient(135deg, ${BRAND}, #8b88c9)`,
										boxShadow: `0 4px 14px ${BRAND}44`,
									}}
								>
									<svg width="18" height="18" viewBox="0 0 24 24" fill="none">
										<path d="M21 8L12 3L3 8V16L12 21L21 16V8Z" stroke="white" strokeWidth="2" strokeLinejoin="round" />
										<path d="M12 3V21M3 8L12 13L21 8" stroke="white" strokeWidth="2" strokeLinejoin="round" />
									</svg>
								</div>
								<span className="font-extrabold text-gray-800 text-[15px] tracking-tight">
									طلباتي <span style={{ color: BRAND }}>تك</span>
								</span>
							</motion.div>

							{/* ── Nav Links ── */}
							<div className="hidden md:flex items-center gap-1">
								{navLinks.map((link) => {
									const isActive = activeLink === link;
									return (
										<motion.button
											key={link}
											onClick={() => setActiveLink(link)}
											whileHover={{ scale: 1.02 }}
											whileTap={{ scale: 0.98 }}
											className="relative px-4 py-2 text-[13.5px] font-medium rounded-lg transition-colors duration-200"
											style={{ color: isActive ? BRAND : "#6b7280" }}
										>
											{link}
											{/* Active underline pill */}
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

							{/* ── Auth Buttons ── */}
							<div className="hidden md:flex items-center gap-2.5">
								<Link href="/auth?mode=signup"
									className="text-[13px] font-semibold px-5 py-2.5 rounded-xl border transition-all duration-200"
									style={{
										color: BRAND,
										borderColor: `${BRAND}40`,
										background: "transparent",
									}}
								>
									حساب جديد
								</Link>

								<Link
									href="/auth?mode=signin"
									className="text-[13px] font-bold px-5 py-2.5 rounded-xl text-white relative overflow-hidden"
									style={{
										background: `linear-gradient(135deg, ${BRAND} 0%, #8b88c9 100%)`,
										boxShadow: `0 4px 16px ${BRAND}35`,
									}}
								>
									{/* Shimmer effect */}
									<motion.div
										className="absolute inset-0 -translate-x-full"
										animate={{ translateX: ["−100%", "200%"] }}
										transition={{ duration: 2.5, repeat: Infinity, repeatDelay: 3 }}
										style={{
											background:
												"linear-gradient(90deg, transparent, rgba(255,255,255,0.25), transparent)",
										}}
									/>
									تسجيل دخول
								</Link>
							</div>

							{/* ── Mobile hamburger ── */}
							<motion.button
								whileTap={{ scale: 0.92 }}
								onClick={() => setMobileOpen((v) => !v)}
								className="md:hidden w-9 h-9 flex flex-col items-center justify-center gap-1.5 rounded-lg"
								style={{ color: BRAND }}
							>
								<motion.span
									animate={mobileOpen ? { rotate: 45, y: 6 } : { rotate: 0, y: 0 }}
									className="block w-5 h-0.5 rounded-full origin-center"
									style={{ background: BRAND }}
								/>
								<motion.span
									animate={mobileOpen ? { opacity: 0, scaleX: 0 } : { opacity: 1, scaleX: 1 }}
									className="block w-5 h-0.5 rounded-full"
									style={{ background: BRAND }}
								/>
								<motion.span
									animate={mobileOpen ? { rotate: -45, y: -6 } : { rotate: 0, y: 0 }}
									className="block w-5 h-0.5 rounded-full origin-center"
									style={{ background: BRAND }}
								/>
							</motion.button>
						</div>
					</div>
				</motion.div>

				{/* ── Mobile Menu ── */}
				<motion.div
					initial={false}
					animate={mobileOpen ? { height: "auto", opacity: 1 } : { height: 0, opacity: 0 }}
					transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
					className="overflow-hidden md:hidden"
					style={{ background: "rgba(255,255,255,0.98)", backdropFilter: "blur(20px)" }}
				>
					<div className="max-w-6xl mx-auto px-6 py-4 flex flex-col gap-1" dir="rtl">
						{navLinks.map((link, i) => (
							<motion.button
								key={link}
								initial={{ opacity: 0, x: 20 }}
								animate={mobileOpen ? { opacity: 1, x: 0 } : { opacity: 0, x: 20 }}
								transition={{ delay: i * 0.06 }}
								onClick={() => { setActiveLink(link); setMobileOpen(false); }}
								className="text-right px-4 py-2.5 text-sm rounded-lg font-medium transition-colors"
								style={{
									color: activeLink === link ? BRAND : "#6b7280",
									background: activeLink === link ? `${BRAND}10` : "transparent",
								}}
							>
								{link}
							</motion.button>
						))}
						<div className="flex gap-2 mt-3 pt-3 border-t border-gray-100">
							<Link
								href="/auth?mode=signup"
								className="flex-1 text-sm font-semibold py-2.5 rounded-xl border"
								style={{ color: BRAND, borderColor: `${BRAND}40` }}
							>
								حساب جديد
							</Link>
							<Link
								href="/auth?mode=signin"
								className="flex-1 text-sm font-bold py-2.5 rounded-xl text-white"
								style={{ background: `linear-gradient(135deg, ${BRAND}, #8b88c9)` }}
							>
								تسجيل دخول
							</Link>
						</div>
					</div>
				</motion.div>
			</motion.nav>

			{/* Spacer */}
			<div className="h-16" />
		</>
	);
}


function CTAInput() {
	const [email, setEmail] = useState("");
	const [focused, setFocused] = useState(false);

	return (
		<motion.div
			initial={{ opacity: 0, y: 20 }}
			animate={{ opacity: 1, y: 0 }}
			transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
			className="flex relative items-center w-full max-w-[470px] bg-white rounded-full shadow-lg overflow-hidden"
			style={{
				border: `1.5px solid ${focused ? BRAND : "#e5e3f5"}`,
				transition: "border-color 0.25s",
				padding: "5px 5px 5px 5px",
			}}
		>

			<motion.button
				whileHover={{ scale: 1.03, boxShadow: `0 6px 24px ${BRAND}55` }}
				whileTap={{ scale: 0.97 }}
				className=" absolute ltr:right-[10px] rtl:left-[10px] whitespace-nowrap text-white font-bold text-sm px-6 py-3 rounded-full flex-shrink-0 transition-all"
				style={{ background: BRAND }}
			>
				جرّب المنصة الآن
			</motion.button>

			<input
				type="email"
				value={email}
				onChange={(e) => setEmail(e.target.value)}
				onFocus={() => setFocused(true)}
				onBlur={() => setFocused(false)}
				placeholder="أدخل بريدك الالكتروني"
				className="flex-1 h-[55px] bg-transparent !outline-none text-base  px-4 text-gray-500 placeholder-gray-400"
			/>
		</motion.div>
	);
}

function Hero() {

	return (
		<section className=" h-fit relative " >
			<span className="  absolute inset-0 z-[-1]  " style={{ background: "linear-gradient(74.09deg, #BFA3DB -9.83%, #FFFFFF 58.75%)" }} ></span>

			<div className="container  grid lg:grid-cols-2 gap-10 items-center !py-[200px]   ">
				<div className=" text-right">
					<motion.h1
						{...fadeUp(0.1)}
						className="text-4xl md:text-[3rem] font-extrabold text-[#111928] leading-[1.25] mb-5"
					>
						كل ما تحتاجه للبيع والتوسع…{" "}
						<br />
						<span style={{ color: BRAND }}>في منصة واحدة.</span>
					</motion.h1>

					<motion.p
						{...fadeUp(0.22)}
						className="  font-[600] text-[#25456F] text-[1.5rem] leading-relaxed my-12 block "
					>
						نوفّر لك تخزين المنتجات، التغليف، والشحن لأي مكان، مع مدفوعات آمنة وتسليم
						سريع، عبر مراكز تنفيذ في الإمارات والسعودية وعُمان، لمساعدتك على بناء
						علامة تجارية قوية قابلة للنمو.
					</motion.p>

					{/* CTA row */}
					<CTAInput />


					{/* Sub-text */}
					<motion.p
						initial={{ opacity: 0, y: 10 }}
						animate={{ opacity: 1, y: 0 }}
						transition={{ duration: 0.6, delay: 0.15, ease: [0.22, 1, 0.36, 1] }}
						className="flex items-center gap-2 font-[600] mt-4 text-[1.3rem] text-[#25456F] "
						style={{ fontFamily: "Cairo, sans-serif" }}
					>
						30 يوم تجربة مجانية، بدون كارت أو التزام
						<span className="text-base">💳</span>
					</motion.p>
				</div>

				<motion.img
					src={"landing/hero.png"}
					alt="Dashboard preview"
					initial={{ opacity: 0, y: 40, scale: 0.97 }}
					animate={{ opacity: 1, y: 0, scale: 1 }}
					transition={{ duration: 0.85, delay: 0.3, ease: [0.22, 1, 0.36, 1] }}
				/>
			</div>
		</section>
	);
}

/* ─── Root export ─── */
export default function TalbatiHero({ heroImage }) {
	return (
		<>
			<div className=" " >
				<Navbar />
				<Hero heroImage={heroImage} />
			</div>
		</>
	);
}