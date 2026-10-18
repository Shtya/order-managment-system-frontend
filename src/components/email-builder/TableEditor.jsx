"use client";
import { useTranslations } from "next-intl";
import { useEffect, useRef, useState } from "react";
import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import { Node, mergeAttributes } from "@tiptap/core";
import {
  Table,
  TableRow,
  TableCell,
  TableHeader,
} from "@tiptap/extension-table";
import {
  AlignCenter,
  AlignLeft,
  AlignRight,
  ArrowDown,
  ArrowLeft,
  ArrowRight,
  ArrowUp,
  BetweenHorizontalEnd,
  BetweenVerticalEnd,
  Bold,
  Columns3,
  ImagePlus,
  Italic,
  MousePointerClick,
  PanelLeft,
  PanelTop,
  Rows3,
  TableCellsMerge,
  TableCellsSplit,
} from "lucide-react";
import api from "@/utils/api";
import { Input } from "@/components/ui/input";
import { copy, isTypingTransaction } from "./document";
import {
  ColorField,
  Field,
  IconButton,
  NumberField,
  RangeField,
  SectionTitle,
  Segmented,
  VariableMenu,
} from "./parts";

const attributes = () =>
  Object.fromEntries(
    [
      "backgroundColor",
      "align",
      "padding",
      "borderColor",
      "borderWidth",
      "verticalAlign",
    ].map((key) => [key, { default: null }]),
  );
const cell = (base) =>
  base.extend({
    addAttributes() {
      return { ...this.parent?.(), ...attributes() };
    },
    renderHTML({ HTMLAttributes }) {
      const a = HTMLAttributes;
      return [
        base.name === "tableHeader" ? "th" : "td",
        mergeAttributes(a, {
          style: `padding:${a.padding ?? 8}px;border:${a.borderWidth ?? 1}px solid ${a.borderColor || "#dddddd"};background:${a.backgroundColor || "transparent"};text-align:${a.align || "left"};vertical-align:${a.verticalAlign || "top"}`,
        }),
        0,
      ];
    },
  });
const AssetImage = Node.create({
  name: "image",
  group: "block",
  atom: true,
  addAttributes() {
    return {
      assetId: { default: "" },
      alt: { default: "" },
      width: { default: 200 },
    };
  },
  parseHTML() {
    return [];
  },
  renderHTML({ HTMLAttributes }) {
    return [
      "div",
      { "data-email-image": HTMLAttributes.assetId },
      HTMLAttributes.alt || "Image",
    ];
  },
});
const CellButton = Node.create({
  name: "emailButton",
  group: "block",
  atom: true,
  addAttributes() {
    return {
      label: { default: "Button" },
      url: { default: "https://example.com" },
      style: {
        default: { backgroundColor: "#176c51", color: "#ffffff", padding: 10 },
      },
    };
  },
  parseHTML() {
    return [];
  },
  renderHTML({ HTMLAttributes }) {
    return [
      "div",
      {
        style: `display:inline-block;padding:${HTMLAttributes.style?.padding ?? 10}px;background:${HTMLAttributes.style?.backgroundColor || "#176c51"};color:${HTMLAttributes.style?.color || "#ffffff"}`,
      },
      HTMLAttributes.label,
    ];
  },
});

export default function TableEditor({
  value,
  onChange,
  onAsset,
  onError,
}) {
  const t = useTranslations("emailBuilder");
  const latest = useRef(onChange);
  latest.current = onChange;
  const [buttonLabel, setButtonLabel] = useState(t("blockTypes.button")),
    [buttonUrl, setButtonUrl] = useState("https://example.com"),
    [imageAlt, setImageAlt] = useState(""),
    [rowHeight, setRowHeight] = useState(null),
    [cellStyle, setCellStyle] = useState({});
  const editor = useEditor({
    immediatelyRender: false,
    extensions: [
      StarterKit.configure({
        undoRedo: false,
        code: false,
        codeBlock: false,
        horizontalRule: false,
        trailingNode: false,
        heading: { levels: [1, 2, 3] },
        link: { openOnClick: false },
      }),
      Table.configure({ resizable: true, allowTableNodeSelection: true }),
      TableRow.extend({
        addAttributes() {
          return { height: { default: null } };
        },
        renderHTML({ HTMLAttributes }) {
          return [
            "tr",
            mergeAttributes(HTMLAttributes, {
              style: HTMLAttributes.height
                ? `height:${HTMLAttributes.height}px`
                : "",
            }),
            0,
          ];
        },
      }),
      cell(TableCell),
      cell(TableHeader),
      AssetImage,
      CellButton,
    ],
    content: value,
    onUpdate: ({ editor, transaction }) =>
      latest.current(editor.getJSON(), isTypingTransaction(transaction)),
    editorProps: {
      attributes: {
        class: "email-table-editor min-h-40 overflow-x-auto p-3 outline-none",
        "aria-label": t("blockTypes.table"),
      },
    },
  });
  useEffect(() => {
    if (editor && JSON.stringify(editor.getJSON()) !== JSON.stringify(value))
      editor.commands.setContent(value, { emitUpdate: false });
  }, [value, editor]);
  useEffect(() => {
    if (!editor) return;
    const selection = () => {
      if (editor.isActive("emailButton")) {
        const attrs = editor.getAttributes("emailButton");
        setButtonLabel(attrs.label);
        setButtonUrl(attrs.url);
      }
      if (editor.isActive("image"))
        setImageAlt(editor.getAttributes("image").alt || "");
      setRowHeight(editor.getAttributes("tableRow").height ?? null);
      setCellStyle(
        editor.isActive("tableHeader")
          ? editor.getAttributes("tableHeader")
          : editor.getAttributes("tableCell"),
      );
    };
    editor.on("selectionUpdate", selection);
    return () => editor.off("selectionUpdate", selection);
  }, [editor]);
  if (!editor) return null;
  const chain = () => editor.chain().focus();
  const groups = [
    [
      [t("table.addRow"), BetweenHorizontalEnd, () => chain().addRowAfter().run()],
      [t("table.deleteRow"), Rows3, () => chain().deleteRow().run(), true],
      [t("table.addColumn"), BetweenVerticalEnd, () => chain().addColumnAfter().run()],
      [t("table.deleteColumn"), Columns3, () => chain().deleteColumn().run(), true],
    ],
    [
      [t("table.merge"), TableCellsMerge, () => chain().mergeCells().run()],
      [t("table.split"), TableCellsSplit, () => chain().splitCell().run()],
      [t("table.headerRow"), PanelTop, () => chain().toggleHeaderRow().run()],
      [t("table.headerColumn"), PanelLeft, () => chain().toggleHeaderColumn().run()],
    ],
    [
      [t("richText.bold"), Bold, () => chain().toggleBold().run()],
      [t("richText.italic"), Italic, () => chain().toggleItalic().run()],
    ],
  ];
  const moves = [
    ["row", -1, ArrowUp],
    ["row", 1, ArrowDown],
    ["column", -1, ArrowLeft],
    ["column", 1, ArrowRight],
  ];
  const move = (axis, delta) => {
    const doc = copy(editor.getJSON()),
      table = doc.content[0];
    if (
      table.content.some((row) =>
        row.content.some(
          (c) => (c.attrs?.colspan || 1) > 1 || (c.attrs?.rowspan || 1) > 1,
        ),
      )
    ) {
      onError(t("table.splitBeforeMove"));
      return;
    }
    const { $from } = editor.state.selection;
    let r = -1,
      c = -1;
    for (let d = $from.depth; d > 0; d--) {
      if ($from.node(d).type.name === "tableRow") r = $from.index(d - 1);
      if (["tableCell", "tableHeader"].includes($from.node(d).type.name))
        c = $from.index(d - 1);
    }
    const index = axis === "row" ? r : c,
      next = index + delta,
      limit =
        axis === "row" ? table.content.length : table.content[0].content.length;
    if (index < 0 || next < 0 || next >= limit) return;
    if (axis === "row")
      [table.content[index], table.content[next]] = [
        table.content[next],
        table.content[index],
      ];
    else
      for (const row of table.content)
        [row.content[index], row.content[next]] = [
          row.content[next],
          row.content[index],
        ];
    editor.commands.setContent(doc, { emitUpdate: false });
    latest.current(doc);
  };
  const style = (key, val) => {
    setCellStyle((prev) => ({ ...prev, [key]: val }));
    chain().setCellAttribute(key, val).run();
  };
  const upload = async (file) => {
    if (!file) return;
    try {
      const fd = new FormData();
      fd.append("file", file);
      const { data } = await api.post("/email/assets", fd);
      onAsset(data);
      chain()
        .insertContent({
          type: "image",
          attrs: { assetId: data.id, alt: imageAlt, width: 200 },
        })
        .run();
    } catch (e) {
      onError(e.response?.data?.message || t("feedback.loadError"));
    }
  };
  return (
    <div className="space-y-4">
      <div className="overflow-hidden rounded-xl border border-border bg-background focus-within:border-primary">
        <div className="flex flex-wrap items-center gap-1 border-b border-border bg-muted/40 p-2">
          {groups.map((group, i) => (
            <div key={i} className="flex items-center gap-1">
              {i > 0 && <span className="mx-0.5 h-5 w-px bg-border" />}
              {group.map(([label, Icon, action, danger]) => (
                <IconButton
                  key={label}
                  label={label}
                  icon={Icon}
                  onClick={action}
                  className={danger ? "!h-8 !w-8 !text-red-500" : "!h-8 !w-8"}
                />
              ))}
            </div>
          ))}
          <span className="mx-0.5 h-5 w-px bg-border" />
          {moves.map(([axis, delta, Icon]) => (
            <IconButton
              key={`${axis}${delta}`}
              label={`${t(`blockTypes.${axis}`)} ${delta < 0 ? t("actions.up") : t("actions.down")}`}
              icon={Icon}
              onClick={() => move(axis, delta)}
              className="!h-8 !w-8"
            />
          ))}
          <VariableMenu
            size="xs"
            className="ms-auto"
            onPick={(key) => chain().insertContent(`{{${key}}}`).run()}
          />
        </div>
        <EditorContent editor={editor} />
      </div>

      <div className="space-y-3 rounded-xl border border-border bg-muted/30 p-3">
        <SectionTitle>{t("table.cellStyle")}</SectionTitle>
        <ColorField
          label={t("properties.backgroundColor")}
          value={cellStyle.backgroundColor}
          fallback="#ffffff"
          onChange={(v) => style("backgroundColor", v)}
        />
        <ColorField
          label={t("properties.borderColor")}
          value={cellStyle.borderColor}
          fallback="#dddddd"
          onChange={(v) => style("borderColor", v)}
        />
        <RangeField
          label={t("properties.padding")}
          min={0}
          max={100}
          value={cellStyle.padding ?? 8}
          onChange={(v) => style("padding", v)}
        />
        <RangeField
          label={t("properties.borderWidth")}
          min={0}
          max={10}
          value={cellStyle.borderWidth ?? 1}
          onChange={(v) => style("borderWidth", v)}
        />
        <div className="grid grid-cols-2 gap-3">
          <Field label={t("properties.align")}>
            <Segmented
              className="w-full"
              label={t("properties.align")}
              value={cellStyle.align || "left"}
              onChange={(v) => style("align", v)}
              options={[
                { value: "left", icon: AlignLeft, ariaLabel: "left" },
                { value: "center", icon: AlignCenter, ariaLabel: "center" },
                { value: "right", icon: AlignRight, ariaLabel: "right" },
              ]}
            />
          </Field>
          <Field label={t("table.verticalAlign")}>
            <Segmented
              className="w-full"
              label={t("table.verticalAlign")}
              value={cellStyle.verticalAlign || "top"}
              onChange={(v) => style("verticalAlign", v)}
              options={["top", "middle", "bottom"].map((v) => ({
                value: v,
                label: v[0].toUpperCase(),
                ariaLabel: v,
              }))}
            />
          </Field>
        </div>
        <NumberField
          id="email-table-row-height"
          label={t("table.rowHeight")}
          min={20}
          max={600}
          value={rowHeight}
          onChange={(height) => {
            setRowHeight(height);
            chain().updateAttributes("tableRow", { height }).run();
          }}
        />
      </div>

      <div className="space-y-3 rounded-xl border border-border bg-muted/30 p-3">
        <SectionTitle>{t("table.insertInCell")}</SectionTitle>
        <div className="grid grid-cols-2 gap-3">
          <Field id="email-table-button-label" label={t("properties.label")}>
            <Input
              id="email-table-button-label"
              value={buttonLabel}
              onChange={(e) => {
                setButtonLabel(e.target.value);
                if (editor.isActive("emailButton"))
                  editor.commands.updateAttributes("emailButton", {
                    label: e.target.value,
                  });
              }}
            />
          </Field>
          <Field id="email-table-button-url" label={t("properties.link")}>
            <Input
              id="email-table-button-url"
              type="url"
              dir="ltr"
              value={buttonUrl}
              onChange={(e) => {
                setButtonUrl(e.target.value);
                if (editor.isActive("emailButton"))
                  editor.commands.updateAttributes("emailButton", {
                    url: e.target.value,
                  });
              }}
            />
          </Field>
        </div>
        <button
          type="button"
          className="btn btn-sm btn-outline w-full"
          onClick={() =>
            chain()
              .insertContent({
                type: "emailButton",
                attrs: {
                  label: buttonLabel,
                  url: buttonUrl,
                  style: {
                    backgroundColor: "#176c51",
                    color: "#ffffff",
                    padding: 10,
                  },
                },
              })
              .run()
          }
        >
          <MousePointerClick size={15} />
          {t("blockTypes.button")}
        </button>
        <Field id="email-table-image-alt" label={t("properties.alt")}>
          <Input
            id="email-table-image-alt"
            value={imageAlt}
            onChange={(e) => {
              setImageAlt(e.target.value);
              if (editor.isActive("image"))
                editor.commands.updateAttributes("image", {
                  alt: e.target.value,
                });
            }}
          />
        </Field>
        <label className="btn btn-sm btn-outline w-full cursor-pointer">
          <ImagePlus size={15} />
          {t("blockTypes.image")}
          <input
            type="file"
            className="sr-only"
            aria-label={t("properties.upload")}
            accept="image/jpeg,image/png,image/gif"
            onChange={(e) => {
              upload(e.target.files?.[0]);
              e.target.value = "";
            }}
          />
        </label>
      </div>
      <style jsx global>{`
        .email-table-editor table {
          border-collapse: collapse;
          table-layout: fixed;
          width: 100%;
        }
        .email-table-editor td,
        .email-table-editor th {
          border: 1px solid #ddd;
          min-width: 30px;
          position: relative;
        }
        .email-table-editor .selectedCell {
          background: rgb(var(--primary-shadow) / 0.18) !important;
        }
        .email-table-editor .column-resize-handle {
          position: absolute;
          right: -2px;
          top: 0;
          bottom: 0;
          width: 4px;
          background: var(--primary);
          pointer-events: none;
        }
        .email-table-editor .resize-cursor {
          cursor: col-resize;
        }
      `}</style>
    </div>
  );
}
