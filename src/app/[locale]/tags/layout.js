import { createLocalizedMetadata } from "@/utils/metadata";

export const generateMetadata = createLocalizedMetadata({
  titleEn: "Tags",
  titleAr: "الوسوم",
  descriptionEn: "Manage order tags and the automations that assign them.",
  descriptionAr: "إدارة وسوم الطلبات وقواعد الأتمتة التي تعيّنها.",
});

export default function TagsLayout({ children }) {
  return children;
}
