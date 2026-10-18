export const DEFAULT_FONT_FAMILY = "Cairo";
export const DEFAULT_FONT_SIZE = "16px";

export function hasSelection(editor) {
  if (!editor || typeof editor.state?.selection?.from !== "number") return false;
  const { from, to } = editor.state.selection;
  return from !== to;
}

export function shouldApplyTextStyleToAll({ editor, kind }) {
  if (!editor || !["fontFamily", "fontSize"].includes(kind)) return false;
  if (!editor.state?.selection) return false;
  const { from, to } = editor.state.selection;
  if (typeof from !== "number" || typeof to !== "number") return false;
  return from === to;
}

export function shouldSkipFormattingAction({ editor, kind }) {
  if (!editor || !kind) return true;
  if (["fontFamily", "fontSize"].includes(kind)) return false;
  if (!editor.state?.selection) return true;
  const { from, to } = editor.state.selection;
  if (typeof from !== "number" || typeof to !== "number") return true;
  if (from !== to) return false;
  const focused =
    typeof editor.isFocused === "function"
      ? editor.isFocused()
      : editor.isFocused;
  return focused !== true;
}

export function getFontFamilyValue(editor) {
  return editor?.getAttributes?.("textStyle")?.fontFamily || DEFAULT_FONT_FAMILY;
}

export function getFontSizeValue(editor) {
  return editor?.getAttributes?.("textStyle")?.fontSize || DEFAULT_FONT_SIZE;
}

export function hasCustomFont(editor) {
  const family = getFontFamilyValue(editor);
  const size = getFontSizeValue(editor);
  return family !== DEFAULT_FONT_FAMILY || size !== DEFAULT_FONT_SIZE;
}
