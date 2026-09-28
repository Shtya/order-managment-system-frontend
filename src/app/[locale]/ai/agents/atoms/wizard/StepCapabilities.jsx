"use client";

import { useTranslations } from "next-intl";
import {
  Lock,
  Map,
  MapPin,
  Megaphone,
  MessageSquareText,
  Search,
  ShoppingCart,
  ThumbsUp,
} from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";
import { AGENT_CAPABILITIES } from "./agentWizardSchema";

const CAPABILITY_ICONS = {
  createOrders: ShoppingCart,
  campaignOrders: Megaphone,
  orderLookup: Search,
  location: Map,
  reactions: ThumbsUp,
  templates: MessageSquareText,
};

export default function StepCapabilities({ watch, setValue }) {
  const t = useTranslations("agents");
  const selected = Array.isArray(watch("capabilities")) ? watch("capabilities") : [];

  const toggle = (id, checked) => {
    const next = checked
      ? [...new Set([...selected, id])]
      : selected.filter((capability) => capability !== id);
    setValue("capabilities", next, { shouldDirty: true });
  };

  return (
    <div className="space-y-2">
      {AGENT_CAPABILITIES.map((id) => {
        const Icon = CAPABILITY_ICONS[id] ?? Lock;
        return (
          <label
            key={id}
            className="flex items-start gap-3 p-3 cursor-pointer border border-border rounded-xl hover:bg-muted/50"
          >
            <Checkbox
              checked={selected.includes(id)}
              onCheckedChange={(checked) => toggle(id, checked === true)}
              className="mt-1"
            />
            <div className="w-9 h-9 rounded-[10px] bg-primary/10 flex items-center justify-center text-primary shrink-0">
              <Icon size={18} />
            </div>
            <div className="min-w-0">
              <p className="text-sm font-semibold text-foreground">
                {t(`wizard.capabilities.${id}.title`)}
              </p>
              <p className="text-xs text-muted-foreground">
                {t(`wizard.capabilities.${id}.desc`)}
              </p>
            </div>
          </label>
        );
      })}
    </div>
  );
}
