"use client";

import { Trash2 } from "lucide-react";
import { useTranslations } from "next-intl";
import { cn } from "@/utils/cn";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { AudienceFieldPicker } from "./AudienceFieldPicker";
import { AudienceRuleValue } from "./AudienceRuleValue";
import {
  addCondition,
  applyFieldToRule,
  countRules,
  defaultRuleValue,
  fieldMeta,
  flattenVisibleGroupNodes,
  groupHasDirectRules,
  isGroupNode,
  operatorNeedsValue,
  operatorsForValueType,
  removeNode,
  updateNode,
} from "./audience-filter.utils";

function LogicToggle({ value, onChange, disabled }) {
  const t = useTranslations("audienceFilter");
  return (
    <div className="ms-auto flex rounded-lg bg-muted p-0.5">
      {["AND", "OR"].map((logic) => (
        <button
          key={logic}
          type="button"
          disabled={disabled}
          onClick={() => onChange(logic)}
          className={cn(
            "rounded-md px-2.5 py-1 text-[11px] font-semibold",
            value === logic ? "bg-primary text-white" : "text-muted-foreground",
          )}
        >
          {logic === "AND" ? t("logicAnd") : t("logicOr")}
        </button>
      ))}
    </div>
  );
}

function RuleRow({ rule, root, metadata, lookups, lookupsLoading, disabled, onChange, valueError, hiddenFields }) {
  const t = useTranslations("audienceFilter");
  const meta = fieldMeta(metadata, rule.field);
  const operators = operatorsForValueType(meta?.valueType);

  return (
    <div className="grid grid-cols-1 md:grid-cols-[minmax(180px,1.3fr)_minmax(120px,0.8fr)_minmax(160px,1.1fr)_32px] gap-2 items-start">
      <AudienceFieldPicker
        value={rule.field}
        disabled={disabled}
        metadata={metadata}
        hiddenFields={hiddenFields}
        onChange={(field) => onChange(applyFieldToRule(root, metadata, rule._id, field))}
      />
      <Select
        value={rule.operator}
        disabled={disabled}
        onValueChange={(operator) =>
          onChange(
            updateNode(root, rule._id, {
              operator,
              value: operatorNeedsValue(operator)
                ? defaultRuleValue(metadata, rule.field, operator)
                : undefined,
            }),
          )
        }
      >
        <SelectTrigger className="h-10 rounded-md">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {operators.map((op) => (
            <SelectItem key={op} value={op}>
              {t(`operators.${op}`)}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      <div>
        <AudienceRuleValue
          field={rule.field}
          operator={rule.operator}
          value={rule.value}
          metadata={metadata}
          options={lookups}
          lookupsLoading={lookupsLoading}
          disabled={disabled}
          error={valueError}
          onChange={(value) => onChange(updateNode(root, rule._id, { value }))}
        />
        {valueError && operatorNeedsValue(rule.operator) && (
          <p className="text-xs text-red-500 mt-1">{t("valueRequired")}</p>
        )}
      </div>
      <button
        type="button"
        disabled={disabled}
        onClick={() => onChange(removeNode(root, rule._id))}
        className="h-10 w-8 inline-flex items-center justify-center text-destructive disabled:opacity-50"
        aria-label={t("removeCondition")}
      >
        <Trash2 size={16} />
      </button>
    </div>
  );
}

function GroupCard({ group, root, depth, isRoot, metadata, lookups, lookupsLoading, disabled, onChange, invalidRuleIds, hiddenFields }) {
  const t = useTranslations("audienceFilter");
  const visibleNodes = flattenVisibleGroupNodes(group.rules);
  const ruleNodes = visibleNodes.filter((node) => !isGroupNode(node));
  const groupNodes = visibleNodes.filter((node) => isGroupNode(node));
  const empty = !visibleNodes.length;
  const showShell = isRoot ? groupHasDirectRules(group) : true;

  const renderRules = () =>
    ruleNodes.map((node) => (
      <RuleRow
        key={node._id}
        rule={node}
        root={root}
        metadata={metadata}
        lookups={lookups}
        lookupsLoading={lookupsLoading}
        disabled={disabled}
        onChange={onChange}
        hiddenFields={hiddenFields}
        valueError={invalidRuleIds?.includes(node._id)}
      />
    ));

  const renderGroups = (depthOffset) =>
    groupNodes.map((node) => (
      <GroupCard
        key={node._id}
        group={node}
        root={root}
        depth={depthOffset}
        isRoot={false}
        metadata={metadata}
        lookups={lookups}
        lookupsLoading={lookupsLoading}
        disabled={disabled}
        onChange={onChange}
        hiddenFields={hiddenFields}
        invalidRuleIds={invalidRuleIds}
      />
    ));

  const renderBody = (groupDepth) => (
    <div className="flex flex-col">
      {ruleNodes.length ? <div className="flex flex-col gap-2">{renderRules()}</div> : null}
      {groupNodes.length ? (
        <div className={cn("flex flex-col gap-2", ruleNodes.length && "mt-4")}>{renderGroups(groupDepth)}</div>
      ) : null}
    </div>
  );

  const addButton = isRoot ? (
    <div className={showShell ? "px-3 pb-3" : ""}>
      <AudienceFieldPicker
        variant="add"
        value={null}
        disabled={disabled}
        metadata={metadata}
        hiddenFields={hiddenFields}
        onChange={(field) => onChange(addCondition(root, metadata, group, field))}
      />
    </div>
  ) : null;

  if (!showShell) {
    return (
      <div className="space-y-3">
        {empty ? (
          <div className="rounded-lg border border-dashed border-border px-3 py-5 text-center text-sm text-muted-foreground">
            {t("emptyRules")}
          </div>
        ) : (
          renderBody(0)
        )}
        {addButton}
      </div>
    );
  }

  return (
    <div
      className={cn(
        "relative rounded-xl border border-border bg-card",
        depth > 0 && "ms-5",
      )}
    >
      {depth > 0 && (
        <div className="absolute -start-3 top-4 bottom-4 w-0.5 bg-primary/20" />
      )}
      <div className="flex items-center gap-3 border-b border-border bg-muted/40 px-3 py-2.5 rounded-t-xl">
        <div className="grid h-8 w-8 place-items-center rounded-lg bg-primary/10 text-xs font-extrabold text-primary">
          {t(`entityShort.${group.entity}`)}
        </div>
        <div className="min-w-0">
          <div className="text-sm font-bold">{t(`entities.${group.entity}`)}</div>
          <div className="text-[11px] text-muted-foreground">{t(`entityHints.${group.entity}`)}</div>
        </div>
        <LogicToggle
          value={group.logic}
          disabled={disabled}
          onChange={(logic) => onChange(updateNode(root, group._id, { logic }))}
        />
        {!isRoot && (
          <button
            type="button"
            disabled={disabled}
            onClick={() => onChange(removeNode(root, group._id))}
            className="text-muted-foreground hover:text-destructive disabled:opacity-50"
            aria-label={t("removeGroup")}
          >
            <Trash2 size={16} />
          </button>
        )}
      </div>
      <div className="p-3">
        {empty ? (
          <div className="rounded-lg border border-dashed border-border px-3 py-5 text-center text-sm text-muted-foreground">
            {t("emptyRules")}
          </div>
        ) : (
          renderBody(depth + 1)
        )}
      </div>
      {addButton}
    </div>
  );
}

export function AudienceFilterBuilder({
  value,
  onChange,
  disabled = false,
  metadata,
  lookups = {},
  lookupsLoading = {},
  invalidRuleIds = [],
  hiddenFields = [],
}) {
  const t = useTranslations("audienceFilter");
  if (!metadata) {
    return <div className="text-sm text-muted-foreground">{t("loadingMetadata")}</div>;
  }

  return (
    <div className="space-y-3">
      <div>
        <h2 className="text-base font-semibold">{t("title")}</h2>
        <p className="text-xs text-muted-foreground">{t("subtitle")}</p>
      </div>
      <GroupCard
        group={value}
        root={value}
        depth={0}
        isRoot
        metadata={metadata}
        lookups={lookups}
        lookupsLoading={lookupsLoading}
        disabled={disabled}
        onChange={onChange}
        invalidRuleIds={invalidRuleIds}
        hiddenFields={hiddenFields}
      />
      {countRules(value) === 0 ? (
        <p className="text-xs text-red-500">{t("rulesMin")}</p>
      ) : null}
    </div>
  );
}
