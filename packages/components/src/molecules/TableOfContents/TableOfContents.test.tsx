import { act, fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { axe } from "jest-axe";
import { createRef, StrictMode } from "react";
import { hydrateRoot } from "react-dom/client";
import { renderToString } from "react-dom/server";
import type { ReactNode } from "react";
import { BellIcon } from "@dbm-system/icons";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { TableOfContents } from "./TableOfContents";
import type { TableOfContentsItem } from "./TableOfContents.types";

const items: TableOfContentsItem[] = [
  { id: "intro", label: "Intro" },
  { id: "setup", label: "Setup", level: 2 },
  { id: "usage", label: "Usage" },
];

/** Headings with the ids `items` points at, in a page of their own. */
const Page = ({ children }: { children?: ReactNode }) => (
  <>
    <h2 id="intro">Intro</h2>
    <h3 id="setup">Setup</h3>
    <h2 id="usage">Usage</h2>
    {children}
  </>
);

/** Where each element sits on a page scrolled to `scroll.y`: jsdom lays nothing out, so a heading's top is given. */
const scroll = { y: 0 };
function layout(tops: Record<string, number>) {
  vi.spyOn(Element.prototype, "getBoundingClientRect").mockImplementation(function (this: Element) {
    const top = this.id in tops ? (tops[this.id] as number) - scroll.y : 0;
    return { top, bottom: top, left: 0, right: 0, width: 0, height: 0, x: 0, y: top, toJSON: () => ({}) };
  });
}
const scrollTo = (y: number) => {
  scroll.y = y;
  fireEvent.scroll(window);
};

const current = () => document.querySelector('[aria-current="location"]')?.textContent ?? null;

beforeEach(() => {
  scroll.y = 0;
  window.scrollTo = vi.fn() as typeof window.scrollTo;
  window.history.replaceState(null, "", "/");
});
afterEach(() => {
  vi.restoreAllMocks();
});

describe("TableOfContents — structure", () => {
  it("renders a nav named by its heading, around a list of links to the sections", () => {
    render(<TableOfContents items={items} />);
    const nav = screen.getByRole("navigation", { name: "On this page" });
    expect(within(nav).getByRole("list")).toBeInTheDocument();
    expect(within(nav).getAllByRole("listitem")).toHaveLength(3);
    expect(within(nav).getByRole("link", { name: "Setup" })).toHaveAttribute("href", "#setup");
  });

  it("renders nothing for an empty list", () => {
    const { container } = render(<TableOfContents items={[]} />);
    expect(container).toBeEmptyDOMElement();
  });

  it("keeps a name for the nav when the heading is hidden", () => {
    render(<TableOfContents items={items} showTitle={false} />);
    expect(screen.queryByText("On this page")).not.toBeInTheDocument();
    expect(screen.getByRole("navigation", { name: "Table of contents" })).toBeInTheDocument();
  });

  it("takes its name from aria-label or aria-labelledby over the heading", () => {
    const { rerender } = render(<TableOfContents items={items} aria-label="Chapter outline" />);
    expect(screen.getByRole("navigation", { name: "Chapter outline" })).toBeInTheDocument();
    rerender(
      <>
        <span id="name">Named elsewhere</span>
        <TableOfContents items={items} aria-labelledby="name" />
      </>,
    );
    expect(screen.getByRole("navigation", { name: "Named elsewhere" })).toBeInTheDocument();
  });

  it("translates its text, and keeps a default whose override is undefined", () => {
    const { rerender } = render(<TableOfContents items={items} labels={{ title: "Sur cette page" }} />);
    expect(screen.getByRole("navigation", { name: "Sur cette page" })).toBeInTheDocument();
    rerender(<TableOfContents items={items} labels={{ title: undefined }} />);
    expect(screen.getByRole("navigation", { name: "On this page" })).toBeInTheDocument();
  });

  it("states its list roles outright, for Safari with VoiceOver", () => {
    render(<TableOfContents items={items} />);
    expect(screen.getByRole("list").tagName).toBe("UL");
    expect(screen.getByRole("list")).toHaveAttribute("role", "list");
    screen.getAllByRole("listitem").forEach((item) => expect(item).toHaveAttribute("role", "listitem"));
  });

  it("forwards the ref to the nav and passes className, style, id and data-testid through", () => {
    const ref = createRef<HTMLElement>();
    render(<TableOfContents ref={ref} items={items} className="mine" style={{ margin: 3 }} id="toc" data-testid="x" />);
    const nav = screen.getByTestId("x");
    expect(ref.current).toBe(nav);
    expect(nav.tagName).toBe("NAV");
    expect(nav).toHaveClass("mine");
    expect(nav).toHaveStyle({ margin: "3px" });
    expect(nav).toHaveAttribute("id", "toc");
  });

  it("indents by level and clamps a level outside 1 to 4", () => {
    render(<TableOfContents items={[{ id: "a", label: "A", level: 2 }, { id: "b", label: "B", level: 9 as 4 }, { id: "c", label: "C" }]} />);
    const [a, b, c] = screen.getAllByRole("listitem");
    expect(a?.className).toMatch(/level2/);
    expect(b?.className).toMatch(/level4/);
    expect(c?.className).not.toMatch(/level/);
  });

  it("has no accessibility violations", async () => {
    const { container } = render(<TableOfContents items={items} defaultActiveId="setup" />);
    expect(await axe(container)).toHaveNoViolations();
  });
});

describe("TableOfContents — highlightActive", () => {
  it("is on by default, and false takes the class that fills the current entry off", () => {
    const { rerender } = render(<TableOfContents items={items} defaultActiveId="setup" />);
    expect(screen.getByRole("navigation").className).toMatch(/highlighted/);
    rerender(<TableOfContents items={items} defaultActiveId="setup" highlightActive={false} />);
    expect(screen.getByRole("navigation").className).not.toMatch(/highlighted/);
    // It changes how the current entry is drawn, not what is announced or which entry it is.
    expect(screen.getByRole("link", { name: "Setup" })).toHaveAttribute("aria-current", "location");
    expect(screen.getAllByRole("link").filter((link) => link.hasAttribute("aria-current"))).toHaveLength(1);
  });
});

describe("TableOfContents — reading the headings", () => {
  it("builds the outline from the page's h2 and h3, indented by level", async () => {
    render(
      <>
        <Page />
        <TableOfContents />
      </>,
    );
    const nav = await screen.findByRole("navigation");
    expect(within(nav).getAllByRole("link").map((link) => link.textContent)).toEqual(["Intro", "Setup", "Usage"]);
    expect(within(nav).getByRole("link", { name: "Setup" }).closest("li")?.className).toMatch(/level2/);
  });

  it("reads only inside contentRef, and only what `selector` finds", async () => {
    const ref = createRef<HTMLElement>();
    render(
      <>
        <h2 id="outside">Outside</h2>
        <article ref={ref}>
          <h2 id="in-two">In two</h2>
          <h4 id="in-four">In four</h4>
          <div id="custom" data-toc="">Custom</div>
        </article>
        <TableOfContents contentRef={ref} selector="h2, h4" />
      </>,
    );
    const nav = await screen.findByRole("navigation");
    expect(within(nav).getAllByRole("link").map((link) => link.textContent)).toEqual(["In two", "In four"]);
    // h2 is the highest found, so h4 is two levels below it.
    expect(within(nav).getByRole("link", { name: "In four" }).closest("li")?.className).toMatch(/level3/);
  });

  it("takes a level from data-toc-level on an element that is not a heading", async () => {
    render(
      <>
        <div id="a" data-toc-level="1">A</div>
        <div id="b" data-toc-level="3">B</div>
        <TableOfContents selector="[data-toc-level]" />
      </>,
    );
    const nav = await screen.findByRole("navigation");
    expect(within(nav).getByRole("link", { name: "B" }).closest("li")?.className).toMatch(/level3/);
  });

  it("skips a heading with no id, with a warning in development", async () => {
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
    render(
      <>
        <h2>No id here</h2>
        <h2 id="has-id">Has an id</h2>
        <TableOfContents />
      </>,
    );
    const nav = await screen.findByRole("navigation");
    expect(within(nav).getAllByRole("link")).toHaveLength(1);
    expect(warn).toHaveBeenCalledWith(expect.stringContaining("No id here"));
  });

  it("renders nothing when it finds nothing, and warns for a selector that is not valid", async () => {
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
    const { container } = render(<TableOfContents selector="h2[" />);
    expect(container).toBeEmptyDOMElement();
    expect(warn).toHaveBeenCalledWith(expect.stringContaining("not a valid CSS selector"));
  });

  it("picks up a heading that arrives later, and one that is removed", async () => {
    const { rerender } = render(
      <>
        <h2 id="one">One</h2>
        <TableOfContents />
      </>,
    );
    await screen.findByRole("link", { name: "One" });
    rerender(
      <>
        <h2 id="one">One</h2>
        <h2 id="two">Two</h2>
        <TableOfContents />
      </>,
    );
    await screen.findByRole("link", { name: "Two" });
    rerender(
      <>
        <h2 id="two">Two</h2>
        <TableOfContents />
      </>,
    );
    await waitFor(() => expect(screen.queryByRole("link", { name: "One" })).not.toBeInTheDocument());
  });

  it("is not thrown off by its own updates", async () => {
    render(
      <>
        <Page />
        <TableOfContents />
      </>,
    );
    await screen.findByRole("navigation");
    layout({ intro: 0, setup: 400, usage: 800 });
    scrollTo(450);
    await waitFor(() => expect(current()).toBe("Setup"));
    expect(screen.getAllByRole("link")).toHaveLength(3);
  });
});

describe("TableOfContents — the current entry", () => {
  it("marks the default entry with aria-current", () => {
    render(<TableOfContents items={items} defaultActiveId="setup" />);
    expect(screen.getByRole("link", { name: "Setup" })).toHaveAttribute("aria-current", "location");
    expect(screen.getByRole("link", { name: "Intro" })).not.toHaveAttribute("aria-current");
  });

  it("follows the scroll position: the last heading that has reached the top, or the first one showing before any has", async () => {
    // The headings start below the bottom of the (768px tall) window.
    layout({ intro: 1000, setup: 1400, usage: 1800 });
    const onActiveIdChange = vi.fn();
    render(
      <>
        <Page />
        <TableOfContents items={items} onActiveIdChange={onActiveIdChange} />
      </>,
    );
    // The first heading is still below the fold: nothing is marked.
    expect(current()).toBeNull();
    scrollTo(300);
    await waitFor(() => expect(current()).toBe("Intro"));
    scrollTo(1050);
    await waitFor(() => expect(current()).toBe("Intro"));
    scrollTo(1450);
    await waitFor(() => expect(current()).toBe("Setup"));
    scrollTo(1900);
    await waitFor(() => expect(current()).toBe("Usage"));
    expect(onActiveIdChange.mock.calls.map(([id]) => id)).toEqual(["intro", "setup", "usage"]);
    scrollTo(0);
    await waitFor(() => expect(current()).toBeNull());
    expect(onActiveIdChange).toHaveBeenLastCalledWith(undefined);
  });

  it("marks the first heading on load when it is showing, though it hasn't reached the top", () => {
    layout({ intro: 100, setup: 400, usage: 800 });
    render(
      <>
        <Page />
        <TableOfContents items={items} />
      </>,
    );
    expect(current()).toBe("Intro");
  });

  it("marks only a heading showing inside the scrolling box, not one below its bottom", () => {
    const box = document.createElement("div");
    document.body.appendChild(box);
    const rect = (top: number, bottom: number) => ({ top, bottom, left: 0, right: 0, width: 0, height: 0, x: 0, y: top, toJSON: () => ({}) });
    vi.spyOn(Element.prototype, "getBoundingClientRect").mockImplementation(function (this: Element) {
      if (this === box) return rect(0, 300);
      return rect(this.id === "intro" ? 400 : 900, 0);
    });
    render(
      <>
        <Page />
        <TableOfContents items={items} scrollContainerRef={{ current: box }} />
      </>,
    );
    expect(current()).toBeNull();
    box.remove();
  });

  it("starts where the page already is", () => {
    layout({ intro: -300, setup: -100, usage: 500 });
    render(
      <>
        <Page />
        <TableOfContents items={items} />
      </>,
    );
    expect(current()).toBe("Setup");
  });

  it("keeps a given defaultActiveId until the page scrolls", async () => {
    layout({ intro: -300, setup: -100, usage: 500 });
    render(
      <>
        <Page />
        <TableOfContents items={items} defaultActiveId="usage" />
      </>,
    );
    expect(current()).toBe("Usage");
    scrollTo(1);
    await waitFor(() => expect(current()).toBe("Setup"));
  });

  it("keeps the marked entry when none of the sections are on the page, however the page scrolls", async () => {
    render(<TableOfContents items={items} defaultActiveId="setup" />);
    scrollTo(500);
    await new Promise((resolve) => setTimeout(resolve, 50));
    expect(current()).toBe("Setup");
  });

  it("counts a heading as reached `scrollOffset` pixels below the top", async () => {
    layout({ intro: 0, setup: 400, usage: 800 });
    render(
      <>
        <Page />
        <TableOfContents items={items} scrollOffset={60} />
      </>,
    );
    scrollTo(350);
    await waitFor(() => expect(current()).toBe("Setup"));
    scrollTo(300);
    await waitFor(() => expect(current()).toBe("Intro"));
  });

  it("measures against the scrolling element when given one", async () => {
    const box = document.createElement("div");
    document.body.appendChild(box);
    const boxRef = { current: box };
    layout({ intro: 100, setup: 400, usage: 800 });
    render(
      <>
        <Page />
        <TableOfContents items={items} scrollContainerRef={boxRef} />
      </>,
    );
    scroll.y = 450;
    fireEvent.scroll(box);
    await waitFor(() => expect(current()).toBe("Setup"));
    box.remove();
  });

  it("marks the last section at the very end even though it can't reach the top", async () => {
    layout({ intro: 0, setup: 400, usage: 800 });
    const root = document.documentElement;
    const define = (name: string, value: number) => Object.defineProperty(root, name, { configurable: true, value });
    define("scrollHeight", 1000);
    define("clientHeight", 400);
    define("scrollTop", 600);
    render(
      <>
        <Page />
        <TableOfContents items={items} />
      </>,
    );
    scrollTo(600);
    await waitFor(() => expect(current()).toBe("Usage"));
    // jsdom's own values again for the other tests.
    for (const name of ["scrollHeight", "clientHeight", "scrollTop"]) delete (root as unknown as Record<string, unknown>)[name];
  });

  it("is controlled by activeId: a click asks, the prop decides, and scrolling doesn't change it", async () => {
    layout({ intro: 0, setup: 400, usage: 800 });
    const onActiveIdChange = vi.fn();
    const { rerender } = render(
      <>
        <Page />
        <TableOfContents items={items} activeId="intro" onActiveIdChange={onActiveIdChange} />
      </>,
    );
    await userEvent.click(screen.getByRole("link", { name: "Usage" }));
    expect(onActiveIdChange).toHaveBeenCalledWith("usage");
    expect(current()).toBe("Intro");
    scrollTo(900);
    await new Promise((resolve) => setTimeout(resolve, 50));
    expect(current()).toBe("Intro");
    rerender(
      <>
        <Page />
        <TableOfContents items={items} activeId="usage" onActiveIdChange={onActiveIdChange} />
      </>,
    );
    expect(current()).toBe("Usage");
  });

  it("works inside StrictMode", async () => {
    layout({ intro: 100, setup: 400, usage: 800 });
    render(
      <StrictMode>
        <Page />
        <TableOfContents />
      </StrictMode>,
    );
    await screen.findByRole("navigation");
    scrollTo(450);
    await waitFor(() => expect(current()).toBe("Setup"));
  });
});

describe("TableOfContents — following a link", () => {
  const matchMedia = (reduced: boolean) =>
    vi.spyOn(window, "matchMedia").mockImplementation(
      (query) => ({ matches: reduced && query.includes("reduce"), media: query, addEventListener() {}, removeEventListener() {} }) as unknown as MediaQueryList,
    );

  it("scrolls the page so the section sits at the top, smoothly, and names it in the address", async () => {
    layout({ intro: 0, setup: 400, usage: 800 });
    matchMedia(false);
    render(
      <>
        <Page />
        <TableOfContents items={items} />
      </>,
    );
    await userEvent.click(screen.getByRole("link", { name: "Usage" }));
    expect(window.scrollTo).toHaveBeenCalledWith({ top: 800, behavior: "smooth" });
    expect(window.location.hash).toBe("#usage");
    expect(current()).toBe("Usage");
  });

  it("leaves the section `scrollOffset` pixels from the top", async () => {
    layout({ intro: 0, setup: 400, usage: 800 });
    matchMedia(false);
    render(
      <>
        <Page />
        <TableOfContents items={items} scrollOffset={56} />
      </>,
    );
    await userEvent.click(screen.getByRole("link", { name: "Usage" }));
    expect(window.scrollTo).toHaveBeenCalledWith({ top: 744, behavior: "smooth" });
  });

  it("does not scroll smoothly when asked not to, or when the person prefers reduced motion", async () => {
    layout({ intro: 0, setup: 400, usage: 800 });
    matchMedia(true);
    const { rerender } = render(
      <>
        <Page />
        <TableOfContents items={items} />
      </>,
    );
    await userEvent.click(screen.getByRole("link", { name: "Usage" }));
    expect(window.scrollTo).toHaveBeenLastCalledWith({ top: 800, behavior: "auto" });
    matchMedia(false);
    rerender(
      <>
        <Page />
        <TableOfContents items={items} smoothScroll={false} />
      </>,
    );
    await userEvent.click(screen.getByRole("link", { name: "Setup" }));
    expect(window.scrollTo).toHaveBeenLastCalledWith({ top: 400, behavior: "auto" });
  });

  it("scrolls the container instead of the page when given one", async () => {
    layout({ intro: 0, setup: 400, usage: 800 });
    matchMedia(false);
    const box = document.createElement("div");
    box.scrollTo = vi.fn() as typeof box.scrollTo;
    document.body.appendChild(box);
    render(
      <>
        <Page />
        <TableOfContents items={items} scrollContainerRef={{ current: box }} />
      </>,
    );
    await userEvent.click(screen.getByRole("link", { name: "Setup" }));
    expect(box.scrollTo).toHaveBeenCalledWith({ top: 400, behavior: "smooth" });
    expect(window.scrollTo).not.toHaveBeenCalled();
    box.remove();
  });

  it("leaves a click with a modifier key, or on a missing target, to the browser", async () => {
    matchMedia(false);
    render(
      <>
        <Page />
        <TableOfContents items={[...items, { id: "nowhere", label: "Nowhere" }]} />
      </>,
    );
    const link = screen.getByRole("link", { name: "Usage" });
    expect(fireEvent.click(link, { ctrlKey: true })).toBe(true);
    expect(fireEvent.click(link, { metaKey: true })).toBe(true);
    expect(fireEvent.click(link, { button: 1 })).toBe(true);
    expect(fireEvent.click(screen.getByRole("link", { name: "Nowhere" }))).toBe(true);
    expect(window.scrollTo).not.toHaveBeenCalled();
  });

  it("leaves a click the caller's handler already cancelled alone", () => {
    render(
      <>
        <Page />
        <TableOfContents items={items} />
      </>,
    );
    const link = screen.getByRole("link", { name: "Usage" });
    link.addEventListener("click", (event) => event.preventDefault(), { capture: true });
    fireEvent.click(link);
    expect(window.scrollTo).not.toHaveBeenCalled();
  });

  it("moves keyboard focus to the section after a key press, not after a mouse click", async () => {
    layout({ intro: 0, setup: 400, usage: 800 });
    render(
      <>
        <Page />
        <TableOfContents items={items} />
      </>,
    );
    await userEvent.click(screen.getByRole("link", { name: "Setup" }));
    expect(document.getElementById("setup")).not.toHaveFocus();
    screen.getByRole("link", { name: "Usage" }).focus();
    await userEvent.keyboard("{Enter}");
    expect(document.getElementById("usage")).toHaveFocus();
    expect(document.getElementById("usage")).toHaveAttribute("tabindex", "-1");
  });

  it("keeps a tabindex the section already has", async () => {
    render(
      <>
        {/* eslint-disable-next-line jsx-a11y/no-noninteractive-tabindex -- the test needs a heading that already has one. */}
        <h2 id="intro" tabIndex={0}>
          Intro
        </h2>
        <TableOfContents items={[{ id: "intro", label: "Intro" }]} />
      </>,
    );
    screen.getByRole("link", { name: "Intro" }).focus();
    await userEvent.keyboard("{Enter}");
    expect(document.getElementById("intro")).toHaveAttribute("tabindex", "0");
  });

  it("holds the clicked entry while the page is still scrolling to it", async () => {
    layout({ intro: 0, setup: 400, usage: 800 });
    matchMedia(false);
    render(
      <>
        <Page />
        <TableOfContents items={items} />
      </>,
    );
    await userEvent.click(screen.getByRole("link", { name: "Usage" }));
    // A scroll event on the way (the smooth scroll passes Setup) doesn't move the mark.
    scrollTo(450);
    await new Promise((resolve) => setTimeout(resolve, 50));
    expect(current()).toBe("Usage");
    // Once the scrolling stops, the outline reads where the page is.
    await waitFor(() => expect(current()).toBe("Setup"), { timeout: 1000 });
  });
});

describe("TableOfContents — cleanup", () => {
  it("stops listening for scroll when it unmounts", () => {
    const remove = vi.spyOn(window, "removeEventListener");
    const { unmount } = render(
      <>
        <Page />
        <TableOfContents items={items} />
      </>,
    );
    unmount();
    expect(remove.mock.calls.map(([type]) => type)).toEqual(expect.arrayContaining(["scroll", "resize"]));
  });

});

describe("TableOfContents — levels", () => {
  const leveled: TableOfContentsItem[] = [
    { id: "a", label: "A" },
    { id: "b", label: "B", level: 2 },
    { id: "c", label: "C", level: 3 },
    { id: "d", label: "D" },
  ];

  it("maxLevel leaves out the deeper entries", () => {
    render(<TableOfContents items={leveled} maxLevel={2} />);
    expect(screen.getAllByRole("link").map((link) => link.textContent)).toEqual(["A", "B", "D"]);
  });

  it("minLevel leaves out the shallower entries and indents the rest from it", () => {
    render(<TableOfContents items={leveled} minLevel={2} />);
    expect(screen.getAllByRole("link").map((link) => link.textContent)).toEqual(["B", "C"]);
    const [b, c] = screen.getAllByRole("listitem");
    expect(b?.className).not.toMatch(/level/);
    expect(c?.className).toMatch(/level2/);
  });

  it("treats a maxLevel below minLevel as minLevel, and renders nothing when nothing is left", () => {
    render(<TableOfContents items={leveled} minLevel={3} maxLevel={1} />);
    expect(screen.getAllByRole("link").map((link) => link.textContent)).toEqual(["C"]);
    const { container } = render(<TableOfContents items={[{ id: "x", label: "X" }]} minLevel={2} />);
    expect(container.querySelector("nav")).toBeNull();
  });

  it("applies to headings read from the page too", async () => {
    render(
      <>
        <h2 id="h2">Two</h2>
        <h3 id="h3">Three</h3>
        <h4 id="h4">Four</h4>
        <TableOfContents selector="h2, h3, h4" maxLevel={2} />
      </>,
    );
    const nav = await screen.findByRole("navigation");
    expect(within(nav).getAllByRole("link").map((link) => link.textContent)).toEqual(["Two", "Three"]);
  });
});

describe("TableOfContents — entry extras", () => {
  it("draws an icon before the text and trailing content after it, inside the link", () => {
    render(<TableOfContents items={[{ id: "a", label: "Alerts", icon: BellIcon, trailing: <span>New</span> }]} />);
    const link = screen.getByRole("link", { name: /Alerts\s*New/ });
    expect(link.querySelector("svg")).toBeInTheDocument();
    expect(link.querySelector("svg")).toHaveAttribute("aria-hidden", "true");
    expect(within(link).getByText("New")).toBeInTheDocument();
  });

  it("puts an entry's data-testid on its link, and never on the other entries", () => {
    render(<TableOfContents items={[{ id: "a", label: "A", "data-testid": "entry-a" }, { id: "b", label: "B" }]} defaultActiveId="a" />);
    const link = screen.getByTestId("entry-a");
    expect(link.tagName).toBe("A");
    expect(link).toHaveAttribute("aria-current", "location");
    expect(document.querySelectorAll("[data-testid]")).toHaveLength(1);
  });

  it("disables an entry: aria-disabled, focusable, and a click neither scrolls nor asks to mark it", async () => {
    layout({ intro: 0, setup: 400, usage: 800 });
    const onActiveIdChange = vi.fn();
    render(
      <>
        <Page />
        <TableOfContents
          items={[{ id: "setup", label: "Setup", disabled: true }, { id: "usage", label: "Usage" }]}
          activeId="usage"
          onActiveIdChange={onActiveIdChange}
        />
      </>,
    );
    const link = screen.getByRole("link", { name: "Setup" });
    expect(link).toHaveAttribute("aria-disabled", "true");
    link.focus();
    expect(link).toHaveFocus();
    await userEvent.click(link);
    expect(window.scrollTo).not.toHaveBeenCalled();
    expect(onActiveIdChange).not.toHaveBeenCalled();
  });
});

describe("TableOfContents — sticky", () => {
  it("stays one nav with its name, ref and attributes, and is drawn sticky", () => {
    const ref = createRef<HTMLElement>();
    render(<TableOfContents ref={ref} items={items} sticky data-testid="toc" className="mine" />);
    const nav = screen.getByRole("navigation", { name: "On this page" });
    expect(ref.current).toBe(nav);
    expect(nav).toHaveAttribute("data-testid", "toc");
    expect(nav).toHaveClass("mine");
    // `Affix` gives it a `top` offset on the spacing scale; a plain outline has none.
    expect(nav.getAttribute("style") ?? "").toMatch(/top:\s*var\(--dbm-space/);
  });

  it("is not sticky by default", () => {
    render(<TableOfContents items={items} />);
    expect(screen.getByRole("navigation").getAttribute("style") ?? "").not.toMatch(/top:/);
  });
});

describe("TableOfContents — a page opened at #id", () => {
  it("scrolls that section to the offset and marks it", async () => {
    layout({ intro: 0, setup: 400, usage: 800 });
    window.history.replaceState(null, "", "/#usage");
    render(
      <>
        <Page />
        <TableOfContents items={items} scrollOffset={56} />
      </>,
    );
    await waitFor(() => expect(window.scrollTo).toHaveBeenCalledWith({ top: 744, behavior: "auto" }));
    expect(current()).toBe("Usage");
  });

  it("does nothing when told not to", async () => {
    layout({ intro: 0, setup: 400, usage: 800 });
    window.history.replaceState(null, "", "/#usage");
    render(
      <>
        <Page />
        <TableOfContents items={items} scrollToHash={false} />
      </>,
    );
    await new Promise((resolve) => setTimeout(resolve, 50));
    expect(window.scrollTo).not.toHaveBeenCalled();
  });

  it("does nothing when the address names no entry, or its target isn't on the page", async () => {
    layout({ intro: 0, setup: 400, usage: 800 });
    window.history.replaceState(null, "", "/#not-an-entry");
    const { unmount } = render(
      <>
        <Page />
        <TableOfContents items={items} />
      </>,
    );
    await new Promise((resolve) => setTimeout(resolve, 50));
    unmount();
    window.history.replaceState(null, "", "/#elsewhere");
    render(<TableOfContents items={[...items, { id: "elsewhere", label: "Elsewhere" }]} />);
    await new Promise((resolve) => setTimeout(resolve, 50));
    expect(window.scrollTo).not.toHaveBeenCalled();
  });

  it("reaches a heading read from the page after the first render", async () => {
    window.history.replaceState(null, "", "/#late");
    const { rerender } = render(<TableOfContents />);
    layout({ late: 900 });
    rerender(
      <>
        <h2 id="late">Late</h2>
        <TableOfContents />
      </>,
    );
    await waitFor(() => expect(window.scrollTo).toHaveBeenCalledWith({ top: 900, behavior: "auto" }));
  });

  it("works inside StrictMode", async () => {
    layout({ intro: 0, setup: 400, usage: 800 });
    window.history.replaceState(null, "", "/#setup");
    render(
      <StrictMode>
        <Page />
        <TableOfContents items={items} />
      </StrictMode>,
    );
    await waitFor(() => expect(window.scrollTo).toHaveBeenCalledWith({ top: 400, behavior: "auto" }));
  });
});

describe("TableOfContents — an outline that scrolls on its own", () => {
  function setup(linkTop: number, linkBottom: number) {
    const box = document.createElement("div");
    box.style.overflowY = "auto";
    document.body.appendChild(box);
    Object.defineProperty(box, "scrollHeight", { configurable: true, value: 500 });
    Object.defineProperty(box, "clientHeight", { configurable: true, value: 100 });
    vi.spyOn(Element.prototype, "getClientRects").mockImplementation(() => [{}] as unknown as DOMRectList);
    vi.spyOn(Element.prototype, "getBoundingClientRect").mockImplementation(function (this: Element) {
      const rect = (top: number, bottom: number) => ({ top, bottom, left: 0, right: 0, width: 0, height: bottom - top, x: 0, y: top, toJSON: () => ({}) });
      if (this === box) return rect(100, 200);
      if (this.getAttribute("aria-current") === "location") return rect(linkTop, linkBottom);
      return rect(0, 0);
    });
    return box;
  }

  it("scrolls the box, not the page, until the current entry is in it", () => {
    const box = setup(260, 290);
    box.scrollTop = 50;
    render(<TableOfContents items={items} defaultActiveId="usage" />, { container: box });
    expect(box.scrollTop).toBe(140);
    expect(window.scrollTo).not.toHaveBeenCalled();
    box.remove();
  });

  it("scrolls up when the current entry is above the box", () => {
    const box = setup(40, 70);
    box.scrollTop = 80;
    render(<TableOfContents items={items} defaultActiveId="usage" />, { container: box });
    expect(box.scrollTop).toBe(20);
    box.remove();
  });

  it("leaves it alone when the entry is already showing", () => {
    const box = setup(120, 150);
    box.scrollTop = 33;
    render(<TableOfContents items={items} defaultActiveId="usage" />, { container: box });
    expect(box.scrollTop).toBe(33);
    box.remove();
  });

  it("does not move the container the headings scroll in", () => {
    const box = setup(260, 290);
    box.scrollTop = 50;
    render(<TableOfContents items={items} defaultActiveId="usage" scrollContainerRef={{ current: box }} />, { container: box });
    expect(box.scrollTop).toBe(50);
    box.remove();
  });
});

describe("TableOfContents — folding", () => {
  const matchMedia = (narrow: boolean) =>
    vi.spyOn(window, "matchMedia").mockImplementation(
      (query) => ({ matches: narrow && query.includes("max-width"), media: query, addEventListener() {}, removeEventListener() {} }) as unknown as MediaQueryList,
    );

  it("has no button by default", () => {
    render(<TableOfContents items={items} />);
    expect(screen.queryByRole("button")).not.toBeInTheDocument();
  });

  it("puts the list behind a button that says whether it is open and what it opens", async () => {
    render(<TableOfContents items={items} collapse="always" />);
    const button = screen.getByRole("button", { name: "On this page" });
    expect(button).toHaveAttribute("aria-expanded", "false");
    expect(document.getElementById(button.getAttribute("aria-controls") as string)).toBe(screen.getByRole("list", { hidden: true }));
    expect(screen.getByRole("navigation").className).toMatch(/folded/);
    await userEvent.click(button);
    expect(button).toHaveAttribute("aria-expanded", "true");
    expect(screen.getByRole("navigation").className).not.toMatch(/folded/);
  });

  it("starts open with defaultOpen, translates the button, and is controlled with open", async () => {
    const onOpenChange = vi.fn();
    const { rerender } = render(<TableOfContents items={items} collapse="always" defaultOpen labels={{ title: "Sur cette page" }} />);
    expect(screen.getByRole("button", { name: "Sur cette page" })).toHaveAttribute("aria-expanded", "true");
    rerender(<TableOfContents items={items} collapse="always" open={false} onOpenChange={onOpenChange} />);
    await userEvent.click(screen.getByRole("button"));
    expect(onOpenChange).toHaveBeenCalledWith(true);
    expect(screen.getByRole("button")).toHaveAttribute("aria-expanded", "false");
  });

  it("closes after an entry is chosen and, for a key press, moves focus to the section", async () => {
    layout({ intro: 0, setup: 400, usage: 800 });
    matchMedia(false);
    render(
      <>
        <Page />
        <TableOfContents items={items} collapse="always" defaultOpen />
      </>,
    );
    screen.getByRole("link", { name: "Usage" }).focus();
    await userEvent.keyboard("{Enter}");
    expect(document.getElementById("usage")).toHaveFocus();
    expect(screen.getByRole("button")).toHaveAttribute("aria-expanded", "false");
  });

  it("hands focus to the button after a mouse click, so it isn't lost with the list", async () => {
    layout({ intro: 0, setup: 400, usage: 800 });
    matchMedia(false);
    render(
      <>
        <Page />
        <TableOfContents items={items} collapse="always" defaultOpen />
      </>,
    );
    await userEvent.click(screen.getByRole("link", { name: "Usage" }));
    expect(screen.getByRole("button")).toHaveFocus();
    expect(screen.getByRole("button")).toHaveAttribute("aria-expanded", "false");
  });

  it("closes on Escape from inside the list and returns focus to the button", async () => {
    render(<TableOfContents items={items} collapse="always" defaultOpen />);
    screen.getByRole("link", { name: "Setup" }).focus();
    await userEvent.keyboard("{Escape}");
    expect(screen.getByRole("button")).toHaveAttribute("aria-expanded", "false");
    expect(screen.getByRole("button")).toHaveFocus();
  });

  it("with `auto`, folds only when the screen is narrow", async () => {
    layout({ intro: 0, setup: 400, usage: 800 });
    matchMedia(false);
    const { unmount } = render(
      <>
        <Page />
        <TableOfContents items={items} collapse="auto" defaultOpen />
      </>,
    );
    await userEvent.click(screen.getByRole("link", { name: "Usage" }));
    // A wide screen shows the list whatever the state, so choosing an entry doesn't close it. (jsdom doesn't evaluate the
    // stylesheet's media query, so the button is looked up whether or not it is drawn.)
    expect(screen.getByRole("button", { hidden: true })).toHaveAttribute("aria-expanded", "true");
    unmount();
    matchMedia(true);
    render(
      <>
        <Page />
        <TableOfContents items={items} collapse="auto" defaultOpen />
      </>,
    );
    await userEvent.click(screen.getByRole("link", { name: "Usage" }));
    expect(screen.getByRole("button", { hidden: true })).toHaveAttribute("aria-expanded", "false");
  });

  it("holds the list open while focus is inside it", () => {
    render(<TableOfContents items={items} collapse="always" open={false} />);
    const nav = screen.getByRole("navigation");
    expect(nav.className).toMatch(/folded/);
    const link = screen.getByRole("link", { name: "Intro", hidden: true });
    act(() => link.focus());
    expect(nav.className).not.toMatch(/folded/);
    act(() => link.blur());
    expect(nav.className).toMatch(/folded/);
  });

  it("keeps the nav's name and doesn't change its roles", async () => {
    const { container } = render(<TableOfContents items={items} collapse="always" defaultOpen />);
    expect(screen.getByRole("navigation", { name: "On this page" })).toBeInTheDocument();
    expect(await axe(container)).toHaveNoViolations();
  });
});

describe("TableOfContents — numbered", () => {
  const leveled: TableOfContentsItem[] = [
    { id: "a", label: "Alpha" },
    { id: "b", label: "Beta", level: 2 },
    { id: "c", label: "Gamma", level: 2 },
    { id: "d", label: "Delta", level: 3 },
    { id: "e", label: "Epsilon" },
  ];

  it("is off by default", () => {
    render(<TableOfContents items={leveled} />);
    expect(screen.getByRole("link", { name: "Alpha" })).toBeInTheDocument();
  });

  it("numbers the entries as an outline, and the number is part of the link's name", () => {
    render(<TableOfContents items={leveled} numbered />);
    expect(screen.getAllByRole("link").map((link) => link.textContent)).toEqual(["1Alpha", "1.1Beta", "1.2Gamma", "1.2.1Delta", "2Epsilon"]);
    expect(screen.getByRole("link", { name: /1\.2\.1\s*Delta/ })).toBeInTheDocument();
  });

  it("counts a skipped level as one, and starts again under each parent", () => {
    render(<TableOfContents items={[{ id: "a", label: "A", level: 3 }, { id: "b", label: "B" }, { id: "c", label: "C", level: 2 }]} numbered />);
    expect(screen.getAllByRole("link").map((link) => link.textContent)).toEqual(["1.1.1A", "2B", "2.1C"]);
  });

  it("numbers what is drawn: from minLevel, and without the levels left out", () => {
    render(<TableOfContents items={leveled} numbered minLevel={2} maxLevel={2} />);
    expect(screen.getAllByRole("link").map((link) => link.textContent)).toEqual(["1Beta", "2Gamma"]);
  });

  it("writes the digits with formatNumber", () => {
    const arabic = (n: number) => String(n).replace(/\d/g, (digit) => "٠١٢٣٤٥٦٧٨٩"[Number(digit)] as string);
    render(<TableOfContents items={leveled.slice(0, 2)} numbered formatNumber={arabic} />);
    expect(screen.getAllByRole("link").map((link) => link.textContent)).toEqual(["١Alpha", "١.١Beta"]);
  });

  it("numbers headings read from the page", async () => {
    render(
      <>
        <h2 id="x">X</h2>
        <h3 id="y">Y</h3>
        <TableOfContents numbered />
      </>,
    );
    const nav = await screen.findByRole("navigation");
    expect(within(nav).getAllByRole("link").map((link) => link.textContent)).toEqual(["1X", "1.1Y"]);
  });
});

describe("TableOfContents — collapsible groups", () => {
  const leveled: TableOfContentsItem[] = [
    { id: "a", label: "Alpha" },
    { id: "b", label: "Beta", level: 2 },
    { id: "c", label: "Gamma", level: 3 },
    { id: "d", label: "Delta" },
    { id: "e", label: "Epsilon", level: 2 },
  ];
  const toggle = (name: string) => screen.getByRole("button", { name: `Subsections of ${name}` });

  it("has no buttons unless asked for", () => {
    render(<TableOfContents items={leveled} />);
    expect(screen.queryByRole("button")).not.toBeInTheDocument();
  });

  it("puts a button only on an entry with deeper entries after it, open to start with", () => {
    render(<TableOfContents items={leveled} collapsibleGroups />);
    expect(screen.getAllByRole("button").map((button) => button.getAttribute("aria-label"))).toEqual([
      "Subsections of Alpha",
      "Subsections of Beta",
      "Subsections of Delta",
    ]);
    expect(toggle("Alpha")).toHaveAttribute("aria-expanded", "true");
    expect(screen.getAllByRole("link")).toHaveLength(5);
  });

  it("folds and opens a group, taking the nested groups under it with it", async () => {
    render(<TableOfContents items={leveled} collapsibleGroups />);
    await userEvent.click(toggle("Alpha"));
    expect(screen.getAllByRole("link").map((link) => link.textContent)).toEqual(["Alpha", "Delta", "Epsilon"]);
    expect(toggle("Alpha")).toHaveAttribute("aria-expanded", "false");
    await userEvent.click(toggle("Alpha"));
    expect(screen.getAllByRole("link")).toHaveLength(5);
  });

  it("starts closed with groupsDefaultOpen={false}, except for the group holding the current entry", () => {
    render(<TableOfContents items={leveled} collapsibleGroups groupsDefaultOpen={false} defaultActiveId="c" />);
    expect(screen.getAllByRole("link").map((link) => link.textContent)).toEqual(["Alpha", "Beta", "Gamma", "Delta"]);
    expect(toggle("Alpha")).toHaveAttribute("aria-expanded", "true");
    expect(toggle("Delta")).toHaveAttribute("aria-expanded", "false");
  });

  it("opens the group of the entry the page moves to, until a group is opened or closed by hand", async () => {
    const { rerender } = render(<TableOfContents items={leveled} collapsibleGroups groupsDefaultOpen={false} activeId="a" onActiveIdChange={() => {}} />);
    expect(screen.queryByRole("link", { name: "Epsilon" })).toBeNull();
    rerender(<TableOfContents items={leveled} collapsibleGroups groupsDefaultOpen={false} activeId="e" onActiveIdChange={() => {}} />);
    expect(screen.getByRole("link", { name: "Epsilon" })).toBeInTheDocument();
    // Closed by hand, it stays closed while the page is still in it.
    await userEvent.click(toggle("Delta"));
    expect(screen.queryByRole("link", { name: "Epsilon" })).toBeNull();
    rerender(<TableOfContents items={leveled} collapsibleGroups groupsDefaultOpen={false} activeId="d" onActiveIdChange={() => {}} />);
    expect(screen.queryByRole("link", { name: "Epsilon" })).toBeNull();
  });

  it("carries the marker on a closed group's heading when the current entry is inside it", async () => {
    render(<TableOfContents items={leveled} collapsibleGroups defaultActiveId="c" />);
    await userEvent.click(toggle("Alpha"));
    expect(screen.queryByRole("link", { name: "Gamma" })).toBeNull();
    const row = screen.getByRole("link", { name: "Alpha" }).closest("li");
    expect(row).toHaveAttribute("data-toc-marked");
    // It is not the current entry itself, so it doesn't claim aria-current.
    expect(screen.getByRole("link", { name: "Alpha" })).not.toHaveAttribute("aria-current");
  });

  it("keeps a group open while keyboard focus is inside it", async () => {
    render(<TableOfContents items={leveled} collapsibleGroups groupsDefaultOpen={false} defaultActiveId="d" />);
    // Delta is current, so Alpha's group is closed; open it by hand and focus a link in it.
    await userEvent.click(toggle("Alpha"));
    const link = screen.getByRole("link", { name: "Beta" });
    act(() => link.focus());
    // Closed from outside the focus (a click that doesn't take focus), the group stays while focus is in it.
    fireEvent.click(toggle("Alpha"));
    expect(screen.getByRole("link", { name: "Beta" })).toBeInTheDocument();
    act(() => link.blur());
    expect(screen.queryByRole("link", { name: "Beta" })).toBeNull();
  });

  it("translates the buttons' names, and names a group whose label isn't text", () => {
    render(
      <TableOfContents
        collapsibleGroups
        labels={{ groupToggle: (label) => `Sous-sections de ${label}` }}
        items={[{ id: "a", label: "Alpha" }, { id: "b", label: "B", level: 2 }, { id: "c", label: <em>Rich</em> }, { id: "d", label: "D", level: 2 }]}
      />,
    );
    expect(screen.getByRole("button", { name: "Sous-sections de Alpha" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Sous-sections de section" })).toBeInTheDocument();
  });

  it("passes jest-axe", async () => {
    const { container } = render(<TableOfContents items={leveled} collapsibleGroups groupsDefaultOpen={false} defaultActiveId="b" />);
    expect(await axe(container)).toHaveNoViolations();
  });
});

describe("TableOfContents — moving marker", () => {
  const rects = () =>
    vi.spyOn(Element.prototype, "getBoundingClientRect").mockImplementation(function (this: Element) {
      const make = (top: number, height: number) => ({ top, bottom: top + height, left: 0, right: 0, width: 0, height, x: 0, y: top, toJSON: () => ({}) });
      if (this.hasAttribute("data-toc-marked")) return make(130, 30);
      if (this.className.toString().includes("body")) return make(100, 200);
      return make(0, 0);
    });
  const marker = () => document.querySelector<HTMLElement>('[aria-hidden="true"][data-visible]');

  it("draws no marker by default", () => {
    render(<TableOfContents items={items} defaultActiveId="setup" />);
    expect(marker()).toBeNull();
  });

  it("lays one marker over the current entry, hidden from assistive technology", () => {
    rects();
    vi.spyOn(Element.prototype, "getClientRects").mockImplementation(() => [{}] as unknown as DOMRectList);
    render(<TableOfContents items={items} defaultActiveId="setup" movingMarker />);
    expect(marker()).toHaveAttribute("data-visible", "true");
    expect(marker()?.style.getPropertyValue("--toc-marker-y")).toBe("30px");
    expect(marker()?.style.getPropertyValue("--toc-marker-h")).toBe("30px");
  });

  it("stays hidden while the marked entry isn't drawn (a folded list has no box to measure)", () => {
    rects();
    // jsdom reports no boxes unless a test says otherwise.
    render(<TableOfContents items={items} defaultActiveId="setup" movingMarker />);
    expect(marker()).toHaveAttribute("data-visible", "false");
  });

  it("moves to the next current entry and hides when nothing is current", () => {
    rects();
    vi.spyOn(Element.prototype, "getClientRects").mockImplementation(() => [{}] as unknown as DOMRectList);
    const { rerender } = render(<TableOfContents items={items} activeId="setup" onActiveIdChange={() => {}} movingMarker />);
    expect(marker()).toHaveAttribute("data-visible", "true");
    rerender(<TableOfContents items={items} activeId={undefined} onActiveIdChange={() => {}} movingMarker />);
    expect(marker()).toHaveAttribute("data-visible", "false");
  });

  it("does not start sliding until it has been placed once", async () => {
    render(<TableOfContents items={items} defaultActiveId="setup" movingMarker />);
    expect(marker()).not.toHaveAttribute("data-animated");
    await waitFor(() => expect(marker()).toHaveAttribute("data-animated", "true"));
  });

  it("works inside StrictMode and cleans up", async () => {
    const { unmount } = render(
      <StrictMode>
        <TableOfContents items={items} defaultActiveId="setup" movingMarker />
      </StrictMode>,
    );
    await waitFor(() => expect(marker()).toHaveAttribute("data-animated", "true"));
    unmount();
  });
});

describe("TableOfContents — folded as a dropdown", () => {
  const matchMedia = (narrow: boolean) =>
    vi.spyOn(window, "matchMedia").mockImplementation(
      (query) => ({ matches: narrow && query.includes("max-width"), media: query, addEventListener() {}, removeEventListener() {} }) as unknown as MediaQueryList,
    );
  const trigger = () => screen.getByRole("button", { name: /On this page/ });

  it("is a button that shows the outline's name, then the entry being read, with the name first for a screen reader", () => {
    const { unmount } = render(<TableOfContents items={items} collapse="always" foldedStyle="dropdown" />);
    expect(trigger()).toHaveAccessibleName("On this page");
    unmount();
    render(<TableOfContents items={items} collapse="always" foldedStyle="dropdown" defaultActiveId="setup" />);
    expect(trigger()).toHaveAccessibleName("On this page: Setup");
    // The visible text is inside the name.
    expect(trigger()).toHaveTextContent("Setup");
  });

  it("writes the name with labels.dropdownTrigger, keeping a default whose override is undefined", () => {
    const { unmount } = render(
      <TableOfContents
        items={items}
        collapse="always"
        foldedStyle="dropdown"
        defaultActiveId="setup"
        labels={{ title: "Sur cette page", dropdownTrigger: (title, current) => `${title} — ${current}` }}
      />,
    );
    expect(screen.getByRole("button", { name: /Sur cette page/ })).toHaveAccessibleName("Sur cette page — Setup");
    unmount();
    render(<TableOfContents items={items} collapse="always" foldedStyle="dropdown" defaultActiveId="setup" labels={{ dropdownTrigger: undefined }} />);
    expect(trigger()).toHaveAccessibleName("On this page: Setup");
  });

  it("keeps what the button shows inside its name: the number too, and a label that isn't text", () => {
    const { unmount } = render(<TableOfContents items={items} collapse="always" foldedStyle="dropdown" defaultActiveId="usage" numbered />);
    expect(trigger()).toHaveAccessibleName("On this page: 2 Usage");
    expect(trigger()).toHaveTextContent("2");
    unmount();
    render(<TableOfContents items={[{ id: "a", label: <em>Rich</em> }]} collapse="always" foldedStyle="dropdown" defaultActiveId="a" />);
    expect(trigger()).toHaveAccessibleName("On this page Rich");
    expect(trigger()).not.toHaveAttribute("aria-label");
  });

  it("follows the entry being read, without announcing it (it is not a live region)", async () => {
    layout({ intro: 100, setup: 400, usage: 800 });
    render(
      <>
        <Page />
        <TableOfContents items={items} collapse="always" foldedStyle="dropdown" />
      </>,
    );
    scrollTo(450);
    await waitFor(() => expect(trigger()).toHaveAccessibleName("On this page: Setup"));
    expect(trigger().closest("[aria-live]")).toBeNull();
    expect(trigger()).not.toHaveAttribute("aria-live");
  });

  it("opens a panel of the real links, named for the outline, with the list drawn once", async () => {
    render(<TableOfContents items={items} collapse="always" foldedStyle="dropdown" defaultActiveId="setup" />);
    expect(screen.queryByRole("dialog")).toBeNull();
    expect(trigger()).toHaveAttribute("aria-expanded", "false");
    await userEvent.click(trigger());
    const panel = await screen.findByRole("dialog", { name: "On this page" });
    expect(within(panel).getByRole("navigation", { name: "Table of contents" })).toBeInTheDocument();
    expect(within(panel).getAllByRole("link").map((link) => link.textContent)).toEqual(["Intro", "Setup", "Usage"]);
    expect(within(panel).getByRole("link", { name: "Setup" })).toHaveAttribute("aria-current", "location");
    // The outline's own list isn't drawn as well while the dropdown is what shows: one link per entry on the page.
    expect(screen.getAllByRole("link", { hidden: true })).toHaveLength(3);
  });

  it("puts an entry's data-testid in the page once", async () => {
    render(<TableOfContents items={[{ id: "a", label: "A", "data-testid": "entry-a" }]} collapse="always" foldedStyle="dropdown" defaultOpen />);
    await screen.findByRole("dialog");
    expect(screen.getAllByTestId("entry-a")).toHaveLength(1);
  });

  it("closes after an entry is chosen, and scrolls", async () => {
    layout({ intro: 0, setup: 400, usage: 800 });
    matchMedia(false);
    render(
      <>
        <Page />
        <TableOfContents items={items} collapse="always" foldedStyle="dropdown" defaultOpen />
      </>,
    );
    await userEvent.click(await screen.findByRole("link", { name: "Usage" }));
    await waitFor(() => expect(screen.queryByRole("dialog")).toBeNull());
    expect(window.scrollTo).toHaveBeenCalledWith(expect.objectContaining({ top: 800 }));
  });

  it("leaves focus on the section after a key press, and returns it to the button on Escape", async () => {
    layout({ intro: 0, setup: 400, usage: 800 });
    render(
      <>
        <Page />
        <TableOfContents items={items} collapse="always" foldedStyle="dropdown" />
      </>,
    );
    await userEvent.click(trigger());
    const usage = await screen.findByRole("link", { name: "Usage" });
    usage.focus();
    await userEvent.keyboard("{Enter}");
    await waitFor(() => expect(screen.queryByRole("dialog")).toBeNull());
    expect(document.getElementById("usage")).toHaveFocus();
    await userEvent.click(trigger());
    await screen.findByRole("dialog");
    await userEvent.keyboard("{Escape}");
    await waitFor(() => expect(screen.queryByRole("dialog")).toBeNull());
    expect(trigger()).toHaveFocus();
  });

  it("with `auto`, is the plain outline when the screen is wide, and never opens its panel there", () => {
    matchMedia(false);
    render(<TableOfContents items={items} collapse="auto" foldedStyle="dropdown" defaultOpen />);
    expect(screen.queryByRole("dialog")).toBeNull();
    // The list is in the page itself.
    expect(screen.getAllByRole("link")).toHaveLength(3);
  });

  it("with `auto` on a narrow screen, replaces the list with the dropdown", async () => {
    matchMedia(true);
    render(<TableOfContents items={items} collapse="auto" foldedStyle="dropdown" defaultOpen />);
    await screen.findByRole("dialog");
    expect(screen.getAllByRole("link", { hidden: true })).toHaveLength(3);
  });

  it("is controlled with open and reports with onOpenChange", async () => {
    const onOpenChange = vi.fn();
    render(<TableOfContents items={items} collapse="always" foldedStyle="dropdown" open={false} onOpenChange={onOpenChange} />);
    await userEvent.click(trigger());
    expect(onOpenChange).toHaveBeenCalledWith(true);
    expect(screen.queryByRole("dialog")).toBeNull();
  });

  it("has no accessibility violations, closed and open", async () => {
    const { container, baseElement } = render(<TableOfContents items={items} collapse="always" foldedStyle="dropdown" defaultActiveId="setup" />);
    expect(await axe(container)).toHaveNoViolations();
    await userEvent.click(trigger());
    await screen.findByRole("dialog");
    expect(await axe(baseElement)).toHaveNoViolations();
  });
});

describe("TableOfContents — sticky while folded", () => {
  it('draws as a bar with `sticky="folded"`, takes stickyOffset from the spacing scale, and is not an Affix', () => {
    render(<TableOfContents items={items} collapse="always" sticky="folded" stickyOffset={4} />);
    const nav = screen.getByRole("navigation");
    expect(nav.className).toMatch(/stickyFolded/);
    expect(nav.style.getPropertyValue("--toc-sticky-top")).toBe("var(--dbm-space-4)");
    expect(nav.getAttribute("style") ?? "").not.toMatch(/(^|;)\s*top:/);
  });

  it("keeps a caller's own style next to it", () => {
    render(<TableOfContents items={items} collapse="always" sticky="folded" stickyOffset={2} style={{ margin: 3 }} />);
    expect(screen.getByRole("navigation")).toHaveStyle({ margin: "3px" });
  });

  it("is not drawn sticky otherwise", () => {
    render(<TableOfContents items={items} collapse="always" />);
    expect(screen.getByRole("navigation").className).not.toMatch(/stickyFolded/);
  });

  it("keeps the headings clear of the bar: a click leaves the section below it", async () => {
    const rect = (top: number, height: number) => ({ top, bottom: top + height, left: 0, right: 0, width: 0, height, x: 0, y: top, toJSON: () => ({}) });
    vi.spyOn(Element.prototype, "getBoundingClientRect").mockImplementation(function (this: Element) {
      if (this.tagName === "NAV") return rect(0, 48);
      return rect(this.id === "usage" ? 800 : 0, 0);
    });
    const real = window.getComputedStyle;
    vi.spyOn(window, "getComputedStyle").mockImplementation((element: Element, pseudo?: string | null) => {
      const style = real(element, pseudo);
      return element.tagName === "NAV" ? new Proxy(style, { get: (target, key) => (key === "position" ? "sticky" : key === "top" ? "8px" : Reflect.get(target, key) as unknown) }) : style;
    });
    render(
      <>
        <Page />
        <TableOfContents items={items} collapse="always" sticky="folded" defaultOpen />
      </>,
    );
    await userEvent.click(screen.getByRole("link", { name: "Usage" }));
    // 800 (where it is) minus the bar's 48px and its 8px offset.
    expect(window.scrollTo).toHaveBeenCalledWith(expect.objectContaining({ top: 744 }));
  });

  it("with `sticky` true is still the Affix box", () => {
    render(<TableOfContents items={items} sticky stickyOffset={2} />);
    expect(screen.getByRole("navigation").getAttribute("style") ?? "").toMatch(/top:\s*var\(--dbm-space-2\)/);
  });
});

describe("TableOfContents — server rendering and hydration", () => {
  const tree = (
    <>
      <TableOfContents items={items} />
      <TableOfContents items={items} numbered movingMarker collapsibleGroups sticky stickyOffset={2} />
      <TableOfContents items={items} collapse="auto" foldedStyle="dropdown" sticky="folded" defaultActiveId="setup" />
      <TableOfContents items={items} collapse="always" defaultOpen />
    </>
  );

  it("renders every option on the server, current entry included", () => {
    const html = renderToString(tree);
    expect(html).toContain("Intro");
    expect(html).toContain('aria-current="location"');
  });

  it("draws nothing on the server for headings it can only read in the browser", () => {
    expect(renderToString(<TableOfContents />)).toBe("");
  });

  it("hydrates the server's markup, on a narrow screen too, without a mismatch warning", async () => {
    vi.spyOn(window, "matchMedia").mockImplementation(
      (query) => ({ matches: query.includes("max-width"), media: query, addEventListener() {}, removeEventListener() {} }) as unknown as MediaQueryList,
    );
    const error = vi.spyOn(console, "error").mockImplementation(() => {});
    const container = document.createElement("div");
    container.innerHTML = renderToString(tree);
    document.body.appendChild(container);
    await act(async () => {
      hydrateRoot(container, tree);
    });
    expect(error).not.toHaveBeenCalled();
    container.remove();
  });
});

describe('TableOfContents layout="row"', () => {
  const nested: TableOfContentsItem[] = [
    { id: "intro", label: "Intro" },
    { id: "setup", label: "Setup", level: 2 },
    { id: "deep", label: "Deep", level: 3 },
    { id: "usage", label: "Usage" },
  ];

  it("draws a pill link for each top-level entry only, and a named button beside the one with entries inside it", () => {
    render(<TableOfContents layout="row" items={nested} />);
    const nav = screen.getByRole("navigation", { name: "Table of contents" });
    expect(within(nav).getAllByRole("link").map((link) => link.textContent)).toEqual(["Intro", "Usage"]);
    expect(within(nav).getAllByRole("button").map((button) => button.getAttribute("aria-label"))).toEqual(["Subsections of Intro"]);
    expect(within(nav).queryByText("On this page")).not.toBeInTheDocument();
  });

  it("opens the entries inside a pill in a panel, in order, with the current one marked as a location, and closes it when one is chosen", async () => {
    const user = userEvent.setup();
    render(
      <>
        <TableOfContents layout="row" items={nested} activeId="deep" />
        <h2 id="intro">Intro</h2>
        <h3 id="setup">Setup</h3>
        <h3 id="deep">Deep</h3>
      </>,
    );
    const caret = screen.getByRole("button", { name: "Subsections of Intro" });
    await user.click(caret);
    await waitFor(() => expect(caret).toHaveAttribute("aria-expanded", "true"));
    const setup = await screen.findByRole("link", { name: "Setup" });
    const deep = screen.getByRole("link", { name: "Deep" });
    expect(setup.compareDocumentPosition(deep) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
    expect(deep).toHaveAttribute("aria-current", "location");
    expect(setup).not.toHaveAttribute("aria-current");
    await user.click(setup);
    await waitFor(() => expect(caret).toHaveAttribute("aria-expanded", "false"));
  });

  it("draws a row at the narrowest width of a width map, and the list from the width that says so", () => {
    render(<TableOfContents layout={{ base: "row", lg: "list" }} items={nested} />);
    // jsdom has no media query that matches `lg`, so the first, narrowest layout stands: a row has no title.
    expect(screen.queryByText("On this page")).not.toBeInTheDocument();
    expect(screen.getAllByRole("link").map((link) => link.textContent)).toEqual(["Intro", "Usage"]);
  });

  it("marks the pill that holds the current entry, and puts aria-current only on a link that is the current entry", () => {
    render(<TableOfContents layout="row" items={nested} activeId="deep" />);
    const nav = screen.getByRole("navigation", { name: "Table of contents" });
    const marked = nav.querySelector("[data-toc-marked]");
    expect(marked).toHaveTextContent("Intro");
    expect(within(nav).queryByRole("link", { current: "location" })).not.toBeInTheDocument();
  });

  it("takes a CSS length for stickyOffset and a name of its own", () => {
    render(<TableOfContents layout="row" sticky stickyOffset="var(--page-shell-header-height, 0px)" aria-label="Contents" items={nested} />);
    const nav = screen.getByRole("navigation", { name: "Contents" });
    expect(nav.style.getPropertyValue("--toc-sticky-top")).toBe("var(--page-shell-header-height, 0px)");
  });

  it("has no accessibility violations", async () => {
    const { container } = render(<TableOfContents layout="row" items={nested} />);
    expect(await axe(container)).toHaveNoViolations();
  });

  it("is left alone as a list: a row's props do not change the default layout", () => {
    render(<TableOfContents items={nested} />);
    expect(screen.getAllByRole("link")).toHaveLength(4);
  });
});
