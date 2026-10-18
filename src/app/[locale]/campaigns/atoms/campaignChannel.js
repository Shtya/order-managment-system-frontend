"use client";

export const CAMPAIGN_CHANNELS = ["whatsapp", "sms", "email"];

export const DEFAULT_CAMPAIGN_CHANNEL = "whatsapp";

// Channel comes from the URL query (?channel=...). Anything invalid
// falls back to WhatsApp.
export function normalizeCampaignChannel(value) {
  const normalized = String(value ?? "")
    .trim()
    .toLowerCase();
  if (CAMPAIGN_CHANNELS.includes(normalized)) return normalized;
  return DEFAULT_CAMPAIGN_CHANNEL;
}

export function buildNewCampaignHref(channel, params = {}) {
  const normalized = normalizeCampaignChannel(channel);
  const search = new URLSearchParams();
  search.set("channel", normalized);

  Object.entries(params || {}).forEach(([key, value]) => {
    if (value === undefined || value === null || value === "") return;
    search.set(key, String(value));
  });

  const query = search.toString();
  return query ? `/campaigns/new?${query}` : "/campaigns/new";
}

export function campaignListHref(channel) {
  return `/campaigns`;
}
