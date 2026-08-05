import { createLocalizedMetadata } from '@/utils/metadata';

export const generateMetadata = createLocalizedMetadata({
  titleEn: 'Upsells',
  titleAr: 'البيع الإضافي',
  descriptionEn: 'Create and manage upsell offers to grow order value.',
  descriptionAr: 'أنشئ وأدر عروض البيع الإضافي لزيادة قيمة الطلب.',
});

export default function UpsellsLayout({ children }) {
  return children;
}
