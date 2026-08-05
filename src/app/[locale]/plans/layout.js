import { createLocalizedMetadata } from '@/utils/metadata';

export const generateMetadata = createLocalizedMetadata({
  titleEn: 'Plans',
  titleAr: 'الخطط',
  descriptionEn: 'Explore subscription plans and available features for your workspace.',
  descriptionAr: 'اكتشف خطط الاشتراك والميزات المتاحة لمساحة العمل الخاصة بك.',
});

export default function PlansLayout({ children }) {
  return children;
}
