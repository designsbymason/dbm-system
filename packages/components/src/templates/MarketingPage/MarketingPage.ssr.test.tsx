import { act } from "@testing-library/react";
import { StrictMode } from "react";
import { hydrateRoot } from "react-dom/client";
import { renderToString } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";
import { MarketingPage, marketingCopy } from "./MarketingPageStoryKit";

// Server rendering. The unit project runs in jsdom, where `window` and `document` exist, so the server render is done with both removed: what it proves
// is that nothing touches them while rendering. The hydration test then proves the first client render draws what the server drew, with the recoverable
// errors collected. (A sticky `Navbar` and `BackToTop` watch the page with an `IntersectionObserver`, which jsdom does not have.)
function onTheServer<T>(render: () => T): T {
  vi.stubGlobal("window", undefined);
  vi.stubGlobal("document", undefined);
  try {
    return render();
  } finally {
    vi.unstubAllGlobals();
  }
}

describe("the marketing page on the server", () => {
  it("renders the page and its landmarks without a DOM", () => {
    const html = onTheServer(() => renderToString(<MarketingPage />));
    expect(html).toContain(marketingCopy.title);
    expect(html.match(/<main/g)).toHaveLength(1);
    expect(html.match(/<h1/g)).toHaveLength(1);
    expect(html.match(/<footer/g)).toHaveLength(1);
  });

  it.each([
    ["the page", {}],
    ["a short page", { features: 1, proof: false }],
  ])("hydrates %s with no mismatch", async (_name, props) => {
    const html = onTheServer(() => renderToString(<MarketingPage {...props} />));
    vi.stubGlobal("IntersectionObserver", class { observe() {} unobserve() {} disconnect() {} takeRecords() { return []; } });
    // The menu is drawn by `NavigationMenu`, whose primitive watches its sizes with a `ResizeObserver`, which jsdom does not have either.
    vi.stubGlobal("ResizeObserver", class { observe() {} unobserve() {} disconnect() {} });
    const container = document.createElement("div");
    container.innerHTML = html;
    document.body.append(container);
    const recoverable: unknown[] = [];
    await act(async () => {
      hydrateRoot(
        container,
        <StrictMode>
          <MarketingPage {...props} />
        </StrictMode>,
        { onRecoverableError: (error) => recoverable.push(error) },
      );
    });
    expect(recoverable).toEqual([]);
    container.remove();
    vi.unstubAllGlobals();
  });
});
