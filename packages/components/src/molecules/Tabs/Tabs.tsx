import { cx, mergeRefs, useResolvedResponsiveValue, useScrollEdges } from "@dbm-system/utils";
import { CaretDownIcon, CaretLeftIcon, CaretRightIcon, CaretUpIcon } from "@dbm-system/icons";
import * as TabsPrimitive from "@radix-ui/react-tabs";
import { createContext, forwardRef, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";
import { Icon } from "../../atoms/Icon";
import type { IconSize } from "../../atoms/Icon";
import styles from "./Tabs.module.css";
import { tabIconSize } from "./tabIconSizes";
import type {
  TabsAlign,
  TabsContentProps,
  TabsItemProps,
  TabsListProps,
  TabsOrientation,
  TabsProps,
  TabsSize,
  TabsTriggerProps,
  TabsVariant,
} from "./Tabs.types";

interface TabsContextValue {
  variant: TabsVariant;
  size: TabsSize;
  fullWidth: boolean;
  rounded: boolean;
  orientation: TabsOrientation;
}

// Every part reads the root's own settings from here rather than each taking
// them as a prop, so one `variant`/`size` on `Tabs` styles the whole set —
// and a `Tabs` inside another's panel is styled by its own root, not its
// parent's (which a descendant CSS selector could not promise).
// Whether the trigger being drawn sits in a `Tabs.Item` that has an action, so it can leave the action room.
const TabsItemContext = createContext(false);

const TabsContext = createContext<TabsContextValue>({
  variant: "underline",
  size: "md",
  fullWidth: false,
  rounded: false,
  orientation: "horizontal",
});

// The scroll buttons' caret: one step down from the trigger's own size at the small end, the mapping
// `Button` uses, so a caret reads the same beside a label in either.
const iconSizeForTabsSize: Record<TabsSize, IconSize> = {
  xs: "xs",
  sm: "xs",
  md: "sm",
  lg: "sm",
  xl: "md",
};

const triggerSizeClass: Record<TabsSize, string | undefined> = {
  xs: styles.sizeXs,
  sm: styles.sizeSm,
  md: styles.sizeMd,
  lg: styles.sizeLg,
  xl: styles.sizeXl,
};

const contentSizeClass: Record<TabsSize, string | undefined> = {
  xs: styles.contentXs,
  sm: styles.contentSm,
  md: styles.contentMd,
  lg: styles.contentLg,
  xl: styles.contentXl,
};

const triggerVariantClass: Record<TabsVariant, string | undefined> = {
  underline: styles.underline,
  subtle: styles.subtle,
  outlined: styles.outlined,
  solid: styles.solid,
};

const listVariantClass: Record<TabsVariant, string | undefined> = {
  underline: styles.listUnderline,
  subtle: styles.listFilled,
  outlined: styles.listFilled,
  solid: styles.listFilled,
};

const alignClass: Record<TabsAlign, string | undefined> = {
  start: styles.alignStart,
  center: styles.alignCenter,
  end: styles.alignEnd,
};

/** Instantly for the very first look (a tab selected off-screen from the start shouldn't be seen
 * sliding into place, and nobody asked for animation on page load), smoothly afterwards, and not at
 * all smoothly for a reader who asked for less motion. */
function prefersReducedMotion(): boolean {
  return typeof window !== "undefined" && Boolean(window.matchMedia?.("(prefers-reduced-motion: reduce)").matches);
}

/**
 * Scrolls a scrolling list just far enough to show a tab in full. Measured
 * from bounding rectangles and applied with `scrollBy`, so it is the same in
 * a right-to-left horizontal list (where `scrollLeft` counts the other way)
 * and never scrolls the page itself, which `scrollIntoView` would.
 */
function revealTab(
  list: HTMLElement,
  tab: HTMLElement,
  behavior: ScrollBehavior,
  orientation: "horizontal" | "vertical",
): void {
  if (typeof list.scrollBy !== "function") return;
  const listRect = list.getBoundingClientRect();
  const tabRect = tab.getBoundingClientRect();
  let delta = 0;
  if (orientation === "vertical") {
    if (tabRect.top < listRect.top) delta = tabRect.top - listRect.top;
    else if (tabRect.bottom > listRect.bottom) delta = tabRect.bottom - listRect.bottom;
    if (delta !== 0) list.scrollBy({ top: delta, behavior });
    return;
  }
  if (tabRect.left < listRect.left) delta = tabRect.left - listRect.left;
  else if (tabRect.right > listRect.right) delta = tabRect.right - listRect.right;
  if (delta !== 0) list.scrollBy({ left: delta, behavior });
}

/**
 * Whether an element currently has real keyboard focus, not a mouse-produced one — a plain
 * `:focus-visible` match already draws this distinction. What a scroll button that has run out of
 * anything to scroll to is held back for, mirroring `Pagination`'s own `keyboardIsOnPageNumber`: a
 * browser that can't answer treats it as keyboard focus, the safe side, rather than dropping focus.
 */
function hasKeyboardFocus(element: Element): boolean {
  try {
    return element.matches(":focus-visible");
  } catch {
    return true;
  }
}

/**
 * A set of tabs, each switching which of several panels is showing, built on
 * Radix Tabs. A compound component: put a `Tabs.List` holding one
 * `Tabs.Trigger` per tab inside `Tabs`, and one `Tabs.Content` per trigger
 * beside it, matched by `value`. Wraps Radix Tabs' `Root`/`List`/`Trigger`/
 * `Content` fully, end to end.
 *
 * Uncontrolled with `defaultValue`, or controlled with `value`/
 * `onValueChange`. Pass one of them: with neither, no tab is selected and no
 * panel shows. `variant`, `size`, `rounded`, `orientation` and `fullWidth` are set once
 * here and apply to every part. `rounded` fully rounds the tabs of every variant
 * but `underline`. `orientation` accepts a breakpoint map for a
 * vertical list that becomes a horizontal one on a phone. A list that outgrows
 * its container — wider than it, horizontal, or taller than it, vertical —
 * scrolls along its own axis and keeps the selected tab in view.
 *
 * `ref` forwards to the root `<div>`.
 *
 * @example
 * ```tsx
 * <Tabs defaultValue="overview">
 *   <Tabs.List aria-label="Project">
 *     <Tabs.Trigger value="overview">Overview</Tabs.Trigger>
 *     <Tabs.Trigger value="activity">Activity</Tabs.Trigger>
 *     <Tabs.Trigger value="settings" disabled>Settings</Tabs.Trigger>
 *   </Tabs.List>
 *   <Tabs.Content value="overview">A summary of the project.</Tabs.Content>
 *   <Tabs.Content value="activity">Recent changes.</Tabs.Content>
 *   <Tabs.Content value="settings">Project settings.</Tabs.Content>
 * </Tabs>
 * ```
 */
const TabsRoot = forwardRef<HTMLDivElement, TabsProps>((props, ref) => {
  const {
    children,
    value,
    defaultValue,
    onValueChange,
    variant = "underline",
    size = "md",
    orientation: orientationProp = "horizontal",
    activationMode = "automatic",
    fullWidth = false,
    rounded = false,
    dir,
    className,
    style,
    id,
    "data-testid": dataTestId,
    ...rest
  } = props;

  const orientation = useResolvedResponsiveValue<TabsOrientation>(orientationProp, "horizontal");

  const hasWarnedNoSelectionRef = useRef(false);
  const hasWarnedBothRef = useRef(false);
  if (process.env.NODE_ENV !== "production") {
    if (value === undefined && defaultValue === undefined && !hasWarnedNoSelectionRef.current) {
      hasWarnedNoSelectionRef.current = true;
      console.warn(
        "Tabs: neither `value` nor `defaultValue` was passed, so no tab is selected and no panel shows. Pass `defaultValue` (uncontrolled) or `value` with `onValueChange` (controlled).",
      );
    }
    if (value !== undefined && defaultValue !== undefined && !hasWarnedBothRef.current) {
      hasWarnedBothRef.current = true;
      console.warn(
        "Tabs: `value` and `defaultValue` were both passed. `value` makes the tabs controlled, so `defaultValue` is ignored — remove one.",
      );
    }
  }

  const context = useMemo<TabsContextValue>(
    () => ({ variant, size, fullWidth, rounded, orientation }),
    [variant, size, fullWidth, rounded, orientation],
  );

  return (
    <TabsPrimitive.Root
      {...rest}
      ref={ref}
      value={value}
      defaultValue={defaultValue}
      onValueChange={onValueChange}
      orientation={orientation}
      activationMode={activationMode}
      dir={dir}
      id={id}
      style={style}
      data-testid={dataTestId}
      // Radix sets this itself, but before spreading whatever else it is given,
      // so a stray consumer `data-orientation` would win. Setting it here, after
      // `rest`, keeps it the resolved value.
      data-orientation={orientation}
      className={cx(styles.root, className)}
    >
      <TabsContext.Provider value={context}>{children}</TabsContext.Provider>
    </TabsPrimitive.Root>
  );
});

TabsRoot.displayName = "Tabs";

/**
 * The row (or column) of `Tabs.Trigger`s — the `tablist`. Roving focus:
 * `Tab` enters it once, on the selected tab, and the arrow keys move between
 * tabs from there. When it outgrows its container along the direction it
 * runs — wider than it, horizontal; taller than it, vertical — it scrolls
 * along that axis (arrow keys, and a touch or trackpad swipe, always scroll
 * it), keeps the selected tab in view as the selection changes, and shows a
 * fade at whichever edge currently has more tabs beyond it, plus a button
 * there too unless `showScrollButtons` is `false`. `ref` forwards to the
 * `tablist` element itself, not to the wrapper the fade and button are
 * positioned against.
 */
const TabsList = forwardRef<HTMLDivElement, TabsListProps>(
  ({ loop = true, align = "start", showScrollButtons = true, className, children, ...props }, ref) => {
    const { variant, size, orientation } = useContext(TabsContext);
    const listRef = useRef<HTMLDivElement>(null);
    const isHorizontal = orientation === "horizontal";
    const { overflowStart, overflowEnd } = useScrollEdges(listRef, orientation, { itemSelector: '[role="tab"]' });

    // A scroll button that has just run out of anything to scroll to stays in the page, inert,
    // while it still has real keyboard focus — the same reasoning `Pagination`'s own arrows apply
    // to their own edge case (removing it would drop focus to the top of the document). Mouse-
    // produced focus doesn't hold it: `hasKeyboardFocus` only sets these from a `:focus-visible` match.
    // Neither state ever turns true while `showScrollButtons` is false, since nothing renders to
    // focus in the first place — gating the buttons on it below needs no change here.
    const [startHeld, setStartHeld] = useState(false);
    const [endHeld, setEndHeld] = useState(false);
    const showStartButton = showScrollButtons && (overflowStart || startHeld);
    const showEndButton = showScrollButtons && (overflowEnd || endHeld);

    useEffect(() => {
      const list = listRef.current;
      if (!list) return undefined;

      const activeTab = () => list.querySelector<HTMLElement>('[role="tab"][data-state="active"]');
      const first = activeTab();
      if (first) revealTab(list, first, "auto", orientation);

      if (typeof MutationObserver === "undefined") return undefined;
      const observer = new MutationObserver(() => {
        const tab = activeTab();
        if (tab) revealTab(list, tab, prefersReducedMotion() ? "auto" : "smooth", orientation);
      });
      observer.observe(list, { attributes: true, attributeFilter: ["data-state"], subtree: true });
      return () => observer.disconnect();
    }, [orientation]);

    const scroll = useCallback(
      (direction: 1 | -1) => {
        const list = listRef.current;
        if (!list) return;
        const behavior = prefersReducedMotion() ? "auto" : "smooth";
        if (isHorizontal) list.scrollBy({ left: list.clientWidth * direction, behavior });
        else list.scrollBy({ top: list.clientHeight * direction, behavior });
      },
      [isHorizontal],
    );

    const tabsList = (
      <TabsPrimitive.List
        {...props}
        ref={mergeRefs(ref, listRef)}
        loop={loop}
        // Radix computes `aria-orientation` too, but before spreading whatever else it
        // is given, so a consumer's own would win. Computed here, after `props`, it
        // stays the resolved value even as a breakpoint map changes it.
        aria-orientation={orientation}
        data-orientation={orientation}
        className={cx(styles.list, listVariantClass[variant], alignClass[align], className)}
      >
        {children}
      </TabsPrimitive.List>
    );

    const StartIcon = isHorizontal ? CaretLeftIcon : CaretUpIcon;
    const EndIcon = isHorizontal ? CaretRightIcon : CaretDownIcon;

    return (
      <div
        className={styles.listWrapper}
        data-orientation={orientation}
        data-overflow-start={overflowStart}
        data-overflow-end={overflowEnd}
      >
        {showStartButton && (
          <button
            type="button"
            aria-label="Scroll tabs to the start"
            aria-disabled={overflowStart ? undefined : true}
            className={cx(styles.scrollButton, styles.scrollButtonStart, !overflowStart && styles.scrollButtonInert)}
            onFocus={(event) => {
              if (hasKeyboardFocus(event.currentTarget)) setStartHeld(true);
            }}
            onBlur={() => setStartHeld(false)}
            onClick={() => {
              if (overflowStart) scroll(-1);
            }}
          >
            <Icon icon={StartIcon} size={iconSizeForTabsSize[size]} className={styles.scrollIcon} />
          </button>
        )}
        {tabsList}
        {showEndButton && (
          <button
            type="button"
            aria-label="Scroll tabs to the end"
            aria-disabled={overflowEnd ? undefined : true}
            className={cx(styles.scrollButton, styles.scrollButtonEnd, !overflowEnd && styles.scrollButtonInert)}
            onFocus={(event) => {
              if (hasKeyboardFocus(event.currentTarget)) setEndHeld(true);
            }}
            onBlur={() => setEndHeld(false)}
            onClick={() => {
              if (overflowEnd) scroll(1);
            }}
          >
            <Icon icon={EndIcon} size={iconSizeForTabsSize[size]} className={styles.scrollIcon} />
          </button>
        )}
      </div>
    );
  },
);
TabsList.displayName = "Tabs.List";

/**
 * One tab. A real `<button role="tab">`, selected by a click (on press, as a
 * native tab does), or by focus when the tabs are `"automatic"`. Pairs with the
 * `Tabs.Content` that has the same `value`.
 */
const TabsTrigger = forwardRef<HTMLButtonElement, TabsTriggerProps>((triggerProps, ref) => {
  const { value, icon, asChild = false, className, children, ...props } = triggerProps;
  const { variant, size, fullWidth, rounded, orientation } = useContext(TabsContext);
  const hasAction = useContext(TabsItemContext);

  const hasWarnedIconRef = useRef(false);
  const hasWarnedNameRef = useRef(false);
  if (process.env.NODE_ENV !== "production") {
    if (asChild && icon !== undefined && !hasWarnedIconRef.current) {
      hasWarnedIconRef.current = true;
      console.warn(
        "Tabs.Trigger: `icon` has no effect when `asChild` is set — the slotted child supplies its own content. Render the icon inside the child instead.",
      );
    }
    if (
      !asChild &&
      !children &&
      !props["aria-label"] &&
      !props["aria-labelledby"] &&
      !hasWarnedNameRef.current
    ) {
      hasWarnedNameRef.current = true;
      console.warn(
        "Tabs.Trigger: no accessible name — an icon-only tab has no visible label to name it. Pass `aria-label` (or `aria-labelledby`), or give it children.",
      );
    }
  }

  return (
    <TabsPrimitive.Trigger
      {...props}
      ref={ref}
      value={value}
      asChild={asChild}
      data-orientation={orientation}
      className={cx(
        styles.trigger,
        triggerSizeClass[size],
        triggerVariantClass[variant],
        fullWidth && styles.triggerFullWidth,
        hasAction && styles.triggerWithAction,
        // The underline variant has no shape to round, so `rounded` never reaches it.
        rounded && variant !== "underline" && styles.rounded,
        className,
      )}
    >
      {asChild ? (
        children
      ) : (
        <>
          {icon && <Icon icon={icon} size={tabIconSize[size]} className={styles.triggerIcon} />}
          {children !== undefined && children !== null && children !== false && (
            <span className={styles.triggerLabel}>{children}</span>
          )}
        </>
      )}
    </TabsPrimitive.Trigger>
  );
});
TabsTrigger.displayName = "Tabs.Trigger";

/**
 * A tab with a control beside it. Wraps one `Tabs.Trigger` and an `action` (a close button, say), drawn at
 * the tab's end as a sibling of the tab button, never inside it. The tab keeps all its own looks and its
 * place in the arrow-key order; the item only reserves room for the action and positions it. Items and
 * bare triggers can be mixed in one list.
 *
 * The action is a pointer shortcut and is hidden from assistive technology: a `tablist` may own only tabs,
 * so a button inside one is an ARIA violation. Whatever it does must also be reachable another way (a key
 * on the focused tab, or a menu).
 *
 * @example
 * ```tsx
 * <Tabs.List aria-label="Open files">
 *   <Tabs.Item action={<button tabIndex={-1} aria-label="Close index.ts">×</button>}>
 *     <Tabs.Trigger value="index">index.ts</Tabs.Trigger>
 *   </Tabs.Item>
 * </Tabs.List>
 * ```
 */
const TabsItem = forwardRef<HTMLDivElement, TabsItemProps>(
  ({ action, className, children, ...props }, ref) => {
    const { orientation, fullWidth } = useContext(TabsContext);
    const hasAction = action !== undefined && action !== null && action !== false;
    return (
      <div
        {...props}
        ref={ref}
        data-orientation={orientation}
        className={cx(styles.item, fullWidth && styles.itemFullWidth, className)}
      >
        <TabsItemContext.Provider value={hasAction}>{children}</TabsItemContext.Provider>
        {hasAction && (
          // A tab list may only own tabs, so a button inside it is a violation of the pattern: the action is
          // hidden from assistive technology (and out of the tab order, `tabIndex={-1}`) and is a pointer shortcut.
          // The same operation needs a key or a menu elsewhere.
          <span aria-hidden="true" className={styles.itemAction}>
            {action}
          </span>
        )}
      </div>
    );
  },
);
TabsItem.displayName = "Tabs.Item";

/**
 * The panel a tab reveals — a `tabpanel` named by its trigger, which is
 * focusable so a reader can `Tab` from the list straight into it. Unmounted
 * while its tab isn't selected, unless `forceMount` keeps it in the page.
 */
const TabsContent = forwardRef<HTMLDivElement, TabsContentProps>(
  ({ className, children, ...props }, ref) => {
    const { size } = useContext(TabsContext);
    return (
      <TabsPrimitive.Content {...props} ref={ref} className={cx(styles.content, contentSizeClass[size], className)}>
        {children}
      </TabsPrimitive.Content>
    );
  },
);
TabsContent.displayName = "Tabs.Content";

type TabsComponent = typeof TabsRoot & {
  List: typeof TabsList;
  Item: typeof TabsItem;
  Trigger: typeof TabsTrigger;
  Content: typeof TabsContent;
};

export const Tabs: TabsComponent = Object.assign(TabsRoot, {
  List: TabsList,
  Item: TabsItem,
  Trigger: TabsTrigger,
  Content: TabsContent,
});
