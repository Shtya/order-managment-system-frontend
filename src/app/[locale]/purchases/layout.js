import { createLocalizedMetadata } from '@/utils/metadata';

export const generateMetadata = createLocalizedMetadata({
  titleEn: 'Purchases',
  titleAr: 'المشتريات',
  descriptionEn: 'Review purchase orders, supplier invoices, and procurement activity.',
  descriptionAr: 'استعرض أوامر الشراء وفواتير الموردين والنشاط الشرائي.',
});

export default function PurchasesLayout({ children }) {
  return children;
}
