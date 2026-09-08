import { Link2, Phone, User } from "lucide-react";

export const CAMPAIGN_PREVIEW_VALUES = {
  "customer.name": "Ahmed",
  "customer.number": "01012345678",
  "campaign.orderToken": "sample-token",
  "campaign.orderUrl": "https://getmadar.net/o/sample-token",
};

const TOKEN_RE = /\{\{\s*(customer\.(?:name|number)|campaign\.(?:orderToken|orderUrl))\s*\}\}/gi;

export function hydrateCampaignPlaceholders(text, values = CAMPAIGN_PREVIEW_VALUES) {
  if (text == null) return "";
  return String(text).replace(TOKEN_RE, (_m, id) => {
    const key = String(id).toLowerCase();
    if (key === "customer.name") return values["customer.name"] ?? "";
    if (key === "customer.number") return values["customer.number"] ?? "";
    if (key === "campaign.ordertoken") return values["campaign.orderToken"] ?? "";
    if (key === "campaign.orderurl") return values["campaign.orderUrl"] ?? "";
    return "";
  });
}

export function campaignVarDisplayValue(item, values = CAMPAIGN_PREVIEW_VALUES) {
  const raw = item?.value ?? "";
  if (!raw) return "";
  return hydrateCampaignPlaceholders(raw, values);
}

export function campaignTemplatePreviewOverlay(source, values = CAMPAIGN_PREVIEW_VALUES) {
  const headerVariables = source?.headerVariables || {};
  const bodyVariables = source?.bodyVariables || {};
  const firstHeader = headerVariables["1"] || Object.values(headerVariables)[0];
  return {
    headerExample: campaignVarDisplayValue(firstHeader, values),
    examples: Object.fromEntries(
      Object.entries(bodyVariables).map(([k, v]) => [k, campaignVarDisplayValue(v, values)]),
    ),
  };
}

export function getCampaignPlaceholderChips(t) {
  return [
    { id: "customer.name", label: t("message.placeholders.name"), preview: "Ahmed", icon: User },
    { id: "customer.number", label: t("message.placeholders.number"), preview: "01012345678", icon: Phone },
    { id: "campaign.orderUrl", label: t("message.placeholders.link"), preview: "https://getmadar.net/o/sample-token", icon: Link2 },
  ];
}
