import { act, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { axe } from "jest-axe";
import { afterEach, describe, expect, it, vi } from "vitest";
import { Stepper } from "./Stepper";
import { Basic, item } from "./stepperTestKit";

afterEach(() => {
  vi.restoreAllMocks();
  vi.useRealTimers();
});

describe("Stepper — the compact form", () => {
  const queryListeners = new Set<(event: { matches: boolean }) => void>();
  const original = window.matchMedia;
  afterEach(() => {
    window.matchMedia = original;
    queryListeners.clear();
  });
  const mockMedia = () => {
    window.matchMedia = ((query: string) =>
      ({
        matches: false,
        media: query,
        addEventListener: (_: string, listener: (event: { matches: boolean }) => void) => queryListeners.add(listener),
        removeEventListener: (_: string, listener: (event: { matches: boolean }) => void) => queryListeners.delete(listener),
        addListener: () => {},
        removeListener: () => {},
      }) as unknown as MediaQueryList) as typeof window.matchMedia;
  };

  it("draws no summary unless compact", () => {
    const { container, rerender } = render(<Basic />);
    expect(container.querySelector("[class*='_summary_']")).toBeNull();
    rerender(<Basic compact="auto" />);
    expect(container.querySelector("[class*='_summary_']")).not.toBeNull();
  });

  it("offers a button back to the nearest step that can be entered, and goes there", async () => {
    const onValueChange = vi.fn();
    const user = userEvent.setup();
    render(<Basic compact="always" interactive="completed" defaultValue="payment" onValueChange={onValueChange} />);
    await user.click(screen.getByRole("button", { name: "Previous step" }));
    expect(onValueChange).toHaveBeenCalledWith("shipping");
  });

  it("offers a button forward to the nearest step that can be entered, and goes there", async () => {
    const onValueChange = vi.fn();
    const user = userEvent.setup();
    render(<Basic compact="always" interactive="all" defaultValue="shipping" onValueChange={onValueChange} />);
    await user.click(screen.getByRole("button", { name: "Next step" }));
    expect(onValueChange).toHaveBeenCalledWith("payment");
  });

  it("disables the forward button with interactive=completed, since nothing ahead can be entered", () => {
    render(<Basic compact="always" interactive="completed" defaultValue="shipping" />);
    expect(screen.getByRole("button", { name: "Next step" })).toBeDisabled();
    expect(screen.getByRole("button", { name: "Previous step" })).toBeEnabled();
  });

  it("always draws both buttons side by side when interactive, disabling the one with nowhere to go", () => {
    const { container, rerender } = render(<Basic compact="always" interactive="all" value="shipping" />);
    const group = container.querySelector("[class*='_summaryButtons_']")!;
    expect(group.children).toHaveLength(2);
    expect(screen.getByRole("button", { name: "Previous step" })).toBeEnabled();
    expect(screen.getByRole("button", { name: "Next step" })).toBeEnabled();
    rerender(<Basic compact="always" interactive="all" value="account" />);
    expect(group.children).toHaveLength(2);
    expect(screen.getByRole("button", { name: "Previous step" })).toBeDisabled();
    expect(screen.getByRole("button", { name: "Next step" })).toBeEnabled();
    rerender(<Basic compact="always" interactive="all" value="review" />);
    expect(screen.getByRole("button", { name: "Previous step" })).toBeEnabled();
    expect(screen.getByRole("button", { name: "Next step" })).toBeDisabled();
    rerender(<Basic compact="always" value="shipping" />);
    expect(container.querySelector("[class*='_summaryButtons_']")).toBeNull();
  });

  it("puts the text between Back and Next with labelAlignment=center", () => {
    const { container } = render(<Basic compact="always" interactive="all" labelAlignment="center" value="shipping" />);
    const row = container.querySelector("[class*='_summaryRow_']")!;
    expect(row.className).toMatch(/summaryRowCenter/);
    expect(row.children).toHaveLength(3);
    expect(row.children[0]).toHaveAttribute("aria-label", "Previous step");
    expect(row.children[1]).toHaveClass(/summaryText/);
    expect(row.children[2]).toHaveAttribute("aria-label", "Next step");
    expect(container.querySelector("[class*='_summaryButtons_']")).toBeNull();
  });

  it("starts the text at the start, with the buttons grouped at the end, by default", () => {
    const { container } = render(<Basic compact="always" interactive="all" value="shipping" />);
    const row = container.querySelector("[class*='_summaryRow_']")!;
    expect(row.className).not.toMatch(/summaryRowCenter/);
    expect(row.children[0]).toHaveClass(/summaryText/);
    expect(row.children[1]).toHaveClass(/summaryButtons/);
  });

  it("centres the text alone when there are no buttons", () => {
    const { container } = render(<Basic compact="always" labelAlignment="center" value="shipping" />);
    const row = container.querySelector("[class*='_summaryRow_']")!;
    expect(row.className).toMatch(/summaryRowCenter/);
    expect(row.children).toHaveLength(1);
  });

  it("warns once where the centred alignment cannot apply, and not where it can", () => {
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
    const { rerender } = render(<Basic compact="always" labelAlignment="center" value="shipping" />);
    expect(warn).not.toHaveBeenCalled();
    rerender(<Basic labelAlignment="center" value="shipping" />);
    expect(warn).toHaveBeenCalledWith(expect.stringContaining("labelAlignment"));
    warn.mockClear();
    rerender(<Basic compact="always" orientation="vertical" labelAlignment="center" value="shipping" />);
    expect(warn).toHaveBeenCalledWith(expect.stringContaining("labelAlignment"));
  });

  it("draws the vertical summary as one column: Up, the bars, Down, then the place as numbers alone", () => {
    const { container, rerender } = render(<Basic compact="always" orientation="vertical" interactive="all" value="shipping" />);
    const summary = container.querySelector("[class*='_summary_']")!;
    const parts = () => [...summary.children];
    expect(parts()).toHaveLength(4);
    expect(parts()[0]).toHaveAttribute("aria-label", "Previous step");
    expect(parts()[1]).toHaveClass(/segments/);
    expect(parts()[2]).toHaveAttribute("aria-label", "Next step");
    expect(parts()[3]).toHaveClass(/summaryText/);
    // What is seen is "2/4"; a screen reader gets the words and the title instead.
    expect(parts()[3]!.querySelector("[aria-hidden='true']")).toHaveTextContent("2/4");
    expect(parts()[3]).toHaveTextContent("Step 2 of 4 — Shipping");
    rerender(<Basic compact="always" orientation="vertical" interactive="all" value="account" />);
    expect(parts()).toHaveLength(4);
    expect(parts()[0]).toBeDisabled();
    rerender(<Basic compact="always" orientation="vertical" interactive="all" value="review" />);
    expect(parts()).toHaveLength(4);
    expect(parts()[2]).toBeDisabled();
  });

  it("writes the place with formatNumber and a translated label", () => {
    const { container, rerender } = render(
      <Basic compact="always" orientation="vertical" formatNumber={(n) => `#${n}`} value="shipping" />,
    );
    expect(container.querySelector("[class*='_summaryText_'] [aria-hidden='true']")).toHaveTextContent("#2/#4");
    expect(container.querySelector("[class*='_summaryText_']")).toHaveTextContent("Step #2 of #4");
    rerender(
      <Basic compact="always" orientation="vertical" labels={{ place: (n, total) => `${n} of ${total}` }} value="shipping" />,
    );
    expect(container.querySelector("[class*='_summaryText_'] [aria-hidden='true']")).toHaveTextContent("2 of 4");
  });

  it("keeps focus in the summary when the button that was pressed becomes disabled", async () => {
    const user = userEvent.setup();
    render(<Basic compact="always" interactive="all" defaultValue="payment" />);
    await user.click(screen.getByRole("button", { name: "Previous step" }));
    await user.click(screen.getByRole("button", { name: "Previous step" }));
    expect(screen.getByRole("button", { name: "Previous step" })).toBeDisabled();
    expect(document.activeElement?.tagName).not.toBe("BODY");
    expect(screen.getByRole("button", { name: "Next step" })).toHaveFocus();
  });

  it("draws no buttons without interactive", () => {
    render(<Basic compact="always" defaultValue="payment" />);
    expect(screen.queryByRole("button", { name: "Previous step" })).toBeNull();
    expect(screen.queryByRole("button", { name: "Next step" })).toBeNull();
  });

  it("moves focus to the back button when the width goes compact with focus in the steps", () => {
    mockMedia();
    render(<Basic compact="auto" interactive="all" defaultValue="payment" />);
    const step = screen.getAllByRole("button").find((button) => button.textContent?.startsWith("Account"))!;
    step.focus();
    expect(step).toHaveFocus();
    act(() => queryListeners.forEach((listener) => listener({ matches: true })));
    expect(screen.getByRole("button", { name: "Previous step", hidden: true })).toHaveFocus();
  });

  it("moves focus to the forward button when there is no back button", () => {
    mockMedia();
    render(<Basic compact="auto" interactive="all" defaultValue="account" />);
    screen.getAllByRole("button")[0]!.focus();
    act(() => queryListeners.forEach((listener) => listener({ matches: true })));
    expect(screen.getByRole("button", { name: "Next step", hidden: true })).toHaveFocus();
  });

  it("moves focus back to a step when the width goes full with focus in the summary", () => {
    mockMedia();
    render(<Basic compact="auto" interactive="completed" defaultValue="payment" />);
    screen.getByRole("button", { name: "Previous step", hidden: true }).focus();
    act(() => queryListeners.forEach((listener) => listener({ matches: false })));
    expect(document.activeElement?.tagName).toBe("BUTTON");
    expect(document.activeElement?.className).toMatch(/step/);
  });

  it("leaves focus alone when it is outside the stepper", () => {
    mockMedia();
    render(
      <>
        <button>outside</button>
        <Basic compact="auto" interactive="all" />
      </>,
    );
    screen.getByRole("button", { name: "outside" }).focus();
    act(() => queryListeners.forEach((listener) => listener({ matches: true })));
    expect(screen.getByRole("button", { name: "outside" })).toHaveFocus();
  });
});

describe("Stepper — without labels", () => {
  it("hides the text from the eye but keeps it for a screen reader, and names each step", () => {
    render(
      <Basic showLabels={false} interactive="all" defaultValue="a">
        <Stepper.Step value="a" title="One" description="First" optional />
        <Stepper.Step value="b" title="Two" />
      </Basic>,
    );
    // Still in the page, so the control's name is unchanged.
    expect(screen.getByRole("button", { name: /^Two/ })).toBeInTheDocument();
    const text = screen.getByText("One").closest("span[style]") as HTMLElement;
    expect(text.style.position).toBe("absolute");
    expect(item("One")).toHaveTextContent("Step 1 of 2, current");
  });

  it("shows the title in a tooltip when a step is focused, only without labels", async () => {
    const user = userEvent.setup();
    const { rerender } = render(
      <Basic showLabels={false} interactive="all" defaultValue="a">
        <Stepper.Step value="a" title="One" />
        <Stepper.Step value="b" title={<em>Two</em>} textValue="Second" />
        <Stepper.Step value="c" title={<em>Three</em>} />
      </Basic>,
    );
    await user.tab();
    expect(await screen.findByRole("tooltip")).toHaveTextContent("Second");
    await user.tab();
    // A title that is not plain text and has no textValue has nothing to say in a tooltip.
    expect(screen.getByRole("button", { name: /^Three/ })).toHaveFocus();
    expect(screen.queryByRole("tooltip")).toBeNull();
    rerender(
      <Basic interactive="all" defaultValue="a">
        <Stepper.Step value="a" title="One" />
        <Stepper.Step value="b" title="Two" />
      </Basic>,
    );
    await user.tab({ shift: true });
    await user.tab();
    expect(screen.queryByRole("tooltip")).toBeNull();
  });

  it("gives a disabled step no tooltip, since a disabled button gets no pointer events", async () => {
    const user = userEvent.setup();
    render(
      <Basic showLabels={false} interactive="all" defaultValue="a">
        <Stepper.Step value="a" title="One" />
        <Stepper.Step value="b" title="Two" disabled />
        <Stepper.Step value="c" title="Three" />
      </Basic>,
    );
    await user.hover(screen.getByRole("button", { name: /^Two/ }));
    expect(screen.queryByRole("tooltip")).toBeNull();
  });

  it("puts Back and Next at the two ends of the bars when there is no text, horizontally", () => {
    const { container } = render(<Basic showLabels={false} compact="always" interactive="all" value="shipping" />);
    const track = container.querySelector("[class*='_summaryTrack_']") as HTMLElement;
    expect(track.children).toHaveLength(3);
    expect(track.children[0]).toHaveAttribute("aria-label", "Previous step");
    expect(track.children[1]).toHaveClass(/segments/);
    expect(track.children[2]).toHaveAttribute("aria-label", "Next step");
  });

  it("keeps the track out of it with labels, vertically, or without buttons", () => {
    const { container, rerender } = render(<Basic compact="always" interactive="all" value="shipping" />);
    expect(container.querySelector("[class*='_summaryTrack_']")).toBeNull();
    rerender(<Basic showLabels={false} compact="always" interactive="all" orientation="vertical" value="shipping" />);
    expect(container.querySelector("[class*='_summaryTrack_']")).toBeNull();
    rerender(<Basic showLabels={false} compact="always" value="shipping" />);
    expect(container.querySelector("[class*='_summaryTrack_']")).toBeNull();
  });

  it("hides the compact summary's text the same way, and keeps the buttons", () => {
    const { container } = render(<Basic showLabels={false} compact="always" interactive="all" value="shipping" />);
    const summaryText = container.querySelector("[class*='_summaryText_']") as HTMLElement;
    expect(summaryText.parentElement?.style.position).toBe("absolute");
    expect(summaryText).toHaveTextContent("Step 2 of 4 — Shipping");
    expect(screen.getByRole("button", { name: "Previous step" })).toBeInTheDocument();
  });

  it("has no axe violations", async () => {
    const { container } = render(<Basic showLabels={false} interactive="all" compact="auto" />);
    expect(await axe(container)).toHaveNoViolations();
  });

  it("shows the text by default", () => {
    render(<Basic />);
    expect(screen.getByText("Shipping").closest("span[style]")).toBeNull();
  });
});
