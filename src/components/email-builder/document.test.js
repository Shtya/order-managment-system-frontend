// @vitest-environment jsdom
import { describe, it, expect } from "vitest";
import {
  emptyDocument,
  DocumentHistory,
  structural,
  updateNode,
  recoverySnapshot,
  imageIds,
  columnLayout,
  sampleVariables,
} from "./document";

describe("email document and canvas proof", () => {
  it("groups typing and preserves cross-operation undo/redo", () => {
    const h = new DocumentHistory({ value: 0 });
    h.commit({ value: 1 }, "typing", 0);
    h.commit({ value: 2 }, "typing", 200);
    h.commit({ value: 3 });
    expect(h.undo()).toEqual({ value: 2 });
    expect(h.undo()).toEqual({ value: 0 });
    expect(h.redo()).toEqual({ value: 2 });
  });
  it("duplicates with fresh IDs and keeps all properties", () => {
    const doc = emptyDocument(),
      first = doc.blocks[0];
    const next = structural(doc, first.id, "duplicate");
    expect(next.blocks).toHaveLength(2);
    expect(next.blocks[1].id).not.toBe(first.id);
    expect(next.blocks[1].children[0].id).not.toBe(first.children[0].id);
  });
  it("round-trips rich data and preserves immutable updates", () => {
    const original = emptyDocument(),
      target = original.blocks[0].children[0].children[0];
    const next = updateNode(original, target.id, {
      style: { color: "#123456" },
    });
    expect(original.blocks[0].children[0].children[0].style).toEqual({
      padding: 10,
    });
    expect(original.blocks[0].children[0].children[0].style).not.toHaveProperty(
      "color",
    );
    expect(JSON.parse(JSON.stringify(next))).toEqual(next);
  });
  it("starts the greeting with 10px inner spacing", () => {
    const greeting = emptyDocument().blocks[0].children[0].children[0];
    expect(greeting.style).toMatchObject({ padding: 10 });
  });
  it("creates polished defaults for every supported column layout", () => {
    for (const count of [1, 2, 3, 4]) {
      const layout = columnLayout(count, "Add content here…");
      expect(layout.children).toHaveLength(count);
      expect(layout.style).toMatchObject({
        backgroundColor: "#f4f7f5",
        paddingTop: 8,
      });
      for (const column of layout.children) {
        expect(column.style).toMatchObject({
          backgroundColor: "#ffffff",
          paddingTop: 14,
          borderRadius: 8,
        });
        expect(column.children[0].content.content[0].content[0].text).toBe(
          "Add content here…",
        );
      }
    }
  });
  it("uses a valid absolute order URL for preview rendering", () => {
    const url = new URL(sampleVariables["campaign.orderUrl"]);
    expect(url.protocol).toBe("https:");
  });
});

describe("draft privacy and image references", () => {
  it("excludes recipients and sample values from recovered data", () => {
    const value = recoverySnapshot(
      {
        name: "Draft",
        manualRecipients: [{ email: "private@example.com" }],
        audienceFilter: { email: "private@example.com" },
        email: {
          subject: "Hello",
          document: emptyDocument(),
          variables: { "customer.name": "Private" },
        },
      },
      0,
    );
    expect(JSON.stringify(value)).not.toContain("private@example.com");
    expect(value.email).not.toHaveProperty("variables");
    expect(value.expires).toBe(24 * 3600_000);
  });
  it("omits images under hidden ancestors while retaining them in editable data", () => {
    const doc = emptyDocument();
    doc.blocks[0].hidden = true;
    doc.blocks[0].children[0].children = [
      { id: "image", type: "image", assetId: "asset" },
    ];
    expect(imageIds(doc)).toEqual(["asset"]);
    expect(imageIds(doc, true)).toEqual([]);
  });
});
