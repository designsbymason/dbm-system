import type { Breakpoint, SpaceValue } from "@dbm-system/utils";
import type { Icon as PhosphorIcon } from "@dbm-system/icons";
import type {
  AnchorHTMLAttributes,
  ComponentPropsWithoutRef,
  CSSProperties,
  HTMLAttributes,
  ReactNode,
  RefObject,
} from "react";
import type { ButtonSize, ButtonTone, ButtonVariant } from "../../atoms/Button";
import type { DrawerOpenChangeDetails, DrawerSide } from "../Drawer";
import type { SearchInputProps } from "../../molecules/SearchInput";
import type { MenuAlign } from "../Menu";

/**
 * A row's height step: its block size is the height of an `IconButton` of the same step plus a little room, at least. `xs` is a thin
 * strip above the bar (a courtesy or notice row): the smallest target (24px) plus room, a little under an `xs` `IconButton`, which a
 * row of that step still grows to hold.
 */
export type NavbarSize = "xs" | "sm" | "md" | "lg";

/** The size of a link in the bar, on the same five steps as `Menu`'s `size`. */
export type NavbarLinkSize = "xs" | "sm" | "md" | "lg" | "xl";

/**
 * How the bar itself is drawn: `outlined` (a surface with a line under it), `filled` (the same surface with no line), `ghost`
 * (nothing of its own, the content sits on the page) or `frosted` (a translucent surface that blurs what is behind it, with a
 * line under it). `outlined`, `filled` and `ghost` are the names `Card` and `EmptyState` use for their `variant`.
 *
 * The fill is drawn by each `Navbar.Row`, not by the `<header>`, so there is no prop for a different colour: put a `style` on the
 * row (`style={{ backgroundColor: "var(--dbm-bg-brand-subtle)" }}`, on a token, since an inline style beats the variant's class), or
 * on the bar itself with `variant="ghost"`, whose rows are transparent. The text colours are checked against the standard
 * surfaces, so check the contrast of a different fill.
 */
export type NavbarVariant = "outlined" | "filled" | "ghost" | "frosted";

/**
 * How the current page's link (and a group that holds it) is marked, beyond `aria-current="page"`, which is always set:
 * `underline` (a brand line under the link, along the start edge of a link in the phone panel), `subtle` (a tinted pill with
 * brand-coloured text) or `solid` (a brand fill with the text on it). The same names `Tabs` uses for its variants.
 */
export type NavbarCurrentVariant = "subtle" | "underline" | "solid";

/**
 * The width below which the primary links leave the bar for a menu button: a breakpoint step (`"md"` is 768px), or
 * `"never"` to keep the links in the bar at every width. `"base"` is not an option, since it would mean never.
 */
export type NavbarCollapseBelow = Exclude<Breakpoint, "base"> | "never";

/** The reading direction. Not read from the page: pass `"rtl"` on a right-to-left page. */
export type NavbarDirection = "ltr" | "rtl";

/** What closed (or opened) the phone menu — the same reasons `Drawer` reports. */
export type NavbarMenuChangeDetails = DrawerOpenChangeDetails;

/** The text `Navbar` supplies itself, translatable through the `labels` prop. Nothing here needs a number. */
export interface NavbarLabels {
  /** The accessible name of the menu button, and the title of the menu that opens. @default 'Menu' */
  menu: string;
  /** The name of the `<nav>` that holds the primary links, when `Navbar.Links` is not given an `aria-label`. @default 'Main' */
  navigation: string;
  /** The accessible name of the menu panel's close button. @default 'Close' */
  close: string;
  /** The text of `Navbar.SkipLink` when it is given no children. @default 'Skip to content' */
  skipLink: string;
  /** Read out after an external `Navbar.Link`'s text, in place of a visible cue. @default '(opens in a new tab)' */
  externalLink: string;
  /** The name of `Navbar.Search`'s field (and, on a phone, of its button and sheet) when it is given no `aria-label`. @default 'Search' */
  search: string;
}

export interface NavbarProps extends Omit<ComponentPropsWithoutRef<"header">, "dir" | "children"> {
  /**
   * The bar's contents, in reading order: either the parts directly (`Navbar.SkipLink` first if there is one, then `Navbar.Brand`,
   * `Navbar.Links`, `Navbar.Search`, `Navbar.Actions`), which are drawn as one row, or one or more `Navbar.Row`s holding them. The
   * bar also looks for `Navbar.Links`, `Navbar.PanelActions` and `Navbar.MenuButton` (directly, in a fragment, or in a row) to draw
   * the menu panel and its button; one wrapped in any other component still draws, but isn't noticed. Don't mix loose parts and
   * rows: a development warning says so.
   */
  children?: ReactNode;
  /**
   * How the bar is drawn — see {@link NavbarVariant}.
   * @default 'outlined'
   */
  variant?: NavbarVariant;
  /**
   * How the current page's link is marked — see {@link NavbarCurrentVariant}. One look for the whole bar, the phone panel
   * included, and not overridable per link. The marker is only the look: `aria-current="page"` is set whichever it is.
   * @default 'underline'
   */
  currentVariant?: NavbarCurrentVariant;
  /**
   * Fully rounded links: each link and group button is a pill, with the current link's tint or fill following the shape. The
   * same prop, with the same name and meaning, as `Button`, `IconButton` and `Toolbar`. It is the links that round, not the bar.
   * @default false
   */
  rounded?: boolean;
  /**
   * The bar's height, on a four-step scale. Each step is as tall as an `IconButton` of the same step plus room above and
   * below, so a button in the bar never touches its edges. It is also the default size of the links (see `linkSize`), of the menu
   * button and the search button, and of any `Button` or `IconButton` in `Navbar.Actions` that sets none.
   * @default 'md'
   */
  size?: NavbarSize;
  /**
   * The text size, icon size and padding of the links in the bar's rows, on the same five steps as `Menu`'s `size`, apart from the
   * bar's `size` (the height). Left out, it follows `size` (`xs` reads `xs`, `sm` reads `sm`, `md` reads `md`, `lg` reads `lg`), so a
   * taller bar has larger links. A `quiet` set reads one step below its size, never under `xs`. A group's dropdown takes the same
   * step for its items when one is set. The menu panel's links keep their own size.
   */
  linkSize?: NavbarLinkSize;
  /**
   * Keeps the content to the page's reading width with `Container`, centred, instead of running edge to edge.
   * @default false
   */
  contained?: boolean;
  /**
   * The width below which `Navbar.Links` leaves the bar and is offered in a menu behind a button — see
   * {@link NavbarCollapseBelow}. The choice is a stylesheet's, not JavaScript's, so the first paint on a server-rendered
   * page is already right.
   * @default 'md'
   */
  collapseBelow?: NavbarCollapseBelow;
  /**
   * Which edge the phone menu slides in from. `"start"` and `"end"` are logical, so they swap in right-to-left text.
   * @default 'start'
   */
  menuSide?: DrawerSide;
  /**
   * Closes the phone menu when a link in it is chosen, which is what a single-page app that doesn't reload needs. Turn it
   * off for a menu whose links open a submenu or stay put.
   * @default true
   */
  closeMenuOnNavigate?: boolean;
  /** The controlled open state of the phone menu. Omit (with `defaultMenuOpen`) to let the bar manage it. */
  menuOpen?: boolean;
  /**
   * The initial open state of the phone menu for uncontrolled usage — ignored once `menuOpen` is provided.
   * @default false
   */
  defaultMenuOpen?: boolean;
  /**
   * Called with the new open state of the phone menu whenever it changes, with the reason (a press on the button, Escape,
   * the scrim, the close button, or a link chosen).
   */
  onMenuOpenChange?: (open: boolean, details: NavbarMenuChangeDetails) => void;
  /**
   * Called with `true` once the menu panel has finished opening (its entrance is over) and with `false` once it has finished
   * closing and is out of the page. `onMenuOpenChange` says a change *started*; this says it is *over*: the place to collapse a
   * group or clear a field in the panel without guessing the animation's length.
   */
  onMenuOpenChangeComplete?: (open: boolean) => void;
  /**
   * The element the bar's overlays are drawn into instead of the end of `document.body`: the menu panel with its scrim, and the
   * floating menu of a `Navbar.Group`. For a shadow root, or a frame that should hold them. Leave it out for the usual page.
   */
  menuContainer?: HTMLElement | null;
  /**
   * Keeps the bar at the top of the page (or of `scrollContainerRef`) as the reader scrolls, with a surface behind it
   * and a shadow while it is stuck. Built on `Affix`, the same as `Toolbar`'s and `Alert`'s `sticky`.
   * @default false
   */
  sticky?: boolean;
  /**
   * Hides a sticky bar while the reader scrolls down, and brings it back as soon as they scroll up or are near the top, so it
   * costs no room while reading. It stays shown while anything in it has keyboard focus, so a keyboard user never loses it.
   * Needs `sticky`; without it a development warning says so and nothing happens.
   * @default false
   */
  hideOnScroll?: boolean;
  /**
   * How far from the top a sticky bar sticks, from the spacing token scale — for a page with a banner above it that is
   * also sticky. Has no effect without `sticky`.
   * @default 0
   */
  stickyOffset?: SpaceValue;
  /**
   * The scrollable container a sticky bar sticks within, if it isn't the page itself. Has no effect without `sticky`.
   * The same prop `Affix`, `BackToTop`, `Alert` and `Toolbar` take.
   */
  scrollContainerRef?: RefObject<HTMLElement | null>;
  /**
   * The reading direction, passed to the bar and to the menu panel (which is drawn in a portal and would otherwise follow
   * the page). Not read from the page: pass `"rtl"`, or wrap the page in a `DirectionProvider` once and leave this out. Left out, it is the
   * nearest provider's direction, else left to right.
   * @default 'ltr'
   */
  dir?: NavbarDirection;
  /**
   * The text the bar supplies itself, with English defaults: the menu button's name, the navigation's name, the menu panel's
   * close button, the skip link's text, the external-link cue and the search field's name.
   */
  labels?: Partial<NavbarLabels>;
  /** Names the banner landmark for assistive tech, for a page with more than one header (an article's, say). */
  "aria-label"?: string;
  /** The `id` of a visible element that names the banner landmark, in place of `aria-label`. */
  "aria-labelledby"?: string;
  /** The `id` of a description for the bar. */
  "aria-describedby"?: string;
  /** Standard DOM id. */
  id?: string;
  /** Additional CSS classes, on the `<header>` element. */
  className?: string;
  /** Inline styles, merged onto the component's own internal styles. */
  style?: CSSProperties;
  /**
   * Test identifier for automated testing (e.g. Testing Library's `getByTestId`, Playwright/Cypress selectors).
   * Rendered as the DOM `data-testid` attribute; has no visual or behavioral effect.
   */
  "data-testid"?: string;
}

/** Where `Navbar.Links` sits along the bar, between the brand and the actions. `"center"` centres it in the room between them. */
export type NavbarLinksAlign = "start" | "center" | "end";

/** The column of a row drawn in columns that a part sits in: `"start"`, `"center"` or `"end"`. Follows the reading direction. */
export type NavbarColumn = "start" | "center" | "end";

export interface NavbarRowProps extends HTMLAttributes<HTMLDivElement> {
  /** The row's parts: `Navbar.Brand`, `Navbar.Links`, `Navbar.Search`, `Navbar.Actions`, `Navbar.MenuButton`. */
  children?: ReactNode;
  /** How this row is drawn, in place of the bar's `variant` — see {@link NavbarVariant}. */
  variant?: NavbarVariant;
  /** This row's height step, in place of the bar's `size`. `"xs"` suits a courtesy strip. */
  size?: NavbarSize;
  /** The link size for this row's links, in place of the bar's `linkSize` (or what this row's `size` implies) — see {@link NavbarProps.linkSize}. */
  linkSize?: NavbarLinkSize;
  /** Keeps this row's content to the page's reading width, in place of the bar's `contained`. */
  contained?: boolean;
  /**
   * Draws the row below `columnsBelow` as three columns (start, centre and end) so the centre is truly central however many controls are on
   * each side, the layout of a phone's header: the menu and search buttons, the logo, the other buttons. `"balanced"` gives the two sides
   * equal room and the centre only what it needs; any other value is a CSS `grid-template-columns` track list (`"auto 1fr auto"`) for
   * other widths. Each part goes in the column its `column` prop names, or the one it belongs in by default (the menu button and the search
   * start, the brand and the links centre, the actions end). Only the drawn layout changes: the parts stay in the order they are written.
   * A side with more in it than its track holds spills over its neighbour, so widen the track. Above `columnsBelow` the row is as it is
   * without this.
   */
  columns?: string;
  /**
   * The width below which `columns` applies, a breakpoint step. Decided by the stylesheet, so a server render is right at first paint.
   * @default 'md'
   */
  columnsBelow?: Exclude<Breakpoint, "base">;
  /**
   * Whether the row sticks with the bar (when the bar is `sticky`). Set it to `false` for a courtesy strip that should scroll away
   * while the rest stays. Only leading rows can scroll away (a row that sticks can't have one above it that doesn't: the bar
   * sticks as one), so a `false` after a sticking row warns in development and sticks anyway.
   * @default true
   */
  sticky?: boolean;
  /** Standard DOM id. */
  id?: string;
  /** Additional CSS classes for customization. */
  className?: string;
  /** Inline styles, merged onto the component's own internal styles. */
  style?: CSSProperties;
  /**
   * Test identifier for automated testing (e.g. Testing Library's `getByTestId`, Playwright/Cypress selectors).
   * Rendered as the DOM `data-testid` attribute; has no visual or behavioral effect.
   */
  "data-testid"?: string;
}

export interface NavbarSearchProps extends Omit<SearchInputProps, "size" | "className" | "style"> {
  /** The field's text when controlled. The bar's field and the sheet's are two inputs, so pass this with `onChange` to keep them in step. */
  value?: SearchInputProps["value"];
  /**
   * The width below which the field leaves the bar for a button that opens it in a sheet from the top of the screen, a breakpoint
   * step, or `"never"` to keep it in the bar at every width. Decided by the stylesheet, so a server render is right at first paint.
   * @default 'md'
   */
  collapseBelow?: Exclude<Breakpoint, "base"> | "never";
  /** This field's size, in place of its row's. Also the size of the search button it becomes. */
  size?: NavbarSize;
  /**
   * The look of the search button the field becomes below `collapseBelow`: any `IconButton` variant, so it can match the icon buttons beside it.
   * @default 'ghost'
   */
  buttonVariant?: ButtonVariant;
  /**
   * The colour family of the search button the field becomes below `collapseBelow`: `brand` or `neutral`, so it can match the icon buttons beside it.
   * @default 'brand'
   */
  buttonTone?: ButtonTone;
  /** The size of the search button the field becomes below `collapseBelow`, in place of the field's `size`, so the button can match the icon buttons beside it while the field stays smaller. */
  buttonSize?: ButtonSize;
  /**
   * Closes the sheet when Enter is pressed in its field, so a phone returns to the page with the results. Has no effect in the bar.
   * @default true
   */
  closeOnSubmit?: boolean;
  /**
   * The column this part sits in when its row is drawn in `columns`; ignored otherwise.
   * @default 'start'
   */
  column?: NavbarColumn;
  /** Names the field. Defaults to `labels.search` ("Search"). */
  "aria-label"?: string;
  /** Standard DOM id, on the bar's field. */
  id?: string;
  /** Additional CSS classes, on the search landmark. */
  className?: string;
  /** Inline styles, merged onto the component's own internal styles. */
  style?: CSSProperties;
  /**
   * Test identifier for automated testing (e.g. Testing Library's `getByTestId`, Playwright/Cypress selectors).
   * Rendered as the DOM `data-testid` attribute; has no visual or behavioral effect.
   */
  "data-testid"?: string;
}

export interface NavbarBrandProps extends HTMLAttributes<HTMLElement> {
  /** The brand: a logo and a name. A logo that is an image needs its own `alt`. */
  children?: ReactNode;
  /**
   * Where the brand links to, usually the home page. With an `href` the brand is an `<a>`; without one (and without
   * `asChild`) it is a plain `<div>`.
   */
  href?: string;
  /**
   * Renders as a single provided child element (via Radix `Slot`) instead of the built-in `<a>`/`<div>`, to use a
   * router's link.
   * @default false
   */
  asChild?: boolean;
  /**
   * The column this part sits in when its row is drawn in `columns`; ignored otherwise.
   * @default 'center'
   */
  column?: NavbarColumn;
  /** Names the brand for assistive tech when its content is only a logo. */
  "aria-label"?: string;
  /** Standard DOM id. */
  id?: string;
  /** Additional CSS classes for customization. */
  className?: string;
  /** Inline styles, merged onto the component's own internal styles. */
  style?: CSSProperties;
  /**
   * Test identifier for automated testing (e.g. Testing Library's `getByTestId`, Playwright/Cypress selectors).
   * Rendered as the DOM `data-testid` attribute; has no visual or behavioral effect.
   */
  "data-testid"?: string;
}

export interface NavbarLinksProps extends Omit<ComponentPropsWithoutRef<"nav">, "children" | "align"> {
  /**
   * `Navbar.Link` items. The same items are drawn in the bar and, below the `collapseBelow` width, in the menu panel, so
   * give them no `id`: an id would be on the page twice while the menu is open.
   */
  children?: ReactNode;
  /**
   * Where the links sit between the brand and the actions: `"start"` (next to the brand), `"center"` (centred in the room
   * between them) or `"end"` (against the actions). Follows the reading direction. Has no effect in the menu panel.
   * @default 'start'
   */
  align?: NavbarLinksAlign;
  /**
   * A quieter look for secondary links (a courtesy row): smaller text in the secondary colour. The current link is still marked.
   * @default false
   */
  quiet?: boolean;
  /** This set's link size, in place of its row's and the bar's `linkSize` — see {@link NavbarProps.linkSize}. */
  linkSize?: NavbarLinkSize;
  /**
   * The column this part sits in when its row is drawn in `columns`; ignored otherwise.
   * @default 'center'
   */
  column?: NavbarColumn;
  /** Names the navigation landmark. Defaults to `labels.navigation` ("Main"). */
  "aria-label"?: string;
  /** The `id` of a visible element that names the navigation, in place of `aria-label`. */
  "aria-labelledby"?: string;
  /** Standard DOM id. */
  id?: string;
  /** Additional CSS classes, on the `<nav>` element. */
  className?: string;
  /**
   * Inline styles, merged onto the component's own internal styles. The links inherit their text style from the set, so this is also
   * where their weight and case go (there are no props for them): `style={{ fontWeight: "var(--dbm-font-weight-bold)", textTransform:
   * "uppercase" }}`. The menu panel draws its own copy of the links and keeps its own text.
   */
  style?: CSSProperties;
  /**
   * Test identifier for automated testing (e.g. Testing Library's `getByTestId`, Playwright/Cypress selectors).
   * Rendered as the DOM `data-testid` attribute; has no visual or behavioral effect.
   */
  "data-testid"?: string;
}

export interface NavbarLinkProps extends Omit<AnchorHTMLAttributes<HTMLAnchorElement>, "children"> {
  /** The link's text. With `asChild`, the child's own content instead (and then `icon`, `badge` and `external` are not drawn). */
  children?: ReactNode;
  /** Where the link goes. With `asChild`, put it on the child instead. */
  href?: string;
  /** An icon before the text, a component reference. It follows the text's colour, so it tracks the current look. */
  icon?: PhosphorIcon;
  /**
   * What to show after the text, such as a count or a dot: plain text, drawn in `Badge`'s solid brand look as a round 20px at every link size (its subtle look on a current link drawn as a brand fill, where a solid pill would vanish), or a
   * `Badge` you pass, drawn as written (its `tone`, `variant`, `max`…) with `size="xs"` where it sets none. Pass the `Badge`
   * element itself, not a component that returns one. It is part of the link's name, so a count is read with it ("Inbox 3"); give a
   * bare dot its own visually hidden text.
   */
  badge?: ReactNode;
  /**
   * Marks the link as leading off the site: it opens in a new tab with `rel="noopener noreferrer"`, and gets a trailing
   * icon and a visually hidden "(opens in a new tab)". Worked out from `href` when left out (a link starting `http(s)://` or `//`).
   */
  external?: boolean;
  /**
   * Marks the link as the page the reader is on: `aria-current="page"` and the bar's `currentVariant` look (an underline unless set). The caller decides which one it
   * is (from the router), so it stays correct on a server-rendered page.
   * @default false
   */
  current?: boolean;
  /**
   * Makes the link inert: `aria-disabled` plus a blocked click, and it stays in the tab order, as `Link` does.
   * @default false
   */
  disabled?: boolean;
  /**
   * Renders as a single provided child element (via Radix `Slot`) instead of the built-in `<a>`, to use a router's link.
   * @default false
   */
  asChild?: boolean;
  /** Names the link when its content is only an icon. */
  "aria-label"?: string;
  /** Standard DOM id. Avoid it inside `Navbar.Links`, whose items can be on the page twice. */
  id?: string;
  /** Additional CSS classes, on the link element. */
  className?: string;
  /** Inline styles, merged onto the component's own internal styles. */
  style?: CSSProperties;
  /**
   * Test identifier for automated testing (e.g. Testing Library's `getByTestId`, Playwright/Cypress selectors).
   * Rendered as the DOM `data-testid` attribute; has no visual or behavioral effect.
   */
  "data-testid"?: string;
}

export interface NavbarGroupProps extends Omit<ComponentPropsWithoutRef<"button">, "children" | "type"> {
  /** The group's name, shown on its button. */
  label: ReactNode;
  /** The group's `Navbar.Link`s. In the bar they are the items of a floating menu; in the phone panel they are listed under the button. */
  children?: ReactNode;
  /**
   * Gives the button the current-page look (the bar's `currentVariant`), for a group that holds it. The caller decides, from the router.
   * Also opens the group in the phone panel, unless `defaultOpen` says otherwise.
   * @default false
   */
  current?: boolean;
  /**
   * Whether the group starts expanded in the phone panel. Has no effect in the bar, where the group is a menu that opens on
   * a press.
   * @default current
   */
  defaultOpen?: boolean;
  /**
   * Makes the group's button inert, as a native `disabled` does: it leaves the tab order.
   * @default false
   */
  disabled?: boolean;
  /**
   * How the floating menu lines up with its button in the bar: `"start"`, `"center"` or `"end"` (logical, so `start` is the
   * right edge in right-to-left text).
   * @default 'start'
   */
  align?: MenuAlign;
  /** Names the button when `label` alone doesn't say it. */
  "aria-label"?: string;
  /** Standard DOM id. */
  id?: string;
  /** Additional CSS classes, on the group's button. */
  className?: string;
  /** Inline styles, merged onto the component's own internal styles. */
  style?: CSSProperties;
  /**
   * Test identifier for automated testing (e.g. Testing Library's `getByTestId`, Playwright/Cypress selectors).
   * Rendered as the DOM `data-testid` attribute; has no visual or behavioral effect.
   */
  "data-testid"?: string;
}

export interface NavbarActionProps extends HTMLAttributes<HTMLDivElement> {
  /**
   * Hides this action in the bar below this width, a breakpoint step. Pair it with the same control in `Navbar.PanelActions` so
   * a phone still has it in the menu panel. The switch is the stylesheet's, so a server render is right at first paint.
   */
  hideBelow?: Exclude<Breakpoint, "base">;
  /** The action: a button, a search field, a menu. */
  children?: ReactNode;
  /** Standard DOM id. */
  id?: string;
  /** Additional CSS classes for customization. */
  className?: string;
  /** Inline styles, merged onto the component's own internal styles. */
  style?: CSSProperties;
  /**
   * Test identifier for automated testing (e.g. Testing Library's `getByTestId`, Playwright/Cypress selectors).
   * Rendered as the DOM `data-testid` attribute; has no visual or behavioral effect.
   */
  "data-testid"?: string;
}

export interface NavbarPanelActionsProps extends HTMLAttributes<HTMLDivElement> {
  /**
   * What to show at the foot of the menu panel, such as a full-width "Sign in" button. Drawn only in the panel, never in the
   * bar, so it is where an action hidden from the bar below a width (`Navbar.Action`'s `hideBelow`) reappears on a phone.
   */
  children?: ReactNode;
  /** Standard DOM id. */
  id?: string;
  /** Additional CSS classes for customization. */
  className?: string;
  /** Inline styles, merged onto the component's own internal styles. */
  style?: CSSProperties;
  /**
   * Test identifier for automated testing (e.g. Testing Library's `getByTestId`, Playwright/Cypress selectors).
   * Rendered as the DOM `data-testid` attribute; has no visual or behavioral effect.
   */
  "data-testid"?: string;
}

export interface NavbarSkipLinkProps extends Omit<AnchorHTMLAttributes<HTMLAnchorElement>, "children"> {
  /**
   * The id of the page's main content, as a hash link. Give that element `tabIndex={-1}` so focus lands in it.
   * @default '#main'
   */
  href?: string;
  /** The link's text. Defaults to `labels.skipLink` ("Skip to content"). */
  children?: ReactNode;
  /** Standard DOM id. */
  id?: string;
  /** Additional CSS classes for customization. */
  className?: string;
  /** Inline styles, merged onto the component's own internal styles. */
  style?: CSSProperties;
  /**
   * Test identifier for automated testing (e.g. Testing Library's `getByTestId`, Playwright/Cypress selectors).
   * Rendered as the DOM `data-testid` attribute; has no visual or behavioral effect.
   */
  "data-testid"?: string;
}

export interface NavbarActionsProps extends HTMLAttributes<HTMLDivElement> {
  /**
   * What sits at the bar's end: a search field, icon buttons, a `Menu` for the account, a call to action. A `Button` or `IconButton`
   * here that sets no `size` takes its row's (`Navbar.Row`'s `size`, else the bar's); its own `size` always wins. A search field isn't
   * one of those and keeps the size you give it.
   */
  children?: ReactNode;
  /**
   * The column this part sits in when its row is drawn in `columns`; ignored otherwise.
   * @default 'end'
   */
  column?: NavbarColumn;
  /** Standard DOM id. */
  id?: string;
  /** Additional CSS classes for customization. */
  className?: string;
  /** Inline styles, merged onto the component's own internal styles. */
  style?: CSSProperties;
  /**
   * Test identifier for automated testing (e.g. Testing Library's `getByTestId`, Playwright/Cypress selectors).
   * Rendered as the DOM `data-testid` attribute; has no visual or behavioral effect.
   */
  "data-testid"?: string;
}

export interface NavbarMenuButtonProps extends Omit<ComponentPropsWithoutRef<"button">, "children" | "type"> {
  /**
   * The icon, a component reference.
   * @default ListIcon
   */
  icon?: PhosphorIcon;
  /**
   * The button's look, in place of the quiet one it has by default: any `IconButton` variant, so it can match the icon buttons beside it.
   * @default 'ghost'
   */
  variant?: ButtonVariant;
  /**
   * The button's colour family: `brand` or `neutral`, so it can match the icon buttons beside it.
   * @default 'brand'
   */
  tone?: ButtonTone;
  /** The button's size, in place of its row's: the same scale as `IconButton`. */
  size?: ButtonSize;
  /**
   * The column this part sits in when its row is drawn in `columns`; ignored otherwise.
   * @default 'start'
   */
  column?: NavbarColumn;
  /** The button's accessible name. Defaults to `labels.menu` ("Menu"). */
  "aria-label"?: string;
  /** Standard DOM id. */
  id?: string;
  /** Additional CSS classes for customization. */
  className?: string;
  /** Inline styles, merged onto the component's own internal styles. */
  style?: CSSProperties;
  /**
   * Test identifier for automated testing (e.g. Testing Library's `getByTestId`, Playwright/Cypress selectors).
   * Rendered as the DOM `data-testid` attribute; has no visual or behavioral effect.
   */
  "data-testid"?: string;
}
