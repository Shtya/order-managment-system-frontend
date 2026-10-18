import { EMAIL_DEFAULT_STYLE } from "./defaults";

const SIDES = ["Top", "Right", "Bottom", "Left"];

const sideValues = (style, name) =>
  Object.fromEntries(
    SIDES.filter((side) => style?.[`${name}${side}`] !== undefined).map(
      (side) => [`${name}${side}`, style[`${name}${side}`]],
    ),
  );

export const resolveBlockStyle = (defaults, blockStyle) => ({
  ...EMAIL_DEFAULT_STYLE,
  ...(defaults || {}),
  ...(blockStyle || {}),
});

export const boxStyle = (style = {}) => ({
  backgroundColor: style.backgroundColor,
  border: style.borderWidth
    ? `${style.borderWidth}px solid ${style.borderColor || "#222222"}`
    : undefined,
  borderRadius:
    style.borderRadius === undefined ? undefined : style.borderRadius,
  padding: style.padding,
  ...sideValues(style, "padding"),
});

// MJML represents the block's outer margin as padding on its outer cell.
export const outerSpacingStyle = (style = {}, legacy) => ({
  padding: style.margin ?? legacy ?? 0,
  ...Object.fromEntries(
    SIDES.filter((side) => style[`margin${side}`] !== undefined).map((side) => [
      `padding${side}`,
      style[`margin${side}`],
    ]),
  ),
});

export const typographyStyle = (style = {}) => ({
  color: style.color,
  fontFamily: `${style.fontFamily || "Cairo"}, sans-serif`,
  fontSize: style.fontSize,
  fontWeight: style.fontWeight,
  lineHeight: style.lineHeight ?? 1.7,
  letterSpacing: style.letterSpacing,
  textAlign: style.align,
});

export const buttonRenderStyles = (style = {}) => ({
  table: {
    width: style.width,
    marginLeft: style.align === "left" ? 0 : "auto",
    marginRight: style.align === "right" ? 0 : "auto",
  },
  cell: {
    height: style.minHeight,
    textAlign: "center",
  },
  link: {
    ...boxStyle({ padding: 10, ...style }),
    display: "inline-block",
    width: style.width ? "100%" : undefined,
    boxSizing: "border-box",
    backgroundColor: style.backgroundColor || "#176c51",
    border: style.borderWidth
      ? `${style.borderWidth}px solid ${style.borderColor || "#000000"}`
      : undefined,
    borderRadius: style.borderRadius || 0,
    color: style.color || "#ffffff",
    fontFamily: `${style.fontFamily || "Cairo"}, sans-serif`,
    fontSize: style.fontSize || 16,
    fontWeight: style.fontWeight || 700,
    lineHeight: style.lineHeight || 1.2,
    letterSpacing: style.letterSpacing,
    textAlign: "center",
    textDecoration: "none",
  },
});

export const structuralStyle = (style = {}, type = "column") => ({
  ...boxStyle(style),
  width: type === "column" ? style.width : undefined,
});
