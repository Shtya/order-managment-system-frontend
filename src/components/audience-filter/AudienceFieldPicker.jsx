"use client";

import { useCallback, useMemo, useState } from "react";
import { useTranslations } from "next-intl";
import {
  Activity,
  Box,
  CheckCircle2,
  ChevronDown,
  ChevronRight,
  DollarSign,
  Hash,
  MapPin,
  Package,
  Percent,
  Phone,
  Plus,
  Repeat,
  Store,
  Tag,
  Truck,
  User,
} from "lucide-react";
import { cn } from "@/utils/cn";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Input } from "@/components/ui/input";
import {
  entityPath,
  fieldMeta,
  metadataIndex,
  percentFromKey,
} from "./audience-filter.utils";

const FIELD_ICONS = {
  "order.statusId": Activity,
  "order.isConfirmed": Activity,
  "order.confirmationSource": Activity,
  "order.storeId": Store,
  "order.shippingCompanyId": Truck,
  "order.cityId": MapPin,
  "order.finalTotal": DollarSign,
  "order.productsTotal": DollarSign,
  "order.discount": Percent,
  "order.itemsQuantity": Package,
  "order.phone.valid": Phone,
  "assignment.contactTries": User,
  "assignment.hasActive": User,
  "shipment.status": Truck,
  "client.totalOrders": Hash,
  "client.tagId": Tag,
  "client.confirmedCount": CheckCircle2,
  "product.categoryId": Box,
};

const ENTITY_ICONS = {
  client: User,
  order: Package,
  order_item: Box,
  variant: Tag,
  product: Package,
  assignment: User,
  shipment: Truck,
  upsell: Repeat,
};

function safeT(t, key, fallback = "") {
  if (!key) return fallback;
  try {
    if (typeof t.has === "function" && !t.has(key)) return fallback;
    const value = t(key);
    return value === key ? fallback : value;
  } catch {
    return fallback;
  }
}

export function AudienceFieldPicker({
  value,
  onChange,
  disabled,
  metadata,
  placeholder,
  variant = "field",
  hiddenFields = [],
}) {
  const t = useTranslations("audienceFilter");
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [expanded, setExpanded] = useState({ client: true });
  const index = useMemo(() => metadataIndex(metadata), [metadata]);
  const hiddenSet = useMemo(() => new Set(hiddenFields || []), [hiddenFields]);

  const labelForField = useCallback(
    (field) => safeT(t, `fields.${field}`, field),
    [t],
  );
  const labelForEntity = useCallback(
    (entity) => safeT(t, `entities.${entity}`, entity),
    [t],
  );

  const selectedPath = useMemo(() => {
    if (!value) return [];
    const entity = fieldMeta(metadata, value)?.entity;
    const parts = entityPath(metadata, entity).map(labelForEntity);
    parts.push(labelForField(value));
    return parts;
  }, [labelForEntity, labelForField, metadata, value]);

  const matchesQuery = useCallback(
    (text) => {
      const q = query.trim();
      if (!q) return true;
      return String(text || "").toLowerCase().includes(q.toLowerCase());
    },
    [query],
  );

  const entityHasMatch = useCallback(
    (entityKey) => {
      const entity = index.entities.get(entityKey);
      if (!entity) return false;
      if (matchesQuery(labelForEntity(entityKey))) return true;
      if ((entity.fields || []).some((field) => {
        if (hiddenSet.has(field.field)) return false;
        const fromKey = percentFromKey(field.field);
        return (
          matchesQuery(field.field) ||
          matchesQuery(labelForField(field.field)) ||
          matchesQuery(safeT(t, `examples.${field.field}`)) ||
          matchesQuery(fromKey ? safeT(t, `from.${fromKey}`) : "")
        );
      })) return true;
      return (entity.children || []).some((child) => entityHasMatch(child));
    },
    [hiddenSet, index.entities, labelForEntity, labelForField, matchesQuery, t],
  );

  const handleNodeClick = useCallback(
    (node) => {
      if (node.children) {
        setExpanded((prev) => ({ ...prev, [node.id]: !prev[node.id] }));
        return;
      }
      onChange?.(node.id);
      setOpen(false);
      setQuery("");
    },
    [onChange],
  );

  const renderEntity = (entityKey, level = 0) => {
    const entity = index.entities.get(entityKey);
    if (!entity || !entityHasMatch(entityKey)) return null;
    const isOpen = Boolean(query.trim()) || expanded[entityKey];
    const Icon = ENTITY_ICONS[entityKey] || Tag;
    const visibleFields = (entity.fields || []).filter((field) => {
      if (hiddenSet.has(field.field)) return false;
      const fromKey = percentFromKey(field.field);
      const from = fromKey ? safeT(t, `from.${fromKey}`) : "";
      const example = safeT(t, `examples.${field.field}`);
      if (!query.trim()) return true;
      return (
        matchesQuery(field.field) ||
        matchesQuery(labelForField(field.field)) ||
        matchesQuery(from) ||
        matchesQuery(example)
      );
    });
    const visibleChildren = (entity.children || []).filter((child) => entityHasMatch(child));
    return (
      <div key={entityKey} className="select-none">
        <div
          onClick={() => handleNodeClick({ id: entityKey, children: true })}
          className={cn(
            "flex items-center gap-2 py-2 px-2 rounded-lg transition-all cursor-pointer group",
            "hover:bg-slate-50 dark:hover:bg-slate-800/50",
          )}
        >
          {isOpen ? (
            <ChevronDown size={16} className="text-slate-400 shrink-0" />
          ) : (
            <ChevronRight size={16} className="text-slate-400 shrink-0 rtl:rotate-180" />
          )}
          <Icon size={18} className="shrink-0 text-slate-400" />
          <span className="text-sm font-bold truncate">{labelForEntity(entityKey)}</span>
        </div>
        {isOpen && (
          <div className="ms-3 ps-3 border-s-2 border-slate-200 dark:border-slate-700 space-y-0.5">
            {visibleFields.map((field) => {
              const fromKey = percentFromKey(field.field);
              const from = fromKey ? safeT(t, `from.${fromKey}`) : "";
              const example = safeT(t, `examples.${field.field}`);
              const FieldIcon = FIELD_ICONS[field.field] || Tag;
              const selected = field.field === value;
              return (
                <div
                  key={field.field}
                  onClick={() => handleNodeClick({ id: field.field })}
                  className={cn(
                    "flex items-center gap-2 py-2 px-2 rounded-lg transition-all cursor-pointer group",
                    "hover:bg-primary/5 hover:text-primary",
                    selected && "bg-primary/5 text-primary",
                  )}
                >
                  <div className="w-1.5 h-1.5 rounded-full bg-slate-300 dark:bg-slate-600 shrink-0" />
                  <FieldIcon size={16} className="shrink-0 text-primary" />
                  <span className="text-sm font-semibold truncate">{labelForField(field.field)}</span>
                  {from ? (
                    <span className="text-[10px] text-slate-400 font-medium truncate">({from})</span>
                  ) : null}
                  {example ? (
                    <span className="text-[10px] text-slate-400 font-medium truncate">({example})</span>
                  ) : null}
                  <div className="ms-auto opacity-0 group-hover:opacity-100 transition-opacity">
                    <Plus size={16} className="text-primary" />
                  </div>
                </div>
              );
            })}
            {visibleChildren.map((child) => renderEntity(child, level + 1))}
          </div>
        )}
      </div>
    );
  };

  return (
    <Popover modal open={open && !disabled} onOpenChange={(next) => !disabled && setOpen(next)}>
      <PopoverTrigger asChild>
        {variant === "add" ? (
          <button
            type="button"
            disabled={disabled}
            className="inline-flex items-center gap-1.5 rounded-md border border-dashed border-primary/40 bg-primary/5 px-3 py-2 text-sm font-semibold text-primary disabled:opacity-60"
          >
            <Plus size={14} />
            {placeholder || t("addCondition")}
          </button>
        ) : (
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
                      <ChevronRight size={14} className="shrink-0 text-muted-foreground rtl:rotate-180" />
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
              <span className="text-muted-foreground">{placeholder || t("selectField")}</span>
            )}
            <ChevronDown size={14} className="absolute end-3 top-1/2 -translate-y-1/2 opacity-60" />
          </button>
        )}
      </PopoverTrigger>
      <PopoverContent
        align="start"
        className="p-0 w-[min(550px,92vw)] overflow-hidden z-[80]"
        onWheel={(event) => event.stopPropagation()}
        onTouchMove={(event) => event.stopPropagation()}
      >
        <div className="p-2 border-b border-border">
          <Input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder={t("searchFields")}
          />
        </div>
        <div className="max-h-[min(500px,70vh)] overflow-y-auto overscroll-contain p-2">
          {renderEntity(index.rootEntity)}
        </div>
      </PopoverContent>
    </Popover>
  );
}
