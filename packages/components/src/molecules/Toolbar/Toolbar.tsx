import { CaretDownIcon, CaretLeftIcon, CaretRightIcon, CaretUpIcon } from "@dbm-system/icons";
import { cx, mergeDefined, mergeRefs, useResolvedResponsiveValue, useScrollEdges } from "@dbm-system/utils";
import * as ToolbarPrimitive from "@radix-ui/react-toolbar";
import { createContext, forwardRef, useCallback, useContext, useEffect, useMemo, useRef } from "react";
import type { Ref } from "react";
import { Affix } from "../../atoms/Affix";
import { Button } from "../../atoms/Button";
import type { ButtonProps } from "../../atoms/Button";
import { ButtonGroupProvider, useButtonGroup } from "../../atoms/Button/buttonGroupContext";
import { Icon } from "../../atoms/Icon";
import { IconButton } from "../../atoms/IconButton";
import type { IconButtonProps } from "../../atoms/IconButton";
import { Spacer } from "../../atoms/Spacer";
import { TooltipProvider } from "../../atoms/Tooltip";
import { TooltipProviderPresenceContext } from "../../atoms/Tooltip/TooltipProviderContext";
import { ButtonGroup } from "../ButtonGroup";
import { ToggleGroup } from "../ToggleGroup";
import type { ToggleGroupItemProps, ToggleGroupProps } from "../ToggleGroup";
import styles from "./Toolbar.module.css";
import { useDirection } from "../../atoms/DirectionProvider";
import {
  applyOverflow,
  overflowPartProps,
  ToolbarOverflowContext,
  ToolbarOverflowMenu,
  useIsomorphicLayoutEffect,
  useOverflowEntry,
  type OverflowEntry,
  type OverflowRegistry,
} from "./ToolbarOverflow";
import type {
  ToolbarAlign,
  ToolbarDirection,
  ToolbarGroupProps,
  ToolbarItemProps,
  ToolbarLabels,
  ToolbarOrientation,
  ToolbarPinnedProps,
  ToolbarProps,
  ToolbarSeparatorProps,
  ToolbarSpacerProps,
  ToolbarToggleGroupProps,
} from "./Toolbar.types";

/** What the parts need to know about the bar they sit in. */
interface ToolbarContextValue {
  /** Whether the whole bar is disabled, so an item leaves the arrow-key order. */
  disabled: boolean;
  size: NonNullable<ToolbarProps["size"]>;
  rounded: boolean;
  orientation: ToolbarOrientation;
  dir: ToolbarDirection;
}

const ToolbarContext = createContext<ToolbarContextValue>({
  disabled: false,
  size: "md",
  rounded: false,
  orientation: "horizontal",
  dir: "ltr",
});

/** Whether the `Toolbar.ToggleGroup` an item sits in is disabled, so the item leaves the arrow-key order with it. */
const ToggleGroupDisabledContext = createContext(false);

const alignValues: ToolbarAlign[] = ["start", "center", "end"];

const defaultLabels: ToolbarLabels = { overflow: "More actions" };

/**
 * Scrolls a scrolling bar just far enough to show an item in full, clear of the edge fades. A browser scrolls a focused
 * element into view only when it is *completely* hidden, so an item that is only partly visible (cut off behind a fade)
 * stays cut off without this. Measured from bounding rectangles and applied with `scrollBy`, so it is the same in a
 * right-to-left bar (where `scrollLeft` counts the other way) and never scrolls the page, which `scrollIntoView` would.
 * The room to keep clear on each side is the bar's own `scroll-padding`, the width of a fade.
 */
function revealItem(bar: HTMLElement, item: HTMLElement, orientation: ToolbarOrientation): void {
  if (typeof bar.scrollBy !== "function") return;
  const behavior: ScrollBehavior = prefersReducedMotion() ? "auto" : "smooth";
  const box = bar.getBoundingClientRect();
  const rect = item.getBoundingClientRect();
  const style = getComputedStyle(bar);
  const pad = (value: string) => Number.parseFloat(value) || 0;
  if (orientation === "vertical") {
    const start = box.top + pad(style.scrollPaddingTop);
    const end = box.bottom - pad(style.scrollPaddingBottom);
    if (rect.top < start) bar.scrollBy({ top: rect.top - start, behavior });
    else if (rect.bottom > end) bar.scrollBy({ top: rect.bottom - end, behavior });
    return;
  }
  const start = box.left + pad(style.scrollPaddingLeft);
  const end = box.right - pad(style.scrollPaddingRight);
  if (rect.left < start) bar.scrollBy({ left: rect.left - start, behavior });
  else if (rect.right > end) bar.scrollBy({ left: rect.right - end, behavior });
}

function prefersReducedMotion(): boolean {
  return typeof window !== "undefined" && Boolean(window.matchMedia?.("(prefers-reduced-motion: reduce)").matches);
}

/**
 * A bar of actions that is one tab stop: `Tab` moves focus into the toolbar and out again, and the arrow keys
 * (`Home` and `End` too) move between its items — left and right for a row, up and down for a column. Built on
 * Radix `Toolbar`, it is a `role="toolbar"` with a name, and it hands its `variant`, `size`, `rounded` and
 * `disabled` to the `Toolbar.Button`s and `Toolbar.IconButton`s inside it as defaults — an item's own prop still wins.
 *
 * Parts: `Toolbar.Button`, `Toolbar.IconButton` (the `Button` and `IconButton` atoms, in the arrow-key order),
 * `Toolbar.ToggleGroup` with `Toolbar.ToggleItem` (a single or multiple choice, in the order), `Toolbar.Item` (any other
 * single focusable element: a `Select`, a menu or popover trigger, a link), `Toolbar.Group` (a named set of items,
 * `attached` to fuse them), `Toolbar.Separator` and `Toolbar.Spacer` (pushes what follows to the far end). A pressed state
 * on an icon button (`pressed`) makes it a toggle, and `tooltip` on one shows its name on hover and focus. Don't put a text
 * field in a toolbar: it needs the arrow keys itself.
 *
 * When there are more items than fit, the bar scrolls (`overflow`, the default; `wrap` wraps them, `visible` lets them spill);
 * `sticky` keeps it at the top of the page.
 *
 * @example
 * ```tsx
 * <Toolbar aria-label="Text formatting">
 *   <Toolbar.Group aria-label="Style" attached>
 *     <Toolbar.IconButton icon={TextBIcon} aria-label="Bold" tooltip />
 *     <Toolbar.IconButton icon={TextItalicIcon} aria-label="Italic" tooltip />
 *   </Toolbar.Group>
 *   <Toolbar.Separator />
 *   <Toolbar.ToggleGroup aria-label="Alignment" defaultValue="left">
 *     <Toolbar.ToggleItem value="left" icon={TextAlignLeftIcon} aria-label="Left" />
 *     <Toolbar.ToggleItem value="center" icon={TextAlignCenterIcon} aria-label="Centre" />
 *   </Toolbar.ToggleGroup>
 *   <Toolbar.Spacer />
 *   <Toolbar.Button variant="primary">Save</Toolbar.Button>
 * </Toolbar>
 * ```
 */
const ToolbarRoot = forwardRef<HTMLDivElement, ToolbarProps>(
  (
    {
      children,
      surface = "ghost",
      variant = "ghost",
      size = "md",
      rounded = false,
      disabled = false,
      orientation = "horizontal",
      dir: dirProp,
      loop = true,
      fullWidth = false,
      align = "start",
      overflow = "scroll",
      sticky = false,
      stickyOffset = 0,
      scrollContainerRef,
      labels: labelOverrides,
      className,
      style,
      onFocus,
      "aria-label": ariaLabel,
      "aria-labelledby": ariaLabelledBy,
      ...props
    },
    ref,
  ) => {
    const dir = useDirection(dirProp);
    const resolvedOrientation = useResolvedResponsiveValue<ToolbarOrientation>(orientation, "horizontal");
    // The "more" menu is for a row: a column has no width to run out of, so it scrolls as it would without it.
    const isMenu = overflow === "menu" && resolvedOrientation === "horizontal";
    const isScroller = overflow === "scroll" || (overflow === "menu" && !isMenu);
    const labels: ToolbarLabels = mergeDefined(defaultLabels, labelOverrides);
    const barRef = useRef<HTMLDivElement>(null);
    const registry = useRef<OverflowRegistry>(new Map());
    const overflowContext = useMemo(
      () =>
        isMenu
          ? {
              register: (node: HTMLElement, entry: () => OverflowEntry) => {
                registry.current.set(node, entry);
                return () => {
                  registry.current.delete(node);
                };
              },
            }
          : null,
      [isMenu],
    );
    const { overflowStart, overflowEnd } = useScrollEdges(barRef, resolvedOrientation, { enabled: isScroller });

    // Lay the bar out for the room it has, on every commit (the items or their sizes may have changed) and whenever the
    // bar's own width changes or focus moves off an item that was kept visible because it had it.
    useIsomorphicLayoutEffect(() => {
      if (isMenu && barRef.current) applyOverflow(barRef.current);
    });
    useEffect(() => {
      const bar = barRef.current;
      if (!isMenu || !bar) return undefined;
      const relayout = () => applyOverflow(bar);
      // The bar is only as wide as what it shows (up to its container), so growing the container changes the container
      // and not the bar: it has to be watched too, or items that were hidden would never come back.
      const observer = typeof ResizeObserver !== "undefined" ? new ResizeObserver(relayout) : null;
      observer?.observe(bar);
      if (bar.parentElement) observer?.observe(bar.parentElement);
      bar.addEventListener("focusout", relayout);
      return () => {
        observer?.disconnect();
        bar.removeEventListener("focusout", relayout);
      };
    }, [isMenu]);

    const hasWarnedNoAccessibleNameRef = useRef(false);
    const hasWarnedVerticalMenuRef = useRef(false);
    if (process.env.NODE_ENV !== "production") {
      if (overflow === "menu" && !isMenu && !hasWarnedVerticalMenuRef.current) {
        hasWarnedVerticalMenuRef.current = true;
        console.warn(
          '`Toolbar` overflow="menu" is for a horizontal bar: a vertical one has no width to run out of, so it scrolls instead.',
        );
      }
      if (!ariaLabel && !ariaLabelledBy && !hasWarnedNoAccessibleNameRef.current) {
        hasWarnedNoAccessibleNameRef.current = true;
        console.warn(
          "Toolbar: no accessible name — pass `aria-label`, or `aria-labelledby` pointing at a visible label, so assistive tech can say what the toolbar is for.",
        );
      }
    }

    // A toolbar inside a `ButtonGroup` (or the reverse) keeps what the outer one set for whatever this one leaves
    // out, and a disabled outer group disables this one's items too — the same merge `ButtonGroup` does.
    const parent = useButtonGroup();
    const parentDisabled = parent?.disabled;
    const buttonSettings = useMemo(
      () => ({
        variant,
        size,
        rounded: rounded || (parent?.rounded ?? false),
        disabled: disabled || parentDisabled,
      }),
      [variant, size, rounded, parent?.rounded, disabled, parentDisabled],
    );
    const toolbarSettings = useMemo<ToolbarContextValue>(
      () => ({
        disabled: Boolean(buttonSettings.disabled),
        size,
        rounded: Boolean(buttonSettings.rounded),
        orientation: resolvedOrientation,
        dir,
      }),
      [buttonSettings.disabled, buttonSettings.rounded, size, resolvedOrientation, dir],
    );

    // Scrolling a bar by a button moves it most of its own length, the way a person pages a strip.
    const scrollBar = useCallback(
      (direction: 1 | -1) => {
        const bar = barRef.current;
        if (!bar || typeof bar.scrollBy !== "function") return;
        const behavior: ScrollBehavior = prefersReducedMotion() ? "auto" : "smooth";
        if (resolvedOrientation === "vertical") bar.scrollBy({ top: bar.clientHeight * 0.75 * direction, behavior });
        else bar.scrollBy({ left: bar.clientWidth * 0.75 * direction * (dir === "rtl" ? -1 : 1), behavior });
      },
      [resolvedOrientation, dir],
    );

    // What the bar looks like: on the bar itself, or, when it scrolls, on the frame around it (the frame is the box the
    // fades and buttons sit inside, so it has to be the one with the surface).
    const surfaceClasses = cx(
      sticky && styles.sticky,
      surface === "outlined" && styles.outlined,
      surface === "filled" && styles.filled,
      rounded && styles.rounded,
      fullWidth && styles.fullWidth,
    );

    const bar = (
      <ToolbarPrimitive.Root
        ref={mergeRefs(ref, barRef)}
        {...props}
        orientation={resolvedOrientation}
        dir={dir}
        loop={loop}
        // Applied after `{...props}` so a same-named consumer prop can never replace them
        // (05-component-api-conventions.md §3).
        onFocus={(event) => {
          onFocus?.(event);
          // Only an item inside the bar (a portaled `Select` list bubbles its focus through React too), and after the
          // browser has done its own scrolling, which only happens for an item that is completely hidden.
          const target = event.target as HTMLElement;
          const bar = barRef.current;
          if (!isScroller || !bar || !bar.contains(target)) return;
          requestAnimationFrame(() => {
            if (bar.isConnected && bar.contains(document.activeElement)) revealItem(bar, document.activeElement as HTMLElement, resolvedOrientation);
          });
        }}
        role="toolbar"
        aria-orientation={resolvedOrientation}
        aria-label={ariaLabel}
        aria-labelledby={ariaLabelledBy}
        data-orientation={resolvedOrientation}
        data-size={size}
        data-align={alignValues.includes(align) ? align : "start"}
        className={cx(
          styles.root,
          surface === "ghost" && styles.ghost,
          isScroller ? styles.scroller : surfaceClasses,
          overflow === "wrap" && styles.wrap,
          isMenu && styles.collapse,
          !isScroller && className,
        )}
        style={isScroller ? undefined : style}
      >
        {children}
        {isMenu && (
          <ToolbarOverflowMenu
            barRef={barRef}
            registry={registry}
            label={labels.overflow}
            size={size}
            variant={variant}
            rounded={Boolean(buttonSettings.rounded)}
            disabled={Boolean(buttonSettings.disabled)}
            dir={dir}
          />
        )}
      </ToolbarPrimitive.Root>
    );

    const StartIcon = resolvedOrientation === "vertical" ? CaretUpIcon : dir === "rtl" ? CaretRightIcon : CaretLeftIcon;
    const EndIcon = resolvedOrientation === "vertical" ? CaretDownIcon : dir === "rtl" ? CaretLeftIcon : CaretRightIcon;

    const content = isScroller ? (
      <div
        // `className` and `style` go on the outermost box, so a margin or a width behaves the same whatever `overflow` is;
        // `ref`, `id`, `data-testid` and the `aria-*` props stay on the toolbar element itself.
        className={cx(styles.frame, surfaceClasses, className)}
        style={style}
        data-orientation={resolvedOrientation}
        data-surface={surface}
        data-overflow-start={overflowStart}
        data-overflow-end={overflowEnd}
        // The frame is the outermost element, so a sticky bar sticks as one box, fades and buttons with it.
        dir={dir}
      >
        {/* The buttons are for a pointer: the arrow keys already move focus along the bar and the bar scrolls the
            focused item into view (`onFocus` above), so they are out of the tab order and hidden from assistive tech, and a press on one
            never takes focus (which would otherwise be lost when it disappears at the end). */}
        <button
          type="button"
          tabIndex={-1}
          aria-hidden="true"
          className={cx(styles.scrollButton, styles.scrollButtonStart)}
          onMouseDown={(event) => event.preventDefault()}
          onClick={() => {
            if (overflowStart) scrollBar(-1);
          }}
        >
          <Icon icon={StartIcon} size="sm" />
        </button>
        {bar}
        <button
          type="button"
          tabIndex={-1}
          aria-hidden="true"
          className={cx(styles.scrollButton, styles.scrollButtonEnd)}
          onMouseDown={(event) => event.preventDefault()}
          onClick={() => {
            if (overflowEnd) scrollBar(1);
          }}
        >
          <Icon icon={EndIcon} size="sm" />
        </button>
      </div>
    ) : (
      bar
    );

    const stuckOrPlain = sticky ? (
      <Affix asChild offset={stickyOffset} scrollContainerRef={scrollContainerRef}>
        {content}
      </Affix>
    ) : (
      content
    );

    // The tooltips of a bar's icon buttons share one provider, so moving from one to the next opens the next at once
    // instead of waiting the full delay again. An app's own `TooltipProvider` is left in charge when there is one; the
    // delays here are the ones a standalone `Tooltip` has.
    const hasAmbientTooltipProvider = useContext(TooltipProviderPresenceContext);

    return (
      <ToolbarContext.Provider value={toolbarSettings}>
        <ToolbarOverflowContext.Provider value={overflowContext}>
          <ButtonGroupProvider value={buttonSettings}>
            {hasAmbientTooltipProvider ? (
              stuckOrPlain
            ) : (
              <TooltipProvider delayDuration={700} skipDelayDuration={300}>
                {stuckOrPlain}
              </TooltipProvider>
            )}
          </ButtonGroupProvider>
        </ToolbarOverflowContext.Provider>
      </ToolbarContext.Provider>
    );
  },
);
ToolbarRoot.displayName = "Toolbar";

/**
 * A `Button` in the toolbar's arrow-key order. Takes every `Button` prop; its `variant`, `size`, `rounded` and
 * `disabled` default to the toolbar's.
 */
const ToolbarButton = forwardRef<HTMLButtonElement, ButtonProps & ToolbarPinnedProps>(({ pinned = false, ...props }, ref) => {
  const toolbar = useContext(ToolbarContext);
  const overflow = useContext(ToolbarOverflowContext);
  const disabled = Boolean(props.disabled) || toolbar.disabled || Boolean(props.isLoading);
  const nodeRef = useRef<HTMLButtonElement | null>(null);
  const mergedRef = useMemo(() => mergeRefs(ref, nodeRef), [ref]);
  useOverflowEntry(nodeRef, () => ({
    kind: "button",
    label: props.children,
    icon: props.leadingIcon,
    disabled,
    danger: props.variant === "destructive",
  }));
  return (
    <ToolbarPrimitive.Button asChild disabled={disabled}>
      <Button ref={mergedRef} {...props} {...overflowPartProps(overflow, "button", pinned)} />
    </ToolbarPrimitive.Button>
  );
});
ToolbarButton.displayName = "Toolbar.Button";

/**
 * An `IconButton` in the toolbar's arrow-key order. Takes every `IconButton` prop, including `pressed` for a toggle
 * and `tooltip` for a hover and focus label; its `variant`, `size`, `rounded` and `disabled` default to the toolbar's.
 */
const ToolbarIconButton = forwardRef<HTMLButtonElement, IconButtonProps & ToolbarPinnedProps>(({ pinned = false, ...props }, ref) => {
  const toolbar = useContext(ToolbarContext);
  const overflow = useContext(ToolbarOverflowContext);
  const disabled = Boolean(props.disabled) || toolbar.disabled || Boolean(props.isLoading);
  const nodeRef = useRef<HTMLButtonElement | null>(null);
  const mergedRef = useMemo(() => mergeRefs(ref, nodeRef), [ref]);
  useOverflowEntry(nodeRef, () => ({
    kind: "icon-button",
    label: String(props["aria-label"] ?? ""),
    icon: props.icon,
    disabled,
    danger: props.variant === "destructive",
    pressed: props.pressed,
  }));
  return (
    <ToolbarPrimitive.Button asChild disabled={disabled}>
      <IconButton ref={mergedRef} {...props} {...overflowPartProps(overflow, "icon-button", pinned)} />
    </ToolbarPrimitive.Button>
  );
});
ToolbarIconButton.displayName = "Toolbar.IconButton";

/**
 * Puts any one focusable element — a `Select`, a menu or popover trigger, a link, a `Button` wrapped in something — into
 * the toolbar's arrow-key order. It renders its only child, handing it the roving tab index and key handling.
 */
const ToolbarItem = forwardRef<HTMLElement, ToolbarItemProps>(({ children, disabled = false }, ref) => {
  const toolbar = useContext(ToolbarContext);
  const overflow = useContext(ToolbarOverflowContext);
  return (
    <ToolbarPrimitive.Button
      asChild
      ref={ref as Ref<HTMLButtonElement>}
      disabled={disabled || toolbar.disabled}
      // An arbitrary element can't be drawn as a menu item, so it is always kept on the bar.
      {...overflowPartProps(overflow, "item", true)}
    >
      {children}
    </ToolbarPrimitive.Button>
  );
});
ToolbarItem.displayName = "Toolbar.Item";

/**
 * A named `role="group"` of related items inside the toolbar, laid out as one cluster; `attached` fuses its buttons into a
 * segmented control (it then renders a `ButtonGroup`, whose settings it shares with the bar).
 */
const ToolbarGroup = forwardRef<HTMLDivElement, ToolbarGroupProps>(
  ({ children, attached = false, pinned = false, className, "aria-label": ariaLabel, "aria-labelledby": ariaLabelledBy, ...props }, ref) => {
    const toolbar = useContext(ToolbarContext);
    const overflow = useContext(ToolbarOverflowContext);
    const nodeRef = useRef<HTMLDivElement | null>(null);
    const mergedRef = useMemo(() => mergeRefs(ref, nodeRef), [ref]);
    useOverflowEntry(nodeRef, () => ({ kind: "group", label: ariaLabel }));
    const hasWarnedNoAccessibleNameRef = useRef(false);
    if (process.env.NODE_ENV !== "production") {
      // An attached group is a `ButtonGroup`, which warns about a missing name itself.
      if (!attached && !ariaLabel && !ariaLabelledBy && !hasWarnedNoAccessibleNameRef.current) {
        hasWarnedNoAccessibleNameRef.current = true;
        console.warn(
          "Toolbar.Group: no accessible name — pass `aria-label`, or `aria-labelledby` pointing at a visible label, so assistive tech can say what the group is for.",
        );
      }
    }
    if (attached) {
      return (
        <ButtonGroup
          ref={mergedRef}
          {...props}
          {...overflowPartProps(overflow, "group", pinned)}
          orientation={toolbar.orientation}
          aria-label={ariaLabel}
          aria-labelledby={ariaLabelledBy}
          className={className}
        >
          {children}
        </ButtonGroup>
      );
    }
    return (
      <div
        ref={mergedRef}
        {...props}
        {...overflowPartProps(overflow, "group", pinned)}
        role="group"
        aria-label={ariaLabel}
        aria-labelledby={ariaLabelledBy}
        className={cx(styles.group, className)}
      >
        {children}
      </div>
    );
  },
);
ToolbarGroup.displayName = "Toolbar.Group";

/**
 * A single or multiple choice in the toolbar's arrow-key order — a `ToggleGroup` with its own roving focus turned off, so
 * the toolbar stays one tab stop and its arrow keys run straight through the group's items (`Toolbar.ToggleItem`). Single
 * is a `radiogroup` (an arrow key chooses the item it lands on, as in a native radio group); multiple is a plain `group`
 * of independent toggles. Takes every `ToggleGroup` prop except `loop` and `rovingFocus`; its `size`, `rounded`,
 * `disabled`, `orientation` and `dir` default to the toolbar's, and its `variant` to `subtle` (borderless, to sit quietly
 * among the bar's ghost items) rather than `ToggleGroup`'s own `outlined`.
 */
const ToolbarToggleGroup = forwardRef<HTMLDivElement, ToolbarToggleGroupProps>(({ pinned = false, ...props }, ref) => {
  const toolbar = useContext(ToolbarContext);
  const overflow = useContext(ToolbarOverflowContext);
  const group = props as ToggleGroupProps;
  // Disabled by the bar or by the group: a group's own `disabled={false}` can't undo the bar's.
  const disabled = Boolean(group.disabled) || toolbar.disabled;
  const nodeRef = useRef<HTMLDivElement | null>(null);
  const mergedRef = useMemo(() => mergeRefs(ref, nodeRef), [ref]);
  useOverflowEntry(nodeRef, () => ({
    kind: "toggle-group",
    label: group["aria-label"],
    multiple: group.type === "multiple",
    disabled,
  }));
  return (
    <ToggleGroupDisabledContext.Provider value={disabled}>
      <ToggleGroup
        ref={mergedRef}
        {...group}
        {...overflowPartProps(overflow, "toggle-group", pinned)}
        rovingFocus={false}
        variant={group.variant ?? "subtle"}
        size={group.size ?? toolbar.size}
        rounded={group.rounded ?? toolbar.rounded}
        orientation={group.orientation ?? toolbar.orientation}
        dir={group.dir ?? toolbar.dir}
        disabled={disabled}
      />
    </ToggleGroupDisabledContext.Provider>
  );
});
ToolbarToggleGroup.displayName = "Toolbar.ToggleGroup";

/** One choice in a `Toolbar.ToggleGroup`, in the toolbar's arrow-key order. Takes every `ToggleGroup.Item` prop. */
const ToolbarToggleItem = forwardRef<HTMLButtonElement, ToggleGroupItemProps>((props, ref) => {
  const toolbar = useContext(ToolbarContext);
  const groupDisabled = useContext(ToggleGroupDisabledContext);
  const disabled = Boolean(props.disabled) || groupDisabled || toolbar.disabled;
  const nodeRef = useRef<HTMLButtonElement | null>(null);
  const mergedRef = useMemo(() => mergeRefs(ref, nodeRef), [ref]);
  useOverflowEntry(nodeRef, () => ({
    kind: "toggle-item",
    value: props.value,
    label: props.children ?? props["aria-label"],
    icon: props.icon,
    disabled,
  }));
  return (
    <ToolbarPrimitive.Button asChild disabled={disabled}>
      <ToggleGroup.Item ref={mergedRef} {...props} />
    </ToolbarPrimitive.Button>
  );
});
ToolbarToggleItem.displayName = "Toolbar.ToggleItem";

/** A line between items, across the toolbar's own direction (a vertical rule in a row). Announced as a separator. */
const ToolbarSeparator = forwardRef<HTMLDivElement, ToolbarSeparatorProps>(({ className, ...props }, ref) => {
  const toolbar = useContext(ToolbarContext);
  const overflow = useContext(ToolbarOverflowContext);
  // Across the bar's own direction. Radix computes this too, but before spreading whatever else it is given, so a
  // consumer's `role` or `aria-orientation` would replace it; set here, after `props`, they can't
  // (05-component-api-conventions.md §3). A horizontal separator leaves `aria-orientation` off, as it is the ARIA default.
  const orientation: ToolbarOrientation = toolbar.orientation === "vertical" ? "horizontal" : "vertical";
  return (
    <ToolbarPrimitive.Separator
      ref={ref}
      {...props}
      {...overflowPartProps(overflow, "separator")}
      role="separator"
      aria-orientation={orientation === "vertical" ? "vertical" : undefined}
      data-orientation={orientation}
      className={cx(styles.separator, className)}
    />
  );
});
ToolbarSeparator.displayName = "Toolbar.Separator";

/** Flexible empty space that pushes whatever follows it to the far end of the toolbar. Hidden from assistive tech. */
const ToolbarSpacer = forwardRef<HTMLDivElement, ToolbarSpacerProps>((props, ref) => {
  const overflow = useContext(ToolbarOverflowContext);
  return <Spacer ref={ref} {...props} {...overflowPartProps(overflow, "spacer")} />;
});
ToolbarSpacer.displayName = "Toolbar.Spacer";

type ToolbarComponent = typeof ToolbarRoot & {
  Button: typeof ToolbarButton;
  IconButton: typeof ToolbarIconButton;
  Item: typeof ToolbarItem;
  Group: typeof ToolbarGroup;
  ToggleGroup: typeof ToolbarToggleGroup;
  ToggleItem: typeof ToolbarToggleItem;
  Separator: typeof ToolbarSeparator;
  Spacer: typeof ToolbarSpacer;
};

export const Toolbar: ToolbarComponent = Object.assign(ToolbarRoot, {
  Button: ToolbarButton,
  IconButton: ToolbarIconButton,
  Item: ToolbarItem,
  Group: ToolbarGroup,
  ToggleGroup: ToolbarToggleGroup,
  ToggleItem: ToolbarToggleItem,
  Separator: ToolbarSeparator,
  Spacer: ToolbarSpacer,
});

