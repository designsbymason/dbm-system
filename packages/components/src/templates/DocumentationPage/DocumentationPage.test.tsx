import { render, screen, within } from "@testing-library/react";
import { axe } from "jest-axe";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { DocumentationPage, documentationCopy } from "./DocumentationPageStoryKit";

// jsdom lays nothing out, so these tests are about structure: the landmarks and their names, the outline matching the page's sections, the optional
// parts, and accessibility. Where the columns are, how they stick and the phone panel are in the real-browser checks.
beforeEach(() => {
  // A sticky `Navbar` and the outline watch the page with an `IntersectionObserver`, which jsdom does not have.
  vi.stubGlobal("IntersectionObserver", class { observe() {} unobserve() {} disconnect() {} takeRecords() { return []; } });
});

describe("the documentation page", () => {
  // (The header's links are a navigation named "Main" on a desktop: the real-browser checks read it, since jsdom has no width to say where the bar collapses.)
  it("has each landmark once, and every navigation is named differently", () => {
    render(<DocumentationPage />);
    expect(screen.getAllByRole("banner")).toHaveLength(1);
    expect(screen.getAllByRole("main")).toHaveLength(1);
    expect(screen.getAllByRole("contentinfo")).toHaveLength(1);
    expect(screen.getAllByRole("complementary")).toHaveLength(1);
    const names = screen.getAllByRole("navigation").map((nav) => nav.getAttribute("aria-label") ?? within(nav).queryByRole("heading")?.textContent ?? "");
    expect(new Set(names).size).toBe(names.length);
    expect(names).toEqual(expect.arrayContaining([documentationCopy.sidebarName, documentationCopy.contentsName, documentationCopy.footerNavigation]));
  });

  it("has one h1 and a heading for each section, and the outline lists the same sections", () => {
    render(<DocumentationPage />);
    expect(screen.getAllByRole("heading", { level: 1 })).toHaveLength(1);
    const outline = screen.getByRole("complementary", { name: documentationCopy.contentsTitle });
    for (const section of documentationCopy.sections) {
      expect(screen.getByRole("heading", { level: 2, name: section.title })).toBeInTheDocument();
      expect(within(outline).getByRole("link", { name: section.title })).toHaveAttribute("href", `#${section.id}`);
    }
  });

  it("has one menu button, the sidebar's, because the header's links are hidden below lg and offered in its panel", () => {
    render(<DocumentationPage />);
    expect(screen.getAllByRole("button", { name: "Menu" })).toHaveLength(1);
    const links = screen.getByRole("navigation", { name: documentationCopy.mainNavigation });
    expect(links).toHaveAttribute("data-hide-below", "lg");
    expect(within(links).getAllByRole("link").map((link) => link.textContent)).toEqual(documentationCopy.siteLinks);
  });

  it("marks the page the reader is on in the sidebar, and no other", () => {
    render(<DocumentationPage />);
    const sidebar = screen.getByRole("navigation", { name: documentationCopy.sidebarName });
    const current = within(sidebar).getAllByRole("link").filter((link) => link.getAttribute("aria-current") === "page");
    expect(current.map((link) => link.textContent)).toEqual([documentationCopy.title]);
  });

  it("holds only the current header link's section in the sidebar, and has no breadcrumb", () => {
    render(<DocumentationPage />);
    const sidebar = screen.getByRole("navigation", { name: documentationCopy.sidebarName });
    expect(within(sidebar).getAllByRole("link").map((link) => link.textContent)).toEqual(documentationCopy.sidebarItems);
    expect(screen.queryByRole("navigation", { name: /breadcrumb/i })).not.toBeInTheDocument();
  });

  it("takes fewer sections and no outline", () => {
    const { rerender } = render(<DocumentationPage sections={2} />);
    expect(screen.getAllByRole("heading", { level: 2 })).toHaveLength(2);
    rerender(<DocumentationPage contents={false} />);
    expect(screen.queryByRole("complementary")).not.toBeInTheDocument();
  });

  it("has no accessibility violations, with and without the outline", async () => {
    const { container, rerender } = render(<DocumentationPage />);
    expect(await axe(container)).toHaveNoViolations();
    rerender(<DocumentationPage contents={false} sections={3} />);
    expect(await axe(container)).toHaveNoViolations();
  });
});
