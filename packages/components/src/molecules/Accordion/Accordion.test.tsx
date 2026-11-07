import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { axe } from "jest-axe";
import { useState } from "react";
import { describe, expect, it, vi } from "vitest";
import { DirectionProvider } from "../../atoms/DirectionProvider";
import { Accordion } from "./Accordion";
import styles from "./Accordion.module.css";

function BasicItems() {
  return (
    <>
      <Accordion.Item value="shipping">
        <Accordion.Trigger>Shipping</Accordion.Trigger>
        <Accordion.Content>Shipping content</Accordion.Content>
      </Accordion.Item>
      <Accordion.Item value="returns">
        <Accordion.Trigger>Returns</Accordion.Trigger>
        <Accordion.Content>Returns content</Accordion.Content>
      </Accordion.Item>
    </>
  );
}

describe("Accordion", () => {
  it("renders every trigger and keeps content closed by default", () => {
    render(
      <Accordion>
        <BasicItems />
      </Accordion>,
    );
    expect(screen.getByRole("button", { name: "Shipping" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Returns" })).toBeInTheDocument();
    expect(screen.queryByText("Shipping content")).not.toBeInTheDocument();
  });

  it("opens an item's content when its trigger is clicked, and closes it on a second click", async () => {
    const user = userEvent.setup();
    render(
      <Accordion>
        <BasicItems />
      </Accordion>,
    );
    const trigger = screen.getByRole("button", { name: "Shipping" });

    await user.click(trigger);
    expect(screen.getByText("Shipping content")).toBeInTheDocument();
    expect(trigger).toHaveAttribute("aria-expanded", "true");

    await user.click(trigger);
    expect(screen.queryByText("Shipping content")).not.toBeInTheDocument();
    expect(trigger).toHaveAttribute("aria-expanded", "false");
  });

  it("closes the previously open item when type=\"single\" (the default)", async () => {
    const user = userEvent.setup();
    render(
      <Accordion defaultValue="shipping">
        <BasicItems />
      </Accordion>,
    );

    expect(screen.getByText("Shipping content")).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Returns" }));
    expect(screen.queryByText("Shipping content")).not.toBeInTheDocument();
    expect(screen.getByText("Returns content")).toBeInTheDocument();
  });

  it("allows multiple items open at once when type=\"multiple\"", async () => {
    const user = userEvent.setup();
    render(
      <Accordion type="multiple">
        <BasicItems />
      </Accordion>,
    );

    await user.click(screen.getByRole("button", { name: "Shipping" }));
    await user.click(screen.getByRole("button", { name: "Returns" }));

    expect(screen.getByText("Shipping content")).toBeInTheDocument();
    expect(screen.getByText("Returns content")).toBeInTheDocument();
  });

  it("keeps the item open when collapsible is false and its own trigger is activated again", async () => {
    const user = userEvent.setup();
    render(
      <Accordion defaultValue="shipping" collapsible={false}>
        <BasicItems />
      </Accordion>,
    );

    await user.click(screen.getByRole("button", { name: "Shipping" }));
    expect(screen.getByText("Shipping content")).toBeInTheDocument();
  });

  it("supports fully controlled open state", async () => {
    const user = userEvent.setup();
    function Controlled() {
      const [value, setValue] = useState("");
      return (
        <Accordion value={value} onValueChange={setValue}>
          <BasicItems />
        </Accordion>
      );
    }
    render(<Controlled />);

    await user.click(screen.getByRole("button", { name: "Shipping" }));
    expect(screen.getByText("Shipping content")).toBeInTheDocument();
  });

  it("starts with the given item open when defaultValue is set", () => {
    render(
      <Accordion defaultValue="returns">
        <BasicItems />
      </Accordion>,
    );
    expect(screen.getByText("Returns content")).toBeInTheDocument();
  });

  it("disables an individual item's own trigger", async () => {
    const user = userEvent.setup();
    render(
      <Accordion>
        <Accordion.Item value="shipping" disabled>
          <Accordion.Trigger>Shipping</Accordion.Trigger>
          <Accordion.Content>Shipping content</Accordion.Content>
        </Accordion.Item>
      </Accordion>,
    );
    const trigger = screen.getByRole("button", { name: "Shipping" });
    expect(trigger).toBeDisabled();

    await user.click(trigger);
    expect(screen.queryByText("Shipping content")).not.toBeInTheDocument();
  });

  it("disables every item at once via the accordion-level disabled prop", () => {
    render(
      <Accordion disabled>
        <BasicItems />
      </Accordion>,
    );
    expect(screen.getByRole("button", { name: "Shipping" })).toBeDisabled();
    expect(screen.getByRole("button", { name: "Returns" })).toBeDisabled();
  });

  it("moves roving focus between triggers with arrow keys", async () => {
    const user = userEvent.setup();
    render(
      <Accordion>
        <BasicItems />
      </Accordion>,
    );
    const shipping = screen.getByRole("button", { name: "Shipping" });
    const returns = screen.getByRole("button", { name: "Returns" });

    shipping.focus();
    await user.keyboard("{ArrowDown}");
    expect(returns).toHaveFocus();

    await user.keyboard("{ArrowUp}");
    expect(shipping).toHaveFocus();
  });

  it("jumps to the first/last trigger with Home/End", async () => {
    const user = userEvent.setup();
    render(
      <Accordion>
        <Accordion.Item value="shipping">
          <Accordion.Trigger>Shipping</Accordion.Trigger>
          <Accordion.Content>Shipping content</Accordion.Content>
        </Accordion.Item>
        <Accordion.Item value="returns">
          <Accordion.Trigger>Returns</Accordion.Trigger>
          <Accordion.Content>Returns content</Accordion.Content>
        </Accordion.Item>
        <Accordion.Item value="warranty">
          <Accordion.Trigger>Warranty</Accordion.Trigger>
          <Accordion.Content>Warranty content</Accordion.Content>
        </Accordion.Item>
      </Accordion>,
    );
    const shipping = screen.getByRole("button", { name: "Shipping" });
    const returns = screen.getByRole("button", { name: "Returns" });
    const warranty = screen.getByRole("button", { name: "Warranty" });

    returns.focus();
    await user.keyboard("{End}");
    expect(warranty).toHaveFocus();

    await user.keyboard("{Home}");
    expect(shipping).toHaveFocus();
  });

  it("skips a disabled item's trigger when moving roving focus with arrow keys", async () => {
    const user = userEvent.setup();
    render(
      <Accordion>
        <Accordion.Item value="shipping">
          <Accordion.Trigger>Shipping</Accordion.Trigger>
          <Accordion.Content>Shipping content</Accordion.Content>
        </Accordion.Item>
        <Accordion.Item value="returns" disabled>
          <Accordion.Trigger>Returns</Accordion.Trigger>
          <Accordion.Content>Returns content</Accordion.Content>
        </Accordion.Item>
        <Accordion.Item value="warranty">
          <Accordion.Trigger>Warranty</Accordion.Trigger>
          <Accordion.Content>Warranty content</Accordion.Content>
        </Accordion.Item>
      </Accordion>,
    );
    const shipping = screen.getByRole("button", { name: "Shipping" });
    const warranty = screen.getByRole("button", { name: "Warranty" });

    shipping.focus();
    await user.keyboard("{ArrowDown}");
    expect(warranty).toHaveFocus();
  });

  it("wires aria-controls/aria-labelledby between a trigger and its own panel", () => {
    render(
      <Accordion defaultValue="shipping">
        <BasicItems />
      </Accordion>,
    );
    const trigger = screen.getByRole("button", { name: "Shipping" });
    const panel = screen.getByText("Shipping content").closest('[role="region"]');

    expect(panel).not.toBeNull();
    expect(trigger).toHaveAttribute("aria-controls", panel?.id);
    expect(panel).toHaveAttribute("aria-labelledby", trigger.id);
  });

  it("renders the trigger's heading level via headingLevel", () => {
    render(
      <Accordion headingLevel={2}>
        <BasicItems />
      </Accordion>,
    );
    expect(screen.getByRole("heading", { level: 2, name: "Shipping" })).toBeInTheDocument();
  });

  it("defaults the trigger's heading level to 3", () => {
    render(
      <Accordion>
        <BasicItems />
      </Accordion>,
    );
    expect(screen.getByRole("heading", { level: 3, name: "Shipping" })).toBeInTheDocument();
  });

  it("renders an item's own root behavior onto a single provided child via asChild, with no extra wrapper", () => {
    const { container } = render(
      <Accordion defaultValue="shipping">
        <ul>
          <Accordion.Item value="shipping" asChild>
            <li data-testid="shipping-item">
              <Accordion.Trigger>Shipping</Accordion.Trigger>
              <Accordion.Content>Shipping content</Accordion.Content>
            </li>
          </Accordion.Item>
        </ul>
      </Accordion>,
    );
    const item = screen.getByTestId("shipping-item");
    expect(item.tagName).toBe("LI");
    expect(container.querySelector("ul")?.firstElementChild).toBe(item);
    expect(screen.getByText("Shipping content")).toBeInTheDocument();
  });

  it("renders a fully custom trigger row via asChild", () => {
    render(
      <Accordion>
        <Accordion.Item value="shipping">
          <Accordion.Trigger asChild>
            <button type="button">Custom trigger</button>
          </Accordion.Trigger>
          <Accordion.Content>Shipping content</Accordion.Content>
        </Accordion.Item>
      </Accordion>,
    );
    expect(screen.getByRole("button", { name: "Custom trigger" })).toBeInTheDocument();
  });

  it("hides the disclosure icon when hideIcon is set", () => {
    const { container } = render(
      <Accordion>
        <Accordion.Item value="shipping">
          <Accordion.Trigger hideIcon>Shipping</Accordion.Trigger>
          <Accordion.Content>Shipping content</Accordion.Content>
        </Accordion.Item>
      </Accordion>,
    );
    expect(container.querySelector("svg")).not.toBeInTheDocument();
  });

  it("warns once in development when icon or hideIcon is combined with asChild", () => {
    const warnSpy = vi.spyOn(console, "warn").mockImplementation(() => {});
    const { rerender } = render(
      <Accordion>
        <Accordion.Item value="shipping">
          <Accordion.Trigger asChild hideIcon>
            <button type="button">Custom trigger</button>
          </Accordion.Trigger>
          <Accordion.Content>Shipping content</Accordion.Content>
        </Accordion.Item>
      </Accordion>,
    );
    expect(warnSpy).toHaveBeenCalledTimes(1);
    expect(warnSpy.mock.calls[0]?.[0]).toContain("icon");

    rerender(
      <Accordion>
        <Accordion.Item value="shipping">
          <Accordion.Trigger asChild hideIcon>
            <button type="button">Custom trigger again</button>
          </Accordion.Trigger>
          <Accordion.Content>Shipping content</Accordion.Content>
        </Accordion.Item>
      </Accordion>,
    );
    expect(warnSpy).toHaveBeenCalledTimes(1);
    warnSpy.mockRestore();
  });

  it("does not warn when asChild is used without icon or hideIcon", () => {
    const warnSpy = vi.spyOn(console, "warn").mockImplementation(() => {});
    render(
      <Accordion>
        <Accordion.Item value="shipping">
          <Accordion.Trigger asChild>
            <button type="button">Custom trigger</button>
          </Accordion.Trigger>
          <Accordion.Content>Shipping content</Accordion.Content>
        </Accordion.Item>
      </Accordion>,
    );
    expect(warnSpy).not.toHaveBeenCalled();
    warnSpy.mockRestore();
  });

  it("warns once in development when collapsible is set under type=\"multiple\"", () => {
    const warnSpy = vi.spyOn(console, "warn").mockImplementation(() => {});
    const { rerender } = render(
      // @ts-expect-error -- collapsible is typed `never` under type="multiple"; testing the runtime warning for a non-TS/JS consumer who ignores the type error.
      <Accordion type="multiple" collapsible={false}>
        <BasicItems />
      </Accordion>,
    );
    expect(warnSpy).toHaveBeenCalledTimes(1);
    expect(warnSpy.mock.calls[0]?.[0]).toContain("collapsible");

    rerender(
      // @ts-expect-error -- see above
      <Accordion type="multiple" collapsible={false}>
        <BasicItems />
      </Accordion>,
    );
    expect(warnSpy).toHaveBeenCalledTimes(1);
    warnSpy.mockRestore();
  });

  it("does not warn about collapsible under type=\"single\"", () => {
    const warnSpy = vi.spyOn(console, "warn").mockImplementation(() => {});
    render(
      <Accordion collapsible={false}>
        <BasicItems />
      </Accordion>,
    );
    expect(warnSpy).not.toHaveBeenCalled();
    warnSpy.mockRestore();
  });

  it("forwards the root ref to the underlying element", () => {
    const ref = vi.fn();
    render(
      <Accordion ref={ref}>
        <BasicItems />
      </Accordion>,
    );
    expect(ref).toHaveBeenCalled();
  });

  it("defaults to the bordered variant", () => {
    const { container } = render(
      <Accordion>
        <BasicItems />
      </Accordion>,
    );
    expect(container.firstElementChild).not.toHaveClass(styles.ghost ?? "");
  });

  it("applies the ghost variant's own class, removing the outer border", () => {
    const { container } = render(
      <Accordion variant="ghost">
        <BasicItems />
      </Accordion>,
    );
    expect(container.firstElementChild).toHaveClass(styles.ghost ?? "");
  });

  const triggerClassForSize = {
    xs: styles.triggerXs,
    sm: styles.triggerSm,
    md: styles.triggerMd,
    lg: styles.triggerLg,
    xl: styles.triggerXl,
  } as const;

  it.each(["xs", "sm", "md", "lg", "xl"] as const)("renders correctly at size=\"%s\"", (size) => {
    render(
      <Accordion size={size} defaultValue="shipping">
        <BasicItems />
      </Accordion>,
    );
    const trigger = screen.getByRole("button", { name: "Shipping" });
    expect(trigger).toHaveClass(triggerClassForSize[size] ?? "");
    expect(screen.getByText("Shipping content")).toBeInTheDocument();
  });

  it("passes id, className, style, data-testid, and other native attributes through to the root element", () => {
    const onFocus = vi.fn();
    render(
      <Accordion
        id="accordion-root"
        className="extra"
        style={{ color: "red" }}
        data-testid="accordion-testid"
        aria-label="Example accordion"
        onFocus={onFocus}
      >
        <BasicItems />
      </Accordion>,
    );
    const root = screen.getByTestId("accordion-testid");
    expect(root).toHaveAttribute("id", "accordion-root");
    expect(root).toHaveClass("extra");
    expect(root).toHaveStyle({ color: "rgb(255, 0, 0)" });
    expect(root).toHaveAttribute("aria-label", "Example accordion");
  });

  it("passes id, className, style, and data-testid through to an item element", () => {
    render(
      <Accordion>
        <Accordion.Item value="shipping" id="item-id" className="extra" style={{ color: "red" }} data-testid="item-testid">
          <Accordion.Trigger>Shipping</Accordion.Trigger>
          <Accordion.Content>Shipping content</Accordion.Content>
        </Accordion.Item>
      </Accordion>,
    );
    const item = screen.getByTestId("item-testid");
    expect(item).toHaveAttribute("id", "item-id");
    expect(item).toHaveClass("extra");
    expect(item).toHaveStyle({ color: "rgb(255, 0, 0)" });
  });

  it("passes id, className, style, and data-testid through to a trigger element", () => {
    render(
      <Accordion>
        <Accordion.Item value="shipping">
          <Accordion.Trigger id="trigger-id" className="extra" style={{ color: "red" }} data-testid="trigger-testid">
            Shipping
          </Accordion.Trigger>
          <Accordion.Content>Shipping content</Accordion.Content>
        </Accordion.Item>
      </Accordion>,
    );
    const trigger = screen.getByTestId("trigger-testid");
    expect(trigger).toHaveAttribute("id", "trigger-id");
    expect(trigger).toHaveClass("extra");
    expect(trigger).toHaveStyle({ color: "rgb(255, 0, 0)" });
  });

  it("passes id, className, style, and data-testid through to a content element", () => {
    render(
      <Accordion defaultValue="shipping">
        <Accordion.Item value="shipping">
          <Accordion.Trigger>Shipping</Accordion.Trigger>
          <Accordion.Content id="content-id" className="extra" style={{ color: "red" }} data-testid="content-testid">
            Shipping content
          </Accordion.Content>
        </Accordion.Item>
      </Accordion>,
    );
    const content = screen.getByTestId("content-testid");
    expect(content).toHaveAttribute("id", "content-id");
    expect(content).toHaveClass("extra");
    expect(content).toHaveStyle({ color: "rgb(255, 0, 0)" });
  });

  it("has no accessibility violations, closed or open", async () => {
    const { container } = render(
      <Accordion>
        <BasicItems />
      </Accordion>,
    );
    expect((await axe(container)).violations).toHaveLength(0);

    const user = userEvent.setup();
    await user.click(screen.getByRole("button", { name: "Shipping" }));
    expect((await axe(container)).violations).toHaveLength(0);
  });

  it("has no accessibility violations for type=\"multiple\" with several items open", async () => {
    const { container } = render(
      <Accordion type="multiple" defaultValue={["shipping", "returns"]}>
        <BasicItems />
      </Accordion>,
    );
    expect((await axe(container)).violations).toHaveLength(0);
  });

  it("has no accessibility violations when disabled", async () => {
    const { container } = render(
      <Accordion disabled>
        <BasicItems />
      </Accordion>,
    );
    expect((await axe(container)).violations).toHaveLength(0);
  });
});

describe("Accordion direction", () => {
  const horizontal = (dir?: "ltr" | "rtl") => (
    <Accordion type="single" collapsible orientation="horizontal" dir={dir}>
      <BasicItems />
      <Accordion.Item value="billing">
        <Accordion.Trigger>Billing</Accordion.Trigger>
        <Accordion.Content>Billing content</Accordion.Content>
      </Accordion.Item>
    </Accordion>
  );

  it("moves focus the other way under a DirectionProvider, and its own dir wins", async () => {
    const user = userEvent.setup();
    const first = () => screen.getByRole("button", { name: "Shipping" });
    const second = () => screen.getByRole("button", { name: "Returns" });
    const { unmount } = render(horizontal());
    first().focus();
    await user.keyboard("{ArrowRight}");
    expect(second()).toHaveFocus();
    unmount();

    const rtl = render(<DirectionProvider dir="rtl">{horizontal()}</DirectionProvider>);
    first().focus();
    await user.keyboard("{ArrowLeft}");
    expect(second()).toHaveFocus();
    rtl.unmount();

    render(<DirectionProvider dir="rtl">{horizontal("ltr")}</DirectionProvider>);
    first().focus();
    await user.keyboard("{ArrowRight}");
    expect(second()).toHaveFocus();
  });
});
