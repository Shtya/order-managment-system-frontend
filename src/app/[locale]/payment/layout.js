import { createLocalizedMetadata } from '@/utils/metadata';

export const generateMetadata = createLocalizedMetadata({
  titleEn: 'Payments',
  titleAr: 'المدفوعات',
  descriptionEn: 'Review payment status, invoices, and billing outcomes for your business.',
  descriptionAr: 'استعرض حالة المدفوعات والفواتير ونتائج الفوترة الخاصة بنشاطك.',
});

export default function PaymentLayout({ children }) {
  return children;
}
