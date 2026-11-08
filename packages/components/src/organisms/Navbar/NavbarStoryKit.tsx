import { BellIcon, BookOpenIcon, ShoppingCartIcon, UserCircleIcon } from "@dbm-system/icons";
import { useState } from "react";
import type { MouseEvent, ReactNode, RefObject } from "react";
import { Button } from "../../atoms/Button";
import type { ButtonTone } from "../../atoms/Button";
import { IconButton } from "../../atoms/IconButton";
import { Text } from "../../atoms/Text";
import { SearchInput } from "../../molecules/SearchInput";
import { Menu } from "../Menu";
import { Navbar } from "./Navbar";
import type { NavbarProps, NavbarSize } from "./Navbar.types";

export { DrawerStage as NavbarStage, DrawerViewModeContext as NavbarViewModeContext } from "../Drawer/DrawerStoryKit";

/** Stops a demo link from navigating: a story's link goes nowhere, so it must not load another page. */
export function preventNavigation(event: MouseEvent) {
  event.preventDefault();
}

/**
 * What a demo bar's links share so that choosing one moves the "current" mark to it instead of leaving the page, the way a
 * router would: each link is `current` while it is the chosen one, and a click records it and keeps the browser where it is.
 */
export function useDemoCurrent(initial: string) {
  const [chosen, setChosen] = useState(initial);
  const anchor = (id: string) => ({
    href: `#${id}`,
    onClick: (event: MouseEvent) => {
      event.preventDefault();
      setChosen(id);
    },
  });
  return {
    isCurrent: (id: string) => chosen === id,
    /** The props of a `Navbar.Link`. */
    link: (id: string) => ({ ...anchor(id), current: chosen === id }),
    /** The props of an `<a>` a `Navbar.Link asChild` draws on, which has no `current` of its own. */
    anchor,
  };
}

/** The bar every gallery story draws, so the stories differ only in what they set on it. */
export function DemoNavbar({
  menuContainer,
  actions = "button",
  withGroup = false,
  skipLink = false,
  extras = false,
  pricingBadge = "New",
  linksAlign,
  linksLabel,
  ...props
}: NavbarProps & {
  /**
   * What the end of the bar holds: one button, a search field and an account menu, or (`"responsive"`) a button that leaves
   * the bar below the widest step and comes back at the foot of the menu panel.
   */
  actions?: "button" | "rich" | "responsive" | "none";
  /** Puts a skip link first in the bar. */
  skipLink?: boolean;
  /** Gives the links an icon, a count and an external destination, to show those. */
  extras?: boolean;
  /** What the Pricing link shows as its badge with `extras`; "New" (the link's own solid brand badge) unless a story passes a `Badge`. */
  pricingBadge?: ReactNode;
  /** Where the links sit between the brand and the actions. */
  linksAlign?: "start" | "center" | "end";
  /** Adds a "Resources" group of links after the plain ones: a dropdown in the bar, an expandable group in the panel. */
  withGroup?: boolean;
  /** Names this bar's navigation, for a gallery of several bars where the default name would repeat. */
  linksLabel?: string;
}) {
  const demo = useDemoCurrent("products");
  return (
    <Navbar menuContainer={menuContainer} {...props}>
      {skipLink && <Navbar.SkipLink href="#main" onClick={preventNavigation} />}
      <Navbar.Brand href="#" onClick={preventNavigation}>
        dbM
      </Navbar.Brand>
      <Navbar.Links aria-label={linksLabel} align={linksAlign}>
        <Navbar.Link {...demo.link("products")}>Products</Navbar.Link>
        <Navbar.Link {...demo.link("pricing")} badge={extras ? pricingBadge : undefined}>
          Pricing
        </Navbar.Link>
        <Navbar.Link {...demo.link("docs")} icon={extras ? BookOpenIcon : undefined}>
          Docs
        </Navbar.Link>
        {extras && (
          <>
            <Navbar.Link {...demo.link("inbox")} icon={BellIcon} badge="3">
              Inbox
            </Navbar.Link>
            <Navbar.Link href="https://example.com" onClick={preventNavigation}>
              Status
            </Navbar.Link>
          </>
        )}
        <Navbar.Link href="#beta" disabled>
          Beta
        </Navbar.Link>
        {withGroup && (
          <Navbar.Group label="Resources" current={["blog", "guides", "changelog"].some(demo.isCurrent)}>
            <Navbar.Link {...demo.link("blog")}>Blog</Navbar.Link>
            <Navbar.Link {...demo.link("guides")}>Guides</Navbar.Link>
            <Navbar.Link {...demo.link("changelog")}>Changelog</Navbar.Link>
          </Navbar.Group>
        )}
      </Navbar.Links>
      {actions === "button" && (
        <Navbar.Actions>
          <Button>Sign in</Button>
        </Navbar.Actions>
      )}
      {actions === "responsive" && (
        <Navbar.Actions>
          <Navbar.Action>
            <SearchInput aria-label="Search" size="sm" />
          </Navbar.Action>
          <Navbar.Action hideBelow="3xl">
            <Button size="sm">Sign in</Button>
          </Navbar.Action>
        </Navbar.Actions>
      )}
      {/* the bar looks for the panel actions among its children and rows to draw the panel's footer, so keep it out of another component */}
      {actions === "responsive" && (
        <Navbar.PanelActions>
          <Button>Sign in</Button>
        </Navbar.PanelActions>
      )}
      {actions === "rich" && (
        <Navbar.Actions>
          <SearchInput aria-label="Search" size="sm" />
          <Menu>
            <Menu.Trigger asChild>
              <IconButton icon={UserCircleIcon} aria-label="Account" variant="ghost" size="md" />
            </Menu.Trigger>
            <Menu.Content>
              <Menu.Item>Profile</Menu.Item>
              <Menu.Item>Sign out</Menu.Item>
            </Menu.Content>
          </Menu>
        </Navbar.Actions>
      )}
    </Navbar>
  );
}

/**
 * One bar of a gallery of several. A page has one banner landmark, so each bar sits in a named `<section>`, which makes its
 * `<header>` an ordinary region and not a second banner (the rule `Navbar`'s Docs page gives for a page with more than one).
 */
export function GalleryBar({ name, children }: { name: string; children: ReactNode }) {
  return <section aria-label={name}>{children}</section>;
}

/**
 * Two rows drawn in columns: unequal sides (a search button at the start, two buttons at the end) with `balanced` columns, so the logo is still
 * central; and a track list of the author's with the brand and the field each put in a column of their own. Both apply below the widest step, so
 * they are in columns on any window narrower than 1920px.
 */
export function DemoColumnsBars({ menuContainer }: { menuContainer?: HTMLElement | null }) {
  return (
    <div style={{ inlineSize: "100%", display: "grid", gap: "var(--dbm-space-4)", alignSelf: "start" }}>
      <GalleryBar name="Balanced columns">
        <Navbar menuContainer={menuContainer}>
          <Navbar.Row columns="balanced" columnsBelow="3xl">
            <Navbar.Brand href="#" onClick={preventNavigation}>
              dbM
            </Navbar.Brand>
            <Navbar.Search aria-label="Search products" size="sm" buttonVariant="tertiary" buttonSize="md" collapseBelow="3xl" />
            <Navbar.Actions>
              <IconButton icon={UserCircleIcon} aria-label="Account" variant="tertiary" size="md" />
              <IconButton icon={ShoppingCartIcon} aria-label="Cart, 2 items" variant="tertiary" size="md" />
            </Navbar.Actions>
          </Navbar.Row>
        </Navbar>
      </GalleryBar>
      <GalleryBar name="Columns of your own widths">
        <Navbar menuContainer={menuContainer}>
          <Navbar.Row columns="auto 1fr auto" columnsBelow="3xl">
            <Navbar.Brand href="#" column="start" onClick={preventNavigation}>
              dbM
            </Navbar.Brand>
            <Navbar.Search aria-label="Search help" column="center" size="sm" collapseBelow="never" />
            <Navbar.Actions>
              <IconButton icon={UserCircleIcon} aria-label="Help account" variant="tertiary" size="md" />
            </Navbar.Actions>
          </Navbar.Row>
        </Navbar>
      </GalleryBar>
    </div>
  );
}

/** What a story of the rows demo sets, beyond the bar's own props. Each story passes its own, so none changes another. */
export interface DemoRowsOptions {
  /** Where the search field gives way to a button, as `Navbar.Search`'s `collapseBelow`. */
  searchCollapseBelow?: "sm" | "md" | "lg" | "xl" | "2xl" | "3xl" | "never";
  /** The colour family of the icon buttons (the menu, search, account and cart buttons). @default 'neutral' */
  iconTone?: ButtonTone;
  /** A caption under the account and cart buttons, from the width the bar leaves its columns at. @default true */
  labels?: boolean;
  /** The courtesy strip, the first row. @default true */
  courtesyRow?: boolean;
  /** The row of primary links, the third. @default true */
  primaryRow?: boolean;
  /** Draws the search as a button last in the same group as the account and cart buttons, instead of between the logo and them. @default false */
  searchWithActions?: boolean;
  /** The logo row's `columns` below the collapse width. `"balanced"` keeps the logo central; a track list gives the buttons the room they need. @default 'balanced' */
  columns?: string;
  /** The height step of the logo row. @default 'lg' */
  rowSize?: NavbarSize;
  /** Puts the primary links in the logo row, centred between the logo and the buttons, instead of in a row of their own (use with `primaryRow={false}`). @default false */
  linksInLogoRow?: boolean;
  /** Marks a primary link current when it is clicked, as a router would on moving between pages; with this off none is current, as on a home page. @default false */
  navigable?: boolean;
}

/**
 * A multi-row header, laid out the way a shop's is: a thin courtesy strip (which scrolls away when the bar is sticky); a taller row with the
 * logo, a small search field centred between them and the brand and medium icon buttons with a caption under each on a wide window, which on
 * a phone (`columns`) puts the menu button and the search button at the start, the logo in the centre and the other buttons at the end; and a
 * smaller row of primary links, centred, in bold capitals, with none marked current to begin with (the visitor is on the home page); with `navigable` the one clicked becomes current.
 * The sets of links are named so each landmark has its own name. The options let a story show a variation of it without changing the others.
 */
/**
 * A bar with a second row of links under it: the main links in the bar's own look (an underline) and the project's sections in a row of their own, round
 * and subtle, that stays in the bar at every width and scrolls sideways when it does not fit, and scrolls away with the page while the bar sticks.
 */
export function DemoSectionsNavbar({ menuContainer, ...props }: NavbarProps) {
  const main = useDemoCurrent("projects");
  const sections = useDemoCurrent("overview");
  return (
    <Navbar menuContainer={menuContainer} {...props}>
      <Navbar.Row>
        <Navbar.Brand href="#" onClick={preventNavigation}>
          dbM
        </Navbar.Brand>
        <Navbar.Links aria-label="Main">
          <Navbar.Link {...main.link("projects")}>Projects</Navbar.Link>
          <Navbar.Link {...main.link("reports")}>Reports</Navbar.Link>
          <Navbar.Link {...main.link("team")}>Team</Navbar.Link>
        </Navbar.Links>
      </Navbar.Row>
      <Navbar.Row size="sm" variant="filled" sticky={false}>
        <Navbar.Links aria-label="Project sections" scroll rounded currentVariant="subtle" align="center">
          <Navbar.Link {...sections.link("overview")}>Overview</Navbar.Link>
          <Navbar.Link {...sections.link("activity")}>Activity</Navbar.Link>
          <Navbar.Link {...sections.link("members")}>Members</Navbar.Link>
          <Navbar.Link {...sections.link("billing")}>Billing</Navbar.Link>
          <Navbar.Link {...sections.link("settings")}>Project settings</Navbar.Link>
        </Navbar.Links>
      </Navbar.Row>
    </Navbar>
  );
}

export function DemoRowsNavbar({
  menuContainer,
  searchCollapseBelow,
  collapseBelow = "md",
  iconTone = "neutral",
  labels = true,
  courtesyRow = true,
  primaryRow = true,
  searchWithActions = false,
  linksInLogoRow = false,
  rowSize = "lg",
  columns = "balanced",
  navigable = false,
  ...props
}: NavbarProps & DemoRowsOptions) {
  const demo = useDemoCurrent(linksInLogoRow ? "products" : "");
  // A primary link goes nowhere. With `navigable` the one clicked is current, as if each link were another page.
  const primary = (id: string) => (navigable ? demo.link(id) : { href: `#${id}`, onClick: preventNavigation });
  // A caption under the account and cart buttons from the width the bar leaves its columns at, and always when it never does
  const showLabelFrom = collapseBelow === "never" ? undefined : collapseBelow;
  // The links in the logo row are the default demo links, with Products the current page until another is chosen
  const categories = (
    <Navbar.Links align="center">
      <Navbar.Link {...primary("products")}>Products</Navbar.Link>
      <Navbar.Link {...primary("pricing")}>Pricing</Navbar.Link>
      <Navbar.Link {...primary("docs")}>Docs</Navbar.Link>
      <Navbar.Link href="#beta" disabled>
        Beta
      </Navbar.Link>
    </Navbar.Links>
  );
  const search = (
    <Navbar.Search
      size="sm"
      buttonVariant="tertiary"
      buttonTone={iconTone}
      buttonSize="md"
      collapseBelow={searchCollapseBelow}
      placeholder="Search products"
      // The field is centred in the room between the logo and the buttons by an auto margin; grouped with the buttons it is one of them
      style={searchWithActions ? { flex: "none" } : { marginInline: "auto" }}
    />
  );
  return (
    <Navbar menuContainer={menuContainer} collapseBelow={collapseBelow} {...props}>
      {courtesyRow && (
        <Navbar.Row size="xs" variant="outlined" sticky={false}>
          <Navbar.Links aria-label="Help" quiet align="end">
            <Navbar.Link href="#help" onClick={preventNavigation}>
              Help
            </Navbar.Link>
            <Navbar.Link href="#orders" onClick={preventNavigation}>
              Track an order
            </Navbar.Link>
            <Navbar.Link href="#stores" onClick={preventNavigation}>
              Find a store
            </Navbar.Link>
          </Navbar.Links>
        </Navbar.Row>
      )}
      <Navbar.Row
        size={rowSize}
        variant="outlined"
        columns={collapseBelow === "never" ? undefined : columns}
        columnsBelow={collapseBelow === "never" ? undefined : collapseBelow}
      >
        <Navbar.Brand href="#" onClick={preventNavigation}>
          dbM
        </Navbar.Brand>
        {linksInLogoRow && categories}
        {!searchWithActions && search}
        <Navbar.Actions style={{ marginInlineStart: searchWithActions ? undefined : 0 }}>
          <IconButton icon={UserCircleIcon} aria-label="Account" label={labels ? "Account" : undefined} hideLabelBelow={showLabelFrom} variant="tertiary" tone={iconTone} size="md" />
          <IconButton icon={ShoppingCartIcon} aria-label="Cart, 2 items" label={labels ? "Cart" : undefined} hideLabelBelow={showLabelFrom} variant="tertiary" tone={iconTone} size="md" />
          {searchWithActions && search}
        </Navbar.Actions>
        {(courtesyRow || primaryRow || linksInLogoRow) && <Navbar.MenuButton variant="tertiary" tone={iconTone} size="md" />}
      </Navbar.Row>
      {primaryRow && (
        <Navbar.Row size="sm" variant="outlined">
          <Navbar.Links
            aria-label="Categories"
            align="center"
            style={{ fontWeight: "var(--dbm-font-weight-bold)", textTransform: "uppercase" }}
          >
            <Navbar.Link {...primary("women")}>Women</Navbar.Link>
            <Navbar.Link {...primary("men")}>Men</Navbar.Link>
            <Navbar.Link {...primary("kids")}>Kids</Navbar.Link>
            <Navbar.Link {...primary("sale")}>Sale</Navbar.Link>
          </Navbar.Links>
        </Navbar.Row>
      )}
    </Navbar>
  );
}

/** The router-link bar: plain anchors stand in for a router's link, and choosing one moves the current mark. */
export function RouterDemoNavbar({ menuContainer }: { menuContainer?: HTMLElement | null }) {
  const demo = useDemoCurrent("products");
  return (
    <Navbar menuContainer={menuContainer}>
      <Navbar.Brand asChild>
        <a href="#home" onClick={preventNavigation}>
          dbM
        </a>
      </Navbar.Brand>
      <Navbar.Links>
        <Navbar.Link asChild current={demo.isCurrent("products")}>
          <a {...demo.anchor("products")}>Products</a>
        </Navbar.Link>
        <Navbar.Link asChild current={demo.isCurrent("pricing")}>
          <a {...demo.anchor("pricing")}>Pricing</a>
        </Navbar.Link>
      </Navbar.Links>
    </Navbar>
  );
}

/** A scrolling box under a sticky bar, to see it stick: the bar names the box with `scrollContainerRef`. */
export function StickyDemo({
  boxRef,
  hero = false,
  tinted = false,
  children,
}: {
  boxRef: RefObject<HTMLDivElement | null>;
  /** Puts a tinted hero block behind the bar's starting place, to show a transparent bar over something. */
  hero?: boolean;
  /** Tints the page's content (the paragraphs below the bar) in `bg.brand-subtle`, instead of leaving it on the plain page. */
  tinted?: boolean;
  children: (ref: RefObject<HTMLDivElement | null>) => ReactNode;
}) {
  return (
    <div
      ref={boxRef}
      style={{
        blockSize: "20rem",
        overflow: "auto",
        border: "var(--dbm-border-width-1) dashed var(--dbm-border-default)",
        borderRadius: "var(--dbm-radius-lg)",
      }}
    >
      {children(boxRef)}
      {hero && (
        <div
          style={{
            blockSize: "10rem",
            marginBlockStart: "calc(-1 * var(--dbm-space-16))",
            paddingBlockStart: "var(--dbm-space-16)",
            background: "var(--dbm-bg-brand-subtle)",
          }}
        />
      )}
      <div style={{ padding: "var(--dbm-space-6)", display: "grid", gap: "var(--dbm-space-4)", background: tinted ? "var(--dbm-bg-brand-subtle)" : undefined }}>
        {Array.from({ length: 12 }, (_, index) => (
          <Text key={index}>
            Scroll this box. The bar above stays at its top, and gains a shadow once the page has moved under it (paragraph{" "}
            {index + 1}).
          </Text>
        ))}
      </div>
    </div>
  );
}
