'use client';

import { AnimatePresence, motion } from 'framer-motion';
import { useTranslations } from 'next-intl';
const BRAND = "#6763AF";
const ease = [0.22, 1, 0.36, 1];
/* ─── Logo Badge ─── */
function LogoBadge({ text, bg, color }) {
	return (
		<div className='rounded-full' style={{
			width: 44, height: 44,
			background: bg, display: 'flex', alignItems: 'center',
			justifyContent: 'center', flexShrink: 0,
			fontWeight: 800, fontSize: 10, color,
			letterSpacing: '-0.3px', userSelect: 'none',
			textAlign: 'center', lineHeight: 1.2,
			border: "4px solid #E9E9FC"
		}}>
			{text}
		</div>
	);
}

/* ─── Stars ─── */
 
const C = {
  bg: "#0e0c0a",
  card: "#141210",
  border: "#2a2420",
  gold1: "#f4c162",
  gold2: "#e8943a",
  goldGlow: "rgba(244,193,98,0.35)",
  dim: "#3d3228",
  text: "#f0e8d8",
  sub: "#8a7a68",
  tag: "#1e1a15",
};
/* ─── Single animated star ─── */
function Star({ filled, index, interactive, onHover, onClick, size = 28 }) {
  const id = `grad-${index}`;
  return (
    <motion.button
      onClick={onClick}
      onMouseEnter={() => interactive && onHover(index)}
      style={{
        background: "none", border: "none", cursor: interactive ? "pointer" : "default",
        padding: 2, position: "relative", lineHeight: 0,
      }} 
      aria-label={`${index + 1} star`}
    >
      {/* glow behind filled stars */}
      <AnimatePresence>
        {filled && (
          <motion.div
            key="glow"
            initial={{ opacity: 0, scale: 0.4 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.3 }}
            transition={{ duration: 0.3 }}
            style={{
              position: "absolute", inset: -4, borderRadius: "50%",
              background: `radial-gradient(circle, ${C.goldGlow} 0%, transparent 70%)`,
              filter: "blur(4px)", pointerEvents: "none",
            }}
          />
        )}
      </AnimatePresence>

      <svg width={size} height={size} viewBox="0 0 24 24" fill="none" style={{ display: "block" }}>
        <defs>
          <linearGradient id={id} x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor={C.gold1} />
            <stop offset="100%" stopColor={C.gold2} />
          </linearGradient>
        </defs>
        <motion.path
          d="M12 2 L14.9 8.6 L22 9.3 L16.9 14 L18.5 21 L12 17.3 L5.5 21 L7.1 14 L2 9.3 L9.1 8.6 Z"
          animate={{
            fill: filled ? `url(#${id})` : C.dim,
            stroke: filled ? C.gold1 : C.dim,
            filter: filled ? `drop-shadow(0 0 5px ${C.goldGlow})` : "none",
          }}
          initial={false}
          transition={{ duration: 0.25, delay: index * 0.04 }}
          strokeWidth="0.5"
        />
      </svg>
    </motion.button>
  );
}

/* ─── Stars row — static display ─── */
function Stars({ count, size }) {
  return (
    <div style={{ display: "flex", gap: 1 }}>
      {Array.from({ length: 5 }).map((_, i) => (
        <Star key={i} index={i} filled={i < count} size={size} />
      ))}
    </div>
  );
}


/* ─── Single Card ─── */
function ReviewCard({ review }) {
	return (
		<div style={{
			background: '#f8f9ff',
			border: "4px solid #6763AF0A",
			borderRadius: 16,
			padding: '18px 20px',
			direction: 'rtl',
			marginBottom: 14,
			flexShrink: 0,
			transition: 'box-shadow 0.3s',
			cursor: 'default',
		}}
			onMouseEnter={e => e.currentTarget.style.boxShadow = '0 4px 24px rgba(139,92,246,0.15)'}
			onMouseLeave={e => e.currentTarget.style.boxShadow = 'none'}
		>
			{/* Header */}
			<div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
				<div className='flex items-center gap-3 w-full'  >
					<LogoBadge text={review.logoText} bg={review.logoBg} color={review.logoColor} />
					<div className='w-full' >
						<div className='flex items-center justify-between w-full ' >
							<span style={{ fontWeight: 700, fontSize: 14, color: 'var(--foreground, #111)', textAlign: 'right' }}>
								{review.name}
							</span>
							<div className='scale-[.6] origin-left' > <Stars count={review.stars} /> </div>
						</div>
						<span className='  block' style={{ fontSize: 9, color: 'var(--muted-foreground, #6b7280)', textAlign: 'right' }}>
							{review.role}
						</span>

					</div>
				</div>
			</div>

			{/* Body */}
			<p style={{
				fontSize: 12,
				color: 'var(--muted-foreground, #6b7280)',
				lineHeight: 1.75,
				textAlign: 'right',
				margin: 0,
			}}>
				{review.text}
			</p>
		</div>
	);
}

/* ─── Scrolling Column ─── */
function ScrollColumn({ reviews, duration, reverse = false }) {
	// Duplicate for infinite loop
	const doubled = [...reviews, ...reviews];

	return (
		<div style={{ overflow: 'hidden', flex: 1, position: 'relative', minWidth: 0 }}>
			{/* Top fade */}
			<div style={{
				position: 'absolute', top: 0, left: 0, right: 0, height: 80, zIndex: 2,
				background: 'linear-gradient(to bottom, var(--background, #f9fafb), transparent)',
				pointerEvents: 'none',
			}} />
			{/* Bottom fade */}
			<div style={{
				position: 'absolute', bottom: 0, left: 0, right: 0, height: 80, zIndex: 2,
				background: 'linear-gradient(to top, var(--background, #f9fafb), transparent)',
				pointerEvents: 'none',
			}} />

			<div
				style={{
					display: 'flex',
					flexDirection: 'column',
					animation: `${reverse ? 'scrollDown' : 'scrollUp'} ${duration}s linear infinite`,
				}}
				onMouseEnter={e => e.currentTarget.style.animationPlayState = 'paused'}
				onMouseLeave={e => e.currentTarget.style.animationPlayState = 'running'}
			>
				{doubled.map((review, i) => (
					<ReviewCard key={`${review.id}-${i}`} review={review} />
				))}
			</div>
		</div>
	);
}

/* ─── Main Section ─── */
export default function TestimonialsSection() {
	const t = useTranslations('testimonials');

	const col1 = [
		{
			id: 'r1', name: t('reviews.r1.name'), role: t('reviews.r1.role'),
			logoText: t('logos.zain'), logoBg: '#7c3aed', logoColor: '#fff',
			stars: 5, text: t('reviews.r1.text'),
		},
		{
			id: 'r2', name: t('reviews.r2.name'), role: t('reviews.r2.role'),
			logoText: t('logos.alize'), logoBg: '#e0e7ff', logoColor: '#4338ca',
			stars: 5, text: t('reviews.r2.text'),
		},
		{
			id: 'r3', name: t('reviews.r3.name'), role: t('reviews.r3.role'),
			logoText: t('logos.alize'), logoBg: '#e0e7ff', logoColor: '#4338ca',
			stars: 5, text: t('reviews.r3.text'),
		},
	];

	const col2 = [
		{
			id: 'r4', name: t('reviews.r4.name'), role: t('reviews.r4.role'),
			logoText: t('logos.zain'), logoBg: '#7c3aed', logoColor: '#fff',
			stars: 5, text: t('reviews.r4.text'),
		},
		{
			id: 'r5', name: t('reviews.r5.name'), role: t('reviews.r5.role'),
			logoText: 'C', logoBg: '#6366f1', logoColor: '#fff',
			stars: 5, text: t('reviews.r5.text'),
		},
		{
			id: 'r6', name: t('reviews.r6.name'), role: t('reviews.r6.role'),
			logoText: t('logos.alize'), logoBg: '#e0e7ff', logoColor: '#4338ca',
			stars: 5, text: t('reviews.r6.text'),
		},
	];

	const col3 = [
		{
			id: 'r7', name: t('reviews.r7.name'), role: t('reviews.r7.role'),
			logoText: t('logos.oneSystem'), logoBg: '#f1f5f9', logoColor: '#475569',
			stars: 5, text: t('reviews.r7.text'),
		},
		{
			id: 'r8', name: t('reviews.r8.name'), role: t('reviews.r8.role'),
			logoText: 'G', logoBg: '#4ade80', logoColor: '#14532d',
			stars: 5, text: t('reviews.r8.text'),
		},
		{
			id: 'r9', name: t('reviews.r9.name'), role: t('reviews.r9.role'),
			logoText: 'F', logoBg: '#818cf8', logoColor: '#fff',
			stars: 4, text: t('reviews.r9.text'),
		},
		{
			id: 'r10', name: t('reviews.r10.name'), role: t('reviews.r10.role'),
			logoText: 'M', logoBg: '#e2e8f0', logoColor: '#334155',
			stars: 4, text: t('reviews.r10.text'),
		},
	];

	return (
		<>
			<style>{`
        @keyframes scrollUp {
          0%   { transform: translateY(0); }
          100% { transform: translateY(-50%); }
        }
        @keyframes scrollDown {
          0%   { transform: translateY(-50%); }
          100% { transform: translateY(0); }
        }
      `}</style>

			<section
				dir="rtl"
				style={{
					background: 'var(--background, #f9fafb)',
					padding: '72px 32px 80px',
					overflow: 'hidden',
				}}
			>
				{/* Heading */}
				<div className="mb-[50px] text-center mt-[100px]">
					<motion.h2
						className="text-3xl md:text-[2.1rem] font-extrabold text-gray-900 leading-snug"
					>
						{t("heading.prefix")}{" "}
						<motion.span
							className="inline-block px-5 py-1 rounded-xl"
							style={{ background: `${BRAND}16`, color: BRAND }}
						>
							{t("heading.highlight")}
						</motion.span>
					</motion.h2>

					<motion.p
						className="text-xl text-gray-500 mt-4"
					>
						{t("subheading")}
					</motion.p>
				</div>


				{/* 3 columns */}
				<div style={{
					display: 'flex',
					gap: 16,
					maxWidth: 1100,
					margin: '0 auto',
					height: 560,
					alignItems: 'flex-start',
				}}>
					<ScrollColumn reviews={col1} duration={22} reverse={false} />
					<ScrollColumn reviews={col2} duration={28} reverse={true} />
					<ScrollColumn reviews={col3} duration={20} reverse={false} />
				</div>
			</section>
		</>
	);
}