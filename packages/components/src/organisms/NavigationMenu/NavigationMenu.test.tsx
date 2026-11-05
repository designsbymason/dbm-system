import { ChartBarIcon } from "@dbm-system/icons";
import { act, render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { axe } from "jest-axe";
import { createRef, StrictMode, useState } from "react";
import { describe, expect, it, vi } from "vitest";
import { Navbar } from "../Navbar";
import { NavigationMenu } from "./NavigationMenu";
import type { NavigationMenuProps } from "./NavigationMenu.types";

function Basic(props: Omit<Partial<NavigationMenuProps>, "onSelect"> & { onSelect?: (event: Event) => void; disabledLink?: boolean }) {
  const { onSelect, disabledLink, ...rest } = props;
  return (
    <NavigationMenu aria-label="Primary" {...rest}>
      <NavigationMenu.List>
        <NavigationMenu.Item value="products">
          <NavigationMenu.Trigger>Products</NavigationMenu.Trigger>
          <NavigationMenu.Content>
            <NavigationMenu.Group label="Platform" columns={2}>
              <NavigationMenu.Link href="/analytics" icon={ChartBarIcon} description="Dashboards for every team" onSelect={onSelect}>
                Analytics
              </NavigationMenu.Link>
              <NavigationMenu.Link href="/automation" disabled={disabledLink}>
                Automation
              </NavigationMenu.Link>
            </NavigationMenu.Group>
          </NavigationMenu.Content>
        </NavigationMenu.Item>
        <NavigationMenu.Item value="solutions">
          <NavigationMenu.Trigger current>Solutions</NavigationMenu.Trigger>
          <NavigationMenu.Content>
            <NavigationMenu.Link href="/support">Support</NavigationMenu.Link>
          </NavigationMenu.Content>
        </NavigationMenu.Item>
        <NavigationMenu.Item>
          <NavigationMenu.Link href="/pricing" current>
            Pricing
          </NavigationMenu.Link>
        </NavigationMenu.Item>
        <NavigationMenu.Item>
          <NavigationMenu.Link href="https://example.com/docs">Docs</NavigationMenu.Link>
        </NavigationMenu.Item>
      </NavigationMenu.List>
    </NavigationMenu>
  );
}

describe("NavigationMenu", () => {
  it("is a named navigation holding a list whose items are triggers and links", () => {
    render(<Basic />);
    const nav = screen.getByRole("navigation", { name: "Primary" });
    const list = within(nav).getByRole("list");
    expect(within(list).getAllByRole("listitem")).toHaveLength(4);
    expect(within(nav).getByRole("button", { name: "Products" })).toHaveAttribute("aria-expanded", "false");
    expect(within(nav).getByRole("link", { name: "Pricing" })).toHaveAttribute("aria-current", "page");
  });

  it("names the landmark from labels, aria-labelledby or the default", () => {
    const { rerender } = render(<NavigationMenu><NavigationMenu.List /></NavigationMenu>);
    expect(screen.getByRole("navigation", { name: "Main" })).toBeInTheDocument();
    rerender(<NavigationMenu labels={{ navigation: "Principal" }}><NavigationMenu.List /></NavigationMenu>);
    expect(screen.getByRole("navigation", { name: "Principal" })).toBeInTheDocument();
    rerender(<NavigationMenu labels={{ navigation: undefined }}><NavigationMenu.List /></NavigationMenu>);
    expect(screen.getByRole("navigation", { name: "Main" })).toBeInTheDocument();
  });

  // `delayDuration` is long in the two tests that press Escape just after a click: `user.click` moves the pointer onto the trigger, which
  // arms the primitive's hover-open timer, and Escape does not cancel it, so on a slow machine it fires after the close and reopens the panel.
  const NO_HOVER_OPEN = 60_000;

  it("opens a panel on a press, wiring aria-expanded and aria-controls, and closes it with Escape, returning focus", async () => {
    const user = userEvent.setup();
    render(<Basic delayDuration={NO_HOVER_OPEN} />);
    const trigger = screen.getByRole("button", { name: "Products" });
    await user.click(trigger);
    await waitFor(() => expect(trigger).toHaveAttribute("aria-expanded", "true"));
    const link = await screen.findByRole("link", { name: /Analytics/ });
    expect(link).toBeVisible();
    expect(trigger.getAttribute("aria-controls")).toBeTruthy();
    await user.keyboard("{Escape}");
    await waitFor(() => expect(trigger).toHaveAttribute("aria-expanded", "false"));
    expect(trigger).toHaveFocus();
  });

  it("opens with Enter from the keyboard and moves between triggers with the arrow keys", async () => {
    const user = userEvent.setup();
    render(<Basic />);
    const products = screen.getByRole("button", { name: "Products" });
    products.focus();
    await user.keyboard("{ArrowRight}");
    expect(screen.getByRole("button", { name: "Solutions" })).toHaveFocus();
    await user.keyboard("{ArrowLeft}{Enter}");
    await waitFor(() => expect(products).toHaveAttribute("aria-expanded", "true"));
  });

  it("includes a link's description and external cue in its name, with the icon hidden", async () => {
    const user = userEvent.setup();
    render(<Basic />);
    const docs = screen.getByRole("link", { name: /Docs/ });
    expect(docs.textContent).toBe("Docs (opens in a new tab)");
    expect(docs).toHaveAttribute("target", "_blank");
    // The cue's leading space is inside a visually hidden box, which the accessible-name computation in jsdom trims.
    expect(docs).toHaveAccessibleName(/^Docs\s*\(opens in a new tab\)$/);
    await user.click(screen.getByRole("button", { name: "Products" }));
    const link = await screen.findByRole("link", { name: "Analytics Dashboards for every team" });
    expect(link.querySelector("svg")).toHaveAttribute("aria-hidden", "true");
  });

  it("holds the open item in a controlled value and reports changes without changing it itself", async () => {
    const user = userEvent.setup();
    const onValueChange = vi.fn();
    render(<Basic value="" onValueChange={onValueChange} />);
    const trigger = screen.getByRole("button", { name: "Products" });
    await user.click(trigger);
    await waitFor(() => expect(onValueChange).toHaveBeenCalledWith("products"));
    expect(trigger).toHaveAttribute("aria-expanded", "false");
  });

  it("works controlled and wired to state", async () => {
    const user = userEvent.setup();
    function Wired() {
      const [value, setValue] = useState("");
      return (
        <>
          <Basic value={value} onValueChange={setValue} delayDuration={NO_HOVER_OPEN} />
          <output>{value}</output>
        </>
      );
    }
    render(<Wired />);
    await user.click(screen.getByRole("button", { name: "Solutions" }));
    await waitFor(() => expect(screen.getByRole("status")).toHaveTextContent("solutions"));
    await user.keyboard("{Escape}");
    await waitFor(() => expect(screen.getByRole("status")).toHaveTextContent(""));
  });

  it("starts open from defaultValue", async () => {
    render(<Basic defaultValue="products" />);
    expect(await screen.findByRole("link", { name: /Analytics/ })).toBeVisible();
    expect(screen.getByRole("button", { name: "Products" })).toHaveAttribute("aria-expanded", "true");
  });

  it("blocks a disabled link and keeps it in the tab order", async () => {
    const user = userEvent.setup();
    const onClick = vi.fn();
    render(
      <NavigationMenu>
        <NavigationMenu.List>
          <NavigationMenu.Item>
            <NavigationMenu.Link href="/x" disabled onClick={onClick}>
              Locked
            </NavigationMenu.Link>
          </NavigationMenu.Item>
        </NavigationMenu.List>
      </NavigationMenu>,
    );
    const link = screen.getByRole("link", { name: "Locked" });
    expect(link).toHaveAttribute("aria-disabled", "true");
    await user.tab();
    expect(link).toHaveFocus();
    await user.click(link);
    expect(onClick).not.toHaveBeenCalled();
  });

  it("makes a disabled trigger a native disabled button that does not open", async () => {
    const user = userEvent.setup();
    render(
      <NavigationMenu>
        <NavigationMenu.List>
          <NavigationMenu.Item value="a">
            <NavigationMenu.Trigger disabled>Locked</NavigationMenu.Trigger>
            <NavigationMenu.Content>Hidden</NavigationMenu.Content>
          </NavigationMenu.Item>
        </NavigationMenu.List>
      </NavigationMenu>,
    );
    const trigger = screen.getByRole("button", { name: "Locked" });
    expect(trigger).toBeDisabled();
    await user.click(trigger);
    expect(screen.queryByText("Hidden")).not.toBeInTheDocument();
  });

  it("lets onSelect keep the panel open with preventDefault", async () => {
    const user = userEvent.setup();
    render(<Basic onSelect={(event) => event.preventDefault()} />);
    const trigger = screen.getByRole("button", { name: "Products" });
    await user.click(trigger);
    const link = await screen.findByRole("link", { name: /Analytics/ });
    link.addEventListener("click", (event) => event.preventDefault());
    await user.click(link);
    expect(trigger).toHaveAttribute("aria-expanded", "true");
  });

  it("closes the panel when a link is chosen even if the caller's own onClick prevents the default", async () => {
    const user = userEvent.setup();
    render(
      <NavigationMenu aria-label="Primary">
        <NavigationMenu.List>
          <NavigationMenu.Item value="a">
            <NavigationMenu.Trigger>A</NavigationMenu.Trigger>
            <NavigationMenu.Content>
              <NavigationMenu.Link href="/x" onClick={(event) => event.preventDefault()}>
                Go
              </NavigationMenu.Link>
            </NavigationMenu.Content>
          </NavigationMenu.Item>
        </NavigationMenu.List>
      </NavigationMenu>,
    );
    const trigger = screen.getByRole("button", { name: "A" });
    await user.click(trigger);
    await user.click(await screen.findByRole("link", { name: "Go" }));
    await waitFor(() => expect(trigger).toHaveAttribute("aria-expanded", "false"));
  });

  it("does not let consumer props override the state it computes (every part)", () => {
    render(
      <NavigationMenu aria-label="Primary">
        <NavigationMenu.List>
          <NavigationMenu.Item value="a">
            <NavigationMenu.Trigger aria-expanded={true}>
              A
            </NavigationMenu.Trigger>
            <NavigationMenu.Content>x</NavigationMenu.Content>
          </NavigationMenu.Item>
          <NavigationMenu.Item>
            <NavigationMenu.Link href="/b" aria-current="false" current>
              B
            </NavigationMenu.Link>
          </NavigationMenu.Item>
        </NavigationMenu.List>
      </NavigationMenu>,
    );
    expect(screen.getByRole("button", { name: "A" })).toHaveAttribute("aria-expanded", "false");
    expect(screen.getByRole("link", { name: "B" })).toHaveAttribute("aria-current", "page");
  });

  it("forwards refs, ids and test ids on the root, list, item, trigger and link", () => {
    const root = createRef<HTMLElement>();
    const list = createRef<HTMLUListElement>();
    const item = createRef<HTMLLIElement>();
    const trigger = createRef<HTMLButtonElement>();
    const link = createRef<HTMLAnchorElement>();
    render(
      <NavigationMenu ref={root} id="root" data-testid="root" className="mine">
        <NavigationMenu.List ref={list} id="list" data-testid="list">
          <NavigationMenu.Item ref={item} id="item" data-testid="item">
            <NavigationMenu.Trigger ref={trigger} id="trigger" data-testid="trigger">
              T
            </NavigationMenu.Trigger>
            <NavigationMenu.Content>c</NavigationMenu.Content>
          </NavigationMenu.Item>
          <NavigationMenu.Item>
            <NavigationMenu.Link ref={link} href="/x" id="link" data-testid="link">
              L
            </NavigationMenu.Link>
          </NavigationMenu.Item>
        </NavigationMenu.List>
      </NavigationMenu>,
    );
    expect(root.current).toBe(screen.getByTestId("root"));
    expect(root.current).toHaveClass("mine");
    expect(list.current).toBe(screen.getByTestId("list"));
    expect(item.current).toBe(screen.getByTestId("item"));
    expect(trigger.current).toBe(screen.getByTestId("trigger"));
    expect(link.current).toBe(screen.getByTestId("link"));
  });

  it("marks the item that holds the current page and the current link in the chosen look", () => {
    render(<Basic currentVariant="solid" rounded />);
    const trigger = screen.getByRole("button", { name: "Solutions" });
    expect(trigger.className).toMatch(/currentSolid/);
    expect(trigger.className).toMatch(/rounded/);
    expect(trigger).not.toHaveAttribute("aria-current");
  });

  it("draws a panel under its own item with viewport={false}", async () => {
    const user = userEvent.setup();
    render(<Basic viewport={false} />);
    await user.click(screen.getByRole("button", { name: "Products" }));
    const link = await screen.findByRole("link", { name: /Analytics/ });
    expect(link.closest("li")?.parentElement?.closest("li")).toBe(screen.getByRole("button", { name: "Products" }).closest("li"));
  });

  it("survives StrictMode", async () => {
    const user = userEvent.setup();
    render(
      <StrictMode>
        <Basic />
      </StrictMode>,
    );
    await user.click(screen.getByRole("button", { name: "Products" }));
    expect(await screen.findByRole("link", { name: /Analytics/ })).toBeVisible();
  });

  describe("stacked", () => {
    it("draws disclosure buttons whose links nest beneath them, one open at a time", async () => {
      const user = userEvent.setup();
      render(<Basic presentation="stacked" />);
      const products = screen.getByRole("button", { name: "Products" });
      const solutions = screen.getByRole("button", { name: "Solutions" });
      expect(screen.queryByRole("link", { name: /Analytics/ })).not.toBeInTheDocument();
      await user.click(products);
      expect(products).toHaveAttribute("aria-expanded", "true");
      expect(document.getElementById(products.getAttribute("aria-controls") as string)).not.toHaveAttribute("hidden");
      expect(screen.getByRole("link", { name: /Analytics/ })).toBeVisible();
      await user.click(solutions);
      expect(products).toHaveAttribute("aria-expanded", "false");
      expect(solutions).toHaveAttribute("aria-expanded", "true");
      await user.click(solutions);
      expect(solutions).toHaveAttribute("aria-expanded", "false");
    });

    it("is not the primitive: no focus proxies and the links are plain tab stops", async () => {
      const user = userEvent.setup();
      render(<Basic presentation="stacked" defaultValue="products" />);
      await user.tab();
      expect(screen.getByRole("button", { name: "Products" })).toHaveFocus();
      await user.tab();
      expect(screen.getByRole("link", { name: /Analytics/ })).toHaveFocus();
    });

    it("lets onSelect keep it open and otherwise closes the open item on a link", async () => {
      const user = userEvent.setup();
      const keep = vi.fn((event: Event) => event.preventDefault());
      const { rerender } = render(<Basic presentation="stacked" defaultValue="products" onSelect={keep} />);
      const link = screen.getByRole("link", { name: /Analytics/ });
      link.addEventListener("click", (event) => event.preventDefault());
      await user.click(link);
      expect(keep).toHaveBeenCalled();
      expect(screen.getByRole("button", { name: "Products" })).toHaveAttribute("aria-expanded", "true");
      rerender(<Basic presentation="stacked" defaultValue="products" />);
      await user.click(screen.getByRole("link", { name: /Analytics/ }));
      expect(screen.getByRole("button", { name: "Products" })).toHaveAttribute("aria-expanded", "false");
    });
  });

  describe("inside a Navbar", () => {
    function InBar({ closeMenuOnNavigate = true }: { closeMenuOnNavigate?: boolean }) {
      return (
        <Navbar closeMenuOnNavigate={closeMenuOnNavigate} currentVariant="solid" rounded>
          <Navbar.Brand>Acme</Navbar.Brand>
          <Navbar.Links aria-label="Primary">
            <NavigationMenu>
              <NavigationMenu.List>
                <NavigationMenu.Item value="products">
                  <NavigationMenu.Trigger>Products</NavigationMenu.Trigger>
                  <NavigationMenu.Content>
                    <NavigationMenu.Link href="#analytics">Analytics</NavigationMenu.Link>
                  </NavigationMenu.Content>
                </NavigationMenu.Item>
                <NavigationMenu.Item>
                  <NavigationMenu.Link href="#pricing" current>
                    Pricing
                  </NavigationMenu.Link>
                </NavigationMenu.Item>
              </NavigationMenu.List>
            </NavigationMenu>
          </Navbar.Links>
        </Navbar>
      );
    }

    it("is a list item in the bar's landmark, takes the bar's current look and rounding, and adds no landmark", () => {
      render(<InBar />);
      const bar = screen.getAllByRole("navigation", { hidden: true });
      expect(bar).toHaveLength(1);
      const pricing = screen.getAllByRole("link", { name: "Pricing", hidden: true })[0] as HTMLElement;
      expect(pricing.className).toMatch(/currentSolid/);
      expect(pricing.className).toMatch(/rounded/);
      expect(pricing.closest("nav")).toBe(bar[0]);
    });

    it("is stacked in the menu panel, and a link chosen there closes the panel", async () => {
      const user = userEvent.setup();
      render(<InBar />);
      await user.click(screen.getByRole("button", { name: "Menu" }));
      const dialog = await screen.findByRole("dialog");
      const products = within(dialog).getByRole("button", { name: "Products" });
      await user.click(products);
      const link = within(dialog).getByRole("link", { name: "Analytics" });
      link.addEventListener("click", (event) => event.preventDefault());
      await user.click(link);
      await waitFor(() => expect(screen.queryByRole("dialog")).not.toBeInTheDocument());
    });

    it("leaves the panel open when the bar does not close it on navigation", async () => {
      const user = userEvent.setup();
      render(<InBar closeMenuOnNavigate={false} />);
      await user.click(screen.getByRole("button", { name: "Menu" }));
      const dialog = await screen.findByRole("dialog");
      await user.click(within(dialog).getByRole("button", { name: "Products" }));
      const link = within(dialog).getByRole("link", { name: "Analytics" });
      link.addEventListener("click", (event) => event.preventDefault());
      await user.click(link);
      expect(screen.getByRole("dialog")).toBeInTheDocument();
    });
  });

  describe("accessibility", () => {
    it("has no violations closed, open, stacked and in right-to-left", async () => {
      const user = userEvent.setup();
      const { container, unmount } = render(<Basic />);
      expect(await axe(container)).toHaveNoViolations();
      await user.click(screen.getByRole("button", { name: "Products" }));
      await screen.findByRole("link", { name: /Analytics/ });
      expect(await axe(document.body)).toHaveNoViolations();
      unmount();
      const stacked = render(<Basic presentation="stacked" defaultValue="products" dir="rtl" />);
      expect(await axe(stacked.container)).toHaveNoViolations();
    });

    it("states role list and listitem on the list it styles", () => {
      render(<Basic presentation="stacked" defaultValue="products" />);
      for (const list of screen.getAllByRole("list")) expect(list.tagName).toBe("UL");
      for (const item of screen.getAllByRole("listitem")) expect(item).toHaveAttribute("role", "listitem");
    });
  });

  it("passes the direction to the primitive", async () => {
    await act(async () => {
      render(<Basic dir="rtl" />);
    });
    expect(screen.getByRole("navigation", { name: "Primary" })).toHaveAttribute("dir", "rtl");
  });
});
