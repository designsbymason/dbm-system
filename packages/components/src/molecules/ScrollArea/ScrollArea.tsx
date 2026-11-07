import { cx, mergeRefs, useIsScrollable } from "@dbm-system/utils";
import * as ScrollAreaPrimitive from "@radix-ui/react-scroll-area";
import { forwardRef, useRef } from "react";
import styles from "./ScrollArea.module.css";
import type { ScrollAreaProps, ScrollAreaSize } from "./ScrollArea.types";
import { useDirection } from "../../atoms/DirectionProvider";

const toneClass: Record<"neutral" | "brand", string | undefined> = {
  neutral: undefined,
  brand: styles.toneBrand,
};

const sizeClass: Record<ScrollAreaSize, string | undefined> = {
  xs: styles.sizeXs,
  sm: styles.sizeSm,
  md: styles.sizeMd,
  lg: styles.sizeLg,
  xl: styles.sizeXl,
};

/**
 * A custom-styled scrollable region built on Radix ScrollArea — token-driven
 * overlay scrollbars in place of the browser's own, for any content that
 * overflows a bounded box. Has no intrinsic height of its own: set one via
 * `style`/`className` or the `maxHeight` shortcut, or it simply grows to fit
 * its content and never scrolls — the same requirement `Slider`'s vertical
 * orientation and `Table`'s own scroll container document.
 *
 * `ref` forwards to the outer frame — the box `variant`, `maxHeight`,
 * `className` and `style` all apply to. The actual scrolling happens one
 * level in, on Radix's own viewport element: `viewportRef` reaches it for
 * imperative scrolling or measuring, and `onScroll` fires on it rather than
 * the outer frame, which never scrolls itself. While the region is actually
 * scrollable it becomes keyboard-reachable (WCAG 2.1.1) and, once given
 * `aria-label`/`aria-labelledby`, an announced landmark region — matching
 * `Table`'s own scroll container, an unnamed `role="region"` is just noise,
 * so no name means no role, tab stop included either way.
 *
 * @example
 * ```tsx
 * <ScrollArea style={{ maxHeight: "16rem" }}>
 *   <LongList />
 * </ScrollArea>
 * <ScrollArea scrollbars="both" variant="ghost" maxHeight="20rem">
 *   <WideTallContent />
 * </ScrollArea>
 * <ScrollArea aria-label="Recent activity" maxHeight="24rem">
 *   <ActivityFeed />
 * </ScrollArea>
 * ```
 */
export const ScrollArea = forwardRef<HTMLDivElement, ScrollAreaProps>(
  (
    {
      children,
      variant = "bordered",
      size = "md",
      scrollbars = "vertical",
      showTrack = false,
      tone = "neutral",
      scrollbarVisibility = "hover",
      scrollHideDelay = 600,
      overscrollBehavior = "auto",
      maxHeight,
      dir: dirProp,
      onScroll,
      viewportRef,
      className,
      style,
      id,
      "aria-label": ariaLabel,
      "aria-labelledby": ariaLabelledBy,
      "data-testid": dataTestId,
      ...props
    },
    ref,
  ) => {
    const dir = useDirection(dirProp);
    const internalViewportRef = useRef<HTMLDivElement>(null);
    const showVertical = scrollbars === "vertical" || scrollbars === "both";
    const showHorizontal = scrollbars === "horizontal" || scrollbars === "both";
    const scrollableAxis = scrollbars === "vertical" ? "y" : scrollbars === "horizontal" ? "x" : "both";
    const isScrollable = useIsScrollable(internalViewportRef, scrollableAxis);

    const regionName = ariaLabel
      ? { "aria-label": ariaLabel }
      : ariaLabelledBy
        ? { "aria-labelledby": ariaLabelledBy }
        : undefined;
    const regionProps = isScrollable
      ? { tabIndex: 0, ...(regionName ? { role: "region" as const, ...regionName } : {}) }
      : {};

    return (
      <ScrollAreaPrimitive.Root
        ref={ref}
        {...props}
        dir={dir}
        type={scrollbarVisibility}
        scrollHideDelay={scrollHideDelay}
        id={id}
        data-testid={dataTestId}
        className={cx(styles.root, variant === "ghost" ? styles.ghost : styles.bordered, className)}
        style={maxHeight === undefined ? style : { maxBlockSize: maxHeight, ...style }}
      >
        <ScrollAreaPrimitive.Viewport
          ref={mergeRefs(internalViewportRef, viewportRef)}
          className={cx(styles.viewport, overscrollBehavior === "contain" && styles.overscrollContain)}
          onScroll={onScroll}
          {...regionProps}
        >
          {children}
        </ScrollAreaPrimitive.Viewport>
        {showVertical && (
          <ScrollAreaPrimitive.Scrollbar
            orientation="vertical"
            className={cx(styles.scrollbar, sizeClass[size], toneClass[tone], showTrack && styles.showTrack)}
          >
            <ScrollAreaPrimitive.Thumb className={styles.thumb} />
          </ScrollAreaPrimitive.Scrollbar>
        )}
        {showHorizontal && (
          <ScrollAreaPrimitive.Scrollbar
            orientation="horizontal"
            className={cx(styles.scrollbar, sizeClass[size], toneClass[tone], showTrack && styles.showTrack)}
          >
            <ScrollAreaPrimitive.Thumb className={styles.thumb} />
          </ScrollAreaPrimitive.Scrollbar>
        )}
        <ScrollAreaPrimitive.Corner className={styles.corner} />
      </ScrollAreaPrimitive.Root>
    );
  },
);

ScrollArea.displayName = "ScrollArea";
