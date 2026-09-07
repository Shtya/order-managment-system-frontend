"use client";

import { Suspense } from "react";
import { useSearchParams } from "next/navigation";
import CampaignWizard from "../atoms/wizard/CampaignWizard";

function NewCampaignInner() {
  const searchParams = useSearchParams();
  return <CampaignWizard mode="create" copyFromId={searchParams.get("fromId")} />;
}

export default function NewCampaignPage() {
  return (
    <Suspense>
      <NewCampaignInner />
    </Suspense>
  );
}
