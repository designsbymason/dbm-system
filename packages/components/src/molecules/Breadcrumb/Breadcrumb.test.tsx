import { act, render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { axe } from "jest-axe";
import { createRef, StrictMode } from "react";
import type { ReactNode } from "react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { HouseIcon } from "@dbm-system/icons";
import { Breadcrumb } from "./Breadcrumb";
import type { BreadcrumbProps } from "./Breadcrumb.types";

const trail: Array<[string, string]> = [
  ["Home", "/"],
  ["Products", "/products"],
  ["Keyboards", "/products/keyboards"],
  ["Mechanical", "/products/keyboards/mechanical"],
  ["Switches", "/products/keyboards/mechanical/switches"],
  ["Linear", "/products/keyboards/mechanical/switches/linear"],
];

/** A trail of `count` items: links, then the current page last. */
function Basic({ count = 3, ...props }: Partial<Omit<BreadcrumbProps, "children">> & { count?: number }) {
  return (
    <Breadcrumb {...props}>
      {trail.slice(0, count).map(([label, href], index) => (
        <Breadcrumb.Item key={href}>
          {index === count - 1 ? <Breadcrumb.Page>{label}</Breadcrumb.Page> : <Breadcrumb.Link href={href}>{label}</Breadcrumb.Link>}
        </Breadcrumb.Item>
      ))}
    </Breadcrumb>
  );
}

afterEach(() => {
  vi.restoreAllMocks();
});

/** The current page's own element: its text sits in an inner label element, so climb out of it. */
const currentPage = (text: string) => screen.getByText(text).closest("span[aria-current]") as HTMLElement;

describe("Breadcrumb — structure", () => {
  it("renders a named nav around an ordered list", () => {
    render(<Basic />);
    const nav = screen.getByRole("navigation", { name: "Breadcrumb" });
    expect(within(nav).getByRole("list").tagName).toBe("OL");
    expect(within(nav).getAllByRole("listitem")).toHaveLength(3);
  });

  it("marks the current page and leaves the others as links", () => {
    render(<Basic />);
    expect(currentPage("Keyboards")).toHaveAttribute("aria-current", "page");
    expect(screen.getByRole("link", { name: "Home" })).toHaveAttribute("href", "/");
    expect(screen.getAllByRole("link")).toHaveLength(2);
  });

  it("draws a hidden separator after every item but the last", () => {
    const { container } = render(<Basic />);
    const separators = container.querySelectorAll("[aria-hidden='true']");
    // Two separators; the decorative chevron icons inside them are hidden too, so count the spans.
    expect(container.querySelectorAll("li > span[aria-hidden='true']")).toHaveLength(2);
    expect(separators.length).toBeGreaterThanOrEqual(2);
    const items = screen.getAllByRole("listitem");
    expect(items[2]?.querySelector("span[aria-hidden='true']")).toBeNull();
  });

  it("states list and listitem roles outright for Safari", () => {
    render(<Basic />);
    expect(screen.getByRole("list")).toHaveAttribute("role", "list");
    for (const item of screen.getAllByRole("listitem")) expect(item).toHaveAttribute("role", "listitem");
  });

  it("renders a slash, a string, or an element as the separator", () => {
    const { container, rerender } = render(<Basic separator="slash" />);
    expect(container.querySelector("li > span[aria-hidden='true']")).toHaveTextContent("/");
    rerender(<Basic separator="›" />);
    expect(container.querySelector("li > span[aria-hidden='true']")).toHaveTextContent("›");
    rerender(<Basic separator={<em data-testid="custom">→</em>} />);
    expect(screen.getAllByTestId("custom")).toHaveLength(2);
  });

  it("draws a leading icon on a link and on the page", () => {
    const { container } = render(
      <Breadcrumb>
        <Breadcrumb.Item>
          <Breadcrumb.Link href="/" icon={HouseIcon}>
            Home
          </Breadcrumb.Link>
        </Breadcrumb.Item>
        <Breadcrumb.Item>
          <Breadcrumb.Page icon={HouseIcon}>Here</Breadcrumb.Page>
        </Breadcrumb.Item>
      </Breadcrumb>,
    );
    expect(screen.getByRole("link", { name: "Home" }).querySelector("svg")).toBeInTheDocument();
    expect(currentPage("Here").querySelector("svg")).toBeInTheDocument();
    expect(container.querySelectorAll("svg[aria-hidden='true']").length).toBeGreaterThanOrEqual(2);
  });

  it("ignores children that are not items, with a warning", () => {
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
    render(
      <Breadcrumb>
        stray text
        <Breadcrumb.Item>
          <Breadcrumb.Page>Only</Breadcrumb.Page>
        </Breadcrumb.Item>
      </Breadcrumb>,
    );
    expect(screen.getAllByRole("listitem")).toHaveLength(1);
    expect(screen.queryByText("stray text")).not.toBeInTheDocument();
    expect(warn).toHaveBeenCalledWith(expect.stringContaining("only `Breadcrumb.Item`"));
  });
});

describe("Breadcrumb — props", () => {
  it("names the nav from labels, aria-label, or aria-labelledby", () => {
    const { rerender } = render(<Basic labels={{ navigation: "Fil d'Ariane" }} />);
    expect(screen.getByRole("navigation", { name: "Fil d'Ariane" })).toBeInTheDocument();
    rerender(<Basic labels={{ navigation: "Fil d'Ariane" }} aria-label="You are here" />);
    expect(screen.getByRole("navigation", { name: "You are here" })).toBeInTheDocument();
    rerender(
      <>
        <h2 id="t">Where</h2>
        <Basic aria-labelledby="t" aria-label="ignored" />
      </>,
    );
    expect(screen.getByRole("navigation", { name: "Where" })).toBeInTheDocument();
  });

  it("forwards the ref to the nav and passes id, className, style, data-testid and native props", () => {
    const ref = createRef<HTMLElement>();
    render(
      <Breadcrumb ref={ref} id="crumbs" className="mine" style={{ color: "red" }} data-testid="bc" title="trail">
        <Breadcrumb.Item>
          <Breadcrumb.Page>Here</Breadcrumb.Page>
        </Breadcrumb.Item>
      </Breadcrumb>,
    );
    const nav = screen.getByTestId("bc");
    expect(ref.current).toBe(nav);
    expect(nav.tagName).toBe("NAV");
    expect(nav).toHaveAttribute("id", "crumbs");
    expect(nav).toHaveClass("mine");
    expect(nav).toHaveStyle({ color: "rgb(255, 0, 0)" });
    expect(nav).toHaveAttribute("title", "trail");
  });

  it("applies a size class", () => {
    render(<Basic size="xl" />);
    expect(screen.getByRole("navigation").className).toMatch(/sizeXl/);
  });

  it("colours links by tone, defaulting to info", () => {
    const { rerender } = render(<Basic />);
    expect(screen.getByRole("link", { name: "Home" }).className).toMatch(/toneInfo/);
    rerender(<Basic tone="brand" />);
    expect(screen.getByRole("link", { name: "Home" }).className).toMatch(/toneBrand/);
    rerender(<Basic tone="neutral" />);
    expect(screen.getByRole("link", { name: "Home" }).className).toMatch(/toneNeutral/);
  });

  it("leaves the current page's colour alone whatever the tone", () => {
    render(<Basic tone="brand" />);
    expect(currentPage("Keyboards").className).not.toMatch(/tone/);
  });

  it("underlines links only on hover by default, and always with underline", () => {
    const { rerender } = render(<Basic />);
    expect(screen.getByRole("link", { name: "Home" }).className).toMatch(/underlineHover/);
    rerender(<Basic underline />);
    expect(screen.getByRole("link", { name: "Home" }).className).toMatch(/underlineAlways/);
    rerender(<Basic underline={false} />);
    expect(screen.getByRole("link", { name: "Home" }).className).toMatch(/underlineHover/);
  });

  it("applies tone and underline to an asChild link too", () => {
    render(
      <Breadcrumb tone="neutral" underline>
        <Breadcrumb.Item>
          <Breadcrumb.Link asChild href="/x">
            <a data-testid="routed" href="/x">
              Routed
            </a>
          </Breadcrumb.Link>
        </Breadcrumb.Item>
      </Breadcrumb>,
    );
    expect(screen.getByTestId("routed").className).toMatch(/toneNeutral/);
    expect(screen.getByTestId("routed").className).toMatch(/underlineAlways/);
  });

  it("keeps its own aria-current on the page whatever the caller passes", () => {
    render(
      <Breadcrumb>
        <Breadcrumb.Item>
          <Breadcrumb.Page aria-current="false">Here</Breadcrumb.Page>
        </Breadcrumb.Item>
      </Breadcrumb>,
    );
    expect(currentPage("Here")).toHaveAttribute("aria-current", "page");
  });
});

describe("Breadcrumb.Link", () => {
  it("is the Link atom: external links open in a new tab, disabled ones are aria-disabled", () => {
    render(
      <Breadcrumb>
        <Breadcrumb.Item>
          <Breadcrumb.Link href="https://example.com">Out</Breadcrumb.Link>
        </Breadcrumb.Item>
        <Breadcrumb.Item>
          <Breadcrumb.Link href="/x" disabled>
            Off
          </Breadcrumb.Link>
        </Breadcrumb.Item>
      </Breadcrumb>,
    );
    expect(screen.getByRole("link", { name: /Out/ })).toHaveAttribute("target", "_blank");
    expect(screen.getByRole("link", { name: "Off" })).toHaveAttribute("aria-disabled", "true");
  });

  it("renders a slotted element with asChild, with the icon and the label drawn inside it", () => {
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
    render(
      <Breadcrumb>
        <Breadcrumb.Item>
          <Breadcrumb.Link asChild href="/x" icon={HouseIcon}>
            <a data-testid="routed" href="/x">
              Routed
            </a>
          </Breadcrumb.Link>
        </Breadcrumb.Item>
      </Breadcrumb>,
    );
    const routed = screen.getByTestId("routed");
    expect(routed.className).toMatch(/link/);
    expect(routed).toHaveAccessibleName("Routed");
    // The icon first, then the element's own text in the label wrapper, all inside the one element.
    expect(routed.firstElementChild?.tagName.toLowerCase()).toBe("svg");
    expect(routed.querySelector("span")).toHaveTextContent("Routed");
    expect(routed.querySelectorAll("a")).toHaveLength(0);
    expect(warn).not.toHaveBeenCalled();
    warn.mockRestore();
  });

  it("draws an external link's icon and cue inside the slotted element, after the label", () => {
    render(
      <Breadcrumb>
        <Breadcrumb.Item>
          <Breadcrumb.Link asChild href="https://example.com" icon={HouseIcon}>
            <a data-testid="routed" href="https://example.com">
              Elsewhere
            </a>
          </Breadcrumb.Link>
        </Breadcrumb.Item>
      </Breadcrumb>,
    );
    const routed = screen.getByTestId("routed");
    expect(routed).toHaveAttribute("target", "_blank");
    expect(routed.querySelectorAll("svg")).toHaveLength(2);
    expect(routed).toHaveTextContent(/Elsewhere\s*\(opens in a new tab\)$/);
  });

  it("gives a truncating trail's slotted link its text as a title", () => {
    render(
      <Breadcrumb truncate>
        <Breadcrumb.Item>
          <Breadcrumb.Link asChild href="/x">
            <a data-testid="routed" href="/x">
              A long label
            </a>
          </Breadcrumb.Link>
        </Breadcrumb.Item>
      </Breadcrumb>,
    );
    expect(screen.getByTestId("routed")).toHaveAttribute("title", "A long label");
  });

  it("forwards a ref to the anchor", () => {
    const ref = createRef<HTMLAnchorElement>();
    render(
      <Breadcrumb>
        <Breadcrumb.Item>
          <Breadcrumb.Link ref={ref} href="/x">
            X
          </Breadcrumb.Link>
        </Breadcrumb.Item>
      </Breadcrumb>,
    );
    expect(ref.current).toBe(screen.getByRole("link"));
  });
});

describe("Breadcrumb — collapsing", () => {
  const collapsed = (props: Partial<BreadcrumbProps> = {}) => <Basic count={5} maxItems={3} {...props} />;

  it("does not collapse without maxItems, or when the trail fits", () => {
    const { rerender } = render(<Basic count={5} />);
    expect(screen.getAllByRole("listitem")).toHaveLength(5);
    rerender(<Basic count={5} maxItems={5} />);
    expect(screen.getAllByRole("listitem")).toHaveLength(5);
    expect(screen.queryByRole("button")).not.toBeInTheDocument();
  });

  it("replaces the middle with a button: first item, the button, then the last two", () => {
    render(collapsed());
    const items = screen.getAllByRole("listitem");
    expect(items).toHaveLength(4);
    expect(within(items[0]!).getByRole("link", { name: "Home" })).toBeInTheDocument();
    expect(within(items[1]!).getByRole("button", { name: "Show 2 hidden pages" })).toBeInTheDocument();
    expect(within(items[2]!).getByRole("link", { name: "Mechanical" })).toBeInTheDocument();
    expect(items[3]).toHaveTextContent("Switches");
    expect(screen.queryByRole("link", { name: "Products" })).not.toBeInTheDocument();
  });

  it("puts a separator after the button but none after the last item", () => {
    render(collapsed());
    const items = screen.getAllByRole("listitem");
    expect(items[1]!.querySelector("span[aria-hidden='true']")).not.toBeNull();
    expect(items[3]!.querySelector("span[aria-hidden='true']")).toBeNull();
  });

  it("honours itemsBeforeCollapse and itemsAfterCollapse", () => {
    render(collapsed({ itemsBeforeCollapse: 2, itemsAfterCollapse: 1 }));
    const items = screen.getAllByRole("listitem");
    expect(items).toHaveLength(4);
    expect(screen.getByRole("link", { name: "Products" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Show 2 hidden pages" })).toBeInTheDocument();
    expect(items[3]).toHaveTextContent("Switches");
  });

  it("always keeps the current page, even with itemsAfterCollapse of 0", () => {
    render(collapsed({ itemsAfterCollapse: 0 }));
    expect(currentPage("Switches")).toHaveAttribute("aria-current", "page");
  });

  it("does not hide a single item behind a button", () => {
    render(<Basic count={4} maxItems={3} />);
    expect(screen.getAllByRole("listitem")).toHaveLength(4);
    expect(screen.queryByRole("button")).not.toBeInTheDocument();
  });

  it("reveals every item when the button is used, and moves focus to the first one it revealed", async () => {
    const user = userEvent.setup();
    render(collapsed());
    await user.click(screen.getByRole("button", { name: "Show 2 hidden pages" }));
    expect(screen.getAllByRole("listitem")).toHaveLength(5);
    expect(screen.queryByRole("button")).not.toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Products" })).toHaveFocus();
  });

  it("can be used from the keyboard", async () => {
    const user = userEvent.setup();
    render(collapsed());
    screen.getByRole("link", { name: "Home" }).focus();
    await user.tab();
    expect(screen.getByRole("button", { name: "Show 2 hidden pages" })).toHaveFocus();
    await user.keyboard("{Enter}");
    expect(screen.getByRole("link", { name: "Products" })).toHaveFocus();
  });

  it("uses a translated label for the button", () => {
    render(collapsed({ labels: { expand: (n) => `Afficher ${n} pages` } }));
    expect(screen.getByRole("button", { name: "Afficher 2 pages" })).toBeInTheDocument();
  });

  it("warns when the visible items fill maxItems", () => {
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
    render(<Basic count={5} maxItems={3} itemsBeforeCollapse={2} itemsAfterCollapse={2} />);
    expect(warn).toHaveBeenCalledWith(expect.stringContaining("nothing left to collapse"));
  });
});

describe("Breadcrumb — compact", () => {
  it("adds no compact class by default, and one for auto and for always", () => {
    const { rerender } = render(<Basic />);
    expect(screen.getByRole("navigation").className).not.toMatch(/compact/);
    rerender(<Basic compact="auto" />);
    expect(screen.getByRole("navigation").className).toMatch(/compactAuto/);
    rerender(<Basic compact="always" />);
    expect(screen.getByRole("navigation").className).toMatch(/compactAlways/);
  });

  it("marks the item above the current page as the parent, and gives only it a back arrow", () => {
    render(<Basic count={4} compact="always" />);
    // `hidden`: the compact form's CSS really does hide the other items, which the role queries respect.
    const items = screen.getAllByRole("listitem", { hidden: true });
    expect(items.map((item) => item.className.includes("parent"))).toEqual([false, false, true, false]);
    expect(items.map((item) => item.querySelector("svg[class*='back']") !== null)).toEqual([false, false, true, false]);
  });

  it("renders no back arrow when the trail isn't compact", () => {
    render(<Basic count={4} />);
    // The parent is still marked, but the arrow is only for the compact form.
    expect(screen.getAllByRole("listitem")[2]!.querySelector("svg[class*='back']")).not.toBeNull();
    expect(screen.getByRole("navigation").className).not.toMatch(/compact/);
  });

  it("does nothing to a trail with no parent", () => {
    render(
      <Breadcrumb compact="always">
        <Breadcrumb.Item>
          <Breadcrumb.Page>Only</Breadcrumb.Page>
        </Breadcrumb.Item>
      </Breadcrumb>,
    );
    expect(screen.getByRole("navigation").className).not.toMatch(/compact/);
  });

  it("keeps the parent in a collapsed trail, so the compact form has something to show", () => {
    render(<Basic count={5} maxItems={3} compact="auto" itemsAfterCollapse={1} />);
    expect(screen.getByRole("link", { name: "Mechanical" })).toBeInTheDocument();
  });
});

describe("Breadcrumb — truncate", () => {
  it("adds the truncating class and a title carrying the full text of a plain-text label", () => {
    render(<Basic truncate />);
    expect(screen.getByRole("navigation").className).toMatch(/truncating/);
    expect(screen.getByRole("link", { name: "Home" })).toHaveAttribute("title", "Home");
    expect(currentPage("Keyboards")).toHaveAttribute("title", "Keyboards");
  });

  it("adds no title without truncate, and leaves a caller's own title alone", () => {
    const { rerender } = render(<Basic />);
    expect(screen.getByRole("link", { name: "Home" })).not.toHaveAttribute("title");
    rerender(
      <Breadcrumb truncate>
        <Breadcrumb.Item>
          <Breadcrumb.Link href="/" title="Back to the start">
            Home
          </Breadcrumb.Link>
        </Breadcrumb.Item>
      </Breadcrumb>,
    );
    expect(screen.getByRole("link", { name: "Home" })).toHaveAttribute("title", "Back to the start");
  });

  it("gives no title to a label that is more than plain text", () => {
    render(
      <Breadcrumb truncate>
        <Breadcrumb.Item>
          <Breadcrumb.Page>
            <em>Rich</em> label
          </Breadcrumb.Page>
        </Breadcrumb.Item>
      </Breadcrumb>,
    );
    expect(screen.getByText("Rich").closest("span[aria-current]")).not.toHaveAttribute("title");
  });

  it("puts each label in its own element, which the ellipsis is drawn on", () => {
    render(<Basic truncate />);
    expect(screen.getByText("Home").className).toMatch(/label/);
  });
});

describe("Breadcrumb — maxItems=\"container\"", () => {
  const originals: Array<() => void> = [];
  const observers: Array<() => void> = [];
  let navWidth = 1000;

  /** jsdom has no layout: every list entry is 100px wide, and the nav is `navWidth` wide. */
  function stubLayout() {
    const scroll = Object.getOwnPropertyDescriptor(HTMLElement.prototype, "scrollWidth");
    const client = Object.getOwnPropertyDescriptor(HTMLElement.prototype, "clientWidth");
    Object.defineProperty(HTMLElement.prototype, "scrollWidth", {
      configurable: true,
      get(this: HTMLElement) {
        return this.tagName === "OL" ? this.children.length * 100 : 0;
      },
    });
    Object.defineProperty(HTMLElement.prototype, "clientWidth", {
      configurable: true,
      get(this: HTMLElement) {
        return this.tagName === "NAV" ? navWidth : 0;
      },
    });
    vi.stubGlobal(
      "ResizeObserver",
      class {
        constructor(callback: () => void) {
          observers.push(callback);
        }
        observe() {}
        unobserve() {}
        disconnect() {}
      },
    );
    originals.push(() => {
      if (scroll) Object.defineProperty(HTMLElement.prototype, "scrollWidth", scroll);
      else Reflect.deleteProperty(HTMLElement.prototype, "scrollWidth");
      if (client) Object.defineProperty(HTMLElement.prototype, "clientWidth", client);
      else Reflect.deleteProperty(HTMLElement.prototype, "clientWidth");
    });
  }

  afterEach(() => {
    vi.unstubAllGlobals();
    while (originals.length) originals.pop()!();
    observers.length = 0;
    navWidth = 1000;
  });

  it("shows the full trail when it fits", () => {
    stubLayout();
    navWidth = 700;
    render(<Basic count={6} maxItems="container" />);
    expect(screen.getAllByRole("listitem")).toHaveLength(6);
    expect(screen.queryByRole("button")).not.toBeInTheDocument();
  });

  it("hides just as many items as it takes to fit — starting with two", () => {
    stubLayout();
    navWidth = 550;
    render(<Basic count={6} maxItems="container" />);
    // 6 items are 600px; hiding two gives Home, "…", and the last three = 5 entries = 500px.
    expect(screen.getAllByRole("listitem")).toHaveLength(5);
    expect(screen.getByRole("button", { name: "Show 2 hidden pages" })).toBeInTheDocument();
  });

  it("hides another item when two aren't enough", () => {
    stubLayout();
    navWidth = 450;
    render(<Basic count={6} maxItems="container" />);
    expect(screen.getAllByRole("listitem")).toHaveLength(4);
    expect(screen.getByRole("button", { name: "Show 3 hidden pages" })).toBeInTheDocument();
    // What stays is the first item, the "…", and the last two (with the current page).
    expect(screen.getByRole("link", { name: "Home" })).toBeInTheDocument();
    expect(currentPage("Linear")).toBeInTheDocument();
  });

  it("stops at what itemsBeforeCollapse and itemsAfterCollapse keep, and marks the trail as settled", () => {
    stubLayout();
    navWidth = 100;
    render(<Basic count={6} maxItems="container" truncate />);
    expect(screen.getAllByRole("listitem")).toHaveLength(4);
    // Fully collapsed and still too wide: the truncation the caller asked for takes over.
    expect(screen.getByRole("navigation").className).toMatch(/truncating/);
    expect(screen.getByRole("navigation").className).not.toMatch(/measuring/);
  });

  it("does not truncate while it can still collapse", () => {
    stubLayout();
    navWidth = 550;
    render(<Basic count={6} maxItems="container" truncate />);
    expect(screen.getByRole("navigation").className).not.toMatch(/truncating/);
  });

  it("measures again when the width changes", () => {
    stubLayout();
    navWidth = 450;
    render(<Basic count={6} maxItems="container" />);
    expect(screen.getAllByRole("listitem")).toHaveLength(4);
    // The first callback only records the width; a changed width starts the measurement over.
    act(() => observers.forEach((callback) => callback()));
    navWidth = 700;
    act(() => observers.forEach((callback) => callback()));
    expect(screen.getAllByRole("listitem")).toHaveLength(6);
    navWidth = 350;
    act(() => observers.forEach((callback) => callback()));
    expect(screen.getAllByRole("listitem")).toHaveLength(4);
  });

  it("shows every item, wrapping, once the '…' button has been used", async () => {
    const user = userEvent.setup();
    stubLayout();
    navWidth = 350;
    render(<Basic count={6} maxItems="container" />);
    await user.click(screen.getByRole("button", { name: /hidden pages/ }));
    expect(screen.getAllByRole("listitem")).toHaveLength(6);
    expect(screen.getByRole("navigation").className).not.toMatch(/measuring/);
    expect(screen.getByRole("link", { name: "Products" })).toHaveFocus();
  });

  it("never collapses a trail with too few items to hide two", () => {
    stubLayout();
    navWidth = 100;
    render(<Basic count={3} maxItems="container" />);
    expect(screen.getAllByRole("listitem")).toHaveLength(3);
    expect(screen.queryByRole("button")).not.toBeInTheDocument();
  });

  it("leaves a numeric maxItems alone", () => {
    render(<Basic count={5} maxItems={3} />);
    expect(screen.getAllByRole("listitem")).toHaveLength(4);
  });
});

describe("Breadcrumb — a different trail", () => {
  const Trail = ({ names, ...props }: { names: string[] } & Partial<BreadcrumbProps>) => (
    <Breadcrumb maxItems={3} {...props}>
      {names.map((name, index) => (
        <Breadcrumb.Item key={name}>
          {index === names.length - 1 ? (
            <Breadcrumb.Page>{name}</Breadcrumb.Page>
          ) : (
            <Breadcrumb.Link href={`/${name}`}>{name}</Breadcrumb.Link>
          )}
        </Breadcrumb.Item>
      ))}
    </Breadcrumb>
  );

  it("starts over when the items change — collapsed again if the new trail is long", async () => {
    const user = userEvent.setup();
    const { rerender } = render(<Trail names={["a", "b", "c", "d", "e"]} />);
    await user.click(screen.getByRole("button"));
    expect(screen.getAllByRole("listitem")).toHaveLength(5);
    rerender(<Trail names={["a", "x", "y", "z", "w", "v"]} />);
    expect(screen.getByRole("button", { name: "Show 3 hidden pages" })).toBeInTheDocument();
  });

  it("keeps the expansion while the same trail re-renders", async () => {
    const user = userEvent.setup();
    const { rerender } = render(<Trail names={["a", "b", "c", "d", "e"]} />);
    await user.click(screen.getByRole("button"));
    rerender(<Trail names={["a", "b", "c", "d", "e"]} size="sm" />);
    expect(screen.getAllByRole("listitem")).toHaveLength(5);
    expect(screen.queryByRole("button")).not.toBeInTheDocument();
  });
});

describe("Breadcrumb — StrictMode", () => {
  it("still moves focus after expanding when mounted twice", async () => {
    const user = userEvent.setup();
    render(
      <StrictMode>
        <Basic count={5} maxItems={3} />
      </StrictMode>,
    );
    await user.click(screen.getByRole("button", { name: "Show 2 hidden pages" }));
    expect(screen.getByRole("link", { name: "Products" })).toHaveFocus();
  });
});

describe("Breadcrumb — accessibility", () => {
  const cases: Array<[string, ReactNode]> = [
    ["a plain trail", <Basic key="a" />],
    ["a collapsed trail", <Basic key="b" count={5} maxItems={3} />],
    ["a slash separator", <Basic key="c" separator="slash" />],
    ["a named nav", <Basic key="d" aria-label="Path" size="xs" />],
    ["the brand tone, underlined", <Basic key="e" tone="brand" underline />],
    ["the neutral tone", <Basic key="f" tone="neutral" />],
  ];
  it.each(cases)("has no axe violations: %s", async (_name, ui) => {
    const { container } = render(<>{ui}</>);
    expect(await axe(container)).toHaveNoViolations();
  });

  it("has no axe violations once expanded", async () => {
    const user = userEvent.setup();
    const { container } = render(<Basic count={5} maxItems={3} />);
    await user.click(screen.getByRole("button"));
    expect(await axe(container)).toHaveNoViolations();
  });
});

describe("Breadcrumb labels that are undefined", () => {
  it("keeps the default names", () => {
    render(
      <Breadcrumb maxItems={3} labels={{ navigation: undefined, expand: undefined }}>
        {["A", "B", "C", "D"].map((name) => (
          <Breadcrumb.Item key={name}>
            <Breadcrumb.Link href={`/${name}`}>{name}</Breadcrumb.Link>
          </Breadcrumb.Item>
        ))}
        <Breadcrumb.Item>
          <Breadcrumb.Page>E</Breadcrumb.Page>
        </Breadcrumb.Item>
      </Breadcrumb>,
    );
    expect(screen.getByRole("navigation", { name: "Breadcrumb" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Show 2 hidden pages" })).toBeInTheDocument();
  });
});
