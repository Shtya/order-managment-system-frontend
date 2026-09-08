export const ORDER_FOLLOWUP_URL_PLACEHOLDER = "{orderUrl}";
export const ORDER_TOKEN_PLACEHOLDER = "{{campaign.orderToken}}";
export const ORDER_URL_PLACEHOLDER = "{{campaign.orderUrl}}";

const ORDER_LINK_VAR_RE = /\{\{\s*campaign\.(orderToken|orderUrl)\s*\}\}/i;
const CUSTOM_BUTTON_TYPES = new Set(["CUSTOM", "QUICK_REPLY"]);

function rawVarValue(input) {
  if (input == null) return "";
  if (typeof input === "object" && !Array.isArray(input)) {
    return String(input.value ?? "");
  }
  return String(input);
}

export function campaignOrderPageBaseUrl() {
  const explicit = String(process.env.NEXT_PUBLIC_CAMPAIGN_ORDER_PAGE_BASE_URL || "").replace(/\/+$/, "");
  if (explicit) return explicit.endsWith("/o") ? explicit : `${explicit}/o`;
  const frontend = String(process.env.NEXT_PUBLIC_FRONTEND_URL || "").replace(/\/+$/, "");
  if (frontend) return frontend.endsWith("/o") ? frontend : `${frontend}/o`;
  if (typeof window !== "undefined") return `${window.location.origin}/o`;
  return "/o";
}

export function textHasOrderLinkVariable(text) {
  const value = String(text ?? "");
  return ORDER_LINK_VAR_RE.test(value) || value.includes(ORDER_FOLLOWUP_URL_PLACEHOLDER);
}

function collectVariableValues(vars) {
  if (!vars || typeof vars !== "object") return [];
  return Object.values(vars).map((item) => rawVarValue(item));
}

export function inspectTemplateOrderLink(whatsapp) {
  const source = whatsapp?.templateData ? whatsapp : { templateData: whatsapp };
  const templateData = source.templateData || {};
  const buttons = Array.isArray(templateData.buttons) ? templateData.buttons : [];

  const variableTexts = [
    ...collectVariableValues(source.headerVariables),
    ...collectVariableValues(source.bodyVariables),
    ...collectVariableValues(source.buttonVariables),
    rawVarValue(source.locationData?.name),
    rawVarValue(source.locationData?.address),
  ];
  const hasOrderUrlVariable = variableTexts.some((text) => textHasOrderLinkVariable(text));

  const quickReplies = buttons
    .map((btn, index) => ({
      index,
      text: String(btn?.text || ""),
      type: btn?.type,
    }))
    .filter((btn) => CUSTOM_BUTTON_TYPES.has(btn.type))
    .map(({ index, text }) => ({ index, text }));

  const hasQuickReply = quickReplies.length > 0;
  return {
    hasOrderUrlVariable,
    hasOrderUrlSlot: hasOrderUrlVariable,
    quickReplies,
    hasQuickReply,
    orderLinkAvailable: hasOrderUrlVariable || hasQuickReply,
    qrOnly: !hasOrderUrlVariable && hasQuickReply,
    urlOnly: hasOrderUrlVariable && !hasQuickReply,
  };
}
