import { createLocalizedMetadata } from '@/utils/metadata';

export const generateMetadata = createLocalizedMetadata({
  titleEn: 'Notifications',
  titleAr: 'الإشعارات',
  descriptionEn: 'Review alerts, updates, and operational notifications for your workspace.',
  descriptionAr: 'استعرض التنبيهات والتحديثات والإشعارات التشغيلية لمساحة العمل.',
});

export default function NotificationsLayout({ children }) {
  return children;
}
