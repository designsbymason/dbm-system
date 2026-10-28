import { act, render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { axe } from "jest-axe";
import { createRef, StrictMode, useState } from "react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { HouseIcon, TruckIcon } from "@dbm-system/icons";
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

  it("takes the line's tone colour only when colorfulConnector is set", () => {
    const { container, rerender } = render(<Basic />);
    expect(container.querySelector("ol")?.className).not.toContain("colorfulConnector");
    rerender(<Basic colorfulConnector />);
    expect(container.querySelector("ol")?.className).toContain("colorfulConnector");
  });

  it("reads the time placement of its orientation: top and side when vertical, same and opposite when horizontal", () => {
    const { container, rerender } = render(<Basic timePlacement="opposite" />);
    expect(container.querySelector("ol")).toHaveAttribute("data-time-placement", "top");
    rerender(<Basic orientation="horizontal" timePlacement="opposite" />);
    expect(container.querySelector("ol")).toHaveAttribute("data-time-placement", "opposite");
    rerender(<Basic orientation="horizontal" timePlacement="side" />);
    expect(container.querySelector("ol")).toHaveAttribute("data-time-placement", "same");
    rerender(<Basic orientation="horizontal" />);
    expect(container.querySelector("ol")).toHaveAttribute("data-time-placement", "same");
    rerender(<Basic timePlacement="side" />);
    expect(container.querySelector("ol")).toHaveAttribute("data-time-placement", "side");
  });

  it("alternates the sides of a horizontal timeline too", () => {
    render(
      <Basic orientation="horizontal" align="alternate">
        <Timeline.Item title="A" />
        <Timeline.Item title="B" />
      </Basic>,
    );
    expect(screen.getByText("A").closest("li")).toHaveAttribute("data-side", "end");
    expect(screen.getByText("B").closest("li")).toHaveAttribute("data-side", "start");
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

describe("Timeline — groups and the end", () => {
  it("draws a heading before a run of events, announced at the level given", () => {
    render(
      <Basic>
        <Timeline.Group>Today</Timeline.Group>
        <Timeline.Item title="A" />
        <Timeline.Group level={4}>Yesterday</Timeline.Group>
        <Timeline.Item title="B" />
      </Basic>,
    );
    expect(screen.getByRole("heading", { name: "Today", level: 3 })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Yesterday", level: 4 })).toBeInTheDocument();
  });

  it("draws a heading only while an event after it is", () => {
    render(
      <Basic maxVisible={1}>
        <Timeline.Group>Today</Timeline.Group>
        <Timeline.Item title="A" />
        <Timeline.Group>Yesterday</Timeline.Group>
        <Timeline.Item title="B" />
      </Basic>,
    );
    expect(screen.getByRole("heading", { name: "Today" })).toBeInTheDocument();
    expect(screen.queryByRole("heading", { name: "Yesterday" })).toBeNull();
  });

  it("draws a heading over the events it leads when a later one is the first shown", () => {
    render(
      <Basic maxVisible={1}>
        <Timeline.Group>Empty run</Timeline.Group>
        <Timeline.Group>Today</Timeline.Group>
        <Timeline.Item title="A" />
      </Basic>,
    );
    expect(screen.queryByRole("heading", { name: "Empty run" })).toBeNull();
    expect(screen.getByRole("heading", { name: "Today" })).toBeInTheDocument();
  });

  it("draws the end after the last event, and only once every event is shown", async () => {
    const user = userEvent.setup();
    render(
      <Basic maxVisible={1}>
        <Timeline.Item title="A" />
        <Timeline.Item title="B" />
        <Timeline.End>Order closed</Timeline.End>
      </Basic>,
    );
    expect(screen.queryByText("Order closed")).toBeNull();
    await user.click(screen.getByRole("button", { name: "Show 1 more event" }));
    expect(screen.getByText("Order closed")).toBeInTheDocument();
  });

  it("draws an end with an icon, or with no words", () => {
    const { container } = render(
      <Basic>
        <Timeline.Item title="A" />
        <Timeline.End icon={HouseIcon}>Home</Timeline.End>
        <Timeline.End />
      </Basic>,
    );
    expect(screen.getByText("Home").closest("li")?.querySelector("svg")).not.toBeNull();
    expect(container.querySelectorAll("li")).toHaveLength(3);
  });

  it("gives the end and the group the same list roles, refs and props", () => {
    const groupRef = createRef<HTMLLIElement>();
    const endRef = createRef<HTMLLIElement>();
    render(
      <Basic>
        <Timeline.Group ref={groupRef} id="g" data-testid="grp">
          Today
        </Timeline.Group>
        <Timeline.Item title="A" />
        <Timeline.End ref={endRef} id="e" data-testid="end" />
      </Basic>,
    );
    expect(groupRef.current).toBe(screen.getByTestId("grp"));
    expect(endRef.current).toBe(screen.getByTestId("end"));
    expect(groupRef.current).toHaveAttribute("role", "listitem");
    expect(endRef.current).toHaveAttribute("id", "e");
  });
});

describe("Timeline — an event that is a link, a button or has a detail", () => {
  it("makes the title a link stretched over the event when href is set", () => {
    render(
      <Basic>
        <Timeline.Item title="Order shipped" href="/orders/1" statusText="Done" />
      </Basic>,
    );
    expect(screen.getByRole("link", { name: "Order shipped, Done" })).toHaveAttribute("href", "/orders/1");
  });

  it("makes the title a button when onPress is set, and calls it", async () => {
    const user = userEvent.setup();
    const onPress = vi.fn();
    render(
      <Basic>
        <Timeline.Item title="Order shipped" onPress={onPress} />
      </Basic>,
    );
    await user.click(screen.getByRole("button", { name: "Order shipped" }));
    expect(onPress).toHaveBeenCalledTimes(1);
  });

  it("prefers href when both are set", () => {
    render(
      <Basic>
        <Timeline.Item title="A" href="/a" onPress={() => {}} />
      </Basic>,
    );
    expect(screen.getByRole("link", { name: "A" })).toBeInTheDocument();
    expect(screen.queryByRole("button")).toBeNull();
  });

  it("warns when href or onPress has no title to be the control", () => {
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
    render(
      <Basic>
        <Timeline.Item description="x" href="/a" />
      </Basic>,
    );
    expect(warn).toHaveBeenCalledWith(expect.stringContaining("need a `title`"));
  });

  it("keeps a link inside the body clickable beside a linked title", () => {
    render(
      <Basic>
        <Timeline.Item title="A" href="/a">
          <a href="/b">Track</a>
        </Timeline.Item>
      </Basic>,
    );
    expect(screen.getAllByRole("link")).toHaveLength(2);
  });

  it("keeps the detail behind a disclosure button that opens and closes it", async () => {
    const user = userEvent.setup();
    render(
      <Basic>
        <Timeline.Item title="A" detail="More about it" />
      </Basic>,
    );
    const toggle = screen.getByRole("button", { name: "Details" });
    expect(toggle).toHaveAttribute("aria-expanded", "false");
    expect(screen.getByText("More about it")).not.toBeVisible();
    await user.click(toggle);
    expect(toggle).toHaveAttribute("aria-expanded", "true");
    expect(screen.getByText("More about it")).toBeVisible();
    expect(toggle).toHaveAttribute("aria-controls", screen.getByText("More about it").id);
    await user.click(toggle);
    expect(screen.getByText("More about it")).not.toBeVisible();
    expect(toggle).toHaveFocus();
  });

  it("opens the detail at first with defaultOpen, and asks through onOpenChange when controlled", async () => {
    const user = userEvent.setup();
    const onOpenChange = vi.fn();
    const { rerender } = render(
      <Basic>
        <Timeline.Item title="A" detail="Detail" defaultOpen />
      </Basic>,
    );
    expect(screen.getByText("Detail")).toBeVisible();
    rerender(
      <Basic>
        <Timeline.Item title="A" detail="Detail" open={false} onOpenChange={onOpenChange} />
      </Basic>,
    );
    // Switching a mounted item between uncontrolled and controlled warns; the point here is what the button does.
    vi.spyOn(console, "warn").mockImplementation(() => {});
    await user.click(screen.getByRole("button", { name: "Details" }));
    expect(onOpenChange).toHaveBeenCalledWith(true);
    expect(screen.getByText("Detail")).not.toBeVisible();
  });

  it("translates the detail button through labels", () => {
    render(
      <Basic labels={{ details: "Détails" }}>
        <Timeline.Item title="A" detail="x" />
      </Basic>,
    );
    expect(screen.getByRole("button", { name: "Détails" })).toBeInTheDocument();
  });

  it("lets one event override the line leaving it", () => {
    const { container } = render(
      <Basic>
        <Timeline.Item title="A" connector="dashed" />
        <Timeline.Item title="B" connector="none" />
        <Timeline.Item title="C" />
      </Basic>,
    );
    const items = container.querySelectorAll("li");
    expect(items[0]).toHaveAttribute("data-connector", "dashed");
    expect(items[1]!.querySelector("[class*='_connector_']")).toBeNull();
    expect(items[0]!.querySelector("[class*='_connector_']")).not.toBeNull();
  });

  it("has no accessibility violations with links, buttons, details, groups and an end", async () => {
    const { container } = render(
      <Basic>
        <Timeline.Group>Today</Timeline.Group>
        <Timeline.Item title="Linked" href="/a" icon={TruckIcon} />
        <Timeline.Item title="Pressed" onPress={() => {}} detail="Detail" />
        <Timeline.End>Closed</Timeline.End>
      </Basic>,
    );
    expect(await axe(container)).toHaveNoViolations();
  });
});

describe("Timeline — loading more, loading and empty", () => {
  it("draws no load-more button unless onLoadMore is set, and hides it with hasMore false", () => {
    const { rerender } = render(<Basic />);
    expect(screen.queryByRole("button", { name: "Load more" })).toBeNull();
    rerender(<Basic onLoadMore={() => {}} />);
    expect(screen.getByRole("button", { name: "Load more" })).toBeInTheDocument();
    rerender(<Basic onLoadMore={() => {}} hasMore={false} />);
    expect(screen.queryByRole("button", { name: "Load more" })).toBeNull();
  });

  it("calls onLoadMore, and says it is busy while loading", async () => {
    const user = userEvent.setup();
    const onLoadMore = vi.fn();
    const { rerender, container } = render(<Basic onLoadMore={onLoadMore} />);
    await user.click(screen.getByRole("button", { name: "Load more" }));
    expect(onLoadMore).toHaveBeenCalledTimes(1);
    rerender(<Basic onLoadMore={onLoadMore} loading />);
    expect(screen.getByRole("button", { name: "Loading…" })).toBeDisabled();
    expect(container.querySelector("ol")).toHaveAttribute("aria-busy", "true");
  });

  it("holds the load-more button back while the cap still hides events", async () => {
    const user = userEvent.setup();
    render(<Basic maxVisible={2} onLoadMore={() => {}} />);
    expect(screen.queryByRole("button", { name: "Load more" })).toBeNull();
    await user.click(screen.getByRole("button", { name: "Show 3 more events" }));
    expect(screen.getByRole("button", { name: "Load more" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Show fewer events" })).toBeInTheDocument();
  });

  it("gives focus back to the button when loading ends and focus was lost", async () => {
    const user = userEvent.setup();
    const { rerender } = render(<Basic onLoadMore={() => {}} />);
    await user.click(screen.getByRole("button", { name: "Load more" }));
    rerender(<Basic onLoadMore={() => {}} loading />);
    (document.activeElement as HTMLElement | null)?.blur();
    rerender(<Basic onLoadMore={() => {}} />);
    expect(screen.getByRole("button", { name: "Load more" })).toHaveFocus();
  });

  it("draws placeholder events while loading, hidden from assistive technology, the count given", () => {
    const { container, rerender } = render(<Basic loading />);
    expect(container.querySelectorAll("li[aria-hidden='true']")).toHaveLength(3);
    rerender(<Basic loading loadingCount={5} />);
    expect(container.querySelectorAll("li[aria-hidden='true']")).toHaveLength(5);
  });

  it("stands the placeholders in for the list when there are no events yet, with no empty message", () => {
    render(<Timeline aria-label="x" loading>{[]}</Timeline>);
    expect(screen.queryByText("No events yet")).toBeNull();
  });

  it("says no events yet, or what empty says, or nothing for false", () => {
    const { rerender } = render(<Timeline aria-label="x">{[]}</Timeline>);
    expect(screen.getByText("No events yet")).toBeInTheDocument();
    rerender(
      <Timeline aria-label="x" empty={<p>Nothing to show</p>}>
        {[]}
      </Timeline>,
    );
    expect(screen.getByText("Nothing to show")).toBeInTheDocument();
    rerender(
      <Timeline aria-label="x" empty={false}>
        {[]}
      </Timeline>,
    );
    expect(screen.queryByRole("listitem")).toBeNull();
  });

  it("translates the new texts through labels", () => {
    render(
      <Timeline aria-label="x" onLoadMore={() => {}} labels={{ empty: "Rien", loadMore: "Plus" }}>
        {[]}
      </Timeline>,
    );
    expect(screen.getByText("Rien")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Plus" })).toBeInTheDocument();
  });
});

describe("Timeline — announcing new events", () => {
  it("says how many events were added when announce is on, never on first render or for the first events", async () => {
    vi.useFakeTimers();
    const { rerender } = render(<Basic announce>{[]}</Basic>);
    rerender(
      <Basic announce>
        <Timeline.Item title="A" />
        <Timeline.Item title="B" />
      </Basic>,
    );
    await act(async () => {
      await vi.advanceTimersByTimeAsync(300);
    });
    expect(screen.getByRole("status")).toHaveTextContent("");
    rerender(
      <Basic announce>
        <Timeline.Item title="A" />
        <Timeline.Item title="B" />
        <Timeline.Item title="C" />
        <Timeline.Item title="D" />
        <Timeline.Item title="E" />
      </Basic>,
    );
    await act(async () => {
      await vi.advanceTimersByTimeAsync(300);
    });
    expect(screen.getByRole("status")).toHaveTextContent("3 new events");
  });

  it("says nothing when announce is off, and no status region exists unless one is needed", async () => {
    vi.useFakeTimers();
    const { rerender } = render(<Basic />);
    expect(screen.queryByRole("status")).toBeNull();
    rerender(
      <Basic>
        <Timeline.Item title="A" />
      </Basic>,
    );
    await act(async () => {
      await vi.advanceTimersByTimeAsync(300);
    });
    expect(screen.queryByRole("status")).toBeNull();
  });
});

describe("Timeline — orientation, alternate and the position of each event", () => {
  it("sets the orientation on the list, and resolves a breakpoint map", () => {
    const { container, rerender } = render(<Basic orientation="horizontal" />);
    expect(container.querySelector("ol")).toHaveAttribute("data-orientation", "horizontal");
    rerender(<Basic orientation={{ base: "vertical", md: "horizontal" }} />);
    expect(container.querySelector("ol")).toHaveAttribute("data-orientation", "vertical");
  });

  it("alternates the side events are on, counting events and the end but not headings", () => {
    render(
      <Basic align="alternate">
        <Timeline.Group>Today</Timeline.Group>
        <Timeline.Item title="A" />
        <Timeline.Item title="B" />
        <Timeline.Group>Earlier</Timeline.Group>
        <Timeline.Item title="C" />
        <Timeline.End>End</Timeline.End>
      </Basic>,
    );
    const side = (text: string) => screen.getByText(text).closest("li")!.getAttribute("data-side");
    expect([side("A"), side("B"), side("C"), side("End")]).toEqual(["end", "start", "end", "start"]);
  });

  it("is a tab stop only while a horizontal row scrolls", () => {
    const { container } = render(<Basic orientation="horizontal" />);
    // jsdom lays nothing out, so nothing overflows.
    expect(container.querySelector("ol")).not.toHaveAttribute("tabindex");
  });
});
