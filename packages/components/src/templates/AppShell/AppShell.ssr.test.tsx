import { act } from "@testing-library/react";
import { hydrateRoot } from "react-dom/client";
import { renderToString } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";
import { Navbar } from "../../organisms/Navbar";
import { Sidebar } from "../../organisms/Sidebar";
import { AppShell } from "./AppShell";

// Server rendering. The unit project runs in jsdom, where `window` and `document` exist, so the server render is done with both
// removed: what it proves is that nothing touches them while rendering.
function onTheServer<T>(render: () => T): T {
  vi.stubGlobal("window", undefined);
  vi.stubGlobal("document", undefined);
  try {
    return render();
  } finally {
    vi.unstubAllGlobals();
  }
}

describe("AppShell on the server", () => {
  it("renders every slot and its landmarks without a DOM", () => {
    const html = onTheServer(() =>
      renderToString(
        <AppShell>
          <AppShell.Header>
            <Navbar>
              <Navbar.SkipLink />
              <Navbar.Brand href="/">Acme</Navbar.Brand>
            </Navbar>
          </AppShell.Header>
          <AppShell.Sidebar>
            <Sidebar>
              <Sidebar.Content>
                <Sidebar.Nav>
                  <Sidebar.Item href="/">Home</Sidebar.Item>
                </Sidebar.Nav>
              </Sidebar.Content>
            </Sidebar>
          </AppShell.Sidebar>
          <AppShell.Main>Hello</AppShell.Main>
          <AppShell.Footer>Foot</AppShell.Footer>
        </AppShell>,
      ),
    );
    expect(html).toContain("<main");
    expect(html).toContain('id="main"');
    expect(html).toContain("<header");
    expect(html).toContain("<footer");
    expect(html).toContain("Hello");
  });

  it("renders the skip link, the header as a real banner, the aside and the page-change region without a DOM", () => {
    const html = onTheServer(() =>
      renderToString(
        <AppShell pageKey="/orders" pageTitle="Orders" headerSpan="full" asideCollapseTo="drawer" defaultAsideOpen>
          <AppShell.SkipLink />
          <AppShell.Header as="header">
            <AppShell.AsideToggle />
          </AppShell.Header>
          <AppShell.Main>Hello</AppShell.Main>
          <AppShell.Aside aria-label="Details" width="24rem">
            Aside
          </AppShell.Aside>
        </AppShell>,
      ),
    );
    expect(html).toContain('href="#main"');
    expect(html).toContain("<header");
    expect(html).toContain("<aside");
    expect(html).toContain('aria-label="Details"');
    expect(html).toContain("--app-shell-aside-size:24rem");
    expect(html).toContain('data-header-span="full"');
    expect(html).toContain('data-aside-collapse="lg"');
    // the live region for a page change is in the first server render, empty, so a later announcement is a change
    expect(html).toContain('role="status"');
  });

  it("renders a busy main area and a whole-page state without a DOM", () => {
    const html = onTheServer(() =>
      renderToString(
        <AppShell dir="rtl">
          <AppShell.Main busy>
            <AppShell.State kind="error" title="Could not load" />
          </AppShell.Main>
        </AppShell>,
      ),
    );
    expect(html).toContain('aria-busy="true"');
    expect(html).toContain("Could not load");
    expect(html).toContain('dir="rtl"');
  });
});

// Hydration. `renderToString` with the DOM removed proves nothing throws on the server; only `hydrateRoot` over that HTML, with
// `onRecoverableError` collected (React reports a mismatch there, not through `console.error`), proves the first client render matches it
// (`06` §9). What the server could not have drawn (the measured heights, the media query for the rail) waits for the first commit.
describe("AppShell hydrating", () => {
  const shell = (props: Record<string, unknown> = {}) => (
    <AppShell scroll="page" railBelow="xl" persistKey="hydrate-test" {...props}>
      <AppShell.Banner sticky>Maintenance tonight</AppShell.Banner>
      <AppShell.Header as="header">
        <AppShell.AsideToggle />
      </AppShell.Header>
      <AppShell.Sidebar resizable>
        <Sidebar>
          <Sidebar.Content>
            <Sidebar.Nav aria-label="Main">
              <Sidebar.Item href="/" current>
                Home
              </Sidebar.Item>
            </Sidebar.Nav>
          </Sidebar.Content>
        </Sidebar>
      </AppShell.Sidebar>
      <AppShell.Main busy>
        <AppShell.State kind="empty" title="Nothing here" />
      </AppShell.Main>
      <AppShell.Aside aria-label="Details">Aside</AppShell.Aside>
      <AppShell.Footer sticky>Foot</AppShell.Footer>
    </AppShell>
  );

  async function hydrate(element: React.ReactElement) {
    const html = onTheServer(() => renderToString(element));
    const container = document.createElement("div");
    container.innerHTML = html;
    document.body.append(container);
    const recoverable: unknown[] = [];
    const warn = vi.spyOn(console, "error").mockImplementation(() => undefined);
    let root!: ReturnType<typeof hydrateRoot>;
    await act(async () => {
      root = hydrateRoot(container, element, { onRecoverableError: (error) => recoverable.push(error) });
    });
    const errors = warn.mock.calls.map((call) => String(call[0]));
    warn.mockRestore();
    const unmount = async () => {
      await act(async () => root.unmount());
      container.remove();
    };
    return { container, recoverable, errors, unmount };
  }

  it("matches the server HTML in a page-scrolling shell with every part, with no recoverable error", async () => {
    const { container, recoverable, errors, unmount } = await hydrate(shell());
    expect(recoverable).toEqual([]);
    expect(errors.filter((message) => /hydrat|did not match|mismatch/i.test(message))).toEqual([]);
    expect(container.querySelector("main")).toHaveAttribute("aria-busy", "true");
    await unmount();
  });

  it("matches in right-to-left and content-scrolling shells too", async () => {
    for (const props of [{ dir: "rtl" }, { scroll: "content" }, { dir: "rtl", scroll: "content", collapsed: true }]) {
      const { recoverable, errors, unmount } = await hydrate(shell(props));
      expect(recoverable).toEqual([]);
      expect(errors.filter((message) => /hydrat|did not match|mismatch/i.test(message))).toEqual([]);
      await unmount();
    }
  });

  it("measures the header only after hydrating, so the heights it sets were not in the server HTML", async () => {
    const html = onTheServer(() => renderToString(shell()));
    expect(html).not.toContain("--app-shell-header-height");
    expect(html).not.toContain("data-header-measured");
    const rect = vi.spyOn(HTMLElement.prototype, "getBoundingClientRect").mockReturnValue({ height: 64, width: 100, top: 0, left: 0, right: 100, bottom: 64, x: 0, y: 0, toJSON: () => ({}) });
    const { container, recoverable, unmount } = await hydrate(shell());
    expect(recoverable).toEqual([]);
    const frame = container.querySelector<HTMLElement>("[data-scroll]")!;
    expect(frame).toHaveAttribute("data-header-measured");
    expect(frame.style.getPropertyValue("--app-shell-header-height")).toBe("64px");
    rect.mockRestore();
    await unmount();
  });
});
