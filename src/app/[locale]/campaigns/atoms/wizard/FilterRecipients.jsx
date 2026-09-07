"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import toast from "react-hot-toast";
import { Loader2, RefreshCw } from "lucide-react";
import Button_ from "@/components/atoms/Button";
import { Bone } from "@/components/atoms/BannerSkeleton";
import api from "@/utils/api";
import { normalizeAxiosError } from "@/utils/axios";
import {
  AudienceFilterBuilder,
  emptyAudienceFilter,
  serializeAudienceFilter,
  countRules,
  collectInvalidRuleIds,
  buildAudienceFieldOptions,
} from "@/components/audience-filter";
import {
  EMPTY_AUDIENCE_LOOKUPS,
  fetchAudienceLookupKeys,
  lookupKeysForFields,
} from "@/components/audience-filter/lookups";
import { collectRuleFields } from "@/components/audience-filter/audience-filter.utils";

export default function FilterRecipients({ setValue, getValues }) {
  const ta = useTranslations("audienceFilter");
  const tOrders = useTranslations("orders");
  const tTags = useTranslations("tags");
  const t = useTranslations("campaigns.wizard");
  const locale = useLocale();

  const [metadata, setMetadata] = useState(null);
  const [loading, setLoading] = useState(false);
  const [lookupsRaw, setLookupsRaw] = useState(EMPTY_AUDIENCE_LOOKUPS);
  const [lookupLoading, setLookupLoading] = useState({});
  const [builderValue, setBuilderValue] = useState(() => getValues("audienceFilterRaw") || emptyAudienceFilter());
  const [count, setCount] = useState(null);
  const [countLoading, setCountLoading] = useState(false);
  const loadedKeys = useRef(new Set());
  const inflightKeys = useRef(new Set());

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        setLoading(true);
        const res = await api.get("/audience-filter/entities");
        if (!cancelled) setMetadata(res.data?.entities ? res.data : res.data?.data || res.data);
      } catch (error) {
        toast.error(normalizeAxiosError(error));
      } finally {
        setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const fieldOptions = useMemo(
    () => buildAudienceFieldOptions({ lookups: lookupsRaw, locale, tOrders, tTags, tAudience: ta }),
    [lookupsRaw, locale, tOrders, tTags, ta],
  );

  useEffect(() => {
    const keys = lookupKeysForFields(collectRuleFields(builderValue), { includeTenant: true });
    const missing = keys.filter((k) => !loadedKeys.current.has(k) && !inflightKeys.current.has(k));
    if (!missing.length) return undefined;
    missing.forEach((k) => inflightKeys.current.add(k));
    setLookupLoading((prev) => {
      const next = { ...prev };
      missing.forEach((k) => {
        next[k] = true;
      });
      return next;
    });
    let cancelled = false;
    (async () => {
      try {
        const loaded = await fetchAudienceLookupKeys(missing);
        if (cancelled) return;
        missing.forEach((k) => loadedKeys.current.add(k));
        setLookupsRaw((prev) => ({ ...prev, ...loaded }));
      } catch (error) {
        toast.error(normalizeAxiosError(error));
      } finally {
        missing.forEach((k) => inflightKeys.current.delete(k));
        if (!cancelled) {
          setLookupLoading((prev) => {
            const next = { ...prev };
            missing.forEach((k) => {
              delete next[k];
            });
            return next;
          });
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [builderValue]);

  const refreshPreview = async (value = builderValue) => {
    if (!metadata) return;
    if (countRules(value) < 1 || collectInvalidRuleIds(value).length) {
      setCount(null);
      return;
    }
    setCountLoading(true);
    try {
      const serialized = serializeAudienceFilter(value, metadata);
      const res = await api.post("/client-segments/preview", { audienceFilter: serialized });
      setCount(res.data?.count ?? res.data?.data?.count ?? 0);
      setValue("audienceFilter", serialized, { shouldDirty: true });
    } catch (error) {
      toast.error(normalizeAxiosError(error));
    } finally {
      setCountLoading(false);
    }
  };

  useEffect(() => {
    if (metadata && countRules(builderValue) >= 1) refreshPreview(builderValue);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [metadata]);

  const hasRules = useMemo(() => countRules(builderValue) >= 1, [builderValue]);

  return (
    <div className="space-y-3 rounded-xl border border-border p-4">
      {loading ? (
        <FilterBuilderSkeleton />
      ) : (
        <AudienceFilterBuilder
          value={builderValue}
          onChange={(v) => {
            setBuilderValue(v);
            setValue("audienceFilterRaw", v);
            if (countRules(v) >= 1 && !collectInvalidRuleIds(v).length) {
              const serialized = serializeAudienceFilter(v, metadata);
              setValue("audienceFilter", serialized, { shouldDirty: true });
            } else {
              setValue("audienceFilter", null);
              setCount(null);
            }
          }}
          metadata={metadata}
          lookups={fieldOptions}
          lookupsLoading={lookupLoading}
        />
      )}
      <div className="flex items-center justify-between gap-2 rounded-xl bg-muted/40 px-3 py-2">
        <p className="text-sm">
          {t("recipients.estimated")}:{" "}
          <span className="font-black tabular-nums">
            {countLoading ? <Loader2 size={14} className="inline animate-spin" /> : (count ?? "—")}
          </span>
        </p>
        <Button_
          size="sm"
          variant="outline"
          label={t("recipients.refreshPreview")}
          icon={<RefreshCw size={14} />}
          disabled={countLoading || !metadata || !hasRules}
          onClick={() => refreshPreview()}
        />
      </div>
    </div>
  );
}

function FilterBuilderSkeleton() {
  return (
    <div className="space-y-3" aria-hidden>
      <div className="flex items-center gap-2">
        <Bone className="h-9 w-28 rounded-md" />
        <Bone className="h-9 w-20 rounded-md" />
        <Bone className="h-9 w-24 rounded-md" />
      </div>
      {[0, 1].map((i) => (
        <div key={i} className="flex items-center gap-2 rounded-xl border border-border/60 p-3">
          <Bone className="h-10 flex-1 rounded-md" />
          <Bone className="h-10 w-28 rounded-md" />
          <Bone className="h-10 flex-1 rounded-md" />
          <Bone className="h-10 w-10 rounded-md" />
        </div>
      ))}
      <Bone className="h-9 w-32 rounded-md" />
    </div>
  );
}
