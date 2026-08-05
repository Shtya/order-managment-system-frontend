import { createLocalizedMetadata } from '@/utils/metadata';

export const generateMetadata = createLocalizedMetadata({
  titleEn: 'Employees',
  titleAr: 'الموظفون',
  descriptionEn: 'Manage employee records, roles, and team access from one place.',
  descriptionAr: 'أدر سجلات الموظفين والأدوار والوصول الجماعي من مكان واحد.',
});

export default function EmployeesLayout({ children }) {
  return children;
}
