// app/[locale]/LayoutShell.jsx
'use client';

import React, { useState } from 'react';
import { ThemeProvider } from 'next-themes';
import { useLocale } from 'next-intl';
import { cn } from '@/utils/cn';
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




function DashboardLayout({ children }) {
	const locale = useLocale();
	const isRTL = locale === 'ar';
	const AllPathname = usePathname();
	const pathname = AllPathname?.slice(3, 1000)

	const [isSidebarOpen, setIsSidebarOpen] = useState(false);

	const isAuthRoute =
		pathname?.startsWith('/auth') ||
		pathname?.startsWith('/warehouse/print') ||
		pathname?.includes('reset-password') ||
		pathname?.includes('forgot-password');


	if (isAuthRoute || pathname == "") {
		return (
			<div  >
				{children}
			</div>
		);
	}

	return (
		<div>
			<Header toggleSidebar={() => setIsSidebarOpen((v) => !v)} isSidebarOpen={isSidebarOpen} />
			<Sidebar isRTL={isRTL} onOpenSidebar={() => setIsSidebarOpen((v) => !v)} isOpen={isSidebarOpen} />
			<Toaster position="top-center" />

			<div
				className={` relative  duration-300 ${isSidebarOpen
					? isRTL
						? 'mr-[280px]'
						: 'ml-[280px]'
					: isRTL
						? 'mr-[80px]'
						: 'ml-[80px]'
					} mt-16 mb-8 `}
			>
				{children}
			</div>
		</div>
	);
}


