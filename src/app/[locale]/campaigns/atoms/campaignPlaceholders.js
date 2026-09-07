export const CAMPAIGN_PREVIEW_VALUES = {
  "customer.name": "Ahmed",
  "customer.number": "01012345678",
};

const TOKEN_RE = /\{\{\s*(customer\.(?:name|number))\s*\}\}/gi;

export function hydrateCampaignPlaceholders(text, values = CAMPAIGN_PREVIEW_VALUES) {
  if (text == null) return "";
  return String(text).replace(TOKEN_RE, (_m, id) => {
    const key = String(id).toLowerCase();
    if (key === "customer.name") return values["customer.name"] ?? "";
    if (key === "customer.number") return values["customer.number"] ?? "";
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
