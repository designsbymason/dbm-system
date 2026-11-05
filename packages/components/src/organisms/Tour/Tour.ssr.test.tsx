import { act } from "react";
import { hydrateRoot } from "react-dom/client";
import { renderToString } from "react-dom/server";
import { afterEach, describe, expect, it, vi } from "vitest";
import { Tour } from "./Tour";

// A server render must not touch `window` or `document`, and the first client render must match it. An open tour has
// nothing the server could have drawn: its layer is portaled and its element is looked up in the page, so the server
// markup is empty and hydration must agree.
const tree = (
  <div>
    <button type="button" id="ssr-target">
      Target
    </button>
    <Tour
      defaultOpen
      presentation={{ base: "docked", md: "anchored" }}
      controllerRef={() => {}}
      steps={[
        { id: "a", target: "#ssr-target", title: "One", content: "First" },
        { id: "b", title: "Two" },
      ]}
    />
  </div>
);

afterEach(() => {
  vi.unstubAllGlobals();
  document.body.innerHTML = "";
});

describe("Tour — server render and hydration", () => {
  it("renders to a string with no window or document, and draws no tour", () => {
    vi.stubGlobal("window", undefined);
    vi.stubGlobal("document", undefined);
    const html = renderToString(tree);
    expect(html).toContain("Target");
    expect(html).not.toContain("dialog");
  });

  it("hydrates the same markup with no recoverable error, then draws the tour", async () => {
    // The first test unstubbed the setup's browser stubs, and a real browser has this one.
    vi.stubGlobal("ResizeObserver", class { observe() {} unobserve() {} disconnect() {} });
    const host = document.createElement("div");
    host.innerHTML = renderToString(tree);
    document.body.appendChild(host);
    const errors: unknown[] = [];
    let root: ReturnType<typeof hydrateRoot> | undefined;
    await act(async () => {
      root = hydrateRoot(host, tree, { onRecoverableError: (error) => errors.push(error) });
    });
    try {
      expect(errors).toEqual([]);
      await vi.waitFor(() => expect(document.querySelector('[role="dialog"]')).not.toBeNull());
    } finally {
      // Unmount before the environment is torn down, so React's scheduler has no work left to run after it.
      await act(async () => root?.unmount());
    }
  });
});
