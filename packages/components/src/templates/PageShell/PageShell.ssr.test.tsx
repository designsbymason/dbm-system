import { act } from "@testing-library/react";
import { StrictMode } from "react";
import { hydrateRoot } from "react-dom/client";
import { renderToString } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";
import { DemoPageShell } from "./PageShellStoryKit";
import { PageShell } from "./PageShell";

// Server rendering. The unit project runs in jsdom, where `window` and `document` exist, so the server render is done with both removed: what it
// proves is that nothing touches them while rendering. The hydration test then proves the first client render draws what the server drew, with
// the recoverable errors collected. The shell measures nothing, so there is no unmeasured state to wait out.
function onTheServer<T>(render: () => T): T {
  vi.stubGlobal("window", undefined);
  vi.stubGlobal("document", undefined);
  try {
    return render();
  } finally {
    vi.unstubAllGlobals();
  }
}

describe("PageShell on the server", () => {
  it("renders every part and its landmarks without a DOM", () => {
    const html = onTheServer(() => renderToString(<DemoPageShell subNav banner />));
    expect(html.match(/<main/g)).toHaveLength(1);
    expect(html.match(/<footer/g)).toHaveLength(1);
    expect(html).toContain('id="main"');
    expect(html).toContain('href="#main"');
    // The header is the app's own and a direct child of the shell: one banner, and no box of the shell's around it.
    expect(html.match(/<header/g)).toHaveLength(1);
    expect(html).toContain("data-navbar-trailing");
  });

  it("renders an aside as a sibling landmark of main, marked with its collapse, without a DOM", () => {
    const html = onTheServer(() => renderToString(<DemoPageShell aside asideSticky asideCollapse="drawer" />));
    expect(html.match(/<aside/g)).toHaveLength(1);
    expect(html.match(/<main/g)).toHaveLength(1);
    expect(html).toContain('data-collapse="drawer"');
    expect(html).toContain("data-sticky");
    // The drawer is drawn only once it is open, in a portal, so the server draws none.
    expect(html).not.toContain('role="dialog"');
  });

  it("renders a right-to-left shell in Persian without a DOM", () => {
    const html = onTheServer(() => renderToString(<DemoPageShell dir="rtl" />));
    expect(html).toContain('dir="rtl"');
    expect(html).toContain('lang="fa"');
  });

  it("draws the live regions only when they are asked for", () => {
    const plain = onTheServer(() => renderToString(<PageShell><PageShell.Main>Main</PageShell.Main></PageShell>));
    expect(plain).not.toContain('role="status"');
    const asked = onTheServer(() =>
      renderToString(
        <PageShell pageKey="/a">
          <PageShell.Main busy>Main</PageShell.Main>
        </PageShell>,
      ),
    );
    expect(asked.match(/role="status"/g)).toHaveLength(2);
  });

  it.each([
    ["a page", {}],
    ["a navigating page that lands on its heading", { navigating: true, focusTarget: "heading" as const, scrollToTopOnChange: true }],
    ["a right-to-left page", { dir: "rtl" as const }],
    ["a busy page with every part", { subNav: true, banner: true, busy: true }],
    ["a page with a sticky aside as a drawer", { aside: true, asideSticky: true, asideCollapse: "drawer" as const, defaultAsideOpen: false }],
    ["a right-to-left page with an aside at the start", { dir: "rtl" as const, aside: true, asideSide: "start" as const }],
  ])("hydrates %s with no mismatch", async (_name, props) => {
    const html = onTheServer(() => renderToString(<DemoPageShell {...props} />));
    // A sticky `Navbar` (an `Affix`) watches a sentinel with an `IntersectionObserver`, which jsdom does not have.
    vi.stubGlobal("IntersectionObserver", class { observe() {} unobserve() {} disconnect() {} takeRecords() { return []; } });
    const container = document.createElement("div");
    container.innerHTML = html;
    document.body.append(container);
    const recoverable: unknown[] = [];
    await act(async () => {
      hydrateRoot(
        container,
        <StrictMode>
          <DemoPageShell {...props} />
        </StrictMode>,
        { onRecoverableError: (error) => recoverable.push(error) },
      );
    });
    expect(recoverable).toEqual([]);
    container.remove();
    vi.unstubAllGlobals();
  });
});
