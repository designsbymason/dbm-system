import { ArrowSquareOutIcon, CaretDownIcon, ListIcon } from "@dbm-system/icons";
import { cx, mergeDefined, mergeRefs, useScrollEdges } from "@dbm-system/utils";
import { Slot } from "@radix-ui/react-slot";
import { cloneElement, forwardRef, isValidElement, useCallback, useContext, useEffect, useId, useMemo, useRef, useState } from "react";
import type { CSSProperties, MouseEvent, ReactElement } from "react";
import { createPortal } from "react-dom";
import { Affix } from "../../atoms/Affix";
import { useDirection } from "../../atoms/DirectionProvider";
import { ButtonGroupProvider, useButtonGroup } from "../../atoms/Button/buttonGroupContext";
import { Icon } from "../../atoms/Icon";
import { SkipLink } from "../../atoms/SkipLink";
import { VisuallyHidden } from "../../atoms/VisuallyHidden";
import { IconButton } from "../../atoms/IconButton";
import { Drawer } from "../Drawer";
import { Menu } from "../Menu";
import type { DrawerOpenChangeDetails } from "../Drawer";
import styles from "./Navbar.module.css";
import { childrenOf, flattenParts } from "./collectParts";
import {
  NavbarContext,
  NavbarLinkSizeContext,
  NavbarLinksLookContext,
  NavbarMenuContext,
  NavbarPanelContext,
  NavbarRowContext,
  NavbarRowIndexContext,
  defaultLabels,
  useNavbarContext,
} from "./NavbarContext";
import type { NavbarContextValue } from "./NavbarContext";
import { defaultLinkSize, linkIconSize, linkTrailingIconSize, stepDown } from "./linkSizes";
import { Badge } from "../../atoms/Badge";
import type { BadgeProps } from "../../atoms/Badge";
import { blockDisabledClick, EXTERNAL_HREF_PATTERN } from "../../internal/linkGuard";
import { NavigationEmbedContext } from "../../internal/navigationEmbed";
import { NavbarRow } from "./NavbarRow";
import { NavbarSearch } from "./NavbarSearch";
import { useHideOnScroll } from "./useHideOnScroll";
import { useLeadingRowsHeight, useScrolledPast } from "./useLeadingRows";
import { useRevealCurrent } from "./useRevealCurrent";
import type {
  NavbarActionProps,
  NavbarActionsProps,
  NavbarBrandProps,
  NavbarCollapseBelow,
  NavbarLinkSize,
  NavbarCurrentVariant,
  NavbarGroupProps,
  NavbarLinkProps,
  NavbarLinksProps,
  NavbarMenuButtonProps,
  NavbarPanelActionsProps,
  NavbarProps,
  NavbarSkipLinkProps,
} from "./Navbar.types";

/** The custom property the stylesheet reads to move a hidden sticky bar out by its offset as well as its height. */
const stickyOffsetProperty = "--navbar-sticky-offset";

/** The custom property holding how far the leading rows that scroll away take the bar above the top of the page. */
const leadingHeightProperty = "--navbar-leading-height";


const hideBelowClass: Record<NonNullable<NavbarActionProps["hideBelow"]>, string | undefined> = {
  sm: styles.hideBelowSm,
  md: styles.hideBelowMd,
  lg: styles.hideBelowLg,
  xl: styles.hideBelowXl,
  "2xl": styles.hideBelow2xl,
  "3xl": styles.hideBelow3xl,
};

const linkSizeClass: Record<NavbarLinkSize, string | undefined> = {
  xs: styles.linkSizeXs,
  sm: styles.linkSizeSm,
  md: styles.linkSizeMd,
  lg: styles.linkSizeLg,
  xl: styles.linkSizeXl,
};

const collapseClass: Record<NavbarCollapseBelow, string | undefined> = {
  sm: styles.collapseSm,
  md: styles.collapseMd,
  lg: styles.collapseLg,
  xl: styles.collapseXl,
  "2xl": styles.collapse2xl,
  "3xl": styles.collapse3xl,
  never: styles.collapseNever,
};

const currentVariantClass: Record<NavbarCurrentVariant, string | undefined> = {
  subtle: undefined,
  underline: styles.currentUnderline,
  solid: styles.currentSolid,
};

// The widths the `collapseBelow` steps stand for, the literal values of the breakpoint tokens (a media query can't read a
// custom property). Used only to close the menu panel when the page grows past the step, so it doesn't sit over a bar
// that already shows the links.
const collapseQuery: Record<Exclude<NavbarCollapseBelow, "never">, string> = {
  sm: "(min-width: 40rem)",
  md: "(min-width: 48rem)",
  lg: "(min-width: 64rem)",
  xl: "(min-width: 80rem)",
  "2xl": "(min-width: 96rem)",
  "3xl": "(min-width: 120rem)",
};

/**
 * Whether a link has become the current one since it was drawn, and still is: true from the render in which `current` turns
 * on until it turns off, so a marker that grows in plays once, isn't cut short by an unrelated re-render, and doesn't play
 * for a link that was already current when it mounted (a first paint, or the menu panel opening). The previous value is held in
 * state and compared while rendering, the pattern React gives for state derived from a prop.
 */
function useBecameCurrent(current: boolean): boolean {
  const [previous, setPrevious] = useState(current);
  const [became, setBecame] = useState(false);
  if (previous !== current) {
    setPrevious(current);
    setBecame(current);
  }
  return became;
}

/**
 * The application header: a named banner at the top of the page holding the brand, the primary navigation and a place for
 * the actions that belong to the whole app (search, an account menu, a call to action). Below the `collapseBelow` width
 * the navigation leaves the bar and is offered in a `Drawer` behind a menu button, so a phone gets a list it can reach
 * with a thumb and the first paint of a server-rendered page is already right (the switch is a stylesheet's).
 *
 * A compound component, meaning it is made of named sub-parts you compose together: `Navbar.Row`s (optional bands of the one header: a
 * courtesy strip, the logo and search row, a row of categories), `Navbar.Brand`, `Navbar.Links` (several are allowed, each its own named
 * `<nav>`, and all in the one menu panel) holding
 * `Navbar.Link` items (and `Navbar.Group`s of them), `Navbar.Search` (a `role="search"` field that becomes a button and a sheet on a
 * phone), `Navbar.Actions` holding `Navbar.Action`s, `Navbar.PanelActions` (what the menu
 * panel shows at its foot), `Navbar.SkipLink`, and `Navbar.MenuButton` (drawn for you when `Navbar.Links` is present, unless you
 * place one yourself). It is a `<header>`; `Navbar.Links` is a named `<nav>` holding a list, and the current page is
 * `aria-current="page"`, marked by `currentVariant` (`underline`, `subtle` or `solid`) and, with `rounded`, as a pill. Links are
 * ordinary tab stops, not a roving group: this is the disclosure-navigation pattern, not a toolbar.
 *
 * The same `Navbar.Link` items are drawn in the bar and in the menu panel, so give them no `id`. A link that opens more links is a
 * `Navbar.Group`: a floating menu in the bar and an expandable group in the panel. An action can leave the bar below a width
 * (`Navbar.Action`'s `hideBelow`) and come back in `Navbar.PanelActions`. A sticky bar can be transparent until it is stuck
 * (`variant="ghost"`), can slide away while the reader scrolls down (`hideOnScroll`), and can lead with rows that scroll away
 * (`Navbar.Row`'s `sticky={false}`). A wide panel of grouped links is
 * `NavigationMenu`.
 *
 * Does not cover a persistent navigation column (`Sidebar`), a bar of editing actions (`Toolbar`), or a whole page layout (a
 * template).
 *
 * @example
 * ```tsx
 * <Navbar sticky>
 *   <Navbar.Brand href="/">dbM</Navbar.Brand>
 *   <Navbar.Links>
 *     <Navbar.Link href="/products" current>Products</Navbar.Link>
 *     <Navbar.Link href="/pricing">Pricing</Navbar.Link>
 *   </Navbar.Links>
 *   <Navbar.Actions>
 *     <Button size="sm">Sign in</Button>
 *   </Navbar.Actions>
 * </Navbar>
 * ```
 */
const NavbarRoot = forwardRef<HTMLElement, NavbarProps>(
  (
    {
      children,
      variant = "outlined",
      currentVariant = "underline",
      rounded = false,
      size = "md",
      linkSize,
      collapseBelow = "md",
      menuOpen,
      defaultMenuOpen = false,
      onMenuOpenChange,
      onMenuOpenChangeComplete,
      menuSide = "start",
      menuContainer,
      closeMenuOnNavigate = true,
      contained = false,
      sticky = false,
      stickyOffset = 0,
      scrollContainerRef,
      hideOnScroll = false,
      dir: dirProp,
      labels,
      className,
      style,
      ...props
    },
    ref,
  ) => {
    // The direction of the nearest `DirectionProvider` when none is given, so one provider at the root is enough for a right-to-left page.
    const dir = useDirection(dirProp);
    const resolvedLabels = mergeDefined(defaultLabels, labels);
    const [uncontrolledOpen, setUncontrolledOpen] = useState(defaultMenuOpen);
    const isControlled = menuOpen !== undefined;
    const open = isControlled ? menuOpen : uncontrolledOpen;

    const changeMenu = useCallback(
      (next: boolean, details: DrawerOpenChangeDetails) => {
        if (!isControlled) setUncontrolledOpen(next);
        onMenuOpenChange?.(next, details);
      },
      [isControlled, onMenuOpenChange],
    );

    const closeMenu = useCallback(() => changeMenu(false, { reason: "close" }), [changeMenu]);

    // Past the width where the links are in the bar again, a menu panel left open would sit over links already on show.
    useEffect(() => {
      if (!open || collapseBelow === "never" || typeof window === "undefined" || !window.matchMedia) return undefined;
      const query = window.matchMedia(collapseQuery[collapseBelow]);
      const handleChange = (event: MediaQueryListEvent) => {
        if (event.matches) closeMenu();
      };
      query.addEventListener("change", handleChange);
      return () => query.removeEventListener("change", handleChange);
    }, [open, collapseBelow, closeMenu]);

    const [panelBody, setPanelBody] = useState<HTMLElement | null>(null);
    const [panelQuietBody, setPanelQuietBody] = useState<HTMLElement | null>(null);
    const [panelFooter, setPanelFooter] = useState<HTMLElement | null>(null);
    const barRef = useRef<HTMLElement | null>(null);
    const headerRef = useMemo(() => mergeRefs(ref, barRef), [ref]);

    // What the bar is made of: its direct children, with fragments looked through, and the parts inside any rows.
    const children_ = flattenParts(children);
    const rows = children_.filter((child) => child.type === NavbarRow);
    const hasRows = rows.length > 0;
    const everyPart = [...children_, ...rows.flatMap((row) => flattenParts(childrenOf(row)))];
    const linksParts = everyPart.filter((part) => part.type === NavbarLinks);
    // A set that scrolls (`scroll`) stays in the bar, so it neither fills the menu panel nor calls for the menu button.
    const hasLinks = linksParts.some((part) => !(part.props as { scroll?: boolean }).scroll);
    const hasMenuButton = everyPart.some((part) => part.type === NavbarMenuButton);
    const hasPanelActions = everyPart.some((part) => part.type === NavbarPanelActions);
    const showAutomaticMenuButton = hasLinks && !hasMenuButton && collapseBelow !== "never";
    // The automatic menu button goes at the end of the first row with the brand in it, or the first row.
    const brandRow = rows.findIndex((row) => flattenParts(childrenOf(row)).some((part) => part.type === NavbarBrand));
    const menuButtonRow = showAutomaticMenuButton ? (hasRows ? Math.max(brandRow, 0) : 0) : null;

    // The rows at the start that scroll away. A sticky bar sticks as one box, so these can only be the first ones.
    let leadingCount = 0;
    while (leadingCount < rows.length && (rows[leadingCount]?.props as { sticky?: boolean }).sticky === false) leadingCount += 1;
    const hasLeading = sticky && leadingCount > 0;
    // The rows at the end that scroll away are drawn after the `<header>`, as its siblings, so the header can stick on its own and they leave under
    // it (a sticky box sticks within its parent, which is as tall as its rows). Only a sticky bar has any: a bar that does not stick scrolls whole.
    let trailingStart = rows.length;
    while (sticky && trailingStart > leadingCount && (rows[trailingStart - 1]?.props as { sticky?: boolean }).sticky === false) trailingStart -= 1;
    const trailingRows = sticky ? rows.slice(trailingStart) : [];
    const leadingHeight = useLeadingRowsHeight(hasLeading, barRef, leadingCount);
    const pastLeading = useScrolledPast(leadingHeight, scrollContainerRef);
    const awayFromView = useHideOnScroll(sticky && hideOnScroll, barRef, scrollContainerRef);

    useEffect(() => {
      if (process.env.NODE_ENV === "production") return;
      if (hideOnScroll && !sticky) {
        console.warn("Navbar: `hideOnScroll` needs `sticky`; without it the bar scrolls away with the page and nothing is hidden.");
      }
      if (hasRows && children_.some((child) => child.type !== NavbarRow && child.type !== NavbarSkipLink && child.type !== NavbarPanelActions)) {
        console.warn("Navbar: parts are mixed with `Navbar.Row`s. Put every part in a row (only the skip link and the panel actions go beside them); the loose ones are drawn above the rows.");
      }
      if (sticky && rows.slice(leadingCount, trailingStart).some((row) => (row.props as { sticky?: boolean }).sticky === false)) {
        console.warn("Navbar: a `Navbar.Row` with `sticky={false}` sits between rows that stick. Only the rows at the start or the end of the bar can scroll away, so it sticks.");
      }
      const names = linksParts
        .filter((part) => (part.props as { "aria-labelledby"?: string })["aria-labelledby"] === undefined)
        .map((part) => (part.props as { "aria-label"?: string })["aria-label"] ?? resolvedLabels.navigation);
      if (new Set(names).size !== names.length) {
        console.warn("Navbar: two `Navbar.Links` have the same name. Give each its own `aria-label` so they are told apart.");
      }
    });

    const autoMenuButton = showAutomaticMenuButton ? <NavbarMenuButton /> : null;
    const contextValue = useMemo<NavbarContextValue>(
      () => ({
        labels: resolvedLabels,
        variant,
        size,
        linkSize,
        contained,
        closeMenuOnNavigate,
        currentVariant,
        rounded,
        menuSide,
        menuContainer,
        panelBody,
        setPanelBody,
        panelQuietBody,
        setPanelQuietBody,
        panelFooter,
        setPanelFooter,
        hasPanelActions,
        menuButtonRow,
        autoMenuButton,
        dir,
        closeMenu,
      }),
      // `mergeDefined` returns a fresh object each render; its strings are what the value really depends on, and the automatic
      // menu button is the same element whenever it is drawn.
      // eslint-disable-next-line react-hooks/exhaustive-deps
      [
        resolvedLabels.menu,
        resolvedLabels.navigation,
        resolvedLabels.close,
        resolvedLabels.skipLink,
        resolvedLabels.externalLink,
        resolvedLabels.search,
        variant,
        size,
        linkSize,
        contained,
        closeMenuOnNavigate,
        currentVariant,
        rounded,
        menuSide,
        menuContainer,
        panelBody,
        panelQuietBody,
        panelFooter,
        hasPanelActions,
        menuButtonRow,
        showAutomaticMenuButton,
        dir,
        closeMenu,
      ],
    );

    const headerStyle: CSSProperties | undefined = sticky
      ? ({
          [stickyOffsetProperty]: `var(--dbm-space-${stickyOffset})`,
          ...(hasLeading
            ? {
                [leadingHeightProperty]: `${leadingHeight}px`,
                top: `calc(var(--dbm-space-${stickyOffset}) - var(${leadingHeightProperty}))`,
              }
            : {}),
          ...style,
        } as CSSProperties)
      : style;

    const header = (
      <header
        {...props}
        ref={headerRef}
        dir={dir}
        data-variant={variant}
        data-size={size}
        data-navbar-stuck={hasLeading && pastLeading ? "" : undefined}
        data-away={awayFromView ? "" : undefined}
        className={cx(
          styles.root,
          variant === "ghost" && styles.ghostBar,
          variant === "frosted" && styles.frostedBar,
          collapseClass[collapseBelow],
          sticky && styles.sticky,
          hasLeading && styles.hasLeading,
          awayFromView && styles.awayFromView,
          className,
        )}
        style={headerStyle}
      >
        {hasRows
          ? children_
              .filter((child) => !trailingRows.includes(child))
              .map((child, position) =>
              child.type === NavbarRow ? (
                <NavbarRowIndexContext.Provider key={child.key ?? position} value={rows.indexOf(child)}>
                  {child}
                </NavbarRowIndexContext.Provider>
              ) : (
                child
              ),
            )
          : (
            <NavbarRowIndexContext.Provider value={0}>
              <NavbarRow>{children}</NavbarRow>
            </NavbarRowIndexContext.Provider>
          )}
      </header>
    );

    return (
      <NavbarContext.Provider value={contextValue}>
        <Drawer open={open} onOpenChange={changeMenu} onOpenChangeComplete={onMenuOpenChangeComplete}>
          {sticky ? (
            <Affix asChild offset={stickyOffset} scrollContainerRef={scrollContainerRef}>
              {header}
            </Affix>
          ) : (
            header
          )}
          {trailingRows.length > 0 && (
            <div dir={dir} className={cx(styles.root, collapseClass[collapseBelow])} data-navbar-trailing="">
              {trailingRows.map((row) => (
                <NavbarRowIndexContext.Provider key={row.key ?? rows.indexOf(row)} value={rows.indexOf(row)}>
                  {row}
                </NavbarRowIndexContext.Provider>
              ))}
            </div>
          )}
          {hasLinks && (
            <Drawer.Content
              side={menuSide}
              size="sm"
              dir={dir}
              container={menuContainer}
              labels={{ close: resolvedLabels.close }}
              aria-describedby={undefined}
            >
              <Drawer.Header>
                <Drawer.Title>{resolvedLabels.menu}</Drawer.Title>
              </Drawer.Header>
              <Drawer.Body>
                <div ref={setPanelBody} className={styles.panelSections} />
                <div ref={setPanelQuietBody} className={styles.panelQuietSections} />
              </Drawer.Body>
              {hasPanelActions && <Drawer.Footer ref={setPanelFooter} align="stretch" />}
            </Drawer.Content>
          )}
        </Drawer>
      </NavbarContext.Provider>
    );
  },
);
NavbarRoot.displayName = "Navbar";

/**
 * The brand: a logo and a name, linking home. With an `href` it is an `<a>`; without one a plain `<div>`; `asChild` puts
 * the brand's look on a router link.
 */
const NavbarBrand = forwardRef<HTMLElement, NavbarBrandProps>(
  ({ href, asChild = false, column: _column, className, children, ...props }, ref) => {
    const Component = asChild ? Slot : href !== undefined ? "a" : "div";
    return (
      <Component
        {...props}
        {...(href !== undefined ? { href } : {})}
        ref={ref as never}
        className={cx(styles.brand, className)}
      >
        {children}
      </Component>
    );
  },
);
NavbarBrand.displayName = "Navbar.Brand";

/**
 * The primary navigation: a `<nav>` holding a list of `Navbar.Link`s. Drawn in the bar at and above the `collapseBelow`
 * width, and, below it, as the body of the menu panel the menu button opens. Its children are drawn in both places.
 *
 * With `scroll` it is a second row of links that stays in the bar at every width instead: not copied into the panel, scrolling
 * sideways with edge fades when it does not fit, the current link scrolled into view. `currentVariant` and `rounded` give a set a
 * look of its own beside the bar's.
 */
const NavbarLinks = forwardRef<HTMLElement, NavbarLinksProps>(
  (
    {
      children,
      className,
      align = "start",
      quiet = false,
      scroll = false,
      hideBelow,
      linkSize: ownLinkSize,
      currentVariant: ownCurrentVariant,
      rounded: ownRounded,
      column: _column,
      "aria-label": ariaLabel,
      "aria-labelledby": ariaLabelledBy,
      ...props
    },
    ref,
  ) => {
    const {
      labels,
      panelBody,
      panelQuietBody,
      size: barSize,
      linkSize: barLinkSize,
      currentVariant: barCurrentVariant,
      rounded: barRounded,
      dir,
      closeMenu,
      closeMenuOnNavigate,
    } = useNavbarContext("Navbar.Links");
    const row = useContext(NavbarRowContext);
    // The look this set marks its links with: its own, else the bar's. The menu panel's copy keeps the bar's.
    const currentVariant = ownCurrentVariant ?? barCurrentVariant;
    const rounded = ownRounded ?? barRounded;
    const look = useMemo(() => ({ currentVariant, rounded }), [currentVariant, rounded]);
    // The size a set reads: its own, else its row's, else the bar's; none of them set, it follows the row's height step. A `quiet` set
    // reads one step below that.
    const explicit = ownLinkSize ?? row?.linkSize ?? barLinkSize;
    const baseLinkSize = explicit ?? defaultLinkSize[row?.size ?? barSize];
    const resolvedLinkSize = quiet ? stepDown(baseLinkSize) : baseLinkSize;
    const linkSizeValue = useMemo(() => ({ size: resolvedLinkSize, explicit: explicit !== undefined }), [resolvedLinkSize, explicit]);
    // A set that scrolls stays in the bar, so it puts no copy into the menu panel.
    const panelTarget = scroll ? null : quiet ? panelQuietBody : panelBody;
    const name = ariaLabelledBy === undefined ? (ariaLabel ?? labels.navigation) : ariaLabel;
    // A `NavigationMenu` among the links follows the bar (its look, its direction) and is stacked in the menu panel, where a click on
    // one of its links closes the panel.
    const barEmbed = useMemo(() => ({ currentVariant, rounded, dir, inPanel: false, closePanel: null }), [currentVariant, rounded, dir]);
    const panelEmbed = useMemo(
      () => ({ currentVariant: barCurrentVariant, rounded: barRounded, dir, inPanel: true, closePanel: closeMenuOnNavigate ? closeMenu : null }),
      [barCurrentVariant, barRounded, dir, closeMenuOnNavigate, closeMenu],
    );

    const scrollerRef = useRef<HTMLDivElement | null>(null);
    const { overflowStart, overflowEnd } = useScrollEdges(scrollerRef, "horizontal", { itemSelector: "a", enabled: scroll });
    useRevealCurrent(scrollerRef, scroll);

    useEffect(() => {
      if (process.env.NODE_ENV === "production" || !scroll) return;
      if (flattenParts(children).some((part) => part.type === NavbarGroup)) {
        console.warn("Navbar: a `Navbar.Group` in `Navbar.Links` with `scroll`. A floating list would be cut by the scroller, so put only `Navbar.Link`s in it.");
      }
    });

    const list = (
      // `role="list"` and `role="listitem"` are redundant on paper; Safari with VoiceOver drops list semantics under `list-style: none`.
      // eslint-disable-next-line jsx-a11y/no-redundant-roles
      <ul role="list" className={styles.list}>
        <NavbarLinksLookContext.Provider value={look}>
          <NavbarLinkSizeContext.Provider value={linkSizeValue}>
            <NavigationEmbedContext.Provider value={barEmbed}>{children}</NavigationEmbedContext.Provider>
          </NavbarLinkSizeContext.Provider>
        </NavbarLinksLookContext.Provider>
      </ul>
    );

    return (
      <>
        <nav
          {...props}
          ref={ref}
          aria-label={name}
          aria-labelledby={ariaLabelledBy}
          data-align={align}
          data-scroll={scroll ? "" : undefined}
          data-hide-below={hideBelow}
          data-overflow-start={scroll && overflowStart ? "" : undefined}
          data-overflow-end={scroll && overflowEnd ? "" : undefined}
          className={cx(styles.links, scroll && styles.scrollLinks, quiet && styles.quiet, linkSizeClass[resolvedLinkSize], className)}
        >
          {scroll ? (
            <div ref={scrollerRef} className={styles.scroller}>
              {list}
            </div>
          ) : (
            list
          )}
        </nav>
        {/* The menu panel is drawn by the bar, once; each set of links puts its copy into it, in the order they are written. */}
        {panelTarget !== null &&
          createPortal(
            <nav aria-label={name} aria-labelledby={ariaLabelledBy} className={cx(styles.panelNav, quiet && styles.quiet)}>
              {/* eslint-disable-next-line jsx-a11y/no-redundant-roles */}
              <ul role="list" className={cx(styles.list, styles.panelList)}>
                <NavbarPanelContext.Provider value>
                  <NavigationEmbedContext.Provider value={panelEmbed}>{children}</NavigationEmbedContext.Provider>
                </NavbarPanelContext.Provider>
              </ul>
            </nav>,
            panelTarget,
          )}
      </>
    );
  },
);
NavbarLinks.displayName = "Navbar.Links";

/**
 * One link of the navigation. `current` marks the page the reader is on (`aria-current="page"`); `disabled` blocks the click
 * and keeps the link in the tab order, as `Link` does; `asChild` puts the look on a router's link. It takes an `icon` before its
 * text, a `badge` (a count or dot, part of the link's name) after it, and an `external` mark (worked out from `href`: a new tab, a
 * trailing icon and a hidden cue). Inside a `Navbar.Group` it is an item of that group's floating menu.
 */
const NavbarLink = forwardRef<HTMLAnchorElement, NavbarLinkProps>(
  (
    {
      current = false,
      disabled = false,
      asChild = false,
      icon,
      badge,
      external,
      href,
      target,
      rel,
      className,
      onClick,
      onClickCapture,
      children,
      ...props
    },
    ref,
  ) => {
    const { closeMenuOnNavigate, closeMenu, currentVariant: barCurrentVariant, rounded: barRounded, labels } = useNavbarContext("Navbar.Link");
    // The set's own look when it gave itself one (in the bar), else the bar's.
    const setLook = useContext(NavbarLinksLookContext);
    const currentVariant = setLook?.currentVariant ?? barCurrentVariant;
    const rounded = setLook?.rounded ?? barRounded;
    const isExternal = !asChild && (external ?? EXTERNAL_HREF_PATTERN.test(href ?? ""));
    const inPanel = useContext(NavbarPanelContext);
    const closeGroupMenu = useContext(NavbarMenuContext);
    const inMenu = closeGroupMenu !== null;
    // The icon follows the set's link size in the bar; in the panel and in a group's list it keeps its own.
    const linkSize = useContext(NavbarLinkSizeContext);
    const sized = linkSize && !inPanel && !inMenu ? linkSize.size : undefined;
    const iconSize = sized ? linkIconSize[sized] : "sm";
    const trailingIconSize = sized ? linkTrailingIconSize[sized] : "xs";
    const grows = useBecameCurrent(current);
    const Component = asChild ? Slot : "a";

    // Capture-phase, so it runs before a slotted child's own `onClick` (a router's navigation), as `Link`'s does.
    const handleClickCapture = (event: MouseEvent<HTMLAnchorElement>) => {
      if (!blockDisabledClick(event, disabled)) onClickCapture?.(event);
    };

    // A link chosen in the menu panel closes it. `preventDefault` doesn't stop that: a router's link calls it to navigate
    // without a page load, which is exactly the link that should close the panel. Only a link does it, though: a button
    // drawn with this look (a dropdown's trigger, an `asChild` button) leaves the panel open. A disabled link never gets here.
    const handleClick = (event: MouseEvent<HTMLAnchorElement>) => {
      onClick?.(event);
      if (inPanel && closeMenuOnNavigate && (event.currentTarget as HTMLElement).matches("a[href]")) closeMenu();
      if (closeGroupMenu && event.defaultPrevented) closeGroupMenu();
    };

    const link = (
      <Component
        {...props}
        {...(asChild ? {} : { href, target: target ?? (isExternal ? "_blank" : undefined), rel: rel ?? (isExternal ? "noopener noreferrer" : undefined) })}
        ref={ref}
        aria-current={current ? "page" : undefined}
        aria-disabled={disabled || undefined}
        onClick={handleClick}
        onClickCapture={handleClickCapture}
        className={cx(
          !inMenu && styles.link,
          !inMenu && rounded && styles.rounded,
          !inMenu && current && styles.current,
          !inMenu && current && currentVariantClass[currentVariant],
          !inMenu && current && grows && styles.currentGrow,
          inMenu && current && styles.menuCurrent,
          disabled && styles.disabled,
          className,
        )}
      >
        {asChild ? (
          children
        ) : (
          <>
            {icon && <Icon icon={icon} size={iconSize} />}
            {children}
            {badge !== undefined &&
              badge !== null &&
              // A `Badge` passed as the badge is drawn as written (its tone, variant, `max`…), with the link's size and height rule filled in
              // where it didn't say; anything else is the content of the link's own badge (solid, brand; subtle on a current link drawn as a brand fill, where a solid
              // brand pill would vanish), so a pill is never inside a pill.
              (isValidElement(badge) && badge.type === Badge ? (
                cloneElement(badge as ReactElement<BadgeProps>, {
                  size: (badge as ReactElement<BadgeProps>).props.size ?? "xs",
                  className: cx(styles.linkBadge, (badge as ReactElement<BadgeProps>).props.className),
                })
              ) : (
                <Badge tone="brand" variant={current && currentVariant === "solid" ? "subtle" : "solid"} size="xs" className={cx(styles.linkBadge, styles.linkBadgeOwn)}>
                  {badge}
                </Badge>
              ))}
            {isExternal && (
              <>
                <Icon icon={ArrowSquareOutIcon} size={trailingIconSize} />
                <VisuallyHidden> {labels.externalLink}</VisuallyHidden>
              </>
            )}
          </>
        )}
      </Component>
    );

    // In a group's floating list the link is a menu item (arrow keys, typeahead, closing on choice) and not a list item.
    if (inMenu) {
      return (
        <Menu.Item asChild disabled={disabled}>
          {link}
        </Menu.Item>
      );
    }

    return (
      // `role="listitem"` is redundant on paper; see `Navbar.Links`.
      // eslint-disable-next-line jsx-a11y/no-redundant-roles
      <li role="listitem" className={styles.item}>
        {link}
      </li>
    );
  },
);
NavbarLink.displayName = "Navbar.Link";

/**
 * A link that opens more links. In the bar it is a button that opens a floating `Menu` of its `Navbar.Link`s (arrow keys,
 * typeahead, `Escape`); in the menu panel on a phone, where a floating list is awkward, it is an expandable group, a button
 * with `aria-expanded` that shows its links indented beneath it. Give it a `label` and `Navbar.Link` children; it is
 * not for a wide panel of grouped links, which is `NavigationMenu`.
 */
const NavbarGroup = forwardRef<HTMLButtonElement, NavbarGroupProps>(
  ({ label, current = false, disabled = false, defaultOpen, align = "start", className, children, ...props }, ref) => {
    const { dir, currentVariant: barCurrentVariant, rounded: barRounded, menuContainer } = useNavbarContext("Navbar.Group");
    const setLook = useContext(NavbarLinksLookContext);
    const currentVariant = setLook?.currentVariant ?? barCurrentVariant;
    const rounded = setLook?.rounded ?? barRounded;
    const inPanel = useContext(NavbarPanelContext);
    // The dropdown's items take the link size when one was set; left alone, `Menu`'s own default.
    const linkSize = useContext(NavbarLinkSizeContext);
    const [open, setOpen] = useState(defaultOpen ?? current);
    const [menuOpen, setMenuOpen] = useState(false);
    const grows = useBecameCurrent(current);
    const closeGroupMenu = useCallback(() => setMenuOpen(false), []);
    const regionId = useId();
    const trigger = (
      <>
        {label}
        <Icon icon={CaretDownIcon} size={linkSize && !inPanel ? linkTrailingIconSize[linkSize.size] : "xs"} className={styles.caret} />
      </>
    );
    const triggerClass = cx(
      styles.link,
      styles.groupTrigger,
      rounded && styles.rounded,
      current && styles.current,
      current && currentVariantClass[currentVariant],
      current && grows && styles.currentGrow,
      className,
    );

    if (inPanel) {
      return (
        // `role="listitem"` is redundant on paper; see `Navbar.Links`.
        // eslint-disable-next-line jsx-a11y/no-redundant-roles
        <li role="listitem" className={cx(styles.item, styles.groupItem)}>
          <button
            {...props}
            ref={ref}
            type="button"
            disabled={disabled}
            aria-expanded={open}
            aria-controls={regionId}
            className={triggerClass}
            onClick={() => setOpen((previous) => !previous)}
          >
            {trigger}
          </button>
          {/* eslint-disable-next-line jsx-a11y/no-redundant-roles */}
          <ul role="list" id={regionId} hidden={!open} className={cx(styles.list, styles.groupList)}>
            {children}
          </ul>
        </li>
      );
    }

    return (
      // eslint-disable-next-line jsx-a11y/no-redundant-roles
      <li role="listitem" className={styles.item}>
        <Menu dir={dir} open={menuOpen} onOpenChange={setMenuOpen}>
          <Menu.Trigger asChild disabled={disabled}>
            <button {...props} ref={ref} type="button" disabled={disabled} className={triggerClass}>
              {trigger}
            </button>
          </Menu.Trigger>
          <Menu.Content align={align} container={menuContainer} size={linkSize?.explicit ? linkSize.size : undefined}>
            <NavbarMenuContext.Provider value={closeGroupMenu}>{children}</NavbarMenuContext.Provider>
          </Menu.Content>
        </Menu>
      </li>
    );
  },
);
NavbarGroup.displayName = "Navbar.Group";

/** The bar's end: whatever belongs to the whole app, pushed to the far edge. */
const NavbarActions = forwardRef<HTMLDivElement, NavbarActionsProps>(({ column: _column, className, ...props }, ref) => {
  // The `Button`s and `IconButton`s inside take the row's size when they set none (their own always wins), through the same context a
  // `ButtonGroup` hands its buttons; whatever else the group already set (its variant, tone, rounded, disabled) is kept.
  const bar = useNavbarContext("Navbar.Actions");
  const row = useContext(NavbarRowContext);
  const parent = useButtonGroup();
  const size = row?.size ?? bar.size;
  const buttons = useMemo(() => ({ ...parent, size }), [parent, size]);
  return (
    <ButtonGroupProvider value={buttons}>
      <div {...props} ref={ref} className={cx(styles.actions, className)} />
    </ButtonGroupProvider>
  );
});
NavbarActions.displayName = "Navbar.Actions";

/**
 * One action in the bar's end, a box that can leave the bar below a width (`hideBelow`). Wrapping each action in one is only
 * needed for that: a bare child of `Navbar.Actions` stays at every width.
 */
const NavbarAction = forwardRef<HTMLDivElement, NavbarActionProps>(({ hideBelow, className, ...props }, ref) => (
  <div {...props} ref={ref} className={cx(styles.action, hideBelow && hideBelowClass[hideBelow], className)} />
));
NavbarAction.displayName = "Navbar.Action";

/**
 * What the menu panel shows at its foot, drawn only there: the place an action hidden from the bar below a width
 * (`Navbar.Action`'s `hideBelow`) comes back on a phone. Its children are placed into the panel's footer, so it draws nothing
 * in the bar, nor while the panel is closed.
 */
const NavbarPanelActions = forwardRef<HTMLDivElement, NavbarPanelActionsProps>(({ className, ...props }, ref) => {
  const { panelFooter } = useNavbarContext("Navbar.PanelActions");
  if (panelFooter === null) return null;
  return createPortal(<div {...props} ref={ref} className={cx(styles.panelActions, className)} />, panelFooter);
});
NavbarPanelActions.displayName = "Navbar.PanelActions";

/**
 * A link that jumps past the bar to the page's main content, hidden until it takes keyboard focus. Put it first among the bar's
 * children (and the bar first on the page), so it is the first thing `Tab` reaches. Its `href` names the main element's id, which
 * needs `tabIndex={-1}` to receive focus.
 */
const NavbarSkipLink = forwardRef<HTMLAnchorElement, NavbarSkipLinkProps>(
  ({ href = "#main", className, children, ...props }, ref) => {
    const { labels } = useNavbarContext("Navbar.SkipLink");
    return (
      <SkipLink {...props} ref={ref} href={href} className={className}>
        {children ?? labels.skipLink}
      </SkipLink>
    );
  },
);
NavbarSkipLink.displayName = "Navbar.SkipLink";

/**
 * The button that opens the menu panel below the `collapseBelow` width, an `IconButton` that is the panel's `Drawer`
 * trigger. Drawn for you when `Navbar.Links` is present, at the end of the row with the brand (the only row, in a bar with none);
 * place one yourself to put it elsewhere or give it another icon.
 */
const NavbarMenuButton = forwardRef<HTMLButtonElement, NavbarMenuButtonProps>(
  ({ icon = ListIcon, variant = "ghost", tone, size: ownSize, column: _column, className, "aria-label": ariaLabel, ...props }, ref) => {
    const { labels, size: barSize } = useNavbarContext("Navbar.MenuButton");
    const rowSize = useContext(NavbarRowContext)?.size;
    const size = ownSize ?? rowSize ?? barSize;
    return (
      <Drawer.Trigger asChild>
        <IconButton
          {...props}
          ref={ref}
          icon={icon}
          variant={variant}
          tone={tone}
          size={size}
          aria-label={ariaLabel ?? labels.menu}
          className={cx(styles.menuButton, className)}
        />
      </Drawer.Trigger>
    );
  },
);
NavbarMenuButton.displayName = "Navbar.MenuButton";

type NavbarComponent = typeof NavbarRoot & {
  Row: typeof NavbarRow;
  Brand: typeof NavbarBrand;
  Search: typeof NavbarSearch;
  Links: typeof NavbarLinks;
  Link: typeof NavbarLink;
  Group: typeof NavbarGroup;
  Actions: typeof NavbarActions;
  Action: typeof NavbarAction;
  PanelActions: typeof NavbarPanelActions;
  SkipLink: typeof NavbarSkipLink;
  MenuButton: typeof NavbarMenuButton;
};

export const Navbar: NavbarComponent = Object.assign(NavbarRoot, {
  Row: NavbarRow,
  Brand: NavbarBrand,
  Search: NavbarSearch,
  Links: NavbarLinks,
  Link: NavbarLink,
  Group: NavbarGroup,
  Actions: NavbarActions,
  Action: NavbarAction,
  PanelActions: NavbarPanelActions,
  SkipLink: NavbarSkipLink,
  MenuButton: NavbarMenuButton,
});
