'use client';

import { useEffect } from 'react';
import { usePathname, useSearchParams } from 'next/navigation';

export default function GTMPageView() {
  const pathname = usePathname();
  const searchParams = useSearchParams();

  useEffect(() => {

    window.dataLayer = window.dataLayer || [];
      
    window.dataLayer.push({
      event: 'pageview',
      page_path: pathname,
      page_location: window.location.href,
      page_title: document.title,
      page_query: searchParams.toString(),
    });
  }, [pathname, searchParams]);

  return null;
}