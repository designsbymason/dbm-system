import { render, screen } from "@testing-library/react";
import { axe } from "jest-axe";
import { createRef } from "react";
import { describe, expect, it } from "vitest";
import { SkipLink } from "./SkipLink";
import styles from "./SkipLink.module.css";

// jsdom draws no layout, so these tests are about the link's markup, words and passthrough. Its hiding, its place in the corner, the ring and
// print are in the real-browser checks.
describe("SkipLink", () => {
  it("is a link to #main with the default words", () => {
    render(<SkipLink />);
    const link = screen.getByRole("link", { name: "Skip to content" });
    expect(link).toHaveAttribute("href", "#main");
    expect(link).toHaveClass(styles.skipLink!);
  });

  it("goes where href says", () => {
    render(<SkipLink href="#page" />);
    expect(screen.getByRole("link")).toHaveAttribute("href", "#page");
  });

  it("takes its words from labels, and children win over labels", () => {
    const { rerender } = render(<SkipLink labels={{ skipToContent: "Aller au contenu" }} />);
    expect(screen.getByRole("link", { name: "Aller au contenu" })).toBeInTheDocument();
    rerender(<SkipLink labels={{ skipToContent: "Aller au contenu" }}>Sauter</SkipLink>);
    expect(screen.getByRole("link", { name: "Sauter" })).toBeInTheDocument();
  });

  it("keeps the default words for a labels value passed as undefined", () => {
    render(<SkipLink labels={{ skipToContent: undefined }} />);
    expect(screen.getByRole("link", { name: "Skip to content" })).toBeInTheDocument();
  });

  it("forwards a ref to the anchor", () => {
    const ref = createRef<HTMLAnchorElement>();
    render(<SkipLink ref={ref} />);
    expect(ref.current).toBeInstanceOf(HTMLAnchorElement);
  });

  it("passes className, style, id, data-testid and native attributes through, merging className with its own", () => {
    render(<SkipLink className="extra" style={{ color: "red" }} id="skip" data-testid="skip" onClick={() => undefined} aria-describedby="note" />);
    const link = screen.getByTestId("skip");
    expect(link).toHaveClass("extra");
    expect(link).toHaveClass(styles.skipLink!);
    expect(link).toHaveAttribute("id", "skip");
    expect(link).toHaveAttribute("aria-describedby", "note");
    expect(link).toHaveStyle({ color: "rgb(255, 0, 0)" });
  });

  it("has no accessibility violations", async () => {
    const { container } = render(
      <>
        <SkipLink />
        <main id="main" tabIndex={-1}>
          Page
        </main>
      </>,
    );
    expect(await axe(container)).toHaveNoViolations();
  });
});
