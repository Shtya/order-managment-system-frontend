"use client";

import { useEffect, useRef, useState } from "react";
import { motion, useInView } from "framer-motion";
import { useTranslations, useLocale } from "next-intl";
import { ArrowLeft, ArrowRight, Package, Truck, BarChart3 } from "lucide-react";
import Link from "next/link";

const BRAND = "#6763AF";
const ease = [0.22, 1, 0.36, 1];


/* Theme palette from preview (2).html — purple / orange / green */
const THEMES = [
	{
		border: "#e7e4f6",
		bg: "linear-gradient(135deg, #ffffff 0%, #faf9fe 100%)",
		hoverBorder: "#d8d3f1",
		hoverShadow: "0 14px 38px rgba(103, 99, 175, 0.07)",
		icon: Package,
		iconColor: "#6763AF",
		iconBg: "#f0effa",
		iconBorder: "#e0dcf5",
		accent: "#6763AF",
		btnColor: "#6763AF",
		btnBorder: "#d3cdf1",
		btnHover: "#6763AF",
	},
	{
		border: "#f8eadc",
		bg: "linear-gradient(135deg, #ffffff 0%, #fffdfb 100%)",
		hoverBorder: "#f1d8c0",
		hoverShadow: "0 14px 38px rgba(210, 126, 55, 0.07)",
		icon: Truck,
		iconColor: "#c9824c",
		iconBg: "#fff7ef",
		iconBorder: "#f6e4d2",
		accent: "#c9824c",
		btnColor: "#b96e38",
		btnBorder: "#efd6bf",
		btnHover: "#c9824c",
	},
	{
		border: "#e0f2ea",
		bg: "linear-gradient(135deg, #ffffff 0%, #fbfefc 100%)",
		hoverBorder: "#cfeade",
		hoverShadow: "0 14px 38px rgba(45, 160, 110, 0.07)",
		icon: BarChart3,
		iconColor: "#3fa37b",
		iconBg: "#f0faf5",
		iconBorder: "#dcefe6",
		accent: "#3fa37b",
		btnColor: "#328c68",
		btnBorder: "#cfe9dc",
		btnHover: "#3fa37b",
	},
];

/* ── decorative corner bracket ── */
function CornerBracket({ position, color }) {
	const styles = {
		"top-left": { top: 12, left: 12, borderTop: `2px solid ${color}40`, borderLeft: `2px solid ${color}40` },
		"top-right": { top: 12, right: 12, borderTop: `2px solid ${color}40`, borderRight: `2px solid ${color}40` },
		"bottom-left": { bottom: 12, left: 12, borderBottom: `2px solid ${color}40`, borderLeft: `2px solid ${color}40` },
		"bottom-right": { bottom: 12, right: 12, borderBottom: `2px solid ${color}40`, borderRight: `2px solid ${color}40` },
	};
	return (
		<div
			className="absolute pointer-events-none"
			style={{ width: 18, height: 18, ...styles[position] }}
		/>
	);
}

/* ── stat pill that floats over the image ── */
function StatPill({ value, label, delay, accent, position }) {
	return (
		<motion.div
			initial={{ opacity: 0, scale: 0.6, y: 10 }}
			animate={{ opacity: 1, scale: 1, y: 0 }}
			transition={{ delay, type: "spring", stiffness: 220, damping: 18 }}
			className="absolute flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl"
			style={{
				...position,
				background: "rgba(255,255,255,0.92)",
				backdropFilter: "blur(12px)",
				border: `1px solid ${accent}22`,
				boxShadow: `0 4px 20px rgba(0,0,0,0.08), 0 0 0 1px ${accent}15`,
				zIndex: 10,
			}}
		>
			<motion.div
				animate={{ scale: [1, 1.2, 1], opacity: [0.4, 0.8, 0.4] }}
				transition={{ duration: 2.5, repeat: Infinity, delay: delay * 0.5 }}
				className="w-2 h-2 rounded-full flex-shrink-0"
				style={{ background: accent }}
			/>
			<span className="text-[11px] font-bold" style={{ color: accent }}>{value}</span>
			<span className="text-[10px] text-gray-400 font-medium">{label}</span>
		</motion.div>
	);
}

/* ════════ SERVICE CARD ════════ */
function ServiceCard({ item, index, inView, isRtl, img }) {
	const Arrow = isRtl ? ArrowLeft : ArrowRight;
	const theme = THEMES[index % THEMES.length];
	const Icon = theme.icon;
	const reversed = index % 2 === 0;

	return (
		<motion.article
			initial={{ opacity: 0, y: 40 }}
			animate={inView ? { opacity: 1, y: 0 } : {}}
			transition={{ duration: 0.7, delay: 0.15 + index * 0.18, ease }}
			whileHover={{ borderColor: theme.hoverBorder, boxShadow: theme.hoverShadow }}
			className="relative grid grid-cols-1 lg:grid-cols-2 items-center gap-8 lg:gap-[60px] rounded-[22px] bg-white border p-6 lg:p-[28px_42px] overflow-hidden transition-[border-color,box-shadow] duration-300 max-w-[1200px] mx-auto w-full"
			style={{
				borderColor: theme.border,
				background: theme.bg,
				boxShadow: "0 8px 30px rgba(74, 48, 150, 0.035)",
				"--btn-hover": theme.btnHover,
				"--btn-color": theme.btnColor,
			}}
		>
			{/* ── CONTENT SIDE ── */}
			<motion.div
				initial={{ opacity: 0, y: 8 }}
				animate={inView ? { opacity: 1, y: 0 } : {}}
				transition={{ delay: 0.3 + index * 0.18, duration: 0.55, ease }}
				className={`flex flex-col justify-center ${reversed ? "lg:order-2" : "lg:order-1"}`}
				style={{ textAlign: isRtl ? "right" : "left" }}
			>
				{/* feature icon */}
				<motion.div
					initial={{ scale: 0.6, opacity: 0 }}
					animate={inView ? { scale: 1, opacity: 1 } : {}}
					transition={{ delay: 0.4 + index * 0.18, type: "spring", stiffness: 220, damping: 18 }}
					className="w-[58px] h-[58px] flex items-center justify-center rounded-[15px] mb-[18px]"
					style={{ color: theme.iconColor, background: theme.iconBg, border: `1px solid ${theme.iconBorder}` }}
				>
					<Icon size={27} strokeWidth={2} />
				</motion.div>

				{/* title */}
				<motion.h3
					initial={{ opacity: 0, x: isRtl ? -20 : 20 }}
					animate={inView ? { opacity: 1, x: 0 } : {}}
					transition={{ delay: 0.3 + index * 0.18, duration: 0.55, ease }}
					className="font-extrabold leading-[1.4] mb-[14px] text-[#18233a] text-[clamp(25px,3vw,36px)]"
					dangerouslySetInnerHTML={{ __html: item.title }}
				/>

				{/* desc */}
				<motion.p
					initial={{ opacity: 0, y: 8 }}
					animate={inView ? { opacity: 1, y: 0 } : {}}
					transition={{ delay: 0.4 + index * 0.18 }}
					className="text-[#697286] text-base leading-[2] max-w-[500px] mb-6"
				>
					{item.desc}
				</motion.p>

				{/* CTA pill */}
				<Link href="/auth?mode=signup" passHref legacyBehavior>
					<motion.button
						initial={{ opacity: 0, y: 10 }}
						animate={inView ? { opacity: 1, y: 0 } : {}}
						transition={{ delay: 0.5 + index * 0.18 }}
						whileHover={{ scale: 1.04 }}
						whileTap={{ scale: 0.97 }}
						className="self-start inline-flex items-center gap-[10px] px-[22px] py-[10px] rounded-full bg-white font-bold text-[14px] text-[var(--btn-color)] transition-colors duration-200 hover:bg-[var(--btn-hover)] hover:text-white"
						style={{ border: `1px solid ${theme.btnBorder}` }}
					>
						<span>{item.cta}</span>
						<Arrow size={16} />
					</motion.button>
				</Link>
			</motion.div>

			{/* ── IMAGE SIDE ── */}
			<motion.div
				initial={{ opacity: 0, x: isRtl ? 30 : -30 }}
				animate={inView ? { opacity: 1, x: 0 } : {}}
				transition={{ duration: 0.65, delay: 0.22 + index * 0.18, ease }}
				className={`relative w-full flex items-center justify-center ${reversed ? "lg:order-1" : "lg:order-2"}`}
			>
				<motion.img
					src={img}
					alt={item.title}
					initial={{ scale: 1.08 }}
					animate={inView ? { scale: 1 } : {}}
					transition={{ duration: 0.9, delay: 0.3 + index * 0.18, ease }}
					whileHover={{ scale: 1.04 }}
					className="w-full h-auto object-contain max-w-[540px]"
					onError={(e) => { e.currentTarget.style.display = "none"; }}
				/>
			</motion.div>
		</motion.article>
	);
}

/* ════════ ROOT EXPORT ════════ */

function useIsMobile() {
	const [isMobile, setIsMobile] = useState(false);


	useEffect(() => {
		const check = () => setIsMobile(window.innerWidth < 768);
		check();
		window.addEventListener("resize", check);
		return () => window.removeEventListener("resize", check);
	}, []);

	return isMobile;
}


export function FloatingBadge({ badge, inView, isMobile }) {
  const shouldAnimate = !isMobile;

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.6, y: 20 }}
      animate={inView ? { opacity: 1, scale: 1, y: 0 } : {}}
      transition={{
        delay: badge.delay,
        duration: 0.5,
        type: "spring",
        stiffness: 160,
        damping: 18,
      }}
      style={{
        position: isMobile ? "relative" : "absolute",
        ...(isMobile ? {} : badge.position),
        zIndex: 10,
        width: isMobile ? "100%" : "auto",
      }}
    >
      <motion.div
        animate={shouldAnimate ? { y: badge.floatY } : { y: 0 }}
        transition={
          shouldAnimate
            ? {
                duration: badge.floatDur,
                repeat: Infinity,
                repeatType: "mirror",
                ease: "easeInOut",
              }
            : {}
        }
        dir="rtl"
        className={`
          flex items-center backdrop-blur-md bg-white/85 border border-white/90
          
          /* Mobile Padding & Radius */
          px-3 py-2 rounded-xl gap-2
          
          /* Non-Mobile Responsive Padding & Gaps */
          md:px-2 md:py-1 md:gap-1.5 md:rounded-lg
          lg:px-2.5 lg:py-1.5 lg:gap-2 lg:rounded-xl
          xl:px-3 xl:py-2 xl:gap-2
          2xl:px-4 2xl:py-2.5 2xl:gap-2.5
          3xl:px-5 3xl:py-3 3xl:gap-3
          
          /* Responsive Max-Width & Whitespace */
          ${
            isMobile
              ? "w-full max-w-full whitespace-normal"
              : "w-auto whitespace-nowrap md:max-w-[220px] lg:max-w-[280px] xl:max-w-[340px] 2xl:max-w-[400px] 3xl:max-w-[480px]"
          }
        `}
        style={{
          boxShadow:
            "0 6px 20px rgba(0,0,0,0.08), 0 1px 4px rgba(0,0,0,0.05)",
        }}
      >
        {/* Responsive Icon Container */}
        <div
          className="
            flex-shrink-0
            w-6 h-6
            md:w-4 md:h-4
            lg:w-5 lg:h-5
            xl:w-6 xl:h-6
            2xl:w-7 2xl:h-7
            3xl:w-9 3xl:h-9
          "
        >
          <img
            src={badge.emoji}
            alt=""
            className="w-full h-full object-contain"
          />
        </div>

        {/* Responsive Text */}
        <span
          className="
            font-bold text-[#1e1b4b] leading-snug
            text-xs
            md:text-[10px]
            lg:text-[11px]
            xl:text-xs
            2xl:text-[13px]
            3xl:text-base
          "
          style={{
            fontFamily: "'Cairo','Tajawal',sans-serif",
          }}
        >
          {badge.text}
        </span>
      </motion.div>
    </motion.div>
  );
}

export default function ServicesSection() {
	const t = useTranslations("servicesSection");
	const locale = useLocale();
	const isRtl = locale === "ar";
	const isMobile = useIsMobile();
	const badges = t.raw("badges");
	const BADGES_DATA = [
		{
			emoji: "landing/icon-1.png",
			text: badges[0],
			position: { bottom: "8%", right: "2%" },
			delay: 0.2,
			floatY: [-4, 4],
			floatDur: 3.8,
			accent: "#fbbf24",
		},
		{
			emoji: "landing/icon-2.png",
			text: badges[1],
			position: { bottom: "28%", left: "40%", transform: "translateX(-50%)" },
			delay: 0.45,
			floatY: [-5, 3],
			floatDur: 4.2,
			accent: "#a78bfa",
		},
		{
			emoji: "landing/icon-3.png",
			text: badges[2],
			position: { bottom: "8%", left: "2%" },
			delay: 0.65,
			floatY: [-3, 5],
			floatDur: 3.5,
			accent: "#34d399",
		},
	];
	const visibleBadges = isMobile
		? BADGES_DATA.slice(0, 2)
		: BADGES_DATA;
	const ref = useRef(null);
	const inView = useInView(ref, { once: true, margin: "-60px" });

	const cards = t.raw("services.cards");
	const cardsImg = ["landing/box-1.png", "landing/box-2.png", "landing/box-3.png"]



	return (
		<section
			ref={ref}
			className="relative py-16 overflow-hidden"
			style={{ background: "linear-gradient(180deg,#f8f7ff 0%,#ffffff 100%)" }}
			dir={isRtl ? "rtl" : "ltr"}
		>
			{/* ambient orb */}
			<motion.div
				animate={{ x: [0, 20, 0], y: [0, -14, 0] }}
				transition={{ duration: 14, repeat: Infinity, ease: "easeInOut" }}
				className="absolute top-0 left-1/4 w-96 h-96 rounded-full pointer-events-none"
				style={{ background: `radial-gradient(circle,${BRAND}0e 0%,transparent 70%)`, filter: "blur(50px)" }}
			/>

			<div className="container mx-auto px-5">

				{/* ── 1. Dashboard mockup (full width) ── */}
				<div className="relative" style={{ paddingBottom: "80px" }}>

					{/* dashboard screenshot */}
					<motion.div
						initial={{ opacity: 0, y: 30, scale: 0.97 }}
						animate={inView ? { opacity: 1, y: 0, scale: 1 } : {}}
						transition={{ duration: 0.75, ease: [0.22, 1, 0.36, 1] }}
						className="relative"
						style={{
							maxWidth: 1000,
							margin: "0 auto",
							borderRadius: 20,
							overflow: "hidden",
							boxShadow: "0 32px 80px rgba(103,99,175,0.18), 0 8px 24px rgba(0,0,0,0.08)",
						}}
					>
						{/* subtle glow behind image */}
						<div
							style={{
								position: "absolute", inset: 0, pointerEvents: "none", zIndex: 1,
								background: "linear-gradient(180deg, transparent 60%, rgba(103,99,175,0.06) 100%)",
							}}
						/>
						<img
							className="w-full block"
							src="landing/dashboard-screen.png"
							alt="Dashboard preview"
							style={{ display: "block" }}
						/>
					</motion.div>

					{!isMobile &&
						visibleBadges.map((badge, i) => (
							<FloatingBadge
								key={i}
								badge={badge}
								inView={inView}
								isMobile={false}
							/>
						))}

					{/* Mobile List */}
					{isMobile && (
						<div className="mt-4 flex flex-col gap-2 px-2">
							{visibleBadges.map((badge, i) => (
								<FloatingBadge
									key={i}
									badge={badge}
									inView={inView}
									isMobile={true}
								/>
							))}
						</div>
					)}

				</div>

				{/* ── 2. Section heading ── */}
				<div className="mb-[50px] text-center mt-[100px]">
					<motion.h2
						initial={{ opacity: 0, y: 24 }}
						animate={inView ? { opacity: 1, y: 0 } : {}}
						transition={{ duration: 0.7, ease }}
						className="text-3xl md:text-[2.1rem] font-extrabold text-gray-900 leading-snug"
						style={{ fontFamily: "'Cairo','Tajawal',sans-serif" }}
					>
						{t("header.title")}{" "}
						<motion.span
							initial={{ opacity: 0, scale: 0.85 }}
							animate={inView ? { opacity: 1, scale: 1 } : {}}
							transition={{ delay: 0.3, type: "spring", stiffness: 260 }}
							className="inline-block px-5 py-1 rounded-xl"
							style={{ background: `${BRAND}16`, color: BRAND }}
						>
							{t("header.highlight")}
						</motion.span>
					</motion.h2>

					<motion.p
						initial={{ opacity: 0, y: 12 }}
						animate={inView ? { opacity: 1, y: 0 } : {}}
						transition={{ delay: 0.22 }}
						className="text-xl text-gray-500 mt-4"
					>
						{t("header.subtitle")}
					</motion.p>
				</div>



				{/* ── 3. Service cards (single column) ── */}
				<div className="flex flex-col gap-8">
					{cards.map((card, i) => (
						<ServiceCard key={i} img={cardsImg[i]} item={card} index={i} inView={inView} isRtl={isRtl} />
					))}
				</div>

			</div>
		</section>
	);
}