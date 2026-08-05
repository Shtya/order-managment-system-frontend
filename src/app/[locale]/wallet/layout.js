import { createLocalizedMetadata } from '@/utils/metadata';

export const generateMetadata = createLocalizedMetadata({
  titleEn: 'Wallet',
  titleAr: 'المحفظة',
  descriptionEn: 'Review wallet balances, deposits, and account activity.',
  descriptionAr: 'استعرض أرصدة المحفظة والودائع والنشاط الحسابي.',
});

export default function WalletLayout({ children }) {
  return children;
}
