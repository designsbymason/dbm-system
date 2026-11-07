import { CaretLeftIcon, CaretRightIcon, DotsThreeIcon } from "@dbm-system/icons";
import { cx, mergeDefined, mergeRefs } from "@dbm-system/utils";
import {
  Children,
  createContext,
  forwardRef,
  isValidElement,
  useContext,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
} from "react";
import type { ReactElement, ReactNode } from "react";
import { Icon } from "../../atoms/Icon";
import type { IconSize } from "../../atoms/Icon";
import { IconButton } from "../../atoms/IconButton";
import { Link } from "../../atoms/Link";
import styles from "./Breadcrumb.module.css";
import type {
  BreadcrumbCompact,
  BreadcrumbItemProps,
  BreadcrumbLabels,
  BreadcrumbLinkProps,
  BreadcrumbPageProps,
  BreadcrumbProps,
  BreadcrumbSeparator,
  BreadcrumbSize,
  BreadcrumbTone,
} from "./Breadcrumb.types";
import { useProvidedDirection } from "../../atoms/DirectionProvider/DirectionProvider";

interface BreadcrumbContextValue {
  size: BreadcrumbSize;
  separator: BreadcrumbSeparator;
  tone: BreadcrumbTone;
  underline: boolean;
  /** Labels may be cut short, so a plain-text one carries its full text as a tooltip. */
  truncate: boolean;
}

// Every part reads the root's settings from here rather than each taking them as a prop, so one `size` on
// `Breadcrumb` styles the whole trail.
const BreadcrumbContext = createContext<BreadcrumbContextValue>({
  size: "md",
  separator: "chevron",
  tone: "info",
  underline: false,
  truncate: false,
});

/**
 * Where an item sits. `isLast` — the last one drawn, the only one with no separator after it. `isParent` — the item
 * just above the current page, the one the compact form shows on its own.
 */
const ItemPositionContext = createContext({ isLast: true, isParent: false });

// `useLayoutEffect` on the client, `useEffect` on the server — avoids React's "does nothing on the server" warning,
// the same as `Pagination`.
const useIsomorphicLayoutEffect = typeof window !== "undefined" ? useLayoutEffect : useEffect;

const sizeClass: Record<BreadcrumbSize, string | undefined> = {
  xs: styles.sizeXs,
  sm: styles.sizeSm,
  md: styles.sizeMd,
  lg: styles.sizeLg,
  xl: styles.sizeXl,
};

const compactClass: Record<BreadcrumbCompact, string | undefined> = {
  never: undefined,
  auto: styles.compactAuto,
  always: styles.compactAlways,
};

const toneClass: Record<BreadcrumbTone, string | undefined> = {
  neutral: styles.toneNeutral,
  brand: styles.toneBrand,
  info: styles.toneInfo,
};

// One step down from the text's own size at the small end, the mapping `Button` and `Tabs` use.
const iconSizeForSize: Record<BreadcrumbSize, IconSize> = { xs: "xs", sm: "xs", md: "sm", lg: "sm", xl: "md" };

// The "…" button is the smallest `IconButton` (30px) up to `lg`, so it disturbs the height of its line as little as
// it can — an `IconButton` of the trail's own size is as tall as a `Button` of that size, far taller than a line of text.
const expandSizeForSize: Record<BreadcrumbSize, BreadcrumbSize> = { xs: "xs", sm: "xs", md: "xs", lg: "xs", xl: "sm" };

const defaultLabels: BreadcrumbLabels = {
  navigation: "Breadcrumb",
  expand: (count) => `Show ${count} hidden ${count === 1 ? "page" : "pages"}`,
};

/** A count that isn't a whole number of at least zero is treated as zero. */
const nonNegative = (count: number): number => Math.max(Math.trunc(count) || 0, 0);

/**
 * One item of the trail's list. Its `listitem` role is stated outright: Safari with VoiceOver stops treating a
 * list as one once its markers are removed (`list-style: none`), and the items with it — the same fix `List`
 * and `Pagination` apply. Redundant on paper, which is what the lint rule objects to.
 */
const BreadcrumbItem = forwardRef<HTMLLIElement, BreadcrumbItemProps>(({ className, children, ...props }, ref) => {
  const { size, separator } = useContext(BreadcrumbContext);
  const { isLast, isParent } = useContext(ItemPositionContext);
  return (
    // eslint-disable-next-line jsx-a11y/no-redundant-roles -- deliberate; see the comment above.
    <li {...props} ref={ref} role="listitem" className={cx(styles.item, isParent && styles.parent, className)}>
      {/* The compact form's back arrow — hidden by CSS unless the trail is compact. */}
      {isParent && <Icon icon={CaretLeftIcon} size={iconSizeForSize[size]} className={cx(styles.back, styles.flip)} />}
      {children}
      {!isLast && <Separator separator={separator} size={size} />}
    </li>
  );
});
BreadcrumbItem.displayName = "Breadcrumb.Item";

function Separator({ separator, size }: { separator: BreadcrumbSeparator; size: BreadcrumbSize }) {
  let content: ReactNode = separator;
  if (separator === "chevron") {
    content = <Icon icon={CaretRightIcon} size={iconSizeForSize[size]} className={styles.flip} />;
  } else if (separator === "slash") {
    content = "/";
  }
  return (
    <span aria-hidden="true" className={styles.separator}>
      {content}
    </span>
  );
}

/**
 * A link to a page above the current one. Renders the `Link` atom — so it takes an `href`, opens an external
 * one in a new tab with the usual affordances, supports `disabled`, and takes `asChild` to render a router's
 * own link — coloured by the trail's `tone`. The underline shows on hover only unless the trail sets
 * `underline`, since a link in a navigation list isn't running through body text to be told apart from it.
 */
const BreadcrumbLink = forwardRef<HTMLAnchorElement, BreadcrumbLinkProps>(
  ({ icon, className, children, asChild = false, ...props }, ref) => {
    const { size, tone, underline, truncate } = useContext(BreadcrumbContext);
    useEffect(() => {
      if (process.env.NODE_ENV !== "production" && asChild && icon) {
        console.warn(
          "Breadcrumb.Link: `icon` is not drawn together with `asChild`, since the slotted element owns its own content. Put the icon inside that element instead.",
        );
      }
    }, [asChild, icon]);
    return (
      <Link
        {...props}
        ref={ref}
        asChild={asChild}
        underline={underline ? "always" : "hover"}
        className={cx(styles.link, toneClass[tone], asChild && styles.slotted, className)}
        // The whole label as a tooltip when it can be cut short — only for plain text, which is all a title holds.
        title={props.title ?? (truncate && typeof children === "string" ? children : undefined)}
      >
        {asChild ? (
          children
        ) : (
          <>
            {icon && <Icon icon={icon} size={iconSizeForSize[size]} />}
            <span className={styles.label}>{children}</span>
          </>
        )}
      </Link>
    );
  },
);
BreadcrumbLink.displayName = "Breadcrumb.Link";

/** The current page: plain text, marked `aria-current="page"` so a screen reader announces it as the current page. */
const BreadcrumbPage = forwardRef<HTMLSpanElement, BreadcrumbPageProps>(
  ({ icon, className, children, ...props }, ref) => {
    const { size, truncate } = useContext(BreadcrumbContext);
    return (
      <span
        {...props}
        title={props.title ?? (truncate && typeof children === "string" ? children : undefined)}
        // After `...props`, so a caller's own `aria-current` can't replace it.
        ref={ref}
        aria-current="page"
        className={cx(styles.page, className)}
      >
        {icon && <Icon icon={icon} size={iconSizeForSize[size]} />}
        <span className={styles.label}>{children}</span>
      </span>
    );
  },
);
BreadcrumbPage.displayName = "Breadcrumb.Page";

/**
 * Whether an element has real keyboard focus, not a mouse-produced one — a plain `:focus-visible` match already
 * draws this distinction. A browser that can't answer is treated as having keyboard focus, the safe side, the same
 * as `Pagination` and `Tabs`.
 */
function keyboardIsOn(element: Element): boolean {
  try {
    return element.matches(":focus-visible");
  } catch {
    return true;
  }
}

/** Where in the trail keyboard focus goes once the "…" button that held it has gone. */
const FOCUSABLE = "a[href], button:not([disabled]), [tabindex]:not([tabindex='-1'])";

/**
 * A breadcrumb trail: the path from the top of a site down to the page the reader is on, as a list of links
 * ending in the current page. A compound component — put one `Breadcrumb.Item` per level inside `Breadcrumb`,
 * each holding a `Breadcrumb.Link` (or `Breadcrumb.Page`, for the last).
 *
 * Renders a `<nav>` around an ordered list, named "Breadcrumb" (`labels.navigation`, or `aria-label`). The
 * separator between items is drawn by the component, hidden from assistive technology. A long trail wraps onto
 * more lines, or — with `maxItems` — collapses its middle into a "…" button that reveals the rest.
 *
 * `size`, `tone` and `underline` set how every link looks. `compact` swaps the trail for a single link back to the
 * parent page (on a phone, or always). `truncate` keeps it on one line and cuts long labels short with an ellipsis.
 * `maxItems` collapses the middle into a "…" button — past a number of items, or with `"container"` only as many
 * as fit the trail's own width. Give each `Breadcrumb.Item` a `key` (its `href` will do), so that a different page's
 * trail starts over instead of inheriting the last one's expansion.
 *
 * `ref` forwards to the `<nav>`.
 *
 * @example
 * ```tsx
 * <Breadcrumb>
 *   <Breadcrumb.Item><Breadcrumb.Link href="/" icon={HouseIcon}>Home</Breadcrumb.Link></Breadcrumb.Item>
 *   <Breadcrumb.Item><Breadcrumb.Link href="/products">Products</Breadcrumb.Link></Breadcrumb.Item>
 *   <Breadcrumb.Item><Breadcrumb.Page>Keyboards</Breadcrumb.Page></Breadcrumb.Item>
 * </Breadcrumb>
 * ```
 */
const BreadcrumbRoot = forwardRef<HTMLElement, BreadcrumbProps>(
  (
    {
      children,
      size = "md",
      separator = "chevron",
      tone = "info",
      underline = false,
      maxItems,
      compact = "never",
      truncate = false,
      itemsBeforeCollapse = 1,
      itemsAfterCollapse = 2,
      labels: labelOverrides,
      "aria-label": ariaLabel,
      "aria-labelledby": ariaLabelledBy,
      className,
      dir: dirProp,
      ...props
    },
    ref,
  ) => {
    const providedDir = useProvidedDirection();
    const dir = dirProp ?? providedDir;
    const [expanded, setExpanded] = useState(false);
    // `maxItems="container"`: how many items are hidden right now, and whether the trail is fully collapsed and
    // still doesn't fit (so wrapping, or `truncate`, has to take over).
    const [measuredHidden, setMeasuredHidden] = useState(0);
    const [settled, setSettled] = useState(false);
    // Bumped whenever the width changes, so the measurement runs again even when nothing else changed (a trail that
    // showed in full and now has to collapse has the same state as before).
    const [widthChanges, setWidthChanges] = useState(0);
    const navRef = useRef<HTMLElement>(null);
    const listRef = useRef<HTMLOListElement>(null);
    const focusRevealed = useRef(false);
    const measuredWidth = useRef<number | undefined>(undefined);

    const labels: BreadcrumbLabels = mergeDefined(defaultLabels, labelOverrides);
    const all = Children.toArray(children);
    const items = all.filter((child): child is ReactElement => isValidElement(child));

    const containerMode = maxItems === "container";
    const before = nonNegative(itemsBeforeCollapse);
    // The last item is the current page, so it is never the one that collapses. The compact form shows the item
    // above it, so that one is kept too whenever the compact form can appear.
    const after = Math.max(nonNegative(itemsAfterCollapse), compact === "never" ? 1 : 2);
    const maxHidden = Math.max(items.length - before - after, 0);
    const hasParent = items.length >= 2;
    const parent = hasParent ? items[items.length - 2] : undefined;

    // How many items the middle of the trail is hiding right now. A number `maxItems` hides all it can, or nothing;
    // `"container"` hides as many as the measurement has found it takes — never a lone item, which a button of the
    // same size would replace for no gain.
    let hidden = 0;
    if (!expanded && maxHidden >= 2) {
      if (typeof maxItems === "number") hidden = items.length > maxItems ? maxHidden : 0;
      else if (containerMode) hidden = Math.min(measuredHidden, maxHidden);
    }

    useEffect(() => {
      if (process.env.NODE_ENV === "production") return;
      if (all.length !== items.length) {
        console.warn("Breadcrumb: only `Breadcrumb.Item` elements are rendered — a fragment or plain text among the children is ignored.");
      }
    }, [all.length, items.length]);
    useEffect(() => {
      if (process.env.NODE_ENV !== "production" && typeof maxItems === "number" && before + after >= maxItems) {
        console.warn(
          `Breadcrumb: \`itemsBeforeCollapse\` (${before}) and \`itemsAfterCollapse\` (${after}) together fill \`maxItems\` (${maxItems}), so there is nothing left to collapse into the "…" button.`,
        );
      }
    }, [before, after, maxItems]);

    // `maxItems="container"` measures the trail against its own width, before the browser paints, hiding one more
    // item (two, the first time) while it is too wide — so the trail settles on the fewest hidden items that fit,
    // and there is no flash of the wrong one. It is measured again whenever the width changes. A collapse is held
    // back while keyboard focus is on an item that would be hidden: taking the focused link out of the page would
    // drop focus to the top of the document, so the trail stays as it is until focus has moved on (`focusout`).
    // While it is being measured the list can't wrap or shrink (`.measuring`), so its own width is the width it needs.
    const itemCount = items.length;
    useIsomorphicLayoutEffect(() => {
      if (!containerMode || expanded) return;
      const nav = navRef.current;
      const list = listRef.current;
      if (!nav || !list) return;
      const measure = () => {
        if (settled) return;
        if (list.scrollWidth <= nav.clientWidth) return;
        if (maxHidden < 2 || measuredHidden >= maxHidden) {
          setSettled(true);
          return;
        }
        const next = Math.min(Math.max(measuredHidden + 1, 2), maxHidden);
        const active = document.activeElement;
        if (active && list.contains(active) && keyboardIsOn(active)) {
          // Which item of the trail holds focus: the entries drawn are the leading items, then (when some are
          // hidden) the "…" button, then the rest — so past the button the position has to be mapped back.
          const position = Array.from(list.children).findIndex((entry) => entry.contains(active));
          const onEllipsis = hidden > 0 && position === before;
          const itemIndex = hidden > 0 && position > before ? position - 1 + hidden : position;
          if (!onEllipsis && itemIndex >= before && itemIndex < before + next) return;
        }
        setMeasuredHidden(next);
      };
      // The width this measurement is for, recorded now rather than left to the observer's first callback, which
      // can arrive after the width has already changed again.
      measuredWidth.current ??= nav.clientWidth;
      measure();
      let timer: ReturnType<typeof setTimeout> | undefined;
      const onFocusOut = () => {
        clearTimeout(timer);
        timer = setTimeout(measure, 0);
      };
      nav.addEventListener("focusout", onFocusOut);
      const observer =
        typeof ResizeObserver === "undefined"
          ? undefined
          : new ResizeObserver(() => {
              const width = nav.clientWidth;
              const previous = measuredWidth.current;
              measuredWidth.current = width;
              if (previous === width) return;
              // A new width: start again from the full trail.
              setMeasuredHidden(0);
              setSettled(false);
              setWidthChanges((count) => count + 1);
            });
      observer?.observe(nav);
      return () => {
        clearTimeout(timer);
        nav.removeEventListener("focusout", onFocusOut);
        observer?.disconnect();
      };
    }, [containerMode, expanded, settled, measuredHidden, hidden, maxHidden, before, itemCount, size, truncate, compact, widthChanges]);

    // The item count changing (a route change) is a different trail, so measure it afresh.
    // Which trail this is: the items' keys, in order. A different trail (a route change, in a layout that keeps the
    // breadcrumb mounted) starts over — collapsed again if it is long, and measured afresh — instead of inheriting the
    // last page's expansion. Items with no `key` of their own are told apart by position only, so they can't tell one
    // page's trail from another's of the same length: give each item a `key` (its `href` will do).
    const trailKey = items.map((item) => String(item.key)).join("/");
    const measuredTrail = useRef(trailKey);
    useIsomorphicLayoutEffect(() => {
      // Not on mount, which would undo the measurement that has just started.
      if (measuredTrail.current === trailKey) return;
      measuredTrail.current = trailKey;
      setExpanded(false);
      setMeasuredHidden(0);
      setSettled(false);
    }, [trailKey]);

    // The "…" button is what has keyboard focus when it is used, and expanding removes it — so focus moves on to
    // the first item it revealed instead of dropping to the top of the document.
    useEffect(() => {
      if (!expanded || !focusRevealed.current) return;
      focusRevealed.current = false;
      const revealed = listRef.current?.children[before];
      revealed?.querySelector<HTMLElement>(FOCUSABLE)?.focus();
    }, [expanded, before]);

    const expand = () => {
      focusRevealed.current = true;
      setExpanded(true);
    };

    const visible: Array<ReactElement | "ellipsis"> =
      hidden > 0 ? [...items.slice(0, before), "ellipsis", ...items.slice(before + hidden)] : items;
    const entries = visible.map((entry, index) => {
      const isLast = index === visible.length - 1;
      if (entry === "ellipsis") return { key: "ellipsis", isLast, isParent: false, node: null as ReactNode };
      return { key: String(entry.key ?? index), isLast, isParent: entry === parent, node: entry as ReactNode };
    });

    // Measuring: one line, nothing shrinks. Once settled (fully collapsed and still too wide), or when the trail was
    // expanded, the truncation the caller asked for applies; otherwise it always does.
    const measuring = containerMode && !expanded && !settled;
    const truncating = truncate && (!containerMode || settled || expanded);
    const compactActive = compact !== "never" && hasParent;

    const mergedRef = mergeRefs(ref, navRef);

    return (
      <BreadcrumbContext.Provider value={{ size, separator, tone, underline, truncate: truncating }}>
        <nav
          {...props}
          dir={dir}
          ref={mergedRef}
          aria-label={ariaLabelledBy ? undefined : (ariaLabel ?? labels.navigation)}
          aria-labelledby={ariaLabelledBy}
          className={cx(
            styles.root,
            sizeClass[size],
            compactActive && compactClass[compact],
            measuring && styles.measuring,
            truncating && styles.truncating,
            className,
          )}
        >
          {/* The `list` role is stated outright, for the reason given at `BreadcrumbItem`. */}
          {/* eslint-disable-next-line jsx-a11y/no-redundant-roles -- deliberate; see `BreadcrumbItem`. */}
          <ol ref={listRef} role="list" className={styles.list}>
            {entries.map(({ key, node, isLast, isParent }) => (
              <ItemPositionContext.Provider key={key} value={{ isLast, isParent }}>
                {node ?? (
                  <BreadcrumbItem>
                    <IconButton
                      icon={DotsThreeIcon}
                      variant="tertiary"
                      size={expandSizeForSize[size]}
                      aria-label={labels.expand(hidden)}
                      onClick={expand}
                      className={styles.expand}
                    />
                  </BreadcrumbItem>
                )}
              </ItemPositionContext.Provider>
            ))}
          </ol>
        </nav>
      </BreadcrumbContext.Provider>
    );
  },
);
BreadcrumbRoot.displayName = "Breadcrumb";

type BreadcrumbComponent = typeof BreadcrumbRoot & {
  Item: typeof BreadcrumbItem;
  Link: typeof BreadcrumbLink;
  Page: typeof BreadcrumbPage;
};

export const Breadcrumb: BreadcrumbComponent = Object.assign(BreadcrumbRoot, {
  Item: BreadcrumbItem,
  Link: BreadcrumbLink,
  Page: BreadcrumbPage,
});

