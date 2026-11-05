import { act, render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { axe } from "jest-axe";
import { createRef, StrictMode } from "react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { Navbar } from "../../organisms/Navbar";
import { Sidebar } from "../../organisms/Sidebar";
import { AppShell } from "./AppShell";
import { useAppShell } from "./AppShellContext";
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

describe("AppShell.SkipLink", () => {
  it("is a link to #main with its own words, first in the tab order when it is first in the shell", async () => {
    const user = userEvent.setup();
    render(
      <AppShell>
        <AppShell.SkipLink />
        <AppShell.Header>
          <a href="/">Home</a>
        </AppShell.Header>
        <AppShell.Main>x</AppShell.Main>
      </AppShell>,
    );
    const link = screen.getByRole("link", { name: "Skip to content" });
    expect(link).toHaveAttribute("href", "#main");
    await user.tab();
    expect(link).toHaveFocus();
  });

  it("takes its own text, its own words through `labels`, and another target", () => {
    render(
      <AppShell>
        <AppShell.SkipLink href="#content">Skip to the page</AppShell.SkipLink>
        <AppShell.SkipLink labels={{ skipToContent: "Aller au contenu" }} />
        <AppShell.SkipLink labels={{ skipToContent: undefined }} data-testid="undefined-label" />
        <AppShell.Main>x</AppShell.Main>
      </AppShell>,
    );
    expect(screen.getByRole("link", { name: "Skip to the page" })).toHaveAttribute("href", "#content");
    expect(screen.getByRole("link", { name: "Aller au contenu" })).toBeInTheDocument();
    // an override that is `undefined` keeps the default words, not a blank link
    expect(screen.getByTestId("undefined-label")).toHaveTextContent("Skip to content");
  });
});

describe("AppShell.Header's element", () => {
  it("is a plain div by default, so a Navbar's own banner is not wrapped in a second one", () => {
    render(
      <AppShell>
        <AppShell.Header data-testid="header">x</AppShell.Header>
        <AppShell.Main>x</AppShell.Main>
      </AppShell>,
    );
    expect(screen.getByTestId("header").tagName).toBe("DIV");
    expect(screen.queryByRole("banner")).not.toBeInTheDocument();
  });

  it("is the page's banner landmark with as=\"header\"", () => {
    const ref = createRef<HTMLElement>();
    render(
      <AppShell>
        <AppShell.Header as="header" ref={ref} data-testid="header">
          x
        </AppShell.Header>
        <AppShell.Main>x</AppShell.Main>
      </AppShell>,
    );
    expect(screen.getByRole("banner")).toBe(screen.getByTestId("header"));
    expect(ref.current?.tagName).toBe("HEADER");
  });
});

describe("AppShell's layout attributes", () => {
  it("records how far the header reaches and what the aside does, and says what they default to", () => {
    const { rerender } = render(
      <AppShell data-testid="shell">
        <AppShell.Main>x</AppShell.Main>
      </AppShell>,
    );
    const root = screen.getByTestId("shell");
    expect(root).toHaveAttribute("data-header-span", "content");
    expect(root).toHaveAttribute("data-aside-collapse", "lg");
    expect(root).toHaveAttribute("data-aside-to", "drawer");
    rerender(
      <AppShell data-testid="shell" headerSpan="full" asideCollapseBelow="md" asideCollapseTo="hidden">
        <AppShell.Main>x</AppShell.Main>
      </AppShell>,
    );
    expect(root).toHaveAttribute("data-header-span", "full");
    expect(root).toHaveAttribute("data-aside-collapse", "md");
    expect(root).toHaveAttribute("data-aside-to", "hidden");
  });
});

describe("AppShell.Aside", () => {
  function WithAside(props: Partial<React.ComponentProps<typeof AppShell>> & { asideProps?: Partial<React.ComponentProps<typeof AppShell.Aside>> }) {
    const { asideProps, ...shell } = props;
    return (
      <AppShell {...shell}>
        <AppShell.Header>
          <AppShell.AsideToggle data-testid="toggle" />
        </AppShell.Header>
        <AppShell.Main>Main</AppShell.Main>
        <AppShell.Aside aria-label="Order details" data-testid="aside" {...asideProps}>
          <p>The aside content</p>
        </AppShell.Aside>
      </AppShell>
    );
  }

  it("is a named complementary landmark holding its children, and a width through a custom property", () => {
    render(<WithAside asideProps={{ width: 360 }} />);
    const aside = screen.getByRole("complementary", { name: "Order details" });
    expect(aside).toHaveTextContent("The aside content");
    expect(aside.style.getPropertyValue("--app-shell-aside-size")).toBe("360px");
  });

  it("opens the same content in a drawer from the toggle, titled by the aside's name, and gives focus back to the toggle", async () => {
    const user = userEvent.setup();
    render(<WithAside />);
    const toggle = screen.getByRole("button", { name: "Show details" });
    expect(toggle).toHaveAttribute("aria-expanded", "false");
    await user.click(toggle);
    const drawer = await screen.findByRole("dialog", { name: "Order details" });
    expect(within(drawer).getByText("The aside content")).toBeInTheDocument();
    // the drawer's copy is not a second complementary landmark
    expect(within(drawer).queryByRole("complementary")).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Show details", hidden: true })).toHaveAttribute("aria-expanded", "true");
    await user.keyboard("{Escape}");
    await waitFor(() => expect(screen.queryByRole("dialog")).not.toBeInTheDocument());
    await waitFor(() => expect(toggle).toHaveFocus());
  });

  it("takes its drawer's title and close name, and the toggle's name, through `labels`", async () => {
    const user = userEvent.setup();
    render(
      <AppShell>
        <AppShell.AsideToggle labels={{ open: "Détails" }} />
        <AppShell.Main>x</AppShell.Main>
        <AppShell.Aside labels={{ title: "Détails de la commande", close: "Fermer" }}>x</AppShell.Aside>
      </AppShell>,
    );
    await user.click(screen.getByRole("button", { name: "Détails" }));
    const drawer = await screen.findByRole("dialog", { name: "Détails de la commande" });
    expect(within(drawer).getByRole("button", { name: "Fermer" })).toBeInTheDocument();
  });

  it("reports the drawer opening and closing, and can be held open by the app", async () => {
    const user = userEvent.setup();
    const changes: boolean[] = [];
    const { rerender } = render(<WithAside asideOpen={false} onAsideOpenChange={(open) => changes.push(open)} />);
    await user.click(screen.getByRole("button", { name: "Show details" }));
    expect(changes).toEqual([true]);
    // controlled: it stays shut until the app says so
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    rerender(<WithAside asideOpen onAsideOpenChange={(open) => changes.push(open)} />);
    await screen.findByRole("dialog", { name: "Order details" });
    await user.keyboard("{Escape}");
    expect(changes).toEqual([true, false]);
  });

  it("starts open with defaultAsideOpen", async () => {
    render(<WithAside defaultAsideOpen />);
    expect(await screen.findByRole("dialog", { name: "Order details" })).toBeInTheDocument();
  });

  it("has no drawer, and never opens one, with asideCollapseTo=\"hidden\"", async () => {
    // the toggle is hidden by the stylesheet (`display: none`), which would stop a real press, so the pointer check is off
    const user = userEvent.setup({ pointerEventsCheck: 0 });
    render(<WithAside asideCollapseTo="hidden" />);
    // the toggle is hidden by the stylesheet (`display: none`), so it is found by its test id; pressing it still opens nothing
    await user.click(screen.getByTestId("toggle"));
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });

  it("has no drawer with asideCollapseBelow=\"never\", since the aside is always on the page", () => {
    render(<WithAside asideCollapseBelow="never" defaultAsideOpen />);
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });

  it("closes the drawer once the window is wide enough for the aside to be back on the page", async () => {
    const user = userEvent.setup();
    const listeners: Array<() => void> = [];
    const query = { matches: false, addEventListener: (_: string, fn: () => void) => listeners.push(fn), removeEventListener: () => {} };
    const original = window.matchMedia;
    window.matchMedia = vi.fn().mockReturnValue(query) as unknown as typeof window.matchMedia;
    try {
      render(<WithAside />);
      await user.click(screen.getByRole("button", { name: "Show details" }));
      await screen.findByRole("dialog");
      query.matches = true;
      act(() => listeners.forEach((fn) => fn()));
      await waitFor(() => expect(screen.queryByRole("dialog")).not.toBeInTheDocument());
    } finally {
      window.matchMedia = original;
    }
  });

  it("has no accessibility violations, in the drawer and on the page", async () => {
    const { container } = render(<WithAside defaultAsideOpen headerSpan="full" />);
    await screen.findByRole("dialog");
    expect(await axe(container)).toHaveNoViolations();
  });
});

describe("useAppShell", () => {
  function Probe() {
    const state = useAppShell();
    return (
      <p data-testid="probe">
        {state.scroll}|{state.headerHeight}|{String(state.asideOpen)}
      </p>
    );
  }

  it("gives the app the shell's state, and lets it open the aside's drawer", async () => {
    const user = userEvent.setup();
    function Opener() {
      const { setAsideOpen } = useAppShell();
      return <button onClick={() => setAsideOpen(true)}>open</button>;
    }
    render(
      <AppShell scroll="page">
        <AppShell.Main>
          <Probe />
          <Opener />
        </AppShell.Main>
        <AppShell.Aside aria-label="Details">x</AppShell.Aside>
      </AppShell>,
    );
    // jsdom measures every box as zero, so the header's height is zero
    expect(screen.getByTestId("probe")).toHaveTextContent("page|0|false");
    await user.click(screen.getByRole("button", { name: "open" }));
    await screen.findByRole("dialog", { name: "Details" });
  });

  it("throws a plain message outside a shell", () => {
    vi.spyOn(console, "error").mockImplementation(() => {});
    expect(() => render(<Probe />)).toThrow("useAppShell must be used inside an AppShell.");
  });
});

describe("AppShell's page changes (pageKey and pageTitle)", () => {
  function Page({ pageKey, pageTitle }: { pageKey?: string; pageTitle?: string }) {
    return (
      <AppShell pageKey={pageKey} pageTitle={pageTitle}>
        <AppShell.Main data-testid="main">
          <button>Inside</button>
        </AppShell.Main>
      </AppShell>
    );
  }

  it("moves focus to the main area when the key changes, and not on the first render", () => {
    const { rerender } = render(<Page pageKey="/a" pageTitle="A" />);
    expect(screen.getByTestId("main")).not.toHaveFocus();
    rerender(<Page pageKey="/b" pageTitle="B" />);
    expect(screen.getByTestId("main")).toHaveFocus();
  });

  it("does not move focus when the key stays the same, or when the title alone changes", () => {
    const { rerender } = render(<Page pageKey="/a" pageTitle="A" />);
    rerender(<Page pageKey="/a" pageTitle="A, renamed" />);
    expect(screen.getByTestId("main")).not.toHaveFocus();
  });

  it("does nothing at all while the key is left out, and draws no live region", () => {
    const { rerender } = render(<Page pageTitle="A" />);
    rerender(<Page pageTitle="B" />);
    expect(screen.getByTestId("main")).not.toHaveFocus();
    expect(screen.queryByRole("status")).not.toBeInTheDocument();
  });

  it("scrolls a scrolling main area back to the top", () => {
    const { rerender } = render(<Page pageKey="/a" />);
    const main = screen.getByTestId("main");
    main.scrollTop = 300;
    rerender(<Page pageKey="/b" />);
    expect(main.scrollTop).toBe(0);
  });

  it("announces the new page's title politely, and only after a change", async () => {
    const { rerender } = render(<Page pageKey="/a" pageTitle="Orders" />);
    const region = screen.getByRole("status");
    expect(region).toHaveTextContent("");
    rerender(<Page pageKey="/b" pageTitle="Invoices" />);
    await waitFor(() => expect(region).toHaveTextContent("Invoices"), { timeout: 1000 });
  });

  it("moves focus without announcing when there is no title", async () => {
    const { rerender } = render(<Page pageKey="/a" />);
    rerender(<Page pageKey="/b" />);
    expect(screen.getByTestId("main")).toHaveFocus();
    await new Promise((resolve) => setTimeout(resolve, 250));
    expect(screen.getByRole("status")).toHaveTextContent("");
  });

  it("does not move focus on mount under StrictMode, which mounts every effect twice", () => {
    render(
      <StrictMode>
        <Page pageKey="/a" pageTitle="A" />
      </StrictMode>,
    );
    expect(screen.getByTestId("main")).not.toHaveFocus();
  });

  it("treats a key that arrives later as the first one, not as a page change", () => {
    const { rerender } = render(<Page />);
    rerender(<Page pageKey="/a" />);
    expect(screen.getByTestId("main")).not.toHaveFocus();
  });
});

