import { CopyIcon, TextBIcon, TextItalicIcon } from "@dbm-system/icons";
import { render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { axe } from "jest-axe";
import { createRef, StrictMode } from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { Button } from "../../atoms/Button";
import buttonStyles from "../../atoms/Button/Button.module.css";
import iconButtonStyles from "../../atoms/IconButton/IconButton.module.css";
import buttonGroupStyles from "../ButtonGroup/ButtonGroup.module.css";
import toggleStyles from "../ToggleGroup/ToggleGroup.module.css";
import { Tooltip, TooltipProvider } from "../../atoms/Tooltip";
import { Popover } from "../Popover";
import { Select } from "../Select";
import { ButtonGroup } from "../ButtonGroup";
import { Toolbar } from "./Toolbar";
import styles from "./Toolbar.module.css";
import { DirectionProvider } from "../../atoms/DirectionProvider";

afterEach(() => {
  vi.restoreAllMocks();
});

const Bar = (props: Partial<React.ComponentProps<typeof Toolbar>>) => (
  <Toolbar aria-label="Formatting" {...props}>
    <Toolbar.IconButton icon={TextBIcon} aria-label="Bold" />
    <Toolbar.IconButton icon={TextItalicIcon} aria-label="Italic" />
    <Toolbar.Separator />
    <Toolbar.Button>Link</Toolbar.Button>
  </Toolbar>
);

describe("Toolbar", () => {
  it("is a named toolbar with the orientation stated", () => {
    render(<Bar />);
    const bar = screen.getByRole("toolbar", { name: "Formatting" });
    expect(bar).toHaveAttribute("aria-orientation", "horizontal");
    expect(bar).toHaveAttribute("data-orientation", "horizontal");
  });

  it("can be named by a visible label", () => {
    render(
      <>
        <span id="label">Formatting</span>
        <Toolbar aria-labelledby="label">
          <Toolbar.Button>Link</Toolbar.Button>
        </Toolbar>
      </>,
    );
    expect(screen.getByRole("toolbar", { name: "Formatting" })).toBeInTheDocument();
  });

  it("warns once in development with no accessible name, for the toolbar and for a group", () => {
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
    const { rerender } = render(
      <Toolbar>
        <Toolbar.Group>
          <Toolbar.Button>A</Toolbar.Button>
        </Toolbar.Group>
      </Toolbar>,
    );
    rerender(
      <Toolbar>
        <Toolbar.Group>
          <Toolbar.Button>A</Toolbar.Button>
        </Toolbar.Group>
      </Toolbar>,
    );
    expect(warn).toHaveBeenCalledTimes(2);
    expect(warn).toHaveBeenCalledWith(expect.stringContaining("Toolbar: no accessible name"));
    expect(warn).toHaveBeenCalledWith(expect.stringContaining("Toolbar.Group: no accessible name"));
    warn.mockClear();
    render(
      <Toolbar aria-label="Named">
        <Toolbar.Group aria-label="Group">
          <Toolbar.Button>A</Toolbar.Button>
        </Toolbar.Group>
      </Toolbar>,
    );
    expect(warn).not.toHaveBeenCalled();
  });

  it("forwards its ref to the toolbar element, and puts className and style on the outermost box", () => {
    // Not scrolling: the toolbar element is the outermost box, so all of it is on one element.
    const ref = createRef<HTMLDivElement>();
    const { unmount } = render(<Bar ref={ref} overflow="visible" className="extra" style={{ color: "red" }} id="bar" data-testid="bar" />);
    const bar = screen.getByTestId("bar");
    expect(ref.current).toBe(bar);
    expect(bar).toHaveClass("extra");
    expect(bar).toHaveAttribute("id", "bar");
    expect(bar.style.color).toBe("red");
    unmount();
    // Scrolling (the default): the frame around the toolbar is the outermost box. A margin or width belongs to it, but the
    // ref, id, test id and aria props stay on the element that is the `toolbar`.
    const scrollRef = createRef<HTMLDivElement>();
    render(<Bar ref={scrollRef} className="extra" style={{ color: "red" }} id="bar" data-testid="bar" />);
    const inner = screen.getByTestId("bar");
    expect(scrollRef.current).toBe(inner);
    expect(inner).toHaveAttribute("id", "bar");
    expect(inner).toHaveAttribute("role", "toolbar");
    expect(inner).not.toHaveClass("extra");
    expect(inner.style.color).toBe("");
    expect(inner.parentElement).toHaveClass("extra", styles.frame!);
    expect(inner.parentElement!.style.color).toBe("red");
  });

  it("scrolls by default, and wraps or lets items spill when asked", () => {
    const { rerender } = render(<Bar data-testid="bar" />);
    expect(screen.getByTestId("bar")).toHaveClass(styles.scroller!);
    expect(screen.getByTestId("bar").parentElement).toHaveClass(styles.frame!);
    rerender(<Bar data-testid="bar" overflow="visible" />);
    expect(screen.getByTestId("bar")).not.toHaveClass(styles.scroller!);
    expect(screen.getByTestId("bar").parentElement).not.toHaveClass(styles.frame!);
  });

  it("does not let props replace its role or orientation", () => {
    render(<Bar {...({ role: "group", "aria-orientation": "vertical" } as object)} />);
    const bar = screen.getByRole("toolbar");
    expect(bar).toHaveAttribute("aria-orientation", "horizontal");
  });

  describe("keyboard", () => {
    it("is one tab stop, and the arrow keys move between items", async () => {
      const user = userEvent.setup();
      render(
        <>
          <button>before</button>
          <Bar />
          <button>after</button>
        </>,
      );
      await user.tab();
      await user.tab();
      expect(screen.getByRole("button", { name: "Bold" })).toHaveFocus();
      await user.keyboard("{ArrowRight}");
      expect(screen.getByRole("button", { name: "Italic" })).toHaveFocus();
      await user.keyboard("{ArrowRight}");
      expect(screen.getByRole("button", { name: "Link" })).toHaveFocus();
      await user.keyboard("{ArrowRight}");
      expect(screen.getByRole("button", { name: "Bold" })).toHaveFocus();
      await user.keyboard("{ArrowLeft}");
      expect(screen.getByRole("button", { name: "Link" })).toHaveFocus();
      await user.keyboard("{Home}");
      expect(screen.getByRole("button", { name: "Bold" })).toHaveFocus();
      await user.keyboard("{End}");
      expect(screen.getByRole("button", { name: "Link" })).toHaveFocus();
      // Tab leaves the toolbar rather than visiting each item
      await user.tab();
      expect(screen.getByRole("button", { name: "after" })).toHaveFocus();
    });

    it("returns to the last focused item when tabbing back in", async () => {
      const user = userEvent.setup();
      render(
        <>
          <button>before</button>
          <Bar />
        </>,
      );
      await user.tab();
      await user.tab();
      await user.keyboard("{ArrowRight}");
      await user.tab({ shift: true });
      expect(screen.getByRole("button", { name: "before" })).toHaveFocus();
      await user.tab();
      expect(screen.getByRole("button", { name: "Italic" })).toHaveFocus();
    });

    it("stops at the ends when loop is false", async () => {
      const user = userEvent.setup();
      render(<Bar loop={false} />);
      await user.tab();
      await user.keyboard("{ArrowLeft}");
      expect(screen.getByRole("button", { name: "Bold" })).toHaveFocus();
      await user.keyboard("{End}{ArrowRight}");
      expect(screen.getByRole("button", { name: "Link" })).toHaveFocus();
    });

    it("moves with up and down in a vertical toolbar, not left and right", async () => {
      const user = userEvent.setup();
      render(<Bar orientation="vertical" />);
      expect(screen.getByRole("toolbar")).toHaveAttribute("aria-orientation", "vertical");
      await user.tab();
      await user.keyboard("{ArrowRight}");
      expect(screen.getByRole("button", { name: "Bold" })).toHaveFocus();
      await user.keyboard("{ArrowDown}");
      expect(screen.getByRole("button", { name: "Italic" })).toHaveFocus();
      await user.keyboard("{ArrowUp}");
      expect(screen.getByRole("button", { name: "Bold" })).toHaveFocus();
    });

    it("reverses left and right with dir='rtl'", async () => {
      const user = userEvent.setup();
      render(<Bar dir="rtl" />);
      await user.tab();
      await user.keyboard("{ArrowLeft}");
      expect(screen.getByRole("button", { name: "Italic" })).toHaveFocus();
      await user.keyboard("{ArrowRight}");
      expect(screen.getByRole("button", { name: "Bold" })).toHaveFocus();
    });

    it("reverses left and right under a DirectionProvider", async () => {
      const user = userEvent.setup();
      render(<DirectionProvider dir="rtl"><Bar /></DirectionProvider>);
      await user.tab();
      await user.keyboard("{ArrowLeft}");
      expect(screen.getByRole("button", { name: "Italic" })).toHaveFocus();
    });

    it("skips a disabled item", async () => {
      const user = userEvent.setup();
      render(
        <Toolbar aria-label="Bar">
          <Toolbar.Button>One</Toolbar.Button>
          <Toolbar.Button disabled>Two</Toolbar.Button>
          <Toolbar.Button>Three</Toolbar.Button>
        </Toolbar>,
      );
      await user.tab();
      await user.keyboard("{ArrowRight}");
      expect(screen.getByRole("button", { name: "Three" })).toHaveFocus();
    });

    it("keeps the toolbar reachable when the item that held the tab stop becomes disabled or loading", async () => {
      const user = userEvent.setup();
      const bar = (disabled: boolean, isLoading: boolean) => (
        <>
          <button>before</button>
          <Toolbar aria-label="Bar">
            <Toolbar.Button disabled={disabled} isLoading={isLoading}>
              One
            </Toolbar.Button>
            <Toolbar.Button>Two</Toolbar.Button>
          </Toolbar>
        </>
      );
      const { rerender } = render(bar(false, false));
      await user.tab();
      await user.tab();
      expect(screen.getByRole("button", { name: "One" })).toHaveFocus();
      await user.tab({ shift: true });
      rerender(bar(true, false));
      await user.tab();
      expect(screen.getByRole("button", { name: "Two" })).toHaveFocus();
      await user.tab({ shift: true });
      rerender(bar(false, true));
      await user.tab();
      expect(screen.getByRole("button", { name: "Two" })).toHaveFocus();
    });

    it("leaves a plain Button out of arrow-key movement", async () => {
      const user = userEvent.setup();
      render(
        <Toolbar aria-label="Bar">
          <Toolbar.Button>One</Toolbar.Button>
          <Button>Plain</Button>
          <Toolbar.Button>Three</Toolbar.Button>
        </Toolbar>,
      );
      await user.tab();
      await user.keyboard("{ArrowRight}");
      expect(screen.getByRole("button", { name: "Three" })).toHaveFocus();
    });
  });

  describe("settings", () => {
    it("gives items the ghost look at the md size by default", () => {
      render(
        <Toolbar aria-label="Bar">
          <Toolbar.Button>Link</Toolbar.Button>
          <Toolbar.IconButton icon={TextBIcon} aria-label="Bold" />
        </Toolbar>,
      );
      expect(screen.getByRole("button", { name: "Link" })).toHaveClass(buttonStyles.variantGhost!, buttonStyles.sizeMd!);
      expect(screen.getByRole("button", { name: "Bold" })).toHaveClass(
        iconButtonStyles.variantGhost!,
        iconButtonStyles.sizeMd!,
      );
    });

    it("hands variant, size and rounded to items, and lets an item's own props win", () => {
      render(
        <Toolbar aria-label="Bar" variant="secondary" size="sm" rounded>
          <Toolbar.Button>Plain</Toolbar.Button>
          <Toolbar.Button variant="primary" size="lg">
            Own
          </Toolbar.Button>
          <Toolbar.IconButton icon={TextBIcon} aria-label="Bold" />
        </Toolbar>,
      );
      const plain = screen.getByRole("button", { name: "Plain" });
      expect(plain).toHaveClass(buttonStyles.variantSecondary!, buttonStyles.sizeSm!, buttonStyles.rounded!);
      const own = screen.getByRole("button", { name: "Own" });
      expect(own).toHaveClass(buttonStyles.variantPrimary!, buttonStyles.sizeLg!);
      expect(screen.getByRole("button", { name: "Bold" })).toHaveClass(
        iconButtonStyles.variantSecondary!,
        iconButtonStyles.sizeSm!,
        iconButtonStyles.rounded!,
      );
    });

    it("draws the bar by surface, on the bar or, while it scrolls, on the frame around it", () => {
      const { rerender } = render(<Bar data-testid="bar" overflow="visible" />);
      expect(screen.getByTestId("bar")).not.toHaveClass(styles.outlined!, styles.filled!);
      rerender(<Bar data-testid="bar" overflow="visible" surface="outlined" />);
      expect(screen.getByTestId("bar")).toHaveClass(styles.outlined!);
      rerender(<Bar data-testid="bar" surface="filled" overflow="wrap" />);
      expect(screen.getByTestId("bar")).toHaveClass(styles.filled!, styles.wrap!);
      rerender(<Bar data-testid="bar" surface="filled" />);
      expect(screen.getByTestId("bar").parentElement).toHaveClass(styles.filled!);
      expect(screen.getByTestId("bar")).not.toHaveClass(styles.filled!);
    });

    it("is as wide as its items unless fullWidth is set", () => {
      const { rerender } = render(<Bar data-testid="bar" overflow="visible" />);
      expect(screen.getByTestId("bar")).not.toHaveClass(styles.fullWidth!);
      rerender(<Bar data-testid="bar" overflow="visible" fullWidth />);
      expect(screen.getByTestId("bar")).toHaveClass(styles.fullWidth!);
      // scrolling: the frame is the box that fills the container
      rerender(<Bar data-testid="bar" fullWidth />);
      expect(screen.getByTestId("bar").parentElement).toHaveClass(styles.fullWidth!);
    });

    it("states where the items sit with align, start by default", () => {
      const { rerender } = render(<Bar data-testid="bar" />);
      expect(screen.getByTestId("bar")).toHaveAttribute("data-align", "start");
      rerender(<Bar data-testid="bar" fullWidth align="end" />);
      expect(screen.getByTestId("bar")).toHaveAttribute("data-align", "end");
    });

    it("disables every item with disabled, and an item stays disabled by itself", () => {
      render(
        <Toolbar aria-label="Bar" disabled>
          <Toolbar.Button>One</Toolbar.Button>
          <Toolbar.IconButton icon={TextBIcon} aria-label="Bold" />
          <Toolbar.Button disabled={false}>Two</Toolbar.Button>
        </Toolbar>,
      );
      for (const button of screen.getAllByRole("button")) expect(button).toBeDisabled();
    });

    it("keeps the settings of an outer ButtonGroup it sits in, and its disabled", () => {
      render(
        <ButtonGroup aria-label="Outer" disabled rounded>
          <Toolbar aria-label="Inner">
            <Toolbar.Button>One</Toolbar.Button>
          </Toolbar>
        </ButtonGroup>,
      );
      const one = screen.getByRole("button", { name: "One" });
      expect(one).toBeDisabled();
      expect(one).toHaveClass(buttonStyles.rounded!);
    });

    it("lets a ButtonGroup inside it keep the toolbar's settings", () => {
      render(
        <Toolbar aria-label="Bar" variant="secondary" disabled>
          <ButtonGroup aria-label="Inner">
            <Button>One</Button>
          </ButtonGroup>
        </Toolbar>,
      );
      const one = screen.getByRole("button", { name: "One" });
      expect(one).toBeDisabled();
      expect(one).toHaveClass(buttonStyles.variantSecondary!);
    });
  });

  describe("parts", () => {
    it("runs an item's click handler, and not a disabled item's", async () => {
      const user = userEvent.setup();
      const onClick = vi.fn();
      render(
        <Toolbar aria-label="Bar">
          <Toolbar.Button onClick={onClick}>Go</Toolbar.Button>
          <Toolbar.Button disabled onClick={onClick}>
            Stop
          </Toolbar.Button>
        </Toolbar>,
      );
      await user.click(screen.getByRole("button", { name: "Go" }));
      await user.click(screen.getByRole("button", { name: "Stop" }));
      expect(onClick).toHaveBeenCalledTimes(1);
    });

    it("makes a toggle of an icon button with pressed, and reports the change", async () => {
      const user = userEvent.setup();
      const onPressedChange = vi.fn();
      render(
        <Toolbar aria-label="Bar">
          <Toolbar.IconButton icon={TextBIcon} aria-label="Bold" defaultPressed onPressedChange={onPressedChange} />
        </Toolbar>,
      );
      const bold = screen.getByRole("button", { name: "Bold" });
      expect(bold).toHaveAttribute("aria-pressed", "true");
      await user.click(bold);
      expect(bold).toHaveAttribute("aria-pressed", "false");
      expect(onPressedChange).toHaveBeenCalledWith(false);
    });

    it("forwards refs from Toolbar.Button and Toolbar.IconButton", () => {
      const buttonRef = createRef<HTMLButtonElement>();
      const iconRef = createRef<HTMLButtonElement>();
      render(
        <Toolbar aria-label="Bar">
          <Toolbar.Button ref={buttonRef}>Go</Toolbar.Button>
          <Toolbar.IconButton ref={iconRef} icon={TextBIcon} aria-label="Bold" />
        </Toolbar>,
      );
      expect(buttonRef.current).toBe(screen.getByRole("button", { name: "Go" }));
      expect(iconRef.current).toBe(screen.getByRole("button", { name: "Bold" }));
    });

    it("puts any other single element in the arrow-key order with Toolbar.Item", async () => {
      const user = userEvent.setup();
      render(
        <Toolbar aria-label="Bar">
          <Toolbar.Button>One</Toolbar.Button>
          <Toolbar.Item>
            <a href="/docs">Docs</a>
          </Toolbar.Item>
        </Toolbar>,
      );
      await user.tab();
      await user.keyboard("{ArrowRight}");
      expect(screen.getByRole("link", { name: "Docs" })).toHaveFocus();
    });

    it("takes a Toolbar.Item out of arrow-key order when it is disabled", async () => {
      const user = userEvent.setup();
      render(
        <Toolbar aria-label="Bar">
          <Toolbar.Button>One</Toolbar.Button>
          <Toolbar.Item disabled>
            <button disabled>Two</button>
          </Toolbar.Item>
          <Toolbar.Button>Three</Toolbar.Button>
        </Toolbar>,
      );
      await user.tab();
      await user.keyboard("{ArrowRight}");
      expect(screen.getByRole("button", { name: "Three" })).toHaveFocus();
    });

    it("works inside a Tooltip trigger", async () => {
      const user = userEvent.setup();
      render(
        <Toolbar aria-label="Bar">
          <Tooltip content="Make it bold">
            <Toolbar.IconButton icon={TextBIcon} aria-label="Bold" />
          </Tooltip>
          <Toolbar.Button>Next</Toolbar.Button>
        </Toolbar>,
      );
      await user.tab();
      expect(screen.getByRole("button", { name: "Bold" })).toHaveFocus();
      await user.keyboard("{ArrowRight}");
      expect(screen.getByRole("button", { name: "Next" })).toHaveFocus();
    });

    it("names a group and keeps its items in the arrow-key order", async () => {
      const user = userEvent.setup();
      render(
        <Toolbar aria-label="Bar">
          <Toolbar.Group aria-label="Style">
            <Toolbar.Button>One</Toolbar.Button>
          </Toolbar.Group>
          <Toolbar.Group aria-label="Other">
            <Toolbar.Button>Two</Toolbar.Button>
          </Toolbar.Group>
        </Toolbar>,
      );
      expect(screen.getByRole("group", { name: "Style" })).toContainElement(screen.getByRole("button", { name: "One" }));
      await user.tab();
      await user.keyboard("{ArrowRight}");
      expect(screen.getByRole("button", { name: "Two" })).toHaveFocus();
    });

    it("does not let props replace a group's role", () => {
      render(
        <Toolbar aria-label="Bar">
          <Toolbar.Group aria-label="Style" {...({ role: "region" } as object)}>
            <Toolbar.Button>One</Toolbar.Button>
          </Toolbar.Group>
        </Toolbar>,
      );
      expect(screen.getByRole("group", { name: "Style" })).toBeInTheDocument();
    });

    it("draws a separator across the bar's direction", () => {
      const { rerender } = render(<Bar />);
      expect(screen.getByRole("separator")).toHaveAttribute("aria-orientation", "vertical");
      expect(screen.getByRole("separator")).toHaveAttribute("data-orientation", "vertical");
      rerender(<Bar orientation="vertical" />);
      // horizontal is the ARIA default, so it is stated only by `data-orientation`
      expect(screen.getByRole("separator")).toHaveAttribute("data-orientation", "horizontal");
    });

    it("does not let props replace a separator's role or orientation", () => {
      const { rerender } = render(
        <Toolbar aria-label="Bar">
          <Toolbar.Separator {...({ role: "presentation", "aria-orientation": "horizontal" } as object)} data-testid="sep" />
        </Toolbar>,
      );
      expect(screen.getByTestId("sep")).toHaveAttribute("role", "separator");
      expect(screen.getByTestId("sep")).toHaveAttribute("aria-orientation", "vertical");
      rerender(
        <Toolbar aria-label="Bar" orientation="vertical">
          <Toolbar.Separator {...({ role: "presentation", "aria-orientation": "vertical" } as object)} data-testid="sep" />
        </Toolbar>,
      );
      expect(screen.getByTestId("sep")).toHaveAttribute("role", "separator");
      expect(screen.getByTestId("sep")).not.toHaveAttribute("aria-orientation");
      expect(screen.getByTestId("sep")).toHaveAttribute("data-orientation", "horizontal");
    });

    it("hides a spacer from assistive tech", () => {
      render(
        <Toolbar aria-label="Bar">
          <Toolbar.Button>One</Toolbar.Button>
          <Toolbar.Spacer data-testid="spacer" />
        </Toolbar>,
      );
      expect(screen.getByTestId("spacer")).toHaveAttribute("aria-hidden", "true");
    });
  });

  describe("items that are not plain buttons", () => {
    it("takes a Select into the arrow-key order, opens it with Enter, and gives focus back when a choice is made", async () => {
      const user = userEvent.setup();
      render(
        <Toolbar aria-label="Bar">
          <Toolbar.Button>One</Toolbar.Button>
          <Toolbar.Item>
            <Select aria-label="Font size" placeholder="Size">
              <Select.Option value="12">12</Select.Option>
              <Select.Option value="14">14</Select.Option>
            </Select>
          </Toolbar.Item>
          <Toolbar.Button>Last</Toolbar.Button>
        </Toolbar>,
      );
      await user.tab();
      await user.keyboard("{ArrowRight}");
      const trigger = screen.getByRole("combobox", { name: "Font size" });
      expect(trigger).toHaveFocus();
      await user.keyboard("{Enter}");
      expect(screen.getByRole("listbox")).toBeInTheDocument();
      await user.keyboard("{ArrowDown}{Enter}");
      expect(trigger).toHaveFocus();
      await user.keyboard("{ArrowRight}");
      expect(screen.getByRole("button", { name: "Last" })).toHaveFocus();
    });

    it("takes a popover trigger into the order, and returns to it when the popover closes", async () => {
      const user = userEvent.setup();
      render(
        <Toolbar aria-label="Bar">
          <Popover>
            <Toolbar.Item>
              <Popover.Trigger asChild>
                <Button variant="ghost">More</Button>
              </Popover.Trigger>
            </Toolbar.Item>
            <Popover.Content aria-label="More options">Extra options</Popover.Content>
          </Popover>
          <Toolbar.Button>Last</Toolbar.Button>
        </Toolbar>,
      );
      await user.tab();
      expect(screen.getByRole("button", { name: "More" })).toHaveFocus();
      await user.keyboard("{Enter}");
      expect(screen.getByText("Extra options")).toBeInTheDocument();
      await user.keyboard("{Escape}");
      expect(screen.getByRole("button", { name: "More" })).toHaveFocus();
      await user.keyboard("{ArrowRight}");
      expect(screen.getByRole("button", { name: "Last" })).toHaveFocus();
    });
  });

  describe("Toolbar.ToggleGroup", () => {
    const Align = (props: Partial<React.ComponentProps<typeof Toolbar.ToggleGroup>> = {}) => (
      <Toolbar.ToggleGroup aria-label="Alignment" defaultValue="left" {...(props as object)}>
        <Toolbar.ToggleItem value="left">Left</Toolbar.ToggleItem>
        <Toolbar.ToggleItem value="center">Centre</Toolbar.ToggleItem>
        <Toolbar.ToggleItem value="right">Right</Toolbar.ToggleItem>
      </Toolbar.ToggleGroup>
    );

    it("keeps the toolbar one tab stop, with the arrow keys running through the group's items", async () => {
      const user = userEvent.setup();
      render(
        <>
          <Toolbar aria-label="Bar">
            <Toolbar.Button>Before</Toolbar.Button>
            <Align />
            <Toolbar.Button>After</Toolbar.Button>
          </Toolbar>
          <button>outside</button>
        </>,
      );
      await user.tab();
      expect(screen.getByRole("button", { name: "Before" })).toHaveFocus();
      // a nested roving group would make its own container a second tab stop: Tab goes straight out of the bar
      await user.tab();
      expect(screen.getByRole("button", { name: "outside" })).toHaveFocus();
      await user.tab({ shift: true });
      expect(screen.getByRole("button", { name: "Before" })).toHaveFocus();
      await user.keyboard("{ArrowRight}");
      expect(screen.getByRole("radio", { name: "Left" })).toHaveFocus();
      await user.keyboard("{ArrowRight}");
      expect(screen.getByRole("radio", { name: "Centre" })).toHaveFocus();
      await user.keyboard("{ArrowRight}{ArrowRight}");
      expect(screen.getByRole("button", { name: "After" })).toHaveFocus();
      await user.tab();
      expect(screen.getByRole("button", { name: "outside" })).toHaveFocus();
    });

    it("is a radiogroup that chooses the item an arrow key lands on, but not one reached from outside", async () => {
      const user = userEvent.setup();
      render(
        <Toolbar aria-label="Bar">
          <Toolbar.Button>Before</Toolbar.Button>
          <Align />
        </Toolbar>,
      );
      expect(screen.getByRole("radiogroup", { name: "Alignment" })).toBeInTheDocument();
      await user.tab();
      await user.keyboard("{ArrowRight}");
      // arrived from the button before the group: nothing is chosen by arriving
      expect(screen.getByRole("radio", { name: "Left" })).toHaveAttribute("aria-checked", "true");
      await user.keyboard("{ArrowRight}");
      expect(screen.getByRole("radio", { name: "Centre" })).toHaveAttribute("aria-checked", "true");
      expect(screen.getByRole("radio", { name: "Left" })).toHaveAttribute("aria-checked", "false");
    });

    it("reports a choice made by click, and a multiple group is a plain group of toggles", async () => {
      const user = userEvent.setup();
      const onValueChange = vi.fn();
      render(
        <Toolbar aria-label="Bar">
          <Toolbar.ToggleGroup aria-label="Style" type="multiple" onValueChange={onValueChange}>
            <Toolbar.ToggleItem value="b" icon={TextBIcon} aria-label="Bold" />
            <Toolbar.ToggleItem value="i" icon={TextItalicIcon} aria-label="Italic" />
          </Toolbar.ToggleGroup>
        </Toolbar>,
      );
      expect(screen.getAllByRole("toolbar")).toHaveLength(1);
      expect(screen.getByRole("group", { name: "Style" })).toBeInTheDocument();
      await user.click(screen.getByRole("button", { name: "Bold" }));
      expect(onValueChange).toHaveBeenCalledWith(["b"]);
      expect(screen.getByRole("button", { name: "Bold" })).toHaveAttribute("aria-pressed", "true");
    });

    it("looks subtle by default, ToggleGroup's own outlined being heavy beside a bar's ghost items, and takes a variant when told", () => {
      render(
        <Toolbar aria-label="Bar">
          <Align data-testid="plain" />
          <Align data-testid="outlined" aria-label="Outlined" variant="outlined" />
        </Toolbar>,
      );
      expect(within(screen.getByTestId("plain")).getAllByRole("radio")[0]).toHaveClass(toggleStyles.variantSubtle!);
      expect(within(screen.getByTestId("outlined")).getAllByRole("radio")[0]).toHaveClass(toggleStyles.variantOutlined!);
    });

    it("takes the bar's size, rounded, orientation and disabled unless it says otherwise", () => {
      render(
        <Toolbar aria-label="Bar" size="lg" rounded orientation="vertical">
          <Align data-testid="group" />
          <Align data-testid="own" size="xs" aria-label="Own" />
        </Toolbar>,
      );
      expect(screen.getByTestId("group")).toHaveAttribute("data-orientation", "vertical");
      expect(screen.getByTestId("group")).toHaveClass(toggleStyles.rounded!);
      const [first, second] = [
        within(screen.getByTestId("group")).getAllByRole("radio")[0]!,
        within(screen.getByTestId("own")).getAllByRole("radio")[0]!,
      ];
      expect(first).toHaveClass(toggleStyles.sizeLg!);
      expect(second).toHaveClass(toggleStyles.sizeXs!);
    });

    it("takes its items out of the arrow-key order when the bar or the group is disabled", async () => {
      const user = userEvent.setup();
      const { rerender } = render(
        <Toolbar aria-label="Bar" disabled>
          <Align />
        </Toolbar>,
      );
      for (const radio of screen.getAllByRole("radio")) expect(radio).toBeDisabled();
      rerender(
        <Toolbar aria-label="Bar">
          <Toolbar.Button>One</Toolbar.Button>
          <Align disabled />
          <Toolbar.Button>Last</Toolbar.Button>
        </Toolbar>,
      );
      await user.tab();
      await user.keyboard("{ArrowRight}");
      expect(screen.getByRole("button", { name: "Last" })).toHaveFocus();
    });
  });

  describe("Toolbar.Group attached", () => {
    it("is a named group of ButtonGroup's, with its items still in the arrow-key order", async () => {
      const user = userEvent.setup();
      render(
        <Toolbar aria-label="Bar" variant="secondary">
          <Toolbar.Group aria-label="Style" attached data-testid="group">
            <Toolbar.IconButton icon={TextBIcon} aria-label="Bold" />
            <Toolbar.IconButton icon={TextItalicIcon} aria-label="Italic" />
          </Toolbar.Group>
          <Toolbar.Button>Link</Toolbar.Button>
        </Toolbar>,
      );
      const group = screen.getByRole("group", { name: "Style" });
      expect(group).toHaveClass(buttonGroupStyles.attached!);
      // the bar's own settings reach the buttons through the group
      expect(screen.getByRole("button", { name: "Bold" })).toHaveClass(iconButtonStyles.variantSecondary!);
      await user.tab();
      expect(screen.getByRole("button", { name: "Bold" })).toHaveFocus();
      await user.keyboard("{ArrowRight}{ArrowRight}");
      expect(screen.getByRole("button", { name: "Link" })).toHaveFocus();
    });

    it("follows the bar's orientation, and is not attached by default", () => {
      render(
        <Toolbar aria-label="Bar" orientation="vertical">
          <Toolbar.Group aria-label="A" attached>
            <Toolbar.Button>One</Toolbar.Button>
          </Toolbar.Group>
          <Toolbar.Group aria-label="B">
            <Toolbar.Button>Two</Toolbar.Button>
          </Toolbar.Group>
        </Toolbar>,
      );
      expect(screen.getByRole("group", { name: "A" })).toHaveAttribute("data-orientation", "vertical");
      expect(screen.getByRole("group", { name: "B" })).not.toHaveClass(buttonGroupStyles.attached!);
    });
  });

  describe("IconButton tooltip in a toolbar", () => {
    it("shows the tooltip on keyboard focus and keeps the arrow keys moving", async () => {
      const user = userEvent.setup();
      render(
        <Toolbar aria-label="Bar">
          <Toolbar.IconButton icon={TextBIcon} aria-label="Bold" tooltip />
          <Toolbar.IconButton icon={TextItalicIcon} aria-label="Italic" tooltip="Make it italic" />
        </Toolbar>,
      );
      await user.tab();
      expect(await screen.findByRole("tooltip")).toHaveTextContent("Bold");
      await user.keyboard("{ArrowRight}");
      expect(screen.getByRole("button", { name: "Italic" })).toHaveFocus();
      expect(await screen.findByText("Make it italic", { selector: '[role="tooltip"]' })).toBeInTheDocument();
    });
  });

  describe("tooltips share one provider", () => {
    const Icons = () => (
      <>
        <Toolbar.IconButton icon={TextBIcon} aria-label="Bold" tooltip />
        <Toolbar.IconButton icon={TextItalicIcon} aria-label="Italic" tooltip />
      </>
    );

    it("opens the next tooltip at once after one has just closed, instead of waiting the full delay again", async () => {
      const user = userEvent.setup();
      render(
        <Toolbar aria-label="Bar">
          <Icons />
        </Toolbar>,
      );
      await user.hover(screen.getByRole("button", { name: "Bold" }));
      expect(await screen.findByRole("tooltip", {}, { timeout: 1500 })).toHaveTextContent("Bold");
      // closing one starts the provider's skip window, in which the next opens without its delay
      await user.keyboard("{Escape}");
      await waitFor(() => expect(screen.queryByRole("tooltip")).toBeNull());
      await user.hover(screen.getByRole("button", { name: "Italic" }));
      // far sooner than the 700ms a standalone tooltip waits
      await waitFor(() => expect(screen.getByRole("tooltip")).toHaveTextContent("Italic"), { timeout: 250 });
    });

    it("leaves an app's own TooltipProvider in charge when there is one", async () => {
      const user = userEvent.setup();
      render(
        <TooltipProvider delayDuration={0}>
          <Toolbar aria-label="Bar">
            <Icons />
          </Toolbar>
        </TooltipProvider>,
      );
      await user.hover(screen.getByRole("button", { name: "Bold" }));
      // the app's zero delay applies; a nested provider with the default would make this wait 700ms
      await waitFor(() => expect(screen.getByRole("tooltip")).toHaveTextContent("Bold"), { timeout: 250 });
    });
  });

  describe("overflow", () => {
    it("scroll: wraps the bar in a frame with the surface, and the bar is the scroller", () => {
      render(<Bar overflow="scroll" surface="outlined" data-testid="bar" />);
      const bar = screen.getByTestId("bar");
      const frame = bar.parentElement!;
      expect(frame).toHaveClass(styles.frame!, styles.outlined!);
      expect(bar).toHaveClass(styles.scroller!);
      expect(bar).not.toHaveClass(styles.outlined!);
      expect(frame).toHaveAttribute("data-overflow-start", "false");
      expect(frame).toHaveAttribute("data-overflow-end", "false");
    });

    it("scroll: the buttons are for a pointer — out of the tab order and hidden from assistive tech", async () => {
      const user = userEvent.setup();
      render(
        <>
          <button>before</button>
          <Bar overflow="scroll" data-testid="bar" />
          <button>after</button>
        </>,
      );
      const frame = screen.getByTestId("bar").parentElement!;
      const scrollButtons = [...frame.querySelectorAll(":scope > button")];
      expect(scrollButtons).toHaveLength(2);
      for (const button of scrollButtons) {
        expect(button).toHaveAttribute("aria-hidden", "true");
        expect(button).toHaveAttribute("tabindex", "-1");
      }
      await user.tab();
      await user.tab();
      expect(screen.getByRole("button", { name: "Bold" })).toHaveFocus();
      await user.tab();
      expect(screen.getByRole("button", { name: "after" })).toHaveFocus();
    });

    it("scroll: shows the end that has more, and the button scrolls the bar that way (reversed in rtl)", async () => {
      const user = userEvent.setup();
      const rects = new Map<Element, DOMRect>();
      const rect = (left: number, right: number) => ({ left, right, top: 0, bottom: 20, width: right - left, height: 20, x: left, y: 0 }) as DOMRect;
      vi.spyOn(Element.prototype, "getBoundingClientRect").mockImplementation(function (this: Element) {
        return rects.get(this) ?? rect(0, 0);
      });
      const scrollBy = vi.fn();
      const { rerender } = render(<Bar overflow="scroll" data-testid="bar" />);
      const bar = screen.getByTestId("bar");
      Object.defineProperty(bar, "scrollBy", { value: scrollBy, configurable: true });
      Object.defineProperty(bar, "clientWidth", { value: 200, configurable: true });
      rects.set(bar, rect(0, 200));
      rects.set(bar.firstElementChild!, rect(0, 40));
      rects.set(bar.lastElementChild!, rect(300, 360));
      // a change the observers watch makes it re-read
      rerender(
        <Bar overflow="scroll" data-testid="bar">
          <Toolbar.Button>Extra</Toolbar.Button>
        </Bar>,
      );
      const frame = bar.parentElement!;
      await waitFor(() => expect(frame).toHaveAttribute("data-overflow-end", "true"));
      expect(frame).toHaveAttribute("data-overflow-start", "false");
      await user.click(frame.querySelectorAll(":scope > button")[1]!);
      expect(scrollBy).toHaveBeenCalledWith(expect.objectContaining({ left: 150 }));
      rerender(
        <Bar overflow="scroll" data-testid="bar" dir="rtl">
          <Toolbar.Button>Extra</Toolbar.Button>
        </Bar>,
      );
      await user.click(frame.querySelectorAll(":scope > button")[1]!);
      expect(scrollBy).toHaveBeenLastCalledWith(expect.objectContaining({ left: -150 }));
    });

    it("is a plain bar, not a scroller, for visible and wrap", () => {
      const { rerender } = render(<Bar data-testid="bar" overflow="wrap" />);
      expect(screen.getByTestId("bar").parentElement).toBe(document.body.firstElementChild);
      expect(screen.getByTestId("bar")).not.toHaveClass(styles.scroller!);
      rerender(<Bar data-testid="bar" overflow="visible" />);
      expect(screen.getByTestId("bar")).not.toHaveClass(styles.wrap!);
    });
  });

  describe("sticky", () => {
    it("composes Affix: a surface and the marker in front, stuck state on the bar itself", () => {
      render(<Bar sticky overflow="visible" data-testid="bar" />);
      const bar = screen.getByTestId("bar");
      expect(bar).toHaveClass(styles.sticky!);
      expect(bar.previousElementSibling).not.toBeNull();
      expect(screen.getByRole("toolbar")).toBe(bar);
    });

    it("sticks the frame, not the inner bar, when it also scrolls", () => {
      render(<Bar sticky overflow="scroll" surface="outlined" data-testid="bar" />);
      const bar = screen.getByTestId("bar");
      expect(bar.parentElement).toHaveClass(styles.sticky!, styles.frame!);
      expect(bar).not.toHaveClass(styles.sticky!);
    });
  });

  it("survives StrictMode", async () => {
    const user = userEvent.setup();
    render(
      <StrictMode>
        <Bar />
      </StrictMode>,
    );
    await user.tab();
    await user.keyboard("{ArrowRight}");
    expect(screen.getByRole("button", { name: "Italic" })).toHaveFocus();
  });

  describe("accessibility", () => {
    it("has no axe violations", async () => {
      const { container } = render(
        <Toolbar aria-label="Editor">
          <Toolbar.Group aria-label="Style">
            <Toolbar.IconButton icon={TextBIcon} aria-label="Bold" defaultPressed />
            <Toolbar.IconButton icon={TextItalicIcon} aria-label="Italic" />
          </Toolbar.Group>
          <Toolbar.Separator />
          <Toolbar.Button>Link</Toolbar.Button>
          <Toolbar.Spacer />
          <Toolbar.Button disabled>Save</Toolbar.Button>
        </Toolbar>,
      );
      expect(await axe(container)).toHaveNoViolations();
    });

    it("has no axe violations when vertical, disabled, or with a link item", async () => {
      const { container } = render(
        <>
          <Bar orientation="vertical" surface="outlined" />
          <Bar disabled surface="filled" />
          <Toolbar aria-label="Links">
            <Toolbar.Item>
              <a href="/docs">Docs</a>
            </Toolbar.Item>
          </Toolbar>
        </>,
      );
      expect(await axe(container)).toHaveNoViolations();
    });
  });
});

describe("Toolbar overflow menu", () => {
  // jsdom lays nothing out, so the bar's width and each part's width are given: every part is 100px wide, and the bar
  // is as wide as the test says.
  let barWidth = 1000;
  beforeEach(() => {
    barWidth = 1000;
    vi.spyOn(HTMLElement.prototype, "clientWidth", "get").mockImplementation(function (this: HTMLElement) {
      return this.getAttribute("role") === "toolbar" ? barWidth : 0;
    });
    vi.spyOn(HTMLElement.prototype, "getBoundingClientRect").mockImplementation(function (this: HTMLElement) {
      const sized = this.hasAttribute("data-toolbar-part") || this.hasAttribute("data-toolbar-overflow");
      // a separator is a thin line
      const width = this.getAttribute("data-toolbar-part") === "separator" ? 1 : 100;
      return { width: sized ? width : 0, height: 0, top: 0, left: 0, right: 0, bottom: 0, x: 0, y: 0, toJSON: () => ({}) };
    });
  });

  // A part that is hidden has no accessible name to a query (it is `display: none`), so they are found by their text.
  const more = () => screen.getByLabelText("More actions");
  const item = (name: string) => screen.getByText(name).closest("button") as HTMLElement;
  const hidden = (name: string) => item(name).hasAttribute("data-overflowed");

  function MenuBar({ children, ...props }: Partial<React.ComponentProps<typeof Toolbar>>) {
    return (
      <Toolbar aria-label="Actions" overflow="menu" {...props}>
        {children}
      </Toolbar>
    );
  }

  it("shows every item and hides the more button while they fit", () => {
    render(
      <MenuBar>
        <Toolbar.Button>One</Toolbar.Button>
        <Toolbar.Button>Two</Toolbar.Button>
      </MenuBar>,
    );
    expect(hidden("One")).toBe(false);
    expect(hidden("Two")).toBe(false);
    expect(more()).toHaveAttribute("data-overflowed");
  });

  it("moves items from the end into the menu when they don't fit, and shows the more button", () => {
    barWidth = 350;
    render(
      <MenuBar>
        <Toolbar.Button>One</Toolbar.Button>
        <Toolbar.Button>Two</Toolbar.Button>
        <Toolbar.Button>Three</Toolbar.Button>
        <Toolbar.Button>Four</Toolbar.Button>
      </MenuBar>,
    );
    expect(hidden("One")).toBe(false);
    expect(hidden("Two")).toBe(false);
    expect(hidden("Three")).toBe(true);
    expect(hidden("Four")).toBe(true);
    expect(more()).not.toHaveAttribute("data-overflowed");
  });

  it("lists the hidden items in the menu, and choosing one presses the real item", async () => {
    barWidth = 250;
    const user = userEvent.setup();
    const onThree = vi.fn();
    render(
      <MenuBar>
        <Toolbar.Button>One</Toolbar.Button>
        <Toolbar.Button>Two</Toolbar.Button>
        <Toolbar.Button onClick={onThree}>Three</Toolbar.Button>
      </MenuBar>,
    );
    await user.click(more());
    const menu = await screen.findByRole("menu");
    expect(within(menu).getAllByRole("menuitem").map((item) => item.textContent)).toEqual(["Two", "Three"]);
    await user.click(within(menu).getByRole("menuitem", { name: "Three" }));
    expect(onThree).toHaveBeenCalledTimes(1);
  });

  it("keeps a pinned item and an arbitrary Toolbar.Item on the bar", () => {
    barWidth = 250;
    render(
      <MenuBar>
        <Toolbar.Button>One</Toolbar.Button>
        <Toolbar.Button pinned>Two</Toolbar.Button>
        <Toolbar.Item>
          <button type="button">Plain</button>
        </Toolbar.Item>
      </MenuBar>,
    );
    expect(hidden("One")).toBe(true);
    expect(hidden("Two")).toBe(false);
    expect(item("Plain")).not.toHaveAttribute("data-overflowed");
  });

  it("draws a pressed icon button as a checkbox item and a toggle group as a radio group", async () => {
    barWidth = 120;
    const user = userEvent.setup();
    const onBold = vi.fn();
    render(
      <MenuBar>
        <Toolbar.Button pinned>Keep</Toolbar.Button>
        <Toolbar.IconButton icon={CopyIcon} aria-label="Bold" pressed onClick={onBold} />
        <Toolbar.ToggleGroup type="single" aria-label="Alignment" defaultValue="left">
          <Toolbar.ToggleItem value="left" aria-label="Left" />
          <Toolbar.ToggleItem value="right" aria-label="Right" />
        </Toolbar.ToggleGroup>
      </MenuBar>,
    );
    await user.click(more());
    const menu = await screen.findByRole("menu");
    const bold = within(menu).getByRole("menuitemcheckbox", { name: "Bold" });
    expect(bold).toHaveAttribute("aria-checked", "true");
    expect(within(menu).getByRole("menuitemradio", { name: "Left" })).toHaveAttribute("aria-checked", "true");
    await user.click(within(menu).getByRole("menuitemradio", { name: "Right" }));
    await waitFor(() =>
      expect(screen.getByLabelText("Right")).toHaveAttribute("data-state", "on"),
    );
    await user.click(bold);
    expect(onBold).toHaveBeenCalled();
  });

  it("names a group in the menu after its label", async () => {
    barWidth = 120;
    const user = userEvent.setup();
    render(
      <MenuBar>
        <Toolbar.Button pinned>Keep</Toolbar.Button>
        <Toolbar.Group aria-label="Style">
          <Toolbar.Button>Bold</Toolbar.Button>
          <Toolbar.Button>Italic</Toolbar.Button>
        </Toolbar.Group>
      </MenuBar>,
    );
    await user.click(more());
    const menu = await screen.findByRole("menu");
    await waitFor(() => expect(within(menu).getByRole("group", { name: "Style" })).toBeInTheDocument());
    expect(within(menu).getAllByRole("menuitem").map((item) => item.textContent)).toEqual(["Bold", "Italic"]);
  });

  it("keeps a separator between shown items and before the more button, and hides one with nothing shown after it", () => {
    barWidth = 350;
    render(
      <MenuBar>
        <Toolbar.Button>One</Toolbar.Button>
        <Toolbar.Separator data-testid="between" />
        <Toolbar.Button>Two</Toolbar.Button>
        <Toolbar.Separator data-testid="before-more" />
        <Toolbar.Button>Three</Toolbar.Button>
        <Toolbar.Separator data-testid="after-hidden" />
        <Toolbar.Button>Four</Toolbar.Button>
      </MenuBar>,
    );
    expect(hidden("Three")).toBe(true);
    expect(hidden("Four")).toBe(true);
    // separates "Two" from the more button
    expect(screen.getByTestId("between")).not.toHaveAttribute("data-overflowed");
    expect(screen.getByTestId("before-more")).not.toHaveAttribute("data-overflowed");
    // two separators in a row would draw a double line; the second goes
    expect(screen.getByTestId("after-hidden")).toHaveAttribute("data-overflowed");
  });

  it("does not take an item from a person who is on it", () => {
    barWidth = 250;
    const { rerender } = render(
      <MenuBar>
        <Toolbar.Button>One</Toolbar.Button>
        <Toolbar.Button>Two</Toolbar.Button>
        <Toolbar.Button>Three</Toolbar.Button>
      </MenuBar>,
    );
    expect(hidden("Three")).toBe(true);
    item("Three").removeAttribute("data-overflowed");
    item("Three").focus();
    rerender(
      <MenuBar>
        <Toolbar.Button>One</Toolbar.Button>
        <Toolbar.Button>Two</Toolbar.Button>
        <Toolbar.Button>Three</Toolbar.Button>
      </MenuBar>,
    );
    expect(hidden("Three")).toBe(false);
    expect(hidden("Two")).toBe(true);
  });

  it("takes the more button's name from labels", () => {
    render(
      <MenuBar labels={{ overflow: "Weitere Aktionen" }}>
        <Toolbar.Button>One</Toolbar.Button>
      </MenuBar>,
    );
    expect(screen.getByLabelText("Weitere Aktionen")).toBeInTheDocument();
  });

  it("falls back to scrolling for a vertical bar, with a development warning", () => {
    const warn = vi.spyOn(console, "warn").mockImplementation(() => undefined);
    render(
      <MenuBar orientation="vertical" aria-label="Column">
        <Toolbar.Button>One</Toolbar.Button>
      </MenuBar>,
    );
    expect(warn).toHaveBeenCalledWith(expect.stringContaining('overflow="menu" is for a horizontal bar'));
    expect(screen.queryByLabelText("More actions")).not.toBeInTheDocument();
  });

  it("has no axe violations with the menu open", async () => {
    barWidth = 120;
    const user = userEvent.setup();
    render(
      <MenuBar>
        <Toolbar.Button pinned>Keep</Toolbar.Button>
        <Toolbar.IconButton icon={CopyIcon} aria-label="Copy" />
        <Toolbar.Button>Share</Toolbar.Button>
      </MenuBar>,
    );
    await user.click(more());
    await screen.findByRole("menu");
    expect((await axe(document.body, { rules: { region: { enabled: false } } })).violations).toHaveLength(0);
  });
});
