import { createLocalizedMetadata } from '@/utils/metadata';

export const generateMetadata = createLocalizedMetadata({
  titleEn: 'Warehouses Management',
  titleAr: 'إدارة المخازن',
  descriptionEn: 'Manage warehouse locations, capacity, and inventory operations.',
  descriptionAr: 'أدر مواقع المخازن والسعة وعمليات المخزون.',
});

export default function WarehousesManagementLayout({ children }) {
  return children;
}
