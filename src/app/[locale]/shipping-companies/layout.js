import { createLocalizedMetadata } from '@/utils/metadata';

export const generateMetadata = createLocalizedMetadata({
  titleEn: 'Shipping Companies',
  titleAr: 'شركات الشحن',
  descriptionEn: 'Manage shipping providers, delivery rules, and shipping configuration.',
  descriptionAr: 'أدر مزودي الشحن وقواعد التسليم وإعدادات الشحن.',
});

export default function ShippingCompaniesLayout({ children }) {
  return children;
}
