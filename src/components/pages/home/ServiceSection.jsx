"use client";

import { useEffect, useRef, useState } from "react";
import { motion, useInView } from "framer-motion";
import { useTranslations, useLocale } from "next-intl";
import { ArrowLeft, ArrowRight, Package, Truck, BarChart3 } from "lucide-react";
import Link from "next/link";

const BRAND = "#6763AF";
const ease = [0.22, 1, 0.36, 1];


const CARD_ACCENT = ["#6763AF", "#AF7F63", "#6394AF"];

const ColorsBox = [
	{
		boxShadow: "0px 0px 0px 0px #00000014",
		backdropFilter: "blur(35px)",
		border: "1.5px solid #6763AF18",
		background: "#f7f5fa",
		glow: "#6763AF",
		shimmer: "linear-gradient(135deg, #6763AF08, #a78bfa06, #6763AF04)",
	},
	{
		border: "1.5px solid #AF7F6318",
		boxShadow: "0px 0px 0px 0px #00000014",
		backdropFilter: "blur(35px)",
		background: "#fff9f3",
		glow: "#AF7F63",
		shimmer: "linear-gradient(135deg, #AF7F6308, #fb923c06, #AF7F6304)",
	},
	{
		border: "1.5px solid #6394AF22",
		boxShadow: "0px 0px 0px 0px #00000014",
		backdropFilter: "blur(35px)",
		background: "#f3fcff",
		glow: "#6394AF",
		shimmer: "linear-gradient(135deg, #6394AF08, #60a5fa06, #6394AF04)",
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
	const accent = CARD_ACCENT[index];
	const box = ColorsBox[index];



	return (
		<motion.div
			initial={{ opacity: 0, y: 60, scale: 0.96 }}
			animate={inView ? { opacity: 1, y: 0, scale: 1 } : {}}
			transition={{ duration: 0.7, delay: 0.15 + index * 0.18, ease }}
			whileHover={{ y: -6, boxShadow: `0 32px 70px ${accent}18, 0 8px 24px ${accent}0e` }}
			className="relative rounded-xl p-4 sm:p-6 overflow-hidden flex flex-col lg:flex-row items-center lg:items-stretch transition-all duration-500 max-w-[1200px] mx-auto w-full"
			style={{
				minHeight: 270,
				background: box.background,
				border: box.border,
				backdropFilter: box.backdropFilter,
				boxShadow: `0 2px 20px ${accent}0a`,
			}}
		>
			{/* ── animated shimmer mesh background ── */}
			<motion.div
				animate={{ opacity: [0.4, 0.75, 0.4] }}
				transition={{ duration: 6 + index, repeat: Infinity, ease: "easeInOut" }}
				className="absolute inset-0 pointer-events-none"
				style={{ background: box.shimmer }}
			/>


			{/* ── left accent bar ── */}
			<motion.div
				initial={{ scaleY: 0 }}
				animate={inView ? { scaleY: 1 } : {}}
				transition={{ delay: 0.4 + index * 0.18, duration: 0.6 }}
				className="absolute top-8 bottom-8  w-[3px] rounded-full"
				style={{
					[isRtl ? "right" : "left"]: 0,
					background: `linear-gradient(to bottom, transparent, ${accent}, transparent)`,
					transformOrigin: "top",
				}}
			/>

			{/* ── TEXT SIDE ── */}
			<div
				className="flex flex-col justify-center p-4 sm:p-8 flex-1 relative z-10"
				style={{ textAlign: isRtl ? "right" : "left" }}
			>


				{/* title */}
				<motion.h3
					initial={{ opacity: 0, x: isRtl ? -20 : 20 }}
					animate={inView ? { opacity: 1, x: 0 } : {}}
					transition={{ delay: 0.3 + index * 0.18, duration: 0.55, ease }}
					className="font-extrabold text-gray-800 leading-snug mb-3 text-2xl sm:text-3xl lg:text-3xl"
					dangerouslySetInnerHTML={{ __html: item.title }}
				/>

				{/* desc */}
				<motion.p
					initial={{ opacity: 0, y: 8 }}
					animate={inView ? { opacity: 1, y: 0 } : {}}
					transition={{ delay: 0.4 + index * 0.18 }}
					className="text-gray-500 leading-relaxed mb-6 text-base sm:text-lg max-w-sm"
				>
					{item.desc}
				</motion.p>

				{/* CTA */}
				<Link href="/auth?mode=signup" passHref legacyBehavior>
					<motion.button
						initial={{ opacity: 0, y: 10 }}
						animate={inView ? { opacity: 1, y: 0 } : {}}
						transition={{ delay: 0.5 + index * 0.18 }}
						whileHover={{ scale: 1.04, x: isRtl ? -4 : 4 }}
						whileTap={{ scale: 0.97 }}
						className="inline-flex items-center gap-2 text-white font-bold rounded-xl relative overflow-hidden w-fit"
						style={{
							padding: "10px 22px",
							fontSize: 13,
							background: `linear-gradient(135deg, ${accent}, ${accent}cc)`,
							boxShadow: `0 4px 20px ${accent}35`,
						}}
					>
						{/* shimmer sweep */}
						<motion.div
							className="absolute inset-0"
							animate={{ x: ["-100%", "220%"] }}
							transition={{ duration: 2.6, repeat: Infinity, repeatDelay: 2.2 }}
							style={{ background: "linear-gradient(90deg,transparent,rgba(255,255,255,0.32),transparent)", width: "55%" }}
						/>
						<span className="relative z-10">{item.cta}</span>
						<Arrow size={16} className="relative z-10" />
					</motion.button>
				</Link>
			</div>

			{/* ── IMAGE SIDE ── */}
			<motion.div
				initial={{ opacity: 0, x: isRtl ? 30 : -30 }}
				animate={inView ? { opacity: 1, x: 0 } : {}}
				transition={{ duration: 0.65, delay: 0.22 + index * 0.18, ease }}
				className="relative max-w-[300px] sm:max-w-[360px] w-full overflow-hidden mt-6 lg:mt-0"

			>
				{/* image */}
				<motion.img
					src={img}
					alt={item.title}
					initial={{ scale: 1.08 }}
					animate={inView ? { scale: 1 } : {}}
					transition={{ duration: 0.9, delay: 0.3 + index * 0.18, ease }}
					whileHover={{ scale: 1.04 }}
					style={{ width: "100%", height: "100%", objectFit: "contain", display: "block", transition: "transform 0.5s" }}
					onError={e => { e.currentTarget.style.display = "none"; }}
				/>



				{/* decorative accent line at image edge */}
				<motion.div
					initial={{ scaleY: 0 }}
					animate={inView ? { scaleY: 1 } : {}}
					transition={{ delay: 0.55 + index * 0.18, duration: 0.5 }}
					className="absolute top-0 bottom-0 w-[2px]"
					style={{
						[isRtl ? "right" : "left"]: 0,
						background: `linear-gradient(to bottom, transparent, ${accent}60, transparent)`,
						transformOrigin: "top",
					}}
				/>
			</motion.div>
		</motion.div>
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

function FloatingBadge({ badge, inView, isMobile }) {
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
				className="flex items-center gap-2 md:gap-2.5 px-3 py-2 md:px-4 md:py-2.5 rounded-xl"
				style={{
					backdropFilter: "blur(12px)",
					background: "rgba(255,255,255,0.85)",
					border: "1px solid rgba(255,255,255,0.9)",
					boxShadow:
						"0 6px 20px rgba(0,0,0,0.08), 0 1px 4px rgba(0,0,0,0.05)",
					direction: "rtl",
					whiteSpace: isMobile ? "normal" : "nowrap",
					maxWidth: isMobile ? "100%" : 420,
				}}
			>
				{/* icon */}
				<div
					className="flex-shrink-0"
					style={{
						width: isMobile ? 26 : 36,
						height: isMobile ? 26 : 36,
					}}
				>
					<img
						src={badge.emoji}
						className="w-full h-full object-contain"
					/>
				</div>

				{/* text */}
				<span
					style={{
						fontSize: isMobile ? 12 : 13,
						fontWeight: 700,
						color: "#1e1b4b",
						fontFamily: "'Cairo','Tajawal',sans-serif",
						lineHeight: 1.4,
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