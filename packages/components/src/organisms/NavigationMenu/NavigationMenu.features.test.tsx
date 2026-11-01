import { ChartBarIcon } from "@dbm-system/icons";
import { act, render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { axe } from "jest-axe";
import { createRef } from "react";
import { describe, expect, it, vi } from "vitest";
import { Badge } from "../../atoms/Badge";
import { NavigationMenu } from "./NavigationMenu";
import type { NavigationMenuController, NavigationMenuProps } from "./NavigationMenu.types";

function Menu(props: Omit<NavigationMenuProps, "children"> & { onIntent?: () => void; linkIntent?: () => void; triggerHref?: string }) {
  const { onIntent, linkIntent, triggerHref, ...rest } = props;
  return (
    <NavigationMenu aria-label="Primary" {...rest}>
      <NavigationMenu.List>
        <NavigationMenu.Item value="products">
          <NavigationMenu.Trigger onIntent={onIntent} href={triggerHref}>
            Products
          </NavigationMenu.Trigger>
          <NavigationMenu.Content>
            <NavigationMenu.Group label="Platform" href="/platform">
              <NavigationMenu.Link href="/analytics" description="Dashboards" descriptionLines={2} onIntent={linkIntent}>
                Analytics
              </NavigationMenu.Link>
              <NavigationMenu.Link href="/automation">Automation</NavigationMenu.Link>
            </NavigationMenu.Group>
          </NavigationMenu.Content>
        </NavigationMenu.Item>
        <NavigationMenu.Item value="solutions">
          <NavigationMenu.Trigger>Solutions</NavigationMenu.Trigger>
          <NavigationMenu.Content>
            <NavigationMenu.Link href="/support/chat">Chat</NavigationMenu.Link>
          </NavigationMenu.Content>
        </NavigationMenu.Item>
        <NavigationMenu.Item>
          <NavigationMenu.Link href="/pricing">Pricing</NavigationMenu.Link>
        </NavigationMenu.Item>
      </NavigationMenu.List>
    </NavigationMenu>
  );
}

describe("the current page from a path", () => {
  it("marks the link whose href is the path, and the trigger of the panel that holds it", () => {
    render(<Menu currentPath="/pricing/" />);
    expect(screen.getByRole("link", { name: "Pricing" })).toHaveAttribute("aria-current", "page");
    expect(screen.getByRole("button", { name: "Products" }).className).not.toMatch(/current(?!Variant)/);
    render(<Menu currentPath="/automation?tab=1#top" defaultValue="products" />);
    const trigger = screen.getAllByRole("button", { name: "Products" })[1] as HTMLElement;
    expect(trigger.className).toMatch(/currentUnderline/);
  });

  it("follows a link's own current, either value, over the path", async () => {
    const user = userEvent.setup();
    render(
      <NavigationMenu aria-label="Primary" currentPath="/a">
        <NavigationMenu.List>
          <NavigationMenu.Item value="x">
            <NavigationMenu.Trigger>X</NavigationMenu.Trigger>
            <NavigationMenu.Content>
              <NavigationMenu.Link href="/a" current={false}>
                A
              </NavigationMenu.Link>
              <NavigationMenu.Link href="/b" current>
                B
              </NavigationMenu.Link>
            </NavigationMenu.Content>
          </NavigationMenu.Item>
        </NavigationMenu.List>
      </NavigationMenu>,
    );
    await user.click(screen.getByRole("button", { name: "X" }));
    expect(await screen.findByRole("link", { name: "A" })).not.toHaveAttribute("aria-current");
    expect(screen.getByRole("link", { name: "B" })).toHaveAttribute("aria-current", "page");
    expect(screen.getByRole("button", { name: "X" }).className).toMatch(/currentUnderline/);
  });

  it("matches by prefix when asked, and never against a hash or another site", () => {
    render(<Menu currentPath="/support/chat/room-4" currentMatch="prefix" defaultValue="solutions" />);
    expect(screen.getByRole("button", { name: "Solutions" }).className).toMatch(/currentUnderline/);
    render(
      <NavigationMenu currentPath="/x" aria-label="Other">
        <NavigationMenu.List>
          <NavigationMenu.Item>
            <NavigationMenu.Link href="#x">Hash</NavigationMenu.Link>
          </NavigationMenu.Item>
          <NavigationMenu.Item>
            <NavigationMenu.Link href="https://example.com/x">Site</NavigationMenu.Link>
          </NavigationMenu.Item>
        </NavigationMenu.List>
      </NavigationMenu>,
    );
    expect(screen.getByRole("link", { name: "Hash" })).not.toHaveAttribute("aria-current");
    expect(screen.getByRole("link", { name: /Site/ })).not.toHaveAttribute("aria-current");
  });
});

describe("the stacked form", () => {
  it("starts the item that holds the current page expanded, until something is pressed, unless defaultOpen says not", async () => {
    const user = userEvent.setup();
    render(<Menu presentation="stacked" currentPath="/support/chat" />);
    const solutions = screen.getByRole("button", { name: "Solutions" });
    expect(solutions).toHaveAttribute("aria-expanded", "true");
    expect(screen.getByRole("link", { name: "Chat" })).toHaveAttribute("aria-current", "page");
    expect(screen.getByRole("button", { name: "Products" })).toHaveAttribute("aria-expanded", "false");
    await user.click(screen.getByRole("button", { name: "Products" }));
    expect(solutions).toHaveAttribute("aria-expanded", "false");
    render(
      <NavigationMenu aria-label="Other" presentation="stacked" currentPath="/x">
        <NavigationMenu.List>
          <NavigationMenu.Item value="a" defaultOpen={false}>
            <NavigationMenu.Trigger>Closed</NavigationMenu.Trigger>
            <NavigationMenu.Content>
              <NavigationMenu.Link href="/x">X</NavigationMenu.Link>
            </NavigationMenu.Content>
          </NavigationMenu.Item>
        </NavigationMenu.List>
      </NavigationMenu>,
    );
    expect(screen.getByRole("button", { name: "Closed" })).toHaveAttribute("aria-expanded", "false");
  });

  it("starts an item expanded with defaultOpen and closes it once another is pressed", async () => {
    const user = userEvent.setup();
    render(
      <NavigationMenu aria-label="Primary" presentation="stacked">
        <NavigationMenu.List>
          <NavigationMenu.Item value="a" defaultOpen>
            <NavigationMenu.Trigger>A</NavigationMenu.Trigger>
            <NavigationMenu.Content>
              <NavigationMenu.Link href="/a1">A1</NavigationMenu.Link>
            </NavigationMenu.Content>
          </NavigationMenu.Item>
          <NavigationMenu.Item value="b">
            <NavigationMenu.Trigger>B</NavigationMenu.Trigger>
            <NavigationMenu.Content>
              <NavigationMenu.Link href="/b1">B1</NavigationMenu.Link>
            </NavigationMenu.Content>
          </NavigationMenu.Item>
        </NavigationMenu.List>
      </NavigationMenu>,
    );
    expect(screen.getByRole("button", { name: "A" })).toHaveAttribute("aria-expanded", "true");
    await user.click(screen.getByRole("button", { name: "B" }));
    expect(screen.getByRole("button", { name: "A" })).toHaveAttribute("aria-expanded", "false");
    expect(screen.getByRole("button", { name: "B" })).toHaveAttribute("aria-expanded", "true");
    await user.click(screen.getByRole("button", { name: "B" }));
    expect(screen.getByRole("button", { name: "A" })).toHaveAttribute("aria-expanded", "false");
  });

  it("keeps several open when exclusive is off", async () => {
    const user = userEvent.setup();
    render(<Menu presentation="stacked" exclusive={false} />);
    await user.click(screen.getByRole("button", { name: "Products" }));
    await user.click(screen.getByRole("button", { name: "Solutions" }));
    expect(screen.getByRole("button", { name: "Products" })).toHaveAttribute("aria-expanded", "true");
    expect(screen.getByRole("button", { name: "Solutions" })).toHaveAttribute("aria-expanded", "true");
    await user.click(screen.getByRole("button", { name: "Products" }));
    expect(screen.getByRole("button", { name: "Products" })).toHaveAttribute("aria-expanded", "false");
    expect(screen.getByRole("button", { name: "Solutions" })).toHaveAttribute("aria-expanded", "true");
  });

  it("draws a split trigger as a link and a disclosure button", async () => {
    const user = userEvent.setup();
    render(<Menu presentation="stacked" triggerHref="/products" />);
    expect(screen.getByRole("link", { name: "Products" })).toHaveAttribute("href", "/products");
    const caret = screen.getByRole("button", { name: "Products menu" });
    expect(caret).toHaveAttribute("aria-expanded", "false");
    await user.click(caret);
    expect(caret).toHaveAttribute("aria-expanded", "true");
    expect(screen.getByRole("link", { name: /Analytics/ })).toBeVisible();
  });
});

describe("a split trigger", () => {
  it("is a link beside a caret button that opens the panel, named after the trigger", async () => {
    const user = userEvent.setup();
    render(<Menu triggerHref="/products" />);
    const link = screen.getByRole("link", { name: "Products" });
    expect(link).toHaveAttribute("href", "/products");
    const caret = screen.getByRole("button", { name: "Products menu" });
    await user.click(caret);
    await waitFor(() => expect(caret).toHaveAttribute("aria-expanded", "true"));
    expect(await screen.findByRole("link", { name: /Analytics/ })).toBeVisible();
  });

  it("takes translated names from labels.togglePanel", () => {
    render(<Menu triggerHref="/products" labels={{ togglePanel: (name) => `Afficher ${name}` }} />);
    expect(screen.getByRole("button", { name: "Afficher Products" })).toBeInTheDocument();
  });

  it("disables both the link and the caret", () => {
    render(
      <NavigationMenu aria-label="Primary">
        <NavigationMenu.List>
          <NavigationMenu.Item value="a">
            <NavigationMenu.Trigger href="/a" disabled>
              A
            </NavigationMenu.Trigger>
            <NavigationMenu.Content>x</NavigationMenu.Content>
          </NavigationMenu.Item>
        </NavigationMenu.List>
      </NavigationMenu>,
    );
    expect(screen.getByRole("link", { name: "A" })).toHaveAttribute("aria-disabled", "true");
    expect(screen.getByRole("button", { name: "A menu" })).toBeDisabled();
  });

  it("has no accessibility violations", async () => {
    const { container } = render(<Menu triggerHref="/products" />);
    expect(await axe(container)).toHaveNoViolations();
  });
});

describe("a trigger's badge, intent and delay", () => {
  it("puts a badge in the trigger's name", () => {
    render(
      <NavigationMenu aria-label="Primary">
        <NavigationMenu.List>
          <NavigationMenu.Item value="a">
            <NavigationMenu.Trigger badge="New">A</NavigationMenu.Trigger>
            <NavigationMenu.Content>x</NavigationMenu.Content>
          </NavigationMenu.Item>
          <NavigationMenu.Item value="b">
            <NavigationMenu.Trigger badge={<Badge tone="danger">3</Badge>}>B</NavigationMenu.Trigger>
            <NavigationMenu.Content>x</NavigationMenu.Content>
          </NavigationMenu.Item>
        </NavigationMenu.List>
      </NavigationMenu>,
    );
    expect(screen.getByRole("button", { name: /A\s*New/ })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /B\s*3/ })).toBeInTheDocument();
  });

  it("calls onIntent when the pointer rests on a trigger or a link, and when it takes focus", async () => {
    const user = userEvent.setup();
    const onIntent = vi.fn();
    const linkIntent = vi.fn();
    render(<Menu onIntent={onIntent} linkIntent={linkIntent} defaultValue="products" />);
    await user.hover(screen.getByRole("button", { name: "Products" }));
    await waitFor(() => expect(onIntent).toHaveBeenCalledTimes(1), { timeout: 1000 });
    await user.unhover(screen.getByRole("button", { name: "Products" }));
    onIntent.mockClear();
    await user.hover(await screen.findByRole("link", { name: /Analytics/ }));
    await waitFor(() => expect(linkIntent).toHaveBeenCalled(), { timeout: 1000 });
    act(() => screen.getByRole("button", { name: "Products" }).focus());
    expect(onIntent).toHaveBeenCalled();
  });

  it("does not call onIntent for a pointer that leaves before it rests", async () => {
    const user = userEvent.setup();
    const onIntent = vi.fn();
    render(<Menu onIntent={onIntent} />);
    await user.hover(screen.getByRole("button", { name: "Products" }));
    await user.unhover(screen.getByRole("button", { name: "Products" }));
    await new Promise((resolve) => setTimeout(resolve, 250));
    expect(onIntent).not.toHaveBeenCalled();
  });

  it("opens after the trigger's own delay, in place of the menu's", async () => {
    const user = userEvent.setup();
    render(
      <NavigationMenu aria-label="Primary" delayDuration={5000}>
        <NavigationMenu.List>
          <NavigationMenu.Item value="a">
            <NavigationMenu.Trigger delayDuration={30}>A</NavigationMenu.Trigger>
            <NavigationMenu.Content>
              <NavigationMenu.Link href="/x">Inside</NavigationMenu.Link>
            </NavigationMenu.Content>
          </NavigationMenu.Item>
        </NavigationMenu.List>
      </NavigationMenu>,
    );
    await user.hover(screen.getByRole("button", { name: "A" }));
    expect(await screen.findByRole("link", { name: "Inside" }, { timeout: 1500 })).toBeInTheDocument();
  });
});

describe("a panel's parts", () => {
  it("draws a group heading as a link that closes the panel", async () => {
    const user = userEvent.setup();
    render(<Menu />);
    const trigger = screen.getByRole("button", { name: "Products" });
    await user.click(trigger);
    const heading = await screen.findByRole("link", { name: "Platform" });
    expect(heading).toHaveAttribute("href", "/platform");
    expect(screen.getByRole("list", { name: "Platform" })).toBeInTheDocument();
    heading.addEventListener("click", (event) => event.preventDefault());
    await user.click(heading);
    await waitFor(() => expect(trigger).toHaveAttribute("aria-expanded", "false"));
  });

  it("clamps a description to a number of lines", async () => {
    render(<Menu defaultValue="products" />);
    const description = (await screen.findByText("Dashboards")) as HTMLElement;
    expect(description).toHaveAttribute("data-clamped");
    expect(description.style.getPropertyValue("--nm-lines")).toBe("2");
  });

  it("draws a footer under the rest and a feature as a link or as plain content", async () => {
    const user = userEvent.setup();
    render(
      <NavigationMenu aria-label="Primary">
        <NavigationMenu.List>
          <NavigationMenu.Item value="a">
            <NavigationMenu.Trigger>A</NavigationMenu.Trigger>
            <NavigationMenu.Content layout="columns">
              <NavigationMenu.Footer data-testid="footer">
                <NavigationMenu.Link href="/all">View all</NavigationMenu.Link>
              </NavigationMenu.Footer>
              <NavigationMenu.Feature title="Launch week" href="/launch" media={<img alt="Banner" src="/b.png" />}>
                Everything we shipped
              </NavigationMenu.Feature>
              <NavigationMenu.Feature title="Plain" data-testid="plain">
                Just text
              </NavigationMenu.Feature>
            </NavigationMenu.Content>
          </NavigationMenu.Item>
        </NavigationMenu.List>
      </NavigationMenu>,
    );
    await user.click(screen.getByRole("button", { name: "A" }));
    const footer = await screen.findByTestId("footer");
    const feature = screen.getByRole("link", { name: /Launch week/ });
    expect(feature).toHaveAttribute("href", "/launch");
    expect(within(feature).getByRole("img", { name: "Banner" })).toBeInTheDocument();
    expect(screen.getByTestId("plain").querySelector("a")).toBeNull();
    // the footer is last in the panel, whatever order it was written in, and the body says its layout
    expect(footer.previousElementSibling?.getAttribute("data-layout")).toBe("columns");
    expect(footer.nextElementSibling).toBeNull();
  });
});

describe("opening from outside and reporting completion", () => {
  it("opens and closes through controllerRef, saying whether it had anything to do", async () => {
    const controller = createRef<NavigationMenuController>();
    render(<Menu controllerRef={controller} />);
    expect(controller.current?.value).toBe("");
    expect(controller.current?.close()).toBe(false);
    let opened = false;
    act(() => {
      opened = controller.current!.open("products");
    });
    expect(opened).toBe(true);
    await waitFor(() => expect(screen.getByRole("button", { name: "Products" })).toHaveAttribute("aria-expanded", "true"));
    expect(controller.current?.value).toBe("products");
    expect(controller.current?.open("products")).toBe(false);
    act(() => {
      expect(controller.current?.close()).toBe(true);
    });
    await waitFor(() => expect(screen.getByRole("button", { name: "Products" })).toHaveAttribute("aria-expanded", "false"));
  });

  it("keeps the same controller object across renders", () => {
    const controller = createRef<NavigationMenuController>();
    const { rerender } = render(<Menu controllerRef={controller} />);
    const first = controller.current;
    rerender(<Menu controllerRef={controller} size="lg" />);
    expect(controller.current).toBe(first);
  });

  it("reports a panel opened and closed once its animation is over", async () => {
    const user = userEvent.setup();
    const onOpenChangeComplete = vi.fn();
    render(<Menu onOpenChangeComplete={onOpenChangeComplete} />);
    await user.click(screen.getByRole("button", { name: "Products" }));
    await waitFor(() => expect(onOpenChangeComplete).toHaveBeenCalledWith(true, "products"));
    await user.keyboard("{Escape}");
    await waitFor(() => expect(onOpenChangeComplete).toHaveBeenCalledWith(false, "products"));
  });
});

describe("layout choices", () => {
  it("marks a vertical menu and its list", () => {
    render(<Menu orientation="vertical" />);
    expect(screen.getByRole("navigation", { name: "Primary" })).toHaveAttribute("data-orientation", "vertical");
    expect(screen.getByRole("navigation", { name: "Primary" }).className).toMatch(/vertical/);
  });

  it("gives a panel the size asked for", async () => {
    const user = userEvent.setup();
    render(<Menu panelSize="md" />);
    await user.click(screen.getByRole("button", { name: "Products" }));
    const link = await screen.findByRole("link", { name: /Analytics/ });
    expect(link.closest("[data-motion], [id*='content']")?.className).toMatch(/panelMd/);
  });

  it("lets an item set its own panel alignment when panels hang from their items", async () => {
    const user = userEvent.setup();
    render(
      <NavigationMenu aria-label="Primary" viewport={false}>
        <NavigationMenu.List>
          <NavigationMenu.Item value="a" panelAlign="end">
            <NavigationMenu.Trigger>A</NavigationMenu.Trigger>
            <NavigationMenu.Content>
              <NavigationMenu.Link href="/x">Inside</NavigationMenu.Link>
            </NavigationMenu.Content>
          </NavigationMenu.Item>
        </NavigationMenu.List>
      </NavigationMenu>,
    );
    await user.click(screen.getByRole("button", { name: "A" }));
    const link = await screen.findByRole("link", { name: "Inside" });
    expect(link.closest("[data-align]")).toHaveAttribute("data-align", "end");
  });

  it("has no accessibility violations stacked with every part", async () => {
    const { container } = render(
      <NavigationMenu aria-label="Primary" presentation="stacked" defaultValue="a">
        <NavigationMenu.List>
          <NavigationMenu.Item value="a">
            <NavigationMenu.Trigger href="/a" badge="New">
              A
            </NavigationMenu.Trigger>
            <NavigationMenu.Content>
              <NavigationMenu.Group label="G" href="/g">
                <NavigationMenu.Link href="/x" description="d">
                  X
                </NavigationMenu.Link>
              </NavigationMenu.Group>
              <NavigationMenu.Feature title="F" href="/f">
                text
              </NavigationMenu.Feature>
              <NavigationMenu.Footer>
                <NavigationMenu.Link href="/all">All</NavigationMenu.Link>
              </NavigationMenu.Footer>
            </NavigationMenu.Content>
          </NavigationMenu.Item>
        </NavigationMenu.List>
      </NavigationMenu>,
    );
    expect(await axe(container)).toHaveNoViolations();
  });
});

describe("a split trigger's naming", () => {
  it("lets an aria-label name the caret in place of labels.togglePanel", () => {
    render(
      <NavigationMenu aria-label="Primary">
        <NavigationMenu.List>
          <NavigationMenu.Item value="a">
            <NavigationMenu.Trigger href="/a" aria-label="More about A">
              A
            </NavigationMenu.Trigger>
            <NavigationMenu.Content>x</NavigationMenu.Content>
          </NavigationMenu.Item>
        </NavigationMenu.List>
      </NavigationMenu>,
    );
    expect(screen.getByRole("button", { name: "More about A" })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "A" })).toBeInTheDocument();
  });

  it("names a stacked split trigger's caret the same way", () => {
    render(
      <NavigationMenu aria-label="Primary" presentation="stacked">
        <NavigationMenu.List>
          <NavigationMenu.Item value="a">
            <NavigationMenu.Trigger href="/a" aria-label="More about A">
              A
            </NavigationMenu.Trigger>
            <NavigationMenu.Content>x</NavigationMenu.Content>
          </NavigationMenu.Item>
        </NavigationMenu.List>
      </NavigationMenu>,
    );
    expect(screen.getByRole("button", { name: "More about A" })).toBeInTheDocument();
  });
});

describe("development warnings", () => {
  function warnings(render_: () => void): string[] {
    const spy = vi.spyOn(console, "warn").mockImplementation(() => {});
    render_();
    const messages = spy.mock.calls.map((call) => String(call[0]));
    spy.mockRestore();
    return messages;
  }

  it("says an indicator that needs the shared panel area is not drawn", async () => {
    const messages = warnings(() => {
      render(<Menu indicator viewport={false} />);
    });
    await waitFor(() => undefined);
    expect(messages.some((message) => message.includes("`indicator` needs the shared panel area"))).toBe(true);
  });

  it("says exclusive is for the stacked form, and defaultValue is ignored when controlled", () => {
    const messages = warnings(() => {
      render(<Menu exclusive={false} />);
      render(<Menu value="" defaultValue="products" />);
    });
    expect(messages.some((message) => message.includes("`exclusive` only applies to the stacked form"))).toBe(true);
    expect(messages.some((message) => message.includes("`defaultValue` is ignored when `value` is controlled"))).toBe(true);
  });

  it("says defaultOpen on an item and forceMount on a stacked panel are ignored", () => {
    const messages = warnings(() => {
      render(
        <NavigationMenu aria-label="Primary">
          <NavigationMenu.List>
            <NavigationMenu.Item value="a" defaultOpen>
              <NavigationMenu.Trigger>A</NavigationMenu.Trigger>
              <NavigationMenu.Content>x</NavigationMenu.Content>
            </NavigationMenu.Item>
          </NavigationMenu.List>
        </NavigationMenu>,
      );
      render(
        <NavigationMenu aria-label="Stacked" presentation="stacked">
          <NavigationMenu.List>
            <NavigationMenu.Item value="b">
              <NavigationMenu.Trigger>B</NavigationMenu.Trigger>
              <NavigationMenu.Content forceMount>x</NavigationMenu.Content>
            </NavigationMenu.Item>
          </NavigationMenu.List>
        </NavigationMenu>,
      );
    });
    expect(messages.some((message) => message.includes("`defaultOpen` only applies to an uncontrolled stacked menu"))).toBe(true);
    expect(messages.some((message) => message.includes("belong to the floating panel"))).toBe(true);
  });

  it("says a link or trigger with no text has no accessible name, and says nothing of one that has", () => {
    const messages = warnings(() => {
      render(
        <NavigationMenu aria-label="Names">
          <NavigationMenu.List>
            <NavigationMenu.Item>
              <NavigationMenu.Link href="/x" icon={ChartBarIcon} />
            </NavigationMenu.Item>
            <NavigationMenu.Item value="t">
              <NavigationMenu.Trigger icon={ChartBarIcon} />
              <NavigationMenu.Content>x</NavigationMenu.Content>
            </NavigationMenu.Item>
            <NavigationMenu.Item>
              <NavigationMenu.Link href="/y" icon={ChartBarIcon} aria-label="Named">
                {null}
              </NavigationMenu.Link>
            </NavigationMenu.Item>
            <NavigationMenu.Item>
              <NavigationMenu.Link href="/z">Text</NavigationMenu.Link>
            </NavigationMenu.Item>
          </NavigationMenu.List>
        </NavigationMenu>,
      );
    });
    expect(messages.filter((message) => message.includes("NavigationMenu.Link: a link with no text"))).toHaveLength(1);
    expect(messages.filter((message) => message.includes("NavigationMenu.Trigger: a trigger with no text"))).toHaveLength(1);
  });
});
