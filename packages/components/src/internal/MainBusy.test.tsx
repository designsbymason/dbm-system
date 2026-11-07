import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { MainBusy } from "./MainBusy";

describe("MainBusy", () => {
  it("draws nothing while busy is left out", () => {
    const { container } = render(<MainBusy busy={undefined} label="Loading" barClassName="bar" />);
    expect(container).toBeEmptyDOMElement();
  });

  it("draws a bar hidden from assistive technology and says the label politely while busy", () => {
    const { container } = render(<MainBusy busy label="Loading" barClassName="bar" />);
    const bar = container.querySelector(".bar");
    expect(bar).toHaveAttribute("aria-hidden", "true");
    expect(screen.getByRole("status")).toHaveTextContent("Loading");
  });

  it("keeps the region, emptied, when busy turns false, so Loading was a change and not a first appearance", () => {
    const { container, rerender } = render(<MainBusy busy label="Loading" barClassName="bar" />);
    rerender(<MainBusy busy={false} label="Loading" barClassName="bar" />);
    expect(container.querySelector(".bar")).toBeNull();
    expect(screen.getByRole("status")).toHaveTextContent("");
  });

  it("copes with a missing label", () => {
    render(<MainBusy busy label={undefined} barClassName={undefined} />);
    expect(screen.getByRole("status")).toHaveTextContent("");
  });
});
