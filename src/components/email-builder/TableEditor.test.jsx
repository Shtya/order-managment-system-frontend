import React from "react";
import { describe, it, expect, vi, afterEach } from "vitest";
import {
  render,
  screen,
  waitFor,
  cleanup,
  fireEvent,
} from "@testing-library/react";
import TableEditor from "./TableEditor";
import { tableDocument } from "./document";
import { NextIntlClientProvider } from "next-intl";
import messages from "../../../messages/en.json";

// jsdom has no ResizeObserver; Radix selects/tabs in the restyled editor need one.
globalThis.ResizeObserver ??= class {
  observe() {}
  unobserve() {}
  disconnect() {}
};
const withIntl = (ui) => (
  <NextIntlClientProvider locale="en" messages={messages}>
    {ui}
  </NextIntlClientProvider>
);
afterEach(cleanup);
describe("table editor", () => {
  it("loads table headers and exposes merge/split and structural commands", async () => {
    const change = vi.fn();
    render(
      withIntl(
        <TableEditor
          value={tableDocument()}
          onChange={change}
          onAsset={vi.fn()}
          onError={vi.fn()}
        />,
      ),
    );
    await waitFor(() =>
      expect(screen.getByRole("button", { name: "Add row" })).toBeTruthy(),
    );
    expect(screen.getByRole("button", { name: "Merge cells" })).toBeTruthy();
    expect(screen.getByRole("button", { name: "Split cell" })).toBeTruthy();
    expect(document.querySelectorAll("th")).toHaveLength(2);
  });
});
