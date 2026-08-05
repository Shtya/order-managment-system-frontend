import { createLocalizedMetadata } from '@/utils/metadata';

export const generateMetadata = createLocalizedMetadata({
  titleEn: 'Store Integration',
  titleAr: 'تكامل المتجر',
  descriptionEn: 'Connect and monitor your store integrations, sync status, and data health.',
  descriptionAr: 'اربط وراقب تكاملات المتجر وحالة المزامنة وصحة البيانات.',
});

export default function StoreIntegrationLayout({ children }) {
  return children;
}
