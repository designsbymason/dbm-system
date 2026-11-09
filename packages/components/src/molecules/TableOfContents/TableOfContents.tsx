import { CaretDownIcon, CaretUpIcon } from "@dbm-system/icons";
import { cx, mergeDefined, mergeRefs, useResolvedResponsiveValue, useScrollEdges } from "@dbm-system/utils";
import { forwardRef, useCallback, useEffect, useId, useLayoutEffect, useMemo, useRef, useState, useSyncExternalStore } from "react";
import type { CSSProperties, FocusEvent, KeyboardEvent, MouseEvent } from "react";
import { Affix } from "../../atoms/Affix";
import { Button } from "../../atoms/Button";
import { Icon } from "../../atoms/Icon";
import { IconButton } from "../../atoms/IconButton";
import type { IconSize } from "../../atoms/Icon";
import { Link } from "../../atoms/Link";
import { VisuallyHidden } from "../../atoms/VisuallyHidden";
import { NavigationMenu } from "../../organisms/NavigationMenu";
import { Popover } from "../Popover";
import styles from "./TableOfContents.module.css";
import type {
  TableOfContentsItem,
  TableOfContentsLabels,
  TableOfContentsProps,
  TableOfContentsSize,
  TableOfContentsTone,
} from "./TableOfContents.types";

const sizeClass: Record<TableOfContentsSize, string | undefined> = {
  xs: styles.sizeXs,
  sm: styles.sizeSm,
  md: styles.sizeMd,
  lg: styles.sizeLg,
  xl: styles.sizeXl,
};

const toneClass: Record<TableOfContentsTone, string | undefined> = {
  brand: styles.toneBrand,
  neutral: styles.toneNeutral,
};

const levelClass = [undefined, undefined, styles.level2, styles.level3, styles.level4] as const;

// One step down from the text's own size at the small end, the mapping `Breadcrumb` and `Button` use.
const iconSizeForSize: Record<TableOfContentsSize, IconSize> = { xs: "xs", sm: "xs", md: "sm", lg: "sm", xl: "md" };

// `useLayoutEffect` on the client, `useEffect` on the server — avoids React's "does nothing on the server" warning,
// the same as `Breadcrumb` and `Pagination`.
const useIsomorphicLayoutEffect = typeof window !== "undefined" ? useLayoutEffect : useEffect;

const defaultLabels: TableOfContentsLabels = {
  title: "On this page",
  navigation: "Table of contents",
  groupToggle: (label) => `Subsections of ${label}`,
  dropdownTrigger: (title, current) => `${title}: ${current}`,
};

/** The width below which `collapse="auto"` folds the list — the `sm` breakpoint (640px), in a form `matchMedia` takes. */
const NARROW_QUERY = "(max-width: 639.98px)";

type Level = 1 | 2 | 3 | 4;

/** An entry as it is drawn: written by the caller, or read from a heading. */
interface Entry {
  id: string;
  label: TableOfContentsItem["label"];
  level: Level;
  icon?: TableOfContentsItem["icon"];
  trailing?: TableOfContentsItem["trailing"];
  disabled?: boolean;
  testId?: string;
}

const clampLevel = (level: number): Level => Math.min(Math.max(Math.trunc(level) || 1, 1), 4) as Level;

/** The page's own preference, read when it is needed rather than at render, so a server render never touches it. */
const prefersReducedMotion = (): boolean =>
  typeof window !== "undefined" && typeof window.matchMedia === "function"
    ? window.matchMedia("(prefers-reduced-motion: reduce)").matches
    : false;

/** Reads the entries from the headings `selector` finds under `root`, in document order. */
function scan(root: ParentNode, selector: string): Entry[] {
  let elements: Element[];
  try {
    elements = [...root.querySelectorAll(selector)];
  } catch {
    // An invalid selector finds nothing; the effect's development warning says why.
    return [];
  }
  const ranks = elements.map((element) => {
    const match = /^H([1-6])$/.exec(element.tagName);
    return match ? Number(match[1]) : undefined;
  });
  const top = Math.min(...ranks.filter((rank): rank is number => rank !== undefined), 6);
  const entries: Entry[] = [];
  elements.forEach((element, index) => {
    const rank = ranks[index];
    if (!element.id) {
      if (process.env.NODE_ENV !== "production") {
        console.warn(`TableOfContents: a heading with no \`id\` was skipped, since there is nothing to link to: "${element.textContent?.trim()}".`);
      }
      return;
    }
    const level = rank !== undefined ? rank - top + 1 : Number(element.getAttribute("data-toc-level")) || 1;
    entries.push({ id: element.id, label: element.textContent?.trim() ?? "", level: clampLevel(level) });
  });
  return entries;
}

const sameEntries = (a: Entry[], b: Entry[]): boolean =>
  a.length === b.length && a.every((entry, index) => entry.id === b[index]?.id && entry.label === b[index]?.label && entry.level === b[index]?.level);

/** The hierarchical number of each entry ("1", "1.1", …), by the levels drawn. A skipped level counts as one. */
function numberEntries(entries: Entry[], format: (n: number) => string): string[] {
  const counters = [0, 0, 0, 0, 0];
  return entries.map((entry) => {
    counters[entry.level] = (counters[entry.level] ?? 0) + 1;
    for (let deeper = entry.level + 1; deeper < counters.length; deeper += 1) counters[deeper] = 0;
    for (let shallower = 1; shallower < entry.level; shallower += 1) if (!counters[shallower]) counters[shallower] = 1;
    return counters.slice(1, entry.level + 1).map(format).join(".");
  });
}

/** The nearest ancestor that scrolls vertically and is currently overflowing, other than the page and `except`. */
function scrollableAncestor(element: HTMLElement, except: HTMLElement | null): HTMLElement | null {
  for (let node = element.parentElement; node && node !== document.body && node !== document.documentElement; node = node.parentElement) {
    if (node !== except && /(auto|scroll)/.test(getComputedStyle(node).overflowY) && node.scrollHeight > node.clientHeight) return node;
  }
  return null;
}

/**
 * An outline of a page: a list of links to its sections, with the one being read marked as it scrolls.
 *
 * Give it `items`, or leave them out and it reads the `h2` and `h3` headings from the page (or from `contentRef`).
 * The current entry follows the scroll position and is marked `aria-current="location"`; a click scrolls to the
 * section (smoothly, unless the person prefers less motion) and keeps it clear of a sticky header with
 * `scrollOffset`. `sticky` keeps the outline in view beside long content, `collapse` folds it behind a button on a
 * small screen (a dropdown over the page with `foldedStyle="dropdown"`), and a long outline that scrolls on its own keeps the current entry in view.
 *
 * @example
 * ```tsx
 * <TableOfContents items={[{ id: "intro", label: "Intro" }, { id: "usage", label: "Usage" }]} />
 * <TableOfContents contentRef={articleRef} sticky collapse="auto" />
 * ```
 */
export const TableOfContents = forwardRef<HTMLElement, TableOfContentsProps>(
  (
    {
      items,
      contentRef,
      selector = "h2, h3",
      minLevel = 1,
      maxLevel = 4,
      activeId: controlledActiveId,
      defaultActiveId,
      onActiveIdChange,
      scrollContainerRef,
      scrollOffset = 0,
      smoothScroll = true,
      scrollToHash = true,
      sticky = false,
      stickyOffset,
      layout = "list",
      collapse = "never",
      foldedStyle = "inline",
      open: controlledOpen,
      defaultOpen = false,
      onOpenChange,
      size = "md",
      tone = "brand",
      highlightActive = true,
      numbered = false,
      formatNumber = String,
      movingMarker = false,
      collapsibleGroups = false,
      groupsDefaultOpen = true,
      showTitle = true,
      labels,
      className,
      style,
      onKeyDown,
      "aria-label": ariaLabel,
      "aria-labelledby": ariaLabelledBy,
      ...props
    },
    ref,
  ) => {
    const text = mergeDefined(defaultLabels, labels);
    const titleId = useId();
    const listId = useId();
    const listRef = useRef<HTMLUListElement>(null);
    const toggleRef = useRef<HTMLButtonElement>(null);
    const reading = items === undefined;
    const navRef = useRef<HTMLElement>(null);
    const popoverListRef = useRef<HTMLUListElement>(null);
    const setNavRef = useMemo(() => mergeRefs(ref, navRef), [ref]);
    // Whether `collapse="auto"` is folding the outline right now: a media query the stylesheet asks too.
    const subscribeNarrow = useCallback(
      (notify: () => void) => {
        if (collapse !== "auto" || typeof window.matchMedia !== "function") return () => {};
        const query = window.matchMedia(NARROW_QUERY);
        query.addEventListener?.("change", notify);
        return () => query.removeEventListener?.("change", notify);
      },
      [collapse],
    );
    const narrow = useSyncExternalStore(
      subscribeNarrow,
      () => collapse === "auto" && typeof window.matchMedia === "function" && window.matchMedia(NARROW_QUERY).matches,
      () => false,
    );
    // A width map is resolved in the browser: the first render is the narrowest layout, as a server render is, and corrects before paint.
    const isRow = useResolvedResponsiveValue(layout, "list") === "row";
    const folded = !isRow && (collapse === "always" || narrow);
    /** The room a sticky, folded bar takes at the top of the scrolling area: headings are kept clear of it. */
    const stickyBarHeight = useCallback((): number => {
      const nav = navRef.current;
      if (!nav || !(folded || isRow)) return 0;
      const style = getComputedStyle(nav);
      return style.position === "sticky" ? nav.getBoundingClientRect().height + (parseFloat(style.top) || 0) : 0;
    }, [folded, isRow]);

    // --- The entries ---
    const [scanned, setScanned] = useState<Entry[]>([]);
    useEffect(() => {
      if (!reading) return undefined;
      const root: ParentNode = contentRef?.current ?? document;
      const observed: Node = contentRef?.current ?? document.body;
      if (process.env.NODE_ENV !== "production") {
        try {
          document.createDocumentFragment().querySelector(selector);
        } catch {
          console.warn(`TableOfContents: \`selector\` is not a valid CSS selector: "${selector}".`);
        }
      }
      const read = () => {
        const next = scan(root, selector);
        setScanned((current) => (sameEntries(current, next) ? current : next));
      };
      read();
      // Headings that arrive or change later (a page that loads its content, a client-side route) are picked up.
      let frame = 0;
      const observer = new MutationObserver(() => {
        cancelAnimationFrame(frame);
        frame = requestAnimationFrame(read);
      });
      observer.observe(observed, { childList: true, subtree: true, characterData: true });
      return () => {
        cancelAnimationFrame(frame);
        observer.disconnect();
      };
    }, [reading, contentRef, selector]);

    // Only the levels asked for, the shallowest drawn at the top of the indentation.
    const low = clampLevel(minLevel);
    const high = Math.max(clampLevel(maxLevel), low);
    const everyEntry: Entry[] = reading
      ? scanned
      : items.map((item) => ({
          id: item.id,
          label: item.label,
          level: clampLevel(item.level ?? 1),
          icon: item.icon,
          trailing: item.trailing,
          disabled: item.disabled,
          testId: item["data-testid"],
        }));
    const entries = everyEntry.filter((entry) => entry.level >= low && entry.level <= high).map((entry) => ({ ...entry, level: clampLevel(entry.level - low + 1) }));
    const numbers = numbered ? numberEntries(entries, formatNumber) : [];

    // --- The current entry ---
    const isControlled = controlledActiveId !== undefined;
    const [internalActiveId, setInternalActiveId] = useState(defaultActiveId);
    const activeId = isControlled ? controlledActiveId : internalActiveId;
    const activeRef = useRef(activeId);
    activeRef.current = activeId;
    const onChangeRef = useRef(onActiveIdChange);
    onChangeRef.current = onActiveIdChange;

    const setActive = useCallback(
      (id: string | undefined) => {
        if (id === activeRef.current) return;
        activeRef.current = id;
        if (!isControlled) setInternalActiveId(id);
        onChangeRef.current?.(id);
      },
      [isControlled],
    );

    // While a click is scrolling to its section the outline holds that section, and catches up once the scroll stops.
    const holdingRef = useRef(false);

    /** Scrolls the container or the page so `target` sits `scrollOffset` pixels from the top. */
    const scrollToTarget = useCallback(
      (target: HTMLElement, behavior: ScrollBehavior) => {
        const container = scrollContainerRef?.current ?? null;
        const distance =
          target.getBoundingClientRect().top - (container ? container.getBoundingClientRect().top : 0) - scrollOffset - stickyBarHeight();
        if (container) container.scrollTo({ top: container.scrollTop + distance, behavior });
        else window.scrollTo({ top: window.scrollY + distance, behavior });
      },
      [scrollContainerRef, scrollOffset, stickyBarHeight],
    );

    const entryIds = entries.map((entry) => entry.id).join("\n");
    useEffect(() => {
      if (isControlled || entryIds === "") return undefined;
      const ids = entryIds.split("\n");
      const container = scrollContainerRef?.current ?? null;
      const scroller: HTMLElement | Window = container ?? window;

      const measure = (): string | undefined => {
        const limit = (container ? container.getBoundingClientRect().top : 0) + scrollOffset + stickyBarHeight() + 1;
        let current: string | undefined;
        let currentTop = -Infinity;
        for (const id of ids) {
          const top = document.getElementById(id)?.getBoundingClientRect().top;
          if (top !== undefined && top <= limit && top > currentTop) {
            current = id;
            currentTop = top;
          }
        }
        // Nothing has reached the top yet (the first heading sits a little below it): the first heading showing in the
        // scrolling area is the one being read. One still below the fold marks nothing.
        if (current === undefined) {
          const bottom = container ? container.getBoundingClientRect().bottom : window.innerHeight;
          let firstTop = Infinity;
          for (const id of ids) {
            const top = document.getElementById(id)?.getBoundingClientRect().top;
            if (top !== undefined && top > limit && top < bottom && top < firstTop) {
              current = id;
              firstTop = top;
            }
          }
        }
        // A short last section can never reach the top; at the very end of the page it is the one being read.
        const area = container ?? document.documentElement;
        const atEnd = area.scrollHeight > area.clientHeight && Math.ceil(area.scrollTop + area.clientHeight) >= area.scrollHeight - 1;
        if (atEnd) {
          const last = [...ids].reverse().find((id) => document.getElementById(id));
          if (last) return last;
        }
        return current;
      };

      let frame = 0;
      let release = 0;
      const update = () => {
        frame = 0;
        // With none of the sections on the page there is nothing to read a position from, so the mark stays as it
        // is — a scroll of the page must not clear the entry of an outline that points elsewhere.
        if (!ids.some((id) => document.getElementById(id))) return;
        if (holdingRef.current) {
          window.clearTimeout(release);
          release = window.setTimeout(() => {
            holdingRef.current = false;
            setActive(measure());
          }, 150);
          return;
        }
        setActive(measure());
      };
      const schedule = () => {
        if (!frame) frame = requestAnimationFrame(update);
      };

      // A given `defaultActiveId` stands until the first scroll; otherwise the outline starts where the page is.
      if (activeRef.current === undefined) {
        const initial = measure();
        if (initial !== undefined) setActive(initial);
      }
      scroller.addEventListener("scroll", schedule, { passive: true });
      window.addEventListener("resize", schedule);
      return () => {
        scroller.removeEventListener("scroll", schedule);
        window.removeEventListener("resize", schedule);
        cancelAnimationFrame(frame);
        window.clearTimeout(release);
      };
    }, [entryIds, isControlled, scrollContainerRef, scrollOffset, setActive, stickyBarHeight]);

    // --- A page opened at `#id` ---
    useEffect(() => {
      if (!scrollToHash || entryIds === "") return undefined;
      const raw = window.location.hash.slice(1);
      if (!raw) return undefined;
      let id = raw;
      try {
        id = decodeURIComponent(raw);
      } catch {
        // A malformed escape: the raw text is the best guess.
      }
      const target = document.getElementById(id);
      if (!target || !entryIds.split("\n").includes(id)) return undefined;
      // After the browser's own jump to the fragment, so this is the position that stands.
      const frame = requestAnimationFrame(() => {
        scrollToTarget(target, "auto");
        setActive(id);
      });
      return () => cancelAnimationFrame(frame);
    }, [scrollToHash, entryIds, scrollToTarget, setActive]);

    // --- The current entry stays in view in an outline that scrolls on its own ---
    const keepCurrentInView = useCallback(
      (list: HTMLElement | null) => {
        const link = list?.querySelector<HTMLElement>('[aria-current="location"]');
        // A folded, closed list has no box to measure.
        if (!link || link.getClientRects().length === 0) return;
        const area = scrollableAncestor(link, scrollContainerRef?.current ?? null);
        if (!area) return;
        const box = area.getBoundingClientRect();
        const rect = link.getBoundingClientRect();
        // Moves the box itself, not `scrollIntoView`, which would scroll the page as well.
        if (rect.top < box.top) area.scrollTop += rect.top - box.top;
        else if (rect.bottom > box.bottom) area.scrollTop += rect.bottom - box.bottom;
      },
      [scrollContainerRef],
    );
    useEffect(() => {
      keepCurrentInView(listRef.current);
    }, [activeId, keepCurrentInView]);

    // --- Folding ---
    const isOpenControlled = controlledOpen !== undefined;
    const [internalOpen, setInternalOpen] = useState(defaultOpen);
    const isOpen = isOpenControlled ? controlledOpen : internalOpen;
    const setOpen = (next: boolean) => {
      if (next === isOpen) return;
      if (!isOpenControlled) setInternalOpen(next);
      onOpenChange?.(next);
    };
    const folds = !isRow && collapse !== "never";
    const dropdown = folds && foldedStyle === "dropdown";
    // The dropdown's panel is only ever open while the outline is folded, whatever the state says at a wide width.
    const popoverOpen = dropdown && folded && isOpen;
    // Opening the dropdown scrolls the current entry into view in the panel (a long outline scrolls there).
    useEffect(() => {
      if (!popoverOpen) return undefined;
      const frame = requestAnimationFrame(() => keepCurrentInView(popoverListRef.current));
      return () => cancelAnimationFrame(frame);
    }, [popoverOpen, activeId, keepCurrentInView]);
    // Focus inside the list holds it open, so a screen that narrows can't hide the control that has focus.
    const [focusInside, setFocusInside] = useState(false);
    // The entry that has focus, so the group it sits in can't fold away under it.
    const [focusedId, setFocusedId] = useState<string | undefined>();
    const keepOpen = (event: FocusEvent<HTMLUListElement>, inside: boolean) => {
      if (inside) {
        setFocusInside(true);
        setFocusedId((event.target as HTMLElement).closest<HTMLElement>("li")?.dataset.tocId);
      } else if (!event.currentTarget.contains(event.relatedTarget as Node | null)) {
        setFocusInside(false);
        setFocusedId(undefined);
      }
    };

    // --- Groups: an entry with deeper entries after it can fold them away ---
    const [groupOverride, setGroupOverride] = useState<Record<string, boolean>>({});
    // The last entry of each entry's group (itself when it has none).
    const groupEnd = entries.map((entry, index) => {
      let end = index;
      while (entries[end + 1] && (entries[end + 1] as Entry).level > entry.level) end += 1;
      return end;
    });
    const contains = (parent: number, child: number) => child > parent && child <= (groupEnd[parent] ?? parent);
    const activeIndex = entries.findIndex((entry) => entry.id === activeId);
    const focusedIndex = entries.findIndex((entry) => entry.id === focusedId);
    /** Whether the group is open as the person (or the default) left it, ignoring what holds it open. */
    const groupOpenByHand = (index: number) => groupOverride[(entries[index] as Entry).id] ?? (groupsDefaultOpen || contains(index, activeIndex));
    const groupIsOpen = (index: number) => groupOpenByHand(index) || contains(index, focusedIndex);
    const isShown = (index: number) =>
      !collapsibleGroups || entries.every((_, parent) => parent >= index || !contains(parent, index) || groupIsOpen(parent));
    // The current entry sits in a folded group: its nearest shown ancestor carries the marker instead.
    let containsMark = -1;
    if (collapsibleGroups && activeIndex >= 0 && !isShown(activeIndex)) {
      for (let parent = activeIndex - 1; parent >= 0 && containsMark < 0; parent -= 1) {
        if (contains(parent, activeIndex) && isShown(parent)) containsMark = parent;
      }
    }

    // --- The moving marker: one bar placed over the marked entry ---
    const markerRef = useRef<HTMLSpanElement>(null);
    const placeMarker = useCallback(() => {
      const marker = markerRef.current;
      const body = marker?.parentElement;
      if (!marker || !body) return;
      const row = body.querySelector<HTMLElement>("[data-toc-marked]");
      if (!row || row.getClientRects().length === 0) {
        marker.dataset.visible = "false";
        return;
      }
      const rowBox = row.getBoundingClientRect();
      marker.style.setProperty("--toc-marker-y", `${rowBox.top - body.getBoundingClientRect().top}px`);
      marker.style.setProperty("--toc-marker-h", `${rowBox.height}px`);
      marker.dataset.visible = "true";
    }, []);
    // After every render: what is marked, what is shown and the text's size can all move it.
    useIsomorphicLayoutEffect(() => {
      if (movingMarker) placeMarker();
    });
    useEffect(() => {
      if (!movingMarker) return undefined;
      const marker = markerRef.current;
      // Slides only from the second placement on, so the bar starts where it belongs instead of travelling there.
      const frame = requestAnimationFrame(() => {
        if (marker) marker.dataset.animated = "true";
      });
      const observer = typeof ResizeObserver === "undefined" ? undefined : new ResizeObserver(placeMarker);
      if (listRef.current) observer?.observe(listRef.current);
      return () => {
        cancelAnimationFrame(frame);
        observer?.disconnect();
      };
    }, [movingMarker, placeMarker]);

    // --- Following a link ---
    const follow = (event: MouseEvent<HTMLAnchorElement>, id: string, instant = false) => {
      if (event.defaultPrevented || event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
      const target = document.getElementById(id);
      if (!target) return;
      event.preventDefault();
      scrollToTarget(target, smoothScroll && !instant && !prefersReducedMotion() ? "smooth" : "auto");
      holdingRef.current = true;
      setActive(id);
      try {
        // The address names the section, as a plain link would, without adding a history entry for each click.
        window.history.replaceState(window.history.state, "", `#${id}`);
      } catch {
        // A sandboxed frame may refuse to change its address; the scroll has already happened.
      }
      // A key press (`detail` is 0 for one) moves keyboard focus to the section, so the next Tab continues from there.
      if (event.detail === 0) {
        if (!target.hasAttribute("tabindex")) target.setAttribute("tabindex", "-1");
        target.focus({ preventScroll: true });
      } else if (folded && isOpen && !dropdown) {
        // The list is about to fold away under the pointer's own focus: hand it to the button.
        toggleRef.current?.focus({ preventScroll: true });
      }
      if (folded) setOpen(false);
    };

    const handleKeyDown = (event: KeyboardEvent<HTMLElement>) => {
      onKeyDown?.(event);
      if (event.defaultPrevented || event.key !== "Escape" || !folded || !isOpen) return;
      if (!listRef.current?.contains(event.target as Node)) return;
      setOpen(false);
      toggleRef.current?.focus();
    };

    // --- A row: one line of pills, drawn by `NavigationMenu` ---
    const rowListRef = useRef<HTMLUListElement>(null);
    // The ends of a row that is longer than the room fade out, as the ends of a scrolling `Navbar.Links` do.
    const { overflowStart, overflowEnd } = useScrollEdges(rowListRef, "horizontal", { itemSelector: "li", enabled: isRow });
    // The pill that holds the current entry is kept in view, by moving the row itself (not the page).
    useEffect(() => {
      const row = rowListRef.current;
      if (!isRow || !row) return;
      const pill = row.querySelector<HTMLElement>("[data-toc-marked]");
      if (!pill || pill.getClientRects().length === 0 || row.scrollWidth <= row.clientWidth) return;
      const box = row.getBoundingClientRect();
      const rect = pill.getBoundingClientRect();
      if (rect.left < box.left) row.scrollLeft += rect.left - box.left;
      else if (rect.right > box.right) row.scrollLeft += rect.right - box.right;
    }, [isRow, activeId]);

    if (entries.length === 0) return null;

    const currentIndex = entries.findIndex((entry) => entry.id === activeId);
    const currentEntry = currentIndex >= 0 ? entries[currentIndex] : undefined;
    const navigationName = ariaLabel ?? (ariaLabelledBy === undefined && !showTitle ? text.navigation : undefined);
    const lookClasses = cx(styles.root, sizeClass[size], toneClass[tone], highlightActive && styles.highlighted);
    const stickyTop = typeof stickyOffset === "string" ? stickyOffset : stickyOffset !== undefined ? `var(--dbm-space-${stickyOffset})` : undefined;

    if (isRow) {
      const { dir: navDir, onChange: _onChange, defaultValue: _defaultValue, ...navProps } = props as typeof props & { onChange?: unknown; defaultValue?: unknown };
      return (
        <NavigationMenu
          {...(navProps as Record<string, unknown>)}
          ref={setNavRef}
          aria-label={ariaLabel ?? text.navigation}
          dir={navDir === "rtl" ? "rtl" : navDir === "ltr" ? "ltr" : undefined}
          size={size}
          rounded
          currentVariant="subtle"
          currentType="location"
          data-overflow-start={overflowStart ? "" : undefined}
          data-overflow-end={overflowEnd ? "" : undefined}
          className={cx(styles.row, sticky !== false && styles.stickyRow, className)}
          style={sticky !== false && stickyTop !== undefined ? ({ "--toc-sticky-top": stickyTop, ...style } as CSSProperties) : style}
          // A link of the row (a pill, or a pill's own link beside its caret) scrolls to its section as a link in the list does: caught here, since a
          // split pill's link takes no handler of its own.
          onClickCapture={(event: MouseEvent<HTMLElement>) => {
            const anchor = (event.target as HTMLElement).closest<HTMLAnchorElement>("a[href^='#']");
            const id = anchor?.getAttribute("href")?.slice(1);
            // A link in a pill's panel jumps instead of gliding: as the panel closes, focus returns to the pill's caret, and that would cut a smooth scroll short.
            if (anchor && id) follow(event as unknown as MouseEvent<HTMLAnchorElement>, id, !rowListRef.current?.contains(anchor));
          }}
          onKeyDown={onKeyDown as never}
        >
          <NavigationMenu.List ref={rowListRef} className={styles.rowList}>
            {entries.map((entry, index) => {
              if (entry.level !== 1) return null;
              const end = groupEnd[index] ?? index;
              const inside = entries.slice(index + 1, end + 1);
              const isActive = entry.id === activeId;
              const marked = isActive || (activeIndex > index && activeIndex <= end);
              const name = typeof entry.label === "string" ? entry.label : "section";
              const label = (
                <>
                  {numbered && <span className={styles.number}>{numbers[index]}</span>}
                  {entry.label}
                </>
              );
              return (
                <NavigationMenu.Item key={entry.id} value={entry.id} data-toc-id={entry.id} data-toc-marked={marked ? "" : undefined}>
                  {inside.length > 0 ? (
                    <>
                      {/* `current` only when this is the entry being read: a pill that holds it is marked by its panel, with no `aria-current` of its own. */}
                      <NavigationMenu.Trigger
                        href={`#${entry.id}`}
                        current={isActive || undefined}
                        disabled={entry.disabled}
                        aria-label={text.groupToggle(name)}
                        icon={entry.icon}
                        badge={entry.trailing}
                        data-testid={entry.testId}
                      >
                        {label}
                      </NavigationMenu.Trigger>
                      <NavigationMenu.Content>
                        {inside.map((child) => (
                          <NavigationMenu.Link key={child.id} href={`#${child.id}`} current={child.id === activeId} disabled={child.disabled} data-testid={child.testId}>
                            {child.label}
                          </NavigationMenu.Link>
                        ))}
                      </NavigationMenu.Content>
                    </>
                  ) : (
                    <NavigationMenu.Link href={`#${entry.id}`} current={isActive} disabled={entry.disabled} icon={entry.icon} badge={entry.trailing} data-testid={entry.testId}>
                      {label}
                    </NavigationMenu.Link>
                  )}
                </NavigationMenu.Item>
              );
            })}
          </NavigationMenu.List>
        </NavigationMenu>
      );
    }

    /** The list of links, drawn in the outline itself and, for the dropdown, again in its panel. */
    const renderList = (listElementRef: typeof listRef, id?: string) => (
      // The roles are stated outright: Safari with VoiceOver drops list semantics once the markers are removed.
      // eslint-disable-next-line jsx-a11y/no-redundant-roles -- deliberate; see the comment above.
      <ul role="list" id={id} ref={listElementRef} className={styles.list} onFocus={(event) => keepOpen(event, true)} onBlur={(event) => keepOpen(event, false)}>
        {entries.map((entry, index) => {
          if (!isShown(index)) return null;
          const isActive = entry.id === activeId;
          const isGroup = collapsibleGroups && (groupEnd[index] ?? index) > index;
          const marked = isActive || index === containsMark;
          return (
            // eslint-disable-next-line jsx-a11y/no-redundant-roles -- deliberate; see the comment above.
            <li
              key={entry.id}
              role="listitem"
              data-toc-id={entry.id}
              data-toc-marked={marked ? "" : undefined}
              className={cx(styles.item, levelClass[entry.level], marked && styles.itemActive)}
            >
              <Link
                href={`#${entry.id}`}
                underline="none"
                disabled={entry.disabled}
                data-testid={entry.testId}
                className={cx(styles.link, isActive && styles.active)}
                aria-current={isActive ? "location" : undefined}
                onClick={(event) => follow(event, entry.id)}
              >
                {entry.icon && <Icon icon={entry.icon} size={iconSizeForSize[size]} className={styles.icon} />}
                {numbered && <span className={styles.number}>{numbers[index]}</span>}
                <span className={styles.label}>{entry.label}</span>
                {entry.trailing && <span className={styles.trailing}>{entry.trailing}</span>}
              </Link>
              {isGroup && (
                <IconButton
                  icon={groupIsOpen(index) ? CaretUpIcon : CaretDownIcon}
                  size="xs"
                  variant="tertiary"
                  className={styles.groupToggle}
                  aria-label={text.groupToggle(typeof entry.label === "string" ? entry.label : "section")}
                  aria-expanded={groupIsOpen(index)}
                  onClick={() => setGroupOverride((current) => ({ ...current, [entry.id]: !groupIsOpen(index) }))}
                />
              )}
            </li>
          );
        })}
      </ul>
    );

    // The current entry's text on the dropdown's button. Its accessible name says the outline's name too, and contains
    // everything the button shows (a number included), so the visible text is always inside the name.
    const currentText =
      currentEntry && typeof currentEntry.label === "string" ? (numbered ? `${numbers[currentIndex]} ${currentEntry.label}` : currentEntry.label) : undefined;
    const triggerLabel = currentEntry ? (
      <span className={styles.currentLabel}>
        {currentText === undefined && <VisuallyHidden>{text.title}</VisuallyHidden>}
        {currentText === undefined && " "}
        {numbered && <span className={styles.number}>{numbers[currentIndex]}</span>}
        {currentEntry.label}
      </span>
    ) : (
      <span className={styles.currentLabel}>{text.title}</span>
    );

    const nav = (
      // eslint-disable-next-line jsx-a11y/no-noninteractive-element-interactions -- Escape is heard from the links and button inside; the nav takes no key itself.
      <nav
        {...props}
        ref={setNavRef}
        // After `...props`, so a caller's own value can't replace what the component works out.
        aria-label={navigationName}
        aria-labelledby={ariaLabel === undefined ? (ariaLabelledBy ?? (showTitle ? titleId : undefined)) : undefined}
        className={cx(
          lookClasses,
          movingMarker && styles.moving,
          collapse === "always" && styles.collapseAlways,
          collapse === "auto" && styles.collapseAuto,
          dropdown && styles.dropdown,
          sticky === "folded" && styles.stickyFolded,
          folds && !isOpen && !focusInside && styles.folded,
          className,
        )}
        style={
          sticky === "folded" && stickyTop !== undefined
            ? ({ "--toc-sticky-top": stickyTop, ...style } as CSSProperties)
            : style
        }
        onKeyDown={handleKeyDown}
      >
        {showTitle && (
          <p id={titleId} className={styles.title}>
            {text.title}
          </p>
        )}
        {folds && !dropdown && (
          <Button
            ref={toggleRef}
            variant="secondary"
            size={size}
            fullWidth
            trailingIcon={isOpen ? CaretUpIcon : CaretDownIcon}
            aria-expanded={isOpen}
            aria-controls={listId}
            className={styles.toggle}
            onClick={() => setOpen(!isOpen)}
          >
            {text.title}
          </Button>
        )}
        {dropdown && (
          <Popover open={popoverOpen} onOpenChange={setOpen}>
            <Popover.Trigger asChild>
              <Button
                ref={toggleRef}
                variant="secondary"
                size={size}
                fullWidth
                trailingIcon={popoverOpen ? CaretUpIcon : CaretDownIcon}
                aria-label={currentText === undefined ? undefined : text.dropdownTrigger(text.title, currentText)}
                className={cx(styles.toggle, styles.dropdownTrigger)}
              >
                {triggerLabel}
              </Button>
            </Popover.Trigger>
            <Popover.Content
              side="bottom"
              align="start"
              sideOffset={4}
              collisionPadding={8}
              hideArrow
              aria-label={text.title}
              className={styles.dropdownContent}
              onCloseAutoFocus={(event) => {
                // Radix gives focus back to the button with a plain `focus()`, which scrolls the page to reveal it and cuts
                // short the smooth scroll to the section that was just chosen. Give it back without scrolling — unless a
                // key press has already put focus on the section, which stays where it is.
                event.preventDefault();
                const holder = document.activeElement;
                if (!holder || holder === document.body) toggleRef.current?.focus({ preventScroll: true });
              }}
              onOpenAutoFocus={(event) => {
                // Focus goes to the entry being read (or the first), not to the panel itself.
                event.preventDefault();
                const list = popoverListRef.current;
                (list?.querySelector<HTMLElement>('[aria-current="location"]') ?? list?.querySelector<HTMLElement>("a"))?.focus({ preventScroll: true });
              }}
            >
              <nav aria-label={ariaLabel ?? text.navigation} className={lookClasses}>
                {renderList(popoverListRef)}
              </nav>
            </Popover.Content>
          </Popover>
        )}
        {/* While the dropdown is what shows, its list isn't drawn here as well: an entry's data-testid stays unique. */}
        {!(dropdown && folded) && (
          <div className={styles.body}>
            {movingMarker && <span ref={markerRef} aria-hidden="true" className={styles.marker} data-visible="false" />}
            {renderList(listRef, listId)}
          </div>
        )}
      </nav>
    );
    return sticky === true ? (
      <Affix asChild offset={typeof stickyOffset === "string" ? undefined : stickyOffset} scrollContainerRef={scrollContainerRef}>
        {nav}
      </Affix>
    ) : (
      nav
    );
  },
);
TableOfContents.displayName = "TableOfContents";
