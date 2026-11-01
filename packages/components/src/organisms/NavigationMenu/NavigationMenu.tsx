import { ArrowRightIcon, ArrowSquareOutIcon, CaretDownIcon } from "@dbm-system/icons";
import { cx, mergeDefined, mergeRefs, useResolvedResponsiveValue } from "@dbm-system/utils";
import * as Primitive from "@radix-ui/react-navigation-menu";
import { Slot } from "@radix-ui/react-slot";
import {
  Children,
  cloneElement,
  forwardRef,
  isValidElement,
  useCallback,
  useContext,
  useEffect,
  useId,
  useImperativeHandle,
  useMemo,
  useRef,
  useState,
} from "react";
import type { ComponentPropsWithoutRef, CSSProperties, FocusEvent, MouseEvent, PointerEvent, ReactElement, ReactNode, RefObject } from "react";
import { Badge } from "../../atoms/Badge";
import type { BadgeProps } from "../../atoms/Badge";
import { Collapse } from "../../atoms/Collapse";
import { Icon } from "../../atoms/Icon";
import { VisuallyHidden } from "../../atoms/VisuallyHidden";
import { blockDisabledClick, EXTERNAL_HREF_PATTERN } from "../../internal/linkGuard";
import { useNavigationEmbed } from "../../internal/navigationEmbed";
import styles from "./NavigationMenu.module.css";
import {
  NavigationMenuContentContext,
  NavigationMenuContext,
  NavigationMenuItemContext,
  defaultLabels,
  useNavigationMenuContext,
} from "./NavigationMenuContext";
import type { NavigationMenuContextValue } from "./NavigationMenuContext";
import type {
  NavigationMenuContentProps,
  NavigationMenuController,
  NavigationMenuCurrentMatch,
  NavigationMenuCurrentVariant,
  NavigationMenuFeatureProps,
  NavigationMenuFooterProps,
  NavigationMenuGroupProps,
  NavigationMenuItemProps,
  NavigationMenuLinkProps,
  NavigationMenuListProps,
  NavigationMenuPanelAlign,
  NavigationMenuPanelSize,
  NavigationMenuProps,
  NavigationMenuSize,
  NavigationMenuTriggerProps,
} from "./NavigationMenu.types";

/** How long the pointer rests on a trigger or link before `onIntent` is called. */
const INTENT_DELAY_MS = 100;

const sizeClass: Record<NavigationMenuSize, string> = {
  xs: styles.sizeXs!,
  sm: styles.sizeSm!,
  md: styles.sizeMd!,
  lg: styles.sizeLg!,
  xl: styles.sizeXl!,
};

const currentVariantClass: Record<NavigationMenuCurrentVariant, string> = {
  subtle: styles.currentSubtle!,
  underline: styles.currentUnderline!,
  solid: styles.currentSolid!,
};

const splitVariantClass: Record<NavigationMenuCurrentVariant, string> = {
  subtle: styles.splitSubtle!,
  underline: styles.splitUnderline!,
  solid: styles.splitSolid!,
};

const panelSizeClass: Record<NavigationMenuPanelSize, string | undefined> = {
  auto: undefined,
  sm: styles.panelSm,
  md: styles.panelMd,
  lg: styles.panelLg,
  full: styles.panelFull,
};

// --- Which link is the current page ------------------------------------------------------------------------------------------

/** The same-site path of an address, without its query, hash or trailing slash; `null` for a hash, an empty one or another site. */
function sitePath(href: string | undefined): string | null {
  if (href === undefined || href === "" || href.startsWith("#") || EXTERNAL_HREF_PATTERN.test(href)) return null;
  const path = href.split("#")[0]!.split("?")[0]!;
  if (path === "") return null;
  return path.length > 1 && path.endsWith("/") ? path.slice(0, -1) : path;
}

function matchesCurrent(currentPath: string | undefined, href: string | undefined, mode: NavigationMenuCurrentMatch): boolean {
  const here = sitePath(currentPath);
  const target = sitePath(href);
  if (here === null || target === null) return false;
  if (mode === "prefix" && target !== "/") return here === target || here.startsWith(`${target}/`);
  return here === target;
}

/** Whether a link somewhere in these children is the current page. Links wrapped in a component of your own are not seen. */
function holdsCurrent(node: ReactNode, currentPath: string | undefined, mode: NavigationMenuCurrentMatch): boolean {
  let found = false;
  Children.forEach(node, (child) => {
    if (found || !isValidElement(child)) return;
    const props = child.props as { current?: boolean; href?: string; children?: ReactNode };
    if (child.type === NavigationMenuLink || child.type === NavigationMenuTrigger) {
      found = props.current ?? matchesCurrent(currentPath, props.href, mode);
      return;
    }
    if (props.children !== undefined) found = holdsCurrent(props.children, currentPath, mode);
  });
  return found;
}

// --- Room ------------------------------------------------------------------------------------------------------------------------

/**
 * Tells a panel how much room there is, in custom properties the stylesheet caps its width and height with: the width from the
 * element it hangs from to the edge of what can show it (the window, narrowed by any ancestor that clips) on the side it grows toward (centred, twice the distance to the nearer edge; beside a
 * vertical menu, what is left beyond it), and the height below it. A panel is positioned from its menu or item and not from the
 * screen, so without them a panel wider or taller than the room runs off the screen instead of wrapping its links or scrolling. With
 * `auto` it also settles which side to grow toward. Written onto the element directly, from an effect, so a server render has none.
 */
function useRoom(
  ref: RefObject<HTMLElement | null>,
  enabled: boolean,
  choice: NavigationMenuPanelAlign,
  open: boolean,
  vertical: boolean,
  full: boolean,
): "start" | "center" | "end" {
  const [resolved, setResolved] = useState<"start" | "center" | "end">(choice === "auto" ? "start" : choice);
  useEffect(() => {
    const element = ref.current;
    if (!enabled || element === null) return;
    // What can show a panel is the window narrowed by every ancestor that clips: a box that scrolls or hides its overflow (a demo's
    // frame, a page's scrolling main) ends the room at its own edge, which is narrower than the window.
    const clippers: HTMLElement[] = [];
    for (let node = element.parentElement; node !== null && node !== document.body && node !== document.documentElement; node = node.parentElement) {
      const style = getComputedStyle(node);
      if (style.overflowX !== "visible" || style.overflowY !== "visible") clippers.push(node);
    }
    const update = () => {
      let left = 0;
      let top = 0;
      let right = document.documentElement.clientWidth;
      let bottom = window.innerHeight;
      for (const clipper of clippers) {
        const box = clipper.getBoundingClientRect();
        left = Math.max(left, box.left);
        top = Math.max(top, box.top);
        right = Math.min(right, box.right);
        bottom = Math.min(bottom, box.bottom);
      }
      const rect = element.getBoundingClientRect();
      const rtl = getComputedStyle(element).direction === "rtl";
      const toEnd = rtl ? rect.right - left : right - rect.left;
      const toStart = rtl ? right - rect.left : rect.right - left;
      const side = choice === "auto" ? (toEnd < toStart ? "end" : "start") : choice;
      let room = side === "end" ? toStart : toEnd;
      if (side === "center") {
        const middle = (rect.left + rect.right) / 2;
        room = 2 * Math.min(middle - left, right - middle);
      }
      if (vertical) room = rtl ? rect.left - left : right - rect.right;
      element.style.setProperty("--navigation-menu-room", `${Math.max(0, Math.floor(room))}px`);
      const blockRoom = vertical ? bottom - rect.top : bottom - rect.bottom;
      element.style.setProperty("--navigation-menu-room-block", `${Math.max(0, Math.floor(blockRoom))}px`);
      if (full) element.style.setProperty("--navigation-menu-full", `${element.offsetParent?.clientWidth ?? right - left}px`);
      setResolved(side);
    };
    update();
    window.addEventListener("resize", update);
    const observer = new ResizeObserver(update);
    for (const clipper of clippers) observer.observe(clipper);
    // The room below moves as the page scrolls, which only matters while a panel is open.
    if (open) window.addEventListener("scroll", update, { passive: true, capture: true });
    return () => {
      window.removeEventListener("resize", update);
      window.removeEventListener("scroll", update, { capture: true });
      observer.disconnect();
      for (const name of ["--navigation-menu-room", "--navigation-menu-room-block", "--navigation-menu-full"]) element.style.removeProperty(name);
    };
  }, [ref, enabled, choice, open, vertical, full]);
  return resolved;
}

// --- Intent --------------------------------------------------------------------------------------------------------------------

/** Calls `onIntent` when a mouse has rested on the element for a moment, or it takes focus: the moment to prefetch what it leads to. */
function useIntent(onIntent: (() => void) | undefined) {
  const handler = useRef(onIntent);
  const timer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  useEffect(() => {
    handler.current = onIntent;
  });
  useEffect(() => () => clearTimeout(timer.current), []);
  return useMemo(
    () => ({
      enter: (event: PointerEvent<HTMLElement>) => {
        if (handler.current === undefined || event.pointerType !== "mouse") return;
        clearTimeout(timer.current);
        timer.current = setTimeout(() => handler.current?.(), INTENT_DELAY_MS);
      },
      leave: () => clearTimeout(timer.current),
      focus: (_event: FocusEvent<HTMLElement>) => handler.current?.(),
    }),
    [],
  );
}

// --- Shared drawing ------------------------------------------------------------------------------------------------------------

/** A badge you pass is drawn as written (its tone, variant, `max`…) with the size filled in; anything else is a solid brand badge's content. */
function renderBadge(badge: ReactNode) {
  if (badge === undefined || badge === null) return null;
  if (isValidElement(badge) && badge.type === Badge) {
    return cloneElement(badge as ReactElement<BadgeProps>, { size: (badge as ReactElement<BadgeProps>).props.size ?? "xs" });
  }
  return (
    <Badge tone="brand" variant="solid" size="xs">
      {badge}
    </Badge>
  );
}

interface SelectableAnchorProps extends Omit<ComponentPropsWithoutRef<"a">, "onSelect"> {
  asChild?: boolean;
  current?: boolean;
  disabled?: boolean;
  onSelect?: (event: Event) => void;
  onIntent?: () => void;
}

/**
 * The anchor every link-like part draws on: choosing it closes the panel (in the stacked form, the open item and, in a bar's phone
 * menu, the menu), unless `onSelect` calls `preventDefault()`. The caller's own `onClick` is on the element inside the primitive's
 * link, merged by the slot and not composed by the primitive, so a handler that prevents the default (a router's does) never stops
 * the panel closing.
 */
const SelectableAnchor = forwardRef<HTMLAnchorElement, SelectableAnchorProps>(
  (
    {
      asChild = false,
      current = false,
      disabled = false,
      onSelect,
      onIntent,
      onClick,
      onClickCapture,
      onPointerEnter,
      onPointerLeave,
      onFocus,
      children,
      ...props
    },
    ref,
  ) => {
    const { stacked, setValue, closePanel } = useNavigationMenuContext("NavigationMenu.Link");
    const intent = useIntent(onIntent);
    const Element = asChild ? Slot : "a";
    const common = {
      ...props,
      ref,
      "aria-current": current ? ("page" as const) : undefined,
      "aria-disabled": disabled || undefined,
      onClickCapture: (event: MouseEvent<HTMLAnchorElement>) => {
        if (!blockDisabledClick(event, disabled)) onClickCapture?.(event);
      },
      onPointerEnter: (event: PointerEvent<HTMLAnchorElement>) => {
        onPointerEnter?.(event);
        intent.enter(event);
      },
      onPointerLeave: (event: PointerEvent<HTMLAnchorElement>) => {
        onPointerLeave?.(event);
        intent.leave();
      },
      onFocus: (event: FocusEvent<HTMLAnchorElement>) => {
        onFocus?.(event);
        intent.focus(event);
      },
    };

    if (stacked) {
      return (
        <Element
          {...common}
          onClick={(event: MouseEvent<HTMLAnchorElement>) => {
            onClick?.(event);
            const selection = new Event("navigationMenu.linkSelect", { cancelable: true });
            onSelect?.(selection);
            if (selection.defaultPrevented) return;
            setValue("");
            closePanel?.();
          }}
        >
          {children}
        </Element>
      );
    }

    return (
      <Primitive.Link asChild active={current} onSelect={onSelect}>
        <Element {...common} onClick={onClick}>
          {children}
        </Element>
      </Primitive.Link>
    );
  },
);
SelectableAnchor.displayName = "NavigationMenu.SelectableAnchor";

// --- The parts -----------------------------------------------------------------------------------------------------------------

/**
 * The site-header navigation with panels: a row of triggers each opening a panel of grouped links under it (a mega menu), or a
 * link that goes straight to a page. It follows the disclosure-navigation pattern (a `<nav>` of a list, buttons with
 * `aria-expanded`), not `role="menu"`: use `Menu` for a list of actions and `Navbar.Group` for a short dropdown of links.
 *
 * Opens on hover (after a short rest), on a press, or with Enter, Space or the Down arrow; `Escape` closes it and returns focus to
 * its trigger. Left and Right move between the triggers and top-level links; `Tab` goes into the open panel.
 *
 * Drawn on its own it is a bar of triggers. Put it inside `Navbar.Links` and it follows the bar's look, and in the bar's phone menu
 * it becomes the stacked form (`presentation="stacked"`), a vertical list of disclosure buttons, so one set of items serves both.
 *
 * @example
 * <NavigationMenu aria-label="Primary">
 *   <NavigationMenu.List>
 *     <NavigationMenu.Item>
 *       <NavigationMenu.Trigger>Products</NavigationMenu.Trigger>
 *       <NavigationMenu.Content>
 *         <NavigationMenu.Group label="Platform" columns={2}>
 *           <NavigationMenu.Link href="/analytics" description="Dashboards for every team">Analytics</NavigationMenu.Link>
 *           <NavigationMenu.Link href="/automation" description="Workflows that run themselves">Automation</NavigationMenu.Link>
 *         </NavigationMenu.Group>
 *       </NavigationMenu.Content>
 *     </NavigationMenu.Item>
 *     <NavigationMenu.Item>
 *       <NavigationMenu.Link href="/pricing" current>Pricing</NavigationMenu.Link>
 *     </NavigationMenu.Item>
 *   </NavigationMenu.List>
 * </NavigationMenu>
 */
const NavigationMenuRoot = forwardRef<HTMLElement, NavigationMenuProps>(
  (
    {
      children,
      value: valueProp,
      defaultValue = "",
      onValueChange,
      onOpenChangeComplete,
      controllerRef,
      presentation = "mega",
      exclusive = true,
      viewport = true,
      panelAlign: panelAlignChoice = "start",
      panelSize = "auto",
      orientation = "horizontal",
      indicator = false,
      currentPath,
      currentMatch = "exact",
      size = "md",
      currentVariant: ownCurrentVariant = "underline",
      rounded: ownRounded = false,
      delayDuration = 200,
      skipDelayDuration = 300,
      dir: ownDir = "ltr",
      labels,
      className,
      "aria-label": ariaLabel,
      "aria-labelledby": ariaLabelledBy,
      ...props
    },
    ref,
  ) => {
    const embed = useNavigationEmbed();
    const embedded = embed !== null;
    const resolvedPresentation = useResolvedResponsiveValue(presentation, "mega");
    const stacked = (embed?.inPanel ?? false) || resolvedPresentation === "stacked";
    const currentVariant = embed?.currentVariant ?? ownCurrentVariant;
    const rounded = embed?.rounded ?? ownRounded;
    const dir = embed?.dir ?? ownDir;
    const mergedLabels = useMemo(() => mergeDefined(defaultLabels, labels), [labels]);
    const name = ariaLabelledBy === undefined ? (ariaLabel ?? mergedLabels.navigation) : ariaLabel;

    const controlled = valueProp !== undefined;
    const [inner, setInner] = useState(defaultValue);
    const [interacted, setInteracted] = useState(false);
    const value = controlled ? valueProp : inner;
    const vertical = orientation === "vertical" && !stacked;
    const rootRef = useRef<HTMLElement | null>(null);
    const panelAlign = useRoom(rootRef, !stacked && viewport, panelAlignChoice, value !== "", vertical, panelSize === "full");
    const mergedRef = useMemo(() => mergeRefs(ref, rootRef), [ref]);
    const setValue = useCallback(
      (next: string) => {
        if (next === value) return;
        setInteracted(true);
        if (!controlled) setInner(next);
        onValueChange?.(next);
      },
      [controlled, value, onValueChange],
    );

    // Code outside the menu: one object, whose methods read the latest state.
    const latest = useRef({ value, setValue });
    useEffect(() => {
      latest.current = { value, setValue };
    });
    const controller = useMemo<NavigationMenuController>(
      () => ({
        open: (next) => {
          if (latest.current.value === next) return false;
          latest.current.setValue(next);
          return true;
        },
        close: () => {
          if (latest.current.value === "") return false;
          latest.current.setValue("");
          return true;
        },
        get value() {
          return latest.current.value;
        },
      }),
      [],
    );
    useImperativeHandle(controllerRef, () => controller, [controller]);

    // Reports a panel once its entrance or exit is over: after the animations the change started have finished.
    const completion = useRef(onOpenChangeComplete);
    const previous = useRef(value);
    useEffect(() => {
      completion.current = onOpenChangeComplete;
    });
    useEffect(() => {
      const before = previous.current;
      previous.current = value;
      if (before === value) return;
      let cancelled = false;
      void (async () => {
        await new Promise<void>((resolve) => requestAnimationFrame(() => resolve()));
        // A page without the Web Animations API (a test DOM) has nothing to wait for.
        const animations = typeof rootRef.current?.getAnimations === "function" ? rootRef.current.getAnimations({ subtree: true }) : [];
        await Promise.allSettled(animations.map((animation) => animation.finished));
        if (!cancelled) completion.current?.(value !== "", value !== "" ? value : before);
      })();
      return () => {
        cancelled = true;
      };
    }, [value]);

    const context = useMemo<NavigationMenuContextValue>(
      () => ({
        stacked,
        embedded,
        viewport,
        panelAlign,
        panelAlignChoice,
        panelSize,
        orientation: vertical ? "vertical" : "horizontal",
        indicator,
        exclusive,
        controlled,
        interacted,
        size,
        currentVariant,
        rounded,
        dir,
        labels: mergedLabels,
        delayDuration,
        currentPath,
        currentMatch,
        value,
        setValue,
        closePanel: embed?.closePanel ?? null,
      }),
      [
        stacked,
        embedded,
        viewport,
        panelAlign,
        panelAlignChoice,
        panelSize,
        vertical,
        indicator,
        exclusive,
        controlled,
        interacted,
        size,
        currentVariant,
        rounded,
        dir,
        mergedLabels,
        delayDuration,
        currentPath,
        currentMatch,
        value,
        setValue,
        embed?.closePanel,
      ],
    );

    // Inside a bar's links the bar sets the text size; anywhere else (and in the bar's phone menu) the menu's own `size` does.
    const rootClass = cx(
      styles.root,
      (!embedded || stacked) && sizeClass[size],
      embedded && !stacked && styles.embedded,
      stacked && styles.stackedRoot,
      !stacked && vertical && styles.vertical,
      !stacked && panelSize === "full" && styles.rootFull,
      className,
    );

    if (stacked) {
      const stackedProps = { ...props, className: rootClass, ref: mergedRef as never };
      return (
        <NavigationMenuContext.Provider value={context}>
          {embedded ? (
            // `role="listitem"` is redundant on paper; Safari with VoiceOver drops list semantics under `list-style: none`.
            // eslint-disable-next-line jsx-a11y/no-redundant-roles
            <li {...stackedProps} role="listitem">
              {children}
            </li>
          ) : (
            <nav {...stackedProps} dir={dir} aria-label={name} aria-labelledby={ariaLabelledBy}>
              {children}
            </nav>
          )}
        </NavigationMenuContext.Provider>
      );
    }

    const panelArea = viewport && (
      <div className={styles.viewportFrame} data-align={panelAlign}>
        <Primitive.Viewport className={styles.viewport} />
      </div>
    );
    const primitiveProps = {
      value,
      onValueChange: setValue,
      dir,
      orientation,
      delayDuration,
      skipDelayDuration,
    };

    return (
      <NavigationMenuContext.Provider value={context}>
        {embedded ? (
          <Primitive.Root asChild {...primitiveProps}>
            {/* eslint-disable-next-line jsx-a11y/no-redundant-roles */}
            <li {...props} ref={mergedRef as never} role="listitem" className={rootClass}>
              {children}
              {panelArea}
            </li>
          </Primitive.Root>
        ) : (
          <Primitive.Root {...props} ref={mergedRef} aria-label={name} aria-labelledby={ariaLabelledBy} {...primitiveProps} className={rootClass}>
            {children}
            {panelArea}
          </Primitive.Root>
        )}
      </NavigationMenuContext.Provider>
    );
  },
);
NavigationMenuRoot.displayName = "NavigationMenu";

/** The row of items. A list, with `role="list"` stated so Safari keeps its list semantics. */
const NavigationMenuList = forwardRef<HTMLUListElement, NavigationMenuListProps>(({ className, children, ...props }, ref) => {
  const { stacked, indicator, viewport, orientation } = useNavigationMenuContext("NavigationMenu.List");
  // eslint-disable-next-line jsx-a11y/no-redundant-roles
  if (stacked) return <ul {...props} ref={ref} role="list" className={cx(styles.list, styles.stackedList, className)}>{children}</ul>;
  return (
    <Primitive.List {...props} ref={ref} role="list" className={cx(styles.list, className)}>
      {children}
      {indicator && viewport && orientation === "horizontal" && (
        <Primitive.Indicator className={styles.indicator}>
          <span className={styles.arrow} />
        </Primitive.Indicator>
      )}
    </Primitive.List>
  );
});
NavigationMenuList.displayName = "NavigationMenu.List";

/** One entry of the list: a trigger with its panel, or a link. */
const NavigationMenuItem = forwardRef<HTMLLIElement, NavigationMenuItemProps>(
  ({ value: valueProp, defaultOpen, panelAlign: ownAlign, className, children, ...props }, ref) => {
    const menu = useNavigationMenuContext("NavigationMenu.Item");
    const { stacked, viewport, value: openValue, setValue, controlled, exclusive, interacted, currentPath, currentMatch } = menu;
    const itemRef = useRef<HTMLLIElement | null>(null);
    const itemMergedRef = useMemo(() => mergeRefs(ref, itemRef), [ref]);
    const generated = useId();
    const value = valueProp ?? generated;
    const contentId = useId();
    // An item that holds the current page starts expanded in the stacked form, unless it was told not to.
    const holds = holdsCurrent(children, currentPath, currentMatch);
    const [local, setLocal] = useState(defaultOpen ?? holds);
    const own = useRoom(itemRef, !stacked && !viewport, ownAlign ?? menu.panelAlignChoice, openValue === value, menu.orientation === "vertical", false);

    const isValue = openValue === value;
    // In the stacked form an item is open when the menu says so, or (uncontrolled) when it was opened or started open and not since closed.
    let open = isValue;
    if (stacked && !controlled) open = isValue || (exclusive ? local && !interacted && openValue === "" : local);
    const toggle = useCallback(() => {
      if (open) {
        setLocal(false);
        if (isValue) setValue("");
        else if (exclusive) setValue("");
      } else {
        setLocal(true);
        setValue(value);
      }
    }, [open, isValue, exclusive, setValue, value]);

    const item = useMemo(
      () => ({ value, contentId, open, toggle, holdsCurrent: holds, panelAlign: own }),
      [value, contentId, open, toggle, holds, own],
    );
    // Without a shared panel area each panel hangs from its own item, which is then what the panel is positioned against.
    const itemClass = cx(styles.item, !stacked && !viewport && styles.itemAnchor, className);
    return (
      <NavigationMenuItemContext.Provider value={item}>
        {stacked ? (
          // eslint-disable-next-line jsx-a11y/no-redundant-roles
          <li {...props} ref={itemMergedRef} role="listitem" className={cx(itemClass, styles.stackedItem)}>
            {children}
          </li>
        ) : (
          <Primitive.Item {...props} ref={itemMergedRef} value={value} role="listitem" className={itemClass}>
            {children}
          </Primitive.Item>
        )}
      </NavigationMenuItemContext.Provider>
    );
  },
);
NavigationMenuItem.displayName = "NavigationMenu.Item";

/**
 * The button that opens an item's panel. `aria-expanded` is stated here after the props, so the open state is always true to what
 * is drawn. With an `href` it is a split trigger: the text is a link and a caret button beside it opens the panel. `current` marks
 * the item that holds the page the reader is on, and follows the item's panel when it is left out.
 */
const NavigationMenuTrigger = forwardRef<HTMLButtonElement, NavigationMenuTriggerProps>(
  (
    {
      icon,
      badge,
      href,
      current: ownCurrent,
      disabled = false,
      onIntent,
      delayDuration: ownDelay,
      className,
      children,
      onClick,
      onPointerEnter,
      onPointerLeave,
      onPointerMove,
      onFocus,
      ...props
    },
    ref,
  ) => {
    const { stacked, value: openValue, setValue, currentVariant, rounded, labels, delayDuration, currentPath, currentMatch } =
      useNavigationMenuContext("NavigationMenu.Trigger");
    const item = useContext(NavigationMenuItemContext);
    if (item === null) throw new Error("NavigationMenu.Trigger must be used inside NavigationMenu.Item.");
    const { open } = item;
    // A split trigger's own link counts too: the trigger is current when its address is the page or a link in its panel is.
    const linkCurrent = ownCurrent ?? matchesCurrent(currentPath, href, currentMatch);
    const current = ownCurrent ?? (linkCurrent || item.holdsCurrent);
    const intent = useIntent(onIntent);
    const hoverTimer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
    const closeTimer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
    const caretRef = useRef<HTMLButtonElement | null>(null);
    const caretMergedRef = useMemo(() => mergeRefs(ref, caretRef), [ref]);
    useEffect(
      () => () => {
        clearTimeout(hoverTimer.current);
        clearTimeout(closeTimer.current);
      },
      [],
    );
    const delay = ownDelay ?? delayDuration;
    const split = href !== undefined;
    const classes = cx(
      styles.link,
      styles.trigger,
      rounded && styles.rounded,
      current && styles.current,
      current && currentVariantClass[currentVariant],
      className,
    );
    const body = (
      <>
        {icon && <Icon icon={icon} size="sm" />}
        {children}
        {renderBadge(badge)}
      </>
    );
    const caret = <Icon icon={CaretDownIcon} size="xs" className={styles.caret} />;
    const toggleName = labels.togglePanel(typeof children === "string" ? children : "Menu");

    // The pointer handlers the trigger adds to the primitive's own: the intent callback, and (with its own `delayDuration`) the opening.
    const handlers = {
      onPointerEnter: (event: PointerEvent<HTMLButtonElement>) => {
        onPointerEnter?.(event);
        intent.enter(event);
      },
      onPointerMove: (event: PointerEvent<HTMLButtonElement>) => {
        onPointerMove?.(event);
        // The primitive opens a panel after the menu's delay; a trigger with its own takes the opening over, and says so by preventing
        // the default so the primitive's handler stands down. A panel already open elsewhere is still replaced at once, by the primitive.
        if (ownDelay === undefined || event.pointerType !== "mouse" || disabled || openValue !== "") return;
        event.preventDefault();
        if (hoverTimer.current === undefined) {
          hoverTimer.current = setTimeout(() => {
            hoverTimer.current = undefined;
            setValue(item.value);
          }, ownDelay);
        }
      },
      onPointerLeave: (event: PointerEvent<HTMLButtonElement>) => {
        onPointerLeave?.(event);
        intent.leave();
        clearTimeout(hoverTimer.current);
        hoverTimer.current = undefined;
      },
      onFocus: (event: FocusEvent<HTMLButtonElement>) => {
        onFocus?.(event);
        intent.focus(event);
      },
    };

    if (split) {
      // The link opens the panel when the pointer rests on it, and closes it when the pointer has gone to neither the caret nor the panel.
      const linkEnter = (event: PointerEvent<HTMLAnchorElement>) => {
        if (event.pointerType !== "mouse" || disabled) return;
        clearTimeout(closeTimer.current);
        if (open || stacked) return;
        clearTimeout(hoverTimer.current);
        hoverTimer.current = setTimeout(() => setValue(item.value), openValue === "" ? delay : 0);
      };
      const linkLeave = () => {
        clearTimeout(hoverTimer.current);
        if (stacked || !open) return;
        closeTimer.current = setTimeout(() => {
          const panel = document.getElementById(caretRef.current?.getAttribute("aria-controls") ?? "");
          if (!caretRef.current?.matches(":hover") && !panel?.matches(":hover")) setValue("");
        }, 200);
      };
      const link = (
        <SelectableAnchor
          href={href}
          current={linkCurrent}
          disabled={disabled}
          onIntent={onIntent}
          onPointerEnter={linkEnter}
          onPointerLeave={linkLeave}
          className={cx(styles.link, styles.splitLink, rounded && styles.rounded, current && styles.current, current && currentVariantClass[currentVariant])}
        >
          {body}
        </SelectableAnchor>
      );
      const caretButton = stacked ? (
        <button
          {...props}
          ref={caretMergedRef}
          type="button"
          disabled={disabled}
          aria-expanded={open}
          aria-controls={item.contentId}
          aria-label={toggleName}
          className={cx(styles.link, styles.trigger, styles.splitCaret, rounded && styles.rounded)}
          onClick={(event: MouseEvent<HTMLButtonElement>) => {
            onClick?.(event);
            item.toggle();
          }}
        >
          {caret}
        </button>
      ) : (
        <Primitive.Trigger
          {...props}
          ref={caretMergedRef}
          disabled={disabled}
          aria-expanded={open}
          aria-label={toggleName}
          onClick={onClick}
          className={cx(styles.link, styles.trigger, styles.splitCaret, rounded && styles.rounded)}
        >
          {caret}
        </Primitive.Trigger>
      );
      return (
        <span
          className={cx(styles.split, rounded && styles.rounded, current && styles.splitCurrent, current && splitVariantClass[currentVariant])}
          data-open={open || undefined}
        >
          {link}
          {caretButton}
        </span>
      );
    }

    if (stacked) {
      return (
        <button
          {...props}
          ref={ref}
          type="button"
          disabled={disabled}
          aria-expanded={open}
          aria-controls={item.contentId}
          className={classes}
          onClick={(event: MouseEvent<HTMLButtonElement>) => {
            onClick?.(event);
            item.toggle();
          }}
        >
          {body}
          {caret}
        </button>
      );
    }

    return (
      <Primitive.Trigger {...props} {...handlers} ref={ref} disabled={disabled} aria-expanded={open} onClick={onClick} className={classes}>
        {body}
        {caret}
      </Primitive.Trigger>
    );
  },
);
NavigationMenuTrigger.displayName = "NavigationMenu.Trigger";

const isFooter = (child: ReactNode) => isValidElement(child) && child.type === NavigationMenuFooter;

/**
 * An item's panel: drawn in the menu's shared panel area (or under its own item) while open, inline beneath its trigger when
 * stacked. A `NavigationMenu.Footer` among its direct children is drawn under the rest.
 */
const NavigationMenuContent = forwardRef<HTMLDivElement, NavigationMenuContentProps>(
  ({ className, children, layout = "stack", forceMount, onEscapeKeyDown, onPointerDownOutside, onFocusOutside, onInteractOutside, ...props }, ref) => {
    const { stacked, viewport, panelSize } = useNavigationMenuContext("NavigationMenu.Content");
    const item = useContext(NavigationMenuItemContext);
    if (item === null) throw new Error("NavigationMenu.Content must be used inside NavigationMenu.Item.");
    const kids = Children.toArray(children);
    const inner = (
      <NavigationMenuContentContext.Provider value>
        <div className={styles.contentBody} data-layout={stacked ? undefined : layout}>
          {kids.filter((child) => !isFooter(child))}
        </div>
        {kids.filter(isFooter)}
      </NavigationMenuContentContext.Provider>
    );

    if (stacked) {
      return (
        <Collapse {...props} ref={ref} open={item.open} id={item.contentId} className={cx(styles.stackedContent, className)}>
          {inner}
        </Collapse>
      );
    }

    return (
      <Primitive.Content
        {...props}
        ref={ref}
        forceMount={forceMount}
        onEscapeKeyDown={onEscapeKeyDown}
        onPointerDownOutside={onPointerDownOutside}
        onFocusOutside={onFocusOutside}
        onInteractOutside={onInteractOutside}
        data-align={item.panelAlign}
        className={cx(styles.content, !viewport && styles.contentOwn, panelSizeClass[panelSize], className)}
      >
        {inner}
      </Primitive.Content>
    );
  },
);
NavigationMenuContent.displayName = "NavigationMenu.Content";

/**
 * A link. As a top-level item it is drawn like a trigger; in a panel it is a row with an icon, a description and a badge. Choosing
 * it closes the panel (and, in a `Navbar`'s phone menu, the menu), unless `onSelect` calls `event.preventDefault()`. With
 * `currentPath` on the menu it is the current page when its `href` is that path.
 */
const NavigationMenuLink = forwardRef<HTMLAnchorElement, NavigationMenuLinkProps>(
  (
    { current: ownCurrent, disabled = false, asChild = false, icon, description, descriptionLines, badge, external, href, target, rel, onIntent, className, children, ...props },
    ref,
  ) => {
    const { currentVariant, rounded, labels, currentPath, currentMatch } = useNavigationMenuContext("NavigationMenu.Link");
    const inPanel = useContext(NavigationMenuContentContext);
    const isExternal = !asChild && (external ?? EXTERNAL_HREF_PATTERN.test(href ?? ""));
    const current = ownCurrent ?? matchesCurrent(currentPath, href, currentMatch);

    const classes = cx(
      inPanel ? styles.panelLink : cx(styles.link, rounded && styles.rounded, current && styles.current, current && currentVariantClass[currentVariant]),
      disabled && styles.disabled,
      className,
    );

    const content = asChild ? (
      children
    ) : (
      <>
        {icon && <Icon icon={icon} size={inPanel ? "md" : "sm"} className={styles.linkIcon} />}
        <span className={styles.linkBody}>
          <span className={styles.linkText}>
            {children}
            {isExternal && (
              <>
                <Icon icon={ArrowSquareOutIcon} size="xs" className={styles.external} />
                <VisuallyHidden> {labels.externalLink}</VisuallyHidden>
              </>
            )}
          </span>
          {description !== undefined && description !== null && (
            <span
              className={styles.description}
              data-clamped={descriptionLines === undefined ? undefined : ""}
              style={descriptionLines === undefined ? undefined : ({ "--nm-lines": descriptionLines } as CSSProperties)}
            >
              {description}
            </span>
          )}
        </span>
        {renderBadge(badge)}
      </>
    );

    return (
      <SelectableAnchor
        {...props}
        {...(asChild ? {} : { href, target: target ?? (isExternal ? "_blank" : undefined), rel: rel ?? (isExternal ? "noopener noreferrer" : undefined) })}
        ref={ref}
        asChild={asChild}
        current={current}
        disabled={disabled}
        onIntent={onIntent}
        className={classes}
      >
        {content}
      </SelectableAnchor>
    );
  },
);
NavigationMenuLink.displayName = "NavigationMenu.Link";

/** A labelled run of links inside a panel, in one to three columns. The label names the list of links beneath it. */
const NavigationMenuGroup = forwardRef<HTMLDivElement, NavigationMenuGroupProps>(({ label, href, columns = 1, className, children, ...props }, ref) => {
  const labelId = useId();
  const hasLabel = label !== undefined && label !== null && label !== false;
  return (
    <div {...props} ref={ref} className={cx(styles.group, className)}>
      {hasLabel && (
        <p id={labelId} className={styles.groupLabel}>
          {href === undefined ? (
            label
          ) : (
            <SelectableAnchor href={href} className={styles.groupLabelLink}>
              {label}
              <Icon icon={ArrowRightIcon} size="xs" className={styles.groupLabelArrow} />
            </SelectableAnchor>
          )}
        </p>
      )}
      {/* eslint-disable-next-line jsx-a11y/no-redundant-roles */}
      <ul role="list" aria-labelledby={hasLabel ? labelId : undefined} className={styles.groupList} data-columns={columns}>
        {Children.toArray(children).map((child) => (
          // eslint-disable-next-line jsx-a11y/no-redundant-roles
          <li key={isValidElement(child) && child.key !== null ? child.key : String(child)} role="listitem" className={styles.groupItem}>
            {child}
          </li>
        ))}
      </ul>
    </div>
  );
});
NavigationMenuGroup.displayName = "NavigationMenu.Group";

/** A featured block in a panel: media, a heading and text, optionally one link as a whole. */
const NavigationMenuFeature = forwardRef<HTMLDivElement, NavigationMenuFeatureProps>(
  ({ media, title, children, href, onSelect, className, ...props }, ref) => {
    const inner = (
      <>
        {media !== undefined && media !== null && <span className={styles.featureMedia}>{media}</span>}
        <span className={styles.featureTitle}>{title}</span>
        {children !== undefined && children !== null && <span className={styles.featureText}>{children}</span>}
      </>
    );
    return (
      <div {...props} ref={ref} className={cx(styles.feature, className)}>
        {href === undefined ? (
          <div className={styles.featureBody}>{inner}</div>
        ) : (
          <SelectableAnchor href={href} onSelect={onSelect} className={cx(styles.featureBody, styles.featureLink)}>
            {inner}
          </SelectableAnchor>
        )}
      </div>
    );
  },
);
NavigationMenuFeature.displayName = "NavigationMenu.Feature";

/** The strip under a panel's content: a link to the whole section, a line of help. */
const NavigationMenuFooter = forwardRef<HTMLDivElement, NavigationMenuFooterProps>(({ className, ...props }, ref) => (
  <div {...props} ref={ref} className={cx(styles.footer, className)} />
));
NavigationMenuFooter.displayName = "NavigationMenu.Footer";

type NavigationMenuComponent = typeof NavigationMenuRoot & {
  List: typeof NavigationMenuList;
  Item: typeof NavigationMenuItem;
  Trigger: typeof NavigationMenuTrigger;
  Content: typeof NavigationMenuContent;
  Link: typeof NavigationMenuLink;
  Group: typeof NavigationMenuGroup;
  Feature: typeof NavigationMenuFeature;
  Footer: typeof NavigationMenuFooter;
};

export const NavigationMenu: NavigationMenuComponent = Object.assign(NavigationMenuRoot, {
  List: NavigationMenuList,
  Item: NavigationMenuItem,
  Trigger: NavigationMenuTrigger,
  Content: NavigationMenuContent,
  Link: NavigationMenuLink,
  Group: NavigationMenuGroup,
  Feature: NavigationMenuFeature,
  Footer: NavigationMenuFooter,
});
