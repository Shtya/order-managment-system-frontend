'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Toaster } from 'react-hot-toast';
import { useTranslations } from 'next-intl';

import AuthBrandSide from './tabs/AuthBrandSide';
import SignIn from './tabs/Signin';
import SignUp from './tabs/Signup';
import ForgotPassword from './tabs/Forgotpassword';

/* ─────────────────────────────────────────────────────────────
	 Global CSS
	 ───────────────────────────────────────────────────────────── */
const GLOBAL_CSS = `
  @import url('https://fonts.googleapis.com/css2?family=Cairo:wght@300;400;500;600;700;800;900&family=JetBrains+Mono:wght@400;500;600&display=swap');

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
    --radius-xl: 28px;
    --font:      'Cairo', sans-serif;
    --mono:      'JetBrains Mono', monospace;
  }

  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
  html { direction: rtl; }
  body {
    font-family: var(--font);
    background: var(--bg);
    color: var(--text);
    overflow: hidden;
    height: 100vh;
    -webkit-font-smoothing: antialiased;
  }

  /* inputs */
  .auth-input {
    width: 100%; height: 48px;
    padding: 0 44px 0 14px;
    background: var(--surface2);
    border: 1.5px solid var(--border);
    border-radius: var(--radius-sm);
    font-family: var(--font); font-size: 14px; color: var(--text);
    direction: ltr; text-align: right;
    outline: none;
    transition: border-color .18s, box-shadow .18s, background .18s;
  }
  .auth-input:focus {
    border-color: var(--p);
    background: var(--surface);
    box-shadow: 0 0 0 3px var(--p-glow);
  }
  .auth-input.error { border-color: #ef4444; background: #fff5f5; }

  .auth-select {
    width: 100%; height: 48px;
    padding: 0 44px 0 32px;
    background: var(--surface2);
    border: 1.5px solid var(--border);
    border-radius: var(--radius-sm);
    font-family: var(--font); font-size: 14px; color: var(--text);
    outline: none; appearance: none; cursor: pointer;
    transition: border-color .18s, box-shadow .18s;
  }
  .auth-select:focus {
    border-color: var(--p);
    background: var(--surface);
    box-shadow: 0 0 0 3px var(--p-glow);
  }

  .otp-cell {
    width: 50px; height: 56px;
    text-align: center; font-size: 22px; font-weight: 700;
    font-family: var(--mono);
    border-radius: var(--radius-sm);
    border: 2px solid var(--border);
    background: var(--surface2); color: var(--text);
    outline: none;
    transition: border-color .18s, box-shadow .18s;
  }
  .otp-cell:focus  { border-color: var(--p); box-shadow: 0 0 0 3px var(--p-glow); background: var(--surface); }
  .otp-cell.filled { border-color: var(--p); color: var(--p); }
  .otp-cell.error-cell { border-color: #ef4444; color: #ef4444; }

  @keyframes spin { to { transform: rotate(360deg); } }
  .spinner {
    width: 18px; height: 18px;
    border: 2.5px solid rgba(255,255,255,.3);
    border-top-color: #fff;
    border-radius: 50%;
    animation: spin .65s linear infinite;
    flex-shrink: 0;
  }

  .form-scroll::-webkit-scrollbar { width: 4px; }
  .form-scroll::-webkit-scrollbar-track { background: transparent; }
  .form-scroll::-webkit-scrollbar-thumb { background: var(--border); border-radius: 99px; }

  @media (max-width: 820px) {
    .brand-col  { display: none !important; }
    .form-col   { width: 100vw !important; justify-content: center !important; padding: 32px 20px !important; }
    .card-shift { margin-right: 0 !important; }
  }
`;

/* ─────────────────────────────────────────────────────────────
	 Mode toggle
	 ───────────────────────────────────────────────────────────── */
function ModeToggle({ mode, onChange, t }) {
	const signinRef = useRef(null);
	const signupRef = useRef(null);
	const [pill, setPill] = useState({ left: 5, width: 100 });

	useEffect(() => {
		const el = mode === 'signin' ? signinRef.current : signupRef.current;
		if (el) setPill({ left: el.offsetLeft, width: el.offsetWidth });
	}, [mode]);

	return (
		<div  style={{
			position: 'relative', display: 'flex',
			background: 'rgba(103,99,175,.07)',
			borderBottom: '1px solid var(--border)',
			padding: 5, gap: 4,
		}}>
			<motion.div
				style={{
					position: 'absolute', top: 5, bottom: 5,
					borderRadius: 12,
					background: 'var(--p)',
					boxShadow: '0 4px 16px rgba(103,99,175,.4)',
					zIndex: 0,
				}}
				animate={{ left: pill.left, width: pill.width }}
				transition={{ type: 'spring', stiffness: 440, damping: 34 }}
			/>
			{[
				{ id: 'signin', ref: signinRef, label: t('mode.signin') },
				{ id: 'signup', ref: signupRef, label: t('mode.signup') },
			].map(btn => (
				<button key={btn.id} ref={btn.ref} onClick={() => onChange(btn.id)}
					style={{
						flex: 1, padding: '10px 14px',
						border: 'none', background: 'transparent', borderRadius: 9,
						fontFamily: 'var(--font)', fontSize: 13.5, fontWeight: 700, cursor: 'pointer',
						color: mode === btn.id ? '#fff' : 'var(--text-3)',
						position: 'relative', zIndex: 1, transition: 'color .2s',
					}}
				>
					{btn.label}
				</button>
			))}
		</div>
	);
}

/* ─────────────────────────────────────────────────────────────
	 Page
	 ───────────────────────────────────────────────────────────── */
export default function AuthPage() {
	const t = useTranslations('auth');

	const getInitialMode = () => {
		if (typeof window === 'undefined') return 'signin';
		return new URLSearchParams(window.location.search).get('mode') === 'signup' ? 'signup' : 'signin';
	};

	const [mode, setMode] = useState(getInitialMode);
	const [showForgot, setShowForgot] = useState(false);

	const handleModeChange = useCallback((m) => {
		setMode(m);
		setShowForgot(false);
		if (typeof window !== 'undefined') {
			const url = new URL(window.location.href);
			url.searchParams.set('mode', m);
			window.history.pushState({}, '', url.toString());
		}
	}, []);

	useEffect(() => {
		const handler = () => {
			const m = new URLSearchParams(window.location.search).get('mode');
			setMode(m === 'signup' ? 'signup' : 'signin');
		};
		window.addEventListener('popstate', handler);
		return () => window.removeEventListener('popstate', handler);
	}, []);

	return (
		<>
			<style dangerouslySetInnerHTML={{ __html: GLOBAL_CSS }} />


			<div style={{ display: 'flex', width: '100vw', height: '100vh', overflow: 'hidden'  }}>

				<div className="brand-col" style={{ width: '50vw', height: '100vh', flexShrink: 0, position: 'relative', zIndex: 1 }}>
					<AuthBrandSide mode={showForgot ? 'signin' : mode} t={t} />
				</div>

 				<div
					className=" "
					style={{
						width: '50vw', height: '100vh',
						overflowY: 'auto',
						display: 'flex', alignItems: 'center',
						justifyContent: 'center',
						padding: '32px 0 32px 40px',
						position: 'relative', zIndex: 2,
						background: 'var(--bg)',
					}}
				>
					
					<div style={{
						position: 'fixed', top: 0, bottom: 0, left: 0, width: '50vw',
						backgroundImage: 'radial-gradient(circle, rgba(103,99,175,.08) 1px, transparent 1px)',
						backgroundSize: '26px 26px', pointerEvents: 'none', zIndex: 0,
					}} />

					{/* ambient blob */}
					<motion.div
						style={{
							position: 'fixed', bottom: '-8%', left: '6%',
							width: 340, height: 340, borderRadius: '50%',
							background: 'radial-gradient(circle, rgba(103,99,175,.10), transparent 70%)',
							filter: 'blur(56px)', pointerEvents: 'none', zIndex: 0,
						}}
						animate={{ scale: [1, 1.12, 1], y: [0, -16, 0] }}
						transition={{ duration: 14, repeat: Infinity, ease: 'easeInOut' }}
					/>
 
					<motion.div
						className="card-shift"
						style={{
 							marginLeft: -56,
							width: '100%', maxWidth: 562,
							position: 'relative', zIndex: 10,
							flexShrink: 0,
						}}
						initial={{ opacity: 0, x: 50, scale: .96 }}
						animate={{ opacity: 1, x: 0, scale: 1 }}
						transition={{ duration: .7, ease: [.16, 1, .3, 1] }}
					>
						{/* ── Deep shadow that bleeds visually onto brand ── */}
						<motion.div
							style={{
								position: 'absolute', inset: -12, borderRadius: 28,
								pointerEvents: 'none', zIndex: -1,
							}}
							animate={{
								boxShadow: [
									'0 32px 80px rgba(30,20,80,.20), 0 8px 24px rgba(103,99,175,.14)',
									'0 40px 100px rgba(30,20,80,.26), 0 12px 32px rgba(103,99,175,.20)',
									'0 32px 80px rgba(30,20,80,.20), 0 8px 24px rgba(103,99,175,.14)',
								]
							}}
							transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
						/>

						{/* ── Card ── */}
						<div style={{
							background: 'rgba(255,255,255,.98)',
							backdropFilter: 'blur(24px)',
							borderRadius: 19,
							border: '1px solid rgba(255,255,255,.9)',
							overflow: 'hidden',
							position: 'relative',
						}}>
						 
 
							<AnimatePresence>
								{showForgot && (
									<motion.div key="fbar"
										initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }}
										transition={{ duration: .2 }} style={{ overflow: 'hidden' }}
									>
										<button type="button" onClick={() => setShowForgot(false)}
											style={{
												display: 'flex', alignItems: 'center', gap: 8,
												background: 'var(--p-xlight)', borderBottom: '1px solid rgba(103,99,175,.12)',
												border: 'none', width: '100%', padding: '13px 22px',
												fontFamily: 'var(--font)', fontSize: 13, fontWeight: 700,
												color: 'var(--p)', cursor: 'pointer', transition: 'opacity .15s',
											}}
											onMouseOver={e => e.currentTarget.style.opacity = '.7'}
											onMouseOut={e => e.currentTarget.style.opacity = '1'}
										>
											{t('forgot.back')}
											<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
												<path d="M19 12H5" /><path d="m12 19-7-7 7-7" />
											</svg>
										</button>
									</motion.div>
								)}
							</AnimatePresence>

							{/* mode toggle */}
							{!showForgot && (
								<ModeToggle mode={mode} onChange={handleModeChange} t={t} />
							)}

							{/* form body */}
							<div style={{ padding: '28px 32px 32px' }}>
								<AnimatePresence mode="wait">
									{showForgot ? (
										<ForgotPassword key="forgot" t={t} onBack={() => setShowForgot(false)} />
									) : mode === 'signin' ? (
										<SignIn key="signin" t={t} onSwitchMode={() => handleModeChange('signup')} onForgotPassword={() => setShowForgot(true)} />
									) : (
										<SignUp key="signup" t={t} onSwitchMode={() => handleModeChange('signin')} />
									)}
								</AnimatePresence>
							</div>
						</div> 
					</motion.div>
				</div>
			</div>
		</>
	);
}