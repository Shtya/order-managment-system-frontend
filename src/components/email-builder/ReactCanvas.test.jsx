import React from "react";
import { describe, it, expect, vi, afterEach } from "vitest";
import { render, within, fireEvent, cleanup } from "@testing-library/react";
import Canvas from "./ReactCanvas";
import { emptyDocument, node, section } from "./document";
import { NextIntlClientProvider } from "next-intl";
import messages from "../../../messages/en.json";
const withIntl = (ui) => (
  <NextIntlClientProvider locale="en" messages={messages}>
    {ui}
  </NextIntlClientProvider>
);
afterEach(cleanup);
describe("accessible document canvas", () => {
  it("renders text and exposes keyboard-accessible selection and drag controls", () => {
    const doc = emptyDocument(),
      select = vi.fn();
    const { container } = render(
      withIntl(
        <Canvas
          document={doc}
          variables={[{ id: "customer.name", label: "Customer name" }]}
          variableValues={{ "customer.name": "Ahmed" }}
          onChange={vi.fn()}
          onSelect={select}
        />,
      ),
    );
    const canvas = within(container.querySelector("[data-email-render-surface]").shadowRoot);
    expect(canvas.getByText("Ahmed")).toBeTruthy();
    expect(canvas.queryByText(/\{\{customer\.name\}\}/)).toBeNull();
    fireEvent.click(canvas.getByRole("button", { name: "Text", exact: true }));
    expect(select).toHaveBeenCalledWith(
      doc.blocks[0].children[0].children[0].id,
    );
    expect(
      canvas.getByRole("button", { name: "Move up / Move down: Text" }),
    ).toBeTruthy();
  });
  it("keeps hidden blocks editable and does not interpret content as HTML", () => {
    const doc = emptyDocument(),
      text = doc.blocks[0].children[0].children[0];
    text.hidden = true;
    text.content.content[0].content[0].text = "<script>unsafe</script>";
    const { container } = render(
      withIntl(
        <Canvas
          document={doc}
          onChange={vi.fn()}
          onSelect={vi.fn()}
        />,
      ),
    );
    const canvas = within(container.querySelector("[data-email-render-surface]").shadowRoot);
    expect(canvas.getByText("<script>unsafe</script>")).toBeTruthy();
    expect(container.querySelector("[data-email-render-surface]").shadowRoot.querySelector("script")).toBeNull();
  });
  it("renders atomic variables as sample values with readable missing fallbacks", () => {
    const doc = emptyDocument();
    doc.blocks[0].children[0].children[0].content.content[0].content = [
      { type: "text", text: "Hello " },
      { type: "variable", attrs: { id: "customer.name" } },
      { type: "text", text: " and " },
      { type: "variable", attrs: { id: "customer.email" } },
    ];
    const { container } = render(
      withIntl(
        <Canvas
          document={doc}
          variables={[
            { id: "customer.name", label: "Customer name", preview: "Ahmed" },
            { id: "customer.email", label: "Customer email", preview: "a@example.com" },
          ]}
          variableValues={{ "customer.name": "Mona", "customer.email": "" }}
          onChange={vi.fn()}
          onSelect={vi.fn()}
        />,
      ),
    );
    const canvas = within(container.querySelector("[data-email-render-surface]").shadowRoot);
    expect(
      canvas.getByText("Mona").getAttribute("data-preview-variable-state"),
    ).toBe("value");
    expect(
      canvas
        .getByText("Customer email")
        .getAttribute("data-preview-variable-state"),
    ).toBe("missing");
    expect(canvas.queryByText(/\{\{/)).toBeNull();
  });
  it("renders variables in button labels without exposing placeholder syntax", () => {
    const doc = emptyDocument();
    doc.blocks.push(
      section([
        node("button", {
          label: "Open offer for {{customer.name}}",
          url: "https://example.com",
        }),
      ]),
    );
    const { container } = render(
      withIntl(
        <Canvas
          document={doc}
          variables={[{ id: "customer.name", label: "Customer name" }]}
          variableValues={{ "customer.name": "Mona" }}
          onChange={vi.fn()}
          onSelect={vi.fn()}
        />,
      ),
    );
    const canvas = within(container.querySelector("[data-email-render-surface]").shadowRoot);
    expect(canvas.getAllByText("Mona").length).toBeGreaterThan(0);
    expect(canvas.queryByText(/\{\{customer\.name\}\}/)).toBeNull();
  });
  it("marks an invalid component and lets the user select it", () => {
    const doc = emptyDocument();
    const text = doc.blocks[0].children[0].children[0];
    const select = vi.fn();
    const { container } = render(
      withIntl(
        <Canvas
          document={doc}
          invalidElementIds={[text.id]}
          onChange={vi.fn()}
          onSelect={select}
        />,
      ),
    );
    const canvas = within(container.querySelector("[data-email-render-surface]").shadowRoot);
    fireEvent.click(canvas.getByRole("button", { name: "Fix this" }));
    expect(select).toHaveBeenCalledWith(text.id);
    expect(
      canvas.getByRole("button", { name: "Fix this" }).closest("[data-invalid]"),
    ).toBeTruthy();
  });
});
