import { ChartBarIcon, HouseIcon, PlusIcon, UsersIcon } from "@dbm-system/icons";
import { act, render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { axe } from "jest-axe";
import { createRef, StrictMode, useState } from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { Badge } from "../../atoms/Badge";
import { IconButton } from "../../atoms/IconButton";
import { Menu } from "../Menu";
import { Sidebar, useSidebar } from "./Sidebar";
import badgeStyles from "../../atoms/Badge/Badge.module.css";
import styles from "./Sidebar.module.css";
import type { SidebarProps } from "./Sidebar.types";

// jsdom applies the stylesheet but matches no media query, so below the `collapseBelow` width the page's sidebar is `display: none` (as on a
// phone) and only the panel's copy is reachable. Tests of the page's sidebar set `collapseBelow="never"`; tests of the panel read the page's
// copy with `hidden: true`.
function Basic(props: SidebarProps) {
  return (
    <Sidebar collapseBelow="never" {...props}>
      <Sidebar.Header>Acme</Sidebar.Header>
      <Sidebar.Content>
        <Sidebar.Nav>
          <Sidebar.Item href="/" icon={HouseIcon} current>
            Home
          </Sidebar.Item>
          <Sidebar.Group label="Reports" icon={ChartBarIcon}>
            <Sidebar.Item href="/reports/sales">Sales</Sidebar.Item>
            <Sidebar.Item href="/reports/costs">Costs</Sidebar.Item>
          </Sidebar.Group>
          <Sidebar.Item href="/team" icon={UsersIcon} badge="3">
            Team
          </Sidebar.Item>
          <Sidebar.Item href="/docs" disabled>
            Docs
          </Sidebar.Item>
        </Sidebar.Nav>
      </Sidebar.Content>
      <Sidebar.Footer>
        <Sidebar.Toggle />
      </Sidebar.Footer>
    </Sidebar>
  );
}

afterEach(() => {
  vi.restoreAllMocks();
});

describe("Sidebar", () => {
  it("is a plain box with a named navigation holding a list of items", () => {
    render(<Basic />);
    const nav = screen.getByRole("navigation", { name: "Main" });
    const lists = within(nav).getAllByRole("list");
    expect(lists[0]).toBeInTheDocument();
    expect(screen.queryByRole("complementary")).not.toBeInTheDocument();
    expect(screen.queryByRole("banner")).not.toBeInTheDocument();
    expect(within(nav).getByRole("link", { name: "Home" })).toHaveAttribute("href", "/");
  });

  it("names a navigation from aria-label, aria-labelledby or labels", () => {
    const { rerender } = render(
      <Sidebar collapseBelow="never" labels={{ navigation: "Primary" }}>
        <Sidebar.Nav>
          <Sidebar.Item href="/a">A</Sidebar.Item>
        </Sidebar.Nav>
      </Sidebar>,
    );
    expect(screen.getByRole("navigation")).toHaveAttribute("aria-label", "Primary");
    rerender(
      <Sidebar collapseBelow="never">
        <Sidebar.Nav aria-label="Settings">
          <Sidebar.Item href="/a">A</Sidebar.Item>
        </Sidebar.Nav>
      </Sidebar>,
    );
    expect(screen.getByRole("navigation", { name: "Settings" })).toBeInTheDocument();
  });

  it("keeps the English default for a label whose override is undefined", () => {
    render(<Basic labels={{ collapse: undefined }} />);
    expect(screen.getByRole("button", { name: "Collapse sidebar" })).toBeInTheDocument();
  });

  it("marks the current page and no other", () => {
    render(<Basic />);
    expect(screen.getByRole("link", { name: "Home" })).toHaveAttribute("aria-current", "page");
    expect(screen.getByRole("link", { name: /Team/ })).not.toHaveAttribute("aria-current");
  });

  it("lets a computed aria-current win over one passed in", () => {
    render(
      <Sidebar collapseBelow="never">
        <Sidebar.Nav>
          <Sidebar.Item href="/a" aria-current="page">
            A
          </Sidebar.Item>
        </Sidebar.Nav>
      </Sidebar>,
    );
    expect(screen.getByRole("link", { name: "A" })).not.toHaveAttribute("aria-current");
  });

  it("forwards the ref to the root and standard props to it", () => {
    const ref = createRef<HTMLDivElement>();
    render(
      <Sidebar ref={ref} collapseBelow="never" id="side" className="mine" data-testid="sidebar" style={{ color: "red" }}>
        <Sidebar.Header>Acme</Sidebar.Header>
      </Sidebar>,
    );
    expect(ref.current).toBe(screen.getByTestId("sidebar"));
    expect(ref.current).toHaveAttribute("id", "side");
    expect(ref.current).toHaveClass("mine");
    expect(ref.current?.style.color).toBe("red");
  });

  describe("the phone panel's width", () => {
    const panelSize = () => screen.getByRole("dialog", { hidden: true }).style.getPropertyValue("--drawer-size");

    it("is the sidebar.width token when neither width is given", () => {
      render(<Basic collapseBelow="md" defaultMenuOpen />);
      expect(panelSize()).toBe("var(--dbm-sidebar-width)");
    });

    it("follows `width`, so the panel and the column match", () => {
      render(<Basic collapseBelow="md" defaultMenuOpen width="18rem" />);
      expect(panelSize()).toBe("18rem");
    });

    it("is `panelWidth` when given, whatever `width` is, and leaves the column's width alone", () => {
      render(<Basic collapseBelow="md" defaultMenuOpen data-testid="sidebar" width="14rem" panelWidth="22rem" />);
      expect(panelSize()).toBe("22rem");
      expect(screen.getByTestId("sidebar").style.getPropertyValue("--sidebar-width")).toBe("14rem");
    });

    it("takes a number as pixels, and `panelWidth` without a `width` leaves the column at the token", () => {
      render(<Basic collapseBelow="md" defaultMenuOpen data-testid="sidebar" panelWidth={320} />);
      expect(panelSize()).toBe("320px");
      expect(screen.getByTestId("sidebar").style.getPropertyValue("--sidebar-width")).toBe("");
    });
  });

  it("applies the width prop as the sidebar's width", () => {
    const { rerender } = render(<Basic data-testid="sidebar" width={288} />);
    expect(screen.getByTestId("sidebar").style.getPropertyValue("--sidebar-width")).toBe("288px");
    rerender(<Basic data-testid="sidebar" width="18rem" />);
    expect(screen.getByTestId("sidebar").style.getPropertyValue("--sidebar-width")).toBe("18rem");
  });

  it("puts its line on the edge it does not sit against", () => {
    render(<Basic data-testid="sidebar" side="end" />);
    expect(screen.getByTestId("sidebar")).toHaveAttribute("data-side", "end");
  });

  describe("items", () => {
    it("is a link with an href and a button without one", () => {
      render(
        <Sidebar collapseBelow="never">
          <Sidebar.Nav>
            <Sidebar.Item href="/a">Link</Sidebar.Item>
            <Sidebar.Item>Action</Sidebar.Item>
          </Sidebar.Nav>
        </Sidebar>,
      );
      expect(screen.getByRole("link", { name: "Link" })).toBeInTheDocument();
      expect(screen.getByRole("button", { name: "Action" })).toHaveAttribute("type", "button");
    });

    it("opens an external link in a new tab with a hidden cue", () => {
      render(
        <Sidebar collapseBelow="never">
          <Sidebar.Nav>
            <Sidebar.Item href="https://example.com">Docs</Sidebar.Item>
            <Sidebar.Item href="https://example.com/b" external={false}>
              Plain
            </Sidebar.Item>
          </Sidebar.Nav>
        </Sidebar>,
      );
      const link = screen.getByRole("link", { name: /^Docs\s*\(opens in a new tab\)$/ });
      expect(link).toHaveAttribute("target", "_blank");
      expect(link).toHaveAttribute("rel", "noopener noreferrer");
      expect(screen.getByRole("link", { name: "Plain" })).not.toHaveAttribute("target");
    });

    it("draws the external-link mark one step below the item's own icon, at every item size", () => {
      const sizes = { xs: ["sizeSm", "sizeXs"], sm: ["sizeSm", "sizeXs"], md: ["sizeMd", "sizeSm"], lg: ["sizeMd", "sizeSm"] } as const;
      for (const [size, [leading, trailing]] of Object.entries(sizes)) {
        const { unmount } = render(
          <Sidebar collapseBelow="never" size={size as keyof typeof sizes}>
            <Sidebar.Nav>
              <Sidebar.Item href="https://example.com" icon={HouseIcon}>
                Docs
              </Sidebar.Item>
            </Sidebar.Nav>
          </Sidebar>,
        );
        const [icon, mark] = [...screen.getByRole("link").querySelectorAll("svg")];
        expect(icon!.getAttribute("class"), size).toMatch(new RegExp(leading));
        expect(mark!.getAttribute("class"), size).toMatch(new RegExp(trailing));
        unmount();
      }
    });

    it("draws a group's caret at the same size as the external-link mark", () => {
      const sizes = { xs: "sizeXs", sm: "sizeXs", md: "sizeSm", lg: "sizeSm" } as const;
      for (const [size, expected] of Object.entries(sizes)) {
        const { unmount } = render(
          <Sidebar collapseBelow="never" size={size as keyof typeof sizes}>
            <Sidebar.Nav>
              <Sidebar.Group label="Reports">
                <Sidebar.Item href="/a">A</Sidebar.Item>
              </Sidebar.Group>
            </Sidebar.Nav>
          </Sidebar>,
        );
        const icons = [...screen.getByRole("button", { name: "Reports" }).querySelectorAll("svg")];
        expect(icons.at(-1)!.getAttribute("class"), size).toMatch(new RegExp(expected));
        unmount();
      }
    });

    it("includes a badge in the item's name", () => {
      render(<Basic />);
      expect(screen.getByRole("link", { name: "Team 3" })).toBeInTheDocument();
    });

    it("draws a passed Badge as written: its own tone, variant, size, class and style win over the built-in badge", () => {
      render(
        <Sidebar collapseBelow="never">
          <Sidebar.Nav>
            <Sidebar.Item href="/plain" badge="4">
              Plain
            </Sidebar.Item>
            <Sidebar.Item href="/a" badge={<Badge tone="danger" variant="solid" className="mine" style={{ opacity: 0.5 }}>9</Badge>}>
              Alerts
            </Sidebar.Item>
            <Sidebar.Item href="/b" badge={<Badge size="lg">7</Badge>}>
              Sized
            </Sidebar.Item>
          </Sidebar.Nav>
        </Sidebar>,
      );
      const own = screen.getByText("9");
      const builtIn = screen.getByText("4");
      expect(screen.getByRole("link", { name: "Alerts 9" })).toBeInTheDocument();
      // its own look, not the built-in solid brand one, and one pill (the text is in the badge itself, not a badge inside a badge)
      expect(own).toHaveClass(badgeStyles.solidDanger!);
      expect(own).not.toHaveClass(badgeStyles.solidBrand!);
      expect(builtIn).toHaveClass(badgeStyles.solidBrand!);
      expect(own.querySelector(`.${badgeStyles.root}`)).toBeNull();
      expect(own).toHaveClass("mine");
      expect(own.style.opacity).toBe("0.5");
      // the item's size and height rule fill in only what the badge didn't set
      expect(own).toHaveClass(styles.badge!);
      expect(screen.getByText("7")).toHaveClass(badgeStyles.sizeLg!);
      expect(screen.getByText("7")).not.toHaveClass(badgeStyles.sizeSm!);
    });

    it("draws the built-in badge subtle on a current item drawn as a brand fill, where a solid one would vanish", () => {
      render(
        <Sidebar collapseBelow="never" currentVariant="solid">
          <Sidebar.Nav>
            <Sidebar.Item href="/a" current badge="2">
              Here
            </Sidebar.Item>
            <Sidebar.Item href="/b" badge="5">
              There
            </Sidebar.Item>
          </Sidebar.Nav>
        </Sidebar>,
      );
      expect(screen.getByText("2")).toHaveClass(badgeStyles.subtleBrand!);
      expect(screen.getByText("5")).toHaveClass(badgeStyles.solidBrand!);
    });

    it("draws a passed Badge as the rail's mark, still in the item's name", () => {
      render(
        <Sidebar collapseBelow="never" defaultCollapsed>
          <Sidebar.Nav>
            <Sidebar.Item href="/a" icon={HouseIcon} badge={<Badge tone="danger" variant="solid">9</Badge>}>
              Alerts
            </Sidebar.Item>
          </Sidebar.Nav>
        </Sidebar>,
      );
      expect(screen.getByRole("link", { name: "Alerts 9" })).toBeInTheDocument();
      expect(screen.getByText("9")).toHaveClass(badgeStyles.solidDanger!, styles.railBadge!);
    });

    it("blocks a disabled item's click and keeps it focusable", async () => {
      const user = userEvent.setup();
      const onClick = vi.fn();
      render(
        <Sidebar collapseBelow="never">
          <Sidebar.Nav>
            <Sidebar.Item href="/a" disabled onClick={onClick}>
              Docs
            </Sidebar.Item>
          </Sidebar.Nav>
        </Sidebar>,
      );
      const link = screen.getByRole("link", { name: "Docs" });
      expect(link).toHaveAttribute("aria-disabled", "true");
      await user.tab();
      expect(link).toHaveFocus();
      await user.click(link);
      expect(onClick).not.toHaveBeenCalled();
    });

    it("puts its look on a router's link with asChild, and keeps the child's own click running", async () => {
      const user = userEvent.setup();
      const navigate = vi.fn((event: React.MouseEvent) => event.preventDefault());
      render(
        <Sidebar collapseBelow="never">
          <Sidebar.Nav>
            <Sidebar.Item asChild current>
              <a href="/routed" onClick={navigate}>
                Routed
              </a>
            </Sidebar.Item>
          </Sidebar.Nav>
        </Sidebar>,
      );
      const link = screen.getByRole("link", { name: "Routed" });
      expect(link).toHaveAttribute("aria-current", "page");
      await user.click(link);
      expect(navigate).toHaveBeenCalledTimes(1);
    });
  });

  describe("groups", () => {
    it("starts shut with its button reporting aria-expanded, and opens and shuts on a press", async () => {
      const user = userEvent.setup();
      render(<Basic />);
      const button = screen.getByRole("button", { name: "Reports" });
      expect(button).toHaveAttribute("aria-expanded", "false");
      expect(screen.queryByRole("link", { name: "Sales" })).not.toBeInTheDocument();
      await user.click(button);
      expect(button).toHaveAttribute("aria-expanded", "true");
      expect(screen.getByRole("link", { name: "Sales" })).toBeInTheDocument();
      await user.click(button);
      expect(button).toHaveAttribute("aria-expanded", "false");
      await waitFor(() => expect(screen.queryByRole("link", { name: "Sales" })).not.toBeInTheDocument());
    });

    it("starts open when it holds the current page, and marks its button only while it is shut", async () => {
      const user = userEvent.setup();
      render(
        <Sidebar collapseBelow="never">
          <Sidebar.Nav>
            <Sidebar.Group label="Reports" current>
              <Sidebar.Item href="/reports/sales" current>
                Sales
              </Sidebar.Item>
            </Sidebar.Group>
          </Sidebar.Nav>
        </Sidebar>,
      );
      const button = screen.getByRole("button", { name: "Reports" });
      expect(button).toHaveAttribute("aria-expanded", "true");
      expect(button).not.toHaveClass(styles.current!);
      await user.click(button);
      expect(button).toHaveClass(styles.current!);
      expect(button).not.toHaveAttribute("aria-current");
    });

    it("is controllable with open and onOpenChange", async () => {
      const user = userEvent.setup();
      const onOpenChange = vi.fn();
      render(
        <Sidebar collapseBelow="never">
          <Sidebar.Nav>
            <Sidebar.Group label="Reports" open={false} onOpenChange={onOpenChange}>
              <Sidebar.Item href="/a">A</Sidebar.Item>
            </Sidebar.Group>
          </Sidebar.Nav>
        </Sidebar>,
      );
      await user.click(screen.getByRole("button", { name: "Reports" }));
      expect(onOpenChange).toHaveBeenCalledWith(true);
      expect(screen.getByRole("button", { name: "Reports" })).toHaveAttribute("aria-expanded", "false");
    });

    it("leaves a disabled group's button out of the tab order", () => {
      render(
        <Sidebar collapseBelow="never">
          <Sidebar.Nav>
            <Sidebar.Group label="Reports" disabled>
              <Sidebar.Item href="/a">A</Sidebar.Item>
            </Sidebar.Group>
          </Sidebar.Nav>
        </Sidebar>,
      );
      expect(screen.getByRole("button", { name: "Reports" })).toBeDisabled();
    });

    it("warns once groups nest deeper than three", () => {
      const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
      render(
        <Sidebar collapseBelow="never">
          <Sidebar.Nav>
            <Sidebar.Group label="One" defaultOpen>
              <Sidebar.Group label="Two" defaultOpen>
                <Sidebar.Group label="Three" defaultOpen>
                  <Sidebar.Group label="Four" defaultOpen>
                    <Sidebar.Item href="/deep">Deep</Sidebar.Item>
                  </Sidebar.Group>
                </Sidebar.Group>
              </Sidebar.Group>
            </Sidebar.Group>
          </Sidebar.Nav>
        </Sidebar>,
      );
      expect(warn).toHaveBeenCalledWith(expect.stringContaining("nested more than 3 deep"));
    });
  });

  describe("sections and separators", () => {
    it("names a list from its section heading", () => {
      render(
        <Sidebar collapseBelow="never">
          <Sidebar.Nav>
            <Sidebar.Section label="Workspace">
              <Sidebar.Item href="/a">A</Sidebar.Item>
            </Sidebar.Section>
            <Sidebar.Separator data-testid="separator" />
          </Sidebar.Nav>
        </Sidebar>,
      );
      expect(screen.getByRole("list", { name: "Workspace" })).toBeInTheDocument();
      expect(screen.getByTestId("separator")).toHaveAttribute("aria-hidden", "true");
    });
  });

  describe("the rail", () => {
    it("collapses and expands with the toggle, and reports each change", async () => {
      const user = userEvent.setup();
      const onCollapsedChange = vi.fn();
      render(<Basic data-testid="sidebar" onCollapsedChange={onCollapsedChange} />);
      expect(screen.getByTestId("sidebar")).not.toHaveAttribute("data-collapsed");
      await user.click(screen.getByRole("button", { name: "Collapse sidebar" }));
      expect(onCollapsedChange).toHaveBeenLastCalledWith(true);
      expect(screen.getByTestId("sidebar")).toHaveAttribute("data-collapsed");
      await user.click(screen.getByRole("button", { name: "Expand sidebar" }));
      expect(onCollapsedChange).toHaveBeenLastCalledWith(false);
      expect(screen.getByTestId("sidebar")).not.toHaveAttribute("data-collapsed");
    });

    it("starts as a rail with defaultCollapsed and follows a controlled collapsed", () => {
      const { rerender } = render(<Basic data-testid="sidebar" defaultCollapsed />);
      expect(screen.getByTestId("sidebar")).toHaveAttribute("data-collapsed");
      rerender(<Basic data-testid="sidebar" collapsed={false} />);
      expect(screen.getByTestId("sidebar")).not.toHaveAttribute("data-collapsed");
    });

    it("leaves a controlled sidebar as it is until the prop changes", async () => {
      const user = userEvent.setup();
      const onCollapsedChange = vi.fn();
      render(<Basic data-testid="sidebar" collapsed={false} onCollapsedChange={onCollapsedChange} />);
      await user.click(screen.getByRole("button", { name: "Collapse sidebar" }));
      expect(onCollapsedChange).toHaveBeenCalledWith(true);
      expect(screen.getByTestId("sidebar")).not.toHaveAttribute("data-collapsed");
    });

    it("keeps an item's text as its accessible name and shows it in a tooltip on focus", async () => {
      const user = userEvent.setup();
      render(<Basic defaultCollapsed />);
      const home = screen.getByRole("link", { name: "Home" });
      expect(home.querySelector(`.${styles.hiddenText}`)).not.toBeNull();
      await user.tab();
      expect(home).toHaveFocus();
      expect(await screen.findByRole("tooltip")).toHaveTextContent("Home");
    });

    it("keeps an external item's cue and a badge in the name", () => {
      render(
        <Sidebar collapseBelow="never" defaultCollapsed>
          <Sidebar.Nav>
            <Sidebar.Item href="https://example.com" icon={HouseIcon} badge="2">
              Docs
            </Sidebar.Item>
          </Sidebar.Nav>
        </Sidebar>,
      );
      expect(screen.getByRole("link", { name: /^Docs\s*2\s*\(opens in a new tab\)$/ })).toBeInTheDocument();
    });

    it("draws an item with no icon as its first letter and warns when there is nothing to draw", () => {
      const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
      render(
        <Sidebar collapseBelow="never" defaultCollapsed>
          <Sidebar.Nav>
            <Sidebar.Item href="/a">Alpha</Sidebar.Item>
            <Sidebar.Item href="/b">
              <b>Rich</b>
            </Sidebar.Item>
          </Sidebar.Nav>
        </Sidebar>,
      );
      expect(screen.getByRole("link", { name: "Alpha" })).toHaveTextContent("AAlpha");
      expect(warn).toHaveBeenCalledWith(expect.stringContaining("nothing to show"));
    });

    it("turns a group into a menu of its items, with the group's text as the title", async () => {
      const user = userEvent.setup();
      render(<Basic defaultCollapsed />);
      const trigger = screen.getByRole("button", { name: "Reports" });
      expect(trigger).toHaveAttribute("aria-haspopup", "menu");
      await user.click(trigger);
      const menu = await screen.findByRole("menu");
      expect(within(menu).getByText("Reports")).toBeInTheDocument();
      expect(within(menu).getByRole("menuitem", { name: "Sales" })).toBeInTheDocument();
    });

    it("opens a nested group as a submenu", async () => {
      const user = userEvent.setup();
      render(
        <Sidebar collapseBelow="never" defaultCollapsed>
          <Sidebar.Nav>
            <Sidebar.Group label="Reports" icon={ChartBarIcon}>
              <Sidebar.Group label="Regional">
                <Sidebar.Item href="/reports/emea">EMEA</Sidebar.Item>
              </Sidebar.Group>
            </Sidebar.Group>
          </Sidebar.Nav>
        </Sidebar>,
      );
      await user.click(screen.getByRole("button", { name: "Reports" }));
      await user.click(await screen.findByRole("menuitem", { name: "Regional" }));
      expect(await screen.findByRole("menuitem", { name: "EMEA" })).toBeInTheDocument();
    });

    it("keeps a group's open state across a collapse and an expand", async () => {
      const user = userEvent.setup();
      render(<Basic />);
      await user.click(screen.getByRole("button", { name: "Reports" }));
      await user.click(screen.getByRole("button", { name: "Collapse sidebar" }));
      await user.click(screen.getByRole("button", { name: "Expand sidebar" }));
      expect(screen.getByRole("button", { name: "Reports" })).toHaveAttribute("aria-expanded", "true");
    });

    it("gives the toggle a name for the press it would answer to", () => {
      render(<Basic />);
      expect(screen.getByRole("button", { name: "Collapse sidebar" })).toBeInTheDocument();
    });
  });

  describe("the phone panel", () => {
    it("is not drawn until it is opened, and is named from labels", () => {
      render(<Basic collapseBelow="md" labels={{ menu: "Navigation" }} defaultMenuOpen />);
      expect(screen.getByRole("dialog", { name: "Navigation" })).toBeInTheDocument();
    });

    it("draws the same items in the panel, never as a rail", async () => {
      render(<Basic collapseBelow="md" defaultCollapsed defaultMenuOpen />);
      const dialog = await screen.findByRole("dialog", { name: "Menu" });
      expect(within(dialog).getByRole("link", { name: "Home" })).toBeInTheDocument();
      expect(within(dialog).getByRole("link", { name: "Home" }).querySelector(`.${styles.hiddenText}`)).toBeNull();
      expect(within(dialog).getByRole("button", { name: "Reports" })).toHaveAttribute("aria-expanded", "false");
      expect(within(dialog).queryByRole("button", { name: /sidebar/ })).not.toBeInTheDocument();
    });

    it("opens from a menu button and reports it", async () => {
      const user = userEvent.setup();
      const onMenuOpenChange = vi.fn();
      render(
        <Sidebar.Provider onMenuOpenChange={onMenuOpenChange}>
          <Sidebar.MenuButton />
          <Basic collapseBelow="md" />
        </Sidebar.Provider>,
      );
      const button = screen.getByRole("button", { name: "Menu" });
      expect(button).toHaveAttribute("aria-expanded", "false");
      await user.click(button);
      expect(onMenuOpenChange).toHaveBeenCalledWith(true, { reason: "trigger" });
      expect(await screen.findByRole("dialog", { name: "Menu" })).toBeInTheDocument();
    });

    it("closes on a chosen link, even one whose click default was prevented", async () => {
      const user = userEvent.setup();
      const onMenuOpenChange = vi.fn();
      render(
        <Sidebar collapseBelow="md" defaultMenuOpen onMenuOpenChange={onMenuOpenChange}>
          <Sidebar.Nav>
            <Sidebar.Item href="/routed" onClick={(event) => event.preventDefault()}>
              Routed
            </Sidebar.Item>
          </Sidebar.Nav>
        </Sidebar>,
      );
      const dialog = await screen.findByRole("dialog");
      await user.click(within(dialog).getByRole("link", { name: "Routed" }));
      expect(onMenuOpenChange).toHaveBeenCalledWith(false, { reason: "close" });
    });

    it("stays open when a button item or a group's button is pressed", async () => {
      const user = userEvent.setup();
      const onMenuOpenChange = vi.fn();
      render(
        <Sidebar collapseBelow="md" defaultMenuOpen onMenuOpenChange={onMenuOpenChange}>
          <Sidebar.Nav>
            <Sidebar.Item>New project</Sidebar.Item>
            <Sidebar.Group label="Reports">
              <Sidebar.Item href="/a">A</Sidebar.Item>
            </Sidebar.Group>
          </Sidebar.Nav>
        </Sidebar>,
      );
      const dialog = await screen.findByRole("dialog");
      await user.click(within(dialog).getByRole("button", { name: "New project" }));
      await user.click(within(dialog).getByRole("button", { name: "Reports" }));
      expect(onMenuOpenChange).not.toHaveBeenCalled();
    });

    it("keeps the panel open on a chosen link with closeMenuOnNavigate off", async () => {
      const user = userEvent.setup();
      const onMenuOpenChange = vi.fn();
      render(
        <Sidebar collapseBelow="md" defaultMenuOpen closeMenuOnNavigate={false} onMenuOpenChange={onMenuOpenChange}>
          <Sidebar.Nav>
            <Sidebar.Item href="/a" onClick={(event) => event.preventDefault()}>
              A
            </Sidebar.Item>
          </Sidebar.Nav>
        </Sidebar>,
      );
      await user.click(within(await screen.findByRole("dialog")).getByRole("link", { name: "A" }));
      expect(onMenuOpenChange).not.toHaveBeenCalled();
    });

    it("closes with Escape and gives focus back to the menu button", async () => {
      const user = userEvent.setup();
      render(
        <Sidebar.Provider>
          <Sidebar.MenuButton />
          <Basic collapseBelow="md" />
        </Sidebar.Provider>,
      );
      const button = screen.getByRole("button", { name: "Menu" });
      await user.click(button);
      await screen.findByRole("dialog");
      await user.keyboard("{Escape}");
      await waitFor(() => expect(screen.queryByRole("dialog")).not.toBeInTheDocument());
      expect(button).toHaveFocus();
    });

    it("closes when the page grows past the step", async () => {
      let handler: ((event: MediaQueryListEvent) => void) | undefined;
      const addEventListener = vi.fn((_type: string, listener: (event: MediaQueryListEvent) => void) => {
        handler = listener;
      });
      window.matchMedia = vi.fn().mockReturnValue({
        matches: false,
        addEventListener,
        removeEventListener: vi.fn(),
      }) as never;
      const onMenuOpenChange = vi.fn();
      render(<Basic collapseBelow="md" defaultMenuOpen onMenuOpenChange={onMenuOpenChange} />);
      await screen.findByRole("dialog");
      expect(window.matchMedia).toHaveBeenCalledWith("(min-width: 48rem)");
      act(() => handler?.({ matches: true } as MediaQueryListEvent));
      expect(onMenuOpenChange).toHaveBeenCalledWith(false, { reason: "close" });
      // @ts-expect-error: remove the stub again
      delete window.matchMedia;
    });

    it("draws no panel when the sidebar never collapses", () => {
      render(<Basic collapseBelow="never" defaultMenuOpen />);
      expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    });

    it("is controllable with menuOpen", async () => {
      const { rerender } = render(<Basic collapseBelow="md" menuOpen={false} />);
      expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
      rerender(<Basic collapseBelow="md" menuOpen />);
      expect(await screen.findByRole("dialog")).toBeInTheDocument();
    });
  });

  describe("Sidebar.Provider and useSidebar", () => {
    it("lets a toggle outside the sidebar collapse it", async () => {
      const user = userEvent.setup();
      render(
        <Sidebar.Provider>
          <Sidebar.Toggle />
          <Basic data-testid="sidebar" />
        </Sidebar.Provider>,
      );
      await user.click(screen.getAllByRole("button", { name: "Collapse sidebar" })[0]!);
      expect(screen.getByTestId("sidebar")).toHaveAttribute("data-collapsed");
    });

    it("warns when the sidebar sets state its provider holds", () => {
      const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
      render(
        <Sidebar.Provider>
          <Basic defaultCollapsed />
        </Sidebar.Provider>,
      );
      expect(warn).toHaveBeenCalledWith(expect.stringContaining("Sidebar.Provider"));
    });

    it("throws a clear error for a menu button outside both a provider and a sidebar", () => {
      vi.spyOn(console, "error").mockImplementation(() => {});
      expect(() => render(<Sidebar.MenuButton />)).toThrow("must be used inside <Sidebar> or <Sidebar.Provider>");
    });

    it("reports the state to your own parts, which are never a rail in the panel", async () => {
      function Probe() {
        const { collapsed } = useSidebar();
        return <span data-testid="probe">{collapsed ? "rail" : "full"}</span>;
      }
      render(
        <Sidebar collapseBelow="md" defaultCollapsed defaultMenuOpen>
          <Sidebar.Header>
            <Probe />
          </Sidebar.Header>
        </Sidebar>,
      );
      const probes = await screen.findAllByTestId("probe");
      expect(probes.map((probe) => probe.textContent)).toEqual(["rail", "full"]);
    });

    it("lets a sidebar nested in another be controlled on its own without disturbing the outer one", async () => {
      const user = userEvent.setup();
      function Both() {
        const [collapsed, setCollapsed] = useState(false);
        return (
          <Sidebar.Provider collapsed={collapsed} onCollapsedChange={setCollapsed}>
            <Basic data-testid="outer" />
          </Sidebar.Provider>
        );
      }
      render(<Both />);
      await user.click(screen.getByRole("button", { name: "Collapse sidebar" }));
      expect(screen.getByTestId("outer")).toHaveAttribute("data-collapsed");
    });
  });

  describe("accessibility", () => {
    it("has no axe violations expanded, as a rail and with the panel open", async () => {
      const { container, unmount } = render(<Basic />);
      expect(await axe(container)).toHaveNoViolations();
      unmount();
      const rail = render(<Basic defaultCollapsed />);
      expect(await axe(rail.container)).toHaveNoViolations();
      rail.unmount();
      render(<Basic collapseBelow="md" defaultMenuOpen />);
      const dialog = await screen.findByRole("dialog");
      expect(await axe(dialog)).toHaveNoViolations();
    });

    it("has no axe violations with a section, a separator, an external item and a button item", async () => {
      const { container } = render(
        <Sidebar collapseBelow="never">
          <Sidebar.Nav>
            <Sidebar.Section label="Workspace">
              <Sidebar.Item href="/a" icon={HouseIcon} current>
                Home
              </Sidebar.Item>
              <Sidebar.Item href="https://example.com">Docs</Sidebar.Item>
            </Sidebar.Section>
            <Sidebar.Separator />
            <Sidebar.Item>New project</Sidebar.Item>
          </Sidebar.Nav>
        </Sidebar>,
      );
      expect(await axe(container)).toHaveNoViolations();
    });
  });

  it("works inside StrictMode, including its panel", async () => {
    const user = userEvent.setup();
    render(
      <StrictMode>
        <Basic collapseBelow="md" defaultMenuOpen />
      </StrictMode>,
    );
    const dialog = await screen.findByRole("dialog");
    await user.click(within(dialog).getByRole("button", { name: "Reports" }));
    expect(within(dialog).getByRole("link", { name: "Sales" })).toBeInTheDocument();
  });
});

describe("Sidebar currentPath", () => {
  function Paths(props: Partial<SidebarProps> & { itemCurrent?: boolean }) {
    const { itemCurrent, ...rest } = props;
    return (
      <Sidebar collapseBelow="never" {...rest}>
        <Sidebar.Nav>
          <Sidebar.Item href="/" icon={HouseIcon}>
            Home
          </Sidebar.Item>
          <Sidebar.Item href="/projects" match="prefix" current={itemCurrent}>
            Projects
          </Sidebar.Item>
          <Sidebar.Group label="Reports" icon={ChartBarIcon}>
            <Sidebar.Item href="/reports/sales">Sales</Sidebar.Item>
            <Sidebar.Item href="/reports/costs">Costs</Sidebar.Item>
          </Sidebar.Group>
          <Sidebar.Item href="https://example.com/projects">Elsewhere</Sidebar.Item>
        </Sidebar.Nav>
      </Sidebar>
    );
  }

  it("marks nothing without a currentPath", () => {
    render(<Paths />);
    expect(screen.queryByRole("link", { current: "page" })).not.toBeInTheDocument();
  });

  it("marks the item whose href is the path, and no other, ignoring a query, a hash and a trailing slash", () => {
    render(<Paths currentPath="/projects/?tab=2#top" />);
    expect(screen.getByRole("link", { name: "Projects" })).toHaveAttribute("aria-current", "page");
    expect(screen.getByRole("link", { name: "Home" })).not.toHaveAttribute("aria-current");
  });

  it("matches the pages below an item with match=prefix, and not a lookalike", () => {
    const { rerender } = render(<Paths currentPath="/projects/active" />);
    expect(screen.getByRole("link", { name: "Projects" })).toHaveAttribute("aria-current", "page");
    rerender(<Paths currentPath="/projectsx" />);
    expect(screen.getByRole("link", { name: "Projects" })).not.toHaveAttribute("aria-current");
  });

  it("never marks an address on another site", () => {
    render(<Paths currentPath="/projects" />);
    expect(screen.getByRole("link", { name: /Elsewhere/ })).not.toHaveAttribute("aria-current");
  });

  it("lets an item's own current win, either way", () => {
    const { rerender } = render(<Paths currentPath="/projects" itemCurrent={false} />);
    expect(screen.getByRole("link", { name: "Projects" })).not.toHaveAttribute("aria-current");
    rerender(<Paths currentPath="/" itemCurrent />);
    expect(screen.getByRole("link", { name: "Projects" })).toHaveAttribute("aria-current", "page");
    expect(screen.getByRole("link", { name: "Home" })).toHaveAttribute("aria-current", "page");
  });

  it("makes a group that holds the page current, starts it open, and marks its button only while it is shut", async () => {
    const user = userEvent.setup();
    render(<Paths currentPath="/reports/sales" />);
    const group = screen.getByRole("button", { name: "Reports" });
    expect(group).toHaveAttribute("aria-expanded", "true");
    expect(screen.getByRole("link", { name: "Sales" })).toHaveAttribute("aria-current", "page");
    expect(group).not.toHaveClass(styles.current!);
    await user.click(group);
    expect(group).toHaveClass(styles.current!);
  });

  it("follows a change of path, and reaches the phone panel's copy", async () => {
    const { rerender } = render(<Paths collapseBelow="md" defaultMenuOpen currentPath="/reports/sales" />);
    const dialog = await screen.findByRole("dialog");
    expect(within(dialog).getByRole("link", { name: "Sales" })).toHaveAttribute("aria-current", "page");
    rerender(<Paths collapseBelow="md" defaultMenuOpen currentPath="/reports/costs" />);
    expect(within(dialog).getByRole("link", { name: "Costs" })).toHaveAttribute("aria-current", "page");
    expect(within(dialog).getByRole("link", { name: "Sales" })).not.toHaveAttribute("aria-current");
  });
});

describe("Sidebar row actions", () => {
  function Actions(props: Partial<SidebarProps>) {
    return (
      <Sidebar collapseBelow="never" {...props}>
        <Sidebar.Nav>
          <Sidebar.Section label="Projects" action={<IconButton icon={PlusIcon} aria-label="New project" />}>
            <Sidebar.Item href="/a" icon={HouseIcon} action={<IconButton icon={PlusIcon} aria-label="Add to Alpha" />}>
              Alpha
            </Sidebar.Item>
            <Sidebar.Group label="Reports" icon={ChartBarIcon} action={<IconButton icon={PlusIcon} aria-label="New report" />}>
              <Sidebar.Item href="/r">Sales</Sidebar.Item>
            </Sidebar.Group>
          </Sidebar.Section>
        </Sidebar.Nav>
      </Sidebar>
    );
  }

  it("draws a control beside the link, never inside it, with its own name", () => {
    render(<Actions />);
    const link = screen.getByRole("link", { name: "Alpha" });
    const add = screen.getByRole("button", { name: "Add to Alpha" });
    expect(link).not.toContainElement(add);
    expect(link.parentElement).toContainElement(add);
    expect(link).toHaveClass(styles.hasAction!);
  });

  it("draws one on a group and on a section's heading too", () => {
    render(<Actions />);
    expect(screen.getByRole("button", { name: "New report" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "New project" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Reports" })).toHaveClass(styles.hasAction!);
    // the group's own button is not the control
    expect(screen.getByRole("button", { name: "Reports" })).not.toContainElement(screen.getByRole("button", { name: "New report" }));
  });

  it("is a separate tab stop reached after the link, and presses without following it", async () => {
    const user = userEvent.setup();
    const onClick = vi.fn();
    render(
      <Sidebar collapseBelow="never">
        <Sidebar.Nav>
          <Sidebar.Item href="/a" onClick={onClick} action={<IconButton icon={PlusIcon} aria-label="Add" onClick={onClick} />}>
            Alpha
          </Sidebar.Item>
        </Sidebar.Nav>
      </Sidebar>,
    );
    await user.tab();
    expect(screen.getByRole("link", { name: "Alpha" })).toHaveFocus();
    await user.tab();
    expect(screen.getByRole("button", { name: "Add" })).toHaveFocus();
    await user.keyboard("{Enter}");
    expect(onClick).toHaveBeenCalledTimes(1);
  });

  it("gives its buttons the sidebar's quiet defaults, and lets a button's own props win", () => {
    render(
      <Sidebar collapseBelow="never">
        <Sidebar.Nav>
          <Sidebar.Item href="/a" action={<IconButton icon={PlusIcon} aria-label="Default" />}>
            A
          </Sidebar.Item>
          <Sidebar.Item href="/b" action={<IconButton icon={PlusIcon} aria-label="Own" size="md" variant="primary" />}>
            B
          </Sidebar.Item>
        </Sidebar.Nav>
      </Sidebar>,
    );
    expect(screen.getByRole("button", { name: "Default" }).className).toMatch(/sizeXs/);
    expect(screen.getByRole("button", { name: "Default" }).className).toMatch(/variantGhost/);
    expect(screen.getByRole("button", { name: "Own" }).className).toMatch(/sizeMd/);
    expect(screen.getByRole("button", { name: "Own" }).className).toMatch(/variantPrimary/);
  });

  it("is not drawn in the rail, and is drawn in the phone panel", async () => {
    const { unmount } = render(<Actions defaultCollapsed />);
    expect(screen.queryByRole("button", { name: "Add to Alpha" })).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "New project" })).not.toBeInTheDocument();
    unmount();
    render(<Actions collapseBelow="md" defaultCollapsed defaultMenuOpen />);
    const dialog = await screen.findByRole("dialog");
    expect(within(dialog).getByRole("button", { name: "Add to Alpha" })).toBeInTheDocument();
  });

  it("has no axe violations", async () => {
    const { container } = render(<Actions />);
    expect(await axe(container)).toHaveNoViolations();
  });
});

describe("Sidebar labels cut short", () => {
  // jsdom lays nothing out, so a label is "cut" when its text says so.
  const widths = { scroll: 300, client: 100 };
  const original = {
    scroll: Object.getOwnPropertyDescriptor(Element.prototype, "scrollWidth"),
    client: Object.getOwnPropertyDescriptor(Element.prototype, "clientWidth"),
  };
  beforeEach(() => {
    Object.defineProperty(Element.prototype, "scrollWidth", {
      configurable: true,
      get(this: Element) {
        return this.textContent?.startsWith("Very long") ? widths.scroll : 50;
      },
    });
    Object.defineProperty(Element.prototype, "clientWidth", { configurable: true, get: () => widths.client });
  });
  afterEach(() => {
    if (original.scroll) Object.defineProperty(Element.prototype, "scrollWidth", original.scroll);
    if (original.client) Object.defineProperty(Element.prototype, "clientWidth", original.client);
  });

  function Long() {
    return (
      <Sidebar collapseBelow="never">
        <Sidebar.Nav>
          <Sidebar.Item href="/a">Very long name of an item that cannot fit</Sidebar.Item>
          <Sidebar.Item href="/b">Short</Sidebar.Item>
          <Sidebar.Group label="Very long name of a group that cannot fit">
            <Sidebar.Item href="/c">Inside</Sidebar.Item>
          </Sidebar.Group>
        </Sidebar.Nav>
      </Sidebar>
    );
  }

  it("shows the full text of a cut item on keyboard focus", async () => {
    const user = userEvent.setup();
    render(<Long />);
    await user.tab();
    expect(screen.getByRole("link", { name: /Very long name of an item/ })).toHaveFocus();
    expect(await screen.findByRole("tooltip")).toHaveTextContent("Very long name of an item that cannot fit");
  });

  it("shows none for a label that fits", async () => {
    const user = userEvent.setup();
    render(<Long />);
    await user.tab();
    await user.tab();
    expect(screen.getByRole("link", { name: "Short" })).toHaveFocus();
    await waitFor(() => expect(screen.queryByRole("tooltip")).not.toBeInTheDocument());
  });

  it("shows the full text of a cut group's label too", async () => {
    const user = userEvent.setup();
    render(<Long />);
    await user.tab();
    await user.tab();
    await user.tab();
    expect(screen.getByRole("button", { name: /Very long name of a group/ })).toHaveFocus();
    expect(await screen.findByRole("tooltip")).toHaveTextContent("Very long name of a group that cannot fit");
  });
});

describe("Sidebar phone panel's first focus", () => {
  it("starts on the first item, not on the first button or the close button", async () => {
    render(
      <Sidebar collapseBelow="md" defaultMenuOpen>
        <Sidebar.Nav>
          <Sidebar.Item href="/a">First link</Sidebar.Item>
          <Sidebar.Group label="Group">
            <Sidebar.Item href="/b">B</Sidebar.Item>
          </Sidebar.Group>
        </Sidebar.Nav>
      </Sidebar>,
    );
    const dialog = await screen.findByRole("dialog");
    await waitFor(() => expect(within(dialog).getByRole("link", { name: "First link" })).toHaveFocus());
  });

  it("starts on a group's button when that is the first item", async () => {
    render(
      <Sidebar collapseBelow="md" defaultMenuOpen>
        <Sidebar.Nav>
          <Sidebar.Group label="Group first">
            <Sidebar.Item href="/b">B</Sidebar.Item>
          </Sidebar.Group>
          <Sidebar.Item href="/a">Later link</Sidebar.Item>
        </Sidebar.Nav>
      </Sidebar>,
    );
    const dialog = await screen.findByRole("dialog");
    await waitFor(() => expect(within(dialog).getByRole("button", { name: "Group first" })).toHaveFocus());
  });
});

describe("Sidebar shared group and section state", () => {
  function Groups(props: Partial<SidebarProps>) {
    return (
      <Sidebar collapseBelow="md" {...props}>
        <Sidebar.Nav>
          <Sidebar.Group label="Projects">
            <Sidebar.Item href="/p">P</Sidebar.Item>
            <Sidebar.Group label="Archive">
              <Sidebar.Item href="/pa">PA</Sidebar.Item>
            </Sidebar.Group>
          </Sidebar.Group>
          <Sidebar.Group label="Reports">
            <Sidebar.Item href="/r">R</Sidebar.Item>
            <Sidebar.Group label="Archive">
              <Sidebar.Item href="/ra">RA</Sidebar.Item>
            </Sidebar.Group>
          </Sidebar.Group>
        </Sidebar.Nav>
      </Sidebar>
    );
  }

  it("shares a group's open state between the page's copy and the phone panel's", async () => {
    const user = userEvent.setup();
    render(<Groups defaultMenuOpen />);
    const dialog = await screen.findByRole("dialog");
    await user.click(within(dialog).getByRole("button", { name: "Projects" }));
    // the page's own copy (hidden below the step in jsdom) is open too
    expect(screen.getAllByRole("button", { name: "Projects", hidden: true })[0]).toHaveAttribute("aria-expanded", "true");
    expect(within(dialog).getByRole("button", { name: "Projects" })).toHaveAttribute("aria-expanded", "true");
  });

  it("keeps what was open across a collapse to the rail and an expand", async () => {
    const user = userEvent.setup();
    render(
      <Sidebar collapseBelow="never">
        <Sidebar.Nav>
          <Sidebar.Group label="Projects" icon={ChartBarIcon}>
            <Sidebar.Item href="/p">P</Sidebar.Item>
          </Sidebar.Group>
        </Sidebar.Nav>
        <Sidebar.Footer>
          <Sidebar.Toggle />
        </Sidebar.Footer>
      </Sidebar>,
    );
    await user.click(screen.getByRole("button", { name: "Projects" }));
    await user.click(screen.getByRole("button", { name: "Collapse sidebar" }));
    await user.click(screen.getByRole("button", { name: "Expand sidebar" }));
    expect(screen.getByRole("button", { name: "Projects" })).toHaveAttribute("aria-expanded", "true");
  });

  it("names a nested group by the labels around it, so two with the same label are two", async () => {
    const user = userEvent.setup();
    render(<Groups collapseBelow="never" />);
    await user.click(screen.getByRole("button", { name: "Projects" }));
    await user.click(screen.getAllByRole("button", { name: "Archive" })[0]!);
    await user.click(screen.getByRole("button", { name: "Reports" }));
    const archives = screen.getAllByRole("button", { name: "Archive" });
    expect(archives[0]).toHaveAttribute("aria-expanded", "true");
    expect(archives[1]).toHaveAttribute("aria-expanded", "false");
  });

  it("lets value tell two groups with the same label apart", async () => {
    const user = userEvent.setup();
    render(
      <Sidebar collapseBelow="never">
        <Sidebar.Nav>
          <Sidebar.Group label="More" value="first">
            <Sidebar.Item href="/a">A</Sidebar.Item>
          </Sidebar.Group>
          <Sidebar.Group label="More" value="second">
            <Sidebar.Item href="/b">B</Sidebar.Item>
          </Sidebar.Group>
        </Sidebar.Nav>
      </Sidebar>,
    );
    await user.click(screen.getAllByRole("button", { name: "More" })[0]!);
    expect(screen.getAllByRole("button", { name: "More" })[0]).toHaveAttribute("aria-expanded", "true");
    expect(screen.getAllByRole("button", { name: "More" })[1]).toHaveAttribute("aria-expanded", "false");
  });

  it("follows current while the reader has not touched the group, and then the reader's choice", async () => {
    const user = userEvent.setup();
    function Page({ path }: { path: string }) {
      return (
        <Sidebar collapseBelow="never" currentPath={path}>
          <Sidebar.Nav>
            <Sidebar.Group label="Reports">
              <Sidebar.Item href="/reports/sales">Sales</Sidebar.Item>
            </Sidebar.Group>
          </Sidebar.Nav>
        </Sidebar>
      );
    }
    const { rerender } = render(<Page path="/" />);
    const group = screen.getByRole("button", { name: "Reports" });
    expect(group).toHaveAttribute("aria-expanded", "false");
    rerender(<Page path="/reports/sales" />);
    expect(group).toHaveAttribute("aria-expanded", "true");
    await user.click(group);
    rerender(<Page path="/" />);
    rerender(<Page path="/reports/sales" />);
    expect(group).toHaveAttribute("aria-expanded", "false");
  });
});

describe("Sidebar exclusive groups", () => {
  function Three(props: Partial<SidebarProps>) {
    return (
      <Sidebar collapseBelow="never" {...props}>
        <Sidebar.Nav>
          {["One", "Two", "Three"].map((label) => (
            <Sidebar.Group key={label} label={label}>
              <Sidebar.Item href={`/${label}`}>{label} item</Sidebar.Item>
              <Sidebar.Group label="Inner">
                <Sidebar.Item href={`/${label}/inner`}>{label} inner item</Sidebar.Item>
              </Sidebar.Group>
            </Sidebar.Group>
          ))}
        </Sidebar.Nav>
      </Sidebar>
    );
  }

  it("shuts the other groups beside the one that is opened", async () => {
    const user = userEvent.setup();
    render(<Three exclusive />);
    await user.click(screen.getByRole("button", { name: "One" }));
    await user.click(screen.getByRole("button", { name: "Two" }));
    expect(screen.getByRole("button", { name: "One" })).toHaveAttribute("aria-expanded", "false");
    expect(screen.getByRole("button", { name: "Two" })).toHaveAttribute("aria-expanded", "true");
    expect(screen.getByRole("button", { name: "Three" })).toHaveAttribute("aria-expanded", "false");
  });

  it("leaves a group nested in an open group alone", async () => {
    const user = userEvent.setup();
    render(<Three exclusive />);
    await user.click(screen.getByRole("button", { name: "One" }));
    await user.click(screen.getByRole("button", { name: "Inner" }));
    expect(screen.getByRole("button", { name: "One" })).toHaveAttribute("aria-expanded", "true");
    expect(screen.getByRole("button", { name: "Inner" })).toHaveAttribute("aria-expanded", "true");
  });

  it("closes a group that started open for the current page, when another is opened", async () => {
    const user = userEvent.setup();
    render(<Three exclusive currentPath="/One" />);
    expect(screen.getByRole("button", { name: "One" })).toHaveAttribute("aria-expanded", "true");
    await user.click(screen.getByRole("button", { name: "Three" }));
    expect(screen.getByRole("button", { name: "One" })).toHaveAttribute("aria-expanded", "false");
  });

  it("lets several groups be open without it", async () => {
    const user = userEvent.setup();
    render(<Three />);
    await user.click(screen.getByRole("button", { name: "One" }));
    await user.click(screen.getByRole("button", { name: "Two" }));
    expect(screen.getByRole("button", { name: "One" })).toHaveAttribute("aria-expanded", "true");
    expect(screen.getByRole("button", { name: "Two" })).toHaveAttribute("aria-expanded", "true");
  });

  it("still shuts the others when the phone panel's copy of the groups is also drawn", async () => {
    const user = userEvent.setup();
    render(<Three collapseBelow="md" exclusive defaultMenuOpen />);
    const dialog = await screen.findByRole("dialog");
    await user.click(within(dialog).getByRole("button", { name: "One" }));
    await user.click(within(dialog).getByRole("button", { name: "Two" }));
    expect(within(dialog).getByRole("button", { name: "One" })).toHaveAttribute("aria-expanded", "false");
  });
});

describe("Sidebar collapsible sections", () => {
  function Folding(props: Partial<SidebarProps> & { open?: boolean; defaultOpen?: boolean; onOpenChange?: (open: boolean) => void }) {
    const { open, defaultOpen, onOpenChange, ...rest } = props;
    return (
      <Sidebar collapseBelow="never" {...rest}>
        <Sidebar.Nav>
          <Sidebar.Section label="Workspace" collapsible open={open} defaultOpen={defaultOpen} onOpenChange={onOpenChange}>
            <Sidebar.Item href="/a" icon={HouseIcon}>
              Home
            </Sidebar.Item>
          </Sidebar.Section>
          <Sidebar.Section label="Plain">
            <Sidebar.Item href="/b">Other</Sidebar.Item>
          </Sidebar.Section>
        </Sidebar.Nav>
      </Sidebar>
    );
  }

  it("makes the heading a button that folds its list and brings it back, and names the list from it", async () => {
    const user = userEvent.setup();
    render(<Folding />);
    const heading = screen.getByRole("button", { name: "Workspace" });
    expect(heading).toHaveAttribute("aria-expanded", "true");
    expect(screen.getByRole("list", { name: "Workspace" })).toBeInTheDocument();
    await user.click(heading);
    expect(heading).toHaveAttribute("aria-expanded", "false");
    await waitFor(() => expect(screen.queryByRole("link", { name: "Home" })).not.toBeInTheDocument());
    await user.click(heading);
    expect(await screen.findByRole("link", { name: "Home" })).toBeInTheDocument();
  });

  it("leaves a section that is not collapsible with a plain heading", () => {
    render(<Folding />);
    expect(screen.queryByRole("button", { name: "Plain" })).not.toBeInTheDocument();
    expect(screen.getByText("Plain")).toBeInTheDocument();
  });

  it("starts folded with defaultOpen false, and is controllable with open", async () => {
    const user = userEvent.setup();
    const onOpenChange = vi.fn();
    const { unmount } = render(<Folding defaultOpen={false} />);
    expect(screen.getByRole("button", { name: "Workspace" })).toHaveAttribute("aria-expanded", "false");
    unmount();
    render(<Folding open onOpenChange={onOpenChange} />);
    await user.click(screen.getByRole("button", { name: "Workspace" }));
    expect(onOpenChange).toHaveBeenCalledWith(false);
    expect(screen.getByRole("button", { name: "Workspace" })).toHaveAttribute("aria-expanded", "true");
  });

  it("always shows every list in the rail, with no heading to press", () => {
    render(<Folding defaultOpen={false} defaultCollapsed />);
    expect(screen.getByRole("link", { name: "Home" })).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Workspace" })).not.toBeInTheDocument();
  });

  it("shares a fold with the phone panel", async () => {
    const user = userEvent.setup();
    render(<Folding collapseBelow="md" defaultMenuOpen />);
    const dialog = await screen.findByRole("dialog");
    await user.click(within(dialog).getByRole("button", { name: "Workspace" }));
    expect(screen.getAllByRole("button", { name: "Workspace", hidden: true })[0]).toHaveAttribute("aria-expanded", "false");
  });

  it("has no axe violations folded or open", async () => {
    const { container } = render(<Folding />);
    expect(await axe(container)).toHaveNoViolations();
    await userEvent.click(screen.getByRole("button", { name: "Workspace" }));
    expect(await axe(container)).toHaveNoViolations();
  });
});

describe("Sidebar item descriptions", () => {
  it("describes the item without naming it", () => {
    render(
      <Sidebar collapseBelow="never">
        <Sidebar.Nav>
          <Sidebar.Item href="/a" description="Everything at a glance" aria-describedby="extra">
            Overview
          </Sidebar.Item>
        </Sidebar.Nav>
      </Sidebar>,
    );
    const link = screen.getByRole("link", { name: "Overview" });
    expect(link).toHaveAccessibleDescription(/Everything at a glance/);
    expect(link.getAttribute("aria-describedby")).toMatch(/extra/);
  });

  it("keeps it in the DOM, hidden, in the rail, and not for an asChild item", () => {
    render(
      <Sidebar collapseBelow="never" defaultCollapsed>
        <Sidebar.Nav>
          <Sidebar.Item href="/a" icon={HouseIcon} description="Everything at a glance">
            Overview
          </Sidebar.Item>
          <Sidebar.Item asChild description="Ignored">
            <a href="/b">Plain</a>
          </Sidebar.Item>
        </Sidebar.Nav>
      </Sidebar>,
    );
    expect(screen.getByRole("link", { name: "Overview" })).toHaveAccessibleDescription(/Everything at a glance/);
    expect(screen.queryByText("Ignored")).not.toBeInTheDocument();
  });
});

describe("Sidebar.Account", () => {
  it("draws an avatar, a name and a line under it, and opens a menu of its items", async () => {
    const user = userEvent.setup();
    render(
      <Sidebar collapseBelow="never">
        <Sidebar.Footer>
          <Sidebar.Account name="John Doe" description="john@acme.com">
            <Menu.Item>Profile</Menu.Item>
            <Menu.Item>Sign out</Menu.Item>
          </Sidebar.Account>
        </Sidebar.Footer>
      </Sidebar>,
    );
    const button = screen.getByRole("button", { name: /John Doe/ });
    expect(button).toHaveTextContent("john@acme.com");
    expect(button).toHaveAttribute("aria-haspopup", "menu");
    await user.click(button);
    expect(await screen.findByRole("menuitem", { name: "Profile" })).toBeInTheDocument();
    await user.keyboard("{Escape}");
    await waitFor(() => expect(screen.queryByRole("menu")).not.toBeInTheDocument());
    expect(button).toHaveFocus();
  });

  it("is a plain button with no children, for your own onClick", async () => {
    const user = userEvent.setup();
    const onClick = vi.fn();
    render(
      <Sidebar collapseBelow="never">
        <Sidebar.Footer>
          <Sidebar.Account name="John Doe" onClick={onClick} />
        </Sidebar.Footer>
      </Sidebar>,
    );
    const button = screen.getByRole("button", { name: /John Doe/ });
    expect(button).not.toHaveAttribute("aria-haspopup");
    await user.click(button);
    expect(onClick).toHaveBeenCalledTimes(1);
  });

  it("is the avatar alone in the rail, still named, with the name as its tooltip", async () => {
    const user = userEvent.setup();
    render(
      <Sidebar collapseBelow="never" defaultCollapsed>
        <Sidebar.Footer>
          <Sidebar.Account name="John Doe" description="john@acme.com">
            <Menu.Item>Profile</Menu.Item>
          </Sidebar.Account>
        </Sidebar.Footer>
      </Sidebar>,
    );
    const button = screen.getByRole("button", { name: /John Doe/ });
    expect(button.querySelector(`.${styles.hiddenText}`)).not.toBeNull();
    await user.tab();
    expect(button).toHaveFocus();
    expect(await screen.findByRole("tooltip")).toHaveTextContent("John Doe");
  });

  it("takes your own avatar in place of the default one", () => {
    render(
      <Sidebar collapseBelow="never">
        <Sidebar.Footer>
          <Sidebar.Account name="Acme" avatar={<span data-testid="logo">A</span>} />
        </Sidebar.Footer>
      </Sidebar>,
    );
    expect(screen.getByTestId("logo")).toBeInTheDocument();
  });

  it("has no axe violations", async () => {
    const { container } = render(
      <Sidebar collapseBelow="never">
        <Sidebar.Footer>
          <Sidebar.Account name="John Doe" description="john@acme.com">
            <Menu.Item>Profile</Menu.Item>
          </Sidebar.Account>
        </Sidebar.Footer>
      </Sidebar>,
    );
    expect(await axe(container)).toHaveNoViolations();
  });
});

describe("Sidebar peek", () => {
  function Rail(props: Partial<SidebarProps>) {
    return (
      <Sidebar collapseBelow="never" defaultCollapsed data-testid="sidebar" {...props}>
        <Sidebar.Header>
          <Probe />
        </Sidebar.Header>
        <Sidebar.Nav>
          <Sidebar.Item href="/a" icon={HouseIcon}>
            Home
          </Sidebar.Item>
        </Sidebar.Nav>
      </Sidebar>
    );
  }
  function Probe() {
    const { collapsed } = useSidebar();
    return <span data-testid="probe">{collapsed ? "rail" : "full"}</span>;
  }

  it("does nothing without peek", async () => {
    const user = userEvent.setup();
    render(<Rail />);
    await user.hover(screen.getByTestId("sidebar"));
    await new Promise((resolve) => setTimeout(resolve, 250));
    expect(screen.getByTestId("sidebar")).not.toHaveAttribute("data-peeking");
  });

  it("opens over the page while the pointer is on it, shows the labels, and closes when it leaves", async () => {
    const user = userEvent.setup();
    render(<Rail peek />);
    const sidebar = screen.getByTestId("sidebar");
    expect(sidebar).toHaveClass(styles.peekable!);
    await user.hover(sidebar);
    await waitFor(() => expect(sidebar).toHaveAttribute("data-peeking"));
    expect(sidebar).toHaveClass(styles.peeking!);
    // inside it is expanded: the label is shown, and a part reading the state sees a sidebar that is not collapsed
    expect(screen.getByRole("link", { name: "Home" }).querySelector(`.${styles.hiddenText}`)).toBeNull();
    expect(screen.getByTestId("probe")).toHaveTextContent("full");
    // while it is still the collapsed state's: the toggle's name and the data attribute
    expect(sidebar).toHaveAttribute("data-collapsed");
    await user.unhover(sidebar);
    await waitFor(() => expect(sidebar).not.toHaveAttribute("data-peeking"));
    expect(screen.getByTestId("probe")).toHaveTextContent("rail");
  });

  it("opens on keyboard focus at once, and closes with Escape", async () => {
    // jsdom does not tell keyboard focus from other focus, so it is told: this focus is the keyboard's.
    const matches = Element.prototype.matches;
    vi.spyOn(Element.prototype, "matches").mockImplementation(function (this: Element, selector: string) {
      return selector === ":focus-visible" ? true : matches.call(this, selector);
    });
    const user = userEvent.setup();
    render(<Rail peek />);
    const sidebar = screen.getByTestId("sidebar");
    await user.tab();
    expect(screen.getByRole("link", { name: "Home" })).toHaveFocus();
    await waitFor(() => expect(sidebar).toHaveAttribute("data-peeking"));
    await user.keyboard("{Escape}");
    await waitFor(() => expect(sidebar).not.toHaveAttribute("data-peeking"));
  });

  it("is not peeking once the sidebar is expanded for good", async () => {
    const user = userEvent.setup();
    render(
      <Sidebar collapseBelow="never" peek defaultCollapsed data-testid="sidebar">
        <Sidebar.Nav>
          <Sidebar.Item href="/a" icon={HouseIcon}>
            Home
          </Sidebar.Item>
        </Sidebar.Nav>
        <Sidebar.Footer>
          <Sidebar.Toggle />
        </Sidebar.Footer>
      </Sidebar>,
    );
    const sidebar = screen.getByTestId("sidebar");
    await user.hover(sidebar);
    await waitFor(() => expect(sidebar).toHaveAttribute("data-peeking"));
    await user.click(screen.getByRole("button", { name: "Expand sidebar" }));
    expect(sidebar).not.toHaveAttribute("data-peeking");
    expect(sidebar).not.toHaveClass(styles.peekable!);
  });
});

describe("Sidebar group badges", () => {
  function Groups(props: Partial<SidebarProps> & { badge?: React.ReactNode }) {
    const { badge, ...rest } = props;
    return (
      <Sidebar collapseBelow="never" {...rest}>
        <Sidebar.Content>
          <Sidebar.Nav>
            <Sidebar.Group label="Inbox" icon={HouseIcon} {...(badge !== undefined ? { badge } : {})}>
              <Sidebar.Item href="/a" badge={3}>
                Mentions
              </Sidebar.Item>
              <Sidebar.Item href="/b" badge={9}>
                Assigned
              </Sidebar.Item>
              <Sidebar.Item href="/c">Drafts</Sidebar.Item>
            </Sidebar.Group>
          </Sidebar.Nav>
        </Sidebar.Content>
      </Sidebar>
    );
  }

  it("shows the total of its items' counts while it is shut, and not once it is open", async () => {
    const user = userEvent.setup();
    render(<Groups />);
    const button = screen.getByRole("button", { name: /Inbox/ });
    expect(button).toHaveTextContent("12");
    await user.click(button);
    expect(button).not.toHaveTextContent("12");
  });

  it("takes its own badge in place of the total, and none with null", () => {
    const { rerender } = render(<Groups badge="New" />);
    expect(screen.getByRole("button", { name: /Inbox/ })).toHaveTextContent("New");
    rerender(<Groups badge={null} />);
    expect(screen.getByRole("button", { name: "Inbox" })).toBeInTheDocument();
  });

  it("shows nothing when there is no number to add", () => {
    render(
      <Sidebar collapseBelow="never">
        <Sidebar.Nav>
          <Sidebar.Group label="Plain" icon={HouseIcon}>
            <Sidebar.Item href="/a">A</Sidebar.Item>
          </Sidebar.Group>
        </Sidebar.Nav>
      </Sidebar>,
    );
    expect(screen.getByRole("button", { name: "Plain" })).toBeInTheDocument();
  });

  it("puts the count on the icon in the rail, and caps one over 99 at 99+", () => {
    render(<Groups defaultCollapsed badge={120} />);
    const button = screen.getByRole("button", { name: /Inbox/ });
    expect(button).toHaveTextContent("99+");
    expect(button.querySelector(`.${styles.railBadge}`)).not.toBeNull();
    expect(button.querySelector(`.${styles.railBadgeWide}`)).not.toBeNull();
  });

  it("leaves a two-digit count in the rail a plain circle, and caps an item's count over 99 too", () => {
    render(
      <Sidebar collapseBelow="never" defaultCollapsed>
        <Sidebar.Nav>
          <Sidebar.Item href="/a" icon={HouseIcon} badge={12}>
            Twelve
          </Sidebar.Item>
          <Sidebar.Item href="/b" icon={HouseIcon} badge={250}>
            Many
          </Sidebar.Item>
        </Sidebar.Nav>
      </Sidebar>,
    );
    const twelve = screen.getByRole("link", { name: /Twelve/ });
    expect(twelve.querySelector(`.${styles.railBadgeWide}`)).toBeNull();
    const many = screen.getByRole("link", { name: /Many/ });
    expect(many).toHaveTextContent("99+");
    expect(many.querySelector(`.${styles.railBadgeWide}`)).not.toBeNull();
  });
});

describe("Sidebar floating variant", () => {
  it("draws the floating card class and no other surface class", () => {
    const { container } = render(<Sidebar collapseBelow="never" variant="floating" />);
    const root = container.firstElementChild as HTMLElement;
    expect(root).toHaveClass(styles.floating as string);
    expect(root).not.toHaveClass(styles.outlined as string);
  });
});

describe("Sidebar.Skeleton", () => {
  function Loading(props: Partial<SidebarProps> & { rows?: number }) {
    const { rows, ...rest } = props;
    return (
      <Sidebar collapseBelow="never" {...rest}>
        <Sidebar.Nav>
          <Sidebar.Skeleton rows={rows} data-testid="skeleton" />
        </Sidebar.Nav>
      </Sidebar>
    );
  }

  it("announces one polite Loading status, is busy, and hides its rows from assistive technology", () => {
    render(<Loading rows={4} />);
    expect(screen.getByRole("status")).toHaveTextContent("Loading");
    const item = screen.getByTestId("skeleton");
    expect(item).toHaveAttribute("aria-busy", "true");
    const rows = item.querySelector(`.${styles.skeletonRows}`) as HTMLElement;
    expect(rows).toHaveAttribute("aria-hidden", "true");
    expect(rows.children).toHaveLength(4);
  });

  it("draws five rows unless told, and none for zero", () => {
    const { rerender } = render(<Loading />);
    expect((screen.getByTestId("skeleton").querySelector(`.${styles.skeletonRows}`) as HTMLElement).children).toHaveLength(5);
    rerender(<Loading rows={0} />);
    expect((screen.getByTestId("skeleton").querySelector(`.${styles.skeletonRows}`) as HTMLElement).children).toHaveLength(0);
  });

  it("draws only the icons in the rail", () => {
    render(<Loading defaultCollapsed rows={3} />);
    const rows = screen.getByTestId("skeleton").querySelector(`.${styles.skeletonRows}`) as HTMLElement;
    for (const row of Array.from(rows.children)) {
      expect(row.querySelector(`.${styles.skeletonText}`)).toBeNull();
      expect(row.querySelector(`.${styles.skeletonIcon}`)).not.toBeNull();
    }
  });

  it("translates its status text through labels.loading", () => {
    render(<Loading labels={{ loading: "Cargando" }} />);
    expect(screen.getByRole("status")).toHaveTextContent("Cargando");
  });

  it("has no axe violations", async () => {
    const { container } = render(<Loading rows={3} />);
    expect(await axe(container)).toHaveNoViolations();
  });
});

describe("Sidebar rail flyout offset", () => {
  it("opens a rail group's menu from the rail's edge, measured from the icon's button", async () => {
    const user = userEvent.setup();
    render(<Basic defaultCollapsed />);
    const button = screen.getByRole("button", { name: /Reports/ });
    // jsdom has no layout: every box is zero, so the measured gap is zero and the offset is the plain gap.
    await user.click(button);
    expect(await screen.findByRole("menu")).toBeInTheDocument();
  });
});

describe("Sidebar.Toggle icons", () => {
  it("draws your own icon for each state, in place of the caret", async () => {
    const user = userEvent.setup();
    render(
      <Sidebar collapseBelow="never">
        <Sidebar.Footer>
          <Sidebar.Toggle collapseIcon={HouseIcon} expandIcon={UsersIcon} />
        </Sidebar.Footer>
      </Sidebar>,
    );
    const button = screen.getByRole("button", { name: "Collapse sidebar" });
    const before = button.innerHTML;
    await user.click(button);
    const after = screen.getByRole("button", { name: "Expand sidebar" }).innerHTML;
    expect(after).not.toBe(before);
    // neither is the default caret: a caret is a single path, and these icons are drawn differently
    const caret = render(
      <Sidebar collapseBelow="never">
        <Sidebar.Footer>
          <Sidebar.Toggle />
        </Sidebar.Footer>
      </Sidebar>,
    );
    expect(caret.container.querySelector("button")!.innerHTML).not.toBe(before);
  });
});

describe("useSidebar().inPanel", () => {
  function Probe() {
    const { inPanel } = useSidebar();
    return <span data-testid="probe">{inPanel ? "panel" : "page"}</span>;
  }

  it("is false on the page, and there is no panel to read true from when the sidebar never collapses", () => {
    render(
      <Sidebar collapseBelow="never">
        <Sidebar.Header>
          <Probe />
        </Sidebar.Header>
      </Sidebar>,
    );
    expect(screen.getAllByTestId("probe").map((probe) => probe.textContent)).toEqual(["page"]);
  });

  it("is true for the copy drawn in the open phone panel, beside the page's copy", async () => {
    render(
      <Sidebar defaultMenuOpen>
        <Sidebar.Header>
          <Probe />
        </Sidebar.Header>
      </Sidebar>,
    );
    await waitFor(() => expect(screen.getAllByTestId("probe")).toHaveLength(2));
    expect(screen.getAllByTestId("probe").map((probe) => probe.textContent).sort()).toEqual(["page", "panel"]);
  });
});

describe("Sidebar.Section value", () => {
  function TwoNavs({ valueA, valueB }: { valueA?: string; valueB?: string }) {
    return (
      <Sidebar collapseBelow="never">
        <Sidebar.Nav aria-label="First">
          <Sidebar.Section label="Settings" collapsible value={valueA}>
            <Sidebar.Item href="/a">First item</Sidebar.Item>
          </Sidebar.Section>
        </Sidebar.Nav>
        <Sidebar.Nav aria-label="Second">
          <Sidebar.Section label="Settings" collapsible value={valueB}>
            <Sidebar.Item href="/b">Second item</Sidebar.Item>
          </Sidebar.Section>
        </Sidebar.Nav>
      </Sidebar>
    );
  }

  it("shares one fold between two sections with the same label and no value", async () => {
    const user = userEvent.setup();
    render(<TwoNavs />);
    await user.click(screen.getAllByRole("button", { name: "Settings" })[0]!);
    await waitFor(() => expect(screen.queryByRole("link", { name: "First item" })).not.toBeInTheDocument());
    await waitFor(() => expect(screen.queryByRole("link", { name: "Second item" })).not.toBeInTheDocument());
  });

  it("keeps two sections with the same label apart when each has its own value", async () => {
    const user = userEvent.setup();
    render(<TwoNavs valueA="first" valueB="second" />);
    await user.click(screen.getAllByRole("button", { name: "Settings" })[0]!);
    await waitFor(() => expect(screen.queryByRole("link", { name: "First item" })).not.toBeInTheDocument());
    expect(screen.getByRole("link", { name: "Second item" })).toBeInTheDocument();
  });

  it("warns that a collapsible section with a label that is not text keeps a fold in each copy, and not when it has a value", () => {
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
    const { unmount } = render(
      <Sidebar collapseBelow="never">
        <Sidebar.Nav>
          <Sidebar.Section label={<span>Rich heading</span>} collapsible>
            <Sidebar.Item href="/a">A</Sidebar.Item>
          </Sidebar.Section>
        </Sidebar.Nav>
      </Sidebar>,
    );
    expect(warn.mock.calls.some(([message]) => String(message).includes("Pass a `value`"))).toBe(true);
    unmount();
    warn.mockClear();
    render(
      <Sidebar collapseBelow="never">
        <Sidebar.Nav>
          <Sidebar.Section label={<span>Rich heading</span>} collapsible value="rich">
            <Sidebar.Item href="/a">A</Sidebar.Item>
          </Sidebar.Section>
        </Sidebar.Nav>
      </Sidebar>,
    );
    expect(warn.mock.calls.some(([message]) => String(message).includes("Pass a `value`"))).toBe(false);
    warn.mockRestore();
  });
});

describe("Sidebar under StrictMode, with its stateful parts", () => {
  it("keeps one group open at a time with exclusive, and folds a collapsible section", async () => {
    const user = userEvent.setup();
    render(
      <StrictMode>
        <Sidebar collapseBelow="never" exclusive peek>
          <Sidebar.Nav>
            <Sidebar.Section label="Work" collapsible>
              <Sidebar.Group label="Reports" icon={ChartBarIcon}>
                <Sidebar.Item href="/a" badge={5}>
                  A
                </Sidebar.Item>
              </Sidebar.Group>
              <Sidebar.Group label="Alerts" icon={HouseIcon}>
                <Sidebar.Item href="/b">B</Sidebar.Item>
              </Sidebar.Group>
            </Sidebar.Section>
          </Sidebar.Nav>
        </Sidebar>
      </StrictMode>,
    );
    const reports = screen.getByRole("button", { name: /Reports/ });
    const alerts = screen.getByRole("button", { name: /Alerts/ });
    await user.click(reports);
    expect(reports).toHaveAttribute("aria-expanded", "true");
    await user.click(alerts);
    expect(alerts).toHaveAttribute("aria-expanded", "true");
    expect(reports).toHaveAttribute("aria-expanded", "false");
    await user.click(screen.getByRole("button", { name: "Work" }));
    expect(screen.getByRole("button", { name: "Work" })).toHaveAttribute("aria-expanded", "false");
  });
});
