export const PREPARE_SESSION_KEY = "warehouse_prepare_session_v3";

function isBrowser() {
  return typeof window !== "undefined" && !!window.sessionStorage;
}

function uniqueCodes(list = []) {
  return [...new Set((Array.isArray(list) ? list : []).filter(Boolean))];
}

export function buildOrderPreparationState(order) {
  return {
    code: order.code,
    orderScanned: false,
    completed: false,
    lastItemSku: "",
    scanLogs: [],
    products: (order.products || []).map((product) => {
      const requestedQty = Number(product.requestedQty) || 0;
      const scannedQty = Math.min(Number(product.scannedQty) || 0, requestedQty);
      return {
        ...product,
        requestedQty,
        scannedQty,
        completed: requestedQty > 0 ? scannedQty >= requestedQty : true,
      };
    }),
  };
}

export function createInitialPrepareSession(orderCodes = []) {
  return {
    selectedOrderCodes: uniqueCodes(orderCodes),
    scannedOrderCodes: [],
    activeOrderCode: null,
    employee: "",
    notes: "",
    counters: {
      success: 0,
      wrong: 0,
    },
    lastFeedback: null,
    orderStates: {},
    updatedAt: new Date().toISOString(),
  };
}

export function readPrepareSession() {
  if (!isBrowser()) return null;

  try {
    const raw = window.sessionStorage.getItem(PREPARE_SESSION_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch (_) {
    return null;
  }
}

export function writePrepareSession(session) {
  if (!isBrowser()) return;

  try {
    window.sessionStorage.setItem(
      PREPARE_SESSION_KEY,
      JSON.stringify({
        ...session,
        updatedAt: new Date().toISOString(),
      })
    );
  } catch (_) {
    // Ignore storage write errors to avoid blocking the warehouse flow.
  }
}

export function clearPrepareSession() {
  if (!isBrowser()) return;

  try {
    window.sessionStorage.removeItem(PREPARE_SESSION_KEY);
  } catch (_) {
    // Ignore storage clear errors.
  }
}

export function setPreparationSelection(orderCodes = []) {
  const nextCodes = uniqueCodes(orderCodes);
  const current = readPrepareSession() || createInitialPrepareSession();

  writePrepareSession({
    ...current,
    selectedOrderCodes: nextCodes,
    scannedOrderCodes: uniqueCodes([
      ...(current.scannedOrderCodes || []).filter((code) => nextCodes.includes(code)),
    ]),
    activeOrderCode: nextCodes.includes(current.activeOrderCode) ? current.activeOrderCode : null,
  });
}

export function mergeSessionWithOrders(session, orders = []) {
  const orderMap = new Map((orders || []).map((order) => [order.code, order]));
  const baseSession = {
    ...createInitialPrepareSession(),
    ...(session || {}),
    counters: {
      success: Number(session?.counters?.success) || 0,
      wrong: Number(session?.counters?.wrong) || 0,
    },
  };

  const selectedOrderCodes = uniqueCodes([
    ...(baseSession.selectedOrderCodes || []),
    ...(baseSession.scannedOrderCodes || []),
  ]).filter((code) => orderMap.has(code));

  const orderStates = {};

  selectedOrderCodes.forEach((code) => {
    const order = orderMap.get(code);
    const previousState = baseSession.orderStates?.[code];

    if (!previousState) {
      orderStates[code] = buildOrderPreparationState(order);
      return;
    }

    const previousProductsBySku = new Map(
      (previousState.products || []).map((product) => [product.sku, product])
    );

    const mergedProducts = (order.products || []).map((product) => {
      const previousProduct = previousProductsBySku.get(product.sku);
      const requestedQty = Number(product.requestedQty) || 0;
      const scannedQty = Math.min(
        Number(previousProduct?.scannedQty ?? product.scannedQty) || 0,
        requestedQty
      );

      return {
        ...product,
        scannedQty,
        completed: requestedQty > 0 ? scannedQty >= requestedQty : true,
      };
    });

    orderStates[code] = {
      ...previousState,
      code,
      products: mergedProducts,
      completed: mergedProducts.length > 0 && mergedProducts.every((item) => item.completed),
    };
  });

  const activeOrderCode = selectedOrderCodes.includes(baseSession.activeOrderCode)
    ? baseSession.activeOrderCode
    : selectedOrderCodes.find((code) => !orderStates[code]?.completed) || null;

  return {
    ...baseSession,
    selectedOrderCodes,
    scannedOrderCodes: uniqueCodes(baseSession.scannedOrderCodes || []).filter((code) =>
      selectedOrderCodes.includes(code)
    ),
    activeOrderCode,
    orderStates,
  };
}

export function removeOrderFromPrepareSession(orderCode) {
  const current = readPrepareSession() || createInitialPrepareSession();
  const nextSelected = uniqueCodes(current.selectedOrderCodes || []).filter((code) => code !== orderCode);
  const nextScanned = uniqueCodes(current.scannedOrderCodes || []).filter((code) => code !== orderCode);
  const nextStates = { ...(current.orderStates || {}) };
  delete nextStates[orderCode];

  writePrepareSession({
    ...current,
    selectedOrderCodes: nextSelected,
    scannedOrderCodes: nextScanned,
    activeOrderCode: current.activeOrderCode === orderCode ? null : current.activeOrderCode,
    orderStates: nextStates,
  });
}
