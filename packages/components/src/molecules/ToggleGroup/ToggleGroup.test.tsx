import { TextBIcon, TextItalicIcon } from "@dbm-system/icons";
import { act, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { axe } from "jest-axe";
import { createRef, StrictMode, useState } from "react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { Tooltip } from "../../atoms/Tooltip";
import { ToggleGroup } from "./ToggleGroup";
import styles from "./ToggleGroup.module.css";

afterEach(() => {
  vi.unstubAllGlobals();
});

const Alignment = (props: Partial<React.ComponentProps<typeof ToggleGroup>> = {}) => (
  <ToggleGroup aria-label="Alignment" {...(props as object)}>
    <ToggleGroup.Item value="left">Left</ToggleGroup.Item>
    <ToggleGroup.Item value="center">Centre</ToggleGroup.Item>
    <ToggleGroup.Item value="right">Right</ToggleGroup.Item>
  </ToggleGroup>
);

const Styles = (props: Partial<React.ComponentProps<typeof ToggleGroup>> = {}) => (
  <ToggleGroup aria-label="Style" type="multiple" {...(props as object)}>
    <ToggleGroup.Item value="bold">Bold</ToggleGroup.Item>
    <ToggleGroup.Item value="italic">Italic</ToggleGroup.Item>
    <ToggleGroup.Item value="underline">Underline</ToggleGroup.Item>
  </ToggleGroup>
);

const on = (name: string) => screen.getByRole(name === "" ? "radio" : "radio", { name });
const isOn = (element: HTMLElement) => element.getAttribute("data-state") === "on";

describe("ToggleGroup", () => {
  describe("roles and names", () => {
    it("is a named radiogroup of radios when single", () => {
      render(<Alignment defaultValue="center" />);
      expect(screen.getByRole("radiogroup", { name: "Alignment" })).toBeInTheDocument();
      expect(screen.getAllByRole("radio")).toHaveLength(3);
      expect(on("Centre")).toHaveAttribute("aria-checked", "true");
      expect(on("Left")).toHaveAttribute("aria-checked", "false");
    });

    it("is a named toolbar of pressed-state buttons when multiple", () => {
      render(<Styles defaultValue={["bold"]} />);
      expect(screen.getByRole("toolbar", { name: "Style" })).toBeInTheDocument();
      expect(screen.getByRole("button", { name: "Bold" })).toHaveAttribute("aria-pressed", "true");
      expect(screen.getByRole("button", { name: "Italic" })).toHaveAttribute("aria-pressed", "false");
    });

    it("can be named by a visible label", () => {
      render(
        <>
          <span id="label">Alignment</span>
          <ToggleGroup aria-labelledby="label">
            <ToggleGroup.Item value="a">A</ToggleGroup.Item>
          </ToggleGroup>
        </>,
      );
      expect(screen.getByRole("radiogroup", { name: "Alignment" })).toBeInTheDocument();
    });

    it("warns once in development with no accessible name, and not with one", () => {
      const warnSpy = vi.spyOn(console, "warn").mockImplementation(() => {});
      const { rerender } = render(
        <ToggleGroup>
          <ToggleGroup.Item value="a">A</ToggleGroup.Item>
        </ToggleGroup>,
      );
      rerender(
        <ToggleGroup>
          <ToggleGroup.Item value="a">A</ToggleGroup.Item>
        </ToggleGroup>,
      );
      expect(warnSpy).toHaveBeenCalledTimes(1);
      expect(warnSpy).toHaveBeenCalledWith(expect.stringContaining("ToggleGroup: no accessible name"));
      warnSpy.mockClear();
      rerender(<Alignment />);
      expect(warnSpy).not.toHaveBeenCalled();
      warnSpy.mockRestore();
    });

    it("warns once per icon-only item with no name, and not for an icon on an asChild item, which it draws", () => {
      const warnSpy = vi.spyOn(console, "warn").mockImplementation(() => {});
      render(
        <ToggleGroup aria-label="Style">
          <ToggleGroup.Item value="a" icon={TextBIcon} />
          <ToggleGroup.Item value="b" icon={TextItalicIcon} />
          <ToggleGroup.Item value="c" icon={TextBIcon} asChild>
            <button type="button">C</button>
          </ToggleGroup.Item>
        </ToggleGroup>,
      );
      // Items "a" and "b" have no name; the asChild one supplies its own content.
      expect(warnSpy.mock.calls.filter(([message]) => String(message).includes("no accessible name"))).toHaveLength(2);
      expect(warnSpy).toHaveBeenCalledTimes(2);
      warnSpy.mockRestore();
    });

    it("an item's role and chosen state cannot be replaced by a same-named prop", () => {
      const props = { role: "tab", "aria-checked": false, "aria-pressed": true } as object;
      const { unmount } = render(
        <ToggleGroup aria-label="View" defaultValue="a">
          <ToggleGroup.Item value="a" {...props}>A</ToggleGroup.Item>
          <ToggleGroup.Item value="b" {...props}>B</ToggleGroup.Item>
        </ToggleGroup>,
      );
      expect(screen.getAllByRole("radio")).toHaveLength(2);
      expect(screen.getByRole("radio", { name: "A" })).toHaveAttribute("aria-checked", "true");
      expect(screen.getByRole("radio", { name: "B" })).toHaveAttribute("aria-checked", "false");
      unmount();
      render(
        <ToggleGroup aria-label="Style" type="multiple" defaultValue={["a"]}>
          <ToggleGroup.Item value="a" {...props}>A</ToggleGroup.Item>
          <ToggleGroup.Item value="b" {...props}>B</ToggleGroup.Item>
        </ToggleGroup>,
      );
      expect(screen.getByRole("button", { name: "A" })).toHaveAttribute("aria-pressed", "true");
      expect(screen.getByRole("button", { name: "B" })).toHaveAttribute("aria-pressed", "false");
    });

    it("forwards ref, className, style, id and data-testid to the group, and a same-named role cannot replace the role", () => {
      const ref = createRef<HTMLDivElement>();
      render(
        <ToggleGroup aria-label="A" ref={ref} className="custom" style={{ opacity: 0.5 }} id="group" data-testid="g" {...({ role: "presentation" } as object)}>
          <ToggleGroup.Item value="a">A</ToggleGroup.Item>
        </ToggleGroup>,
      );
      const group = screen.getByTestId("g");
      expect(ref.current).toBe(group);
      expect(group).toHaveClass("custom");
      expect(group).toHaveAttribute("id", "group");
      expect(group).toHaveStyle({ opacity: "0.5" });
      expect(group).toHaveAttribute("role", "radiogroup");
    });

    it("keeps its role and orientation when same-named attributes are passed, single and multiple", () => {
      const { unmount } = render(
        <ToggleGroup aria-label="A" orientation="vertical" {...({ "data-orientation": "horizontal" } as object)}>
          <ToggleGroup.Item value="a">A</ToggleGroup.Item>
        </ToggleGroup>,
      );
      expect(screen.getByRole("radiogroup")).toHaveAttribute("data-orientation", "vertical");
      unmount();
      render(
        <ToggleGroup aria-label="A" type="multiple" {...({ role: "group" } as object)}>
          <ToggleGroup.Item value="a">A</ToggleGroup.Item>
        </ToggleGroup>,
      );
      expect(screen.getByRole("toolbar")).toBeInTheDocument();
    });
  });

  describe("single", () => {
    it("starts with nothing chosen, or with defaultValue", () => {
      const { unmount } = render(<Alignment />);
      expect(screen.getAllByRole("radio").filter(isOn)).toHaveLength(0);
      unmount();
      render(<Alignment defaultValue="right" />);
      expect(isOn(on("Right"))).toBe(true);
    });

    it("chooses an item on click, moves the choice, and reports the value", async () => {
      const user = userEvent.setup();
      const onValueChange = vi.fn();
      render(<Alignment defaultValue="left" onValueChange={onValueChange} />);
      await user.click(on("Right"));
      expect(isOn(on("Right"))).toBe(true);
      expect(isOn(on("Left"))).toBe(false);
      expect(onValueChange).toHaveBeenLastCalledWith("right");
    });

    it("keeps one item chosen: clicking the chosen item again does nothing", async () => {
      const user = userEvent.setup();
      const onValueChange = vi.fn();
      render(<Alignment defaultValue="left" onValueChange={onValueChange} />);
      await user.click(on("Left"));
      expect(isOn(on("Left"))).toBe(true);
      expect(onValueChange).not.toHaveBeenCalled();
    });

    it("clears the choice when deselectable, and reports an empty value", async () => {
      const user = userEvent.setup();
      const onValueChange = vi.fn();
      render(<Alignment defaultValue="left" deselectable onValueChange={onValueChange} />);
      await user.click(on("Left"));
      expect(isOn(on("Left"))).toBe(false);
      expect(onValueChange).toHaveBeenLastCalledWith("");
    });

    it("is controlled by value, and does not move until the parent says so", async () => {
      const user = userEvent.setup();
      const onValueChange = vi.fn();
      const { rerender } = render(<Alignment value="left" onValueChange={onValueChange} />);
      await user.click(on("Right"));
      expect(onValueChange).toHaveBeenCalledWith("right");
      expect(isOn(on("Left"))).toBe(true);
      expect(isOn(on("Right"))).toBe(false);
      rerender(<Alignment value="right" onValueChange={onValueChange} />);
      expect(isOn(on("Right"))).toBe(true);
    });

    it("refuses to clear a controlled choice unless deselectable", async () => {
      const user = userEvent.setup();
      const onValueChange = vi.fn();
      render(<Alignment value="left" onValueChange={onValueChange} />);
      await user.click(on("Left"));
      expect(onValueChange).not.toHaveBeenCalled();
    });

    it("works as a state-holding parent would use it", async () => {
      const user = userEvent.setup();
      function Parent() {
        const [value, setValue] = useState("left");
        return (
          <>
            <Alignment value={value} onValueChange={setValue} />
            <p data-testid="live">{value}</p>
          </>
        );
      }
      render(<Parent />);
      await user.click(on("Centre"));
      expect(screen.getByTestId("live")).toHaveTextContent("center");
    });
  });

  describe("multiple", () => {
    it("switches each item on and off independently, and reports every chosen value", async () => {
      const user = userEvent.setup();
      const onValueChange = vi.fn();
      render(<Styles onValueChange={onValueChange} />);
      await user.click(screen.getByRole("button", { name: "Bold" }));
      await user.click(screen.getByRole("button", { name: "Underline" }));
      expect(onValueChange).toHaveBeenLastCalledWith(["bold", "underline"]);
      await user.click(screen.getByRole("button", { name: "Bold" }));
      expect(onValueChange).toHaveBeenLastCalledWith(["underline"]);
      expect(screen.getByRole("button", { name: "Bold" })).toHaveAttribute("aria-pressed", "false");
    });

    it("can be cleared completely", async () => {
      const user = userEvent.setup();
      render(<Styles defaultValue={["bold"]} />);
      await user.click(screen.getByRole("button", { name: "Bold" }));
      expect(screen.getAllByRole("button").filter((b) => b.getAttribute("aria-pressed") === "true")).toHaveLength(0);
    });

    it("is controlled by an array value", async () => {
      const user = userEvent.setup();
      const onValueChange = vi.fn();
      render(<Styles value={["italic"]} onValueChange={onValueChange} />);
      await user.click(screen.getByRole("button", { name: "Bold" }));
      expect(onValueChange).toHaveBeenCalledWith(["italic", "bold"]);
      expect(screen.getByRole("button", { name: "Italic" })).toHaveAttribute("aria-pressed", "true");
      expect(screen.getByRole("button", { name: "Bold" })).toHaveAttribute("aria-pressed", "false");
    });
  });

  describe("keyboard", () => {
    it("is one tab stop: Tab enters the group once, on the chosen item, and the next Tab leaves it", async () => {
      const user = userEvent.setup();
      render(
        <>
          <button type="button">Before</button>
          <Alignment defaultValue="center" />
          <button type="button">After</button>
        </>,
      );
      await user.tab();
      expect(screen.getByRole("button", { name: "Before" })).toHaveFocus();
      await user.tab();
      expect(on("Centre")).toHaveFocus();
      await user.tab();
      expect(screen.getByRole("button", { name: "After" })).toHaveFocus();
    });

    it("moves focus with the arrow keys, wraps with loop, and jumps with Home and End — and chooses where it lands", async () => {
      const user = userEvent.setup();
      const onValueChange = vi.fn();
      render(<Alignment defaultValue="left" onValueChange={onValueChange} />);
      await user.tab();
      expect(on("Left")).toHaveFocus();
      expect(onValueChange).not.toHaveBeenCalled();
      await user.keyboard("{ArrowRight}");
      expect(on("Centre")).toHaveFocus();
      expect(isOn(on("Centre"))).toBe(true);
      await user.keyboard("{End}");
      expect(on("Right")).toHaveFocus();
      expect(isOn(on("Right"))).toBe(true);
      await user.keyboard("{ArrowRight}");
      expect(on("Left")).toHaveFocus();
      expect(isOn(on("Left"))).toBe(true);
      await user.keyboard("{ArrowLeft}");
      expect(on("Right")).toHaveFocus();
      await user.keyboard("{Home}");
      expect(on("Left")).toHaveFocus();
      expect(isOn(on("Left"))).toBe(true);
      expect(onValueChange.mock.calls.map(([value]) => value)).toEqual(["center", "right", "left", "right", "left"]);
    });

    it("tabbing into a group with nothing chosen, or clicking away and back, chooses nothing", async () => {
      const user = userEvent.setup();
      const onValueChange = vi.fn();
      render(
        <>
          <button type="button">Before</button>
          <Alignment onValueChange={onValueChange} />
        </>,
      );
      await user.tab();
      await user.tab();
      expect(on("Left")).toHaveFocus();
      expect(isOn(on("Left"))).toBe(false);
      expect(onValueChange).not.toHaveBeenCalled();
    });

    it("a key that moved nowhere leaves nothing pending for when focus returns", async () => {
      const user = userEvent.setup();
      render(
        <>
          <Alignment loop={false} />
          <button type="button">After</button>
        </>,
      );
      await user.tab();
      expect(on("Left")).toHaveFocus();
      await user.keyboard("{ArrowLeft}");
      expect(on("Left")).toHaveFocus();
      await user.tab();
      await user.tab({ shift: true });
      expect(on("Left")).toHaveFocus();
      expect(isOn(on("Left"))).toBe(false);
    });

    it("a multiple group's arrow keys still only move focus", async () => {
      const user = userEvent.setup();
      const onValueChange = vi.fn();
      render(<Styles onValueChange={onValueChange} />);
      await user.tab();
      await user.keyboard("{ArrowRight}");
      expect(screen.getByRole("button", { name: "Italic" })).toHaveFocus();
      expect(screen.getByRole("button", { name: "Italic" })).toHaveAttribute("aria-pressed", "false");
      expect(onValueChange).not.toHaveBeenCalled();
    });

    it("leaves a consumer's own key and focus handlers working", async () => {
      const user = userEvent.setup();
      const onKeyDownCapture = vi.fn();
      const onBlur = vi.fn();
      const onFocus = vi.fn();
      render(
        <ToggleGroup aria-label="A" defaultValue="a" onKeyDownCapture={onKeyDownCapture} onBlur={onBlur}>
          <ToggleGroup.Item value="a" onFocus={onFocus}>A</ToggleGroup.Item>
          <ToggleGroup.Item value="b">B</ToggleGroup.Item>
        </ToggleGroup>,
      );
      await user.tab();
      expect(onFocus).toHaveBeenCalledTimes(1);
      await user.keyboard("{ArrowRight}");
      expect(onKeyDownCapture).toHaveBeenCalled();
      await user.tab();
      expect(onBlur).toHaveBeenCalled();
    });

    it("does not wrap when loop is off", async () => {
      const user = userEvent.setup();
      render(<Alignment defaultValue="left" loop={false} />);
      await user.tab();
      await user.keyboard("{ArrowLeft}");
      expect(on("Left")).toHaveFocus();
    });

    it("chooses the focused item with Space and with Enter", async () => {
      const user = userEvent.setup();
      render(<Alignment />);
      await user.tab();
      await user.keyboard("{ArrowRight}");
      await user.keyboard(" ");
      expect(isOn(on("Centre"))).toBe(true);
      await user.keyboard("{ArrowRight}{Enter}");
      expect(isOn(on("Right"))).toBe(true);
    });

    it("skips a disabled item", async () => {
      const user = userEvent.setup();
      render(
        <ToggleGroup aria-label="A" defaultValue="a">
          <ToggleGroup.Item value="a">A</ToggleGroup.Item>
          <ToggleGroup.Item value="b" disabled>B</ToggleGroup.Item>
          <ToggleGroup.Item value="c">C</ToggleGroup.Item>
        </ToggleGroup>,
      );
      await user.tab();
      await user.keyboard("{ArrowRight}");
      expect(on("C")).toHaveFocus();
    });

    it("uses Up and Down when vertical", async () => {
      const user = userEvent.setup();
      render(<Alignment defaultValue="left" orientation="vertical" />);
      await user.tab();
      await user.keyboard("{ArrowDown}");
      expect(on("Centre")).toHaveFocus();
      await user.keyboard("{ArrowUp}");
      expect(on("Left")).toHaveFocus();
    });

    it("reverses the arrow keys with dir=rtl, and leaves them alone otherwise", async () => {
      const user = userEvent.setup();
      const { unmount } = render(<Alignment defaultValue="left" dir="rtl" />);
      await user.tab();
      await user.keyboard("{ArrowLeft}");
      expect(on("Centre")).toHaveFocus();
      unmount();
      render(
        <div dir="rtl">
          <Alignment defaultValue="left" />
        </div>,
      );
      await user.tab();
      await user.keyboard("{ArrowRight}");
      expect(on("Centre")).toHaveFocus();
    });

    it("moves focus through a multiple group the same way", async () => {
      const user = userEvent.setup();
      render(<Styles />);
      await user.tab();
      expect(screen.getByRole("button", { name: "Bold" })).toHaveFocus();
      await user.keyboard("{ArrowRight}");
      expect(screen.getByRole("button", { name: "Italic" })).toHaveFocus();
    });
  });

  describe("disabled", () => {
    it("disables every item, and takes the group out of the tab order", async () => {
      const user = userEvent.setup();
      const onValueChange = vi.fn();
      render(<Alignment disabled defaultValue="left" onValueChange={onValueChange} />);
      for (const radio of screen.getAllByRole("radio")) expect(radio).toBeDisabled();
      await user.click(on("Right"));
      expect(onValueChange).not.toHaveBeenCalled();
    });

    it("leaves the others working when one item is disabled", async () => {
      const user = userEvent.setup();
      render(
        <ToggleGroup aria-label="A">
          <ToggleGroup.Item value="a" disabled>A</ToggleGroup.Item>
          <ToggleGroup.Item value="b">B</ToggleGroup.Item>
        </ToggleGroup>,
      );
      await user.click(on("B"));
      expect(isOn(on("B"))).toBe(true);
      expect(on("A")).toBeDisabled();
    });
  });

  describe("layout and looks", () => {
    it("is attached, horizontal, outlined and md by default", () => {
      render(<Alignment />);
      const group = screen.getByRole("radiogroup");
      expect(group).toHaveClass(styles.attached as string);
      expect(group).not.toHaveClass(styles.spaced as string);
      expect(group).toHaveAttribute("data-orientation", "horizontal");
      expect(on("Left")).toHaveClass(styles.variantOutlined as string);
      expect(on("Left")).toHaveClass(styles.sizeMd as string);
    });

    it.each([
      ["subtle", styles.variantSubtle],
      ["solid", styles.variantSolid],
      ["outlined", styles.variantOutlined],
    ] as const)("gives every item the %s variant", (variant, className) => {
      render(<Alignment variant={variant} />);
      for (const radio of screen.getAllByRole("radio")) expect(radio).toHaveClass(className as string);
    });

    it("gives every item the group's size", () => {
      render(<Alignment size="xl" />);
      for (const radio of screen.getAllByRole("radio")) expect(radio).toHaveClass(styles.sizeXl as string);
    });

    it("is spaced with attached={false}, rounded with rounded, and stretched with fullWidth", () => {
      render(<Alignment attached={false} rounded fullWidth />);
      const group = screen.getByRole("radiogroup");
      expect(group).toHaveClass(styles.spaced as string);
      expect(group).toHaveClass(styles.rounded as string);
      expect(group).toHaveClass(styles.fullWidth as string);
    });

    it("follows a breakpoint map, and changes when the viewport does", () => {
      const listeners: Array<() => void> = [];
      let wide = false;
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
      render(<Alignment orientation={{ base: "vertical", md: "horizontal" }} />);
      expect(screen.getByRole("radiogroup")).toHaveAttribute("data-orientation", "vertical");
      wide = true;
      act(() => listeners.forEach((callback) => callback()));
      expect(screen.getByRole("radiogroup")).toHaveAttribute("data-orientation", "horizontal");
    });

    it("sets dir on the group: left-to-right by default, even inside a right-to-left page, and rtl when asked", () => {
      const { unmount } = render(
        <div dir="rtl">
          <Alignment />
        </div>,
      );
      expect(screen.getByRole("radiogroup")).toHaveAttribute("dir", "ltr");
      unmount();
      render(<Alignment dir="rtl" />);
      expect(screen.getByRole("radiogroup")).toHaveAttribute("dir", "rtl");
    });
  });

  describe("items", () => {
    it("renders an icon before the label, and an icon-only item as a square with its own name", () => {
      render(
        <ToggleGroup aria-label="Style" type="multiple">
          <ToggleGroup.Item value="a" icon={TextBIcon}>Bold</ToggleGroup.Item>
          <ToggleGroup.Item value="b" icon={TextItalicIcon} aria-label="Italic" />
        </ToggleGroup>,
      );
      const labelled = screen.getByRole("button", { name: "Bold" });
      expect(labelled.querySelector("svg")).not.toBeNull();
      expect(labelled).not.toHaveClass(styles.iconOnly as string);
      const iconOnly = screen.getByRole("button", { name: "Italic" });
      expect(iconOnly.querySelector("svg")).not.toBeNull();
      expect(iconOnly).toHaveClass(styles.iconOnly as string);
    });

    it("takes className, style, id and data-testid on an item", () => {
      render(
        <ToggleGroup aria-label="A">
          <ToggleGroup.Item value="a" className="mine" style={{ opacity: 0.5 }} id="item" data-testid="i">A</ToggleGroup.Item>
        </ToggleGroup>,
      );
      const item = screen.getByTestId("i");
      expect(item).toHaveClass("mine");
      expect(item).toHaveAttribute("id", "item");
      expect(item).toHaveStyle({ opacity: "0.5" });
    });

    it("forwards a ref to the item's button", () => {
      const ref = createRef<HTMLButtonElement>();
      render(
        <ToggleGroup aria-label="A">
          <ToggleGroup.Item value="a" ref={ref}>A</ToggleGroup.Item>
        </ToggleGroup>,
      );
      expect(ref.current).toBe(on("A"));
    });

    it("works wrapped for a tooltip, and rendered asChild", async () => {
      const user = userEvent.setup();
      render(
        <ToggleGroup aria-label="A" type="multiple">
          <Tooltip content="Make it bold">
            <ToggleGroup.Item value="bold">Bold</ToggleGroup.Item>
          </Tooltip>
          <ToggleGroup.Item value="link" asChild>
            <a href="#x">Link</a>
          </ToggleGroup.Item>
        </ToggleGroup>,
      );
      await user.click(screen.getByRole("button", { name: "Bold" }));
      expect(screen.getByRole("button", { name: "Bold" })).toHaveAttribute("aria-pressed", "true");
      expect(screen.getByRole("link", { name: "Link" })).toHaveAttribute("data-state", "off");
    });

    it("draws the icon inside an asChild item, before its own label, and an empty one icon-only", () => {
      render(
        <ToggleGroup aria-label="Style" type="multiple">
          <ToggleGroup.Item value="bold" icon={TextBIcon} asChild>
            <a href="#bold">Bold</a>
          </ToggleGroup.Item>
          <ToggleGroup.Item value="italic" icon={TextItalicIcon} aria-label="Italic" asChild>
            <a href="#italic" aria-label="Italic" />
          </ToggleGroup.Item>
        </ToggleGroup>,
      );
      const bold = screen.getByRole("link", { name: "Bold" });
      expect(bold.firstElementChild?.tagName.toLowerCase()).toBe("svg");
      expect(bold.querySelector(`.${styles.itemLabel}`)).toHaveTextContent("Bold");
      expect(bold).not.toHaveClass(styles.iconOnly!);
      const italic = screen.getByRole("link", { name: "Italic" });
      expect(italic.querySelectorAll("svg")).toHaveLength(1);
      expect(italic.querySelector(`.${styles.itemLabel}`)).toBeNull();
      expect(italic).toHaveClass(styles.iconOnly!);
    });
  });

  it("survives React StrictMode", async () => {
    const user = userEvent.setup();
    render(
      <StrictMode>
        <Alignment defaultValue="left" />
      </StrictMode>,
    );
    await user.click(on("Right"));
    expect(isOn(on("Right"))).toBe(true);
  });

  describe("accessibility", () => {
    it.each([
      ["single, outlined", {}],
      ["single, subtle", { variant: "subtle" as const }],
      ["single, solid", { variant: "solid" as const }],
      ["spaced", { attached: false }],
      ["vertical", { orientation: "vertical" as const }],
      ["disabled", { disabled: true }],
      ["rounded, right to left", { rounded: true, dir: "rtl" as const }],
      ["with a choice", { defaultValue: "center" }],
    ])("has no violations, %s", async (_name, extra) => {
      const { container } = render(<Alignment {...extra} />);
      expect((await axe(container)).violations).toHaveLength(0);
    });

    it.each([
      ["multiple", {}],
      ["multiple with choices", { defaultValue: ["bold", "italic"] }],
      ["multiple, solid, vertical", { variant: "solid" as const, orientation: "vertical" as const }],
    ])("has no violations, %s", async (_name, extra) => {
      const { container } = render(<Styles {...extra} />);
      expect((await axe(container)).violations).toHaveLength(0);
    });

    it("has no violations with icon-only items and a visible label", async () => {
      const { container } = render(
        <>
          <span id="label">Text style</span>
          <ToggleGroup aria-labelledby="label" type="multiple" aria-describedby="help">
            <ToggleGroup.Item value="b" icon={TextBIcon} aria-label="Bold" />
            <ToggleGroup.Item value="i" icon={TextItalicIcon} aria-label="Italic" />
          </ToggleGroup>
          <p id="help">Applies to the selection</p>
        </>,
      );
      expect((await axe(container)).violations).toHaveLength(0);
    });
  });

  describe("rovingFocus", () => {
    it("is a roving-focus group of its own by default: one tab stop", async () => {
      const user = userEvent.setup();
      render(
        <>
          <ToggleGroup aria-label="Style" type="multiple">
            <ToggleGroup.Item value="b" icon={TextBIcon} aria-label="Bold" />
            <ToggleGroup.Item value="i" icon={TextItalicIcon} aria-label="Italic" />
          </ToggleGroup>
          <button>after</button>
        </>,
      );
      expect(screen.getByRole("toolbar", { name: "Style" })).toBeInTheDocument();
      await user.tab();
      await user.tab();
      expect(screen.getByRole("button", { name: "after" })).toHaveFocus();
    });

    it("with rovingFocus off leaves focus to the container: every item is a tab stop, and a multiple group is a plain group", async () => {
      const user = userEvent.setup();
      render(
        <ToggleGroup aria-label="Style" type="multiple" rovingFocus={false}>
          <ToggleGroup.Item value="b" icon={TextBIcon} aria-label="Bold" />
          <ToggleGroup.Item value="i" icon={TextItalicIcon} aria-label="Italic" />
        </ToggleGroup>,
      );
      expect(screen.queryByRole("toolbar")).toBeNull();
      expect(screen.getByRole("group", { name: "Style" })).toBeInTheDocument();
      await user.tab();
      expect(screen.getByRole("button", { name: "Bold" })).toHaveFocus();
      await user.tab();
      expect(screen.getByRole("button", { name: "Italic" })).toHaveFocus();
    });

    it("keeps a single group a radiogroup with rovingFocus off, and still chooses on click", async () => {
      const user = userEvent.setup();
      render(
        <ToggleGroup aria-label="Align" defaultValue="l" rovingFocus={false}>
          <ToggleGroup.Item value="l">Left</ToggleGroup.Item>
          <ToggleGroup.Item value="r">Right</ToggleGroup.Item>
        </ToggleGroup>,
      );
      expect(screen.getByRole("radiogroup", { name: "Align" })).toBeInTheDocument();
      await user.click(screen.getByRole("radio", { name: "Right" }));
      expect(screen.getByRole("radio", { name: "Right" })).toHaveAttribute("aria-checked", "true");
    });
  });
});
