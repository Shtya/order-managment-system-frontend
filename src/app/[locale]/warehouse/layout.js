import { createLocalizedMetadata } from '@/utils/metadata';

export const generateMetadata = createLocalizedMetadata({
  titleEn: 'Warehouse',
  titleAr: 'المخزن',
  descriptionEn:
    'Manage warehouse operations, distribute orders to shipping companies, scan orders, print waybills, process outgoing and returned shipments, and track order movements from one place.',
  descriptionAr:
    'إدارة عمليات المخزن، وتوزيع الطلبات على شركات الشحن، ومسح الطلبات، وطباعة بوالص الشحن، وتجهيز الشحنات الصادرة والمرتجعة، وتتبع حركة الطلبات من مكان واحد.',
});

export default function WarehouseLayout({ children }) {
  return children;
}