export const MAX_RULES = 5;

export const DEFAULT_RULE = {
  field: "order.statusId",
  operator: "eq",
  value: "",
};

export const CONDITION_FIELDS = [
  "order.statusId",
  "order.isConfirmed",
  "order.confirmationSource",
  "order.storeId",
  "order.shippingCompanyId",
  "order.cityId",
  "order.productsTotal",
  "order.finalTotal",
  "order.itemsQuantity",
  "order.productsCount",
  "order.paymentStatus",
  "order.phone.valid",
  "assignment.contactTries",
  "assignment.hasActive",
  "shipment.status",
  "upsell.accepted",
];

export const OPERATORS = [
  "eq",
  "neq",
  "in",
  "not_in",
  "is_null",
  "is_not_null",
  "gte",
  "lte",
];

export const NUMBER_FIELDS = new Set([
  "order.productsTotal",
  "order.itemsQuantity",
  "order.productsCount",
  "order.finalTotal",
  "assignment.contactTries",
]);

export const BOOLEAN_FIELDS = new Set([
  "order.isConfirmed",
  "order.phone.valid",
  "upsell.accepted",
  "assignment.hasActive",
]);

export const LIST_FIELDS = new Set([
  "order.statusId",
  "order.storeId",
  "order.cityId",
  "order.paymentStatus",
  "order.shippingCompanyId",
  "order.confirmationSource",
  "shipment.status",
]);

export const CONFIRMATION_SOURCES = ["whatsapp", "manual"];

export const PAYMENT_STATUSES = [
  "pending",
  "paid",
  "partial",
  "refunded",
  "partially_refunded",
];

export const SHIPMENT_STATUSES = [
  "pending_action",
  "preparing",
  "ready_to_ship",
  "out_for_delivery",
  "delivered",
  "returned_to_warehouse",
  "failed",
  "customer_not_respond",
  "customer_data_wrong",
  "customer_refused",
  "cancelled",
];

export const UPSELL_STATUSES = [
  "pending",
  "accepted",
  "rejected",
  "expired",
  "accepted_non_eligible",
  "failed_to_add",
];

export function operatorsFor(field) {
  if (NUMBER_FIELDS.has(field)) {
    return ["eq", "neq", "gte", "lte", "is_null", "is_not_null"];
  }
  if (BOOLEAN_FIELDS.has(field)) {
    return ["eq", "neq"];
  }
  return ["eq", "neq", "in", "not_in", "is_null", "is_not_null"];
}

export function operatorNeedsValue(operator) {
  return operator !== "is_null" && operator !== "is_not_null";
}

export function parseRuleValue(field, operator, raw) {
  if (!operatorNeedsValue(operator)) return undefined;

  if (operator === "in" || operator === "not_in") {
    if (Array.isArray(raw)) return raw.map((part) => coerceScalar(field, part));
    return String(raw ?? "")
      .split(",")
      .map((part) => part.trim())
      .filter(Boolean)
      .map((part) => coerceScalar(field, part));
  }

  return coerceScalar(field, raw);
}

function coerceScalar(field, raw) {
  if (BOOLEAN_FIELDS.has(field)) {
    if (raw === true || raw === "true") return true;
    if (raw === false || raw === "false") return false;
    return Boolean(raw);
  }
  if (NUMBER_FIELDS.has(field)) {
    const n = Number(raw);
    return Number.isFinite(n) ? n : 0;
  }
  return raw;
}

export function displayRuleValue(field, operator, value) {
  if (operator === "in" || operator === "not_in") {
    if (Array.isArray(value)) return value.map(String);
    if (value === undefined || value === null || value === "") return [];
    return [String(value)];
  }
  if (BOOLEAN_FIELDS.has(field)) {
    if (value === true || value === "true") return "true";
    if (value === false || value === "false") return "false";
    return "";
  }
  if (value === undefined || value === null) return "";
  return String(value);
}

export function unwrapList(data) {
  if (Array.isArray(data)) return data;
  if (Array.isArray(data?.records)) return data.records;
  if (Array.isArray(data?.data)) return data.data;
  if (Array.isArray(data?.integrations)) return data.integrations;
  return [];
}
