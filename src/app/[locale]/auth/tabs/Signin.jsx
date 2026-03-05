'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';
import { useTranslations } from 'next-intl';
import { Field, AuthInput, PasswordInput, BtnPrimary, BtnGhost, BtnLink, Divider, IconGoogle, IconArrow } from './AuthUi';

const MailIcon = () => (
  <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="2" y="4" width="20" height="16" rx="2"/><path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7"/>
  </svg>
);
const LockIcon = () => (
  <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/>
  </svg>
);

export default function SignIn({ t: tProp, onSwitchMode, onForgotPassword }) {
  const tLocal = useTranslations('auth');
  const t = tProp ?? tLocal;

  const [email,    setEmail]    = useState('');
  const [password, setPassword] = useState('');
  const [touched,  setTouched]  = useState({});
  const [loading,  setLoading]  = useState(false);

  const errors = {
    email:    !email.trim()    ? t('validation.required') : !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) ? t('validation.email_invalid') : '',
    password: !password.trim() ? t('validation.required') : password.length < 6 ? t('validation.password_min') : '',
  };
  const touch = k => setTouched(p => ({ ...p, [k]: true }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setTouched({ email: true, password: true });
    if (errors.email || errors.password) return;
    setLoading(true);
    const tid = toast.loading(t('signin.loading'));
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL}/auth/login`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });
      const data = await res.json();
      if (!res.ok) throw data;
      if (data?.accessToken) {
        localStorage.setItem('accessToken', data.accessToken);
        localStorage.setItem('user', JSON.stringify(data.user));
      }
      toast.success(t('signin.success'), { id: tid });
      const role = String(data?.user?.role?.name || '').toUpperCase();
      setTimeout(() => { window.location.href = role === 'SUPER_ADMIN' ? '/dashboard/users' : '/orders'; }, 900);
    } catch (err) {
      toast.error(err?.message || t('signin.error'), { id: tid });
    } finally { setLoading(false); }
  };

  return (
    <motion.div key="signin" initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -14 }} transition={{ duration: .28 }}>
      <div style={{ marginBottom: 24 }}>
        <h2 style={{ fontSize: 21, fontWeight: 800, color: 'var(--text)', letterSpacing: '-.4px', marginBottom: 4 }}>
          {t('signin.title')}
        </h2>
        <p style={{ fontSize: 13, color: 'var(--text-3)' }}>{t('signin.subtitle')}</p>
      </div>

      <form onSubmit={handleSubmit} noValidate>
        <Field label={t('signin.email')} error={touched.email && errors.email}>
          <AuthInput type="email" placeholder={t('signin.email_placeholder')}
            value={email} onChange={e => setEmail(e.target.value)} onBlur={() => touch('email')}
            error={touched.email && errors.email} icon={<MailIcon />}
						font="font-en"
            style={{ direction: 'ltr', textAlign: 'right' }}
          />
        </Field>

        <PasswordInput
          label={t('signin.password')} placeholder={t('signin.password_placeholder')}
          value={password} onChange={e => setPassword(e.target.value)} onBlur={() => touch('password')}
          error={touched.password && errors.password} icon={<LockIcon />}
        />

        <div style={{ textAlign: 'left', marginTop: -6, marginBottom: 20 }}>
          <BtnLink onClick={onForgotPassword}>{t('signin.forgot')}</BtnLink>
        </div>

        <BtnPrimary loading={loading} disabled={loading}>
          {t('signin.submit')} <IconArrow dir="right" />
        </BtnPrimary>

        <Divider label={t('signin.or')} />

        <BtnGhost onClick={() => toast.error(t('signin.google_wip'))}>
          <IconGoogle /> {t('signin.google')}
        </BtnGhost>
      </form>
 
    </motion.div>
  );
}