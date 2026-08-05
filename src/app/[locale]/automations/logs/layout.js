import { createLocalizedMetadata } from '@/utils/metadata';

export const generateMetadata = createLocalizedMetadata({
  titleEn: 'Automation Logs',
  titleAr: 'سجلات الأتمتة',
  descriptionEn: 'Review automation runs, statuses, and execution history.',
  descriptionAr: 'استعرض عمليات الأتمتة وحالاتها وسجل التنفيذ.',
});

export default function AutomationLogsLayout({ children }) {
  return children;
}
