import {
  ArrowSquareOutIcon,
  CaretLeftIcon,
  CaretRightIcon,
  CaretDownIcon,
  CaretUpDownIcon,
  ListIcon,
} from "@dbm-system/icons";
import { cx, mergeDefined, mergeRefs } from "@dbm-system/utils";
import { Slot } from "@radix-ui/react-slot";
import { cloneElement, forwardRef, isValidElement, useCallback, useContext, useEffect, useId, useMemo, useRef, useState } from "react";
import type { CSSProperties, ElementType, MouseEvent, ReactElement, ReactNode } from "react";
import { Avatar } from "../../atoms/Avatar";
import { Badge } from "../../atoms/Badge";
import { ButtonGroupProvider, useButtonGroup } from "../../atoms/Button/buttonGroupContext";
import type { BadgeProps } from "../../atoms/Badge";
import { Collapse } from "../../atoms/Collapse";
import { useDirection } from "../../atoms/DirectionProvider";
import { Icon } from "../../atoms/Icon";
import { Skeleton } from "../../atoms/Skeleton";
import { IconButton } from "../../atoms/IconButton";
import { Tooltip } from "../../atoms/Tooltip";
import type { TooltipSide } from "../../atoms/Tooltip";
import { VisuallyHidden } from "../../atoms/VisuallyHidden";
import { Drawer } from "../Drawer";
import { Menu } from "../Menu";
// Not part of the package's public surface: shared by path, so the rail's flyout gap is `Menu`'s own.
import { MENU_SIDE_OFFSET } from "../Menu/Menu";
import { blockDisabledClick, EXTERNAL_HREF_PATTERN } from "../../internal/linkGuard";
import styles from "./Sidebar.module.css";
import { holdsPath, matchesPath, rolledUpCount } from "./Sidebar.paths";
import {
  SidebarContext,
  SidebarGroupKeyContext,
  SidebarLevelContext,
  SidebarMenuContext,
  SidebarPanelContext,
  SidebarStateContext,
  defaultLabels,
  useSidebar,
  useSidebarContext,
  useSidebarStateContext,
} from "./SidebarContext";
import type { SidebarContextValue, SidebarStateContextValue } from "./SidebarContext";
import type {
  SidebarCollapseBelow,
  SidebarAccountProps,
  SidebarContentProps,
  SidebarCurrentVariant,
  SidebarFooterProps,
  SidebarGroupProps,
  SidebarHeaderProps,
  SidebarItemProps,
  SidebarMenuButtonProps,
  SidebarNavProps,
  SidebarProps,
  SidebarProviderProps,
  SidebarSectionProps,
  SidebarSeparatorProps,
  SidebarSize,
  SidebarSkeletonProps,
  SidebarToggleProps,
} from "./Sidebar.types";
import { useSidebarState } from "./useSidebarState";


/** How many groups may nest before the development warning: deeper than this is a tree, and `Tree` is its own component. */
const MAX_GROUP_DEPTH = 3;

const sizeClass: Record<SidebarSize, string | undefined> = {
  xs: styles.sizeXs,
  sm: styles.sizeSm,
  md: styles.sizeMd,
  lg: styles.sizeLg,
};

const iconSizeFor: Record<SidebarSize, "sm" | "md"> = { xs: "sm", sm: "sm", md: "md", lg: "md" };

/** The external-link mark and a group's caret, one step below the item's own icon (`icon-size`: 12, 16, 20px), so it reads as a marker beside the label and not as a second icon. */
const externalIconSizeFor: Record<SidebarSize, "xs" | "sm"> = { xs: "xs", sm: "xs", md: "sm", lg: "sm" };

const currentVariantClass: Record<SidebarCurrentVariant, string | undefined> = {
  subtle: undefined,
  bar: styles.currentBar,
  solid: styles.currentSolid,
};

const collapseClass: Record<SidebarCollapseBelow, string | undefined> = {
  sm: styles.collapseSm,
  md: styles.collapseMd,
  lg: styles.collapseLg,
  xl: styles.collapseXl,
  "2xl": styles.collapse2xl,
  "3xl": styles.collapse3xl,
  never: undefined,
};

const toggleClass: Record<SidebarCollapseBelow, string | undefined> = {
  sm: styles.toggleSm,
  md: styles.toggleMd,
  lg: styles.toggleLg,
  xl: styles.toggleXl,
  "2xl": styles.toggle2xl,
  "3xl": styles.toggle3xl,
  never: undefined,
};

const menuButtonClass: Record<SidebarCollapseBelow, string | undefined> = {
  sm: styles.menuButtonSm,
  md: styles.menuButtonMd,
  lg: styles.menuButtonLg,
  xl: styles.menuButtonXl,
  "2xl": styles.menuButton2xl,
  "3xl": styles.menuButton3xl,
  never: styles.menuButtonNever,
};

// The widths the `collapseBelow` steps stand for, the literal values of the breakpoint tokens (a media query can't read a custom
// property). Used only to close the phone panel when the page grows past the step, so it doesn't sit over a sidebar that is back on the page.
const collapseQuery: Record<Exclude<SidebarCollapseBelow, "never">, string> = {
  sm: "(min-width: 40rem)",
  md: "(min-width: 48rem)",
  lg: "(min-width: 64rem)",
  xl: "(min-width: 80rem)",
  "2xl": "(min-width: 96rem)",
  "3xl": "(min-width: 120rem)",
};

/** Whether a number of pixels or a CSS length was given, as the length to put in a style. */
function toLength(width: number | string): string {
  return typeof width === "number" ? `${width}px` : width;
}

/**
 * Whether an item has become the current one since it was drawn, and still is: true from the render in which `current` turns on until
 * it turns off, so a marker that grows in plays once and not for an item that was already current when it mounted (a first paint, or the
 * phone panel opening).
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

/** The side a rail's tooltip or flyout opens toward: away from the edge the sidebar sits against. */
function useOutwardSide(): Extract<TooltipSide, "left" | "right"> {
  const { side, dir } = useSidebarContext("Sidebar");
  return (side === "start") === (dir === "ltr") ? "right" : "left";
}

/** The gap, in pixels, between a rail's edge and the flyout or menu that opens beside it: `Menu`'s own default (so the two cannot drift), measured from the rail and not from the icon. */
const FLYOUT_GAP = MENU_SIDE_OFFSET;

/** How long a mouse rests on a rail before it peeks open, and how long after it leaves (or focus does) before it closes: long enough that crossing the rail does not open it and a short slip does not close it. */
const PEEK_OPEN_DELAY = 120;
const PEEK_CLOSE_DELAY = 200;

/** The most a rail's count shows before it reads "99+": three digits would be a wider mark than the rail has room for beside the icon. */
const RAIL_COUNT_MAX = 99;

/**
 * What a rail's flyout needs to open from the rail's own edge and not from the icon's: a ref for the button that opens it, the offset to give the
 * panel (the distance from the button to the rail's edge, plus the usual gap) and a function that measures it. The icon sits inside the rail's
 * padding, so an offset taken from the button alone would put the panel over the rail's edge; measuring (when it opens) keeps it right at every
 * size, and in a right-to-left or end-side sidebar, without a number of pixels written here.
 */
function useRailFlyoutOffset() {
  const side = useOutwardSide();
  const triggerRef = useRef<HTMLElement | null>(null);
  const [offset, setOffset] = useState(FLYOUT_GAP);
  const measure = useCallback(() => {
    const trigger = triggerRef.current;
    const root = trigger?.closest<HTMLElement>(`.${styles.root}`);
    if (!trigger || !root) return;
    const button = trigger.getBoundingClientRect();
    const rail = root.getBoundingClientRect();
    const inset = side === "right" ? rail.right - button.right : button.left - rail.left;
    setOffset(Math.max(0, Math.round(inset)) + FLYOUT_GAP);
  }, [side]);
  return { triggerRef, offset, measure };
}

/** Whether a count's text, once capped by `max`, is wider than two characters, so the rail's mark has to be a pill and not a circle. */
function isWideCount(content: ReactNode, max: number | undefined): boolean {
  if (typeof content === "number") return (max !== undefined && content > max ? `${max}+` : String(content)).length > 2;
  return typeof content === "string" && content.length > 2;
}

/**
 * The badge of an item or a group. A `Badge` passed as the badge is drawn as written (its tone, variant, `max`…), with the sidebar's size filled
 * in where it didn't say; anything else is the content of the sidebar's own badge (solid, brand; subtle on a current item drawn as a brand fill,
 * where a solid brand pill would vanish), so a pill is never inside a pill. In the rail a number over 99 reads "99+", and a mark wider than a
 * circle is set further out over the icon's corner so it does not cover the icon.
 */
function renderBadge(badge: ReactNode, rail: boolean, onSolidFill: boolean): ReactNode {
  if (badge === undefined || badge === null) return null;
  const own = isValidElement(badge) && badge.type === Badge;
  const props = own ? (badge as ReactElement<BadgeProps>).props : undefined;
  const max = own ? props?.max : rail && typeof badge === "number" ? RAIL_COUNT_MAX : undefined;
  const wide = rail && isWideCount(own ? props?.children : badge, max);
  const className = cx(rail ? styles.railBadge : styles.badge, wide && styles.railBadgeWide);
  if (own) {
    return cloneElement(badge as ReactElement<BadgeProps>, {
      size: props?.size ?? "xs",
      className: cx(className, props?.className),
    });
  }
  return (
    <Badge tone="brand" variant={onSolidFill ? "subtle" : "solid"} size="xs" max={max} className={className}>
      {badge}
    </Badge>
  );
}

/**
 * What an item or group needs to show the full text of a label the sidebar has cut short with an ellipsis: a ref for the label, and the
 * open state of a tooltip that opens only when the label really is cut (its content is wider than its box), so a short label never gets one.
 */
function useTruncationTooltip(enabled: boolean) {
  // The label is held in state through a callback ref, so reading it later (when the tooltip is asked to open) is an ordinary read.
  const [label, setLabel] = useState<HTMLSpanElement | null>(null);
  const [open, setOpen] = useState(false);
  const onOpenChange = useCallback(
    (next: boolean) => setOpen(next && enabled && label !== null && label.scrollWidth > label.clientWidth),
    [enabled, label],
  );
  return { setLabel, open, onOpenChange };
}

/**
 * The control a `Sidebar.Item`, `Sidebar.Group` or `Sidebar.Section` draws at the end of its row, beside the link and not inside it. The
 * buttons in it default to ghost, neutral and `xs`, through the same context a `ButtonGroup` hands its buttons (a button's own props win).
 */
function SidebarActionSlot({ children, className }: { children: ReactNode; className?: string }) {
  const parent = useButtonGroup();
  const buttons = useMemo(() => ({ ...parent, size: "xs" as const, variant: "ghost" as const, tone: "neutral" as const }), [parent]);
  return (
    <ButtonGroupProvider value={buttons}>
      <span className={cx(styles.action, className)}>{children}</span>
    </ButtonGroupProvider>
  );
}

/**
 * A page's persistent navigation column: a header, grouped and nested links with a current-page marker, and a footer. It can collapse
 * to a rail of icons (`collapsed`, the `Sidebar.Toggle` button) and, below the `collapseBelow` width, leaves the page for a menu
 * button and a side panel (a `Drawer`), so a phone gets a list it can reach with a thumb and the first paint of a server-rendered
 * page is already right (the switch is a stylesheet's).
 *
 * A compound component, meaning it is made of named sub-parts you compose together: `Sidebar.Header`, `Sidebar.Content` (scrolls on its
 * own) holding `Sidebar.Nav`s, and `Sidebar.Footer`; in a `Sidebar.Nav`, `Sidebar.Section`s (a heading over a list), `Sidebar.Item`s,
 * `Sidebar.Group`s of items (expandable, up to three deep) and `Sidebar.Separator`s; `Sidebar.Toggle` (the rail button) and
 * `Sidebar.MenuButton` (opens the phone panel). It is a plain `<div>`; each `Sidebar.Nav` is a named `<nav>` holding a list, and the
 * current page is `aria-current="page"`, marked by `currentVariant` (`subtle`, `bar` or `solid`) and, with `rounded`, as a pill. Items
 * are ordinary tab stops, not a roving group: this is the disclosure-navigation pattern, not a toolbar or a tree.
 *
 * The same children are drawn on the page and in the phone panel, so give the items no `id`. In the rail an item shows its icon alone,
 * with its text in a tooltip and as its accessible name, and a group opens as a floating `Menu`. When the toggle or menu button sits
 * outside the sidebar (in a `Navbar`), wrap the page in `Sidebar.Provider`, and read the state in your own parts with `useSidebar()`.
 *
 * Does not cover a bar of links across the top (`Navbar`), a data hierarchy with selection (`Tree`), or a whole page layout (a
 * template).
 *
 * @example
 * ```tsx
 * <Sidebar>
 *   <Sidebar.Header>dbM</Sidebar.Header>
 *   <Sidebar.Content>
 *     <Sidebar.Nav>
 *       <Sidebar.Item href="/" icon={HouseIcon} current>Home</Sidebar.Item>
 *       <Sidebar.Group label="Reports" icon={ChartBarIcon}>
 *         <Sidebar.Item href="/reports/sales">Sales</Sidebar.Item>
 *       </Sidebar.Group>
 *     </Sidebar.Nav>
 *   </Sidebar.Content>
 *   <Sidebar.Footer>
 *     <Sidebar.Toggle />
 *   </Sidebar.Footer>
 * </Sidebar>
 * ```
 */
const SidebarRoot = forwardRef<HTMLDivElement, SidebarProps>(
  (
    {
      children,
      variant = "outlined",
      size = "md",
      currentVariant = "subtle",
      currentPath,
      rounded = false,
      width,
      panelWidth,
      side = "start",
      peek = false,
      exclusive = false,
      collapsed,
      defaultCollapsed,
      onCollapsedChange,
      collapseBelow: ownCollapseBelow,
      menuOpen,
      defaultMenuOpen,
      onMenuOpenChange,
      onMenuOpenChangeComplete,
      closeMenuOnNavigate = true,
      menuContainer,
      sticky = false,
      stickyOffset = 0,
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
    const parent = useContext(SidebarStateContext);
    const own = useSidebarState({ collapsed, defaultCollapsed, onCollapsedChange, menuOpen, defaultMenuOpen, onMenuOpenChange });
    // Inside a `Sidebar.Provider` the provider holds the state, so the buttons outside the sidebar act on the same one.
    const { state, changeMenu, menuButtonRef } = parent ?? own;
    const collapseBelow = ownCollapseBelow ?? parent?.collapseBelow ?? "md";
    const resolvedLabels = mergeDefined(parent?.labels ?? defaultLabels, labels);
    // A rail with `peek` opens as an overlay while the pointer is over it or focus is inside it; to the parts inside it, it is then expanded.
    const [peeking, setPeeking] = useState(false);
    if (peeking && !(peek && state.collapsed)) setPeeking(false);
    const peekOpen = peek && state.collapsed && peeking;
    const railed = state.collapsed && !peekOpen;
    const closeMenu = useCallback(() => changeMenu(false, { reason: "close" }), [changeMenu]);
    const rootRef = useRef<HTMLDivElement | null>(null);
    // Whether focus is inside the column. Kept from the focus events and not read from the document when the width changes, because the browser
    // drops focus from a hidden element as soon as anything reads the page's layout, which can be before the width change is reported.
    const focusInside = useRef(false);

    useEffect(() => {
      if (process.env.NODE_ENV === "production" || parent === null) return;
      if (
        collapsed !== undefined ||
        defaultCollapsed !== undefined ||
        onCollapsedChange !== undefined ||
        menuOpen !== undefined ||
        defaultMenuOpen !== undefined ||
        onMenuOpenChange !== undefined
      ) {
        console.warn(
          "Sidebar: it is inside a `Sidebar.Provider`, which holds the collapsed and open state, so `collapsed`, `defaultCollapsed`, `menuOpen`, `defaultMenuOpen` and their change handlers on the sidebar are ignored. Put them on the provider.",
        );
      }
    });

    // Past the width where the sidebar is back on the page, a panel left open would sit over a column already on show. And below it the column
    // leaves the page (`display: none`): focus inside it would fall to the top of the document, so it goes to the menu button, which takes
    // the column's place.
    const menuIsOpen = state.menuOpen;
    useEffect(() => {
      if (collapseBelow === "never" || typeof window === "undefined" || !window.matchMedia) return undefined;
      const query = window.matchMedia(collapseQuery[collapseBelow]);
      const handleChange = (event: MediaQueryListEvent) => {
        if (event.matches) {
          if (menuIsOpen) closeMenu();
          return;
        }
        const root = rootRef.current;
        const active = document.activeElement;
        if (!root || !focusInside.current || !(active === document.body || active === null || root.contains(active))) return;
        const button = menuButtonRef.current;
        if (button?.isConnected && getComputedStyle(root).display === "none" && button.offsetParent !== null) {
          focusInside.current = false;
          button.focus();
        }
      };
      query.addEventListener("change", handleChange);
      return () => query.removeEventListener("change", handleChange);
    }, [menuIsOpen, collapseBelow, closeMenu, menuButtonRef]);

    // Which groups and collapsible sections are open, kept here (not in each copy) so the page and the phone panel agree and a rail that
    // expands keeps them; and the groups registered under each parent, so `exclusive` can shut a group's siblings.
    const [openState, setOpenStateRaw] = useState<Record<string, boolean>>({});
    const groups = useRef(new Map<string, { parent: string; count: number }>());
    const setOpenState = useCallback(
      (key: string, open: boolean, parentKey: string) =>
        setOpenStateRaw((previous) => {
          const next = { ...previous, [key]: open };
          if (open && exclusive) {
            for (const [other, { parent }] of groups.current) if (parent === parentKey && other !== key) next[other] = false;
          }
          return next;
        }),
      [exclusive],
    );
    const registerGroup = useCallback((key: string, parentKey: string) => {
      // The page's copy and the phone panel's copy of a group are two mounted components with one key.
      const known = groups.current.get(key);
      groups.current.set(key, { parent: parentKey, count: (known?.count ?? 0) + 1 });
      return () => {
        const entry = groups.current.get(key);
        if (!entry) return;
        if (entry.count <= 1) groups.current.delete(key);
        else groups.current.set(key, { ...entry, count: entry.count - 1 });
      };
    }, []);

    const rootMergedRef = useMemo(() => mergeRefs(ref, rootRef), [ref]);
    const peekTimer = useRef<number | undefined>(undefined);
    useEffect(() => () => window.clearTimeout(peekTimer.current), []);
    // Pointer and focus decide whether the rail peeks open. It closes only when neither is on it, and not while a menu opened from it is open
    // (the menu is drawn outside the sidebar, so the pointer is "outside" while it is in use).
    const askPeek = (open: boolean, delay: number) => {
      if (!peek || !state.collapsed) return;
      window.clearTimeout(peekTimer.current);
      peekTimer.current = window.setTimeout(() => {
        const element = rootRef.current;
        if (!open && element && (element.matches(":hover") || element.querySelector(":focus-visible") || element.querySelector("[aria-haspopup][aria-expanded='true']"))) return;
        setPeeking(open);
      }, delay);
    };

    const stateValue = useMemo<SidebarStateContextValue>(
      () => ({ state, changeMenu, collapseBelow, labels: resolvedLabels, menuButtonRef, hasSidebar: true }),
      // `mergeDefined` returns a fresh object each render; its strings are what the value really depends on.
      // eslint-disable-next-line react-hooks/exhaustive-deps
      [
        state,
        changeMenu,
        collapseBelow,
        resolvedLabels.navigation,
        resolvedLabels.collapse,
        resolvedLabels.expand,
        resolvedLabels.menu,
        resolvedLabels.close,
        resolvedLabels.externalLink,
        resolvedLabels.loading,
        menuButtonRef,
      ],
    );

    const contextValue = useMemo<SidebarContextValue>(
      () => ({
        size,
        currentVariant,
        currentPath,
        rounded,
        side,
        dir,
        railed,
        closeMenuOnNavigate,
        menuContainer,
        closeMenu,
        exclusive,
        openState,
        setOpenState,
        registerGroup,
      }),
      [size, currentVariant, currentPath, rounded, side, dir, railed, closeMenuOnNavigate, menuContainer, closeMenu, exclusive, openState, setOpenState, registerGroup],
    );
    // The panel is never a rail, whatever the page's sidebar is.
    const panelContextValue = useMemo<SidebarContextValue>(() => ({ ...contextValue, railed: false }), [contextValue]);

    const rootStyle = {
      ...(width !== undefined ? { "--sidebar-width": toLength(width) } : {}),
      ...(sticky ? { "--sidebar-sticky-offset": typeof stickyOffset === "string" ? stickyOffset : `var(--dbm-space-${stickyOffset})` } : {}),
      ...style,
    } as CSSProperties;

    // The phone panel is its own width when given one, else the column's, else the token: a panel and a column that match unless asked not to.
    const drawerSize =
      panelWidth !== undefined ? toLength(panelWidth) : width !== undefined ? toLength(width) : "var(--dbm-sidebar-width)";

    // The panel opens with focus on its first item, not on whatever the browser would pick: Radix's focus scope skips links when it chooses
    // where to begin, which would land a keyboard user on the first group's button, or on the close button, below the navigation they came for.
    const panelRef = useRef<HTMLDivElement>(null);

    // The phone panel hands focus back to the menu button that opened it, wherever that button is; it is not the Drawer's own trigger. It does so
    // only if focus is still in the panel or has fallen to the page (the panel was removed with focus in it): a close that something else caused
    // (a page change the shell answered by moving focus to the new page's main area) has already put focus where the reader should be, and
    // taking it back to the button would undo that ("a late hand-back returns focus only if it is still here", `06` §9). Radix's own return,
    // to a trigger this panel does not have, is always stopped.
    const returnFocus = (event: Event) => {
      event.preventDefault();
      const button = menuButtonRef.current;
      const active = document.activeElement;
      const focusIsStillHere = active === null || active === document.body || panelRef.current?.contains(active) === true;
      if (button?.isConnected && focusIsStillHere) button.focus();
    };

    const focusFirstItem = (event: Event) => {
      const first = panelRef.current?.querySelector<HTMLElement>("nav a[href], nav button:not([disabled])");
      if (first) {
        event.preventDefault();
        first.focus();
      }
    };

    return (
      <SidebarStateContext.Provider value={stateValue}>
        <SidebarContext.Provider value={contextValue}>
          {/* The pointer and focus handlers only listen, to let a rail peek open (`peek`); the box is not a control, and everything in it is. */}
          {/* eslint-disable-next-line jsx-a11y/no-static-element-interactions */}
          <div
            {...props}
            ref={rootMergedRef}
            dir={dir}
            data-variant={variant}
            data-side={side}
            data-collapsed={state.collapsed ? "" : undefined}
            data-peeking={peekOpen ? "" : undefined}
            onPointerEnter={(event) => {
              props.onPointerEnter?.(event);
              if (event.pointerType === "mouse") askPeek(true, PEEK_OPEN_DELAY);
            }}
            onPointerLeave={(event) => {
              props.onPointerLeave?.(event);
              askPeek(false, PEEK_CLOSE_DELAY);
            }}
            onFocus={(event) => {
              props.onFocus?.(event);
              focusInside.current = true;
              if (event.target.matches(":focus-visible")) askPeek(true, 0);
            }}
            onBlur={(event) => {
              props.onBlur?.(event);
              if (!event.currentTarget.contains(event.relatedTarget)) {
                // A blur because the column was hidden by a width change is not the reader moving on: focus is still theirs to be handed over.
                if (getComputedStyle(event.currentTarget).display !== "none") focusInside.current = false;
                askPeek(false, PEEK_CLOSE_DELAY);
              }
            }}
            onKeyDown={(event) => {
              props.onKeyDown?.(event);
              if (event.key === "Escape" && peekOpen) setPeeking(false);
            }}
            className={cx(
              styles.root,
              sizeClass[size],
              variant === "outlined" && styles.outlined,
              variant === "filled" && styles.filled,
              variant === "ghost" && styles.ghost,
              variant === "floating" && styles.floating,
              railed && styles.rail,
              peek && state.collapsed && styles.peekable,
              peekOpen && styles.peeking,
              sticky && styles.sticky,
              collapseClass[collapseBelow],
              className,
            )}
            style={rootStyle}
          >
            {children}
          </div>
          {collapseBelow !== "never" && (
            <Drawer open={state.menuOpen} onOpenChange={changeMenu} onOpenChangeComplete={onMenuOpenChangeComplete}>
              <Drawer.Content
                side={side}
                size={drawerSize}
                dir={dir}
                container={menuContainer}
                labels={{ close: resolvedLabels.close }}
                aria-describedby={undefined}
                onOpenAutoFocus={focusFirstItem}
                onCloseAutoFocus={returnFocus}
              >
                <Drawer.Header>
                  <Drawer.Title>{resolvedLabels.menu}</Drawer.Title>
                </Drawer.Header>
                <Drawer.Body className={styles.panelBody}>
                  <SidebarContext.Provider value={panelContextValue}>
                    <SidebarPanelContext.Provider value>
                      <div ref={panelRef} className={cx(styles.panelRoot, sizeClass[size])}>
                        {children}
                      </div>
                    </SidebarPanelContext.Provider>
                  </SidebarContext.Provider>
                </Drawer.Body>
              </Drawer.Content>
            </Drawer>
          )}
        </SidebarContext.Provider>
      </SidebarStateContext.Provider>
    );
  },
);
SidebarRoot.displayName = "Sidebar";

/**
 * Holds the sidebar's collapsed and open state for a page, so a `Sidebar.Toggle` or `Sidebar.MenuButton` outside the sidebar (in a
 * `Navbar`) acts on it. Optional: a `Sidebar` with no provider holds its own. Wrap the page shell in it, and read the state in your own
 * parts with `useSidebar()`.
 */
function SidebarProvider({ children, collapseBelow = "md", labels, ...stateProps }: SidebarProviderProps) {
  const { state, changeMenu, menuButtonRef } = useSidebarState(stateProps);
  const resolvedLabels = mergeDefined(defaultLabels, labels);
  const value = useMemo<SidebarStateContextValue>(
    () => ({ state, changeMenu, collapseBelow, labels: resolvedLabels, menuButtonRef, hasSidebar: false }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [
      state,
      changeMenu,
      collapseBelow,
      resolvedLabels.navigation,
      resolvedLabels.collapse,
      resolvedLabels.expand,
      resolvedLabels.menu,
      resolvedLabels.close,
      resolvedLabels.externalLink,
      resolvedLabels.loading,
      menuButtonRef,
    ],
  );
  return <SidebarStateContext.Provider value={value}>{children}</SidebarStateContext.Provider>;
}
SidebarProvider.displayName = "Sidebar.Provider";

/** The top of the sidebar: a brand, a workspace switcher. It stays in view above the scrolling content. */
const SidebarHeader = forwardRef<HTMLDivElement, SidebarHeaderProps>(({ className, ...props }, ref) => (
  <div {...props} ref={ref} className={cx(styles.header, className)} />
));
SidebarHeader.displayName = "Sidebar.Header";

/**
 * The middle of the sidebar, which scrolls on its own when its navigation is taller than the room, so the header and footer stay in view.
 * It is the browser's own scrolling, not a scroll area with a part of its own: the items are the focusable things, so the region needs no
 * tab stop of its own, and a label can be cut with an ellipsis against the region's real width. In the phone panel the panel's body
 * scrolls instead.
 */
const SidebarContent = forwardRef<HTMLDivElement, SidebarContentProps>(({ className, ...props }, ref) => {
  const inPanel = useContext(SidebarPanelContext);
  return <div {...props} ref={ref} className={cx(styles.content, inPanel && styles.panelContent, className)} />;
});
SidebarContent.displayName = "Sidebar.Content";

/** The bottom of the sidebar, which stays in view below the scrolling content: an account menu, a help link, the toggle. */
const SidebarFooter = forwardRef<HTMLDivElement, SidebarFooterProps>(({ className, ...props }, ref) => (
  <div {...props} ref={ref} className={cx(styles.footer, className)} />
));
SidebarFooter.displayName = "Sidebar.Footer";

/**
 * A navigation: a named `<nav>` holding a list of `Sidebar.Item`s, `Sidebar.Group`s, `Sidebar.Section`s and `Sidebar.Separator`s. A
 * sidebar can hold several (a main one and a settings one); give each its own `aria-label` so they are told apart.
 */
const SidebarNav = forwardRef<HTMLElement, SidebarNavProps>(
  ({ children, className, "aria-label": ariaLabel, "aria-labelledby": ariaLabelledBy, ...props }, ref) => {
    const { labels } = useSidebarStateContext("Sidebar.Nav");
    const name = ariaLabelledBy === undefined ? (ariaLabel ?? labels.navigation) : ariaLabel;
    return (
      <nav {...props} ref={ref} aria-label={name} aria-labelledby={ariaLabelledBy} className={cx(styles.nav, className)}>
        {/* `role="list"` and `role="listitem"` are redundant on paper; Safari with VoiceOver drops list semantics under `list-style: none`. */}
        {/* eslint-disable-next-line jsx-a11y/no-redundant-roles */}
        <ul role="list" className={styles.list}>
          {children}
        </ul>
      </nav>
    );
  },
);
SidebarNav.displayName = "Sidebar.Nav";

/**
 * A heading over a list of items. In the rail the heading is hidden (it still names the list) and a line sets the section apart from the
 * one before it.
 */
const SidebarSection = forwardRef<HTMLLIElement, SidebarSectionProps>(
  ({ label, action, collapsible = false, open: openProp, defaultOpen = true, onOpenChange, value, children, className, ...props }, ref) => {
    const headingId = useId();
    const listId = useId();
    const { railed, size, openState, setOpenState } = useSidebarContext("Sidebar.Section");
    // A collapsible section's fold is kept for the whole sidebar, by its `value` or its label, so the page and the phone panel agree.
    const key = value !== undefined ? `section:${value}` : typeof label === "string" ? `section:${label}` : undefined;
    useEffect(() => {
      if (process.env.NODE_ENV === "production") return;
      if (collapsible && key === undefined) {
        console.warn(
          "Sidebar.Section: a collapsible section whose `label` is not plain text keeps a separate fold on the page and in the phone panel. Pass a `value` (any string) to share it.",
        );
      }
    }, [collapsible, key]);
    const [localOpen, setLocalOpen] = useState(defaultOpen);
    const stored = key !== undefined ? openState[key] : undefined;
    const open = openProp ?? stored ?? (key !== undefined ? defaultOpen : localOpen);
    // The rail has no headings to press, so it always shows every list.
    const folds = collapsible && !railed;
    const toggle = () => {
      const next = !open;
      if (openProp === undefined) {
        if (key !== undefined) setOpenState(key, next, "");
        else setLocalOpen(next);
      }
      onOpenChange?.(next);
    };
    const list = (
      // `role="list"` is redundant on paper; see `Sidebar.Nav`.
      // eslint-disable-next-line jsx-a11y/no-redundant-roles
      <ul role="list" id={listId} aria-labelledby={headingId} className={styles.list}>
        {children}
      </ul>
    );
    return (
      // `role="listitem"` and `role="list"` are redundant on paper; see `Sidebar.Nav`.
      // eslint-disable-next-line jsx-a11y/no-redundant-roles
      <li {...props} ref={ref} role="listitem" className={cx(styles.section, className)}>
        <div className={styles.sectionHead}>
          {folds ? (
            <button type="button" className={styles.sectionToggle} aria-expanded={open} aria-controls={listId} onClick={toggle}>
              <span id={headingId} className={styles.sectionLabel}>
                {label}
              </span>
              <Icon icon={CaretDownIcon} size={externalIconSizeFor[size]} className={styles.caret} />
            </button>
          ) : (
            <div id={headingId} className={styles.sectionLabel}>
              {label}
            </div>
          )}
          {action !== undefined && action !== null && !railed && <SidebarActionSlot className={styles.sectionAction}>{action}</SidebarActionSlot>}
        </div>
        {folds ? <Collapse asChild open={open}>{list}</Collapse> : list}
      </li>
    );
  },
);
SidebarSection.displayName = "Sidebar.Section";

/** A line between two parts of a list. Decorative: it is not announced. */
const SidebarSeparator = forwardRef<HTMLLIElement, SidebarSeparatorProps>(({ className, ...props }, ref) => (
  <li {...props} ref={ref} aria-hidden="true" className={cx(styles.separator, className)} />
));
SidebarSeparator.displayName = "Sidebar.Separator";

const SKELETON_WIDTHS = ["72%", "56%", "84%", "64%", "48%"];

/**
 * A placeholder for navigation that is still loading: rows the height of an item, each an icon and a line of text of a different length, that
 * pulse. It goes where the items will, inside a `Sidebar.Nav` or a `Sidebar.Section`, and is replaced by them when they arrive. It is hidden from
 * assistive technology except for one polite "Loading" status (the `loading` label), and is busy. In the rail only the icons are drawn.
 */
const SidebarSkeleton = forwardRef<HTMLLIElement, SidebarSkeletonProps>(({ rows = 5, animated = true, className, ...props }, ref) => {
  const { railed } = useSidebarContext("Sidebar.Skeleton");
  const { labels } = useSidebarStateContext("Sidebar.Skeleton");
  const animation = animated ? "pulse" : "none";
  return (
    // eslint-disable-next-line jsx-a11y/no-redundant-roles
    <li {...props} ref={ref} role="listitem" aria-busy="true" className={cx(styles.skeleton, className)}>
      <VisuallyHidden role="status">{labels.loading}</VisuallyHidden>
      <div aria-hidden="true" className={styles.skeletonRows}>
        {Array.from({ length: Math.max(0, Math.floor(rows)) }, (_, index) => (
          <div key={index} className={cx(styles.skeletonRow, railed && styles.railItem)}>
            <Skeleton variant="circular" width="var(--sidebar-icon)" height="var(--sidebar-icon)" animation={animation} className={styles.skeletonIcon} />
            {!railed && <Skeleton variant="text" width={SKELETON_WIDTHS[index % SKELETON_WIDTHS.length]} animation={animation} className={styles.skeletonText} />}
          </div>
        ))}
      </div>
    </li>
  );
});
SidebarSkeleton.displayName = "Sidebar.Skeleton";

/**
 * One item of the navigation: a link (`href`), or a button when it has none. `current` marks the page the reader is on
 * (`aria-current="page"`); `disabled` blocks the click and keeps the item in the tab order, as `Link` does; `asChild` puts the look on a
 * router's link. It takes an `icon` before its text (all the rail shows), a `badge` after it and an `external` mark (worked out from
 * `href`). In the rail its text moves to a tooltip and stays its accessible name. Inside a rail group's floating menu it is an item of
 * that menu.
 */
const SidebarItem = forwardRef<HTMLElement, SidebarItemProps>(
  (
    {
      current: currentProp,
      match,
      disabled = false,
      asChild = false,
      icon,
      description,
      badge,
      action,
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
    const { size, currentVariant, currentPath, rounded, railed, closeMenuOnNavigate, closeMenu } = useSidebarContext("Sidebar.Item");
    const { labels } = useSidebarStateContext("Sidebar.Item");
    // An item's own `current` always wins; left out, the sidebar's `currentPath` decides.
    const current = currentProp ?? matchesPath(href, currentPath, match);
    const inPanel = useContext(SidebarPanelContext);
    const closeFlyout = useContext(SidebarMenuContext);
    const inMenu = closeFlyout !== null;
    const tooltipSide = useOutwardSide();
    const grows = useBecameCurrent(current);
    const isLink = href !== undefined;
    const isExternal = !asChild && isLink && (external ?? EXTERNAL_HREF_PATTERN.test(href));
    // One of three elements chosen at run time; `ElementType` keeps the anchor and button attribute sets from fighting over `type`.
    const Component: ElementType = asChild ? Slot : isLink ? "a" : "button";
    const rail = railed && !inMenu;
    const label = typeof children === "string" || typeof children === "number" ? String(children) : null;
    const { setLabel, open: tipOpen, onOpenChange: onTipOpenChange } = useTruncationTooltip(!rail && !inMenu && !asChild && label !== null);
    const hasAction = action !== undefined && action !== null && !rail && !inMenu;
    const descriptionId = useId();
    const hasDescription = description !== undefined && description !== null && !asChild && !inMenu;
    const describedBy = [props["aria-describedby"], hasDescription ? descriptionId : undefined].filter(Boolean).join(" ") || undefined;

    useEffect(() => {
      if (process.env.NODE_ENV === "production") return;
      if (rail && !icon && !asChild && label === null) {
        console.warn("Sidebar.Item: in the rail an item with no `icon` and no plain-text label has nothing to show. Give every item an `icon`.");
      }
    });

    // Capture-phase, so it runs before a slotted child's own `onClick` (a router's navigation), as `Link`'s does.
    const handleClickCapture = (event: MouseEvent<HTMLElement>) => {
      if (!blockDisabledClick(event, disabled)) onClickCapture?.(event as never);
    };

    // An item chosen in the phone panel closes it. `preventDefault` doesn't stop that: a router's link calls it to navigate without a page
    // load, which is exactly the link that should close the panel. Only a link does it, though: a button (an action) leaves the panel open.
    const handleClick = (event: MouseEvent<HTMLElement>) => {
      onClick?.(event as never);
      if (inPanel && closeMenuOnNavigate && (event.currentTarget as HTMLElement).matches("a[href]")) closeMenu();
      if (closeFlyout && event.defaultPrevented) closeFlyout();
    };

    const iconNode = icon ? (
      <Icon icon={icon} size={iconSizeFor[size]} className={styles.icon} />
    ) : rail && label !== null ? (
      <span aria-hidden="true" className={cx(styles.icon, styles.initial)}>
        {label.trim().charAt(0).toUpperCase()}
      </span>
    ) : null;

    const badgeNode = renderBadge(badge, rail, current && currentVariant === "solid");

    const itemClass = cx(
      !inMenu && styles.item,
      !inMenu && rail && styles.railItem,
      !inMenu && rounded && styles.rounded,
      !inMenu && current && styles.current,
      !inMenu && current && currentVariantClass[currentVariant],
      !inMenu && current && grows && styles.currentGrow,
      inMenu && current && styles.menuCurrent,
      hasAction && styles.hasAction,
      disabled && styles.disabled,
      className,
    );

    const element = (
      <Component
        {...props}
        {...(asChild
          ? {}
          : isLink
            ? { href, target: target ?? (isExternal ? "_blank" : undefined), rel: rel ?? (isExternal ? "noopener noreferrer" : undefined) }
            : { type: "button" })}
        ref={ref as never}
        aria-current={current ? "page" : undefined}
        aria-disabled={disabled || undefined}
        aria-describedby={describedBy}
        onClick={handleClick}
        onClickCapture={handleClickCapture}
        className={itemClass}
      >
        {asChild ? (
          children
        ) : (
          <>
            {iconNode}
            <span className={cx(styles.itemText, hasDescription && styles.hasDescription)}>
              <span ref={setLabel} className={cx(styles.label, rail && styles.hiddenText)}>
                {children}
              </span>
              {hasDescription && (
                <span id={descriptionId} aria-hidden="true" className={cx(styles.description, rail && styles.hiddenText)}>
                  {description}
                </span>
              )}
            </span>
            {badgeNode}
            {isExternal && (
              <>
                {!rail && <Icon icon={ArrowSquareOutIcon} size={externalIconSizeFor[size]} className={styles.trailingIcon} />}
                <VisuallyHidden> {labels.externalLink}</VisuallyHidden>
              </>
            )}
          </>
        )}
      </Component>
    );

    // Inside a rail group's floating list the item is a menu item (arrow keys, typeahead, closing on choice) and not a list item.
    if (inMenu) {
      return (
        <Menu.Item asChild disabled={disabled}>
          {element}
        </Menu.Item>
      );
    }

    const tooltipContent = asChild ? props["aria-label"] : children;
    // In the rail the text is the tooltip. Expanded, it is one only when the label is cut with an ellipsis, so the full text can still be read.
    const withTooltip =
      rail && tooltipContent !== undefined && tooltipContent !== null ? (
        <Tooltip content={tooltipContent} side={tooltipSide}>
          {element}
        </Tooltip>
      ) : label !== null && !rail && !asChild ? (
        <Tooltip content={label} side={tooltipSide} open={tipOpen} onOpenChange={onTipOpenChange}>
          {element}
        </Tooltip>
      ) : (
        element
      );

    return (
      // `role="listitem"` is redundant on paper; see `Sidebar.Nav`.
      // eslint-disable-next-line jsx-a11y/no-redundant-roles
      <li role="listitem" className={styles.listItem}>
        {withTooltip}
        {hasAction && <SidebarActionSlot>{action}</SidebarActionSlot>}
      </li>
    );
  },
);
SidebarItem.displayName = "Sidebar.Item";

/**
 * An item that opens more items: a button with `aria-expanded` that shows its items indented beneath it, animated. Groups nest, up to
 * three deep. In the rail, where there is no room to expand, a top-level group is an icon button that opens a floating `Menu` of its items
 * (arrow keys, typeahead, `Escape`), a nested group in it a submenu. Give it a `label` and `Sidebar.Item` children; a group is a button
 * only, so a page that is also a parent is the group's first item.
 */
const SidebarGroup = forwardRef<HTMLButtonElement, SidebarGroupProps>(
  (
    {
      label,
      icon,
      badge,
      action,
      value,
      current: currentProp,
      open: openProp,
      defaultOpen,
      onOpenChange,
      disabled = false,
      className,
      children,
      onClick,
      ...props
    },
    ref,
  ) => {
    const { size, currentVariant, currentPath, rounded, railed, dir, menuContainer, openState, setOpenState, registerGroup } =
      useSidebarContext("Sidebar.Group");
    // A group's own `current` always wins; left out, it holds the current page when one of the items written inside it is.
    const current = currentProp ?? holdsPath(children, currentPath);
    const level = useContext(SidebarLevelContext);
    const closeFlyout = useContext(SidebarMenuContext);
    const tooltipSide = useOutwardSide();
    // A group is named by its value, or by its label under the labels of the groups it is inside. That name keys its open state in the sidebar, so
    // the page's copy and the phone panel's copy share it (and a rail that expands keeps it); a group whose label is not text has no name and
    // keeps its own.
    const parentKey = useContext(SidebarGroupKeyContext);
    const key = value ?? (typeof label === "string" ? `${parentKey}/${label}` : undefined);
    const [uncontrolledOpen, setUncontrolledOpen] = useState(defaultOpen ?? current);
    const [flyoutOpen, setFlyoutOpen] = useState(false);
    const isControlled = openProp !== undefined;
    const stored = key !== undefined ? openState[key] : undefined;
    const open = isControlled ? openProp : (stored ?? (key !== undefined ? (defaultOpen ?? current) : uncontrolledOpen));
    useEffect(() => (key !== undefined ? registerGroup(key, parentKey) : undefined), [key, parentKey, registerGroup]);
    const grows = useBecameCurrent(current);
    const regionId = useId();
    const closeThisFlyout = useCallback(() => setFlyoutOpen(false), []);
    const { setLabel, open: tipOpen, onOpenChange: onTipOpenChange } = useTruncationTooltip(!railed && closeFlyout === null && typeof label === "string");
    const hasAction = action !== undefined && action !== null && !railed && closeFlyout === null;
    const flyout = useRailFlyoutOffset();
    const buttonRef = useMemo(() => mergeRefs(ref, flyout.triggerRef), [ref, flyout.triggerRef]);
    // The group's own badge, else the total of its items' counts (none when there is no number to add or the total is nothing).
    const rolledUp = badge === undefined ? rolledUpCount(children) : undefined;
    const shownBadge = badge !== undefined ? badge : rolledUp ? rolledUp : null;

    useEffect(() => {
      if (process.env.NODE_ENV === "production") return;
      if (level >= MAX_GROUP_DEPTH) {
        console.warn(
          `Sidebar.Group: groups are nested more than ${MAX_GROUP_DEPTH} deep. A hierarchy that deep is a tree, not a list of links; flatten it or use a \`Tree\`.`,
        );
      }
    });

    // A group nested in a rail group's floating list is a submenu of it.
    if (closeFlyout !== null) {
      return (
        <Menu.Sub>
          <Menu.SubTrigger icon={icon} disabled={disabled} className={cx(current && styles.menuCurrent, className)}>
            {label}
          </Menu.SubTrigger>
          <Menu.SubContent container={menuContainer}>
            <SidebarLevelContext.Provider value={level + 1}>{children}</SidebarLevelContext.Provider>
          </Menu.SubContent>
        </Menu.Sub>
      );
    }

    const iconNode = icon ? (
      <Icon icon={icon} size={iconSizeFor[size]} className={styles.icon} />
    ) : railed ? (
      <span aria-hidden="true" className={cx(styles.icon, styles.initial)}>
        {typeof label === "string" ? label.trim().charAt(0).toUpperCase() : ""}
      </span>
    ) : null;

    const buttonClass = (marked: boolean) =>
      cx(
        styles.item,
        styles.groupButton,
        hasAction && styles.hasAction,
        railed && styles.railItem,
        rounded && styles.rounded,
        marked && styles.current,
        marked && currentVariantClass[currentVariant],
        marked && grows && styles.currentGrow,
        className,
      );

    // The rail: an icon button that opens a floating list. The group's text is the list's title and the button's tooltip and name.
    if (railed) {
      return (
        // eslint-disable-next-line jsx-a11y/no-redundant-roles
        <li role="listitem" className={styles.listItem}>
          <Menu
            dir={dir}
            open={flyoutOpen}
            onOpenChange={(next) => {
              if (next) flyout.measure();
              setFlyoutOpen(next);
            }}
          >
            <Tooltip content={label} side={tooltipSide}>
              <Menu.Trigger asChild disabled={disabled}>
                <button {...props} ref={buttonRef} type="button" disabled={disabled} className={buttonClass(current)}>
                  {iconNode}
                  <span className={cx(styles.label, styles.hiddenText)}>{label}</span>
                  {renderBadge(shownBadge, true, false)}
                </button>
              </Menu.Trigger>
            </Tooltip>
            <Menu.Content side={tooltipSide} align="start" sideOffset={flyout.offset} container={menuContainer}>
              <Menu.Label>{label}</Menu.Label>
              <SidebarMenuContext.Provider value={closeThisFlyout}>
                <SidebarLevelContext.Provider value={level + 1}>{children}</SidebarLevelContext.Provider>
              </SidebarMenuContext.Provider>
            </Menu.Content>
          </Menu>
        </li>
      );
    }

    // Expanded: a button that opens its items beneath it. The group that holds the current page marks its button only while it is shut, so
    // the page itself (the item inside) is the one thing marked once it is on show.
    return (
      // eslint-disable-next-line jsx-a11y/no-redundant-roles
      <li role="listitem" className={cx(styles.listItem, styles.groupItem)}>
        <Tooltip content={label} side={tooltipSide} open={tipOpen} onOpenChange={onTipOpenChange}>
          <button
            {...props}
            ref={ref}
            type="button"
            disabled={disabled}
            aria-expanded={open}
            aria-controls={regionId}
            className={buttonClass(current && !open)}
            onClick={(event) => {
              onClick?.(event);
              const next = !open;
              if (!isControlled) {
                if (key !== undefined) setOpenState(key, next, parentKey);
                else setUncontrolledOpen(next);
              }
              onOpenChange?.(next);
            }}
          >
            {iconNode}
            <span ref={setLabel} className={styles.label}>
              {label}
            </span>
            {!open && renderBadge(shownBadge, false, current && currentVariant === "solid")}
            <Icon icon={CaretDownIcon} size={externalIconSizeFor[size]} className={styles.caret} />
          </button>
        </Tooltip>
        {hasAction && <SidebarActionSlot>{action}</SidebarActionSlot>}
        <Collapse asChild open={open}>
          {/* eslint-disable-next-line jsx-a11y/no-redundant-roles */}
          <ul role="list" id={regionId} className={cx(styles.list, styles.groupList)}>
            <SidebarGroupKeyContext.Provider value={key ?? parentKey}>
              <SidebarLevelContext.Provider value={level + 1}>{children}</SidebarLevelContext.Provider>
            </SidebarGroupKeyContext.Provider>
          </ul>
        </Collapse>
      </li>
    );
  },
);
SidebarGroup.displayName = "Sidebar.Group";

/**
 * An account or workspace switcher: a button with an avatar, a name and a quieter line beneath it, which opens a `Menu` of the items you
 * put inside it (the account's profile, a workspace to switch to, sign out). It goes in a `Sidebar.Header` or `Sidebar.Footer`. In the rail
 * it is the avatar alone, with the name as its tooltip and its accessible name, and the menu opens beside the rail. With no children it is a
 * plain button for your own `onClick`.
 */
// The default avatar is as wide as an item at every step (its own `xs` is 36px, an item's `md` box), so the rail's account is one item wide and
// its button is as wide as the picture in it.
const accountAvatarStyle = { "--avatar-dimension-base": "var(--sidebar-item-box)" } as CSSProperties;

const SidebarAccount = forwardRef<HTMLButtonElement, SidebarAccountProps>(
  ({ name, description, avatar, src, menuSide, children, className, ...props }, ref) => {
    const { railed, dir, menuContainer } = useSidebarContext("Sidebar.Account");
    const outward = useOutwardSide();
    const [menuOpen, setMenuOpen] = useState(false);
    const flyout = useRailFlyoutOffset();
    const buttonRef = useMemo(() => mergeRefs(ref, flyout.triggerRef), [ref, flyout.triggerRef]);
    const button = (
      <button {...props} ref={buttonRef} type="button" className={cx(styles.item, styles.account, railed && styles.railItem, className)}>
        <span className={styles.accountAvatar}>{avatar ?? <Avatar name={name} src={src} size="xs" style={accountAvatarStyle} />}</span>
        <span className={cx(styles.accountText, railed && styles.hiddenText)}>
          <span className={styles.accountName}>{name}</span>
          {description && <span className={styles.accountDescription}>{description}</span>}
        </span>
        {!railed && children !== undefined && <Icon icon={CaretUpDownIcon} size="xs" className={styles.trailingIcon} />}
      </button>
    );
    // In the rail the name is the tooltip; a menu's trigger sits inside it as the rail's groups' do.
    const withTooltip = (trigger: ReactElement) =>
      railed ? (
        <Tooltip content={name} side={outward}>
          {trigger}
        </Tooltip>
      ) : (
        trigger
      );
    if (children === undefined || children === null) return withTooltip(button);
    return (
      <Menu
        dir={dir}
        open={menuOpen}
        onOpenChange={(next) => {
          if (next) flyout.measure();
          setMenuOpen(next);
        }}
      >
        {withTooltip(<Menu.Trigger asChild>{button}</Menu.Trigger>)}
        <Menu.Content
          side={menuSide ?? (railed ? outward : "top")}
          align="start"
          sideOffset={menuSide === undefined && railed ? flyout.offset : undefined}
          container={menuContainer}
        >
          <SidebarMenuContext.Provider value={() => setMenuOpen(false)}>{children}</SidebarMenuContext.Provider>
        </Menu.Content>
      </Menu>
    );
  },
);
SidebarAccount.displayName = "Sidebar.Account";

/**
 * The button that collapses the sidebar to a rail and expands it again: an `IconButton` whose caret points toward the edge the
 * sidebar sits against while it is open. It is hidden below the `collapseBelow` width, where the sidebar is a panel and has no rail, and
 * in the panel itself. Put it in the header or the footer, or outside the sidebar inside a `Sidebar.Provider`.
 */
const SidebarToggle = forwardRef<HTMLButtonElement, SidebarToggleProps>(
  ({ collapseIcon, expandIcon, variant = "ghost", tone = "neutral", size: ownSize, className, onClick, "aria-label": ariaLabel, ...props }, ref) => {
    const { state, labels, collapseBelow } = useSidebarStateContext("Sidebar.Toggle");
    const sidebar = useContext(SidebarContext);
    const inPanel = useContext(SidebarPanelContext);
    if (inPanel) return null;
    const side = sidebar?.side ?? "start";
    const dir = sidebar?.dir ?? "ltr";
    // The caret points toward the edge the sidebar sits against while it is open (to collapse it), and away from it while it is a rail.
    const towardEdgeIsLeft = (side === "start") === (dir === "ltr");
    const pointsLeft = state.collapsed ? !towardEdgeIsLeft : towardEdgeIsLeft;
    const name = ariaLabel ?? (state.collapsed ? labels.expand : labels.collapse);
    return (
      <IconButton
        {...props}
        ref={ref}
        icon={(state.collapsed ? expandIcon : collapseIcon) ?? (pointsLeft ? CaretLeftIcon : CaretRightIcon)}
        variant={variant}
        tone={tone}
        size={ownSize ?? sidebar?.size ?? "md"}
        aria-label={name}
        tooltip
        tooltipSide={towardEdgeIsLeft ? "right" : "left"}
        className={cx(toggleClass[collapseBelow], sidebar !== null && styles.toggleBox, className)}
        onClick={(event) => {
          onClick?.(event);
          if (!event.defaultPrevented) state.toggleCollapsed();
        }}
      />
    );
  },
);
SidebarToggle.displayName = "Sidebar.Toggle";

/**
 * The button that opens the phone panel below the `collapseBelow` width, an `IconButton`; hidden from that width up, where the sidebar is on
 * the page. It sits outside the sidebar (in a `Navbar`, a page header) inside a `Sidebar.Provider`, and the panel gives focus back to it
 * when it closes.
 */
const SidebarMenuButton = forwardRef<HTMLButtonElement, SidebarMenuButtonProps>(
  ({ icon = ListIcon, variant = "ghost", tone, size: ownSize, className, onClick, "aria-label": ariaLabel, ...props }, ref) => {
    const { state, labels, collapseBelow, menuButtonRef } = useSidebarStateContext("Sidebar.MenuButton");
    const sidebar = useContext(SidebarContext);
    return (
      <IconButton
        {...props}
        ref={(node) => {
          menuButtonRef.current = node ?? menuButtonRef.current;
          if (typeof ref === "function") ref(node);
          else if (ref) ref.current = node;
        }}
        icon={icon}
        variant={variant}
        tone={tone}
        size={ownSize ?? sidebar?.size ?? "md"}
        aria-label={ariaLabel ?? labels.menu}
        aria-haspopup="dialog"
        aria-expanded={state.menuOpen}
        className={cx(menuButtonClass[collapseBelow], className)}
        onClick={(event) => {
          onClick?.(event);
          if (event.defaultPrevented) return;
          menuButtonRef.current = event.currentTarget;
          state.setMenuOpen(true);
        }}
      />
    );
  },
);
SidebarMenuButton.displayName = "Sidebar.MenuButton";

type SidebarComponent = typeof SidebarRoot & {
  Provider: typeof SidebarProvider;
  Header: typeof SidebarHeader;
  Content: typeof SidebarContent;
  Footer: typeof SidebarFooter;
  Nav: typeof SidebarNav;
  Section: typeof SidebarSection;
  Item: typeof SidebarItem;
  Group: typeof SidebarGroup;
  Account: typeof SidebarAccount;
  Separator: typeof SidebarSeparator;
  Skeleton: typeof SidebarSkeleton;
  Toggle: typeof SidebarToggle;
  MenuButton: typeof SidebarMenuButton;
};

export const Sidebar: SidebarComponent = Object.assign(SidebarRoot, {
  Provider: SidebarProvider,
  Header: SidebarHeader,
  Content: SidebarContent,
  Footer: SidebarFooter,
  Nav: SidebarNav,
  Section: SidebarSection,
  Item: SidebarItem,
  Group: SidebarGroup,
  Account: SidebarAccount,
  Separator: SidebarSeparator,
  Skeleton: SidebarSkeleton,
  Toggle: SidebarToggle,
  MenuButton: SidebarMenuButton,
});

export { useSidebar };
