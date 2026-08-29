/** Single LS blob for all table column prefs: `{ [tableKey]: { order, hidden } }` */
export const TABLE_PREFS_LS_KEY = "tablePreferences";

/** Single LS blob for all stats visibility prefs: `{ [statsKey]: { hidden } }` */
export const STATISTICS_PREFS_LS_KEY = "statisticsPreferences";

const LEGACY_TABLE_PREFS_PREFIX = "tablePreferences_";
const LEGACY_STATS_PREFS_PREFIX = "statisticsPreferences_";
const LEGACY_ORDER_STATS_PREFS_LS_KEY = "orderStatisticsPreferences";

function safeParse(raw) {
  if (!raw) return null;
  try {
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

function readLsObject(key) {
  if (typeof window === "undefined") return {};
  const parsed = safeParse(localStorage.getItem(key));
  return parsed && typeof parsed === "object" && !Array.isArray(parsed) ? parsed : {};
}

function writeLsObject(key, value) {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(key, JSON.stringify(value && typeof value === "object" ? value : {}));
  } catch {
    // Ignore storage failures (private mode / quota).
  }
}

function collectLegacyPrefKeys(prefix) {
  if (typeof window === "undefined") return [];
  const keys = [];
  for (let i = 0; i < localStorage.length; i += 1) {
    const k = localStorage.key(i);
    if (k?.startsWith(prefix)) keys.push(k);
  }
  return keys;
}

let tablePrefsMigrated = false;
let statsPrefsMigrated = false;

export function normalizeTablePref(value) {
  if (Array.isArray(value)) {
    return {
      order: [],
      hidden: value.filter((k) => typeof k === "string"),
    };
  }
  if (value && typeof value === "object") {
    return {
      order: Array.isArray(value.order) ? value.order.filter((k) => typeof k === "string") : [],
      hidden: Array.isArray(value.hidden) ? value.hidden.filter((k) => typeof k === "string") : [],
    };
  }
  return { order: [], hidden: [] };
}

export function normalizeStatsPref(value) {
  if (Array.isArray(value)) {
    return { hidden: value.filter((k) => typeof k === "string") };
  }
  if (value && typeof value === "object") {
    return {
      hidden: Array.isArray(value.hidden)
        ? value.hidden.filter((k) => typeof k === "string")
        : [],
    };
  }
  return { hidden: [] };
}

/** Merge per-table legacy keys into `tablePreferences` once. */
export function migrateLegacyTablePrefsToUnified() {
  if (typeof window === "undefined" || tablePrefsMigrated) return;
  tablePrefsMigrated = true;

  const current = readLsObject(TABLE_PREFS_LS_KEY);
  let changed = false;

  for (const legacyKey of collectLegacyPrefKeys(LEGACY_TABLE_PREFS_PREFIX)) {
    const tableKey = legacyKey.slice(LEGACY_TABLE_PREFS_PREFIX.length);
    if (!tableKey) continue;
    const parsed = safeParse(localStorage.getItem(legacyKey));
    if (parsed == null) continue;
    if (current[tableKey] == null) {
      current[tableKey] = normalizeTablePref(parsed);
      changed = true;
    }
    localStorage.removeItem(legacyKey);
    changed = true;
  }

  if (changed) writeLsObject(TABLE_PREFS_LS_KEY, current);
}

/** Merge per-key legacy stats keys into `statisticsPreferences` once. */
export function migrateLegacyStatsPrefsToUnified() {
  if (typeof window === "undefined" || statsPrefsMigrated) return;
  statsPrefsMigrated = true;

  const current = readLsObject(STATISTICS_PREFS_LS_KEY);
  let changed = false;

  for (const legacyKey of collectLegacyPrefKeys(LEGACY_STATS_PREFS_PREFIX)) {
    const statsKey = legacyKey.slice(LEGACY_STATS_PREFS_PREFIX.length);
    if (!statsKey) continue;
    const parsed = safeParse(localStorage.getItem(legacyKey));
    if (parsed == null) continue;
    if (current[statsKey] == null) {
      current[statsKey] = normalizeStatsPref(parsed);
      changed = true;
    }
    localStorage.removeItem(legacyKey);
    changed = true;
  }

  const legacyOrders = safeParse(localStorage.getItem(LEGACY_ORDER_STATS_PREFS_LS_KEY));
  if (legacyOrders != null && current.orders == null) {
    current.orders = normalizeStatsPref(legacyOrders);
    changed = true;
  }
  if (localStorage.getItem(LEGACY_ORDER_STATS_PREFS_LS_KEY)) {
    localStorage.removeItem(LEGACY_ORDER_STATS_PREFS_LS_KEY);
    changed = true;
  }

  if (changed) writeLsObject(STATISTICS_PREFS_LS_KEY, current);
}

export function readAllTablePrefsFromLS() {
  migrateLegacyTablePrefsToUnified();
  return readLsObject(TABLE_PREFS_LS_KEY);
}

export function readTablePrefsFromLS(tableKey) {
  if (!tableKey) return { order: [], hidden: [] };
  const all = readAllTablePrefsFromLS();
  return normalizeTablePref(all[tableKey]);
}

export function writeTablePrefsToLS(tableKey, prefs) {
  if (!tableKey) return;
  const all = readAllTablePrefsFromLS();
  all[tableKey] = normalizeTablePref(prefs);
  writeLsObject(TABLE_PREFS_LS_KEY, all);
}

export function writeAllTablePrefsToLS(prefs) {
  if (!prefs || typeof prefs !== "object") return;
  const all = readAllTablePrefsFromLS();
  for (const [tableKey, pref] of Object.entries(prefs)) {
    if (!tableKey) continue;
    all[tableKey] = normalizeTablePref(pref);
  }
  writeLsObject(TABLE_PREFS_LS_KEY, all);
}

export function readAllStatisticsPrefsFromLS() {
  migrateLegacyStatsPrefsToUnified();
  return readLsObject(STATISTICS_PREFS_LS_KEY);
}

export function readStatsPrefsFromLS(statsKey) {
  if (!statsKey) return { hidden: [] };
  const all = readAllStatisticsPrefsFromLS();
  return normalizeStatsPref(all[statsKey]);
}

export function writeStatsPrefsToLS(statsKey, prefs) {
  if (!statsKey) return;
  const all = readAllStatisticsPrefsFromLS();
  all[statsKey] = normalizeStatsPref(prefs);
  writeLsObject(STATISTICS_PREFS_LS_KEY, all);
}

export function writeAllStatisticsPrefsToLS(prefs) {
  if (!prefs || typeof prefs !== "object") return;
  const all = readAllStatisticsPrefsFromLS();
  for (const [statsKey, pref] of Object.entries(prefs)) {
    if (!statsKey) continue;
    all[statsKey] = normalizeStatsPref(pref);
  }
  writeLsObject(STATISTICS_PREFS_LS_KEY, all);
}
