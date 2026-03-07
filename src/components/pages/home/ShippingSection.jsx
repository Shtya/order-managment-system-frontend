'use client';

import { useTranslations } from 'next-intl';
import { useEffect, useRef, useState } from 'react';

const VB_W = 1000;
const VB_H = 480;
const CX = 500;
const CY = 248;

const COMPANIES = [
  {
    id: 'smsa', name: 'SMSA', logo: '/landing/companies/smsa.png',
    bg: '#1e2a6e', beamColor: '#818cf8', beamDelay: 0.0,
    path: [[CX, CY], [350, CY], [220, 145], [168, 145]], joints: [1, 2],
  },
  {
    id: 'aramex', name: 'Aramex', logo: '/landing/companies/aramex.png',
    bg: '#7f1d1d', beamColor: '#f87171', beamDelay: 0.4,
    path: [[CX, CY], [118, CY]], joints: [],
  },
  {
    id: 'fedex', name: 'FedEx', logo: '/landing/companies/fedex.png',
    bg: '#312e81', beamColor: '#a78bfa', beamDelay: 0.8,
    path: [[CX, CY], [310, CY], [155, 350], [90, 350]], joints: [1, 2],
  },
  {
    id: 'imile', name: 'iMile', logo: '/landing/companies/imile.png',
    bg: '#1e3a8a', beamColor: '#60a5fa', beamDelay: 1.2,
    path: [[CX, CY], [360, CY], [232, 410], [168, 410]], joints: [1, 2],
  },
  {
    id: 'spl', name: 'SPL', logo: '/landing/companies/spl.png',
    bg: '#164e63', beamColor: '#22d3ee', beamDelay: 0.2,
    path: [[CX, CY], [640, CY], [745, 148], [808, 148]], joints: [1, 2],
  },
  {
    id: 'jt', name: 'J&T', logo: '/landing/companies/jt.png',
    bg: '#7f1d1d', beamColor: '#fca5a5', beamDelay: 0.6,
    path: [[CX, CY], [700, CY], [848, 110], [912, 110]], joints: [1, 2],
  },
  {
    id: 'makane', name: 'MakanE', logo: '/landing/companies/makane.png',
    bg: '#1e293b', beamColor: '#94a3b8', beamDelay: 1.0,
    path: [[CX, CY], [790, CY], [870, 200], [932, 200]], joints: [1, 2],
  },
  {
    id: 'thabit', name: 'Thabit', logo: '/landing/companies/thabit.png',
    bg: '#78350f', beamColor: '#fcd34d', beamDelay: 1.4,
    path: [[CX, CY], [760, CY], [878, 322], [940, 322]], joints: [1, 2],
  },
  {
    id: 'naqel', name: 'NAQEL', logo: '/landing/companies/naqel.png',
    bg: '#14532d', beamColor: '#4ade80', beamDelay: 1.8,
    path: [[CX, CY], [660, CY], [848, 410], [912, 410]], joints: [1, 2],
  },
];

function pathLen(pts) {
  let l = 0;
  for (let i = 1; i < pts.length; i++) {
    const dx = pts[i][0] - pts[i - 1][0], dy = pts[i][1] - pts[i - 1][1];
    l += Math.sqrt(dx * dx + dy * dy);
  }
  return l;
}
const toPts = pts => pts.map(p => p.join(',')).join(' ');

/*
  ── FLOW BEAM ──
  Instead of a bullet, we animate a short glowing dash
  (strokeDasharray with a lit segment + long gap) travelling
  along the polyline using stroke-dashoffset.
  The lit segment IS the line itself lighting up — pure line FX.
*/
function FlowBeam({ id, pts, color, delay, totalLen }) {
  // lit segment length = ~22% of path, gap = rest
  const segLen = Math.round(totalLen * 0.22);
  const gapLen = totalLen - segLen;
  // travel: offset goes from totalLen → 0 (segment enters from start)
  const dur = `${2.6 + (delay % 0.9)}s`;

  return (
    <g filter={`url(#bf-${id})`}>
      {/* wide outer glow segment */}
      <polyline
        points={toPts(pts)}
        fill="none"
        stroke={color}
        strokeWidth="7"
        strokeOpacity="0"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeDasharray={`${segLen} ${gapLen}`}
      >
        <animate
          attributeName="stroke-dashoffset"
          values={`${totalLen};${-segLen}`}
          dur={dur}
          begin={`${delay}s`}
          repeatCount="indefinite"
          calcMode="linear"
        />
        <animate
          attributeName="stroke-opacity"
          values="0;0.18;0.18;0"
          keyTimes="0;0.06;0.92;1"
          dur={dur}
          begin={`${delay}s`}
          repeatCount="indefinite"
        />
      </polyline>

      {/* mid glow segment */}
      <polyline
        points={toPts(pts)}
        fill="none"
        stroke={color}
        strokeWidth="3"
        strokeOpacity="0"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeDasharray={`${segLen} ${gapLen}`}
      >
        <animate
          attributeName="stroke-dashoffset"
          values={`${totalLen};${-segLen}`}
          dur={dur}
          begin={`${delay}s`}
          repeatCount="indefinite"
          calcMode="linear"
        />
        <animate
          attributeName="stroke-opacity"
          values="0;0.7;0.7;0"
          keyTimes="0;0.06;0.92;1"
          dur={dur}
          begin={`${delay}s`}
          repeatCount="indefinite"
        />
      </polyline>

      {/* bright core segment */}
      <polyline
        points={toPts(pts)}
        fill="none"
        stroke="white"
        strokeWidth="1.2"
        strokeOpacity="0"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeDasharray={`${Math.round(segLen * 0.35)} ${gapLen + Math.round(segLen * 0.65)}`}
      >
        <animate
          attributeName="stroke-dashoffset"
          values={`${totalLen};${-segLen}`}
          dur={dur}
          begin={`${delay}s`}
          repeatCount="indefinite"
          calcMode="linear"
        />
        <animate
          attributeName="stroke-opacity"
          values="0;0.85;0.85;0"
          keyTimes="0;0.07;0.9;1"
          dur={dur}
          begin={`${delay}s`}
          repeatCount="indefinite"
        />
      </polyline>
    </g>
  );
}

/* ─── Node — logo fills the full circle ─── */
function Node({ c, visible, idx }) {
  const [ex, ey] = c.path[c.path.length - 1];
  const R = 33;
  const pDur = `${3.8 + idx * 0.22}s`;

  return (
    <g style={{
      opacity: 0,
      animation: visible ? 'nIn 0.65s cubic-bezier(0.34,1.56,0.64,1) forwards' : 'none',
      animationDelay: `${0.55 + idx * 0.1}s`,
      transformOrigin: `${ex}px ${ey}px`,
    }}>
      {/* sonar ripple */}
      <circle cx={ex} cy={ey} r={R} fill="none" stroke={c.beamColor} strokeWidth="1.2">
        <animate attributeName="r"
          values={`${R};${R + 26};${R + 26}`}
          dur={pDur} repeatCount="indefinite"
          calcMode="spline" keySplines="0.3 0 0.8 1;0 0 1 1" />
        <animate attributeName="stroke-opacity"
          values="0.55;0;0"
          dur={pDur} repeatCount="indefinite"
          calcMode="spline" keySplines="0.3 0 0.8 1;0 0 1 1" />
      </circle>

      {/* subtle colour bloom behind */}
      <circle cx={ex} cy={ey} r={R + 5} fill={c.beamColor} fillOpacity="0.1" />

      {/* drop shadow */}
      <circle cx={ex} cy={ey + 3} r={R + 1} fill="rgba(0,0,0,0.5)" />

      {/* ── logo fills full circle ── */}
      <defs>
        <clipPath id={`cp-${c.id}`}>
          <circle cx={ex} cy={ey} r={R} />
        </clipPath>
      </defs>

      {/* bg fill (shows if logo has transparency) */}
      <circle cx={ex} cy={ey} r={R} fill={c.bg} />

      {/* logo — covers the entire circle */}
      <image
        href={c.logo}
        x={ex - R} y={ey - R}
        width={R * 2} height={R * 2}
        preserveAspectRatio="xMidYMid slice"
        clipPath={`url(#cp-${c.id})`}
      />

      {/* subtle top gloss */}
      <ellipse
        cx={ex} cy={ey - R * 0.28}
        rx={R * 0.7} ry={R * 0.3}
        fill="rgba(255,255,255,0.08)"
      />

      {/* border — double ring glow trick */}
      <circle cx={ex} cy={ey} r={R} fill="none" stroke={c.beamColor} strokeWidth="4" strokeOpacity="0.12" />
      <circle cx={ex} cy={ey} r={R} fill="none" stroke={c.beamColor} strokeWidth="1.2" strokeOpacity="0.65" />
    </g>
  );
}

/* ─── Root ─── */
export default function ShippingSection() {
  const t = useTranslations('shippingNetwork');
  const [vis, setVis] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    const io = new IntersectionObserver(
      ([e]) => { if (e.isIntersecting) setVis(true); },
      { threshold: 0.1 }
    );
    if (ref.current) io.observe(ref.current);
    return () => io.disconnect();
  }, []);

  return (<>
    <style>{`
      @keyframes nIn {
        from { opacity:0; transform:scale(0.15); }
        to   { opacity:1; transform:scale(1); }
      }
      @keyframes fUp {
        from { opacity:0; transform:translateY(22px); }
        to   { opacity:1; transform:translateY(0); }
      }
      @keyframes traceIn {
        from { stroke-dashoffset: var(--l); opacity:0.4; }
        5%   { opacity:1; }
        to   { stroke-dashoffset: 0; opacity:1; }
      }
      @keyframes dotIn {
        from { opacity:0; transform:scale(0); }
        65%  { transform:scale(1.35); }
        to   { opacity:1; transform:scale(1); }
      }
      @keyframes spin {
        to { transform:rotate(360deg); }
      }
      @keyframes breathe {
        0%,100% { opacity:0.65; transform:scale(1); }
        50%     { opacity:1;    transform:scale(1.08); }
      }
      @keyframes hubPulse {
        0%,100% { filter:drop-shadow(0 0 18px rgba(139,92,246,0.8)) drop-shadow(0 0 50px rgba(139,92,246,0.3)); }
        50%     { filter:drop-shadow(0 0 32px rgba(139,92,246,1))   drop-shadow(0 0 90px rgba(139,92,246,0.45)); }
      }
    `}</style>

    <section ref={ref} dir="rtl" style={{
      background: 'radial-gradient(ellipse 140% 100% at 50% 55%, #100630 0%, #06021a 50%, #020008 100%)',
      padding: '62px 24px 58px',
      position: 'relative',
      overflow: 'hidden',
      minHeight: 590,
    }}>

      {/* dot grid */}
      <div style={{
        position: 'absolute', inset: 0, pointerEvents: 'none',
        backgroundImage: 'radial-gradient(rgba(140,120,255,0.11) 1px, transparent 1px)',
        backgroundSize: '28px 28px',
      }} />

      {/* centre glow */}
      <div style={{
        position: 'absolute', top: '50%', left: '50%',
        width: 640, height: 300, borderRadius: '50%',
        transform: 'translate(-50%,-50%)',
        background: 'radial-gradient(ellipse, rgba(100,35,210,0.35) 0%, transparent 68%)',
        filter: 'blur(80px)', pointerEvents: 'none',
        animation: vis ? 'breathe 5s ease-in-out infinite' : 'none',
      }} />
      <div style={{
        position: 'absolute', top: '10%', right: '4%',
        width: 270, height: 270, borderRadius: '50%',
        background: 'radial-gradient(circle, rgba(34,211,238,0.16) 0%, transparent 70%)',
        filter: 'blur(58px)', pointerEvents: 'none',
        animation: vis ? 'breathe 7s ease-in-out 1.8s infinite' : 'none',
      }} />
      <div style={{
        position: 'absolute', bottom: '6%', left: '3%',
        width: 250, height: 250, borderRadius: '50%',
        background: 'radial-gradient(circle, rgba(248,113,113,0.13) 0%, transparent 70%)',
        filter: 'blur(52px)', pointerEvents: 'none',
        animation: vis ? 'breathe 9s ease-in-out 3.5s infinite' : 'none',
      }} />

      {/* heading */}
      <div style={{
        textAlign: 'center', marginBottom: 6, position: 'relative', zIndex: 10,
        opacity: 0,
        animation: vis ? 'fUp 0.85s cubic-bezier(0.16,1,0.3,1) 0.05s forwards' : 'none',
      }}>
        <h2 style={{
          fontSize: 'clamp(20px,3vw,36px)', fontWeight: 900, color: '#fff',
          direction: 'rtl', marginBottom: 12,
          fontFamily: "'Cairo','Tajawal',sans-serif", letterSpacing: '-0.01em',
        }}>
          {t('heading.prefix')}{' '}
          <span style={{
            color: '#bef264',
            textShadow: '0 0 26px rgba(190,242,100,0.7), 0 0 80px rgba(190,242,100,0.22)',
          }}>
            {t('heading.highlight')}
          </span>{' '}
          {t('heading.suffix')}
        </h2>
        <p style={{
          color: 'rgba(148,163,184,0.8)', fontSize: 14, direction: 'rtl',
          maxWidth: 400, margin: '0 auto', lineHeight: 1.9,
          fontFamily: "'Cairo','Tajawal',sans-serif",
        }}>
          {t('subheading')}
        </p>
      </div>

      {/* SVG */}
      <div style={{ position: 'relative', width: '100%', maxWidth: 980, margin: '0 auto' }}>
        <svg viewBox={`0 0 ${VB_W} ${VB_H}`} style={{ width: '100%', height: 'auto', overflow: 'visible' }}>
          <defs>

            {/* per-company beam glow (for flow beams) */}
            {COMPANIES.map(c => (
              <filter key={c.id} id={`bf-${c.id}`} x="-50%" y="-50%" width="200%" height="200%">
                <feGaussianBlur stdDeviation="3.5" result="b" />
                <feMerge><feMergeNode in="b" /><feMergeNode in="SourceGraphic" /></feMerge>
              </filter>
            ))}

            {/* trace glow */}
            <filter id="tglow" x="-40%" y="-40%" width="180%" height="180%">
              <feGaussianBlur stdDeviation="1.6" result="b" />
              <feMerge><feMergeNode in="b" /><feMergeNode in="SourceGraphic" /></feMerge>
            </filter>

            {/* center hub glow */}
            <filter id="chub" x="-90%" y="-90%" width="280%" height="280%">
              <feGaussianBlur stdDeviation="16" result="b" />
              <feMerge><feMergeNode in="b" /><feMergeNode in="SourceGraphic" /></feMerge>
            </filter>

            {/* trace gradient: fades at both ends, bright purple centre */}
            <linearGradient id="lg" x1="0" y1="0" x2="1" y2="0">
              <stop offset="0%" stopColor="#1e1060" stopOpacity="0.3" />
              <stop offset="30%" stopColor="#6d5fce" stopOpacity="0.9" />
              <stop offset="70%" stopColor="#6d5fce" stopOpacity="0.9" />
              <stop offset="100%" stopColor="#1e1060" stopOpacity="0.3" />
            </linearGradient>

            {/* hub fill */}
            <radialGradient id="hubFill" cx="36%" cy="28%" r="68%">
              <stop offset="0%" stopColor="#c4a0ff" />
              <stop offset="42%" stopColor="#7c3aed" />
              <stop offset="100%" stopColor="#280870" />
            </radialGradient>
            <linearGradient id="hubGloss" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="rgba(255,255,255,0.25)" />
              <stop offset="100%" stopColor="rgba(255,255,255,0)" />
            </linearGradient>
          </defs>

          {/* ══ 1. BASE TRACKS — always visible, very dim ══ */}
          <g stroke="rgba(70,55,130,0.28)" strokeWidth="1.4"
            fill="none" strokeLinecap="round" strokeLinejoin="round">
            {COMPANIES.map(c => (
              <polyline key={c.id + '-base'} points={toPts(c.path)} />
            ))}
          </g>

          {/* ══ 2. DRAW-IN TRACES — animated stroke-dashoffset reveal ══ */}
          <g filter="url(#tglow)" stroke="url(#lg)" strokeWidth="2.2"
            fill="none" strokeLinecap="round" strokeLinejoin="round">
            {COMPANIES.map((c, i) => {
              const L = Math.ceil(pathLen(c.path)) + 10;
              return (
                <polyline key={c.id + '-trace'} points={toPts(c.path)}
                  strokeDasharray={L}
                  style={{
                    '--l': L,
                    opacity: 0,
                    animation: vis
                      ? `traceIn 0.9s cubic-bezier(0.16,1,0.3,1) ${0.08 + i * 0.1}s forwards`
                      : 'none',
                  }}
                />
              );
            })}
          </g>

          {/* ══ 3. COLOR TINT layer — per-company faint glow on traces ══ */}
          {vis && COMPANIES.map((c, i) => {
            const L = Math.ceil(pathLen(c.path)) + 10;
            return (
              <polyline key={c.id + '-ct'} points={toPts(c.path)}
                fill="none"
                stroke={c.beamColor}
                strokeWidth="1.2"
                strokeOpacity="0.25"
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeDasharray={L}
                style={{
                  '--l': L,
                  opacity: 0,
                  filter: `drop-shadow(0 0 4px ${c.beamColor})`,
                  animation: `traceIn 1.1s cubic-bezier(0.16,1,0.3,1) ${0.18 + i * 0.1}s forwards`,
                }}
              />
            );
          })}

          {/* ══ 4. ELBOW DOTS ══ */}
          {COMPANIES.map((c, i) =>
            c.joints.map(ji => {
              const [jx, jy] = c.path[ji];
              return (
                <g key={`${c.id}-j${ji}`} style={{
                  opacity: 0,
                  animation: vis
                    ? `dotIn 0.5s cubic-bezier(0.34,1.56,0.64,1) ${0.5 + i * 0.1}s forwards`
                    : 'none',
                  transformOrigin: `${jx}px ${jy}px`,
                }}>
                  <circle cx={jx} cy={jy} r="6.5" fill={c.beamColor} fillOpacity="0.12" filter="url(#tglow)" />
                  <circle cx={jx} cy={jy} r="3.2" fill="#c4cce4" fillOpacity="0.92" filter="url(#tglow)" />
                  <circle cx={jx} cy={jy} r="1.3" fill="white" fillOpacity="0.9" />
                </g>
              );
            })
          )}

          {/* ══ 5. FLOW BEAMS — the "light travelling along the line" effect ══ */}
          {vis && COMPANIES.map(c => {
            const L = Math.ceil(pathLen(c.path));
            return (
              <FlowBeam
                key={c.id + '-flow'}
                id={c.id}
                pts={c.path}
                color={c.beamColor}
                delay={c.beamDelay}
                totalLen={L}
              />
            );
          })}

          {/* ══ 6. COMPANY NODES ══ */}
          {COMPANIES.map((c, i) => (
            <Node key={c.id} c={c} visible={vis} idx={i} />
          ))}

          {/* ══ 7. CENTER HUB ══ */}
          {vis && (
            <g filter="url(#chub)" style={{
              opacity: 0,
              animation: 'nIn 0.9s cubic-bezier(0.34,1.56,0.64,1) 0.05s forwards, hubPulse 4s ease-in-out 1.2s infinite',
              transformOrigin: `${CX}px ${CY}px`,
            }}>
              {/* 3 sonar rings — staggered */}
              {[0, 1.0, 2.0].map((begin, k) => (
                <circle key={k} cx={CX} cy={CY} r="50" fill="none"
                  stroke="rgba(139,92,246,0.65)" strokeWidth="1.5">
                  <animate attributeName="r"
                    values="46;94;94" dur="3s" begin={`${begin}s`}
                    repeatCount="indefinite" calcMode="spline"
                    keySplines="0.35 0 0.9 1;0 0 1 1" />
                  <animate attributeName="stroke-opacity"
                    values="0.65;0;0" dur="3s" begin={`${begin}s`}
                    repeatCount="indefinite" calcMode="spline"
                    keySplines="0.35 0 0.9 1;0 0 1 1" />
                  <animate attributeName="strokeWidth"
                    values="2;0.4;0.4" dur="3s" begin={`${begin}s`}
                    repeatCount="indefinite" calcMode="spline"
                    keySplines="0.35 0 0.9 1;0 0 1 1" />
                </circle>
              ))}

              {/* fast spinning ring */}
              <g style={{ animation: 'spin 10s linear infinite', transformOrigin: `${CX}px ${CY}px` }}>
                <circle cx={CX} cy={CY} r="54" fill="none"
                  stroke="rgba(167,139,250,0.4)" strokeWidth="1"
                  strokeDasharray="5 14" />
              </g>

              {/* slow counter-spin ring */}
              <g style={{ animation: 'spin 22s linear reverse infinite', transformOrigin: `${CX}px ${CY}px` }}>
                <circle cx={CX} cy={CY} r="62" fill="none"
                  stroke="rgba(120,80,220,0.2)" strokeWidth="1"
                  strokeDasharray="2 20" />
              </g>

              {/* glow base */}
              <circle cx={CX} cy={CY + 5} r="46" fill="rgba(75,15,190,0.55)" />

              {/* card */}
              <rect x={CX - 43} y={CY - 43} width="86" height="86" rx="21" ry="21"
                fill="url(#hubFill)"
                stroke="rgba(180,150,255,0.75)" strokeWidth="1.5" />

              {/* gloss */}
              <rect x={CX - 43} y={CY - 43} width="86" height="43" rx="21" ry="21"
                fill="url(#hubGloss)" />

              {/* inner border */}
              <rect x={CX - 39} y={CY - 39} width="78" height="78" rx="17" ry="17"
                fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth="1" />

              {/* isometric cube */}
              <g transform={`translate(${CX - 13},${CY - 19})`}>
                <path d="M13 1 L25 7 L13 13 L1 7 Z" fill="rgba(255,255,255,0.97)" />
                <path d="M1 7 L13 13 L13 27 L1 21 Z" fill="rgba(255,255,255,0.42)" />
                <path d="M25 7 L13 13 L13 27 L25 21 Z" fill="rgba(255,255,255,0.7)" />
                <line x1="13" y1="1" x2="13" y2="13" stroke="rgba(255,255,255,0.45)" strokeWidth="0.7" />
              </g>

              <text x={CX} y={CY + 34} textAnchor="middle"
                fontSize="11.5" fontWeight="800"
                fill="#ddd6fe"
                fontFamily="'Cairo','Tajawal',sans-serif"
                letterSpacing="0.3">
                طلباتي تك
              </text>
            </g>
          )}
        </svg>
      </div>
    </section>
  </>);
}