import { act, fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { axe } from "jest-axe";
import { createRef, StrictMode, useState } from "react";
import { describe, expect, it, vi } from "vitest";
import { DirectionProvider } from "../../atoms/DirectionProvider";
import { Navbar } from "../../organisms/Navbar";
import { TopNavShell } from "./TopNavShell";
import type { TopNavShellProps } from "./TopNavShell.types";

// jsdom matches no media query and lays out nothing, so these tests are about structure, wiring and state: the landmarks, the skip link and its
// target, the page-change handling, `busy`, the scrolled state and the props each part passes through. Sticking, the footer's place, widths and
// print are in the real-browser checks.
function Shell(props: TopNavShellProps) {
  return (
    <TopNavShell data-testid="shell" {...props}>
      <TopNavShell.SkipLink />
      <TopNavShell.Header>
        <Navbar>
          <Navbar.Brand href="/">Acme</Navbar.Brand>
          <Navbar.Links aria-label="Main">
            <Navbar.Link href="/" current>
              Home
            </Navbar.Link>
            <Navbar.Link href="/reports">Reports</Navbar.Link>
          </Navbar.Links>
        </Navbar>
        <TopNavShell.SubNav>
          <nav aria-label="Sections">
            <a href="/overview">Overview</a>
          </nav>
        </TopNavShell.SubNav>
      </TopNavShell.Header>
      <TopNavShell.Main>
        <TopNavShell.Content>
          <h1>Projects</h1>
        </TopNavShell.Content>
      </TopNavShell.Main>
      <TopNavShell.Footer>
        <p>Footer</p>
      </TopNavShell.Footer>
    </TopNavShell>
  );
}

describe("TopNavShell", () => {
  describe("landmarks", () => {
    it("has one banner, one main and one contentinfo, and the named navigations", () => {
      render(<Shell />);
      expect(screen.getAllByRole("banner")).toHaveLength(1);
      expect(screen.getAllByRole("main")).toHaveLength(1);
      expect(screen.getAllByRole("contentinfo")).toHaveLength(1);
      // The bar's links are in the page's tree from the `md` step up; jsdom matches no media query, so the stylesheet hides them as it does on a
      // phone, and a hidden element has no computed name: the names are read from the attribute.
      const navigations = screen.getAllByRole("navigation", { hidden: true }).map((navigation) => navigation.getAttribute("aria-label"));
      expect(navigations).toEqual(["Main", "Sections"]);
      expect(screen.getAllByRole("heading", { level: 1 })).toHaveLength(1);
    });

    it("draws the header slot as a plain div, so a Navbar is not wrapped in a second banner", () => {
      render(<Shell />);
      const banner = screen.getByRole("banner");
      expect(banner.tagName).toBe("HEADER");
      expect(banner.parentElement?.tagName).toBe("DIV");
    });

    it("draws the header slot as the banner with as=\"header\"", () => {
      render(
        <TopNavShell>
          <TopNavShell.Header as="header" data-testid="header">
            Brand
          </TopNavShell.Header>
          <TopNavShell.Main>Main</TopNavShell.Main>
        </TopNavShell>,
      );
      expect(screen.getByTestId("header").tagName).toBe("HEADER");
      expect(screen.getByRole("banner")).toBe(screen.getByTestId("header"));
    });

    it("draws the content in a Container, with the footer outside the main area", () => {
      render(<Shell />);
      expect(within(screen.getByRole("main")).getByRole("heading", { name: "Projects" })).toBeInTheDocument();
      expect(screen.getByRole("main")).not.toContainElement(screen.getByRole("contentinfo"));
    });
  });

  describe("the skip link", () => {
    it("is the first tab stop and goes to the main area", async () => {
      const user = userEvent.setup();
      render(<Shell />);
      await user.tab();
      const link = screen.getByRole("link", { name: "Skip to content" });
      expect(link).toHaveFocus();
      expect(link).toHaveAttribute("href", "#main");
      expect(screen.getByRole("main")).toHaveAttribute("id", "main");
    });

    it("can be given its own words, text and target", () => {
      render(
        <TopNavShell>
          <TopNavShell.SkipLink labels={{ skipToContent: "Aller au contenu" }} href="#page" />
          <TopNavShell.Main id="page">Main</TopNavShell.Main>
        </TopNavShell>,
      );
      expect(screen.getByRole("link", { name: "Aller au contenu" })).toHaveAttribute("href", "#page");
      expect(screen.getByRole("main")).toHaveAttribute("id", "page");
    });

    it("keeps its own words when a label is passed as undefined", () => {
      render(
        <TopNavShell>
          <TopNavShell.SkipLink labels={{ skipToContent: undefined }} />
          <TopNavShell.Main>Main</TopNavShell.Main>
        </TopNavShell>,
      );
      expect(screen.getByRole("link", { name: "Skip to content" })).toBeInTheDocument();
    });

    it("takes children in place of the words", () => {
      render(
        <TopNavShell>
          <TopNavShell.SkipLink>Jump</TopNavShell.SkipLink>
          <TopNavShell.Main>Main</TopNavShell.Main>
        </TopNavShell>,
      );
      expect(screen.getByRole("link", { name: "Jump" })).toBeInTheDocument();
    });

    it("lets the main area take focus from it (tabindex -1), and is not a tab stop of its own", () => {
      render(<Shell />);
      expect(screen.getByRole("main")).toHaveAttribute("tabindex", "-1");
    });
  });

  describe("the data attributes", () => {
    it("sticks the header and shows the scrolled edge by default", () => {
      render(<Shell />);
      expect(screen.getByTestId("shell")).toHaveAttribute("data-sticky-header");
      expect(screen.getByTestId("shell")).toHaveAttribute("data-scrolled-edge");
      expect(screen.getByTestId("shell")).not.toHaveAttribute("data-scrolled");
    });

    it("leaves them off when asked", () => {
      render(<Shell stickyHeader={false} scrolledEdge={false} />);
      expect(screen.getByTestId("shell")).not.toHaveAttribute("data-sticky-header");
      expect(screen.getByTestId("shell")).not.toHaveAttribute("data-scrolled-edge");
    });
  });

  describe("the scrolled edge", () => {
    it("is on once the window has scrolled down, and off again at the top", () => {
      render(<Shell />);
      Object.defineProperty(window, "scrollY", { configurable: true, value: 120 });
      act(() => {
        fireEvent.scroll(document);
      });
      expect(screen.getByTestId("shell")).toHaveAttribute("data-scrolled");
      Object.defineProperty(window, "scrollY", { configurable: true, value: 0 });
      act(() => {
        fireEvent.scroll(document);
      });
      expect(screen.getByTestId("shell")).not.toHaveAttribute("data-scrolled");
    });

    it("follows a box the shell is drawn inside, and ignores the scrolling of one it is not in", () => {
      const { container } = render(
        <div data-testid="frame" style={{ overflow: "auto" }}>
          <Shell />
        </div>,
      );
      const frame = container.querySelector<HTMLElement>("[data-testid=frame]") as HTMLElement;
      const stranger = document.createElement("div");
      document.body.append(stranger);
      stranger.scrollTop = 50;
      act(() => {
        fireEvent.scroll(stranger);
      });
      expect(screen.getByTestId("shell")).not.toHaveAttribute("data-scrolled");
      frame.scrollTop = 80;
      act(() => {
        fireEvent.scroll(frame);
      });
      expect(screen.getByTestId("shell")).toHaveAttribute("data-scrolled");
      stranger.remove();
    });

    it("never turns on while scrolledEdge is off, and stops listening on unmount", () => {
      const remove = vi.spyOn(document, "removeEventListener");
      const { unmount } = render(<Shell scrolledEdge={false} />);
      Object.defineProperty(window, "scrollY", { configurable: true, value: 200 });
      act(() => {
        fireEvent.scroll(document);
      });
      expect(screen.getByTestId("shell")).not.toHaveAttribute("data-scrolled");
      Object.defineProperty(window, "scrollY", { configurable: true, value: 0 });
      remove.mockClear();
      const second = render(<Shell />);
      second.unmount();
      expect(remove).toHaveBeenCalledWith("scroll", expect.any(Function), true);
      unmount();
      remove.mockRestore();
    });
  });

  describe("direction", () => {
    it("sets dir on its own element and gives it to what is inside", () => {
      render(
        <TopNavShell dir="rtl" data-testid="shell">
          <TopNavShell.Main>Main</TopNavShell.Main>
        </TopNavShell>,
      );
      expect(screen.getByTestId("shell")).toHaveAttribute("dir", "rtl");
    });

    it("follows the nearest DirectionProvider when it has no dir of its own, and its own dir wins", () => {
      render(
        <DirectionProvider dir="rtl">
          <TopNavShell data-testid="inherits">
            <TopNavShell.Main>Main</TopNavShell.Main>
          </TopNavShell>
          <TopNavShell dir="ltr" data-testid="own">
            <TopNavShell.Main id="other">Main</TopNavShell.Main>
          </TopNavShell>
        </DirectionProvider>,
      );
      expect(screen.getByTestId("inherits")).toHaveAttribute("dir", "rtl");
      expect(screen.getByTestId("own")).toHaveAttribute("dir", "ltr");
    });
  });

  describe("moving to another page", () => {
    function Router({ initial = "/a" }: { initial?: string }) {
      const [path, setPath] = useState(initial);
      return (
        <TopNavShell pageKey={path} pageTitle={`Page ${path}`}>
          <TopNavShell.Main>
            <button type="button" onClick={() => setPath("/b")}>
              Go
            </button>
            <button type="button" onClick={() => setPath("/b")}>
              Same
            </button>
          </TopNavShell.Main>
        </TopNavShell>
      );
    }

    it("moves focus to the main area and announces the title after a change, and says nothing on the first render", async () => {
      const user = userEvent.setup();
      render(<Router />);
      expect(screen.getByRole("status")).toHaveTextContent("");
      await user.click(screen.getByRole("button", { name: "Go" }));
      expect(screen.getByRole("main")).toHaveFocus();
      await waitFor(() => expect(screen.getByRole("status")).toHaveTextContent("Page /b"));
    });

    it("does nothing when the key is set again to the same value", async () => {
      const user = userEvent.setup();
      render(<Router initial="/b" />);
      await user.click(screen.getByRole("button", { name: "Same" }));
      expect(screen.getByRole("main")).not.toHaveFocus();
      expect(screen.getByRole("status")).toHaveTextContent("");
    });

    it("does nothing while pageKey is left out, and draws no live region for it", () => {
      render(
        <TopNavShell>
          <TopNavShell.Main>Main</TopNavShell.Main>
        </TopNavShell>,
      );
      expect(screen.queryByRole("status")).not.toBeInTheDocument();
    });

    it("moves focus without announcing when there is no pageTitle", () => {
      const { rerender } = render(
        <TopNavShell pageKey="/a">
          <TopNavShell.Main>Main</TopNavShell.Main>
        </TopNavShell>,
      );
      rerender(
        <TopNavShell pageKey="/b">
          <TopNavShell.Main>Main</TopNavShell.Main>
        </TopNavShell>,
      );
      expect(screen.getByRole("main")).toHaveFocus();
      expect(screen.getByRole("status")).toHaveTextContent("");
    });

    it("treats a key that arrives after mount as the first page, not a change", () => {
      const { rerender } = render(
        <TopNavShell>
          <TopNavShell.Main>Main</TopNavShell.Main>
        </TopNavShell>,
      );
      rerender(
        <TopNavShell pageKey="/a" pageTitle="A">
          <TopNavShell.Main>Main</TopNavShell.Main>
        </TopNavShell>,
      );
      expect(screen.getByRole("main")).not.toHaveFocus();
      expect(screen.getByRole("status")).toHaveTextContent("");
    });

    it("is quiet on the first render under StrictMode, and still acts on a real change", async () => {
      const user = userEvent.setup();
      render(
        <StrictMode>
          <Router />
        </StrictMode>,
      );
      expect(screen.getByRole("main")).not.toHaveFocus();
      expect(screen.getByRole("status")).toHaveTextContent("");
      await user.click(screen.getByRole("button", { name: "Go" }));
      expect(screen.getByRole("main")).toHaveFocus();
    });
  });

  describe("busy", () => {
    it("marks the main area busy, says Loading politely, and empties the region when it clears", () => {
      const { rerender } = render(
        <TopNavShell>
          <TopNavShell.Main busy>Main</TopNavShell.Main>
        </TopNavShell>,
      );
      expect(screen.getByRole("main")).toHaveAttribute("aria-busy", "true");
      expect(screen.getByRole("status")).toHaveTextContent("Loading");
      rerender(
        <TopNavShell>
          <TopNavShell.Main busy={false}>Main</TopNavShell.Main>
        </TopNavShell>,
      );
      expect(screen.getByRole("main")).not.toHaveAttribute("aria-busy");
      expect(screen.getByRole("status")).toHaveTextContent("");
    });

    it("draws no region at all while busy is left out", () => {
      render(
        <TopNavShell>
          <TopNavShell.Main>Main</TopNavShell.Main>
        </TopNavShell>,
      );
      expect(screen.queryByRole("status")).not.toBeInTheDocument();
    });

    it("says its own words, and keeps the default when a label is passed as undefined", () => {
      const { rerender } = render(
        <TopNavShell>
          <TopNavShell.Main busy labels={{ loading: "Chargement" }}>
            Main
          </TopNavShell.Main>
        </TopNavShell>,
      );
      expect(screen.getByRole("status")).toHaveTextContent("Chargement");
      rerender(
        <TopNavShell>
          <TopNavShell.Main busy labels={{ loading: undefined }}>
            Main
          </TopNavShell.Main>
        </TopNavShell>,
      );
      expect(screen.getByRole("status")).toHaveTextContent("Loading");
    });
  });

  describe("refs and passthrough", () => {
    it("forwards a ref to every part's element", () => {
      const refs = {
        root: createRef<HTMLDivElement>(),
        skip: createRef<HTMLAnchorElement>(),
        banner: createRef<HTMLDivElement>(),
        header: createRef<HTMLElement>(),
        subNav: createRef<HTMLDivElement>(),
        main: createRef<HTMLElement>(),
        content: createRef<HTMLDivElement>(),
        footer: createRef<HTMLElement>(),
      };
      render(
        <TopNavShell ref={refs.root}>
          <TopNavShell.SkipLink ref={refs.skip} />
          <TopNavShell.Banner ref={refs.banner}>Notice</TopNavShell.Banner>
          <TopNavShell.Header ref={refs.header}>
            <TopNavShell.SubNav ref={refs.subNav}>Sub</TopNavShell.SubNav>
          </TopNavShell.Header>
          <TopNavShell.Main ref={refs.main}>
            <TopNavShell.Content ref={refs.content}>Content</TopNavShell.Content>
          </TopNavShell.Main>
          <TopNavShell.Footer ref={refs.footer}>Footer</TopNavShell.Footer>
        </TopNavShell>,
      );
      expect(refs.root.current).toBeInstanceOf(HTMLDivElement);
      expect(refs.skip.current).toBeInstanceOf(HTMLAnchorElement);
      expect(refs.banner.current).toBeInstanceOf(HTMLDivElement);
      expect(refs.header.current).toBeInstanceOf(HTMLElement);
      expect(refs.subNav.current).toBeInstanceOf(HTMLDivElement);
      expect(refs.main.current?.tagName).toBe("MAIN");
      expect(refs.content.current).toBeInstanceOf(HTMLDivElement);
      expect(refs.footer.current?.tagName).toBe("FOOTER");
    });

    it("accepts className, style, id and data-testid on every part", () => {
      render(
        <TopNavShell className="root-class" style={{ color: "red" }} id="shell-id" data-testid="root">
          <TopNavShell.SkipLink className="c" data-testid="skip" />
          <TopNavShell.Banner className="c" data-testid="banner" />
          <TopNavShell.Header className="c" data-testid="header">
            <TopNavShell.SubNav className="c" data-testid="subnav" />
          </TopNavShell.Header>
          <TopNavShell.Main className="c" data-testid="main">
            <TopNavShell.Content className="c" data-testid="content" id="content-id" />
          </TopNavShell.Main>
          <TopNavShell.Footer className="c" data-testid="footer" />
        </TopNavShell>,
      );
      expect(screen.getByTestId("root")).toHaveClass("root-class");
      expect(screen.getByTestId("root")).toHaveAttribute("id", "shell-id");
      expect(screen.getByTestId("root")).toHaveStyle({ color: "rgb(255, 0, 0)" });
      for (const id of ["skip", "banner", "header", "subnav", "main", "content", "footer"]) expect(screen.getByTestId(id)).toHaveClass("c");
      expect(screen.getByTestId("content")).toHaveAttribute("id", "content-id");
    });

    it("passes a native attribute straight through", () => {
      render(
        <TopNavShell title="frame">
          <TopNavShell.Main aria-labelledby="page-title">
            <h1 id="page-title">Projects</h1>
          </TopNavShell.Main>
        </TopNavShell>,
      );
      expect(screen.getByRole("main", { name: "Projects" })).toBeInTheDocument();
    });

    it("does not let a passed attribute replace one the part computes itself", () => {
      render(
        <TopNavShell>
          <TopNavShell.Main busy aria-busy={false} tabIndex={0} id="x">
            Main
          </TopNavShell.Main>
        </TopNavShell>,
      );
      const main = screen.getByRole("main");
      expect(main).toHaveAttribute("aria-busy", "true");
      expect(main).toHaveAttribute("tabindex", "-1");
    });

    it("keeps its own direction and attributes when props try to replace them", () => {
      render(
        <TopNavShell {...({ "data-scrolled-edge": "no" } as object)} dir="rtl" data-testid="shell">
          <TopNavShell.Main>Main</TopNavShell.Main>
        </TopNavShell>,
      );
      expect(screen.getByTestId("shell")).toHaveAttribute("dir", "rtl");
      expect(screen.getByTestId("shell").getAttribute("data-scrolled-edge")).toBe("");
    });

    it("sets the content's size and padding through Container", () => {
      render(
        <TopNavShell>
          <TopNavShell.Main>
            <TopNavShell.Content data-testid="content" size="md" paddingBlock={8} />
          </TopNavShell.Main>
        </TopNavShell>,
      );
      expect(screen.getByTestId("content")).toHaveStyle({ paddingBlock: "var(--dbm-space-8)" });
    });
  });

  describe("a header that hides on scroll", () => {
    const scrollTo = (y: number) => {
      Object.defineProperty(window, "scrollY", { configurable: true, value: y });
      act(() => {
        fireEvent.scroll(document);
      });
    };

    it("hides on a scroll down past the first screenful, and comes back on a scroll up and at the top", () => {
      render(<Shell stickyHeader="auto" />);
      const shell = screen.getByTestId("shell");
      expect(shell).toHaveAttribute("data-sticky-header", "auto");
      expect(shell).not.toHaveAttribute("data-header-hidden");
      scrollTo(40);
      expect(shell).not.toHaveAttribute("data-header-hidden");
      scrollTo(200);
      expect(shell).toHaveAttribute("data-header-hidden");
      scrollTo(150);
      expect(shell).not.toHaveAttribute("data-header-hidden");
      scrollTo(400);
      expect(shell).toHaveAttribute("data-header-hidden");
      scrollTo(0);
      expect(shell).not.toHaveAttribute("data-header-hidden");
    });

    it("ignores a tiny move, so a trembling finger does not make the header flicker", () => {
      render(<Shell stickyHeader="auto" />);
      scrollTo(300);
      expect(screen.getByTestId("shell")).toHaveAttribute("data-header-hidden");
      scrollTo(298);
      expect(screen.getByTestId("shell")).toHaveAttribute("data-header-hidden");
    });

    it("never hides a header that is plainly sticky, or one that does not stick", () => {
      const { rerender } = render(<Shell />);
      scrollTo(500);
      expect(screen.getByTestId("shell")).not.toHaveAttribute("data-header-hidden");
      rerender(<Shell stickyHeader={false} />);
      scrollTo(900);
      expect(screen.getByTestId("shell")).not.toHaveAttribute("data-header-hidden");
      scrollTo(0);
    });
  });

  describe("documentTitle", () => {
    it("sets the document's title from pageTitle, and puts the old one back on unmount", () => {
      document.title = "Original";
      const { rerender, unmount } = render(<Shell pageKey="/a" pageTitle="Projects" documentTitle />);
      expect(document.title).toBe("Projects");
      rerender(<Shell pageKey="/b" pageTitle="Reports" documentTitle />);
      expect(document.title).toBe("Reports");
      unmount();
      expect(document.title).toBe("Original");
    });

    it("builds the title with a function", () => {
      render(<Shell pageKey="/a" pageTitle="Projects" documentTitle={(title) => `${title} · Acme`} />);
      expect(document.title).toBe("Projects · Acme");
    });

    it("leaves the title alone while it is off or pageTitle is left out", () => {
      document.title = "Untouched";
      const { unmount } = render(<Shell pageKey="/a" pageTitle="Projects" />);
      expect(document.title).toBe("Untouched");
      unmount();
      render(<Shell documentTitle />);
      expect(document.title).toBe("Untouched");
    });
  });

  describe("the sub-navigation", () => {
    it("draws a named nav around its links when given a label, and the links mark the current one", () => {
      render(
        <TopNavShell>
          <TopNavShell.SubNav label="Project sections">
            <TopNavShell.SubNavLink href="/a" current>
              Overview
            </TopNavShell.SubNavLink>
            <TopNavShell.SubNavLink href="/b">Activity</TopNavShell.SubNavLink>
          </TopNavShell.SubNav>
          <TopNavShell.Main>Main</TopNavShell.Main>
        </TopNavShell>,
      );
      const nav = screen.getByRole("navigation", { name: "Project sections" });
      expect(within(nav).getByRole("link", { name: "Overview" })).toHaveAttribute("aria-current", "page");
      expect(within(nav).getByRole("link", { name: "Activity" })).not.toHaveAttribute("aria-current");
    });

    it("draws no nav of its own without a label, so a nav you bring is the only one", () => {
      render(
        <TopNavShell>
          <TopNavShell.SubNav>
            <nav aria-label="Mine">
              <a href="/a">A</a>
            </nav>
          </TopNavShell.SubNav>
          <TopNavShell.Main>Main</TopNavShell.Main>
        </TopNavShell>,
      );
      expect(screen.getAllByRole("navigation")).toHaveLength(1);
    });

    it("centres by default, starts at the start on request, and takes a line away", () => {
      render(
        <TopNavShell>
          <TopNavShell.SubNav label="One" data-testid="one">
            x
          </TopNavShell.SubNav>
          <TopNavShell.SubNav label="Two" align="start" bordered={false} data-testid="two">
            x
          </TopNavShell.SubNav>
          <TopNavShell.Main>Main</TopNavShell.Main>
        </TopNavShell>,
      );
      expect(screen.getByTestId("one")).toHaveAttribute("data-align", "center");
      expect(screen.getByTestId("two")).toHaveAttribute("data-align", "start");
      expect(screen.getByTestId("one").className).toContain("subNavBordered");
      expect(screen.getByTestId("two").className).not.toContain("subNavBordered");
    });

    it("tells the shell while it is not sticky, and takes that back when it stops", () => {
      const row = (sticky: boolean) => (
        <TopNavShell data-testid="shell">
          <TopNavShell.SubNav label="Sections" sticky={sticky}>
            x
          </TopNavShell.SubNav>
          <TopNavShell.Main>Main</TopNavShell.Main>
        </TopNavShell>
      );
      const { rerender, unmount } = render(row(false));
      expect(screen.getByTestId("shell")).toHaveAttribute("data-subnav-static");
      rerender(row(true));
      expect(screen.getByTestId("shell")).not.toHaveAttribute("data-subnav-static");
      rerender(row(false));
      expect(screen.getByTestId("shell")).toHaveAttribute("data-subnav-static");
      unmount();
    });
  });

  describe("the footer, the content and the page header", () => {
    it("marks the footer's variant", () => {
      render(
        <TopNavShell>
          <TopNavShell.Main>Main</TopNavShell.Main>
          <TopNavShell.Footer variant="actions">Footer</TopNavShell.Footer>
        </TopNavShell>,
      );
      expect(screen.getByRole("contentinfo")).toHaveAttribute("data-variant", "actions");
    });

    it("keeps the content to the width preset's step, and an explicit size wins", () => {
      render(
        <TopNavShell>
          <TopNavShell.Main>
            <TopNavShell.Content width="reading" data-testid="reading" />
            <TopNavShell.Content width="full" data-testid="full" />
            <TopNavShell.Content width="dashboard" size="sm" data-testid="explicit" />
          </TopNavShell.Main>
        </TopNavShell>,
      );
      expect(screen.getByTestId("reading").className).toContain("sizeMd");
      expect(screen.getByTestId("full").className).toContain("sizeFull");
      expect(screen.getByTestId("explicit").className).toContain("sizeSm");
    });

    it("draws the page's title as its heading, with a description, breadcrumbs and actions", () => {
      render(
        <TopNavShell>
          <TopNavShell.Main>
            <TopNavShell.PageHeader
              title="Projects"
              description="All of them"
              breadcrumbs={<nav aria-label="Trail">Home</nav>}
              actions={<button type="button">New</button>}
            />
            <TopNavShell.PageHeader title="Details" titleLevel={2} />
          </TopNavShell.Main>
        </TopNavShell>,
      );
      expect(screen.getByRole("heading", { level: 1, name: "Projects" })).toBeInTheDocument();
      expect(screen.getByRole("heading", { level: 2, name: "Details" })).toBeInTheDocument();
      expect(screen.getByText("All of them")).toBeInTheDocument();
      expect(screen.getByRole("navigation", { name: "Trail" })).toBeInTheDocument();
      expect(screen.getByRole("button", { name: "New" })).toBeInTheDocument();
    });
  });

  describe("outside a shell", () => {
    it("throws for a part that needs the shell, with a message that says so", () => {
      const spy = vi.spyOn(console, "error").mockImplementation(() => undefined);
      expect(() => render(<TopNavShell.Main>Main</TopNavShell.Main>)).toThrow("TopNavShell parts must be used inside a TopNavShell.");
      spy.mockRestore();
    });
  });

  describe("accessibility", () => {
    it("has no violations by default", async () => {
      const { container } = render(<Shell />);
      expect(await axe(container)).toHaveNoViolations();
    });

    it("has no violations with a banner, busy, and a right-to-left shell", async () => {
      const { container } = render(
        <TopNavShell dir="rtl" lang="fa">
          <TopNavShell.SkipLink />
          <TopNavShell.Banner>Notice</TopNavShell.Banner>
          <TopNavShell.Header as="header">Header</TopNavShell.Header>
          <TopNavShell.Main busy>
            <TopNavShell.Content>
              <h1>Page</h1>
            </TopNavShell.Content>
          </TopNavShell.Main>
          <TopNavShell.Footer>Footer</TopNavShell.Footer>
        </TopNavShell>,
      );
      expect(await axe(container)).toHaveNoViolations();
    });
  });
});
