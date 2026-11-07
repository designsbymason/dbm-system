import { act } from "@testing-library/react";
import { StrictMode } from "react";
import { hydrateRoot } from "react-dom/client";
import { renderToString } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";
import { DemoTopNavShell } from "./TopNavShellStoryKit";
import { TopNavShell } from "./TopNavShell";

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

describe("TopNavShell on the server", () => {
  it("renders every part and its landmarks without a DOM", () => {
    const html = onTheServer(() => renderToString(<DemoTopNavShell subNav banner />));
    expect(html.match(/<main/g)).toHaveLength(1);
    expect(html.match(/<footer/g)).toHaveLength(1);
    expect(html).toContain('id="main"');
    expect(html).toContain('href="#main"');
    expect(html).toContain("data-sticky-header");
    // The scrolled state is read only after mount: the server never draws it.
    expect(html).not.toContain("data-scrolled=");
  });

  it("renders a right-to-left shell in Persian without a DOM", () => {
    const html = onTheServer(() => renderToString(<DemoTopNavShell dir="rtl" />));
    expect(html).toContain('dir="rtl"');
    expect(html).toContain('lang="fa"');
  });

  it("draws the live regions only when they are asked for", () => {
    const plain = onTheServer(() => renderToString(<TopNavShell><TopNavShell.Main>Main</TopNavShell.Main></TopNavShell>));
    expect(plain).not.toContain('role="status"');
    const asked = onTheServer(() =>
      renderToString(
        <TopNavShell pageKey="/a">
          <TopNavShell.Main busy>Main</TopNavShell.Main>
        </TopNavShell>,
      ),
    );
    expect(asked.match(/role="status"/g)).toHaveLength(2);
  });

  it.each([
    ["a page", {}],
    ["a right-to-left page", { dir: "rtl" as const }],
    ["a busy page with every part", { subNav: true, banner: true, busy: true }],
  ])("hydrates %s with no mismatch", async (_name, props) => {
    const html = onTheServer(() => renderToString(<DemoTopNavShell {...props} />));
    const container = document.createElement("div");
    container.innerHTML = html;
    document.body.append(container);
    const recoverable: unknown[] = [];
    await act(async () => {
      hydrateRoot(
        container,
        <StrictMode>
          <DemoTopNavShell {...props} />
        </StrictMode>,
        { onRecoverableError: (error) => recoverable.push(error) },
      );
    });
    expect(recoverable).toEqual([]);
    container.remove();
  });
});
