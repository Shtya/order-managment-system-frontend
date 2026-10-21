"use client";
import { useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { useTranslations } from "next-intl";
import {
  DndContext,
  DragOverlay,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import {
  SortableContext,
  useSortable,
  verticalListSortingStrategy,
  rectSortingStrategy,
  sortableKeyboardCoordinates,
  arrayMove,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import {
  ArrowDown,
  ArrowUp,
  Copy,
  Eye,
  EyeOff,
  GripVertical,
  ImagePlus,
  FileText,
  Lock,
  Trash2,
} from "lucide-react";
import { cn } from "@/utils/cn";
import { copy, flatten, moveToColumn } from "./document";
import {
  boxStyle,
  buttonRenderStyles,
  outerSpacingStyle,
  resolveBlockStyle,
  structuralStyle,
  typographyStyle,
} from "./rendering";
import {
  VariablePreviewText,
  VariablePreviewValue,
} from "@/components/ui/VariableChip";

const flattenVariableOptions = (variables) =>
  variables.flatMap((variable) => [
    variable,
    ...flattenVariableOptions(variable.children || []),
  ]);

const CANVAS_CSS = `
  :host { display:block; color:#222; font-family:Cairo,Arial,sans-serif; }
  *, *::before, *::after { box-sizing:border-box; }
  button, table, tbody, tr, td, div, span, p, h1, h2, h3, ul, ol, li,
  blockquote, img, hr { font:inherit; color:inherit; }
  button { min-width:0; min-height:0; margin:0; border:0; cursor:pointer; }
  table { border-spacing:0; }
  img { border:0; }
  .email-canvas { width:100%; margin:0 auto; background:#fff; color:#222; box-shadow:0 1px 3px rgba(0,0,0,.08); }
  .email-stack > .email-blk + .email-blk, .email-canvas > .email-blk + .email-blk { margin-top:4px; }
  .email-columns { display:table; table-layout:fixed; width:100%; }
  .email-columns > .email-blk { display:table-cell; width:calc(100% / var(--email-columns)); vertical-align:top; }
  .email-blk { position:relative; min-width:0; cursor:pointer; outline:1px dashed transparent; outline-offset:-1px; transition:outline-color .15s,box-shadow .15s; }
  .email-blk:hover:not(:has(.email-blk:hover)) { outline-color:#6763af8c; }
  .email-blk[data-selected] { outline:2px solid #6763af; }
  .email-blk[data-invalid] { outline:2px solid #dc2626; outline-offset:-2px; box-shadow:0 0 0 3px rgba(220,38,38,.12); }
  .email-blk-chrome { position:absolute; inset-inline-start:0; top:-22px; z-index:10; display:flex; height:22px; align-items:center; overflow:hidden; border-radius:6px 6px 0 0; background:#6763af; color:#fff; font:600 10.5px/1 Cairo,Arial,sans-serif; opacity:0; pointer-events:none; transition:opacity .15s; }
  .email-blk:hover:not(:has(.email-blk:hover)) > .email-blk-chrome,
  .email-blk[data-selected] > .email-blk-chrome,
  .email-blk > .email-blk-chrome:focus-within { opacity:1; pointer-events:auto; }
  .email-blk-chrome button { display:grid; height:100%; place-items:center; background:transparent; color:#fff; }
  .email-blk-chrome button:first-child { width:20px; cursor:grab; }
  .email-blk-chrome button:last-child { padding-inline-end:8px; }
  .email-tools { position:absolute; inset-inline-end:0; top:-34px; z-index:20; display:flex; gap:2px; padding:4px; border:1px solid #e2e8f0; border-radius:8px; background:#fff; color:#64748b; box-shadow:0 8px 18px rgba(15,23,42,.14); }
  .email-tools button { display:grid; width:24px; height:24px; place-items:center; border-radius:6px; background:transparent; color:inherit; }
  .email-fix { position:absolute; inset-inline-end:4px; top:4px; z-index:20; padding:4px 8px; border-radius:6px; background:#dc2626; color:#fff; font:700 10px/1.2 Cairo,Arial,sans-serif; box-shadow:0 2px 5px rgba(0,0,0,.15); }
  .email-rich p { margin:0 0 var(--email-paragraph,0); }
  .email-rich h1 { margin:0 0 .5em; font-size:32px; font-weight:700; line-height:1.25; }
  .email-rich h2 { margin:0 0 .5em; font-size:24px; font-weight:700; line-height:1.3; }
  .email-rich h3 { margin:0 0 .5em; font-size:19px; font-weight:700; line-height:1.35; }
  .email-rich ul { margin:0; padding-inline-start:1.4em; list-style:disc; }
  .email-rich ol { margin:0; padding-inline-start:1.4em; list-style:decimal; }
  .email-rich blockquote { margin:0; padding-inline-start:12px; border-inline-start:3px solid #d5dfd8; color:#555; }
  .email-rich .underline { color:#2563eb; text-decoration:underline; }
  [data-preview-variable-state] { display:inline; margin-inline:1px; padding:0 2px; border-radius:2px; font-weight:500; line-height:inherit; }
  [data-preview-variable-state="value"] { border-bottom:1px dotted #6763afb3; background:#6763af1a; }
  [data-preview-variable-state="missing"] { border:1px dashed #f59e0b; background:#fffbeb; color:#92400e; }
  .email-image-placeholder { display:grid; place-items:center; gap:4px; padding:24px; border:2px dashed #e2e8f0; border-radius:6px; background:#f8fafc; color:#64748b; text-align:center; font-size:12px; }
  .email-footer { padding:24px 32px; border-top:1px solid #f1f5f9; background:#fafafa; color:#637469; text-align:center; font:400 11px/1.7 Cairo,Arial,sans-serif; }
  .email-drag-overlay { max-width:360px; padding:12px 16px; border:2px solid #6763af; border-radius:8px; background:#fff; color:#334155; font:600 14px/1.4 Cairo,Arial,sans-serif; box-shadow:0 12px 25px rgba(15,23,42,.2); opacity:.95; }
  @container (max-width:480px) { .email-columns, .email-columns > .email-blk { display:block; width:100%; } }
`;

function ShadowSurface({ children }) {
  const host = useRef(null);
  const [root, setRoot] = useState(null);
  useEffect(() => {
    if (!host.current) return;
    setRoot(host.current.shadowRoot || host.current.attachShadow({ mode: "open" }));
  }, []);
  return (
    <div ref={host} data-email-render-surface="isolated">
      {root && createPortal(<><style>{CANVAS_CSS}</style>{children}</>, root)}
    </div>
  );
}

function Rich({ node, variables, variableValues }) {
  if (!node) return null;
  if (node.type === "table")
    return (
      <table style={{ width: "100%", tableLayout: "fixed", borderCollapse: "collapse" }}>
        <tbody>
          {node.content?.map((child, i) => (
            <Rich key={i} node={child} variables={variables} variableValues={variableValues} />
          ))}
        </tbody>
      </table>
    );
  if (node.type === "text") {
    let result = (
      <VariablePreviewText
        text={node.text}
        variables={variables}
        values={variableValues}
      />
    );
    for (const mark of node.marks || []) {
      if (mark.type === "bold") result = <strong>{result}</strong>;
      if (mark.type === "italic") result = <em>{result}</em>;
      if (mark.type === "underline") result = <u>{result}</u>;
      if (mark.type === "strike") result = <s>{result}</s>;
      if (mark.type === "textStyle")
        result = (
          <span
            style={{
              color: mark.attrs?.color || undefined,
              fontFamily: mark.attrs?.fontFamily || undefined,
              fontSize: mark.attrs?.fontSize || undefined,
            }}
          >
            {result}
          </span>
        );
      if (mark.type === "link")
        result = <span className="text-[#2563eb] underline">{result}</span>;
    }
    return result;
  }
  if (node.type === "variable") {
    const variable = variables.find((item) => item.id === node.attrs?.id) || {
      id: node.attrs?.id,
      label: node.attrs?.id,
    };
    return (
      <VariablePreviewValue
        variable={variable}
        value={variableValues?.[node.attrs?.id]}
      />
    );
  }
  if (node.type === "image")
    return (
      <span className="inline-flex items-center gap-1 rounded bg-slate-100 px-2 py-1 text-xs text-slate-500">
        <ImagePlus size={12} />
        {node.attrs?.alt || "Image"}
      </span>
    );
  if (node.type === "emailButton")
    return (
      <span
        className="inline-block rounded px-3 py-1.5 text-white"
        style={{
          background: node.attrs?.style?.backgroundColor || "#176c51",
          color: node.attrs?.style?.color || "#ffffff",
        }}
      >
        <VariablePreviewText
          text={node.attrs?.label}
          variables={variables}
          values={variableValues}
        />
      </span>
    );
  if (node.type === "hardBreak") return <br />;
  const Tag =
    {
      doc: "div",
      tableRow: "tr",
      tableCell: "td",
      tableHeader: "th",
      paragraph: "p",
      bulletList: "ul",
      orderedList: "ol",
      listItem: "li",
      blockquote: "blockquote",
    }[node.type] ||
    (node.type === "heading" ? `h${node.attrs?.level || 1}` : "div");
  return (
    <Tag
      colSpan={node.attrs?.colspan}
      rowSpan={node.attrs?.rowspan}
      style={
        node.type.startsWith("table")
          ? {
              border: "1px solid #dddddd",
              padding: 8,
              backgroundColor: node.attrs?.backgroundColor,
            }
          : undefined
      }
    >
      {node.content?.map((child, i) => (
        <Rich key={i} node={child} variables={variables} variableValues={variableValues} />
      ))}
    </Tag>
  );
}

function Tools({ node, onAction }) {
  const t = useTranslations("emailBuilder");
  const actions = [
    ["up", ArrowUp],
    ["down", ArrowDown],
    ["duplicate", Copy],
    ["hide", node.hidden ? Eye : EyeOff],
    ["delete", Trash2],
  ];
  return (
    <div
      className="email-tools"
      onClick={(e) => e.stopPropagation()}
    >
      {actions.map(([action, Icon]) => (
        <button
          key={action}
          type="button"
          aria-label={t(`actions.${action}`)}
          title={t(`actions.${action}`)}
          onClick={() => onAction(node.id, action)}
          className={action === "delete" ? "email-delete" : undefined}
        >
          <Icon size={14} />
        </button>
      ))}
    </div>
  );
}

function Block({ node, defaults, assets, variables, variableValues, onSelect, onAction, selected, invalidIds }) {
  const t = useTranslations("emailBuilder");
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } =
    useSortable({
      id: node.id,
      transition: { duration: 180, easing: "cubic-bezier(0.2, 0, 0, 1)" },
    });
  const style = resolveBlockStyle(defaults, node.style);
  const containerStyle = node.containerStyle || {};
  const isSelected = selected === node.id;
  const isInvalid = invalidIds.has(node.id);
  const label = t.has(`blockTypes.${node.type}`) ? t(`blockTypes.${node.type}`) : node.type;
  const css = {
    ...(["wrapper", "section", "column"].includes(node.type)
      ? {}
      : outerSpacingStyle(
          containerStyle,
          node.type === "button" ? style.spacing : undefined,
        )),
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.25 : node.hidden ? 0.35 : 1,
    zIndex: isDragging ? 30 : undefined,
    willChange: isDragging ? "transform" : undefined,
  };
  const renderedContainerStyle = ["wrapper", "section", "column"].includes(
    node.type,
  )
    ? undefined
    : {
        ...boxStyle(containerStyle),
        textAlign: ["image", "video", "document"].includes(node.type) ? style.align || "center" : undefined,
      };
  return (
    <div
      ref={setNodeRef}
      style={css}
      data-selected={isSelected || undefined}
      data-invalid={isInvalid || undefined}
      className="email-blk relative min-w-0"
      onClick={(e) => {
        e.stopPropagation();
        onSelect(node.id);
      }}
    >
      {isInvalid && (
        <button
          type="button"
          className="email-fix"
          onClick={(event) => {
            event.stopPropagation();
            onSelect(node.id);
          }}
        >
          {t("feedback.fixComponent")}
        </button>
      )}
      <div className="email-blk-chrome absolute -top-[22px] start-0 z-10 flex h-[22px] items-center overflow-hidden rounded-t-md bg-[var(--primary)] text-[10.5px] font-semibold text-white">
        <button
          type="button"
          aria-label={`${t("actions.up")} / ${t("actions.down")}: ${label}`}
          {...attributes}
          {...listeners}
          className="grid h-full w-5 cursor-grab place-items-center hover:bg-white/15"
        >
          <GripVertical size={12} />
        </button>
        <button
          type="button"
          className="h-full pe-2"
          onClick={() => onSelect(node.id)}
        >
          {label}
          {node.hidden ? " · ◌" : ""}
        </button>
      </div>
      {isSelected && <Tools node={node} onAction={onAction} />}
      <div className="email-block-container" style={renderedContainerStyle}>
      {node.children ? (
        <SortableContext
          items={node.children.map((n) => n.id)}
          strategy={
            node.type === "section"
              ? rectSortingStrategy
              : verticalListSortingStrategy
          }
        >
          <div
            className={node.type === "section" ? "email-columns" : "email-stack"}
            style={{
              ...structuralStyle(style, node.type),
              "--email-columns": node.children.length,
            }}
          >
            {node.children.map((n) => (
              <Block
                key={n.id}
                node={n}
                defaults={defaults}
                assets={assets}
                variables={variables}
                variableValues={variableValues}
                onSelect={onSelect}
                onAction={onAction}
                selected={selected}
                invalidIds={invalidIds}
              />
            ))}
          </div>
        </SortableContext>
      ) : null}
      {node.type === "text" && (
        <div
          className="email-rich"
          style={{
            ...boxStyle(style),
            ...typographyStyle(style),
            textIndent: style.indent,
            "--email-paragraph": `${style.paragraphSpacing || 0}px`,
          }}
        >
          <Rich node={node.content} variables={variables} variableValues={variableValues} />
        </div>
      )}
      {node.type === "table" && (
        <div
          className="overflow-x-auto"
          style={{
            ...boxStyle(style),
            ...typographyStyle(style),
          }}
        >
          <Rich node={node.content} variables={variables} variableValues={variableValues} />
        </div>
      )}
      {node.type === "button" && (
        (() => {
          const button = buttonRenderStyles(style);
          return (
            <table role="presentation" style={button.table}>
              <tbody><tr><td style={button.cell}>
                <span style={button.link}>
                  <VariablePreviewText
                    text={node.label}
                    variables={variables}
                    values={variableValues}
                  />
                </span>
              </td></tr></tbody>
            </table>
          );
        })()
      )}
      {node.type === "image" &&
        ((node.sourceType === "remote" ? node.sourceUrl : assets[node.assetId]?.variants?.at(-1)?.url) ? (
          <img
            alt={node.alt || ""}
            src={node.sourceType === "remote" ? node.sourceUrl : assets[node.assetId].variants.at(-1).url}
            style={{
              width: style.width || "100%",
              maxWidth: "100%",
              height: style.height || "auto",
              objectFit: style.height ? "cover" : undefined,
              padding: style.padding,
              paddingTop: style.paddingTop,
              paddingRight: style.paddingRight,
              paddingBottom: style.paddingBottom,
              paddingLeft: style.paddingLeft,
              backgroundColor: style.backgroundColor,
              borderRadius: style.borderRadius,
              border: style.borderWidth
                ? `${style.borderWidth}px solid ${style.borderColor || "#222222"}`
                : undefined,
              display: "inline-block",
            }}
          />
        ) : (
          <div className="email-image-placeholder">
            <ImagePlus size={22} className="text-slate-400" />
            {t("canvas.dropImage")}
          </div>
        ))}
      {node.type === "video" && (() => {
        const href = node.sourceType === "remote" ? node.sourceUrl : assets[node.assetId]?.url;
        return (
          <div style={{ textAlign: style.align || "center" }}>
            <video
              src={href || undefined}
              controls
              playsInline
              preload="metadata"
              style={{
                display: "inline-block",
                boxSizing: "border-box",
                width: style.width || 600,
                maxWidth: "100%",
                height: style.height,
                border: `${style.borderWidth ?? 1}px solid ${style.borderColor || "#d5dfd8"}`,
                borderRadius: style.borderRadius ?? 6,
                background: style.backgroundColor || "#f8fafc",
              }}
            >
              {href ? <a href={href} target="_blank" rel="noreferrer">{t("canvas.watchVideo")}</a> : null}
            </video>
            {node.caption ? <div style={{ marginTop: 6, color: "#64748b", fontSize: 12 }}>{node.caption}</div> : null}
            {!href ? <div style={{ marginTop: 6, color: "#64748b", fontSize: 12 }}>{t("canvas.addVideo")}</div> : null}
          </div>
        );
      })()}
      {node.type === "document" && (() => {
        const href = node.sourceType === "remote" ? node.sourceUrl : assets[node.assetId]?.url;
        return href ? (
          <div style={{ textAlign: style.align || "center" }}>
            <a href={href} target="_blank" rel="noreferrer" style={{ width: style.width || 600, maxWidth: "100%", height: style.height, display: "inline-flex", boxSizing: "border-box", alignItems: "center", gap: 10, padding: node.style?.padding ?? 16, border: `${style.borderWidth ?? 1}px solid ${style.borderColor || "#d5dfd8"}`, borderRadius: style.borderRadius ?? 6, background: style.backgroundColor || "#f8fafc", color: "#176c51", fontFamily: `${style.fontFamily || "Cairo"}, sans-serif`, fontSize: style.fontSize || 16, fontWeight: style.fontWeight || 700, lineHeight: style.lineHeight || 1.2, textDecoration: "none" }}>
              <span aria-hidden style={{ fontSize: 22, lineHeight: 1 }}>▣</span><span>{node.title || assets[node.assetId]?.originalName || t("blockTypes.document")}</span>
            </a>
            {node.caption ? <div style={{ marginTop: 6, color: "#64748b", fontSize: 12 }}>{node.caption}</div> : null}
          </div>
        ) : <div className="email-image-placeholder"><FileText size={22} />{t("canvas.addDocument")}</div>;
      })()}
      {node.type === "divider" && (
        <div style={boxStyle(style)}>
          <hr
            style={{
              margin: 0,
              border: 0,
              borderTop: `${style.borderWidth || 1}px solid ${style.borderColor || "#d5dfd8"}`,
            }}
          />
        </div>
      )}
      {node.type === "spacer" && <div style={{ height: node.height }} />}
      </div>
    </div>
  );
}

export default function ReactCanvas({
  document,
  onChange,
  onSelect,
  onAction = () => {},
  selected = null,
  assets = {},
  variables = [],
  variableValues,
  envelope,
  invalidElementIds = [],
}) {
  const t = useTranslations("emailBuilder");
  const [activeId, setActiveId] = useState(null);
  const flattenedVariables = useMemo(
    () => flattenVariableOptions(variables),
    [variables],
  );
  const invalidIds = useMemo(
    () => new Set(invalidElementIds),
    [invalidElementIds],
  );
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 3 } }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    }),
  );
  const move = ({ active, over }) => {
    if (!over || active.id === over.id) return;
    const doc = copy(document);
    const visit = (nodes) => {
      const a = nodes.findIndex((n) => n.id === active.id),
        b = nodes.findIndex((n) => n.id === over.id);
      if (a >= 0 && b >= 0) {
        nodes.splice(0, nodes.length, ...arrayMove(nodes, a, b));
        return true;
      }
      return nodes.some((n) => n.children && visit(n.children));
    };
    if (visit(doc.blocks)) onChange(doc);
    else {
      const rows = flatten(doc),
        target = rows.find((n) => n.id === over.id);
      const column =
        target?.type === "column"
          ? target
          : rows.find((n) => n.id === target?.parent);
      if (column?.type === "column")
        onChange(moveToColumn(doc, active.id, column.id));
    }
  };
  const initial = (envelope?.senderName || envelope?.senderEmail || "?")[0]?.toUpperCase();
  const activeNode = activeId
    ? flatten(document).find((item) => item.id === activeId)
    : null;
  return (
    <div className="email-canvas-root">
      {envelope && (
        <div className="space-y-1.5 rounded-t-xl border border-b-0 border-border bg-card px-4 py-3">
          <p className="truncate text-[15px] font-semibold" dir="auto">
            {envelope.subject ? (
              <VariablePreviewText
                text={envelope.subject}
                variables={variables}
                values={variableValues}
              />
            ) : "—"}
          </p>
          <div className="flex items-center gap-2">
            <span className="grid h-7 w-7 shrink-0 place-items-center rounded-full bg-primary text-[11px] font-bold text-white">
              {initial}
            </span>
            <div className="min-w-0 text-xs leading-tight">
              <span className="font-semibold">{envelope.senderName || "—"}</span>{" "}
              {envelope.senderEmail && (
                <span className="text-muted-foreground" dir="ltr">
                  &lt;{envelope.senderEmail}&gt;
                </span>
              )}
              <br />
              <span className="text-muted-foreground">
                {t("inboxPreview.to")} {t("inboxPreview.me")}
              </span>
            </div>
          </div>
        </div>
      )}
      <div
        className={cn(
          "bg-[#f4f4f7] px-2 py-8",
          envelope ? "rounded-b-xl border border-border" : "rounded-xl",
        )}
        onClick={() => onSelect(null)}
      >
        <ShadowSurface>
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragStart={({ active }) => setActiveId(active.id)}
          onDragCancel={() => setActiveId(null)}
          onDragEnd={(event) => {
            move(event);
            setActiveId(null);
          }}
        >
          <SortableContext
            items={document.blocks.map((n) => n.id)}
            strategy={verticalListSortingStrategy}
          >
            <div
              dir={document.direction}
              className="email-canvas space-y-1 bg-white text-[#222222] shadow-sm"
              style={{
                maxWidth: document.width,
                margin: "auto",
                containerType: "inline-size",
              }}
            >
              {document.blocks.map((n) => (
                <Block
                  key={n.id}
                  node={n}
                  defaults={document.defaults}
                  assets={assets}
                  variables={flattenedVariables}
                  variableValues={variableValues}
                  onSelect={onSelect}
                  onAction={onAction}
                  selected={selected}
                  invalidIds={invalidIds}
                />
              ))}
              <div className="email-footer">
                {/* <span className="absolute end-2 top-2 inline-flex h-5 items-center gap-1 rounded-full bg-slate-200/70 px-2 text-[10px] font-semibold text-slate-500">
                  <Lock size={11} />
                  {t("canvas.autoFooter")}
                </span> */}
                {envelope?.businessIdentity || "—"}
                <br />
                {/* <span className="underline">{t("canvas.unsubscribe")}</span> */}
              </div>
            </div>
          </SortableContext>
          <DragOverlay dropAnimation={{ duration: 180, easing: "ease-out" }}>
            {activeNode ? (
              <div className="email-drag-overlay">
                {t.has(`blockTypes.${activeNode.type}`)
                  ? t(`blockTypes.${activeNode.type}`)
                  : activeNode.type}
              </div>
            ) : null}
          </DragOverlay>
        </DndContext>
        </ShadowSurface>
      </div>
    </div>
  );
}
