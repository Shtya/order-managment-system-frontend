'use client';

import { useEffect, useRef, useState } from 'react';
import { useTranslations } from 'next-intl';

/* ─── Social icons (inline SVG) ─── */
const socials = [
  {
    id: 'facebook',
    href: '#',
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
        <path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z" />
      </svg>
    ),
  },
  {
    id: 'twitter',
    href: '#',
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
        <path d="M22 4s-.7 2.1-2 3.4c1.6 10-9.4 17.3-18 11.6 2.2.1 4.4-.6 6-2C3 15.5.5 9.6 3 5c2.2 2.6 5.6 4.1 9 4-.9-4.2 4-6.6 7-3.8 1.1 0 3-1.2 3-1.2z" />
      </svg>
    ),
  },
  {
    id: 'instagram',
    href: '#',
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <rect x="2" y="2" width="20" height="20" rx="5" ry="5" />
        <circle cx="12" cy="12" r="4" />
        <circle cx="17.5" cy="6.5" r="1" fill="currentColor" stroke="none" />
      </svg>
    ),
  },
  {
    id: 'github',
    href: '#',
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
        <path d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0 1 12 6.844a9.59 9.59 0 0 1 2.504.337c1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.02 10.02 0 0 0 22 12.017C22 6.484 17.522 2 12 2z" />
      </svg>
    ),
  },
  {
    id: 'linkedin',
    href: '#',
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
        <path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6zM2 9h4v12H2z" />
        <circle cx="4" cy="4" r="2" />
      </svg>
    ),
  },
];

/* ─── Logo ─── */
function Logo({ t }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8, direction: 'rtl' }}>
      {/* Box icon */}
      <div style={{
        width: 34, height: 34, borderRadius: 8,
        background: 'linear-gradient(135deg, #6763AF, #6763AF)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        boxShadow: '0 2px 12px #6763AF',
        fontSize: 16,
      }}>
        📦
      </div>
      <span style={{
        fontWeight: 800, fontSize: 18,
        color: '#1e1b4b',
        letterSpacing: '-0.3px',
      }}>
        {t('logo')}
      </span>
    </div>
  );
}

/* ─── Nav link ─── */
function NavLink({ label, index }) {
  const [hovered, setHovered] = useState(false);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => setVisible(true), 100 + index * 80);
    return () => clearTimeout(t);
  }, [index]);

  return (
    <a
      href="#"
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        fontSize: 14,
        fontWeight: 500,
        color: hovered ? '#6763AF' : '#6b7280',
        textDecoration: 'none',
        transition: 'color 0.2s, transform 0.2s',
        transform: hovered ? 'translateY(-2px)' : 'translateY(0)',
        display: 'inline-block',
        opacity: visible ? 1 : 0,
        animation: visible ? 'navIn 0.5s cubic-bezier(.34,1.4,.64,1) forwards' : 'none',
        animationDelay: `${index * 80}ms`,
      }}
    >
      {label}
    </a>
  );
}

/* ─── Social button ─── */
function SocialBtn({ icon, href, index }) {
  const [hovered, setHovered] = useState(false);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => setVisible(true), 300 + index * 70);
    return () => clearTimeout(t);
  }, [index]);

  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        width: 36, height: 36, borderRadius: 10,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        border: `1.5px solid ${hovered ? '#6763AF' : '#ddd6fe'}`,
        background: hovered ? 'linear-gradient(135deg,#6763AF,#6763AF)' : 'rgba(237,233,254,0.5)',
        color: hovered ? '#fff' : '#6763AF',
        transition: 'all 0.25s cubic-bezier(.34,1.4,.64,1)',
        transform: hovered ? 'translateY(-4px) scale(1.08)' : 'translateY(0) scale(1)',
        boxShadow: hovered ? '0 6px 18px #6763AF' : 'none',
        opacity: visible ? 1 : 0,
        animation: visible ? 'socialIn 0.5s cubic-bezier(.34,1.4,.64,1) forwards' : 'none',
        animationDelay: `${index * 70}ms`,
        textDecoration: 'none',
      }}
    >
      {icon}
    </a>
  );
}

/* ─── Main Footer ─── */
export default function FooterSection() {
  const t = useTranslations('footer');
  const [visible, setVisible] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    const obs = new IntersectionObserver(
      ([e]) => { if (e.isIntersecting) setVisible(true); },
      { threshold: 0.2 }
    );
    if (ref.current) obs.observe(ref.current);
    return () => obs.disconnect();
  }, []);

  const navLinks = ['home', 'services', 'pricing', 'about', 'contact'];

  return (
    <>
      <style>{`
        @keyframes navIn {
          from { opacity: 0; transform: translateY(10px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        @keyframes socialIn {
          from { opacity: 0; transform: translateY(14px) scale(0.8); }
          to   { opacity: 1; transform: translateY(0) scale(1); }
        }
        @keyframes footerFadeIn {
          from { opacity: 0; transform: translateY(16px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        @keyframes lineGrow {
          from { transform: scaleX(0); }
          to   { transform: scaleX(1); }
        }
        @keyframes logoPop {
          from { opacity: 0; transform: scale(0.8) translateX(20px); }
          to   { opacity: 1; transform: scale(1) translateX(0); }
        }
      `}</style>

      <footer
        ref={ref}
        dir="rtl"
        style={{
          background: 'linear-gradient(180deg, #f5f3ff 0%, #faf9ff 60%, #ffffff 100%)',
          borderTop: '1px solid #ede9fe',
          padding: '0',
          overflow: 'hidden',
          position: 'relative',
        }}
      >
        {/* Subtle gradient blob */}
        <div style={{
          position: 'absolute', bottom: 0, right: '20%',
          width: '400px', height: '200px', borderRadius: '50%',
          background: 'radial-gradient(ellipse, rgba(139,92,246,0.06) 0%, transparent 70%)',
          pointerEvents: 'none',
        }} />

        {/* ── Top row: logo + nav ── */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '28px 48px',
          flexWrap: 'wrap',
          gap: 20,
          opacity: visible ? 1 : 0,
          animation: visible ? 'footerFadeIn 0.6s ease forwards' : 'none',
        }}>
          {/* Logo */}
          <div style={{
            opacity: visible ? 1 : 0,
            animation: visible ? 'logoPop 0.6s cubic-bezier(.34,1.4,.64,1) 0.1s both' : 'none',
          }}>
            <Logo t={t} />
          </div>

          {/* Nav links */}
          <nav style={{ display: 'flex', gap: 32, alignItems: 'center', flexWrap: 'wrap', direction: 'rtl' }}>
            {navLinks.map((key, i) => (
              <NavLink key={key} label={t(`nav.${key}`)} index={i} />
            ))}
          </nav>
        </div>

        {/* ── Divider ── */}
        <div style={{
          height: 1,
          margin: '0 48px',
          background: '#ede9fe',
          transformOrigin: 'right',
          animation: visible ? 'lineGrow 0.8s cubic-bezier(.4,0,.2,1) 0.3s both' : 'none',
        }} />

        {/* ── Bottom row: socials + copyright ── */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '20px 48px 28px',
          flexWrap: 'wrap',
          gap: 16,
        }}>
          {/* Social icons */}
          <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
            {socials.map((s, i) => (
              <SocialBtn key={s.id} icon={s.icon} href={s.href} index={i} />
            ))}
          </div>

          {/* Copyright */}
          <p style={{
            fontSize: 13,
            color: '#9ca3af',
            direction: 'rtl',
            margin: 0,
            opacity: visible ? 1 : 0,
            animation: visible ? 'footerFadeIn 0.6s ease 0.5s both' : 'none',
          }}>
            {t('copyright')}
          </p>
        </div>
      </footer>
    </>
  );
}