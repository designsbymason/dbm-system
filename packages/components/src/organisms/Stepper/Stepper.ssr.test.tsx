import { act } from "react";
import { hydrateRoot } from "react-dom/client";
import { renderToString } from "react-dom/server";
import { afterEach, describe, expect, it, vi } from "vitest";
import { Stepper } from "./Stepper";

// A server render must not touch `window` or `document`, and the first client render must match it: whatever the server
// could not have drawn (a responsive orientation, whether the strip scrolls) waits for the first commit after hydration.
const tree = (
  <Stepper
    defaultValue="b"
    interactive="completed"
    compact="auto"
    orientation={{ base: "vertical", md: "horizontal" }}
    controllerRef={() => {}}
  >
    <Stepper.Step value="a" title="One" description="First" />
    <Stepper.Step value="b" title="Two" busy />
    <Stepper.Step value="c" title="Three" status="error" />
  </Stepper>
);

afterEach(() => {
  vi.unstubAllGlobals();
  document.body.innerHTML = "";
});

describe("Stepper — server render and hydration", () => {
  it("renders to a string with no window or document", () => {
    vi.stubGlobal("window", undefined);
    vi.stubGlobal("document", undefined);
    const html = renderToString(tree);
    expect(html).toContain("<nav");
    expect(html).toContain('data-orientation="vertical"');
    expect(html).toContain("Two");
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
    expect(host.querySelector("nav")).not.toBeNull();
  });
});
