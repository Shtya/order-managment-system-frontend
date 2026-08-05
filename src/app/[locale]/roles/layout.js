import { createLocalizedMetadata } from '@/utils/metadata';

export const generateMetadata = createLocalizedMetadata({
  titleEn: 'Roles',
  titleAr: 'الأدوار',
  descriptionEn: 'Manage user roles and permissions for your team.',
  descriptionAr: 'أدر أدوار المستخدمين والصلاحيات لفريقك.',
});

export default function RolesLayout({ children }) {
  return children;
}
