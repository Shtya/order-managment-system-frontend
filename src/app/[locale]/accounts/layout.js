import { createLocalizedMetadata } from '@/utils/metadata';

export const generateMetadata = createLocalizedMetadata({
  titleEn: 'Accounts',
  titleAr: 'الحسابات',
  descriptionEn: 'Review account balances, supplier payments, and financial activity across the workspace.',
  descriptionAr: 'استعرض أرصدة الحسابات ومدفوعات الموردين والنشاط المالي داخل مساحة العمل.',
});

export default function AccountsLayout({ children }) {
  return children;
}
