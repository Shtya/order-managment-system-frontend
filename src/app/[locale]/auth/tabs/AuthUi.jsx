'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTranslations } from 'next-intl';

/* ── Icons ─────────────────────────────────────────────────── */
export const IconEye = () => (
	<svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
		<path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z" /><circle cx="12" cy="12" r="3" />
	</svg>
);
export const IconEyeOff = () => (
	<svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
		<path d="M9.88 9.88a3 3 0 1 0 4.24 4.24" />
		<path d="M10.73 5.08A10.43 10.43 0 0 1 12 5c7 0 10 7 10 7a13.16 13.16 0 0 1-1.67 2.68" />
		<path d="M6.61 6.61A13.526 13.526 0 0 0 2 12s3 7 10 7a9.74 9.74 0 0 0 5.39-1.61" />
		<line x1="2" y1="2" x2="22" y2="22" />
	</svg>
);
export const IconCheck = ({ size = 13 }) => (
	<svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
		<polyline points="20 6 9 17 4 12" />
	</svg>
);
export const IconArrow = ({ dir = 'left' }) => (
	<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
		style={{ transform: dir === 'right' ? 'scaleX(-1)' : 'none' }}>
		<path d="M5 12h14" /><path d="m12 5 7 7-7 7" />
	</svg>
);
export const IconGoogle = () => (
	<svg width="18" height="18" viewBox="0 0 24 24">
		<path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
		<path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
		<path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
		<path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
	</svg>
);

/* ── Field wrapper ─────────────────────────────────────────── */
export function Field({ label, error, children, style }) {
	return (
		<div style={{ marginBottom: 15, ...style }}>
			{label && (
				<label style={{ display: 'block', fontSize: 12.5, fontWeight: 600, color: 'var(--text-2)', marginBottom: 6 }}>
					{label}
				</label>
			)}
			{children}
			<AnimatePresence>
				{error && (
					<motion.p
						initial={{ opacity: 0, height: 0, marginTop: 0 }}
						animate={{ opacity: 1, height: 'auto', marginTop: 5 }}
						exit={{ opacity: 0, height: 0, marginTop: 0 }}
						style={{ fontSize: 11.5, color: '#ef4444', display: 'flex', alignItems: 'center', gap: 4 }}
					>
						⚠ {error}
					</motion.p>
				)}
			</AnimatePresence>
		</div>
	);
}

/* ── Text input with icon ─────────────────────────────────── */
export function AuthInput({ icon, error, style, font, ...props }) {
	return (
		<div style={{ position: 'relative' }} >
			{icon && (
				<span style={{
					position: 'absolute', right: 14, top: '50%', transform: 'translateY(-50%)',
					color: 'var(--text-3)', display: 'flex', pointerEvents: 'none',
				}}>
					{icon}
				</span>
			)}
			<input
				className={`auth-input${error ? ' error' : ''} ${font}`}
				style={{ paddingRight: icon ? 44 : 14, ...style }}
				{...props}
			/>
		</div>
	);
}

/* ── Password input ───────────────────────────────────────── */
export function PasswordInput({ label, icon, error, placeholder, value, onChange, onBlur }) {
	const [show, setShow] = useState(false);
	return (
		<Field label={label} error={error}>
			<div style={{ position: 'relative' }}>
				{icon && (
					<span style={{ position: 'absolute', right: 14, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-3)', display: 'flex', pointerEvents: 'none' }}>
						{icon}
					</span>
				)}
				<input
					type={show ? 'text' : 'password'}
					placeholder={placeholder}
					value={value}
					onChange={onChange}
					onBlur={onBlur}
					className={`auth-input${error ? ' error' : ''}`}
					style={{ paddingRight: icon ? 44 : 14, paddingLeft: 44 }}
				/>
				<button type="button" onClick={() => setShow(s => !s)}
					style={{
						position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)',
						background: 'none', border: 'none', cursor: 'pointer',
						color: 'var(--text-3)', display: 'flex', padding: 4, borderRadius: 6,
						transition: 'color .15s',
					}}
					onMouseOver={e => e.currentTarget.style.color = 'var(--p)'}
					onMouseOut={e => e.currentTarget.style.color = 'var(--text-3)'}
				>
					{show ? <IconEyeOff /> : <IconEye />}
				</button>
			</div>
		</Field>
	);
}

/* ── Password strength meter ──────────────────────────────── */
export function PasswordStrength({ password }) {
	const t = useTranslations('auth');
	const checks = {
		length: password.length >= 8,
		upper: /[A-Z]/.test(password),
		lower: /[a-z]/.test(password),
		number: /[0-9]/.test(password),
	};
	const score = Object.values(checks).filter(Boolean).length;
	const color = score <= 1 ? '#ef4444' : score <= 3 ? '#f59e0b' : '#10b981';
	const label = score <= 1 ? t('strength.weak') : score <= 3 ? t('strength.medium') : t('strength.strong');

	if (!password) return null;
	return (
		<motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} style={{ marginTop: 8 }}>
			<div style={{ display: 'flex', gap: 4, marginBottom: 6 }}>
				{[1, 2, 3, 4].map(i => (
					<div key={i} style={{ flex: 1, height: 3, borderRadius: 99, background: score >= i ? color : 'var(--border)', transition: 'background .3s' }} />
				))}
			</div>
			<div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
				<span style={{ fontSize: 11, color: 'var(--text-3)' }}>{t('strength.label')}</span>
				<span style={{ fontSize: 11, fontWeight: 700, color }}>{label}</span>
			</div>
			<div style={{ display: 'flex', gap: 5, flexWrap: 'wrap' }}>
				{[
					{ key: 'length', label: t('strength.req_length') },
					{ key: 'upper', label: t('strength.req_upper') },
					{ key: 'lower', label: t('strength.req_lower') },
					{ key: 'number', label: t('strength.req_number') },
				].map(r => (
					<span key={r.key} style={{
						display: 'inline-flex', alignItems: 'center', gap: 4,
						fontSize: 11, fontWeight: 600,
						padding: '3px 8px', borderRadius: 99,
						background: checks[r.key] ? '#f0fdf4' : 'var(--surface2)',
						color: checks[r.key] ? '#16a34a' : 'var(--text-3)',
						border: `1px solid ${checks[r.key] ? '#bbf7d0' : 'var(--border)'}`,
						transition: 'all .25s',
					}}>
						{checks[r.key] && <IconCheck size={10} />}
						{r.label}
					</span>
				))}
			</div>
		</motion.div>
	);
}

/* ── Select with icon ─────────────────────────────────────── */
export function AuthSelect({ icon, error, children, style, ...props }) {
	return (
		<div style={{ position: 'relative' }}>
			{icon && (
				<span style={{ position: 'absolute', right: 14, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-3)', display: 'flex', pointerEvents: 'none', zIndex: 1 }}>
					{icon}
				</span>
			)}
			<span style={{
				position: 'absolute', left: 8, top: '50%',
				transform: 'translateY(-50%)',
				color: 'var(--text-3)',
				display: 'flex',
				pointerEvents: 'none',
				zIndex: 1,
				paddingRight: 8,
				borderRight: '1px solid var(--border)',
				height: 20,
				alignItems: 'center',
			}}>        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
					<polyline points="6 9 12 15 18 9" />
				</svg>
			</span>
			<select className={`auth-select${error ? ' error' : ''}`} style={{ paddingRight: icon ? 44 : 14, ...style }} {...props}>
				{children}
			</select>
		</div>
	);
}

/* ── Primary button ───────────────────────────────────────── */
export function BtnPrimary({ children, loading, style, ...props }) {
	return (
		<button type="submit"
			style={{
				width: '100%', height: 50,
				background: 'var(--p)', color: '#fff',
				border: 'none', borderRadius: 'var(--radius-sm)',
				fontFamily: 'var(--font)', fontSize: 15, fontWeight: 700,
				cursor: props.disabled || loading ? 'not-allowed' : 'pointer',
				display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
				boxShadow: '0 6px 20px rgba(103,99,175,.34)',
				transition: 'transform .15s, background .15s, opacity .15s',
				opacity: props.disabled || loading ? .62 : 1,
				...style,
			}}
			onMouseOver={e => { if (!props.disabled && !loading) { e.currentTarget.style.background = 'var(--p2)'; e.currentTarget.style.transform = 'translateY(-1px)'; } }}
			onMouseOut={e => { e.currentTarget.style.background = 'var(--p)'; e.currentTarget.style.transform = 'translateY(0)'; }}
			{...props}
		>
			{loading ? <div className="spinner" /> : children}
		</button>
	);
}

/* ── Ghost button ─────────────────────────────────────────── */
export function BtnGhost({ children, style, ...props }) {
	return (
		<button type="button"
			style={{
				width: '100%', height: 48,
				background: 'transparent', color: 'var(--text-2)',
				border: '1.5px solid var(--border)', borderRadius: 'var(--radius-sm)',
				fontFamily: 'var(--font)', fontSize: 14, fontWeight: 600, cursor: 'pointer',
				display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
				transition: 'border-color .18s, color .18s, background .18s',
				...style,
			}}
			onMouseOver={e => { e.currentTarget.style.borderColor = 'var(--p)'; e.currentTarget.style.color = 'var(--p)'; e.currentTarget.style.background = 'var(--p-xlight)'; }}
			onMouseOut={e => { e.currentTarget.style.borderColor = 'var(--border)'; e.currentTarget.style.color = 'var(--text-2)'; e.currentTarget.style.background = 'transparent'; }}
			{...props}
		>
			{children}
		</button>
	);
}

/* ── Text link button ─────────────────────────────────────── */
export function BtnLink({ children, style, ...props }) {
	return (
		<button type="button"
			style={{
				background: 'none', border: 'none',
				fontFamily: 'var(--font)', fontSize: 13, fontWeight: 700,
				color: 'var(--p)', cursor: 'pointer',
				textDecoration: 'underline', textUnderlineOffset: 3,
				padding: 0, transition: 'color .15s',
				...style,
			}}
			onMouseOver={e => e.currentTarget.style.color = 'var(--p2)'}
			onMouseOut={e => e.currentTarget.style.color = 'var(--p)'}
			{...props}
		>
			{children}
		</button>
	);
}

/* ── Step indicator bar ───────────────────────────────────── */
export function StepBar({ steps, current }) {
	return (
		<div style={{ display: 'flex', alignItems: 'center', marginBottom: 24 }}>
			{steps.map((label, i) => (
				<div key={i} style={{ display: 'flex', alignItems: 'center', flex: i < steps.length - 1 ? 1 : 0 }}>
					<div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 5 }}>
						<div style={{
							width: 28, height: 28, borderRadius: '50%',
							display: 'flex', alignItems: 'center', justifyContent: 'center',
							fontSize: 11.5, fontWeight: 700, flexShrink: 0,
							background: i < current ? 'var(--p)' : i === current ? 'var(--p-xlight)' : 'var(--surface2)',
							color: i < current ? '#fff' : i === current ? 'var(--p)' : 'var(--text-3)',
							border: `2px solid ${i < current ? 'var(--p)' : i === current ? 'var(--p)' : 'var(--border)'}`,
							boxShadow: i === current ? '0 0 0 3px var(--p-glow)' : 'none',
							transition: 'all .3s',
						}}>
							{i < current ? <IconCheck size={11} /> : i + 1}
						</div>
						<span style={{ fontSize: 9.5, fontWeight: 600, color: i === current ? 'var(--p)' : 'var(--text-3)', whiteSpace: 'nowrap' }}>
							{label}
						</span>
					</div>
					{i < steps.length - 1 && (
						<div style={{
							flex: 1, height: 2, borderRadius: 99, margin: '0 5px', marginBottom: 18,
							background: i < current ? 'var(--p)' : 'var(--border)',
							transition: 'background .4s',
						}} />
					)}
				</div>
			))}
		</div>
	);
}

/* ── OTP 6-cell input ─────────────────────────────────────── */
export function OtpInput({ value, onChange, hasError }) {
	const vals = value.split('');

	const handleKey = (e, idx) => {
		if (/^\d$/.test(e.key)) {
			const arr = vals.slice();
			arr[idx] = e.key;
			onChange(arr.join('').slice(0, 6));
			if (idx < 5) document.getElementById(`otp-${idx + 1}`)?.focus();
		} else if (e.key === 'Backspace') {
			const arr = vals.slice();
			arr[idx] = '';
			onChange(arr.join(''));
			if (idx > 0) document.getElementById(`otp-${idx - 1}`)?.focus();
		}
		e.preventDefault();
	};

	const handlePaste = (e) => {
		const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6);
		onChange(pasted);
		document.getElementById(`otp-${Math.min(pasted.length, 5)}`)?.focus();
		e.preventDefault();
	};

	return (
		<div style={{ display: 'flex', gap: 8, justifyContent: 'center', direction: 'ltr' }}>
			{Array(6).fill('').map((_, i) => (
				<input
					key={i} id={`otp-${i}`}
					type="tel" maxLength={1}
					value={vals[i] || ''}
					onKeyDown={e => handleKey(e, i)}
					onPaste={handlePaste}
					onChange={() => { }}
					autoFocus={i === 0}
					className={`otp-cell${vals[i] ? ' filled' : ''}${hasError ? ' error-cell' : ''}`}
				/>
			))}
		</div>
	);
}

/* ── Divider ──────────────────────────────────────────────── */
export function Divider({ label }) {
	return (
		<div style={{ display: 'flex', alignItems: 'center', gap: 12, margin: '18px 0' }}>
			<div style={{ flex: 1, height: 1, background: 'var(--border)' }} />
			<span style={{ fontSize: 11.5, color: 'var(--text-3)', fontWeight: 500, whiteSpace: 'nowrap' }}>{label}</span>
			<div style={{ flex: 1, height: 1, background: 'var(--border)' }} />
		</div>
	);
}