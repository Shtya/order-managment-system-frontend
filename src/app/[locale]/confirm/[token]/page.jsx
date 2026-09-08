"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useParams } from "next/navigation";
import { useLocale, useTranslations } from "next-intl";
import { usePathname, useRouter } from "@/i18n/navigation";
import {
  Check,
  ChevronDown,
  Copy,
  Globe,
  Info,
  Lock,
  MapPin,
  Package,
  ShoppingBag,
  Truck,
  User,
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { PrimaryBtn } from "@/components/atoms/Button";
import { Bone } from "@/components/atoms/BannerSkeleton";
import { avatarSrc } from "@/components/atoms/UserSelect";
import { cn } from "@/utils/cn";
import BrandLogo from "@/components/atoms/BrandLogo";

const API_BASE = process.env.NEXT_PUBLIC_BASE_URL || "";

function locName(item, locale) {
  if (!item) return "";
  return locale === "ar" ? item.nameAr || item.nameEn : item.nameEn || item.nameAr;
}

function money(amount, currency) {
  return `${Number(amount || 0).toLocaleString("en-US", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  })} ${currency}`;
}

function PageHeader({ locale }) {
  const pathname = usePathname();
  const router = useRouter();
  const next = locale === "ar" ? "en" : "ar";

  return (
    <header className="sticky top-0 z-20 flex h-[56px] items-center justify-between border-b border-border bg-white px-[5%] max-sm:px-4">
      <BrandLogo />
      <button
        type="button"
        onClick={() => router.replace(pathname, { locale: next })}
        className="inline-flex items-center gap-2 rounded-full border border-border bg-white px-4 py-2 text-[13px] text-muted-foreground"
      >
        <Globe className="h-4 w-4" />
        {locale === "ar" ? "العربية" : "English"}
        {/* <ChevronDown className="h-3.5 w-3.5" /> */}
      </button>
    </header>
  );
}

function SectionTitle({ icon: Icon, children }) {
  return (
    <div className="mb-3.5 flex items-center gap-2 text-base font-bold">
      <span className="grid h-[30px] w-[30px] place-items-center rounded-[9px] bg-primary/10 text-primary">
        <Icon className="h-3.5 w-3.5" />
      </span>
      {children}
    </div>
  );
}

function ProductRows({ products, currency, t }) {
  return (
    <div className="divide-y divide-border rounded-[10px] border border-border px-3.5">
      {(products || []).map((p, i) => (
        <div key={`${p.sku || p.name}-${i}`} className="grid grid-cols-[64px_1fr_auto] items-center gap-3 py-4 max-sm:grid-cols-[55px_1fr]">
          {p.image ? (
            <img
              src={avatarSrc(p.image)}
              alt=""
              className="h-16 w-16 rounded-[9px] object-cover bg-muted max-sm:h-[55px] max-sm:w-[55px]"
            />
          ) : (
            <div className="grid h-16 w-16 place-items-center rounded-[9px] bg-muted text-muted-foreground max-sm:h-[55px] max-sm:w-[55px]">
              <Package className="h-5 w-5" />
            </div>
          )}
          <div className="min-w-0">
            <p className="text-[13px] font-bold leading-snug">{p.name}</p>
            <p className="mt-1 text-[11px] text-muted-foreground">
              {t("quantity")}: {Number(p.quantity || 1)}
            </p>
          </div>
          <p className="self-end whitespace-nowrap text-sm font-bold max-sm:col-start-2">
            {money(Number(p.price || 0) * Number(p.quantity || 1), currency)}
          </p>
        </div>
      ))}
    </div>
  );
}

function TotalsCard({ data, currency, t }) {
  const productsTotal = (data.products || []).reduce(
    (sum, p) => sum + Number(p.price || 0) * Number(p.quantity || 1),
    0,
  );
  return (
    <div className="mt-4 space-y-1.5 rounded-[10px] bg-primary/[0.04] p-4">
      <div className="flex justify-between py-1 text-[13px]">
        <span>{t("subtotal")}</span>
        <span className="font-semibold tabular-nums">{money(productsTotal, currency)}</span>
      </div>
      <div className="flex justify-between py-1 text-[13px]">
        <span>{t("shipping")}</span>
        <span className="font-semibold tabular-nums">{money(data.shippingPrice, currency)}</span>
      </div>
      {/* <div className="flex justify-between py-1 text-[13px] text-emerald-600">
        <span>{t("discount")}</span>
        <span className="font-semibold tabular-nums">{money(0, currency)}</span>
      </div> */}
      <div className="mt-2 flex items-center justify-between border-t border-border pt-3 text-[17px] font-extrabold">
        <span>{t("total")}</span>
        <span className="text-[21px] text-primary tabular-nums">{money(data.total, currency)}</span>
      </div>
    </div>
  );
}

function Field({ label, children, className }) {
  return (
    <div className={cn("space-y-1.5", className)}>
      <Label className="text-xs font-semibold text-muted-foreground">{label}</Label>
      {children}
    </div>
  );
}

function PageSkeleton() {
  return (
    <div className="min-h-screen bg-card">
      <header className="flex h-[56px] items-center justify-between border-b border-border bg-white px-[5%]">
        <Bone className="h-8 w-28" />
        <Bone className="h-9 w-28 rounded-full" />
      </header>
      <main className="mx-auto grid max-w-[1280px] gap-5 px-5 py-8 lg:grid-cols-[1.5fr_.9fr]">
        <div className="space-y-5 rounded-[14px] border border-border bg-white p-7">
          <Bone className="h-8 w-56" />
          <Bone className="h-4 w-80" />
          <div className="grid gap-3 sm:grid-cols-2">
            <Bone className="h-11" />
            <Bone className="h-11" />
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            <Bone className="h-11" />
            <Bone className="h-11" />
          </div>
          <Bone className="h-11" />
          <Bone className="h-24" />
          <Bone className="h-12" />
        </div>
        <div className="space-y-4 rounded-[14px] border border-border bg-white p-5">
          <Bone className="h-7 w-40" />
          {[1, 2, 3].map((i) => (
            <div key={i} className="flex gap-3">
              <Bone className="h-16 w-16 shrink-0" />
              <div className="flex-1 space-y-2">
                <Bone className="h-4 w-3/4" />
                <Bone className="h-3 w-1/3" />
              </div>
            </div>
          ))}
          <Bone className="h-32" />
        </div>
      </main>
    </div>
  );
}

export default function PublicCampaignOrderPage() {
  const t = useTranslations("campaigns.orderPage");
  const locale = useLocale();
  const params = useParams();
  const token = params?.token;
  const currency = t("currency");

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [copied, setCopied] = useState(false);
  const [data, setData] = useState(null);
  const [cities, setCities] = useState([]);
  const [areas, setAreas] = useState([]);
  const [areasLoading, setAreasLoading] = useState(false);
  const [form, setForm] = useState({
    customerName: "",
    address: "",
    landmark: "",
    cityId: "",
    areaId: "",
    customerNotes: "",
  });
  const savedAreaRef = useRef({ areaId: "", area: "" });

  useEffect(() => {
    if (!token) return;
    let cancelled = false;
    (async () => {
      setLoading(true);
      try {
        const [orderRes, citiesRes] = await Promise.all([
          fetch(`${API_BASE}/public/campaign-orders/${token}`),
          fetch(`${API_BASE}/cities`),
        ]);
        if (!orderRes.ok) throw new Error("unavailable");
        const json = await orderRes.json();
        const cityList = citiesRes.ok ? await citiesRes.json() : [];
        if (cancelled) return;
        setData(json);
        setCities(Array.isArray(cityList) ? cityList : []);
        setForm({
          customerName: json.customerName || "",
          address: json.address || "",
          landmark: json.landmark || "",
          cityId: json.cityId || "",
          areaId: "",
          customerNotes: json.customerNotes || "",
        });
        savedAreaRef.current = {
          areaId: json.areaId || "",
          area: json.area || "",
        };
      } catch {
        if (!cancelled) setError("unavailable");
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [token]);

  useEffect(() => {
    if (!form.cityId) {
      setAreas([]);
      return;
    }
    let cancelled = false;
    (async () => {
      setAreasLoading(true);
      try {
        const res = await fetch(`${API_BASE}/cities/${form.cityId}/areas`);
        const list = res.ok ? await res.json() : [];
        if (cancelled) return;
        const nextAreas = Array.isArray(list) ? list : [];
        setAreas(nextAreas);
        setForm((f) => {
          const saved = savedAreaRef.current;
          const byId = nextAreas.find((a) => a.id === saved.areaId || a.id === f.areaId);
          const areaName = String(saved.area || data?.area || "")
            .trim()
            .toLowerCase();
          const byName = areaName
            ? nextAreas.find(
                (a) =>
                  String(a.nameAr || "").trim().toLowerCase() === areaName ||
                  String(a.nameEn || "").trim().toLowerCase() === areaName,
              )
            : null;
          return { ...f, areaId: byId?.id || byName?.id || "" };
        });
      } catch {
        if (!cancelled) setAreas([]);
      } finally {
        if (!cancelled) setAreasLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [form.cityId, data?.area]);

  const selectedCity = useMemo(
    () => cities.find((c) => c.id === form.cityId),
    [cities, form.cityId],
  );
  const selectedArea = useMemo(
    () => areas.find((a) => a.id === form.areaId),
    [areas, form.areaId],
  );

  const submit = async (e) => {
    e.preventDefault();
    if (!form.cityId) return;
    setSubmitting(true);
    setError("");
    try {
      const res = await fetch(`${API_BASE}/public/campaign-orders/${token}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          customerName: form.customerName,
          address: form.address,
          landmark: form.landmark || undefined,
          city: locName(selectedCity, locale) || data?.city,
          cityId: form.cityId,
          area: locName(selectedArea, locale) || undefined,
          areaId: form.areaId || undefined,
          customerNotes: form.customerNotes || undefined,
        }),
      });
      if (res.status === 409) {
        const again = await fetch(`${API_BASE}/public/campaign-orders/${token}`);
        if (again.ok) setData(await again.json());
        else setData((prev) => ({ ...prev, alreadyOrdered: true }));
        return;
      }
      if (!res.ok) throw new Error("submit");
      const json = await res.json();
      setData((prev) => ({ ...prev, ...json, alreadyOrdered: true }));
    } catch {
      setError("submit");
    } finally {
      setSubmitting(false);
    }
  };

  const copyOrderNumber = async () => {
    if (!data?.orderNumber) return;
    try {
      await navigator.clipboard.writeText(String(data.orderNumber));
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      /* ignore */
    }
  };

  if (loading) return <PageSkeleton />;

  if (error === "unavailable" || !data) {
    return (
      <div className="min-h-screen bg-card">
        <PageHeader locale={locale} />
        <div className="grid min-h-[60vh] place-items-center p-6">
          <p className="text-sm text-muted-foreground">{t("unavailable")}</p>
        </div>
      </div>
    );
  }

  const receipt = data.alreadyOrdered;

  return (
    <div className="min-h-screen bg-card">
      <PageHeader locale={locale} />
      <main className="mx-auto max-w-[1280px] px-5 py-8 max-sm:px-3 max-sm:py-4">
        {receipt && (
          <div className="mb-8 text-center">
            <div className="mx-auto mb-4 grid h-16 w-16 place-items-center rounded-full bg-emerald-500 text-white">
              <Check className="h-8 w-8" strokeWidth={3} />
            </div>
            <h1 className="text-2xl font-black">{t("thanksTitle")}</h1>
            <p className="mx-auto mt-2 max-w-xl text-sm text-muted-foreground">{t("thanksBody")}</p>
            {/* {data.orderNumber && (
              <div className="mt-4 inline-flex items-center gap-2">
                <span className="text-sm text-muted-foreground">{t("orderNumber")}</span>
                <button
                  type="button"
                  onClick={copyOrderNumber}
                  className="inline-flex items-center gap-2 rounded-full border border-border bg-muted/60 px-3 py-1 text-sm font-semibold"
                >
                  #{data.orderNumber}
                  <Copy className="h-3.5 w-3.5 text-muted-foreground" />
                </button>
                {copied && <span className="text-xs text-emerald-600">{t("copied")}</span>}
              </div>
            )} */}
          </div>
        )}

        <div className="grid gap-5 lg:grid-cols-[1.5fr_.9fr]">
          {receipt ? (
            <section className="rounded-[14px] border border-border bg-white p-7 shadow-[0_3px_16px_rgba(35,36,70,.035)] max-sm:p-4">
              <div className="mb-1 flex items-center gap-3">
                <span className="grid h-10 w-10 place-items-center rounded-full bg-primary/10 text-primary">
                  <Package className="h-5 w-5" />
                </span>
                <h2 className="text-[23px] font-bold">{t("receiptTitle")}</h2>
              </div>
              <p className="mb-5 ms-[52px] text-[13px] text-muted-foreground max-sm:ms-0">{t("receiptSubtitle")}</p>

              <div className="border-t border-border pt-5">
                <div className="mb-3 flex items-center justify-between">
                  <p className="text-base font-bold">{t("productsTitle")}</p>
                  <span className="inline-flex items-center gap-1.5 text-sm text-muted-foreground">
                    <ShoppingBag className="h-4 w-4" />
                    {t("products")}
                  </span>
                </div>
                <ProductRows products={data.products} currency={currency} t={t} />
              </div>

              {/* <div className="mt-5 flex gap-3 rounded-[10px] border border-primary/20 bg-primary/[0.06] p-4">
                <Info className="mt-0.5 h-5 w-5 shrink-0 text-primary" />
                <div>
                  <p className="font-bold">{t("smsHintTitle")}</p>
                  <p className="mt-1 text-sm text-muted-foreground">{t("smsHint")}</p>
                </div>
              </div> */}
            </section>
          ) : (
            <form
              onSubmit={submit}
              className="rounded-[14px] border border-border bg-white p-7 shadow-[0_3px_16px_rgba(35,36,70,.035)] max-sm:p-4"
            >
              <div className="mb-1 flex items-center gap-3">
                <span className="grid h-10 w-10 place-items-center rounded-full bg-primary/10 text-sm font-bold text-primary">
                  1
                </span>
                <h1 className="text-[23px] font-bold">{t("title")}</h1>
              </div>
              <p className="mb-5 ms-[52px] text-[13px] text-muted-foreground max-sm:ms-0">{t("subtitle")}</p>

              <div className="border-t border-border pt-5">
                <SectionTitle icon={User}>{t("customerSection")}</SectionTitle>
                <div className="grid gap-3.5 sm:grid-cols-2">
                  <Field label={t("name")}>
                    <Input
                      required
                      value={form.customerName}
                      onChange={(e) => setForm((f) => ({ ...f, customerName: e.target.value }))}
                    />
                  </Field>
                  <Field label={t("phone")}>
                    <Input value={data.phoneNumber || ""} readOnly dir="ltr" className="text-start" />
                  </Field>
                </div>
                {/* <div className="mt-3 flex gap-2.5 rounded-[10px] border border-primary/20 bg-primary/[0.06] p-3.5">
                  <Info className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                  <p className="text-[13px] leading-relaxed text-muted-foreground">{t("phoneHint")}</p>
                </div> */}
              </div>

              <div className="mt-5 border-t border-border pt-5">
                <SectionTitle icon={MapPin}>{t("addressSection")}</SectionTitle>
                <div className="grid gap-3.5 sm:grid-cols-2">
                  <Field label={t("city")}>
                    <Select
                      value={form.cityId || undefined}
                      onValueChange={(cityId) => {
                        savedAreaRef.current = { areaId: "", area: "" };
                        setForm((f) => ({ ...f, cityId, areaId: "" }));
                      }}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder={t("selectCity")} />
                      </SelectTrigger>
                      <SelectContent>
                        {cities.map((city) => (
                          <SelectItem key={city.id} value={city.id}>
                            {locName(city, locale)}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <input required tabIndex={-1} className="sr-only" value={form.cityId} onChange={() => {}} />
                  </Field>
                  <Field label={t("area")}>
                    <Select
                      key={`${form.cityId}-${areas.map((a) => a.id).join(",")}`}
                      value={areas.some((a) => a.id === form.areaId) ? form.areaId : undefined}
                      onValueChange={(areaId) => {
                        savedAreaRef.current = { ...savedAreaRef.current, areaId };
                        setForm((f) => ({ ...f, areaId }));
                      }}
                      disabled={!form.cityId || areasLoading}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder={t("selectArea")} />
                      </SelectTrigger>
                      <SelectContent>
                        {areas.map((area) => (
                          <SelectItem key={area.id} value={area.id}>
                            {locName(area, locale)}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    {areas.length > 0 && (
                      <input required tabIndex={-1} className="sr-only" value={form.areaId} onChange={() => {}} />
                    )}
                  </Field>
                  <Field label={t("address")} className="sm:col-span-2">
                    <Textarea
                      required
                      value={form.address}
                      onChange={(e) => setForm((f) => ({ ...f, address: e.target.value }))}
                    />
                  </Field>
                  <Field label={t("landmark")} className="sm:col-span-2">
                    <Input
                      value={form.landmark}
                      placeholder={t("landmarkPlaceholder")}
                      onChange={(e) => setForm((f) => ({ ...f, landmark: e.target.value }))}
                    />
                  </Field>
                </div>
              </div>

              <div className="mt-5 border-t border-border pt-5">
                <SectionTitle icon={Info}>
                  {t("notesSection")}{" "}
                  <small className="font-normal text-muted-foreground">{t("notesOptional")}</small>
                </SectionTitle>
                <Textarea
                  value={form.customerNotes}
                  placeholder={t("notesPlaceholder")}
                  onChange={(e) => setForm((f) => ({ ...f, customerNotes: e.target.value }))}
                />
              </div>

              {error === "submit" && <p className="mt-3 text-sm text-red-500">{t("submitFailed")}</p>}

              <PrimaryBtn type="submit" loading={submitting} className="mt-5 w-full">
                {t("submit")}
              </PrimaryBtn>
            </form>
          )}

          <aside className="h-max space-y-4 lg:sticky lg:top-24">
            <div className="rounded-[14px] border border-border bg-white p-5 shadow-[0_3px_16px_rgba(35,36,70,.035)]">
              <div className="mb-4 flex items-start justify-between gap-3">
                <div>
                  <h2 className="text-xl font-bold">{t("summaryTitle")}</h2>
                  {!receipt && <p className="mt-1 text-[11px] text-muted-foreground">{t("summarySubtitle")}</p>}
                </div>
                <span className="grid h-10 w-10 place-items-center rounded-[10px] bg-primary/10 text-primary">
                  <ShoppingBag className="h-5 w-5" />
                </span>
              </div>
              {!receipt && <ProductRows products={data.products} currency={currency} t={t} />}
              <TotalsCard data={data} currency={currency} t={t} />
              {!receipt && (
                <div className="mt-4 flex flex-wrap justify-center gap-4 text-[10px] text-muted-foreground">
                  <span className="inline-flex items-center gap-1"><Lock className="h-3 w-3" />{t("secure")}</span>
                  {/* <span>✓ {t("cod")}</span> */}
                  <span className="inline-flex items-center gap-1"><Truck className="h-3 w-3" />{t("reliable")}</span>
                </div>
              )}
            </div>

            {receipt && (
              <>
                <div className="rounded-[14px] border border-border bg-white p-5">
                  <h3 className="mb-3 text-base font-bold">{t("customerInfo")}</h3>
                  <dl className="space-y-2 text-sm">
                    <div className="flex justify-between gap-3">
                      <dt className="text-muted-foreground">{t("name")}</dt>
                      <dd className="font-medium">{data.customerName}</dd>
                    </div>
                    <div className="flex justify-between gap-3">
                      <dt className="text-muted-foreground">{t("phone")}</dt>
                      <dd className="font-medium" dir="ltr">{data.phoneNumber}</dd>
                    </div>
                  </dl>
                </div>
                <div className="rounded-[14px] border border-border bg-white p-5">
                  <h3 className="mb-3 text-base font-bold">{t("shippingAddress")}</h3>
                  <dl className="space-y-2 text-sm">
                    <div className="flex justify-between gap-3">
                      <dt className="text-muted-foreground">{t("city")}</dt>
                      <dd className="font-medium text-end">{locName(selectedCity, locale) || data.city}</dd>
                    </div>
                    <div className="flex justify-between gap-3">
                      <dt className="text-muted-foreground">{t("area")}</dt>
                      <dd className="font-medium text-end">{locName(selectedArea, locale) || data.area}</dd>
                    </div>
                    <div className="flex justify-between gap-3">
                      <dt className="text-muted-foreground">{t("address")}</dt>
                      <dd className="font-medium text-end whitespace-pre-wrap">{data.address}</dd>
                    </div>
                    {data.landmark ? (
                      <div className="flex justify-between gap-3">
                        <dt className="text-muted-foreground">{t("landmark")}</dt>
                        <dd className="font-medium text-end">{data.landmark}</dd>
                      </div>
                    ) : null}
                    {data.customerNotes ? (
                      <div className="flex justify-between gap-3">
                        <dt className="text-muted-foreground">{t("notesSection")}</dt>
                        <dd className="font-medium text-end">{data.customerNotes}</dd>
                      </div>
                    ) : null}
                  </dl>
                </div>
              </>
            )}
          </aside>
        </div>
      </main>
    </div>
  );
}
