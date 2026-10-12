"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { useLocale, useTranslations } from "next-intl";
import { usePathname, useRouter } from "@/i18n/navigation";
import { useAuth } from "@/context/AuthContext";
import api from "@/utils/api";
import BrandLogo from "@/components/atoms/BrandLogo";

const MCP_SCOPE = {
  READ: "madar:read",
  WRITE: "madar:write",
};
const SCOPE_I18N = {
  [MCP_SCOPE.READ]: "read",
  [MCP_SCOPE.WRITE]: "write",
};

function ScopeSwitch({ checked }) {
  return (
    <span
      aria-hidden
      className={`relative h-6 w-[42px] shrink-0 rounded-full transition-colors ${
        checked ? "bg-primary" : "bg-zinc-300"
      }`}
    >
      <span
        className={`absolute top-[3px] size-[18px] rounded-full bg-white transition-[inset-inline-start] ${
          checked ? "start-[21px]" : "start-[3px]"
        }`}
      />
    </span>
  );
}

function ConsentSkeleton() {
  return (
  <div role="status" aria-label="Loading authorization request">
  <span className="sr-only">Loading authorization request...</span>
  
    {/* Heading */}
    <div className="mb-5 flex justify-center">
      <div className="h-8 w-28 animate-pulse rounded-md bg-muted" />
    </div>
  
    <div className="mx-auto h-6 w-3/4 animate-pulse rounded-md bg-muted" />
  
    {/* Signed-in account */}
    <div className="mb-6 mt-3 flex items-center justify-center gap-2">
      <div className="h-3 w-20 animate-pulse rounded bg-muted" />
      <div className="h-3 w-32 animate-pulse rounded bg-muted" />
    </div>
  
    {/* Permission cards */}
    <div className="mb-5 grid gap-2.5">
      {[1, 2].map((item) => (
        <div
          key={item}
          className="flex items-center gap-3 rounded-[14px] border border-border p-3"
        >
          <div className="h-6 w-11 shrink-0 animate-pulse rounded-full bg-muted" />
          <div className="min-w-0 flex-1 space-y-2">
            <div className="h-4 w-32 max-w-full animate-pulse rounded bg-muted" />
            <div className="h-3 w-48 max-w-full animate-pulse rounded bg-muted" />
          </div>
        </div>
      ))}
    </div>
  
    {/* Authorization explanation */}
    <div className="mb-[18px] space-y-2">
      <div className="h-3 w-full animate-pulse rounded bg-muted" />
      <div className="h-3 w-5/6 animate-pulse rounded bg-muted" />
    </div>
  
    {/* Actions */}
    <div className="flex gap-2.5">
      <div className="h-12 flex-1 animate-pulse rounded-lg bg-muted" />
      <div className="h-12 w-24 animate-pulse rounded-lg bg-muted" />
    </div>
  </div>
  
  );
  }

export default function McpConnectPage() {
  const t = useTranslations("mcpConnect");
  const locale = useLocale();
  const searchParams = useSearchParams();
  const pathname = usePathname();
  const router = useRouter();
  const requestId = searchParams.get("request");
  const { user, isLoading } = useAuth();

  const [pending, setPending] = useState(null);
  const [selected, setSelected] = useState([]);
  const [error, setError] = useState(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (isLoading) return;
    if (user || !requestId) return;
    const back = `${pathname}${searchParams.toString() ? `?${searchParams.toString()}` : ""}`;
    router.replace(`/auth?redirect=${encodeURIComponent(back)}`);
  }, [isLoading, user, requestId, pathname, router, searchParams]);

  useEffect(() => {
    if (!user || !requestId) return;
    let cancelled = false;
    api
      .get(`/oauth/requests/${requestId}`)
      .then(({ data }) => {
        if (cancelled) return;
        setPending(data);
        setSelected(data.scopes ?? []);
      })
      .catch(() => {
        if (!cancelled) setError(t("expired"));
      });
    return () => {
      cancelled = true;
    };
  }, [user, requestId, t]);

  const toggle = (scope) =>
    setSelected((s) =>
      s.includes(scope) ? s.filter((x) => x !== scope) : [...s, scope],
    );

  async function decide(action) {
    setBusy(true);
    try {
      const { data } = await api.post(
        `/oauth/requests/${requestId}/${action}`,
        action === "approve" ? { scopes: selected } : {},
      );
      window.location.assign(data.redirectTo);
    } catch {
      setError(t("decideFailed"));
      setBusy(false);
    }
  }

  const scopeCopy = (scope) => {
    const key = SCOPE_I18N[scope];
    if (!key) return { title: scope, hint: "" };
    return { title: t(`scopes.${key}.title`), hint: t(`scopes.${key}.hint`) };
  };

  const waitingForAuth = Boolean(requestId) && (isLoading || !user);
  const waitingForRequest = Boolean(user && requestId && !pending && !error);
  const showSkeleton = waitingForAuth || waitingForRequest;

  return (
    <main
      dir={locale === "ar" ? "rtl" : "ltr"}
      className="grid min-h-screen place-items-center bg-background p-4 text-foreground"
    >
      <section className="w-full max-w-[460px] rounded-xl border border-border bg-card p-[28px_26px_24px] shadow-lg">
        <div className="mb-5 flex justify-center">
          <BrandLogo className="text-[#672DAD]" />
        </div>

        {!requestId ? (
          <p className="m-0 text-center text-muted-foreground">{t("invalidLink")}</p>
        ) : showSkeleton ? (
          <ConsentSkeleton />
        ) : error && !pending ? (
          <p className="m-0 text-center text-destructive">{error}</p>
        ) : (
          <>
            <h1 className="m-0 text-center text-[1.25rem] font-extrabold leading-snug">
              {t("title", { clientName: pending.clientName })}
            </h1>
            <p className="mt-2 mb-5 text-center text-[0.85rem] text-muted-foreground">
              {t("signedInAs")}{" "}
              <b dir="ltr" className="font-semibold text-foreground">
                {user.email}
              </b>
            </p>

            {error ? (
              <p className="mb-3.5 text-center text-destructive">{error}</p>
            ) : null}

            <ul className="mb-3.5 grid list-none gap-2.5 p-0">
              {pending.scopes.map((scope) => {
                const checked = selected.includes(scope);
                const copy = scopeCopy(scope);
                return (
                  <li key={scope}>
                    <label
                      className={`flex cursor-pointer items-center gap-3 rounded-[14px] border p-3 ${
                        checked
                          ? "border-primary bg-primary/8"
                          : "border-border bg-transparent"
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={checked}
                        onChange={() => toggle(scope)}
                        className="absolute opacity-0"
                      />
                      <ScopeSwitch checked={checked} />
                      <span>
                        <b className="block text-[0.95rem] font-semibold">
                          {copy.title}
                        </b>
                        <small className="text-[0.8rem] text-muted-foreground">
                          {copy.hint}
                        </small>
                      </span>
                    </label>
                  </li>
                );
              })}
            </ul>

            <p className="mb-[18px] text-[0.8rem] leading-[1.8] text-muted-foreground">
              {t("finePrint", { redirectHost: pending.redirectHost })}
            </p>

            {/* {pending.isLoopback ? (
              null
            ) : pending.isTrusted === false ? (
              <p
                role="alert"
                className="mb-[18px] rounded-xl bg-[#fdf1ef] px-3.5 py-2.5 text-[0.8rem] leading-[1.7] text-[#9b2c20]"
              >
                {t("untrustedWarning", { redirectHost: pending.redirectHost })}
              </p>
            ) : null} */}

            <div className="flex gap-2.5">
              <button
                type="button"
                disabled={busy || selected.length === 0}
                onClick={() => decide("approve")}
                className="btn btn-lg btn-solid flex-1"
              >
                {t("allow")}
              </button>
              <button
                type="button"
                disabled={busy}
                onClick={() => decide("deny")}
                className="btn btn-lg btn-outline px-6"
              >
                {t("deny")}
              </button>
            </div>
          </>
        )}
      </section>
    </main>
  );
}
