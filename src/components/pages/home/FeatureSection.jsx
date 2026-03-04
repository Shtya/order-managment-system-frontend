"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { motion, useInView, AnimatePresence } from "framer-motion";
import { useTranslations, useLocale } from "next-intl";
import {
	Warehouse,
	BarChart3,
	RefreshCcw,
	Package,
	Users, 
} from "lucide-react";

const BRAND = "#6763AF";

const PILL_ICONS = [Warehouse, BarChart3, RefreshCcw, Package, Users];
const PILL_COLORS = ["#a78bfa", "#f472b6", "#34d399", "#fb923c", "#60a5fa"];
const BENEFIT_ICONS = ["landing/hero-icon-1.png", "landing/hero-icon-2.png", "landing/hero-icon-3.png", "landing/hero-icon-4.png"];

/* scattered offsets so pills look organic */
const PILL_OFFSETS = [
	{ alignSelf: "flex-end", mr: 24, ml: 0 },
	{ alignSelf: "flex-start", mr: 0, ml: 16 },
	{ alignSelf: "flex-end", mr: 44, ml: 0 },
	{ alignSelf: "flex-start", mr: 0, ml: 28 },
	{ alignSelf: "flex-end", mr: 12, ml: 0 },
];

/* ════════ PILL ════════ */
function Pill({ label, index, color, inView }) {
	const Icon = PILL_ICONS[index];
	const off = PILL_OFFSETS[index];

	return (
		<motion.div
			initial={{ opacity: 0, y: -130, rotate: index % 2 === 0 ? -24 : 24, scale: 0.3 }}
			animate={inView ? { opacity: 1, y: 0, rotate: 0, scale: 1 } : {}}
			transition={{ type: "spring", stiffness: 48, damping: 13, delay: 0.1 + index * 0.18, }}
			whileHover={{ scale: 1.08, y: -4, transition: { type: "spring", stiffness: 440 } }}
			style={{ alignSelf: off.alignSelf, marginRight: off.mr, marginLeft: off.ml, position: "relative" }}
			className="flex items-center gap-2 px-3 py-1.5 rounded-2xl cursor-default select-none w-fit"
		>
			{/* glass body */}
			<div
				className="absolute inset-0 rounded-2xl"
				style={{
					background: "rgba(255,255,255,0.07)",
					border: "1px solid rgba(255,255,255,0.15)",
					backdropFilter: "blur(14px)",
					boxShadow: "0 8px 28px rgba(0,0,0,0.3), inset 0 1px 0 rgba(255,255,255,0.1)",
				}}
			/>
			<div className="relative flex items-center gap-2">
				{/* glow icon */}
				<div
					className="relative w-6 h-6 rounded-lg flex items-center justify-center flex-shrink-0"
					style={{ background: `${color}20` }}
				>
					<motion.div
						className="absolute inset-0 rounded-lg"
						animate={{ opacity: [0.3, 0.65, 0.3] }}
						transition={{ duration: 2.4, repeat: Infinity, delay: index * 0.3 }}
						style={{ background: color, filter: "blur(5px)" }}
					/>
					<Icon size={12} color={color} className="relative z-10" strokeWidth={2.5} />
				</div>
				<span className="text-[15px] font-semibold text-white/90 whitespace-nowrap tracking-wide">
					{label}
				</span>
			</div>
		</motion.div>
	);
}

/* ════════ BENEFIT ITEM (horizontal — icon on top, label below) ════════ */
function BenefitItem({ label, desc, index, inView, isLast }) {
	const src = BENEFIT_ICONS[index];
	return (
		<motion.div
			initial={{ opacity: 0, y: 20 }}
			animate={inView ? { opacity: 1, y: 0 } : {}}
			transition={{ duration: 0.5, delay: 0.3 + index * 0.08, ease: [0.22, 1, 0.36, 1] }}
			whileHover={{ y: -3 }}
			className="flex flex-col items-center justify-center gap-2 flex-1 py-4 px-3 relative"
			style={{
				borderRight:`1px solid rgba(103,99,175,0.12)`,
			}}
		>
			{/* icon with pulsing aura */}
			<div className="relative  flex items-center justify-center flex-shrink-0">

				<div
					className="relative w-[80px] h-[80px] rounded-xl flex items-center justify-center"
				>
					<img src={src} /> 
				</div>
			</div>

			<div className="text-center">
				<p className="text-[15px] font-bold leading-tight" style={{ color: "var(--foreground, #111)" }}>
					{label}
				</p>
				{desc && (
					<p className="text-[10.5px] mt-0.5 leading-snug" style={{ color: "var(--muted-foreground, #9ca3af)" }}>
						{desc}
					</p>
				)}
			</div>
		</motion.div>
	);
}

/* ════════ SECTION ════════ */
export default function FeatureSection() {
	const t = useTranslations("features");
	const locale = useLocale();
	const isRtl = locale === "ar";

	const ref = useRef(null);
	const inView = useInView(ref, { once: true, margin: "-60px" });

	const pills = t.raw("pills");
	const benefits = t.raw("benefits");

	const headlines = useMemo(() => {
		const raw = t.raw("headlines");
		return Array.isArray(raw) && raw.length
			? raw
			: [{ part1: t("headline.part1"), part2: t("headline.part2") }];
	}, [t]);

	const [headlineIndex, setHeadlineIndex] = useState(0);

	useEffect(() => {
		if (!inView || headlines.length <= 1) return;
		const id = window.setInterval(() => {
			setHeadlineIndex((i) => (i + 1) % headlines.length);
		}, 3_000);
		return () => window.clearInterval(id);
	}, [inView, headlines.length]);

	const active = headlines[headlineIndex] ?? headlines[0];

	return (
		<section
			ref={ref}
			className="relative py-10 !pt-22 overflow-hidden" 
		>
			<style>{`
        @keyframes shimmerText {
          0%   { background-position: 0% center; }
          100% { background-position: 200% center; }
        }
      `}</style>
			<div className="container mx-auto px-4">
				{/* ── ONE ROW: 3 panels ── */}
				<div className="flex flex-row items-stretch gap-3" style={{ minHeight: 200 }}>

					{/* ── PANEL 1: Headline ── */}
					<motion.div
						initial={{ opacity: 0, x: isRtl ? 50 : -50 }}
						animate={inView ? { opacity: 1, x: 0 } : {}}
						transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
						className="relative rounded-3xl overflow-hidden flex items-center justify-end p-7"
						style={{
							flex: "0 0 350px",
							minWidth: 300,
							background: "linear-gradient(145deg,#1a1140 0%,#2d1f6e 55%,#0f0a2e 100%)",
 						}}
					>
						{/* animated grid overlay */}
						<motion.div
							animate={{ opacity: [0.03, 0.07, 0.03] }}
							transition={{ duration: 5, repeat: Infinity }}
							className="absolute inset-0 pointer-events-none"
							style={{
								backgroundImage:
									"linear-gradient(rgba(255,255,255,0.8) 1px,transparent 1px),linear-gradient(90deg,rgba(255,255,255,0.8) 1px,transparent 1px)",
								backgroundSize: "32px 32px",
							}}
						/>

						{/* core glow */}
						<motion.div
							animate={{ scale: [1, 1.6, 1], opacity: [0.08, 0.22, 0.08] }}
							transition={{ duration: 4.5, repeat: Infinity }}
							className="absolute rounded-full pointer-events-none"
							style={{
								width: 180, height: 180,
								top: "50%", left: "50%",
								transform: "translate(-50%,-50%)",
								background: `radial-gradient(circle,${BRAND}90 0%,transparent 65%)`,
								filter: "blur(18px)",
							}}
						/>

						{/* sparkles */}
						{[
							{ top: "14%", right: "10%", size: 3, dur: 3.2 },
							{ top: "78%", right: "78%", size: 2, dur: 2.8 },
							{ top: "44%", right: "5%", size: 4, dur: 4.0 },
							{ top: "85%", right: "36%", size: 2, dur: 3.6 },
						].map((s, i) => (
							<motion.div
								key={i}
								animate={{ opacity: [0.15, 0.9, 0.15], scale: [1, 1.7, 1] }}
								transition={{ duration: s.dur, repeat: Infinity, delay: i * 0.5 }}
								className="absolute rounded-full bg-white pointer-events-none"
								style={{ top: s.top, right: s.right, width: s.size, height: s.size }}
							/>
						))}

						{/* shimmer keyframe */}
						<style>{`
              @keyframes shimmerText {
                0%   { background-position: 0% center; }
                100% { background-position: 300% center; }
              }
            `}</style>

						{/* headline text */}
						<div className="relative z-10 w-full " style={{ perspective: "700px" }}>
							<div className="relative " style={{ transformStyle: "preserve-3d" }}>
								<AnimatePresence mode="wait">
									<motion.h2
										key={headlineIndex}
										initial={{ opacity: 0 }}
										animate={{ opacity: 1 }}
										exit={{
											opacity: 0, y: -30, scale: 0.85, filter: "blur(18px)",
											transition: { duration: 0.4, ease: [0.4, 0, 1, 1] }
										}}
										transition={{ duration: 0.05 }}
										className="font-extrabold leading-snug "
										style={{ fontSize: "clamp(19px,2.2vw,25px)", transformStyle: "preserve-3d" }}
									>
										{/* part1: each word drops from top with 3d flip */}
										{active.part1.split(" ").map((word, wi) => (
											<motion.span
												key={`${headlineIndex}-p1-${wi}`}
												initial={{ opacity: 0, y: -28, rotateX: -50, filter: "blur(8px)" }}
												animate={{ opacity: 1, y: 0, rotateX: 0, filter: "blur(0px)" }}
												transition={{ duration: 0.6, delay: wi * 0.15, ease: [0.22, 1, 0.36, 1] }}
												className="text-white inline-block"
												style={{ marginLeft: 5, transformOrigin: "top center" }}
											>
												{word}
											</motion.span>
										))}{" "}

										{/* part2: drops after part1 ends, with rainbow shimmer */}
										{active.part2.split(" ").map((word, wi) => {
											const p1len = active.part1.split(" ").length;
											return (
												<motion.span
													key={`${headlineIndex}-p2-${wi}`}
													initial={{ opacity: 0, y: -28, rotateX: -50, filter: "blur(8px)" }}
													animate={{ opacity: 1, y: 0, rotateX: 0, filter: "blur(0px)" }}
													transition={{ duration: 0.65, delay: p1len * 0.15 + 0.1 + wi * 0.15, ease: [0.22, 1, 0.36, 1] }}
													className="inline-block"
													style={{
														marginLeft: 5,
														transformOrigin: "top center",
														background: "linear-gradient(270deg,#f0ee74,#f472b6,#a78bfa,#60a5fa,#f0ee74)",
														backgroundSize: "300% auto",
														WebkitBackgroundClip: "text",
														WebkitTextFillColor: "transparent",
														animation: "shimmerText 4s linear infinite",
													}}
												>
													{word}
												</motion.span>
											);
										})}
									</motion.h2>
								</AnimatePresence>

								{/* 5s fill bar */}
								{headlines.length > 1 && (
									<motion.div
										key={`prog-${headlineIndex}`}
										className="mt-3 h-[2px] w-20 rounded-full ml-auto"
										style={{
											background: "linear-gradient(90deg,#f0ee74,#f472b6,#a78bfa)",
											transformOrigin: "right",
										}}
										initial={{ scaleX: 0, opacity: 0.7 }}
										animate={{ scaleX: 1, opacity: 1 }}
										transition={{ duration: 5, ease: "linear" }}
									/>
								)}

								{/* dot step indicators */}
								{headlines.length > 1 && (
									<div className="flex gap-1.5 mt-2.5 justify-end">
										{headlines.map((_, i) => (
											<motion.div
												key={i}
												animate={{
													width: i === headlineIndex ? 18 : 5,
													opacity: i === headlineIndex ? 1 : 0.3,
													background: i === headlineIndex ? "#a78bfa" : "#ffffff",
												}}
												transition={{ duration: 0.4 }}
												style={{ height: 5, borderRadius: 3 }}
											/>
										))}
									</div>
								)}
							</div>
						</div>
					</motion.div>

					{/* ── PANEL 2: Pills ── */}
					<motion.div
						initial={{ opacity: 0, y: 30 }}
						animate={inView ? { opacity: 1, y: 0 } : {}}
						transition={{ duration: 0.7, delay: 0.08, ease: [0.22, 1, 0.36, 1] }}
						className="relative rounded-3xl overflow-hidden p-5 flex flex-col justify-center"
						style={{
							flex: "0 0 350px",
							minWidth: 300,
							background: "linear-gradient(145deg,#18103a 0%,#231558 60%,#0f0a2e 100%)",
 						}}
					>
						{/* orbiting rings */}
						<motion.div
							animate={{ rotate: 360 }}
							transition={{ duration: 24, repeat: Infinity, ease: "linear" }}
							className="absolute rounded-full pointer-events-none"
							style={{
								width: 170, height: 170,
								top: "50%", left: "50%",
								transform: "translate(-50%,-50%)",
								border: "1px dashed rgba(167,139,250,0.15)",
							}}
						/>
						<motion.div
							animate={{ rotate: -360 }}
							transition={{ duration: 17, repeat: Infinity, ease: "linear" }}
							className="absolute rounded-full pointer-events-none"
							style={{
								width: 105, height: 105,
								top: "50%", left: "50%",
								transform: "translate(-50%,-50%)",
								border: "1px dashed rgba(244,114,182,0.12)",
							}}
						/>
 
						{/* pills */}
						<div className="flex flex-col gap-2 relative z-20">
							{pills.map((p, i) => (
								<Pill key={i} label={p.label} index={i} color={PILL_COLORS[i]} inView={inView} />
							))}
						</div>
					</motion.div>

					{/* ── PANEL 3: 4 benefit items in one horizontal card ── */}
					<motion.div
						initial={{ opacity: 0, x: isRtl ? -40 : 40 }}
						animate={inView ? { opacity: 1, x: 0 } : {}}
						transition={{ duration: 0.7, delay: 0.14, ease: [0.22, 1, 0.36, 1] }}
						className="flex flex-row backdrop-blur-2xl items-center rounded-3xl overflow-hidden flex-1"
						style={{
							background: "#ffffff95",
							border: "1px solid rgba(103,99,175,0.10)",
							boxShadow: "0 4px 24px rgba(103,99,175,0.07)",
							minWidth: 0,
						}}
					>
						{benefits.map((b, i) => (
							<BenefitItem
								key={i}
								label={b.label}
								desc={b.desc}
								index={i}
								inView={inView}
								isLast={i === benefits.length - 1}
							/>
						))}
					</motion.div>

				</div>
			</div>
		</section>
	);
}