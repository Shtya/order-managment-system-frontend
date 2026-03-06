// app/[locale]/LayoutShell.jsx
'use client';

import React, { useState } from 'react';
import { ThemeProvider } from 'next-themes';
import { useLocale } from 'next-intl';
import Header from '@/components/molecules/Header';
import Sidebar from '@/components/molecules/Sidebar';
import { usePathname } from 'next/navigation';
import { Toaster } from 'react-hot-toast';
import { SocketProvider } from '../../context/SocketContext';

export default function LayoutShell({ children }) {
	return (
		<ThemeProvider attribute="class" defaultTheme="dark" enableSystem>
			<SocketProvider>
				<DashboardLayout>{children}</DashboardLayout>
			</SocketProvider>
		</ThemeProvider>
	);
}

const toastOptions = (isRTL) => ({
	style: {
		fontFamily: 'var(--font)',
		fontSize: 13,
		borderRadius: 12,
		direction: isRTL ? 'rtl' : 'ltr',
		background: 'var(--card)',
		color: 'var(--card-foreground)',
		border: '1px solid var(--border)',
	},
	success: {
		style: {
			border: '1px solid color-mix(in oklab, var(--primary) 30%, var(--border))',
			color: 'var(--primary)',
		},
		iconTheme: { primary: 'var(--primary)', secondary: 'var(--primary-foreground)' },
	},
	error: {
		style: {
			border: '1px solid color-mix(in oklab, var(--destructive) 30%, var(--border))',
			color: 'var(--destructive)',
		},
		iconTheme: { primary: 'var(--destructive)', secondary: 'var(--destructive-foreground)' },
	},
});

function DashboardLayout({ children }) {
	const locale = useLocale();
	const isRTL = locale === 'ar';
	const AllPathname = usePathname();
	const pathname = AllPathname?.slice(3, 1000);
	const [isSidebarOpen, setIsSidebarOpen] = useState(false);

	const isAuthRoute =
		pathname?.startsWith('/auth') ||
		pathname?.startsWith('/onboarding') ||
		pathname?.startsWith('/warehouse/print') ||
		pathname?.includes('reset-password') ||
		pathname?.includes('forgot-password');

	if (isAuthRoute || pathname === '') {
		return (
			<div>
				<Toaster position="top-center" toastOptions={toastOptions(isRTL)} />
				{children}
			</div>
		);
	}

	const sidebarW = isSidebarOpen ? 260 : 68;

	return (
		<div className="flex h-screen overflow-hidden bg-background">
			{/* ── Sidebar — full height, z-above header ── */}
			<Sidebar
				isRTL={isRTL}
				onOpenSidebar={() => setIsSidebarOpen(v => !v)}
				isOpen={isSidebarOpen}
			/>

			<div
				className="flex flex-col flex-1 overflow-hidden transition-all duration-300"
				style={{
					marginRight: isRTL ? sidebarW : 0,
					marginLeft: isRTL ? 0 : sidebarW,
				}}
			>
				<Header
					toggleSidebar={() => setIsSidebarOpen(v => !v)}
					isSidebarOpen={isSidebarOpen}
				/>

				{/* Scrollable page content */}
				<main className="flex-1 overflow-y-auto overflow-x-hidden relative  ">

					<div className="pointer-events-none absolute inset-0" style={{ zIndex: 0 }}>

						<div
							className="absolute inset-0"
							style={{
								backgroundImage: 'radial-gradient(circle, color-mix(in oklab, var(--primary) 60%, transparent) 1.2px, transparent 1.2px)',
								backgroundSize: '24px 24px',
								opacity: 0.18,
							}}
						/>

					</div>
					<div className="relative" style={{ zIndex: 1 }}>
						{children}
					</div>
				</main>
			</div>

			<Toaster position="top-center" toastOptions={toastOptions(isRTL)} containerStyle={{
				zIndex: 100001, // Header is 100000, so we go +1
			}} />
		</div>
	);
}