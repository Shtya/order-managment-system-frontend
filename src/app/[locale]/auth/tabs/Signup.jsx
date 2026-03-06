'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import toast from 'react-hot-toast';
import { useTranslations } from 'next-intl';
import { Field, AuthInput, PasswordInput, PasswordStrength, AuthSelect, BtnPrimary, BtnLink, OtpInput, StepBar, IconArrow } from './AuthUi';
import { useRouter } from '@/i18n/navigation';

/* ── Icons ── */
const EmailIcon = () => <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="20" height="16" x="2" y="4" rx="2" /><path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" /></svg>;
const UserIcon = () => <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="8" r="5" /><path d="M20 21a8 8 0 1 0-16 0" /></svg>;
const StoreIcon = () => <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m2 7 4.41-4.41A2 2 0 0 1 7.83 2h8.34a2 2 0 0 1 1.42.59L22 7" /><path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8" /><path d="M15 22v-4a2 2 0 0 0-2-2h-2a2 2 0 0 0-2 2v4" /></svg>;
const LockIcon = () => <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="11" width="18" height="11" rx="2" /><path d="M7 11V7a5 5 0 0 1 10 0v4" /></svg>;
const BackBtn = ({ onClick }) => (
	<button type="button" onClick={onClick}
		style={{ width: 48, height: 48, flexShrink: 0, background: 'var(--surface2)', border: '1.5px solid var(--border)', borderRadius: 'var(--radius-sm)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-2)', transition: 'all .18s' }}
		onMouseOver={e => { e.currentTarget.style.borderColor = 'var(--p)'; e.currentTarget.style.color = 'var(--p)'; }}
		onMouseOut={e => { e.currentTarget.style.borderColor = 'var(--border)'; e.currentTarget.style.color = 'var(--text-2)'; }}
	>
		<IconArrow />
	</button>
);

const PHONE_CODES = [
	{ code: '+20', flag: '🇪🇬', name: 'مصر' },
	{ code: '+966', flag: '🇸🇦', name: 'السعودية' },
	{ code: '+971', flag: '🇦🇪', name: 'الإمارات' },
	{ code: '+965', flag: '🇰🇼', name: 'الكويت' },
	{ code: '+974', flag: '🇶🇦', name: 'قطر' },
	{ code: '+973', flag: '🇧🇭', name: 'البحرين' },
	{ code: '+968', flag: '🇴🇲', name: 'عمان' },
	{ code: '+962', flag: '🇯🇴', name: 'الأردن' },
	{ code: '+961', flag: '🇱🇧', name: 'لبنان' },
	{ code: '+1', flag: '🇺🇸', name: 'USA' },
];

/* ── Main ── */
export default function SignUp({ t: tProp, onSwitchMode }) {

	const tLocal = useTranslations('auth');
	const t = tProp ?? tLocal;

	const [step, setStep] = useState(0);
	const [formData, setFormData] = useState({});
	const merge = d => setFormData(p => ({ ...p, ...d }));

	const STEPS = [t('signup.step_account'), t('signup.step_biz'), t('signup.step_security'), t('signup.step_verify')];

	const register = async ({ password }) => {
		const tid = toast.loading(t('signup.creating'));
		try {
			const res = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL}/auth/register`, {
				method: 'POST', headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({
					name: formData.name,
					email: formData.email,
					companyName: formData.company,
					phone: `${formData.dial || '+20'}${formData.phone}`,
					businessType: formData.businessType,
					password: formData.password || password,
				}),
			});
			const data = await res.json();
			if (!res.ok) throw data;
			toast.success(t('signup.success'), { id: tid });
			setStep(3);
		} catch (err) {
			toast.error(err?.message || t('signup.error'), { id: tid });
		}
	};

	async function onVerified(data) {
		if (data?.accessToken) {
			localStorage.setItem('accessToken', data.accessToken);
			localStorage.setItem('user', JSON.stringify(data.user));
		}
		await fetch('/api/auth/login', {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({ accessToken: data.accessToken, user: data.user }),
		});
		window.location.href = '/onboarding';
	}

	return (
		<motion.div key="signup" initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -14 }} transition={{ duration: .28 }}>
			<StepBar steps={STEPS} current={step} />

			<AnimatePresence mode="wait">
				{step === 0 && <Step1 key="s1" data={formData} onChange={merge} onNext={() => setStep(1)} t={t} />}
				{step === 1 && <Step2 key="s2" data={formData} onChange={merge} onNext={() => setStep(2)} onBack={() => setStep(0)} t={t} />}
				{step === 2 && <Step3 key="s3" onNext={async d => { merge(d); await register(d); }} onBack={() => setStep(1)} t={t} />}
				{step === 3 && <Step4 key="s4" email={formData.email} onVerified={onVerified} t={t} />}
			</AnimatePresence>

			{step === 0 && (
				<>
					<p style={{ textAlign: 'center', fontSize: 13, color: 'var(--text-3)', marginTop: 18 }}>
						{t('signup.has_account')}{' '}
						<BtnLink onClick={onSwitchMode}>{t('signup.login')}</BtnLink>
					</p>
					<p style={{ fontSize: 11, color: 'var(--text-3)', textAlign: 'center', marginTop: 12, lineHeight: 1.7 }}>
						{t('signup.terms')}{' '}
						<BtnLink style={{ fontSize: 11 }}>{t('signup.terms_link')}</BtnLink>
						{' '}{t('signup.and')}{' '}
						<BtnLink style={{ fontSize: 11 }}>{t('signup.privacy')}</BtnLink>
					</p>
				</>
			)}
		</motion.div>
	);
}

const BIZ_TYPES_KEYS = ['ecommerce', 'wholesale', 'retail', 'dropshipping', 'brand', 'other'];

/* ── Step 1 ── */
function Step1({ data, onChange, onNext, t }) {
	const [touched, setTouched] = useState({});
	const [dial, setDial] = useState('+20');
	const touch = k => setTouched(p => ({ ...p, [k]: true }));

	const errs = {
		name: !data.name?.trim() ? t('validation.required') : '',
		company: !data.company?.trim() ? t('validation.required') : '',
		phone: !data.phone?.trim() ? t('validation.required') : !/^[0-9]{7,11}$/.test(data.phone.trim()) ? t('validation.phone_invalid') : '',
	};

	const next = () => {
		setTouched({ name: true, company: true, phone: true });
		if (errs.name || errs.company || errs.phone) return;
		onChange({ dial });
		onNext();
	};

	return (
		<motion.div key="su1" initial={{ opacity: 0, x: 30 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -30 }} transition={{ duration: .25 }}>
			<div style={{ marginBottom: 20 }}>
				<h2 style={{ fontSize: 19, fontWeight: 800, color: 'var(--text)', marginBottom: 3 }}>{t('signup.step1_title')}</h2>
				<p style={{ fontSize: 13, color: 'var(--text-3)' }}>{t('signup.step1_sub')}</p>
			</div>

			<Field label={t('signup.name')} error={touched.name && errs.name}>
				<AuthInput type="text" placeholder={t('signup.name_placeholder')}
					value={data.name || ''} onChange={e => onChange({ name: e.target.value })}
					onBlur={() => touch('name')} error={touched.name && errs.name} icon={<UserIcon />}
				/>
			</Field>

			<Field label={t('signup.company')} error={touched.company && errs.company}>
				<AuthInput type="text" placeholder={t('signup.company_placeholder')}
					value={data.company || ''} onChange={e => onChange({ company: e.target.value })}
					onBlur={() => touch('company')} error={touched.company && errs.company} icon={<StoreIcon />}
				/>
			</Field>
			<Field label={t('signup.email')} error={touched.email && errs.email}>
				<AuthInput type="email" placeholder={t('signup.email_placeholder')}
					value={data.email || ''} onChange={e => onChange({ email: e.target.value })}
					onBlur={() => touch('email')} error={touched.email && errs.email} icon={<EmailIcon />}
				/>
			</Field>

			<Field label={t('signup.phone')} error={touched.phone && errs.phone}>
				<div style={{ display: 'flex', gap: 8 }}>
					<div style={{ position: 'relative', flexShrink: 0, minWidth: 90 }}>
						<span style={{
							position: 'absolute', left: 8, top: '50%', transform: 'translateY(-50%)',
							color: 'var(--text-3)', display: 'flex', pointerEvents: 'none', zIndex: 1,
							paddingRight: 8, borderRight: '1px solid var(--border)', height: 20, alignItems: 'center',
						}}>
							<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
								<polyline points="6 9 12 15 18 9" />
							</svg>
						</span>
						<select
							value={dial}
							onChange={e => setDial(e.target.value)}
							style={{
								height: 48,
								background: 'var(--surface2)',
								border: '1.5px solid var(--border)',
								borderRadius: 'var(--radius-sm)',
								fontFamily: 'var(--font)',
								fontSize: 13,
								color: 'var(--text)',
								padding: '0 10px 0 32px',
								cursor: 'pointer',
								outline: 'none',
								width: '100%',
								direction: 'ltr',
								appearance: 'none',
							}}
						>
							{PHONE_CODES.map(c => <option key={c.code} value={c.code}>{c.flag} {c.code}</option>)}
						</select>
					</div>

					<input type="tel" placeholder={t('signup.phone_placeholder')}
						value={data.phone || ''} onChange={e => onChange({ phone: e.target.value })} onBlur={() => touch('phone')}
						className={`auth-input${touched.phone && errs.phone ? ' error' : ''}`}
						style={{ flex: 1, paddingRight: 14, direction: 'ltr', textAlign: 'left' }}
					/>
				</div>
			</Field>

			<BtnPrimary type="button" onClick={next}>
				{t('signup.next')} <IconArrow dir="right" />
			</BtnPrimary>
		</motion.div>
	);
}

/* ── Step 2 ── */
function Step2({ data, onChange, onNext, onBack, t }) {
	const [touched, setTouched] = useState({});
	const err = !data.businessType ? t('validation.required') : '';

	const next = () => {
		setTouched({ biz: true });
		if (err) return;
		onNext();
	};

	return (
		<motion.div key="su2" initial={{ opacity: 0, x: 30 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -30 }} transition={{ duration: .25 }}>
			<div style={{ marginBottom: 20 }}>
				<h2 style={{ fontSize: 19, fontWeight: 800, color: 'var(--text)', marginBottom: 3 }}>{t('signup.step2_title')}</h2>
				<p style={{ fontSize: 13, color: 'var(--text-3)' }}>{t('signup.step2_sub')}</p>
			</div>

			<Field label={t('signup.business_type')} error={touched.biz && err}>
				<AuthSelect value={data.businessType || ''} onChange={e => onChange({ businessType: e.target.value })} onBlur={() => setTouched(p => ({ ...p, biz: true }))} error={touched.biz && err} icon={<StoreIcon />}>
					<option value="">{t('signup.business_placeholder')}</option>
					{BIZ_TYPES_KEYS.map(k => <option key={k} value={k}>{t(`signup.business_${k}`)}</option>)}
				</AuthSelect>
			</Field>

			<div style={{ background: 'var(--p-xlight)', borderRadius: 12, padding: '12px 14px', marginBottom: 20, border: '1px solid rgba(103,99,175,.14)', display: 'flex', gap: 10, alignItems: 'flex-start' }}>
				<span style={{ fontSize: 18 }}>💡</span>
				<p style={{ fontSize: 12.5, color: 'var(--p-dark)', lineHeight: 1.65 }}>{t('signup.biz_hint')}</p>
			</div>

			<div style={{ display: 'flex', gap: 10 }}>
				<BackBtn onClick={onBack} />
				<BtnPrimary type="button" onClick={next} style={{ flex: 1 }}>
					{t('signup.next')} <IconArrow dir="right" />
				</BtnPrimary>
			</div>
		</motion.div>
	);
}

/* ── Step 3 ── */
function Step3({ onNext, onBack, t }) {
	const [pw, setPw] = useState('');
	const [cpw, setCpw] = useState('');
	const [touched, setTouched] = useState({});

	const pwErr = !pw ? t('validation.required') : pw.length < 8 ? t('validation.password_min') : '';
	const cpwErr = !cpw ? t('validation.required') : pw !== cpw ? t('validation.passwords_match') : '';

	const next = () => {
		setTouched({ pw: true, cpw: true });
		if (pwErr || cpwErr) return;
		const score = [/[A-Z]/, /[a-z]/, /[0-9]/].filter(r => r.test(pw)).length + (pw.length >= 8 ? 1 : 0);
		if (score < 3) { toast.error(t('signup.pw_weak')); return; }
		onNext({ password: pw });
	};

	return (
		<motion.div key="su3" initial={{ opacity: 0, x: 30 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -30 }} transition={{ duration: .25 }}>
			<div style={{ marginBottom: 20 }}>
				<h2 style={{ fontSize: 19, fontWeight: 800, color: 'var(--text)', marginBottom: 3 }}>{t('signup.step3_title')}</h2>
				<p style={{ fontSize: 13, color: 'var(--text-3)' }}>{t('signup.step3_sub')}</p>
			</div>

			<PasswordInput label={t('signup.password')} placeholder={t('signup.password_placeholder')}
				value={pw} onChange={e => setPw(e.target.value)} onBlur={() => setTouched(p => ({ ...p, pw: true }))}
				error={touched.pw && pwErr} icon={<LockIcon />}
			/>
			<PasswordStrength password={pw} t={t} />

			<div style={{ marginTop: 12 }}>
				<PasswordInput label={t('signup.confirm_password')} placeholder={t('signup.confirm_placeholder')}
					value={cpw} onChange={e => setCpw(e.target.value)} onBlur={() => setTouched(p => ({ ...p, cpw: true }))}
					error={touched.cpw && cpwErr} icon={<LockIcon />}
				/>
			</div>

			<div style={{ display: 'flex', gap: 10, marginTop: 4 }}>
				<BackBtn onClick={onBack} />
				<BtnPrimary type="button" onClick={next} style={{ flex: 1 }}>
					{t('signup.next')} <IconArrow dir="right" />
				</BtnPrimary>
			</div>
		</motion.div>
	);
}

/* ── Step 4: OTP ── */
function Step4({ email, onVerified, t }) {
	const [otp, setOtp] = useState('');
	const [otpErr, setOtpErr] = useState(false);
	const [loading, setLoading] = useState(false);
	const [resending, setResending] = useState(false);
	const [timer, setTimer] = useState(120);
	const [canResend, setCanResend] = useState(false);

	useEffect(() => {
		const iv = setInterval(() => setTimer(p => {
			if (p <= 1) { clearInterval(iv); setCanResend(true); return 0; }
			return p - 1;
		}), 1000);
		return () => clearInterval(iv);
	}, []);

	const fmt = s => `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;

	const verify = async () => {
		if (otp.length !== 6) { setOtpErr(true); return; }
		setLoading(true);
		const tid = toast.loading(t('signup.otp_verifying'));
		try {
			const res = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL}/auth/verify-registration`, {
				method: 'POST', headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ email, otp }),
			});
			const data = await res.json();
			if (!res.ok) throw data;

			toast.success(t('signup.otp_success'), { id: tid });
			setOtpErr(false);
			onVerified(data);
		} catch (err) {
			setOtpErr(true); setOtp('');

			toast.error(err?.message || t('signup.otp_wrong'), { id: tid });
		} finally { setLoading(false); }
	};

	// --- New Resend Logic ---
	const handleResend = async () => {
		if (!canResend || resending) return;

		setResending(true);
		const tid = toast.loading(t('signup.resending'));
		try {
			const res = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL}/auth/resend-registration-otp`, {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ email }),
			});
			const data = await res.json();
			if (!res.ok) throw data;

			toast.success(t('signup.resend_success'), { id: tid });

			// Reset UI state
			setCanResend(false);
			setTimer(120);
			setOtp('');
			setOtpErr(false);
		} catch (err) {
			toast.error(err?.message || t('signup.resend_error'), { id: tid });
		} finally {
			setResending(false);
		}
	};

	return (
		<motion.div key="su4" initial={{ opacity: 0, x: 30 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -30 }} transition={{ duration: .25 }}>
			<div style={{ textAlign: 'center', marginBottom: 22 }}>
				<div style={{ width: 60, height: 60, borderRadius: 16, margin: '0 auto 12px', background: 'var(--p-xlight)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
					<span style={{ fontSize: 28 }}>📧</span>
				</div>
				<h2 style={{ fontSize: 19, fontWeight: 800, color: 'var(--text)', marginBottom: 5 }}>{t('signup.otp_title')}</h2>
				<p style={{ fontSize: 13, color: 'var(--text-3)', lineHeight: 1.6 }}>
					{t('signup.otp_sub')}{' '}
					<span style={{ fontWeight: 700, color: 'var(--text)', direction: 'ltr', display: 'inline-block' }}>{email}</span>
				</p>
			</div>

			<OtpInput value={otp} onChange={v => { setOtp(v); setOtpErr(false); }} hasError={otpErr} />
			{otpErr && <p style={{ textAlign: 'center', fontSize: 12, color: '#ef4444', marginTop: 7 }}>⚠ {t('signup.otp_wrong')}</p>}

			<div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', margin: '14px 0', fontSize: 13, color: 'var(--text-3)' }}>
				<span>{!canResend ? `${t('signup.otp_timer')} ${fmt(timer)}` : t('signup.otp_expired')}</span>

				<BtnLink
					style={{
						opacity: (canResend && !resending) ? 1 : .4,
						pointerEvents: (canResend && !resending) ? 'auto' : 'none'
					}}
					onClick={handleResend}
				>
					{resending ? t('signup.loading') : t('signup.otp_resend')}
				</BtnLink>
			</div>

			<BtnPrimary loading={loading} type="button" onClick={verify} disabled={otp.length !== 6}>
				{t('signup.otp_verify')} <IconArrow dir="right" />
			</BtnPrimary>
		</motion.div>
	);
}

