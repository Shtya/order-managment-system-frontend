import { createLocalizedMetadata } from '@/utils/metadata';

export const generateMetadata = createLocalizedMetadata({
  titleEn: 'Dashboard',
  titleAr: 'لوحة التحكم',
  descriptionEn: 'View business analytics, operational alerts, and performance insights from your dashboard.',
  descriptionAr: 'شاهد التحليلات والإنذارات التشغيلية ومؤشرات الأداء من لوحة التحكم.',
});

export default function DashboardLayout({ children }) {
  return children;
}
