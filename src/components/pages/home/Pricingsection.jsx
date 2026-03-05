'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { motion } from 'framer-motion';

/* ─── Check icon ─── */
function Check({ color = '#6d28d9' }) {
	return (
		<svg width="16" height="16" viewBox="0 0 16 16" fill="none" style={{ flexShrink: 0 }}>
			<circle cx="8" cy="8" r="7.5" stroke={color} strokeOpacity="0.3" />
			<path d="M5 8l2 2 4-4" stroke={color} strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
		</svg>
	);
}

/* ─── Badge ─── */
function NewBadge({ t }) {
	return (
		<span style={{
			background: '#BAEB33',
			color: '#fff', fontSize: 9, fontWeight: 700,
			padding: '2px 7px', borderRadius: 20,
			letterSpacing: 0.3,
		}}>{t('badge')}</span>
	);
}

/* ─── Feature row ─── */
function Feature({ label, isNew, featured, t }) {

	return (
		<div style={{
			display: 'flex', alignItems: 'center', justifyContent: 'flex-start',
			gap: 8, padding: '5px 0', direction: 'rtl',
		}}>

			<svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
				<g clip-path="url(#clip0_768_27559)">
					<g clip-path="url(#clip1_768_27559)">
						<path d="M6.98328 10.0001L8.99161 12.0167L13.0166 7.9834" stroke="url(#paint0_linear_768_27559)" stroke-width="1.2" stroke-linecap="round" stroke-linejoin="round" />
						<path d="M8.95828 2.0416C9.53328 1.54993 10.4749 1.54993 11.0583 2.0416L12.3749 3.17493C12.6249 3.3916 13.0916 3.5666 13.4249 3.5666H14.8416C15.7249 3.5666 16.4499 4.2916 16.4499 5.17493V6.5916C16.4499 6.9166 16.6249 7.3916 16.8416 7.6416L17.9749 8.95827C18.4666 9.53327 18.4666 10.4749 17.9749 11.0583L16.8416 12.3749C16.6249 12.6249 16.4499 13.0916 16.4499 13.4249V14.8416C16.4499 15.7249 15.7249 16.4499 14.8416 16.4499H13.4249C13.0999 16.4499 12.6249 16.6249 12.3749 16.8416L11.0583 17.9749C10.4833 18.4666 9.54161 18.4666 8.95828 17.9749L7.64161 16.8416C7.39161 16.6249 6.92494 16.4499 6.59161 16.4499H5.14994C4.26661 16.4499 3.54161 15.7249 3.54161 14.8416V13.4166C3.54161 13.0916 3.36661 12.6249 3.15828 12.3749L2.03328 11.0499C1.54994 10.4749 1.54994 9.5416 2.03328 8.9666L3.15828 7.6416C3.36661 7.3916 3.54161 6.92494 3.54161 6.59994V5.1666C3.54161 4.28327 4.26661 3.55827 5.14994 3.55827H6.59161C6.91661 3.55827 7.39161 3.38327 7.64161 3.1666L8.95828 2.0416Z" stroke="url(#paint1_linear_768_27559)" stroke-width="1.2" stroke-linecap="round" stroke-linejoin="round" />
					</g>
				</g>
				<defs>
					<linearGradient id="paint0_linear_768_27559" x1="9.88166" y1="12.0788" x2="9.97084" y2="7.91812" gradientUnits="userSpaceOnUse">
						<stop offset="0.011" stop-color={featured ? "#fff" : "#6b7280"} />
						<stop offset="1" stop-color={featured ? "#fff" : "#6b7280"} />
					</linearGradient>
					<linearGradient id="paint1_linear_768_27559" x1="9.68037" y1="18.6004" x2="10.2314" y2="1.4128" gradientUnits="userSpaceOnUse">
						<stop offset="0.011" stop-color={featured ? "#fff" : "#6b7280"} />
						<stop offset="1" stop-color={featured ? "#fff" : "#6b7280"} />
					</linearGradient>
					<clipPath id="clip0_768_27559">
						<rect width="20" height="20" fill={featured ? "#fff" : "#6b7280"} />
					</clipPath>
					<clipPath id="clip1_768_27559">
						<rect width="20" height="20" fill={featured ? "#fff" : "#6b7280"} />
					</clipPath>
				</defs>
			</svg>
			<span style={{ fontSize: 12, color: featured ? 'rgba(255,255,255,0.82)' : 'var(--muted-foreground,#6b7280)', textAlign: 'right' }}>
				{label}
			</span>
			{isNew && <NewBadge t={t} />}
		</div>
	);
}

/* ─── Pricing Card ─── */
function PricingCard({ plan, isYearly, t, index }) {
	const featured = plan.featured;
	const price = isYearly ? plan.priceYearly : plan.priceMonthly;

	return (
		<div
			style={{
				flex: 1,
				borderRadius: 20,
				padding: featured ? '32px 28px' : '28px 24px',
				direction: 'rtl',
				position: 'relative',
				background: featured
					? '#1b1945'
					: 'var(--card,#fff)',
				border: featured
					? ''
					: '4px solid #6763AF0F',
				boxShadow: featured
					? '0px 30px 50px 0px #00000014;'
					: '0px 30px 50px 0px #6763AF0A;',
				transform: featured ? 'scale(1.03)' : 'scale(1)',
				zIndex: featured ? 2 : 1,
				transition: 'box-shadow 0.3s, transform 0.3s',
				opacity: 0,
				animation: `cardIn 0.5s cubic-bezier(.34,1.56,.64,1) forwards`,
				animationDelay: `${index * 0.1}s`,
			}}
		>
			{/* Price */}
			<div style={{ marginBottom: 14 }}>
				<div style={{
					display: 'flex', alignItems: 'baseline',
					justifyContent: 'flex-start', gap: 6,
					flexDirection: 'row',
				}}>
					<span style={{
						fontSize: featured ? 36 : 30,
						fontWeight: 800,
						color: featured ? '#ffffff' : 'var(--foreground,#111)',
						letterSpacing: '-1px',
					}}>
						${price}
					</span>
					<span style={{ fontSize: 13, color: featured ? 'rgba(255,255,255,0.7)' : 'var(--muted-foreground,#6b7280)' }}>
						/ {t('perMonth')}
					</span>
				</div>
			</div>

			{/* Plan name + dot */}
			<div style={{
				display: 'flex', alignItems: 'center', justifyContent: 'flex-start',
				gap: 6, marginBottom: 4,
			}}>
				<span style={{
					width: 8, height: 8, borderRadius: '50%', flexShrink: 0,
					background: plan.dotColor,
					boxShadow: `0 0 6px ${plan.dotColor}`,
				}} />
				<span style={{ fontSize: 12, color: featured ? 'rgba(255,255,255,0.6)' : 'var(--muted-foreground,#9ca3af)' }}>
					{plan.tier}
				</span>
				<span style={{ fontWeight: 700, fontSize: 14, color: featured ? '#ffffff' : 'var(--foreground,#111)' }}>
					{t(`plans.${plan.id}.name`)}
				</span>
			</div>

			{/* Subtitle */}
			<p style={{
				fontSize: 12, textAlign: 'right', marginBottom: 20,
				color: featured ? 'rgba(255,255,255,0.55)' : 'var(--muted-foreground,#9ca3af)',
				lineHeight: 1.6,
			}}>
				{t(`plans.${plan.id}.subtitle`)}
			</p>

			{/* CTA */}
			<button className='rounded-full' style={{
				width: '100%', padding: '11px 0',
				fontWeight: 700, fontSize: 14, cursor: 'pointer', border: 'none',
				background: featured
					? '#BAEB33'
					: '#1B1945',
				color: '#fff',
				transition: 'opacity 0.2s, transform 0.2s',
				marginBottom: 24,
			}}
				onMouseEnter={e => { e.currentTarget.style.opacity = '0.88'; e.currentTarget.style.transform = 'translateY(-1px)'; }}
				onMouseLeave={e => { e.currentTarget.style.opacity = '1'; e.currentTarget.style.transform = 'none'; }}
			>
				{t('cta')}
			</button>

			{/* Divider */}
			<div style={{
				height: 1,
				background: featured ? 'rgba(255,255,255,0.1)' : 'var(--border,#e5e7eb)',
				marginBottom: 16,
			}} />

			{/* Features */}
			<div className={`${featured ? "bg-[#201E4E] border-[#3D3D3D80]" : "bg-[#F8F9FFC7] border-[#6763AF0A]"} border p-2 rounded-xl`} style={{ display: 'flex', flexDirection: 'column' }}>
				{plan.features.map((f, i) => (
					<Feature key={i} label={t(`plans.${plan.id}.features.f${i + 1}`)} isNew={f.isNew} featured={featured} t={t} />
				))}
			</div>
		</div>
	);
}

/* ─── Main ─── */
export default function PricingSection() {
	const t = useTranslations('pricing');
	const [isYearly, setIsYearly] = useState(false);

	const plans = [
		{
			id: 'starter',
			featured: false,
			tier: 'Starter –',
			dotColor: '#4ade80',
			priceMonthly: '9.99',
			priceYearly: '7.99',
			features: [
				{ isNew: false },
				{ isNew: true },
				{ isNew: false },
				{ isNew: false },
				{ isNew: false },
			],
		},
		{
			id: 'pro',
			featured: true,
			tier: 'Pro –',
			dotColor: '#818cf8',
			priceMonthly: '20.5',
			priceYearly: '16.5',
			features: [
				{ isNew: false },
				{ isNew: true },
				{ isNew: false },
				{ isNew: false },
				{ isNew: false },
				{ isNew: false },
			],
		},
		{
			id: 'enterprise',
			featured: false,
			tier: 'Business / Enterprise –',
			dotColor: '#a855f7',
			priceMonthly: '30.9',
			priceYearly: '24.9',
			features: [
				{ isNew: false },
				{ isNew: true },
				{ isNew: false },
				{ isNew: false },
				{ isNew: false },
				{ isNew: false },
			],
		},
	];

	return (
		<>
			<style>{`
        @keyframes cardIn {
          from { opacity: 0; transform: translateY(28px) scale(0.96); }
          to   { opacity: 1; transform: translateY(0) scale(1); }
        }
        @keyframes cardInFeatured {
          from { opacity: 0; transform: translateY(28px) scale(0.96); }
          to   { opacity: 1; transform: scale(1.03); }
        }
        .pricing-toggle input { display: none; }
        .pricing-toggle label {
          display: flex; align-items: center;
          gap: 12px; cursor: pointer; direction: rtl;
        }
        .toggle-track {
          width: 44px; height: 24px; border-radius: 12px;
          background: #1b1945; position: relative;
          transition: background 0.3s;
        }
        .toggle-track.off { background: #d1d5db; }
        .toggle-thumb {
          position: absolute; top: 3px;
          width: 18px; height: 18px; border-radius: 50%;
          background: #fff; transition: left 0.3s;
          box-shadow: 0 1px 4px rgba(0,0,0,0.2);
        }
        .toggle-track.on .toggle-thumb  { left: 23px; }
        .toggle-track.off .toggle-thumb { left: 3px; }
      `}</style>

			<section
				dir="rtl"
				style={{
					background: 'var(--background,#f9fafb)',
					padding: '72px 24px 80px',
				}}
			>

				<div style={{ textAlign: 'center', marginBottom: 8 }}>
					<motion.h2
						className="text-3xl md:text-[2.1rem] font-extrabold text-gray-900 leading-snug"
					>
						{t("heading.prefix")}{" "}
						<motion.span
							className="inline-block px-5 py-1 rounded-xl"
							style={{ background: `#6763AF16`, color: "#6763AF" }}
						>
							{t("heading.highlight")}
						</motion.span>
					</motion.h2>

					<motion.p
						className="text-xl text-gray-500 mt-2"
					>
						{t("subheading")}
					</motion.p>

					{/* Toggle */}
					<div className='relative w-fit mx-auto mt-[80px] '>
						<img src={"landing/3-days-free.png"} className='w-[80px] absolute top-[-60px] left-[-100px] ' />
						<div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 12, direction: 'rtl', marginBottom: 48, }}>
							<span style={{ fontSize: 13, fontWeight: isYearly ? 400 : 700, color: !isYearly ? 'var(--foreground,#111)' : 'var(--muted-foreground,#9ca3af)', }}> {t('monthly')} </span>
							<div className="toggle-track" style={{ width: 44, height: 24, borderRadius: 12, background: isYearly ? '#1b1945' : '#d1d5db', position: 'relative', cursor: 'pointer', transition: 'background 0.3s', }} onClick={() => setIsYearly(v => !v)}>
								<div style={{ position: 'absolute', top: 3, left: isYearly ? 23 : 3, width: 18, height: 18, borderRadius: '50%', background: '#fff', transition: 'left 0.3s', boxShadow: '0 1px 4px rgba(0,0,0,0.2)', }} /> </div>
							<span style={{ fontSize: 13, fontWeight: isYearly ? 700 : 400, color: isYearly ? 'var(--foreground,#111)' : 'var(--muted-foreground,#9ca3af)', }}> {t('yearly')} </span>
						</div>
					</div>
				</div>

				{/* Cards */}
				<div style={{
					display: 'flex',
					gap: 16,
					maxWidth: 960,
					margin: '0 auto',
					alignItems: 'center',
					flexWrap: 'wrap',
				}}>
					{plans.map((plan, i) => (
						<PricingCard
							key={plan.id}
							plan={plan}
							isYearly={isYearly}
							t={t}
							index={i}
						/>
					))}
				</div>
			</section>
		</>
	);
}