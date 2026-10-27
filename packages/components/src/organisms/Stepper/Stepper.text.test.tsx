import { act, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";
import { Stepper } from "./Stepper";
import { Basic, item } from "./stepperTestKit";

afterEach(() => {
  vi.restoreAllMocks();
  vi.useRealTimers();
});

describe("Stepper — the text it writes", () => {
  it("writes the compact summary, the announcement and the status text from one place by default", () => {
    vi.useFakeTimers();
    const { container, rerender } = render(<Basic compact="always" value="shipping" />);
    expect(container.querySelector("[class*='_summaryText_']")).toHaveTextContent("Step 2 of 4 — Shipping");
    rerender(<Basic compact="always" value="payment" />);
    act(() => vi.advanceTimersByTime(200));
    expect(screen.getByRole("status")).toHaveTextContent("Step 3 of 4: Payment");
    expect(item("Payment")).toHaveTextContent("(Step 3 of 4, current)");
  });

  it("leaves the title out of the summary and the announcement when there is none", () => {
    vi.useFakeTimers();
    const { container, rerender } = render(
      <Basic compact="always" value="a">
        <Stepper.Step value="a" title={<em>One</em>} />
        <Stepper.Step value="b" title={<em>Two</em>} />
      </Basic>,
    );
    expect(container.querySelector("[class*='_summaryText_']")).toHaveTextContent(/^Step 1 of 2$/);
    rerender(
      <Basic compact="always" value="b">
        <Stepper.Step value="a" title={<em>One</em>} />
        <Stepper.Step value="b" title={<em>Two</em>} />
      </Basic>,
    );
    act(() => vi.advanceTimersByTime(200));
    expect(screen.getByRole("status")).toHaveTextContent(/^Step 2 of 2$/);
  });

  it("uses textValue for a title that is not plain text", () => {
    const { container } = render(
      <Basic compact="always" value="a">
        <Stepper.Step value="a" title={<em>One</em>} textValue="First" />
      </Basic>,
    );
    expect(container.querySelector("[class*='_summaryText_']")).toHaveTextContent("Step 1 of 1 — First");
  });

  it("applies a translated summary, announcement and status text", () => {
    vi.useFakeTimers();
    const labels = {
      summary: (n: number, total: number, title: string) => `${title} (${n}/${total})`,
      announcement: (n: number, total: number, title: string) => `Now ${title}, ${n} of ${total}`,
      statusText: (n: number, total: number, words: string[]) => ` [${n}/${total}: ${words.join(" + ")}]`,
    };
    const { container, rerender } = render(<Basic compact="always" value="shipping" labels={labels} />);
    expect(container.querySelector("[class*='_summaryText_']")).toHaveTextContent("Shipping (2/4)");
    expect(item("Shipping")).toHaveTextContent("[2/4: current]");
    rerender(<Basic compact="always" value="payment" labels={labels} />);
    act(() => vi.advanceTimersByTime(200));
    expect(screen.getByRole("status")).toHaveTextContent("Now Payment, 3 of 4");
  });

  it("passes the busy words after the status words", () => {
    const statusText = vi.fn((_n: number, _total: number, words: string[]) => ` <${words.join("|")}>`);
    render(
      <Basic labels={{ statusText }} defaultValue="a">
        <Stepper.Step value="a" title="One" busy />
      </Basic>,
    );
    expect(statusText).toHaveBeenCalledWith(1, 1, ["current", "in progress"]);
  });

  it("builds the defaults on a translated stepOf alone, and keeps a default when an override is undefined", () => {
    const { container } = render(
      <Basic compact="always" value="shipping" labels={{ stepOf: (n, total) => `Étape ${n} sur ${total}`, summary: undefined }} />,
    );
    expect(container.querySelector("[class*='_summaryText_']")).toHaveTextContent("Étape 2 sur 4 — Shipping");
    expect(item("Shipping")).toHaveTextContent("(Étape 2 sur 4, current)");
  });

  it("writes the numbers in the defaults through formatNumber", () => {
    const { container } = render(<Basic compact="always" value="shipping" formatNumber={(n) => `#${n}`} />);
    expect(container.querySelector("[class*='_summaryText_']")).toHaveTextContent("Step #2 of #4 — Shipping");
  });
});

describe("Stepper — a started step", () => {
  it("shows the furthest step reached as started after going back, and the steps passed as finished", async () => {
    const user = userEvent.setup();
    render(<Basic interactive="completed" defaultValue="payment" />);
    expect(item("Payment")).toHaveAttribute("data-status", "current");
    await user.click(screen.getByRole("button", { name: /^Shipping/ }));
    expect(item("Account")).toHaveAttribute("data-status", "complete");
    expect(item("Shipping")).toHaveAttribute("data-status", "current");
    expect(item("Payment")).toHaveAttribute("data-status", "started");
    expect(item("Review")).toHaveAttribute("data-status", "upcoming");
    expect(item("Payment")).toHaveTextContent("started, not completed");
  });

  it("keeps a step in between finished, and goes back to started only the furthest", async () => {
    const user = userEvent.setup();
    render(<Basic interactive="completed" defaultValue="review" />);
    await user.click(screen.getByRole("button", { name: /^Account/ }));
    expect(item("Shipping")).toHaveAttribute("data-status", "complete");
    expect(item("Payment")).toHaveAttribute("data-status", "complete");
    expect(item("Review")).toHaveAttribute("data-status", "started");
  });

  it("clears it when the person returns to that step, and moves it further when they go further", async () => {
    const user = userEvent.setup();
    render(<Basic interactive="completed" defaultValue="payment" />);
    await user.click(screen.getByRole("button", { name: /^Account/ }));
    expect(item("Payment")).toHaveAttribute("data-status", "started");
    await user.click(screen.getByRole("button", { name: /^Payment/ }));
    expect(item("Payment")).toHaveAttribute("data-status", "current");
    expect(item("Shipping")).toHaveAttribute("data-status", "complete");
  });

  it("does not use it without interactive=completed", async () => {
    const user = userEvent.setup();
    render(<Basic interactive="all" defaultValue="payment" />);
    await user.click(screen.getByRole("button", { name: /^Account/ }));
    expect(item("Payment")).toHaveAttribute("data-status", "upcoming");
  });

  it("lets a caller set a step as started, in any interactive mode", () => {
    render(
      <Basic defaultValue="a" interactive="none">
        <Stepper.Step value="a" title="One" />
        <Stepper.Step value="b" title="Two" status="started" />
      </Basic>,
    );
    expect(item("Two")).toHaveAttribute("data-status", "started");
    expect(item("Two")).toHaveTextContent("started, not completed");
  });

  it("makes a step set as started one that interactive=completed can enter", async () => {
    const user = userEvent.setup();
    const onValueChange = vi.fn();
    render(
      <Basic defaultValue="a" interactive="completed" onValueChange={onValueChange}>
        <Stepper.Step value="a" title="One" />
        <Stepper.Step value="b" title="Two" />
        <Stepper.Step value="c" title="Three" status="started" />
      </Basic>,
    );
    expect(screen.queryByRole("button", { name: /^Two/ })).toBeNull();
    await user.click(screen.getByRole("button", { name: /^Three/ }));
    expect(onValueChange).toHaveBeenCalledWith("c");
  });

  it("lets a step's own status say it was completed", async () => {
    const user = userEvent.setup();
    render(
      <Basic interactive="completed" defaultValue="c">
        <Stepper.Step value="a" title="One" />
        <Stepper.Step value="b" title="Two" />
        <Stepper.Step value="c" title="Three" status="complete" />
      </Basic>,
    );
    await user.click(screen.getByRole("button", { name: /^One/ }));
    expect(item("Three")).toHaveAttribute("data-status", "complete");
  });

  it("translates the started words", () => {
    render(
      <Basic interactive="completed" value="a" labels={{ started: "commencée" }}>
        <Stepper.Step value="a" title="One" />
        <Stepper.Step value="b" title="Two" status="complete" />
      </Basic>,
    );
    expect(item("One")).toBeInTheDocument();
  });

  it("is colourful only when asked", () => {
    const { rerender } = render(<Basic data-testid="nav" />);
    expect(screen.getByTestId("nav").className).not.toMatch(/colorful/);
    rerender(<Basic colorful data-testid="nav" />);
    expect(screen.getByTestId("nav").className).toMatch(/colorful/);
  });
});

describe("Stepper — busy, warning and error steps", () => {
  it("shows a spinner and says the step is in progress", () => {
    const { container } = render(
      <Basic defaultValue="a">
        <Stepper.Step value="a" title="One" busy />
        <Stepper.Step value="b" title="Two" />
      </Basic>,
    );
    expect(item("One").querySelector("[aria-busy='true']")).not.toBeNull();
    expect(item("One")).toHaveTextContent("Step 1 of 2, current, in progress");
    expect(container.querySelectorAll("[aria-busy]")).toHaveLength(1);
  });

  it("names a warning and an error step, with different marks", () => {
    render(
      <Basic>
        <Stepper.Step value="a" title="One" status="warning" />
        <Stepper.Step value="b" title="Two" status="error" />
      </Basic>,
    );
    expect(item("One")).toHaveAttribute("data-status", "warning");
    expect(item("One")).toHaveTextContent("has a warning");
    expect(item("Two")).toHaveTextContent("has an error");
    expect(item("One").querySelector("svg")!.innerHTML).not.toBe(item("Two").querySelector("svg")!.innerHTML);
  });

  it("translates the new labels", () => {
    render(
      <Basic labels={{ busy: "en cours", warning: "à vérifier" }}>
        <Stepper.Step value="a" title="One" status="warning" busy />
      </Basic>,
    );
    expect(item("One")).toHaveTextContent("à vérifier, en cours");
  });
});

describe("Stepper — the line, the corners and the direction", () => {
  it("draws no line with connector=none, and one fewer line than steps otherwise", () => {
    const { container, rerender } = render(<Basic />);
    expect(container.querySelectorAll("[class*='_connector_']")).toHaveLength(3);
    rerender(<Basic connector="none" />);
    expect(container.querySelectorAll("[class*='_connector_']")).toHaveLength(0);
  });

  it("marks a dashed line on the nav", () => {
    render(<Basic connector="dashed" data-testid="nav" />);
    expect(screen.getByTestId("nav").className).toMatch(/connectorDashed/);
  });

  it("is rounded unless turned off", () => {
    const { rerender } = render(<Basic data-testid="nav" />);
    expect(screen.getByTestId("nav").className).toMatch(/rounded/);
    rerender(<Basic rounded={false} data-testid="nav" />);
    expect(screen.getByTestId("nav").className).not.toMatch(/rounded/);
  });

  it("resolves a responsive orientation from the width", () => {
    const original = window.matchMedia;
    window.matchMedia = ((query: string) =>
      ({ matches: query === "(min-width: 640px)", media: query, addEventListener: () => {}, removeEventListener: () => {}, addListener: () => {}, removeListener: () => {} }) as unknown as MediaQueryList) as typeof window.matchMedia;
    try {
      render(<Basic orientation={{ base: "vertical", sm: "horizontal" }} data-testid="nav" />);
      expect(screen.getByTestId("nav")).toHaveAttribute("data-orientation", "horizontal");
    } finally {
      window.matchMedia = original;
    }
  });

  it("starts from the base orientation", () => {
    render(<Basic orientation={{ base: "vertical", md: "horizontal" }} data-testid="nav" />);
    expect(screen.getByTestId("nav")).toHaveAttribute("data-orientation", "vertical");
  });
});
