import { createLocalizedMetadata } from '@/utils/metadata';

export const generateMetadata = createLocalizedMetadata({
  titleEn: 'Running Automations',
  titleAr: 'تشغيلات الأتمتة',
  descriptionEn: 'Monitor live automation executions and their current status.',
  descriptionAr: 'راقب تنفيذات الأتمتة المباشرة وحالتها الحالية.',
});

export default function RunningAutomationsLayout({ children }) {
  return children;
}
