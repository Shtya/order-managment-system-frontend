import { createLocalizedMetadata } from "@/utils/metadata";

export const generateMetadata = createLocalizedMetadata({
  titleEn: "Customers",
  titleAr: "العملاء",
  descriptionEn: "Manage customers, contact details, addresses, and conversations.",
  descriptionAr: "إدارة العملاء وبيانات التواصل والعناوين والمحادثات.",
});

export default function CustomersLayout({ children }) {
  return children;
}
