"use client";
import { useEffect, useMemo, useRef, useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import {
  Box,
  ChevronDown,
  ChevronsDownUp,
  ChevronsUpDown,
  Eye,
  EyeOff,
  Image,
  Minus,
  MousePointerClick,
  MoveVertical,
  Rows3,
  Search,
  Square,
  Table,
  Trash2,
  Type,
} from "lucide-react";
import { cn } from "@/utils/cn";
import { Button } from "@/components/ui/button";

export const BLOCK_ICONS = {
  text: Type,
  button: MousePointerClick,
  image: Image,
  divider: Minus,
  spacer: MoveVertical,
  table: Table,
  section: Rows3,
  column: Square,
  wrapper: Box,
};

const TILE =
  "h-auto cursor-pointer gap-2.5 rounded-md border border-border bg-card px-2.5 py-2 text-start text-[12.5px] font-medium text-foreground transition hover:border-primary hover:bg-primary/5 hover:text-foreground";

function Tile({ icon: Icon, label, onClick, className, children }) {
  return (
    <Button
      type="button"
      variant="ghost"
      onClick={onClick}
      className={cn("group justify-start", TILE, className)}
    >
      {Icon && (
        <span className="flex size-8 shrink-0 items-center justify-center rounded bg-primary/10 text-primary transition group-hover:bg-card">
          <Icon size={18} />
        </span>
      )}
      <span>{label}</span>
      {children}
    </Button>
  );
}

function Title({ children }) {
  return <p className="mb-2 mt-4 text-xs font-semibold text-muted-foreground">{children}</p>;
}

function LayoutThumb({ count }) {
  return (
    <span
      className="ms-auto grid h-6 w-14 shrink-0 gap-[3px]"
      style={{ gridTemplateColumns: `repeat(${count}, 1fr)` }}
      aria-hidden
    >
      {Array.from({ length: count }, (_, i) => (
        <i key={i} className="rounded-sm bg-primary/35" />
      ))}
    </span>
  );
}

const RTL_LOCALES = ["ar", "he", "fa", "ur"];
const ICON_BTN =
  "size-[34px] min-w-0 shrink-0 cursor-pointer rounded-md border border-border bg-transparent p-0 text-muted-foreground hover:border-primary hover:bg-transparent hover:text-primary";
const ROW_ACTION =
  "size-6 min-w-0 shrink-0 cursor-pointer rounded-md bg-transparent p-0 text-muted-foreground hover:bg-primary/10 hover:text-primary";

function textOf(node) {
  if (!node) return "";
  if (typeof node.text === "string") return node.text;
  const own = typeof node.label === "string" ? node.label : "";
  return (own + (Array.isArray(node.content) ? node.content.map(textOf).join(" ") : "")).trim();
}

function snippet(el) {
  if (!["text", "heading", "button"].includes(el.type)) return "";
  const raw = typeof el.content === "string" ? el.content : textOf(el.content) || textOf(el);
  const clean = raw.replace(/{{[^}]*}}/g, "\u2026").replace(/\s+/g, " ").trim();
  return clean.length > 26 ? clean.slice(0, 26) + "\u2026" : clean;
}

function Highlight({ text, q }) {
  const i = q ? text.toLowerCase().indexOf(q) : -1;
  if (i < 0) return text;
  return (
    <>
      {text.slice(0, i)}
      <mark className="rounded-sm bg-primary/25 text-inherit">{text.slice(i, i + q.length)}</mark>
      {text.slice(i + q.length)}
    </>
  );
}

export default function EmailBlocksPanel({
  elements,
  selected,
  onSelect,
  onAdd,
  onAddImage,
  onAddLayout,
  onDelete,
  onToggleHidden,
  tablesEnabled,
}) {
  const t = useTranslations("emailBuilder");
  const locale = useLocale();
  const rtl = RTL_LOCALES.includes(locale);
  const [tab, setTab] = useState("add");
  const [layerQuery, setLayerQuery] = useState("");
  const [open, setOpen] = useState({});
  const treeRef = useRef(null);
  const content = [
    ["text", Type],
    // ["image", Image],
    ["button", MousePointerClick],
    ["divider", Minus],
    ["spacer", MoveVertical],
    ...(tablesEnabled ? [["table", Table]] : []),
    ["wrapper", Box],
  ];
  const contentItems = content;
  const layouts = [
    [1, t("panel.oneColumn")],
    [2, t("panel.twoColumns")],
    [3, t("panel.threeColumns")],
  ];

  const lq = layerQuery.trim().toLowerCase();
  const rows = elements || [];
  const { roots, byId } = useMemo(() => {
    const map = new Map();
    const top = [];
    for (const el of rows) map.set(el.id, { el, children: [], parent: null });
    for (const el of rows) {
      const item = map.get(el.id);
      const parent = el.parent ? map.get(el.parent) : null;
      if (parent) {
        item.parent = parent;
        parent.children.push(item);
      } else top.push(item);
    }
    return { roots: top, byId: map };
  }, [rows]);

  const labelOf = (el) => snippet(el) || t(`blockTypes.${el.type}`);
  const matches = (item) =>
    !lq ||
    labelOf(item.el).toLowerCase().includes(lq) ||
    t(`blockTypes.${item.el.type}`).toLowerCase().includes(lq) ||
    item.children.some(matches);
  const isOpen = (item) => !!lq || open[item.el.id] !== false;

  const visible = [];
  const collect = (items) => {
    for (const item of items) {
      if (!matches(item)) continue;
      visible.push(item);
      if (item.children.length && isOpen(item)) collect(item.children);
    }
  };
  collect(roots);

  const ancestorIds = (id) => {
    const ids = [];
    let p = byId.get(id)?.parent;
    while (p) {
      ids.push(p.el.id);
      p = p.parent;
    }
    return ids;
  };

  useEffect(() => {
    if (!selected) return;
    const ids = ancestorIds(selected);
    setOpen((prev) => (ids.some((id) => prev[id] === false) ? { ...prev, ...Object.fromEntries(ids.map((id) => [id, true])) } : prev));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selected, byId]);

  useEffect(() => {
    if (tab !== "layers" || !selected) return;
    const row = [...(treeRef.current?.querySelectorAll("[data-row-id]") || [])].find(
      (n) => n.dataset.rowId === selected,
    );
    row?.scrollIntoView({ block: "nearest" });
  }, [selected, tab, open]);

  const collapseAll = () => {
    const keep = new Set(selected ? ancestorIds(selected) : []);
    setOpen(
      Object.fromEntries(
        rows.filter((el) => byId.get(el.id).children.length).map((el) => [el.id, keep.has(el.id)]),
      ),
    );
  };
  const expandAll = () => setOpen({});

  const focusRow = (id) =>
    requestAnimationFrame(() =>
      [...(treeRef.current?.querySelectorAll("[data-row-id]") || [])]
        .find((n) => n.dataset.rowId === id)
        ?.focus(),
    );

  const onRowKey = (e, item) => {
    if (e.target !== e.currentTarget) return;
    const idx = visible.indexOf(item);
    const id = item.el.id;
    const hasKids = item.children.length > 0;
    const openKey = rtl ? "ArrowLeft" : "ArrowRight";
    const closeKey = rtl ? "ArrowRight" : "ArrowLeft";
    const go = (target) => {
      if (!target) return;
      onSelect(target.el.id);
      focusRow(target.el.id);
    };
    if (e.key === "ArrowDown") go(visible[idx + 1]);
    else if (e.key === "ArrowUp") go(visible[idx - 1]);
    else if (e.key === openKey) {
      if (hasKids && !isOpen(item)) setOpen((p) => ({ ...p, [id]: true }));
      else if (hasKids) go(item.children.find(matches));
    } else if (e.key === closeKey) {
      if (hasKids && isOpen(item) && !lq) setOpen((p) => ({ ...p, [id]: false }));
      else go(item.parent);
    } else if (e.key === "Delete" && onDelete) onDelete(id);
    else if (e.key === "Enter" || e.key === " ") onSelect(id);
    else return;
    e.preventDefault();
  };

  const renderItems = (items, level) => (
    <>
      {items.filter(matches).map((item) => {
        const { el } = item;
        const Icon = BLOCK_ICONS[el.type] || Square;
        const active = el.id === selected;
        const hasKids = item.children.length > 0;
        const expanded = hasKids && isOpen(item);
        const typeName = t(`blockTypes.${el.type}`);
        const text = labelOf(el);
        return (
          <li key={el.id} role="none">
            <div
              role="treeitem"
              data-row-id={el.id}
              tabIndex={active ? 0 : -1}
              aria-level={level}
              aria-selected={active}
              aria-expanded={hasKids ? expanded : undefined}
              onClick={() => onSelect(el.id)}
              onKeyDown={(e) => onRowKey(e, item)}
              className={cn(
                "group flex h-[34px] cursor-pointer items-center gap-1.5 rounded-md border border-transparent px-1.5 outline-none focus-visible:border-primary",
                active ? "border-primary bg-primary/10" : "hover:bg-muted/50",
                el.hidden && "opacity-50",
              )}
            >
              {hasKids ? (
                <Button
                  type="button"
                  variant="ghost"
                  tabIndex={-1}
                  aria-label={expanded ? t("panel.collapseAll") : t("panel.expandAll")}
                  onClick={(e) => {
                    e.stopPropagation();
                    setOpen((p) => ({ ...p, [el.id]: !expanded }));
                  }}
                  className="size-5 min-w-0 shrink-0 cursor-pointer rounded-md p-0 text-muted-foreground hover:bg-muted"
                >
                  <ChevronDown
                    size={14}
                    className={cn("transition-transform", !expanded && "-rotate-90 rtl:rotate-90")}
                    aria-hidden
                  />
                </Button>
              ) : (
                <span className="size-5 shrink-0" aria-hidden />
              )}
              <Icon size={15} className="shrink-0 text-primary" aria-hidden />
              <span className="min-w-0 flex-1 truncate text-[12.5px] font-medium text-foreground" title={typeName}>
                <Highlight text={text} q={lq} />
              </span>
              {(onToggleHidden || onDelete) && (
                <span
                  className={cn(
                    "flex shrink-0 items-center opacity-0 group-focus-within:opacity-100 group-hover:opacity-100",
                    active && "opacity-100",
                  )}
                >
                  {onToggleHidden && (
                    <Button
                      type="button"
                      variant="ghost"
                      tabIndex={-1}
                      title={t("actions.hide")}
                      aria-label={t("actions.hide")}
                      onClick={(e) => {
                        e.stopPropagation();
                        onToggleHidden(el.id);
                      }}
                      className={ROW_ACTION}
                    >
                      {el.hidden ? <EyeOff size={14} aria-hidden /> : <Eye size={14} aria-hidden />}
                    </Button>
                  )}
                  {onDelete && (
                    <Button
                      type="button"
                      variant="ghost"
                      tabIndex={-1}
                      title={t("actions.delete")}
                      aria-label={t("actions.delete")}
                      onClick={(e) => {
                        e.stopPropagation();
                        onDelete(el.id);
                      }}
                      className={cn(ROW_ACTION, "hover:text-destructive")}
                    >
                      <Trash2 size={14} aria-hidden />
                    </Button>
                  )}
                </span>
              )}
            </div>
            {expanded && (
              <ul role="group" className="ms-[15px] border-s border-border ps-1">
                {renderItems(item.children, level + 1)}
              </ul>
            )}
          </li>
        );
      })}
    </>
  );

  const tabClass = (id) =>
    cn(
      "h-auto min-w-0 flex-1 cursor-pointer gap-1.5 rounded-md px-2 py-1.5 text-[12.5px] shadow-none",
      tab === id
        ? "bg-card font-semibold text-primary shadow-sm hover:bg-card hover:text-primary"
        : "bg-transparent font-medium text-muted-foreground hover:bg-transparent hover:text-foreground",
    );

  return (
    <aside className="flex min-h-0 flex-col border-border bg-card lg:max-h-[780px] lg:border-e">
      <div
        role="tablist"
        aria-label={t("panel.blocks")}
        className="m-3.5 mb-0 flex shrink-0 gap-0.5 rounded-lg border border-border bg-muted/40 p-[3px]"
      >
        <Button
          type="button"
          variant="ghost"
          role="tab"
          id="email-tab-add"
          aria-selected={tab === "add"}
          aria-controls="email-pane-add"
          onClick={() => setTab("add")}
          className={tabClass("add")}
        >
          {t("panel.tabAdd")}
        </Button>
        <Button
          type="button"
          variant="ghost"
          role="tab"
          id="email-tab-layers"
          aria-selected={tab === "layers"}
          aria-controls="email-pane-layers"
          onClick={() => setTab("layers")}
          className={tabClass("layers")}
        >
          {t("panel.layers")}
          <span className="min-w-5 rounded-full bg-primary/10 px-[7px] text-center text-[11px] text-primary">
            {rows.length}
          </span>
        </Button>
      </div>
      {tab === "add" ? (
        <div
          role="tabpanel"
          id="email-pane-add"
          aria-labelledby="email-tab-add"
          className="min-h-0 flex-1 overflow-y-auto p-3.5"
        >
          <p className="mb-3.5 text-[11.5px] text-muted-foreground">{t("panel.tip")}</p>
          {contentItems.length > 0 && (
            <div>
              <Title>{t("panel.content")}</Title>
              <div className="grid grid-cols-2 gap-2">
                {contentItems.map(([type, icon]) => (
                  <Tile
                    key={type}
                    icon={icon}
                    label={t(`blockTypes.${type}`)}
                    onClick={() => (type === "image" ? onAddImage() : onAdd(type))}
                  />
                ))}
              </div>
            </div>
          )}
          {layouts.length > 0 && (
            <div>
              <Title>{t("panel.layout")}</Title>
              {layouts.map(([count, label]) => (
                <Tile
                  key={count}
                  label={label}
                  onClick={() => onAddLayout(count)}
                  className="mb-2 flex w-full gap-3"
                >
                  <LayoutThumb count={count} />
                </Tile>
              ))}
            </div>
          )}
        </div>
      ) : (
        <div
          role="tabpanel"
          id="email-pane-layers"
          aria-labelledby="email-tab-layers"
          className="flex min-h-0 flex-1 flex-col"
        >
          <div className="flex shrink-0 items-center gap-1.5 px-3.5 pb-2 pt-3">
            <div className="flex h-[34px] min-w-0 flex-1 items-center gap-2 rounded-md border border-border bg-muted/40 px-2.5">
              <Search size={15} className="shrink-0 text-muted-foreground" aria-hidden />
              <input
                type="text"
                value={layerQuery}
                onChange={(e) => setLayerQuery(e.target.value)}
                placeholder={t("panel.searchLayers")}
                aria-label={t("panel.searchLayers")}
                className="min-w-0 flex-1 border-0 bg-transparent text-[12.5px] text-foreground outline-none placeholder:text-muted-foreground"
              />
            </div>
            <Button
              type="button"
              variant="ghost"
              title={t("panel.collapseAll")}
              aria-label={t("panel.collapseAll")}
              onClick={collapseAll}
              className={ICON_BTN}
            >
              <ChevronsDownUp size={16} aria-hidden />
            </Button>
            <Button
              type="button"
              variant="ghost"
              title={t("panel.expandAll")}
              aria-label={t("panel.expandAll")}
              onClick={expandAll}
              className={ICON_BTN}
            >
              <ChevronsUpDown size={16} aria-hidden />
            </Button>
          </div>
          <div ref={treeRef} className="min-h-0 flex-1 overflow-auto px-2.5 pb-3.5 pt-1">
            {!rows.length ? (
              <p className="px-2 py-6 text-center text-xs text-muted-foreground">{t("panel.emptyLayers")}</p>
            ) : !visible.length ? (
              <p className="px-2 py-6 text-center text-xs text-muted-foreground">{t("panel.noLayerMatch")}</p>
            ) : (
              <ul role="tree" aria-label={t("panel.layers")}>
                {renderItems(roots, 1)}
              </ul>
            )}
          </div>
          <p className="shrink-0 border-t border-border px-3.5 py-2.5 text-[11.5px] text-muted-foreground">
            {t("panel.layersHint")}
          </p>
        </div>
      )}
    </aside>
  );
}
