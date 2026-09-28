"use client";

import { useTranslations } from "next-intl";
import { Lock } from "lucide-react";

export default function StepCapabilities() {
  const t = useTranslations("agents");

  return (
    <div className="space-y-3">
      <div className="border border-dashed border-border rounded-xl p-6 text-center">
        <div className="mx-auto mb-3 w-10 h-10 rounded-xl bg-muted flex items-center justify-center text-muted-foreground">
          <Lock size={20} />
        </div>
        <p className="text-sm font-semibold text-foreground">
          {t("wizard.capabilitiesTitle")}
        </p>
        <p className="text-sm text-muted-foreground mt-1">
          {t("wizard.capabilitiesDescription")}
        </p>
      </div>
    </div>
  );
}
