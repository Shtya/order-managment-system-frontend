import { createLocalizedMetadata } from '@/utils/metadata';

export const generateMetadata = createLocalizedMetadata({
  titleEn: 'WhatsApp',
  titleAr: 'واتساب',
  descriptionEn: 'Manage WhatsApp accounts, templates, chats, and integrations from one place.',
  descriptionAr: 'أدر حسابات واتساب والقوالب والمحادثات والتكاملات من مكان واحد.',
});

export default function WhatsAppLayout({ children }) {
  return children;
}
