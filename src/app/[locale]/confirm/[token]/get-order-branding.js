import { cookies } from "next/headers";

const API_BASE = (process.env.NEXT_PUBLIC_BASE_URL || "").replace(/\/+$/, "");

export function toAbsoluteMediaUrl(url) {
  if (!url) return "";
  const value = String(url).trim();
  if (!value) return "";
  if (value.startsWith("blob") || value.startsWith("data:") || value.startsWith("http")) {
    return value;
  }
  return `${API_BASE}/${value.replace(/^\/+/, "")}`;
}

export async function getCampaignOrderBranding(token) {
  if (!token || !API_BASE) return null;
  try {
    if (token === "preview") {
      const jar = await cookies();
      const accessToken = jar.get("accessToken")?.value;
      if (!accessToken) return null;
      const res = await fetch(`${API_BASE}/client-settings/campaign-order-preview`, {
        cache: "no-store",
        headers: { Authorization: `Bearer ${accessToken}` },
      });
      if (!res.ok) return null;
      const json = await res.json();
      return json?.branding || null;
    }

    const res = await fetch(
      `${API_BASE}/public/campaign-orders/${encodeURIComponent(token)}`,
      { cache: "no-store" },
    );
    if (!res.ok) return null;
    const json = await res.json();
    return json?.branding || null;
  } catch {
    return null;
  }
}
