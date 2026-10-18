"use client";

import { useEffect } from "react";
import { useRouter } from "@/i18n/navigation";
import { buildNewCampaignHref } from "../../atoms/campaignChannel";

export default function EmailNewCampaignPage() {
  const router = useRouter();

  useEffect(() => {
    router.replace(buildNewCampaignHref("email"));
  }, [router]);

  return null;
}
