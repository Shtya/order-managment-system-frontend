'use client';

import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';
import { useTranslations } from 'next-intl';
import { Field, AuthInput, PasswordInput, BtnPrimary, BtnGhost, BtnLink, Divider, IconGoogle, IconArrow } from './AuthUi';
import { useSearchParams } from 'next/navigation';
import { usePathname, useRouter } from '@/i18n/navigation';
import { useAuth } from '@/context/AuthContext';

const MailIcon = () => (
  <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="2" y="4" width="20" height="16" rx="2" /><path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" />
  </svg>
);
const LockIcon = () => (
  <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="11" width="18" height="11" rx="2" /><path d="M7 11V7a5 5 0 0 1 10 0v4" />
  </svg>
);

export default function SignIn({ t: tProp, onSwitchMode, onForgotPassword }) {
  const tLocal = useTranslations('auth');
  const t = tProp ?? tLocal;
  const searchParams = useSearchParams()
  const router = useRouter()
  const pathname = usePathname()
  const redirectUrl = searchParams.get("redirect")
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [touched, setTouched] = useState({});
  const [loading, setLoading] = useState(false);
  const loginError = searchParams?.get('error');


  useEffect(() => {
    if (loginError === 'google_failed') {
      toast.error(t('signin.google_failed'));

      // 1. Create a fresh params object from the current ones
      const params = new URLSearchParams(searchParams.toString());

      // 2. Remove the error
      params.delete('error');

      // 3. Construct the new string
      const queryString = params.toString();
      const newPath = queryString ? `${pathname}?${queryString}` : pathname;

      // 4. Replace the URL without scrolling or triggering a re-fetch
      router.replace(newPath, { scroll: false });
    }
  }, [loginError, t, router, pathname, searchParams]);

  const errors = {
    email: !email.trim() ? t('validation.required') : !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) ? t('validation.email_invalid') : '',
    password: !password.trim() ? t('validation.required') : password.length < 6 ? t('validation.password_min') : '',
  };
  const touch = k => setTouched(p => ({ ...p, [k]: true }));

  const { login } = useAuth();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setTouched({ email: true, password: true });
    if (errors.email || errors.password) return;
    setLoading(true);
    const tid = toast.loading(t('signin.loading'));

    try {
      await login(email, password);
      toast.success(t('signin.success'), { id: tid });
    } catch (error) {
      const status = error?.response?.status || error?.status;

      if (status === 401) {
        toast.error(t("signin.session_expired"), { id: tid });
      } else if (status === 403) {
        toast.error(t("signin.no_permission"), { id: tid });
      } else {
        toast.error(t("signin.invalid_credentials"), { id: tid });
      }

      setTimeout(() => {
        router.push("/auth?mode=signin");
      }, 1200);
    } finally {
      setLoading(false);
    }
  };


  const handleGoogleLogin = async () => {
    // Use URL constructor to prevent double slashes or formatting errors
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL;
    const targetUrl = new URL("auth/google", baseUrl);

    if (redirectUrl) {
      targetUrl.searchParams.append('redirect', redirectUrl);
    }

    try {
      const res = await fetch(targetUrl.toString());

      const data = await res.json();
      if (!res.ok) throw data;

      // Ensure the backend actually returns a field named redirectUrl
      if (data.redirectUrl) {
        window.location.href = data.redirectUrl;
      } else {
        toast.error(t('signin.googleLoginFailed'));
      }
    } catch (error) {
      console.error("Google Login Error:", error);
      toast.error(t('signin.googleLoginFailed'));
    }
  };


  return (
    <motion.div key="signin" initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -14 }} transition={{ duration: .28 }}>
      <div style={{ marginBottom: "clamp(16px, 5vw, 24px)" }}>
        <h2 style={{ fontSize: "clamp(18px, 5vw, 21px)", fontWeight: 800, color: 'var(--text)', letterSpacing: '-.4px', marginBottom: 4 }}>
          {t('signin.title')}
        </h2>
        <p style={{ fontSize: "clamp(12px, 3.5vw, 13px)", color: 'var(--text-3)' }}>{t('signin.subtitle')}</p>
      </div>

      <form onSubmit={handleSubmit} noValidate>
        <Field label={t('signin.email')} error={touched.email && errors.email}>
          <AuthInput type="email" placeholder={t('signin.email_placeholder')}
            value={email} onChange={e => setEmail(e.target.value)} onBlur={() => touch('email')}
            error={touched.email && errors.email} icon={<MailIcon />}
            font="font-en"
            style={{ textAlign: 'right', height: "clamp(44px, 12vw, 48px)" }}
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
          {t('signin.submit')} <IconArrow  />
        </BtnPrimary>

        <Divider label={t('signin.or')} />

        <BtnGhost onClick={handleGoogleLogin}>
          <IconGoogle /> {t('signin.google')}
        </BtnGhost>
      </form>

    </motion.div>
  );
}