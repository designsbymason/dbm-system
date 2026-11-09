import { HouseIcon } from "@dbm-system/icons";
import { act, render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { axe } from "jest-axe";
import { createRef, StrictMode, useState } from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { Badge } from "../../atoms/Badge";
import { Button } from "../../atoms/Button";
import { Navbar } from "./Navbar";
import buttonStyles from "../../atoms/Button/Button.module.css";
import iconButtonStyles from "../../atoms/IconButton/IconButton.module.css";
import { IconButton } from "../../atoms/IconButton";
import styles from "./Navbar.module.css";

// jsdom applies the stylesheet but matches no media query, so below the breakpoint the bar's own links are `display: none`
// (as on a phone) and only the menu panel's copy is reachable. Tests of the bar's links read them with `hidden: true`, or set
// `collapseBelow="never"` to keep them on show. A hidden element has no computed accessible name, so the bar's own
// navigation is checked by its `aria-label` attribute.
const inline = { hidden: true } as const;

function Basic(props: Partial<React.ComponentProps<typeof Navbar>>) {
  return (
    <Navbar {...props}>
      <Navbar.Brand href="/">Acme</Navbar.Brand>
      <Navbar.Links>
        <Navbar.Link href="/products" current>
          Products
        </Navbar.Link>
        <Navbar.Link href="/pricing">Pricing</Navbar.Link>
        <Navbar.Link href="/docs" disabled>
          Docs
        </Navbar.Link>
      </Navbar.Links>
      <Navbar.Actions>
        <Button size="sm">Sign in</Button>
      </Navbar.Actions>
    </Navbar>
  );
}

afterEach(() => {
  vi.restoreAllMocks();
});

describe("Navbar", () => {
  it("is a banner with a named navigation holding a list of links", () => {
    render(<Basic />);
    expect(screen.getByRole("banner")).toBeInTheDocument();
    const nav = screen.getByRole("navigation", inline);
    expect(nav).toHaveAttribute("aria-label", "Main");
    const list = within(nav).getByRole("list", inline);
    expect(within(list).getAllByRole("listitem", inline)).toHaveLength(3);
    expect(screen.getByRole("link", { name: "Acme" })).toHaveAttribute("href", "/");
  });

  it("marks the current page and no other", () => {
    render(<Basic />);
    expect(screen.getByRole("link", { name: "Products", ...inline })).toHaveAttribute("aria-current", "page");
    expect(screen.getByRole("link", { name: "Pricing", ...inline })).not.toHaveAttribute("aria-current");
  });

  it("names the navigation from aria-label, aria-labelledby or labels", () => {
    const { rerender } = render(
      <Navbar labels={{ navigation: "Primary" }}>
        <Navbar.Links>
          <Navbar.Link href="/a">A</Navbar.Link>
        </Navbar.Links>
      </Navbar>,
    );
    expect(screen.getByRole("navigation", inline)).toHaveAttribute("aria-label", "Primary");
    rerender(
      <Navbar>
        <Navbar.Links aria-label="Site">
          <Navbar.Link href="/a">A</Navbar.Link>
        </Navbar.Links>
      </Navbar>,
    );
    expect(screen.getByRole("navigation", inline)).toHaveAttribute("aria-label", "Site");
  });

  it("keeps a label whose override is undefined", () => {
    render(
      <Navbar labels={{ menu: undefined, navigation: undefined }}>
        <Navbar.Links>
          <Navbar.Link href="/a">A</Navbar.Link>
        </Navbar.Links>
      </Navbar>,
    );
    expect(screen.getByRole("button", { name: "Menu" })).toBeInTheDocument();
    expect(screen.getByRole("navigation", inline)).toHaveAttribute("aria-label", "Main");
  });

  it("forwards its ref to the header and the standard props", () => {
    const ref = createRef<HTMLElement>();
    render(<Basic ref={ref} id="top" className="mine" data-testid="bar" aria-label="Site header" />);
    const header = screen.getByTestId("bar");
    expect(ref.current).toBe(header);
    expect(header.tagName).toBe("HEADER");
    expect(header).toHaveAttribute("id", "top");
    expect(header).toHaveClass("mine");
    expect(screen.getByRole("banner", { name: "Site header" })).toBe(header);
  });

  it("keeps its own computed attributes when the same props are passed", () => {
    render(<Basic {...({ "data-variant": "x", "data-size": "x" } as object)} variant="filled" size="lg" />);
    const header = screen.getByRole("banner");
    expect(header).toHaveAttribute("data-variant", "filled");
    expect(header).toHaveAttribute("data-size", "lg");
  });

  it("applies the collapse class to the bar, and the variant and size to its row", () => {
    render(<Basic variant="filled" size="sm" collapseBelow="lg" />);
    const header = screen.getByRole("banner");
    expect(header).toHaveClass(styles.collapseLg!);
    const row = header.firstElementChild!;
    expect(row).toHaveClass(styles.row!, styles.filled!, styles.sizeSm!);
  });

  it("sets the direction on the bar", () => {
    render(<Basic dir="rtl" />);
    expect(screen.getByRole("banner")).toHaveAttribute("dir", "rtl");
  });

  it("draws a menu button for the links, closed, and none without links", () => {
    const { rerender } = render(<Basic />);
    const button = screen.getByRole("button", { name: "Menu" });
    expect(button).toHaveAttribute("aria-expanded", "false");
    rerender(
      <Navbar>
        <Navbar.Brand href="/">Acme</Navbar.Brand>
      </Navbar>,
    );
    expect(screen.queryByRole("button", { name: "Menu" })).not.toBeInTheDocument();
  });

  it("draws no automatic menu button when collapseBelow is never, or when the caller placed one", () => {
    const { rerender } = render(<Basic collapseBelow="never" />);
    expect(screen.queryByRole("button", { name: "Menu" })).not.toBeInTheDocument();
    rerender(
      <Navbar>
        <Navbar.MenuButton aria-label="Open navigation" data-testid="mine" />
        <Navbar.Links>
          <Navbar.Link href="/a">A</Navbar.Link>
        </Navbar.Links>
      </Navbar>,
    );
    expect(screen.getAllByRole("button")).toHaveLength(1);
    expect(screen.getByRole("button", { name: "Open navigation" })).toHaveAttribute("data-testid", "mine");
  });

  it("opens the menu panel with the same links, named and modal", async () => {
    const user = userEvent.setup();
    render(<Basic />);
    await user.click(screen.getByRole("button", { name: "Menu" }));
    const panel = await screen.findByRole("dialog", { name: "Menu" });
    expect(panel).toHaveAttribute("aria-modal", "true");
    const nav = within(panel).getByRole("navigation", { name: "Main" });
    expect(within(nav).getAllByRole("link").map((link) => link.textContent)).toEqual(["Products", "Pricing", "Docs"]);
    expect(within(nav).getByRole("link", { name: "Products" })).toHaveAttribute("aria-current", "page");
  });

  it("closes the panel on a link a router handles with preventDefault", async () => {
    const user = userEvent.setup();
    render(<Basic />);
    await user.click(screen.getByRole("button", { name: "Menu" }));
    const panel = await screen.findByRole("dialog");
    const link = within(panel).getByRole("link", { name: "Pricing" });
    link.addEventListener("click", (event) => event.preventDefault());
    await user.click(link);
    await waitFor(() => expect(screen.queryByRole("dialog")).not.toBeInTheDocument());
  });

  it("closes the panel on a plain link click and restores focus", async () => {
    const user = userEvent.setup();
    render(<Basic />);
    const button = screen.getByRole("button", { name: "Menu" });
    await user.click(button);
    const panel = await screen.findByRole("dialog");
    await user.click(within(panel).getByRole("link", { name: "Pricing" }));
    await waitFor(() => expect(screen.queryByRole("dialog")).not.toBeInTheDocument());
    await waitFor(() => expect(button).toHaveFocus());
  });

  it("keeps the panel open on a link when closeMenuOnNavigate is off", async () => {
    const user = userEvent.setup();
    render(<Basic closeMenuOnNavigate={false} />);
    await user.click(screen.getByRole("button", { name: "Menu" }));
    const panel = await screen.findByRole("dialog");
    await user.click(within(panel).getByRole("link", { name: "Pricing" }));
    expect(screen.getByRole("dialog")).toBeInTheDocument();
  });

  it("does not close the panel, nor run a click, on a disabled link", async () => {
    const user = userEvent.setup();
    const onClick = vi.fn();
    render(
      <Navbar>
        <Navbar.Links>
          <Navbar.Link href="/off" disabled onClick={onClick}>
            Off
          </Navbar.Link>
        </Navbar.Links>
      </Navbar>,
    );
    await user.click(screen.getByRole("button", { name: "Menu" }));
    const panel = await screen.findByRole("dialog");
    const link = within(panel).getByRole("link", { name: "Off" });
    expect(link).toHaveAttribute("aria-disabled", "true");
    await user.click(link);
    expect(onClick).not.toHaveBeenCalled();
    expect(screen.getByRole("dialog")).toBeInTheDocument();
  });

  it("keeps a disabled link in the tab order", async () => {
    const user = userEvent.setup();
    render(<Basic collapseBelow="never" />);
    await user.tab();
    expect(screen.getByRole("link", { name: "Acme" })).toHaveFocus();
    await user.tab();
    expect(screen.getByRole("link", { name: "Products" })).toHaveFocus();
    await user.tab();
    expect(screen.getByRole("link", { name: "Pricing" })).toHaveFocus();
    await user.tab();
    expect(screen.getByRole("link", { name: "Docs" })).toHaveFocus();
  });

  it("runs a slotted child's click once for asChild links and closes the panel", async () => {
    const user = userEvent.setup();
    const navigate = vi.fn((event: { preventDefault: () => void }) => event.preventDefault());
    render(
      <Navbar>
        <Navbar.Links>
          <Navbar.Link asChild>
            <a href="/router" onClick={navigate}>
              Router
            </a>
          </Navbar.Link>
        </Navbar.Links>
      </Navbar>,
    );
    await user.click(screen.getByRole("button", { name: "Menu" }));
    const panel = await screen.findByRole("dialog");
    await user.click(within(panel).getByRole("link", { name: "Router" }));
    expect(navigate).toHaveBeenCalledTimes(1);
  });

  it("supports a controlled menu and reports changes", async () => {
    const user = userEvent.setup();
    const onMenuOpenChange = vi.fn();
    function Controlled() {
      const [open, setOpen] = useState(false);
      return (
        <Basic
          menuOpen={open}
          onMenuOpenChange={(next, details) => {
            onMenuOpenChange(next, details);
            setOpen(next);
          }}
        />
      );
    }
    render(<Controlled />);
    await user.click(screen.getByRole("button", { name: "Menu" }));
    expect(await screen.findByRole("dialog")).toBeInTheDocument();
    expect(onMenuOpenChange).toHaveBeenLastCalledWith(true, { reason: "trigger" });
    await user.keyboard("{Escape}");
    await waitFor(() => expect(screen.queryByRole("dialog")).not.toBeInTheDocument());
    expect(onMenuOpenChange).toHaveBeenLastCalledWith(false, { reason: "escape" });
  });

  it("starts open with defaultMenuOpen", () => {
    render(<Basic defaultMenuOpen />);
    expect(screen.getByRole("dialog", { name: "Menu" })).toBeInTheDocument();
  });

  it("closes an open panel when the page grows past the collapse width", async () => {
    let listener: ((event: MediaQueryListEvent) => void) | undefined;
    vi.spyOn(window, "matchMedia").mockImplementation(
      () =>
        ({
          matches: false,
          media: "",
          addEventListener: (_type: string, callback: (event: MediaQueryListEvent) => void) => {
            listener = callback;
          },
          removeEventListener: () => {},
        }) as unknown as MediaQueryList,
    );
    render(<Basic defaultMenuOpen />);
    expect(screen.getByRole("dialog")).toBeInTheDocument();
    listener?.({ matches: true } as MediaQueryListEvent);
    await waitFor(() => expect(screen.queryByRole("dialog")).not.toBeInTheDocument());
  });

  it("wraps the bar in a sticky element with a surface when sticky", () => {
    render(<Basic sticky />);
    expect(screen.getByRole("banner")).toHaveClass(styles.sticky!);
  });

  it("puts the content in a Container when contained", () => {
    const { container } = render(<Basic contained />);
    const inner = container.querySelector(`.${styles.inner}`);
    expect(inner).not.toBeNull();
    expect(inner).not.toHaveClass(styles.plainInner!);
  });

  it("throws a clear error for a part outside a Navbar", () => {
    vi.spyOn(console, "error").mockImplementation(() => {});
    expect(() => render(<Navbar.Link href="/a">A</Navbar.Link>)).toThrow("Navbar.Link must be used inside <Navbar>.");
  });

  it("survives StrictMode", async () => {
    const user = userEvent.setup();
    render(
      <StrictMode>
        <Basic />
      </StrictMode>,
    );
    await user.click(screen.getByRole("button", { name: "Menu" }));
    expect(await screen.findByRole("dialog")).toBeInTheDocument();
  });

  it("nests inside itself without losing its own settings", () => {
    render(
      <Navbar size="lg">
        <Navbar.Links>
          <Navbar.Link href="/a">A</Navbar.Link>
        </Navbar.Links>
        <Navbar.Actions>
          <Navbar variant="ghost" aria-label="Inner">
            <Navbar.Brand>Inner</Navbar.Brand>
          </Navbar>
        </Navbar.Actions>
      </Navbar>,
    );
    expect(screen.getByRole("banner", { name: "Inner" })).toHaveAttribute("data-size", "md");
  });

  describe("accessibility", () => {
    it("has no axe violations, closed", async () => {
      const { container } = render(<Basic />);
      expect(await axe(container)).toHaveNoViolations();
    });

    it("has no axe violations with the menu panel open", async () => {
      const user = userEvent.setup();
      render(<Basic />);
      await user.click(screen.getByRole("button", { name: "Menu" }));
      const panel = await screen.findByRole("dialog");
      expect(await axe(panel)).toHaveNoViolations();
    });

    it("has no axe violations as a router-link asChild navbar", async () => {
      const { container } = render(
        <Navbar>
          <Navbar.Brand asChild>
            <a href="/">Acme</a>
          </Navbar.Brand>
          <Navbar.Links>
            <Navbar.Link asChild current>
              <a href="/a">A</a>
            </Navbar.Link>
          </Navbar.Links>
        </Navbar>,
      );
      expect(await axe(container)).toHaveNoViolations();
    });
  });
});

function WithGroup(props: Partial<React.ComponentProps<typeof Navbar>> & { groupCurrent?: boolean; groupDisabled?: boolean } = {}) {
  const { groupCurrent, groupDisabled, ...root } = props;
  return (
    <Navbar {...root}>
      <Navbar.Links>
        <Navbar.Link href="/products">Products</Navbar.Link>
        <Navbar.Group label="Resources" current={groupCurrent} disabled={groupDisabled}>
          <Navbar.Link href="/blog" current={groupCurrent}>
            Blog
          </Navbar.Link>
          <Navbar.Link href="/guides">Guides</Navbar.Link>
          <Navbar.Link href="/archive" disabled>
            Archive
          </Navbar.Link>
        </Navbar.Group>
      </Navbar.Links>
    </Navbar>
  );
}

describe("Navbar in the menu panel", () => {
  it("leaves the panel open when a button drawn with the link look is pressed, and closes it for a link", async () => {
    const user = userEvent.setup();
    const onPress = vi.fn();
    render(
      <Navbar>
        <Navbar.Links>
          <Navbar.Link asChild>
            <button type="button" onClick={onPress}>
              Action
            </button>
          </Navbar.Link>
          <Navbar.Link href="/a">Page</Navbar.Link>
        </Navbar.Links>
      </Navbar>,
    );
    await user.click(screen.getByRole("button", { name: "Menu" }));
    const panel = await screen.findByRole("dialog");
    await user.click(within(panel).getByRole("button", { name: "Action" }));
    expect(onPress).toHaveBeenCalledTimes(1);
    expect(screen.getByRole("dialog")).toBeInTheDocument();
    await user.click(within(panel).getByRole("link", { name: "Page" }));
    await waitFor(() => expect(screen.queryByRole("dialog")).not.toBeInTheDocument());
  });
});

describe("Navbar linkSize", () => {
  const nav = (name: string) => screen.getByRole("navigation", { name, hidden: true });

  it("follows the bar's height step when none is set, a taller bar having larger links", () => {
    const expected = { xs: styles.linkSizeXs, sm: styles.linkSizeSm, md: styles.linkSizeMd, lg: styles.linkSizeLg } as const;
    for (const size of ["xs", "sm", "md", "lg"] as const) {
      const { unmount } = render(
        <Navbar size={size} collapseBelow="never">
          <Navbar.Links aria-label="Main">
            <Navbar.Link href="/a">A</Navbar.Link>
          </Navbar.Links>
        </Navbar>,
      );
      expect(nav("Main")).toHaveClass(expected[size]!);
      unmount();
    }
  });

  it("takes the bar's linkSize, a row's over it, and a set's over both", () => {
    render(
      <Navbar linkSize="lg" collapseBelow="never">
        <Navbar.Row>
          <Navbar.Links aria-label="Bar">
            <Navbar.Link href="/a">A</Navbar.Link>
          </Navbar.Links>
        </Navbar.Row>
        <Navbar.Row linkSize="xs">
          <Navbar.Links aria-label="Row">
            <Navbar.Link href="/b">B</Navbar.Link>
          </Navbar.Links>
        </Navbar.Row>
        <Navbar.Row linkSize="xs">
          <Navbar.Links aria-label="Set" linkSize="xl">
            <Navbar.Link href="/c">C</Navbar.Link>
          </Navbar.Links>
        </Navbar.Row>
      </Navbar>,
    );
    expect(nav("Bar")).toHaveClass(styles.linkSizeLg!);
    expect(nav("Row")).toHaveClass(styles.linkSizeXs!);
    expect(nav("Set")).toHaveClass(styles.linkSizeXl!);
  });

  it("reads a quiet set one step below its size, set or followed (never below xs)", () => {
    const { rerender } = render(
      <Navbar size="lg" collapseBelow="never">
        <Navbar.Links aria-label="Quiet" quiet>
          <Navbar.Link href="/a">A</Navbar.Link>
        </Navbar.Links>
      </Navbar>,
    );
    expect(nav("Quiet")).toHaveClass(styles.linkSizeMd!);
    rerender(
      <Navbar size="xs" collapseBelow="never">
        <Navbar.Links aria-label="Quiet" quiet>
          <Navbar.Link href="/a">A</Navbar.Link>
        </Navbar.Links>
      </Navbar>,
    );
    expect(nav("Quiet")).toHaveClass(styles.linkSizeXs!);
    for (const [set, read] of [["xl", styles.linkSizeLg], ["md", styles.linkSizeSm], ["xs", styles.linkSizeXs]] as const) {
      rerender(
        <Navbar linkSize={set} collapseBelow="never">
          <Navbar.Links aria-label="Quiet" quiet>
            <Navbar.Link href="/a">A</Navbar.Link>
          </Navbar.Links>
        </Navbar>,
      );
      expect(nav("Quiet")).toHaveClass(read!);
    }
  });

  it("scales a link's icon with the set's size, and the panel's copy keeps its own", async () => {
    const user = userEvent.setup();
    const { rerender } = render(
      <Navbar linkSize="xs" collapseBelow="never">
        <Navbar.Links aria-label="Main">
          <Navbar.Link href="/a" icon={HouseIcon}>
            A
          </Navbar.Link>
        </Navbar.Links>
      </Navbar>,
    );
    const iconOf = () => nav("Main").querySelector("svg")!;
    expect(iconOf().getAttribute("class")).toMatch(/sizeXs/);
    rerender(
      <Navbar linkSize="xl" collapseBelow="never">
        <Navbar.Links aria-label="Main">
          <Navbar.Link href="/a" icon={HouseIcon}>
            A
          </Navbar.Link>
        </Navbar.Links>
      </Navbar>,
    );
    expect(iconOf().getAttribute("class")).toMatch(/sizeLg/);
    // the menu panel draws its own copy, which keeps the panel's sizing
    rerender(
      <Navbar linkSize="xl">
        <Navbar.Links aria-label="Main">
          <Navbar.Link href="/a" icon={HouseIcon}>
            A
          </Navbar.Link>
        </Navbar.Links>
      </Navbar>,
    );
    await user.click(screen.getByRole("button", { name: "Menu" }));
    const panel = await screen.findByRole("dialog");
    expect(panel.querySelector("nav svg")!.getAttribute("class")).toMatch(/sizeSm/);
    expect(panel.querySelector("nav")!.className).not.toMatch(/linkSize/);
  });

  it("gives a group's dropdown the set's size when one was set, and Menu's own otherwise", async () => {
    const user = userEvent.setup();
    const { unmount } = render(<WithGroup collapseBelow="never" />);
    await user.click(screen.getByRole("button", { name: "Resources" }));
    expect((await screen.findByRole("menu")).className).toMatch(/sizeMd/);
    unmount();
    render(<WithGroup collapseBelow="never" linkSize="xl" />);
    await user.click(screen.getByRole("button", { name: "Resources" }));
    expect((await screen.findByRole("menu")).className).toMatch(/sizeXl/);
  });
});

describe("Navbar link extras and the frosted variant", () => {
  const nav = (name: string) => screen.getByRole("navigation", { name, hidden: true });

  it("draws a link's badge with the Badge atom, at its xs size whatever the link size, and a trailing arrow a step behind its icon", () => {
    render(
      <Navbar linkSize="xl" collapseBelow="never">
        <Navbar.Links aria-label="Main">
          <Navbar.Link href="/a" badge="New" icon={HouseIcon} external>
            Pricing
          </Navbar.Link>
        </Navbar.Links>
      </Navbar>,
    );
    const link = nav("Main").querySelector("a")!;
    const badge = [...link.querySelectorAll("span")].find((span) => span.textContent === "New")!;
    expect(badge.className).toMatch(/sizeXs/);
    const [leading, trailing] = [...link.querySelectorAll("svg")];
    expect(leading!.getAttribute("class")).toMatch(/sizeLg/);
    expect(trailing!.getAttribute("class")).toMatch(/sizeMd/);
  });

  it("draws a Badge passed as the badge as written, with the link's size where it sets none, and never inside another badge", () => {
    render(
      <Navbar linkSize="xl" collapseBelow="never">
        <Navbar.Links aria-label="Main">
          <Navbar.Link href="/a" badge={<Badge tone="danger" variant="solid">2</Badge>}>
            Alerts
          </Navbar.Link>
          <Navbar.Link href="/b" badge={<Badge tone="success" size="xs">9</Badge>}>
            Orders
          </Navbar.Link>
          <Navbar.Link href="/c" badge="New">
            Pricing
          </Navbar.Link>
        </Navbar.Links>
      </Navbar>,
    );
    const pill = (link: string, text: string) => [...screen.getByRole("link", { name: new RegExp(link) }).querySelectorAll("span")].filter((span) => span.textContent === text);
    // one pill each, a direct child of the link: a passed Badge is not wrapped in the link's own
    expect(pill("Alerts", "2")).toHaveLength(1);
    expect(pill("Alerts", "2")[0]!.parentElement!.tagName).toBe("A");
    expect(pill("Alerts", "2")[0]!.className).toMatch(/Danger/i);
    expect(pill("Alerts", "2")[0]!.className).toMatch(/sizeXs/);
    // its own size wins over the link's
    expect(pill("Orders", "9")[0]!.className).toMatch(/sizeXs/);
    expect(pill("Orders", "9")[0]!.className).toMatch(/Success/i);
    // plain content is the link's own solid brand badge
    expect(pill("Pricing", "New")[0]!.className).toMatch(/solidBrand/i);
  });

  it("draws the link's own badge subtle on a current link drawn as a brand fill, where a solid one would vanish", () => {
    render(
      <Navbar collapseBelow="never" currentVariant="solid">
        <Navbar.Links aria-label="Main">
          <Navbar.Link href="/a" current badge="2">
            Here
          </Navbar.Link>
          <Navbar.Link href="/b" badge="5">
            There
          </Navbar.Link>
        </Navbar.Links>
      </Navbar>,
    );
    const pill = (text: string) => screen.getAllByText(text).find((element) => element.tagName === "SPAN")!;
    expect(pill("2").className).toMatch(/subtleBrand/);
    expect(pill("5").className).toMatch(/solidBrand/);
  });

  it("draws the frosted variant's class on a row and its bar", () => {
    render(
      <Navbar variant="frosted" sticky>
        <Navbar.Row data-testid="row">
          <Navbar.Brand href="/">dbM</Navbar.Brand>
        </Navbar.Row>
      </Navbar>,
    );
    expect(screen.getByTestId("row")).toHaveClass(styles.frosted!);
    expect(screen.getByRole("banner")).toHaveClass(styles.frostedBar!);
  });
});

describe("Navbar.Actions and the bar's size", () => {
  const actions = (props: Partial<React.ComponentProps<typeof Navbar>> = {}, rowSize?: "xs" | "sm" | "md" | "lg") => (
    <Navbar {...props}>
      <Navbar.Row size={rowSize}>
        <Navbar.Brand href="/">dbM</Navbar.Brand>
        <Navbar.Actions>
          <Button>Plain</Button>
          <Button size="xs">Own</Button>
          <IconButton icon={HouseIcon} aria-label="Home" />
        </Navbar.Actions>
        <Button>Outside</Button>
      </Navbar.Row>
    </Navbar>
  );

  it("gives a Button or IconButton that sets no size the bar's size, and leaves its own and any outside alone", () => {
    render(actions({ size: "lg" }));
    expect(screen.getByRole("button", { name: "Plain" })).toHaveClass(buttonStyles.sizeLg!);
    expect(screen.getByRole("button", { name: "Own" })).toHaveClass(buttonStyles.sizeXs!);
    expect(screen.getByRole("button", { name: "Home" })).toHaveClass(iconButtonStyles.sizeLg!);
    expect(screen.getByRole("button", { name: "Outside" })).toHaveClass(buttonStyles.sizeMd!);
  });

  it("takes the row's size over the bar's, and md when neither is set", () => {
    const { rerender } = render(actions({ size: "lg" }, "xs"));
    expect(screen.getByRole("button", { name: "Plain" })).toHaveClass(buttonStyles.sizeXs!);
    rerender(actions());
    expect(screen.getByRole("button", { name: "Plain" })).toHaveClass(buttonStyles.sizeMd!);
  });
});

describe("Navbar.Group in the bar", () => {
  it("opens a menu of its links from a button, with the current one marked", async () => {
    const user = userEvent.setup();
    render(<WithGroup collapseBelow="never" groupCurrent />);
    const trigger = screen.getByRole("button", { name: "Resources" });
    expect(trigger).toHaveAttribute("aria-haspopup", "menu");
    expect(trigger).toHaveAttribute("aria-expanded", "false");
    await user.click(trigger);
    const menu = await screen.findByRole("menu");
    const items = within(menu).getAllByRole("menuitem");
    expect(items.map((item) => item.textContent)).toEqual(["Blog", "Guides", "Archive"]);
    expect(items[0]).toHaveAttribute("href", "/blog");
    expect(items[0]).toHaveAttribute("aria-current", "page");
    expect(items[2]).toHaveAttribute("aria-disabled", "true");
    expect(trigger).toHaveAttribute("aria-expanded", "true");
  });

  it("opens with the arrow key, moves through the items, and closes with Escape and focus back on the button", async () => {
    const user = userEvent.setup();
    render(<WithGroup collapseBelow="never" />);
    const trigger = screen.getByRole("button", { name: "Resources" });
    trigger.focus();
    await user.keyboard("{ArrowDown}");
    const menu = await screen.findByRole("menu");
    await waitFor(() => expect(within(menu).getByRole("menuitem", { name: "Blog" })).toHaveFocus());
    await user.keyboard("{ArrowDown}");
    expect(within(menu).getByRole("menuitem", { name: "Guides" })).toHaveFocus();
    await user.keyboard("{Escape}");
    await waitFor(() => expect(screen.queryByRole("menu")).not.toBeInTheDocument());
    expect(trigger).toHaveFocus();
  });

  it("draws the group as a list item holding the button, and a disabled group takes no focus", async () => {
    const user = userEvent.setup();
    render(<WithGroup collapseBelow="never" groupDisabled />);
    const trigger = screen.getByRole("button", { name: "Resources" });
    expect(trigger).toBeDisabled();
    expect(trigger.closest("li")).toHaveAttribute("role", "listitem");
    await user.click(trigger);
    expect(screen.queryByRole("menu")).not.toBeInTheDocument();
  });

  it("forwards the button's ref, id, class and test id, and keeps its own type", () => {
    const ref = createRef<HTMLButtonElement>();
    render(
      <Navbar collapseBelow="never">
        <Navbar.Links>
          <Navbar.Group ref={ref} label="More" id="more" className="mine" data-testid="group" {...({ type: "submit" } as object)}>
            <Navbar.Link href="/a">A</Navbar.Link>
          </Navbar.Group>
        </Navbar.Links>
      </Navbar>,
    );
    const button = screen.getByTestId("group");
    expect(ref.current).toBe(button);
    expect(button).toHaveAttribute("id", "more");
    expect(button).toHaveClass("mine");
    expect(button).toHaveAttribute("type", "button");
  });

  it("closes its menu on a link a router handles with preventDefault, which Menu alone would leave open", async () => {
    const user = userEvent.setup();
    const navigate = vi.fn((event: { preventDefault: () => void }) => event.preventDefault());
    render(
      <Navbar collapseBelow="never">
        <Navbar.Links>
          <Navbar.Group label="Resources">
            <Navbar.Link asChild>
              <a href="/blog" onClick={navigate}>
                Blog
              </a>
            </Navbar.Link>
          </Navbar.Group>
        </Navbar.Links>
      </Navbar>,
    );
    const trigger = screen.getByRole("button", { name: "Resources" });
    await user.click(trigger);
    await user.click(await screen.findByRole("menuitem", { name: "Blog" }));
    expect(navigate).toHaveBeenCalledTimes(1);
    await waitFor(() => expect(screen.queryByRole("menu")).not.toBeInTheDocument());
    await waitFor(() => expect(trigger).toHaveFocus());
  });

  it("has no axe violations closed or open", async () => {
    const user = userEvent.setup();
    const { container } = render(<WithGroup collapseBelow="never" />);
    expect(await axe(container)).toHaveNoViolations();
    await user.click(screen.getByRole("button", { name: "Resources" }));
    const menu = await screen.findByRole("menu");
    expect(await axe(menu)).toHaveNoViolations();
  });
});

describe("Navbar.Group in the menu panel", () => {
  it("is an expandable group: collapsed, it hides its links, and the button toggles them without closing the panel", async () => {
    const user = userEvent.setup();
    render(<WithGroup />);
    await user.click(screen.getByRole("button", { name: "Menu" }));
    const panel = await screen.findByRole("dialog");
    const toggle = within(panel).getByRole("button", { name: "Resources" });
    expect(toggle).toHaveAttribute("aria-expanded", "false");
    expect(within(panel).queryByRole("link", { name: "Blog" })).not.toBeInTheDocument();
    await user.click(toggle);
    expect(toggle).toHaveAttribute("aria-expanded", "true");
    expect(toggle).toHaveAttribute("aria-controls", within(panel).getByRole("link", { name: "Blog" }).closest("ul")!.id);
    expect(screen.getByRole("dialog")).toBeInTheDocument();
    await user.click(toggle);
    expect(toggle).toHaveAttribute("aria-expanded", "false");
  });

  it("starts expanded when it holds the current page, or with defaultOpen, and a chosen link closes the panel", async () => {
    const user = userEvent.setup();
    render(<WithGroup groupCurrent />);
    await user.click(screen.getByRole("button", { name: "Menu" }));
    const panel = await screen.findByRole("dialog");
    expect(within(panel).getByRole("button", { name: "Resources" })).toHaveAttribute("aria-expanded", "true");
    await user.click(within(panel).getByRole("link", { name: "Guides" }));
    await waitFor(() => expect(screen.queryByRole("dialog")).not.toBeInTheDocument());
  });

  it("keeps its own link-in-a-list structure and has no axe violations with the group open", async () => {
    const user = userEvent.setup();
    render(
      <Navbar defaultMenuOpen>
        <Navbar.Links>
          <Navbar.Group label="Resources" defaultOpen>
            <Navbar.Link href="/blog">Blog</Navbar.Link>
          </Navbar.Group>
        </Navbar.Links>
      </Navbar>,
    );
    const panel = screen.getByRole("dialog");
    const nested = within(panel).getByRole("link", { name: "Blog" }).closest("ul")!;
    expect(nested).toHaveAttribute("role", "list");
    expect(within(panel).getAllByRole("list")).toHaveLength(2);
    expect(await axe(panel)).toHaveNoViolations();
    await user.keyboard("{Escape}");
  });
});

describe("Navbar currentVariant", () => {
  const currentLink = () => screen.getByRole("link", { name: "Products", ...inline });

  it("marks the current link with the underline by default, and adds nothing for the other looks' classes", () => {
    render(<Basic />);
    expect(currentLink()).toHaveClass(styles.current!, styles.currentUnderline!);
    expect(currentLink()).not.toHaveClass(styles.currentSolid!);
  });

  it("marks it with the tint alone for subtle", () => {
    render(<Basic currentVariant="subtle" />);
    expect(currentLink()).toHaveClass(styles.current!);
    expect(currentLink()).not.toHaveClass(styles.currentUnderline!);
    expect(currentLink()).not.toHaveClass(styles.currentSolid!);
  });

  it.each([
    ["underline", () => styles.currentUnderline!],
    ["solid", () => styles.currentSolid!],
  ] as const)("marks the current link with the %s look, and only that link", (variant, className) => {
    render(<Basic currentVariant={variant} />);
    expect(currentLink()).toHaveClass(styles.current!, className());
    expect(screen.getByRole("link", { name: "Pricing", ...inline })).not.toHaveClass(styles.current!, className());
  });

  it("keeps aria-current on whichever look is chosen", () => {
    render(<Basic currentVariant="solid" />);
    expect(currentLink()).toHaveAttribute("aria-current", "page");
  });

  it("gives the menu panel's copy of the current link the same look, though the panel is outside the bar", async () => {
    const user = userEvent.setup();
    render(<Basic currentVariant="underline" />);
    await user.click(screen.getByRole("button", { name: "Menu" }));
    const panel = await screen.findByRole("dialog");
    expect(within(panel).getByRole("link", { name: "Products" })).toHaveClass(styles.currentUnderline!);
    expect(within(panel).getByRole("link", { name: "Pricing" })).not.toHaveClass(styles.currentUnderline!);
  });

  it("gives a group that holds the current page the same look on its button", () => {
    render(
      <Navbar collapseBelow="never" currentVariant="solid">
        <Navbar.Links>
          <Navbar.Group label="Resources" current>
            <Navbar.Link href="/a">A</Navbar.Link>
          </Navbar.Group>
          <Navbar.Group label="More">
            <Navbar.Link href="/b">B</Navbar.Link>
          </Navbar.Group>
        </Navbar.Links>
      </Navbar>,
    );
    expect(screen.getByRole("button", { name: "Resources" })).toHaveClass(styles.currentSolid!);
    expect(screen.getByRole("button", { name: "More" })).not.toHaveClass(styles.currentSolid!);
  });
});

describe("Navbar rounded", () => {
  it("is off by default, and rounds every link and a group's button when set", () => {
    const { rerender } = render(<WithGroup collapseBelow="never" />);
    expect(screen.getByRole("link", { name: "Products" })).not.toHaveClass(styles.rounded!);
    rerender(<WithGroup collapseBelow="never" rounded />);
    expect(screen.getByRole("link", { name: "Products" })).toHaveClass(styles.rounded!);
    expect(screen.getByRole("button", { name: "Resources" })).toHaveClass(styles.rounded!);
  });

  it("rounds the menu panel's copy of the links, though the panel is outside the bar", async () => {
    const user = userEvent.setup();
    render(<Basic rounded />);
    await user.click(screen.getByRole("button", { name: "Menu" }));
    const panel = await screen.findByRole("dialog");
    expect(within(panel).getByRole("link", { name: "Pricing" })).toHaveClass(styles.rounded!);
  });

  it("rounds the links and not the bar", () => {
    render(<Basic rounded />);
    expect(screen.getByRole("banner")).not.toHaveClass(styles.rounded!);
  });
});

describe("Navbar's underline growing in", () => {
  function Switching() {
    const [path, setPath] = useState("products");
    return (
      <Navbar collapseBelow="never">
        <Navbar.Links>
          {["products", "pricing", "docs"].map((id) => (
            <Navbar.Link key={id} href={`#${id}`} current={path === id} onClick={() => setPath(id)}>
              {id}
            </Navbar.Link>
          ))}
        </Navbar.Links>
        <Navbar.Actions>
          <button type="button">rerender</button>
        </Navbar.Actions>
      </Navbar>
    );
  }

  it("does not grow a link that was current when it was drawn", () => {
    render(<Switching />);
    expect(screen.getByRole("link", { name: "products" })).not.toHaveClass(styles.currentGrow!);
  });

  it("grows the link that becomes current, and only that one, and not the one that stopped being it", async () => {
    const user = userEvent.setup();
    render(<Switching />);
    await user.click(screen.getByRole("link", { name: "pricing" }));
    expect(screen.getByRole("link", { name: "pricing" })).toHaveClass(styles.currentGrow!);
    expect(screen.getByRole("link", { name: "products" })).not.toHaveClass(styles.currentGrow!);
    expect(screen.getByRole("link", { name: "docs" })).not.toHaveClass(styles.currentGrow!);
  });

  it("keeps the class through other updates and drops it when the link stops being current", async () => {
    const user = userEvent.setup();
    render(<Switching />);
    await user.click(screen.getByRole("link", { name: "pricing" }));
    await user.click(screen.getByRole("button", { name: "rerender" }));
    expect(screen.getByRole("link", { name: "pricing" })).toHaveClass(styles.currentGrow!);
    await user.click(screen.getByRole("link", { name: "docs" }));
    expect(screen.getByRole("link", { name: "pricing" })).not.toHaveClass(styles.currentGrow!);
    expect(screen.getByRole("link", { name: "docs" })).toHaveClass(styles.currentGrow!);
  });

  it("does not grow the current link in a menu panel that opens on it", async () => {
    const user = userEvent.setup();
    render(<Basic />);
    await user.click(screen.getByRole("button", { name: "Menu" }));
    const panel = await screen.findByRole("dialog");
    expect(within(panel).getByRole("link", { name: "Products" })).not.toHaveClass(styles.currentGrow!);
  });

  it("grows a group's button when it becomes the one that holds the current page", async () => {
    const user = userEvent.setup();
    function Grouped() {
      const [inside, setInside] = useState(false);
      return (
        <Navbar collapseBelow="never">
          <Navbar.Links>
            <Navbar.Group label="Resources" current={inside}>
              <Navbar.Link href="#blog">Blog</Navbar.Link>
            </Navbar.Group>
          </Navbar.Links>
          <Navbar.Actions>
            <button type="button" onClick={() => setInside(true)}>
              go
            </button>
          </Navbar.Actions>
        </Navbar>
      );
    }
    render(<Grouped />);
    const trigger = screen.getByRole("button", { name: "Resources" });
    expect(trigger).not.toHaveClass(styles.currentGrow!);
    await user.click(screen.getByRole("button", { name: "go" }));
    expect(trigger).toHaveClass(styles.currentGrow!);
  });
});

describe("Navbar.Action and Navbar.PanelActions", () => {
  function Actions(props: Partial<React.ComponentProps<typeof Navbar>> = {}) {
    return (
      <Navbar {...props}>
        <Navbar.Links>
          <Navbar.Link href="/a">A</Navbar.Link>
        </Navbar.Links>
        <Navbar.Actions>
          <Navbar.Action hideBelow="md" data-testid="signin">
            <Button size="sm">Sign in</Button>
          </Navbar.Action>
          <Navbar.Action data-testid="always">
            <Button size="sm">Search</Button>
          </Navbar.Action>
        </Navbar.Actions>
        <Navbar.PanelActions data-testid="panel-actions">
          <Button>Sign in (panel)</Button>
        </Navbar.PanelActions>
      </Navbar>
    );
  }

  it("hides an action below its width by class, and leaves the others alone", () => {
    render(<Actions />);
    expect(screen.getByTestId("signin")).toHaveClass(styles.hideBelowMd!);
    expect(screen.getByTestId("always")).not.toHaveClass(styles.hideBelowMd!);
  });

  it("forwards a ref and standard props on an action", () => {
    const ref = createRef<HTMLDivElement>();
    render(
      <Navbar>
        <Navbar.Actions>
          <Navbar.Action ref={ref} id="one" className="mine" data-testid="one">
            x
          </Navbar.Action>
        </Navbar.Actions>
      </Navbar>,
    );
    expect(ref.current).toBe(screen.getByTestId("one"));
    expect(ref.current).toHaveAttribute("id", "one");
    expect(ref.current).toHaveClass("mine", styles.action!);
  });

  it("draws nothing for the panel's actions in the bar or while the panel is closed", () => {
    render(<Actions />);
    expect(screen.queryByText("Sign in (panel)")).not.toBeInTheDocument();
    expect(screen.queryByTestId("panel-actions")).not.toBeInTheDocument();
  });

  it("draws them in the panel's footer once it is open", async () => {
    const user = userEvent.setup();
    render(<Actions />);
    await user.click(screen.getByRole("button", { name: "Menu" }));
    const panel = await screen.findByRole("dialog");
    const actions = await within(panel).findByTestId("panel-actions");
    expect(within(actions).getByRole("button", { name: "Sign in (panel)" })).toBeInTheDocument();
    expect(actions).toHaveClass(styles.panelActions!);
    // in the panel's footer, after the links
    const links = within(panel).getByRole("navigation");
    expect(links.compareDocumentPosition(actions) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
  });

  it("draws no footer when there are no panel actions", async () => {
    const user = userEvent.setup();
    render(<Basic />);
    await user.click(screen.getByRole("button", { name: "Menu" }));
    const panel = await screen.findByRole("dialog");
    expect(panel.querySelector('[data-testid="panel-actions"]')).toBeNull();
    expect(within(panel).queryAllByRole("button")).toHaveLength(1); // only the close button
  });

  it("has no axe violations with the panel open", async () => {
    const user = userEvent.setup();
    render(<Actions />);
    await user.click(screen.getByRole("button", { name: "Menu" }));
    expect(await axe(await screen.findByRole("dialog"))).toHaveNoViolations();
  });
});

describe("Navbar.SkipLink", () => {
  it("is the first link, names itself, and points at main by default", async () => {
    const user = userEvent.setup();
    render(
      <Navbar collapseBelow="never">
        <Navbar.SkipLink />
        <Navbar.Brand href="/">dbM</Navbar.Brand>
      </Navbar>,
    );
    const skip = screen.getByRole("link", { name: "Skip to content" });
    expect(skip).toHaveAttribute("href", "#main");
    await user.tab();
    expect(skip).toHaveFocus();
  });

  it("takes its own href and text, and the label from labels", () => {
    const { rerender } = render(
      <Navbar labels={{ skipLink: "Jump" }}>
        <Navbar.SkipLink />
      </Navbar>,
    );
    expect(screen.getByRole("link", { name: "Jump" })).toBeInTheDocument();
    rerender(
      <Navbar>
        <Navbar.SkipLink href="#content" data-testid="skip">
          Go to the content
        </Navbar.SkipLink>
      </Navbar>,
    );
    expect(screen.getByRole("link", { name: "Go to the content" })).toHaveAttribute("href", "#content");
  });
});

describe("Navbar.Link icon, badge and external", () => {
  it("draws an icon before the text and a badge after it, in the link's name", () => {
    render(
      <Navbar collapseBelow="never">
        <Navbar.Links>
          <Navbar.Link href="/inbox" icon={HouseIcon} badge="3">
            Inbox
          </Navbar.Link>
        </Navbar.Links>
      </Navbar>,
    );
    const link = screen.getByRole("link", { name: "Inbox 3" });
    expect(link.querySelector("svg")).not.toBeNull();
    const badge = [...link.querySelectorAll("span")].find((span) => span.textContent === "3");
    expect(badge).toBeDefined();
    expect(link.lastElementChild).toBe(badge);
    expect(link.firstElementChild?.tagName.toLowerCase()).toBe("svg");
  });

  it("marks an external href: new tab, rel, a trailing icon and a hidden cue", () => {
    render(
      <Navbar collapseBelow="never">
        <Navbar.Links>
          <Navbar.Link href="https://example.com/docs">Docs</Navbar.Link>
          <Navbar.Link href="/local">Local</Navbar.Link>
          <Navbar.Link href="https://example.com" external={false}>
            Forced
          </Navbar.Link>
        </Navbar.Links>
      </Navbar>,
    );
    // (the cue is read after the text, as one name; the space is its own leading one)
    const external = screen.getByRole("link", { name: /^Docs\s*\(opens in a new tab\)$/ });
    expect(external).toHaveAttribute("target", "_blank");
    expect(external).toHaveAttribute("rel", "noopener noreferrer");
    expect(screen.getByRole("link", { name: "Local" })).not.toHaveAttribute("target");
    expect(screen.getByRole("link", { name: "Forced" })).not.toHaveAttribute("target");
  });

  it("takes the cue's wording from labels, and draws none of it for asChild", () => {
    render(
      <Navbar collapseBelow="never" labels={{ externalLink: "(nouvel onglet)" }}>
        <Navbar.Links>
          <Navbar.Link href="https://example.com">Docs</Navbar.Link>
          <Navbar.Link asChild icon={HouseIcon} badge="9">
            <a href="https://example.com/x">Child</a>
          </Navbar.Link>
        </Navbar.Links>
      </Navbar>,
    );
    expect(screen.getByRole("link", { name: /^Docs\s*\(nouvel onglet\)$/ })).toBeInTheDocument();
    const child = screen.getByRole("link", { name: "Child" });
    expect(child.querySelector("svg")).toBeNull();
    expect(child).not.toHaveAttribute("target");
  });

  it("draws the same content for a link in a group's menu", async () => {
    const user = userEvent.setup();
    render(
      <Navbar collapseBelow="never">
        <Navbar.Links>
          <Navbar.Group label="More">
            <Navbar.Link href="https://example.com" icon={HouseIcon} badge="2">
              Docs
            </Navbar.Link>
          </Navbar.Group>
        </Navbar.Links>
      </Navbar>,
    );
    await user.click(screen.getByRole("button", { name: "More" }));
    const item = await screen.findByRole("menuitem", { name: "Docs 2 (opens in a new tab)" });
    expect(item).toHaveAttribute("target", "_blank");
  });
});

describe("Navbar.Links align", () => {
  it.each(["start", "center", "end"] as const)("puts align=%s on the navigation", (align) => {
    render(
      <Navbar collapseBelow="never">
        <Navbar.Links align={align}>
          <Navbar.Link href="/a">A</Navbar.Link>
        </Navbar.Links>
      </Navbar>,
    );
    expect(screen.getByRole("navigation")).toHaveAttribute("data-align", align);
  });

  it("is start by default, and a same-named attribute can't replace it", () => {
    render(
      <Navbar collapseBelow="never">
        <Navbar.Links {...({ "data-align": "end" } as object)}>
          <Navbar.Link href="/a">A</Navbar.Link>
        </Navbar.Links>
      </Navbar>,
    );
    expect(screen.getByRole("navigation")).toHaveAttribute("data-align", "start");
  });
});

describe("Navbar.Links hideBelow", () => {
  function Hidden(props: { hideBelow?: "lg"; collapseBelow?: "never" | "md" }) {
    return (
      <Navbar collapseBelow={props.collapseBelow}>
        <Navbar.Brand href="/">Acme</Navbar.Brand>
        <Navbar.Links aria-label="Site" hideBelow={props.hideBelow}>
          <Navbar.Link href="/products" current>
            Products
          </Navbar.Link>
        </Navbar.Links>
      </Navbar>
    );
  }

  it("marks the bar's copy of the set with the width it leaves the bar at, and a set without it carries no mark", () => {
    const { rerender } = render(<Hidden collapseBelow="never" />);
    expect(screen.getByRole("navigation", { name: "Site" })).not.toHaveAttribute("data-hide-below");
    rerender(<Hidden hideBelow="lg" collapseBelow="never" />);
    expect(screen.getByRole("navigation", { name: "Site" })).toHaveAttribute("data-hide-below", "lg");
  });

  it("draws no menu button of its own when the bar never collapses, so a page can keep one menu button", () => {
    render(<Hidden hideBelow="lg" collapseBelow="never" />);
    expect(screen.queryByRole("button", { name: "Menu" })).not.toBeInTheDocument();
  });

  it("leaves the menu panel's copy alone: the panel still offers the links", async () => {
    const user = userEvent.setup();
    render(<Hidden hideBelow="lg" collapseBelow="md" />);
    await user.click(screen.getByRole("button", { name: "Menu" }));
    const panel = await screen.findByRole("dialog");
    expect(within(panel).getByRole("link", { name: "Products" })).toBeInTheDocument();
    expect(panel.querySelector("[data-hide-below]")).toBeNull();
  });
});

describe("Navbar hideOnScroll", () => {
  function scrollTo(y: number) {
    Object.defineProperty(window, "scrollY", { value: y, configurable: true });
    window.dispatchEvent(new Event("scroll"));
  }

  beforeEach(() => {
    vi.stubGlobal("IntersectionObserver", class { observe() {} unobserve() {} disconnect() {} takeRecords() { return []; } });
    // a frame that comes after the handler returns, as a real one does (calling it inline would run the read before the
    // hook has noted that one is pending)
    vi.spyOn(window, "requestAnimationFrame").mockImplementation((callback: FrameRequestCallback) => {
      queueMicrotask(() => callback(0));
      return 1;
    });
    vi.spyOn(HTMLElement.prototype, "getBoundingClientRect").mockReturnValue({ height: 60, width: 0, top: 0, left: 0, right: 0, bottom: 60, x: 0, y: 0, toJSON() {} } as DOMRect);
    Object.defineProperty(window, "scrollY", { value: 0, configurable: true });
  });

  afterEach(() => {
    vi.stubGlobal("IntersectionObserver", undefined);
  });

  it("slides away on a scroll down past the bar, returns on a scroll up, and stays shown near the top", async () => {
    render(<Basic sticky hideOnScroll />);
    const bar = screen.getByRole("banner");
    expect(bar).not.toHaveClass(styles.awayFromView!);
    await act(async () => scrollTo(30));
    expect(bar).not.toHaveClass(styles.awayFromView!);
    await act(async () => scrollTo(300));
    expect(bar).toHaveClass(styles.awayFromView!);
    await act(async () => scrollTo(250));
    expect(bar).not.toHaveClass(styles.awayFromView!);
    await act(async () => scrollTo(400));
    expect(bar).toHaveClass(styles.awayFromView!);
    await act(async () => scrollTo(20));
    expect(bar).not.toHaveClass(styles.awayFromView!);
  });

  it("marks its header with data-away exactly while it is slid out, for a shell that follows it", async () => {
    render(<Basic sticky hideOnScroll />);
    const bar = screen.getByRole("banner");
    expect(bar).not.toHaveAttribute("data-away");
    await act(async () => scrollTo(300));
    expect(bar).toHaveAttribute("data-away");
    await act(async () => scrollTo(250));
    expect(bar).not.toHaveAttribute("data-away");
  });

  it("does nothing without hideOnScroll, and warns when it is set without sticky", async () => {
    const warn = vi.spyOn(console, "warn").mockImplementation(() => undefined);
    const { rerender } = render(<Basic sticky />);
    await act(async () => scrollTo(300));
    expect(screen.getByRole("banner")).not.toHaveClass(styles.awayFromView!);
    expect(warn).not.toHaveBeenCalled();
    rerender(<Basic hideOnScroll />);
    expect(warn).toHaveBeenCalledWith(expect.stringContaining("hideOnScroll"));
    await act(async () => scrollTo(500));
    expect(screen.getByRole("banner")).not.toHaveClass(styles.awayFromView!);
  });

  it("stops listening when it unmounts", async () => {
    const remove = vi.spyOn(window, "removeEventListener");
    const { unmount } = render(<Basic sticky hideOnScroll />);
    unmount();
    expect(remove).toHaveBeenCalledWith("scroll", expect.any(Function));
  });
});

describe("Navbar review fixes", () => {
  it("hands a sticky bar's offset to the stylesheet so a hidden bar leaves by it too, and not when it isn't sticky", () => {
    vi.stubGlobal("IntersectionObserver", class { observe() {} unobserve() {} disconnect() {} takeRecords() { return []; } });
    const { rerender } = render(<Basic sticky stickyOffset={6} />);
    expect(screen.getByRole("banner").style.getPropertyValue("--navbar-sticky-offset")).toBe("var(--dbm-space-6)");
    rerender(<Basic />);
    expect(screen.getByRole("banner").style.getPropertyValue("--navbar-sticky-offset")).toBe("");
    vi.stubGlobal("IntersectionObserver", undefined);
  });

  it("keeps a caller's own style over the bar's, and the property too if they set it", () => {
    vi.stubGlobal("IntersectionObserver", class { observe() {} unobserve() {} disconnect() {} takeRecords() { return []; } });
    render(<Basic sticky style={{ color: "red" }} />);
    expect(screen.getByRole("banner").style.color).toBe("red");
    expect(screen.getByRole("banner").style.getPropertyValue("--navbar-sticky-offset")).toBe("var(--dbm-space-0)");
    vi.stubGlobal("IntersectionObserver", undefined);
  });

  it("marks the current item of a group's menu, and only it", async () => {
    const user = userEvent.setup();
    render(<WithGroup collapseBelow="never" groupCurrent />);
    await user.click(screen.getByRole("button", { name: "Resources" }));
    const menu = await screen.findByRole("menu");
    expect(within(menu).getByRole("menuitem", { name: "Blog" })).toHaveClass(styles.menuCurrent!);
    expect(within(menu).getByRole("menuitem", { name: "Guides" })).not.toHaveClass(styles.menuCurrent!);
  });

  it("reports when the menu panel has finished opening and closing", async () => {
    const user = userEvent.setup();
    const done = vi.fn();
    render(<Basic onMenuOpenChangeComplete={done} />);
    await user.click(screen.getByRole("button", { name: "Menu" }));
    await screen.findByRole("dialog");
    await waitFor(() => expect(done).toHaveBeenCalledWith(true));
    await user.keyboard("{Escape}");
    await waitFor(() => expect(done).toHaveBeenCalledWith(false));
  });

  it("draws a group's floating menu in the menuContainer, as it does the panel", async () => {
    const user = userEvent.setup();
    const container = document.createElement("div");
    container.setAttribute("data-testid", "frame");
    document.body.appendChild(container);
    render(<WithGroup collapseBelow="never" menuContainer={container} />);
    await user.click(screen.getByRole("button", { name: "Resources" }));
    const menu = await screen.findByRole("menu");
    expect(container.contains(menu)).toBe(true);
    container.remove();
  });
});

describe("Navbar.Row", () => {
  function Rows(props: Partial<React.ComponentProps<typeof Navbar>> = {}) {
    return (
      <Navbar {...props}>
        <Navbar.Row data-testid="courtesy" size="xs" variant="filled" sticky={false}>
          <Navbar.Links aria-label="Courtesy" quiet>
            <Navbar.Link href="/help">Help</Navbar.Link>
          </Navbar.Links>
        </Navbar.Row>
        <Navbar.Row data-testid="main">
          <Navbar.Brand href="/">dbM</Navbar.Brand>
          <Navbar.Actions>
            <Button size="sm">Sign in</Button>
          </Navbar.Actions>
        </Navbar.Row>
        <Navbar.Row data-testid="categories" variant="outlined">
          <Navbar.Links aria-label="Categories">
            <Navbar.Link href="/men">Men</Navbar.Link>
            <Navbar.Link href="/women">Women</Navbar.Link>
          </Navbar.Links>
        </Navbar.Row>
      </Navbar>
    );
  }

  it("draws each row as a band inside the one banner, with its own variant, size and a scroll-away mark", () => {
    render(<Rows />);
    expect(screen.getAllByRole("banner")).toHaveLength(1);
    const header = screen.getByRole("banner");
    expect(Array.from(header.children).map((child) => child.getAttribute("data-testid"))).toEqual(["courtesy", "main", "categories"]);
    const courtesy = screen.getByTestId("courtesy");
    expect(courtesy).toHaveClass(styles.row!, styles.filled!, styles.sizeXs!);
    expect(courtesy).toHaveAttribute("data-scroll-away");
    expect(screen.getByTestId("main")).not.toHaveAttribute("data-scroll-away");
    expect(screen.getByTestId("main")).toHaveClass(styles.outlined!);
  });

  it("forwards a ref and the standard props", () => {
    const ref = createRef<HTMLDivElement>();
    render(
      <Navbar>
        <Navbar.Row ref={ref} id="r" className="mine" data-testid="row">
          <Navbar.Brand href="/">dbM</Navbar.Brand>
        </Navbar.Row>
      </Navbar>,
    );
    expect(ref.current).toBe(screen.getByTestId("row"));
    expect(ref.current).toHaveAttribute("id", "r");
    expect(ref.current).toHaveClass("mine", styles.row!);
  });

  it("starts from the bar's variant, size and contained, and a row's own setting wins", () => {
    const { container } = render(
      <Navbar variant="filled" size="lg" contained>
        <Navbar.Row data-testid="inherits">
          <Navbar.Brand href="/">dbM</Navbar.Brand>
        </Navbar.Row>
        <Navbar.Row data-testid="own" variant="ghost" size="sm" contained={false}>
          <Navbar.Brand href="/">dbM</Navbar.Brand>
        </Navbar.Row>
      </Navbar>,
    );
    expect(screen.getByTestId("inherits")).toHaveClass(styles.filled!, styles.sizeLg!);
    expect(screen.getByTestId("own")).toHaveClass(styles.ghost!, styles.sizeSm!);
    expect(screen.getByTestId("inherits").firstElementChild).not.toHaveClass(styles.plainInner!);
    expect(screen.getByTestId("own").firstElementChild).toHaveClass(styles.plainInner!);
    expect(container.querySelectorAll(`.${styles.row}`)).toHaveLength(2);
  });

  it("draws a bar with no rows as one row", () => {
    const { container } = render(<Basic />);
    expect(container.querySelectorAll(`.${styles.row}`)).toHaveLength(1);
  });

  it("puts the automatic menu button at the end of the row with the brand, and not in the others", () => {
    render(<Rows />);
    expect(screen.getAllByRole("button", { name: "Menu" })).toHaveLength(1);
    const button = screen.getByRole("button", { name: "Menu" });
    expect(screen.getByTestId("main").contains(button)).toBe(true);
    expect(screen.getByTestId("courtesy").contains(button)).toBe(false);
  });

  it("takes the first row when no row has a brand, and a menu button placed by hand wins", () => {
    const { rerender } = render(
      <Navbar>
        <Navbar.Row data-testid="one">
          <Navbar.Links aria-label="A">
            <Navbar.Link href="/a">A</Navbar.Link>
          </Navbar.Links>
        </Navbar.Row>
        <Navbar.Row data-testid="two" />
      </Navbar>,
    );
    expect(screen.getByTestId("one").contains(screen.getByRole("button", { name: "Menu" }))).toBe(true);
    rerender(
      <Navbar>
        <Navbar.Row data-testid="one">
          <Navbar.Links aria-label="A">
            <Navbar.Link href="/a">A</Navbar.Link>
          </Navbar.Links>
        </Navbar.Row>
        <Navbar.Row data-testid="two">
          <Navbar.MenuButton aria-label="Open" />
        </Navbar.Row>
      </Navbar>,
    );
    expect(screen.getAllByRole("button")).toHaveLength(1);
    expect(screen.getByTestId("two").contains(screen.getByRole("button", { name: "Open" }))).toBe(true);
  });

  it("finds parts in a fragment inside a row, and rows in a fragment", () => {
    render(
      <Navbar>
        <>
          <Navbar.Row data-testid="in-fragment">
            <>
              <Navbar.Brand href="/">dbM</Navbar.Brand>
              <Navbar.Links aria-label="Frag">
                <Navbar.Link href="/a">A</Navbar.Link>
              </Navbar.Links>
            </>
          </Navbar.Row>
        </>
      </Navbar>,
    );
    expect(screen.getByTestId("in-fragment").contains(screen.getByRole("button", { name: "Menu" }))).toBe(true);
  });

  it("puts every set of links in the one menu panel, in the order written, with the quiet ones last", async () => {
    const user = userEvent.setup();
    render(<Rows />);
    await user.click(screen.getByRole("button", { name: "Menu" }));
    const panel = await screen.findByRole("dialog");
    const navs = within(panel).getAllByRole("navigation");
    expect(navs.map((nav) => nav.getAttribute("aria-label"))).toEqual(["Categories", "Courtesy"]);
    // the panel is drawn once: one title, one close button
    expect(within(panel).getAllByRole("heading")).toHaveLength(1);
    expect(within(navs[0]!).getAllByRole("link").map((link) => link.textContent)).toEqual(["Men", "Women"]);
    expect(within(navs[1]!).getAllByRole("link").map((link) => link.textContent)).toEqual(["Help"]);
    // DOM order is reading order: the quiet set follows the other
    expect(navs[0]!.compareDocumentPosition(navs[1]!) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
  });

  it("closes the panel when a link in any of its sets is chosen", async () => {
    const user = userEvent.setup();
    render(<Rows />);
    await user.click(screen.getByRole("button", { name: "Menu" }));
    const panel = await screen.findByRole("dialog");
    await user.click(within(panel).getByRole("link", { name: "Help" }));
    await waitFor(() => expect(screen.queryByRole("dialog")).not.toBeInTheDocument());
  });

  it("draws a panel for one set of links and none for a bar with no links", async () => {
    const user = userEvent.setup();
    render(
      <Navbar defaultMenuOpen>
        <Navbar.Row>
          <Navbar.Brand href="/">dbM</Navbar.Brand>
        </Navbar.Row>
      </Navbar>,
    );
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    await user.tab();
  });

  it("warns, once per problem, about two sets of links with the same name, a scroll-away row between rows that stick, and loose parts beside rows", () => {
    vi.stubGlobal("IntersectionObserver", class { observe() {} unobserve() {} disconnect() {} takeRecords() { return []; } });
    const warn = vi.spyOn(console, "warn").mockImplementation(() => undefined);
    render(
      <Navbar sticky>
        <Navbar.Brand href="/">loose</Navbar.Brand>
        <Navbar.Row>
          <Navbar.Links>
            <Navbar.Link href="/a">A</Navbar.Link>
          </Navbar.Links>
        </Navbar.Row>
        <Navbar.Row sticky={false}>
          <Navbar.Links>
            <Navbar.Link href="/b">B</Navbar.Link>
          </Navbar.Links>
        </Navbar.Row>
        <Navbar.Row>
          <Navbar.Links aria-label="Third">
            <Navbar.Link href="/c">C</Navbar.Link>
          </Navbar.Links>
        </Navbar.Row>
      </Navbar>,
    );
    const messages = warn.mock.calls.map((call) => String(call[0]));
    expect(messages.some((message) => message.includes("same name"))).toBe(true);
    expect(messages.some((message) => message.includes("sits between rows that stick"))).toBe(true);
    expect(messages.some((message) => message.includes("mixed with"))).toBe(true);
    vi.stubGlobal("IntersectionObserver", undefined);
  });

  it("has no axe violations with rows, or with the panel open", async () => {
    const user = userEvent.setup();
    const { container } = render(<Rows />);
    expect(await axe(container)).toHaveNoViolations();
    await user.click(screen.getByRole("button", { name: "Menu" }));
    expect(await axe(await screen.findByRole("dialog"))).toHaveNoViolations();
  });
});

describe("Navbar rows that scroll away", () => {
  beforeEach(() => {
    vi.stubGlobal("IntersectionObserver", class { observe() {} unobserve() {} disconnect() {} takeRecords() { return []; } });
    vi.spyOn(HTMLElement.prototype, "getBoundingClientRect").mockImplementation(function (this: HTMLElement) {
      const height = this.hasAttribute("data-scroll-away") ? 36 : 60;
      return { height, width: 0, top: 0, left: 0, right: 0, bottom: height, x: 0, y: 0, toJSON() {} } as DOMRect;
    });
    Object.defineProperty(window, "scrollY", { value: 0, configurable: true });
  });

  afterEach(() => {
    vi.stubGlobal("IntersectionObserver", undefined);
  });

  function StickyRows({ scrollAway = true }: { scrollAway?: boolean }) {
    return (
      <Navbar sticky stickyOffset={2}>
        <Navbar.Row sticky={!scrollAway}>
          <Navbar.Brand href="/">strip</Navbar.Brand>
        </Navbar.Row>
        <Navbar.Row>
          <Navbar.Brand href="/">main</Navbar.Brand>
        </Navbar.Row>
      </Navbar>
    );
  }

  it("sticks the bar that far above the top as the leading rows are tall, and says how far", () => {
    render(<StickyRows />);
    const header = screen.getByRole("banner");
    expect(header.style.getPropertyValue("--navbar-leading-height")).toBe("36px");
    expect(header.style.top).toContain("--navbar-leading-height");
    expect(header).toHaveClass(styles.hasLeading!);
  });

  it("is stuck by its own measure: not while the leading rows are on screen, and yes once they have gone", async () => {
    render(<StickyRows />);
    const header = screen.getByRole("banner");
    expect(header).not.toHaveAttribute("data-navbar-stuck");
    await act(async () => {
      Object.defineProperty(window, "scrollY", { value: 20, configurable: true });
      window.dispatchEvent(new Event("scroll"));
    });
    expect(header).not.toHaveAttribute("data-navbar-stuck");
    await act(async () => {
      Object.defineProperty(window, "scrollY", { value: 40, configurable: true });
      window.dispatchEvent(new Event("scroll"));
    });
    expect(header).toHaveAttribute("data-navbar-stuck");
  });

  it("does nothing special when every row sticks, or the bar isn't sticky", () => {
    const { rerender } = render(<StickyRows scrollAway={false} />);
    expect(screen.getByRole("banner")).not.toHaveClass(styles.hasLeading!);
    expect(screen.getByRole("banner").style.getPropertyValue("--navbar-leading-height")).toBe("");
    rerender(
      <Navbar>
        <Navbar.Row sticky={false}>
          <Navbar.Brand href="/">strip</Navbar.Brand>
        </Navbar.Row>
      </Navbar>,
    );
    expect(screen.getByRole("banner")).not.toHaveClass(styles.hasLeading!);
  });
});

// jsdom matches no media query, so below its collapse width (the stylesheet's `@media not all and (min-width: …)`) the field stays on
// show and the button, which only that media rule shows, is `display: none`: the tests read the button with `hidden: true`.
describe("Navbar.Search", () => {
  it("is a named search landmark with a field, and a button for it below the collapse width", () => {
    render(
      <Navbar>
        <Navbar.Search />
      </Navbar>,
    );
    const landmark = screen.getByRole("search", { hidden: true });
    expect(landmark).toHaveAttribute("aria-label", "Search");
    expect(within(landmark).getByLabelText("Search", { selector: "button" })).toBeInTheDocument();
    expect(within(landmark).getByRole("searchbox", { hidden: true })).toBeInTheDocument();
  });

  it("takes its name from aria-label or labels, and draws no button when it never collapses", () => {
    const { rerender } = render(
      <Navbar labels={{ search: "Find" }}>
        <Navbar.Search collapseBelow="never" />
      </Navbar>,
    );
    expect(screen.getByRole("search")).toHaveAttribute("aria-label", "Find");
    expect(screen.queryByRole("button")).not.toBeInTheDocument();
    rerender(
      <Navbar>
        <Navbar.Search collapseBelow="never" aria-label="Products" />
      </Navbar>,
    );
    expect(screen.getByRole("searchbox", { name: "Products" })).toBeInTheDocument();
  });

  it("forwards its ref and the standard props to the landmark, and the id to the field", () => {
    const ref = createRef<HTMLDivElement>();
    render(
      <Navbar>
        <Navbar.Search ref={ref} id="q" className="mine" data-testid="search" collapseBelow="never" />
      </Navbar>,
    );
    expect(ref.current).toBe(screen.getByTestId("search"));
    expect(ref.current).toHaveClass("mine", styles.search!);
    expect(screen.getByRole("searchbox")).toHaveAttribute("id", "q");
  });

  it("takes its size from its row, or its own", () => {
    const { rerender } = render(
      <Navbar>
        <Navbar.Row size="lg">
          <Navbar.Search collapseBelow="never" data-testid="s" />
        </Navbar.Row>
      </Navbar>,
    );
    const field = () => screen.getByRole("searchbox").parentElement!;
    const lg = field().className;
    rerender(
      <Navbar>
        <Navbar.Row size="lg">
          <Navbar.Search collapseBelow="never" size="xs" data-testid="s" />
        </Navbar.Row>
      </Navbar>,
    );
    expect(field().className).not.toBe(lg);
  });

  it("opens the field in a sheet from the button, focuses it, and returns focus on Escape", async () => {
    const user = userEvent.setup();
    render(
      <Navbar>
        <Navbar.Search />
      </Navbar>,
    );
    const button = screen.getByLabelText("Search", { selector: "button" });
    await user.click(button);
    const sheet = await screen.findByRole("dialog", { name: "Search" });
    const field = within(sheet).getByRole("searchbox", { name: "Search" });
    await waitFor(() => expect(field).toHaveFocus());
    await user.keyboard("{Escape}");
    await waitFor(() => expect(screen.queryByRole("dialog")).not.toBeInTheDocument());
    await waitFor(() => expect(button).toHaveFocus());
  });

  it("closes the sheet on Enter, unless closeOnSubmit is off, and reports the search", async () => {
    const user = userEvent.setup();
    const onSearch = vi.fn();
    const { rerender } = render(
      <Navbar>
        <Navbar.Search onSearch={onSearch} />
      </Navbar>,
    );
    await user.click(screen.getByLabelText("Search", { selector: "button" }));
    await user.type(within(await screen.findByRole("dialog")).getByRole("searchbox"), "shoes{Enter}");
    expect(onSearch).toHaveBeenCalledWith("shoes");
    await waitFor(() => expect(screen.queryByRole("dialog")).not.toBeInTheDocument());
    rerender(
      <Navbar>
        <Navbar.Search onSearch={onSearch} closeOnSubmit={false} />
      </Navbar>,
    );
    await user.click(screen.getByLabelText("Search", { selector: "button" }));
    await user.type(within(await screen.findByRole("dialog")).getByRole("searchbox"), "hats{Enter}");
    expect(screen.getByRole("dialog")).toBeInTheDocument();
  });

  it("keeps the bar's field and the sheet's in step when controlled", async () => {
    const user = userEvent.setup();
    function Controlled() {
      const [value, setValue] = useState("");
      return (
        <Navbar>
          <Navbar.Search value={value} onChange={(event) => setValue(event.target.value)} />
        </Navbar>
      );
    }
    render(<Controlled />);
    await user.click(screen.getByLabelText("Search", { selector: "button" }));
    const sheetField = within(await screen.findByRole("dialog")).getByRole("searchbox");
    await user.type(sheetField, "boots");
    expect(sheetField).toHaveValue("boots");
    expect(screen.getAllByRole("searchbox", { hidden: true }).every((field) => (field as HTMLInputElement).value === "boots")).toBe(true);
  });

  it("has no axe violations in the bar or in the sheet", async () => {
    const user = userEvent.setup();
    const { container } = render(
      <Navbar>
        <Navbar.Search collapseBelow="never" />
      </Navbar>,
    );
    expect(await axe(container)).toHaveNoViolations();
    const second = render(
      <Navbar>
        <Navbar.Search />
      </Navbar>,
    );
    await user.click(within(second.container).getByLabelText("Search", { selector: "button" }));
    expect(await axe(await screen.findByRole("dialog"))).toHaveNoViolations();
  });
});

describe("Navbar.Links quiet and the xs size", () => {
  it("marks quiet links, in the bar and in the panel", async () => {
    const user = userEvent.setup();
    render(
      <Navbar>
        <Navbar.Links aria-label="Quiet" quiet>
          <Navbar.Link href="/a">A</Navbar.Link>
        </Navbar.Links>
      </Navbar>,
    );
    expect(screen.getByRole("navigation", { hidden: true })).toHaveClass(styles.quiet!);
    await user.click(screen.getByRole("button", { name: "Menu" }));
    const panel = await screen.findByRole("dialog");
    expect(within(panel).getByRole("navigation")).toHaveClass(styles.quiet!);
  });

  it("draws a bar or a row at the xs step", () => {
    render(<Basic size="xs" />);
    expect(screen.getByRole("banner").firstElementChild).toHaveClass(styles.sizeXs!);
  });
});

describe("Navbar layout options", () => {
  it("draws a row's parts directly, with no columns, when the row has none", () => {
    render(
      <Navbar>
        <Navbar.Row data-testid="row">
          <Navbar.Brand href="/" data-testid="brand">
            dbM
          </Navbar.Brand>
        </Navbar.Row>
      </Navbar>,
    );
    const inner = screen.getByTestId("row").firstElementChild!;
    expect(inner.className).not.toMatch(/columns/);
    expect(screen.getByTestId("brand").parentElement).toBe(inner);
  });
});

describe("Navbar columns", () => {
  function groupsHost(testId: string) {
    return screen.getByTestId(testId).firstElementChild!;
  }

  /** The groups of a row, as the columns they are and what is in each. */
  function groupsOf(testId: string) {
    const inner = screen.getByTestId(testId).firstElementChild!;
    return [...inner.children].map((group) => ({
      start: group.classList.contains(styles.columnStart!),
      center: group.classList.contains(styles.columnCenter!),
      end: group.classList.contains(styles.columnEnd!),
      ids: [...group.children].map((child) => child.getAttribute("data-testid") ?? child.tagName),
    }));
  }

  it("gathers the parts into the column each belongs in, the groups in the order their first part is written", () => {
    render(
      <Navbar>
        <Navbar.Row columns="balanced" data-testid="row">
          <Navbar.Brand href="/" data-testid="brand">
            dbM
          </Navbar.Brand>
          <Navbar.Search data-testid="search" />
          <Navbar.Actions data-testid="actions">
            <Button>Cart</Button>
          </Navbar.Actions>
          <Navbar.MenuButton data-testid="menu" />
        </Navbar.Row>
      </Navbar>,
    );
    const groups = groupsOf("row");
    expect(groups.map((group) => group.center && "center" || group.start && "start" || group.end && "end")).toEqual(["center", "start", "end"]);
    expect(groups[0]!.ids).toEqual(["brand"]);
    // the search landmark is a div around the field; the menu button follows it in the start group
    expect(groups[1]!.ids).toHaveLength(2);
    expect(groups[1]!.ids[1]).toBe("menu");
    expect(groups[2]!.ids).toEqual(["actions"]);
  });

  it("puts the automatic menu button first in the start column, making one if no part belongs there", () => {
    render(
      <Navbar>
        <Navbar.Row columns="balanced" data-testid="row">
          <Navbar.Brand href="/" data-testid="brand">
            dbM
          </Navbar.Brand>
          <Navbar.Links>
            <Navbar.Link href="/a">A</Navbar.Link>
          </Navbar.Links>
        </Navbar.Row>
      </Navbar>,
    );
    const groups = groupsOf("row");
    // the automatic button is the row's last part, as it is without columns, so the start group made for it comes after the others
    expect(groups.map((group) => group.start)).toEqual([false, true]);
    expect(groups[1]!.ids).toEqual(["BUTTON"]);
    expect(screen.getByRole("button", { name: "Menu", hidden: true }).parentElement).toBe(groupsHost("row").lastElementChild);
  });

  it("puts a part in the column it names, and a part that has none with the part before it", () => {
    render(
      <Navbar>
        <Navbar.Row columns="balanced" data-testid="row">
          <Navbar.Brand href="/" column="start" data-testid="brand">
            dbM
          </Navbar.Brand>
          <Navbar.Actions column="center" data-testid="actions">
            <Button>Cart</Button>
          </Navbar.Actions>
          <>
            <span data-testid="loose">Free</span>
            <Navbar.MenuButton column="end" data-testid="menu" />
          </>
        </Navbar.Row>
      </Navbar>,
    );
    const groups = groupsOf("row");
    expect(groups.map((group) => group.ids)).toEqual([["brand"], ["actions", "loose"], ["menu"]]);
    expect(groups.map((group) => [group.start, group.center, group.end])).toEqual([
      [true, false, false],
      [false, true, false],
      [false, false, true],
    ]);
  });

  it("starts the first part with no column of its own in the start column", () => {
    render(
      <Navbar>
        <Navbar.Row columns="balanced" data-testid="row">
          <span data-testid="loose">Free</span>
        </Navbar.Row>
      </Navbar>,
    );
    expect(groupsOf("row").map((group) => [group.start, group.ids])).toEqual([[true, ["loose"]]]);
  });

  it("applies below the step named, `md` by default", () => {
    const { rerender } = render(
      <Navbar>
        <Navbar.Row columns="balanced" data-testid="row">
          <Navbar.Brand href="/">dbM</Navbar.Brand>
        </Navbar.Row>
      </Navbar>,
    );
    expect(screen.getByTestId("row").firstElementChild).toHaveClass(styles.columnsMd!);
    for (const [step, name] of [
      ["sm", styles.columnsSm],
      ["lg", styles.columnsLg],
      ["xl", styles.columnsXl],
      ["2xl", styles.columns2xl],
      ["3xl", styles.columns3xl],
    ] as const) {
      rerender(
        <Navbar>
          <Navbar.Row columns="balanced" columnsBelow={step} data-testid="row">
            <Navbar.Brand href="/">dbM</Navbar.Brand>
          </Navbar.Row>
        </Navbar>,
      );
      expect(screen.getByTestId("row").firstElementChild).toHaveClass(name!);
    }
  });

  it("takes the widths from a track list, and leaves the stylesheet's own for `balanced`", () => {
    const { rerender } = render(
      <Navbar>
        <Navbar.Row columns="auto 1fr auto" data-testid="row">
          <Navbar.Brand href="/">dbM</Navbar.Brand>
        </Navbar.Row>
      </Navbar>,
    );
    expect((screen.getByTestId("row").firstElementChild as HTMLElement).style.getPropertyValue("--navbar-columns")).toBe("auto 1fr auto");
    rerender(
      <Navbar>
        <Navbar.Row columns="balanced" data-testid="row">
          <Navbar.Brand href="/">dbM</Navbar.Brand>
        </Navbar.Row>
      </Navbar>,
    );
    expect((screen.getByTestId("row").firstElementChild as HTMLElement).style.getPropertyValue("--navbar-columns")).toBe("");
  });

  it("works on a bar's one implicit row only through a Navbar.Row, and keeps `column` off the page's elements", () => {
    render(
      <Navbar>
        <Navbar.Row columns="balanced" data-testid="row">
          <Navbar.Brand href="/" column="end" data-testid="brand">
            dbM
          </Navbar.Brand>
          <Navbar.Actions column="start" data-testid="actions" />
          <Navbar.MenuButton column="center" data-testid="menu" />
          <Navbar.Search column="end" data-testid="search" />
        </Navbar.Row>
      </Navbar>,
    );
    for (const id of ["brand", "actions", "menu"]) {
      expect(screen.getByTestId(id)).not.toHaveAttribute("column");
    }
    expect(screen.getByRole("search").outerHTML).not.toMatch(/column=/);
  });

  it("has no accessibility violations in a row of columns", async () => {
    const { container } = render(
      <Navbar>
        <Navbar.Row columns="balanced">
          <Navbar.Brand href="/">dbM</Navbar.Brand>
          <Navbar.Links>
            <Navbar.Link href="/a">A</Navbar.Link>
          </Navbar.Links>
          <Navbar.Search />
          <Navbar.Actions>
            <Button>Cart</Button>
          </Navbar.Actions>
        </Navbar.Row>
      </Navbar>,
    );
    expect(await axe(container)).toHaveNoViolations();
  });

  it("takes a variant and a size on the menu button, in place of the quiet one and its row's", () => {
    const { rerender } = render(
      <Navbar>
        <Navbar.Row size="lg">
          <Navbar.MenuButton aria-label="Open" />
        </Navbar.Row>
      </Navbar>,
    );
    const plain = screen.getByRole("button", { name: "Open" }).className;
    rerender(
      <Navbar>
        <Navbar.Row size="lg">
          <Navbar.MenuButton aria-label="Open" variant="tertiary" size="sm" />
        </Navbar.Row>
      </Navbar>,
    );
    const styled = screen.getByRole("button", { name: "Open" }).className;
    expect(styled).not.toBe(plain);
    expect(styled).toMatch(/Tertiary/i);
    expect(styled).toMatch(/sizeSm/);
    expect(plain).toMatch(/Ghost/i);
    expect(plain).toMatch(/sizeLg/);
  });

  it("takes a look for the search button it becomes", () => {
    render(
      <Navbar>
        <Navbar.Search buttonVariant="tertiary" size="sm" />
      </Navbar>,
    );
    const button = screen.getByLabelText("Search", { selector: "button" });
    expect(button.className).toMatch(/Tertiary/i);
    expect(button.className).toMatch(/sizeSm/);
  });

  it("takes a colour family for the menu button and the search button", () => {
    render(
      <Navbar>
        <Navbar.Row>
          <Navbar.MenuButton aria-label="Open" tone="neutral" />
          <Navbar.Search buttonTone="neutral" />
        </Navbar.Row>
      </Navbar>,
    );
    expect(screen.getByRole("button", { name: "Open", hidden: true }).className).toMatch(/toneNeutral/);
    expect(screen.getByLabelText("Search", { selector: "button" }).className).toMatch(/toneNeutral/);
  });

  it("leaves the menu button and the search button brand-coloured unless told", () => {
    render(
      <Navbar>
        <Navbar.Row>
          <Navbar.MenuButton aria-label="Open" />
          <Navbar.Search />
        </Navbar.Row>
      </Navbar>,
    );
    expect(screen.getByRole("button", { name: "Open", hidden: true }).className).not.toMatch(/toneNeutral/);
    expect(screen.getByLabelText("Search", { selector: "button" }).className).not.toMatch(/toneNeutral/);
  });

  it("takes a size for the search button apart from the field's", () => {
    render(
      <Navbar>
        <Navbar.Search size="sm" buttonSize="lg" />
      </Navbar>,
    );
    expect(screen.getByLabelText("Search", { selector: "button" }).className).toMatch(/sizeLg/);
    expect(screen.getByRole("searchbox", { hidden: true }).parentElement!.className).toMatch(/sizeSm/);
  });

  it("draws the search sheet with a small heading and a medium field", async () => {
    const user = userEvent.setup();
    render(
      <Navbar>
        <Navbar.Search />
      </Navbar>,
    );
    await user.click(screen.getByLabelText("Search", { selector: "button" }));
    const sheet = await screen.findByRole("dialog", { name: "Search" });
    expect(within(sheet).getByRole("heading", { name: "Search" }).className).toMatch(/Lg/);
    expect(within(sheet).getByRole("searchbox").parentElement!.className).toMatch(/sizeMd/);
  });

  it("lets a style on the links set the text of every link in them", () => {
    render(
      <Navbar collapseBelow="never">
        <Navbar.Links aria-label="Shop" style={{ textTransform: "uppercase", fontWeight: 600 }}>
          <Navbar.Link href="/a">A</Navbar.Link>
        </Navbar.Links>
      </Navbar>,
    );
    expect(screen.getByRole("navigation")).toHaveStyle({ textTransform: "uppercase", fontWeight: "600" });
  });

  it("draws a bar with no current link when none is marked", () => {
    render(
      <Navbar collapseBelow="never">
        <Navbar.Links>
          <Navbar.Link href="/a">A</Navbar.Link>
          <Navbar.Link href="/b">B</Navbar.Link>
        </Navbar.Links>
      </Navbar>,
    );
    expect(document.querySelector('[aria-current="page"]')).toBeNull();
  });
});

// A second row of links: a set that scrolls (`scroll`), a look of its own for a set, and a row at the end that scrolls away (ADR-0187).
describe("a second row of links", () => {
  const stubObserver = () => vi.stubGlobal("IntersectionObserver", class { observe() {} unobserve() {} disconnect() {} takeRecords() { return []; } });

  function WithSections(props: Partial<React.ComponentProps<typeof Navbar>> & { scroll?: boolean; sectionsProps?: Partial<React.ComponentProps<typeof Navbar.Links>> }) {
    const { scroll = true, sectionsProps, ...bar } = props;
    return (
      <Navbar {...bar}>
        <Navbar.Row>
          <Navbar.Brand href="/">Acme</Navbar.Brand>
          <Navbar.Links aria-label="Main">
            <Navbar.Link href="/a" current>
              Products
            </Navbar.Link>
            <Navbar.Link href="/b">Pricing</Navbar.Link>
          </Navbar.Links>
        </Navbar.Row>
        <Navbar.Row sticky={false} variant="filled" data-testid="second">
          <Navbar.Links aria-label="Sections" scroll={scroll} {...sectionsProps}>
            <Navbar.Link href="/s1" current>
              Overview
            </Navbar.Link>
            <Navbar.Link href="/s2">Activity</Navbar.Link>
          </Navbar.Links>
        </Navbar.Row>
      </Navbar>
    );
  }

  afterEach(() => vi.stubGlobal("IntersectionObserver", undefined));

  describe("scroll", () => {
    it("marks the set and its scroller, and leaves a plain set as it was", () => {
      render(<WithSections />);
      const sections = screen.getByRole("navigation", { name: "Sections" });
      expect(sections).toHaveAttribute("data-scroll");
      expect(sections).toHaveClass(styles.scrollLinks!);
      expect(sections.querySelector(`.${styles.scroller}`)).not.toBeNull();
      // The plain set is hidden below the step in jsdom (no media query matches), so it is read by its attribute.
      const main = document.querySelector<HTMLElement>("nav[aria-label='Main']") as HTMLElement;
      expect(main).not.toHaveAttribute("data-scroll");
      expect(main).not.toHaveClass(styles.scrollLinks!);
      expect(main.querySelector(`.${styles.scroller}`)).toBeNull();
    });

    it("is not copied into the menu panel, which holds the plain set's links only", async () => {
      render(<WithSections defaultMenuOpen />);
      const dialog = await screen.findByRole("dialog");
      expect(within(dialog).getByRole("link", { name: "Products" })).toBeInTheDocument();
      expect(within(dialog).queryByRole("link", { name: "Overview" })).not.toBeInTheDocument();
      expect(within(dialog).queryByRole("navigation", { name: "Sections" })).not.toBeInTheDocument();
    });

    it("keeps the same links in the panel for a set that does not scroll", async () => {
      render(<WithSections defaultMenuOpen scroll={false} />);
      const dialog = await screen.findByRole("dialog");
      expect(within(dialog).getByRole("link", { name: "Overview" })).toBeInTheDocument();
    });

    it("draws no menu button and no panel for a bar whose only links scroll", () => {
      render(
        <Navbar>
          <Navbar.Brand href="/">Acme</Navbar.Brand>
          <Navbar.Links aria-label="Sections" scroll>
            <Navbar.Link href="/s1">Overview</Navbar.Link>
          </Navbar.Links>
        </Navbar>,
      );
      expect(screen.queryByRole("button", { name: "Menu", ...inline })).not.toBeInTheDocument();
      expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    });

    it("keeps its links as a named list with the current one marked, and has no accessibility violations", async () => {
      const { container } = render(<WithSections collapseBelow="never" />);
      const sections = screen.getByRole("navigation", { name: "Sections" });
      expect(within(sections).getByRole("list")).toBeInTheDocument();
      expect(within(sections).getByRole("link", { name: "Overview" })).toHaveAttribute("aria-current", "page");
      expect(await axe(container)).toHaveNoViolations();
    });

    it("warns, in development, about a group in a scrolling set", () => {
      const warn = vi.spyOn(console, "warn").mockImplementation(() => undefined);
      render(
        <Navbar>
          <Navbar.Links aria-label="Sections" scroll>
            <Navbar.Group label="More">
              <Navbar.Link href="/x">X</Navbar.Link>
            </Navbar.Group>
          </Navbar.Links>
        </Navbar>,
      );
      expect(warn.mock.calls.some((call) => String(call[0]).includes("`Navbar.Group` in `Navbar.Links` with `scroll`"))).toBe(true);
      warn.mockRestore();
    });
  });

  describe("a look of its own for a set", () => {
    it("marks a set's current link with its own variant and rounds its links, beside the bar's look", () => {
      render(<WithSections collapseBelow="never" currentVariant="underline" sectionsProps={{ currentVariant: "subtle", rounded: true }} />);
      const main = within(screen.getByRole("navigation", { name: "Main" })).getByRole("link", { name: "Products" });
      const sections = within(screen.getByRole("navigation", { name: "Sections" })).getByRole("link", { name: "Overview" });
      expect(main).toHaveClass(styles.currentUnderline!);
      expect(main).not.toHaveClass(styles.rounded!);
      expect(sections).toHaveClass(styles.current!);
      expect(sections).not.toHaveClass(styles.currentUnderline!);
      expect(sections).toHaveClass(styles.rounded!);
    });

    it("takes the bar's look when it sets none", () => {
      render(<WithSections collapseBelow="never" currentVariant="solid" rounded />);
      const sections = within(screen.getByRole("navigation", { name: "Sections" })).getByRole("link", { name: "Overview" });
      expect(sections).toHaveClass(styles.currentSolid!);
      expect(sections).toHaveClass(styles.rounded!);
    });

    it("leaves the menu panel's copy of a set with the bar's look", async () => {
      render(<WithSections defaultMenuOpen scroll={false} currentVariant="underline" sectionsProps={{ currentVariant: "solid", rounded: true }} />);
      const dialog = await screen.findByRole("dialog");
      const copy = within(dialog).getByRole("link", { name: "Overview" });
      expect(copy).not.toHaveClass(styles.currentSolid!);
      expect(copy).not.toHaveClass(styles.rounded!);
    });
  });

  describe("a row at the end that scrolls away", () => {
    it("is drawn after the header, outside the banner, in a wrapper of its own, with one banner on the page", () => {
      stubObserver();
      render(<WithSections sticky />);
      expect(screen.getAllByRole("banner")).toHaveLength(1);
      const banner = screen.getByRole("banner");
      const second = screen.getByTestId("second");
      expect(banner.contains(second)).toBe(false);
      const wrapper = second.closest("[data-navbar-trailing]") as HTMLElement;
      expect(wrapper).not.toBeNull();
      expect(wrapper.previousElementSibling).toBe(banner.closest("[data-stuck], header") ?? banner);
      expect(banner).toHaveTextContent("Acme");
      expect(banner).not.toHaveTextContent("Overview");
    });

    it("keeps the wrapper in the bar's collapse step and direction", () => {
      stubObserver();
      render(<WithSections sticky collapseBelow="lg" dir="rtl" />);
      const wrapper = screen.getByTestId("second").closest("[data-navbar-trailing]") as HTMLElement;
      expect(wrapper).toHaveClass(styles.collapseLg!);
      expect(wrapper).toHaveAttribute("dir", "rtl");
    });

    it("stays in the header when the bar does not stick, since the whole bar scrolls then", () => {
      render(<WithSections />);
      expect(screen.getByRole("banner").contains(screen.getByTestId("second"))).toBe(true);
      expect(document.querySelector("[data-navbar-trailing]")).toBeNull();
    });

    it("puts the bar's className, style, ref and data-testid on the header alone", () => {
      stubObserver();
      const ref = createRef<HTMLElement>();
      render(<WithSections sticky ref={ref} className="bar" data-testid="bar" />);
      expect(ref.current?.tagName).toBe("HEADER");
      expect(screen.getByTestId("bar")).toBe(ref.current);
      expect(screen.getByTestId("bar")).toHaveClass("bar");
      expect(document.querySelector("[data-navbar-trailing]")).not.toHaveClass("bar");
    });
  });
});
