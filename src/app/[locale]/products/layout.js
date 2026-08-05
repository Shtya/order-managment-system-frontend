import { createLocalizedMetadata } from '@/utils/metadata';

export const generateMetadata = createLocalizedMetadata({
  titleEn: 'Products',
  titleAr: 'المنتجات',
  descriptionEn: 'Manage your products, inventory, pricing, and product information.',
  descriptionAr: 'أدر منتجاتك والمخزون والأسعار ومعلومات المنتج.',
});

export default function ProductsLayout({ children }) {
  return children;
}
