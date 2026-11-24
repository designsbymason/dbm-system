import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { axe } from "jest-axe";
import { createRef } from "react";
import { describe, expect, it, vi } from "vitest";
import { CloseButton } from "./CloseButton";

describe("CloseButton", () => {
  it("renders a button with a default aria-label of Close", () => {
    render(<CloseButton />);
    expect(screen.getByRole("button", { name: "Close" })).toBeInTheDocument();
  });

  it("supports a custom aria-label for context", () => {
    render(<CloseButton aria-label="Remove tag" />);
    expect(
      screen.getByRole("button", { name: "Remove tag" }),
    ).toBeInTheDocument();
  });

  it("defaults to type=button so it doesn't submit a surrounding form", () => {
    render(<CloseButton />);
    expect(screen.getByRole("button")).toHaveAttribute("type", "button");
  });

  it("calls onClick when clicked", async () => {
    const user = userEvent.setup();
    const onClick = vi.fn();
    render(<CloseButton onClick={onClick} />);
    await user.click(screen.getByRole("button", { name: "Close" }));
    expect(onClick).toHaveBeenCalledTimes(1);
  });

  it("is neutral by default: the fixed icon.default token, regardless of an ancestor's own color", () => {
    // Styled to match IconButton's own `tertiary` variant exactly — a fixed token, not context-adaptive `currentColor`
    // inheritance (that was the pre-restyle behavior, when this component still had to serve Tag's tone-adaptive remove
    // control; Tag now implements that locally instead). An ancestor's own `color` must NOT win.
    const { container } = render(
      <div style={{ color: "rgb(255, 0, 0)" }}>
        <CloseButton />
      </div>,
    );
    expect(container.querySelector("button")).toHaveStyle({
      color: "var(--dbm-icon-default)",
    });
  });

  it("uses the fixed icon.brand token when tone is brand, regardless of an ancestor's own color", () => {
    const { container } = render(
      <div style={{ color: "rgb(255, 0, 0)" }}>
        <CloseButton tone="brand" />
      </div>,
    );
    expect(container.querySelector("button")).toHaveStyle({
      color: "var(--dbm-icon-brand)",
    });
  });

  it("uses the neutral hover fill by default and the brand one when tone is brand", () => {
    const { rerender } = render(<CloseButton aria-label="x" />);
    expect(screen.getByRole("button").className).not.toMatch(/toneBrand/);
    rerender(<CloseButton aria-label="x" tone="brand" />);
    expect(screen.getByRole("button").className).toMatch(/toneBrand/);
  });

  it("uses the fixed icon.white token when tone is white, regardless of an ancestor's own color", () => {
    const { container } = render(
      <div style={{ color: "rgb(255, 0, 0)" }}>
        <CloseButton tone="white" />
      </div>,
    );
    expect(container.querySelector("button")).toHaveStyle({
      color: "var(--dbm-icon-white)",
    });
  });

  it("sets the white class only for tone white", () => {
    const { rerender } = render(<CloseButton aria-label="x" tone="white" />);
    expect(screen.getByRole("button").className).toMatch(/toneWhite/);
    expect(screen.getByRole("button").className).not.toMatch(/toneBrand/);
    rerender(<CloseButton aria-label="x" tone="brand" />);
    expect(screen.getByRole("button").className).not.toMatch(/toneWhite/);
  });

  it("is disabled when disabled is set", () => {
    render(<CloseButton disabled />);
    expect(screen.getByRole("button", { name: "Close" })).toBeDisabled();
  });

  it("applies size as a token-driven box dimension, matching IconButton's own scale", () => {
    render(<CloseButton size="lg" />);
    expect(screen.getByRole("button", { name: "Close" })).toHaveStyle({
      height: "var(--dbm-icon-button-size-lg)",
      width: "var(--dbm-icon-button-size-lg)",
    });
  });

  it.each(["xs", "sm", "md", "lg", "xl"] as const)(
    "sizes the box from icon-button-size and the glyph from icon-size at size=%s — one prop, two matched scales, same relationship as IconButton",
    (size) => {
      const { container } = render(<CloseButton size={size} />);
      expect(screen.getByRole("button", { name: "Close" })).toHaveStyle({
        height: `var(--dbm-icon-button-size-${size})`,
        width: `var(--dbm-icon-button-size-${size})`,
      });
      expect(container.querySelector("svg")).toHaveStyle({
        height: `var(--dbm-icon-size-${size})`,
        width: `var(--dbm-icon-size-${size})`,
      });
    },
  );

  it("defaults to a square-ish shape (radius.md), matching IconButton's own default", () => {
    render(<CloseButton />);
    expect(screen.getByRole("button", { name: "Close" })).toHaveStyle({
      borderRadius: "var(--dbm-radius-md)",
    });
  });

  it("renders as a circle when rounded is set", () => {
    render(<CloseButton rounded />);
    expect(screen.getByRole("button", { name: "Close" })).toHaveStyle({
      borderRadius: "var(--dbm-radius-full)",
    });
  });

  it("doesn't apply the hasBackground class by default", () => {
    render(<CloseButton />);
    expect(screen.getByRole("button", { name: "Close" }).className).not.toMatch(
      /hasBackground/,
    );
  });

  it("applies the hasBackground class when hasBackground is set", () => {
    // The translucent layer itself renders via a `::before` pseudo-element
    // (so the icon's own opacity is unaffected), which jsdom can't
    // meaningfully compute a style for — asserting the class is applied is
    // the real, checkable contract; the CSS itself is verified live in a
    // running Storybook instance instead (05-component-api-conventions.md
    // §8's "no hardcoded values" + this project's own live-verification
    // standard for anything a unit test can't meaningfully assert).
    render(<CloseButton hasBackground />);
    expect(screen.getByRole("button", { name: "Close" }).className).toMatch(
      /hasBackground/,
    );
  });

  it("forwards ref to the underlying button", () => {
    const ref = createRef<HTMLButtonElement>();
    render(<CloseButton ref={ref} />);
    expect(ref.current).toBeInstanceOf(HTMLButtonElement);
  });

  it("applies className", () => {
    render(<CloseButton className="custom" />);
    expect(screen.getByRole("button", { name: "Close" })).toHaveClass(
      "custom",
    );
  });

  it("has no accessibility violations", async () => {
    const { container } = render(<CloseButton />);
    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });

  // Final review pass (2026-08-27): the bare-default axe check above never
  // exercised `disabled`, `rounded`, or `hasBackground` — each was only
  // assumed safe by inference, the same gap class Checkbox's own final
  // review closed for its `hasError`/`disabled` states.
  it("has no accessibility violations when disabled", async () => {
    const { container } = render(<CloseButton disabled />);
    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });

  it("has no accessibility violations when rounded", async () => {
    const { container } = render(<CloseButton rounded />);
    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });

  it("has no accessibility violations when tone is brand", async () => {
    const { container } = render(<CloseButton tone="brand" />);
    expect(await axe(container)).toHaveNoViolations();
  });

  it("has no accessibility violations when tone is white", async () => {
    const { container } = render(<CloseButton tone="white" hasBackground />);
    expect(await axe(container)).toHaveNoViolations();
  });

  it("has no accessibility violations when hasBackground is set", async () => {
    const { container } = render(<CloseButton hasBackground />);
    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });
});
