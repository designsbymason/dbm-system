import { Slot } from "@radix-ui/react-slot";
import { forwardRef, useEffect, useRef, useState } from "react";
import type { ElementType } from "react";
import { cx } from "@dbm-system/utils";
import styles from "./Affix.module.css";
import type { AffixAxis, AffixEdge, AffixProps } from "./Affix.types";

type PhysicalEdge = "top" | "bottom" | "left" | "right";

/**
 * The CSS *positioning* property to set for a given `axis`/`edge` pair.
 * Vertical stays physical (`top`/`bottom`) — writing-mode changes (the
 * only thing that would ever flip those) are a far rarer concern than
 * RTL, and every other physical/logical choice already made in this
 * codebase (`marginBlockEnd`, `borderBlock`, …) only varies the *block*
 * axis's naming, never its physical direction. Horizontal uses the CSS
 * logical properties `insetInlineStart`/`insetInlineEnd` specifically so
 * `edge="start"` correctly means "left in LTR, right in RTL" without this
 * component (or its consumer) needing to check direction itself — the
 * browser already resolves logical properties against the element's own
 * computed `direction`.
 */
function cssInsetProperty(axis: AffixAxis, edge: AffixEdge): string {
  if (axis === "vertical") return edge === "start" ? "top" : "bottom";
  return edge === "start" ? "insetInlineStart" : "insetInlineEnd";
}

/**
 * The *physical* edge (`top`/`bottom`/`left`/`right`) a given `axis`/
 * `edge`/`direction` combination resolves to — needed only for the stuck-
 * detection math below, never for the CSS itself (which uses logical
 * properties directly and lets the browser handle direction). `entry.
 * boundingClientRect`/`getBoundingClientRect()` always report physical
 * coordinates regardless of `direction`, so comparing against the wrong
 * physical edge in RTL would silently detect stuck-ness on the mirror
 * side from the one actually rendered.
 */
function resolvePhysicalEdge(axis: AffixAxis, edge: AffixEdge, direction: string): PhysicalEdge {
  if (axis === "vertical") return edge === "start" ? "top" : "bottom";
  const isRtl = direction === "rtl";
  if (edge === "start") return isRtl ? "right" : "left";
  return isRtl ? "left" : "right";
}

/**
 * A sticky-positioning wrapper — sticky table headers, filter bars, section
 * nav (`axis="vertical"`, the default) or a sticky first column in a
 * comparison table, a sticky lead card in a horizontally-scrolling swiper
 * (`axis="horizontal"`). Tracks its own stuck state via
 * `IntersectionObserver` (a hidden sentinel placed at the edge it sticks
 * to), exposed as `data-stuck` and via `onStickyChange`, so a shadow/
 * border can be applied only once it's actually stuck. SSR-safe: the
 * observer only attaches client-side.
 *
 * `axis="horizontal"` only actually engages against a *scrolling*
 * container — `scrollContainerRef` is effectively required for it (unlike
 * `axis="vertical"`, where the whole page scrolling is the common case),
 * since page-level horizontal scroll is rare.
 *
 * Renders a plain `<div>` by default; pass `asChild` to render the sticky
 * positioning onto `children` directly instead (via Radix `Slot`) — the
 * way to build a genuinely sticky `<table>` column/header with real
 * markup, since a `<div>` can't be wrapped around a `<td>`/`<th>` without
 * breaking the row (`<Affix asChild axis="horizontal"><td>…</td></Affix>`
 * makes the cell itself the sticky element). The sentinel stays a plain
 * `<div>` sibling either way (see below) — see the `WithinTable` story
 * for how that plays out inside a real `<tr>`.
 *

 * Renders the sentinel as a plain sibling of the sticky element, not
 * wrapped together with it — a real, previously-shipped bug (found via
 * direct user report, not caught by any prior test): wrapping both in a
 * shared `position: relative` container made that wrapper the sticky
 * element's own CSS *containing block*, and since the wrapper was only
 * ever as tall as the sticky content itself (the sentinel adds no flow
 * height), there was almost no room for the element to actually stay
 * pinned — it would detach and scroll off-screen almost immediately
 * instead of remaining visible at the edge. Siblings inherit whatever
 * containing block the *consumer's* own surrounding layout provides,
 * which normally spans the whole scrollable region this is meant to
 * stick through.
 *
 * @example
 * ```tsx
 * <Affix offset={0}>
 *   <TableHeader />
 * </Affix>
 * <Affix edge="end" onStickyChange={setIsStuck}>
 *   <FilterBar />
 * </Affix>
 * <Affix scrollContainerRef={panelRef}>
 *   <FilterBar />
 * </Affix>
 * <Affix axis="horizontal" scrollContainerRef={tableScrollRef}>
 *   <LeadColumn />
 * </Affix>
 * <Affix asChild axis="horizontal" scrollContainerRef={tableScrollRef}>
 *   <td>Lead cell</td>
 * </Affix>
 * ```
 */
export const Affix = forwardRef<HTMLDivElement, AffixProps>(
  (
    {
      axis = "vertical",
      edge = "start",
      offset = 0,
      scrollContainerRef,
      onStickyChange,
      asChild = false,
      sentinelAs = "div",
      className,
      style,
      children,
      ...props
    },
    ref,
  ) => {
    const sentinelRef = useRef<HTMLElement>(null);
    const [isStuck, setIsStuck] = useState(false);

    const hasWarnedHorizontalNoContainerRef = useRef(false);
    if (process.env.NODE_ENV !== "production") {
      if (
        axis === "horizontal" &&
        !scrollContainerRef &&
        !hasWarnedHorizontalNoContainerRef.current
      ) {
        hasWarnedHorizontalNoContainerRef.current = true;
        console.warn(
          'Affix: axis="horizontal" without scrollContainerRef — page-level horizontal scroll is rare, so this almost always means the stuck-state detection is measuring against the wrong scroll context (the viewport, not the actual horizontally-scrolling container). Pass scrollContainerRef pointing at the element that actually scrolls sideways (a comparison table\'s scroll wrapper, a swiper\'s track).',
        );
      }
    }

    useEffect(() => {
      const sentinel = sentinelRef.current;
      if (!sentinel) return undefined;

      const observer = new IntersectionObserver(
        ([entry]) => {
          if (!entry) return;
          // Deliberately not `!entry.isIntersecting` — that's direction-
          // agnostic and can't tell "the sentinel scrolled past the edge"
          // (genuinely stuck) from "the sentinel hasn't been scrolled to
          // yet" (mounted below/beside the fold), since both report
          // `isIntersecting: false`. Comparing the sentinel's own edge
          // against the observed root's edge disambiguates: only
          // actually having crossed counts.
          //
          // Deliberately not `entry.rootBounds` either, despite that
          // looking like the obvious source for "the root's edge" — a
          // real, previously-shipped bug: when this renders inside a
          // nested browsing context (an iframe within an iframe, e.g.
          // Storybook's own preview iframe) and `root` is `null`, the
          // browser resolves the *implicit* root to the outermost
          // top-level viewport, and reports `rootBounds` in *that*
          // viewport's own coordinate frame — while `boundingClientRect`
          // stays in the sentinel's own local document frame. Computing
          // the reference edge locally instead — from the same `root`
          // this observer itself was configured with — guarantees the
          // same coordinate frame as `entry.boundingClientRect` (both
          // relative to the sentinel's own document) no matter how deep
          // it's nested.
          const rootEl = scrollContainerRef?.current;
          const win = sentinel.ownerDocument.defaultView;
          const rootRect = rootEl
            ? rootEl.getBoundingClientRect()
            : { top: 0, bottom: win?.innerHeight ?? 0, left: 0, right: win?.innerWidth ?? 0 };
          // `getBoundingClientRect()` is always physical, regardless of
          // `direction` — resolve which physical edge `edge` actually
          // means before comparing, so `axis="horizontal"` keeps working
          // correctly under `direction: rtl` (where `edge="start"` is the
          // *right* physically, not the left).
          const direction = win?.getComputedStyle(sentinel).direction ?? "ltr";
          const physicalEdge = resolvePhysicalEdge(axis, edge, direction);
          const stuck =
            physicalEdge === "top" || physicalEdge === "left"
              ? entry.boundingClientRect[physicalEdge] < rootRect[physicalEdge]
              : entry.boundingClientRect[physicalEdge] > rootRect[physicalEdge];
          setIsStuck(stuck);
          onStickyChange?.(stuck);
        },
        // `[0, 1]`, not `0`: the sentinel is one pixel tall, so near the edge it is only partly visible, or just touching it, and `isIntersecting` is
        // true for both. With a threshold of `0` nothing crosses as it then moves wholly into view, so no callback came and a soft scroll back to
        // the top left the stuck state (and any shadow drawn from it) on. Reaching a ratio of `1` is the crossing that reports it.
        { root: scrollContainerRef?.current ?? null, threshold: [0, 1] },
      );
      observer.observe(sentinel);
      return () => observer.disconnect();
    }, [axis, edge, onStickyChange, scrollContainerRef]);

    // Kept loosely typed (`ElementType`, not the narrower `"div" | "td" |
    // "th"` the public `sentinelAs` prop declares) at the point of use —
    // matching `Box.tsx`'s own established workaround for the same
    // underlying issue: JSX resolves a *narrow* union tag to a union of
    // per-tag-specific ref/prop types instead of a single general one,
    // which doesn't unify cleanly with `sentinelRef`'s own `HTMLElement`
    // typing. The public prop stays narrow (real autocomplete, no
    // nonsensical tags accepted); only this internal read is widened.
    const SentinelTag = sentinelAs as ElementType;
    const sentinel = (
      <SentinelTag ref={sentinelRef} aria-hidden="true" className={styles.sentinel} />
    );

    const Component = asChild ? Slot : "div";

    const root = (
      <Component
        ref={ref}
        {...props}
        // Always applied last (after `...props`) so they can never be
        // silently overridden by a same-named prop the caller passes —
        // confirmed exploitable before this fix: a consumer-supplied
        // `data-stuck` landed in `...props` (never destructured out
        // above) and silently won over the real computed stuck state,
        // the same bug class already fixed on Skeleton/ProgressBar/
        // ProgressCircle/Spinner/Button/IconButton/Checkbox/FieldError/
        // Input (`05-component-api-conventions.md` §3). `Slot` merges
        // these the same way — combining `className`/`style`, composing
        // event handlers — rather than one winning outright, so this
        // ordering guarantee holds in `asChild` mode too.
        data-stuck={isStuck || undefined}
        className={cx(styles.root, className)}
        style={{ [cssInsetProperty(axis, edge)]: `var(--dbm-space-${offset})`, ...style }}
      >
        {children}
      </Component>
    );

    // Sentinel ordering mirrors which edge it needs to detect crossing —
    // `edge="start"` sits immediately *before* the sticky content (so it
    // leaves the start edge right as the content would), `edge="end"`
    // immediately *after* — the same rule for both axes, since "before"/
    // "after" in DOM order is what determines which edge a sibling
    // approaches first, independent of which axis that edge is on.
    return edge === "start" ? (
      <>
        {sentinel}
        {root}
      </>
    ) : (
      <>
        {root}
        {sentinel}
      </>
    );
  },
);

Affix.displayName = "Affix";
