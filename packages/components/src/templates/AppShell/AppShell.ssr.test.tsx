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
});
