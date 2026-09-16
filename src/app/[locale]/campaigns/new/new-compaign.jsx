"use client";

import { Suspense } from "react";
import { useSearchParams } from "next/navigation";
import CampaignWizard from "../atoms/wizard/CampaignWizard";
import { normalizeCampaignChannel } from "../atoms/campaignChannel";

function NewCampaignInner({ channel: channelProp }) {
  const searchParams = useSearchParams();
  const channel = normalizeCampaignChannel(
    channelProp ?? searchParams.get("channel"),
  );
  return (
    <CampaignWizard
      mode="create"
      copyFromId={searchParams.get("fromId")}
      channel={channel}
    />
  );
}

export default function NewCampaignPage({ channel }) {
  return (
    <Suspense>
      <NewCampaignInner channel={channel} />
    </Suspense>
  );
}
