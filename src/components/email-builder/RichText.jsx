"use client";
import { useLocale, useTranslations } from "next-intl";
import { useEffect, useMemo, useRef, useState } from "react";
import {
  useEditor,
  EditorContent,
  NodeViewWrapper,
  ReactNodeViewRenderer,
} from "@tiptap/react";
import { Node } from "@tiptap/core";
import StarterKit from "@tiptap/starter-kit";
import {
  TextStyle,
  Color,
  FontFamily,
  FontSize,
} from "@tiptap/extension-text-style";
import {
  Baseline,
  Bold,
  Braces,
  Italic,
  Link2,
  List,
  ListOrdered,
  Strikethrough,
  TextQuote,
  Underline,
  Unlink,
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { isTypingTransaction } from "./document";
import { FONTS, SWATCHES, ensureFontLoaded } from "./parts";
import {
  shouldApplyTextStyleToAll,
  shouldSkipFormattingAction,
  getFontFamilyValue,
  getFontSizeValue,
} from "./textFormatting";
import {
  VariablePicker,
  VARIABLE_TOKEN_RE,
  findVariableForToken,
  flattenVariables,
} from "@/components/ui/VariableInput";
import { VariableChip } from "@/components/ui/VariableChip";

function withVariableNodes(value) {
  const visit = (node) => {
    if (node?.type === "text" && typeof node.text === "string") {
      const parts = [];
      let cursor = 0;
      const pattern = new RegExp(VARIABLE_TOKEN_RE.source, "g");
      let match;
      while ((match = pattern.exec(node.text))) {
        if (match.index > cursor)
          parts.push({ ...node, text: node.text.slice(cursor, match.index) });
        parts.push({ type: "variable", attrs: { id: match[1] } });
        cursor = match.index + match[0].length;
      }
      if (!parts.length) return [node];
      if (cursor < node.text.length)
        parts.push({ ...node, text: node.text.slice(cursor) });
      return parts;
    }
    if (!Array.isArray(node?.content)) return [node];
    return [{ ...node, content: node.content.flatMap(visit) }];
  };
  return visit(value)[0];
}

function VariableNodeView({ node, extension, selected }) {
  const variable =
    findVariableForToken(
      extension.options.flattenedVariables,
      node.attrs.id,
      extension.options.locale,
    ) || {
      id: node.attrs.id,
      label: node.attrs.id,
    };
  return (
    <NodeViewWrapper
      as="span"
      data-variable={node.attrs.id}
      className={selected ? "rounded ring-2 ring-primary/40" : undefined}
      contentEditable={false}
    >
      <VariableChip variable={variable} size="small" />
    </NodeViewWrapper>
  );
}

const VariableNode = Node.create({
  name: "variable",
  group: "inline",
  inline: true,
  atom: true,
  selectable: true,
  addOptions() {
    return { flattenedVariables: [], locale: "en" };
  },
  addAttributes() {
    return { id: { default: "" } };
  },
  parseHTML() {
    return [{ tag: "span[data-email-variable]" }];
  },
  renderHTML({ node }) {
    return [
      "span",
      { "data-email-variable": node.attrs.id },
      `{{${node.attrs.id}}}`,
    ];
  },
  renderText({ node }) {
    return `{{${node.attrs.id}}}`;
  },
  addNodeView() {
    return ReactNodeViewRenderer(VariableNodeView);
  },
});

function ToolSelect({ label, value, onPick, options }) {
  return (
    <Select value={value} onValueChange={(v) => v && onPick(v)}>
      <SelectTrigger aria-label={label} className="!h-8 min-w-0 flex-1 text-xs">
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        {options.map(([value, text]) => (
          <SelectItem key={value} value={value}>
            {text}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}

export default function RichText({
  value,
  onChange,
  variables = [],
  popupTitle,
  autoFocus = false,
  onAutoFocus,
}) {
  const t = useTranslations("emailBuilder");
  const locale = useLocale();
  const normalizedValue = useMemo(() => withVariableNodes(value), [value]);
  const latest = useRef(onChange);
  const lastSelection = useRef({ from: 1, to: 1 });
  latest.current = onChange;
  const [, refresh] = useState(0);
  const [link, setLink] = useState("");
  const editor = useEditor({
    immediatelyRender: false,
    extensions: [
      StarterKit.configure({
        undoRedo: false,
        code: false,
        codeBlock: false,
        horizontalRule: false,
        heading: { levels: [1, 2, 3] },
        link: { openOnClick: false, protocols: ["https"] },
      }),
      TextStyle,
      Color,
      FontFamily,
      FontSize,
      VariableNode.configure({
        flattenedVariables: flattenVariables(variables),
        locale,
      }),
    ],
    content: normalizedValue,
    onUpdate: ({ editor, transaction }) =>
      latest.current(editor.getJSON(), isTypingTransaction(transaction)),
    onSelectionUpdate: ({ editor }) => {
      const { from, to } = editor.state.selection;
      lastSelection.current = { from, to };
      setLink(editor.getAttributes("link").href || "");
      refresh((n) => n + 1);
    },
    editorProps: {
      attributes: {
        class:
          "email-rich-editor max-h-[300px] min-h-[150px] overflow-auto px-3.5 py-3 text-sm leading-[1.8] outline-none prose max-w-none",
        "aria-label": t("blockTypes.text"),
      },
    },
  });
  useEffect(() => {
    if (
      editor &&
      JSON.stringify(editor.getJSON()) !== JSON.stringify(normalizedValue)
    )
      editor.commands.setContent(normalizedValue, { emitUpdate: false });
  }, [normalizedValue, editor]);
  useEffect(() => {
    if (!editor || !autoFocus) return;
    editor.chain().focus().selectAll().run();
    onAutoFocus?.();
  }, [autoFocus, editor, onAutoFocus]);
  useEffect(() => {
    ensureFontLoaded("Cairo");
  }, []);
  if (!editor) return null;
  const chain = () =>
    editor
      .chain()
      .focus()
      .setTextSelection(lastSelection.current);
  const marks = [
    [t("richText.bold"), Bold, "bold", () => chain().toggleBold().run()],
    [t("richText.italic"), Italic, "italic", () => chain().toggleItalic().run()],
    [t("richText.underline"), Underline, "underline", () => chain().toggleUnderline().run()],
    [t("richText.strike"), Strikethrough, "strike", () => chain().toggleStrike().run()],
  ];
  const blocks = [
    [t("richText.bullets"), List, "bulletList", () => chain().toggleBulletList().run()],
    [t("richText.numbers"), ListOrdered, "orderedList", () => chain().toggleOrderedList().run()],
    [t("richText.quote"), TextQuote, "blockquote", () => chain().toggleBlockquote().run()],
  ];
  const applyLink = () => {
    if (link) chain().extendMarkRange("link").setLink({ href: link }).run();
  };
  const headingValue = [1, 2, 3].find((n) => editor.isActive("heading", { level: n }));
  const setBlock = (v) => {
    if (v === "p") chain().setParagraph().run();
    else chain().unsetFontSize().setHeading({ level: Number(v) }).run();
  };
  const applyInlineAction = (action, kind) => {
    if (shouldSkipFormattingAction({ editor, kind })) return;
    action();
  };
  const applyTypography = async (kind, value) => {
    const command = chain();
    if (kind === "fontFamily") {
      await ensureFontLoaded(value);
    }
    if (shouldApplyTextStyleToAll({ editor, kind })) command.selectAll();
    if (kind === "fontFamily") command.setFontFamily(value).run();
    else command.setFontSize(`${value}px`).run();
  };
  const activeFontFamily = getFontFamilyValue(editor);
  const activeFontSize = getFontSizeValue(editor).replace(/px$/, "");
  const toolBtn =
    "size-[30px] rounded-md p-0 text-muted-foreground hover:bg-primary/10 hover:text-primary aria-pressed:bg-primary aria-pressed:text-primary-foreground aria-pressed:hover:bg-primary/90 aria-pressed:hover:text-primary-foreground";
  const renderTool = ([label, Icon, key, action]) => (
    <Button
      key={key}
      type="button"
      variant="ghost"
      size="icon"
      aria-label={label}
      title={label}
      aria-pressed={editor.isActive(key)}
      onPointerDown={(event) => event.preventDefault()}
      onClick={() => applyInlineAction(action, key)}
      className={toolBtn}
    >
      <Icon size={16} />
    </Button>
  );
  const separator = <span className="mx-1 my-0 h-5 w-px bg-border" aria-hidden="true" />;
  const text = editor.getText();
  return (
    <div className="space-y-2">
      <Label description={t("richText.messageTextDescription")}>
        {t("richText.messageText")}
      </Label>
      <div className="overflow-hidden rounded-lg border border-border bg-muted/40 focus-within:border-primary focus-within:ring-[3px] focus-within:ring-primary/10">
        <div className="flex flex-wrap items-center gap-0.5 border-b border-border p-1.5">
          <Select
            value={headingValue ? String(headingValue) : "p"}
            onValueChange={setBlock}
          >
            <SelectTrigger
              aria-label={t("richText.heading")}
              className="!h-[30px] w-auto gap-1 border-0 bg-transparent px-2 text-[12.5px] font-medium shadow-none"
            >
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="p">{t("richText.paragraph")}</SelectItem>
              <SelectItem value="1">H1</SelectItem>
              <SelectItem value="2">{t("richText.bigHeading")}</SelectItem>
              <SelectItem value="3">{t("richText.subHeading")}</SelectItem>
            </SelectContent>
          </Select>
          {separator}
          {marks.map(renderTool)}
          {separator}
          {blocks.map(renderTool)}
          {separator}
          <Popover>
            <PopoverTrigger asChild>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                aria-label={t("properties.link")}
                title={t("properties.link")}
                aria-pressed={editor.isActive("link")}
                className={toolBtn}
              >
                <Link2 size={16} />
              </Button>
            </PopoverTrigger>
            <PopoverContent align="start" className="w-64 space-y-2 p-2">
              <Input
                type="url"
                dir="ltr"
                aria-label={t("properties.link")}
                placeholder="https://"
                value={link}
                onChange={(e) => setLink(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    applyLink();
                  }
                }}
                className="!h-8 text-xs"
              />
              <div className="flex gap-1.5">
                <Button type="button" size="sm" className="flex-1 rounded-md" onClick={applyLink}>
                  {t("richText.apply")}
                </Button>
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  className="flex-1 rounded-md"
                  disabled={!editor.isActive("link")}
                  onClick={() => {
                    chain().extendMarkRange("link").unsetLink().run();
                    setLink("");
                  }}
                >
                  <Unlink size={14} />
                  {t("richText.removeLink")}
                </Button>
              </div>
            </PopoverContent>
          </Popover>
          <Popover>
            <PopoverTrigger asChild>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                aria-label={t("properties.color")}
                title={t("properties.color")}
                className={toolBtn}
              >
                <Baseline size={16} />
              </Button>
            </PopoverTrigger>
            <PopoverContent align="start" className="w-auto p-2">
              <div className="flex items-center gap-1.5">
                {SWATCHES.slice(0, 5).map((c) => (
                  <button
                    key={c}
                    type="button"
                    aria-label={c}
                    onClick={() => chain().setColor(c).run()}
                    className="size-6 rounded-md border border-border"
                    style={{ backgroundColor: c }}
                  />
                ))}
                <label
                  title={t("properties.color")}
                  className="relative flex size-6 cursor-pointer items-center justify-center rounded-md border border-border bg-muted"
                >
                  <Baseline size={12} />
                  <input
                    type="color"
                    aria-label={t("properties.color")}
                    className="absolute inset-0 cursor-pointer opacity-0"
                    onChange={(e) => chain().setColor(e.target.value).run()}
                  />
                </label>
              </div>
            </PopoverContent>
          </Popover>
          <VariablePicker
            variables={variables}
            popupTitle={popupTitle || t("variables.variables")}
            onSelect={(variable) =>
              chain()
                .insertContent({ type: "variable", attrs: { id: variable.id } })
                .run()
            }
          >
              <Button
                type="button"
                variant="ghost"
                aria-label={t("variables.variables")}
                className="ms-auto !h-[30px] rounded-md bg-primary/10 px-2.5 text-xs font-medium text-primary hover:bg-primary/20 hover:text-primary"
              >
                <Braces size={14} />
                {t("variables.variable")}
              </Button>
          </VariablePicker>
        </div>
        <div className="flex gap-1.5 border-b border-border p-1.5">
          <ToolSelect
            label={t("properties.fontFamily")}
            value={activeFontFamily}
            onPick={(font) => applyTypography("fontFamily", font)}
            options={FONTS.map((f) => [f, f])}
          />
          <ToolSelect
            label={t("properties.fontSize")}
            value={activeFontSize}
            onPick={(size) => applyTypography("fontSize", size)}
            options={[12, 14, 16, 18, 24, 32, 48].map((n) => [String(n), `${n}px`])}
          />
        </div>
        <EditorContent editor={editor} />
        <div className="flex items-center justify-between border-t border-border px-3 py-1.5 text-[11.5px] text-muted-foreground">
          <span>{t("richText.characters", { count: text.length })}</span>
        </div>
      </div>      <style jsx global>{`
        .email-rich-editor p {
          margin: 0 0 0.5em;
        }
        .email-rich-editor a {
          color: var(--primary);
          text-decoration: underline;
        }
        .email-rich-editor blockquote {
          border-inline-start: 3px solid var(--border);
          padding-inline-start: 0.75em;
          color: var(--muted-foreground);
        }
        .email-rich-editor h2 {
          font-size: 20px;
          font-weight: 700;
          margin: 0 0 0.5em;
        }
        .email-rich-editor h3 {
          font-size: 17px;
          font-weight: 700;
          margin: 0 0 0.5em;
        }
        .email-rich-editor ul {
          list-style: disc;
          padding-inline-start: 1.4em;
        }
        .email-rich-editor ol {
          list-style: decimal;
          padding-inline-start: 1.4em;
        }
      `}</style>
    </div>
  );
}
