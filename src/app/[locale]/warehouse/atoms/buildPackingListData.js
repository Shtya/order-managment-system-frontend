const UNASSIGNED = "__none__";

function variantAttributesLabel(variant) {
  const attrs = variant?.attributes;
  if (attrs && typeof attrs === "object") {
    const vals = Object.values(attrs).filter(Boolean);
    if (vals.length) return vals.join(" / ");
  }
  if (variant?.key && variant.key !== "default") return variant.key;
  return "";
}

function mapItem(item, orderNumber) {
  const variant = item?.variant || {};
  const product = variant.product || {};
  const sku = variant.sku || product.sku || "—";
  const attrLabel = variantAttributesLabel(variant);
  const baseName = product.name || sku;
  const name = attrLabel ? `${baseName} — ${attrLabel}` : baseName;
  const warehouseName = product.warehouse?.name || "";
  const locationName = product.storageLocation?.name || "";
  const warehouseId = product.warehouse?.id || product.warehouseId || UNASSIGNED;
  const locationId = product.storageLocation?.id || product.storageLocationId || UNASSIGNED;

  return {
    key: String(variant.id || item.variantId || `${sku}-${product.id || item.id}`),
    productId: String(product.id || UNASSIGNED),
    sku,
    name,
    image: product.mainImage || "",
    quantity: Number(item.quantity) || 0,
    orderNumber,
    warehouseId: String(warehouseId),
    warehouseName,
    locationId: String(locationId),
    locationName,
  };
}

function sortGroups(a, b) {
  const aUn = a.warehouseId === UNASSIGNED;
  const bUn = b.warehouseId === UNASSIGNED;
  if (aUn !== bUn) return aUn ? 1 : -1;
  return (a.warehouseName || "").localeCompare(b.warehouseName || "", undefined, { sensitivity: "base" });
}

function aggregateRows(mappedItems) {
  const byKey = new Map();
  for (const row of mappedItems) {
    const existing = byKey.get(row.key);
    if (!existing) {
      byKey.set(row.key, {
        ...row,
        quantity: row.quantity,
        orderNumbers: new Set(row.orderNumber ? [row.orderNumber] : []),
      });
    } else {
      existing.quantity += row.quantity;
      if (row.orderNumber) existing.orderNumbers.add(row.orderNumber);
    }
  }
  return Array.from(byKey.values()).map((r) => ({
    ...r,
    orderCount: r.orderNumbers.size,
    orderNumbers: Array.from(r.orderNumbers),
  }));
}

function groupRows(rows) {
  const groups = new Map();
  for (const row of rows) {
    const gk = row.warehouseId;
    if (!groups.has(gk)) {
      groups.set(gk, {
        warehouseId: row.warehouseId,
        warehouseName: row.warehouseName,
        rows: [],
      });
    }
    groups.get(gk).rows.push(row);
  }
  const list = Array.from(groups.values());
  list.sort(sortGroups);
  for (const g of list) {
    g.rows.sort((a, b) => {
      const loc = (a.locationName || "").localeCompare(b.locationName || "", undefined, { sensitivity: "base" });
      if (loc !== 0) return loc;
      return (a.name || "").localeCompare(b.name || "", undefined, { sensitivity: "base" });
    });
  }
  return list;
}

function flattenOrderItems(orders) {
  const mapped = [];
  for (const order of orders || []) {
    for (const item of order.items || []) {
      mapped.push(mapItem(item, order.orderNumber));
    }
  }
  return mapped;
}

function summarize(orders, aggregatedRows, lineItemCount) {
  const productIds = new Set(aggregatedRows.map((r) => r.productId).filter((id) => id && id !== UNASSIGNED));
  return {
    orderCount: orders.length,
    productCount: productIds.size || aggregatedRows.length,
    itemCount: aggregatedRows.length,
    lineItemCount,
    totalQuantity: aggregatedRows.reduce((sum, r) => sum + r.quantity, 0),
  };
}

export function generatePrintNumber(date = new Date()) {
  const d = date instanceof Date ? date : new Date(date);
  const pad = (n) => String(n).padStart(2, "0");
  return `PL-${d.getFullYear()}${pad(d.getMonth() + 1)}${pad(d.getDate())}${pad(d.getHours())}${pad(d.getMinutes())}`;
}

export function formatPrintDate(date, locale) {
  const d = date instanceof Date ? date : new Date(date);
  return d.toLocaleDateString(locale, {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

export function buildPackingListData(orders, { printNumber, printedAt } = {}) {
  const list = Array.isArray(orders) ? orders : [];
  const at = printedAt || new Date();
  const combinedMapped = flattenOrderItems(list);
  const combinedRows = aggregateRows(combinedMapped);
  const groups = groupRows(combinedRows);

  const perOrder = list.map((order) => {
    const mapped = flattenOrderItems([order]);
    const rows = aggregateRows(mapped);
    return {
      order,
      groups: groupRows(rows),
      summary: summarize([order], rows, mapped.length),
    };
  });

  return {
    printNumber: printNumber || generatePrintNumber(at),
    printedAt: at,
    orderNumbers: list.map((o) => o.orderNumber).filter(Boolean),
    summary: summarize(list, combinedRows, combinedMapped.length),
    groups,
    perOrder,
  };
}
