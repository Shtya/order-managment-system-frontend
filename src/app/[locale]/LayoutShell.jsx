// app/[locale]/LayoutShell.jsx
'use client';

import React, { useState }  from 'react';
import { ThemeProvider } from 'next-themes';
import { useLocale } from 'next-intl';
import { cn } from '@/utils/cn';
import Header from '@/components/molecules/Header';
import Sidebar from '@/components/molecules/Sidebar';
 

 
export default function LayoutShell({children}) {
  return (
    <ThemeProvider attribute="class" defaultTheme="dark" enableSystem>
      <DashboardLayout>{children}</DashboardLayout>
    </ThemeProvider>
  );
}




function DashboardLayout({children}) {
  const locale = useLocale();
  const isRTL = locale === 'ar';

  const [isSidebarOpen, setIsSidebarOpen] = useState(true);

  return (
    <div className={isRTL ? 'rtl' : 'ltr'} dir={isRTL ? 'rtl' : 'ltr'}>
      <Header
        toggleSidebar={() => setIsSidebarOpen((v) => !v)}
        isSidebarOpen={isSidebarOpen}
      />
      <Sidebar isRTL={isRTL} isOpen={isSidebarOpen} />
 
      <div
        className={` bg-[#f3f6fa] dark:bg-[#19243950]  relative transition-all duration-300 ${
          isSidebarOpen ? (isRTL ? 'mr-[280px]' : 'ml-[280px]') : (isRTL ? 'mr-[80px]' : 'ml-[80px]')
        } mt-16`}
      >
        {children}
      </div>
    </div>
  );
}