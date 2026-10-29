import { act } from "react";
import { hydrateRoot } from "react-dom/client";
import { renderToString } from "react-dom/server";
import { afterEach, describe, expect, it, vi } from "vitest";
import { EditorTabs } from "./EditorTabs";
import type { EditorTab } from "./EditorTabs.types";

// A server render must not touch `window` or `document`, and the first client render must match it.
const tabs: EditorTab[] = [
  { id: "a", label: "index.ts", pinned: true },
  { id: "b", label: "app.ts", dirty: true },
  { id: "c", label: "util.ts" },
];

const strip = (
  <EditorTabs tabs={tabs} defaultValue="b" onClose={() => undefined} onAdd={() => undefined} onReorder={() => undefined} overflow="menu" dir="rtl">
    <EditorTabs.Panel value="b">Panel</EditorTabs.Panel>
  </EditorTabs>
);

afterEach(() => {
  vi.unstubAllGlobals();
  document.body.innerHTML = "";
});

describe("EditorTabs — server render and hydration", () => {
  it("renders to a string with no window or document", () => {
    vi.stubGlobal("window", undefined);
    vi.stubGlobal("document", undefined);
    const html = renderToString(strip);
    expect(html).toContain('role="tablist"');
    expect(html).toContain("app.ts");
    expect(html).toContain('aria-label="New tab"');
  });

  it("hydrates the same markup with no recoverable error", async () => {
    const host = document.createElement("div");
    host.innerHTML = renderToString(strip);
    document.body.appendChild(host);
    const errors: unknown[] = [];
    await act(async () => {
      hydrateRoot(host, strip, { onRecoverableError: (error) => errors.push(error) });
    });
    expect(errors).toEqual([]);
    expect(host.querySelectorAll('[role="tab"]')).toHaveLength(3);
  });
});
