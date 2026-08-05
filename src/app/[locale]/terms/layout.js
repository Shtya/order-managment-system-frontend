import { createLocalizedMetadata } from '@/utils/metadata';

export const generateMetadata = createLocalizedMetadata({
  titleEn: 'Terms and Conditions',
  titleAr: 'الشروط والأحكام',
  descriptionEn: 'Read the terms and conditions for using the Madar platform.',
  descriptionAr: 'اقرأ الشروط والأحكام لاستخدام منصة مدار.',
});

export default function TermsLayout({ children }) {
  return children;
}
