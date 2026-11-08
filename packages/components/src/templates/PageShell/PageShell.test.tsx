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

  describe("the content and the page header", () => {
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

    it("draws the page's title as its heading, with a description, breadcrumbs and actions", () => {
      render(
        <PageShell>
          <PageShell.Main>
            <PageShell.PageHeader
              title="Projects"
              description="All of them"
              breadcrumbs={<nav aria-label="Trail">Home</nav>}
              actions={<button type="button">New</button>}
            />
            <PageShell.PageHeader title="Details" titleLevel={2} />
          </PageShell.Main>
        </PageShell>,
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
