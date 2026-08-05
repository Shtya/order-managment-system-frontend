import { createLocalizedMetadata } from '@/utils/metadata';

export const generateMetadata = createLocalizedMetadata({
  titleEn: 'Authentication',
  titleAr: 'سجل دخولك',
  descriptionEn: 'Sign in or create a new account to access your Madar dashboard, orders, products, and communication tools.',
  descriptionAr: 'سجل دخولك أو أنشئ حسابك في مدار للوصول إلى لوحة التحكم والطلبات والمنتجات وأدوات التواصل.',
});

export default function AuthLayout({ children }) {
  return children;
}