'use client';

import { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import toast from 'react-hot-toast';
import api from '@/utils/api';
import { useForm, Controller } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import { getUser } from '@/hook/getUser';
import { RefreshCw, Webhook } from 'lucide-react';
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
function WelcomeStep({ onNext, open, nextLoading }) {
	const tiles = [
		{ emoji: '📦', title: 'إدارة الطلبات', desc: 'استقبل وتابع طلباتك لحظةً بلحظة' },
		{ emoji: '🚚', title: 'تتبع الشحنات', desc: 'ربط مباشر مع شركات التوصيل' },
		{ emoji: '📊', title: 'تقارير ذكية', desc: 'تحليلات مفصّلة لنمو متجرك' },
		{ emoji: '🔗', title: 'تكامل المنصات', desc: 'Shopify وWooCommerce وأكثر' },
	];

	if (!open) return null;
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

			<BtnPrimary onClick={onNext} loading={nextLoading} disabled={nextLoading} style={{ width: '100%' }}>
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


function PlanSkeleton() {
	return (
		<div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 14, marginBottom: 24, alignItems: 'center' }}>
			{[0, 1, 2].map(i => {
				const isCenter = i === 1;
				return (
					<div key={i} style={{
						position: 'relative',
						borderRadius: 20,
						padding: isCenter ? '28px 20px' : '24px 18px',
						height: isCenter ? 350 : 300,
						background: isCenter ? '#1b1945' : 'var(--surface)',
						border: isCenter ? '2px solid transparent' : '2px solid rgba(103,99,175,.08)',
						transform: isCenter ? 'scale(1.03)' : 'scale(1)',
						opacity: 1,
						overflow: 'hidden',
					}}>
						{/* top badge skeleton */}
						<div style={{
							position: 'absolute', top: 10, left: '50%', transform: 'translateX(-50%)',
							width: isCenter ? 120 : 90, height: 14, borderRadius: 10, background: 'rgba(255,255,255,0.08)'
						}} />

						<div style={{ marginTop: 36 }}>
							{/* checkmark placeholder */}
							<div style={{
								position: 'absolute', top: 22, left: 12,
								width: 22, height: 22, borderRadius: '50%',
								background: isCenter ? 'rgba(186,235,51,0.18)' : 'rgba(103,99,175,0.06)'
							}} />

							{/* tier / name skeleton */}
							<div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 10, direction: 'rtl' }}>
								<div style={{ width: 7, height: 7, borderRadius: '50%', background: 'rgba(255,255,255,0.06)' }} />
								<div style={{ width: 80, height: 12, borderRadius: 6, background: 'rgba(255,255,255,0.06)' }} />
								<div style={{ flex: 1, width: 120, height: 16, borderRadius: 6, background: isCenter ? 'rgba(255,255,255,0.12)' : 'rgba(0,0,0,0.04)' }} />
							</div>

							{/* price skeleton */}
							<div style={{ display: 'flex', alignItems: 'baseline', gap: 8, marginBottom: 10, direction: 'rtl' }}>
								<div style={{ width: isCenter ? 120 : 90, height: isCenter ? 34 : 28, borderRadius: 6, background: isCenter ? 'rgba(255,255,255,0.12)' : 'rgba(0,0,0,0.04)' }} />
								<div style={{ width: 60, height: 12, borderRadius: 6, background: 'rgba(255,255,255,0.05)' }} />
							</div>

							{/* CTA skeleton */}
							<div style={{ width: '100%', height: 40, borderRadius: 99, background: isCenter ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.06)', marginBottom: 12 }} />

							{/* divider */}
							<div style={{ height: 1, background: isCenter ? 'rgba(255,255,255,0.06)' : 'var(--border)', marginBottom: 14 }} />

							{/* features skeleton (a few short lines) */}
							<div style={{ background: isCenter ? 'rgba(255,255,255,0.03)' : '#F8F9FFC7', borderRadius: 12, padding: '10px', display: 'flex', flexDirection: 'column', gap: 8 }}>
								{[0, 1, 2, 3].map(r => (
									<div key={r} style={{ width: `${60 + r * 8}%`, height: 10, borderRadius: 6, background: 'rgba(0,0,0,0.06)' }} />
								))}
							</div>
						</div>
					</div>
				);
			})}
		</div>
	);
}

function PlanStep({ onNext, onBack, selectedId, open, nextLoading }) {
	const [plans, setPlans] = useState([]);
	const [isLoading, setIsLoading] = useState(true);
	const [selected, setSelected] = useState(selectedId || null);
	const [isYearly, setIsYearly] = useState(false);

	useEffect(() => {
		setSelected(selectedId)
	}, [selectedId])
	useEffect(() => {
		let mounted = true;
		const fetchAvailablePlans = async () => {
			setIsLoading(true);
			try {
				const { data } = await api.get("/plans/available");
				const formatted = (data || []).map((plan, index) => {
					const price = Number(plan.price || 0);
					return {
						id: plan.id,
						name: plan.name,
						priceMonthly: price,
						priceYearly: Math.round(price * 0.8),
						badge: plan.isPopular ? 'الأكثر شيوعاً' : null,
						dotColor: plan.color || (index === 0 ? '#8B88C1' : index === 1 ? '#BAEB33' : '#FF5C2B'),
						tier: plan.duration || 'باقة',
						isPopular: !!plan.isPopular,
						features: [
							...(Array.isArray(plan.features) ? plan.features : []),
							`${Number(plan.usersLimit ?? plan.maxUsers ?? 1)} مستخدمين`,
							`${Number(plan.shippingCompaniesLimit ?? plan.maxShippingCompanies ?? 0)} شركات شحن`
						]
					};
				});

				if (!mounted) return;

				// Place the most popular plan at center (index 1). If none, keep original order but ensure middle style.
				const arranged = [...formatted];
				const popularIndex = arranged.findIndex(p => p.isPopular);
				if (popularIndex > -1 && arranged.length >= 3) {
					const [popularPlan] = arranged.splice(popularIndex, 1);
					// insert in middle (index 1)
					arranged.splice(1, 0, popularPlan);
				} else if (arranged.length >= 3) {
					// If no popular, keep as is but ensure the middle plan is visually featured (handled in render)
				}

				setPlans(arranged);

				if (arranged.length > 0) {
					// default selection: the featured plan (the center one) or first available
					const defaultIndex = arranged.findIndex(p => p.isPopular) !== -1
						? arranged.findIndex(p => p.isPopular)
						: Math.min(1, arranged.length - 1); // prefer middle if exists
					setSelected(selectedId || arranged[defaultIndex]?.id || arranged[0].id);
				}
			} catch (err) {
				toast.error("حدث خطأ أثناء جلب الخطط");
			} finally {
				if (mounted) setIsLoading(false);
			}
		};

		fetchAvailablePlans();
		return () => { mounted = false; };
	}, []);

	// Add this to your state declarations at the top of PlanStep
	const [isSubmitting, setIsSubmitting] = useState(false);

	const go = async () => {
		if (!selected) {
			toast.error('يرجى اختيار خطة');
			return;
		}

		setIsSubmitting(true);
		try {
			// Calling your new endpoint with the selected planId and the current billing cycle
			const response = await api.post("/subscriptions/mock", {
				planId: selected,
			});

			toast.success('تم الاشتراك بنجاح');

			// Pass the response data to the next step (e.g., success screen)
			onNext(response?.data);
		} catch (err) {
			console.log(err)
			const errorMsg = err.response?.data?.message || "حدث خطأ أثناء تفعيل الاشتراك";
			toast.error(errorMsg);
		} finally {
			setIsSubmitting(false);
		}
	};

	if (!open) return null;
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
			{isLoading ? (
				<PlanSkeleton />
			) : (
				<div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 14, marginBottom: 24, alignItems: 'center' }}>
					{plans.map((p, index) => {
						const price = isYearly ? p.priceYearly : p.priceMonthly;
						const isSelected = selected === p.id;

						// Featured card is always the center (index 1) after arrangement
						const isFeatured = index === 1;

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
									padding: isFeatured ? '28px 20px' : '24px 18px',
									direction: 'rtl',
									cursor: 'pointer',
									background: isFeatured ? '#1b1945' : 'var(--surface)',
									border: isFeatured
										? `2px solid ${isSelected ? '#BAEB33' : 'transparent'}`
										: `2px solid ${isSelected ? 'var(--p)' : '#6763AF14'}`,
									boxShadow: isFeatured
										? `0 24px 48px rgba(27,25,69,.28)${isSelected ? ', 0 0 0 3px rgba(186,235,51,.2)' : ''}`
										: `0 8px 28px rgba(103,99,175,.08)${isSelected ? ', 0 0 0 3px var(--p-glow)' : ''}`,
									transform: isFeatured ? 'scale(1.03)' : 'scale(1)',
									zIndex: isFeatured ? 2 : 1,
									transition: 'border-color .2s, box-shadow .2s, transform .2s',
								}}
							>
								{/* Top badge strip */}
								{p.badge && (
									<div style={{
										position: 'absolute', top: 0, left: 0, right: 0,
										background: isFeatured ? '#BAEB33' : 'var(--p)',
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
													background: isFeatured ? '#BAEB33' : 'var(--p)',
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
										<span style={{ fontSize: 11, color: isFeatured ? 'rgba(255,255,255,.5)' : 'var(--text-3)', fontWeight: 500 }}>{p.tier}</span>
										<span style={{ fontSize: 14, fontWeight: 800, color: isFeatured ? '#fff' : 'var(--text)' }}>{p.name}</span>
									</div>

									{/* Price */}
									<div style={{ display: 'flex', alignItems: 'baseline', gap: 4, marginBottom: 4, direction: 'rtl' }}>
										<span style={{
											fontSize: isFeatured ? 32 : 26,
											fontWeight: 900,
											color: isFeatured ? '#fff' : 'var(--text)',
											fontFamily: 'var(--mono)', lineHeight: 1,
											letterSpacing: '-1px',
										}}>
											{price.toLocaleString()}
										</span>
										<span style={{ fontSize: 11, color: isFeatured ? 'rgba(255,255,255,.55)' : 'var(--text-3)', fontWeight: 500 }}>
											ج.م / شهر
										</span>
									</div>

									{isYearly && (
										<div style={{ fontSize: 10.5, color: isFeatured ? 'rgba(255,255,255,.4)' : 'var(--text-3)', marginBottom: 8 }}>
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
											background: isFeatured ? '#BAEB33' : '#1b1945',
											color: '#fff',
											boxShadow: isFeatured ? '0 4px 16px rgba(186,235,51,.35)' : '0 4px 16px rgba(27,25,69,.25)',
											transition: 'opacity .18s, transform .18s',
										}}
										disabled={isSubmitting}
										onMouseEnter={e => { e.currentTarget.style.opacity = '.88'; e.currentTarget.style.transform = 'translateY(-1px)'; }}
										onMouseLeave={e => { e.currentTarget.style.opacity = '1'; e.currentTarget.style.transform = 'none'; }}
										onClick={e => { e.stopPropagation(); setSelected(p.id); }}
									>
										ابدأ الآن
									</button>

									{/* Divider */}
									<div style={{ height: 1, background: isFeatured ? 'rgba(255,255,255,.1)' : 'var(--border)', marginBottom: 14 }} />

									{/* Features list */}
									<div style={{
										background: isFeatured ? 'rgba(255,255,255,.05)' : '#F8F9FFC7',
										border: `1px solid ${isFeatured ? 'rgba(255,255,255,.08)' : '#6763AF14'}`,
										borderRadius: 12, padding: '10px 10px 6px',
										display: 'flex', flexDirection: 'column',
									}}>
										{p.features.map((f, i) => (
											<PlanFeature key={i} label={f} featured={isFeatured} />
										))}
									</div>
								</div>
							</motion.div>
						);
					})}
				</div>
			)}

			<div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
				<BtnGhost onClick={onBack}>رجوع</BtnGhost>
				<BtnPrimary onClick={go} disabled={!selected || isLoading || nextLoading} loading={nextLoading}>متابعة <IcArrow dir="right" /></BtnPrimary>
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


const schema = yup.object({
	country: yup.string().required('الدولة مطلوبة'),
	currency: yup.string().required('العملة مطلوبة'),
	name: yup.string().trim().required('العملة مطلوبة'),
	tax: yup.string().trim(),
	commercial: yup.string().trim(),
	phone: yup.string().trim(),
	website: yup
		.string()
		.trim()
		.notRequired()
		.nullable()
		.test('is-url-or-empty', 'رابط غير صالح', v => !v || /^(https?:\/\/)/.test(v)),
	address: yup.string().trim(),
});

function CompanyStep({ onNext, onBack, open, nextLoading }) {
	const {
		control,
		register,
		handleSubmit,
		formState: { errors, touchedFields, isSubmitting },
		reset,
	} = useForm({
		resolver: yupResolver(schema),
		defaultValues: {
			country: '',
			currency: '',
			name: '',
			tax: '',
			commercial: '',
			phone: '',
			website: '',
			address: '',
		},
		mode: 'onTouched', // validate on touch so errors show after interaction
	});

	useEffect(() => {
		if (!open) return;

		const loadCompany = async () => {
			try {
				const res = await api.get('/users/company');
				if (res.data) {
					reset({
						country: res.data.country || '',
						currency: res.data.currency || '',
						name: res.data.name || '',
						tax: res.data.tax || '',
						commercial: res.data.commercial || '',
						phone: res.data.phone || '',
						website: res.data.website || '',
						address: res.data.address || '',
					});
				}
			} catch (err) {
				console.error(err);
			}
		};

		loadCompany();
	}, [open, reset]);

	const onSubmit = async (data) => {
		try {
			await api.post('/users/company', data);
			toast.success('تم حفظ بيانات الشركة بنجاح ✓');
			onNext();
		} catch (err) {
			const msg = err.response?.data?.message || 'حدث خطأ أثناء حفظ البيانات';
			toast.error(Array.isArray(msg) ? msg[0] : msg);
		}
	};

	const onInvalid = (errs) => {
		// mark all required fields as touched is handled by RHF; show toast like original
		// toast.error('يرجى ملء البيانات المطلوبة');
	};

	if (!open) return null;

	return (
		<motion.div
			key="co"
			initial={{ opacity: 0, y: 20 }}
			animate={{ opacity: 1, y: 0 }}
			exit={{ opacity: 0, y: -16 }}
			transition={{ duration: 0.3 }}
		>
			<div style={{ marginBottom: 24 }}>
				<h2 style={{ fontSize: 22, fontWeight: 900, color: 'var(--text)', letterSpacing: '-0.4px', marginBottom: 6 }}>
					بيانات شركتك
				</h2>
				<div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
					<p style={{ fontSize: 13.5, color: 'var(--text-3)' }}>تظهر في الفواتير والتقارير الرسمية</p>
					<span
						style={{
							fontSize: 11.5,
							background: 'var(--p-xlight)',
							color: 'var(--p)',
							padding: '2px 10px',
							borderRadius: 99,
							fontWeight: 600,
							flexShrink: 0,
						}}
					>
						* الدولة والعملة إلزاميتان
					</span>
				</div>
			</div>

			{/* Row 1: country + currency */}
			<div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
				<Field label="الدولة" required error={(errors.country) ? errors.country?.message : null}>
					<Controller
						control={control}
						name="country"
						render={({ field }) => (
							<ObSelect
								{...field}
								onBlur={() => field.onBlur()}
								icon="🌍"
							>
								<option value="">اختر الدولة</option>
								{COUNTRIES.map((c) => (
									<option key={c} value={c}>
										{c}
									</option>
								))}
							</ObSelect>
						)}
					/>
				</Field>

				<Field label="العملة" required error={(errors.currency) ? errors.currency?.message : null}>
					<Controller
						control={control}
						name="currency"
						render={({ field }) => (
							<ObSelect
								{...field}
								onBlur={() => field.onBlur()}
								icon="💵"
							>
								<option value="">اختر العملة</option>
								{CURRENCIES.map((c) => (
									<option key={c.code} value={c.code}>
										{c.label}
									</option>
								))}
							</ObSelect>
						)}
					/>
				</Field>
			</div>

			{/* Company name - full width */}
			<Field label="اسم الشركة / المتجر *" error={(errors.name) ? errors.name?.message : null}>
				<InputWrap icon={<IcBuild />}>
					<input
						className="ob-input"
						placeholder="مثال: شركة طلباتي تك"
						{...register('name')}
					/>
				</InputWrap>
			</Field>

			{/* Row 2 */}
			<div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
				<Field label="الرقم الضريبي">
					<InputWrap icon={<span style={{ fontSize: 13, fontWeight: 700 }}>%</span>}>
						<input
							className="ob-input"
							placeholder="اختياري"
							{...register('tax')}
							style={{ direction: 'ltr', textAlign: 'right' }}
						/>
					</InputWrap>
				</Field>

				<Field label="السجل التجاري">
					<InputWrap icon="📋">
						<input
							className="ob-input"
							placeholder="اختياري"
							{...register('commercial')}
							style={{ direction: 'ltr', textAlign: 'right' }}
						/>
					</InputWrap>
				</Field>

				<Field label="الهاتف">
					<InputWrap icon={<IcPhone />}>
						<input
							className="ob-input"
							placeholder="+20 xxx xxxx"
							{...register('phone')}
							style={{ direction: 'ltr', textAlign: 'right' }}
						/>
					</InputWrap>
				</Field>

				<Field label="الموقع الإلكتروني">
					<InputWrap icon={<IcGlobe />}>
						<input
							className="ob-input"
							placeholder="https://mystore.com"
							{...register('website')}
							style={{ direction: 'ltr', textAlign: 'left' }}
						/>
					</InputWrap>
				</Field>
			</div>

			{/* Address */}
			<Field label="العنوان">
				<div style={{ position: 'relative' }}>
					<span style={{ position: 'absolute', right: 14, top: 13, color: 'var(--text-3)', display: 'flex', pointerEvents: 'none' }}>
						📍
					</span>
					<textarea
						className="ob-textarea"
						rows={2}
						placeholder="العنوان بالتفصيل (اختياري)"
						{...register('address')}
					/>
				</div>
			</Field>

			<div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', marginTop: 4 }}>
				<BtnGhost onClick={onBack}>رجوع</BtnGhost>
				<BtnPrimary onClick={handleSubmit(onSubmit, onInvalid)} loading={isSubmitting || nextLoading} disabled={nextLoading}>
					حفظ ومتابعة <IcArrow dir="right" />
				</BtnPrimary>
			</div>
		</motion.div>
	);
}

/* ─── Step 3: Store ───────────────────────────────────────── */

// Provider metadata matching StoresIntegrationPage
const PROVIDER_CONFIG = {
	easyorder: {
		fields: {
			apiKey: { label: "مفتاح API", required: true, userProvides: true },
			webhookCreateOrderSecret: { label: "سر إنشاء الطلب", required: true, userProvides: true },
			webhookUpdateStatusSecret: { label:"سر تحديث الحالة", required: true, userProvides: true },
		},
		webhookEndpoints: (adminId) => ({
			create: `${window.location.origin}/stores/webhooks/${adminId}/easyorder/orders/create`,
			update: `${window.location.origin}/stores/webhooks/easyorder/orders/status`,
		}),
	},
	shopify: {
		fields: {
			apiKey: { label: "مفتاح API", required: true, userProvides: true },
			clientSecret: { label: "السر", required: true, userProvides: true },
			webhookSecret: { label: "سر Webhook", required: true, userProvides: true },
		},
		webhookEndpoints: (adminId) => ({
			create: `${window.location.origin}/stores/webhooks/${adminId}/shopify/orders/create`,
			update: `${window.location.origin}/stores/webhooks/shopify/orders/status`,
		}),
	},
	woocommerce: {
		fields: {
			apiKey: { label: "مفتاح API", required: true, userProvides: true },
			clientSecret: { rlabel: "السر", equired: true, userProvides: true },
			webhookSecret: { label: "سر Webhook", required: true, userProvides: true },
			webhookCreateOrderSecret: { label: "سر إنشاء الطلب", required: true, systemProvides: true },
			webhookUpdateStatusSecret: { label: "سر تحديث الحالة", required: true, systemProvides: true },
		},
		webhookEndpoints: (adminId) => ({
			create: `${window.location.origin}/stores/webhooks/${adminId}/woocommerce/orders/create`,
			update: `${window.location.origin}/stores/webhooks/woocommerce/orders/status`,
		}),
	},
};

const STORE_PROVIDERS = [
	{
		key: 'easyorder',
		code: 'easyorder',
		label: 'إيزي أوردر',
		img: "/integrate/easyorder.png",
		emoji: '🛒',
		desc: 'ربط مباشر مع منصة إيزي أوردر',
	},
	{
		key: 'shopify',
		code: 'shopify',
		label: 'Shopify',
		img: "/integrate/shopify.png",
		emoji: '🟢',
		desc: 'ربط متجر Shopify الخاص بك',
	},
	{
		key: 'woocommerce',
		code: 'woocommerce',
		label: 'WooCommerce',
		img: "/integrate/WooCommerce.png",
		emoji: '🛍️',
		desc: 'ربط متجر WooCommerce',
	},
];


const CopyableCode = ({ text }) => {
	const [copied, setCopied] = useState(false);
	return (
		<div style={{
			display: 'flex',
			alignItems: 'center',
			gap: 8,
			background: 'var(--surface2)',
			border: '1.5px solid var(--border)',
			borderRadius: 8,
			padding: '8px 12px',
			marginTop: 4,
		}}>
			<code style={{ fontSize: 11, fontFamily: 'monospace', color: 'var(--p)', flex: 1, wordBreak: 'break-all' }}>
				{text}
			</code>
			<button
				onClick={() => {
					navigator.clipboard.writeText(text);
					setCopied(true);
					setTimeout(() => setCopied(false), 1500);
				}}
				style={{
					background: 'transparent',
					border: 'none',
					cursor: 'pointer',
					fontSize: 11,
					color: 'var(--text-3)',
					padding: '2px 6px',
				}}
			>
				{copied ? '✓' : '📋'}
			</button>
		</div>
	);
};

function StoreStep({ onNext, onBack, open, nextLoading }) {
	const [active, setActive] = useState(null);
	const [fd, setFd] = useState({});
	const [storeUrl, setStoreUrl] = useState('');
	const [storeName, setStoreName] = useState('');
	const [connected, setConnected] = useState({});
	const [saving, setSaving] = useState(false);
	const [loading, setLoading] = useState(true);
	const [stores, setStores] = useState([]);
	const [systemSecrets, setSystemSecrets] = useState({});
	const [showWebhooks, setShowWebhooks] = useState(false);

	const user = getUser();
	const provider = STORE_PROVIDERS.find(p => p.key === active);
	const providerConfig = provider ? PROVIDER_CONFIG[provider.code] : null;

	// Fetch existing stores
	const fetchStores = async () => {
		setLoading(true);
		try {
			const { data } = await api.get("/stores");
			const storesArray = Array.isArray(data) ? data : data?.records || [];
			const storesMap = {};

			storesArray.forEach((store) => {
				storesMap[store.provider] = store;
			});

			setStores(storesMap);

			// Mark as connected if store exists
			const connectedMap = {};
			storesArray.forEach((store) => {
				connectedMap[store.provider] = true;
			});
			setConnected(connectedMap);
		} catch (e) {
			console.error("Error fetching stores:", e);
		} finally {
			setLoading(false);
		}
	};

	useEffect(() => {
		if (open) {
			fetchStores();
		}
	}, [open]);

	// When opening a provider form, load existing data
	useEffect(() => {
		if (active && stores[active]) {
			const store = stores[active];
			setStoreName(store.name || '');
			setStoreUrl(store.storeUrl || '');

			// Load integrations (non-system-provided fields)
			const newFd = {};
			if (providerConfig) {
				Object.keys(providerConfig.fields).forEach((fieldKey) => {
					const field = providerConfig.fields[fieldKey];
					if (field.userProvides && store.integrations?.[fieldKey]) {
						newFd[fieldKey] = store.integrations[fieldKey];
					}
				});
			}
			setFd(newFd);

			// Load system secrets for WooCommerce
			if (provider.code === 'woocommerce' && store.integrations) {
				setSystemSecrets({
					webhookCreateOrderSecret: store.integrations.webhookCreateOrderSecret || '',
					webhookUpdateStatusSecret: store.integrations.webhookUpdateStatusSecret || '',
				});
			}
		} else if (!active) {
			setFd({});
			setStoreUrl('');
			setStoreName('');
			setSystemSecrets({});
			setShowWebhooks(false);
		}
	}, [active]);

	const save = async () => {
		const isEditMode = !!stores[active];

		// Validate store URL and name
		if (!storeUrl.trim()) {
			toast.error('يرجى إدخال رابط المتجر');
			return;
		}
		if (!storeName.trim()) {
			toast.error('يرجى إدخال اسم المتجر');
			return;
		}

		// Validate required user-provided fields
		if (!isEditMode && providerConfig) {
			const missingFields = Object.keys(providerConfig.fields)
				.filter(key => {
					const field = providerConfig.fields[key];
					return field.userProvides && field.required && !fd[key]?.trim();
				});

			if (missingFields.length > 0) {
				toast.error('يرجى ملء جميع الحقول المطلوبة');
				return;
			}
		}

		// For edit mode: at least one field must be changed
		if (isEditMode) {
			const hasChanges = Object.keys(fd).some(key => fd[key]?.trim());
			if (!hasChanges && storeUrl === stores[active].storeUrl && storeName === stores[active].name) {
				toast.error('يرجى تعديل حقل واحد على الأقل');
				return;
			}
		}

		setSaving(true);
		try {
			const credentials = {};

			// Only include user-provided fields
			if (providerConfig) {
				Object.keys(providerConfig.fields).forEach((fieldKey) => {
					const field = providerConfig.fields[fieldKey];
					if (field.userProvides && fd[fieldKey]?.trim()) {
						credentials[fieldKey] = fd[fieldKey].trim();
					}
				});
			}

			const payload = {
				name: storeName.trim(),
				storeUrl: storeUrl.trim(),
				isActive: true,
			};

			if (isEditMode) {
				// Update existing store
				if (Object.keys(credentials).length > 0) {
					payload.credentials = credentials;
				}

				const { data } = await api.patch(`/stores/${stores[active].id}`, payload);

				// Update system secrets for WooCommerce
				if (provider.code === 'woocommerce' && data.credentials) {
					setSystemSecrets({
						webhookCreateOrderSecret: data.credentials.webhookCreateOrderSecret || '',
						webhookUpdateStatusSecret: data.credentials.webhookUpdateStatusSecret || '',
					});
					setShowWebhooks(true);
				}

				toast.success(`تم تحديث ${provider.label} بنجاح ✓`);
			} else {
				// Create new store
				payload.provider = provider.code;
				payload.credentials = credentials;

				const { data } = await api.post("/stores", payload);

				// Get system secrets for WooCommerce
				if (provider.code === 'woocommerce' && data.credentials) {
					setSystemSecrets({
						webhookCreateOrderSecret: data.credentials.webhookCreateOrderSecret || '',
						webhookUpdateStatusSecret: data.credentials.webhookUpdateStatusSecret || '',
					});
					setShowWebhooks(true);
				} else {
					// For other providers, close form after save
					setActive(null);
					setFd({});
					setStoreUrl('');
					setStoreName('');
				}

				toast.success(`تم ربط ${provider.label} بنجاح ✓`);
			}

			// Refresh stores list
			await fetchStores();

			// Only close form for non-WooCommerce or if not showing webhooks
			if (provider.code !== 'woocommerce' || (isEditMode && !showWebhooks)) {
				setActive(null);
				setFd({});
				setStoreUrl('');
				setStoreName('');
				setSystemSecrets({});
			}

		} catch (error) {
			console.error("Error saving store:", error);
			toast.error(error?.response?.data?.message || 'حدث خطأ أثناء الحفظ');
		} finally {
			setSaving(false);
		}
	};

	const connectedCount = useMemo(() => {
		return Object.keys(connected || {}).length;
	}, [connected]);

	if (!open) return null;

	return (
		<motion.div
			key="store"
			initial={{ opacity: 0, y: 20 }}
			animate={{ opacity: 1, y: 0 }}
			exit={{ opacity: 0, y: -16 }}
			transition={{ duration: .3 }}
		>
			<div style={{ marginBottom: 24 }}>
				<h2 style={{ fontSize: 22, fontWeight: 900, color: 'var(--text)', letterSpacing: '-0.4px', marginBottom: 6 }}>
					اربط متجرك
				</h2>
				<p style={{ fontSize: 13.5, color: 'var(--text-3)' }}>
					أضف متجرك لاستقبال الطلبات تلقائياً — يمكن إضافة أكثر من متجر
				</p>
			</div>

			{loading ? (
				<ProvidersSkeleton />
			) : (
				<AnimatePresence mode="wait">
					{!active ? (
						<motion.div
							key="list"
							initial={{ opacity: 0 }}
							animate={{ opacity: 1 }}
							exit={{ opacity: 0 }}
						>
							<div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 28 }}>
								{STORE_PROVIDERS.map(p => (
									<div
										key={p.key}
										className={`prov-card${connected[p.key] ? ' connected' : ''}`}
										style={{
											cursor: 'pointer',
											display: 'flex',
											alignItems: 'center',
											gap: 12,
											padding: 14,
											borderRadius: 14,
											border: '1.5px solid var(--border)',
											background: 'var(--surface)',
											transition: 'all .2s',
										}}
									>
										<div
											onClick={() => setActive(p.key)}
											style={{ display: 'flex', alignItems: 'center', gap: 12, flex: 1 }}
										>
											{/* Logo container */}
											<div style={{
												width: 44,
												height: 44,
												borderRadius: 12,
												flexShrink: 0,
												background: connected[p.key] ? '#f0fdf4' : 'var(--surface2)',
												border: `1.5px solid ${connected[p.key] ? '#bbf7d0' : 'var(--border)'}`,
												display: 'flex',
												alignItems: 'center',
												justifyContent: 'center',
												overflow: 'hidden',
												transition: 'all .2s',
											}}>
												<img
													src={p.img}
													alt={p.label}
													style={{ width: 28, height: 28, objectFit: 'contain' }}
													onError={e => {
														e.currentTarget.style.display = 'none';
														e.currentTarget.parentElement.innerHTML = `<span style="font-size:22px">${p.emoji || '🔗'}</span>`;
													}}
												/>
											</div>

											{/* Text */}
											<div style={{ flex: 1, minWidth: 0 }}>
												<div style={{ fontSize: 14, fontWeight: 700, color: 'var(--text)' }}>
													{p.label}
												</div>
												<div style={{ fontSize: 12, color: 'var(--text-3)', marginTop: 2, lineHeight: 1.4 }}>
													{p.desc}
												</div>
											</div>
										</div>

										{/* Status badge */}
										{connected[p.key] ? (
											<motion.div
												initial={{ scale: 0 }}
												animate={{ scale: 1 }}
												style={{
													display: 'flex',
													alignItems: 'center',
													gap: 5,
													color: '#10b981',
													fontSize: 12,
													fontWeight: 700,
													background: '#f0fdf4',
													border: '1px solid #bbf7d0',
													borderRadius: 99,
													padding: '4px 10px',
													flexShrink: 0,
												}}
											>
												<IcCheck /> متصل
											</motion.div>
										) : (
											<div
												style={{
													fontSize: 12,
													color: 'var(--p)',
													fontWeight: 700,
													border: '1.5px solid var(--p)',
													borderRadius: 8,
													padding: '4px 12px',
													flexShrink: 0,
													transition: 'background .15s, color .15s',
												}}
												onMouseEnter={e => {
													e.currentTarget.style.background = 'var(--p)';
													e.currentTarget.style.color = '#fff';
												}}
												onMouseLeave={e => {
													e.currentTarget.style.background = 'transparent';
													e.currentTarget.style.color = 'var(--p)';
												}}
											>
												ربط
											</div>
										)}
									</div>
								))}
							</div>

							<div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
								<BtnGhost onClick={onBack}>رجوع</BtnGhost>
								{connectedCount === 0 && <BtnGhost onClick={onNext}>تخطي الآن</BtnGhost>}
								{connectedCount > 0 && (
									<BtnPrimary onClick={onNext}>
										متابعة <IcArrow dir="right" />
									</BtnPrimary>
								)}
							</div>
						</motion.div>
					) : (
						<motion.div
							key="form"
							initial={{ opacity: 0, x: 12 }}
							animate={{ opacity: 1, x: 0 }}
							exit={{ opacity: 0, x: -12 }}
						>
							<div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 22 }}>
								<div style={{
									width: 44,
									height: 44,
									borderRadius: 12,
									flexShrink: 0,
									background: 'var(--surface2)',
									border: '1.5px solid var(--border)',
									display: 'flex',
									alignItems: 'center',
									justifyContent: 'center',
									overflow: 'hidden',
									transition: 'all .2s',
								}}>
									<img
										src={provider.img}
										alt={provider.label}
										style={{ width: 28, height: 28, objectFit: 'contain' }}
										onError={e => {
											e.currentTarget.style.display = 'none';
											e.currentTarget.parentElement.innerHTML = `<span style="font-size:22px">${provider.emoji || '🔗'}</span>`;
										}}
									/>
								</div>

								<div>
									<div style={{ fontSize: 15, fontWeight: 700, color: 'var(--text)' }}>
										{provider.label}
									</div>
									<div style={{ fontSize: 12, color: 'var(--text-3)' }}>
										{connected[provider.key] ? 'تحديث بيانات الربط' : 'أدخل بيانات الربط'}
									</div>
								</div>
							</div>

							{/* Show webhook info if just saved WooCommerce */}
							{showWebhooks && provider.code === 'woocommerce' && systemSecrets.webhookCreateOrderSecret ? (
								<div style={{
									background: '#fffbeb',
									border: '1.5px solid #fde68a',
									borderRadius: 12,
									padding: 16,
									marginBottom: 16,
								}}>
									<p style={{ fontSize: 13, fontWeight: 700, color: '#92400e', marginBottom: 8 }}>
										🔑 أسرار Webhook الخاصة بك
									</p>
									<p style={{ fontSize: 11, color: '#78350f', marginBottom: 12, lineHeight: 1.5 }}>
										انسخ هذه الأسرار والصقها في إعدادات WooCommerce
									</p>

									<div style={{ marginBottom: 8 }}>
										<p style={{ fontSize: 11, fontWeight: 600, color: '#78350f', marginBottom: 4 }}>
											Webhook Create Secret:
										</p>
										<CopyableCode text={systemSecrets.webhookCreateOrderSecret} />
									</div>

									<div>
										<p style={{ fontSize: 11, fontWeight: 600, color: '#78350f', marginBottom: 4 }}>
											Webhook Update Secret:
										</p>
										<CopyableCode text={systemSecrets.webhookUpdateStatusSecret} />
									</div>
								</div>
							) : (
								<>
									{/* Store Name */}
									<Field label="اسم المتجر" required>
										<InputWrap icon={<span>🏪</span>}>
											<input
												className="ob-input"
												placeholder="متجري الإلكتروني"
												value={storeName}
												onChange={e => setStoreName(e.target.value)}
												style={{
													paddingLeft: 36,
													width: '100%',
													height: 42,
													borderRadius: 10,
													border: '1.5px solid var(--border)',
													background: 'var(--surface)',
													fontSize: 13,
													color: 'var(--text)',
													outline: 'none',
												}}
											/>
										</InputWrap>
									</Field>

									{/* Store URL */}
									<Field label="رابط المتجر" required>
										<InputWrap icon={<IcGlobe />}>
											<input
												className="ob-input"
												placeholder="https://mystore.example.com"
												value={storeUrl}
												onChange={e => setStoreUrl(e.target.value)}
												style={{
													direction: 'ltr',
													textAlign: 'left',
													paddingLeft: 36,
													width: '100%',
													height: 42,
													borderRadius: 10,
													border: '1.5px solid var(--border)',
													background: 'var(--surface)',
													fontSize: 13,
													color: 'var(--text)',
													outline: 'none',
												}}
											/>
										</InputWrap>
									</Field>

									{/* Webhook URLs Info */}
									{providerConfig && user?.id && (
										<div style={{
											background: 'var(--surface2)',
											border: '1.5px solid var(--border)',
											borderRadius: 12,
											padding: 12,
											marginBottom: 16,
										}}>
											<p style={{ fontSize: 11, fontWeight: 700, color: 'var(--text)', marginBottom: 8 }}>
												📡 روابط Webhook
											</p>
											<div style={{ marginBottom: 8 }}>
												<p style={{ fontSize: 10, color: 'var(--text-3)', marginBottom: 4 }}>Create Order:</p>
												<CopyableCode text={providerConfig.webhookEndpoints(user.id).create} />
											</div>
											<div>
												<p style={{ fontSize: 10, color: 'var(--text-3)', marginBottom: 4 }}>Update Status:</p>
												<CopyableCode text={providerConfig.webhookEndpoints(user.id).update} />
											</div>
										</div>
									)}

									{/* Integration Fields */}
									{providerConfig && Object.keys(providerConfig.fields).map((fieldKey) => {
										const field = providerConfig.fields[fieldKey];

										// Only show user-provided fields
										if (!field.userProvides) return null;

										const existingValue = stores[active]?.integrations?.[fieldKey];
										const placeholder = existingValue || field.label;

										return (
											<Field key={fieldKey} label={field.label} required={field.required}>
												<InputWrap icon={<IcLock />}>
													<input
														className="ob-input"
														type="password"
														placeholder={placeholder}
														value={fd[fieldKey] || ''}
														onChange={e => setFd(p => ({ ...p, [fieldKey]: e.target.value }))}
														style={{
															direction: 'ltr',
															textAlign: 'left',
															paddingLeft: 36,
															width: '100%',
															height: 42,
															borderRadius: 10,
															border: '1.5px solid var(--border)',
															background: 'var(--surface)',
															fontSize: 13,
															color: 'var(--text)',
															outline: 'none',
														}}
													/>
												</InputWrap>
											</Field>
										);
									})}
								</>
							)}

							<div style={{ display: 'flex', gap: 10, marginTop: 16 }}>
								<BtnGhost onClick={() => {
									setActive(null);
									setFd({});
									setStoreUrl('');
									setStoreName('');
									setSystemSecrets({});
									setShowWebhooks(false);
								}}>
									{showWebhooks ? 'إغلاق' : 'إلغاء'}
								</BtnGhost>

								{!showWebhooks && (
									<BtnPrimary onClick={save} loading={saving || nextLoading} disabled={nextLoading} style={{ flex: 1 }}>
										{connected[provider.key] ? 'تحديث المتجر' : 'حفظ وربط المتجر'}
									</BtnPrimary>
								)}
							</div>
						</motion.div>
					)}
				</AnimatePresence>
			)}
		</motion.div>
	);
}



const ProvidersSkeleton = () => (
	<div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 28 }}>
		{[1, 2, 3].map(i => (
			<div
				key={i}
				className="prov-card"
				style={{
					display: 'flex',
					alignItems: 'center',
					gap: 12,
					padding: 12,
					borderRadius: 12,
					border: '1.5px solid var(--border)',
					background: 'var(--surface)',
				}}
			>
				{/* Provider Icon */}
				<div
					className="skeleton-pulse"
					style={{
						width: 44,
						height: 44,
						borderRadius: 12,
						background: '#f0f0f0',
						flexShrink: 0,
					}}
				/>

				{/* Provider Text */}
				<div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 6 }}>
					<div
						className="skeleton-pulse"
						style={{
							height: 12,
							width: '35%',
							borderRadius: 6,
							background: '#eee',
						}}
					/>

					<div
						className="skeleton-pulse"
						style={{
							height: 10,
							width: '70%',
							borderRadius: 6,
							background: '#f5f5f5',
						}}
					/>
				</div>

				{/* Connect Button */}
				<div
					className="skeleton-pulse"
					style={{
						height: 28,
						width: 70,
						borderRadius: 8,
						background: '#eee',
					}}
				/>
			</div>
		))}
	</div>
);


// Provider metadata matching ShippingCompaniesPage
const PROVIDER_META = {
	bosta: {
		configFields: [
			{ key: "apiKey", type: "password", label: 'مفتاح API', required: true, hide: true },
		],
		webhookHiddenFields: [], // Show all webhook fields
	},
	jt: {
		configFields: [
			{ key: "apiKey", type: "password", label: 'مفتاح API', required: true, hide: true },
			{ key: "customerId", type: "text", label: 'معرف العميل', required: true, hide: false },
		],
		webhookHiddenFields: [],
	},
	turbo: {
		configFields: [
			{ key: "apiKey", type: "password", label: 'مفتاح API', required: true, hide: true },
			{ key: "accountId", type: "text", label: 'معرف الحساب', required: true, hide: false },
		],
		webhookHiddenFields: ["headerName"], // Hide headerName for Turbo
	},
};

const SHIP_PROVIDERS = [
	{
		key: 'bosta',
		code: 'bosta',
		label: 'بوسطة',
		img: "/integrate/bosta.png",
		emoji: '📦',
		desc: 'أسرع شركات التوصيل في مصر',
	},
	{
		key: 'jt',
		code: 'jt',
		label: 'J&T Express',
		img: "/integrate/5.png",
		emoji: '🚚',
		desc: 'تغطية واسعة في المنطقة العربية',
	},
	{
		key: 'turbo',
		code: 'turbo',
		label: 'تيربو',
		img: "/integrate/4.png",
		emoji: '⚡',
		desc: 'توصيل سريع داخل المدن',
	},
];


const CopyableField = ({ label, value }) => {
	const [copied, setCopied] = useState(false);

	const copy = async () => {
		try {
			await navigator.clipboard.writeText(String(value || ""));
			setCopied(true);
			setTimeout(() => setCopied(false), 1500);
		} catch (_) { }
	};

	return (
		<div style={{ marginBottom: 12 }}>
			<label style={{ fontSize: 11, fontWeight: 600, color: 'var(--text)', marginBottom: 4, display: 'block' }}>
				{label}
			</label>
			<div style={{
				display: 'flex',
				alignItems: 'center',
				gap: 8,
				background: 'var(--surface2)',
				border: '1.5px solid var(--border)',
				borderRadius: 10,
				padding: '8px 12px',
			}}>
				<input
					readOnly
					value={value || ''}
					style={{
						flex: 1,
						background: 'transparent',
						border: 'none',
						outline: 'none',
						fontSize: 12,
						color: 'var(--text)',
						fontFamily: 'monospace',
					}}
				/>
				<button
					onClick={copy}
					style={{
						background: 'transparent',
						border: 'none',
						cursor: 'pointer',
						fontSize: 14,
						padding: '2px 6px',
					}}
				>
					{copied ? '✓' : '📋'}
				</button>
			</div>
		</div>
	);
};

const WebhookSkeleton = () => (
	<div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>

		{[1, 2, 3].map(i => (
			<div
				key={i}
				style={{
					border: '1.5px solid var(--border)',
					borderRadius: 12,
					padding: 12,
					background: 'var(--surface)',
					display: 'flex',
					flexDirection: 'column',
					gap: 8
				}}
			>
				{/* label */}
				<div
					className="skeleton-pulse"
					style={{
						height: 10,
						width: '30%',
						borderRadius: 6,
						background: '#eee'
					}}
				/>

				{/* value field */}
				<div
					className="skeleton-pulse"
					style={{
						height: 34,
						width: '100%',
						borderRadius: 8,
						background: '#f5f5f5'
					}}
				/>
			</div>
		))}

		{/* Security box skeleton */}
		<div
			style={{
				display: 'flex',
				alignItems: 'center',
				justifyContent: 'space-between',
				gap: 12,
				borderRadius: 12,
				padding: 12,
				border: '1.5px solid var(--border)',
				background: 'var(--surface2)'
			}}
		>
			<div
				className="skeleton-pulse"
				style={{
					height: 10,
					width: '60%',
					borderRadius: 6,
					background: '#eee'
				}}
			/>

			<div
				className="skeleton-pulse"
				style={{
					height: 28,
					width: 70,
					borderRadius: 8,
					background: '#eee'
				}}
			/>
		</div>

	</div>
);

function ShippingStep({ onNext, onBack, open, nextLoading }) {
	const [active, setActive] = useState(null);
	const [fd, setFd] = useState({});
	const [connected, setConnected] = useState({});
	const [saving, setSaving] = useState(false);
	const [loading, setLoading] = useState(true);
	const [integrations, setIntegrations] = useState({});

	// Webhook state
	const [showWebhook, setShowWebhook] = useState(false);
	const [webhookData, setWebhookData] = useState(null);
	const [webhookLoading, setWebhookLoading] = useState(false);
	const [rotatingSecret, setRotatingSecret] = useState(false);

	const provider = SHIP_PROVIDERS.find(p => p.key === active);
	const providerMeta = provider ? PROVIDER_META[provider.code] : null;
	const fields = providerMeta?.configFields || [];
	const webhookHiddenFields = providerMeta?.webhookHiddenFields || [];

	// Fetch existing integrations
	const fetchIntegrations = async () => {
		setLoading(true);
		try {
			const { data } = await api.get("/shipping/integrations/status");
			const integrationsMap = {};
			const connectedMap = {};

			if (data?.integrations) {
				data.integrations.forEach((integration) => {
					integrations[integration.provider] = integration;
					if (integration.credentialsConfigured) {
						connectedMap[integration.provider] = true;
					}
				});
			}

			setIntegrations(integrations);
			setConnected(connectedMap);
		} catch (e) {
			console.error("Error fetching integrations:", e);
		} finally {
			setLoading(false);
		}
	};

	// Fetch webhook setup
	const fetchWebhookSetup = async (providerCode) => {
		setWebhookLoading(true);
		try {
			const res = await api.get(`/shipping/providers/${providerCode}/webhook-setup`);
			setWebhookData(res.data);
		} catch (e) {
			console.error("Error fetching webhook setup:", e);
			toast.error('فشل في تحميل إعدادات Webhook');
		} finally {
			setWebhookLoading(false);
		}
	};

	// Rotate webhook secret
	const rotateSecret = async () => {
		if (!provider) return;

		setRotatingSecret(true);
		try {
			await api.post(`/shipping/providers/${provider.code}/webhook-setup/rotate-secret`, {});
			await fetchWebhookSetup(provider.code);
			toast.success('تم تجديد السر بنجاح ✓');
		} catch (e) {
			console.error("Error rotating secret:", e);
			toast.error('فشل في تجديد السر');
		} finally {
			setRotatingSecret(false);
		}
	};

	useEffect(() => {
		if (open) {
			fetchIntegrations();
		}
	}, [open]);

	// When opening a provider form, load existing non-hidden values
	useEffect(() => {
		if (active && integrations[active]) {
			const integration = integrations[active];
			const newFd = {};

			fields.forEach((field) => {
				// Only populate non-hidden fields
				if (!field.hide && integration.credentials?.[field.key]) {
					newFd[field.key] = integration.credentials[field.key];
				}
			});

			setFd(newFd);
		} else if (!active) {
			setFd({});
			setShowWebhook(false);
			setWebhookData(null);
		}
	}, [active]);

	const save = async () => {
		// Check required fields
		const missingRequired = fields.filter(f => f.required && !fd[f.key]?.trim());

		// For edit mode: allow save if at least one field has a new value
		const hasAtLeastOneValue = fields.some(f => fd[f.key]?.trim());
		const isEditMode = integrations[active]?.credentialsConfigured;

		if (!isEditMode && missingRequired.length) {
			toast.error('يرجى ملء الحقول المطلوبة');
			return;
		}

		if (isEditMode && !hasAtLeastOneValue) {
			toast.error('يرجى إدخال قيمة واحدة على الأقل');
			return;
		}

		setSaving(true);
		try {
			const credentials = {};
			fields.forEach((field) => {
				const val = fd[field.key]?.trim();
				if (val && val.length > 0) {
					credentials[field.key] = val;
				}
			});

			await api.post(`/shipping/providers/${provider.code}/credentials`, { credentials });

			toast.success(`تم ${isEditMode ? 'تحديث' : 'ربط'} ${provider.label} بنجاح ✓`);

			// Refresh integrations
			await fetchIntegrations();

			// If first setup, show webhook modal
			if (!isEditMode) {
				setShowWebhook(true);
				await fetchWebhookSetup(provider.code);
			} else {
				setActive(null);
				setFd({});
			}
		} catch (error) {
			console.error("Error saving credentials:", error);
			toast.error(error?.response?.data?.message || 'حدث خطأ أثناء الحفظ');
		} finally {
			setSaving(false);
		}
	};

	const openWebhookSetup = async (providerKey) => {
		setActive(providerKey);
		setShowWebhook(true);
		await fetchWebhookSetup(providerKey);
	};

	if (!open) return null;

	return (
		<motion.div
			key="ship"
			initial={{ opacity: 0, y: 20 }}
			animate={{ opacity: 1, y: 0 }}
			exit={{ opacity: 0, y: -16 }}
			transition={{ duration: .3 }}
		>
			<div style={{ marginBottom: 24 }}>
				<h2 style={{ fontSize: 22, fontWeight: 900, color: 'var(--text)', letterSpacing: '-0.4px', marginBottom: 6 }}>
					اربط شركة الشحن
				</h2>
				<p style={{ fontSize: 13.5, color: 'var(--text-3)' }}>
					أرسل الطلبات لشركة الشحن تلقائياً بضغطة واحدة
				</p>
			</div>

			{loading ? (
				<ProvidersSkeleton />
			) : (
				<AnimatePresence mode="wait">
					{!active ? (
						<motion.div
							key="slist"
							initial={{ opacity: 0 }}
							animate={{ opacity: 1 }}
							exit={{ opacity: 0 }}
						>
							<div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 28 }}>
								{SHIP_PROVIDERS.map(p => (
									<div
										key={p.key}
										className={`prov-card${connected[p.key] ? ' connected' : ''}`}
										style={{
											cursor: 'pointer',
											display: 'flex',
											alignItems: 'center',
											gap: 12,
											padding: 14,
											borderRadius: 14,
											border: '1.5px solid var(--border)',
											background: 'var(--surface)',
											transition: 'all .2s',
										}}
									>
										<div
											onClick={() => setActive(p.key)}
											style={{ display: 'flex', alignItems: 'center', gap: 12, flex: 1 }}
										>
											<div style={{
												width: 44,
												height: 44,
												borderRadius: 12,
												flexShrink: 0,
												background: connected[p.key] ? '#f0fdf4' : 'var(--surface2)',
												border: `1.5px solid ${connected[p.key] ? '#bbf7d0' : 'var(--border)'}`,
												display: 'flex',
												alignItems: 'center',
												justifyContent: 'center',
												overflow: 'hidden',
												transition: 'all .2s',
											}}>
												<img
													src={p.img}
													alt={p.label}
													style={{ width: 28, height: 28, objectFit: 'contain' }}
													onError={e => {
														e.currentTarget.style.display = 'none';
														e.currentTarget.parentElement.innerHTML = `<span style="font-size:22px">${p.emoji || '🔗'}</span>`;
													}}
												/>
											</div>

											<div style={{ flex: 1 }}>
												<div style={{ fontSize: 14, fontWeight: 700, color: 'var(--text)' }}>
													{p.label}
												</div>
												<div style={{ fontSize: 12, color: 'var(--text-3)', marginTop: 2 }}>
													{p.desc}
												</div>
											</div>
										</div>

										<div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
											{/* Webhook button - only show if connected */}
											{connected[p.key] && (
												<button
													onClick={(e) => {
														e.stopPropagation();
														openWebhookSetup(p.key);
													}}
													style={{
														fontSize: 11,
														color: 'var(--p)',
														fontWeight: 600,
														border: '1.5px solid var(--border)',
														borderRadius: 8,
														padding: '4px 10px',
														background: 'var(--surface)',
														display: 'flex',
														alignItems: 'center',
														gap: 4,
														cursor: 'pointer',
														transition: 'all .15s',
													}}
													onMouseEnter={e => {
														e.currentTarget.style.background = 'var(--surface2)';
													}}
													onMouseLeave={e => {
														e.currentTarget.style.background = 'var(--surface)';
													}}
												>
													<Webhook /> Webhook
												</button>
											)}

											{/* Status badge */}
											{connected[p.key] ? (
												<motion.div
													initial={{ scale: 0 }}
													animate={{ scale: 1 }}
													style={{
														display: 'flex',
														alignItems: 'center',
														gap: 5,
														color: '#10b981',
														fontSize: 12,
														fontWeight: 700,
														background: '#f0fdf4',
														border: '1px solid #bbf7d0',
														borderRadius: 99,
														padding: '4px 10px',
														flexShrink: 0,
													}}
												>
													<IcCheck /> متصل
												</motion.div>
											) : (
												<div
													onClick={() => setActive(p.key)}
													style={{
														fontSize: 12,
														color: 'var(--p)',
														fontWeight: 700,
														border: '1.5px solid var(--p)',
														borderRadius: 8,
														padding: '4px 12px',
														flexShrink: 0,
														transition: 'background .15s, color .15s',
													}}
													onMouseEnter={e => {
														e.currentTarget.style.background = 'var(--p)';
														e.currentTarget.style.color = '#fff';
													}}
													onMouseLeave={e => {
														e.currentTarget.style.background = 'transparent';
														e.currentTarget.style.color = 'var(--p)';
													}}
												>
													ربط
												</div>
											)}
										</div>
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
					) : showWebhook ? (
						// Webhook Setup View
						<motion.div
							key="webhook"
							initial={{ opacity: 0, x: 12 }}
							animate={{ opacity: 1, x: 0 }}
							exit={{ opacity: 0, x: -12 }}
						>
							<div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 22 }}>
								<div style={{
									width: 44,
									height: 44,
									borderRadius: 12,
									flexShrink: 0,
									background: 'var(--surface2)',
									border: '1.5px solid var(--border)',
									display: 'flex',
									alignItems: 'center',
									justifyContent: 'center',
									overflow: 'hidden',
								}}>
									<img
										src={provider.img}
										alt={provider.label}
										style={{ width: 28, height: 28, objectFit: 'contain' }}
										onError={e => {
											e.currentTarget.style.display = 'none';
											e.currentTarget.parentElement.innerHTML = `<span style="font-size:22px">${provider.emoji || '🔗'}</span>`;
										}}
									/>
								</div>

								<div>
									<div style={{ fontSize: 15, fontWeight: 700, color: 'var(--text)' }}>
										إعدادات Webhook - {provider.label}
									</div>
									<div style={{ fontSize: 12, color: 'var(--text-3)' }}>
										انسخ هذه البيانات إلى لوحة تحكم {provider.label}
									</div>
								</div>
							</div>

							{/* Info box */}
							<div style={{
								background: 'var(--surface2)',
								border: '1.5px solid var(--border)',
								borderRadius: 12,
								padding: 14,
								marginBottom: 16,
							}}>
								<p style={{ fontSize: 12, fontWeight: 600, color: 'var(--text)', marginBottom: 4 }}>
									📡 متى يتم تشغيل Webhook؟
								</p>
								<p style={{ fontSize: 11, color: 'var(--text-3)', lineHeight: 1.5 }}>
									يتم إرسال إشعار تلقائي عند تغيير حالة الشحنة (تم التسليم، قيد التوصيل، إلخ)
								</p>
							</div>

							{webhookLoading ? (
								<WebhookSkeleton />
							) : webhookData ? (
								<>
									{/* Webhook URL */}
									{!webhookHiddenFields.includes('webhookUrl') && (
										<CopyableField
											label="رابط Webhook"
											value={webhookData.webhookUrl}
										/>
									)}

									{/* Header Name */}
									{!webhookHiddenFields.includes('headerName') && (
										<CopyableField
											label="اسم الهيدر (Header Name)"
											value={webhookData.headerName}
										/>
									)}

									{/* Header Value (Secret) */}
									{!webhookHiddenFields.includes('headerValue') && (
										<CopyableField
											label="قيمة الهيدر (Secret)"
											value={webhookData.headerValue}
										/>
									)}

									{/* Security hint with rotate button */}
									<div style={{
										display: 'flex',
										alignItems: 'center',
										justifyContent: 'space-between',
										gap: 12,
										background: 'var(--surface2)',
										border: '1.5px solid var(--border)',
										borderRadius: 12,
										padding: 12,
										marginTop: 16,
									}}>
										<p style={{ fontSize: 11, color: 'var(--text-3)', lineHeight: 1.5, flex: 1 }}>
											لتحسين الأمان، يمكنك تجديد السر (Secret) في أي وقت
										</p>
										<button
											onClick={rotateSecret}
											disabled={rotatingSecret}
											style={{
												display: 'flex',
												alignItems: 'center',
												gap: 6,
												fontSize: 11,
												fontWeight: 700,
												color: 'var(--text)',
												background: 'var(--surface)',
												border: '1.5px solid var(--border)',
												borderRadius: 8,
												padding: '6px 12px',
												cursor: rotatingSecret ? 'not-allowed' : 'pointer',
												opacity: rotatingSecret ? 0.5 : 1,
												transition: 'all .2s',
											}}
										>
											<RefreshCw /> {rotatingSecret ? 'جارٍ...' : 'تجديد'}
										</button>
									</div>
								</>
							) : null}

							<div style={{ display: 'flex', gap: 10, marginTop: 20 }}>
								<BtnGhost onClick={() => {
									setShowWebhook(false);
									setWebhookData(null);
									setActive(null);
								}}>
									إغلاق
								</BtnGhost>
							</div>
						</motion.div>
					) : (
						// Credentials Form View
						<motion.div
							key="sform"
							initial={{ opacity: 0, x: 12 }}
							animate={{ opacity: 1, x: 0 }}
							exit={{ opacity: 0, x: -12 }}
						>
							<div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 22 }}>
								<div style={{
									width: 44,
									height: 44,
									borderRadius: 12,
									flexShrink: 0,
									background: 'var(--surface2)',
									border: '1.5px solid var(--border)',
									display: 'flex',
									alignItems: 'center',
									justifyContent: 'center',
									overflow: 'hidden',
									transition: 'all .2s',
								}}>
									<img
										src={provider.img}
										alt={provider.label}
										style={{ width: 28, height: 28, objectFit: 'contain' }}
										onError={e => {
											e.currentTarget.style.display = 'none';
											e.currentTarget.parentElement.innerHTML = `<span style="font-size:22px">${provider.emoji || '🔗'}</span>`;
										}}
									/>
								</div>

								<div>
									<div style={{ fontSize: 15, fontWeight: 700, color: 'var(--text)' }}>
										{provider.label}
									</div>
									<div style={{ fontSize: 12, color: 'var(--text-3)' }}>
										{connected[provider.key] ? 'تحديث بيانات الربط' : 'أدخل بيانات الربط'}
									</div>
								</div>
							</div>

							{fields.map(f => {
								const existingValue = integrations[active]?.credentials?.[f.key];
								const placeholder = f.hide && existingValue ? existingValue : f.label;

								return (
									<Field key={f.key} label={f.label} required={f.required}>
										<InputWrap icon={<IcLock />}>
											<input
												className="ob-input"
												type={f.type}
												placeholder={placeholder}
												value={fd[f.key] || ''}
												onChange={e => setFd(p => ({ ...p, [f.key]: e.target.value }))}
												style={{
													direction: 'ltr',
													textAlign: 'left',
													paddingLeft: 36,
													width: '100%',
													height: 42,
													borderRadius: 10,
													border: '1.5px solid var(--border)',
													background: 'var(--surface)',
													fontSize: 13,
													color: 'var(--text)',
													outline: 'none',
												}}
											/>
										</InputWrap>
									</Field>
								);
							})}

							<div style={{ display: 'flex', gap: 10, marginTop: 8 }}>
								<BtnGhost onClick={() => { setActive(null); setFd({}); }}>
									إلغاء
								</BtnGhost>
								<BtnPrimary onClick={save} loading={saving || nextLoading} disabled={nextLoading} style={{ flex: 1 }}>
									{connected[provider.key] ? 'تحديث البيانات' : 'حفظ وربط الشحن'}
								</BtnPrimary>
							</div>
						</motion.div>
					)}
				</AnimatePresence>
			)}
		</motion.div>
	);
}




const stepMap = {
	welcome: 0,
	plan: 1,
	company: 2,
	store: 3,
	shipping: 4,
	finished: 5
};

const OnboardingSkeleton = () => (
	<div style={{
		display: 'flex', width: '100%', maxWidth: 1000, minHeight: 580,
		borderRadius: 'var(--radius-xl)', background: 'var(--surface)',
		overflow: 'hidden', boxShadow: '0 28px 80px rgba(103,99,175,.1)'
	}}>
		{/* Mock Sidebar */}
		<div style={{ width: 300, background: '#1b1945', padding: 40, display: 'flex', flexDirection: 'column', gap: 20 }}>
			{[1, 2, 3, 4].map(i => (
				<div key={i} className="skeleton-pulse" style={{ height: 40, width: '100%', borderRadius: 8, background: 'rgba(255,255,255,0.05)' }} />
			))}
		</div>
		{/* Mock Content Area */}
		<div style={{ flex: 1, padding: 44, display: 'flex', flexDirection: 'column', gap: 20 }}>
			<div className="skeleton-pulse" style={{ height: 32, width: '40%', borderRadius: 8, background: '#eee' }} />
			<div className="skeleton-pulse" style={{ height: 100, width: '100%', borderRadius: 12, background: '#f5f5f5' }} />
			<div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20, marginTop: 20 }}>
				<div className="skeleton-pulse" style={{ height: 180, borderRadius: 12, background: '#f5f5f5' }} />
				<div className="skeleton-pulse" style={{ height: 180, borderRadius: 12, background: '#f5f5f5' }} />
			</div>
		</div>
	</div>
);

/* ─── Main ────────────────────────────────────────────────── */
export default function OnboardingPage() {
	const [step, setStep] = useState(0); // Start null to show a loader
	const [dbStep, setDbStep] = useState(null); // Furthest step reached
	const [user, setUser] = useState(null); // Furthest step reached
	const [loading, setLoading] = useState(true);

	const stepMap = { welcome: 0, plan: 1, company: 2, store: 3, shipping: 4, finished: 5 };
	const revStepMap = ['welcome', 'plan', 'company', 'store', 'shipping', 'finished'];

	// PROBLEM 2 FIX: Resume from last time
	useEffect(() => {
		async function init() {
			const { data } = await api.get('/users/me'); // Create this simple GET endpoint
			const user = data?.user || data;
			setUser(user)
			const current = stepMap[user.currentOnboardingStep] || 0;
			setStep(current);
			setDbStep(current);
			setLoading(false);
		}
		init();
	}, []);

	const [nextLoading, setNextLoading] = useState(false);

	const next = async () => {
		// If current step is less than the max saved step, just increment locally
		if (step < dbStep) {
			setStep(s => s + 1);
			return;
		}

		setNextLoading(true); // start loading
		try {
			const { data } = await api.post('/users/onboarding/next');
			const nextIndex = stepMap[data.nextStep];

			setStep(() => nextIndex);
			setDbStep(() => nextIndex);
		} catch (err) {
			toast.error(err.message, { id: tid });
		} finally {
			setNextLoading(false); // stop loading
		}
	};

	const back = () => setStep(s => Math.max(s - 1, 0));
	const finish = async () => {
		const tid = toast.loading('جاري إنهاء الإعداد...');
		try {
			// 1️⃣ Call the same endpoint to move currentOnboardingStep to 'finished' or 'completed'
			await api.post('/users/onboarding/next');

			// 2️⃣ Show success and redirect
			toast.success('اكتمل الإعداد! مرحباً بك 🎉', { id: tid });

			setTimeout(() => {
				window.location.href = '/orders';
			}, 1200);
		} catch (err) {
			const msg = err.response?.data?.message || "حدث خطأ أثناء إنهاء الإعداد";
			toast.error(msg, { id: tid });
		}
	};
	if (loading) {
		return (
			<div style={{
				minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center',
				background: 'linear-gradient(145deg, #eeeef8 0%, #e8e7f4 50%, #f3f3fb 100%)', padding: 24
			}}>
				<OnboardingSkeleton />
			</div>
		);
	}

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
							<WelcomeStep key="w" onNext={next} loading={loading} open={step === 0} nextLoading={nextLoading} />
							<PlanStep key="p" onNext={next} onBack={back} selectedId={user?.subscription?.planId} open={step === 1} nextLoading={nextLoading} />
							<CompanyStep key="c" onNext={next} onBack={back} open={step === 2} nextLoading={nextLoading} />
							<StoreStep key="s" onNext={next} onBack={back} open={step === 3} nextLoading={nextLoading} />
							<ShippingStep key="sh" onNext={finish} onBack={back} open={step === 4} nextLoading={nextLoading} />
						</AnimatePresence>
					</div>
				</motion.div>
			</div>
		</>
	);
}