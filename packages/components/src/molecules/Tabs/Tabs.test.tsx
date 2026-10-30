import { act, fireEvent, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { axe } from "jest-axe";
import { createRef, StrictMode, useState } from "react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { HouseIcon } from "@dbm-system/icons";
import { Tabs } from "./Tabs";
import styles from "./Tabs.module.css";
import type { TabsProps } from "./Tabs.types";

type BasicProps = Omit<TabsProps, "children"> & { disabledSettings?: boolean };

function Basic({ disabledSettings = false, ...props }: BasicProps) {
  return (
    <Tabs {...(props.value === undefined ? { defaultValue: "overview" } : {})} {...props}>
      <Tabs.List aria-label="Project">
        <Tabs.Trigger value="overview">Overview</Tabs.Trigger>
        <Tabs.Trigger value="activity">Activity</Tabs.Trigger>
        <Tabs.Trigger value="settings" disabled={disabledSettings}>
          Settings
        </Tabs.Trigger>
      </Tabs.List>
      <Tabs.Content value="overview">Overview content</Tabs.Content>
      <Tabs.Content value="activity">Activity content</Tabs.Content>
      <Tabs.Content value="settings">Settings content</Tabs.Content>
    </Tabs>
  );
}

const restorers: Array<() => void> = [];

afterEach(() => {
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
  while (restorers.length) restorers.pop()!();
});

/** jsdom has no `Element.scrollBy`; install a spy for the test and take it away afterwards. */
function installScrollBy() {
  const original = Object.getOwnPropertyDescriptor(Element.prototype, "scrollBy");
  const scrollBy = vi.fn();
  Object.defineProperty(Element.prototype, "scrollBy", { configurable: true, writable: true, value: scrollBy });
  restorers.push(() => {
    if (original) Object.defineProperty(Element.prototype, "scrollBy", original);
    else delete (Element.prototype as unknown as Record<string, unknown>).scrollBy;
  });
  return scrollBy;
}

const rect = (left: number, right: number): DOMRect => ({
  left,
  right,
  top: 0,
  bottom: 0,
  width: right - left,
  height: 0,
  x: left,
  y: 0,
  toJSON: () => ({}),
});

/** The vertical-axis equivalent of `rect` — a top/bottom pair, left/right left at 0. */
const rectV = (top: number, bottom: number): DOMRect => ({
  left: 0,
  right: 0,
  top,
  bottom,
  width: 0,
  height: bottom - top,
  x: 0,
  y: top,
  toJSON: () => ({}),
});

describe("Tabs — structure and roles", () => {
  it("renders a tablist of tabs, and only the selected tab's panel", () => {
    render(<Basic />);
    expect(screen.getByRole("tablist", { name: "Project" })).toBeInTheDocument();
    expect(screen.getAllByRole("tab")).toHaveLength(3);
    expect(screen.getAllByRole("tabpanel")).toHaveLength(1);
    expect(screen.getByText("Overview content")).toBeVisible();
    expect(screen.queryByText("Activity content")).not.toBeInTheDocument();
  });

  it("marks the selected tab with aria-selected and data-state", () => {
    render(<Basic />);
    const overview = screen.getByRole("tab", { name: "Overview" });
    const activity = screen.getByRole("tab", { name: "Activity" });
    expect(overview).toHaveAttribute("aria-selected", "true");
    expect(overview).toHaveAttribute("data-state", "active");
    expect(activity).toHaveAttribute("aria-selected", "false");
    expect(activity).toHaveAttribute("data-state", "inactive");
  });

  it("wires each tab to its panel: aria-controls one way, aria-labelledby the other", () => {
    render(<Basic />);
    const overview = screen.getByRole("tab", { name: "Overview" });
    const panel = screen.getByRole("tabpanel");
    expect(overview).toHaveAttribute("aria-controls", panel.id);
    expect(panel).toHaveAttribute("aria-labelledby", overview.id);
    expect(panel.id).not.toBe("");
    expect(overview.id).not.toBe("");
  });

  it("makes the panel focusable, so a reader can Tab from the list into it", () => {
    render(<Basic />);
    expect(screen.getByRole("tabpanel")).toHaveAttribute("tabindex", "0");
  });

  it("gives each tab a real button that never submits a form", () => {
    render(<Basic />);
    const overview = screen.getByRole("tab", { name: "Overview" });
    expect(overview.tagName).toBe("BUTTON");
    expect(overview).toHaveAttribute("type", "button");
  });

  it("names the list from aria-label and from aria-labelledby", () => {
    const { rerender } = render(
      <Tabs defaultValue="a">
        <Tabs.List aria-label="Settings sections">
          <Tabs.Trigger value="a">A</Tabs.Trigger>
        </Tabs.List>
        <Tabs.Content value="a">A</Tabs.Content>
      </Tabs>,
    );
    expect(screen.getByRole("tablist", { name: "Settings sections" })).toBeInTheDocument();
    rerender(
      <>
        <h2 id="heading">Sections</h2>
        <Tabs defaultValue="a">
          <Tabs.List aria-labelledby="heading">
            <Tabs.Trigger value="a">A</Tabs.Trigger>
          </Tabs.List>
          <Tabs.Content value="a">A</Tabs.Content>
        </Tabs>
      </>,
    );
    expect(screen.getByRole("tablist", { name: "Sections" })).toBeInTheDocument();
  });
});

describe("Tabs — selection", () => {
  it("selects a tab on click and shows only its panel", async () => {
    const user = userEvent.setup();
    render(<Basic />);
    await user.click(screen.getByRole("tab", { name: "Activity" }));
    expect(screen.getByRole("tab", { name: "Activity" })).toHaveAttribute("aria-selected", "true");
    expect(screen.getByRole("tab", { name: "Overview" })).toHaveAttribute("aria-selected", "false");
    expect(screen.getByText("Activity content")).toBeVisible();
    expect(screen.queryByText("Overview content")).not.toBeInTheDocument();
  });

  it("calls onValueChange with the new value, and not for the tab that is already selected", async () => {
    const user = userEvent.setup();
    const onValueChange = vi.fn();
    render(<Basic onValueChange={onValueChange} />);
    await user.click(screen.getByRole("tab", { name: "Overview" }));
    expect(onValueChange).not.toHaveBeenCalled();
    await user.click(screen.getByRole("tab", { name: "Activity" }));
    expect(onValueChange).toHaveBeenCalledTimes(1);
    expect(onValueChange).toHaveBeenCalledWith("activity");
  });

  it("is controlled by value: a click only asks, the parent decides", async () => {
    const user = userEvent.setup();
    const onValueChange = vi.fn();
    render(<Basic value="overview" onValueChange={onValueChange} />);
    await user.click(screen.getByRole("tab", { name: "Activity" }));
    expect(onValueChange).toHaveBeenCalledWith("activity");
    expect(screen.getByRole("tab", { name: "Overview" })).toHaveAttribute("aria-selected", "true");
    expect(screen.getByText("Overview content")).toBeVisible();
  });

  it("follows a parent that owns the state", async () => {
    const user = userEvent.setup();
    function Parent() {
      const [value, setValue] = useState("overview");
      return (
        <>
          <span data-testid="current">{value}</span>
          <Basic value={value} onValueChange={setValue} />
        </>
      );
    }
    render(<Parent />);
    await user.click(screen.getByRole("tab", { name: "Activity" }));
    expect(screen.getByTestId("current")).toHaveTextContent("activity");
    expect(screen.getByText("Activity content")).toBeVisible();
  });

  it("selects nothing, and shows no panel, when neither value nor defaultValue is given", () => {
    vi.spyOn(console, "warn").mockImplementation(() => undefined);
    render(
      <Tabs>
        <Tabs.List aria-label="Project">
          <Tabs.Trigger value="a">A</Tabs.Trigger>
        </Tabs.List>
        <Tabs.Content value="a">A content</Tabs.Content>
      </Tabs>,
    );
    expect(screen.getByRole("tab", { name: "A" })).toHaveAttribute("aria-selected", "false");
    expect(screen.queryByRole("tabpanel")).not.toBeInTheDocument();
  });
});

describe("Tabs — keyboard", () => {
  it("enters the list once, on the selected tab", async () => {
    const user = userEvent.setup();
    render(<Basic defaultValue="activity" />);
    await user.tab();
    expect(screen.getByRole("tab", { name: "Activity" })).toHaveFocus();
    await user.tab();
    // The panel is the next stop, not the next tab.
    expect(screen.getByRole("tabpanel")).toHaveFocus();
  });

  it("moves focus and selection with the arrow keys in automatic mode, wrapping at the ends", async () => {
    const user = userEvent.setup();
    render(<Basic />);
    await user.tab();
    await user.keyboard("{ArrowRight}");
    expect(screen.getByRole("tab", { name: "Activity" })).toHaveFocus();
    expect(screen.getByRole("tab", { name: "Activity" })).toHaveAttribute("aria-selected", "true");
    await user.keyboard("{ArrowRight}{ArrowRight}");
    expect(screen.getByRole("tab", { name: "Overview" })).toHaveFocus();
    await user.keyboard("{ArrowLeft}");
    expect(screen.getByRole("tab", { name: "Settings" })).toHaveFocus();
  });

  it("jumps to the first and last tab with Home and End", async () => {
    const user = userEvent.setup();
    render(<Basic />);
    await user.tab();
    await user.keyboard("{End}");
    expect(screen.getByRole("tab", { name: "Settings" })).toHaveFocus();
    await user.keyboard("{Home}");
    expect(screen.getByRole("tab", { name: "Overview" })).toHaveFocus();
  });

  it("stops at the ends when the list does not loop", async () => {
    const user = userEvent.setup();
    render(
      <Tabs defaultValue="a">
        <Tabs.List aria-label="Project" loop={false}>
          <Tabs.Trigger value="a">A</Tabs.Trigger>
          <Tabs.Trigger value="b">B</Tabs.Trigger>
        </Tabs.List>
        <Tabs.Content value="a">A</Tabs.Content>
      </Tabs>,
    );
    await user.tab();
    await user.keyboard("{ArrowLeft}");
    expect(screen.getByRole("tab", { name: "A" })).toHaveFocus();
  });

  it("uses Up and Down, not Left and Right, when vertical", async () => {
    const user = userEvent.setup();
    render(<Basic orientation="vertical" />);
    expect(screen.getByRole("tablist")).toHaveAttribute("aria-orientation", "vertical");
    await user.tab();
    await user.keyboard("{ArrowRight}");
    expect(screen.getByRole("tab", { name: "Overview" })).toHaveFocus();
    await user.keyboard("{ArrowDown}");
    expect(screen.getByRole("tab", { name: "Activity" })).toHaveFocus();
    await user.keyboard("{ArrowUp}");
    expect(screen.getByRole("tab", { name: "Overview" })).toHaveFocus();
  });

  it("only moves focus in manual mode; Enter and Space select", async () => {
    const user = userEvent.setup();
    render(<Basic activationMode="manual" />);
    await user.tab();
    await user.keyboard("{ArrowRight}");
    const activity = screen.getByRole("tab", { name: "Activity" });
    expect(activity).toHaveFocus();
    expect(activity).toHaveAttribute("aria-selected", "false");
    expect(screen.getByText("Overview content")).toBeVisible();
    await user.keyboard("{Enter}");
    expect(activity).toHaveAttribute("aria-selected", "true");
    await user.keyboard("{ArrowRight}");
    await user.keyboard(" ");
    expect(screen.getByRole("tab", { name: "Settings" })).toHaveAttribute("aria-selected", "true");
  });

  it("mirrors the arrow keys under dir=rtl", async () => {
    const user = userEvent.setup();
    render(<Basic dir="rtl" />);
    expect(screen.getByRole("tablist").closest("[dir]")).toHaveAttribute("dir", "rtl");
    await user.tab();
    // Left is forward when text runs right to left.
    await user.keyboard("{ArrowLeft}");
    expect(screen.getByRole("tab", { name: "Activity" })).toHaveFocus();
    await user.keyboard("{ArrowRight}");
    expect(screen.getByRole("tab", { name: "Overview" })).toHaveFocus();
  });
});

describe("Tabs — disabled", () => {
  it("does not select a disabled tab on click", async () => {
    const user = userEvent.setup();
    render(<Basic disabledSettings />);
    const settings = screen.getByRole("tab", { name: "Settings" });
    expect(settings).toBeDisabled();
    await user.click(settings);
    expect(settings).toHaveAttribute("aria-selected", "false");
    expect(screen.getByText("Overview content")).toBeVisible();
  });

  it("skips a disabled tab with the arrow keys", async () => {
    const user = userEvent.setup();
    render(<Basic disabledSettings />);
    await user.tab();
    await user.keyboard("{ArrowRight}");
    expect(screen.getByRole("tab", { name: "Activity" })).toHaveFocus();
    await user.keyboard("{ArrowRight}");
    expect(screen.getByRole("tab", { name: "Overview" })).toHaveFocus();
  });
});

describe("Tabs — variants, sizes and layout", () => {
  it("defaults to the underline variant at md, horizontal", () => {
    render(<Basic />);
    const trigger = screen.getByRole("tab", { name: "Overview" });
    expect(trigger).toHaveClass(styles.underline!, styles.sizeMd!);
    expect(screen.getByRole("tablist")).toHaveClass(styles.listUnderline!);
    expect(screen.getByRole("tablist")).toHaveAttribute("data-orientation", "horizontal");
    expect(trigger).toHaveAttribute("data-orientation", "horizontal");
  });

  it.each([
    ["underline", "underline", "listUnderline"],
    ["subtle", "subtle", "listFilled"],
    ["outlined", "outlined", "listFilled"],
    ["solid", "solid", "listFilled"],
  ] as const)("styles the %s variant on the trigger and the list", (variant, triggerClass, listClass) => {
    render(<Basic variant={variant} />);
    expect(screen.getByRole("tab", { name: "Overview" })).toHaveClass(styles[triggerClass]!);
    expect(screen.getByRole("tablist")).toHaveClass(styles[listClass]!);
  });

  it.each([
    ["xs", "sizeXs", "contentXs"],
    ["sm", "sizeSm", "contentSm"],
    ["md", "sizeMd", "contentMd"],
    ["lg", "sizeLg", "contentLg"],
    ["xl", "sizeXl", "contentXl"],
  ] as const)("applies size %s to the trigger and the panel", (size, triggerClass, contentClass) => {
    render(<Basic size={size} />);
    expect(screen.getByRole("tab", { name: "Overview" })).toHaveClass(styles[triggerClass]!);
    expect(screen.getByRole("tabpanel")).toHaveClass(styles[contentClass]!);
  });

  it("does not round any tab by default", () => {
    for (const variant of ["underline", "subtle", "outlined", "solid"] as const) {
      const { unmount } = render(<Basic variant={variant} />);
      for (const tab of screen.getAllByRole("tab")) expect(tab).not.toHaveClass(styles.rounded!);
      unmount();
    }
  });

  it.each(["subtle", "outlined", "solid"] as const)("rounds every tab of the %s variant with rounded", (variant) => {
    render(<Basic variant={variant} rounded />);
    for (const tab of screen.getAllByRole("tab")) expect(tab).toHaveClass(styles.rounded!);
  });

  it("does nothing to the underline variant with rounded", () => {
    render(<Basic variant="underline" rounded />);
    for (const tab of screen.getAllByRole("tab")) expect(tab).not.toHaveClass(styles.rounded!);
  });

  it("rounds a nested Tabs only when that Tabs asks for it", () => {
    render(
      <Tabs defaultValue="outer" variant="solid" rounded>
        <Tabs.List aria-label="Outer">
          <Tabs.Trigger value="outer">Outer tab</Tabs.Trigger>
        </Tabs.List>
        <Tabs.Content value="outer">
          <Tabs defaultValue="inner" variant="subtle">
            <Tabs.List aria-label="Inner">
              <Tabs.Trigger value="inner">Inner tab</Tabs.Trigger>
            </Tabs.List>
            <Tabs.Content value="inner">Inner content</Tabs.Content>
          </Tabs>
        </Tabs.Content>
      </Tabs>,
    );
    expect(screen.getByRole("tab", { name: "Outer tab" })).toHaveClass(styles.rounded!);
    expect(screen.getByRole("tab", { name: "Inner tab" })).not.toHaveClass(styles.rounded!);
  });

  it("stretches the triggers with fullWidth", () => {
    render(<Basic fullWidth />);
    for (const tab of screen.getAllByRole("tab")) expect(tab).toHaveClass(styles.triggerFullWidth!);
  });

  it("sets data-orientation on the root, list, triggers and panel", () => {
    render(<Basic orientation="vertical" data-testid="root" />);
    expect(screen.getByTestId("root")).toHaveAttribute("data-orientation", "vertical");
    expect(screen.getByRole("tablist")).toHaveAttribute("data-orientation", "vertical");
    expect(screen.getByRole("tab", { name: "Overview" })).toHaveAttribute("data-orientation", "vertical");
    expect(screen.getByRole("tabpanel")).toHaveAttribute("data-orientation", "vertical");
  });

  it("styles a nested Tabs from its own root, not its parent's", () => {
    render(
      <Tabs defaultValue="outer" variant="solid">
        <Tabs.List aria-label="Outer">
          <Tabs.Trigger value="outer">Outer tab</Tabs.Trigger>
        </Tabs.List>
        <Tabs.Content value="outer">
          <Tabs defaultValue="inner" variant="subtle" size="sm">
            <Tabs.List aria-label="Inner">
              <Tabs.Trigger value="inner">Inner tab</Tabs.Trigger>
            </Tabs.List>
            <Tabs.Content value="inner">Inner content</Tabs.Content>
          </Tabs>
        </Tabs.Content>
      </Tabs>,
    );
    expect(screen.getByRole("tab", { name: "Outer tab" })).toHaveClass(styles.solid!, styles.sizeMd!);
    expect(screen.getByRole("tab", { name: "Inner tab" })).toHaveClass(styles.subtle!, styles.sizeSm!);
    expect(screen.getByRole("tab", { name: "Inner tab" })).not.toHaveClass(styles.solid!);
  });
});

describe("Tabs — responsive orientation", () => {
  it("resolves a breakpoint map to its base value when nothing matches", () => {
    render(<Basic orientation={{ base: "horizontal", md: "vertical" }} />);
    expect(screen.getByRole("tablist")).toHaveAttribute("aria-orientation", "horizontal");
  });

  it("resolves a matching breakpoint, and follows it when the screen changes", () => {
    const listeners: Array<() => void> = [];
    let wide = true;
    vi.stubGlobal(
      "matchMedia",
      vi.fn().mockImplementation((query: string) => ({
        get matches() {
          return query === "(min-width: 768px)" && wide;
        },
        media: query,
        addEventListener: (_event: string, callback: () => void) => listeners.push(callback),
        removeEventListener: vi.fn(),
      })),
    );
    render(<Basic orientation={{ base: "horizontal", md: "vertical" }} />);
    expect(screen.getByRole("tablist")).toHaveAttribute("aria-orientation", "vertical");
    wide = false;
    act(() => listeners.forEach((callback) => callback()));
    expect(screen.getByRole("tablist")).toHaveAttribute("aria-orientation", "horizontal");
  });
});

describe("Tabs — triggers", () => {
  it("renders an icon before the label, decorative and hidden from assistive technology", () => {
    render(
      <Tabs defaultValue="a">
        <Tabs.List aria-label="Project">
          <Tabs.Trigger value="a" icon={HouseIcon}>
            Home
          </Tabs.Trigger>
        </Tabs.List>
        <Tabs.Content value="a">A</Tabs.Content>
      </Tabs>,
    );
    const tab = screen.getByRole("tab", { name: "Home" });
    const svg = tab.querySelector("svg");
    expect(svg).not.toBeNull();
    expect(svg).toHaveAttribute("aria-hidden", "true");
    expect(tab.firstElementChild).toBe(svg);
  });

  it("names an icon-only tab from aria-label", () => {
    render(
      <Tabs defaultValue="a">
        <Tabs.List aria-label="Project">
          <Tabs.Trigger value="a" icon={HouseIcon} aria-label="Home" />
        </Tabs.List>
        <Tabs.Content value="a">A</Tabs.Content>
      </Tabs>,
    );
    expect(screen.getByRole("tab", { name: "Home" })).toBeInTheDocument();
  });

  it("renders onto the consumer's element with asChild, keeping the role, the state and the look", () => {
    render(
      <Tabs defaultValue="a">
        <Tabs.List aria-label="Project">
          <Tabs.Trigger value="a" asChild>
            <a href="#a">Alpha</a>
          </Tabs.Trigger>
          <Tabs.Trigger value="b" asChild>
            <a href="#b">Beta</a>
          </Tabs.Trigger>
        </Tabs.List>
        <Tabs.Content value="a">A content</Tabs.Content>
      </Tabs>,
    );
    const alpha = screen.getByRole("tab", { name: "Alpha" });
    expect(alpha.tagName).toBe("A");
    expect(alpha).toHaveAttribute("href", "#a");
    expect(alpha).toHaveAttribute("aria-selected", "true");
    expect(alpha).toHaveClass(styles.trigger!, styles.underline!);
    // The child supplies its own content: no wrapper span added around it.
    expect(alpha.querySelector(`.${styles.triggerLabel}`)).toBeNull();
  });

  it("selects an asChild tab on click", async () => {
    const user = userEvent.setup();
    render(
      <Tabs defaultValue="a">
        <Tabs.List aria-label="Project">
          <Tabs.Trigger value="a" asChild>
            <a href="#a">Alpha</a>
          </Tabs.Trigger>
          <Tabs.Trigger value="b" asChild>
            <a href="#b">Beta</a>
          </Tabs.Trigger>
        </Tabs.List>
        <Tabs.Content value="a">A content</Tabs.Content>
        <Tabs.Content value="b">B content</Tabs.Content>
      </Tabs>,
    );
    await user.click(screen.getByRole("tab", { name: "Beta" }));
    expect(screen.getByText("B content")).toBeVisible();
  });

  it("can hold a badge or any other node in its label", () => {
    render(
      <Tabs defaultValue="a">
        <Tabs.List aria-label="Mail">
          <Tabs.Trigger value="a">
            Inbox <span data-testid="count">12</span>
          </Tabs.Trigger>
        </Tabs.List>
        <Tabs.Content value="a">A</Tabs.Content>
      </Tabs>,
    );
    expect(screen.getByRole("tab", { name: "Inbox 12" })).toContainElement(screen.getByTestId("count"));
  });
});

describe("Tabs — forceMount", () => {
  it("keeps an unselected panel in the page, hidden from view by its data-state", () => {
    render(
      <Tabs defaultValue="a">
        <Tabs.List aria-label="Project">
          <Tabs.Trigger value="a">A</Tabs.Trigger>
          <Tabs.Trigger value="b">B</Tabs.Trigger>
        </Tabs.List>
        <Tabs.Content value="a">A content</Tabs.Content>
        <Tabs.Content value="b" forceMount data-testid="kept">
          B content
        </Tabs.Content>
      </Tabs>,
    );
    const kept = screen.getByTestId("kept");
    expect(kept).toBeInTheDocument();
    expect(kept).toHaveAttribute("data-state", "inactive");
    expect(kept).toHaveClass(styles.content!);
  });

  it("does not keep a panel mounted without it", () => {
    render(<Basic />);
    expect(screen.queryByText("Activity content")).not.toBeInTheDocument();
  });
});

describe("Tabs — props that every component takes", () => {
  it("forwards refs to the root, list, trigger and panel", () => {
    const rootRef = createRef<HTMLDivElement>();
    const listRef = createRef<HTMLDivElement>();
    const triggerRef = createRef<HTMLButtonElement>();
    const contentRef = createRef<HTMLDivElement>();
    render(
      <Tabs defaultValue="a" ref={rootRef}>
        <Tabs.List aria-label="Project" ref={listRef}>
          <Tabs.Trigger value="a" ref={triggerRef}>
            A
          </Tabs.Trigger>
        </Tabs.List>
        <Tabs.Content value="a" ref={contentRef}>
          A
        </Tabs.Content>
      </Tabs>,
    );
    expect(rootRef.current).toBeInstanceOf(HTMLDivElement);
    expect(listRef.current).toBe(screen.getByRole("tablist"));
    expect(triggerRef.current).toBe(screen.getByRole("tab"));
    expect(contentRef.current).toBe(screen.getByRole("tabpanel"));
  });

  it("accepts className, style, id and data-testid on every part", () => {
    render(
      <Tabs defaultValue="a" className="root-x" style={{ color: "red" }} id="root-id" data-testid="root">
        <Tabs.List aria-label="Project" className="list-x" style={{ color: "green" }} id="list-id" data-testid="list">
          <Tabs.Trigger value="a" className="trigger-x" style={{ color: "blue" }} data-testid="trigger">
            A
          </Tabs.Trigger>
        </Tabs.List>
        <Tabs.Content value="a" className="content-x" style={{ color: "gold" }} id="content-id" data-testid="content">
          A
        </Tabs.Content>
      </Tabs>,
    );
    expect(screen.getByTestId("root")).toHaveClass("root-x", styles.root!);
    expect(screen.getByTestId("root")).toHaveStyle({ color: "rgb(255, 0, 0)" });
    expect(screen.getByTestId("root")).toHaveAttribute("id", "root-id");
    expect(screen.getByTestId("list")).toHaveClass("list-x", styles.list!);
    expect(screen.getByTestId("list")).toHaveAttribute("id", "list-id");
    expect(screen.getByTestId("trigger")).toHaveClass("trigger-x", styles.trigger!);
    expect(screen.getByTestId("trigger")).toHaveStyle({ color: "rgb(0, 0, 255)" });
    expect(screen.getByTestId("content")).toHaveClass("content-x", styles.content!);
    expect(screen.getByTestId("content")).toHaveAttribute("id", "content-id");
  });

  it("passes native attributes through to each part", async () => {
    const user = userEvent.setup();
    const onFocus = vi.fn();
    const onClick = vi.fn();
    render(
      <Tabs defaultValue="a" title="root title">
        <Tabs.List aria-label="Project" title="list title">
          <Tabs.Trigger value="a" onFocus={onFocus} onClick={onClick} title="trigger title">
            A
          </Tabs.Trigger>
        </Tabs.List>
        <Tabs.Content value="a" title="content title">
          A
        </Tabs.Content>
      </Tabs>,
    );
    expect(screen.getByRole("tab")).toHaveAttribute("title", "trigger title");
    expect(screen.getByRole("tablist")).toHaveAttribute("title", "list title");
    expect(screen.getByRole("tabpanel")).toHaveAttribute("title", "content title");
    await user.click(screen.getByRole("tab"));
    expect(onFocus).toHaveBeenCalled();
    expect(onClick).toHaveBeenCalled();
  });

  it("puts the computed attributes after a consumer's own, so theirs can't win", () => {
    // `data-orientation` and `aria-orientation` are computed from the resolved orientation
    // (Radix sets its own before spreading what it is given, so a consumer's would otherwise
    // replace them). Typed loosely since they are exactly what the types discourage.
    const wrong: Record<string, string> = { "data-orientation": "vertical", "aria-orientation": "vertical" };
    render(
      <Tabs defaultValue="a" data-testid="root" {...wrong}>
        <Tabs.List aria-label="Project" {...wrong}>
          <Tabs.Trigger value="a" {...wrong}>
            A
          </Tabs.Trigger>
        </Tabs.List>
        <Tabs.Content value="a">A</Tabs.Content>
      </Tabs>,
    );
    expect(screen.getByTestId("root")).toHaveAttribute("data-orientation", "horizontal");
    expect(screen.getByRole("tablist")).toHaveAttribute("data-orientation", "horizontal");
    expect(screen.getByRole("tablist")).toHaveAttribute("aria-orientation", "horizontal");
    expect(screen.getByRole("tab")).toHaveAttribute("data-orientation", "horizontal");
  });
});

describe("Tabs — dev-mode warnings", () => {
  it("warns once when neither value nor defaultValue is passed", () => {
    const warn = vi.spyOn(console, "warn").mockImplementation(() => undefined);
    const { rerender } = render(
      <Tabs>
        <Tabs.List aria-label="Project">
          <Tabs.Trigger value="a">A</Tabs.Trigger>
        </Tabs.List>
      </Tabs>,
    );
    rerender(
      <Tabs>
        <Tabs.List aria-label="Project">
          <Tabs.Trigger value="a">A</Tabs.Trigger>
        </Tabs.List>
      </Tabs>,
    );
    expect(warn).toHaveBeenCalledTimes(1);
    expect(warn.mock.calls[0]?.[0]).toMatch(/neither `value` nor `defaultValue`/);
  });

  it("warns when value and defaultValue are both passed", () => {
    const warn = vi.spyOn(console, "warn").mockImplementation(() => undefined);
    render(<Basic value="overview" defaultValue="activity" />);
    expect(warn).toHaveBeenCalledTimes(1);
    expect(warn.mock.calls[0]?.[0]).toMatch(/both passed/);
  });

  it("does not warn for a correct controlled or uncontrolled use", () => {
    const warn = vi.spyOn(console, "warn").mockImplementation(() => undefined);
    render(<Basic />);
    render(<Basic value="overview" onValueChange={() => undefined} />);
    expect(warn).not.toHaveBeenCalled();
  });

  it("warns once about an icon-only tab with no accessible name", () => {
    const warn = vi.spyOn(console, "warn").mockImplementation(() => undefined);
    render(
      <Tabs defaultValue="a">
        <Tabs.List aria-label="Project">
          <Tabs.Trigger value="a" icon={HouseIcon} />
        </Tabs.List>
        <Tabs.Content value="a">A</Tabs.Content>
      </Tabs>,
    );
    expect(warn).toHaveBeenCalledTimes(1);
    expect(warn.mock.calls[0]?.[0]).toMatch(/no accessible name/);
  });

  it("does not warn for an icon-only tab that has aria-label, or a child", () => {
    const warn = vi.spyOn(console, "warn").mockImplementation(() => undefined);
    render(
      <Tabs defaultValue="a">
        <Tabs.List aria-label="Project">
          <Tabs.Trigger value="a" icon={HouseIcon} aria-label="Home" />
          <Tabs.Trigger value="b" asChild>
            <a href="#b">B</a>
          </Tabs.Trigger>
        </Tabs.List>
        <Tabs.Content value="a">A</Tabs.Content>
      </Tabs>,
    );
    expect(warn).not.toHaveBeenCalled();
  });

  it("warns that icon has no effect with asChild", () => {
    const warn = vi.spyOn(console, "warn").mockImplementation(() => undefined);
    render(
      <Tabs defaultValue="a">
        <Tabs.List aria-label="Project">
          <Tabs.Trigger value="a" asChild icon={HouseIcon}>
            <a href="#a">A</a>
          </Tabs.Trigger>
        </Tabs.List>
        <Tabs.Content value="a">A</Tabs.Content>
      </Tabs>,
    );
    expect(warn).toHaveBeenCalledTimes(1);
    expect(warn.mock.calls[0]?.[0]).toMatch(/`icon` has no effect when `asChild`/);
  });
});

describe("Tabs — survives StrictMode", () => {
  it("works the same when mounted, unmounted and remounted", async () => {
    const user = userEvent.setup();
    const onValueChange = vi.fn();
    render(
      <StrictMode>
        <Basic onValueChange={onValueChange} />
      </StrictMode>,
    );
    expect(screen.getByText("Overview content")).toBeVisible();
    await user.click(screen.getByRole("tab", { name: "Activity" }));
    expect(onValueChange).toHaveBeenCalledTimes(1);
    expect(screen.getByText("Activity content")).toBeVisible();
  });
});

describe("Tabs — keeping the selected tab in view", () => {
  // jsdom performs no layout, so rectangles are stubbed: the list is 100px wide (left 0 to
  // 100), and a tab is placed wherever a test says.
  const stubRect = (element: Element, left: number, right: number) =>
    vi.spyOn(element, "getBoundingClientRect").mockReturnValue(rect(left, right));

  it("scrolls a tab that is selected off the end into view as soon as the list mounts, without animating", () => {
    const scrollBy = installScrollBy();
    vi.spyOn(HTMLElement.prototype, "getBoundingClientRect").mockImplementation(function (this: HTMLElement) {
      if (this.getAttribute("role") === "tablist") return rect(0, 100);
      if (this.getAttribute("data-state") === "active" && this.getAttribute("role") === "tab") return rect(60, 140);
      return rect(0, 0);
    });
    render(<Basic defaultValue="settings" />);
    // The tab overhangs the list's end by 40px, and the first look is instant: nobody should
    // watch the list slide on page load.
    expect(scrollBy).toHaveBeenCalledWith({ left: 40, behavior: "auto" });
  });

  it("reveals the selected tab as the selection changes", async () => {
    const user = userEvent.setup();
    const scrollBy = installScrollBy();
    render(<Basic />);
    stubRect(screen.getByRole("tablist"), 0, 100);
    stubRect(screen.getByRole("tab", { name: "Activity" }), 60, 140);
    await user.click(screen.getByRole("tab", { name: "Activity" }));
    // The tab overhangs the list's end by 40px, so the list scrolls 40px towards it.
    await vi.waitFor(() => expect(scrollBy).toHaveBeenCalledWith({ left: 40, behavior: "smooth" }));
  });

  it("scrolls the other way for a tab that starts before the list's start", async () => {
    const user = userEvent.setup();
    const scrollBy = installScrollBy();
    render(<Basic defaultValue="settings" />);
    stubRect(screen.getByRole("tablist"), 100, 200);
    stubRect(screen.getByRole("tab", { name: "Overview" }), 70, 130);
    await user.click(screen.getByRole("tab", { name: "Overview" }));
    await vi.waitFor(() => expect(scrollBy).toHaveBeenCalledWith({ left: -30, behavior: "smooth" }));
  });

  it("does not scroll when the tab is already fully in view", async () => {
    const user = userEvent.setup();
    const scrollBy = installScrollBy();
    render(<Basic />);
    stubRect(screen.getByRole("tablist"), 0, 200);
    stubRect(screen.getByRole("tab", { name: "Activity" }), 60, 130);
    await user.click(screen.getByRole("tab", { name: "Activity" }));
    await new Promise((resolve) => setTimeout(resolve, 20));
    expect(scrollBy).not.toHaveBeenCalled();
  });

  it("uses an instant scroll for a reader who asked for less motion", async () => {
    const user = userEvent.setup();
    const scrollBy = installScrollBy();
    vi.stubGlobal(
      "matchMedia",
      vi.fn().mockImplementation((query: string) => ({
        matches: query === "(prefers-reduced-motion: reduce)",
        media: query,
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
      })),
    );
    render(<Basic />);
    stubRect(screen.getByRole("tablist"), 0, 100);
    stubRect(screen.getByRole("tab", { name: "Activity" }), 60, 140);
    await user.click(screen.getByRole("tab", { name: "Activity" }));
    await vi.waitFor(() => expect(scrollBy).toHaveBeenCalledWith({ left: 40, behavior: "auto" }));
  });

  it("reveals a vertically selected tab along the block axis, not the inline one", async () => {
    const user = userEvent.setup();
    const scrollBy = installScrollBy();
    render(<Basic orientation="vertical" />);
    vi.spyOn(screen.getByRole("tablist"), "getBoundingClientRect").mockReturnValue(rectV(0, 100));
    vi.spyOn(screen.getByRole("tab", { name: "Activity" }), "getBoundingClientRect").mockReturnValue(rectV(60, 140));
    await user.click(screen.getByRole("tab", { name: "Activity" }));
    // The tab overhangs the list's bottom by 40px, so the list scrolls 40px down — `top`, not `left`.
    await vi.waitFor(() => expect(scrollBy).toHaveBeenCalledWith({ top: 40, behavior: "smooth" }));
  });

  it("does not throw where scrollBy does not exist", async () => {
    const user = userEvent.setup();
    render(<Basic />);
    stubRect(screen.getByRole("tablist"), 0, 100);
    stubRect(screen.getByRole("tab", { name: "Activity" }), 60, 140);
    await user.click(screen.getByRole("tab", { name: "Activity" }));
    expect(screen.getByRole("tab", { name: "Activity" })).toHaveAttribute("aria-selected", "true");
  });

  it("stops watching once unmounted", () => {
    const disconnect = vi.fn();
    class ObserverSpy {
      observe() {}

      disconnect = disconnect;
    }
    vi.stubGlobal("MutationObserver", ObserverSpy);
    const { unmount } = render(<Basic />);
    unmount();
    expect(disconnect).toHaveBeenCalled();
  });
});

describe("Tabs — align", () => {
  it("defaults to start", () => {
    render(<Basic />);
    expect(screen.getByRole("tablist")).toHaveClass(styles.alignStart!);
  });

  it.each([
    ["start", "alignStart"],
    ["center", "alignCenter"],
    ["end", "alignEnd"],
  ] as const)("applies align=\"%s\"", (align, className) => {
    render(
      <Tabs defaultValue="a">
        <Tabs.List aria-label="Project" align={align}>
          <Tabs.Trigger value="a">A</Tabs.Trigger>
        </Tabs.List>
        <Tabs.Content value="a">A</Tabs.Content>
      </Tabs>,
    );
    expect(screen.getByRole("tablist")).toHaveClass(styles[className]!);
  });

  it("still applies its default to a vertical list", () => {
    render(<Basic orientation="vertical" />);
    expect(screen.getByRole("tablist")).toHaveClass(styles.alignStart!);
  });
});

describe("Tabs — overflow", () => {
  // jsdom performs no layout, so rectangles are stubbed: the list is 100px wide (left 0 to 100).
  // `Basic`'s own three triggers are "Overview", "Activity", "Settings", by text.
  const stubOverflow = (opts: { startVisible: boolean; endVisible: boolean }) =>
    vi.spyOn(HTMLElement.prototype, "getBoundingClientRect").mockImplementation(function (this: HTMLElement) {
      if (this.getAttribute("role") !== "tablist" && this.getAttribute("role") !== "tab") return rect(0, 0);
      if (this.getAttribute("role") === "tablist") return rect(0, 100);
      if (this.textContent === "Overview") return opts.startVisible ? rect(0, 40) : rect(-40, 0);
      if (this.textContent === "Settings") return opts.endVisible ? rect(60, 100) : rect(120, 180);
      return rect(40, 60);
    });

  // jsdom's `:focus-visible` depends on which tests ran before it, so it is stubbed explicitly here,
  // the same pattern `Pagination`'s own tests use for its identical "held back while focused" case.
  let focusVisible: ReturnType<typeof vi.spyOn> | undefined;
  const keyboardFocus = (visible: boolean) => {
    const matches = Element.prototype.matches;
    focusVisible = vi.spyOn(Element.prototype, "matches").mockImplementation(function (this: Element, selector: string) {
      return selector === ":focus-visible" ? visible && document.activeElement === this : matches.call(this, selector);
    });
  };
  afterEach(() => focusVisible?.mockRestore());

  it("shows no scroll button when both ends are visible", () => {
    stubOverflow({ startVisible: true, endVisible: true });
    render(<Basic />);
    expect(screen.queryByRole("button", { name: /Scroll tabs/ })).not.toBeInTheDocument();
  });

  it("shows only the end button when the first tab is visible but the last is not", () => {
    stubOverflow({ startVisible: true, endVisible: false });
    const { container } = render(<Basic />);
    expect(screen.getByRole("button", { name: "Scroll tabs to the end" })).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Scroll tabs to the start" })).not.toBeInTheDocument();
    const wrapper = container.querySelector("[data-overflow-start]");
    expect(wrapper).toHaveAttribute("data-overflow-start", "false");
    expect(wrapper).toHaveAttribute("data-overflow-end", "true");
  });

  it("shows only the start button when the last tab is visible but the first is not", () => {
    stubOverflow({ startVisible: false, endVisible: true });
    render(<Basic />);
    expect(screen.getByRole("button", { name: "Scroll tabs to the start" })).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Scroll tabs to the end" })).not.toBeInTheDocument();
  });

  it("shows both buttons when neither end is visible", () => {
    stubOverflow({ startVisible: false, endVisible: false });
    render(<Basic />);
    expect(screen.getByRole("button", { name: "Scroll tabs to the start" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Scroll tabs to the end" })).toBeInTheDocument();
  });

  // The vertical-axis equivalent of `stubOverflow`, above — same shape, top/bottom instead of left/right.
  const stubOverflowV = (opts: { startVisible: boolean; endVisible: boolean }) =>
    vi.spyOn(HTMLElement.prototype, "getBoundingClientRect").mockImplementation(function (this: HTMLElement) {
      if (this.getAttribute("role") !== "tablist" && this.getAttribute("role") !== "tab") return rectV(0, 0);
      if (this.getAttribute("role") === "tablist") return rectV(0, 100);
      if (this.textContent === "Overview") return opts.startVisible ? rectV(0, 40) : rectV(-40, 0);
      if (this.textContent === "Settings") return opts.endVisible ? rectV(60, 100) : rectV(120, 180);
      return rectV(40, 60);
    });

  it("shows scroll buttons for a vertical list along the same block-axis rule", () => {
    stubOverflowV({ startVisible: false, endVisible: false });
    render(<Basic orientation="vertical" />);
    const start = screen.getByRole("button", { name: "Scroll tabs to the start" });
    const end = screen.getByRole("button", { name: "Scroll tabs to the end" });
    expect(start).toBeInTheDocument();
    expect(end).toBeInTheDocument();
    expect(start.querySelector("svg")).not.toBeNull();
    expect(end.querySelector("svg")).not.toBeNull();
  });

  it("renders no scroll buttons for a vertical list whose ends are both visible", () => {
    stubOverflowV({ startVisible: true, endVisible: true });
    render(<Basic orientation="vertical" />);
    expect(screen.queryByRole("button", { name: /Scroll tabs/ })).not.toBeInTheDocument();
  });

  it("hides both scroll buttons when showScrollButtons is false, even while overflowing", () => {
    stubOverflow({ startVisible: false, endVisible: false });
    const { container } = render(
      <Tabs defaultValue="overview">
        <Tabs.List aria-label="Project" showScrollButtons={false}>
          <Tabs.Trigger value="overview">Overview</Tabs.Trigger>
          <Tabs.Trigger value="settings">Settings</Tabs.Trigger>
        </Tabs.List>
        <Tabs.Content value="overview">A</Tabs.Content>
      </Tabs>,
    );
    expect(screen.queryByRole("button", { name: /Scroll tabs/ })).not.toBeInTheDocument();
    // The fade is unaffected — driven by the same overflow signal, not by the buttons' own presence.
    const wrapper = container.querySelector("[data-overflow-start]");
    expect(wrapper).toHaveAttribute("data-overflow-start", "true");
    expect(wrapper).toHaveAttribute("data-overflow-end", "true");
  });

  it("hides both scroll buttons for a vertical list too when showScrollButtons is false", () => {
    stubOverflowV({ startVisible: false, endVisible: false });
    const { container } = render(
      <Tabs defaultValue="overview" orientation="vertical">
        <Tabs.List aria-label="Project" showScrollButtons={false}>
          <Tabs.Trigger value="overview">Overview</Tabs.Trigger>
          <Tabs.Trigger value="settings">Settings</Tabs.Trigger>
        </Tabs.List>
        <Tabs.Content value="overview">A</Tabs.Content>
      </Tabs>,
    );
    expect(screen.queryByRole("button", { name: /Scroll tabs/ })).not.toBeInTheDocument();
    const wrapper = container.querySelector("[data-overflow-start]");
    expect(wrapper).toHaveAttribute("data-overflow-start", "true");
    expect(wrapper).toHaveAttribute("data-overflow-end", "true");
  });

  it("does not hide the scroll buttons by default", () => {
    stubOverflow({ startVisible: false, endVisible: false });
    render(<Basic />);
    expect(screen.getByRole("button", { name: "Scroll tabs to the start" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Scroll tabs to the end" })).toBeInTheDocument();
  });

  it("scrolls forward by the list's own width when the end button is clicked", async () => {
    const user = userEvent.setup();
    const scrollBy = installScrollBy();
    stubOverflow({ startVisible: true, endVisible: false });
    render(<Basic />);
    Object.defineProperty(screen.getByRole("tablist"), "clientWidth", { configurable: true, value: 120 });
    await user.click(screen.getByRole("button", { name: "Scroll tabs to the end" }));
    expect(scrollBy).toHaveBeenCalledWith({ left: 120, behavior: "smooth" });
  });

  it("scrolls backward by the list's own width when the start button is clicked", async () => {
    const user = userEvent.setup();
    const scrollBy = installScrollBy();
    stubOverflow({ startVisible: false, endVisible: true });
    render(<Basic />);
    Object.defineProperty(screen.getByRole("tablist"), "clientWidth", { configurable: true, value: 120 });
    await user.click(screen.getByRole("button", { name: "Scroll tabs to the start" }));
    expect(scrollBy).toHaveBeenCalledWith({ left: -120, behavior: "smooth" });
  });

  it("scrolls forward by the list's own height when a vertical end button is clicked", async () => {
    const user = userEvent.setup();
    const scrollBy = installScrollBy();
    stubOverflowV({ startVisible: true, endVisible: false });
    render(<Basic orientation="vertical" />);
    Object.defineProperty(screen.getByRole("tablist"), "clientHeight", { configurable: true, value: 120 });
    await user.click(screen.getByRole("button", { name: "Scroll tabs to the end" }));
    expect(scrollBy).toHaveBeenCalledWith({ top: 120, behavior: "smooth" });
  });

  it("scrolls backward by the list's own height when a vertical start button is clicked", async () => {
    const user = userEvent.setup();
    const scrollBy = installScrollBy();
    stubOverflowV({ startVisible: false, endVisible: true });
    render(<Basic orientation="vertical" />);
    Object.defineProperty(screen.getByRole("tablist"), "clientHeight", { configurable: true, value: 120 });
    await user.click(screen.getByRole("button", { name: "Scroll tabs to the start" }));
    expect(scrollBy).toHaveBeenCalledWith({ top: -120, behavior: "smooth" });
  });

  it("does not scroll a button that is already inert", async () => {
    const user = userEvent.setup();
    const scrollBy = installScrollBy();
    stubOverflow({ startVisible: true, endVisible: false });
    render(<Basic />);
    const button = screen.getByRole("button", { name: "Scroll tabs to the end" });
    // Focus it (held), then let the underlying overflow go away — inert, but still in the page.
    keyboardFocus(true);
    act(() => button.focus());
    fireEvent.focus(button);
    stubOverflow({ startVisible: true, endVisible: true });
    fireEvent.scroll(screen.getByRole("tablist"));
    await vi.waitFor(() => expect(button).toHaveAttribute("aria-disabled", "true"));
    await user.click(button);
    expect(scrollBy).not.toHaveBeenCalled();
  });

  it("keeps a scroll button in the page, inert, while it still has keyboard focus once nothing is left to scroll to", async () => {
    stubOverflow({ startVisible: true, endVisible: false });
    render(<Basic />);
    const button = screen.getByRole("button", { name: "Scroll tabs to the end" });
    keyboardFocus(true);
    act(() => button.focus());
    fireEvent.focus(button);
    expect(button).not.toHaveAttribute("aria-disabled");

    // The underlying overflow is gone, but the button is still focused — it stays, inert.
    stubOverflow({ startVisible: true, endVisible: true });
    fireEvent.scroll(screen.getByRole("tablist"));
    await vi.waitFor(() => expect(button).toHaveAttribute("aria-disabled", "true"));
    expect(screen.getByRole("button", { name: "Scroll tabs to the end" })).toBe(button);
    expect(button).toHaveFocus();

    // Moving focus away releases it.
    fireEvent.blur(button);
    expect(screen.queryByRole("button", { name: "Scroll tabs to the end" })).not.toBeInTheDocument();
  });

  it("does not hold a button that lost overflow from a mouse-produced (not keyboard) focus", async () => {
    stubOverflow({ startVisible: true, endVisible: false });
    render(<Basic />);
    const button = screen.getByRole("button", { name: "Scroll tabs to the end" });
    keyboardFocus(false);
    fireEvent.focus(button);
    stubOverflow({ startVisible: true, endVisible: true });
    fireEvent.scroll(screen.getByRole("tablist"));
    await vi.waitFor(() => expect(screen.queryByRole("button", { name: "Scroll tabs to the end" })).not.toBeInTheDocument());
  });

  it("stops watching for overflow once unmounted", () => {
    stubOverflow({ startVisible: true, endVisible: false });
    const disconnect = vi.fn();
    class ObserverSpy {
      observe() {}

      disconnect = disconnect;
    }
    vi.stubGlobal("MutationObserver", ObserverSpy);
    const { unmount } = render(<Basic />);
    unmount();
    expect(disconnect).toHaveBeenCalled();
  });
});

describe("Tabs — accessibility (jest-axe)", () => {
  it("has no violations by default", async () => {
    const { container } = render(<Basic />);
    expect(await axe(container)).toHaveNoViolations();
  });

  it.each(["underline", "subtle", "outlined", "solid"] as const)("has no violations in the %s variant", async (variant) => {
    const { container } = render(<Basic variant={variant} />);
    expect(await axe(container)).toHaveNoViolations();
  });

  it("has no violations when rounded", async () => {
    const { container } = render(<Basic variant="outlined" rounded />);
    expect(await axe(container)).toHaveNoViolations();
  });

  it("has no violations when vertical, manual, full width, and with a disabled tab", async () => {
    const { container } = render(<Basic orientation="vertical" activationMode="manual" fullWidth disabledSettings />);
    expect(await axe(container)).toHaveNoViolations();
  });

  it("has no violations with icons, an icon-only labelled tab, and a count", async () => {
    const { container } = render(
      <Tabs defaultValue="a">
        <Tabs.List aria-label="Mail">
          <Tabs.Trigger value="a" icon={HouseIcon}>
            Inbox <span>12</span>
          </Tabs.Trigger>
          <Tabs.Trigger value="b" icon={HouseIcon} aria-label="Sent" />
        </Tabs.List>
        <Tabs.Content value="a">A</Tabs.Content>
      </Tabs>,
    );
    expect(await axe(container)).toHaveNoViolations();
  });

  it("has no violations with tabs rendered as links", async () => {
    const { container } = render(
      <Tabs defaultValue="a">
        <Tabs.List aria-label="Project">
          <Tabs.Trigger value="a" asChild>
            <a href="#a">Alpha</a>
          </Tabs.Trigger>
          <Tabs.Trigger value="b" asChild>
            <a href="#b">Beta</a>
          </Tabs.Trigger>
        </Tabs.List>
        <Tabs.Content value="a">A</Tabs.Content>
      </Tabs>,
    );
    expect(await axe(container)).toHaveNoViolations();
  });

  it("has no violations with a kept-mounted panel", async () => {
    const { container } = render(
      <Tabs defaultValue="a">
        <Tabs.List aria-label="Project">
          <Tabs.Trigger value="a">A</Tabs.Trigger>
          <Tabs.Trigger value="b">B</Tabs.Trigger>
        </Tabs.List>
        <Tabs.Content value="a">A</Tabs.Content>
        <Tabs.Content value="b" forceMount>
          B
        </Tabs.Content>
      </Tabs>,
    );
    expect(await axe(container)).toHaveNoViolations();
  });

  it("has no violations right to left", async () => {
    const { container } = render(<Basic dir="rtl" />);
    expect(await axe(container)).toHaveNoViolations();
  });
});

function WithItems(props: Partial<TabsProps> & { onClose?: (value: string) => void }) {
  const { onClose, ...rest } = props;
  return (
    <Tabs defaultValue="a" {...rest}>
      <Tabs.List aria-label="Open files">
        {["a", "b", "c"].map((value) => (
          <Tabs.Item
            key={value}
            data-testid={`item-${value}`}
            action={
              <button type="button" tabIndex={-1} aria-label={`Close ${value}`} onClick={() => onClose?.(value)}>
                x
              </button>
            }
          >
            <Tabs.Trigger value={value}>File {value}</Tabs.Trigger>
          </Tabs.Item>
        ))}
        <Tabs.Trigger value="d">Plain</Tabs.Trigger>
      </Tabs.List>
      <Tabs.Content value="a">A</Tabs.Content>
      <Tabs.Content value="d">D</Tabs.Content>
    </Tabs>
  );
}

describe("Tabs.Item", () => {
  it("draws the action beside the tab button, not inside it", () => {
    render(<WithItems />);
    const close = screen.getByRole("button", { name: "Close a", hidden: true });
    const tab = screen.getByRole("tab", { name: "File a" });
    expect(tab.contains(close)).toBe(false);
    expect(screen.getByTestId("item-a")).toContainElement(close);
    expect(screen.getByTestId("item-a")).toContainElement(tab);
  });

  it("leaves room for the action only on a trigger whose item has one", () => {
    render(<WithItems />);
    expect(screen.getByRole("tab", { name: "File a" })).toHaveClass(styles.triggerWithAction!);
    expect(screen.getByRole("tab", { name: "Plain" })).not.toHaveClass(styles.triggerWithAction!);
  });

  it("keeps one tab stop and arrow-key movement across items and bare triggers", async () => {
    const user = userEvent.setup();
    render(<WithItems />);
    await user.tab();
    expect(screen.getByRole("tab", { name: "File a" })).toHaveFocus();
    await user.keyboard("{ArrowRight}{ArrowRight}{ArrowRight}");
    expect(screen.getByRole("tab", { name: "Plain" })).toHaveFocus();
    await user.keyboard("{ArrowRight}");
    expect(screen.getByRole("tab", { name: "File a" })).toHaveFocus();
  });

  it("hides the action from assistive technology and keeps it out of the tab order", () => {
    render(<WithItems />);
    const close = screen.getByRole("button", { name: "Close a", hidden: true });
    expect(close.closest("[aria-hidden='true']")).not.toBeNull();
    expect(close).toHaveAttribute("tabindex", "-1");
    expect(screen.queryByRole("button", { name: "Close a" })).toBeNull();
  });

  it("does not select the tab when the action is pressed", async () => {
    const user = userEvent.setup();
    const onClose = vi.fn();
    render(<WithItems onClose={onClose} />);
    await user.click(screen.getByRole("button", { name: "Close b", hidden: true }));
    expect(onClose).toHaveBeenCalledWith("b");
    expect(screen.getByRole("tab", { name: "File a" })).toHaveAttribute("aria-selected", "true");
  });

  it("takes className, style, id and data-testid, and forwards its ref to the wrapper", () => {
    const ref = createRef<HTMLDivElement>();
    render(
      <Tabs defaultValue="a">
        <Tabs.List aria-label="Files">
          <Tabs.Item ref={ref} className="mine" style={{ color: "red" }} id="item" data-testid="it">
            <Tabs.Trigger value="a">A</Tabs.Trigger>
          </Tabs.Item>
        </Tabs.List>
      </Tabs>,
    );
    const item = screen.getByTestId("it");
    expect(ref.current).toBe(item);
    expect(item).toHaveClass("mine");
    expect(item).toHaveAttribute("id", "item");
    expect(item.style.color).toBe("red");
  });

  it("reads the resolved orientation, after any consumer data-orientation", () => {
    render(<WithItems orientation="vertical" />);
    expect(screen.getByTestId("item-a")).toHaveAttribute("data-orientation", "vertical");
  });

  it("renders no action wrapper when there is no action", () => {
    render(
      <Tabs defaultValue="a">
        <Tabs.List aria-label="Files">
          <Tabs.Item data-testid="bare">
            <Tabs.Trigger value="a">A</Tabs.Trigger>
          </Tabs.Item>
        </Tabs.List>
      </Tabs>,
    );
    expect(screen.getByTestId("bare").children).toHaveLength(1);
    expect(screen.getByRole("tab", { name: "A" })).not.toHaveClass(styles.triggerWithAction!);
  });

  it("has no axe violations with actions in the tab list", async () => {
    const { container } = render(<WithItems />);
    expect(await axe(container)).toHaveNoViolations();
  });
});

describe("Tabs — icon sizes", () => {
  it("draws a tab's icon one step larger with each of the five sizes", () => {
    const seen = new Set<string>();
    for (const size of ["xs", "sm", "md", "lg", "xl"] as const) {
      const { container, unmount } = render(
        <Tabs defaultValue="a" size={size}>
          <Tabs.List aria-label="Mail">
            <Tabs.Trigger value="a" icon={HouseIcon}>
              Inbox
            </Tabs.Trigger>
          </Tabs.List>
        </Tabs>,
      );
      seen.add(container.querySelector("svg")!.getAttribute("class") ?? "");
      unmount();
    }
    expect(seen.size).toBe(5);
  });
});
