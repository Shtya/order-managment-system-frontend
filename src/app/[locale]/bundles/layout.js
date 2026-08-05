import { createLocalizedMetadata } from '@/utils/metadata';

export const generateMetadata = createLocalizedMetadata({
  titleEn: 'Bundles',
  titleAr: 'الباقات',
  descriptionEn: 'Create and manage product bundles to streamline offers and sales.',
  descriptionAr: 'أنشئ وأدر الباقات لتسهيل العروض والمبيعات.',
});

export default function BundlesLayout({ children }) {
  return children;
}
