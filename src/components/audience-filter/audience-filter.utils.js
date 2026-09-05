import { CLIENT_PERCENT_FROM, PERCENT_FIELDS } from "@/app/[locale]/tags/atoms/condition-fields";

export function newNodeId() {
  return typeof crypto !== "undefined" && crypto.randomUUID
    ? crypto.randomUUID()
    : `n_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
}

export function emptyAudienceFilter() {
  return {
    _id: newNodeId(),
    entity: "client",
    rootEntity: "client",
    logic: "AND",
    rules: [],
  };
}

export function isGroupNode(node) {
  return Boolean(node && Array.isArray(node.rules));
}

export function groupHasDirectRules(group) {
  return (group?.rules || []).some((node) => !isGroupNode(node));
}

/** Skip relation shells that only exist to nest a deeper entity (e.g. order → item → variant). */
export function flattenVisibleGroupNodes(nodes) {
  const out = [];
  for (const node of nodes || []) {
    if (!isGroupNode(node)) {
      out.push(node);
      continue;
    }
    if (groupHasDirectRules(node)) {
      out.push(node);
      continue;
    }
    out.push(...flattenVisibleGroupNodes(node.rules));
  }
  const rules = out.filter((node) => !isGroupNode(node));
  const groups = out.filter((node) => isGroupNode(node));
  return [...rules, ...groups];
}

export function cloneFilter(tree) {
  return JSON.parse(JSON.stringify(tree || emptyAudienceFilter()));
}

export function withNodeIds(node) {
  if (!node) return emptyAudienceFilter();
  if (isGroupNode(node)) {
    return {
      ...node,
      _id: node._id || newNodeId(),
      entity: node.entity || "client",
      logic: node.logic === "OR" ? "OR" : "AND",
      rules: (node.rules || []).map(withNodeIds),
    };
  }
  return { ...node, _id: node._id || newNodeId() };
}

export function fromApiFilter(filter) {
  const next = withNodeIds(filter || emptyAudienceFilter());
  next.entity = "client";
  next.rootEntity = "client";
  return next;
}

export function toApiFilter(node) {
  if (!node) return emptyAudienceFilter();
  if (isGroupNode(node)) {
    const group = {
      entity: node.entity,
      logic: node.logic === "OR" ? "OR" : "AND",
      rules: (node.rules || []).map(toApiFilter),
    };
    if (node.entity === "client") group.rootEntity = "client";
    return group;
  }
  const rule = { field: node.field, operator: node.operator };
  if (operatorNeedsValue(node.operator)) rule.value = node.value;
  return rule;
}

export function operatorNeedsValue(operator) {
  return operator !== "is_null" && operator !== "is_not_null";
}

export function operatorsForValueType(valueType) {
  if (valueType === "number" || valueType === "date") {
    return ["eq", "neq", "gte", "lte", "is_null", "is_not_null"];
  }
  if (valueType === "boolean") return ["eq", "neq"];
  return ["eq", "neq", "in", "not_in", "is_null", "is_not_null"];
}

export function metadataIndex(metadata) {
  const entities = new Map();
  const fields = new Map();
  for (const entity of metadata?.entities || []) {
    entities.set(entity.entity, entity);
    for (const field of entity.fields || []) {
      fields.set(field.field, { ...field, entity: entity.entity });
    }
  }
  return { entities, fields, rootEntity: metadata?.rootEntity || "client" };
}

export function fieldMeta(metadata, field) {
  return metadataIndex(metadata).fields.get(field) || null;
}

export function entityOfField(metadata, field) {
  return fieldMeta(metadata, field)?.entity || String(field || "").split(".")[0] || "client";
}

export function countRules(node) {
  if (!node) return 0;
  if (!isGroupNode(node)) return node.field ? 1 : 0;
  return (node.rules || []).reduce((sum, child) => sum + countRules(child), 0);
}

export function locateNode(root, id, parent = null) {
  if (!root) return null;
  if (root._id === id) return { node: root, parent };
  if (!isGroupNode(root)) return null;
  for (const child of root.rules || []) {
    if (child._id === id) return { node: child, parent: root };
    const nested = locateNode(child, id, root);
    if (nested) return nested;
  }
  return null;
}

export function pathBetween(metadata, from, to) {
  if (from === to) return [];
  const { entities } = metadataIndex(metadata);
  const queue = [[from, []]];
  const seen = new Set([from]);
  while (queue.length) {
    const [entity, path] = queue.shift();
    for (const child of entities.get(entity)?.children || []) {
      if (seen.has(child)) continue;
      const next = path.concat(child);
      if (child === to) return next;
      seen.add(child);
      queue.push([child, next]);
    }
  }
  return null;
}

function ensureChildGroup(parent, entity) {
  let group = (parent.rules || []).find((node) => isGroupNode(node) && node.entity === entity);
  if (!group) {
    group = { _id: newNodeId(), entity, logic: "AND", rules: [] };
    parent.rules = [...(parent.rules || []), group];
  }
  return group;
}

export function placeGroup(root, metadata, hintGroup, targetEntity) {
  let group = hintGroup || root;
  let found = locateNode(root, group._id);
  while (pathBetween(metadata, group.entity, targetEntity) === null && found?.parent) {
    group = found.parent;
    found = locateNode(root, group._id);
  }
  if (group.entity === targetEntity) return group;
  const path = pathBetween(metadata, group.entity, targetEntity);
  if (!path) return root;
  path.forEach((entity) => {
    group = ensureChildGroup(group, entity);
  });
  return group;
}

export function pruneEmptyGroups(group, isRoot = true) {
  if (!isGroupNode(group)) return group;
  group.rules = (group.rules || [])
    .map((child) => (isGroupNode(child) ? pruneEmptyGroups(child, false) : child))
    .filter((child) => {
      if (!isGroupNode(child)) return true;
      return (child.rules || []).length > 0;
    });
  return group;
}

export function defaultRuleValue(metadata, field, operator) {
  const meta = fieldMeta(metadata, field);
  if (!operatorNeedsValue(operator)) return undefined;
  if (operator === "in" || operator === "not_in") return [];
  if (meta?.valueType === "boolean") return "true";
  return "";
}

export function defaultOperator(metadata, field) {
  const meta = fieldMeta(metadata, field);
  return operatorsForValueType(meta?.valueType)[0] || "eq";
}

export function newRule(metadata, field) {
  const operator = defaultOperator(metadata, field);
  return {
    _id: newNodeId(),
    field,
    operator,
    value: defaultRuleValue(metadata, field, operator),
  };
}

export function addCondition(root, metadata, hintGroup, field) {
  const next = cloneFilter(root);
  const hint = hintGroup ? locateNode(next, hintGroup._id)?.node : next;
  const dest = placeGroup(next, metadata, hint || next, entityOfField(metadata, field));
  dest.rules = [...(dest.rules || []), newRule(metadata, field)];
  return next;
}

export function applyFieldToRule(root, metadata, ruleId, field) {
  const next = cloneFilter(root);
  const found = locateNode(next, ruleId);
  if (!found?.parent || !found.node.field) return next;
  const operator = defaultOperator(metadata, field);
  found.node.field = field;
  found.node.operator = operator;
  found.node.value = defaultRuleValue(metadata, field, operator);
  const dest = placeGroup(next, metadata, found.parent, entityOfField(metadata, field));
  if (dest !== found.parent) {
    found.parent.rules = found.parent.rules.filter((node) => node._id !== ruleId);
    dest.rules = [...(dest.rules || []), found.node];
  }
  pruneEmptyGroups(next, true);
  return next;
}

export function updateNode(root, id, patch) {
  const next = cloneFilter(root);
  const found = locateNode(next, id);
  if (!found?.node) return next;
  Object.assign(found.node, patch);
  return next;
}

export function removeNode(root, id) {
  const next = cloneFilter(root);
  const found = locateNode(next, id);
  if (!found?.parent) return next;
  found.parent.rules = found.parent.rules.filter((node) => node._id !== id);
  pruneEmptyGroups(next, true);
  return next;
}

export function walkRules(node, fn) {
  if (!node) return;
  if (isGroupNode(node)) {
    (node.rules || []).forEach((child) => walkRules(child, fn));
    return;
  }
  fn(node);
}

export function collectRuleFields(tree) {
  const fields = [];
  walkRules(tree, (rule) => {
    if (rule?.field) fields.push(rule.field);
  });
  return fields;
}

export function ruleValueMissing(rule) {
  if (!rule || !operatorNeedsValue(rule.operator)) return false;
  const value = rule.value;
  if (Array.isArray(value)) return value.length === 0;
  if (value === 0 || value === false) return false;
  return value === undefined || value === null || String(value).trim() === "";
}

export function collectInvalidRuleIds(tree) {
  const ids = [];
  walkRules(tree, (rule) => {
    if (ruleValueMissing(rule) && rule._id) ids.push(rule._id);
  });
  return ids;
}

export function audienceFilterIsValid(tree) {
  return countRules(tree) >= 1 && collectInvalidRuleIds(tree).length === 0;
}

export function entityPath(metadata, target) {
  const chain = [];
  const walk = (from, acc) => {
    if (from === target) {
      chain.push(...acc, from);
      return true;
    }
    return (metadataIndex(metadata).entities.get(from)?.children || []).some((child) =>
      walk(child, acc.concat(from)),
    );
  };
  walk(metadata?.rootEntity || "client", []);
  return chain.length ? chain : [target];
}

export function isPercentField(field) {
  return PERCENT_FIELDS.has(field) || /Percent|Rate/.test(String(field || ""));
}

export function percentFromKey(field) {
  return CLIENT_PERCENT_FROM[field] || "";
}

export function parseRuleValueForApi(metadata, field, operator, raw) {
  if (!operatorNeedsValue(operator)) return undefined;
  const meta = fieldMeta(metadata, field);
  const type = meta?.valueType;
  const coerce = (part) => {
    if (type === "boolean") return part === true || part === "true";
    if (type === "number") {
      const n = Number(part);
      if (!Number.isFinite(n)) return 0;
      if (isPercentField(field)) return Math.min(100, Math.max(0, n));
      return n;
    }
    return part;
  };
  if (operator === "in" || operator === "not_in") {
    const list = Array.isArray(raw)
      ? raw
      : String(raw ?? "")
          .split(",")
          .map((part) => part.trim())
          .filter(Boolean);
    return list.map(coerce);
  }
  return coerce(raw);
}

export function serializeAudienceFilter(tree, metadata) {
  const mapNode = (node) => {
    if (isGroupNode(node)) {
      const group = {
        entity: node.entity,
        logic: node.logic === "OR" ? "OR" : "AND",
        rules: (node.rules || []).map(mapNode),
      };
      if (node.entity === "client") group.rootEntity = "client";
      return group;
    }
    const rule = { field: node.field, operator: node.operator };
    if (operatorNeedsValue(node.operator)) {
      rule.value = parseRuleValueForApi(metadata, node.field, node.operator, node.value);
    }
    return rule;
  };
  return mapNode(tree);
}
