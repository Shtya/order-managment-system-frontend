import { createLocalizedMetadata } from '@/utils/metadata';

export const generateMetadata = createLocalizedMetadata({
  titleEn: 'Onboarding',
  titleAr: 'الاستقبال',
  descriptionEn: 'Get started with Madar and set up your workspace for success.',
  descriptionAr: 'ابدأ مع مدار وقم بإعداد مساحة العمل الخاصة بك بنجاح.',
});

export default function OnboardingLayout({ children }) {
  return children;
}
