import { act, render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { axe } from "jest-axe";
import { createRef, StrictMode, useState } from "react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { HouseIcon } from "@dbm-system/icons";
import { Avatar } from "../../atoms/Avatar";
import { Timeline } from "./Timeline";
import type { TimelineProps } from "./Timeline.types";

afterEach(() => {
  vi.restoreAllMocks();
  vi.useRealTimers();
});

const titles = ["Delivered", "Shipped", "Packed", "Paid", "Placed"];

function Basic({ children, ...props }: Partial<TimelineProps>) {
  return (
    <Timeline aria-label="Order history" {...props}>
      {children ??
        titles.map((title, index) => (
          <Timeline.Item key={title} title={title} time={`Day ${index + 1}`} description={index === 0 ? "Left at the door" : undefined} />
        ))}
    </Timeline>
  );
}

const item = (title: string) => screen.getByText(title).closest("li") as HTMLElement;

describe("Timeline — structure", () => {
  it("renders a named ordered list of list items", () => {
    render(<Basic />);
    const list = screen.getByRole("list", { name: "Order history" });
    expect(list.tagName).toBe("OL");
    expect(within(list).getAllByRole("listitem")).toHaveLength(5);
  });

  it("states the list roles outright (Safari drops them under list-style: none)", () => {
    const { container } = render(<Basic />);
    expect(container.querySelector("ol")).toHaveAttribute("role", "list");
    expect(container.querySelector("li")).toHaveAttribute("role", "listitem");
  });

  it("keeps the events in the order given", () => {
    render(<Basic />);
    const read = screen.getAllByRole("listitem").map((li) => li.textContent);
    expect(read[0]).toContain("Delivered");
    expect(read[4]).toContain("Placed");
  });

  it("makes the time a <time> element only when a machine-readable value is given", () => {
    render(
      <Basic>
        <Timeline.Item title="A" time="Today" dateTime="2026-03-14" />
        <Timeline.Item title="B" time="Later" />
      </Basic>,
    );
    expect(screen.getByText("Today").tagName).toBe("TIME");
    expect(screen.getByText("Today")).toHaveAttribute("datetime", "2026-03-14");
    expect(screen.getByText("Later").tagName).toBe("SPAN");
  });

  it("draws the description and the body under the title", () => {
    render(
      <Basic>
        <Timeline.Item title="A" description="Described">
          <a href="#x">A link</a>
        </Timeline.Item>
      </Basic>,
    );
    expect(item("A")).toHaveTextContent("Described");
    expect(within(item("A")).getByRole("link", { name: "A link" })).toBeInTheDocument();
  });

  it("hides the marker and the line from assistive technology", () => {
    const { container } = render(<Basic />);
    expect(container.querySelector("li > span")).toHaveAttribute("aria-hidden", "true");
  });

  it("draws an icon, or the node given, in the marker", () => {
    const { container } = render(
      <Basic>
        <Timeline.Item title="A" icon={HouseIcon} />
        <Timeline.Item title="B" marker={<Avatar name="Ada Lovelace" size="xs" />} />
        <Timeline.Item title="C" />
      </Basic>,
    );
    expect(item("A").querySelector("svg")).not.toBeNull();
    expect(item("B").querySelector("[aria-hidden='true']")).toHaveTextContent("AL");
    expect(item("C").querySelector("svg")).toBeNull();
    expect(container.querySelectorAll("li")).toHaveLength(3);
  });

  it("leaves the line out of a timeline that draws none", () => {
    const { container } = render(<Basic connector="none" />);
    expect(container.querySelectorAll("li > span > span:nth-child(2)")).toHaveLength(0);
  });

  it("forwards its ref to the <ol>, and className, style, id and data-testid land on it", () => {
    const ref = createRef<HTMLOListElement>();
    render(
      <Timeline ref={ref} className="extra" style={{ marginBlock: 3 }} id="t" data-testid="tl">
        <Timeline.Item title="A" />
      </Timeline>,
    );
    expect(ref.current?.tagName).toBe("OL");
    expect(screen.getByTestId("tl")).toBe(ref.current);
    expect(ref.current).toHaveClass("extra");
    expect(ref.current).toHaveAttribute("id", "t");
    expect(ref.current).toHaveStyle({ marginBlock: "3px" });
  });

  it("forwards an item's ref and props to its <li>", () => {
    const ref = createRef<HTMLLIElement>();
    render(
      <Basic>
        <Timeline.Item ref={ref} title="A" id="a" className="x" data-testid="ia" />
      </Basic>,
    );
    expect(ref.current?.tagName).toBe("LI");
    expect(ref.current).toHaveAttribute("id", "a");
    expect(ref.current).toHaveClass("x");
    expect(screen.getByTestId("ia")).toBe(ref.current);
  });

  it("lets the component's own role win over a same-named prop", () => {
    render(
      <Basic>
        <Timeline.Item title="A" role="presentation" />
      </Basic>,
    );
    expect(item("A")).toHaveAttribute("role", "listitem");
  });

  it("warns about, and ignores, anything but an item", () => {
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
    render(
      <Basic>
        <Timeline.Item title="A" />
        <p>stray</p>
      </Basic>,
    );
    expect(screen.queryByText("stray")).toBeNull();
    expect(warn).toHaveBeenCalledWith(expect.stringContaining("only `Timeline.Item`"));
  });

  it("warns about an item that says nothing", () => {
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
    render(
      <Basic>
        <Timeline.Item />
      </Basic>,
    );
    expect(warn).toHaveBeenCalledWith(expect.stringContaining("says nothing"));
  });

  it("throws a clear error when an item is drawn outside a timeline", () => {
    vi.spyOn(console, "error").mockImplementation(() => {});
    expect(() => render(<Timeline.Item title="A" />)).toThrow(/inside a Timeline/);
  });
});

describe("Timeline — what a screen reader hears", () => {
  it("reads the status text after the title", () => {
    render(
      <Basic>
        <Timeline.Item title="Payment" tone="danger" statusText="Failed" />
      </Basic>,
    );
    expect(item("Payment")).toHaveTextContent("Payment, Failed");
  });

  it("says a pending event is in progress, unless it says otherwise", () => {
    render(
      <Basic>
        <Timeline.Item title="Out" pending />
        <Timeline.Item title="Back" pending statusText="Waiting" />
      </Basic>,
    );
    expect(item("Out")).toHaveTextContent("Out, In progress");
    expect(item("Back")).toHaveTextContent("Back, Waiting");
    expect(item("Out")).toHaveAttribute("data-pending", "true");
  });

  it("translates the pending words through labels", () => {
    render(
      <Basic labels={{ pending: "En cours" }}>
        <Timeline.Item title="Out" pending />
      </Basic>,
    );
    expect(item("Out")).toHaveTextContent("Out, En cours");
  });

  it("keeps the default when a label is passed as undefined", () => {
    render(
      <Basic labels={{ pending: undefined }}>
        <Timeline.Item title="Out" pending />
      </Basic>,
    );
    expect(item("Out")).toHaveTextContent("In progress");
  });

  it("has no accessibility violations", async () => {
    const { container } = render(
      <Basic>
        <Timeline.Item title="Delivered" time="Today" dateTime="2026-03-14" tone="success" statusText="Done" icon={HouseIcon} />
        <Timeline.Item title="Out" pending>
          <a href="#x">Track</a>
        </Timeline.Item>
        <Timeline.Item title="Placed" description="Paid by card" />
      </Basic>,
    );
    expect(await axe(container)).toHaveNoViolations();
  });

  it("has no accessibility violations with the cap and the button showing", async () => {
    const { container } = render(<Basic maxVisible={2} />);
    expect(await axe(container)).toHaveNoViolations();
  });
});

describe("Timeline — long histories", () => {
  it("draws every event when there is no cap", () => {
    render(<Basic />);
    expect(screen.queryByRole("button")).toBeNull();
    expect(screen.getAllByRole("listitem")).toHaveLength(5);
  });

  it("draws only the first events and a button for the rest", () => {
    render(<Basic maxVisible={2} />);
    expect(screen.getAllByRole("listitem")).toHaveLength(3);
    expect(screen.queryByText("Packed")).toBeNull();
    expect(screen.getByRole("button", { name: "Show 3 more events" })).toBeInTheDocument();
  });

  it("says one event in the singular", () => {
    render(<Basic maxVisible={4} />);
    expect(screen.getByRole("button", { name: "Show 1 more event" })).toBeInTheDocument();
  });

  it("shows the rest, and hides them again, holding the same button", async () => {
    const user = userEvent.setup();
    render(<Basic maxVisible={2} />);
    const button = screen.getByRole("button", { name: "Show 3 more events" });
    await user.click(button);
    expect(screen.getByText("Placed")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Show fewer events" })).toBe(button);
    expect(button).toHaveFocus();
    await user.click(button);
    expect(screen.queryByText("Placed")).toBeNull();
    expect(button).toHaveFocus();
  });

  it("draws no button when everything fits", () => {
    render(<Basic maxVisible={5} />);
    expect(screen.queryByRole("button")).toBeNull();
    render(<Basic maxVisible={20} />);
    expect(screen.queryByRole("button")).toBeNull();
  });

  it("treats a cap that is not a finite number as no cap", () => {
    render(<Basic maxVisible={Number.NaN} />);
    expect(screen.getAllByRole("listitem")).toHaveLength(5);
  });

  it("starts expanded with defaultExpanded", () => {
    render(<Basic maxVisible={2} defaultExpanded />);
    expect(screen.getByText("Placed")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Show fewer events" })).toBeInTheDocument();
  });

  it("asks through onExpandedChange and leaves a controlled value alone", async () => {
    const user = userEvent.setup();
    const onExpandedChange = vi.fn();
    render(<Basic maxVisible={2} expanded={false} onExpandedChange={onExpandedChange} />);
    await user.click(screen.getByRole("button"));
    expect(onExpandedChange).toHaveBeenCalledWith(true);
    expect(screen.queryByText("Placed")).toBeNull();
  });

  it("works wired to state, with neither half undoing the other", async () => {
    const user = userEvent.setup();
    function Wired() {
      const [expanded, setExpanded] = useState(false);
      return <Basic maxVisible={2} expanded={expanded} onExpandedChange={setExpanded} />;
    }
    render(<Wired />);
    await user.click(screen.getByRole("button"));
    expect(screen.getByText("Placed")).toBeInTheDocument();
    await user.click(screen.getByRole("button"));
    expect(screen.queryByText("Placed")).toBeNull();
  });

  it("warns when it changes between controlled and uncontrolled", () => {
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
    const { rerender } = render(<Basic maxVisible={2} />);
    rerender(<Basic maxVisible={2} expanded />);
    expect(warn).toHaveBeenCalledWith(expect.stringContaining("changed from uncontrolled to controlled"));
  });

  it("writes the label with formatNumber and from labels", () => {
    render(<Basic maxVisible={2} formatNumber={(n) => `#${n}`} />);
    expect(screen.getByRole("button", { name: "Show #3 more events" })).toBeInTheDocument();
    render(<Basic maxVisible={2} labels={{ showMore: (n) => `Voir ${n} de plus` }} />);
    expect(screen.getByRole("button", { name: "Voir 3 de plus" })).toBeInTheDocument();
  });

  it("announces the events being shown, never the first appearance", async () => {
    vi.useFakeTimers();
    const { rerender } = render(<Basic maxVisible={2} defaultExpanded />);
    await act(async () => {
      await vi.advanceTimersByTimeAsync(300);
    });
    expect(screen.getByRole("status")).toHaveTextContent("");
    rerender(<Basic maxVisible={2} expanded={false} />);
    // Switching a mounted timeline between uncontrolled and controlled warns; the point here is the announcement.
    vi.spyOn(console, "warn").mockImplementation(() => {});
    rerender(<Basic maxVisible={2} expanded />);
    await act(async () => {
      await vi.advanceTimersByTimeAsync(300);
    });
    expect(screen.getByRole("status")).toHaveTextContent("3 more events shown");
  });

  it("survives StrictMode", async () => {
    const user = userEvent.setup();
    render(
      <StrictMode>
        <Basic maxVisible={2} />
      </StrictMode>,
    );
    await user.click(screen.getByRole("button"));
    expect(screen.getByText("Placed")).toBeInTheDocument();
  });
});

describe("Timeline — looks", () => {
  it("sets the time placement on the list", () => {
    const { container } = render(<Basic timePlacement="side" />);
    expect(container.querySelector("ol")).toHaveAttribute("data-time-placement", "side");
  });

  it("resolves a breakpoint map for the time placement", () => {
    const { container } = render(<Basic timePlacement={{ base: "top", md: "side" }} />);
    expect(container.querySelector("ol")).toHaveAttribute("data-time-placement", "top");
  });

  it("nests inside itself without leaking settings", () => {
    render(
      <Basic tone="danger">
        <Timeline.Item title="Outer">
          <Timeline aria-label="Inner" tone="success">
            <Timeline.Item title="Inside" />
          </Timeline>
        </Timeline.Item>
      </Basic>,
    );
    expect(screen.getAllByRole("list")).toHaveLength(2);
    expect(item("Inside")).toBeInTheDocument();
  });
});
