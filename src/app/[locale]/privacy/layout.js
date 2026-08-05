import { createLocalizedMetadata } from '@/utils/metadata';

export const generateMetadata = createLocalizedMetadata({
  titleEn: 'Privacy Policy',
  titleAr: 'سياسة الخصوصية',
  descriptionEn: 'Review the privacy policy for Madar and how your data is handled.',
  descriptionAr: 'استعرض سياسة الخصوصية الخاصة بمدار وكيفية التعامل مع بياناتك.',
});

export default function PrivacyLayout({ children }) {
  return children;
}
