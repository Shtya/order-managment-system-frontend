"use client";

import { Suspense } from "react";
import { useParams, useSearchParams } from "next/navigation";
import CampaignWizard from "../../atoms/wizard/CampaignWizard";
import { normalizeCampaignChannel } from "../../atoms/campaignChannel";

function EditCampaignInner() {
  const params = useParams();
  const searchParams = useSearchParams();
  const campaignId = params?.id;
  // Channel comes from the URL (?channel=); invalid → WhatsApp.
  // Edit still loads the stored campaign channel as source of truth.
  const channel = normalizeCampaignChannel(searchParams.get("channel"));

  return <CampaignWizard mode="edit" campaignId={campaignId} channel={channel} />;
}

export default function EditCampaignPage() {
  return (
    <Suspense>
      <EditCampaignInner />
    </Suspense>
  );
}
