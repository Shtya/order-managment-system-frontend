"use client";

import { useEffect, useMemo, useState } from "react";
import { Globe2, Info, ListChecks, MessageCircle, Search } from "lucide-react";
import api from "@/utils/api";
import { cn } from "@/utils/cn";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { useTranslations } from "next-intl";

function SkeletonLine({ className = "" }) {
  return <div className={cn("h-3 rounded bg-muted-foreground/15", className)} />;
}

function WhatsappAccountAccessSkeleton() {
  return (
    <div aria-busy="true" className="animate-pulse space-y-4">
      <div className="grid gap-3 sm:grid-cols-2">
        {[0, 1].map((item) => (
          <div key={item} className="flex items-center gap-3 rounded-xl border-2 border-border bg-card p-4">
            <div className="h-10 w-10 shrink-0 rounded-xl bg-muted" />
            <div className="min-w-0 flex-1 space-y-2">
              <SkeletonLine className="w-28" />
              <SkeletonLine className="w-full max-w-48" />
            </div>
            <div className="h-4 w-4 shrink-0 rounded-full bg-muted" />
          </div>
        ))}
      </div>

      <div className="space-y-3">
        <div className="space-y-2">
          <SkeletonLine className="w-32" />
          <SkeletonLine className="w-20" />
        </div>
        <div className="grid gap-2 sm:grid-cols-2">
          {[0, 1, 2, 3].map((item) => (
            <div key={item} className="flex items-center gap-3 rounded-xl border border-border bg-card p-3">
              <div className="h-9 w-9 shrink-0 rounded-xl bg-muted" />
              <div className="min-w-0 flex-1 space-y-2">
                <SkeletonLine className="w-24" />
                <SkeletonLine className="w-32 max-w-full" />
              </div>
              <div className="h-5 w-5 shrink-0 rounded bg-muted" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default function WhatsappAccountAccessSelector({ value, onChange, role }) {
  const t = useTranslations("employees.whatsappAccess");
  const [accounts, setAccounts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadFailed, setLoadFailed] = useState(false);
  const [reloadKey, setReloadKey] = useState(0);
  const [search, setSearch] = useState("");
  const mode = value?.whatsappAccessMode || "selected";
  const selected = value?.whatsappAccountIds || [];

  useEffect(() => {
    let active = true;
    setLoading(true);
    setLoadFailed(false);
    api.get("/whatsapp-accounts", { params: { page: 1, limit: 200, isActive: "all" } })
      .then(({ data }) => active && setAccounts(data?.records || []))
      .catch(() => {
        if (!active) return;
        setAccounts([]);
        setLoadFailed(true);
      })
      .finally(() => active && setLoading(false));
    return () => { active = false; };
  }, [reloadKey]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return accounts.filter((account) => !q || `${account.name} ${account.mobileNumber}`.toLowerCase().includes(q));
  }, [accounts, search]);

  const permissions = role?.permissionNames || [];
  const allPermissions = permissions.includes("*");
  const canRead = allPermissions || (permissions.includes("conversation.read") && permissions.includes("whatsapp.read"));
  const canSend = allPermissions || permissions.includes("whatsapp.send");
  const setMode = (whatsappAccessMode) => onChange?.({ ...value, whatsappAccessMode });
  const toggle = (id) => onChange?.({
    ...value,
    whatsappAccountIds: selected.includes(id) ? selected.filter((item) => item !== id) : [...selected, id],
  });

  return (
    <div className="space-y-4">
      <div className="flex items-start gap-2 rounded-xl border border-blue-200 bg-blue-50 p-3 text-sm text-blue-800 dark:border-blue-900/50 dark:bg-blue-950/30 dark:text-blue-300">
        <Info size={17} className="mt-0.5 shrink-0" />
        <span>{t("description")}</span>
      </div>

      {/* {role && (
        <div className="grid gap-2 sm:grid-cols-2">
          <div className={cn("rounded-xl border p-3 text-sm", canRead ? "border-green-200 bg-green-50 text-green-700 dark:border-green-900/50 dark:bg-green-950/30 dark:text-green-300" : "border-amber-200 bg-amber-50 text-amber-700 dark:border-amber-900/50 dark:bg-amber-950/30 dark:text-amber-300")}>
            <div className="font-semibold">{canRead ? t("canOpenChats") : t("cannotOpenChats")}</div>
            <div className="mt-1 text-xs opacity-80">{t("readRequirement")}</div>
          </div>
          <div className={cn("rounded-xl border p-3 text-sm", canSend ? "border-green-200 bg-green-50 text-green-700 dark:border-green-900/50 dark:bg-green-950/30 dark:text-green-300" : "border-gray-200 bg-gray-50 text-gray-600 dark:border-slate-700 dark:bg-slate-800/40 dark:text-slate-300")}>
            <div className="font-semibold">{canSend ? t("canSendMessages") : t("readOnly")}</div>
            <div className="mt-1 text-xs opacity-80">{t("sendRequirement")}</div>
          </div>
        </div>
      )} */}

      {loading ? (
        <WhatsappAccountAccessSkeleton />
      ) : (
        <>
      <RadioGroup value={mode} onValueChange={setMode} className="grid gap-3 sm:grid-cols-2">
        {[
          { id: "all", icon: Globe2, title: t("allNumbers"), text: t("allNumbersDescription") },
          { id: "selected", icon: ListChecks, title: t("selectedNumbers"), text: t("selectedNumbersDescription") },
        ].map((option) => {
          const Icon = option.icon;
          const active = mode === option.id;
          return (
            <label key={option.id} htmlFor={`whatsapp-access-${option.id}`} className={cn("relative flex cursor-pointer items-center gap-3 rounded-xl border-2 p-4 text-start transition-colors", active ? "border-primary bg-primary/5" : "border-border bg-card hover:border-primary/40")}>
              <span className={cn("flex h-10 w-10 shrink-0 items-center justify-center rounded-xl", active ? "bg-primary text-white" : "bg-muted text-muted-foreground")}><Icon size={19} /></span>
              <span className="min-w-0 flex-1"><strong className="block text-sm text-foreground">{option.title}</strong><small className="mt-1 block text-xs text-muted-foreground">{option.text}</small></span>
              <RadioGroupItem id={`whatsapp-access-${option.id}`} value={option.id} aria-label={option.title} />
            </label>
          );
        })}
      </RadioGroup>

      {mode === "selected" && (
        <div className="space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div><div className="text-sm font-semibold text-foreground">{t("availableNumbers")}</div><div className="text-xs text-muted-foreground">{t("selectedCount", { count: selected.length })}</div></div>
            {!!selected.length && <Button type="button" variant="ghost" size="sm" className="text-xs font-semibold text-primary" onClick={() => onChange?.({ ...value, whatsappAccountIds: [] })}>{t("clearAll")}</Button>}
          </div>
          {/* <Input startIcon={<Search size={16} className="text-muted-foreground" />} value={search} onChange={(event) => setSearch(event.target.value)} placeholder={t("searchPlaceholder")} /> */}
          <div className="grid max-h-64 gap-2 overflow-y-auto sm:grid-cols-2">
            {loadFailed && (
              <div className="col-span-full flex flex-col items-center gap-2 py-6 text-center text-sm text-muted-foreground">
                <span>{t("loadFailed")}</span>
                <Button type="button" variant="outline" size="sm" onClick={() => setReloadKey((key) => key + 1)}>{t("retry")}</Button>
              </div>
            )}
            {!loadFailed && filtered.map((account) => {
              const checked = selected.includes(account.id);
              return (
                <label key={account.id} htmlFor={`whatsapp-account-${account.id}`} className={cn("flex cursor-pointer items-center gap-3 rounded-xl border p-3 text-start", checked ? "border-primary/50 bg-primary/5" : "border-border bg-card")}>
                  <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-green-500/10 text-green-600"><MessageCircle size={18} /></span>
                  <span className="min-w-0 flex-1"><strong className="block truncate text-sm text-foreground">{account.name}</strong><small className="block truncate font-en text-xs text-muted-foreground" dir="ltr">{account.mobileNumber || "—"}</small></span>
                  <Checkbox id={`whatsapp-account-${account.id}`} checked={checked} onCheckedChange={() => toggle(account.id)} size={14} className="size-5 rounded" aria-label={account.name} />
                </label>
              );
            })}
            {!loadFailed && !filtered.length && <div className="col-span-full py-6 text-center text-sm text-muted-foreground">{t("noNumbersFound")}</div>}
          </div>
          {/* {!selected.length && <div className="rounded-xl border border-amber-200 bg-amber-50 p-3 text-xs text-amber-700 dark:border-amber-900/50 dark:bg-amber-950/30 dark:text-amber-300">{t("noSelectionWarning")}</div>} */}
        </div>
      )}
        </>
      )}
    </div>
  );
}

