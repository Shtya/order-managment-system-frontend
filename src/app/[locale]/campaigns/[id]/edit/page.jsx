"use client";

import { useParams } from "next/navigation";
import CampaignWizard from "../../atoms/wizard/CampaignWizard";

export default function EditCampaignPage() {
  const params = useParams();
  const campaignId = params?.id;

  return <CampaignWizard mode="edit" campaignId={campaignId} />;
}
