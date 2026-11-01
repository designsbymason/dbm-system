import { act } from "@testing-library/react";
import { hydrateRoot } from "react-dom/client";
import { renderToString } from "react-dom/server";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { Navbar } from "../Navbar";
import { NavigationMenu } from "./NavigationMenu";
import type { NavigationMenuProps } from "./NavigationMenu.types";

// Removing the server render's stubs removes every stub, the setup file's `ResizeObserver` included, which an open panel needs
// once mounted; the render puts one back.
class StubResizeObserver {
  observe() {}
  unobserve() {}
  disconnect() {}
}

// Server rendering and hydration. The unit project runs in jsdom, where `window` and `document` exist, so the server render is done
// with both removed: what it proves is that nothing touches them while rendering.
function onTheServer<T>(render: () => T): T {
  vi.stubGlobal("window", undefined);
  vi.stubGlobal("document", undefined);
  try {
    return render();
  } finally {
    vi.unstubAllGlobals();
    vi.stubGlobal("ResizeObserver", StubResizeObserver);
  }
}

function Tree(props: NavigationMenuProps) {
  return (
    <NavigationMenu aria-label="Primary" {...props}>
      <NavigationMenu.List>
        <NavigationMenu.Item value="products">
          <NavigationMenu.Trigger>Products</NavigationMenu.Trigger>
          <NavigationMenu.Content>
            <NavigationMenu.Group label="Platform">
              <NavigationMenu.Link href="/analytics">Analytics</NavigationMenu.Link>
            </NavigationMenu.Group>
          </NavigationMenu.Content>
        </NavigationMenu.Item>
        <NavigationMenu.Item>
          <NavigationMenu.Link href="/pricing" current>
            Pricing
          </NavigationMenu.Link>
        </NavigationMenu.Item>
      </NavigationMenu.List>
    </NavigationMenu>
  );
}

const variants: Array<[string, NavigationMenuProps]> = [
  ["by default", {}],
  ["without a shared panel area", { viewport: false, panelAlign: "center" }],
  ["stacked", { presentation: "stacked", defaultValue: "products" }],
  ["with a width map", { presentation: { base: "stacked", md: "mega" } }],
  ["right to left", { dir: "rtl", size: "lg", rounded: true, currentVariant: "solid" }],
  ["open by default", { defaultValue: "products" }],
  ["aligned automatically, sized, with an indicator", { panelAlign: "auto", panelSize: "full", indicator: true, currentPath: "/pricing" }],
  ["vertical", { orientation: "vertical" }],
  ["stacked with several open", { presentation: "stacked", exclusive: false, currentPath: "/analytics" }],
];

beforeEach(() => {
  vi.stubGlobal("ResizeObserver", StubResizeObserver);
});

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("NavigationMenu on the server", () => {
  it.each(variants)("renders %s without touching the browser", (_name, props) => {
    const html = onTheServer(() => renderToString(<Tree {...props} />));
    expect(html).toContain("Products");
    expect(html).toContain("Pricing");
  });

  it("renders inside a Navbar", () => {
    const html = onTheServer(() =>
      renderToString(
        <Navbar>
          <Navbar.Brand>Acme</Navbar.Brand>
          <Navbar.Links>
            <Tree />
          </Navbar.Links>
        </Navbar>,
      ),
    );
    expect(html).toContain("Products");
  });
});

describe("NavigationMenu hydration", () => {
  it.each(variants)("hydrates %s with no recoverable error", async (_name, props) => {
    const html = onTheServer(() => renderToString(<Tree {...props} />));
    const container = document.createElement("div");
    container.innerHTML = html;
    document.body.append(container);
    const errors: unknown[] = [];
    await act(async () => {
      hydrateRoot(container, <Tree {...props} />, { onRecoverableError: (error) => errors.push(error) });
    });
    expect(errors).toEqual([]);
    container.remove();
  });
});
