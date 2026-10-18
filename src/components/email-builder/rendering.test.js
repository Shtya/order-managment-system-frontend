import { describe, expect, it } from "vitest";
import {
  boxStyle,
  buttonRenderStyles,
  outerSpacingStyle,
  resolveBlockStyle,
  typographyStyle,
} from "./rendering";

describe("email canvas rendering contract", () => {
  it("uses the canonical defaults and preserves per-block overrides", () => {
    expect(resolveBlockStyle({}, {})).toMatchObject({
      fontFamily: "Cairo",
      fontSize: 16,
      color: "#222222",
      padding: 0,
    });
    expect(resolveBlockStyle({ fontSize: 18 }, { color: "#123456" })).toMatchObject({
      fontSize: 18,
      color: "#123456",
    });
  });

  it("keeps outer margin and inner padding independent", () => {
    expect(
      outerSpacingStyle({ margin: 4, marginTop: 12, padding: 99 }),
    ).toEqual({ padding: 4, paddingTop: 12 });
    expect(boxStyle({ padding: 8, paddingLeft: 16 })).toMatchObject({
      padding: 8,
      paddingLeft: 16,
    });
  });

  it("matches backend button typography and separated button/container styles", () => {
    const result = buttonRenderStyles({
      align: "right",
      padding: 14,
      backgroundColor: "#123456",
      color: "#ffffff",
      borderRadius: 9,
      fontFamily: "Tajawal",
      letterSpacing: 3,
    });
    expect(result.table).toMatchObject({ marginLeft: "auto", marginRight: 0 });
    expect(result.cell.backgroundColor).toBeUndefined();
    expect(result.link).toMatchObject({
      padding: 14,
      backgroundColor: "#123456",
      color: "#ffffff",
      fontFamily: "Tajawal, sans-serif",
      letterSpacing: 3,
    });
    expect(typographyStyle({ fontFamily: "Cairo" }).lineHeight).toBe(1.7);
  });
});
