/** Remove only private email recovery data; preserve unrelated tab state. */
export function clearPrivateDrafts(storage, expiredOnly = false, now = Date.now()) {
  try {
    storage = storage || window.sessionStorage;
    for (let index = storage.length - 1; index >= 0; index--) {
      const key = storage.key(index);
      if (!key?.startsWith("email-draft:")) continue;
      let expired = true;
      try { expired = !(JSON.parse(storage.getItem(key))?.expires > now); } catch {}
      if (!expiredOnly || expired) storage.removeItem(key);
    }
    if (!expiredOnly) storage.removeItem("email-oauth-return");
  } catch { /* Storage may be unavailable. */ }
}
