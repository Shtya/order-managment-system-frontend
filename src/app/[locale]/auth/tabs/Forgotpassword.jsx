'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import toast from 'react-hot-toast';
import { useTranslations } from 'next-intl';
import { Field, AuthInput, PasswordInput, PasswordStrength, BtnPrimary, BtnLink, OtpInput, IconArrow } from './AuthUi';

const MailIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="2" y="4" width="20" height="16" rx="2" /><path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" />
  </svg>
);
const LockIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="11" width="18" height="11" rx="2" /><path d="M7 11V7a5 5 0 0 1 10 0v4" />
  </svg>
);

const IconBadge = ({ icon }) => (
  <div style={{ width: "clamp(44px, 12vw, 50px)", height: "clamp(44px, 12vw, 50px)", borderRadius: 13, background: 'var(--p-xlight)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--p)', flexShrink: 0 }}>
    {icon}
  </div>
);

export default function ForgotPassword({ t: tProp, onBack }) {
  const tLocal = useTranslations('auth');
  const t = tProp ?? tLocal;

  const [step, setStep] = useState(0); // 0=email 1=otp 2=reset 3=done
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [otpErr, setOtpErr] = useState(false);
  const [pw, setPw] = useState('');
  const [cpw, setCpw] = useState('');
  const [touched, setTouched] = useState({});
  const [loading, setLoading] = useState(false);
  const [timer, setTimer] = useState(120);
  const [canResend, setCanResend] = useState(false);

  useEffect(() => {
    if (step !== 1) return;
    setTimer(120); setCanResend(false);
    const iv = setInterval(() => setTimer(p => {
      if (p <= 1) { clearInterval(iv); setCanResend(true); return 0; }
      return p - 1;
    }), 1000);
    return () => clearInterval(iv);
  }, [step]);

  const fmt = s => `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;

  const emailErr = !email.trim() ? t('validation.required') : !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) ? t('validation.email_invalid') : '';
  const pwErr = !pw ? t('validation.required') : pw.length < 8 ? t('validation.password_min') : '';
  const cpwErr = !cpw ? t('validation.required') : pw !== cpw ? t('validation.passwords_match') : '';

  const post = async (url, body) => {
    const res = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL}${url}`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
    const data = await res.json();
    if (!res.ok) throw data;
    return data;
  };

  const sendOtp = async () => {
    setTouched({ email: true });
    if (emailErr) return;
    setLoading(true);
    const tid = toast.loading(t('forgot.sending'));
    try {
      await post('/auth/forgot-password', { email });
      toast.success(t('forgot.sent'), { id: tid });
      setStep(1);
    } catch (err) { toast.error(err?.message || t('forgot.error'), { id: tid }); }
    finally { setLoading(false); }
  };

  const verifyOtp = async () => {
    if (otp.length !== 6) { setOtpErr(true); return; }
    setLoading(true);
    const tid = toast.loading(t('forgot.verifying'));
    try {
      await post('/auth/verify-otp', { email, otp });
      toast.success(t('forgot.verified'), { id: tid });
      setOtpErr(false); setStep(2);
    } catch (err) {
      setOtpErr(true); setOtp('');
      toast.error(err?.message || t('forgot.otp_wrong'), { id: tid });
    }
    finally { setLoading(false); }
  };

  const resetPw = async () => {
    setTouched({ pw: true, cpw: true });
    if (pwErr || cpwErr) return;
    setLoading(true);
    const tid = toast.loading(t('forgot.resetting'));
    try {
      await post('/auth/reset-password', { email, newPassword: pw });
      toast.success(t('forgot.reset_success'), { id: tid });
      setStep(3);
      setTimeout(onBack, 2000);
    } catch (err) { toast.error(err?.message || t('forgot.error'), { id: tid }); }
    finally { setLoading(false); }
  };

  return (
    <motion.div key="forgot" initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -14 }} transition={{ duration: .28 }}>
      <AnimatePresence mode="wait">

        {/* ── Step 0: email ── */}
        {step === 0 && (
          <motion.div key="f0" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} transition={{ duration: .25 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: "clamp(16px, 5vw, 22px)" }}>
              <IconBadge icon={<MailIcon />} />
              <div>
                <h2 style={{ fontSize: "clamp(17px, 5vw, 19px)", fontWeight: 800, color: 'var(--text)', marginBottom: 3 }}>{t('forgot.title')}</h2>
                <p style={{ fontSize: "clamp(12px, 3.5vw, 13px)", color: 'var(--text-3)' }}>{t('forgot.sub')}</p>
              </div>
            </div>
            <Field label={t('forgot.email')} error={touched.email && emailErr}>
              <AuthInput type="email" placeholder={t('forgot.email_placeholder')}
                value={email} onChange={e => setEmail(e.target.value)}
                onBlur={() => setTouched(p => ({ ...p, email: true }))}
                error={touched.email && emailErr} icon={<MailIcon />}
                style={{ textAlign: 'right' }}
              />
            </Field>
            <BtnPrimary loading={loading} type="button" onClick={sendOtp}>
              {t('forgot.submit')} <IconArrow className="rtl:scale-[-1]!" />
            </BtnPrimary>
            <p style={{ textAlign: 'center', fontSize: 13, color: 'var(--text-3)', marginTop: 16 }}>
              <BtnLink onClick={onBack}>{t('forgot.back')}</BtnLink>
            </p>
          </motion.div>
        )}

        {/* ── Step 1: OTP ── */}
        {step === 1 && (
          <motion.div key="f1" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} transition={{ duration: .25 }}>
            <div style={{ textAlign: 'center', marginBottom: "clamp(16px, 5vw, 22px)" }}>
              <div style={{ width: "clamp(50px, 14vw, 60px)", height: "clamp(50px, 14vw, 60px)", borderRadius: 16, margin: '0 auto 12px', background: 'var(--p-xlight)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <span style={{ fontSize: "clamp(24px, 6vw, 28px)" }}>🔐</span>
              </div>
              <h2 style={{ fontSize: "clamp(17px, 5vw, 19px)", fontWeight: 800, color: 'var(--text)', marginBottom: 5 }}>{t('forgot.otp_title')}</h2>
              <p style={{ fontSize: "clamp(12px, 3.5vw, 13px)", color: 'var(--text-3)' }}>
                {t('forgot.otp_sub')}{' '}
                <span style={{ fontWeight: 700, color: 'var(--text)', display: 'inline-block' }}>{email}</span>
              </p>
            </div>

            <OtpInput value={otp} onChange={v => { setOtp(v); setOtpErr(false); }} hasError={otpErr} />
            {otpErr && <p style={{ textAlign: 'center', fontSize: 12, color: '#ef4444', marginTop: 7 }}>⚠ {t('forgot.otp_wrong')}</p>}

            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', margin: '14px 0', fontSize: 13, color: 'var(--text-3)' }}>
              <span>{!canResend ? `${t('forgot.otp_timer')} ${fmt(timer)}` : t('forgot.otp_expired')}</span>
              <BtnLink style={{ opacity: canResend ? 1 : .4, pointerEvents: canResend ? 'auto' : 'none' }}
                onClick={async () => {
                  if (!canResend) return;
                  setCanResend(false); setOtp(''); setOtpErr(false);
                  const tid = toast.loading(t('forgot.resending'));
                  try { await post('/auth/forgot-password', { email }); toast.success(t('forgot.resent'), { id: tid }); setTimer(120); }
                  catch { toast.error(t('forgot.error'), { id: tid }); setCanResend(true); }
                }}>
                {t('forgot.otp_resend')}
              </BtnLink>
            </div>

            <BtnPrimary loading={loading} type="button" onClick={verifyOtp} disabled={otp.length !== 6}>
              {t('forgot.otp_verify')} <IconArrow className="rtl:scale-[-1]!" />
            </BtnPrimary>
          </motion.div>
        )}

        {/* ── Step 2: reset ── */}
        {step === 2 && (
          <motion.div key="f2" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} transition={{ duration: .25 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: "clamp(16px, 5vw, 22px)" }}>
              <IconBadge icon={<LockIcon />} />
              <div>
                <h2 style={{ fontSize: "clamp(17px, 5vw, 19px)", fontWeight: 800, color: 'var(--text)', marginBottom: 3 }}>{t('forgot.reset_title')}</h2>
                <p style={{ fontSize: "clamp(12px, 3.5vw, 13px)", color: 'var(--text-3)' }}>{t('forgot.reset_sub')}</p>
              </div>
            </div>
            <PasswordInput label={t('forgot.new_password')} placeholder={t('signup.password_placeholder')}
              value={pw} onChange={e => setPw(e.target.value)} onBlur={() => setTouched(p => ({ ...p, pw: true }))}
              error={touched.pw && pwErr} icon={<LockIcon />}
            />
            <PasswordStrength password={pw} />
            <div style={{ marginTop: 12 }}>
              <PasswordInput label={t('forgot.confirm')} placeholder={t('signup.confirm_placeholder')}
                value={cpw} onChange={e => setCpw(e.target.value)} onBlur={() => setTouched(p => ({ ...p, cpw: true }))}
                error={touched.cpw && cpwErr} icon={<LockIcon />}
              />
            </div>
            <BtnPrimary loading={loading} type="button" onClick={resetPw} style={{ marginTop: 8 }}>
              {t('forgot.reset_submit')} <IconArrow className="rtl:scale-[-1]!" />
            </BtnPrimary>
          </motion.div>
        )}

        {/* ── Step 3: done ── */}
        {step === 3 && (
          <motion.div key="f3" initial={{ opacity: 0, scale: .92 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }} transition={{ duration: .35 }}
            style={{ textAlign: 'center', padding: '36px 20px' }}>
            <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: 'spring', duration: .6 }}
              style={{ fontSize: 60, marginBottom: 14 }}>✅</motion.div>
            <h2 style={{ fontSize: 21, fontWeight: 800, color: 'var(--text)', marginBottom: 8 }}>{t('forgot.done_title')}</h2>
            <p style={{ fontSize: 13.5, color: 'var(--text-3)' }}>{t('forgot.done_sub')}</p>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, marginTop: 18 }}>
              <motion.div animate={{ scale: [1, 1.2, 1] }} transition={{ duration: 1, repeat: Infinity }}
                style={{ width: 8, height: 8, borderRadius: '50%', background: 'var(--p)' }} />
              <span style={{ fontSize: 13, color: 'var(--text-3)' }}>{t('forgot.redirecting')}</span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}