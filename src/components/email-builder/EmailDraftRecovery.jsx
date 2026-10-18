"use client";
import { useEffect, useRef, useState } from "react";
import { History } from "lucide-react";
import { jwtDecode } from "jwt-decode";
import { useTranslations } from "next-intl";
import { useAuth } from "@/context/AuthContext";
import { recoverySnapshot } from "./document";
const PREFIX = "email-draft:";
export default function EmailDraftRecovery({ watch, setValue, campaignId }) {
  const { user: signedInUser } = useAuth();
  const t = useTranslations("emailBuilder");
  const [recovery, setRecovery] = useState(null);
  const key = useRef(null);
  const blocked = useRef(false);
  const clear = () => {
    try {
      if (key.current) sessionStorage.removeItem(key.current);
    } catch {
      /* Storage may be disabled. */
    }
    setRecovery(null);
  };
  useEffect(() => {
    const identity = () => {
      try {
        const token = localStorage.getItem("accessToken");
        if (!token) return null;
        const user = jwtDecode(token);
        const actor = user.id || user.sub;
        const profile = signedInUser;
        if (profile?.id !== actor) return null;
        const tenant = profile.role?.name === "admin" ? actor : profile.adminId;
        return actor && tenant
          ? `${PREFIX}${tenant}:${actor}:${campaignId}`
          : null;
      } catch {
        return null;
      }
    };
    const nextKey = identity();
    if (key.current && key.current !== nextKey) clear();
    key.current = nextKey;
    blocked.current = false;
    try {
      const row = JSON.parse(sessionStorage.getItem(key.current) || "null");
      if (
        row?.expires > Date.now() &&
        [1, 2].includes(row.email?.document?.schemaVersion) &&
        Array.isArray(row.email?.document?.blocks)
      ) {
        setRecovery(row);
        blocked.current = true;
      } else clear();
    } catch {
      clear();
    }
    const save = watch((values) => {
      const current = identity();
      if (current !== key.current) {
        clear();
        key.current = current;
        blocked.current = true;
        return;
      }
      if (!current || blocked.current || !values.email) return;
      // Explicit allow-list: recipients, filters, file data and samples never enter recovery.
      const row = recoverySnapshot(values);
      try {
        sessionStorage.setItem(current, JSON.stringify(row));
      } catch {
        /* Storage unavailable or full; editing still works. */
      }
    });
    const purge = () => {
      clear();
      blocked.current = true;
    };
    const logout = () => {
      if (identity() !== key.current) purge();
    };
    const check = setInterval(logout, 2000);
    window.addEventListener("email-draft-clear", purge);
    window.addEventListener("storage", logout);
    return () => {
      save.unsubscribe();
      clearInterval(check);
      window.removeEventListener("email-draft-clear", purge);
      window.removeEventListener("storage", logout);
    };
  }, [
    campaignId,
    signedInUser?.id,
    signedInUser?.adminId,
    signedInUser?.role?.name,
  ]);
  if (!recovery) return null;
  const restore = () => {
    for (const field of ["email", "name", "description", "category"])
      setValue(field, recovery[field], { shouldDirty: true });
    setValue("manualRecipients", []);
    setValue("audienceFilter", null);
    setValue("audienceFilterRaw", null);
    setValue("audienceFileMeta", null);
    setValue("audienceSegmentId", null);
    setValue("audienceFile", null);
    setValue("audienceFileUrl", null);
    blocked.current = false;
    setRecovery(null);
  };
  return (
    <div
      role="status"
      className="flex items-center gap-3 rounded-xl border border-amber-300/60 bg-amber-50 px-3 py-2 dark:bg-amber-500/10"
    >
      <History className="h-4 w-4 shrink-0 text-amber-600" />
      <span className="min-w-0 flex-1 text-xs">{t("recovery.recovery")}</span>
      <button
        type="button"
        className="btn btn-sm btn-ghost !h-7"
        onClick={restore}
      >
        {t("recovery.restore")}
      </button>
      <button
        type="button"
        className="text-xs text-muted-foreground hover:text-foreground"
        onClick={() => {
          clear();
          blocked.current = false;
        }}
      >
        {t("recovery.discard")}
      </button>
    </div>
  );
}