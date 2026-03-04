"use client";

import { useLocale, useTranslations } from "next-intl";
import { motion, useMotionValue, useSpring } from "framer-motion";
import { useEffect, useState } from "react";

/* ────────────────────────────────────────────
	 Green bullet badge
	 ──────────────────────────────────────────── */
function Bullet() {
	return (
		<span
			className="inline-flex scale-[.8] origin-center items-center justify-center flex-shrink-0 mx-1 align-middle relative"
			style={{ width: 40, height: 40 }}
		>
			<span
				className="inline-flex items-center justify-center w-full h-full rounded-full"
				style={{
					background: "#BAEB33",
					boxShadow: "0 0 18px #BAEB33cc, 0 0 6px #BAEB3366, inset 0 1px 0 #BAEB33aa",
				}}
			>
				<svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
					<path d="M1.54785 15.0108L9.78035 20V10.38L1.54785 5.39V15.0108ZM18.4529 15.0108V5.39L10.2204 10.38V20L18.4529 15.0108ZM18.2479 4.99917L10.0004 0L1.75285 4.99917L10.0004 9.99833L18.2479 4.99917Z" fill="#1C114D" />
				</svg>

			</span>
		</span>
	);
}

/* ────────────────────────────────────────────
	 Single animated word

	 Wave direction:
	 • AR (RTL) → wave travels right→left:
			 rightmost word lights first (highest phase idx)
	 • EN (LTR) → wave travels left→right:
			 leftmost word lights first (lowest phase idx)
	 ──────────────────────────────────────────── */
function Word({ children, idx, total, duration, isRtl }) {
	// Flip effective index for RTL so wave starts from the right
	const effectiveIdx = isRtl ? total - 1 - idx : idx;
	const phaseOffset = (effectiveIdx / Math.max(total - 1, 1)) * duration;
	const delay = `${-phaseOffset}s`;

	return (
		<span
			className="inline-block word-wave"
			style={{
				animationDelay: delay,
				animationDuration: `${duration}s`,
				willChange: "opacity, filter, transform",
			}}
		>
			{children}
		</span>
	);
}

/* ────────────────────────────────────────────
	 Mouse-tracking parallax orb
	 ──────────────────────────────────────────── */
function ParallaxOrb({ depth = 1, style, animate, transition }) {
	const mx = useMotionValue(0);
	const my = useMotionValue(0);
	const sx = useSpring(mx, { stiffness: 60, damping: 20 });
	const sy = useSpring(my, { stiffness: 60, damping: 20 });

	useEffect(() => {
		const handler = (e) => {
			const cx = window.innerWidth / 2;
			const cy = window.innerHeight / 2;
			mx.set(((e.clientX - cx) / cx) * 28 * depth);
			my.set(((e.clientY - cy) / cy) * 18 * depth);
		};
		window.addEventListener("mousemove", handler);
		return () => window.removeEventListener("mousemove", handler);
	}, [depth, mx, my]);

	return (
		<motion.div
			style={{ x: sx, y: sy, ...style }}
			animate={animate}
			transition={transition}
			className="absolute rounded-full pointer-events-none"
		/>
	);
}

/* ────────────────────────────────────────────
	 Floating particle
	 ──────────────────────────────────────────── */
function Particle({ x, y, size, dur, delay }) {
	return (
		<motion.div
			className="absolute rounded-full pointer-events-none"
			style={{ left: `${x}%`, top: `${y}%`, width: size, height: size, background: "#c6f13588" }}
			animate={{ y: [0, -28, 0], opacity: [0, 0.7, 0], scale: [0.6, 1, 0.6] }}
			transition={{ duration: dur, delay, repeat: Infinity, ease: "easeInOut" }}
		/>
	);
}

/* ────────────────────────────────────────────
	 Build token rows
	 ──────────────────────────────────────────── */
function buildTokens(lines) {
	const tokens = [];
	let wordCount = 0;
	lines.forEach((segments) => {
		const rowTokens = [];
		segments.forEach((seg) => {
			if (seg.bullet) rowTokens.push({ type: "bullet" });
			seg.text.trim().split(/\s+/).filter(Boolean).forEach((w) => {
				rowTokens.push({ type: "word", text: w, globalIdx: wordCount++ });
			});
		});
		tokens.push(rowTokens);
	});
	return { rows: tokens, totalWords: wordCount };
}

/* ────────────────────────────────────────────
	 Scanlines
	 ──────────────────────────────────────────── */
function Scanlines() {
	return (
		<div
			className="absolute inset-0 pointer-events-none z-[2]"
			style={{
				backgroundImage:
					"repeating-linear-gradient(0deg,transparent,transparent 3px,rgba(0,0,0,0.04) 3px,rgba(0,0,0,0.04) 4px)",
				opacity: 0.6,
			}}
		/>
	);
}

/* ════════════════════════════════════════════
	 MAIN SECTION
	 ════════════════════════════════════════════ */
export default function MarqueeTextSection() {
	const t = useTranslations("marquee");
	const locale = useLocale();
	const isRtl = locale === "ar";
	const lines = t.raw("lines");

	const { rows, totalWords } = buildTokens(lines);
	const WAVE_DURATION = 5;

	/* ── CONTAINER: stagger rows top → bottom ── */
	const containerVariants = {
		hidden: {},
		visible: {
			transition: {
				staggerChildren: 0.13,   // each row follows the one above
				delayChildren: 0.05,
			},
		},
	};

	/*
		ROW entrance: falls FROM ABOVE (y: -30 → 0)
		This gives the top-to-bottom cascade feel.
	*/
	const rowVariants = {
		hidden: { opacity: 0, y: -30, filter: "blur(8px)", scale: 0.95 },
		visible: {
			opacity: 1, y: 0, filter: "blur(0px)", scale: 1,
			transition: { duration: 0.65, ease: [0.22, 1, 0.36, 1] },
		},
	};

	/*
		WORD entrance within each row:
		• RTL → stagger from right (index reversed), words slide in from right
		• LTR → stagger from left, words slide in from left
	*/
	const makeWordVariants = (staggerIdx) => ({
		hidden: {
			opacity: 0,
			x: isRtl ? 18 : -18,   // RTL: enter from right; LTR: from left
			filter: "blur(5px)",
		},
		visible: {
			opacity: 1,
			x: 0,
			filter: "blur(0px)",
			transition: {
				duration: 0.42,
				delay: staggerIdx * 0.05,
				ease: [0.22, 1, 0.36, 1],
			},
		},
	});

	// Stable particles
	const [particles] = useState(() =>
		Array.from({ length: 18 }, () => ({
			x: Math.random() * 100,
			y: Math.random() * 100,
			size: Math.random() * 3 + 1.5,
			dur: Math.random() * 4 + 3,
			delay: Math.random() * 4,
		}))
	);

	return (
		<>
			<style>{`
        @keyframes wordWave {
          0%,100% { opacity: 0.16; filter: brightness(0.7); transform: translateY(0px); }
          45%      { opacity: 0.55; filter: brightness(1);   transform: translateY(-1px); }
          50%      { opacity: 1;    filter: brightness(1.3) drop-shadow(0 0 9px #c6f135cc); transform: translateY(-2px); }
          55%      { opacity: 0.55; filter: brightness(1);   transform: translateY(-1px); }
        }
        .word-wave {
          animation-name: wordWave;
          animation-timing-function: ease-in-out;
          animation-iteration-count: infinite;
        }
        @keyframes bulletRing1 {
          0%   { transform: scale(1);   opacity: 0.7; }
          100% { transform: scale(2.4); opacity: 0; }
        }
        @keyframes bulletRing2 {
          0%   { transform: scale(1);   opacity: 0.4; }
          100% { transform: scale(3.2); opacity: 0; }
        }
        .animate-bullet-ring1 { animation: bulletRing1 1.8s ease-out infinite; }
        .animate-bullet-ring2 { animation: bulletRing2 1.8s ease-out 0.4s infinite; }
        @keyframes shimmer {
          0%   { background-position: -200% center; }
          100% { background-position:  200% center; }
        }
        .shimmer-line {
          background: linear-gradient(90deg,#ffffff08 0%,#c6f13520 40%,#ffffff0a 60%,#c6f13518 100%);
          background-size: 200% auto;
          animation: shimmer 6s linear infinite;
        }
      `}</style>

			<section
				className="relative overflow-hidden py-20 md:py-32"
				style={{
					background:
						"linear-gradient(155deg,#06031a 0%,#0e0830 25%,#180d45 50%,#0a0525 75%,#06031a 100%)",
				}}
				dir={isRtl ? "rtl" : "ltr"}
			>
				<Scanlines />
				{particles.map((p, i) => <Particle key={i} {...p} />)}

				{/* parallax orbs */}
				<ParallaxOrb
					depth={1.2}
					style={{ width: 640, height: 640, top: "50%", left: "38%", transform: "translate(-50%,-50%)", background: "radial-gradient(circle,#5b47c555 0%,transparent 65%)", filter: "blur(80px)" }}
					animate={{ scale: [1, 1.35, 1], opacity: [0.22, 0.42, 0.22] }}
					transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
				/>
				<ParallaxOrb
					depth={0.6}
					style={{ width: 380, height: 380, bottom: "-5%", right: "5%", background: "radial-gradient(circle,#c6f13530 0%,transparent 65%)", filter: "blur(60px)" }}
					animate={{ scale: [1, 1.3, 1], opacity: [0.1, 0.25, 0.1] }}
					transition={{ duration: 10, repeat: Infinity, ease: "easeInOut", delay: 4 }}
				/>
				<ParallaxOrb
					depth={0.9}
					style={{ width: 260, height: 260, top: "10%", left: "10%", background: "radial-gradient(circle,#7c5ce420 0%,transparent 65%)", filter: "blur(50px)" }}
					animate={{ scale: [1, 1.5, 1], opacity: [0.08, 0.2, 0.08] }}
					transition={{ duration: 7, repeat: Infinity, ease: "easeInOut", delay: 2 }}
				/>

				{/* dot grid */}
				<div
					className="absolute inset-0 opacity-[0.03] pointer-events-none"
					style={{ backgroundImage: "radial-gradient(circle,rgba(198,241,53,0.9) 1px,transparent 1px)", backgroundSize: "36px 36px" }}
				/>

				{/* shimmer edge lines */}
				<div className="absolute top-0 left-0 right-0 h-px shimmer-line" />
				<div className="absolute bottom-0 left-0 right-0 h-px shimmer-line" style={{ animationDelay: "3s" }} />

				{/* vignette */}
				<div
					className="absolute inset-0 pointer-events-none z-[1]"
					style={{ background: "radial-gradient(ellipse 90% 80% at 50% 50%,transparent 55%,#06031a 100%)" }}
				/>

				{/* ── TEXT ── */}
				<div className="container mx-auto px-6 relative z-10">
					<motion.div
						className="flex flex-col gap-7 items-center text-center"
						variants={containerVariants}
						initial="hidden"
						whileInView="visible"
						viewport={{ once: true, margin: "-80px" }}
					>
						{rows.map((row, ri) => (
							<motion.div
								key={ri}
								variants={rowVariants}
								className="flex flex-wrap items-center justify-center gap-x-2 gap-y-1.5"
							>
								{row.map((tok, ti) => {
									const staggerIdx = isRtl ? (row.length - 1 - ti) : ti;

									if (tok.type === "bullet") {
										return (
											<motion.span
												key={`${ri}-b-${ti}`}
												variants={makeWordVariants(staggerIdx)}
												className="inline-flex"
											>
												<Bullet />
											</motion.span>
										);
									}

									return (
										<motion.span
											key={`${ri}-w-${ti}`}
											variants={makeWordVariants(staggerIdx)}
											className="inline-block"
										>
											<Word
												idx={tok.globalIdx}
												total={totalWords}
												duration={WAVE_DURATION}
												isRtl={isRtl}
											>
												<span
													className=" text-2xl text-white font-extrabold tracking-wide"
													style={{
 														fontFamily: "'Cairo','Tajawal',sans-serif",
														letterSpacing: "0.01em",
													}}
												>
													{tok.text}
												</span>
											</Word>
										</motion.span>
									);
								})}
							</motion.div>
						))}
					</motion.div>
				</div>

				{/* corner accents */}
				{[
					{ top: 20, left: 20, borderTop: "1.5px solid #c6f13555", borderLeft: "1.5px solid #c6f13555" },
					{ top: 20, right: 20, borderTop: "1.5px solid #c6f13555", borderRight: "1.5px solid #c6f13555" },
					{ bottom: 20, right: 20, borderBottom: "1.5px solid #c6f13555", borderRight: "1.5px solid #c6f13555" },
					{ bottom: 20, left: 20, borderBottom: "1.5px solid #c6f13555", borderLeft: "1.5px solid #c6f13555" },
				].map((pos, i) => (
					<motion.div
						key={i}
						className="absolute pointer-events-none"
						style={{ width: 32, height: 32, ...pos }}
						animate={{ opacity: [0.3, 0.8, 0.3] }}
						transition={{ duration: 3, delay: i * 0.5, repeat: Infinity, ease: "easeInOut" }}
					/>
				))}
			</section>
		</>
	);
}