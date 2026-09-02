"use client";

import { useCallback, useMemo, useState } from "react";
import { useTranslations } from "next-intl";
import {
  Activity,
  CheckCircle2,
  ChevronDown,
  ChevronRight,
  DollarSign,
  Hash,
  MapPin,
  Package,
  Percent,
  Phone,
  Repeat,
  Store,
  Tag,
  Truck,
  User,
} from "lucide-react";
import { cn } from "@/utils/cn";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { CONDITION_FIELDS, CLIENT_CONDITION_FIELDS, CLIENT_PERCENT_FROM } from "./condition-fields";

const FIELD_ICONS = {
  "order.statusId": Activity,
  "order.isConfirmed": Activity,
  "order.confirmationSource": Activity,
  "order.storeId": Store,
  "order.shippingCompanyId": Truck,
  "order.cityId": MapPin,
  "order.productsTotal": DollarSign,
  "order.finalTotal": DollarSign,
  "order.discount": Percent,
  "order.itemsQuantity": Package,
  "order.productsCount": Hash,
  "order.paymentStatus": Activity,
  "order.paymentMethod": Tag,
  "order.allowOpenPackage": Package,
  "order.duplicateCount": Repeat,
  "order.phone.valid": Phone,
  "assignment.contactTries": User,
  "assignment.hasActive": User,
  "shipment.status": Truck,
  "client.totalOrders": Hash,
  "client.confirmedCount": CheckCircle2,
  "client.confirmedPercent": Percent,
  "client.confirmedRate": Percent,
  "client.shippedCount": Truck,
  "client.shippedPercent": Percent,
  "client.deliveredCount": Package,
  "client.deliveredPercent": Percent,
  "client.returnedCount": Repeat,
  "client.returnedPercent": Percent,
  "client.cancelledCount": Activity,
  "client.cancelRate": Percent,
  "client.cancelledBeforeShippingCount": Activity,
  "client.beforeShippingCancelRate": Percent,
  "client.cancelledAfterShippingCount": Activity,
  "client.afterShippingCancelRate": Percent,
  "client.totalSales": DollarSign,
  "client.deliveredRevenue": DollarSign,
  "client.afterShippingCancelRateOfShipped": Percent,
};

function PlusIcon({ size, className }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
    >
      <path d="M5 12h14" />
      <path d="M12 5v14" />
    </svg>
  );
}

export function ConditionFieldPicker({
  value,
  onChange,
  disabled,
  ns = "tags",
  includeClientFields = false,
}) {
  const tPage = useTranslations(ns);
  const tOrder = useTranslations("tags");
  const tProps = useTranslations("whatsApp.automations.builder.orderProperties");
  const [open, setOpen] = useState(false);
  const [expanded, setExpanded] = useState({
    orderData: !includeClientFields,
    customerStats: !!includeClientFields,
  });

  const fieldLabel = useCallback(
    (field) =>
      String(field).startsWith("client.")
        ? tPage(`fields.${field}`)
        : tOrder(`fields.${field}`),
    [tOrder, tPage],
  );
  const fieldFrom = useCallback(
    (field) => {
      const fromKey = CLIENT_PERCENT_FROM[field];
      if (!fromKey) return "";
      return tPage(`from.${fromKey}`);
    },
    [tPage],
  );
  const fieldExample = useCallback(
    (field) =>
      String(field).startsWith("client.")
        ? tPage(`examples.${field}`)
        : tOrder(`examples.${field}`),
    [tOrder, tPage],
  );

  const tree = useMemo(() => {
    const groups = [
      {
        id: "orderData",
        label: tProps("orderData"),
        icon: Package,
        children: CONDITION_FIELDS.map((field) => ({
          id: field,
          path: field,
          label: fieldLabel(field),
          example: fieldExample(field),
          icon: FIELD_ICONS[field] || Tag,
        })),
      },
    ];
    if (includeClientFields) {
      groups.push({
        id: "customerStats",
        label: tPage("fieldGroups.customerStats"),
        icon: User,
        children: CLIENT_CONDITION_FIELDS.map((field) => ({
          id: field,
          path: field,
          label: fieldLabel(field),
          example: fieldExample(field),
          from: fieldFrom(field),
          icon: FIELD_ICONS[field] || Tag,
        })),
      });
    }
    return groups;
  }, [fieldExample, fieldFrom, fieldLabel, includeClientFields, tPage, tProps]);

  const selectedPath = useMemo(() => {
    if (!value) return [];
    for (const group of tree) {
      const leaf = group.children?.find((child) => child.id === value);
      if (leaf) {
        return leaf.from
          ? [group.label, leaf.label, leaf.from]
          : [group.label, leaf.label];
      }
    }
    return [];
  }, [tree, value]);

  const toggleExpand = useCallback((id) => {
    setExpanded((prev) => ({ ...prev, [id]: !prev[id] }));
  }, []);

  const handleNodeClick = useCallback(
    (node) => {
      if (node.children?.length) {
        toggleExpand(node.id);
        return;
      }
      onChange(node.id);
      setOpen(false);
    },
    [onChange, toggleExpand],
  );

  const renderNode = useCallback(
    (node, level = 0) => {
      const hasChildren = node.children && node.children.length > 0;
      const isExpanded = expanded[node.id];
      const isSelected = !hasChildren && node.id === value;
      const Icon = node.icon;

      return (
        <div key={node.id} className="select-none">
          <div
            onClick={() => handleNodeClick(node)}
            className={cn(
              "flex items-center gap-3 p-3 rounded-xl transition-all cursor-pointer group",
              level > 0 ? "ms-6" : "",
              hasChildren
                ? "hover:bg-slate-50 dark:hover:bg-slate-800/50"
                : "hover:bg-primary/5 hover:text-primary",
              isSelected && "bg-primary/5 text-primary",
            )}
          >
            <div className="flex items-center gap-2 flex-1 min-w-0">
              {hasChildren ? (
                isExpanded ? (
                  <ChevronDown size={16} className="text-slate-400" />
                ) : (
                  <ChevronRight size={16} className="text-slate-400 rtl:rotate-180" />
                )
              ) : (
                <div className="w-4 h-4" />
              )}
              {Icon ? (
                <Icon
                  size={18}
                  className={cn("shrink-0", hasChildren ? "text-slate-400" : "text-primary")}
                />
              ) : null}
              <span className="text-sm font-bold truncate">{node.label}</span>
              {!hasChildren && node.from && (
                <span className="text-[10px] text-slate-400 font-medium truncate">
                  ({node.from})
                </span>
              )}
              {!hasChildren && node.example && (
                <span className="text-[10px] text-slate-400 font-medium truncate">
                  ({node.example})
                </span>
              )}
            </div>
            {!hasChildren && (
              <div className="opacity-0 group-hover:opacity-100 transition-opacity">
                <PlusIcon size={16} className="text-primary" />
              </div>
            )}
          </div>
          {hasChildren && isExpanded && (
            <div className="mt-1">
              {node.children.map((child) => renderNode(child, level + 1))}
            </div>
          )}
        </div>
      );
    },
    [expanded, handleNodeClick, value],
  );

  return (
    <Popover modal open={open && !disabled} onOpenChange={(next) => !disabled && setOpen(next)}>
      <PopoverTrigger asChild>
        <button
          type="button"
          disabled={disabled}
          className="relative h-10 w-full rounded-md border border-border bg-background px-3 pe-8 text-sm text-start disabled:opacity-60"
        >
          {selectedPath.length ? (
            <span className="flex items-center gap-1.5 min-w-0">
              {selectedPath.map((part, index) => (
                <span key={`${part}-${index}`} className="flex items-center gap-1.5 min-w-0">
                  {index > 0 && (
                    <ChevronRight
                      size={14}
                      className="shrink-0 text-muted-foreground rtl:rotate-180"
                    />
                  )}
                  <span
                    className={cn(
                      "truncate",
                      index === selectedPath.length - 1
                        ? "font-medium text-foreground"
                        : "text-muted-foreground",
                    )}
                  >
                    {part}
                  </span>
                </span>
              ))}
            </span>
          ) : (
            <span className="text-muted-foreground">{tPage("dialog.selectField")}</span>
          )}
          <ChevronDown
            size={14}
            className="absolute end-3 top-1/2 -translate-y-1/2 opacity-60"
          />
        </button>
      </PopoverTrigger>
      <PopoverContent
        align="start"
        className="p-0 w-[550px] overflow-hidden z-[80]"
        onWheel={(event) => event.stopPropagation()}
        onTouchMove={(event) => event.stopPropagation()}
      >
        <div className="max-h-[min(500px,70vh)] overflow-y-auto overscroll-contain p-2">
          <div className="space-y-1">{tree.map((node) => renderNode(node))}</div>
        </div>
      </PopoverContent>
    </Popover>
  );
}
