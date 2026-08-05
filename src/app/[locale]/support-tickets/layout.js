import { createLocalizedMetadata } from '@/utils/metadata';

export const generateMetadata = createLocalizedMetadata({
  titleEn: 'Support Tickets',
  titleAr: 'تذاكر الدعم',
  descriptionEn: 'Track and resolve support tickets submitted by your team or customers.',
  descriptionAr: 'تابع وحل تذاكر الدعم المقدمة من فريقك أو عملائك.',
});

export default function SupportTicketsLayout({ children }) {
  return children;
}
