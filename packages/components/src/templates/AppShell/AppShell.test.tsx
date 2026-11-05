import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { axe } from "jest-axe";
import { createRef } from "react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { Navbar } from "../../organisms/Navbar";
import { Sidebar } from "../../organisms/Sidebar";
import { AppShell } from "./AppShell";
import type { AppShellProps } from "./AppShell.types";

// jsdom matches no media query, so below its `collapseBelow` width the sidebar is `display: none` as on a phone. These tests of the page's
// sidebar set `collapseBelow="never"`.
function Shell(props: AppShellProps) {
  return (
    <AppShell collapseBelow="never" data-testid="shell" {...props}>
      <AppShell.Header>
        <Navbar>
          <Navbar.SkipLink />
          <Navbar.Brand href="/">Acme</Navbar.Brand>
        </Navbar>
      </AppShell.Header>
      <AppShell.Sidebar data-testid="sidebar-slot">
        <Sidebar collapseBelow="never">
          <Sidebar.Content>
            <Sidebar.Nav>
              <Sidebar.Item href="/" current>
                Home
              </Sidebar.Item>
              <Sidebar.Item href="/billing">Billing</Sidebar.Item>
            </Sidebar.Nav>
          </Sidebar.Content>
        </Sidebar>
      </AppShell.Sidebar>
      <AppShell.Main>
        <h1>Billing</h1>
      </AppShell.Main>
      <AppShell.Footer>
        <p>Footer</p>
      </AppShell.Footer>
    </AppShell>
  );
}

afterEach(() => {
  vi.restoreAllMocks();
});

describe("AppShell", () => {
  it("draws the page's landmarks once each: banner, navigation, main and contentinfo", () => {
    render(<Shell />);
    expect(screen.getAllByRole("banner")).toHaveLength(1);
    expect(screen.getAllByRole("main")).toHaveLength(1);
    expect(screen.getAllByRole("contentinfo")).toHaveLength(1);
    expect(screen.getByRole("navigation", { name: "Main" })).toBeInTheDocument();
  });

  it("makes the main area the skip link's target and moves focus to it", async () => {
    const user = userEvent.setup();
    render(<Shell />);
    const main = screen.getByRole("main");
    expect(main).toHaveAttribute("id", "main");
    expect(main).toHaveAttribute("tabindex", "-1");
    const skip = screen.getByRole("link", { name: "Skip to content" });
    expect(skip).toHaveAttribute("href", "#main");
    await user.tab();
    expect(skip).toHaveFocus();
    await user.keyboard("{Enter}");
    expect(window.location.hash).toBe("#main");
  });

  it("lets the main area take another id", () => {
    render(
      <AppShell>
        <AppShell.Main id="content">x</AppShell.Main>
      </AppShell>,
    );
    expect(screen.getByRole("main")).toHaveAttribute("id", "content");
  });

  it("works with only a main area", () => {
    render(
      <AppShell>
        <AppShell.Main>Only</AppShell.Main>
      </AppShell>,
    );
    expect(screen.getByRole("main")).toHaveTextContent("Only");
  });

  it("records what scrolls, the sidebar's side and the direction on the root", () => {
    const { rerender } = render(<Shell />);
    const root = screen.getByTestId("shell");
    expect(root).toHaveAttribute("data-scroll", "content");
    expect(root).toHaveAttribute("data-sidebar-side", "start");
    expect(root).toHaveAttribute("dir", "ltr");
    rerender(<Shell scroll="page" sidebarSide="end" dir="rtl" />);
    expect(root).toHaveAttribute("data-scroll", "page");
    expect(root).toHaveAttribute("data-sidebar-side", "end");
    expect(root).toHaveAttribute("dir", "rtl");
  });

  it("lets the Navbar's menu button open the sidebar's phone panel, through the shell's provider", async () => {
    const user = userEvent.setup();
    render(
      <AppShell collapseBelow="3xl">
        <AppShell.Sidebar>
          <Sidebar collapseBelow="3xl">
            <Sidebar.Content>
              <Sidebar.Nav>
                <Sidebar.Item href="/">Home</Sidebar.Item>
              </Sidebar.Nav>
            </Sidebar.Content>
          </Sidebar>
        </AppShell.Sidebar>
        <AppShell.Header>
          <Navbar>
            <Navbar.Brand href="/">Acme</Navbar.Brand>
            <Navbar.Actions>
              <Sidebar.MenuButton />
            </Navbar.Actions>
          </Navbar>
        </AppShell.Header>
        <AppShell.Main>x</AppShell.Main>
      </AppShell>,
    );
    await user.click(screen.getByRole("button", { name: "Menu" }));
    const panel = await screen.findByRole("dialog");
    expect(within(panel).getByRole("link", { name: "Home" })).toBeInTheDocument();
  });

  it("reports the sidebar's collapsed state through the shell's props", async () => {
    const user = userEvent.setup();
    const changes: boolean[] = [];
    render(
      <AppShell collapseBelow="never" onCollapsedChange={(collapsed) => changes.push(collapsed)}>
        <AppShell.Sidebar>
          <Sidebar collapseBelow="never">
            <Sidebar.Content>
              <Sidebar.Nav>
                <Sidebar.Item href="/">Home</Sidebar.Item>
              </Sidebar.Nav>
            </Sidebar.Content>
            <Sidebar.Footer>
              <Sidebar.Toggle />
            </Sidebar.Footer>
          </Sidebar>
        </AppShell.Sidebar>
        <AppShell.Main>x</AppShell.Main>
      </AppShell>,
    );
    await user.click(screen.getByRole("button", { name: "Collapse sidebar" }));
    expect(changes).toEqual([true]);
  });

  it("forwards refs and merges className, style and data-testid onto each part", () => {
    const root = createRef<HTMLDivElement>();
    const main = createRef<HTMLElement>();
    const footer = createRef<HTMLElement>();
    render(
      <AppShell ref={root} className="extra" style={{ color: "red" }} data-testid="shell">
        <AppShell.Main ref={main} className="m" data-testid="m">
          x
        </AppShell.Main>
        <AppShell.Footer ref={footer} data-testid="f">
          y
        </AppShell.Footer>
      </AppShell>,
    );
    expect(root.current).toBe(screen.getByTestId("shell"));
    expect(root.current).toHaveClass("extra");
    expect(root.current?.style.color).toBe("red");
    expect(main.current).toBe(screen.getByTestId("m"));
    expect(main.current).toHaveClass("m");
    expect(footer.current?.tagName).toBe("FOOTER");
  });

  it("is a skip target but not a tab stop in jsdom, which lays nothing out and so never sees the main area scroll", () => {
    const { rerender } = render(
      <AppShell>
        <AppShell.Main>x</AppShell.Main>
      </AppShell>,
    );
    expect(screen.getByRole("main")).toHaveAttribute("tabindex", "-1");
    rerender(
      <AppShell scroll="page">
        <AppShell.Main>x</AppShell.Main>
      </AppShell>,
    );
    expect(screen.getByRole("main")).toHaveAttribute("tabindex", "-1");
  });

  it("warns in development when the sidebar comes before the header in the markup", () => {
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
    render(
      <AppShell>
        <AppShell.Sidebar>side</AppShell.Sidebar>
        <AppShell.Header>head</AppShell.Header>
        <AppShell.Main>x</AppShell.Main>
      </AppShell>,
    );
    expect(warn).toHaveBeenCalledWith(expect.stringContaining("`AppShell.Sidebar` comes before `AppShell.Header`"));
  });

  it("does not warn for the header first, or when there is no sidebar", () => {
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
    render(
      <AppShell>
        <AppShell.Header>head</AppShell.Header>
        <AppShell.Sidebar>side</AppShell.Sidebar>
        <AppShell.Main>x</AppShell.Main>
      </AppShell>,
    );
    render(
      <AppShell>
        <AppShell.Main>x</AppShell.Main>
        <AppShell.Header>head</AppShell.Header>
      </AppShell>,
    );
    expect(warn).not.toHaveBeenCalled();
  });

  it("measures the header only while the page scrolls, and leaves the grid alone until it has a height", () => {
    render(
      <AppShell scroll="page" data-testid="shell">
        <AppShell.Header>head</AppShell.Header>
        <AppShell.Main>x</AppShell.Main>
      </AppShell>,
    );
    // jsdom measures every box as zero, so the header is not reported as stuck and the root carries no measured flag.
    expect(screen.getByTestId("shell")).not.toHaveAttribute("data-header-measured");
    expect(screen.getByTestId("shell").style.getPropertyValue("--app-shell-header-height")).toBe("");
  });

  it("keeps its own sidebar state inside an outer Sidebar.Provider: the shell's provider replaces it for everything inside", async () => {
    const user = userEvent.setup();
    const outer: boolean[] = [];
    const inner: boolean[] = [];
    render(
      <Sidebar.Provider collapseBelow="never" onCollapsedChange={(collapsed) => outer.push(collapsed)}>
        <AppShell collapseBelow="never" onCollapsedChange={(collapsed) => inner.push(collapsed)}>
          <AppShell.Sidebar>
            <Sidebar collapseBelow="never">
              <Sidebar.Content>
                <Sidebar.Nav>
                  <Sidebar.Item href="/">Home</Sidebar.Item>
                </Sidebar.Nav>
              </Sidebar.Content>
              <Sidebar.Footer>
                <Sidebar.Toggle />
              </Sidebar.Footer>
            </Sidebar>
          </AppShell.Sidebar>
          <AppShell.Main>x</AppShell.Main>
        </AppShell>
      </Sidebar.Provider>,
    );
    await user.click(screen.getByRole("button", { name: "Collapse sidebar" }));
    expect(inner).toEqual([true]);
    expect(outer).toEqual([]);
  });

  it("has no accessibility violations", async () => {
    const { container } = render(<Shell />);
    expect(await axe(container)).toHaveNoViolations();
  });

  it("has no accessibility violations on the page-scroll, end-edge and right-to-left variants", async () => {
    const { container } = render(<Shell scroll="page" sidebarSide="end" dir="rtl" />);
    expect(await axe(container)).toHaveNoViolations();
  });
});
