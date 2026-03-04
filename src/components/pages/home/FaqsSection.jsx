'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { motion } from 'framer-motion';
import { Plus } from 'lucide-react';

/* ─── Single FAQ Item ─── */
function FaqItem({ question, answer, isOpen, onToggle, index }) {
	return (
		<div
			style={{
				borderBottom: '1px solid var(--border, #e5e7eb)',
				overflow: 'hidden',
				transition: 'background 0.2s',
				background: isOpen ? 'rgba(139,92,246,0.03)' : 'transparent',
			}}
		>
			{/* Row */}
			<button
				onClick={onToggle}
				style={{
					width: '100%',
					display: 'flex',
					alignItems: 'center',
					justifyContent: 'space-between',
					padding: '20px 24px',
					background: 'none',
					border: 'none',
					cursor: 'pointer',
					direction: 'rtl',
					gap: 12,
				}}
			>
				{/* Question + icon badge */}
				<div style={{ display: 'flex', alignItems: 'center', gap: 12, flex: 1 }}>
					{/* ? badge */}
					<svg width="35" height="35" viewBox="0 0 45 45" fill="none" xmlns="http://www.w3.org/2000/svg">
						<rect x="2" y="2" width="41" height="41" rx="20.5" fill="#6763AF" />
						<rect x="2" y="2" width="41" height="41" rx="20.5" stroke="#E9E9FC" stroke-width="4" />
						<path d="M18.4199 18.04C17.6199 17.7 17.2799 16.71 17.7599 15.99C18.7299 14.55 20.3499 13.5 22.4899 13.5C24.8399 13.5 26.4499 14.57 27.2699 15.91C27.9699 17.06 28.3799 19.21 27.2999 20.81C26.0999 22.58 24.9499 23.12 24.3299 24.26C24.1799 24.53 24.0899 24.75 24.0299 25.2C23.9399 25.93 23.3399 26.5 22.5999 26.5C21.7299 26.5 21.0199 25.75 21.1199 24.88C21.1799 24.37 21.2999 23.84 21.5799 23.34C22.3499 21.95 23.8299 21.13 24.6899 19.9C25.5999 18.61 25.0899 16.2 22.5099 16.2C21.3399 16.2 20.5799 16.81 20.1099 17.54C19.7599 18.11 19.0299 18.29 18.4199 18.04ZM24.4999 30.5C24.4999 31.6 23.5999 32.5 22.4999 32.5C21.3999 32.5 20.4999 31.6 20.4999 30.5C20.4999 29.4 21.3999 28.5 22.4999 28.5C23.5999 28.5 24.4999 29.4 24.4999 30.5Z" fill="white" />
					</svg>


					<span style={{
						fontSize: 14, fontWeight: 600, textAlign: 'right',
						color: 'var(--foreground, #111)',
						flex: 1,
					}}>
						{question}
					</span>
				</div>

				{/* +/× toggle */}
				<div style={{
					width: 28, height: 28, borderRadius: 6,
					border: '1.5px solid var(--border, #e5e7eb)',
					display: 'flex', alignItems: 'center', justifyContent: 'center',
					flexShrink: 0, fontSize: 18, lineHeight: 1,
					color: isOpen ? '#7c3aed' : 'var(--muted-foreground, #9ca3af)',
					borderColor: isOpen ? 'rgba(139,92,246,0.4)' : 'var(--border, #e5e7eb)',
					transition: 'color 0.2s, border-color 0.2s, transform 0.3s',
					transform: isOpen ? 'rotate(45deg)' : 'rotate(0deg)',
					background: isOpen ? 'rgba(139,92,246,0.07)' : 'transparent',
				}}>
					<Plus size={15} />
				</div>
			</button>

			{/* Answer — animated expand */}
			<div style={{
				maxHeight: isOpen ? '400px' : '0px',
				overflow: 'hidden',
				transition: 'max-height 0.4s cubic-bezier(0.4,0,0.2,1)',
			}}>
				<p style={{
					padding: '0 24px 20px 24px',
					fontSize: 13,
					color: 'var(--muted-foreground, #6b7280)',
					lineHeight: 1.8,
					textAlign: 'right',
					direction: 'rtl',
					margin: 0,
					paddingRight: 72, // align under question text (skip the badge)
				}}>
					{answer}
				</p>
			</div>
		</div>
	);
}

/* ─── Main ─── */
export default function FaqSection() {
	const t = useTranslations('faq');
	const [openIndex, setOpenIndex] = useState(0); // first item open by default

	const items = ['q1', 'q2', 'q3', 'q4', 'q5'];


	return (
		<>
			<style>{`
        @keyframes fadeUpFaq {
          from { opacity: 0; transform: translateY(20px); }
          to   { opacity: 1; transform: translateY(0); }
        }
      `}</style>

			<section
				dir="rtl"
				style={{
					background: 'var(--background, #f9fafb)',
					padding: '72px 24px 80px',
				}}
			>
				{/* Heading */}
				<div style={{
					textAlign: 'center', marginBottom: 48,
					animation: 'fadeUpFaq 0.6s ease forwards',
				}}>

					<motion.h2
						className="text-3xl md:text-[2.1rem] font-extrabold text-gray-900 leading-snug"
					>
						{t("heading.prefix")}{" "}
						<motion.span
							className="inline-block px-5 py-1 rounded-md"
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


				</div>

				{/* Accordion card */}
				<div style={{
					maxWidth: 720,
					margin: '0 auto',
					background: '#f8f9ff',
					border: '4px solid #6763AF0A',
					borderRadius: 20,
					overflow: 'hidden',
					boxShadow: '0 4px 24px rgba(0,0,0,0.05)',
					animation: 'fadeUpFaq 0.7s ease 0.1s both',
				}}>
					{items.map((key, i) => (
						<FaqItem
							key={key}
							question={t(`items.${key}.q`)}
							answer={t(`items.${key}.a`)}
							isOpen={openIndex === i}
							onToggle={() => setOpenIndex(openIndex === i ? null : i)}
							index={i}
						/>
					))}
				</div>
			</section>
		</>
	);
}