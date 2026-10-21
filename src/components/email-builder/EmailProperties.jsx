"use client";
import { useTranslations } from "next-intl";
import { useEffect, useMemo, useState } from "react";
import dynamic from "next/dynamic";
import {
  AlignCenter,
  AlignJustify,
  AlignLeft,
  AlignRight,
  CheckCircle2,
  Link,
  Settings2,
  ShoppingBag,
  UploadCloud,
  X,
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  ColorField,
  Field,
  FONTS,
  IconButton,
  NumberField,
  RangeField,
  SectionTitle,
  Segmented,
  VariableMenu,
} from "./parts";
import { VariableInput } from "@/components/ui/VariableInput";
import { getCampaignPlaceholderChips } from "@/app/[locale]/campaigns/atoms/campaignPlaceholders";
import { BLOCK_ICONS } from "./EmailBlocksPanel";

const RichText = dynamic(() => import("./RichText"), { ssr: false });
const TableEditor = dynamic(() => import("./TableEditor"), { ssr: false });
const ORDER_URL = "{{campaign.orderUrl}}";

function showNumeric(key, type) {
  if (type === "spacer") return false;
  if (["paragraphSpacing", "indent"].includes(key)) return type === "text";
  if (key === "spacing" || key === "minHeight") return type === "button";
  if (key === "width")
    return ["button", "image", "video", "document", "column", "table", "divider"].includes(type);
  if (key === "height") return ["image", "video", "document"].includes(type);
  if (["fontSize", "fontWeight", "lineHeight", "letterSpacing"].includes(key))
    return ["text", "button", "table"].includes(type);
  if (["borderWidth", "borderRadius"].includes(key))
    return type !== "table" && !(type === "divider" && key === "borderRadius");
  return true;
}

function FontSelect({ label, value, onChange }) {
  return (
    <Field label={label}>
      <Select value={value || "Cairo"} onValueChange={onChange}>
        <SelectTrigger aria-label={label}>
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {FONTS.map((font) => (
            <SelectItem key={font} value={font}>
              <span style={{ fontFamily: font }}>{font}</span>
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </Field>
  );
}

function TextField({ id, label, value, onChange, variables, placeholder, type }) {
  return (
    <Field id={id} label={label}>
      <div className="relative">
        <Input
          id={id}
          type={type}
          value={value || ""}
          placeholder={placeholder}
          dir={type === "url" ? "ltr" : undefined}
          onChange={(e) => onChange(e.target.value)}
          className={variables ? "ltr:!pr-28 rtl:!pl-28" : undefined}
        />
        {variables && (
          <div className="absolute inset-y-0 end-1.5 flex items-center">
            <VariableMenu
              size="xs"
              onPick={(key) => onChange(`${value || ""}{{${key}}}`)}
            />
          </div>
        )}
      </div>
    </Field>
  );
}

function EmailSettings({ doc, onCommitDoc }) {
  const t = useTranslations("emailBuilder");
  const defaults = doc.defaults || {};
  const setDefault = (key, value) =>
    onCommitDoc({ ...doc, defaults: { ...defaults, [key]: value } });
  return (
    <div className="space-y-4">
      <p className="text-xs text-muted-foreground">{t("panel.emailSettingsHint")}</p>
      <Field label={t("properties.direction")}>
        <Segmented
          className="w-full"
          label={t("properties.direction")}
          value={doc.direction || "ltr"}
          onChange={(direction) => onCommitDoc({ ...doc, direction })}
          options={[
            { value: "ltr", label: "LTR" },
            { value: "rtl", label: "RTL" },
          ]}
        />
      </Field>
      <RangeField
        label={t("properties.width")}
        min={320}
        max={800}
        step={10}
        value={doc.width || 600}
        onChange={(width) => onCommitDoc({ ...doc, width })}
      />
      <div className="space-y-3 rounded-xl border border-border bg-muted/30 p-3">
        <SectionTitle>{t("properties.defaults")}</SectionTitle>
        <FontSelect
          label={t("properties.fontFamily")}
          value={defaults.fontFamily}
          onChange={(v) => setDefault("fontFamily", v)}
        />
        <NumberField
          id="email-default-size"
          label={t("properties.fontSize")}
          min={8}
          max={72}
          value={defaults.fontSize || 16}
          onChange={(v) => setDefault("fontSize", v)}
        />
        <ColorField
          label={t("properties.color")}
          value={defaults.color}
          onChange={(v) => setDefault("color", v)}
        />
      </div>
    </div>
  );
}

function ContentPane({
  current,
  elements,
  assets,
  busy,
  onChange,
  onRichChange,
  onTableChange,
  onAsset,
  onError,
  onUpload,
  onMoveToColumn,
  onColumns,
  tablesEnabled,
  focusRequested,
  onFocusHandled,
}) {
  const tw = useTranslations("campaigns.wizard");
  const t = useTranslations("emailBuilder");
  const chips = useMemo(() => getCampaignPlaceholderChips(tw), [tw]);
  const type = current.type;
  const columns = elements.filter((n) => n.type === "column");
  const asset = assets[current.assetId];
  const thumbnailAsset = assets[current.thumbnailAssetId];
  const orderMode = current.url === ORDER_URL;
  useEffect(() => {
    if (!focusRequested || type !== "button") return;
    let attempts = 0;
    let frame;
    const focus = () => {
      const target = document.getElementById("email-prop-label");
      if (!target && attempts++ < 20) {
        frame = requestAnimationFrame(focus);
        return;
      }
      if (target) {
        target.focus();
        const selection = window.getSelection();
        const range = document.createRange();
        range.selectNodeContents(target);
        selection?.removeAllRanges();
        selection?.addRange(range);
      }
      onFocusHandled?.();
    };
    frame = requestAnimationFrame(focus);
    return () => cancelAnimationFrame(frame);
  }, [focusRequested, onFocusHandled, type]);
  return (
    <div className="space-y-4">
      {["text", "document"].includes(type) && (
        <RichText
          key={current.id}
          value={current.content}
          onChange={onRichChange}
          variables={chips}
          popupTitle={tw("message.placeholders.title")}
          autoFocus={focusRequested}
          onAutoFocus={onFocusHandled}
        />
      )}
      {type === "table" && tablesEnabled && (
        <TableEditor
          key={current.id}
          value={current.content}
          onChange={onTableChange}
          onAsset={onAsset}
          onError={onError}
        />
      )}
      {type === "button" && (
        <>
          <Field
            id="email-prop-label"
            label={t("properties.label")}
            description={t("descriptions.buttonLabel")}
          >
            <VariableInput
              id="email-prop-label"
              value={current.label || ""}
              onChange={(label) => onChange({ label })}
              variables={chips}
              popupTitle={tw("message.placeholders.title")}
              placeholder=""
            />
          </Field>
          <Field label={t("properties.link")}>
            <Segmented
              className="w-full"
              label={t("properties.link")}
              value={orderMode ? "order" : "custom"}
              onChange={(mode) =>
                onChange({
                  url: mode === "order" ? ORDER_URL : "https://",
                })
              }
              options={[
                { value: "order", label: t("properties.orderPage"), icon: ShoppingBag },
                { value: "custom", label: t("properties.customUrl"), icon: Link },
              ]}
            />
            {orderMode ? (
              <div className="flex items-start gap-2 rounded-xl border border-primary/20 bg-primary/5 p-3">
                <CheckCircle2 size={16} className="mt-px shrink-0 text-primary" />
                <p className="text-xs">{t("properties.orderPageHint")}</p>
              </div>
            ) : (
              <Input
                aria-label={t("properties.link")}
                type="url"
                dir="ltr"
                placeholder="https://"
                value={current.url || ""}
                onChange={(e) => onChange({ url: e.target.value })}
              />
            )}
          </Field>
        </>
      )}
      {["image", "video", "document"].includes(type) && (
        <>
          <Field label={t("properties.source")} description={t(`descriptions.${type}`)}>
            <Segmented
              className="w-full"
              label={t("properties.source")}
              value={current.sourceType || "upload"}
              onChange={(sourceType) => onChange({
                sourceType,
                ...(sourceType === "remote" ? { assetId: "" } : { sourceUrl: "" }),
                ...(type === "video" && (current.thumbnailSourceType || "auto") === "auto"
                  ? { thumbnailUrl: "" }
                  : {}),
              })}
              options={[{ value: "upload", label: t("properties.upload") }, { value: "remote", label: t("properties.directLink"), icon: Link }]}
            />
          </Field>
          {(current.sourceType || "upload") === "upload" ? <label className="block cursor-pointer space-y-2 rounded-xl border-2 border-dashed border-border p-5 text-center transition hover:border-primary">
            <span className="mx-auto grid h-10 w-10 place-items-center rounded-full bg-primary/10 text-primary">
              <UploadCloud size={20} />
            </span>
            <p className="text-sm font-semibold">
              {asset ? t("properties.replaceFile") : t("properties.chooseFile")}
            </p>
            <p className="text-[11px] text-muted-foreground">{t(`properties.${type}Types`)}</p>
            <input
              type="file"
              className="sr-only"
              aria-label={t("properties.upload")}
              accept={type === "image" ? "image/jpeg,image/png,image/gif,image/webp" : type === "video" ? "video/mp4,video/webm,video/quicktime" : ".pdf,.docx,.xlsx,.pptx,.csv,.txt"}
              disabled={busy}
              onChange={(e) => {
                onUpload(e.target.files?.[0], type);
                e.target.value = "";
              }}
            />
          </label> : <TextField id="email-prop-source-url" label={t("properties.directLink")} type="url" placeholder="https://" value={current.sourceUrl} onChange={(sourceUrl) => onChange({ sourceUrl })} />}
          {asset && (
            <div className="space-y-1 rounded-lg bg-muted/50 px-3 py-2 text-xs">
              <div className="flex justify-between gap-2">
                <span className="truncate" dir="auto">{asset.originalName || asset.format}</span>
                <span className="shrink-0 font-semibold text-primary">{Math.round((asset.bytes || asset.variants?.at(-1)?.bytes || 0) / 1024)} KB</span>
              </div>
            </div>
          )}
          {type === "video" && (
            <div className="space-y-3 rounded-xl border border-border bg-muted/30 p-3">
              <Field label={t("properties.thumbnail")} description={t("properties.thumbnailHint")}>
                <Segmented
                  className="w-full"
                  label={t("properties.thumbnail")}
                  value={current.thumbnailSourceType || "auto"}
                  onChange={(thumbnailSourceType) => onChange({
                    thumbnailSourceType,
                    ...(thumbnailSourceType === "upload" ? { thumbnailUrl: "" } : {}),
                    ...(thumbnailSourceType === "remote" ? { thumbnailAssetId: "" } : {}),
                  })}
                  options={[
                    { value: "auto", label: t("properties.automatic") },
                    { value: "upload", label: t("properties.upload") },
                    { value: "remote", label: t("properties.directLink"), icon: Link },
                  ]}
                />
              </Field>
              {(current.thumbnailSourceType || "auto") === "upload" && (
                <label className="block cursor-pointer space-y-2 rounded-xl border-2 border-dashed border-border p-4 text-center transition hover:border-primary">
                  <span className="mx-auto grid h-9 w-9 place-items-center rounded-full bg-primary/10 text-primary">
                    <UploadCloud size={18} />
                  </span>
                  <p className="text-sm font-semibold">
                    {thumbnailAsset ? t("properties.replaceImage") : t("properties.chooseThumbnail")}
                  </p>
                  <p className="text-[11px] text-muted-foreground">{t("properties.imageTypes")}</p>
                  <input
                    type="file"
                    className="sr-only"
                    aria-label={t("properties.thumbnail")}
                    accept="image/jpeg,image/png,image/gif,image/webp"
                    disabled={busy}
                    onChange={(e) => {
                      onUpload(e.target.files?.[0], "image", "thumbnail");
                      e.target.value = "";
                    }}
                  />
                </label>
              )}
              {current.thumbnailSourceType === "remote" && (
                <TextField
                  id="email-prop-thumbnail-url"
                  label={t("properties.thumbnailUrl")}
                  type="url"
                  placeholder="https://"
                  value={current.thumbnailUrl}
                  onChange={(thumbnailUrl) => onChange({ thumbnailUrl })}
                />
              )}
            </div>
          )}
          {type === "video" && <TextField
            id="email-prop-video-alt"
            label={t("properties.alt")}
            value={current.alt}
            onChange={(alt) => onChange({ alt })}
          />}
          {type === "image" && <TextField
            id="email-prop-alt"
            label={t("properties.alt")}
            value={current.alt}
            onChange={(alt) => onChange({ alt })}
          />}
          <TextField id="email-prop-caption" label={t("properties.caption")} value={current.caption} onChange={(caption) => onChange({ caption })} />
          {type === "image" && <TextField
            id="email-prop-image-url"
            label={t("properties.imageLink")}
            type="url"
            placeholder="https://"
            value={current.url}
            onChange={(url) => onChange({ url: url || undefined })}
          />}
        </>
      )}
      {type === "spacer" && (
        <RangeField
          label={t("blockTypes.spacer")}
          min={8}
          max={100}
          value={current.height}
          onChange={(height) => onChange({ height })}
        />
      )}
      {type === "section" && (
        <Field label={t("properties.columns")}>
          <Segmented
            className="w-full"
            label={t("properties.columns")}
            value={current.children.length}
            onChange={onColumns}
            options={[1, 2, 3, 4].map((n) => ({ value: n, label: String(n) }))}
          />
        </Field>
      )}
      {["column", "wrapper", "divider"].includes(type) && (
        <p className="text-xs text-muted-foreground">{t("panel.noContentSettings")}</p>
      )}
      {!current.children && columns.length > 1 && (
        <Field label={t("properties.moveToColumn")}>
          <Select value={current.parent || undefined} onValueChange={onMoveToColumn}>
            <SelectTrigger aria-label={t("properties.moveToColumn")}>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {columns.map((n, i) => (
                <SelectItem key={n.id} value={n.id}>
                  {t("blockTypes.column")} {i + 1}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </Field>
      )}
    </div>
  );
}

function BoxSides({ title, prefix, style, onStyle }) {
  const t = useTranslations("emailBuilder");
  const key = (side) => `${prefix}${side}`;
  const side = (sideName, className) => (
    <Input
      aria-label={t(`properties.${key(sideName)}`)}
      type="number"
      min={0}
      max={100}
      value={style[key(sideName)] ?? ""}
      placeholder={String(style[prefix.toLowerCase()] ?? 0)}
      onChange={(event) => {
        if (event.target.value === "") return;
        onStyle(
          key(sideName),
          Math.min(100, Math.max(0, Number(event.target.value))),
        );
      }}
      className={`!h-8 w-16 !px-1 text-center !text-xs ${className}`}
    />
  );
  return (
    <div className="space-y-3">
      <SectionTitle >{title}</SectionTitle>
      <div className="relative rounded-xl border border-dashed border-border px-20 py-12">
        <div className="absolute left-1/2 top-2 -translate-x-1/2">{side("Top")}</div>
        <div className="absolute bottom-2 left-1/2 -translate-x-1/2">{side("Bottom")}</div>
        <div className="absolute left-2 top-1/2 -translate-y-1/2">{side("Left")}</div>
        <div className="absolute right-2 top-1/2 -translate-y-1/2">{side("Right")}</div>
        <div className="grid h-10 place-items-center rounded-lg border border-primary/30 bg-primary/10 text-[11px] font-semibold text-primary">
          {title}
        </div>
      </div>
      <RangeField
        label={t("properties.allSides")}
        min={0}
        max={100}
        value={style[prefix.toLowerCase()] ?? 0}
        onChange={(value) => onStyle(prefix.toLowerCase(), value)}
      />
    </div>
  );
}

function StylePane({ current, onStyle, onContainerStyle, onChange }) {
  const t = useTranslations("emailBuilder");
  const type = current.type,
    style = current.style || {},
    containerStyle = current.containerStyle || {};
  const typography = ["text", "button", "table"].includes(type);
  const alignable = ["text", "button", "image", "video", "document", "divider", "table"].includes(type);
  const borderable = showNumeric("borderWidth", type) || type === "divider";
  if (type === "spacer")
    return <p className="text-xs text-muted-foreground">{t("panel.noContentSettings")}</p>;
  return (
    <div className="space-y-5">
      {typography && (
        <div className="space-y-3">
          <SectionTitle>{t("properties.typography")}</SectionTitle>
          {type !== "text" && (
            <FontSelect
              label={t("properties.fontFamily")}
              value={style.fontFamily}
              onChange={(v) => onStyle("fontFamily", v)}
            />
          )}
          <div className="grid grid-cols-2 gap-3">
            {type !== "text" && (
              <NumberField
                id="email-style-size"
                label={t("properties.fontSize")}
                min={8}
                max={72}
                value={style.fontSize}
                onChange={(v) => onStyle("fontSize", v)}
              />
            )}
            <Field label={t("properties.fontWeight")}>
              <Select
                value={String(style.fontWeight ?? (type === "button" ? 700 : 400))}
                onValueChange={(v) => onStyle("fontWeight", Number(v))}
              >
                <SelectTrigger aria-label={t("properties.fontWeight")}>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="300">{t("properties.weightLight")}</SelectItem>
                  <SelectItem value="400">{t("properties.fontWeightNormal")}</SelectItem>
                  <SelectItem value="700">{t("properties.fontWeightBold")}</SelectItem>
                </SelectContent>
              </Select>
            </Field>
            <NumberField
              id="email-style-line"
              label={t("properties.lineHeight")}
              min={1}
              max={3}
              step={0.1}
              value={style.lineHeight}
              onChange={(v) => onStyle("lineHeight", v)}
            />
            <NumberField
              id="email-style-letter"
              label={t("properties.letterSpacing")}
              min={0}
              max={10}
              value={style.letterSpacing}
              onChange={(v) => onStyle("letterSpacing", v)}
            />
            {type === "text" && (
              <>
                <NumberField
                  id="email-style-paragraph"
                  label={t("properties.paragraphSpacing")}
                  min={0}
                  max={80}
                  value={style.paragraphSpacing}
                  onChange={(v) => onStyle("paragraphSpacing", v)}
                />
                <NumberField
                  id="email-style-indent"
                  label={t("properties.indent")}
                  min={0}
                  max={100}
                  value={style.indent}
                  onChange={(v) => onStyle("indent", v)}
                />
              </>
            )}
          </div>
        </div>
      )}
      <div className="space-y-3">
        <SectionTitle>{t("properties.colors")}</SectionTitle>
        {type !== "divider" && (
          <ColorField
            label={t("properties.backgroundColor")}
            value={style.backgroundColor}
            fallback={type === "button" ? "#176c51" : "#ffffff"}
            onChange={(v) => onStyle("backgroundColor", v)}
          />
        )}
        {typography && (
          <ColorField
            label={t("properties.color")}
            value={style.color}
            fallback={type === "button" ? "#ffffff" : "#222222"}
            onChange={(v) => onStyle("color", v)}
          />
        )}
        {borderable && (
          <ColorField
            label={t("properties.borderColor")}
            value={style.borderColor}
            fallback={type === "divider" ? "#d5dfd8" : "#222222"}
            onChange={(v) => onStyle("borderColor", v)}
          />
        )}
      </div>
      {alignable && (
        <Field label={t("properties.align")}>
          <Segmented
            className="w-full"
            label={t("properties.align")}
            value={style.align || (type === "button" ? "center" : "left")}
            onChange={(v) => onStyle("align", v)}
            options={[
              { value: "left", icon: AlignLeft, ariaLabel: "left" },
              { value: "center", icon: AlignCenter, ariaLabel: "center" },
              { value: "right", icon: AlignRight, ariaLabel: "right" },
              ...(type === "text"
                ? [{ value: "justify", icon: AlignJustify, ariaLabel: "justify" }]
                : []),
            ]}
          />
        </Field>
      )}
      {type === "video" && (
        <Field label={t("properties.objectFit")}>
          <Select value={style.objectFit || "cover"} onValueChange={(v) => onStyle("objectFit", v)}>
            <SelectTrigger aria-label={t("properties.objectFit")}><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="cover">{t("properties.fitCover")}</SelectItem>
              <SelectItem value="contain">{t("properties.fitContain")}</SelectItem>
              <SelectItem value="fill">{t("properties.fitFill")}</SelectItem>
            </SelectContent>
          </Select>
        </Field>
      )}
      {(showNumeric("width", type) || showNumeric("height", type) || showNumeric("minHeight", type)) && (
        <div className="space-y-3">
          <SectionTitle>{t("properties.size")}</SectionTitle>
          {showNumeric("width", type) && (
            <NumberField
              id="email-style-width"
              label={t("properties.width")}
              min={1}
              max={1600}
              value={style.width}
              onChange={(v) => onStyle("width", v)}
            />
          )}
          {showNumeric("height", type) && (
            <NumberField
              id="email-style-height"
              label={t("properties.height")}
              min={1}
              max={1600}
              value={style.height}
              onChange={(v) => onStyle("height", v)}
            />
          )}
          {showNumeric("minHeight", type) && (
            <RangeField
              label={t("properties.minHeight")}
              min={0}
              max={300}
              value={style.minHeight}
              onChange={(v) => onStyle("minHeight", v)}
            />
          )}
        </div>
      )}
      {(showNumeric("borderWidth", type) || showNumeric("borderRadius", type)) && (
        <div className="space-y-3">
          <SectionTitle>{t("properties.border")}</SectionTitle>
          {showNumeric("borderWidth", type) && (
            <RangeField
              label={t("properties.borderWidth")}
              min={0}
              max={10}
              value={style.borderWidth}
              onChange={(v) => onStyle("borderWidth", v)}
            />
          )}
          {showNumeric("borderRadius", type) && (
            <RangeField
              label={t("properties.borderRadius")}
              min={0}
              max={100}
              value={style.borderRadius}
              onChange={(v) => onStyle("borderRadius", v)}
            />
          )}
        </div>
      )}
      {current.type !== "spacer" && (
        <BoxSides
          title={t("properties.elementPadding")}
          prefix="padding"
          style={style}
          onStyle={onStyle}
        />
      )}
      <div className="space-y-3 rounded-xl border border-border bg-muted/20 p-3">
        <SectionTitle>{t("properties.containerAppearance")}</SectionTitle>
        <ColorField
          label={t("properties.containerBackground")}
          value={containerStyle.backgroundColor}
          fallback="#ffffff"
          onChange={(value) => onContainerStyle("backgroundColor", value)}
        />
        <ColorField
          label={t("properties.containerBorderColor")}
          value={containerStyle.borderColor}
          fallback="#d5dfd8"
          onChange={(value) => onContainerStyle("borderColor", value)}
        />
        <div className="grid grid-cols-2 gap-3">
          <RangeField
            label={t("properties.containerBorderWidth")}
            min={0}
            max={10}
            value={containerStyle.borderWidth ?? 0}
            onChange={(value) => onContainerStyle("borderWidth", value)}
          />
          <RangeField
            label={t("properties.containerRadius")}
            min={0}
            max={100}
            value={containerStyle.borderRadius ?? 0}
            onChange={(value) => onContainerStyle("borderRadius", value)}
          />
        </div>
      </div>
      <BoxSides
        title={t("properties.containerPadding")}
        prefix="padding"
        style={containerStyle}
        onStyle={onContainerStyle}
      />
      <BoxSides
        title={t("properties.outerMargin")}
        prefix="margin"
        style={containerStyle}
        onStyle={onContainerStyle}
      />
      <div className="flex items-center justify-between gap-3 rounded-xl border border-border p-3">
        <div>
          <p className="text-sm font-semibold">{t("properties.visibility")}</p>
          <p className="text-xs text-muted-foreground">{t("properties.visibilityHint")}</p>
        </div>
        <Switch
          aria-label={t("actions.hide")}
          checked={!current.hidden}
          onCheckedChange={(on) => onChange({ hidden: !on })}
        />
      </div>
    </div>
  );
}

export default function EmailProperties(props) {
  const t = useTranslations("emailBuilder");
  const { current, doc, onDeselect, onCommitDoc } = props;
  const [tab, setTab] = useState("content");
  const focusRequested = props.focusRequest?.id === current?.id;
  useEffect(() => {
    if (focusRequested) setTab("content");
  }, [focusRequested, props.focusRequest?.token]);
  const Icon = current ? BLOCK_ICONS[current.type] || Settings2 : Settings2;
  const subtitle = current?.type === "image" ? current.alt : "";
  return (
    <aside className="flex flex-col border-border bg-card lg:max-h-[780px] lg:border-s">
      <div className="flex items-center justify-between gap-2 border-b border-border px-4 py-3">
        <div className="flex min-w-0 items-center gap-2">
          <span className="grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-primary/10 text-primary">
            <Icon size={16} />
          </span>
          <div className="min-w-0">
            <p className="truncate text-sm font-bold">
              {current ? t(`blockTypes.${current.type}`) || current.type : t("panel.emailSettings")}
            </p>
            {subtitle && (
              <p className="truncate text-[11px] text-muted-foreground">{subtitle}</p>
            )}
          </div>
        </div>
        {current && (
          <IconButton
            label={t("panel.deselect")}
            icon={X}
            onClick={onDeselect}
            className="!h-8 !w-8"
          />
        )}
      </div>
      {current ? (
        <>
          <div className="px-4 pt-3">
            <Segmented
              className="w-full"
              label={t("panel.properties")}
              value={tab}
              onChange={setTab}
              options={[
                { value: "content", label: t("panel.content") },
                { value: "style", label: t("panel.style") },
              ]}
            />
          </div>
          <div className="flex-1 overflow-y-auto p-4">
            {tab === "content" && (
              <ContentPane {...props} focusRequested={focusRequested} />
            )}
            {tab === "style" && <StylePane {...props} />}
          </div>
        </>
      ) : (
        <div className="flex-1 overflow-y-auto p-4">
          <EmailSettings doc={doc} onCommitDoc={onCommitDoc} />
        </div>
      )}
    </aside>
  );
}
