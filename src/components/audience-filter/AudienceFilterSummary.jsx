"use client";

import { useEffect, useMemo, useState } from "react";
import { ChevronRight } from "lucide-react";
import { useTranslations } from "next-intl";
import { cn } from "@/utils/cn";
import {
  entityPath,
  fieldMeta,
  flattenVisibleGroupNodes,
  groupHasDirectRules,
  isGroupNode,
  operatorNeedsValue,
  walkRules,
} from "./audience-filter.utils";
import { resolveAudienceEntityOptions, SEARCHABLE_AUDIENCE_FIELDS } from "./lookups";

function labelOrKey(t, key, fallback) {
  try {
    if (typeof t.has === "function" && !t.has(key)) return fallback;
    const value = t(key);
    return !value || value === key ? fallback : value;
  } catch {
    return fallback;
  }
}

function formatValue(rule, lookups) {
  if (!operatorNeedsValue(rule.operator)) return "";
  const raw = rule.value;
  const opts = lookups?.[rule.field] || [];
  const labelFor = (item) =>
    opts.find((opt) => String(opt.value) === String(item))?.label || String(item);
  if (Array.isArray(raw)) return raw.map(labelFor).join(", ");
  if (raw === undefined || raw === null || raw === "") return "";
  const text = String(raw);
  if (/^\d{4}-\d{2}-\d{2}/.test(text)) return text.slice(0, 10);
  return labelFor(raw);
}

function RuleSummary({ rule, metadata, lookups, t }) {
  const entity = fieldMeta(metadata, rule.field)?.entity;
  const parts = entityPath(metadata, entity).map((key) => labelOrKey(t, `entities.${key}`, key));
  parts.push(labelOrKey(t, `fields.${rule.field}`, rule.field));
  const op = labelOrKey(t, `operators.${rule.operator}`, rule.operator);
  const value = formatValue(rule, lookups);

  return (
    <div className="flex flex-wrap items-center gap-1.5 rounded-lg border border-border/70 bg-background/70 px-3 py-2 text-sm">
      {parts.map((part, index) => (
        <span key={`${part}-${index}`} className="flex items-center gap-1.5 min-w-0">
          {index > 0 && (
            <ChevronRight size={14} className="shrink-0 text-muted-foreground rtl:rotate-180" />
          )}
          <span
            className={cn(
              "truncate",
              index === parts.length - 1 ? "font-semibold text-foreground" : "text-muted-foreground",
            )}
          >
            {part}
          </span>
        </span>
      ))}
      <span className="rounded-md bg-primary/10 px-1.5 py-0.5 text-[11px] font-semibold text-primary">
        {op}
      </span>
      {value ? <span className="font-medium">{value}</span> : null}
    </div>
  );
}

function GroupSummary({ group, depth, isRoot = false, metadata, lookups, t }) {
  const visibleNodes = flattenVisibleGroupNodes(group.rules);
  const ruleNodes = visibleNodes.filter((node) => !isGroupNode(node));
  const groupNodes = visibleNodes.filter((node) => isGroupNode(node));
  const showShell = isRoot ? groupHasDirectRules(group) : true;

  const renderBody = (nextDepth) => (
    <div className="flex flex-col">
      {ruleNodes.length ? (
        <div className="flex flex-col gap-2">
          {ruleNodes.map((node) => (
            <RuleSummary
              key={node._id || node.field}
              rule={node}
              metadata={metadata}
              lookups={lookups}
              t={t}
            />
          ))}
        </div>
      ) : null}
      {groupNodes.length ? (
        <div className={cn("flex flex-col gap-2", ruleNodes.length && "mt-4")}>
          {groupNodes.map((node) => (
            <GroupSummary
              key={node._id || node.entity}
              group={node}
              depth={nextDepth}
              metadata={metadata}
              lookups={lookups}
              t={t}
            />
          ))}
        </div>
      ) : null}
    </div>
  );

  if (!showShell) {
    return (
      <div className="space-y-2">
        {visibleNodes.length ? (
          renderBody(0)
        ) : (
          <div className="text-xs text-muted-foreground">{t("emptyRules")}</div>
        )}
      </div>
    );
  }

  return (
    <div
      className={cn(
        "rounded-xl border border-border bg-card overflow-hidden",
        depth > 0 && "ms-4",
      )}
    >
      <div className="flex items-center gap-3 border-b border-border bg-muted/40 px-3 py-2">
        <div className="grid h-8 w-8 place-items-center rounded-lg bg-primary/10 text-xs font-extrabold text-primary">
          {labelOrKey(t, `entityShort.${group.entity}`, (group.entity || "?").slice(0, 1).toUpperCase())}
        </div>
        <div className="min-w-0">
          <div className="text-sm font-bold">{labelOrKey(t, `entities.${group.entity}`, group.entity)}</div>
          <div className="text-[11px] text-muted-foreground">
            {labelOrKey(t, `entityHints.${group.entity}`, "")}
          </div>
        </div>
        <span className="ms-auto rounded-md bg-primary px-2 py-1 text-[11px] font-semibold text-white">
          {group.logic === "OR" ? t("logicOr") : t("logicAnd")}
        </span>
      </div>
      <div className={cn("p-3", depth > 0 && "border-s-2 border-primary/20")}>
        {visibleNodes.length ? (
          renderBody(depth + 1)
        ) : (
          <div className="text-xs text-muted-foreground">{t("emptyRules")}</div>
        )}
      </div>
    </div>
  );
}

function collectSearchableIds(tree) {
  const byField = {};
  walkRules(tree, (rule) => {
    if (!SEARCHABLE_AUDIENCE_FIELDS[rule.field]) return;
    const values = Array.isArray(rule.value) ? rule.value : [rule.value];
    if (!byField[rule.field]) byField[rule.field] = [];
    byField[rule.field].push(...values.map(String).filter(Boolean));
  });
  return byField;
}

export function AudienceFilterSummary({ value, metadata, lookups = {} }) {
  const t = useTranslations("audienceFilter");
  const [resolved, setResolved] = useState({});
  const idMapKey = useMemo(() => JSON.stringify(collectSearchableIds(value)), [value]);

  useEffect(() => {
    let cancelled = false;
    const parsed = idMapKey ? JSON.parse(idMapKey) : {};
    (async () => {
      const next = {};
      await Promise.all(
        Object.entries(parsed).map(async ([field, ids]) => {
          const unique = [...new Set(ids)];
          if (!unique.length) return;
          next[field] = await resolveAudienceEntityOptions(field, unique);
        }),
      );
      if (!cancelled) setResolved(next);
    })();
    return () => {
      cancelled = true;
    };
  }, [idMapKey]);

  const mergedLookups = useMemo(
    () => ({ ...lookups, ...resolved }),
    [lookups, resolved],
  );

  if (!value) return null;
  return <GroupSummary group={value} depth={0} isRoot metadata={metadata} lookups={mergedLookups} t={t} />;
}
