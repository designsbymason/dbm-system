import { act, render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { axe } from "jest-axe";
import { createRef, StrictMode, useState } from "react";
import type { ReactNode } from "react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { HouseIcon } from "@dbm-system/icons";
import { Stepper } from "./Stepper";
import type { StepperController, StepperProps } from "./Stepper.types";

const steps: Array<[string, string]> = [
  ["account", "Account"],
  ["shipping", "Shipping"],
  ["payment", "Payment"],
  ["review", "Review"],
];

function Basic({ children, ...props }: Partial<StepperProps> & { children?: ReactNode }) {
  return (
    <Stepper defaultValue="shipping" {...props}>
      {children ??
        steps.map(([value, title]) => <Stepper.Step key={value} value={value} title={title} />)}
    </Stepper>
  );
}

afterEach(() => {
  vi.restoreAllMocks();
  vi.useRealTimers();
});

const item = (title: string) => screen.getByText(title).closest("li") as HTMLElement;

describe("Stepper — structure", () => {
  it("renders a named nav around an ordered list", () => {
    render(<Basic />);
    const nav = screen.getByRole("navigation", { name: "Progress" });
    expect(within(nav).getByRole("list").tagName).toBe("OL");
    expect(within(nav).getAllByRole("listitem")).toHaveLength(4);
  });

  it("derives each step's status from the current step", () => {
    render(<Basic />);
    expect(item("Account")).toHaveAttribute("data-status", "complete");
    expect(item("Shipping")).toHaveAttribute("data-status", "current");
    expect(item("Payment")).toHaveAttribute("data-status", "upcoming");
  });

  it("marks only the current step with aria-current", () => {
    const { container } = render(<Basic />);
    const current = container.querySelectorAll("[aria-current]");
    expect(current).toHaveLength(1);
    expect(current[0]).toHaveAttribute("aria-current", "step");
    expect(current[0]).toHaveTextContent("Shipping");
  });

  it("starts at the first step when no value is given", () => {
    render(
      <Stepper>
        <Stepper.Step value="a" title="One" />
        <Stepper.Step value="b" title="Two" />
      </Stepper>,
    );
    expect(item("One")).toHaveAttribute("data-status", "current");
  });

  it("shows a number, or the icon given, for a step not yet done", () => {
    render(
      <Basic>
        <Stepper.Step value="a" title="One" icon={HouseIcon} />
        <Stepper.Step value="b" title="Two" />
      </Basic>,
    );
    expect(item("Two")).toHaveTextContent("2");
    expect(item("One").querySelector("svg")).not.toBeNull();
  });

  it("formats the numbers it shows", () => {
    render(<Basic formatNumber={(n) => `#${n}`} defaultValue="account" />);
    expect(item("Shipping")).toHaveTextContent("#2");
  });

  it("lets a step set its own status", () => {
    render(
      <Basic>
        <Stepper.Step value="a" title="One" />
        <Stepper.Step value="b" title="Two" status="error" />
        <Stepper.Step value="c" title="Three" status="skipped" />
      </Basic>,
    );
    expect(item("Two")).toHaveAttribute("data-status", "error");
    expect(item("Three")).toHaveAttribute("data-status", "skipped");
  });

  it("says each step's place and status to a screen reader, after its visible title", () => {
    render(<Basic />);
    const text = item("Shipping").textContent ?? "";
    expect(text.indexOf("Shipping")).toBeLessThan(text.indexOf("Step 2 of 4, current"));
    expect(item("Account")).toHaveTextContent("Step 1 of 4, completed");
    expect(item("Payment")).toHaveTextContent("Step 3 of 4, not started");
  });

  it("shows a description and an optional mark", () => {
    render(
      <Basic>
        <Stepper.Step value="a" title="One" description="Your details" optional />
      </Basic>,
    );
    expect(screen.getByText("Your details")).toBeInTheDocument();
    expect(screen.getByText("Optional")).toBeInTheDocument();
  });

  it("ignores children that are not steps, with a warning", () => {
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
    render(
      <Stepper>
        <Stepper.Step value="a" title="One" />
        plain text
      </Stepper>,
    );
    expect(screen.getAllByRole("listitem")).toHaveLength(1);
    expect(warn).toHaveBeenCalledWith(expect.stringContaining("only `Stepper.Step` elements"));
  });

  it("warns about a duplicate value and about a value that matches no step", () => {
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
    render(
      <Stepper value="nowhere">
        <Stepper.Step value="dup" title="One" />
        <Stepper.Step value="dup" title="Two" />
      </Stepper>,
    );
    expect(warn).toHaveBeenCalledWith(expect.stringContaining('share the value "dup"'));
    expect(warn).toHaveBeenCalledWith(expect.stringContaining('"nowhere" matches no step'));
  });
});

describe("Stepper — props and refs", () => {
  it("forwards the ref to the nav and a step's ref to its li", () => {
    const navRef = createRef<HTMLElement>();
    const liRef = createRef<HTMLLIElement>();
    render(
      <Stepper ref={navRef}>
        <Stepper.Step ref={liRef} value="a" title="One" />
      </Stepper>,
    );
    expect(navRef.current?.tagName).toBe("NAV");
    expect(liRef.current?.tagName).toBe("LI");
  });

  it("puts className, style, id and data-testid on the nav and on each li", () => {
    render(
      <Stepper className="x" style={{ margin: 3 }} id="s" data-testid="root">
        <Stepper.Step value="a" title="One" className="y" id="step" data-testid="one" />
      </Stepper>,
    );
    const nav = screen.getByTestId("root");
    expect(nav).toHaveClass("x");
    expect(nav).toHaveAttribute("id", "s");
    expect(nav.style.margin).toBe("3px");
    expect(screen.getByTestId("one")).toHaveClass("y");
    expect(screen.getByTestId("one")).toHaveAttribute("id", "step");
  });

  it("names the nav with aria-label, aria-labelledby or labels", () => {
    const { rerender } = render(<Basic labels={{ navigation: "Checkout" }} />);
    expect(screen.getByRole("navigation", { name: "Checkout" })).toBeInTheDocument();
    rerender(<Basic aria-label="Order" />);
    expect(screen.getByRole("navigation", { name: "Order" })).toBeInTheDocument();
    rerender(
      <>
        <h2 id="h">Sign up</h2>
        <Basic aria-labelledby="h" />
      </>,
    );
    expect(screen.getByRole("navigation", { name: "Sign up" })).toBeInTheDocument();
  });

  it("keeps a default label when an override is undefined", () => {
    render(<Basic labels={{ complete: undefined }} />);
    expect(item("Account")).toHaveTextContent("completed");
  });

  it("applies a translated label function", () => {
    render(<Basic labels={{ stepOf: (n, total) => `Étape ${n} sur ${total}` }} />);
    expect(item("Shipping")).toHaveTextContent("Étape 2 sur 4");
  });

  it("sets the direction", () => {
    render(<Basic dir="rtl" data-testid="nav" />);
    expect(screen.getByTestId("nav")).toHaveAttribute("dir", "rtl");
  });

  it("keeps its computed role and status over ones passed by the caller", () => {
    render(
      <Basic defaultValue="a" role="banner" data-testid="nav">
        <Stepper.Step value="a" title="One" role="presentation" data-status="upcoming" />
      </Basic>,
    );
    expect(screen.getByTestId("nav").tagName).toBe("NAV");
    expect(item("One")).toHaveAttribute("role", "listitem");
    expect(item("One")).toHaveAttribute("data-status", "current");
  });

  it("keeps its list roles over ones passed by the caller", () => {
    render(<Basic />);
    expect(screen.getAllByRole("listitem")).toHaveLength(4);
  });

  it("throws a clear error for a step outside a stepper", () => {
    vi.spyOn(console, "error").mockImplementation(() => {});
    expect(() => render(<Stepper.Step value="a" title="One" />)).toThrow("inside a Stepper");
  });
});

describe("Stepper — interaction", () => {
  it("has no focus stop and no buttons by default", () => {
    render(<Basic />);
    expect(screen.queryAllByRole("button")).toHaveLength(0);
  });

  it("makes finished steps buttons with interactive=completed", () => {
    render(<Basic interactive="completed" />);
    expect(screen.getAllByRole("button")).toHaveLength(1);
    expect(screen.getByRole("button", { name: /^Account/ })).toBeInTheDocument();
  });

  it("makes every step but the current one a button with interactive=all", () => {
    render(<Basic interactive="all" />);
    expect(screen.getAllByRole("button")).toHaveLength(3);
  });

  it("names a button by its title first, then its place and status", () => {
    render(<Basic interactive="completed" />);
    expect(screen.getByRole("button", { name: "Account (Step 1 of 4, completed)" })).toBeInTheDocument();
  });

  it("moves to a step that is chosen, and reports it (uncontrolled)", async () => {
    const onValueChange = vi.fn();
    const user = userEvent.setup();
    render(<Basic interactive="all" onValueChange={onValueChange} />);
    await user.click(screen.getByRole("button", { name: /^Payment/ }));
    expect(onValueChange).toHaveBeenCalledWith("payment");
    expect(item("Payment")).toHaveAttribute("data-status", "current");
  });

  it("only asks when controlled, until the value changes", async () => {
    const onValueChange = vi.fn();
    const user = userEvent.setup();
    const { rerender } = render(<Basic value="shipping" interactive="all" onValueChange={onValueChange} />);
    await user.click(screen.getByRole("button", { name: /^Payment/ }));
    expect(onValueChange).toHaveBeenCalledWith("payment");
    expect(item("Shipping")).toHaveAttribute("data-status", "current");
    rerender(<Basic value="payment" interactive="all" onValueChange={onValueChange} />);
    expect(item("Payment")).toHaveAttribute("data-status", "current");
  });

  it("works wired to state, without a loop", async () => {
    function Wired() {
      const [value, setValue] = useState("shipping");
      return (
        <Basic value={value} onValueChange={setValue} interactive="all" />
      );
    }
    const user = userEvent.setup();
    render(<Wired />);
    await user.click(screen.getByRole("button", { name: /^Review/ }));
    expect(item("Review")).toHaveAttribute("data-status", "current");
  });

  it("activates a step from the keyboard", async () => {
    const onValueChange = vi.fn();
    const user = userEvent.setup();
    render(<Basic interactive="completed" onValueChange={onValueChange} />);
    await user.tab();
    expect(screen.getByRole("button", { name: /^Account/ })).toHaveFocus();
    await user.keyboard("{Enter}");
    expect(onValueChange).toHaveBeenCalledWith("account");
  });

  it("tabs through the steps that can be entered, in order, then out", async () => {
    const user = userEvent.setup();
    render(
      <>
        <button>before</button>
        <Basic interactive="all" />
        <button>after</button>
      </>,
    );
    await user.tab();
    await user.tab();
    expect(screen.getByRole("button", { name: /^Account/ })).toHaveFocus();
    await user.tab();
    expect(screen.getByRole("button", { name: /^Payment/ })).toHaveFocus();
    await user.tab();
    expect(screen.getByRole("button", { name: /^Review/ })).toHaveFocus();
    await user.tab();
    expect(screen.getByRole("button", { name: "after" })).toHaveFocus();
  });

  it("lets a step's onClick stop the change by preventing default", async () => {
    const onValueChange = vi.fn();
    const user = userEvent.setup();
    render(
      <Basic interactive="all" onValueChange={onValueChange}>
        <Stepper.Step value="a" title="One" />
        <Stepper.Step value="b" title="Two" onClick={(event) => event.preventDefault()} />
      </Basic>,
    );
    await user.click(screen.getByRole("button", { name: /^Two/ }));
    expect(onValueChange).not.toHaveBeenCalled();
  });

  it("never enters a disabled step", async () => {
    const onValueChange = vi.fn();
    render(
      <Basic interactive="all" defaultValue="a" onValueChange={onValueChange}>
        <Stepper.Step value="a" title="One" />
        <Stepper.Step value="b" title="Two" disabled />
      </Basic>,
    );
    // A native disabled button: announced as unavailable, and never a tab stop.
    const two = screen.getByRole("button", { name: /^Two/ });
    expect(two).toBeDisabled();
    expect(screen.getAllByRole("button")).toHaveLength(1);
  });

  it("keeps a disabled step out of the tab order and does not act on a click", async () => {
    const onValueChange = vi.fn();
    const user = userEvent.setup();
    render(
      <>
        <button>before</button>
        <Basic interactive="all" defaultValue="a" onValueChange={onValueChange}>
          <Stepper.Step value="a" title="One" />
          <Stepper.Step value="b" title="Two" disabled />
          <Stepper.Step value="c" title="Three" />
        </Basic>
      </>,
    );
    await user.tab();
    await user.tab();
    expect(screen.getByRole("button", { name: /^Three/ })).toHaveFocus();
    await user.click(screen.getByRole("button", { name: /^Two/ }));
    expect(onValueChange).not.toHaveBeenCalled();
  });

  it("puts aria-current on the current step's list item, where a list reader finds it", () => {
    render(<Basic />);
    expect(item("Shipping")).toHaveAttribute("aria-current", "step");
    expect(item("Account")).not.toHaveAttribute("aria-current");
  });

  it("draws a summary of the current step for the compact form", () => {
    const { container } = render(<Basic compact="always" />);
    const summary = container.querySelector("div[class*='summary']");
    expect(summary).toHaveTextContent("Step 2 of 4 — Shipping");
  });

  it("renders a router's link for the step with asChild", async () => {
    const user = userEvent.setup();
    const onValueChange = vi.fn();
    render(
      <Basic interactive="all" onValueChange={onValueChange} defaultValue="b">
        <Stepper.Step value="a" title="x" asChild>
          <a href="/first">First</a>
        </Stepper.Step>
        <Stepper.Step value="b" title="Two" />
      </Basic>,
    );
    const link = screen.getByRole("link", { name: /^First/ });
    expect(link).toHaveAttribute("href", "/first");
    link.addEventListener("click", (event) => event.preventDefault());
    await user.click(link);
    expect(onValueChange).toHaveBeenCalledWith("a");
  });
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

describe("Stepper — announcements", () => {
  it("has a status region that is empty on first render", () => {
    render(<Basic />);
    expect(screen.getByRole("status")).toHaveTextContent("");
  });

  it("announces a change of step, never the first appearance", () => {
    vi.useFakeTimers();
    const { rerender } = render(<Basic value="shipping" />);
    act(() => vi.advanceTimersByTime(500));
    expect(screen.getByRole("status")).toHaveTextContent("");
    rerender(<Basic value="payment" />);
    act(() => vi.advanceTimersByTime(200));
    expect(screen.getByRole("status")).toHaveTextContent("Step 3 of 4: Payment");
  });

  it("announces nothing when turned off", () => {
    vi.useFakeTimers();
    const { rerender } = render(<Basic value="shipping" announce={false} />);
    rerender(<Basic value="payment" announce={false} />);
    act(() => vi.advanceTimersByTime(500));
    expect(screen.queryByRole("status")).toBeNull();
  });

  it("does not announce on a StrictMode remount", () => {
    vi.useFakeTimers();
    render(
      <StrictMode>
        <Basic value="shipping" />
      </StrictMode>,
    );
    act(() => vi.advanceTimersByTime(500));
    expect(screen.getByRole("status")).toHaveTextContent("");
  });
});

describe("Stepper — accessibility", () => {
  it("has no axe violations by default", async () => {
    const { container } = render(<Basic />);
    expect(await axe(container)).toHaveNoViolations();
  });

  it("has none when interactive, vertical, compact and with errors", async () => {
    const { container } = render(
      <Basic interactive="all" orientation="vertical" compact="auto" variant="outlined" tone="success">
        <Stepper.Step value="a" title="One" description="Details" />
        <Stepper.Step value="b" title="Two" status="error" />
        <Stepper.Step value="c" title="Three" optional disabled />
      </Basic>,
    );
    expect(await axe(container)).toHaveNoViolations();
  });
});

describe("Stepper — in a StrictMode tree", () => {
  it("renders the same", () => {
    render(
      <StrictMode>
        <Basic />
      </StrictMode>,
    );
    expect(screen.getAllByRole("listitem")).toHaveLength(4);
  });
});

describe("Stepper — which steps can be entered", () => {
  it("lets interactive=completed enter any step before the current one, whatever it shows", () => {
    render(
      <Basic interactive="completed" defaultValue="d">
        <Stepper.Step value="a" title="One" status="error" />
        <Stepper.Step value="b" title="Two" status="skipped" />
        <Stepper.Step value="c" title="Three" status="warning" />
        <Stepper.Step value="d" title="Four" />
        <Stepper.Step value="e" title="Five" />
      </Basic>,
    );
    expect(screen.getAllByRole("button").map((button) => button.textContent?.slice(0, 5))).toHaveLength(3);
    expect(screen.queryByRole("button", { name: /^Five/ })).toBeNull();
  });

  it("also lets interactive=completed enter a step marked complete after the current one", () => {
    render(
      <Basic interactive="completed" defaultValue="a">
        <Stepper.Step value="a" title="One" />
        <Stepper.Step value="b" title="Two" />
        <Stepper.Step value="c" title="Three" status="complete" />
      </Basic>,
    );
    expect(screen.getAllByRole("button")).toHaveLength(1);
    expect(screen.getByRole("button", { name: /^Three/ })).toBeInTheDocument();
  });
});

describe("Stepper — returning to a step that was reached", () => {
  it("lets interactive=completed go forward again to a step it had reached, and no further", async () => {
    const user = userEvent.setup();
    render(<Basic interactive="completed" defaultValue="payment" />);
    await user.click(screen.getByRole("button", { name: /^Account/ }));
    expect(item("Account")).toHaveAttribute("data-status", "current");
    // Shipping and Payment were reached; Review was not.
    expect(screen.getByRole("button", { name: /^Shipping/ })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /^Payment/ })).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /^Review/ })).toBeNull();
    await user.click(screen.getByRole("button", { name: /^Payment/ }));
    expect(item("Payment")).toHaveAttribute("data-status", "current");
  });

  it("follows a controlled value going back, too", () => {
    const { rerender } = render(<Basic interactive="completed" value="payment" />);
    rerender(<Basic interactive="completed" value="account" />);
    expect(screen.getAllByRole("button")).toHaveLength(2);
    expect(screen.queryByRole("button", { name: /^Review/ })).toBeNull();
  });

  it("keeps the compact Next button enabled after going back", async () => {
    const user = userEvent.setup();
    render(<Basic compact="always" interactive="completed" defaultValue="payment" />);
    expect(screen.getByRole("button", { name: "Next step" })).toBeDisabled();
    await user.click(screen.getByRole("button", { name: "Previous step" }));
    expect(screen.getByRole("button", { name: "Next step" })).toBeEnabled();
    await user.click(screen.getByRole("button", { name: "Next step" }));
    expect(item("Payment")).toHaveAttribute("data-status", "current");
    expect(screen.getByRole("button", { name: "Next step" })).toBeDisabled();
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

describe("Stepper — the controller", () => {
  function WithController(props: Partial<StepperProps> & { onController?: (controller: StepperController) => void }) {
    const { onController, ...rest } = props;
    return (
      <Basic
        controllerRef={(controller) => {
          if (controller) onController?.(controller);
        }}
        {...rest}
      />
    );
  }

  it("moves to the next and previous step, and says whether it could", () => {
    let controller!: StepperController;
    render(<WithController onController={(c) => (controller = c)} />);
    expect(controller.value).toBe("shipping");
    act(() => expect(controller.next()).toBe(true));
    expect(item("Payment")).toHaveAttribute("data-status", "current");
    expect(controller.value).toBe("payment");
    act(() => expect(controller.back()).toBe(true));
    act(() => expect(controller.back()).toBe(true));
    expect(item("Account")).toHaveAttribute("data-status", "current");
    act(() => expect(controller.back()).toBe(false));
    act(() => expect(controller.goTo("review")).toBe(true));
    act(() => expect(controller.next()).toBe(false));
    act(() => expect(controller.goTo("review")).toBe(false));
    act(() => expect(controller.goTo("nowhere")).toBe(false));
  });

  it("skips a disabled step, and will not go to one", () => {
    let controller!: StepperController;
    render(
      <WithController onController={(c) => (controller = c)} defaultValue="a">
        <Stepper.Step value="a" title="One" />
        <Stepper.Step value="b" title="Two" disabled />
        <Stepper.Step value="c" title="Three" />
      </WithController>,
    );
    act(() => expect(controller.goTo("b")).toBe(false));
    act(() => expect(controller.next()).toBe(true));
    expect(item("Three")).toHaveAttribute("data-status", "current");
    act(() => expect(controller.back()).toBe(true));
    expect(item("One")).toHaveAttribute("data-status", "current");
  });

  it("only asks when the stepper is controlled", () => {
    let controller!: StepperController;
    const onValueChange = vi.fn();
    render(<WithController onController={(c) => (controller = c)} value="shipping" onValueChange={onValueChange} />);
    act(() => expect(controller.next()).toBe(true));
    expect(onValueChange).toHaveBeenCalledWith("payment");
    expect(item("Shipping")).toHaveAttribute("data-status", "current");
  });

  it("is one object for the stepper's life and reads the latest state", () => {
    const seen = new Set<StepperController>();
    const { rerender } = render(<WithController onController={(c) => seen.add(c)} value="account" />);
    rerender(<WithController onController={(c) => seen.add(c)} value="payment" />);
    expect([...seen]).toHaveLength(1);
    expect([...seen][0]!.value).toBe("payment");
  });
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
