import { render, screen, within } from "@testing-library/react";
import { axe } from "jest-axe";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { MarketingPage, marketingCopy } from "./MarketingPageStoryKit";

// jsdom lays nothing out, so these tests are about structure: the landmarks and their names, the headings, the optional parts and accessibility. Where the
// bands are, the widths, the mega menu's panel and the phone menu are in the real-browser checks.
beforeEach(() => {
  // A sticky `Navbar` and `BackToTop` watch the page with an `IntersectionObserver`, and the menu's primitive watches its sizes with a `ResizeObserver`;
  // jsdom has neither.
  vi.stubGlobal("IntersectionObserver", class { observe() {} unobserve() {} disconnect() {} takeRecords() { return []; } });
  vi.stubGlobal("ResizeObserver", class { observe() {} unobserve() {} disconnect() {} });
});

describe("the marketing page", () => {
  // (The header's links are a navigation named "Main" on a desktop, and the Product panel opens from its trigger: the real-browser checks read both, since jsdom has
  // no width to say where the bar collapses.)
  it("has each landmark once, and every navigation is named differently", () => {
    render(<MarketingPage />);
    expect(screen.getAllByRole("banner")).toHaveLength(1);
    expect(screen.getAllByRole("main")).toHaveLength(1);
    expect(screen.getAllByRole("contentinfo")).toHaveLength(1);
    const names = screen.getAllByRole("navigation").map((nav) => nav.getAttribute("aria-label") ?? "");
    expect(new Set(names).size).toBe(names.length);
    expect(names).toEqual(expect.arrayContaining(marketingCopy.footerColumns.map((column) => column.name)));
    // The footer's columns are navigations inside the contentinfo.
    const footer = screen.getByRole("contentinfo");
    expect(within(footer).getAllByRole("navigation")).toHaveLength(marketingCopy.footerColumns.length);
  });

  it("has one h1, an h2 for each section, and the feature cards' h3s", () => {
    render(<MarketingPage />);
    expect(screen.getAllByRole("heading", { level: 1 })).toHaveLength(1);
    expect(screen.getAllByRole("heading", { level: 2 }).map((heading) => heading.textContent)).toEqual([marketingCopy.featuresTitle, marketingCopy.ctaTitle]);
    expect(screen.getAllByRole("heading", { level: 3 }).map((heading) => heading.textContent)).toEqual(marketingCopy.features.map((feature) => feature.title));
  });

  it("names the page's sections", () => {
    render(<MarketingPage />);
    const main = screen.getByRole("main");
    expect(within(main).getByRole("region", { name: marketingCopy.featuresTitle })).toBeInTheDocument();
    expect(within(main).getByRole("region", { name: marketingCopy.proofName })).toBeInTheDocument();
    expect(within(main).getByRole("region", { name: marketingCopy.ctaTitle })).toBeInTheDocument();
  });

  it("takes fewer feature cards and no strip of figures", () => {
    const { rerender } = render(<MarketingPage features={1} />);
    expect(screen.getAllByRole("heading", { level: 3 })).toHaveLength(1);
    rerender(<MarketingPage proof={false} />);
    expect(screen.queryByRole("region", { name: marketingCopy.proofName })).not.toBeInTheDocument();
    expect(screen.getAllByRole("heading", { level: 3 })).toHaveLength(3);
  });

  it("has no accessibility violations, with and without the optional parts", async () => {
    const { container, rerender } = render(<MarketingPage />);
    expect(await axe(container)).toHaveNoViolations();
    rerender(<MarketingPage features={1} proof={false} />);
    expect(await axe(container)).toHaveNoViolations();
  });
});
