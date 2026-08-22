import { createLocalizedMetadata } from "@/utils/metadata";

export const generateMetadata = createLocalizedMetadata({
  titleEn: "Cancel Causes",
  titleAr: "أسباب الإلغاء",
  descriptionEn: "Manage predefined and employee-submitted order cancel causes.",
  descriptionAr: "إدارة أسباب إلغاء الطلبات المعتمدة والمقدمة من الموظفين.",
});

export default function CancelCausesLayout({ children }) {
  return children;
}
