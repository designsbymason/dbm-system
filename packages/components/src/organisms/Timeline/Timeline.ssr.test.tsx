import { act } from "react";
import { hydrateRoot } from "react-dom/client";
import { renderToString } from "react-dom/server";
import { afterEach, describe, expect, it, vi } from "vitest";
import { Timeline } from "./Timeline";

// A server render must not touch `window` or `document`, and the first client render must match it: whatever the server
// could not have drawn (a responsive time placement) waits for the first commit after hydration.
const tree = (
  <Timeline aria-label="History" maxVisible={1} timePlacement={{ base: "top", md: "side" }}>
    <Timeline.Item title="One" time="Today" dateTime="2026-03-14" />
    <Timeline.Item title="Two" pending />
  </Timeline>
);

afterEach(() => {
  vi.unstubAllGlobals();
  document.body.innerHTML = "";
});

describe("Timeline — server render and hydration", () => {
  it("renders to a string with no window or document", () => {
    vi.stubGlobal("window", undefined);
    vi.stubGlobal("document", undefined);
    const html = renderToString(tree);
    expect(html).toContain("<ol");
    expect(html).toContain('data-time-placement="top"');
    expect(html).toContain("One");
  });

  it("hydrates the same markup with no recoverable error", async () => {
    const host = document.createElement("div");
    host.innerHTML = renderToString(tree);
    document.body.appendChild(host);
    const errors: unknown[] = [];
    await act(async () => {
      hydrateRoot(host, tree, { onRecoverableError: (error) => errors.push(error) });
    });
    expect(errors).toEqual([]);
    expect(host.querySelector("ol")).not.toBeNull();
  });
});
