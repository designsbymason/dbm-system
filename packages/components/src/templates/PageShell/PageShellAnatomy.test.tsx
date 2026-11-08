import { render, screen, within } from "@testing-library/react";
import { axe } from "jest-axe";
import { describe, expect, it } from "vitest";
import { PageShellAnatomy } from "./PageShellAnatomy";

// The diagram on PageShell's Docs page: every part it draws, in a named figure, readable without the picture and free of accessibility violations.
describe("PageShellAnatomy", () => {
  it("is a named figure holding both layouts", () => {
    render(<PageShellAnatomy />);
    expect(screen.getByRole("figure", { name: /anatomy of a pageshell page/i })).toBeInTheDocument();
    expect(screen.getByText(/a page with no aside:/i)).toBeInTheDocument();
    expect(screen.getByText(/a page with an aside:/i)).toBeInTheDocument();
  });

  it("names every part of the shell at least once", () => {
    const { container } = render(<PageShellAnatomy />);
    const text = container.textContent ?? "";
    for (const part of ["PageShell.SkipLink", "PageShell.Banner", "Navbar", "PageShell.Main", "PageShell.Bleed", "PageShell.Content", "PageShell.Body", "PageShell.Aside", "PageShell.AsideToggle", "PageShell.Footer"]) {
      expect(text, `the diagram does not name ${part}`).toContain(part);
    }
  });

  it("draws Bleed and Content inside Main in the first layout, and Main inside Body in the second", () => {
    render(<PageShellAnatomy />);
    const figure = screen.getByRole("figure");
    const nameOf = (element: Element) => element.querySelector("code")?.textContent;
    const mains = within(figure).getAllByText("PageShell.Main");
    const first = mains[0]!.closest("p")!.parentElement!;
    expect(within(first).getByText("PageShell.Bleed")).toBeInTheDocument();
    expect(within(first).getByText("PageShell.Content")).toBeInTheDocument();
    const body = within(figure).getByText("PageShell.Body").closest("p")!.parentElement!;
    expect(nameOf(body)).toBe("PageShell.Body");
    expect(within(body).getByText("PageShell.Main")).toBeInTheDocument();
    expect(within(body).queryByText("PageShell.Bleed")).toBeNull();
  });

  it("has no accessibility violations", async () => {
    const { container } = render(<PageShellAnatomy />);
    expect(await axe(container)).toHaveNoViolations();
  });
});
