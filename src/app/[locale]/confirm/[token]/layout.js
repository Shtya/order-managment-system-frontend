import { getCampaignOrderBranding, toAbsoluteMediaUrl } from "./get-order-branding";

export async function generateMetadata({ params }) {
  const { token } = await params;
  const branding = await getCampaignOrderBranding(token);
  const pageTitle = String(branding?.pageTitle || "").trim();
  const favicon = String(branding?.favicon?.icon || "").trim();
  const metadata = {};

  if (pageTitle) {
    metadata.title = { absolute: pageTitle };
  }

  if (favicon) {
    const href = `${toAbsoluteMediaUrl(favicon)}?v=${encodeURIComponent(favicon)}`;
    metadata.icons = {
      icon: [{ url: href, type: "image/x-icon" }],
      shortcut: href,
      apple: href,
    };
  }

  return metadata;
}

export default function CampaignOrderTokenLayout({ children }) {
  return children;
}
