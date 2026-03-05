'use client';

import { useEffect, useState } from 'react';
import { useTranslations } from 'next-intl';
import Image from 'next/image';

/* ─── Layered ghost card behind the main screenshot ─── */
function BackCard({
	rotateY, rotateX, translateX, translateZ, animDelay,
}) {
	const [phase, setPhase] = useState('hidden');

	useEffect(() => {
		const timers = [];
		function cycle() {
			timers.push(setTimeout(() => setPhase('show'), 0));
			timers.push(setTimeout(() => setPhase('visible'), 600));
			timers.push(setTimeout(() => setPhase('hide'), 2800));
			timers.push(setTimeout(() => {
				setPhase('hidden');
				timers.push(setTimeout(cycle, 400));
			}, 3400));
		}
		timers.push(setTimeout(cycle, animDelay));
		return () => timers.forEach(clearTimeout);
	}, [animDelay]);

	const visible = phase === 'show' || phase === 'visible';

	return (
		<div
			style={{
				position: 'absolute',
				width: '92%',
				height: '90%',
				borderRadius: 18,
				overflow: 'hidden',
				top: '5%',
				left: '4%',
				transformOrigin: 'center center',
				transform: visible
					? `perspective(1000px) rotateY(${rotateY}deg) rotateX(${rotateX}deg) translateX(${translateX}px) translateZ(${translateZ}px)`
					: `perspective(1000px) rotateY(${rotateY * 0.25}deg) rotateX(${rotateX * 0.25}deg) translateX(0px) translateZ(-80px)`,
				opacity: visible ? 0.75 : 0,
				transition: 'transform 0.75s cubic-bezier(0.34,1.2,0.64,1), opacity 0.6s ease',
				boxShadow: visible ? '0 12px 60px rgba(0,0,0,0.55)' : 'none',
				zIndex: 0,
				filter: 'brightness(0.7) saturate(0.9)',
			}}
		>
			<Image
				src="/landing/multiScreen.png"
				alt=""
				fill
				style={{ objectFit: 'cover', objectPosition: 'top left' }}
				priority
			/>
			{/* overlay tint */}
			<div style={{
				position: 'absolute', inset: 0,
				background: 'linear-gradient(135deg, rgba(109,40,217,0.25) 0%, rgba(13,5,32,0.35) 100%)',
				borderRadius: 18,
				border: '1px solid rgba(255,255,255,0.10)',
			}} />
		</div>
	);
}

/* ─── Main hero ─── */
export default function HeroBannerSection() {
	const t = useTranslations('heroBanner');
	const [mounted, setMounted] = useState(false);

	useEffect(() => {
		const id = setTimeout(() => setMounted(true), 80);
		return () => clearTimeout(id);
	}, []);

	return (
		<>
			<style>{`
        @keyframes heroTextIn {
          from { opacity: 0; transform: translateX(36px); }
          to   { opacity: 1; transform: translateX(0);    }
        }
        @keyframes heroBtnIn {
          from { opacity: 0; transform: translateY(14px); }
          to   { opacity: 1; transform: translateY(0);    }
        }
        @keyframes floatScreen {
          0%,100% { transform: perspective(1000px) rotateY(-9deg) rotateX(4deg) translateY(0px);   }
          50%      { transform: perspective(1000px) rotateY(-9deg) rotateX(4deg) translateY(-10px); }
        }
        .hero-btn-primary:hover  { opacity: .88 !important; transform: translateY(-2px) !important; }
        .hero-btn-primary:active { transform: translateY(0)  !important; }
        .hero-btn-ghost:hover    { background: rgba(255,255,255,0.12) !important; transform: translateY(-2px) !important; }
        .hero-btn-ghost:active   { transform: translateY(0) !important; }
      `}</style>

			<section
			className=''
 				style={{
					background: 'linear-gradient(145deg, #0c041e 0%, #17093c 45%, #090218 100%)',
					minHeight: '440px',
					padding: 'clamp(40px,6vw,72px) clamp(20px,5vw,60px)',
					display: 'flex',
					alignItems: 'center',
					justifyContent: 'center',
					gap: 50,
					overflow: 'hidden',
					position: 'relative', 
				}}
			> 

 
				<div className='flex-none' style={{
					position: 'relative',
				}}>

					<img
						src="landing/multiScreen.png"
						alt="لوحة تحكم المنصة"
						className='w-[450px]'
						fill
						style={{ objectFit: 'contain' }}
						priority
					/>
				</div>

				{/* ── LEFT: Copy ── */}
				<div className=' max-w-[600px] w-full' style={{ 
					animation: mounted ? 'heroTextIn 0.75s cubic-bezier(.34,1.2,.64,1) forwards' : 'none',
				}}>
					<h1 className='text-3xl' style={{
 						fontWeight: 900,
						color: '#ffffff',
						lineHeight: 1.45,
						marginBottom: 18,
						fontFamily: "'Cairo', 'Tajawal', sans-serif",
						direction: 'rtl',
					}}>
						{t('heading.prefix')}{' '}
						<span style={{
							color: '#a3e635',
							textShadow: '0 0 24px rgba(163,230,53,0.35)',
						}}>
							{t('heading.highlight')}
						</span>
					</h1>

					<p className='text-xl ' style={{ 
						lineHeight: 1.9,
						color: 'rgba(255,255,255,0.62)',
						direction: 'rtl',
						marginBottom: 38,
						fontFamily: "'Cairo', 'Tajawal', sans-serif",
					}}>
						{t('subheading')}
					</p>

					{/* Buttons */}
					<div style={{
						display: 'flex', gap: 12, flexWrap: 'wrap',
						justifyContent: 'flex-start',
						opacity: mounted ? 1 : 0,
						animation: mounted ? 'heroBtnIn 0.65s ease 0.22s both' : 'none',
					}}>
						{/* Primary */}
						<button
							className="hero-btn-primary"
							style={{
								padding: '12px 30px', borderRadius: 10,
								background: '#6763AF',
								color: '#fff', fontWeight: 700, fontSize: 14,
								border: 'none', cursor: 'pointer',
								boxShadow: '0 4px 24px #6763AF',
								transition: 'opacity .2s, transform .2s',
								direction: 'rtl',
								fontFamily: "'Cairo','Tajawal',sans-serif",
							}}
						>
							{t('ctaPrimary')}
						</button>

						{/* Ghost */}
						<button
							className="hero-btn-ghost"
							style={{
								padding: '12px 30px', borderRadius: 10,
								background: 'rgba(255,255,255,0.06)',
								color: 'rgba(255,255,255,0.82)', fontWeight: 600, fontSize: 14,
								border: '1px solid rgba(255,255,255,0.16)', cursor: 'pointer',
								transition: 'background .2s, transform .2s',
								direction: 'rtl',
								fontFamily: "'Cairo','Tajawal',sans-serif",
							}}
						>
							{t('ctaSecondary')}
						</button>
					</div>
				</div>


			</section>
		</>
	);
}