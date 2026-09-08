import { createLocalizedMetadata } from "@/utils/metadata";

export const generateMetadata = createLocalizedMetadata({
  titleEn: "Place Your Order",
  titleAr: "اطلب الآن",
  descriptionEn: "Review the offer and place your order.",
  descriptionAr: "راجع العرض وأرسل طلبك.",
});

export default function CampaignOrderLayout({ children }) {
  return children;
}