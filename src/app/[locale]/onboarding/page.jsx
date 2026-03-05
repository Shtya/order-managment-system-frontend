'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import toast from 'react-hot-toast';

/* ─── CSS ─────────────────────────────────────────────────── */
const CSS = `
  @import url('https://fonts.googleapis.com/css2?family=Cairo:wght@300;400;500;600;700;800;900&family=JetBrains+Mono:wght@400;600&display=swap');

  :root {
    --p:         #6763AF;
    --p2:        #5750a0;
    --p-light:   #8c89c8;
    --p-xlight:  #edeeff;
    --p-dark:    #4a4788;
    --p-glow:    rgba(103,99,175,.18);
    --text:      #16162a;
    --text-2:    #4b4b6a;
    --text-3:    #9090b0;
    --border:    #e3e2f0;
    --bg:        #eeedf6;
    --surface:   #ffffff;
    --surface2:  #f7f7fc;
    --radius-sm: 10px;
    --radius:    16px;
    --radius-xl: 26px;
    --font:      'Cairo', sans-serif;
    --mono:      'JetBrains Mono', monospace;
    --shadow-sm: 0 2px 8px rgba(103,99,175,.08);
    --shadow:    0 8px 32px rgba(103,99,175,.13);
    --shadow-lg: 0 24px 64px rgba(103,99,175,.16);
  }

  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
  html { direction: rtl; }
  body {
    font-family: var(--font);
    background: var(--bg);
    color: var(--text);
    -webkit-font-smoothing: antialiased;
  }

  /* ── Inputs ── */
  .ob-input {
    width: 100%; height: 48px;
    padding: 0 44px 0 14px;
    background: var(--surface2);
    border: 1.5px solid var(--border);
    border-radius: var(--radius-sm);
    font-family: var(--font); font-size: 14px; color: var(--text);
    outline: none;
    transition: border-color .18s, box-shadow .18s, background .18s;
  }
  .ob-input:focus {
    border-color: var(--p);
    background: var(--surface);
    box-shadow: 0 0 0 3px var(--p-glow);
  }
  .ob-input.error { border-color: #ef4444; background: #fff5f5; }
  .ob-input[disabled] { opacity: .5; pointer-events: none; }

  .ob-textarea {
    width: 100%;
    padding: 12px 44px 12px 14px;
    background: var(--surface2);
    border: 1.5px solid var(--border);
    border-radius: var(--radius-sm);
    font-family: var(--font); font-size: 14px; color: var(--text);
    outline: none; resize: none;
    transition: border-color .18s, box-shadow .18s;
  }
  .ob-textarea:focus {
    border-color: var(--p);
    background: var(--surface);
    box-shadow: 0 0 0 3px var(--p-glow);
  }

  /* ── Spinner ── */
  @keyframes spin { to { transform: rotate(360deg); } }
  .spinner {
    width: 18px; height: 18px;
    border: 2.5px solid rgba(255,255,255,.3);
    border-top-color: #fff;
    border-radius: 50%;
    animation: spin .65s linear infinite;
    flex-shrink: 0;
  }

  /* ── Scrollbar ── */
  ::-webkit-scrollbar { width: 5px; }
  ::-webkit-scrollbar-track { background: transparent; }
  ::-webkit-scrollbar-thumb { background: var(--border); border-radius: 99px; }
  ::-webkit-scrollbar-thumb:hover { background: var(--p-light); }

  /* ── Plan cards ── */
  .plan-card {
    border: 2px solid var(--border);
    border-radius: 16px;
    padding: 22px 20px;
    cursor: pointer;
    transition: border-color .22s, box-shadow .22s, transform .22s;
    background: var(--surface);
    position: relative; overflow: hidden;
  }
  .plan-card:hover {
    border-color: var(--p-light);
    box-shadow: 0 8px 28px rgba(103,99,175,.12);
    transform: translateY(-2px);
  }
  .plan-card.selected {
    border-color: var(--p);
    box-shadow: 0 8px 32px rgba(103,99,175,.22);
    background: linear-gradient(145deg, #fff 60%, var(--p-xlight));
  }

  /* ── Provider cards ── */
  .prov-card {
    border: 1.5px solid var(--border);
    border-radius: 14px;
    padding: 16px 18px;
    display: flex; align-items: center; gap: 14px;
    cursor: pointer;
    transition: all .2s;
    background: var(--surface);
  }
  .prov-card:hover { border-color: var(--p-light); background: var(--p-xlight); transform: translateY(-1px); }
  .prov-card.active { border-color: var(--p); background: var(--p-xlight); }
  .prov-card.connected { border-color: #10b981; background: #f0fdf4; }

  /* ── Toaster ── */
  [data-sonner-toaster] { font-family: var(--font) !important; }
`;

/* ─── Icons ───────────────────────────────────────────────── */
const IcArrow = ({ dir = 'left' }) => (
	<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"
		style={{ transform: dir === 'right' ? 'scaleX(-1)' : 'none' }}>
		<path d="M5 12h14" /><path d="m12 5 7 7-7 7" />
	</svg>
);
const IcCheck = ({ size = 13 }) => (
	<svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
		<polyline points="20 6 9 17 4 12" />
	</svg>
);
const IcUser = () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="8" r="5" /><path d="M20 21a8 8 0 1 0-16 0" /></svg>;
const IcBuild = () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="18" height="18" rx="3" /><path d="M3 9h18M9 21V9" /></svg>;
const IcLink = () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" /><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" /></svg>;
const IcShip = () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M5 17H3a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v9a2 2 0 0 1-2 2h-3" /><circle cx="9" cy="19" r="2" /><circle cx="17" cy="19" r="2" /></svg>;
const IcStar = () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" /></svg>;
const IcGlobe = () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10" /><line x1="2" y1="12" x2="22" y2="12" /><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" /></svg>;
const IcPhone = () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07A19.5 19.5 0 0 1 4.69 12 19.79 19.79 0 0 1 1.61 3.38 2 2 0 0 1 3.58 1h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L7.91 8.56a16 16 0 0 0 6.29 6.29l.87-.87a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 22 16.92z" /></svg>;
const IcLock = () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="11" width="18" height="11" rx="2" /><path d="M7 11V7a5 5 0 0 1 10 0v4" /></svg>;

/* ─── Primitives ──────────────────────────────────────────── */
const BtnPrimary = ({ children, loading, onClick, disabled, style }) => (
	<button type="button" onClick={onClick} disabled={disabled || loading}
		style={{
			height: 50, padding: '0 28px',
			background: disabled ? 'var(--p-light)' : 'var(--p)', color: '#fff',
			border: 'none', borderRadius: 'var(--radius-sm)',
			fontFamily: 'var(--font)', fontSize: 15, fontWeight: 700,
			cursor: disabled || loading ? 'not-allowed' : 'pointer',
			display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
			boxShadow: disabled ? 'none' : '0 6px 20px rgba(103,99,175,.3)',
			opacity: disabled ? .55 : 1,
			transition: 'all .18s', ...style,
		}}
		onMouseOver={e => { if (!disabled && !loading) { e.currentTarget.style.background = 'var(--p2)'; e.currentTarget.style.transform = 'translateY(-1px)'; } }}
		onMouseOut={e => { e.currentTarget.style.background = disabled ? 'var(--p-light)' : 'var(--p)'; e.currentTarget.style.transform = 'translateY(0)'; }}
	>
		{loading ? <div className="spinner" /> : children}
	</button>
);

const BtnGhost = ({ children, onClick, style }) => (
	<button type="button" onClick={onClick}
		style={{
			height: 48, padding: '0 22px',
			background: 'transparent', color: 'var(--text-3)',
			border: '1.5px solid var(--border)', borderRadius: 'var(--radius-sm)',
			fontFamily: 'var(--font)', fontSize: 14, fontWeight: 600,
			cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
			transition: 'all .18s', ...style,
		}}
		onMouseOver={e => { e.currentTarget.style.borderColor = 'var(--p)'; e.currentTarget.style.color = 'var(--p)'; e.currentTarget.style.background = 'var(--p-xlight)'; }}
		onMouseOut={e => { e.currentTarget.style.borderColor = 'var(--border)'; e.currentTarget.style.color = 'var(--text-3)'; e.currentTarget.style.background = 'transparent'; }}
	>
		{children}
	</button>
);

function Field({ label, required, children, error, style }) {
	return (
		<div style={{ marginBottom: 14, ...style }}>
			{label && (
				<label style={{ display: 'block', fontSize: 12.5, fontWeight: 600, color: 'var(--text-2)', marginBottom: 6 }}>
					{label}{required && <span style={{ color: 'var(--p)', marginRight: 3 }}>*</span>}
				</label>
			)}
			{children}
			<AnimatePresence>
				{error && (
					<motion.p initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }}
						style={{ fontSize: 11.5, color: '#ef4444', marginTop: 4 }}>⚠ {error}</motion.p>
				)}
			</AnimatePresence>
		</div>
	);
}

function InputWrap({ icon, children }) {
	return (
		<div style={{ position: 'relative' }}>
			{icon && (
				<span style={{ position: 'absolute', right: 14, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-3)', display: 'flex', pointerEvents: 'none', zIndex: 1 }}>
					{icon}
				</span>
			)}
			{children}
		</div>
	);
}

/* Custom select matching auth pattern */
function ObSelect({ icon, value, onChange, onBlur, children, error, style }) {
	return (
		<div style={{ position: 'relative' }}>
			{icon && (
				<span style={{ position: 'absolute', right: 14, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-3)', display: 'flex', pointerEvents: 'none', zIndex: 1 }}>{icon}</span>
			)}
			<span style={{ position: 'absolute', left: 8, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-3)', display: 'flex', pointerEvents: 'none', zIndex: 1, paddingRight: 8, borderRight: '1px solid var(--border)', height: 20, alignItems: 'center' }}>
				<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="6 9 12 15 18 9" /></svg>
			</span>
			<select value={value} onChange={onChange} onBlur={onBlur}
				style={{
					width: '100%', height: 48,
					padding: '0 44px 0 32px',
					background: 'var(--surface2)',
					border: `1.5px solid ${error ? '#ef4444' : 'var(--border)'}`,
					borderRadius: 'var(--radius-sm)',
					fontFamily: 'var(--font)', fontSize: 14, color: 'var(--text)',
					outline: 'none', appearance: 'none', cursor: 'pointer',
					transition: 'border-color .18s, box-shadow .18s',
					...style,
				}}
				onFocus={e => { e.target.style.borderColor = 'var(--p)'; e.target.style.boxShadow = '0 0 0 3px var(--p-glow)'; e.target.style.background = 'var(--surface)'; }}
				onBlurCapture={e => { e.target.style.borderColor = error ? '#ef4444' : 'var(--border)'; e.target.style.boxShadow = 'none'; e.target.style.background = 'var(--surface2)'; }}
			>
				{children}
			</select>
		</div>
	);
}

/* ─── Sidebar ─────────────────────────────────────────────── */
const STEPS_META = [
	{ icon: <IcUser />, label: 'مرحباً', sub: 'نقطة البداية' },
	{ icon: <IcStar />, label: 'الخطة', sub: 'اختر باقتك' },
	{ icon: <IcBuild />, label: 'شركتك', sub: 'بيانات العمل' },
	{ icon: <IcLink />, label: 'المتجر', sub: 'ربط المنصة' },
	{ icon: <IcShip />, label: 'الشحن', sub: 'شركة التوصيل' },
];

function Sidebar({ step }) {
	return (
		<div style={{
			width: 230, flexShrink: 0,
			background: 'linear-gradient(175deg, #1a1740 0%, #231f55 55%, #2d2870 100%)',
			display: 'flex', flexDirection: 'column',
			padding: '36px 22px',
			position: 'relative', overflow: 'hidden',
		}}>
			{/* subtle dot grid */}
			<div style={{
				position: 'absolute', inset: 0, opacity: .06,
				backgroundImage: 'radial-gradient(circle, rgba(255,255,255,.8) 1px, transparent 1px)',
				backgroundSize: '22px 22px', pointerEvents: 'none',
			}} />
			{/* glow orb */}
			<div style={{ position: 'absolute', bottom: '-15%', left: '-20%', width: 280, height: 280, borderRadius: '50%', background: 'radial-gradient(circle, rgba(155,140,240,.22), transparent 70%)', filter: 'blur(50px)', pointerEvents: 'none' }} />

			{/* Logo */}
			<div style={{ display: 'flex', alignItems: 'center', gap: 11, marginBottom: 48, position: 'relative', zIndex: 1 }}>
				<div style={{
					width: 42, height: 42, borderRadius: 13,
					background: 'rgba(255,255,255,.14)',
					border: '1px solid rgba(255,255,255,.2)',
					display: 'flex', alignItems: 'center', justifyContent: 'center',
					boxShadow: '0 4px 16px rgba(0,0,0,.22)',
				}}>
					<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
						<path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" />
						<polyline points="3.27 6.96 12 12.01 20.73 6.96" />
						<line x1="12" y1="22.08" x2="12" y2="12" />
					</svg>
				</div>
				<div>
					<div style={{ fontSize: 17, fontWeight: 800, color: '#fff', letterSpacing: '-0.3px' }}>طلباتي تك</div>
				</div>
			</div>

			{/* Steps */}
			<div style={{ display: 'flex', flexDirection: 'column', gap: 4, flex: 1, position: 'relative', zIndex: 1 }}>
				{/* connector line */}
				<div style={{ position: 'absolute', right: -10, top: 0, bottom: 20, width: 2, background: 'rgba(255,255,255,.08)', borderRadius: 99 }}>
					<motion.div
						style={{ width: '100%', background: 'linear-gradient(180deg, rgba(255,255,255,.5), rgba(255,255,255,.15))', borderRadius: 99, transformOrigin: 'top' }}
						animate={{ height: `${(step / (STEPS_META.length - 1)) * 100}%` }}
						transition={{ duration: .5, ease: 'easeOut' }}
					/>
				</div>

				{STEPS_META.map((s, i) => {
					const done = i < step;
					const current = i === step;
					return (
						<motion.div key={i}
							style={{
								display: 'flex', alignItems: 'center', gap: 12, padding: '10px 12px',
								borderRadius: 12,
								background: current ? 'rgba(255,255,255,.12)' : 'transparent',
								transition: 'background .22s',
							}}
						>
							{/* dot */}
							<div style={{
								width: 34, height: 34, borderRadius: '50%', flexShrink: 0,
								display: 'flex', alignItems: 'center', justifyContent: 'center',
								background: done ? 'var(--p)' : current ? 'rgba(255,255,255,.15)' : 'rgba(255,255,255,.06)',
								border: `2px solid ${done ? 'var(--p)' : current ? 'rgba(255,255,255,.5)' : 'rgba(255,255,255,.12)'}`,
								boxShadow: current ? '0 0 0 4px rgba(255,255,255,.08)' : 'none',
								color: done || current ? '#fff' : 'rgba(255,255,255,.35)',
								transition: 'all .3s',
							}}>
								{done ? <IcCheck size={12} /> : s.icon}
							</div>
							<div>
								<div style={{ fontSize: 13, fontWeight: current ? 700 : 500, color: current ? '#fff' : done ? 'rgba(255,255,255,.7)' : 'rgba(255,255,255,.35)', transition: 'color .2s' }}>
									{s.label}
								</div>
								<div style={{ fontSize: 10.5, color: 'rgba(255,255,255,.25)', marginTop: 1 }}>{s.sub}</div>
							</div>
						</motion.div>
					);
				})}
			</div>

			{/* Progress text */}
			<div style={{ position: 'relative', zIndex: 1, paddingTop: 24 }}>
				<div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
					<span style={{ fontSize: 11, color: 'rgba(255,255,255,.35)', fontWeight: 600 }}>التقدم</span>
					<span style={{ fontSize: 11, color: 'rgba(255,255,255,.55)', fontWeight: 700 }}>
						{Math.round((step / (STEPS_META.length - 1)) * 100)}٪
					</span>
				</div>
				<div style={{ height: 3, background: 'rgba(255,255,255,.1)', borderRadius: 99 }}>
					<motion.div
						style={{ height: '100%', background: 'linear-gradient(90deg, rgba(255,255,255,.6), rgba(255,255,255,.35))', borderRadius: 99 }}
						animate={{ width: `${(step / (STEPS_META.length - 1)) * 100}%` }}
						transition={{ duration: .5, ease: 'easeOut' }}
					/>
				</div>
			</div>
		</div>
	);
}

/* ─── Step 0: Welcome ─────────────────────────────────────── */
function WelcomeStep({ onNext }) {
	const tiles = [
		{ emoji: '📦', title: 'إدارة الطلبات', desc: 'استقبل وتابع طلباتك لحظةً بلحظة' },
		{ emoji: '🚚', title: 'تتبع الشحنات', desc: 'ربط مباشر مع شركات التوصيل' },
		{ emoji: '📊', title: 'تقارير ذكية', desc: 'تحليلات مفصّلة لنمو متجرك' },
		{ emoji: '🔗', title: 'تكامل المنصات', desc: 'Shopify وWooCommerce وأكثر' },
	];

	return (
		<motion.div key="w" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -16 }} transition={{ duration: .35 }}>
			{/* Hero area */}
			<div style={{ marginBottom: 36 }}>
				<motion.div initial={{ scale: 0, rotate: -10 }} animate={{ scale: 1, rotate: 0 }} transition={{ type: 'spring', duration: .7, delay: .1 }}
					style={{
						width: 72, height: 72, borderRadius: 22,
						background: 'linear-gradient(145deg, var(--p), var(--p-dark))',
						display: 'flex', alignItems: 'center', justifyContent: 'center',
						boxShadow: '0 12px 40px rgba(103,99,175,.38)',
						fontSize: 34, marginBottom: 22,
					}}>
					🚀
				</motion.div>
				<motion.h1 initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: .18 }}
					style={{ fontSize: 26, fontWeight: 900, color: 'var(--text)', letterSpacing: '-0.5px', lineHeight: 1.3, marginBottom: 10 }}>
					أهلاً وسهلاً بك!<br />
					<span style={{ color: 'var(--p)' }}>لنبدأ الإعداد معاً</span>
				</motion.h1>
				<motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: .28 }}
					style={{ fontSize: 14, color: 'var(--text-3)', lineHeight: 1.75, maxWidth: 400 }}>
					سيستغرق الإعداد دقيقتين فقط — بعدها ستكون جاهزاً لاستقبال أول طلب.
				</motion.p>
			</div>

			{/* Feature tiles */}
			<div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 36 }}>
				{tiles.map((t, i) => (
					<motion.div key={i}
						initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: .3 + i * .07 }}
						style={{
							background: 'var(--surface)',
							border: '1px solid var(--border)',
							borderRadius: 14, padding: '16px 14px',
							display: 'flex', gap: 12, alignItems: 'flex-start',
							boxShadow: '0 2px 8px rgba(103,99,175,.06)',
						}}
					>
						<span style={{ fontSize: 24, flexShrink: 0, lineHeight: 1 }}>{t.emoji}</span>
						<div>
							<div style={{ fontSize: 13, fontWeight: 700, color: 'var(--text)', marginBottom: 3 }}>{t.title}</div>
							<div style={{ fontSize: 11.5, color: 'var(--text-3)', lineHeight: 1.55 }}>{t.desc}</div>
						</div>
					</motion.div>
				))}
			</div>

			{/* Hint bar */}
			<div style={{
				background: 'var(--p-xlight)', borderRadius: 12,
				padding: '12px 16px', marginBottom: 28,
				display: 'flex', gap: 10, alignItems: 'center',
				border: '1px solid rgba(103,99,175,.14)',
			}}>
				<span style={{ fontSize: 18 }}>💡</span>
				<p style={{ fontSize: 12.5, color: 'var(--p-dark)', lineHeight: 1.6 }}>
					يمكنك تخطي أي خطوة اختيارية والعودة إليها لاحقاً من الإعدادات.
				</p>
			</div>

			<BtnPrimary onClick={onNext} style={{ width: '100%' }}>
				لنبدأ الإعداد <IcArrow dir="right" />
			</BtnPrimary>
		</motion.div>
	);
}

/* ─── Step 1: Plan ────────────────────────────────────────── */
const PLANS = [
	{
		id: 1, key: 'starter',
		name: 'أساسية', tier: 'Starter',
		dotColor: '#4ade80',
		priceMonthly: 199, priceYearly: 149,
		badge: null, featured: false,
		features: ['٥٠٠ طلب / شهر', '١ مستخدم', '١ متجر', 'دعم بريد إلكتروني'],
	},
	{
		id: 2, key: 'pro',
		name: 'احترافية', tier: 'Pro',
		dotColor: '#818cf8',
		priceMonthly: 499, priceYearly: 399,
		badge: 'الأكثر طلبًا', featured: true,
		features: ['طلبات غير محدودة', '٥ مستخدمين', '٣ متاجر', 'دعم أولوية ٢٤/٧', 'تقارير تفصيلية', 'API كامل'],
	},
	{
		id: 3, key: 'enterprise',
		name: 'مؤسسية', tier: 'Enterprise',
		dotColor: '#a855f7',
		priceMonthly: 999, priceYearly: 799,
		badge: 'للشركات', featured: false,
		features: ['كل شيء غير محدود', 'مستخدمون غير محدودون', 'API مخصص', 'مدير حساب مخصص'],
	},
];

/* ── Feature row — matches your PricingSection SVG badge icon ── */
function PlanFeature({ label, featured }) {
	return (
		<div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '4px 0', direction: 'rtl' }}>
			<svg width="18" height="18" viewBox="0 0 20 20" fill="none" style={{ flexShrink: 0 }}>
				<path d="M6.98 10l2.01 2.02 4.03-4.04"
					stroke={featured ? '#fff' : '#6763AF'}
					strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" />
				<path d="M8.96 2.04a1.5 1.5 0 0 1 2.08 0l1.32 1.13c.25.22.72.39 1.05.39h1.42c.88 0 1.61.72 1.61 1.61v1.42c0 .32.17.8.38 1.05l1.14 1.32a1.5 1.5 0 0 1 0 2.08l-1.14 1.32c-.21.25-.38.72-.38 1.05v1.42c0 .88-.73 1.61-1.61 1.61H13.4c-.32 0-.8.17-1.05.38l-1.32 1.14a1.5 1.5 0 0 1-2.08 0L7.64 16.8c-.25-.21-.72-.38-1.05-.38H5.15c-.88 0-1.61-.73-1.61-1.61V13.4c0-.33-.18-.8-.39-1.05L2.03 11.04a1.5 1.5 0 0 1 0-2.08l1.12-1.3c.21-.25.39-.73.39-1.06V5.18c0-.88.73-1.61 1.61-1.61H6.6c.32 0 .8-.17 1.04-.39z"
					stroke={featured ? 'rgba(255,255,255,0.5)' : '#6763AF'}
					strokeWidth="1.1" strokeLinecap="round" strokeLinejoin="round" />
			</svg>
			<span style={{
				fontSize: 12,
				color: featured ? 'rgba(255,255,255,0.82)' : 'var(--text-2)',
				lineHeight: 1.5,
			}}>{label}</span>
		</div>
	);
}

function PlanStep({ onNext, onBack }) {
	const [selected, setSelected] = useState(null);
	const [isYearly, setIsYearly] = useState(false);

	const go = () => {
		if (!selected) { toast.error('يرجى اختيار خطة'); return; }
		onNext();
	};

	return (
		<motion.div key="plan" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -16 }} transition={{ duration: .3 }}>

			{/* Header */}
			<div style={{ marginBottom: 24 }}>
				<h2 style={{ fontSize: 22, fontWeight: 900, color: 'var(--text)', letterSpacing: '-0.4px', marginBottom: 6 }}>اختر خطتك</h2>
				<p style={{ fontSize: 13.5, color: 'var(--text-3)' }}>يمكنك الترقية أو التخفيض في أي وقت</p>
			</div>

			{/* Monthly / Yearly toggle */}
			<div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 12, direction: 'rtl', marginBottom: 28 }}>
				<span style={{ fontSize: 13, fontWeight: !isYearly ? 700 : 400, color: !isYearly ? 'var(--text)' : 'var(--text-3)', transition: 'color .2s' }}>
					شهري
				</span>
				<div
					onClick={() => setIsYearly(v => !v)}
					style={{
						width: 44, height: 24, borderRadius: 12,
						background: isYearly ? '#1b1945' : 'var(--border)',
						position: 'relative', cursor: 'pointer', transition: 'background .3s',
					}}
				>
					<div style={{
						position: 'absolute', top: 3,
						left: isYearly ? 23 : 3,
						width: 18, height: 18, borderRadius: '50%',
						background: '#fff', transition: 'left .3s',
						boxShadow: '0 1px 4px rgba(0,0,0,.2)',
					}} />
				</div>
				<span style={{ fontSize: 13, fontWeight: isYearly ? 700 : 400, color: isYearly ? 'var(--text)' : 'var(--text-3)', transition: 'color .2s' }}>
					سنوي
				</span>
				{isYearly && (
					<motion.span initial={{ opacity: 0, x: -6 }} animate={{ opacity: 1, x: 0 }}
						style={{ fontSize: 11, fontWeight: 700, background: '#BAEB33', color: '#fff', padding: '2px 8px', borderRadius: 20 }}>
						وفّر ٢٠٪
					</motion.span>
				)}
			</div>

			{/* Cards */}
			<div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 14, marginBottom: 24, alignItems: 'center' }}>
				{PLANS.map((p, index) => {
					const price = isYearly ? p.priceYearly : p.priceMonthly;
					const isSelected = selected === p.id;
					return (
						<motion.div
							key={p.id}
							initial={{ opacity: 0, y: 20 }}
							animate={{ opacity: 1, y: 0 }}
							transition={{ delay: index * 0.08, duration: .35, ease: [.34, 1.56, .64, 1] }}
							onClick={() => setSelected(p.id)}
							style={{
								position: 'relative',
								borderRadius: 20,
								padding: p.featured ? '28px 20px' : '24px 18px',
								direction: 'rtl',
								cursor: 'pointer',
								background: p.featured ? '#1b1945' : 'var(--surface)',
								border: p.featured
									? `2px solid ${isSelected ? '#BAEB33' : 'transparent'}`
									: `2px solid ${isSelected ? 'var(--p)' : '#6763AF14'}`,
								boxShadow: p.featured
									? `0 24px 48px rgba(27,25,69,.28)${isSelected ? ', 0 0 0 3px rgba(186,235,51,.2)' : ''}`
									: `0 8px 28px rgba(103,99,175,.08)${isSelected ? ', 0 0 0 3px var(--p-glow)' : ''}`,
								transform: p.featured ? 'scale(1.03)' : 'scale(1)',
								zIndex: p.featured ? 2 : 1,
								transition: 'border-color .2s, box-shadow .2s',
							}}
						>
							{/* Top badge strip */}
							{p.badge && (
								<div style={{
									position: 'absolute', top: 0, left: 0, right: 0,
									background: p.featured ? '#BAEB33' : 'var(--p)',
									color: '#fff',
									fontSize: 9.5, fontWeight: 700, textAlign: 'center',
									padding: '4px 0', letterSpacing: '.6px',
									borderRadius: '18px 18px 0 0',
								}}>{p.badge}</div>
							)}

							<div style={{ marginTop: p.badge ? 18 : 0 }}>

								{/* Selected checkmark */}
								<AnimatePresence>
									{isSelected && (
										<motion.div
											initial={{ scale: 0 }} animate={{ scale: 1 }} exit={{ scale: 0 }}
											style={{
												position: 'absolute', top: p.badge ? 30 : 12, left: 12,
												width: 22, height: 22, borderRadius: '50%',
												background: p.featured ? '#BAEB33' : 'var(--p)',
												display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff',
											}}
										>
											<IcCheck size={11} />
										</motion.div>
									)}
								</AnimatePresence>

								{/* Tier dot + label */}
								<div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 10, direction: 'rtl' }}>
									<span style={{
										width: 7, height: 7, borderRadius: '50%', flexShrink: 0,
										background: p.dotColor,
										boxShadow: `0 0 6px ${p.dotColor}`,
									}} />
									<span style={{ fontSize: 11, color: p.featured ? 'rgba(255,255,255,.5)' : 'var(--text-3)', fontWeight: 500 }}>{p.tier}</span>
									<span style={{ fontSize: 14, fontWeight: 800, color: p.featured ? '#fff' : 'var(--text)' }}>{p.name}</span>
								</div>

								{/* Price */}
								<div style={{ display: 'flex', alignItems: 'baseline', gap: 4, marginBottom: 4, direction: 'rtl' }}>
									<span style={{
										fontSize: p.featured ? 32 : 26,
										fontWeight: 900,
										color: p.featured ? '#fff' : 'var(--text)',
										fontFamily: 'var(--mono)', lineHeight: 1,
										letterSpacing: '-1px',
									}}>
										{price.toLocaleString()}
									</span>
									<span style={{ fontSize: 11, color: p.featured ? 'rgba(255,255,255,.55)' : 'var(--text-3)', fontWeight: 500 }}>
										ج.م / شهر
									</span>
								</div>

								{isYearly && (
									<div style={{ fontSize: 10.5, color: p.featured ? 'rgba(255,255,255,.4)' : 'var(--text-3)', marginBottom: 8 }}>
										يُدفع {(price * 12).toLocaleString()} ج.م سنوياً
									</div>
								)}

								{/* CTA */}
								<button
									style={{
										width: '100%', padding: '10px 0',
										borderRadius: 99, border: 'none',
										fontFamily: 'var(--font)', fontSize: 13, fontWeight: 700,
										cursor: 'pointer', marginBottom: 18, marginTop: 6,
										background: p.featured ? '#BAEB33' : '#1b1945',
										color: '#fff',
										boxShadow: p.featured ? '0 4px 16px rgba(186,235,51,.35)' : '0 4px 16px rgba(27,25,69,.25)',
										transition: 'opacity .18s, transform .18s',
									}}
									onMouseEnter={e => { e.currentTarget.style.opacity = '.88'; e.currentTarget.style.transform = 'translateY(-1px)'; }}
									onMouseLeave={e => { e.currentTarget.style.opacity = '1'; e.currentTarget.style.transform = 'none'; }}
									onClick={e => { e.stopPropagation(); setSelected(p.id); go(); }}
								>
									ابدأ الآن
								</button>

								{/* Divider */}
								<div style={{ height: 1, background: p.featured ? 'rgba(255,255,255,.1)' : 'var(--border)', marginBottom: 14 }} />

								{/* Features list */}
								<div style={{
									background: p.featured ? 'rgba(255,255,255,.05)' : '#F8F9FFC7',
									border: `1px solid ${p.featured ? 'rgba(255,255,255,.08)' : '#6763AF14'}`,
									borderRadius: 12, padding: '10px 10px 6px',
									display: 'flex', flexDirection: 'column',
								}}>
									{p.features.map((f, i) => (
										<PlanFeature key={i} label={f} featured={p.featured} />
									))}
								</div>
							</div>
						</motion.div>
					);
				})}
			</div>

			<div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
				<BtnGhost onClick={onBack}>رجوع</BtnGhost>
				<BtnPrimary onClick={go} disabled={!selected}>متابعة <IcArrow dir="right" /></BtnPrimary>
			</div>
		</motion.div>
	);
}

/* ─── Step 2: Company ─────────────────────────────────────── */
const COUNTRIES = ['مصر', 'السعودية', 'الإمارات', 'الكويت', 'قطر', 'البحرين', 'عمان', 'الأردن', 'لبنان'];
const CURRENCIES = [
	{ code: 'EGP', label: 'جنيه مصري (EGP)' },
	{ code: 'SAR', label: 'ريال سعودي (SAR)' },
	{ code: 'AED', label: 'درهم إماراتي (AED)' },
	{ code: 'USD', label: 'دولار أمريكي (USD)' },
];

function CompanyStep({ onNext, onBack }) {
	const [form, setForm] = useState({ country: '', currency: '', name: '', tax: '', commercial: '', phone: '', website: '', address: '' });
	const [touched, setTouched] = useState({});
	const [saving, setSaving] = useState(false);

	const set = (k, v) => setForm(p => ({ ...p, [k]: v }));
	const touch = k => setTouched(p => ({ ...p, [k]: true }));

	const errs = {
		country: !form.country ? 'الدولة مطلوبة' : '',
		currency: !form.currency ? 'العملة مطلوبة' : '',
	};

	const save = async () => {
		setTouched({ country: true, currency: true });
		if (errs.country || errs.currency) return;
		setSaving(true);
		await new Promise(r => setTimeout(r, 800));
		setSaving(false);
		toast.success('تم حفظ بيانات الشركة ✓');
		onNext();
	};

	return (
		<motion.div key="co" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -16 }} transition={{ duration: .3 }}>
			<div style={{ marginBottom: 24 }}>
				<h2 style={{ fontSize: 22, fontWeight: 900, color: 'var(--text)', letterSpacing: '-0.4px', marginBottom: 6 }}>بيانات شركتك</h2>
				<div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
					<p style={{ fontSize: 13.5, color: 'var(--text-3)' }}>تظهر في الفواتير والتقارير الرسمية</p>
					<span style={{ fontSize: 11.5, background: 'var(--p-xlight)', color: 'var(--p)', padding: '2px 10px', borderRadius: 99, fontWeight: 600, flexShrink: 0 }}>
						* الدولة والعملة إلزاميتان
					</span>
				</div>
			</div>

			{/* Row 1: country + currency */}
			<div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
				<Field label="الدولة" required error={touched.country && errs.country}>
					<ObSelect value={form.country} onChange={e => set('country', e.target.value)} onBlur={() => touch('country')} error={touched.country && errs.country} icon="🌍">
						<option value="">اختر الدولة</option>
						{COUNTRIES.map(c => <option key={c} value={c}>{c}</option>)}
					</ObSelect>
				</Field>
				<Field label="العملة" required error={touched.currency && errs.currency}>
					<ObSelect value={form.currency} onChange={e => set('currency', e.target.value)} onBlur={() => touch('currency')} error={touched.currency && errs.currency} icon="💵">
						<option value="">اختر العملة</option>
						{CURRENCIES.map(c => <option key={c.code} value={c.code}>{c.label}</option>)}
					</ObSelect>
				</Field>
			</div>

			{/* Company name - full width */}
			<Field label="اسم الشركة / المتجر">
				<InputWrap icon={<IcBuild />}>
					<input className="ob-input" placeholder="مثال: شركة طلباتي تك" value={form.name} onChange={e => set('name', e.target.value)} />
				</InputWrap>
			</Field>

			{/* Row 2 */}
			<div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
				<Field label="الرقم الضريبي">
					<InputWrap icon={<span style={{ fontSize: 13, fontWeight: 700 }}>%</span>}>
						<input className="ob-input" placeholder="اختياري" value={form.tax} onChange={e => set('tax', e.target.value)} style={{ direction: 'ltr', textAlign: 'right' }} />
					</InputWrap>
				</Field>
				<Field label="السجل التجاري">
					<InputWrap icon="📋">
						<input className="ob-input" placeholder="اختياري" value={form.commercial} onChange={e => set('commercial', e.target.value)} style={{ direction: 'ltr', textAlign: 'right' }} />
					</InputWrap>
				</Field>
				<Field label="الهاتف">
					<InputWrap icon={<IcPhone />}>
						<input className="ob-input" placeholder="+20 xxx xxxx" value={form.phone} onChange={e => set('phone', e.target.value)} style={{ direction: 'ltr', textAlign: 'right' }} />
					</InputWrap>
				</Field>
				<Field label="الموقع الإلكتروني">
					<InputWrap icon={<IcGlobe />}>
						<input className="ob-input" placeholder="https://mystore.com" value={form.website} onChange={e => set('website', e.target.value)} style={{ direction: 'ltr', textAlign: 'left' }} />
					</InputWrap>
				</Field>
			</div>

			{/* Address */}
			<Field label="العنوان">
				<div style={{ position: 'relative' }}>
					<span style={{ position: 'absolute', right: 14, top: 13, color: 'var(--text-3)', display: 'flex', pointerEvents: 'none' }}>📍</span>
					<textarea className="ob-textarea" rows={2} placeholder="العنوان بالتفصيل (اختياري)" value={form.address} onChange={e => set('address', e.target.value)} />
				</div>
			</Field>

			<div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', marginTop: 4 }}>
				<BtnGhost onClick={onBack}>رجوع</BtnGhost>
				<BtnPrimary onClick={save} loading={saving}>حفظ ومتابعة <IcArrow dir="right" /></BtnPrimary>
			</div>
		</motion.div>
	);
}

/* ─── Step 3: Store ───────────────────────────────────────── */
const STORE_PROVIDERS = [
	{
		key: 'easyorder', label: 'إيزي أوردر', img: "/integrate/easyorder.png", emoji: '🛒', desc: 'ربط مباشر مع منصة إيزي أوردر',
		fields: [{ k: 'apiKey', label: 'مفتاح API', t: 'password' }, { k: 'whCreate', label: 'Webhook Create Secret', t: 'password' }, { k: 'whUpdate', label: 'Webhook Update Secret', t: 'password' }]
	},
	{
		key: 'shopify', label: 'Shopify', img: "/integrate/shopify.png", emoji: '🟢', desc: 'ربط متجر Shopify الخاص بك',
		fields: [{ k: 'apiKey', label: 'مفتاح API', t: 'password' }, { k: 'clientSecret', label: 'Client Secret', t: 'password' }, { k: 'webhookSecret', label: 'Webhook Secret', t: 'password' }]
	},
	{
		key: 'woo', label: 'WooCommerce', img: "/integrate/WooCommerce.png", emoji: '🛍️', desc: 'ربط متجر WooCommerce',
		fields: [{ k: 'apiKey', label: 'مفتاح API', t: 'password' }, { k: 'clientSecret', label: 'Client Secret', t: 'password' }]
	},
];

function StoreStep({ onNext, onBack }) {
	const [active, setActive] = useState(null);
	const [fd, setFd] = useState({});
	const [url, setUrl] = useState('');
	const [connected, setConnected] = useState({});
	const [saving, setSaving] = useState(false);

	const provider = STORE_PROVIDERS.find(p => p.key === active);

	const save = async () => {
		if (!url.trim()) { toast.error('يرجى إدخال رابط المتجر'); return; }
		setSaving(true);
		await new Promise(r => setTimeout(r, 900));
		setSaving(false);
		toast.success(`تم ربط ${provider.label} بنجاح ✓`);
		setConnected(p => ({ ...p, [active]: true }));
		setActive(null); setFd({}); setUrl('');
	};

	return (
		<motion.div key="store" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -16 }} transition={{ duration: .3 }}>
			<div style={{ marginBottom: 24 }}>
				<h2 style={{ fontSize: 22, fontWeight: 900, color: 'var(--text)', letterSpacing: '-0.4px', marginBottom: 6 }}>اربط متجرك</h2>
				<p style={{ fontSize: 13.5, color: 'var(--text-3)' }}>أضف متجرك لاستقبال الطلبات تلقائياً — يمكن إضافة أكثر من متجر</p>
			</div>

			<AnimatePresence mode="wait">
				{!active ? (
					<motion.div key="list" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
						<div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 28 }}>
							{STORE_PROVIDERS.map(p => (
								<div
									key={p.key}
									className={`prov-card${connected[p.key] ? ' connected' : ''}`}
									onClick={() => !connected[p.key] && setActive(p.key)}
									style={{ cursor: connected[p.key] ? 'default' : 'pointer' }}
								>
									{/* Logo container */}
									<div style={{
										width: 44, height: 44, borderRadius: 12, flexShrink: 0,
										background: connected[p.key] ? '#f0fdf4' : 'var(--surface2)',
										border: `1.5px solid ${connected[p.key] ? '#bbf7d0' : 'var(--border)'}`,
										display: 'flex', alignItems: 'center', justifyContent: 'center',
										overflow: 'hidden',
										transition: 'all .2s',
									}}>
										<img
											src={p.img}
											alt={p.label}
											style={{ width: 28, height: 28, objectFit: 'contain' }}
											onError={e => { e.currentTarget.style.display = 'none'; e.currentTarget.parentElement.innerHTML = `<span style="font-size:22px">${p.emoji || '🔗'}</span>`; }}
										/>
									</div>

									{/* Text */}
									<div style={{ flex: 1, minWidth: 0 }}>
										<div style={{ fontSize: 14, fontWeight: 700, color: 'var(--text)' }}>{p.label}</div>
										<div style={{ fontSize: 12, color: 'var(--text-3)', marginTop: 2, lineHeight: 1.4 }}>{p.desc}</div>
									</div>

									{/* Status badge */}
									{connected[p.key] ? (
										<motion.div
											initial={{ scale: 0 }} animate={{ scale: 1 }}
											style={{
												display: 'flex', alignItems: 'center', gap: 5,
												color: '#10b981', fontSize: 12, fontWeight: 700,
												background: '#f0fdf4', border: '1px solid #bbf7d0',
												borderRadius: 99, padding: '4px 10px', flexShrink: 0,
											}}
										>
											<IcCheck /> متصل
										</motion.div>
									) : (
										<div style={{
											fontSize: 12, color: 'var(--p)', fontWeight: 700,
											border: '1.5px solid var(--p)', borderRadius: 8,
											padding: '4px 12px', flexShrink: 0,
											transition: 'background .15s, color .15s',
										}}
											onMouseEnter={e => { e.currentTarget.style.background = 'var(--p)'; e.currentTarget.style.color = '#fff'; }}
											onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = 'var(--p)'; }}
										>
											ربط
										</div>
									)}
								</div>
							))}
						</div>
						<div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
							<BtnGhost onClick={onBack}>رجوع</BtnGhost>
							<BtnGhost onClick={onNext}>تخطي الآن</BtnGhost>
							{Object.keys(connected).length > 0 && <BtnPrimary onClick={onNext}>متابعة <IcArrow dir="right" /></BtnPrimary>}
						</div>
					</motion.div>
				) : (
					<motion.div key="form" initial={{ opacity: 0, x: 12 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -12 }}>
						<div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 22 }}>
							
							<div style={{
										width: 44, height: 44, borderRadius: 12, flexShrink: 0,
										background:  'var(--surface2)',
										border: `1.5px solid  var(--border)'}`,
										display: 'flex', alignItems: 'center', justifyContent: 'center',
										overflow: 'hidden',
										transition: 'all .2s',
									}}>
										<img
											src={provider.img}
											alt={provider.label}
											style={{ width: 28, height: 28, objectFit: 'contain' }}
											onError={e => { e.currentTarget.style.display = 'none'; e.currentTarget.parentElement.innerHTML = `<span style="font-size:22px">${provider.emoji || '🔗'}</span>`; }}
										/>
									</div>
							<div>

							</div>
							<div>
								<div style={{ fontSize: 15, fontWeight: 700, color: 'var(--text)' }}>{provider.label}</div>
								<div style={{ fontSize: 12, color: 'var(--text-3)' }}>أدخل بيانات الربط</div>
							</div>
						</div>
						<Field label="رابط المتجر" required>
							<InputWrap icon={<IcGlobe />}>
								<input className="ob-input" placeholder="https://mystore.example.com" value={url} onChange={e => setUrl(e.target.value)} style={{ direction: 'ltr', textAlign: 'left' }} />
							</InputWrap>
						</Field>
						{provider.fields.map(f => (
							<Field key={f.k} label={f.label}>
								<InputWrap icon={<IcLock />}>
									<input className="ob-input" type={f.t} placeholder={f.label} value={fd[f.k] || ''} onChange={e => setFd(p => ({ ...p, [f.k]: e.target.value }))} style={{ direction: 'ltr', textAlign: 'left' }} />
								</InputWrap>
							</Field>
						))}
						<div style={{ display: 'flex', gap: 10, marginTop: 8 }}>
							<BtnGhost onClick={() => { setActive(null); setFd({}); setUrl(''); }}>إلغاء</BtnGhost>
							<BtnPrimary onClick={save} loading={saving} style={{ flex: 1 }}>حفظ وربط المتجر</BtnPrimary>
						</div>
					</motion.div>
				)}
			</AnimatePresence>
		</motion.div>
	);
}

/* ─── Step 4: Shipping ────────────────────────────────────── */
const SHIP_PROVIDERS = [
	{ key: 'bosta', label: 'بوسطة', img : "/integrate/bosta.png" , emoji: '📦', desc: 'أسرع شركات التوصيل في مصر', fields: [{ k: 'apiKey', label: 'مفتاح API', t: 'password', req: true }] },
	{ key: 'jt', label: 'J&T Express', img : "/integrate/5.png" , emoji: '🚚', desc: 'تغطية واسعة في المنطقة العربية', fields: [{ k: 'apiKey', label: 'مفتاح API', t: 'password', req: true }, { k: 'cid', label: 'معرف العميل', t: 'text', req: true }] },
	{ key: 'turbo', label: 'تيربو', img : "/integrate/4.png" , emoji: '⚡', desc: 'توصيل سريع داخل المدن', fields: [{ k: 'apiKey', label: 'مفتاح API', t: 'password', req: true }, { k: 'accId', label: 'معرف الحساب', t: 'text', req: true }] },
];

function ShippingStep({ onNext, onBack }) {
	const [active, setActive] = useState(null);
	const [fd, setFd] = useState({});
	const [connected, setConnected] = useState({});
	const [saving, setSaving] = useState(false);

	const provider = SHIP_PROVIDERS.find(p => p.key === active);

	const save = async () => {
		const miss = provider.fields.filter(f => f.req && !fd[f.k]?.trim());
		if (miss.length) { toast.error('يرجى ملء الحقول المطلوبة'); return; }
		setSaving(true);
		await new Promise(r => setTimeout(r, 900));
		setSaving(false);
		toast.success(`تم ربط ${provider.label} بنجاح ✓`);
		setConnected(p => ({ ...p, [active]: true }));
		setActive(null); setFd({});
	};

	return (
		<motion.div key="ship" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -16 }} transition={{ duration: .3 }}>
			<div style={{ marginBottom: 24 }}>
				<h2 style={{ fontSize: 22, fontWeight: 900, color: 'var(--text)', letterSpacing: '-0.4px', marginBottom: 6 }}>اربط شركة الشحن</h2>
				<p style={{ fontSize: 13.5, color: 'var(--text-3)' }}>أرسل الطلبات لشركة الشحن تلقائياً بضغطة واحدة</p>
			</div>

			<AnimatePresence mode="wait">
				{!active ? (
					<motion.div key="slist" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
						<div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 28 }}>
							{SHIP_PROVIDERS.map(p => (
								<div key={p.key} className={`prov-card${connected[p.key] ? ' connected' : ''}`}
									onClick={() => !connected[p.key] && setActive(p.key)}>
									
									<div style={{
										width: 44, height: 44, borderRadius: 12, flexShrink: 0,
										background: connected[p.key] ? '#f0fdf4' : 'var(--surface2)',
										border: `1.5px solid ${connected[p.key] ? '#bbf7d0' : 'var(--border)'}`,
										display: 'flex', alignItems: 'center', justifyContent: 'center',
										overflow: 'hidden',
										transition: 'all .2s',
									}}>
										<img
											src={p.img}
											alt={p.label}
											style={{ width: 28, height: 28, objectFit: 'contain' }}
											onError={e => { e.currentTarget.style.display = 'none'; e.currentTarget.parentElement.innerHTML = `<span style="font-size:22px">${p.emoji || '🔗'}</span>`; }}
										/>
									</div>
									

									<div style={{ flex: 1 }}>
										<div style={{ fontSize: 14, fontWeight: 700, color: 'var(--text)' }}>{p.label}</div>
										<div style={{ fontSize: 12, color: 'var(--text-3)', marginTop: 2 }}>{p.desc}</div>
									</div>
									{connected[p.key]
										? <div style={{ display: 'flex', alignItems: 'center', gap: 5, color: '#10b981', fontSize: 13, fontWeight: 700 }}><IcCheck /> متصل</div>
										: <div style={{ fontSize: 12, color: 'var(--p)', fontWeight: 700, border: '1.5px solid var(--p)', borderRadius: 8, padding: '4px 12px' }}>ربط</div>
									}
								</div>
							))}
						</div>
						<div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
							<BtnGhost onClick={onBack}>رجوع</BtnGhost>
							<BtnPrimary onClick={onNext}>
								{Object.keys(connected).length > 0 ? 'إنهاء الإعداد' : 'تخطي وإنهاء'} <IcArrow dir="right" />
							</BtnPrimary>
						</div>
					</motion.div>
				) : (
					<motion.div key="sform" initial={{ opacity: 0, x: 12 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -12 }}>
						<div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 22 }}>
							
							<div style={{
										width: 44, height: 44, borderRadius: 12, flexShrink: 0,
										background:  'var(--surface2)',
										border: `1.5px solid  var(--border)'}`,
										display: 'flex', alignItems: 'center', justifyContent: 'center',
										overflow: 'hidden',
										transition: 'all .2s',
									}}>
										<img
											src={provider.img}
											alt={provider.label}
											style={{ width: 28, height: 28, objectFit: 'contain' }}
											onError={e => { e.currentTarget.style.display = 'none'; e.currentTarget.parentElement.innerHTML = `<span style="font-size:22px">${provider.emoji || '🔗'}</span>`; }}
										/>
									</div>
							<div>

							</div>
							<div>
								<div style={{ fontSize: 15, fontWeight: 700, color: 'var(--text)' }}>{provider.label}</div>
								<div style={{ fontSize: 12, color: 'var(--text-3)' }}>أدخل بيانات الربط</div>
							</div>
						</div>
						{provider.fields.map(f => (
							<Field key={f.k} label={f.label} required={f.req}>
								<InputWrap icon={<IcLock />}>
									<input className="ob-input" type={f.t} placeholder={f.label} value={fd[f.k] || ''} onChange={e => setFd(p => ({ ...p, [f.k]: e.target.value }))} style={{ direction: 'ltr', textAlign: 'left' }} />
								</InputWrap>
							</Field>
						))}
						<div style={{ display: 'flex', gap: 10, marginTop: 8 }}>
							<BtnGhost onClick={() => { setActive(null); setFd({}); }}>إلغاء</BtnGhost>
							<BtnPrimary onClick={save} loading={saving} style={{ flex: 1 }}>حفظ وربط الشحن</BtnPrimary>
						</div>
					</motion.div>
				)}
			</AnimatePresence>
		</motion.div>
	);
}

/* ─── Main ────────────────────────────────────────────────── */
export default function OnboardingPage() {
	const [step, setStep] = useState(0);
	const next = () => setStep(s => Math.min(s + 1, 4));
	const back = () => setStep(s => Math.max(s - 1, 0));

	const finish = () => {
		toast.success('اكتمل الإعداد! مرحباً بك 🎉');
		setTimeout(() => { window.location.href = '/orders'; }, 1200);
	};

	return (
		<>
			<style dangerouslySetInnerHTML={{ __html: CSS }} />

			<div style={{
				minHeight: '100vh',
				background: 'linear-gradient(145deg, #eeeef8 0%, #e8e7f4 50%, #f3f3fb 100%)',
				display: 'flex', alignItems: 'center', justifyContent: 'center',
				padding: 24, position: 'relative',
			}}>
				{/* bg dot grid */}
				<div style={{
					position: 'fixed', inset: 0, pointerEvents: 'none', zIndex: 0,
					backgroundImage: 'radial-gradient(circle, rgba(103,99,175,.09) 1px, transparent 1px)',
					backgroundSize: '28px 28px',
				}} />
				{/* ambient orb */}
				<motion.div
					style={{ position: 'fixed', bottom: '-8%', right: '5%', width: 400, height: 400, borderRadius: '50%', background: 'radial-gradient(circle, rgba(103,99,175,.1), transparent 70%)', filter: 'blur(60px)', pointerEvents: 'none', zIndex: 0 }}
					animate={{ scale: [1, 1.1, 1], y: [0, -20, 0] }}
					transition={{ duration: 12, repeat: Infinity, ease: 'easeInOut' }}
				/>

				<motion.div
					initial={{ opacity: 0, scale: .97, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} transition={{ duration: .5, ease: [.16, 1, .3, 1] }}
					style={{
						display: 'flex',
						borderRadius: 'var(--radius-xl)',
						boxShadow: '0 28px 80px rgba(103,99,175,.18), 0 4px 16px rgba(0,0,0,.06)',
						border: '1px solid rgba(255,255,255,.85)',
						overflow: 'hidden',
						width: '100%',
						maxWidth: step === 0 ? 1000 : (step === 1 ? 1160 : (step === 2 ? 960 : 900)),
						minHeight: 580,
						position: 'relative', zIndex: 1,
						transition: 'max-width .35s ease',
					}}
				>

					<Sidebar step={step} />

					{/* Content pane */}
					<div style={{
						flex: 1, background: 'var(--surface)',
						padding: '44px 40px',
						overflowY: 'auto', maxHeight: '88vh',
					}}>
						<AnimatePresence mode="wait">
							{step === 0 && <WelcomeStep key="w" onNext={next} />}
							{step === 1 && <PlanStep key="p" onNext={next} onBack={back} />}
							{step === 2 && <CompanyStep key="c" onNext={next} onBack={back} />}
							{step === 3 && <StoreStep key="s" onNext={next} onBack={back} />}
							{step === 4 && <ShippingStep key="sh" onNext={finish} onBack={back} />}
						</AnimatePresence>
					</div>
				</motion.div>
			</div>
		</>
	);
}