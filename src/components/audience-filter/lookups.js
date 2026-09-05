import api from "@/utils/api";
import {
  CONFIRMATION_SOURCES,
  PAYMENT_METHODS,
  PAYMENT_STATUSES,
  SHIPMENT_STATUSES,
  unwrapList,
  UPSELL_STATUSES,
} from "@/app/[locale]/tags/atoms/condition-fields";

export const TENANT_AUDIENCE_FIELDS = [
  "client.tagId",
  "order.tagId",
  "order.storeId",
  "order.shippingCompanyId",
  "shipment.shippingCompanyId",
  "product.categoryId",
  "order.statusId",
  "product.id",
  "variant.id",
];

export const SEARCHABLE_AUDIENCE_FIELDS = {
  "product.id": "product",
  "variant.id": "sku",
};

export const FIELD_TO_LOOKUP_KEY = {
  "order.statusId": "statuses",
  "order.storeId": "stores",
  "order.cityId": "cities",
  "order.shippingCompanyId": "shipping",
  "shipment.shippingCompanyId": "shipping",
  "client.tagId": "clientTags",
  "order.tagId": "orderTags",
  "product.categoryId": "categories",
};

const TENANT_LOOKUP_KEYS = new Set([
  "statuses",
  "stores",
  "shipping",
  "clientTags",
  "orderTags",
  "categories",
]);

export const EMPTY_AUDIENCE_LOOKUPS = {
  statuses: [],
  stores: [],
  cities: [],
  shipping: [],
  shipmentStatuses: [],
  clientTags: [],
  orderTags: [],
  categories: [],
};

export function lookupKeysForFields(fields, { includeTenant = true } = {}) {
  const keys = new Set();
  for (const field of fields || []) {
    const key = FIELD_TO_LOOKUP_KEY[field];
    if (!key) continue;
    if (!includeTenant && TENANT_LOOKUP_KEYS.has(key)) continue;
    keys.add(key);
  }
  return [...keys];
}

async function fetchLookupKey(key) {
  switch (key) {
    case "statuses": {
      const res = await api.get("/orders/statuses").catch(() => ({ data: [] }));
      return unwrapList(res.data);
    }
    case "stores": {
      const res = await api.get("/stores", { params: { limit: 200, isActive: true } }).catch(() => ({ data: [] }));
      return unwrapList(res.data);
    }
    case "cities": {
      const res = await api.get("/cities", { params: { limit: 500 } }).catch(() => ({ data: [] }));
      return unwrapList(res.data);
    }
    case "shipping": {
      const res = await api.get("/shipping/integrations/active").catch(() => ({ data: [] }));
      return unwrapList(res.data);
    }
    case "clientTags": {
      const res = await api.get("/tags/assignable", { params: { target: "client" } }).catch(() => ({ data: [] }));
      return unwrapList(res.data);
    }
    case "orderTags": {
      const res = await api.get("/tags/assignable").catch(() => ({ data: [] }));
      return unwrapList(res.data);
    }
    case "categories": {
      const res = await api.get("/lookups/categories", { params: { limit: 200 } }).catch(() => ({ data: [] }));
      return unwrapList(res.data);
    }
    default:
      return [];
  }
}

export async function fetchAudienceLookupKeys(keys) {
  const unique = [...new Set((keys || []).filter(Boolean))];
  const entries = await Promise.all(
    unique.map(async (key) => [key, await fetchLookupKey(key)]),
  );
  return Object.fromEntries(entries);
}

export async function fetchAudienceLookups({ includeTenant = true } = {}) {
  const keys = includeTenant
    ? ["statuses", "stores", "cities", "shipping", "clientTags", "orderTags", "categories"]
    : ["cities"];
  const loaded = await fetchAudienceLookupKeys(keys);
  return { ...EMPTY_AUDIENCE_LOOKUPS, ...loaded };
}

function skuLabel(row) {
  const sku = row.sku || row.label;
  const name = row.name || row.productName;
  if (sku && name) return `${sku} · ${name}`;
  return sku || name || row.id;
}

export async function searchAudienceEntities(kind, { q = "", cursor, limit = 20 } = {}) {
  const path = kind === "sku" ? "/lookups/skus" : "/lookups/products";
  const res = await api.get(path, { params: { q: q || undefined, cursor, limit } });
  const body = res.data || {};
  const rows = unwrapList(body);
  return {
    data: rows.map((row) =>
      kind === "sku"
        ? { value: row.id, label: skuLabel(row), sku: row.sku, name: row.name }
        : { value: row.id, label: row.name || row.label || row.id, name: row.name || row.label },
    ),
    hasMore: Boolean(body.hasMore),
    nextCursor: body.nextCursor || null,
  };
}

export async function resolveAudienceEntityOptions(field, ids) {
  const unique = [...new Set((ids || []).map(String).filter(Boolean))];
  if (!unique.length) return [];
  const kind = SEARCHABLE_AUDIENCE_FIELDS[field];
  if (!kind) return [];
  const path = kind === "sku" ? "/lookups/skus" : "/lookups/products";
  const param = kind === "sku" ? { ids: unique.join(",") } : { ids: unique.join(",") };
  const res = await api.get(path, { params: param }).catch(() => ({ data: [] }));
  const rows = unwrapList(res.data);
  return rows.map((row) =>
    kind === "sku"
      ? { value: row.id, label: skuLabel(row) }
      : { value: row.id, label: row.name || row.label || row.id },
  );
}

function tagOption(tag) {
  return { value: tag.id, label: tag.name || tag.label || tag.id };
}

function labelOrKey(t, key, fallback) {
  try {
    if (typeof t.has === "function" && !t.has(key)) return fallback;
    const value = t(key);
    return !value || value === key ? fallback : value;
  } catch {
    return fallback;
  }
}

export function buildAudienceFieldOptions({ lookups, locale, tOrders, tTags, tAudience }) {
  const statusOptions = (lookups.statuses || []).map((status) => ({
    value: status.id,
    label: status.system ? tOrders(`statuses.${status.code}`) : status.name || status.code || status.id,
  }));
  const storeOptions = (lookups.stores || []).map((store) => ({
    value: store.id,
    label: store.name || store.title || store.id,
  }));
  const cityOptions = (lookups.cities || []).map((city) => ({
    value: city.id,
    label: locale === "ar" ? city.nameAr || city.nameEn : city.nameEn || city.nameAr || city.id,
  }));
  const shippingOptions = (lookups.shipping || []).map((item) => ({
    value: item.providerId || item.id,
    label: item.name || item.provider || item.id,
  }));
  const categoryOptions = (lookups.categories || []).map((category) => ({
    value: category.id,
    label: category.name || category.title || category.id,
  }));
  const shipmentStatuses = (lookups.shipmentStatuses?.length
    ? lookups.shipmentStatuses
    : SHIPMENT_STATUSES
  )
    .map((value) => (typeof value === "string" ? value : value?.code || value?.status))
    .filter(Boolean);

  return {
    "order.statusId": statusOptions,
    "order.storeId": storeOptions,
    "order.cityId": cityOptions,
    "order.shippingCompanyId": shippingOptions,
    "shipment.shippingCompanyId": shippingOptions,
    "client.tagId": (lookups.clientTags || []).map(tagOption),
    "order.tagId": (lookups.orderTags || []).map(tagOption),
    "product.categoryId": categoryOptions,
    "order.paymentStatus": PAYMENT_STATUSES.map((value) => ({
      value,
      label: tTags(`paymentStatus.${value}`),
    })),
    "order.paymentMethod": PAYMENT_METHODS.map((value) => ({
      value,
      label: tOrders(
        value === "bank_transfer" ? "paymentMethods.bankTransfer" : `paymentMethods.${value}`,
      ),
    })),
    "order.confirmationSource": CONFIRMATION_SOURCES.map((value) => ({
      value,
      label: tTags(`confirmationSource.${value}`),
    })),
    "shipment.status": shipmentStatuses.map((value) => ({
      value,
      label: labelOrKey(tOrders, `trackingStatus.${value}`, value),
    })),
    "upsell.status": UPSELL_STATUSES.map((value) => ({
      value,
      label: labelOrKey(tAudience || tTags, `upsellStatus.${value}`, value),
    })),
  };
}
