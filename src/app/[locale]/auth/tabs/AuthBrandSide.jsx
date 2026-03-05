'use client';

import { useTranslations } from 'next-intl';
import { motion, AnimatePresence } from 'framer-motion';
import { useState } from 'react';

/* ══════════════════════════════════════════════════════════════
   PALETTE  — pure purple, no orange
   All values self-contained so the component is portable
══════════════════════════════════════════════════════════════ */
const P = {
  bg0:     '#1a1740',   // deepest background
  bg1:     '#231f55',   // mid
  bg2:     '#2d2870',   // lighter mid
  violet:  '#7270be',   // brand violet
  lavender:'#9d9bd8',   // soft lavender accent
  mist:    'rgba(255,255,255,0.08)',
  border:  'rgba(255,255,255,0.12)',
  text:    '#ffffff',
  textMid: 'rgba(255,255,255,0.70)',
  textLow: 'rgba(255,255,255,0.42)',
};

/* ══════════════════════════════════════════════════════════════
   SOCIAL ICONS  — inline SVGs, brand-accurate shapes
══════════════════════════════════════════════════════════════ */
const SOCIALS = [
  {
    id: 'instagram',
    label: 'Instagram',
    href: 'https://instagram.com/',
    color: '#E1306C',
    icon: (
      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <rect x="2" y="2" width="20" height="20" rx="5" ry="5"/>
        <circle cx="12" cy="12" r="4.5"/>
        <circle cx="17.5" cy="6.5" r="1" fill="currentColor" stroke="none"/>
      </svg>
    ),
  },
  {
    id: 'twitter',
    label: 'X',
    href: 'https://x.com/',
    color: '#ffffff',
    icon: (
      <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
        <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-4.714-6.231-5.401 6.231H2.745l7.73-8.835L1.254 2.25H8.08l4.258 5.63zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
      </svg>
    ),
  },
  {
    id: 'linkedin',
    label: 'LinkedIn',
    href: 'https://linkedin.com/',
    color: '#0A66C2',
    icon: (
      <svg width="15" height="15" viewBox="0 0 24 24" fill="currentColor">
        <path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z"/>
        <rect x="2" y="9" width="4" height="12"/>
        <circle cx="4" cy="4" r="2"/>
      </svg>
    ),
  },
  {
    id: 'facebook',
    label: 'Facebook',
    href: 'https://facebook.com/',
    color: '#1877F2',
    icon: (
      <svg width="15" height="15" viewBox="0 0 24 24" fill="currentColor">
        <path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z"/>
      </svg>
    ),
  },
  {
    id: 'tiktok',
    label: 'TikTok',
    href: 'https://tiktok.com/',
    color: '#ffffff',
    icon: (
      <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
        <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-2.88 2.5 2.89 2.89 0 0 1-2.89-2.89 2.89 2.89 0 0 1 2.89-2.89c.28 0 .54.04.79.1V9.01a6.33 6.33 0 0 0-.79-.05 6.34 6.34 0 0 0-6.34 6.34 6.34 6.34 0 0 0 6.34 6.34 6.34 6.34 0 0 0 6.33-6.34V8.69a8.18 8.18 0 0 0 4.78 1.52V6.76a4.85 4.85 0 0 1-1.01-.07z"/>
      </svg>
    ),
  },
  {
    id: 'whatsapp',
    label: 'WhatsApp',
    href: 'https://wa.me/',
    color: '#25D366',
    icon: (
      <svg width="15" height="15" viewBox="0 0 24 24" fill="currentColor">
        <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z"/>
        <path d="M12 0C5.373 0 0 5.373 0 12c0 2.127.558 4.123 1.532 5.855L.057 23.09a.5.5 0 0 0 .617.636l5.428-1.424A11.953 11.953 0 0 0 12 24c6.627 0 12-5.373 12-12S18.627 0 12 0zm0 21.818a9.818 9.818 0 0 1-5.003-1.37l-.359-.213-3.72.976.995-3.634-.234-.374A9.818 9.818 0 1 1 12 21.818z"/>
      </svg>
    ),
  },
];

/* ══════════════════════════════════════════════════════════════
   LOGO SVG
══════════════════════════════════════════════════════════════ */
const Logo = () => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/>
    <polyline points="3.27 6.96 12 12.01 20.73 6.96"/>
    <line x1="12" y1="22.08" x2="12" y2="12"/>
  </svg>
);

/* ══════════════════════════════════════════════════════════════
   FLOATING SHAPE
══════════════════════════════════════════════════════════════ */
const Float = ({ style, dur = 7, children }) => (
  <motion.div
    style={{ position: 'absolute', ...style }}
    animate={{ y: [0, -14, 0], rotate: [0, 5, 0] }}
    transition={{ duration: dur, repeat: Infinity, ease: 'easeInOut' }}
  >
    {children}
  </motion.div>
);

/* ══════════════════════════════════════════════════════════════
   ANIMATED COUNTER — counts up once on mount
══════════════════════════════════════════════════════════════ */
function StatNumber({ display }) {
  return <span>{display}</span>;
}

/* ══════════════════════════════════════════════════════════════
   SOCIAL BUTTON
══════════════════════════════════════════════════════════════ */
function SocialBtn({ social, index }) {
  const [hov, setHov] = useState(false);
  return (
    <motion.a
      href={social.href}
      target="_blank"
      rel="noopener noreferrer"
      aria-label={social.label}
      title={social.label}
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.72 + index * 0.06, duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
      whileHover={{ scale: 1.12, y: -3 }}
      whileTap={{ scale: 0.92 }}
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
      style={{
        position: 'relative',
        width: 40, height: 40,
        borderRadius: 12,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        overflow: 'hidden',
        cursor: 'pointer',
        textDecoration: 'none',
        flexShrink: 0,
        border: `1px solid ${hov ? social.color + '60' : P.border}`,
        background: hov
          ? `linear-gradient(135deg, ${social.color}22, ${social.color}10)`
          : P.mist,
        boxShadow: hov ? `0 4px 18px ${social.color}30` : 'none',
        transition: 'border-color .2s, background .2s, box-shadow .2s',
        color: hov ? social.color : P.textMid,
      }}
    >
      {/* Shimmer sweep on hover */}
      {hov && (
        <motion.span
          initial={{ x: '-100%' }}
          animate={{ x: '200%' }}
          transition={{ duration: 0.5, ease: 'easeOut' }}
          style={{
            position: 'absolute', inset: 0,
            background: `linear-gradient(110deg, transparent, ${social.color}20, transparent)`,
            pointerEvents: 'none',
          }}
        />
      )}
      <span style={{ position: 'relative', zIndex: 1 }}>{social.icon}</span>
    </motion.a>
  );
}

/* ══════════════════════════════════════════════════════════════
   STATS CONFIG
══════════════════════════════════════════════════════════════ */
const STATS     = ['+١٢k', '+٣M', '٩٩.٩٪'];
const STAT_KEYS = ['brand.stat_merchants', 'brand.stat_orders', 'brand.stat_uptime'];
const FEAT_EMOJIS = ['📦', '🏪', '📊', '🚚'];
const FEAT_KEYS   = ['brand.feature_1', 'brand.feature_2', 'brand.feature_3', 'brand.feature_4'];

/* ══════════════════════════════════════════════════════════════
   MAIN COMPONENT
══════════════════════════════════════════════════════════════ */
export default function AuthBrandSide({ mode, t: tProp }) {
  const tLocal = useTranslations('auth');
  const t = tProp ?? tLocal;
  const isSignin = mode === 'signin';

  return (
    <div style={{ position: 'relative', width: '100%', height: '100%', overflow: 'hidden' }}>

      {/* ── Background ── */}
      <div style={{
        position: 'absolute', inset: 0,
        background: `linear-gradient(155deg, ${P.violet} 0%, ${P.bg1} 40%, ${P.bg0} 100%)`,
      }} />

      {/* Noise texture */}
      <div style={{
        position: 'absolute', inset: 0, opacity: 0.038,
        backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='.85' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E")`,
      }} />

      {/* Dot grid */}
      <div style={{
        position: 'absolute', inset: 0, opacity: 0.065,
        backgroundImage: 'radial-gradient(circle, rgba(255,255,255,.8) 1px, transparent 1px)',
        backgroundSize: '28px 28px',
      }} />

      {/* Diagonal scan line */}
      <div style={{
        position: 'absolute', inset: 0, opacity: 0.025,
        backgroundImage: 'repeating-linear-gradient(135deg, transparent, transparent 18px, rgba(255,255,255,.6) 18px, rgba(255,255,255,.6) 19px)',
      }} />

      {/* Glow orbs */}
      <motion.div
        animate={{ scale: [1, 1.18, 1], opacity: [0.14, 0.22, 0.14] }}
        transition={{ duration: 11, repeat: Infinity, ease: 'easeInOut' }}
        style={{
          position: 'absolute', top: '-18%', right: '-12%',
          width: 480, height: 480, borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(255,255,255,.16), transparent 68%)',
          filter: 'blur(55px)',
        }}
      />
      <motion.div
        animate={{ scale: [1.1, 1, 1.1], opacity: [0.09, 0.17, 0.09] }}
        transition={{ duration: 14, repeat: Infinity, ease: 'easeInOut' }}
        style={{
          position: 'absolute', bottom: '-12%', left: '-8%',
          width: 400, height: 400, borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(155,140,240,.28), transparent 70%)',
          filter: 'blur(65px)',
        }}
      />
      {/* Extra mid orb */}
      <motion.div
        animate={{ scale: [1, 1.25, 1], opacity: [0.06, 0.12, 0.06] }}
        transition={{ duration: 9, repeat: Infinity, ease: 'easeInOut', delay: 3 }}
        style={{
          position: 'absolute', top: '45%', left: '30%',
          width: 260, height: 260, borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(200,195,255,.22), transparent 70%)',
          filter: 'blur(45px)',
        }}
      />

      {/* ── Floating shapes ── */}
      <Float style={{ top: 36, left: 32, opacity: 0.10 }} dur={8}>
        <div style={{ width: 80, height: 80, border: '2px solid #fff', borderRadius: '28%', transform: 'rotate(15deg)' }} />
      </Float>
      <Float style={{ bottom: 110, right: 28, opacity: 0.07 }} dur={11}>
        <div style={{ width: 56, height: 56, background: '#fff', borderRadius: '50%' }} />
      </Float>
      <Float style={{ top: '40%', left: 20, opacity: 0.07 }} dur={9}>
        <div style={{ width: 32, height: 32, background: '#fff', borderRadius: 8, transform: 'rotate(22deg)' }} />
      </Float>
      <Float style={{ top: '20%', right: 24, opacity: 0.055 }} dur={13}>
        <div style={{ width: 20, height: 20, border: '2px solid #fff', borderRadius: 5, transform: 'rotate(10deg)' }} />
      </Float>
      {/* Extra: small triangle-ish */}
      <Float style={{ bottom: '28%', left: '12%', opacity: 0.06 }} dur={7.5}>
        <div style={{ width: 14, height: 14, background: P.lavender, borderRadius: 3, transform: 'rotate(45deg)' }} />
      </Float>
      {/* Extra: large ring */}
      <Float style={{ top: '55%', right: 18, opacity: 0.04 }} dur={16}>
        <div style={{ width: 110, height: 110, border: '1.5px solid #fff', borderRadius: '50%' }} />
      </Float>

      {/* ── Arc decoration — top-right quadrant ── */}
      <div style={{
        position: 'absolute', top: -60, right: -60,
        width: 280, height: 280,
        border: '1px solid rgba(255,255,255,0.06)',
        borderRadius: '50%',
        pointerEvents: 'none',
      }} />
      <div style={{
        position: 'absolute', top: -100, right: -100,
        width: 380, height: 380,
        border: '1px solid rgba(255,255,255,0.04)',
        borderRadius: '50%',
        pointerEvents: 'none',
      }} />

      {/* ── CONTENT ── */}
      <div style={{
        position: 'relative', zIndex: 1,
        height: '100%',
        display: 'flex', flexDirection: 'column',
        padding: '40px 38px',
      }}>

        {/* ── Logo ── */}
        <motion.div
          initial={{ opacity: 0, y: 18 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.08, duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
          style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 'clamp(28px, 4.5vh, 48px)' }}
        >
          <div style={{
            width: 48, height: 48, borderRadius: 14,
            background: 'rgba(255,255,255,0.14)',
            backdropFilter: 'blur(10px)',
            border: '1px solid rgba(255,255,255,0.22)',
            boxShadow: '0 4px 20px rgba(0,0,0,0.22), inset 0 1px 0 rgba(255,255,255,0.18)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <Logo />
          </div>
          <div>
            <div style={{
              fontSize: 19, fontWeight: 800, color: '#fff',
              letterSpacing: '-0.4px', lineHeight: 1.1,
            }}>
              {t('brand.name')}
            </div>
            <div className='!mt-1 block' style={{
              fontSize: 9, color: P.textLow,
              letterSpacing: '2px', 
              textTransform: 'uppercase', marginTop: 3,
            }}>
              {t('brand.tagline')}
            </div>
          </div>
 
        </motion.div>

        {/* ── Headline ── */}
        <AnimatePresence mode="wait">
          <motion.div
            key={mode}
            initial={{ opacity: 0, y: 28 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -18 }}
            transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
            style={{ marginBottom: 'clamp(18px, 2.8vh, 28px)' }}
          >
            

            <h1 style={{
              fontSize: 'clamp(20px, 2.5vw, 35px)',
              fontWeight: 900, color: '#fff',
              lineHeight: 1.46, letterSpacing: '-0.9px',
              marginBottom: 12, whiteSpace: 'pre-line',
            }}>
              {isSignin ? t('brand.headline_signin') : t('brand.headline_signup')}
            </h1>
            <p style={{
              fontSize: 'clamp(12.5px, 1.05vw, 14px)',
              color: P.textMid, lineHeight: 1.82, maxWidth: 340,
            }}>
              {isSignin ? t('brand.desc_signin') : t('brand.desc_signup')}
            </p>
          </motion.div>
        </AnimatePresence>

        {/* ── Stats row ── */}
        <motion.div
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.28, duration: 0.45, ease: [0.16, 1, 0.3, 1] }}
          style={{
            display: 'flex', gap: 0,
            background: 'rgba(255,255,255,0.08)',
            backdropFilter: 'blur(12px)',
            borderRadius: 14,
            border: `1px solid ${P.border}`,
            marginBottom: 'clamp(16px, 2.4vh, 26px)',
            overflow: 'hidden',
            boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.08)',
          }}
        >
          {STATS.map((val, i) => (
            <motion.div
              key={i}
              whileHover={{ background: 'rgba(255,255,255,0.05)' }}
              style={{
                flex: 1, padding: '14px 10px', textAlign: 'center',
                borderLeft: i > 0 ? '1px solid rgba(255,255,255,0.08)' : 'none',
                cursor: 'default', transition: 'background .2s',
              }}
            >
              <div style={{
                fontSize: 'clamp(17px, 1.9vw, 22px)', fontWeight: 900, color: '#fff',
                fontFamily: 'var(--font-roboto-mono, monospace)', lineHeight: 1,
                textShadow: `0 0 20px ${P.lavender}55`,
              }}>
                {val}
              </div>
              <div style={{
                fontSize: 9.5, color: P.textLow, marginTop: 5,
                letterSpacing: '0.4px', fontWeight: 600,
              }}>
                {t(STAT_KEYS[i])}
              </div>
            </motion.div>
          ))}
        </motion.div>

        {/* ── Feature list ── */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {FEAT_KEYS.map((key, i) => (
            <motion.div
              key={key}
              initial={{ opacity: 0, x: 22 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.36 + i * 0.07, duration: 0.38, ease: 'easeOut' }}
              whileHover={{
                background: 'rgba(255,255,255,0.10)',
                x: -2,
                transition: { duration: 0.15 },
              }}
              style={{
                display: 'flex', alignItems: 'center', gap: 11,
                background: 'rgba(255,255,255,0.065)',
                borderRadius: 10, padding: '8px 13px',
                border: '1px solid rgba(255,255,255,0.08)',
                cursor: 'default',
              }}
            >
              {/* Left accent line */}
              <div style={{
                width: 2.5, height: 22, borderRadius: 2, flexShrink: 0,
                background: `linear-gradient(180deg, ${P.lavender}, ${P.violet})`,
                opacity: 0.7,
              }} />
              <span style={{ fontSize: 16, flexShrink: 0 }}>{FEAT_EMOJIS[i]}</span>
              <span style={{
                fontSize: 'clamp(11.5px, 0.92vw, 13px)',
                color: P.textMid, fontWeight: 500, lineHeight: 1.4,
              }}>
                {t(key)}
              </span>
            </motion.div>
          ))}
        </div>

        {/* ── Social media ── */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.65, duration: 0.4 }}
          style={{ marginTop: 'auto', paddingTop: 22 }}
        >
          {/* Divider with label */}
          <div  style={{ display: 'flex' , justifyContent : "center" , alignItems: 'center', gap: 10, marginBottom: 14 }}>
            <div style={{ flex: 1, height: 1, background: P.border }} />
            <span style={{
              fontSize: 9.5, fontWeight: 700, color: P.textLow,
              letterSpacing: '0.14em', textTransform: 'uppercase',
              whiteSpace: 'nowrap',
            }}>
              {t('brand.follow_us') ?? 'Follow Us'}
            </span>
            <div style={{ flex: 1, height: 1, background: P.border }} />
          </div> 

          {/* Social buttons row */}
          <div className='w-full justify-center' style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
            {SOCIALS.map((s, i) => (
              <SocialBtn key={s.id} social={s} index={i} />
            ))}
 
          </div>
 
        </motion.div>

      </div>
    </div>
  );
}