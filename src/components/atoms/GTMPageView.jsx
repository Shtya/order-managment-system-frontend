'use client';

import { useEffect } from 'react';
import { usePathname, useSearchParams } from 'next/navigation';

export default function GTMPageView() {
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const tab = searchParams.get('tab');

  useEffect(() => {
    window.dataLayer = window.dataLayer || [];
    window.dataLayer.push({
      event: 'pageview',
      page_path: tab ? `${pathname}?tab=${tab}` : pathname,
      page_location: window.location.href,
      page_title: document.title,
      page_tab: tab,
    });
  }, [pathname, tab]);

  return null;
}