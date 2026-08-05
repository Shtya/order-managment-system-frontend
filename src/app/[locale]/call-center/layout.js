import { createLocalizedMetadata } from '@/utils/metadata';

export const generateMetadata = createLocalizedMetadata({
  titleEn: 'Call Center',
  titleAr: 'مركز الاتصال',
  descriptionEn: 'Monitor and manage customer communications from the call center workspace.',
  descriptionAr: 'راقب وأدر اتصالات العملاء من مساحة عمل مركز الاتصال.',
});

export default function CallCenterLayout({ children }) {
  return children;
}
