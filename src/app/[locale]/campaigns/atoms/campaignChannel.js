"use client";

export const CAMPAIGN_CHANNELS = ["whatsapp", "sms", "email"];

export const DEFAULT_CAMPAIGN_CHANNEL = "whatsapp";

// Channel comes from the URL (/campaigns/{type}). Anything invalid
// falls back to WhatsApp.
export function normalizeCampaignChannel(value) {
  const normalized = String(value ?? "")
    .trim()
    .toLowerCase();
  if (CAMPAIGN_CHANNELS.includes(normalized)) return normalized;
  return DEFAULT_CAMPAIGN_CHANNEL;
}

export function campaignListHref(channel) {
  return `/campaigns`;
}
