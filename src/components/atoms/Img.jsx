'use client';

import { baseImg } from '@/utils/axios';
import { useMemo, useRef, useState } from 'react';
import { ImageOff } from 'lucide-react';
import { cn } from '@/utils/cn';

export default function Img({
	src,
	altSrc,
	alt = '',
	className = 'h-full w-full object-cover',
	loading = 'lazy',
	decoding = 'async',
	draggable = false,
	...rest
}) {
	const [status, setStatus] = useState('loading'); // 'loading' | 'ok' | 'error'
	const errorHandledRef = useRef(false);

	const resolved = useMemo(() => {
		try {
			if (src == null || typeof src !== 'string') return null;
			const trimmed = src.trim();
			if (!trimmed) return null;
			if (
				trimmed.startsWith('https://') ||
				trimmed.startsWith('data:') ||
				trimmed.startsWith('blob:')
			) return trimmed;
			if (trimmed.startsWith('http://')) return null;
			const base = String(baseImg || '').replace(/\/+$/, '');
			const rel = trimmed.replace(/^\/+/, '');
			if (!base) return null;
			return `${base}/${rel}`;
		} catch {
			return null;
		}
	}, [src]);

	const handleError = (e) => {
		if (errorHandledRef.current) return;
		errorHandledRef.current = true;
		e.currentTarget.onerror = null;

		if (altSrc) {
			e.currentTarget.src = altSrc;
		} else {
			setStatus('error');
		}
	};

	const handleLoad = () => setStatus('ok');

	// ── No src at all → show fallback immediately ──
	if (!resolved) {
		return <BrokenPlaceholder className={className} />;
	}

	return (
		<span className={cn(' overflow-hidden relative block', className)} style={{ padding: 0 }}>
			{/* Broken overlay — shown when error */}
			{status === 'error' && (
				<BrokenPlaceholder className="absolute inset-0 rounded-[inherit]" />
			)}

			<img
				src={resolved}
				alt={status === 'error' ? '' : alt}
				className={cn(
					'h-full w-full transition-opacity duration-300',
					status === 'ok' ? 'object-cover opacity-100' : 'object-cover opacity-0 absolute inset-0',
				)}
				onError={handleError}
				onLoad={handleLoad}
				loading={loading}
				decoding={decoding}
				draggable={draggable}
				{...rest}
			/>

			{/* Shimmer while loading */}
			{status === 'loading' && (
				<span className="absolute inset-0 rounded-[inherit] overflow-hidden bg-secondary">
					<span className="absolute inset-0 -translate-x-full animate-[shimmer_1.4s_ease-in-out_infinite] bg-gradient-to-r from-transparent via-white/20 to-transparent" />
				</span>
			)}
		</span>
	);
}

function BrokenPlaceholder({ className }) {
	return (
		<span
			className={cn(
				'flex flex-col items-center justify-center gap-1 ',
				'bg-[color-mix(in_oklab,var(--muted)_80%,transparent)]',
				'border border-dashed border-border/60',
				'text-muted-foreground/50 select-none',
				className,
			)}
		>
			{/* Icon container */}
			<span className="flex items-center justify-center w-8 h-8 rounded-xl bg-[color-mix(in_oklab,var(--border)_60%,transparent)]">
				<ImageOff size={15} strokeWidth={1.5} />
			</span>
			<span className="text-[8px] font-medium tracking-wide opacity-70">
				لا توجد صورة
			</span>
		</span>
	);
}