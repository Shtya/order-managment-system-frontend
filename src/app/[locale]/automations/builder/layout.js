import { createLocalizedMetadata } from '@/utils/metadata';

export const generateMetadata = createLocalizedMetadata({
  titleEn: 'Automation Builder',
  titleAr: 'بناء الأتمتة',
  descriptionEn: 'Build and edit automation workflows with a visual editor.',
  descriptionAr: 'أنشئ وحرر سير العمل للأتمتة باستخدام محرر مرئي.',
});

export default function AutomationBuilderLayout({ children }) {
  return children;
}
