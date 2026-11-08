import { render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { axe } from "jest-axe";
import { createRef, StrictMode, useState } from "react";
import { describe, expect, it, vi } from "vitest";
import { DirectionProvider } from "../../atoms/DirectionProvider";
import { Navbar } from "../../organisms/Navbar";
import { PageShell } from "./PageShell";
import type { PageShellProps } from "./PageShell.types";

// jsdom matches no media query and lays out nothing, so these tests are about structure, wiring and state: the landmarks, the skip link and its
// target, the page-change handling, `busy` and the props each part passes through. The header is the app's own and is not wrapped, so its sticking is the
// `Navbar`'s and `Affix`'s; the footer's place, widths and print are in the real-browser checks.
function Shell(props: PageShellProps) {
  return (
    <PageShell data-testid="shell" {...props}>
      <PageShell.SkipLink />
      <Navbar>
        <Navbar.Brand href="/">Acme</Navbar.Brand>
        <Navbar.Links aria-label="Main">
          <Navbar.Link href="/" current>
            Home
          </Navbar.Link>
          <Navbar.Link href="/reports">Reports</Navbar.Link>
        </Navbar.Links>
      </Navbar>
      <PageShell.Main>
        <PageShell.Content>
          <h1>Projects</h1>
        </PageShell.Content>
      </PageShell.Main>
      <PageShell.Footer>
        <p>Footer</p>
      </PageShell.Footer>
    </PageShell>
  );
}

describe("PageShell", () => {
  describe("landmarks", () => {
    it("has one banner (the Navbar's), one main and one contentinfo, and the named navigation", () => {
      render(<Shell />);
      expect(screen.getAllByRole("banner")).toHaveLength(1);
      expect(screen.getAllByRole("main")).toHaveLength(1);
      expect(screen.getAllByRole("contentinfo")).toHaveLength(1);
      // The bar's links are in the page's tree from the `md` step up; jsdom matches no media query, so the stylesheet hides them as it does on a
      // phone, and a hidden element has no computed name: the names are read from the attribute.
      const navigations = screen.getAllByRole("navigation", { hidden: true }).map((navigation) => navigation.getAttribute("aria-label"));
      expect(navigations).toEqual(["Main"]);
      expect(screen.getAllByRole("heading", { level: 1 })).toHaveLength(1);
    });

    it("puts the app's header directly in the shell, with no box around it, so it can stick within the shell's column", () => {
      render(<Shell />);
      const banner = screen.getByRole("banner");
      expect(banner.tagName).toBe("HEADER");
      expect(banner.parentElement).toBe(screen.getByTestId("shell"));
    });

    it("takes a header of the app's own, which is the page's banner when it is a header", () => {
      render(
        <PageShell>
          <header data-testid="header">Brand</header>
          <PageShell.Main>Main</PageShell.Main>
        </PageShell>,
      );
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
        <PageShell>
          <PageShell.SkipLink labels={{ skipToContent: "Aller au contenu" }} href="#page" />
          <PageShell.Main id="page">Main</PageShell.Main>
        </PageShell>,
      );
      expect(screen.getByRole("link", { name: "Aller au contenu" })).toHaveAttribute("href", "#page");
      expect(screen.getByRole("main")).toHaveAttribute("id", "page");
    });

    it("keeps its own words when a label is passed as undefined", () => {
      render(
        <PageShell>
          <PageShell.SkipLink labels={{ skipToContent: undefined }} />
          <PageShell.Main>Main</PageShell.Main>
        </PageShell>,
      );
      expect(screen.getByRole("link", { name: "Skip to content" })).toBeInTheDocument();
    });

    it("takes children in place of the words", () => {
      render(
        <PageShell>
          <PageShell.SkipLink>Jump</PageShell.SkipLink>
          <PageShell.Main>Main</PageShell.Main>
        </PageShell>,
      );
      expect(screen.getByRole("link", { name: "Jump" })).toBeInTheDocument();
    });

    it("lets the main area take focus from it (tabindex -1), and is not a tab stop of its own", () => {
      render(<Shell />);
      expect(screen.getByRole("main")).toHaveAttribute("tabindex", "-1");
    });
  });

  describe("direction", () => {
    it("sets dir on its own element and gives it to what is inside", () => {
      render(
        <PageShell dir="rtl" data-testid="shell">
          <PageShell.Main>Main</PageShell.Main>
        </PageShell>,
      );
      expect(screen.getByTestId("shell")).toHaveAttribute("dir", "rtl");
    });

    it("follows the nearest DirectionProvider when it has no dir of its own, and its own dir wins", () => {
      render(
        <DirectionProvider dir="rtl">
          <PageShell data-testid="inherits">
            <PageShell.Main>Main</PageShell.Main>
          </PageShell>
          <PageShell dir="ltr" data-testid="own">
            <PageShell.Main id="other">Main</PageShell.Main>
          </PageShell>
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
        <PageShell pageKey={path} pageTitle={`Page ${path}`}>
          <PageShell.Main>
            <button type="button" onClick={() => setPath("/b")}>
              Go
            </button>
            <button type="button" onClick={() => setPath("/b")}>
              Same
            </button>
          </PageShell.Main>
        </PageShell>
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
        <PageShell>
          <PageShell.Main>Main</PageShell.Main>
        </PageShell>,
      );
      expect(screen.queryByRole("status")).not.toBeInTheDocument();
    });

    it("moves focus without announcing when there is no pageTitle", () => {
      const { rerender } = render(
        <PageShell pageKey="/a">
          <PageShell.Main>Main</PageShell.Main>
        </PageShell>,
      );
      rerender(
        <PageShell pageKey="/b">
          <PageShell.Main>Main</PageShell.Main>
        </PageShell>,
      );
      expect(screen.getByRole("main")).toHaveFocus();
      expect(screen.getByRole("status")).toHaveTextContent("");
    });

    it("treats a key that arrives after mount as the first page, not a change", () => {
      const { rerender } = render(
        <PageShell>
          <PageShell.Main>Main</PageShell.Main>
        </PageShell>,
      );
      rerender(
        <PageShell pageKey="/a" pageTitle="A">
          <PageShell.Main>Main</PageShell.Main>
        </PageShell>,
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
        <PageShell>
          <PageShell.Main busy>Main</PageShell.Main>
        </PageShell>,
      );
      expect(screen.getByRole("main")).toHaveAttribute("aria-busy", "true");
      expect(screen.getByRole("status")).toHaveTextContent("Loading");
      rerender(
        <PageShell>
          <PageShell.Main busy={false}>Main</PageShell.Main>
        </PageShell>,
      );
      expect(screen.getByRole("main")).not.toHaveAttribute("aria-busy");
      expect(screen.getByRole("status")).toHaveTextContent("");
    });

    it("draws no region at all while busy is left out", () => {
      render(
        <PageShell>
          <PageShell.Main>Main</PageShell.Main>
        </PageShell>,
      );
      expect(screen.queryByRole("status")).not.toBeInTheDocument();
    });

    it("says its own words, and keeps the default when a label is passed as undefined", () => {
      const { rerender } = render(
        <PageShell>
          <PageShell.Main busy labels={{ loading: "Chargement" }}>
            Main
          </PageShell.Main>
        </PageShell>,
      );
      expect(screen.getByRole("status")).toHaveTextContent("Chargement");
      rerender(
        <PageShell>
          <PageShell.Main busy labels={{ loading: undefined }}>
            Main
          </PageShell.Main>
        </PageShell>,
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
        main: createRef<HTMLElement>(),
        content: createRef<HTMLDivElement>(),
        footer: createRef<HTMLElement>(),
      };
      render(
        <PageShell ref={refs.root}>
          <PageShell.SkipLink ref={refs.skip} />
          <PageShell.Banner ref={refs.banner}>Notice</PageShell.Banner>
          <PageShell.Main ref={refs.main}>
            <PageShell.Content ref={refs.content}>Content</PageShell.Content>
          </PageShell.Main>
          <PageShell.Footer ref={refs.footer}>Footer</PageShell.Footer>
        </PageShell>,
      );
      expect(refs.root.current).toBeInstanceOf(HTMLDivElement);
      expect(refs.skip.current).toBeInstanceOf(HTMLAnchorElement);
      expect(refs.banner.current).toBeInstanceOf(HTMLDivElement);
      expect(refs.main.current?.tagName).toBe("MAIN");
      expect(refs.content.current).toBeInstanceOf(HTMLDivElement);
      expect(refs.footer.current?.tagName).toBe("FOOTER");
    });

    it("accepts className, style, id and data-testid on every part", () => {
      render(
        <PageShell className="root-class" style={{ color: "red" }} id="shell-id" data-testid="root">
          <PageShell.SkipLink className="c" data-testid="skip" />
          <PageShell.Banner className="c" data-testid="banner" />
          <PageShell.Main className="c" data-testid="main">
            <PageShell.Content className="c" data-testid="content" id="content-id" />
          </PageShell.Main>
          <PageShell.Footer className="c" data-testid="footer" />
        </PageShell>,
      );
      expect(screen.getByTestId("root")).toHaveClass("root-class");
      expect(screen.getByTestId("root")).toHaveAttribute("id", "shell-id");
      expect(screen.getByTestId("root")).toHaveStyle({ color: "rgb(255, 0, 0)" });
      for (const id of ["skip", "banner", "main", "content", "footer"]) expect(screen.getByTestId(id)).toHaveClass("c");
      expect(screen.getByTestId("content")).toHaveAttribute("id", "content-id");
    });

    it("passes a native attribute straight through", () => {
      render(
        <PageShell title="frame">
          <PageShell.Main aria-labelledby="page-title">
            <h1 id="page-title">Projects</h1>
          </PageShell.Main>
        </PageShell>,
      );
      expect(screen.getByRole("main", { name: "Projects" })).toBeInTheDocument();
    });

    it("does not let a passed attribute replace one the part computes itself", () => {
      render(
        <PageShell>
          <PageShell.Main busy aria-busy={false} tabIndex={0} id="x">
            Main
          </PageShell.Main>
        </PageShell>,
      );
      const main = screen.getByRole("main");
      expect(main).toHaveAttribute("aria-busy", "true");
      expect(main).toHaveAttribute("tabindex", "-1");
    });

    it("keeps its own direction and attributes when props try to replace them", () => {
      render(
        <PageShell {...({ dir: "ltr" } as object)} dir="rtl" data-testid="shell">
          <PageShell.Main>Main</PageShell.Main>
        </PageShell>,
      );
      expect(screen.getByTestId("shell")).toHaveAttribute("dir", "rtl");
    });

    it("sets the content's size and padding through Container", () => {
      render(
        <PageShell>
          <PageShell.Main>
            <PageShell.Content data-testid="content" size="md" paddingBlock={8} />
          </PageShell.Main>
        </PageShell>,
      );
      expect(screen.getByTestId("content")).toHaveStyle({ paddingBlock: "var(--dbm-space-8)" });
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

  describe("the content", () => {
    it("keeps the content to the width preset's step, and an explicit size wins", () => {
      render(
        <PageShell>
          <PageShell.Main>
            <PageShell.Content width="reading" data-testid="reading" />
            <PageShell.Content width="full" data-testid="full" />
            <PageShell.Content width="dashboard" size="sm" data-testid="explicit" />
          </PageShell.Main>
        </PageShell>,
      );
      expect(screen.getByTestId("reading").className).toContain("sizeMd");
      expect(screen.getByTestId("full").className).toContain("sizeFull");
      expect(screen.getByTestId("explicit").className).toContain("sizeSm");
    });
  });

  describe("outside a shell", () => {
    it("throws for a part that needs the shell, with a message that says so", () => {
      const spy = vi.spyOn(console, "error").mockImplementation(() => undefined);
      expect(() => render(<PageShell.Main>Main</PageShell.Main>)).toThrow("PageShell parts must be used inside a PageShell.");
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
        <PageShell dir="rtl" lang="fa">
          <PageShell.SkipLink />
          <PageShell.Banner>Notice</PageShell.Banner>
          <header>Header</header>
          <PageShell.Main busy>
            <PageShell.Content>
              <h1>Page</h1>
            </PageShell.Content>
          </PageShell.Main>
          <PageShell.Footer>Footer</PageShell.Footer>
        </PageShell>,
      );
      expect(await axe(container)).toHaveNoViolations();
    });
  });
});

describe("PageShell.Aside", () => {
  function WithAside(props: PageShellProps & { aside?: Partial<React.ComponentProps<typeof PageShell.Aside>>; toggle?: boolean }) {
    const { aside, toggle = true, ...shell } = props;
    return (
      <PageShell data-testid="shell" {...shell}>
        <PageShell.Body data-testid="body">
          <PageShell.Main>
            <h1>Projects</h1>
            {toggle && <PageShell.AsideToggle />}
          </PageShell.Main>
          <PageShell.Aside aria-label="On this page" data-testid="aside" {...aside}>
            <a href="#overview">Overview</a>
          </PageShell.Aside>
        </PageShell.Body>
      </PageShell>
    );
  }

  describe("the body and the landmark", () => {
    it("draws the aside as a complementary landmark beside the main one, not inside it, both in the body", () => {
      render(<WithAside />);
      const aside = screen.getByRole("complementary", { name: "On this page" });
      const main = screen.getByRole("main");
      expect(main).not.toContainElement(aside);
      expect(aside.tagName).toBe("ASIDE");
      expect(aside.parentElement).toBe(screen.getByTestId("body"));
      expect(main.parentElement).toBe(screen.getByTestId("body"));
    });

    it("keeps the order the parts are written in, so an aside written first is first", () => {
      render(
        <PageShell>
          <PageShell.Body data-testid="body">
            <PageShell.Aside aria-label="First">a</PageShell.Aside>
            <PageShell.Main>m</PageShell.Main>
          </PageShell.Body>
        </PageShell>,
      );
      const body = screen.getByTestId("body");
      expect(Array.from(body.children).map((child) => child.tagName)).toEqual(["ASIDE", "MAIN"]);
    });

    it("keeps the body to the width preset's step, and an explicit size wins", () => {
      render(
        <PageShell>
          <PageShell.Body width="reading" data-testid="reading">
            <PageShell.Main>m</PageShell.Main>
          </PageShell.Body>
          <PageShell.Body width="dashboard" size="sm" data-testid="explicit">
            <PageShell.Main id="other">m</PageShell.Main>
          </PageShell.Body>
        </PageShell>,
      );
      expect(screen.getByTestId("reading").className).toContain("sizeMd");
      expect(screen.getByTestId("explicit").className).toContain("sizeSm");
    });

    it("warns, once an aside is drawn without a name, in development", () => {
      const warn = vi.spyOn(console, "warn").mockImplementation(() => undefined);
      render(
        <PageShell>
          <PageShell.Body>
            <PageShell.Main>m</PageShell.Main>
            <PageShell.Aside>unnamed</PageShell.Aside>
          </PageShell.Body>
        </PageShell>,
      );
      expect(warn.mock.calls.some((call) => String(call[0]).includes("PageShell.Aside: name it"))).toBe(true);
      warn.mockRestore();
    });

    it("does not warn for an aside named by aria-labelledby", () => {
      const warn = vi.spyOn(console, "warn").mockImplementation(() => undefined);
      render(
        <PageShell>
          <PageShell.Body>
            <PageShell.Main>m</PageShell.Main>
            <h2 id="aside-title">Related</h2>
            <PageShell.Aside aria-labelledby="aside-title">x</PageShell.Aside>
          </PageShell.Body>
        </PageShell>,
      );
      expect(warn.mock.calls.some((call) => String(call[0]).includes("PageShell.Aside: name it"))).toBe(false);
      warn.mockRestore();
    });
  });

  describe("how it is marked", () => {
    it("marks the collapse it has and whether it sticks, and stays on the page at every width with collapseBelow never", () => {
      const { rerender } = render(<WithAside aside={{ sticky: true, collapse: "drawer" }} />);
      const aside = screen.getByTestId("aside");
      expect(aside).toHaveAttribute("data-collapse", "drawer");
      expect(aside).toHaveAttribute("data-sticky");
      rerender(<WithAside aside={{ collapseBelow: "never" }} />);
      expect(screen.getByTestId("aside")).not.toHaveAttribute("data-collapse");
      expect(screen.getByTestId("aside")).not.toHaveAttribute("data-sticky");
    });

    it("takes its width as a length or a number of pixels, and its sticky offset as a custom property", () => {
      const { rerender } = render(<WithAside aside={{ width: "24rem", stickyOffset: "5rem" }} />);
      expect(screen.getByTestId("aside").style.getPropertyValue("--page-shell-aside-size")).toBe("24rem");
      expect(screen.getByTestId("aside").style.getPropertyValue("--page-shell-aside-offset")).toBe("5rem");
      rerender(<WithAside aside={{ width: 300 }} />);
      expect(screen.getByTestId("aside").style.getPropertyValue("--page-shell-aside-size")).toBe("300px");
    });
  });

  // jsdom applies the stylesheet but matches no media query, so the toggle (shown only below the step) is `display: none` here, which has no computed name: it is read by its label.
  describe("the drawer", () => {
    it("draws the aside's children in a drawer only with collapse drawer, opened from the toggle, and closes it with Escape", async () => {
      const user = userEvent.setup();
      render(<WithAside aside={{ collapse: "drawer" }} />);
      expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
      const toggle = screen.getByLabelText("Show details");
      expect(toggle).toHaveAttribute("aria-expanded", "false");
      expect(toggle).toHaveAttribute("aria-haspopup", "dialog");
      await user.click(toggle);
      const dialog = await screen.findByRole("dialog", { name: "On this page" });
      expect(within(dialog).getByRole("link", { name: "Overview" })).toBeInTheDocument();
      expect(screen.getByLabelText("Show details")).toHaveAttribute("aria-expanded", "true");
      await user.keyboard("{Escape}");
      await waitFor(() => expect(screen.queryByRole("dialog")).not.toBeInTheDocument());
    });

    it("draws no drawer for a stacked aside, and a toggle that opens nothing", async () => {
      const user = userEvent.setup();
      render(<WithAside />);
      await user.click(screen.getByLabelText("Show details"));
      expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    });

    it("starts open with defaultAsideOpen, and tells the app when it opens or closes", async () => {
      const user = userEvent.setup();
      const onChange = vi.fn();
      render(<WithAside aside={{ collapse: "drawer" }} defaultAsideOpen onAsideOpenChange={onChange} />);
      expect(await screen.findByRole("dialog")).toBeInTheDocument();
      await user.keyboard("{Escape}");
      expect(onChange).toHaveBeenCalledWith(false);
    });

    it("is controlled by asideOpen, and a press asks for the change without making it", async () => {
      const user = userEvent.setup();
      const onChange = vi.fn();
      render(<WithAside aside={{ collapse: "drawer" }} asideOpen={false} onAsideOpenChange={onChange} />);
      await user.click(screen.getByLabelText("Show details"));
      expect(onChange).toHaveBeenCalledWith(true);
      expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    });

    it("gives the drawer its title from aria-label, else from its labels, and takes its close button's words from labels", async () => {
      const { rerender } = render(<WithAside aside={{ collapse: "drawer", labels: { close: "Fermer" } }} defaultAsideOpen />);
      expect(await screen.findByRole("dialog", { name: "On this page" })).toBeInTheDocument();
      expect(screen.getByRole("button", { name: "Fermer" })).toBeInTheDocument();
      rerender(<WithAside aside={{ collapse: "drawer", "aria-label": undefined, "aria-labelledby": "x", labels: { title: "Détails" } }} defaultAsideOpen />);
      expect(await screen.findByRole("dialog", { name: "Détails" })).toBeInTheDocument();
    });

    it("takes the toggle's words and icon from its props", () => {
      render(
        <PageShell>
          <PageShell.AsideToggle labels={{ open: "Afficher" }} data-testid="toggle" variant="secondary" />
          <PageShell.Main>m</PageShell.Main>
        </PageShell>,
      );
      expect(screen.getByLabelText("Afficher")).toBeInTheDocument();
    });

    it("works under StrictMode", async () => {
      const user = userEvent.setup();
      render(
        <StrictMode>
          <WithAside aside={{ collapse: "drawer" }} />
        </StrictMode>,
      );
      await user.click(screen.getByLabelText("Show details"));
      expect(await screen.findByRole("dialog")).toBeInTheDocument();
    });
  });

  describe("refs and passthrough", () => {
    it("forwards a ref to the aside, the body and the toggle", () => {
      const aside = createRef<HTMLElement>();
      const body = createRef<HTMLDivElement>();
      const toggle = createRef<HTMLButtonElement>();
      render(
        <PageShell>
          <PageShell.Body ref={body}>
            <PageShell.Main>
              <PageShell.AsideToggle ref={toggle} />
            </PageShell.Main>
            <PageShell.Aside ref={aside} aria-label="A">
              x
            </PageShell.Aside>
          </PageShell.Body>
        </PageShell>,
      );
      expect(aside.current?.tagName).toBe("ASIDE");
      expect(body.current).toBeInstanceOf(HTMLDivElement);
      expect(toggle.current?.tagName).toBe("BUTTON");
    });

    it("accepts className, style, id and data-testid, and a native attribute", () => {
      render(<WithAside aside={{ className: "c", id: "aside-id", title: "extra", style: { color: "red" } }} />);
      const aside = screen.getByTestId("aside");
      expect(aside).toHaveClass("c");
      expect(aside).toHaveAttribute("id", "aside-id");
      expect(aside).toHaveAttribute("title", "extra");
      expect(aside).toHaveStyle({ color: "rgb(255, 0, 0)" });
    });
  });

  it("publishes the header's height while it sticks, and follows it starting and stopping without a resize", async () => {
    const rect = vi.spyOn(HTMLElement.prototype, "getBoundingClientRect").mockReturnValue({ height: 56 } as DOMRect);
    function Page({ sticky }: { sticky: boolean }) {
      return (
        <PageShell data-testid="shell">
          <header style={{ position: sticky ? "sticky" : "static" }}>Bar</header>
          <PageShell.Main>Main</PageShell.Main>
        </PageShell>
      );
    }
    const { rerender } = render(<Page sticky={false} />);
    const shell = screen.getByTestId("shell");
    expect(shell.style.getPropertyValue("--page-shell-header-height")).toBe("0px");
    rerender(<Page sticky />);
    await waitFor(() => expect(shell.style.getPropertyValue("--page-shell-header-height")).toBe("56px"));
    rerender(<Page sticky={false} />);
    await waitFor(() => expect(shell.style.getPropertyValue("--page-shell-header-height")).toBe("0px"));
    rect.mockRestore();
  });

  it("throws for the aside or its toggle outside a shell", () => {
    const spy = vi.spyOn(console, "error").mockImplementation(() => undefined);
    expect(() => render(<PageShell.Aside aria-label="x">a</PageShell.Aside>)).toThrow("PageShell parts must be used inside a PageShell.");
    expect(() => render(<PageShell.AsideToggle />)).toThrow("PageShell parts must be used inside a PageShell.");
    spy.mockRestore();
  });

  it("has no accessibility violations beside the page, stacked or as a drawer", async () => {
    const { container, rerender } = render(<WithAside />);
    expect(await axe(container)).toHaveNoViolations();
    rerender(<WithAside aside={{ collapse: "drawer", sticky: true }} />);
    expect(await axe(container)).toHaveNoViolations();
  });
});
