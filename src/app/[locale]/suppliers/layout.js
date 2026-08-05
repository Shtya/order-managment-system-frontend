import { createLocalizedMetadata } from '@/utils/metadata';

export const generateMetadata = createLocalizedMetadata({
  titleEn: 'Suppliers',
  titleAr: 'الموردون',
  descriptionEn: 'Manage supplier profiles, balances, and purchase relationships.',
  descriptionAr: 'أدر ملفات الموردين والأرصدة وعلاقات الشراء.',
});

export default function SuppliersLayout({ children }) {
  return children;
}
