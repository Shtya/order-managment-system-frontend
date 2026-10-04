"use client";

import { useEffect } from "react";
import { useTranslations } from "next-intl";
import {
  CalendarClock,
  CheckCircle2,
  FolderTree,
  ListOrdered,
  Mail,
  Map,
  MapPin,
  Megaphone,
  MessageSquareText,
  Headphones,
  Package,
  Pencil,
  Plus,
  Repeat,
  Search,
  ShoppingCart,
  Star,
  ThumbsUp,
  Trash2,
  User,
  XCircle,
  Play,
} from "lucide-react";
import { Switch } from "@/components/ui/switch";
import { cn } from "@/utils/cn";
import {
  AGENT_CAPABILITIES,
  capabilityClosure,
  requiredByCapabilities,
} from "./agentWizardSchema";
import IssueAssignmentFields from "@/app/[locale]/issues/atoms/IssueAssignmentFields";
import { useIssueAssignmentOptions } from "@/hook/useIssues";

const CAPABILITY_ICONS = {
  searchProducts: Search,
  getProductDetails: Package,
  searchBundles: Search,
  getBundleDetails: Package,
  listCategories: FolderTree,
  createOrder: ShoppingCart,
  campaignOrders: Megaphone,
  getMyOrders: ListOrdered,
  getOrderDetails: ListOrdered,
  addOrderItems: Plus,
  replaceOrderItems: Repeat,
  updateOrderItems: Pencil,
  updateOrderInfo: Pencil,
  cancelOrder: XCircle,
  postponeOrder: CalendarClock,
  confirmOrder: CheckCircle2,
  addCustomerAddress: Plus,
  updateCustomerAddress: Pencil,
  removeCustomerAddress: Trash2,
  setDefaultAddress: Star,
  getMyAddresses: MapPin,
  getCities: Map,
  getAreasByCity: MapPin,
  updateCustomer: User,
  location: Map,
  reactions: ThumbsUp,
  templates: MessageSquareText,
  humanHandoff: Headphones,
  resumeAutomationChoice: Play,
};

const TINTS = [
  "bg-emerald-100 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400",
  "bg-violet-100 text-violet-600 dark:bg-violet-900/30 dark:text-violet-400",
  "bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400",
  "bg-amber-100 text-amber-600 dark:bg-amber-900/30 dark:text-amber-400",
  "bg-rose-100 text-rose-600 dark:bg-rose-900/30 dark:text-rose-400",
  "bg-cyan-100 text-cyan-600 dark:bg-cyan-900/30 dark:text-cyan-400",
  "bg-orange-100 text-orange-600 dark:bg-orange-900/30 dark:text-orange-400",
];

function sameCapabilitySet(a, b) {
  if (a.length !== b.length) return false;
  const set = new Set(a);
  return b.every((id) => set.has(id));
}

export default function StepCapabilities({ control, watch, setValue, errors }) {
  const t = useTranslations("agents");
  const raw = Array.isArray(watch("capabilities")) ? watch("capabilities") : [];
  const selected = capabilityClosure(raw);
  const { roles, users, statuses } = useIssueAssignmentOptions();
  const employeeIds = Array.isArray(watch("handoffEmployeeIds"))
    ? watch("handoffEmployeeIds")
    : [];
  const handoffOn = selected.includes("humanHandoff");
  const openStatusId = statuses.find((s) => s.code === "open")?.id || "";

  const roleId = watch("handoffAssignedRoleId");
  const statusId = watch("handoffStatusId");

  useEffect(() => {
    if (sameCapabilitySet(raw, selected)) return;
    setValue("capabilities", selected, { shouldDirty: false });
  }, [raw, selected, setValue]);

  useEffect(() => {
    if (!handoffOn || statusId || !openStatusId) return;
    setValue("handoffStatusId", openStatusId, { shouldDirty: false });
  }, [handoffOn, openStatusId, setValue, statusId]);

  useEffect(() => {
    if (!roleId) return;
    const roleUsers = new Set(
      users.filter((u) => u.roleId === roleId).map((u) => u.id),
    );
    const next = employeeIds.filter((id) => roleUsers.has(id));
    if (next.length !== employeeIds.length) {
      setValue("handoffEmployeeIds", next, { shouldDirty: true });
    }
  }, [employeeIds, roleId, setValue, users]);

  const toggle = (id, checked, locked) => {
    if (locked && !checked) return;
    const next = checked
      ? capabilityClosure([...selected, id])
      : selected.filter((capability) => capability !== id);
    setValue("capabilities", next, { shouldDirty: true });
  };

  const toggleEmployee = (id) => {
    const next = employeeIds.includes(id)
      ? employeeIds.filter((x) => x !== id)
      : [...employeeIds, id];
    setValue("handoffEmployeeIds", next, { shouldDirty: true });
  };

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-3">
      {AGENT_CAPABILITIES.map((id, index) => {
        const Icon = CAPABILITY_ICONS[id] ?? Mail;
        const checked = selected.includes(id);
        const requiredBy = requiredByCapabilities(id, selected);
        const locked = requiredBy.length > 0;
        const requiredTitles = requiredBy
          .map((cap) => t(`wizard.capabilities.${cap}.title`))
          .join(t("wizard.capabilityRequiredJoin"));
        const isHandoff = id === "humanHandoff";
        const Wrapper = isHandoff && checked ? "div" : "label";
        return (
          <Wrapper
            key={id}
            className={cn(
              "border rounded-lg p-3 transition-colors",
              isHandoff && checked ? "sm:col-span-2 xl:col-span-3" : "",
              !locked && !(isHandoff && checked) && "cursor-pointer",
              locked ? "cursor-not-allowed bg-muted/40" : " hover:bg-muted/50",
              checked ? "border-border" : "border-border opacity-80",
            )}
          >
            <div className="flex items-start justify-between gap-2">
              <div
                className={cn(
                  "w-8 h-8 rounded-lg flex items-center justify-center shrink-0",
                  TINTS[index % TINTS.length],
                )}
              >
                <Icon size={16} />
              </div>
              <Switch
                checked={checked}
                disabled={locked}
                onCheckedChange={(value) => toggle(id, value === true, locked)}
              />
            </div>
            <p className="mt-3 text-sm font-bold text-foreground">
              {t(`wizard.capabilities.${id}.title`)}
            </p>
            <p className="mt-1 text-xs text-muted-foreground line-clamp-3">
              {t(`wizard.capabilities.${id}.desc`)}
            </p>
            {locked ? (
              <p className="mt-2 text-xs font-medium text-amber-700 dark:text-amber-400">
                {t("wizard.capabilityRequiredFor", { titles: requiredTitles })}
              </p>
            ) : null}
            {isHandoff && checked ? (
              <div
                className="mt-4 pt-4 border-t border-dashed"
                onClick={(e) => e.preventDefault()}
              >
                <p className="text-xs text-muted-foreground mb-3">
                  {t("wizard.handoffConfigHint")}
                </p>
                <IssueAssignmentFields
                  control={control}
                  errors={errors}
                  options={{ statuses, roles, users }}
                  employeeIds={employeeIds}
                  onToggleEmployee={toggleEmployee}
                  requiredRole
                  fieldNames={{
                    assignedRoleId: "handoffAssignedRoleId",
                    estimatedMinutes: "handoffEstimatedMinutes",
                    priority: "handoffPriority",
                    statusId: "handoffStatusId",
                  }}
                />
              </div>
            ) : null}
          </Wrapper>
        );
      })}
    </div>
  );
}
