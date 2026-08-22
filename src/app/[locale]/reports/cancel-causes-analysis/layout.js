import { createLocalizedMetadata } from "@/utils/metadata";

export const generateMetadata = createLocalizedMetadata({
  titleEn: "Cancel Causes Statistics",
  titleAr: "إحصائيات أسباب الإلغاء",
  descriptionEn: "Analyze order cancel causes, SLA, and employee usage.",
  descriptionAr: "تحليل أسباب إلغاء الطلبات واتفاقية الخدمة واستخدام الموظفين.",
});

export default function CancelCausesReportsLayout({ children }) {
  return children;
}
