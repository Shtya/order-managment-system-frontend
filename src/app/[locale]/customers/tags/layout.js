import { createLocalizedMetadata } from "@/utils/metadata";

export const generateMetadata = createLocalizedMetadata({
  titleEn: "Customer tags",
  titleAr: "وسوم العملاء",
  descriptionEn:
    "Manage customer tags and automations that use order fields and customer statistics.",
  descriptionAr:
    "إدارة وسوم العملاء وقواعد الأتمتة التي تستخدم بيانات الطلب وإحصائيات العميل.",
});

export default function CustomerTagsLayout({ children }) {
  return children;
}
