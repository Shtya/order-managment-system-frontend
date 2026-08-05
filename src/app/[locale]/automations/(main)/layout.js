import { createLocalizedMetadata } from '@/utils/metadata';

export const generateMetadata = createLocalizedMetadata({
  titleEn: 'Automations',
  titleAr: 'الأتمتة',
  descriptionEn: 'Create, monitor, and manage workflow automations that keep your operations moving.',
  descriptionAr: 'أنشئ وراقب وأدر أتمتة العمليات التي تحافظ على سير العمل بسلاسة.',
});

export default function AutomationsLayout({ children }) {
  return children;
}
