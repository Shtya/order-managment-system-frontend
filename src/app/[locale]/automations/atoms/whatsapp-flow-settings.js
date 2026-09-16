export const WHATSAPP_AUTOMATION_STEP_TYPES = [
    "send_whatsapp_template",
    "send_whatsapp_message",
    "send_upsell",
    "ai_address_correction",
];

export const DEFAULT_WHATSAPP_SETTINGS = {
    mode: "random",
    accountId: null,
    acknowledged: false,
};

export function countWhatsappAutomationSteps(nodes = []) {
    return nodes.filter((node) =>
        WHATSAPP_AUTOMATION_STEP_TYPES.includes(node?.data?.type),
    ).length;
}

export function hasWhatsappAutomationSteps(nodes = []) {
    return countWhatsappAutomationSteps(nodes) > 0;
}

export function normalizeWhatsappSettings(settings) {
    if (!settings || typeof settings !== "object") {
        return { ...DEFAULT_WHATSAPP_SETTINGS };
    }
    const mode = settings.mode === "fixed" ? "fixed" : "random";
    return {
        mode,
        accountId: mode === "fixed" ? (settings.accountId || null) : null,
        acknowledged: !!settings.acknowledged,
    };
}
