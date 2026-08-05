import { createLocalizedMetadata } from '@/utils/metadata';

export const generateMetadata = createLocalizedMetadata({
  titleEn: 'Settings',
  titleAr: 'الإعدادات',
  descriptionEn: 'Adjust workspace settings, integrations, and business preferences.',
  descriptionAr: 'عدّل إعدادات مساحة العمل والتكاملات والتفضيلات التجارية.',
});

export default function SettingsLayout({ children }) {
  return children;
}
