import { createLocalizedMetadata } from '@/utils/metadata';

export const generateMetadata = createLocalizedMetadata({
  titleEn: 'SMS',
  titleAr: 'الرسائل القصيرة',
  descriptionEn: 'Manage SMS senders, providers, and message logs for your business.',
  descriptionAr: 'أدر مرسلي الرسائل القصيرة والمزودين وسجلات الرسائل لعملك.',
});

export default function SmsLayout({ children }) {
  return children;
}
