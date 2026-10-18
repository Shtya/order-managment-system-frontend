import { describe, expect, it } from "vitest";
import {
  buildNewCampaignHref,
  normalizeCampaignChannel,
} from "./campaignChannel";

describe("campaign channel helpers", () => {
  it("normalizes unsupported channels back to whatsapp", () => {
    expect(normalizeCampaignChannel("WHATSAPP")).toBe("whatsapp");
    expect(normalizeCampaignChannel("unknown")).toBe("whatsapp");
    expect(normalizeCampaignChannel("email")).toBe("email");
  });

  it("builds a single-page campaign URL with channel and fromId", () => {
    expect(buildNewCampaignHref("email", { fromId: 42 })).toBe(
      "/campaigns/new?channel=email&fromId=42",
    );
  });
});
