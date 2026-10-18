import React from "react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { NextIntlClientProvider } from "next-intl";
import messages from "../../../messages/en.json";
import EmailProperties from "./EmailProperties";

vi.mock("@/components/ui/VariableInput", () => ({
  VariableInput: ({ value = "", onChange }) => (
    <input value={value} onChange={(event) => onChange(event.target.value)} />
  ),
}));

globalThis.ResizeObserver = class {
  observe() {}
  unobserve() {}
  disconnect() {}
};

afterEach(cleanup);

describe("email block properties", () => {
  it("uses two tabs and keeps element and container spacing separate", () => {
    render(
      <NextIntlClientProvider locale="en" messages={messages}>
        <EmailProperties
          current={{
            id: "button",
            type: "button",
            label: "Click here",
            url: "https://example.com",
            style: {},
            containerStyle: {},
          }}
          doc={{ defaults: {} }}
          elements={[]}
          assets={{}}
          onChange={vi.fn()}
          onStyle={vi.fn()}
          onContainerStyle={vi.fn()}
          onDeselect={vi.fn()}
          onCommitDoc={vi.fn()}
        />
      </NextIntlClientProvider>,
    );

    expect(screen.getByRole("button", { name: "Content" })).toBeTruthy();
    expect(screen.getByRole("button", { name: "Formatting" })).toBeTruthy();
    expect(screen.queryByRole("button", { name: "Spacing" })).toBeNull();

    fireEvent.click(screen.getByRole("button", { name: "Formatting" }));
    expect(screen.getAllByText("Inner element spacing").length).toBeGreaterThan(0);
    expect(screen.getByText("Container appearance")).toBeTruthy();
    expect(screen.getAllByText("Container inner spacing").length).toBeGreaterThan(0);
    expect(screen.getAllByText("Outer margin").length).toBeGreaterThan(0);
  });
});
