"use client";

import { useEffect, useMemo, useRef } from "react";
import { useTranslations } from "next-intl";
import { Trash2 } from "lucide-react";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ProductSkuSearchPopover } from "@/components/molecules/ProductSkuSearchPopover";
import Button_ from "@/components/atoms/Button";
import VariableInput from "@/components/ui/VariableInput";
import { inspectTemplateOrderLink } from "../campaignOrderUrl";
import { getCampaignPlaceholderChips } from "../campaignPlaceholders";

export default function StepOffer({ watch, setValue }) {
  const t = useTranslations("campaigns.wizard");
  const whatsapp = watch("whatsapp");
  const enablePurchasePage = watch("enablePurchasePage");
  const products = watch("products") || [];
  const inspect = useMemo(() => inspectTemplateOrderLink(whatsapp), [whatsapp]);
  const inspectKey = `${inspect.hasOrderUrlVariable ? 1 : 0}:${inspect.hasQuickReply ? 1 : 0}`;
  const lastInspectKey = useRef("");

  const customerVariables = useMemo(() => getCampaignPlaceholderChips(t), [t]);
  const variableProps = useMemo(
    () => ({
      disableHydrate: false,
      variables: customerVariables,
      popupTitle: t("message.placeholders.title"),
    }),
    [customerVariables, t],
  );

  const followupForced = inspect.qrOnly;
  const followupHidden = !inspect.hasQuickReply;
  const followupOn = followupForced || !!watch("orderReplyFollowupEnabled");
  const followupDefault = t("offer.followupDefault");
  console.log(("followupDefault", followupDefault));
  useEffect(() => {
    if (lastInspectKey.current === inspectKey) return;
    lastInspectKey.current = inspectKey;
    setValue("enablePurchasePage", inspect.orderLinkAvailable, { shouldDirty: true });
    if (!inspect.hasQuickReply) {
      setValue("orderReplyFollowupEnabled", false, { shouldDirty: true });
      return;
    }
    if (inspect.qrOnly) {
      setValue("orderReplyFollowupEnabled", true, { shouldDirty: true });
      if (!String(watch("orderReplyFollowupText") || "").trim()) {
        setValue("orderReplyFollowupText", followupDefault, { shouldDirty: true });
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [inspectKey, inspect.orderLinkAvailable, inspect.hasQuickReply, inspect.qrOnly, followupDefault, setValue]);

  const setEnable = (on) => {
    if (!inspect.orderLinkAvailable) return;
    setValue("enablePurchasePage", on, { shouldDirty: true });
    if (on && followupForced) {
      setValue("orderReplyFollowupEnabled", true, { shouldDirty: true });
      if (!String(watch("orderReplyFollowupText") || "").trim()) {
        setValue("orderReplyFollowupText", followupDefault, { shouldDirty: true });
      }
    }
    if (!on) {
      setValue("orderReplyFollowupEnabled", false, { shouldDirty: true });
    }
  };

  const handleSelectSku = (skus) => {
    const items = Array.isArray(skus) ? skus : [skus];
    const next = [...products];
    for (const sku of items) {
      if (!sku?.id) continue;
      const existing = next.findIndex((p) => p.variantId === sku.id);
      if (existing >= 0) {
        next[existing] = {
          ...next[existing],
          quantity: sku.quantity || next[existing].quantity || 1,
          price: sku.price ?? next[existing].price,
        };
      } else {
        next.push({
          variantId: sku.id,
          productId: sku.productId || null,
          name: sku.name || sku.productName || sku.sku || "Product",
          sku: sku.sku || sku.key || null,
          image: sku.image || sku.images?.[0] || null,
          quantity: sku.quantity || 1,
          price: Number(sku.price || 0),
        });
      }
    }
    setValue("products", next, { shouldDirty: true });
  };

  if (!inspect.orderLinkAvailable) {
    return (
      <div className="rounded-xl border border-dashed border-border p-6 space-y-3">
        <div className="text-center space-y-1">
          <h3 className="text-sm font-bold">{t("offer.title")}</h3>
          <p className="text-sm text-muted-foreground">{t("offer.unavailable")}</p>
        </div>
        <ul className="mx-auto max-w-md list-disc space-y-1 ps-5 text-sm text-muted-foreground">
          {!inspect.hasOrderUrlVariable && <li>{t("offer.needOrderLinkVariable")}</li>}
          {!inspect.hasQuickReply && <li>{t("offer.needCustomButton")}</li>}
        </ul>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div>
        <h3 className="text-sm font-bold">{t("offer.title")}</h3>
        <p className="text-xs text-muted-foreground">{t("offer.subtitle")}</p>
      </div>

      <div className="flex items-center justify-between gap-3 rounded-xl border border-border p-4">
        <div>
          <p className="text-sm font-semibold">{t("offer.enable")}</p>
          <p className="text-xs text-muted-foreground">{t("offer.enableHint")}</p>
        </div>
        <Switch checked={!!enablePurchasePage} onCheckedChange={setEnable} />
      </div>

      {enablePurchasePage && (
        <>
          <div className="rounded-xl border border-border p-4 space-y-3 overflow-hidden">
            <p className="text-xs font-black uppercase tracking-widest text-muted-foreground">{t("offer.products")}</p>
            <div className="min-w-0 w-full">
              <ProductSkuSearchPopover
                className="block w-full min-w-0"
                handleSelectSku={handleSelectSku}
                selectedSkus={products.map((p) => ({ id: p.variantId }))}
                closeOnSelect={false}
              />
            </div>
            {!products.length && <p className="text-sm text-muted-foreground">{t("offer.noProducts")}</p>}
            <div className="space-y-2">
              {products.map((p, index) => (
                <div key={`${p.variantId}-${index}`} className="grid grid-cols-1 sm:grid-cols-[minmax(0,1fr)_88px_120px_auto] gap-2 items-end rounded-xl border border-border px-3 py-2">
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium">{p.name}</p>
                    {p.sku && <p className="text-[11px] text-muted-foreground" dir="ltr">{p.sku}</p>}
                  </div>
                  <div className="space-y-1">
                    <Label className="text-[11px] text-muted-foreground">{t("offer.quantity")}</Label>
                    <Input
                      type="number"
                      min={1}
                      value={p.quantity}
                      onChange={(e) => {
                        const next = [...products];
                        next[index] = { ...p, quantity: Math.max(1, Number(e.target.value || 1)) };
                        setValue("products", next, { shouldDirty: true });
                      }}
                    />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-[11px] text-muted-foreground">{t("offer.salePrice")}</Label>
                    <Input
                      type="number"
                      min={0}
                      step="0.01"
                      value={p.price}
                      onChange={(e) => {
                        const next = [...products];
                        next[index] = { ...p, price: Number(e.target.value || 0) };
                        setValue("products", next, { shouldDirty: true });
                      }}
                    />
                  </div>
                  <Button_
                    type="button"
                    size="icon"
                    variant="ghost"
                    icon={<Trash2 size={16} />}
                    onClick={() => setValue("products", products.filter((_, i) => i !== index), { shouldDirty: true })}
                  />
                </div>
              ))}
            </div>
          </div>

          <div className="space-y-1.5">
            <Label>{t("offer.shipping")}</Label>
            <Input
              type="number"
              min={0}
              step="0.01"
              value={watch("shippingPrice") ?? 0}
              onChange={(e) => setValue("shippingPrice", Number(e.target.value || 0), { shouldDirty: true })}
            />
          </div>

          {!followupHidden && (
            <div className="rounded-xl border border-border p-4 space-y-3">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="text-sm font-semibold">{t("offer.followup")}</p>
                  <p className="text-xs text-muted-foreground">
                    {followupForced ? t("offer.followupForced") : t("offer.followupHint")}
                  </p>
                </div>
                <Switch
                  checked={followupOn}
                  disabled={followupForced}
                  onCheckedChange={(on) => {
                    setValue("orderReplyFollowupEnabled", on, { shouldDirty: true });
                    if (on && !String(watch("orderReplyFollowupText") || "").trim()) {
                      setValue("orderReplyFollowupText", followupDefault, { shouldDirty: true });
                    }
                  }}
                />
              </div>
              {followupOn && (
                <>
                  <div className="space-y-1.5">
                    <Label>{t("offer.quickReply")}</Label>
                    <Select
                      value={
                        watch("orderReplyFollowupButtonIndex") == null
                          ? ""
                          : String(watch("orderReplyFollowupButtonIndex"))
                      }
                      onValueChange={(v) =>
                        setValue("orderReplyFollowupButtonIndex", Number(v), { shouldDirty: true })
                      }
                    >
                      <SelectTrigger>
                        <SelectValue placeholder={t("offer.chooseQuickReply")} />
                      </SelectTrigger>
                      <SelectContent>
                        {inspect.quickReplies.map((btn) => (
                          <SelectItem key={btn.index} value={String(btn.index)}>
                            {btn.text || `#${btn.index + 1}`}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-1.5">
                    <Label>{t("offer.followupText")}</Label>
                    <VariableInput
                      multiline
                      rows={4}
                      value={watch("orderReplyFollowupText") || ""}
                      onChange={(value) => setValue("orderReplyFollowupText", value, { shouldDirty: true })}
                      {...variableProps}
                    />
                    <p className="text-[11px] text-muted-foreground">{t("offer.followupTextHint")}</p>
                  </div>
                </>
              )}
            </div>
          )}
        </>
      )}
    </div>
  );
}
